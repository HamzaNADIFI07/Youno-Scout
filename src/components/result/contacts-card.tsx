import { ExternalLink, Mail, MessageSquare, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contacts, SocialPlatform } from "@/lib/types";

type Props = {
  contacts: Contacts;
};

const SOCIAL_LABEL: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  github: "GitHub",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export function ContactsCard({ contacts }: Props) {
  const hasEmails = contacts.emails.length > 0;
  const hasPhones = contacts.phones.length > 0;
  const hasSocials = contacts.socials.length > 0;
  const isEmpty =
    !hasEmails && !hasPhones && !hasSocials && !contacts.hasContactForm;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <Mail className="size-4" aria-hidden />
          Coordonnées détectées
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">
            Aucune coordonnée publique trouvée sur la page d’accueil.
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {hasEmails ? (
              <Section
                title="Emails"
                icon={<Mail className="size-3.5" aria-hidden />}
              >
                {contacts.emails.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    <span className="truncate">{email}</span>
                  </a>
                ))}
              </Section>
            ) : null}

            {hasPhones ? (
              <Section
                title="Téléphones"
                icon={<Phone className="size-3.5" aria-hidden />}
              >
                {contacts.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="text-sm font-medium tabular-nums text-foreground underline-offset-4 hover:underline"
                  >
                    {phone}
                  </a>
                ))}
              </Section>
            ) : null}

            {hasSocials ? (
              <Section
                title="Réseaux sociaux"
                icon={<ExternalLink className="size-3.5" aria-hidden />}
                full
              >
                <div className="flex flex-wrap gap-2">
                  {contacts.socials.map(({ platform, url }) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-background"
                    >
                      {SOCIAL_LABEL[platform]}
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ))}
                </div>
              </Section>
            ) : null}

            {contacts.hasContactForm ? (
              <Section
                title="Formulaire de contact"
                icon={<MessageSquare className="size-3.5" aria-hidden />}
                full
              >
                <Badge variant="outline">Présent sur le site</Badge>
              </Section>
            ) : null}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  icon,
  full = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </dt>
      <dd className="mt-2 flex flex-col items-start gap-1.5">{children}</dd>
    </div>
  );
}
