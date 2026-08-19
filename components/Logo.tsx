export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" }[size];
  const markSize = { sm: 20, md: 24, lg: 34 }[size];

  return (
    <div className="inline-flex select-none items-center gap-2.5">
      <SignalMark size={markSize} />
      <span className={`font-display font-semibold tracking-tight ${textSize}`}>CALL</span>
    </div>
  );
}

// Marca própria: um pulso de sinal emanando em ondas — referência direta e
// literal ao que o produto faz (transmitir voz em tempo real), em vez de um
// ícone genérico de telefone.
function SignalMark({ size }: { size: number }) {
  return (
    <span className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="3.4" className="fill-signal" />
        <path
          d="M9.5 16a6.5 6.5 0 0 1 13 0"
          stroke="currentColor"
          className="text-signal/70"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M5 16a11 11 0 0 1 22 0"
          stroke="currentColor"
          className="text-signal/35"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute h-[10%] w-[10%] animate-ping rounded-full bg-signal opacity-70" />
    </span>
  );
}
