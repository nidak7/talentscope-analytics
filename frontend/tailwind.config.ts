import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#f1f5fb",
          100: "#e1e8f5",
          200: "#c9d6ee",
          300: "#a6bae1",
          400: "#7f97d2",
          500: "#5b78c1",
          600: "#4561a8",
          700: "#394f86",
          800: "#2f416b",
          900: "#263655"
        },
        accent: {
          50: "#fff4e5",
          100: "#ffe7c7",
          200: "#ffd2a1",
          300: "#ffb779",
          400: "#ff9b58",
          500: "#f5823a",
          600: "#dd6a2c",
          700: "#b75122",
          800: "#90411c",
          900: "#723417"
        }
      },
      boxShadow: {
        soft: "0 10px 35px -18px rgba(31, 41, 55, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
