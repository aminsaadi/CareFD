import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border-2 border-carefd-teal-pale/50 bg-white px-4 py-3 text-base",
          "placeholder:text-slate-400",
          "focus:border-carefd-teal focus:outline-none focus:ring-2 focus:ring-carefd-teal/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-300 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
