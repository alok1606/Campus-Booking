/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        ink: { 50: '#f5f3f0', 100: '#e8e4dd', 200: '#d4ccc0', 300: '#b8ab96', 400: '#9a8870', 500: '#7d6a52', 600: '#64523f', 700: '#4d3e30', 800: '#362b21', 900: '#1f1813' },
        sage: { 50: '#f2f5f2', 100: '#dde8de', 200: '#b8d0bb', 300: '#8bb490', 400: '#5d9464', 500: '#3d7844', 600: '#2e5e35', 700: '#22472a', 800: '#17311d', 900: '#0c1c10' },
        amber: { 50: '#fdf8ee', 100: '#f8edd0', 200: '#f0d89a', 300: '#e5be5e', 400: '#d9a02e', 500: '#b88120', 600: '#8f6118', 700: '#6b4811', 800: '#49310b', 900: '#281b06' }
      }
    }
  },
  plugins: []
};
