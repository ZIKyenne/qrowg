# 01 — Constats revérifiés (22 novembre 2026)

Statuts : `BUG CONFIRMÉ`, `FRICTION UX OBSERVÉE`, `RISQUE ARCHITECTURE`, `PROPOSITION`, `INFIRMÉ`, `INCONNU`.

## A. Les observations publiques du pack, une par une

| ID | Constat du pack | Statut | Preuve | Suite |
|---|---|---|---|---|
| OBS-001 | Prix de l'accueil 0 / 4,90 / 12,90 / 29,90 € | CONFIRMÉ (référence) | `lib/plans.ts` | — |
| OBS-002 | CGU à 19 € et 49 €, sans Starter | **INFIRMÉ** | `/terms` en ligne (mise à jour du 14/11/2026) affiche 4,90 / 12,90 / 29,90 €, lus dans `lib/plans.ts` (`app/terms/page.tsx` l.41-52) | Rien à faire : le pack s'appuyait sur une version ancienne |
| OBS-003 | Retrait du branding dès Starter | Cohérent (texte) | accueil et FAQ | Test réel des droits : D5 |
| OBS-004 | 65 modèles sur `/creer` | CONFIRMÉ | `MODELES_TOTAL = 65` (`lib/plans.ts` l.398), garde `lib/droitsCoherents.test.ts` | — |
| OBS-005 | 51 modèles sur `/examples` | **INFIRMÉ comme anomalie** | `/examples` liste `PAGE_TEMPLATES` (51). Les 14 autres sont les modèles signature de la galerie. 51 + 14 = 65, recompté par la garde | — |
| OBS-006 | Composer sans compte, inscription à la publication | CONFIRMÉ (codé et testé) | `e2e/parcoursGerantDeBar.spec.ts`, retour après inscription | Après inscription, test avec une vraie base : INCONNU |
| OBS-009 | « Moins d'une seconde après le scan, même en 4G » | **BUG CONFIRMÉ (promesse non tenue)** | Mesure du 21/11 : 0,3-0,45 s à chaud, mais 1,2-1,5 s au premier scan après une pause, côté serveur seulement | **Corrigé en v326** |
| OBS-011 | Rétrogradation : les excédents passent en pause, l'utilisateur choisit | CONFIRMÉ en partie | Le webhook met en pause les plus récents automatiquement (`reconcileDynamicLinks`), puis prévient par e-mail. Le gérant peut ensuite rallumer ou éteindre (`/api/qr-status`). Il n'y a pas de choix **avant** l'échéance | D3 |
| OBS-012 | « Données dans l'UE », mais application servie depuis iad1 | **BUG CONFIRMÉ (texte périmé)** | `/privacy` (5/09) dit « Vercel iad1, États-Unis » ; les fonctions sont en `cdg1` (Paris) depuis la v309 (`vercel.json`) | Texte juridique : D2 |
| OBS-013 | Liens de pied de page sans destination | **CONFIRMÉ** | `app/HomeClient.tsx` : Blog, À propos, Roadmap, Changelog = `<span>` « (bientôt) » | **Corrigé en v326** |
| OBS-015 | Interne non inspectable | Levé en partie | voir `00_ETAT_DES_LIEUX_REEL.md` | — |

## B. Constats trouvés pendant l'audit

| ID | Parcours | Problème utilisateur | Preuve | Gravité | Statut |
|---|---|---|---|---|---|
| C-01 | Accueil, pied de page | Badge vert « Tous les systèmes opérationnels » écrit en dur, relié à aucune supervision : il reste vert même en panne | `app/HomeClient.tsx` (avant v326, `.fstatus`) | Moyenne (confiance) | **Corrigé en v326** |
| C-02 | Accueil, pied de page | « v1.0.0 » ne correspond à aucune version réelle ; « Exemples » doublait « Modèles » (même `/examples`) | idem | Faible | **Corrigé en v326** |
| C-03 | Éditeur → page publique | Sur une page publiée, chaque sauvegarde automatique est visible aussitôt par les visiteurs, alors que « Mettre à jour la page » suggère une étape de plus | `savePage.ts` écrit `blocks` ; `lecturePublique.ts` lit `blocks` ; rendu à chaque requête (nonce) ; `BuilderV4.tsx` l.1612 | **Élevée** (une modification à moitié faite est visible en plein service) | RISQUE ARCHITECTURE → D1 |
| C-04 | Menu au téléphone | Deux menus complets (☰ + barre du bas), abonnement annoncé dans Profil | `DashboardShell.tsx`, `MobileNav.tsx` | Moyenne | **Corrigé en v325** |
| C-05 | Photos | Aucun traitement HEIC explicite. L'EXIF n'est mentionné que dans `useImageUpload.ts` | grep `heic` = 0 | Inconnue (dépend du navigateur) | INCONNU : à tester sur iPhone réel |

## C. Ce que le pack supposait cassé et qui ne l'est pas

Statuts « DÉJÀ FAIT », avec preuve :
- **Réponses de sauvegarde hors ordre (DATA-002) :** `saveController.ts` sérialise les sauvegardes ; testé.
- **Double-clic sur Publier (DATA-005) :** `createPublishController` refuse un second appel tant que le premier tourne (`publish.ts`).
- **Statut honnête (DATA-004) :** messages distincts `SAVE_FAIL_MSG` et `PUBLISH_FAIL_MSG`. Aucun « Publié » n'est affiché si la sauvegarde a échoué.
- **Deux onglets (DATA-007) :** contrôle de version `updated_at` → `CODE_CONFLIT` (`savePage.ts`), l'éditeur ne peut plus écraser « Ma carte ».
- **Rupture sans suppression (SECT-003) :** « Ma carte » rend un produit épuisé d'un toucher, rangé par nom dans `content.epuises`.
- **Réordonner sans glisser (EDIT-008 / A11Y-003) :** Monter / Descendre dans `builderPanels.tsx` et dans le répéteur.
- **QR par emplacement (QR-007 / ANA-004) :** `?s=` propagé, `qr_source`, `SupportPanel`, nommage via `/api/qr-label`.
- **Propriétaire non compté (ANA-005) :** `lib/visiteurDeLaMaison.ts`.
- **Contrôle d'impression (PRINT-002) :** `printPreflight` + `qrScannability` (jauge en direct).
- **Données d'exemple non publiées comme vraies (DISC-006) :** `valeursDExemple`, alertes dans la feuille Publier.
