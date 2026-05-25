"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function AnalyzeForm({ value, onChange, onSubmit, isLoading }: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!isLoading) onSubmit();
      }}
      className="w-full"
    >
      <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-background p-1.5 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-4 focus-within:ring-(--brand)/15">
        <Input
          type="text"
          inputMode="url"
          placeholder="stripe.com"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
          aria-label="URL du site web à analyser"
          className="h-11 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:outline-none focus-visible:ring-0"
        />
        <button
          type="submit"
          disabled={isLoading || value.trim().length === 0}
          className="btn-scout inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-7 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#d05c35]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Analyse en cours
            </>
          ) : (
            <>
              Analyser
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Exemple :{" "}
        <button
          type="button"
          onClick={() => onChange("stripe.com")}
          disabled={isLoading}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          stripe.com
        </button>
        {" "}— aucune inscription requise
      </p>
    </form>
  );
}
