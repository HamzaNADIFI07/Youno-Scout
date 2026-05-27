"use client";

import { CheckCircle2, Download, Loader2, Mail, X } from "lucide-react";
import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";

type Props = {
  result: AnalysisResult;
};

const BTN_SHADOW = [
  "inset 0 1.5px 0 rgba(255,255,255,0.55)",
  "inset 0 -1.5px 0 rgba(154,60,30,0.4)",
  "0 4px 8px -2px rgba(206,86,47,0.35)",
  "0 12px 24px -6px rgba(206,86,47,0.5)",
  "0 1px 2px rgba(0,0,0,0.08)",
].join(", ");

export function PdfExportPanel({ result }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery: "download", result }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setDownloadError(
          data.error ?? "Génération du PDF impossible. Réessayez."
        );
        setIsDownloading(false);
        return;
      }
      const blob = await response.blob();
      const cd = response.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `rapport-scout-${Date.now()}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#ce562f]/30 bg-[#fff1ea] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ce562f]">
            Rapport Premium
          </p>
          <h3
            className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg"
            style={{
              fontFamily: "var(--font-rethink-sans), sans-serif",
              letterSpacing: "-0.2px",
            }}
          >
            Exportez ce rapport au format PDF
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Téléchargez-le immédiatement, ou recevez-le dans votre boîte mail.
            Mise en page calibrée à la charte Youno.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            disabled={isDownloading}
            className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#ce562f]/40 bg-white px-4 text-xs font-semibold text-[#ce562f] transition-all hover:-translate-y-px hover:bg-[#fff7f1] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            <Mail className="size-3.5" aria-hidden />
            Recevoir par email
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              backgroundImage:
                "linear-gradient(90deg, #ce562f 0%, #e89476 50%, #ce562f 100%)",
              color: "#ffffff",
              borderRadius: "10px",
              fontWeight: 600,
              textShadow: "0 1px 0 rgba(0,0,0,0.2)",
              boxShadow: BTN_SHADOW,
              opacity: isDownloading ? 0.55 : 1,
              cursor: isDownloading ? "not-allowed" : "pointer",
            }}
            className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-xs transition-all sm:text-sm"
          >
            {isDownloading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Génération...
              </>
            ) : (
              <>
                <Download className="size-3.5" aria-hidden />
                Télécharger le PDF
              </>
            )}
          </button>
        </div>
      </div>

      {downloadError ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
          {downloadError}
        </div>
      ) : null}

      <EmailPdfModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        result={result}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Modal email
// ──────────────────────────────────────────────────────────────────────

function EmailPdfModal({
  open,
  onClose,
  result,
}: {
  open: boolean;
  onClose: () => void;
  result: AnalysisResult;
}) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const valid = /.+@.+\..+/.test(email.trim());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!valid || isSending) return;
    setIsSending(true);
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery: "email",
          result,
          email: email.trim().toLowerCase(),
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Envoi impossible. Réessayez.");
        setIsSending(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setIsSending(false);
    }
  };

  const close = () => {
    if (isSending) return;
    setEmail("");
    setError(null);
    setSent(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-email-title"
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
          disabled={isSending}
          aria-label="Fermer la fenêtre"
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="size-4" aria-hidden />
        </button>

        {sent ? (
          <div className="py-4 text-center">
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[#fff1ea] text-[#ce562f]">
              <CheckCircle2 className="size-6" aria-hidden />
            </div>
            <h2
              className="mt-4 text-xl font-bold tracking-tight text-foreground"
              style={{
                fontFamily: "var(--font-rethink-sans), sans-serif",
                letterSpacing: "-0.4px",
              }}
            >
              Rapport envoyé.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              On vient d&apos;envoyer le PDF à{" "}
              <span className="font-semibold text-foreground">
                {email.trim()}
              </span>
              . Vérifiez votre boîte mail (et vos spams au cas où).
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1ea] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ce562f]">
              <Mail className="size-3" aria-hidden />
              Envoyer le PDF
            </div>

            <h2
              id="pdf-email-title"
              className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
              style={{
                fontFamily: "var(--font-rethink-sans), sans-serif",
                letterSpacing: "-0.4px",
                lineHeight: 1.2,
              }}
            >
              Recevez le rapport dans votre boîte mail.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              On envoie le PDF en pièce jointe à l&apos;adresse que vous
              indiquez. Aucun mail de confirmation supplémentaire.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="pdf-email-input"
                  className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Adresse email
                </label>
                <input
                  id="pdf-email-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSending}
                  placeholder="prenom@entreprise.fr"
                  className="mt-1.5 block h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground/70 focus-visible:shadow-md disabled:opacity-50"
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!valid || isSending}
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #ce562f 0%, #e89476 50%, #ce562f 100%)",
                  color: "#ffffff",
                  borderRadius: "10px",
                  fontWeight: 600,
                  textShadow: "0 1px 0 rgba(0,0,0,0.2)",
                  boxShadow: BTN_SHADOW,
                  opacity: !valid || isSending ? 0.55 : 1,
                  cursor: !valid || isSending ? "not-allowed" : "pointer",
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 text-sm transition-all"
              >
                {isSending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Envoi en cours
                  </>
                ) : (
                  <>Envoyer le PDF</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
