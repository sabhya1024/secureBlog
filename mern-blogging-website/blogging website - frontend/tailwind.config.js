/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        
        colors: {
            'white': '#F4F4F9',
            'black': '#2B2D42',
            'grey': '#E5E7EB',
            'dark-grey': '#4A4E69',
            'red': '#D90429',
            'transparent': 'transparent',
            'twitter': '#1DA1F2',
            'purple': '#8B46FF'
        },

        fontSize: {
            'sm': '12px',
            'base': '14px',
            'xl': '16px',
            '2xl': '20px',
            '3xl': '28px',
            '4xl': '38px',
            '5xl': '50px',
        },

        extend: {
            fontFamily: {
              inter: ["'Inter'", "sans-serif"],
              gelasio: ["'Gelasio'", "serif"],
              mono: ["'Fira Code'", "monospace"]
            },
        },

    },
    plugins: [],
};