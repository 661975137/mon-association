-- ============================================================
-- SCHEMA SUPABASE — Gestion Association
-- Supabase > SQL Editor > New query > Run
-- ============================================================

CREATE TABLE IF NOT EXISTS members (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  cotisation_amount NUMERIC DEFAULT 0,
  join_date         TEXT,
  cotisations       JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY,
  date        TEXT,
  type        TEXT NOT NULL CHECK (type IN ('income','expense')),
  category    TEXT NOT NULL,
  description TEXT,
  amount      NUMERIC NOT NULL,
  member_id   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_users (
  id         TEXT PRIMARY KEY,
  name       TEXT,
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'lecteur',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config (
  id   INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}'
);

-- Sécurité RLS
ALTER TABLE members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE config       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON members      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON app_users    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON config       FOR ALL TO anon USING (true) WITH CHECK (true);

-- Temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE app_users;
ALTER PUBLICATION supabase_realtime ADD TABLE config;
