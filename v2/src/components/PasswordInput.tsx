"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> { showIcon?: boolean; }

export default function PasswordInput({ className, showIcon = true, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {showIcon && <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-carefd-gray" />}
      <Input type={show ? "text" : "password"} className={cn(showIcon && "ps-11 pe-11", className)} {...props} />
      <button type="button" onClick={() => setShow(!show)} className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-carefd-gray hover:text-carefd-teal rounded-lg transition-colors">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
