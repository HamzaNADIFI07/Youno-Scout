import { Layers, Target, Zap } from "lucide-react";

const BENEFITS = [
  {
    icon: Target,
    label: "Score ICP explicable",
    description:
      "Une note 0 à 100 sur le fit SaaS B2B, décomposée par catégorie, avec justification pour chaque point.",
  },
  {
    icon: Zap,
    label: "Signaux GTM",
    description:
      "12 marqueurs détectés : pricing public, offre Enterprise, API documentée, conformité, recrutement actif.",
  },
  {
    icon: Layers,
    label: "Stack technique",
    description:
      "45 outils repérés depuis le HTML, les scripts et les en-têtes : framework, hébergeur, analytics, paiement.",
  },
];

const PILL_SHADOW =
  "0 1px 2px rgba(0,0,0,0.04), 0 6px 18px -4px rgba(0,0,0,0.08), 0 12px 32px -8px rgba(0,0,0,0.06)";

export function HeroBenefits() {
  return (
    <div className="mt-14 grid w-full max-w-5xl grid-cols-1 gap-10 sm:mt-16 sm:grid-cols-3 sm:gap-8">
      {BENEFITS.map(({ icon: Icon, label, description }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div
            className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3"
            style={{ boxShadow: PILL_SHADOW }}
          >
            <Icon
              className="size-5 text-foreground"
              aria-hidden
              strokeWidth={2}
            />
            <span className="text-base font-medium text-foreground">
              {label}
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      ))}
    </div>
  );
}
