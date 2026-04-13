import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#f6f4ef",
        gold: "#b08a4a",
        sage: "#d9e5dc",
        clay: "#c7b29a",
      },
      boxShadow: {
        panel: "0 24px 60px rgba(17, 24, 39, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
