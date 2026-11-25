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

## v340 — Les modèles n'inventent plus d'avis, d'adresse ni de nom de commerce (23/11/2026)

- **Urgences U2 et U3** de la revue totale (`docs/ROADMAP-PERFECTION.md`). Aucune décision n'était nécessaire.
- **U2, la galerie.** Les 14 modèles historiques (créateur, restaurant, coach…) étaient écrits en dur dans `dashboard/templates/page.tsx`, hors de portée des gardes anti-faux. Ils installaient :
  - « Marie L. — la meilleure entrecôte de Paris » ;
  - « 12 rue de la Paix, 75001 Paris » ;
  - « 4.9/5 - 300 avis » ;
  - « Code SARAH20 » ;
  - `tel:+33123456789`, `mailto:contact@alex.com`.

  **Correction :**
  - Les 14 modèles ont été déplacés dans `templates/modelesHistoriques.ts`. Ils restent identiques, sauf 79 champs vidés : avis, badges de réputation, adresses, coordonnées, codes promo, dates 2025 passées, liens nus Calendly/Doctolib/Spotify, chiffres d'audience dans les bios.
  - Le même nettoyage a été fait dans `page-templates.ts` et `templatesStudio.ts` : 8 badges (« 🌟 Recommandé », « ⭐ 4,9/5 », « +200 accompagnés », « Dernières places »…), le code ALEX15, un e-mail et un faux numéro.
  - `valeursDExemple` indexe désormais ces modèles. Un plat ou un prix d'exemple resté tel quel est donc signalé avant publication, comme pour les autres modèles.
  - **Une seule garde** dans `preuveNonInventee.test.ts` lit les trois sources : modèles de page (studio compris), recettes de la création guidée et modèles historiques. Elle ignore les accents et la casse, et refuse : avis, notes, badges de réputation, adresses, `tel:`/`mailto:` et codes promo.
- **U3, la création guidée.** Le titre était « Le Bistrot — Présenter un menu », un nom inventé par le secteur et repris dans l'adresse de la page, le titre Google et les aperçus de partage.

  **Correction :**
  - Un champ « Nom de votre commerce » apparaît à l'étape 2, avant les secteurs.
  - S'il est rempli, il devient le titre et le nom en tête de page (`avecLeNomSurLaPage`, la même fonction que la galerie).
  - S'il est vide, le titre est « Ma page — Présenter un menu ». Les secteurs ne portent plus de nom.
- **Tests :**
  - `preuveNonInventee` (6 nouveaux) et `secteursParObjectif` (4 nouveaux).
  - `e2e/nomDuCommerce.spec.ts` (3 tests, ordinateur et mobile) sur le banc de la création guidée et sur la vraie galerie `/creer`.
  - Vitest complet : 7 626 PASS ; tsc : PASS.
- **Retour arrière :** `git revert`.

## v341 — Vague 0 : écran de pause lisible, visites sans double compte, impression avertie, fichiers effacés, erreurs de connexion sûres (23/11/2026)

Urgences U4 à U7 de la revue totale, plus la sécurité de l'inscription (point 8). Aucune ne demandait de décision.

- **U4, l'écran « page en pause ».** Le texte était en ivoire fixe (#F5F0E8), donc illisible sur tout thème clair. Il est maintenant calculé sur le fond (`encreSur`, la même règle que les boutons), et le message principal n'est plus voilé d'opacité. Test `pageEnPauseLisible` : 8 fonds (noir, blanc, ivoire, rose poudré, terracotta, marine, or, gris), contraste ≥ 4,5 mesuré sur le rendu.
- **U5, « Aujourd'hui » dans les statistiques.**
  - La carte additionnait scans et vues. Or un client venu par QR produit les deux : 20 clients affichaient 40.
  - Les vues ne portent aucun identifiant de visiteur, donc il est impossible de compter des visiteurs uniques sans en inventer. `visitesDuJour` garde, par jour, le plus grand des deux nombres : une borne basse, jamais gonflée.
  - La journée est celle du fuseau du commerce, plus celle du navigateur.
  - La carte s'intitule « Visites aujourd'hui · un client par QR compte une fois ».
- **U6, le Print Studio.**
  - Il lit maintenant le statut du QR, son expiration et la publication de sa page.
  - Un QR en pause, en brouillon ou expiré, ou une page non publiée, affiche une alerte avec le geste qui répare (« Réactiver ce QR », « Publier la page »). L'alerte apparaît sous le choix du QR (ordinateur et mobile) et dans l'écran de contrôle avant export.
  - L'impression n'est pas bloquée : préparer ses supports à l'avance reste possible. Module pur `qrQuiAboutit.ts`.
- **U7, la suppression de compte.**
  - Après la suppression réussie, `purgerLesFichiersDuCompte` efface `page-assets/<uid>/…` (sous-dossiers compris, par lots de 1 000) et `avatars/<uid>.jpg`.
  - Un identifiant qui n'est pas un UUID est refusé : un préfixe vide viderait le bucket des autres comptes.
  - Un échec est journalisé « PURGE DU STOCKAGE À REJOUER » avec l'identifiant.
  - Le dossier `social/` (produit) n'est jamais touché.
- **Sécurité de l'inscription (`?error=`).**
  - Les pages de connexion, d'inscription et de mot de passe oublié affichaient le paramètre tel quel. Un lien piégé faisait écrire « Votre compte est suspendu, appelez le… » au vrai domaine, et un `%` isolé faisait planter la page.
  - L'URL ne porte plus qu'un code (`lib/erreursDAuth.ts`). Un code inconnu n'affiche rien. Le nombre de fuites d'un mot de passe est un entier borné.
  - Vérifié sur les pages servies : texte piégé → aucune alerte ; `%` → 200 ; codes connus → message.
- **Tests :**
  - 5 nouveaux fichiers de test, `e2e/atelierQrQuiAboutit.spec.ts` (4 PASS, ordinateur et mobile).
  - 4 tests existants réalignés : `statistiquesHonnetes`, `nomDuQr`, `callbackLogic`, `apresInscription`. Ce qu'ils garantissent ne change pas.
  - Vitest complet : 7 655 PASS ; tsc : PASS.
- **Non vérifié ici :**
  - la purge sur le vrai bucket (pas de compte de test à supprimer) ;
  - l'écran de pause sur une vraie page expirée (vérifié par rendu serveur).
- **Retour arrière :** `git revert`.

## v342 — Le bloc « Avis clients » est retiré, et un avis sans note n'a plus cinq étoiles (23/11/2026)

U8 de la revue totale. Décision du propriétaire : retirer.

- **« Avis clients » (`google_reviews_block`) n'est plus proposé à l'ajout** (`BLOCS_MASQUES`). On y saisissait à la main une note moyenne et un nombre d'avis : des chiffres invérifiables, présentés comme une preuve (art. L111-7-2 du Code de la consommation). Comptage en base avant retrait : **0 bloc**, donc aucune page coupée. La définition reste, pour ne casser aucune donnée.
- **Un avis sans note ne reçoit plus cinq étoiles.** Règle unique `etoilesDeLAvis` (modèle `testimonials`) : note non saisie → aucune étoile. Appliquée aux 7 rendus d'avis (page publiée, rendu partagé, aperçu de l'éditeur, aperçu des modèles).
- Le choix de note des Témoignages propose aussi 2 et 1 (il s'arrêtait à 3).
- Restent pour les avis : `google_review` (lien vers la vraie fiche Google) et `testimonials` (retours recopiés par le commerçant).
- **Tests :** `avisSansNoteInventee.test.tsx` ; `wave4` et `apercuFidele` mis à jour (ils figeaient l'ancien comportement). Suite complète : 7 661 PASS, typage propre.
- **Non vérifié en direct :** le seul bloc Témoignages publié en base ; s'il n'avait pas de note saisie, il perd ses étoiles, ce qui est voulu.

## v343 — L'inscription tient en deux champs (23/11/2026)

Vague 1, point 3.

- **Le formulaire ne demande plus que l'e-mail et le mot de passe.** Le « Nom complet » obligatoire ne servait pas à publier. Il se règle plus tard dans Profil, et tous les écrans qui le lisent avaient déjà un repli : e-mails (« Bonjour, »), équipe (« Mon équipe »), en-tête (l'e-mail).
- **Côté serveur, le nom devient facultatif.** S'il est absent, rien n'est écrit (plutôt qu'une chaîne vide) ; le parrainage `?ref=` est conservé.
- **Garde `champQuiNeZoomePas` :** plafond « site public » abaissé de 28 à 27 (un champ de moins).
- **Correctif du test de v342** (`avisSansNoteInventee`), dont le typage aurait fait échouer le build.
- **Tests :** `inscriptionDeuxChamps.test.ts` et `e2e/inscriptionDeuxChamps.spec.ts` (ordinateur et mobile : 2 champs, ordre au clavier, bouton ≥ 44 px).

## v344 — L'ardoise du jour s'écrit depuis Ma carte (23/11/2026)

Vague 1, point 1, première brique. Objectif : l'ardoise du jour en moins de 30 secondes, au téléphone, sans ouvrir l'éditeur.

- **En tête de Ma carte, un encadré « L'ardoise du jour »** dit ce que voient les clients en ce moment : « En ligne aujourd'hui · 2 plats », « Invisible en ligne : c'est l'ardoise du dimanche 22 novembre », ou « Pas d'ardoise en ligne aujourd'hui ».
- **L'ardoise d'hier se remet d'un toucher** (« Remettre celle du … »).
- **Sinon, on écrit jusqu'à 4 plats** (nom, prix au pavé numérique, description facultative) puis « Mettre en ligne ». « 14 » prend la forme des prix de la carte (« 14 € »).
- **L'ardoise est datée du jour du commerce.** La règle d'affichage existante s'applique : elle disparaît le lendemain.
- **Une page sans ardoise en reçoit une, juste avant sa carte**, avec le fuseau de ses horaires.
- **Le serveur revérifie tout** : nom obligatoire, longueurs, prix, 4 plats au plus.
- **Module pur `ardoiseDuJour.ts`** (11 tests, dont 0 h 30 à Paris = lendemain et l'outre-mer) ; action `ecrireArdoise` (session, RLS, écriture confirmée, revalidation).
- **E2E `ardoiseDuJour.spec.ts`**, 6 passés sur ordinateur et mobile : remettre celle d'hier, écrire deux plats, refus du serveur (la saisie reste). Les 24 tests Ma carte existants passent toujours.
- **Reste du point 1 :** carte illustrée, boissons, happy hour, horaires et congés dans Ma carte.

## v345 — La recette « menu » arrive dans Ma carte, sans faux plats (23/11/2026)

Vague 1, point 2. Décision du propriétaire : un prix d'exemple **alerte** sans bloquer la publication, comme c'était déjà le cas.

- **Une carte vide, plus de faux plats.** La création guidée « Présenter un menu » écrivait trois rubriques de faux plats (« Entrée du jour · — · À compléter »). Elle écrit désormais une carte « Notre carte » avec Entrées / Plats / Desserts **vides**.
- **Arrivée dans Ma carte.** Une page à carte, créée par l'onboarding, s'ouvre sur Ma carte plutôt que sur l'éditeur : on y ajoute ses produits au téléphone. Sur une page en brouillon, Ma carte propose « Terminer et publier ».
- **En ligne, une rubrique sans produit ne s'affiche plus.** Avant, le client lisait « Aucun produit dans cette section ». Une carte sans aucun produit n'est plus publiable. Dans l'éditeur et Ma carte, ces rubriques restent pour qu'on les remplisse.
- **« Coller ma carte » remplit la carte vide** au lieu d'en poser une seconde à côté (`carteVideARemplir`).
- **À la création**, l'encart « Collez votre carte » ne promet plus de « garder les produits d'exemple » : il n'y en a plus. Le bouton devient « Plus tard, dans Ma carte ».
- **Les pages créées avant** portent encore « Entrée du jour » : ces valeurs restent signalées avant publication.
- **Tests :** `recetteMenu.test.tsx` ; 3 tests existants mis à jour (titre seul ≠ produit). E2E : création guidée → Ma carte, arrivée sur la carte vide puis ajout d'un produit. 49 e2e Ma carte / création PASS sur ordinateur et mobile ; suite complète 7 685 PASS.

## v346 — Un resto voit ses 20 blocs, pas les génériques (23/11/2026)

Vague 1, point 4.

- **Ce qui existait déjà.** La bibliothèque filtrée par métier était déjà active dans l'éditeur réel, et pas seulement derrière le drapeau : l'onglet « Pour un resto » s'ouvre par défaut dès qu'un menu est posé (lot du 20 nov.).
- **Le défaut.** Après ses 8 blocs de métier, la liste était complétée par des blocs génériques : Services, Tarifs, Réalisations, Compte à rebours, Produit, Vidéo, Bio…
- **La correction.** `ESSENTIELS_DU_METIER.restaurant` donne une liste de 20 blocs, sans ce bourrage :
  - la carte sous ses formes : menu, carte illustrée, grande carte, boissons ;
  - le quotidien : plat du jour, happy hour ;
  - venir : horaires, plan, appel, réservation, commande à retirer ;
  - à table : appel serveur, Wi-Fi ;
  - après : avis Google, réseaux ;
  - plus le profil, la galerie, une annonce, la FAQ et les témoignages.
- **Les autres métiers** gardent leur liste d'avant.
- **Les 194 blocs** restent tous accessibles par les catégories et la recherche.
- **Tests :** 4 tests dans `builderLibrary.test.ts`, et `e2e/bibliothequeDuMetier.spec.ts` étendu (éditeur réel, mobile : le quotidien du resto présent, Réalisations, Compte à rebours et Services absents).

## v347 — « Fermé aujourd'hui » et les congés depuis Ma carte (23/11/2026)

Vague 1, point 1, deuxième brique.

- **Un encadré « Fermetures » dans Ma carte** dit ce que voient les clients :
  - « Fermé en ce moment. Vos clients lisent « Fermé · réouverture le 24 novembre » » ;
  - « Fermeture annoncée : … » ;
  - « Message affiché : … » ;
  - ou « Aucune fermeture annoncée ».
- **Trois gestes :**
  - « Fermé aujourd'hui », d'un toucher ;
  - « Annoncer des congés » : premier et dernier jour fermés, au calendrier ;
  - « Rouvrir maintenant » ou « Retirer l'annonce ».
- **Rien de neuf côté page publique.** Le geste écrit le champ « Exception / congés » des horaires, sous une forme que `lib/congesDates` relit. Le badge existant dit alors « Fermé · réouverture le … » pendant la période, puis le message s'éteint seul.
- **Une date lointaine porte son année.** `congesDates` donne à une date sans année l'année la plus proche d'aujourd'hui : « du 1er au 15 juillet », écrit en novembre, aurait été lu comme le juillet passé. Au-delà de 90 jours, la phrase porte donc l'année. L'aller-retour phrase ↔ dates est vérifié sur une année entière de débuts, avec des durées de 1 à 120 jours.
- **Refus :** une période passée, inversée, de plus de 120 jours, ou une date invalide. Une page sans horaires propose « Ajouter mes horaires » (éditeur).
- **Correctif mobile vu en capture :** le second calendrier dépassait de la carte. Les deux champs s'empilent désormais, et le test vérifie qu'ils tiennent dans la carte.
- **Tests :** `fermetureDuCommerce.test.ts` (10 tests) et `e2e/fermetureDuCommerce.spec.ts` (8 passés sur ordinateur et mobile). Suite complète : 7 702 passés.
- **Reste du point 1 :** carte illustrée, boissons et happy hour dans Ma carte.

## v348 — Carte illustrée, boissons et happy hour dans Ma carte (23/11/2026)

Vague 1, point 1, dernière brique : Ma carte lit maintenant les cinq blocs de carte, plus seulement les deux menus.

- **Une table unique des champs** (`LIGNES_DE_PRODUITS` dans `epuises.ts`) dit, par bloc, où vivent le nom, le prix et la description qui fait l'identité d'un produit. La lecture de Ma carte, le changement de prix et le rendu public d'« Épuisé » en dépendent tous les trois : ce que Ma carte écrit, la page le lit.
- **Ma carte affiche une rubrique** par catégorie de la carte illustrée, une par rubrique de boissons (Rouges, Bières…) et une pour l'happy hour.
- **Épuisé et prix** se changent comme pour les menus. Pour l'happy hour, c'est le prix happy hour qui change ; le prix habituel ne bouge pas.
- **Une boisson à deux prix** (verre et bouteille) affiche « 6 € / 26 € · deux prix : dans l'éditeur ». On ne devine pas lequel des deux changer ; le serveur le refuse aussi.
- **Ajouter, corriger et retirer un produit** restent réservés aux deux menus, à l'écran comme sur le serveur. Ces trois cartes (photo, badges, deux prix, prix barré) proposent « Ajouter ou corriger dans l'éditeur ».
- **Page publique :** le produit épuisé reste affiché, barré, avec la mention « Épuisé » (le rendu des menus, désormais partagé). Sur la carte illustrée, la mention suit la langue choisie par le client : Sold out, Agotado, Ausverkauft, Esaurito, Esgotado, Tükendi, نفد, 已售罄.
- **Une page qui n'a qu'une carte illustrée** a désormais son raccourci « Ma carte ».
- **Tests :** `autresCartes.test.tsx` (10 tests : aller-retour épuisé Ma carte → page publique sur les trois blocs, prix, deux prix) et `e2e/autresCartes.spec.ts` (6 passés sur ordinateur et mobile) ; `happyHour.test` mis à jour avec le nouveau champ. 50 e2e Ma carte / carte illustrée / traduction passés ; suite complète : 7 713 passés.

## v349 — Les prix de la carte s'affichent « 12,00 € » (23/11/2026)

Vague 2, point 1.

- **Le défaut.** La feuille de route citait un « moteur » existant, mais `prixDeLaCarte` ne fait que RÉÉCRIRE un prix dans Ma carte. Aucun formatage d'affichage n'existait : chaque bloc montrait le prix tel que tapé ou collé (« 12.00€ », « 20.00 », à côté de « 8,50 € »).
- **`lib/prixAffiche.ts`, à l'affichage seulement.** Un montant net (« 12 », « 12.5 », « 12,50 », « 12.00€ », « 12 EUR ») devient « 12,00 € » : virgule, deux décimales, espace insécable avant l'euro, espace fine entre les milliers (« 1 250,00 € »). Les espaces viennent de `typographieFr`.
- **Tout le reste passe tel quel : on ne devine pas.** Cela couvre :
  - du texte : « Prix du marché », « Offert » ;
  - une fourchette : « 5 / 9 » ;
  - une précision : « 18 € (15 € le midi) » ;
  - un supplément : « +1 € » ;
  - une autre devise : « $12 », « 12 CHF ».
- **La saisie reste intacte.** Ma carte et l'éditeur repèrent un produit et reformatent un prix à partir de ce qui a été tapé.
- **Six affichages branchés :** les menus (`MenuItemList`, donc menu et grande carte, côté public et aperçu), la carte illustrée (ligne, fiche, suppléments), les boissons (deux colonnes), l'happy hour (prix barré et prix happy), l'ardoise.
- **Tests :** `prixAffiche.test.ts` (20 tests, dont les 13 formes laissées telles quelles) ; la garde de débordement des prix (`contenuReel`) suit le nouveau marqueur ; `blocsBarResto` attend « 14,00 € ». Vérifié en capture mobile sur le modèle Bistrot. Suite complète : 7 733 passés ; 35 + 89 e2e passés (1 échec de capture d'écran, `apercuGenere` mobile, passé ensuite seul).

## v350 — « Réserver une table » prend la couleur du thème (23/11/2026)

Vague 2, point 3.

- **Le défaut.** Le bouton du bloc `table_booking` (ancien moteur) était rouge en dur (#EF4444). Sur fond blanc, il était à 3,8:1, sous le seuil de 4,5:1. Et il était étranger à tous les thèmes.
- **La correction.** Il prend la couleur principale du thème, rendue lisible sur le fond et la surface de la page par la règle des blocs partagés (`fabriqueLisible`, désormais exportée). Une couleur déjà lisible est gardée telle quelle.
- **Le banc `/e2e-harness/bloc`** rend aussi les blocs de l'ancien moteur (repli `RenduLegacy`). Il servira pour tous les blocs pas encore migrés.
- **Tests :** `reserverAuxCouleursDuTheme.test.tsx` mesure le contraste ≥ 4,5 sur 5 thèmes clairs et sombres, dont un or sur blanc et un rose pâle sur rose. `blocsBarResto.spec` couvre les thèmes clair et sombre, sur ordinateur et mobile, avec captures. Suite complète : 7 740 passés.

## v351 — Les 14 allergènes sur toutes les cartes, renseignés dans Ma carte (23/11/2026)

Vague 2, point 2 (volet allergènes).

- **Le défaut.** L'information sur les 14 allergènes est obligatoire (règlement UE 1169/2011, annexe II ; décret 2015-447). Seule la carte illustrée la proposait, en texte libre. Le menu, la grande carte, les boissons et l'happy hour n'avaient rien.
- **Le rangement** (`models/allergenes.ts`) : par IDENTITÉ de produit (nom · description), dans une seule clé du bloc, exactement comme `epuises`. Cela vaut pour les cinq blocs de carte sans toucher à leurs formats : une grande carte reste un texte collé « nom;prix;desc ». L'identité suit le produit quand l'éditeur réordonne ses lignes.
- **Les 14 allergènes** de l'annexe II sont gardés dans l'ordre du règlement, quel que soit l'ordre des touchers. Un code inconnu est ignoré.
- **« Aucun des 14 » est un choix explicite**, distinct de « non renseigné » : rien coché n'enregistre rien.
- **Rien n'est déduit du nom du plat.** Une déduction fausse sur un allergène est un danger.
- **Ma carte** a un 4e mode, « Allergènes ».
  - Chaque produit affiche « Non renseigné » (en orange), « Aucun des 14 allergènes » ou « Gluten, Lait ».
  - Un toucher ouvre les 14 boutons (44 px) et « Aucun des 14 ».
  - Un compteur dit combien de produits restent sans allergènes.
  - L'écran ne change qu'après l'accord du serveur : pas d'affichage optimiste sur un allergène.
- **L'action `changerAllergenes`** vérifie que le produit existe bien dans le bloc.
- **Page publique :** une ligne « Allergènes : Gluten, Lait » sous le produit, sur le menu, la grande carte, les boissons et l'happy hour. Sur la carte illustrée, les cases cochées s'ajoutent au texte libre déjà saisi, sans doublon.
- **Bug attrapé par le test navigateur :** juste après l'enregistrement, Ma carte affichait « Lait, Gluten » dans l'ordre des touchers. Corrigé avec une seule fonction `ordonnerAllergenes`, partagée.
- **Tests :** `allergenes.test.tsx` (9 tests) et `e2e/allergenes.spec.ts` (4 passés, ordinateur et mobile, avec captures). Le banc de page publique accepte `?allergenes=`. Deux tests existants ont reçu le nouveau champ. Suite complète : 7 752 passés ; 81 e2e passés.
- **Reste du point 2 :** la traduction des menus, des boissons et de l'happy hour (seule la carte illustrée est traduite).

## v352 — Toutes les cartes de la page dans la langue du client (23/11/2026)

Vague 2, point 2 (volet traduction).

- **Le défaut.** Seule la carte illustrée se traduisait, bloc par bloc, avec sa propre barre de langues. Le menu, la grande carte, les boissons et l'happy hour restaient en français pour le touriste.
- **Une langue par page, pas par bloc.**
  - Un contexte partagé (`primitives/langueDeLaPage`) pose UNE barre, juste avant la première carte traduite. Toutes les cartes de la page la suivent.
  - Le choix est retenu sur le téléphone, et la langue du téléphone est proposée d'office.
  - Sur une page publiée, la carte illustrée suit cette barre ; hors page (éditeur, miniatures), elle garde la sienne.
  - Les attributs `lang` et `dir` sont posés sur le contenu traduit : l'arabe se lit de droite à gauche.
- **Une demande pour toute la page** (`models/traductionDesCartes`).
  - Ma carte a un encadré « Traduire ma carte » : choisir une langue, copier une demande qui couvre toutes les cartes (sans doublon), la coller dans ChatGPT ou DeepL, coller la réponse.
  - L'écran dit « N sur M éléments traduits » avant d'enregistrer, et ce qui restera en français.
  - Le serveur répartit la réponse bloc par bloc, dans `tr_<langue>`, au format de la carte illustrée (rattaché au nom FRANÇAIS). La réponse se FUSIONNE avec ce qui était déjà traduit. On peut aussi retirer une langue.
- **Traduits côté client :** noms, descriptions, rubriques et titres ; « Épuisé » et « Allergènes » ; les **noms des 14 allergènes** dans les 8 langues. Le badge horaire de l'happy hour reste en français.
- **Tests :** `traductionDesCartes.test.ts` (8 tests : répartition, doublons, fusion, couverture, allergènes traduits) et `e2e/traductionDesCartes.spec.ts` (6 passés, ordinateur et mobile). En e2e : Ma carte (copier, coller, couverture, refus d'une réponse illisible), et page publique (une seule barre, menu et allergènes en anglais, ce qui n'est pas traduit reste en français, choix retenu au rechargement). Les bancs acceptent `?traduction=`. Suite complète : 7 756 passés ; 77 e2e de non-régression passés, dont la carte illustrée traduite.

## v353 — Google lit l'adresse, le téléphone, les horaires et la carte du restaurant (23/11/2026)

Vague 2, point 4.

- **Le défaut.** Le JSON-LD d'une page de restaurant déclarait un `LocalBusiness` réduit à son nom et à son adresse web, avec comme image l'AVATAR DU COMPTE. L'image de partage (`/og`) se repliait elle aussi sur l'avatar, puis sur le nom du titulaire : la carte de partage d'un restaurant pouvait montrer le visage de son gérant.
- **`lib/ficheDuCommerce.ts`** lit les blocs affichés, et seulement eux :
  - l'adresse (plan, itinéraire, contact, carte de visite) ;
  - le téléphone (au moins 6 chiffres) ;
  - les horaires `OpeningHoursSpecification` : jours identiques regroupés, une plage qui passe minuit ferme le lendemain (« 19h - 02h » → 02:00), un jour fermé est absent ;
  - la carte `Menu` (rubriques, produits, description, prix `Offer` en EUR seulement quand c'est un montant net, 150 produits au plus), sur les cinq blocs de carte ;
  - l'image de LA PAGE (photo du profil, puis bannière), seulement si c'est une adresse web.
- **Rien d'inventé.** Pas de `priceRange`, de `servesCuisine` ni de note. Une valeur restée d'un modèle (« Entrée du jour », « — ») n'est pas publiée (`valeursDExemple`).
- **Type d'entité.** Une page qui a une carte ou un geste de resto est un `Restaurant`, quel que soit son modèle d'origine. La page d'une personne reste une `Person`, sans fiche d'établissement.
- **Image de partage :** plus aucune lecture du compte (ni avatar, ni nom). Une photo de profil masquée sur la page l'est aussi sur la carte de partage ; sans photo, c'est l'initiale.
- **Langue :** la page reste déclarée en français, la langue de son contenu. Depuis v352, les parties traduites portent leur propre `lang` (et `dir` pour l'arabe).
- **Tests :** `ficheDuCommerce.test.ts` (12 tests). Les 73 tests SEO existants passent ; suite complète : 7 774 passés.
- **Non vérifié en direct :** le rendu sur une vraie page publiée (pas de base locale). À contrôler après le push avec le test des résultats enrichis de Google, sur la page Red Fish.

## v354 — Les QR imprimés tiennent quand la base tombe (24/11/2026)

Vague 3, point 1 : `/q/<code>`, l'adresse de tous les QR imprimés.

- **Une panne n'est plus un « Code inconnu ».**
  - Avant, une erreur de lecture de la base (ou une exception) laissait la route conclure « pas de QR ». Le client lisait « Code inconnu » devant un QR valide, et ne le rescannait plus jamais.
  - Maintenant, une erreur sur `qr_codes`, sur `instant_qrs` ou une exception mène à la dernière destination connue du code si on l'a. Sinon, l'écran « Indisponible » s'affiche en **503 avec `Retry-After: 30`**, un code d'erreur temporaire.
  - Vérifié en direct sur le serveur local, dont la base n'existe plus : 503 « Indisponible », plus « Code inconnu ».
- **La dernière destination connue** (`lib/derniereDestination.ts`).
  - Chaque scan réussi retient la destination servie : mémoire de l'instance, et Upstash Redis si ses variables sont posées (90 jours). Il n'écrit qu'au changement : mille scans font une écriture.
  - Jamais retenue : un lien protégé par mot de passe (le secours contournerait la protection), et un schéma autre que http(s), tel: ou mailto:.
  - Un QR vu en pause, expiré, en brouillon ou protégé est OUBLIÉ : une panne ne le rouvre pas.
  - Sans Upstash, le secours ne vaut que pour les instances déjà chaudes.
- **Le scan ne compte que s'il aboutit.**
  - Il était enregistré avant de savoir où aller : un QR menant à une page en brouillon, ou à une destination introuvable, comptait quand même.
  - Il est maintenant compté juste avant chaque réponse réussie, et jamais en aperçu (`?preview`).
- **Incrément atomique des QR de lien.** La migration `20261123140000_increment_scan_lien.sql` crée `increment_scan_lien(p_id)` : SECURITY DEFINER, exécution réservée au service role. Tant qu'elle n'est pas appliquée, la route garde l'ancienne écriture « lu + 1 », en repli.
- **Alerte dédiée** (`lib/alerteRedirection.ts`) : une ligne « [ALERTE /q] » dans les journaux à chaque panne, et un e-mail aux administrateurs (`ADMIN_EMAILS`), au plus un par heure. Il passe par la coquille commune et échappe ce qu'il cite.
- **Tests :**
  - `qrRobuste.test.ts` joue la VRAIE route contre un faux client (10 tests) : panne avec ou sans secours, vrai code inconnu, QR en pause oublié, lien protégé jamais retenu, scan non compté (brouillon, aperçu, pause), incrément RPC puis repli.
  - `derniereDestination.test.ts` (7 tests), dont un magasin partagé en panne.
  - Suite complète : 7 791 passés.
- **À faire par le propriétaire :**
  - appliquer la migration ;
  - (facultatif, recommandé) poser les deux variables Upstash pour un secours partagé entre instances.

## v355 — Le QR imprimé est le QR dessiné (24/11/2026)

Vague 3, point 2.

- **Le défaut.** Le Print Studio dessinait le QR à sa façon : couleurs de l'ambiance du support, modules carrés, correction M, aucun logo. Tout ce qui avait été réglé dans le QR Studio (couleurs, modules, yeux, dégradé, logo, correction) disparaissait à l'impression.
- **Une seule règle de rendu : `qr-codes/styleDuQr.ts`.**
  - `renduDuQr(ligne)` donne le style enregistré complété des défauts, avec le logo de l'ancienne colonne `logo_url` s'il le faut. Un logo force la correction H.
  - `useStyleDeRendu` compose le logo (forme, fond).
  - Le QR Studio l'utilise : il reprend exactement ses anciennes règles, sans changement de comportement.
  - Le Print Studio l'utilise aussi : il demande le style à la base (`COLONNES_DU_STYLE`) et dessine le QR avec, à l'écran, sur la planche, dans le PDF et dans l'export « QR seul ». La pastille prend le fond du QR, sans liseré d'une autre couleur.
- **Le pré-vol mesure enfin le vrai QR.** Le contraste se calcule sur les couleurs du QR, la zone silencieuse sur sa correction réelle (le nombre de modules en dépend), et le logo à sa taille réelle. Auparavant, le contrôle supposait toujours « M, aucun logo ».
  - Conséquence visible : un QR en correction Q peut désormais recevoir l'avertissement « Zone silencieuse : marge un peu juste ». Ce n'est pas une régression, c'est le vrai code qui est jugé. Le bouton « Corriger » s'en charge.
- **Les QR de lien** (`instant_qrs`) n'ont pas de style enregistré : ils gardent les couleurs de l'ambiance, comme avant.
- **Tests :** `styleDuQr.test.ts` (5 tests, dont une garde : les deux studios passent par la même règle) et `e2e/qrImprimeCommeDessine.spec.ts`, qui vérifie sur ordinateur et sur mobile que le QR du support porte la couleur, le fond et les modules du QR Studio (capture relue). Trois tests qui figeaient l'ancien texte (requête, correction « M ») ont été mis à jour. 40 e2e QR Studio / Print Studio passés ; suite complète : 7 796 passés.

## v356 — Chaque fichier exporté est relu par un décodeur (24/11/2026)

Vague 3, point 3.

- **Le défaut.** La jauge de lisibilité était une ESTIMATION tirée des réglages. Elle ignorait le dégradé, la couleur des yeux et la taille du logo. Le QR Studio affichait pourtant « Lisibilité vérifiée automatiquement » : rien n'était relu.
- **La relecture** (`lib/relectureQr.ts`). Avant chaque téléchargement, jsQR (déjà au projet pour le testeur public) relit le fichier lui-même, et doit rendre EXACTEMENT l'adresse encodée.
  - Deux lectures : à la résolution du fichier, puis réduit à environ 3 pixels par module, comme une caméra voit un QR imprimé petit ou de loin.
  - Un fond transparent est relu sur blanc.
  - Cela couvre le QR Studio (PNG, PNG transparent, SVG, PDF) et l'export « QR seul » du Print Studio.
- **Un échec prévient, sans interdire.** jsQR est plus exigeant qu'un téléphone récent sur certains styles. La fenêtre « Ce fichier n'a pas été relu » dit pourquoi : il ne passe qu'en grand, ou il n'est pas lu du tout. Elle propose « Revoir le QR » ou « Télécharger quand même ».
- **La promesse affichée est maintenant vraie :** « Chaque fichier est relu par un décodeur avant de partir », puis « Dernier fichier relu par un décodeur : il mène bien à votre QR ».
- **La note voit trois réglages de plus :**
  - un dégradé est jugé sur sa couleur la plus PÂLE ;
  - les yeux trop proches du fond coûtent 30 points, et 10 s'ils sont un peu pâles ;
  - un logo au-delà de 22 % de la largeur est signalé (au-delà de 25 % : 18 points).
  - Sur les 64 styles prêts à l'emploi, 5 changent de niveau (dont « Soldes Flash » : 82 → 56, dégradé trop pâle). Aucun ne devient « risqué », donc aucun téléchargement n'est bloqué.
- **Le banc `/e2e-harness/qr-studio`** accepte `?yeux=pales` : des yeux presque couleur du fond, bien notés mais illisibles pour un décodeur. C'est le cas qu'une estimation ne voit pas.
- **Tests :**
  - `relectureQr.test.ts` (7 tests : tailles de lecture, verdict exact, phrases, et la note sur le dégradé, les yeux et le logo) ;
  - `e2e/fichierRelu.spec.ts` : un PNG lisible est relu puis téléchargé ; avec des yeux pâles, la fenêtre s'ouvre, « Revoir » ne télécharge rien, « Télécharger quand même » télécharge. Capture relue.
  - Une garde (`filetTypes`) accepte désormais l'arrêt explicite avant la relecture.
  - 37 e2e QR / Print Studio passés ; suite complète : 7 803 passés.
- **Hors de ce lot :** le PDF du support entier (Print Studio) passe encore par la boîte d'impression du navigateur. Sa relecture viendra avec le point 4 (PDF généré directement).

## v357 — Le service de midi, par support (24/11/2026)

Vague 3, point 5.

- **La question.** « Ce midi, combien de tables ont scanné, et le chevalet marche-t-il mieux que la vitrine ? » L'écran des statistiques avait tout, mais sur des périodes de jours, jamais sur le service.
- **Une carte « Le service de midi, par support »**, en tête de l'onglet Supports, filtrable par page.
  - Elle porte sur la plage 11 h – 15 h, à l'heure DU COMMERCE. Avant 11 h, elle montre le service d'hier.
  - Elle donne une phrase (« Ce midi, entre 11 h et 15 h : 4 clients. »), puis une ligne par support, du plus au moins scanné.
- **Des clients, comptés honnêtement** (`lib/clientsDuService.ts`).
  - Un client qui scanne deux fois compte une fois, y compris sur deux supports (empreintes anonymes distinctes).
  - L'empreinte n'est écrite que si son sel secret est configuré (`lib/empreinteDeScan`). Sans elle, ou si une partie des scans n'en a pas, la carte compte des SCANS et le dit : « un client qui scanne deux fois compte deux fois ». Pas de total mêlé.
  - Les empreintes ne quittent pas le serveur : le bilan est calculé dans la page, et seuls des nombres partent à l'écran (garde testée).
- **Correctif d'un défaut de v341.** L'écran lisait `profile.timezone`, qui n'existe pas : le fuseau vit dans `preferences.timezone`. Les jours des statistiques (« Visites aujourd'hui » compris) étaient donc comptés à l'heure de Paris quel que soit le réglage. La page lit désormais les préférences et ne transmet que le fuseau.
- **Tests :** `clientsDuService.test.ts` (8 tests : bornes 11 h / 15 h, veille avant 11 h, fuseau de la Martinique, doublons, sans empreinte, empreintes partielles, empreintes gardées au serveur) et `e2e/clientsCeMidi.spec.ts` (4 passés sur ordinateur et mobile, capture relue). Le banc des statistiques accepte `?midi=scans`. La garde des lectures plafonnées exige un ordre : ajouté. Suite complète : 7 813 passés.
- **À savoir :** l'empreinte est écrite avec `SCAN_IP_SALT` (16 caractères au moins) ou, à défaut, avec le secret serveur déjà présent (`lib/empreinteDeScan`, repli) : en production, la carte compte donc des clients. Les scans sans empreinte (antérieurs au repli) n'entrent pas ici : seuls deux jours sont lus.

## v358 — Le support est relu avant l'impression, et les couleurs qui virent sont signalées (24/11/2026)

Vague 3, point 4, première partie.

- **Relecture avant la boîte d'impression.**
  - Le PDF du support passe par l'impression du navigateur, et son QR n'était relu par personne (v356 ne couvrait que l'export du « QR seul »).
  - Désormais, au clic sur « Imprimer ou enregistrer en PDF » et sur « Exporter la planche », le QR du support est dessiné à sa TAILLE PHYSIQUE réelle (300 dpi, avec le style du QR Studio), puis relu par le décodeur, en grand puis vu de loin.
  - Un échec ouvre « Le QR de ce support n'a pas été relu », avec deux choix : « Revoir le QR » ou « Imprimer quand même ».
  - Un PNG importé n'est pas relu, faute de savoir quelle adresse il doit contenir.
- **Couleurs qui virent à l'impression.** Le calcul (`qr-codes/cmyk.ts`, `countOutOfGamut`) existait, mais le pré-vol recevait `cmykRiskyColors: null`. Il compte maintenant les couleurs réellement posées sur le support : ambiance, texte, accent, titre, sous-titre, bouton, QR. Il affiche « N couleur(s) très vive(s) risquent de virer en CMYK — prévoyez une épreuve imprimeur ». C'est un avertissement, hors score, qui ne bloque rien.
- **Une seule définition des options du QR du support** (`optionsDuQr`), partagée par l'export « QR seul » et la relecture avant impression.
- **Tests :**
  - `e2e/impressionRelue.spec.ts` (6 passés, ordinateur et mobile) : un QR lisible ouvre la boîte d'impression, des yeux pâles la retiennent, un vert néon est signalé ;
  - la garde `relectureQr.test` couvre les deux boutons et la couleur reliée.
  - 31 e2e du Print Studio passés ; suite complète : 7 813 passés.
- **Reste du point 4 (décision du propriétaire).** Un PDF produit DIRECTEMENT et VECTORIEL, sans la boîte d'impression, pour le support entier comme pour le « QR seul » (aujourd'hui une image dans le PDF du QR Studio). jsPDF est au projet, mais il ne sait pas poser un SVG en vectoriel. La voie standard est d'ajouter `svg2pdf.js` (compagnon officiel de jsPDF, licence MIT). L'ajout d'une dépendance attend l'accord du propriétaire. Une recette sur une vraie impression (D5) suivra.

## v359 — Le QR des PDF est vectoriel (24/11/2026)

Vague 3, point 4, deuxième partie. Ajout de la dépendance `svg2pdf.js`, accord du propriétaire le 24 nov.

- **La dépendance.** `svg2pdf.js` **2.9.0**, épinglée à la version exacte. C'est le compagnon de jsPDF (yWorks, licence MIT). Elle déclare la compatibilité avec jsPDF 4, a 4 petites dépendances, et sa version date du 29 oct. Elle est chargée À LA DEMANDE, au moment du PDF, jamais dans le premier chargement.
- **`lib/pdfVectoriel.ts`** pose le SVG du moteur de rendu (le même que l'aperçu, style du QR Studio compris) en TRACÉS dans le PDF. Les textes restent du texte ; un logo importé reste une image (on ne vectorise pas une photo).
- **PDF du QR Studio.** Le QR était une IMAGE de 1024 px collée dans une A4 ; il est maintenant en tracés. C'est le SVG posé dans le PDF qui est relu par le décodeur. Si la conversion échouait, l'ancien PDF (image) partirait à sa place : jamais de téléchargement perdu.
- **Print Studio, « QR seul » : un format PDF de plus** (après PNG et SVG). La page fait EXACTEMENT la taille physique du QR du support : c'est le fichier qu'un imprimeur pose sur son support. Il est relu avant de partir.
- **Vérifié en ouvrant les fichiers** (`e2e/pdfVectoriel.spec.ts`) :
  - PDF du QR Studio : aucune image, 251 tracés et 753 segments ;
  - PDF « QR seul » : aucune image, page carrée de la taille du QR, pas une A4.
- **Ce qui reste sur l'impression du navigateur : le support entier** (titre, bouton, photo, mise en page). Il est composé en HTML, et svg2pdf ne lit que du SVG. Le produire sans la boîte d'impression demanderait de réécrire tout le dessin des supports. Le PDF « Enregistrer en PDF » du navigateur est déjà vectoriel (texte et QR SVG), et il est relu depuis v358.
- **Tests :** `pdfVectoriel.test.ts` (mise en page, épinglage, import à la demande) et `pdfVectoriel.spec.ts` (2 passés). Les 18 e2e d'export passent ; suite complète : 7 816 passés.
- **À faire :** une recette sur une vraie impression (D5).

## v360 — La production se déploie de nouveau : le premier chargement de la page publique repasse sous son budget (24/11/2026)

Correctif urgent, relevé par le propriétaire dans Vercel.

- **Ce qui s'est passé.** Depuis v352 (traduction des cartes), les huit déploiements de production (v352 → v359) avaient ÉCHOUÉ sur la garde de budget du build : « 202 Ko gzip (plafond 197 Ko) ». La production est restée sur v351 ; rien de v352 à v359 n'était en ligne.
- **La cause, de ma part.** `PublicPageClient` (premier chargement de la page publique) importait `traductionDesCartes`, qui lit les modèles de TOUTES les cartes : menu, grande carte et son analyseur, carte illustrée et sa recherche, boissons, happy hour (et, par lui, le fichier de types du builder), allergènes. La page n'avait besoin que des LANGUES proposées.
- **La correction.** Le nouveau module léger `models/langueDesCartes.ts` ne contient que les langues et l'application d'une traduction, sans aucun modèle de carte. La page et la barre de langues l'importent seul. `traductionDesCartes` le réexporte : aucun appelant ne change.
- **Mesuré.** Build de production complet en local (compilation, typage, 211 pages, budget) : **192 Ko gzip** (plafond 197, inchangé, jamais relevé). Le build inclut v359, donc `svg2pdf.js`.
- **Garde ajoutée :** `premierChargementLeger.test.ts`. La page et la barre n'importent pas le module lourd, et le module léger n'importe que `repeaterExtract` et `traductionCarte`.
- **Leçon.** Les e2e et la suite unitaire tournent contre le serveur de dev, qui ne mesure pas le budget. Le budget ne se vérifie qu'au build de production. Un lot qui touche la page publique (`[slug]`, `PublicPageClient`, les primitives qu'elle importe) se valide désormais aussi par `pnpm run build`, serveur de dev arrêté.
- Suite complète : 7 819 passés ; 18 e2e de traduction, carte illustrée et allergènes passés.

## v362 — Les types de la base sont les vrais (24/11/2026)

Vague 4, point 1.

- **Avant.** `Database = any` : une faute de frappe dans un nom de colonne, une valeur hors énumération, une jointure impossible passaient la compilation et ne cassaient qu'en production.
- **Maintenant.** `lib/supabase/database.generated.ts` est généré depuis le schéma de PRODUCTION (32 tables, une vue, les énumérations). `database.types.ts` le réexporte (`Database`, `Json`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`). Le script racine `pnpm db:types` régénère au bon endroit (il écrivait ailleurs). Le branchement a fait apparaître 65 erreurs de typage, toutes corrigées : tsc = 0.
- **Deux vrais défauts révélés.**
  - **La notification d'un nouveau contact ne partait jamais.** Elle lisait `pages.blocks`, une colonne qui n'existe pas. La page revenait vide et l'e-mail au commerçant n'était pas envoyé, depuis le 6 sept. Aucun contact reçu en production, donc personne n'a rien perdu. Les blocs sont maintenant lus dans la table `blocks`.
  - **Le journal d'activité du profil ignorait trois valeurs de son énumération** (`page_deleted`, `domain_added`, `avatar_updated`). Elles ont maintenant une icône et un libellé.
- **Le Builder lisait `profiles.accent_color`, une colonne inexistante.** La couleur d'accent vient uniquement des préférences.
- **Migrations manquantes.** `cron_runs` et `contact_messages` existaient en production SANS migration dans le dépôt. Elles sont décrites à l'identique (colonnes, contrainte, index, RLS, politique) par `20261124120000_cron_runs_contact_messages.sql`. La migration est idempotente : appliquée sur la production, elle ne change rien.
- **Table orpheline : `plan_limits`.** Présente en production (4 lignes), créée hors migration, lue par aucun code ni aucune fonction. La garde la tolère nommément, et cette liste ne peut que rétrécir. **Décision du propriétaire :** la supprimer ou la documenter.
- **Export des données (RGPD).** `cron_runs` et `contact_messages` sont jugées, avec la raison de leur absence de l'export : journal technique ; message rattaché à une adresse saisie, pas à un compte.
- **Gardes :** `typesReels.test.ts` (7 tests).
  - `Database` n'est plus `any`, et les clients sont typés par le schéma.
  - Chaque table du schéma a son `create table` dans les migrations.
  - Le notificateur ne lit plus `pages.blocks`.
  - Le journal d'activité suit l'énumération de la base.
- **Reste du point.** Environ 810 `as any` sont à résorber progressivement, fichier par fichier, au fil des lots qui les touchent.
- **Vérifié.** tsc 0 ; suite complète : 7 826 passés ; build de production : 192 Ko gzip (plafond 197).

## v363 — Un filet sur l'argent, et les tests navigateur à chaque push (24/11/2026)

Vague 4, point 2.

- **Le banc du webhook Stripe** (`bancWebhook.test.ts`, 15 tests). La VRAIE route est jouée contre une fausse base en mémoire. La signature est VRAIMENT vérifiée par le SDK Stripe, avec un en-tête fabriqué depuis un secret de banc. Le banc regarde ce qui est écrit, ce qui est envoyé et ce qui est répondu à Stripe :
  - une signature fausse ou un corps modifié sont refusés, sans écriture ;
  - souscrire, puis le rejeu (un seul bienvenue) ;
  - un prix inconnu n'ouvre ni ne retire rien ;
  - une écriture refusée renvoie 500, Stripe rejoue, et le rejeu répare ;
  - annulation : l'excédent s'éteint, ce que l'abonné a choisi de garder reste allumé, et il est prévenu ;
  - reprise : se rallume ce que le plan avait éteint, pas ce que l'abonné avait mis en pause lui-même ;
  - l'annulation d'un ancien abonnement est ignorée, et un « active » en retard ne ressuscite pas un abonnement annulé ;
  - une résiliation programmée est annoncée une seule fois ;
  - un paiement refusé est signalé une seule fois, période de grâce comprise.
- **Un vrai défaut trouvé : le bienvenue ne partait pas dans l'ordre le plus courant.** Stripe émet le plus souvent `customer.subscription.created` AVANT `checkout.session.completed`. L'abonnement était alors déjà inscrit, et le paiement concluait « déjà connu » : l'e-mail ne partait pas. Il en allait de même pour un paiement 3-D Secure (`incomplete` puis `active`).
  - **La correction.** Le bienvenue part quand CET abonnement devient actif ou en essai pour la première fois, quel que soit l'événement qui l'annonce. C'est la fonction pure `bienvenueDue` (`lib/webhookLogic.ts`). La fin d'un essai, la sortie d'un impayé et un rejeu ne le renvoient pas.
- **Le filet navigateur, à chaque push** (nouveau job CI `filet`, script `test:e2e:filet`). Il couvre 11 parcours : forfaits, prix annuel, choix au retour au gratuit, historique de destination, export et impression du QR, gestion d'un QR, menus. Ils tournent en session simulée, sans aucun secret, avec une adresse Supabase factice. Mesuré dans ces conditions : 27 tests en 3 min 40. Le rapport est joint en cas d'échec.
  - Le job manuel (smoke et blocs) reste tel quel.
  - Garde : `filetNavigateur.test.ts`. Les fichiers existent, les parcours critiques sont présents, le job tourne au push et ne lit aucun secret, et Node est le même que la production.
- **La CI passe à Node 24**, comme la production (v361).
- **Relevé en chemin (pas un défaut du produit).** Un `pnpm run build` lancé pendant qu'un serveur de dev tourne corrompt le cache `.next/dev` : le serveur renvoie ses propres scripts en 500 et les pages n'hydratent plus. Lancés sur ce serveur, des dizaines de tests navigateur échouaient donc à tort. Cache vidé, ils passent.
- **Vérifié.** tsc 0 ; suite complète : 7 845 passés ; filet : 27 passés.
- **À confirmer après le push.** Le premier passage du job `filet` sur GitHub. En local, `.env.local` reste chargé ; la CI n'a AUCUNE variable hors celles du job.

## v364 — Un seul rendu par bloc : 6 300 lignes de copies mortes retirées (24/11/2026)

Vague 4, point 4, premier lot.

- **Constat.** Trois anciens rendus gardaient chacun une copie des 163 blocs déjà servis par le moteur partagé : la page publique (`renduLegacy`), l'aperçu de l'éditeur (`builderPreview`) et l'aperçu de la galerie (`TemplatePreviewModal`).
  - **Elles ne s'exécutaient plus.** `registry.test.ts` garantit que tout type activé a ses deux adaptateurs, et les trois appelants consultent le registre avant leur `switch`.
  - **Elles coûtaient quand même.** Les corrections s'y refaisaient à la main, et des gardes les lisaient en croyant protéger le produit.
- **Purge.** −6 335 lignes, imports et utilitaires orphelins compris :
  - `renduLegacy` passe de 2 370 à 534 lignes ;
  - `builderPreview`, de 2 795 à 711 ;
  - `TemplatePreviewModal`, de 2 947 à 977.
  
  Chacun ne garde plus que les 32 blocs non migrés.
- **Décision actée.** L'ancien rendu servait aussi de repli : retirer un type du drapeau le renvoyait vers sa copie. La feuille de route (point 4) prévoit de supprimer ces doublons ; le retour arrière d'un bloc passe désormais par git. `poidsDuScan.test.ts` exige maintenant que l'ancien rendu tienne EXACTEMENT les blocs non migrés.
- **37 gardes qui lisaient ces copies, reprises une par une.** Aucune n'a été désactivée.
  - Celles qui visaient un bloc précis EXÉCUTENT maintenant son rendu partagé : la page vide, le profil et son `<h1>`, le produit et son « # », le compteur de scans, la pleine largeur.
  - Les comparaisons de `repliQuiDitLaMemeChose` portent sur le rendu RÉEL. Sans ce changement, deux d'entre elles (« schéma refusé », « publie les vraies ») seraient restées vertes sans plus rien regarder.
  - Les planchers de balayage sont ramenés au réel, raison écrite. Le plafond des boutons écrits à la main DESCEND (19 → 14).
- **Deux défauts révélés en chemin.**
  - **Le prix d'une formule (`packs`) pouvait déborder de l'écran** (`flexShrink: 0` sans plafond). La garde des prix ne visait que trois lignes de l'ancien rendu. Le prix est corrigé, et la garde devient une garde de CLASSE, qui balaye toute ligne affichant un prix.
  - **Le détecteur de réglages morts ne reconnaissait pas une clé à préfixe et numéro variables** (`${k}org`). Les champs des certifications ne paraissaient « lus » que grâce à l'ancien code. Le détecteur est complété, avec son auto-test.
- **Nouvelle garde : `renduUnique.test.ts`.** Aucun des trois anciens rendus ne peut retrouver une copie d'un bloc migré, et leur taille ne peut que diminuer.
- **Vérifié.**
  - Typage : 0 erreur. Suite complète : 7 848 passés.
  - Build de production : la page publique pèse **189 Ko gzip** (192 avant ; plafond 197).
  - Navigateur : 29 e2e (galerie, composition de page, page publique) et 17 du builder.
- **Relevé.** Une capture de référence de `builder-visual` (`VISUAL=1`, locale, non suivie par git) diffère de 2 px, et diffère AUSSI avec l'ancien code : l'écart est antérieur à ce lot.
- **Reste du point 4.** Migrer les 32 blocs encore dans l'ancien moteur, puis supprimer ce qui en reste :
  - les formulaires (8) ;
  - les médias (carrousel, avant/après, galeries vidéo, intégration) ;
  - la structure (accordéon, onglets, barre fixe, multi-boutons, documents) ;
  - les actions externes (réservation, paiement, vCard, QR) ;
  - les affichages simples (compte à rebours, compteur de visites, couverture, zone desservie, cadeau, produits populaires).

## v365 — Rendu unique, lot 2 : les affichages simples (24/11/2026)

Vague 4, point 4, deuxième lot. Six blocs rejoignent le moteur partagé : compte à rebours, compteur de visites, bannière de couverture, zone desservie, cadeau offert, produits populaires. Aucun n'est posé en production aujourd'hui.

- **Une seule décision par bloc.** Modèle pur `models/affichagesSimples.ts`, un dossier par bloc dans `blocks/`, branché dans les deux registres, le drapeau et le recensement. Leurs copies quittent les trois anciens rendus (−302 lignes, plus trois composants de compte à rebours devenus orphelins).
- **Ce que les trois copies disaient de différent, corrigé.**
  - **La galerie de modèles inventait des chiffres :** « 1 234 visiteurs » écrit en dur, et un compte à rebours vers le 31 décembre 2026 quand le modèle n'avait pas de date.
  - **L'aperçu de la bannière peignait son fond dans la couleur d'accent du thème,** la page publiée dans la primaire.
  - **L'aperçu du compte à rebours dessinait son bouton sans destination.**
  - **Le cadeau publiait sa carte pour une adresse que la page refusait ensuite** (carte « 🎁 » sans bouton). Son détecteur emploie maintenant `destinationUtile`, comme `external_shop`.
- **Deux défauts que les deux anciens rendus partageaient, vus au banc.**
  - **La bannière plaçait son texte en haut à droite pour le réglage « en bas à gauche »** (axes du flex inversés). Corrigé, et la position est testée.
  - **Le compte à rebours avait des cases gris sale sur un thème clair.** Elles ont maintenant un voile clair.
- **Gardes au travail.**
  - Le titre du compte à rebours devient un `<h2>`.
  - Le classement des ventes devient une vraie liste.
  - Les villes de la zone desservie sont lues par `extractIndexed` sous un plafond déclaré (6). Le détecteur, qui écrivait sa série à la main, lit le même cadre.
- **Le compteur de visites reçoit son nombre de la page.** Nouveau champ `totalVues` dans le contexte public, rempli par la page publiée seule. Partout ailleurs le bloc ne publie rien. Les balayages qui le mettaient à part côté ancien moteur le mettent à part côté partagé, avec la même raison écrite. Le banc d'essai prend `?vues=`.
- **Gardes qui lisaient les copies, reprises.** Elles exécutent maintenant le rendu partagé : texte alternatif de la bannière, miroir des onze détecteurs, compteur de la vague 11, horloge SSR. Plafonds abaissés : `renduUnique` 432 / 564 / 873, vignettes 5 / 5, boutons à la main 13.
- **Vérifié.**
  - Typage : 0 erreur. Suite complète : 7 874 passés (nouveau `renduUniqueLot2.test.tsx`).
  - Build de production : page publique **188 Ko gzip** (plafond 197).
  - Navigateur : 123 e2e passent (blocs partagés, bibliothèque, réglages, audit mobile).
  - Captures au banc des six blocs, thèmes sombre et clair à 375 px : aucun débordement.
- **Reste du point 4.** 26 blocs : structure (5), médias (7), actions externes (6), formulaires (8).

## v366 — Rendu unique, lot 3 : la structure (24/11/2026)

Vague 4, point 4, troisième lot. Cinq blocs rejoignent le moteur partagé : accordéon, onglets, barre fixe, grille de boutons (`multi_cta`), documents. Modèle pur `models/structureEtActions.ts` ; −253 lignes de copies dans les trois anciens rendus, plus trois composants devenus orphelins (`ShareButton`, `TabsPublic`, `AccordionPublic`).

- **Ce que l'aperçu promettait et que la page ne tenait pas, corrigé.**
  - **Les boutons sans adresse** de la grille.
  - **« Télécharger ↓ » sur un document sans fichier.**
  - **« Ajoutez du contenu... » écrit dans un onglet vide.**
  - **L'accordéon montré tout fermé**, alors que la page ouvre la première section.
  - **La barre fixe ne filtrait pas ses actions pareil des deux côtés.** Ses détecteurs, comme ceux de la grille, lisent désormais le modèle lui-même : plus de condition recopiée.
- **Le menu « Partager » de la barre fixe, vu au banc.** Trois défauts, tous hérités des anciens rendus.
  - **Il débordait de l'écran** quand « Partager » était la dernière action, et s'ouvrait HORS de l'écran quand la barre est en haut. Il est maintenant ancré au bord de l'écran, du côté de la barre.
  - **Toucher la page ne le fermait pas.** Le voile de fermeture était en `position: fixed` dans une barre décalée par un `transform`, il ne couvrait donc que la barre. Le menu écoute maintenant le document.
  - **Échap ne le fermait pas** (relevé par `coucheQuiSeFerme`). Il passe par `useFermetureEchap`.
  
  Il prend aussi les couleurs du commerçant au lieu du noir et or QROWG. Il devient la primitive partagée `BoutonPartager`.
- **Accessibilité.**
  - Les onglets suivent le motif ARIA : un onglet relié à son panneau, et les flèches du clavier passent d'un onglet à l'autre.
  - Les sections, les documents, les boutons et les actions de la barre sont de vraies listes ; la barre est un `<nav>` nommé.
  - Libellés masqués : le nom de l'action reste lu par les lecteurs d'écran.
  - La légende de l'aperçu (9 px) passe au plancher de 11 px.
- **Plafonds.**
  - Les cinq places de la barre sont une largeur d'écran (`ACTIONS_PAR_BARRE`), pas un plafond de répéteur. Elles restent hors de `PLAFOND_DES_LIGNES`, dont la garde « une minorité déclare autre chose » (moins de 30) n'a pas été relevée.
  - `renduUnique` : 352 / 452 / 812 lignes.
- **Gardes reprises.**
  - `unSeulBouton` range les primitives partagées (hors `Editor*`) avec la page publiée : le chemin trompe, la fonction ne doit pas.
  - Le miroir des onze détecteurs exécute les adaptateurs partagés de `documents`, `sticky_bar` et `multi_cta`.
- **Vérifié.**
  - Typage : 0 erreur. Suite complète : 7 890 passés (nouveau `renduUniqueLot3.test.tsx`).
  - Build de production : page publique **188 Ko gzip**.
  - Navigateur : 18 e2e passent.
  - Banc en sombre et en clair à 375 px, sans débordement. Testés à la main : onglets au clavier, accordéon, menu de partage (dans l'écran barre en haut et en bas, fermé par Échap et par un toucher sur la page).
- **Reste du point 4.** 21 blocs : médias (7), actions externes (6), formulaires (8).

## v367 — Rendu unique, lot 4 : les médias (24/11/2026)

Vague 4, point 4, quatrième lot. Sept blocs rejoignent le moteur partagé : avis Google, carrousel, avant/après, galeries YouTube et TikTok, témoignages vidéo, intégration. Modèle pur `models/medias.ts`. Trois primitives partagées : `Etoiles`, `Carrousel`, `CurseurAvantApres`. −497 lignes de copies, plus `StarRow` (deux copies), `CarouselPublic` et `BeforeAfterPublic`.

- **Ce que l'aperçu affichait de faux, corrigé.**
  - **Les avis Google INVENTAIENT une note « 5.0 » et cinq étoiles** quand le commerçant n'avait écrit qu'un titre. La page publiée n'en affichait aucune.
  - **L'intégration posait son `<iframe>` SANS sandbox, sur l'origine du tableau de bord** (là où le commerçant est connecté). La page publiée la sandboxait. Même rendu des deux côtés désormais, avec un `title` pour les lecteurs d'écran.
  - **L'avant/après réglé en curseur s'affichait en grille.**
  - **Les galeries vidéo dessinaient leur bouton sans destination.**
- **Côté page publiée.**
  - **TikTok publiait un cadre vide** quand seul le compte était rempli. Le bouton a maintenant un libellé par défaut.
  - **Les détecteurs** du carrousel, de l'avant/après et des galeries vidéo lisent le modèle. Le carrousel comptait cinquante emplacements alors que son panneau et son rendu en tiennent douze ; les vidéos comptaient des adresses que la page refuse.
  - **Le carrousel lit ses photos avec la galerie** (`galerie(c)`) : même panneau, même filtre, chaque légende reste avec sa photo.
- **Deux blocs « réellement bloqués » depuis B09.11, levés parce que leurs conditions sont remplies.** Trois gardes le vérifient au lieu de le supposer.
  - **`embed_block` :** il était bloqué pour une « adresse arbitraire dans un iframe ». `embedHref` n'accepte que `EMBED_HOTES` (en https) depuis le 30 août.
  - **`media_before_after` :** il manquait des tests DOM du curseur. `e2e/curseurAvantApres.spec.ts` glisse à la souris, au doigt (vrais événements tactiles) et au clavier. Il tourne dans le job `filet` à chaque push.

  Le curseur gagne au passage ce qui lui manquait pour être atteint au clavier : focus, bornes, flèches, Début/Fin.
- **Une décision passée respectée.** « Un carrousel qui défile tout seul pendant qu'on compose la page serait insupportable » : le défilement automatique reste réservé à la page publiée.
- **Gardes reprises.**
  - Celles de la page publiée lisent la primitive `Carrousel` : chargement immédiat de la 1re photo, `pan-y`, pastilles de 24 px, texte alternatif.
  - La garde du titre de `presave` lisait l'ancien rendu depuis sa migration (vague 22) et ne restait verte que grâce au titre d'un AUTRE bloc. Elle lit le sien.
  - La garde des vignettes exige maintenant zéro image brute dans les deux aperçus, qui n'en ont plus.
  - Planchers ramenés au réel, raison écrite. `renduUnique` : 209 / 251 / 638 lignes.
- **Vérifié.**
  - Typage : 0 erreur. Suite complète : 7 912 passés (nouveau `renduUniqueLot4.test.tsx`).
  - Build de production : page publique **186 Ko gzip** (188 avant).
  - Navigateur : 21 e2e passent, dont les 3 du curseur.
  - Banc des 7 blocs en sombre et en clair à 375 px, sans débordement ni erreur.
- **Reste du point 4.** 14 blocs : actions externes (6), formulaires (8).

## v368 — Rendu unique, lot 5 : les actions externes (24/11/2026)

Vague 4, point 4, cinquième lot. Huit blocs rejoignent le moteur partagé : agenda (Calendly), prise de rendez-vous, réservation de table, boutique, demande de devis, paiement, fiche contact (vCard) et bloc QR. Modèle pur `models/actionsExternes.ts`. −293 lignes de copies ; `LienPublic` disparaît avec le dernier lien de l'ancien rendu.

- **Ce que l'aperçu affichait de faux, corrigé.**
  - **Le bloc QR dessinait un FAUX QR code**, tiré au hasard (`Math.random()`) à chaque rendu, sous une fausse adresse « /q/... ». La page publiée ne l'a jamais rendu, et il est retiré de la bibliothèque depuis septembre. Son aperçu dit maintenant la vérité et propose de le retirer. Son détecteur (`c => false`) le fait signaler par la liste d'avant publication.
  - **La demande de devis n'avait pas de détecteur** : l'aperçu dessinait le bouton sans adresse. Elle sort aussi de `FORMULAIRES` (`pageQuiMontreQuelqueChose`) : c'est un lien, pas un formulaire.
  - **Table et rendez-vous** : l'aperçu les peignait en rouge et en bleu, la page dans la couleur du thème.
- **Côté page publiée.**
  - **Agenda, rendez-vous et table se publiaient pour n'importe quel texte d'adresse**, puis la page retirait le bouton : une carte sans action. Les détecteurs lisent maintenant le modèle.
  - **Vu au banc, en cours de lot :** les boutons de boutique, devis, table, rendez-vous et paiement rétrécissaient à la taille de leur texte. `avecCibleTactile` ne garde la pleine largeur qu'avec `display: block` ou `width: 100%`. Corrigé, et testé.
  - Le nom de la fiche contact et le titre de l'agenda sont des `<h2>`.
- **Préservé.**
  - Le marqueur `data-reserver` du bouton de table, cherché par le test navigateur des bars-restos : nouveau paramètre `marqueur` de `SmartCta`.
  - Les clés de suivi historiques : `booking`, `payment`, `vcard`.
- **Gardes reprises.**
  - `reserverAuxCouleursDuTheme` exécute l'adaptateur partagé.
  - `TOLERES` (réglages morts) nomme `qr_code_block.show_url`, avec sa raison.
  - Le test des détecteurs nomme les détecteurs « jamais » (`JAMAIS`).
  - Les gardes qui sondaient les liens de l'ancien rendu constatent qu'il n'en a plus. Les liens sont tous sondés par le balayage des adaptateurs partagés.
  - Planchers ramenés au réel, raison écrite. `renduUnique` : 88 / 124 / 560 lignes.
- **Vérifié.**
  - Typage : 0 erreur. Suite complète : 7 932 passés (nouveau `renduUniqueLot5.test.tsx`).
  - Build de production : page publique **186 Ko gzip**.
  - Navigateur : 23 e2e passent, dont les bars-restos.
  - Banc des 7 blocs publics en clair à 375 px.
- **Reste du point 4.** Les 6 formulaires (contact, devis, réservation, demande d'événement, RSVP, inscription), puis la suppression des anciens rendus.

## v369 — Rendu unique, lot 6 : les formulaires — plus aucun bloc dans l'ancien moteur (24/11/2026)

Vague 4, point 4, sixième et dernier lot de migration. Les six formulaires (contact, devis, réservation, demande d'événement, inscription, RSVP) rejoignent le moteur partagé. **Tout le catalogue a désormais un seul rendu** : les trois anciens rendus n'ont plus un seul `case` de bloc.

- **Méthode choisie : DÉPLACER, pas réécrire.** Ces formulaires apportent les demandes des clients. Le dossier `forms/` contenait une vue préparée et jamais activée (B09.13), sans pot de miel ni envoi branché ; elle n'a pas servi.
  - `LeadFormPublic`, `EventRegisterPublic`, `RsvpPublic` et `ConfirmationEnvoi`, les composants qui tournent en production, ont été déplacés tels quels dans `forms/FormulairesEnLigne.tsx`.
  - Le script de déplacement compte chacun de ses remplacements et s'arrête au moindre écart. Il s'est arrêté une fois : 8 champs, pas 9.
- **Trois changements, et rien d'autre.**
  - **`apercu`** : l'éditeur montre le VRAI formulaire au lieu de boîtes grises, mais champs en lecture seule, boutons inactifs, et chaque chemin d'envoi s'arrête (`if (apercu) return`, ×3).
  - **`champ`** : les couleurs des champs viennent du thème. En sombre elles sont identiques au caractère près ; en clair, les champs étaient blancs sur blanc, invisibles.
  - **Les titres** des formulaires sont des `<h2>`.
- **Contexte public.** `nomCommerce` et `courrielDuCompte` (repli courrier), que l'ancien rendu recevait déjà, passent par le contexte du renderer partagé. Rien de plus n'est transmis.
- **Page publique : 181 Ko gzip (186 avant).** Les formulaires ne voyagent plus avec chaque scan : ils se chargent avec leur bloc.
- **Nouveau test navigateur : `e2e/formulairesEnLigne.spec.ts`**, au banc, `/api/leads` intercepté, rien n'est enregistré. Ajouté au job `filet` de la CI.
  - Validation de l'e-mail et contenu exact de la requête envoyée.
  - Le pot de miel rempli n'envoie rien.
  - Un échec d'enregistrement ne se fait pas passer pour un succès.
  - Les types des six formulaires : contact, quote, reservation, booking, register, rsvp.
- **Gardes reprises.**
  - Une douzaine lisaient le code des formulaires dans `blocsPublics` ; elles le lisent à sa nouvelle adresse, à l'identique.
  - Les formulaires sont l'exception NOMMÉE (`FORMULAIRES`) dans les balayages « visible à vide » et « sans détecteur ».
  - `email_dest` est une adresse qui achemine, pas un texte à afficher (`RAISONS`).
  - Les gardes qui mesuraient l'ancien rendu constatent qu'il est vide.
  - `renduUnique` : 54 / 48 / 488 lignes.
- **Relevé, non corrigé (hors périmètre).**
  - Le repli courrier de l'inscription vise l'adresse du compte, pas l'éventuelle adresse du bloc comme les autres formulaires.
  - Le titre par défaut « S'inscrire gratuitement » affirme une gratuité que le commerçant n'a pas forcément décidée.
- **Vérifié.**
  - Typage : 0 erreur. Suite complète : 7 945 passés (nouveau `renduUniqueLot6.test.tsx`).
  - Build de production : **181 Ko gzip**.
  - Navigateur : 6 e2e des formulaires et 32 e2e des blocs.
- **Reste du point 4.** Supprimer ce qui reste des anciens rendus : `renduLegacy` (54 lignes sans aucun bloc), le repli de `builderPreview` et l'aperçu maison de `TemplatePreviewModal`. Puis réécrire, ou retirer avec leur raison, les gardes qui les lisaient encore.

## v370 — Un seul moteur de rendu : l'ancien est supprimé (24/11/2026)

Vague 4, point 4, **terminé**. Les 32 derniers blocs migrés (v365 à v369), il ne restait des anciens rendus que de la plomberie vide.

- **`renduLegacy.tsx` est supprimé.** La page publiée n'a plus qu'un chemin : l'adaptateur public partagé. Un type que le registre ne connaît pas (donnée ancienne, bloc retiré) ne publie rien.
- **Aperçus de l'éditeur (`builderPreview`) et de la galerie (`TemplatePreviewModal`).** Ils perdent leur `switch`. Ils gardent ce qui n'est pas un rendu de bloc : l'enveloppe de l'éditeur avec la mention « bouton sans lien », et une vignette « icône et nom » pour un type inconnu, jamais un cadre muet.
- **Bilan du point 4 (v364 → v370).**
  - Les trois anciens rendus passent de ~8 100 lignes à 44 + 479. L'aperçu de la galerie garde son cadre et ses motifs de fond, plus aucun bloc.
  - Page publique : **181 Ko gzip** (192 avant v364).
- **Ce que la suppression a révélé.** Plusieurs gardes ne vérifiaient plus rien sans le dire : elles ignoraient tout bloc migré, donc tous les blocs.
  - **`blocNeuf`** (« un bloc neuf n'est jamais un cadre muet ») rendait une chaîne vide pour chaque bloc migré. Elle rend maintenant la vraie vue de CHAQUE bloc du catalogue, et l'invite de l'éditeur par son adaptateur.
  - **`boutonSansDestination`** sautait tout bloc migré. Elle balaie maintenant tout le catalogue, et cherche le repli « # » dans tout le renderer partagé.
  - **`adressesFiltrees`** lisait l'ancien rendu. Elle lit tout le code du renderer partagé : aucune ancre ne reçoit une valeur brute `c.…`.
  - Nouvelle aide de test `shared-renderer/vuesPubliques.test-aide.tsx` : la vue publique de chaque bloc, chargée par ses fichiers.
- **Gardes reprises.**
  - Une vingtaine de listes « fichiers de la page publique » perdent l'ancien rendu.
  - Les gardes propres au repli (`repliQuiDitLaMemeChose`, `poidsDuScan`, `rendererParity`, `renduUnique`) vérifient qu'il ne revient pas et que tout le catalogue a son adaptateur.
  - Aucune garde désactivée.
- **Vérifié.**
  - Typage : 0 erreur. Suite complète : 7 943 passés. Build de production : 181 Ko gzip.
  - Navigateur : 81 e2e passent, dont le filet complet de la CI, la galerie, la composition de page et le canvas du builder.
- **Relevé, non résolu.** Pendant ce passage, `shared-blocks.spec` (tous les blocs au banc) a signalé une fois un écart d'hydratation sur les champs du formulaire de devis, avec des styles aux valeurs identiques des deux côtés. Il ne s'est pas reproduit en cinq essais (trois rechargements, deux passages du test seul). Il est à surveiller : s'il revient, c'est un vrai défaut.

## v371 — Une seule source de modèles, lot 1 : l'aperçu montre la page qu'on obtient (24/11/2026)

Vague 4, point 5 (TPL-001), premier lot. Le point 3 (suivi des erreurs) attend toujours le choix d'un outil externe.

- **Inventaire des sources de modèles.**
  - `PAGE_TEMPLATES` : les modèles partagés, qui alimentent la galerie, `/examples` et la fenêtre « Modèles » de l'éditeur.
  - Les 14 modèles historiques de la galerie, en trois morceaux : blocs dans `modelesHistoriques.ts`, métadonnées dans un tableau de `page.tsx`, thèmes dans un objet RECRÉÉ à chaque rendu dans le composant, avec repli silencieux sur « freelance ».
  - `templateStructures.extra.ts` : 62 métiers, atteints seulement par un banc d'essai.
  - Les recettes par objectif (onboarding) et le générateur de croissance, qui sont des compositions et non des modèles.
- **Nouveau registre `dashboard/templates/registreDesModeles.ts`.** Un modèle porte ensemble ce qu'il annonce, son thème et ses blocs. Les couleurs de sa carte sont DÉRIVÉES du thème. Pas de modèle par défaut. La galerie, l'aperçu, l'assistant et la création lisent tous ce même objet. Métadonnées et thèmes historiques recopiés à l'identique dans `modelesHistoriques.ts`.
- **Ce que la divergence cachait, corrigé.**
  - **L'aperçu en grand mentait sur la page qu'on allait créer.** Il reconstruisait un thème à partir des couleurs de la CARTE, avec texte clair, Fraunces et fond uni pour tous les modèles.
    - « Coach & Thérapeute », une page claire, se prévisualisait sur fond sombre.
    - « Restaurant & Bar » se voyait en rouge (#FF6B6B) et créait une page orange (#FF6B00).
    - Aucune police ni aucun dégradé de modèle n'apparaissait avant la création.
  - **La palette de l'aperçu** annonçait un texte crème écrit en dur pour tous les modèles.
  - **« freelance » et « immobilier » créaient des pages colorées en `var(--accent)`**, une variable du site qui suit le profil de celui qui regarde. Les blocs la composent en `var(--accent)18`, une couleur invalide, donc des fonds de carte perdus. Les valeurs sont figées en vraies couleurs (#D4AF45, #39FF8F). En production : 0 page touchée sur 7, vérifié par une requête d'agrégat.
  - L'icône de la carte de nommage (`template.color + "18"`) recevait la même couleur invalide.
- **Gardes.**
  - Nouveau `registreDesModeles.test.ts` : identifiants uniques, chaque modèle a un thème et des blocs, couleurs de carte = thème, aucune variable CSS dans un thème, thème inchangé par `normalizePageTheme`, aperçu et palette branchés sur le thème.
  - Nouveau `e2e/apercuDuModeleFidele.spec.ts` : l'aperçu de « Coach » est clair, celui de « Restaurant & Bar » orange.
  - Cinq gardes qui analysaient le TEXTE de `page.tsx` lisent maintenant les objets du registre (point 7 : tester un comportement, pas une chaîne).
- **Vérifié.**
  - Typage : 0 erreur. Suite complète : 7 952 passés. Build de production : OK.
  - Navigateur : 30 e2e de la galerie (publique et connectée), plus les 2 nouveaux.
  - Captures de l'aperçu lues.
- **Suite du point 5.**
  - Les pages `/examples` et la fenêtre « Modèles » de l'éditeur lisent encore `PAGE_TEMPLATES` seul : à brancher sur le registre, sans changer ce qu'elles affichent.
  - Les 62 métiers du moteur ne sont atteints par aucun utilisateur. Il faut les exposer ou les retirer : c'est une décision produit.

## v372 — Une seule source de modèles, lot 2 : le même catalogue partout (24/11/2026)

Vague 4, point 5, deuxième lot. **Décision du propriétaire (24 nov.) : les 14 modèles historiques partout.** Ils n'existaient que dans la galerie : la fenêtre « Modèles » de l'éditeur et les pages `/examples` en proposaient 51 sur 65.

- **Un seul catalogue : `CATALOGUE_DES_MODELES` (registreDesModeles.ts), 65 modèles.**
  - L'éditeur et `/examples` (accueil, page de chaque modèle, plan statique) le lisent ; `/examples` gagne 14 pages de démonstration.
  - Les modèles partagés gardent leur ordre et leurs groupes, à l'identique (testé).
  - Les historiques rejoignent les groupes en français (`GROUPE_DE_CATEGORIE` : Food → Restauration…), avec un nouveau groupe « Santé ».
- **Défaut trouvé : douze modèles historiques sur quatorze ne permettaient pas de joindre le commerce.** Ni appel, ni WhatsApp, ni formulaire : une page créée depuis « Freelance » ou « Coach » n'avait aucun moyen d'être contactée. Les modèles partagés passaient tous par `avecMoyenDeJoindre`, jamais les historiques. Le registre applique la règle à tous. Une page créée reçoit un bouton d'appel, que l'éditeur invite à compléter.
- **Défaut trouvé : le contenu des modèles historiques était écrit sans accents**, et devenait public.
  - Une soixantaine de mots corrigés (« certifiée », « méthode », « séances », « Médecin généraliste », « stratégie », « téléconsultation », « Économisez »…).
  - Les prix « 90 EUR » sont devenus « 90 € » (30 prix).
  - Les clés de catégorie (« Beaute », « Sante »), qui servent au filtrage, sont intactes : relu au diff mot à mot.
- **Cause de l'accent manqué.** `lib/accents.test.ts` surveillait `page.tsx`, qui contenait ces modèles jusqu'au 23 nov. Leur déménagement dans `modelesHistoriques.ts` (U2) les a sortis de la garde sans que rien le signale. Le fichier y revient, et le dictionnaire gagne 37 mots non ambigus : la garde a aussitôt trouvé deux restes que la correction avait manqués.
- **Gardes.**
  - `registreDesModeles.test.ts` : même liste partout ; ordre et groupes des partagés inchangés ; groupes en français ; chaque modèle permet de joindre le commerce.
  - `e2e/catalogueUnique.spec.ts` : `/examples` annonce 65 modèles ; `/examples/coach` se rend dans son thème, sans erreur.
- **Vérifié.**
  - Typage : 0 erreur. Suite complète : 7 956 passés. Build de production : OK.
  - Navigateur : 48 e2e passent (galerie, catalogue, éditeur, composition de page).
  - Non vérifié à l'écran : la fenêtre « Modèles » de l'éditeur, qui demande une session. Son branchement est vérifié par le test du registre.
- **Suite du point 5, lot 3 (décision du propriétaire : vérifier puis exposer).** Les 62 métiers du moteur (`templateStructures.extra.ts`), jamais proposés à un utilisateur : passage à la garde anti-faux, aux accents et au rendu, puis ajout au catalogue.

## v373 — Une seule source de modèles, lot 3 : les 62 métiers, vérifiés puis exposés (24/11/2026)

Vague 4, point 5, troisième lot. **Décision du propriétaire (24 nov.) : vérifier les 62 métiers du moteur, puis les exposer.** Ils vivaient dans `templateStructures.extra.ts`, n'étaient atteints que par un banc, et aucun utilisateur ne les voyait.

- **Vérifiés d'abord.** Ils entrent dans la garde anti-faux (`preuveNonInventee.test.ts`) avant d'être montrés. Elle a relevé 292 fautes :
  - **85 avis inventés** (nom, texte, étoiles) dans 41 blocs. Les blocs restent, avec leur titre, **vides**, comme ceux des modèles partagés. Le gabarit `exampleReviews` est supprimé.
  - **28 adresses** et 27 accès inventés (rues, stations de métro), vidés.
  - **Un faux numéro** sur un bouton d'appel, et un faux téléphone dans des réseaux sociaux.
  - **Trois qualifications affirmées** (« Certifié Qualifelec », « Conventionnée », « Artisan qualifié ») et deux années périmées (« Dates ouvertes 2025 »).
- **Liens morts vidés.**
  - 53 boutons pointaient vers « # ».
  - 46 menaient à l'accueil nu d'un service (monsite.com, calendly.com, open.spotify.com, doctolib.fr, discord.gg) : un client qui prend rendez-vous arrivait sur la page d'accueil de Doctolib.
  - L'éditeur invite désormais à saisir la vraie adresse.
- **Libellés corrigés.**
  - Le compteur de visites du streamer annonçait des « membres de la commu ».
  - « Première Pro » devient « Premiere Pro », le nom du logiciel.
  - Une description contenait « — », que le catalogue lit comme séparateur d'ambiance.
  - Les points finaux des descriptions sont retirés, comme ailleurs.
- **Accents.** Le fichier rejoint `lib/accents.test.ts`. Aucune faute relevée, ni par la garde ni au relevé mot à mot.
- **Exposés.**
  - Chaque métier reçoit **son ambiance, choisie une par une** (`templates/themesDesMetiers.ts`) : menthe pour le dentiste, velours pour la cave, noir & or pour le barbier. C'est le même objet que `AMBIANCE_THEMES`, donc la galerie reconnaît le style d'origine.
  - Chaque métier passe par `avecMoyenDeJoindre`.
  - Ils entrent dans `MODELES_DE_GALERIE` (origine « metier ») et dans `CATALOGUE_DES_MODELES` : **127 modèles** dans la galerie, l'éditeur et `/examples`.
  - Le groupe « Artisan & BTP » est fusionné dans « Artisan & Services ».
  - « Santé » rejoint le classement par famille (`classementDesModeles.ts`).
- **Compte annoncé.** `MODELES_TOTAL` passe de 65 à 127 et `MODELES_GRATUITS` de 57 à 119 : les métiers sont gratuits. Le comparatif des forfaits affiche donc « 119 sur 127 ». C'est la conséquence directe de la décision ; la garde `droitsCoherents` recompte les trois sources.
- **Défaut évité dans l'alerte « valeurs d'exemple ».** Indexer 62 modèles de plus aurait signalé à tort de vrais prix (« 11 € » est aussi le prix d'un croque). Désormais, un prix n'est signalé que si le nom de sa ligne vient encore du modèle. « Foie gras poêlé, 18 € » reste signalé ; « Croque du chef, 18 € » ne l'est plus. C'est testé.
- **Gardes.**
  - `registreDesModeles.test.ts` vérifie :
    - une ambiance par métier, sans clé orpheline ;
    - le style d'origine reconnu ;
    - chaque métier dans un rayon de la galerie.
  - `e2e/catalogueUnique.spec.ts` vérifie :
    - **les 62 pages `/examples/<métier>` se rendent sans erreur, sur ordinateur et sur mobile** ;
    - le dentiste est rendu dans son dégradé menthe.
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 961 tests, tous verts.
  - Build de production : OK, 287 pages générées, page publique à 181 Ko gzip (plafond 197).
  - Navigateur : 55 e2e passent (galerie, aperçu, catalogue). Console relevée sur les 64 pages de démonstration : aucune erreur de rendu ni d'hydratation.
- **Point 5 terminé.** Galerie, éditeur et `/examples` lisent un seul catalogue. Les recettes de l'onboarding restent à part : ce sont des objectifs, pas des modèles.

## v374 — Découpe et ménage, lot 1 : une garde de taille, le code mort retiré (25/11/2026)

Vague 4, point 6, premier lot.

- **Garde de taille à cliquet : `lib/tailleDesFichiers.test.ts`.**
  - Aucun fichier source au-delà de 800 lignes, sauf les 14 qui les dépassent aujourd'hui. Ceux-là sont inscrits avec leur plafond : BuilderV4 3 004, PrintStudioClient 2 944, profil 2 229…
  - Un plafond ne monte jamais. Il doit descendre quand le fichier maigrit de plus de 50 lignes, et l'entrée sort de la liste sous 800.
  - Elle remplace le cliquet partiel de `testsDeterministes.test.ts`, qui ne gardait que trois fichiers, avec des plafonds plus lâches (BuilderV4 à 3 050).
- **Code mort retiré.**
  - `builder/themes.ts` (352 lignes) et son test : ce catalogue n'était plus lu que par un banc d'essai, rebranché sur les thèmes réels de l'éditeur. Ses fonctions de lisibilité existent déjà dans `couleurLisible.ts` (`contraste`, `encreSur`).
  - `styles/globals.css` (227 lignes) : importé nulle part.
  - Dépendances `jszip` et `nanoid` : importées nulle part (−95 lignes de fichier de verrouillage). Le `nanoid` du serveur MCP, paquet distinct, reste.
- **Défaut trouvé : deux gardes surveillaient le fichier mort.**
  - Les gardes de contraste et de polices des thèmes lisaient `themes.ts` au lieu de `editorPresets.ts`, qui porte les 152 thèmes que l'éditeur propose réellement.
  - Rebranchée, la garde des polices passe.
  - **Celle du contraste trouve 114 thèmes sur 152 sous le seuil WCAG AA (4,5:1).** Par exemple, le texte secondaire d'« Épuré Clair » est à 2,46:1 et le texte de « Summer Festival » à 2,84:1. Le produit propose donc ces thèmes, puis son alerte d'avant publication les déclare illisibles.
  - Les corriger change des couleurs visibles : c'est le lot 2. D'ici là, la liste est un cliquet (`DETTE_EDITEUR`) : aucun nouveau thème ne peut y entrer, et un thème corrigé doit en sortir.
- **Non fait, volontairement.**
  - Les 52 scripts `.ps1` de la racine ne sont pas suivis par git (`.gitignore`). Ce sont des fichiers locaux du propriétaire : les supprimer serait irréversible, c'est sa décision.
  - `homeSectionsRetirees.tsx` est un grenier gardé exprès : il reste.
  - L'alignement de `@types/react` sur React 18 est un lot à part.
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 949 tests, tous verts.
  - Build de production : OK, 181 Ko gzip.
  - Navigateur : 12 e2e du banc `public-page` passent.

## v375 — Découpe et ménage, lot 2 : les 152 thèmes de l'éditeur se lisent tous (25/11/2026)

Vague 4, point 6, deuxième lot. Le lot 1 avait trouvé 114 thèmes de l'éditeur sous le seuil WCAG AA. Le produit les proposait, puis son alerte d'avant publication les déclarait illisibles.

- **140 couleurs corrigées, sur 113 thèmes.**
  - Seule la clarté HSL de `text`, `muted` et `primary` a bougé, et seulement pour les couleurs fautives. Teinte et saturation sont gardées.
  - Chaque couleur atteint au moins 4,6:1 sur le fond, la surface et chaque arrêt de dégradé. La marge au-dessus de 4,5 met à l'abri des arrondis.
  - Les écarts de clarté : 59 couleurs ont bougé de 5 points ou moins, 47 de 6 à 10, 22 de 11 à 15 et 14 de plus de 15. Les plus gros écarts sont des textes secondaires sombres sur fond noir (Ocean Deep +18, Forest Zen +18) et le bordeaux de Wine Cellar, devenu framboise (+24).
- **Deux thèmes à fond vif, traités à la main.**
  - **Summer Festival.** Le blanc plafonne à 1,8:1 sur l'orange. L'orange, qui fait l'identité du thème, reste. L'encre passe à un brun très foncé (#2E0C00) dans la teinte de l'orange. Le blanc n'a pas de teinte à garder, c'est pourquoi l'encre ne suit pas la règle de la clarté seule.
  - **Pop Art Music.** L'encre blanche, qui fait l'identité du thème, reste. Ce sont les arrêts du dégradé qui s'assombrissent, en clarté seule : rose #FF3CAC→#C80073, bleu #2B86C5→#236C9F.
- **Contrôle à l'œil.** Une planche avant/après des 114 thèmes, générée à partir du diff, montre un vrai texte et un prix sur le fond et la surface. Les identités tiennent.
- **Garde.** La liste de dette `DETTE_EDITEUR` et son cliquet sont supprimés : la règle de contraste vaut désormais pour les 152 thèmes, sans exception. Un nouveau test vérifie que les 152 sont bien lus, pour qu'un thème ne puisse pas échapper au contrôle sans bruit.
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 949 tests, tous verts.
  - Navigateur : 50 e2e passent, dont les captures de référence du builder et le banc de la page publique.
  - Build : non nécessaire, la page publique n'importe pas `editorPresets`.

## v376 — Découpe et ménage, lot 3 : les types de React alignés sur React 18 (25/11/2026)

Vague 4, point 6, troisième lot.

- **Le défaut.** Le projet tourne sur React 18.3.1, mais il était typé avec `@types/react` 19.2.15 et `@types/react-dom` 19.2.3. Le typage acceptait donc des API qui n'existent pas à l'exécution : rien n'avertissait qu'on les utilisait. Le gotcha `inert` de la mémoire en est un exemple.
- **Aligné** sur `@types/react` 18.3.31 et `@types/react-dom` 18.3.7.
  - Pour `@types/react`, la 18.3.31 date du 5 juin 2026. La 18.3.32 existe, mais elle a été publiée la veille : écartée par prudence.
  - Les versions sont épinglées exactement, comme les précédentes.
- **16 erreurs de typage révélées, une seule cause.** Des refs étaient déclarées à la manière de React 19 (`RefObject<T | null>`), que l'attribut `ref` de React 18 refuse.
  - 15 venaient du type de retour de `useDialogue`, corrigé en `RefObject<HTMLDivElement>`.
  - La dernière venait de la fiche de `PublicCarteIllustree`.
  - Ce sont trois lignes de types, sans aucun changement de comportement.
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 949 tests, tous verts.
  - Build de production : OK, page publique à 181 Ko gzip.

## v377 — Découpe de BuilderV4, lot 1 : la fenêtre « Publier » dans son fichier (25/11/2026)

Vague 4, point 6, quatrième lot.

- **Ce qui sort.** La fenêtre « Publier », soit 146 lignes, quitte BuilderV4 pour `FenetrePublier.tsx`. On y trouve l'en-tête, le statut, l'adresse, les vues et scans, le bouton principal, les alertes d'avant publication, le QR et les supports d'impression.
  - Le code de rendu est déplacé tel quel : mêmes styles, mêmes libellés, même ordre.
  - La fenêtre ne possède aucun état. L'éditeur lui passe l'état de la page et ses actions.
  - Les trois actions des alertes (`onVoir`, `onVoirTheme`, `onMasquer`) restent écrites dans BuilderV4, parce qu'elles pilotent la sélection et les onglets de l'éditeur.
- **Résultat.** BuilderV4 passe de 3 004 à **2 868 lignes**, et son plafond est abaissé d'autant dans la garde de taille.
  - Cinq imports devenus inutiles sont retirés : `Globe`, `Send`, `Modal`, `AlertesPublication`, `LIBELLE_ENREGISTRER_EN_LIGNE`.
- **Gardes réancrées, sans rien perdre.** Cinq tests lisaient la fenêtre dans le texte de BuilderV4 : `fenetrePublier`, `dialogues`, `editeurSimplifie`, `modificationsEnDirect` et `phraseQuiSeMontre`.
  - Chacun vérifie maintenant les deux côtés : l'éditeur ouvre la fenêtre et lui passe ses actions, et la fenêtre passe par `Modal` et place le résumé entre l'erreur et « Voir la page ».
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 951 tests, tous verts.
  - Navigateur : `pointsAvantPublier` et `codeEnClair` ouvrent la fenêtre et cliquent « Voir » et « Masquer ». Ils passent, de même que les captures de référence du builder et les parcours `parcoursGerantDeBar` et `ardoiseDuJour`.
  - Un échec isolé d'`ardoiseDuJour` venait d'une capture refusée par Chrome. Relancé seul, le test passe 8 fois sur 8.

## v378 — Découpe de BuilderV4, lot 2 : la barre de sélection multiple, et un test qui la joue (25/11/2026)

Vague 4, point 6, cinquième lot.

- **Ce qui sort.** La barre flottante qui apparaît dès deux blocs sélectionnés quitte BuilderV4 pour `BarreMultiSelection.tsx`. Elle contient le compteur et les boutons Masquer/Afficher, Verrouiller, Dupliquer, Supprimer et ×.
  - Le rendu est déplacé tel quel. La barre ne possède aucun état : la sélection et les actions restent celles de l'éditeur.
  - BuilderV4 passe de 2 868 à **2 789 lignes**, et son plafond est abaissé.
- **Gardes réancrées des deux côtés.**
  - `suppressionBloc` vérifie que l'éditeur passe `deleteMulti` tel quel, et que le bouton l'appelle sans fenêtre de confirmation.
  - `barreQuiReserve` compte toujours 5 barres collantes, dont 1 dans le nouveau fichier.
- **Nouveau test navigateur : `e2e/selectionMultiple.spec.ts`.** Aucun test n'exerçait ce geste. Celui-ci le joue en entier : Maj+clic sur deux blocs, « 2 blocs sélectionnés », Masquer puis Afficher, puis × qui fait disparaître la barre. Une capture de la barre est enregistrée.
- **Correction d'une affirmation des lots v375 et v377.** Leurs bilans disaient « captures de référence du builder : passent ». C'était faux, pour deux raisons.
  - `builder-visual.spec.ts` ne tourne qu'avec `VISUAL=1` : il avait été **sauté**.
  - Son banc (`/e2e-harness/builder-redesign`) ne rend pas BuilderV4. Il ne pouvait donc rien prouver sur ces lots. Ce qui les vérifie, ce sont les tests qui ouvrent `/dashboard/builder` : `pointsAvantPublier`, `codeEnClair` et `selectionMultiple`.
  - Lancé pour de bon avec `VISUAL=1`, le test donne ceci. Sa référence « bibliothèque » est **périmée** : elle montre l'onglet « Recommandés » et six blocs, alors que la bibliothèque affiche aujourd'hui « Essentiels ». Ce changement date d'avant ces lots. La référence n'est pas régénérée à l'aveugle : c'est au propriétaire de valider la nouvelle image.
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 953 tests, tous verts.
  - Navigateur : `selectionMultiple` passe.

## v379 — Découpe de BuilderV4, lot 3 : la liste de la bibliothèque dans son fichier (25/11/2026)

Vague 4, point 6, sixième lot. C'est le plus gros morceau de la découpe.

- **Ce qui sort.** La liste défilante de la bibliothèque de blocs (colonne de gauche, panneau déplié) quitte BuilderV4 pour `ListeDeLaBibliotheque.tsx` : 315 lignes.
  - Elle contient les résultats de recherche groupés et surlignés, l'état « Aucun bloc trouvé », les Essentiels, Récents et Favoris, les catégories en accordéon avec leurs sous-groupes (Identité, Infos façon Notion) et les modèles par métier.
  - `hlText`, qui surligne la recherche, est pur et ne servait qu'à cette liste : il déménage avec elle.
  - Le rendu est déplacé tel quel. La liste ne possède aucun état : la catégorie active, la recherche, les favoris et les actions restent ceux de l'éditeur.
- **Ce qui reste dans BuilderV4, volontairement.** Le champ de recherche, la grille des catégories, le rail replié et son tiroir. Ils partagent l'état de repli et la largeur de la colonne. Les sortir maintenant aurait multiplié les props sans rien gagner en lecture.
- **Résultat.** BuilderV4 passe de 2 789 à **2 476 lignes**, et son plafond est abaissé. Sur les trois lots, il a perdu 528 lignes (−18 %).
- **Gardes réancrées, décomptes inchangés.** Six tests lisaient la bibliothèque dans BuilderV4 : `survolQuiSeFocalise`, `lisibilite`, `descriptionQuiSeLit`, `editeurUnNiveau`, `guestMode` et le cliquet de taille. Ils lisent désormais l'éditeur et sa liste. Les décomptes n'ont pas bougé :
  - 5 étoiles favori en `role="button"`, et 5 gestionnaires clavier ;
  - 2 listes où l'aperçu s'ouvre au focus ;
  - 6 descriptions qui passent par `styleDeDescription()`.
- **Nouveau test navigateur : `e2e/listeDeLaBibliotheque.spec.ts`.** Il ouvre l'éditeur réel avec `?builderRedesign=0`, donc la bibliothèque déplacée, et joue la liste en entier.
  - Il cherche « faq » : le résultat est surligné.
  - Il cherche un mot absent : « Aucun bloc trouvé », puis « Effacer » vide le champ.
  - Il ouvre la catégorie Infos : le sous-groupe « Questions fréquentes » apparaît.
  - Il met un bloc en favori au clavier : l'étoile passe en `aria-pressed`, et la catégorie Favoris apparaît.
  - Il ajoute le bloc : la page compte un bloc de plus.
  - Une capture est enregistrée. La liste est identique à l'œil.
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 955 tests, tous verts.
  - Navigateur : 15 tests e2e de l'éditeur passent, sur bureau et téléphone, dont la bibliothèque du métier et la rangée unique sur téléphone.
  - Trois tests e2e échouent à la connexion (`journey` ×2, `builder-mobile` ouverture). Ils se connectent à la base Supabase de `.env.local`, qui n'existe plus : ils ne peuvent pas passer, avec ou sans ce lot.

## v380 — Découpe de BuilderV4, lot 4 : les réglages d'un bloc dans leur fichier (25/11/2026)

Vague 4, point 6, septième lot.

- **Ce qui sort.** L'inspecteur du bloc sélectionné, soit 210 lignes, quitte BuilderV4 pour `ReglagesDuBloc.tsx`. On y trouve :
  - les onglets internes du mode Focus ;
  - l'onglet Contenu ;
  - l'onglet Style : modèles d'apparence, copier/coller du style, dégradés, couleur, intensité, bordure, coins, ombre ;
  - l'apparence du bloc et la mise en page (largeur, espacement, taille du texte) ;
  - l'onglet Effets : animations, halo, verre ;
  - les réglages avancés : visibilité, nom interne, Dupliquer/Supprimer.
- **Comment.** C'était une fonction anonyme exécutée en ligne dans le rendu. Elle devient un composant, avec ses petites fonctions locales (`sel`, `toggle`, `set`) gardées telles quelles.
  - Aucun état propre : l'onglet ouvert, le presse-papiers de style et l'ouverture des réglages avancés restent dans l'éditeur, qui les garde d'un bloc à l'autre.
  - 17 imports devenus inutiles sont retirés de BuilderV4.
- **Résultat.** BuilderV4 passe de 2 476 à **2 271 lignes**, et son plafond est abaissé. Depuis le début de la découpe, il a perdu 733 lignes (−24 %).
- **Gardes réancrées.** Cinq tests lisaient l'inspecteur dans BuilderV4 : `inspecteurTroisOnglets` (27 cas), `chromeCalme`, `editeurSimplifie`, `editeurUnNiveau` et `reglagesVisuelsDansStyle`.
  - `inspecteurTroisOnglets` lit désormais le composant en entier. Il vérifie en plus que l'éditeur le rend pour le bloc sélectionné. Sa vérification des onglets ne dépend plus de l'indentation.
  - Les quatre autres lisent l'éditeur suivi de ses réglages. Leurs comparaisons d'ordre restent à l'intérieur d'un même fichier.
- **Nouveau test navigateur : `e2e/reglagesDuBloc.spec.ts`.** Il ouvre le vrai éditeur sur ordinateur et parcourt les réglages d'un bloc.
  - **Style :** il allume la bordure.
  - **Copier/coller :** il copie le style d'un bloc et le colle sur un autre ; la bordure suit.
  - **Effets :** il allume le halo.
  - **Réglages avancés :** il les ouvre (`aria-expanded`), saisit un nom interne, puis clique Dupliquer, ce qui ajoute un bloc.
  - Une capture de l'onglet Style est enregistrée. Le panneau est identique à l'œil.
- **Correction des données de test.** Les brouillons de `selectionMultiple` et de `reglagesDuBloc` utilisaient un type de bloc `text` qui n'existe pas. Le canevas affichait alors « 📦 text » et l'en-tête de l'inspecteur restait sans nom. Ils utilisent maintenant `rich_text`.
- **Relevé au passage, antérieur à ce lot, non traité :**
  - sur le canevas, l'étiquette du bloc sélectionné (« Texte ») recouvre le début de son texte ;
  - l'indicateur de développement de Next affiche « 1 Issue » sur chaque capture de l'éditeur, cause non identifiée.
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 957 tests, tous verts.
  - Navigateur : 10 tests e2e de l'éditeur passent, sur ordinateur et téléphone (`reglagesDuBloc`, `selectionMultiple`, `listeDeLaBibliotheque`, `pointsAvantPublier`, `modifierAuPouce`, `toucherUnBlocLOuvre`).

## v381 — Deux défauts vus sur les captures de l'éditeur (25/11/2026)

Les deux défauts relevés en v380, traités.

- **« 1 Issue » en permanence dans l'éditeur (développement).**
  - **Mesuré :** une sonde a ouvert le panneau de Next. Le problème était l'erreur React « eval() is not supported in this environment ». React n'utilise `eval` qu'en développement, pour reconstruire ses piles d'appels, et la CSP du produit l'interdit partout.
  - **Pourquoi c'est un défaut, et pas un bruit :** le compteur ne descendait jamais sous 1, donc une vraie erreur de l'éditeur s'y serait cachée.
  - **Corrigé dans `next.config.mjs` :** `'unsafe-eval'` est ajouté à `script-src` uniquement quand `NODE_ENV === "development"`, c'est-à-dire sous `next dev`. `next build` pose `production`, et Vitest pose `test`. La politique servie aux visiteurs est inchangée, octet pour octet.
  - **Garde :** `politiqueQuiSapplique.test.ts` charge la configuration sous les deux environnements. En production, `script-src 'self' 'unsafe-inline'` exactement ; en développement, la même directive avec `'unsafe-eval'` en plus. Les gardes existantes, qui interdisent `'unsafe-eval'`, lisent toujours la politique de production.
  - **Vérifié dans le navigateur :** la sonde ne trouve plus aucun « Issue ».
  - **Non traité :** en développement, la console signale aussi que le script de débogage de Vercel Analytics (`va.vercel-scripts.com`) est bloqué par la CSP. Le compteur de Next ne le compte pas. En production, Analytics est servi depuis notre domaine (`/_vercel/insights`), donc il n'y a rien à ouvrir. Le corriger demanderait de toucher au layout racine.
- **L'étiquette du bloc sélectionné couvrait son texte.**
  - L'étiquette « 📄 Texte » était posée à l'intérieur du bloc (`bottom: 6`). Sur un paragraphe d'une ligne, elle masquait le début du texte qu'on venait de choisir.
  - **Corrigé.** Elle est maintenant à cheval sur le bord bas (`bottom: -11`) et ne prend plus les clics (`pointer-events: none`).
  - Elle n'apparaît plus quand l'inspecteur est ouvert à côté. Son en-tête (« Propriétés · 📄 Texte ») dit déjà la même chose, et une étiquette extérieure empiète forcément sur le bloc voisin quand deux blocs se touchent. Elle revient quand le panneau de droite est replié, sur l'onglet Page, ou sur téléphone.
  - BuilderV4 reste à 2 271 lignes. L'explication vit dans le test, et le code porte un repère `data-etiquette-bloc`.
  - **Garde :** `e2e/etiquetteDuBloc.spec.ts`. Avec l'inspecteur ouvert, l'étiquette est absente. Une fois le panneau replié, elle est présente, sa boîte ne croise pas celle du texte, et `pointer-events` vaut `none`.
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 958 tests, tous verts.
  - Navigateur : `etiquetteDuBloc`, `reglagesDuBloc` et `selectionMultiple` passent. Les captures n'affichent plus « 1 Issue ».

## v382 — Découpe de PrintStudioClient, lot 1 : les champs de l'atelier dans leur fichier (25/11/2026)

PrintStudioClient n'avait jamais été découpé (2 944 lignes). Avant d'extraire quoi que ce soit, un script a mesuré ce que chaque bloc candidat emprunte au reste du fichier.

- **Le rendu du support** (l. 2216-2944) dépend de quatorze noms définis plus haut : `FreeEl`, `ACCENTS`, `ICON_LIB`, `shade`, `readableOn`, et d'autres. Il viendra dans un lot suivant, avec ses dépendances.
- **Les champs** (l. 2061-2215) n'empruntent rien au fichier : seulement les jetons du studio, `useFermetureEchap`, `zoneDeTouche` et une icône. C'est le premier lot, parce qu'il est sans risque.
  - **Extraits verbatim dans `print-studio/champsDuStudio.tsx`** (168 lignes) : `FilterSelect`, `ActiveChip`, `RailInline`, `chipStyle`, `Field`, `SuggRow`, `Seg`, `TuileCouleurLibre`, `ColorField`, `Range`, `Swatch`, ainsi que `inputStyle` et `secLabel`.
  - **PrintStudioClient passe de 2 944 à 2 790 lignes.** Le plafond de `tailleDesFichiers.test.ts` est abaissé d'autant.
  - **Aucun import retiré.** Chacun sert encore dans l'atelier, vérifié un par un.
  - **Piège de la mesure :** l'analyseur de dépendances ne voyait pas `...zoneDeTouche(14)`, car il lit le `.` du spread comme un accès de propriété. C'est le typage qui fait foi.
- **Quatre gardes ré-ancrées.** Elles lisaient les champs dans le texte de l'atelier. Chacune lit désormais l'atelier et ses champs, ou le seul fichier où vit la ligne qu'elle cherche :
  - `cibleQuiSeTouche` : la croix d'un filtre actif ;
  - `coucheQuiSeFerme` : le sélecteur de filtre se ferme toujours à Échap, et l'entrée pointe vers `champsDuStudio.tsx` ;
  - `troisDerniersEcrans` : le segmenteur ;
  - `atelier.test` : les rangées qui s'enroulent et la cible de 36 px. L'atelier est lu en premier, donc les mesures d'ordre du DOM ne voient que lui.
- **Vérifié.**
  - Typage : 0 erreur.
  - Suite complète : 7 960 tests, tous verts. Deux de plus, parce que des gardes qui parcourent tous les fichiers ont trouvé le nouveau.
  - Navigateur : `atelierReglagesFins`, `atelierChoixDuModele`, `atelierCadrageMobile` et `ciblesAuPouce`. 17 tests passent. Les 9 sautés sont les variantes bureau de tests réservés au téléphone.

## v383 — Découpe de PrintStudioClient, lot 2 : le rendu du support et son vocabulaire (25/11/2026)

Le rendu du support dépendait de quatorze définitions du haut du fichier. Elles sortent avec lui, dans deux fichiers : ce qui dessine, et la langue qu'il parle.

- **`print-studio/vocabulaireDuSupport.ts`** (130 lignes, aucun JSX, aucun état). Il regroupe :
  - les mises en page compatibles : `resolveLayoutId`, `layoutOk`, `fitLayout` ;
  - les accents : `ACCENTS`, `hexDAccent` ;
  - les encres : `readableOn`, `shade`, `TITLE_WEIGHT` ;
  - l'élément libre : `FreeEl`, `layerLabel`, `freeElsEdgeMm` ;
  - les bibliothèques : `ICON_LIB`, `ICON_CATS`, `SHAPES` ;
  - les compositions prêtes et les modèles « 1 clic » : `COMPOSITIONS`, `PRESETS`.
- **`print-studio/renduDuSupport.tsx`** (≈ 400 lignes). Il regroupe :
  - `SupportVisual` ;
  - la planche à taille réelle : `PrintSheet` ;
  - la planche multi-supports : `GangCell`, `MultiSheet` ;
  - l'élément libre : `FreeElView` ;
  - le packshot : `Packshot` ;
  - les QR : `FauxQR` et le QR vectoriel `QRVector` ;
  - la miniature de bibliothèque : `MiniSupport`.

  Ce qu'on voit à l'écran et ce qui part chez l'imprimeur sortent du même composant, et ce composant ne lit rien de l'état de l'atelier.
- **Ce qui reste dans l'atelier.** L'état de l'interface reste dans PrintStudioClient : onglets, positions de la feuille mobile, libellés de finition. Les vignettes de modèles, les bibliothèques et l'éditeur à plat feront le lot 3.
- **Méthode.** Un script découpe le fichier en déclarations de premier niveau, chacune avec ses commentaires. Il déplace celles qu'on lui nomme, et calcule les imports de chaque fichier d'après ce qu'il emploie vraiment.
  - **Piège :** le script prenait les noms écrits dans des chaînes (`"ArrowDown"`, `"Star"`, la lettre `C`) pour des usages. Les imports en trop ont été retrouvés avec `tsc --noUnusedLocals`, puis retirés.
  - **Résultat :** PrintStudioClient passe de 2 790 à **2 261 lignes**, soit −23 % depuis v382. Le plafond est abaissé d'autant.
- **Neuf gardes ré-ancrées.** Aucune n'est relâchée.
  - `atelier.test`, `formatImpression`, `styleDuQr` et `glisserAuDoigt` lisent l'atelier et le rendu.
  - `vignetteQuiSeDemande` : l'exception « qrImg » (une `data:` URL déjà en mémoire) désigne désormais `renduDuSupport.tsx`.
  - **`clicQuiSAtteintAuClavier`** : la frontière du canevas couvre maintenant deux fichiers. Les dix éléments du support qui ouvrent leur réglage au clic (titre, QR, détails) étaient déjà couverts dans PrintStudioClient ; la frontière les a suivis. Une sonde a montré que l'atelier en a encore besoin pour lui-même : le fond du canevas, à la ligne 1307. La garde « les frontières ne grossissent pas » liste donc quatre fichiers, et son commentaire dit pourquoi.
  - **`lisibiliteEtCibles`** : la dispense « au-delà de la ligne 2200 » est ramenée à la ligne 1930, l'en-tête « sous-composants ». Elle couvre exactement le même code (vignettes, bibliothèques, éditeur à plat), qui ne compte plus que 330 lignes. `renduDuSupport.tsx` n'a aucune dispense.
  - **`ecransOublies`** vérifie la nouvelle borne. Il vérifie aussi que la ligne 1930 est bien l'en-tête des sous-composants : un numéro de ligne dérive sans bruit, et celui-ci casse maintenant s'il ne désigne plus rien.
- **Laissé, noté.** `--noUnusedLocals` relève du code mort qui existait avant ce lot : `FINISH_LABEL`, `FRAME_LABEL`, `activePreset`, `tmpls`, `applyMode`, `libre`. Ce code se retire dans un lot de ménage à part, pas mélangé à un déplacement.
- **Vérifié.**
  - Typage : 0 erreur.
  - `check-jsx-imports` : OK.
  - Suite complète : 7 962 tests, tous verts.
  - Navigateur, chemin d'impression : 33 tests passent, sur bureau et téléphone : `pdfVectoriel`, `pdfChevalet` (le PDF fait 114 × 84 mm), `qrImprimeCommeDessine`, `print-handoff`, `impressionRelue`, `atelierChoixDuModele`, `atelierReglagesFins` et `atelierQrQuiAboutit`. Les 5 tests sautés sont les variantes bureau de tests propres au téléphone.

## v384 — Découpe de PrintStudioClient, lot 3 : les bibliothèques et l'éditeur à plat (25/11/2026)

Dernier bloc sous l'en-tête « sous-composants ». L'atelier ne garde plus que son propre écran.

- **`print-studio/bibliothequesDuStudio.tsx`** (180 lignes). Il contient :
  - les vignettes de modèles « 1 clic » (`PresetThumb`) ;
  - la bibliothèque de templates : `TemplateThumb`, `TPL_CATS`, l'aperçu au survol `TemplateHoverCard` et `TemplateLibrary` ;
  - la bibliothèque « + Ajouter » (`AddLibrary`).
- **`print-studio/editeurAPlat.tsx`** (167 lignes). Il contient `FlatEditor` (glisser, redimensionner, édition du texte en place, guides, anti-collision) et `ZoomBar`.
- **L'atelier passe de 2 261 à 1 929 lignes.** Sur les trois lots, il a perdu **1 015 lignes, soit 34 %**. Le plafond est abaissé. L'en-tête « sous-composants », qui ne coiffait plus rien, est retiré.
- **Lisibilité : la dispense de l'atelier est supprimée, et la garde se resserre.**
  - **Avant :** la règle des 11 px ne s'appliquait pas à « tout ce qui suit la ligne N ». Ces 330 lignes contenaient quatre libellés d'**interface** à 10,5 px, exemptés par leur seule position : le nom d'un modèle sous sa vignette, les objectifs d'un template, et deux libellés des tuiles « + Ajouter ».
  - **Ces quatre libellés passent à 11 px**, soit un demi-pixel de plus.
  - **Seule exemption restante :** la miniature qui reproduit le support imprimé, dans l'aperçu au survol d'un modèle (marque à 8,5 px, sous-titre, bouton). Elle est bornée par deux repères de code, et non plus par un numéro de ligne.
  - **`ecransOublies`** vérifie désormais que PrintStudioClient n'a plus aucune dispense, et que la borne existe.
- **Gardes ré-ancrées.** `atelier.test`, `glisserAuDoigt` (les poignées de l'éditeur) et `cibleQuiSeTouche` (les variantes d'un modèle) lisent aussi les nouveaux fichiers.
  - La frontière clavier n'a pas bougé : l'éditeur à plat passe la garde `clicQuiSAtteintAuClavier` sans dispense.
- **Nouveau test navigateur : `e2e/editeurAPlat.spec.ts`.** Aucun test ne jouait l'éditeur à plat. Celui-ci, sur bureau :
  - zoome (100 → 110 %) puis revient à « Ajuster » ;
  - pose un texte depuis le rail et le glisse à la souris (il suit) ;
  - ouvre « + Ajouter », cherche « cercle » et pose la forme.
- **Vu sur la capture, non traité :** une forme ajoutée se pose sur le QR, au centre du support. C'est le placement par défaut d'`addFreeShape`, qui existait avant ce lot.
- **Vérifié.**
  - Typage : 0 erreur.
  - `check-jsx-imports` : OK.
  - Suite complète : 7 966 tests, tous verts.
  - Navigateur : 23 tests passent (`editeurAPlat`, `atelierChoixDuModele`, `atelierReglagesFins`, `pdfVectoriel`, `qrImprimeCommeDessine`, `print-handoff`). Les 5 tests sautés sont des variantes réservées à l'autre appareil.
