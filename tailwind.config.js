/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        // Paper — warm off-white background
        paper: {
          DEFAULT: '#FAFAF5',
          raised: '#FFFFFF',
          sunken: '#F2F1EA',
        },
        // Ink — text
        ink: {
          DEFAULT: '#1E1E1C',
          muted: '#6B6B66',
          soft: '#9A9892',
          faint: '#C8C6BE',
        },
        // Edge — borders & dividers
        edge: {
          DEFAULT: '#E9E6DD',
          soft: '#F0EEE6',
          strong: '#D9D5C8',
        },
        // Accent — the app's voice
        accent: {
          DEFAULT: '#B54A2C', // warm terracotta
          soft: '#F4E6DF',
          ink: '#8A3820',
        },
        // Label swatches — muted, intentional
        label: {
          rose: '#C4526B',
          amber: '#B88429',
          olive: '#7E8A3F',
          sage: '#5B8A6E',
          sky: '#4B7BA6',
          violet: '#7A5CA8',
          slate: '#636B73',
        },
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      letterSpacing: {
        tightish: '-0.011em',
      },
      boxShadow: {
        card: '0 1px 0 rgba(30,30,28,0.04), 0 1px 2px rgba(30,30,28,0.04)',
        'card-hover': '0 1px 0 rgba(30,30,28,0.05), 0 4px 12px -2px rgba(30,30,28,0.08)',
        pop: '0 8px 24px -6px rgba(30,30,28,0.14), 0 2px 6px rgba(30,30,28,0.06)',
        inset: 'inset 0 0 0 1px rgba(30,30,28,0.06)',
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      animation: {
        'fade-in': 'fadeIn 140ms ease-out',
        'pop-in': 'popIn 160ms cubic-bezier(.2,.9,.3,1.1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        popIn: {
          '0%': { opacity: 0, transform: 'translateY(4px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
