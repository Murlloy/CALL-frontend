"use client";

import { Logo } from "./Logo";
import { ConnectionStatus } from "./ConnectionStatus";
import type { ConnectionStatus as Status } from "@/hooks/useWebRTC";

export function RoomHeader({
  roomCode,
  status,
  onCopyInvite,
}: {
  roomCode: string;
  status: Status;
  onCopyInvite: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3.5">
      <Logo size="sm" />
      <div className="flex items-center gap-4">
        <ConnectionStatus status={status} />
        <button
          type="button"
          onClick={onCopyInvite}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs tracking-[0.15em] text-ink-primary transition-colors hover:border-signal/40"
        >
          {roomCode}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
