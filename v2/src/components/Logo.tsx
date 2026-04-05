"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "default" | "white" | "icon-only";
}

const iconSizes = { sm: 28, md: 36, lg: 48 };
const textSizes = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" };

export default function Logo({ size = "md", className, variant = "default" }: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const iconSize = iconSizes[size];
  const textColor = variant === "white" ? "text-white" : "text-carefd-navy";
  const tealColor = variant === "white" ? "text-white/80" : "text-carefd-teal";

  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      {/* Logo icon - always show */}
      {!imgError ? (
        <Image
          src="/logo.svg"
          alt="CareFD"
          width={iconSize}
          height={iconSize}
          className="rounded-lg"
          onError={() => setImgError(true)}
          priority
        />
      ) : (
        <div
          className="rounded-lg bg-gradient-to-br from-carefd-navy to-carefd-teal flex items-center justify-center text-white font-bold"
          style={{ width: iconSize, height: iconSize, fontSize: iconSize * 0.35 }}
        >
          CF
        </div>
      )}

      {/* Text - hidden on mobile for icon-only variant, always shown otherwise */}
      {variant !== "icon-only" && (
        <span className={cn("hidden sm:inline-flex items-center gap-0.5")}>
          <span className={`font-heading font-bold ${textColor} ${textSizes[size]}`}>Care</span>
          <span className={`font-heading font-bold ${tealColor} ${textSizes[size]}`}>FD</span>
        </span>
      )}
    </Link>
  );
}
