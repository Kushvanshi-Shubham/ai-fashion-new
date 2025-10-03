/** Tailwind CSS v4 config to ensure custom utility class names in globals.css are preserved. */
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './prisma/**/*.{ts,js}',
    './docs/**/*.{md,mdx}',
  ],
  safelist: [
    'hero-shell','hero-title','hero-sub','center-stack','stack-gap-xs','stack-gap-sm','stack-gap-md','stack-gap-lg','stack-gap-xl',
    'stats-grid','card-crisp','card-crisp-accent','status-badge','confidence-high','confidence-medium','confidence-low'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
