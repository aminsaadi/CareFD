// Israeli regions with cities
export const israeliRegions = [
  { id: 'tel_aviv', name: 'תל אביב', lat: 32.08, lng: 34.78, cities: ['תל אביב-יפו', 'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'אור יהודה', 'קריית אונו', 'אזור'] },
  { id: 'center', name: 'מרכז', lat: 32.07, lng: 34.82, cities: ['ראשון לציון', 'פתח תקווה', 'רחובות', 'מודיעין-מכבים-רעות', 'לוד', 'רמלה', 'נס ציונה', 'יבנה', 'ראש העין', 'שוהם', 'גדרה', 'חריש'] },
  { id: 'haifa', name: 'חיפה והקריות', lat: 32.8, lng: 35.0, cities: ['חיפה', 'חדרה', 'קריית ביאליק', 'קריית מוצקין', 'קריית אתא', 'קריית ים', 'אור עקיבא', 'טירת כרמל', 'זכרון יעקב', 'נשר'] },
  { id: 'north', name: 'צפון', lat: 32.9, lng: 35.3, cities: ['נצרת', 'נהריה', 'עכו', 'כרמיאל', 'טבריה', 'עפולה', 'קריית שמונה', 'צפת', 'נוף הגליל', 'מגדל העמק', 'יקנעם עילית', 'מעלות-תרשיחא'] },
  { id: 'sharon', name: 'השרון', lat: 32.3, lng: 34.9, cities: ['נתניה', 'הרצליה', 'כפר סבא', 'רעננה', 'הוד השרון', 'רמת השרון'] },
  { id: 'jerusalem', name: 'ירושלים והסביבה', lat: 31.77, lng: 35.21, cities: ['ירושלים', 'בית שמש', 'מעלה אדומים', 'ביתר עילית', 'גבעת זאב', 'מבשרת ציון'] },
  { id: 'south', name: 'דרום', lat: 31.25, lng: 34.79, cities: ['אשדוד', 'באר שבע', 'אשקלון', 'אילת', 'קריית גת', 'דימונה', 'ערד', 'אופקים', 'נתיבות', 'שדרות'] },
  { id: 'judea_samaria', name: 'יהודה ושומרון', lat: 32.1, lng: 35.15, cities: ['אריאל', 'אלפי מנשה', 'קרני שומרון'] },
  { id: 'golan', name: 'גולן', lat: 33.0, lng: 35.75, cities: ['קצרין'] },
];

export const genderOptions = [
  { id: 'male', name: 'זכר' },
  { id: 'female', name: 'נקבה' },
  { id: 'any', name: 'לא משנה' },
];

export const languageOptions = [
  { id: 'hebrew', name: 'עברית' },
  { id: 'arabic', name: 'ערבית' },
  { id: 'russian', name: 'רוסית' },
  { id: 'english', name: 'אנגלית' },
  { id: 'french', name: 'צרפתית' },
  { id: 'amharic', name: 'אמהרית' },
  { id: 'spanish', name: 'ספרדית' },
  { id: 'yiddish', name: 'יידיש' },
];

export const healthFunds = [
  { id: 'clalit', name: 'כללית', color: '#00a651' },
  { id: 'maccabi', name: 'מכבי', color: '#0072bc' },
  { id: 'meuhedet', name: 'מאוחדת', color: '#ed1c24' },
  { id: 'leumit', name: 'לאומית', color: '#f7941d' },
  { id: 'private', name: 'פרטי', color: '#6b7280' },
];

export const popularSearches: Record<string, string[]> = {
  providers: ['רפואה', 'אחיות', 'רפואת שיניים', 'טיפולי שיקום', 'בריאות הנפש', 'תזונה ודיאטה', 'רפואה משלימה', 'אופטומטריה', 'מיילדות', 'טיפול וסיוע'],
  services: ['ביקור בית', 'טיפול סיעודי', 'פיזיותרפיה', 'ייעוץ רפואי', 'טיפול פסיכולוגי', 'עיסוי רפואי', 'בדיקות דם', 'חיסונים', 'ייעוץ תזונה', 'שיקום לאחר ניתוח'],
};

export const serviceTypes = [
  { id: 'home_visit', name: 'ביקור בית' },
  { id: 'clinic_visit', name: 'ביקור במרפאה' },
  { id: 'video_call', name: 'שיחת וידאו' },
  { id: 'phone_call', name: 'שיחה טלפונית' },
  { id: 'hourly', name: 'שירות לפי שעה' },
  { id: 'product', name: 'מוצר' },
];

export const serviceCategories = [
  { id: 'prof_medicine', name: 'רפואה' },
  { id: 'prof_nursing', name: 'אחיות/סיעוד' },
  { id: 'prof_dental', name: 'רפואת שיניים' },
  { id: 'prof_therapy', name: 'טיפולי שיקום' },
  { id: 'prof_mental', name: 'בריאות הנפש' },
  { id: 'prof_nutrition', name: 'תזונה ודיאטה' },
  { id: 'prof_alternative', name: 'רפואה משלימה' },
  { id: 'prof_optometry', name: 'אופטומטריה' },
  { id: 'prof_midwifery', name: 'מיילדות' },
  { id: 'prof_caregiving', name: 'טיפול וסיוע' },
];
