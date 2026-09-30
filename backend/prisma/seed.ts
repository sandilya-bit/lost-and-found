/* Seed script — idempotent:
 *   · fresh database            → full demo dataset
 *   · previously seeded         → tops up with the newer demo items (no wipe)
 *   · `--force`                 → wipes everything and reseeds from scratch
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysAgo = (n: number, hourOffset = 0): Date =>
  new Date(Date.now() - n * 86_400_000 + hourOffset * 3_600_000);

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

/* ------------------------------- Users ---------------------------------- */

const USERS = [
  { name: "Aarav Sharma", email: "admin@lostfound.io", phone: "+91 98200 12345", password: "Admin@123", role: "ADMIN" as const, days: 60 },
  { name: "Priya Nair", email: "priya@example.com", phone: "+91 98111 22334", password: "User@1234", role: "USER" as const, days: 45 },
  { name: "Rahul Verma", email: "rahul@example.com", phone: "+91 98222 33445", password: "User@1234", role: "USER" as const, days: 38 },
  { name: "Sneha Iyer", email: "sneha@example.com", phone: "+91 98333 44556", password: "User@1234", role: "USER" as const, days: 25 },
  { name: "Vikram Patel", email: "vikram@example.com", phone: "+91 98444 55667", password: "User@1234", role: "USER" as const, days: 12 },
  { name: "Demo Explorer", email: "demo@lostfound.io", phone: "+91 90000 00001", password: "Demo@1234", role: "USER" as const, days: 9 },
  { name: "Ishaan Khan", email: "ishaan@example.com", phone: "+91 98555 66778", password: "User@1234", role: "USER" as const, days: 18 },
  { name: "Meera Krishnan", email: "meera@example.com", phone: "+91 98666 77889", password: "User@1234", role: "USER" as const, days: 6 },
];

/* ------------------------------- Items ---------------------------------- */

interface ItemSpec {
  owner: string;
  item_name: string;
  category: string;
  description: string;
  location: string;
  days: number;
}

const ORIGINAL_LOST: ItemSpec[] = [
  { owner: "priya@example.com", item_name: "iPhone 13 (Midnight)", category: "Electronics", description: "Black iPhone 13 with a cracked screen protector and a blue silicone case. Contains important photos.", location: "Central Library, 2nd Floor", days: 6 },
  { owner: "rahul@example.com", item_name: "Brown Leather Wallet", category: "Wallet", description: "Bifold wallet with three cards inside — HDFC debit, metro card and a college ID.", location: "Food Court, Block C", days: 10 },
  { owner: "sneha@example.com", item_name: "Yamaha Keychain with Car Keys", category: "Keys", description: "Set of two car keys on a Yamaha logo keychain, plus a small torch keyring.", location: "Parking Lot B, Near Gate 2", days: 4 },
  { owner: "priya@example.com", item_name: "Gray North Face Backpack", category: "Bags", description: "Laptop backpack with a MacBook charger and engineering notebooks inside.", location: "Auditorium, Row F", days: 15 },
  { owner: "vikram@example.com", item_name: "Class 12 Marksheet Folder", category: "Documents", description: "Blue plastic folder with original marksheet and migration certificate.", location: "Admin Block, Reception", days: 2 },
  { owner: "rahul@example.com", item_name: "Silver Rakhi Bracelet", category: "Jewelry", description: "Thin silver bracelet with a small pendant, sentimental value.", location: "Amphitheater Steps", days: 8 },
  { owner: "sneha@example.com", item_name: "Navy Blue Hoodie", category: "Clothing", description: "Medium-sized hoodie with 'MIT' printed on the back.", location: "Sports Complex, Locker Room", days: 20 },
  { owner: "vikram@example.com", item_name: "Milton Water Bottle (Steel)", category: "Water Bottles", description: "1L steel bottle with stickers of a red dragon on it.", location: "Mechanical Workshop", days: 3 },
];

const NEW_LOST: ItemSpec[] = [
  { owner: "demo@lostfound.io", item_name: "White AirPods Pro Case", category: "Electronics", description: "AirPods Pro 2nd-gen charging case only (no buds), engraved letter 'D' on the back, slight scuff near the hinge.", location: "Central Lawn, Fountain Steps", days: 4 },
  { owner: "ishaan@example.com", item_name: "Sony WH-1000XM4 Headphones", category: "Electronics", description: "Black over-ear headphones with a worn leather headband and 'IK' scratched into the left ear cup.", location: "Central Library, Silent Zone", days: 5 },
  { owner: "meera@example.com", item_name: "Black Umbrella with Wooden Handle", category: "Other", description: "Compact umbrella with a wooden J-handle and a small golden band near the tip.", location: "Main Gate, Security Desk", days: 7 },
  { owner: "vikram@example.com", item_name: "Titan Analog Wrist Watch", category: "Jewelry", description: "Steel-chain analog watch with a black dial; case back engraved 'RVP 2019'.", location: "Canteen, Near Washing Station", days: 3 },
  { owner: "ishaan@example.com", item_name: "Student ID Card — Ishaan Khan", category: "ID Cards", description: "College ID card in a blue lanyard pouch, ID number IT-2023-1147.", location: "Auditorium, Entrance Queue", days: 2 },
  { owner: "priya@example.com", item_name: "Dell Laptop Charger 65W", category: "Electronics", description: "Black brick charger with a coiled cable, wrapped with a strip of purple washi tape.", location: "Lab 204, Workstation 12", days: 9 },
  { owner: "sneha@example.com", item_name: "Gold-rimmed Spectacles", category: "Other", description: "Rectangular glasses with gold rims in a brown leather case, prescription -2.25.", location: "Sports Complex, Bleachers", days: 12 },
  { owner: "rahul@example.com", item_name: "Yonex Badminton Racket", category: "Sports Equipment", description: "Blue-black Yonex Nanoray racket with freshly wrapped grip tape and 'RV' on the shaft.", location: "Sports Complex, Court 3", days: 1 },
];

const ORIGINAL_FOUND: ItemSpec[] = [
  { owner: "vikram@example.com", item_name: "iPhone 13 (Black)", category: "Electronics", description: "Found a black iPhone with cracked screen protector near the library stairs. Locked, shows a blue case.", location: "Central Library, Main Stairs", days: 5 },
  { owner: "priya@example.com", item_name: "Brown Wallet with Cards", category: "Wallet", description: "Bifold leather wallet with an HDFC card and a metro card inside. Handed to security after verification.", location: "Food Court, Near Juice Counter", days: 9 },
  { owner: "rahul@example.com", item_name: "Set of Keys with Torch Keyring", category: "Keys", description: "Car keys with a small torch keyring found in Parking B near the pillar.", location: "Parking Lot B, Pillar 14", days: 3 },
  { owner: "sneha@example.com", item_name: "Blue Plastic Document Folder", category: "Documents", description: "Folder containing a marksheet, seems to be Class 12 CBSE.", location: "Admin Block, Waiting Area", days: 1 },
  { owner: "priya@example.com", item_name: "Milton Steel Bottle with Dragon Sticker", category: "Water Bottles", description: "1L steel bottle, red dragon sticker, half full of water.", location: "Mechanical Workshop, Bench 3", days: 2 },
  { owner: "vikram@example.com", item_name: "Blackearbuds Case (Nothing Ear 1)", category: "Electronics", description: "White-transparent earbuds charging case only, no buds inside.", location: "Canteen, Table 8", days: 7 },
  { owner: "rahul@example.com", item_name: "Engineering Mathematics Textbook", category: "Books", description: "BS Grewal 43rd edition, name 'Aarav' written on first page.", location: "Central Library, Reading Hall", days: 12 },
  { owner: "sneha@example.com", item_name: "Gold-plated Nose Pin", category: "Jewelry", description: "Small nose pin found on the amphitheater steps, kept safely at front desk.", location: "Amphitheater", days: 14 },
];

/* NOTE: index 2 (watch) and 3 (ID card) are referenced by the newer claims. */
const NEW_FOUND: ItemSpec[] = [
  { owner: "demo@lostfound.io", item_name: "Set of Three Golden Pens", category: "Other", description: "Three golden ballpoint pens clipped together, engraved 'Academics of 1998', found near the notice board.", location: "Admin Block, Notice Board", days: 6 },
  { owner: "vikram@example.com", item_name: "Black Over-ear Headphones", category: "Electronics", description: "Black over-ear headphones found in the silent zone; 'IK' initials scratched on the left cup.", location: "Central Library, Silent Zone Shelf", days: 4 },
  { owner: "sneha@example.com", item_name: "Wooden-handle Umbrella", category: "Other", description: "Compact umbrella with a wooden J-handle left at the security desk, golden band near the tip.", location: "Main Gate, Security Desk", days: 6 },
  { owner: "ishaan@example.com", item_name: "Steel Analog Watch", category: "Jewelry", description: "Analog watch with a steel chain and black dial found by the canteen washing station; engraved on the case back.", location: "Canteen, Counter 2", days: 2 },
  { owner: "meera@example.com", item_name: "Blue Lanyard with ID Card", category: "ID Cards", description: "College ID card on a blue lanyard handed in at the auditorium entrance; name starts with 'I'.", location: "Auditorium, Lost & Found Box", days: 1 },
  { owner: "rahul@example.com", item_name: "Dell 65W Charger with Purple Tape", category: "Electronics", description: "Laptop charger with purple washi tape on the brick, left at a corner desk in Lab 204.", location: "Lab 204, Corner Desk", days: 8 },
  { owner: "priya@example.com", item_name: "Gold-rimmed Glasses in Leather Case", category: "Other", description: "Rectangular gold-rimmed spectacles in a brown leather case, found on the bleachers.", location: "Sports Complex, Bleacher Row 2", days: 11 },
  { owner: "meera@example.com", item_name: "Aviator Sunglasses", category: "Other", description: "Aviator sunglasses with green gradient lenses in a black pouch, found on the lawn near the fountain.", location: "Central Lawn, Near Fountain", days: 13 },
];

/* ------------------------------- Seed ------------------------------------ */

export async function seedDatabase(force = false): Promise<void> {
  const [existingAdmin, existingDemo] = await Promise.all([
    prisma.users.findUnique({ where: { email: "admin@lostfound.io" } }),
    prisma.users.findUnique({ where: { email: "demo@lostfound.io" } }),
  ]);

  if (force) {
    // Order respects FK dependencies.
    await prisma.refresh_tokens.deleteMany();
    await prisma.claims.deleteMany();
    await prisma.lost_items.deleteMany();
    await prisma.found_items.deleteMany();
    await prisma.users.deleteMany();
  } else if (existingAdmin && existingDemo) {
    console.log("Seed skipped: database already contains the full demo dataset.");
    return;
  }

  // Top-up mode: an older seed (admin exists, demo doesn't) gets only the
  // newer rows appended; a fresh database gets the complete dataset.
  const isTopUp = !force && !!existingAdmin && !existingDemo;

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  const ownerMap = new Map<string, { user_id: string }>();
  for (const u of USERS) {
    const row = await prisma.users.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        password_hash: hash(u.password),
        role: u.role,
        created_at: daysAgo(u.days),
      },
    });
    ownerMap.set(u.email, row);
  }

  const ownerId = (email: string): string => {
    const row = ownerMap.get(email);
    if (!row) throw new Error(`Seed bug: owner ${email} was not created`);
    return row.user_id;
  };

  const createLost = (s: ItemSpec) =>
    prisma.lost_items.create({
      data: {
        user_id: ownerId(s.owner),
        item_name: s.item_name,
        category: s.category,
        description: s.description,
        location: s.location,
        date_lost: new Date(isoDate(daysAgo(s.days))),
        created_at: daysAgo(s.days),
      },
    });

  const createFound = (s: ItemSpec) =>
    prisma.found_items.create({
      data: {
        user_id: ownerId(s.owner),
        item_name: s.item_name,
        category: s.category,
        description: s.description,
        location: s.location,
        date_found: new Date(isoDate(daysAgo(s.days))),
        created_at: daysAgo(s.days),
      },
    });

  // ---- Lost items --------------------------------------------------------
  const originalLost = isTopUp ? [] : await Promise.all(ORIGINAL_LOST.map(createLost));
  const newLost = await Promise.all(NEW_LOST.map(createLost));

  // ---- Found items -------------------------------------------------------
  const originalFound = isTopUp ? [] : await Promise.all(ORIGINAL_FOUND.map(createFound));
  const newFound = await Promise.all(NEW_FOUND.map(createFound));

  // ---- Claims (original dataset — fresh databases only) ------------------
  if (!isTopUp) {
    const claim1 = await prisma.claims.create({
      data: {
        user_id: ownerId("priya@example.com"),
        found_id: originalFound[0]!.found_id,
        proof_description: "The phone has a cracked screen protector on the top-left corner and a blue silicone case with a small dent near the camera. The lockscreen wallpaper is a photo of Meenakshi temple. I can unlock it to verify — my Google account is priya.nair@ on it.",
        claim_status: "APPROVED",
        admin_notes: "Device unlocked successfully, IMEI matched the lost report. Returned to owner.",
        claim_date: daysAgo(4),
        created_at: daysAgo(4),
      },
    });

    await prisma.found_items.update({
      where: { found_id: originalFound[0]!.found_id },
      data: { status: "RECOVERED" },
    });

    const claim2 = await prisma.claims.create({
      data: {
        user_id: ownerId("rahul@example.com"),
        found_id: originalFound[1]!.found_id,
        proof_description: "Wallet contains an HDFC debit card ending 4821, a Delhi metro card serial DM-998877 and my college ID card. I can name all three cards and show the CVV-hidden card photo I keep at home.",
        claim_status: "PENDING",
        claim_date: daysAgo(2),
        created_at: daysAgo(2),
      },
    });

    const claim3 = await prisma.claims.create({
      data: {
        user_id: ownerId("sneha@example.com"),
        found_id: originalFound[2]!.found_id,
        proof_description: "These are my brother's car keys — Yamaha FZ keychain, torch keyring was a gift from 2021. The car is a white FZ registered in Pune; I can show the RC.",
        claim_status: "PENDING",
        claim_date: daysAgo(1),
        created_at: daysAgo(1),
      },
    });

    const claim4 = await prisma.claims.create({
      data: {
        user_id: ownerId("vikram@example.com"),
        found_id: originalFound[7]!.found_id,
        proof_description: "I think this might be my sister's nose pin but I am not completely sure, just trying my luck.",
        claim_status: "REJECTED",
        admin_notes: "Description too vague; could not verify ownership. Please contact the admin office with a photo.",
        claim_date: daysAgo(6),
        created_at: daysAgo(6),
      },
    });

    await prisma.claims.create({
      data: {
        user_id: ownerId("vikram@example.com"),
        found_id: originalFound[3]!.found_id,
        proof_description: "The folder contains my Class 12 CBSE marksheet, roll number 2265143, and a migration certificate in my name. I can show my Aadhaar for verification.",
        claim_status: "PENDING",
        claim_date: daysAgo(0, 2),
        created_at: daysAgo(0, 2),
      },
    });

    void claim1; void claim2; void claim3; void claim4;
  }

  // ---- Claims (newer dataset — both fresh and top-up runs) ---------------
  const watchClaim = await prisma.claims.create({
    data: {
      user_id: ownerId("vikram@example.com"),
      found_id: newFound[3]!.found_id, // Steel Analog Watch
      proof_description: "It's my Titan watch — the case back is engraved 'RVP 2019', a gift from my father. The crown has a small scratch near the 4 o'clock mark and the strap was replaced last March.",
      claim_status: "APPROVED",
      admin_notes: "Engraving matched the finder's report. Verified and returned to the owner.",
      claim_date: daysAgo(1),
      created_at: daysAgo(1),
    },
  });

  await prisma.found_items.update({
    where: { found_id: newFound[3]!.found_id },
    data: { status: "RECOVERED" },
  });

  const idClaim = await prisma.claims.create({
    data: {
      user_id: ownerId("ishaan@example.com"),
      found_id: newFound[4]!.found_id, // Blue Lanyard with ID Card
      proof_description: "The ID card is mine — Ishaan Khan, IT department, ID number IT-2023-1147. The blue lanyard is from TechnoZion 2023 and still has my hostel wing tag attached.",
      claim_status: "PENDING",
      claim_date: daysAgo(0, 3),
      created_at: daysAgo(0, 3),
    },
  });

  void watchClaim; void idClaim;

  const counts = {
    users: USERS.length,
    lost_items: originalLost.length + newLost.length,
    found_items: originalFound.length + newFound.length,
    claims: isTopUp ? 2 : 7,
    mode: isTopUp ? "top-up" : "full",
  };

  console.log("Seed complete:");
  console.log(`  Admin   → admin@lostfound.io / Admin@123`);
  console.log(`  Demo    → demo@lostfound.io / Demo@1234`);
  console.log(`  Users   → priya@example.com, rahul@example.com, sneha@example.com, vikram@example.com, ishaan@example.com, meera@example.com (password: User@1234)`);
  console.log(`  Data    → ${JSON.stringify(counts)}`);
}

// Allow direct execution: `tsx prisma/seed.ts [--force]`
if (require.main === module) {
  const force = process.argv.includes("--force");
  seedDatabase(force)
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error("Seed failed:", err);
      return prisma.$disconnect().then(() => process.exit(1));
    });
}
