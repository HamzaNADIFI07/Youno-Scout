import { Sparkles } from "lucide-react";
import Link from "next/link";
import { ScoutLogo } from "@/components/scout-logo";

type Props = {
  variant?: "transparent" | "bordered";
  showPremiumCta?: boolean;
};

export function SiteHeader({
  variant = "transparent",
  showPremiumCta = true,
}: Props) {
  return (
    <header
      className={
        variant === "bordered"
          ? "border-b border-border/70"
          : "border-b border-transparent"
      }
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <ScoutLogo />
        {showPremiumCta ? (
          <Link
            href="/premium"
            style={{
              background:
                "linear-gradient(#f5f5eb, #f5f5eb) padding-box, linear-gradient(90deg, #ce562f 0%, #e89476 50%, #ce562f 100%) border-box",
              border: "2px solid transparent",
              borderRadius: "12px",
              color: "#ce562f",
              boxShadow:
                "0 4px 12px -4px rgba(206,86,47,0.3), 0 1px 2px rgba(0,0,0,0.04)",
              textShadow: "0 1px 0 rgba(255,255,255,0.4)",
            }}
            className="group inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold transition-all hover:-translate-y-px"
          >
            <Sparkles className="size-4" aria-hidden />
            Passer en Premium
            <span
              aria-hidden
              className="inline-block transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
