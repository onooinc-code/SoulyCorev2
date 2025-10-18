/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif'],
      },
      backdropBlur: {
        'xl': '24px',
      }
    },
  },
  plugins: [],
}