# Brouillon — approfondir `/qr-code/avis-google`

**État : brouillon. Rien de ce document n'est publié.**
Rédigé le 5 octobre 2026. Le brief SEO demande de préparer les contenus substantiels
en brouillon : le voici. Trois affirmations demandent votre validation avant
publication, elles sont listées à la fin.

---

## Pourquoi cette page, et elle seule

Les exports Search Console du 5 octobre, six mois de données :

| | |
| --- | --- |
| Impressions du site | 515 |
| Impressions du groupe « avis Google » | **202, soit 43 %** |
| Page qui les reçoit | `/qr-code/avis-google` (219 impressions) |
| Position médiane de ce groupe | **~87** |
| Clics | **0** |
| Texte servi par la page | **2 297 caractères** |

Trois requêtes portent ce groupe : `qr code avis google` (110), `qr code pour avis
google` (60), `avis google qr code` (32). La page les cible correctement — la requête
est dans le `<title>`, dans le H1, dans un H2. Le problème n'est pas le ciblage : à
2 297 caractères, la page répond moins bien que celles qui la précèdent.

**Ce que ce brouillon ne promet pas.** Aucune position. Un contenu plus substantiel
peut ne rien changer : avec une seule page externe pointant vers le site (export
« liens » du 5 octobre), l'autorité manque autant que la profondeur. Approfondir est
la seule des deux choses que je peux faire sans rien inventer.

---

## La trouvaille qui change le plan

En relisant la page pour l'étendre, j'ai trouvé un problème plus sérieux qu'un manque
de longueur. Le H1 disait :

> « Transformez vos clients **satisfaits** en avis Google »

Et quatre autres pages reprenaient la mécanique : « dirigez vos clients satisfaits
vers votre fiche Google ».

Les règles de contenu de Google Maps, section *Manipulation des notes*, interdisent
de :

> « Discourage or prohibit negative reviews, or **selectively solicit positive
> reviews** from customers »
>
> — support.google.com/contributionpolicy/answer/7400114, consultée le 5 octobre 2026

Autrement dit : la page décrivait à nos clients une pratique que Google sanctionne, et
c'est **eux** qui en porteraient le coût — les avis obtenus ainsi peuvent être
supprimés. Le produit, lui, n'a jamais trié personne : le bloc `google_review` est un
lien vers la fiche du commerçant, rien de plus.

**Déjà corrigé** (hors brouillon : c'est une réparation, pas un ajout) — les neuf
formulations dans `verticals.ts` et `objectives.ts`, plus une garde
`avisQuiNeTriePas.test.ts` qui empêche la tournure de revenir. La garde vérifie aussi
qu'elle ne devient pas trop large : décrire le problème (« des clients ravis qui ne
laissent jamais d'avis ») reste permis, c'est un constat, pas une méthode.

Cette règle devient le cœur du nouveau contenu : **personne n'écrit cette page**. Les
concurrents qui nous passent devant vendent du « collectez plus d'avis 5 étoiles ».
Expliquer ce que Google autorise réellement est utile, vérifiable, et unique.

---

## Le contenu proposé

### Section 1 — « Google en donne un gratuitement. Lisez ceci d'abord. »

Fait vérifié, et il faut l'écrire : **Google génère lui-même un QR code d'avis**.

> 1. « Go to your Business Profile »
> 2. « Select **Read Reviews** and then Get more reviews »
> 3. « Right-click the QR code. Select **Save image as…** »
>
> — support.google.com/business/answer/16816815, consultée le 5 octobre 2026.
> Google précise : « reviews QR codes can only be generated on a computer browser,
> not on mobile devices ».

Si vous ne voulez qu'un QR code qui mène à votre fiche, celui de Google suffit et ne
coûte rien. Le dire franchement nous coûte peut-être une inscription ; le cacher
coûterait la confiance de quelqu'un qui le découvrira dix minutes plus tard.

Ce qu'un QR code QRowg fait que l'image enregistrée par clic droit ne fait pas —
chaque ligne est une capacité réelle du produit :

| Besoin | Le QR de Google | QRowg |
| --- | --- | --- |
| Mener à la fiche d'avis | oui | oui |
| Changer la destination après impression | non : l'image encode un lien figé | oui, QR dynamique |
| Compter les scans | *à vérifier côté Google* | oui |
| Savoir **quel support** a été scanné | non | oui, un QR par support |
| Imprimer proprement | PNG par clic droit | chevalet, sticker vitrine, affiche, carte, ticket |
| Faire autre chose que l'avis | non | une page : menu, Wi-Fi, contact, horaires |

### Section 2 — « Ce que Google autorise, et ce qu'il interdit »

La section qui justifie la page. Quatre interdictions, citées, pas reformulées :

- **solliciter sélectivement les avis positifs**, ou décourager les avis négatifs ;
- **offrir une contrepartie** : « Offering incentives, like free or discounted goods
  or services, in exchange for customers to post reviews, change reviews, or remove
  negative reviews is considered fake & misleading content and is strictly
  prohibited » (support.google.com/business/answer/3474122) ;
- **mettre la pression sur place** : « merchants should not require or pressure users
  to leave ratings or write reviews while on the premises » ;
- **fixer un objectif au personnel** : demander au personnel un nombre d'avis, ou des
  avis contenant un certain propos.

Ce que Google autorise, dans ses propres termes : « solicit or encourage the posting
of content that does represent a genuine experience, without offering incentives ».

**Ce que ça donne concrètement.** Un QR code affiché, visible de tous, sans condition
ni cadeau : autorisé. Un QR code qu'on présente seulement aux clients qui ont eu l'air
contents : interdit. Un QR code avec « −10 % sur votre prochain café » à côté :
interdit. Un serveur qui attend que le client scanne : à éviter.

### Section 3 — « Où le placer, et comment le savoir »

Le conseil habituel (« table, comptoir, ticket, vitrine ») est une liste. Ce qui
manque, c'est **comment trancher** — et c'est précisément ce que le produit sait
faire : un QR code différent par emplacement, et le décompte des scans par
emplacement. Vous n'avez pas à deviner lequel marche : trois semaines de données le
disent.

Un cadre honnête à proposer :

- **le ticket de caisse** touche tout le monde, mais se jette ;
- **le chevalet de table** est lu au moment où le client n'a rien à faire ;
- **la vitrine** touche aussi des passants qui ne sont jamais entrés — leurs avis
  n'ont pas lieu d'être ;
- **l'e-mail de remerciement** arrive après, sans personne en face : c'est le seul
  emplacement que Google cite nommément (« Include it in thank you emails »).

Aucun de ces points ne prétend savoir lequel gagne chez vous. C'est le but.

### Section 4 — « Statique ou dynamique »

Renvoi au guide existant `/guides/qr-code-dynamique-vs-statique` (position moyenne
54,76, 17 impressions : il existe et il est vu). Ne pas le réécrire ici. Deux phrases
suffisent, avec le cas concret : vous changez d'avis et préférez envoyer vers
Tripadvisor, ou vous déménagez et votre fiche change — avec un QR dynamique, les cent
chevalets déjà imprimés restent valables.

### Section 5 — « La taille minimale pour que ça se scanne »

Les requêtes le demandent : `taille minimale qr code` (3 impressions, position 58),
`taille minimale qr code impression`, `taille mini qr code`. Ne pas inventer de
millimètres : renvoyer vers `/outils/taille-qr-code`, qui calcule, et vers
`/outils/testeur-qr-code`, qui vérifie. Deux outils qui existent déjà et que cette
page n'appelle pas aujourd'hui.

### Section 6 — « Ce que vous saurez, ce que vous ne saurez pas »

La section la plus inhabituelle, et celle qui tiendra le mieux dans le temps.

**Vous saurez** : combien de scans, quand, depuis quel pays et quelle ville, sur quel
type d'appareil, et depuis quel support si vous en avez créé plusieurs.

**Vous ne saurez pas** : combien d'avis ont réellement été laissés. Google ne renvoie
pas cette information au propriétaire du QR code. Un scan n'est pas un avis, et
personne — nous pas davantage — ne peut vous dire le taux de conversion entre les
deux. Qui vous le promet vous raconte une histoire.

### Section 7 — FAQ, deux questions à ajouter

Déjà appliquée (elle fait partie de la réparation, pas de l'ajout) :

> **Puis-je ne demander un avis qu'à mes clients satisfaits ?**
> Non. Les règles Google sur la manipulation des notes interdisent de décourager les
> avis négatifs ou de solliciter sélectivement les avis positifs. Affichez le QR code
> pour tout le monde : c'est la règle, et c'est aussi ce qui rend vos avis crédibles.

À ajouter si vous validez le brouillon :

> **Google fournit déjà un QR code d'avis. Pourquoi QRowg ?**
> Pour ce que le sien ne fait pas : changer de destination sans réimprimer, compter
> les scans, distinguer les emplacements, et s'imprimer proprement sur un chevalet ou
> un sticker. Si vous n'avez besoin que du QR code, celui de Google suffit.

> **Puis-je offrir une réduction en échange d'un avis ?**
> Non, et c'est l'interdiction la plus sèche de Google : une contrepartie contre un
> avis est classée comme contenu trompeur. Le risque est pour votre fiche, pas pour la
> nôtre.

---

## Ce que le gabarit sait déjà faire, et ce qui manque

`/qr-code/[usage]` rend aujourd'hui : `h1`, `intro`, `problems`, `features`, `steps`,
`ctaTitle`, `faq`, `related`. Les sections 4, 5 et 7 entrent dans ces champs sans
toucher au code.

Les sections 1, 2, 3 et 6 sont de la **prose avec des sous-titres et un tableau** :
aucun champ ne les accueille. Deux options :

1. **un champ optionnel** `sections?: { titre: string; paragraphes: string[] }[]` sur
   `Vertical`, rendu après `steps` quand il est présent. Les vingt-cinq autres pages
   ne le déclarent pas et ne changent pas d'un pixel. C'est une vingtaine de lignes
   dans `page.tsx` et un champ dans le type ;
2. **une route dédiée** pour cette page seule, ce qui la sort de la source unique.

Je recommande (1), et seulement si vous validez le contenu : construire le champ avant
d'avoir décidé du texte serait de la mécanique pour rien. Le tableau de la section 1
demanderait un troisième type de section, ou se réécrit en liste.

---

## Trois choses à valider avant publication

1. **Dire que Google donne un QR code gratuit.** C'est vrai, c'est vérifiable en deux
   clics par le visiteur, et ça peut nous coûter des inscriptions. Votre décision,
   pas la mienne. Je ne publierai pas la page sans ce paragraphe : l'omettre, après
   l'avoir su, serait un mensonge par omission.
2. **« Compter les scans : à vérifier côté Google »** dans le tableau comparatif. Je
   n'ai pas vérifié si Google Business Profile expose un décompte de scans de son QR
   code d'avis. Soit vous le vérifiez sur votre fiche, soit la ligne disparaît du
   tableau. Je ne la remplirai pas au jugé.
3. **Le ton de la section 2.** Elle dit à un commerçant que ce qu'il fait peut-être
   déjà est interdit. C'est utile, c'est sourcé, et c'est inhabituel sur une page
   commerciale.

## Sources, datées

| Source | Consultée | Ce qu'elle établit |
| --- | --- | --- |
| support.google.com/contributionpolicy/answer/7400114 | 5 oct. 2026 | sollicitation sélective, pression sur place, objectifs au personnel |
| support.google.com/business/answer/3474122 | 5 oct. 2026 | interdiction des contreparties |
| support.google.com/business/answer/16816815 | 5 oct. 2026 | Google fournit lien + QR code d'avis ; ordinateur seulement |
| Exports Search Console, 6 derniers mois | 5 oct. 2026 | 515 impressions, 43 % sur le groupe avis-google, position ~87 |
| Export « liens » Search Console | 5 oct. 2026 | une seule page externe pointant vers le site |
| `verticals.ts`, `googleReview.ts`, `ceQueMesureLeProduit.ts` | — | ce que le produit fait réellement |

Aucun volume de recherche, aucune estimation de trafic, aucun avis et aucune note ne
figurent dans ce brouillon. Les seuls chiffres viennent de vos exports.
