import type { Config } from "tailwindcss";

// Design tokens do CALL — ver README.md > Design System.
// Todas as cores são lidas de variáveis CSS (definidas em app/globals.css),
// o que permite os temas claro ("céu") e escuro ("noite") usarem exatamente
// os mesmos componentes e classes, apenas trocando os valores por trás.
function withOpacity(variable: string) {
  return ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue !== undefined
      ? `rgb(var(${variable}) / ${opacityValue})`
      : `rgb(var(${variable}))`;
}

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: withOpacity("--color-bg"), // fundo base do app
        surface: withOpacity("--color-surface"), // cartões, painéis, inputs
        "surface-raised": withOpacity("--color-surface-raised"), // hover / elevado
        border: withOpacity("--color-border"),
        "border-subtle": withOpacity("--color-border-subtle"),
        ink: {
          primary: withOpacity("--color-ink-primary"),
          secondary: withOpacity("--color-ink-secondary"),
          muted: withOpacity("--color-ink-muted"),
        },
        signal: {
          DEFAULT: withOpacity("--color-signal"), // acento principal — "sinal ao vivo"
          strong: withOpacity("--color-signal-strong"),
          dim: withOpacity("--color-signal-dim"),
        },
        coral: {
          DEFAULT: withOpacity("--color-coral"), // encerrar / microfone desligado
          strong: withOpacity("--color-coral-strong"),
          dim: withOpacity("--color-coral-dim"),
        },
        amber: {
          DEFAULT: withOpacity("--color-amber"), // conectando / atenção
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
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
        soft: "0 8px 30px -12px rgb(var(--color-shadow) / 0.45)",
        ring: "0 0 0 4px rgb(var(--color-signal) / 0.15)",
        glow: "0 0 40px -8px rgb(var(--color-signal) / 0.35)",
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
        "drift-a": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(3%, -4%) scale(1.06)" },
        },
        "drift-b": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-4%, 3%) scale(1.04)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-up": "fade-up 0.35s ease-out",
        "slide-in": "slide-in 0.25s ease-out",
        "drift-a": "drift-a 18s ease-in-out infinite",
        "drift-b": "drift-b 22s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
