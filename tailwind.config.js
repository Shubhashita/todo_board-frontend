/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Roboto', 'sans-serif'],
            },
            colors: {
                mainColor: '#89216b',
                titleColor: '#555555',
                labelColor: '#333333',
            },
            backgroundImage: {
                'red-gradient': 'linear-gradient(to right, #da4453, #89216b)',
            }
        },
    },
    plugins: [],
}
