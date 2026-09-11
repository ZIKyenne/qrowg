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
| **dispo** | qr-code-arrivee-tardive-check-in-autonome-hotel.png | Pinterest | QR code hôtel (726416683586817656) | hôtel/chambre d'hôtes · arrivée tardive en autonomie · le code, l'étage et la marche à suivre sur la porte | https://qrowg.com/qr-code/hotel | 2026-09-06 |

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
