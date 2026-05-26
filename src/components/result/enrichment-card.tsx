import { Database, MailSearch, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnrichmentData } from "@/lib/types";

type Props = {
  enrichment: EnrichmentData;
};

export function EnrichmentCard({ enrichment }: Props) {
  const hasHunter =
    enrichment.hunter && enrichment.hunter.emails.length > 0;
  const hasCompanyEnrich =
    enrichment.companyEnrich &&
    Object.values(enrichment.companyEnrich).some(
      (v) => typeof v === "string" && v.length > 0
    );
  const hasErrors = enrichment.errors && enrichment.errors.length > 0;

  if (!hasHunter && !hasCompanyEnrich && !enrichment.logoUrl && !hasErrors) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="size-4 text-[#ce562f]" aria-hidden />
          Données enrichies (APIs)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasCompanyEnrich ? (
          <CompanyEnrichSection enrichment={enrichment} />
        ) : null}

        {hasHunter ? <HunterSection enrichment={enrichment} /> : null}

        {hasErrors ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <p className="font-medium">Quelques APIs n’ont pas répondu :</p>
            <ul className="mt-1 list-disc pl-4">
              {enrichment.errors!.map((err) => (
                <li key={err.api}>
                  <span className="font-mono uppercase">{err.api}</span> · {err.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CompanyEnrichSection({ enrichment }: { enrichment: EnrichmentData }) {
  const data = enrichment.companyEnrich!;
  const fields: Array<{ label: string; value: string | undefined }> = [
    { label: "Nom officiel", value: data.legalName ?? data.name },
    { label: "Secteur", value: data.industry },
    { label: "Employés", value: data.employees },
    { label: "Fondée", value: data.founded },
    { label: "Localisation", value: data.location },
    { label: "Pays", value: data.country },
  ];
  const filled = fields.filter((f) => Boolean(f.value));

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Database className="size-3.5 text-muted-foreground" aria-hidden />
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          CompanyEnrich
        </p>
        <Badge variant="outline" className="text-[10px]">
          via API
        </Badge>
      </div>
      {filled.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucune donnée retournée par l’API.
        </p>
      ) : (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {filled.map((field) => (
            <div key={field.label}>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function HunterSection({ enrichment }: { enrichment: EnrichmentData }) {
  const data = enrichment.hunter!;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <MailSearch className="size-3.5 text-muted-foreground" aria-hidden />
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Hunter
        </p>
        <Badge variant="outline" className="text-[10px]">
          via API
        </Badge>
        {typeof data.totalEmailsFound === "number" ? (
          <span className="text-xs text-muted-foreground">
            · {data.totalEmailsFound} adresse{data.totalEmailsFound > 1 ? "s" : ""} dans la base
          </span>
        ) : null}
      </div>

      {data.pattern ? (
        <p className="mb-3 text-xs text-muted-foreground">
          Pattern :{" "}
          <code className="font-mono text-foreground">{data.pattern}</code>
        </p>
      ) : null}

      <ul className="space-y-2">
        {data.emails.slice(0, 8).map((contact) => (
          <li
            key={contact.email}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
          >
            <a
              href={`mailto:${contact.email}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
            {contact.firstName || contact.lastName ? (
              <span className="text-xs text-muted-foreground">
                · {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
              </span>
            ) : null}
            {contact.position ? (
              <span className="text-xs italic text-muted-foreground">
                — {contact.position}
              </span>
            ) : null}
            {typeof contact.confidence === "number" ? (
              <span className="text-[10px] tabular-nums text-muted-foreground">
                · {contact.confidence}%
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
