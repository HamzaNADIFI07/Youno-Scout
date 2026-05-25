import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-6 w-6 rounded-md bg-foreground"
          />
          <span className="text-base font-semibold tracking-tight">
            Scout
          </span>
        </Link>
        <span className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground sm:inline">
          Account discovery
        </span>
      </div>
    </header>
  );
}
