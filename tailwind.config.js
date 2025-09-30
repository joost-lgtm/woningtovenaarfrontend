/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00a8a8',
          50: '#f0fefe',
          100: '#ccfbfb',
          200: '#99f6f6',
          300: '#5eeaea',
          400: '#26d3d3',
          500: '#00a8a8',
          600: '#05999a',
          700: '#0a7b7d',
          800: '#0f6264',
          900: '#135152',
        },
        secondary: {
          DEFAULT: '#ff9933',
          50: '#fff9f0',
          100: '#fef2e1',
          200: '#fce4c7',
          300: '#f9d0a2',
          400: '#f5b574',
          500: '#ff9933',
          600: '#f0882e',
          700: '#c66b25',
          800: '#9d5520',
          900: '#7d451c',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
