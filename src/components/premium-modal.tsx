"use client";

import { ArrowRight, MessageCircle, Sparkles, Target, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const HAS_SEEN_KEY = "scout:premium-modal-seen";
const SHOW_DELAY_MS = 3000;

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Décrivez votre business",
    description:
      "Expliquez votre offre et le profil de client idéal en quelques phrases.",
  },
  {
    icon: Sparkles,
    title: "L’IA génère vos signaux",
    description:
      "Notre LLM analyse votre ICP et propose des signaux GTM ultra-précis.",
  },
  {
    icon: Target,
    title: "Score sur-mesure",
    description:
      "L’analyse de site se fait sur vos signaux. Le score reflète vraiment votre prospection.",
  },
];

const TRIGGER_SHADOW = [
  "inset 0 1.5px 0 rgba(255,255,255,0.55)",
  "inset 0 -1.5px 0 rgba(154,60,30,0.4)",
  "0 4px 8px -2px rgba(206,86,47,0.35)",
  "0 12px 24px -6px rgba(206,86,47,0.5)",
  "0 1px 2px rgba(0,0,0,0.08)",
].join(", ");

export function PremiumModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = sessionStorage.getItem(HAS_SEEN_KEY);
      if (seen) return;
    } catch {
      // sessionStorage indisponible, on continue
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true);
      window.requestAnimationFrame(() => setIsVisible(true));
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(HAS_SEEN_KEY, "1");
    } catch {
      // noop
    }
    window.setTimeout(() => setIsOpen(false), 200);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-modal-title"
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Fermer"
        className={`absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative z-10 w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all duration-300 sm:p-8 ${
          isVisible ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Fermer la fenêtre"
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:#fff1ea] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ce562f]">
          <Sparkles className="size-3" aria-hidden />
          Premium
        </div>

        <h2
          id="premium-modal-title"
          className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          style={{
            fontFamily: "var(--font-rethink-sans), sans-serif",
            letterSpacing: "-0.5px",
          }}
        >
          Des signaux GTM taillés pour <em className="not-italic text-[#ce562f]">votre</em> ICP.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Le mode standard détecte 10 signaux génériques. Passez en Premium
          pour décrire votre business à l’IA et générer des signaux 100%
          adaptés à votre prospection.
        </p>

        <ul className="mt-6 space-y-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                <Icon className="size-4 text-foreground" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={close}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Continuer en mode standard
          </button>
          <Link
            href="/premium"
            onClick={() => {
              try {
                sessionStorage.setItem(HAS_SEEN_KEY, "1");
              } catch {
                // noop
              }
            }}
            style={{
              backgroundImage:
                "linear-gradient(90deg, #ce562f 0%, #e89476 50%, #ce562f 100%)",
              boxShadow: TRIGGER_SHADOW,
              color: "#ffffff",
              borderRadius: "10px",
              textShadow: "0 1px 0 rgba(0,0,0,0.2)",
            }}
            className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-xs font-semibold transition-transform hover:-translate-y-px sm:px-5 sm:text-sm"
          >
            Activer le mode Premium
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
