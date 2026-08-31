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
        background: "#090D14",
        surface: {
          50: "#1E2638",
          100: "#161D2B",
          200: "#111622",
          300: "#0D121C",
          400: "#090D14"
        },
        border: {
          subtle: "#1F293D",
          DEFAULT: "#26334D",
          highlight: "#3B82F6"
        },
        status: {
          stable: "#10B981",       // Emerald Green
          initializing: "#F59E0B", // Amber
          movement: "#EF4444",     // Vivid Alert Red
          lost: "#64748B",         // Slate Gray
          cyan: "#06B6D4",         // CV Tech Cyan
          piv: "#38BDF8",          // Sky Blue (PIV)
          tube: "#F97316"          // Amber Orange (TUBE)
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.25)',
        'glow-red': '0 0 20px -2px rgba(239, 68, 68, 0.35)',
        'glow-green': '0 0 15px -3px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.25)'
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
