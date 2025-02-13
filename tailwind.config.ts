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
        background: "rgb(var(--trade-beige))",
        foreground: "rgb(var(--trade-font))",
        card: {
          DEFAULT: "rgb(var(--trade-beige))",
          foreground: "rgb(var(--trade-font))",
        },
        popover: {
          DEFAULT: "rgb(var(--trade-beige))",
          foreground: "rgb(var(--trade-font))",
        },
        primary: {
          DEFAULT: "rgb(var(--trade-orange))",
          foreground: "rgb(var(--trade-beige))",
        },
        secondary: {
          DEFAULT: "rgb(var(--trade-red))",
          foreground: "rgb(var(--trade-beige))",
        },
        muted: {
          DEFAULT: "rgb(var(--trade-beige))",
          foreground: "rgb(var(--trade-font) / 0.7)",
        },
        accent: {
          DEFAULT: "rgb(var(--trade-orange) / 0.1)",
          foreground: "rgb(var(--trade-font))",
        },
        destructive: {
          DEFAULT: "rgb(var(--trade-red))",
          foreground: "rgb(var(--trade-beige))",
        },
        border: "rgb(var(--trade-orange) / 0.2)",
        input: "rgb(var(--trade-orange) / 0.1)",
        ring: "rgb(var(--trade-orange))",
        chart: {
          "1": "rgb(var(--trade-orange))",
          "2": "rgb(var(--trade-red))",
          "3": "rgb(var(--trade-orange) / 0.8)",
          "4": "rgb(var(--trade-red) / 0.8)",
          "5": "rgb(var(--trade-orange) / 0.6)",
        },
        sidebar: {
          DEFAULT: "rgb(var(--trade-beige))",
          foreground: "rgb(var(--trade-font))",
          primary: "rgb(var(--trade-orange))",
          "primary-foreground": "rgb(var(--trade-beige))",
          accent: "rgb(var(--trade-orange) / 0.1)",
          "accent-foreground": "rgb(var(--trade-font))",
          border: "rgb(var(--trade-orange) / 0.2)",
          ring: "rgb(var(--trade-orange))",
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