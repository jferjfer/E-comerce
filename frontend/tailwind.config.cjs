/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'serif': ['Playfair Display', 'serif']
      },
      colors: {
        primary: '#1f2937',
        secondary: '#374151',
        accent: '#6b7280',
        sage: '#9ca3af'
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
      }
    }
  },
  plugins: []
};