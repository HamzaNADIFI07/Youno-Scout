import { Building2, ExternalLink, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LegalInfo } from "@/lib/types";

type Props = {
  legal: LegalInfo;
};

type FieldDef = {
  key: keyof LegalInfo;
  label: string;
};

const FIELDS: FieldDef[] = [
  { key: "legalName", label: "Raison sociale" },
  { key: "legalForm", label: "Forme juridique" },
  { key: "registrationNumber", label: "Immatriculation" },
  { key: "vatNumber", label: "Numéro de TVA" },
  { key: "shareCapital", label: "Capital social" },
  { key: "rcs", label: "RCS" },
  { key: "headquartersAddress", label: "Siège social" },
  { key: "publicationDirector", label: "Directeur de publication" },
  { key: "hostingProvider", label: "Hébergeur" },
];

export function LegalCard({ legal }: Props) {
  const filled = FIELDS.filter((field) => Boolean(legal[field.key]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Building2 className="size-4" aria-hidden />
            Informations légales
          </CardTitle>
          {legal.legalPageUrl ? (
            <a
              href={legal.legalPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <FileText className="size-3" aria-hidden />
              Source
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {filled.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune mention légale détectée. Pour une boîte française, la page
            attendue est généralement /mentions-legales.
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filled.map((field) => (
              <div key={field.key}>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {legal[field.key]}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
