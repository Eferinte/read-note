import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          deep: "#112A46",
          accent: "#FFbbff",
          soft: "#ECF3FF",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
