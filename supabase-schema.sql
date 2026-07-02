-- Kör detta i Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- OBS: Denna fil ersätter den tidigare versionen helt.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Spelledare (game masters)
CREATE TABLE IF NOT EXISTS spelledare (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Underlagsfrågor (alla frågor, ursprungliga + tillagda)
CREATE TABLE IF NOT EXISTS underlagsfragor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fraga TEXT NOT NULL,
  beskrivning TEXT,
  typ TEXT DEFAULT 'text' CHECK (typ IN ('text', 'number')),
  min_varde INTEGER,
  max_varde INTEGER,
  max_langd INTEGER DEFAULT 200,
  ar_ursprunglig BOOLEAN DEFAULT FALSE,
  skapad_av_spelledare_id UUID REFERENCES spelledare(id) ON DELETE SET NULL,
  ordning INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spelomgångar
CREATE TABLE IF NOT EXISTS spelomgangar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kod TEXT UNIQUE NOT NULL,
  namn TEXT NOT NULL,
  spelledare_id UUID REFERENCES spelledare(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'skapad' CHECK (status IN ('skapad', 'fas1', 'fas2', 'avslutad')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spelomgangar_kod ON spelomgangar(kod);
CREATE INDEX IF NOT EXISTS idx_spelomgangar_spelledare_id ON spelomgangar(spelledare_id);

-- Vilka frågor ingår i en spelomgång
CREATE TABLE IF NOT EXISTS spelomgang_fragor (
  spelomgang_id UUID REFERENCES spelomgangar(id) ON DELETE CASCADE,
  fraga_id UUID REFERENCES underlagsfragor(id) ON DELETE RESTRICT,
  ordning INTEGER DEFAULT 0,
  PRIMARY KEY (spelomgang_id, fraga_id)
);

-- Spelare
CREATE TABLE IF NOT EXISTS spelare (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spelomgang_id UUID REFERENCES spelomgangar(id) ON DELETE CASCADE,
  namn TEXT NOT NULL,
  har_svarat BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spelare_spelomgang_id ON spelare(spelomgang_id);

-- Svar (dynamisk – ett svar per spelare per fråga)
CREATE TABLE IF NOT EXISTS svar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spelare_id UUID REFERENCES spelare(id) ON DELETE CASCADE,
  spelomgang_id UUID REFERENCES spelomgangar(id) ON DELETE CASCADE,
  fraga_id UUID REFERENCES underlagsfragor(id) ON DELETE CASCADE,
  svar_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spelare_id, fraga_id)
);

CREATE INDEX IF NOT EXISTS idx_svar_spelomgang_id ON svar(spelomgang_id);

-- Inaktivera RLS
ALTER TABLE spelledare DISABLE ROW LEVEL SECURITY;
ALTER TABLE underlagsfragor DISABLE ROW LEVEL SECURITY;
ALTER TABLE spelomgangar DISABLE ROW LEVEL SECURITY;
ALTER TABLE spelomgang_fragor DISABLE ROW LEVEL SECURITY;
ALTER TABLE spelare DISABLE ROW LEVEL SECURITY;
ALTER TABLE svar DISABLE ROW LEVEL SECURITY;

-- Ursprungliga underlagsfrågor (körs en gång)
INSERT INTO underlagsfragor (fraga, beskrivning, typ, min_varde, max_varde, ar_ursprunglig, ordning) VALUES
  ('Vilket år är du född?', 'Svara med ÅÅÅÅ', 'number', 1900, 2025, true, 1),
  ('Vilken artist eller musikgrupp önskar du kommer hit och spelar för oss ikväll?', 'Fritext, max 50 tecken', 'text', null, null, true, 2),
  ('Vilken film har du sett flest gånger?', null, 'text', null, null, true, 3),
  ('Du är tvungen att äta samma maträtt i en hel vecka. Vilken maträtt väljer du?', null, 'text', null, null, true, 4),
  ('Var vill du helst vara nu i sommar på semestern?', null, 'text', null, null, true, 5),
  ('Vilket/vilka samtalsämnen vill du ha ikväll?', null, 'text', null, null, true, 6),
  ('Vilket land vinner fotbolls-VM 2026?', null, 'text', null, null, true, 7)
ON CONFLICT DO NOTHING;
