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
