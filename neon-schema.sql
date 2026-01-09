-- Neon PostgreSQL Schema for NordMail Kontakt Form
-- 
-- Dette skriptet oppretter tabellen for å lagre form submissions
-- Kjør dette i Neon SQL Editor etter at du har opprettet databasen

-- Opprett leads-tabell
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    navn VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    nettside VARCHAR(500),
    tjeneste VARCHAR(100),
    budsjett VARCHAR(100),
    melding TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Opprett indeks på email for raskere søk
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Opprett indeks på created_at for sortering
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- (Valgfritt) Opprett indeks på tjeneste for filtrering
CREATE INDEX IF NOT EXISTS idx_leads_tjeneste ON leads(tjeneste);

-- Kommentarer
COMMENT ON TABLE leads IS 'Lagrer kontakt form submissions fra NordMail nettside';
COMMENT ON COLUMN leads.navn IS 'Kundens navn';
COMMENT ON COLUMN leads.email IS 'Kundens e-postadresse';
COMMENT ON COLUMN leads.nettside IS 'Kundens nettside URL (valgfritt)';
COMMENT ON COLUMN leads.tjeneste IS 'Ønsket tjeneste (klaviyo-setup, email-flows, etc.)';
COMMENT ON COLUMN leads.budsjett IS 'Budsjett-range (under-10k, 10k-20k, etc.)';
COMMENT ON COLUMN leads.melding IS 'Frivillig melding fra kunden';
COMMENT ON COLUMN leads.created_at IS 'Når innsendingen ble mottatt';

-- Eksempel: Hent alle leads sortert etter dato
-- SELECT * FROM leads ORDER BY created_at DESC;

-- Eksempel: Hent leads for en spesifikk tjeneste
-- SELECT * FROM leads WHERE tjeneste = 'klaviyo-setup' ORDER BY created_at DESC;

-- Eksempel: Hent leads fra siste 30 dager
-- SELECT * FROM leads WHERE created_at >= NOW() - INTERVAL '30 days' ORDER BY created_at DESC;
