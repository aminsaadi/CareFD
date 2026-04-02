"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Upload, FileText, Shield, CheckCircle, Clock, XCircle } from "lucide-react";

const docTypes = [
  { value: "license", label: "רישיון מקצועי" },
  { value: "diploma", label: "תעודה / דיפלומה" },
  { value: "id", label: "תעודת זהות" },
  { value: "insurance", label: "ביטוח מקצועי" },
  { value: "other", label: "אחר" },
];

const statusIcons: Record<string, React.ElementType> = { none: Shield, pending: Clock, documents_submitted: Clock, verified: CheckCircle, rejected: XCircle };
const statusLabels: Record<string, string> = { none: "לא הוגש", pending: "ממתין", documents_submitted: "הוגש", verified: "מאומת", rejected: "נדחה" };
const statusVariants: Record<string, "outline" | "warning" | "success" | "destructive"> = { none: "outline", pending: "warning", documents_submitted: "warning", verified: "success", rejected: "destructive" };

export default function VerificationDocuments() {
  const [status, setStatus] = useState("none");
  const [docs, setDocs] = useState<any[]>([]);
  const [docType, setDocType] = useState("license");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get<{ verification_status: string; documents: any[] }>("/verification")
      .then((d) => { setStatus(d.verification_status); setDocs(d.documents); })
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!fileUrl) return;
    setUploading(true);
    try {
      await api.post("/verification", { document_type: docType, file_url: fileUrl });
      setFileUrl("");
      const d = await api.get<{ verification_status: string; documents: any[] }>("/verification");
      setStatus(d.verification_status);
      setDocs(d.documents);
    } catch (err: any) { alert(err.message); }
    finally { setUploading(false); }
  };

  const StatusIcon = statusIcons[status] || Shield;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-carefd-navy flex items-center gap-2">
          <Shield className="w-5 h-5 text-carefd-teal" />אימות מסמכים
        </h3>
        <Badge variant={statusVariants[status] || "outline"}>
          <StatusIcon className="w-3 h-3 me-1" />{statusLabels[status] || status}
        </Badge>
      </div>

      {docs.length > 0 && (
        <div className="space-y-2 mb-6">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-carefd-stone rounded-xl">
              <FileText className="w-5 h-5 text-carefd-teal flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-carefd-navy">{doc.documentType}</p>
                <p className="text-xs text-carefd-gray">{doc.fileName}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {status !== "verified" && (
        <div className="space-y-3">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger><SelectValue placeholder="סוג מסמך" /></SelectTrigger>
            <SelectContent>
              {docTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="URL של המסמך" dir="ltr" />
          <Button onClick={submit} disabled={uploading || !fileUrl} className="w-full">
            {uploading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <><Upload className="w-4 h-4 me-2" />העלה מסמך</>}
          </Button>
        </div>
      )}
    </Card>
  );
}
