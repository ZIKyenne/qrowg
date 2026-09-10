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

## Critères de fin, état

1. Héros visible immédiatement : **oui** (v49, v50).
2. Aperçus de modèles souris / clavier / tactile : **oui** (v49).
3. Mêmes plans, catégories et termes partout : **oui**, gardes `nomsDesPlans`, `passeEditoriale`, `categorieLue`.
4. QR Studio sans défilement à 1440 / 1536 / 1920 : **oui** (v51).
5. Éditeur compréhensible à l'ouverture, aucun réglage visuel dans Contenu : **oui** (v50).
6. Aucun mélange tutoiement / vouvoiement ni français / anglais : **oui sur ce qui est lu**, sauf « Business » / « Event » de la bibliothèque de blocs (P1).
7. Tous les visuels QR ont un secours : **oui** (v50).
8. Mobile 375 / 390 / 430 sans défilement horizontal, action à portée de pouce : **oui** (v54, 32 écrans).
