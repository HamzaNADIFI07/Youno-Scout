import { Clock } from "lucide-react";
import { CompanyHeader } from "@/components/result/company-header";
import { ContactsCard } from "@/components/result/contacts-card";
import { DescriptionCard } from "@/components/result/description-card";
import { EnrichmentCard } from "@/components/result/enrichment-card";
import { LegalCard } from "@/components/result/legal-card";
import { PeopleCard } from "@/components/result/people-card";
import { ScoreCard } from "@/components/result/score-card";
import { SignalsCard } from "@/components/result/signals-card";
import { TechStackCard } from "@/components/result/tech-stack-card";
import { formatDuration } from "@/lib/format";
import type { AnalysisResult } from "@/lib/types";

type Props = {
  result: AnalysisResult;
};

export function ResultView({ result }: Props) {
  return (
    <div className="space-y-6">
      <CompanyHeader result={result} />

      <DescriptionCard result={result} />

      {result.enrichment ? (
        <EnrichmentCard enrichment={result.enrichment} />
      ) : null}

      <ContactsCard contacts={result.contacts} />

      <PeopleCard people={result.people} />

      <LegalCard legal={result.legal} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreCard icp={result.icp} />
        <SignalsCard signals={result.signals} />
      </div>

      <TechStackCard techStack={result.techStack} />

      <div className="flex items-center justify-end gap-2 pt-2 text-xs text-muted-foreground">
        <Clock className="size-3" aria-hidden />
        <span>Analyse complétée en {formatDuration(result.durationMs)}</span>
      </div>
    </div>
  );
}
