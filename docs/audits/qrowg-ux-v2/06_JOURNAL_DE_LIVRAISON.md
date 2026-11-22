# 06 — Journal de livraison

## v325 — Menu au téléphone (22/11/2026)

- **Tickets :** MOB-003, DES-003.
- **Problème :** connecté, le ☰ du haut ouvrait la même navigation que la barre du bas et sa feuille « Plus ». « Plus » annonçait l'abonnement dans Profil, alors qu'il est dans Paramètres.
- **Changement :**
  - `DashboardShell.tsx` : le ☰ n'est plus affiché qu'aux visiteurs sans compte.
  - `MobileNav.tsx` : Paramètres avant Profil, sous-titres justes (`SOUS_TITRE_PARAMETRES`, partagé avec `DashboardClient.tsx`).
- **Tests :**
  - `e2e/unSeulMenu.spec.ts` (3) + `e2e/barreDuBas.spec.ts` (3) : PASS ;
  - Vitest 7 570 : PASS ; tsc : PASS.
- **Captures :** coquille réelle avec session simulée, au téléphone et sur ordinateur.
- **Retour arrière :** `git revert` du commit, sans effet sur les données.

## v326 — Des promesses vraies sur le site public (22/11/2026)

- **Tickets :** TRUTH-007, TRUTH-008 (OBS-009, OBS-013), constats C-01, C-02.
- **Problème :**
  - pied de page de l'accueil : quatre « (bientôt) » (Blog, À propos, Roadmap, Changelog) au rang des vrais liens ;
  - un feu vert « tout fonctionne » écrit en dur, vert même en panne ;
  - un « v1.0.0 » sans réalité ;
  - « Exemples » en double de « Modèles » ;
  - page « QR code menu » : « s'ouvre en moins d'une seconde après le scan, même en 4G », alors que la mesure donne 1,2-1,5 s au premier scan après une pause.
- **Changement :**
  - `app/HomeClient.tsx` : colonne « Entreprise » et « Blog » retirés, feu vert et version retirés, doublon retiré, grille passée à 5 colonnes, styles orphelins supprimés ;
  - `app/qr-code/verticals.ts` : « Une page légère qui s'ouvre directement dans le navigateur, sans application à installer. »
- **Tests :**
  - `app/revueP1P2.test.ts` : la garde « bientôt pas cliquable » devient « le pied de page ne promet rien que le produit n'a pas », plus une garde « aucune promesse de vitesse chiffrée sans mesure » ;
  - Vitest 7 571 : PASS ; tsc : PASS.
- **Vérification visuelle :** pied de page capturé sur ordinateur (5 colonnes) et au téléphone (accordéons). Les deux avertissements de la console sont propres au mode développement (CSP sans `unsafe-eval`, script de débogage Vercel) et existaient avant.
- **Effet SEO :** aucune URL supprimée. Seuls des `<span>` sans lien et un doublon de lien ont été retirés.
- **Retour arrière :** `git revert` du commit.
- **Reste :**
  - D1 (édition en direct d'une page publiée) ;
  - D2 (texte de confidentialité) ;
  - D3 (rétrogradation) ;
  - le passage « client attablé ».

## v327 — Modifier une page en ligne : l'éditeur dit la vérité (22/11/2026)

- **Tickets :** DATA-006 / EDIT-005 (décision D1, option A).
- **Problème :** une page publiée n'a pas de copie publique séparée. Ce qui est enregistré est visible des clients aussitôt : en production, `/the-red-fish` répond `Cache-Control: private, no-store` et `X-Vercel-Cache: MISS` à chaque requête. La fenêtre Publier proposait pourtant « Mettre à jour la page », comme s'il restait une étape avant que les clients voient les changements.
- **Changement :**
  - `builderUx.ts` : constantes `PHRASE_EN_DIRECT` (« Vos modifications sont visibles par vos clients dès qu'elles sont enregistrées. ») et `LIBELLE_ENREGISTRER_EN_LIGNE` (« Enregistrer maintenant »).
  - `BuilderV4.tsx` : sous-titre de la fenêtre Publier, bouton et état « Enregistrement… », bulle d'aide du bouton « Publié ».
  - `MobileBuilderShell.tsx` : même texte. Ce fichier ne s'affiche que derrière le drapeau de refonte, désactivé.
  - Le comportement du bouton est inchangé : il force l'enregistrement puis revalide.
- **Tests :**
  - `modificationsEnDirect.test.ts` : la prémisse (enregistrement dans `blocks`, lus par la page publique) et l'absence de « Mettre à jour la page » ;
  - Vitest 7 573 : PASS ; tsc : PASS.
- **Non vérifié à l'écran :** la fenêtre d'une page déjà publiée exige une page publiée en base, et il n'y en a plus en local. La modification ne touche que du texte dans des éléments existants.
- **Retour arrière :** `git revert`. Si l'option D1-B est un jour lancée, la garde de prémisse tombera et rappellera de changer la phrase.
- **Reste :** `builderUx.resolvePublishStatus` (refonte désactivée) garde l'état « Mettre à jour la page » pour `hasUnpublishedChanges`, une notion sans objet tant qu'il n'y a pas de brouillon séparé. À revoir si la refonte est activée.

## v328 — Passage « client attablé », premier relevé (22/11/2026)

- **Tickets :** PUB-002, PUB-003, PUB-007, A11Y-008 (en partie).
- **Relevé** sur la vraie page en ligne de The Red Fish, à 320 et 390 px (profil iPhone 13) :
  - aucun débordement horizontal ;
  - 0 cible tactile sous 44 px (17 commandes) ;
  - les rubriques de la carte, repliées avec leur nombre de produits, apparaissent dès le 2e écran : un défilement plus un toucher jusqu'à un prix ;
  - 11 petits libellés à 11-11,5 px, tous secondaires (compteurs « N produits », « Aujourd'hui »).
- **Corrigé :** le badge « PRINCIPAL », écrit en dur sur la carte du réseau mis en avant (vocabulaire d'éditeur, aucune information pour le client), est retiré des trois rendus : `shared-renderer/blocks/social_feature`, `[slug]/renduLegacy.tsx` et `builderPreview.tsx`.
- **Non corrigé, car c'est du contenu et non le produit :** les prix des pinsas s'écrivent « 12.00€ ». C'est le texte saisi par le gérant, affiché tel quel par `PublicCarteIllustree`. Conseil au gérant : « 12,00 € », à corriger dans Ma carte.
- **Tests :**
  - garde `[slug]/clientAttable.test.ts` ;
  - Vitest (`app/`, 5 273) : PASS ; tsc : PASS ;
  - capture du bloc sur le banc `/e2e-harness/bloc?type=social_feature`.
- **Retour arrière :** `git revert`.
- **Reste du passage :** formats 25/50 cl dans un modèle bar, zoom 200 %, modèles resto autres que Red Fish.

## v329 — Passage « client attablé » : les 9 modèles bar et resto à 320 px (22/11/2026)

- **Tickets :** PUB-003, SECT-002, EDIT-007, A11Y-008 (reflow à 320 px).
- **Relevé :** les 9 modèles (`resto_bistrot`, `_fastfood`, `_kebab`, `_tacos`, `_pizza`, `_vins`, `_brasserie`, `_pub`, `_bar`), rendus sur `/examples/<clé>` à 320 px, en contexte tactile :
  - aucun défilement de côté ;
  - aucune commande sous 24 px (le minimum WCAG 2.5.8) ;
  - les formats 25 / 50 cl du pub s'affichent en colonnes alignées, avec des prix au format français (« 4,50 € »).
- **Corrigé :** les deux seules cibles sous 44 px étaient les liens du bandeau de démonstration (« ← Tous les exemples », « Utiliser ce modèle », 32 px). Ils passent à 44 px sous le doigt avec la primitive `.cible-doigt` ; rien ne change à la souris.
- **Tests :**
  - garde `e2e/modelesRestoA320.spec.ts` : PASS ;
  - `lib/cibleDoigt.test.ts` : PASS ; tsc : PASS.
- **Limite :** le zoom à 200 % d'un vrai téléphone n'est pas simulé. Une largeur de 320 px est l'équivalent WCAG du reflow, mais pas un appareil réel.
- **Fin du passage « client attablé »** pour la restauration. Reste à faire sur appareil réel (D5).

## v330 — Livret d'accueil : un code d'accès écrit en clair est signalé avant de publier (22/11/2026)

- **Ticket :** SECT-005.
- **Constat :** l'essentiel existait déjà. Le champ « Code » du bloc Infos séjour est masqué sur la page (« Afficher le code »), avec l'aide « changez-le entre deux séjours ». Mais un code tapé en texte libre (« Digicode 4521 » dans « Accès » ou dans un bloc de texte) s'affichait en clair à quiconque scanne.
- **Changement :**
  - `codeEnClair.ts` (module pur) repère un mot de code (digicode, code de porte, de portail, de boîte à clés, d'alarme…) suivi de 3 à 8 chiffres. Il ignore le champ « Code » prévu, le Wi-Fi (le publier est le but du bloc) et les phrases sans chiffres.
  - `AlertesPublication.tsx` ajoute la ligne « Code d'accès écrit en clair (« … ») : toute personne qui scanne le QR le lira. Mettez-le dans le champ « Code » du bloc Infos séjour, masqué sur la page ». La typographie passe par `typoFr`, pour que le guillemet ne se sépare pas du code.
  - Rien ne bloque la publication : c'est une alerte, comme les autres.
- **Tests :**
  - `codeEnClair.test.ts` (4) : détection, silences (Wi-Fi, SMS, champ prévu, horaires), remontée dans les alertes, et aucune alerte sur les 3 livrets livrés ;
  - `e2e/codeEnClair.spec.ts` : la fenêtre « Publier » d'un brouillon invité montre l'alerte (capture) ;
  - `e2e/pointsAvantPublier.spec.ts` : PASS ;
  - Vitest complet 7 578 : PASS ; tsc : PASS.
- **Retour arrière :** `git revert`.

## v331 — Budget JavaScript de la page publique, vérifié à chaque build (22/11/2026)

- **Ticket :** PERF-006 (référence pour PERF-003).
- **Mesure de référence :** `next build` du 22/11, lu dans les manifestes du build.
  - Socle de `/[slug]` (rootMainFiles + layout + page) : **13 fichiers, 717 Ko bruts, 221 Ko gzip**, dont environ 115 Ko de React et Next.
  - En production, The Red Fish chargeait 18 scripts, soit 281 Ko gzip : le socle plus les blocs propres à la page.
- **Changement :**
  - `apps/web/scripts/budget-page-publique.mjs` mesure ce socle et **échoue au-delà de 232 Ko gzip** (mesure + 5 %). Si les manifestes sont illisibles après une montée de version de Next, il prévient sans bloquer.
  - Branché à la fin de `npm run build`. Vercel lance `pnpm run build` à la racine (journal du déploiement `dpl_G5ZqtLuzMm77gZsyRBYhqCHZNwY6`), donc le contrôle tourne à chaque déploiement.
  - Commande isolée : `npm run budget:page-publique`.
  - **Cliquet :** on n'augmente pas le plafond ; on l'abaisse quand une optimisation le permet.
- **Tests :**
  - script exécuté sur le build : 221 Ko, PASS ;
  - copie avec un plafond à 100 Ko : sortie 1 et message, PASS ;
  - `lib/budgetPagePublique.test.ts` (plafond ≤ 232, branchement au build) : PASS.
- **Retour arrière :** retirer `&& node scripts/budget-page-publique.mjs` du script `build`.
- **Piste suivante (PERF-003) :** environ 100 Ko gzip de code propre à la page (rendu commun des blocs, liste des réseaux, liste des intégrations) sont chargés même quand la page n'utilise pas ces blocs. Ce sont des candidats à `next/dynamic`, à mesurer avant et après.

## v332 — Page publique : 28 Ko de moins à chaque scan (22/11/2026)

- **Ticket :** PERF-003 (1er lot).
- **Diagnostic :** `next experimental-analyze --output` (analyseur intégré de Next 16), puis lecture des imports.
  - Le plus gros fichier propre à la page (100 Ko bruts) contenait les modèles d'affichage de presque tous les blocs (`shared-renderer/models/*`), alors que chaque bloc est déjà chargé à la demande.
  - Cause : `PublicPageClient` importait `pageQuiMontreQuelqueChose` pour décider d'afficher « Cette page est en préparation ». Cette règle passe par `hasPublishableContent` (`blockEmptyState.ts`), qui importe les modèles des 146 blocs. Tout partait chez le client pour un seul booléen.
- **Changement :**
  - Le serveur (`[slug]/page.tsx`) pose la question et passe la réponse en prop `montreQuelqueChose` (obligatoire : TypeScript signale tout appelant qui l'oublie).
  - Les 5 autres appelants (aperçu proposé, démo `/examples`, 3 bancs d'essai) sont des composants client : ils calculent la réponse eux-mêmes. Seuls leurs écrans embarquent la règle.
  - La règle et la phrase affichée ne changent pas.
- **Mesure (build de production) :** socle `/[slug]` **717 → 628 Ko bruts, 221 → 193 Ko gzip** (−28 Ko). Plafond du budget abaissé de 232 à **203 Ko**.
  - Un bloc présent sur la page charge toujours son propre modèle avec lui, à part. Le gain réel sur une page donnée se lira en production après déploiement (The Red Fish : 281 Ko avant).
- **Tests :**
  - `poidsDuScan.test.ts` : `PublicPageClient` n'importe plus la règle ni `blockEmptyState` ;
  - `pageQuiNeMontreRien.test.tsx` : le serveur pose la question, et le vrai composant rendu affiche la phrase quand la réponse est non, et ne l'affiche pas sinon ;
  - `budgetPagePublique.test.ts` : plafond ≤ 203 ;
  - e2e page publique (avant JavaScript, heure sans mismatch, intro sans script, horaires, cibles au pouce, modèles resto à 320 px) : 30 PASS, 6 ignorés par projet ;
  - Vitest complet 7 581 : PASS ; tsc : PASS ; `pnpm run build` : PASS.
- **Retour arrière :** `git revert` (remettre aussi le plafond à 232 dans le même revert).
- **Reste (PERF-003, lots suivants) :** 63 Ko gzip propres à la page (193 Ko bruts, 6 fichiers) : `types.ts` (18 Ko, fonctions d'affichage communes), le moteur de l'animation d'intro (chargeable seulement si la page en a une), `blocsPublics.tsx` (formulaires, 11 Ko).

## v333 — Page publique : l'animation d'entrée ne part qu'avec les pages qui en ont une (22/11/2026)

- **Ticket :** PERF-003 (2e lot).
- **Changement :** `PublicPageClient` charge `PageIntro` avec `dynamic()`, sans `ssr:false`. Le composant ne rend rien et tout se passe dans un `useEffect`. Pendant le chargement, l'écran-logo serveur (`couverture-intro`) reste affiché, avec son filet CSS si le script n'arrive jamais.
- **Mesure (build de production) :** socle `/[slug]` **193 → 188 Ko gzip** (628 → 613 Ko bruts). Plafond abaissé de 203 à **197 Ko**.
- **Vérifié sur le build de production** (`next start`, bancs autorisés) :
  - sans intro : 28 scripts, aucun ne contient le moteur ;
  - avec intro : 29 scripts, le moteur arrive ;
  - l'animation se joue (capture en plein tracé) puis laisse la page, en desktop et en mobile.
- **Constat hors lot :** en dev, l'intro ne s'affiche pas. React StrictMode exécute l'effet deux fois : le premier passage marque l'intro « déjà vue » dans la session, le démontage retire l'overlay, et le second passage ne fait rien. C'est sans effet en production, et c'était déjà le cas avant ce lot (vérifié sur le code d'avant).
- **Tests :**
  - garde `poidsDuScan.test.ts` : plus d'import statique de `PageIntro` ;
  - `budgetPagePublique.test.ts` : plafond ≤ 197 ;
  - e2e `introSansScript` (sans JavaScript, animations réduites, avec JavaScript), `avantLeJavascript`, `heureSansMismatch` : 22 PASS ;
  - tsc : PASS ; `pnpm run build` : PASS.
- **Retour arrière :** `git revert`.
