// Scryfall Zoekhulp translator: turns an English sentence into Scryfall syntax with Claude.
// The Anthropic API key lives only here, as a Worker secret (ANTHROPIC_API_KEY).
// Friends get in with a shared access code (ACCESS_CODE secret); the page sends it with each request.
// Model, system prompt and output size are fixed here, so the key can't be used for anything else.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-5-5";   // fixed on purpose: never any other model
const MAX_SENTENCE = 300;            // characters
const ALLOWED_ORIGINS = ["https://michaelvanmeeteren.github.io", "http://localhost:8010"];

const SYSTEM_PROMPT = `You translate a search request for Magic: The Gathering cards into Scryfall search syntax.
The request is in English or Dutch. The user always builds Commander decks with paper cards.
The page adds "f:commander game:paper" itself: never add f: or game: yourself.

Reply with JSON only, no other text:
{"query": "<scryfall query>", "uitleg": "<one short sentence, in the language of the request, describing what the query finds>"}

Dutch words you will see: wit=white, blauw=blue, zwart=black, rood=red, groen=green, kleurloos=colorless,
wezens=creatures, draken=dragons, landen=lands, spreuken=instants and sorceries, goedkoop=cheap,
"die ik als commander kan gebruiken" = is:commander, "kaarten trekken" = card draw, "hoogstens"/"of minder" = <=,
"minder dan"/"onder" = <, "minstens"/"of meer" = >=, "meest gespeeld" = order:edhrec, "goedkoopste eerst" = order:eur dir:asc.

Syntax:
- Color identity (default for any colors the user names): id<=bgw, id<=r, id<=esper
- Exact color identity, always when the user asks for commanders (is:commander) in named colors: id=rg, id=bgw
- Card color (only when the user explicitly asks for the card's own color): c:r, c=g, c:m, c:c
- Color shorthand: w=white, u=blue, b=black, r=red, g=green.
  "g/w/b", "gwb", "in green white black" and "abzan" all mean id<=bgw. "mono red" means id<=r.
- Type: t:creature, t:legendary, t:dragon, -t:basic
- Rules text: o:"draw a card", o:damage
- Keyword: kw:flying, kw:trample
- Function tags: otag:removal, function:ramp, otag:draw, otag:tutor, otag:counterspell, otag:board-wipe
- Mana value: mv<3, mv=2, mv<=5
- Power/toughness: pow>=4, tou<=2, pow>tou
- Rarity: r:c, r:u, r:r, r:m
- Possible commanders: is:commander
- Price, always in euro: eur<2, eur<=5
- Set: s:mh3; year: year>=2020
- Sort: order:edhrec (most played in Commander decks first), order:eur, order:mv, order:released; dir:asc or dir:desc
- Logic: space = AND, OR between terms, parentheses for groups, - for NOT

Rules:
- Use only real Scryfall syntax. Never invent filters.
- "less than or equal to" / "or less" / "at most" = <=, "under" / "less than" = <,
  "at least" / "or more" / "5+" = >=.
- "cheap" = eur<2 unless an amount is given. Prices are always in euro (eur), also when the user writes $ or dollar.
- "removal" = otag:removal, "ramp" = function:ramp, "card draw" = otag:draw. otag:card-draw does not exist.
- "most played" / "popular" / "by edhrec" = order:edhrec.
- Commanders in named colors get exactly those colors: "gruul commanders" = is:commander id=rg, not id<=rg.
  Cards for the deck itself keep id<=, because they may have fewer colors than the commander.
- If the request is ambiguous, pick the most likely meaning and say so in the explanation.
- If the request is not about finding Magic cards, reply with an empty query and say so in the explanation.

Examples (request => query):
creatures mana value less than or equal to 5 in g/w/b => t:creature mv<=5 id<=bgw
flying creatures under 3 mana in red => t:creature kw:flying mv<3 id<=r
cheap removal in b/g => otag:removal eur<2 id<=bg
dragons that can be my commander => is:commander t:dragon
gruul dragons I can use as my commander => is:commander t:dragon id=rg
blue instants that draw a card => t:instant o:"draw a card" id<=u
lands for w/u that make any color, no basics => t:land o:"any color" -t:basic id<=wu
green creatures with 5+ power for 4 mana or less, cheapest first => t:creature pow>=5 mv<=4 id<=g order:eur dir:asc
ramp for 2 mana or less in green => function:ramp mv<=2 id<=g
burn spells under 1 euro in mono red => (t:instant OR t:sorcery) o:damage eur<1 id<=r
ik wil alle gruul draken zien die ik als commander kan gebruiken => is:commander t:dragon id=rg
goedkope removal in zwart groen => otag:removal eur<2 id<=bg
vliegende wezens van hoogstens 3 mana in wit => t:creature kw:flying mv<=3 id<=w`;

const ANSWER_SCHEMA = {
  type: "object",
  properties: { query: { type: "string" }, uitleg: { type: "string" } },
  required: ["query", "uitleg"],
  additionalProperties: false
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const reply = (status, body) => new Response(JSON.stringify(body), {
      status, headers: { ...cors, "content-type": "application/json" }
    });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST" || new URL(request.url).pathname !== "/translate") {
      return reply(404, { error: "Not found." });
    }

    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.LIMITER.limit({ key: ip });
    if (!success) return reply(429, { error: "Too many translations, try again in a minute." });

    let input;
    try { input = await request.json(); } catch { return reply(400, { error: "Bad request." }); }
    const code = typeof input.code === "string" ? input.code : "";
    const zin = typeof input.zin === "string" ? input.zin.trim() : "";

    if (!env.ACCESS_CODE || !(await sameText(code, env.ACCESS_CODE))) {
      return reply(401, { error: "Access code invalid. Check it in Settings." });
    }
    if (!zin) return reply(400, { error: "Type a search first." });
    if (zin.length > MAX_SENTENCE) return reply(400, { error: `Keep the search under ${MAX_SENTENCE} characters.` });

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    let response;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,   // room for a little thinking before the short JSON answer
        system: SYSTEM_PROMPT,
        output_config: { effort: "low", format: { type: "json_schema", schema: ANSWER_SCHEMA } },
        messages: [{ role: "user", content: zin }]
      });
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) return reply(502, { error: "The translator's API key doesn't work. Tell the owner of this page." });
      if (error instanceof Anthropic.PermissionDeniedError) return reply(502, { error: "The translator's API key isn't allowed to do this. Tell the owner of this page." });
      if (error instanceof Anthropic.RateLimitError) return reply(429, { error: "Too many requests, try again in a minute." });
      if (error instanceof Anthropic.APIError) return reply(502, { error: "Claude is temporarily unavailable." });
      return reply(502, { error: "Can't reach Claude right now." });
    }

    if (response.stop_reason === "refusal") return reply(422, { error: "Claude declined to translate this request." });
    const text = response.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
    try {
      const answer = JSON.parse(text);
      return reply(200, { query: String(answer.query || "").trim(), uitleg: String(answer.uitleg || "") });
    } catch {
      return reply(502, { error: "Claude's answer wasn't the expected JSON." });
    }
  }
};

// Compares two strings without leaking how many characters matched.
async function sameText(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}
