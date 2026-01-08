# Netlify Forms Redirect Setup

## Problem
Form submissions redirecter ikke til `/thank-you.html` på custom domain.

## Løsning: Konfigurer i Netlify Dashboard

Siden vi har fjernet `action`-attributtet fra formen, må du konfigurere redirect direkte i Netlify Dashboard:

### Steg 1: Gå til Netlify Dashboard
1. Logg inn på [Netlify](https://app.netlify.com)
2. Velg ditt site (NordMail)
3. Gå til **Site settings** → **Forms**

### Steg 2: Konfigurer Success Page
1. Under "Active forms", finn skjemaet **"kontakt"**
2. Klikk på skjemaet for å åpne innstillinger
3. Scroll ned til **"Form settings"** eller **"Success page"**
4. I feltet **"Success page"** eller **"Redirect URL"**, skriv:
   ```
   /thank-you.html
   ```
5. Klikk **"Save"**

### Alternativ: Bruk Netlify Forms Notifications
Hvis du ikke ser "Success page" feltet:
1. Gå til **Site settings** → **Forms** → **Form notifications**
2. Klikk **"Add notification"**
3. Velg **"Redirect"** som notification type
4. Sett URL til: `/thank-you.html`
5. Velg form: **"kontakt"**
6. Klikk **"Save"**

## Test
Etter at du har konfigurert dette:
1. Gå til din nettside (custom domain eller netlify.app)
2. Fyll ut og send inn skjemaet
3. Du skal nå bli redirectet til `/thank-you.html`

## Hvis det fortsatt ikke fungerer
1. Sjekk at `thank-you.html` faktisk er deployet (gå til `https://ditt-domain.com/thank-you.html` direkte)
2. Sjekk Netlify deploy logs for feil
3. Verifiser at custom domain er riktig konfigurert i Netlify
