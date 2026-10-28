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

Met een Claude API-key vertaalt Claude je zin naar Scryfall-syntax; zonder key doet de ingebouwde vertaler het.

1. Maak een key op [console.anthropic.com](https://console.anthropic.com) (*API Keys*) en zet onder *Limits* een maandlimiet, bijvoorbeeld €5.
2. Klik **⚙ Settings** in de app, plak de key en klik **Save**. De app gebruikt altijd `claude-haiku-5-5`, het kleinste model; dat is niet in te stellen.
3. Lukt de vertaling via Claude niet (verkeerde key, geen verbinding, te veel verzoeken), dan zoekt de app met de ingebouwde vertaler en staat de reden onder de zoekopdracht.

De key staat alleen in de browser van dat apparaat, niet in de code op GitHub. Voer hem in op je pc en op je telefoon apart.
Plak hem nooit in een chat. Vermoed je een lek: verwijder de key in de Console en maak een nieuwe.

### Bijwerken

Wijzigingen in `index.html` staan online zodra ze naar GitHub zijn gepusht (`git push`); GitHub Pages heeft daar ongeveer een minuut voor nodig.

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
