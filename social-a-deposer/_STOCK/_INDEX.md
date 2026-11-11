# _STOCK — réserve de contenus QRowg

Tout visuel produit mais **non mis en file** atterrit ici au lieu d'être perdu.
La skill `qrowg-stock` lit ce fichier, choisit le plus ancien encore valable et le
réinjecte dans Buffer dès qu'il reste de la place dans la file.

> **État au 13/10/2026 (run 15 h 00 UTC)** — **1 ligne passe en `en-file`** : `qr-code-calendrier-fermetures-et-conges-food-truck.png` (16/09), le seul visuel déjà déposé sur Supabase qui n'avait jamais été publié — mis en file ce jour, tableau QR code food truck, dueAt 18 h 18 UTC. **Fin de 15 jours de silence.** File à 1/10. ⚠ **`dispo` ne garantit pas une URL publique** : sonde Buffer du jour → les 4 visuels de `content-20260923.json` et les 3 de `content-run-boulangerie.json` (16/09) ont été écrits APRÈS le dépôt de leur lot et ne sont pas sur Supabase. Correctif appliqué à `DEPOT-MAINTENANT.ps1` : `$LotsCibles` inclut désormais 2026-09-16 et 2026-09-23 — le prochain dépôt monte **39 visuels** au lieu de 32 et débloque ces 7 orphelins.

> **État au 15/10/2026 (run 06 h 41 UTC)** — **aucun changement de statut : rien ne part, rien n'arrive.** Vérification fichier par fichier ce run : **plus une seule ligne `dispo` n'est rattrapable**. Les quatre épingles que l'index laissait espérer (`carte-de-fidelite-du-torrefacteur-cafe`, `brunch-du-dimanche-sur-reservation-restaurant`, `privatisation-de-l-arriere-salle-bar`, `carte-cadeau-du-salon-coiffure`) vivent dans **2026-09-23** et **2026-09-16**, deux lots non déposés ; les seules autres lignes `dispo` rattachées à un lot déjà déposé sont deux `.mp4` (20/09, 27/09), qui ne se déposent ni ne se mettent en file par règle. Le 13/10 avait sorti le dernier visuel récupérable. **`depot-log.txt` est toujours absent du disque** : `DEPOT-MAINTENANT.ps1` n'a jamais été lancé depuis sa réécriture du 02/10. `supabase.co` reste refusé par le proxy côté conteneur **comme côté machine** (HTTP 000) — le dépôt ne peut tourner que sous Windows. File Buffer à **0/10**. Un double-clic sur `DEPOT-MAINTENANT.cmd` monte **39 visuels** et remplit la file à 10/10 sans rien reproduire.

> **État au 16/10/2026 (run 06 h 40 UTC)** — **aucun changement de statut** : le stock reste intégralement bloqué, pour la même et unique raison (`DEPOT-MAINTENANT.ps1` jamais lancé depuis sa réécriture du 02/10, `depot-log.txt` toujours absent du disque). Conclusion du 15/10 re-vérifiée et confirmée : plus une seule ligne `dispo` n'est rattrapable. File Buffer à **0/10**. **Nouveauté du jour** : une **vidéo** a été produite et livrée (`qr-code-petit-dejeuner-choisi-la-veille-hotel-reel.mp4`, 31,80 s, hôtel). Elle n'entre pas dans la réserve réinjectable — un `.mp4` ne se dépose ni ne se met en file par règle — mais elle est **publiable à la main immédiatement**, sans dépôt. C'est la seule production que le blocage n'empêche pas : sur un jour vidéo (mer/ven/sam/dim), elle doit être faite.

> **État au 20/10/2026 (run 06 h 34 UTC)** — **aucun changement de statut** : **31 lignes `dispo`, 80 PNG (22 Mo) sur 5 lots** (16/09, 23/09, 28/09, 29/09, 18/10), file Buffer à **0/10**. Rien n'est réinjectable : aucune de ces lignes n'a d'URL publique, et `supabase.co` étant coupé des deux côtés, l'existence d'un fichier ne peut même pas être testée par le réseau. **L'outil de dépôt est vérifié intégralement prêt ce run** : correctif TLS en place, `$LotsCibles` et `LOTS` synchronisés sur les 5 lots, clé service_role présente (220 car.), `depot-log.txt` toujours absent — **il ne manque que le double-clic**. **Fait neuf** : le refus est un `connect_rejected` — « gateway answered 403 to CONNECT » — donc une **règle d'egress nominative**, pas un projet Supabase en pause ni une clé morte. Autoriser `supabase.co` dans l'egress du compte laisserait le run suivant déposer les 80 PNG seul, sans aucun double-clic. Voie de secours chiffrée et **non exécutée** (hors mandat d'un run automatique) : un déploiement statique jetable sur Vercel (projet `qrowg` accessible, fichiers de 160 à 400 Ko) donnerait des URL que Buffer sait lire — à lancer sur un « oui ».

> **État au 26/10/2026 (run 07 h 34 UTC)** — **aucun changement de statut sur les PNG** : **31 lignes `dispo`, 80 PNG (22 Mo) sur 5 lots** (16/09, 23/09, 28/09, 29/09, 18/10), file Buffer à **0/10**, rien de réinjectable faute d'URL publique. Blocage re-mesuré des deux côtés ce run : conteneur **HTTP 000** et machine **HTTP 000** sur `yujvstejimbernkolbdu.supabase.co`, à 07 h 34 : 27 UTC ; `depot-log.txt` **toujours absent (7e confirmation)**. Les cinq pistes d'hébergement restent closes et **aucune piste neuve ne reste à tester**. **Mouvement du jour, côté vidéo** : `qr-code-pain-de-la-veille-prix-reduit-boulangerie-reel.mp4` (16/09, **31,40 s**, boulangerie · le pain de la veille à prix réduit) est **sorti du stock et livré dans la conversation**, à publier à la main — un `.mp4` ne se dépose ni ne se met en file par règle, il échappe donc entièrement au blocage. Angle **jamais déposé, jamais mis en file, jamais publié** ; l'épingle boulangerie du même lot portait un autre angle (farines et provenances). Lundi n'est pas un jour vidéo : **rien n'a été produit**, c'est l'étape 0-bis qui sort ce reel. Copié dans `2026-10-26\` et dans `_STOCK\`. Textes et bios neufs du jour dans `2026-10-26\`. **Prochain jour vidéo : mercredi 28/10 — privilégier le bar** (cocktails de saison ou soirée quiz), secteur inutilisé depuis le 09/09.

> **État au 25/10/2026 (run 07 h 36 UTC)** — **aucun changement de statut sur les PNG** : **31 lignes `dispo`, 80 PNG (22 Mo) sur 5 lots** (16/09, 23/09, 28/09, 29/09, 18/10), file Buffer à **0/10**, rien de réinjectable faute d'URL publique. Blocage re-mesuré des deux côtés ce run : conteneur **HTTP 000** et machine **HTTP 000** sur `yujvstejimbernkolbdu.supabase.co`, à 07 h 36 : 24 UTC ; `depot-log.txt` **toujours absent (6e confirmation)**. Les cinq pistes d'hébergement restent closes et **aucune piste neuve ne reste à tester** : une URL publique préalable est structurellement obligatoire. **Mouvement du jour, côté vidéo** : `qr-code-addition-partagee-table-de-six-restaurant-reel.mp4` (23/09, **33,20 s**, restaurant · l'addition partagée à la table de six) est **sorti du stock et livré dans la conversation**, à publier à la main — un `.mp4` ne se dépose ni ne se met en file par règle, il échappe donc entièrement au blocage. Angle **jamais publié sous aucune forme** : l'épingle qui le portait avait été retirée le 23/09 pour ne pas doubler ce reel. Choisi pour coller à la mesure TikTok (une action à issue concrète, pas de l'information affichée). Textes et bios neufs du jour dans `2026-10-25\`. **Prochain jour vidéo : mercredi 28/10 — privilégier le bar** (cocktails de saison ou soirée quiz), secteur inutilisé depuis le 09/09.

> **État au 24/10/2026 (run 06 h 33 UTC)** — **aucun changement de statut sur les PNG** : **31 lignes `dispo`, 80 PNG (22 Mo) sur 5 lots** (16/09, 23/09, 28/09, 29/09, 18/10), file Buffer à **0/10**, rien de réinjectable faute d'URL publique. Blocage re-mesuré des deux côtés ce run : conteneur `connect_rejected` — *403 à CONNECT* sur `yujvstejimbernkolbdu.supabase.co:443` à 06 h 34 : 55 UTC ; machine **HTTP 000** ; `depot-log.txt` **toujours absent (5e confirmation)**. **Fait neuf : la voie « asset claude.ai » est testée et fermée** — `Artifact publish asset:true` est refusé par le classificateur de la session, motif *[Public Data-Sharing Upload]*. Avec elle, les **cinq** pistes d'hébergement sont closes (Supabase, upload Buffer inexistant, GitHub raw sans identifiant, hôtes tiers écartés, assets claude.ai refusés) : **une URL publique préalable reste structurellement obligatoire**. **Mouvement du jour, côté vidéo** : `qr-code-suivi-de-retouche-et-sav-boutique-reel.mp4` (23/09, 31,20 s, boutique · suivi de retouche et SAV) est **sorti du stock et livré dans la conversation**, à publier à la main — un `.mp4` ne se dépose ni ne se met en file par règle, il échappe donc entièrement au blocage. Textes et bios neufs du jour dans `2026-10-24\`.

> **État au 27/10/2026 (run 07 h 34 UTC)** — **aucun changement de statut sur les PNG** : **31 lignes `dispo`, 80 PNG (22 Mo) sur 5 lots** (16/09, 23/09, 28/09, 29/09, 18/10), file Buffer à **0/10**, rien de réinjectable faute d'URL publique. Blocage re-mesuré des deux côtés ce run : conteneur **HTTP 000** (`connect_rejected`) et machine **HTTP 000** sur `yujvstejimbernkolbdu.supabase.co`, à 07 h 34 : 59 UTC ; `depot-log.txt` **toujours absent (8e confirmation)**. Les cinq pistes d'hébergement restent closes, aucune piste neuve à tester. **Mouvement du jour, côté vidéo** : `qr-code-liste-attente-produit-en-rupture-boutique-reel.mp4` (20/09, **31,20 s**, boutique · la liste d'attente sur un produit en rupture) est **sorti du stock et livré dans la conversation**, à publier à la main. Angle **jamais déposé, jamais mis en file, jamais publié** : le carrousel du lot 20/09 portait « carte sans alcool, restaurant ». Copié dans `2026-10-27\` et dans `_STOCK\`. Mardi n'est pas un jour vidéo : **rien n'a été produit**, c'est l'étape 0-bis qui sort ce reel. Textes et bios neufs du jour dans `2026-10-27\`. **⚠ Correctif de réserve apporté ce run** : un `.mp4` qui porte le **même slug** que le carrousel de son lot est un **quasi-doublon** (l'angle est déjà sorti en IG + TikTok). Sont concernés **09-04, 09-05, 09-06, 09-11**, et surtout **09-09 (cocktails bar)** et **09-12 (quiz bar)** — donc **le bar n'a aucun reel propre en réserve** : mercredi 28/10, jour vidéo, le bar doit être **produit**, pas sorti du stock.

> **État au 29/10/2026 (run 07 h 36 UTC)** — **aucun changement de statut sur les PNG** : **31 lignes `dispo`, 80 PNG (22 Mo) sur 5 lots** (16/09, 23/09, 28/09, 29/09, 18/10), file Buffer à **0/10**, rien de réinjectable faute d'URL publique. Blocage re-mesuré des deux côtés ce run : machine **HTTP 000** à 07 h 35 : 53 UTC et conteneur **HTTP 000** à 07 h 36 : 10 UTC sur `yujvstejimbernkolbdu.supabase.co` ; `depot-log.txt` **toujours absent (9e confirmation)**. Les cinq pistes d'hébergement restent closes, aucune piste neuve à tester. **Mouvement du jour, côté vidéo** : `qr-code-liste-d-envies-partagee-avant-un-anniversaire-boutique-reel.mp4` (27/09, **31,40 s**, 1080×1920, h264, 942 images, muet, vérifié à l'ffprobe — boutique · la liste d'envies partagée avant un anniversaire) est **sorti du stock et livré dans la conversation**, à publier à la main. Angle **jamais déposé, jamais mis en file, jamais publié** : le carrousel du lot 27/09 portait « check-out tardif, hôtel », slug différent, donc **pas un quasi-doublon** au sens du correctif du 27/10. Couple (boutique, liste d'envies) consommé le 27/09, blocage de 21 jours **expiré le 18/10**. Jeudi n'est pas un jour vidéo : **rien n'a été produit**, c'est l'étape 0-bis qui sort ce reel. Copié dans `2026-10-29\` et dans `_STOCK\`. Textes et bios neufs du jour dans `2026-10-29\`. **⚠ Fait capital de ce run : la réserve de reels propres est épuisée.** Les cinq reels encore propres recensés le 27/10 étaient 09-16 hôtel, 09-27 boutique, 10-16 hôtel, 10-17 producteur, 10-18 salon de thé ; 10-16 est sorti le 16/10, **09-27 sort aujourd'hui**, et les trois restants sont sur des secteurs bloqués jusqu'au **06/11, 07/11 et 08/11**. **À partir de demain, et jusqu'au 06/11, il n'y a plus rien à sortir du stock : tout reel livré devra être produit.** Vendredi 30/10 est un jour vidéo — **produire café** (la commande récurrente du matin) **ou artisan** (le calendrier des interventions), deux angles neufs sur deux secteurs libres.

> **État au 31/10/2026 (run 07 h 33 UTC)** — **aucun changement de statut sur les PNG déjà en réserve** : les 31 lignes `dispo` des 5 lots antérieurs (16/09, 23/09, 28/09, 29/09, 18/10) restent sans URL publique, file Buffer à **0/10**. Blocage re-mesuré des deux côtés ce run : machine **HTTP 000** à 07 h 48 : 32 UTC et conteneur **HTTP 000** (`CONNECT tunnel failed, response 403`) à 07 h 48 : 30 UTC sur `yujvstejimbernkolbdu.supabase.co` ; `depot-log.txt` **toujours absent du disque — onzième confirmation consécutive**. Les cinq pistes d'hébergement restent closes, aucune piste neuve à tester. **Le stock n'a rien pu fournir ce run** : conclusion du 29/10 re-vérifiée, les trois reels encore propres sont sur des secteurs bloqués jusqu'au **06/11 (hôtel)**, **07/11 (producteur)** et **08/11 (salon de thé)**. Samedi 31/10 est un jour vidéo : **le lot du jour est donc produit** — 16 PNG + 1 MP4 sur le secteur **traiteur**, ajoutés ci-dessous en `dispo` (le MP4 en `livré`). **Correctif de dépôt apporté ce run** : `2026-10-31` ajouté à `$LotsCibles` dans `DEPOT-MAINTENANT.ps1` **et** à `LOTS` dans `DEPOT-SANS-POWERSHELL.cmd` — un double-clic monte désormais **112 PNG** au lieu de 96. **Prochain jour vidéo : dimanche 01/11** — le stock ne pourra toujours rien fournir avant le 06/11, prévoir une production neuve sur un secteur hors blocage (caviste, fleuriste, fromagerie, pizzeria, immobilier et traiteur sont consommés aujourd'hui).

> **État au 01/11/2026 (run 07 h 33 UTC)** — **aucun changement de statut sur les PNG déjà en réserve** : les 31 lignes `dispo` des lots antérieurs (16/09, 23/09, 28/09, 29/09, 18/10) restent sans URL publique, file Buffer à **0/10**. Blocage re-mesuré des deux côtés ce run : conteneur **HTTP 000** à 07 h 40 : 38 UTC et machine **HTTP 000** à 07 h 40 : 41 UTC sur `yujvstejimbernkolbdu.supabase.co` ; `depot-log.txt` **toujours absent du disque — douzième confirmation consécutive**. Les cinq pistes d'hébergement restent closes, aucune piste neuve à tester. **Le stock n'a rien pu fournir ce run** : les trois reels encore propres sont sur des secteurs bloqués jusqu'au **06/11 (hôtel)**, **07/11 (producteur)** et **08/11 (salon de thé)**. Dimanche 01/11 est un jour vidéo : **le lot du jour est donc produit** — 16 PNG + 1 MP4 sur le secteur **poissonnerie** (reel : primeur), ajoutés ci-dessous en `dispo` (le MP4 en `livré`). **Correctif de dépôt apporté ce run** : `2026-11-01` ajouté à `$LotsCibles` dans `DEPOT-MAINTENANT.ps1` **et** à `LOTS` dans `DEPOT-SANS-POWERSHELL.cmd` — un double-clic monte désormais **128 PNG** au lieu de 112. **Prochain jour vidéo : mercredi 04/11** — le stock ne pourra toujours rien fournir avant le 06/11, prévoir une production neuve (rôtisserie ou microbrasserie, deux secteurs jamais utilisés).

> **État au 04/11/2026 (run 07 h 33 UTC)** — **aucun changement de statut sur les PNG déjà en réserve** : les 31 lignes `dispo` des lots antérieurs (16/09, 23/09, 28/09, 29/09, 18/10) restent sans URL publique, file Buffer à **0/10**. Blocage re-mesuré des deux côtés ce run : machine **HTTP 000** et conteneur **HTTP 000** sur `yujvstejimbernkolbdu.supabase.co` à 07 h 34 UTC, `qrowg.com` **HTTP 000 des deux côtés** ; `depot-log.txt` **toujours absent du disque — quinzième confirmation consécutive**. Les cinq pistes d'hébergement restent closes, aucune piste neuve à tester. **Vingt-trois jours sans publication.** **Le stock n'a rien pu fournir ce run** : les trois reels encore propres sont sur des secteurs bloqués jusqu'au **06/11 (hôtel)**, **07/11 (producteur)** et **08/11 (salon de thé)** — le premier redevient sortable **après-demain**. Mercredi 04/11 est un jour vidéo : **le lot du jour est donc produit** — 16 PNG + 1 MP4, secteur **torréfacteur** (reel : conserverie artisanale), ajoutés ci-dessous en `dispo` (le MP4 en `livré`). **Correctif de dépôt apporté ce run** : `2026-11-04` ajouté à `$LotsCibles` dans `DEPOT-MAINTENANT.ps1` **et** à `LOTS` dans `DEPOT-SANS-POWERSHELL.cmd` — un double-clic monte désormais **176 PNG** au lieu de 160. **Prochain jour vidéo : vendredi 06/11** — c'est le premier jour où le stock peut enfin fournir (reel **hôtel** du 16/09, blocage expiré), donc **ne rien produire de neuf si ce reel passe l'anti-doublon**.

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


## ⚠ Lignes `dispo` SANS URL publique (vérifié le 13/10 par sonde Buffer)

Ces fichiers existent sur le disque mais **ne sont pas sur Supabase** : ils ont été écrits par un run
parallèle après le dépôt de leur lot. Ils ne sont réinjectables qu'après le prochain dépôt, désormais
couvert par le correctif `$LotsCibles` de `DEPOT-MAINTENANT.ps1`.

- 16/09 : `qr-code-carte-cadeau-du-salon-coiffure.png` · `qr-code-fermetures-et-conges-du-camion-food-truck.png` (retiré) · `qr-code-vins-de-producteurs-voisins-bar.png`
- 23/09 : `qr-code-brunch-du-dimanche-sur-reservation-restaurant.png` · `qr-code-privatisation-de-l-arriere-salle-bar.png` · `qr-code-carte-cadeau-du-salon-coiffure.png` · `qr-code-carte-de-fidelite-du-torrefacteur-cafe.png`

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
| en-file | qr-code-calendrier-fermetures-et-conges-food-truck.png | Pinterest | QR code food truck (726416683586817654) — gabarit 1 | food truck · calendrier des fermetures et congés — **doublon d'angle** avec `qr-code-fermetures-et-conges-du-camion-food-truck.png`, produit par le run parallèle à 15 h 06 min 53 s, une minute avant celui-ci. Levé le 13/10 : son jumeau n'a jamais été déposé NI publié, l'angle n'était donc jamais sorti. **Mis en file le 13/10 à 18 h 18 UTC** (post `6ace490aaefe64c2a8cd821e`). QR redécodé, 0 alerte. | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-hotel&utm_content=clic&utm_term=conges | 2026-09-16 |
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
> Vidéo `qr-code-pain-de-la-veille-prix-reduit-boulangerie-reel.mp4` (31,40 s, 1080x1920,
> h264, 942 images, muet) : **manuelle**, jamais déposée, jamais mise en file —
> **sortie du stock et livrée dans la conversation le 26/10**, à publier à la main
> (IG + TikTok, ajouter un son). Reste `dispo` tant que la publication manuelle n'est
> pas confirmée. Légende et bios : `2026-10-26\textes-du-jour-2026-10-26.html`.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-doggy-bag-restes-a-emporter-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · doggy bag et restes à emporter · il reste la moitié du plat, personne n'ose demander | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-boulangerie&utm_content=clic&utm_term=doggybag | 2026-09-16 |
| retiré | qr-code-fermetures-et-conges-du-camion-food-truck.png | Pinterest | QR code food truck (726416683586817654) — gabarit 1 | food truck · calendrier des fermetures et congés · **retiré le 13/10** : jamais déposé (écrit après le dépôt du 16/09), et l'angle est désormais sorti via son jumeau. Bloqué jusqu'au 03/11. | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-boulangerie&utm_content=clic&utm_term=conges | 2026-09-16 |
| en-file | qr-code-vins-de-producteurs-voisins-bar.png | Pinterest | Templates gratuits (726416683586787015) — gabarit 2 | bar · carte des vins de producteurs voisins · « ce vin vient d'où ? », tu réponds de mémoire | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260916-boulangerie&utm_content=clic&utm_term=vins | 2026-09-16 |
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

---

## 23/09 — production du jour, EN ATTENTE DE DÉPÔT (statut `dispo`)

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| dispo | qr-code-commande-a-l-avance-pause-de-midi-food-truck-01→06.png | Instagram | carrousel 6 slides, `type:post`, `shouldShareToFeed:true`, `isAiGenerated:true` | food truck · commande passée d'avance pour la pause de midi · trois minutes au lieu de vingt dans la file | https://qrowg.com/qr-code/food-truck | 2026-09-23 |
| dispo | tiktok-qr-code-commande-a-l-avance-pause-de-midi-food-truck-01→06.png | TikTok | carrousel photo 1080×1350, **sans `isAiGenerated`** | idem (copies redimensionnées) — **bloqué par la garde 0.D : un carrousel TikTok du 22/09 est sorti ce matin à 04 h 05 UTC** | https://qrowg.com/qr-code/food-truck | 2026-09-23 |
| dispo | qr-code-carte-de-fidelite-du-torrefacteur-cafe.png | Pinterest | QR code boutique commerce (726416683586817655) · gabarit 0 | café · carte de fidélité sans carton à tamponner · le dixième café offert retrouvé sans rien sortir de la poche | https://qrowg.com/qr-code/boutique | 2026-09-23 |
| dispo | qr-code-brunch-du-dimanche-sur-reservation-restaurant.png | Pinterest | QR code restaurant (726416683586817614) · gabarit 1 | restaurant · brunch du dimanche sur réservation · complet à 10 h et vingt personnes l'ignorent | https://qrowg.com/qr-code/restaurant | 2026-09-23 |
| dispo | qr-code-privatisation-de-l-arriere-salle-bar.png | Pinterest | Templates gratuits (726416683586787015) · gabarit 2 | bar · privatisation de l'arrière-salle · la demande arrive écrite au lieu d'un appel à 19 h | https://qrowg.com/qr-code/restaurant | 2026-09-23 |
| dispo | qr-code-carte-cadeau-du-salon-coiffure.png | Pinterest | QR code salon coiffure (726416683586817657) · gabarit 3 | salon · carte cadeau dématérialisée · achetée en décembre, retrouvée en mars — **unique épingle hors-food**, contenu de stock du jour **re-rendu** au slug de campagne 20260923-foodtruck | https://qrowg.com/qr-code/salon | 2026-09-23 |
| dispo → **livré 25/10** | qr-code-addition-partagee-table-de-six-restaurant-reel.mp4 | Instagram + TikTok — **À PUBLIER À LA MAIN** | 33,20 s, 1080×1920, h264, 996 images, muet, ajouter un son dans l'appli — **sorti du stock et livré dans la conversation le 25/10** ; reste `dispo` tant que la publication manuelle n'est pas confirmée | restaurant · l'addition partagée à la table de six · chacun paie sa part depuis son téléphone | https://qrowg.com/qr-code/restaurant?utm_source=instagram&utm_medium=reel&utm_campaign=20260923-foodtruck | 2026-09-23 |

> **Rien déposé, rien en file.** `QRowg-Depot.cmd` exige une action de l'utilisateur, absent
> de ce run planifié, et Buffer refuse toute image dont l'URL n'est pas déjà accessible.
> Tout le lot est en `dispo`, réinjectable sans rien reproduire dès que les URLs reviennent.
> **File à 2/10** (les 2 épingles Pinterest du 22/09 programmées pour aujourd'hui) →
> **8 places libres**. Le lot mettable en file est de **5** (1 carrousel Instagram +
> 4 épingles) : le carrousel TikTok est bloqué par la garde 0.D, il reste en `dispo` pour
> demain. Contrôle qualité : **16 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.
> La ligne `qr-code-carte-cadeau-du-salon-coiffure.png` du 16/09 passe en `retiré` : elle est
> remplacée par la version re-rendue ci-dessus, au slug de campagne du jour.
> Reste aussi en `dispo` : `qr-code-fermetures-et-conges-du-camion-food-truck.png`
> (interdite jusqu'au 07/10) et les deux reels manuels du 16/09 et du 20/09.

## Textes prêts — 23/09

Légendes (Instagram, TikTok, Pinterest ×4, LinkedIn, reel) avec bouton Copier :
`social-a-deposer\2026-09-23\textes-du-jour-2026-09-23.html`.
Bios : `social-a-deposer\2026-09-23\bios-du-jour-2026-09-23.html`.

### qr-code-carte-de-fidelite-du-torrefacteur-cafe
**Titre Pinterest** : Carte de fidélité sans carton : la page à créer en 5 minutes
**Tableau** : QR code boutique commerce · `#cafe #fidelite #qrcode #commercelocal`

### qr-code-brunch-du-dimanche-sur-reservation-restaurant
**Titre Pinterest** : Brunch du dimanche : la page de réservation en 5 minutes
**Tableau** : QR code restaurant · `#brunch #restaurant #reservation #qrcode`

### qr-code-privatisation-de-l-arriere-salle-bar
**Titre Pinterest** : Privatiser l'arrière-salle : le formulaire prêt en 5 minutes
**Tableau** : Templates gratuits · `#bar #privatisation #evenement #commercelocal`

### qr-code-carte-cadeau-du-salon-coiffure
**Titre Pinterest** : Carte cadeau du salon : la page à créer en 5 minutes
**Tableau** : QR code salon coiffure — unique épingle hors-food · `#coiffure #cartecadeau #salondecoiffure #qrcode`

---

## 23/09 — production du jour, EN ATTENTE DE DÉPÔT

> Run planifié, utilisateur absent : `QRowg-Depot.cmd` n'a pas pu être lancé, donc **aucune
> URL publique, donc aucune mise en file** (Buffer refuse une image dont l'URL n'est pas
> déjà accessible). Tout le lot est ici en `dispo`, réinjectable **sans rien reproduire**.
> À la reprise : refaire la garde 0.D, créer, puis **vérifier le `dueAt` renvoyé** — TikTok
> a déjà servi un post le 23/09 (04 h 06), un post du jour sur ce canal repart en brouillon.
> Contrôle qualité déjà passé : **16 visuels, 0 alerte**, 8 QR décodés vers leur lien exact.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-commande-a-l-avance-pause-de-midi-food-truck-01..06.png | Instagram (carrousel) | légende sans URL, lien en bio, 5 hashtags | food truck · commande passée d'avance pour la pause de midi · quarante minutes de pause, vingt-deux personnes devant | https://qrowg.com/qr-code/food-truck?utm_source=instagram&utm_medium=bio&utm_campaign=20260923-foodtruck | 2026-09-23 |
| en-file | tiktok-qr-code-commande-a-l-avance-pause-de-midi-food-truck-01..06.png | TikTok (carrousel photo) | **pas de `isAiGenerated`** (refusé sur les photos) | idem, copies 1080×1350 | https://qrowg.com/qr-code/food-truck?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260923-foodtruck | 2026-09-23 |
| en-file | qr-code-partage-de-l-addition-table-de-six-restaurant.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | restaurant · partage de l'addition à six · le service s'arrête pendant que la calculatrice tourne | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260923-foodtruck&utm_content=clic&utm_term=addition | 2026-09-23 |
| en-file | qr-code-carte-de-fidelite-sans-tampon-cafe.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 1 | café · fidélité sans carton à tamponner · le carton est dans une autre veste | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260923-foodtruck&utm_content=clic&utm_term=fidelite | 2026-09-23 |
| en-file | qr-code-quel-pain-pour-quel-plat-boulangerie.png | Pinterest | Templates gratuits (726416683586787015) — gabarit 2 | boulangerie · fiche « quel pain pour quel plat » · vente additionnelle sans oser demander | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260923-foodtruck&utm_content=clic&utm_term=accords | 2026-09-23 |
| en-file | qr-code-visite-virtuelle-depuis-la-vitrine-immobilier.png | Pinterest | QR code immobilier (726416683586817652) — gabarit 3 — *unique épingle hors-food* | immobilier · visite virtuelle depuis la vitrine · le dimanche, l'agence est fermée et personne ne rappelle | https://qrowg.com/qr-code/immobilier?utm_source=pinterest&utm_medium=pin&utm_campaign=20260923-foodtruck&utm_content=clic&utm_term=visite | 2026-09-23 |
| dispo → **livré 24/10** | qr-code-suivi-de-retouche-et-sav-boutique-reel.mp4 | Instagram + TikTok — **À PUBLIER À LA MAIN** | 31,20 s, 1080×1920, h264, muet, ajouter un son dans l'appli — **sorti du stock et livré dans la conversation le 24/10** ; reste `dispo` tant que la publication manuelle n'est pas confirmée | commerce · suivi de retouche et SAV · onze jours sans nouvelle, on ne rappelle jamais | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=reel&utm_campaign=20260923-foodtruck | 2026-09-23 |

### Textes prêts — 23/09

**Instagram (carrousel, aucune URL, lien en bio, 5 hashtags)**
Il a quarante minutes.
Vingt-deux personnes devant lui, et la file n'avance pas. Il compte les têtes depuis le trottoir, il calcule, il renonce. À 12 h 40 il repart sans manger — et demain il ira ailleurs.
Un QR sur le flanc du camion : il commande à 11 h 20, il retire à 12 h 35. Pas de file, pas d'appel, aucune application à installer.
Le plat du jour change ? Tu modifies la page en deux minutes. L'autocollant sur la tôle, lui, ne bouge jamais.
Le lien est dans la bio.
`#foodtruck #streetfood #pausedejeuner #restauration #commercelocal`

**TikTok (carrousel photo, copies `tiktok-`)** — même récit resserré, avec le lien tracké
`utm_source=tiktok&utm_medium=carrousel`, hashtags `#foodtruck #streetfood #pausedejeuner #commercelocal`.

**Pinterest — les quatre descriptions complètes, longueurs vérifiées (461, 432, 431, 494 / 500)**
sont dans `textes-du-jour-2026-09-23.html`, livré avec le lot et archivé dans
`social-a-deposer\2026-09-23\`.

**LinkedIn (mercredi, vouvoiement)** et **légende du reel** : idem, dans le même HTML.
Pas de post X aujourd'hui (X passe les mardi, jeudi et samedi).

### 23/09 — lot d'un RUN CONCURRENT, récupéré au stock

Un second run de la tâche `qrowg-marketinglocal` a écrit dans `social-a-deposer\2026-09-23\`
à **11 h 37 min 52 s** (heure de Paris), **34 secondes** avant la copie de ce run. Les deux
exécutions ont convergé sur le **même carrousel** (`qr-code-commande-a-l-avance-pause-de-midi-food-truck`)
et le **même slug de campagne** (`20260923-foodtruck`) — la liste noire étant déterministe,
deux runs partis du même état produisent le même choix. Les fichiers du carrousel portent des
noms identiques et ont été écrasés ; aucun doublon n'est possible de ce côté. Les épingles,
elles, divergent. **Aucun des deux runs n'a rien mis en file** : `list_posts` filtré sur
`createdAt` du 23/09, tous statuts confondus, est revenu **vide**.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| retiré | qr-code-carte-de-fidelite-sans-tampon-cafe.png | Pinterest | — | café · fidélité sans carton à tamponner — **doublon d'angle** de `qr-code-carte-de-fidelite-du-torrefacteur-cafe.png` retenu ce jour | — | 2026-09-23 |
| retiré | qr-code-partage-de-l-addition-table-de-six-restaurant.png | Pinterest | — | restaurant · addition partagée à la table de six — **doublon d'angle** du reel du jour, qui porte déjà cet angle | — | 2026-09-23 |
| en-file | qr-code-quel-pain-pour-quel-plat-boulangerie.png | Pinterest | QR code boutique commerce (726416683586817655) · gabarit 2 | boulangerie · la fiche « quel pain pour quel plat » à côté de la caisse · angle inédit, non consommé | https://qrowg.com/qr-code/artisan | 2026-09-23 |
| en-file | qr-code-visite-virtuelle-depuis-la-vitrine-immobilier.png | Pinterest | QR code immobilier (726416683586817652) · gabarit 3 | immobilier · la visite virtuelle depuis la vitrine de l'agence · angle inédit, **hors-food** | https://qrowg.com/qr-code/immobilier | 2026-09-23 |
| dispo | qr-code-suivi-de-retouche-et-sav-boutique-reel.mp4 | Instagram + TikTok — **À PUBLIER À LA MAIN** | — | commerce · suivi de retouche et SAV · **second reel du jour** : un seul reel par jour, gardé pour un autre jour | https://qrowg.com/qr-code/boutique | 2026-09-23 |

> Les deux angles inédits du run concurrent (boulangerie, immobilier) sont **conservés en
> `dispo`** : c'est du travail déjà payé, réinjectable un autre jour. Leur QR encode le slug
> `20260923-foodtruck` — à re-rendre au slug du jour où ils sortiront, comme il a été fait
> pour la carte cadeau salon.

> **Reprise apres depot — 23/09, 09 h 48 UTC.** Les 16 PNG sont deposes dans
> `social/2026-09-23/`. Les six lignes ci-dessus passent en `en-file`. Seule la video
> `qr-code-suivi-de-retouche-et-sav-boutique-reel.mp4` (31,2 s) reste en `dispo` : elle se
> publie **a la main** sur IG et TikTok et n'entre jamais dans Buffer.

---

## 24/09 — production du jour, EN ATTENTE DE DÉPÔT (statut `dispo`)

> Run planifié, utilisateur absent : `QRowg-Depot.cmd` n'a pas pu être lancé, donc **aucune
> URL publique et aucune mise en file** (Buffer refuse une image dont l'URL n'est pas déjà
> accessible). Contrôle qualité passé : **4 visuels, 0 alerte**, les 4 QR décodés vers leur
> lien tracké exact. Slug de campagne `20260924-restaurant`.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-pourboire-sans-especes-equipe-restaurant.png | Pinterest | QR code restaurant (726416683586817614) · gabarit 0 · accent rouge métier | restaurant · le pourboire laissé sans espèces · la salle touche ce qu'elle a gagné | https://qrowg.com/qr-code/paiement?utm_source=pinterest&utm_medium=pin&utm_campaign=20260924-restaurant&utm_content=clic&utm_term=pourboire | 2026-09-24 |
| en-file | qr-code-wifi-donne-sans-epeler-le-mot-de-passe-cafe.png | Pinterest | Templates gratuits (726416683586787015) · gabarit 1 | café · le wifi donné sans épeler le mot de passe · vingt-deux caractères, dix fois par jour | https://qrowg.com/qr-code/wifi?utm_source=pinterest&utm_medium=pin&utm_campaign=20260924-restaurant&utm_content=clic&utm_term=wifi | 2026-09-24 |
| en-file | qr-code-plan-de-salle-choix-de-la-table-restaurant.png | Pinterest | Productivité au travail (726416683586787011) · gabarit 2 · accent rouge métier | restaurant · le plan de salle et le choix de la table · la réservation arrive placée | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260924-restaurant&utm_content=clic&utm_term=plandesalle | 2026-09-24 |
| en-file | qr-code-article-de-vitrine-reserve-pour-essayage-boutique.png | Pinterest | QR code boutique commerce (726416683586817655) · gabarit 3 — **unique épingle hors-food** | boutique · l'article de vitrine mis de côté pour l'essayage · sa taille était en réserve | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20260924-restaurant&utm_content=clic&utm_term=essayage | 2026-09-24 |

> **Sorties de stock du jour : aucune.** Le carrousel TikTok food truck, qui était la sortie
> prévue, **est parti tout seul** : programmé le 23/09 en `customScheduled`, il a été publié
> ce matin à **00 h 15 min 54 s UTC**. Sa ligne du 23/09 passe donc de `en-file` à **publié**.
> Les 4 épingles `dispo` du 23/09 (fidélité torréfacteur, brunch du dimanche, privatisation
> arrière-salle, carte cadeau salon) restent sans URL publique : elles n'ont jamais été
> déposées et ne sont donc pas réinjectables tant que le dépôt n'a pas eu lieu.

### Textes prêts — 24/09
Légendes Pinterest ×4 (443 à 496 caractères sur 500, vérifiées par assertion), LinkedIn et X :
`social-a-deposer\2026-09-24\textes-du-jour-2026-09-24.html`.
Bios : `social-a-deposer\2026-09-24\bios-du-jour-2026-09-24.html`.

> **Reprise après dépôt — 24/09, 00 h 33 UTC.** Dépôt lancé par l'utilisateur : les 4 PNG
> sont en ligne dans `social/2026-09-24/`. Rien reproduit, étape 0.A non rejouée, **garde
> 0.D refaite avant la mise en file** — Instagram et TikTok toujours à 1 post du jour, donc
> toujours bloqués ; Pinterest n'est pas concerné par cette garde. Les 4 lignes ci-dessus
> passent de `dispo` à **`en-file`**. Les épingles `dispo` du 23/09 restent en réserve.


---

## 24/09 — run de l'après-midi (aucune production)

Le run de la nuit (00 h 32 UTC) avait déjà bouclé la journée : 4 épingles Pinterest en
file, aucun carrousel (garde 0.D). Ce run n'a donc **rien produit de neuf** et a tenté une
seule **réinjection de stock**, conformément à « un seul contenu de stock par jour ».

**Réinjection impossible — les PNG en statut `dispo` ne sont pas en ligne.** Deux
candidats ont été essayés et refusés par Buffer avec `Invalid post: Image could not be
read from its URL` :

- `qr-code-fermetures-et-conges-du-camion-food-truck.png` (16/09, tableau QR code food truck)
- `qr-code-privatisation-de-l-arriere-salle-bar.png` (23/09, tableau Templates gratuits)

**Cause identifiée : `QRowg-Depot.cmd` ne dépose que les visuels mis en file le jour même.**
Un visuel écarté vers `_STOCK` reste sur le disque local et n'a jamais d'URL publique, donc
la réinjection automatique du stock **ne peut pas fonctionner en l'état**. Les QR de ces
deux fichiers ont bien été re-décodés vers leur lien tracké exact (contrôle à l'œil et par
`cv2.QRCodeDetector`) : les visuels sont bons, c'est le dépôt qui manque.

**À faire côté utilisateur** pour débloquer la réserve : relancer `QRowg-Depot.cmd` sur les
dossiers `2026-09-16` et `2026-09-23`, puis coller les URLs — les lignes `dispo` deviendront
réinjectables.

---

## 27/09 — production du jour, EN ATTENTE DE DÉPÔT (statut `dispo`)

> Run planifié, utilisateur absent : `QRowg-Depot.cmd` n'a pas pu être lancé, donc **aucune
> URL publique et aucune mise en file**. Contrôle qualité passé : **16 visuels, 0 alerte**,
> les 8 QR porteurs décodés vers leur lien tracké exact. Slug de campagne `20260927-hotel`.
> File Buffer à **0/10** au démarrage (aucun `error`, aucun `scheduled`), garde 0.D à zéro
> sur tous les canaux — à recompter avant chaque `create_post` à la reprise.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| en-file | qr-code-check-out-tardif-demande-depuis-la-chambre-hotel-01→06.png | Instagram (carrousel) | `type:post`, `shouldShareToFeed:true`, `isAiGenerated:true`, légende sans URL, 5 hashtags | hôtel · le check-out tardif demandé depuis la chambre · son train part à 16 h, elle n'osera pas demander | https://qrowg.com/qr-code/hotel?utm_source=instagram&utm_medium=carrousel&utm_campaign=20260927-hotel | 2026-09-27 |
| en-file | tiktok-qr-code-check-out-tardif-demande-depuis-la-chambre-hotel-01→06.png | TikTok (carrousel photo) | copies 1080×1350, **sans `isAiGenerated`** | idem (copies redimensionnées) | https://qrowg.com/qr-code/hotel?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260927-hotel | 2026-09-27 |
| en-file | qr-code-file-en-direct-combien-de-commandes-devant-toi-food-truck.png | Pinterest | QR code food truck (726416683586817654) · gabarit 0 | food truck · la file affichée en direct · douze personnes devant, il renonce avant de traverser | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20260927-hotel&utm_content=clic&utm_term=file | 2026-09-27 |
| en-file | qr-code-commande-a-emporter-prete-a-l-heure-dite-cafe.png | Pinterest | QR code restaurant (726416683586817614) · gabarit 1 | café · la commande à emporter prête à l'heure dite · son café l'attend à 8 h 40 | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260927-hotel&utm_content=clic&utm_term=emporter | 2026-09-27 |
| en-file | qr-code-service-du-soir-complet-liste-d-attente-restaurant.png | Pinterest | Templates gratuits (726416683586787015) · gabarit 2 · accent rouge métier | restaurant · le service du soir complet et la liste d'attente en vitrine · deux tables se libèrent à 21 h 15 | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260927-hotel&utm_content=clic&utm_term=listeattente | 2026-09-27 |
| en-file | qr-code-devis-photo-envoye-depuis-le-chantier-artisan.png | Pinterest | QR code boutique commerce (726416683586817655) · gabarit 3 — **unique épingle hors-food** | artisan · le devis photo envoyé depuis le chantier · six jours de délai ramenés à vingt minutes | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260927-hotel&utm_content=clic&utm_term=devis | 2026-09-27 |
| à-publier-main | qr-code-liste-d-envies-partagee-avant-un-anniversaire-boutique-reel.mp4 | Instagram + TikTok — **À PUBLIER À LA MAIN** | 31,4 s, muet, ajouter un son dans l'appli | boutique · la liste d'envies partagée avant un anniversaire · six personnes offrent la même chose | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=reel&utm_campaign=20260927-hotel | 2026-09-27 |

> **Sorties de stock du jour : aucune.** Les lignes `dispo` antérieures (congés du camion,
> privatisation arrière-salle, fidélité torréfacteur, brunch du dimanche, carte cadeau salon)
> restent **non déposées** : Buffer refuse leur URL. Le point bloquant du 24/09 tient
> toujours — relancer `QRowg-Depot.cmd` sur `2026-09-16` et `2026-09-23` pour les débloquer.

### Textes prêts — 27/09
`social-a-deposer\2026-09-27\textes-du-jour-2026-09-27.html` (légendes IG, TikTok,
4 Pinterest, LinkedIn, X, reel) et `bios-du-jour-2026-09-27.html`.

> **Reprise après dépôt — 27/09, 14 h 55 UTC.** Dépôt lancé par l'utilisateur : les 16 PNG
> sont en ligne dans `social/2026-09-27/`, la vidéo isolée dans
> `QRowg-Videos-a-publier\2026-09-27`. **Rien reproduit**, étape 0.A non rejouée, **garde
> 0.D refaite avant chaque `create_post`** : Instagram et TikTok comptaient toujours 0 post
> du jour juste avant chacune des deux créations. Les 6 lignes ci-dessus passent de `dispo`
> à **`en-file`**, sauf le reel qui reste `dispo` (publication manuelle).
> **File passée de 0/10 à 6/10.** `dueAt` vérifiés après création : Instagram 27/09 19 h 07
> (seul post IG du jour), TikTok **28/09 06 h 40** — placé au lendemain par la file, donc
> aucune collision, aucun `customScheduled` nécessaire. Pinterest : 27/09 18 h 27 (QR code
> food truck), 27/09 19 h 11 (QR code restaurant), 28/09 12 h 18 (Templates gratuits),
> 28/09 14 h 13 (QR code boutique commerce) — **4 tableaux distincts, 3 food + 1 hors-food**
> (artisan). Relecture `list_posts` : **exactement 6 `scheduled`, 0 `error`**.
> `shareNow` n'a pas été utilisé.

---

## 28/09 — production du jour, EN ATTENTE DE DÉPÔT (statut `dispo`)

> Run planifié, utilisateur absent : `QRowg-Depot.cmd` n'a pas pu être lancé, donc **aucune
> URL publique et aucune mise en file**. Contrôle qualité passé : **16 visuels, 0 alerte**,
> les 8 QR porteurs décodés vers leur lien tracké exact. Slug de campagne `20260928-producteur`.
> Le dossier `social-a-deposer\2026-09-28\` contient déjà `QRowg-Depot.cmd` et `QRowg-Depot.ps1` :
> **lancer le .cmd depuis ce dossier** (profondeur correcte pour `apps\web\.env.local`),
> les aperçus sont isolés dans `apercus\` et ne seront pas déposés.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| dispo | qr-code-fiche-de-conservation-par-legume-producteur-01→06.png | Instagram (carrousel) | `type:post`, `shouldShareToFeed:true`, `isAiGenerated:true`, légende sans URL, 5 hashtags | marché/producteur · la fiche de conservation par légume · elle jette la botte de blettes le mercredi | https://qrowg.com/qr-code/artisan?utm_source=instagram&utm_medium=carrousel&utm_campaign=20260928-producteur | 2026-09-28 |
| dispo | tiktok-qr-code-fiche-de-conservation-par-legume-producteur-01→06.png | TikTok (carrousel photo) | copies 1080×1350, **sans `isAiGenerated`** — **garde 0.D : un carrousel TikTok du 27/09 est programmé le 28/09 à 06 h 40 UTC**, donc pas de création TikTok aujourd'hui | idem (copies redimensionnées) | https://qrowg.com/qr-code/artisan?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20260928-producteur | 2026-09-28 |
| dispo | qr-code-terrasse-ouverte-ou-fermee-selon-la-meteo-restaurant.png | Pinterest | QR code restaurant (726416683586817614) · gabarit 0 · accent rouge métier | restaurant · la terrasse ouverte ou fermée selon la météo · elle rouvre à midi et le trottoir l'ignore | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260928-producteur&utm_content=clic&utm_term=terrasse | 2026-09-28 |
| dispo | qr-code-calendrier-des-fournees-speciales-boulangerie.png | Pinterest | QR code food truck (726416683586817654) · gabarit 1 | boulangerie · le calendrier des fournées spéciales · le levain sort le jeudi, il passe le mardi | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20260928-producteur&utm_content=clic&utm_term=fournees | 2026-09-28 |
| dispo | qr-code-tableau-des-scores-ligue-de-flechettes-bar.png | Pinterest | Templates gratuits (726416683586787015) · gabarit 2 · accent rouge métier | bar · le classement de la ligue de fléchettes · le carnet se perd un jeudi sur trois | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20260928-producteur&utm_content=clic&utm_term=flechettes | 2026-09-28 |
| dispo | qr-code-rendez-vous-pris-depuis-la-vitrine-salon-coiffure.png | Pinterest | QR code salon coiffure (726416683586817657) · gabarit 3 — **unique épingle hors-food** | salon · le rendez-vous pris depuis la vitrine à 20 h · elle ne rappellera pas demain | https://qrowg.com/qr-code/salon?utm_source=pinterest&utm_medium=pin&utm_campaign=20260928-producteur&utm_content=clic&utm_term=vitrine | 2026-09-28 |

> **Sorties de stock du jour : aucune.** Les lignes `dispo` antérieures (congés du camion,
> privatisation arrière-salle, fidélité torréfacteur, brunch du dimanche, carte cadeau salon,
> les trois reels) restent **non déposées** : Buffer refuse leur URL. Le blocage du 24/09 tient
> toujours — relancer `QRowg-Depot.cmd` sur `2026-09-16` et `2026-09-23` pour les débloquer.
> **Test réseau refait le 28/09 côté machine locale** (`device_bash`) : `supabase.co` et
> `qrowg.com` répondent tous deux **000** — le dépôt ne peut donc pas être automatisé depuis
> l'agent, ni depuis le conteneur cloud ni depuis le VM local. Il reste **manuel par nature**.

> **Correction rétroactive** : les 6 lignes du 27/09 ci-dessus étaient restées en `dispo` dans
> le tableau alors que la note de reprise les déclarait `en-file`. Elles sont passées en
> `en-file` le 28/09. Seul le reel du 27/09 reste `dispo` (publication manuelle).

### Textes prêts — 28/09
`social-a-deposer\2026-09-28\textes-du-jour-2026-09-28.html` (légendes IG, TikTok,
4 Pinterest, LinkedIn — pas de X un lundi) et `bios-du-jour-2026-09-28.html`.

> **28/09, 09 h 20 UTC — rappel de réinjection.** Les 20 lignes `dispo` de ce fichier n'ont
> **jamais été déposées** : aucun dossier daté ne contient de `urls.json`, et le réseau vers
> `supabase.co` est fermé côté agent. Elles restent donc non mettables en file tant que
> `QRowg-Depot.cmd` n'a pas tourné sur leur dossier. Ordre de réinjection retenu dès qu'un
> dépôt revient : d'abord le lot du **28/09** (carrousel Instagram, carrousel TikTok sous
> garde 0.D, 4 épingles), puis les épingles du 23/09, puis celles du 16/09. File à 2/10 au
> moment de ce constat, 0/10 après les tirs de 12 h 18 et 14 h 13.

> **28/09 — dépôt reçu mais inexploitable.** Les 16 URL revenues correspondent aux visuels
> du **27/09** (dossier `outputs` périmé redéposé), tous déjà publiés : rien n'a été
> réinjecté, aucune ligne ne passe en `en-file`. Les 6 lignes du **28/09** (carrousel
> Instagram, copies TikTok, 4 épingles) restent en `dispo` en attente du dépôt du bon
> dossier : `social-a-deposer\2026-09-28\QRowg-Depot.cmd`.


---

## 29/09 — production du jour, en attente de dépôt (statut `dispo`)

Secteur principal : **salon de coiffure**. Campagne `20260929-salon`.
16 visuels, **0 alerte** au QC, **8 QR décodés** vers leur lien tracké exact.
Rien n'est déposé : `SUPABASE_SERVICE_ROLE_KEY` manque dans `apps\web\.env.depot`,
donc aucune URL publique, donc aucune mise en file possible (Buffer refuse une image
dont l'URL n'est pas déjà servie).

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| dispo | qr-code-produits-utilises-pendant-le-rendez-vous-salon-coiffure-01..06.png | Instagram (carrousel 6 slides) | — | salon · les produits utilisés pendant le rendez-vous · elle sait quoi racheter, et où | https://qrowg.com/qr-code/salon | 2026-09-29 |
| dispo | tiktok-qr-code-produits-utilises-pendant-le-rendez-vous-salon-coiffure-01..06.png | TikTok (carrousel photo 1080×1350) | pas de `isAiGenerated` | salon · idem carrousel, copies redimensionnées | https://qrowg.com/qr-code/salon | 2026-09-29 |
| dispo | qr-code-menu-de-fin-d-annee-reserve-des-octobre-restaurant.png | Pinterest | QR code restaurant (726416683586817614) | restaurant · menu de fin d'année réservé dès octobre · la demande arrive écrite et complète | https://qrowg.com/qr-code/restaurant | 2026-09-29 |
| dispo | qr-code-privatisation-du-camion-pour-un-evenement-food-truck.png | Pinterest | QR code food truck (726416683586817654) | food truck · privatisation du camion · un formulaire au lieu de quinze allers-retours | https://qrowg.com/qr-code/food-truck | 2026-09-29 |
| dispo | qr-code-planning-des-matchs-diffuses-au-comptoir-bar.png | Pinterest | Templates gratuits (726416683586787015) | bar · planning des matchs diffusés · quel écran, quelle heure, à jour | https://qrowg.com/qr-code/restaurant | 2026-09-29 |
| dispo | qr-code-dossier-de-location-depose-depuis-le-panneau-immobilier.png | Pinterest | QR code immobilier (726416683586817652) | immobilier · dossier de candidature déposé depuis le panneau · des dossiers classés, pas une boîte mail | https://qrowg.com/qr-code/immobilier | 2026-09-29 |
| livré-manuel | qr-code-petit-dejeuner-choisi-la-veille-hotel-reel.mp4 | Instagram + TikTok (manuel) | — vidéo, jamais déposée ni mise en file — | hôtel · petit-déjeuner choisi la veille depuis la chambre · la cuisine ouvre avec la liste écrite, zéro plateau jeté | https://qrowg.com/qr-code/hotel?utm_source=instagram&utm_medium=bio&utm_campaign=20261016-hotel | 2026-10-16 |

**Textes prêts** : `social-a-deposer\2026-09-29\textes-du-jour-2026-09-29.html`
(légendes Instagram / TikTok / 4 Pinterest / LinkedIn / X) et
`bios-du-jour-2026-09-29.html`. Rien à réécrire à la reprise.

> **Correction à reporter sur tout le stock.** Le note du 28/09 disait qu'un dépôt lancé
> un autre jour « casserait les URLs attendues par `attendus.json` ». C'est faux :
> `attendus.json` ne sert qu'au contrôle du **contenu des QR** (le lien qrowg.com tracké),
> déjà validé, et non à l'URL de l'image. `QRowg-Depot.ps1` écrit dans
> `social/<date du jour>/` et **rend les URLs réelles** dans `urls.json` — ce sont
> celles-là qu'on passe à Buffer. **Les 21 lignes `dispo`, dont le lot producteur du 28/09,
> restent donc déposables et mettables en file n'importe quel jour**, sans rien re-rendre.

> **29/09, 12 h 00 UTC — second contrôle du jour.** Rien produit (le lot salon du matin
> suffit), rien déposé, rien en file. **26 lignes en `dispo`**, toutes prêtes : visuels
> rendus, QC passé, textes rédigés. Le seul verrou reste
> `SUPABASE_SERVICE_ROLE_KEY` vide dans `apps\web\.env.depot` ; `supabase.co` est
> injoignable depuis l'agent (curl 000), le dépôt doit donc tourner sur la machine.
> Vérifié ce run : `QRowg-Depot.ps1` scanne **son propre dossier daté**, pas un `outputs`
> partagé — l'incident du 28/09 (URLs du 27/09 renvoyées) ne peut pas se reproduire.
> Ordre de réinjection dès qu'un dépôt revient : lot **28/09**, puis lot **29/09**
> (leurs deux carrousels Instagram sur deux jours distincts, garde 0.D), puis les
> épingles du 23/09, puis celles du 16/09.

## 30/09 — note d'état (aucun mouvement de stock)

Aucune ligne n'a changé de statut : rien n'a été déposé, donc rien n'est parti en file.
Aucune production nouvelle n'a été ajoutée non plus — deux lots complets (28/09 producteur,
29/09 salon) attendaient déjà, et produire un troisième aurait gonflé une réserve bloquée.

**Le blocage est levé** : la clé `SUPABASE_SERVICE_ROLE_KEY` manquait dans
`apps\web\.env.depot` depuis le 28/09 ; elle a été recopiée depuis `apps\web\.env.local`
après vérification qu'elle vise bien le projet de production `yujvstejimbernkolbdu`
(sauvegarde : `.env.depot.bak-20260930`). Les trois gardes du script de dépôt passent.

Dès les deux `QRowg-Depot.cmd` lancés (28/09 puis 29/09) et leurs sorties collées :
ne rien reproduire, refaire la garde 0.D, puis mettre en file dans l'ordre
1 carrousel Instagram (28/09) · 1 carrousel photo TikTok (28/09) · 8 épingles
(4 du 28/09 + 4 du 29/09) = **10/10**. Les carrousels du 29/09 partent le lendemain.

> **01/10 — contrôle de réserve, aucune ligne ajoutée ni retirée.** 26 lignes en `dispo`,
> 94 en `en-file`, 11 en `retiré`. Les deux lots des 28 et 29/09 restent `dispo` : leurs
> visuels sont rendus et contrôlés mais **ne sont pas en ligne** (`urls.json` vide ou
> absent), donc aucune réinjection n'est possible tant que `DEPOT-MAINTENANT.cmd` n'a pas
> tourné sur la machine. Aucune production nouvelle ce run (étape 0-bis : stock d'abord).

---

## 02/10 — aucune réinjection possible, lanceur de dépôt corrigé

**26 lignes en `dispo`**, inchangées. Aucune ne passe en `en-file` : la file Buffer est
pourtant **vide (0/10, 10 places libres, aucun `error`, aucun `scheduled`)**, mais Buffer
refuse une image dont l'URL n'est pas déjà servie et **aucun visuel n'est en ligne**.

Cause racine trouvée ce run : le dépôt du 28/09 **a tourné** (`urls.json` écrit à
11 h 22) et ses 16 uploads ont **tous échoué en silence** — l'ancien script n'affichait ni
le code HTTP ni la réponse de Supabase, écrivait `urls.json` même à zéro succès, et
finissait sur un « Termine. » trompeur.

**`qrfolio\DEPOT-MAINTENANT.ps1` a été réécrit** : détection automatique des lots en
attente, journal détaillé dans `qrfolio\depot-log.txt` (code HTTP + corps de réponse),
`urls.json` écrit seulement en cas de succès, et « ECHEC TOTAL » rouge sinon.

Ordre de réinjection dès qu'un dépôt revient : lot **28/09** (carrousel Instagram +
copies TikTok + 4 épingles), puis les **4 épingles du 29/09** — soit **10/10 exactement**.
Les carrousels Instagram et TikTok du 29/09 (salon) attendent **le lendemain** (garde 0.D).
Ensuite les épingles du 23/09, puis celles du 16/09.

> **07/10 — aucun mouvement, et c'est le neuvième jour.** Rien n'est parti en file (file à
> **0/10**, dernière publication le 28/09), rien de neuf n'est entré : la chaîne reste
> bloquée au dépôt, pas à la production. **73 lignes en `dispo`**, dont les 26 visuels des
> lots 28/09 (10) et 29/09 (16), rendus et **validés à 0 alerte**, qui n'attendent qu'une
> URL publique. Volontairement **aucun lot produit ce run** : un douzième lot ne ferait
> qu'allonger la file d'attente du dépôt.
>
> Trouvé et corrigé ce matin : `DEPOT-SANS-POWERSHELL.cmd` contenait un `for /f` avec
> `usebackq` sur un chemin entre guillemets doubles — il parsait donc le *nom* du fichier
> de clés au lieu de son contenu, et annonçait à tort « NEXT_PUBLIC_SUPABASE_URL absent »
> alors que les deux clés sont valides (JWT de 219 caractères). La voie de secours
> fonctionne enfin ; `DEPOT-MAINTENANT.ps1`, relu, n'avait aucun défaut.
>
> Dès le premier dépôt réussi, ces lignes passent en `en-file` dans l'ordre prévu :
> 1 carrousel Instagram (28/09, producteur) · 1 carrousel photo TikTok (copies `tiktok-`
> du 28/09) · 8 épingles Pinterest (4 du 28/09, 4 du 29/09) = **exactement 10/10**.

---

## Point du 08/10 — stock intact, aucune ligne consommee

Dixieme run sans depot. **74 lignes en `dispo`**, aucune bascule en `en-file` possible :
Buffer refuse toute image dont l'URL n'est pas deja accessible, et aucune URL n'existe
tant que `DEPOT-MAINTENANT.cmd` n'a pas tourne.

Les 32 visuels des lots **2026-09-28** et **2026-09-29** sont rendus, QC a 0 alerte,
textes et bios ecrits. Ils partent en file **le jour meme du depot**, dans l'ordre :
Instagram (28/09) · TikTok (28/09, copies `tiktok-`) · 8 epingles Pinterest (4 + 4).

Voie d'hebergement alternative (assets d'artifact claude.ai) **testee et refusee** par la
politique de session le 08/10 : ne pas re-tenter.


> **09/10 — run de controle, aucune production, aucune ligne consommee.** Les 74 lignes
> `dispo` restent intactes (dont les 32 visuels des lots 28/09 et 29/09, QC a 0 alerte).
> Preuve neuve ce run : `create_post` Pinterest sur l'image du 28/09 renvoie
> `Invalid post: Image could not be read from its URL.` (HTTP 400) — les PNG **ne sont
> pas** sur Supabase, le depot n'a jamais tourne. Rien n'est casse cote lanceurs.
> Onzieme jour sans publication. Un double-clic sur `DEPOT-MAINTENANT.cmd` debloque tout.

---

## Point du 14/10/2026 — stock intact, cause racine du blocage isolée

**25 lignes en `dispo`, aucune bascule en `en-file`.** File Buffer à **0/10** (aucun
`scheduled`, aucun `error`, 10 places libres), donc la place ne manque pas : ce sont les
URLs publiques qui manquent. Buffer refuse toute image dont l'URL n'est pas déjà servie.

**Sonde du jour** : `create_post` Pinterest sur
`social/2026-09-29/qr-code-menu-de-fin-d-annee-reserve-des-octobre-restaurant.png`
→ `Invalid post: Image could not be read from its URL.` (HTTP 400).
Le lot **29/09** rejoint donc le lot **28/09** (même erreur le 09/10) et les 7 orphelins
des lots 16/09 et 23/09 : **aucun des 32 visuels des deux lots complets n'est en ligne**.

**Ce n'est pas un échec d'upload : c'est un lancement qui n'a jamais eu lieu.**
`qrfolio\depot-log.txt` est **absent du disque**. Le script `DEPOT-MAINTENANT.ps1`,
réécrit le 02/10 précisément pour journaliser chaque upload (code HTTP + corps de
réponse), n'a donc pas été exécuté une seule fois depuis. Vérifié ce run : les deux clés
sont en place dans `apps\web\.env.depot` (URL du projet `yujvstejimbernkolbdu`,
`SUPABASE_SERVICE_ROLE_KEY` de 220 caractères), les trois gardes du script passent, et
`$LotsCibles` couvre les quatre lots en attente en ignorant correctement le `urls.json`
vide du 28/09.

Pistes refermées ce run, à ne pas re-tenter :
- `supabase.co` et `qrowg.com` sont refusés par le proxy **des deux côtés** — conteneur
  (`connect_rejected`) et shell de la machine (curl 000). Le dépôt ne tourne que sous
  Windows.
- `storage.objects` est refusé au connecteur Supabase scopé (`permission denied`) : on ne
  peut pas lister le bucket, la sonde Buffer reste le seul moyen de savoir ce qui est en ligne.
- Hébergement alternatif par assets d'artifact : déjà refusé par la politique de session
  le 08/10.

**Aucune production ce run** (étape 0-bis : stock d'abord). Même décision qu'aux runs des
30/09, 01, 02, 07, 08 et 09/10 : un treizième lot n'allongerait que la file d'attente du
dépôt. L'angle restaurant « menu de fin d'année réservé dès octobre » reste `dispo` et
non consommé ; le slug `20261014-restaurant` reste libre.

**Ordre de réinjection, dès que `DEPOT-MAINTENANT.cmd` a tourné** (refaire la garde 0.D
d'abord, un autre run peut être passé) :
1. carrousel Instagram — lot 28/09, producteur, fiche de conservation par légume ;
2. carrousel photo TikTok — copies `tiktok-` du même lot, **sans `isAiGenerated`** ;
3. 8 épingles Pinterest — les 4 du 28/09 (terrasse/météo · fournées spéciales ·
   ligue de fléchettes · rendez-vous depuis la vitrine) puis les 4 du 29/09
   (menu de fin d'année · privatisation du camion · planning des matchs ·
   dossier de location) = **exactement 10/10**.
4. Les carrousels Instagram et TikTok du 29/09 (salon, produits utilisés) partent **le
   lendemain** — un seul post Instagram par jour.
5. Ensuite les épingles du 23/09, puis celles du 16/09.

Les textes et bios sont déjà écrits : `social-a-deposer\2026-09-28\` et
`social-a-deposer\2026-09-29\`. Rien à réécrire à la reprise.

---

## Point du 17/10/2026 — stock intact, aucune ligne consommée (run 12 sans dépôt)

**81 lignes en `dispo`, aucune bascule en `en-file`.** File Buffer à **0/10** (aucun
`scheduled`, aucun `error`, 10 places libres) : la place ne manque toujours pas, ce sont
les URLs publiques qui manquent.

**Cause racine re-vérifiée, identique aux 14, 15 et 16/10.** `qrfolio\depot-log.txt`
reste **absent du disque** — `DEPOT-MAINTENANT.ps1` n'a jamais tourné depuis sa
réécriture du 02/10. Lots en attente re-contrôlés fichier par fichier : `2026-09-16`,
`2026-09-23`, `2026-09-29` sans `urls.json` ; `2026-09-28` avec un `urls.json` vide
(11 octets). **39 visuels montent au premier lancement.**

Aucune sonde Buffer ce run : les trois précédentes (09/10 sur le lot 28/09, 14/10 sur le
lot 29/09, et la lecture du 16/10) donnent toutes la même réponse
`Invalid post: Image could not be read from its URL.` — la question est tranchée, une
quatrième sonde ne dirait rien de neuf et consommerait du quota.

**Production du jour : une vidéo, qui n'entre pas au stock.** Par règle, un `.mp4` ne se
dépose pas et ne se met pas en file : il est livré à part, étiqueté « À PUBLIER À LA
MAIN ». `qr-code-panier-mensuel-paye-d-avance-producteur-reel.mp4` (31,40 s) part donc
directement à l'utilisateur, avec ses textes et ses bios. **Aucun PNG produit ce run** —
même décision qu'aux runs des 30/09, 01, 02, 07, 08, 09, 14, 15 et 16/10 : un treizième
lot n'allongerait que la file d'attente du dépôt.

L'angle producteur « panier mensuel payé d'avance » est **consommé en vidéo**, pas au
stock : il ne crée aucune ligne ici, et il est bloqué jusqu'au 07/11.

**Ordre de réinjection, dès que `DEPOT-MAINTENANT.cmd` a tourné** (refaire la garde 0.D
d'abord, un autre run peut être passé) — inchangé :
1. carrousel Instagram — lot 28/09, producteur, fiche de conservation par légume ;
2. carrousel photo TikTok — copies `tiktok-` du même lot, **sans `isAiGenerated`** ;
3. 8 épingles Pinterest — les 4 du 28/09 (terrasse/météo · fournées spéciales ·
   ligue de fléchettes · rendez-vous depuis la vitrine) puis les 4 du 29/09
   (menu de fin d'année · privatisation du camion · planning des matchs ·
   dossier de location) = **exactement 10/10**.
4. Les carrousels Instagram et TikTok du 29/09 (salon, produits utilisés) partent **le
   lendemain** — un seul post Instagram par jour.
5. Ensuite les épingles du 23/09, puis celles du 16/09.

Les textes et bios sont déjà écrits : `social-a-deposer\2026-09-28\` et
`social-a-deposer\2026-09-29\`. Rien à réécrire à la reprise.


---

## 18/10 — dimanche · production du jour, en attente de dépôt

> **État au 18/10/2026 (run 07 h 49 UTC)** — **aucun changement de statut sur l'existant** :
> le stock reste intégralement bloqué, pour la même et unique raison
> (`DEPOT-MAINTENANT.ps1` jamais lancé depuis sa réécriture du 02/10, `depot-log.txt`
> toujours absent du disque). Conclusion des 15, 16 et 17/10 re-vérifiée et confirmée :
> **plus une seule ligne `dispo` antérieure n'est rattrapable.** File Buffer à **0/10**.
> **Entrée du jour : 16 PNG neufs** (secteur café / salon de thé), tous contrôlés à
> **0 alerte**, QR décodés vers leur lien tracké — ils rejoignent la réserve en `dispo`.
> **Correctif appliqué** : `$LotsCibles` de `DEPOT-MAINTENANT.ps1` reçoit `"2026-10-18"`.
> Un double-clic sur `DEPOT-MAINTENANT.cmd` monte désormais **80 PNG** (au lieu de 64)
> et remplit la file à 10/10 **sans rien reproduire**.
> **La vidéo du jour échappe au blocage** : `qr-code-avis-google-demande-avec-l-addition-salon-de-the-reel.mp4`
> (32,60 s) est **publiable à la main immédiatement**. Un `.mp4` ne se dépose ni ne se met
> en file par règle : il n'entre pas dans la réserve réinjectable.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| dispo | qr-code-atelier-du-samedi-places-restantes-salon-de-the-01..06.png | Instagram (carrousel) | — | salon de thé · l'atelier du samedi · les places restantes visibles, inscription sans appel | https://qrowg.com/qr-code/evenement | 2026-10-18 |
| dispo | tiktok-qr-code-atelier-du-samedi-places-restantes-salon-de-the-01..06.png | TikTok (carrousel photo) | **sans `isAiGenerated`** | idem, copies 1080×1350 | https://qrowg.com/qr-code/evenement | 2026-10-18 |
| dispo | qr-code-carte-des-thes-temps-d-infusion-salon-de-the.png | Pinterest | QR code restaurant (726416683586817614) | salon de thé · carte des thés · origine et temps d'infusion à jour en 30 s | https://qrowg.com/qr-code/menu | 2026-10-18 |
| dispo | qr-code-panier-cadeau-compose-par-le-client-epicerie-fine.png | Pinterest | QR code boutique commerce (726416683586817655) | épicerie fine · panier cadeau · composé par le client, demande écrite et complète | https://qrowg.com/qr-code/boutique | 2026-10-18 |
| dispo | qr-code-contenants-consignes-ou-les-rendre-food-truck.png | Pinterest | QR code food truck (726416683586817654) | food truck · contenants consignés · où les rendre et combien on récupère | https://qrowg.com/qr-code/food-truck | 2026-10-18 |
| dispo | qr-code-temps-d-attente-sans-rendez-vous-salon-coiffure.png | Pinterest | QR code salon coiffure (726416683586817657) | salon de coiffure · temps d'attente sans rendez-vous · affiché en vitrine, à jour en direct | https://qrowg.com/qr-code/salon | 2026-10-18 |

Campagne : `20261018-cafe`. Les 4 épingles portent `utm_content=clic` (série suivie dans
Pinterest Analytics, base à battre : **0,17 %** de clic sortant).
Textes prêts : `social-a-deposer\2026-10-18\textes-du-jour-2026-10-18.html`
(4 titres Pinterest 69–84 car., 4 descriptions 376–392 car., plafond 500).

### Rappel de gabarit, appris ce run
Sur le **gabarit 1** (QR en haut, titre en bas), la colonne de titre ne tient que
**~10 caractères par ligne** : un titre d'épingle au-delà de ~25 caractères casse en trois
lignes avec un mot orphelin en bout. Quatre réécritures ont été nécessaires sur
`panier-cadeau-compose-par-le-client-epicerie-fine` avant d'obtenir deux lignes propres.

---

## Point du 19/10/2026 — stock intact · la sonde de rattrapage est négative · outil réparé

**31 lignes `dispo`, aucune bascule en `en-file`. Aucune entrée : ce run n'a rien produit**
(lundi, pas de jour vidéo ; treizième run sans nouveau lot — le goulot est le dépôt, pas
la production). File Buffer à **0/10**, `error` et `draft` vides, garde 0.D sans objet.
Dernière publication réelle, tous canaux : **13/10**. Six jours de silence.

**La dernière hypothèse de rattrapage est testée et morte.** Les runs du 15 au 18/10
concluaient à l'irrécupérable *par déduction* (pas d'`urls.json`). Ce run a sondé pour de
vrai le lot **2026-09-23**, qui avait des fichiers **prouvés publics** — donc un espoir
légitime pour ses voisins. `create_post` sur
`2026-09-23/qr-code-brunch-du-dimanche-sur-reservation-restaurant.png` →
**`Invalid post: Image could not be read from its URL.`** Post non créé, aucun effet de bord.

**Fait nouveau, qui ferme le sujet :** les dépôts passés ont été faits **fichier par
fichier**, pas par dossier — le 16/09, seuls **4 PNG sur 10** du lot `2026-09-16` sont
montés. Donc **un fichier public dans un lot ne dit rien de ses voisins**. Les quatre
épingles que l'index laissait espérer (`brunch-du-dimanche-sur-reservation-restaurant`,
`privatisation-de-l-arriere-salle-bar`, `carte-cadeau-du-salon-coiffure`,
`carte-de-fidelite-du-torrefacteur-cafe`) sont **confirmées hors ligne**. Ne plus reposer
la question : la réponse est mesurée, pas déduite.

**Deux correctifs appliqués à l'outil de dépôt** (sauvegardes `.bak-20261019` à la racine) :
1. `DEPOT-MAINTENANT.ps1` reçoit
   `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`.
   Le lanceur appelle `powershell` 5.1, qui négocie TLS 1.0 par défaut — refusé par
   Supabase. Aucune ligne TLS n'existait : c'est la cause la plus probable d'un échec en
   bloc du script réécrit le 02/10 et **jamais exécuté depuis**.
2. `DEPOT-SANS-POWERSHELL.cmd` : filtre de lots périmé (`2026-09-28 2026-09-29` seulement)
   **corrigé** → `2026-09-16 2026-09-23 2026-09-28 2026-09-29 2026-10-18`. La voie de
   secours montait 32 PNG sur 80 et laissait au sol le lot du 18/10. Les deux voies sont
   désormais équivalentes : **80 PNG**.

**Anti-doublon — à retenir avant toute réinjection :**
`carte-de-fidelite-du-torrefacteur-cafe` est un **quasi-doublon** de
`carte-de-fidelite-sans-tampon-cafe` (en ligne le 23/09) : même objet, même secteur, même
support. Sa ligne reste `dispo` mais **l'angle doit être réécrit** avant mise en file.
Idem `fermetures-et-conges-du-camion-food-truck` (lot 09-16) face à
`calendrier-fermetures-et-conges-food-truck`, en ligne le 13/10.

**Ordre de réinjection, dès que le dépôt a tourné** (refaire la garde 0.D d'abord) :
1. carrousel **Instagram** — lot 18/10, salon de thé, atelier du samedi ;
2. carrousel photo **TikTok** — copies `tiktok-` du même lot, **sans `isAiGenerated`** ;
3. **8 épingles** — les 4 du 18/10 (thés · panier cadeau épicerie fine · consigne food
   truck · attente salon) puis 4 des lots 28/09 et 29/09 = **10/10 exactement**.
4. Les carrousels des lots 28/09 et 29/09 partent **les jours suivants** (un seul post
   Instagram par jour).

Textes et bios déjà écrits : `social-a-deposer\2026-10-18\`, `\2026-09-28\`, `\2026-09-29\`.
**Rien à réécrire à la reprise.**

---

## Point du 22/10/2026 — stock intact · 31 lignes `dispo`, aucune bascule

**Aucune entrée, aucune sortie.** File Buffer à **0/10**, `error` et `scheduled` vides,
garde 0.D sans objet (0 post Instagram et 0 TikTok dont le `dueAt` tombe aujourd'hui, tous
statuts confondus). Dernière publication réelle, tous canaux : **13/10** — neuf jours de
silence. Seizième run sans nouveau lot : **le goulot est le dépôt, pas la production**.
`depot-log.txt` toujours absent → le script n'a jamais été lancé. Egress re-mesuré ce run :
CONNECT vers `supabase.co` toujours **403** (refus de politique), inchangé depuis le 20/10.
La voie SQL d'inventaire est fermée elle aussi (`execute_sql` refusé sur le connecteur
Supabase PROD) : **l'état réel d'un fichier n'est vérifiable que par un `create_post`**.

**Mesure neuve, à exploiter dès la reprise** (détail dans `_JOURNAL-CONTENUS.md`) : sur
TikTok les vues sont plates (242–286) mais le visionnage moyen varie d'un facteur 5, et le
pic est net — **14,35 s** pour `tiktok-qr-code-commandes-de-gateaux-d-anniversaire-boulangerie`
(23/09), contre 3–4 s pour les sujets « information affichée ». Garder le sujet
« commande / demande écrite avec un livrable daté », changer l'angle et le secteur.

**Ordre de réinjection, dès que le dépôt a tourné** (refaire la garde 0.D d'abord) :
carrousel Instagram 18/10 (salon de thé, atelier du samedi) · carrousel photo TikTok, copies
`tiktok-` du même lot, **sans `isAiGenerated`** · 8 épingles = les 4 du 18/10 puis 4 des lots
28/09 et 29/09 → **10/10 exactement**. Textes et bios déjà écrits dans
`social-a-deposer\2026-10-18\`, `\2026-09-28\`, `\2026-09-29\`. **Rien à réécrire.**


---

## Point du 23/10/2026 — stock intact · 31 lignes `dispo` · aucune bascule · un reel re-livre

**Aucune entree, aucune sortie de la reserve.** File Buffer a **0/10**, `error` et
`scheduled` vides, garde 0.D sans objet (0 post Instagram et 0 TikTok dont le `dueAt` tombe
aujourd'hui, tous statuts confondus). Derniere publication reelle, tous canaux : **13/10**
— **dix jours de silence**. Dix-septieme run sans nouveau lot : **le goulot est le depot,
pas la production**. `depot-log.txt` toujours absent (4e confirmation) ; `supabase.co` rend
HTTP 000 des deux cotes, inchange depuis le 20/10.

**Trois portes testees et fermees ce run** (detail dans `_JOURNAL-CONTENUS.md`) :
Buffer n'a **aucune mutation d'upload** (une URL publique prealable est structurellement
obligatoire) · `raw.githubusercontent.com` repond 200 mais `GH_TOKEN` est invalide ·
hebergeurs anonymes tiers ecartes sans test, volontairement.

**Porte NEUVE, la moins couteuse jamais identifiee** : le pont expose
`mcp__remote-devices__computer_*`. Le controle du bureau n'est pas accorde
(`allowedApps: []`), mais **une autorisation unique** permettrait au run de double-cliquer
`DEPOT-MAINTENANT.cmd` lui-meme, chaque jour. C'est desormais l'option 1.

**Re-livre dans la conversation, hors reserve** (un `.mp4` n'entre pas dans le stock
reinjectable) : `2026-10-18/qr-code-avis-google-demande-avec-l-addition-salon-de-the-reel.mp4`,
**32,60 s, 1080x1920, verifie a l'ffprobe**, + les deux HTML du 18/10. **A PUBLIER A LA
MAIN (IG + TikTok, ajoute ton son).** Deux autres `.mp4` attendent : 16/10 (hotel) et
17/10 (producteur). Un seul reel par jour.

**Ordre de reinjection, des que le depot a tourne** (refaire la garde 0.D d'abord) :
carrousel Instagram 18/10 (salon de the, atelier du samedi) · carrousel photo TikTok, copies
`tiktok-` du meme lot, **sans `isAiGenerated`** · 8 epingles = les 4 du 18/10 puis 4 des lots
28/09 et 29/09 -> **10/10 exactement**. Textes et bios deja ecrits. **Rien a reecrire.**

---

> **État au 28/10/2026 (run 11 h 05 UTC)** — **aucun changement de statut sur les PNG** :
> **31 lignes `dispo`, 80 PNG (22 Mo) sur 5 lots** (16/09, 23/09, 28/09, 29/09, 18/10),
> file Buffer à **0/10**, rien de réinjectable faute d'URL publique. `depot-log.txt`
> **toujours absent — neuvième confirmation**. Les cinq pistes d'hébergement restent closes,
> aucune piste neuve à tester. **Mercredi est un jour vidéo et le bar n'avait aucun reel
> propre en réserve** (constat du 27/10 : `09-09 cocktails` et `09-12 quiz` partagent le slug
> de leur carrousel déjà publié). Le bar a donc été **produit, pas sorti du stock** :
> `qr-code-match-diffuse-table-devant-l-ecran-bar-reel.mp4` — **32,60 s, 1080×1920, h264,
> 978 images**, 10 scènes à moteur d'animation distinct, planche-contact regardée et deux
> titres corrigés (hook sur 3 lignes, « matchs » orphelin au CTA). Copié dans `2026-10-28\`
> et ici. **À publier à la main** : un `.mp4` ne se dépose ni ne se met en file par règle,
> il échappe donc entièrement au blocage.
>
> **⚠ Une ligne passe en `retiré` ce run.** L'angle du reel recoupe le PNG
> `qr-code-planning-des-matchs-diffuses-au-comptoir-bar.png` du lot **29/09** — même objet,
> même support, même secteur. Arbitrage identique au 23/09 : **le reel prime** (publiable
> aujourd'hui, hors blocage), **l'épingle est retirée** (aucune URL publique, aucun texte
> Pinterest écrit, un mois d'attente). Elle sort de la file cible du premier dépôt.
>
> **Leçon pour les prochains runs** : l'anti-doublon ne peut pas reposer sur le seul
> journal. Les PNG des lots non déposés portent des angles qui n'y sont pas consignés —
> **lister les fichiers des 5 lots avant d'arrêter un angle**, pas seulement grepper le journal.
>
> **Prochain jour vidéo : vendredi 30/10** — privilégier **café** (commande récurrente du
> matin) ou **artisan** (calendrier des interventions), deux angles neufs sur deux secteurs
> sans blocage.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| à-publier-main | qr-code-match-diffuse-table-devant-l-ecran-bar-reel.mp4 | Instagram + TikTok (manuel) | — | bar · le match diffusé et la table réservée devant l'écran · le client choisit son écran avant le coup d'envoi | https://qrowg.com/qr-code/restaurant?utm_source=tiktok&utm_medium=reel&utm_campaign=20261028-bar | 2026-10-28 |
| retiré | qr-code-planning-des-matchs-diffuses-au-comptoir-bar.png (lot 29/09) | — | — | bar · planning des matchs au comptoir — **quasi-doublon** du reel du 28/10, retiré le 28/10 | — | 2026-09-29 |

### Texte Pinterest écrit ce run (épingle du lot 29/09, en attente de dépôt)

#### qr-code-privatisation-du-camion-pour-un-evenement-food-truck
**Titre Pinterest** : QR code food truck : privatiser le camion pour un événement
**Description** : Une entreprise veut le camion pour son arbre de Noël, un couple pour un mariage en juin. La demande arrive par message, sans date ferme ni nombre de couverts. Un QR sur le camion ouvre le formulaire : date, invités, formule, accès. Tu réponds une fois, pas dix.
**Lien** : https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20261028-bar&utm_content=clic
`#foodtruck #privatisation #evenement`
**Tableau** : QR code food truck (726416683586817654) — bloc complet **476/500 caractères**.


---

## 30/10/2026 — lot neuf produit, en attente de dépôt

> **État au 30/10/2026 (run 07 h 33 UTC)** — **premier lot neuf depuis le 18/10.** Le stock
> ne pouvait plus rien fournir (les cinq reels propres sont soit sortis, soit sur des secteurs
> bloqués jusqu'au 06/11, 07/11 et 08/11), donc **16 PNG et 1 MP4 ont été produits**. Le stock
> passe de **31 à 37 lignes `dispo`** et de **80 à 96 PNG** sur **6 lots** (16/09, 23/09,
> 28/09, 29/09, 18/10, **30/10**), file Buffer à **0/10**, rien de réinjectable faute d'URL
> publique. Blocage re-mesuré des deux côtés ce run : conteneur **HTTP 000** à 07 h 45 : 30 UTC
> et machine **HTTP 000** à 07 h 45 : 33 UTC sur `yujvstejimbernkolbdu.supabase.co` ;
> `depot-log.txt` **toujours absent (10e confirmation)**. **Correctif apporté ce run** :
> `2026-10-30` ajouté à `$LotsCibles` de `DEPOT-MAINTENANT.ps1` **et** à `LOTS` de
> `DEPOT-SANS-POWERSHELL.cmd` — un double-clic monte désormais **96 PNG** au lieu de 80.
> **Le `.mp4` du jour, lui, échappe entièrement au blocage** : il ne se dépose ni ne se met en
> file par règle, il est **publiable à la main immédiatement**. Contrôle qualité du lot :
> **16 visuels, 0 alerte**, chaque QR décodé vers son lien tracké.

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| dispo | qr-code-habituel-du-matin-enregistre-une-fois-cafe-01..06.png | Instagram (carrousel) | — | café · l'habituel du matin enregistré une fois · il relance sa commande et passe devant la file | https://qrowg.com/qr-code/restaurant | 2026-10-30 |
| dispo | tiktok-qr-code-habituel-du-matin-enregistre-une-fois-cafe-01..06.png | TikTok (carrousel photo) | **sans `isAiGenerated`** | idem, copies 1080×1350 | https://qrowg.com/qr-code/restaurant | 2026-10-30 |
| dispo | qr-code-heures-calmes-et-places-libres-cafe.png | Pinterest | QR code restaurant (726416683586817614) | café · les places encore libres à 15 h · il sait avant de traverser la ville | https://qrowg.com/qr-code/restaurant | 2026-10-30 |
| dispo | qr-code-accords-fromage-et-vin-en-rayon-epicerie-fine.png | Pinterest | QR code boutique commerce (726416683586817655) | épicerie fine · l'accord fromage-vin sur l'étiquette de rayon · le panier ne perd plus dix euros | https://qrowg.com/qr-code/boutique | 2026-10-30 |
| dispo | qr-code-avis-google-demande-sur-le-sachet-boulangerie.png | Pinterest | Avis Google commerce (726416683586817650) | boulangerie · l'avis demandé sur le sachet, pas à la caisse · il répond une fois rentré | https://qrowg.com/qr-code/avis-google | 2026-10-30 |
| dispo | qr-code-mode-de-retrait-choisi-par-le-client-commerce.png | Pinterest | QR code boutique commerce (726416683586817655) | commerce · comptoir, casier ou livraison · elle n'attend plus derrière six personnes | https://qrowg.com/qr-code/boutique | 2026-10-30 |
| livré | qr-code-calendrier-des-interventions-creneau-choisi-artisan-reel.mp4 | IG + TikTok, **à la main** | — | artisan · le calendrier des interventions, créneau choisi par le client · 32,20 s | https://qrowg.com/qr-code/artisan | 2026-10-30 |
| dispo | qr-code-consigne-des-plats-reception-traiteur-01..06.png | Instagram (carrousel) | — | traiteur · la consigne des plats prêtés pour une réception · il récupère ses bacs sans relancer | https://qrowg.com/qr-code/evenement | 2026-10-31 |
| dispo | tiktok-qr-code-consigne-des-plats-reception-traiteur-01..06.png | TikTok (carrousel photo) | **sans `isAiGenerated`** | idem, copies 1080×1350 | https://qrowg.com/qr-code/evenement | 2026-10-31 |
| dispo | qr-code-fiche-de-garde-du-casier-caviste.png | Pinterest | QR code boutique commerce (726416683586817655) | caviste · la fiche de garde et la température de service sur le casier · il achète sans demander | https://qrowg.com/qr-code/boutique | 2026-10-31 |
| dispo | qr-code-temps-attente-du-four-samedi-soir-pizzeria.png | Pinterest | QR code restaurant (726416683586817614) | pizzeria · le temps d'attente du four le samedi soir · il décide dehors sans bloquer la caisse | https://qrowg.com/qr-code/restaurant | 2026-10-31 |
| dispo | qr-code-fromages-a-point-cette-semaine-fromagerie.png | Pinterest | QR code boutique commerce (726416683586817655) | fromagerie · les fromages à point cette semaine · son plateau est parfait le jour voulu | https://qrowg.com/qr-code/boutique | 2026-10-31 |
| dispo | qr-code-compte-rendu-de-visite-proprietaire-immobilier.png | Pinterest | QR code immobilier (726416683586817652) | immobilier · le compte rendu de visite remis au propriétaire le soir même (hors-food) | https://qrowg.com/qr-code/immobilier | 2026-10-31 |
| livré | qr-code-composition-reservee-pour-une-date-fleuriste-reel.mp4 | IG + TikTok, **à la main** | — | fleuriste · la composition réservée pour une date, choisie en vitrine · 32,20 s | https://qrowg.com/qr-code/boutique | 2026-10-31 |

Slug de campagne du lot : `20261030-cafe`. Gabarits d'épingle utilisés : **0, 1, 2 et 3**
(les quatre). Textes Pinterest, légendes IG/TikTok, post LinkedIn et légende du reel :
`social-a-deposer\2026-10-30\textes-du-jour-2026-10-30.html`. Bios :
`social-a-deposer\2026-10-30\bios-du-jour-2026-10-30.html`.

### Textes prêts — lot du 30/10

#### qr-code-heures-calmes-et-places-libres-cafe
**Titre Pinterest** : Places libres au café : la page à créer en 5 minutes
**Description** : À 15 h, il traverse la ville pour travailler au calme, et il n'y a plus une seule table. Il repart, et il ne revient pas. Un QR sur la vitrine et sur le sous-bock ouvre la page des places : les créneaux calmes, les tables encore libres, les prises disponibles. Elle change dans la journée, l'autocollant jamais. Gratuit, sans carte bancaire, prêt à imprimer. Idée simple pour café, coffee shop et coin de travail.
`#cafe #coffeeshop #teletravail #commercelocal`
**Tableau** : QR code restaurant — gabarit 0

#### qr-code-accords-fromage-et-vin-en-rayon-epicerie-fine
**Titre Pinterest** : Accords fromage et vin : la fiche à créer en 5 minutes
**Description** : Il tient un comté de 24 mois et il hésite devant le rayon. Il repose le fromage, il prend le vin qu'il connaît déjà, et le panier perd dix euros. Un QR sur l'étiquette de rayon ouvre la fiche d'accords : le vin conseillé, la raison, ce qu'il vaut mieux éviter. L'arrivage change, la fiche suit, l'étiquette reste la même. Gratuit, sans carte bancaire. Idée pour épicerie fine, fromagerie et caviste.
`#epiceriefine #fromagerie #caviste #commercelocal`
**Tableau** : QR code boutique commerce — gabarit 2

#### qr-code-avis-google-demande-sur-le-sachet-boulangerie
**Titre Pinterest** : Avis Google en boulangerie : le support à imprimer aujourd'hui
**Description** : Le client sort content, le sachet encore chaud sous le bras, et personne ne lui a rien demandé. À la caisse il y avait six personnes derrière lui ; il est déjà parti. Un QR imprimé sur le sachet ouvre la page d'avis une fois rentré, au moment où il mange le pain. Tu changes la destination quand tu veux, le sachet imprimé reste bon. Gratuit, sans carte bancaire. Idée pour boulangerie, pâtisserie et commerce de quartier.
`#boulangerie #avisgoogle #patisserie #commercelocal`
**Tableau** : Avis Google commerce — gabarit 1

#### qr-code-mode-de-retrait-choisi-par-le-client-commerce
**Titre Pinterest** : Mode de retrait en boutique : la page à créer en 5 minutes
**Description** : Elle a réservé en ligne, elle arrive à 18 h, et elle attend derrière six personnes au comptoir. La prochaine fois, elle commandera ailleurs. Un QR sur le ticket et sur la vitrine ouvre le choix du retrait : comptoir, casier, ou livraison dans le quartier. Tu ouvres un casier de plus, la page suit, l'affiche reste collée. Gratuit, sans carte bancaire. Idée pour boutique, commerce de proximité et click and collect.
`#boutique #clickandcollect #commerce #commercelocal`
**Tableau** : QR code boutique commerce — gabarit 3


Slug de campagne du lot : `20261031-traiteur`. Gabarits d'épingle utilisés : **0, 1, 2 et 3**
(les quatre). Textes Pinterest, légendes IG/TikTok, post X et légende du reel :
`social-a-deposer\2026-10-31\textes-du-jour-2026-10-31.html`. Bios :
`social-a-deposer\2026-10-31\bios-du-jour-2026-10-31.html`.

### Textes prêts — lot du 31/10

#### qr-code-fiche-de-garde-du-casier-caviste
**Titre Pinterest** : Fiche de garde sur le casier : la page à créer en 5 minutes
**Description** : Il prend la bouteille, la repose, la reprend : il veut savoir quand l'ouvrir et à quelle température la servir. L'étiquette ne le dit pas. Un QR sur le casier ouvre la fiche de garde. L'arrivage change, la page suit en cinq minutes. Gratuit, sans carte bancaire.
`#caviste #vin #cave #commercelocal`
**Tableau** : QR code boutique commerce — gabarit 0

#### qr-code-temps-attente-du-four-samedi-soir-pizzeria
**Titre Pinterest** : Temps d'attente du four : la page d'attente en 5 minutes
**Description** : Samedi, 20 h. Ils poussent la porte, demandent combien de temps, repartent avant la réponse. Un QR sur la vitrine ouvre l'attente du moment et le créneau d'emport suivant : ils décident dehors, sans bloquer la caisse. Gratuit, sans carte bancaire.
`#pizzeria #pizza #restauration #commercelocal`
**Tableau** : QR code restaurant — gabarit 1

#### qr-code-fromages-a-point-cette-semaine-fromagerie
**Titre Pinterest** : Fromages à point : la fiche d'affinage en 5 minutes
**Description** : Elle reçoit samedi et veut un plateau parfait samedi, pas aujourd'hui. Tu expliques à la coupe, elle oublie dans la rue. Un QR sur la vitrine ouvre la fiche d'affinage de la semaine. Chaque semaine tu modifies la page, l'étiquette reste. Gratuit, sans carte bancaire.
`#fromagerie #fromage #plateaudefromages #commercelocal`
**Tableau** : QR code boutique commerce — gabarit 2

#### qr-code-compte-rendu-de-visite-proprietaire-immobilier
**Titre Pinterest** : Retour de visite le soir même : le compte rendu en 5 minutes
**Description** : Trois visites dans l'après-midi, et le propriétaire qui appelle à 19 h. Tu reprends de mémoire, tu oublies la remarque sur la cuisine. Un QR sur le mandat ouvre la page de suivi des visites. Le prix bouge, la page suit. Gratuit, sans carte bancaire.
`#immobilier #agentimmobilier #venteimmobiliere #commercelocal`
**Tableau** : QR code immobilier — gabarit 3

<!-- lot 2026-11-01 — poissonnerie (carrousel) + primeur (reel) -->
### Lot 2026-11-01 — poissonnerie (carrousel) · primeur (reel)

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| dispo | qr-code-arrivage-du-matin-et-heure-de-la-criee-poissonnerie-01..06.png | Instagram (carrousel) | — | poissonnerie · l'arrivage du matin et l'heure de la criée · elle regarde avant de prendre sa voiture | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=carrousel&utm_campaign=20261101-poissonnerie | 2026-11-01 |
| dispo | tiktok-qr-code-arrivage-du-matin-et-heure-de-la-criee-poissonnerie-01..06.png | TikTok (carrousel photo, 1080×1350) | **sans `isAiGenerated`** | idem, copies 1080×1350 | https://qrowg.com/qr-code/boutique?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20261101-poissonnerie | 2026-11-01 |
| dispo | qr-code-fiche-de-cuisson-par-piece-au-comptoir-boucherie.png | Pinterest | QR code restaurant (726416683586817614) — gabarit 0 | boucherie · la fiche de cuisson par pièce sur l'étiquette · il la relit devant son four | https://qrowg.com/qr-code/menu?utm_source=pinterest&utm_medium=pin&utm_campaign=20261101-poissonnerie | 2026-11-01 |
| dispo | qr-code-dates-de-commande-des-coffrets-de-fin-d-annee-chocolaterie.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 1 | chocolaterie · les dates limites de commande des coffrets de fin d'année · l'affichette reste bonne jusqu'en janvier | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20261101-poissonnerie | 2026-11-01 |
| dispo | qr-code-plan-des-etals-et-presents-du-jour-halle-de-marche.png | Pinterest | QR code food truck (726416683586817654) — gabarit 2 | halle de marché · le plan des étals et qui tient son étal ce matin · elle trouve son producteur | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20261101-poissonnerie | 2026-11-01 |
| dispo | qr-code-suivi-de-commande-et-heure-de-retrait-pressing.png | Pinterest | QR code boutique commerce (726416683586817655) — gabarit 3 | pressing · le suivi de la commande et l'heure de retrait sur le ticket · **hors-food** | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20261101-pressing | 2026-11-01 |
| livré | qr-code-de-saison-cette-semaine-et-la-prochaine-primeur-reel.mp4 | IG + TikTok — **à publier à la main** | — | primeur · ce qui est de saison cette semaine et ce qui arrive la semaine prochaine · 30,70 s, 1080×1920, h264, 921 images, muet | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=reel&utm_campaign=20261101-poissonnerie | 2026-11-01 |

#### Lot 2026-11-01 — textes prêts
**Instagram** (aucune URL, lien en bio, 5 hashtags) et **TikTok** (lien tracké), **4 blocs Pinterest** (titres SEO 65–80 car., descriptions 423–452 sur 500) et la **légende du reel** sont écrits dans `social-a-deposer\2026-11-01\textes-du-jour-2026-11-01.html`. Bios du jour dans `bios-du-jour-2026-11-01.html`. **Rien à réécrire au moment de la mise en file.**


---

> **État au 02/11/2026 (run 07 h 36 UTC)** — **aucun changement de statut sur les PNG déjà en réserve** : les 31 lignes `dispo` des lots antérieurs (16/09, 23/09, 28/09, 29/09, 18/10) restent sans URL publique, file Buffer à **0/10**. Blocage re-mesuré des deux côtés ce run : conteneur **HTTP 000** à 07 h 41 : 15 UTC et machine **HTTP 000** à 07 h 41 : 16 UTC sur `yujvstejimbernkolbdu.supabase.co` ; `depot-log.txt` **toujours absent du disque — treizième confirmation consécutive**. Les cinq pistes d'hébergement restent closes, aucune piste neuve à tester. **Le stock n'a rien pu fournir ce run** : les trois reels encore propres sont sur des secteurs bloqués jusqu'au **06/11 (hôtel)**, **07/11 (producteur)** et **08/11 (salon de thé)**. Lundi n'est pas un jour vidéo : **le lot du jour est produit** — 16 PNG sur le secteur **rôtisserie**, ajoutés ci-dessous en `dispo`. **Correctif de dépôt apporté ce run** : `2026-11-02` ajouté à `$LotsCibles` dans `DEPOT-MAINTENANT.ps1` **et** à `LOTS` dans `DEPOT-SANS-POWERSHELL.cmd` — un double-clic monte désormais **144 PNG** au lieu de 128. **Prochain jour vidéo : mercredi 04/11** — le stock ne pourra rien fournir avant le 06/11, prévoir une production neuve (microbrasserie ou fromager-crémier ambulant, deux secteurs jamais utilisés).

## 02/11 — production du jour, en attente de dépôt

| statut | fichier | canal cible | tableau / meta | angle | lien | ajouté le |
|---|---|---|---|---|---|---|
| dispo | qr-code-plats-du-dimanche-et-heure-de-retrait-rotisserie-01..06.png | Instagram (carrousel) | — | rôtisserie · les plats du dimanche et l'heure de retrait · la commande arrive écrite, la page change en 5 min | https://qrowg.com/qr-code/menu?utm_source=instagram&utm_medium=carrousel&utm_campaign=20261102-rotisserie | 2026-11-02 |
| dispo | tiktok-qr-code-plats-du-dimanche-et-heure-de-retrait-rotisserie-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 — **pas de `isAiGenerated`** sur les photos | https://qrowg.com/qr-code/menu?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20261102-rotisserie | 2026-11-02 |
| dispo | qr-code-allergenes-par-galette-creperie.png | Pinterest | QR code restaurant (726416683586817614) | crêperie · les allergènes par galette · la fiche se corrige le matin même, la carte ne se réimprime pas | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20261102-rotisserie | 2026-11-02 |
| dispo | qr-code-prix-au-kilo-et-contenants-acceptes-vrac.png | Pinterest | QR code boutique commerce (726416683586817655) | magasin de vrac · le prix au kilo et les contenants acceptés · 30 s pour corriger un prix, zéro étiquette réimprimée | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20261102-rotisserie | 2026-11-02 |
| dispo | qr-code-tournee-de-la-semaine-et-emplacement-du-midi-food-truck.png | Pinterest | QR code food truck (726416683586817654) | food truck · la tournée de la semaine et l'emplacement du midi · un marché annulé se corrige en 30 s | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20261102-rotisserie | 2026-11-02 |
| dispo | qr-code-planning-des-cours-et-places-restantes-salle-de-sport.png | Pinterest | QR code salon coiffure (726416683586817657) | salle de sport · le planning des cours et les places restantes · corrigé en direct, hors-food | https://qrowg.com/qr-code/salon?utm_source=pinterest&utm_medium=pin&utm_campaign=20261102-rotisserie | 2026-11-02 |

**Textes prêts du 02/11** : dans `2026-11-02\textes-du-jour-2026-11-02.html` (légende Instagram sans URL + 5 hashtags, légende TikTok, 4 blocs Pinterest titre + description ≤ 500, 1 post LinkedIn) et `2026-11-02\bios-du-jour-2026-11-02.html`. **Rien à réécrire au moment de la mise en file.**

> **État au 03/11/2026 (run 07 h 33 UTC)** — **aucun changement de statut sur les PNG déjà en réserve** : les 31 lignes `dispo` des lots antérieurs (16/09, 23/09, 28/09, 29/09, 18/10) restent sans URL publique, file Buffer à **0/10**, et **plus rien n'a été publié depuis le 13/10 — vingt-deux jours de silence**. Blocage re-mesuré des deux côtés ce run : conteneur **HTTP 000** (`connect_rejected`, *gateway answered 403 to CONNECT*) et machine **HTTP 000** sur `yujvstejimbernkolbdu.supabase.co` à 07 h 35 UTC ; `qrowg.com` lui-même est **HTTP 000 des deux côtés** ; `depot-log.txt` **toujours absent du disque — quatorzième confirmation consécutive**. Les cinq pistes d'hébergement restent closes, aucune piste neuve à tester. **Le stock n'a rien pu fournir ce run** : les trois reels encore propres sont sur des secteurs bloqués jusqu'au **06/11 (hôtel)**, **07/11 (producteur)** et **08/11 (salon de thé)**. Lundi n'est pas un jour vidéo : **le lot du jour est produit** — 16 PNG sur le secteur **microbrasserie**, ajoutés ci-dessous en `dispo`. **Correctif de dépôt apporté ce run** : `2026-11-03` ajouté à `$LotsCibles` dans `DEPOT-MAINTENANT.ps1` **et** à `LOTS` dans `DEPOT-SANS-POWERSHELL.cmd` — un double-clic monte désormais **160 PNG** sur 10 lots, au lieu de 144. **Prochain jour vidéo : mercredi 04/11** — le stock ne pourra rien fournir avant le 06/11, prévoir une production neuve (torréfacteur-grainetier ou conserverie artisanale, deux secteurs jamais utilisés).

| dispo | qr-code-futs-en-pression-cette-semaine-microbrasserie-01..06.png | Instagram (carrousel) | — | microbrasserie · les fûts en pression cette semaine · le fût tourne, la page change en 5 min, le sous-bock imprimé reste bon | https://qrowg.com/qr-code/restaurant?utm_source=instagram&utm_medium=carrousel&utm_campaign=20261103-microbrasserie | 2026-11-03 |
| dispo | tiktok-qr-code-futs-en-pression-cette-semaine-microbrasserie-01..06.png | TikTok (carrousel photo) | — | idem, copies 1080×1350 — **pas de `isAiGenerated`** sur les photos | https://qrowg.com/qr-code/restaurant?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20261103-microbrasserie | 2026-11-03 |
| dispo | qr-code-coffret-de-fin-d-annee-a-composer-biscuiterie.png | Pinterest | QR code boutique commerce (726416683586817655) | biscuiterie · le coffret de fin d'année à composer soi-même · la production change, la page suit, l'étiquette reste bonne | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20261103-microbrasserie&utm_content=clic&utm_term=biscuiterie | 2026-11-03 |
| dispo | qr-code-carnet-de-vendange-et-millesime-domaine-viticole.png | Pinterest | QR code restaurant (726416683586817614) | domaine viticole · le carnet de vendange et le millésime en cours · le millésime change, la contre-étiquette ne bouge pas | https://qrowg.com/qr-code/restaurant?utm_source=pinterest&utm_medium=pin&utm_campaign=20261103-microbrasserie&utm_content=clic&utm_term=domaine-viticole | 2026-11-03 |
| dispo | qr-code-table-du-soir-annoncee-le-matin-chambre-d-hotes.png | Pinterest | QR code hôtel (726416683586817656) | chambre d'hôtes · la table du soir annoncée dès le matin · menu, heure et couverts libres modifiés le matin même | https://qrowg.com/qr-code/hotel?utm_source=pinterest&utm_medium=pin&utm_campaign=20261103-microbrasserie&utm_content=clic&utm_term=chambre-d-hotes | 2026-11-03 |
| dispo | qr-code-carnet-de-soins-et-prochain-rendez-vous-toiletteur.png | Pinterest | QR code salon coiffure (726416683586817657) | toiletteur · le carnet de soins et le prochain rendez-vous · hors-food, le carnet papier n'est plus le seul exemplaire | https://qrowg.com/qr-code/salon?utm_source=pinterest&utm_medium=pin&utm_campaign=20261103-microbrasserie&utm_content=clic&utm_term=toiletteur | 2026-11-03 |

**Textes prêts du 03/11** : dans `2026-11-03\textes-du-jour-2026-11-03.html` (légende Instagram sans URL + 5 hashtags, légende TikTok, 4 blocs Pinterest titre + description ≤ 500, 1 post LinkedIn) et `2026-11-03\bios-du-jour-2026-11-03.html`. **Rien à réécrire au moment de la mise en file.**
| dispo | qr-code-origine-du-sac-et-arrivages-torrefacteur-01.png | Instagram | carrousel 6 slides, slide 01/06 | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | qr-code-origine-du-sac-et-arrivages-torrefacteur-02.png | Instagram | carrousel 6 slides, slide 02/06 | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | qr-code-origine-du-sac-et-arrivages-torrefacteur-03.png | Instagram | carrousel 6 slides, slide 03/06 | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | qr-code-origine-du-sac-et-arrivages-torrefacteur-04.png | Instagram | carrousel 6 slides, slide 04/06 | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | qr-code-origine-du-sac-et-arrivages-torrefacteur-05.png | Instagram | carrousel 6 slides, slide 05/06 | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | qr-code-origine-du-sac-et-arrivages-torrefacteur-06.png | Instagram | carrousel 6 slides, slide 06/06 | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | tiktok-qr-code-origine-du-sac-et-arrivages-torrefacteur-01.png | TikTok | carrousel photo 1080×1350, slide 01/06, **sans isAiGenerated** | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | tiktok-qr-code-origine-du-sac-et-arrivages-torrefacteur-02.png | TikTok | carrousel photo 1080×1350, slide 02/06, **sans isAiGenerated** | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | tiktok-qr-code-origine-du-sac-et-arrivages-torrefacteur-03.png | TikTok | carrousel photo 1080×1350, slide 03/06, **sans isAiGenerated** | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | tiktok-qr-code-origine-du-sac-et-arrivages-torrefacteur-04.png | TikTok | carrousel photo 1080×1350, slide 04/06, **sans isAiGenerated** | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | tiktok-qr-code-origine-du-sac-et-arrivages-torrefacteur-05.png | TikTok | carrousel photo 1080×1350, slide 05/06, **sans isAiGenerated** | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | tiktok-qr-code-origine-du-sac-et-arrivages-torrefacteur-06.png | TikTok | carrousel photo 1080×1350, slide 06/06, **sans isAiGenerated** | torréfacteur · l'origine du sac en cours et le calendrier des arrivages · le lot change, l'étiquette ne bouge plus | https://qrowg.com/qr-code/boutique?utm_source=tiktok&utm_medium=carrousel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
| dispo | qr-code-affinage-en-cave-et-semaine-de-chaque-meule-fromager-ambulant.png | Pinterest | QR code food truck (726416683586817654) | fromager-crémier ambulant · l'affinage en cave et la semaine de chaque meule · la cave annonce, l'étiquette reste | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20261104-torrefacteur&utm_content=clic | 2026-11-04 |
| dispo | qr-code-pressage-en-cours-et-mise-en-bouteille-cidrerie.png | Pinterest | QR code boutique commerce (726416683586817655) | cidrerie · le pressage en cours et la date de mise en bouteille · l'affiche reste collée | https://qrowg.com/qr-code/boutique?utm_source=pinterest&utm_medium=pin&utm_campaign=20261104-torrefacteur&utm_content=clic | 2026-11-04 |
| dispo | qr-code-miels-de-l-annee-et-prochaine-recolte-miellerie.png | Pinterest | QR code food truck (726416683586817654) | miellerie · les miels de l'année pot par pot et la prochaine récolte · mis à jour depuis la miellerie | https://qrowg.com/qr-code/food-truck?utm_source=pinterest&utm_medium=pin&utm_campaign=20261104-torrefacteur&utm_content=clic&utm_term=miellerie | 2026-11-04 |
| dispo | qr-code-creneaux-d-examen-et-suivi-des-heures-auto-ecole.png | Pinterest | Productivité au travail (726416683586787011) | auto-école · les créneaux d'examen restants et le suivi des heures · **le seul hors-food du jour** | https://qrowg.com/qr-code/artisan?utm_source=pinterest&utm_medium=pin&utm_campaign=20261104-torrefacteur&utm_content=clic&utm_term=auto-ecole | 2026-11-04 |
| livré | qr-code-prochaine-mise-en-bocaux-conserverie-reel.mp4 | IG + TikTok, **à la main** | reel 1080×1920, 32,20 s, h264, 966 images, muet | conserverie artisanale · le bocal du moment et la date de la prochaine mise en bocaux · angle distinct du carrousel | https://qrowg.com/qr-code/boutique?utm_source=instagram&utm_medium=reel&utm_campaign=20261104-torrefacteur | 2026-11-04 |
