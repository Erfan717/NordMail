# Kontakt Form Setup Guide

Denne guiden beskriver hvordan du setter opp Netlify Forms med webhook notification til `kontakt`-funksjonen.

## Oversikt

Skjemaet bruker Netlify Forms med:
- **Form name**: `kontakt`
- **Webhook URL**: `https://<site>.netlify.app/.netlify/functions/kontakt`
- **Funksjon**: `netlify/functions/kontakt.js` (Netlify Functions v2)

Funksjonen sender:
1. Admin-email til `kontakt@nordmails.net` med alle felter (reply_to = innsenderens email)
2. Auto-reply til innsender
3. (Valgfritt) Lagrer i Neon database hvis `DATABASE_URL` er satt

## Steg 1: Netlify Dashboard - Environment Variables

1. Gå til [Netlify Dashboard](https://app.netlify.com)
2. Velg ditt site (NordMail)
3. Gå til **Site settings** → **Environment variables**
4. Legg til følgende variabler:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
MAIL_FROM=NordMails <kontakt@nordmails.net>
MAIL_TO_ADMIN=kontakt@nordmails.net
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

**Notater:**
- `RESEND_API_KEY`: Hent fra [Resend Dashboard](https://resend.com/api-keys)
- `MAIL_FROM`: Fra-adresse for alle e-poster
- `MAIL_TO_ADMIN`: Hvor admin-notifikasjoner sendes
- `DATABASE_URL`: (Valgfritt) Neon PostgreSQL connection string

## Steg 2: Netlify Dashboard - Form Notifications (Webhook)

1. Gå til **Site settings** → **Forms** → **Form notifications**
2. Klikk **"Add notification"**
3. Velg **"Webhook"** som notification type
4. Fyll ut:
   - **Event**: `form submission`
   - **URL**: `https://<ditt-site-navn>.netlify.app/.netlify/functions/kontakt`
     - Eksempel: `https://nordmail.netlify.app/.netlify/functions/kontakt`
   - **Form**: Velg `kontakt` fra dropdown
5. Klikk **"Save"**

**Alternativ metode:**
Hvis du ikke ser "Form notifications":
1. Gå til **Forms** i sidebar
2. Klikk på formen `kontakt`
3. Scroll ned til **"Notifications"**
4. Klikk **"Add notification"** → **"Webhook"**
5. Sett URL som beskrevet over

## Steg 3: Netlify Dashboard - Form Success Page

1. Gå til **Site settings** → **Forms**
2. Under "Active forms", finn skjemaet **"kontakt"**
3. Klikk på skjemaet for å åpne innstillinger
4. I feltet **"Success page"** eller **"Redirect URL"**, skriv:
   ```
   /thank-you.html
   ```
5. Klikk **"Save"**

## Steg 4: (Valgfritt) Neon Database Setup

Hvis du vil lagre innsendinger i Neon PostgreSQL:

### 4.1 Opprett tabell i Neon

Logg inn på [Neon Console](https://console.neon.tech) og kjør følgende SQL:

```sql
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
```

### 4.2 Hent Connection String

1. Gå til Neon Dashboard → Ditt prosjekt
2. Klikk på **"Connection Details"**
3. Kopier **"Connection string"** (format: `postgresql://user:password@host/database?sslmode=require`)
4. Legg den til som `DATABASE_URL` i Netlify Environment Variables (se Steg 1)

### 4.3 Test Database Connection

Etter deploy, test at database-lagring fungerer:
1. Send inn et test-skjema
2. Sjekk Netlify Function logs for `database: { saved: true }`
3. Verifiser i Neon at data er lagret

## Steg 5: Deploy og Test

1. **Commit og push** endringene til Git
2. Netlify vil automatisk deploye
3. **Test skjemaet**:
   - Gå til din nettside
   - Fyll ut og send skjemaet
   - Verifiser at du blir redirectet til `/thank-you.html`
   - Sjekk at admin-email mottas
   - Sjekk at auto-reply sendes til innsender
   - Sjekk Netlify Function logs for eventuelle feil

## Troubleshooting

### Webhook triggeres ikke
- Sjekk at webhook URL er korrekt (inkluder `.netlify/functions/kontakt`)
- Sjekk at form name er nøyaktig `kontakt`
- Sjekk Netlify Function logs: **Site settings** → **Functions** → **kontakt** → **Logs**

### E-poster sendes ikke
- Verifiser at `RESEND_API_KEY` er satt korrekt
- Sjekk Resend Dashboard for feilmeldinger
- Sjekk Netlify Function logs for detaljerte feil

### Database lagrer ikke
- Verifiser at `DATABASE_URL` er satt korrekt
- Sjekk at tabellen `leads` eksisterer i Neon
- Sjekk at connection string har riktig format med `?sslmode=require`
- Database-feil vil ikke stoppe funksjonen (den logger bare feilen)

### Honeypot trigges feilaktig
- Sjekk at honeypot-feltet er skjult med `display: none`
- Sjekk at feltnavnet er nøyaktig `bot-field`

## Form Fields

Skjemaet forventer følgende felter:
- `navn` (required)
- `email` (required)
- `nettside` (optional)
- `tjeneste` (optional)
- `budsjett` (optional)
- `melding` (optional)
- `bot-field` (honeypot, hidden)

## Webhook Payload Format

Netlify Forms sender webhook med følgende struktur:

```json
{
  "payload": {
    "form_name": "kontakt",
    "data": {
      "navn": "Ola Nordmann",
      "email": "ola@example.com",
      "nettside": "https://example.com",
      "tjeneste": "klaviyo-setup",
      "budsjett": "10k-20k",
      "melding": "Hei, jeg vil ha hjelp...",
      "bot-field": ""
    },
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

Funksjonen håndterer også alternative payload-strukturer for robusthet.

## Funksjon Response

Funksjonen returnerer JSON med følgende struktur:

**Success:**
```json
{
  "success": true,
  "message": "Emails sent successfully",
  "adminEmail": true,
  "autoReply": true,
  "database": { "saved": true },
  "duration": "234ms"
}
```

**Partial Success (auto-reply failed):**
```json
{
  "success": true,
  "message": "Admin email sent, auto-reply failed",
  "adminEmail": true,
  "autoReply": false,
  "autoReplyError": "...",
  "database": { "saved": true },
  "duration": "234ms"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Failed to send emails",
  "adminEmailError": "...",
  "autoReplyError": "...",
  "database": { "saved": false, "reason": "..." }
}
```

## Sikkerhet

- **Honeypot**: Automatisk spam-filtering via `bot-field`
- **Email validation**: Validerer email-format før sending
- **XSS protection**: HTML-escape i alle e-postmaler
- **Input sanitization**: Alle inputs sanitizes før bruk
- **Error handling**: Trygg logging uten eksponering av sensitive data

## Support

Hvis du opplever problemer:
1. Sjekk Netlify Function logs
2. Sjekk Resend Dashboard for e-post-feil
3. Verifiser alle environment variables
4. Test webhook URL direkte med curl/Postman
