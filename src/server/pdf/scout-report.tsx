import {
  Document,
  Image,
  Line,
  Page,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { AnalysisResult } from "@/lib/types";
import { COLORS, ensureFontsRegistered, styles } from "./styles";

// A4 dimensions in points
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const GRID_STEP = 64;

type Props = {
  result: AnalysisResult;
  logoUrl: string;
};

/**
 * Document PDF Scout - rapport complet d'une analyse, identique
 * visuellement à l'app web (palette, carreau de fond, fonts, ton).
 */
export function ScoutReport({ result, logoUrl }: Props) {
  ensureFontsRegistered();

  const generatedAt = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={`Rapport Scout — ${result.company.name}`}
      author="Scout × Youno"
      creator="Scout"
      producer="Scout"
    >
      {/* Couverture */}
      <Page size="A4" style={styles.page}>
        <GridBackground />
        <BrandHeader logoUrl={logoUrl} />

        <Text style={styles.coverTitle}>{result.company.name}</Text>
        <Text style={styles.coverSubtitle}>
          {prettyUrl(result.finalUrl)} · Rapport généré le {generatedAt}
        </Text>

        <ScoreCover icp={result.icp} />

        <Text style={styles.sectionTitle}>Brief commercial</Text>
        <View style={styles.card}>
          <Text style={styles.body}>{result.company.longDescription}</Text>
        </View>

        <CompanyMetaCard result={result} />

        <PageFooter generatedAt={generatedAt} />
      </Page>

      {/* Page 2 : Score détaillé + Signaux */}
      <Page size="A4" style={styles.page}>
        <GridBackground />

        <Text style={styles.sectionTitle}>Score ICP détaillé</Text>
        <ScoreBreakdown icp={result.icp} />

        <Text style={styles.sectionTitle}>Signaux GTM détectés</Text>
        <SignalsTable signals={result.signals} />

        <PageFooter generatedAt={generatedAt} />
      </Page>

      {/* Page 3 : Stack + Personnes + Contacts */}
      <Page size="A4" style={styles.page}>
        <GridBackground />

        <Text style={styles.sectionTitle}>Stack technique</Text>
        <TechStackList techStack={result.techStack} />

        <Text style={styles.sectionTitle}>Personnes identifiées</Text>
        <PeopleList people={result.people} />

        <Text style={styles.sectionTitle}>Contacts publics</Text>
        <ContactsList contacts={result.contacts} />

        <PageFooter generatedAt={generatedAt} />
      </Page>

      {/* Page 4 : Légal + Enrichments */}
      <Page size="A4" style={styles.page}>
        <GridBackground />

        <Text style={styles.sectionTitle}>Informations juridiques</Text>
        <LegalCard legal={result.legal} />

        {result.enrichment ? (
          <>
            <Text style={styles.sectionTitle}>Enrichissements externes</Text>
            <EnrichmentCard enrichment={result.enrichment} />
          </>
        ) : null}

        <PageFooter generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Composants visuels
// ──────────────────────────────────────────────────────────────────────

function GridBackground() {
  const vLines = Math.ceil(PAGE_WIDTH / GRID_STEP);
  const hLines = Math.ceil(PAGE_HEIGHT / GRID_STEP);
  return (
    <Svg
      style={{ position: "absolute", top: 0, left: 0 }}
      width={PAGE_WIDTH}
      height={PAGE_HEIGHT}
    >
      {Array.from({ length: vLines + 1 }).map((_, i) => (
        <Line
          key={`v${i}`}
          x1={i * GRID_STEP}
          y1={0}
          x2={i * GRID_STEP}
          y2={PAGE_HEIGHT}
          strokeWidth={0.5}
          stroke="#D05C35"
          strokeOpacity={0.1}
        />
      ))}
      {Array.from({ length: hLines + 1 }).map((_, i) => (
        <Line
          key={`h${i}`}
          x1={0}
          y1={i * GRID_STEP}
          x2={PAGE_WIDTH}
          y2={i * GRID_STEP}
          strokeWidth={0.5}
          stroke="#D05C35"
          strokeOpacity={0.1}
        />
      ))}
    </Svg>
  );
}

function BrandHeader({ logoUrl }: { logoUrl: string }) {
  return (
    <View style={styles.brandHeader}>
      <Image src={logoUrl} style={styles.brandLogo} />
      <Text style={styles.brandTagline}>Rapport Scout × Youno</Text>
    </View>
  );
}

function PageFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>Scout — un module Youno · {generatedAt}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

function ScoreCover({ icp }: { icp: AnalysisResult["icp"] }) {
  const verdictLabel = verdictToLabel(icp.verdict);
  return (
    <View style={styles.coverScoreCard}>
      <Text style={styles.coverScoreLabel}>Score ICP — SaaS B2B mid-market</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          marginTop: 6,
        }}
      >
        <Text style={styles.coverScoreBig}>{icp.total}</Text>
        <Text style={styles.coverScoreUnit}>/ 100</Text>
      </View>
      <Text style={styles.coverVerdict}>{verdictLabel}</Text>
      <Text style={[styles.bodyMuted, { marginTop: 6 }]}>{icp.rationale}</Text>
    </View>
  );
}

function CompanyMetaCard({ result }: { result: AnalysisResult }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionSubtitle}>Fiche d&apos;identité</Text>
      <KVRow label="Industrie" value={result.company.industry} />
      <KVRow label="Modèle" value={result.company.businessModel} />
      <KVRow label="Taille estimée" value={result.company.estimatedSize} />
      <KVRow label="Cible" value={result.company.targetAudience} />
      <KVRow
        label="Pricing public"
        value={result.company.pricingPublicly ? "Oui" : "Non"}
      />
    </View>
  );
}

function ScoreBreakdown({ icp }: { icp: AnalysisResult["icp"] }) {
  return (
    <View style={styles.card}>
      {icp.breakdown.map((entry, i) => (
        <View
          key={`${entry.category}-${i}`}
          style={[
            styles.signalRow,
            i === icp.breakdown.length - 1 ? styles.signalRowLast : {},
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.signalLabel}>{entry.category}</Text>
            <Text style={[styles.bodyMuted, { fontSize: 9, marginTop: 2 }]}>
              {entry.reasoning}
            </Text>
          </View>
          <Text style={styles.signalMeta}>
            {entry.score} / {entry.maxScore}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SignalsTable({ signals }: { signals: AnalysisResult["signals"] }) {
  const selected = signals.filter((s) => s.selected);
  if (selected.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.bodyMuted}>Aucun signal sélectionné.</Text>
      </View>
    );
  }
  const sorted = [...selected].sort((a, b) => {
    if (a.detected !== b.detected) return a.detected ? -1 : 1;
    return b.weight - a.weight;
  });
  return (
    <View style={styles.card}>
      {sorted.map((signal, i) => (
        <View
          key={signal.id}
          style={[
            styles.signalRow,
            i === sorted.length - 1 ? styles.signalRowLast : {},
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.signalLabel}>{signal.label}</Text>
            {signal.value ? (
              <Text
                style={[styles.bodyMuted, { fontSize: 9, marginTop: 2 }]}
              >
                {signal.value}
              </Text>
            ) : null}
            {signal.evidence ? (
              <Text
                style={[styles.bodyMuted, { fontSize: 8, marginTop: 1 }]}
              >
                {signal.evidence}
              </Text>
            ) : null}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              width: 90,
              justifyContent: "flex-end",
            }}
          >
            <Text
              style={[
                styles.badge,
                signal.detected ? styles.badgeOk : styles.badgeMuted,
              ]}
            >
              {signal.detected ? "Détecté" : "Non détecté"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TechStackList({
  techStack,
}: {
  techStack: AnalysisResult["techStack"];
}) {
  if (techStack.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.bodyMuted}>Aucun outil détecté.</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      {techStack.map((group, i) => (
        <View
          key={group.category}
          style={{
            marginBottom: i === techStack.length - 1 ? 0 : 8,
            paddingBottom: i === techStack.length - 1 ? 0 : 8,
            borderBottomWidth: i === techStack.length - 1 ? 0 : 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <Text style={styles.sectionSubtitle}>
            {humanizeCategory(group.category)}
          </Text>
          <View style={styles.badgeRow}>
            {group.items.map((item) => (
              <Text key={item.name} style={styles.badge}>
                {item.name}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function PeopleList({ people }: { people: AnalysisResult["people"] }) {
  if (people.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.bodyMuted}>
          Aucune personne explicitement nommée sur la page.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      {people.map((person, i) => (
        <View
          key={`${person.fullName}-${i}`}
          style={[
            styles.signalRow,
            i === people.length - 1 ? styles.signalRowLast : {},
          ]}
        >
          <Text style={styles.signalLabel}>{person.fullName}</Text>
          <Text style={[styles.signalMeta, { width: 220, textAlign: "right" }]}>
            {person.role ?? ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ContactsList({
  contacts,
}: {
  contacts: AnalysisResult["contacts"];
}) {
  const hasEmails = contacts.emails.length > 0;
  const hasPhones = contacts.phones.length > 0;
  if (!hasEmails && !hasPhones) {
    return (
      <View style={styles.card}>
        <Text style={styles.bodyMuted}>Aucun contact public détecté.</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      {hasEmails ? (
        <>
          <Text style={styles.sectionSubtitle}>Emails</Text>
          <Text style={[styles.body, { marginBottom: hasPhones ? 8 : 0 }]}>
            {contacts.emails.join("  ·  ")}
          </Text>
        </>
      ) : null}
      {hasPhones ? (
        <>
          <Text style={styles.sectionSubtitle}>Téléphones</Text>
          <Text style={styles.body}>{contacts.phones.join("  ·  ")}</Text>
        </>
      ) : null}
    </View>
  );
}

function LegalCard({ legal }: { legal: AnalysisResult["legal"] }) {
  const entries: Array<[string, string | undefined]> = [
    ["Raison sociale", legal.legalName],
    ["Forme juridique", legal.legalForm],
    ["N° immatriculation", legal.registrationNumber],
    ["TVA intra-co.", legal.vatNumber],
    ["Capital social", legal.shareCapital],
    ["RCS", legal.rcs],
    ["Adresse siège", legal.headquartersAddress],
    ["Directeur de publication", legal.publicationDirector],
    ["Hébergeur", legal.hostingProvider],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  if (entries.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.bodyMuted}>
          Mentions légales non trouvées sur le site cible.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {entries.map(([label, value]) => (
        <KVRow key={label} label={label} value={value} />
      ))}
    </View>
  );
}

function EnrichmentCard({
  enrichment,
}: {
  enrichment: NonNullable<AnalysisResult["enrichment"]>;
}) {
  const blocks: React.ReactNode[] = [];

  if (enrichment.companyEnrich) {
    const ce = enrichment.companyEnrich;
    blocks.push(
      <View key="ce" style={{ marginBottom: 8 }}>
        <Text style={styles.sectionSubtitle}>CompanyEnrich</Text>
        <KVRow label="Nom légal" value={ce.legalName} />
        <KVRow label="Description" value={ce.description} />
        <KVRow label="Effectifs" value={ce.employees} />
        <KVRow label="Fondation" value={ce.founded} />
        <KVRow label="Localisation" value={ce.location} />
        <KVRow label="LinkedIn" value={ce.linkedinUrl} />
        <KVRow label="Twitter" value={ce.twitterUrl} />
      </View>
    );
  }

  if (enrichment.hunter && enrichment.hunter.emails.length > 0) {
    blocks.push(
      <View key="hunter">
        <Text style={styles.sectionSubtitle}>
          Hunter — {enrichment.hunter.emails.length} email
          {enrichment.hunter.emails.length > 1 ? "s" : ""}
        </Text>
        {enrichment.hunter.emails.slice(0, 20).map((entry, i) => (
          <Text key={`hunter-${i}`} style={styles.body}>
            {entry.email}
            {entry.firstName || entry.lastName
              ? ` — ${[entry.firstName, entry.lastName]
                  .filter(Boolean)
                  .join(" ")}`
              : ""}
            {entry.position ? ` · ${entry.position}` : ""}
          </Text>
        ))}
      </View>
    );
  }

  if (blocks.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.bodyMuted}>
          Aucune donnée d&apos;enrichissement récupérée.
        </Text>
      </View>
    );
  }

  return <View style={styles.card}>{blocks}</View>;
}

function KVRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    return url;
  }
}

function verdictToLabel(verdict: AnalysisResult["icp"]["verdict"]): string {
  switch (verdict) {
    case "strong-fit":
      return "Strong fit — prioriser immédiatement";
    case "good-fit":
      return "Good fit — bon prospect, à qualifier";
    case "partial-fit":
      return "Partial fit — match partiel, à creuser";
    default:
      return "Poor fit — peu prioritaire";
  }
}

function humanizeCategory(category: string): string {
  const map: Record<string, string> = {
    "framework": "Framework",
    "analytics": "Analytics",
    "marketing": "Marketing",
    "hosting": "Hébergement",
    "payment": "Paiement",
    "support": "Support",
    "crm": "CRM",
    "automation": "Marketing automation",
  };
  return map[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}
