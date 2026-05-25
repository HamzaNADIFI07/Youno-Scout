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
            className="inline-flex items-center gap-1.5 rounded-full border border-[#ce562f]/20 bg-[#fff1ea] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ce562f] transition-all hover:border-[#ce562f]/40 hover:bg-[#ffe2d2]"
          >
            <Sparkles className="size-3" aria-hidden />
            Mode Premium
          </Link>
        ) : null}
      </div>
    </header>
  );
}
