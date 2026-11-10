// SpellSeekr design test: the page works as a board.
// Every search stays as a shelf of cards, the deck lies beside it as piles of real cards,
// and a shelf can be flipped through one large card at a time.
(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const wide = matchMedia("(min-width: 1100px)");
  const rail = () => !isMobile && wide.matches;
  const el = id => document.getElementById(id);
  const home = () => document.body.classList.contains("home");
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const saved = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };
  const inList = name => state.list.find(c => c.name === name);
  const imageOf = id => `https://cards.scryfall.io/normal/front/${id[0]}/${id[1]}/${id}.jpg`;

  // ---------- cards in the open shelf ----------
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

  // A card that is added flies to the deck (a computer) or to the bar at the foot (a phone).
  function flyFrom(img) {
    if (still.matches || !img) return;
    const to = rail() ? el("v2meter") : el("openlist").getClientRects().length ? el("openlist") : el("listtoggle");
    if (!to || !to.getClientRects().length || !img.getClientRects().length) return;
    const a = img.getBoundingClientRect(), b = to.getBoundingClientRect();
    const ghost = img.cloneNode();
    ghost.className = "v2fly"; ghost.removeAttribute("loading"); ghost.removeAttribute("style"); ghost.alt = "";
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
    const had = inList(card.name);
    if (!had || had.multi) {
      const tile = [...grid.children].find(t => t.dataset.name === card.name);
      flyFrom(tile && tile.querySelector(".card img"));
    }
    add(card);
  };

  // ---------- the deck: how far it is, and its cards as piles ----------
  const meter = make("div", "v2meter");
  meter.id = "v2meter";
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

  let deckView = saved("szh.v2deckview", "piles");
  const viewSwitch = make("div", "v2view");
  viewSwitch.setAttribute("role", "group");
  viewSwitch.setAttribute("aria-label", "How the list is shown");
  for (const [value, label] of [["piles", "Piles"], ["lines", "Lines"]]) {
    const b = make("button", "", label);
    b.type = "button"; b.dataset.view = value;
    b.addEventListener("click", () => { deckView = value; save("szh.v2deckview", value); showPiles(); });
    viewSwitch.append(b);
  }
  const piles = make("div", "v2piles");
  el("listitems").before(viewSwitch, piles);
  function showPiles() {
    const on = deckView === "piles";
    el("list").classList.toggle("v2pilesview", on);
    for (const b of viewSwitch.children) b.setAttribute("aria-pressed", String(b.dataset.view === deckView));
    viewSwitch.hidden = !state.list.length;
    piles.replaceChildren();
    if (!on) return;
    const items = [...state.list].sort((a, b) => (a.mv || 0) - (b.mv || 0) || a.name.localeCompare(b.name));
    for (const group of LIST_GROUPS) {
      const cards = items.filter(c => (c.group || "Other") === group);
      if (!cards.length) continue;
      const pile = make("section", "v2pile");
      const h = make("h3", "", group);
      h.append(make("span", "", String(cards.reduce((n, c) => n + c.qty, 0))));
      const ul = make("ul");
      for (const c of cards) {
        const li = make("li", c.deckQty && !(c.qty > c.deckQty) ? "fromdeck" : "");
        if (c.id) {
          const img = make("img");
          img.loading = "lazy"; img.alt = c.name; img.src = imageOf(c.id);
          li.append(img);
          const large = `https://cards.scryfall.io/large/front/${c.id[0]}/${c.id[1]}/${c.id}.jpg`;
          li.addEventListener("mouseenter", e => showPreview({ name: c.name, large }, e));
          li.addEventListener("mousemove", movePreview);
          li.addEventListener("mouseleave", hidePreview);
        } else {
          li.append(make("span", "v2slab", c.name));
        }
        // a tap lifts the card out of its pile so it can be read (a phone has no pointer to hover with)
        li.addEventListener("click", e => { if (!e.target.closest("button")) li.classList.toggle("up"); });
        if (c.qty > 1) li.append(make("b", "v2qty", "×" + c.qty));
        const out = make("button", "v2out", "×");
        out.type = "button"; out.title = "Take out"; out.setAttribute("aria-label", `Remove ${c.name}`);
        out.addEventListener("click", () => { hidePreview(); changeQty(c.name, -c.qty); });
        li.append(out);
        ul.append(li);
      }
      pile.append(h, ul);
      piles.append(pile);
    }
  }

  // ---------- the board: every search stays as a shelf ----------
  const BOARD = "szh.v2board", SHELF_CARDS = 14, MAX_SHELVES = 8;
  let board = saved(BOARD, []);
  if (!Array.isArray(board)) board = [];
  let activeId = null, drawn = "";
  const boardEl = make("section", "v2board");
  boardEl.id = "v2board";
  boardEl.setAttribute("aria-label", "Your searches");
  el("results").after(boardEl);
  // above the open shelf: every shelf by name, to step from one to the other without scrolling
  const tabs = make("nav", "v2tabs");
  tabs.setAttribute("aria-label", "Shelves on your board");
  el("results").before(tabs);
  function showTabs() {
    tabs.hidden = home() || board.length < 2;
    tabs.replaceChildren(...board.map(shelf => {
      const b = make("button", "", shelf.zin[0].toUpperCase() + shelf.zin.slice(1).replace(/\s*→\s*/g, ", "));
      b.type = "button";
      b.append(make("span", "", fmtNum(shelf.total)));
      if (shelf.id === activeId) b.setAttribute("aria-current", "true");
      else b.addEventListener("click", () => openShelf(shelf));
      return b;
    }));
  }

  // The cards of the search on screen are kept as its shelf.
  function keep(search, cards) {
    if (!cards.length || !el("combos").hidden) return;
    const zin = el("rtitle").dataset.text || search.query;
    let shelf = board.find(b => b.zin === zin) || (refining && board.find(b => b.id === activeId)) || board.find(b => b.query === search.query);
    if (!shelf) {
      shelf = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
      board.unshift(shelf);
      board = board.slice(0, MAX_SHELVES);
    }
    Object.assign(shelf, { zin, query: search.query, total: search.total,
      cards: cards.slice(0, SHELF_CARDS).map(c => ({ ...c, why: undefined, flipped: false })) });
    activeId = shelf.id;
    save(BOARD, board);
  }
  const draw = render;
  render = (cards, page, pages) => {
    draw(cards, page, pages);
    if (state.search && page === 1) keep(state.search, cards);
    showBoard();
    el("v2flipbtn").hidden = !(state.search && state.search.total > 0);
  };

  function openShelf(shelf) {
    activeId = shelf.id;
    if (refining) setRefining(false);
    runHistory({ zin: shelf.zin, query: shelf.query });
    window.scrollTo({ top: 0, behavior: still.matches ? "auto" : "smooth" });
  }
  function dropShelf(shelf) {
    const wasOpen = shelf.id === activeId && !home();
    board = board.filter(b => b !== shelf);
    save(BOARD, board);
    if (wasOpen) { activeId = null; goHome(); history.pushState({}, "", location.pathname); }
    showBoard(true);
    toast(`Removed the shelf “${shelf.zin}”`, { label: "Undo", run: () => { board.unshift(shelf); board = board.slice(0, MAX_SHELVES); save(BOARD, board); showBoard(true); } });
  }
  function mini(card) {
    const box = make("div", "v2mini");
    box.dataset.name = card.name;
    const btn = make("button", "v2minicard");
    btn.type = "button";
    const img = make("img");
    img.loading = "lazy"; img.alt = card.name; img.src = card.img;
    btn.append(img, make("span", "name", card.name), make("span", "meta", `${card.set.toUpperCase()} · ${priceText(card)}`));
    btn.addEventListener("click", () => {
      const had = inList(card.name);
      if (!had || had.multi) flyFrom(img);
      add(card);
    });
    btn.addEventListener("mouseenter", e => showPreview(card, e));
    btn.addEventListener("mousemove", movePreview);
    btn.addEventListener("mouseleave", hidePreview);
    const info = make("button", "infobtn", "i");
    info.type = "button"; info.title = "Card details"; info.setAttribute("aria-label", `Details of ${card.name}`);
    info.addEventListener("click", () => { hidePreview(); openCard(card); });
    box.append(btn, info, make("span", "v2tick", "✓"));
    return box;
  }
  function markMinis() {
    for (const m of boardEl.querySelectorAll(".v2mini")) {
      const picked = !!inList(m.dataset.name);
      m.classList.toggle("picked", picked);
      m.classList.toggle("owned", !picked && ownsCard(m.dataset.name));
      m.querySelector(".v2minicard").setAttribute("aria-label", picked ? `${m.dataset.name} is in the list; select to take it out` : `Add ${m.dataset.name} to the list`);
    }
  }
  function showBoard(force) {
    if (home()) activeId = null;
    showTabs();
    const shelves = board.filter(b => b.id !== activeId);
    const sign = (home() ? "h" : "r") + "|" + shelves.map(b => `${b.id}:${b.total}:${b.zin}`).join("|");
    if (sign === drawn && !force) { markMinis(); return; }
    drawn = sign;
    boardEl.replaceChildren();
    boardEl.hidden = !shelves.length;
    if (!shelves.length) return;
    boardEl.append(make("h2", "v2boardhead", home() ? "Your board" : "Also on your board"));
    for (const shelf of shelves) {
      const art = make("article", "v2shelf");
      const head = make("header");
      const open = make("button", "v2shelfopen");
      open.type = "button";
      open.append(make("h3", "", shelf.zin[0].toUpperCase() + shelf.zin.slice(1).replace(/\s*→\s*/g, ", ")), make("span", "", plural(shelf.total, "card")));
      open.setAttribute("aria-label", `Open the search ${shelf.zin}, ${plural(shelf.total, "card")}`);
      open.addEventListener("click", () => openShelf(shelf));
      const drop = make("button", "v2drop", "×");
      drop.type = "button"; drop.title = "Take this shelf off the board"; drop.setAttribute("aria-label", `Remove the search ${shelf.zin} from the board`);
      drop.addEventListener("click", () => dropShelf(shelf));
      head.append(open, drop);
      const row = make("div", "v2row");
      row.append(...shelf.cards.map(mini));
      if (shelf.total > shelf.cards.length) {
        const more = make("button", "v2more");
        more.type = "button";
        more.append(make("b", "", `+${fmtNum(shelf.total - shelf.cards.length)}`), make("span", "", "Open the shelf"));
        more.addEventListener("click", () => openShelf(shelf));
        row.append(more);
      }
      art.append(head, row);
      boardEl.append(art);
    }
    markMinis();
  }

  // ---------- flipping through a shelf: one large card at a time ----------
  const flip = make("dialog", "v2flip");
  flip.id = "v2flip";
  flip.setAttribute("aria-label", "Flip through the cards");
  flip.innerHTML = `
    <div class="v2fliptop"><span id="v2flipcount" role="status"></span><button class="btn small" type="button" data-act="back">Back one</button><button class="btn small" type="button" data-act="close">Close</button></div>
    <div class="v2flipstage"><div class="v2flipcard"><img alt=""><span class="v2flipstamp" hidden>In your list</span></div><p class="v2flipend" hidden></p></div>
    <div class="v2flipinfo"><h2></h2><p class="v2fliptype"></p><div class="v2fliptext"></div><p class="v2flipmeta"></p></div>
    <div class="v2flipacts"><button class="btn" type="button" data-act="skip">← Skip</button><button class="btn" type="button" data-act="info">Details</button><button class="btn primary" type="button" data-act="add">Add →</button></div>
    <p class="v2fliphint">Swipe or use the arrow keys: right adds, left skips, up shows the details.</p>`;
  document.body.append(flip);
  const fq = sel => flip.querySelector(sel);
  let fSearch = null, fIndex = 0, fCard = null, fBusy = false;
  async function showFlip() {
    const s = fSearch, cardBox = fq(".v2flipcard"), end = fq(".v2flipend");
    const over = fIndex >= s.total;
    cardBox.hidden = over; end.hidden = !over;
    fq(".v2flipinfo").hidden = over;
    for (const b of flip.querySelectorAll('[data-act="skip"], [data-act="info"], [data-act="add"]')) b.disabled = over;
    fq('[data-act="back"]').disabled = fIndex === 0;
    if (over) { fCard = null; el("v2flipcount").textContent = ""; end.textContent = `That was all ${plural(s.total, "card")}.`; return; }
    el("v2flipcount").textContent = `${fmtNum(fIndex + 1)} of ${fmtNum(s.total)}`;
    let card;
    try { card = (await apiPage(s, Math.floor(fIndex / API_PAGE) + 1))[fIndex % API_PAGE]; }
    catch (err) { end.hidden = false; cardBox.hidden = true; end.textContent = err.message; return; }
    if (s !== fSearch || !card) return;
    fCard = card;
    const img = fq(".v2flipcard img");
    img.src = card.large || card.img; img.alt = card.name;
    const face = card.faces[0] || {};
    fq(".v2flipinfo h2").textContent = card.name;
    fq(".v2fliptype").textContent = face.type || "";
    fq(".v2fliptext").replaceChildren(...card.faces.flatMap((f, i) => {
      const p = make("p");
      p.append(...withSymbols(f.text));
      return i && card.faces.length > 1 ? [make("p", "v2flipface", f.name), p] : [p];
    }));
    const st = edhFor(card.name);
    fq(".v2flipmeta").textContent = [priceText(card), st && st.pct ? `${st.pct}% of ${commanderShort()} decks` : "", ownsCard(card.name) ? "already in your deck" : ""].filter(Boolean).join(" · ");
    markFlip();
    const next = s.cache.get(Math.floor((fIndex + 1) / API_PAGE) + 1);   // the next card's image is fetched ahead
    if (next && next[(fIndex + 1) % API_PAGE]) new Image().src = next[(fIndex + 1) % API_PAGE].large;
  }
  function markFlip() {
    if (!fCard) return;
    const had = inList(fCard.name), stays = had && !had.multi;
    fq(".v2flipstamp").hidden = !had;
    fq('[data-act="add"]').textContent = stays ? "Next →" : "Add →";
  }
  async function leave(dir) {
    if (fBusy || !fCard) return;
    fBusy = true;
    const box = fq(".v2flipcard");
    if (!still.matches) {
      await box.animate([{ transform: getComputedStyle(box).transform === "none" ? "none" : getComputedStyle(box).transform, opacity: 1 },
        { transform: `translateX(${dir * 130}%) rotate(${dir * 16}deg)`, opacity: 0 }], { duration: 240, easing: "ease-in" }).finished.catch(() => {});
    }
    box.style.transform = "";
    fIndex += 1;
    await showFlip();
    if (!still.matches && !box.hidden) box.animate([{ transform: "scale(0.92) translateY(14px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    fBusy = false;
  }
  function flipAct(act) {
    if (act === "close") return flip.close();
    if (act === "back") { if (fIndex > 0 && !fBusy) { fIndex -= 1; showFlip(); } return; }
    if (!fCard) return;
    if (act === "info") return openCard(fCard);
    if (act === "add") { const had = inList(fCard.name); if (!had || had.multi) add(fCard); }
    leave(act === "add" ? 1 : -1);
  }
  flip.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if (b) flipAct(b.dataset.act); else if (e.target === flip) flip.close(); });
  flip.addEventListener("keydown", e => {
    if (el("carddialog").open) return;
    const act = { ArrowRight: "add", ArrowLeft: "skip", ArrowUp: "info", ArrowDown: "back" }[e.key];
    if (act) { e.preventDefault(); flipAct(act); }
  });
  // dragging the card: past a third of its width it goes that way
  let drag = null;
  fq(".v2flipcard").addEventListener("pointerdown", e => { if (fBusy || !fCard) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; e.currentTarget.setPointerCapture(e.pointerId); });
  fq(".v2flipcard").addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = Math.min(0, e.clientY - drag.y);
    e.currentTarget.style.transform = `translate(${dx}px, ${dy * 0.4}px) rotate(${dx / 22}deg)`;
    e.currentTarget.dataset.way = dx > 60 ? "add" : dx < -60 ? "skip" : "";
  });
  const drop = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, box = e.currentTarget, w = box.offsetWidth;
    drag = null; box.dataset.way = "";
    if (Math.abs(dx) > w / 3) return flipAct(dx > 0 ? "add" : "skip");
    box.style.transform = "";
    if (dy < -w / 3 && Math.abs(dx) < w / 4) flipAct("info");
  };
  fq(".v2flipcard").addEventListener("pointerup", drop);
  fq(".v2flipcard").addEventListener("pointercancel", e => { drag = null; e.currentTarget.style.transform = ""; e.currentTarget.dataset.way = ""; });
  fq(".v2flipcard img").draggable = false;

  const flipBtn = make("button", "btn small v2flipbtn", "Flip through");
  flipBtn.id = "v2flipbtn"; flipBtn.type = "button"; flipBtn.hidden = true;
  flipBtn.title = "See these cards one at a time, large";
  flipBtn.addEventListener("click", () => {
    const s = state.search;
    if (!s || !s.total) return;
    fSearch = s; fIndex = Math.min(s.total - 1, (s.page - 1) * s.size);
    hidePreview();
    flip.showModal();
    showFlip();
  });
  el("optstoggle").before(flipBtn);

  // ---------- keeping everything in step ----------
  const list = renderList;
  renderList = () => { list(); showMeter(); showPiles(); markMinis(); if (flip.open) markFlip(); };
  const cmdr = renderCommander;
  renderCommander = (...a) => { const r = cmdr(...a); showMeter(); return r; };
  showMeter(); showPiles();

  // With room for it, the deck lies open beside the board, on the start screen too.
  let placed = false;
  function placeDeck() {
    const want = rail(), open = el("drawer").classList.contains("open");
    if (want !== open && (want || placed)) {
      const focus = document.activeElement;
      if (want) { openList(); placed = true; } else { closeList(); placed = false; }
      if (focus && focus.isConnected && focus !== document.body) focus.focus({ preventScroll: true });
    }
  }
  let wasHome = home();
  new MutationObserver(() => { placeDeck(); if (home() !== wasHome) { wasHome = home(); showBoard(); } })
    .observe(document.body, { attributes: true, attributeFilter: ["class"] });
  wide.addEventListener("change", placeDeck);
  placeDeck();
  showBoard();

  // The quick searches put a shelf on the board; say so.
  const startersLabel = () => { const l = document.querySelector("#starters .startor"); if (l && l.textContent.trim() === "Quick search") l.textContent = "Start a shelf"; };
  new MutationObserver(startersLabel).observe(el("starters"), { childList: true, subtree: true });
  startersLabel();

  // This is a test page: the foot says so and leads back.
  const note = make("span", "v2note");
  note.innerHTML = '· Design test · <a href="./">Open the live version</a>';
  document.querySelector(".foot").append(note);
})();
