# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A small group: the owner and their Magic: The Gathering friends, all building **Commander** decks with paper cards.
Experience is mixed: some are seasoned Commander players who know the jargon (ramp, removal, tutors, staples, game
changers), others are still learning it. Neither group should be talked down to or left guessing.

They use it in two situations:
- **Deckbuilding at a computer**, next to Moxfield or another deck site, searching and comparing for a longer session.
- **On a phone**, looking something up quickly away from the desk.

## Product Purpose

SpellSeekr (formerly "Scryfall Zoekhulp") lets you describe the cards you want in plain English or Dutch
("cheap removal in black", "goblins that make tokens") and shows the matching Commander-legal paper cards from Scryfall,
without knowing Scryfall's search syntax. You collect cards in a list and copy it into Moxfield or another deck site.

What it must do best, above everything else:
1. **Discover cards** you didn't know for your deck.
2. **Finish a deck**: fill gaps (ramp, removal, draw, a combo) within your commander's colors, budget and rules.

Success: a player finds cards worth adding that they wouldn't have found with Scryfall's own search box, and gets them
into their deck list with little effort.

## Positioning

A plain-language front end to Scryfall built around one specific deck: it knows your commander (including partner,
background and Doctor pairs), your companion's deck rule, and the deck you already have, and applies all of them to
every search and to EDHREC's recommendations. Scryfall needs syntax; EDHREC doesn't take free-form questions; this does both.

## Operating Context

- Deck sites: Moxfield (main), Archidekt, MTG Arena-style lists. Lists go out via the clipboard and come in by pasting.
- Data: Scryfall API (cards, prices in euro, Tagger tags), EDHREC JSON (recommendations, inclusion %),
  Commander Spellbook (combos).
- Translation: Claude Haiku via a Cloudflare Worker, available to friends with a shared access code; without the code
  a simpler built-in translator is used.
- Commander-format vocabulary is the users' own language: color identity, guilds/shards/wedges, mana value,
  singleton, companion, partner, MDFC.

## Capabilities and Constraints

- Plain-language search (English and Dutch with the code), `/s` for raw Scryfall syntax, a Search / Refine mode that
  narrows the results on screen step by step.
- Commander (one or a legal pair), companion with its deck rule, imported deck with "In deck" marking and hiding.
- Filters (type, mana value, price), sorting, EDHREC top cards per commander, combos from Commander Spellbook.
- A card list grouped by type with a mana curve, copied as a deck list. Double-faced cards can be turned over.
- Always Commander-legal paper cards (`f:commander game:paper`). "Cheap" means low mana value; "budget" means price.
- Hosting: one static page on GitHub Pages plus a Cloudflare Worker; no accounts, no server-side user data.
  Lists and settings live in the browser's localStorage per device.
- Claude must only ever use Haiku; the API key never reaches the browser or GitHub.
- Undecided: whether the site stays private to the friend group or is shared more widely.

## Brand Commitments

- Name: **SpellSeekr**; logo: a tilted card with a spell spark under a magnifying glass (`logo.svg`).
- The interface is in English; the owner communicates in Dutch.
- No letterforms or emblems with loaded connotations (e.g. a stylised "SS").

## Evidence on Hand

Real card data, prices, rulings and images from Scryfall; real EDHREC inclusion percentages; real combos from
Commander Spellbook. No testimonials, user counts or reviews exist; none may be invented.

## Product Principles

1. **The cards are the answer.** Results and the user's own deck come first; interface chrome and commentary recede.
2. **Know the deck.** Every search respects the commander's colors, the companion's rule and what's already owned,
   without the user repeating it.
3. **Speak Commander, not syntax.** Plain words in, real Magic terms out; no hand-holding for experts, no jargon walls
   for newer players.
4. **Discovery over lookup.** Help players meet cards they didn't know, not just retrieve ones they did.
5. **Works at a desk and in a hand.** Every feature has to work on a phone as well as next to Moxfield on a big screen.
