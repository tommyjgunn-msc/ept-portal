import type { Config } from "tailwindcss";

export default {
  content: {
    relative: true,
    files: [
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
  },
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Futurimi design tokens (see design_handoff_futurimi_redesign)
        ftm: {
          night: "#12171B", // dark page bg
          card: "#1B2226", // dark card bg
          up: "#20282D", // elevated card / header strip
          bar: "#181F24", // top bar / gradient end
          panel: "#20262B", // login left panel = light-theme ink
          ink: "#F3F0EA", // dark-theme headings
          paper: "#F4F1EC", // light page bg / login panel text
          bodyl: "#4B565D", // light-theme body text
          mutl: "#7C8790", // light-theme muted
          mut: "#7E8B93", // dark-theme body/muted
          dim: "#6E7A82", // dark-theme dimmer
          dim2: "#8B979E",
          link: "#C3CAD0",
          crimson: "#C5132D", // light-theme red
          crimsontint: "#FBE7E9",
          red: "#E0273F", // dark-theme red
          redsoft: "#F09AA6",
          slatel: "#55636C", // light-theme slate
          slateltint: "#EDF0F1",
          slate: "#93A4AE", // dark-theme slate
          green: "#48B27F",
          amber: "#D9A441",
          amberdim: "#C7A466",
          indigo: "#8CA3F0", // Futurimi wordmark "imi"
        },
      },
      fontFamily: {
        grotesk: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        inter: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        redglow: "0 4px 18px rgba(224,39,63,.3)",
      },
    },
  },
  plugins: [],
} satisfies Config;
