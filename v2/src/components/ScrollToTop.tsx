"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 end-6 z-40 w-11 h-11 bg-carefd-teal text-white rounded-full shadow-soft-lg flex items-center justify-center hover:-translate-y-1 transition-all animate-fade-in"
      aria-label="גלול למעלה"
      data-testid="scroll-to-top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
