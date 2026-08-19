"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useToast, ToastStack } from "@/components/Toast";
import { RoomHeader } from "@/components/RoomHeader";
import { CallInterface } from "@/components/CallInterface";
import { ControlBar } from "@/components/ControlBar";
import { ParticipantList } from "@/components/ParticipantList";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CreateRoom } from "@/components/CreateRoom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { isScreenShareSupported } from "@/services/webrtc";

const FRIENDLY_ERRORS: Record<string, string> = {
  ROOM_NOT_FOUND: "Essa sala não existe ou já foi encerrada.",
  ROOM_FULL: "Essa sala já está cheia.",
  INVALID_CODE: "Código de sala inválido.",
  INVALID_NAME: "Nome inválido.",
  SERVER_ERROR: "Não foi possível conectar ao servidor. Tente novamente.",
  MIC_BLOCKED: "O acesso ao microfone foi bloqueado. Permita o acesso nas configurações do navegador para conversar.",
};

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const webrtc = useWebRTC();
  const { toasts, showToast } = useToast();

  const rawCode = (params.code ?? "").toString();
  const isCreateFlow = rawCode.toLowerCase() === "criar";
  const codeFromUrl = isCreateFlow ? "" : rawCode.toUpperCase();
  const nameFromQuery = searchParams.get("nome");

  const [showParticipants, setShowParticipants] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const startedRef = useRef(false);
  const urlUpdatedRef = useRef(false);
  const screenShareSupported = isScreenShareSupported();

  // Inicia a criação/entrada automaticamente quando o nome já veio pela URL
  // (ex: clicou em "Criar uma sala" na home, ou recebeu um link com nome salvo).
  useEffect(() => {
    if (startedRef.current) return;
    if (!nameFromQuery) return;
    startedRef.current = true;
    if (isCreateFlow) {
      webrtc.createRoom(nameFromQuery);
    } else if (codeFromUrl) {
      webrtc.joinRoom(nameFromQuery, codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFromQuery, isCreateFlow, codeFromUrl]);

  // Depois que a sala é criada, limpa a URL para /sala/CODIGO (sem "criar" nem query).
  useEffect(() => {
    if (isCreateFlow && webrtc.roomCode && !urlUpdatedRef.current) {
      urlUpdatedRef.current = true;
      router.replace(`/sala/${webrtc.roomCode}`);
    }
  }, [isCreateFlow, webrtc.roomCode, router]);

  useEffect(() => {
    if (webrtc.error?.code === "MIC_BLOCKED") {
      showToast(webrtc.error.message, "error");
      webrtc.clearError();
    }
  }, [webrtc.error, showToast, webrtc]);

  function handleStartFromLink(name: string) {
    startedRef.current = true;
    webrtc.joinRoom(name, codeFromUrl);
  }

  function handleCopyInvite() {
    const link = `${window.location.origin}/sala/${webrtc.roomCode}`;
    navigator.clipboard
      .writeText(link)
      .then(() => showToast("Link copiado!", "success"))
      .catch(() => showToast("Não foi possível copiar o link.", "error"));
  }

  function confirmLeave() {
    setShowLeaveConfirm(false);
    webrtc.leaveRoom();
    router.push("/");
  }

  // --- Estados de erro fatal (sala não encontrada, cheia, código inválido) ---
  if (webrtc.error && webrtc.phase === "idle" && webrtc.error.code !== "MIC_BLOCKED") {
    return (
      <ErrorScreen message={FRIENDLY_ERRORS[webrtc.error.code] ?? webrtc.error.message} />
    );
  }

  // --- Pedir nome para quem chegou direto por um link compartilhado ---
  if (!nameFromQuery && webrtc.phase === "idle" && !isCreateFlow) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="mb-10">
          <Logo size="lg" />
        </div>
        <CreateRoom
          title={`Você foi convidado para a sala ${codeFromUrl}`}
          submitLabel="Entrar na sala"
          onSubmit={handleStartFromLink}
        />
      </main>
    );
  }

  // --- Conectando ---
  if (webrtc.phase !== "in-call" || !webrtc.roomCode) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-12">
        <Logo size="lg" />
        <div className="mt-6 flex items-center gap-3 text-ink-secondary">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-signal border-t-transparent" />
          {isCreateFlow ? "Criando sala…" : "Entrando na sala…"}
        </div>
      </main>
    );
  }

  // --- Chamada em andamento ---
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <ToastStack toasts={toasts} />
      <RoomHeader roomCode={webrtc.roomCode} status={webrtc.connectionStatus} onCopyInvite={handleCopyInvite} />

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 p-4 sm:p-6">
          {webrtc.participants.length === 0 ? (
            <InviteBanner roomCode={webrtc.roomCode} onCopy={handleCopyInvite} />
          ) : null}
          <CallInterface
            selfName={webrtc.selfName}
            micEnabled={webrtc.micEnabled}
            localAudioLevel={webrtc.localAudioLevel}
            participants={webrtc.participants}
            remoteStreams={webrtc.remoteStreams}
            sharingPeerId={webrtc.sharingPeerId}
            localScreenStream={webrtc.localScreenStream}
          />
        </div>

        {showParticipants ? (
          <ParticipantList
            self={{ name: webrtc.selfName, micEnabled: webrtc.micEnabled, sharing: webrtc.isSharingScreen }}
            participants={webrtc.participants}
            onClose={() => setShowParticipants(false)}
          />
        ) : null}
      </div>

      <div className="flex justify-center pb-6 pt-2">
        <ControlBar
          micEnabled={webrtc.micEnabled}
          isSharingScreen={webrtc.isSharingScreen}
          screenShareSupported={screenShareSupported}
          participantsCount={webrtc.participants.length}
          showParticipants={showParticipants}
          audioLevel={webrtc.localAudioLevel}
          onToggleMic={webrtc.toggleMic}
          onToggleShare={webrtc.toggleScreenShare}
          onToggleParticipants={() => setShowParticipants((v) => !v)}
          onLeave={() => setShowLeaveConfirm(true)}
        />
      </div>

      {showLeaveConfirm ? (
        <ConfirmModal
          title="Deseja sair da sala?"
          description="Você será desconectado da chamada e retornará à tela inicial."
          confirmLabel="Sair"
          onConfirm={confirmLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      ) : null}
    </main>
  );
}

function InviteBanner({ roomCode, onCopy }: { roomCode: string; onCopy: () => void }) {
  return (
    <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-surface/95 px-4 py-2.5 shadow-soft backdrop-blur">
      <span className="text-sm text-ink-secondary">
        Compartilhe o código <span className="font-mono font-medium text-ink-primary">{roomCode}</span> para convidar alguém
      </span>
      <button onClick={onCopy} className="text-xs font-medium text-signal hover:text-signal-strong">
        Copiar convite
      </button>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <Logo size="lg" />
      <p className="max-w-sm text-sm text-ink-secondary">{message}</p>
      <Link href="/">
        <Button variant="secondary">Voltar para o início</Button>
      </Link>
    </main>
  );
}
