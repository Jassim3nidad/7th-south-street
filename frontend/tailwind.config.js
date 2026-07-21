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
          50: "#FCFBF9",
          100: "#F5F2EE",
          200: "#EBE3D5",
          300: "#DFC5A8",
          400: "#D4B68D",
          500: "#C9A96E",
          600: "#B89659",
          700: "#9A7C46",
          800: "#7E6539",
          900: "#65502E",
          950: "#362A17",
          black: '#080808',
          white: '#F5F2EE',
          cream: '#E8E2D9',
          accent: '#C9A96E',
          red: '#E63B2E',
        },
        base: "#080808",
        border: "#1F1F1F",
        text: {
          primary: "#F5F2EE",
          secondary: "#C9A96E",
          muted: "#888888",
        }
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
