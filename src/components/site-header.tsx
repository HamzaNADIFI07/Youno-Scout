import Link from "next/link";

type Props = {
  variant?: "transparent" | "bordered";
};

export function SiteHeader({ variant = "transparent" }: Props) {
  return (
    <header
      className={
        variant === "bordered"
          ? "border-b border-border/70"
          : "border-b border-transparent"
      }
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          aria-label="Retour à l’accueil"
          className="inline-flex items-center gap-3"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-brand shadow-sm">
            <span className="-translate-y-px text-xl font-bold leading-none text-brand-foreground">
              u
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              youno
            </span>
            <div className="flex items-baseline gap-1.5 text-[11px] italic text-foreground/65">
              <span>You know. We build.</span>
              <span aria-hidden className="text-foreground/40">
                ·
              </span>
              <span className="font-semibold not-italic text-foreground/85">
                scout
              </span>
            </div>
          </div>
        </Link>
        <span className="hidden text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:inline">
          Module Konsole
        </span>
      </div>
    </header>
  );
}
