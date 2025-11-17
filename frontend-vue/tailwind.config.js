/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'page-bg': '#f7f7f7',
        'page-text': '#1f2937',
        'primary-color': '#1e293b',
        'secondary-color': '#9ca3af',
        'accent-color': '#ffffff',
        'header-bg': '#f3f4f6',
        'cod-color': '#b91c1c',
        'ai-color': '#084d83',
      },
      boxShadow: {
        'custom': '0 8px 25px -5px rgba(0, 0, 0, 0.08)',
        'ai': '0 4px 10px -2px rgba(8, 77, 131, 0.5)',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      }
    },
  },
  plugins: [],
}