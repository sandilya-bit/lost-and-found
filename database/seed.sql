-- ============================================================
--  Lost & Found Management System — Sample Data (PostgreSQL)
--  Capstone Review-II: DML — sample data inserted into ALL tables
-- ------------------------------------------------------------
--  Run AFTER schema.sql. FK values are resolved with subqueries
--  (by email / category name / item name) so the script is
--  order-independent and survives UUID regeneration.
--  Coverage: users ✔ item_categories ✔ (in schema.sql)
--            lost_items ✔ found_items ✔ claims ✔ refresh_tokens ✔
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. users (8 accounts; passwords in the app are bcrypt-hashed)
-- ------------------------------------------------------------
INSERT INTO users (name, email, phone, password_hash, role) VALUES
    ('Demo Explorer', 'demo@lostfound.io',  '+91 90000 00001', '$2a$10$DemoHashedPasswordPlaceholder0001', 'USER'),
    ('Portal Admin',  'admin@lostfound.io', '+91 90000 00002', '$2a$10$AdminHashedPasswordPlaceholder002', 'ADMIN'),
    ('Priya Sharma',  'priya@example.com',  '+91 90000 00003', '$2a$10$PriyaHashedPasswordPlaceholder003', 'USER'),
    ('Rahul Verma',   'rahul@example.com',  '+91 90000 00004', '$2a$10$RahulHashedPasswordPlaceholder004', 'USER'),
    ('Sneha Iyer',    'sneha@example.com',  '+91 90000 00005', '$2a$10$SnehaHashedPasswordPlaceholder005', 'USER'),
    ('Vikram Rao',    'vikram@example.com', '+91 90000 00006', '$2a$10$VikramHashedPasswordPlaceholder06', 'USER'),
    ('Ishaan Gupta',  'ishaan@example.com', '+91 90000 00007', '$2a$10$IshaanHashedPasswordPlaceholder07', 'USER'),
    ('Meera Nair',    'meera@example.com',  '+91 90000 00008', '$2a$10$MeeraHashedPasswordPlaceholder08', 'USER');

-- ------------------------------------------------------------
-- 2. lost_items (20 reports)
-- ------------------------------------------------------------
INSERT INTO lost_items (user_id, category_id, item_name, description, location, date_lost, status) VALUES
    ((SELECT user_id FROM users WHERE email='demo@lostfound.io'),  (SELECT category_id FROM item_categories WHERE name='Wallet'),          'Black Leather Wallet',            'Bifold wallet with three cards inside and a metro pass in the front sleeve. Small scratch near the clasp.', 'Central Library, 2nd Floor',    CURRENT_DATE - 2,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='demo@lostfound.io'),  (SELECT category_id FROM item_categories WHERE name='Electronics'),     'White AirPods Pro Case',          'AirPods Pro 2nd-gen charging case only (no buds), engraved letter ''D'' on the back, slight scuff near the hinge.', 'Central Lawn, Fountain Steps', CURRENT_DATE - 4, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='priya@example.com'),  (SELECT category_id FROM item_categories WHERE name='Water Bottles'),   'Steel Water Bottle',              'Milton bottle, matte navy finish, university fest sticker on the base. Initial ''P'' scratched under the cap.', 'Main Canteen',                 CURRENT_DATE - 5,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='rahul@example.com'),  (SELECT category_id FROM item_categories WHERE name='Books'),           'Chemistry Textbook',              'Morrison & Boyd Organic Chemistry, 7th edition, green cover, highlighted till chapter 6, name on flyleaf.', 'Science Block, Room 204',      CURRENT_DATE - 7,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='sneha@example.com'),  (SELECT category_id FROM item_categories WHERE name='Keys'),            'House Keys on Rabbit Keychain',   'Three keys on a silver ring with a fluffy rabbit keychain and a small LED torch fob.', 'Hostel C Entrance',                 CURRENT_DATE - 9,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='vikram@example.com'), (SELECT category_id FROM item_categories WHERE name='Other'),           'Prescription Spectacles',         'Rectangular frames, thin gold rim, hard-shell case with a lens cloth. Prescription lenses — essential!', 'Auditorium, Row F',            CURRENT_DATE - 11, 'RECOVERED'),
    ((SELECT user_id FROM users WHERE email='ishaan@example.com'), (SELECT category_id FROM item_categories WHERE name='ID Cards'),        'Student ID Card',                 'Campus ID in the name of Ishaan Gupta, department notice pinned lanyard still attached.', 'Sports Complex, Locker Room',  CURRENT_DATE - 13, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='meera@example.com'),  (SELECT category_id FROM item_categories WHERE name='Other'),           'Blue Umbrella',                   'Foldable umbrella with wooden handle, elastic loop has a tiny golden bell charm.', 'East Gate, Bus Stop',                 CURRENT_DATE - 15, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='priya@example.com'),  (SELECT category_id FROM item_categories WHERE name='Jewelry'),         'Silver Anklet Pair',              'Pair of thin anklets with tiny ghungroo beads, gifted — high sentimental value. Kept in a red velvet pouch.', 'Girls'' Common Room, Block B', CURRENT_DATE - 18, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='rahul@example.com'),  (SELECT category_id FROM item_categories WHERE name='Other'),           'Lab Goggles & Calculator',        'Casio fx-991EX calculator taped with a name label, wrapped with clear lab goggles in a plastic pouch.', 'Physics Lab 3',                   CURRENT_DATE - 21, 'RECOVERED'),
    ((SELECT user_id FROM users WHERE email='sneha@example.com'),  (SELECT category_id FROM item_categories WHERE name='Bags'),            'Green Jute Shopping Bag',         'Jute bag with two groceries inside — a packet of almonds and a tin of green tea. Handles tied in a knot.', 'Market Road, Vegetable Stall', CURRENT_DATE - 3,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='vikram@example.com'), (SELECT category_id FROM item_categories WHERE name='Electronics'),     'Bluetooth Speaker (Mini)',        'Cylindrical fabric-covered speaker, blue LED ring, initials ''V.R.'' on the base with a marker.', 'Amphitheatre Steps',               CURRENT_DATE - 6,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='meera@example.com'),  (SELECT category_id FROM item_categories WHERE name='Clothing'),        'Maroon Shawl',                    'Woolen shawl with tassels, smells faintly of lavender, folded inside a transparent zip pouch.', 'Girls'' Hostel, Common Area',      CURRENT_DATE - 8,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='priya@example.com'),  (SELECT category_id FROM item_categories WHERE name='Books'),           'Nursing Chartbook',               'Spiral-bound anatomy chartbook, third edition, colorful sticky tabs on the cardiovascular chapter.', 'Health Sciences Wing, Lobby',      CURRENT_DATE - 10, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='ishaan@example.com'), (SELECT category_id FROM item_categories WHERE name='Sports Equipment'),'Cricket Bat Grip Cover',          'New batting grip in original packaging, slipped out of a kit bag near the pavilion.', 'Cricket Ground, Pavilion Bench',   CURRENT_DATE - 12, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='rahul@example.com'),  (SELECT category_id FROM item_categories WHERE name='Documents'),       'Driver''s Licence Holder',        'Blue leather licence holder with an RTA receipt inside, no cash. Name starts with ''R''.', 'Cafeteria, Juice Counter',     CURRENT_DATE - 14, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='sneha@example.com'),  (SELECT category_id FROM item_categories WHERE name='Electronics'),     'Wired Earphones',                 'White wired earphones with a bent right-angle jack and an ''S'' sticker on the splitter.', 'Library Lift Lobby',           CURRENT_DATE - 16, 'RECOVERED'),
    ((SELECT user_id FROM users WHERE email='vikram@example.com'), (SELECT category_id FROM item_categories WHERE name='Other'),           'Torchlight (Metal Body)',         'Compact aluminium torch with a slightly flickering tail switch, mini compass on the lanyard.', 'North Lawn, Under Bench',          CURRENT_DATE - 19, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='meera@example.com'),  (SELECT category_id FROM item_categories WHERE name='Other'),           'Watercolour Paint Set',           'Pocket watercolour tin with 12 half-pans, several used. A brush with a crimson handle inside.', 'Art Block, Courtyard',             CURRENT_DATE - 24, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='priya@example.com'),  (SELECT category_id FROM item_categories WHERE name='Jewelry'),         'Gold Nose Pin',                   'Tiny gold nose pin in a folded tissue, likely slipped off near the washbasin. Very sentimental.', 'Science Block, Restroom Area',     CURRENT_DATE - 27, 'ACTIVE');

-- ------------------------------------------------------------
-- 3. found_items (20 listings)
-- ------------------------------------------------------------
INSERT INTO found_items (user_id, category_id, item_name, description, location, date_found, status) VALUES
    ((SELECT user_id FROM users WHERE email='demo@lostfound.io'),  (SELECT category_id FROM item_categories WHERE name='Other'),           'Set of Three Golden Pens',        'Three golden ballpoint pens clipped together, engraved ''Academics of 1998'', found near the notice board.', 'Admin Block, Notice Board',    CURRENT_DATE - 1,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='demo@lostfound.io'),  (SELECT category_id FROM item_categories WHERE name='Bags'),            'Canvas Tote Bag with Sketches',   'Beige tote with hand-drawn skylines on both sides, contains an art pencil pouch and a novel.', 'Central Library, Reading Hall', CURRENT_DATE - 3, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='ishaan@example.com'), (SELECT category_id FROM item_categories WHERE name='Electronics'),     'Single Apple Earbud',             'Right-side earbud only, white, serial starts with FV. Kept safe at the desk.', 'Lecture Hall 5, Third Row',    CURRENT_DATE - 6,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='sneha@example.com'),  (SELECT category_id FROM item_categories WHERE name='Wallet'),          'Black Wallet with Cards',         'Brown-and-black wallet containing a gym membership card and a photo — no cash. Owner please describe the photo to claim.', 'Main Canteen, Table 12',    CURRENT_DATE - 8,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='vikram@example.com'), (SELECT category_id FROM item_categories WHERE name='Other'),           'Titanium Spectacle Frame',        'Half-rim glasses in a maroon case found under the seating. Slight bend on the left temple.', 'Auditorium, Back Rows',        CURRENT_DATE - 10, 'RECOVERED'),
    ((SELECT user_id FROM users WHERE email='meera@example.com'),  (SELECT category_id FROM item_categories WHERE name='Books'),           'Novel — ''The Alchemist''',       'Paperback, bookmark at page 140, dedication note on the first page. Kept with the front desk.', 'Central Library, Front Desk',  CURRENT_DATE - 12, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='priya@example.com'),  (SELECT category_id FROM item_categories WHERE name='Clothing'),        'Jacket — Navy Windcheater',       'Size M navy windcheater with a tiny rose embroidery near the pocket, keys in one pocket.', 'Sports Complex, Bleachers',    CURRENT_DATE - 14, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='rahul@example.com'),  (SELECT category_id FROM item_categories WHERE name='Keys'),            'Bunch of Classroom Keys',         'Five keys with a blue ''ROOM 12'' tag on a carabiner clip.', 'Science Block, Corridor Bench',                CURRENT_DATE - 16, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='ishaan@example.com'), (SELECT category_id FROM item_categories WHERE name='Electronics'),     'Smartwatch (Black Strap)',        'Fitness band with cracked screen guard, still powered on showing 09:41. Security office holds it.', 'East Gate, Footpath',      CURRENT_DATE - 19, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='sneha@example.com'),  (SELECT category_id FROM item_categories WHERE name='Jewelry'),         'Gold-Plated Earring (Single)',    'Single jhumka-style earring, gold-plated, small pearl drop. Found while cleaning.', 'Girls'' Common Room, Sofa',            CURRENT_DATE - 22, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='meera@example.com'),  (SELECT category_id FROM item_categories WHERE name='Other'),           'Steel Lunchbox (2-tier)',         'Two-tier steel lunchbox, washed and closed. A small ''M'' is engraved under the handle.', 'Canteen Terrace',              CURRENT_DATE - 2,  'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='ishaan@example.com'), (SELECT category_id FROM item_categories WHERE name='Sports Equipment'),'Football Socks Pair',             'New pair of striped football socks, size L, tags still on, kept in the coach''s office.', 'Football Field, Changing Room', CURRENT_DATE - 4, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='vikram@example.com'), (SELECT category_id FROM item_categories WHERE name='Books'),           'Hindi Novel — ''Gaban''',         'Premchand''s Gaban, old hardbound edition, a train ticket from 2019 used as a bookmark at page 88.', 'Central Park, Reading Circle', CURRENT_DATE - 7, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='priya@example.com'),  (SELECT category_id FROM item_categories WHERE name='Jewelry'),         'Handmade Friendship Bracelet',    'Braided thread bracelet in orange and white with a small shell bead, found intact.', 'Swimming Pool, Entry Steps',   CURRENT_DATE - 9,  'RECOVERED'),
    ((SELECT user_id FROM users WHERE email='rahul@example.com'),  (SELECT category_id FROM item_categories WHERE name='Documents'),       'Scientific Graph Paper Pad',      'Unopened A4 graph paper pad with a calculator sticker on the shrink wrap.', 'Science Block, Notice Board',  CURRENT_DATE - 11, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='sneha@example.com'),  (SELECT category_id FROM item_categories WHERE name='Keys'),            'Bottle Cap Keychain',             'Colorful keychain made from a squashed lemonade cap, no keys attached — someone''s charm?', 'Bus Bay 3, Ground',            CURRENT_DATE - 13, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='vikram@example.com'), (SELECT category_id FROM item_categories WHERE name='Electronics'),     'Laptop Charger (65W)',            'Lenovo 65W brick charger with Velcro-tidied cable, sticker with initials ''T.S.'' on the brick.', 'Computer Lab 2',           CURRENT_DATE - 15, 'RECOVERED'),
    ((SELECT user_id FROM users WHERE email='meera@example.com'),  (SELECT category_id FROM item_categories WHERE name='Other'),           'Ceramic Coffee Mug',              'Hand-painted mug with a peacock design, chipped at the rim, left behind after a club event.', 'Student Activities Room',      CURRENT_DATE - 17, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='priya@example.com'),  (SELECT category_id FROM item_categories WHERE name='Documents'),       'Blood Donor Card Wallet',         'Small red vinyl wallet holding a blood donor card (AB+) and a sticker sheet. No ID inside.', 'Health Centre, Waiting Area',  CURRENT_DATE - 20, 'ACTIVE'),
    ((SELECT user_id FROM users WHERE email='ishaan@example.com'), (SELECT category_id FROM item_categories WHERE name='Electronics'),     'Bluetooth Trackr Tag',            'White rounded trackr tag, battery still alive — it chirps when pressed. Keeps pinging a nearby phone.', 'Sports Complex, Entrance Mat', CURRENT_DATE - 23, 'ACTIVE');

-- ------------------------------------------------------------
-- 4. claims (one of each status; validates trigger behaviour)
-- ------------------------------------------------------------
INSERT INTO claims (user_id, found_id, claim_date, proof_description, claim_status, admin_notes, reviewed_at) VALUES
    ((SELECT user_id  FROM users WHERE email='vikram@example.com'),
     (SELECT found_id FROM found_items WHERE item_name='Titanium Spectacle Frame'),
     now() - INTERVAL '9 days',
     'These are my glasses: half-rim titanium frame, maroon case with a small dent on the lid, and my optometrist sticker (Vision Care, Dr. Rao) inside the left arm. The bend on the left temple happened during the fest.',
     'APPROVED',
     'Verified against case description and optometrist sticker. Returned on campus.',
     now() - INTERVAL '8 days'),
    ((SELECT user_id  FROM users WHERE email='meera@example.com'),
     (SELECT found_id FROM found_items WHERE item_name='Black Wallet with Cards'),
     now() - INTERVAL '5 days',
     'The wallet is mine — it has a gym membership card of GoldFit Centres and a small photo of my dog inside the card slot. The zip pull is slightly bent.',
     'PENDING', NULL, NULL),
    ((SELECT user_id  FROM users WHERE email='ishaan@example.com'),
     (SELECT found_id FROM found_items WHERE item_name='Gold-Plated Earring (Single)'),
     now() - INTERVAL '15 days',
     'I think this earring is my sister''s — it is gold and has a pearl. She lost it around the 20th near the common room.',
     'REJECTED',
     'Claim was for a pair; only one earring was found. Clasp description did not match. Please file again with details.',
     now() - INTERVAL '14 days');

-- ------------------------------------------------------------
-- 5. refresh_tokens (active sessions for two accounts)
-- ------------------------------------------------------------
INSERT INTO refresh_tokens (user_id, token_hash, user_agent, expires_at) VALUES
    ((SELECT user_id FROM users WHERE email='demo@lostfound.io'),
     '9f2c1a4e7b3d5f8a0c6e2d4b8a1f3c5e7d9b0a2c4e6f8d0b2a4c6e8f0d2b4a6c',
     'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', now() + INTERVAL '7 days'),
    ((SELECT user_id FROM users WHERE email='admin@lostfound.io'),
     '1a3c5e7f9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a',
     'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)', now() + INTERVAL '7 days');

COMMIT;

-- ------------------------------------------------------------
-- 6. Verification summary (row counts across every table)
-- ------------------------------------------------------------
SELECT 'users'           AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'item_categories', COUNT(*) FROM item_categories
UNION ALL SELECT 'lost_items',      COUNT(*) FROM lost_items
UNION ALL SELECT 'found_items',     COUNT(*) FROM found_items
UNION ALL SELECT 'claims',          COUNT(*) FROM claims
UNION ALL SELECT 'refresh_tokens',  COUNT(*) FROM refresh_tokens
ORDER BY table_name;
