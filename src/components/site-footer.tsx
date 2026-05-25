export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Scout est un module candidat pour Konsole, le SaaS Revenue Engineering de Youno.
        </p>
        <p className="italic">You know. We build.</p>
      </div>
    </footer>
  );
}
