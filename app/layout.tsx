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
  themeColor: "#0A0D12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Fontes carregadas em runtime (evita depender de acesso à rede no build). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-void font-body text-ink-primary antialiased">
        {children}
      </body>
    </html>
  );
}
