"use client";

import { useState } from "react";
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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const trimmedLength = description.trim().length;
  const isTooShort = trimmedLength < MIN_LENGTH;
  const disabled = isGenerating;
  const lengthError =
    submitAttempted && isTooShort
      ? `Décrivez votre activité avec au moins ${MIN_LENGTH} caractères (vous en avez ${trimmedLength}).`
      : null;

  const handleDescriptionChange = (value: string) => {
    onDescriptionChange(value);
    if (submitAttempted && value.trim().length >= MIN_LENGTH) {
      setSubmitAttempted(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">
        Décrivez votre entreprise et le profil de vos prospects
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Plus vous décrivez précisément <span className="font-medium text-foreground">ce que vous cherchez chez vos prospects</span> (et pas seulement ce que vous vendez), plus les signaux générés seront actionnables. Mentionnez votre offre, votre ICP, les signaux d’achat et idéalement vos anti-signaux (qui n’est PAS votre cible).
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (isGenerating) return;
          if (isTooShort) {
            setSubmitAttempted(true);
            return;
          }
          setSubmitAttempted(false);
          onGenerate();
        }}
      >
        <div className="rounded-xl border border-border bg-background shadow-sm transition-shadow focus-within:shadow-md">
          <textarea
            value={description}
            onChange={(event) => handleDescriptionChange(event.target.value)}
            disabled={isGenerating}
            rows={7}
            placeholder="Exemple structuré :&#10;&#10;Notre offre :&#10;Nous vendons Cargo, une plateforme d'orchestration GTM…&#10;&#10;Notre ICP :&#10;Scale-ups SaaS B2B, 50 à 300 employés, ont levé Série A/B, utilisent HubSpot ou Salesforce…&#10;&#10;Les signaux d'achat (ce que je veux DÉTECTER chez le prospect) :&#10;— Recrute un Head of RevOps ou GTM Engineer&#10;— Vient de lever des fonds (Series A/B)&#10;— Affiche un partenariat HubSpot ou Salesforce&#10;— Publie sur le RevOps / GTM Engineering&#10;&#10;Anti-signaux (qui n'est PAS la cible) :&#10;— Boîtes B2C, agences marketing classiques, < 1M€ d'ARR"
            className="block w-full resize-y rounded-xl bg-transparent p-4 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="flex items-center justify-end text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">
            La génération prend en moyenne 4 à 8 secondes.
          </span>
        </div>

        {lengthError || error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {lengthError ?? error}
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
