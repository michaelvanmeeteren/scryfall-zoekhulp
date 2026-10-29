-- No longer used: held the shared "Recent searches", which were removed (table kept empty).
CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,       -- ISO time
  zin TEXT NOT NULL,      -- what the person typed
  query TEXT NOT NULL     -- the Scryfall query that was searched
);

-- Claude usage per day, for the owner's cost overview (stats.html). kind: search, correction or warmup.
CREATE TABLE IF NOT EXISTS usage (
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  calls INTEGER NOT NULL,
  input INTEGER NOT NULL,
  cache_read INTEGER NOT NULL,
  cache_write INTEGER NOT NULL,
  output INTEGER NOT NULL,
  PRIMARY KEY (day, kind)
);
