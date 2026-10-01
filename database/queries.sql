-- ============================================================
--  Lost & Found Management System — Queries (PostgreSQL)
--  Capstone Review-II: DML, DQL (joins, aggregates, subqueries,
--  views), and data-integrity demonstrations
-- ------------------------------------------------------------
--  Run AFTER schema.sql + seed.sql. Every failing-demo block
--  catches its own exception so the whole file runs top-to-bottom.
-- ============================================================

-- ============================================================
-- A. DML — INSERT / UPDATE / DELETE operations
-- ============================================================

-- A1. Approve the pending wallet claim → trigger auto-returns the item.
UPDATE claims
   SET claim_status = 'APPROVED',
       admin_notes  = 'Verified: gym card issuer and photo description match the finder''s report.',
       reviewed_at  = now()
 WHERE claim_status = 'PENDING';

-- A2. Claimant edits a lost report (location + description).
UPDATE lost_items
   SET location    = 'East Gate, Bus Stop Shelter',
       description = description || ' (Seen again near the shelter on Tuesday evening.)'
 WHERE item_name = 'Blue Umbrella';

-- A3. Insert + delete a throwaway row (safe DELETE demo).
WITH new_row AS (
    INSERT INTO lost_items (user_id, category_id, item_name, description, location, date_lost)
    VALUES ((SELECT user_id FROM users WHERE email='demo@lostfound.io'),
            (SELECT category_id FROM item_categories WHERE name='Other'),
            'Temp Row For Delete Demo', 'inserted only to demonstrate DELETE', 'DML Demo Bench', CURRENT_DATE)
    RETURNING lost_id
)
DELETE FROM lost_items
 WHERE lost_id = (SELECT lost_id FROM new_row);

-- ============================================================
-- B. DQL — SELECT queries (joins, aggregates, subqueries)
-- ============================================================

-- B1. Three-table INNER JOIN: the browse screen.
SELECT li.item_name, ic.name AS category, li.location, li.date_lost, u.name AS reporter
FROM lost_items li
JOIN item_categories ic ON ic.category_id = li.category_id
JOIN users u            ON u.user_id = li.user_id
WHERE li.status = 'ACTIVE'
ORDER BY li.created_at DESC
LIMIT 10;

-- B2. Aggregate + FULL OUTER JOIN: lost vs found volume per category.
SELECT COALESCE(l.category, f.category) AS category,
       COALESCE(l.lost_count, 0)        AS lost_count,
       COALESCE(f.found_count, 0)       AS found_count
FROM (SELECT ic.name AS category, COUNT(*) AS lost_count
      FROM lost_items li JOIN item_categories ic ON ic.category_id = li.category_id
      GROUP BY ic.name) l
FULL OUTER JOIN
     (SELECT ic.name AS category, COUNT(*) AS found_count
      FROM found_items fi JOIN item_categories ic ON ic.category_id = fi.category_id
      GROUP BY ic.name) f
ON l.category = f.category
ORDER BY lost_count + found_count DESC;

-- B3. LEFT JOIN + HAVING: categories with found listings but zero lost reports.
SELECT ic.name AS category, COUNT(DISTINCT fi.found_id) AS found_listings
FROM item_categories ic
LEFT JOIN found_items fi ON fi.category_id = ic.category_id
LEFT JOIN lost_items  li ON li.category_id  = ic.category_id
GROUP BY ic.name
HAVING COUNT(fi.found_id) > 0 AND COUNT(li.lost_id) = 0;

-- B4. Correlated subquery: finders ranked by resolved (approved) claims.
SELECT u.name AS finder,
       (SELECT COUNT(*) FROM claims c
         JOIN found_items fi ON fi.found_id = c.found_id
         WHERE fi.user_id = u.user_id AND c.claim_status = 'APPROVED') AS approved_claims,
       COUNT(DISTINCT fi.found_id) AS items_listed
FROM users u
JOIN found_items fi ON fi.user_id = u.user_id
GROUP BY u.user_id, u.name
ORDER BY approved_claims DESC, items_listed DESC;

-- B5. Fuzzy search using the pg_trgm index (name similarity).
SELECT item_name, location, similarity(item_name, 'wallet') AS score
FROM lost_items
WHERE item_name % 'wallet'
ORDER BY score DESC;

-- B6. Aggregate over time: recovery rate by month of report.
SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS reported_month,
       COUNT(*)                                             AS reports,
       COUNT(*) FILTER (WHERE status = 'RECOVERED')         AS recovered,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'RECOVERED') / COUNT(*), 1) AS rate_pct
FROM lost_items
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY DATE_TRUNC('month', created_at);

-- ============================================================
-- C. Views — the query layers the application reads from
-- ============================================================

-- C1. Browse screen source.
SELECT * FROM v_active_lost_items LIMIT 5;

-- C2. Found board with live claim counts.
SELECT * FROM v_found_items_open_for_claims ORDER BY claim_count DESC LIMIT 5;

-- C3. Admin review queue (auto-reflects A1 — queue should be empty now).
SELECT COUNT(*) AS pending_in_queue FROM v_claim_review_queue;

-- C4. Stored aggregate function.
SELECT fn_recovery_rate() AS overall_recovery_rate_pct;

-- ============================================================
-- D. Data integrity — constraints & triggers in action
--     Each demo fails ON PURPOSE; the DO block catches the
--     expected error and prints a PASS notice.
-- ============================================================

-- D1. UNIQUE constraint: duplicate email rejected.
DO $$
BEGIN
    INSERT INTO users (name, email, password_hash) VALUES ('Imposter', 'demo@lostfound.io', 'x');
    RAISE NOTICE 'D1 FAIL: duplicate email was accepted';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'D1 PASS: UNIQUE(email) rejected the duplicate';
END $$;

-- D2. CHECK constraint: future date_lost rejected.
DO $$
BEGIN
    INSERT INTO lost_items (user_id, category_id, item_name, location, date_lost)
    VALUES ((SELECT user_id FROM users WHERE email='demo@lostfound.io'),
            (SELECT category_id FROM item_categories WHERE name='Other'),
            'Time Machine', 'Library', CURRENT_DATE + 30);
    RAISE NOTICE 'D2 FAIL: future date was accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'D2 PASS: CHECK(date_lost <= CURRENT_DATE) rejected future date';
END $$;

-- D3. CHECK constraint: claim proof shorter than 20 chars rejected.
DO $$
BEGIN
    INSERT INTO claims (user_id, found_id, proof_description)
    VALUES ((SELECT user_id FROM users WHERE email='demo@lostfound.io'),
            (SELECT found_id FROM found_items WHERE item_name='Novel — ''The Alchemist'''),
            'It is mine');
    RAISE NOTICE 'D3 FAIL: short proof was accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'D3 PASS: CHECK(proof >= 20 chars) rejected short proof';
END $$;

-- D4. Trigger guard: claiming an already-RECOVERED item rejected.
DO $$
BEGIN
    INSERT INTO claims (user_id, found_id, proof_description)
    VALUES ((SELECT user_id FROM users WHERE email='priya@example.com'),
            (SELECT found_id FROM found_items WHERE item_name='Titanium Spectacle Frame'),
            'Proof text long enough to pass the check constraint for the demo.');
    RAISE NOTICE 'D4 FAIL: claim on recovered item was accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'D4 PASS: trigger blocked claim on RECOVERED item';
END $$;

-- D5. Trigger guard: the finder cannot claim their own listing
--     (uses an ACTIVE item so the status check does not fire first).
DO $$
BEGIN
    INSERT INTO claims (user_id, found_id, proof_description)
    VALUES ((SELECT user_id FROM users WHERE email='sneha@example.com'),
            (SELECT found_id FROM found_items WHERE item_name='Bottle Cap Keychain'),
            'Proof text long enough to pass the check constraint for the demo.');
    RAISE NOTICE 'D5 FAIL: self-claim was accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'D5 PASS: trigger blocked the finder''s self-claim';
END $$;

-- D6. Foreign key: referencing a non-existent user rejected.
DO $$
BEGIN
    INSERT INTO lost_items (user_id, category_id, item_name, location, date_lost)
    VALUES ('00000000-0000-0000-0000-000000000000',
            (SELECT category_id FROM item_categories WHERE name='Other'),
            'Orphan Row', 'Nowhere', CURRENT_DATE);
    RAISE NOTICE 'D6 FAIL: FK violation was accepted';
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'D6 PASS: FK(user_id → users) rejected the orphan row';
END $$;

-- D7. ON DELETE CASCADE: removing a user removes their items, claims
--     and sessions — wrapped in a transaction that is rolled back.
BEGIN;
    DELETE FROM users WHERE email = 'meera@example.com';
    SELECT 'D7 PASS: cascade removed all Meera rows'
           WHERE NOT EXISTS (SELECT 1 FROM lost_items li JOIN users u ON u.user_id = li.user_id WHERE u.email = 'meera@example.com')
             AND NOT EXISTS (SELECT 1 FROM found_items fi JOIN users u ON u.user_id = fi.user_id WHERE u.email = 'meera@example.com');
ROLLBACK;

-- ============================================================
-- E. Final state check
-- ============================================================
SELECT (SELECT COUNT(*) FROM users)          AS users,
       (SELECT COUNT(*) FROM lost_items)     AS lost_items,
       (SELECT COUNT(*) FROM found_items)    AS found_items,
       (SELECT COUNT(*) FROM claims)         AS claims,
       (SELECT fn_recovery_rate())           AS recovery_rate_pct;
