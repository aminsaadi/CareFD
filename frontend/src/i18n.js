import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  he: {
    translation: {
      // Common
      "welcome": "ברוכים הבאים ל-CareLink",
      "login": "התחברות",
      "register": "הרשמה",
      "logout": "התנתקות",
      "email": "אימייל",
      "password": "סיסמה",
      "name": "שם",
      "submit": "שלח",
      "cancel": "ביטול",
      "save": "שמור",
      "search": "חיפוש",
      "filter": "סינון",
      "loading": "טוען...",
      
      // Auth
      "loginWithGoogle": "התחבר עם Google",
      "orContinueWith": "או המשך עם",
      "dontHaveAccount": "אין לך חשבון?",
      "alreadyHaveAccount": "כבר יש לך חשבון?",
      "registerNow": "הירשם עכשיו",
      "loginNow": "התחבר עכשיו",
      "registerAsPatient": "הירשם כמטופל",
      "registerAsProvider": "הירשם כספק שירותים",
      
      // Navigation
      "home": "בית",
      "providers": "ספקים",
      "services": "שירותים",
      "requests": "בקשות",
      "products": "מוצרים",
      "myProfile": "הפרופיל שלי",
      "myBookings": "ההזמנות שלי",
      "myRequests": "הבקשות שלי",
      "dashboard": "לוח בקרה",
      
      // Landing Page
      "heroTitle": "מצא את שירותי הבריאות הטובים ביותר בישראל",
      "heroSubtitle": "פלטפורמה משולבת המחברת בין מטופלים לספקי שירותי בריאות",
      "getStarted": "התחל עכשיו",
      "howItWorks": "איך זה עובד",
      "forPatients": "למטופלים",
      "forProviders": "לספקי שירותים",
      
      // Provider Types
      "individual": "עצמאי",
      "company": "חברה",
      "clinic": "מרפאה",
      
      // Service Types
      "homeVisit": "ביקור בית",
      "clinicVisit": "ביקור במרפאה",
      "videoCall": "וידאו קונפרנס",
      "phoneCall": "שיחת טלפון",
      "hospital": "בית חולים",
      
      // Request & Offer
      "createRequest": "צור בקשה חדשה",
      "viewOffers": "צפה בהצעות",
      "makeOffer": "הגש הצעה",
      "acceptOffer": "קבל הצעה",
      "requestTitle": "כותרת הבקשה",
      "requestDescription": "תיאור הבקשה",
      "budget": "תקציב",
      "specialization": "התמחות",
      
      // Booking
      "bookNow": "הזמן עכשיו",
      "selectDate": "בחר תאריך",
      "selectTime": "בחר שעה",
      "confirmBooking": "אשר הזמנה",
      
      // Reviews
      "reviews": "ביקורות",
      "rating": "דירוג",
      "writeReview": "כתוב ביקורת",
      
      // Profile
      "editProfile": "ערוך פרופיל",
      "businessName": "שם העסק",
      "description": "תיאור",
      "location": "מיקום",
      "availability": "זמינות",
      "specializations": "התמחויות",
      
      // Messages
      "loginSuccess": "התחברות בוצעה בהצלחה",
      "registerSuccess": "הרשמה בוצעה בהצלחה",
      "errorOccurred": "אירעה שגיאה",
      "invalidCredentials": "פרטי התחברות שגויים",
    }
  },
  ar: {
    translation: {
      // Common
      "welcome": "مرحباً بك في CareLink",
      "login": "تسجيل الدخول",
      "register": "التسجيل",
      "logout": "تسجيل الخروج",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "name": "الاسم",
      "submit": "إرسال",
      "cancel": "إلغاء",
      "save": "حفظ",
      "search": "بحث",
      "filter": "تصفية",
      "loading": "جاري التحميل...",
      
      // Auth
      "loginWithGoogle": "تسجيل الدخول باستخدام Google",
      "orContinueWith": "أو المتابعة مع",
      "dontHaveAccount": "ليس لديك حساب؟",
      "alreadyHaveAccount": "لديك حساب بالفعل؟",
      "registerNow": "سجل الآن",
      "loginNow": "تسجيل الدخول الآن",
      "registerAsPatient": "التسجيل كمريض",
      "registerAsProvider": "التسجيل كمزود خدمة",
      
      // Navigation
      "home": "الرئيسية",
      "providers": "مقدمو الخدمات",
      "services": "الخدمات",
      "requests": "الطلبات",
      "products": "المنتجات",
      "myProfile": "ملفي الشخصي",
      "myBookings": "حجوزاتي",
      "myRequests": "طلباتي",
      "dashboard": "لوحة التحكم",
      
      // Landing Page
      "heroTitle": "ابحث عن أفضل خدمات الرعاية الصحية في إسرائيل",
      "heroSubtitle": "منصة متكاملة تربط المرضى بمقدمي خدمات الرعاية الصحية",
      "getStarted": "ابدأ الآن",
      "howItWorks": "كيف يعمل",
      "forPatients": "للمرضى",
      "forProviders": "لمقدمي الخدمات",
      
      // Provider Types
      "individual": "فردي",
      "company": "شركة",
      "clinic": "عيادة",
      
      // Service Types
      "homeVisit": "زيارة منزلية",
      "clinicVisit": "زيارة العيادة",
      "videoCall": "مكالمة فيديو",
      "phoneCall": "مكالمة هاتفية",
      "hospital": "مستشفى",
      
      // Request & Offer
      "createRequest": "إنشاء طلب جديد",
      "viewOffers": "عرض العروض",
      "makeOffer": "تقديم عرض",
      "acceptOffer": "قبول العرض",
      "requestTitle": "عنوان الطلب",
      "requestDescription": "وصف الطلب",
      "budget": "الميزانية",
      "specialization": "التخصص",
      
      // Booking
      "bookNow": "احجز الآن",
      "selectDate": "اختر التاريخ",
      "selectTime": "اختر الوقت",
      "confirmBooking": "تأكيد الحجز",
      
      // Reviews
      "reviews": "التقييمات",
      "rating": "التقييم",
      "writeReview": "اكتب تقييماً",
      
      // Profile
      "editProfile": "تعديل الملف الشخصي",
      "businessName": "اسم العمل",
      "description": "الوصف",
      "location": "الموقع",
      "availability": "التوفر",
      "specializations": "التخصصات",
      
      // Messages
      "loginSuccess": "تم تسجيل الدخول بنجاح",
      "registerSuccess": "تم التسجيل بنجاح",
      "errorOccurred": "حدث خطأ",
      "invalidCredentials": "بيانات اعتماد غير صالحة",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'he', // default language
    fallbackLng: 'he',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;