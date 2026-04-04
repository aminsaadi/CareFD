"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import NotificationSettings from "@/components/NotificationSettings";
import {
  User, Camera, Trash2, Phone, Home, Lock, Shield, Eye, EyeOff,
  CheckCircle, Loader2, IdCard,
} from "lucide-react";

const PROFILE_COLORS = [
  "from-blue-500 to-purple-600",
  "from-pink-500 to-rose-500",
  "from-orange-400 to-red-500",
  "from-green-400 to-emerald-500",
  "from-indigo-500 to-purple-500",
  "from-teal-400 to-cyan-500",
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new_pw: false, confirm: false });

  const [userForm, setUserForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    profile_image: "",
    profile_color: PROFILE_COLORS[0],
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (user) {
      const nameParts = (user.name || "").split(" ");
      setUserForm({
        first_name: (user as any).first_name || nameParts[0] || "",
        last_name: (user as any).last_name || nameParts.slice(1).join(" ") || "",
        phone: user.phone || "",
        email: user.email || "",
        address: (user as any).address || "",
        city: (user as any).city || "",
        profile_image: (user as any).profile_image || user.picture || "",
        profile_color: (user as any).profile_color || PROFILE_COLORS[0],
      });
    }
  }, [user]);

  const getInitials = () => {
    const first = userForm.first_name?.[0] || "";
    const last = userForm.last_name?.[0] || "";
    return (first + last) || user?.name?.[0] || "?";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("נא להעלות קובץ תמונה בלבד"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("גודל הקובץ חייב להיות עד 5MB"); return; }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.upload<{ url: string }>("/upload/image", formData);
      setUserForm((prev) => ({ ...prev, profile_image: response.url }));
      toast.success("התמונה הועלתה בהצלחה!");
    } catch {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = () => {
    setUserForm((prev) => ({ ...prev, profile_image: "" }));
    toast.success("התמונה הוסרה");
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put("/users/me", {
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        phone: userForm.phone,
        address: userForm.address,
        city: userForm.city,
        profile_image: userForm.profile_image,
        profile_color: userForm.profile_color,
      });
      await refreshUser();
      toast.success("הפרטים נשמרו בהצלחה!");
    } catch (err: any) {
      toast.error(err?.detail || "שגיאה בשמירת הפרטים");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error("נא למלא את כל השדות");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("הסיסמאות החדשות אינן תואמות");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    setChangingPassword(true);
    try {
      await api.put("/users/me/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("הסיסמה שונתה בהצלחה!");
    } catch (err: any) {
      toast.error(err?.detail || "שגיאה בשינוי הסיסמה");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="mb-2">הגדרות חשבון</h1>
      <p className="text-slate-500 mb-6">עדכנו את הפרטים האישיים והגדרות החשבון שלכם</p>

      {/* Profile Image */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-carefd-teal" />
          תמונת פרופיל
        </h3>
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center ${
              userForm.profile_image ? "" : `bg-gradient-to-br ${userForm.profile_color}`
            }`}>
              {userForm.profile_image ? (
                <img src={userForm.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{getInitials()}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute bottom-0 right-0 w-8 h-8 bg-carefd-teal text-white rounded-full flex items-center justify-center shadow-lg hover:bg-carefd-teal/90 transition"
              title="העלה תמונה"
            >
              {uploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            {userForm.profile_image && (
              <button
                onClick={handleDeleteImage}
                className="absolute bottom-0 left-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition"
                title="מחק תמונה"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          <div className="flex-1">
            <p className="text-sm text-carefd-gray mb-3">בחר צבע רקע (יוצג כאשר אין תמונה)</p>
            <div className="flex gap-2">
              {PROFILE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setUserForm((prev) => ({ ...prev, profile_color: color }))}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} ${
                    userForm.profile_color === color ? "ring-2 ring-offset-2 ring-carefd-teal" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Details */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
          <IdCard className="w-5 h-5 text-carefd-teal" />
          פרטים אישיים
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">שם פרטי</label>
            <Input
              value={userForm.first_name}
              onChange={(e) => setUserForm((prev) => ({ ...prev, first_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">שם משפחה</label>
            <Input
              value={userForm.last_name}
              onChange={(e) => setUserForm((prev) => ({ ...prev, last_name: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      {/* Contact Details */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
          <Phone className="w-5 h-5 text-carefd-teal" />
          פרטי התקשרות
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">אימייל</label>
            <Input value={userForm.email} disabled className="bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">טלפון</label>
            <Input
              type="tel"
              value={userForm.phone}
              onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="050-0000000"
            />
          </div>
        </div>
      </Card>

      {/* Address */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
          <Home className="w-5 h-5 text-carefd-teal" />
          כתובת
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">עיר</label>
            <Input
              value={userForm.city}
              onChange={(e) => setUserForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="בחר עיר..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">כתובת מלאה</label>
            <Input
              value={userForm.address}
              onChange={(e) => setUserForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="רחוב, מספר בית, דירה"
            />
          </div>
        </div>
        <Button onClick={handleSaveSettings} disabled={savingSettings} className="mt-6">
          {savingSettings ? (
            <><Loader2 className="w-4 h-4 animate-spin me-2" />שומר...</>
          ) : (
            <><CheckCircle className="w-4 h-4 me-2" />שמור שינויים</>
          )}
        </Button>
      </Card>

      {/* Password */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-carefd-teal" />
          שינוי סיסמה
        </h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">סיסמה נוכחית</label>
            <div className="relative">
              <Input
                type={showPw.current ? "text" : "password"}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                className="pe-12"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal"
              >
                {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">סיסמה חדשה</label>
            <div className="relative">
              <Input
                type={showPw.new_pw ? "text" : "password"}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                className="pe-12"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => ({ ...p, new_pw: !p.new_pw }))}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal"
              >
                {showPw.new_pw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-carefd-navy mb-2">אישור סיסמה חדשה</label>
            <div className="relative">
              <Input
                type={showPw.confirm ? "text" : "password"}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                className="pe-12"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-carefd-gray hover:text-carefd-teal"
              >
                {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button variant="secondary" onClick={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? (
              <><Loader2 className="w-4 h-4 animate-spin me-2" />משנה...</>
            ) : (
              <><Shield className="w-4 h-4 me-2" />שנה סיסמה</>
            )}
          </Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <NotificationSettings />
    </div>
  );
}
