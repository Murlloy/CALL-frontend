import type { ClientMessage, ServerMessage } from "@/lib/protocol";
import { getSignalingUrl } from "@/lib/utils";

type Listener = (message: ServerMessage) => void;
type ConnectionListener = (status: "connecting" | "connected" | "disconnected") => void;

/**
 * Wrapper fino sobre o WebSocket nativo. Responsável apenas por transporte
 * (conectar, enviar, receber, reconectar) — a lógica de sala/WebRTC vive nos
 * hooks que consomem este serviço.
 */
export class SignalingClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private connectionListeners = new Set<ConnectionListener>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private lastConnectPromise: Promise<void> | null = null;

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.lastConnectPromise) return this.lastConnectPromise;

    this.shouldReconnect = true;
    this.lastConnectPromise = new Promise((resolve, reject) => {
      this.emitConnection("connecting");
      const ws = new WebSocket(getSignalingUrl());
      this.ws = ws;

      const onOpen = () => {
        this.reconnectAttempts = 0;
        this.emitConnection("connected");
        this.lastConnectPromise = null;
        resolve();
      };
      const onError = () => {
        this.lastConnectPromise = null;
        reject(new Error("Não foi possível conectar ao servidor."));
      };

      ws.addEventListener("open", onOpen, { once: true });
      ws.addEventListener("error", onError, { once: true });

      ws.addEventListener("message", (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(message));
        } catch {
          // Ignora mensagens malformadas.
        }
      });

      ws.addEventListener("close", () => {
        this.emitConnection("disconnected");
        this.ws = null;
        if (this.shouldReconnect) this.scheduleReconnect();
      });
    });

    return this.lastConnectPromise;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 8000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) this.connect().catch(() => undefined);
    }, delay);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  private emitConnection(status: "connecting" | "connected" | "disconnected"): void {
    this.connectionListeners.forEach((listener) => listener(status));
  }
}
