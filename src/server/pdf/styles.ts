import { Font, StyleSheet } from "@react-pdf/renderer";

/**
 * Palette Scout / Youno, alignée sur la charte de l'app.
 */
export const COLORS = {
  background: "#F5F5EB",
  card: "#FFFFFF",
  text: "#231312",
  textMuted: "rgba(35, 19, 18, 0.65)",
  textFaint: "rgba(35, 19, 18, 0.45)",
  border: "rgba(35, 19, 18, 0.10)",
  borderStrong: "rgba(35, 19, 18, 0.20)",
  accent: "#CE562F",
  accentLight: "#FFF1EA",
  success: "#22A55E",
  successLight: "#D4F4DD",
  destructive: "#E44B4B",
  destructiveLight: "#FDE2E2",
  grid: "rgba(35, 19, 18, 0.05)",
} as const;

/**
 * Enregistrement des fonts servies depuis l'app (public/fonts).
 * On charge des fichiers WOFF statiques (un par poids) plutôt que des
 * variants Google Fonts CDN : URLs stables, pas de 404 surprise quand
 * Google bump une version, et bundle Vercel toujours <50 MB grâce au
 * cache HTTP standard.
 */
let fontsRegistered = false;

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function ensureFontsRegistered() {
  if (fontsRegistered) return;
  const base = `${getAppUrl().replace(/\/$/, "")}/fonts`;

  // Variable fonts à axe unique (wght). Les variantes multi-axes (opsz + wght)
  // de DM Sans provoquent un bug @react-pdf v4 / fontkit : les ligatures `fi`
  // et `fl` sont rendues comme glyphes de largeur zéro, omettant visuellement
  // le `i` / `l` ("confirmé" → "confrmé", "fit" → "ft", "Cloudflare" →
  // "Cloudfare"). Avec la variante wght-only, fontkit ne gère qu'un seul axe
  // et applique correctement les substitutions OpenType.
  Font.register({
    family: "Rethink Sans",
    fonts: [
      { src: `${base}/RethinkSans-wght.woff2`, fontWeight: 400 },
      { src: `${base}/RethinkSans-wght.woff2`, fontWeight: 600 },
      { src: `${base}/RethinkSans-wght.woff2`, fontWeight: 700 },
      { src: `${base}/RethinkSans-wght.woff2`, fontWeight: 800 },
    ],
  });

  Font.register({
    family: "DM Sans",
    fonts: [
      { src: `${base}/DMSans-wght.woff2`, fontWeight: 400 },
      { src: `${base}/DMSans-wght.woff2`, fontWeight: 500 },
      { src: `${base}/DMSans-wght.woff2`, fontWeight: 700 },
    ],
  });

  // Évite les warnings "missing font" sur certains caractères Unicode.
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}

/**
 * Styles partagés entre tous les composants du document PDF.
 * Les unités sont en points (1pt = 1/72 inch). A4 = 595 × 842 pt.
 */
export const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.background,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "DM Sans",
    fontSize: 10,
    color: COLORS.text,
    position: "relative",
  },
  // Bandeau bas répété sur chaque page
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.textFaint,
  },

  // Bloc logo en tête du document
  brandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brandLogo: { height: 22 },
  brandTagline: {
    fontFamily: "Rethink Sans",
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  // Cover
  coverTitle: {
    fontFamily: "Rethink Sans",
    fontWeight: 700,
    fontSize: 28,
    lineHeight: 1.15,
    color: COLORS.text,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 32,
  },
  coverScoreCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginBottom: 24,
  },
  coverScoreLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  coverScoreBig: {
    fontFamily: "Rethink Sans",
    fontWeight: 800,
    fontSize: 56,
    lineHeight: 1,
    color: COLORS.accent,
  },
  coverScoreUnit: {
    fontFamily: "Rethink Sans",
    fontWeight: 600,
    fontSize: 18,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  coverVerdict: {
    fontFamily: "Rethink Sans",
    fontWeight: 600,
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },

  // Sections
  sectionTitle: {
    fontFamily: "Rethink Sans",
    fontWeight: 700,
    fontSize: 14,
    color: COLORS.text,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  twoCol: { flexDirection: "row", gap: 8 },
  twoColLeft: { flex: 1 },
  twoColRight: { flex: 1 },

  body: { fontSize: 10, lineHeight: 1.55, color: COLORS.text },
  bodyMuted: { fontSize: 10, lineHeight: 1.55, color: COLORS.textMuted },

  kvRow: { flexDirection: "row", marginBottom: 3 },
  kvLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: COLORS.textMuted,
    width: 100,
  },
  kvValue: { fontSize: 9, color: COLORS.text, flex: 1 },

  // Badges (catégories de signaux, etc.)
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 4 },
  badge: {
    backgroundColor: COLORS.accentLight,
    color: COLORS.accent,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: 600,
  },
  badgeOk: {
    backgroundColor: COLORS.successLight,
    color: COLORS.success,
  },
  badgeMuted: {
    backgroundColor: "rgba(35, 19, 18, 0.06)",
    color: COLORS.textMuted,
  },

  // Signal card
  signalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  signalRowLast: { borderBottomWidth: 0 },
  signalLabel: { fontSize: 10, fontWeight: 600, color: COLORS.text, flex: 1 },
  signalMeta: {
    fontSize: 9,
    color: COLORS.textMuted,
    width: 80,
    textAlign: "right",
  },
});
