import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTechCategory } from "@/lib/format";
import type { TechStack } from "@/lib/types";

type Props = {
  techStack: TechStack;
};

export function TechStackCard({ techStack }: Props) {
  const totalCount = techStack.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Layers className="size-4" aria-hidden />
            Stack technique
          </CardTitle>
          <span className="text-xs tabular-nums text-muted-foreground">
            {totalCount} outil{totalCount > 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {techStack.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune technologie identifiable depuis le HTML et les en-têtes.
          </p>
        ) : (
          <dl className="space-y-4">
            {techStack.map((category) => (
              <div key={category.category}>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {formatTechCategory(category.category)}
                </dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {category.items.map((item) => (
                    <Badge
                      key={`${category.category}-${item.name}`}
                      variant="secondary"
                      title={item.evidence}
                      className="font-normal"
                    >
                      {item.name}
                    </Badge>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
