module.exports = {
  separator: "_",
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      borderWidth: ["first", "last"],
      cursor: ["disabled"],
      pointerEvents: ["disabled"],
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
