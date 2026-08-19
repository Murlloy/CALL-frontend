// Configuração de ICE servers. STUN público do Google para o MVP.
// TODO (futuro): adicionar servidor TURN aqui para redes restritivas
// (ex: { urls: "turn:seu-turn-server", username, credential }).
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection(RTC_CONFIG);
}

export function isScreenShareSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === "function"
  );
}

export async function getMicrophoneStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });
}

export async function getScreenStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
}

/**
 * Cria um AnalyserNode para medir o nível de áudio de uma stream em tempo
 * real. Usado para o anel de pulso reativo ao redor do avatar/microfone
 * (elemento de assinatura visual do CALL).
 */
export function createAudioLevelMeter(
  stream: MediaStream,
  onLevel: (level: number) => void
): () => void {
  if (typeof window === "undefined" || stream.getAudioTracks().length === 0) {
    return () => undefined;
  }
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.6;
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);
  let rafId: number;

  const tick = () => {
    analyser.getByteFrequencyData(data);
    const average = data.reduce((sum, value) => sum + value, 0) / data.length;
    onLevel(Math.min(1, average / 90));
    rafId = requestAnimationFrame(tick);
  };
  tick();

  return () => {
    cancelAnimationFrame(rafId);
    source.disconnect();
    analyser.disconnect();
    audioContext.close().catch(() => undefined);
  };
}
