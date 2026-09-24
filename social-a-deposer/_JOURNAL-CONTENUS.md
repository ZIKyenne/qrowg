# Journal des contenus QRowg — anti-doublon

> **À lire AVANT toute création.** Aucun slug, angle ou accroche listé ici ne peut être
> réutilisé. Après chaque run, ajouter la ligne du jour en bas.

---

# 🛑 ÉTAPE 0 — HYGIÈNE BUFFER, AVANT TOUT LE RESTE (règle permanente, 13/09/2026)

**Rien ne se produit tant que la file n'est pas propre.** Cette étape est inscrite en
tête du prompt de la tâche planifiée `qrowg-marketinglocal` et s'exécute chaque matin.

**Le piège, en une phrase :** Instagram renvoie à Buffer une erreur
« flagged this post as potential spam » sur des posts **qu'il a pourtant publiés**.
Buffer garde la ligne rouge, elle reste dans l'onglet Queue avec un bouton
**Retry Now**, et le jour où on clique — ou qu'un run la requeue — le doublon part.
C'est ce qui a produit le doublon du 07/09, et le risque est revenu les 11 et 12/09.

**Le geste, à chaque run, sans exception :**

1. `list_posts` status `["error"]`.
2. Pour chaque post : `execute_query` sur les `sent` du même canal avec `sentAt`,
   `externalLink`, `text`. Si un `sent` existe au même horaire que le `dueAt`, ou avec
   le même texte → **le post est en ligne**.
3. → `edit_post` `saveToDraft: true`, légende préfixée
   `[DÉJÀ EN LIGNE — NE PAS RETRY] <permalien>`.
   Instagram exige qu'on repasse `metadata.instagram {type, shouldShareToFeed,
   isAiGenerated}`, sinon l'édition est rejetée.
4. Seulement si **aucun** `sent` ne correspond : le post n'est jamais sorti, on peut le
   reprogrammer (`edit_post` + `mode:"addToQueue"`).
5. Même traitement pour les `scheduled` qui rejouent un contenu déjà publié — un run
   interrompu en recrée (cas du 13/09 : carrousel TikTok du 12/09 dupliqué).

**Trois interdits :** ne jamais cliquer Retry · ne jamais supprimer un post ·
ne jamais requeuer sans avoir fait le point 2.

À la fin de l'étape 0, l'onglet `error` est vide et le nombre de `scheduled` est le
chiffre qui pilote le remplissage du jour.

---

## ⚑ Source des chiffres (lire en premier)

**Buffer ne mesure PAS Pinterest.** Ses `metrics` renvoient `Impressions: 0` sur toutes
les épingles, ce qui est un **défaut de reporting**, pas un fait. Toutes les notes du
02 au 07/09 parlant de « 0 impression » sont **fausses** et ont produit six jours
d'hypothèses inutiles (tableaux, domaine revendiqué, shadowban).
La vérité vient de l'**export natif Pinterest Analytics** : sur 08/08 → 07/09,
**1 207 impressions**, moyenne passée de **24,4/j** (avant production quotidienne) à
**80,6/j** (depuis le 31/08), pic à **129 le 07/09**. La distribution Pinterest
**fonctionne et triple**. Détail dans `marketing-design\DIAGNOSTIC-PINTEREST.md`.

Buffer reste fiable pour **TikTok et Instagram** (vues, temps de visionnage, statut
`error`). Pour Pinterest : programmer avec Buffer, mesurer dans Pinterest.

**Le vrai chantier Pinterest est la conversion**, pas la portée : 1 207 impressions →
7 clics sur épingle → **2 clics sortants** en 30 jours. Travailler les titres, la
promesse, et cesser de tout dire dans le visuel (il ne reste aucune raison de cliquer).

**Placement tranché :** les tableaux « QR code X » écrasent les tableaux historiques
(QR code restaurant 119 impressions contre Templates gratuits 19, Productivité au
travail non classé). On garde les tableaux thématiques par défaut.

## ⚑ Épingles écrites POUR LE CLIC (formule en vigueur depuis le 08/09)

Constat : 1 207 impressions en 30 jours n'ont produit que **2 clics sortants**. Cause
retenue — **l'épingle donnait toute la réponse**. Titre = le problème, sous-titre = le
mécanisme complet, QR = la solution. On lisait, on comprenait, on passait. Il ne restait
aucune raison d'ouvrir.

**La formule à appliquer désormais :**

1. **Le visuel retient la réponse.** Le titre garde l'accroche (le problème, en une
   phrase qui arrête le défilement). Le sous-titre **n'explique plus le mécanisme** : il
   annonce une méthode à récupérer et s'arrête, avec une flèche.
   - ✗ « Un QR sur la table ouvre la carte des softs maison : les sirops, les jus… »
   - ✓ « La marche à suivre : 4 étapes, 5 minutes, sans carte bancaire → »
2. **Sous-titre court** — deux lignes maximum, sinon la flèche s'orpheline en bout de
   ligne et le bloc devient un pavé.
3. **Le titre Pinterest promet, il ne décrit pas.** Il contient un livrable, un chiffre
   ou une durée.
   - ✗ « Carte des softs : autre chose que du Coca »
   - ✓ « Carte des softs : la monter en 5 minutes, sans réimprimer »
4. **Première phrase de la description = la promesse + l'appel à cliquer.** Pinterest
   tronque : le contexte vient après, jamais avant. Terminer par « Clique pour… ».
5. **Ne promettre que ce que la page livre.** Vérifié le 08/09 sur `/qr-code/menu` et
   `/qr-code/salon` : outil gratuit, **sans carte bancaire**, **prêt à imprimer en
   5 minutes**, **4 étapes**, modifiable sans réimprimer. Ces quatre arguments sont
   honnêtes sur toutes les pages `/qr-code/<usage>`. Ne pas promettre un modèle, un PDF
   ou une checklist tant que la page n'en propose pas — un clic gagné par appât est un
   visiteur perdu.
6. **Marquer l'expérience** : `&utm_content=clic` en fin de lien, pour séparer cette
   série de tout ce qui précède.

**Indicateur à suivre : le clic sortant**, pas l'impression. Base de départ à battre :
**2 clics sortants / 1 207 impressions sur 30 jours (0,17 %)**. Relire dans Pinterest
Analytics (pas dans Buffer) le 15/09.

## ⚑ Instagram : un post en `error` peut être EN LIGNE (vérifié le 09/09)

**Ne jamais republier un post Instagram en `error` sans avoir vérifié `externalLink`.**

Buffer affiche `error: « Instagram flagged this post as potential spam »` sur des posts
qui **ont pourtant été publiés**. Instagram renvoie l'erreur, Buffer la garde, mais le
post passe quand même — Buffer le récupère alors dans un **second enregistrement**
`via: "network"` portant le vrai `externalLink` Instagram. On se retrouve avec deux
lignes pour un seul post : une rouge et fausse, une verte et réelle.

Vérifié le 09/09 : les 4 carrousels crus « jamais publiés » sont tous en ligne —
05/09 `/p/Dc616I8mTiZ/` · 06/09 `/p/Dc9QC01iWLP/` · 07/09 `/p/Dc_zAPNmK-z/` ·
08/09 `/p/DdB95BkloaZ/`.

**Le contrôle à faire :** avant de reprogrammer un post en `error`, interroger les posts
`sent` du même canal avec le champ `externalLink`. Si un `sent` existe au même horaire
ou avec le même contenu, **le post est en ligne : ne pas le rejouer**, le passer en
brouillon. Les reprogrammations du 08/09 ont d'ailleurs échoué d'elles-mêmes avec
« issue with the media » — c'est Instagram qui refusait un doublon, pas un problème
d'image (les fichiers sont accessibles et valides, 2160×2700).

**Conséquence sur la lecture des chiffres :** les « 0 vue, 0 reach » d'Instagram sont
**réels**. Les posts sortent et ne touchent personne. Le problème Instagram est un
problème d'audience et de portée, pas de publication.

## ⚑ INSTAGRAM — NE JAMAIS PUBLIER DEUX FOIS (règle bloquante, 09/09)

Demande explicite d'Emilien le 09/09 : le compte Instagram a accumulé des carrousels
publiés en double. **Audit fait le 09/09 sur les 25 posts Instagram envoyés.** Les
doublons réels, à supprimer côté Instagram :

| Doublon | Publications | Cause |
|---|---|---|
| Food truck · privatisation | 07/09 16 h 49 `/p/Dc_lDInIHjY/` **et** 07/09 18 h 51 `/p/Dc_zAPNmK-z/` | **le même carrousel republié après un statut `error` qui était faux** |
| Restaurant · carte enfants | 06/09 `/p/Dc9QC01iWLP/` (carrousel) et 07/09 `/reel/Dc_ugk2MB6R/` (reel) | même accroche à 23 h d'écart, formats différents |
| Restaurant · plat du jour / carton de table | 24/08 16 h 49 `/p/Dcbh6zsFNKq/` et 24/08 22 h 44 `/p/DccKhwsFujt/` | deux posts du même angle le même jour |
| Restaurant · carte de rentrée | 28/08 `/p/DcmGYaYiWRm/`, 01/09 `/p/DcwNiyfibhM/`, 02/09 `/p/DcxwMlOFnNl/`, 02/09 `/reel/DcyX5R_sgS1/` | **quatre fois le même angle en six jours** |

**Les deux causes, et les deux parades :**

1. **Republication d'un post `error` qui était en réalité en ligne.** Buffer affiche
   `error: « Instagram flagged this post as potential spam »` sur des posts qu'Instagram
   a bel et bien publiés, puis récupère la vraie publication dans un **second
   enregistrement `via: "network"`**. Requeuer le premier publie une deuxième fois.
   → **Parade : ne JAMAIS toucher à un post Instagram en `error` sans avoir d'abord
   interrogé les posts `sent` du canal avec `externalLink`.** Si un `sent` existe le même
   jour, **le post est en ligne : le passer en brouillon, ne pas le rejouer.**
   Vérifié le 09/09 : 05/09 `/p/Dc616I8mTiZ/` · 06/09 `/p/Dc9QC01iWLP/` ·
   07/09 `/p/Dc_zAPNmK-z/` · 08/09 `/p/DdB95BkloaZ/` — tous en ligne, tous marqués `error`.

2. **Un seul carrousel Instagram par jour, un angle par 21 jours.** Deux posts Instagram
   dans la même journée, ou le même angle deux fois dans la semaine, se lisent comme un
   doublon dans le fil même si les textes diffèrent.

### Contrôle obligatoire AVANT toute mise en file Instagram
À faire à chaque run, dans cet ordre, sans exception :
1. `list_posts` statut `["error"]` → **ne rien requeuer**, seulement constater.
2. `execute_query` sur les posts `sent` du canal Instagram avec `sentAt` + `externalLink`
   + `text` sur les **14 derniers jours**.
3. Comparer la **première phrase** du post du jour à celles-là. Une accroche déjà vue,
   même reformulée = **on ne publie pas**, on change d'angle.
4. Vérifier qu'aucun autre post Instagram n'est déjà programmé pour la même journée.
5. Un seul post Instagram par jour. Le reel ne compte pas comme un deuxième post à
   condition qu'il porte **un angle différent** du carrousel du jour.

## ⚑ Règles de publication (obligatoires, à appliquer à CHAQUE mise en file)

1. **Mention « contenu généré par IA » : TOUJOURS activée.** Demande explicite d'Emilien
   (08/09). Dans `create_post` / `edit_post`, poser `isAiGenerated: true` :
   - Instagram → `metadata.instagram.isAiGenerated: true` (fonctionne sur les carrousels)
   - X / Twitter → `metadata.twitter.isAiGenerated: true` (tweets originaux uniquement)
   - TikTok → `metadata.tiktok.isAiGenerated: true` **sur les vidéos seulement**.
     Sur un **carrousel photo**, l'API refuse : *« TikTok photo posts do not support AI
     content disclosure »*. Ne pas l'envoyer pour un carrousel photo, sinon la mise en
     file échoue — la mention se coche alors à la main dans l'appli si besoin.
   - Pinterest / LinkedIn → le champ n'existe pas dans l'API Buffer.
2. **Instagram : jamais d'URL dans la légende.** Le lien tracké vit **dans la bio**
   (`utm_medium=bio`), la légende dit « Le lien est dans la bio ». **5 hashtags maximum.**
   Motif : 4 carrousels (05, 06 et 07/09) ont été rejetés par Instagram —
   *« flagged this post as potential spam »* — avec URL + UTM et 8 à 10 hashtags.
3. **Pinterest : 500 caractères maximum** pour la description, sinon `create_post` échoue.
4. **Contrôler `list_posts` avec le statut `error`** à chaque run, pas seulement
   `scheduled` : un post rejeté ne se voit nulle part ailleurs et fausse la lecture des
   statistiques (on croit lire 0 vue alors que rien n'a été publié).
5. **Récupérer un post en `error` :** on ne peut pas le ré-enregistrer tel quel, son
   heure est passée et Buffer refuse une date antérieure. Il faut `edit_post` **avec
   `mode: "addToQueue"`** (ou `customScheduled` + `dueAt` futur) : cela corrige le texte
   ET le replace dans un créneau à venir en une seule opération. Le champ `error` reste
   affiché tant que la nouvelle tentative n'a pas eu lieu — c'est cosmétique, le
   `status` repasse bien à `scheduled`.

## Règles d'unicité (obligatoires)
1. **Slug** : jamais réutiliser un slug déjà présent. Interdiction aussi des quasi-doublons
   (même secteur + même objet + même bénéfice), même avec des mots différents.
2. **Angle** : un couple (secteur, angle) ne revient pas avant **21 jours**.
3. **Accroche** : ne pas réécrire une accroche déjà utilisée. Vérifier la liste ci-dessous.
4. **Rotation secteurs** : ne pas refaire le même secteur principal 2 jours de suite.
5. Source de vérité : `list_posts` (sent + scheduled) sur Buffer + ce fichier.

## Angles DÉJÀ FAITS (ne pas refaire)
| Secteur | Angle | Dates |
|---|---|---|
| Restaurant | Menu / carte du jour modifiable sans réimprimer | 24/08, 26/08, 01/09 |
| Restaurant | Carte de rentrée qui change (carrousel) | 28/08, 01/09 |
| Restaurant | Avis Google sur la table / l'addition / le ticket | 24/08, 26/08, 01/09 |
| Restaurant | Allergènes et carte des vins | 24/08, 31/08 |
| Restaurant | Réservation table du dimanche | 30/08 |
| Restaurant | Chevalet de table à imprimer | 24/08, 01/09 |
| Restaurant | Menu brunch de rentrée | 30/08 |
| Café / salon de thé | WiFi + carte des boissons (carrousel) | 31/08 |
| Boulangerie / artisan | Avis clients | 26/08, 30/08 |
| Boulangerie / artisan | Commande de pain / fournées en vitrine (carrousel) | 30/08 |
| Food truck | Emplacement / menu du jour | 24/08, 26/08, 30/08, 01/09 |
| Hôtel / chambre d'hôtes | Livret d'accueil, petit-déjeuner, bonnes adresses | 24/08, 26/08, 30/08, 01/09 |
| Commerce local | Vitrine : horaires, rentrée, sticker, affichette | 24/08, 26/08, 30/08, 01/09 |
| Épicerie / primeur | Arrivages de la semaine, fiche produit cave à vin | 30/08, 31/08 |
| Traiteur | Click and collect | 31/08 |
| Glacier / crêperie | Parfums du jour | 31/08 |
| Salon / coiffeur | Prise de rendez-vous sur flyer | 26/08 |
| Générique | Supports / modèles prêts à imprimer | 30/08 |
| Bar | Programme des soirées sur le sous-bock (carrousel + reel) | 02/09 |
| Bar / salon | Pourboire dématérialisé sans espèces | 02/09 |
| Commerce | Recrutement « on recrute » en vitrine | 02/09 |
| Boulangerie / café | Carte de fidélité dématérialisée | 02/09 |
| Marché / producteur | Fiche producteur et traçabilité sur l'étal | 02/09 |
| Food truck | Pré-commande pour éviter la file d'attente (carrousel) | 03/09 |
| Food truck | Planning de la semaine par ville | 03/09 |
| Restaurant | Carte des desserts rouverte au moment du café | 03/09 |
| Boulangerie | « Le pain d'aujourd'hui » en vitrine | 03/09 |
| Transverse | Ce que coûte vraiment une réimpression (QR dynamique) | 03/09 |
| Commerce / épicerie | Étiquette produit qui raconte l'histoire | 03/09 |
| Restaurant | Liste d'attente du samedi soir (carrousel + reel) | 04/09 |
| Restaurant | Carte en 4 langues pour les touristes | 04/09 |
| Bar / cave | Vins au verre qui tournent | 04/09 |
| Boulangerie | Invendus du soir / anti-gaspi | 04/09 |
| Marché / producteur | Panier de la semaine | 04/09 |
| Commerce / boutique | Stock disponible en magasin (carrousel + reel) | 05/09 |
| Commerce / boutique | Retours & garantie sur le ticket de caisse | 05/09 |
| Boulangerie | Carte des sandwichs du midi | 05/09 |
| Bar / brasserie | Bières pression du moment | 05/09 |
| Restaurant | Carte enfants : jeu / coloriage sur le set de table (carrousel + reel) | 06/09 |
| Salon / coiffeur | Tarifs et durées des prestations affichés au miroir | 06/09 |
| Traiteur | Formules buffet et demande de devis | 06/09 |
| Commerce / boutique | Carte cadeau dématérialisée | 06/09 |
| Food truck | Le camion privatisé pour un événement (carrousel) | 07/09 |
| Boulangerie | Horaires de fournée / pain chaud annoncé en vitrine | 07/09 |
| Marché / producteur | Calendrier des marchés du mois | 07/09 |
| Food truck | Carte de la semaine par thème | 07/09 |
| Hôtel / chambre d'hôtes | Arrivée tardive en autonomie (code, étage) | 07/09 |
| Restaurant | Service du midi : commande passée à l'assise (carrousel) | 08/09 |
| Restaurant | Carte des softs et sans-alcool | 08/09 |
| Bar | Programme du dimanche sport / matchs diffusés | 08/09 |
| Boulangerie | Commande de gâteau d'anniversaire | 08/09 |
| Salon / coiffeur | Créneau libéré à la dernière minute | 08/09 |
| Bar | Carte des cocktails de saison (carrousel + reel) | 09/09 |
| Restaurant | Plat du jour épuisé signalé en direct | 09/09 |
| Boulangerie | Formule petit-déjeuner à emporter | 09/09 |
| Marché / producteur | Fiche conservation du produit de saison | 09/09 |
| Hôtel / chambre d'hôtes | Plan des transports depuis la gare | 09/09 |
| Restaurant | Second service du soir : la table à rendre à 21 h 15 (carrousel) | 10/09 |
| Restaurant | Plateau de fromages du moment | 10/09 |
| Boulangerie | Pain sur commande pour la semaine | 10/09 |
| Food truck | Moyens de paiement acceptés | 10/09 |
| Salon / coiffeur | Routine d'entretien après un balayage | 10/09 |
| Marché / producteur | Recette du produit de saison sur l'étal (carrousel + reel) | 11/09 |
| Restaurant | Carte du soir écourtée en fin de service | 11/09 |
| Commerce | Horaires exceptionnels affichés en vitrine | 11/09 |
| Food truck | Fiche « où se garer » pour les entreprises | 11/09 |
| Immobilier | Panneau « à vendre » qui montre l'intérieur | 11/09 |
| Bar | Soirée quiz : feuilles de score et comptage à la main (carrousel + reel) | 12/09 |
| Restaurant | Origine des produits / fiche « d'où vient ce plat » | 12/09 |
| Boulangerie | Tournée de livraison aux entreprises | 12/09 |
| Food truck | Formule / abonnement midi des habitués | 12/09 |
| Immobilier | Dossier de location prérempli | 12/09 |

## Angles NEUFS disponibles (piocher ici en priorité)
- Restaurant : plat à emporter du soir · le menu de Noël réservé dès novembre ·
  le brunch du dimanche sur réservation. *(fiche « qui cuisine ce soir » : consommé le 15/09)*
- Bar : happy hour qui change selon l'heure · la carte des bières de saison ·
  la privatisation de l'arrière-salle. *(digestifs et cafés d'après-repas : consommé le 15/09)*
- Boulangerie : commande de galette / bûche selon la saison · liste d'allergènes ·
  les farines et provenances affichées.
- Food truck : le calendrier des fermetures et congés. *(carte allergènes du camion :
  consommé le 15/09)*
- Marché / producteur : la fiche de conservation par légume · le paiement en avance
  du panier mensuel. *(commande groupée / points de dépôt : consommé le 15/09)*
- Commerce : inscription newsletter en caisse · le mode d'emploi de l'article en cabine ·
  la liste d'attente sur un produit en rupture. *(parrainage : consommé le 15/09)*
- Hôtel / chambre d'hôtes : les bonnes adresses du quartier tenues à jour ·
  le petit-déjeuner commandé la veille · le règlement intérieur et les horaires affichés.
- Salon / coiffeur : la carte cadeau du salon ·
  la fiche « ce qu'on a fait sur tes cheveux » remise en fin de rendez-vous ·
  les produits utilisés, référencés et rachetables.
- Immobilier : les diagnostics et le plan sur le panneau · la visite virtuelle depuis la vitrine
  de l'agence.
- **Angles neufs ajoutés le 12/09 (remplacent ceux consommés)** : Bar · le tableau des
  scores de la ligue de fléchettes tenu à jour · la carte des digestifs et cafés d'après-repas.
  Restaurant · la fiche « qui cuisine ce soir » (l'équipe en salle et en cuisine).
  Boulangerie · le pain de la veille à prix réduit annoncé le matin.
  Food truck · le calendrier des fermetures et congés. Immobilier · le récapitulatif des
  charges et taxes du bien. Commerce · la garantie et la notice archivées après l'achat.
- **Angles neufs ajoutés le 15/09 (remplacent les 5 consommés)** : Producteur · la fiche
  de conservation par légume · le paiement en avance du panier mensuel. Bar · la carte des
  vins de producteurs voisins. Food truck · le menu enfant du camion. Restaurant · le
  doggy bag et les restes à emporter. Boutique · la retouche et le SAV suivis en ligne.
  Hôtel · le règlement intérieur et les horaires affichés. Salon · les produits utilisés,
  référencés et rachetables. Immobilier · les diagnostics et le plan sur le panneau.
- Transverse : « ton QR imprimé en 2024 marche encore » (QR dynamique) ·
  le plafond souple (la page ne se coupe pas) · QR statique vs dynamique en 20 s ·
  ce que ton support papier ne te dit pas (mesure) · un support, une page, un chiffre.

## Journal par date
| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 24/08 | restaurant | menu-du-jour-restaurant (carrousel), allergenes-carte-des-vins, avis-google-restaurant-table, avis-google-boulangerie-artisan, food-truck-menu-emplacement-du-jour, livret-accueil-hotel, vitrine-commerce-local-horaires, chevalet-de-table-a-imprimer, menu-restaurant-plat-du-jour | Pinterest, IG |
| 26/08 | avis Google | avis-google-restaurant-table (carrousel), avis-google-restaurant, chevalet-de-table-qr-code-avis-modele, boulangerie-artisan-avis-clients, food-truck-emplacement-du-jour, hotel-petit-dejeuner-chambre, menu-restaurant-carte-du-jour, salon-prise-de-rendez-vous-flyer, sticker-vitrine-commerce-local | Pinterest, IG |
| 28/08 | menu rentrée | menu-restaurant-carte-rentree (carrousel) | Pinterest, IG |
| 30/08 | boulangerie | boulangerie-artisan-commande-rentree (carrousel), avis-google-patisserie-artisan, boulangerie-commande-pain-vitrine, chambre-hotes-petit-dejeuner, food-truck-marche-emplacement-semaine, menu-brunch-restaurant-rentree, primeur-epicerie-arrivages, reservation-restaurant-table-du-dimanche, affichette-a-imprimer-commerce-local | Pinterest, IG |
| 31/08 | café | cafe-salon-de-the-carte-wifi (carrousel), allergenes-carte-restaurant, cafe-wifi-carte-boissons, cave-a-vin-epicerie-fiche-produit, click-and-collect-traiteur, glacier-creperie-parfums-du-jour | Pinterest, IG |
| 01/09 | restaurant | menu-restaurant-carte-de-rentree (carrousel), avis-google-restaurant-addition, chevalet-de-table-a-imprimer, food-truck-emplacement-du-jour, menu-restaurant-carte-du-jour, vitrine-boutique-rentree-commerce | Pinterest, IG |
| 02/09 | bar (100 % inédit) | sous-bock-bar-programme-soirees (carrousel IG + TikTok + reel 32,8 s), sous-bock-bar-concerts-agenda, pourboire-sans-especes-salon-serveur, on-recrute-vitrine-commerce, carte-fidelite-dematerialisee-boulangerie, fiche-producteur-etal-marche | Pinterest, IG, TikTok |

| 03/09 | food truck (100 % inédit) | qr-code-precommande-food-truck-file-attente (carrousel IG + TikTok), qr-code-planning-semaine-food-truck-villes, qr-code-carte-desserts-restaurant-table, qr-code-pain-du-jour-boulangerie-vitrine, qr-code-reimpression-flyer-cout-reel, qr-code-etiquette-produit-histoire-boutique | Pinterest, IG, TikTok |

| 04/09 | restaurant (100 % inédit) | qr-code-liste-attente-samedi-soir-restaurant (carrousel IG + TikTok + reel 30,6 s), qr-code-menu-quatre-langues-touristes-restaurant, qr-code-vins-au-verre-qui-tournent-bar, qr-code-invendus-du-soir-boulangerie-anti-gaspi, qr-code-panier-de-la-semaine-producteur-marche | Pinterest, IG, TikTok |

> Note 04/09 : file Buffer trouvée **vide** (0 post programmé) — les 13 posts du 03/09 sont
> tous partis. Priorité du jour : lancer enfin le **test de placement Pinterest** décrit dans
> DIAGNOSTIC-PINTEREST.md, resté bloqué au stock depuis le 03/09. Les 3 épingles du test
> sortent donc ensemble (dérogation assumée à la règle « un seul contenu de stock par jour » :
> les trois forment une seule expérience, les séparer dans le temps la rendrait illisible).
> Les 4 épingles neuves du jour sont produites et contrôlées mais **mises en réserve** :
> le diagnostic demande de ne pas gonfler la production Pinterest avant la lecture du test.
> Contrôle qualité : **16 visuels, 0 alerte**. Vidéo 30,6 s à publier à la main.
> Dépôt fait, **5 posts mis en file** : carrousel IG (19 h 20 UTC), carrousel photo TikTok
> (18 h 56), et les 3 épingles du test de placement (12 h 46 Productivité au travail,
> 13 h 30 Templates gratuits, 14 h 14 QR code restaurant = témoin).
> Puis les **4 épingles neuves** ont été mises en file à leur tour, volontairement sur les
> tableaux « QR code X » (restaurant ×2, boutique commerce ×2) pour ne pas polluer les
> tableaux historiques du test : **file à 9/10**, 4 tableaux distincts sur la journée.
> Le stock est vide (statut `en-file` partout). Lecture du test : **11/09**.

> Note 03/09 : pas de vidéo (jeudi). Dépôt automatique bloqué par le proxy → dépôt manuel via QRowg-Depot.cmd, puis **7 posts mis en file** (IG carrousel, TikTok carrousel photo, 5 épingles Pinterest sur 4 tableaux). File à 13 posts programmés.

> Note 02/09 : un premier lot « restaurant / carte de rentrée » a été produit puis SUPPRIMÉ de la file car il doublonnait 28/08 et 01/09. Ne pas le reproduire.

## Accroches déjà utilisées
- « Ta carte de rentrée change. Ton QR ne bouge pas. »
- « Le petit sticker qui te ramène des avis 5 étoiles. »
- « Ton menu change. Pas ton QR. »
- « Food truck : affiche ton menu du jour en un scan. »
- « Boulangerie : ta vitrine peut vendre même fermée. »
- « Commerce local : transforme ta vitrine en canal de vente. »
- « Ton mardi soir est vide. Ton sous-bock peut le remplir. »
- « Le sous-bock qui remplit tes soirées creuses. »
- « Plus personne n'a de monnaie. Ton pourboire, si. »
- « Ta vitrine peut te trouver ton prochain serveur. »
- « La carte de fidélité qu'il ne peut plus perdre. »
- « Sur l'étal, un QR qui raconte d'où vient ta tomate. »
- « Ils repartent avant d'avoir commandé. »
- « 12 minutes d'attente = 3 clients perdus. »
- « Où est le camion jeudi ? »
- « Personne ne commande le dessert. Parce que personne ne l'a jamais vu. »
- « Le pain d'aujourd'hui, affiché ce matin. »
- « Ce que coûte vraiment une réimpression. »
- « L'étiquette qui raconte le produit. »
- « Le second service saute pour vingt minutes. »
- « Le plateau change chaque semaine. La carte, jamais. »
- « Le pain de la semaine, commandé dimanche. »
- « Vous prenez la carte ? Vingt fois par service. »
- « Le balayage tient trois mois. Les conseils, 10 min. »
- « Il regarde le potimarron. Il le repose. »
- « 22 h 30 : la moitié de la carte n'existe plus. »
- « Fermé lundi. Le papier scotché dit l'inverse. »
- « Vous venez chez nous ? Et la fiche n'existe pas. »
- « Il photographie le panneau. Il n'appelle jamais. »
- « Complet à 20 h. Vingt couverts perdus. »
- « Un prénom sur un carnet, et personne ne rappelle. »
- « Ta carte en 4 langues. Sans réimprimer. »
- « Les vins au verre tournent. Le support, non. »
- « Les invendus du soir, annoncés à 18 h. »
- « L'été est fini. Ta carte ne le sait pas. »
- « Le mojito en septembre. »
- « Il n'y en a plus. À la troisième table. »
- « 7 h 10. Il a trois minutes avant son train. »
- « Ta courge finit au frigo. Puis à la poubelle. »
- « Depuis la gare, on vient comment ? »
- « Le panier de la semaine, réservé avant l'étal. »
- « "Vous l'avez en 40 ?" Personne ne sait. »
- « Le ticket qui explique le retour. »
- « À midi, la file veut savoir ce qu'il reste. »
- « Les pressions changent. L'ardoise, jamais. »
- « Les enfants ont fini. Les parents demandent l'addition. »
- « Le prix, personne n'ose le demander. »
- « Le devis part par mail. La réponse, jamais. »
- « Offrir sans emballer, ni imprimer. »
- « Il arrive à 23 h. Toi, tu dors. » *(sortie de réserve le 07/09)*
- « Vous faites les événements ? »
- « Le pain sort à 16 h. Personne ne le sait. »
- « Le calendrier du mois, sur ton étal. »
- « Cette semaine, c'est mexicain. »
- « 45 minutes de pause. 20 d'attente. »
- « "Vous avez quoi sans alcool ?" — "Du Coca." »
- « Le match est à 21 h. Personne ne le sait. »
- « Le gâteau se commande. Pas au téléphone à 8 h. »
- « Une annulation à 14 h. Un fauteuil vide à 15 h. »
- « Tu comptes les points à la main. En plein service. »
- « "C'est d'où, la viande ?" Le serveur improvise. »
- « Cinquante salariés à côté. Zéro commande. »
- « Trois midis par semaine. Et toujours la même file. »
- « Douze visites. Douze dossiers incomplets. »
- « Elle habite à trois rues du dépôt. Elle l'ignore. »
- « Après le dessert, plus rien à proposer. »
- « Il y a quoi dans la sauce ? »
- « Qui cuisine ce soir ? »
- « Le parrainage meurt à la caisse. »

| 05/09 | commerce / boutique (100 % inédit) | qr-code-stock-disponible-magasin-boutique (carrousel IG + TikTok + reel 32,2 s), qr-code-retours-garantie-ticket-caisse-boutique, qr-code-carte-sandwichs-du-midi-boulangerie, qr-code-carte-bieres-pression-du-moment-bar | Pinterest, IG, TikTok, X |

> **Note 05/09 — file Buffer trouvée VIDE (0/10)** : les 9 posts du 04/09 sont tous partis.
> Secteur du jour : commerce / boutique, zéro doublon (4 angles neufs, 3 gabarits d'épingle
> distincts : layouts 1, 2 et 3). Contrôle qualité : **15 visuels, 0 alerte**.
> Vidéo Motion 32,2 s, 8 scènes, 8 moteurs différents, palette `or` stable, scrim 0,82 —
> à publier à la main.
> **Dépôt fait** (15 PNG via QRowg-Depot.cmd), puis **5 posts mis en file** :
> carrousel Instagram (20 h 40 UTC), carrousel photo TikTok (15 h 39), et 3 épingles
> Pinterest sur 3 tableaux distincts — QR code boutique commerce (14 h 40),
> QR code food truck (16 h 11), QR code restaurant (17 h 27). **File à 5/10**,
> aucune erreur. Le stock repasse à vide (`en-file` partout).
> Placement volontairement sur les tableaux « QR code X » : le test lancé le 03/09 se
> lit le **11/09**, on ne touche pas aux tableaux historiques d'ici là.
> **Apprentissage Buffer.** Pinterest : *toutes* les épingles publiées depuis le 02/09 sont
> à **0 impression**, y compris les 3 épingles du test de placement (04/09) — tableaux
> historiques ET témoin. Lecture officielle du test le 11/09, mais à J+1 le signal pointe
> déjà vers la cause n°2 du diagnostic (compte / domaine non revendiqué), pas vers le
> placement. TikTok, à l'inverse, distribue vraiment : carrousel photo du 04/09 à
> **273 vues, 58,95 min de visionnage, 12,91 s en moyenne** — contre 3,88 s le 03/09.
> Le temps de visionnage a triplé. C'est le seul canal où le contenu est vu :
> priorité TikTok, volume Pinterest volontairement réduit à **3 épingles** au lieu de 5.

| 06/09 | restaurant · carte enfants (100 % inédit) | qr-code-carte-enfants-jeu-table-restaurant (carrousel IG + TikTok + reel 32,2 s), qr-code-tarifs-durees-prestations-salon-coiffure, qr-code-menu-buffet-reception-traiteur, qr-code-carte-cadeau-dematerialisee-boutique | Pinterest, IG, TikTok |

> **Note 06/09 — file Buffer trouvée VIDE (0/10)**, les 5 posts du 05/09 sont partis.
> Réserve `_STOCK` vide au démarrage (tout en `en-file`) : production 100 % neuve.
> Secteur du jour : **restaurant · carte enfants**, jamais traité. Rotation respectée
> (05/09 = commerce/boutique). 4 angles neufs, 3 gabarits d'épingle distincts
> (layouts 0, 1, 3) sur **3 tableaux distincts** — QR code salon coiffure (premier
> épinglage sur ce tableau), QR code restaurant, QR code boutique commerce.
> Contrôle qualité : **15 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> Vidéo Motion **32,2 s**, 8 scènes, 8 moteurs différents (glitch · shatter · pendulum ·
> scan · focus · publish · stats · portal), palette `or` stable, scrim 0,74,
> `maxDuration: 36` (validateur actif, « rien à signaler ») — **à publier à la main**.
> **Pont d'audience appliqué** : une épingle hors-food maximum par jour. Une première
> épingle « hôtel · arrivée tardive » avait été rendue puis remplacée par le traiteur
> pour tenir cette règle ; elle part en réserve, contrôlée et réutilisable.
> **Dépôt fait** (15 PNG via `QRowg-Depot.cmd`), puis **5 posts mis en file** :
> carrousel Instagram (19 h 07 UTC), carrousel photo TikTok (07/09, 06 h 40) et les
> 3 épingles Pinterest — QR code salon coiffure (10 h 26), QR code restaurant (13 h 17),
> QR code boutique commerce (18 h 27). **File à 5/10**, aucune erreur.
> Le stock repasse à vide (`en-file`), **sauf** l'épingle hôtel gardée en `dispo`.
> **Apprentissage Buffer.** Pinterest : **0 impression sur la totalité des épingles
> publiées depuis le 02/09**, sans exception — y compris les trois épingles du test de
> placement du 04/09, tableaux historiques (Productivité au travail, Templates gratuits)
> **et** témoin (QR code restaurant). Le test est de fait déjà tranché : le placement
> n'est pas la cause. Reste la **cause n°2 du diagnostic — domaine `qrowg.com` non
> revendiqué / compte déclassé**. Produire plus d'épingles ne changera rien tant que ce
> point n'est pas réglé (Paramètres Pinterest → Comptes connectés → revendiquer le site).
> TikTok reste le seul canal distribué : 267 vues le 05/09, mais **4,44 s de visionnage
> moyen contre 12,82 s le 04/09**. Le pic du 04/09 (restaurant · liste d'attente du
> samedi soir) tenait au sujet, pas au format : on garde donc la **restauration en
> tension de service** et on change l'angle — d'où la carte enfants aujourd'hui.
> Instagram : toujours 0 vue, 0 reach sur les carrousels.

| 07/09 | food truck (100 % inédit) | qr-code-camion-privatise-evenement-food-truck (carrousel IG + TikTok), qr-code-horaires-fournee-pain-chaud-boulangerie, qr-code-calendrier-marches-du-mois-producteur, qr-code-carte-de-la-semaine-par-theme-food-truck, qr-code-arrivee-tardive-check-in-autonome-hotel *(sortie de réserve)* | Pinterest, IG, TikTok, LinkedIn |

> **Note 07/09 — file Buffer trouvée à 1/10** : seul reste le carrousel photo TikTok du
> 06/09 (programmé le 07/09 à 06 h 40 UTC). 9 places libres.
> **Étape 0 respectée** : la réserve contenait un seul contenu `dispo`, l'épingle
> **hôtel · arrivée tardive**, sortie aujourd'hui (unique épingle hors-food du jour,
> règle du pont d'audience tenue). Elle a été **re-rendue** avec le slug de campagne du
> jour : son QR portait encore `20260906-restaurant`, ce qui aurait faussé l'attribution.
> Secteur du jour : **food truck**, angle « le camion privatisé pour un événement »,
> jamais traité. Rotation respectée (06/09 = restaurant). Lundi = problème métier dans
> la rotation de la charte.
> 4 épingles, **4 angles distincts**, **4 gabarits distincts (layouts 0, 1, 2, 3)** et
> **4 tableaux distincts** — QR code boutique commerce, QR code food truck,
> Templates gratuits, QR code hôtel (premier épinglage sur ce dernier).
> Contrôle qualité : **16 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> Pas de vidéo (lundi n'est pas un jour vidéo).
> **Dépôt fait** (16 PNG via `QRowg-Depot.cmd`), puis **6 posts mis en file** :
> épingle boulangerie · QR code boutique commerce (12 h 18 UTC), épingle producteur ·
> QR code food truck (14 h 13), carrousel Instagram (16 h 49), épingle food truck ·
> Templates gratuits (18 h 47), épingle hôtel · QR code hôtel (19 h 03) et carrousel
> photo TikTok (08/09, 04 h 40). **File à 6/10**, aucune erreur — le carrousel TikTok
> du 06/09 est parti pendant le run. Le stock repasse à vide (`en-file` partout).
> **Apprentissage Buffer.** Pinterest : **0 impression sur toutes les épingles publiées
> depuis le 02/09**, sans une seule exception, tableaux historiques compris. Le test de
> placement du 03/09 est tranché avant sa date de lecture : **le placement n'est pas la
> cause**. Il ne reste que la cause n°2 du diagnostic — `qrowg.com` non revendiqué /
> compte déclassé. Produire davantage d'épingles ne changera rien tant que ce point
> n'est pas réglé ; le volume reste donc plafonné à 4 et l'action prioritaire est
> Paramètres Pinterest → Comptes connectés → revendiquer le site.
> TikTok reste le seul canal distribué (267 vues le 05/09, 276 le 04/09), mais le
> visionnage moyen retombe à **4,44 s** contre 12,82 s le 04/09 : le pic tenait au sujet
> (restaurant · liste d'attente du samedi soir), pas au format. D'où un angle de
> **tension de service** aujourd'hui encore — la demande d'événement qui meurt en DM.
> Instagram : toujours 0 vue, 0 reach sur les carrousels.

| 08/09 | restaurant · service du midi (100 % inédit) | qr-code-commande-midi-vingt-minutes-restaurant (carrousel IG + TikTok), qr-code-carte-softs-sans-alcool-restaurant, qr-code-programme-dimanche-sport-bar, qr-code-commande-gateau-anniversaire-boulangerie, qr-code-creneau-libere-derniere-minute-salon | Pinterest, IG, TikTok, LinkedIn, X |

> **Note 08/09 — file Buffer trouvée VIDE (0/10)**, les 6 posts du 07/09 sont partis.
> Réserve `_STOCK` vide au démarrage (tout en `en-file`) : production 100 % neuve,
> **zéro doublon** contrôlé contre le journal et contre les 60 derniers posts Buffer.
> Secteur du jour : **restaurant · le service du midi en 20 minutes chrono**, angle
> jamais traité. Rotation respectée (07/09 = food truck). Mardi = pas de vidéo.
> 4 épingles, **4 angles distincts**, **4 gabarits distincts (layouts 0, 1, 2, 3)** et
> **4 tableaux distincts** — QR code restaurant, Templates gratuits, QR code boutique
> commerce, QR code salon coiffure. Pont d'audience tenu : une seule épingle hors-food
> (salon · créneau libéré).
> Contrôle qualité : **16 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> Un correctif de composition en cours de run : sur le gabarit 2, l'eyebrow
> « Boulangerie · commande » passait sous le cadre du QR — tag raccourci à
> « Boulangerie » et épingle re-rendue.
> **Dépôt fait** (16 PNG via `QRowg-Depot.cmd`), puis **6 posts mis en file** :
> épingle restaurant · QR code restaurant (13 h 28 UTC), épingle bar · Templates gratuits
> (14 h 44), carrousel Instagram (15 h 04), épingle boulangerie · QR code boutique
> commerce (18 h 18), épingle salon · QR code salon coiffure (19 h 34) et carrousel photo
> TikTok (09/09, 04 h 05). **File à 6/10**, le stock repasse à vide (`en-file` partout).
> La description de l'épingle boulangerie a été raccourcie à la mise en file (Pinterest
> plafonne à 500 caractères).
>
> **⚠️ CORRIGÉ LE 09/09 — le paragraphe ci-dessous est FAUX.** Les 4 carrousels étaient
> **bien publiés** : `externalLink` le prouve (05/09 `/p/Dc616I8mTiZ/`, 06/09
> `/p/Dc9QC01iWLP/`, 07/09 `/p/Dc_zAPNmK-z/`, 08/09 `/p/DdB95BkloaZ/`). Buffer produit
> une ligne `error` **et** une ligne `sent via network` pour un même post. Les trois
> reprogrammations du 08/09 étaient donc des doublons : deux ont échoué d'elles-mêmes,
> la troisième a été passée en brouillon le 09/09 avant publication. Voir l'en-tête
> « Instagram : un post en `error` peut être EN LIGNE ».
> Le correctif de légende (pas d'URL, 5 hashtags) **reste bon à garder** — mais il n'a
> rien débloqué, puisqu'il n'y avait rien de bloqué.
>
> *Ci-dessous, le raisonnement erroné du 08/09, conservé pour mémoire :*
> **⚠️ DÉCOUVERTE MAJEURE — Instagram ne publie pas.** Le contrôle de la file avec le
> statut `error` fait apparaître **4 carrousels Instagram jamais partis** : 05/09 (stock
> boutique), 06/09 (carte enfants) et 07/09 **deux fois** (camion privatisé, dont une
> reprise), tous rejetés avec *« Instagram flagged this post as potential spam »*.
> Les « 0 vue, 0 reach » notés chaque jour depuis le 02/09 ne mesuraient donc pas une
> mauvaise portée : **le contenu n'a jamais été publié**. Point commun des légendes
> rejetées : une **URL brute complète avec paramètres UTM** + **8 à 10 hashtags**.
> Correctif appliqué immédiatement au carrousel du jour, réédité avant publication :
> plus d'URL dans la légende (« Le lien est dans la bio »), **5 hashtags** au lieu de 10.
> Règle provisoire pour les prochains runs Instagram : jamais d'URL trackée dans la
> légende — elle vit dans la bio — et 5 hashtags maximum. À confirmer demain selon que
> le post du 08/09 passe ou non.
>
> **Rattrapage des 4 posts rejetés, même jour.** Les 3 carrousels uniques ont été
> corrigés (URL retirée, 5 hashtags, `isAiGenerated: true`) et **reprogrammés** via
> `edit_post` + `mode: addToQueue` : stock boutique → 08/09 17 h 35, carte enfants →
> 09/09 07 h 57, camion privatisé → 09/09 16 h 55. Le 4ᵉ était un **doublon** (version
> courte du camion privatisé du 07/09) : laissé en `error`, à supprimer à la main dans
> Buffer — le passer en brouillon par l'API a été refusé par le garde-fou d'écriture.
> **Mention IA activée partout où l'API l'accepte**, à la demande d'Emilien (08/09).
> **Apprentissage Buffer.** Pinterest : **0 impression sur toutes les épingles publiées
> depuis le 02/09**, sans exception, tableaux historiques compris — le test de placement
> du 03/09 est tranché avant sa date de lecture du 11/09 : **le placement n'est pas la
> cause**.
> **CORRECTION FINALE DU 08/09 — tout ce paragraphe est faux.** L'export natif Pinterest
> Analytics (08/08 → 07/09) montre **1 207 impressions**, en hausse de 24,4/j à 80,6/j
> depuis le début de la production quotidienne, **pic à 129 le 07/09**. Les « 0 impression »
> ne venaient que du reporting défaillant de Buffer sur Pinterest. Le test de placement
> est bien lisible et **les tableaux thématiques gagnent largement** (QR code restaurant
> 119 contre Templates gratuits 19). Il n'y a jamais eu de problème de distribution :
> le vrai point faible est la **conversion** (2 clics sortants en 30 jours).
> Voir l'en-tête « Source des chiffres » et `DIAGNOSTIC-PINTEREST.md`.
>
> *Ci-dessous, l'état du raisonnement avant l'export, conservé pour mémoire :*
> **Correction du soir : la cause n°2 était fausse.** Vérification faite dans
> *Paramètres Pinterest → Lien vers Pinterest* : `qrowg.com` est **bien revendiqué**
> (bouton « Ne plus revendiquer » affiché). L'hypothèse « domaine non revendiqué » avait
> été supposée le 03/09 sans vérification d'écran, puis répétée comme un fait les 05, 06
> et 07/09. **Les trois causes du diagnostic sont donc éliminées.**
> Nouvelle piste, appuyée par la découverte Instagram du jour : deux plateformes classent
> le même flux en spam le même jour. Ce n'est probablement ni le tableau, ni le domaine,
> ni le sujet, mais le **motif de publication** — volume automatisé quotidien, visuels
> très proches, lien sortant systématique vers le même domaine, comptes hérités.
> Prochaines vérifications listées dans `DIAGNOSTIC-PINTEREST.md` (mise à jour 08/09) :
> comparer l'analytique **native Pinterest** aux chiffres Buffer avant tout, chercher une
> notification de non-conformité, puis lancer le test « deux épingles manuelles, avec et
> sans lien sortant » qui sépare un domaine filtré d'un compte restreint.
> Volume Pinterest maintenu à 4 épingles tant que ces réponses manquent.
> TikTok reste le seul canal distribué, mais **le visionnage moyen se dégrade** :
> 12,73 s le 04/09 (restaurant · liste d'attente du samedi soir), 9,23 s le 07/09
> (restaurant · carte enfants), **5,29 s aujourd'hui** pour le carrousel food truck du
> 07/09 (98 vues à J+0, contre 272 la veille). Les deux meilleurs scores sont des sujets
> de **restauration en tension de service** ; le food truck décroche. D'où le retour
> franc à ce sujet aujourd'hui, avec un angle neuf (le service du midi).
> Instagram : toujours 0 vue, 0 reach sur les carrousels.


---

## 09/09 — production du jour · DÉPOSÉE ET EN FILE

> **File Buffer trouvée VIDE (0/10)** : les 6 posts du 08/09 sont tous partis.
> **Réserve `_STOCK` vide au démarrage** (tout en `en-file` ou `retiré`) : production 100 % neuve.
> Secteur principal : **bar · la carte des cocktails de saison**, angle jamais traité.
> Rotation respectée (08/09 = restaurant, 07/09 = food truck). Angle saisonnier tissé
> (fin d'été → carte d'automne), conformément à `calendrier-marketing.md`.
> Mercredi = **jour vidéo** : reel de 32,2 s produit, 7 scènes, 7 moteurs distincts,
> palette `or` stable, `scrim` 0,72, validateur « rien à signaler ».
>
> Contrôle qualité : **16 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> 4 épingles, 4 angles distincts, **4 gabarits distincts (layouts 0, 1, 2, 3)** et
> **4 tableaux distincts**. Une seule épingle hors-food (hôtel) : pont d'audience tenu.
> Deux re-rendus ont été nécessaires : les sous-titres des gabarits 0 et 2 orphelinaient
> la flèche en bout de ligne (défaut listé dans `AUDIT-DESIGN-2026-09-03.md`), et le titre
> de l'épingle hôtel rejetait « ? » » seul sur la dernière ligne. Corrigés, revérifiés à l'œil.
>
> **Dépôt fait** (17 PNG via `QRowg-Depot.cmd`), puis **6 posts mis en file**, aucun en erreur :
> épingle restaurant · plat épuisé (12 h 48 UTC), épingle boulangerie · petit-déj (13 h 03),
> épingle producteur · fiche conservation (14 h 19), carrousel Instagram (16 h 55),
> épingle hôtel · plan depuis la gare (17 h 06) et carrousel photo TikTok (20 h 08).
> **File à 6/10**, réserve vide. Mention « contenu généré par IA » posée sur Instagram ;
> non envoyée sur le carrousel photo TikTok (l'API la refuse pour ce format).
> La planche-contact du reel a été déposée avec les visuels (17 PNG au lieu de 16) : elle
> n'est pas publiée, c'est un fichier de contrôle. À exclure du dossier outputs au prochain run.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-carte-cocktails-de-saison-bar-01..06.png | Instagram (carrousel) | — | bar · carte des cocktails de saison · la carte suit la saison, le support ne bouge plus | https://qrowg.com/qr-code/restaurant?utm_source=instagram&utm_medium=carrousel&utm_campaign=20260909-bar | 2026-09-09 |
| en-file | tiktok-qr-code-carte-cocktails-de-saison-bar-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/restaurant?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260909-bar | 2026-09-09 |
| en-file | qr-code-plat-du-jour-epuise-signale-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · plat du jour épuisé · le barrer en 10 secondes | https://qrowg.com/qr-code/menu?utm_source=pinterest&utm_medium=pin&utm_campaign=20260909-bar&utm_content=clic | 2026-09-09 |
| en-file | qr-code-formule-petit-dejeuner-a-emporter-boulangerie.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 1 | boulangerie · formule petit-déjeuner à emporter · le prix lisible en trois minutes | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260909-bar&utm_content=clic | 2026-09-09 |
| en-file | qr-code-fiche-conservation-produit-de-saison-producteur.png | Pinterest | QR code food truck (726416683586817654) — gabarit 2 | marché/producteur · fiche conservation du produit · le produit ne finit plus à la poubelle | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260909-bar&utm_content=clic&utm_term=producteur | 2026-09-09 |
| en-file | qr-code-plan-des-transports-depuis-la-gare-hotel.png | Pinterest | QR code hôtel (726416683586817656) — gabarit 3 | hôtel · plan des transports depuis la gare · le même message n'est plus réécrit à chaque réservation | https://qrowg.com/qr-code/hotel?utm_source=pinterest&utm_medium=pin&utm_campaign=20260909-bar&utm_content=clic | 2026-09-09 |

> La vidéo `qr-code-carte-cocktails-de-saison-bar-reel.mp4` (32,2 s, 1080×1920) reste
> **manuelle** et n'entre jamais dans ce circuit.

## Textes prêts — 09/09

Légendes complètes (Instagram, TikTok, Pinterest ×4, LinkedIn, reel) avec bouton Copier :
`social-a-deposer\2026-09-09\textes-du-jour-2026-09-09.html`.
Bios : `social-a-deposer\2026-09-09\bios-du-jour-2026-09-09.html`.
Pas de post X aujourd'hui (X = mardi, jeudi, samedi).
Résumé des titres et tableaux Pinterest :

### qr-code-plat-du-jour-epuise-signale-restaurant
**Titre Pinterest** : Plat épuisé : le barrer en 10 secondes, sans réimprimer
**Tableau** : QR code restaurant
`#restaurant #platdujour #organisation #qrcode`

### qr-code-formule-petit-dejeuner-a-emporter-boulangerie
**Titre Pinterest** : Formule petit-déj : la monter en 5 minutes, gratuitement
**Tableau** : QR code boutique commerce
`#boulangerie #petitdejeuner #organisation #commercelocal`

### qr-code-fiche-conservation-produit-de-saison-producteur
**Titre Pinterest** : Fiche conservation : la créer en 5 minutes, sans carte bancaire
**Tableau** : QR code food truck
`#marche #producteurlocal #circuitcourt #antigaspi`

### qr-code-plan-des-transports-depuis-la-gare-hotel
**Titre Pinterest** : Plan depuis la gare : la page à faire en 4 étapes
**Tableau** : QR code hôtel — unique épingle hors-food du jour
`#chambredhotes #locationsaisonniere #hotel #organisation`

### Lecture des chiffres — 09/09

- **Le carrousel Instagram du 08/09 est EN LIGNE** malgré son statut `error`
  (« flagged as potential spam ») : un second enregistrement `via: "network"` porte
  `https://www.instagram.com/p/DdB95BkloaZ/`, publié à 15 h 05. **Ne pas le rejouer.**
  Conséquence : le correctif d'hier (pas d'URL en légende, 5 hashtags) **n'a pas empêché
  le flag** — mais le flag n'a jamais empêché la publication non plus. La règle « pas
  d'URL, 5 hashtags » reste bonne en soi, elle ne doit simplement plus servir de
  diagnostic. Le vrai problème Instagram est la portée, pas la publication.
- **Instagram : 0 vue, 0 reach** sur tous les carrousels du 05 au 08/09. Un seul point
  positif : le reel du 07/09 (`/reel/Dc_ugk2MB6R/`) a fait **1 vue, 5,87 s de visionnage**
  — c'est-à-dire le seul format qui sort, même marginalement. Le compte n'a pas d'audience.
- **TikTok reste le seul canal réellement distribué**, mais il redescend :
  255 vues le 07/09 (2,76 s), **267 le 08/09 (4,26 s)**, **81 aujourd'hui à J+0 (4,92 s)**.
  Le temps de visionnage moyen remonte pendant que le volume baisse : le contenu tient
  mieux, il est simplement moins poussé. À relire demain, 81 vues à J+0 n'est pas final.
- **Pinterest : Buffer affiche 0 impression partout — c'est le défaut de reporting connu.**
  Ne rien conclure d'ici. La lecture se fait dans Pinterest Analytics, prochaine échéance
  **le 15/09** pour l'indicateur qui compte, le **clic sortant** (base à battre :
  2 clics / 1 207 impressions sur 30 jours).

### Nettoyage Instagram — 09/09

Sur demande d'Emilien, les **3 enregistrements Buffer bloqués en `error`** ont été
**supprimés** après vérification que leurs publications Instagram existaient bien :
05/09 `/p/Dc616I8mTiZ/`, 06/09 `/p/Dc9QC01iWLP/`, 08/09 `/p/DdB95BkloaZ/`.
(Le 06/09 avait déjà disparu de lui-même : « Document not found ».)
Les publications Instagram elles-mêmes ne sont pas touchées — seuls les doublons
listés dans le tableau plus haut sont à supprimer à la main dans l'appli.

**Buffer est désormais propre** : 0 post en `error`, 0 brouillon, 0 en attente
d'approbation. Plus aucun post rouge ne peut être requeué par erreur.
La règle bloquante « INSTAGRAM — NE JAMAIS PUBLIER DEUX FOIS » s'applique à partir
de maintenant, à chaque run, avant toute mise en file.

### Doublon Instagram intercepté — 09/09, 14 h 42

Un post Instagram a été créé dans Buffer le 09/09 à 14 h 42 (`via: buffer`, auteur
qrowg.com), programmé le **10/09 à 08 h 19**. Il ne vient pas du run marketing du matin.

Contenu : les images du **08/09** (`social/2026-09-08/qr-code-commande-midi-vingt-minutes-*`)
et l'angle « 45 minutes de pause, 20 d'attente » — c'est-à-dire une **republication du
carrousel déjà en ligne** sous `/p/DdB95BkloaZ/`. **Supprimé** sur accord d'Emilien.

**Ce que ça confirme :** le doublon ne vient pas seulement d'un run automatique. Il peut
naître d'une reprise manuelle ou d'un rattrapage lancé après coup, sur des images d'un
jour précédent. D'où l'ajout au contrôle obligatoire :

6. **Vérifier le chemin des images de tout post Instagram programmé.** Si le `source` de
   l'asset pointe vers `social/<date>/` avec une **date antérieure au jour du run**, c'est
   une republication : chercher le `sent` correspondant avant de laisser partir le post.
7. **Contrôler la file au-delà du jour courant.** Un doublon peut être programmé pour
   demain et passer inaperçu si on ne regarde que les créneaux du jour.

Le second dépôt du 09/09 (relancé par Emilien) était **identique au premier** : même
dossier, mêmes fichiers, `x-upsert` écrase en place, mêmes URLs. **Aucune remise en file
n'a été faite** — c'était le bon réflexe, rejouer `create_post` aurait créé six doublons.

---

## 10/09 — production du jour · DÉPOSÉE ET EN FILE

> **Deux doublons interceptés au démarrage.** La file contenait deux posts créés le
> 10/09 à 08 h 05, hors run marketing, tous deux bâtis sur les images du **09/09**
> (`social/2026-09-09/qr-code-carte-cocktails-de-saison-bar-*`) :
> - **Instagram, programmé 10/09 08 h 19** — republication stricte du carrousel cocktails
>   déjà en ligne sous `/p/DdEvUTzFXK6/` (publié le 09/09 à 16 h 55). Intercepté **11
>   minutes** avant sa publication et **passé en brouillon** (`6aa264da284ead110948cf20`).
> - **Pinterest, programmé 10/09 12 h 21** — épingle neuve mais sur l'angle *bar · carte
>   des cocktails de saison* publié la veille, campagne `20260909-bar`, image = couverture
>   du carrousel : violation de la règle des 21 jours et de la rotation des secteurs.
>   **Passée en brouillon** (`6aa264d194192583998c5bf1`).
>
> Rien n'a été supprimé : les deux sont récupérables dans Buffer. Le contrôle n° 6 du
> journal (« vérifier le chemin des images de tout post programmé ») a fonctionné —
> c'est la deuxième fois en deux jours qu'un doublon naît **hors du run quotidien**.
> À surveiller : quelque chose crée des posts vers 08 h 05 sur du contenu de la veille.
>
> **File Buffer réellement disponible : 10/10** après ces deux mises en brouillon.
> **Réserve `_STOCK` vide au démarrage** (`dispo` = 0) : production 100 % neuve.
> Secteur du jour : **restaurant · le second service du soir**, angle jamais traité,
> rotation respectée (09/09 = bar). Jeudi : **pas de vidéo**, mais **post X** au programme.
>
> **Apprentissage Buffer.** TikTok reste le seul canal distribué et il est stable :
> 253 vues le 09/09 (4,48 s) contre 268 le 08/09 (4,25 s) et 272 le 07/09 (9,23 s).
> Les trois meilleurs temps de visionnage du mois sont tous des sujets de **restauration
> en tension de service** — 12,73 s (liste d'attente du samedi), 9,71 s (commande du midi),
> 9,23 s (carte enfants) — pendant que le bar cocktails retombe à 4,48 s. D'où le retour
> assumé au restaurant aujourd'hui, sur le sujet le plus tendu qui reste : le second service.
> Instagram : **0 vue, 0 reach** sur tous les carrousels, sans exception, y compris celui
> du 09/09. Pinterest : Buffer affiche toujours 0 impression — défaut de reporting connu,
> ne rien en conclure, lecture dans Pinterest Analytics le **15/09** (clic sortant).
>
> Contrôle qualité : **16 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> 4 épingles, 4 angles distincts, **4 gabarits distincts (layouts 0, 1, 2, 3)** et
> **4 tableaux distincts**. Une seule épingle hors-food (salon) : pont d'audience tenu.
> Deux re-rendus : le sous-titre de l'épingle boulangerie orphelinait sa flèche (gabarit 1),
> et « dix minutes » cassait la dernière ligne du titre salon — corrigés, revérifiés à l'œil.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-second-service-du-soir-restaurant-01..06.png | Instagram (carrousel) | — | restaurant · second service du soir · la table rendue à temps sans vexer personne | https://qrowg.com/qr-code/restaurant?utm_source=instagram&utm_medium=carrousel&utm_campaign=20260910-restaurant | 2026-09-10 |
| en-file | tiktok-qr-code-second-service-du-soir-restaurant-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/restaurant?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260910-restaurant | 2026-09-10 |
| en-file | qr-code-plateau-de-fromages-du-moment-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · plateau de fromages du moment · la carte suit l'affinage | https://qrowg.com/qr-code/menu?utm_source=pinterest&utm_medium=pin&utm_campaign=20260910-restaurant&utm_content=clic | 2026-09-10 |
| en-file | qr-code-pain-sur-commande-de-la-semaine-boulangerie.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 1 | boulangerie · pain sur commande de la semaine · on ne cuit plus à l'aveugle | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260910-restaurant&utm_content=clic | 2026-09-10 |
| en-file | qr-code-moyens-de-paiement-acceptes-food-truck.png | Pinterest | QR code food truck (726416683586817654) — gabarit 2 | food truck · moyens de paiement acceptés · la question qui revient vingt fois | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260910-restaurant&utm_content=clic | 2026-09-10 |
| en-file | qr-code-routine-entretien-apres-balayage-salon.png | Pinterest | QR code salon coiffure (726416683586817657) — gabarit 3 | salon · routine d'entretien après balayage · les conseils ne s'oublient plus à la voiture | https://qrowg.com/qr-code/salon?utm_source=pinterest&utm_medium=pin&utm_campaign=20260910-restaurant&utm_content=clic&utm_term=salon | 2026-09-10 |

> **Pas de vidéo aujourd'hui** (jeudi n'est pas un jour vidéo). Jour X : le post est dans
> le HTML des textes, publication manuelle.
>
> **Dépôt fait** (16 PNG via `QRowg-Depot.cmd`, aucune planche-contact parasite cette fois),
> puis **6 posts mis en file**, aucun en erreur :
> carrousel Instagram (09 h 04 UTC), épingle restaurant · plateau de fromages (12 h 21),
> épingle boulangerie · pain sur commande (14 h 49), épingle food truck · moyens de
> paiement (16 h 18), épingle salon · routine balayage (18 h 15) et carrousel photo
> TikTok (19 h 16). **File à 6/10**, réserve vide.
> Mention « contenu généré par IA » posée sur Instagram ; non envoyée sur le carrousel
> photo TikTok (l'API la refuse pour ce format).

## Textes prêts — 10/09

Légendes complètes (Instagram, TikTok, Pinterest ×4, LinkedIn, X) avec bouton Copier :
`social-a-deposer\2026-09-10\textes-du-jour-2026-09-10.html`.
Bios : `social-a-deposer\2026-09-10\bios-du-jour-2026-09-10.html`.
Résumé des titres et tableaux Pinterest :

### qr-code-plateau-de-fromages-du-moment-restaurant
**Titre Pinterest** : Plateau de fromages : la carte à mettre à jour en 5 minutes
**Tableau** : QR code restaurant
`#restaurant #fromage #cartedesfromages #commercelocal`

### qr-code-pain-sur-commande-de-la-semaine-boulangerie
**Titre Pinterest** : Pain sur commande : la page à monter en 5 minutes, gratuitement
**Tableau** : QR code boutique commerce
`#boulangerie #painmaison #organisation #commercelocal`

### qr-code-moyens-de-paiement-acceptes-food-truck
**Titre Pinterest** : Moyens de paiement : la fiche à faire en 4 étapes
**Tableau** : QR code food truck
`#foodtruck #streetfood #paiement #commercelocal`

### qr-code-routine-entretien-apres-balayage-salon
**Titre Pinterest** : Routine après balayage : la fiche à créer en 4 étapes
**Tableau** : QR code salon coiffure — unique épingle hors-food du jour
`#salondecoiffure #balayage #routinecheveux #coiffure`

---

## 11/09 — production du jour · DÉPOSÉE ET EN FILE

> **File Buffer trouvée VIDE (0/10)** : les 6 posts du 10/09 sont tous partis, aucun en
> `error`, aucun brouillon parasite programmé. **Réserve `_STOCK` vide** (`dispo` = 0) :
> production 100 % neuve. Aucun post créé hors run ce matin — le phénomène des deux
> jours précédents (création vers 08 h 05 sur du contenu de la veille) **ne s'est pas
> reproduit**. À continuer de surveiller.
>
> Secteur du jour : **marché / producteur · la recette du produit de saison**, angle
> jamais traité et **premier carrousel jamais consacré à ce secteur**. Rotation
> respectée (10/09 = restaurant, 09/09 = bar). C'est aussi le contenu le plus proche
> de l'audience héritée décrite dans `audience-bridge.md` (« Best produce, tips and
> tricks », ~9 400 abonnés food) : pont d'audience joué à fond, saison d'automne tissée.
> Vendredi = **jour vidéo** : reel de **32,2 s**, 7 scènes, 7 moteurs distincts, palette
> `or` stable, `scrim` 0,72, `maxDuration` 36, validateur « rien à signaler ».
> Pas de post X (X = mardi, jeudi, samedi).
>
> **Apprentissage Buffer.** Le carrousel Instagram du 10/09 est bien en ligne
> (`/p/DdGeP3plhkf/`) et fait **0 vue, 0 reach** — comme les six précédents, sans
> exception. TikTok reste le seul canal distribué et **s'érode lentement** :
> 272 vues / 9,23 s le 07/09 → 268 / 4,25 s le 08/09 → 260 / 4,42 s le 09/09 →
> **265 / 3,84 s le 10/09**. Le volume est stable, le temps de visionnage baisse : les
> trois meilleurs scores du mois restent des sujets de **restauration en tension de
> service**. Le sujet du jour garde ce ressort (une vente perdue en direct sur l'étal)
> tout en changeant de secteur. Pinterest : Buffer affiche toujours 0 impression —
> défaut de reporting connu, **ne rien en conclure**. Lecture dans Pinterest Analytics
> le **15/09**, sur le clic sortant (base à battre : 2 clics / 1 207 impressions).
>
> **Tableau neuf mis en test :** l'épingle immobilier part sur **QR code immobilier**,
> tableau **jamais utilisé jusqu'ici**. À relire le 18/09 : un tableau « QR code X »
> vierge démarre-t-il aussi bien que les tableaux thématiques déjà alimentés ?
>
> Contrôle qualité : **16 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> 4 épingles, 4 angles distincts, **4 gabarits distincts (layouts 0, 1, 2, 3)** et
> **4 tableaux distincts**. Une seule épingle hors-food (immobilier) : pont tenu.

### ⚠️ Correctif du jour : longueur d'URL et densité du QR (à retenir)

La slide `qr` du carrousel est sortie **en alerte** : QR présent mais non décodable au
contrôle. Diagnostic mené jusqu'au bout plutôt que contourné :

- Ce n'était **pas** le gabarit ni le `border-radius` du QR héros (testé à 0 : même échec).
- C'est la **longueur de l'URL encodée**. Mesuré sur la même slide, même rendu :
  **104 caractères → décodage seulement à 2 échelles sur 5** ; **97 caractères → 5/5** ;
  **83 caractères → 5/5**.
- Les liens d'épingle passent malgré leur longueur parce que leur QR héros est dessiné
  plus grand ; le QR du carrousel est plus petit, donc plus sensible à la densité.

**Règle ajoutée :** l'URL encodée dans un QR de **carrousel** doit rester **sous
~100 caractères**. Le carrousel du jour encode donc
`?utm_medium=carrousel&utm_campaign=20260911-marche` (83 car., sans `utm_source`) —
ce qui est de toute façon plus honnête : la **même image** part sur Instagram *et*
TikTok, la source n'y a jamais été mesurable. Les liens complets, eux, restent dans
les légendes, la bio et les épingles.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-recette-du-produit-de-saison-etal-marche-01..06.png | Instagram (carrousel) | — | marché/producteur · recette du produit de saison · le produit de saison ne se vend plus seul | https://qrowg.com/qr-code/artisan?utm_source=instagram&utm_medium=carrousel&utm_campaign=20260911-marche | 2026-09-11 |
| en-file | tiktok-qr-code-recette-du-produit-de-saison-etal-marche-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/artisan?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260911-marche | 2026-09-11 |
| en-file | qr-code-carte-du-soir-ecourtee-fin-de-service-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · carte du soir écourtée · ce qui part encore à 22 h 30 | https://qrowg.com/qr-code/menu?utm_source=pinterest&utm_medium=pin&utm_campaign=20260911-marche&utm_content=clic | 2026-09-11 |
| en-file | qr-code-horaires-exceptionnels-vitrine-commerce.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 1 | commerce · horaires exceptionnels · le client ne vient plus pour rien | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260911-marche&utm_content=clic | 2026-09-11 |
| en-file | qr-code-ou-se-garer-entreprises-food-truck.png | Pinterest | QR code food truck (726416683586817654) — gabarit 2 | food truck · fiche « on vient chez vous » · place, accès, électricité, minimum | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260911-marche&utm_content=clic | 2026-09-11 |
| en-file | qr-code-panneau-a-vendre-visite-interieur-immobilier.png | Pinterest | **QR code immobilier (726416683586817652)** — gabarit 3 — *tableau jamais utilisé, test de placement* | immobilier · panneau à vendre · il photographie et n'appelle jamais | https://qrowg.com/qr-code/immobilier?utm_source=pinterest&utm_medium=pin&utm_campaign=20260911-marche&utm_content=clic&utm_term=immobilier | 2026-09-11 |

> La vidéo `qr-code-recette-du-produit-de-saison-etal-marche-reel.mp4` (32,2 s, 1080×1920)
> reste **manuelle** et n'entre jamais dans ce circuit. La planche-contact
> `.sheet.png` est archivée ici mais **exclue du dossier de dépôt** (fichier de contrôle).

## Textes prêts — 11/09

Légendes complètes (Instagram, TikTok, Pinterest ×4, reel, LinkedIn) avec bouton Copier :
`social-a-deposer\2026-09-11\textes-du-jour-2026-09-11.html`.
Bios : `social-a-deposer\2026-09-11\bios-du-jour-2026-09-11.html`.
Pas de post X aujourd'hui (X = mardi, jeudi, samedi).
Résumé des titres et tableaux Pinterest :

### qr-code-carte-du-soir-ecourtee-fin-de-service-restaurant
**Titre Pinterest** : Carte du soir : la raccourcir en 10 secondes, sans réimprimer
**Tableau** : QR code restaurant
`#restaurant #servicedusoir #cartedujour #commercelocal`

### qr-code-horaires-exceptionnels-vitrine-commerce
**Titre Pinterest** : Horaires exceptionnels : la page à monter en 5 minutes
**Tableau** : QR code boutique commerce
`#commercelocal #boutique #horaires #organisation`

### qr-code-ou-se-garer-entreprises-food-truck
**Titre Pinterest** : Venir en entreprise : la fiche à faire en 4 étapes
**Tableau** : QR code food truck
`#foodtruck #streetfood #entreprise #commercelocal`

### qr-code-panneau-a-vendre-visite-interieur-immobilier
**Titre Pinterest** : Panneau à vendre : la page à créer en 4 étapes
**Tableau** : QR code immobilier — unique épingle hors-food, **tableau neuf en test**
`#immobilier #agentimmobilier #venteimmobiliere #qrcode`

### ⚑ Second passage du 11/09 (run planifié rejoué) — RIEN PRODUIT DE NEUF, c'est volontaire

La tâche planifiée s'est déclenchée une **deuxième fois le même jour**. Contrôle fait avant
tout : la production du 11/09 existait déjà (rendue à 12 h 41), la réserve `_STOCK` est à
**0 `dispo`**, et la file Buffer est **vide (0/10)**. Produire un second carrousel Instagram
le même jour est interdit par la règle bloquante du 09/09. **Aucune production nouvelle**,
donc — le run a servi à finir celui de 12 h 41, resté bloqué au dépôt.

**⚠️ Ma conclusion sur le script de dépôt était FAUSSE — voici la bonne (à retenir).**
J'avais lu `QRowg-Depot.ps1` dans `social-a-deposer\2026-09-11\` et conclu qu'il scannait son
propre dossier. **C'est une copie périmée.** Le script réellement utilisé par Emilien est plus
récent : il scanne bien le **dossier `outputs` de la session**, et en plus il **isole
automatiquement les vidéos** vers `C:\Users\PC\Desktop\QRowg-Videos-a-publier\AAAA-MM-JJ\`
au lieu de les déposer. **L'ÉTAPE 5 de la tâche planifiée est donc correcte telle qu'elle est
écrite** : copier les visuels du jour dans `outputs`, c'est ce dossier qui compte.
Leçon de méthode : ne pas déduire le comportement d'un outil d'une copie archivée à côté des
livrables — les dossiers datés contiennent des copies figées du script au jour J.
Le dossier `outputs` est par ailleurs **propre à chaque session** : il était vide au démarrage
de ce run alors que la production de 12 h 41 existait bien. **C'est exactement ce qui a bloqué
le dépôt ce matin** — le premier run avait copié dans son propre `outputs`, devenu inaccessible.

**Actions de ce passage :**
- Planche-contact `*.sheet.png` **sortie du dossier de dépôt** vers `2026-09-11\_controle\` :
  c'est un fichier de contrôle, il avait été déposé par erreur le 09/09. Le dossier de dépôt
  contient donc exactement les **16 PNG** publiables.
- Copie de confort des 16 PNG + zip + HTML + mp4 dans le dossier `outputs` de la session, pour
  que les fichiers soient présentés et ouvrables par Emilien.
- **Contrôle QR refait indépendamment** (décodage OpenCV multi-échelle contre `attendus.json`,
  sans repasser par le générateur) : **8 visuels porteurs de QR, 8 décodés vers l'URL attendue
  exacte, 0 écart**. Les 8 slides sans QR (1, 2, 4, 5 du carrousel et leurs copies TikTok) sont
  conformes : seules les slides 3 et 6 portent le QR. Revue à l'œil : couverture du carrousel et
  épingle immobilier (gabarit 3) propres — modules sombres sur plaque or, flèche non orphelinée,
  `qrowg.com` lisible.
- Durée du reel confirmée par ffprobe : **32,2 s**.

**Instagram — post en `error` constaté, NON rejoué** (règle du 09/09 appliquée) :
`6aa2e48aeb97ca19e9d5d533`, carrousel « second service du soir » du 10/09, créé le 10/09 à
17 h 10 pour le 11/09 05 h 27, rejeté « flagged this post as potential spam ». C'est un
**doublon** du carrousel du 10/09 déjà en ligne (`/p/DdGeP3plhkf/`), issu du phénomène de
re-création automatique hors run. **Laissé en `error`, à supprimer à la main dans Buffer.**
Le phénomène s'est donc bien reproduit cette nuit, contrairement à ce qui était noté ce matin :
à surveiller à chaque run.

**DÉPÔT FAIT ET FILE REMPLIE — run clos.** Emilien a lancé `QRowg-Depot.cmd` : **16 images
déposées**, vidéo isolée automatiquement vers `QRowg-Videos-a-publier\2026-09-11\`. Présence
vérifiée en base (`storage.objects`, préfixe `social/2026-09-11/`) : **16 objets**.
Puis **6 posts mis en file**, aucun en erreur, dans l'ordre prescrit :

| heure UTC | canal | contenu | tableau |
|---|---|---|---|
| 12 h 46 | Pinterest | épingle restaurant · carte du soir écourtée | QR code restaurant |
| 13 h 30 | Pinterest | épingle commerce · horaires exceptionnels | QR code boutique commerce |
| 14 h 14 | Pinterest | épingle food truck · « on vient chez vous » | QR code food truck |
| 15 h 58 | Pinterest | épingle immobilier · panneau à vendre | **QR code immobilier (tableau neuf)** |
| 18 h 56 | TikTok | carrousel photo, copies `tiktok-` 1080×1350 | — |
| 19 h 20 | Instagram | carrousel 6 slides 2160×2700 | — |

**File à 6/10**, réserve `_STOCK` toujours vide (rien n'a eu à partir au stock : les 6 posts du
jour sont tous entrés). Dimensions confirmées côté Buffer : TikTok en 1080×1350 (sous le
plafond de 2 073 600 px), Instagram en 2160×2700, épingles en 2000×3000.
Mention « contenu généré par IA » posée sur Instagram ; **non envoyée** sur le carrousel photo
TikTok (l'API la refuse sur ce format).

| 12/09 | bar · soirée quiz (100 % inédit) | qr-code-soiree-quiz-feuilles-de-score-bar (carrousel IG + TikTok + reel 32,2 s), qr-code-origine-des-produits-fiche-plat-restaurant, qr-code-tournee-livraison-entreprises-boulangerie, qr-code-abonnement-midi-habitues-food-truck, qr-code-dossier-de-location-prerempli-immobilier | Pinterest, IG, TikTok, X |

> **Note 12/09 — file Buffer trouvée à 1/10**, 9 places libres. Réserve `_STOCK` **vide**
> au démarrage (aucun `dispo`) : production 100 % neuve, zéro doublon contrôlé contre ce
> journal et contre les 30 derniers posts Buffer.
> Secteur du jour : **bar · la soirée quiz**, angle jamais traité. Rotation respectée
> (11/09 = marché/producteur). Samedi = jour vidéo **et** jour X ; pas de LinkedIn.
> 4 épingles, **4 angles distincts**, **4 gabarits distincts (layouts 0, 1, 2, 3)** et
> **4 tableaux distincts** — QR code restaurant, QR code boutique commerce, QR code food
> truck, QR code immobilier. Pont d'audience tenu : une seule épingle hors-food
> (immobilier · dossier de location).
> **Contrôle qualité : 16 visuels, 0 alerte.** Contrôle QR refait indépendamment
> (décodage OpenCV multi-échelle contre `attendus.json`) : **8 visuels porteurs de QR,
> 8 décodés vers l'URL attendue exacte, 0 écart**. URL du carrousel à **83 caractères**
> (règle des ~100 du 11/09 respectée). Revue à l'œil : couverture, slide CTA et les
> 4 gabarits d'épingle propres, modules sombres sur plaque or, flèches non orphelinées.
>
> **Vidéo Motion 32,2 s** (ffprobe), 1080×1920, 7 scènes, **7 moteurs différents**
> (orbit · rain · swarm · focus · ripple · radar · bloom), palette `or`, `scrim: 0,82`,
> `maxDuration: 36` (validateur actif, seul l'avertissement de durée). **À publier à la main.**
>
> **⚠️ Correctif du jour : la palette `or` contient du turquoise.** Premier jet rendu avec
> `maze`, `mosaic` et `equalizer` : la planche-contact est sortie **massivement turquoise**,
> hors charte noir/or. Cause trouvée dans `qrowg-motion.js` — `PALETTES.or` vaut
> `[gold, orange, turq, gold clair, gold]` : le **turquoise est natif de la palette**. Les
> moteurs à **grille** (maze, mosaic, equalizer, typegrid, lattice) échantillonnent toute la
> palette sur des centaines de cellules et exposent donc le turquoise en grand ; les moteurs
> à **particules** (orbit, rain, swarm, ripple, radar, bloom, drift, starfield) n'en montrent
> que des points isolés.
> **Règle ajoutée : sur palette `or`, éviter les moteurs à grille.** Préférer les moteurs à
> particules, et **toujours regarder la planche-contact avant le rendu** — c'est elle qui a
> attrapé l'écart. `scrim` monté de 0,74 à 0,82 dans la foulée pour la lisibilité des sous-titres.
>
> **⚠️ Doublon auto-recréé, TOUJOURS EN FILE — à traiter à la main.** Post Buffer
> `6aa436077caf1cf172b98393` : Pinterest, programmé le **12/09 à 14 h 40 UTC**, créé le
> 11/09 à 17 h 10 hors run. Il porte la **légende Instagram du 11/09** (marché · recette du
> produit de saison) collée sur la **couverture du carrousel** `...-01.png` en 2160×2700 —
> contenu déjà publié le 11/09 sur Pinterest **et** sur Instagram (`/p/DdKJhKRm8bc/`).
> Le phénomène de re-création automatique noté les 10 et 11/09 **se reproduit donc chaque nuit**.
> Tentative de bascule en brouillon **refusée par le garde-fou d'écriture** de la session :
> **à passer en brouillon ou à supprimer à la main dans Buffer.**
>
> **Apprentissage Buffer.** TikTok reste le seul canal réellement distribué, mais le
> visionnage moyen **s'érode quatre jours de suite** : 9,68 s le 09/09 (bar · cocktails,
> 2 réactions, 1 partage, 1,18 % d'engagement) → 3,80 s le 10/09 → **3,65 s le 11/09**,
> à volume de vues stable (254 → 268 → 257). Le pic du 09/09 tenait au **sujet bar**, pas
> au format : d'où le retour au bar aujourd'hui, avec un angle neuf (la soirée quiz).
> Instagram : toujours **0 vue, 0 reach** sur tous les carrousels — problème d'audience,
> pas de publication. Pinterest : ne pas lire les impressions dans Buffer (défaut de
> reporting établi le 08/09), la vérité est dans Pinterest Analytics natif.
>
> **DÉPÔT FAIT ET FILE REMPLIE — run clos.** Emilien a lancé `QRowg-Depot.cmd` : **16 images
> déposées** sous `social/2026-09-12/`, vidéo isolée automatiquement vers
> `QRowg-Videos-a-publier\2026-09-12\`. Puis **6 posts mis en file**, aucun en erreur,
> dans l'ordre prescrit :
>
> | heure UTC | canal | contenu | tableau |
> |---|---|---|---|
> | 15 h 39 | TikTok | carrousel photo, copies `tiktok-` 1080×1350 | — |
> | 16 h 11 | Pinterest | épingle restaurant · origine des produits | QR code restaurant |
> | 17 h 27 | Pinterest | épingle boulangerie · livraison aux entreprises | QR code boutique commerce |
> | 20 h 40 | Instagram | carrousel 6 slides 2160×2700 | — |
> | 21 h 29 | Pinterest | épingle food truck · formule des habitués | QR code food truck |
> | 13/09 10 h 26 | Pinterest | épingle immobilier · dossier de location | QR code immobilier |
>
> Dimensions confirmées côté Buffer : TikTok **1080×1350** (sous le plafond de 2 073 600 px),
> Instagram **2160×2700**, épingles **2000×3000**. Mention « contenu généré par IA » posée sur
> Instagram ; **non envoyée** sur le carrousel photo TikTok (l'API la refuse sur ce format).
> **File à 7/10** en comptant le doublon auto-recréé resté programmé ; **6/10** une fois
> celui-ci supprimé. Réserve `_STOCK` **vide** : les 6 posts du jour sont tous entrés,
> rien n'a eu à partir au stock.
>
> **Incident de mise en file :** la première tentative de création de l'épingle restaurant a
> renvoyé un **504 (timeout 30 s)**. Contrôle fait avant de relancer (`list_posts` sur le canal
> Pinterest) : **le post n'avait pas été créé**. Relance propre, aucun doublon produit.
> *Règle : après un 504 sur un `create_post`, toujours vérifier la file avant de réessayer.*
>
> **Post Instagram en `error` du 11/09 — NON rejoué** (règle du 09/09 appliquée) :
> `6aa3dd3a5a67efa86a9733d1`, carrousel « recette du produit de saison », rejeté
> « flagged as potential spam ». Contrôle `sent` + `externalLink` : le post
> `6aa4a3efe57597c26e5a339d` est parti le 11/09 à 19 h 20 et **est en ligne**
> (`/p/DdKJhKRm8bc/`). Laissé en `error`, à supprimer à la main.

---

## 13/09 — production du jour · DÉPOSÉE ET MISE EN FILE

> **Secteur du jour : restaurant · anniversaire et privatisation de la salle**, angle
> jamais traité. Rotation respectée (12/09 = bar). Réserve `_STOCK` **vide** au
> démarrage : production 100 % neuve. Dimanche = jour vidéo.
> **Zéro doublon** : aucun slug, aucun couple (secteur, angle) et aucune accroche déjà
> vus dans ce journal ni dans Buffer (`sent` sur 45 posts + `scheduled` + `error` + `draft`).
> 4 épingles, **4 angles distincts**, **4 gabarits distincts (0, 1, 2, 3)** et
> **4 tableaux distincts**. Une seule épingle hors-food (boutique · notice) : pont tenu.
> Contrôle qualité : **16 visuels, 0 alerte**, les 8 QR décodés vers leur lien tracké.
> Revue à l'œil : couverture + une épingle de chaque gabarit. L'épingle boulangerie a été
> re-rendue une fois — le guillemet fermant s'orphelinait en bout de titre.
>
> **Dépôt fait** (16 PNG via `QRowg-Depot.cmd`), puis **6 posts mis en file** :
> épingle boulangerie · farines (13 h 17 UTC, QR code boutique commerce),
> épingle producteur · vente à la ferme (18 h 27, QR code food truck),
> carrousel Instagram (19 h 07), épingle food truck · festivals (19 h 11, QR code
> restaurant), carrousel photo TikTok (14/09, 06 h 40) et épingle boutique · notice
> (14/09, 12 h 18, **Avis Google commerce** — premier épinglage sur ce tableau).
> **File à 6/10**, aucune erreur, réserve `_STOCK` de nouveau **vide**.
> Rien n'est parti au stock : les 16 visuels tenaient tous dans la file.
>
> **Ménage Buffer du jour** : le post TikTok `6aa69d38eba7bc56779655dc`, créé le 13/09 à
> 12 h 55 pour le 14/09 à 06 h 40, **rejouait à l'identique le carrousel quiz du 12/09
> déjà publié** (tiktok.com/…/7684674117684972833, 250 vues). Passé en **brouillon**,
> pas supprimé. La file Buffer est donc à **0/10**.
>
> **Instagram — contrôle obligatoire fait, puis nettoyé.** Deux posts en `error`
> (« flagged as potential spam ») encombraient la file et affichaient un bouton
> **Retry Now** : `6aa3dd3a5a67efa86a9733d1` (11/09, marché · recette du potimarron) et
> `6aa54d69c637430b6b56fe1b` (12/09, bar · soirée quiz). Les deux ont été confrontés aux
> posts `sent` du canal : **ils sont en ligne** — `/p/DdKJhKRm8bc/` (11/09 21 h 20) et
> `/p/DdM3eavI0m-/` (12/09 22 h 40), aux horaires exacts de leur `dueAt`. Cliquer sur
> Retry aurait publié un doublon, exactement le scénario du 07/09.
> **Les deux sont passés en brouillon**, avec en tête de légende un avertissement
> `[DÉJÀ EN LIGNE — NE PAS RETRY]` et le permalien Instagram. Ils ne sont pas supprimés.
> La file Buffer ne contient donc plus que les 6 posts du jour.
>
> ⚑ **À retenir pour les prochains runs :** le statut `error` d'Instagram reste affiché
> indéfiniment et repeuple l'onglet Queue. Le réflexe n'est pas de le corriger mais de
> le **vider en brouillon après vérification** — sinon le bouton Retry finit par être
> cliqué à la main, et le doublon part.
>
> **Apprentissage Buffer.** TikTok reste le seul canal réellement distribué : 250 à 272
> vues par carrousel photo, très stable. Le temps de visionnage moyen, lui, s'effondre —
> **9,68 s le 09/09 et 9,23 s le 07/09 contre 2,47 s le 12/09**. Les deux meilleurs sont
> aussi les deux publiés **tôt le matin (04 h 06 et 06 h 41 UTC)** et portaient un sujet
> « carte qui change avec la saison » (cocktails de saison, camion privatisé). Sujet à
> garder, angle à renouveler, créneau matinal à privilégier pour TikTok.
> Instagram : 0 vue, 0 reach sur tous les carrousels — les posts sortent et ne touchent
> personne. Pinterest : les `metrics` Buffer restent inexploitables (0 à 4 impressions,
> défaut de reporting connu) ; la lecture se fait dans Pinterest Analytics, prochaine
> échéance le **15/09** pour l'indicateur « clic sortant » de la série `utm_content=clic`.

| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 13/09 | restaurant · anniversaire (100 % inédit) | qr-code-anniversaire-privatisation-salle-restaurant (carrousel IG + TikTok + reel 32,2 s), qr-code-farines-et-provenances-affichees-boulangerie, qr-code-vente-a-la-ferme-hors-marche-producteur, qr-code-tournee-festivals-dates-et-scene-food-truck, qr-code-notice-et-mode-d-emploi-du-produit-boutique | Pinterest, IG, TikTok |

### Angles basculés en « déjà faits » le 13/09
| Secteur | Angle | Dates |
|---|---|---|
| Restaurant | Anniversaire / privatisation de la salle, demande de groupe (carrousel + reel) | 13/09 |
| Boulangerie | Les farines et provenances affichées | 13/09 |
| Marché / producteur | La vente à la ferme hors marché | 13/09 |
| Food truck | Le camion en tournée de festival (dates et scène) | 13/09 |
| Commerce / boutique | La notice et le mode d'emploi du produit sans papier | 13/09 |

### Accroches ajoutées le 13/09 (ne plus réutiliser)
- « Une table de 14, demandée à 23 h par SMS. »
- « Tu réponds lundi. Ils ont réservé ailleurs dimanche. »
- « D'où vient ta farine ? »
- « Tu vends aussi à la ferme. Personne ne le sait. »
- « Le camion joue le festival. Mais où, exactement ? »
- « La notice est pliée en huit. Elle finit à la poubelle. »

### Angles NEUFS ajoutés le 13/09 (remplacent les cinq consommés)
- Restaurant · le menu enfant allergènes remis aux parents avant de commander.
- Boulangerie · la commande de pain de mie et brioches pour un événement de famille.
- Marché / producteur · le calendrier des semis et des récoltes affiché sur l'étal.
- Food truck · la fiche « nos allergènes » du camion.
- Commerce / boutique · la liste d'attente sur un produit en rupture.
- Bar · le tableau des scores de la ligue de fléchettes (déjà en réserve, non consommé).

---

## 14/09 — lundi · salon / coiffeur (100 % inédit)

> **Étape 0 (hygiène Buffer) :** 1 post `error` Instagram (carrousel anniversaire du 13/09,
> `dueAt` 19 h 07) confronté aux `sent` du canal → un `sent` à **19 h 07 min 42 s**,
> permalien `https://www.instagram.com/p/DdPRnIimsFM/` : **le post était en ligne**.
> Passé en brouillon avec `[DÉJÀ EN LIGNE — NE PAS RETRY]`, métadonnées Instagram
> repassées. Onglet `error` **vide**. Côté `scheduled` : 1 seul post (épingle boutique du
> 13/09, due aujourd'hui 12 h 18), slug absent des `sent` → **pas un doublon, conservé**.
> **9 places libres.**
>
> **Apprentissage :** Supermetrics non appelé (essai expiré). Buffer ne mesure pas
> Pinterest — aucune hypothèse tirée de ses `metrics`. TikTok : le carrousel photo du
> 13/09 est sorti ce matin à 06 h 41 (`7685277033768766752`), trop récent pour lire un
> temps de visionnage exploitable ; prochaine lecture demain. Échéance Pinterest
> Analytics « clic sortant » (`utm_content=clic`, base 0,17 %) : **demain 15/09**.
>
> **Dépôt fait en cours de run** (16 PNG déposés via `QRowg-Depot.cmd`), puis **6 posts
> mis en file** : épingle producteur (14 h 13 UTC), carrousel Instagram (16 h 49),
> épingle hôtel (18 h 47), épingle restaurant (19 h 03), carrousel photo TikTok
> (15/09, 04 h 40), épingle immobilier (15/09, 13 h 28). Relecture `list_posts` après
> coup : **7 `scheduled` exactement** (les 6 du jour + l'épingle boutique du 13/09),
> ni plus ni moins. **File à 7/10.** Réserve repassée à vide.
> Premier épinglage sur le tableau **QR code hôtel**.

| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 14/09 | salon · fiche technique couleur (100 % inédit) | qr-code-fiche-technique-couleur-formule-salon (carrousel IG + TikTok), qr-code-calendrier-semis-et-recoltes-etal-producteur, qr-code-bonnes-adresses-du-quartier-hotel, qr-code-objets-oublies-vestiaire-restaurant, qr-code-charges-et-taxes-du-bien-immobilier | Pinterest, IG, TikTok, LinkedIn |

| 15/09 | marché / producteur · points de dépôt (100 % inédit) | qr-code-points-de-depot-commande-groupee-producteur (carrousel IG + copies TikTok en réserve), qr-code-digestifs-et-cafes-apres-repas-bar, qr-code-carte-allergenes-du-camion-food-truck, qr-code-equipe-en-cuisine-ce-soir-restaurant, qr-code-parrainage-client-en-caisse-boutique | Pinterest, IG, LinkedIn, X |

> **Note 15/09 — TikTok bloqué par la garde 0.D.** Étape 0 : onglet `error` **vide**
> (aucune purge à faire). Un seul post `scheduled` au démarrage (épingle immobilier du
> 14/09, due aujourd'hui 13 h 28 UTC) — pas un doublon. **9 places libres.**
> Garde 0.D : un carrousel photo TikTok du 14/09 (angle salon) est parti ce matin à
> **04 h 42 UTC** → interdiction d'en créer un second aujourd'hui. Les 6 copies
> `tiktok-` du carrousel producteur partent donc au **stock en `dispo`**.
> Instagram : 0 post du jour → carrousel autorisé.
> Détection 0.E : aucun post créé dans les 6 dernières heures hors session (le run
> concurrent de 17 h 10 UTC n'était pas encore passé à l'heure du run, 11 h 38 UTC).
> Réserve **vide** au démarrage (tout en `en-file`) : production 100 % neuve.
> Contrôle qualité : **16 visuels, 0 alerte**, les 8 QR décodés vers leur lien tracké.
> Un défaut typographique attrapé à l'œil sur l'épingle restaurant (le « ? » orphelin
> en fin de titre) → titre raccourci de « Qui est en cuisine ce soir ? » à
> « Qui cuisine ce soir ? », épingle re-rendue seule, QC repassé à 0 alerte.
> **Dépôt fait**, puis **5 posts mis en file** : épingle bar (14 h 44 UTC), carrousel
> Instagram (15 h 04), épingle food truck (18 h 18), épingle restaurant (19 h 34) et
> épingle boutique (16/09, 12 h 48). Avec l'épingle immobilier du 14/09, **file à 6/10**,
> relue après coup : le compte correspond exactement, ni plus ni moins.
> Les 6 copies `tiktok-` restent seules au stock en `dispo`, à réinjecter le 16/09.
> Buffer a refusé une première version de la description Pinterest boutique (> 500
> caractères) : raccourcie, acceptée. À surveiller, la limite n'avait jamais mordu.
> Pas de vidéo (mardi). LinkedIn et X à publier à la main.

---

## 16/09 — mercredi · boulangerie (jour vidéo) · RUN PARALLÈLE DÉTECTÉ EN DIRECT

> **Étape 0 (hygiène Buffer) — 2 posts `error`, les deux Instagram, les deux
> confrontés aux `sent` du canal.** L'index des `sent` était à jour (une épingle
> Pinterest partie le jour même à 12 h 48 y figurait) et **aucun post Instagram n'y
> apparaît ni le 15 ni le 16/09** : les deux `error` ne sont donc **jamais sortis**.
> 1. `6aa9a976…` (`dueAt` 16/09 07 h 57, image unique, créé **hors run** le 15/09 à
>    22 h 24) → passé en **brouillon** `[DOUBLON — NE PAS PUBLIER]` : il réutilise à
>    l'identique le visuel de l'épingle déjà publiée le 15/09 à 19 h 34
>    (`https://www.pinterest.com/pin/726416614946064037`, angle « équipe en cuisine »)
>    et porte une URL dans la légende, ce que la règle Instagram interdit.
> 2. `6aa931de…` (`dueAt` 15/09 15 h 04, carrousel producteur « points de dépôt »,
>    6 slides, légende déjà conforme) → **remis en file** (`addToQueue`), il devient
>    **l'unique post Instagram du jour**, programmé à **16 h 55 UTC**.
> Onglet `error` **vide** à la sortie de l'étape 0.
>
> **`scheduled` au démarrage : 0.** La file était entièrement vide (tous les posts du
> 15/09 sont partis). **10 places libres.**
>
> **Garde 0.D.** Après remise en file du carrousel producteur, Instagram compte 1 post
> aujourd'hui → **aucun carrousel Instagram neuf créé**. TikTok comptait 0 post
> (comptage refait juste avant le `create_post`) → les **6 copies `tiktok-` du stock
> ont été réinjectées**, programmées à **20 h 08 UTC**. Le stock repasse en `en-file`.
>
> **Détection 0.E — un run parallèle a écrit dans les mêmes dossiers PENDANT ce run.**
> Horodatages 15 h 07 min 55 s à 15 h 07 min 56 s (heure de Paris), entre deux de mes
> propres écritures : il a déposé dans `2026-09-16\` un secteur **hôtel**
> (`qr-code-petit-dejeuner-commande-la-veille-hotel-reel.mp4`,
> `qr-code-reglement-interieur-et-horaires-hotel.png`), plus
> `qr-code-farines-et-provenances-du-pain-boulangerie.png` et
> `qr-code-calendrier-fermetures-et-conges-food-truck.png`, et **a écrasé mes
> `content.json` / `attendus.json` / `qr-code-doggy-bag-restes-a-emporter-restaurant.png`**.
> Mes versions ont été resauvegardées sous `content-run-boulangerie.json`,
> `attendus-run-boulangerie.json` et
> `qr-code-doggy-bag-restes-a-emporter-restaurant__run-boulangerie.png`.
> **Deux collisions d'angle à surveiller** : *food truck · fermetures et congés* et
> *restaurant · doggy bag* ont été produits **deux fois**, par les deux runs, avec des
> slugs proches mais des liens trackés différents. Ne déposer qu'une seule version.
> Côté Buffer, le run parallèle **n'a rien mis en file** : relecture après coup,
> **exactement 2 `scheduled`**, les deux créés par ce run, ni plus ni moins.
>
> **Apprentissage.** Supermetrics non appelé (essai expiré). Buffer ne mesure pas
> Pinterest : aucune hypothèse tirée de ses `metrics`. TikTok : le carrousel photo du
> 14/09 est sorti le 15/09 à 04 h 42, le suivant part ce soir — pas encore de temps de
> visionnage exploitable sur la série producteur, lecture demain. Clic sortant
> Pinterest (`utm_content=clic`, base 0,17 %) : à lire dans Pinterest Analytics.
>
> **Production du jour (secteur principal : boulangerie).** Pas de carrousel (garde
> 0.D), donc **4 épingles + 1 vidéo**. Épingles : 3 sujets food (restaurant, food truck,
> bar) + **1 seule hors-food** (salon), **4 tableaux distincts**, **4 gabarits distincts**
> (layouts 0, 1, 2, 3). Vidéo Motion : 31,4 s, 6 scènes, **6 moteurs différents**,
> palette `or` stable, `scrim` 0,72, `maxDuration: 36` posé dans le clip (validateur
> laissé actif : « rien à signaler »). Planche-contact regardée avant le rendu final,
> durée confirmée par ffprobe.
>
> **Contrôle qualité : 4 visuels, 0 alerte**, les 4 QR décodés vers leur lien tracké.
> Relecture à l'œil des 4 gabarits : pas de mot orphelin ni de ponctuation en bout de
> titre (le « ? » de l'épingle bar tombe en milieu de ligne).
>
> **Dépôt NON fait** (exécution automatique, personne pour lancer `QRowg-Depot.cmd`).
> Les 4 épingles partent donc au **stock en `dispo`**. La vidéo reste **manuelle**.

| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 16/09 | boulangerie · pain de la veille à prix réduit (vidéo) | qr-code-pain-de-la-veille-prix-reduit-boulangerie-reel (31,4 s), qr-code-doggy-bag-restes-a-emporter-restaurant, qr-code-fermetures-et-conges-du-camion-food-truck, qr-code-vins-de-producteurs-voisins-bar, qr-code-carte-cadeau-du-salon-coiffure | Pinterest (en attente de dépôt), Instagram + TikTok (contenus repêchés), LinkedIn |

### Angles consommés le 16/09
- Boulangerie · le pain de la veille à prix réduit annoncé le matin *(vidéo)*.
- Restaurant · le doggy bag et les restes à emporter.
- Food truck · le calendrier des fermetures et congés.
- Bar · la carte des vins de producteurs voisins.
- Salon · la carte cadeau du salon.

### Angles NEUFS ajoutés le 16/09 (remplacent les cinq consommés)
- Boulangerie · la commande de galette / bûche ouverte deux mois à l'avance.
- Restaurant · le brunch du dimanche sur réservation, avec le nombre de places restantes.
- Food truck · le menu enfant du camion.
- Bar · la privatisation de l'arrière-salle, disponibilités et capacité.
- Salon · la fiche « ce qu'on a fait sur tes cheveux » remise en fin de rendez-vous.
- Hôtel · le petit-déjeuner commandé la veille *(⚠ produit par le run parallèle le
  16/09 — vérifier avant de le rejouer)*.

### Accroches nouvelles (ne pas réutiliser)
- « Il reste la moitié du plat. Personne n'ose demander. »
- « Fermé trois semaines. Ils viennent quand même. »
- « Ce vin vient d'où ? Tu réponds de mémoire. »
- « La carte cadeau dort au fond d'un tiroir. »
- « Il te reste 14 pains. À 18 h, ils partent à la poubelle. »

---

## 16/09 — mercredi · hôtel / hospitalité (100 % inédit, non déposé)

> **Étape 0 (hygiène Buffer) : 2 posts `error`, tous deux Instagram, aucun en ligne.**
> Confrontés aux 20 derniers `sent` du canal : le dernier envoi Instagram réel est le
> **14/09 à 18 h 51** — rien les 15 et 16/09. Les deux `error` ne sont donc jamais sortis,
> contrairement au cas du 13 et du 14/09. Traitement différencié :
> · `6aa931de…` (carrousel producteur « points de dépôt », 6 slides, `dueAt` 15/09 15 h 04,
>   erreur « unknown error ») : format conforme, lien en bio, 5 hashtags → **remis en file**,
>   reprogrammé au 16/09 16 h 55 UTC. C'est le post Instagram du jour.
> · `6aa9a976…` (`dueAt` 16/09 07 h 57, « flagged as potential spam ») : **passé en brouillon**.
>   Il porte une URL dans la légende (interdit sur Instagram, cause probable du flag) et son
>   visuel est une épingle unique 2000×3000, pas un carrousel. Le run parallèle a complété la
>   note après coup : ce visuel est **déjà publié en épingle Pinterest le 15/09 à 19 h 34**
>   (angle « équipe en cuisine »), donc c'est aussi un doublon de visuel. Note conservée.
> Onglet `error` **vide** à la fin de 0.A. Côté `scheduled` : **file trouvée vide** (0 post),
> les 8 autres entrées étaient des brouillons déjà annotés par les runs précédents.
> **Places libres : 10 − 0 = 10.**
>
> **Garde 0.D.** Instagram : 1 `scheduled` (le carrousel remis en file) + 1 `draft` du jour
> → **aucun post Instagram créé**. TikTok : libre au démarrage (0 post), mais **servi par le
> run parallèle à 12 h 59 min 59 s** (carrousel photo du stock, dueAt 20 h 08 UTC) → **aucun
> post TikTok créé** non plus. Les deux canaux quotidiens sont pourvus sans production neuve.
>
> **Détection 0.E — run parallèle actif PENDANT ce run, pas seulement avant.** Il a mis le
> post TikTok en file à 12 h 59, puis écrit quatre visuels dans `social-a-deposer\2026-09-16\`
> à **15 h 06 min 53 s**, soit une minute avant la copie de ce run (15 h 07 min 55 s). C'est
> la première fois qu'un chevauchement est observé en direct : jusqu'ici il passait vers
> 17 h 10 UTC. Conformément à 0.E, **rien n'a été ajouté sur les canaux qu'il a servis**.
> Collision d'angle relevée : son `qr-code-fermetures-et-conges-du-camion-food-truck.png`
> et l'épingle food truck de ce run portent le même angle → celle de ce run passe en `retiré`
> au stock (la sienne est antérieure d'une minute). Aucun fichier supprimé.
>
> **Apprentissage (étape 2).** Supermetrics non appelé (essai expiré). Buffer ne mesure pas
> Pinterest — aucune hypothèse tirée de ses `metrics`. **TikTok, temps de visionnage moyen à
> vues quasi constantes (248–268) :** 4,25 s (08/09) · **9,65 s (09/09, le pic, seul post à
> avoir récolté réactions et partage)** · 4,39 s · 3,80 s · 3,71 s · 2,50 s (12/09) ·
> **5,61 s (14/09, carrousel « anniversaire / table de 14 demandée à 23 h »)** · 2,59 s
> (15/09, carrousel « fiche technique couleur » salon). Lecture : la distribution est plafonnée
> à ~250 vues quel que soit le contenu, mais la rétention varie du simple au quadruple, et
> **ce sont les angles à tension narrative immédiate qui retiennent** (une scène, un
> personnage, un enjeu : 5,61 s) contre les angles procéduraux (une fiche à remplir : 2,59 s).
> À exploiter : garder le sujet qui marche, changer l'angle, jamais republier à l'identique.
> Indicateur Pinterest « clic sortant » (`utm_content=clic`, base 0,17 %) : à relire dans
> Pinterest Analytics, Buffer ne le donne pas.
>
> **Production du jour : 4 épingles + 1 vidéo, QC à 0 alerte, RIEN DÉPOSÉ.**
> `QRowg-Depot.cmd` exige une action de l'utilisateur, absent de ce run planifié ; Buffer
> refuse une image dont l'URL n'est pas déjà accessible, donc aucune mise en file n'était
> possible (étape 5.3). **Tout le lot part au stock en `dispo`**, réinjectable dès le dépôt.
> Deux défauts typographiques attrapés à l'œil et corrigés (mot « AU » orphelin en bout de
> titre sur l'épingle boulangerie ; deux-points rejeté en début de ligne dans le sous-titre
> de l'épingle hôtel), les deux épingles re-rendues seules, QC repassé à 0 alerte.
> Vidéo **31,2 s**, 9 scènes, un moteur différent par scène, palette `or` stable, scrim 0,72 —
> **à publier à la main** (IG + TikTok, avec un son ajouté dans l'appli).
> **File Buffer à 2/10** en fin de run (carrousel Instagram 16 h 55, carrousel photo TikTok
> 20 h 08), relue après coup : le compte correspond exactement.

| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 16/09 | hôtel / hospitalité (100 % inédit, non déposé) | qr-code-petit-dejeuner-commande-la-veille-hotel-reel (vidéo 31,2 s), qr-code-doggy-bag-restes-a-emporter-restaurant, qr-code-farines-et-provenances-du-pain-boulangerie, qr-code-reglement-interieur-et-horaires-hotel, qr-code-calendrier-fermetures-et-conges-food-truck (retiré, doublon) | Pinterest (réserve), reel manuel |

### Angles consommés le 16/09
- Restaurant · le doggy bag et les restes à emporter.
- Boulangerie · les farines et provenances affichées.
- Hôtel · le règlement intérieur et les horaires affichés.
- Hôtel · le petit-déjeuner commandé la veille (vidéo).
- Food truck · le calendrier des fermetures et congés (consommé par le run parallèle).

### Angles NEUFS ajoutés le 16/09 (remplacent les cinq consommés)
- Restaurant · la carte des sans-alcool et des boissons maison en fin de repas.
- Boulangerie · la tournée et les dépôts de pain du matin dans les villages.
- Hôtel · le guide de la maison en plusieurs langues pour les clients étrangers.
- Hôtel · les départs tardifs et la consigne à bagages, réservés depuis la chambre.
- Food truck · la fiche « où nous trouver cette semaine » liée à la géoloc du camion.
- Commerce · la liste d'attente sur un produit en rupture (toujours non consommé).

### Doublons à ne plus rejouer avant le 07/10 (21 jours)
- (hôtel, règlement intérieur et horaires) · (hôtel, petit-déjeuner commandé la veille)
- (restaurant, doggy bag) · (boulangerie, farines et provenances)
- (food truck, fermetures et congés) — consommé par le run parallèle le 16/09.

> **Reprise après dépôt — 16/09, 14 h 30 UTC.** L'utilisateur a lancé `QRowg-Depot.cmd`
> et collé les URLs dans la même session : rien n'a été reproduit, l'étape 0.A n'a pas été
> rejouée, mais **la garde 0.D a été refaite** avant toute création (Instagram : 1 `scheduled`
> + 1 `draft` du jour → bloqué ; TikTok : 1 `scheduled` → bloqué ; les deux canaux restent
> servis par le rattrapage et par le run parallèle). Aucune épingle Pinterest n'était
> programmée et le run parallèle n'avait toujours rien posé de son côté.
> **3 épingles mises en file** sur 3 tableaux distincts : doggy bag restaurant (16/09,
> 17 h 06 UTC, QR code restaurant), farines boulangerie (17/09, 12 h 21, Templates gratuits),
> règlement hôtel (17/09, 14 h 49, QR code hôtel). Descriptions vérifiées par assertion
> avant envoi (484, 464 et 471 caractères, sous la limite Buffer de 500 qui avait mordu
> le 15/09). **La quatrième image déposée — l'épingle food truck — n'a délibérément PAS été
> mise en file** : elle reste en `retiré` au stock, doublon d'angle avec le visuel du run
> parallèle. Le dépôt l'a poussée parce que le script prend tous les PNG de la racine ;
> cela ne publie rien, et le fichier reste disponible si l'autre run abandonne le sien.
> Relecture `list_posts` après coup : **5 `scheduled` exactement**, ni plus ni moins.
> **File à 5/10.** La vidéo de 31,2 s reste à publier à la main (IG + TikTok), isolée dans
> `C:\Users\PC\Desktop\QRowg-Videos-a-publier\2026-09-16`.

---

## 20/09 — dimanche · restaurant (jour vidéo) · 100 % inédit, NON DÉPOSÉ

> **Étape 0 (hygiène Buffer) : 1 post `error`, Instagram, DÉJÀ EN LIGNE.**
> `6aa931de…` (carrousel producteur « points de dépôt », `dueAt` 16/09 16 h 55 UTC,
> erreur « flagged as potential spam ») confronté aux 45 derniers `sent` : un `sent`
> Instagram existe **au même horaire exact**, `6aaaf5d9…`, permalien
> https://www.instagram.com/p/DdWw5JKlhM6/ . Le post est donc sorti ; il est passé en
> **brouillon** avec la mention `[DÉJÀ EN LIGNE — NE PAS RETRY]` + permalien, métadonnées
> Instagram repassées (`type`, `shouldShareToFeed`, `isAiGenerated`). Onglet `error`
> **vide** à la fin de 0.A. Aucun post supprimé, aucun Retry, aucun requeue.
> C'est le **troisième cas avéré** du même faux négatif (07/09, 14/09, 16/09) : il est
> désormais plus fréquent que le cas inverse.
>
> **0.B / 0.C — file trouvée VIDE** (0 `scheduled`), donc aucun doublon programmé à purger.
> **Places libres : 10 − 0 = 10.** La file est vide depuis le 17/09 : trois jours sans run
> (17, 18, 19/09), rien n'a été programmé ni publié sur ces dates.
>
> **Garde 0.D — 0 post Instagram et 0 post TikTok aujourd'hui, tous statuts confondus**
> (`sent`, `scheduled`, `error`, `draft` sur 20/09) : les deux canaux étaient libres.
> Comptage refait avant chaque tentative de `create_post`.
>
> **0.E — aucun run concurrent.** Aucun post créé dans les 6 dernières heures, file vide,
> rien de neuf dans `social-a-deposer\`. Le run parallèle de 17 h 10 UTC ne s'est pas
> manifesté depuis le 16/09.
>
> **Étape 0-bis — stock.** Trois lignes `dispo` au démarrage (épingles bar/vins,
> salon/carte cadeau, food truck/fermetures + la vidéo hôtel du 16/09). Tentative de
> réinjection de **l'épingle bar · vins de producteurs voisins** : Buffer l'a refusée avec
> `Image could not be read from its URL` — **preuve que cette image n'a jamais été déposée**
> le 16/09. Le dépôt du 16/09 n'a poussé que les 4 PNG du run hôtel ; les visuels du run
> parallèle (`vins`, `carte cadeau salon`) sont restés locaux. Les lignes du stock qui les
> donnaient pour déposées étaient donc fausses : corrigées dans `_STOCK\_INDEX.md`.
> L'épingle bar/vins est **recopiée dans le lot du jour** pour partir au prochain dépôt.
> L'épingle food truck · fermetures reste **interdite jusqu'au 07/10** (règle des 21 jours).
>
> **Apprentissage (étape 2).** Supermetrics non appelé (essai expiré). Buffer ne mesure pas
> Pinterest : aucune hypothèse tirée de ses `metrics`, les chiffres se lisent dans Pinterest
> Analytics (base de clic sortant à battre : 0,17 % sur `utm_content=clic`). Côté TikTok et
> Instagram, **aucune donnée nouvelle depuis le 16/09** : le dernier post TikTok date du
> 16/09 20 h 08 et aucun contenu n'est sorti depuis le 17/09. Le temps de visionnage moyen
> reste donc lu sur la série connue — pic à **9,65 s (09/09)**, **5,61 s (14/09, angle à
> tension narrative)** contre **2,50–2,59 s** sur les angles procéduraux. Le carrousel et la
> vidéo du jour sont écrits selon cette lecture : une scène, un personnage, un enjeu dès la
> première seconde (« Il conduit. On lui propose un Perrier. », « Elle voulait le 38. »).
> **Trois jours de silence (17–19/09) sont eux-mêmes un fait à surveiller** : la file s'est
> vidée sans être réalimentée.
>
> **Production du jour : 1 carrousel (6 slides) + 6 copies TikTok + 4 épingles + 1 vidéo.**
> Contrôle qualité : **16 visuels, 0 alerte**, les **8 visuels porteurs de QR décodés vers
> leur lien tracké exact**. Un défaut typographique attrapé à l'œil sur la planche-contact
> et corrigé : l'épingle boulangerie coupait « 7 h » entre deux lignes (« LE PAIN PASSE À 7 /
> H. OU À 8 H ? ») — titre raccourci en « Le pain passe à quelle heure ? », épingle
> re-rendue seule, QC repassé à 0 alerte.
> Vidéo **31,2 s**, 9 scènes, un moteur d'animation différent par scène (tunnel, glitch,
> shatter, drift, scan, focus, publish, stats, share), palette `or` stable, `scrim` 0,72,
> `maxDuration` 36 — planche-contact regardée avant rendu final, durée confirmée à l'ffprobe.
> **À publier à la main** (IG + TikTok, avec un son ajouté dans l'appli).
>
> **RIEN DÉPOSÉ, RIEN EN FILE.** `QRowg-Depot.cmd` exige une action de l'utilisateur, absent
> de ce run planifié ; Buffer refuse toute image dont l'URL n'est pas déjà accessible
> (vérifié en direct ce matin sur l'épingle du stock). **Tout le lot part en `dispo`**,
> réinjectable sans rien reproduire dès que les URLs reviennent. **File à 0/10.**

| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 20/09 | restaurant (jour vidéo, 100 % inédit, non déposé) | qr-code-carte-sans-alcool-boissons-maison-restaurant (carrousel 6 slides + 6 copies tiktok-), qr-code-carte-bieres-de-saison-bar, qr-code-tournee-depots-de-pain-villages-boulangerie, qr-code-menu-enfant-du-camion-food-truck, qr-code-diagnostics-et-plan-sur-le-panneau-immobilier, qr-code-liste-attente-produit-en-rupture-boutique-reel (vidéo 31,2 s) | Instagram + TikTok (réserve), Pinterest (réserve), reel manuel |

### Angles consommés le 20/09
- Restaurant · la carte des sans-alcool et des boissons maison en fin de repas (carrousel).
- Bar · la carte des bières de saison.
- Boulangerie · la tournée et les dépôts de pain du matin dans les villages.
- Food truck · le menu enfant du camion.
- Immobilier · les diagnostics et le plan sur le panneau.
- Commerce · la liste d'attente sur un produit en rupture (vidéo).

### Angles NEUFS ajoutés le 20/09 (remplacent les six consommés)
- Restaurant · la carte des desserts photographiés, changée quand le pâtissier change.
- Bar · la fiche « d'où vient cette bière » : brasserie, distance, style.
- Boulangerie · les commandes de gâteaux d'anniversaire prises hors comptoir.
- Food truck · la fiche « où nous trouver cette semaine » liée à la géoloc du camion (toujours non consommé).
- Commerce · le service après-vente et la retouche suivis en ligne.
- Immobilier · la visite virtuelle depuis la vitrine de l'agence (toujours non consommé).
- Salon · la fiche « ce qu'on a fait sur tes cheveux » remise en fin de rendez-vous (toujours non consommé).

### Accroches nouvelles (ne pas réutiliser)
- « Il conduit. On lui propose un Perrier. »
- « La blonde de septembre n'est plus là. »
- « Le pain passe à quelle heure ? »
- « Et pour le petit, vous avez quoi ? »
- « Le panneau dit le prix. Rien de plus. »
- « Elle voulait le 38. » / « Tu dis : repassez jeudi. »

### Doublons à ne plus rejouer avant le 11/10 (21 jours)
- (restaurant, carte sans alcool) · (bar, bières de saison) · (boulangerie, tournée des dépôts)
- (food truck, menu enfant) · (immobilier, diagnostics et plan sur le panneau)
- (commerce, liste d'attente sur produit en rupture)

> **Reprise après dépôt — 20/09, 20 h 30 UTC.** Dépôt lancé par l'utilisateur (17 PNG dans
> `social/2026-09-20/`, la vidéo isolée à part dans `QRowg-Videos-a-publier\2026-09-20`).
> Rien reproduit, étape 0.A non rejouée, **garde 0.D refaite avant chaque `create_post`** :
> Instagram et TikTok à 0 post du jour tous statuts confondus au moment de la création.
> **File passée de 0/10 à 7/10** : carrousel Instagram 20 h 51 UTC · carrousel photo TikTok
> 21/09 06 h 40 (sans `isAiGenerated`, refusé par l'API sur les photos) · 5 épingles sur
> **5 tableaux distincts** (QR code restaurant, Templates gratuits, QR code food truck,
> QR code immobilier, Productivité au travail), dont l'épingle bar/vins récupérée du stock
> du 16/09 — enfin déposée, donc enfin publiable. Répartition food/hors-food respectée :
> 4 épingles food, 1 seule hors-food (immobilier).
> Relecture de la file après coup : **7 `scheduled` exactement, 0 `error`**.
> Seule la vidéo de 31,2 s reste à publier à la main (IG + TikTok, son ajouté dans l'appli).

---

## 22/09 — mardi · boulangerie (pas un jour vidéo) · 100 % inédit, NON DÉPOSÉ

> **Étape 0 (hygiène Buffer) : onglet `error` DÉJÀ VIDE.** `list_posts status:["error"]`
> ne renvoie rien — première fois depuis le 13/09 qu'aucun faux négatif « flagged as
> potential spam » n'est à purger. Aucun post supprimé, aucun Retry, aucun requeue.
>
> **0.B — aucun doublon programmé.** Deux posts `scheduled`, tous deux Pinterest, créés le
> 20/09 à 20 h 32 et 20 h 37 : l'épingle bar/vins (22/09 13 h 28) et l'épingle restaurant
> « carte sans alcool » (22/09 14 h 44). Contenus confrontés aux 45 derniers `sent` : aucun
> n'est déjà sorti. **0.C — places libres : 10 − 2 = 8.**
>
> **Garde 0.D — 0 post Instagram et 0 post TikTok aujourd'hui, tous statuts confondus**
> (`sent`, `scheduled`, `error`, `draft` sur le 22/09) : les deux canaux sont libres. Le
> comptage sera refait juste avant chaque `create_post` à la reprise après dépôt.
>
> **0.E — aucun run concurrent.** Le post le plus récemment créé date du 20/09 20 h 37, soit
> bien au-delà des 6 heures. Le run parallèle de 17 h 10 UTC ne s'est pas manifesté depuis
> le 16/09. Rien de neuf dans `social-a-deposer\` depuis le dossier du 20/09.
>
> **Étape 0-bis — stock.** Deux lignes `dispo` au démarrage : `qr-code-carte-cadeau-du-salon-
> coiffure.png` (hors-food, jamais déposée) et `qr-code-fermetures-et-conges-du-camion-food-
> truck.png` (interdite jusqu'au 07/10). **Aucune des deux n'est sortie** : l'épingle
> hors-food du jour est déjà prise par la fiche coloration salon, et sortir la carte cadeau
> en plus ferait deux épingles salon le même jour. Elles restent `dispo`.
>
> **Apprentissage (étape 2).** Supermetrics non appelé (essai expiré). Buffer ne mesure pas
> Pinterest : ses `metrics` sont ignorées, la base de clic sortant à battre reste 0,17 % sur
> `utm_content=clic`, lue dans Pinterest Analytics. **Fait nouveau et net côté TikTok : le
> temps de visionnage moyen a doublé.** Les deux carrousels photo publiés le 21/09 font
> **7,21 s et 7,87 s** (280 et 247 vues), contre 2,37–3,58 s les 11 et 12/09 et 5,53 s le
> 14/09. La série confirme la lecture du 20/09 : **les angles à tension narrative tiennent
> l'écran, les angles procéduraux décrochent à 2,5 s.** Le carrousel du jour est écrit dans
> cette veine — une scène, un personnage, un compte à rebours dès la première slide
> (« Elle veut un gâteau pour samedi. Six personnes attendent derrière elle. »). Les vues,
> elles, restent collées autour de 250–280 : la portée ne bouge pas, l'attention si.
>
> **Production : 1 carrousel (6 slides) + 6 copies TikTok + 4 épingles.** Pas de vidéo,
> mardi n'est pas un jour vidéo.
> Contrôle qualité : **16 visuels, 0 alerte**, les **8 visuels porteurs de QR décodés vers
> leur lien tracké exact** (les 2 slides QR du carrousel, leurs 2 copies TikTok réduites à
> 1080×1350, et les 4 épingles). Fond sombre 82,9 à 95,0 %, or 1,5 à 10,1 % — dans la charte.
> **Trois défauts typographiques attrapés à l'œil** sur la planche-contact, invisibles pour
> le QC automatique, chacun un mot orphelin en bout de titre :
> · épingle food truck — « OÙ EST LE CAMION CETTE / SEMAINE ? » laissait « SEMAINE ? » seul
>   sur une troisième ligne → titre ramené à « Le camion, cette semaine », la question passe
>   dans le sous-titre ;
> · épingle restaurant — « LES DESSERTS EN PHOTO, PAS EN / LISTE » laissait « LISTE » seul
>   → titre ramené à « Les desserts en photo » ;
> · épingle salon — « SA COULEUR EXACTE, SIX SEMAINES / APRÈS » sur quatre lignes, « APRÈS »
>   orphelin → titre ramené à « La formule de sa couleur », le « six semaines après » passe
>   dans le sous-titre.
> Les trois épingles ont été **re-rendues seules**, QC repassé à 0 alerte à chaque fois.
> Les copies TikTok n'ont pas été régénérées : le carrousel n'a pas bougé.
> Descriptions Pinterest **vérifiées par assertion avant écriture** : 474, 494, 498 et 494
> caractères, lien tracké et hashtags compris, sous la limite Buffer de 500. Bios vérifiées
> de même (IG 145/140, TikTok 61/65, Pinterest 157/144, LinkedIn 190/179, X 137/105).
>
> **RIEN DÉPOSÉ, RIEN EN FILE.** `QRowg-Depot.cmd` exige une action de l'utilisateur, absent
> de ce run planifié ; Buffer refuse toute image dont l'URL n'est pas déjà accessible.
> **Tout le lot part en `dispo`**, réinjectable sans rien reproduire dès que les URLs
> reviennent. **File à 2/10, 8 places libres** — le lot de 6 y tient et laisse 2 places.

| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 22/09 | boulangerie (mardi, pas de vidéo, 100 % inédit, non déposé) | qr-code-commandes-de-gateaux-d-anniversaire-boulangerie (carrousel 6 slides + 6 copies tiktok-), qr-code-emplacements-de-la-semaine-food-truck, qr-code-carte-des-desserts-en-photo-restaurant, qr-code-origine-des-cafes-et-torrefaction-cafe, qr-code-fiche-coloration-fin-de-rendez-vous-salon | Instagram + TikTok (réserve), Pinterest ×4 (réserve) |

### Angles consommés le 22/09
- Boulangerie · la commande de gâteau d'anniversaire prise hors comptoir (carrousel).
- Food truck · le planning des emplacements de la semaine.
- Restaurant · la carte des desserts en photo.
- Café · l'origine et la torréfaction du grain servi aujourd'hui.
- Salon · la fiche couleur remise en fin de rendez-vous.

### Angles NEUFS ajoutés le 22/09 (remplacent les cinq consommés)
- Boulangerie · la fiche « quel pain pour quel plat », posée à côté de la caisse.
- Food truck · la commande passée d'avance pour la pause de midi, prête à l'arrivée.
- Restaurant · la table de six qui se partage l'addition sans calculatrice.
- Café · la carte de fidélité du torréfacteur, sans carton à tamponner.
- Salon · les créneaux annulés du jour, proposés aux clientes en liste d'attente.
- Immobilier · la visite virtuelle depuis la vitrine de l'agence (toujours non consommé).
- Restaurant · la carte des desserts photographiés → **consommé ce jour**, retiré de la liste.

### Accroches nouvelles (ne pas réutiliser)
- « Elle veut un gâteau pour samedi. » / « Six personnes attendent derrière elle. »
- « Le camion, cette semaine. »
- « Les desserts en photo. »
- « D'où vient ce café ? »
- « La formule de sa couleur. »

### Doublons à ne plus rejouer avant le 13/10 (21 jours)
- (boulangerie, commande de gâteau d'anniversaire) · (food truck, emplacements de la semaine)
- (restaurant, carte des desserts en photo) · (café, origine et torréfaction)
- (salon, fiche couleur de fin de rendez-vous)

> **Reprise après dépôt — 22/09, 11 h 48 UTC.** Dépôt lancé par l'utilisateur : 16 PNG dans
> `social/2026-09-22/`, aucune vidéo (mardi n'est pas un jour vidéo). Rien reproduit, étape
> 0.A non rejouée, **garde 0.D refaite avant chaque `create_post`** — le comptage Instagram
> et TikTok du 22/09, tous statuts confondus (`sent`, `scheduled`, `error`, `draft`), est
> revenu **vide** juste avant chacune des deux créations.
> **File passée de 2/10 à 8/10**, dans l'ordre prescrit : carrousel Instagram (22/09,
> 15 h 04 UTC, `type:post` + `shouldShareToFeed` + `isAiGenerated`, légende sans URL, lien
> en bio, 5 hashtags) · carrousel photo TikTok (23/09, 04 h 05, copies `tiktok-` 1080×1350,
> **sans `isAiGenerated`** — l'API le refuse sur les photos) · puis les 4 épingles sur
> **4 tableaux distincts** : food truck 22/09 18 h 18 (QR code food truck), desserts
> restaurant 22/09 19 h 34 (QR code restaurant), origine des cafés 23/09 12 h 48 (QR code
> boutique commerce), fiche coloration salon 23/09 13 h 03 (QR code salon coiffure).
> Répartition respectée : **3 épingles food, 1 seule hors-food** (salon). Descriptions
> vérifiées par assertion avant envoi — 474, 494, 498 et 494 caractères, lien tracké et
> hashtags compris, sous la limite Buffer de 500.
> Relecture `list_posts` après coup : **8 `scheduled` exactement, 0 `error`**, ni plus ni
> moins — les 2 épingles Pinterest programmées le 20/09 pour aujourd'hui, plus les 6 du jour.
> Toutes les lignes du 22/09 passent en `en-file` au stock. Rien à publier à la main.

---

## 23/09 — run du jour

> **Étape 0 (hygiène Buffer) — résultat.** `list_posts` status `["error"]` : **onglet vide,
> aucun post en erreur**. Les 9 brouillons annotés des 10 → 16/09 restent en `draft`, déjà
> marqués `[DÉJÀ EN LIGNE — NE PAS RETRY]` ou `[DOUBLON — NE PAS PUBLIER]` par les runs
> précédents : rien à reprendre, rien à requeuer. Aucun doublon parmi les `scheduled`.
> **2 posts `scheduled`** (les deux épingles Pinterest du 22/09 dues aujourd'hui à 12 h 48 et
> 13 h 03 UTC) → **8 places libres**.
> **Garde 0.D** : comptage `dueAt` du 23/09, tous statuts confondus — **Instagram 0**,
> **TikTok 1** (`6ab26acb…`, carrousel boulangerie du 22/09, `sent` à 04 h 06 UTC).
> **→ aucun post TikTok créé aujourd'hui**, le carrousel photo part au stock en `dispo`.
> **Étape 0.E** : aucun post `createdAt` dans les 6 dernières heures — pas de run concurrent
> détecté (le dernier date du 22/09 à 11 h 48 UTC).

| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 23/09 | food truck (mercredi, jour vidéo, 100 % inédit, non déposé) | qr-code-commande-a-l-avance-pause-de-midi-food-truck (carrousel 6 slides + 6 copies tiktok-), qr-code-carte-de-fidelite-du-torrefacteur-cafe, qr-code-brunch-du-dimanche-sur-reservation-restaurant, qr-code-privatisation-de-l-arriere-salle-bar, qr-code-carte-cadeau-du-salon-coiffure (stock, re-rendu), qr-code-addition-partagee-table-de-six-restaurant-reel (33,2 s) | Instagram (réserve), TikTok (bloqué garde 0.D), Pinterest ×4 (réserve), LinkedIn manuel, reel manuel |

### Angles consommés le 23/09
- Food truck · la commande passée d'avance pour la pause de midi (carrousel).
- Café · la carte de fidélité sans carton à tamponner.
- Restaurant · le brunch du dimanche sur réservation.
- Bar · la privatisation de l'arrière-salle.
- Salon · la carte cadeau du salon (sortie du stock, unique épingle hors-food).
- Restaurant · l'addition partagée à la table de six (reel — angle distinct du carrousel).

### Angles NEUFS ajoutés le 23/09 (remplacent les six consommés)
- Food truck · le badge de l'équipe et les allergènes affichés côté service.
- Café · la commande à emporter passée depuis le trottoir avant d'entrer.
- Restaurant · le menu de Noël réservé dès novembre (toujours non consommé).
- Bar · le tableau des scores de la ligue de fléchettes tenu à jour (toujours non consommé).
- Salon · les créneaux annulés du jour proposés en liste d'attente (toujours non consommé).
- Boulangerie · la fiche « quel pain pour quel plat » posée à côté de la caisse (non consommé).
- Producteur · le paiement en avance du panier mensuel (non consommé).
- Commerce · l'inscription newsletter en caisse · le mode d'emploi de l'article en cabine.
- Hôtel · les bonnes adresses du quartier tenues à jour.
- Immobilier · la visite virtuelle depuis la vitrine de l'agence (toujours non consommé).

### Accroches nouvelles (ne pas réutiliser)
- « Sa pause dure 30 minutes. » / « Il en passe dix-neuf debout dans la file. »
- « Le dixième café est offert. »
- « Le brunch est complet à 10 h. »
- « Ils cherchent une salle pour vendredi. »
- « Achetée en décembre. Perdue en mars. »
- « Table de six. Une seule addition. » (reel)

### Doublons à ne plus rejouer avant le 14/10 (21 jours)
- (food truck, commande d'avance pour la pause de midi) · (café, carte de fidélité sans carton)
- (restaurant, brunch du dimanche sur réservation) · (bar, privatisation de l'arrière-salle)
- (salon, carte cadeau) · (restaurant, addition partagée à la table de six)

### Contrôle qualité
**16 visuels, 0 alerte.** Les six QR porteurs (slides 03 et 06 du carrousel et leurs copies
`tiktok-`, plus les 4 épingles) décodent tous vers leur lien tracké exact. Aperçus relus à
l'œil : la couverture du carrousel et **une épingle de chacun des 4 gabarits** — aucun mot
orphelin, aucun guillemet en bout de titre. Copies TikTok redimensionnées en 1080×1350
(1 458 000 px, sous le plafond de 2 073 600).
Reel : **33,2 s**, 8 scènes, 8 moteurs différents, palette `or` stable, `scrim` 0,82
(remonté de 0,72 après lecture de la planche-contact : les moteurs `glitch` et `shatter`
passaient devant le titre — `opacity` ramenée à 0,45 et `glow` à 0,6 sur ces deux scènes).
`maxDuration: 36` posé dans le clip, validateur actif, « rien à signaler ».

### Attribution
Slug de campagne unique : **20260923-foodtruck**. Épingles en `utm_content=clic` avec
`utm_term` par sous-secteur (fidelite, brunch, privatisation, cartecadeau).
Base à battre sur le clic sortant Pinterest : **0,17 %** — à lire dans Pinterest Analytics,
jamais dans Buffer.

### Apprentissage du jour
Buffer ne mesure pas Pinterest : aucune hypothèse construite sur ses `metrics`.
Le seul signal TikTok exploitable du jour est le carrousel boulangerie sorti à 04 h 06 UTC,
trop récent pour être lu. Le temps de visionnage moyen TikTok reste l'indicateur à suivre.
Supermetrics non appelé (essai expiré le 30/08).

> **RIEN DÉPOSÉ, RIEN EN FILE.** `QRowg-Depot.cmd` exige une action de l'utilisateur, absent
> de ce run planifié ; Buffer refuse toute image dont l'URL n'est pas déjà accessible.
> **Tout le lot part en `dispo`** au stock, réinjectable sans rien reproduire dès que les URLs
> reviennent. **File à 2/10, 8 places libres** — le lot mettable en file est de **5**
> (1 carrousel Instagram + 4 épingles), le carrousel TikTok étant bloqué par la garde 0.D.

---

## 23/09 — mercredi · food truck · JOUR VIDÉO · 100 % inédit, NON DÉPOSÉ

> **Étape 0 (hygiène Buffer) : onglet `error` DÉJÀ VIDE**, deuxième jour consécutif.
> `list_posts status:["error"]` ne renvoie rien — aucun faux négatif « flagged as
> potential spam » à purger, donc aucun `edit_post`, aucun Retry, aucun requeue, aucune
> suppression.
>
> **0.B — aucun doublon programmé.** Deux posts `scheduled`, tous deux Pinterest, créés
> le 22/09 à 11 h 48 : l'épingle café/torréfaction (23/09 12 h 48) et l'épingle salon
> « fiche coloration » (23/09 13 h 03). Contenus et slugs confrontés aux 45 derniers
> `sent` : aucun des deux n'est déjà sorti. **0.C — places libres : 10 − 2 = 8.**
>
> **Garde 0.D — TikTok BLOQUÉ pour la journée, Instagram libre.** Le comptage tous statuts
> confondus sur le 23/09 donne **1 post TikTok** (`6ab26acb8920619c8e595147`, carrousel
> boulangerie du 22/09, parti à 04 h 06 ce matin, permalien
> `tiktok.com/@qrowg.com/video/7688576851094113569`) et **0 post Instagram**. Le carrousel
> TikTok du jour ne peut donc pas viser une case d'aujourd'hui. Règle d'arbitrage retenue
> et à conserver : à la reprise après dépôt, on recompte, on crée, **et on vérifie le
> `dueAt` renvoyé par `create_post`** — s'il tombe encore le 23/09 sur un canal déjà servi,
> le post repart immédiatement en brouillon. C'est le seul moyen de tenir « un post par
> jour » sans affamer un canal que la file décale naturellement au lendemain.
>
> **0.E — aucun run concurrent.** Le post le plus récemment créé date du 22/09 11 h 48,
> bien au-delà des 6 heures. Le run parallèle de 17 h 10 UTC ne s'est pas manifesté depuis
> le 16/09.
>
> **Étape 0-bis — stock : rien sorti, et une ligne périmée corrigée.**
> `qr-code-vins-de-producteurs-voisins-bar.png` était encore en `dispo` alors qu'elle est
> **publiée depuis le 22/09 13 h 28** (`pinterest.com/pin/726416614946180618`) : ligne
> repassée en `en-file`. Restent trois `dispo` hors vidéos : les congés du camion
> (interdite jusqu'au 07/10) et la **carte cadeau du salon**, qui n'est **pas** sortie
> aujourd'hui — une épingle salon (fiche coloration) part déjà ce midi, deux épingles salon
> le même jour rejouent la collision que la règle anti-doublon cherche à éviter.
>
> **Apprentissage (étape 2).** Supermetrics non appelé (essai expiré). Pinterest non mesuré
> par Buffer : base de clic sortant à battre toujours 0,17 % sur `utm_content=clic`, à lire
> dans Pinterest Analytics. **TikTok confirme la tendance du 22/09 : le temps de visionnage
> moyen tient au-dessus de 7 s.** Les deux carrousels du 21/09 font **7,16 s et 7,94 s**
> (282 et 247 vues), contre 2,37–3,08 s les 12 et 16/09. Le carrousel du 23/09 (04 h 06)
> n'a pas encore de métriques. Lecture inchangée et maintenant solide sur trois points de
> mesure : **les angles à tension narrative tiennent l'écran, les angles procéduraux
> décrochent à 2,5 s** ; les vues restent collées à 250–280, c'est l'attention qui bouge,
> pas la portée. Le carrousel du jour est écrit dans cette veine — un personnage, un
> compte à rebours, une contrainte chiffrée dès la première slide (« Il a quarante
> minutes. Vingt-deux personnes devant lui »).
>
> **Production : 1 carrousel (6 slides) + 6 copies TikTok + 4 épingles + 1 vidéo.**
> Mercredi est un jour vidéo : **31,2 s**, 9 scènes, **un moteur d'animation différent par
> scène** (tunnel, glitch, shatter, drift, scan, focus, publish, stats, share), palette
> `or` stable, `scrim` 0,72, `maxDuration` 36 posé dans le clip — validateur actif,
> « rien à signaler ». Planche-contact regardée avant le rendu final. L'encodage a été
> coupé par le plafond de temps de l'outil (moov atom manquant) : **toutes les 936 frames
> étaient capturées**, le MP4 a été ré-encodé directement depuis les frames en ffmpeg,
> puis vérifié à l'ffprobe — 1080×1920, 936 frames, **31,200 s**.
> Contrôle qualité : **16 visuels, 0 alerte**, les **8 visuels porteurs de QR décodés vers
> leur lien tracké exact**. Fond sombre 83,8 à 94,9 %, or 1,1 à 9,7 % — dans la charte.
> **Trois défauts typographiques attrapés à l'œil** sur les planches, invisibles pour le QC
> automatique, chacun un mot orphelin en bout de titre :
> · slide CTA du carrousel — « CRÉE TA PAGE DE / COMMANDE EN 5 / MINUTES » laissait
>   « MINUTES » seul → titre remplacé par « Prends tes commandes d'avance » ;
> · épingle café — « SON CARTON EST / DANS UNE AUTRE / VESTE. » laissait « VESTE. » seul
>   → titre ramené à « Dix cafés, un carton perdu » ;
> · épingle immobilier — « LA VITRINE EST / FERMÉE LE / DIMANCHE. » laissait « DIMANCHE. »
>   seul → titre remplacé par « La vitrine ne dort jamais », plus fort et sur deux lignes.
> Le carrousel ayant bougé, **les 6 copies TikTok ont été régénérées** (1 080 × 1 350,
> 1 458 000 px, sous la limite TikTok de 2 073 600), et le QC repassé : 0 alerte.
> Descriptions Pinterest **vérifiées par assertion avant écriture** : la première version
> sortait à 637 caractères, l'assertion a bloqué, les quatre ont été resserrées à
> **461, 432, 431 et 494** — lien tracké et hashtags compris, sous la limite Buffer de 500.
> Bios vérifiées de même (IG 131/122, TikTok 51/53, Pinterest 146/137, LinkedIn 209/185,
> X 129/103).
>
> **RIEN DÉPOSÉ, RIEN EN FILE.** `QRowg-Depot.cmd` exige une action de l'utilisateur,
> absent de ce run planifié ; Buffer refuse toute image dont l'URL n'est pas déjà
> accessible. **Tout le lot part en `dispo`**, réinjectable sans rien reproduire dès que
> les URLs reviennent. **File à 2/10, 8 places libres** — le lot de 6 y tient largement,
> sous réserve de la garde 0.D sur TikTok au moment de la reprise.

| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 23/09 | food truck (mercredi, jour vidéo, 100 % inédit, non déposé) | qr-code-commande-a-l-avance-pause-de-midi-food-truck (carrousel 6 slides + 6 copies tiktok-), qr-code-partage-de-l-addition-table-de-six-restaurant, qr-code-carte-de-fidelite-sans-tampon-cafe, qr-code-quel-pain-pour-quel-plat-boulangerie, qr-code-visite-virtuelle-depuis-la-vitrine-immobilier, qr-code-suivi-de-retouche-et-sav-boutique-reel (vidéo 31,2 s) | Instagram + TikTok (réserve), Pinterest ×4 (réserve), reel manuel |

### Angles consommés le 23/09
- Food truck · la commande passée d'avance pour la pause de midi (carrousel).
- Restaurant · la table de six qui se partage l'addition sans calculatrice.
- Café · la carte de fidélité sans carton à tamponner.
- Boulangerie · la fiche « quel pain pour quel plat » à côté de la caisse.
- Immobilier · la visite virtuelle depuis la vitrine de l'agence.
- Commerce · le suivi de retouche et de SAV en ligne (vidéo).

### Angles NEUFS ajoutés le 23/09 (remplacent les six consommés)
- Food truck · la file en direct : combien de commandes devant toi, en temps réel.
- Restaurant · la carte des vins accordée au plat, choisie sans sommelier.
- Café · le brunch du dimanche réservé en deux clics depuis la vitrine.
- Boulangerie · les allergènes de chaque viennoiserie, lisibles sans demander.
- Salon · les créneaux annulés du jour, proposés aux clientes en liste d'attente.
- Commerce · le mode d'emploi vidéo du produit, sur l'étiquette.
- Hôtel · le check-out tardif demandé depuis la chambre.

### Accroches nouvelles (ne pas réutiliser)
- « Il a quarante minutes. » / « Vingt-deux personnes devant lui. »
- « Six personnes, une addition. »
- « Dix cafés, un carton perdu. »
- « Quel pain pour le fromage ? »
- « La vitrine ne dort jamais. »
- « Le manteau est en retouche. » / « On vous rappelle. On ne rappelle jamais. »

### Doublons à ne plus rejouer avant le 14/10 (21 jours)
- (food truck, commande à l'avance pour la pause de midi) · (restaurant, partage de l'addition)
- (café, fidélité sans tampon) · (boulangerie, quel pain pour quel plat)
- (immobilier, visite virtuelle depuis la vitrine) · (commerce, suivi de retouche et SAV)

### ⚠ 23/09 — RUN CONCURRENT AVÉRÉ (correction de l'étape 0.E de ce run)

L'étape 0.E avait conclu « pas de run concurrent » sur la seule foi de Buffer : aucun post
`createdAt` dans les six dernières heures. **C'était vrai côté Buffer et faux côté disque.**
Un second run de la tâche `qrowg-marketinglocal` a écrit son lot dans
`social-a-deposer\2026-09-23\` à **11 h 37 min 52 s** (Paris), soit **34 secondes** avant la
copie de ce run, et y a encore écrit un zip à 11 h 40 min 43 s — il tournait donc **pendant**
ce run. Il n'est apparu qu'au moment de lister le dossier d'archive après copie.

**Leçon à inscrire dans la procédure :** `list_posts` ne détecte un run concurrent
**qu'une fois qu'il a créé un post**. Tant que les deux runs sont bloqués avant le dépôt,
Buffer est muet. Le signal le plus précoce est le **dossier `social-a-deposer\AAAA-MM-JJ\`** :
s'il existe déjà et contient des PNG au démarrage du run, un autre agent est passé ou passe.
**À vérifier désormais à l'étape 0.E, avant toute production**, en plus du contrôle Buffer.

Ce que les deux runs ont produit :
- **Même carrousel, même slug de campagne** (`qr-code-commande-a-l-avance-pause-de-midi-food-truck`,
  `20260923-foodtruck`). La liste noire étant déterministe, deux runs partis du même état
  convergent. Les fichiers portent des noms identiques et se sont écrasés : aucun doublon
  possible sur le carrousel.
- **Épingles divergentes.** Deux angles se recoupent : `carte-de-fidelite-sans-tampon-cafe`
  double `carte-de-fidelite-du-torrefacteur-cafe`, et `partage-de-l-addition-table-de-six-restaurant`
  double l'angle du reel du jour. Les deux exemplaires du run concurrent passent en `retiré`
  au stock. Ses deux angles inédits — boulangerie « quel pain pour quel plat » et immobilier
  « visite virtuelle depuis la vitrine » — sont gardés en `dispo`.
- **Deux reels.** Un seul reel par jour : celui de ce run (restaurant, addition partagée,
  33,2 s) est livré ; `qr-code-suivi-de-retouche-et-sav-boutique-reel.mp4` part en `dispo`.

**Aucun des deux runs n'a rien mis en file.** Contrôle refait après découverte :
`list_posts` filtré sur `createdAt` du 23/09, tous statuts confondus → **zéro résultat**.
La file reste à **2/10**, les deux épingles Pinterest du 22/09 dues aujourd'hui. Le dépôt
n'ayant pas eu lieu, aucun doublon n'a pu être publié.

> **Reprise après dépôt — 23/09, 09 h 48 UTC.** Dépôt lancé par l'utilisateur : 16 PNG dans
> `social/2026-09-23/`, la vidéo isolée à part dans `QRowg-Videos-a-publier\2026-09-23`.
> Rien reproduit, étape 0.A non rejouée, **garde 0.D refaite avant chaque `create_post`**.
> **File passée de 2/10 à 8/10**, dans l'ordre prescrit.
>
> **Le cas TikTok, à retenir — la garde 0.D a servi pour la première fois.** Au recomptage,
> Instagram était à 0 post du jour (création faite, `dueAt` 23/09 16 h 55 : c'est bien le
> seul post IG de la journée). TikTok, lui, avait déjà servi à 04 h 06. Le post a été créé
> puis **le `dueAt` renvoyé a été vérifié** : Buffer l'avait placé au **23/09 20 h 08**,
> soit un second carrousel TikTok le même jour — exactement le scénario du 14/09.
> Plutôt que de le jeter en brouillon (ce qui aurait affamé le canal, contre la règle
> « Instagram et TikTok passent chaque jour »), il a été **déplacé en `customScheduled` au
> 24/09 06 h 40 UTC**, le créneau TikTok habituel. Les deux règles sont tenues : jamais deux
> posts le même jour sur un canal, jamais un canal sauté. **`shareNow` n'a pas été utilisé.**
> C'est la procédure à reprendre telle quelle : créer en `addToQueue`, lire le `dueAt`,
> et ne re-planifier au lendemain que si la date tombe sur une journée déjà servie.
>
> Les 4 épingles sont parties sur **4 tableaux distincts** : QR code restaurant (23/09
> 14 h 19), QR code boutique commerce (23/09 17 h 06), Templates gratuits (24/09 12 h 21),
> QR code immobilier (24/09 14 h 49). Répartition respectée : **3 épingles food, 1 seule
> hors-food** (immobilier). Descriptions vérifiées par assertion avant envoi — 461, 432,
> 431 et 494 caractères, lien tracké et hashtags compris, sous la limite Buffer de 500.
> Instagram : légende **sans URL**, lien en bio, **5 hashtags**, `type:post` +
> `shouldShareToFeed` + `isAiGenerated`. TikTok : **sans `isAiGenerated`** (refusé par l'API
> sur les carrousels photo), copies `tiktok-` 1080×1350.
> Relecture `list_posts` après coup : **8 `scheduled` exactement, 0 `error`**, ni plus ni
> moins — les 2 épingles programmées le 22/09 pour aujourd'hui, plus les 6 du jour.
> Toutes les lignes du 23/09 passent en `en-file` au stock, **sauf la vidéo**, qui reste
> `dispo` et se publie à la main.

---

## 24/09 — jeudi · secteur du jour : restauration / café-bar

| Date | Secteur | Slugs produits | Canaux |
|---|---|---|---|
| 24/09 | restauration / café-bar (jeudi, pas un jour vidéo, 100 % inédit, non déposé) | qr-code-pourboire-sans-especes-equipe-restaurant, qr-code-wifi-donne-sans-epeler-le-mot-de-passe-cafe, qr-code-plan-de-salle-choix-de-la-table-restaurant, qr-code-article-de-vitrine-reserve-pour-essayage-boutique | Pinterest ×4 (réserve) |

### Étape 0 — hygiène Buffer
- **0.A** : `list_posts` status `error` → **vide**. Aucune purge à faire, aucun faux négatif
  « flagged as potential spam » en attente de Retry.
- **0.B** : `scheduled` → **vide** également. La file du 23/09 s'est intégralement écoulée
  entre 00 h 14 et 00 h 16 UTC ce matin. Aucun doublon programmé.
- **0.C** : places libres = 10 − 0 = **10**.
- **0.D — la garde a bloqué les deux canaux carrousel.** Comptage tous statuts confondus sur
  le `dueAt` du jour : Instagram **1** (carrousel food truck, `sent` à 00 h 14 min 57 s),
  TikTok **1** (le même carrousel en copies `tiktok-`, `sent` à 00 h 15 min 54 s),
  Pinterest **2** (boulangerie « quel pain » et immobilier « visite virtuelle »).
  → **aucun post Instagram ni TikTok créé aujourd'hui.**
- **Piège confirmé, à retenir.** Le premier `list_posts` TikTok trié `dueAt desc` ne montrait
  pas ce post : il venait de basculer de `scheduled` à `sent` pendant le run. C'est **le
  comptage explicite sur le `dueAt` du jour, tous statuts**, qui l'a fait apparaître — le
  tri global ne suffit pas. Sans la garde 0.D, ce run aurait recréé le carrousel TikTok
  en croyant rattraper le blocage de la veille, et publié un doublon.
- **0.E** : dernier `createdAt` observé = 23/09 17 h 09, soit plus de 6 heures. Le dossier
  `social-a-deposer\2026-09-24\` n'existait pas au démarrage. **Aucun run concurrent.**

### Angles consommés le 24/09
- Restaurant · le pourboire laissé sans espèces, depuis l'addition.
- Café · le wifi donné sans épeler le mot de passe.
- Restaurant · le plan de salle et le choix de la table à la réservation.
- Boutique · l'article de vitrine mis de côté pour l'essayage.

### Angles écartés pour quasi-doublon (contrôle contre le stock)
- Salon · créneaux annulés proposés à la liste d'attente → double
  `qr-code-creneau-libere-derniere-minute-salon`.
- Boulangerie · allergènes des viennoiseries → même objet que
  `qr-code-carte-allergenes-du-camion-food-truck`.
- Café · brunch du dimanche → double `qr-code-brunch-du-dimanche-sur-reservation-restaurant`.
- Restaurant · accord mets-vins → trop proche de `qr-code-vins-au-verre-qui-tournent-bar`.

### Angles NEUFS ajoutés le 24/09 (remplacent les quatre consommés)
- Restaurant · le service du soir annoncé complet, liste d'attente ouverte depuis la vitrine.
- Café · la commande à emporter prête à l'heure dite, sans file au comptoir.
- Hôtel · la demande de taxi ou de navette faite depuis la chambre.
- Boutique · la liste d'envies partagée avant un anniversaire.
- Artisan · le devis photo envoyé depuis le chantier.

### Accroches nouvelles (ne pas réutiliser)
- « Personne n'a de monnaie. »
- « Le wifi en un scan. » / « Vingt-deux caractères, dix fois par jour. »
- « Ils voulaient la terrasse. »
- « Sa taille était en réserve. »

### Doublons à ne plus rejouer avant le 15/10 (21 jours)
- (restaurant, pourboire sans espèces) · (café, wifi sans épeler le mot de passe)
- (restaurant, plan de salle et choix de la table) · (boutique, article réservé pour essayage)

### Contrôle qualité
**4 visuels, 0 alerte.** Les 4 QR décodés vers leur lien tracké exact, modules sombres sur
plaque or à la résolution finale. Relecture à l'œil des **4 gabarits (0, 1, 2, 3)** :
un défaut attrapé, invisible du QC automatique — l'épingle plan de salle sortait
« ILS VOULAIENT / LA TABLE DU / FOND. », avec « FOND. » orphelin en troisième ligne.
Titre remplacé par « Ils voulaient la [[terrasse]]. », qui tient sur deux lignes ;
l'épingle a été **re-rendue seule** et le QC repassé à 0 alerte.
Descriptions Pinterest vérifiées **par assertion avant écriture** : la première version du
pourboire sortait à 515 caractères, l'assertion a bloqué, les quatre sont à
**496, 443, 468 et 443** sur 500, lien tracké et hashtags compris.
Bios vérifiées de même (IG 127/136, TikTok 68/57, Pinterest 148/148, LinkedIn 208/195,
X 127/118).

### Dépôt et file
Premier temps du run : rien déposé, rien en file — `QRowg-Depot.cmd` attend l'utilisateur.

> **Reprise après dépôt — 24/09, 00 h 33 UTC.** L'utilisateur a lancé le dépôt : les 4 PNG
> sont en ligne dans `social/2026-09-24/`. **Rien reproduit**, étape 0.A non rejouée, et la
> **garde 0.D refaite avant la mise en file** : Instagram et TikTok comptent toujours 1 post
> du jour chacun (publiés entre 00 h 14 et 00 h 16), donc toujours **aucun carrousel créé** ;
> Pinterest n'est pas soumis à cette garde.
>
> **File passée de 0/10 à 4/10.** Les 4 épingles sont parties sur **4 tableaux distincts** :
> QR code restaurant (12 h 21), Templates gratuits (14 h 49), Productivité au travail
> (16 h 18), QR code boutique commerce (18 h 15). Répartition tenue : **3 épingles food,
> 1 seule hors-food** (boutique). Descriptions vérifiées par assertion avant envoi —
> 496, 443, 468 et 443 caractères, lien tracké et hashtags compris, sous la limite Buffer
> de 500. Relecture `list_posts` après coup : **exactement 4 `scheduled`, 0 `error`**,
> ni plus ni moins. Les 4 lignes du stock passent en `en-file`.
>
> Pas de vidéo aujourd'hui (jeudi n'est pas un jour vidéo), et **`shareNow` n'a pas été
> utilisé** : les 4 épingles sont en `addToQueue`.
