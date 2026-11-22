# 00 — État des lieux réel (22 novembre 2026)

Source : dépôt `qrfolio` (branche `main`, dernier commit v325), lecture du code et commandes exécutées le 22/11/2026. Le pack « QROWG UX V2 » a été rédigé sans accès au dépôt ; ce document le confronte au code. Chaque ligne cite le fichier qui fait foi.

## Pile vérifiée

| Élément | Constat | Preuve |
|---|---|---|
| Monorepo | Turborepo, application unique `apps/web` | `package.json` (scripts `dev`/`lint` via turbo) |
| Framework | Next 16.3.5 (Turbopack), App Router, React 18.3 | `apps/web/package.json`, `apps/web/AGENTS.md` |
| Base / auth / fichiers | Supabase (Postgres + RLS), 70 migrations | `supabase/migrations/` |
| Paiement | Stripe Checkout + portail client + webhook | `app/api/stripe/checkout`, `app/api/stripe/portal`, `app/api/webhooks/stripe/route.ts` |
| Hébergement | Vercel, fonctions en `cdg1` (Paris) depuis v309 | `vercel.json` (`"regions": ["cdg1"]`) |
| Tests unitaires | Vitest, 492 fichiers, 7 570 tests verts | `npm test` (exécuté le 22/11) |
| Tests navigateur | Playwright, 83 specs, projets `desktop` + `mobile` (390×844) | `e2e/`, `playwright.config.ts` |
| Types | `tsc --noEmit` à 0 erreur, `ignoreBuildErrors: false` | `npm run type-check` |

Chemins ci-dessous relatifs à `apps/web/src/`.

## Parcours et fichiers qui les portent

| Parcours | Fichiers principaux |
|---|---|
| Marketing | `app/HomeClient.tsx`, `app/features`, `app/examples`, `app/qr-code/[usage]` (source `app/qr-code/verticals.ts`), `app/generateur-qr-code` |
| Création sans compte | `app/creer` (galerie), `app/dashboard/templates/page.tsx` (`NamingModal`, `TemplateWizardModal`), `app/dashboard/onboarding` (parcours par objectif), `app/dashboard/builder/new` |
| Éditeur | `app/dashboard/builder/BuilderV4.tsx` + `builderPanels.tsx`, `builderMobile.ts`, `blockDefs.ts` (143 types de blocs) |
| Sauvegarde | `app/dashboard/builder/saveController.ts` (sérialisation single-flight), `savePage.ts` (upsert par identifiant, contrôle de version `updated_at` → `CODE_CONFLIT`) |
| Publication | `app/dashboard/builder/publish.ts` (garde anti double-clic, étapes « enregistrer » puis « publier » distinctes), `publishActions.ts` (revalidation) |
| Page publique | `app/[slug]/page.tsx` + `lecturePublique.ts` (lecture mémoïsée, blocs visibles triés), `PublicPageClient.tsx` ; nonce CSP dans `middleware.ts` |
| Redirection QR | `app/q/[code]` ; propriétaire non compté (`lib/visiteurDeLaMaison.ts`) ; source par support (`?s=`) |
| QR studio | `app/dashboard/qr-codes` (`QRStudioZero`), moteur de lisibilité `qrScannability.ts` |
| Atelier d'impression | `app/dashboard/print-studio` (`PrintStudioClient.tsx`, `catalog.ts`, contrôle `printPreflight`) |
| Ma carte (usage quotidien) | `app/dashboard/pages/[id]/carte` (épuisé, prix, ajout, collage de carte) |
| Statistiques | `app/dashboard/analytics` (`analyticsAgg.ts`, `SupportPanel.tsx` / `supportFunnel`), table `page_events` |
| Offres et droits | `lib/plans.ts` (source unique des prix, aussi lue par les CGU), `lib/quota.ts` (QR actifs), `lib/pauseDesPages.ts`, `lib/pauseDeQuota.ts` |
| Équipe | `app/dashboard/team`, `lib/team.ts`, migrations `team_*` (RLS) |

## Offres, droits, cycle de vie (constat)

- **Prix.** Ils viennent de `lib/plans.ts` : 0 / 4,90 / 12,90 / 29,90 € par mois. Les CGU les lisent dans ce même fichier (`app/terms/page.tsx`, « Prix LUS depuis lib/plans.ts »). La page en ligne `/terms` (mise à jour du 14/11/2026) affiche les mêmes montants que l'accueil.
- **Rétrogradation.** Le webhook (`app/api/webhooks/stripe/route.ts`, `reconcileDynamicLinks` et `planPagesReconcile`) met en pause les excédents les plus récents, avec le motif `quota`. Il prévient ensuite le gérant par e-mail (`prevenirQrCoupes` : « reprendre un plan qui les couvre les rallume »).
- **Événements Stripe périmés ou rejoués.** Ils sont ignorés et journalisés (`evenement perime ignore`, `annulation d'un ancien abonnement ignoree`). Un rejeu retrouve l'état déjà écrit et n'envoie rien.

## Brouillon et version publique (constat important)

Il n'existe **pas** de version publiée séparée du brouillon :
- `savePage.ts` écrit directement dans `pages` et `blocks`.
- `lecturePublique.ts` lit ces mêmes tables.
- La page publique est rendue à chaque requête, à cause du nonce CSP.

Conséquence : sur une page déjà publiée, chaque sauvegarde automatique est **visible des visiteurs immédiatement**. C'est voulu pour « Ma carte » (épuisé d'un toucher, sans republier). Dans l'éditeur, en revanche, le bouton « Mettre à jour la page » laisse croire qu'une étape reste nécessaire. Voir `05_DECISIONS_HUMAINES.md`, D1.

## Ce qui n'a pas pu être vérifié

- **Rien n'a été exécuté contre une base réelle :** le projet Supabase de `.env.local` n'existe plus. Les écrans connectés sont testés avec une session simulée (`e2e/sessionSimulee.ts`) et des bancs d'essai (`/e2e-harness/*`, 404 en production).
- **Ni appareil iOS ou Android réel, ni impression physique.**
- **Ni Stripe en mode test, ni RLS rejouées entre deux comptes réels** pendant cet audit.
