import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CALL — converse agora, sem cadastro",
  description:
    "Crie uma sala, compartilhe o código e converse por áudio e tela em segundos. Sem login, sem senha, sem instalação.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FCFF" },
    { media: "(prefers-color-scheme: dark)", color: "#07080D" },
  ],
};

// Aplica a classe de tema (claro/escuro) antes da primeira pintura, para
// evitar qualquer "flash" de tema errado. Não interfere em nenhuma lógica
// de sala/WebRTC — só decide light/dark antes do React montar.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("call-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Fontes carregadas em runtime (evita depender de acesso à rede no build). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-void font-body text-ink-primary antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
