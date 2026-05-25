"use client";

import { ArrowLeft, ArrowRight, Globe, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BusinessStep } from "@/components/premium/business-step";
import { PremiumStepper } from "@/components/premium/premium-stepper";
import { SignalsStep } from "@/components/premium/signals-step";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import type { CustomSignal } from "@/lib/types";

const STEPS = [
  { number: 1, label: "Site cible" },
  { number: 2, label: "Décrivez votre business" },
  { number: 3, label: "Éditez vos signaux" },
  { number: 4, label: "Lancez l’analyse" },
];

const BTN_SHADOW = [
  "inset 0 1.5px 0 rgba(255,255,255,0.55)",
  "inset 0 -1.5px 0 rgba(154,60,30,0.4)",
  "0 4px 8px -2px rgba(206,86,47,0.35)",
  "0 12px 24px -6px rgba(206,86,47,0.5)",
  "0 1px 2px rgba(0,0,0,0.08)",
].join(", ");

type GenerateError = { error?: string };

export default function PremiumPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [signals, setSignals] = useState<CustomSignal[]>([]);
  const [isMutating, setIsMutating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const callGenerate = async (body: {
    description: string;
    targetUrl?: string;
    currentSignals?: CustomSignal[];
    instruction?: string;
  }): Promise<CustomSignal[] | null> => {
    setIsMutating(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/generate-signals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as GenerateError;
        setGenerationError(
          data.error ?? "Génération impossible. Veuillez réessayer."
        );
        return null;
      }
      const data = (await response.json()) as { signals: CustomSignal[] };
      return data.signals;
    } catch {
      setGenerationError("Connexion impossible. Vérifiez votre réseau.");
      return null;
    } finally {
      setIsMutating(false);
    }
  };

  const handleGenerate = async () => {
    const next = await callGenerate({
      description,
      targetUrl: url.trim() || undefined,
    });
    if (next) {
      setSignals(next);
      setCurrentStep(3);
    }
  };

  const handleApplyInstruction = async (instruction: string) => {
    const next = await callGenerate({
      description,
      targetUrl: url.trim() || undefined,
      currentSignals: signals,
      instruction,
    });
    if (next) setSignals(next);
  };

  const handleRegenerate = async () => {
    const next = await callGenerate({
      description,
      targetUrl: url.trim() || undefined,
    });
    if (next) setSignals(next);
  };

  const handleDelete = (id: string) => {
    setSignals((current) => current.filter((s) => s.id !== id));
  };

  const goToStep = (step: number) => {
    setGenerationError(null);
    setCurrentStep(step);
  };

  return (
    <>
      <SiteHeader variant="bordered" showPremiumCta={false} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Retour au mode standard
        </Link>

        <div className="mt-6 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1ea] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ce562f]">
            <Sparkles className="size-3" aria-hidden />
            Premium
          </span>
        </div>

        <h1
          className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl"
          style={{
            fontFamily: "var(--font-rethink-sans), sans-serif",
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}
        >
          Configurez une analyse calibrée pour votre ICP.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Indiquez le site à analyser, décrivez votre offre et l’IA Groq
          génère des signaux GTM sur-mesure. Vous gardez la main : éditez la
          liste, ajoutez ou retirez des signaux en langage naturel.
        </p>

        <div className="mt-10">
          <PremiumStepper steps={STEPS} current={currentStep} />
        </div>

        <section className="mt-10">
          {currentStep === 1 ? (
            <UrlStep
              url={url}
              onChange={setUrl}
              onNext={() => goToStep(2)}
            />
          ) : null}

          {currentStep === 2 ? (
            <BusinessStep
              description={description}
              onDescriptionChange={setDescription}
              isGenerating={isMutating}
              error={generationError}
              onGenerate={handleGenerate}
              onBack={() => goToStep(1)}
            />
          ) : null}

          {currentStep === 3 ? (
            <SignalsStep
              signals={signals}
              onDelete={handleDelete}
              onApplyInstruction={handleApplyInstruction}
              onRegenerate={handleRegenerate}
              onContinue={() => goToStep(4)}
              onBack={() => goToStep(2)}
              isMutating={isMutating}
              error={generationError}
            />
          ) : null}

          {currentStep === 4 ? (
            <RunStepPlaceholder
              url={url}
              signalsCount={signals.length}
              onBack={() => goToStep(3)}
            />
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function UrlStep({
  url,
  onChange,
  onNext,
}: {
  url: string;
  onChange: (value: string) => void;
  onNext: () => void;
}) {
  const disabled = url.trim().length === 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">
        Quel site souhaitez-vous analyser ?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Indiquez le domaine racine de l’entreprise à qualifier. Nous le
        gardons en mémoire pour la dernière étape.
      </p>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) onNext();
        }}
      >
        <div className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-border bg-background p-1.5 shadow-sm transition-shadow focus-within:shadow-md">
          <div className="pl-2 text-muted-foreground">
            <Globe className="size-4" aria-hidden />
          </div>
          <Input
            type="text"
            inputMode="url"
            placeholder="stripe.com"
            value={url}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label="URL du site web à analyser"
            className="h-11 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:outline-none focus-visible:ring-0"
          />
        </div>

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
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap px-6 text-sm transition-all hover:-translate-y-px"
        >
          Continuer
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}

function RunStepPlaceholder({
  url,
  signalsCount,
  onBack,
}: {
  url: string;
  signalsCount: number;
  onBack: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">
        Récapitulatif et lancement
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Nous allons analyser <span className="font-medium text-foreground">{url}</span>{" "}
        avec {signalsCount} signaux personnalisés.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Le lancement de l’analyse arrive dans la prochaine phase.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Modifier les signaux
      </button>
    </div>
  );
}
