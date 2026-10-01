-- ============================================================
--  Lost & Found Management System — Database Schema (PostgreSQL)
--  Capstone Review-II: DDL — tables, constraints, indexes, views
-- ------------------------------------------------------------
--  Entities (6): users, item_categories, lost_items,
--                found_items, claims, refresh_tokens
--  Run order   : schema.sql → seed.sql → queries.sql
--  Re-runnable : every section uses DROP ... IF EXISTS
-- ============================================================

-- ------------------------------------------------------------
-- 0. Clean slate (reverse dependency order)
-- ------------------------------------------------------------
DROP VIEW  IF EXISTS v_active_lost_items;
DROP VIEW  IF EXISTS v_found_items_open_for_claims;
DROP VIEW  IF EXISTS v_claim_review_queue;
DROP TABLE IF EXISTS refresh_tokens   CASCADE;
DROP TABLE IF EXISTS claims           CASCADE;
DROP TABLE IF EXISTS found_items      CASCADE;
DROP TABLE IF EXISTS lost_items       CASCADE;
DROP TABLE IF EXISTS item_categories  CASCADE;
DROP TABLE IF EXISTS users            CASCADE;
DROP TYPE  IF EXISTS user_role;
DROP TYPE  IF EXISTS item_status;
DROP TYPE  IF EXISTS claim_status;
DROP FUNCTION IF EXISTS trg_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS trg_sync_claim_snapshot() CASCADE;
DROP FUNCTION IF EXISTS trg_validate_claim() CASCADE;
DROP FUNCTION IF EXISTS fn_recovery_rate() CASCADE;

-- ------------------------------------------------------------
-- 1. Extensions & enumerated domains
-- ------------------------------------------------------------
-- pg_trgm powers fuzzy name search; gen_random_uuid() is built in on PG13+.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE user_role   AS ENUM ('USER', 'ADMIN');
CREATE TYPE item_status AS ENUM ('ACTIVE', 'RECOVERED');
CREATE TYPE claim_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ------------------------------------------------------------
-- 2. Entity: users
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(80)   NOT NULL,
    email         VARCHAR(120)  NOT NULL UNIQUE,
    phone         VARCHAR(20),
    password_hash VARCHAR(100)  NOT NULL,
    role          user_role     NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_users_email_format CHECK (email LIKE '%_@_%._%'),
    CONSTRAINT ck_users_phone_digits CHECK (phone IS NULL OR phone ~ '^\+?[0-9 ]{7,20}$')
);

COMMENT ON TABLE users IS 'Registered portal accounts; admins review claims.';

-- ------------------------------------------------------------
-- 3. Entity: item_categories (normalizes the category domain)
-- ------------------------------------------------------------
CREATE TABLE item_categories (
    category_id SERIAL       PRIMARY KEY,
    name        VARCHAR(30)  NOT NULL UNIQUE
);

INSERT INTO item_categories (name) VALUES
    ('Electronics'), ('Wallet'), ('Keys'), ('Bags'), ('Documents'),
    ('Jewelry'), ('Clothing'), ('Books'), ('ID Cards'),
    ('Water Bottles'), ('Sports Equipment'), ('Other');

-- ------------------------------------------------------------
-- 4. Entity: lost_items
-- ------------------------------------------------------------
CREATE TABLE lost_items (
    lost_id     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users (user_id)
                              ON DELETE CASCADE ON UPDATE CASCADE,
    category_id INTEGER       NOT NULL REFERENCES item_categories (category_id)
                              ON DELETE RESTRICT ON UPDATE CASCADE,
    item_name   VARCHAR(100)  NOT NULL,
    description TEXT,
    location    VARCHAR(120)  NOT NULL,
    date_lost   DATE          NOT NULL,
    image_url   VARCHAR(500),
    status      item_status   NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_lost_date_not_future CHECK (date_lost <= CURRENT_DATE),
    CONSTRAINT ck_lost_name_len CHECK (length(btrim(item_name)) >= 2)
);

-- ------------------------------------------------------------
-- 5. Entity: found_items
-- ------------------------------------------------------------
CREATE TABLE found_items (
    found_id    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users (user_id)
                              ON DELETE CASCADE ON UPDATE CASCADE,
    category_id INTEGER       NOT NULL REFERENCES item_categories (category_id)
                              ON DELETE RESTRICT ON UPDATE CASCADE,
    item_name   VARCHAR(100)  NOT NULL,
    description TEXT,
    location    VARCHAR(120)  NOT NULL,
    date_found  DATE          NOT NULL,
    image_url   VARCHAR(500),
    status      item_status   NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_found_date_not_future CHECK (date_found <= CURRENT_DATE),
    CONSTRAINT ck_found_name_len CHECK (length(btrim(item_name)) >= 2)
);

-- ------------------------------------------------------------
-- 6. Entity: claims (weak entity — depends on users + found_items)
-- ------------------------------------------------------------
CREATE TABLE claims (
    claim_id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL REFERENCES users (user_id)
                                   ON DELETE CASCADE ON UPDATE CASCADE,
    found_id          UUID         NOT NULL REFERENCES found_items (found_id)
                                   ON DELETE CASCADE ON UPDATE CASCADE,
    claim_date        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    proof_description TEXT         NOT NULL,
    proof_image_url   VARCHAR(500),
    claim_status      claim_status NOT NULL DEFAULT 'PENDING',
    admin_notes       TEXT,
    reviewed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_claim_proof_len CHECK (length(btrim(proof_description)) >= 20),
    CONSTRAINT uq_claim_once_per_item UNIQUE (user_id, found_id)
);

-- ------------------------------------------------------------
-- 7. Entity: refresh_tokens (auth sessions; hashed at rest)
-- ------------------------------------------------------------
CREATE TABLE refresh_tokens (
    refresh_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (user_id)
                           ON DELETE CASCADE ON UPDATE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_agent VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_refresh_expiry CHECK (expires_at > created_at)
);

-- ------------------------------------------------------------
-- 8. Indexes (query-shaped: filters, joins, sorts)
-- ------------------------------------------------------------
CREATE INDEX idx_users_role             ON users (role);
CREATE INDEX idx_lost_items_user        ON lost_items (user_id);
CREATE INDEX idx_lost_items_category    ON lost_items (category_id);
CREATE INDEX idx_lost_items_status_date ON lost_items (status, created_at DESC);
CREATE INDEX idx_lost_items_date        ON lost_items (date_lost);
CREATE INDEX idx_lost_items_name_trgm   ON lost_items USING gin (item_name gin_trgm_ops);
CREATE INDEX idx_found_items_user       ON found_items (user_id);
CREATE INDEX idx_found_items_category   ON found_items (category_id);
CREATE INDEX idx_found_items_status_date ON found_items (status, created_at DESC);
CREATE INDEX idx_found_items_date       ON found_items (date_found);
CREATE INDEX idx_found_items_name_trgm  ON found_items USING gin (item_name gin_trgm_ops);
CREATE INDEX idx_claims_found           ON claims (found_id);
CREATE INDEX idx_claims_status_date     ON claims (claim_status, claim_date DESC);
CREATE INDEX idx_claims_reviewer        ON claims (reviewed_at);
CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expiry  ON refresh_tokens (expires_at);

-- ------------------------------------------------------------
-- 9. Functions & triggers (data integrity automation)
-- ------------------------------------------------------------

-- 9.1 Maintain updated_at on every row change.
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END $$;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER set_lost_items_updated_at
    BEFORE UPDATE ON lost_items
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER set_found_items_updated_at
    BEFORE UPDATE ON found_items
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- 9.2 Auto-return: approving a claim marks the item RECOVERED;
--     a claimed item can no longer accept new claims.
CREATE OR REPLACE FUNCTION trg_sync_claim_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.claim_status = 'APPROVED' THEN
        UPDATE found_items
           SET status = 'RECOVERED'
         WHERE found_id = NEW.found_id;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER claim_status_sync
    AFTER INSERT OR UPDATE OF claim_status ON claims
    FOR EACH ROW EXECUTE FUNCTION trg_sync_claim_snapshot();

-- 9.3 Guard: reject claims on inactive items or on the finder's own item.
CREATE OR REPLACE FUNCTION trg_validate_claim()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    item_status_val item_status;
    finder_id       UUID;
BEGIN
    SELECT status, user_id INTO item_status_val, finder_id
      FROM found_items WHERE found_id = NEW.found_id;

    IF item_status_val <> 'ACTIVE' THEN
        RAISE EXCEPTION 'This item is no longer accepting claims'
            USING ERRCODE = 'check_violation';
    END IF;
    IF finder_id = NEW.user_id THEN
        RAISE EXCEPTION 'The finder cannot claim their own listing'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER validate_claim_insert
    BEFORE INSERT ON claims
    FOR EACH ROW EXECUTE FUNCTION trg_validate_claim();

-- 9.4 Reusable aggregate: overall recovery rate.
CREATE OR REPLACE FUNCTION fn_recovery_rate()
RETURNS NUMERIC LANGUAGE sql STABLE AS $$
    SELECT CASE WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'RECOVERED') / COUNT(*), 1)
           END
    FROM lost_items;
$$;

-- ------------------------------------------------------------
-- 10. Views (DQL convenience layers used by the app)
-- ------------------------------------------------------------

-- 10.1 Active lost items with owner + category resolved (browse screen).
CREATE VIEW v_active_lost_items AS
SELECT li.lost_id,
       li.item_name,
       ic.name            AS category,
       li.location,
       li.date_lost,
       li.status,
       li.image_url,
       li.created_at,
       u.name             AS reporter_name,
       u.email            AS reporter_email
FROM lost_items li
JOIN users u           ON u.user_id = li.user_id
JOIN item_categories ic ON ic.category_id = li.category_id
WHERE li.status = 'ACTIVE';

-- 10.2 Found items still open for claims, with live claim counts.
CREATE VIEW v_found_items_open_for_claims AS
SELECT fi.found_id,
       fi.item_name,
       ic.name            AS category,
       fi.location,
       fi.date_found,
       fi.status,
       fi.image_url,
       u.name             AS finder_name,
       COUNT(c.claim_id)  AS claim_count
FROM found_items fi
JOIN users u            ON u.user_id = fi.user_id
JOIN item_categories ic ON ic.category_id = fi.category_id
LEFT JOIN claims c      ON c.found_id = fi.found_id
WHERE fi.status = 'ACTIVE'
GROUP BY fi.found_id, ic.name, u.name;

-- 10.3 Admin review queue: pending claims with claimant + item context.
CREATE VIEW v_claim_review_queue AS
SELECT c.claim_id,
       c.claim_date,
       c.proof_description,
       cu.name            AS claimant_name,
       cu.email           AS claimant_email,
       fi.item_name,
       fi.location        AS found_location,
       fi.date_found,
       fu.name            AS finder_name
FROM claims c
JOIN users cu        ON cu.user_id = c.user_id
JOIN found_items fi  ON fi.found_id = c.found_id
JOIN users fu        ON fu.user_id = fi.user_id
WHERE c.claim_status = 'PENDING'
ORDER BY c.claim_date;
