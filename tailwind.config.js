/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark, purposeful fitness-product palette.
        ink: {
          950: '#0a0b0d',
          900: '#111318',
          850: '#161922',
          800: '#1c2029',
          700: '#262b36',
          600: '#333a48',
        },
        accent: {
          DEFAULT: '#f2683c',
          hover: '#ff794d',
          soft: '#3a251c',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
