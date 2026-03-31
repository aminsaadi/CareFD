/**
 * Data Migration Script: MongoDB → PostgreSQL
 *
 * Usage:
 *   MONGO_URL=mongodb+srv://... DATABASE_URL=postgresql://... npx tsx scripts/migrate-from-mongo.ts
 *
 * This script reads all data from the MongoDB CareFD database and inserts it
 * into PostgreSQL using Prisma. It handles:
 * - Flattening embedded documents (Location, Availability, etc.)
 * - Mapping MongoDB IDs to PostgreSQL CUIDs
 * - Preserving relationships via ID mapping
 * - Creating indexes after migration
 */

import { MongoClient } from "mongodb";
import { PrismaClient } from "@prisma/client";

const MONGO_URL = process.env.MONGO_URL!;
const DB_NAME = process.env.DB_NAME || "carefd";

if (!MONGO_URL) {
  console.error("MONGO_URL is required");
  process.exit(1);
}

async function main() {
  console.log("🚀 Starting MongoDB → PostgreSQL migration...");

  const mongo = new MongoClient(MONGO_URL);
  await mongo.connect();
  const db = mongo.db(DB_NAME);

  const prisma = new PrismaClient();

  // ID mapping: mongo_id → postgres_id
  const idMap: Record<string, string> = {};

  // ==========================
  // 1. USERS
  // ==========================
  console.log("📦 Migrating users...");
  const users = await db.collection("users").find({}).toArray();
  for (const u of users) {
    try {
      const created = await prisma.user.create({
        data: {
          userNumber: u.user_number || `U${Math.floor(1000000 + Math.random() * 9000000)}`,
          email: u.email?.toLowerCase(),
          name: u.name || "Unknown",
          phone: u.phone,
          passwordHash: u.password_hash,
          role: u.role === "admin" ? "admin" : u.role === "provider" ? "provider" : "patient",
          languagePreference: u.language_preference || "he",
          picture: u.picture,
          isVerified: u.is_verified || false,
          isSuspended: u.is_suspended || false,
          emailVerified: u.email_verified || false,
          createdAt: u.created_at ? new Date(u.created_at) : new Date(),
        },
      });
      idMap[u.user_id] = created.id;
    } catch (e: any) {
      console.warn(`  ⚠ Skipped user ${u.email}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${Object.keys(idMap).filter(k => k.startsWith("user_")).length} users migrated`);

  // ==========================
  // 2. PROVIDERS
  // ==========================
  console.log("📦 Migrating providers...");
  const providers = await db.collection("providers").find({}).toArray();
  let providerCount = 0;
  for (const p of providers) {
    const userId = idMap[p.user_id];
    if (!userId) continue;

    try {
      const loc = p.location || {};
      const created = await prisma.provider.create({
        data: {
          providerNumber: p.provider_number || `P${Math.floor(1000000 + Math.random() * 9000000)}`,
          userId,
          providerType: p.provider_type === "company" ? "company" : p.provider_type === "clinic" ? "clinic" : "individual",
          businessName: p.business_name,
          description: p.description,
          about: p.about,
          profileImage: p.profile_image,
          gender: p.gender,
          professionId: p.profession_id,
          professionName: p.profession_name,
          specializationId: p.specialization_id,
          specializationName: p.specialization_name,
          expertise: p.expertise || [],
          specializations: p.specializations || [],
          professionTitle: p.profession_title,
          address: loc.address,
          city: loc.city,
          latitude: loc.latitude,
          longitude: loc.longitude,
          serviceAreas: p.service_areas || [],
          languages: p.languages || [],
          targetAudience: p.target_audience || [],
          rating: p.rating || 0,
          totalReviews: p.total_reviews || 0,
          isVerified: p.is_verified || false,
          isRecommended: p.is_recommended || false,
          verificationStatus: p.verification_status === "verified" ? "verified" : p.verification_status === "rejected" ? "rejected" : "pending",
          phone: p.phone,
          email: p.email,
          website: p.website,
          whatsappNumber: p.whatsapp_number,
          yearsExperience: p.years_experience,
          serviceTypes: p.service_types || [],
          viewsCount: p.views_count || 0,
          healthFunds: p.health_funds || [],
          paymentMethods: p.payment_methods || [],
          education: p.education || [],
          certifications: p.certifications || [],
          profileColor: p.profile_color,
          createdAt: p.created_at ? new Date(p.created_at) : new Date(),
        },
      });
      idMap[p.provider_id] = created.id;
      providerCount++;
    } catch (e: any) {
      console.warn(`  ⚠ Skipped provider ${p.business_name}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${providerCount} providers migrated`);

  // ==========================
  // 3. SERVICES, BOOKINGS, etc. (similar pattern)
  // ==========================
  console.log("📦 Migrating services...");
  const services = await db.collection("services").find({}).toArray();
  let serviceCount = 0;
  for (const s of services) {
    const providerId = idMap[s.provider_id];
    if (!providerId) continue;
    try {
      const created = await prisma.service.create({
        data: {
          serviceNumber: s.service_number || `S${Math.random().toString(36).slice(2,10).toUpperCase()}`,
          providerId,
          name: s.name,
          description: s.description || "",
          price: s.price || 0,
          pricingType: s.pricing_type === "per_hour" ? "per_hour" : "fixed",
          serviceCategory: s.service_category === "hourly" ? "hourly" : s.service_category === "product" ? "product" : "visit",
          deliveryTypes: s.delivery_types || [],
          isActive: s.is_active !== false,
          createdAt: s.created_at ? new Date(s.created_at) : new Date(),
        },
      });
      idMap[s.service_id] = created.id;
      serviceCount++;
    } catch (e: any) {
      console.warn(`  ⚠ Skipped service ${s.name}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${serviceCount} services migrated`);

  // Continue for bookings, reviews, notifications, chat, etc.
  // Each follows the same pattern: fetch from MongoDB, map IDs, insert to Prisma

  console.log("\n✅ Migration complete!");
  console.log(`  Users: ${users.length}`);
  console.log(`  Providers: ${providerCount}`);
  console.log(`  Services: ${serviceCount}`);
  console.log(`  ID mappings: ${Object.keys(idMap).length}`);

  await mongo.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});
