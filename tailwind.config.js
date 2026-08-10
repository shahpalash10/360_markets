/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0B0B0B",
          white: "#FFFFFF",
          lime: "#8BE000",
          lightLime: "#EFFFCA",
          darkGray: "#161616",
          mediumGray: "#8A8A8A",
          border: "#D9D9D9",
          cardBg: "#FAFAFA",
          darkCard: "#121212",
        },
      },
      fontFamily: {
        sans: ["Inter", "Satoshi", "Manrope", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.05em",
        tight: "-0.03em",
        mega: "-0.06em",
      },
    },
  },
  plugins: [],
};
