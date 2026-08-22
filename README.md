# Графік їжі — Meal Planner (Next.js + TypeScript)

A phone-first PWA for planning a month of meals, generating a categorized
shopping list, and syncing across devices. Menus are generated in a chat with
**Claude** and imported as JSON — the app deliberately holds **no API key**;
the LLM stays outside the client.

**Live demo:** _add your Vercel URL here after deploy_

This is a full rewrite of an original vanilla-JS PWA into a typed **React 19 /
Next.js (App Router)** codebase — same product, real component architecture.

---

## Features

- **Month calendar** with per-day meals (breakfast / lunch / dinner / snack), meal dots, and previews.
- **Import from Claude** — paste the JSON Claude returns; robust parser tolerates ```json fences and surrounding prose. Merge or replace.
- **Export** the current month or the whole plan as JSON (to save or send back to Claude for edits).
- **Products**
  - **Calorie norm** — Mifflin–St Jeor BMR × activity × goal; splits the target across meals and derives a portion-scaling factor for the whole plan.
  - **Dishes** — unique dishes for the month, deduplicated with counts and scaled calories.
  - **Shopping list** — aggregated quantities grouped into *pantry*, *freezer*, and *fresh-by-week*, with per-item purchase tracking and progress.
- **Cloud sync** — Firebase Auth + Firestore, layered over localStorage. A non-destructive merge means an empty device never wipes a filled cloud (and vice-versa).
- **PWA** — installable, offline-friendly, phone-first, dark-mode aware.

## Tech

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| State | Custom hooks (`usePlan`, `useSync`) over `useState` + `localStorage` |
| Cloud | Firebase Auth + Firestore (client SDK) |
| Styling | Hand-authored CSS, CSS custom properties, light/dark themes |

## Architecture

```
app/            layout + page (composition root, client component)
components/      Calendar, DaySheet, ImportSheet, ExportSheet,
                 ProductsSheet, AccountSheet, Sheet, Icon, Toast
hooks/
  usePlan.ts     store + view state, mutators, localStorage persistence
  useSync.ts     Firebase auth + Firestore snapshot, debounced push, merge
lib/
  types.ts       domain types (Store, DayMeals, Profile, …)
  foodData.ts    food DB, constants, pure calorie/format/date helpers
  plan.ts        pure derivations: dishes, shopping list, import/export, prompt
  store.ts       normalize, load/save, cloud merge logic
  firebase.ts    lazy, env-driven init (guarded when unconfigured)
```

Business logic in `lib/` is **pure and framework-free** — the same functions
that render the UI are trivially unit-testable.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: fill in Firebase to enable cloud sync
npm run dev                  # http://localhost:3000
```

Without Firebase env vars the app runs fully on `localStorage`; the Account
sheet simply reports that sync is not configured.

## Deploy

Push to GitHub and import the repo on [Vercel](https://vercel.com). Add the
`NEXT_PUBLIC_FIREBASE_*` variables from `.env.example` in the project settings.

## Firebase config

The `NEXT_PUBLIC_FIREBASE_*` values are public and safe on the client — access
is enforced by Firestore security rules, so each signed-in user can read and
write only their own `plans/{uid}` document.
