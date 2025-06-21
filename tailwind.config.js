// tailwind.config.js
export default {
  darkMode: 'class', // ✅ Enables dark mode via a CSS class (e.g., 'dark')
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ✅ Includes all JS/TS/React files
  ],
  theme: {
    extend: {
      // Optional: add custom colors or dark variants here
    },
  },
  plugins: [],
};
