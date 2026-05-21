import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ─── COULEURS QRfolio ────────────────────────────────────────
      colors: {
        // Fond principal
        canvas: {
          DEFAULT: '#080808',
          soft: '#0F0E0C',
          card: '#111009',
        },
        // Or — accent principal
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C96A',
          dim: 'rgba(201, 168, 76, 0.15)',
          border: 'rgba(201, 168, 76, 0.3)',
          50: '#FBF5E6',
          100: '#F5E9C4',
          200: '#EDD48D',
          300: '#E8C96A',
          400: '#D9B353',
          500: '#C9A84C',
          600: '#A88938',
          700: '#7F6829',
          800: '#564719',
          900: '#2D250C',
        },
        // Neon — accent secondaire (statuts, badges actifs)
        neon: {
          DEFAULT: '#39FF8F',
          dim: 'rgba(57, 255, 143, 0.12)',
          border: 'rgba(57, 255, 143, 0.3)',
        },
        // Textes
        ink: {
          DEFAULT: '#F5F0E8',
          muted: '#8A8478',
          faint: '#4A4640',
        },
      },

      // ─── TYPOGRAPHIES ────────────────────────────────────────────
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', ...fontFamily.sans],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.08em' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['15px', { lineHeight: '24px' }],
        lg: ['17px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '30px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
        '4xl': ['40px', { lineHeight: '48px' }],
        '5xl': ['56px', { lineHeight: '60px', letterSpacing: '-0.02em' }],
        '6xl': ['72px', { lineHeight: '76px', letterSpacing: '-0.03em' }],
        '7xl': ['96px', { lineHeight: '100px', letterSpacing: '-0.04em' }],
      },

      // ─── ESPACEMENTS CUSTOM ──────────────────────────────────────
      spacing: {
        '18': '72px',
        '22': '88px',
        '30': '120px',
      },

      // ─── BORDER RADIUS ───────────────────────────────────────────
      borderRadius: {
        'sm': '2px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },

      // ─── OMBRES ──────────────────────────────────────────────────
      boxShadow: {
        'gold': '0 0 20px rgba(201, 168, 76, 0.15)',
        'gold-lg': '0 0 40px rgba(201, 168, 76, 0.2)',
        'neon': '0 0 20px rgba(57, 255, 143, 0.2)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.6)',
      },

      // ─── ANIMATIONS ──────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 168, 76, 0)' },
          '50%': { boxShadow: '0 0 0 8px rgba(201, 168, 76, 0.15)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
      },

      // ─── BACKGROUNDS ─────────────────────────────────────────────
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.3) 50%, transparent 100%)',
        'canvas-gradient': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
        'card-hover': 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
}

export default config
