/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notary: {
          50: '#f9f1f3',
          100: '#f3dde3',
          200: '#e5bcc7',
          300: '#d091a4',
          400: '#b85f7b',
          500: '#92324f',
          600: '#7b203b',
          700: '#6D1025',
          800: '#5E1020',
          900: '#43111d',
          950: '#24080f',
        },
        gold: {
          50: '#f8f3e8',
          100: '#f1e6cf',
          200: '#e5d0a2',
          300: '#d4b36e',
          400: '#bc994d',
          500: '#A8843D',
          600: '#8f6f33',
          700: '#765b2b',
          800: '#5e4822',
          900: '#49381b',
        },
        neutral: {
          50: '#f8f7f4',
          100: '#f1efea',
          200: '#e5e2db',
          300: '#d2ccc2',
          400: '#a9a093',
          500: '#847a6c',
          600: '#6b7280',
          700: '#4b5563',
          800: '#2f3640',
          900: '#1E1E1E',
        },
        success: '#2E7D32',
        warning: '#B7791F',
        info: '#1E4E8C',
        danger: '#B42318',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 30px -18px rgba(38, 28, 25, 0.16), 0 4px 10px -8px rgba(38, 28, 25, 0.08)',
        'card-hover': '0 22px 42px -20px rgba(38, 28, 25, 0.24), 0 10px 18px -12px rgba(38, 28, 25, 0.12)',
        'panel': '0 20px 45px -30px rgba(27, 18, 20, 0.35)',
        'glow': '0 18px 36px -24px rgba(109, 16, 37, 0.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
