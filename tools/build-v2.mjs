// Builds v2.html: the live page (index.html) with the test design (v2/v2.css, v2/v2.js) laid over it.
// Run from the repository root: node tools/build-v2.mjs
import fs from "fs";
let s = fs.readFileSync("index.html", "utf8");
const once = (a, b) => { if (s.split(a).length !== 2) throw new Error("not once: " + a.slice(0, 60)); s = s.replace(a, () => b); };
once(`<html lang="en">`, `<html lang="en" class="v2">`);
once(`<title>SpellSeekr</title>`, `<title>SpellSeekr · design test</title>\n<meta name="robots" content="noindex">`);
once(`family=Noto+Sans+JP:wght@100..900&display=swap`, `family=Fraunces:opsz,wght@9..144,400..600&family=Figtree:wght@400..700&family=JetBrains+Mono:wght@400..600&display=swap`);
// the test has its own theme, paper unless dark was chosen here, so it never changes the live page's
once(`const t = JSON.parse(localStorage.getItem("szh.theme")); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; } catch { /* storage unavailable */ }`,
  `document.documentElement.dataset.theme = "light"; if (JSON.parse(localStorage.getItem("szh.v2theme")) === "dark") document.documentElement.dataset.theme = "dark"; } catch { /* storage unavailable */ }`);
once(`store.set("theme", next);`, `store.set("v2theme", next);`);
once(`</head>`, `<style id="v2css">\n${fs.readFileSync("v2/v2.css", "utf8")}</style>\n</head>`);
once(`</body>`, `<script id="v2js">\n${fs.readFileSync("v2/v2.js", "utf8")}</script>\n</body>`);
fs.writeFileSync("v2.html", s);
console.log("v2.html", s.length);
