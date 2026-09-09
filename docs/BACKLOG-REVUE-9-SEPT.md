# Backlog — revue externe du 9 septembre

Source : revue de l'accueil, des fonctionnalités, des modèles, du générateur QR, des tarifs, de la connexion, de l'éditeur et du QR Studio, sans compte. Règle du chantier : **aucune fonctionnalité ajoutée ni retirée** ; uniquement hiérarchie, densité, cohérence, états, accessibilité, texte.

Chaque ligne est copiable telle quelle dans Claude Code. Notation : `[ ]` à faire · `[x]` livré (lot) · `[~]` partiel.

## P0 — corriger en premier

### Accueil (`app/HomeClient.tsx`)
- [x] v46 · Sections visibles au repos : `useInView` démarre visible ; plus de contenu à `opacity: 0` qui attend le défilement.
- [x] v46 · Écran d'intro (barre de chargement) retiré ; particules et lueurs perpétuelles retirées.
- [x] v49 · H1, description et CTA du héros rendus sans animation d'entrée (pas de `both`/`backwards` sur du contenu essentiel) ; `prefers-reduced-motion` respecté pour le reste.

### Choix d'un modèle (`app/dashboard/templates/page.tsx`)
- [x] v49 · La carte n'est plus un `role="button"` qui contient des boutons : conteneur `<article>`, trois vrais contrôles (Favori, Aperçu, Utiliser), vignette = bouton « Aperçu » distinct ; test clavier/souris/tactile de l'aperçu. La barre de sélection fixe (doublon de « Utiliser », alimentée par le clic sur la carte entière) disparaît avec lui.
- [x] v49 · Noms de plans depuis `lib/plans.ts` (`getPlan(id).label`) : Gratuit · Établissement · Multi-sites — plus de « Starter/Pro » ici, dans l'aperçu de modèle, la puce de la coquille, l'Accueil connecté et le Profil.
- [x] v52 · Métadonnées par défaut réduites (plan, nom, phrase, action) ; le reste (blocs, durée, tags, bénéfice) au survol ou dans l'aperçu ; 6–8 modèles recommandés d'abord, tous les autres via recherche/filtres existants.
- [x] v52 · Quasi-doublons clarifiés (« Freelance Pro » / « Freelance / Consultant »), catégories et compteurs harmonisés.
- [x] v52 · Fenêtre de création : nom du projet d'abord, apparence ensuite.

### Tarification (`app/upgrade/page.tsx`, `lib/plans.ts`)
- [x] v45 · Page calmée (aplat, cartes plates, un seul accent).
- [x] v49 · Une seule source de vérité des noms/badges/droits : `lib/plans.ts` ; aucun libellé de plan écrit en dur ailleurs (test `nomsDesPlans.test.ts`).
- [x] v53 · Navigation publique pour un visiteur anonyme (pas « Retour au dashboard ») ; total annuel affiché (« 12,42 €/mois, facturé 149 €/an ») ; listes regroupées par thème ; capitalisation uniforme.

### QR Studio — le générateur public (`app/generateur-qr-code/GeneratorClient.tsx`) et son jumeau « QR vers un lien » (`app/dashboard/qr-link/page.tsx`)
- [x] v51 · Interface tenue en `100dvh` : aperçu du QR, statut et action principale toujours visibles ; PNG/SVG dans une barre d'action fixe.
- [x] v51 · Réglages en Style · Couleurs · Logo · Avancé (correction d'erreur dans Avancé) — mêmes réglages, mieux rangés. « Forme » n'est pas une section à part : la forme des modules EST le réglage « Style », et aucun réglage n'est ajouté.
- [x] v51 · Un seul diagnostic lisible (« Excellente lisibilité », « Contraste insuffisant »…).
- [x] v51 · Statique / Dynamique distingués dès le départ (téléchargement immédiat vs modifiable + scans).
- [x] v51 · SMS : proposé par le générateur public, absent de l'app → même liste de types partout (`lib/typesQr` unique).
- [x] Validation : aperçu + contrôles essentiels + téléchargement sans défilement à 1440×900, 1536×864, 1920×1080 (mesuré : barre PNG/SVG à 616 px du haut ; 1280×800 aussi).

### Fonctionnalités (`app/features/page.tsx`)
- [x] v50 · Visuel « QR dynamique » : rendu de secours fiable (SVG statique) si le QR généré côté client ne se charge pas ; tout visuel QR du site dispose d'un secours.

### Éditeur (`app/dashboard/builder/BuilderV4.tsx`)
- [x] v44 · Inspecteur en Contenu · Style · Effets + « Réglages avancés » replié.
- [x] v50 · Premier bloc sélectionné automatiquement à l'ouverture (ou aide dans l'inspecteur vide indiquant l'action attendue).
- [x] v50 · Canevas ≥ 55 % de la largeur utile (mesuré : 55 % à 1440, 65 % à 1280 où la bibliothèque s'ouvre repliée) ; bibliothèque et inspecteur repliables en un clic.
- [x] v50 · Aucun réglage visuel dans Contenu : forme/contour/fond/ombre d'avatar et équivalents passent dans Style (`blockDefs` : champ → onglet).
- [x] v52 · Doublon « Brouillon gardé ici » / « Brouillon gardé » → un seul ; « Excellent — 43/80 » → compteur + alertes utiles seulement ; Page / Ma page / Votre page → un seul mot.
- [x] v52 · Champs de l'inspecteur 14 px, étiquettes et aides ≥ 12 px, onglets 40/44 px ; Récents et Favoris précédaient déjà les 12 catégories (après « Essentiels ») ; ce qui ne sera pas publié est résumé dans la fenêtre Publier, chaque ligne ouvre le bloc.

### Passe éditoriale (`lib/motsDuProduit`, `blockDefs`, modèles, pages publiques)
- [x] v49 · Vouvoiement partout (« Créez », « Comprenez ») ; « Un support, pour de vrai » reformulé ; « wifi » → « Wi‑Fi » ; accents dans les modèles ; anglicismes (Business, Creator, Luxury, Event, Branding, Media Kit, Countdown…) traduits dans l'interface (les identifiants techniques restent).

## P1 — simplifier sans retirer de contenu

### Accueil
- [x] v53 · Espacements verticaux −28 % (100 → 72 px, 72 → 56 px sur mobile, héros et appel final resserrés) ; le contenu SEO reste dans ses accordéons.
- [x] v53 · Un seul vocabulaire de CTA — le verbe déjà employé sur tout le site est gardé : « Composer ma page — sans compte », « Choisir un modèle », « Créer mon QR code » (fin de « Essayer gratuitement », « Commencer gratuitement », « Créer une page », « … gratuit »).
- [x] v53 · Un seul logo/navigation (le lockup QR + « owg » de l'accueil vs « QRowg » ailleurs).

### Fonctionnalités
- [x] v53 · Marges réduites (100 → 72 px) ; les surtitres ne ressemblent plus à des filtres ; « outil business », « branding personnalisé », « collaboration équipe » reformulés (v49) ; même logo que l'accueil dans l'en-tête ; « Templates » → « Modèles ».

### Tarification
- [x] v53 · voir P0 (navigation publique, total annuel, regroupement).

## P2 — finitions
- [x] v53 · « Blog / Roadmap / Changelog — bientôt » : non interactifs (texte, `aria-disabled`).
- [x] v54 · États : squelette de chargement et garde-fou d'erreur du tableau de bord vérifiés, écrans d'erreur (site et tableau de bord) passés sur jetons, bandeau « Hors connexion » unique dans la coquille ; vides et erreurs des écrans de la revue revus (v49–v53).
- [x] v36 · Contrastes des gris et de l'or mesurés (`tokensInterface.test.ts`).
- [~] v36–v48 · Rayons, bordures, ombres, hauteurs de boutons uniformisés (jetons + couche « Calme »).
- [x] v53 · Focus clavier visible partout (`:focus-visible` global) ; ordre de tabulation vérifié.
- [x] v51 · Un aperçu vide n'occupe pas la place d'un QR généré.
- [x] v46–v48 · Animations fortes réservées aux moments importants (doctrineCalme.test.ts).

## Critères de fin de chantier
1. H1 et CTA de l'accueil visibles immédiatement, JavaScript ralenti ou non.
2. Tous les aperçus de modèles fonctionnent à la souris, au clavier et au tactile.
3. Mêmes plans, catégories et termes sur toutes les pages (tests de cohérence).
4. QR Studio : aperçu, contrôles essentiels et téléchargement sans défilement à 1440×900, 1536×864, 1920×1080.
5. Éditeur compréhensible à l'ouverture, inspecteur jamais vide sans consigne ; aucun réglage visuel dans Contenu.
6. Aucun texte ne mélange tutoiement/vouvoiement ni français/anglais.
7. Tous les visuels QR ont un rendu de secours.
8. Parcours mobiles à 375, 390 et 430 px : aucun défilement horizontal, action principale à portée de pouce. — v54 : balayage de 32 écrans × 3 largeurs sans débordement ; sur téléphone le générateur passe en contenu → aperçu + PNG/SVG → réglages.

Non vérifié par la revue (données réelles nécessaires) : statistiques, paiement, équipe, domaines, API, atelier d'impression complet. — v55 : bancs d'essai `e2e-harness/{accueil,messages,medias,equipe,domaines,redirections}` ajoutés ; ce qu'on y a vu est corrigé (erreurs de chargement déguisées en état vide, couleurs secondaires de Messages, cockpit de l'accueil, nom du plan et doublon d'état vide sur Domaines).
