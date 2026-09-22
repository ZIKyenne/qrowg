# _STOCK — réserve de contenus QRowg

Tout visuel produit mais **non mis en file** atterrit ici au lieu d'être perdu.
La skill `qrowg-stock` lit ce fichier, choisit le plus ancien encore valable et le
réinjecte dans Buffer dès qu'il reste de la place dans la file.

## Colonnes
- **statut** : `dispo` (réinjectable) · `en-file` (parti dans Buffer) · `retiré` (doublon ou périmé)
- **ajouté le** : date de production d'origine
- **angle** : secteur + objet + bénéfice (sert au contrôle anti-doublon)

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| retiré | qr-code-bar-happy-hour-ardoise.png | Pinterest | QR code restaurant (726416683586817614) | bar · ardoise happy hour · l'offre change selon l'heure sans réimprimer | https://qrowg.com/qr-code/restaurant | 2026-08-31 |
| retiré | qr-code-pizzeria-a-emporter-carte-du-soir.png | Pinterest | QR code restaurant (726416683586817614) | pizzeria · carte du soir à emporter · commande sans appel téléphonique | https://qrowg.com/qr-code/menu | 2026-08-31 |
| en-file | checklist-ouverture-commerce-matin.png | Pinterest | **Productivité au travail** (726416683586787011) | commerce · checklist d'ouverture · rien d'oublié le matin — *test de placement en tableau historique* | https://qrowg.com/guides | 2026-09-03 |
| en-file | qr-code-bar-happy-hour-ardoise-v2.png | Pinterest | **Templates gratuits** (726416683586787015) | bar · ardoise happy hour · l'offre change selon l'heure — *test de placement* | https://qrowg.com/qr-code/restaurant | 2026-09-03 |
| en-file | qr-code-pizzeria-carte-du-soir-v2.png | Pinterest | QR code restaurant (726416683586817614) | pizzeria · carte du soir à emporter · commande sans appel — *témoin, tableau neuf* | https://qrowg.com/qr-code/menu | 2026-09-03 |
| retiré | qr-code-carte-fidelite-commerce-comptoir.png | — | — | commerce · carte de fidélité comptoir — **doublon** de `carte-fidelite-dematerialisee-boulangerie` publié le 02/09 | — | 2026-08-31 |

| en-file | qr-code-menu-quatre-langues-touristes-restaurant.png | Pinterest | QR code restaurant (726416683586817614) | restaurant · carte en 4 langues · le touriste lit la carte dans sa langue sans réimprimer | https://qrowg.com/qr-code/menu | 2026-09-04 |
| en-file | qr-code-vins-au-verre-qui-tournent-bar.png | Pinterest | QR code restaurant (726416683586817614) | bar/cave · vins au verre · la sélection du soir à jour en dix secondes | https://qrowg.com/qr-code/restaurant | 2026-09-04 |
| en-file | qr-code-invendus-du-soir-boulangerie-anti-gaspi.png | Pinterest | **Productivité au travail** (726416683586787011) | boulangerie · invendus du soir · anti-gaspi annoncé à 18 h en vitrine | https://qrowg.com/qr-code/boutique | 2026-09-04 |
| en-file | qr-code-panier-de-la-semaine-producteur-marche.png | Pinterest | **Templates gratuits** (726416683586787015) | marché/producteur · panier de la semaine · réservé avant l'étal | https://qrowg.com/qr-code/artisan | 2026-09-04 |

> **04/09 — tout est parti en file.** Les 3 épingles du test de placement (tableaux
> historiques + témoin) et, dans un second temps, les 4 épingles neuves du jour, placées
> sur les tableaux « QR code X » pour garder le test lisible. File à 9/10, réserve vide.
> Contrôlées à zéro alerte, QR décodés vers leur lien tracké. Textes conservés plus bas.

> Les deux fichiers du 31/08 sont passés en `retiré` : leur QR était non scannable
> (ancien générateur). Ils sont remplacés par les versions `-v2` ci-dessus, re-rendues
> avec le générateur corrigé et contrôlées à zéro alerte.

## Textes prêts

### checklist-ouverture-commerce-matin
**Titre Pinterest** : Checklist d'ouverture : ce que personne n'oublie le matin
**Description** : Le café à lancer, la caisse à ouvrir, la vitrine à retourner, le stock à vérifier : la liste vit dans la tête du patron et se perd dès qu'il n'est pas là. Une checklist derrière un QR collé au comptoir se coche chaque matin et se met à jour sans réimprimer la feuille. Idée d'organisation pour commerce, café et restaurant.
`#organisation #checklist #productivite #commercelocal`
**Tableau** : Productivité au travail — *test de placement en tableau historique*

### qr-code-bar-happy-hour-ardoise
**Titre Pinterest** : QR code bar : l'ardoise happy hour qui change toute seule
**Description** : L'ardoise annonce 17 h – 19 h depuis l'ouverture, alors que l'offre bouge selon les soirs et la météo. Un QR sur le comptoir ouvre l'happy hour du jour : les prix, l'horaire, la sélection — modifiés en dix secondes depuis le téléphone du patron. Idée simple pour bar, pub et brasserie.
`#bar #happyhour #qrcode #commercelocal`

### qr-code-pizzeria-a-emporter-carte-du-soir
**Titre Pinterest** : QR code pizzeria : la carte du soir à emporter, sans appel
**Description** : Le téléphone sonne pendant le coup de feu et personne ne peut répondre : la commande part chez le concurrent. Un QR sur la vitrine et sur les cartons ouvre la carte du soir et la prise de commande, sans appel ni application. Idée pratique pour pizzeria, snack et restaurant à emporter.
`#pizzeria #aemporter #qrcode #restauration`

## Trous de calendrier constatés (à combler avec le stock)
Jours sans production entre le 23/08 et le 03/09 : **25/08, 27/08, 29/08**.
Aucun post en statut `error` ni `draft` sur Buffer au 03/09.

### qr-code-menu-quatre-langues-touristes-restaurant
**Titre Pinterest** : Menu en 4 langues : un seul QR sur la table
**Description** : L'été, la table de six parle trois langues et la carte n'en parle qu'une. Réimprimer quatre versions coûte cher et vieillit en une semaine. Un seul QR sur la table ouvre la carte dans la langue du téléphone, et se met à jour quand le plat change. Idée pratique pour restaurant, brasserie et bistrot touristique.
`#restaurant #menu #qrcode #tourisme`

### qr-code-vins-au-verre-qui-tournent-bar
**Titre Pinterest** : Vins au verre : la sélection du soir, à jour
**Description** : La sélection au verre tourne toutes les semaines, l'ardoise reste au mois dernier et le serveur récite. Un QR sur la table ouvre la sélection du soir : les cépages, les prix, ce qui vient d'ouvrir — modifié en dix secondes depuis le téléphone. Idée simple pour bar à vins, cave et brasserie.
`#barvin #cave #qrcode #restauration`

### qr-code-invendus-du-soir-boulangerie-anti-gaspi
**Titre Pinterest** : Anti-gaspi : les invendus du soir annoncés à 18 h
**Description** : Ce qui reste à 18 h finit à la poubelle à 19 h 30, faute d'avoir prévenu qui que ce soit. Un QR en vitrine ouvre la liste du soir : ce qu'il reste, à quel prix, jusqu'à quelle heure. La page change chaque jour, l'affiche jamais. Idée anti-gaspillage pour boulangerie, pâtisserie et épicerie.
`#antigaspi #boulangerie #organisation #commercelocal`

### qr-code-panier-de-la-semaine-producteur-marche
**Titre Pinterest** : Panier de la semaine : réservé avant l'étal
**Description** : Le panier part en une heure le samedi matin, et ceux qui arrivent à 11 h repartent les mains vides. Un QR sur l'étal ouvre le panier de la semaine : ce qu'il y a dedans, ce qu'il coûte, comment le réserver. La composition change chaque semaine, le panneau reste le même. Idée pour producteur, maraîcher et marché de plein vent.
`#marche #producteur #panier #circuitcourt`

---

## 05/09 — production du jour, en attente de dépôt

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-stock-disponible-magasin-boutique-01..06.png | Instagram (carrousel) | — | commerce · stock disponible en magasin · le client voit ce qu'il reste sans attendre | https://qrowg.com/qr-code/boutique | 2026-09-05 |
| en-file | tiktok-qr-code-stock-disponible-magasin-boutique-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/boutique | 2026-09-05 |
| en-file | qr-code-retours-garantie-ticket-caisse-boutique.png | Pinterest | QR code boutique commerce (726416683586817655) | commerce · retours & garantie · le ticket de caisse explique le retour | https://qrowg.com/qr-code/boutique | 2026-09-05 |
| en-file | qr-code-carte-sandwichs-du-midi-boulangerie.png | Pinterest | QR code food truck (726416683586817654) | boulangerie · carte des sandwichs du midi · à jour à 11 h 30 | https://qrowg.com/qr-code/artisan | 2026-09-05 |
| en-file | qr-code-carte-bieres-pression-du-moment-bar.png | Pinterest | QR code restaurant (726416683586817614) | bar · bières pression du moment · la sélection du soir à jour en dix secondes | https://qrowg.com/qr-code/restaurant | 2026-09-05 |

> **05/09 — tout est parti en file.** Dépôt effectué, puis 5 posts programmés :
> carrousel Instagram, carrousel photo TikTok et les 3 épingles sur 3 tableaux distincts
> (QR code boutique commerce, QR code food truck, QR code restaurant). **File à 5/10**,
> réserve vide. Contrôle qualité : **15 visuels, 0 alerte**, chaque QR décodé vers son
> lien tracké. Textes conservés ci-dessous.
> La vidéo `qr-code-stock-disponible-magasin-boutique-reel.mp4` (32,2 s) reste **manuelle**
> et n'entre jamais dans ce circuit.

### qr-code-retours-garantie-ticket-caisse-boutique
**Titre Pinterest** : Retours et garantie : le ticket qui explique tout
**Description** : Le client rentre chez lui, ouvre le carton, hésite — et le ticket ne dit rien du délai de retour. Un QR imprimé sur le ticket de caisse ouvre la page retours : le délai, les conditions, le formulaire à remplir. Les règles changent aux soldes, la page suit, le ticket reste le même. Idée d'organisation pour boutique, commerce de proximité et e-commerce.
`#commercelocal #boutique #organisation #qrcode`
**Tableau** : QR code boutique commerce

### qr-code-carte-sandwichs-du-midi-boulangerie
**Titre Pinterest** : Carte des sandwichs du midi : à jour à 11 h 30
**Description** : À midi la file s'allonge et tout le monde pose la même question : il reste quoi ? L'ardoise date d'hier, le poulet-crudités est parti à 12 h 10. Un QR sur le comptoir ouvre la carte du jour, corrigée en dix secondes quand une garniture s'épuise. Idée pratique pour boulangerie, snack et pause déjeuner.
`#boulangerie #pausedejeuner #organisation #qrcode`
**Tableau** : QR code food truck

---

## 06/09 — production du jour

> **Dépôt fait** (15 PNG via `QRowg-Depot.cmd`), puis **5 posts mis en file** : carrousel
> Instagram (19 h 07 UTC), carrousel photo TikTok (07/09, 06 h 40) et les 3 épingles sur
> 3 tableaux distincts — QR code salon coiffure (10 h 26), QR code restaurant (13 h 17),
> QR code boutique commerce (18 h 27). **File à 5/10**, aucune erreur.
> Contrôle qualité : **15 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> Seule l'épingle **hôtel** reste en réserve `dispo` (voir la note plus bas).

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-carte-enfants-jeu-table-restaurant-01..06.png | Instagram (carrousel) | — | restaurant · carte enfants sur le set de table · les parents restent jusqu'au dessert | https://qrowg.com/qr-code/restaurant | 2026-09-06 |
| en-file | tiktok-qr-code-carte-enfants-jeu-table-restaurant-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/restaurant | 2026-09-06 |
| en-file | qr-code-tarifs-durees-prestations-salon-coiffure.png | Pinterest | QR code salon coiffure (726416683586817657) | salon/coiffeur · tarifs et durées des prestations · le prix affiché sans avoir à le demander | https://qrowg.com/qr-code/salon | 2026-09-06 |
| en-file | qr-code-menu-buffet-reception-traiteur.png | Pinterest | QR code restaurant (726416683586817614) | traiteur · formules buffet et devis · la demande aboutit au lieu de dormir dans une boîte mail | https://qrowg.com/qr-code/artisan | 2026-09-06 |
| en-file | qr-code-carte-cadeau-dematerialisee-boutique.png | Pinterest | QR code boutique commerce (726416683586817655) | commerce · carte cadeau dématérialisée · offrir sans emballer ni imprimer | https://qrowg.com/qr-code/boutique | 2026-09-06 |
| retiré | qr-code-arrivee-tardive-check-in-autonome-hotel.png | Pinterest | QR code hôtel (726416683586817656) | hôtel/chambre d'hôtes · arrivée tardive en autonomie — **remplacée** par la version re-rendue le 07/09 avec le slug de campagne du jour, publiée le 07/09 à 19 h 03 | — | 2026-09-06 |

> L'épingle **hôtel** a été rendue puis écartée de la sélection du jour pour respecter la
> règle du pont d'audience (`audience-bridge.md` : une seule épingle hors-food par jour ;
> le salon occupait déjà cette place). Elle est contrôlée, QR décodé, réutilisable telle
> quelle un jour où le quota hors-food est libre. Son fichier vit dans
> `social-a-deposer/2026-09-06/`.

> La vidéo `qr-code-carte-enfants-jeu-table-restaurant-reel.mp4` (32,2 s) reste **manuelle**
> et n'entre jamais dans ce circuit.

### qr-code-tarifs-durees-prestations-salon-coiffure
**Titre Pinterest** : Tarifs coiffeur : le prix affiché, sans avoir à demander
**Description** : « C'est combien, un balayage ? » Personne n'ose poser la question au bac, et la cliente découvre le montant à la caisse. Un QR sur le miroir ouvre la carte des prestations : chaque geste, sa durée, son tarif. Les prix changent en janvier, la page suit, l'affiche reste la même. Idée d'organisation pour salon de coiffure, barbier et institut de beauté.
`#coiffure #salondecoiffure #organisation #qrcode`
**Tableau** : QR code salon coiffure

### qr-code-menu-buffet-reception-traiteur
**Titre Pinterest** : Traiteur : les formules buffet consultables en un scan
**Description** : La demande de devis part par mail un mardi soir, et personne ne rappelle. Le client compare ailleurs, la réception se fera sans toi. Un QR sur ta carte ouvre les formules buffet : les menus, le prix par personne, le formulaire à remplir en deux minutes. Les tarifs bougent à la saison, la page suit, la carte reste la même. Idée pratique pour traiteur, chef à domicile et organisation de réception.
`#traiteur #reception #buffet #qrcode`
**Tableau** : QR code restaurant

### qr-code-carte-cadeau-dematerialisee-boutique
**Titre Pinterest** : Carte cadeau dématérialisée : offrir sans emballer ni imprimer
**Description** : Le cadeau se décide la veille, la boutique est fermée et le bon papier dort dans le tiroir. Un QR envoyé par message ouvre la carte cadeau : le montant, la date de validité, les conditions, l'adresse de la boutique. Rien à imprimer, rien à perdre au fond d'un sac, et le montant se met à jour sans réimprimer quoi que ce soit. Idée pour boutique, commerce de proximité et créateur.
`#cartecadeau #boutique #commercelocal #qrcode`
**Tableau** : QR code boutique commerce

### qr-code-arrivee-tardive-check-in-autonome-hotel *(réserve, non planifiée)*
**Titre Pinterest** : Arrivée tardive : le check-in qui se fait sans toi
**Description** : Le train a du retard, il sonne à 23 h et tu dors depuis une heure. Un QR sur la porte ouvre la page d'arrivée : le code de la boîte à clés, l'étage, la marche à suivre, qui appeler en cas de souci. Le code change à chaque réservation, l'autocollant reste le même. Idée pratique pour chambre d'hôtes, location saisonnière et petit hôtel.
`#chambredhotes #locationsaisonniere #hotel #qrcode`
**Tableau** : QR code hôtel

---

### qr-code-carte-bieres-pression-du-moment-bar
**Titre Pinterest** : Bières pression : ce qui coule ce soir, à jour
**Description** : Le fût de la blonde artisanale est vide depuis mardi et l'ardoise l'annonce encore. Le client commande, le serveur s'excuse, la vente se transforme en négociation. Un QR sur la table ouvre la sélection pression du soir : ce qui coule, le degré, le prix — modifié en dix secondes depuis le téléphone du patron. Idée simple pour bar, brasserie et pub.
`#bar #brasserie #biere #qrcode`
**Tableau** : QR code restaurant


---

## 07/09 — production du jour

> **Dépôt fait** (16 PNG via `QRowg-Depot.cmd`), puis **6 posts mis en file** :
> épingle boulangerie (12 h 18 UTC), épingle producteur (14 h 13), carrousel Instagram
> (16 h 49), épingle food truck (18 h 47), épingle hôtel (19 h 03) et carrousel photo
> TikTok (08/09, 04 h 40). **File à 6/10**, aucune erreur. Le stock repasse à vide.
> Contrôle qualité : **16 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> Pas de vidéo (lundi n'est pas un jour vidéo).

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-camion-privatise-evenement-food-truck-01..06.png | Instagram (carrousel) | — | food truck · camion privatisé pour un événement · la demande arrive écrite au lieu de mourir en DM | https://qrowg.com/qr-code/food-truck?utm_source=instagram&utm_medium=carrousel&utm_campaign=20260907-foodtruck | 2026-09-07 |
| en-file | tiktok-qr-code-camion-privatise-evenement-food-truck-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/food-truck?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260907-foodtruck | 2026-09-07 |
| en-file | qr-code-horaires-fournee-pain-chaud-boulangerie.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 0 | boulangerie · horaires de fournée · le pain chaud annoncé à l'heure juste | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260907-foodtruck | 2026-09-07 |
| en-file | qr-code-calendrier-marches-du-mois-producteur.png | Pinterest | QR code food truck (726416683586817654) — gabarit 2 | marché/producteur · calendrier des marchés du mois · le client fidèle sait où te trouver | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260907-foodtruck | 2026-09-07 |
| en-file | qr-code-carte-de-la-semaine-par-theme-food-truck.png | Pinterest | Templates gratuits (726416683586787015) — gabarit 3 | food truck · carte de la semaine par thème · l'autocollant du camion ne bouge jamais | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260907-foodtruck | 2026-09-07 |
| en-file | qr-code-arrivee-tardive-check-in-autonome-hotel.png | Pinterest | QR code hôtel (726416683586817656) — gabarit 1 | hôtel · arrivée tardive en autonomie · le check-in se fait sans toi — *re-rendue avec le slug de campagne du jour* | https://qrowg.com/qr-code/hotel?utm_source=pinterest&utm_medium=pin&utm_campaign=20260907-foodtruck | 2026-09-07 |

## Textes prêts — 07/09

Les légendes Instagram, TikTok, Pinterest et LinkedIn complètes, avec bouton Copier,
sont dans `social-a-deposer\2026-09-07\textes-du-jour-2026-09-07.html`.
Résumé des titres et tableaux Pinterest :

### qr-code-horaires-fournee-pain-chaud-boulangerie
**Titre Pinterest** : Horaires de fournée : le pain chaud, annoncé à l'heure
**Tableau** : QR code boutique commerce
`#boulangerie #painmaison #organisation #commercelocal`

### qr-code-calendrier-marches-du-mois-producteur
**Titre Pinterest** : Calendrier des marchés : où te trouver ce mois-ci
**Tableau** : QR code food truck
`#marche #producteurlocal #circuitcourt #organisation`

### qr-code-carte-de-la-semaine-par-theme-food-truck
**Titre Pinterest** : Carte de la semaine : un thème par lundi, un seul QR
**Tableau** : Templates gratuits
`#foodtruck #streetfood #cartedumenu #commercelocal`

### qr-code-arrivee-tardive-check-in-autonome-hotel
**Titre Pinterest** : Arrivée tardive : le check-in qui se fait sans toi
**Tableau** : QR code hôtel — premier épinglage sur ce tableau
`#hotel #chambredhotes #locationsaisonniere #organisation`

---

## 08/09 — production du jour · DÉPOSÉE ET EN FILE

> **File Buffer trouvée VIDE (0/10)** : les 6 posts du 07/09 sont tous partis.
> Réserve vide au démarrage (tout en `en-file`) : production 100 % neuve.
> Secteur : **restaurant · le service du midi en 20 minutes chrono**, angle jamais traité.
> Rotation respectée (07/09 = food truck). Mardi n'est pas un jour vidéo : pas de mp4.
> Contrôle qualité : **16 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> 4 épingles, 4 angles distincts, **4 gabarits distincts (layouts 0, 1, 2, 3)** et
> **4 tableaux distincts**. Une seule épingle hors-food (salon) : pont d'audience tenu.
>
> **Dépôt fait** (16 PNG via `QRowg-Depot.cmd`), puis **6 posts mis en file** :
> épingle restaurant · softs (13 h 28 UTC), épingle bar · dimanche sport (14 h 44),
> carrousel Instagram (15 h 04), épingle boulangerie · gâteau (18 h 18),
> épingle salon · créneau libéré (19 h 34) et carrousel photo TikTok (09/09, 04 h 05).
> **File à 6/10**, réserve vide. La description de l'épingle boulangerie a été raccourcie
> à la mise en file : Pinterest plafonne à 500 caractères.
>
> ⚠️ **Découverte du run** : `list_posts` avec le statut `error` révèle **4 carrousels
> Instagram jamais publiés** — 05/09, 06/09 et 07/09 (deux fois) — tous rejetés avec
> « Instagram flagged this post as potential spam ». Les « 0 vue, 0 reach » d'Instagram
> ne sont donc pas un problème de portée : **les posts ne sont jamais sortis**. Point
> commun des légendes rejetées : URL brute complète avec UTM + 8 à 10 hashtags.
> Correctif appliqué aujourd'hui : le carrousel Instagram du jour a été réédité sans
> URL dans la légende (« Le lien est dans la bio ») et avec **5 hashtags** au lieu de 10.
> À surveiller demain : si le post du 08/09 passe, la règle devient permanente.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-commande-midi-vingt-minutes-restaurant-01..06.png | Instagram (carrousel) | — | restaurant · service du midi · la commande part à l'assise, la table tourne deux fois | https://qrowg.com/qr-code/menu?utm_source=instagram&utm_medium=carrousel&utm_campaign=20260908-restaurant | 2026-09-08 |
| en-file | tiktok-qr-code-commande-midi-vingt-minutes-restaurant-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/menu?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260908-restaurant | 2026-09-08 |
| retiré | qr-code-carte-softs-sans-alcool-restaurant.png | Pinterest | QR code restaurant — gabarit 0 | restaurant · carte des softs · **remplacée par la version `-v2` écrite pour le clic** | — | 2026-09-08 |
| retiré | qr-code-programme-dimanche-sport-bar.png | Pinterest | Templates gratuits — gabarit 1 | bar · programme du dimanche sport · **remplacée par `-v2`** | — | 2026-09-08 |
| retiré | qr-code-commande-gateau-anniversaire-boulangerie.png | Pinterest | QR code boutique commerce — gabarit 2 | boulangerie · commande de gâteau · **remplacée par `-v2`** | — | 2026-09-08 |
| retiré | qr-code-creneau-libere-derniere-minute-salon.png | Pinterest | QR code salon coiffure — gabarit 3 | salon · créneau libéré · **remplacée par `-v2`** | — | 2026-09-08 |
| en-file | qr-code-carte-softs-sans-alcool-restaurant-v2.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · carte des softs · *écrite pour le clic* — « la monter en 5 minutes » | https://qrowg.com/qr-code/menu?utm_source=pinterest&utm_medium=pin&utm_campaign=20260908-restaurant&utm_content=clic | 2026-09-08 |
| en-file | qr-code-programme-dimanche-sport-bar-v2.png | Pinterest | Templates gratuits (726416683586787015) — gabarit 1 | bar · programme des matchs · *écrite pour le clic* — « l'afficher et le changer chaque semaine » | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260908-restaurant&utm_content=clic | 2026-09-08 |
| en-file | qr-code-commande-gateau-anniversaire-boulangerie-v2.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 2 | boulangerie · commande de gâteau · *écrite pour le clic* — « le formulaire à coller en vitrine » | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260908-restaurant&utm_content=clic | 2026-09-08 |
| en-file | qr-code-creneau-libere-derniere-minute-salon-v2.png | Pinterest | QR code salon coiffure (726416683586817657) — gabarit 3 | salon · créneaux libérés · *écrite pour le clic* — « la page à afficher au miroir » | https://qrowg.com/qr-code/salon?utm_source=pinterest&utm_medium=pin&utm_campaign=20260908-restaurant&utm_content=clic | 2026-09-08 |

## Textes prêts — 08/09

Légendes complètes (Instagram, TikTok, Pinterest ×4, LinkedIn, X) avec bouton Copier :
`social-a-deposer\2026-09-08\textes-du-jour-2026-09-08.html`.
Bios : `social-a-deposer\2026-09-08\bios-du-jour-2026-09-08.html`.
Résumé des titres et tableaux Pinterest :

### qr-code-carte-softs-sans-alcool-restaurant
**Titre Pinterest** : Carte des softs : autre chose que « du Coca »
**Tableau** : QR code restaurant
`#restaurant #sansalcool #cartedesboissons #qrcode`

### qr-code-programme-dimanche-sport-bar
**Titre Pinterest** : Dimanche sport : le programme diffusé, à jour
**Tableau** : Templates gratuits
`#bar #pub #sport #qrcode`

### qr-code-commande-gateau-anniversaire-boulangerie
**Titre Pinterest** : Commande de gâteau : le formulaire plutôt que le téléphone
**Tableau** : QR code boutique commerce
`#boulangerie #patisserie #organisation #commercelocal`

### qr-code-creneau-libere-derniere-minute-salon
**Titre Pinterest** : Créneau libéré : le désistement qui se remplit tout seul
**Tableau** : QR code salon coiffure — unique épingle hors-food du jour
`#salondecoiffure #coiffure #organisation #qrcode`

---

## 09/09 — production du jour · DÉPOSÉE ET MISE EN FILE (réserve vide)

> **Tout est parti en file.** Dépôt effectué en cours de session, puis 6 posts programmés :
> carrousel Instagram, carrousel photo TikTok et les 4 épingles sur 4 tableaux distincts
> (QR code restaurant, QR code boutique commerce, QR code food truck, QR code hôtel).
> **File à 6/10, réserve vide.** Contrôle qualité : 16 visuels, 0 alerte, chaque QR décodé
> vers son lien tracké. Textes conservés ci-dessous.
> La vidéo `qr-code-carte-cocktails-de-saison-bar-reel.mp4` (32,2 s) reste **manuelle**.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-carte-cocktails-de-saison-bar-01..06.png | Instagram (carrousel) | — | bar · carte des cocktails de saison · la carte suit la saison, le support ne bouge plus | https://qrowg.com/qr-code/restaurant?utm_source=instagram&utm_medium=carrousel&utm_campaign=20260909-bar | 2026-09-09 |
| en-file | tiktok-qr-code-carte-cocktails-de-saison-bar-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/restaurant?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260909-bar | 2026-09-09 |
| en-file | qr-code-plat-du-jour-epuise-signale-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · plat du jour épuisé · le barrer en 10 secondes | https://qrowg.com/qr-code/menu?utm_source=pinterest&utm_medium=pin&utm_campaign=20260909-bar&utm_content=clic | 2026-09-09 |
| en-file | qr-code-formule-petit-dejeuner-a-emporter-boulangerie.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 1 | boulangerie · formule petit-déjeuner à emporter · le prix lisible en trois minutes | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260909-bar&utm_content=clic | 2026-09-09 |
| en-file | qr-code-fiche-conservation-produit-de-saison-producteur.png | Pinterest | QR code food truck (726416683586817654) — gabarit 2 | marché/producteur · fiche conservation du produit · le produit ne finit plus à la poubelle | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260909-bar&utm_content=clic&utm_term=producteur | 2026-09-09 |
| en-file | qr-code-plan-des-transports-depuis-la-gare-hotel.png | Pinterest | QR code hôtel (726416683586817656) — gabarit 3 | hôtel · plan des transports depuis la gare · le même message n'est plus réécrit | https://qrowg.com/qr-code/hotel?utm_source=pinterest&utm_medium=pin&utm_campaign=20260909-bar&utm_content=clic | 2026-09-09 |

## Textes prêts — 09/09

### Instagram (carrousel) — aucune URL dans la légende, 5 hashtags, `isAiGenerated: true`
L'été est fini. Ta carte, elle, ne le sait pas encore.

Le mojito est toujours en deuxième ligne, la menthe n'est plus la même et les fruits rouges ont disparu. Le client commande, le serveur s'excuse. Trois fois par service.

Un QR posé sur la table ouvre la carte du moment : ce qui est faisable ce soir, avec ce qu'il y a vraiment derrière le bar. Nouveau cocktail à 17 h, en ligne à 17 h 02, depuis ton téléphone.

Quatre saisons dans l'année. Quatre passages chez l'imprimeur — ou zéro.

Le lien est dans la bio.

`#bar #cocktails #cartedujour #commercelocal #qrcode`

### TikTok (carrousel photo) — copies `tiktok-`, PAS de `isAiGenerated`
Ta carte des cocktails date de juillet. On est en septembre.

Plus de fruits rouges, plus de menthe correcte — mais la carte les propose encore. Le client commande, tu t'excuses.

Un QR sur la table, la carte du soir change en dix secondes. Le carton imprimé, lui, ne bouge plus jamais.

https://qrowg.com/qr-code/restaurant?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260909-bar

`#bar #cocktails #barman #restauration #commercelocal`

### Pinterest ×4
Les quatre titres, descriptions (toutes ≤ 500 caractères) et tableaux sont dans
`2026-09-09\textes-du-jour-2026-09-09.html`. Résumé :
- **QR code restaurant** — « Plat épuisé : le barrer en 10 secondes, sans réimprimer »
- **QR code boutique commerce** — « Formule petit-déj : la monter en 5 minutes, gratuitement »
- **QR code food truck** — « Fiche conservation : la créer en 5 minutes, sans carte bancaire »
- **QR code hôtel** — « Plan depuis la gare : la page à faire en 4 étapes »

---

## 10/09 — production du jour · réserve VIDE au démarrage et à l'arrivée

> Aucun contenu en statut `dispo` au démarrage du run : rien à réinjecter, production
> 100 % neuve. Les 16 visuels du jour (6 slides + 6 copies TikTok + 4 épingles) tiennent
> tous dans la file (10 places libres après mise en brouillon des deux doublons) :
> **rien ne part au stock aujourd'hui**. Confirmé après coup : les 6 posts sont en file
> (1 Instagram, 1 TikTok, 4 Pinterest), file à 6/10, **réserve toujours vide**.
>
> Deux posts ont en revanche été **mis en brouillon dans Buffer** (pas supprimés, pas
> archivés ici) parce qu'ils rejouaient le contenu du 09/09 :
> `6aa264da284ead110948cf20` (Instagram, carrousel cocktails déjà en ligne) et
> `6aa264d194192583998c5bf1` (Pinterest, angle bar cocktails de la veille).
> Ils restent récupérables dans Buffer et n'ont pas leur place en réserve : ce sont des
> doublons, pas du contenu en attente.

---

## 11/09 — production du jour · réserve VIDE au démarrage

> Aucun contenu en statut `dispo` au démarrage : rien à réinjecter, production 100 % neuve.
> Les 16 visuels du jour (6 slides + 6 copies TikTok + 4 épingles) tiennent dans la file
> (10 places libres) : **rien ne part au stock aujourd'hui**.
> Le reel de 32,2 s est **manuel** et n'entre jamais en réserve.

---

## 12/09 — production du jour · réserve VIDE au démarrage

> Aucun contenu en statut `dispo` au démarrage : rien à réinjecter, production 100 % neuve.
> Les 16 visuels du jour (6 slides + 6 copies TikTok + 4 épingles) tiennent dans la file
> (9 places libres, 6 posts à programmer) : **rien ne part au stock aujourd'hui**.
> Le reel de 32,2 s est **manuel** et n'entre jamais en réserve.
> **Dépôt fait et file remplie** : 16 images déposées, puis **6 posts mis en file**
> (TikTok 15 h 39 · Pinterest restaurant 16 h 11 · Pinterest boulangerie 17 h 27 ·
> Instagram 20 h 40 · Pinterest food truck 21 h 29 · Pinterest immobilier 13/09 10 h 26).
> Le stock repasse à **vide** (`en-file` partout).

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-soiree-quiz-feuilles-de-score-bar-01..06.png | Instagram (carrousel) | — | bar · soirée quiz · les feuilles de score comptées à la main en plein service | https://qrowg.com/qr-code/restaurant?utm_source=instagram&utm_medium=bio&utm_campaign=20260912-bar | 2026-09-12 |
| en-file | tiktok-qr-code-soiree-quiz-feuilles-de-score-bar-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/restaurant?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260912-bar | 2026-09-12 |
| en-file | qr-code-origine-des-produits-fiche-plat-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · origine des produits · le serveur improvise la réponse | https://qrowg.com/qr-code/menu?utm_source=pinterest&utm_medium=pin&utm_campaign=20260912-bar&utm_content=clic | 2026-09-12 |
| en-file | qr-code-tournee-livraison-entreprises-boulangerie.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 1 | boulangerie · tournée de livraison aux entreprises · cinquante salariés à côté, zéro commande | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260912-bar&utm_content=clic | 2026-09-12 |
| en-file | qr-code-abonnement-midi-habitues-food-truck.png | Pinterest | QR code food truck (726416683586817654) — gabarit 2 | food truck · formule des habitués · trois midis par semaine et toujours la même file | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260912-bar&utm_content=clic | 2026-09-12 |
| en-file | qr-code-dossier-de-location-prerempli-immobilier.png | Pinterest | QR code immobilier (726416683586817652) — gabarit 3 — *unique épingle hors-food* | immobilier · dossier de location prérempli · douze visites, douze dossiers incomplets | https://qrowg.com/qr-code/immobilier?utm_source=pinterest&utm_medium=pin&utm_campaign=20260912-bar&utm_content=clic&utm_term=location | 2026-09-12 |

> La vidéo `qr-code-soiree-quiz-feuilles-de-score-bar-reel.mp4` (32,2 s, 1080×1920) reste
> **manuelle** et n'entre jamais dans ce circuit. La planche-contact `.sheet.png` est
> archivée dans `2026-09-12\_controle\` et **exclue du dossier de dépôt**.

## Textes prêts — 12/09

Légendes complètes (Instagram, TikTok, Pinterest ×4, X, reel) avec bouton Copier :
`social-a-deposer\2026-09-12\textes-du-jour-2026-09-12.html`.
Bios : `social-a-deposer\2026-09-12\bios-du-jour-2026-09-12.html`.
Pas de post LinkedIn aujourd'hui (LinkedIn = lundi → vendredi).
Résumé des titres et tableaux Pinterest :

### qr-code-origine-des-produits-fiche-plat-restaurant
**Titre Pinterest** : Origine des produits : la fiche à faire en 4 étapes
**Tableau** : QR code restaurant
`#restaurant #producteurlocal #cartedujour #commercelocal`

### qr-code-tournee-livraison-entreprises-boulangerie
**Titre Pinterest** : Livraison aux entreprises : la page à monter en 5 minutes
**Tableau** : QR code boutique commerce
`#boulangerie #livraison #entreprise #commercelocal`

### qr-code-abonnement-midi-habitues-food-truck
**Titre Pinterest** : Formule des habitués : la créer en 4 étapes, sans carte bancaire
**Tableau** : QR code food truck
`#foodtruck #streetfood #pausedejeuner #commercelocal`

### qr-code-dossier-de-location-prerempli-immobilier
**Titre Pinterest** : Dossier de location : la page à créer en 4 étapes
**Tableau** : QR code immobilier — unique épingle hors-food
`#immobilier #location #agentimmobilier #qrcode`

---

## 13/09 — production du jour · DÉPOSÉE ET MISE EN FILE (réserve vide)

> Réserve **vide** au démarrage (tout en `en-file`) : production 100 % neuve.
> Contrôle qualité : **16 visuels, 0 alerte**, les 8 QR décodés vers leur lien tracké.
> **Dépôt fait** (16 PNG via `QRowg-Depot.cmd`), puis **6 posts mis en file** :
> épingle boulangerie (13 h 17 UTC), épingle producteur (18 h 27), carrousel Instagram
> (19 h 07), épingle food truck (19 h 11), carrousel photo TikTok (14/09, 06 h 40) et
> épingle boutique (14/09, 12 h 18). **File à 6/10**, aucune erreur.
> Le stock repasse à **vide** (`en-file` partout).

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-anniversaire-privatisation-salle-restaurant-01..06.png | Instagram (carrousel) | — | restaurant · anniversaire et privatisation de la salle · la demande de groupe arrive écrite au lieu d'un SMS à 23 h | https://qrowg.com/qr-code/restaurant?utm_source=instagram&utm_medium=bio&utm_campaign=20260913-restaurant | 2026-09-13 |
| en-file | tiktok-qr-code-anniversaire-privatisation-salle-restaurant-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/restaurant?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260913-restaurant | 2026-09-13 |
| en-file | qr-code-farines-et-provenances-affichees-boulangerie.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 0 | boulangerie · provenance des farines · « elle vient d'où, ta farine ? » | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260913-restaurant&utm_content=clic | 2026-09-13 |
| en-file | qr-code-vente-a-la-ferme-hors-marche-producteur.png | Pinterest | QR code food truck (726416683586817654) — gabarit 1 | marché/producteur · vente à la ferme hors marché · le client du samedi ignore qu'il peut passer le mercredi | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260913-restaurant&utm_content=clic&utm_term=producteur | 2026-09-13 |
| en-file | qr-code-tournee-festivals-dates-et-scene-food-truck.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 2 | food truck · tournée de festivals · la scène, l'entrée et l'heure de service changent à chaque date | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260913-restaurant&utm_content=clic | 2026-09-13 |
| en-file | qr-code-notice-et-mode-d-emploi-du-produit-boutique.png | Pinterest | **Avis Google commerce** (726416683586817650) — gabarit 3 — *unique épingle hors-food* | commerce/boutique · notice et mode d'emploi · le papier part à la poubelle avec le carton | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260913-restaurant&utm_content=clic&utm_term=notice | 2026-09-13 |

> La vidéo `qr-code-anniversaire-privatisation-salle-restaurant-reel.mp4` (32,2 s,
> 1080×1920) reste **manuelle** et n'entre jamais en réserve.

## Textes prêts — 13/09

Légendes complètes (Instagram, TikTok, Pinterest ×4, reel) avec bouton Copier :
`social-a-deposer\2026-09-13\textes-du-jour-2026-09-13.html`.
Bios : `social-a-deposer\2026-09-13\bios-du-jour-2026-09-13.html`.
Pas de LinkedIn ni de X aujourd'hui (dimanche).

### qr-code-farines-et-provenances-affichees-boulangerie
**Titre Pinterest** : Provenance des farines : la page à faire en 4 étapes
**Tableau** : QR code boutique commerce
`#boulangerie #farine #artisanboulanger #commercelocal`

### qr-code-vente-a-la-ferme-hors-marche-producteur
**Titre Pinterest** : Vente à la ferme : la page à créer gratuitement en 5 min
**Tableau** : QR code food truck
`#producteurlocal #ventealaferme #circuitcourt #commercelocal`

### qr-code-tournee-festivals-dates-et-scene-food-truck
**Titre Pinterest** : Tournée de festivals : le planning à monter en 5 minutes
**Tableau** : QR code restaurant
`#foodtruck #streetfood #festival #commercelocal`

### qr-code-notice-et-mode-d-emploi-du-produit-boutique
**Titre Pinterest** : Notice du produit : la page à créer en 4 étapes, gratuite
**Tableau** : Avis Google commerce — premier épinglage sur ce tableau
`#boutique #commercelocal #organisation #qrcode`

---

## 14/09 — production du jour · DÉPOSÉE ET MISE EN FILE (réserve vide)

> Réserve **vide** au démarrage (tout en `en-file`) : production 100 % neuve.
> Étape 0 : un post Instagram en `error` (carrousel anniversaire du 13/09) correspondait
> exactement à un `sent` de 19 h 07 → **il était en ligne**, passé en brouillon avec la
> mention `[DÉJÀ EN LIGNE — NE PAS RETRY]`. Onglet `error` vide. Aucun doublon parmi les
> `scheduled` (1 seul post : épingle boutique du 13/09, due le 14/09 à 12 h 18).
> **9 places libres** dans la file.
> Contrôle qualité : **16 visuels, 0 alerte**, les 8 QR décodés vers leur lien tracké.
> **Dépôt fait** (16 PNG via `QRowg-Depot.cmd`), puis **6 posts mis en file** : épingle
> producteur (14 h 13 UTC), carrousel Instagram (16 h 49), épingle hôtel (18 h 47),
> épingle restaurant (19 h 03), carrousel photo TikTok (15/09, 04 h 40) et épingle
> immobilier (15/09, 13 h 28). Avec l'épingle boutique du 13/09 encore en attente,
> **file à 7/10**, aucune erreur. Le stock repasse à **vide** (`en-file` partout).

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-fiche-technique-couleur-formule-salon-01..06.png | Instagram (carrousel) | — | salon · fiche technique de la couleur · la formule est lisible par toute l'équipe, même sans la coloriste | https://qrowg.com/qr-code/salon?utm_source=instagram&utm_medium=bio&utm_campaign=20260914-salon | 2026-09-14 |
| en-file | tiktok-qr-code-fiche-technique-couleur-formule-salon-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/salon?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260914-salon | 2026-09-14 |
| en-file | qr-code-calendrier-semis-et-recoltes-etal-producteur.png | Pinterest | QR code food truck (726416683586817654) — gabarit 0 | producteur · calendrier des semis et des récoltes · « c'est quand, les fraises ? » | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260914-salon&utm_content=clic&utm_term=producteur | 2026-09-14 |
| en-file | qr-code-bonnes-adresses-du-quartier-hotel.png | Pinterest | QR code hôtel (726416683586817656) — gabarit 1 | hôtel · bonnes adresses du quartier tenues à jour · le classeur de la réception date de trois ans | https://qrowg.com/qr-code/hotel?utm_source=pinterest&utm_medium=pin&utm_campaign=20260914-salon&utm_content=clic | 2026-09-14 |
| en-file | qr-code-objets-oublies-vestiaire-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 2 | restaurant · vestiaire et objets oubliés · l'écharpe sous la banquette et personne à rappeler | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260914-salon&utm_content=clic | 2026-09-14 |
| en-file | qr-code-charges-et-taxes-du-bien-immobilier.png | Pinterest | QR code immobilier (726416683586817652) — gabarit 3 — *unique épingle hors-food* | immobilier · récapitulatif des charges et taxes du bien · la question tombe à chaque visite | https://qrowg.com/qr-code/immobilier?utm_source=pinterest&utm_medium=pin&utm_campaign=20260914-salon&utm_content=clic&utm_term=charges | 2026-09-14 |

> Pas de vidéo aujourd'hui (jours vidéo : mer, ven, sam, dim).

## Textes prêts — 14/09

Légendes complètes (Instagram, TikTok, Pinterest ×4, LinkedIn) avec bouton Copier :
`social-a-deposer\2026-09-14\textes-du-jour-2026-09-14.html`.
Bios : `social-a-deposer\2026-09-14\bios-du-jour-2026-09-14.html`.
Pas de X aujourd'hui (X = mardi, jeudi, samedi).

### qr-code-calendrier-semis-et-recoltes-etal-producteur
**Titre Pinterest** : Calendrier des récoltes : la page à créer en 5 minutes
**Tableau** : QR code food truck
`#producteurlocal #circuitcourt #marche #commercelocal`

### qr-code-bonnes-adresses-du-quartier-hotel
**Titre Pinterest** : Bonnes adresses du quartier : le guide à monter en 4 étapes
**Tableau** : QR code hôtel — premier épinglage sur ce tableau
`#hotel #chambredhotes #voyage #commercelocal`

### qr-code-objets-oublies-vestiaire-restaurant
**Titre Pinterest** : Objets trouvés au restaurant : la page à créer en 5 minutes
**Tableau** : QR code restaurant
`#restaurant #restauration #serviceclient #commercelocal`

### qr-code-charges-et-taxes-du-bien-immobilier
**Titre Pinterest** : Charges et taxes du bien : la fiche à monter en 4 étapes
**Tableau** : QR code immobilier — unique épingle hors-food
`#immobilier #agentimmobilier #investissement #qrcode`


---

## 15/09 — production du jour · DÉPOSÉE ET MISE EN FILE

> Réserve **vide** au démarrage (tout en `en-file`) : production 100 % neuve.
> Étape 0 : onglet `error` **vide**, aucune purge à faire. Un seul `scheduled`
> (épingle immobilier du 14/09, due aujourd'hui 13 h 28 UTC), pas un doublon.
> **9 places libres.** Garde 0.D : le carrousel photo TikTok du 14/09 est parti
> ce matin à 04 h 42 UTC → **aucun post TikTok créé aujourd'hui**, les 6 copies
> `tiktok-` restent en `dispo` pour réinjection demain. Instagram libre (0 post du jour).
> Contrôle qualité : **16 visuels, 0 alerte**, les 8 QR décodés vers leur lien tracké.
> **Dépôt fait** (16 PNG via `QRowg-Depot.cmd`), puis **5 posts mis en file** :
> épingle bar (14 h 44 UTC), carrousel Instagram (15 h 04), épingle food truck (18 h 18),
> épingle restaurant (19 h 34) et épingle boutique (16/09, 12 h 48). Avec l'épingle
> immobilier du 14/09 encore en attente, **file à 6/10**, aucune erreur.
> **Seules les 6 copies `tiktok-` restent en `dispo`** — bloquées par la garde 0.D,
> à réinjecter le 16/09.
> La description Pinterest de l'épingle boutique a dû être raccourcie : Buffer refuse
> au-delà de 500 caractères (première fois que la limite mord).

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-points-de-depot-commande-groupee-producteur-01..06.png | Instagram (carrousel) | — | producteur · points de dépôt et commande groupée · la cliente habite à trois rues d'un relais qu'elle ignore | https://qrowg.com/qr-code/artisan?utm_source=instagram&utm_medium=bio&utm_campaign=20260915-producteur | 2026-09-15 |
| en-file | tiktok-qr-code-points-de-depot-commande-groupee-producteur-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 — bloqué par la garde 0.D le 15/09, **réinjecté le 16/09 à 12 h 59 (file 20 h 08 UTC)** | https://qrowg.com/qr-code/artisan?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260915-producteur | 2026-09-15 |
| en-file | qr-code-digestifs-et-cafes-apres-repas-bar.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | bar · carte des digestifs et cafés d'après-repas · le dessert est débarrassé et il n'y a plus rien à proposer | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260915-producteur&utm_content=clic | 2026-09-15 |
| en-file | qr-code-carte-allergenes-du-camion-food-truck.png | Pinterest | QR code food truck (726416683586817654) — gabarit 1 | food truck · carte des allergènes du camion · « il y a quoi dans la sauce ? » avec quinze personnes derrière | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260915-producteur&utm_content=clic | 2026-09-15 |
| en-file | qr-code-equipe-en-cuisine-ce-soir-restaurant.png | Pinterest | **Templates gratuits** (726416683586787015) — gabarit 2 | restaurant · fiche « qui cuisine ce soir » · le client demande qui a fait le plat, le serveur cite un prénom | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260915-producteur&utm_content=clic&utm_term=equipe | 2026-09-15 |
| en-file | qr-code-parrainage-client-en-caisse-boutique.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 3 — *unique épingle hors-food* | commerce/boutique · parrainage client en caisse · « vous connaissez quelqu'un ? », elle dit oui et elle sort | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260915-producteur&utm_content=clic&utm_term=parrainage | 2026-09-15 |

> Pas de vidéo aujourd'hui (jours vidéo : mer, ven, sam, dim).
> Défaut typographique attrapé à l'œil sur l'épingle restaurant (« ? » orphelin) :
> titre raccourci, épingle re-rendue seule, QC repassé à 0 alerte.

## Textes prêts — 15/09

Légendes complètes (Instagram, TikTok, Pinterest ×4, LinkedIn, X) avec bouton Copier :
`social-a-deposer\2026-09-15\textes-du-jour-2026-09-15.html`.
Bios : `social-a-deposer\2026-09-15\bios-du-jour-2026-09-15.html`.

### qr-code-digestifs-et-cafes-apres-repas-bar
**Titre Pinterest** : Carte des digestifs : la page à créer en 5 minutes
**Tableau** : QR code restaurant
`#bar #restaurant #digestif #commercelocal`

### qr-code-carte-allergenes-du-camion-food-truck
**Titre Pinterest** : Carte allergènes du camion : la page à monter en 4 étapes
**Tableau** : QR code food truck
`#foodtruck #streetfood #allergenes #commercelocal`

### qr-code-equipe-en-cuisine-ce-soir-restaurant
**Titre Pinterest** : Fiche équipe du restaurant : le modèle à remplir en 5 minutes
**Tableau** : Templates gratuits
`#restaurant #restauration #equipe #commercelocal`

### qr-code-parrainage-client-en-caisse-boutique
**Titre Pinterest** : Parrainage client : la page à créer gratuitement en 4 étapes
**Tableau** : QR code boutique commerce — unique épingle hors-food
`#boutique #commercelocal #fidelisation #qrcode`

---

## 16/09 — mercredi · hôtel / hospitalité · PRODUITE, NON DÉPOSÉE → RÉSERVE

> **Rien de ce lot n'est déposé** : `QRowg-Depot.cmd` demande une action de l'utilisateur,
> absent pendant ce run planifié. Buffer refuse une image dont l'URL n'est pas déjà
> accessible, donc aucune de ces épingles n'a pu être mise en file (règle étape 5.3).
> Tout part en `dispo` : rien n'est perdu, tout est réinjectable dès le dépôt fait.
>
> **Run parallèle détecté (0.E), actif pendant ce run.** Il a écrit dans
> `social-a-deposer\2026-09-16\` à **15 h 06 min 53 s**, une minute avant ce run
> (15 h 07 min 55 s), et il a mis le carrousel photo TikTok du stock en file à
> **12 h 59 min 59 s** (dueAt 20 h 08 UTC). Les deux canaux du jour étant servis,
> ce run n'a rien ajouté dans Buffer. Ses propres visuels du jour
> (`qr-code-carte-cadeau-du-salon-coiffure`, `qr-code-fermetures-et-conges-du-camion-food-truck`,
> `qr-code-vins-de-producteurs-voisins-bar`, reel boulangerie « pain de la veille »)
> relèvent de son journal, pas de celui-ci.
>
> Contrôle qualité : **4 visuels, 0 alerte**, les 4 QR décodés vers leur lien tracké.
> Deux défauts typographiques attrapés à l'œil, corrigés et re-rendus seuls :
> « AU » orphelin en bout de titre sur l'épingle boulangerie (titre raccourci en
> « D'où vient cette farine »), et un deux-points rejeté en début de ligne dans le
> sous-titre de l'épingle hôtel (reformulé en deux phrases).
> Vidéo **31,2 s** (9 scènes, 9 moteurs, palette `or` stable, scrim 0,72) — **manuelle**.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-doggy-bag-restes-a-emporter-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · doggy bag et restes à emporter · il reste la moitié de l'assiette, elle n'ose pas demander | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-hotel&utm_content=clic&utm_term=doggybag | 2026-09-16 |
| retiré | qr-code-calendrier-fermetures-et-conges-food-truck.png | Pinterest | QR code food truck (726416683586817654) — gabarit 1 | food truck · calendrier des fermetures et congés — **doublon d'angle** avec `qr-code-fermetures-et-conges-du-camion-food-truck.png`, produit par le run parallèle à 15 h 06 min 53 s, une minute avant celui-ci. Le sien est antérieur, celui-ci est retiré. Fichier conservé sur le disque. | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-hotel&utm_content=clic&utm_term=conges | 2026-09-16 |
| en-file | qr-code-farines-et-provenances-du-pain-boulangerie.png | Pinterest | **Templates gratuits** (726416683586787015) — gabarit 2 | boulangerie · farines et provenances du pain · « elle vient d'où, cette farine » sans personne pour répondre | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-hotel&utm_content=clic&utm_term=farines | 2026-09-16 |
| en-file | qr-code-reglement-interieur-et-horaires-hotel.png | Pinterest | QR code hôtel (726416683586817656) — gabarit 3 — *unique épingle hors-food* | hôtel · règlement intérieur et horaires · check-out, wifi, accès : les horaires ne sont pas sur la porte | https://qrowg.com/qr-code/hotel?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-hotel&utm_content=clic&utm_term=reglement | 2026-09-16 |
| dispo | qr-code-petit-dejeuner-commande-la-veille-hotel-reel.mp4 | Instagram + TikTok — **À PUBLIER À LA MAIN** | — | hôtel · petit-déjeuner commandé la veille · 7 h 30, personne ne sait combien de couverts dresser | https://qrowg.com/qr-code/hotel?utm_source=instagram&utm_medium=reel&utm_campaign=20260916-hotel | 2026-09-16 |

## Textes prêts — 16/09

Légendes complètes (Pinterest ×4, LinkedIn, X, reel) avec bouton Copier :
`social-a-deposer\2026-09-16\textes-du-jour-2026-09-16.html`.
Bios : `social-a-deposer\2026-09-16\bios-du-jour-2026-09-16.html`.

### qr-code-doggy-bag-restes-a-emporter-restaurant
**Titre Pinterest** : Doggy bag : la page à créer en 5 minutes
**Tableau** : QR code restaurant
`#restaurant #restauration #antigaspi #commercelocal`

### qr-code-farines-et-provenances-du-pain-boulangerie
**Titre Pinterest** : Farines et provenances : la fiche à remplir en 4 étapes
**Tableau** : Templates gratuits
`#boulangerie #artisan #painmaison #commercelocal`

### qr-code-reglement-interieur-et-horaires-hotel
**Titre Pinterest** : Règlement et horaires : la page d'accueil à monter en 5 minutes
**Tableau** : QR code hôtel — unique épingle hors-food
`#hotel #chambredhotes #locationsaisonniere #qrcode`

---

## 16/09 — production du jour · EN RÉSERVE, DÉPÔT NON FAIT

> Exécution automatique : personne n'était là pour lancer `QRowg-Depot.cmd`, donc
> **aucune des 4 épingles n'est déposée** et aucune ne peut aller dans Buffer
> (Buffer refuse une image dont l'URL n'est pas déjà accessible). Elles passent toutes
> en `dispo` — rien n'est perdu. Dès que les URL reviennent, elles se mettent en file
> sans rien reproduire.
> Les 6 copies `tiktok-` du 15/09, elles, sont **sorties du stock** ce matin : leurs
> images étaient déjà en ligne depuis le dépôt du 15/09, la mise en file a donc marché.
> **⚠ Collision avec un run parallèle** (voir journal, 0.E) : *food truck · fermetures
> et congés* et *restaurant · doggy bag* existent en **deux exemplaires**, produits par
> deux runs différents avec des liens trackés différents. **Ne déposer qu'une version**
> — celle de ce run porte la campagne `20260916-boulangerie`.
> Contrôle qualité : **4 visuels, 0 alerte**, les 4 QR décodés vers leur lien tracké.
> Vidéo `qr-code-pain-de-la-veille-prix-reduit-boulangerie-reel.mp4` (31,4 s) :
> **manuelle**, jamais déposée, jamais mise en file.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-doggy-bag-restes-a-emporter-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · doggy bag et restes à emporter · il reste la moitié du plat, personne n'ose demander | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-boulangerie&utm_content=clic&utm_term=doggybag | 2026-09-16 |
| dispo | qr-code-fermetures-et-conges-du-camion-food-truck.png | Pinterest | QR code food truck (726416683586817654) — gabarit 1 | food truck · calendrier des fermetures et congés · fermé trois semaines, ils viennent quand même | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-boulangerie&utm_content=clic&utm_term=conges | 2026-09-16 |
| dispo | qr-code-vins-de-producteurs-voisins-bar.png | Pinterest | Templates gratuits (726416683586787015) — gabarit 2 | bar · carte des vins de producteurs voisins · « ce vin vient d'où ? », tu réponds de mémoire | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-boulangerie&utm_content=clic&utm_term=vins | 2026-09-16 |
| dispo | qr-code-carte-cadeau-du-salon-coiffure.png | Pinterest | QR code salon coiffure (726416683586817657) — gabarit 3 — *unique épingle hors-food* | salon · carte cadeau dématérialisée · achetée en décembre, retrouvée en mars, périmée en avril | https://qrowg.com/qr-code/salon?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-boulangerie&utm_content=clic&utm_term=cartecadeau | 2026-09-16 |

## Textes prêts — 16/09

Légendes (Instagram, TikTok, Pinterest ×4, LinkedIn, X, reel) avec bouton Copier :
`social-a-deposer\2026-09-16\textes-du-jour-2026-09-16.html`.
Bios : `social-a-deposer\2026-09-16\bios-du-jour-2026-09-16.html`.

### qr-code-doggy-bag-restes-a-emporter-restaurant
**Titre Pinterest** : Page à emporter du restaurant : le modèle à créer en 5 minutes
**Tableau** : QR code restaurant
`#restaurant #restauration #antigaspi #commercelocal`

### qr-code-fermetures-et-conges-du-camion-food-truck
**Titre Pinterest** : Calendrier des congés du food truck : la page à monter en 4 étapes
**Tableau** : QR code food truck
`#foodtruck #streetfood #marche #commercelocal`

### qr-code-vins-de-producteurs-voisins-bar
**Titre Pinterest** : Fiche vin du bar : le modèle gratuit à remplir en 5 minutes
**Tableau** : Templates gratuits
`#bar #vin #producteurlocal #commercelocal`

### qr-code-carte-cadeau-du-salon-coiffure
**Titre Pinterest** : Carte cadeau du salon : la page à créer gratuitement en 4 étapes
**Tableau** : QR code salon coiffure — unique épingle hors-food
`#coiffeur #salondecoiffure #cartecadeau #beaute`

> **Dépôt fait le 16/09 à 14 h 30 UTC** (4 PNG via `QRowg-Depot.cmd`), puis **3 épingles
> mises en file** dans la même session : doggy bag restaurant (16/09, 17 h 06 UTC, tableau
> QR code restaurant), farines boulangerie (17/09, 12 h 21, Templates gratuits) et règlement
> hôtel (17/09, 14 h 49, QR code hôtel) — **3 tableaux distincts**. La quatrième image
> déposée, l'épingle food truck, **reste en `retiré` et n'a PAS été mise en file** : doublon
> d'angle avec le run parallèle. Relecture de la file après coup : **5 `scheduled` exactement**
> (les 3 épingles + le carrousel Instagram + le carrousel photo TikTok), ni plus ni moins.
> **File à 5/10.** Seule la vidéo reste en `dispo`, par nature — elle se publie à la main.

## 20/09 — production du jour · EN RÉSERVE, DÉPÔT NON FAIT

> Exécution automatique un dimanche : personne n'était là pour lancer `QRowg-Depot.cmd`.
> Aucun visuel n'est déposé, donc **aucune mise en file n'était possible** (Buffer refuse
> une image dont l'URL n'est pas accessible — vérifié en direct ce matin, voir ci-dessous).
> **Tout le lot passe en `dispo`** : rien n'est perdu, tout repart en file dès le dépôt,
> sans rien reproduire. **File Buffer à 0/10** en fin de run.
>
> **Correction du stock du 16/09.** La ligne `qr-code-vins-de-producteurs-voisins-bar.png`
> était donnée comme déposée : c'est **faux**. La tentative de mise en file de ce jour a
> été refusée par Buffer (`Image could not be read from its URL`). Le dépôt du 16/09 n'a
> poussé que les 4 PNG du run hôtel ; les visuels issus du run parallèle
> (`vins-de-producteurs-voisins-bar`, `carte-cadeau-du-salon-coiffure`) n'ont jamais quitté
> le disque. Les deux restent en `dispo`, et l'épingle bar/vins est **recopiée dans le lot
> du 20/09** pour partir au prochain dépôt.
> L'épingle `qr-code-fermetures-et-conges-du-camion-food-truck` reste **interdite jusqu'au
> 07/10** (règle des 21 jours, angle consommé par le run parallèle).
>
> Contrôle qualité du jour : **16 visuels, 0 alerte**, 8 QR décodés vers leur lien tracké.
> Vidéo `qr-code-liste-attente-produit-en-rupture-boutique-reel.mp4` (31,2 s) :
> **manuelle**, jamais déposée, jamais mise en file.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-carte-sans-alcool-boissons-maison-restaurant-01..06.png | Instagram (carrousel) | — | restaurant · carte des sans-alcool et boissons maison · trois personnes à table ne boivent pas, la carte n'a rien pour elles | https://qrowg.com/qr-code/restaurant?utm_medium=carrousel&utm_campaign=20260920-restaurant | 2026-09-20 |
| en-file | tiktok-qr-code-carte-sans-alcool-boissons-maison-restaurant-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 | https://qrowg.com/qr-code/restaurant?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260920-restaurant | 2026-09-20 |
| en-file | qr-code-carte-bieres-de-saison-bar.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | bar · carte des bières de saison · la blonde de septembre n'est plus là, l'ardoise dit le contraire | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260920-restaurant&utm_content=clic&utm_term=bieres | 2026-09-20 |
| en-file | qr-code-tournee-depots-de-pain-villages-boulangerie.png | Pinterest | Templates gratuits (726416683586787015) — gabarit 1 | boulangerie · tournée et dépôts de pain dans les villages · personne au village ne donne la même heure | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260920-restaurant&utm_content=clic&utm_term=tournee | 2026-09-20 |
| en-file | qr-code-menu-enfant-du-camion-food-truck.png | Pinterest | QR code food truck (726416683586817654) — gabarit 2 | food truck · menu enfant du camion · « et pour le petit, vous avez quoi ? », tu réponds en criant dans la file | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260920-restaurant&utm_content=clic&utm_term=menuenfant | 2026-09-20 |
| en-file | qr-code-diagnostics-et-plan-sur-le-panneau-immobilier.png | Pinterest | QR code immobilier (726416683586817652) — gabarit 3 — *unique épingle hors-food* | immobilier · diagnostics et plan sur le panneau · le panneau dit le prix, rien de plus | https://qrowg.com/qr-code/immobilier?utm_source=pinterest&utm_medium=pin&utm_campaign=20260920-restaurant&utm_content=clic&utm_term=diagnostics | 2026-09-20 |
| dispo | qr-code-liste-attente-produit-en-rupture-boutique-reel.mp4 | Instagram + TikTok — **À PUBLIER À LA MAIN** | — | commerce · liste d'attente sur un produit en rupture · elle voulait le 38, elle ne repassera pas jeudi | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=reel&utm_campaign=20260920-restaurant | 2026-09-20 |

## Textes prêts — 20/09

Légendes (Instagram, TikTok, Pinterest ×4 + l'épingle bar/vins du stock, LinkedIn, X, reel)
avec bouton Copier : `social-a-deposer\2026-09-20\textes-du-jour-2026-09-20.html`.
Bios : `social-a-deposer\2026-09-20\bios-du-jour-2026-09-20.html`.

### qr-code-carte-bieres-de-saison-bar
**Titre Pinterest** : Carte des bières de saison : le modèle à créer en 5 minutes
**Tableau** : QR code restaurant · `#bar #biere #brasserie #commercelocal`

### qr-code-tournee-depots-de-pain-villages-boulangerie
**Titre Pinterest** : Tournée du pain : le plan des dépôts à monter en 4 étapes
**Tableau** : Templates gratuits · `#boulangerie #painmaison #circuitcourt #commercelocal`

### qr-code-menu-enfant-du-camion-food-truck
**Titre Pinterest** : Menu enfant du food truck : la page à créer en 5 minutes
**Tableau** : QR code food truck · `#foodtruck #streetfood #menuenfant #commercelocal`

### qr-code-diagnostics-et-plan-sur-le-panneau-immobilier
**Titre Pinterest** : Panneau à vendre : diagnostics et plan en 4 étapes
**Tableau** : QR code immobilier — unique épingle hors-food · `#immobilier #agentimmobilier #vente #qrcode`

> **Reprise après dépôt — 20/09, 20 h 30 UTC.** L'utilisateur a lancé `QRowg-Depot.cmd`
> (17 PNG déposés dans `social/2026-09-20/`) et collé les URLs dans la même session : rien
> n'a été reproduit, l'étape 0.A n'a pas été rejouée, mais **la garde 0.D a été refaite**
> avant chaque `create_post` — Instagram et TikTok étaient à 0 post du jour, tous statuts
> confondus, jusqu'au moment de la création. **7 posts mis en file, file à 7/10** :
> carrousel Instagram (20/09, 20 h 51 UTC), carrousel photo TikTok (21/09, 06 h 40),
> puis 5 épingles sur **5 tableaux distincts** — bières bar (21/09, 12 h 18, QR code
> restaurant), tournée boulangerie (21/09, 14 h 13, Templates gratuits), menu enfant food
> truck (21/09, 18 h 47, QR code food truck), diagnostics immobilier (21/09, 19 h 03,
> QR code immobilier) et l'épingle bar/vins du stock du 16/09 (22/09, 13 h 28, Productivité
> au travail). Descriptions vérifiées par assertion avant envoi (436 à 465 caractères, sous
> la limite Buffer de 500). Toutes les lignes du 20/09 passent en `en-file`, **sauf la
> vidéo**, manuelle par nature. Relecture `list_posts` après coup : **7 `scheduled`
> exactement, 0 `error`**, ni plus ni moins.
> Reste en `dispo` au stock : `qr-code-carte-cadeau-du-salon-coiffure.png` (jamais déposée,
> hors-food — à sortir un jour où l'épingle hors-food du jour n'est pas déjà prise) et
> `qr-code-fermetures-et-conges-du-camion-food-truck.png` (interdite jusqu'au 07/10).

---

## 22/09 — production du jour, DÉPOSÉE ET MISE EN FILE (statut `en-file`)

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-commandes-de-gateaux-d-anniversaire-boulangerie-01→06.png | Instagram | carrousel 6 slides, `type:post`, `shouldShareToFeed:true`, `isAiGenerated:true` | boulangerie · commande de gâteau d'anniversaire prise hors comptoir · zéro minute prise au comptoir | https://qrowg.com/qr-code/boutique | 2026-09-22 |
| en-file | tiktok-qr-code-commandes-de-gateaux-d-anniversaire-boulangerie-01→06.png | TikTok | carrousel photo 1080×1350, **sans `isAiGenerated`** | idem (copies redimensionnées) | https://qrowg.com/qr-code/boutique | 2026-09-22 |
| en-file | qr-code-emplacements-de-la-semaine-food-truck.png | Pinterest | QR code food truck (726416683586817654) · gabarit 0 | food truck · planning des emplacements de la semaine · l'habitué retrouve le camion le jeudi | https://qrowg.com/qr-code/food-truck | 2026-09-22 |
| en-file | qr-code-carte-des-desserts-en-photo-restaurant.png | Pinterest | QR code restaurant (726416683586817614) · gabarit 1 | restaurant · carte des desserts en photo · le client voit l'assiette avant de commander | https://qrowg.com/qr-code/menu | 2026-09-22 |
| en-file | qr-code-origine-des-cafes-et-torrefaction-cafe.png | Pinterest | QR code boutique commerce (726416683586817655) · gabarit 2 | café · origine et torréfaction du grain du jour · vendre le paquet à emporter | https://qrowg.com/qr-code/boutique | 2026-09-22 |
| en-file | qr-code-fiche-coloration-fin-de-rendez-vous-salon.png | Pinterest | QR code salon coiffure (726416683586817657) · gabarit 3 | salon · fiche couleur remise en fin de rendez-vous · la formule retrouvée six semaines après — **unique épingle hors-food** | https://qrowg.com/qr-code/salon | 2026-09-22 |

> **Rien déposé, rien en file.** `QRowg-Depot.cmd` exige une action de l'utilisateur, absent
> de ce run planifié, et Buffer refuse toute image dont l'URL n'est pas déjà accessible.
> Tout le lot est donc en `dispo` : réinjectable sans rien reproduire dès que les URLs
> reviennent. **File à 2/10** (deux épingles Pinterest programmées le 20/09 pour aujourd'hui).
> **8 places libres** — le lot entier (1 carrousel IG + 1 carrousel TikTok + 4 épingles = 6)
> y tient, et laisse 2 places.
> Restent aussi en `dispo` : `qr-code-carte-cadeau-du-salon-coiffure.png` (jamais déposée —
> mais l'épingle hors-food du jour est déjà prise par la fiche coloration salon, donc à
> garder pour un autre jour) et `qr-code-fermetures-et-conges-du-camion-food-truck.png`
> (interdite jusqu'au 07/10, règle des 21 jours).

## Textes prêts — 22/09

Légendes (Instagram, TikTok, Pinterest ×4, LinkedIn, X) avec bouton Copier :
`social-a-deposer\2026-09-22\textes-du-jour-2026-09-22.html`.
Bios : `social-a-deposer\2026-09-22\bios-du-jour-2026-09-22.html`.

### qr-code-emplacements-de-la-semaine-food-truck
**Titre Pinterest** : Food truck : les 5 emplacements de la semaine sur un QR
**Tableau** : QR code food truck · `#foodtruck #streetfood #qrcode #commercelocal`

### qr-code-carte-des-desserts-en-photo-restaurant
**Titre Pinterest** : Carte des desserts en photo : 1 QR, 0 réimpression
**Tableau** : QR code restaurant · `#restaurant #dessert #qrcode #restauration`

### qr-code-origine-des-cafes-et-torrefaction-cafe
**Titre Pinterest** : Origine des cafés : une page par grain, lue en 20 secondes
**Tableau** : QR code boutique commerce · `#cafe #torrefaction #qrcode #commercelocal`

### qr-code-fiche-coloration-fin-de-rendez-vous-salon
**Titre Pinterest** : Fiche couleur cliente : la formule retrouvée 6 semaines après
**Tableau** : QR code salon coiffure — unique épingle hors-food · `#coiffure #coloration #salondecoiffure #qrcode`

> **Reprise après dépôt — 22/09, 11 h 48 UTC.** L'utilisateur a lancé `QRowg-Depot.cmd`
> (16 PNG déposés dans `social/2026-09-22/`, aucune vidéo) et collé les URLs dans la même
> session : rien n'a été reproduit, l'étape 0.A n'a pas été rejouée, mais **la garde 0.D a
> été refaite avant chaque `create_post`** — Instagram et TikTok à 0 post du jour, tous
> statuts confondus, jusqu'au moment de la création. **Les 6 contenus du jour sont partis
> en file**, toutes les lignes ci-dessus passent en `en-file`. **File de 2/10 à 8/10.**
> Restent en `dispo` : `qr-code-carte-cadeau-du-salon-coiffure.png` (hors-food, jamais
> déposée — gardée pour un jour où l'épingle hors-food n'est pas déjà prise) et
> `qr-code-fermetures-et-conges-du-camion-food-truck.png` (interdite jusqu'au 07/10).
