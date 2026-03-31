"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MapPicker from "@/components/MapPicker";
import api from "@/lib/api-client";
import { FaPlus, FaTrash, FaCheck } from "react-icons/fa";

interface Profession {
  profession_id: string;
  name: string;
  sub_professions?: { sub_profession_id: string; name: string }[];
}

interface LocationData {
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  coverage_radius_km: number;
}

export default function ProviderSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [formData, setFormData] = useState({
    provider_type: "individual",
    business_name: "",
    description: "",
    profession_id: "",
    profession_name: "",
    specialization_id: "",
    specialization_name: "",
    specializations: [""],
    location: {
      address: "",
      city: "",
      country: "Israel",
      latitude: null as number | null,
      longitude: null as number | null,
      coverage_radius_km: 10,
    },
  });

  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const data = await api.get<{ professions: Profession[] }>("/professions");
        setProfessions(data.professions || []);
      } catch (err) {
        console.error("Failed to fetch professions:", err);
      }
    };
    fetchProfessions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, location: { ...prev.location, [name]: value } }));
  };

  const handleSpecializationChange = (index: number, value: string) => {
    const newSpecs = [...formData.specializations];
    newSpecs[index] = value;
    setFormData((prev) => ({ ...prev, specializations: newSpecs }));
  };

  const addSpecialization = () => {
    setFormData((prev) => ({ ...prev, specializations: [...prev.specializations, ""] }));
  };

  const removeSpecialization = (index: number) => {
    setFormData((prev) => ({ ...prev, specializations: prev.specializations.filter((_, i) => i !== index) }));
  };

  const selectedProfession = professions.find((p) => p.profession_id === formData.profession_id);
  const subProfessions = selectedProfession?.sub_professions || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = {
        ...formData,
        user_id: user?.user_id,
        profession_title: formData.profession_name || "",
        specializations: formData.specializations.filter((s) => s.trim() !== ""),
      };
      await api.post("/providers", data);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.data?.detail || "אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "provider") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-red-600">רק ספקי שירותים יכולים לגשת לדף זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6" data-testid="provider-setup-title">הגדרת פרופיל ספק</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
          {/* Provider Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">סוג ספק</label>
            <select name="provider_type" value={formData.provider_type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" data-testid="provider-type-select">
              <option value="individual">עצמאי</option>
              <option value="company">חברה</option>
              <option value="clinic">מרפאה</option>
            </select>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם העסק</label>
            <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" data-testid="business-name-input" />
          </div>

          {/* Profession */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מקצוע *</label>
            <select
              value={formData.profession_id}
              onChange={(e) => {
                const prof = professions.find((p) => p.profession_id === e.target.value);
                setFormData((prev) => ({ ...prev, profession_id: e.target.value, profession_name: prof?.name || "", specialization_id: "", specialization_name: "" }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              data-testid="profession-select"
            >
              <option value="">בחר מקצוע</option>
              {professions.map((prof) => (
                <option key={prof.profession_id} value={prof.profession_id}>{prof.name}</option>
              ))}
            </select>
          </div>

          {/* Specialization (sub-profession) */}
          {formData.profession_id && subProfessions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">התמחות</label>
              <div className="flex flex-wrap gap-2">
                {subProfessions.map((sub) => (
                  <button
                    key={sub.sub_profession_id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, specialization_id: sub.sub_profession_id, specialization_name: sub.name }))}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                      formData.specialization_id === sub.sub_profession_id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {formData.specialization_id === sub.sub_profession_id && <FaCheck className="inline ms-1" size={12} />}
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" data-testid="description-input" />
          </div>

          {/* Additional Specializations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מומחיויות נוספות</label>
            {formData.specializations.map((spec, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input type="text" value={spec} onChange={(e) => handleSpecializationChange(index, e.target.value)} placeholder="לדוגמה: טיפול בכאבי גב, שיקום ספורטאים" className="flex-1 px-3 py-2 border border-gray-300 rounded-md" data-testid={`specialization-${index}`} />
                {formData.specializations.length > 1 && (
                  <button type="button" onClick={() => removeSpecialization(index)} className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600" data-testid={`remove-spec-${index}`}>
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addSpecialization} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-2" data-testid="add-specialization-btn">
              <FaPlus /> הוסף מומחיות
            </button>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold mb-4">מיקום</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">כתובת</label>
                <input type="text" name="address" value={formData.location.address} onChange={handleLocationChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" data-testid="address-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">עיר</label>
                <input type="text" name="city" value={formData.location.city} onChange={handleLocationChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" data-testid="city-input" placeholder="בחר עיר..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{`רדיוס כיסוי (ק"מ)`}</label>
                <input type="number" name="coverage_radius_km" value={formData.location.coverage_radius_km} onChange={handleLocationChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" data-testid="radius-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">בחר מיקום במפה (לחץ על המפה)</label>
                <MapPicker
                  location={formData.location}
                  setLocation={(updater: any) => {
                    setFormData((prev) => ({
                      ...prev,
                      location: typeof updater === "function" ? updater(prev.location) : updater,
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50" data-testid="submit-provider-btn">
              {loading ? "טוען..." : "שמור פרופיל"}
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-medium" data-testid="cancel-btn">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
