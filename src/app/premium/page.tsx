"use client";

import { ArrowLeft, ArrowRight, Globe, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PremiumStepper } from "@/components/premium/premium-stepper";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";

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

export default function PremiumPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [url, setUrl] = useState("");

  const handleNextFromStep1 = () => {
    if (url.trim().length === 0) return;
    setCurrentStep(2);
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
              onNext={handleNextFromStep1}
            />
          ) : null}

          {currentStep === 2 ? <BusinessStepPlaceholder /> : null}
          {currentStep === 3 ? <SignalsStepPlaceholder /> : null}
          {currentStep === 4 ? <RunStepPlaceholder /> : null}
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

function BusinessStepPlaceholder() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">
        Décrivez votre entreprise et votre ICP
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cette étape arrive dans la phase suivante.
      </p>
    </div>
  );
}

function SignalsStepPlaceholder() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">
        Vos signaux GTM générés
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cette étape arrive dans la phase suivante.
      </p>
    </div>
  );
}

function RunStepPlaceholder() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">
        Lancement de l’analyse
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cette étape arrive dans la phase suivante.
      </p>
    </div>
  );
}
