/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🔵 Primary (buttons, highlights)
        primary: {
          DEFAULT: "#2563EB", // blue button
          hover: "#1D4ED8",
          light: "#EFF6FF",
        },

        // ⚫ Text colors
        text: {
          primary: "#111827",   // main headings
          secondary: "#6B7280", // subtitles
          muted: "#9CA3AF",     // labels
        },

        // ⚪ Backgrounds
        background: {
          DEFAULT: "#F9FAFB",
          card: "#FFFFFF",
          sidebar: "#F3F4F6",
        },

        // 🧱 Borders / dividers
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
        },

        // 🟢 Status / tags
        success: {
          DEFAULT: "#22C55E",
          light:   "#F0FDF4",
          text:    "#15803D",
        },
        warning: "#F59E0B",
        danger: {
          DEFAULT: "#EF4444",
          light:   "#FEF2F2",
        },

        // 🌑 Sidebar (dark panel)
        sidebar: {
          bg:     "#1a1f2e",
          item:   "#9CA3AF",
          hover:  "#1F2537",
          active: "#2d3548",
        },

        // 🐶 Tag colors (like allergies)
        tag: {
          red: "#FEE2E2",
          redText: "#991B1B",
          gray: "#E5E7EB",
          grayText: "#374151",
        },

        // 👥 Per-groomer schedule colors
        groomer: {
          rose:         "#FFE4E6",
          roseText:     "#9F1239",
          roseBorder:   "#FECDD3",
          amber:        "#FEF3C7",
          amberText:    "#92400E",
          amberBorder:  "#FDE68A",
          emerald:      "#D1FAE5",
          emeraldText:  "#065F46",
          emeraldBorder:"#A7F3D0",
          sky:          "#E0F2FE",
          skyText:      "#075985",
          skyBorder:    "#BAE6FD",
          violet:       "#EDE9FE",
          violetText:   "#5B21B6",
          violetBorder: "#C4B5FD",
          fuchsia:      "#FCE7F3",
          fuchsiaText:  "#9D174D",
          fuchsiaBorder:"#F9A8D4",
          cyan:         "#CFFAFE",
          cyanText:     "#155E75",
          cyanBorder:   "#A5F3FC",
          lime:         "#ECFCCB",
          limeText:     "#3F6212",
          limeBorder:   "#D9F99D",
          // Solid swatches for the picker UI.
          roseSolid:    "#F43F5E",
          amberSolid:   "#F59E0B",
          emeraldSolid: "#10B981",
          skySolid:     "#0EA5E9",
          violetSolid:  "#8B5CF6",
          fuchsiaSolid: "#D946EF",
          cyanSolid:    "#06B6D4",
          limeSolid:    "#84CC16",
        },

        // 🐾 Temperament colors
        temperament: {
          friendly:    "#DCFCE7",
          friendlyText:"#15803D",
          calm:        "#DBEAFE",
          calmText:    "#1D4ED8",
          energetic:   "#FEF3C7",
          energeticText:"#B45309",
          nervous:     "#FFEDD5",
          nervousText: "#C2410C",
          aggressive:  "#FEE2E2",
          aggressiveText:"#991B1B",
          independent: "#F3E8FF",
          independentText:"#7E22CE",
        },

        // 🔘 UI elements
        ui: {
          hover: "#F3F4F6",
          active: "#E5E7EB",
        },
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },

      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
        soft: "0 4px 12px rgba(0,0,0,0.05)",
      },

      fontSize: {
        title: ["28px", { lineHeight: "36px", fontWeight: "600" }],
        subtitle: ["18px", { lineHeight: "28px", fontWeight: "500" }],
      },
    },
  },
  safelist: [
    { pattern: /^bg-temperament-/ },
    { pattern: /^text-temperament-/ },
    { pattern: /^bg-groomer-/ },
    { pattern: /^text-groomer-/ },
    { pattern: /^border-groomer-/ },
  ],
  plugins: [],
};