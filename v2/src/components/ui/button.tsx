import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carefd-teal/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-press",
  {
    variants: {
      variant: {
        default:
          "bg-carefd-teal text-white hover:bg-carefd-teal-medium rounded-xl shadow-soft hover:-translate-y-0.5 hover:shadow-soft-md",
        secondary:
          "bg-white text-carefd-navy border border-slate-200 hover:bg-slate-50 rounded-xl",
        accent:
          "bg-carefd-gold text-white hover:bg-carefd-gold-light rounded-xl shadow-soft hover:-translate-y-0.5",
        navy:
          "bg-carefd-navy text-white hover:bg-carefd-charcoal rounded-xl shadow-soft hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 rounded-xl",
        link:
          "text-carefd-teal underline-offset-4 hover:underline",
        outline:
          "border border-slate-200 bg-transparent hover:bg-slate-50 rounded-xl",
      },
      size: {
        default: "h-12 px-6 py-3 text-base",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
