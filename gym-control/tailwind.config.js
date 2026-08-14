/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gym-dark': '#0a0a0a',
        'gym-card': '#111111',
        'gym-gray': '#1a1a1a',
        'gym-border': '#2a2a2a',
        'gym-accent': '#00ff88', // Verde limón/neón
        'gym-accent-dark': '#00cc6a',
        'gym-accent-glow': 'rgba(0, 255, 136, 0.3)',
        'gym-text': '#ffffff',
        'gym-text-secondary': '#a0a0a0',
        'gym-error': '#ff4d4d',
      },
      borderRadius: {
        'gym': '16px',
      },
      boxShadow: {
        'glow-green': '0 0 30px rgba(0, 255, 136, 0.3)',
        'glow-green-subtle': '0 0 20px rgba(0, 255, 136, 0.15)',
      }
    },
  },
  plugins: [],
}