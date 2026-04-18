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

        // 🐾 Temperament colors
        temperament: {
          friendly:    "#DCFCE7",
          friendlyText:"#15803D",
          calm:        "#DBEAFE",
          calmText:    "#1D4ED8",
          energetic:   "#FEF3C7",
          energeticText:"#B45309",
          nervous:     "#FEF9C3",
          nervousText: "#854D0E",
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
  ],
  plugins: [],
};