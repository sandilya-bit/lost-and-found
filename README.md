# Lost & Found Management System — Working Prototype

A full-stack **design** turned into a fully **self-contained working prototype**: report lost items, log found ones, submit ownership claims, browse a seeded campus database — all running entirely in your browser. No server to deploy, no database to configure, nothing to break.

| | |
|---|---|
| **Live app** | https://sandilya-bit.github.io/lost-and-found/ |
| **Backend** | None needed — an in-browser mock API replaces it (see `frontend/src/api/client.ts`) |
| **Hosting** | GitHub Pages (auto-deploys on push to `main`) |
| **Demo account** | `demo@lostfound.io` / `Demo@1234` (one-click button on the sign-in page) |

> **Why a prototype?** The original deployment paired this React SPA with an Express/Prisma API on Render's free tier, which slept constantly and made sign-in fail. The backend has been swapped for an in-browser mock that speaks the exact same API shapes — every feature still works, instantly, even offline.

---

## ✨ What works

- **Sign in / register** with simulated auth (sessions, rate limiting, role checks) — or use the one-click demo button
- **Report lost items** and **log found items** with category, location, date, description, and image preview
- **Edit and delete** your own reports
- **Submit ownership claims** on found items with proof text; statuses move Pending → Approved / Rejected
- **Browse & search** the boards with instant text search, category/status/date filters, sorting, and pagination
- **Personal dashboard** with your lost items, found items, and claims after sign-in
- **Home page** shows live stats and recently-found items **before you sign in**, straight from the fake database
- **Reset demo data** button in the dashboard sidebar restores the original seeded state
- Dark/light mode, glassmorphism UI, serif display type, motion polish

## 🗄 The fake database

Seeded automatically into `localStorage` on first load (`frontend/src/api/mockData.ts`):

| Table | Rows | Notes |
|---|---|---|
| `users` | 8 | 1 demo user, 1 admin, 6 regular members |
| `lost_items` | 20 | wallets, earbuds cases, textbooks, keys, spectacles, ID cards… |
| `found_items` | 20 | golden pens, tote bags, windcheaters, smartwatches, novels… |
| `claims` | 3 | one Approved, one Pending, one Rejected (with admin notes) |

- **Durable:** everything you create/edit/delete persists across reloads
- **Resettable:** "Reset demo data" in the dashboard, or clear site data
- **Isolated:** each browser gets its own private copy — perfect for demos and evaluation

The full production-grade schema this prototype models (3NF, 5 tables, enums, FK indexes, cascades) still lives in [backend/prisma/schema.prisma](backend/prisma/schema.prisma) for reference.

## 🎓 DBMS capstone (Review-II)

The SQL twin of this prototype lives in [`database/`](database/) and satisfies
the Capstone Review-II checklist (DDL with constraints, sample data in all
tables, DML/DQL with joins & aggregates, views, integrity demos):

```bash
psql -U postgres -c "CREATE DATABASE lostfound_review;"
psql -U postgres -d lostfound_review -f database/schema.sql
psql -U postgres -d lostfound_review -f database/seed.sql
psql -U postgres -d lostfound_review -f database/queries.sql
```

The full report — objectives, ER diagram, relational schema, keys, and the
query-to-feature map — is in [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md).

## 🔑 Demo accounts

| Role | Email | Password |
|---|---|---|
| **User (demo)** | `demo@lostfound.io` | `Demo@1234` |
| Admin | `admin@lostfound.io` | `Admin@123` |
| Users | `priya@`, `rahul@`, `sneha@`, `vikram@`, `ishaan@`, `meera@example.com` | `User@1234` |

The login page shows a single one-click **Demo user** button plus a "Fill credentials" option.

## 🗂 Project structure

```
lost-and-found/
├── frontend/                  # The entire working app (React 18 + Vite + MUI v6)
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts      # In-browser mock backend (auth, items, claims, stats)
│   │   │   └── mockData.ts    # Fake database + localStorage persistence
│   │   ├── components/        # ItemCard, StatCard, chips, pagination
│   │   ├── contexts/          # AuthContext (session state), Snackbar, theme
│   │   ├── layouts/           # Public header/footer, dashboard sidebar
│   │   ├── pages/             # Home, Browse, Login, Register, Item detail/form,
│   │   │                      # Claim submission, My items/claims dashboard, About
│   │   └── types/             # Shared domain types
│   └── .env.example
├── database/                  # DBMS capstone SQL implementation (PostgreSQL)
│   ├── schema.sql             # DDL: 6 tables, constraints, indexes, triggers, views
│   ├── seed.sql               # Sample data in every table
│   ├── queries.sql            # DML/DQL: joins, aggregates, views, integrity demos
│   └── README.md              # 10-minute run guide for the review
├── docs/
│   └── PROJECT_REPORT.md      # Capstone report: ER diagram, schema, query map
├── backend/                   # Reference implementation (not required to run the app)
│   ├── prisma/                # schema.prisma + seed.ts — the documented DB design
│   └── src/                   # Express + TS service layer the mock mirrors
└── .github/workflows/
    └── deploy-pages.yml       # Builds & publishes the SPA to GitHub Pages
```

## 🚀 Run it locally

**Prerequisites:** Node ≥ 18.17 and npm. That's it — no database, no API keys.

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Sign in with the demo button (or any account above), report items, submit claims — all state stays in your browser. `npm run build && npm run preview` produces the production bundle.

## ☁️ Deployment

Push to `main`. [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) builds the SPA and publishes it to GitHub Pages at `/lost-and-found/`. There is no backend step — the mock API ships inside the bundle.

## 🔧 Troubleshooting

**"Demo credentials rejected"** — make sure the email is exactly `demo@lostfound.io` (the login page's one-click button is easiest). If you previously registered a different account, that's fine — the seed always includes the demo user.

**"Too many sign-in attempts"** — the mock auth rate-limits at 20 attempts per 15 minutes, like production. Wait, or hit **Reset demo data**.

**Want a clean slate?** Dashboard sidebar → **Reset demo data**, or DevTools → Application → Clear site data.

**Want the real backend instead?** The reference Express/Prisma implementation is in `backend/` (swap `frontend/src/api/client.ts` back to an axios instance pointing at it — the response shapes are identical).

## 🧰 Tech stack

React 18 · TypeScript · Vite · MUI v6 · framer-motion · react-hook-form + zod · localStorage-backed mock API · GitHub Pages · GitHub Actions
