"use client";

import { ArrowRight, Loader2, Sparkles } from "lucide-react";

type Props = {
  description: string;
  onDescriptionChange: (value: string) => void;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  onBack: () => void;
};

const BTN_SHADOW = [
  "inset 0 1.5px 0 rgba(255,255,255,0.55)",
  "inset 0 -1.5px 0 rgba(154,60,30,0.4)",
  "0 4px 8px -2px rgba(206,86,47,0.35)",
  "0 12px 24px -6px rgba(206,86,47,0.5)",
  "0 1px 2px rgba(0,0,0,0.08)",
].join(", ");

const MIN_LENGTH = 30;

export function BusinessStep({
  description,
  onDescriptionChange,
  isGenerating,
  error,
  onGenerate,
  onBack,
}: Props) {
  const remaining = MIN_LENGTH - description.trim().length;
  const disabled = isGenerating || description.trim().length < MIN_LENGTH;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">
        Décrivez votre entreprise et votre ICP
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Plus la description est précise, meilleurs seront les signaux. Mentionnez
        votre offre, votre cible idéale et les critères qui qualifient un bon
        prospect.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) onGenerate();
        }}
      >
        <div className="rounded-xl border border-border bg-background shadow-sm transition-shadow focus-within:shadow-md">
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            disabled={isGenerating}
            rows={7}
            placeholder="Exemple : Nous vendons Cargo, une plateforme d'orchestration GTM pour les équipes RevOps de scale-ups B2B SaaS. Nos clients cibles ont 50 à 300 employés, ont levé en série A ou B, et utilisent déjà HubSpot. Le persona décisionnaire est Head of RevOps ou Founder."
            className="block w-full resize-y rounded-xl bg-transparent p-4 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {remaining > 0
              ? `${remaining} caractère${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}`
              : `${description.trim().length} caractères`}
          </span>
          <span className="hidden sm:inline">
            La génération prend en moyenne 4 à 8 secondes.
          </span>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={isGenerating}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Modifier l’URL cible
          </button>

          <button
            type="submit"
            disabled={disabled}
            style={{
              backgroundImage:
                "linear-gradient(90deg, #ce562f 0%, #e89476 50%, #ce562f 100%)",
              color: "#ffffff",
              borderRadius: "12px",
              fontWeight: 600,
              textShadow: "0 1px 0 rgba(0,0,0,0.2)",
              boxShadow: BTN_SHADOW,
              opacity: disabled ? 0.55 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap px-6 text-sm transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Génération en cours
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden />
                Générer mes signaux
                <ArrowRight className="size-4" aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
