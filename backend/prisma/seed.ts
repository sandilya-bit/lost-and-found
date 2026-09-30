/* Seed script — idempotent: skips if an admin already exists unless --force. */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysAgo = (n: number, hourOffset = 0): Date =>
  new Date(Date.now() - n * 86_400_000 + hourOffset * 3_600_000);

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

export async function seedDatabase(force = false): Promise<void> {
  const existingAdmin = await prisma.users.findUnique({ where: { email: "admin@lostfound.io" } });
  if (existingAdmin && !force) {
    console.log("Seed skipped: database already contains the admin account.");
    return;
  }
  if (force) {
    // Order respects FK dependencies.
    await prisma.refresh_tokens.deleteMany();
    await prisma.claims.deleteMany();
    await prisma.lost_items.deleteMany();
    await prisma.found_items.deleteMany();
    await prisma.users.deleteMany();
  }

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  const admin = await prisma.users.create({
    data: {
      name: "Aarav Sharma",
      email: "admin@lostfound.io",
      phone: "+91 98200 12345",
      password_hash: hash("Admin@123"),
      role: "ADMIN",
      created_at: daysAgo(60),
    },
  });

  const [priya, rahul, sneha, vikram] = await Promise.all(
    [
      { name: "Priya Nair", email: "priya@example.com", phone: "+91 98111 22334", days: 45 },
      { name: "Rahul Verma", email: "rahul@example.com", phone: "+91 98222 33445", days: 38 },
      { name: "Sneha Iyer", email: "sneha@example.com", phone: "+91 98333 44556", days: 25 },
      { name: "Vikram Patel", email: "vikram@example.com", phone: "+91 98444 55667", days: 12 },
    ].map((u) =>
      prisma.users.create({
        data: {
          name: u.name,
          email: u.email,
          phone: u.phone,
          password_hash: hash("User@1234"),
          role: "USER",
          created_at: daysAgo(u.days),
        },
      })
    )
  );

  // ---- Lost items -------------------------------------------------------
  const lostItems = await Promise.all([
    prisma.lost_items.create({
      data: { user_id: priya.user_id, item_name: "iPhone 13 (Midnight)", category: "Electronics", description: "Black iPhone 13 with a cracked screen protector and a blue silicone case. Contains important photos.", location: "Central Library, 2nd Floor", date_lost: new Date(isoDate(daysAgo(6))), created_at: daysAgo(6) },
    }),
    prisma.lost_items.create({
      data: { user_id: rahul.user_id, item_name: "Brown Leather Wallet", category: "Wallet", description: "Bifold wallet with three cards inside — HDFC debit, metro card and a college ID.", location: "Food Court, Block C", date_lost: new Date(isoDate(daysAgo(10))), created_at: daysAgo(10) },
    }),
    prisma.lost_items.create({
      data: { user_id: sneha.user_id, item_name: "Yamaha Keychain with Car Keys", category: "Keys", description: "Set of two car keys on a Yamaha logo keychain, plus a small torch keyring.", location: "Parking Lot B, Near Gate 2", date_lost: new Date(isoDate(daysAgo(4))), created_at: daysAgo(4) },
    }),
    prisma.lost_items.create({
      data: { user_id: priya.user_id, item_name: "Gray North Face Backpack", category: "Bags", description: "Laptop backpack with a MacBook charger and engineering notebooks inside.", location: "Auditorium, Row F", date_lost: new Date(isoDate(daysAgo(15))), created_at: daysAgo(15) },
    }),
    prisma.lost_items.create({
      data: { user_id: vikram.user_id, item_name: "Class 12 Marksheet Folder", category: "Documents", description: "Blue plastic folder with original marksheet and migration certificate.", location: "Admin Block, Reception", date_lost: new Date(isoDate(daysAgo(2))), created_at: daysAgo(2) },
    }),
    prisma.lost_items.create({
      data: { user_id: rahul.user_id, item_name: "Silver Rakhi Bracelet", category: "Jewelry", description: "Thin silver bracelet with a small pendant, sentimental value.", location: "Amphitheater Steps", date_lost: new Date(isoDate(daysAgo(8))), created_at: daysAgo(8) },
    }),
    prisma.lost_items.create({
      data: { user_id: sneha.user_id, item_name: "Navy Blue Hoodie", category: "Clothing", description: "Medium-sized hoodie with 'MIT' printed on the back.", location: "Sports Complex, Locker Room", date_lost: new Date(isoDate(daysAgo(20))), created_at: daysAgo(20) },
    }),
    prisma.lost_items.create({
      data: { user_id: vikram.user_id, item_name: "Milton Water Bottle (Steel)", category: "Water Bottles", description: "1L steel bottle with stickers of a red dragon on it.", location: "Mechanical Workshop", date_lost: new Date(isoDate(daysAgo(3))), created_at: daysAgo(3) },
    }),
  ]);

  // ---- Found items ------------------------------------------------------
  const foundItems = await Promise.all([
    prisma.found_items.create({
      data: { user_id: vikram.user_id, item_name: "iPhone 13 (Black)", category: "Electronics", description: "Found a black iPhone with cracked screen protector near the library stairs. Locked, shows a blue case.", location: "Central Library, Main Stairs", date_found: new Date(isoDate(daysAgo(5))), created_at: daysAgo(5) },
    }),
    prisma.found_items.create({
      data: { user_id: priya.user_id, item_name: "Brown Wallet with Cards", category: "Wallet", description: "Bifold leather wallet with an HDFC card and a metro card inside. Handed to security after verification.", location: "Food Court, Near Juice Counter", date_found: new Date(isoDate(daysAgo(9))), created_at: daysAgo(9) },
    }),
    prisma.found_items.create({
      data: { user_id: rahul.user_id, item_name: "Set of Keys with Torch Keyring", category: "Keys", description: "Car keys with a small torch keyring found in Parking B near the pillar.", location: "Parking Lot B, Pillar 14", date_found: new Date(isoDate(daysAgo(3))), created_at: daysAgo(3) },
    }),
    prisma.found_items.create({
      data: { user_id: sneha.user_id, item_name: "Blue Plastic Document Folder", category: "Documents", description: "Folder containing a marksheet, seems to be Class 12 CBSE.", location: "Admin Block, Waiting Area", date_found: new Date(isoDate(daysAgo(1))), created_at: daysAgo(1) },
    }),
    prisma.found_items.create({
      data: { user_id: priya.user_id, item_name: "Milton Steel Bottle with Dragon Sticker", category: "Water Bottles", description: "1L steel bottle, red dragon sticker, half full of water.", location: "Mechanical Workshop, Bench 3", date_found: new Date(isoDate(daysAgo(2))), created_at: daysAgo(2) },
    }),
    prisma.found_items.create({
      data: { user_id: vikram.user_id, item_name: "Blackearbuds Case (Nothing Ear 1)", category: "Electronics", description: "White-transparent earbuds charging case only, no buds inside.", location: "Canteen, Table 8", date_found: new Date(isoDate(daysAgo(7))), created_at: daysAgo(7) },
    }),
    prisma.found_items.create({
      data: { user_id: rahul.user_id, item_name: "Engineering Mathematics Textbook", category: "Books", description: "BS Grewal 43rd edition, name 'Aarav' written on first page.", location: "Central Library, Reading Hall", date_found: new Date(isoDate(daysAgo(12))), created_at: daysAgo(12) },
    }),
    prisma.found_items.create({
      data: { user_id: sneha.user_id, item_name: "Gold-plated Nose Pin", category: "Jewelry", description: "Small nose pin found on the amphitheater steps, kept safely at front desk.", location: "Amphitheater", date_found: new Date(isoDate(daysAgo(14))), created_at: daysAgo(14) },
    }),
  ]);

  // ---- Claims -----------------------------------------------------------
  const claim1 = await prisma.claims.create({
    data: {
      user_id: priya.user_id,
      found_id: foundItems[0].found_id,
      proof_description: "The phone has a cracked screen protector on the top-left corner and a blue silicone case with a small dent near the camera. The lockscreen wallpaper is a photo of Meenakshi temple. I can unlock it to verify — my Google account is priya.nair@ on it.",
      claim_status: "APPROVED",
      admin_notes: "Device unlocked successfully, IMEI matched the lost report. Returned to owner.",
      claim_date: daysAgo(4),
      created_at: daysAgo(4),
    },
  });

  await prisma.found_items.update({
    where: { found_id: foundItems[0].found_id },
    data: { status: "RECOVERED" },
  });

  const claim2 = await prisma.claims.create({
    data: {
      user_id: rahul.user_id,
      found_id: foundItems[1].found_id,
      proof_description: "Wallet contains an HDFC debit card ending 4821, a Delhi metro card serial DM-998877 and my college ID card. I can name all three cards and show the CVV-hidden card photo I keep at home.",
      claim_status: "PENDING",
      claim_date: daysAgo(2),
      created_at: daysAgo(2),
    },
  });

  const claim3 = await prisma.claims.create({
    data: {
      user_id: sneha.user_id,
      found_id: foundItems[2].found_id,
      proof_description: "These are my brother's car keys — Yamaha FZ keychain, torch keyring was a gift from 2021. The car is a white FZ registered in Pune; I can show the RC.",
      claim_status: "PENDING",
      claim_date: daysAgo(1),
      created_at: daysAgo(1),
    },
  });

  const claim4 = await prisma.claims.create({
    data: {
      user_id: vikram.user_id,
      found_id: foundItems[7].found_id,
      proof_description: "I think this might be my sister's nose pin but I am not completely sure, just trying my luck.",
      claim_status: "REJECTED",
      admin_notes: "Description too vague; could not verify ownership. Please contact the admin office with a photo.",
      claim_date: daysAgo(6),
      created_at: daysAgo(6),
    },
  });

  await prisma.claims.create({
    data: {
      user_id: vikram.user_id,
      found_id: foundItems[3].found_id,
      proof_description: "The folder contains my Class 12 CBSE marksheet, roll number 2265143, and a migration certificate in my name. I can show my Aadhaar for verification.",
      claim_status: "PENDING",
      claim_date: daysAgo(0, 2),
      created_at: daysAgo(0, 2),
    },
  });

  const counts = {
    users: 5,
    lost_items: lostItems.length,
    found_items: foundItems.length,
    claims: 5,
  };

  console.log("Seed complete:");
  console.log(`  Admin   → admin@lostfound.io / Admin@123`);
  console.log(`  Users   → priya@example.com, rahul@example.com, sneha@example.com, vikram@example.com (password: User@1234)`);
  console.log(`  Data    → ${JSON.stringify(counts)}`);
  void admin; void claim1; void claim2; void claim3; void claim4;
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
