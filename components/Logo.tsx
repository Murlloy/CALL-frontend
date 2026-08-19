export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" }[size];
  const dotSize = { sm: "h-1.5 w-1.5", md: "h-2 w-2", lg: "h-2.5 w-2.5" }[size];

  return (
    <div className="inline-flex items-center gap-2 select-none">
      <span className={`relative flex ${dotSize}`}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
        <span className="relative inline-flex h-full w-full rounded-full bg-signal" />
      </span>
      <span className={`font-display font-semibold tracking-tight ${textSize}`}>
        CALL
      </span>
    </div>
  );
}
