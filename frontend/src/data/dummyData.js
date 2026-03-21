// Dummy data for CareFD platform
// This data is used for demonstration purposes

export const dummyProviders = [
  {
    provider_id: "provider_demo_001",
    business_name: "מרפאת שלום",
    provider_type: "clinic",
    description: "מרפאה מובילה לטיפולי שיקום וריפוי בעיסוק עם צוות מקצועי ומנוסה",
    specializations: ["שיקום", "ריפוי בעיסוק", "פיזיותרפיה"],
    rating: 4.8,
    total_reviews: 127,
    is_verified: true,
    is_recommended: true,
    phone: "03-5551234",
    years_experience: 8,
    service_types: ["clinic_visit", "home_visit"],
    location: {
      city: "תל אביב",
      address: "רחוב דיזנגוף 123",
      country: "Israel",
      latitude: 32.0853,
      longitude: 34.7818
    }
  },
  {
    provider_id: "provider_demo_002",
    business_name: "ד\"ר יעל כהן",
    provider_type: "individual",
    description: "רופאת משפחה מוסמכת עם ניסיון של 15 שנה בתחום הרפואה המשפחתית",
    specializations: ["רפואת משפחה", "רפואה פנימית"],
    rating: 4.9,
    total_reviews: 89,
    is_verified: true,
    is_recommended: false,
    phone: "052-1234567",
    years_experience: 15,
    service_types: ["home_visit", "video_call", "phone_call"],
    location: {
      city: "ירושלים",
      address: "רחוב בן יהודה 45",
      country: "Israel",
      latitude: 31.7683,
      longitude: 35.2137
    }
  },
  {
    provider_id: "provider_demo_003",
    business_name: "בית אבות הדר",
    provider_type: "company",
    description: "בית אבות יוקרתי עם שירותי סיעוד מעולים וצוות רפואי צמוד",
    specializations: ["סיעוד", "גריאטריה", "טיפול בקשישים"],
    rating: 4.7,
    total_reviews: 156,
    is_verified: true,
    is_recommended: true,
    phone: "04-8765432",
    years_experience: 12,
    service_types: ["clinic_visit", "home_visit"],
    location: {
      city: "חיפה",
      address: "רחוב הנביאים 78",
      country: "Israel",
      latitude: 32.7940,
      longitude: 34.9896
    }
  },
  {
    provider_id: "provider_demo_004",
    business_name: "פיזיותרפיה ניידת",
    provider_type: "individual",
    description: "שירותי פיזיותרפיה בבית הלקוח - מתמחה בשיקום לאחר ניתוחים",
    specializations: ["פיזיותרפיה", "שיקום לאחר ניתוח"],
    rating: 4.6,
    total_reviews: 64,
    is_verified: true,
    is_recommended: false,
    phone: "054-9876543",
    years_experience: 6,
    service_types: ["home_visit"],
    location: {
      city: "רמת גן",
      address: "רחוב ביאליק 34",
      country: "Israel",
      latitude: 32.0680,
      longitude: 34.8248
    }
  },
  {
    provider_id: "provider_demo_005",
    business_name: "מרכז הבריאות הוליסטי",
    provider_type: "clinic",
    description: "מרכז לרפואה משלימה ואורח חיים בריא - דיקור, עיסוי רפואי ותזונה",
    specializations: ["רפואה משלימה", "דיקור", "עיסוי רפואי"],
    rating: 4.5,
    total_reviews: 93,
    is_verified: false,
    is_recommended: false,
    phone: "09-7654321",
    years_experience: 4,
    service_types: ["clinic_visit", "video_call"],
    location: {
      city: "הרצליה",
      address: "רחוב סוקולוב 56",
      country: "Israel",
      latitude: 32.1656,
      longitude: 34.8467
    }
  },
  {
    provider_id: "provider_demo_006",
    business_name: "אחות בית מרים",
    provider_type: "individual",
    description: "אחות מוסמכת עם ניסיון של 20 שנה - טיפולים סיעודיים בבית המטופל",
    specializations: ["סיעוד ביתי", "חבישות", "מתן תרופות"],
    rating: 4.9,
    total_reviews: 112,
    is_verified: true,
    is_recommended: true,
    phone: "050-1112233",
    years_experience: 20,
    service_types: ["home_visit", "phone_call"],
    location: {
      city: "פתח תקווה",
      address: "רחוב רוטשילד 12",
      country: "Israel",
      latitude: 32.0841,
      longitude: 34.8878
    }
  }
];

export const dummyServices = [
  {
    service_id: "service_demo_001",
    provider_id: "provider_demo_001",
    name: "טיפול פיזיותרפיה",
    description: "טיפול פיזיותרפי מקצועי לשיקום לאחר פציעות ספורט או תאונות",
    service_type: "clinic_visit",
    pricing_type: "per_hour",
    price: 350,
    duration_minutes: 45,
    provider: {
      provider_id: "provider_demo_001",
      business_name: "מרפאת שלום",
      rating: 4.8
    }
  },
  {
    service_id: "service_demo_002",
    provider_id: "provider_demo_002",
    name: "ביקור רופא בבית",
    description: "ביקור רופא משפחה בבית המטופל - אבחון וטיפול ראשוני",
    service_type: "home_visit",
    pricing_type: "consultation",
    price: 500,
    duration_minutes: 30,
    provider: {
      provider_id: "provider_demo_002",
      business_name: "ד\"ר יעל כהן",
      rating: 4.9
    }
  },
  {
    service_id: "service_demo_003",
    provider_id: "provider_demo_003",
    name: "טיפול סיעודי יומי",
    description: "טיפול סיעודי מקיף כולל רחצה, האכלה ומתן תרופות",
    service_type: "home_visit",
    pricing_type: "per_hour",
    price: 80,
    minimum_hours: 4,
    provider: {
      provider_id: "provider_demo_003",
      business_name: "בית אבות הדר",
      rating: 4.7
    }
  },
  {
    service_id: "service_demo_004",
    provider_id: "provider_demo_004",
    name: "פיזיותרפיה בבית",
    description: "טיפול פיזיותרפי בבית הלקוח עם כל הציוד הנדרש",
    service_type: "home_visit",
    pricing_type: "per_hour",
    price: 400,
    duration_minutes: 60,
    provider: {
      provider_id: "provider_demo_004",
      business_name: "פיזיותרפיה ניידת",
      rating: 4.6
    }
  },
  {
    service_id: "service_demo_005",
    provider_id: "provider_demo_005",
    name: "טיפול דיקור סיני",
    description: "טיפול דיקור סיני להקלה על כאבים כרוניים ושיפור זרימת האנרגיה",
    service_type: "clinic_visit",
    pricing_type: "consultation",
    price: 280,
    duration_minutes: 60,
    provider: {
      provider_id: "provider_demo_005",
      business_name: "מרכז הבריאות הוליסטי",
      rating: 4.5
    }
  },
  {
    service_id: "service_demo_006",
    provider_id: "provider_demo_006",
    name: "טיפול סיעודי ביתי",
    description: "אחות מוסמכת לטיפול סיעודי בבית - עירוי, חבישות ומעקב",
    service_type: "home_visit",
    pricing_type: "per_hour",
    price: 150,
    duration_minutes: 60,
    provider: {
      provider_id: "provider_demo_006",
      business_name: "אחות בית מרים",
      rating: 4.9
    }
  },
  {
    service_id: "service_demo_007",
    provider_id: "provider_demo_001",
    name: "ריפוי בעיסוק",
    description: "טיפול בריפוי בעיסוק לשיפור תפקוד יומיומי ואיכות חיים",
    service_type: "clinic_visit",
    pricing_type: "per_hour",
    price: 320,
    duration_minutes: 45,
    provider: {
      provider_id: "provider_demo_001",
      business_name: "מרפאת שלום",
      rating: 4.8
    }
  },
  {
    service_id: "service_demo_008",
    provider_id: "provider_demo_002",
    name: "ייעוץ רפואי בוידאו",
    description: "ייעוץ רפואי מקוון עם רופאת משפחה מנוסה",
    service_type: "video_call",
    pricing_type: "consultation",
    price: 200,
    duration_minutes: 20,
    provider: {
      provider_id: "provider_demo_002",
      business_name: "ד\"ר יעל כהן",
      rating: 4.9
    }
  }
];

export const dummyRequests = [
  {
    request_id: "request_demo_001",
    user_id: "user_demo_001",
    title: "מחפש מטפלת סיעודית לאמא",
    description: "מחפש מטפלת סיעודית מנוסה לטיפול באמא בת 82 - 6 שעות ביום, 5 ימים בשבוע",
    provider_type: "individual",
    specialization: "סיעוד",
    service_type: "home_visit",
    budget: 5000,
    request_type: "scheduled",
    status: "open",
    location: {
      city: "תל אביב",
      address: "רמת אביב"
    },
    created_at: "2025-01-15T10:30:00Z"
  },
  {
    request_id: "request_demo_002",
    user_id: "user_demo_002",
    title: "פיזיותרפיה לאחר ניתוח ברך",
    description: "זקוק לפיזיותרפיסט לשיקום לאחר ניתוח החלפת ברך - עדיפות לטיפול בבית",
    provider_type: "individual",
    specialization: "פיזיותרפיה",
    service_type: "home_visit",
    budget: 3000,
    request_type: "scheduled",
    status: "open",
    location: {
      city: "ירושלים"
    },
    created_at: "2025-01-14T14:20:00Z"
  },
  {
    request_id: "request_demo_003",
    user_id: "user_demo_003",
    title: "רופא לביקור בית דחוף",
    description: "סבא בן 78 עם חום גבוה - צריך רופא לביקור בית עוד היום",
    provider_type: "individual",
    specialization: "רפואת משפחה",
    service_type: "home_visit",
    budget: 600,
    request_type: "immediate",
    status: "open",
    location: {
      city: "חיפה"
    },
    created_at: "2025-01-16T08:00:00Z"
  }
];

export const serviceCategories = [
  {
    id: "nursing",
    name: "סיעוד",
    icon: "FaUserNurse",
    description: "טיפול סיעודי מקצועי בבית או במוסד"
  },
  {
    id: "physiotherapy",
    name: "פיזיותרפיה",
    icon: "FaWalking",
    description: "שיקום ופיזיותרפיה לכל הגילאים"
  },
  {
    id: "doctor",
    name: "רופא בבית",
    icon: "FaUserMd",
    description: "ביקור רופא בנוחות הבית שלך"
  },
  {
    id: "eldercare",
    name: "טיפול בקשישים",
    icon: "FaHeart",
    description: "שירותי טיפול מקיפים לקשישים"
  },
  {
    id: "therapy",
    name: "ריפוי בעיסוק",
    icon: "FaHandHoldingHeart",
    description: "שיפור תפקוד יומיומי ועצמאות"
  },
  {
    id: "alternative",
    name: "רפואה משלימה",
    icon: "FaSpa",
    description: "דיקור, עיסוי רפואי ועוד"
  }
];

export const statistics = {
  providers: 250,
  services: 500,
  happyClients: 5000,
  cities: 15
};

export const testimonials = [
  {
    id: 1,
    name: "שרה לוי",
    role: "בת של מטופלת",
    content: "מצאנו מטפלת סיעודית מדהימה לאמא שלי תוך יום אחד. השירות מקצועי ואמין!",
    rating: 5,
    avatar: "SL"
  },
  {
    id: 2,
    name: "דוד כהן",
    role: "מטופל",
    content: "אחרי ניתוח ברך, הפיזיותרפיסט שמצאתי כאן עזר לי לחזור ללכת תוך חודשיים.",
    rating: 5,
    avatar: "DK"
  },
  {
    id: 3,
    name: "רחל אברהם",
    role: "ספקית שירות",
    content: "הפלטפורמה עזרה לי להגיע ללקוחות חדשים ולפתח את העסק שלי בצורה משמעותית.",
    rating: 5,
    avatar: "RA"
  }
];
