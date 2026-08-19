"use client";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Paleta determinística a partir do nome, para cada participante ter uma cor
// estável — cada cor já vem pareada com o tom de texto de melhor contraste,
// já que a mesma paleta precisa funcionar tanto no tema claro quanto no escuro.
const PALETTE: Array<{ bg: string; text: string }> = [
  { bg: "#0EA5A0", text: "#ffffff" },
  { bg: "#3E7BFA", text: "#ffffff" },
  { bg: "#E0A72E", text: "#1A1300" },
  { bg: "#9B6BF2", text: "#ffffff" },
  { bg: "#F0648A", text: "#ffffff" },
];
function colorFor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function ParticipantAvatar({
  name,
  size = 96,
  audioLevel = 0,
  muted = false,
}: {
  name: string;
  size?: number;
  audioLevel?: number;
  muted?: boolean;
}) {
  const { bg, text } = colorFor(name || "?");
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <span
        className="absolute inset-0 rounded-full transition-transform duration-150 ease-out"
        style={{
          backgroundColor: `${bg}33`,
          transform: `scale(${1 + Math.min(audioLevel, 1) * 0.45})`,
          opacity: audioLevel > 0.04 ? 1 : 0,
        }}
      />
      <div
        className="relative flex items-center justify-center rounded-full font-display text-xl font-semibold"
        style={{ width: size * 0.72, height: size * 0.72, backgroundColor: bg, color: text }}
      >
        {initials(name) || "?"}
      </div>
      {muted ? (
        <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-void bg-coral text-white">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
            <path d="M19 11a7 7 0 0 1-14 0" />
            <path d="M4 4l16 16" strokeLinecap="round" />
          </svg>
        </span>
      ) : null}
    </div>
  );
}
