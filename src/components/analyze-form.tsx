"use client";

import { Globe, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="relative flex w-full flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Globe
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            inputMode="url"
            placeholder="stripe.com ou https://www.stripe.com"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
            aria-label="URL du site web à analyser"
            className="h-12 pl-9 pr-3 text-base"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isLoading || value.trim().length === 0}
          className="h-12 px-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analyse en cours
            </>
          ) : (
            <>
              <Search className="size-4" />
              Analyser
            </>
          )}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Indiquez le domaine racine d’une entreprise. L’analyse complète prend en moyenne 8 à 15 secondes.
      </p>
    </form>
  );
}
