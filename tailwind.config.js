/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0A0A0F",
          soft: "#1A1A2E",
          muted: "#2D2D44",
        },
        slate: {
          50: "#F8F8FC",
          100: "#EFEFF8",
          200: "#DCDCF0",
          400: "#9898BE",
          600: "#5A5A82",
        },
        azure: {
          DEFAULT: "#2563EB",
          light: "#3B82F6",
          dim: "#1D4ED8",
          glow: "rgba(37,99,235,0.15)",
        },
        emerald: {
          DEFAULT: "#059669",
          light: "#10B981",
          glow: "rgba(5,150,105,0.15)",
        },
        amber: {
          DEFAULT: "#D97706",
          light: "#F59E0B",
          glow: "rgba(217,119,6,0.15)",
        },
        rose: {
          DEFAULT: "#E11D48",
          glow: "rgba(225,29,72,0.15)",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "fade-up": "fadeUp 0.5s ease-out forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
