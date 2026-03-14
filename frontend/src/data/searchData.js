// Israeli regions with cities
export const israeliRegions = [
  {
    id: 'tel_aviv',
    name: 'תל אביב',
    lat: 32.08, lng: 34.78,
    cities: ['תל אביב-יפו', 'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'הרצליה', 'רמת השרון', 'אור יהודה', 'אזור', 'קריית אונו', 'יהוד-מונוסון', 'גני תקווה', 'סביון', 'כפר שמריהו']
  },
  {
    id: 'center',
    name: 'מרכז',
    lat: 32.07, lng: 34.82,
    cities: ['פתח תקווה', 'ראשון לציון', 'רחובות', 'נס ציונה', 'לוד', 'רמלה', 'יבנה', 'מודיעין-מכבים-רעות', 'ראש העין', 'אלעד', 'שוהם', 'גבעת שמואל', 'גדרה', 'גן יבנה', 'חריש']
  },
  {
    id: 'haifa',
    name: 'חיפה',
    lat: 32.8, lng: 35.0,
    cities: ['חיפה', 'קריית ביאליק', 'קריית מוצקין', 'קריית אתא', 'קריית ים', 'נשר', 'טירת כרמל', 'דלית אל-כרמל', 'עוספיה', 'אום אל-פחם', 'באקה אל-גרבייה']
  },
  {
    id: 'north',
    name: 'צפון',
    lat: 32.9, lng: 35.3,
    cities: ['נהריה', 'עכו', 'כרמיאל', 'צפת', 'טבריה', 'קריית שמונה', 'נצרת', 'נוף הגליל', 'עפולה', 'בית שאן', 'יקנעם', 'מגדל העמק', 'מעלות-תרשיחא', 'שלומי', 'שפרעם', 'טמרה']
  },
  {
    id: 'sharon',
    name: 'השרון',
    lat: 32.3, lng: 34.9,
    cities: ['נתניה', 'רעננה', 'כפר סבא', 'הוד השרון', 'חדרה', 'כפר יונה', 'פרדס חנה-כרכור', 'זכרון יעקב', 'בנימינה-גבעת עדה', 'אור עקיבא', 'קיסריה', 'קדימה-צורן', 'אבן יהודה']
  },
  {
    id: 'jerusalem',
    name: 'ירושלים',
    lat: 31.77, lng: 35.21,
    cities: ['ירושלים', 'בית שמש', 'מעלה אדומים', 'גבעת זאב', 'מבשרת ציון', 'מודיעין עילית', 'ביתר עילית', 'אבו גוש', 'צור הדסה', 'אפרת']
  },
  {
    id: 'south',
    name: 'דרום',
    lat: 31.25, lng: 34.79,
    cities: ['באר שבע', 'אשדוד', 'אשקלון', 'אילת', 'דימונה', 'קריית גת', 'שדרות', 'אופקים', 'נתיבות', 'ערד', 'ירוחם', 'מצפה רמון', 'רהט', 'קריית מלאכי']
  },
  {
    id: 'judea_samaria',
    name: 'יהודה ושומרון',
    lat: 32.1, lng: 35.15,
    cities: ['אריאל', 'אלפי מנשה', 'קרני שומרון', 'עמנואל', 'קדומים', 'אלקנה', 'בית אל', 'עפרה']
  },
  {
    id: 'golan',
    name: 'גולן',
    lat: 33.0, lng: 35.75,
    cities: ['קצרין', 'חספין', 'בני יהודה', 'מג\'דל שמס', 'מסעדה', 'בוקעאתא']
  }
];

// Gender options
export const genderOptions = [
  { id: 'male', name: 'זכר', icon: 'FaMale' },
  { id: 'female', name: 'נקבה', icon: 'FaFemale' },
  { id: 'any', name: 'לא משנה', icon: 'FaUsers' }
];

// Languages
export const languageOptions = [
  { id: 'hebrew', name: 'עברית' },
  { id: 'arabic', name: 'ערבית' },
  { id: 'russian', name: 'רוסית' },
  { id: 'english', name: 'אנגלית' },
  { id: 'french', name: 'צרפתית' },
  { id: 'amharic', name: 'אמהרית' },
  { id: 'spanish', name: 'ספרדית' },
  { id: 'yiddish', name: 'יידיש' }
];

// Health Funds (Kupot Cholim)
export const healthFunds = [
  { id: 'clalit', name: 'כללית', color: '#00a651' },
  { id: 'maccabi', name: 'מכבי', color: '#0072bc' },
  { id: 'meuhedet', name: 'מאוחדת', color: '#ed1c24' },
  { id: 'leumit', name: 'לאומית', color: '#f7941d' },
  { id: 'private', name: 'פרטי', color: '#6b7280' }
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
