"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import {
  Save,
  User,
  Info,
  Star,
  GraduationCap,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Phone,
  Plus,
  X,
  Upload,
  Palette,
  Trash2,
} from "lucide-react";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-xl bg-slate-100 animate-pulse" />
  ),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = [
  { id: "basic", label: "בסיסי", icon: User },
  { id: "about", label: "אודות", icon: Info },
  { id: "expertise", label: "התמחות", icon: Star },
  { id: "education", label: "השכלה", icon: GraduationCap },
  { id: "location", label: "מיקום", icon: MapPin },
  { id: "availability", label: "זמינות", icon: Clock },
  { id: "audience", label: "קהל יעד", icon: Users },
  { id: "business", label: "עסקי", icon: Briefcase },
  { id: "contact", label: "קשר", icon: Phone },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SERVICE_TYPE_OPTIONS = [
  { value: "home_visit", label: "ביקור בית" },
  { value: "clinic_visit", label: "ביקור במרפאה" },
  { value: "video_call", label: "שיחת וידאו" },
  { value: "phone_call", label: "שיחה טלפונית" },
];

const DAYS = [
  { key: "sunday", label: "ראשון" },
  { key: "monday", label: "שני" },
  { key: "tuesday", label: "שלישי" },
  { key: "wednesday", label: "רביעי" },
  { key: "thursday", label: "חמישי" },
  { key: "friday", label: "שישי" },
  { key: "saturday", label: "שבת" },
];

const SHIFTS = [
  { key: "morning", label: "בוקר", time: "08:00-12:00" },
  { key: "afternoon", label: "צהריים", time: "12:00-16:00" },
  { key: "evening", label: "ערב", time: "16:00-20:00" },
  { key: "night", label: "לילה", time: "20:00-00:00" },
];

const LANGUAGE_OPTIONS = [
  { value: "hebrew", label: "עברית" },
  { value: "arabic", label: "ערבית" },
  { value: "english", label: "אנגלית" },
  { value: "russian", label: "רוסית" },
  { value: "french", label: "צרפתית" },
  { value: "amharic", label: "אמהרית" },
];

const TARGET_AUDIENCE_OPTIONS = [
  { value: "adults", label: "מבוגרים" },
  { value: "children", label: "ילדים" },
  { value: "youth", label: "נוער" },
  { value: "elderly", label: "קשישים" },
  { value: "pregnant", label: "נשים בהריון" },
  { value: "postpartum", label: "יולדות" },
  { value: "couples", label: "זוגות" },
  { value: "families", label: "משפחות" },
];

const HEALTH_FUND_OPTIONS = [
  { value: "clalit", label: "כללית" },
  { value: "maccabi", label: "מכבי" },
  { value: "meuhedet", label: "מאוחדת" },
  { value: "leumit", label: "לאומית" },
  { value: "private", label: "פרטי" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "מזומן" },
  { value: "credit_card", label: "כרטיס אשראי" },
  { value: "bit", label: "ביט" },
  { value: "bank_transfer", label: "העברה בנקאית" },
];

const PROFILE_GRADIENTS = [
  "linear-gradient(135deg, #14b8a6, #0d9488)",
  "linear-gradient(135deg, #3b82f6, #2563eb)",
  "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #ef4444, #dc2626)",
  "linear-gradient(135deg, #ec4899, #db2777)",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Education {
  degree: string;
  field: string;
  institution: string;
  year: string;
}

interface Certification {
  name: string;
  issuer: string;
  license_number: string;
  year: string;
  document_url: string;
}

interface Profession {
  profession_id: string;
  name: string;
  specializations?: { specialization_id: string; name: string }[];
}

interface FormData {
  business_name: string;
  gender: string;
  phone: string;
  email: string;
  description: string;
  profession_id: string;
  specialization_id: string;
  provider_type: string;
  years_experience: string;
  service_types: string[];
  specializations: string[];
  about: string;
  website: string;
  service_categories: string[];
  expertise: string[];
  education: Education[];
  certifications: Certification[];
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  service_areas: string[];
  coverage_radius_km: string;
  availability: Record<string, string[]>;
  languages: string[];
  target_audience: string[];
  health_funds: string[];
  payment_methods: string[];
  cancellation_notice_hours: string;
  cancellation_policy: string;
  profile_image: string;
  profile_color: string;
  show_phone: boolean;
  show_email: boolean;
  show_whatsapp: boolean;
  whatsapp_number: string;
}

const DEFAULT_FORM: FormData = {
  business_name: "",
  gender: "",
  phone: "",
  email: "",
  description: "",
  profession_id: "",
  specialization_id: "",
  provider_type: "",
  years_experience: "",
  service_types: [],
  specializations: [],
  about: "",
  website: "",
  service_categories: [],
  expertise: [],
  education: [],
  certifications: [],
  address: "",
  city: "",
  lat: null,
  lng: null,
  service_areas: [],
  coverage_radius_km: "",
  availability: {},
  languages: [],
  target_audience: [],
  health_funds: [],
  payment_methods: [],
  cancellation_notice_hours: "",
  cancellation_policy: "",
  profile_image: "",
  profile_color: PROFILE_GRADIENTS[0],
  show_phone: true,
  show_email: true,
  show_whatsapp: false,
  whatsapp_number: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toggleInArray(arr: string[], value: string): string[] {
  return arr.includes(value)
    ? arr.filter((v) => v !== value)
    : [...arr, value];
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ProviderEditPage() {
  const { providerId } = useParams();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCert, setUploadingCert] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // ---- Load data ----
  useEffect(() => {
    const load = async () => {
      try {
        const [providerData, profData] = await Promise.all([
          api.get<any>(`/providers/${providerId}`),
          api.get<{ professions: Profession[] }>("/professions"),
        ]);
        setProfessions(profData.professions || []);

        const p = providerData;
        setForm({
          business_name: p.business_name || "",
          gender: p.gender || "",
          phone: p.phone || "",
          email: p.email || "",
          description: p.description || "",
          profession_id: p.profession_id || "",
          specialization_id: p.specialization_id || "",
          provider_type: p.provider_type || "",
          years_experience: p.years_experience?.toString() || "",
          service_types: p.service_types || [],
          specializations: p.specializations || [],
          about: p.about || "",
          website: p.website || "",
          service_categories: p.service_categories || [],
          expertise: p.expertise || [],
          education: p.education || [],
          certifications: p.certifications || [],
          address: p.location?.address || p.address || "",
          city: p.location?.city || p.city || "",
          lat: p.location?.latitude ?? p.location?.lat ?? null,
          lng: p.location?.longitude ?? p.location?.lng ?? null,
          service_areas: p.service_areas || [],
          coverage_radius_km: p.coverage_radius_km?.toString() || "",
          availability: p.availability || {},
          languages: p.languages || [],
          target_audience: p.target_audience || [],
          health_funds: p.health_funds || [],
          payment_methods: p.payment_methods || [],
          cancellation_notice_hours:
            p.cancellation_notice_hours?.toString() || "",
          cancellation_policy: p.cancellation_policy || "",
          profile_image: p.profile_image || "",
          profile_color: p.profile_color || PROFILE_GRADIENTS[0],
          show_phone: p.show_phone ?? true,
          show_email: p.show_email ?? true,
          show_whatsapp: p.show_whatsapp ?? false,
          whatsapp_number: p.whatsapp_number || "",
        });
      } catch {
        toast.error("שגיאה בטעינת הפרופיל");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId]);

  // ---- Updaters ----
  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setField = useCallback(
    (key: keyof FormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
      },
    [],
  );

  // ---- Save ----
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/providers/${providerId}`, {
        ...form,
        years_experience: form.years_experience
          ? parseInt(form.years_experience)
          : null,
        coverage_radius_km: form.coverage_radius_km
          ? parseInt(form.coverage_radius_km)
          : null,
        cancellation_notice_hours: form.cancellation_notice_hours
          ? parseInt(form.cancellation_notice_hours)
          : null,
        location: {
          city: form.city,
          address: form.address,
          latitude: form.lat,
          longitude: form.lng,
        },
      });
      toast.success("הפרופיל עודכן בהצלחה");
      refreshUser();
    } catch {
      toast.error("שגיאה בשמירת הפרופיל");
    } finally {
      setSaving(false);
    }
  };

  // ---- Image Upload ----
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.upload<{ url: string }>("/upload/image", fd);
      set("profile_image", res.url);
      toast.success("התמונה הועלתה בהצלחה");
    } catch {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCertUpload = async (file: File, index: number) => {
    setUploadingCert(index);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.upload<{ url: string }>("/upload/image", fd);
      const updated = [...form.certifications];
      updated[index] = { ...updated[index], document_url: res.url };
      set("certifications", updated);
      toast.success("המסמך הועלה בהצלחה");
    } catch {
      toast.error("שגיאה בהעלאת המסמך");
    } finally {
      setUploadingCert(null);
    }
  };

  // ---- Availability helpers ----
  const toggleShift = (day: string, shift: string) => {
    setForm((prev) => {
      const avail = { ...prev.availability };
      const dayShifts = avail[day] || [];
      avail[day] = dayShifts.includes(shift)
        ? dayShifts.filter((s) => s !== shift)
        : [...dayShifts, shift];
      return { ...prev, availability: avail };
    });
  };

  // ---- Specializations from selected profession ----
  const selectedProfession = professions.find(
    (p) => p.profession_id === form.profession_id,
  );

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4" dir="rtl">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Card className="p-8">
          <Skeleton className="h-96 w-full" />
        </Card>
      </div>
    );
  }

  // ---- Section label ----
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-semibold text-slate-800 mb-4">{children}</h3>
  );

  // ---- Multi-toggle chips ----
  const ChipSelect = ({
    options,
    selected,
    onChange,
    max,
  }: {
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (val: string[]) => void;
    max?: number;
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <Badge
            key={opt.value}
            variant={active ? "default" : "outline"}
            className={`cursor-pointer px-3 py-1.5 text-sm transition-all select-none ${
              active
                ? "bg-carefd-teal text-white hover:bg-carefd-teal/90"
                : "hover:bg-slate-100"
            }`}
            onClick={() => {
              if (active) {
                onChange(selected.filter((v) => v !== opt.value));
              } else if (!max || selected.length < max) {
                onChange([...selected, opt.value]);
              } else {
                toast.error(`ניתן לבחור עד ${max} אפשרויות`);
              }
            }}
          >
            {opt.label}
          </Badge>
        );
      })}
    </div>
  );

  // ---- Array text input list ----
  const ArrayInput = ({
    items,
    onChange,
    placeholder,
  }: {
    items: string[];
    onChange: (val: string[]) => void;
    placeholder: string;
  }) => (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          >
            <X className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="w-4 h-4 me-1" />
        הוסף
      </Button>
    </div>
  );

  // ===========================================================================
  // TAB RENDERERS
  // ===========================================================================

  const renderBasic = () => (
    <div className="space-y-6">
      <SectionTitle>פרטים בסיסיים</SectionTitle>

      <div className="space-y-2">
        <Label>שם העסק</Label>
        <Input value={form.business_name} onChange={setField("business_name")} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>מגדר</Label>
          <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
            <SelectTrigger><SelectValue placeholder="בחר מגדר" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">זכר</SelectItem>
              <SelectItem value="female">נקבה</SelectItem>
              <SelectItem value="other">אחר</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>סוג נותן שירות</Label>
          <Select value={form.provider_type} onValueChange={(v) => set("provider_type", v)}>
            <SelectTrigger><SelectValue placeholder="בחר סוג" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">עצמאי</SelectItem>
              <SelectItem value="company">חברה</SelectItem>
              <SelectItem value="clinic">מרפאה</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>טלפון</Label>
          <Input value={form.phone} onChange={setField("phone")} dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label>אימייל</Label>
          <Input value={form.email} onChange={setField("email")} type="email" dir="ltr" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>תיאור קצר</Label>
        <Textarea value={form.description} onChange={setField("description")} rows={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>מקצוע</Label>
          <Select value={form.profession_id} onValueChange={(v) => { set("profession_id", v); set("specialization_id", ""); }}>
            <SelectTrigger><SelectValue placeholder="בחר מקצוע" /></SelectTrigger>
            <SelectContent>
              {professions.map((p) => (
                <SelectItem key={p.profession_id} value={p.profession_id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>התמחות</Label>
          <Select value={form.specialization_id} onValueChange={(v) => set("specialization_id", v)} disabled={!selectedProfession?.specializations?.length}>
            <SelectTrigger><SelectValue placeholder="בחר התמחות" /></SelectTrigger>
            <SelectContent>
              {(selectedProfession?.specializations || []).map((s) => (
                <SelectItem key={s.specialization_id} value={s.specialization_id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>שנות ניסיון</Label>
        <Input
          type="number"
          value={form.years_experience}
          onChange={setField("years_experience")}
          min={0}
          className="max-w-[200px]"
        />
      </div>

      <div className="space-y-2">
        <Label>סוגי שירות</Label>
        <ChipSelect
          options={SERVICE_TYPE_OPTIONS}
          selected={form.service_types}
          onChange={(v) => set("service_types", v)}
        />
      </div>

      <div className="space-y-2">
        <Label>התמחויות</Label>
        <ArrayInput
          items={form.specializations}
          onChange={(v) => set("specializations", v)}
          placeholder="הוסף התמחות"
        />
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-6">
      <SectionTitle>אודות</SectionTitle>
      <div className="space-y-2">
        <Label>אודות</Label>
        <Textarea
          value={form.about}
          onChange={setField("about")}
          rows={6}
          placeholder="ספר על עצמך, הניסיון שלך והשירותים שאתה מציע..."
        />
      </div>
      <div className="space-y-2">
        <Label>אתר אינטרנט</Label>
        <Input value={form.website} onChange={setField("website")} dir="ltr" placeholder="https://" />
      </div>
    </div>
  );

  const renderExpertise = () => (
    <div className="space-y-6">
      <SectionTitle>התמחות ומומחיות</SectionTitle>

      {selectedProfession?.specializations?.length ? (
        <div className="space-y-2">
          <Label>התמחות מתוך {selectedProfession.name}</Label>
          <ChipSelect
            options={(selectedProfession.specializations || []).map((s) => ({
              value: s.specialization_id,
              label: s.name,
            }))}
            selected={form.specialization_id ? [form.specialization_id] : []}
            onChange={(v) => set("specialization_id", v[v.length - 1] || "")}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          יש לבחור מקצוע בלשונית &quot;בסיסי&quot; כדי לצפות בהתמחויות
        </p>
      )}

      <div className="space-y-2">
        <Label>קטגוריות שירות (עד 3)</Label>
        <ArrayInput
          items={form.service_categories}
          onChange={(v) => {
            if (v.length <= 3) set("service_categories", v);
            else toast.error("ניתן לבחור עד 3 קטגוריות");
          }}
          placeholder="קטגוריית שירות"
        />
      </div>

      <div className="space-y-2">
        <Label>תחומי מומחיות</Label>
        <ArrayInput
          items={form.expertise}
          onChange={(v) => set("expertise", v)}
          placeholder="תחום מומחיות"
        />
      </div>
    </div>
  );

  const renderEducation = () => {
    const addEducation = () => {
      set("education", [
        ...form.education,
        { degree: "", field: "", institution: "", year: "" },
      ]);
    };
    const updateEducation = (i: number, key: keyof Education, val: string) => {
      const updated = [...form.education];
      updated[i] = { ...updated[i], [key]: val };
      set("education", updated);
    };
    const removeEducation = (i: number) => {
      set("education", form.education.filter((_, idx) => idx !== i));
    };

    const addCertification = () => {
      set("certifications", [
        ...form.certifications,
        { name: "", issuer: "", license_number: "", year: "", document_url: "" },
      ]);
    };
    const updateCertification = (i: number, key: keyof Certification, val: string) => {
      const updated = [...form.certifications];
      updated[i] = { ...updated[i], [key]: val };
      set("certifications", updated);
    };
    const removeCertification = (i: number) => {
      set("certifications", form.certifications.filter((_, idx) => idx !== i));
    };

    return (
      <div className="space-y-8">
        {/* Education */}
        <div className="space-y-4">
          <SectionTitle>השכלה</SectionTitle>
          {form.education.map((edu, i) => (
            <Card key={i} className="p-4 space-y-3 relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 start-2"
                onClick={() => removeEducation(i)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">תואר</Label>
                  <Input value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} placeholder="B.A / M.A / PhD" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">תחום</Label>
                  <Input value={edu.field} onChange={(e) => updateEducation(i, "field", e.target.value)} placeholder="תחום לימודים" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">מוסד</Label>
                  <Input value={edu.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} placeholder="שם המוסד" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">שנה</Label>
                  <Input value={edu.year} onChange={(e) => updateEducation(i, "year", e.target.value)} placeholder="2020" dir="ltr" />
                </div>
              </div>
            </Card>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addEducation}>
            <Plus className="w-4 h-4 me-1" />
            הוסף השכלה
          </Button>
        </div>

        {/* Certifications */}
        <div className="space-y-4">
          <SectionTitle>הסמכות ורישיונות</SectionTitle>
          {form.certifications.map((cert, i) => (
            <Card key={i} className="p-4 space-y-3 relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 start-2"
                onClick={() => removeCertification(i)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">שם ההסמכה</Label>
                  <Input value={cert.name} onChange={(e) => updateCertification(i, "name", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">גוף מנפיק</Label>
                  <Input value={cert.issuer} onChange={(e) => updateCertification(i, "issuer", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">מספר רישיון</Label>
                  <Input value={cert.license_number} onChange={(e) => updateCertification(i, "license_number", e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">שנה</Label>
                  <Input value={cert.year} onChange={(e) => updateCertification(i, "year", e.target.value)} placeholder="2020" dir="ltr" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">מסמך</Label>
                <div className="flex items-center gap-2">
                  {cert.document_url ? (
                    <Badge variant="outline" className="text-xs">
                      מסמך הועלה
                    </Badge>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    ref={(el) => { certFileRefs.current[i] = el; }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCertUpload(f, i);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingCert === i}
                    onClick={() => certFileRefs.current[i]?.click()}
                  >
                    {uploadingCert === i ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-3 h-3 me-1" />
                        העלה מסמך
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCertification}>
            <Plus className="w-4 h-4 me-1" />
            הוסף הסמכה
          </Button>
        </div>
      </div>
    );
  };

  const renderLocation = () => (
    <div className="space-y-6">
      <SectionTitle>מיקום ואזורי שירות</SectionTitle>

      <div className="space-y-2">
        <Label>כתובת</Label>
        <Input value={form.address} onChange={setField("address")} placeholder="רחוב ומספר" />
      </div>

      <div className="space-y-2">
        <Label>עיר</Label>
        <Input value={form.city} onChange={setField("city")} placeholder="עיר" />
      </div>

      <div className="space-y-2">
        <Label>מיקום על המפה</Label>
        <p className="text-xs text-slate-500">לחץ על המפה לבחירת מיקום</p>
        <MapPicker
          location={form.lat && form.lng ? { lat: form.lat, lng: form.lng } : null}
          radius={form.coverage_radius_km ? parseInt(form.coverage_radius_km) : undefined}
          onLocationSelect={(lat, lng) => {
            set("lat", lat);
            set("lng", lng);
          }}
          height="300px"
        />
        {form.lat && form.lng && (
          <p className="text-xs text-slate-500" dir="ltr">
            {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>אזורי שירות (ערים)</Label>
        <ArrayInput
          items={form.service_areas}
          onChange={(v) => set("service_areas", v)}
          placeholder="שם עיר"
        />
      </div>

      <div className="space-y-2">
        <Label>רדיוס כיסוי (ק&quot;מ)</Label>
        <Input
          type="number"
          value={form.coverage_radius_km}
          onChange={setField("coverage_radius_km")}
          min={0}
          className="max-w-[200px]"
          dir="ltr"
        />
      </div>
    </div>
  );

  const renderAvailability = () => (
    <div className="space-y-6">
      <SectionTitle>זמינות שבועית</SectionTitle>
      <p className="text-sm text-slate-500">לחץ על תא כדי להפעיל/לכבות משמרת</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 text-start border-b" />
              {SHIFTS.map((s) => (
                <th key={s.key} className="p-2 text-center border-b min-w-[90px]">
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-slate-400 font-normal" dir="ltr">{s.time}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day.key} className="border-b last:border-b-0">
                <td className="p-2 font-medium text-slate-700">{day.label}</td>
                {SHIFTS.map((shift) => {
                  const active = (form.availability[day.key] || []).includes(shift.key);
                  return (
                    <td key={shift.key} className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleShift(day.key, shift.key)}
                        className={`w-full h-10 rounded-lg border-2 transition-all ${
                          active
                            ? "bg-carefd-teal/15 border-carefd-teal text-carefd-teal font-medium"
                            : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        {active ? "V" : "-"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAudience = () => (
    <div className="space-y-6">
      <SectionTitle>שפות וקהל יעד</SectionTitle>

      <div className="space-y-2">
        <Label>שפות</Label>
        <ChipSelect
          options={LANGUAGE_OPTIONS}
          selected={form.languages}
          onChange={(v) => set("languages", v)}
        />
      </div>

      <div className="space-y-2">
        <Label>קהל יעד</Label>
        <ChipSelect
          options={TARGET_AUDIENCE_OPTIONS}
          selected={form.target_audience}
          onChange={(v) => set("target_audience", v)}
        />
      </div>
    </div>
  );

  const renderBusiness = () => (
    <div className="space-y-6">
      <SectionTitle>מידע עסקי</SectionTitle>

      <div className="space-y-2">
        <Label>קופות חולים</Label>
        <ChipSelect
          options={HEALTH_FUND_OPTIONS}
          selected={form.health_funds}
          onChange={(v) => set("health_funds", v)}
        />
      </div>

      <div className="space-y-2">
        <Label>אמצעי תשלום</Label>
        <ChipSelect
          options={PAYMENT_METHOD_OPTIONS}
          selected={form.payment_methods}
          onChange={(v) => set("payment_methods", v)}
        />
      </div>

      <div className="space-y-2">
        <Label>שעות הודעה מראש לביטול</Label>
        <Input
          type="number"
          value={form.cancellation_notice_hours}
          onChange={setField("cancellation_notice_hours")}
          min={0}
          className="max-w-[200px]"
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <Label>מדיניות ביטולים</Label>
        <Textarea
          value={form.cancellation_policy}
          onChange={setField("cancellation_policy")}
          rows={4}
          placeholder="תאר את מדיניות הביטולים שלך..."
        />
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="space-y-6">
      <SectionTitle>הגדרות פרופיל ויצירת קשר</SectionTitle>

      {/* Profile Image */}
      <div className="space-y-2">
        <Label>תמונת פרופיל</Label>
        <div className="flex items-center gap-4">
          {form.profile_image ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.profile_image}
                alt="profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: form.profile_color }}
            >
              {form.business_name?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingImage ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 me-1" />
                  העלה תמונה
                </>
              )}
            </Button>
            {form.profile_image && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 ms-2"
                onClick={() => set("profile_image", "")}
              >
                <Trash2 className="w-3 h-3 me-1" />
                הסר
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Color */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <Palette className="w-4 h-4" />
          צבע פרופיל
        </Label>
        <div className="flex gap-3">
          {PROFILE_GRADIENTS.map((gradient) => (
            <button
              key={gradient}
              type="button"
              onClick={() => set("profile_color", gradient)}
              className={`w-10 h-10 rounded-full transition-all ${
                form.profile_color === gradient
                  ? "ring-2 ring-offset-2 ring-carefd-teal scale-110"
                  : "hover:scale-105"
              }`}
              style={{ background: gradient }}
            />
          ))}
        </div>
      </div>

      {/* Visibility toggles */}
      <div className="space-y-4">
        <Label>הגדרות נראות</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">הצג טלפון בפרופיל</span>
            <Switch
              checked={form.show_phone}
              onCheckedChange={(v) => set("show_phone", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">הצג אימייל בפרופיל</span>
            <Switch
              checked={form.show_email}
              onCheckedChange={(v) => set("show_email", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">הצג WhatsApp בפרופיל</span>
            <Switch
              checked={form.show_whatsapp}
              onCheckedChange={(v) => set("show_whatsapp", v)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>מספר WhatsApp</Label>
        <Input
          value={form.whatsapp_number}
          onChange={setField("whatsapp_number")}
          dir="ltr"
          placeholder="+972..."
        />
      </div>
    </div>
  );

  // ---- Tab content map ----
  const TAB_CONTENT: Record<TabId, () => React.ReactNode> = {
    basic: renderBasic,
    about: renderAbout,
    expertise: renderExpertise,
    education: renderEducation,
    location: renderLocation,
    availability: renderAvailability,
    audience: renderAudience,
    business: renderBusiness,
    contact: renderContact,
  };

  return (
    <div className="max-w-4xl mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">עריכת פרופיל</h1>

      {/* Horizontal scrollable tabs */}
      <div className="mb-6 overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <Card className="p-6 md:p-8">
        {TAB_CONTENT[activeTab]()}
      </Card>

      {/* Save button */}
      <div className="mt-6 sticky bottom-4 z-10">
        <Button
          onClick={handleSave}
          className="w-full"
          size="lg"
          disabled={saving}
          data-testid="save-profile"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 me-2" />
              שמור שינויים
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
