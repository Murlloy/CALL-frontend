import type { Config } from "tailwindcss";

// Design tokens do CALL — ver README.md > Design System para a justificativa
// de cada escolha (paleta, tipografia, camadas de superfície).
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0D12", // fundo base do app
        surface: "#12161E", // cartões, painéis
        "surface-raised": "#1B212C", // elementos elevados (modais, hover)
        border: "#262D3A",
        "border-subtle": "#1C222D",
        ink: {
          primary: "#EDEFF3",
          secondary: "#9099AC",
          muted: "#5C6577",
        },
        signal: {
          DEFAULT: "#00D9B5", // acento principal — "sinal ao vivo"
          strong: "#2CF0CB",
          dim: "#0A5A4C",
        },
        coral: {
          DEFAULT: "#FF5C72", // encerrar / microfone desligado
          strong: "#FF7A8C",
          dim: "#4A1520",
        },
        amber: {
          DEFAULT: "#FFB454", // conectando / atenção
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(0,0,0,0.5)",
        ring: "0 0 0 4px rgba(0,217,181,0.15)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.4)", opacity: "0" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-up": "fade-up 0.35s ease-out",
        "slide-in": "slide-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
