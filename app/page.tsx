"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { JoinRoom } from "@/components/JoinRoom";

type View = "landing" | "join";

export default function HomePage() {
  const router = useRouter();
  const [view, setView] = useState<View>("landing");

  function handleCreate(name: string) {
    router.push(`/sala/criar?nome=${encodeURIComponent(name)}`);
  }

  function handleJoin(name: string, code: string) {
    router.push(`/sala/${code}?nome=${encodeURIComponent(name)}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mb-10">
        <Logo size="lg" />
      </div>

      {view === "landing" ? (
        <LandingForm onCreate={handleCreate} onJoin={() => setView("join")} />
      ) : (
        <JoinRoom onSubmit={handleJoin} onBack={() => setView("landing")} />
      )}

      <p className="mt-12 max-w-xs text-center text-xs text-ink-muted">
        Sem cadastro, sem senha. Abra, crie uma sala e converse.
      </p>
    </main>
  );
}

function LandingForm({
  onCreate,
  onJoin,
}: {
  onCreate: (name: string) => void;
  onJoin: () => void;
}) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim();
  const nameError = touched && (trimmed.length === 0 || trimmed.length > 24);

  function submitCreate() {
    setTouched(true);
    if (trimmed.length === 0 || trimmed.length > 24) return;
    onCreate(trimmed);
  }

  return (
    <div className="animate-fade-up flex w-full max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="home-name" className="text-xs font-medium text-ink-secondary">
          Seu nome
        </label>
        <input
          id="home-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder="Digite seu nome"
          className="h-12 rounded-xl border border-border bg-surface px-4 text-[15px] text-ink-primary placeholder:text-ink-muted outline-none transition-colors duration-150 focus:border-signal/60 focus:bg-surface-raised"
          autoFocus
        />
        {nameError ? <span className="text-xs text-coral">Digite um nome para continuar.</span> : null}
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="primary" size="lg" onClick={submitCreate}>
          Criar uma sala
        </Button>
        <Button variant="secondary" size="lg" onClick={onJoin}>
          Entrar em uma sala
        </Button>
      </div>
    </div>
  );
}
