/**
 * Fake database for the self-contained prototype.
 *
 * Everything lives in localStorage under a versioned key, so the app behaves
 * like a real product (create/edit/delete persists across reloads) while
 * shipping zero server infrastructure. Reset by clearing site data.
 */

import type { Claim, FoundItem, ItemStatus, LostItem, Reporter, Role, User } from "../types";

const DB_KEY = "lf_mock_db_v1";

/* ----------------------------- helpers -------------------------------- */

export function uid(prefix = ""): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now().toString(36)}${rnd}`;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function dateOnlyDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function withoutPassword(u: MockUser): User {
  const { password: _password, ...rest } = u;
  return rest;
}

export function toReporter(u: MockUser): Reporter {
  return { user_id: u.user_id, name: u.name, email: u.email, phone: u.phone };
}

/* ----------------------------- accounts ------------------------------- */

export interface MockUser extends User {
  password: string;
}

export const DEMO_CREDENTIALS = { email: "demo@lostfound.io", password: "Demo@1234" };

export function seedUsers(): MockUser[] {
  const t = isoDaysAgo(120);
  return [
    { user_id: "u-demo", name: "Demo Explorer", email: DEMO_CREDENTIALS.email, phone: "+91 90000 00001", password: DEMO_CREDENTIALS.password, role: "USER" as Role, created_at: t, updated_at: t },
    { user_id: "u-admin", name: "Portal Admin", email: "admin@lostfound.io", phone: "+91 90000 00002", password: "Admin@123", role: "ADMIN" as Role, created_at: t, updated_at: t },
    { user_id: "u-priya", name: "Priya Sharma", email: "priya@example.com", phone: "+91 90000 00003", password: "User@1234", role: "USER" as Role, created_at: isoDaysAgo(110), updated_at: isoDaysAgo(110) },
    { user_id: "u-rahul", name: "Rahul Verma", email: "rahul@example.com", phone: "+91 90000 00004", password: "User@1234", role: "USER" as Role, created_at: isoDaysAgo(100), updated_at: isoDaysAgo(100) },
    { user_id: "u-sneha", name: "Sneha Iyer", email: "sneha@example.com", phone: "+91 90000 00005", password: "User@1234", role: "USER" as Role, created_at: isoDaysAgo(90), updated_at: isoDaysAgo(90) },
    { user_id: "u-vikram", name: "Vikram Rao", email: "vikram@example.com", phone: "+91 90000 00006", password: "User@1234", role: "USER" as Role, created_at: isoDaysAgo(80), updated_at: isoDaysAgo(80) },
    { user_id: "u-ishaan", name: "Ishaan Gupta", email: "ishaan@example.com", phone: "+91 90000 00007", password: "User@1234", role: "USER" as Role, created_at: isoDaysAgo(70), updated_at: isoDaysAgo(70) },
    { user_id: "u-meera", name: "Meera Nair", email: "meera@example.com", phone: "+91 90000 00008", password: "User@1234", role: "USER" as Role, created_at: isoDaysAgo(60), updated_at: isoDaysAgo(60) },
  ];
}

/* ------------------------------- items -------------------------------- */

type LostSeed = [owner: string, name: string, cat: string, desc: string, loc: string, days: number, status: ItemStatus];
type FoundSeed = [owner: string, name: string, cat: string, desc: string, loc: string, days: number, status: ItemStatus];

const LOST_SEED: LostSeed[] = [
  ["u-demo", "Black Leather Wallet", "Wallet", "Bifold wallet with three cards inside and a metro pass in the front sleeve. Small scratch near the clasp.", "Central Library, 2nd Floor", 2, "ACTIVE"],
  ["u-demo", "White AirPods Pro Case", "Electronics", "AirPods Pro 2nd-gen charging case only (no buds), engraved letter 'D' on the back, slight scuff near the hinge.", "Central Lawn, Fountain Steps", 4, "ACTIVE"],
  ["u-priya", "Steel Water Bottle", "Water Bottles", "Milton bottle, matte navy finish, university fest sticker on the base. Name initial 'P' scratched under the cap.", "Main Canteen", 5, "ACTIVE"],
  ["u-rahul", "Chemistry Textbook", "Books", " Morrison & Boyd Organic Chemistry, 7th edition, green cover, highlighted till chapter 6, name written on flyleaf.", "Science Block, Room 204", 7, "ACTIVE"],
  ["u-sneha", "House Keys on Rabbit Keychain", "Keys", "Three keys on a silver ring with a fluffy rabbit keychain, also has a small LED torch fob.", "Hostel C Entrance", 9, "ACTIVE"],
  ["u-vikram", "Prescription Spectacles", "Other", "Rectangular frames, thin gold rim, hard-shell case with a lens cloth. Prescription lenses — essential!", "Auditorium, Row F", 11, "RECOVERED"],
  ["u-ishaan", "Student ID Card", "ID Cards", "Campus ID in the name of Ishaan Gupta, department notice pinned lanyard still attached.", "Sports Complex, Locker Room", 13, "ACTIVE"],
  ["u-meera", "Blue Umbrella", "Other", "Foldable umbrella with wooden handle, elastic loop has a tiny golden bell charm.", "East Gate, Bus Stop", 15, "ACTIVE"],
  ["u-priya", "Silver Anklet Pair", "Jewelry", "Pair of thin anklets with tiny ghungroo beads, gifted — of high sentimental value. Kept in a red velvet pouch.", "Girls' Common Room, Block B", 18, "ACTIVE"],
  ["u-rahul", "Lab Goggles & Calculator", "Other", "Casio fx-991EX calculator taped with a name label, wrapped together with clear lab goggles in a plastic pouch.", "Physics Lab 3", 21, "RECOVERED"],
  ["u-sneha", "Green Jute Shopping Bag", "Bags", "Jute bag with two groceries inside — a packet of almonds and a tin of green tea. Handles tied in a knot.", "Market Road, Vegetable Stall", 3, "ACTIVE"],
  ["u-vikram", "Bluetooth Speaker (Mini)", "Electronics", "Cylindrical fabric-covered speaker, blue LED ring, initials 'V.R.' on the base with a marker.", "Amphitheatre Steps", 6, "ACTIVE"],
  ["u-meera", "Maroon Shawl", "Clothing", "Woolen shawl with tassels, smells faintly of lavender, folded inside a transparent zip pouch.", "Girls' Hostel, Common Area", 8, "ACTIVE"],
  ["u-priya", "Nursing Chartbook", "Books", "Spiral-bound anatomy chartbook, third edition, many colorful sticky tabs on the cardiovascular chapter.", "Health Sciences Wing, Lobby", 10, "ACTIVE"],
  ["u-ishaan", "Cricket Bat Grip Cover", "Sports Equipment", "New batsmanship grip in original packaging, slipped out of a kit bag near the pavilion.", "Cricket Ground, Pavilion Bench", 12, "ACTIVE"],
  ["u-rahul", "Driver's Licence Holder", "Documents", "Blue leather licence holder with an RTA receipt inside, no cash. Name starts with 'R'.", "Cafeteria, Juice Counter", 14, "ACTIVE"],
  ["u-sneha", "Earpods Wired Earphones", "Electronics", "White wired earphones with a bent right-angle jack and an 'S' sticker on the splitter.", "Library Lift Lobby", 16, "RECOVERED"],
  ["u-vikram", "Torchlight (Metal Body)", "Other", "Compact aluminium torch with a slightly flickering tail switch, attached mini compass on the lanyard.", "North Lawn, Under Bench", 19, "ACTIVE"],
  ["u-meera", "Watercolour Paint Set", "Other", "Pocket watercolour tin with 12 half-pans, several used. A brush with a crimson handle inside.", "Art Block, Courtyard", 24, "ACTIVE"],
  ["u-priya", "Gold Nose Pin", "Jewelry", "Tiny gold nose pin in a folded tissue, likely slipped off near the washbasin. Very sentimental.", "Science Block, Restroom Area", 27, "ACTIVE"],
];

const FOUND_SEED: FoundSeed[] = [
  ["u-demo", "Set of Three Golden Pens", "Other", "Three golden ballpoint pens clipped together, engraved 'Academics of 1998', found near the notice board.", "Admin Block, Notice Board", 1, "ACTIVE"],
  ["u-demo", "Canvas Tote Bag with Sketches", "Bags", "Beige tote with hand-drawn skylines on both sides, contains an art pencil pouch and a novel.", "Central Library, Reading Hall", 3, "ACTIVE"],
  ["u-ishaan", "Single Apple Earbud", "Electronics", "Right-side earbud only, white, serial starts with FV. Kept safe at the desk.", "Lecture Hall 5, Third Row", 6, "ACTIVE"],
  ["u-sneha", "Black Wallet with Cards", "Wallet", "Empty brown-and-black wallet containing a gym membership card and a photo — no cash. Owner please describe the photo to claim.", "Main Canteen, Table 12", 8, "ACTIVE"],
  ["u-vikram", "Titanium Spectacle Frame", "Other", "Half-rim glasses in a maroon case found under the seating. Slight bend on the left temple.", "Auditorium, Back Rows", 10, "RECOVERED"],
  ["u-meera", "Novel — 'The Alchemist'", "Books", "Paperback, bookmark at page 140, dedication note on the first page. Kept with the front desk.", "Central Library, Front Desk", 12, "ACTIVE"],
  ["u-priya", "Jacket — Navy Windcheater", "Clothing", "Size M navy windcheater with a tiny rose embroidery near the pocket, keys in one pocket.", "Sports Complex, Bleachers", 14, "ACTIVE"],
  ["u-rahul", "Bunch of Classroom Keys", "Keys", "Five keys with a blue 'ROOM 12' tag on a carabiner clip.", "Science Block, Corridor Bench", 16, "ACTIVE"],
  ["u-ishaan", "Smartwatch (Black Strap)", "Electronics", "Fitness band with cracked screen guard, still powered on showing 09:41. Security office holds it.", "East Gate, Footpath", 19, "ACTIVE"],
  ["u-sneha", "Gold-Plated Earring (Single)", "Jewelry", "Single jhumka-style earring, gold-plated, small pearl drop. Found while cleaning.", "Girls' Common Room, Sofa", 22, "ACTIVE"],
  ["u-meera", "Steel Lunchbox (2-tier)", "Other", "Two-tier steel lunchbox, washed and closed. A small 'M' is engraved under the handle.", "Canteen Terrace", 2, "ACTIVE"],
  ["u-ishaan", "Football Socks Pair", "Sports Equipment", "New pair of striped football socks, size L, tags still on, kept in the coach's office.", "Football Field, Changing Room", 4, "ACTIVE"],
  ["u-vikram", "Hindi Novel — 'Gaban'", "Books", "Premchand's Gaban, old hardbound edition, a train ticket from 2019 used as a bookmark at page 88.", "Central Park, Reading Circle", 7, "ACTIVE"],
  ["u-priya", "Handmade Friendship Bracelet", "Jewelry", "Braided thread bracelet in orange and white with a small shell bead, found intact.", "Swimming Pool, Entry Steps", 9, "RECOVERED"],
  ["u-rahul", "Scientific Graph Paper Pad", "Documents", "Unopened A4 graph paper pad with a calculator sticker on the shrink wrap.", "Science Block, Notice Board", 11, "ACTIVE"],
  ["u-sneha", "Bottle Cap Keychain", "Keys", "Colorful keychain made from a squashed lemonade cap, no keys attached — someone's charm?", "Bus Bay 3, Ground", 13, "ACTIVE"],
  ["u-vikram", "Laptop Charger (65W)", "Electronics", "Lenovo 65W brick charger with Velcro-tidied cable, sticker with initials 'T.S.' on the brick.", "Computer Lab 2", 15, "RECOVERED"],
  ["u-meera", "Ceramic Coffee Mug", "Other", "Hand-painted mug with a peacock design, chipped at the rim, left behind after a club event.", "Student Activities Room", 17, "ACTIVE"],
  ["u-priya", "Blood Donor Card Wallet", "Documents", "Small red vinyl wallet holding a blood donor card (AB+) and a sticker sheet. No ID inside.", "Health Centre, Waiting Area", 20, "ACTIVE"],
  ["u-ishaan", "Bluetooth Trackr Tag", "Electronics", "White rounded trackr tag, battery still alive — it chirps when pressed. Keeps pinging a nearby phone.", "Sports Complex, Entrance Mat", 23, "ACTIVE"],
];

function buildItems(users: MockUser[]): { lost: LostItem[]; found: FoundItem[] } {
  const lost: LostItem[] = LOST_SEED.map(([owner, name, cat, desc, loc, days, status], i) => {
    const u = users.find((x) => x.user_id === owner)!;
    return {
      lost_id: `l-seed-${i + 1}`,
      user_id: u.user_id,
      item_name: name,
      category: cat,
      description: desc,
      location: loc,
      date_lost: dateOnlyDaysAgo(days),
      image_url: null,
      status,
      created_at: isoDaysAgo(days),
      reporter: toReporter(u),
      claim_count: 0,
    };
  });
  const found: FoundItem[] = FOUND_SEED.map(([owner, name, cat, desc, loc, days, status], i) => {
    const u = users.find((x) => x.user_id === owner)!;
    return {
      found_id: `f-seed-${i + 1}`,
      user_id: u.user_id,
      item_name: name,
      category: cat,
      description: desc,
      location: loc,
      date_found: dateOnlyDaysAgo(days),
      image_url: null,
      status,
      created_at: isoDaysAgo(days),
      reporter: toReporter(u),
      claim_count: 0,
    };
  });
  return { lost, found };
}

/* ------------------------------- claims ------------------------------- */

export interface MockClaim extends Claim {
  user_id: string;
}

function buildClaims(found: FoundItem[]): MockClaim[] {
  const glasses = found.find((f) => f.found_id === "f-seed-5")!;
  const wallet = found.find((f) => f.found_id === "f-seed-4")!;
  const earring = found.find((f) => f.found_id === "f-seed-10")!;
  const claims: MockClaim[] = [
    {
      claim_id: "c-seed-1",
      user_id: "u-vikram",
      claim_date: isoDaysAgo(9),
      proof_description:
        "These are my glasses: half-rim titanium frame, maroon case with a small dent on the lid, and my optometrist sticker ('Vision Care, Dr. Rao') inside the left arm. The bend on the left temple happened during the fest.",
      proof_image_url: null,
      claim_status: "APPROVED",
      admin_notes: "Verified against case description and optometrist sticker. Returned on campus.",
      created_at: isoDaysAgo(9),
      user: { user_id: "u-vikram", name: "Vikram Rao", email: "vikram@example.com", phone: "+91 90000 00006" },
      found_item: {
        found_id: glasses.found_id,
        item_name: glasses.item_name,
        category: glasses.category,
        location: glasses.location,
        date_found: glasses.date_found,
        image_url: glasses.image_url,
        status: glasses.status,
        reporter: { user_id: glasses.reporter!.user_id, name: glasses.reporter!.name, email: glasses.reporter!.email },
      },
    },
    {
      claim_id: "c-seed-2",
      user_id: "u-meera",
      claim_date: isoDaysAgo(5),
      proof_description:
        "The wallet is mine — it has a gym membership card of 'GoldFit Centres' and a small photo of my dog inside the card slot. The zip pull is slightly bent.",
      proof_image_url: null,
      claim_status: "PENDING",
      admin_notes: null,
      created_at: isoDaysAgo(5),
      user: { user_id: "u-meera", name: "Meera Nair", email: "meera@example.com", phone: "+91 90000 00008" },
      found_item: {
        found_id: wallet.found_id,
        item_name: wallet.item_name,
        category: wallet.category,
        location: wallet.location,
        date_found: wallet.date_found,
        image_url: wallet.image_url,
        status: wallet.status,
        reporter: { user_id: wallet.reporter!.user_id, name: wallet.reporter!.name, email: wallet.reporter!.email },
      },
    },
    {
      claim_id: "c-seed-3",
      user_id: "u-ishaan",
      claim_date: isoDaysAgo(15),
      proof_description: "I think this earring is my sister's — it is gold and has a pearl. She lost it around the 20th near the common room.",
      proof_image_url: null,
      claim_status: "REJECTED",
      admin_notes: "Claim was for a pair; only one earring was found. Description of the clasp did not match. Please file again with details.",
      created_at: isoDaysAgo(15),
      user: { user_id: "u-ishaan", name: "Ishaan Gupta", email: "ishaan@example.com", phone: "+91 90000 00007" },
      found_item: {
        found_id: earring.found_id,
        item_name: earring.item_name,
        category: earring.category,
        location: earring.location,
        date_found: earring.date_found,
        image_url: earring.image_url,
        status: earring.status,
        reporter: { user_id: earring.reporter!.user_id, name: earring.reporter!.name, email: earring.reporter!.email },
      },
    },
  ];
  // Wire derived state: claims bump the item's claim counts.
  earring.claim_count = 1;
  wallet.claim_count = 1;
  glasses.claim_count = 1;
  return claims;
}

/* ------------------------------- store -------------------------------- */

export interface MockDb {
  users: MockUser[];
  lost: LostItem[];
  found: FoundItem[];
  claims: MockClaim[];
}

export function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    /* corrupted store — fall through to reseed */
  }
  const users = seedUsers();
  const { lost, found } = buildItems(users);
  const claims = buildClaims(found);
  const db: MockDb = { users, lost, found, claims };
  saveDb(db);
  return db;
}

export function saveDb(db: MockDb): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage full/unavailable — prototype keeps running in memory */
  }
}

export function resetDb(): MockDb {
  try {
    localStorage.removeItem(DB_KEY);
  } catch {
    /* ignore */
  }
  return loadDb();
}

export { isoDaysAgo, withoutPassword };
