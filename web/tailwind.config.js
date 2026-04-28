import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    base: true,
    // List built-in themes you want to include
    themes: ["light", "dark", "cupcake", "retro"],
  },
};
