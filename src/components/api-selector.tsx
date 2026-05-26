"use client";

import { Database, Image as ImageIcon, MailSearch } from "lucide-react";
import type { ApiKey, ApiQuota } from "@/lib/api-quota";
import type { EnabledApis } from "@/lib/types";

type Props = {
  enabled: EnabledApis;
  quotas: Record<ApiKey, ApiQuota>;
  onChange: (next: EnabledApis) => void;
  disabled?: boolean;
};

type Option = {
  key: ApiKey;
  name: string;
  description: string;
  Icon: typeof MailSearch;
};

const OPTIONS: Option[] = [
  {
    key: "clearbitLogo",
    name: "Clearbit Logo",
    description: "Récupère le logo HD de l’entreprise.",
    Icon: ImageIcon,
  },
  {
    key: "hunter",
    name: "Hunter",
    description: "Liste les emails professionnels publics du domaine.",
    Icon: MailSearch,
  },
  {
    key: "companyEnrich",
    name: "CompanyEnrich",
    description: "Enrichit la fiche entreprise (taille, fondation, adresse).",
    Icon: Database,
  },
];

export function ApiSelector({ enabled, quotas, onChange, disabled }: Props) {
  const toggle = (key: ApiKey) => {
    onChange({ ...enabled, [key]: !enabled[key] });
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          APIs publiques à utiliser
        </p>
        <span className="text-xs text-muted-foreground">
          Données prioritaires sur le scraping
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPTIONS.map(({ key, name, description, Icon }) => {
          const quota = quotas[key];
          const isChecked = Boolean(enabled[key]);
          const isExhausted =
            quota.limit > 0 && quota.used >= quota.limit;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              disabled={disabled || isExhausted}
              aria-pressed={isChecked}
              className={`group relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isChecked
                  ? "border-[#ce562f] bg-[#fff1ea]"
                  : "border-border bg-background/60 hover:border-foreground/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-background">
                  <Icon className="size-3.5" aria-hidden />
                </div>
                <Checkbox checked={isChecked} />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">{name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
              <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                {quota.limit === 0
                  ? "Quota illimité"
                  : `${quota.used} / ${quota.limit} ${quota.periodLabel}`}
                {isExhausted ? (
                  <span className="ml-1 font-semibold text-destructive">
                    · épuisé
                  </span>
                ) : null}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-4 items-center justify-center rounded border transition-colors ${
        checked
          ? "border-[#ce562f] bg-[#ce562f]"
          : "border-border bg-background"
      }`}
    >
      {checked ? (
        <svg
          viewBox="0 0 12 12"
          className="size-2.5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6.5L4.5 9L10 3" />
        </svg>
      ) : null}
    </span>
  );
}
