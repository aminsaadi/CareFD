"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationSettings from "@/components/NotificationSettings";
import { toast } from "sonner";
import {
  BarChart3, CalendarDays, Clock, Briefcase, FileText,
  DollarSign, MessageCircle, Star, Settings, Edit, Eye,
  Plus, Trash2, Save, ChevronLeft, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Hourglass, ArrowUpDown, MapPin,
  Home, Video, Building2, Phone as PhoneIcon, Loader2,
  Crown, Users, Shield, User,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "סקירה כללית", icon: BarChart3 },
  { id: "bookings", label: "תורים", icon: CalendarDays },
  { id: "calendar", label: "לוח שנה", icon: Clock },
  { id: "services", label: "שירותים", icon: Briefcase },
  { id: "requests", label: "בקשות פתוחות", icon: FileText },
  { id: "my_offers", label: "ההצעות שלי", icon: DollarSign },
  { id: "messages", label: "הודעות", icon: MessageCircle },
  { id: "reviews", label: "ביקורות", icon: Star },
  { id: "subscription", label: "מנוי", icon: Crown },
  { id: "clinics", label: "קליניקות", icon: Building2 },
  { id: "team", label: "צוות", icon: Users },
  { id: "user_info", label: "פרטי משתמש", icon: User },
  { id: "verification", label: "אימות", icon: Shield },
  { id: "settings", label: "הגדרות", icon: Settings },
];

const statusLabels: Record<string, string> = {
  pending: "ממתין לאישור", confirmed: "מאושר", in_progress: "בביצוע",
  provider_completed: "סומן כהושלם", completed: "הושלם", cancelled: "בוטל",
  cancellation_requested: "בקשת ביטול", rejected: "נדחה", on_hold: "בהשהיה",
};
const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700", provider_completed: "bg-purple-100 text-purple-700",
  in_progress: "bg-cyan-100 text-cyan-700", cancelled: "bg-red-100 text-red-700",
  cancellation_requested: "bg-orange-100 text-orange-700", rejected: "bg-red-100 text-red-700",
  on_hold: "bg-gray-100 text-gray-700",
};
const categoryIcons: Record<string, string> = { visit: "🏠", hourly: "⏰", consultation: "💬", product: "📦" };
const categoryNames: Record<string, string> = { visit: "שירות ביקור", hourly: "שירות שעתי", consultation: "ייעוץ", product: "מוצר" };
const deliveryNames: Record<string, string> = { home_visit: "בבית", hospital: "בי\"ח", clinic: "קליניקה", virtual: "וירט��אלי" };

const initServiceForm = {
  name: "", description: "", price: "", duration_minutes: "",
  service_category: "visit", delivery_types: [] as string[],
};

export default function ProviderDashboardPage() {
  const { user, provider } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [providerData, setProviderData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});
  const [bookingSortBy, setBookingSortBy] = useState("date_desc");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState(initServiceForm);
  const [stats, setStats] = useState({
    totalBookings: 0, pendingBookings: 0, completedBookings: 0,
    totalEarnings: 0, averageRating: 0, totalReviews: 0, profileViews: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prov, bk, svc, req, off, ch] = await Promise.all([
        api.get<any>("/providers/me").catch(() => null),
        api.get<any>("/bookings/provider").catch(() => ({ bookings: [] })),
        api.get<any>("/services/my").catch(() => ({ services: [] })),
        api.get<any>("/requests?status=open&limit=10").catch(() => ({ requests: [] })),
        api.get<any>("/offers/my").catch(() => ({ offers: [] })),
        api.get<any>("/chat/rooms").catch(() => ({ rooms: [] })),
      ]);
      if (prov) setProviderData(prov);
      const allBookings = bk?.bookings || [];
      setBookings(allBookings);
      setServices(svc?.services || []);
      setRequests(req?.requests || []);
      setMyOffers(off?.offers || []);
      setChats(ch?.rooms || ch || []);
      const completed = allBookings.filter((b: any) => b.status === "completed");
      setStats({
        totalBookings: allBookings.length,
        pendingBookings: allBookings.filter((b: any) => b.status === "pending").length,
        completedBookings: completed.length,
        totalEarnings: completed.reduce((sum: number, b: any) => sum + (parseFloat(b.final_price || b.base_price) || 0), 0),
        averageRating: prov?.rating || 0,
        totalReviews: prov?.total_reviews || 0,
        profileViews: prov?.views_count || 0,
      });
      if (prov?.provider_id) {
        api.get<any>(`/providers/${prov.provider_id}/reviews`).then((r) => setReviews(r?.reviews || [])).catch(() => {});
      }
    } catch { toast.error("שגיאה בטעינת נתונים"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateBookingStatus = async (bookingId: string, action: string) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { action });
      toast.success("הסטטוס עודכן בהצלחה");
      fetchData();
    } catch { toast.error("שגיאה בעדכון הסטטוס"); }
  };

  const handleCancellationResponse = async (bookingId: string, action: string) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { action: `${action}_cancellation` });
      toast.success(action === "approve" ? "בקשת הביטול אושרה" : "בקשת הביטול נדחתה");
      fetchData();
    } catch { toast.error("שגיאה בעדכון"); }
  };

  const resetServiceForm = () => {
    setServiceForm(initServiceForm);
    setEditingService(null);
    setShowServiceForm(false);
  };

  const handleEditService = (svc: any) => {
    setServiceForm({
      name: svc.name || "", description: svc.description || "",
      price: svc.price || "", duration_minutes: svc.duration_minutes || "",
      service_category: svc.service_category || "visit",
      delivery_types: svc.delivery_types || [],
    });
    setEditingService(svc);
    setShowServiceForm(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.price) { toast.error("נא למלא שם ומחיר"); return; }
    setSaving(true);
    try {
      const data = {
        name: serviceForm.name, description: serviceForm.description,
        price: parseFloat(serviceForm.price), duration_minutes: serviceForm.duration_minutes ? parseInt(serviceForm.duration_minutes) : null,
        service_category: serviceForm.service_category, delivery_types: serviceForm.delivery_types,
      };
      if (editingService) {
        await api.put(`/services/${editingService.service_id}`, data);
        toast.success("השירות עודכן!");
      } else {
        await api.post("/services", data);
        toast.success("השירות נוסף!");
      }
      resetServiceForm();
      fetchData();
    } catch { toast.error("שגיאה בשמירת השירות"); }
    finally { setSaving(false); }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("האם למחוק שירות זה?")) return;
    try { await api.delete(`/services/${serviceId}`); toast.success("השירות נמחק"); fetchData(); }
    catch { toast.error("שגיאה במחיקה"); }
  };

  const getSortedBookings = () => {
    const sorted = [...bookings];
    switch (bookingSortBy) {
      case "date_desc": return sorted.sort((a, b) => new Date(b.created_at || b.booking_date).getTime() - new Date(a.created_at || a.booking_date).getTime());
      case "date_asc": return sorted.sort((a, b) => new Date(a.created_at || a.booking_date).getTime() - new Date(b.created_at || b.booking_date).getTime());
      case "status": { const order: Record<string, number> = { cancellation_requested: 0, pending: 1, confirmed: 2, in_progress: 3, provider_completed: 4, on_hold: 5, completed: 6, cancelled: 7, rejected: 8 }; return sorted.sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99)); }
      case "price_desc": return sorted.sort((a, b) => (b.final_price || b.price || 0) - (a.final_price || a.price || 0));
      default: return sorted;
    }
  };

  const groupBookingsByDate = () => {
    const confirmed = bookings.filter((b) => ["confirmed", "in_progress"].includes(b.status));
    const grouped: Record<string, any[]> = {};
    confirmed.forEach((b) => {
      const d = b.booking_date?.split("T")[0] || "";
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(b);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  const pid = providerData?.provider_id || provider?.provider_id;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24 hidden lg:block">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-carefd-navy truncate">{providerData?.business_name || user?.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{providerData?.profession_name || ""}</p>
          </div>
          <nav className="p-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition text-sm ${activeTab === tab.id ? "bg-carefd-teal text-white" : "text-carefd-gray hover:bg-carefd-teal-pale/30"}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </nav>
        </div>
        {/* Mobile tab bar */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${activeTab === tab.id ? "bg-carefd-teal text-white" : "bg-white text-carefd-gray border border-slate-200"}`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-carefd-navy font-heading">שלום, {providerData?.business_name || user?.name}!</h1>
            <p className="text-carefd-gray text-sm">ניהול העסק שלך</p>
          </div>
          <div className="flex gap-2">
            {pid && <Button variant="outline" size="sm" asChild><Link href={`/providers/${pid}`}><Eye className="w-4 h-4 me-1" /> צפה בפרופיל</Link></Button>}
            {pid && <Button size="sm" asChild><Link href={`/provider/edit/${pid}`}><Edit className="w-4 h-4 me-1" /> ערוך פרופיל</Link></Button>}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : (
          <>
            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "תורים", value: stats.totalBookings, icon: CalendarDays, color: "bg-blue-50 text-blue-600" },
                    { label: "הכנסות", value: `₪${stats.totalEarnings.toLocaleString()}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
                    { label: "דירוג", value: (stats.averageRating || 0).toFixed(1), icon: Star, color: "bg-yellow-50 text-yellow-600", sub: `${stats.totalReviews} ביקורות` },
                    { label: "צפיות", value: stats.profileViews, icon: Eye, color: "bg-purple-50 text-purple-600" },
                  ].map((s) => (
                    <Card key={s.label} className="p-5 border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
                      </div>
                      <p className="text-2xl font-bold text-carefd-navy font-heading">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.sub || s.label}</p>
                    </Card>
                  ))}
                </div>

                {/* Pending Bookings */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-carefd-navy">תורים ממתינים ({stats.pendingBookings})</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("bookings")}>צפה בכל <ChevronLeft className="w-4 h-4 ms-1" /></Button>
                  </div>
                  {bookings.filter((b) => b.status === "pending").length === 0 ? (
                    <div className="text-center py-6 text-slate-400"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" /><p>אין תורים ממתינים</p></div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.filter((b) => b.status === "pending").slice(0, 3).map((b) => (
                        <div key={b.booking_id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                          <div>
                            <p className="font-medium text-carefd-navy">{b.user_name || "לקוח"}</p>
                            <p className="text-sm text-slate-500">{b.service_name} • {b.booking_date ? new Date(b.booking_date).toLocaleDateString("he-IL") : ""}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-carefd-teal hover:bg-carefd-teal-medium h-8" onClick={() => updateBookingStatus(b.booking_id, "confirm")}>אשר</Button>
                            <Button size="sm" variant="destructive" className="h-8" onClick={() => updateBookingStatus(b.booking_id, "reject")}>דחה</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-6 cursor-pointer hover-lift" onClick={() => setActiveTab("services")}>
                    <h3 className="font-bold text-carefd-navy mb-2">שירותים פעילים</h3>
                    <p className="text-4xl font-bold text-carefd-teal">{services.length}</p>
                    <p className="text-sm text-carefd-teal mt-1">נהל שירותים →</p>
                  </Card>
                  <Card className="p-6 cursor-pointer hover-lift" onClick={() => setActiveTab("requests")}>
                    <h3 className="font-bold text-carefd-navy mb-2">בקשות פתוחות</h3>
                    <p className="text-4xl font-bold text-carefd-teal">{requests.length}</p>
                    <p className="text-sm text-carefd-teal mt-1">צפה בבקשות →</p>
                  </Card>
                </div>
              </div>
            )}

            {/* ===== BOOKINGS TAB ===== */}
            {activeTab === "bookings" && (
              <Card className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-bold text-carefd-navy">ניהול תורים</h3>
                  <select value={bookingSortBy} onChange={(e) => setBookingSortBy(e.target.value)}
                    className="bg-white border-2 border-carefd-teal-pale/50 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer hover:border-carefd-teal focus:border-carefd-teal focus:outline-none focus:ring-2 focus:ring-carefd-teal/15 transition-all">
                    <option value="date_desc">חדש ← ישן</option>
                    <option value="date_asc">ישן ← חדש</option>
                    <option value="status">לפי סטטוס</option>
                    <option value="price_desc">לפי מחיר</option>
                  </select>
                </div>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400"><CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg">אין תורים עדיין</p></div>
                ) : (
                  <div className="space-y-3">
                    {getSortedBookings().map((b) => {
                      const isExp = expandedBookings[b.booking_id];
                      return (
                        <div key={b.booking_id} className={`border-2 rounded-xl transition-all overflow-hidden ${isExp ? "border-carefd-teal shadow-md" : "border-slate-200 hover:border-carefd-teal/40"}`}>
                          <div className="flex items-center justify-between gap-3 p-4 cursor-pointer" onClick={() => setExpandedBookings((p) => ({ ...p, [b.booking_id]: !p[b.booking_id] }))}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-carefd-navy/10 rounded-xl flex items-center justify-center text-carefd-navy font-bold text-sm flex-shrink-0">{(b.user_name || "ל")[0]}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap"><h4 className="font-bold text-carefd-navy text-sm">{b.user_name || "לקוח"}</h4><span className="text-xs text-slate-400">•</span><span className="text-xs text-slate-400">{b.service_name || "שירות"}</span></div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-carefd-teal" />{b.booking_date ? new Date(b.booking_date).toLocaleDateString("he-IL") : "יתואם"}</span>
                                  {b.booking_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-carefd-teal" />{b.booking_time}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[b.status] || b.status}</span>
                              {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>
                          {isExp && (
                            <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">תאריך</p><p className="font-medium text-sm">{b.booking_date ? new Date(b.booking_date).toLocaleDateString("he-IL") : "יתואם"}</p></div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">שעה</p><p className="font-medium text-sm">{b.booking_time || "יתואם"}</p></div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">מחיר</p><p className="font-medium text-sm text-green-600">{b.final_price ? `₪${b.final_price}` : "יתואם"}</p></div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">סוג</p><p className="font-medium text-sm">{b.delivery_type || b.service_type || "-"}</p></div>
                              </div>
                              {b.notes && <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm"><span className="font-medium">הערות: </span>{b.notes}</div>}
                              <div className="flex flex-wrap items-center gap-2">
                                {b.status === "pending" && (<>
                                  <Button size="sm" className="bg-carefd-teal hover:bg-carefd-teal-medium h-8" onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.booking_id, "confirm"); }}><CheckCircle className="w-3.5 h-3.5 me-1" />אשר</Button>
                                  <Button size="sm" variant="destructive" className="h-8" onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.booking_id, "reject"); }}><XCircle className="w-3.5 h-3.5 me-1" />דחה</Button>
                                  <Button size="sm" variant="outline" className="h-8" onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.booking_id, "hold"); }}><Hourglass className="w-3.5 h-3.5 me-1" />השהה</Button>
                                </>)}
                                {b.status === "confirmed" && (
                                  <Button size="sm" className="bg-purple-500 hover:bg-purple-600 h-8" onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.booking_id, "provider_complete"); }}><CheckCircle className="w-3.5 h-3.5 me-1" />סמן כהושלם</Button>
                                )}
                                {b.status === "on_hold" && (<>
                                  <Button size="sm" className="bg-carefd-teal hover:bg-carefd-teal-medium h-8" onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.booking_id, "confirm"); }}>אשר</Button>
                                  <Button size="sm" variant="destructive" className="h-8" onClick={(e) => { e.stopPropagation(); updateBookingStatus(b.booking_id, "reject"); }}>דחה</Button>
                                </>)}
                                {b.status === "cancellation_requested" && (<>
                                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 h-8" onClick={(e) => { e.stopPropagation(); handleCancellationResponse(b.booking_id, "approve"); }}>אשר ביטול</Button>
                                  <Button size="sm" variant="destructive" className="h-8" onClick={(e) => { e.stopPropagation(); handleCancellationResponse(b.booking_id, "reject"); }}>דחה ביטול</Button>
                                </>)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {/* ===== CALENDAR TAB ===== */}
            {activeTab === "calendar" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-carefd-navy mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-carefd-teal" />שעות פעילות</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"].map((day, idx) => {
                      const avail = providerData?.availability?.[idx] || {};
                      return (
                        <div key={day} className={`flex items-center justify-between p-3 rounded-xl border ${avail.is_active !== false ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                          <span className="font-medium text-carefd-navy w-16">{day}</span>
                          {avail.is_active !== false ? (
                            <span className="text-sm text-green-700 font-medium" dir="ltr">{avail.start || "09:00"} - {avail.end || "17:00"}</span>
                          ) : (<span className="text-sm text-slate-400">סגור</span>)}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">לעריכת שעות - <Link href={`/provider/edit/${pid}`} className="text-carefd-teal hover:underline">עריכת פרופיל</Link> → זמינות</p>
                </Card>
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-carefd-teal" />הזמנות מאושרות</h3>
                  {groupBookingsByDate().length === 0 ? (
                    <div className="text-center py-12 text-slate-400"><CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p>אין הזמנות מאושרות</p></div>
                  ) : (
                    <div className="space-y-6">
                      {groupBookingsByDate().map(([date, dayBookings]) => (
                        <div key={date} className="border-s-4 border-carefd-teal ps-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-carefd-teal text-white px-4 py-2 rounded-xl text-sm font-bold">{new Date(date).toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                            <span className="text-sm text-slate-400">{dayBookings.length} הזמנות</span>
                          </div>
                          <div className="space-y-2">
                            {dayBookings.map((b: any) => (
                              <div key={b.booking_id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-4">
                                  <div className="text-center min-w-[60px]"><div className="text-lg font-bold text-carefd-navy">{b.booking_time || "--:--"}</div></div>
                                  <div><p className="font-medium text-carefd-navy">{b.user_name || "לקוח"}</p><p className="text-sm text-slate-400">{b.service_name}</p></div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {b.final_price && <span className="text-sm font-bold text-carefd-teal">₪{b.final_price}</span>}
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || ""}`}>{statusLabels[b.status]}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ===== SERVICES TAB ===== */}
            {activeTab === "services" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-carefd-navy">ניהול שירותים</h3>
                    <Button onClick={() => { resetServiceForm(); setShowServiceForm(true); }}><Plus className="w-4 h-4 me-1" />הוסף שירות</Button>
                  </div>

                  {showServiceForm && (
                    <div className="mb-6 p-6 bg-carefd-teal-pale/20 rounded-xl border-2 border-carefd-teal">
                      <h4 className="font-bold text-carefd-navy mb-4 text-lg">{editingService ? "עריכת שירות" : "שירות חדש"}</h4>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="md:col-span-2"><label className="text-sm font-medium text-carefd-navy mb-1 block">שם השירות *</label><Input value={serviceForm.name} onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})} placeholder="לדוגמה: טיפול פיזיותרפיה" /></div>
                          <div className="md:col-span-2"><label className="text-sm font-medium text-carefd-navy mb-1 block">תיאור</label><textarea value={serviceForm.description} onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-carefd-teal focus:outline-none h-20 resize-none" placeholder="תאר את השירות..." /></div>
                        </div>
                        {/* Service Category */}
                        <div><label className="text-sm font-bold text-carefd-navy mb-3 block">סוג שירות *</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[{id:"visit",name:"שירות ביקור",icon:"🏠"},{id:"hourly",name:"שירות שעתי",icon:"⏰"},{id:"consultation",name:"ייעוץ",icon:"💬"},{id:"product",name:"מוצר",icon:"📦"}].map((cat) => (
                              <button key={cat.id} type="button" onClick={() => setServiceForm({...serviceForm, service_category: cat.id})}
                                className={`p-4 rounded-xl border-2 text-center transition ${serviceForm.service_category === cat.id ? "border-carefd-teal bg-carefd-teal/10" : "border-slate-200 hover:border-carefd-teal/50"}`}>
                                <span className="text-2xl">{cat.icon}</span><p className="font-medium text-carefd-navy mt-1 text-sm">{cat.name}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Delivery Types */}
                        <div><label className="text-sm font-bold text-carefd-navy mb-3 block">היכן יינתן השירות?</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[{id:"home_visit",name:"בבית",icon:"🏠"},{id:"hospital",name:"בי\"ח/מוסד",icon:"🏥"},{id:"clinic",name:"בקליניקה",icon:"🏢"},{id:"virtual",name:"וירטואלי",icon:"💻"}].map((dt) => (
                              <button key={dt.id} type="button" onClick={() => { const cur = serviceForm.delivery_types; setServiceForm({...serviceForm, delivery_types: cur.includes(dt.id) ? cur.filter((x) => x !== dt.id) : [...cur, dt.id]}); }}
                                className={`p-3 rounded-xl border-2 text-center transition ${serviceForm.delivery_types.includes(dt.id) ? "border-carefd-teal bg-carefd-teal/10" : "border-slate-200 hover:border-carefd-teal/50"}`}>
                                <span className="text-xl">{dt.icon}</span><p className="font-medium text-carefd-navy text-sm mt-1">{dt.name}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Price & Duration */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div><label className="text-sm font-medium text-carefd-navy mb-1 block">מחיר (₪) *</label><Input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})} placeholder="0" /></div>
                          <div><label className="text-sm font-medium text-carefd-navy mb-1 block">משך (דקות)</label><Input type="number" value={serviceForm.duration_minutes} onChange={(e) => setServiceForm({...serviceForm, duration_minutes: e.target.value})} placeholder="45" /></div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button onClick={handleSaveService} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Save className="w-4 h-4 me-1" />}{saving ? "שומר..." : "שמור שירות"}</Button>
                          <Button variant="outline" onClick={resetServiceForm}>ביטול</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Services List */}
                  {services.length === 0 ? (
                    <div className="text-center py-12 text-slate-400"><Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg mb-2">אין שירותים עדיין</p><p className="text-sm">הוסף שירות ראשון כדי שלקוחות יוכלו להזמין</p></div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {services.map((svc) => (
                        <div key={svc.service_id} className="border-2 border-slate-200 rounded-xl p-5 hover:border-carefd-teal transition">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-carefd-teal-pale rounded-xl flex items-center justify-center text-2xl">{categoryIcons[svc.service_category] || "📋"}</div>
                              <div><h4 className="font-bold text-carefd-navy">{svc.name}</h4><span className="text-xs bg-carefd-navy text-white px-2 py-0.5 rounded-full">{categoryNames[svc.service_category] || svc.service_category}</span></div>
                            </div>
                            <div className="text-left"><span className="text-2xl font-bold text-carefd-teal">₪{svc.price}</span>{svc.service_category === "hourly" && <span className="block text-xs text-slate-400">/שעה</span>}</div>
                          </div>
                          <p className="text-sm text-slate-400 mb-3 line-clamp-2">{svc.description || "ללא תיאור"}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {svc.delivery_types?.map((dt: string) => <span key={dt} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">{deliveryNames[dt] || dt}</span>)}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            {svc.duration_minutes ? <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration_minutes} דקות</span> : <span />}
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleEditService(svc)}><Edit className="w-4 h-4 text-carefd-teal" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteService(svc.service_id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ===== REQUESTS TAB ===== */}
            {activeTab === "requests" && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-carefd-navy flex items-center gap-2"><FileText className="w-5 h-5 text-carefd-teal" />בקשות פתוחות</h3>
                  <Button variant="ghost" size="sm" asChild><Link href="/requests">צפה בכל הבקשות</Link></Button>
                </div>
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg mb-2">אין בקשות פתוחות</p><Link href="/requests" className="text-carefd-teal hover:underline">עבור לדף הבקשות</Link></div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((r) => (
                      <div key={r.request_id || r.id} className="p-4 border-2 border-slate-200 rounded-xl hover:border-carefd-teal transition">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Link href={`/requests/${r.request_id || r.id}`} className="font-bold text-carefd-navy hover:text-carefd-teal transition text-lg">{r.title}</Link>
                            <p className="text-sm text-slate-400 line-clamp-2 mt-1">{r.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ms-4">
                            {r.budget && <span className="text-xl font-bold text-carefd-teal">₪{r.budget}</span>}
                            {r.urgency && r.urgency !== "medium" && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.urgency === "urgent" ? "bg-red-100 text-red-700" : r.urgency === "high" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                                {r.urgency === "urgent" ? "דחוף" : r.urgency === "high" ? "גבוה" : "נמוך"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
                          {r.specialization && <span className="bg-carefd-teal-pale text-carefd-teal px-2 py-1 rounded-full">{r.specialization}</span>}
                          <span>{r.location?.city || "לא צוין מיקום"}</span>
                          <span>{new Date(r.created_at).toLocaleDateString("he-IL")}</span>
                          {r.offer_count > 0 && <span className="text-carefd-teal font-medium">{r.offer_count} הצעות</span>}
                        </div>
                        <Button size="sm" asChild><Link href={`/requests/${r.request_id || r.id}`}><DollarSign className="w-4 h-4 me-1" />הגש הצעה</Link></Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ===== MY OFFERS TAB ===== */}
            {activeTab === "my_offers" && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2"><DollarSign className="w-5 h-5 text-carefd-teal" />ההצעות שלי</h3>
                {myOffers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400"><DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg">עדיין לא הגשת הצעות</p><Link href="/requests" className="text-carefd-teal hover:underline mt-2 inline-block">צפה בבקשות פתוחות</Link></div>
                ) : (
                  <div className="space-y-4">
                    {myOffers.map((offer) => {
                      const sc: Record<string, { color: string; text: string }> = {
                        pending: { color: "bg-yellow-100 text-yellow-800", text: "ממתין" },
                        accepted: { color: "bg-green-100 text-green-800", text: "התקבלה" },
                        rejected: { color: "bg-red-100 text-red-800", text: "נדחתה" },
                        withdrawn: { color: "bg-gray-100 text-gray-600", text: "נמשכה" },
                      };
                      const s = sc[offer.status] || sc.pending;
                      return (
                        <div key={offer.offer_id || offer.id} className={`p-4 border-2 rounded-xl transition ${offer.status === "accepted" ? "border-green-300 bg-green-50" : offer.status === "rejected" || offer.status === "withdrawn" ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200 hover:border-carefd-teal"}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link href={`/requests/${offer.request_id}`} className="font-bold text-carefd-navy hover:text-carefd-teal">{offer.request?.title || "בקשה"}</Link>
                              <p className="text-sm text-slate-400 mt-1">{new Date(offer.created_at).toLocaleDateString("he-IL")}</p>
                              <p className="text-slate-500 text-sm mt-2 line-clamp-2">{offer.message}</p>
                            </div>
                            <div className="text-left ms-4">
                              <div className="text-xl font-bold text-carefd-teal">₪{offer.price}</div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 inline-block ${s.color}`}>{s.text}</span>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            {offer.status === "pending" && (
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={async () => {
                                try { await api.post(`/offers/${offer.offer_id || offer.id}`, { action: "withdraw" }); toast.success("ההצעה נמשכה"); fetchData(); }
                                catch { toast.error("שגיאה"); }
                              }}>משוך הצעה</Button>
                            )}
                            {offer.status === "accepted" && <Button size="sm" variant="outline" asChild><Link href="/chats"><MessageCircle className="w-4 h-4 me-1" />פתח צ&apos;אט</Link></Button>}
                            <Button size="sm" variant="ghost" asChild><Link href={`/requests/${offer.request_id}`}>צפה בבקשה</Link></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {/* ===== MESSAGES TAB ===== */}
            {activeTab === "messages" && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-carefd-teal" />שיחות צ&apos;אט</h3>
                {chats.length === 0 ? (
                  <div className="text-center py-12 text-slate-400"><MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg">אין שיחות עדיין</p><p className="text-sm mt-2">כאשר לקוחות יפנו אליכם, השיחות יופיעו כאן</p></div>
                ) : (
                  <div className="space-y-3">
                    {chats.map((chat: any) => (
                      <Link key={chat.room_id} href={`/chats/${chat.room_id}`} className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-carefd-teal-pale/30 rounded-xl transition group">
                        <div className="w-12 h-12 bg-carefd-navy rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{(chat.other_user?.name || chat.provider?.business_name || "M")[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between"><p className="font-semibold text-carefd-navy group-hover:text-carefd-teal transition">{chat.other_user?.name || chat.provider?.business_name || "משתמש"}</p><span className="text-xs text-slate-400">{chat.last_message?.created_at ? new Date(chat.last_message.created_at).toLocaleDateString("he-IL") : ""}</span></div>
                          <p className="text-sm text-slate-400 truncate">{chat.last_message?.content || "לחצו להתחלת שיחה"}</p>
                        </div>
                        {chat.unread_count > 0 && <span className="bg-carefd-teal text-white text-xs font-bold px-2 py-1 rounded-full">{chat.unread_count}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ===== REVIEWS TAB ===== */}
            {activeTab === "reviews" && (
              <Card className="p-6">
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-carefd-teal">{(stats.averageRating || 0).toFixed(1)}</div>
                    <div className="flex justify-center my-2">{[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.round(stats.averageRating || 0) ? "text-yellow-500 fill-yellow-500" : "text-slate-300"}`} />)}</div>
                    <div className="text-sm text-slate-400">{stats.totalReviews} ביקורות</div>
                  </div>
                </div>
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-slate-400"><Star className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p>עדיין אין ביקורות</p></div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.review_id || r.id} className="border-b border-slate-100 pb-4 last:border-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-carefd-navy rounded-full flex items-center justify-center text-white font-bold">{(r.user?.name || "M")[0]}</div>
                          <div>
                            <p className="font-medium text-carefd-navy">{r.user?.name || "משתמש"}</p>
                            <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-300"}`} />)}</div>
                          </div>
                        </div>
                        <p className="text-slate-500">{r.comment}</p>
                        <p className="text-xs text-slate-400 mt-2">{new Date(r.created_at).toLocaleDateString("he-IL")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ===== SUBSCRIPTION TAB ===== */}
            {activeTab === "subscription" && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" />מנוי</h3>
                <div className={`p-6 rounded-2xl mb-6 ${providerData?.subscription_tier === "pro" ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200" : providerData?.subscription_tier === "premium" ? "bg-gradient-to-br from-carefd-teal/10 to-carefd-navy/10 border-2 border-carefd-teal" : "bg-slate-50 border-2 border-slate-200"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Crown className={`w-8 h-8 ${providerData?.subscription_tier === "premium" ? "text-carefd-teal" : providerData?.subscription_tier === "pro" ? "text-blue-600" : "text-slate-400"}`} />
                    <div>
                      <h4 className="text-lg font-bold text-carefd-navy">{providerData?.subscription_tier === "premium" ? "פרמיום" : providerData?.subscription_tier === "pro" ? "פרו" : "חינמי"}</h4>
                      <p className="text-sm text-slate-500">התוכנית הנוכחית שלך</p>
                    </div>
                  </div>
                  {(!providerData?.subscription_tier || providerData?.subscription_tier === "free") && (
                    <div className="bg-gradient-to-l from-blue-500 to-blue-600 rounded-xl p-4 text-white mt-4">
                      <p className="font-bold mb-1">שדרג לפרו!</p>
                      <p className="text-sm text-blue-100 mb-3">30 יום ניסיון חינם - פרופיל מקודם, שירותים ללא הגבלה</p>
                      <Button className="bg-white text-blue-600 hover:bg-blue-50" size="sm">נסה חינם 30 יום</Button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {["פרופיל מקודם בתוצאות החיפוש", "שירותים ללא הגבלה", "תווית 'מומלץ'", "סטטיסטיקות מתקדמות", "תמיכה מועדפת"].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${providerData?.subscription_tier !== "free" ? "text-carefd-teal" : i < 2 ? "text-carefd-teal" : "text-slate-300"}`} />
                      <span className={`text-sm ${providerData?.subscription_tier !== "free" || i < 2 ? "text-carefd-navy" : "text-slate-400"}`}>{f}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ===== CLINICS TAB ===== */}
            {activeTab === "clinics" && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-carefd-navy flex items-center gap-2"><Building2 className="w-5 h-5 text-carefd-teal" />קליניקות</h3>
                  <Button size="sm" asChild><Link href={`/provider/edit/${pid}?tab=location`}><Plus className="w-4 h-4 me-1" />הוסף קליניקה</Link></Button>
                </div>
                {providerData?.clinics?.length > 0 ? (
                  <div className="space-y-3">
                    {providerData.clinics.map((clinic: any, i: number) => (
                      <div key={i} className="border-2 border-slate-200 rounded-xl p-4 hover:border-carefd-teal transition">
                        <h4 className="font-bold text-carefd-navy">{clinic.name || `קליניקה ${i + 1}`}</h4>
                        {clinic.address && <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{clinic.address}{clinic.city ? `, ${clinic.city}` : ""}</p>}
                        {clinic.phone && <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><PhoneIcon className="w-3 h-3" />{clinic.phone}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-lg mb-2">אין קליניקות</p>
                    <p className="text-sm">הוסף קליניקה כדי שלקוחות ידעו היכן אתה מקבל</p>
                  </div>
                )}
              </Card>
            )}

            {/* ===== TEAM TAB ===== */}
            {activeTab === "team" && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-carefd-navy flex items-center gap-2"><Users className="w-5 h-5 text-carefd-teal" />צוות</h3>
                  <Button size="sm" asChild><Link href={`/provider/edit/${pid}`}><Plus className="w-4 h-4 me-1" />הוסף חבר צוות</Link></Button>
                </div>
                {providerData?.team_members?.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {providerData.team_members.map((member: any, i: number) => (
                      <div key={i} className="border-2 border-slate-200 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center text-white font-bold">{(member.name || "?")[0]}</div>
                        <div>
                          <h4 className="font-bold text-carefd-navy">{member.name}</h4>
                          <p className="text-sm text-slate-500">{member.role || member.title || "חבר צוות"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-lg mb-2">אין חברי צוות</p>
                    <p className="text-sm">הוסף חברי צוות שעובדים איתך</p>
                  </div>
                )}
              </Card>
            )}

            {/* ===== USER INFO TAB ===== */}
            {activeTab === "user_info" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2"><User className="w-5 h-5 text-carefd-teal" />פרטים אישיים</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">שם</p><p className="font-medium text-carefd-navy">{user?.name || "-"}</p></div>
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">אימייל</p><p className="font-medium text-carefd-navy" dir="ltr">{user?.email || "-"}</p></div>
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">טלפון</p><p className="font-medium text-carefd-navy" dir="ltr">{(user as any)?.phone || "-"}</p></div>
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">עיר</p><p className="font-medium text-carefd-navy">{(user as any)?.city || "-"}</p></div>
                  </div>
                  <Button className="mt-4" variant="outline" asChild><Link href="/profile"><Edit className="w-4 h-4 me-1" />ערוך פרטים אישיים</Link></Button>
                </Card>
              </div>
            )}

            {/* ===== VERIFICATION TAB ===== */}
            {activeTab === "verification" && (
              <div className="max-w-2xl">
                <Card className="p-6 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-carefd-teal" />
                    <div>
                      <h3 className="text-xl font-bold text-carefd-navy">אימות חשבון</h3>
                      <p className="text-sm text-slate-500">אמת את החשבון שלך כדי לקבל תג אימות בפרופיל</p>
                    </div>
                  </div>
                  {providerData?.is_verified ? (
                    <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div><p className="font-bold text-green-800">החשבון מאומת!</p><p className="text-sm text-green-600">תג אימות מופיע בפרופיל שלך</p></div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 rounded-xl p-4 flex items-center gap-3 mb-4">
                      <Hourglass className="w-6 h-6 text-amber-500" />
                      <div><p className="font-bold text-amber-800">החשבון טרם אומת</p><p className="text-sm text-amber-600">העלה מסמכים כדי להתחיל את תהליך האימות</p></div>
                    </div>
                  )}
                </Card>
                {!providerData?.is_verified && (
                  <Button asChild><Link href="/verification"><Shield className="w-4 h-4 me-1" />עבור לדף אימות מסמכים</Link></Button>
                )}
              </div>
            )}

            {/* ===== SETTINGS TAB ===== */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <NotificationSettings />
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-carefd-navy mb-6">הגדרות חשבון</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">שם העסק</p><p className="font-medium text-carefd-navy">{providerData?.business_name || "-"}</p></div>
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">אימייל</p><p className="font-medium text-carefd-navy">{user?.email || "-"}</p></div>
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">טלפון</p><p className="font-medium text-carefd-navy">{providerData?.phone || "-"}</p></div>
                    <Button asChild><Link href={`/provider/edit/${pid}`}><Settings className="w-4 h-4 me-1" />ערוך פרופיל מלא</Link></Button>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
