/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Core Surfaces ──────────────────────────────
        es: {
          void:            '#04040C',
          surface:         '#0B0B18',
          'surface-raised':'#111125',
          'surface-overlay':'#16163A',
        },

        // ── Brand: Electric Crimson ────────────────────
        brand: {
          DEFAULT:  '#EC4856',
          hover:    '#D43B49',
          muted:    'rgba(236, 72, 86, 0.12)',
          glow:     'rgba(236, 72, 86, 0.25)',
          subtle:   'rgba(236, 72, 86, 0.06)',
        },

        // ── Accent: Astral Indigo ──────────────────────
        accent: {
          DEFAULT:  '#6C5CE7',
          hover:    '#5A4BD6',
          muted:    'rgba(108, 92, 231, 0.12)',
          glow:     'rgba(108, 92, 231, 0.25)',
        },

        // ── Signal & Semantic ──────────────────────────
        signal: {
          DEFAULT:  '#FBBF24',
          muted:    'rgba(251, 191, 36, 0.12)',
        },
        success: {
          DEFAULT:  '#10B981',
          muted:    'rgba(16, 185, 129, 0.12)',
        },
        danger: {
          DEFAULT:  '#EF4444',
          muted:    'rgba(239, 68, 68, 0.12)',
        },

        // ── Text Scale ─────────────────────────────────
        'text-primary':   '#F1F1F6',
        'text-secondary': '#9194AC',
        'text-tertiary':  '#5A5D78',
        'text-disabled':  '#3A3D52',

        // ── Borders ────────────────────────────────────
        'es-border':       'rgba(255, 255, 255, 0.06)',
        'es-border-subtle':'rgba(255, 255, 255, 0.03)',
        'es-border-focus': 'rgba(236, 72, 86, 0.4)',
      },

      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        body:    ['Satoshi', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono Variable"', 'monospace'],
        // Keep 'sans' as body fallback for Tailwind defaults
        sans:    ['Satoshi', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-xl': ['clamp(3rem, 6vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display':    ['clamp(2rem, 4vw, 3.5rem)',  { lineHeight: '1',    letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading':    ['1.5rem',                     { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'subheading': ['1.125rem',                   { lineHeight: '1.3',  letterSpacing: '0em',     fontWeight: '500' }],
        'body':       ['0.875rem',                   { lineHeight: '1.6',  letterSpacing: '0.01em',  fontWeight: '400' }],
        'body-sm':    ['0.8125rem',                  { lineHeight: '1.6',  letterSpacing: '0.01em',  fontWeight: '400' }],
        'caption':    ['0.6875rem',                  { lineHeight: '1.4',  letterSpacing: '0.06em',  fontWeight: '500' }],
        'overline':   ['0.625rem',                   { lineHeight: '1.4',  letterSpacing: '0.12em',  fontWeight: '700' }],
      },

      borderRadius: {
        'es-xs':   '6px',
        'es-sm':   '10px',
        'es-md':   '14px',
        'es-lg':   '20px',
        'es-xl':   '28px',
        'es-full': '9999px',
      },

      boxShadow: {
        'es-sm':          '0 2px 8px rgba(0,0,0,0.3)',
        'es-md':          '0 4px 20px rgba(0,0,0,0.4)',
        'es-lg':          '0 8px 40px rgba(0,0,0,0.5)',
        'es-xl':          '0 16px 64px rgba(0,0,0,0.6)',
        'es-glow-brand':  '0 0 20px rgba(236,72,86,0.25)',
        'es-glow-accent': '0 0 20px rgba(108,92,231,0.25)',
        'es-inner':       'inset 0 1px 3px rgba(0,0,0,0.4)',
      },

      transitionTimingFunction: {
        'es-out':    'cubic-bezier(0.16, 1, 0.3, 1)',
        'es-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'es-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      transitionDuration: {
        'fast':      '150ms',
        'normal':    '250ms',
        'slow':      '450ms',
        'cinematic': '700ms',
      },

      animation: {
        'pulse-glow':     'pulseGlow 3s ease-in-out infinite',
        'float':          'float 6s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'fade-in':        'fadeIn 0.5s ease-out forwards',
        'slide-up':       'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },

      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        gradientShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
