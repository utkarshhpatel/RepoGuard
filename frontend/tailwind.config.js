/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rg: {
          bg: "#0B0F14",
          panel: "#111821",
          surface: "#18212B",
          text: "#E8EEF5",
          muted: "#9AA8B7",
          accent: "#34D399",
          info: "#60A5FA",
          warning: "#FBBF24",
          error: "#F87171",
          border: "#273342",
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
