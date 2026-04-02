import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps { size?: "sm" | "md" | "lg"; className?: string; }

const sizes = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" };

export default function Logo({ size = "md", className }: LogoProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-0.5", className)}>
      <span className={`font-heading font-bold text-carefd-navy ${sizes[size]}`}>Care</span>
      <span className={`font-heading font-bold text-carefd-teal ${sizes[size]}`}>FD</span>
    </Link>
  );
}
