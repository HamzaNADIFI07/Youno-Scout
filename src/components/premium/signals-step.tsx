"use client";

import { ArrowRight, Loader2, MessageCircle, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { CustomSignalCard } from "@/components/premium/custom-signal-card";
import type { CustomSignal } from "@/lib/types";

type Props = {
  signals: CustomSignal[];
  onDelete: (id: string) => void;
  onApplyInstruction: (instruction: string) => Promise<void>;
  onRegenerate: () => Promise<void>;
  onContinue: () => void;
  onBack: () => void;
  isMutating: boolean;
  error: string | null;
};

const PRIMARY_BTN_SHADOW = [
  "inset 0 1.5px 0 rgba(255,255,255,0.55)",
  "inset 0 -1.5px 0 rgba(154,60,30,0.4)",
  "0 4px 8px -2px rgba(206,86,47,0.35)",
  "0 12px 24px -6px rgba(206,86,47,0.5)",
  "0 1px 2px rgba(0,0,0,0.08)",
].join(", ");

export function SignalsStep({
  signals,
  onDelete,
  onApplyInstruction,
  onRegenerate,
  onContinue,
  onBack,
  isMutating,
  error,
}: Props) {
  const [instruction, setInstruction] = useState("");

  const handleSubmit = async () => {
    const trimmed = instruction.trim();
    if (trimmed.length === 0 || isMutating) return;
    await onApplyInstruction(trimmed);
    setInstruction("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Voici les signaux générés pour votre prospection
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {signals.length} signaux — supprimez ceux qui ne vous parlent
              pas, ou ajustez la liste en langage naturel ci-dessous.
            </p>
          </div>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isMutating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className="size-3.5" aria-hidden />
            Régénérer
          </button>
        </div>

        {signals.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Plus aucun signal. Régénérez ou ajoutez-en via le chat.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {signals.map((signal) => (
              <CustomSignalCard
                key={signal.id}
                signal={signal}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-[#ce562f]" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight">
            Modifier la liste en langage naturel
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Exemples : « Retire le signal sur la conformité », « Ajoute un signal
          pour détecter les boîtes qui utilisent Notion », « Remplace les
          signaux de croissance par des signaux d’internationalisation ».
        </p>

        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-background p-1.5 shadow-sm transition-shadow focus-within:shadow-md">
            <input
              type="text"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              disabled={isMutating}
              placeholder="Ajoutez ou retirez un signal..."
              className="h-11 flex-1 border-0 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="submit"
              disabled={isMutating || instruction.trim().length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMutating ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Application…
                </>
              ) : (
                "Appliquer"
              )}
            </button>
          </div>
        </form>

        {error ? (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isMutating}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Modifier la description
        </button>

        <button
          type="button"
          onClick={onContinue}
          disabled={isMutating || signals.length === 0}
          style={{
            backgroundImage:
              "linear-gradient(90deg, #ce562f 0%, #e89476 50%, #ce562f 100%)",
            color: "#ffffff",
            borderRadius: "12px",
            fontWeight: 600,
            textShadow: "0 1px 0 rgba(0,0,0,0.2)",
            boxShadow: PRIMARY_BTN_SHADOW,
            opacity: isMutating || signals.length === 0 ? 0.55 : 1,
            cursor:
              isMutating || signals.length === 0 ? "not-allowed" : "pointer",
          }}
          className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap px-6 text-sm transition-all"
        >
          Continuer
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
