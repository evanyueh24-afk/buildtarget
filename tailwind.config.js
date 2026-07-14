/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette is defined as CSS variables in index.css (:root) and mapped to
        // utilities here via the space-separated-RGB pattern, so opacity
        // modifiers (e.g. text-accent/45) still work. Change a color in one
        // place (the :root token) and it carries across the whole app.
        ink: {
          950: 'rgb(var(--color-bg) / <alpha-value>)',
          900: 'rgb(var(--color-elevated) / <alpha-value>)',
          850: 'rgb(var(--color-surface) / <alpha-value>)',
          800: 'rgb(var(--color-surface-2) / <alpha-value>)',
          700: 'rgb(var(--color-border) / <alpha-value>)',
          600: 'rgb(var(--color-border-strong) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
          soft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
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
