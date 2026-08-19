"use client";

import { useEffect, useRef } from "react";
import type { ParticipantInfo } from "@/lib/protocol";
import { ParticipantAvatar } from "./ParticipantAvatar";

interface CallInterfaceProps {
  selfName: string;
  micEnabled: boolean;
  localAudioLevel: number;
  participants: ParticipantInfo[];
  remoteStreams: Map<string, MediaStream>;
  sharingPeerId: string | null;
  localScreenStream: MediaStream | null;
  // Áudio da transmissão de tela (separado do áudio do microfone, que já
  // chega via `remoteStreams` e é tocado pelo <RemoteAudio>).
  remoteScreenStream?: MediaStream | null;
  screenVolume: number;
  onScreenVolumeChange: (value: number) => void;
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

function ScreenVideo({
  stream,
  label,
  hasAudio,
  volume,
  onVolumeChange,
}: {
  stream: MediaStream;
  label: string;
  // Quando `hasAudio` é true, este é o vídeo de uma transmissão remota que
  // possui áudio — o elemento toca esse áudio diretamente (não há
  // <RemoteAudio> separado para ele) e exibe o controle de volume.
  hasAudio?: boolean;
  volume?: number;
  onVolumeChange?: (value: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  useEffect(() => {
    if (ref.current && typeof volume === "number") ref.current.volume = volume;
  }, [volume]);
  // A tela local (a que você está compartilhando) e as telas de outros
  // participantes que não têm áudio permanecem sempre mutadas: para a tela
  // local, para não ecoar o próprio áudio já tocando na sua máquina; para
  // as demais, porque não há áudio de transmissão para tocar. Apenas a
  // tela remota COM áudio tem esse elemento desmutado — o áudio da
  // transmissão só é reproduzido aqui, nunca duplicado em outro elemento.
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-black">
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <video ref={ref} autoPlay playsInline muted={!hasAudio} className="max-h-full max-w-full" />
        <span className="absolute bottom-3 left-3 rounded-lg bg-void/70 px-2.5 py-1 text-xs font-medium text-ink-primary backdrop-blur">
          {label} está compartilhando a tela
        </span>
      </div>
      {hasAudio && typeof volume === "number" && onVolumeChange ? (
        <TransmissionVolumeControl volume={volume} onVolumeChange={onVolumeChange} />
      ) : null}
    </div>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" strokeLinejoin="round" />
      {muted ? (
        <path d="M17 9l5 6M22 9l-5 6" strokeLinecap="round" />
      ) : (
        <path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 6a9 9 0 0 1 0 12" strokeLinecap="round" />
      )}
    </svg>
  );
}

function TransmissionVolumeControl({
  volume,
  onVolumeChange,
}: {
  volume: number;
  onVolumeChange: (value: number) => void;
}) {
  const percent = Math.round(volume * 100);
  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-border bg-surface/90 px-4 py-2.5 backdrop-blur">
      <span className="text-ink-secondary">
        <VolumeIcon muted={volume === 0} />
      </span>
      <span className="hidden shrink-0 text-xs font-medium text-ink-secondary sm:inline">Transmissão</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
        aria-label="Volume da transmissão"
        className="range-slider flex-1"
        style={{ "--range-fill": `${percent}%` } as React.CSSProperties}
      />
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-secondary">{percent}%</span>
    </div>
  );
}

export function CallInterface({
  selfName,
  micEnabled,
  localAudioLevel,
  participants,
  remoteStreams,
  sharingPeerId,
  localScreenStream,
  remoteScreenStream,
  screenVolume,
  onScreenVolumeChange,
}: CallInterfaceProps) {
  // Reproduz o áudio de todos os participantes remotos (invisível na tela).
  // `remoteStreams` agora contém somente áudio de microfone (o áudio da
  // transmissão de tela vive separadamente em `remoteScreenStream` e é
  // tocado pelo próprio <video> da tela, junto com o controle de volume).
  const audioElements = [...remoteStreams.entries()]
    .filter(([, stream]) => stream.getAudioTracks().length > 0)
    .map(([peerId, stream]) => <RemoteAudio key={peerId} stream={stream} />);

  if (sharingPeerId === "self" && localScreenStream) {
    return (
      <div className="flex h-full flex-col gap-4">
        {audioElements}
        <div className="min-h-0 flex-1">
          <ScreenVideo stream={localScreenStream} label="Você" />
        </div>
        <ParticipantStrip selfName={selfName} micEnabled={micEnabled} participants={participants} />
      </div>
    );
  }

  if (sharingPeerId) {
    const sharer = participants.find((p) => p.id === sharingPeerId);
    // A tela em si (vídeo) ainda chega por `remoteStreams` seria incorreto —
    // ela agora vive em `remoteScreenStream`, dedicado a vídeo + áudio da
    // transmissão, mantido fora do fluxo de áudio de microfone.
    if (remoteScreenStream && remoteScreenStream.getVideoTracks().length > 0) {
      const hasAudio = remoteScreenStream.getAudioTracks().length > 0;
      return (
        <div className="flex h-full flex-col gap-4">
          {audioElements}
          <div className="min-h-0 flex-1">
            <ScreenVideo
              stream={remoteScreenStream}
              label={sharer?.name ?? "Alguém"}
              hasAudio={hasAudio}
              volume={screenVolume}
              onVolumeChange={onScreenVolumeChange}
            />
          </div>
          <ParticipantStrip selfName={selfName} micEnabled={micEnabled} participants={participants} />
        </div>
      );
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      {audioElements}
      <div className="grid w-full max-w-3xl grid-cols-2 gap-6 px-6 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-3">
          <ParticipantAvatar name={selfName} size={104} audioLevel={micEnabled ? localAudioLevel : 0} muted={!micEnabled} />
          <span className="text-sm font-medium text-ink-secondary">Você</span>
        </div>
        {participants.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-3">
            <ParticipantAvatar name={p.name} size={104} muted={!p.micEnabled} />
            <span className="text-sm font-medium text-ink-secondary">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantStrip({
  selfName,
  micEnabled,
  participants,
}: {
  selfName: string;
  micEnabled: boolean;
  participants: ParticipantInfo[];
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 overflow-x-auto pb-1">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <ParticipantAvatar name={selfName} size={28} muted={!micEnabled} />
        <span className="text-xs text-ink-secondary">Você</span>
      </div>
      {participants.map((p) => (
        <div key={p.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
          <ParticipantAvatar name={p.name} size={28} muted={!p.micEnabled} />
          <span className="text-xs text-ink-secondary">{p.name}</span>
        </div>
      ))}
    </div>
  );
}
