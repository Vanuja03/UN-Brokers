/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f4f7fb',
          100: '#e7eef6',
          200: '#c9d8ea',
          700: '#1a3d66',
          800: '#122f50',
          900: '#0b2545',
          950: '#07182e',
        },
        gold: {
          DEFAULT: '#FFB900',
          dark: '#E5A600',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(11, 37, 69, 0.07)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};
