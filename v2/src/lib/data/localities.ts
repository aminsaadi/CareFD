// Israeli localities with coordinates – top cities
// Full list can be loaded from DB or external source

export interface Locality {
  name: string;
  region: string;
  lat: number;
  lng: number;
}

export const israeliLocalities: Locality[] = [
  { name: "תל אביב-יפו", region: "תל אביב", lat: 32.0853, lng: 34.7818 },
  { name: "ירושלים", region: "ירושלים", lat: 31.7683, lng: 35.2137 },
  { name: "חיפה", region: "חיפה", lat: 32.7940, lng: 34.9896 },
  { name: "ראשון לציון", region: "מרכז", lat: 31.9730, lng: 34.7925 },
  { name: "פתח תקווה", region: "מרכז", lat: 32.0889, lng: 34.8864 },
  { name: "אשדוד", region: "דרום", lat: 31.8014, lng: 34.6435 },
  { name: "נתניה", region: "השרון", lat: 32.3215, lng: 34.8532 },
  { name: "באר שבע", region: "דרום", lat: 31.2518, lng: 34.7913 },
  { name: "חולון", region: "תל אביב", lat: 32.0108, lng: 34.7748 },
  { name: "בני ברק", region: "תל אביב", lat: 32.0838, lng: 34.8340 },
  { name: "רמת גן", region: "תל אביב", lat: 32.0700, lng: 34.8235 },
  { name: "אשקלון", region: "דרום", lat: 31.6688, lng: 34.5743 },
  { name: "רחובות", region: "מרכז", lat: 31.8928, lng: 34.8113 },
  { name: "בת ים", region: "תל אביב", lat: 32.0171, lng: 34.7510 },
  { name: "הרצליה", region: "השרון", lat: 32.1663, lng: 34.8463 },
  { name: "כפר סבא", region: "השרון", lat: 32.1750, lng: 34.9069 },
  { name: "רעננה", region: "השרון", lat: 32.1837, lng: 34.8700 },
  { name: "הוד השרון", region: "השרון", lat: 32.1500, lng: 34.8833 },
  { name: "מודיעין-מכבים-רעות", region: "מרכז", lat: 31.8975, lng: 35.0106 },
  { name: "נצרת", region: "צפון", lat: 32.6996, lng: 35.3035 },
  { name: "לוד", region: "מרכז", lat: 31.9514, lng: 34.8890 },
  { name: "רמלה", region: "מרכז", lat: 31.9275, lng: 34.8625 },
  { name: "נהריה", region: "צפון", lat: 33.0064, lng: 35.0946 },
  { name: "עכו", region: "צפון", lat: 32.9272, lng: 35.0764 },
  { name: "כרמיאל", region: "צפון", lat: 32.9128, lng: 35.2961 },
  { name: "טבריה", region: "צפון", lat: 32.7922, lng: 35.5312 },
  { name: "עפולה", region: "צפון", lat: 32.6079, lng: 35.2883 },
  { name: "אילת", region: "דרום", lat: 29.5577, lng: 34.9519 },
  { name: "קריית שמונה", region: "צפון", lat: 33.2075, lng: 35.5697 },
  { name: "צפת", region: "צפון", lat: 32.9646, lng: 35.4968 },
  { name: "דימונה", region: "דרום", lat: 31.0697, lng: 35.0331 },
  { name: "ערד", region: "דרום", lat: 31.2614, lng: 35.2124 },
  { name: "קריית גת", region: "דרום", lat: 31.6099, lng: 34.7642 },
  { name: "קריית ביאליק", region: "חיפה", lat: 32.8333, lng: 35.0833 },
  { name: "קריית מוצקין", region: "חיפה", lat: 32.8333, lng: 35.0667 },
  { name: "קריית אתא", region: "חיפה", lat: 32.8000, lng: 35.1000 },
  { name: "נס ציונה", region: "מרכז", lat: 31.9290, lng: 34.7989 },
  { name: "יבנה", region: "מרכז", lat: 31.8785, lng: 34.7349 },
  { name: "אור יהודה", region: "תל אביב", lat: 32.0264, lng: 34.8553 },
  { name: "גבעתיים", region: "תל אביב", lat: 32.0717, lng: 34.8122 },
  { name: "קריית אונו", region: "תל אביב", lat: 32.0633, lng: 34.8553 },
  { name: "גבעת שמואל", region: "מרכז", lat: 32.0822, lng: 34.8514 },
  { name: "ראש העין", region: "מרכז", lat: 32.0961, lng: 34.9561 },
  { name: "אריאל", region: "יהודה ושומרון", lat: 32.1056, lng: 35.1736 },
  { name: "בית שמש", region: "ירושלים", lat: 31.7484, lng: 34.9858 },
  { name: "מעלה אדומים", region: "ירושלים", lat: 31.7733, lng: 35.2997 },
  { name: "גבעת זאב", region: "ירושלים", lat: 31.8600, lng: 35.1700 },
  { name: "שדרות", region: "דרום", lat: 31.5266, lng: 34.5959 },
  { name: "נתיבות", region: "דרום", lat: 31.4217, lng: 34.5878 },
  { name: "אופקים", region: "דרום", lat: 31.3158, lng: 34.6219 },
  { name: "קצרין", region: "גולן", lat: 32.9944, lng: 35.6911 },
  { name: "טירת כרמל", region: "חיפה", lat: 32.7592, lng: 34.9714 },
  { name: "חדרה", region: "חיפה", lat: 32.4340, lng: 34.9196 },
  { name: "יקנעם עילית", region: "צפון", lat: 32.6589, lng: 35.1094 },
  { name: "מגדל העמק", region: "צפון", lat: 32.6731, lng: 35.2408 },
  { name: "נוף הגליל", region: "צפון", lat: 32.7067, lng: 35.3167 },
  { name: "שפרעם", region: "צפון", lat: 32.8053, lng: 35.1703 },
  { name: "רמת השרון", region: "השרון", lat: 32.1422, lng: 34.8389 },
];

export function searchLocalities(query: string, limit = 10): Locality[] {
  return israeliLocalities
    .filter((loc) => loc.name.includes(query))
    .slice(0, limit);
}

export function getLocalityCoords(name: string): { lat: number; lng: number } | null {
  const loc = israeliLocalities.find(
    (l) => l.name === name || l.name.includes(name) || name.includes(l.name)
  );
  return loc ? { lat: loc.lat, lng: loc.lng } : null;
}
