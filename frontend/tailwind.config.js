/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nueva paleta institucional
        notary: {
          50: '#F0F5FA',
          100: '#D9E6F2',
          200: '#B3CDE0',
          300: '#80A9C7',
          400: '#4D7FAA',
          500: '#0F2A44', // Azul petróleo (principal)
          600: '#0A2036',
          700: '#071A2C', // Azul oscuro
          800: '#05121E',
          900: '#030A11',
          950: '#020508',
        },
        wine: {
          50: '#F9E8EB',
          100: '#F0C9D0',
          200: '#E093A1',
          300: '#CC5D72',
          400: '#A8354D',
          500: '#7A0C24', // Vino acento
          600: '#61091D',
          700: '#480716',
          800: '#30050E',
          900: '#180207',
        },
        gold: {
          50: '#FFF7E6',
          100: '#FFE7B3',
          200: '#FFD680',
          300: '#FFC54D',
          400: '#DBAA3E',
          500: '#C9A24D', // Dorado principal
          600: '#A6853E',
          700: '#82672F',
          800: '#5F4A20',
          900: '#3B2D11',
        },
        cream: '#F8F5F1', // Crema
        neutral: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#667085', // Texto secundario
          700: '#495057',
          800: '#343A40',
          900: '#1F2933', // Texto principal
        },
        success: '#2E7D32',
        warning: '#B7791F',
        info: '#1E4E8C',
        danger: '#B42318',
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 10px 30px -18px rgba(15, 42, 68, 0.16), 0 4px 10px -8px rgba(15, 42, 68, 0.08)',
        'card-hover': '0 22px 42px -20px rgba(15, 42, 68, 0.24), 0 10px 18px -12px rgba(15, 42, 68, 0.12)',
        'panel': '0 20px 45px -30px rgba(7, 26, 44, 0.35)',
        'glow': '0 18px 36px -24px rgba(15, 42, 68, 0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
