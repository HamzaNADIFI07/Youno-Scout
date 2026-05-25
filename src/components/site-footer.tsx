export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Scout — Analyse de site web pour la qualification de comptes B2B.
        </p>
        <p>
          Construit avec Next.js, Anthropic Claude et un détecteur maison.
        </p>
      </div>
    </footer>
  );
}
