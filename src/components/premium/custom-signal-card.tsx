import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CustomSignal, CustomSignalCategory } from "@/lib/types";

const CATEGORY_LABEL: Record<CustomSignalCategory, string> = {
  joignabilite: "Joignabilité",
  maturite: "Maturité",
  croissance: "Croissance",
  produit: "Produit",
  fit: "Fit ICP",
};

type Props = {
  signal: CustomSignal;
  onDelete: (id: string) => void;
};

export function CustomSignalCard({ signal, onDelete }: Props) {
  return (
    <article className="group relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30">
      <button
        type="button"
        onClick={() => onDelete(signal.id)}
        aria-label={`Supprimer le signal ${signal.label}`}
        className="absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>

      <div className="flex flex-wrap items-center gap-2 pr-10">
        <h3 className="text-sm font-semibold tracking-tight">{signal.label}</h3>
        <Badge variant="outline" className="text-[10px]">
          {CATEGORY_LABEL[signal.category]}
        </Badge>
        <Badge
          variant="secondary"
          className="bg-[#fff1ea] text-[10px] font-semibold text-[#ce562f]"
        >
          Poids {signal.weight}
        </Badge>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {signal.rationale}
      </p>

      {signal.detection.keywords.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Mots-clés
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {signal.detection.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/80"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {signal.detection.urlPatterns.length > 0 ? (
        <div className="mt-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Patterns d’URL
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {signal.detection.urlPatterns.map((path) => (
              <span
                key={path}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground/80"
              >
                {path}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
