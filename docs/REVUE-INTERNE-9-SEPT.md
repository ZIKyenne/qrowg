# Revue interne à froid — 9 septembre, après les lots v49 → v57

Même grille que la revue externe (écran par écran, sans compte + bancs d'essai du tableau de bord), mêmes règles : aucune fonctionnalité ajoutée ni retirée. Captures à 1440×900 et 390×844, 15 écrans, mesures automatiques (débordement, textes < 11 px, cibles < 32 px, dégradés, hauteur).

## Mesures

| Écran | Débordement | Textes < 11 px (PC / tél.) | Cibles < 32 px (PC / tél.) | Dégradés | Hauteur PC |
|---|---|---|---|---|---|
| Accueil | non | 92 / 92 | 31 / 4 | 99 | 10 030 px |
| Fonctionnalités | non | 47 / 47 | 3 / 3 | 21 | 4 548 px |
| Tarifs | non | 25 / 25 | 4 / 4 | 2 | 1 734 px |
| Connexion | non | 0 / 0 | 3 / 3 | 0 | 900 px |
| Modèles (/creer) | non | 9 / 9 | 9 / 1 | 16 | 1 520 px |
| Générateur | non | 0 / 0 | 11 / 9 | 4 | 2 717 px |
| Éditeur | non | 65 / 57 | 55 / 0 | 3 | — |
| QR vers un lien | non | 8 / 8 | 1 / 0 | 3 | — |
| Accueil connecté | non | 1 / 1 | 0 / 0 | 1 | — |
| QR de pages | non | 29 / 16 | 12 / 1 | 12 | — |
| Statistiques | non | 14 / 14 | 5 / 2 | 2 | 1 121 px |
| Messages | non | 1 / 1 | 18 / 18 | 0 | — |
| Médias | non | 1 / 1 | 0 / 0 | 0 | — |
| Paramètres | non | 2 / 2 | 0 / 0 | 0 | — |
| Atelier d'impression | non | 7 / 152* | 3 / 217* | 1 / 161* | — |

\* sur téléphone, la bibliothèque de supports reste dans le DOM hors écran : les compteurs la comptent, l'utilisateur ne la voit pas. À vérifier (`display:none` plutôt que hors champ) — c'est aussi du poids inutile.

Aucun tutoiement détecté. Aucune erreur de script sur les 30 captures.

## Notes (revue externe → maintenant)

| Zone | Avant | Maintenant | Ce qui reste |
|---|---|---|---|
| Direction artistique | 8,5 | 8,5 | L'accueil garde 99 dégradés (héros, cartes flottantes, boutons) alors que l'application est à plat : deux registres. |
| Accueil | 7,5 | 8 | 10 030 px, 10 sections, 7 appels à l'action. « Comment ça marche » (6 icônes) et « Tout ce qu'il faut pour convertir » se recouvrent ; FAQ de 12 questions ouvertes. |
| Connexion | 8 | 8 | Rien à signaler. |
| Tarification | 7 | 8,5 | 25 textes < 11 px (surtitres de groupes, mentions). |
| Modèles | 6 | 8 | Vignettes : mini-maquettes en dégradé (couleurs du modèle, assumé). |
| Éditeur | 6,5 | 8 | 55 cibles < 32 px sur PC (barre d'outils de bloc 24 px, boutons de catégories 30 px) ; trois niveaux d'onglets empilés (Éditer · Thème / Contenu · Style · Effets) ; « Business », « Event », 12 emojis de catégories ; texte 10–11 px dans la bibliothèque. |
| QR Studio (générateur) | 6 | 8,5 | 11 cibles < 32 px (pastilles de couleur 44 px OK, mais liens et « SVG » compacts). |
| Cohérence | 6 | 8 | Fonctionnalités : 6 libellés d'appel à l'action différents (« Créer gratuitement », « Ouvrir l'éditeur », « Créer mon QR code », « Voir mes statistiques », « Choisir un modèle », « Créer mon QRowg gratuit ») et « Freelance Pro » encore présent dans sa liste de modèles ; en-tête réduit (Tarifs, Connexion) contre 5 entrées sur l'accueil. |

## Backlog restant

### P1 — fait dans le lot v59
- [x] Accueil (`HomeClient.tsx`, `homeSections/*`) : fusionner « Comment ça marche » et « Tout ce qu'il faut pour convertir » en une section (les 6 icônes deviennent le sommaire des 6 cartes) ; FAQ repliée à 6 questions + « Voir les 6 autres » ; un seul appel à l'action par section ; dégradés des boutons et cartes flottantes ramenés à l'aplat d'accent (garder le seul dégradé du QR d'illustration). Cible : ≤ 7 500 px, ≤ 20 dégradés. **Mesuré : 7 475 px, 6 dégradés** (héros + tuile QR finale), 1 appel à l'action par section, en-tête partagé `components/EnTeteSite.tsx`.
- [x] Fonctionnalités (`features/page.tsx`) : un seul vocabulaire (« Composer ma page — sans compte » / « Créer mon QR code » / « Choisir un modèle ») pour les 6 boutons ; « Freelance Pro » → « Freelance » ; même en-tête que l'accueil (5 entrées) ; boutons à plat. **Mesuré : 0 dégradé, 4 524 px.**
- [x] Éditeur (`BuilderV4.tsx`, `types.ts`) : catégories « Business » → « Entreprise », « Event » → « Événement » ; barre d'outils de bloc et boutons de catégories à 32 px minimum sur PC ; textes de la bibliothèque ≥ 12 px ; réunir « Éditer · Thème » et « Contenu · Style · Effets » (le thème devient un quatrième onglet, ou une entrée du rail) pour n'avoir qu'un niveau d'onglets. **Fait : Contenu · Style · Effets · Page ; 0 cible < 32 px sur PC ; catégories de thèmes lues en français (Entreprise, Luxe, Créateur, Sport, Événement, Musique, Signature QRowg).**
- [x] Atelier d'impression sur téléphone (`PrintStudioClient.tsx`) : bibliothèque hors écran → non rendue tant qu'elle n'est pas ouverte. **Fait : feuille démontée 360 ms après fermeture, entrée animée ; mesuré 0 texte / 0 cible hors écran.**

### P2 — fait dans le lot v60
- [x] Tarifs : surtitres de groupes et mentions à 11 px minimum. **Mesuré : 0 texte < 11 px, 0 cible < 32 px.**
- [x] QR de pages : 29 textes < 11 px (étiquettes de la colonne de gauche, sous-titres des sections). **Mesuré : 0 / 0, y compris dans les panneaux Intermédiaire et Expert.**
- [x] Générateur : lien « Créez-en un » et bouton « SVG » à 40 px de haut. (« Voir la démo » → « Tester le générateur de QR », fait en v59.) **Fait : « Créez-en un » 40 px dans l'atelier, fil d'Ariane et maillage à 32 px, bouton principal à plat.**
- [x] Messages : les 18 cibles < 32 px sont les segments de statut (28 px) → 32 px. **Fait : vrai segmenteur (piste, segment actif souligné d'accent), `role="radiogroup"` / `aria-checked`, 32 px.**

### Deux règles, désormais tenues par un test
`app/lisibiliteEtCibles.test.ts` : **aucun texte lu sous 11 px, aucune cible sous 32 px**. Les maquettes — vignette « ANALYTICS · EXEMPLE » de l'accueil, mini-téléphone des cas d'usage, mini-aperçus de modèles, scène d'aperçu de QR de pages, vignettes de supports de l'atelier — dessinent un rendu à l'échelle : elles sont nommées une par une dans le test, et le jour où l'une disparaît sa dispense saute avec elle.

Balayage après ce lot (1440×900 et 390×844, 14 écrans du produit) : 0 texte < 11 px et 0 cible < 32 px partout, sauf les 44 textes des maquettes de l'accueil et de Fonctionnalités, qui sont des dessins.

## Lot v61 — les maquettes rejoignent la règle

Les 44 textes restants étaient dans des **maquettes d'illustration** : la vignette « ANALYTICS · EXEMPLE » de l'accueil, les maquettes d'éditeur et de statistiques de la page Fonctionnalités, le mini-téléphone des cas d'usage. Elles ont été redessinées plutôt que dispensées :

- Vignette de statistiques de l'accueil : quatre panneaux de quatre lignes → trois panneaux de trois lignes, tout à 11 px, et sur téléphone les indicateurs passent en 2×2 et les panneaux s'empilent au lieu de rapetisser. « Réseaux soc. » redevient « Réseaux ».
- Fonctionnalités : maquettes d'éditeur et de statistiques à 11 px, la pastille « LIVE » de 7 px devient un état lisible, la légende du QR dessiné passe de 8 à 11 px.
- Cas d'usage : le bouton du mini-téléphone passe de 8,5 à 11 px.
- Éditeur : barre du haut, bandeau du canvas, étiquette de bloc, « Propriétés », mention « bouton sans lien », panneaux de style — tout à 11 px ; interrupteurs et rangées de styles à 32 px ; le compteur de 7 px sur les icônes de catégories est retiré (l'infobulle le porte déjà).
- Aperçu de modèle : l'interface de la modale passe à 11 px, et « Temps de setup » devient « Prêt en ».
- Barre du bas sur téléphone : libellés à 11,5 px.

Il ne reste dispensés que les **rendus à l'échelle** — la page du client telle qu'elle sera publiée (canvas de l'éditeur, téléphone de l'aperçu de modèle) et le support imprimé tel qu'il sortira (scène de QR de pages, vignettes de l'atelier). Les agrandir mentirait sur le rendu. Le test les nomme un par un, avec la frontière exacte dans le fichier, et vérifie que cette frontière existe encore.

### Balayage à froid après v61 (1440×900 et 390×844)

| Écran | Textes < 11 px | Cibles < 32 px | Dégradés | Débordement | Hauteur PC |
|---|---|---|---|---|---|
| Accueil | 0 / 0 | 0 / 0 | 6 | non | 7 503 px |
| Fonctionnalités | 0 / 0 | 0 / 0 | 0 | non | 4 416 px |
| Tarifs | 0 / 0 | 0 / 0 | 2 | non | 1 760 px |
| Connexion | 0 / 0 | 0 / 0 | 0 | non | 900 px |
| Modèles (/creer) | 0 / 0 | 0 / 0 | 16 | non | 1 521 px |
| Générateur | 0 / 0 | 0 / 0 | 3 | non | 2 759 px |
| QR vers un lien | 0 / 0 | 0 / 0 | 3 | non | — |
| Éditeur (4 onglets) | 0 | 0 | — | non | — |
| Aperçu de modèle | 0 (hors rendu) | 0 | — | non | — |
| Accueil connecté | 0 / 0 | 0 / 0 | 1 | non | — |
| QR de pages | 0 / 0 | 0 / 0 | 12 | non | — |
| Statistiques | 0 / 0 | 0 / 0 | 2 | non | 1 126 px |
| Messages | 0 / 0 | 0 / 0 | 0 | non | 936 px |
| Médias | 0 / 0 | 0 / 0 | 0 | non | 900 px |
| Paramètres | 0 / 0 | 0 / 0 | 0 | non | 916 px |
| Atelier d'impression | 0 / 0 | 0 / 0 | 1 | non | 900 px |

Aucune erreur de script sur les 32 captures. Les 16 dégradés de la galerie de modèles sont les mini-aperçus colorés des modèles (le dessin du modèle lui-même), les 12 de « QR de pages » ses vignettes de supports.

## Ce qui reste

Les deux backlogs P1 et P2 de la revue interne sont vidés. Les prochains chantiers ne sont plus des corrections mais des choix : contenu (la page Exemples, les guides), conversion (ce que dit le héros, l'ordre des sections), et le fond de l'offre.

## Critères de fin, état

1. Héros visible immédiatement : **oui** (v49, v50).
2. Aperçus de modèles souris / clavier / tactile : **oui** (v49).
3. Mêmes plans, catégories et termes partout : **oui**, gardes `nomsDesPlans`, `passeEditoriale`, `categorieLue`.
4. QR Studio sans défilement à 1440 / 1536 / 1920 : **oui** (v51).
5. Éditeur compréhensible à l'ouverture, aucun réglage visuel dans Contenu : **oui** (v50).
6. Aucun mélange tutoiement / vouvoiement ni français / anglais : **oui sur ce qui est lu**, sauf « Business » / « Event » de la bibliothèque de blocs (P1).
7. Tous les visuels QR ont un secours : **oui** (v50).
8. Mobile 375 / 390 / 430 sans défilement horizontal, action à portée de pouce : **oui** (v54, 32 écrans).


## Lot v62 — les exemples deviennent de vraies pages

La page Exemples montrait six entreprises inventées — « Brasserie Le Moulin », « Thomas Dupont · Dev » — avec des aperçus dessinés qui ne s'ouvraient sur rien. Un visiteur venu voir à quoi ressemble une page QRowg repartait sans en avoir vu une seule, et le site affichait des clients qui n'existent pas.

Désormais la page liste les **34 modèles réels** du produit (`page-templates.ts`, la même source que la galerie et l'éditeur), filtrables par métier, et chacun s'ouvre sur `/examples/<clé>` : la page rendue par le **moteur public**, celui de la page d'un client publiée. Bandeau permanent « Page de démonstration — les textes et les photos sont des exemples » (sur téléphone, c'est le nom du modèle qui s'efface, jamais la mention), bouton « Utiliser ce modèle » vers la galerie déjà filtrée, et `noindex` : une fiche « Le Bistrot Parisien » dans Google laisserait croire à un établissement réel.

### Ce que les 34 démonstrations ont révélé

Ouvrir la page publiée dans 34 variantes a montré ce qu'aucun écran d'administration ne montrait : **la page publiée elle-même descendait à 7 px** par endroits — badges de produit, marqueur « aujourd'hui » des horaires, titres de formules, mention « Créé avec QRowg ». C'est la page que le client fait scanner à ses propres clients.

Le moteur partagé applique une échelle : dans le canvas de l'éditeur elle rapetisse le rendu, ce qui est légitime ; mais la taille de **référence** est celle du public. Elle est désormais à 11 px minimum dans les 4 blocs legacy et les 18 blocs partagés concernés, et le test vérifie les trois écritures possibles (`fontSize`, `sz(u, n)`, `Math.round(n * scale)`) sur l'ensemble du catalogue de blocs.

Balayage : **34 pages de démonstration sur téléphone, 0 texte < 11 px, 0 cible < 32 px, aucun débordement, aucune erreur de script**, bandeau présent partout. Hub à 0 / 0 aux deux tailles.


## Lot v63 — le produit n'écrit plus la preuve à la place de l'utilisateur

En ouvrant les 34 pages de démonstration du lot précédent, on a lu ce que les modèles écrivaient pour le client : « Marie L. — La meilleure entrecôte de Paris », « Sarah M., CEO — MVP livré en 6 semaines », « 4,9/5 sur 312 avis », « +1 200 clientes et clients fidèles », « Assurance RC Pro », « Artisan certifié RGE ».

Quelqu'un qui découvre QRowg prend un modèle, remplace le nom et l'adresse, publie — et diffuse des avis fabriqués signés de prénoms inventés, une note qu'il n'a pas reçue, une assurance qu'il n'a peut-être pas. Le produit lui faisait écrire un mensonge sans qu'il s'en rende compte, et l'exposait à ses propres clients.

**La règle posée** : le pré-remplissage donne la *structure* et le *titre* — l'emplacement — jamais l'*affirmation*. Dans les 34 modèles et les 9 recettes de la création guidée, les champs de preuve arrivent vides : avis et notes (`testimonials`, `video_testimonials`, `google_review`), chiffres d'activité (`stats_block`, `stat_hero`, `avatar_row`), murs de marques (`logo_marquee`, `logo_wall`, `partners`), badges de conformité (`trust_badge`, `business_certifications`). Les titres restent : « Ils nous recommandent » invite à remplir, n'affirme rien.

Le bloc vide ne publie rien (vérifié : aucun cadre fantôme sur les 34 démonstrations), et l'éditeur dit quoi y mettre — « Collez ici un avis reçu », « Votre chiffre qui compte », « Vos partenaires, vos marques », « Ajoutez une vidéo de client » — avec la mention « Invisible en ligne tant qu'il est vide ». Cinq types ont rejoint la doctrine de l'état vide ; pour trois d'entre eux l'adapter éditeur a été sorti dans son propre fichier, l'état vide étant du code d'édition qui n'a rien à faire dans le bundle de la page publiée.

Garde `app/preuveNonInventee.test.ts` : elle lit modèles et recettes bloc par bloc, champ par champ, et refuse toute affirmation pré-remplie.

Au passage : banc d'essai de la création guidée (`/e2e-harness/onboarding`), enfin mesurable — 0 texte < 11 px, 0 cible < 32 px aux deux tailles.


## Lot v64 — le premier écran après « Utiliser ce modèle »

Suite du précédent, en suivant cette fois le parcours réel dans l'éditeur : barre du haut → **Modèles** → *Bistrot français* → **Appliquer**. L'écran d'après affichait une **carte Google morte** — un grand cadre gris avec une icône d'image cassée. Le modèle plaçait l'établissement au « 12 rue de la Paix, 75001 Paris ». Une adresse réelle, qui appartient à quelqu'un d'autre. **Vingt-et-un modèles** en avaient une (Paris, Reims, Cannes, Versailles). Quelqu'un qui publie sans la changer envoie ses clients chez un inconnu, et fait apparaître son commerce à une adresse qui n'est pas la sienne.

Même règle que pour les avis : les adresses arrivent vides, l'assistant de modèle les demande (il le faisait déjà), et le bloc carte affiche « Ajoutez une adresse » au lieu d'une carte morte — en éditeur comme dans le renderer partagé. Trois boutons pointaient aussi vers une page de service nue (`calendly.com`, `open.spotify.com`) : vidés, donc signalés comme boutons sans lien.

**Ce qui referme la boucle** : l'encadré près de « Publier » ne listait que les boutons sans lien. Il liste maintenant aussi les blocs encore vides. Sur le modèle Bistrot appliqué tel quel, il annonce « 3 éléments ne seront pas publiés » — le bouton de réservation sans lien, le bloc d'avis, la carte — chaque ligne cliquable menant au bloc concerné. L'utilisateur sait ce qui manque avant de publier, au lieu de le découvrir en ligne.

Vérifié dans le navigateur sur le parcours complet, et sur les 34 pages de démonstration : aucune régression, aucun bloc fantôme.


## Lot v65 — la fin du parcours, et la promesse du début

**Après « Publier ».** L'écran de première mise en ligne n'avait jamais été regardé isolément, faute de pouvoir l'ouvrir sans compte ni page publiée. Il a désormais son banc d'essai (`/e2e-harness/publication`, avec `?metier=` et `?tel=1`), et il tient : il marque le moment, donne l'adresse copiable, puis dit d'abord de **tester le QR avec son téléphone** — avant de proposer d'imprimer quoi que ce soit —, ensuite propose les supports, enfin dit où poser, avec un conseil par métier (« sur les tables et à côté de la caisse »). L'ordre est le bon : imprimer deux cents flyers avec un QR jamais scanné est l'erreur qui coûte cher. Deux finitions seulement : les descriptions de supports passent de 10,5 à 11,5 px et le bouton « Copier » à 32 px.

**Le héros.** Son second bouton menait au générateur de QR — un outil annexe, qui a sa propre section plus bas. Il mène maintenant à `/examples` : « Voir une page en vrai ». Depuis le lot v62, cette page ouvre 34 pages réelles rendues par le moteur public ; c'est la réponse à la question que pose le héros, et c'est ce qu'un visiteur veut voir avant de se lancer. La promesse et la preuve sont enfin reliées.

Accueil re-mesuré après le changement : 0 texte < 11 px, 0 cible < 32 px, aux deux tailles.


## Lot v66 — ce que l'écran affirme quand il ne sait rien

Les lots précédents ont retiré du produit les affirmations que **l'utilisateur** aurait publiées sans le vouloir : faux avis, fausses notes, adresses qui ne sont pas les siennes. Restait celles que **le produit lui-même** lui adressait.

**Les statistiques, vues par un compte qui vient de publier.** Le banc d'essai existait pour un compte mûr (169 scans) ; il monte maintenant aussi le compte du début — une page, trois scans, quatre vues (`/e2e-harness/statistiques?debut=1`). Ce que l'écran lui disait :

> « Votre trafic augmente. » — « **+100 %** contre hier (0) » — « 3 scans sur 30 jours, surtout via **QR code** sur **mobile** · pic d'activité vers **0h** » — et le graphique titrait « pic · **1 scans** le 8/9 ».

Aucune de ces quatre phrases n'était vraie. Passer de 0 à 2 n'est pas +100 % : c'est une division par zéro. Une source « dominante » et une « heure de pic » sur trois événements sont des conclusions tirées d'un échantillon qui n'en autorise aucune. Et « 1 scans » désignait le premier jour du tableau, faute de pic réel.

La règle est posée dans un module pur, `analytics/lectureHonnete.ts`, testable seul : au-dessous de **vingt événements** sur la période, on donne les faits bruts et le geste utile ; au-dessus seulement, on interprète. `evolutionJournaliere` rend `null` quand la veille est à zéro — et la carte dit alors « hier : rien » au lieu d'afficher un pourcentage ; `picLisible` exige un maximum **unique et supérieur à 1** avant de désigner un jour de pic ; `creneauHoraire` écrit « entre 14 h et 15 h » plutôt que « 14h » ; `pluriel` fait l'accord aux quatre endroits où il était fait à la main. Le même écran affiche désormais :

> « Vos premières mesures arrivent. » — « 3 scans et 4 vues sur 30 jours. C'est encore trop peu pour en tirer une tendance. » — « Partagez votre QR sur vos réseaux et imprimez-le : c'est ce qui fait venir les premiers scans. »

Le compte mûr, lui, garde sa lecture complète : tendance, source, appareil, créneau de pic, conseil d'optimisation. Rien n'a été retiré — l'interprétation attend simplement d'avoir de quoi s'appuyer.

**Le retour, trois jours plus tard.** Même exercice sur l'accueil connecté, qui n'avait de banc d'essai que pour trois pages et 507 vues (`?debut=1` le monte maintenant avec une page publiée il y a trois jours). Le conseil affiché était : « Créez une 2ᵉ page pour un autre usage (menu, événement, promo). » Il était piloté par `pages.length === 1` — un compte d'objets, pas une situation. Or sa première page ne tourne pas encore : lui en faire fabriquer une deuxième double le travail non rentabilisé et retarde le seul geste qui compte, sortir le QR du logiciel et le mettre devant des gens.

`dashboard/prochaineEtape.ts` tranche sur la situation : page publiée et moins de dix scans → **diffuser** (« Votre page est en ligne : montrez son QR code à vos clients — vitrine, comptoir, réseaux. ») ; page qui tourne et seule → **élargir** (le conseil d'origine) ; plusieurs pages qui tournent → **imprimer** (le support, inchangé).

Gardes : `analytics/lectureHonnete.test.ts` (14 cas sur le module pur), `analytics/statistiquesHonnetes.test.ts` (9 cas qui vérifient que l'interface s'y branche vraiment au lieu de refaire le calcul dans son coin), `dashboard/prochaineEtape.test.ts` et `dashboard/retourAccueil.test.ts`. Chacune vérifiée par injection du défaut d'origine.

Les deux écrans re-mesurés aux deux tailles, dans les deux états : 0 texte < 11 px, 0 cible < 32 px, aucun `NaN`, aucun débordement.


## Lot v67 — la règle avait une liste, pas un périmètre

Depuis le lot v60, deux règles de maison tiennent : aucun texte lu sous 11 px, aucune cible sous 32 px. Elles étaient vérifiées « sur les écrans du produit ». Sauf que « les écrans du produit » était **une liste de vingt noms écrite à la main** — et une liste ne signale jamais ce qui lui manque.

Trois écrans n'y avaient jamais figuré : **Domaines**, **Redirections**, **Équipe**. Et leur état vide — celui que traverse tout compte neuf — n'avait jamais pu être monté, faute de banc d'essai. Mesuré une fois le banc écrit (`?vide=1` sur Messages, Équipe, Domaines, Redirections) :

- Domaines : les quatre numéros du guide « Comment ça fonctionne ? » à **10 px**, le lien d'ouverture du site et « Vérifier DNS » à **28 et 26 px**.
- Redirections : « Total », « Actives », « Inactives », « Clics total » et l'aperçu d'URL à **10 px** ; les trois boutons d'action de chaque ligne à **28 px**, à côté d'un bouton Supprimer de 40.
- Équipe : les deux menus de rôle à **30 px**.

**Le correctif de fond** : le périmètre n'est plus une liste mais un **arbre**. La garde marche tout `dashboard/`, tout `homeSections/`, plus les écrans publics nommés — 150 fichiers au lieu de 20. On n'en sort que par une dispense écrite, avec sa raison, et le test vérifie que chaque dispense désigne un fichier ou un dossier qui existe. Ajouter un écran ne demande plus de penser à l'inscrire : il est couvert dès qu'il existe. 146 textes ont été relevés dans 34 fichiers.

**Ce que l'arbre a trouvé en plus.** La dispense de l'atelier d'impression disait « au-delà de la ligne 2200 » — mais rien ne le vérifiait, et le fichier entier échappait donc à la règle. Bornée pour de vrai, elle a révélé la moitié haute de l'écran : champ de recherche des supports haut de **14 px**, six puces de métier à 28, « + 19 métiers » à 26, neuf libellés d'interface entre 8,5 et 10 px. Trois miniatures trichaient aussi avec du texte minuscule — la maquette d'éditeur de l'accueil du builder (« Aperçu » à 6,5 px, « Publier » à 7,5), la coche d'un badge de profil dessinée avec la lettre « v » à 7 px, la pastille « PRO » d'un motif verrouillé à 7,5 px : les deux premières sont devenues des formes et une icône, la troisième se lit.

**Le bug trouvé en chemin.** Sur un compte sans domaine connecté, le formulaire de redirection initialisait sa source à `userDomains[0] ?? ""`. Le menu déroulant, lui, contient toujours l'option de repli « qrowg.com (sous-domaine) » — et un `<select>` dont la valeur ne correspond à aucune option affiche sa première. L'utilisateur lisait donc **« qrowg.com » dans le champ**, pendant que l'aperçu juste en dessous annonçait **« → URL source : /chemin »** et que l'enregistrement serait parti avec un domaine vide. `redirects/sourceParDefaut.ts` tranche : la valeur proposée existe toujours parmi les options. Ce que l'écran montre est ce qu'il retiendra.

Gardes : `app/ecransOublies.test.ts` (12 cas) et la réécriture de `app/lisibiliteEtCibles.test.ts` autour de l'arbre (150 cas), plus `redirects/sourceParDefaut.test.ts`. Vérifiées par injection : remettre la liste à la place de l'arbre, les boutons à 28 px, ou `?? ""` dans le formulaire fait échouer la garde correspondante.

Re-mesuré au navigateur sur les treize bancs d'essai, deux tailles, états plein et vide : **0 texte < 11 px, 0 cible < 32 px** — hors les vignettes de supports imprimés, qui restent dispensées et le disent.


## Lot v68 — les couleurs que le produit impose sur la page du client

Deux règles de maison tenaient : la taille du texte et la taille des cibles. Il en manquait une, et c'est celle qui décide si un texte est lu ou non : le **contraste**. Balayage au navigateur des 34 pages de démonstration, rendues par le vrai moteur public, avec le calcul WCAG sur les couleurs réellement composées. Trois familles de fautes, **toutes du fait du produit**, aucune du fait du client.

**1. Le bleu du navigateur.** Des liens de la page publiée n'avaient aucune couleur déclarée : ils sortaient en `#0000EE`, la valeur par défaut héritée de Mosaic — 1,8 à 2,1 : 1 sur les thèmes sombres, illisible, et sur tous les autres la seule couleur de la page que le client n'a pas choisie. C'était le cas des liens de streaming, des liens favoris et des réseaux sociaux, c'est-à-dire précisément ce qu'un commerçant met sur sa carte. Une ligne le referme : `.qf-public a { color: inherit; }` — le lien prend la couleur de son parent, et les blocs qui en veulent une la posent.

**2. Les couleurs de sens, écrites pour un fond noir.** « Ouvert · ferme à 19h », « Nouveaux patients acceptés », « Produits bio », les ✓ et ✕ d'un tableau comparatif : leurs couleurs (`#39FF8F`, `#FF6B6B`, l'or `#C9A84C`) sont écrites en dur dans le produit. Elles ont été choisies pour le fond noir de QRowg et sortaient telles quelles sur un thème que le client, lui, a choisi clair. Mesuré : **1,1 : 1** pour le badge d'ouverture sur le modèle Cabinet, 1,17 pour le badge de profil, 1,9 pour l'or. Le client ne pouvait pas le voir — son aperçu est à l'échelle, et l'œil complète — mais son client à lui, devant la vitrine, avait un badge blanc sur blanc.

`builder/couleurLisible.ts` (module pur) calcule le rapport réel, puis **conserve la teinte et déplace la clarté** jusqu'au seuil : le vert « ouvert » reste vert, en plus sombre. Le contexte de rendu expose `lisible()` aux blocs, exigeant le seuil sur le fond **et** sur la carte — les deux existent sur le même écran — avec une marge pour le voile translucide que les badges posent eux-mêmes (viser 4,5 pile donnait 4,48 à la mesure). Sur les thèmes sombres, rien ne bouge : une couleur déjà lisible n'est pas retouchée.

**3. L'encre des boutons, supposée blanche.** `textOn` décidait par une estimation — luminance > 0,45 → encre sombre, sinon blanc — et se trompait sur toute la bande intermédiaire. Sur la terracotta du modèle Pizzeria (`#E2603F`), elle choisissait le blanc : **3,5 : 1**, quand le noir donnait 6,0. On ne devine plus, on calcule les deux rapports et on garde le meilleur. Une seule fonction changée, et tous les blocs qui posent du texte sur une couleur sont corrigés d'un coup : Pizzeria passe de 13 textes fautifs à 0, Cabinet de 11 à 0, Artiste de 8 à 0.

**Ce que le produit ne corrige pas, il le dit.** Restent les couleurs que le client choisit lui-même dans son thème — « 80 € » à 2,9 : 1 sur le modèle Institut, « Envoyer ma demande » à 2,3 sur Artisan. Les réécrire en silence serait pire : il a choisi ce rose, il le verrait rose dans l'éditeur et autrement en ligne. L'encadré près de « Publier » — qui listait déjà les boutons sans lien et les blocs vides — porte maintenant aussi le thème : « la couleur d'accent se lit mal sur le fond (2,9 : 1 — il en faut 4,5) », chaque ligne ouvrant le panneau de thème. `builder/themeLisible.ts` signale aussi le cas où **aucune encre** ne passe sur la couleur d'accent : là, seule la couleur peut changer, et c'est au client de décider.

Gardes : `builder/couleurLisible.test.ts` (14 cas sur le calcul et la correction), `builder/themeLisible.test.ts` (5), `app/contrastePagePubliee.test.tsx` (12, dont deux qui rendent l'encadré et vérifient qu'il apparaît — et qu'il disparaît quand le thème tient).

Reste mesuré, et assumé : quelques textes posés sur une photo de bandeau (le calcul ne voit pas l'image) et des titres en dégradé découpé (`-webkit-text-fill-color: transparent`), que la mesure ne sait pas lire ; et les couleurs de thème du client, désormais signalées plutôt que corrigées. Les deux règles précédentes n'ont pas bougé : 0 texte < 11 px, 0 cible < 32 px sur les bancs d'essai.


## Lot v69 — quand le produit demande de l'argent

Nouvelle mesure, celle du **poids visuel** : pour chaque bloc d'action d'un écran, sa surface multipliée par l'écart de clarté entre son fond et celui de la page. C'est une approximation de ce qui saute aux yeux en premier. Appliquée à l'accueil connecté d'un compte gratuit de trois scans — le banc d'essai du lot v66 :

```
poids 7   « Voir les offres »       ← l'encart payant
poids 3   « Nouvelle page »
poids 3   « Voir mon QR code »      ← l'étape utile du moment
```

L'élément le plus fort de l'écran, pour quelqu'un qui a publié sa première page il y a trois jours et reçu trois scans, était la demande d'argent. Elle valait plus que les deux gestes utiles réunis. Sa condition d'affichage tenait en un test : `profile?.plan === "free"`. Tous les jours, dès le premier, jusqu'au paiement.

**Et elle ne disait pas la vérité.** L'encart annonçait « 10 pages, vues illimitées, QR personnalisés, sans branding ». Or `plans.ts` donne `views: null` aux **trois** plans : les vues sont illimitées partout, y compris en gratuit — et l'écran l'écrit lui-même deux cartes plus haut, « Vues ce mois · 4 · illimitées ». Le produit vendait comme un avantage quelque chose que l'utilisateur avait déjà, sur le même écran, à quinze centimètres.

C'est la même faute que les avis inventés du lot v63, retournée : là, le produit faisait écrire un mensonge au client ; ici, il en écrivait un pour son propre compte.

**Deux règles, dans `dashboard/offreUtile.ts` (module pur).**

`raisonDeProposer` : l'offre attend d'avoir une raison. Un QR qui tourne (trente scans) en est une — « plus » veut alors dire quelque chose. Détenir plus de pages que son plan n'en garde en ligne en est une — le compte est vraiment bloqué. Occuper sa limite n'en est pas une : quelqu'un qui a la seule page à laquelle il a droit et n'a jamais demandé la deuxième n'est bloqué par rien ; le moment où il bute, c'est quand il clique « Nouvelle page », et c'est là que l'offre a sa place, pas sur son accueil tous les matins. Un compte payant n'est jamais relancé.

`avantagesEnPlus` : ce que le plan cible apporte est **calculé sur `plans.ts`**, jamais écrit à la main. Une capacité que les deux plans possèdent n'apparaît pas — les vues illimitées ont disparu de la liste toutes seules. Au passage, le champ `team` cachait un piège : `null` n'y veut pas dire « illimité » comme pour les autres limites, mais « pas d'équipe du tout », et le traiter comme une limite faisait annoncer « places d'équipe en illimité » sur un plan qui n'a pas la fonction.

L'accroche dit désormais pourquoi on en parle — « Votre QR tourne — voici ce que le plan supérieur ajoute » — au lieu de « Passez à Établissement », et le bouton passe de l'aplat d'or au bouton neutre.

**Mesuré après.** À trois scans, l'encart n'est plus là : les deux éléments les plus forts de l'écran sont les deux gestes utiles. À soixante-quatre scans (nouvel état de banc d'essai, `?debut=2`), il revient — poids **0** : présent, lisible, et sous les gestes utiles. De 7 à 0.

Gardes : `dashboard/offreUtile.test.ts` (11 cas sur les deux règles) et `dashboard/offreMesuree.test.ts` (8 cas sur le branchement et le relevé), vérifiées par injection — remettre `plan === "free"` comme seule condition, ou la liste écrite à la main, fait échouer la garde.


## Lot v70 — ce que la grille tarifaire promet

Le lot précédent a réparé la façon dont le produit demande de l'argent sur le tableau de bord. Restait la page où on le lui donne. Relevé du 11 septembre, en lisant la grille ligne à ligne contre le code.

**« Génération IA + rapports », vendue pendant que l'éditeur la cache.** La fonction n'existe que si `ANTHROPIC_API_KEY` est définie au moment du build : `next.config.mjs` en dérive `NEXT_PUBLIC_GENERATION_IA`, et l'éditeur le respecte — sans clé, il ne montre pas le panneau. La grille tarifaire, elle, ne consultait jamais ce drapeau. Sans clé configurée, le produit **cachait dans l'éditeur ce qu'il vendait à 19 €/mois** sur la page d'à côté, et le mentionnait encore une troisième fois, barrée, dans la colonne gratuite — ce qui laissait croire qu'elle existait ailleurs.

**« Support prioritaire », sur les deux plans payants.** Zéro occurrence ailleurs dans le dépôt. Rien, nulle part, ne distingue un ticket prioritaire d'un autre : ni file, ni étiquette, ni délai annoncé. Ligne retirée des deux plans.

**Deux listes écrites à la main.** Les promesses vivaient dans `lib/plans.ts` (pour `/upgrade`) et dans `homeSections/Pricing.tsx` (pour l'accueil), sans lien entre elles — et elles avaient déjà divergé : l'accueil ne mentionnait pas la génération IA que `/upgrade` vendait. Deux sources de vérité sur ce qu'on vend, c'est une de trop.

**La règle posée.** Toute promesse cochée porte une **preuve** : un champ de son propre plan (`limits.pages`, `caps.printStudio`…) ou un fichier du produit (`produit:app/[slug]/page.tsx`). `app/promessesTenues.ts` la résout — une capacité à `false` sur ce plan, une clé inventée, une limite à zéro ne prouvent rien — et la garde vérifie qu'aucune ligne n'en est dépourvue et qu'aucune preuve `produit:` ne pointe vers un fichier absent. La prose de l'accueil reste libre (il ne parle pas comme une fiche technique), mais chaque bénéfice qu'il affirme porte la même preuve et passe le même contrôle.

La garde a d'ailleurs attrapé deux de mes propres approximations en la posant : « Branding QRowg visible » n'est pas adossé à une capacité mais à ce que la page publiée affiche, et les lignes *non* incluses devaient elles aussi porter leur identité pour être filtrées comme les autres.

**Vérifié au navigateur, dans les deux sens.** Build sans `ANTHROPIC_API_KEY` : aucune occurrence de « Génération IA » sur `/upgrade`, et aucune de « Support prioritaire ». Build avec la clé : les trois lignes reviennent, à leur place. La grille se comporte enfin comme l'éditeur.

Gardes : `app/promessesTenues.test.ts` (14 cas — une par plan sur les preuves, les fichiers cités, le filtrage de l'IA, le branchement réel de la page et la cohérence de l'accueil), vérifiée par injection : remettre une promesse sans preuve, ou retirer le drapeau du branchement, fait échouer la garde correspondante.


## Lot v71 — les phrases que le serveur envoie ne sont pas pour le commerçant

En marchant la création guidée sur son banc d'essai, au moment où elle génère la page, l'écran a affiché ceci, en haut, seul :

> Non authentifie

Pas d'accent, pas de ponctuation, pas de geste à faire — et le même écran derrière, avec les mêmes boutons. C'est la chaîne que renvoie la route, montrée telle quelle par `setErr(d.message || d.error || …)`.

Ce n'était pas un cas isolé. **Vingt-trois endroits dans douze fichiers** affichaient le champ `error` d'une réponse sans le traduire — alors que `lib/erreurLisible.ts` existe depuis le lot v55 pour exactement cela, avec pour règle « jamais de détail technique ». La traduction existait ; elle n'était simplement pas branchée sur ce chemin-là.

Et ce que les routes mettent dans ce champ n'a jamais été écrit pour être lu. Compté sur l'ensemble de `app/api` : **« Non authentifié » 48 fois**, « id requis » 10, « QR introuvable » 10, « Erreur serveur » 6, « limit », « domain requis », « qr_id requis ». Ce sont des codes déguisés en français — utiles dans un journal, illisibles sur un écran.

**La règle posée**, dans `lib/messageDeRoute.ts` (module pur) : une chaîne venue d'une route n'est montrée que si elle a été **écrite pour être lue** — une vraie phrase, avec un espace et une ponctuation finale. « Réservé au propriétaire / admin. » passe ; « Non authentifié », « id requis », « limit » ne passent pas. Sinon, on prend la phrase du produit qui correspond au code HTTP : 401 → « Votre session a expiré. Reconnectez-vous puis réessayez. », 403 → les droits, 404 → l'objet, 429 → la patience, 5xx → la panne, et le réseau muet a la sienne. Un écran qui a sa propre phrase (« La redirection n'a pas pu être enregistrée. ») la garde pour les causes banales, mais pas pour une session expirée ni une panne serveur : là, c'est la cause qui compte.

Les vingt-trois points d'affichage y passent, plus **cinq autres que la garde a trouvés** en balayant tout l'arbre — dont la création depuis un modèle, qui renvoyait « Erreur création page. » Au passage, deux variables ont été renommées : ce qu'une de nos fonctions rend est une `phrase` déjà traduite, pas le corps brut d'une réponse, et le nom le dit maintenant.

**Mesuré après, au navigateur, sur le même parcours** : « Non authentifie » est devenu « Votre session a expiré. Reconnectez-vous puis réessayez. »

Gardes : `lib/messageDeRoute.test.ts` (17 cas, dont un par code réellement renvoyé par l'API) et `app/messagesLisibles.test.ts` (16 cas, qui balaient tout l'arbre à la recherche d'un corps de réponse affiché tel quel). Vérifiées par injection : remettre `d.message || d.error` dans la création guidée fait échouer les deux.


## Lot v72 — les blocs que l'éditeur montre et que la page ne publie pas

Nouvelle mesure, celle du **premier écran** : ce que voit celui qui vient de scanner le QR, sur un téléphone, avant de faire le moindre geste. Appliquée aux 34 pages de démonstration rendues par le vrai moteur public :

> **19 pages sur 34 n'offrent aucune action sur ce premier écran.** Quatorze n'en offrent aucune nulle part.

`resto_bistrot` — un modèle de restaurant — n'avait, dans toute la page, aucun bouton : ni téléphone, ni réservation, ni carte. Seulement Instagram, Facebook et le pied de page QRowg.

La cause n'est pas la mise en page. Ce sont **treize types de blocs** qui rendent `null` en public dès que leur destination manque — `case "call_button": return c.phone ? … : null` — pendant que l'éditeur, lui, les dessinait complets, bouton compris. Appel, WhatsApp, e-mail, itinéraire, réservation, table, don, téléchargement, avis Google, vidéo, intégration, Spotify, audio : **exactement les blocs d'action**, c'est-à-dire la raison d'être du QR.

Le commerçant ajoutait « Appeler » depuis la bibliothèque, voyait le bouton vert dans son aperçu, publiait — et la page n'avait pas de bouton. L'alerte de pré-publication ne le rattrapait pas : `boutonsSansLien` exige un couple libellé/url **déjà rempli**, et quatre de ces blocs n'ont même pas d'url — leur destination est un numéro de téléphone, une adresse e-mail, une adresse postale.

**Les treize sont entrés dans la doctrine de l'état vide** (posée aux lots v63 et v64), chacun jugé sur *sa* destination. L'aperçu affiche maintenant « Ajoutez le numéro à appeler », « Ajoutez le lien de réservation », avec la mention « invisible en ligne tant qu'il est vide », et la liste de pré-publication les reprend.

**Une doctrine a dû être révisée pour cela.** La règle du 7 septembre disait : garder le bouton dans l'aperçu même sans destination, « le commerçant doit pouvoir le voir et le composer ». Elle se défendait — mais elle produisait exactement le mal mesuré ci-dessus. La composition n'est pas perdue : le bloc reste dans la page, sélectionnable, avec son panneau de réglages ; l'aperçu dit simplement quoi y mettre. Le test qui gardait l'ancienne règle a été réécrit, avec la raison.

**Deux trouvailles en chemin.** L'intégration (`embed_block`) a une seconde condition — l'hôte doit être autorisé, sinon la page rend un cadre vide : le détecteur pose désormais la même question, puisque ce module a pour contrat d'être le miroir exact du filtre public. Et un bloc entièrement vide se signalait deux fois (« bouton sans lien » *et* « bloc vide ») pour une seule chose à faire : il ne se signale plus qu'une.

**Ce que ce lot ne fait pas** : il n'ajoute aucune action aux pages de démonstration. Elles restent à 19 sur 34 sans action au premier écran, et c'est normal — leurs destinations sont vides depuis le lot v64, volontairement. Ce qui change, c'est que le commerçant l'apprend dans son éditeur, avant de publier, au lieu de le découvrir en ligne.

Gardes : `app/actionsPubliees.test.ts` (6 cas, dont celui qui **ferme la classe** : tout bloc du rendu public pouvant ne rien rendre doit être déclaré dans la doctrine), plus les cas ajoutés aux gardes existantes de l'état vide. Vérifiées par injection : retirer un des treize, ou rendre le détecteur d'intégration aveugle à l'hôte, fait échouer la garde.


## Lot v73 — on ne pouvait pas joindre le commerce

Le lot précédent a mesuré que 19 pages de démonstration sur 34 n'offraient aucune action à celui qui vient de scanner, et a fait annoncer les blocs vides dans l'éditeur. Restait la question de fond : pourquoi si peu d'actions ? En comptant les blocs des 48 modèles (34 de la galerie, 14 du studio) :

> **43 modèles sur 48 ne contenaient aucun bloc pour joindre le commerce.**

Ni bouton d'appel, ni e-mail, ni WhatsApp, ni formulaire de contact. `studio_gastro` aligne **dix-huit blocs** et aucun ne permet d'appeler le restaurant. Ce n'est pas un champ laissé vide : le bloc n'est pas dans le modèle.

**Et l'effet se propageait.** L'assistant de modèle dérive ses questions des blocs **présents** — c'est ce qui fait sa justesse. Pas de bouton d'appel dans le modèle, donc aucune question sur le téléphone : le commerçant répondait à dix-sept questions (le nom, la phrase, l'adresse, les horaires, la carte, les avis, les réseaux…), publiait, et son client ne pouvait pas l'appeler. **Personne ne lui avait jamais demandé son numéro.**

**Le correctif**, dans `builder/blocJoindre.ts` (module pur) : un modèle qui n'offre aucun moyen de joindre le commerce reçoit un bouton d'appel, placé juste après les blocs d'identité — on sait chez qui on est avant qu'on propose d'appeler. Il arrive avec son libellé et **sans numéro**, conformément à la doctrine du lot v63 : on donne la place et le titre, jamais l'affirmation.

La règle s'applique **à l'export**, pas modèle par modèle : `PAGE_TEMPLATES` et `STUDIO_TEMPLATES` passent par `avecMoyenDeJoindre`. Un modèle écrit demain entrera par la même porte. Les cinq modèles qui offraient déjà un moyen de contact ne sont pas touchés — pas de doublon.

**Ce que cela déclenche tout seul.** Le bloc étant là, l'assistant pose enfin la question : « Bistrot français » demande désormais « Votre numéro de téléphone », entre l'adresse et le site internet. Si le commerçant répond, le bouton est réel et la page publiée porte un vrai lien d'appel — vérifié bout en bout dans la garde. S'il ne répond pas, le lot v72 le lui annonce dans l'éditeur (« Ajoutez le numéro à appeler », « invisible en ligne tant qu'il est vide ») et dans la liste d'avant publication.

**Ce que ce lot ne change pas** : les pages de démonstration n'affichent toujours pas de bouton d'appel, puisque leur numéro est vide — c'est exactement le comportement voulu. Vérifié au navigateur : la place existe, le bouton n'apparaît pas sans numéro.

Mesuré après : **0 modèle sur 48** sans moyen de joindre le commerce.

Gardes : `builder/blocJoindre.test.ts` (6 cas sur la règle, dont la copie du contenu par modèle) et `app/joindreLeCommerce.test.ts` (9 cas : la couverture des 48, le passage par l'export, la place haute, l'absence de numéro inventé, la question de l'assistant sur tout modèle concerné, le bout en bout, et l'absence de doublon). Vérifiées par injection : retirer le passage par l'export, ou mettre un numéro dans le bloc, fait échouer sept cas.


## Lot v74 — le plancher qui n'en était pas un

L'atelier d'impression portait ce commentaire, à l'endroit exact du calcul :

> *Taille EFFECTIVE du QR = palier × curseur fin. Sert au rendu ET au contrôle (guard ≥ 20 mm honnête).*

Et la borne basse du curseur était écrite ainsi :

```js
const qMin = Math.min(qMax * 0.55, Math.max(0.55, Math.min(0.95, 20 / item.qrMm)))
```

Un `Math.min` entre le plancher de 20 mm et 55 % du maximum autorisé par la mise en page. Dès que la mise en page serre — une pastille carrée, un QR géant, un petit support —, c'est le second terme qui gagne et le plancher tombe. Mesuré sur les 16 supports du catalogue, toutes pastilles et mises en page confondues :

> **63 combinaisons atteignables sous 20 mm. La pire à 5,4 mm.**

Carte de visite : 11,9 mm. Étiquette de bouteille : 11,9 mm. Sticker de table : 8,2 mm. Cinq millimètres et demi dans le pire cas — un QR de la taille d'un ongle, sur un support que le commerçant fait imprimer, paie, et colle sur sa vitrine. Il n'a aucun moyen de s'en apercevoir avant d'avoir reçu la commande.

**`print-studio/tailleQrImprimable.ts`** (module pur) fait du plancher un plancher : le curseur ne descend jamais sous 20 mm. Et quand la mise en page ne peut pas accueillir 20 mm, il est **épinglé à son maximum** et l'écran le dit — « Cette mise en page ne laisse que 12 mm au QR ; il en faut 20 pour qu'il se scanne. Retirez un élément, ou choisissez un support plus grand. » — au lieu de laisser descendre en silence.

**Au passage, la distance de lecture.** L'indication sous le curseur venait d'un champ de contrôle séparé et disparaissait quand il était absent. Elle se calcule maintenant sur la taille réelle, avec la règle du métier — côté × 10 : un QR de 20 mm se lit à 20 cm, celui d'une vitrine lue à deux mètres en demande 200. Le commerçant voit donc, en déplaçant le curseur, à quelle distance son code sera lisible.

**Vérifié au navigateur** sur l'atelier : en poussant le curseur à fond vers le bas, l'indication s'arrête à « **20 mm · lisible environ 20 cm** ». Le même support descendait à 14,9 mm avant ce lot.

Gardes : `print-studio/tailleQrImprimable.test.ts` (6 cas sur le plancher et la distance) et `app/qrScannable.test.ts` (6 cas, dont le balayage du catalogue entier — 16 supports × 3 pastilles × 2 mises en page — et la disparition de l'ancienne expression aux deux curseurs). Vérifiées par injection : rétablir le `Math.min` d'origine fait échouer cinq cas.


## Lot v75 — la marge blanche que QRowg exige des autres

QRowg publie un testeur de QR code (`/outils/testeur-qr-code`). Il écrit, noir sur blanc, dans son propre code :

> *« Marge blanche autour du code, exprimée en modules. La norme demande quatre modules ; c'est la première chose que les gens suppriment en recadrant, et c'est une des premières causes de code illisible. »*

Son générateur, lui, comptait en **pixels**. `margin: 10` par défaut, un curseur d'export de 0 à 30 px, et deux préréglages nommés « Petit · 8 » et « Grand · 20 ». Mesuré sur les charges réelles du produit — lien court, lien de page, domaine du client — aux tailles d'export proposées :

```
400 px,  marge 10 px (défaut)   →  0,66 à 0,97 module
400 px,  marge 30 px (maximum)  →  2,2  à 3,3  modules
400 px,  marge 0 px  (minimum)  →  0    module
1000 px, marge 10 px            →  0,26 à 0,38 module
```

**Le produit ne pouvait produire aucun code conforme**, pas même en poussant le curseur à fond. Et plus on exportait grand, pire c'était : la marge était en pixels quand les modules, eux, rétrécissaient.

Passées dans le testeur de QRowg lui-même — ses seuils, sa tolérance —, ces sorties ressortent « **risque · La marge blanche est trop courte** » pour l'export par défaut, et « **bloquant · Le code n'a plus de marge** » pour l'export en 1000 px. Le produit échouait à son propre contrôle, avec ses propres mots.

Le contrôle interne du studio l'écrivait même en toutes lettres : « *minimum 4 modules (10px) requis* ». L'équivalence est fausse — dix pixels font 0,7 module sur un export de 400 px et 0,3 sur un export de 1000.

**`qr-codes/margeQr.ts`** (module pur) compte en modules. Le nombre de modules d'un code se déduit de sa charge et de son niveau de correction par la table des capacités du mode binaire ; cette table n'est pas recopiée de mémoire : la garde la confronte à l'encodeur réellement embarqué, sur les charges du produit et aux quatre niveaux de correction. La marge se calcule alors par inversion — `marge = silence × taille / (modules + 2 × silence)` —, ce que le réglage en pixels ne faisait pas, et c'est précisément pour cela qu'agrandir l'export dégradait la marge au lieu de la conserver.

Le réglage devient « Normale · 4 modules » / « Large · 6 modules », le curseur d'export en pixels ne pilote plus la zone silencieuse, et le diagnostic juge en modules. Un réglage sous la norme est ramené à la norme : on peut demander plus de silence, jamais moins.

**Trouvé en chemin** : `QRStyleConfig` existait en double, dans `QRStudio.tsx` et dans `qrRender.ts` — deux définitions jumelles, donc deux endroits où ajouter un champ. Une seule demeure, celle du renderer, qui est celle que l'export utilise vraiment.

**Vérifié au navigateur** sur l'atelier QR : le canvas rendu en 720 px porte une marge haute de 97 px, soit les quatre modules attendus pour cette charge. L'ancien réglage en donnait dix.

Gardes : `qr-codes/margeQr.test.ts` (8 cas, dont la confrontation de la table à l'encodeur embarqué) et `app/zoneSilencieuse.test.ts` (9 cas : trois charges × cinq tailles passées au verdict du testeur public, la démonstration que l'ancien réglage y échouait, et la disparition du réglage en pixels). Vérifiées par injection : rétablir `o.style.margin ?? 10` fait échouer trois cas.


## Lot v76 — la même marge, mais sur le support imprimé

Le lot précédent a réglé la marge blanche de l'**image** exportée. Restait celle du **support**, et elle était fausse de la même façon, mais à l'envers : la pastille laissait un filet fixe, et le contrôle le jugeait avec une règle fixe.

La pastille réservait **2,8 % du côté du QR** — une valeur décidée à l'œil. La norme demande quatre modules, soit `4/n` du côté : 13,8 % pour un code de 29 modules. Mesuré sur les 16 supports du catalogue :

```
Carte de visite   :  0,7 mm laissés   pour   3,3 mm exigés
Sticker vitrine   :  1,7 mm           pour   8,3 mm
Affiche A2        :  5,6 mm           pour  27,6 mm
Roll-up           :  6,2 mm           pour  30,3 mm
```

**Les seize étaient insuffisants**, d'un facteur 4 à 5 — et l'écart se creuse avec la taille du support, c'est-à-dire précisément là où le code est scanné de loin et où l'échec coûte le plus cher.

Et le pré-vol les déclarait tous bons. Il jugeait sur **4 millimètres fixes** (« laisser ≥ 4 mm de vide autour du QR ») quand la norme parle de **modules** ; sur un roll-up, 4 mm valent un demi-module. L'écran, de son côté, ne mesurait même pas : il affirmait `quietZoneMm: 5` quelle que soit la pastille et quelle que soit la taille du QR.

**Trois corrections, une même règle.** La marge de la pastille se calcule en modules (`ajustement.ts`). Le pré-vol juge contre `4 × taille / modules` et le dit dans son verdict (« laisser ≥ 30,3 mm — quatre modules »). Et l'écran lui passe la marge **réellement dessinée** plus le nombre de modules du code réellement encodé, au lieu d'une constante.

Au passage, deux arrondis retournés : l'exigence s'arrondit désormais vers le **haut** et la mesure vers le **bas**. Une exigence arrondie vers le bas est une exigence sous-estimée, et le centième manquant suffisait à faire passer un support qui ne devait pas.

**Ce que la correction coûte, et qui est dit.** Avec une vraie zone de silence, la pastille prend plus de place : sur les 48 combinaisons support × pastille, **13 ne peuvent plus tenir un QR de 20 mm** — et l'écran le signale, depuis le lot v74, au lieu de servir un code trop petit en silence (« Cette mise en page ne laisse que 14 mm au QR ; il en faut 20 »). Les 35 autres restent utilisables, et sur un petit support le commerçant a le choix : pas de pastille, ou un support plus grand. C'est un choix qu'on lui rend, pas une fonction qu'on lui retire.

**Vérifié au navigateur** : sur un sticker de table avec pastille carrée, l'onglet « Vérifier » affiche « Zone silencieuse · Marge suffisante autour du QR » — et cette fois c'est vrai. Avant ce lot, le même verdict s'affichait sur 0,8 mm de marge là où il en fallait 4,1.

Gardes : `app/silenceImprime.test.ts` (10 cas : les 16 supports, le verdict du pré-vol sur un roll-up avec et sans la marge requise, la démonstration que l'ancien filet n'y suffisait nulle part, le plancher de 20 mm tenu sur toutes les combinaisons restantes, et les mesures réellement passées par l'écran). Vérifiée par injection : rétablir le filet de 2,8 % fait échouer deux cas.

---

## v77 — les robots comptés comme des clients

**Relevé.** En suivant une requête de scan : `/q/<code>` écrit une ligne dans
`scans` à CHAQUE appel. Elle lit pourtant déjà l'en-tête `User-Agent` —
`parseDevice` en tire un « appareil », et cet appareil peut valoir **`"bot"`**.
Le produit reconnaissait donc le robot, l'écrivait noir sur blanc dans la colonne
`device`, et le comptait quand même : le déclencheur SQL `increment_scan_counters`
incrémentait `qr_codes.total_scans`, `pages.total_views` et `profiles.total_scans`,
puis l'écran de statistiques additionnait tout, `"bot"` compris (`DEVICE_ORDER`
le listait explicitement).

Qui suit un lien sans être un client : l'aperçu de WhatsApp, Messenger, Slack,
Discord, Telegram, LinkedIn ; les passerelles de sécurité du courrier (Safe Links,
Proofpoint, Barracuda) qui ouvrent les liens avant de livrer le message ; les
moteurs de recherche ; les outils en ligne de commande. Un commerçant qui colle
son lien dans un groupe WhatsApp récoltait un « scan » par aperçu — sur un compte
qui en compte trois, cela fait toute la mesure.

**Ce que le lot change.**

- `lib/robots.ts` (nouveau) — `estUnRobot(userAgent)` sur une liste de signatures
  réelles (aperçus sociaux, moteurs, passerelles de courrier, outils, navigateurs
  sans tête) ; un agent absent ou vide compte aussi comme non humain. Volontairement
  large : mieux vaut ne pas compter un visiteur douteux que compter un robot comme
  un client. `ligneDeRobot(device)` porte le même jugement sur une ligne déjà
  écrite, et `APPAREIL_ROBOT` nomme la valeur que `parseDevice` écrit.
- **Écriture.** `/q/[code]` n'insère plus ni `scans` ni `instant_scan_events` pour
  un robot. `/api/track` (vue, clic, événements d'engagement) répond « ok » sans
  rien écrire quand l'agent est un programme — un navigateur sans tête exécute le
  script comme un visiteur, il n'en est pas un.
- **Lecture.** Les lignes déjà en base cessent de peser : `.neq("device",
  APPAREIL_ROBOT)` sur toutes les requêtes qui comptent des scans ou des vues —
  tableau de bord (vues du mois, du jour, de la semaine, des 90 jours), écran
  Statistiques, `/api/qr-stats`, rapport hebdomadaire, rapports envoyés, alerte de
  quota, et la recherche de la première visite-scan (une ligne robot pouvait voler
  la place et empêcher l'email « premier scan »). `aggregateScanEvents` écarte les
  robots côté JavaScript et rend leur nombre.
- **Dit, pas caché.** L'écran Statistiques affiche « N aperçus de lien écartés du
  compte : un programme qui ouvre votre lien (WhatsApp, Slack, un antivirus de
  messagerie) n'est pas un visiteur », et la fiche d'un QR dynamique la même chose.
  Aucun chiffre ne baisse en silence.

**Garde.** `app/scansHonnetes.test.ts` (14) balaie tout l'arbre `src/` : aucune
insertion dans `scans`, `page_views`, `instant_scan_events`, `block_clicks` ou
`page_events` sans que le fichier consulte `estUnRobot` ; aucune requête sur
`scans` ou `page_views` sans `.neq("device", APPAREIL_ROBOT)`. L'exception
assumée — `instant_scan_events` lu entier pour pouvoir annoncer le nombre
d'aperçus écartés — est écrite dans la garde. `lib/robots.test.ts` (29) vérifie le
jugement sur des chaînes d'agent complètes et réelles.

**Vérification par mutation.** Quatre défauts réinjectés : la redirection qui
réécrit le scan sans distinguer le robot, l'agrégation qui recompte les lignes
`"bot"`, le tableau de bord qui recompte les vues robots, l'alerte de quota qui
les recompte. Chaque fois, la garde tombe ; restaurée, elle repasse.

**Note d'outillage.** Une aide générique `sansRobots(requete)` a été écrite puis
retirée : sur les sélections larges et dans les tuples de `Promise.all`,
l'inférence de son paramètre faisait dépasser à TypeScript sa profondeur
d'instanciation (TS2589) et la compilation échouait. Le filtre s'écrit à la main,
avec la constante ; la garde vérifie qu'aucune requête ne l'oublie.

Suite complète : 4 827 tests, 293 fichiers. Build vert.

---

## v78 — le mur au bout du QR imprimé

**Relevé.** En scannant, sur le serveur compilé, un code qui n'existe pas :

```
GET /q/code-qui-nexiste-pas → 404
liens de la page : https://qrowg.com | Créer votre propre QR Code →
```

Un seul lien. Les trois écrans d'échec de `/q/<code>` — « QR Code introuvable »
(404), « Ce QR Code a expiré » (410), « QR Code temporairement indisponible »
(503), plus « Page en préparation » (404) — offraient exactement la même sortie
unique : une publicité pour QRowg. Une personne debout devant la vitrine, le
flyer à la main, recevait une réclame pour l'outil de son commerçant. C'est
l'inverse de ce que le commerçant a acheté, et c'est le seul moment où le produit
tient vraiment son client par la main.

Or dans quatre cas sur cinq le produit SAIT à quel commerce ce code appartient :
le QR porte `page_id`, la page porte un titre et des blocs « Appeler »,
« WhatsApp », « Itinéraire », « Écrire » — que le lot v73 a d'ailleurs rendus
obligatoires sur les 43 modèles.

**Ce que le lot change.**

- `q/[code]/joindreLeCommerce.ts` (nouveau, PUR) — `moyensDeJoindre(blocs)` lit
  les blocs de la page et en tire au plus quatre boutons, classés par l'urgence
  réelle de quelqu'un qui est devant le commerce : Appeler, WhatsApp, Itinéraire,
  Écrire. Un bloc vide n'est pas un moyen ; un même libellé n'apparaît qu'une
  fois. Les URL sont construites par `buildDestUrl`, celui-là même qui sert aux
  destinations de QR — une seule façon d'écrire un `tel:` dans le produit.
- `titreDuMur` / `phraseDuMur` — le mur porte le nom du commerce, et dit ce qui
  s'est passé puis ce qu'on peut faire. La seconde moitié dépend de ce qu'on a
  vraiment à offrir : « Le Comptoir reste joignable autrement » seulement si des
  boutons suivent, sinon « Réessayez un peu plus tard » ou « Demandez le nouveau
  à la personne qui vous l'a remis ». Le vieux « Ce QR Code n'existe pas ou n'est
  plus actif » disait deux choses contradictoires et n'aidait à rien.
- `q/[code]/route.ts` — trois gabarits HTML presque identiques (`pausedHtml`,
  `expiredHtml`, `noticeHtml`) remplacés par un seul, `murHtml`, avec une teinte,
  un emoji et une étiquette par raison. Le lien QRowg reste, en bas, sous un
  filet : « QR Code créé avec QRowg ». Il n'est plus la seule sortie.
- Les blocs de la page ne sont lus QUE sur les branches d'échec : un scan qui
  réussit ne paie pas cette requête.
- `?mur=<raison>` (harnais uniquement, jamais en production) rend l'écran avec un
  commerce d'exemple. Ce mur était le seul écran du produit qu'aucun écran
  d'administration ne montre : pour le voir, il fallait casser un QR.

**Mesures.** Écran rendu à 390 px : titre 22 px, texte 15 px, étiquette 12 px,
boutons de 52 px de haut, lien de pied 32 px, aucun défilement horizontal.
Contrastes sur la carte `#0F0E0B` : texte 9,6:1, titre 17,0:1, pied 6,2:1,
boutons 9,8:1, étiquettes 6,2 à 7,3:1 — tous au-dessus des 4,5:1 de la maison.

**Garde.** `q/[code]/murDuQr.test.ts` (16) : les moyens lus, leur ordre, leur
déduplication, le refus d'un bloc vide, le plafond de quatre ; la phrase qui ne
promet rien sans boutons et qui ne colle pas un article à un nom propre ; côté
route, qu'aucun ancien gabarit ne subsiste, que chaque `murResponse` posé après
la résolution du QR passe par `commerceDuQr()`, que le lien QRowg existe encore
sans être seul, et que les tailles, les cibles et les contrastes tiennent — cet
écran étant du HTML écrit à la main, il échappe à l'arbre React balayé par
`lisibiliteEtCibles`.

**Vérification par mutation.** Cinq défauts réinjectés : un mur qui oublie le
commerce, un texte gris sous 4,5:1, des boutons de 28 px, un bloc vide redevenu
un moyen de joindre, un doublon d'« Appeler ». Chaque fois la garde tombe.

**Deux gardes voisines réparées.** `motDePasse.test.ts` bornait sa lecture sur le
littéral « QR Code introuvable », parti dans le nouveau module — borne réancrée
sur `raison: "introuvable"`. Et `orthographeInterface.test.ts` a refusé la
variante `non_publiee` (un mot français sans son accent) : elle s'appelle
`brouillon`, qui est d'ailleurs le nom du statut côté base.

Suite complète : 4 843 tests, 294 fichiers. Build vert.

---

## v79 — l'heure du commerce, pas celle du téléphone

**Relevé.** Au navigateur, modèle « Bistrot français » (Lun-Ven 12 h-14 h 30 et
19 h-23 h), un seul et même instant réel — lundi 22 h 30 à Paris — rendu dans
trois fuseaux :

```
Europe/Paris      → « Ferme bientôt · à 23h »    (vrai)
America/New_York  → « Fermé · ouvre à 19h »      (faux : le service tourne)
Asia/Tokyo        → « Fermé · ouvre à 12h »      (faux, et mauvais jour)
```

La cause tenait en deux lignes : `openStatus` lisait `now.getDay()` et
`now.getHours()`, c'est-à-dire l'horloge DU VISITEUR, et le surlignage
« Aujourd'hui » lisait `new Date().getDay()` pour la même raison. Un client à
l'étranger qui prépare sa venue, un touriste dont le téléphone n'a pas changé de
fuseau, un lien partagé dans un groupe international : tous lisaient « Fermé »
d'un commerce ouvert. Un horaire appartient au lieu.

**Ce que le lot change.**

- `lib/heureDuCommerce.ts` (nouveau, PUR) — `chezLeCommerce(now, fuseau)` rend le
  jour et la minute tels qu'on les lit sur place, via `Intl` : l'heure d'été est
  suivie toute seule, écrire le décalage à la main c'est se tromper deux
  dimanches par an. `fuseauDuBloc`, `fuseauValide`, `memeHeureQue`,
  `mentionFuseau`.
- `openStatus(c, now, fuseau?)` calcule dans le fuseau du commerce. Les quatre
  rendus du bloc — page publiée, rendu partagé, aperçu de l'éditeur — le
  suivent, surlignage du jour compris.
- **Le visiteur sait à quelle heure il lit** : quand son décalage diffère de
  celui du commerce, le badge ajoute « · heure de Paris ». Sans cette mention,
  « Ouvert » se lit comme « ouvert maintenant, chez moi ». La comparaison porte
  sur les DÉCALAGES, pas sur les noms : Paris et Madrid marquent la même heure,
  prévenir n'apporterait rien.
- **Le défaut est assumé et réversible** : `Europe/Paris`, parce que QRowg est un
  produit français — interface, modèles et commerçants. Un nouveau champ
  « Fuseau horaire du commerce » (18 fuseaux, métropole et outre-mer) le change
  en un clic, sans nous écrire. Un commerçant qui ne touche à rien garde une
  page juste.

**Mesure après.** Le même instant, les mêmes trois fuseaux :
`Europe/Paris → « Ferme bientôt · à 23h »`, `America/New_York` et `Asia/Tokyo →
« Ferme bientôt · à 23h · heure de Paris »`. Badge de 258 px sur un écran de
320 px, aucun débordement.

**Garde.** `lib/heureDuCommerce.test.ts` (18) : la lecture dans chaque fuseau, le
passage de minuit dans les deux sens, l'heure d'été, le repli sur le défaut, la
validité des 18 fuseaux proposés ; le badge identique partout dans le monde ; la
mention qui ne se déclenche que si l'heure diffère vraiment — y compris le cas
extrême de deux fuseaux à 24 h d'écart (Kiritimati et Tahiti affichent « 10:30 »
au même instant, un mardi et un lundi) ; et, côté source, qu'aucun des trois
rendus n'appelle plus `openStatus(c, new Date())` ni `new Date().getDay()`.

**Vérification par mutation.** Trois défauts réinjectés : `openStatus` qui
reprend `getDay`/`getHours`, le surlignage qui reprend l'horloge du visiteur, le
calcul de décalage qui oublie le franchissement de minuit. Chaque fois la garde
tombe.

**Une garde voisine mise au clair.** Les cas d'`openStatus` de `types.test.ts`
construisaient leurs instants avec `new Date(2026, 6, 8, 8, 0)` — l'heure LOCALE
de la machine de test. Ils passaient parce que le produit lisait la même horloge
qu'eux : l'hypothèse était partagée, donc invisible. Ils déclarent maintenant leur
fuseau (`Date.UTC` + commerce sur `"UTC"`) et mesurent la logique d'ouverture,
plus l'accord fortuit de deux horloges.

Suite complète : 4 861 tests, 295 fichiers. Build vert.

---

## v80 — le message de congés qui ne s'éteint jamais

**Relevé.** Au navigateur, bloc « Horaires » garni d'un contenu de vrai
commerçant. Lundi 14 septembre 2026, 10 h, heure de Paris :

```
badge     : « Ouvert · ferme à 18h »
bannière  : « 📅 Fermé du 1er au 15 août »
```

Deux affirmations contraires dans la même rangée, un mois après la fin des
congés. Le champ « Exception / congés » est un texte libre sans date : le
commerçant l'écrit en juillet, part, revient — et le message reste en ligne
jusqu'à ce qu'il pense à l'effacer. Personne ne pense à l'effacer.

Or **la date est écrite dans le texte**. Le commerçant l'a donnée : « du 1er au
15 août ». Le produit peut la lire.

*(En chemin, une deuxième trouvaille : le bloc « Horaires » n'avait aucune
garniture dans le harnais des 51 blocs — il s'y rendait vide, donc ni tableau,
ni badge, ni bannière. C'est en la posant que la contradiction est apparue.)*

**Ce que le lot change.**

- `lib/congesDates.ts` (nouveau, PUR) — `periodeDeConges(texte, aujourdHui)` lit
  les formes qu'écrivent les commerçants : « du 1er au 15 août » (le mois du
  début vient de la fin), « du 24 décembre au 2 janvier » (passage d'année),
  « du 01/08 au 15/08/2026 », « jusqu'au 15 août », « le 25 décembre ».
  L'année manquante est celle qui place la période au plus près d'aujourd'hui :
  août lu en septembre est l'août qui vient de passer.
  **Et le module se tait dès qu'il n'est pas sûr** : « Fermé cet été », « congés
  annuels », « Fermé du lundi au vendredi » ne renvoient rien. Mieux vaut ne
  rien savoir que se tromper sur les congés de quelqu'un.
- `openStatus` — les congés passent AVANT l'horaire habituel : pendant la
  période, le badge annonce « Fermé · réouverture le 16 août ». Les deux lignes
  disent enfin la même chose.
- **La bannière périmée n'est plus publiée** — ni sur la page, ni dans le rendu
  partagé. Le texte du commerçant n'est pas touché : il l'attend dans son bloc.
- **Et il l'apprend** : `AlertesPublication` (près du bouton « Publier ») ajoute
  « Message d'exception terminé depuis 30 jours — il n'est plus affiché en
  ligne ». Rien quand aucune date n'est lisible : on ne signale que ce qu'on
  sait.

**Mesure après**, au même instant qu'au relevé : la bannière a disparu, le badge
dit « Ouvert · ferme à 18h » — plus de contradiction. Et le 10 août, en pleine
période : « Fermé · réouverture le 16 août » au-dessus de « Fermé du 1er au
15 août », d'accord l'un avec l'autre.

**Garde.** `lib/congesDates.test.ts` (21) : chaque forme reconnue, le passage
d'année, l'année la plus proche, le silence sur tout ce qui n'est pas daté, le
refus des dates impossibles ; les trois états et le dernier jour qui compte
entièrement ; le badge pendant et après ; la phrase faite au commerçant et son
arrivée dans les alertes de publication ; et, côté source, que la bannière
affichée dépend bien de l'état de la période et qu'aucun rendu n'écrit dans le
contenu du client.

**Un défaut de mon propre module, attrapé par ma propre garde.** Le report à
l'année précédente s'appliquait sans condition : « du 15 au 1er août » — une
inversion de saisie — devenait des congés de douze mois (15 août 2025 →
1er août 2026). Le report ne vaut plus que sur un vrai passage d'année, et
au-delà de 120 jours le module se tait.

**Vérification par mutation.** Quatre défauts réinjectés : le badge qui ignore
les congés en cours, la bannière périmée qui repart en ligne, le dernier jour qui
bascule trop tôt, le commerçant qui n'est plus prévenu. Chaque fois la garde
tombe — la deuxième après avoir resserré le test de rendu, qui se contentait
d'abord de regarder la forme de l'expression.

Suite complète : 4 882 tests, 296 fichiers. Build vert.

---

## v81 — ce que le formulaire promet au client

**Relevé.** Sur le serveur compilé. Le harnais de page publique porte exprès un
identifiant qui n'est pas un UUID, pour que rien ne s'écrive en base. On envoie
donc un message comme le ferait un client :

```
POST /api/leads → 400 {"error":"Page invalide"}
```

Rien n'est enregistré. Et la logique de soumission du produit répondait :

```
decideResult(false, hasOwnerEmail=true) → { status: "success", action: "mailto" }
                                            // « repli mailto = succès »
```

ce qui affichait au client, en vert, avec une coche :

> ✅ Demande envoyée, merci ! Nous revenons vers vous rapidement.

**Deux affirmations, toutes deux fausses.**

1. « envoyée » — rien n'est parti. Le navigateur a seulement tenté d'ouvrir la
   messagerie du visiteur avec un brouillon pré-rempli. Sur un téléphone sans
   application de courrier configurée, il ne se passe rien du tout ; et même
   quand elle s'ouvre, il reste à appuyer sur « Envoyer ».
2. « Nous revenons vers vous rapidement » — le produit promet, AU NOM DU
   COMMERÇANT, un délai de réponse que ni lui ni le commerçant ne maîtrisent.

Et un silence : le formulaire demande un nom, un e-mail, un numéro de téléphone,
et ne dit à aucun moment qui les reçoit.

**Ce que le lot change.**

- `lib/promesseDuFormulaire.ts` (nouveau, PUR) — trois issues, trois phrases :
  *enregistré* (« Votre message est bien arrivé. Le Comptoir le retrouvera dans
  ses messages. »), *courrier* (« Votre message n'est pas encore parti. Nous
  avons ouvert votre messagerie avec le message déjà écrit : il reste à
  l'envoyer. »), *échec* (« L'envoi n'a pas abouti. Réessayez dans un instant —
  ou appelez directement le commerce. »). Aucune ne promet de réponse : personne
  ici ne peut la promettre à la place du commerçant.
- `decideResult` — le repli courrier a son propre état, `"courrier"`, au lieu
  d'être un `"success"` déguisé. La coche verte et la couleur de succès ne sont
  plus posées sur un message qui n'est pas parti.
- Les deux formulaires publics (générique et inscription à un événement) et la
  vue partagée passent par la même table de phrases.
- `mentionDestinataire` sous chaque formulaire : « Vos informations sont
  transmises à *Le Comptoir*, qui les reçoit dans son espace QRowg. » Le nom
  vient du titre de la page, descendu jusqu'au bloc ; sans nom, la phrase reste
  vraie.

**Garde.** `lib/promesseDuFormulaire.test.ts` (13) : la machine qui distingue les
trois issues, l'absence de toute promesse de délai dans chacune des phrases, le
fait que « nous » ne désigne que QRowg et seulement pour ce que QRowg a fait,
trois phrases distinctes et complètes, le nom du commerce quand on le connaît, et
— côté source — que les anciennes phrases ont disparu des rendus publics, que
chacun passe par la même table, et que la mention du destinataire est posée sous
chaque formulaire.

**Vérification par mutation.** Quatre défauts réinjectés : le repli courrier
redevenu un succès, la promesse de délai de retour, la coche verte sur le
brouillon, la mention du destinataire retirée. Chaque fois la garde tombe.

**Une garde voisine mise à jour.** `forms.test.tsx` figeait
`decideResult(false, true) → success` : c'était exactement le défaut. Le cas est
conservé, avec sa nouvelle valeur et la raison écrite au-dessus.

Suite complète : 4 895 tests, 297 fichiers. Build vert.
