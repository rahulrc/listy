/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        coral: '#FF6B6B',
        turquoise: '#4ECDC4',
        sunny: '#FFE66D',
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFE66D'
      },
      fontFamily: {
        'nunito': ['Nunito', 'sans-serif'],
        'quicksand': ['Quicksand', 'sans-serif']
      }
    },
  },
  plugins: [],
}
