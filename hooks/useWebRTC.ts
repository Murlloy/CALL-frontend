"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SignalingClient } from "@/services/signaling";
import {
  createPeerConnection,
  getMicrophoneStream,
  getScreenStream,
  createAudioLevelMeter,
} from "@/services/webrtc";
import type { ParticipantInfo, ServerMessage } from "@/lib/protocol";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
export type CallPhase = "idle" | "connecting" | "in-call";

export interface CallError {
  code: string;
  message: string;
}

interface PeerEntry {
  connection: RTCPeerConnection;
  pendingCandidates: RTCIceCandidateInit[];
  remoteDescriptionSet: boolean;
}

export interface UseWebRTCResult {
  phase: CallPhase;
  selfId: string | null;
  selfName: string;
  roomCode: string | null;
  participants: ParticipantInfo[];
  remoteStreams: Map<string, MediaStream>;
  connectionStatus: ConnectionStatus;
  micEnabled: boolean;
  isSharingScreen: boolean;
  sharingPeerId: string | null; // "self" ou o id do participante que está compartilhando
  localScreenStream: MediaStream | null;
  localAudioLevel: number;
  error: CallError | null;
  createRoom: (name: string) => Promise<string>;
  joinRoom: (name: string, roomCode: string) => Promise<void>;
  leaveRoom: () => void;
  toggleMic: () => void;
  toggleScreenShare: () => Promise<void>;
  clearError: () => void;
}

export function useWebRTC(): UseWebRTCResult {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [selfId, setSelfId] = useState<string | null>(null);
  const [selfName, setSelfName] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [micEnabled, setMicEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [sharingPeerId, setSharingPeerId] = useState<string | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [error, setError] = useState<CallError | null>(null);

  const signalingRef = useRef<SignalingClient | null>(null);
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioMeterCleanupRef = useRef<() => void>(() => undefined);
  const selfIdRef = useRef<string | null>(null);

  const getSignaling = useCallback(() => {
    if (!signalingRef.current) signalingRef.current = new SignalingClient();
    return signalingRef.current;
  }, []);

  const upsertRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.set(peerId, stream);
      return next;
    });
  }, []);

  const removeRemoteStream = useCallback((peerId: string) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

  const closePeer = useCallback(
    (peerId: string) => {
      const entry = peersRef.current.get(peerId);
      if (entry) {
        entry.connection.close();
        peersRef.current.delete(peerId);
      }
      removeRemoteStream(peerId);
    },
    [removeRemoteStream]
  );

  const attachLocalTracks = useCallback((connection: RTCPeerConnection) => {
    // `attachLocalTracks` é chamada em dois momentos legítimos e distintos:
    // (1) na criação do peer (createPeer) e (2) a cada renegociação disparada
    // por toggleScreenShare/stopScreenShare (renegotiateAll). Nos dois casos
    // o objetivo é o mesmo: "garantir que esta conexão tenha todas as tracks
    // locais atuais anexadas" — ou seja, a função precisa ser idempotente.
    //
    // Sem essa checagem, a 2ª chamada (renegociação) tentava reanexar a
    // MESMA track de áudio do microfone que já havia sido adicionada na
    // criação do peer, e o navegador rejeita com:
    //   InvalidAccessError: A sender already exists for the track.
    //
    // A checagem é feita por conexão (via connection.getSenders()), e não
    // por uma flag global, porque a mesma MediaStreamTrack pode — e deve —
    // ser adicionada a várias RTCPeerConnections diferentes quando há mais
    // de um participante na sala.
    const existingTracks = new Set(
      connection
        .getSenders()
        .map((sender) => sender.track)
        .filter((track): track is MediaStreamTrack => track !== null)
    );

    localStreamRef.current?.getTracks().forEach((track) => {
      if (!existingTracks.has(track)) {
        connection.addTrack(track, localStreamRef.current as MediaStream);
      }
    });
    screenStreamRef.current?.getTracks().forEach((track) => {
      if (!existingTracks.has(track)) {
        connection.addTrack(track, screenStreamRef.current as MediaStream);
      }
    });
  }, []);

  const createPeer = useCallback(
    (peerId: string, isInitiator: boolean) => {
      const connection = createPeerConnection();
      const entry: PeerEntry = { connection, pendingCandidates: [], remoteDescriptionSet: false };
      peersRef.current.set(peerId, entry);

      attachLocalTracks(connection);

      const remoteStream = new MediaStream();
      connection.ontrack = (event) => {
        const track = event.track;

        // Cada participante compartilha no máximo uma tela por vez, mas
        // cada ciclo de "compartilhar" gera uma MediaStreamTrack NOVA
        // (getDisplayMedia() sempre retorna uma track diferente). Se a
        // track de vídeo anterior (de um compartilhamento já encerrado)
        // continuar dentro do remoteStream, ele passa a ter duas tracks de
        // vídeo — e o elemento <video> não troca automaticamente para a
        // nova, podendo continuar exibindo o frame congelado da antiga.
        // Por isso removemos qualquer track de vídeo anterior antes de
        // anexar a nova.
        if (track.kind === "video") {
          remoteStream.getVideoTracks().forEach((oldTrack) => {
            if (oldTrack !== track) remoteStream.removeTrack(oldTrack);
          });
        }

        remoteStream.addTrack(track);
        upsertRemoteStream(peerId, remoteStream);

        // Limpeza defensiva: se a track for encerrada pelo lado remoto
        // (ex: conexão caiu no meio do compartilhamento), removemos do
        // stream em vez de deixar uma track "morta" para trás.
        track.addEventListener("ended", () => {
          remoteStream.removeTrack(track);
          upsertRemoteStream(peerId, remoteStream);
        });
      };

      connection.onicecandidate = (event) => {
        if (event.candidate) {
          getSignaling().send({
            type: "signal",
            to: peerId,
            kind: "ice-candidate",
            data: event.candidate.toJSON(),
          });
        }
      };

      connection.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(connection.connectionState)) {
          // A limpeza definitiva acontece via evento "peer-left" do servidor;
          // aqui apenas registramos para possível retry futuro.
        }
      };

      if (isInitiator) {
        connection
          .createOffer()
          .then((offer) => connection.setLocalDescription(offer))
          .then(() => {
            if (connection.localDescription) {
              getSignaling().send({
                type: "signal",
                to: peerId,
                kind: "offer",
                data: connection.localDescription.toJSON(),
              });
            }
          })
          .catch(() => setError({ code: "SERVER_ERROR", message: "Falha ao iniciar conexão." }));
      }

      return entry;
    },
    [attachLocalTracks, getSignaling, upsertRemoteStream]
  );

  const renegotiateAll = useCallback(() => {
    peersRef.current.forEach((entry, peerId) => {
      attachLocalTracks(entry.connection);
      entry.connection
        .createOffer()
        .then((offer) => entry.connection.setLocalDescription(offer))
        .then(() => {
          if (entry.connection.localDescription) {
            getSignaling().send({
              type: "signal",
              to: peerId,
              kind: "offer",
              data: entry.connection.localDescription.toJSON(),
            });
          }
        })
        .catch(() => undefined);
    });
  }, [attachLocalTracks, getSignaling]);

  const handleServerMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "room-created": {
          selfIdRef.current = message.selfId;
          setSelfId(message.selfId);
          setRoomCode(message.roomCode);
          setPhase("in-call");
          break;
        }

        case "room-joined": {
          selfIdRef.current = message.selfId;
          setSelfId(message.selfId);
          setRoomCode(message.roomCode);
          setParticipants(message.participants);
          const sharer = message.participants.find((p) => p.sharing);
          if (sharer) setSharingPeerId(sharer.id);
          setPhase("in-call");
          message.participants.forEach((peer) => createPeer(peer.id, true));
          break;
        }

        case "peer-joined": {
          setParticipants((prev) => [...prev, message.peer]);
          createPeer(message.peer.id, false);
          break;
        }

        case "peer-left": {
          setParticipants((prev) => prev.filter((p) => p.id !== message.peerId));
          closePeer(message.peerId);
          setSharingPeerId((current) => (current === message.peerId ? null : current));
          break;
        }

        case "signal": {
          const entry = peersRef.current.get(message.from) ?? createPeer(message.from, false);
          const { connection } = entry;

          if (message.kind === "offer") {
            connection
              .setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit))
              .then(() => {
                entry.remoteDescriptionSet = true;
                entry.pendingCandidates.forEach((c) => connection.addIceCandidate(new RTCIceCandidate(c)));
                entry.pendingCandidates = [];
                return connection.createAnswer();
              })
              .then((answer) => connection.setLocalDescription(answer))
              .then(() => {
                if (connection.localDescription) {
                  getSignaling().send({
                    type: "signal",
                    to: message.from,
                    kind: "answer",
                    data: connection.localDescription.toJSON(),
                  });
                }
              })
              .catch(() => undefined);
          } else if (message.kind === "answer") {
            connection
              .setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit))
              .then(() => {
                entry.remoteDescriptionSet = true;
                entry.pendingCandidates.forEach((c) => connection.addIceCandidate(new RTCIceCandidate(c)));
                entry.pendingCandidates = [];
              })
              .catch(() => undefined);
          } else if (message.kind === "ice-candidate") {
            const candidate = message.data as RTCIceCandidateInit;
            if (entry.remoteDescriptionSet) {
              connection.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
            } else {
              entry.pendingCandidates.push(candidate);
            }
          }
          break;
        }

        case "peer-mic-state": {
          setParticipants((prev) =>
            prev.map((p) => (p.id === message.peerId ? { ...p, micEnabled: message.enabled } : p))
          );
          break;
        }

        case "peer-screen-state": {
          setParticipants((prev) =>
            prev.map((p) => (p.id === message.peerId ? { ...p, sharing: message.sharing } : p))
          );
          setSharingPeerId((current) => {
            if (message.sharing) return message.peerId;
            return current === message.peerId ? null : current;
          });
          break;
        }

        case "error": {
          setError({ code: message.code, message: message.message });
          if (message.code === "ROOM_NOT_FOUND" || message.code === "ROOM_FULL") {
            setPhase("idle");
          }
          break;
        }

        default:
          break;
      }
    },
    [closePeer, createPeer, getSignaling]
  );

  useEffect(() => {
    const signaling = getSignaling();
    const offMessage = signaling.onMessage(handleServerMessage);
    const offConnection = signaling.onConnectionChange(setConnectionStatus);
    return () => {
      offMessage();
      offConnection();
    };
  }, [getSignaling, handleServerMessage]);

  const ensureMicrophone = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await getMicrophoneStream();
    localStreamRef.current = stream;
    audioMeterCleanupRef.current = createAudioLevelMeter(stream, setLocalAudioLevel);
    return stream;
  }, []);

  const createRoom = useCallback(
    async (name: string) => {
      setError(null);
      setPhase("connecting");
      setSelfName(name);
      try {
        await ensureMicrophone();
      } catch {
        setError({
          code: "MIC_BLOCKED",
          message: "O acesso ao microfone foi bloqueado. Permita o acesso nas configurações do navegador para conversar.",
        });
      }
      const signaling = getSignaling();
      await signaling.connect();
      signaling.send({ type: "create-room", name });

      return new Promise<string>((resolve) => {
        const off = signaling.onMessage((message) => {
          if (message.type === "room-created") {
            off();
            resolve(message.roomCode);
          }
        });
      });
    },
    [ensureMicrophone, getSignaling]
  );

  const joinRoom = useCallback(
    async (name: string, code: string) => {
      setError(null);
      setPhase("connecting");
      setSelfName(name);
      try {
        await ensureMicrophone();
      } catch {
        setError({
          code: "MIC_BLOCKED",
          message: "O acesso ao microfone foi bloqueado. Permita o acesso nas configurações do navegador para conversar.",
        });
      }
      const signaling = getSignaling();
      await signaling.connect();
      signaling.send({ type: "join-room", roomCode: code.trim().toUpperCase(), name });
    },
    [ensureMicrophone, getSignaling]
  );

  const leaveRoom = useCallback(() => {
    const signaling = getSignaling();
    signaling.send({ type: "leave-room" });
    peersRef.current.forEach((entry) => entry.connection.close());
    peersRef.current.clear();
    setRemoteStreams(new Map());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    audioMeterCleanupRef.current();
    signaling.disconnect();
    signalingRef.current = null;
    setPhase("idle");
    setRoomCode(null);
    setSelfId(null);
    setParticipants([]);
    setIsSharingScreen(false);
    setSharingPeerId(null);
    setLocalAudioLevel(0);
  }, [getSignaling]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextEnabled = !micEnabled;
    stream.getAudioTracks().forEach((track) => (track.enabled = nextEnabled));
    setMicEnabled(nextEnabled);
    getSignaling().send({ type: "mic-state", enabled: nextEnabled });
  }, [getSignaling, micEnabled]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setLocalScreenStream(null);
    setIsSharingScreen(false);
    setSharingPeerId((current) => (current === "self" ? null : current));
    // Remove as tracks de tela de cada conexão existente.
    peersRef.current.forEach((entry) => {
      entry.connection.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video") entry.connection.removeTrack(sender);
      });
    });
    renegotiateAll();
    getSignaling().send({ type: "screen-state", sharing: false });
  }, [getSignaling, renegotiateAll]);

  const toggleScreenShare = useCallback(async () => {
    if (isSharingScreen) {
      stopScreenShare();
      return;
    }
    try {
      const stream = await getScreenStream();
      screenStreamRef.current = stream;
      setLocalScreenStream(stream);
      setIsSharingScreen(true);
      setSharingPeerId("self");
      // Se o usuário parar pelo controle nativo do navegador, sincroniza o estado.
      stream.getVideoTracks()[0]?.addEventListener("ended", () => stopScreenShare());
      renegotiateAll();
      getSignaling().send({ type: "screen-state", sharing: true });
    } catch {
      // Usuário cancelou o seletor nativo ou negou a permissão — não é um erro fatal.
    }
  }, [getSignaling, isSharingScreen, renegotiateAll, stopScreenShare]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    return () => {
      audioMeterCleanupRef.current();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((entry) => entry.connection.close());
      signalingRef.current?.disconnect();
    };
  }, []);

  return {
    phase,
    selfId,
    selfName,
    roomCode,
    participants,
    remoteStreams,
    connectionStatus,
    micEnabled,
    isSharingScreen,
    sharingPeerId,
    localScreenStream,
    localAudioLevel,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMic,
    toggleScreenShare,
    clearError,
  };
}
