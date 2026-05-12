# AGENTS.md

Guidelines for AI agents (Claude Code and others) working in this repository.

## Project overview

This is a personal finance PWA — React + TypeScript + Vite, no backend. Data is encrypted client-side and stored in Google Drive. Stock data comes from the Financial Modeling Prep API. Hosted on Netlify.

## Build & verify

Always run the build before finishing a task. Zero TypeScript errors is the bar.

```bash
npm run build        # tsc + vite build — must pass clean
npm run dev          # dev server on localhost:5173
```

## Key files

| Path | Purpose |
|---|---|
| `src/types.ts` | All shared TypeScript interfaces |
| `src/store/index.ts` | Zustand store — all app state + Drive persistence |
| `src/crypto/aes.ts` | AES-256-GCM encrypt/decrypt via Web Crypto API |
| `src/drive/client.ts` | Google Drive appdata read/write |
| `src/auth/google.ts` | OAuth 2.0 PKCE flow, token management |
| `src/api/fmp.ts` | Financial Modeling Prep API wrapper with in-memory cache |
| `src/parsers/opCsv.ts` | OP Bank CSV → `Transaction[]` |
| `src/parsers/nordnetCsv.ts` | Nordnet CSV → `Holding[]` + `StockTx[]` |
| `src/App.tsx` | Router + auth gate |
| `src/components/layout/Shell.tsx` | Bottom nav shell |

## Architecture rules

- **No backend.** All logic runs in the browser. Do not introduce a server, serverless function, or proxy.
- **No new external dependencies** without a strong reason. The crypto layer uses the built-in Web Crypto API intentionally — do not replace it with a library.
- **Drive persistence** happens automatically on every store mutation via `_persist()`. If you add new persisted state fields, add them to `PersistedData` in `src/store/index.ts` and the `_persist` call.
- **FMP API calls** must go through `src/api/fmp.ts`. The in-memory cache is there to protect the 250 calls/day free tier limit — do not bypass it.
- **Tokens** — the Google access token lives in memory only (`_token` in `src/auth/google.ts`). The refresh token goes to `sessionStorage`. Never write tokens to `localStorage`.

## Styling

- Tailwind CSS only — no inline styles except for dynamic values (e.g. category colors from user data).
- Dark theme (`slate-950` background). Do not add light-mode variants unless the user asks.
- Mobile-first. Test layouts at 390px width.

## Adding a new page

1. Create `src/pages/YourPage.tsx`
2. Add a `<Route>` in `src/App.tsx` inside the `<Shell>` route group
3. Add a nav entry in `src/components/layout/Shell.tsx` if it needs a bottom-nav tab (max 7 tabs)

## Adding a new FMP endpoint

Add a method to the `fmp` object in `src/api/fmp.ts`. Follow the existing pattern: call `get<T>(path, ttl)` with an appropriate cache TTL. Add the response interface above the `fmp` object.

## Do not

- Commit `.env` or `.env.local` — these are gitignored
- Commit the `dist/` folder — Netlify builds from source
- Add analytics, tracking scripts, or any third-party SDK that phones home
- Use `localStorage` for sensitive data
