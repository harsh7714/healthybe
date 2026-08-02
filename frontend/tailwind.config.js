/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─── Typography ───────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },

      // ─── Color Tokens ─────────────────────────────────────
      colors: {
        // Brand teal (primary health accent)
        primary: {
          50:  '#f0fdf9',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Surface layers (dark glass system)
        surface: {
          DEFAULT: 'rgba(10,14,24,0.85)',
          50:  '#0a0e18',
          100: '#080c14',
          200: '#06090f',
          300: '#04070b',
          400: '#020408',
        },
        // Extended slate (needed custom shades)
        slate: {
          750: '#253347',
          850: '#1a2438',
          900: '#0f172a',
          950: '#080e1a',
        },
        // Glass border colors
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          medium: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
          glow:   'rgba(20,184,166,0.35)',
        },
      },

      // ─── Backgrounds ──────────────────────────────────────
      backgroundImage: {
        'glass':          'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        'glass-hover':    'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
        'gradient-brand': 'linear-gradient(135deg, #14b8a6, #06b6d4)',
        'gradient-hero':  'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(20,184,166,0.15), transparent)',
        'gradient-mesh':  'radial-gradient(at 40% 20%, rgba(20,184,166,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(6,182,212,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(139,92,246,0.04) 0px, transparent 50%)',
      },

      // ─── Box Shadow ───────────────────────────────────────
      boxShadow: {
        'glass':      '0 4px 24px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-lg':   '0 8px 40px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-teal':  '0 0 20px rgba(20,184,166,0.25), 0 4px 16px rgba(0,0,0,0.4)',
        'glow-teal-sm': '0 0 10px rgba(20,184,166,0.2)',
        'glow-cyan':  '0 0 20px rgba(6,182,212,0.25), 0 4px 16px rgba(0,0,0,0.4)',
        'glow-rose':  '0 0 20px rgba(244,63,94,0.3), 0 4px 16px rgba(0,0,0,0.4)',
        'card':       '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 2px 6px rgba(0,0,0,0.5), 0 16px 40px rgba(0,0,0,0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },

      // ─── Animations ───────────────────────────────────────
      animation: {
        // Existing kept for compatibility
        'fade-in':        'fadeIn 0.5s ease-out',
        'slide-up':       'slideUp 0.5s ease-out',
        // New premium animations
        'fade-in-fast':   'fadeInFast 0.2s ease-out both',
        'fade-in-up':     'fadeInUp 0.4s ease-out both',
        'scale-up':       'scaleUp 0.3s ease-out both',
        'slide-in-right': 'slideInRight 0.35s ease-out both',
        'float':          'float 6s ease-in-out infinite',
        'float-slow':     'float 9s ease-in-out infinite',
        'float-slower':   'float 12s ease-in-out infinite',
        'pulse-glow':     'pulseGlow 2.5s ease-in-out infinite',
        'pulse-ring':     'pulseRing 2s ease-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'scan-laser':     'scanLaser 2.5s infinite ease-in-out',
        'spin-slow':      'spin 3s linear infinite',
        'bounce-dot':     'bounceDot 1.4s infinite ease-in-out',
        'slide-in-up':    'slideInUp 0.3s ease-out both',
        'glow-pulse':     'glowPulse 2s ease-in-out infinite',
        'draw-line':      'drawLine 1s ease-out forwards',
      },
      keyframes: {
        // Existing
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:      { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        // New
        fadeInFast:   { 'from': { opacity: '0' }, 'to': { opacity: '1' } },
        fadeInUp:     { 'from': { opacity: '0', transform: 'translateY(16px)' }, 'to': { opacity: '1', transform: 'translateY(0)' } },
        scaleUp:      { 'from': { opacity: '0', transform: 'scale(0.94)' }, 'to': { opacity: '1', transform: 'scale(1)' } },
        slideInRight: { 'from': { opacity: '0', transform: 'translateX(20px)' }, 'to': { opacity: '1', transform: 'translateX(0)' } },
        slideInUp:    { 'from': { opacity: '0', transform: 'translateY(10px)' }, 'to': { opacity: '1', transform: 'translateY(0)' } },
        float:        { '0%,100%': { transform: 'translateY(0px) rotate(0deg)' }, '33%': { transform: 'translateY(-18px) rotate(1deg)' }, '66%': { transform: 'translateY(-8px) rotate(-0.5deg)' } },
        pulseGlow:    { '0%,100%': { opacity: '0.6', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.05)' } },
        pulseRing:    { '0%': { transform: 'scale(1)', opacity: '0.8' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        shimmer:      { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        scanLaser:    { '0%,100%': { top: '5%' }, '50%': { top: '95%' } },
        bounceDot:    { '0%,80%,100%': { transform: 'scale(0)', opacity: '0' }, '40%': { transform: 'scale(1)', opacity: '1' } },
        glowPulse:    { '0%,100%': { boxShadow: '0 0 10px rgba(20,184,166,0.2)' }, '50%': { boxShadow: '0 0 25px rgba(20,184,166,0.5), 0 0 50px rgba(20,184,166,0.15)' } },
        drawLine:     { 'from': { strokeDashoffset: '1000' }, 'to': { strokeDashoffset: '0' } },
      },

      // ─── Border Radius ────────────────────────────────────
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // ─── Backdrop Blur ────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
