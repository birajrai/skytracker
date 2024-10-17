/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',  // Tailwind will scan these files for class names
  ],
  theme: {
    extend: {
      colors: {
        'skyblock-dark': '#1b1b1b',    // Dark background theme
        'skyblock-light': '#2c2c2c',   // Light background or input fields
        'skyblock-gold': '#ffd700',    // Gold accent color for headings/buttons
      },
    },
  },
  plugins: [],
}
