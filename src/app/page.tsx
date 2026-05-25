"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnalyzeForm } from "@/components/analyze-form";
import { ErrorBanner } from "@/components/error-banner";
import { HeroBenefits } from "@/components/hero-benefits";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { storeAnalysisResult } from "@/lib/result-store";
import type { AnalysisResult } from "@/lib/types";

type ApiError = {
  error?: string;
  code?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (trimmed.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
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

  return (
    <>
      <SiteHeader />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="hero-grid pointer-events-none absolute inset-0"
        />

        <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 sm:py-28">
          <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm">
            Account discovery
          </span>

          <h1 className="text-gradient-hero mt-6 max-w-3xl text-balance text-center text-4xl font-semibold tracking-tight sm:text-5xl md:text-[3.5rem] md:leading-[1.05]">
            Du site web au compte qualifié,
            <br className="hidden sm:block" />{" "}
            en quelques secondes.
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

          <HeroBenefits />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
