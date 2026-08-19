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
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

function ScreenVideo({ stream, label }: { stream: MediaStream; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  // O `stream` aqui é o mesmo objeto usado por <RemoteAudio> (para peers
  // remotos ele contém tanto a track de áudio do microfone quanto a de
  // vídeo da tela, já que ambas chegam pela mesma RTCPeerConnection). O
  // áudio já é reproduzido pelo elemento <audio> dedicado; se este <video>
  // também tocasse som, o áudio do participante seria ouvido duas vezes
  // (eco). Por isso o vídeo de tela fica sempre mutado, independentemente
  // de ser a tela local ou a de um peer remoto.
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
      <video ref={ref} autoPlay playsInline muted className="max-h-full max-w-full" />
      <span className="absolute bottom-3 left-3 rounded-lg bg-void/70 px-2.5 py-1 text-xs font-medium text-ink-primary backdrop-blur">
        {label} está compartilhando a tela
      </span>
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
}: CallInterfaceProps) {
  // Reproduz o áudio de todos os participantes remotos (invisível na tela).
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
    const sharerStream = remoteStreams.get(sharingPeerId);
    const sharer = participants.find((p) => p.id === sharingPeerId);
    if (sharerStream) {
      return (
        <div className="flex h-full flex-col gap-4">
          {audioElements}
          <div className="min-h-0 flex-1">
            <ScreenVideo stream={sharerStream} label={sharer?.name ?? "Alguém"} />
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
