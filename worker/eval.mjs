// Test bench for the translator: sends each question to the live Worker and checks the query it gets back.
// Usage, in the worker folder (PowerShell):  $env:ACCESS_CODE="<code>"; node eval.mjs        all cases
//                                            node eval.mjs 12 15                              only cases 12 to 15
// Costs a fraction of a cent per case. Waits 3.2 s between questions to stay under the Worker's 20-per-minute limit.
//
// Per case:  any   every inner list needs at least one match in the query (lower-cased substring)
//            none  substrings that must not appear
//            id    expected color identity filter, e.g. "<=wub" or "=rg" (letter order doesn't matter)
//            min   minimum number of cards Scryfall must find (default 1)
const WORKER = "https://scryfall-zoekhulp.michaelvanmeeteren.workers.dev/translate";
const ORIGIN = "https://michaelvanmeeteren.github.io";

const CASES = [
  // colors and commanders
  { zin: "mono black commanders", any: [["is:commander"]], id: "=b" },
  { zin: "five color commanders", any: [["is:commander"]], id: "=wubrg" },
  { zin: "four color commanders without blue", any: [["is:commander"]], id: "=wbrg" },
  { zin: "temur commanders", any: [["is:commander"]], id: "=urg" },
  { zin: "goblin commanders", any: [["is:commander"], ["t:goblin"]] },
  { zin: "planeswalkers that can be my commander", any: [["t:planeswalker"], ["is:commander"]] },
  { zin: "commanders that care about +1/+1 counters in simic", any: [["is:commander"], ["counters"]], id: "=ug" },
  { zin: "esper card draw", any: [["otag:draw", "otag:card-advantage", "otag:draw-engine"]], id: "<=wub" },
  { zin: "colorless artifacts under 2 mana", any: [["t:artifact"], ["mv<2", "mv<=1"], ["id:c", "id=c", "c:c", "id<=c", "c=c"]] },
  { zin: "nonbasic lands for mono red", any: [["t:land"], ["-t:basic"]], id: "<=r" },
  // types and numbers
  { zin: "equipment that gives haste", any: [["t:equipment"], ["haste"]] },
  { zin: "auras in white under 3 euro", any: [["t:aura"], ["eur<3"]], id: "<=w" },
  { zin: "sagas", any: [["t:saga"]] },
  { zin: "2-drops in green", any: [["mv=2"]], id: "<=g" },
  { zin: "creatures with more toughness than power", any: [["tou>pow", "pow<tou"]] },
  { zin: "creatures with deathtouch and reach", any: [["kw:deathtouch"], ["kw:reach"]] },
  { zin: "flash creatures in blue", any: [["kw:flash"], ["t:creature"]], id: "<=u" },
  { zin: "elf lords", any: [["t:elf"], ["lord", "anthem"]] },
  // price and sorting
  { zin: "cards under 5 dollars in red", any: [["eur<5"]], none: ["usd"], id: "<=r" },
  { zin: "cards between 1 and 3 euro in black", any: [["eur>=1", "eur>1"], ["eur<=3", "eur<3"]], id: "<=b" },
  { zin: "most expensive commanders", any: [["is:commander"], ["order:eur", "order:usd"], ["dir:desc"]] },
  { zin: "newest dragons", any: [["t:dragon"], ["order:released"]] },
  { zin: "cheap tutors", any: [["otag:tutor"], ["eur<2"]] },
  // functions (Tagger)
  { zin: "counterspells in blue under 2 euro", any: [["otag:counterspell"], ["eur<2"]], id: "<=u" },
  { zin: "tutors that find creatures", any: [["tutor-creature"]], none: ["t:creature"] },
  { zin: "one sided board wipes", any: [["sweeper-one-sided"]] },
  { zin: "artifact removal in green", any: [["removal-artifact", "artifact-removal"]], id: "<=g" },
  { zin: "instant speed removal in white", any: [["t:instant"], ["removal"]], id: "<=w" },
  { zin: "free sac outlets", any: [["free-sacrifice-outlet", "free-sac-outlet"]] },
  { zin: "token doublers", any: [["token-doubler"]] },
  { zin: "clone effects in blue", any: [["otag:clone", "copy-permanent"]], id: "<=u" },
  { zin: "steal effects in red", any: [["control-changing", "threaten", "gain control", "exchange-control", "theft"]], id: "<=r" },
  { zin: "mill my opponents in dimir", any: [["mill"]], id: "<=ub" },
  { zin: "haste enablers", any: [["gives-haste"]] },
  { zin: "fog effects", any: [["otag:fog"]] },
  { zin: "pillowfort cards in white", any: [["pillowfort"]], id: "<=w" },
  { zin: "treasure synergy in jund", any: [["treasure"]], id: "<=brg" },
  { zin: "cost reducers for artifacts", any: [["cost-reducer-artifact"]] },
  { zin: "cards that untap my lands", any: [["untap"]] },
  // names, art, sets
  { zin: "show me Sol Ring", any: [["sol ring"]], none: ["otag:"] },
  { zin: "cards with art by Rebecca Guay", any: [["a:", "artist:"]] },
  { zin: "full art basic lands", any: [["is:full"], ["t:basic"], ["unique:prints", "unique:art"]], min: 100 },
  { zin: "green cards released in 2024", any: [["year=2024", "year:2024"], ["id<=g", "c:g", "c=g"]] },
  // Dutch
  { zin: "goedkope tegenspreuken in blauw", any: [["otag:counterspell"], ["eur<2"]], id: "<=u" },
  { zin: "kleurloze artefacten van hoogstens 2 mana", any: [["t:artifact"], ["mv<=2"]] },
  { zin: "elfen die mana maken in groen", any: [["t:elf"], ["mana-dork", "mana-producer", "add", "ramp"]], id: "<=g" },
  { zin: "draken met vliegen en haast in rood", any: [["t:dragon"], ["kw:flying"], ["kw:haste"]], id: "<=r" },
  { zin: "beste kaarten voor een golgari deck", any: [["order:edhrec"]], id: "<=bg" },
  // second round: indirect effects, prints, budget, formats
  { zin: "tutors for lands in green", any: [["tutor-land", "land-ramp"]], none: ["t:land"], id: "<=g" },
  { zin: "removal for enchantments in white", any: [["removal-enchantment", "enchantment-removal"]], id: "<=w" },
  { zin: "lands that make any color", any: [["t:land"], ["any color", "produces:wubrg"]] },
  { zin: "best ramp in green", any: [["ramp"], ["order:edhrec"]], id: "<=g" },
  { zin: "cards that give my team trample", any: [["trample"]], none: ["kw:trample"] },
  { zin: "cards that draw when a creature dies", any: [["death-trigger", "dies"], ["draw"]] },
  { zin: "showcase versions of Lightning Bolt", any: [["lightning bolt"], ["unique:prints", "unique:art"]] },
  { zin: "budget boros commander", any: [["is:commander"], ["eur<", "eur<="]], id: "=rw" },
  { zin: "spells with X in their cost in red", any: [["{x}", "m:x"]], id: "<=r" },
  { zin: "zombies that come back from the graveyard", any: [["t:zombie"], ["recursion-self"]] },
  { zin: "cards that give extra land drops", any: [["extra-land"]] },
  { zin: "cards banned in commander", any: [["banned:commander", "banned:edh"]] },
  { zin: "dinosaurs with power 6 or more", any: [["t:dinosaur"], ["pow>=6"]] },
  { zin: "cards with storm", any: [["kw:storm"]] },
  { zin: "graveyard hate artifacts", any: [["hate-graveyard", "graveyard-hate"], ["t:artifact"]] },
  { zin: "cards that make my creatures indestructible", any: [["indestructible"]] },
  { zin: "commanders voor een draken deck", any: [["is:commander"], ["dragon"]] },
  { zin: "goedkope board wipes", any: [["sweeper"], ["eur<2"]] },
  // combos (Commander Spellbook): the query is a list of exact card names
  { zin: "infinite combos in dimir", any: [['!"']], min: 5 },
  { zin: "combos with Sol Ring", any: [['!"sol ring"']], min: 5 }
];

const GROUPS = { azorius: "wu", dimir: "ub", rakdos: "br", gruul: "rg", selesnya: "gw", orzhov: "wb", izzet: "ur", golgari: "bg",
  boros: "rw", simic: "gu", bant: "gwu", esper: "wub", grixis: "ubr", jund: "brg", naya: "rgw", abzan: "wbg", jeskai: "urw",
  sultai: "bgu", mardu: "rwb", temur: "gur", colorless: "c" };
const norm = s => [...new Set((GROUPS[s] || s).split(""))].sort().join("");

function idFilter(query) {
  const m = query.toLowerCase().match(/(?:^|[\s(])(?:id|identity|ci)(<=|>=|=|:|<|>)([a-z]+)/);
  if (!m) return null;
  const op = m[1] === ":" ? "<=" : m[1];   // id: means "fits within", like <=
  return op + norm(m[2]);
}

async function count(query) {
  let full = query;
  if (!/(^|[\s(-])(f|format|legal|banned|restricted):/i.test(full)) full += " f:commander";
  if (!/(^|[\s(-])game:/i.test(full)) full += " game:paper";
  const res = await fetch("https://api.scryfall.com/cards/search?" + new URLSearchParams({ q: full }),
    { headers: { "User-Agent": "ScryfallZoekhulp-eval/1.0", Accept: "application/json" } });
  const body = await res.json();
  return { n: body.total_cards || 0, warn: (body.warnings || []).join(" ") };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const code = process.env.ACCESS_CODE;
if (!code) { console.error('Set the access code first: $env:ACCESS_CODE="<code>"'); process.exit(1); }
const from = Number(process.argv[2] || 1), to = Number(process.argv[3] || CASES.length);

let pass = 0, fail = 0;
for (let i = from; i <= to; i++) {
  const c = CASES[i - 1];
  const res = await fetch(WORKER, { method: "POST", headers: { "content-type": "application/json", Origin: ORIGIN }, body: JSON.stringify({ zin: c.zin, code }) });
  const body = await res.json();
  const query = body.query || "";
  const q = query.toLowerCase();
  const problems = [];
  if (!query) problems.push("no query: " + (body.error || body.uitleg));
  for (const group of c.any || []) if (!group.some(s => q.includes(s.toLowerCase()))) problems.push("missing " + group.join("|"));
  for (const s of c.none || []) if (q.includes(s.toLowerCase())) problems.push("has " + s);
  if (c.id) {
    const want = c.id.replace(/[a-z]+$/, x => norm(x));
    const got = idFilter(query);
    if (got !== want) problems.push(`id ${got || "none"} (want ${want})`);
  }
  if (query) {
    const { n, warn } = await count(query);
    if (n < (c.min ?? 1)) problems.push(`${n} cards`);
    if (warn) problems.push("scryfall: " + warn);
    if (!problems.length) pass++; else fail++;
    console.log(`${problems.length ? "FAIL" : "ok  "} ${String(i).padStart(2)} ${c.zin}\n       ${query}  [${n}]${problems.length ? "\n       -> " + problems.join("; ") : ""}`);
  } else {
    fail++;
    console.log(`FAIL ${String(i).padStart(2)} ${c.zin}\n       -> ${problems.join("; ")}`);
  }
  if (i < to) await sleep(3200);
}
console.log(`\n${pass} passed, ${fail} failed`);
