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
