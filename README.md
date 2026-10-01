# Lost & Found Management System

A full-stack web application for reporting, browsing, and reclaiming lost items — built with a **React + Material UI** frontend, an **Express + TypeScript** REST API, and a **PostgreSQL** database (Prisma ORM).

| | |
|---|---|
| **Live app** | https://sandilya-bit.github.io/lost-and-found/ |
| **REST API** | https://lostfound-api-nko5.onrender.com/health |
| **Frontend hosting** | GitHub Pages (auto-deploys on push to `main`) |
| **API hosting** | Render free tier (Neon PostgreSQL database) |

---

## ✨ Features

- **Report lost items** and **log found items** with category, location, date, description, and image
- **Submit claims** on found items with proof; admins approve or reject them
- **JWT authentication** with rotating refresh tokens, hashed at rest and revocable server-side
- **Role-based access** (`USER` / `ADMIN`) with admin claim review
- **Search & filter** the boards by category, location, status, and date
- **One-click demo accounts** on the login page for instant exploration
- Premium glassmorphism UI: serif display type, aurora gradients, gold accents, and motion polish

## 🔑 Demo accounts

Seeded automatically when the database is empty (`SEED_ON_START=true`):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@lostfound.io` | `Admin@123` |
| User (demo) | `demo@lostfound.io` | `Demo@1234` |
| Users | `priya@example.com`, `rahul@example.com`, `sneha@example.com`, `vikram@example.com`, `ishaan@example.com`, `meera@example.com` | `User@1234` |

The seed also loads **16 lost items, 16 found items, and 7 claims** so every screen has content. It is idempotent: it only adds rows that are missing, never duplicates or wipes.

## 🗂 Project structure

```
lost-and-found/
├── backend/                 # Express + TypeScript REST API (port 5000)
│   ├── prisma/
│   │   ├── schema.prisma    # Database model (5 tables, 3 enums, full indexing)
│   │   └── seed.ts          # Demo dataset loader (top-up mode, --force to reset)
│   ├── src/
│   │   ├── config/          # env validation, Prisma client, logging
│   │   ├── controllers/     # HTTP handlers (auth, items, claims, admin, upload)
│   │   ├── middleware/      # auth guard, RBAC, rate limiters, security/CORS
│   │   ├── routes/          # /api route table
│   │   ├── services/        # business logic (auth, items, claims, users)
│   │   ├── utils/           # helpers (JWT, hashing, pagination, errors)
│   │   ├── app.ts           # Express app assembly
│   │   └── server.ts        # HTTP listener, DB check, optional auto-seed
│   └── .env.example         # Environment template
├── frontend/                # React 18 + Vite + MUI v6 SPA
│   ├── src/
│   │   ├── api/             # Axios client: auth header, refresh queue, retries
│   │   ├── components/      # Reusable UI
│   │   ├── contexts/        # AuthContext (session state)
│   │   └── pages/           # Login, Register, Browse, Item detail/form, Claims…
│   └── .env.example         # Environment template
├── .github/workflows/
│   └── deploy-pages.yml     # Builds & publishes the SPA to GitHub Pages
└── render.yaml              # Render service blueprint (free tier)
```

## 🗄 Database schema

PostgreSQL via Prisma — normalized to 3NF with cascading foreign keys and query-shaped indexes.

```
users ─┬─< lost_items
       ├─< found_items ─< claims >─ users
       ├─< claims
       └─< refresh_tokens
```

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Accounts & roles | `email` (unique), `password_hash`, `role`, timestamps |
| `lost_items` | Items reported lost | `item_name`, `category`, `location`, `date_lost`, `status` |
| `found_items` | Items handed in | same shape as lost items + `date_found` |
| `claims` | Ownership claims on found items | `proof_description`, `claim_status`, `admin_notes` |
| `refresh_tokens` | Active sessions | `token_hash` (unique), `expires_at`, `revoked_at` |

**Enums:** `user_role` (USER/ADMIN) · `item_status` (ACTIVE/RECOVERED) · `claim_status` (PENDING/APPROVED/REJECTED)

**Indexes:** every foreign key, plus lookup paths — item name, category, location, status, dates, and composite `(status, created_at)` for the browse boards. Deleting a user or a found item cascades to all dependent rows.

## 🚀 Local setup

**Prerequisites:** Node ≥ 18.17, npm, and any PostgreSQL instance (local, or a free one from [Neon](https://neon.tech)).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL + JWT secrets
npm run db:setup            # prisma generate + push schema + seed demo data
npm run dev                 # API on http://localhost:5000
```

Useful scripts: `npm run prisma:studio` (browse data), `npm run db:seed` (top up demo data), `npx tsx prisma/seed.ts --force` (wipe & reseed).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # optional — omit VITE_API_BASE_URL to use the local API
npm run dev                 # app on http://localhost:5173
```

## ☁️ Deployment

- **Frontend → GitHub Pages:** push to `main`; [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) builds with `VITE_API_BASE_URL=https://lostfound-api-nko5.onrender.com` and publishes to the `/lost-and-found/` base path.
- **API → Render:** [render.yaml](render.yaml) defines the free web service. It runs `npx prisma db push && npm start` on boot, so the schema is applied automatically, and `SEED_ON_START=true` loads demo data when the database is empty. Set the `DATABASE_URL` secret in the Render dashboard (a free Neon connection string works).

## 🔧 Troubleshooting

**"Request failed" / cannot sign in on the live site**
The Render free tier spins the API down after ~15 minutes idle; the first request wakes it and can take up to a minute. If it stays unreachable:
1. Open the [Render dashboard](https://dashboard.render.com) → `lostfound-api` → **Logs** and **Manual Deploy → Deploy latest commit** (or Restart).
2. If the service shows *Suspended*, free accounts require a monthly manual resume.
3. Confirm `DATABASE_URL` is set and points at a live Neon database.

**Demo credentials rejected on the live site** — the deployed database may predate the seed. It self-heals on the next deploy (`SEED_ON_START=true`), or run the seed against Neon manually:
```bash
cd backend
DATABASE_URL="<neon-connection-string>" npx tsx prisma/seed.ts
```

**CORS errors** — the API allows only the origins listed in `CLIENT_URL` (comma-separated, exact match). The deployed value already covers `https://sandilya-bit.github.io`.

## 🔐 Security notes

- Passwords hashed with bcrypt; access tokens are short-lived, refresh tokens are stored **hashed** server-side and revocable
- Helmet security headers, strict CORS allow-list, and rate limiting (20 auth attempts / 15 min per IP)
- Uploads validated by MIME type and size; all list endpoints paginated

## 🧰 Tech stack

React 18 · TypeScript · Vite · MUI v6 · framer-motion · react-hook-form + zod · Express · Prisma · PostgreSQL · JWT · Render · GitHub Pages · GitHub Actions
