"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => (
    <label className="inline-flex items-center cursor-pointer">
      <input type="checkbox" ref={ref} className="peer sr-only" onChange={(e) => onCheckedChange?.(e.target.checked)} {...props} />
      <div className={cn("h-5 w-5 shrink-0 rounded-md border-2 border-carefd-teal-pale/50 flex items-center justify-center transition-all peer-checked:bg-carefd-teal peer-checked:border-carefd-teal peer-focus-visible:ring-2 peer-focus-visible:ring-carefd-teal/30", className)}>
        <Check className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
    </label>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
