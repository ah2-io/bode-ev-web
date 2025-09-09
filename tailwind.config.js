/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#307FE2',
          hover: '#2A6BC0',
          light: '#E6F0FB',
          dark: '#1E5BA8',
        },
        secondary: {
          DEFAULT: '#00BB31',
          hover: '#009928',
          light: '#E6F7EC',
          dark: '#007720',
        }
      }
    },
  },
  plugins: [],
}