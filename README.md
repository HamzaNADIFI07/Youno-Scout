# Scout

Account discovery depuis une URL. Scout analyse un site web et produit
un brief commercial exploitable : nom et description de l'entreprise,
stack technique détectée, signaux GTM activés et score ICP explicable.

- Application en ligne : _à compléter après déploiement_
- Démonstration vidéo : _à compléter après enregistrement_

## Aperçu

À partir d'une simple URL (par exemple `stripe.com`), Scout retourne :

- Un brief commercial structuré (nom, proposition de valeur, cible, secteur, modèle économique, taille estimée).
- La stack technique repérée dans le HTML et les en-têtes HTTP (framework, hébergeur, analytics, marketing automation, support, paiement).
- Une liste de signaux GTM : pricing public, offre Enterprise, API documentée, conformité, recrutement actif, etc.
- Un score ICP sur 100 pour un fit "SaaS B2B mid-market", décomposé par catégorie, accompagné d'un verdict.

## Stack et choix techniques

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | API routes et frontend dans un seul déploiement, RSC pour un rendu léger, déploiement Vercel sans configuration. |
| Langage | TypeScript strict | Types partagés entre l'API et l'UI, moins de bugs au runtime. |
| Styles | Tailwind CSS v4 | Itération rapide, design system cohérent, output minimal. |
| Composants | shadcn/ui | Composants accessibles copiés dans le repo (pas de dépendance UI lourde). |
| Validation | Zod | Schémas réutilisés côté serveur (validation de requête, validation du retour LLM) et côté typage. |
| Scraping | `cheerio` + `fetch` natif | Léger, mature, suffisant pour parser le HTML rendu côté serveur. |
| LLM | Groq, modèle `llama-3.3-70b-versatile` | Inférence ultra-rapide, free tier sans carte bancaire, supporte le function calling natif pour garantir un JSON structuré. |
| Hébergement | Vercel | Free tier suffisant, variables d'environnement faciles, cohérent avec Next.js. |

### Architecture

```
URL utilisateur
   |
   v
[1] POST /api/analyze
   |
   v
[2] normalizeUrl  -- validation + blocage des URLs locales
   |
   v
[3] fetchPage     -- fetch HTML avec timeout, gestion redirects, lecture en streaming bornée
   |
   v
[4] extractPage   -- métadonnées (title, description, OG), texte principal, liens internes
   |
   v
[5] detectTechStack  -- pattern matching sur HTML, scripts et en-têtes HTTP
   |
   v
[6] detectSignals    -- règles déterministes sur le contenu et la stack
   |
   v
[7] analyzeWithLlm   -- Llama 3.3 70B via Groq, structured output via function calling, validation Zod
   |
   v
[8] scoreIcp         -- pondération explicable : modèle / signaux / tech / maturité
   |
   v
Réponse JSON structurée
```

L'objectif est volontairement séparé en deux mondes : ce qui peut être
fait de manière déterministe par du code (extraction, détection, scoring)
reste hors LLM. Le LLM est uniquement utilisé là où il est fort :
formuler un brief structuré depuis du texte non structuré. Cela rend le
résultat plus stable et plus auditable.

### Méthode de scoring

Le score ICP de référence est "SaaS B2B mid-market", sur 100 points :

| Catégorie | Poids max | Logique |
| --- | --- | --- |
| Modèle économique | 35 | B2B = 35, B2B2C = 21, marketplace = 14, B2C = 0, inconnu = 7 |
| Signaux GTM | 40 | Somme pondérée des signaux détectés, rapportée à 40 |
| Stack technique | 15 | Framework moderne (6) + analytics produit (4) + hébergement moderne (3) + paiement (2) |
| Maturité | 10 | Marqueurs SOC 2 / études de cas / logos clients / OG configuré |

Verdict : `strong-fit` >= 80, `good-fit` >= 60, `partial-fit` >= 40, sinon `poor-fit`.

Tous les critères et leur justification sont retournés dans la réponse,
ce qui rend le score explicable côté UI.

## Lancer en local

### Prérequis

- Node.js 20 ou supérieur
- npm 10 ou supérieur
- Une clé API Groq (compte gratuit, sans carte bancaire requise)

### Installation

```bash
git clone <url-du-repo>
cd scout
npm install
```

### Configuration

Créez un fichier `.env.local` à partir du modèle fourni :

```bash
cp .env.local.example .env.local
```

Renseignez votre clé Groq (créez-en une gratuitement sur [console.groq.com/keys](https://console.groq.com/keys)) :

```env
GROQ_API_KEY=gsk_...
```

Optionnellement, vous pouvez surcharger le modèle utilisé :

```env
GROQ_MODEL=llama-3.3-70b-versatile
```

### Lancement

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

### Build et démarrage en production

```bash
npm run build
npm start
```

## Tester l'API directement

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "content-type: application/json" \
  -d '{"url":"stripe.com"}'
```

La réponse est un JSON conforme au schéma `AnalysisResult` exporté
depuis `src/lib/types.ts`.

## Structure du code

```
src/
  app/
    api/
      analyze/route.ts       -- endpoint POST /api/analyze
    page.tsx                 -- UI principale (client component)
    layout.tsx               -- layout global, polices, metadata
    globals.css              -- thème shadcn / tailwind v4
  components/
    analyze-form.tsx         -- formulaire de saisie
    empty-state.tsx          -- état initial
    error-banner.tsx         -- état d'erreur
    loading-skeleton.tsx     -- état de chargement
    site-header.tsx
    site-footer.tsx
    result/
      result-view.tsx        -- vue résultat globale
      company-header.tsx     -- en-tête entreprise
      score-card.tsx         -- score ICP et breakdown
      signals-card.tsx       -- liste des signaux GTM
      tech-stack-card.tsx    -- stack technique par catégorie
      description-card.tsx   -- brief commercial long
    ui/                      -- composants shadcn/ui
  lib/
    types.ts                 -- schémas Zod + types TypeScript
    constants.ts             -- patterns tech, définitions de signaux
    format.ts                -- helpers d'affichage
    utils.ts                 -- cn() de shadcn
  server/
    discovery.ts             -- orchestration end-to-end
    scraping/
      fetcher.ts             -- fetch HTML borné, gestion d'erreurs
      extractor.ts           -- extraction cheerio
      tech-stack.ts          -- détection patterns
      signals.ts             -- règles signaux GTM
    llm/
      analyzer.ts            -- appel Claude avec tool_use
    scoring/
      icp-scorer.ts          -- score explicable
```

## Limites actuelles

- **Sites en SPA pure sans SSR** : si le HTML initial est quasi vide
  et que tout est rendu côté client, l'extraction retombe sur très peu
  de contenu et la qualité du brief baisse. Une étape "headless
  browser" (Playwright via Browserless ou Firecrawl) résoudrait ce
  point.
- **Pages secondaires non explorées** : Scout analyse uniquement la
  page d'accueil. Une exploration ciblée de `/pricing`, `/about`,
  `/customers`, `/careers` enrichirait les signaux GTM.
- **Détection tech limitée à des patterns** : pas de fingerprinting
  réseau, pas d'analyse des `link rel=preconnect`, etc. Suffisant pour
  les usages courants mais perfectible.
- **Pas de cache** : chaque requête refait l'analyse complète. En
  production sur Konsole, on stockerait la dernière analyse par
  domaine avec un TTL adaptatif.
- **ICP unique** : le score est calibré sur "SaaS B2B mid-market".
  Une intégration produit permettrait de définir plusieurs profils ICP
  par compte client et de basculer dynamiquement.
- **Internationalisation** : la copy de l'UI est en français, le brief
  LLM est en anglais. Ce mélange est volontaire pour la démo mais
  aligner les deux côtés est trivial.

## Pistes d'amélioration

- Exploration multi-page avec un crawl borné (3 à 5 pages max).
- Mise en cache par domaine sur Vercel KV avec invalidation manuelle.
- Détection passive de signaux additionnels : levée de fonds, offres
  d'emploi actives, changements récents de site.
- Export vers HubSpot ou Attio en un clic via une HubSpot UI Extension
  côté CRM.
- Comparaison de deux comptes côte à côte.
- Historique de recherches récentes en `localStorage`.
- Streaming des résultats partiels pendant l'analyse.
- Tests d'intégration sur quelques URLs de référence.
- Authentification et quotas par utilisateur pour usage interne.

## Pertinence pour Konsole

Cette application est pensée comme un module candidat pour Konsole, le
SaaS Revenue Engineering de Youno. Une intégration naturelle prendrait
la forme :

- Un appel API depuis Konsole vers `/api/analyze` lors de la création
  d'un compte ou d'une opportunité.
- Le score ICP, les signaux et la stack remontent automatiquement dans
  la fiche compte HubSpot via une HubSpot UI Extension.
- Un workflow Cargo se déclenche sur certains signaux pour activer une
  séquence outbound dédiée.

## Licence

Projet privé à finalité de démonstration. Tous droits réservés.
