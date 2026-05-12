# finance-guru

A zero-cost, mobile-first Personal Finance PWA installable on Android. Your data stays encrypted in your own Google Drive — no server, no subscription, no third-party storing your finances.

## Features

- **Expense tracking** — import OP Bank CSV exports, auto-categorize transactions, monthly summaries and budget limits
- **Investment portfolio** — import Nordnet CSV exports, live prices via Financial Modeling Prep API, unrealized P/L per position
- **Stock deep dive** — price charts, key figures (P/E, ROE, EV/EBITDA…), quarterly earnings history, income/balance/cashflow statements
- **Net worth tracker** — portfolio + manual assets minus liabilities
- **Finnish capital gains calculator** — 30%/34% tax bracket simulation on any stock sale
- **Encrypted storage** — AES-256-GCM, master passphrase you set, data lives in Google Drive appdata (only this app can read it)
- **PWA** — installable on Android home screen, works offline with cached data

## Architecture

```
Android (PWA, installed from Chrome)
        │
        ▼
React + Vite app (hosted on Netlify — free)
        │
        ├── Google Drive appdata  (your encrypted data)
        └── Financial Modeling Prep API  (live stock data)
```

No backend. Auth is Google OAuth 2.0 PKCE (no client secret needed). All encryption happens in the browser via the Web Crypto API.

## Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 5 + TypeScript |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Encryption | Web Crypto API (built-in) |
| Auth | Google OAuth 2.0 PKCE |
| Storage | Google Drive REST API (`appdata` scope) |
| Stock data | Financial Modeling Prep (free tier) |
| Hosting | Netlify (free tier) |

## Setup

### 1. Google Cloud Console (~10 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable the **Google Drive API**
4. Create an **OAuth 2.0 Web Client** credential
5. Add your Netlify domain to **Authorized JavaScript origins**
6. Add `https://your-app.netlify.app/auth/callback` to **Authorized redirect URIs**

### 2. Environment

Copy `.env.example` to `.env.local` and fill in your client ID:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 3. FMP API key

Sign up for free at [financialmodelingprep.com](https://financialmodelingprep.com). Free tier gives 250 API calls/day — plenty for a personal portfolio. Paste your key in the app's **Settings** page on first launch.

### 4. Deploy

```bash
npm install
npm run build
# Drag dist/ to app.netlify.com, or:
netlify deploy --prod --dir=dist
```

Set `VITE_GOOGLE_CLIENT_ID` as an environment variable in the Netlify dashboard.

### 5. First launch

1. Sign in with Google
2. Set your master passphrase (min 8 chars) — this encrypts all your data
3. Go to **Settings** and paste your FMP API key
4. Go to **Import** and drag in your OP Bank or Nordnet CSV export

## Data imports

| Source | How to export |
|---|---|
| OP Bank | op.fi → Accounts → Transactions → Export CSV |
| Nordnet (holdings) | nordnet.fi → Portfolio → Holdings → Export CSV |
| Nordnet (transactions) | nordnet.fi → Portfolio → Transactions → Export CSV |

Re-importing the same file is safe — transactions are deduplicated by a hash of date + amount + description.

## Security

| Layer | Mechanism |
|---|---|
| Auth | Google OAuth 2.0 PKCE (no server secret) |
| Drive scope | `drive.appdata` — hidden folder, only this app can access |
| Encryption | AES-256-GCM, key derived via PBKDF2 (310 000 iterations) |
| In transit | HTTPS only |
| Token storage | Access token in memory only; refresh token in `sessionStorage` |

Even if your Google account were compromised, an attacker would only get an encrypted blob they cannot read without your passphrase.

## Development

```bash
npm install
npm run dev
```
