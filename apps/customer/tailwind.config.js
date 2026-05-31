const { mobileUiContentPaths } = require("../../packages/mobile-ui/tailwind.content");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
    ...mobileUiContentPaths(__dirname),
  ],
  presets: [require("nativewind/preset"), require("../../packages/mobile-ui/tailwind.preset.js")],
  theme: {
    extend: {},
  },
  plugins: [],
};
