import { PrismaClient, Role, UserStatus, EventType, BenefitStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ASI Cayman database...");

  // ---------- Expo 2026 ----------
  const expoStart = new Date("2026-06-28T14:00:00-05:00"); // 2:00 PM Cayman (no DST, UTC-5)
  const earlyBirdUntil = new Date("2026-05-31T23:59:59-05:00");

  const expo = await prisma.event.upsert({
    where: { slug: "business-career-expo-2026" },
    update: {},
    create: {
      title: "ASI Cayman Business & Career Expo 2026",
      slug: "business-career-expo-2026",
      description:
        "Showcase! Connect! Succeed! A free public expo featuring Adventist-owned " +
        "businesses in the Cayman Islands. Free health screenings, massage therapy, " +
        "career guidance for youth and students, samples, prizes, and giveaways.",
      startDate: expoStart,
      location: "The Lion Center, Grand Cayman",
      eventType: EventType.EXPO,
      registrationOpen: true,
      memberPrice: 10000,       // $100 in cents
      regularPrice: 15000,      // $150 in cents
      earlyBirdPrice: 10000,    // $100 in cents
      earlyBirdUntil,
    },
  });
  console.log(`  ✓ Event: ${expo.title}`);

  // ---------- Superadmin ----------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@asicayman.org";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-Immediately-2026";
  const adminName = process.env.SEED_ADMIN_NAME ?? "ASI Cayman Admin";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.SUPERADMIN, status: UserStatus.ACTIVE },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: Role.SUPERADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });
  console.log(`  ✓ Superadmin: ${admin.email}`);

  // ---------- Sample benefits ----------
  const benefits = [
    {
      title: "Business directory listing",
      description: "Get your Adventist-owned business listed in the ASI Cayman public directory, visible to the church and wider community.",
    },
    {
      title: "Discounted expo registration",
      description: "ASI members pay $100 instead of $150 for booth registration at the annual Business & Career Expo.",
    },
    {
      title: "Promotional opportunities",
      description: "Submit a 2-minute promotional video aired by media partners and apply for in-studio interviews leading up to the expo.",
    },
    {
      title: "Networking events",
      description: "Connect with fellow Adventist business owners, professionals, and entrepreneurs in the Cayman Islands.",
    },
    {
      title: "Community impact opportunities",
      description: "Join Christ-centered outreach projects across health, education, evangelism, family concerns, and community service.",
    },
  ];

  for (const b of benefits) {
    await prisma.benefit.upsert({
      where: { id: `seed-${b.title.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-${b.title.toLowerCase().replace(/\s+/g, "-")}`,
        title: b.title,
        description: b.description,
        memberOnly: true,
        status: BenefitStatus.ACTIVE,
      },
    });
  }
  console.log(`  ✓ ${benefits.length} benefits seeded`);

  console.log("\n✅ Seed complete.");
  console.log(`   Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("   Change the password immediately after first login.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
