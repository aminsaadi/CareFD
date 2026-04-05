import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { json, errorResponse, withErrorHandler } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

const DEMO_USERS = [
  { email: "admin@carefd.com", name: "מנהל CareFD", role: "admin" as const, phone: "050-0000001" },
  { email: "user@carefd.com", name: "ישראל ישראלי", role: "patient" as const, phone: "050-0000002" },
  { email: "provider@carefd.com", name: "ד\"ר יעל כהן", role: "provider" as const, phone: "050-0000003" },
];

const DEMO_SERVICES = [
  { name: "ביקור בית - סיעוד", description: "שירות סיעודי מקצועי בבית המטופל. כולל טיפול, מעקב ותמיכה.", price: 250, category: "visit", pricingType: "per_visit", duration: 60 },
  { name: "פיזיותרפיה - טיפול ביתי", description: "טיפול פיזיותרפי בבית לשיקום לאחר ניתוח או פציעה.", price: 350, category: "visit", pricingType: "per_visit", duration: 45 },
  { name: "ייעוץ תזונה אונליין", description: "ייעוץ תזונה מקצועי בשיחת וידאו. תפריט מותאם אישית.", price: 200, category: "consultation", pricingType: "fixed", duration: 50 },
  { name: "טיפול פסיכולוגי", description: "טיפול פסיכולוגי אישי עם מטפלת מוסמכת. סודיות מלאה.", price: 400, category: "consultation", pricingType: "fixed", duration: 50 },
  { name: "שירות אחות פרטית - שעתי", description: "אחות פרטית מוסמכת לטיפול שעתי. מתן תרופות, חבישות ומעקב.", price: 120, category: "hourly", pricingType: "per_hour", duration: 60 },
];

async function runSeed() {
  const password = "Password123";
  const hashedPw = await hashPassword(password);
  const results: Record<string, any> = {};

  for (const u of DEMO_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      results[u.email] = { status: "exists", user_id: existing.id };
      continue;
    }
    const user = await prisma.user.create({
      data: {
        email: u.email, name: u.name, passwordHash: hashedPw, role: u.role, phone: u.phone,
        isVerified: true, emailVerified: true, languagePreference: "he",
      },
    });
    results[u.email] = { status: "created", user_id: user.id, role: u.role };
  }

  const providerUser = await prisma.user.findUnique({ where: { email: "provider@carefd.com" } });
  if (providerUser) {
    const existingProvider = await prisma.provider.findUnique({ where: { userId: providerUser.id } });
    if (!existingProvider) {
      const provider = await prisma.provider.create({
        data: {
          userId: providerUser.id,
          providerNumber: `PRV${Date.now().toString(36).toUpperCase()}`,
          providerType: "individual",
          businessName: "ד\"ר יעל כהן - רפואת משפחה",
          description: "רופאת משפחה עם ניסיון של 15 שנה. מתמחה בטיפול בקשישים, רפואה מונעת וליווי מטופלים כרוניים.",
          about: "בוגרת הפקולטה לרפואה בטכניון, התמחות ברפואת משפחה במרכז הרפואי רמב\"ם.",
          professionName: "רפואת משפחה", professionTitle: "רופאת משפחה",
          specializations: ["גריאטריה", "רפואה מונעת", "מחלות כרוניות"],
          expertise: ["טיפול בקשישים", "סוכרת", "יתר לחץ דם"],
          city: "תל אביב-יפו", address: "רחוב דיזנגוף 120",
          latitude: 32.0853, longitude: 34.7818,
          serviceAreas: ["תל אביב-יפו", "רמת גן", "גבעתיים", "חולון"],
          languages: ["עברית", "אנגלית", "רוסית"],
          phone: "050-0000003", email: "provider@carefd.com",
          whatsappNumber: "972500000003",
          showPhone: true, showEmail: true, showWhatsapp: true,
          rating: 4.8, totalReviews: 24, yearsExperience: 15,
          isVerified: true, isRecommended: true, verificationStatus: "verified",
          serviceTypes: ["home_visit", "clinic_visit", "video_call"],
          healthFunds: ["clalit", "maccabi", "meuhedet"],
          paymentMethods: ["cash", "credit_card", "bank_transfer"],
          gender: "female", targetAudience: ["קשישים", "מבוגרים", "משפחות"],
        },
      });
      results["provider_profile"] = { status: "created", provider_id: provider.id };

      for (const s of DEMO_SERVICES) {
        await prisma.service.create({
          data: {
            providerId: provider.id,
            serviceNumber: `SRV${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
            name: s.name, description: s.description, price: s.price,
            serviceCategory: s.category as any, pricingType: s.pricingType as any,
            durationMinutes: s.duration, deliveryTypes: ["home_visit", "clinic_visit"],
            currency: "ILS", isActive: true,
          },
        });
      }
      results["services"] = { status: "created", count: DEMO_SERVICES.length };
    }
  }

  const profCount = await prisma.profession.count();
  if (profCount === 0) {
    const profs = [
      { name: "רפואה", nameEn: "Medicine", icon: "stethoscope", sortOrder: 1 },
      { name: "סיעוד", nameEn: "Nursing", icon: "heart", sortOrder: 2 },
      { name: "פיזיותרפיה", nameEn: "Physiotherapy", icon: "activity", sortOrder: 3 },
      { name: "ריפוי בעיסוק", nameEn: "Occupational Therapy", icon: "hand", sortOrder: 4 },
      { name: "פסיכולוגיה", nameEn: "Psychology", icon: "brain", sortOrder: 5 },
      { name: "תזונה קלינית", nameEn: "Clinical Nutrition", icon: "apple", sortOrder: 6 },
      { name: "רפואה משלימה", nameEn: "Alternative Medicine", icon: "leaf", sortOrder: 7 },
      { name: "רפואת שיניים", nameEn: "Dentistry", icon: "smile", sortOrder: 8 },
    ];
    for (const p of profs) await prisma.profession.create({ data: p });
    results["professions"] = { status: "created", count: profs.length };
  }

  const regionCount = await prisma.region.count();
  if (regionCount === 0) {
    const regions = [
      { name: "תל אביב", nameEn: "Tel Aviv", cities: ["תל אביב-יפו", "רמת גן", "גבעתיים", "בני ברק", "חולון"], lat: 32.08, lng: 34.78 },
      { name: "מרכז", nameEn: "Center", cities: ["ראשון לציון", "פתח תקווה", "רחובות", "מודיעין"], lat: 32.07, lng: 34.82 },
      { name: "חיפה", nameEn: "Haifa", cities: ["חיפה", "קריית אתא", "קריית ביאליק"], lat: 32.8, lng: 35.0 },
      { name: "ירושלים", nameEn: "Jerusalem", cities: ["ירושלים", "בית שמש", "מעלה אדומים"], lat: 31.77, lng: 35.23 },
      { name: "דרום", nameEn: "South", cities: ["באר שבע", "אשדוד", "אשקלון"], lat: 31.25, lng: 34.79 },
      { name: "צפון", nameEn: "North", cities: ["נצרת", "עפולה", "טבריה", "כרמיאל"], lat: 32.96, lng: 35.5 },
    ];
    for (const r of regions) await prisma.region.create({ data: r });
    results["regions"] = { status: "created", count: regions.length };
  }

  return { password, results };
}

// GET /api/seed - create demo users if they don't exist
export const GET = withErrorHandler(async () => {
  let seedResult;
  try {
    seedResult = await runSeed();
  } catch (e: any) {
    return json({ error: "Seed failed", detail: e?.message || String(e) }, 500);
  }
  const { password, results } = seedResult;

  const allExist = Object.values(results).every((r: any) => r?.status === "exists");
  return json({
    message: allExist ? "Demo accounts already exist" : "Demo data created successfully!",
    accounts: {
      admin: { email: "admin@carefd.com", password },
      patient: { email: "user@carefd.com", password },
      provider: { email: "provider@carefd.com", password },
    },
    details: results,
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const setupKey = process.env.ADMIN_SETUP_KEY || "carefd-setup-2024";
  const body = await req.json().catch(() => ({}));
  const providedKey = body?.setup_key || req.headers.get("x-setup-key");
  if (providedKey !== setupKey) {
    return errorResponse("Invalid setup key", 403);
  }

  const { password, results } = await runSeed();
  return json({
    message: "Demo data created successfully",
    password,
    accounts: {
      admin: { email: "admin@carefd.com", password },
      patient: { email: "user@carefd.com", password },
      provider: { email: "provider@carefd.com", password },
    },
    details: results,
  });
});
