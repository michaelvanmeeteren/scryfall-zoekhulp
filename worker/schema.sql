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

-- Request counters per visitor (IP address) and time window, for the limits in src/index.js.
-- kind: translate (per minute) or badcode (wrong access or admin code, per hour). Old rows are removed by the cron trigger.
CREATE TABLE IF NOT EXISTS hits (
  kind TEXT NOT NULL,
  ip TEXT NOT NULL,
  win INTEGER NOT NULL,       -- number of the time window
  expires INTEGER NOT NULL,   -- Unix seconds after which the row can go
  n INTEGER NOT NULL,
  PRIMARY KEY (kind, ip, win)
);
