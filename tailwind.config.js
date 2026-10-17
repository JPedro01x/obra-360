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
          950: '#0a0f1d',
          900: '#121214',
          800: '#18181b',
          700: '#27272a'
        }
      }
    },
  },
  plugins: [],
}
