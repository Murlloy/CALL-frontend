"use client";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Paleta determinística a partir do nome, para cada participante ter uma cor estável.
const PALETTE = ["#00D9B5", "#5B8DEF", "#FFB454", "#C084FC", "#FF7A8C"];
function colorFor(name: string): string {
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
  const color = colorFor(name || "?");
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <span
        className="absolute inset-0 rounded-full transition-transform duration-150 ease-out"
        style={{
          backgroundColor: `${color}33`,
          transform: `scale(${1 + Math.min(audioLevel, 1) * 0.45})`,
          opacity: audioLevel > 0.04 ? 1 : 0,
        }}
      />
      <div
        className="relative flex items-center justify-center rounded-full font-display text-xl font-semibold text-void"
        style={{ width: size * 0.72, height: size * 0.72, backgroundColor: color }}
      >
        {initials(name) || "?"}
      </div>
      {muted ? (
        <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-void bg-coral text-void">
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
