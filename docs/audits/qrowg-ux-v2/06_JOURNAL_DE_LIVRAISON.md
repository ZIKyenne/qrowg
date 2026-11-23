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

## Mesure en production — The Red Fish, v331 contre v332 (22/11/2026)

- **Méthode :** Playwright (profil mobile), chargement complet de `/the-red-fish`. Corps de tous les scripts additionnés, compressés gzip niveau 9 en local. Même méthode pour les deux déploiements, lus par leur adresse propre.
  - Cette méthode diffère de celle du chiffre « 281 Ko » noté en v331 : ne pas comparer les deux.
- **Résultat :**
  - v331 : 26 scripts, 834 Ko bruts, **264 Ko gzip** ;
  - v332 : 26 scripts, 787 Ko bruts, **254 Ko gzip** (−10 Ko, −47 Ko bruts).
- **Lecture :** le socle a perdu 28 Ko, mais une vraie page récupère, avec ses propres blocs, une partie des modèles d'affichage qui partaient auparavant d'office. Le gain réel par scan sur cette page est donc de 10 Ko gzip.
- v333 (intro chargée à la demande) ne change rien pour The Red Fish, qui a une intro. Le gain de v333 concerne les pages sans intro.

## v334 — QR de lien : la fiche garde les destinations précédentes (22/11/2026)

- **Ticket :** QR-010 (« réassignation identifiable sans données sensibles »).
- **Constat, en corrigeant ma réconciliation :**
  - Les QR de **page** avaient déjà un historique : `qr_codes.dest_history`, 10 entrées, avec restauration. Le tableau de bord et l'API v1 l'alimentent tous les deux.
  - Les QR de **lien** dynamiques (`instant_qrs`, l'offre « QR Dynamique ») n'en avaient aucun. Changer la destination d'un QR imprimé effaçait toute trace de l'adresse précédente.
- **Changement :**
  - Migration **écrite, pas lancée** : `supabase/migrations/20261122120000_instant_qrs_historique.sql`. Elle ajoute une seule colonne, `dest_history jsonb not null default '[]'` ; les politiques RLS existantes s'appliquent.
  - `lib/historiqueDeDestination.ts` (fonctions pures) : entrée `{ url, remplaceeLe }` (rien d'autre, aucune donnée sensible), 10 au plus, rien n'est écrit si l'adresse ne change pas.
  - `api/qr-instant` : le PATCH ajoute l'adresse remplacée à l'historique. GET et PATCH lisent la colonne **avec un repli** : tant que la migration n'est pas passée (erreur 42703 ou PGRST204), tout fonctionne comme avant, sans historique.
  - Fiche du QR (`DestinationsPrecedentes.tsx`) : les 3 dernières adresses, avec « jusqu'au 15 novembre 2026 ». « Revenir » rouvre la boîte « Modifier la destination » pré-remplie : un changement sur un QR imprimé se confirme toujours.
- **Tests :**
  - `lib/historiqueDeDestination.test.ts` : règles, valeurs abîmées, absence de données sensibles, migration additive ;
  - `api/qr-instant/historique.test.ts` : le vrai PATCH contre un faux client Supabase, migration appliquée **et** pas appliquée, renommage seul, même adresse ;
  - `e2e/historiqueDestination.spec.ts` (session simulée) : la fiche montre l'historique, et « Revenir » ouvre la boîte pré-remplie, en desktop et en mobile. À 390 px, la date était coupée (« jusqu'au 1… ») ; elle est passée sur sa propre ligne ;
  - Vitest complet 7 598 : PASS (après tri d'une lecture de dossier signalée par `testsDeterministes`) ; tsc : PASS.
- **À faire par l'utilisateur :** appliquer la migration. Avant, rien ne change pour les clients ; après, l'historique se remplit au premier changement de destination.
- **Retour arrière :** `git revert`. La colonne peut rester, l'application l'ignore.

## v335 — Politique de confidentialité : l'application tourne à Paris (22/11/2026)

- **Ticket :** TRUTH-006, décision **D2 validée par le propriétaire** le 22/11 (« Oui, applique D2 »).
- **Changement :**
  - `lib/editeur.ts` est la source unique de la phrase d'hébergement, reprise par `/privacy`, `/security` et la FAQ des guides. `HEBERGEMENT.application` vaut maintenant « Paris (Vercel, région cdg1) », et la phrase reprend **au mot près** le texte validé, y compris la mention du réseau mondial pour les fichiers statiques.
  - Les trois pages disaient « Vercel iad1, Washington », faux depuis la v309.
  - Dates de révision de `/privacy` et `/security` passées au 22/11/2026 (`lib/datesContenu.ts`).
- **Vérifié sur la page servie :** `/privacy` et `/security` affichent le texte validé, aucune occurrence d'« iad1 », date « 22 novembre 2026 ».
- **Tests :** `editeur.test.ts` vérifie le texte validé mot pour mot, et qu'« iad1 », « États-Unis » ou « Washington » ne reviennent pas ; les tests de confiance, SEO et dates : 120 PASS.
- **Nuance signalée, non appliquée :** le middleware (Edge) s'exécute près du visiteur (voir 05, D2).
- **Retour arrière :** `git revert`.

## v336 — Rétrogradation : l'abonné choisit ce qui reste actif (23/11/2026)

- **Tickets :** QR-004, BILL-006 / 009. Décision **D3, option A**, validée par le propriétaire le 23/11 (« GO » sur la recommandation).
- **Constat :** à la bascule au gratuit, le webhook Stripe éteignait les QR les plus récents au-delà du quota, sans préavis ni choix. Les CGU disent pourtant « l'utilisateur choisissant celles à conserver actives ».
- **Changement :**
  - Migration **écrite, pas lancée** : `supabase/migrations/20261123120000_garde_au_retour.sql`. Elle ajoute `keep_on_downgrade boolean not null default false` sur `instant_qrs` et sur `qr_codes`. Additive ; les politiques RLS existantes s'appliquent.
  - `lib/gardeAuRetour.ts` (fonctions pures) : `gardesDAbord` fait passer les QR choisis en premier, sans changer l'ordre des autres. Les réconciliations existantes (`dynamicReconcile`, `pauseDesPages`) ne changent pas : seule leur entrée est réordonnée.
  - Webhook Stripe : les deux réconciliations lisent le choix, avec un repli. Tant que la colonne n'existe pas, l'ordre reste celui d'avant.
  - `/api/abonnement/garde` : GET liste les QR actifs et permanents ; PUT enregistre le choix, borné à ce que couvre le gratuit (une page, un QR modifiable), filtré sur le compte, et vérifie les lignes réellement écrites.
  - Paramètres → Facturation : sous l'avertissement qui existait déjà, un bouton « Choisir ce qui reste actif ». Il est pré-coché avec ce que la bascule garderait sans choix (les plus anciens) ; un groupe n'apparaît que s'il y a vraiment un choix à faire.
- **Tests :**
  - `lib/gardeAuRetour.test.ts` : ordre, effet réel sur les deux réconciliations (le QR choisi reste, les autres passent en pause), pause manuelle respectée, choix borné, migration additive ;
  - `e2e/choixAuRetour.spec.ts` (session simulée) : choix et enregistrement, sur desktop et mobile, sans débordement à 390 px ;
  - Vitest complet : 7 607 PASS ; 4 échecs de garde-fous de design (demi-pixel, nombre de tailles et de rayons, case à cocher non reconnue) corrigés dans l'écran, plafonds inchangés ; tsc : PASS.
- **À faire par l'utilisateur :** appliquer la migration. Avant, le bouton répond « pas encore disponible » et la bascule fonctionne comme avant.
- **Retour arrière :** `git revert`. Les colonnes peuvent rester.

## v337 — Facture pro : adresse et n° de TVA dans la caisse (23/11/2026)

- **Décision D4**, validée par le propriétaire le 23/11 (« GO a ») : quota, nom « Starter » et statistiques inchangés ; facture pro, option A.
- **Changement :** `api/stripe/checkout` ajoute `billing_address_collection: "required"` et `tax_id_collection: { enabled: true }`. Stripe affiche la case « J'achète en tant qu'entreprise » (raison sociale et n° de TVA, facultatifs) et reporte ces informations sur les factures de l'abonnement. Pour un client Stripe déjà connu, `customer_update: { name: "auto", address: "auto" }` : sans cela, Stripe refuse de collecter le n° de TVA.
- **Tests :** `paiement.test.ts` (2 nouveaux), tests Stripe 16 PASS, tsc PASS.
- **Non vérifié ici :** la caisse réelle. Pas d'accès aux clés, et aucun paiement n'est lancé depuis cette session. À vérifier : ouvrir /upgrade, choisir une formule et constater les champs, sans payer.
- **Réglage Stripe facultatif, côté propriétaire :** autoriser la modification de l'adresse et du n° de TVA dans le portail client (Stripe › Paramètres › Portail client).
- **Retour arrière :** `git revert`.

## v338 — Le plan gratuit dit sa durée : la page est offerte 30 jours (23/11/2026)

- **Urgence U1** de la revue totale (`docs/ROADMAP-PERFECTION.md`). Le propriétaire a tranché le 23/11 : « 30 jours gratuit », annoncés partout.
- **Constat :** depuis le 12/11, `lib/essaiGratuit.ts` met la page gratuite en pause 30 jours après la première publication du compte. Pourtant :
  - `/upgrade` affichait « Plan gratuit sans carte, sans durée » ;
  - ni la grille, ni les FAQ, ni la page bars-restos, ni le pied des pages publiques, ni les CGU n'en parlaient ;
  - une garde de test interdisait « 30 j » dans les plans.

  4 comptes avaient déjà démarré leur période.
- **Ce que dit maintenant le produit, à partir d'une seule source (`DUREE_ESSAI_JOURS`) :**
  - Grille (`lib/plans.ts`) : « Une page et son QR, offerts 30 jours », « 1 page, en ligne 30 jours », « QR vers un lien illimités, sans limite de durée ».
  - `/upgrade` : « Page offerte 30 jours, sans carte ». Bars-restos : « Votre page offerte 30 jours ». Pied des pages publiques : « Créez votre page + QR code : 30 jours offerts ».
  - FAQ de l'accueil et de Contact : la page est en ligne 30 jours à partir de sa première publication, puis en pause jusqu'au choix d'une formule, sans rien réimprimer. Les QR vers un lien restent gratuits sans limite de durée.
  - **CGU** (date de révision passée au 23/11) : nouvelle section « Plan Gratuit ». La résiliation précise que, si les 30 jours sont déjà écoulés, les pages passent en pause.
- **Conséquence découverte et corrigée :** le compteur démarre à la première publication, quel que soit le plan. Un ancien abonné qui revient au gratuit après plus de 30 jours voit donc ses pages passer en pause. L'avertissement de Facturation le dit désormais, et l'écran de choix (v336) ne propose plus de « page qui reste en ligne » dans ce cas.
- **Tests :**
  - `promessesPlan.test.ts` : la garde qui interdisait « 30 j » exige maintenant que la durée soit dite dans la grille, `/upgrade`, bars-restos, les deux FAQ, le pied de page public et les CGU. L'essai par lien reste interdit.
  - `gardeAuRetour.test.ts` mis à jour.
  - `e2e/choixAuRetour.spec.ts` : nouveau cas « jours offerts écoulés », sur desktop et mobile.
  - Pages servies vérifiées : `/upgrade`, `/bars-et-restaurants`, `/terms`, `/contact`.
  - Vitest complet : 7 614 PASS ; tsc : PASS.
- **Reste :** l'e-mail envoyé après la bascule d'un ancien abonné invite encore à « choisir ses pages actives », même quand elles sont en pause faute de jours offerts. Lot suivant.
- **Retour arrière :** `git revert`.

## v339 — L'e-mail de bascule dit la vérité quand les 30 jours sont écoulés (23/11/2026)

- **Suite de v338.** Un ancien abonné qui revient au gratuit après ses 30 jours de page offerts a **toutes** ses pages en pause. Pourtant :
  - l'e-mail l'invitait à « choisir ses pages actives » ;
  - avec une seule page, il ne recevait aucun e-mail, alors que cette page disparaissait.
- **Changement :**
  - `prevenirPagesCoupees` (webhook Stripe) lit `free_published_since`. Si l'essai est expiré, il envoie « Votre page est en pause / Vos N pages sont en pause » avec la phrase pure `phrasePagesEssaiEcoule` (`lib/pauseDesPages.ts`) et un bouton « Choisir un plan » vers `/upgrade`.
  - N compte les pages qui étaient en ligne : la page gardée par le quota plus celles coupées.
  - Sinon, l'e-mail est inchangé.
- **Tests :** `pauseDesPages.test.ts` (2 nouveaux), tests webhook PASS, tsc PASS.
- **Non vérifié ici :** l'envoi réel. Il dépend de Resend et d'un vrai événement Stripe.
- **Retour arrière :** `git revert`.
