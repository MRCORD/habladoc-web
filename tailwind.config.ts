/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0066CC',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        inputText: 'var(--input-text)',
      },
    },
  },
  plugins: [],
};