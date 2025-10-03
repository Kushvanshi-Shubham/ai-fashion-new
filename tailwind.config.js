/** Basic Tailwind config recreated after revert */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui'],
      }
    }
  },
  plugins: [
  function motionUtilities({ addUtilities, addBase }) {
      addBase({
        '@keyframes fadeIn': { from: { opacity: '0' }, to: { opacity: '1' } },
        '@keyframes rise': { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        '@keyframes scaleIn': { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } }
      })
      addUtilities({
        '.motion-fade-in': {
          animation: 'fadeIn 0.6s cubic-bezier(0.22,1,0.36,1) both'
        },
        '.motion-rise': {
          animation: 'rise 0.7s cubic-bezier(0.22,1,0.36,1) both'
        },
        '.motion-scale': {
          animation: 'scaleIn 0.45s cubic-bezier(0.16,0.84,0.44,1) both'
        }
      })
    }
  ]
}
