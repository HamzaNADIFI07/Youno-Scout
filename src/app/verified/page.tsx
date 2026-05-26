import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Status = "ok" | "invalid" | "error";

const BTN_SHADOW = [
  "inset 0 1.5px 0 rgba(255,255,255,0.55)",
  "inset 0 -1.5px 0 rgba(154,60,30,0.4)",
  "0 4px 8px -2px rgba(206,86,47,0.35)",
  "0 12px 24px -6px rgba(206,86,47,0.5)",
  "0 1px 2px rgba(0,0,0,0.08)",
].join(", ");

type Props = {
  searchParams: Promise<{ status?: string; email?: string }>;
};

export default async function VerifiedPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const email = typeof params.email === "string" ? params.email : undefined;

  return (
    <>
      <SiteHeader variant="bordered" showPremiumCta={false} />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
          {status === "ok" ? (
            <SuccessBlock email={email} />
          ) : status === "invalid" ? (
            <InvalidBlock />
          ) : (
            <ErrorBlock />
          )}

          <Link
            href="/"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #ce562f 0%, #e89476 50%, #ce562f 100%)",
              color: "#ffffff",
              borderRadius: "10px",
              fontWeight: 600,
              textShadow: "0 1px 0 rgba(0,0,0,0.2)",
              boxShadow: BTN_SHADOW,
            }}
            className="mt-8 inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap px-5 text-sm transition-all"
          >
            Revenir sur Scout
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SuccessBlock({ email }: { email?: string }) {
  return (
    <>
      <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[#fff1ea] text-[#ce562f]">
        <CheckCircle2 className="size-7" aria-hidden />
      </div>
      <h1
        className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        style={{
          fontFamily: "var(--font-rethink-sans), sans-serif",
          letterSpacing: "-0.4px",
          lineHeight: 1.15,
        }}
      >
        Votre adresse email est confirmée.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {email ? (
          <>
            <span className="font-semibold text-foreground">{email}</span>{" "}
            est désormais vérifiée. Vous pouvez revenir sur la page d’accueil
            pour lancer votre analyse.
          </>
        ) : (
          "Vous pouvez revenir sur la page d’accueil pour lancer votre analyse."
        )}
      </p>
    </>
  );
}

function InvalidBlock() {
  return (
    <>
      <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <XCircle className="size-7" aria-hidden />
      </div>
      <h1
        className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        style={{
          fontFamily: "var(--font-rethink-sans), sans-serif",
          letterSpacing: "-0.4px",
          lineHeight: 1.15,
        }}
      >
        Ce lien de confirmation n’est plus valide.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Le lien a peut-être expiré ou a déjà été utilisé. Relancez la demande
        depuis Scout pour recevoir un nouvel email.
      </p>
    </>
  );
}

function ErrorBlock() {
  return (
    <>
      <div className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <XCircle className="size-7" aria-hidden />
      </div>
      <h1
        className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        style={{
          fontFamily: "var(--font-rethink-sans), sans-serif",
          letterSpacing: "-0.4px",
          lineHeight: 1.15,
        }}
      >
        Une erreur est survenue.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Nous n’avons pas pu confirmer votre adresse. Réessayez dans quelques
        instants depuis la page Scout.
      </p>
    </>
  );
}

function normalizeStatus(raw: string | undefined): Status {
  if (raw === "ok" || raw === "invalid" || raw === "error") return raw;
  return "error";
}
