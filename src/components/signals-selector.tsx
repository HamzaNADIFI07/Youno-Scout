"use client";

import { Check } from "lucide-react";
import { SIGNAL_DEFINITIONS } from "@/lib/constants";
import type { SignalId } from "@/lib/types";

type Props = {
  selected: SignalId[];
  onChange: (next: SignalId[]) => void;
  disabled?: boolean;
};

export function SignalsSelector({ selected, onChange, disabled = false }: Props) {
  const selectedSet = new Set(selected);
  const allSelected = SIGNAL_DEFINITIONS.length === selected.length;

  const toggle = (id: SignalId) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(SIGNAL_DEFINITIONS.map((d) => d.id));
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Signaux GTM à analyser
        </p>
        <button
          type="button"
          onClick={toggleAll}
          disabled={disabled}
          className="text-xs font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SIGNAL_DEFINITIONS.map((def) => {
          const isSelected = selectedSet.has(def.id);
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => toggle(def.id)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {isSelected ? (
                <Check className="size-3" aria-hidden strokeWidth={3} />
              ) : null}
              {def.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Le score ICP ne tient compte que des signaux sélectionnés.
      </p>
    </div>
  );
}
