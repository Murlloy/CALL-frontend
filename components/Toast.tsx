"use client";

import { useCallback, useState } from "react";

export interface ToastItem {
  id: number;
  message: string;
  tone: "default" | "success" | "error";
}

let nextId = 1;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, tone: ToastItem["tone"] = "default") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return { toasts, showToast };
}

const toneClasses: Record<ToastItem["tone"], string> = {
  default: "border-border bg-surface-raised",
  success: "border-signal/40 bg-surface-raised",
  error: "border-coral/40 bg-surface-raised",
};

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-fade-up pointer-events-auto rounded-xl border px-4 py-2.5 text-sm shadow-soft ${toneClasses[toast.tone]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
