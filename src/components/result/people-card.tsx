import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Person } from "@/lib/types";

type Props = {
  people: Person[];
};

const SOURCE_LABEL: Record<string, string> = {
  homepage: "Page d’accueil",
  "mentions-legales": "Mentions légales",
};

export function PeopleCard({ people }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Users className="size-4" aria-hidden />
            Personnes identifiées
          </CardTitle>
          {people.length > 0 ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {people.length}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune personne explicitement nommée sur le site.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {people.map((person, index) => (
              <li
                key={`${person.fullName}-${index}`}
                className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/60 p-3"
              >
                <Avatar name={person.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {person.fullName}
                  </p>
                  {person.role ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {person.role}
                    </p>
                  ) : null}
                  {person.source ? (
                    <Badge
                      variant="outline"
                      className="mt-1.5 text-[10px] font-normal"
                    >
                      {SOURCE_LABEL[person.source] ?? person.source}
                    </Badge>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fff1ea] text-[11px] font-semibold text-[#ce562f]"
    >
      {initials || "?"}
    </span>
  );
}
