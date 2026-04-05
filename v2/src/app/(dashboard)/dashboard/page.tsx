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
import { toast } from "sonner";
import CompletionConfirmDialog from "@/components/CompletionConfirmDialog";
import {
  Search, FileText, CalendarDays, MessageCircle, ChevronLeft, ChevronDown, ChevronUp,
  Star, Heart, Settings, Shield, Bell, User, Clock, CheckCircle, XCircle,
  Hourglass, Plus, MapPin, Loader2, Eye, Trash2,
} from "lucide-react";
import { Suspense } from "react";

const statusConfig: Record<string, { label: string; color: string; variant: "success" | "warning" | "destructive" | "outline" | "accent" }> = {
  pending: { label: "ממתין לאישור", color: "bg-yellow-100 text-yellow-700", variant: "warning" },
  confirmed: { label: "מאושר", color: "bg-green-100 text-green-700", variant: "accent" },
  completed: { label: "הושלם", color: "bg-green-100 text-green-700", variant: "success" },
  cancelled: { label: "בוטל", color: "bg-red-100 text-red-700", variant: "destructive" },
  in_progress: { label: "בביצוע", color: "bg-blue-100 text-blue-700", variant: "accent" },
  provider_completed: { label: "הספק סיים - אשר", color: "bg-purple-100 text-purple-700", variant: "warning" },
  rejected: { label: "נדחה", color: "bg-red-100 text-red-700", variant: "destructive" },
  on_hold: { label: "בהשהיה", color: "bg-gray-100 text-gray-700", variant: "outline" },
};

const tabs = [
  { id: "overview", label: "סקירה כללית", icon: User },
  { id: "bookings", label: "ההזמנות שלי", icon: CalendarDays },
  { id: "requests", label: "הבקשות שלי", icon: FileText },
  { id: "messages", label: "הודעות", icon: MessageCircle },
  { id: "reviews", label: "הביקורות שלי", icon: Star },
  { id: "favorites", label: "מועדפים", icon: Heart },
  { id: "settings", label: "הגדרות", icon: Settings, link: "/profile" },
];

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>;
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [loading, setLoading] = useState(true);

  // Data
  const [bookings, setBookings] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBookings: 0, pendingBookings: 0, completedBookings: 0, awaitingConfirmation: 0, totalRequests: 0, unreadMessages: 0, totalReviews: 0 });

  // UI state
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});
  const [bookingSortBy, setBookingSortBy] = useState("date_desc");
  const [requestFilter, setRequestFilter] = useState("all");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [completionBooking, setCompletionBooking] = useState<any>(null);
  const [requestForm, setRequestForm] = useState({ title: "", description: "", urgency: "medium", request_type: "one_time", budget: "", preferred_date: "", city: "" });
  const [savingRequest, setSavingRequest] = useState(false);

  useEffect(() => {
    if (user?.role === "provider") { router.replace("/provider/dashboard"); return; }
    if (user?.role === "admin") { router.replace("/admin/overview"); return; }
    fetchData();
  }, [user, router]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== activeTab) setActiveTab(t);
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bk, rq, ch, rv, fv] = await Promise.all([
        api.get<{ bookings: any[] }>("/bookings").catch(() => ({ bookings: [] })),
        api.get<{ requests: any[] }>("/requests/my").catch(() => ({ requests: [] })),
        api.get<{ rooms: any[] }>("/chat/rooms").catch(() => ({ rooms: [] })),
        api.get<{ reviews: any[] }>("/reviews/my").catch(() => ({ reviews: [] })),
        api.get<{ favorites: any[] }>("/favorites").catch(() => ({ favorites: [] })),
      ]);
      const b = bk.bookings || [];
      setBookings(b);
      setRequests(rq.requests || []);
      setChats(ch.rooms || []);
      setReviews(rv.reviews || []);
      setFavorites(fv.favorites || []);
      setStats({
        totalBookings: b.length,
        pendingBookings: b.filter((x: any) => x.status === "pending").length,
        completedBookings: b.filter((x: any) => x.status === "completed").length,
        awaitingConfirmation: b.filter((x: any) => x.status === "provider_completed").length,
        totalRequests: (rq.requests || []).length,
        unreadMessages: (ch.rooms || []).reduce((a: number, r: any) => a + (r.unread_count || 0), 0),
        totalReviews: (rv.reviews || []).length,
      });
    } catch {}
    setLoading(false);
  };

  const getSortedBookings = () => {
    const sorted = [...bookings];
    switch (bookingSortBy) {
      case "date_desc": return sorted.sort((a, b) => new Date(b.created_at || b.booking_date).getTime() - new Date(a.created_at || a.booking_date).getTime());
      case "date_asc": return sorted.sort((a, b) => new Date(a.created_at || a.booking_date).getTime() - new Date(b.created_at || b.booking_date).getTime());
      case "status": { const order: Record<string, number> = { pending: 0, confirmed: 1, in_progress: 2, provider_completed: 3, on_hold: 4, completed: 5, cancelled: 6, rejected: 7 }; return sorted.sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99)); }
      case "price_desc": return sorted.sort((a, b) => (b.final_price || b.base_price || 0) - (a.final_price || a.base_price || 0));
      default: return sorted;
    }
  };

  const filteredRequests = requestFilter === "all" ? requests : requests.filter((r: any) => r.status === requestFilter);

  const handleCreateRequest = async () => {
    if (!requestForm.title || !requestForm.description) { toast.error("נא למלא כותרת ותיאור"); return; }
    setSavingRequest(true);
    try {
      await api.post("/requests", { ...requestForm, budget: requestForm.budget ? parseFloat(requestForm.budget) : undefined });
      toast.success("הבקשה נוצרה בהצלחה!");
      setShowRequestForm(false);
      setRequestForm({ title: "", description: "", urgency: "medium", request_type: "one_time", budget: "", preferred_date: "", city: "" });
      fetchData();
    } catch { toast.error("שגיאה ביצירת הבקשה"); }
    setSavingRequest(false);
  };

  const handleCancelRequest = async (id: string) => {
    try { await api.put(`/requests/${id}`, { status: "cancelled" }); toast.success("הבקשה בוטלה"); fetchData(); } catch { toast.error("שגיאה"); }
  };

  if (!user || user.role !== "patient") return null;

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <Card className="overflow-hidden">
            {/* User Header */}
            <div className="bg-gradient-to-b from-carefd-navy to-carefd-slate p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-carefd-teal/20 flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-white">
                {user.picture ? <img src={user.picture} alt="" className="w-full h-full rounded-full object-cover" /> : user.name?.[0]}
              </div>
              <h3 className="font-bold text-white">{user.name}</h3>
              <p className="text-sm text-white/60">{user.email}</p>
            </div>

            {/* Tab Buttons */}
            <div className="p-2">
              {tabs.map((tab) => (
                tab.link ? (
                  <Link key={tab.id} href={tab.link} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-carefd-slate hover:bg-carefd-teal-pale/20 transition-colors">
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </Link>
                ) : (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${activeTab === tab.id ? "bg-carefd-teal text-white font-medium" : "text-carefd-slate hover:bg-carefd-teal-pale/20"}`}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                    {tab.id === "messages" && stats.unreadMessages > 0 && <span className="ms-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.unreadMessages}</span>}
                  </button>
                )
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden fixed bottom-0 start-0 end-0 bg-white border-t border-gray-200 z-40 flex overflow-x-auto">
        {tabs.slice(0, 5).map((tab) => (
          <button key={tab.id} onClick={() => tab.link ? router.push(tab.link) : setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${activeTab === tab.id ? "text-carefd-teal" : "text-carefd-gray"}`}>
            <tab.icon className="w-5 h-5" />{tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pb-20 lg:pb-0">
        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : (
          <>
            {/* ===== OVERVIEW ===== */}
            {activeTab === "overview" && (
              <div>
                <h1 className="mb-2">שלום, {user.name}!</h1>
                <p className="text-slate-500 mb-8">מה תרצו לעשות היום?</p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "סה\"כ הזמנות", value: stats.totalBookings, icon: CalendarDays, color: "bg-blue-100 text-blue-600" },
                    { label: "ממתינות", value: stats.pendingBookings, icon: Hourglass, color: "bg-yellow-100 text-yellow-600" },
                    { label: "הושלמו", value: stats.completedBookings, icon: CheckCircle, color: "bg-green-100 text-green-600" },
                    { label: "בקשות", value: stats.totalRequests, icon: FileText, color: "bg-purple-100 text-purple-600", onClick: () => setActiveTab("requests") },
                  ].map((s) => (
                    <Card key={s.label} className={`p-5 ${s.onClick ? "cursor-pointer hover-lift" : ""}`} onClick={s.onClick}>
                      <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-5 h-5" /></div>
                      <div className="text-2xl font-bold text-carefd-navy">{s.value}</div>
                      <div className="text-sm text-slate-500">{s.label}</div>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <Link href="/providers"><Card className="p-5 text-center hover-lift"><Search className="w-8 h-8 text-carefd-teal mx-auto mb-2" /><span className="text-sm font-medium text-carefd-navy">חפש מטפל</span></Card></Link>
                  <button onClick={() => { setActiveTab("requests"); setShowRequestForm(true); }}><Card className="p-5 text-center hover-lift"><Plus className="w-8 h-8 text-carefd-navy mx-auto mb-2" /><span className="text-sm font-medium text-carefd-navy">בקשה חדשה</span></Card></button>
                  <Link href="/chats"><Card className="p-5 text-center hover-lift"><MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" /><span className="text-sm font-medium text-carefd-navy">הודעות</span></Card></Link>
                </div>

                {/* Awaiting Confirmation */}
                {stats.awaitingConfirmation > 0 && (
                  <Card className="p-4 mb-6 bg-purple-50 border-purple-200">
                    <p className="font-medium text-purple-800">יש לך {stats.awaitingConfirmation} הזמנות שממתינות לאישור השלמה</p>
                    <Button size="sm" className="mt-2" onClick={() => setActiveTab("bookings")}>צפה בהזמנות</Button>
                  </Card>
                )}

                {/* Recent Bookings */}
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-heading font-semibold">הזמנות אחרונות</h2>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("bookings")}>הצג הכל <ChevronLeft className="w-4 h-4 ms-1" /></Button>
                  </div>
                  {bookings.slice(0, 3).map((b) => {
                    const cfg = statusConfig[b.status] || statusConfig.pending;
                    return (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-carefd-stone/50 transition-colors mb-2">
                        <div>
                          <p className="font-medium text-carefd-navy text-sm">{b.service_name || b.serviceName}</p>
                          <p className="text-xs text-slate-400">{b.provider_name || b.providerName} • {b.booking_date ? new Date(b.booking_date).toLocaleDateString("he-IL") : ""}</p>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    );
                  })}
                  {bookings.length === 0 && <p className="text-center text-slate-400 py-6">אין הזמנות עדיין</p>}
                </Card>
              </div>
            )}

            {/* ===== BOOKINGS ===== */}
            {activeTab === "bookings" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold">ההזמנות שלי</h2>
                  <div className="flex gap-3">
                    <select value={bookingSortBy} onChange={(e) => setBookingSortBy(e.target.value)} className="px-3 py-2 border rounded-xl text-sm">
                      <option value="date_desc">חדש → ישן</option>
                      <option value="date_asc">ישן → חדש</option>
                      <option value="status">לפי סטטוס</option>
                      <option value="price_desc">לפי מחיר</option>
                    </select>
                    <Button size="sm" asChild><Link href="/providers">הזמן תור חדש</Link></Button>
                  </div>
                </div>

                {getSortedBookings().length === 0 ? (
                  <Card className="p-10 text-center"><p className="text-slate-400 mb-2">אין הזמנות</p><Button variant="secondary" size="sm" asChild><Link href="/providers">חפשו מטפל</Link></Button></Card>
                ) : (
                  <div className="space-y-3">
                    {getSortedBookings().map((b) => {
                      const cfg = statusConfig[b.status] || statusConfig.pending;
                      const expanded = expandedBookings[b.id];
                      return (
                        <Card key={b.id} className="overflow-hidden">
                          <button onClick={() => setExpandedBookings((p) => ({ ...p, [b.id]: !p[b.id] }))} className="w-full flex items-center justify-between p-4 hover:bg-carefd-stone/30 transition-colors">
                            <div className="flex items-center gap-3 text-start">
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                              <div>
                                <p className="font-medium text-carefd-navy">{b.service_name || b.serviceName}</p>
                                <p className="text-xs text-slate-400">{b.provider_name || b.providerName} • {b.booking_date ? new Date(b.booking_date).toLocaleDateString("he-IL") : ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {b.final_price && <span className="font-bold text-carefd-navy">₪{b.final_price}</span>}
                              {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </button>

                          {expanded && (
                            <div className="px-4 pb-4 border-t border-slate-100">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 bg-slate-50 rounded-xl p-3 mt-3 text-sm">
                                <div><span className="text-slate-400 block">תאריך</span><span className="font-medium">{b.booking_date ? new Date(b.booking_date).toLocaleDateString("he-IL") : "—"}</span></div>
                                <div><span className="text-slate-400 block">שעה</span><span className="font-medium">{b.booking_time || "—"}</span></div>
                                <div><span className="text-slate-400 block">מחיר</span><span className="font-medium text-carefd-teal">₪{b.final_price || b.base_price || "—"}</span></div>
                                <div><span className="text-slate-400 block">סוג</span><span className="font-medium">{b.delivery_type || "—"}</span></div>
                              </div>
                              {b.notes && <div className="mt-3 p-3 bg-blue-50 rounded-xl text-sm text-blue-800">{b.notes}</div>}
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {b.status === "provider_completed" && (
                                  <Button size="sm" onClick={() => setCompletionBooking(b)}>
                                    <CheckCircle className="w-4 h-4 me-1" />אשר השלמה
                                  </Button>
                                )}
                                {b.status === "completed" && !b.has_review && (
                                  <Button size="sm" variant="secondary" asChild><Link href={`/review/${b.id}`}><Star className="w-4 h-4 me-1" />כתוב ביקורת</Link></Button>
                                )}
                                {b.provider_id && (
                                  <Button size="sm" variant="outline" asChild><Link href={`/providers/${b.provider_id}`}><Eye className="w-4 h-4 me-1" />צפה בספק</Link></Button>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===== REQUESTS ===== */}
            {activeTab === "requests" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-carefd-teal" />הבקשות שלי</h2>
                  <Button onClick={() => setShowRequestForm(!showRequestForm)}><Plus className="w-4 h-4 me-1" />בקשה חדשה</Button>
                </div>

                {/* Filter */}
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {[{ v: "all", l: "הכל" }, { v: "open", l: "פתוחות" }, { v: "in_progress", l: "בטיפול" }, { v: "completed", l: "הושלמו" }, { v: "cancelled", l: "בוטלו" }].map((f) => (
                    <button key={f.v} onClick={() => setRequestFilter(f.v)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${requestFilter === f.v ? "bg-carefd-teal text-white" : "bg-white border text-carefd-slate hover:bg-carefd-teal-pale/20"}`}>{f.l}</button>
                  ))}
                </div>

                {/* Request Form */}
                {showRequestForm && (
                  <Card className="p-6 mb-6">
                    <h3 className="font-bold text-carefd-navy mb-4">בקשה חדשה</h3>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-medium mb-1">כותרת *</label><Input value={requestForm.title} onChange={(e) => setRequestForm((p) => ({ ...p, title: e.target.value }))} placeholder="תארו בקצרה את הצורך" /></div>
                      <div><label className="block text-sm font-medium mb-1">תיאור *</label><textarea value={requestForm.description} onChange={(e) => setRequestForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-3 border rounded-xl text-sm resize-none focus:border-carefd-teal outline-none" placeholder="תארו בפירוט..." /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1">דחיפות</label><select value={requestForm.urgency} onChange={(e) => setRequestForm((p) => ({ ...p, urgency: e.target.value }))} className="w-full px-4 py-3 border rounded-xl text-sm"><option value="low">נמוכה</option><option value="medium">בינונית</option><option value="high">גבוהה</option><option value="urgent">דחוף</option></select></div>
                        <div><label className="block text-sm font-medium mb-1">סוג</label><select value={requestForm.request_type} onChange={(e) => setRequestForm((p) => ({ ...p, request_type: e.target.value }))} className="w-full px-4 py-3 border rounded-xl text-sm"><option value="one_time">חד-פעמי</option><option value="immediate">מיידי</option><option value="scheduled">מתוכנן</option><option value="follow_up">מעקב</option></select></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium mb-1">תקציב</label><Input type="number" value={requestForm.budget} onChange={(e) => setRequestForm((p) => ({ ...p, budget: e.target.value }))} placeholder="₪" /></div>
                        <div><label className="block text-sm font-medium mb-1">תאריך מועדף</label><Input type="date" value={requestForm.preferred_date} onChange={(e) => setRequestForm((p) => ({ ...p, preferred_date: e.target.value }))} /></div>
                        <div><label className="block text-sm font-medium mb-1">עיר</label><Input value={requestForm.city} onChange={(e) => setRequestForm((p) => ({ ...p, city: e.target.value }))} placeholder="תל אביב" /></div>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleCreateRequest} disabled={savingRequest}>{savingRequest ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : <Plus className="w-4 h-4 me-1" />}שלח בקשה</Button>
                        <Button variant="outline" onClick={() => setShowRequestForm(false)}>ביטול</Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Requests List */}
                {filteredRequests.length === 0 ? (
                  <Card className="p-10 text-center"><p className="text-slate-400">אין בקשות {requestFilter !== "all" ? "בסטטוס זה" : ""}</p></Card>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((r: any) => (
                      <Card key={r.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link href={`/requests/${r.id}`} className="font-medium text-carefd-navy hover:text-carefd-teal transition-colors">{r.title}</Link>
                            <p className="text-sm text-slate-400 line-clamp-2 mt-1">{r.description}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <Badge variant={r.status === "open" ? "accent" : r.status === "completed" ? "success" : r.status === "cancelled" ? "destructive" : "outline"}>{r.status === "open" ? "פתוחה" : r.status === "in_progress" ? "בטיפול" : r.status === "completed" ? "הושלמה" : "בוטלה"}</Badge>
                              {r.urgency && <span className={`text-xs px-2 py-0.5 rounded-full ${r.urgency === "urgent" ? "bg-red-100 text-red-600" : r.urgency === "high" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600"}`}>{r.urgency === "urgent" ? "דחוף" : r.urgency === "high" ? "גבוהה" : r.urgency === "medium" ? "בינונית" : "נמוכה"}</span>}
                              {r.budget && <span className="text-xs text-carefd-teal font-medium">₪{r.budget}</span>}
                              {r.offer_count > 0 && <span className="text-xs text-blue-600">{r.offer_count} הצעות</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 ms-3">
                            <Button size="sm" variant="outline" asChild><Link href={`/requests/${r.id}`}><Eye className="w-3 h-3 me-1" />צפה</Link></Button>
                            {r.status === "open" && <Button size="sm" variant="destructive" onClick={() => handleCancelRequest(r.id)}><XCircle className="w-3 h-3 me-1" />בטל</Button>}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== MESSAGES ===== */}
            {activeTab === "messages" && (
              <div>
                <h2 className="text-xl font-heading font-bold mb-6">הודעות</h2>
                {chats.length === 0 ? (
                  <Card className="p-10 text-center"><MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400">אין שיחות</p></Card>
                ) : (
                  <div className="space-y-2">
                    {chats.map((c: any) => (
                      <Link key={c.id} href={`/chats/${c.id}`}>
                        <Card className="p-4 hover-lift flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-carefd-navy flex items-center justify-center text-white font-bold flex-shrink-0">{(c.other_user_name || c.provider_name || "?")[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-carefd-navy">{c.other_user_name || c.provider_name || "שיחה"}</p>
                            <p className="text-sm text-slate-400 truncate">{c.last_message || "אין הודעות"}</p>
                          </div>
                          {(c.unread_count || 0) > 0 && <span className="bg-carefd-teal text-white text-xs px-2 py-1 rounded-full">{c.unread_count}</span>}
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== REVIEWS ===== */}
            {activeTab === "reviews" && (
              <div>
                <h2 className="text-xl font-heading font-bold mb-6">הביקורות שלי</h2>
                {reviews.length === 0 ? (
                  <Card className="p-10 text-center"><Star className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400">עדיין לא כתבתם ביקורות</p></Card>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r: any) => (
                      <Card key={r.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-carefd-teal/10 flex items-center justify-center flex-shrink-0">
                            {r.provider?.profile_image ? <img src={r.provider.profile_image} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-carefd-teal font-bold">{(r.provider?.business_name || "?")[0]}</span>}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {r.provider?.business_name && <Link href={`/providers/${r.provider.provider_id || r.provider_id}`} className="font-medium text-carefd-navy hover:text-carefd-teal">{r.provider.business_name}</Link>}
                              {r.status && r.status !== "approved" && <Badge variant={r.status === "pending" ? "warning" : "destructive"}>{r.status === "pending" ? "ממתין" : "נדחה"}</Badge>}
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-4 h-4 ${i <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />)}
                            </div>
                            {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                            <p className="text-xs text-slate-400 mt-2">{new Date(r.created_at).toLocaleDateString("he-IL")}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== FAVORITES ===== */}
            {activeTab === "favorites" && (
              <div>
                <h2 className="text-xl font-heading font-bold mb-6">מועדפים</h2>
                {favorites.length === 0 ? (
                  <Card className="p-10 text-center"><Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400">אין מועדפים</p><Button variant="secondary" size="sm" className="mt-2" asChild><Link href="/providers">חפשו ספקים</Link></Button></Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {favorites.map((f: any) => (
                      <Link key={f.id} href={`/providers/${f.provider?.provider_id || f.provider_id}`}>
                        <Card className="p-4 hover-lift flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-carefd-teal/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {f.provider?.profile_image ? <img src={f.provider.profile_image} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-carefd-teal">{(f.provider?.business_name || "?")[0]}</span>}
                          </div>
                          <div>
                            <p className="font-medium text-carefd-navy">{f.provider?.business_name || "ספק"}</p>
                            <p className="text-sm text-slate-400">{f.provider?.profession_title || f.provider?.profession_name}</p>
                            {f.provider?.rating > 0 && <div className="flex items-center gap-1 mt-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /><span className="text-sm font-medium">{Number(f.provider.rating).toFixed(1)}</span></div>}
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Completion Dialog */}
      {completionBooking && (
        <CompletionConfirmDialog
          bookingId={completionBooking.id}
          providerName={completionBooking.provider_name || completionBooking.providerName || ""}
          serviceName={completionBooking.service_name || completionBooking.serviceName || ""}
          onClose={() => setCompletionBooking(null)}
          onComplete={() => { setCompletionBooking(null); fetchData(); }}
        />
      )}
    </div>
  );
}
