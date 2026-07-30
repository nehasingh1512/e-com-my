/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "#7A1128",
          dark: "#5C0D1E",
        },
        rakhired: "#C41230",
        blush: "#F8EFE3",
        sand: "#F4E5D3",
        paper: "#FFF9F1",
        cream: "#FBF3E7",
        gold: "#D9A441",
      },
      fontFamily: {
        display: ["Georgia", "'Times New Roman'", "serif"],
        body: ["'Segoe UI'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
