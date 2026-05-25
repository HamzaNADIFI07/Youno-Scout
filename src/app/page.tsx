"use client";

import { useCallback, useState } from "react";
import { AnalyzeForm } from "@/components/analyze-form";
import { EmptyState } from "@/components/empty-state";
import { ErrorBanner } from "@/components/error-banner";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { ResultView } from "@/components/result/result-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { AnalysisResult } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

type ApiError = {
  error?: string;
  code?: string;
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = useCallback(async () => {
    const trimmed = url.trim();
    if (trimmed.length === 0) return;

    setStatus("loading");
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        setErrorMessage(
          data.error || "L'analyse a échoué. Veuillez réessayer."
        );
        setStatus("error");
        return;
      }

      const data = (await response.json()) as AnalysisResult;
      setResult(data);
      setStatus("success");
    } catch {
      setErrorMessage(
        "Connexion impossible au serveur. Vérifiez votre connexion réseau."
      );
      setStatus("error");
    }
  }, [url]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
        <section className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Qualifiez n’importe quelle entreprise depuis une URL.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Scout analyse le site, détecte la stack technique et les signaux
            GTM, et calcule un score de fit ICP explicable. Pensé pour les
            équipes commerciales qui veulent prioriser leur prospection.
          </p>
        </section>

        <section className="mt-8">
          <AnalyzeForm
            value={url}
            onChange={setUrl}
            onSubmit={handleSubmit}
            isLoading={status === "loading"}
          />
        </section>

        <section className="mt-10">
          {status === "idle" && <EmptyState />}
          {status === "loading" && <LoadingSkeleton />}
          {status === "error" && (
            <ErrorBanner title="Analyse impossible" message={errorMessage} />
          )}
          {status === "success" && result && <ResultView result={result} />}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
