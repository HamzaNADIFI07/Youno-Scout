"use client";

import { ArrowRight, Globe, Loader2, Sparkles, Target } from "lucide-react";
import { ApiSelector } from "@/components/api-selector";
import { Badge } from "@/components/ui/badge";
import type { CustomSignal, EnabledApis } from "@/lib/types";

type Props = {
  url: string;
  signals: CustomSignal[];
  enabledApis: EnabledApis;
  onApisChange: (next: EnabledApis) => void;
  isAnalyzing: boolean;
  error: string | null;
  onLaunch: () => void;
  onBack: () => void;
};

const BTN_SHADOW = [
  "inset 0 1.5px 0 rgba(255,255,255,0.55)",
  "inset 0 -1.5px 0 rgba(154,60,30,0.4)",
  "0 4px 8px -2px rgba(206,86,47,0.35)",
  "0 12px 24px -6px rgba(206,86,47,0.5)",
  "0 1px 2px rgba(0,0,0,0.08)",
].join(", ");

export function RunStep({
  url,
  signals,
  enabledApis,
  onApisChange,
  isAnalyzing,
  error,
  onLaunch,
  onBack,
}: Props) {
  const disabled = isAnalyzing || signals.length === 0 || url.trim().length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Tout est prêt pour l’analyse
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vérifiez le récapitulatif et lancez. L’analyse prend en général 8 à
          15 secondes.
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Globe className="size-3" aria-hidden />
              Site cible
            </dt>
            <dd className="mt-2 text-sm font-medium text-foreground break-all">
              {url}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3" aria-hidden />
              Signaux personnalisés
            </dt>
            <dd className="mt-2 text-sm font-medium text-foreground">
              {signals.length} signaux retenus
            </dd>
          </div>
        </dl>

        {signals.length > 0 ? (
          <div className="mt-6">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Target className="size-3" aria-hidden />
              Signaux qui seront recherchés
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {signals.map((s) => (
                <Badge
                  key={s.id}
                  variant="secondary"
                  className="bg-[#fff1ea] text-[11px] font-medium text-[#ce562f]"
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 border-t border-border pt-6">
          <ApiSelector
            enabled={enabledApis}
            onChange={onApisChange}
            disabled={isAnalyzing}
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isAnalyzing}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Modifier les signaux
        </button>

        <button
          type="button"
          onClick={onLaunch}
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
          className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap px-7 text-sm transition-all"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Analyse en cours
            </>
          ) : (
            <>
              Lancer l’analyse
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
