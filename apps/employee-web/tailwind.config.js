/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Modern dashboard palette - Emerald green theme
        background: {
          DEFAULT: '#F8F8F8', // Light grey page background
          warm: '#F3F4F6', // Slightly darker grey variant
        },
        surface: {
          DEFAULT: '#FFFFFF', // White for cards
          light: '#FAFAFA', // Very light grey for subtle surfaces
          dark: '#E0E0E0', // Light grey for borders/dividers
        },
        // Primary actions - Deep emerald green
        primary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#2E7D32', // Deep emerald green - main primary
          700: '#1b5e20',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        // Success/positive indicators - Brighter green
        success: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4CAF50', // Brighter green for positive indicators
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        // Secondary accents - Neutral grey tones
        secondary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575', // Medium grey for secondary text
          700: '#616161',
          800: '#424242',
          900: '#212121', // Dark grey for primary text
        },
        // Attention/warnings - Amber (kept for consistency)
        warning: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#ffc107',
          600: '#ffb300',
          700: '#ffa000',
          800: '#ff8f00',
          900: '#ff6f00',
        },
        // Status colors (reserved strictly for status)
        status: {
          draft: '#3B82F6', // Blue
          published: '#2E7D32', // Deep emerald green
          locked: '#F59E0B', // Amber
          warning: '#F59E0B', // Amber
          error: '#FF6347', // Soft red/orange
        },
        // Destructive actions (different from error status)
        destructive: {
          DEFAULT: '#FF6347', // Soft red/orange
          hover: '#EF5350', // Slightly darker on hover
        },
      },
    },
  },
  plugins: [],
};
