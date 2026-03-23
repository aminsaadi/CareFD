import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  he: {
    translation: {
      // Common
      "welcome": "ברוכים הבאים",
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
      "homeVisit": "בקור בית",
      "clinicVisit": "ביקור במרפאה",
      "videoCall": "וידאו קונפרנס",
      "phoneCall": "שיחת טלפון",
      "hospital": "בית חולים",
      "consultation": "ייעוץ",
      "per_hour": "לפי שעה",
      "home_visit": "ביקור בית",
      "clinic_visit": "ביקור במרפאה",
      
      // Request & Offer
      "createRequest": "צור בקשה חדשה",
      "viewOffers": "צפה בהצעות",
      "makeOffer": "הגש הצעה",
      "acceptOffer": "קבל הצעה",
      "rejectOffer": "דחה הצעה",
      "withdrawOffer": "משוך הצעה",
      "cancelRequest": "בטל בקשה",
      "requestTitle": "כותרת הבקשה",
      "requestDescription": "תיאור הבקשה",
      "budget": "תקציב",
      "specialization": "התמחות",
      "urgency": "דחיפות",
      "preferredDate": "תאריך רצוי",
      "preferences": "העדפות נוספות",
      "requestType": "סוג בקשה",
      "serviceType": "סוג שירות",
      "providerType": "סוג ספק",
      "allRequests": "כל הבקשות",
      "myOffers": "ההצעות שלי",
      "offerCount": "הצעות",
      "noOffers": "עדיין אין הצעות",
      "offerAccepted": "ההצעה התקבלה",
      "offerRejected": "ההצעה נדחתה",
      "offerWithdrawn": "ההצעה נמשכה",
      "offerPending": "ממתין",
      "requestCancelled": "הבקשה בוטלה",
      "cancelReason": "סיבת ביטול",
      "viewBooking": "צפה בהזמנה",
      "goToChat": "עבור לצ'אט",
      "immediate": "דחוף",
      "scheduled": "מתוזמן",
      "one_time": "חד פעמי",
      "follow_up": "המשך טיפול",
      "low": "נמוכה",
      "medium": "בינונית",
      "high": "גבוהה",
      "urgent": "דחוף מאוד",
      "offersReceived": "הצעות שהתקבלו",

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
      "welcome": "مرحباً بك",
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
      "consultation": "استشارة",
      "per_hour": "بالساعة",
      "home_visit": "زيارة منزلية",
      "clinic_visit": "زيارة العيادة",
      
      // Request & Offer
      "createRequest": "إنشاء طلب جديد",
      "viewOffers": "عرض العروض",
      "makeOffer": "تقديم عرض",
      "acceptOffer": "قبول العرض",
      "rejectOffer": "رفض العرض",
      "withdrawOffer": "سحب العرض",
      "cancelRequest": "إلغاء الطلب",
      "requestTitle": "عنوان الطلب",
      "requestDescription": "وصف الطلب",
      "budget": "الميزانية",
      "specialization": "التخصص",
      "urgency": "الأولوية",
      "preferredDate": "التاريخ المفضل",
      "preferences": "تفضيلات إضافية",
      "requestType": "نوع الطلب",
      "serviceType": "نوع الخدمة",
      "providerType": "نوع المزود",
      "allRequests": "جميع الطلبات",
      "myOffers": "عروضي",
      "offerCount": "العروض",
      "noOffers": "لا توجد عروض بعد",
      "offerAccepted": "تم قبول العرض",
      "offerRejected": "تم رفض العرض",
      "offerWithdrawn": "تم سحب العرض",
      "offerPending": "قيد الانتظار",
      "requestCancelled": "تم إلغاء الطلب",
      "cancelReason": "سبب الإلغاء",
      "viewBooking": "عرض الحجز",
      "goToChat": "الذهاب إلى الدردشة",
      "immediate": "عاجل",
      "scheduled": "مجدول",
      "one_time": "مرة واحدة",
      "follow_up": "متابعة",
      "low": "منخفض",
      "medium": "متوسط",
      "high": "مرتفع",
      "urgent": "عاجل جداً",
      "offersReceived": "العروض المستلمة",

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
  },
  en: {
    translation: {
      // Common
      "welcome": "Welcome",
      "login": "Login",
      "register": "Register",
      "logout": "Logout",
      "email": "Email",
      "password": "Password",
      "name": "Name",
      "submit": "Submit",
      "cancel": "Cancel",
      "save": "Save",
      "search": "Search",
      "filter": "Filter",
      "loading": "Loading...",
      
      // Auth
      "loginWithGoogle": "Login with Google",
      "orContinueWith": "Or continue with",
      "dontHaveAccount": "Don't have an account?",
      "alreadyHaveAccount": "Already have an account?",
      "registerNow": "Register Now",
      "loginNow": "Login Now",
      "registerAsPatient": "Register as Patient",
      "registerAsProvider": "Register as Provider",
      
      // Navigation
      "home": "Home",
      "providers": "Providers",
      "services": "Services",
      "requests": "Requests",
      "products": "Products",
      "myProfile": "My Profile",
      "myBookings": "My Bookings",
      "myRequests": "My Requests",
      "dashboard": "Dashboard",
      
      // Landing Page
      "heroTitle": "Find the Best Healthcare Services in Israel",
      "heroSubtitle": "An integrated platform connecting patients with healthcare service providers",
      "getStarted": "Get Started",
      "howItWorks": "How It Works",
      "forPatients": "For Patients",
      "forProviders": "For Providers",
      
      // Provider Types
      "individual": "Individual",
      "company": "Company",
      "clinic": "Clinic",
      
      // Service Types
      "homeVisit": "Home Visit",
      "clinicVisit": "Clinic Visit",
      "videoCall": "Video Call",
      "phoneCall": "Phone Call",
      "hospital": "Hospital",
      "consultation": "Consultation",
      "per_hour": "Per Hour",
      "home_visit": "Home Visit",
      "clinic_visit": "Clinic Visit",
      
      // Request & Offer
      "createRequest": "Create New Request",
      "viewOffers": "View Offers",
      "makeOffer": "Make Offer",
      "acceptOffer": "Accept Offer",
      "rejectOffer": "Reject Offer",
      "withdrawOffer": "Withdraw Offer",
      "cancelRequest": "Cancel Request",
      "requestTitle": "Request Title",
      "requestDescription": "Request Description",
      "budget": "Budget",
      "specialization": "Specialization",
      "urgency": "Urgency",
      "preferredDate": "Preferred Date",
      "preferences": "Additional Preferences",
      "requestType": "Request Type",
      "serviceType": "Service Type",
      "providerType": "Provider Type",
      "allRequests": "All Requests",
      "myOffers": "My Offers",
      "offerCount": "Offers",
      "noOffers": "No offers yet",
      "offerAccepted": "Offer Accepted",
      "offerRejected": "Offer Rejected",
      "offerWithdrawn": "Offer Withdrawn",
      "offerPending": "Pending",
      "requestCancelled": "Request Cancelled",
      "cancelReason": "Cancellation Reason",
      "viewBooking": "View Booking",
      "goToChat": "Go to Chat",
      "immediate": "Immediate",
      "scheduled": "Scheduled",
      "one_time": "One Time",
      "follow_up": "Follow Up",
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "urgent": "Urgent",
      "offersReceived": "Offers Received",

      // Booking
      "bookNow": "Book Now",
      "selectDate": "Select Date",
      "selectTime": "Select Time",
      "confirmBooking": "Confirm Booking",
      
      // Reviews
      "reviews": "Reviews",
      "rating": "Rating",
      "writeReview": "Write Review",
      
      // Profile
      "editProfile": "Edit Profile",
      "businessName": "Business Name",
      "description": "Description",
      "location": "Location",
      "availability": "Availability",
      "specializations": "Specializations",
      
      // Messages
      "loginSuccess": "Login Successful",
      "registerSuccess": "Registration Successful",
      "errorOccurred": "An Error Occurred",
      "invalidCredentials": "Invalid Credentials",
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
      escapeValue: true
    }
  });

// Set initial direction
const setDirection = (lang) => {
  const rtlLanguages = ['he', 'ar'];
  const dir = rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
};

// Set direction on init
setDirection(i18n.language);

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  setDirection(lng);
});

export default i18n;
