/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      screens: {
        'xs': '400px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px'
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'serif': ['Playfair Display', 'serif']
      },
      colors: {
        primary: '#7c3aed',
        secondary: '#6d28d9',
        accent: '#a78bfa',
        sage: '#ede9fe',
        rose: '#f43f5e',
        gold: '#f59e0b'
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'step-enter': 'stepEnter 0.35s ease-out',
      },
      keyframes: {
        stepEnter: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem'
      }
    }
  },
  plugins: []
};