/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        obsidian: {
          900: '#0a0a0f', // deep black background
          800: '#12121a', // panels
          700: '#1f1f2e', // borders
        },
        electric: {
          green: '#00ff9d', // Actionable / Positive
          dim: 'rgba(0, 255, 157, 0.1)',
        },
        alert: {
          red: '#ff3366', // Critical
          amber: '#ffb020', // Warning
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon': '0 0 10px rgba(0, 255, 157, 0.5)',
      }
    },
  },
  plugins: [],
}
