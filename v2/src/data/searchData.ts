export const israeliRegions = [
  { id: "tel_aviv", name: "תל אביב", lat: 32.08, lng: 34.78, cities: ["תל אביב-יפו", "רמת גן", "גבעתיים", "בני ברק", "חולון", "בת ים", "אור יהודה", "קריית אונו"] },
  { id: "center", name: "מרכז", lat: 32.07, lng: 34.82, cities: ["ראשון לציון", "פתח תקווה", "רחובות", "מודיעין", "לוד", "רמלה", "נס ציונה", "יבנה", "ראש העין"] },
  { id: "haifa", name: "חיפה והקריות", lat: 32.8, lng: 35.0, cities: ["חיפה", "קריית אתא", "קריית ביאליק", "קריית מוצקין", "קריית ים", "נשר", "טירת הכרמל"] },
  { id: "north", name: "צפון", lat: 32.96, lng: 35.5, cities: ["נצרת", "עפולה", "טבריה", "כרמיאל", "נהריה", "עכו", "צפת", "מגדל העמק"] },
  { id: "sharon", name: "השרון", lat: 32.3, lng: 34.85, cities: ["נתניה", "הרצליה", "כפר סבא", "רעננה", "הוד השרון", "רמת השרון"] },
  { id: "jerusalem", name: "ירושלים", lat: 31.77, lng: 35.23, cities: ["ירושלים", "בית שמש", "מעלה אדומים", "מבשרת ציון", "גבעת זאב"] },
  { id: "south", name: "דרום", lat: 31.25, lng: 34.79, cities: ["באר שבע", "אשדוד", "אשקלון", "קריית גת", "אילת", "דימונה", "ערד", "שדרות"] },
];

export const popularSearches = {
  providers: ["רפואה", "אחיות", "רפואת שיניים", "טיפולי שיקום", "בריאות הנפש", "תזונה ודיאטה", "רפואה משלימה", "מיילדות", "טיפול וסיוע"],
  services: ["ביקור בית", "טיפול סיעודי", "פיזיותרפיה", "ייעוץ רפואי", "טיפול פסיכולוגי", "עיסוי רפואי", "בדיקות דם", "ייעוץ תזונה"],
};

export const radiusOptions = [
  { value: "5", label: '5 ק"מ' },
  { value: "10", label: '10 ק"מ' },
  { value: "25", label: '25 ק"מ' },
  { value: "50", label: '50 ק"מ' },
];

export const serviceTypes = [
  { id: "home_visit", name: "ביקור בית" },
  { id: "clinic_visit", name: "ביקור במרפאה" },
  { id: "video_call", name: "שיחת וידאו" },
  { id: "phone_call", name: "שיחה טלפונית" },
  { id: "hourly", name: "שירות לפי שעה" },
  { id: "product", name: "מוצר" },
];

export const languageOptions = [
  { id: "hebrew", name: "עברית" },
  { id: "arabic", name: "ערבית" },
  { id: "russian", name: "רוסית" },
  { id: "english", name: "אנגלית" },
  { id: "french", name: "צרפתית" },
  { id: "amharic", name: "אמהרית" },
];

export const healthFunds = [
  { id: "clalit", name: "כללית", color: "#00AEEF" },
  { id: "maccabi", name: "מכבי", color: "#E31E24" },
  { id: "meuhedet", name: "מאוחדת", color: "#8DC63F" },
  { id: "leumit", name: "לאומית", color: "#F7941D" },
  { id: "private", name: "פרטי", color: "#6B7280" },
];

export const genderOptions = [
  { id: "male", name: "גבר" },
  { id: "female", name: "אישה" },
  { id: "any", name: "לא משנה" },
];
