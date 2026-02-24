// Israeli regions with cities
export const israeliRegions = [
  { 
    id: 'north', 
    name: 'צפון', 
    cities: ['חיפה', 'נהריה', 'עכו', 'כרמיאל', 'צפת', 'טבריה', 'נצרת', 'עפולה', 'בית שאן', 'קריית שמונה']
  },
  { 
    id: 'haifa', 
    name: 'חיפה והקריות', 
    cities: ['חיפה', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים', 'נשר', 'טירת כרמל']
  },
  { 
    id: 'sharon', 
    name: 'השרון', 
    cities: ['נתניה', 'הרצליה', 'רעננה', 'כפר סבא', 'הוד השרון', 'רמת השרון', 'קדימה-צורן']
  },
  { 
    id: 'center', 
    name: 'מרכז', 
    cities: ['פתח תקווה', 'ראשון לציון', 'חולון', 'בת ים', 'רמת גן', 'גבעתיים', 'בני ברק', 'לוד', 'רמלה']
  },
  { 
    id: 'tel-aviv', 
    name: 'תל אביב', 
    cities: ['תל אביב-יפו', 'רמת אביב', 'יפו', 'פלורנטין', 'נווה צדק']
  },
  { 
    id: 'jerusalem', 
    name: 'ירושלים והסביבה', 
    cities: ['ירושלים', 'בית שמש', 'מודיעין-מכבים-רעות', 'מעלה אדומים', 'גבעת זאב']
  },
  { 
    id: 'south', 
    name: 'דרום', 
    cities: ['באר שבע', 'אשדוד', 'אשקלון', 'אילת', 'דימונה', 'שדרות', 'קריית גת', 'נתיבות', 'אופקים']
  },
  { 
    id: 'judea-samaria', 
    name: 'יהודה ושומרון', 
    cities: ['אריאל', 'מעלה אדומים', 'ביתר עילית', 'מודיעין עילית', 'אפרת']
  }
];

// Professions/Occupations for healthcare
export const healthcareProfessions = [
  { id: 'nurse', name: 'אחות/אח', searchTerms: ['אחות', 'אח', 'סיעוד', 'אחות מוסמכת', 'אחות מעשית'] },
  { id: 'doctor', name: 'רופא/ה', searchTerms: ['רופא', 'רופאה', 'דוקטור', 'מומחה'] },
  { id: 'family_doctor', name: 'רופא משפחה', searchTerms: ['רופא משפחה', 'רופא כללי', 'רפואה משפחתית'] },
  { id: 'pediatrician', name: 'רופא ילדים', searchTerms: ['רופא ילדים', 'פדיאטר', 'רפואת ילדים'] },
  { id: 'physiotherapist', name: 'פיזיותרפיסט/ית', searchTerms: ['פיזיותרפיה', 'פיזיותרפיסט', 'שיקום'] },
  { id: 'occupational_therapist', name: 'מרפא/ה בעיסוק', searchTerms: ['ריפוי בעיסוק', 'מרפא בעיסוק', 'OT'] },
  { id: 'speech_therapist', name: 'קלינאי/ת תקשורת', searchTerms: ['קלינאי תקשורת', 'דיבור', 'תקשורת'] },
  { id: 'psychologist', name: 'פסיכולוג/ית', searchTerms: ['פסיכולוג', 'פסיכולוגיה', 'טיפול נפשי'] },
  { id: 'social_worker', name: 'עובד/ת סוציאלי/ת', searchTerms: ['עובד סוציאלי', 'עבודה סוציאלית'] },
  { id: 'dietitian', name: 'דיאטן/ית', searchTerms: ['דיאטה', 'דיאטנית', 'תזונה', 'יועץ תזונה'] },
  { id: 'caregiver', name: 'מטפל/ת סיעודי/ת', searchTerms: ['מטפל', 'מטפלת', 'טיפול סיעודי', 'עזרה בבית'] },
  { id: 'massage_therapist', name: 'מעסה/ית', searchTerms: ['עיסוי', 'מעסה', 'עיסוי רפואי'] },
  { id: 'geriatric_nurse', name: 'אחות גריאטרית', searchTerms: ['גריאטריה', 'קשישים', 'גיל שלישי'] },
  { id: 'midwife', name: 'מיילדת', searchTerms: ['מיילדת', 'לידה', 'היריון', 'אחות מיילדת'] },
  { id: 'dentist', name: 'רופא/ת שיניים', searchTerms: ['רופא שיניים', 'שיניים', 'דנטלי'] },
  { id: 'optometrist', name: 'אופטומטריסט/ית', searchTerms: ['אופטומטריה', 'ראייה', 'משקפיים', 'עיניים'] },
  { id: 'podiatrist', name: 'פודיאטר/ית', searchTerms: ['פודיאטריה', 'כף רגל', 'רגליים'] },
  { id: 'chiropractor', name: 'כירופרקט/ית', searchTerms: ['כירופרקטיקה', 'עמוד שדרה', 'גב'] },
];

// Popular searches for each category
export const popularSearches = {
  providers: [
    'אחות', 'רופא משפחה', 'פיזיותרפיסט', 'מטפל סיעודי', 
    'פסיכולוג', 'דיאטנית', 'רופא ילדים', 'מעסה',
    'קלינאי תקשורת', 'מרפא בעיסוק'
  ],
  services: [
    'ביקור בית', 'טיפול סיעודי', 'פיזיותרפיה', 'ייעוץ רפואי',
    'טיפול פסיכולוגי', 'עיסוי רפואי', 'בדיקות דם', 'חיסונים',
    'ייעוץ תזונה', 'שיקום לאחר ניתוח'
  ]
};

// Service types
export const serviceTypes = [
  { id: 'home_visit', name: 'ביקור בית', icon: 'FaHome' },
  { id: 'clinic_visit', name: 'ביקור במרפאה', icon: 'FaHospital' },
  { id: 'video_call', name: 'שיחת וידאו', icon: 'FaVideo' },
  { id: 'phone_call', name: 'שיחה טלפונית', icon: 'FaPhone' },
  { id: 'hourly', name: 'שירות לפי שעה', icon: 'FaClock' },
  { id: 'product', name: 'מוצר', icon: 'FaBox' },
];

// Service categories
export const serviceCategories = [
  { id: 'nursing', name: 'סיעוד' },
  { id: 'physiotherapy', name: 'פיזיותרפיה' },
  { id: 'doctor', name: 'רופא בבית' },
  { id: 'eldercare', name: 'טיפול בקשישים' },
  { id: 'therapy', name: 'טיפול רגשי' },
  { id: 'baby', name: 'טיפול בתינוקות' },
  { id: 'rehabilitation', name: 'שיקום' },
  { id: 'nutrition', name: 'תזונה' },
  { id: 'dental', name: 'טיפולי שיניים' },
  { id: 'alternative', name: 'רפואה משלימה' },
];
