"use client";

import React from "react";

interface LogoProps {
  size?: "small" | "default" | "large";
  variant?: "white" | "default";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "default", variant, className = "" }) => {
  const textSizeClasses: Record<string, string> = {
    small: "text-lg",
    default: "text-3xl",
    large: "text-4xl",
  };

  const textColorClass = variant === "white" ? "text-white" : "text-carefd-navy";

  return (
    <span
      className={`${textSizeClasses[size] || textSizeClasses.default} font-bold ${textColorClass} ${className}`}
      data-testid="logo"
    >
      CareFD
    </span>
  );
};

export default Logo;
