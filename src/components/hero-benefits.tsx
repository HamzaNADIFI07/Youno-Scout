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
    <div
      className="mt-10 -mx-6 flex w-screen max-w-none gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:mt-12 sm:w-full sm:max-w-5xl sm:overflow-visible sm:px-0 sm:pb-0"
      style={{ scrollbarWidth: "none" }}
    >
      {BENEFITS.map(({ icon: Icon, label, description }) => (
        <div
          key={label}
          className="flex w-65 shrink-0 flex-col items-center gap-3 text-center sm:w-auto sm:flex-1"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5"
            style={{ boxShadow: PILL_SHADOW }}
          >
            <Icon
              className="size-4 text-foreground"
              aria-hidden
              strokeWidth={2}
            />
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </p>
        </div>
      ))}
    </div>
  );
}
