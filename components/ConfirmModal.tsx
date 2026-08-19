"use client";

import { Button } from "./Button";

interface ConfirmModalProps {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="animate-fade-up w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
        {description ? <p className="mt-2 text-sm text-ink-secondary">{description}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
