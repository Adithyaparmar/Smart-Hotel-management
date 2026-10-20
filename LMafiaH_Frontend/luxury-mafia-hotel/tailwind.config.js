/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0A08',
        graphite: '#14120F',
        walnut: '#241B14',
        espresso: '#1A1410',
        ivory: '#EDE6D6',
        gold: {
          DEFAULT: '#C6A664',
          soft: '#D8C08F',
          brass: '#9F8146',
        },
        burgundy: {
          DEFAULT: '#6E1F2A',
          deep: '#4E151D',
        },
        signal: {
          DEFAULT: '#4FD8E0',
          dim: '#2A6E73',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.35em',
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(198,166,100,0.25)',
        lift: '0 30px 60px -20px rgba(0,0,0,0.6)',
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
