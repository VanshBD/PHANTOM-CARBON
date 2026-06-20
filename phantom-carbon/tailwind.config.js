/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Always include these core layout classes
    'min-h-screen',
    'antialiased',
    'bg-[#0a0e1a]',
    'text-slate-100',
    'dark',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#22c55e',
          light:   '#4ade80',
          dark:    '#16a34a',
        },
        ghost: {
          DEFAULT: '#f97316',
          light:   '#fb923c',
          dark:    '#ea580c',
        },
        phantom: {
          bg:     '#0a0e1a',
          card:   '#111827',
          border: '#1f2937',
          muted:  '#374151',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        sweep:       'sweep 4s linear infinite',
        'dot-pulse': 'dot-pulse 2s ease-in-out infinite',
        'fade-in':   'fadeIn 0.5s ease-out',
        float:       'float 3s ease-in-out infinite',
      },
      keyframes: {
        sweep: {
          '0%':   { transform: 'rotate(0deg)'   },
          '100%': { transform: 'rotate(360deg)' },
        },
        'dot-pulse': {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1'   },
          '50%':      { transform: 'scale(1.4)', opacity: '0.5' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)'   },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
