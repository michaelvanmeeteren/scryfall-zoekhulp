# Scryfall Zoekhulp

Zoek Magic-kaarten met een Engelse zin, verzamel ze in een lijst en kopieer die naar Moxfield.
Er wordt altijd gezocht in Commander-legale papieren kaarten (`f:commander game:paper`).

## Openen

De app staat online: **https://michaelvanmeeteren.github.io/scryfall-zoekhulp/**

Er is geen server of installatie nodig: open het adres op je pc of telefoon en maak er een bladwijzer van.
Op je telefoon kun je de pagina ook op je beginscherm zetten (browsermenu, *Toevoegen aan startscherm*).

- Je lijst wordt per apparaat en per browser bewaard: de lijst op je telefoon staat los van die op je pc.
- Op een telefoon opent automatisch de mobiele weergave: grotere kaarten, grote knoppen en een balk onderaan met je lijst.
  Met **Switch to mobile view** / **Switch to desktop view** onderaan de pagina kies je zelf; die keuze wordt onthouden.
- Open `index.html` niet rechtstreeks als bestand (`file://`): Scryfall weigert dan de verzoeken.

### Claude API

De vertaling naar Scryfall-syntax loopt via een kleine Cloudflare Worker (map `worker/`), op
`https://scryfall-zoekhulp.michaelvanmeeteren.workers.dev`. Alleen de Worker kent de Claude API-key; de pagina en GitHub niet.

```
browser → Worker (API-key, toegangscode, vaste instellingen) → Claude API
```

- Wie de **toegangscode** heeft, vult die in bij **⚙ Settings**; dan vertaalt Claude. Zonder code (of als Claude faalt) doet de ingebouwde vertaler het, met de reden onder de zoekopdracht.
- De Worker gebruikt altijd `claude-haiku-5-5`, altijd dezelfde systeemprompt voor Scryfall, zinnen tot 300 tekens en maximaal 20 vertalingen per minuut per bezoeker. Zo kan de key nergens anders voor gebruikt worden.
- Hij accepteert alleen verzoeken van deze GitHub-pagina (en `http://localhost:8010` om te testen).
- **Scryfall Tagger:** Claude krijgt alle 3.662 oracle tags van [Scryfall Tagger](https://scryfall.com/docs/tagger-tags)
  mee (zonder de `cycle-…`-tags) en kiest bij "kaarten die X doen" een passende tag, zoals `otag:anthem`,
  `otag:copy-spell` of `otag:sacrifice-outlet-creature`. Gebruikt hij een tag die niet bestaat, dan vraagt de Worker
  één keer om een verbetering. De lijst staat in `worker/src/tags.js` en wordt gecachet, dus hij kost per zoekopdracht
  bijna niets extra.
- **Commander-kennis:** de prompt kent gilden, shards, wedges en vierkleurencombinaties, spelersjargon (dork, rock,
  cantrip, wincon, staples …), archetypes met hun tags (aristocrats, tokens, +1/+1 counters, reanimator, lifegain,
  landfall, spellslinger, voltron, blink, group hug) en extra syntax (`is:gamechanger`, `is:partner`, `is:shockland`,
  `produces:`, enzovoort). Alles is vooraf bij Scryfall gecontroleerd.
- **Zelfcontrole:** na het vertalen vraagt de Worker Scryfall of de query kaarten oplevert. Bij 0 kaarten, een
  waarschuwing van Scryfall of een niet-bestaande tag krijgt Claude één verbeterronde.
- **Combo's:** vraag je om combo's ("infinite combos in dimir", "combos with Sol Ring", "cheap combos in boros"), dan
  zoekt de Worker de 10 meest gespeelde combo's op bij [Commander Spellbook](https://commanderspellbook.com) (de bron
  van EDHREC's combo-pagina's). Hun kaarten verschijnen als zoekresultaat; de combo's zelf staan onder de zoekopdracht,
  met wat ze doen, de prijs en een link. Klik op een combo om alleen die kaarten te zien.
- **EDHREC-aanbevelingen:** met een commander ingesteld toont **EDHREC top cards** de kaarten die het meest met die
  commander gespeeld worden (percentage van de decks op elke kaart, basic lands weggelaten). Met de code werkt ook typen:
  "recommended cards for Atraxa", "top ramp for my commander". EDHREC heeft geen officiële API: de pagina leest dezelfde
  gegevens als edhrec.com zelf, dus dit kan ooit veranderen.
- **Kostenoverzicht:** de Worker telt per dag de aanroepen en tokens (D1-tabel `usage`). Op
  [stats.html](https://michaelvanmeeteren.github.io/scryfall-zoekhulp/stats.html) zie je met je eigen beheercode
  (secret `ADMIN_CODE`) het aantal zoekopdrachten, de geschatte kosten en hoe lang je tegoed nog meegaat.
- **Cache warm houden:** een Cron Trigger doet elk half uur van 10:00 tot 00:00 (Nederlandse wintertijd) een mini-aanroep
  met dezelfde prompt, zodat de cache van een uur niet verloopt. Kosten ongeveer $0,01 per dag. Het schema staat in
  `worker/wrangler.toml` onder `[triggers]`.

**Beheer** (in een terminal in de map `worker`, na `npm install`):

| Wat | Commando |
| --- | --- |
| Toegangscode wijzigen (bijvoorbeeld als hij is uitgelekt) | `npx wrangler secret put ACCESS_CODE` |
| Beheercode voor stats.html instellen of wijzigen | `npx wrangler secret put ADMIN_CODE` |
| API-key vervangen | `npx wrangler secret put ANTHROPIC_API_KEY` |
| Worker opnieuw online zetten na een wijziging in `worker/src/index.js` | `npx wrangler deploy` |
| De taglijst verversen met nieuwe Scryfall-tags (daarna `npx wrangler deploy`) | `node update-tags.mjs` |
| De vertaler testen met 68 vragen (kost minder dan 5 cent) | `$env:ACCESS_CODE="<code>"; node eval.mjs` |
| Alle gelogde zoekopdrachten bekijken | `npx wrangler d1 execute zoekhulp-log --remote --command "SELECT * FROM searches ORDER BY id DESC"` |
| Het logboek leegmaken | `npx wrangler d1 execute zoekhulp-log --remote --command "DELETE FROM searches"` |

Plak de key nooit in een chat. Zet in de [Anthropic Console](https://console.anthropic.com) een maandlimiet, bijvoorbeeld €5.
Vermoed je een lek: verwijder de key in de Console, maak een nieuwe en zet die met het commando hierboven in de Worker.

### Bijwerken

Wijzigingen in `index.html` staan online zodra ze naar GitHub zijn gepusht (`git push`); GitHub Pages heeft daar ongeveer een minuut voor nodig.
Wijzigingen in de Worker zet je online met `npx wrangler deploy` (zie hierboven).

## Gebruik

- **Commander:** vul onder de zoekbalk je commander in (bijvoorbeeld `atraxa`); alle zoekopdrachten blijven dan binnen zijn kleuren.
- **Vervolgvragen:** na een zoekopdracht kun je die bijsturen met bijvoorbeeld `only under 1 euro`, `without creatures` of `nu alleen instants` (met de toegangscode).
- **Deck importeren:** in de kaartlijst plak je je decklijst (bijvoorbeeld uit Moxfield); kaarten die je al hebt krijgen het label *In deck*, en je kunt ze verbergen.
- **Filterknoppen:** boven de resultaten filter je snel op type, mana value en prijs, zonder de zoekopdracht opnieuw te typen.

- Typ in het Engels, bijvoorbeeld `creatures mana value less than or equal to 5 in g/w/b`. Met de toegangscode (Claude) mag het ook in het Nederlands; de ingebouwde vertaler kent alleen Engels.
- Begin met `/s ` of `!` om direct Scryfall-syntax te gebruiken: `/s t:creature kw:flying id<=r mv<3`.
- Pas de vertaalde zoekopdracht aan in het tweede veld en klik **Search again**.
- Resultaten staan standaard op **EDHREC rank**: de meest gespeelde Commander-kaarten eerst. Via **Sort by** kies je ook naam, prijs, mana value of nieuwste.
- Met **Card size − / +** maak je de kaartplaatjes kleiner of groter (pc: 5 standen, telefoon: 3, 2 of 1 kaart per rij). De app onthoudt je keuze.
- Commander is singleton: klik op een kaart om hem toe te voegen (er verschijnt een ✓), klik nog eens om hem weer weg te halen. Een andere print van dezelfde kaart telt als dezelfde kaart.
- Uitzonderingen herkent de app zelf: basic lands en kaarten met "A deck can have any number of / up to … cards named" (zoals Relentless Rats en Seven Dwarves). Die krijgen een teller: klikken = +1, **−** op de kaart = één eraf.
- **Copy for Moxfield** zet de lijst op het klembord. Plak in Moxfield via *Import* of *Bulk Edit*.

De app zelf is in het Engels; deze README is in het Nederlands.

## Wat de ingebouwde vertaler herkent

| Onderdeel | Voorbeelden |
| --- | --- |
| Kleuren (color identity) | `in g/w/b`, `in gwb`, `green and white`, `golgari`, `abzan`, `mono red`, `colorless` |
| Types | `creatures`, `instants or sorceries`, `legendary`, `lands`, `no basics`, `noncreature`, `dragons`, `elves` |
| Mana value, power, toughness | `mana value less than or equal to 5`, `under 3 mana`, `4 mana or less`, `5+ power`, `2-drops` |
| Mana value | `cheap` (mana value ≤ 2), `expensive` (≥ 6), `cheapest first` (laagste mana value eerst) |
| Prijs (euro) | `budget` (< €2), `under 1 euro`, `less than €5`, `by price` |
| Sortering | `most played`, `popular`, `by edhrec`, `cheapest first`, `by price`, `newest` |
| Keywords | `flying`, `trample`, `lifelink`, `first strike`, ... |
| Functies | `removal`, `ramp`, `card draw`, `board wipes`, `tutors`, `counterspells`, `mana rocks`, `burn` |
| Overig | `that can be my commander`, `draw a card`, `make any color`, `rare`, tekst tussen `"aanhalingstekens"` |

Wat niet herkend wordt, staat onder de zoekopdracht bij *Not used*. Met een API-key neemt Claude het vertalen over.
