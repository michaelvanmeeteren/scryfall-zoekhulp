-- Shared "Recent searches": every search made with the access code. No names or IP addresses.
CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,       -- ISO time
  zin TEXT NOT NULL,      -- what the person typed
  query TEXT NOT NULL     -- the Scryfall query that was searched
);
