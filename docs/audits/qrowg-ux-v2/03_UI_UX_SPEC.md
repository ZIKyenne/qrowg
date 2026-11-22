# 03 — Spécification UI/UX : ce qui est déjà la règle, ce qui change

Le pack décrit une expérience cible. La plupart de ses principes sont déjà inscrits dans le dépôt et gardés par des tests. Ce document ne les recopie pas : il renvoie aux règles en vigueur et ne détaille que les écarts.

## Règles déjà en vigueur (ne pas réinventer)

| Principe du pack | Règle dans le dépôt |
|---|---|
| Une action primaire par zone | Famille `.da-btn-*` (« jamais d'or plein dans une liste répétée »), garde `unSeulBouton` |
| Cibles tactiles 44 px | `.cible-doigt` / `.cible-doigt-carre` (`globals.css`), cliquet `ciblesAuPouce` |
| Feuilles plutôt que modales imbriquées | `components/mobile/MobileSheet`, `ActionSheet` ; le bouton retour ferme (`historiqueDesFeuilles`) |
| Mouvement réduit | `lib/motion.ts`, garde `mouvementQuiSeCoupe` |
| Rien de faux | Règle propriétaire : ni faux chiffres, ni faux avis, ni promesse sans mesure (gardes `promessesTenues`, `revueP1P2`) |
| Mobile ≠ bureau miniature | Éditeur mono-panneau < 1024 px, barre du bas < 620 px, « Ma carte » en écran dédié |

## Écarts qui restent

1. **Page publiée en cours d'édition (D1).** Si l'option A est choisie, l'en-tête de l'éditeur affiche :

   `● En ligne · vos modifications sont visibles tout de suite`

   La feuille Publier d'une page déjà en ligne dit « Votre page est à jour », et n'affiche plus de bouton « Mettre à jour » qui ne change rien pour le visiteur.

2. **Page après scan (prochain lot).** Mesurer à 320 et 390 px, puis corriger dans le rendu commun :
   - nombre de gestes jusqu'à la carte ;
   - onglets qui restent visibles au défilement ;
   - prix et formats (25/50 cl) lisibles ;
   - épuisé clair ;
   - Appeler, Itinéraire et Réserver faciles à toucher ;
   - zoom à 200 %.
