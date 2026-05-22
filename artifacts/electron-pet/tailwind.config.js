/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/renderer/src/**/*.{js,jsx,ts,tsx}", "./src/renderer/index.html"],
  theme: {
    extend: {
      colors: {
        spider: {
          bg: "#0a0a0f",
          surface: "#12101a",
          border: "#2a1f3d",
          amber: "#d97706",
          amberLight: "#fbbf24",
          purple: "#7c3aed",
          purpleLight: "#a78bfa",
          red: "#dc2626",
          green: "#16a34a",
        },
      },
      fontFamily: {
        mono: ["'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
