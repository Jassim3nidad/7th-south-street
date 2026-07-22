/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50: "rgb(var(--neo-surface-strong-rgb) / <alpha-value>)",
          100: "rgb(var(--neo-surface-rgb) / <alpha-value>)",
          200: "rgb(var(--neo-bg-rgb) / <alpha-value>)",
          300: "#b8c8df",
          400: "#6fa8ff",
          500: "rgb(var(--neo-accent-rgb) / <alpha-value>)",
          600: "rgb(var(--neo-accent-strong-rgb) / <alpha-value>)",
          700: "rgb(var(--neo-accent-violet-rgb) / <alpha-value>)",
          800: "#5130ad",
          900: "#35216e",
          950: "rgb(var(--neo-text-rgb) / <alpha-value>)",
          black: 'rgb(var(--neo-text-rgb) / <alpha-value>)',
          white: 'rgb(var(--neo-surface-strong-rgb) / <alpha-value>)',
          cream: 'rgb(var(--neo-surface-rgb) / <alpha-value>)',
          accent: 'rgb(var(--neo-accent-rgb) / <alpha-value>)',
          red: 'var(--neo-error)',
        },
        base: "rgb(var(--neo-bg-rgb) / <alpha-value>)",
        border: "var(--neo-border)",
        text: {
          primary: "rgb(var(--neo-text-rgb) / <alpha-value>)",
          secondary: "rgb(var(--neo-text-muted-rgb) / <alpha-value>)",
          muted: "rgb(var(--neo-text-soft-rgb) / <alpha-value>)",
        }
      },
      borderRadius: {
        neo: 'var(--neo-radius-md)',
        'neo-lg': 'var(--neo-radius-lg)',
        'neo-xl': 'var(--neo-radius-xl)',
      },
      boxShadow: {
        neo: 'var(--neo-shadow-raised)',
        'neo-sm': 'var(--neo-shadow-raised-sm)',
        'neo-inset': 'var(--neo-shadow-inset)',
        'neo-pressed': 'var(--neo-shadow-pressed)',
        'neo-focus': 'var(--neo-focus)',
      },
      animation: {
        'fade-up':  'fadeUp 0.6s ease forwards',
        'fade-in':  'fadeIn 0.4s ease forwards',
        'ticker':   'ticker 30s linear infinite',
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-in": "sheet-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-out": "sheet-out 0.25s ease-in",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        ticker: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "sheet-in": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "sheet-out": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
