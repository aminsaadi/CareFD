"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, HelpCircle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "success" | "info" | "default";
  loading?: boolean;
  children?: React.ReactNode;
}

const variantConfig = {
  danger: { icon: AlertTriangle, iconColor: "text-red-500", iconBg: "bg-red-50", button: "destructive" as const },
  warning: { icon: AlertTriangle, iconColor: "text-amber-500", iconBg: "bg-amber-50", button: "default" as const },
  success: { icon: CheckCircle, iconColor: "text-green-500", iconBg: "bg-green-50", button: "default" as const },
  info: { icon: Info, iconColor: "text-blue-500", iconBg: "bg-blue-50", button: "default" as const },
  default: { icon: HelpCircle, iconColor: "text-carefd-teal", iconBg: "bg-carefd-teal/10", button: "default" as const },
};

export default function ConfirmDialog({
  open, onClose, onConfirm,
  title = "אישור",
  description = "האם אתה בטוח?",
  confirmText = "אישור",
  cancelText = "ביטול",
  variant = "default",
  loading = false,
  children,
}: ConfirmDialogProps) {
  const config = variantConfig[variant] || variantConfig.default;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-relaxed">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {children && <div className="py-2">{children}</div>}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 sm:flex-none">
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
