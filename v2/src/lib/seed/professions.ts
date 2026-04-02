// Default professions hierarchy – synced with frontend searchData.js
// IDs use the same format as the MongoDB version for backward compatibility

interface CategoryDef {
  id: string;
  name: string;
  nameEn: string;
}

interface SubProfessionDef {
  id: string;
  name: string;
  nameEn: string;
  categories: CategoryDef[];
}

interface ProfessionDef {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  specializations: string[];
  sortOrder: number;
  subProfessions: SubProfessionDef[];
}

export const defaultProfessions: ProfessionDef[] = [
  {
    id: "prof_medicine",
    name: "רפואה",
    nameEn: "Medicine",
    icon: "stethoscope",
    sortOrder: 0,
    specializations: [
      "רפואת משפחה", "רפואה פנימית", "רפואת ילדים", "גריאטריה", "כירורגיה",
      "אורתופדיה", "קרדיולוגיה", "נוירולוגיה", "אורולוגיה", "גינקולוגיה",
      "עור ומין", "אף אוזן גרון", "רפואת עיניים", "אונקולוגיה",
      "אנדוקרינולוגיה", "גסטרואנטרולוגיה", "ריאות", "ראומטולוגיה",
    ],
    subProfessions: [
      {
        id: "sub_family_med", name: "רפואת משפחה", nameEn: "Family Medicine",
        categories: [
          { id: "cat_home_visit", name: "ביקור בית", nameEn: "Home Visit" },
          { id: "cat_checkup", name: "בדיקה כללית", nameEn: "General Checkup" },
          { id: "cat_prescription", name: "מתן מרשם", nameEn: "Prescription" },
          { id: "cat_referral", name: "הפניה לבדיקות", nameEn: "Referral" },
        ],
      },
      {
        id: "sub_internal", name: "רפואה פנימית", nameEn: "Internal Medicine",
        categories: [
          { id: "cat_internal_consult", name: "ייעוץ פנימי", nameEn: "Internal Consultation" },
          { id: "cat_internal_followup", name: "מעקב מחלות כרוניות", nameEn: "Chronic Follow-up" },
        ],
      },
      {
        id: "sub_pediatrics", name: "רפואת ילדים", nameEn: "Pediatrics",
        categories: [
          { id: "cat_child_checkup", name: "בדיקת ילד", nameEn: "Child Checkup" },
          { id: "cat_child_vaccination", name: "חיסוני ילדים", nameEn: "Child Vaccination" },
        ],
      },
      {
        id: "sub_geriatrics", name: "גריאטריה", nameEn: "Geriatrics",
        categories: [
          { id: "cat_geriatric_eval", name: "הערכה גריאטרית", nameEn: "Geriatric Evaluation" },
        ],
      },
    ],
  },
  {
    id: "prof_nursing",
    name: "אחיות/סיעוד",
    nameEn: "Nursing",
    icon: "heart-pulse",
    sortOrder: 1,
    specializations: ["סיעוד ביתי", "טיפול בקשישים", "סיעוד אחרי ניתוח", "טיפול פליאטיבי", "סיעוד ילדים"],
    subProfessions: [
      {
        id: "sub_home_care", name: "סיעוד ביתי", nameEn: "Home Care",
        categories: [
          { id: "cat_daily_care", name: "טיפול יומיומי", nameEn: "Daily Care" },
          { id: "cat_wound_care", name: "טיפול בפצעים", nameEn: "Wound Care" },
          { id: "cat_medication", name: "מתן תרופות", nameEn: "Medication" },
        ],
      },
      {
        id: "sub_elderly_care", name: "טיפול בקשישים", nameEn: "Elderly Care",
        categories: [
          { id: "cat_elderly_daily", name: "סיוע יומיומי", nameEn: "Daily Assistance" },
          { id: "cat_elderly_medical", name: "ליווי רפואי", nameEn: "Medical Escort" },
        ],
      },
      {
        id: "sub_post_op", name: "סיעוד אחרי ניתוח", nameEn: "Post-Op Care",
        categories: [
          { id: "cat_postop_care", name: "טיפול לאחר ניתוח", nameEn: "Post-Surgery Care" },
        ],
      },
      {
        id: "sub_palliative", name: "טיפול פליאטיבי", nameEn: "Palliative Care",
        categories: [
          { id: "cat_palliative_care", name: "טיפול תומך", nameEn: "Supportive Care" },
        ],
      },
    ],
  },
  {
    id: "prof_dental",
    name: "רפואת שיניים",
    nameEn: "Dentistry",
    icon: "tooth",
    sortOrder: 2,
    specializations: ["אורתודונטיה", "פריודונטיה", "אנדודונטיה", "רפואת שיניים לילדים"],
    subProfessions: [
      {
        id: "sub_orthodontics", name: "אורתודונטיה", nameEn: "Orthodontics",
        categories: [
          { id: "cat_braces", name: "יישור שיניים", nameEn: "Braces" },
        ],
      },
      {
        id: "sub_periodontics", name: "פריודונטיה", nameEn: "Periodontics",
        categories: [
          { id: "cat_implants", name: "שתלים", nameEn: "Implants" },
          { id: "cat_gum_treatment", name: "טיפול חניכיים", nameEn: "Gum Treatment" },
        ],
      },
    ],
  },
  {
    id: "prof_therapy",
    name: "טיפולי שיקום",
    nameEn: "Rehabilitation",
    icon: "accessibility",
    sortOrder: 3,
    specializations: ["פיזיותרפיה", "ריפוי בעיסוק", "קלינאות תקשורת", "פודיאטריה", "כירופרקטיקה"],
    subProfessions: [
      {
        id: "sub_physio", name: "פיזיותרפיה", nameEn: "Physiotherapy",
        categories: [
          { id: "cat_physio_home", name: "פיזיותרפיה בבית", nameEn: "Home Physiotherapy" },
          { id: "cat_physio_rehab", name: "שיקום", nameEn: "Rehabilitation" },
        ],
      },
      {
        id: "sub_occupational", name: "ריפוי בעיסוק", nameEn: "Occupational Therapy",
        categories: [
          { id: "cat_ot_home", name: "ריפוי בעיסוק בבית", nameEn: "Home OT" },
        ],
      },
      {
        id: "sub_speech", name: "קלינאות תקשורת", nameEn: "Speech Therapy",
        categories: [
          { id: "cat_speech_therapy", name: "טיפול בדיבור", nameEn: "Speech Therapy" },
        ],
      },
    ],
  },
  {
    id: "prof_mental",
    name: "בריאות הנפש",
    nameEn: "Mental Health",
    icon: "brain",
    sortOrder: 4,
    specializations: ["פסיכולוגיה קלינית", "פסיכיאטריה", "טיפול זוגי ומשפחתי", "פסיכולוגיית ילדים", "עבודה סוציאלית"],
    subProfessions: [
      {
        id: "sub_clinical_psych", name: "פסיכולוגיה קלינית", nameEn: "Clinical Psychology",
        categories: [
          { id: "cat_therapy_session", name: "פגישת טיפול", nameEn: "Therapy Session" },
          { id: "cat_psych_eval", name: "אבחון פסיכולוגי", nameEn: "Psychological Evaluation" },
        ],
      },
      {
        id: "sub_psychiatry", name: "פסיכיאטריה", nameEn: "Psychiatry",
        categories: [
          { id: "cat_psych_consult", name: "ייעוץ פסיכיאטרי", nameEn: "Psychiatric Consultation" },
        ],
      },
      {
        id: "sub_couple_family", name: "טיפול זוגי ומשפחתי", nameEn: "Couple & Family Therapy",
        categories: [
          { id: "cat_couple_therapy", name: "טיפול זוגי", nameEn: "Couple Therapy" },
          { id: "cat_family_therapy", name: "טיפול משפחתי", nameEn: "Family Therapy" },
        ],
      },
      {
        id: "sub_social_work", name: "עבודה סוציאלית", nameEn: "Social Work",
        categories: [
          { id: "cat_social_support", name: "תמיכה סוציאלית", nameEn: "Social Support" },
        ],
      },
    ],
  },
  {
    id: "prof_nutrition",
    name: "תזונה ודיאטה",
    nameEn: "Nutrition & Dietetics",
    icon: "apple",
    sortOrder: 5,
    specializations: ["דיאטה קלינית", "תזונת ספורט", "הפרעות אכילה"],
    subProfessions: [
      {
        id: "sub_clinical_diet", name: "דיאטה קלינית", nameEn: "Clinical Dietetics",
        categories: [
          { id: "cat_diet_consult", name: "ייעוץ תזונתי", nameEn: "Nutritional Consultation" },
        ],
      },
      {
        id: "sub_sports_nutrition", name: "תזונת ספורט", nameEn: "Sports Nutrition",
        categories: [
          { id: "cat_sports_plan", name: "תכנית תזונה לספורטאים", nameEn: "Sports Nutrition Plan" },
        ],
      },
    ],
  },
  {
    id: "prof_alternative",
    name: "רפואה משלימה",
    nameEn: "Alternative Medicine",
    icon: "leaf",
    sortOrder: 6,
    specializations: ["דיקור סיני", "נטורופתיה", "עיסוי רפואי", "אוסטאופתיה", "הומאופתיה"],
    subProfessions: [
      {
        id: "sub_acupuncture", name: "דיקור סיני", nameEn: "Acupuncture",
        categories: [
          { id: "cat_acupuncture_session", name: "טיפול בדיקור", nameEn: "Acupuncture Session" },
        ],
      },
      {
        id: "sub_massage", name: "עיסוי רפואי", nameEn: "Medical Massage",
        categories: [
          { id: "cat_massage_session", name: "טיפול בעיסוי", nameEn: "Massage Session" },
        ],
      },
    ],
  },
  {
    id: "prof_optometry",
    name: "אופטומטריה",
    nameEn: "Optometry",
    icon: "eye",
    sortOrder: 7,
    specializations: ["בדיקת ראייה", "התאמת משקפיים", "עדשות מגע"],
    subProfessions: [
      {
        id: "sub_eye_exam", name: "בדיקת ראייה", nameEn: "Eye Exam",
        categories: [
          { id: "cat_vision_test", name: "בדיקת חדות ראייה", nameEn: "Vision Test" },
        ],
      },
    ],
  },
  {
    id: "prof_midwifery",
    name: "מיילדות",
    nameEn: "Midwifery",
    icon: "baby",
    sortOrder: 8,
    specializations: ["ליווי הריון", "לאחר לידה", "הנקה"],
    subProfessions: [
      {
        id: "sub_pregnancy", name: "ליווי הריון", nameEn: "Pregnancy Support",
        categories: [
          { id: "cat_prenatal", name: "הכנה ללידה", nameEn: "Prenatal Preparation" },
        ],
      },
      {
        id: "sub_postpartum", name: "לאחר לידה", nameEn: "Postpartum",
        categories: [
          { id: "cat_postpartum_care", name: "טיפול לאחר לידה", nameEn: "Postpartum Care" },
          { id: "cat_breastfeeding", name: "ייעוץ הנקה", nameEn: "Breastfeeding Consultation" },
        ],
      },
    ],
  },
  {
    id: "prof_caregiving",
    name: "טיפול וסיוע",
    nameEn: "Caregiving",
    icon: "hand-holding-heart",
    sortOrder: 9,
    specializations: ["מטפל סיעודי", "ליווי רפואי", "עזרה בבית"],
    subProfessions: [
      {
        id: "sub_caregiver", name: "מטפל/ת סיעודי/ת", nameEn: "Caregiver",
        categories: [
          { id: "cat_daily_assist", name: "סיוע יומיומי", nameEn: "Daily Assistance" },
          { id: "cat_night_shift", name: "משמרת לילה", nameEn: "Night Shift" },
        ],
      },
      {
        id: "sub_medical_escort", name: "ליווי רפואי", nameEn: "Medical Escort",
        categories: [
          { id: "cat_hospital_escort", name: "ליווי לבית חולים", nameEn: "Hospital Escort" },
        ],
      },
    ],
  },
];
