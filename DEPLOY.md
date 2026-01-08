# Netlify Deploy Guide - NordMail

Denne guiden viser deg hvordan du deployer NordMail-nettsiden på Netlify.

## Forutsetninger

- GitHub repository (dette prosjektet)
- Netlify-konto (gratis konto fungerer fint)

## Steg 1: Push til GitHub

Hvis du ikke allerede har pushet koden til GitHub:

```bash
# Sjekk at du er på riktig branch
git status

# Legg til alle filer
git add .

# Commit endringene
git commit -m "Initial commit: NordMail website"

# Push til GitHub
git push origin main
```

(Erstatt `main` med din branch-navn hvis du bruker en annen)

## Steg 2: Import til Netlify

1. Gå til [Netlify](https://www.netlify.com) og logg inn
2. Klikk på **"Add new site"** → **"Import an existing project"**
3. Velg **"Deploy with GitHub"** (eller GitLab/Bitbucket hvis du bruker det)
4. Autoriser Netlify til å koble til GitHub hvis nødvendig
5. Velg repository: `Erfan717/NordMail` (eller ditt repo-navn)
6. Netlify vil automatisk oppdage innstillingene:
   - **Build command:** (ingen - dette er en statisk side)
   - **Publish directory:** `/` (root)
7. Klikk **"Deploy site"**

## Steg 3: Konfigurer Netlify Forms

Etter at siden er deployet:

1. Gå til **Site settings** → **Forms**
2. Netlify vil automatisk oppdage skjemaet med `data-netlify="true"`
3. Skjemaet vil vises under "Active forms" som "kontakt"
4. For å motta e-post-notifikasjoner:
   - Gå til **Site settings** → **Forms** → **Form notifications**
   - Klikk **"Add notification"**
   - Velg **"Email notifications"**
   - Legg til din e-postadresse
   - Velg trigger: **"On form submission"**
   - Velg form: **"kontakt"**
   - Klikk **"Save"**

## Steg 4: Test Skjemaet

1. Gå til din deployede nettside (f.eks. `https://random-name-123.netlify.app`)
2. Fyll ut kontaktskjemaet
3. Send inn skjemaet
4. Du skal bli redirectet til `/thank-you`
5. Sjekk at du mottar e-post-notifikasjon fra Netlify

## Steg 5: Sett opp Custom Domain (Valgfritt)

1. Gå til **Site settings** → **Domain management**
2. Klikk **"Add custom domain"**
3. Legg til ditt domene (f.eks. `nordmail.no`)
4. Følg instruksjonene for å konfigurere DNS:
   - Legg til CNAME-record som peker til din Netlify-URL
   - Eller legg til A-records som peker til Netlify IP-adresser
5. Vent på at SSL-sertifikatet blir generert (automatisk, tar noen minutter)

## Steg 6: Verifiser Redirect

Sørg for at redirect til `/thank-you` fungerer:

1. Netlify Forms redirecter automatisk til `action`-attributtet
2. I vårt tilfelle har vi ikke `action`, så vi må legge det til i `netlify.toml` eller bruke Netlify Forms success page

**Alternativ løsning:** Legg til en `netlify.toml` fil i root:

```toml
[[redirects]]
  from = "/kontakt"
  to = "/thank-you"
  status = 200
```

Men siden vi bruker standard Netlify Forms, vil redirect automatisk skje til `/thank-you` etter submit.

## Viktige Notater

- **Netlify Forms:** Fungerer automatisk med `data-netlify="true"` attributtet
- **Honeypot:** `bot-field` er allerede implementert for spam-beskyttelse
- **SSL:** Netlify gir automatisk SSL-sertifikater for alle domener
- **Build:** Ingen build-prosess nødvendig - dette er ren HTML/CSS/JS
- **Forms Limit:** Gratis Netlify-konto har 100 submissions/måned (nok for de fleste)

## Troubleshooting

### Skjemaet sender ikke
- Sjekk at `data-netlify="true"` er på `<form>` taggen
- Sjekk at `name="kontakt"` matcher `form-name` hidden input
- Sjekk Netlify Forms i dashboard for feilmeldinger

### Redirect fungerer ikke
- Sjekk at `thank-you.html` eksisterer i root
- Sjekk Netlify Forms settings for success page

### E-post-notifikasjoner kommer ikke
- Sjekk spam-mappen
- Verifiser at e-postnotifikasjoner er aktivert i Netlify
- Sjekk at e-postadressen er riktig i notifikasjonsinnstillingene

## Neste Steg

- Legg til Google Analytics (valgfritt)
- Legg til tracking pixels (valgfritt)
- Optimaliser bilder hvis du legger til noen senere
- Test på ulike enheter og nettlesere

---

**Lykke til med deploy! 🚀**
