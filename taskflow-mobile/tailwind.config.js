/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#6366f1',
        secondary: '#8b5cf6',
        success:   '#22c55e',
        warning:   '#f59e0b',
        danger:    '#ef4444',
        surface:   '#f8fafc',
        muted:     '#94a3b8',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
}
