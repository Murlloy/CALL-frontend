"use client";

import type { ParticipantInfo } from "@/lib/protocol";

interface ParticipantListProps {
  self: { name: string; micEnabled: boolean; sharing: boolean };
  participants: ParticipantInfo[];
  onClose: () => void;
}

function Row({ name, micEnabled, sharing, you }: { name: string; micEnabled: boolean; sharing: boolean; you?: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-surface-raised">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span className="h-2 w-2 rounded-full bg-signal" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-ink-primary">
            {name} {you ? <span className="text-ink-muted">(você)</span> : null}
          </span>
          {sharing ? <span className="text-xs text-signal">Compartilhando tela</span> : null}
        </div>
      </div>
      <MicBadge enabled={micEnabled} />
    </li>
  );
}

function MicBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={enabled ? "text-ink-muted" : "text-coral"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
        <path d="M19 11a7 7 0 0 1-14 0" />
        <path d="M12 18v3" />
        {!enabled ? <path d="M4 4l16 16" strokeLinecap="round" /> : null}
      </svg>
    </span>
  );
}

export function ParticipantList({ self, participants, onClose }: ParticipantListProps) {
  return (
    <aside className="animate-slide-in flex h-full w-full max-w-xs flex-col border-l border-border bg-surface/95 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4">
        <h2 className="text-sm font-semibold text-ink-primary">
          Participantes <span className="text-ink-muted">({participants.length + 1})</span>
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel de participantes"
          className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-raised hover:text-ink-primary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto px-2 py-2">
        <Row name={self.name} micEnabled={self.micEnabled} sharing={self.sharing} you />
        {participants.map((p) => (
          <Row key={p.id} name={p.name} micEnabled={p.micEnabled} sharing={p.sharing} />
        ))}
      </ul>
    </aside>
  );
}
