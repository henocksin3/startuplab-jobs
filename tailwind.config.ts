import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sl: {
          red: "#FF3333",
          "red-deep": "#CC292E",
          ink: "#1D2526",
          burgundy: "#422E2F",
          rose: "#925656",
          pink: "#FFE5EA",
          purple: "#6F6F93",
          haze: "#C5C5D4",
          warm: "#8E8282",
        },
      },
      fontFamily: {
        sans: ["Replica", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Gelasio", "ui-serif", "Georgia", "serif"],
      },
      maxWidth: { content: "1200px" },
    },
  },
  plugins: [],
} satisfies Config;
