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
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-sm transition-all hover:bg-foreground/90 hover:shadow-md"
          >
            <span className="relative flex size-1.5" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ce562f] opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#ce562f]" />
            </span>
            <Sparkles className="size-3.5 text-[#e89476]" aria-hidden />
            <span>Passer en Premium</span>
            <span
              aria-hidden
              className="-ml-1 inline-block transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
