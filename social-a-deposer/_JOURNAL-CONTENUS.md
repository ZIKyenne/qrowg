# Journal des contenus QRowg — anti-doublon

> **À lire AVANT toute création.** Aucun slug, angle ou accroche listé ici ne peut être
> réutilisé. Après chaque run, ajouter la ligne du jour en bas.

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

## Angles NEUFS disponibles (piocher ici en priorité)
- Restaurant : plat à emporter du soir · anniversaire / privatisation ·
  fiche « d'où vient ce plat » (producteurs) · le menu de Noël réservé dès novembre ·
  la table du soir dressée deux fois (double service) · le plateau de fromages du moment · la carte du soir écourtée en fin de service.
- Bar : quiz / jeu de table ·
  happy hour qui change selon l'heure · la carte des bières de saison ·
  la privatisation de l'arrière-salle · la carte des softs travaillés pour le conducteur.
- Boulangerie : commande de galette / bûche selon la saison · liste d'allergènes ·
  le pain sur commande pour la semaine · les farines et provenances affichées.
- Food truck : la fiche « où se garer » pour les entreprises · les moyens de paiement acceptés ·
  le camion en tournée de festival (dates et scène).
- Marché / producteur : la recette du produit de saison · la vente à la ferme hors marché ·
  la commande groupée entre voisins.
- Commerce : inscription newsletter en caisse · parrainage · la notice du produit sans papier ·
  le mode d'emploi de l'article en cabine · les horaires exceptionnels affichés en vitrine.
- Hôtel / chambre d'hôtes : les bonnes adresses du quartier tenues à jour ·
  le petit-déjeuner commandé la veille · le règlement intérieur et les horaires affichés.
- Salon / coiffeur : la routine d'entretien après un balayage · la carte cadeau du salon ·
  la fiche « ce qu'on a fait sur tes cheveux » remise en fin de rendez-vous.
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
