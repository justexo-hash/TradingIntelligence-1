import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "rgb(var(--trade-bg))",
        foreground: "rgb(var(--trade-font))",
        card: {
          DEFAULT: "rgb(var(--trade-bg))",
          foreground: "rgb(var(--trade-font))",
        },
        popover: {
          DEFAULT: "rgb(var(--trade-bg))",
          foreground: "rgb(var(--trade-font))",
        },
        primary: {
          DEFAULT: "rgb(var(--trade-green))",
          foreground: "rgb(var(--trade-bg))",
        },
        secondary: {
          DEFAULT: "rgb(var(--trade-green-dark))",
          foreground: "rgb(var(--trade-bg))",
        },
        muted: {
          DEFAULT: "rgb(var(--trade-bg))",
          foreground: "rgb(var(--trade-font) / 0.7)",
        },
        accent: {
          DEFAULT: "rgb(var(--trade-green) / 0.1)",
          foreground: "rgb(var(--trade-font))",
        },
        destructive: {
          DEFAULT: "rgb(var(--trade-green-dark))",
          foreground: "rgb(var(--trade-bg))",
        },
        border: "rgb(var(--trade-green) / 0.2)",
        input: "rgb(var(--trade-green) / 0.1)",
        ring: "rgb(var(--trade-green))",
        chart: {
          "1": "rgb(var(--trade-green))",
          "2": "rgb(var(--trade-green-dark))",
          "3": "rgb(var(--trade-green) / 0.8)",
          "4": "rgb(var(--trade-green-dark) / 0.8)",
          "5": "rgb(var(--trade-green) / 0.6)",
        },
        sidebar: {
          DEFAULT: "rgb(var(--trade-bg))",
          foreground: "rgb(var(--trade-font))",
          primary: "rgb(var(--trade-green))",
          "primary-foreground": "rgb(var(--trade-bg))",
          accent: "rgb(var(--trade-green) / 0.1)",
          "accent-foreground": "rgb(var(--trade-font))",
          border: "rgb(var(--trade-green) / 0.2)",
          ring: "rgb(var(--trade-green))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;