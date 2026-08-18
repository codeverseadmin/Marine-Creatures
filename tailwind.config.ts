import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        ocean: {
          primary: '#02070B',
          secondary: '#07151C',
          deep: '#0B2028',
          accent: '#00B8D9',
          cyan: '#36D6E8',
          muted: '#9AAEB5',
          text: '#F4F8FA',
          border: 'rgba(255,255,255,0.10)',
          gold: '#C7A76C',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3.5rem, 10vw, 9rem)', { lineHeight: '0.9', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.5rem, 7vw, 6.5rem)', { lineHeight: '0.92', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '0.95', letterSpacing: '-0.015em' }],
        'display-sm': ['clamp(1.5rem, 3.5vw, 3rem)', { lineHeight: '1', letterSpacing: '-0.01em' }],
        'label': ['0.625rem', { lineHeight: '1', letterSpacing: '0.2em' }],
        'label-lg': ['0.75rem', { lineHeight: '1', letterSpacing: '0.25em' }],
      },
      spacing: {
        'section': '8rem',
        'section-sm': '5rem',
        'container': '1440px',
      },
      transitionDuration: {
        'fast': '200ms',
        'standard': '500ms',
        'cinematic': '1000ms',
      },
      transitionTimingFunction: {
        'ocean': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'reveal': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'gentle': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'caustic-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        'scroll-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(6px)' },
        },
        'particle-drift': {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) translateX(20px)', opacity: '0' },
        },
        'wave-line': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'clip-reveal': {
          '0%': { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0% 0 0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'caustic-pulse': 'caustic-pulse 4s ease-in-out infinite',
        'scroll-bounce': 'scroll-bounce 2s ease-in-out infinite',
        'particle-drift': 'particle-drift 8s linear infinite',
        shimmer: 'shimmer 3s linear infinite',
        'fade-up': 'fade-up 0.8s ease-out forwards',
        'clip-reveal': 'clip-reveal 1s cubic-bezier(0.77, 0, 0.175, 1) forwards',
      },
      backgroundImage: {
        'ocean-gradient':
          'linear-gradient(180deg, #02070B 0%, #07151C 40%, #0B2028 100%)',
        'ocean-radial':
          'radial-gradient(ellipse at 50% 0%, #0B2028 0%, #02070B 70%)',
        'accent-glow':
          'radial-gradient(ellipse at center, rgba(0,184,217,0.15) 0%, transparent 70%)',
        'gold-shimmer':
          'linear-gradient(90deg, transparent, rgba(199,167,108,0.4), transparent)',
      },
      boxShadow: {
        'ocean-lg': '0 25px 80px rgba(0,0,0,0.8)',
        'ocean-sm': '0 8px 30px rgba(0,0,0,0.5)',
        'accent-glow': '0 0 40px rgba(0,184,217,0.3)',
        'gold-glow': '0 0 30px rgba(199,167,108,0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
