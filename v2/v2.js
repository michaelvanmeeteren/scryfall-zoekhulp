// SpellSeekr design test: what the new design adds on top of the live page's own script.
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const wide = matchMedia("(min-width: 1100px)");
  const rail = () => !isMobile && wide.matches;
  const el = id => document.getElementById(id);
  const home = () => document.body.classList.contains("home");

  // The cards of a page are dealt one after another.
  const grid = el("grid");
  const number = () => [...grid.children].forEach((t, i) => t.style.setProperty("--i", i));
  new MutationObserver(number).observe(grid, { childList: true });
  number();

  // The card under the pointer leans toward it and catches the light.
  grid.addEventListener("pointermove", e => {
    if (isMobile || still.matches || e.pointerType === "touch") return;
    const tile = e.target.closest(".tile"), img = tile && tile.querySelector(".card img");
    if (!img) return;
    const r = img.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    tile.style.setProperty("--ry", ((x - 0.5) * 9).toFixed(2) + "deg");
    tile.style.setProperty("--rx", ((0.5 - y) * 7).toFixed(2) + "deg");
    tile.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
    tile.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
  });

  // A card that is added flies to the sheet (a computer) or to the bar at the foot (a phone).
  function fly(card) {
    if (still.matches) return;
    const tile = [...grid.children].find(t => t.dataset.name === card.name);
    const img = tile && tile.querySelector(".card img");
    const to = rail() && !home() ? el("v2meter") : el("openlist").getClientRects().length ? el("openlist") : el("listtoggle");
    if (!img || !to || !to.getClientRects().length) return;
    const a = img.getBoundingClientRect(), b = to.getBoundingClientRect();
    const ghost = img.cloneNode();
    ghost.className = "v2fly"; ghost.removeAttribute("loading"); ghost.alt = "";
    Object.assign(ghost.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
    document.body.append(ghost);
    const scale = Math.max(0.12, Math.min(0.3, 56 / a.width));
    const dx = b.left + Math.min(b.width, 120) / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const done = () => ghost.remove();
    ghost.animate([
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 50}px) scale(0.8) rotate(-7deg)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(6deg)`, opacity: 0.2 }
    ], { duration: 560, easing: "cubic-bezier(0.3, 0.7, 0.2, 1)" }).finished.then(done, done);
  }
  const add = addToList;
  addToList = card => {
    const had = state.list.find(c => c.name === card.name);
    if (!had || had.multi) fly(card);
    add(card);
  };

  // The sheet says how far the deck is: cards in the list against the 100 a Commander deck holds.
  const meter = document.createElement("div");
  meter.id = "v2meter"; meter.className = "v2meter";
  meter.innerHTML = "<span><b></b> <span></span></span><i></i>";
  el("totals").before(meter);
  function showMeter() {
    const c = state.commander, mates = c ? (c.names ? c.names.length : 1) : 0, slots = 100 - mates;
    const n = state.list.reduce((t, x) => t + x.qty, 0);
    meter.querySelector("b").textContent = n;
    meter.querySelector("span span").textContent = c ? `of ${slots} beside your commander${mates > 1 ? "s" : ""}` : "of 100 in a Commander deck";
    meter.style.setProperty("--p", Math.min(1, n / slots).toFixed(3));
    meter.classList.toggle("over", n > slots);
  }
  const list = renderList;
  renderList = () => { list(); showMeter(); };
  const cmdr = renderCommander;
  renderCommander = (...a) => { const r = cmdr(...a); showMeter(); return r; };
  showMeter();

  // With room for it, the sheet lies open beside the results; on the start screen it is put away.
  let placed = false;
  function placeSheet() {
    const want = rail() && !home(), open = el("drawer").classList.contains("open");
    if (want === open || (!want && !placed)) return;
    const focus = document.activeElement;
    if (want) { openList(); placed = true; } else { closeList(); placed = false; }
    if (focus && focus.isConnected && focus !== document.body) focus.focus({ preventScroll: true });
  }
  new MutationObserver(placeSheet).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  wide.addEventListener("change", placeSheet);
  placeSheet();

  // This is a test page: the foot says so and leads back.
  const note = document.createElement("span");
  note.className = "v2note";
  note.innerHTML = '· Design test · <a href="./">Open the live version</a>';
  document.querySelector(".foot").append(note);
})();
