# Database Implementation — Capstone Review-II

PostgreSQL implementation of the Lost & Found Management System: DDL with full
constraints, sample data in every table, DML/DQL operations, views, and live
integrity demonstrations.

## Run order (10 minutes, top to bottom)

```bash
psql -U postgres -c "CREATE DATABASE lostfound_review;"
psql -U postgres -d lostfound_review -f schema.sql     # DDL — tables, constraints, indexes, triggers, views
psql -U postgres -d lostfound_review -f seed.sql       # DML — sample data in all 6 tables
psql -U postgres -d lostfound_review -f queries.sql    # DML/DQL — joins, aggregates, views, integrity demos
```

Every script is re-runnable: the schema drops its own objects first, and the
seed/queries scripts assume a fresh schema run.

## What each file demonstrates

| File | Review-II requirement | Highlights |
|---|---|---|
| `schema.sql` | Create tables with constraints | 6 entities, 3 enums, PK/FK/CHECK/UNIQUE, 16 indexes (incl. GIN trigram), 4 triggers, 2 stored functions, 3 views |
| `seed.sql` | Insert sample data into all tables | 8 users · 20 lost · 20 found · 3 claims (one per status) · 2 sessions, FKs resolved by lookup |
| `queries.sql` | DML, DQL (joins, aggregates, views), integrity | INNER/LEFT/FULL OUTER joins, correlated subqueries, `FILTER`, fuzzy trigram search, 7 self-logging constraint demos |

## Integrity features to point out during the demo

- `UNIQUE(email)`, `UNIQUE(user_id, found_id)` (one claim per item), `UNIQUE(token_hash)`
- `CHECK` — non-future item dates, ≥ 2-char names, ≥ 20-char claim proof, valid phone regex, token expiry after creation
- **Triggers** — `updated_at` maintenance; approving a claim auto-returns the item; claims on RECOVERED items and finders' self-claims are blocked with clear errors
- **ON DELETE CASCADE** — removing a user removes their items, claims, and sessions (rolled-back demo in D7)
- `ON DELETE RESTRICT` on categories — can't orphan item rows

## App ↔ database parity

The live prototype (`frontend/src/api/client.ts`) mirrors this exact design in
localStorage; `schema.sql` is the production-grade SQL version of the same
model, so the demo and the SQL walkthrough tell one story.
