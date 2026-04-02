import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          deep: "#112A46",
          accent: "#F97316",
          soft: "#ECF3FF",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
