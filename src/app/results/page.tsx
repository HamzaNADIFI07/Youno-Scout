"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
import { ResultView } from "@/components/result/result-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { readAnalysisResult } from "@/lib/result-store";
import type { AnalysisResult } from "@/lib/types";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): AnalysisResult | null {
  return readAnalysisResult();
}

function getServerSnapshot(): AnalysisResult | null {
  return null;
}

export default function ResultsPage() {
  const router = useRouter();
  const result = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (typeof window !== "undefined" && result === null) {
      router.replace("/");
    }
  }, [result, router]);

  return (
    <>
      <SiteHeader variant="bordered" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Analyse complète
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Brief commercial
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Nouvelle analyse
          </Link>
        </div>

        {result ? (
          <ResultView result={result} />
        ) : (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
