import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-carefd-teal-pale/50 bg-white px-4 py-3 text-base",
          "placeholder:text-slate-400",
          "focus:border-carefd-teal focus:outline-none focus:ring-2 focus:ring-carefd-teal/15",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-300",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
