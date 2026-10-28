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

**Beheer** (in een terminal in de map `worker`, na `npm install`):

| Wat | Commando |
| --- | --- |
| Toegangscode wijzigen (bijvoorbeeld als hij is uitgelekt) | `npx wrangler secret put ACCESS_CODE` |
| API-key vervangen | `npx wrangler secret put ANTHROPIC_API_KEY` |
| Worker opnieuw online zetten na een wijziging in `worker/src/index.js` | `npx wrangler deploy` |

Plak de key nooit in een chat. Zet in de [Anthropic Console](https://console.anthropic.com) een maandlimiet, bijvoorbeeld €5.
Vermoed je een lek: verwijder de key in de Console, maak een nieuwe en zet die met het commando hierboven in de Worker.

### Bijwerken

Wijzigingen in `index.html` staan online zodra ze naar GitHub zijn gepusht (`git push`); GitHub Pages heeft daar ongeveer een minuut voor nodig.
Wijzigingen in de Worker zet je online met `npx wrangler deploy` (zie hierboven).

## Gebruik

- Typ in het Engels, bijvoorbeeld `creatures mana value less than or equal to 5 in g/w/b`.
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
| Prijs (euro) | `cheap` (< €2), `under 1 euro`, `less than €5`, `cheapest first` |
| Sortering | `most played`, `popular`, `by edhrec`, `cheapest first`, `newest` |
| Keywords | `flying`, `trample`, `lifelink`, `first strike`, ... |
| Functies | `removal`, `ramp`, `card draw`, `board wipes`, `tutors`, `counterspells`, `mana rocks`, `burn` |
| Overig | `that can be my commander`, `draw a card`, `make any color`, `rare`, tekst tussen `"aanhalingstekens"` |

Wat niet herkend wordt, staat onder de zoekopdracht bij *Not used*. Met een API-key neemt Claude het vertalen over.
