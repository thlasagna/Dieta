import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#1D9E75",
        xp: "#7F77DD",
        danger: "#E24B4A",
        warning: "#EF9F27",
      },
    },
  },
  plugins: [],
};
export default config;
