"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

const BASE_SHADOW = [
  "inset 0 1px 0 rgba(255,255,255,0.65)",
  "inset 0 -1px 0 rgba(0,0,0,0.18)",
  "inset 0 0 0 1px rgba(196,80,42,0.35)",
  "0 10px 22px -6px rgba(208,92,53,0.55)",
  "0 2px 4px rgba(0,0,0,0.1)",
].join(", ");

const HOVER_SHADOW = [
  "inset 0 1px 0 rgba(255,255,255,0.7)",
  "inset 0 -1px 0 rgba(0,0,0,0.2)",
  "inset 0 0 0 1px rgba(196,80,42,0.4)",
  "0 14px 28px -6px rgba(208,92,53,0.6)",
  "0 4px 8px rgba(0,0,0,0.12)",
].join(", ");

export function AnalyzeForm({ value, onChange, onSubmit, isLoading }: Props) {
  const [isHovering, setIsHovering] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const isDisabled = isLoading || value.trim().length === 0;

  const buttonStyle: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(180deg, #f2a387 0%, #e0654a 55%, #c4502a 100%)",
    color: "#ffffff",
    borderRadius: "12px",
    border: "none",
    fontWeight: 500,
    textShadow: "0 1px 0 rgba(0,0,0,0.2)",
    boxShadow:
      isHovering && !isDisabled && !isPressing ? HOVER_SHADOW : BASE_SHADOW,
    transform:
      isHovering && !isDisabled && !isPressing
        ? "translateY(-1px)"
        : "translateY(0)",
    filter: isDisabled
      ? "saturate(0.6)"
      : isHovering && !isPressing
        ? "brightness(1.06) saturate(1.08)"
        : isPressing
          ? "brightness(0.96)"
          : "none",
    opacity: isDisabled ? 0.55 : 1,
    cursor: isDisabled ? "not-allowed" : "pointer",
    transition:
      "transform 100ms ease, box-shadow 200ms ease, filter 200ms ease",
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!isLoading) onSubmit();
      }}
      className="w-full"
    >
      <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-background p-1.5 shadow-sm transition-shadow focus-within:shadow-md">
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
          disabled={isDisabled}
          style={buttonStyle}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setIsPressing(false);
          }}
          onMouseDown={() => setIsPressing(true)}
          onMouseUp={() => setIsPressing(false)}
          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap px-7 text-sm outline-none"
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
