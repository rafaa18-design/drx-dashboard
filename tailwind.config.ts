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
        // DRX Identity
        bg:      "#F1ECE8",
        surface: "#F8F4F1",
        ink: {
          DEFAULT: "#121212",
          2: "#3A3A3A",
          3: "#6E6A66",
          4: "#A29D98",
        },
        line: {
          DEFAULT: "#D9D2CC",
          soft:    "#E5DED7",
        },
        accent: {
          DEFAULT: "#9C0F20",
          soft:    "rgba(156,15,32,0.08)",
        },
        warn: "#B8741A",
        ok:   "#2D6845",
      },
      fontFamily: {
        display: ["Clash Display", "sans-serif"],
        sans:    ["DM Sans", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.35" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulse:   "pulse 2.4s ease-in-out infinite",
        fadeIn:  "fadeIn 0.3s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
