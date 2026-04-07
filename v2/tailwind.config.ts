import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        // CareFD Premium Luxury - Deep Palette (matches v1)
        "carefd-deep": "#0F172A",
        "carefd-charcoal": "#1E293B",
        "carefd-navy": "#1E4D5F",
        "carefd-slate": "#4C6D7F",
        "carefd-gray": "#83959E",
        "carefd-light-gray": "#B8C2C9",
        "carefd-stone": "#F5F5F4",
        "carefd-cream": "#FAFAF9",

        // Accent - Champagne Gold
        "carefd-gold": "#D4B483",
        "carefd-gold-light": "#E8D4B8",

        // CareFD Brand Colors - Teal Palette
        "carefd-teal": "#19B8BA",
        "carefd-teal-medium": "#41C9C2",
        "carefd-teal-light": "#75D9D2",
        "carefd-teal-pale": "#ACEDEA",

        // Semantic (teal-based like v1)
        primary: {
          DEFAULT: "#19B8BA",
          foreground: "#FFFFFF",
          dark: "#1E4D5F",
          light: "#75D9D2",
        },
        secondary: {
          DEFAULT: "#4C6D7F",
          foreground: "#FFFFFF",
          light: "#83959E",
        },
        accent: {
          DEFAULT: "#D4B483",
          foreground: "#0F172A",
        },
        muted: {
          DEFAULT: "#F5F5F4",
          foreground: "#64748B",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#19B8BA",
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(0,0,0,0.08)",
        "soft-md": "0 8px 30px -6px rgba(0,0,0,0.1)",
        "soft-lg": "0 12px 40px -8px rgba(0,0,0,0.12)",
        "soft-xl": "0 20px 50px -12px rgba(0,0,0,0.15)",
        floating: "0 20px 40px -4px rgba(0,0,0,0.08)",
        glass: "0 8px 32px rgba(0,0,0,0.08)",
        glow: "0 2px 8px rgba(25,184,186,0.3)",
      },
      transitionDuration: {
        "fast": "150ms",
        "base": "300ms",
        "slow": "500ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-only": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(25, 184, 186, 0)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(25, 184, 186, 0.15)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-only": "fade-only 0.3s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-in": "slide-in-right 0.4s ease-out forwards",
        "slide-up": "slide-up 0.4s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 8s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
