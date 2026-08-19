"use client";

import { FormEvent, useState } from "react";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { isValidName, MAX_NAME_LENGTH } from "@/lib/utils";

interface CreateRoomProps {
  title: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function CreateRoom({ title, submitLabel, onSubmit, onBack, isLoading }: CreateRoomProps) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const nameError = touched && !isValidName(name) ? "Digite um nome para continuar." : undefined;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!isValidName(name)) return;
    onSubmit(name.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-up flex w-full max-w-sm flex-col gap-5">
      {title ? <p className="text-sm text-ink-secondary">{title}</p> : null}
      <TextField
        label="Seu nome"
        placeholder="Digite seu nome"
        value={name}
        maxLength={MAX_NAME_LENGTH}
        onChange={(e) => setName(e.target.value)}
        error={nameError}
        autoFocus
      />
      <div className="flex gap-3">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
            Voltar
          </Button>
        ) : null}
        <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
