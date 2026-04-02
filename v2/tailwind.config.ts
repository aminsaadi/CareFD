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
        // Midnight & Champagne palette
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0F172A",
          foreground: "#F8FAFC",
        },
        secondary: {
          DEFAULT: "#F5F5F4",
          foreground: "#1C1917",
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
        ring: "#D4B483",
        // Semantic
        "carefd-navy": "#0F172A",
        "carefd-slate": "#334155",
        "carefd-teal": "#0D9488",
        "carefd-gold": "#D4B483",
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "Playfair Display", "serif"],
        body: ["var(--font-manrope)", "Manrope", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(0,0,0,0.05)",
        floating: "0 20px 40px -4px rgba(0,0,0,0.08)",
        glass: "0 8px 30px rgb(0,0,0,0.04)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
