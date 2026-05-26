"use client";

import { CheckCircle2, Loader2, Mail, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onPendingEmail: (email: string) => void;
};

type Stage = "form" | "submitting" | "sent";

const BTN_SHADOW = [
  "inset 0 1.5px 0 rgba(255,255,255,0.55)",
  "inset 0 -1.5px 0 rgba(154,60,30,0.4)",
  "0 4px 8px -2px rgba(206,86,47,0.35)",
  "0 12px 24px -6px rgba(206,86,47,0.5)",
  "0 1px 2px rgba(0,0,0,0.08)",
].join(", ");

export function EmailGateModal({ open, onClose, onPendingEmail }: Props) {
  const [email, setEmail] = useState("");
  const [acceptedMarketing, setAcceptedMarketing] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (stage === "submitting") return;
    onClose();
  }, [onClose, stage]);

  useEffect(() => {
    if (!open) {
      // reset after close animation
      const t = window.setTimeout(() => {
        setStage("form");
        setError(null);
      }, 200);
      return () => window.clearTimeout(t);
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions d'utilisation pour continuer.");
      return;
    }
    setStage("submitting");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          acceptedMarketing,
          acceptedTerms,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Envoi impossible. Réessayez dans quelques instants.");
        setStage("form");
        return;
      }
      onPendingEmail(email.trim().toLowerCase());
      setStage("sent");
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
      setStage("form");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Fermer"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={close}
          disabled={stage === "submitting"}
          aria-label="Fermer la fenêtre"
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="size-4" aria-hidden />
        </button>

        {stage === "sent" ? <SentBlock email={email} /> : (
          <FormBlock
            email={email}
            setEmail={setEmail}
            acceptedMarketing={acceptedMarketing}
            setAcceptedMarketing={setAcceptedMarketing}
            acceptedTerms={acceptedTerms}
            setAcceptedTerms={setAcceptedTerms}
            error={error}
            isSubmitting={stage === "submitting"}
            onSubmit={submit}
          />
        )}
      </div>
    </div>
  );
}

function FormBlock({
  email,
  setEmail,
  acceptedMarketing,
  setAcceptedMarketing,
  acceptedTerms,
  setAcceptedTerms,
  error,
  isSubmitting,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  acceptedMarketing: boolean;
  setAcceptedMarketing: (v: boolean) => void;
  acceptedTerms: boolean;
  setAcceptedTerms: (v: boolean) => void;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const valid = /.+@.+\..+/.test(email.trim()) && acceptedTerms;

  return (
    <>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1ea] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ce562f]">
        <Mail className="size-3" aria-hidden />
        Confirmation
      </div>

      <h2
        id="email-gate-title"
        className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        style={{
          fontFamily: "var(--font-rethink-sans), sans-serif",
          letterSpacing: "-0.4px",
          lineHeight: 1.2,
        }}
      >
        Indiquez votre email pour lancer l’analyse.
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        On vous envoie un lien de confirmation, puis vous pouvez revenir
        lancer votre rapport.
      </p>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="email-gate-input"
            className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
          >
            Adresse email professionnelle
          </label>
          <input
            id="email-gate-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            placeholder="prenom@entreprise.fr"
            className="mt-1.5 block h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/70 focus-visible:shadow-md disabled:opacity-50"
          />
        </div>

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            disabled={isSubmitting}
            className="mt-0.5 size-4 accent-[#ce562f]"
          />
          <span className="text-xs leading-relaxed text-foreground">
            J’accepte les conditions d’utilisation de Scout.
            <span className="text-destructive"> *</span>
          </span>
        </label>

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={acceptedMarketing}
            onChange={(event) => setAcceptedMarketing(event.target.checked)}
            disabled={isSubmitting}
            className="mt-0.5 size-4 accent-[#ce562f]"
          />
          <span className="text-xs leading-relaxed text-muted-foreground">
            Je souhaite recevoir des actualités et conseils GTM de Youno.
          </span>
        </label>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!valid || isSubmitting}
          style={{
            backgroundImage:
              "linear-gradient(90deg, #ce562f 0%, #e89476 50%, #ce562f 100%)",
            color: "#ffffff",
            borderRadius: "10px",
            fontWeight: 600,
            textShadow: "0 1px 0 rgba(0,0,0,0.2)",
            boxShadow: BTN_SHADOW,
            opacity: !valid || isSubmitting ? 0.55 : 1,
            cursor: !valid || isSubmitting ? "not-allowed" : "pointer",
          }}
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 text-sm transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Envoi en cours
            </>
          ) : (
            <>Recevoir le lien de confirmation</>
          )}
        </button>
      </form>
    </>
  );
}

function SentBlock({ email }: { email: string }) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[#fff1ea] text-[#ce562f]">
        <CheckCircle2 className="size-6" aria-hidden />
      </div>
      <h2
        className="mt-4 text-xl font-bold tracking-tight text-foreground"
        style={{
          fontFamily: "var(--font-rethink-sans), sans-serif",
          letterSpacing: "-0.4px",
          lineHeight: 1.2,
        }}
      >
        Vérifiez votre boîte mail.
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        On vient d’envoyer un lien de confirmation à{" "}
        <span className="font-semibold text-foreground">{email}</span>.
        Cliquez sur le bouton dans l’email, puis revenez ici pour lancer
        l’analyse.
      </p>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Pas d’email après 2 minutes ? Vérifiez vos spams.
      </p>
    </div>
  );
}
