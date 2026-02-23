/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)',
                        '3xl': '1.5rem',
                        '4xl': '2rem',
                },
                colors: {
                        // CareLink Premium Luxury - Deep Palette
                        'carelink-deep': '#0F172A',
                        'carelink-charcoal': '#1E293B',
                        'carelink-navy': '#1E4D5F',
                        'carelink-slate': '#4C6D7F',
                        'carelink-gray': '#83959E',
                        'carelink-light-gray': '#B8C2C9',
                        'carelink-stone': '#F5F5F4',
                        'carelink-cream': '#FAFAF9',
                        
                        // Accent - Champagne Gold
                        'carelink-gold': '#D4B483',
                        'carelink-gold-light': '#E8D4B8',
                        
                        // CareLink Brand Colors - Teal Palette
                        'carelink-teal': '#19B8BA',
                        'carelink-teal-medium': '#41C9C2',
                        'carelink-teal-light': '#75D9D2',
                        'carelink-teal-pale': '#ACEDEA',
                        
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: '#19B8BA',
                                foreground: 'hsl(var(--primary-foreground))',
                                dark: '#1E4D5F',
                                light: '#75D9D2',
                        },
                        secondary: {
                                DEFAULT: '#4C6D7F',
                                foreground: 'hsl(var(--secondary-foreground))',
                                light: '#83959E',
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        }
                },
                fontFamily: {
                        sans: ['Manrope', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
                        heading: ['Playfair Display', 'Georgia', 'serif'],
                        serif: ['Playfair Display', 'Georgia', 'serif'],
                },
                lineHeight: {
                        'relaxed': '1.8',
                        'loose': '2',
                },
                spacing: {
                        '18': '4.5rem',
                        '22': '5.5rem',
                        '26': '6.5rem',
                        '30': '7.5rem',
                },
                boxShadow: {
                        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
                        'soft-md': '0 8px 30px -4px rgba(0, 0, 0, 0.08)',
                        'soft-lg': '0 12px 40px -6px rgba(0, 0, 0, 0.1)',
                        'soft-xl': '0 20px 50px -10px rgba(0, 0, 0, 0.12)',
                        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                        'premium': '0 25px 60px -12px rgba(0, 0, 0, 0.15)',
                },
                backdropBlur: {
                        'xs': '2px',
                        'glass': '12px',
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        'fade-in': {
                                from: { opacity: '0', transform: 'translateY(20px)' },
                                to: { opacity: '1', transform: 'translateY(0)' }
                        },
                        'fade-in-up': {
                                from: { opacity: '0', transform: 'translateY(30px)' },
                                to: { opacity: '1', transform: 'translateY(0)' }
                        },
                        'scale-in': {
                                from: { opacity: '0', transform: 'scale(0.95)' },
                                to: { opacity: '1', transform: 'scale(1)' }
                        },
                        'slide-in-right': {
                                from: { opacity: '0', transform: 'translateX(-20px)' },
                                to: { opacity: '1', transform: 'translateX(0)' }
                        },
                        'float': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-10px)' }
                        },
                        'shimmer': {
                                from: { backgroundPosition: '200% 0' },
                                to: { backgroundPosition: '-200% 0' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'fade-in': 'fade-in 0.6s ease-out forwards',
                        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
                        'scale-in': 'scale-in 0.5s ease-out forwards',
                        'slide-in': 'slide-in-right 0.5s ease-out forwards',
                        'float': 'float 6s ease-in-out infinite',
                        'shimmer': 'shimmer 8s ease-in-out infinite',
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
