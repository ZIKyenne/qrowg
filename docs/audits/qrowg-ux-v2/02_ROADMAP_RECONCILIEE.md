# 02 — Backlog réconcilié avec le dépôt (22 novembre 2026)

Statuts :
- `DÉJÀ FAIT` : le code existe et un test le garde.
- `CONFIRMÉ` : le défaut existe, il est à traiter.
- `À TESTER` : il faut une vraie base, un vrai appareil ou deux comptes.
- `NOUVEAU` : pertinent, absent du code.
- `INADAPTÉ` : écarté, avec la raison.
- `DÉCISION` : voir `05_DECISIONS_HUMAINES.md`.

Chemins relatifs à `apps/web/src/` sauf mention. Le pack annonçait 165 tickets ; le CSV fourni en contient 150. Les tickets sont regroupés quand leur preuve est commune.

## Lots ordonnés

| Lot | Contenu | Statut |
|---|---|---|
| v325 | Menu au téléphone : un seul menu, sous-titres justes (MOB-003, DES-003) | FAIT |
| v326 | Promesses vraies : pied de page sans « bientôt », sans faux feu vert ni fausse version, promesse « < 1 s » retirée (TRUTH-007, TRUTH-008, OBS-009, OBS-013) | FAIT |
| v327 | D1-A : l'éditeur dit que les modifications d'une page en ligne sont visibles dès qu'elles sont enregistrées ; « Mettre à jour la page » devient « Enregistrer maintenant » | FAIT |
| v328-v329 | Passage « client attablé » : Red Fish 320/390 (badge « PRINCIPAL » retiré) + 9 modèles bar/resto à 320 px (bandeau démo à 44 px) | FAIT |
| v335 | D2 : politique de confidentialité, l'application tourne à Paris | FAIT |
| v336 | D3 option A : l'abonné choisit avant l'échéance ce qui reste actif au retour au gratuit | FAIT (migration à lancer) |
| v337 | D4 : réglages actuels confirmés ; facture pro (adresse + n° de TVA dans la caisse Stripe) | FAIT |
| Bloqué | D1-B, multi-sites, appareil réel (D5) | attend décision ou appareil |

## TRUTH — cohérence des promesses

| ID | Statut | Preuve / suite |
|---|---|---|
| TRUTH-001 | DÉJÀ FAIT | Prix uniques dans `lib/plans.ts`, lus par les CGU, `/upgrade` et l'accueil ; gardes `lib/droitsCoherents.test.ts`, `lib/promessesPlan.test.ts`, `e2e/prixAnnuelCoherent` |
| TRUTH-002 | INFIRMÉ | Les CGU en ligne du 14/11 concordent avec l'accueil |
| TRUTH-003 | À TESTER | Promesse cohérente ; droit réel à vérifier avec un compte Starter (D5) |
| TRUTH-004 | DÉJÀ FAIT | 51 + 14 = 65, recompté par une garde |
| TRUTH-005 | À TESTER | « 5 minutes » : chronométrage d'une vraie personne requis |
| TRUTH-006 | FAIT v335 | D2 validée le 22/11 : /privacy, /security et la FAQ des guides disent cdg1 (Paris) |
| TRUTH-007 | FAIT v326 | `revueP1P2.test.ts` « le pied de page ne promet rien… » |
| TRUTH-008 | FAIT v326 | Promesse « < 1 s » retirée ; garde « aucune promesse de vitesse chiffrée sans mesure » |

## DISC / TPL — découverte et modèles

| ID | Statut | Preuve / suite |
|---|---|---|
| DISC-001 | DÉJÀ FAIT | `/dashboard/onboarding` : parcours par objectif (menu, page pro…) |
| DISC-002 | DÉJÀ FAIT | « Pour bien démarrer · 8 recommandés » + catalogue complet (`classementDesModeles.ts`) |
| DISC-003 | DÉJÀ FAIT (local) / À TESTER (base réelle) | Brouillon invité repris après inscription (`e2e/parcoursGerantDeBar.spec.ts`) |
| DISC-004 | DÉJÀ FAIT | Fenêtre de création réduite au nom affiché (v262) ; « Vous avez déjà une carte ? » partout (`e2e/carteALaCreation.spec.ts`) |
| DISC-005 | DÉJÀ FAIT | Filtre « Gratuit / Formules payantes », badges de plan sur les cartes, ouverture dès Starter (v266) |
| DISC-006 | DÉJÀ FAIT | Feuille Publier : `valeursDExemple`, `AlertesPublication.tsx` |
| DISC-007 | DÉJÀ FAIT | Écran « première mise en ligne » qui reste, avec le QR (`BuilderV4.tsx` l.236-238, l.766) |
| DISC-008 | À TESTER | Entonnoir d'installation : `/dashboard/pilotage` (Supabase seul) ; pas d'événements produit fins, volontairement (pas de PostHog) |
| TPL-001 | CONFIRMÉ (dette connue) | Trois sources de modèles (galerie, `page-templates.ts`, onboarding), consolidation prévue ; risque de régression élevé, à faire avec QA visuelle |
| TPL-002 | DÉJÀ FAIT en grande partie | Miniatures réelles `MiniApercu` ; rendu commun `shared-renderer` |
| TPL-003…007 | À TESTER / NOUVEAU | Nommage et versionnage des modèles : à traiter avec TPL-001 |

## DASH — tableau de bord

| ID | Statut | Preuve / suite |
|---|---|---|
| DASH-001…003 | DÉJÀ FAIT | `prochaineEtape.ts` (état vide, brouillon, publiée), Mes pages avant les chiffres sur mobile (v254), actions Modifier / Ma carte / QR sur la ligne |
| DASH-004 | DÉJÀ FAIT | « Mes pages » liste unique, recherche, pause et réactivation (v278-v279) |
| DASH-005 | À TESTER | Multi-sites / équipe : RLS en place (migrations `team_*`), à vérifier avec deux comptes |
| DASH-006 | DÉJÀ FAIT | Compteurs honnêtes `comptesDuTableauDeBord.ts`, taux « — » si 0 vue |
| DASH-007 | DÉJÀ FAIT | `reseauQuiTombe.test.ts`, `erreurLisible` |

## EDIT / DATA — éditeur, sauvegarde, publication

| ID | Statut | Preuve / suite |
|---|---|---|
| EDIT-001 | DÉJÀ FAIT | `docs/BUILDER-REBUILD-PLAN.md`, décomposition du builder |
| EDIT-002 / 006 | DÉJÀ FAIT en partie | « Ma carte » = mode simple pour la carte (prix, épuisé, ajout) ; réglages du bloc allégés (v314) |
| EDIT-003 / 004 | DÉJÀ FAIT | Un seul modèle de données, un seul rendu ; garde `[slug]/rendererParity.test.ts` |
| EDIT-005 | DÉJÀ FAIT | `builderErrors.ts`, messages distincts sauvegarde / publication |
| EDIT-007 | DÉJÀ FAIT en partie | Prix multiples par cellule (`prixDeLaCarte`) ; formats 25/50 cl à vérifier sur un modèle bar (passage client attablé) |
| EDIT-008 | DÉJÀ FAIT | Monter / Descendre |
| EDIT-009 | DÉJÀ FAIT | Annuler 7 s (toast) dans Ma carte, confirmations de suppression (`suppressionDePage`) |
| EDIT-010 | DÉCISION | Dépend de D1-B |
| EDIT-011 | DÉJÀ FAIT en partie | `lib/motsDuProduit`, revue des mots (v266) |
| EDIT-012 | DÉJÀ FAIT | Éditeur mono-panneau < 1024 px, onglets Aperçu / Éditer |
| DATA-001…005, 007 | DÉJÀ FAIT | `saveController.ts`, `savePage.ts` (`CODE_CONFLIT`), `publish.ts` (garde unique) ; tests dédiés |
| DATA-006 | **CONFIRMÉ** ; D1-A appliquée en v327 (le dire), D1-B (brouillon séparé) non lancée | Pas de copie publiée distincte : sur une page publiée, les modifications sont en ligne aussitôt |
| DATA-008 | DÉCISION | Dépend de D1-B |

## MOB / A11Y — mobile et accessibilité

| ID | Statut | Preuve / suite |
|---|---|---|
| MOB-001 | DÉJÀ FAIT | Relevé instrumenté `ciblesAuPouce` (cliquet), `audit-mobile/` |
| MOB-002 | DÉJÀ FAIT | Bascule Aperçu / Éditer |
| MOB-003 | FAIT v325 | Un seul menu ; garde `e2e/unSeulMenu.spec.ts` |
| MOB-004 | À TESTER | Clavier iOS : appareil réel requis |
| MOB-005 / A11Y-002 | DÉJÀ FAIT | `.cible-doigt` (44 px au toucher), écrans visibles au téléphone à 0 cible fautive |
| MOB-006 | À TESTER | HEIC / EXIF (D5) |
| MOB-007 | DÉJÀ FAIT | `MobileSheet` / `ActionSheet` partout, bouton retour qui ferme |
| MOB-008 | DÉJÀ FAIT en partie | `useDefilementRetrouve` (place retrouvée) ; veille et rotation sur appareil réel : À TESTER |
| A11Y-001, 004, 006, 007 | DÉJÀ FAIT en partie | `accessibiliteBoutons.test.ts`, `nomsSansLettre.spec.ts`, focus visible global ; audit lecteur d'écran complet : À TESTER |
| A11Y-005 | DÉJÀ FAIT | Garde `mouvementQuiSeCoupe`, couverture d'intro en mouvement réduit (v318) |
| A11Y-008 | À TESTER | Zoom 200 % : à inclure au passage « client attablé » |

## QR / PRINT — codes et impression

| ID | Statut | Preuve / suite |
|---|---|---|
| QR-001 / 002 | DÉJÀ FAIT | Lien `/q/[code]` stable, destination modifiable (`/api/qr-destination`, `/api/v1`) ; le slug n'entre pas dans le code |
| QR-003 | DÉJÀ FAIT | Création de QR à la publication protégée par la garde de publication ; `checkoutDoublon.test.ts` côté paiement |
| QR-004 | FAIT v336 | Choix préalable dans Facturation (`ChoixAuRetour`), lu par le webhook à la bascule |
| QR-005 / 006 | DÉJÀ FAIT | Studio unique `QRStudioZero` ; « QR de page » et « QR vers un lien » séparés |
| QR-007 | DÉJÀ FAIT | Funnel par support |
| QR-008 | DÉJÀ FAIT | Message de pause (`pause_message`), page « en pause » au lieu d'une page blanche |
| QR-009 / PRINT-002 | DÉJÀ FAIT | `qrScannability`, `printPreflight` |
| QR-010 | FAIT v334 (migration à lancer) | QR de page : historique déjà présent (`qr_codes.dest_history`, 10 entrées, restauration). QR de lien : ajouté en v334 (`instant_qrs.dest_history`, migration `20261122120000`) |
| QR-011 / PERF-007 / OPS-004 | DÉJÀ FAIT en partie | Sonde UptimeRobot sur `/~reveil` ; pas d'alerte dédiée à `/q/` |
| PRINT-001, 003, 004 | DÉJÀ FAIT | Atelier « objets » (catalogue de supports, choix du modèle, export) |
| PRINT-005 / 006 | À TESTER | Fichiers et impression réels (D5) |
| PRINT-007 | NOUVEAU | Export en lot multi-sites : absent |

## PUB / PERF — page après scan

| ID | Statut | Preuve / suite |
|---|---|---|
| PUB-001 | DÉJÀ FAIT | `docs/SHARED-RENDERER-*`, garde de parité |
| PUB-002 / 003 | DÉJÀ FAIT (v328-v329) | Relevé Red Fish + 9 modèles ; garde `e2e/modelesRestoA320.spec.ts` |
| PUB-004 | DÉJÀ FAIT en partie | `components/Vignette` (taille demandée) |
| PUB-005 | DÉJÀ FAIT | Page publique sans session (`lecturePublique.ts`, client admin en lecture seule) |
| PUB-006 | DÉJÀ FAIT | 404 / pause expliquées |
| PUB-007 | DÉJÀ FAIT | Animation d'intro coupée en mouvement réduit, repli sans JS (`e2e/introSansScript.spec.ts`) |
| PUB-008 | DÉJÀ FAIT en partie | `e2e/carteTraduite.spec.ts` |
| PUB-009 | DÉJÀ FAIT | `noindex` sur aperçus, kit, adresse de réveil |
| PERF-001 | DÉJÀ FAIT | Mesures du 20-21 nov. (froid 1,2-1,5 s, chaud 0,3-0,45 s) |
| PERF-002…005 | DÉJÀ FAIT en partie | Région cdg1, lecture mémoïsée, réveil ; LCP p75 réel non mesuré (pas de RUM) |
| PERF-003 | FAIT v332-v333 | Socle 221 → 188 Ko gzip : page vide jugée par le serveur (v332), intro chargée à la demande (v333) ; reste types.ts et formulaires |
| PERF-006 | FAIT v331, plafond abaissé v332-v333 | Budget 197 Ko gzip vérifié à chaque build (`scripts/budget-page-publique.mjs`) |
| PERF-008 | NOUVEAU | Réseau lent réel : à mesurer sur appareil |

## BILL / SAFE / OPS / ANA

| ID | Statut | Preuve / suite |
|---|---|---|
| BILL-001 / 002 | DÉJÀ FAIT | `lib/quota.ts`, contrôles serveur (`/api/pages/create`, `/api/qr-instant`) |
| BILL-003 | INFIRMÉ | Aucune incohérence de prix à date |
| BILL-004 | DÉJÀ FAIT | Événements périmés et rejoués ignorés dans le webhook |
| BILL-005 | DÉJÀ FAIT | Quota dit « QR de page actifs » (v266) |
| BILL-006 / 009 | FAIT v336 | Voir QR-004 |
| BILL-007 / 008 | DÉJÀ FAIT | `GestionAbonnement` (montant, cycle, portail), annuel total et équivalent mensuel |
| SAFE-001…006 | DÉJÀ FAIT en partie | Revue sécurité du 27/07 (11 corrections), clés `qrk_` hachées, open-redirect corrigé ; tests à deux comptes : À TESTER |
| SAFE-007 | À TESTER | Suppression de compte |
| OPS-001…003 | DÉJÀ FAIT en partie | Journaux `[lecture-publique]`, `ecrire()` dans le webhook ; rétention des journaux Vercel Hobby : 1 h |
| ANA-001, 003, 006 | DÉJÀ FAIT | scan / vue / clic distincts, CTR = clics / impressions (`page_events`) |
| ANA-002 | INADAPTÉ pour l'instant | Décision du propriétaire : pas d'outil d'analytics produit externe |
| ANA-005 | DÉJÀ FAIT | Robots exclus (`APPAREILS_HUMAINS`), propriétaire non compté |

## SECT / GROW / QA / DES

| ID | Statut | Preuve / suite |
|---|---|---|
| SECT-001 / 003 | DÉJÀ FAIT | Onboarding « menu », Ma carte |
| SECT-002 | DÉJÀ FAIT | Colonnes 25 / 50 cl du modèle pub (v329) |
| SECT-004 | DÉJÀ FAIT | Trois livrets d'accueil (19 nov.) |
| SECT-005 | DÉJÀ FAIT + v330 | Champ « Code » masqué (existant) ; code écrit en clair ailleurs signalé avant publication (`codeEnClair.ts`) |
| SECT-006 / 007 | DÉJÀ FAIT en partie | Modèles artisan et événement existants |
| SECT-008 / PRINT-007 | NOUVEAU | Import multi-sites : absent |
| GROW-* | INADAPTÉ pour l'instant | P3, après stabilisation (cap « simplicité » du 16/11) |
| QA-001…011 | DÉJÀ FAIT en partie | 7 570 tests unitaires, 83 specs e2e ; ce qui manque demande une vraie base ou un vrai appareil |
| DES-001…007 | DÉJÀ FAIT en partie | `docs/bible/04`, tokens sémantiques `globals.css`, primitives `components/ui` ; dette suivie |
