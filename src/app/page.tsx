"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalyzeForm } from "@/components/analyze-form";
import { ApiSelector } from "@/components/api-selector";
import { EmailGateModal } from "@/components/email-gate-modal";
import { ErrorBanner } from "@/components/error-banner";
import { HeroBenefits } from "@/components/hero-benefits";
import { PremiumModal } from "@/components/premium-modal";
import { SignalsSelector } from "@/components/signals-selector";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SIGNAL_DEFINITIONS } from "@/lib/constants";
import { storeAnalysisResult } from "@/lib/result-store";
import type { AnalysisResult, EnabledApis, SignalId } from "@/lib/types";
import { fetchSession } from "@/lib/verified-email";

type ApiError = {
  error?: string;
  code?: string;
};

const ALL_SIGNAL_IDS: SignalId[] = SIGNAL_DEFINITIONS.map((d) => d.id);

const DEFAULT_ENABLED_APIS: EnabledApis = {
  clearbitLogo: true,
  hunter: false,
  companyEnrich: false,
};

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [selectedSignals, setSelectedSignals] =
    useState<SignalId[]>(ALL_SIGNAL_IDS);
  const [enabledApis, setEnabledApis] =
    useState<EnabledApis>(DEFAULT_ENABLED_APIS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);

  // Au montage, on demande au serveur si la session-cookie est valide.
  useEffect(() => {
    let cancelled = false;
    void fetchSession().then((session) => {
      if (cancelled) return;
      if (session.authenticated) setVerifiedEmail(session.email);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Quand la fenêtre revient au premier plan (l'utilisateur a probablement
  // confirmé son email dans un autre onglet), on re-check la session pour
  // débloquer l'analyse sans recharger la page.
  useEffect(() => {
    const onFocus = () => {
      void fetchSession().then((session) => {
        if (session.authenticated && session.email !== verifiedEmail) {
          setVerifiedEmail(session.email);
        }
      });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [verifiedEmail]);

  const runAnalysis = async () => {
    const trimmed = url.trim();
    if (trimmed.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          selectedSignals,
          enabledApis,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        setErrorMessage(data.error ?? "L’analyse a échoué. Veuillez réessayer.");
        setIsLoading(false);
        return;
      }

      const result = (await response.json()) as AnalysisResult;
      storeAnalysisResult(result);
      router.push("/results");
    } catch {
      setErrorMessage(
        "Connexion impossible au serveur. Vérifiez votre réseau."
      );
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (trimmed.length === 0) return;

    if (!verifiedEmail) {
      setErrorMessage(null);
      setShowEmailGate(true);
      return;
    }
    await runAnalysis();
  };

  return (
    <>
      <SiteHeader />
      <PremiumModal />
      <EmailGateModal
        open={showEmailGate}
        onClose={() => setShowEmailGate(false)}
        onPendingEmail={() => {
          /* rien à faire côté client : la confirmation viendra du serveur via le cookie */
        }}
      />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="hero-grid pointer-events-none absolute inset-0"
        />

        <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 sm:py-28">
          <h1 className="text-gradient-hero max-w-6xl text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">Du site web au compte qualifié,</span>
            <span className="block">en quelques secondes.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
            Scout extrait la stack technique, les signaux commerciaux et un
            score ICP explicable depuis n’importe quelle URL publique.
          </p>

          <div className="mt-10 w-full max-w-xl">
            <AnalyzeForm
              value={url}
              onChange={setUrl}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>

          {errorMessage ? (
            <div className="mt-6 w-full max-w-xl">
              <ErrorBanner title="Analyse impossible" message={errorMessage} />
            </div>
          ) : null}

          <div className="mt-12 flex w-full justify-center sm:mt-14">
            <SignalsSelector
              selected={selectedSignals}
              onChange={setSelectedSignals}
              disabled={isLoading}
            />
          </div>

          <div className="mt-10 flex w-full justify-center">
            <ApiSelector
              enabled={enabledApis}
              onChange={setEnabledApis}
              disabled={isLoading}
            />
          </div>

          <HeroBenefits />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
