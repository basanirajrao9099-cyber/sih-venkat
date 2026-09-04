/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F2F8F5',
          100: '#E2EFE8',
          200: '#C5DFD2',
          300: '#9EC8B4',
          400: '#6BA88D',
          500: '#2E7D5B', // Primary Ayurvedic Green
          600: '#266B4D',
          700: '#1F563E',
          800: '#194532',
          900: '#133527',
        },
        sage: {
          50: '#F6FAF7',
          100: '#EBF4EE',
          200: '#D5E6DC',
          300: '#B6D3C2',
          400: '#94BEA5',
          500: '#7FAF91', // Soft Sage
          600: '#659376',
          700: '#4F755E',
          800: '#3D5948',
          900: '#2B3E33',
        },
        herbal: {
          50: '#FDFBF5',
          100: '#FBF6E5', // Warm Gold Tint
          200: '#F6EBC9',
          300: '#EEDAA3',
          400: '#DEC06B',
          500: '#C9A227', // Muted Herbal Gold Accent
          600: '#A9841C',
          700: '#846414',
          800: '#644A12',
          900: '#4A360F',
        },
        warm: {
          50: '#FFFFFF',
          100: '#FAF9F4', // Main Warm Ivory Background
          200: '#F5F1E8', // Secondary Linen/Beige Background
          300: '#EBE5D8',
          400: '#DCD4C3',
          500: '#C2B8A3',
        },
        forest: {
          50: '#F2F5F3',
          100: '#E1E8E3',
          200: '#C1D1C6',
          300: '#9CB3A3',
          400: '#66736B', // Muted Gray-Green
          500: '#46554D',
          600: '#34423B',
          700: '#2B3731',
          800: '#26352D', // Main Dark Green-Gray Text
          900: '#1A251F',
        },
        ayur: {
          green: '#2E7D5B',
          sage: '#7FAF91',
          gold: '#C9A227',
          bg: '#FAF9F4',
          card: '#FFFFFF',
          text: '#26352D',
          muted: '#66736B',
          border: '#E8E4D9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
