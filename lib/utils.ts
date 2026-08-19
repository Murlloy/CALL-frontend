export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * URL do servidor de sinalização (WebSocket). Configurada via variável de
 * ambiente para permitir hospedar o backend separadamente do frontend
 * (ver README.md > Deploy).
 */
export function getSignalingUrl(): string {
  const url = process.env.NEXT_PUBLIC_SIGNALING_SERVER;
  if (!url) {
    // Fallback para desenvolvimento local.
    return "ws://localhost:8080";
  }
  return url;
}

export const MAX_NAME_LENGTH = 24;

export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH;
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.trim().toUpperCase());
}
