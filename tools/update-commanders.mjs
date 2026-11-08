// Writes commanders.json: every commander on EDHREC, most played first (decks of the past two years).
// Run once a month (the GitHub Action does this): node tools/update-commanders.mjs
import fs from "fs";

const base = "https://json.edhrec.com/pages/";
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function page(path) {
  for (let tries = 0; ; tries++) {
    const res = await fetch(base + path, { headers: { "User-Agent": "SpellSeekr commander list (monthly)" } });
    if (res.ok) return res.json();
    if (tries >= 3) throw new Error(`EDHREC ${path}: ${res.status}`);
    await sleep(2000);
  }
}

const first = await page("commanders/year.json");
let views = first.container.json_dict.cardlists[0].cardviews;
let more = first.container.json_dict.cardlists[0].more;
while (more) {
  await sleep(300);   // gentle: one page at a time
  const next = await page(more);
  views = views.concat(next.cardviews || []);
  more = next.more;
}

// The color identity of every card that can lead a deck, from Scryfall (about 25 pages, once a month).
const identity = new Map(), image = new Map();
let url = "https://api.scryfall.com/cards/search?" + new URLSearchParams({ q: "is:commander OR t:background", unique: "cards" });
while (url) {
  await sleep(200);   // Scryfall asks for at most 10 requests a second
  const res = await fetch(url, { headers: { "User-Agent": "SpellSeekr/1.0 (monthly commander list)", Accept: "application/json" } });
  if (!res.ok) throw new Error(`Scryfall: ${res.status}`);
  const body = await res.json();
  for (const c of body.data) {
    const ci = "wubrg".split("").filter(x => c.color_identity.includes(x.toUpperCase())).join("");
    identity.set(c.name, ci);
    identity.set(c.name.split(" // ")[0], ci);
    // the image version is the number after "?" in Scryfall's image links
    const large = (c.image_uris || (c.card_faces && c.card_faces[0].image_uris) || {}).large || "";
    image.set(c.name.split(" // ")[0], [c.id, (large.match(/\?(\d+)/) || [])[1] || ""]);
  }
  url = body.has_more ? body.next_page : "";
}
// a pair has the colors of both; "?" when a name isn't known to Scryfall
const colorsOf = name => {
  const parts = name.split(" // ");
  if (parts.length > 1 && identity.has(name)) return identity.get(name);   // one card with two faces
  if (!parts.every(n => identity.has(n))) return "?";
  const all = parts.map(n => identity.get(n)).join("");
  return "wubrg".split("").filter(x => all.includes(x)).join("");
};

const secondCard = name => {
  const [, second] = name.split(" // ");
  if (!second || identity.has(name)) return [];   // no pair, or one card with two faces
  return image.get(second) || [];
};

const seen = new Set();
// [name, decks, Scryfall card id, image version, colors, second card id, its image version]:
// the art is built from the ids, no Scryfall request needed. The second card is only there for a pair.
const list = views.filter(v => v.name && !seen.has(v.name) && seen.add(v.name))
  .map(v => [v.name, v.num_decks || 0, v.id || "", v.image_version || "", colorsOf(v.name), ...secondCard(v.name)]);
const unknown = list.filter(c => c[4] === "?");
if (unknown.length) console.log(`${unknown.length} without colors, e.g. ${unknown.slice(0, 5).map(c => c[0]).join("; ")}`);
if (list.length < 1000) throw new Error(`Only ${list.length} commanders found: not written.`);
fs.writeFileSync(new URL("../commanders.json", import.meta.url), JSON.stringify({ updated: new Date().toISOString().slice(0, 10), list }));
console.log(`${list.length} commanders written.`);
