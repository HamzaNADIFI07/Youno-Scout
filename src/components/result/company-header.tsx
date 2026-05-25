import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatBusinessModel,
  formatCompanySize,
  hostnameOf,
} from "@/lib/format";
import type { AnalysisResult } from "@/lib/types";

type Props = {
  result: AnalysisResult;
};

export function CompanyHeader({ result }: Props) {
  const { company, finalUrl, meta } = result;

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {meta.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.favicon}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-md border border-border/60 bg-muted object-contain p-2"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {company.name}
              </h2>
              <a
                href={finalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {hostnameOf(finalUrl)}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {company.shortDescription}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline">{formatBusinessModel(company.businessModel)}</Badge>
              <Badge variant="outline">{formatCompanySize(company.estimatedSize)}</Badge>
              <Badge variant="outline">{company.industry}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
