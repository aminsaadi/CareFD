"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api, { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

interface RequestData {
  request_id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  professions?: string[];
  specialization?: string;
  service_type?: string;
  delivery_type?: string;
  budget?: number;
  budget_type?: string;
  hours_needed?: number;
  urgency?: string;
  preferred_date?: string;
  preferred_time?: string;
  gender_preference?: string;
  language_preferences?: string[];
  request_type?: string;
  preferences?: string;
  location?: { city?: string; address?: string };
  address_notes?: string;
  region?: string;
  offer_count?: number;
  created_at?: string;
}

interface ProfessionOption {
  profession_id?: string; id?: string; value?: string;
  name?: string; name_he?: string; label?: string;
}

interface SelectOption {
  type_id?: string; id?: string; value?: string;
  name_he?: string; name?: string; label?: string;
}

interface RegionOption {
  region_id?: string; name: string;
}

const isPatientRole = (role?: string) => role === "patient" || role === "user";

const GENDER_PREFERENCE_OPTIONS = [
  { value: "no_preference", label: "ללא העדפה" },
  { value: "male", label: "זכר" },
  { value: "female", label: "נקבה" },
];

const LANGUAGE_OPTIONS = [
  { value: "hebrew", label: "עברית" },
  { value: "arabic", label: "ערבית" },
  { value: "english", label: "אנגלית" },
  { value: "russian", label: "רוסית" },
  { value: "french", label: "צרפתית" },
  { value: "spanish", label: "ספרדית" },
  { value: "amharic", label: "אמהרית" },
];

const BUDGET_TYPE_OPTIONS = [
  { value: "per_hour", label: "לשעה" },
  { value: "per_treatment", label: "לטיפול" },
  { value: "per_visit", label: "לביקור" },
];

function RequestsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get("create") === "true");
  const [activeTab, setActiveTab] = useState("all");

  const [professionOptions, setProfessionOptions] = useState<ProfessionOption[]>([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<SelectOption[]>([]);
  const [deliveryTypeOptions, setDeliveryTypeOptions] = useState<SelectOption[]>([]);
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);

  const professionMap = useMemo(() => {
    const map: Record<string, string> = {};
    professionOptions.forEach((p) => {
      const id = p.profession_id || p.id || p.value || "";
      map[id] = p.name || p.name_he || p.label || "";
    });
    return map;
  }, [professionOptions]);

  const [formData, setFormData] = useState({
    title: "", description: "", professions: [] as string[], service_type: "",
    delivery_type: "", budget: "", budget_type: "", hours_needed: "",
    urgency: "medium", preferred_date: "", preferred_time: "",
    gender_preference: "", language_preferences: [] as string[],
    request_type: "one_time", preferences: "", city: "", address: "",
    address_notes: "", region: "",
  });

  useEffect(() => { fetchRequests(); }, [activeTab]);
  useEffect(() => { fetchFormOptions(); }, []);

  const fetchFormOptions = async () => {
    try {
      const [professionsRes, serviceTypesRes, deliveryTypesRes, regionsRes] = await Promise.all([
        api.get<{ professions?: ProfessionOption[] }>("/professions").catch(() => ({ professions: [] })),
        api.get<{ service_types?: SelectOption[] }>("/service-types").catch(() => ({ service_types: [] })),
        api.get<{ delivery_types?: SelectOption[] }>("/delivery-types").catch(() => ({ delivery_types: [] })),
        api.get<{ regions?: RegionOption[] }>("/regions").catch(() => ({ regions: [] })),
      ]);
      const profs = (professionsRes as any)?.professions || professionsRes || [];
      setProfessionOptions(Array.isArray(profs) ? profs : []);
      const sTypes = (serviceTypesRes as any)?.service_types || serviceTypesRes || [];
      setServiceTypeOptions(Array.isArray(sTypes) ? sTypes : []);
      const dTypes = (deliveryTypesRes as any)?.delivery_types || deliveryTypesRes || [];
      setDeliveryTypeOptions(Array.isArray(dTypes) ? dTypes : []);
      const regions = (regionsRes as any)?.regions || regionsRes || [];
      setRegionOptions(Array.isArray(regions) ? regions : []);
    } catch (error: any) { console.error("Failed to fetch form options:", error); }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === "my" ? "/requests/my" : "/requests";
      const data = await api.get<{ requests: RequestData[] }>(endpoint);
      setRequests(data.requests || []);
    } catch (error: any) { console.error("Failed to fetch requests:", error); }
    finally { setLoading(false); }
  };

  const handleProfessionToggle = (professionId: string) => {
    setFormData((prev) => {
      const current = prev.professions;
      if (current.includes(professionId)) return { ...prev, professions: current.filter((id) => id !== professionId) };
      if (current.length >= 3) { toast.error("ניתן לבחור עד 3 מקצועות"); return prev; }
      return { ...prev, professions: [...current, professionId] };
    });
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData((prev) => {
      const current = prev.language_preferences;
      if (current.includes(lang)) return { ...prev, language_preferences: current.filter((l) => l !== lang) };
      return { ...prev, language_preferences: [...current, lang] };
    });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title, description: formData.description,
        professions: formData.professions.length > 0 ? formData.professions : [],
        service_type: formData.service_type || null, delivery_type: formData.delivery_type || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        budget_type: formData.budget_type || null,
        hours_needed: formData.hours_needed ? parseInt(formData.hours_needed) : null,
        request_type: formData.request_type, urgency: formData.urgency,
        preferred_date: formData.preferred_date || null, preferred_time: formData.preferred_time || null,
        gender_preference: formData.gender_preference || null,
        language_preferences: formData.language_preferences.length > 0 ? formData.language_preferences : [],
        preferences: formData.preferences || null, address_notes: formData.address_notes || null,
        region: formData.region || null,
        location: (formData.city || formData.address) ? { city: formData.city || "", address: formData.address || "" } : null,
      };
      await api.post("/requests", payload);
      toast.success("הבקשה נוצרה בהצלחה!");
      setShowCreateForm(false);
      setFormData({
        title: "", description: "", professions: [], service_type: "",
        delivery_type: "", budget: "", budget_type: "", hours_needed: "",
        urgency: "medium", preferred_date: "", preferred_time: "",
        gender_preference: "", language_preferences: [], request_type: "one_time",
        preferences: "", city: "", address: "", address_notes: "", region: "",
      });
      fetchRequests();
    } catch (error: any) {
      const err = error as ApiError;
      toast.error(err.?.detail || "שגיאה ביצירת הבקשה");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-carefd-teal-pale flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* CTA Banner for patients */}
        {isPatientRole(user?.role) && !showCreateForm && (
          <div className="bg-gradient-to-l from-carefd-teal to-carefd-navy p-6 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h2 className="text-xl font-bold mb-1">צריכים שירות? פרסמו בקשה!</h2>
              <p className="text-carefd-teal-pale text-sm">תארו את הצורך שלכם וקבלו הצעות מספקים מתאימים</p>
            </div>
            <button onClick={() => setShowCreateForm(true)} className="bg-white text-carefd-teal px-6 py-3 rounded-xl font-bold hover:bg-carefd-teal-pale transition whitespace-nowrap" data-testid="create-request-btn">
              + צור בקשה
            </button>
          </div>
        )}

        {/* Login prompt for non-authenticated users */}
        {!user && (
          <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-2xl mb-6 text-center">
            <p className="text-carefd-navy font-medium mb-3">רוצים לפרסם בקשה? התחברו כדי להתחיל</p>
            <Link href="/login" className="inline-block bg-carefd-teal text-white px-6 py-2 rounded-lg hover:bg-carefd-teal-medium transition font-medium">
              התחברות
            </Link>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-carefd-navy font-heading" data-testid="requests-title">בקשות</h1>
          {isPatientRole(user?.role) && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-carefd-teal text-white px-6 py-2 rounded-lg hover:bg-carefd-teal-medium transition font-medium"
              data-testid="create-request-btn-toggle"
            >
              {showCreateForm ? "סגור" : "צור בקשה"}
            </button>
          )}
        </div>

        {/* Tabs */}
        {user && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === "all" ? "bg-carefd-teal text-white" : "bg-white text-carefd-navy border-2 border-carefd-light-gray hover:border-carefd-teal"}`}
              data-testid="tab-all-requests"
            >
              כל הבקשות
            </button>
            {isPatientRole(user?.role) && (
              <button
                onClick={() => setActiveTab("my")}
                className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === "my" ? "bg-carefd-teal text-white" : "bg-white text-carefd-navy border-2 border-carefd-light-gray hover:border-carefd-teal"}`}
                data-testid="tab-my-requests"
              >
                הבקשות שלי
              </button>
            )}
          </div>
        )}

        {/* Create Request Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border-2 border-carefd-teal" data-testid="create-request-form">
            <h2 className="text-xl font-semibold mb-4 text-carefd-navy">צור בקשה</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-carefd-navy">כותרת *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal"
                  placeholder="תארו בקצרה את השירות שאתם מחפשים" data-testid="request-title-input" />
              </div>

              <div>
                <label className="block text-sm font-medium text-carefd-navy">פרטים נוספים *</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal"
                  rows={4} placeholder="פרטו על הצורך, מצב רפואי רלוונטי, דרישות מיוחדות..." data-testid="request-description-input" />
              </div>

              {/* Professions - multi-select chips */}
              <div>
                <label className="block text-sm font-medium text-carefd-navy mb-2">מקצוע (עד 3)</label>
                <div className="flex flex-wrap gap-2" data-testid="request-professions-select">
                  {professionOptions.map((prof) => {
                    const profId = prof.profession_id || prof.id || prof.value || "";
                    const profName = prof.name || prof.name_he || prof.label || "";
                    const isSelected = formData.professions.includes(profId);
                    return (
                      <button key={profId} type="button" onClick={() => handleProfessionToggle(profId)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${isSelected ? "bg-carefd-teal text-white border-carefd-teal" : "bg-white text-carefd-navy border-carefd-light-gray hover:border-carefd-teal"}`}>
                        {profName}
                      </button>
                    );
                  })}
                  {professionOptions.length === 0 && <span className="text-sm text-gray-400">טוען מקצועות...</span>}
                </div>
                {formData.professions.length > 0 && <p className="text-xs text-carefd-gray mt-1">נבחרו {formData.professions.length}/3</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">סוג שירות</label>
                  <select value={formData.service_type} onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" data-testid="request-service-type-select">
                    <option value="">-- בחר סוג שירות --</option>
                    {serviceTypeOptions.map((st) => (
                      <option key={st.type_id || st.id || st.value} value={st.value || st.type_id || st.id}>{st.name_he || st.name || st.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">דרך מתן השירות</label>
                  <select value={formData.delivery_type} onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" data-testid="request-delivery-type-select">
                    <option value="">-- בחר דרך מתן שירות --</option>
                    {deliveryTypeOptions.map((dt) => (
                      <option key={dt.type_id || dt.id || dt.value} value={dt.value || dt.type_id || dt.id}>{dt.name_he || dt.name || dt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">תקציב</label>
                  <div className="mt-1 flex gap-2">
                    <input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" placeholder="₪" data-testid="request-budget-input" />
                    <select value={formData.budget_type} onChange={(e) => setFormData({ ...formData, budget_type: e.target.value })}
                      className="block w-32 px-2 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal text-sm" data-testid="request-budget-type-select">
                      <option value="">סוג</option>
                      {BUDGET_TYPE_OPTIONS.map((bt) => (<option key={bt.value} value={bt.value}>{bt.label}</option>))}
                    </select>
                  </div>
                </div>
                {formData.budget_type === "per_hour" && (
                  <div>
                    <label className="block text-sm font-medium text-carefd-navy">מספר שעות דרושות</label>
                    <input type="number" min="1" value={formData.hours_needed} onChange={(e) => setFormData({ ...formData, hours_needed: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" placeholder="מספר שעות" data-testid="request-hours-input" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">דחיפות</label>
                  <select value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" data-testid="request-urgency-select">
                    <option value="low">נמוכה</option><option value="medium">בינונית</option><option value="high">גבוהה</option><option value="urgent">דחוף</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">תאריך רצוי</label>
                  <input type="date" value={formData.preferred_date} onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" data-testid="request-date-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">שעה רצויה</label>
                  <input type="time" value={formData.preferred_time} onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" data-testid="request-time-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">העדפת מגדר</label>
                  <select value={formData.gender_preference} onChange={(e) => setFormData({ ...formData, gender_preference: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" data-testid="request-gender-select">
                    <option value="">-- ללא העדפה --</option>
                    {GENDER_PREFERENCE_OPTIONS.map((g) => (<option key={g.value} value={g.value}>{g.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">סוג בקשה</label>
                  <select value={formData.request_type} onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" data-testid="request-type-select">
                    <option value="one_time">חד פעמי</option><option value="immediate">מיידי</option><option value="scheduled">מתוזמן</option><option value="follow_up">המשך טיפול</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">אזור</label>
                  <select value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" data-testid="request-region-select">
                    <option value="">-- בחר אזור --</option>
                    {regionOptions.map((r) => (<option key={r.region_id || r.name} value={r.name}>{r.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">עיר</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" placeholder="בחר עיר..." data-testid="request-city-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">כתובת</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" placeholder="רחוב, מספר בית" data-testid="request-address-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-carefd-navy">הערות לכתובת</label>
                  <input type="text" value={formData.address_notes} onChange={(e) => setFormData({ ...formData, address_notes: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-carefd-light-gray rounded-md focus:ring-carefd-teal focus:border-carefd-teal" placeholder="קומה, דירה, קוד כניסה..." data-testid="request-address-notes-input" />
                </div>
              </div>

              {/* Language Preferences */}
              <div>
                <label className="block text-sm font-medium text-carefd-navy mb-2">העדפות שפה</label>
                <div className="flex flex-wrap gap-2" data-testid="request-languages-select">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const isSelected = formData.language_preferences.includes(lang.value);
                    return (
                      <button key={lang.value} type="button" onClick={() => handleLanguageToggle(lang.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${isSelected ? "bg-carefd-teal text-white border-carefd-teal" : "bg-white text-carefd-navy border-carefd-light-gray hover:border-carefd-teal"}`}>
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="bg-carefd-teal text-white px-6 py-2 rounded-lg hover:bg-carefd-teal-medium transition" data-testid="submit-request-btn">שלח</button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition" data-testid="cancel-request-btn">ביטול</button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12" data-testid="loading-indicator">טוען...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-600" data-testid="no-requests">
            {activeTab === "my" ? "אין לך בקשות עדיין" : "לא נמצאו בקשות"}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Link key={request.request_id} href={`/requests/${request.request_id}`}
                className="bg-white p-5 rounded-2xl shadow-lg border-2 border-carefd-teal-pale hover:border-carefd-teal transition block">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-carefd-navy text-lg">{request.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.status === "open" ? "bg-green-100 text-green-800" :
                    request.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                    request.status === "cancelled" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {request.status === "open" ? "פתוח" : request.status === "in_progress" ? "בתהליך" : request.status === "completed" ? "הושלם" : request.status === "cancelled" ? "בוטל" : request.status}
                  </span>
                </div>
                <p className="text-sm text-carefd-gray line-clamp-2 mb-3">{request.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {request.professions?.map((prof, idx) => (
                    <span key={idx} className="bg-carefd-teal-pale text-carefd-teal px-2 py-1 rounded-full">{professionMap[prof] || prof}</span>
                  ))}
                  {request.budget && <span className="text-carefd-teal font-bold">₪{request.budget}</span>}
                  {request.offer_count && request.offer_count > 0 && <span className="text-carefd-gray">{request.offer_count} הצעות</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">טוען...</div>}>
      <RequestsContent />
    </Suspense>
  );
}
