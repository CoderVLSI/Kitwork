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
        kit: {
          bg: "#0a0a0f",
          surface: "#12121a",
          surface2: "#1a1a26",
          border: "#2a2a3a",
          text: "#e4e4ef",
          textmuted: "#8888a0",
          primary: "#f97316",
        },
      },
    },
  },
  plugins: [],
};

export default config;
