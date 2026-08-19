"use client";

import { cn } from "@/lib/utils";

interface ControlBarProps {
  micEnabled: boolean;
  isSharingScreen: boolean;
  screenShareSupported: boolean;
  participantsCount: number;
  showParticipants: boolean;
  audioLevel: number;
  onToggleMic: () => void;
  onToggleShare: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
}

function ControlButton({
  active,
  danger,
  onClick,
  label,
  children,
  badge,
}: {
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "relative flex h-13 w-13 items-center justify-center rounded-2xl transition-all duration-150 active:scale-95",
        danger
          ? "bg-coral text-void hover:bg-coral-strong"
          : active
          ? "bg-surface-raised text-ink-primary border border-signal/30"
          : "bg-surface-raised text-ink-secondary hover:text-ink-primary border border-transparent hover:border-border"
      )}
      style={{ height: "3.25rem", width: "3.25rem" }}
    >
      {children}
      {typeof badge === "number" && badge > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-signal text-[10px] font-semibold text-void">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function ControlBar({
  micEnabled,
  isSharingScreen,
  screenShareSupported,
  participantsCount,
  showParticipants,
  audioLevel,
  onToggleMic,
  onToggleShare,
  onToggleParticipants,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 shadow-soft backdrop-blur-md">
      <div className="relative">
        {micEnabled ? (
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl bg-signal/30 transition-transform duration-100"
            style={{ transform: `scale(${1 + audioLevel * 0.35})`, opacity: audioLevel > 0.05 ? 0.6 : 0 }}
          />
        ) : null}
        <ControlButton
          active={micEnabled}
          danger={!micEnabled}
          onClick={onToggleMic}
          label={micEnabled ? "Desligar microfone" : "Ligar microfone"}
        >
          <MicIcon muted={!micEnabled} />
        </ControlButton>
      </div>

      {screenShareSupported ? (
        <ControlButton
          active={isSharingScreen}
          onClick={onToggleShare}
          label={isSharingScreen ? "Parar compartilhamento" : "Compartilhar tela"}
        >
          <ScreenIcon active={isSharingScreen} />
        </ControlButton>
      ) : null}

      <ControlButton
        active={showParticipants}
        onClick={onToggleParticipants}
        label="Participantes"
        badge={participantsCount}
      >
        <PeopleIcon />
      </ControlButton>

      <div className="mx-1 h-8 w-px bg-border" />

      <ControlButton danger onClick={onLeave} label="Sair da chamada">
        <LeaveIcon />
      </ControlButton>
    </div>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v3" />
      {muted ? <path d="M4 4l16 16" strokeLinecap="round" /> : null}
    </svg>
  );
}

function ScreenIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
      {active ? <path d="M9 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <path d="M16 4.5c1.7.4 3 2 3 3.9 0 1.9-1.3 3.4-3 3.9" />
      <path d="M22 20c0-2.8-2.2-5.1-5-5.8" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 3l5 5-5 5" />
      <path d="M21 8H10" />
      <path d="M13 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h7" />
    </svg>
  );
}
