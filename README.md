# Börsen Terminal

Ein Echtzeit-Börsenterminal auf Basis von Cloudflare Workers mit Yahoo Finance, SEC EDGAR und Google News.

## Features

- **Kurse & Charts** – Echtzeitkurse mit Firmenfarben, Zeitstempel-Hover, Pre-/Post-Market
- **Heatmap** – Marktübersicht gewichtet nach Marktkapitalisierung (eigener Tab)
- **News** – Suche, Relevanz-Scoring (Quellenvertrauen + Business-Impact + Aktualität), Archiv
- **Watchlisten & Portfolios** – Tab mit Demo-Login, bereit für echte Auth
- **Fundamentals** – SEC EDGAR Filings (10-Q, 10-K, 8-K) direkt im Worker
- **Mehrere Datenprovider** – Yahoo Finance (kostenlos), Finnhub, Twelve Data

## Lokale Entwicklung

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Dann im Browser: `http://localhost:8787`

## Cloudflare Deployment

### 1. GitHub-Repo anlegen

```bash
# Auf github.com ein neues Repo anlegen (z.B. borsen-terminal), dann:
git remote add origin https://github.com/DEIN-USERNAME/borsen-terminal.git
git push -u origin main
```

### 2. Cloudflare API Token holen

1. [dash.cloudflare.com](https://dash.cloudflare.com) → Profil → API Tokens
2. „Create Token" → Template **„Edit Cloudflare Workers"**
3. Token kopieren

### 3. Account ID holen

Cloudflare Dashboard → rechte Seite → Account ID kopieren

### 4. GitHub Secrets setzen

Im GitHub-Repo: Settings → Secrets and variables → Actions → New secret:

| Name | Wert |
|------|------|
| `CLOUDFLARE_API_TOKEN` | Token aus Schritt 2 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID aus Schritt 3 |

### 5. Erstes Deployment

```bash
git push origin main
```

Der GitHub Actions Workflow deployt automatisch auf Cloudflare Workers bei jedem Push auf `main`.

### Manuelles Deployment

```bash
npm run deploy
```

## Umgebungsvariablen (optional)

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `QUOTE_PROVIDER` | `yahoo` | Datenprovider: `yahoo`, `finnhub`, `twelvedata` |
| `FINNHUB_API_KEY` | – | API-Key von finnhub.io |
| `TWELVEDATA_API_KEY` | – | API-Key von twelvedata.com |
| `SEC_USER_AGENT` | `BoersenTerminalPrototype/0.1 hello@example.com` | Pflicht-Header für SEC EDGAR |

Secrets im Live-Betrieb per Wrangler setzen:
```bash
npx wrangler secret put FINNHUB_API_KEY
```

## API-Endpunkte

| Endpoint | Beschreibung |
|----------|--------------|
| `GET /api/quotes?symbols=MSFT,AAPL` | Kurse für mehrere Symbole |
| `GET /api/chart?symbol=MSFT&range=1d&interval=5m` | Chart-Daten |
| `GET /api/fundamentals?symbol=MSFT` | SEC EDGAR Kennzahlen |
| `GET /api/news?symbol=MSFT&limit=20` | News mit Relevanz-Score |
| `GET /api/universe` | Alle bekannten Symbole |
| `GET /api/markets` | Marktübersicht |
| `GET /api/auth/bootstrap` | Auth-Konfiguration (vorbereitet) |

## Nächste Schritte (Schritt 4)

- [ ] Echte Auth via Cloudflare Access oder GitHub OAuth
- [ ] Persistenz: Cloudflare KV oder D1 für Watchlisten/Portfolios
- [ ] Custom Domain im Cloudflare Dashboard konfigurieren
- [ ] Marktkapitalisierungs-Daten verbessern (Premium-Provider)
