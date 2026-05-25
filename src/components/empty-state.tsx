import { Compass, Layers, Target, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Layers,
    title: "Stack technique",
    description:
      "Détection des frameworks, hébergeur, analytics, outils marketing et de support installés.",
  },
  {
    icon: Zap,
    title: "Signaux GTM",
    description:
      "Pricing public, offre Enterprise, recrutement actif, conformité, API documentée et plus.",
  },
  {
    icon: Target,
    title: "Score ICP",
    description:
      "Note 0-100 pour un fit SaaS B2B mid-market, décomposée par catégorie et explicable.",
  },
  {
    icon: Compass,
    title: "Brief commercial",
    description:
      "Nom, proposition de valeur, cible et secteur, structurés depuis le contenu du site.",
  },
];

export function EmptyState() {
  return (
    <section className="rounded-xl border border-border/60 bg-card/50 px-6 py-10">
      <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Ce que Scout extrait
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background">
              <Icon className="size-4" aria-hidden />
            </div>
            <div>
              <h3 className="text-sm font-medium">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
