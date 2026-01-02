/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      screens: {
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px'
      },
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
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem'
      }
    }
  },
  plugins: []
};