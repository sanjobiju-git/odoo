/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1C1917',   // Primary background
          surface: '#292524',   // Sidebar & Card background
          elevated: '#302B28',  // Elevated surface
          subtle: '#211E1C',    // Subtle surface
          border: '#403A35',    // Borders
        },
        gold: {
          DEFAULT: '#EAB308',   // Primary accent / Travertine Gold
          hover: '#CA8A04',
          muted: '#854D0E',
          surface: '#33290E',
        },
        vellum: {
          DEFAULT: '#FAF7F5',   // Primary text
          secondary: '#A8A29E', // Secondary text
          muted: '#78716C',     // Muted text
        },
        status: {
          success: '#65A882',
          warning: '#EAB308',
          error: '#D97770',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
