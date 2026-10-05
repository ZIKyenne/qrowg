# Suivi SEO technique — QRowg

Audit du dépôt et du site livré. Chaque constat porte son niveau de preuve.

| Niveau | Ce que ça veut dire |
| --- | --- |
| **confirmé** | mesuré sur `https://qrowg.com` ou lu dans le code, reproductible |
| **hypothèse** | déduit d'un mécanisme, pas encore observé sur le site |
| **non vérifié** | demande un accès dont je ne dispose pas |

## Repères

| Élément | Valeur |
| --- | --- |
| Next.js | **16.3.5**, App Router (Turbopack) |
| Métadonnées | API `Metadata` native + `lib/seoMeta` (fenêtre titre/description) |
| Sitemap | `app/sitemap.ts` — dynamique, lit la base |
| Robots | `app/robots.ts` |
| Données structurées | `lib/jsonLd`, `lib/landingJsonLd`, JSON-LD par page |
| Validation | `npm run test` · `npm run type-check` · `npm run build` · `npx playwright test` |
| Révision auditée | `4089f187` (local) — identique à la production |

## Politique d'indexation par catégorie

Elle existe déjà et elle est **différenciée** — ce n'est pas une règle globale.

| Catégorie | Politique constatée | Jugement |
| --- | --- | --- |
| Vitrine (`/`, `/features`, `/upgrade`, `/examples`, `/creer`) | indexable, au sitemap | correct |
| Contenu SEO (`/qr-code/*` 27 URL, `/guides/*` 13 URL, `/outils/*`) | indexable, au sitemap | correct |
| Confiance (`/security`, `/privacy`, `/terms`) | indexable | correct |
| `/legal` | **`noindex` tant que l'identité de l'éditeur manque**, et absente du sitemap | correct, et rare — une page légale incomplète vaut moins qu'une page absente |
| Démonstrations (`/examples/[modele]`, 34 URL) | `noindex, follow` + canonical auto-référent | corrigé — voir SEO-01 |
| Miroirs `*.vercel.app` (3 hôtes) | servaient tout en 200, `index, follow` | corrigé — voir SEO-09 |
| **Pages publiées par les clients** (`/[slug]`) | indexées **au cas par cas** via `lib/indexation.jugerPage` | correct, et c'est le point le plus délicat du dossier |
| Redirections QR (`/q/[code]`) | ni bloquées, ni `noindex` — et elles servent du HTML | **défaut** — voir SEO-02 |
| Privé (`/dashboard`, `/auth`, `/api`, `/e2e-harness`) | `Disallow` + hors sitemap | correct |

Le tri des pages clientes mérite d'être souligné : `jugerPage` écarte les pages
d'essai (titre « Ma Page », adresse générée, contenu famélique) **sans les
dépublier** — leur QR continue de fonctionner, elles ne sont simplement pas
proposées aux moteurs. Sur les pages publiées, **6** passent ce filtre aujourd'hui.

---

## Constats

### SEO-01 · `/examples/[modele]` : `noindex` et canonical vers une autre page — **confirmé**

**Où** `apps/web/src/app/examples/[modele]/page.tsx:27-29`
**Preuve** `alternates: { canonical: "https://qrowg.com/examples" }` et
`robots: { index: false, follow: true }` sur la même page, pour les 34 démonstrations.
**Impact** Deux instructions qui se contredisent : le canonical désigne une URL à
conserver, le `noindex` demande de ne rien conserver. Google traite ce cas comme
ambigu et peut finir par appliquer le `noindex` à la cible du canonical, c'est-à-dire
à `/examples` elle-même — une page qu'on veut indexée.
**Priorité** Haute (risque sur une page de la vitrine).
**Correction** Garder le `noindex` — c'est le bon choix éditorial, 34 pages de
contenus de démonstration n'ont rien à faire dans l'index — et rendre le canonical
**auto-référent**.
**Vérification** La page reste `noindex`, son canonical se désigne elle-même, et
`/examples` reste indexable.

### SEO-02 · `/q/[code]` sert du HTML indexable — **confirmé**

**Où** `apps/web/src/app/q/[code]/route.ts` (`murResponse`, `passwordPromptHtml`)
**Preuve** La route répond en `text/html` pour trois cas : QR en pause ou hors quota
(« mur »), demande de mot de passe, et 404. Mesuré : `GET /q/inexistant-xyz` →
`404 · text/html`, **sans** `X-Robots-Tag`. Et `/q/` n'est pas dans le `Disallow`
de `robots.txt`.
**Impact** Un QR partagé sur le web peut faire découvrir l'URL `/q/<code>`. Si le lien
est protégé ou en pause, Google peut indexer « Saisissez le mot de passe » ou le mur
de quota sous le nom du commerçant. Le 404 n'est pas indexé, les deux autres si.
**Priorité** Moyenne (peu probable, mais désagréable et facile à fermer).
**Correction** `X-Robots-Tag: noindex` sur les réponses **HTML** de cette route.
Volontairement **pas** dans `robots.txt` : la redirection doit rester explorable pour
qu'un lien pointant vers un QR transmette sa valeur à la destination. C'est
exactement la distinction que le brief rappelle — `robots.txt` n'est pas une
désindexation.
**Vérification** Les réponses HTML portent l'en-tête ; les redirections 30x n'ont
rien changé.

### SEO-03 · Toutes les pages clientes indexées partagent la même description — **confirmé**

**Où** `apps/web/src/lib/identitePageSeo.ts:43`
**Preuve** Les trois pages sondées en production rendent :
`« The Red Fish — coordonnées, horaires, liens et contact réunis sur une seule page,
accessible en un scan. »`, idem pour `Coffee shop` et `Freelance Pro`. C'est le
**repli** `descriptionRepli()`, utilisé quand l'auteur n'a pas rempli sa description.
**Impact** Six pages indexées, six descriptions identiques au nom près. Google les
réécrit souvent — mais il le fait à partir du contenu, et donc mieux que nous le
ferions. Surtout : le contenu réel de la page (bio, premier texte) **est déjà chargé**
par la requête (`blocks(content)`), il n'était simplement pas utilisé.
**Priorité** Moyenne.
**Correction** Dériver le repli du contenu de la page quand il existe, et ne retomber
sur la phrase générique qu'à défaut. Aucune requête supplémentaire.
**Vérification** Deux pages au contenu différent produisent deux descriptions
différentes ; une page sans texte garde le repli.

### SEO-04 · `/creer` est une page de conversion, pas une page de contenu — **confirmé, aucune correction appliquée**

**Preuve mesurée** `/creer` sert **1 369 caractères** de texte (contre 2 300–5 000 pour
les autres pages de la vitrine), son `<h1>` est « Choisissez votre secteur » alors que
son `<title>` vise « Créer votre page et son QR code ». Elle est au sitemap en
`priority: 0.9`.
**Analyse** Les cartes de modèles **sont** rendues côté serveur — j'ai vérifié, les huit
recommandés et les compteurs de secteur sont dans le HTML. Le texte est court parce que
la galerie n'affiche que 8 modèles sur 48 avant « Voir les 40 autres », ce qui est
délibéré et gardé par un test.
**Pourquoi je n'ai rien changé.** Les deux corrections évidentes se heurtent à du
travail déjà fait :
- ajouter un paragraphe d'introduction répondant à l'intention pousserait les cartes
  encore plus bas, alors que l'audit produit (Q17) reprochait justement que « la
  première carte commence vers y = 533 px » ;
- baisser `priority` n'aurait aucun effet mesurable : Google ignore ce champ depuis
  des années.

**La bonne réponse est ailleurs, et elle est déjà en place** : l'intention
informationnelle (« créer un QR code », « QR code restaurant ») est portée par
`/qr-code/*` et `/guides/*`, qui ont le contenu pour, et qui pointent tous vers
`/creer` depuis que leurs liens ont été corrigés. `/creer` reçoit le trafic, elle n'a
pas à le capter.

### SEO-05 · Aucun lien interne cassé — **confirmé, aucun défaut**

**Preuve** 98 liens internes distincts extraits des cinq pages qui distribuent le
crawl (`/`, `/qr-code`, `/guides`, `/outils`, `/examples`), tous interrogés en
production : **98 réponses 200, aucune 3xx ni 4xx**.

### SEO-06 · Sitemap et robots — **confirmé, conformes**

**Preuve** 60 URL, toutes absolues et sur le bon hôte, aucune zone privée, dates de
modification issues d'une source unique (jamais `new Date()`), et les pages annoncées
répondent. `robots.txt` renvoie au sitemap et interdit `/dashboard/`, `/auth/`,
`/api/`, `/e2e-harness/`. Vérifié par `e2e/refQuiTientEnLigne.spec.ts` : **33/33 sur
qrowg.com**.

### SEO-07 · Les 26 pages d'usage ne sont pas des clones — **confirmé, aucun défaut**

Le brief met en garde : « Ne génère pas des dizaines de pages métiers
interchangeables. » J'ai mesuré plutôt que supposé.

**Méthode** Recouvrement de vocabulaire entre le texte servi de quatre pages
d'usage, deux à deux (intersection ÷ union des mots).

| Paire | Recouvrement |
| --- | --- |
| restaurant / boutique | 36,9 % |
| restaurant / salon | 43,2 % |
| restaurant / garage | 34,1 % |
| boutique / salon | 44,2 % |
| boutique / garage | 31,4 % |
| salon / garage | 38,1 % |

**Lecture** Des pages produites depuis un même gabarit se situent entre 80 et 95 %.
Entre 31 et 44 %, le vocabulaire commun est celui du sujet — « QR code », « scan »,
« page » — et le reste est propre à chaque métier. **Aucune page à fusionner, aucune
à supprimer.** Je n'en ajouterai pas non plus : le brief le demande, et rien dans ce
que j'ai mesuré ne le justifierait.

**Aucun chevauchement de slug** entre les 26 usages et les 12 guides : pas de
cannibalisation par l'URL.

### SEO-08 · Intention de recherche → page existante — **analyse**

Correspondance établie à partir des routes réelles, **sans aucune donnée de volume**
(je n'y ai pas accès — voir plus bas). Les quatre pistes du brief, confrontées aux
fonctionnalités qui existent vraiment :

| Intention | Page existante | État |
| --- | --- | --- |
| QR code dynamique | `/guides/qr-code-dynamique-vs-statique` + `/qr-code/*` | la fonctionnalité existe (QR modifiable après impression). Guide relié à `/creer`. **Rien à faire.** |
| menu restaurant par QR code | `/qr-code/menu`, `/qr-code/restaurant`, `/qr-code/food-truck` | trois pages distinctes, contenus distincts (SEO-07). Modèles correspondants dans la galerie. **Rien à faire.** |
| carte de visite numérique | `/qr-code/carte-de-visite`, `/qr-code/cv` | existent, et le produit sait faire (bloc contact, vCard). **Rien à faire.** |
| page de liens | `/qr-code/instagram`, `/creer` | existe. **Rien à faire.** |

Les quatre intentions ont déjà leur page, avec du contenu propre et un chemin clair
vers la création. **Je n'ai donc rien créé** — en fabriquer davantage serait
exactement ce que le brief interdit.

Ce qui reste à trancher demande les données : **quelles** de ces pages reçoivent des
impressions, et lesquelles n'en reçoivent aucune. C'est la différence entre un
problème de titre et un problème d'indexation, et elle ne se devine pas.

### SEO-09 · Trois miroirs servaient le site entier en 200 — **confirmé, corrigé**

**Découvert en vérifiant une question Search Console** : la propriété voit-elle bien
*un seul* site ? La réponse était non.

**Preuve mesurée** le 30 septembre, sur les cinq domaines du projet Vercel :

| Domaine | Réponse |
| --- | --- |
| `qrowg.com` | 200 — l'apex |
| `www.qrowg.com` | **308 → apex** ✓ (le middleware le fait déjà, avec le bon raisonnement) |
| `qrfolio.vercel.app` | **200** — ancien nom du projet |
| `qrowg-qrowg.vercel.app` | **200** |
| `qrowg-git-main-qrowg.vercel.app` | **200** |

Les trois derniers servent le site **entier**, pages clientes comprises. Vérifié sur
`/qr-code/restaurant` : ils portent le bon canonical vers l'apex — mais s'annoncent
`<meta name="robots" content="index, follow">`, et leur `robots.txt` autorise
l'exploration.

**Impact** Un canonical est une *indication*, pas une directive. Trois copies de
chaque page : du budget d'exploration dépensé pour rien, et le risque qu'une URL de
miroir entre dans l'index. Pour Search Console, c'est pire qu'un doublon ordinaire —
les données se répartissent entre des propriétés distinctes, et l'apex sous-déclare
son trafic. C'est exactement ce qui rendrait vos exports trompeurs.

**Correction** `X-Robots-Tag: noindex` sur les réponses servies depuis un hôte
`*.vercel.app`, dans le middleware qui gère déjà la redirection de `www`.

**Pourquoi marquer et non rediriger.** Ces adresses servent à inspecter un déploiement
quand l'apex va mal. Les rediriger les rendrait inutilisables le jour où on en a
justement besoin. `www`, lui, redirige : c'est une adresse de visiteur, pas un outil.

**Vérification** À faire **après déploiement** (le middleware ne tourne qu'en ligne) :

    curl -sI https://qrfolio.vercel.app/qr-code/restaurant | grep -i x-robots-tag
    curl -sI https://qrowg.com/qr-code/restaurant | grep -i x-robots-tag   # doit être vide

---

## Search Console — état et outillage

### La propriété est vérifiée — **confirmé**

`apps/web/src/app/layout.tsx:31` porte `google: "j0SKDePzohMoahiN7B09kpx5RGpZaNMdW1N-s-M1IPg"`,
et la balise est bien servie en production. **Les exports vous sont donc accessibles
dès maintenant** : il n'y a rien à installer ni à vérifier d'abord.

### L'outil qui lit vos exports

`scripts/search-console.mjs` — pour que « fournir les exports » devienne « déposer les
fichiers et lancer » :

    node scripts/search-console.mjs <dossier des CSV>

L'archive de Search Console se décompresse telle quelle dans un dossier. Les noms
français et anglais sont reconnus. Un fichier absent est signalé, **jamais suppléé**.

Ce qu'il sort, et pourquoi c'est ce qui manquait :

| Section | Ce qu'elle tranche |
| --- | --- |
| Vues sans jamais être cliquées (pos. ≤ 20) | problème de **titre ou de description**, pas de fond |
| Au bord de la première page (pos. 8–20) | le meilleur rapport effort/gain |
| Au sitemap mais **aucune** impression | problème d'**indexation ou de sujet** — une correction toute différente |
| ⚠ URL d'un autre hôte | **un miroir est indexé** : SEO-09 n'a pas suffi |
| Ce qui marche déjà | à ne pas casser en « optimisant » |
| Pages hors routes connues | pages clientes, ou anciennes adresses |

Il croise les exports avec les **routes réelles du dépôt** (lues dans `verticals.ts` et
`guides.ts`) : c'est ce croisement qui permet de dire « cette page existe, elle est au
sitemap, et personne ne l'a jamais vue ». Search Console seule ne le dit pas.

Il a été **essayé sur un export fabriqué** (six requêtes, cinq pages, dont une URL de
miroir) : les six sections se remplissent correctement, et le miroir est bien isolé de
l'apex. Un défaut trouvé et corrigé au passage : la première version réduisait les URL
au chemin, ce qui confondait `qrfolio.vercel.app/qr-code/restaurant` avec l'apex — or
c'est précisément ce qu'il faut voir.

Il imprime enfin ce qu'il **ne** mesure pas : la position moyenne mélange requêtes et
pays, une page absente n'est pas forcément désindexée, les requêtes rares sont
anonymisées, et aucune variation n'est attribuable d'office à une correction.

---

## Analyse des données Search Console — 6 mois, reçues le 5 octobre

Filtre de l'export : **Type de recherche Web, les 6 derniers mois.**

### Le chiffre qui commande tout le reste

| Mesure | Valeur |
| --- | --- |
| Clics | **3** |
| Impressions | **515** |
| CTR | 0,58 % |
| Position moyenne (Search Console) | 68,5 |
| **Position médiane, pondérée par les impressions** | **87,6** |

La médiane pondérée est la mesure à retenir : elle dit où se trouve la *majorité des
apparitions*, là où une moyenne compte une requête vue une fois comme une requête vue
cent fois. **87,6, c'est la neuvième page de résultats.**

Ce que ça signifie, sans détour : le site est **indexé** — 43 pages apparaissent, le
sitemap est suivi — mais il n'est **pas compétitif**. Ce n'est ni un problème
technique, ni un problème de balises. Les corrections SEO-01 à SEO-09 étaient
justes et nécessaires ; aucune ne fera passer une page de la position 87 à la
première page.

### Là où la demande existe vraiment

Trois variantes d'une même question font **202 impressions, soit 43 % du total** :

| Requête | Impressions | Position |
| --- | --- | --- |
| qr code avis google | 110 | 87,6 |
| qr code pour avis google | 60 | 87,6 |
| avis google qr code | 32 | 86,8 |
| *(+ 5 variantes plus rares)* | ~11 | 83–99 |

La page existe — `/qr-code/avis-google`, **219 impressions, position 86,45**, la page
la plus vue du site. Et elle est **correctement ciblée** : j'ai vérifié le HTML servi,
le `<title>` est « QR code avis Google : collecter plus d'avis clients », la requête
exacte figure aussi dans un H2.

**Il n'y a donc rien à corriger sur cette page.** Son contenu fait 2 297 caractères
pour cinq H2 — c'est court face à une requête commerciale disputée, et c'est la seule
piste honnête : **de la profondeur, pas une balise.**

Second groupe, plus diffus : le restaurant — `qr code restaurant`,
`code qr restaurant`, `qrcode restaurant`, `qr code pour restaurant gratuit`,
`réservation qr code restaurant` — **74 impressions** réparties sur cinq formulations,
positions 51 à 99. La page `/qr-code/restaurant` fait 89 impressions, position 73,1.

### Ce qui marche déjà : votre marque

Les positions 2 à 7 sont toutes des requêtes de marque.

| Page | Position | Impressions |
| --- | --- | --- |
| `/` | **2,12** | 40 (et **2 des 3 clics**) |
| `/creer` | 2,00 | 3 |
| `/examples` | 2,58 | 12 |
| `/security` | 3,20 | 20 |
| `/guides` | 3,96 | 24 |
| `/upgrade` | 4,00 | 6 |
| `/features` | 5,14 | 7 |

Autrement dit : **qui cherche QRowg le trouve.** Et deux requêtes sont des fautes de
frappe sur la marque — `qrrg` (4 impressions, position 5) et `qroge` (1, position 6) :
le nom s'entend mal à l'oral ou se retient mal. C'est une observation, pas une
recommandation : je n'ai aucun moyen de savoir s'il faut agir dessus.

Le troisième clic est le plus instructif : `/guides/comment-scanner-un-qr-code`, **un
clic depuis la position 60,46**. Quelqu'un est allé chercher page 6. Le sujet
intéresse plus que la position ne le laisse croire.

### Les pages jamais vues

Treize routes du sitemap n'ont **aucune** impression sur six mois :

`/qr-code/whatsapp` · `/qr-code/pdf` · `/qr-code/hotel` · `/qr-code/salon` ·
`/qr-code/artisan` · `/qr-code/pharmacie` · `/qr-code/camping` ·
`/qr-code/association` · `/qr-code/carte-de-visite` · `/contact` · `/privacy` ·
`/outils` · `/generateur-qr-code-wifi`

**Attention à la conclusion.** Zéro impression ne veut pas dire désindexée : la page
peut être indexée et n'avoir jamais été jugée pertinente pour une requête. Les deux
cas demandent des actions opposées. **Seul l'export « Indexation des pages »
tranche** — et c'est le seul qui manque encore.

### URL à paramètres dans les résultats — **confirmé, sans gravité**

Deux URL de campagne apparaissent, à 1 impression chacune :
`/qr-code/boutique?utm_source=instagram&…` et `/qr-code/restaurant?utm_source=…`,
toutes deux en position 1 — Google a exploré le lien partagé sur Instagram.

J'ai vérifié : **elles portent le bon canonical** vers l'URL propre
(`https://qrowg.com/qr-code/boutique`). Google consolidera. **Rien à faire** — le
signaler suffit, et l'outil le signalera désormais tout seul si le volume grossit.

### Audience et appareils

**France : 419 des 515 impressions.** Le contenu est en français, l'audience aussi :
cohérent, rien à changer. Belgique 22, Maroc 9, Suisse 3.

Plus surprenant : **ordinateur 323 impressions contre mobile 186** — l'inverse de ce
qu'on attendrait d'un produit de QR codes. C'est logique une fois dit : on *scanne*
sur mobile, mais on *cherche comment faire* sur ordinateur, au bureau. Les requêtes
sont informationnelles, pas transactionnelles.

### Ce que je n'ai pas fait avec ces données

- **Aucun volume de recherche** n'est avancé : 110 impressions ne sont pas 110
  recherches mensuelles, et je n'ai pas Keyword Planner.
- **Aucune correction de balise** sur `/qr-code/avis-google` : elle est déjà juste.
  En changer une pour avoir l'air d'agir serait du bruit.
- **Aucun lien interne ajouté.** J'ai vérifié le maillage vers `/qr-code/avis-google` :
  il reçoit `/`, `/qr-code`, `/qr-code/restaurant` et trois guides
  (`qr-code-rgpd`, `ou-placer-son-qr-code`, `qr-code-ne-fonctionne-pas`). Passer de
  trois guides à cinq ne déplace pas une page de la position 87. Le prétendre serait
  malhonnête.

---

## Deuxième lot d'exports — reçus le 5 octobre

Quatre fichiers de plus. Trois sont vides, et le quatrième est le plus parlant du lot.

### SEO-10 · Une seule page externe pointe vers le site — **confirmé**

Export des liens (« Plus d'exemples de liens », 5 octobre) :

~~~
Page d'origine
https://co.pinterest.com/qr_owg/
~~~

Une ligne. Un profil Pinterest, qui est le vôtre.

C'est la pièce qui manquait à l'analyse de la position 87. Une page peut être
parfaitement balisée, au bon sujet, et rester en bas : si rien ne pointe vers elle,
Google n'a aucune raison de la préférer. Les trois requêtes « avis Google » rapportent
202 impressions — la demande est là, c'est l'autorité qui n'y est pas.

**Ce que je n'en déduis pas** : que des liens feraient monter la page. Je n'ai aucun
moyen de le prouver, et acheter des liens est sanctionné. Ce que ce chiffre établit,
c'est que **le problème n'est pas technique**. Aucune correction de balise ne le
réglera, et je n'en ferai pas semblant.

**Limite de l'export** : Search Console échantillonne les liens et n'en montre qu'un
extrait. « Une page d'origine » veut dire « une dans l'échantillon », pas forcément
« une au monde ». L'ordre de grandeur, lui, ne fait pas de doute.

### Les trois tableaux vides — **non concluant**

| Fichier | Colonnes | Lignes |
| --- | --- | --- |
| `Tableau.csv` | Problème, Validation, Pages | **0** |
| `Problèmes critiques.csv` | Problème, Validation, Éléments | **0** |
| `Problèmes non critiques.csv` | Problème, Validation, Éléments | **0** |

Un en-tête, aucune ligne. Ces colonnes (« Problème / Validation ») sont celles d'un
rapport de **problèmes** — expérience, ergonomie, données structurées. Lues comme
telles : **aucun problème signalé**, ce qui est une bonne nouvelle.

Ce qu'elles ne sont pas : l'export « Indexation des pages ». Son tableau est indexé
sur un **motif** par URL, et il contiendrait au minimum les pages que je peux prouver
en `noindex` — `/legal`, `/examples/[modele]`, `/dashboard/*`. Un tableau vide ne peut
donc pas être le sien. Soit l'export vient d'un autre rapport, soit la vue n'était pas
chargée au moment du clic.

**Conséquence** : la question des treize routes sans impression reste ouverte, et je
ne la trancherai pas au jugé. Le chemin exact, s'il vous reste une minute :
*Indexation › Pages › « Pourquoi les pages ne sont pas indexées » › Exporter*. Sinon,
ce n'est plus bloquant : l'export des liens vient de déplacer la priorité ailleurs.

### L'apparence dans les résultats reste vide — **confirmé, sans action**

Deuxième export consécutif sans une seule ligne. Sur six mois, aucune impression du
site n'a été classée dans une apparence particulière.

C'est **cohérent** avec un fait que je n'ai pas revérifié aujourd'hui : Google a
restreint les résultats enrichis FAQ en août 2023 aux sites d'administration et de
santé. Le balisage `FAQPage` du site reste **exact et utile** — il décrit ce que la
page affiche vraiment — mais il ne produira pas d'extrait enrichi, et je ne l'ai jamais
promis. Je ne le retire pas : un balisage juste ne devient pas faux parce qu'il ne
rapporte pas d'affichage.

### SEO-11 · La page d'avis décrivait une pratique interdite par Google — **confirmé, corrigé**

Trouvé en voulant approfondir `/qr-code/avis-google`, et plus grave qu'un manque de
longueur. Le H1 disait « Transformez vos clients **satisfaits** en avis Google », et
huit autres formulations reprenaient la mécanique.

Les règles de contenu de Google Maps, section *Manipulation des notes*, interdisent de
« discourage or prohibit negative reviews, or **selectively solicit positive reviews**
from customers »
(support.google.com/contributionpolicy/answer/7400114, consultée le 5 octobre 2026).

La page expliquait donc à nos clients une pratique qui peut faire **supprimer leurs
avis** — le risque était pour eux, pas pour nous. Le produit, lui, n'a jamais trié
personne : le bloc `google_review` est un lien vers la fiche du commerçant.

**Corrigé** : les neuf formulations dans `verticals.ts` (restaurant, avis-google,
coiffeur, boulangerie, garage) et `objectives.ts`, plus une question de FAQ qui
**énonce la règle** au commerçant. La description reste dans les bornes du dépôt
(150 caractères).

**Garde** : `apps/web/src/app/avisQuiNeTriePas.test.ts` (3 tests). Elle parcourt les
champs qui *promettent* — `metaTitle`, `metaDescription`, `h1`, `intro`, `ctaTitle`,
`features`, `steps`, `gain`, réponses de FAQ, objectifs d'onboarding — et refuse la
satisfaction comme condition d'une demande d'avis. Elle laisse le champ `pain`
tranquille : « des clients ravis qui ne laissent jamais d'avis » est un constat, pas
une méthode. Trois précautions : un plancher de 200 champs pour qu'elle ne puisse pas
se taire, un test qui exige la règle dans la FAQ, et un test qui vérifie que la règle
n'est pas devenue si large qu'elle interdise de décrire le problème.

**La garde a trouvé une neuvième occurrence que mon `grep` avait manquée** — « au
moment où le client est content », sur la page garage. C'est exactement pour ça qu'elle
lit les données typées et pas des chaînes.

### SEO-12 · Le gabarit plafonne TOUT le contenu à ~2 400 caractères — **confirmé, capacité ajoutée**

En cherchant à approfondir une page, j'ai mesuré les autres. Texte réellement servi
par la production, le 5 octobre (HTML initial, scripts et balises retirés) :

| Page | Texte servi | Position |
| --- | --- | --- |
| `/qr-code/avis-google` | 2 291 car. | 86,45 |
| `/qr-code/instagram` | 2 193 car. | 63,91 |
| `/qr-code/evenement` | 2 344 car. | 70,25 |
| `/guides/qr-code-avec-statistiques` | 2 535 car. | 72,28 |
| `/qr-code/restaurant` | 2 645 car. | 73,11 |
| `/guides/qr-code-dynamique-vs-statique` | 2 635 car. | 54,76 |
| `/generateur-qr-code` | 3 266 car. | **6,76** |
| `/outils/taille-qr-code` | 4 076 car. | 47,40 |
| `/outils/testeur-qr-code` | 4 019 car. | 62,86 |

**Ce n'est pas un choix éditorial.** `h1` + `intro` + trois problèmes + quatre atouts
+ quatre étapes + trois questions **produisent** ~2 400 caractères, et aucune page ne
peut être plus profonde que son gabarit. J'avais écrit que `/qr-code/avis-google`
était courte : elle est **exactement aussi courte que les vingt-cinq autres**. Le
diagnostic « cette page manque de fond » était juste mais mal cadré — c'est la couche
de contenu entière qui a un plafond.

Les deux pages qui dépassent 4 000 caractères sont les **outils** : elles ont de
l'interface à décrire. Ce sont aussi celles dont le texte n'est pas un gabarit.

**Fait** : un champ optionnel `sections?: Section[]` sur `Vertical`
(`{ titre, paragraphes[], puces? }`), rendu après « Comment ça marche ».
**Aucune page ne le déclare aujourd'hui** : le site ne change pas d'un pixel tant que
vous n'avez pas validé de contenu. Identité respectée — `h2Css`, or `#C9A84C`, texte
discret, mêmes jetons que le reste de la page.

**Garde** (dans `verticals.test.ts`, 4 tests) : titre et paragraphe non vides, pas de
titre répété dans une page, **aucun balisage dans les données** (ces chaînes partent
dans du JSX, un `<a href>` y serait rendu littéralement), et — le plus important —
**au plus la moitié des usages peuvent en déclarer**. Rempli partout « pour faire du
contenu », ce champ refabriquerait les vingt-six pages interchangeables que le brief
interdit. La demande prouvée porte sur trois sujets, pas sur vingt-six.

**Les trois sujets, et la preuve de chacun** :

| Sujet | Preuve Search Console | Page | État |
| --- | --- | --- | --- |
| avis Google | 202 impressions (43 %), positions ~87 | `/qr-code/avis-google` | brouillon prêt |
| restaurant & réservation | 74 impressions sur 5 formulations ; « réservation qr code restaurant » 27 impr. en **51,6** | `/qr-code/restaurant` | à rédiger |
| suivi des scans | « qr code avec suivi des clics » 13 impr. en 94 ; « qr code statique » 9 en 82 | `/guides/qr-code-avec-statistiques` | à rédiger |

Tout le reste est entre 1 et 30 impressions sur six mois. Je n'écrirai pas une page de
fond pour une impression.

### SEO-13 · Deux pages pour « QR code Wi-Fi », une seule existe pour Google — **confirmé, différencié**

| Page | `<title>` | Impressions | Position |
| --- | --- | --- | --- |
| `/qr-code/wifi` | QR code Wi-Fi : connexion en un scan (gratuit) | 13 | 15,92 |
| `/generateur-qr-code-wifi` | Générateur de QR code Wi-Fi gratuit | **0** | — |

Les deux sont canoniques sur elles-mêmes (vérifié en production) et servaient des
descriptions presque identiques : « vos **invités** / **visiteurs** se connectent en un
scan, sans taper le mot de passe. Fonctionne hors ligne ». Deux pages, une intention.
Google en a retenu une.

**Fait** : la description de l'outil décrit maintenant **l'outil** — les champs à
remplir, les formats de sortie — là où la page d'usage décrit **l'usage**. 147
caractères, dans les bornes du dépôt.

**Ce que je n'ai pas fait, et pourquoi** : aucun canonical croisé, aucune redirection.
La page qui a les impressions est `/qr-code/wifi` ; la canoniser vers l'outil
sortirait de l'index la seule des deux que Google montre. Et le brief demande de
préserver les URL.

**Question ouverte, honnêtement** : je ne peux pas distinguer « l'outil n'est pas
indexé » de « il est indexé mais jamais choisi ». C'est précisément ce que dirait
l'export « Indexation des pages ». Et je ne promets pas que différencier deux
descriptions fera apparaître la page — c'est une **hypothèse**, pas un résultat.

### Le générateur n'est plus derrière un mur — **note périmée corrigée**

Ma propre note de projet d'août affirmait : « `/generateur-qr-code` et
`/generateur-qr-code-wifi` exigent un compte connecté → `redirect("/auth/signup")`,
**perte SEO acceptée par le propriétaire** ». Un commentaire en tête de
`GeneratorClient.tsx` disait la même chose : « réservé aux comptes connectés — le mur
est posé côté page serveur ».

**Vérifié aujourd'hui, c'est faux** : aucun `redirect()` dans les deux `page.tsx`, les
deux URL répondent **200** en production, et le code dit lui-même « Ouvert à tous : un
visiteur anonyme peut générer ET télécharger un QR statique ». Le mur a été retiré
après coup.

**Conséquence** : la « perte SEO acceptée » n'a plus cours, et `/generateur-qr-code`
est à la **position 6,76** — la meilleure position hors-marque du site, sur sa seule
page qui fait quelque chose plutôt que de le raconter. Commentaire corrigé, note de
projet corrigée avec sa date.

### Brouillon prêt — `/qr-code/avis-google`

`docs/brouillons/qr-code-avis-google.md`. Sept sections, sourcées, dont une qui dit
franchement que **Google fournit son propre QR code d'avis gratuitement**
(support.google.com/business/answer/16816815) — fait vérifié que le visiteur
découvrira de toute façon. Le brouillon liste les trois décisions qui vous appartiennent
avant publication, et la seule modification de gabarit qu'il demanderait (un champ
optionnel `sections`, qui ne toucherait pas les 25 autres pages).

Rien n'est publié. Le brief demande un brouillon : c'est un brouillon.

---

## Ce qui manque pour aller plus loin

### Search Console — exports reçus, un seul manque

La propriété est vérifiée et **les exports ont été reçus le 5 octobre**, en deux lots :
Requêtes, Pages, Pays, Appareils, Graphique, Filtres, Apparence (vide), puis les liens
et trois tableaux de problèmes (vides). Tous analysés ci-dessus.

**Il en manque un, et c'est celui qui tranche** : l'export **« Indexation des
pages »** — Search Console › Indexation › Pages › *Exporter*, avec les URL
**non indexées** et leur **motif**.

C'est lui qui dira, pour les treize routes sans aucune impression, laquelle des deux
situations s'applique :

| Motif possible | Ce qu'il faudrait faire |
| --- | --- |
| « Détectée, actuellement non indexée » | attendre, ou renforcer le maillage interne |
| « Explorée, actuellement non indexée » | le contenu est jugé insuffisant → approfondir |
| « Page en double sans URL canonique » | un conflit de canonical à trouver |
| *indexée, mais zéro impression* | problème de sujet ou de concurrence, pas d'indexation |

Ces quatre motifs demandent quatre actions différentes. Les confondre ferait perdre
des semaines.

**Serait utile ensuite, pas indispensable** : deux périodes comparables de 3 mois
(pour comparer autre chose que des totaux), et l'export Pages × Requêtes des 20
premières pages si l'interface le propose.

### PageSpeed Insights — **non vérifié, quota**

`https://www.googleapis.com/pagespeedonline/v5/runPagespeed` répond **HTTP 429** sans
clé d'API. Lighthouse n'est pas installé dans le dépôt, et le brief interdit de
souscrire quoi que ce soit.

**Ce qu'il faut** : une clé d'API PageSpeed (gratuite), ou un passage manuel sur
`pagespeed.web.dev` pour cinq URL — `/`, `/creer`, `/qr-code/restaurant`,
`/guides/qr-code-dynamique-vs-statique`, et une page cliente publiée.

**Deux précautions**, que je ne contournerai pas :
- les données **terrain** (CrUX) n'existent que si le site reçoit assez de trafic ;
  leur absence ne veut pas dire que le site est lent, seulement qu'on ne sait pas ;
- un test **laboratoire** ne mesure pas l'INP réel. Le dire autrement serait faux.

### Keyword Planner, Trends, AnswerThePublic, Ubersuggest — **non vérifié**

Aucun accès depuis cet environnement. Je n'avancerai **aucun volume de recherche, aucun
classement et aucune estimation** tant que je n'ai pas de source. Google Trends, le jour
où il sera consulté, restera un indicateur **relatif** — pas une prévision.

---

## Prochaines actions, par impact et effort

| # | Action | Impact | Effort | État |
| --- | --- | --- | --- | --- |
| 1 | SEO-01 · canonical auto-référent sur les démonstrations | élevé | faible | **appliqué** |
| 2 | SEO-02 · `X-Robots-Tag: noindex` sur le HTML de `/q/*` | moyen | faible | **appliqué** |
| 3 | SEO-03 · description dérivée du contenu réel | moyen | faible | **appliqué** |
| 4 | SEO-09 · `noindex` sur les miroirs `*.vercel.app` | élevé | faible | **appliqué** |
| 5 | ~~Exports Search Console~~ | élevé | faible | **reçus et analysés le 5 oct.** |
| 5b | Export « Indexation des pages » (URL non indexées + motif) | moyen | faible | **vous** — plus bloquant depuis SEO-10 |
| 5c | SEO-11 · formulations contraires aux règles Google sur les avis | **élevé** | faible | **appliqué** (9 corrections + garde) |
| 5d | Brouillon `/qr-code/avis-google` (7 sections sourcées) | **élevé** | moyen | **prêt** — 3 décisions vous attendent |
| 5e | Vérifier si Google expose un décompte de scans de son QR d'avis | faible | faible | **vous** (une ligne du tableau comparatif) |
| 5f | SEO-12 · champ `sections` (lève le plafond de ~2 400 car.) | **élevé** | moyen | **appliqué**, déclaré par aucune page |
| 5g | SEO-13 · descriptions Wi-Fi dédoublonnées | faible | faible | **appliqué** |
| 5h | Rédiger le fond de `/qr-code/restaurant` (« réservation », position 51,6) | **élevé** | moyen | après validation du 1er brouillon |
| 5i | Rédiger le fond de `/guides/qr-code-avec-statistiques` | moyen | moyen | après validation du 1er brouillon |
| 6 | Clé PageSpeed ou cinq passages manuels | moyen | faible | **vous** |
| 7 | Trancher l'identité de l'éditeur → `/legal` entre à l'index | moyen | faible | **vous** (Q11 de l'audit produit) |
| 8 | Après déploiement : vérifier l'en-tête sur un miroir (commande ci-dessus) | — | faible | à faire |
| 9 | Après publication : comparer deux périodes Search Console | — | — | à planifier |

## Gardes du dépôt touchées

Deux gardes existantes épinglaient la forme exacte de ce que j'ai corrigé. Je les ai
**mises à jour en conservant leur intention**, jamais contournées :

| Garde | Ce qu'elle protégeait | Ce qu'elle vérifie maintenant |
| --- | --- | --- |
| `exemplesReels.test.ts` | « une démo n'est pas une fiche d'établissement » | les démos restent `noindex`, **et** leur canonical ne désigne plus une autre page |
| `seo.test.ts` | la description ne nomme pas le titulaire du compte | inchangé, plus le passage des blocs au repli |

## Ce que je n'ai pas fait, et pourquoi

- **Aucune nouvelle page métier.** Les quatre intentions du brief ont déjà la leur,
  avec du contenu distinct (SEO-07). En ajouter irait contre la consigne.
- **Aucun volume, aucun classement, aucune position** n'est avancé : je n'ai accès à
  aucune de ces sources.
- **Aucune donnée structurée ajoutée.** Celles qui existent sont valides (33/33 en
  ligne) et correspondent au contenu visible. Ajouter un `AggregateRating` ou un
  `Review` supposerait des avis que le produit n'a pas.
- **Pas de Yoast** — sans objet sur une application Next.js.
- **Google Business Profile** non traité : il suppose une éligibilité (établissement
  recevant du public ou zone de chalandise) que je ne peux pas constater d'ici.
- **Aucun déploiement**, aucune souscription.

**Sur la comparaison après publication.** Elle ne prouvera rien à elle seule. Une
variation de position dépend aussi des concurrents, des mises à jour de l'algorithme
et de la saison. Ce qu'on pourra affirmer : si une page passe d'« exclue » à
« indexée », c'est attribuable ; si son CTR bouge après un changement de description,
c'est plausible ; si la position moyenne bouge, ce n'est ni l'un ni l'autre.
