# Copilot Instructions

## Build, lint, test
- Frontend build: `npm run build`
- Frontend lint (typecheck): `npm run lint`
- Functions build: `npm --prefix functions run build`
- Tests: no test scripts are configured in package.json.

## High-level architecture
- Vite + React SPA in `src/`, with `App.tsx` as the main UI and `main.tsx` as the entry that registers the service worker.
- Global state and data access live in `src/context/FinanceContext.tsx` via `FinanceProvider`/`useFinance`, backed by Firebase Auth + Firestore realtime listeners.
- Firebase client setup is in `src/firebase.ts`, using `VITE_FIREBASE_*` env vars and optional `VITE_FIREBASE_VAPID_KEY` for FCM.
- Firestore data model is per-user under `users/{uid}/` with subcollections like `transactions`, `recurringExpenses`, `wheels`, `settings/current`, and `pushTokens`.
- `public/sw.js` combines PWA caching with Firebase Cloud Messaging background handling and notification click routing.
- Cloud Functions in `functions/src/index.ts` handle scheduled recurring-expense reminders and a diagnostic HTTP endpoint.
- Savings goals are stored client-side in `localStorage` rather than Firestore.

## Key conventions
- New documents use `crypto.randomUUID()` for ids and include `uid` on the payload.
- Recurring payment transactions use id format `${recurringId}-${periodKey}`, where `periodKey` is `YYYY-MM` (monthly) or `YYYY-MM-DD` (daily/weekly); `lastNotifiedKey` follows the same scheme.
- Push tokens are stored as document ids in `users/{uid}/pushTokens` (functions read token ids from document ids).
- Notification actions flow through the service worker: it posts `mona-recurring-action` messages or deep-links with `recurringId`, `periodKey`, and `rAction` query params.
- Budget limits live in `settings.budgets`; delete a category key when clearing a budget and remove the field when empty.
- Savings goals are persisted under the key `mona_goals_${uid}` in localStorage.
