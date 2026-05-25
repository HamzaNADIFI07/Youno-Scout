import Link from "next/link";

type Props = {
  variant?: "transparent" | "bordered";
};

export function SiteHeader({ variant = "transparent" }: Props) {
  return (
    <header
      className={
        variant === "bordered"
          ? "border-b border-border/60"
          : "border-b border-transparent"
      }
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-block size-6 rounded-md bg-foreground"
          />
          <span className="text-base font-semibold tracking-tight">Scout</span>
        </Link>
        <span className="hidden text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:inline">
          Account discovery
        </span>
      </div>
    </header>
  );
}
