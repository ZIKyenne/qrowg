# QROWG MOBILE — AUDIT MESURÉ ET FEUILLE DE ROUTE

**Document destiné à Claude Code.** Rédigé le 5 octobre 2026.
Révision auditée : `4089f187` (local, identique à la production).

Toute affirmation de ce document est soit **mesurée** (relevé instrumenté du
5 octobre, `audit-mobile/releve.json`, ou `grep` sur les sources), soit marquée
**hypothèse**. Rien n'y est estimé au jugé.

---

# PARTIE A — EXECUTIVE SUMMARY

## A.1 — Ce que j'ai trouvé, et qui n'était pas la question posée

La demande suppose un produit « desktop compressé dans un écran plus petit ».
**Le relevé ne confirme pas ce diagnostic**, et le dire serait plus facile que
de le vérifier :

| Mesure | 102 vues, 3 largeurs (320 / 390 / 430 px) |
| --- | --- |
| Débordement horizontal | **0** — aucune vue, aucune largeur |
| Défilements imbriqués | **0** |
| Éléments fixés en bas sans réserve de safe-area | **3** (sur 54 vues connectées) |
| Cibles sous 44 px, **pages publiques** | **10** cumulées sur 48 relevés |
| Cibles sous 44 px, **zone connectée** | **575** cumulées sur 54 relevés |

Le produit **n'est pas** un desktop compressé. Il a une coquille d'application
(`DashboardShell`, `100dvh`, `overflow: hidden`), une barre de navigation basse
(`MobileNav`, 5 entrées + « Créer »), 72 jetons de coquille, des jetons de
mouvement calibrés (80 / 120 / 250 / 300 / 400 ms), un manifeste PWA, et une
garde de cibles tactiles qui **mesure vraiment** au `elementFromPoint`.

Le problème est ailleurs, et il est plus grave.

## A.2 — Le vrai diagnostic : le mobile de ce produit ne survit pas

**Trois audits mobiles complets ont été menés en juillet 2026** (13, 14 et
15 juillet). Ils ont produit un ensemble de primitives :
`components/mobile/designTokens.ts`, `BottomSheet.tsx`, `MobileDock.tsx`,
`BigSlider.tsx`, `ColorPicker.tsx`, `mobileContextTools.ts`,
`stackedObjects.ts`, `touchGestures.ts`, `uiComplexity.ts`,
`templateGallery.ts` — onze moteurs purs testés, et un Print Studio rendu
utilisable au doigt en vingt-trois corrections numérotées.

**Aucun de ces fichiers n'existe dans le dépôt aujourd'hui.**

Le dossier `components/mobile/` n'existe plus. `PrintStudio.tsx` a été remplacé
par une refonte. `useDeviceOrientation.ts` a disparu. Et le vocabulaire tactile
qu'ils avaient installé s'est évaporé avec eux : il reste **1** seul
`overscroll-behavior` et **3** `touch-action` dans 366 fichiers de dashboard.

Rien ne les protégeait. **Aucun test ne disait « cet écran doit utiliser cette
feuille »**, donc une refonte les a emportés sans qu'une seule garde rougisse.

Et la preuve que la méthode inverse fonctionne est dans le même relevé :
`e2e/ciblesAuPouce.spec.ts` — une garde qui mesure réellement — maintient les
pages publiques à **10 cibles fautives**. La zone connectée, qu'elle ne couvre
pas, en compte **575**. Même produit, même équipe, même semaine. **Rapport de
64 pour 1.** La différence n'est pas l'effort : c'est la clôture.

> **Conclusion qui gouverne toute cette feuille de route :** le premier livrable
> n'est pas une primitive, c'est une **garde**. Une quatrième refonte mobile sans
> gardes produira exactement ce que les trois premières ont produit : un travail
> réel, de qualité, qui disparaîtra sans bruit.

## A.3 — Vision de l'expérience cible

Trois modes de présentation, et trois seulement : **Page**, **Feuille**,
**Plein écran**. Une barre basse permanente à cinq destinations. Une barre haute
contextuelle à une seule action. Un défilement par écran, dont la position est
restaurée. Le bouton retour du téléphone ferme la surface ouverte au lieu de
quitter l'écran. Aucune disposition ne change après hydratation.

L'identité ne bouge pas : noir et or, jetons `--qd-*`, famille `.da-btn-*`,
durées existantes. Ce document ne propose **aucune nouvelle couleur** et
**aucune nouvelle police**.

## A.4 — Ce que ce document ne promet pas

- **Aucune mesure de performance terrain.** `audit-mobile` tourne en local sur
  Chromium : il ne dit rien de l'INP, du LCP ou du CLS de la production. Prétendre
  mesurer l'INP terrain avec un test local serait faux.
- **Aucun jugement de ressenti.** La fluidité d'un glissement, le confort d'une
  position au pouce, l'inertie du défilement iOS : un navigateur sans pouce n'en
  sait rien. Le lot M27 prépare les scénarios ; la réponse appartient à un vrai
  iPhone.
- **Aucune nouvelle fonctionnalité.** Le brief l'interdit et le relevé ne la
  justifie pas.

---

# PARTIE B — DIAGNOSTIC MESURÉ

Relevé du 5 octobre 2026 · Chromium tactile · 34 vues × 3 largeurs = 102 relevés
· `e2e/auditMobile.spec.ts` · brut dans `audit-mobile/releve.json`.

## B.1 — Synthèse par axe

| Axe | Public (48 relevés) | Connecté (54 relevés) | Verdict |
| --- | --- | --- | --- |
| Débordement horizontal | 0 | 0 | **sain** |
| Défilements imbriqués | 0 | 0 | **sain** |
| Cibles < 44 px | **10** | **285** *(révisé, voir P0-1)* | `[P0]` zone connectée |
| Texte < 11 px | 6 | **72** | `[P1]` concentré sur Print Studio |
| Corps de texte < 13 px (> 60 car.) | 21 | **162** | `[P1]` |
| Commandes à moins de 8 px l'une de l'autre | 151 | **326** | `[P1]` |
| Fixé en bas sans réserve de safe-area | 0 | 3 | `[P2]` |
| Routes en erreur | 0 | **3** (HTTP 500) | `[BUG]` |

### Lecture honnête de la colonne « texte »

Ma première passe comptait « tout texte sous 13 px » et rendait **2 408**
occurrences. En les regardant, la majorité étaient les numéros d'étape « 01 »,
« 02 » de l'accueil à 11 px et des étiquettes de navigation — que l'échelle
typographique du produit **autorise** à 11–12 px. Publier 2 408 aurait été
alarmiste, c'est-à-dire aussi faux que complaisant.

L'instrument a donc été corrigé et distingue maintenant trois cas : sous 11 px
(illisible dans tous les rôles), 11–12,9 px sur un texte court (étiquette,
acceptable), et 11–12,9 px sur **plus de 60 caractères** — là, ce n'est plus une
étiquette, c'est du corps de texte trop petit. **183** occurrences de ce dernier
cas : voilà le chiffre réel.

## B.2 — Les dix problèmes les plus coûteux, classés

### P0-1 · `[ARCHITECTURE]` La zone connectée n'avait pas de garde tactile — 285 cibles

> **Chiffre révisé le 5 octobre, après le lot M03.** J'avais écrit **575**. C'est
> le cumul de mon relevé d'inventaire sur **trois largeurs**, avec un sélecteur
> plus large (champs, listes déroulantes, `[role=tab]`, `[tabindex]`) et une
> exemption « lien au fil du texte » plus grossière que celle de la garde du
> dépôt. Mesuré par `ciblesTropPetites` — la fonction de `ciblesAuPouce`, dont
> l'exemption WCAG 2.5.8 a été affinée en septembre après qu'elle eut laissé
> passer 30 commandes — à **390 px** sur les **26 bancs** : **285**.
>
> Les deux chiffres ne se contredisent pas, ils ne mesurent pas la même chose.
> Celui qui compte désormais est **285**, parce que c'est celui que le cliquet
> suit et que sa méthode est la plus stricte.

**Preuve** — `audit-mobile/CIBLES-CONNECTE.md`, produit par la garde elle-même.
285 commandes sous le plancher, contre **10** sur les pages publiques. Rapport
toujours de l'ordre de **28 pour 1**, et la cause est la même : une machine
vérifiait d'un côté et pas de l'autre.

**Ce que la garde a trouvé et que mon inventaire ne regardait pas** — en
découvrant les bancs sur le disque au lieu de porter une liste, elle a couvert
huit écrans absents de mon relevé, dont **le pire du produit** :

| Banc | Cibles | Dans mon relevé ? |
| --- | --- | --- |
| `builder-redesign` | **64** | **non** |
| `builder-canvas` | 19 | **non** |
| `menu-editor` | 8 | **non** |
| `image-crop` | 5 | **non** |
| `blocks` | 2 | **non** |

**Nuance de priorité, vérifiée** — `builder-redesign` est le pire par le nombre,
mais il est rendu derrière `NEXT_PUBLIC_BUILDER_REDESIGN`, et cette variable
**n'existe pas dans le projet Vercel** (vérifié le 5 octobre, existence
seulement, aucune valeur déchiffrée). Ces 64 commandes sont donc **dormantes**.
L'écran le plus fautif réellement servi reste la **bibliothèque de blocs (53)**.
L'ordre de la Phase 3 ne change pas ; `builder-redesign` devient une dette à
solder **avant** d'allumer le drapeau, et son plafond l'empêche d'empirer d'ici là.

**Mesures nommées** — bouton « ⓘ » **26 × 26** · lien de modèle **220 × 16** ·
chips de catégorie **30 px** de haut · champ de recherche **36 px** · bouton de
période « 7j » **38 × 32** · chip `.ps2-chip` **95 × 32**.

**Impact** — le produit s'impose `--cible-pouce: 44px` et ne le tient que là
où une machine vérifie.

**Solution** — M03 pose la clôture (plafond par écran, dégressif), M13 à M17 la
font descendre. **Lot : M03, puis M13–M17.**

### P0-2 · `[ARCHITECTURE]` 8 761 styles inline → 27 seuils de largeur

**Preuve** — `grep -c 'style={{'` sur `app/dashboard` : **8 761** dans 366
fichiers. **44** ruptures distinctes dans le dépôt, dont **8** valeurs de
`useIsMobile()` : 620, 700, 768, 859, 860, 900, 1024, 1500.

**Cause** — un style inline ne peut pas porter de media query. Chaque décision
responsive passe donc par du JavaScript, et comme aucun jeton n'impose de seuil,
chaque écran a choisi le sien.

**Impact** — comportement imprévisible entre 620 et 900 px ; re-rendu React au
lieu d'un recalcul CSS ; aucune de ces 44 décisions n'est auditable sans lire
366 fichiers. **Lot : M02, puis M25.**

### P0-3 · `[PERFORMANCE]` `[UX]` Le HTML servi porte la disposition de bureau

> **Ce constat a été réécrit le 5 octobre, parce que sa première version était
> fausse.** J'avais écrit : « un flash desktop → mobile à chaque chargement,
> noté *accepté* dans la mémoire du projet ». La lecture du code a montré le
> contraire : `lib/useIsMobile.ts` utilise `useSyncExternalStore`, et son propre
> commentaire documente le défaut qu'il a **déjà supprimé** — « au lieu de
> peindre la version PC, puis de la remplacer un effet plus tard (mesuré :
> **270 ms de barre latérale fantôme** sur téléphone) ». React corrige la valeur
> pendant l'hydratation, avant la peinture suivante. Ma mémoire de projet
> décrivait l'implémentation précédente. **Le flash post-hydratation n'existe
> plus.**

**Ce qui reste, et que le même commentaire énonce** — « Ce que le HTML rendu par
le serveur affiche AVANT l'arrivée du JavaScript reste l'affaire du CSS ». Le
serveur ne connaît pas la largeur : il rend `false`, donc la version de bureau,
pour **chaque disposition décidée en style inline**. Sur un réseau lent, c'est ce
que le téléphone affiche pendant les premières centaines de millisecondes.

**Preuve, et ce qu'elle a corrigé une deuxième fois** —
`e2e/avantLeJavascript.spec.ts` (ajouté le 5 octobre) charge sept vues à 390 px
**sans JavaScript**. Première exécution : **7 sur 7 au vert**, zéro débordement.
La capture de `/e2e-harness/statistiques` montrait un rouet sur fond noir : zéro
débordement parce que **zéro contenu**. L'assertion passait sur une page vide.

La spec classe donc maintenant chaque vue. `/e2e-harness/accueil` est
**réellement servie par le serveur, et déjà en disposition mobile** — une
colonne, grand bouton doré, cartes empilées. Les écrans rendus côté client, eux,
n'ont rien à déborder, et c'est **ce fait-là** qui est consigné (voir F.9 bis).

**Conséquence sur ce constat** — l'impact est encore plus étroit que la première
révision ne le disait. Il n'y a **pas** de page de bureau servie à un téléphone :
soit l'écran est servi en disposition mobile, soit il n'est pas servi du tout. Ce
qui reste tient en deux points, et aucun ne relève de la casse visible :
la disposition décidée en JavaScript est **invisible depuis une feuille de style
et non auditable** (P0-2), et l'attente montre **un rouet là où un squelette
existe déjà** (F.9 bis). `M25` passe donc de **P0 à P2**.

**Direction de correction, inchangée** — sortir les dispositions du JavaScript
(G.3), pour l'auditabilité et le coût de rendu, pas pour une casse visible.
**Lot : M25, reclassé P2.**

### P0-4 · `[BUG]` Le clavier n'est pris en compte que dans 4 fichiers

**Preuve** — `grep -rl visualViewport` → **4** fichiers ; **34** `100vh`
subsistent. Sur iOS, l'ouverture du clavier ne change pas `100dvh` : une barre
d'action en bas d'un conteneur `100dvh` passe **sous** le clavier.

**Impact** — bouton de validation invisible, champ actif inatteignable. Bloquant.
**Lot : M20.**

### P0-5 · `[UX]` La page cliente `/[slug]` n'a jamais été auditée

**Preuve** — recherche dans les trois comptes rendus de juillet : zéro mention.

**Impact** — c'est le **seul écran que voient les clients de nos clients**, et
on y arrive en scannant un QR code, donc depuis un téléphone, presque toujours.
Les trois audits ont examiné l'atelier et jamais l'objet fabriqué. **Lot : M05.**

### P1-6 · `[DESIGN SYSTEM]` La feuille montante existe et sert à un seul écran

**Preuve** — `grep -rln MobileBottomSheet` → 2 fichiers, dont lui-même. Un écran
sur dix-huit a une feuille. **Lot : M06.**

### P1-7 · `[UI]` Une modale centrée sur un téléphone

**Preuve** — `components/ui/Modal.tsx` : boîte centrée, `maxWidth: 460`. Pas de
poignée, pas de glissement, validation sous le clavier possible. **Lot : M04.**

### P1-8 · `[UX]` `[MOBILE]` 165 `:hover` pour 40 `:active`

**Preuve** — `grep` : 165 `:hover`, 40 `:active`, 81 paires
`onMouseEnter`/`onMouseLeave`. 125 éléments réagissent à une souris et à rien
d'autre. **Lot : M23.**

### P1-9 · `[UX]` Quatre zones sans aucune adaptation mobile

**Preuve** — Statistiques (4 046 lignes, **0** `useIsMobile`, **1** `@media`),
Profil (3 068 / 0 / 1), Domaines (1 442 / 0 / **0**), Réglages (497 / 0 / **0**).
~9 050 lignes. **Ce sont les seuls écrans auxquels l'expression « desktop
compressé » s'applique vraiment.** **Lots : M10–M11, M16, M17.**

### P1-10 · `[UX]` 477 paires de commandes à moins de 8 px

**Preuve** — 151 public + 326 connecté. Pires : galerie de modèles **33**,
bibliothèque de blocs **20**, messages **16**. Le doigt fait environ 8 mm.
**Lots : M13–M15.**

## B.3 — Ce qui va bien, et qu'il faut préserver

Le dire n'est pas de la complaisance : ne pas le dire ferait détruire du travail
qui tient.

- **Zéro débordement horizontal, zéro défilement imbriqué** sur 102 relevés.
- **Les pages publiques tiennent** : 10 cibles fautives — la garde fonctionne.
- La coquille `DashboardShell` est déjà une coquille d'application.
- `MobileNav` est déjà la bonne barre basse, avec le bon nombre d'entrées.
- Le builder, pourtant le plus gros écran (13 800 lignes), ne compte que **4**
  cibles fautives : le travail mobile de juillet y a survécu.
- Le QR Studio aussi : **5** cibles fautives.
- 24 bancs d'essai sans base de données rendent tout cet audit possible, et
  c'est rare.
- `--cible-pouce`, les jetons de mouvement et `resolveSaveStatus` sont des bases
  saines sur lesquelles poser la suite.

## B.4 — Un défaut à corriger avant de mesurer

`/e2e-harness/onboarding` répond **HTTP 500** aux trois largeurs
(`useToast doit être utilisé à l'intérieur de <ToastProvider>`,
`OnboardingClient.tsx:22`). L'onboarding est l'écran **le plus décisif** du
produit — vu une seule fois, il décide de la suite — et c'est le seul qu'on ne
peut pas mesurer. **Lot : M01b.**

---

# PARTIE C — CARTOGRAPHIE MOBILE DU PRODUIT

Relevée dans le code le 5 octobre 2026 : **71 routes**, dont 24 bancs d'essai
`/e2e-harness/*` (gatés 404 en production). Le produit réel compte **47 routes
servies**, dont 26 pages publiques SSG `/qr-code/[usage]` comptées une fois.

Les colonnes « lignes » et « mobile ? » sont des mesures, pas des impressions :
`lignes` = total des `.tsx` du dossier ; `mobile ?` = nombre de fichiers utilisant
`useIsMobile` + nombre de `@media` trouvées dans la zone.

## C.1 — Zone connectée (le cœur du problème)

| Zone | Route | Lignes | mobile ? | Objectif de l'écran | Action principale | Priorité mobile | Fréquence | Complexité tactile |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Éditeur de page | `/dashboard/builder/[pageId]` | **13 800** | 1 hook | composer la page publique | ajouter / régler un bloc | **P0** | très élevée | **extrême** (canvas + panneaux + clavier) |
| Galerie de modèles | `/dashboard/templates` | 4 780 | 3 hooks | choisir un point de départ | appliquer un modèle | P1 | moyenne | moyenne (grille + aperçu) |
| QR Studio | `/dashboard/qr-codes` | 4 155 | 1 hook | personnaliser et télécharger un QR | télécharger | **P0** | élevée | élevée (aperçu + réglages) |
| Statistiques | `/dashboard/analytics` | 4 046 | **0 hook, 1 @media** | comprendre ce qui se passe | lire un chiffre | **P0** | élevée | moyenne (14 panneaux, SVG) |
| Profil | `/dashboard/profile` | 3 068 | **0 hook, 1 @media** | tenir son identité publique | enregistrer un champ | P1 | faible | moyenne (formulaire long) |
| Print Studio | `/dashboard/print-studio` | 2 771 | 1 hook | préparer un support imprimé | exporter | P1 | faible | **extrême** (canvas) |
| Accueil | `/dashboard` | 1 494 | 1 hook | savoir où j'en suis | ouvrir une page | **P0** | **très élevée** | faible |
| Domaines | `/dashboard/domains` | 1 442 | **0 hook, 0 @media** | brancher un domaine | ajouter un domaine | P2 | très faible | faible (texte + état) |
| QR instantané | `/dashboard/qr-link` | 1 287 | 1 hook | créer un QR hors page | télécharger | P1 | moyenne | moyenne (6 types) |
| Studio d'avatar | `/dashboard/avatar` | 502 | 0 hook, 2 @media | fabriquer un avatar | enregistrer | P3 | très faible | moyenne |
| Réglages | `/dashboard/settings` | 497 | **0 hook, 0 @media** | compte, sécurité, suppression | changer un réglage | P2 | très faible | faible |
| Redirections | `/dashboard/redirects` | 426 | **0 hook, 0 @media** | changer une destination | éditer une cible | P2 | faible | faible |
| Sous-domaine | `/dashboard/subdomain` | 345 | 0 hook | réserver son adresse | valider | P3 | très faible | faible |
| Messages | `/dashboard/leads` | 276 | **0 hook** | lire ses demandes | ouvrir un message | P1 | moyenne | faible (liste) |
| Équipe | `/dashboard/team` | 272 | **0 hook** | inviter, gérer les rôles | inviter | P3 | très faible | faible |
| Médias | `/dashboard/assets` | 251 | **0 hook** | retrouver une image | insérer / supprimer | P2 | moyenne | moyenne (grille) |
| Onboarding | `/dashboard/onboarding` | 173 | 0 hook | démarrer par objectif | choisir un objectif | P1 | **une seule fois, décisive** | faible |
| Objectifs | section de `/dashboard#objectifs` | 30 | 0 hook | suivre une cible | éditer une cible | P3 | faible | faible |

**Total zone connectée : ~39 600 lignes de TSX, 8 761 `style={{` inline.**

### Ce que ce tableau établit sans discussion

Quatre zones — **Statistiques, Profil, Domaines, Réglages**, ~9 050 lignes —
n'ont **ni un seul `useIsMobile`, ni plus d'une media query**. Elles ne sont pas
« mal adaptées » au mobile : elles ne sont **pas adaptées du tout**. Ce sont
littéralement les écrans desktop rétrécis que le brief veut faire disparaître.

À l'inverse, l'éditeur, le QR Studio, les modèles, le Print Studio et l'accueil
**ont** une adaptation mobile réelle, parfois sophistiquée (panneau unique,
onglets du bas, feuille montante). Le problème n'y est pas l'absence de travail,
c'est son **isolement** : chaque zone a inventé sa propre mécanique.

## C.2 — Zone publique

| Famille | Routes | Objectif | Priorité mobile | Note |
| --- | --- | --- | --- | --- |
| Accueil | `/` | convaincre | **P0** | 54 % du trafic est mobile (186/515 impressions, Search Console 6 mois) |
| Création guidée | `/creer` | entrer dans le produit sans compte | **P0** | porte d'entrée réelle |
| Pages d'usage | `/qr-code`, `/qr-code/[usage]` ×26 | capter l'intention | P1 | gabarit unique — un correctif les corrige toutes |
| Guides | `/guides`, `/guides/[slug]` ×12 | répondre | P1 | lecture longue : typographie et largeur de ligne |
| Outils | `/outils/*`, `/generateur-qr-code*` | faire, tout de suite | **P0** | les seules pages qui *font* quelque chose sans compte |
| Démonstrations | `/examples`, `/examples/[modele]` | montrer | P1 | 48 modèles, grille + aperçu |
| Offres | `/upgrade`, `/features` | vendre | P1 | tableau comparatif 19 lignes = piège mobile |
| Authentification | `/auth/*` ×4 | entrer | **P0** | déjà traité (§1 de l'audit de juillet : champs 52 px) |
| Légal | `/legal`, `/terms`, `/privacy` | informer | P3 | lecture longue |
| Pages clientes | `/[slug]` | **ce que voient les visiteurs du client** | **P0** | le produit fini ; un défaut ici est un défaut chez le client |

### Le point que les trois audits précédents n'ont pas traité

`/[slug]` — la page publiée par le client — est **le seul écran que voient les
clients de nos clients**, et c'est presque toujours sur un téléphone (on y arrive
en scannant un QR code avec un téléphone). Aucun des trois audits mobiles de
juillet ne la mentionne : ils ont audité l'atelier, jamais l'objet produit.

C'est l'inversion de priorité la plus coûteuse du produit, et elle est corrigée
dans cette feuille de route (lot M05).

## C.3 — Parcours, et là où ils cassent

| Parcours | Chemin | Changements de contexte | Risque mobile |
| --- | --- | --- | --- |
| Découverte → essai | `/` → `/creer` → builder invité | 2 | perte du brouillon au basculement |
| Inscription → 1re page | `/auth/signup` → `/dashboard/onboarding` → builder | 3 | le plus décisif, le moins mesuré |
| Éditer → publier | accueil → builder → aperçu → publier | 4 | **l'aperçu quitte l'éditeur** (perte d'état) |
| Imprimer | QR Studio → Print Studio → export | 3 | deux canvas, deux mécaniques |
| Comprendre | accueil → statistiques → panneau → détail | 3 | aucun retour arrière cohérent |
| Scan réel | QR → `/q/[code]` → `/[slug]` | 1 | **le parcours du visiteur final** |

---

# PARTIE D — NOUVELLE ARCHITECTURE MOBILE

## D.1 — Ce qui existe déjà et qu'il ne faut PAS reconstruire

Avant toute proposition, l'état des lieux. Ces briques sont dans le dépôt,
fonctionnelles, et toute roadmap qui les ignore gaspille le travail déjà fait :

| Brique | Fichier | État |
| --- | --- | --- |
| Coquille d'application | `app/dashboard/DashboardShell.tsx` | **existe** — `height: 100dvh`, `overflow: hidden`, mode `immersif` |
| Barre de navigation basse | `components/MobileNav.tsx` (242 l.) | **existe** — 5 entrées + « Créer » central, masquée dans builder et print-studio |
| Jetons de coquille | `--qd-*` dans `globals.css` | **existe** — 72 jetons |
| Plancher tactile | `--cible-pouce: 44px` | **existe** — et une garde qui le mesure vraiment |
| Jetons de mouvement | `lib/motion.ts` | **existe** — `instant 80 / fast 120 / base 250 / sheet 300 / slow 400` |
| Primitives UI | `components/ui/` | **existent** — Button, Card, Badge, Tabs, Modal, Input, Switch, Confirm, PageHeader |
| Feuille montante | `app/dashboard/builder/MobileBottomSheet.tsx` (93 l.) | **existe, mais enfermée** |
| Coquille mobile d'éditeur | `app/dashboard/builder/MobileBuilderShell.tsx` (281 l.) | **existe, mais enfermée** |
| Barre contextuelle | `app/dashboard/builder/BlockContextToolbar.tsx` (59 l.) | **existe, mais enfermée** |
| PWA | `app/manifest.ts`, `appleWebApp: black-translucent` | **existe** |
| Bancs d'essai sans base | `app/e2e-harness/*` ×24 | **existent** — c'est ce qui rend cet audit possible |
| Garde cibles tactiles | `e2e/ciblesAuPouce.spec.ts` | **existe** — mesure réelle `elementFromPoint` |

**Conclusion : l'app shell n'est pas à inventer, il est à GÉNÉRALISER.**

La demande du brief (« app shell, bottom nav, zones persistantes, overlays,
bottom sheets ») décrit en grande partie ce qui tourne déjà sur `/dashboard`.
Ce qui manque n'est pas la coquille : c'est que **trois écrans sur dix-huit** en
profitent vraiment.

## D.2 — Le vrai défaut d'architecture : 8 761 styles inline

C'est la mesure qui explique toutes les autres.

```
8 761  occurrences de `style={{` dans app/dashboard (366 fichiers .tsx)
   27  seuils de largeur distincts (préludes de @media + useIsMobile, normalisés)
    8  valeurs différentes passées à useIsMobile() : 620, 700, 768, 859, 860, 900, 1024, 1500
    2  de ces 27 tombent déjà sur une des quatre ruptures → 25 à résorber
```

> **Correction du même jour.** Ce chiffre était d'abord annoncé à **44**. Le
> compteur additionnait tous les `max-width:` du dépôt, y compris
> `max-width: 120px` sur une vignette et `min-width: 38px` sur un bouton — des
> dimensions d'éléments, pas des ruptures. Mesuré correctement (prélude de
> `@media` uniquement) : **31**. Et en normalisant l'idiome `min-width: N+1`,
> qui exprime la même frontière de l'autre côté (620/621, 640/641, 899/900/901,
> 1024/1025) : **27**. C'est la deuxième fois dans la journée qu'un compteur brut
> se trompe dans le sens de l'alarme — voir aussi la lecture de la colonne
> « texte » en B.1.

Un style inline **ne peut pas porter de media query**. Chaque décision
responsive doit donc passer par du JavaScript (`useIsMobile(n)`), et comme
personne ne peut retenir quel écran utilise quel seuil, chaque écran a choisi le
sien. D'où 27 seuils pour un produit qui en a besoin de **quatre**.

Conséquences mesurables, pas théoriques :
- un changement de largeur **re-rend** l'arbre React au lieu de recalculer du CSS ;
- `useIsMobile` rend `false` côté serveur, qui ne connaît pas l'écran — donc le
  **HTML servi porte la disposition de bureau** pour toute décision prise en
  style inline. Ce que voit un téléphone avant l'arrivée du JavaScript est donc
  une page de bureau. Après l'hydratation, en revanche, il n'y a **pas** de
  flash : voir la correction ci-dessous ;
- aucune de ces décisions n'est visible dans une feuille de style, donc aucune
  n'est auditable autrement qu'en lisant 366 fichiers.

**La stratégie n'est pas de tout réécrire en CSS.** Elle est :

1. réduire 27 seuils à **4 ruptures nommées** (`lib/ruptures.ts`, pas des jetons
   CSS : une variable n'est pas évaluable dans un `@media`) et refuser les
   nouvelles par une garde-cliquet ;
2. exprimer la bascule mobile par un **attribut de données sur la racine**
   (`data-densite="compacte|confortable"`) posé par le shell, pas par chaque
   composant — le CSS peut alors réagir sans JavaScript ;
3. ne migrer un écran que **quand on le refait**, jamais en masse.

## D.3 — Modèle de navigation retenu

```
                    ┌──────────────────────────────────┐
                    │  MobileTopBar (contextuelle)     │  48–52 px + safe-area haut
                    │  ‹ retour · titre · 1 action     │
                    ├──────────────────────────────────┤
                    │                                  │
                    │  MobilePage                      │  LE SEUL défilement
                    │   └ MobileSection ×n             │  overscroll-behavior: contain
                    │                                  │
                    │                                  │
                    ├──────────────────────────────────┤
                    │  FloatingActionBar (si besoin)   │  action primaire de l'écran
                    ├──────────────────────────────────┤
                    │  MobileNav  (5 + Créer)          │  56 px + env(safe-area-inset-bottom)
                    └──────────────────────────────────┘
```

**Destinations permanentes (barre basse)** — elles existent déjà et sont les
bonnes : Accueil, Pages, **Créer**, Statistiques, Plus. Pas de sixième entrée.

**Destinations contextuelles (jamais dans la barre)** : Profil, Réglages,
Domaines, Redirections, Équipe, Médias, Sous-domaine, Avatar. Elles vivent sous
« Plus », en liste, parce que leur fréquence mesurée est très faible.

**Trois modes de présentation, et trois seulement :**

| Mode | Quand | Primitive | Retour |
| --- | --- | --- | --- |
| **Page** | changement de sujet (un écran de la barre) | `MobilePage` | barre basse |
| **Feuille** | réglage, filtre, choix, menu « … » | `MobileSheet` | glisser bas / scrim / Échap |
| **Plein écran** | éditeur, canvas, assistant d'export | `MobileFullScreen` | croix explicite + `popstate` |

Toute autre forme (modale centrée, popover, drawer latéral, tiroir hamburger
géant) est **interdite sur ≤ 640 px**. La garde du lot M04 le vérifie.

## D.4 — Pile de navigation et retour arrière

Problème mesuré : `MobileBuilderShell` et le Print Studio gèrent chacun leur
retour, l'aperçu **quitte** l'éditeur (parcours C.3, 4 changements de contexte),
et rien ne restaure la position de défilement (`scrollRestoration` : **0
fichier**).

Règle retenue, volontairement minimale (pas de routeur maison) :

- une feuille et un plein écran poussent une entrée d'historique
  (`history.pushState`) et se ferment sur `popstate` → **le bouton retour du
  téléphone ferme la surface au lieu de quitter l'écran**. Le Print Studio le
  faisait déjà avant sa refonte ; le motif est à remonter en primitive ;
- `MobilePage` mémorise sa position de défilement par route dans
  `sessionStorage` et la restaure au retour ;
- l'aperçu devient un **mode** de l'éditeur (`édition | aperçu`), pas une
  destination : zéro changement de contexte au lieu de deux.

---

# PARTIE E — DESIGN SYSTEM MOBILE

## E.1 — Principe directeur : une primitive n'existe que si une garde la défend

C'est la leçon du 5 octobre. Trois audits mobiles ont produit
`components/mobile/designTokens.ts`, `BottomSheet.tsx`, `MobileDock.tsx`,
`BigSlider.tsx`, `ColorPicker.tsx`, `mobileContextTools.ts`. **Aucun n'existe
plus.** Rien ne les protégeait : aucun test ne disait « cet écran doit utiliser
cette feuille », donc une refonte les a emportés sans qu'un seul test rougisse.

**Règle de cette refonte : chaque primitive arrive avec sa garde, dans le même
lot.** Pas de primitive sans garde. Une garde qui vérifie l'usage, pas seulement
l'existence du fichier.

## E.2 — Les primitives à créer

| Primitive | Rôle | Origine | Garde associée |
| --- | --- | --- | --- |
| `MobileSheet` | **la** feuille montante, 4 tailles | promotion de `builder/MobileBottomSheet.tsx` | aucune autre implémentation de feuille ne subsiste |
| `MobileSheetStack` | empilement + `popstate` + scrim unique | nouveau | une seule feuille ouverte à la fois |
| `MobilePage` | conteneur de défilement unique + restauration | nouveau | un seul défilement par écran |
| `MobileSection` | titre + corps + rythme vertical | nouveau | rythme pris aux jetons |
| `MobileTopBar` | retour + titre + 1 action max | nouveau | jamais plus d'une action |
| `MobileListItem` | ligne tactile 56 px + menu « … » | motif déjà établi (Accueil, Médias) | hauteur ≥ `--cible-pouce` |
| `SegmentedControl` | bascule 2–4 options | `Tabs` est un tablist souligné, pas un segmenté | — |
| `ActionSheet` | menu « … » en feuille | motif déjà établi, jamais factorisé | zéro `Modal` sur ≤ 640 px |
| `FloatingActionBar` | action primaire au pouce | nouveau | respect de la safe-area |
| `MobileFieldRow` | champ 52 px + étiquette + erreur | acquis de `/auth` (§1 juillet) | hauteur ≥ 52 px |
| `MobileEmptyState` | état vide honnête | motif existant, dispersé | — |
| `MobileSkeleton` | attente sans spinner | `dashboard/loading.tsx` existe | — |
| `SaveStatus` | brouillon / enregistrement / enregistré / publié | `resolveSaveStatus()` existe déjà (pur, testé) | les 4 états sont distinguables |

**À NE PAS créer** : `MobileAppShell` (c'est `DashboardShell`),
`BottomNavigation` (c'est `MobileNav`), `MobileModal` (une modale sur téléphone
devient une feuille ou un plein écran — cf. D.3), `MobileCard` (`ui/Card` suffit
avec une variante de densité), `MobileSearch` / `MobileFilterBar` (ce sont des
compositions de `MobileSheet` + `MobileFieldRow`, pas des primitives).

## E.3 — Jetons

Les jetons de couleur, de rayon et de mouvement **existent** (`--qd-*` ×72,
`lib/motion.ts`). Ne pas en créer de nouveaux. Ce qui manque :

Les quatre ruptures **ne sont pas** des jetons CSS : une variable CSS n'est pas
évaluable dans la condition d'une `@media`. Elles vivent dans
`lib/ruptures.ts` (`RUPTURES = { sm: 360, md: 640, lg: 900, xl: 1200 }`), et
`lib/ruptureUnique.test.ts` vérifie que les littéraux du CSS leur correspondent.
Ce qui suit, en revanche, fonctionne bien en jetons :

```css
:root {
  /* Hauteurs de chrome — mesurables, donc testables */
  --h-topbar: 52px;
  --h-navbar: 56px;
  --h-fab:    64px;

  /* Safe areas, une seule fois */
  --safe-haut: env(safe-area-inset-top,    0px);
  --safe-bas:  env(safe-area-inset-bottom, 0px);

  /* Tactile */
  --cible-pouce: 44px;    /* existe déjà */
  --cible-champ: 52px;    /* acquis /auth */
  --ecart-cible: 8px;     /* espace minimal entre deux commandes */

  /* Feuilles */
  --sheet-compacte: 38dvh;
  --sheet-moyenne:  58dvh;
  --sheet-grande:   84dvh;
  /* la 4e taille est le plein écran : 100dvh */
}
```

## E.4 — Échelle typographique mobile

Reprise des planchers que l'audit de juillet avait déjà fixés — ils sont bons,
ils ne sont simplement **pas tenus** (voir le relevé : textes sous 13 px).

| Rôle | Taille | Interligne | Poids |
| --- | --- | --- | --- |
| Titre d'écran | 24–26 px | 1,15 | 700 |
| Titre de section | 18–20 px | 1,25 | 700 |
| Titre de carte | 16–17 px | 1,3 | 600 |
| Corps | 15–16 px | 1,55 | 400 |
| Secondaire | 13–14 px | 1,45 | 400 |
| Étiquette / nav | 11–12 px | 1,2 | 600 |

**Plancher absolu : 13 px**, sauf étiquette de navigation et badge (11–12 px).
Si un texte ne tient pas, on **retire du secondaire** — on ne réduit pas.

## E.5 — Densité : compacte ≠ géante

Le piège inverse, que le brief nomme explicitement. Les valeurs retenues :

| | Téléphone | Desktop |
| --- | --- | --- |
| Rembourrage de carte | 14–16 px | 20–24 px |
| Écart entre cartes | 10–12 px | 16–20 px |
| Hauteur de ligne de liste | 56 px | 44 px |
| Gouttière d'écran | **16 px** | 24–32 px |
| Largeur de lecture | 100 % − 32 px | 68 ch |

Une bonne interface tactile est **compacte et respirante** : la hitbox grossit,
le dessin non. Un bouton de 32 px peut avoir une zone cliquable de 44 px par
`::after` — c'est la technique à utiliser partout où grossir le dessin casserait
le rythme.

---

# PARTIE F — AUDIT DÉTAILLÉ PAR ZONE

Chiffres à **390 px** (iPhone de référence), relevé du 5 octobre.
`cibles` = commandes sous 44 px de haut ou 24 px de large, exception WCAG 2.5.8
« inline » appliquée. `corps` = texte de plus de 60 caractères sous 13 px.

## F.1 — Bibliothèque de blocs — `[P0]`

| cibles | < 11 px | corps | voisins < 8 px |
| --- | --- | --- | --- |
| **55** | 0 | 1 | 20 |

**Le pire écran du produit**, et le plus fréquenté de l'éditeur : chaque ajout de
bloc passe par lui, parmi 143 types.

**Problème** — chips de catégorie à **30 px** (« Essentiels », « Tout »,
« ⚡ Actions 21 », « 📲 Réseaux 10 »), champ de recherche **364 × 36**, fermeture
**30 × 30**, aide **26 × 26**.
**Impact** — on manque sa cible, on ouvre la mauvaise catégorie, on recommence.
**Comportement attendu** — recherche 52 px collante ; catégories en segmenté
défilant à 44 px ; grille 2 colonnes, cartes 96 px ; insertion en un tap.
**Responsive** — 2 colonnes ≤ 640 px, grille actuelle au-delà.
**Edge cases** — recherche vide ; 143 blocs sans filtre ; nom sur deux lignes ;
clavier ouvert.
**Acceptation** — 55 → 0 cibles ; 20 → 0 voisinages ; `block-library.spec.ts` vert.
**Lot : M13.**

## F.2 — Galerie de modèles — `[P1]`

| cibles | corps | voisins |
| --- | --- | --- |
| **34** | 0 | **33** |

**Problème** — la cible est le **texte du lien**, pas la carte : mesuré à
**220 × 16 px**. Seize pixels de haut, sur 48 modèles.
**Cause probable** — `<a>` autour du titre au lieu d'un `<a>` en bloc couvrant
la carte.
**Comportement attendu** — toute la carte est cliquable ; aperçu réel
(`MiniApercu` existe) ; aperçu plein écran ; 2 colonnes en 3:4.
**Acceptation** — carte entière cliquable ≥ 44 px ; 33 → 0 voisinages ;
`classementDesModeles.ts` **inchangé**. **Lot : M14.**

## F.3 — Statistiques — `[P0]` — **page pilote**

| cibles | corps | voisins | adaptation mobile |
| --- | --- | --- | --- |
| **11** | **16–17** | 10 | **0 `useIsMobile`, 1 `@media`** |

**Problème** — 14 panneaux empilés ; période en boutons **38 × 32** ; ledes
explicatifs à **11,5 px sur 88 caractères** (« Vues cumulées depuis la
publication… »).
**Impact** — l'écran répond mal aux quatre questions qu'il devrait traiter
(qu'ai-je ? que se passe-t-il ? qu'est-ce qui mérite mon attention ? quelle est
l'action logique ?) parce que tout a le même poids.
**Comportement attendu** — niveau 1 : période, trois chiffres, une courbe, six
entrées « détails ». Niveau 2 : un panneau plein écran, URL partageable
(`?panneau=geo`), retour natif.
**Edge cases** — 0 vue → « — » et non « 0 % » ; une seule journée ; 90 jours sur
320 px ; nombres à 6 chiffres.
**Acceptation** — 11 → 0 cibles ; 33 → 0 corps ; niveau 1 ≤ 2 écrans ; moteurs
purs `analyticsAgg.ts` / `lectureHonnete.ts` **inchangés** ; desktop identique.
**Lots : M10, M11, M12.**

## F.4 — Print Studio — `[P1]`

| cibles | **< 11 px** | corps | voisins |
| --- | --- | --- | --- |
| 12 | **24** | **14** | 0 |

**Le pire écran pour la typographie.** Descriptions de supports à **11,5 px**
(« Collé sur chaque table : vos… », « Debout entre le sel et le po… »), chips
`.ps2-chip` à **95 × 32**.
**Contexte** — refonte récente (`print-studio/`, « objets, pas outils ») avec
moteurs purs testés : `catalog.ts`, `tokens.ts`, `apercuMobile.ts`,
`ajustement.ts`, `tailleQrImprimable.ts`. L'ancien `PrintStudio.tsx` Fabric
n'existe plus — **ne pas le ressusciter**.
**Hypothèse à vérifier** — `apercuMobile.ts` existe, ce qui suggère que
l'aperçu mobile est commencé mais peut-être pas branché. À établir avant d'agir.
**Acceptation** — 24 → 0 textes < 11 px ; 14 → 0 corps ; 12 → 0 cibles ; export
PDF/PNG identique au pixel. **Lot : M22.**

## F.5 — Messages — `[P1]`

| cibles | corps | voisins |
| --- | --- | --- |
| **22** | 0 | 16 |

Chips de filtre **32 px**, champ **261 × 38**, sélecteur de statut **142 × 32**.
**Attendu** — `MobileListItem` 56 px, filtres en feuille avec compteur, lecture
en plein écran, actions en `ActionSheet`.
**Précaution** — la messagerie est **chiffrée de bout en bout** : ne toucher à
aucune couche de déchiffrement. **Lot : M15.**

## F.6 — Réglages de bloc — `[P1]`

**15 cibles** basses (pire : « Aucun » **55 × 26**), 18 textes courts.
Même traitement que l'éditeur : propriétés en feuille compacte, canvas décalé
pour que le bloc réglé **reste visible**. **Lot : M19.**

## F.7 — Éditeur de page — `[P1]`, et la bonne nouvelle

**4 cibles** basses seulement, sur 13 800 lignes. Le panneau unique, les onglets
du bas et `MobileBuilderShell` fonctionnent. **Ne pas refondre.**

Trois manques précis : l'aperçu **quitte** l'éditeur (M18), les propriétés
masquent le bloc réglé (M19), le clavier n'est pas géré (M20).

## F.8 — QR Studio — `[P1]`

**5 cibles**, 9 textes courts, 1 voisinage. Tient bien.

**Dette à trancher** — `QRStudioZero.tsx` est une seconde implémentation du même
écran derrière un drapeau `?zero=1`. Deux implémentations d'un écran, c'est la
duplication que la PARTIE G interdit : soit elle devient le défaut mobile, soit
elle est retirée. **Décision de l'utilisateur. Lot : M21.**

## F.9 — Accueil du dashboard — `[P2]`

Refonte récente (jetons `--qd-*`, lignes avec vignette, menu `…` en feuille) :
elle tient. Le motif « menu `…` → feuille » né ici doit devenir
`MobileListItem` + `ActionSheet` (M09) pour servir aux quatre autres listes.

## F.9 bis — Ce que la capture dit et qu'aucune mesure n'attrapait

> Ajouté le 5 octobre, après les lots M01b et M02. Les deux constats ci-dessous
> ne viennent d'aucun compteur : ils viennent d'avoir **regardé** deux captures.
> C'est l'argument de la PARTIE I en pratique — l'instrument tient les planchers,
> il ne juge pas la composition.

### Les lignes de l'accueil sont écrasées à 390 px — `[P1]` `[UI]`

**Preuve** — `audit-mobile/sans-javascript/e2e-harness-accueil.png`, 390 px.
Le titre « Carte restaurant (démo) » est tronqué à **« Carte resta… »** sur deux
lignes, et « créée il y a 1 mois » se replie sur **quatre lignes** :
« créée il / y a 1 / mois ».

**Cause** — la colonne de texte est prise en étau entre la vignette (48 px), le
bouton « Modifier » (~140 px) et le bouton « … » (~56 px). Il lui reste environ
100 px sur 390.

**Pourquoi aucune mesure ne l'a vu** — il n'y a ni débordement, ni cible sous
44 px, ni texte sous 13 px. Tous les planchers sont tenus. L'écran est quand
même mauvais, et c'est précisément la limite d'un relevé automatique.

**Comportement attendu** — à ≤ 640 px, « Modifier » rejoint le menu « … » et la
ligne rend son titre sur une ligne pleine largeur. Le motif existe déjà dans ce
même écran (le menu « … » en feuille) : il suffit de lui donner l'action
principale. C'est le travail de `MobileListItem` (M09).

**Acceptation** — [ ] titre sur une ligne à 320 px · [ ] aucune métadonnée sur
plus de deux lignes · [ ] l'action « Modifier » reste atteignable en un geste.

### Les statistiques affichent un rouet, pas un squelette — `[P1]` `[UX]`

**Preuve** — `audit-mobile/sans-javascript/e2e-harness-statistiques.png` : fond
noir, rouet doré, « Chargement des statistiques… ». L'écran est rendu
**entièrement côté client**.

**Impact** — c'est ce qu'un téléphone sur réseau lent regarde en attendant. Un
squelette renseignerait la forme de l'écran et donnerait l'impression que la page
est déjà là ; un rouet ne renseigne rien et donne l'impression d'attendre.

**Et ce n'est pas une nouveauté à construire** : `app/dashboard/loading.tsx`
existe — un squelette partagé, ajouté en juillet précisément pour supprimer les
écrans vides (§17 de l'audit v2). L'écran des statistiques ne s'en sert pas.

**Comportement attendu** — l'attente montre la forme : en-tête, bascule de
période, quatre emplacements de chiffres, un emplacement de courbe.

**Acceptation** — [ ] aucun rouet seul sur les écrans migrés · [ ] le squelette
reprend la disposition réelle · [ ] aucune nouvelle dépendance.

**Lot** — à traiter dans M10 (pilote), puisque c'est le même écran.

## F.10 — Petits écrans : Domaines, Redirections, Équipe, Médias, Réglages — `[P2]`

| Écran | cibles | corps | adaptation |
| --- | --- | --- | --- |
| Redirections | 8 | 2 | 0 / 0 |
| Domaines | 6 | 1 | 0 / 0 |
| Médias | 3 | 1 | 0 |
| Équipe | 2 | 0 | 0 |
| Réglages | — | — | 0 / 0 |

**Pire faute de texte du produit** : dans les redirections, l'explication
301 / 302 est un paragraphe de **313 caractères à 11 px**. Personne ne lit ça sur
un téléphone — et c'est précisément l'explication dont on a besoin pour ne pas se
tromper de type de redirection. **Lot : M17.**

## F.11 — Pages publiques — `[P2]`

**10 cibles** fautives sur 16 vues × 3 largeurs : la garde fait son travail.
Restent **151 voisinages** serrés et **21 corps** de texte trop petits — dont
`/upgrade` (12 px sur 129 caractères), `/generateur-qr-code` (12 px sur 70), et
`/contact` (la mention légale sous le formulaire, 12 px sur 73).

`/` compte 86 textes sous 13 px, mais **vérifiés un par un** : ce sont les
numéros d'étape « 01 »–« 05 » et des étiquettes, que l'échelle autorise. **Rien à
corriger sur l'accueil de ce chef.** **Lot : M28 pour les corps, M23 pour les
voisinages.**

## F.12 — `/[slug]`, la page cliente — `[P0]`, non mesurée

**Jamais auditée**, jamais incluse dans un relevé, jamais mentionnée dans les
trois audits de juillet. C'est l'unique écran vu par les clients de nos clients,
et il est presque toujours ouvert depuis un scan de QR code, donc depuis un
téléphone. **Lot : M05 — à mesurer avant de corriger.**

---

# PARTIE G — ARCHITECTURE FRONTEND

## G.1 — La règle anti-duplication, et comment la tenir ici

Le brief refuse `ComposantDesktop.tsx` + `ComposantMobile.tsx`. Ce dépôt a déjà
**deux cas** de cette dette : `QRStudio.tsx` / `QRStudioZero.tsx`, et
`MobileBuilderShell.tsx` à côté du builder desktop. Le second est justifié (un
éditeur à trois colonnes et un éditeur à un panneau sont deux UX) ; le premier
ne l'est pas (c'est le même écran deux fois).

**Critère de séparation retenu, à appliquer à chaque lot :**

> On sépare quand la **structure de navigation** diverge, jamais quand seule la
> **disposition** diverge.
>
> - trois colonnes ↔ un panneau à la fois → **séparer** (navigation différente) ;
> - grille de 4 ↔ grille de 2 → **composer** (même navigation) ;
> - modale centrée ↔ feuille montante → **une primitive adaptative** (même rôle).

## G.2 — Les quatre mécanismes, par ordre de préférence

1. **CSS + jetons** (`@media` sur les 4 ruptures). Aucun JavaScript, aucun
   re-rendu, aucun flash. **À utiliser par défaut.**
2. **Attribut de densité sur la racine** (`data-densite="compacte|confortable"`),
   posé par CSS. Permet à un style inline de réagir via `var(--…)` dont la valeur
   change selon la densité — c'est le pont entre les 8 761 styles inline et le CSS.
3. **Composition** : même composant, enfants différents par `slots`. Pour les
   divergences de contenu.
4. **`useIsMobile("md")`** — **uniquement** pour une décision *comportementale*
   (monter une feuille plutôt qu'une modale, activer un geste). **Jamais** pour
   une disposition : c'est ce qui produit le flash du P0-3.

## G.3 — Stratégie de migration des 8 761 styles inline

**Ne pas les convertir.** Un chantier de conversion de 8 761 styles serait un
*rewrite* déguisé, exactement ce que le brief interdit, et il casserait des
écrans dont personne ne connaît plus les détails.

À la place :

- chaque lot qui **touche** un écran y introduit les jetons de densité ;
- les valeurs qui changent avec la largeur (rembourrages, tailles, gouttières)
  deviennent des `var(--…)` dont la valeur est redéfinie par `@media` **une seule
  fois, dans `globals.css`** ;
- le style inline reste, mais il lit un jeton au lieu d'un nombre.

Exemple du mécanisme, à reproduire :

```css
:root { --pad-carte: 22px; --gout-ecran: 28px; --h-ligne: 44px; }
@media (max-width: 640px) {
  :root { --pad-carte: 15px; --gout-ecran: 16px; --h-ligne: 56px; }
}
```

```tsx
// Avant — invisible depuis une feuille de style, et dépend d'un re-rendu JS
<div style={{ padding: estMobile ? 15 : 22 }}>
// Après — zéro JavaScript, zéro flash, auditable par grep
<div style={{ padding: "var(--pad-carte)" }}>
```

C'est **progressif, réversible et mesurable** : le nombre de `estMobile ?` dans
une disposition devient un indicateur de dette à faire baisser, lot par lot.

## G.4 — Arborescence cible

```
apps/web/src/
  components/
    mobile/                    ← RECRÉÉ, et cette fois gardé
      MobileSheet.tsx          ← promotion de builder/MobileBottomSheet
      MobileSheetStack.tsx
      MobilePage.tsx
      MobileSection.tsx
      MobileTopBar.tsx
      MobileListItem.tsx
      ActionSheet.tsx
      FloatingActionBar.tsx
      MobileFieldRow.tsx
      SaveStatus.tsx
      feuilleMobile.ts         ← moteur pur
      feuilleMobile.test.ts
      primitivesGardees.test.ts ← LA garde : « ces fichiers existent ET sont utilisés »
    ui/                        ← inchangé ; Modal devient adaptative (M04)
    MobileNav.tsx              ← inchangé
  lib/
    ruptures.ts                ← les 4 ruptures, source unique
    ruptures.test.ts
    useHauteurUtile.ts         ← visualViewport (M20)
    useIsMobile.ts             ← signature nommée, numérique dépréciée
```

## G.5 — La garde qui manquait en juillet

`primitivesGardees.test.ts` est le fichier le plus important de cette
architecture. Il ne vérifie pas que les primitives **existent** — un test
d'existence se satisfait d'un fichier vide. Il vérifie qu'elles sont **utilisées** :

1. chaque primitive de `components/mobile/` est importée par **au moins un**
   écran de production (pas seulement par un test) ;
2. **aucune autre implémentation de feuille** ne subsiste dans le dépôt
   (recherche de `translateY` + `position: fixed` + `bottom: 0` hors primitive) ;
3. aucune `Modal` centrée n'est rendue sous la rupture `md` ;
4. le compte de `useIsMobile(` numériques **ne remonte pas** ;
5. le compte de `!important` **ne remonte pas**.

Les points 4 et 5 sont des **cliquets** : ils encadrent la dette existante sans
exiger de la résorber d'un coup, et ils empêchent qu'elle grossisse. Le dépôt
utilise déjà ce motif (`testsDeterministes.test.ts` plafonne la taille de
fichiers) — il fonctionne.

---

# PARTIE H — ROADMAP CLAUDE CODE

## H.0 — Instructions permanentes, valables pour TOUS les lots

### Avant chaque lot

1. **Lire** les fichiers nommés dans le lot, en entier, avant d'écrire.
2. **Chercher l'existant** : `grep -rn "<nom du concept>" apps/web/src` avant de
   créer quoi que ce soit. Ce produit a déjà une barre de navigation basse, une
   feuille montante, des jetons de couleur, des jetons de mouvement, une primitive
   de bouton et une garde de cibles tactiles. **Rien de tout cela ne doit être
   recréé.**
3. **Ne pas supposer l'architecture.** Le projet n'utilise **aucune classe
   Tailwind** malgré sa présence dans l'écosystème Next : tout est en styles
   inline ou en CSS global. Vérifier avant d'écrire une classe.
4. Lire `AGENTS.md` / `CLAUDE.md` du dépôt s'ils existent, et les mémoires de
   projet citées dans le lot.

### Pendant

- Changements **ciblés**. Un lot = une responsabilité.
- **Typage strict** : `ignoreBuildErrors` est à `false`, le build Vercel échoue
  sur toute erreur TS. Aucun `any` de contournement, aucun `@ts-ignore`.
- Respecter l'identité : **noir et or**, jetons `--qd-*`, famille `.da-btn-*`,
  durées de `lib/motion.ts`. Ne pas introduire de nouvelle palette.
- Tout moteur de décision (quelle feuille, quelle taille, quel état) va dans un
  **module pur testé**, pas dans le composant. C'est la doctrine du dépôt.
- Gérer les états d'erreur et de chargement **dans le même lot**, pas « plus tard ».

### Après — dans cet ordre, sans en sauter un

```bash
npm run type-check                                   # 0 erreur attendue
npx vitest run                                       # suite complète verte
npx playwright test e2e/auditMobile.spec.ts --project=mobile   # le relevé bouge-t-il ?
npm run build                                        # le build Vercel réel
git checkout -- apps/web/next-env.d.ts               # next dev l'a réécrit
```

Puis **comparer `audit-mobile/releve.json` à la passe précédente** et joindre
les captures de `audit-mobile/390-reference/` concernées.

### Interdictions explicites

- Réécrire une zone entière sans avoir lu l'existant.
- Créer `ComposantMobile.tsx` à côté de `Composant.tsx` (cf. PARTIE G).
- Ajouter une dépendance. Aucune n'est nécessaire dans cette roadmap.
- Masquer un débordement par `overflow: hidden`.
- Ajouter un `z-index` supérieur à ceux du jeu de jetons. Le dépôt contient
  déjà `2147483000` : ne pas renchérir, **réduire**.
- Ajouter un `!important`. Il y en a 365 ; chaque lot doit en retirer, jamais
  en ajouter.
- Désactiver, supprimer ou assouplir un test pour faire passer la suite. Si une
  garde rougit, soit le code est fautif, soit la garde est périmée **et on
  explique pourquoi en commentaire dans le même commit**.
- Considérer `npm run build` comme une validation d'UX. Ce n'en est pas une.
- Toucher à la logique métier : sauvegarde, publication, quotas, permissions,
  URL de QR codes. Cette refonte est **de présentation**.

---

## Phase 0 — Mesure et gardes

> **Pourquoi cette phase existe et passe avant tout le reste.** Trois audits
> mobiles ont été menés en juillet 2026. Ils ont produit des primitives
> (`components/mobile/BottomSheet.tsx`, `MobileDock.tsx`, `designTokens.ts`,
> `BigSlider.tsx`) qui **n'existent plus dans le dépôt**. Aucune garde ne les
> défendait. Commencer par les fondations sans commencer par les gardes, c'est
> programmer le même effacement.

### M01 — Relevé instrumenté *(fait le 5 octobre 2026)*

**Priorité** P0 · **État : LIVRÉ**

**Objectif** — disposer d'une mesure reproductible du mobile, comparable d'une
passe à l'autre.

**Livré** — `e2e/auditMobile.spec.ts` : 34 vues × 3 largeurs (320/390/430), six
mesures par vue, rapport `audit-mobile/releve.json` + `RELEVE.md` + captures.

**Ne pas faire** — en faire une garde qui échoue. C'est un instrument. La garde
des cibles, c'est `ciblesAuPouce.spec.ts`.

---

### M01b — Réparer le banc d'essai `/e2e-harness/onboarding`

**Priorité** P1 · **Tags** `[BUG]` `[QA]`

**Problème actuel** — la route répond **HTTP 500** aux trois largeurs :
`useToast doit être utilisé à l'intérieur de <ToastProvider>` —
`OnboardingClient.tsx:22`. Le banc monte le client sans le fournisseur que les
autres bancs posent.

**Preuve** — relevé du 5 octobre, trois lignes `statut: 500`.

**Impact** — l'onboarding est l'écran **le plus décisif du produit** (vu une
seule fois, il décide de la suite) et c'est le seul qu'on ne peut pas mesurer.

**Travail** — envelopper comme `e2e-harness/statistiques/page.tsx` le fait déjà :
`<ToastProvider><ConfirmProvider>…</ConfirmProvider></ToastProvider>`.

**Critères d'acceptation**
- [ ] `/e2e-harness/onboarding` répond 200 aux trois largeurs
- [ ] le relevé produit des chiffres pour cette vue
- [ ] aucune modification de `OnboardingClient.tsx` lui-même

**Ne pas faire** — « corriger » le composant : il est juste, c'est le banc qui
est incomplet.

---

### M02 — Quatre ruptures, et une garde qui refuse les autres

**Priorité** P0 · **Tags** `[ARCHITECTURE]` `[DESIGN SYSTEM]`

**Problème actuel** — **27 seuils de largeur distincts** (préludes de `@media`
+ `useIsMobile`, idiome `min-width: N+1` normalisé), dont **8 valeurs** passées à
`useIsMobile()` : 620, 700, 768, 859, 860, 900, 1024, 1500. Deux d'entre eux
disent la même chose à un pixel près — 859 pour le QR Studio, 860 pour la
galerie, « aligné sur le shell » dit le commentaire. Les plus fréquents en
`@media` : 620 (×11), 640 (×11), 900 (×11), 1024 (×8).

**Preuve** — relevé statique du 5 octobre. **Deux** sur les quatre ruptures
canoniques sont déjà présents (640, 900) : **25 à résorber**.

**Impact** — personne ne peut prévoir le comportement d'un écran à 700 px. Deux
composants voisins basculent à deux largeurs différentes : c'est la cause
mécanique des ruptures de mise en page entre 620 et 900 px.

**Attention, technique** — on ne peut **pas** écrire
`@media (max-width: var(--bp-md))` : une variable CSS n'est pas évaluable dans la
condition d'une media query. Déclarer `--bp-md` donnerait l'illusion d'une
source unique que le CSS ignorerait. La source est donc `lib/ruptures.ts`, et
une **garde** vérifie que les littéraux du CSS lui correspondent.

**Cause probable** — chaque écran a choisi son seuil parce qu'aucun jeton ne
l'imposait, et qu'un style inline ne peut pas porter de media query.

**Solution**
1. Déclarer dans `globals.css` les quatre jetons de la PARTIE E.3.
2. Créer `lib/ruptures.ts` — module **pur et testé** : `RUPTURES = { sm: 360, md: 640, lg: 900, xl: 1200 }`
   et `estCompact(largeur)`.
3. `useIsMobile` prend une rupture **nommée** : `useIsMobile("md")`, l'ancienne
   signature numérique reste acceptée et marquée `@deprecated`.
4. Garde `ruptureUnique.test.ts` : lit les sources, refuse toute nouvelle valeur
   numérique dans `useIsMobile(...)` et toute `max-width` hors des quatre
   jetons, **avec une liste d'exceptions héritées explicitement datée et
   décroissante**. La garde échoue si la liste grandit.

**Comportement attendu** — un seul endroit décide ce que « compact » veut dire.

**Responsive** — ≤ 360 : petit téléphone. 361–640 : téléphone. 641–900 :
tablette portrait. 901–1200 : desktop compact. > 1200 : desktop large.

**Edge cases** — « mobile » ne se déduit **jamais** de la seule largeur : la mise
à l'échelle Windows à 125 % fait passer un desktop sous 768 px CSS. Combiner avec
`pointer: coarse` (régression déjà vécue et corrigée dans ce dépôt).

**Tests** — `lib/ruptures.test.ts` (pur) + `ruptureUnique.test.ts` (garde source).

**Critères d'acceptation**
- [ ] 4 jetons déclarés, utilisés par au moins un écran migré
- [ ] la garde liste les exceptions héritées et leur nombre exact
- [ ] la garde échoue si on ajoute une 45ᵉ rupture
- [ ] `useIsMobile("md")` fonctionne, l'ancienne forme compile encore

**Dépendances** — aucune. **Premier lot de code.**

**Ne pas faire** — migrer les 25 seuils non conformes d'un coup. La garde encadre la dette,
les lots suivants la résorbent écran par écran.

---

### M03 — Étendre la garde des cibles tactiles à la zone connectée

**Priorité** P0 · **Tags** `[ACCESSIBILITY]` `[QA]`

**Problème actuel** — `e2e/ciblesAuPouce.spec.ts` mesure réellement les cibles,
et **ça marche** : les pages publiques ne comptent que **10** commandes sous
44 px. La zone connectée, elle, en comptait **285** — parce qu'aucune garde ne la
couvrait.

**Preuve** — relevé du 5 octobre. Pires écrans à 390 px : bibliothèque de blocs
**55**, galerie de modèles **34**, messages **22**, réglages de bloc **15**,
Print Studio **12**, statistiques **11**.

**Impact** — le produit s'impose un plancher de 44 px (`--cible-pouce`) et ne le
tient que là où une machine le vérifie. Ailleurs : chips de filtre à 30 px,
champ de recherche à 36 px, bouton « ⓘ » à **26 × 26**, liens de modèle à **16 px
de haut**.

**Solution livrée** — `ciblesAuPouce.spec.ts` étendu aux bancs, **découverts sur
le disque** (un banc ajouté demain est couvert sans y penser), réutilisant
`ciblesTropPetites` plutôt qu'une seconde implémentation. Deux cliquets : un
**plafond par écran**, et un **total gelé à 285** — sans ce second, on pourrait
déplacer la dette d'un banc à l'autre en tenant chaque plafond.

**Critères d'acceptation**
- [ ] les 18 bancs sont couverts
- [ ] le plafond par écran est écrit, daté, et commenté « à faire baisser »
- [ ] ajouter une commande de 32 px à un écran couvert fait rougir la garde
- [ ] aucun plafond relevé pour faire passer la suite

**Ne pas faire** — corriger les 575 cibles dans ce lot. Ce lot **pose la clôture**.

---

### M04 — Interdire la modale centrée sous 640 px

**Priorité** P1 · **Tags** `[UX]` `[DESIGN SYSTEM]`

**Problème actuel** — `components/ui/Modal.tsx` est une boîte centrée
(`maxWidth: 460`, `maxHeight: 90dvh`). Sur un téléphone, elle occupe presque tout
l'écran tout en gardant les codes d'une fenêtre : marges perdues, pas de poignée,
pas de glissement pour fermer, bouton de validation potentiellement sous le
clavier.

**Preuve** — lecture du composant ; `Modal` est importé dans la zone connectée.

**Impact** — c'est le marqueur nº 1 du « site desktop » : une fenêtre flottante
dans un téléphone.

**Solution** — `Modal` gagne une **présentation adaptative** : au-dessus de la
rupture `md`, boîte centrée (inchangée, desktop non régressé) ; en dessous,
elle **rend `MobileSheet`** (lot M06) en taille `grande`. Même API, même
contenu, aucun appelant à modifier.

**Comportement attendu** — à 390 px, ouvrir un dialogue fait monter une feuille
depuis le bas, avec poignée, glissement pour fermer, scrim, et le bouton
principal au-dessus de la safe-area.

**États** — ouverture / ouverte / glissement / fermeture / clavier ouvert.

**Accessibilité** — `role="dialog"`, `aria-modal`, piège de focus, `Échap`,
retour du focus sur le déclencheur. `fenetreQuiEnEstUne.test.ts` existe déjà :
l'étendre, pas le contourner.

**Critères d'acceptation**
- [ ] desktop strictement identique (capture avant/après à 1280 px)
- [ ] à 390 px : feuille montante, poignée, glissement, scrim
- [ ] le bouton principal reste visible clavier ouvert
- [ ] garde : aucune `Modal` centrée rendue sous 640 px
- [ ] `fenetreQuiEnEstUne.test.ts` toujours vert

**Dépendances** — M06.

**Ne pas faire** — créer `MobileModal`. Une modale sur téléphone **est** une
feuille ; deux composants pour un rôle, c'est la duplication que la PARTIE G
interdit.

---

## Phase 1 — Fondations mobiles

### M05 — `/[slug]` : la page que voient les clients de vos clients

**Priorité** **P0** · **Tags** `[UX]` `[MOBILE]` `[PERFORMANCE]`

**Problème actuel** — aucun des trois audits mobiles de juillet ne mentionne
`/[slug]`. Ils ont audité l'atelier ; jamais l'objet fabriqué. Or une page
QRowg est **presque toujours ouverte sur un téléphone** : on y arrive en
scannant un QR code, et on scanne avec un téléphone.

**Preuve** — recherche dans les trois comptes rendus de juillet : zéro mention
de la route publique client. `app/[slug]/page.tsx` + `renduLegacy.tsx`
(2 400 lignes sous plafond de garde).

**Impact** — un défaut ici n'est pas gênant pour l'utilisateur : il est gênant
**pour ses clients**, devant lui, et c'est ce qui le fera partir.

**Travail à effectuer**
1. Ajouter `/[slug]` et deux pages de démonstration publiées au relevé M01.
2. Mesurer les six axes, **plus** : poids JS initial, LCP local, polices.
3. Auditer les blocs les plus utilisés au doigt (menu, horaires, galerie,
   formulaire, avis) : hauteur de ligne, cibles, défilement interne.
4. Corriger ce que le relevé remonte — et **rien de plus**.

**UX attendue** — la page d'un client se lit d'une main, sans zoom, sans
défilement horizontal, et son action principale (appeler, réserver, voir le
menu) est atteignable au pouce.

**Responsive** — 320 à 430 px prioritaires ; tablette acceptable, non prioritaire.

**Edge cases** — page sans titre ; bloc avec 40 éléments ; image en portrait
4000 px ; thème clair choisi par le client ; animation d'entrée active.

**Tests** — étendre `e2e/smoke-public.spec.ts` ; ajouter `/[slug]` au relevé.

**Critères d'acceptation**
- [ ] `/[slug]` figure dans `audit-mobile/releve.json`
- [ ] zéro débordement horizontal sur deux pages de démonstration, 320–430 px
- [ ] zéro commande sous 44 px dans les cinq blocs les plus utilisés
- [ ] la logique de rendu des blocs est **inchangée** (aucune régression publique)

**Ne pas faire** — refondre le renderer public. Il est partagé avec l'éditeur et
une divergence y coûte très cher. Mesurer, corriger les cibles et la typographie.

---

### M06 — `MobileSheet` : promouvoir la feuille du builder en primitive

**Priorité** **P0** · **Tags** `[ARCHITECTURE]` `[DESIGN SYSTEM]`

**Problème actuel** — `app/dashboard/builder/MobileBottomSheet.tsx` (93 lignes)
existe, fonctionne, et n'est importé que par **un seul fichier**,
`MobileBuilderShell.tsx`. Un écran sur dix-huit a une feuille. Les autres
ouvrent des modales centrées ou rien.

**Preuve** — `grep -rln "MobileBottomSheet"` → 2 fichiers, dont lui-même.

**Impact** — chaque écran réinvente sa surface, d'où les divergences de densité,
de fermeture et de safe-area que le brief décrit.

**Solution**
1. Déplacer en `components/mobile/MobileSheet.tsx`. **Vérifier d'abord** ce que
   contient le fichier actuel : reprendre son comportement, pas le réécrire.
2. Quatre tailles, prises aux jetons : `compacte 38dvh`, `moyenne 58dvh`,
   `grande 84dvh`, `plein 100dvh`.
3. `MobileSheetStack` : **une seule feuille ouverte à la fois**, un seul scrim,
   `history.pushState` à l'ouverture et fermeture sur `popstate` → le bouton
   retour du téléphone ferme la feuille.
4. Moteur **pur testé** `lib/feuilleMobile.ts` : `tailleDeFeuille(contenu, viewport)`,
   `doitSeFermer(geste)`, `hauteurUtile(viewport, clavier)`.
5. Verrou de défilement du fond **robuste iOS** : `position: fixed; top: -scrollY`
   puis restauration — le `overflow: hidden` ne suffit pas sur iOS, c'est une
   régression déjà vécue dans ce dépôt.
6. `overscroll-behavior: contain` et `touch-action: pan-y` sur le corps : il n'y
   en a plus que **1** et **3** occurrences dans tout le dépôt.

**États** — fermée / ouverture / ouverte / glissement / redimensionnement
clavier / fermeture.

**iOS** — safe-area basse ; verrou de fond `position: fixed` ; pas de
`backdrop-filter` sur le scrim (coûteux au scroll sur iPhone ancien).

**Android** — bouton retour système ferme la feuille (`popstate`).

**Accessibilité** — `role="dialog"`, `aria-modal="true"`, focus piégé, `Échap`,
focus rendu au déclencheur, `prefers-reduced-motion` → pas de translation.

**Performance** — `transform: translateY` seulement (jamais `height`), `will-change`
posé à l'ouverture et retiré à la fin, durée `DURATION.sheet` (300 ms).

**Edge cases** — contenu plus haut que `84dvh` → défile à l'intérieur, poignée
fixe ; feuille ouverte + rotation ; feuille ouverte + clavier ; double ouverture
concurrente ; fermeture pendant l'animation d'ouverture.

**Tests** — `lib/feuilleMobile.test.ts` (pur) ; `e2e/feuilleQuiSeTient.spec.ts` :
ouvre, glisse, ferme, vérifie le retour du focus et que le fond n'a pas bougé.

**Critères d'acceptation**
- [ ] `MobileSheet` dans `components/mobile/`, avec son moteur pur testé
- [ ] le builder utilise la primitive et **se comporte comme avant** (capture)
- [ ] le bouton retour ferme la feuille sans quitter l'écran
- [ ] le fond ne défile pas, et retrouve sa position à la fermeture
- [ ] deux ouvertures simultanées sont impossibles
- [ ] garde : aucune autre implémentation de feuille ne subsiste dans le dépôt

**Dépendances** — M02.

**Ne pas faire** — réécrire la feuille du builder depuis zéro. La lire, la
déplacer, l'élargir. **Et ne pas oublier la garde du dernier critère** : c'est
exactement ce qui a manqué en juillet.

---

### M07 — `MobilePage` et `MobileSection` : un seul défilement

**Priorité** P1 · **Tags** `[UX]` `[ARCHITECTURE]`

**Problème actuel** — bonne nouvelle d'abord : le relevé ne trouve **aucun
défilement imbriqué** sur les 102 vues. Mauvaise : il n'y a **aucune
restauration de position** (`scrollRestoration` : 0 fichier), et chaque écran
compose son rembourrage à la main, d'où des bas de page mangés par la barre
basse ou, à l'inverse, 92 px de vide.

**Preuve** — relevé ; `grep scrollRestoration` → 0.

**Impact** — revenir d'un détail vers une liste repart en haut. Sur une liste de
30 pages, c'est l'action la plus agaçante du produit.

**Solution** — `MobilePage` : conteneur de défilement **unique** de l'écran,
`overscroll-behavior: contain`, rembourrage bas calculé
`calc(var(--h-navbar) + var(--safe-bas) + 16px)`, position mémorisée par route
dans `sessionStorage`, restaurée au retour. `MobileSection` : titre + corps +
rythme vertical pris aux jetons.

**Critères d'acceptation**
- [ ] un seul conteneur défilant par écran migré (le relevé le vérifie)
- [ ] revenir d'un détail restaure la position au pixel
- [ ] le dernier élément n'est jamais sous la barre basse, à 320 et 430 px
- [ ] aucune régression desktop

**Dépendances** — M02.

**Ne pas faire** — un routeur maison ni une pile de navigation applicative.
`sessionStorage` + `popstate` suffisent et ne cassent rien.

---

### M08 — `MobileTopBar` et `SegmentedControl`

**Priorité** P1 · **Tags** `[UI]` `[DESIGN SYSTEM]`

**Problème actuel** — `components/ui/Tabs.tsx` est un `role="tablist"` souligné
d'un filet : c'est un composant desktop. Les écrans qui ont besoin d'une bascule
courte (périodes de statistiques, filtres de messages) ont fabriqué des rangées
de petits boutons — mesurés à **38 × 32** (statistiques, « 7j ») et **32 px**
(messages).

**Preuve** — relevé, pires cibles nommées.

**Solution** — `SegmentedControl` : 2 à 4 options, hauteur `--cible-pouce`,
pastille active glissante (`DURATION.fast`), `role="radiogroup"`. Au-delà de 4
options, ce n'est plus un segmenté : c'est une feuille de filtres.
`MobileTopBar` : retour + titre + **une seule** action, 52 px + safe-area haute.

**Critères d'acceptation**
- [ ] hauteur ≥ 44 px, options ≥ 24 px de large, écart ≥ 8 px
- [ ] clavier : flèches gauche/droite, `aria-checked`
- [ ] garde : `MobileTopBar` refuse plus d'une action
- [ ] `Tabs` desktop inchangé

**Ne pas faire** — remplacer `Tabs` partout. Les deux coexistent : souligné pour
la navigation de contenu desktop, segmenté pour une bascule courte au doigt.

---

### M09 — `MobileListItem` et `ActionSheet`

**Priorité** P1 · **Tags** `[UX]` `[DESIGN SYSTEM]`

**Problème actuel** — le motif « menu `…` → feuille du bas » a été établi deux
fois (accueil du dashboard, médias) puis **jamais factorisé**. Résultat : les
listes de messages, redirections, domaines et équipe ont des lignes à 32 px avec
des boutons de 32 × 32.

**Preuve** — relevé : messages 22 cibles basses, redirections 8, domaines 6.

**Solution** — `MobileListItem` : hauteur 56 px, vignette, titre + secondaire,
un bouton `…` de 44 px de hitbox (dessin 32). `ActionSheet` : composition de
`MobileSheet` + liste d'actions, destructive isolée en bas.

**Critères d'acceptation**
- [ ] les quatre listes utilisent la primitive
- [ ] le menu échappe tout `overflow: hidden` d'ancêtre (c'était le motif d'origine)
- [ ] action destructive séparée et confirmée
- [ ] plafond M03 abaissé pour ces quatre écrans

**Dépendances** — M06.

**Ne pas faire** — un swipe pour supprimer. Geste caché, destructif, non
découvrable : le brief l'interdit explicitement.

---

## Phase 2 — Page pilote : Statistiques

> **Pourquoi Statistiques et pas l'éditeur.** Quatre raisons, dans l'ordre :
>
> 1. **Zéro adaptation mobile aujourd'hui** : 4 046 lignes, **0** `useIsMobile`,
>    **1** media query. On ne risque pas de défaire un travail existant.
> 2. **Elle exerce presque toutes les primitives** : coquille, sections, cartes de
>    chiffres, bascule de période (segmenté), filtres (feuille), vue d'ensemble →
>    détail (navigation), état vide, état de chargement, 14 panneaux.
> 3. **Aucun canvas.** Les 14 panneaux sont du **SVG écrit à la main** — aucune
>    bibliothèque de graphiques, donc aucune boîte noire. Le Print Studio et
>    l'éditeur, eux, portent un canvas : un pilote là-bas mélangerait les
>    difficultés.
> 4. **Deux états mesurables gratuitement** : le banc `/e2e-harness/statistiques`
>    sert le compte fourni, et `?debut=1` le compte qui vient de publier — une
>    page, trois scans. Le second est celui de **tout nouvel utilisateur**.
>
> Elle a 11 cibles sous 44 px, 33 fautes de corps de texte et 10 voisinages trop
> serrés : assez pour prouver le langage, trop peu pour mettre le produit en péril.

### M10 — Statistiques : coquille, périodes, filtres

**Priorité** P1 · **Tags** `[UX]` `[UI]` `[MOBILE]`

**Problème actuel** — la bascule de période est une rangée de boutons mesurés à
**38 × 32** (« 7j »), les filtres sont posés à plat dans la page, et le lede
explicatif est à **11,5 px sur 88 caractères**.

**Résultat attendu** — `MobileTopBar` (titre + une action : exporter) ·
`SegmentedControl` pour 7j / 30j / 90j · tout autre filtre (page, support, pays)
dans une **feuille de filtres** avec un compteur d'actifs · `MobilePage` comme
unique défilement.

**Fichiers concernés** — `app/dashboard/analytics/AnalyticsShell.tsx`,
`AnalyticsClient.tsx`, `ExportPanel.tsx`. *Claude Code : lire les trois avant de
toucher ; `analyticsAgg.ts` et `lectureHonnete.ts` sont des moteurs purs testés,
**ne pas y toucher**.*

**UX attendue** — à l'ouverture, on voit : la période, trois chiffres, une
tendance. Tout le reste se demande.

**États** — chargement (squelette, pas de rouet) · vide · une page / trois scans
· données riches · erreur réseau · export en cours.

**Responsive** — ≤ 640 : une colonne, segmenté pleine largeur, filtres en
feuille. 641–900 : deux colonnes. > 900 : la grille desktop actuelle, **inchangée**.

**Accessibilité** — `role="radiogroup"` sur le segmenté ; chaque chiffre a un
libellé lisible par VoiceOver ; les graphiques SVG ont `role="img"` et un
`aria-label` qui **énonce la valeur**, pas « graphique ».

**Edge cases** — 0 vue (le libellé doit dire « — », pas « 0 % ») · une seule
journée de données · 90 jours sur 320 px · nombres à 6 chiffres.

**Critères d'acceptation**
- [ ] 0 commande sous 44 px sur les deux états du banc
- [ ] 0 corps de texte sous 13 px
- [ ] desktop ≥ 901 px strictement identique (captures avant/après)
- [ ] les moteurs purs sont inchangés (`git diff` vide sur `analyticsAgg.ts`)
- [ ] plafond M03 abaissé de 11 à 0 pour cette vue

**Ne pas faire** — changer un calcul, un libellé de métrique ou une définition.
`statistiquesHonnetes.test.ts` et `lectureHonnete.ts` encodent des promesses de
mesure : les toucher serait mentir sur les chiffres.

---

### M11 — Statistiques : vue d'ensemble → détail

**Priorité** P1 · **Tags** `[UX]` `[ARCHITECTURE]`

**Problème actuel** — **14 panneaux** (`OverviewCards`, `GeoPanel`, `DevicePanel`,
`TopLinksPanel`, `ScrollDepthPanel`, `HeatmapPanel`, `ConversionFunnelPanel`,
`BlockPerformancePanel`, `SupportPanel`, `GoalsDashboard`, `ReportSubscriptionPanel`,
`DefinitionsPanel`, `ExportPanel`…) empilés dans un seul écran. Sur un téléphone,
c'est un défilement interminable où rien ne ressort.

**Résultat attendu** — deux niveaux. **Niveau 1** : quatre chiffres, une courbe,
et une liste de six entrées « Voir les détails » (Pays, Appareils, Liens,
Supports, Profondeur, Objectifs). **Niveau 2** : un panneau, plein écran, avec
retour.

**Travail**
1. Moteur pur `app/dashboard/analytics/ordreDesPanneaux.ts` :
   `panneauxVisibles(donnees, niveau)` — un panneau sans donnée **ne s'affiche
   pas** au niveau 1 (la règle d'honnêteté existe déjà pour l'état vide).
2. Niveau 2 = route réelle `?panneau=geo` → l'URL est partageable et le bouton
   retour du téléphone fonctionne sans code.
3. Desktop : les 14 panneaux restent empilés comme aujourd'hui.

**Critères d'acceptation**
- [ ] niveau 1 ≤ 2 hauteurs d'écran à 390 px
- [ ] un panneau sans donnée n'apparaît pas au niveau 1
- [ ] le bouton retour revient au niveau 1 en restaurant la position
- [ ] aucun panneau supprimé — tous atteignables en deux gestes

**Ne pas faire** — supprimer un panneau parce qu'il prend de la place. Le brief
l'interdit, et ce sont les panneaux avancés qui justifient les offres payantes.

---

### M12 — Validation du pilote

**Priorité** P1 · **Tags** `[QA]`

**Travail** — relancer le relevé, comparer les deux `releve.json`, produire
`audit-mobile/PILOTE.md` : avant / après par axe, captures côte à côte aux trois
largeurs, pour les deux états du banc.

**Critères d'acceptation**
- [ ] tableau avant/après chiffré, pas une appréciation
- [ ] captures 320 / 390 / 430 pour les deux états
- [ ] desktop 1280 px : captures avant/après identiques
- [ ] **validation de l'utilisateur sur un vrai iPhone avant la Phase 3**

**Ne pas faire** — enchaîner sur la Phase 3 sans cette validation. C'est le seul
point de la roadmap où l'agent doit **s'arrêter et attendre**.

---

## Phase 3 — Propagation aux écrans de liste et de formulaire

> Ordre dicté par le relevé, pas par l'intuition : on commence par l'écran le
> plus fautif.

### M13 — Bibliothèque de blocs (le pire écran du produit)

**Priorité** **P0** · **Tags** `[UX]` `[ACCESSIBILITY]`

**Problème actuel** — **55 commandes sous 44 px** à 390 px, le pire score du
produit. Mesures nommées : chips de catégorie **30 px** de haut (« Essentiels »,
« Tout », « ⚡ Actions 21 »), champ de recherche **36 px**, bouton de fermeture
**30 × 30**, bouton d'aide **26 × 26**. Et **20 voisinages** sous 8 px.

**Impact** — c'est l'écran par lequel passe **chaque ajout de bloc**, donc le
plus fréquenté de l'éditeur. 143 types de blocs à parcourir au pouce avec des
cibles de 30 px.

**Résultat attendu** — recherche 52 px collante en haut · catégories en
`SegmentedControl` défilant horizontalement, hauteur 44 px, `touch-action: pan-x`
· grille de blocs 2 colonnes à 390 px, carte 96 px de haut · insertion en un tap,
retour automatique au canvas · « récents » en tête (le motif existait dans la
galerie supprimée : `templateGallery.ts`).

**Responsive** — ≤ 360 : 2 colonnes serrées. 361–640 : 2 colonnes. > 640 : grille
actuelle.

**Edge cases** — recherche sans résultat · 143 blocs sans filtre · nom de bloc
sur deux lignes · clavier ouvert (la grille doit rester atteignable).

**Critères d'acceptation**
- [ ] 0 commande sous 44 px (de 55 à 0)
- [ ] 0 voisinage sous 8 px (de 20 à 0)
- [ ] insertion d'un bloc en ≤ 2 taps depuis l'ouverture
- [ ] `e2e/block-library.spec.ts` toujours vert
- [ ] plafond M03 abaissé

---

### M14 — Galerie de modèles

**Priorité** P1 · **Tags** `[UX]` `[UI]`

**Problème actuel** — **34 cibles** basses et **33 voisinages** serrés. Mesure la
plus parlante : les liens de modèle font **220 × 16 px** — seize pixels de haut.
La zone cliquable est le texte, pas la carte.

**Résultat attendu** — **la carte entière est la cible** (`a` en bloc, 100 % de
la carte) · aperçu réel (`MiniApercu` existe déjà, cf. `classementDesModeles.ts`)
· catégories en segmenté défilant · aperçu plein écran en `MobileFullScreen` ·
2 colonnes à 390 px, ratio 3:4.

**Critères d'acceptation**
- [ ] la carte entière est cliquable, hauteur ≥ 44 px
- [ ] 0 voisinage sous 8 px
- [ ] `e2e/galerieDeModeles.spec.ts` et `template-preview.spec.ts` verts
- [ ] `classementDesModeles.ts` (moteur pur) inchangé

**Ne pas faire** — retoucher le classement, les secteurs ou les compteurs : ils
ont leur source unique testée.

---

### M15 — Messages

**Priorité** P1 · **Tags** `[UX]`

**Problème** — **22 cibles** basses : chips de filtre **32 px** (« Tous », « Non
lus (1) », « Réservation », « Devis »), champ **38 px**, sélecteur de statut
**142 × 32**.

**Résultat attendu** — `MobileListItem` 56 px · filtres en feuille avec compteur
· lecture d'un message en plein écran · actions en `ActionSheet`.

**Critères d'acceptation** — [ ] 0 cible < 44 px · [ ] 0 voisinage < 8 px ·
[ ] le chiffrement de bout en bout des messages est **intact** (ne pas toucher à
la couche de déchiffrement).

---

### M16 — Profil

**Priorité** P1 · **Tags** `[UX]` `[MOBILE]`

**Problème** — 3 068 lignes, **0** `useIsMobile`, **1** media query. Formulaire
long et plat.

**Résultat attendu** — quatre `MobileSection` (Identité · Coordonnées ·
Apparence · Adresse publique), `MobileFieldRow` à 52 px, enregistrement
automatique avec `SaveStatus`, et l'étiquette « Pages publiées » **corrigée**
(elle est fausse aujourd'hui — noté dans la mémoire du projet).

**Critères d'acceptation** — [ ] champs ≥ 52 px · [ ] 0 corps < 13 px ·
[ ] bouton d'enregistrement jamais sous le clavier · [ ] compteur « Pages
publiées » exact.

---

### M17 — Les petits écrans, en un lot : Réglages, Domaines, Redirections, Équipe, Médias

**Priorité** P2 · **Tags** `[UX]` `[ACCESSIBILITY]`

**Problème** — 2 888 lignes au total, **0** `useIsMobile`, **0** media query pour
trois d'entre eux. Mesures : redirections 8 cibles basses dont un bouton
**32 × 32**, domaines 6, équipe 2, médias 3. Pire faute de texte du produit :
**un paragraphe de 313 caractères à 11 px** dans les redirections (l'explication
301 / 302).

**Résultat attendu** — même squelette pour les cinq : `MobileTopBar` +
`MobilePage` + `MobileSection` + `MobileListItem` + `ActionSheet`. Les textes
explicatifs passent à 15 px ou vont dans un `<details>`.

**Critères d'acceptation** — [ ] 0 cible < 44 px sur les cinq · [ ] 0 corps
< 13 px · [ ] zone de danger isolée dans Réglages (acquis de juillet, à
préserver) · [ ] plafonds M03 abaissés.

---

## Phase 4 — Éditeur de page

> 13 800 lignes, un canvas, et une adaptation mobile **déjà réelle** (panneau
> unique, onglets du bas, `MobileBuilderShell`). Le relevé y trouve seulement
> **4 cibles basses** — c'est l'une des zones les mieux tenues. On ne la refond
> pas : on corrige trois manques précis.

### M18 — L'aperçu devient un mode, pas une destination

**Priorité** P1 · **Tags** `[UX]` `[ARCHITECTURE]`

**Problème** — le parcours « éditer → publier » compte **quatre** changements de
contexte parce que l'aperçu **quitte** l'éditeur. On perd l'état, la position de
défilement, et le bloc sélectionné.

**Résultat attendu** — un `SegmentedControl` « Édition | Aperçu » dans la
`MobileTopBar`. Aperçu = même arbre, panneaux masqués, canvas à 100 %. Zéro
navigation, zéro perte d'état.

**Critères d'acceptation** — [ ] basculer et revenir conserve le bloc
sélectionné et la position · [ ] aucune requête réseau au basculement ·
[ ] `e2e/builder-mobile-shell.spec.ts` vert · [ ] desktop inchangé.

---

### M19 — Barre contextuelle et propriétés en feuille

**Priorité** P1 · **Tags** `[UX]`

**Problème** — `BlockContextToolbar.tsx` (59 lignes) existe mais reste minimal ;
les réglages d'un bloc ouvrent l'onglet « Réglages », qui occupe l'écran et
masque le bloc qu'on règle. C'est **exactement** la cause nº 1 identifiée en
juillet sur le Print Studio — et elle a survécu dans l'éditeur.

**Résultat attendu** — sélection d'un bloc → **barre contextuelle** (5 intentions
max + « Plus »), cibles 52 px. Chaque intention ouvre une `MobileSheet`
**compacte** (38 dvh) ; le canvas se décale d'autant pour que **le bloc réglé
reste visible**. Moteur pur `outilsDuBloc.ts` : `intentions(type)` ordonnées.

**Critères d'acceptation** — [ ] le bloc sélectionné reste visible, feuille
ouverte, à 320 et 430 px · [ ] jamais plus de 6 intentions · [ ] fermer la
feuille ne désélectionne pas · [ ] 15 cibles basses de `block-settings` → 0.

---

### M20 — Clavier : `visualViewport`

**Priorité** **P0** · **Tags** `[BUG]` `[MOBILE]`

**Problème** — `visualViewport` n'est utilisé que dans **4 fichiers** du dépôt.
Partout ailleurs, l'ouverture du clavier n'est pas prise en compte : sur iOS,
elle ne change pas `100dvh`, donc une barre d'actions en bas d'un conteneur
`100dvh` **passe sous le clavier**.

**Preuve** — `grep -rl visualViewport` → 4 fichiers ; 34 `100vh` subsistent.

**Impact** — un champ en bas d'une feuille devient inatteignable, et le bouton
de validation invisible. C'est un défaut **bloquant**, pas une finition.

**Résultat attendu** — hook `useHauteurUtile()` : écoute `visualViewport.resize`,
expose `--hauteur-utile` en variable CSS sur la racine. Toute surface plein écran
(feuille, éditeur, formulaire) l'utilise au lieu de `100dvh`.

**iOS** — `visualViewport.height` **et** `offsetTop` (Safari décale la page au
focus). **Android** — Chrome redimensionne, pas de décalage.

**Edge cases** — clavier + rotation · clavier avec barre de suggestions ·
clavier fermé par geste · champ `select` natif.

**Critères d'acceptation**
- [ ] aucun bouton primaire masqué, clavier ouvert, sur les 6 formulaires
      (`/auth/login`, `/auth/signup`, `/contact`, profil, domaines, bloc)
- [ ] le champ actif reste visible, clavier ouvert
- [ ] aucun saut de mise en page à l'ouverture (mesuré : CLS)
- [ ] **vérification sur un iPhone réel** — Chromium ne reproduit pas le clavier

**Ne pas faire** — `scrollIntoView` au focus comme pansement : ça provoque le
saut qu'on veut éviter.

---

## Phase 5 — QR Studio et Print Studio

### M21 — QR Studio

**Priorité** P1 · **Tags** `[UX]`

**État réel** — bien mieux tenu que ce que les audits de juillet laissaient
craindre : **5 cibles** basses, 9 textes courts, 1 voisinage. Le travail de
juillet (onglets 48 px, en-tête non collant sous 860 px) a tenu.

**Résultat attendu** — appliquer les primitives : réglages en `MobileSheet`
plutôt qu'en colonne, aperçu du QR **toujours visible** pendant le réglage,
téléchargement en `FloatingActionBar`. Et **trancher le flag `?zero=1`** :
`QRStudioZero.tsx` est une refonte « zéro scroll » derrière un drapeau opt-in —
soit elle devient le défaut sur mobile, soit elle est retirée. Deux
implémentations d'un même écran, c'est la dette que la PARTIE G interdit.

**Critères d'acceptation** — [ ] 0 cible < 44 px · [ ] l'aperçu reste visible
pendant tout réglage · [ ] décision prise et appliquée sur `?zero=1`,
**avec l'accord de l'utilisateur**.

---

### M22 — Print Studio

**Priorité** P1 · **Tags** `[UI]` `[ACCESSIBILITY]`

**Problème** — le pire écran du produit pour le texte : **24 textes sous 11 px**
et **14 corps de texte** sous 13 px au-delà de 60 caractères (descriptions de
supports : « Collé sur chaque table : vos… » à 11,5 px). 12 cibles basses dont
les chips `.ps2-chip` à **95 × 32**.

**Contexte à lire avant d'agir** — c'est une **refonte récente** (`print-studio/`,
« objets, pas outils ») avec des moteurs purs testés : `catalog.ts`, `tokens.ts`,
`apercuMobile.ts`, `ajustement.ts`, `tailleQrImprimable.ts`. L'ancien
`PrintStudio.tsx` Fabric n'existe plus. **Ne pas ressusciter l'ancien.**

**Résultat attendu** — échelle typographique appliquée (plancher 13 px pour toute
description), chips à 44 px, et `apercuMobile.ts` branché s'il ne l'est pas déjà
(vérifier : un moteur d'aperçu mobile existe, ce qui suggère que le travail est
commencé).

**Critères d'acceptation** — [ ] 24 textes < 11 px → 0 · [ ] 14 corps < 13 px → 0
· [ ] 0 cible < 44 px · [ ] les moteurs purs inchangés · [ ] export PDF/PNG
identique au pixel (comparer deux exports avant/après).

---

## Phase 6 — Transversal

### M23 — États pressés : 165 `:hover` pour 40 `:active`

**Priorité** P1 · **Tags** `[UX]` `[MOBILE]`

**Problème** — 165 `:hover`, **40** `:active`, et **81 paires** de
`onMouseEnter`/`onMouseLeave`. Un doigt ne survole pas : 125 éléments changent
d'apparence pour une souris et **rien** ne se passe au toucher.

**Résultat attendu** — toute règle `:hover` décorative est doublée d'un
`:active`. Les affordances **portées par le survol seul** (révélation d'un menu,
d'un bouton de suppression) deviennent permanentes ou passent dans un
`ActionSheet`. Les `onMouseEnter` purement visuels passent en CSS.

**Critères d'acceptation** — [ ] aucune action disponible **uniquement** au
survol (garde source) · [ ] chaque commande a un retour visuel au toucher en
≤ 80 ms (`DURATION.instant`) · [ ] `@media (hover: hover)` encadre les effets de
survol pour qu'ils ne « collent » pas après un tap sur mobile.

---

### M24 — Sauvegarde et publication lisibles

**Priorité** P1 · **Tags** `[UX]`

**Acquis** — `resolveSaveStatus(flags)` existe déjà, pur et testé
(`saving/saved/saveError/hasUnsaved/creating/errorMessage`), et la sauvegarde est
sérialisée (`saveController.ts`). **Le moteur est bon ; c'est l'affichage mobile
qui manque.**

**Résultat attendu** — primitive `SaveStatus` dans la `MobileTopBar` : quatre
états **visuellement distincts** — *modifié* (point or), *enregistrement* (point
pulsé), *enregistré* (coche), *publié* (badge). Et la distinction que le brief
réclame : **ce que voient les visiteurs ≠ ce qui est enregistré**.

**Critères d'acceptation** — [ ] les 4 états sont distinguables sans lire le
texte · [ ] « enregistré » et « publié » ne se confondent jamais · [ ] une erreur
de sauvegarde est visible sans ouvrir de panneau · [ ] `resolveSaveStatus`
inchangé.

---

### M25 — Performance : sortir les dispositions du JavaScript

**Priorité** **P2** *(était P0 ; voir P0-3, le constat a été mesuré puis
reclassé — le HTML servi tient, la gêne est l'auditabilité et le coût de rendu)*
· **Tags** `[PERFORMANCE]` `[ARCHITECTURE]`

**Problème** — le flash post-hydratation **n'existe plus** : `useIsMobile`
utilise `useSyncExternalStore` et corrige avant la peinture (270 ms de barre
latérale fantôme supprimés, documentés dans le hook). Ce qui reste est le **HTML
servi** : le serveur ignore la largeur, donc toute disposition décidée en style
inline part en version de bureau, et c'est ce qu'un téléphone affiche avant
l'arrivée du JavaScript. Mesuré par `e2e/avantLeJavascript.spec.ts`.

**Résultat attendu** — la bascule compact/confortable est portée par un
**attribut sur la racine** (`data-densite`) posé par CSS (`@media`) et non par
JavaScript. Les composants lisent l'attribut via CSS. `useIsMobile` ne sert plus
qu'aux décisions **comportementales** (quel panneau monter), jamais aux
dispositions.

**Budget** — aucun décalage de mise en page visible au chargement (CLS ≈ 0 sur
les écrans migrés) · interactions principales < 100 ms perçues · défilement
fluide sur iPhone d'entrée de gamme.

**Mesure** — `audit-mobile` note le CLS avant/après. **Les données terrain (INP,
LCP réels) ne sont PAS mesurables ici** : un test local ne prouve rien sur la
production, et prétendre mesurer l'INP terrain avec Lighthouse serait faux.

**Critères d'acceptation** — [ ] aucune disposition ne change après hydratation
sur les écrans migrés · [ ] CLS mesuré avant/après · [ ] aucun `useIsMobile` dans
une décision de **disposition** sur les écrans migrés.

---

### M26 — Accessibilité

**Priorité** P1 · **Tags** `[ACCESSIBILITY]`

**Acquis** — `e2e/contrasteDuTexte.spec.ts`, `siteAuClavier.spec.ts`,
`ciblesAuPouce.spec.ts` existent et mesurent réellement.

**Travail** — étendre les trois aux 18 bancs · `prefers-reduced-motion` respecté
par `MobileSheet` et le segmenté · chaque SVG de statistiques reçoit un
`aria-label` **énonçant la valeur** · zoom à 200 % sans perte de contenu ·
orientation paysage non bloquée (une refonte de juillet avait retiré un verrou de
paysage : ne pas le réintroduire).

**Critères d'acceptation** — [ ] les 3 gardes couvrent la zone connectée ·
[ ] parcours complet au clavier sur le pilote · [ ] aucune animation si
`prefers-reduced-motion` · [ ] zoom 200 % sans défilement horizontal.

---

### M27 — QA sur appareils réels

**Priorité** P1 · **Tags** `[QA]`

**Ce lot n'est pas exécutable par l'agent.** Chromium en mode tactile ne
reproduit ni l'inertie iOS, ni la barre d'URL de Safari qui mange la hauteur, ni
le clavier natif, ni l'encoche, ni le `position: fixed` d'iOS. Les trois audits
de juillet le disaient déjà : « tests iPhone RÉELS = rôle utilisateur ».

**Livrable de l'agent** — `audit-mobile/SCENARIOS.md` : la liste exacte des
gestes à essayer, écran par écran, avec le résultat attendu, pour que
l'utilisateur puisse répondre par oui / non sans interpréter.

**Critères d'acceptation** — [ ] scénarios écrits, numérotés, vérifiables ·
[ ] chacun a un attendu observable · [ ] aucun scénario ne demande un jugement
esthétique.

---

### M28 — Nettoyage de la dette mesurée

**Priorité** P2 · **Tags** `[ARCHITECTURE]`

**Problème** — chiffres relevés le 5 octobre : **34** `100vh` restants (contre 49
`100dvh`), **365** `!important`, `z-index` jusqu'à **2 147 483 000** (et 9999 ×6,
99999, 9000…), **1** seul `overscroll-behavior` et **3** `touch-action` dans tout
le dépôt.

**Résultat attendu** — jeu de jetons `--z-*` (fond 0, contenu 1, collant 10,
barre 100, feuille 1000, scrim 999, toast 2000) ; les valeurs extrêmes
remplacées ; `100vh` → `100dvh` ou `--hauteur-utile` ; chaque lot retire des
`!important` et **aucun n'en ajoute**.

**Critères d'acceptation** — [ ] 0 `z-index` littéral > 2000 · [ ] 0 `100vh` sur
un conteneur plein écran · [ ] `!important` en baisse, chiffre consigné à chaque
lot · [ ] garde : aucun nouveau `z-index` littéral hors jetons.

**Ne pas faire** — un grand nettoyage en un commit. Ces valeurs tiennent des
empilements réels ; les baisser en aveugle casse des superpositions. Par écran,
avec capture.

---

# PARTIE I — MATRICE QA

## I.1 — Largeurs

| Largeur × hauteur | Appareil représenté | Dans le relevé auto | Pourquoi |
| --- | --- | --- | --- |
| 320 × 568 | iPhone SE 1re gén. | **oui** | pire cas de tout débordement |
| 360 × 800 | Android courant | à ajouter | la plus répandue en Europe |
| 375 × 812 | iPhone X–13 mini | à ajouter | encoche |
| **390 × 844** | iPhone 12–15 | **oui** | **référence** |
| 393 × 852 | iPhone 15/16 | redondant avec 390 | — |
| 414 × 896 | iPhone 11 Pro Max | à ajouter | grande main |
| 430 × 932 | iPhone 15–16 Pro Max | **oui** | plus grand téléphone |
| 768 × 1024 | iPad portrait | à ajouter | rupture `lg` |
| 1024 × 768 | iPad paysage | à ajouter | non-régression |
| 1280 × 900 | desktop | projet `desktop` existant | **non-régression obligatoire** |

Le relevé couvre aujourd'hui 320 / 390 / 430. Les quatre largeurs « à ajouter »
le seront au lot M12, quand le pilote aura prouvé que la matrice sert à quelque
chose : élargir avant de savoir, c'est multiplier par trois un relevé qui ne
mesure pas encore les bonnes choses.

## I.2 — États à vérifier sur chaque écran migré

| État | Comment l'obtenir | Ce qui doit être vrai |
| --- | --- | --- |
| vide | `?debut=1` sur les bancs qui l'ont | pas de « 0 % » là où il n'y a pas de donnée |
| chargement | ralentir le réseau à « Slow 3G » | squelette, jamais un rouet seul |
| erreur réseau | couper le réseau pendant une action | message lisible + possibilité de reprendre |
| texte long | nom de page de 80 caractères | troncature propre, pas de débordement |
| liste très longue | 30 pages, 143 blocs | défilement fluide, position restaurée |
| clavier ouvert | focus sur un champ | bouton primaire et champ actif visibles |
| portrait | — | référence |
| paysage | rotation | éditeur, QR, Print Studio, aperçus utilisables |
| zoom 200 % | réglages du navigateur | aucun défilement horizontal |
| `prefers-reduced-motion` | réglages système | aucune translation de feuille |

## I.3 — Appareils réels — ce que la machine ne peut pas faire

Le relevé tourne sur Chromium en mode tactile. Il **ne reproduit pas** :
l'inertie de défilement d'iOS · la barre d'URL de Safari qui mange la hauteur au
défilement · le clavier natif et sa barre de suggestions · l'encoche et la barre
de gestes · le comportement de `position: fixed` sur iOS · le retour haptique.

**Minimum requis avant de déclarer la refonte terminée** : un iPhone en Safari
et un Android en Chrome, sur le parcours « inscription → première page →
publication → scan ». Le lot M27 prépare les scénarios pour que la réponse soit
oui / non, sans interprétation.

---

# PARTIE J — PERFORMANCE

## J.1 — Ce qui est mesurable ici, et ce qui ne l'est pas

**Mesurable en local** — poids du JS initial par route (sortie de
`npm run build`), nombre de re-rendus, décalage de mise en page au chargement
(CLS visible), fluidité du défilement sur un profil CPU ralenti.

**Non mesurable en local, et je ne le prétendrai pas** — l'INP, le LCP et le CLS
**terrain** de la production. Ils viennent de CrUX, qui exige assez de trafic
réel. Un test Lighthouse local ne mesure pas l'INP terrain ; l'affirmer serait
faux. Et PageSpeed Insights répond **HTTP 429** sans clé d'API depuis cet
environnement (vérifié) : il faut soit une clé gratuite, soit cinq passages
manuels sur `pagespeed.web.dev`.

## J.2 — Budgets retenus

| Cible | Valeur | Vérification |
| --- | --- | --- |
| Décalage au chargement | **aucun changement de disposition après hydratation** | capture à 2 instants, écrans migrés |
| Retour au toucher | ≤ 80 ms (`DURATION.instant`) | `:active` présent sur chaque commande |
| Ouverture de feuille | 300 ms (`DURATION.sheet`), `transform` seulement | profil de performance |
| Changement de période (statistiques) | sans aller-retour réseau si les données sont en main | onglet réseau |
| Défilement | 60 ips sur CPU ralenti ×4 | profil |
| JS initial, page cliente `/[slug]` | **à mesurer en M05** avant de fixer un seuil | `npm run build` |

## J.3 — Les trois gains structurels

1. **Supprimer le flash desktop → mobile** (M25). Ce n'est pas une micro-optimisation :
   c'est le signal qui dit « navigateur » plutôt que « application ».
2. **Sortir les dispositions de JavaScript** (G.3) : un recalcul CSS au lieu d'un
   re-rendu React à chaque changement de largeur.
3. **Virtualiser les deux seules listes qui le méritent** — 143 blocs, 48 modèles.
   `grep` : **0** virtualisation aujourd'hui. À ne faire **que** si le profil le
   justifie, après M13 et M14 : virtualiser une liste de 48 éléments pour le
   principe ajoute un bug de défilement sans gain.

---

# PARTIE K — ACCESSIBILITÉ

## K.1 — L'acquis, à ne pas défaire

Trois gardes qui **mesurent réellement** existent déjà :
`e2e/ciblesAuPouce.spec.ts` (cibles, par `elementFromPoint`),
`e2e/contrasteDuTexte.spec.ts`, `e2e/siteAuClavier.spec.ts`.
Elles couvrent les pages **publiques** — d'où 10 cibles fautives là, contre 575
dans la zone connectée.

## K.2 — Travail

| Point | État mesuré | Action |
| --- | --- | --- |
| Cibles ≥ 44 px | 575 fautes en zone connectée | M03 (clôture) + M13–M17 |
| Contraste | garde publique verte | étendre aux 18 bancs — M26 |
| Clavier | garde publique verte | étendre au pilote — M26 |
| Lecteur d'écran | non vérifié | chaque SVG de statistiques reçoit un `aria-label` **énonçant la valeur** |
| `prefers-reduced-motion` | respecté par l'existant, à tenir | `MobileSheet` et segmenté — M06, M08 |
| Zoom 200 % | **non vérifié** | à ajouter au relevé |
| Orientation | un verrou de paysage a été retiré en juillet | **ne pas le réintroduire** |
| Taille de texte système | **non vérifié** | `rem` plutôt que `px` sur les écrans migrés |

## K.3 — Ce que je ne peux pas vérifier

VoiceOver et TalkBack ne se testent pas en Chromium. Les `aria-label` seront
posés et vérifiés par lecture du DOM ; l'**écoute réelle** appartient au lot M27.

---

# PARTIE L — CRITÈRES D'ACCEPTATION GLOBAUX

La refonte mobile est terminée quand **tous** ces points sont vrais, chacun
vérifiable par une commande ou une capture :

**Mesure**
- [ ] `audit-mobile/releve.json` existe pour la passe finale et pour la passe du 5 octobre
- [ ] chaque axe a baissé, et les chiffres sont dans le document final
- [ ] aucun plafond de garde n'a été relevé pour faire passer la suite

**Tactile**
- [ ] 0 commande sous 44 px sur les 18 bancs (de 575)
- [ ] 0 paire de commandes à moins de 8 px sur les écrans migrés (de 477)
- [ ] 0 texte sous 11 px (de 78)
- [ ] 0 corps de texte de plus de 60 caractères sous 13 px (de 183)

**Structure**
- [ ] 0 débordement horizontal (déjà vrai — à ne pas casser)
- [ ] 0 défilement imbriqué (déjà vrai — à ne pas casser)
- [ ] 4 ruptures de largeur en jetons, dette héritée chiffrée et décroissante
- [ ] aucune modale centrée rendue sous 640 px
- [ ] une seule implémentation de feuille montante dans le dépôt
- [ ] `primitivesGardees.test.ts` vert : chaque primitive est **utilisée**

**Comportement**
- [ ] le bouton retour du téléphone ferme la surface ouverte, sans quitter l'écran
- [ ] la position de défilement est restaurée au retour
- [ ] aucune disposition ne change après hydratation
- [ ] aucun bouton primaire masqué par le clavier, sur les 6 formulaires
- [ ] aucune action disponible uniquement au survol
- [ ] les 4 états de sauvegarde sont distinguables sans lire le texte

**Zones**
- [ ] `/[slug]` mesurée et corrigée
- [ ] éditeur : aperçu en mode, bloc réglé visible, clavier géré
- [ ] statistiques : vue d'ensemble → détail, aucun panneau supprimé
- [ ] Print Studio : typographie au plancher, export identique au pixel
- [ ] QR Studio : décision prise sur `?zero=1`

**Non-régression**
- [ ] desktop 1280 px : captures avant/après identiques sur chaque écran touché
- [ ] tablette 768 px vérifiée
- [ ] `npx vitest run` vert
- [ ] `npm run type-check` à 0 erreur
- [ ] `npm run build` à 0
- [ ] **aucune modification** de : sauvegarde, publication, quotas, permissions,
      URL de QR codes, moteurs purs de statistiques, de Print Studio ou de modèles

**Humain**
- [ ] pilote validé sur un iPhone réel avant la Phase 3
- [ ] `audit-mobile/SCENARIOS.md` rempli et passé sur iPhone + Android

---

# PARTIE M — ORDRE EXACT D'EXÉCUTION

Séquentiel. Chaque ligne se termine par les cinq commandes de H.0 avant de
passer à la suivante.

| # | Lot | Pourquoi à cette place |
| --- | --- | --- |
| 1 | **M01b** | sans lui, l'écran le plus décisif reste non mesurable |
| 2 | **M02** | tout le reste s'appuie sur les 4 ruptures |
| 3 | **M03** | la clôture avant les travaux : sinon ils se défont |
| 4 | **M06** | la primitive dont M04, M09, M19 dépendent |
| 5 | **M04** | les modales deviennent des feuilles |
| 6 | **M07** | un défilement, une position restaurée |
| 7 | **M08** | barre haute + segmenté |
| 8 | **M09** | lignes et menus d'action |
| 9 | **M20** | clavier — bloquant, et indépendant du reste |
| 10 | **M10** | pilote, partie 1 |
| 11 | **M11** | pilote, partie 2 |
| 12 | **M12** | **ARRÊT. Validation iPhone par l'utilisateur.** |
| 13 | **M13** | le pire écran : 55 cibles |
| 14 | **M14** | 34 cibles, 33 voisinages |
| 15 | **M15** | 22 cibles |
| 16 | **M16** | 0 adaptation, 3 068 lignes |
| 17 | **M17** | les cinq petits écrans, en un lot |
| 18 | **M05** | `/[slug]` — mesurer, puis corriger |
| 19 | **M18** | aperçu en mode |
| 20 | **M19** | barre contextuelle + propriétés |
| 21 | **M21** | QR Studio + décision `?zero=1` |
| 22 | **M22** | Print Studio |
| 23 | **M23** | états pressés, partout |
| 24 | **M24** | sauvegarde et publication |
| 25 | **M25** | auditabilité des dispositions (reclassé P2) |
| 26 | **M26** | accessibilité étendue |
| 27 | **M28** | dette mesurée |
| 28 | **M27** | scénarios pour appareils réels, puis passage humain |

**Pourquoi M05 (`/[slug]`) en 18ᵉ et non en 1ᵉʳ, alors qu'il est P0** — parce
qu'il a besoin des primitives pour être corrigé proprement, et parce que le
corriger avant la clôture M03 l'exposerait au même effacement que les primitives
de juillet. Sa **mesure** peut être avancée au rang 2 si l'utilisateur veut
savoir tout de suite : elle ne coûte qu'une ligne dans le relevé.

**Point d'arrêt unique** — rang 12. L'agent ne doit pas enchaîner la Phase 3 sans
la validation humaine du pilote. Partout ailleurs, il continue.

---

# VALIDATION ENTRE PHASES

```
   lot
    ↓
  type-check  →  vitest  →  relevé mobile  →  build
    ↓
  comparer releve.json à la passe précédente
    ↓
  captures 320 / 390 / 430 + capture desktop 1280
    ↓
  un axe a-t-il empiré ?  ── oui ──→  corriger, reprendre
    ↓ non
  consigner les chiffres dans audit-mobile/PROGRES.md
    ↓
  lot suivant
```

**Jamais** plus de deux lots sans relevé comparé. C'est ce qui a manqué en
juillet : vingt-trois corrections numérotées, aucune mesure cumulative, et
personne n'a vu la disparition.

---

# MASTER TODO

- [x] **M01** — Relevé instrumenté · P0 · **LIVRÉ le 5 oct. 2026** — + `e2e/avantLeJavascript.spec.ts` (ce que le HTML dit sans JS)
- [x] **M01b** — Réparer `/e2e-harness/onboarding` (HTTP 500) · P1 · **FAIT le 5 oct.** — + garde `e2e/bancsQuiDemarrent.spec.ts` qui découvre les bancs sur le disque
- [x] **M02** — Quatre ruptures + garde qui refuse les autres · P0 · **FAIT le 5 oct.** — `lib/ruptures.ts` + `ruptures.test.ts` (10) + `ruptureUnique.test.ts` (5, cliquet à 27) + `useIsMobile("md")`
- [x] **M03** — Étendre la garde des cibles à la zone connectée · P0 · **FAIT le 5 oct.** — 26 bancs découverts sur le disque, plafonds gelés à **285**, cliquet par écran + total
- [ ] **M04** — Modale centrée interdite sous 640 px → feuille · P1
- [ ] **M05** — `/[slug]` : mesurer et corriger la page cliente · P0
- [ ] **M06** — `MobileSheet` : promouvoir la feuille du builder · P0
- [ ] **M07** — `MobilePage` / `MobileSection` + restauration de scroll · P1
- [ ] **M08** — `MobileTopBar` + `SegmentedControl` · P1
- [ ] **M09** — `MobileListItem` + `ActionSheet` · P1
- [ ] **M10** — Pilote : statistiques, coquille / périodes / filtres · P1
- [ ] **M11** — Pilote : vue d'ensemble → détail (14 panneaux) · P1
- [ ] **M12** — Validation du pilote · P1 · **point d'arrêt**
- [ ] **M13** — Bibliothèque de blocs (55 cibles) · P0
- [ ] **M14** — Galerie de modèles (34 cibles, 33 voisinages) · P1
- [ ] **M15** — Messages (22 cibles) · P1
- [ ] **M16** — Profil (0 adaptation, 3 068 lignes) · P1
- [ ] **M17** — Réglages / Domaines / Redirections / Équipe / Médias · P2
- [ ] **M18** — Aperçu en mode, pas en destination · P1
- [ ] **M19** — Barre contextuelle + propriétés en feuille · P1
- [ ] **M20** — Clavier : `visualViewport` · P0
- [ ] **M21** — QR Studio + trancher `?zero=1` · P1
- [ ] **M22** — Print Studio : typographie (24 textes < 11 px) · P1
- [ ] **M23** — États pressés (165 `:hover` / 40 `:active`) · P1
- [ ] **M24** — Sauvegarde et publication lisibles · P1
- [ ] **M25** — Sortir les dispositions du JavaScript · P2 *(reclassé depuis P0)*
- [ ] **M26** — Accessibilité étendue à la zone connectée · P1
- [ ] **M27** — Scénarios pour appareils réels + passage humain · P1
- [ ] **M28** — Dette mesurée : `100vh`, `!important`, `z-index` · P2

---

# ÉVALUATION FINALE

| Domaine | État observé (mesuré) | État cible | Écart principal |
| --- | --- | --- | --- |
| **Structure** | 0 débordement, 0 scroll imbriqué sur 102 relevés | tenir ce niveau | aucun — à ne pas casser |
| **Navigation** | coquille `100dvh` + barre basse 5 entrées **existantes** | 3 modes, retour natif, position restaurée | la feuille sert à **1 écran sur 18** ; aucune restauration de scroll |
| **Tactile** | **285** cibles < 44 px en zone connectée, **10** en public | 0 partout | la garde couvre désormais les deux (M03) ; plafonds gelés, décroissants |
| **Typographie** | **78** textes < 11 px, **183** corps < 13 px | plancher 13 px tenu | Print Studio (24 + 14), statistiques (33), un paragraphe de 313 car. à 11 px |
| **Éditeur** | **4** cibles fautives sur 13 800 lignes | aperçu en mode, bloc visible, clavier géré | le travail de juillet y a **survécu** ; 3 manques précis |
| **Cohérence** | **27** seuils, **8 761** styles inline, **8** valeurs de `useIsMobile` | 4 ruptures, 25 à résorber | le style inline rend le responsive invisible et non auditable |
| **Performance** | pas de flash post-hydratation (déjà corrigé) ; le HTML servi porte la disposition de bureau ; **0** virtualisation | le HTML seul tient sur 390 px | disposition décidée en JS au lieu du CSS |
| **Accessibilité** | 3 gardes réelles, mais **publiques seulement** | les 3 étendues aux 18 bancs | zoom 200 % et lecteur d'écran **non vérifiés** |
| **App-like feel** | PWA déclarée, mouvement calibré, coquille en place | l'utilisateur oublie Safari | le flash d'hydratation, et la modale centrée |
| **Survie du travail** | **3 audits, 11 moteurs purs, 0 fichier restant** | chaque primitive a sa garde | **le vrai défaut du produit** |

## Les trois transformations structurantes

1. **Clôturer avant de construire.** `primitivesGardees.test.ts` et le plafond
   dégressif de M03 valent plus que n'importe quelle primitive : ils sont la seule
   différence entre cette refonte et les trois précédentes. Preuve chiffrée :
   10 cibles fautives là où une garde veille, 575 là où il n'y en a pas.

2. **Sortir le responsive du JavaScript.** 8 761 styles inline ont produit 27
   seuils de largeur et un HTML servi en version de bureau. Le pont est le jeton
   de densité (G.3) : progressif, réversible, et il fait tenir la page **avant**
   que le JavaScript arrive.

3. **Généraliser au lieu de réinventer.** La feuille, la barre contextuelle et la
   coquille mobile **existent** — enfermées dans le builder. Les promouvoir en
   primitives gardées coûte moins cher que de les réécrire, et c'est la seule
   manière de ne pas se retrouver avec dix-huit mécaniques différentes.

---

## ANNEXE — Ce que je n'ai pas pu vérifier

| Point | Blocage précis | Ce qu'il faudrait |
| --- | --- | --- |
| Rendu iOS réel (safe-area, clavier, `fixed`, inertie) | Chromium ne le reproduit pas | un iPhone, Safari, les scénarios de M27 |
| Rendu Android réel | idem | un Android, Chrome |
| INP / LCP / CLS **terrain** | CrUX exige du trafic réel ; PSI répond **429** sans clé | une clé PSI gratuite, ou 5 passages manuels sur `pagespeed.web.dev` |
| VoiceOver / TalkBack | non testables en Chromium | passage humain |
| Écrans connectés avec de **vraies** données | le projet Supabase de `.env.local` renvoie NXDOMAIN (vérifié) | un projet de développement joignable, ou les bancs suffisent |
| `/dashboard/onboarding` | banc d'essai en **HTTP 500** | M01b |
| Parcours de paiement | aucun paiement réel autorisé | compte de test Stripe |

Aucun chiffre de ce document ne provient d'une estimation. Les mesures sont dans
`audit-mobile/releve.json` et reproductibles par :

```bash
npx playwright test e2e/auditMobile.spec.ts --project=mobile
```
