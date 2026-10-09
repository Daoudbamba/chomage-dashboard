import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16202B",
        surface: "#F8F3EA",
        paper: "#FFFFFF",
        muted: "#6D7682",
        dim: "#9098A4",
        accent: "#2D8F8A",
        accent2: "#425BB6",
        teal: "#2D8F8A",
        indigo: "#425BB6",
        coral: "#F27554",
        amber: "#E6A938",
        coralDeep: "#BF4526",
        tealDeep: "#1F6F6B",
      },
      fontFamily: {
        sans: ['"Manrope"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Cormorant Garamond"', "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
