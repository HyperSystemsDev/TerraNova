/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // TerraNova earth/terrain theme
        tn: {
          bg: "#1c1a17",
          "bg-secondary": "#242119",
          "bg-tertiary": "#2e2a24",
          surface: "#262320",
          panel: "#312d28",
          border: "#4a4438",
          text: "#e8e2d9",
          "text-muted": "#9a9082",
          "text-secondary": "#c4baa8",
          accent: "#b5924c",
          "accent-secondary": "#6b8f5e",
          highlight: "#7a9e68",
        },
        // Node category colors (earth-toned)
        node: {
          material: "#C87D3A",
          density: "#5B8DBF",
          position: "#6B9E5A",
          direction: "#B8648B",
          scanner: "#5AACA6",
          curve: "#A67EB8",
          pattern: "#D4A843",
          math: "#8C8878",
        },
      },
    },
  },
  plugins: [],
};
