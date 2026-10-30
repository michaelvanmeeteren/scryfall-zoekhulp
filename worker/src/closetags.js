// Finds the Tagger tags whose names share words with a request, so Claude sees them next to the request itself.
// The full list in the system prompt is long; "repeatable card draw" should point at otag:repeatable-draw, not otag:draw.
import { ORACLE_TAGS } from "./tags.js";

const MAX_TAGS = 12;
const RARE_WORD = 12;   // a word in this few tags is telling enough on its own
const IGNORED = new Set(["a", "an", "and", "are", "at", "black", "blue", "by", "can", "card", "cards", "find", "for", "from", "green", "hello", "how", "in", "make", "my", "of", "on", "or", "red", "spell", "spells", "that", "the", "to", "under", "white", "with", "you", "your"]);

const stem = word => word.length > 3 ? word.replace(/ies$/, "y").replace(/s$/, "") : word;
const partsOf = tag => tag.split("-").map(stem);

const TAG_PARTS = ORACLE_TAGS.map(tag => ({ tag, parts: partsOf(tag) }));
const WORD_COUNT = new Map();
for (const { parts } of TAG_PARTS) for (const part of new Set(parts)) WORD_COUNT.set(part, (WORD_COUNT.get(part) || 0) + 1);

export function closeTags(request) {
  const words = new Set(request.toLowerCase().match(/[a-z0-9]+/g)?.filter(w => !IGNORED.has(w)).map(stem) || []);
  if (!words.size) return [];
  const found = [];
  for (const { tag, parts } of TAG_PARTS) {
    const shared = parts.filter(part => words.has(part));
    if (!shared.length) continue;
    const rare = shared.some(part => WORD_COUNT.get(part) <= RARE_WORD);
    if (shared.length < 2 && !rare) continue;
    found.push({ tag, score: shared.length * 10 - (parts.length - shared.length) });
  }
  return found.sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag)).slice(0, MAX_TAGS).map(f => f.tag);
}
