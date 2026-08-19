"use client";

import { FormEvent, useState } from "react";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { isValidName, isValidRoomCode, MAX_NAME_LENGTH } from "@/lib/utils";

interface JoinRoomProps {
  defaultCode?: string;
  onSubmit: (name: string, code: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function JoinRoom({ defaultCode = "", onSubmit, onBack, isLoading }: JoinRoomProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState(defaultCode);
  const [touched, setTouched] = useState(false);

  const nameError = touched && !isValidName(name) ? "Digite um nome para continuar." : undefined;
  const codeError = touched && !isValidRoomCode(code) ? "O código tem 6 letras ou números." : undefined;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!isValidName(name) || !isValidRoomCode(code)) return;
    onSubmit(name.trim(), code.trim().toUpperCase());
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-up flex w-full max-w-sm flex-col gap-5">
      <TextField
        label="Seu nome"
        placeholder="Digite seu nome"
        value={name}
        maxLength={MAX_NAME_LENGTH}
        onChange={(e) => setName(e.target.value)}
        error={nameError}
        autoFocus
      />
      <TextField
        label="Código da sala"
        placeholder="A7K92F"
        value={code}
        mono
        maxLength={6}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        error={codeError}
      />
      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          Voltar
        </Button>
        <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
          Entrar na sala
        </Button>
      </div>
    </form>
  );
}
