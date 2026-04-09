"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Upload, FileText, Shield, CheckCircle, Clock, XCircle,
  Loader2, Trash2, ExternalLink, AlertCircle, Info,
} from "lucide-react";
import { toast } from "sonner";

const docTypes = [
  { value: "license", label: "רישיון מקצועי", icon: "📋", desc: "רישיון עבודה מקצועי בתוקף" },
  { value: "diploma", label: "תעודה / דיפלומה", icon: "🎓", desc: "תעודת סיום לימודים" },
  { value: "id", label: "תעודת זהות", icon: "🪪", desc: "צילום תעודת זהות" },
  { value: "insurance", label: "ביטוח מקצועי", icon: "🛡️", desc: "פוליסת ביטוח מקצועי" },
  { value: "certificate", label: "הסמכה", icon: "📜", desc: "תעודת הסמכה מקצועית" },
  { value: "other", label: "אחר", icon: "📎", desc: "מסמך אחר" },
];

const statusConfig: Record<string, { icon: any; label: string; variant: "outline" | "warning" | "success" | "destructive"; color: string; desc: string }> = {
  none: { icon: Shield, label: "לא הוגש", variant: "outline", color: "bg-slate-50 text-slate-600", desc: "טרם הוגשו מסמכים לאימות" },
  pending: { icon: Clock, label: "ממתין", variant: "warning", color: "bg-amber-50 text-amber-600", desc: "המסמכים שלך בבדיקה" },
  documents_submitted: { icon: Clock, label: "הוגש", variant: "warning", color: "bg-amber-50 text-amber-600", desc: "המסמכים התקבלו וממתינים לאישור" },
  verified: { icon: CheckCircle, label: "מאומת", variant: "success", color: "bg-green-50 text-green-600", desc: "החשבון שלך מאומת!" },
  rejected: { icon: XCircle, label: "נדחה", variant: "destructive", color: "bg-red-50 text-red-600", desc: "האימות נדחה, נא להגיש מסמכים מחדש" },
};

export default function VerificationDocuments() {
  const [status, setStatus] = useState("none");
  const [rejectionReason, setRejectionReason] = useState("");
  const [docs, setDocs] = useState<any[]>([]);
  const [docType, setDocType] = useState("license");
  const [fileUrl, setFileUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchData = () => {
    api.get<any>("/verification")
      .then((d) => {
        setStatus(d.verification_status || "none");
        setDocs(d.documents || []);
        setRejectionReason(d.rejection_reason || "");
      })
      .catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const submit = async () => {
    if (!fileUrl) { toast.error("נא להזין URL של המסמך"); return; }
    setUploading(true);
    try {
      await api.post("/verification", { document_type: docType, file_url: fileUrl, name: docName || undefined });
      toast.success("המסמך הועלה בהצלחה!");
      setFileUrl(""); setDocName("");
      fetchData();
    } catch (err: any) { toast.error(err.message || "שגיאה בהעלאה"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("למחוק מסמך זה?")) return;
    try {
      await api.delete(`/verification/documents/${docId}`);
      toast.success("המסמך נמחק"); fetchData();
    } catch { toast.error("שגיאה"); }
  };

  const handleRequestVerification = async () => {
    try {
      await api.post("/verification/request");
      toast.success("בקשת אימות נשלחה!"); fetchData();
    } catch { toast.error("שגיאה בשליחת בקשה"); }
  };

  const st = statusConfig[status] || statusConfig.none;
  const StatusIcon = st.icon;

  return (
    <Card className="p-6 md:p-8">
      {/* Header with Status */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-carefd-navy text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-carefd-teal" />אימות מסמכים
        </h3>
        <Badge variant={st.variant} className="gap-1">
          <StatusIcon className="w-3.5 h-3.5" />{st.label}
        </Badge>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${st.color}`}>
        <StatusIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">{st.desc}</p>
          {status === "rejected" && rejectionReason && (
            <p className="text-xs mt-1 opacity-80">סיבה: {rejectionReason}</p>
          )}
        </div>
      </div>

      {/* Documents List */}
      {docs.length > 0 && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-carefd-navy">מסמכים שהועלו ({docs.length})</h4>
          {docs.map((doc) => {
            const typeInfo = docTypes.find((t) => t.value === doc.documentType || t.value === doc.document_type);
            return (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-carefd-stone/50 rounded-xl group">
                <span className="text-xl">{typeInfo?.icon || "📎"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-carefd-navy">{doc.name || typeInfo?.label || doc.documentType || doc.document_type}</p>
                  <p className="text-xs text-slate-400">{typeInfo?.label || ""} {doc.created_at ? `• ${new Date(doc.created_at).toLocaleDateString("he-IL")}` : ""}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white transition">
                      <ExternalLink className="w-4 h-4 text-carefd-teal" />
                    </a>
                  )}
                  {status !== "verified" && (
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-white transition">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
                <Badge variant={doc.status === "approved" ? "success" : doc.status === "rejected" ? "destructive" : "outline"} className="text-[10px]">
                  {doc.status === "approved" ? "אושר" : doc.status === "rejected" ? "נדחה" : "בבדיקה"}
                </Badge>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Form */}
      {status !== "verified" && (
        <div className="space-y-4 border-t border-slate-100 pt-6">
          <h4 className="text-sm font-medium text-carefd-navy flex items-center gap-2">
            <Upload className="w-4 h-4 text-carefd-teal" />העלאת מסמך חדש
          </h4>

          {/* Document Type Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {docTypes.map((t) => (
              <button key={t.value} type="button" onClick={() => setDocType(t.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${docType === t.value ? "border-carefd-teal bg-carefd-teal/5" : "border-slate-100 hover:border-carefd-teal/40"}`}>
                <span className="text-2xl block mb-1">{t.icon}</span>
                <p className="text-xs font-medium text-carefd-navy">{t.label}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="שם המסמך (אופציונלי)" />
            <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="URL של המסמך (קישור לקובץ)" dir="ltr" />
            <Button onClick={submit} disabled={uploading || !fileUrl} className="w-full h-12 bg-gradient-to-l from-carefd-teal to-carefd-teal-medium shadow-glow">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Upload className="w-4 h-4 me-2" />}
              {uploading ? "מעלה..." : "העלה מסמך"}
            </Button>
          </div>

          {/* Request Verification Button */}
          {docs.length > 0 && status !== "documents_submitted" && status !== "pending" && (
            <Button variant="outline" onClick={handleRequestVerification} className="w-full">
              <Shield className="w-4 h-4 me-2" />שלח בקשת אימות
            </Button>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>העלו מסמכים רלוונטיים (רישיון, תעודה, ביטוח). לאחר הגשה, צוות CareFD יבדוק את המסמכים ויאשר את הפרופיל שלכם.</p>
          </div>
        </div>
      )}

      {/* Verified State */}
      {status === "verified" && (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-bold text-carefd-navy">החשבון שלך מאומת!</p>
          <p className="text-sm text-slate-400 mt-1">תג אימות מופיע בפרופיל שלך</p>
        </div>
      )}
    </Card>
  );
}
