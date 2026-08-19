import type { ConnectionStatus as Status } from "@/hooks/useWebRTC";

const CONFIG: Record<Status, { label: string; dot: string; text: string }> = {
  connected: { label: "Conectado", dot: "bg-signal", text: "text-ink-secondary" },
  connecting: { label: "Conectando…", dot: "bg-amber animate-pulse", text: "text-ink-secondary" },
  disconnected: { label: "Conexão perdida", dot: "bg-coral animate-pulse", text: "text-coral" },
};

export function ConnectionStatus({ status }: { status: Status }) {
  const config = CONFIG[status];
  return (
    <div className={`inline-flex items-center gap-2 text-xs font-medium ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}
