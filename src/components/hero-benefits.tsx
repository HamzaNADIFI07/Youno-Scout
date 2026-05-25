import { Layers, Target, Zap } from "lucide-react";

const BENEFITS = [
  {
    icon: Target,
    title: "Score ICP explicable",
    description:
      "Une note 0 à 100 sur le fit SaaS B2B, décomposée par catégorie, avec justification pour chaque point.",
  },
  {
    icon: Zap,
    title: "Signaux GTM",
    description:
      "12 marqueurs détectés : pricing public, offre Enterprise, API documentée, conformité, recrutement actif.",
  },
  {
    icon: Layers,
    title: "Stack technique",
    description:
      "45 outils repérés depuis le HTML, les scripts et les en-têtes : framework, hébergeur, analytics, paiement.",
  },
];

export function HeroBenefits() {
  return (
    <div className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
      {BENEFITS.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="rounded-xl border border-border/70 bg-background/80 p-6 text-left backdrop-blur-sm"
        >
          <div className="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card">
            <Icon className="size-4" aria-hidden />
          </div>
          <h3 className="mt-4 text-sm font-semibold tracking-tight">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      ))}
    </div>
  );
}
