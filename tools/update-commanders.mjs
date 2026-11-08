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

const seen = new Set();
// [name, decks, Scryfall card id, image version]: the art is built from the id, no Scryfall request needed
const list = views.filter(v => v.name && !seen.has(v.name) && seen.add(v.name))
  .map(v => [v.name, v.num_decks || 0, v.id || "", v.image_version || ""]);
if (list.length < 1000) throw new Error(`Only ${list.length} commanders found: not written.`);
fs.writeFileSync(new URL("../commanders.json", import.meta.url), JSON.stringify({ updated: new Date().toISOString().slice(0, 10), list }));
console.log(`${list.length} commanders written.`);
