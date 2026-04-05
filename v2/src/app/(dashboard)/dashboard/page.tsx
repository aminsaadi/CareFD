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
import CompletionConfirmDialog from "@/components/CompletionConfirmDialog";
import { toast } from "sonner";
import {
  User, CalendarDays, FileText, Star, MessageCircle,
  Heart, Settings, Search, Plus, ChevronLeft, ChevronDown,
  ChevronUp, Clock, CheckCircle, Hourglass, XCircle, Eye,
  Loader2,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "סקירה כללית", icon: User },
  { id: "bookings", label: "ההזמנות שלי", icon: CalendarDays },
  { id: "requests", label: "הבקשות שלי", icon: FileText },
  { id: "reviews", label: "הביקורות שלי", icon: Star },
  { id: "messages", label: "הודעות", icon: MessageCircle },
  { id: "favorites", label: "מועדפים", icon: Heart },
  { id: "settings", label: "הגדרות", icon: Settings },
];

const statusLabels: Record<string, string> = {
  pending: "ממתין", confirmed: "מאושר", in_progress: "בביצוע",
  provider_completed: "סומן כהושלם", completed: "הושלם", cancelled: "בוטל",
  cancellation_requested: "בקשת ביטול", rejected: "נדחה", on_hold: "בהמתנה",
};
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700", provider_completed: "bg-purple-100 text-purple-700",
  in_progress: "bg-cyan-100 text-cyan-700", cancelled: "bg-red-100 text-red-700",
  cancellation_requested: "bg-orange-100 text-orange-700", rejected: "bg-red-100 text-red-700",
  on_hold: "bg-gray-100 text-gray-700",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [bookings, setBookings] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});
  const [bookingSortBy, setBookingSortBy] = useState("date_desc");
  const [requestFilter, setRequestFilter] = useState("all");
  const [showCompletionDialog, setShowCompletionDialog] = useState<any>(null);
  const [stats, setStats] = useState({
    totalBookings: 0, pendingBookings: 0, completedBookings: 0,
    awaitingConfirmation: 0, totalRequests: 0, unreadMessages: 0,
  });

  useEffect(() => {
    if (user?.role === "provider") { router.replace("/provider/dashboard"); return; }
    if (user?.role === "admin") { router.replace("/admin/overview"); return; }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bk, rq, ch, rv, fv] = await Promise.all([
        api.get<any>("/bookings/my").catch(() => ({ bookings: [] })),
        api.get<any>("/requests/my").catch(() => ({ requests: [] })),
        api.get<any>("/chat/rooms").catch(() => ({ rooms: [] })),
        api.get<any>("/reviews/my").catch(() => ({ reviews: [] })),
        api.get<any>("/favorites").catch(() => ({ favorites: [] })),
      ]);
      const allBookings = bk?.bookings || [];
      setBookings(allBookings);
      setRequests(rq?.requests || []);
      setChats(ch?.rooms || ch || []);
      setMyReviews(rv?.reviews || []);
      setFavorites(fv?.favorites || fv || []);
      setStats({
        totalBookings: allBookings.length,
        pendingBookings: allBookings.filter((b: any) => b.status === "pending").length,
        completedBookings: allBookings.filter((b: any) => b.status === "completed").length,
        awaitingConfirmation: allBookings.filter((b: any) => b.status === "provider_completed").length,
        totalRequests: (rq?.requests || []).length,
        unreadMessages: (ch?.rooms || ch || []).reduce((acc: number, r: any) => acc + (r.unread_count || 0), 0),
      });
    } catch { toast.error("שגיאה בטעינת נתונים"); }
    finally { setLoading(false); }
  };

  const getSortedBookings = () => {
    const sorted = [...bookings];
    switch (bookingSortBy) {
      case "date_desc": return sorted.sort((a, b) => new Date(b.created_at || b.booking_date).getTime() - new Date(a.created_at || a.booking_date).getTime());
      case "date_asc": return sorted.sort((a, b) => new Date(a.created_at || a.booking_date).getTime() - new Date(b.created_at || b.booking_date).getTime());
      case "status": { const order: Record<string, number> = { provider_completed: 0, pending: 1, confirmed: 2, in_progress: 3, completed: 6, cancelled: 7 }; return sorted.sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99)); }
      case "price_desc": return sorted.sort((a, b) => (b.final_price || b.price || 0) - (a.final_price || a.price || 0));
      default: return sorted;
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("האם לבטל בקשה זו?")) return;
    try { await api.put(`/requests/${requestId}`, { status: "cancelled" }); toast.success("הבקשה בוטלה"); fetchData(); }
    catch { toast.error("שגיאה בביטול"); }
  };

  const handleRemoveFavorite = async (providerId: string) => {
    try { await api.delete(`/favorites/${providerId}`); toast.success("הוסר מהמועדפים"); fetchData(); }
    catch { toast.error("שגיאה"); }
  };

  const filteredRequests = requests.filter((r) => requestFilter === "all" || r.status === requestFilter);

  if (!user || user.role !== "patient") return null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24 hidden lg:block">
          <div className="bg-gradient-to-r from-carefd-navy to-carefd-slate p-6 text-white text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-carefd-teal to-carefd-navy flex items-center justify-center">
              {user?.picture ? <img src={user.picture} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-white text-xl font-bold">{(user?.name || "M").slice(0, 2)}</span>}
            </div>
            <h3 className="font-bold text-lg">{user?.name}</h3>
            <p className="text-carefd-teal-pale text-sm">{user?.email}</p>
          </div>
          <nav className="p-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition text-sm ${activeTab === tab.id ? "bg-carefd-teal text-white" : "text-carefd-gray hover:bg-carefd-teal-pale/30"}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
                {tab.id === "messages" && stats.unreadMessages > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ms-auto">{stats.unreadMessages}</span>}
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-carefd-navy font-heading">שלום, {user?.name?.split(" ")[0] || "משתמש"}!</h1>
          <p className="text-carefd-gray text-sm">ברוכים הבאים לאזור האישי</p>
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
                    { label: "סה\"כ הזמנות", value: stats.totalBookings, icon: CalendarDays, color: "bg-blue-50 text-blue-600" },
                    { label: "ממתינים", value: stats.pendingBookings, icon: Hourglass, color: "bg-yellow-50 text-yellow-600" },
                    { label: "הושלמו", value: stats.completedBookings, icon: CheckCircle, color: "bg-green-50 text-green-600" },
                    { label: "בקשות", value: stats.totalRequests, icon: FileText, color: "bg-purple-50 text-purple-600", onClick: () => setActiveTab("requests") },
                  ].map((s) => (
                    <Card key={s.label} className={`p-5 border-0 ${s.onClick ? "cursor-pointer hover-lift" : ""}`} onClick={s.onClick}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
                      </div>
                      <p className="text-2xl font-bold text-carefd-navy font-heading">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </Card>
                  ))}
                </div>

                {/* Awaiting Confirmation Alert */}
                {stats.awaitingConfirmation > 0 && (
                  <Card className="p-5 border-purple-200 bg-purple-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-bold text-carefd-navy">{stats.awaitingConfirmation} הזמנות ממתינות לאישור השלמה</p>
                          <p className="text-sm text-slate-500">הספק סימן שהשירות הושלם, נא לאשר</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setActiveTab("bookings")}>צפה</Button>
                    </div>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card className="p-6">
                  <h3 className="font-bold text-carefd-navy mb-4">פעולות מהירות</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Link href="/providers" className="flex items-center gap-3 p-4 bg-carefd-teal-pale/30 rounded-xl hover:bg-carefd-teal-pale transition">
                      <Search className="w-5 h-5 text-carefd-teal" /><span className="font-medium text-carefd-navy">חפש ספק חדש</span>
                    </Link>
                    <button onClick={() => { setActiveTab("requests"); }} className="flex items-center gap-3 p-4 bg-carefd-teal-pale/30 rounded-xl hover:bg-carefd-teal-pale transition w-full">
                      <Plus className="w-5 h-5 text-carefd-teal" /><span className="font-medium text-carefd-navy">פרסם בקשה</span>
                    </button>
                    <Link href="/chats" className="flex items-center gap-3 p-4 bg-carefd-teal-pale/30 rounded-xl hover:bg-carefd-teal-pale transition">
                      <MessageCircle className="w-5 h-5 text-carefd-teal" /><span className="font-medium text-carefd-navy">הצ&apos;אטים שלי</span>
                    </Link>
                  </div>
                </Card>

                {/* Recent Bookings */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-carefd-navy">ההזמנות האחרונות</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("bookings")}>צפה בכל <ChevronLeft className="w-4 h-4 ms-1" /></Button>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-slate-400"><CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p>עדיין אין הזמנות</p><Link href="/providers" className="text-carefd-teal hover:underline mt-2 inline-block">חפש ספק עכשיו</Link></div>
                  ) : (
                    <div className="space-y-3">
                      {[...bookings].sort((a, b) => new Date(b.created_at || b.booking_date).getTime() - new Date(a.created_at || a.booking_date).getTime()).slice(0, 3).map((b) => (
                        <div key={b.booking_id || b.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-carefd-teal-pale/20 transition cursor-pointer" onClick={() => { setActiveTab("bookings"); setExpandedBookings((p) => ({ ...p, [b.booking_id]: true })); }}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColors[b.status] || "bg-slate-100"}`}>
                            {b.status === "pending" ? <Hourglass className="w-4 h-4" /> : b.status === "completed" ? <CheckCircle className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-carefd-navy">{b.service_name || b.serviceName || "שירות"}</p>
                            <p className="text-sm text-slate-400">{b.booking_date ? new Date(b.booking_date).toLocaleDateString("he-IL") : ""}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || ""}`}>{statusLabels[b.status] || b.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ===== BOOKINGS TAB ===== */}
            {activeTab === "bookings" && (
              <Card className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-bold text-carefd-navy">ההזמנות שלי</h3>
                  <div className="flex items-center gap-3">
                    <select value={bookingSortBy} onChange={(e) => setBookingSortBy(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium cursor-pointer hover:border-carefd-teal focus:outline-none">
                      <option value="date_desc">חדש ← ישן</option><option value="date_asc">ישן ← חדש</option>
                      <option value="status">לפי סטטוס</option><option value="price_desc">לפי מחיר</option>
                    </select>
                    <Button size="sm" asChild><Link href="/providers"><Plus className="w-4 h-4 me-1" />הזמן תור</Link></Button>
                  </div>
                </div>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400"><CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg mb-2">אין הזמנות עדיין</p><Link href="/providers" className="text-carefd-teal hover:underline">חפש ספק והזמן תור ראשון</Link></div>
                ) : (
                  <div className="space-y-3">
                    {getSortedBookings().map((b) => {
                      const isExp = expandedBookings[b.booking_id];
                      return (
                        <div key={b.booking_id || b.id} className={`border-2 rounded-xl transition-all overflow-hidden ${isExp ? "border-carefd-teal shadow-md" : "border-slate-200 hover:border-carefd-teal/40"}`}>
                          <div className="flex items-center justify-between gap-3 p-4 cursor-pointer" onClick={() => setExpandedBookings((p) => ({ ...p, [b.booking_id]: !p[b.booking_id] }))}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusColors[b.status] || "bg-slate-100"}`}>
                                {b.status === "pending" ? <Hourglass className="w-4 h-4" /> : b.status === "completed" ? <CheckCircle className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap"><h4 className="font-bold text-carefd-navy text-sm">{b.service_name || "שירות"}</h4><span className="text-xs text-slate-400">•</span><span className="text-xs text-slate-400">{b.provider_name || b.providerName || "ספק"}</span></div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                                  <span>{b.booking_date ? new Date(b.booking_date).toLocaleDateString("he-IL") : ""}</span>
                                  {b.booking_time && <span>{b.booking_time}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || ""}`}>{statusLabels[b.status] || b.status}</span>
                              {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>
                          {isExp && (
                            <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">תאריך</p><p className="font-medium text-sm">{b.booking_date ? new Date(b.booking_date).toLocaleDateString("he-IL") : "יתואם"}</p></div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">שעה</p><p className="font-medium text-sm">{b.booking_time || "יתואם"}</p></div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">מחיר</p><p className="font-medium text-sm text-green-600">{b.final_price || b.base_price ? `₪${b.final_price || b.base_price}` : "יתואם"}</p></div>
                                <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xs text-slate-400">סוג</p><p className="font-medium text-sm">{b.delivery_type || b.service_type || "-"}</p></div>
                              </div>
                              {b.notes && <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm"><span className="font-medium">הערות: </span>{b.notes}</div>}
                              <div className="flex flex-wrap items-center gap-2">
                                {b.status === "provider_completed" && (
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); setShowCompletionDialog(b); }}>אשר השלמה</Button>
                                )}
                                {b.status === "completed" && !b.has_review && (
                                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600" asChild><Link href={`/review/${b.booking_id}`} onClick={(e) => e.stopPropagation()}><Star className="w-3.5 h-3.5 me-1" />כתוב חוות דעת</Link></Button>
                                )}
                                {b.has_review && <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />חוות דעת נכתבה</span>}
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

            {/* ===== REQUESTS TAB ===== */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-carefd-navy flex items-center gap-2"><FileText className="w-5 h-5 text-carefd-teal" />הבקשות שלי</h3>
                    <Button size="sm" asChild><Link href="/requests"><Plus className="w-4 h-4 me-1" />בקשה חדשה</Link></Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {[{id:"all",l:"הכל"},{id:"open",l:"פתוחות"},{id:"in_progress",l:"בתהליך"},{id:"completed",l:"הושלמו"},{id:"cancelled",l:"בוטלו"}].map((f) => (
                      <button key={f.id} onClick={() => setRequestFilter(f.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${requestFilter === f.id ? "bg-carefd-teal text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{f.l}</button>
                    ))}
                  </div>
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg mb-2">אין בקשות</p><Link href="/requests" className="text-carefd-teal hover:underline">צור בקשה חדשה</Link></div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRequests.map((r) => (
                        <div key={r.request_id || r.id} className="border-2 border-slate-200 rounded-xl p-4 hover:border-carefd-teal transition">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <Link href={`/requests/${r.request_id || r.id}`} className="font-bold text-carefd-navy hover:text-carefd-teal transition">{r.title}</Link>
                              <p className="text-sm text-slate-400 line-clamp-2 mt-1">{r.description}</p>
                            </div>
                            <div className="ms-4 flex flex-col items-end gap-1">
                              {r.budget && <span className="text-lg font-bold text-carefd-teal">₪{r.budget}</span>}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "open" ? "bg-green-100 text-green-700" : r.status === "completed" ? "bg-blue-100 text-blue-700" : r.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {r.status === "open" ? "פתוח" : r.status === "completed" ? "הושלם" : r.status === "cancelled" ? "בוטל" : r.status === "in_progress" ? "בתהליך" : r.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{r.created_at ? new Date(r.created_at).toLocaleDateString("he-IL") : ""}</span>
                            {r.offer_count > 0 && <span className="text-carefd-teal font-medium">{r.offer_count} הצעות</span>}
                          </div>
                          {r.status === "open" && (
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => handleCancelRequest(r.request_id || r.id)}>בטל בקשה</Button>
                              <Button size="sm" variant="ghost" className="h-7" asChild><Link href={`/requests/${r.request_id || r.id}`}>צפה בהצעות</Link></Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ===== REVIEWS TAB ===== */}
            {activeTab === "reviews" && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-carefd-navy mb-6">הביקורות שלי</h3>
                {myReviews.length === 0 ? (
                  <div className="text-center py-12 text-slate-400"><Star className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg mb-2">עדיין לא כתבת ביקורות</p><p className="text-sm">לאחר השלמת הזמנה תוכל לכתוב ביקורת על הספק</p></div>
                ) : (
                  <div className="space-y-4">
                    {myReviews.map((r) => (
                      <div key={r.review_id || r.id} className="border-2 border-slate-200 rounded-xl p-4">
                        {r.status && r.status !== "approved" && (
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium mb-3 ${r.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                            {r.status === "pending" ? <><Hourglass className="w-3 h-3" />ממתין לאישור</> : <><XCircle className="w-3 h-3" />נדחה</>}
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-carefd-teal rounded-full flex items-center justify-center text-white font-bold">{(r.provider?.business_name || "S")[0]}</div>
                            <div>
                              <Link href={`/providers/${r.provider_id}`} className="font-bold text-carefd-navy hover:text-carefd-teal transition">{r.provider?.business_name || "ספק"}</Link>
                              <p className="text-sm text-slate-400">{r.provider?.profession_title || ""}</p>
                            </div>
                          </div>
                          <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />)}</div>
                        </div>
                        {r.comment && <p className="text-slate-500">{r.comment}</p>}
                        <p className="text-xs text-slate-400 mt-3">{r.created_at ? new Date(r.created_at).toLocaleDateString("he-IL") : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ===== MESSAGES TAB ===== */}
            {activeTab === "messages" && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-carefd-teal" />הודעות</h3>
                {chats.length === 0 ? (
                  <div className="text-center py-12 text-slate-400"><MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg mb-2">אין שיחות עדיין</p><p className="text-sm">שיחות יופיעו כאן כשתיצרו קשר עם ספקים</p></div>
                ) : (
                  <div className="space-y-3">
                    {chats.map((chat: any) => (
                      <Link key={chat.room_id} href={`/chats/${chat.room_id}`} className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-carefd-teal-pale/30 rounded-xl transition group">
                        <div className="w-12 h-12 bg-carefd-navy rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{(chat.other_user?.name || chat.other_user_name || "M")[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between"><p className="font-semibold text-carefd-navy group-hover:text-carefd-teal transition">{chat.other_user?.name || chat.other_user_name || "משתמש"}</p><span className="text-xs text-slate-400">{chat.last_message?.created_at ? new Date(chat.last_message.created_at).toLocaleDateString("he-IL") : ""}</span></div>
                          <p className="text-sm text-slate-400 truncate">{chat.last_message?.content || chat.last_message || "אין הודעות"}</p>
                        </div>
                        {chat.unread_count > 0 && <span className="bg-carefd-teal text-white text-xs font-bold px-2 py-1 rounded-full">{chat.unread_count}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ===== FAVORITES TAB ===== */}
            {activeTab === "favorites" && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-carefd-navy mb-6 flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" />מועדפים</h3>
                {favorites.length === 0 ? (
                  <div className="text-center py-12 text-slate-400"><Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" /><p className="text-lg mb-2">אין ספקים במועדפים</p><Link href="/providers" className="text-carefd-teal hover:underline">חפש ספקים</Link></div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {favorites.map((fav: any) => {
                      const p = fav.provider || fav;
                      const pid = p.provider_id || fav.provider_id;
                      return (
                        <div key={pid} className="border-2 border-slate-200 rounded-xl p-4 hover:border-carefd-teal transition">
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-carefd-teal to-carefd-navy rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{(p.business_name || "S")[0]}</div>
                            <div className="flex-1 min-w-0">
                              <Link href={`/providers/${pid}`} className="font-bold text-carefd-navy hover:text-carefd-teal transition">{p.business_name || "ספק"}</Link>
                              <p className="text-sm text-slate-400">{p.profession_name || ""}</p>
                              {p.rating > 0 && <div className="flex items-center gap-1 mt-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /><span className="text-sm font-medium">{p.rating.toFixed(1)}</span></div>}
                            </div>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleRemoveFavorite(pid)} title="הסר ממועדפים"><Heart className="w-4 h-4 fill-current" /></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {/* ===== SETTINGS TAB ===== */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <NotificationSettings />
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-carefd-navy mb-4">הגדרות חשבון</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">שם</p><p className="font-medium text-carefd-navy">{user?.name || "-"}</p></div>
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">אימייל</p><p className="font-medium text-carefd-navy">{user?.email || "-"}</p></div>
                    <div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm text-slate-400">טלפון</p><p className="font-medium text-carefd-navy">{user?.phone || "-"}</p></div>
                    <Button asChild><Link href="/profile"><Settings className="w-4 h-4 me-1" />ערוך פרופיל מלא</Link></Button>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Completion Confirmation Dialog */}
        {showCompletionDialog && (
          <CompletionConfirmDialog
            bookingId={showCompletionDialog.booking_id || showCompletionDialog.id}
            providerName={showCompletionDialog.provider_name || showCompletionDialog.providerName || "ספק"}
            serviceName={showCompletionDialog.service_name || showCompletionDialog.serviceName || "שירות"}
            onClose={() => setShowCompletionDialog(null)}
            onComplete={() => { setShowCompletionDialog(null); fetchData(); }}
          />
        )}
      </div>
    </div>
  );
}
