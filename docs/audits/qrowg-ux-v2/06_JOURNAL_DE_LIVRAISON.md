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
