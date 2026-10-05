# Suivi de l'audit QRowg du 29 septembre 2026

Compagnon de `Qrowg_Audit_Reparation_2026-09-29.md`. Un ticket par ligne, sa preuve
ou son blocage. À relire en premier pour reprendre le travail.

## Prochaine action

**Q22 — le dernier ticket réalisable sans vous.** Relier chaque guide à une action
existante, puis contrôler canonical / robots / sitemap / données structurées sur la
version livrée. L'audit note que son propre échec de récupération du sitemap « ne
constitue pas la preuve d'un sitemap absent » : c'est donc à vérifier, pas à réparer
d'avance.

**Une chose attend une décision de votre côté** : la première purge de rétention
effacera l'historique brut de plus de 400 jours au prochain déploiement.
`SCAN_IP_SALT` est défini depuis le 29 septembre (cible Production).

## Repères de la session

| Élément | Valeur |
| --- | --- |
| Branche | `main` |
| Révision au départ | `4089f187` — « v206 — la garde clavier ne dénonce plus l'overlay du serveur de développement » |
| `origin/main` au départ | `4089f187` — identique au local |
| Production Vercel | déploiement `dpl_BgA4ed6sM1SEsCNXxhigrSt7SBZU`, state READY, commit **`4089f187`** |
| Écart local ↔ déployé | **aucun au départ** (voir ci-dessous) |
| Travail en cours préservé | `social-a-deposer/**`, `DEPOT-MAINTENANT.cmd` — jamais touchés |
| Commandes du dépôt | `npm run test` · `npm run type-check` · `npm run build` · `npx playwright test` |
| Tests au départ | 6482 verts (mémoire de projet) |
| Tests à l'arrivée | **6575 verts / 6575**, 411 fichiers |
| `npm run build` | **réussi** (exit 0), 186 pages générées |
| Scénarios navigateur ajoutés | **46 verts / 46**, desktop ET mobile 390 px (6 ignorés par leur propre condition) |
| Seul échec navigateur restant | `journey.spec.ts` (parcours authentifié) — Supabase répond NXDOMAIN, voir Q24 |
| Rien n'est déployé | les corrections de cette session ne sont PAS en ligne |

### L'écart local / déployé annoncé par l'audit n'existait déjà plus

L'audit (§2) constate que le site déployé montrait encore les symptômes Q02/Q03/Q15
alors que le rapport local annonçait les corrections. C'était vrai **au moment de
l'audit** : celui-ci a été mené dans la matinée du 29 septembre, et les correctifs
ont été mis en ligne dans la foulée. L'historique Vercel le date :

| Commit | Contenu | Production |
| --- | --- | --- |
| `a9197509` v201 | avant les corrections de galerie | 28/09 |
| `0dd4dda5` v202 | classement unique, miniatures réelles, aperçu réparé | 29/09 |
| `42fada75` v203 | QA sur le site en ligne | 29/09 |
| `00a05585` v204 | retour du focus, une seule implémentation | 29/09 |
| `20596e01` v205 | 22 tests rouges = Windows, pas le produit | 29/09 |
| `4089f187` v206 | garde clavier | 29/09, **déploiement courant** |

Q02, Q03 et Q15 ont donc été **vérifiés en ligne** plutôt que réécrits.

## Tableau des tickets

| Ticket | Prio | Statut | Preuve / blocage |
| --- | --- | --- | --- |
| Q01 Historique initial du brouillon | P0 | **corrigé + vérifié** | 3 scénarios navigateur, rouges avant / verts après |
| Q02 Classement, recherche, compteurs | P1 | **déjà corrigé (v202), vérifié EN LIGNE** | 45/45 sur qrowg.com |
| Q03 Focus et position des aperçus | P1 | **déjà corrigé (v202/v204), vérifié EN LIGNE** | idem |
| Q04 Utiliser exactement le modèle choisi | P1 | **corrigé + vérifié** | 3 scénarios navigateur + 20 gardes |
| Q05 Liens des pages métiers | P1 | **corrigé + vérifié** | 4 scénarios navigateur |
| Q06 Prix annuels et remises | P1 | **corrigé + vérifié** | 3 scénarios navigateur, rouges avant |
| Q07 Droits par forfait cohérents | P1 | **corrigé** | comparatif dérivé + 14 gardes |
| Q08 Export QR sans rupture | P1 | **corrigé + vérifié** | 4 scénarios navigateur, dont un fichier réellement téléchargé |
| Q09 Libellés de champs | P1 | **partiellement corrigé + vérifié** | 31 champs repris ; 40 restants sous cliquet |
| Q10 `id="contenu"` dupliqué | P1 | **corrigé + vérifié** | 3 scénarios navigateur |
| Q11 Identité du responsable (`/legal`) | P1 | **bloqué** | donnée que seul le propriétaire détient — voir « Ce qui manque » |
| Q12 Lien ODR obsolète | P1 | **corrigé** | lien mort retiré, 3 gardes |
| Q13 Localisation de l'hébergement | P1 | **corrigé** | promesse bornée à l'inventaire, 6 gardes |
| Q14 Traceurs et mesure | P1 | **corrigé + vérifié** | 8 scénarios navigateur + 21 gardes ; 2 défauts réels trouvés |
| Q15 Miniatures représentatives | P2 | **déjà corrigé (v202), vérifié EN LIGNE** | 3 scénarios sur qrowg.com |
| Q16 Identité et navigation | P2 | non commencé | demande une session connectée (Q24) |
| Q17 Alignement et densité de la galerie | P2 | **déjà corrigé (v202), vérifié EN LIGNE** | « titre, recherche, filtres et grille partent du même bord » + homonymes |
| Q18 Organisation des commandes | P2 | non commencé | — |
| Q19 Textes et états | P2 | **corrigé + vérifié** | 7 scénarios navigateur + 12 gardes ; 18 accords faux sur 19 |
| Q20 Promesses sur les visiteurs | P2 | **corrigé** | source unique `ceQueMesureLeProduit`, 15 gardes |
| Q21 Diagnostic ≠ garantie (testeur QR) | P2 | **corrigé** | verdict proportionné + essai papier nommé |
| Q22 Pages métiers et guides | P2 | non commencé | — |
| Q23 Build de la révision livrée | P1 | **fait** | `npm run build` exit 0, 186 pages ; type-check 0 erreur ; 6575 tests verts |
| Q24 Parcours connecté | P1 | **bloqué** | le projet Supabase de `.env.local` n'existe plus (NXDOMAIN) |
| Q25 Paiements et forfaits | P1 | **bloqué** | aucun environnement Stripe de test configuré ici |
| Q26 Permissions et RLS | P1 | non commencé | revue de code possible ; essais A/B impossibles sans base |
| Q27 Mobile et clavier | P1 | partiel | le projet `mobile` de Playwright a tourné sur la galerie en ligne (9 scénarios) |
| Q28 Performance | P2 | non commencé | — |
| Q29 Impression et domaines | P2 | non commencé | — |
| Q30 Définition des compteurs | P2 | **corrigé** | définitions publiées sous les chiffres |

---

## Lot 1 — Q01 · Historique initial du brouillon · P0 · **corrigé + vérifié**

**Reproduit.** Oui, à l'identique du scénario de l'audit, et automatiquement :
`e2e/builder-annuler-brouillon.spec.ts` sème un brouillon de 10 blocs nommé
« Bistrot français » (exactement ce que `/creer` écrit dans `qrowg_draft_v1`),
ouvre `/dashboard/builder?draft=1`, renomme, puis clique sur Annuler. Avant
correction, le champ du nom repassait à **« Ma Page »** — le symptôme décrit.

**Cause confirmée dans le code** (l'audit la donnait comme hypothèse).
`BuilderV4.tsx` monte avec un squelette de démonstration (`INITIAL_BLOCKS`, 3 blocs,
« Ma Page ») et `useUndoRedo` en fait son unique passé. `applyDraft()` posait
ensuite le document du visiteur avec les setters **bruts** sans jamais appeler
`undoRedo.reset()`. La première modification empilait donc le document
**au-dessus** du squelette, et la première annulation redescendait dessus.

**Deux chemins voisins portaient le même défaut**, non signalés par l'audit : le
brouillon **repris après inscription** (un client venant de créer son compte pouvait
perdre sa page de la même façon), et la **renumérotation** des identifiants de blocs
(l'historique gardait les anciens, et l'upsert en aurait créé des doubles).

**Correction.** Un geste unique, `hydrater(snapshot)`, pose blocs + thème + nom **et**
réinitialise l'historique. Les quatre entrées de document y passent. Le moteur
d'historique a été extrait de React (`creerHistorique`) pour que le scénario soit
rejouable en test. Défaut antérieur corrigé au passage : `undo()`/`redo()` rendaient
l'entrée **par référence**, si bien qu'une modification sur place de l'état restauré
aurait réécrit le passé.

| Contrôle | Avant | Après |
| --- | --- | --- |
| `npx playwright test e2e/builder-annuler-brouillon.spec.ts --project=desktop` | **3 échecs** — attendu « Bistrot français », reçu « Ma Page » | **3 réussites** (55,5 s) |
| `…/annulerNeRemplacePasLaPage.test.ts` | le 1er test documente le symptôme | 10 réussites |

**Fichiers** : `builderHooks.ts`, `BuilderV4.tsx`, `builderConstants.ts`,
`annulerNeRemplacePasLaPage.test.ts` (nouveau), `e2e/builder-annuler-brouillon.spec.ts` (nouveau).

**Non couvert** : la sauvegarde côté **compte connecté** (le chemin a été corrigé et
relu, mais pas exécuté — voir Q24).

**Note de dépôt.** `testsDeterministes.test.ts` tient un cliquet de taille sur
`BuilderV4.tsx` (3050 lignes). La correction l'a fait passer à 3056. Le plafond n'a
**pas** été relevé : les constantes de tête ont rejoint `builderConstants.ts`, qui est
leur place déclarée — 3042 lignes.

## Lot 2 — Q02, Q03, Q15, Q17 vérifiés en ligne · Q04 et Q05 corrigés

### Q02 / Q03 / Q15 / Q17 — vérifiés sur qrowg.com, pas réécrits

`PROD_URL=https://qrowg.com npx playwright test e2e/galerieDeModeles.spec.ts --config=playwright.prod.config.ts`
→ **45 réussites, 9 ignorés, 0 échec** (1,8 min), sur desktop **et** mobile 390 px.

Les critères exacts de l'audit sont couverts et passent en ligne : « Bar » affiche
les deux bars, « Café » le Coffee shop, « Restaurant » le Bistrot français ;
`cafe`, `café` et `CAFÉ` donnent le même ensemble ; `cocktail` et `plombier`
trouvent par synonyme ; le compteur d'une chip vaut le nombre de cartes qu'elle
affiche ; l'aperçu s'ouvre en haut, deux fois de suite, sans focus dans la maquette
et en restant défilable ; les miniatures montrent le vrai contenu ; titre,
recherche, filtres et grille partent du même bord ; les modèles homonymes se
distinguent, y compris sur mobile.

### Q04 — le modèle choisi voyage avec le visiteur · **corrigé + vérifié**

**Cause confirmée.** `/examples/resto_bar` → « Utiliser » appelait
`creerUrlSecteur(SECTEUR_PAR_MODELE[tpl.key])`, qui ne produit qu'un rayon :
`/creer?metier=Bar`. Le choix exact n'était nulle part.

**Correction.** `creerUrlModele(cle, secteur)` dans `creer/entry.ts` (module pur) :
`/creer?modele=resto_bar&metier=Bar`. La galerie lit `?modele=`, valide la **forme**
côté lien et l'**existence** contre son propre catalogue, applique le **même contrôle
de forfait** qu'un clic sur la carte (`canUse` → `planRequis`), et n'ouvre rien tant
que le forfait n'est pas connu. Un identifiant inconnu ne fait rien : la galerie
reste la galerie. Les anciens liens par rayon fonctionnent à l'identique.

| Contrôle | Avant | Après |
| --- | --- | --- |
| `…/leChoixDuVisiteurSuit.test.ts` | **18 échecs** sur 20 | 20 réussites |
| `npx playwright test e2e/choixDuModeleConserve.spec.ts` | — | **7 réussites** |

### Q05 — chaque page par usage mène là où elle promet · **corrigé + vérifié**

Trois destinations corrigées dans la source unique `METIER_BY_USAGE` :

| Usage | Avant | Après | Pourquoi |
| --- | --- | --- | --- |
| `artisan` | Consultant | **Artisan** | le rayon « Artisan & Services » existe depuis v202 |
| `garage` | Consultant | **Artisan** | dépannage, devis, prestations : même famille |
| `association` | *(absent)* | **Association** | le rayon ET le modèle existaient, rien ne les reliait |
| `hotel`, `camping` | Restaurant | **modèle `studio_gite`** + rayon Immobilier | « Gîte & chambre d'hôtes » est le modèle d'hébergement du catalogue |

Nouvelle carte `MODELE_BY_USAGE`, volontairement courte : un usage n'y entre que si
un modèle précis répond mieux que le meilleur rayon. Le Wi-Fi garde sa destination
dédiée. Les usages transversaux (avis Google, WhatsApp, SMS, PDF, paiement) restent
sans modèle imposé — en choisir un serait une invention.

**Gardes mises à jour, pas contournées** : `exemplesReels.test.ts` et
`publicFunnel.test.ts` épinglaient l'ancienne expression ; leur intention est
conservée, leur attente suit le nouveau lien.

## Lot 3 — Q06, Q07, Q08

### Q06 — deux pages, deux factures annuelles · **corrigé + vérifié**

**Cause confirmée.** `priceAnnual` stockait un **équivalent mensuel** (12,42) et les
deux écrans reconstruisaient la facture en le multipliant par douze — avec deux
arrondis d'affichage différents : `149,04 €` sur l'accueil, `149 €` sur l'abonnement.
La facture, elle, vaut 149 €.

**Correction.** Le sens de lecture est inversé : `priceAnnualTotal` (149, 490) est
stocké, `priceAnnual` en est **dérivé** (`PLANS` recalcule le champ, il ne peut plus
diverger). Nouveau moteur pur `lib/tarifs.ts` : `mensuelEquivalent`,
`economieAnnuelle`, `remisePourcent`, `moisOfferts`, `remiseMaxPourcent`, `fmtEuros`.

Deux chiffres écrits à la main deviennent calculés :

| Affirmation | Avant | Après (calculé) |
| --- | --- | --- |
| Badge de la page d'abonnement | « -20 % » pour tous | **« jusqu'à −34 % »** (34 % / 16 % selon le plan) |
| Badge de l'accueil | « Jusqu'à 2 mois offerts » | **« Jusqu'à 4 mois offerts »** (79 € ÷ 19 € = 4,1 mois) |

Le **courriel d'abonnement** annonçait « 12,42 €/mois » à quelqu'un dont la banque
affichera 149 € : il donne maintenant le montant et la période réels. Le **profil**
ajoute « 149 € prélevés une fois par an » à sa ligne de facturation.

| Contrôle | Avant | Après |
| --- | --- | --- |
| `npx playwright test e2e/prixAnnuelCoherent.spec.ts` | **3 échecs** — accueil : `["149,04", "489,96"]` | **3 réussites** |
| `lib/tarifs.test.ts` | — | 19 réussites |

### Q07 — une capacité, un sens · **corrigé**

**Cause confirmée.** `PLAN_COMPARISON` était écrit à la main, à côté des capacités
qu'il décrit. Cinq écarts mesurés :

| Ligne | Ce que disait le tableau | Ce que dit le produit |
| --- | --- | --- |
| Atelier d'impression | « — » en gratuit | `caps.printStudio === true`, et la carte l'annonce |
| Export HD | « PNG + **JPG** + PDF HD + SVG » | aucun plan n'exporte de JPG ; le PNG transparent et le WEBP existent et n'étaient pas annoncés |
| Modèles | « 27 gratuits » | **40 sur 48** |
| Marque blanche | réservée à Multi-sites | preuve déclarée `caps.removeBranding`, que l'Établissement possède aussi |
| IA | « ✓ illimité » pour Multi-sites | aucun champ ne compte les générations |
| Support | « Prioritaire » sur les plans payants | aucune occurrence dans le produit : un seul formulaire de contact |

**Correction.** Les 19 lignes sont **dérivées** des limites et capacités. Aucune
cellule n'est saisie. Le décompte des modèles est écrit une fois (`MODELES_GRATUITS`)
et **recompté** sur les deux sources par la garde. Aucune ligne n'a été supprimée.

`lib/droitsCoherents.test.ts` : 14 gardes, dont une qui vérifie que chaque cellule
booléenne correspond exactement à la capacité du plan.

**À décider par le propriétaire** : « Support prioritaire » est devenu « Par e-mail »
pour les trois plans, parce que rien ne le distinguait. Le remettre demande d'abord
de le tenir.

### Q08 — le téléchargement s'arrêtait sur un mur · **corrigé + vérifié**

**Cause confirmée** sur `/dashboard/qr-link` : `if (res.status === 401) {
window.location.href = "/auth/login" }` — rien ne prévenait avant le clic, aucune
destination de retour, et la composition (type, contenu, couleurs, style) était perdue.

**Correction**, sur les trois manques :
1. le bouton annonce l'étape (« Créer un compte pour télécharger ») dès que la
   session est **connue** absente — pas avant, pour ne pas l'afficher à un abonné ;
2. un geste unique `allerSIdentifier()` **range d'abord** la composition dans le
   brouillon local, puis part ;
3. il donne à la connexion un chemin de retour **interne** (`/dashboard/qr-link?reprise=1`),
   que l'application revalide de son côté ; au retour, l'écran se recompose et
   consomme le paramètre.

**Le générateur public, lui, tenait déjà son contrat** : sans compte et en statique,
il n'appelle pas le serveur du tout. Vérifié par un **fichier réellement téléchargé**
dans le navigateur. Son seul manque — un 401 sans retour, atteignable seulement si
la session expire en cours de route — est corrigé.

| Contrôle | Résultat |
| --- | --- |
| `npx playwright test e2e/exportQrSansRupture.spec.ts` | **4 réussites** |
| `…/exportSansRupture.test.ts` | 12 réussites |

**Note de dépôt.** Le cliquet de taille de `qr-link/page.tsx` (1000 lignes) a été
tenu en extrayant vers `qrLinkUtils.ts` l'étiquette d'un QR, qui y était écrite
**deux fois** — et dont les deux versions ne traitaient pas pareil une valeur vide
(l'historique affichait « 📶 » ou « 👤 » tout seuls). 986 lignes.

## Lot 4 — Q09, Q10

### Q10 — identifiant dupliqué dans le calculateur · **corrigé + vérifié**

`<main id="contenu">` (la cible du lien d'évitement, convention de tout le site) et
`<select id="contenu">` cohabitaient. Le `<label htmlFor="contenu">` visait donc le
`<main>`, et le sélecteur s'annonçait sans nom. Le sélecteur porte désormais
`taille-contenu`. Vérifié au navigateur : aucun identifiant en double sur la page
rendue, `#contenu` est bien le `<main>`, et cliquer l'intitulé place le focus sur le
sélecteur.

### Q09 — des champs qui disent leur nom · **partiellement corrigé + vérifié**

La garde existante `nomQuiDesigne.test.ts` vérifie qu'une `<label>` posée sur un
champ le désigne — et elle est verte. Elle ne voyait pas le cas de l'audit : un champ
**sans étiquette du tout**, dont le seul nom est son exemple de valeur.

**31 champs repris** :

| Écran | Repris | Ce que c'était |
| --- | --- | --- |
| `/dashboard/qr-link` | 15 | le champ de lien n'avait qu'un `<p>` au-dessus ; les 14 autres (Wi-Fi, fiche contact, e-mail) n'avaient que leur exemple |
| Réglages de style de l'éditeur | 15 | dont les champs hexadécimaux que l'audit cite |
| `/outils/taille-qr-code` | 1 | voir Q10 |

Deux sélecteurs de couleur annonçaient littéralement **« label »** — la chaîne, parce
qu'un `aria-label="label"` avait perdu ses accolades.

**40 champs restent sans nom**, sur des écrans que l'audit ne cite pas : l'atelier
d'impression (15), le QR Studio (7), le profil (4), la fenêtre d'assistant (3), et
onze autres écrans. Ils ne sont **pas** corrigés en aveugle : chaque nom demande de
comprendre ce que le champ règle. Un cliquet les compte
(`components/ui/champQuiSeNomme.test.ts`) et interdit d'en ajouter.

| Contrôle | Résultat |
| --- | --- |
| `npx playwright test e2e/champsQuiSeNomment.spec.ts` | **6 réussites** |
| `champQuiSeNomme.test.ts` | 4 gardes, dont « les écrans repris n'en laissent plus aucun » |

---

## Lot 5 — Q12, Q13, Q14, Q19, Q20, Q21, Q30

### Q12 — un recours qui n'existait plus · **corrigé**

`/legal` renvoyait vers `ec.europa.eu/consumers/odr`. La Commission européenne a
arrêté la plateforme le **20 juillet 2025** : le lien ne menait plus nulle part.
La section devient « Réclamations », garde la voie de contact, et dit ce qui s'est
passé au lieu de se taire.

**Ce qui n'est PAS fait, volontairement** : désigner un médiateur de la consommation.
L'obligation, son périmètre et le médiateur retenu dépendent du statut réel de
l'éditeur — la même donnée qui manque à Q11. Écrire un nom sans convention signée
serait une fausse promesse de recours. Une garde refuse qu'on en invente un.

### Q13 — la promesse d'hébergement dépassait l'inventaire · **corrigé**

L'accueil affichait « Hébergé en Europe », la description de `/security` répétait
« hébergement en Europe », et les données structurées aussi. Or `lib/editeur.ts`,
l'inventaire du dépôt, dit déjà noir sur blanc que **la base est en `eu-west-1`
(Irlande) et l'application en `iad1` (Washington)** — et `/security` l'écrit trois
paragraphes plus bas. Ce sont les phrases courtes qui ne lisaient pas l'inventaire.

**Correction.** `reassuranceHebergement()` borne la promesse à ce qui est vérifié —
« Données hébergées dans l'Union européenne » — et dépend d'un drapeau explicite
`donneesDansUE`, pas d'un texte figé. L'accueil et les données structurées l'appellent.
La description de `/security` reste écrite en toutes lettres (la garde SEO mesure sa
longueur dans le fichier) et une garde vérifie qu'elle ne diverge pas.

**L'audit n'a pas inspecté les régions de production, et moi non plus** : je n'ai rien
changé à l'infrastructure. J'ai aligné les textes sur l'inventaire que le dépôt tenait
déjà. Si vous voulez pouvoir promettre l'Europe pour tout, il faut d'abord déplacer les
fonctions Vercel (Settings › Functions › `cdg1`), puis corriger `HEBERGEMENT.application`.

### Q14 — les traceurs, et ce que la politique en dit · **corrigé + vérifié**

**Bonne nouvelle d'abord : la politique publiée est exacte.** En la comparant ligne
à ligne au code, elle décrit précisément ce qui est enregistré — horodatage,
appareil, système, navigateur, pays et ville, source et paramètres de campagne,
identifiant de session, empreinte pseudonymisée. Elle qualifie même correctement ces
données de « données à caractère personnel au sens du RGPD », ce que beaucoup de
politiques évitent de faire.

**Vérifié dans un vrai navigateur** (`e2e/traceursConformes.spec.ts`, 8 scénarios) :
sur `/`, `/creer`, `/generateur-qr-code` et `/privacy`, **aucun domaine non déclaré
n'est contacté**, aucun cookie de mesure n'est posé, Vercel Analytics est bien sans
cookie, l'identifiant de session ne survit pas à l'onglet, et rien de personnel
n'est écrit dans le stockage du visiteur.

**Deux défauts réels trouvés, tous deux corrigés.**

#### 1. Le « sel secret » ne l'était pas

La politique écrit : *« hachage SHA-256 de l'adresse IP, du navigateur et d'un sel
secret »*, et *« l'adresse IP […] ne peut pas être reconstituée à partir de
l'empreinte »*.

Or la redirection calculait ce hachage avec
`process.env.SCAN_IP_SALT ?? "qrowg-scan-v1"` — et **`SCAN_IP_SALT` n'est pas
défini dans les variables du projet en production** (vérifié). Le sel était donc la
constante écrite en clair dans ce dépôt.

Pourquoi c'est sérieux : la politique RLS `Lecture scans propres` laisse chaque
propriétaire de page lire SES scans, `ip_hash` compris — et les colonnes `os` et
`browser` de la même ligne réduisent les navigateurs candidats à une poignée.
Retrouver l'adresse revenait à parcourir les adresses IPv4 : quelques minutes.
**Un client pouvait dés-anonymiser les visiteurs de son propre QR code.**

Correction (`lib/empreinteDeScan.ts`, module pur, 13 gardes) : `SCAN_IP_SALT` reste
le réglage prévu ; à défaut on se rabat sur un secret serveur déjà présent, qui ne
sort jamais de la machine ; **et sans aucun secret, on n'écrit plus d'empreinte du
tout**. Le compte de visiteurs uniques devient approximatif — moindre mal comparé à
une adresse retrouvable. La phrase de la politique redevient vraie.

#### 2. Les 400 jours n'étaient jamais appliqués

La politique promet que les données de mesure sont *« conservées 400 jours […] puis
supprimées automatiquement »*. La route qui les supprime existait, complète,
protégée par le contrôle d'entrée commun, couvrant les quatre tables
d'événements — mais elle n'était **pas planifiée**. Son propre en-tête le disait :
« N'est PAS planifié par défaut ». Rien n'effaçait rien.

Correction : `/api/cron/prune-events` est ajouté à `vercel.json`, le dimanche à 4 h
— la cadence que le fichier recommandait lui-même. `lib/dureeQuiSApplique.test.ts`
(8 gardes) relie désormais la durée annoncée au cron réellement planifié.

La planifier a réveillé une garde existante — `crons.test.ts` exige que **toute
tâche planifiée laisse une trace**. C'est une bonne règle, et plus encore pour une
tâche destructive : sans journal, personne ne peut dire ce qu'elle a effacé, ni même
si elle est passée. La route journalise donc son passage (`ok` / `rien` / `erreur`),
avec la date de coupure et le nombre de lignes supprimées.

Une seconde garde de ce fichier a dû être assouplie, et je le signale parce que
c'est le genre de geste qui mérite d'être justifié : elle exigeait que **chaque**
tâche assemble une liste d'erreurs passée par `sansAdresses`. C'était vrai tant
qu'elles envoyaient toutes des emails ; la purge, elle, n'approche aucune adresse.
La règle est conservée là où elle s'applique, et une assertion supplémentaire vérifie
qu'elle s'applique encore quelque part — pour qu'elle ne puisse pas devenir muette.

> ⚠️ **À savoir avant de déployer** : la première exécution effacera d'un coup tout
> l'historique brut antérieur à 400 jours. Les compteurs cumulés ne sont pas
> touchés. Rien ne s'exécute tant que vous n'avez pas déployé.

### Q20 / Q30 — la mesure dit enfin ce qu'elle mesure · **corrigés**

**Ce que l'audit reprochait.** L'accueil promettait « Sachez exactement qui scanne »
et la grille tarifaire « Voyez qui scanne, quand et avec quoi », alors que la mesure
est agrégée (Q20). Et « Vues », « Visites », « Scans », « Scans QR » désignaient
parfois la même chose d'un panneau à l'autre, sans qu'aucune définition existe (Q30).

**Ce que j'ai trouvé en ouvrant les deux chemins d'écriture** — et qui corrige une
première version fausse de mon propre travail :

| Chemin | Ce qui est enregistré |
| --- | --- |
| `/api/track` (une **vue**) | pays, source, référent, famille d'appareil, identifiant de session |
| `/q/<code>` (un **scan**) | tout cela, **plus** la ville, le système, le navigateur, les paramètres de campagne et un `ip_hash` |

Cet `ip_hash` est l'empreinte SHA-256 de (adresse IP + navigateur + sel). C'est une
**pseudonymisation, pas une anonymisation** : elle ne rend pas l'adresse, mais elle
distingue durablement un appareil. La page Confidentialité le décrivait déjà
correctement — c'est la vitrine qui se trompait, dans les deux sens : elle promettait
de savoir qui, et taisait ce qu'elle garde vraiment.

**Correction.** Un module pur, `lib/ceQueMesureLeProduit.ts`, tient désormais :
la liste de ce qui est écrit (avec la mention « au scan seulement » quand c'est le
cas), la liste de ce qui ne l'est pas, les trois phrases de vitrine, et la définition
de chaque compteur avec sa limite. L'accueil, la grille tarifaire, l'export et le
nouveau panneau `DefinitionsPanel` lisent tous cette source.

| Avant | Après |
| --- | --- |
| « Sachez exactement qui scanne » | « Voyez d'où viennent vos scans » |
| « Voyez qui scanne, quand et avec quoi » | « Scans et vues par jour, source, appareil, ville et pays » |
| export « Visites » / ailleurs « Vues » | un seul mot, `COMPTEURS.vues.nom` |
| aucune définition | « Scans », « Vues », « Clics », « Sessions » définis, avec leur limite, sous les chiffres |

La définition de « Scans » dit maintenant textuellement ce que l'audit demandait :
*« Nous comptons une requête, pas une caméra. »*

`lib/mesureQuiSeDefinit.test.ts` — 15 gardes, dont deux qui comparent les listes au
code qui écrit réellement : toute dimension annoncée doit exister dans un insert, et
aucun insert ne doit porter un champ d'identité.

### Q21 — un diagnostic n'est pas une garantie · **corrigé**

Deux affirmations dépassaient ce que l'outil mesure :

1. **« Ce code est prêt à imprimer. »** L'outil analyse un FICHIER — contraste,
   taille de module, marge, contenu. Il ignore la taille du tirage, la distance de
   lecture, le papier et l'encre. Le verdict devient « Ce code se lit, et rien ne
   bloque l'impression », et l'essai qui reste est **nommé à côté du verdict**, plus
   enfoui dans l'aide : imprimer un exemplaire à la taille et à la distance prévues,
   et le scanner.
2. **« Le téléphone ouvrira la page sans avertissement de sécurité. »** Déduit du
   seul préfixe `https://`. L'outil ne contacte aucun serveur : il ne vérifie ni le
   certificat, ni que la page répond. Le constat le dit, et propose d'ouvrir
   l'adresse une fois avant d'imprimer.

Les trois gardes qui épinglaient « prêt à imprimer » ont été **reformulées, pas
supprimées** : elles vérifient maintenant que cette promesse ne revient pas.


### Q19 — le produit s'accorde, et vouvoie · **corrigé + vérifié**

**La faute d'accord était systématique.** Le bandeau d'arrivée de la galerie écrivait
« Ceux de la » suivi du libellé de secteur nu. Sur dix-neuf secteurs, **dix-huit**
en sortaient faux :

| Secteur | Avant | Après |
| --- | --- | --- |
| Bar | Ceux de la **bars** | Ceux **des** bars |
| Immobilier | Ceux de la **immobilier** | Ceux **de l'**immobilier |
| SaaS | Ceux de la **SaaS** | Ceux **du** SaaS |
| Sport | Ceux de la **sport et remise en forme** | Ceux **du sport et de la** remise en forme |
| Restaurant | Ceux de la restauration | *(inchangé — le seul juste)* |

C'est « restauration » qui explique que personne ne l'ait vu : c'est le **premier**
secteur de la liste, et le seul que la formule accorde. Un article ne se devine pas
d'un nom — genre, nombre et élision ne se calculent pas en français. Les dix-neuf
formes complètes sont donc écrites une fois dans `SECTEUR_DE`, et une garde vérifie
qu'aucune n'est oubliée ni inventée.

**Le décompte qui allait avec était faux aussi.** La phrase annonçait « puis les 47
autres » — soit 48 moins UN, en supposant qu'un seul modèle appartienne au secteur.
Depuis que le classement est réparé (Q02), « Bar » en compte trois : les deux bars
et « Restaurant & Bar ». Le nombre est désormais dérivé du compteur de secteur, et
son pluriel passe par la fonction commune.

**Le contact vouvoie.** « Merci pour ton message […] vers toi », « tu acceptes »
deviennent « votre message […] vers vous », « vous acceptez ».

**Ce que je n'ai PAS touché, et pourquoi :**

- Le message de parrainage tutoie (« Rejoins QRowg… Crée ta première page »). Ce
  n'est pas le produit qui parle : c'est l'utilisateur qui écrit à un proche, et le
  tutoiement y est le registre normal. J'ai corrigé ce qui était fautif — les
  accents manquants, « Cree ta premiere ».
- Les quatorze pluriels assemblés à la main (`> 1 ? "s" : ""`). Ils sont **dupliqués,
  pas faux** : en français, 0 et 1 prennent le singulier, ce que `> 1` donne
  correctement. Les router vers `compte()` serait un remaniement sans défaut.
- Les avertissements de publication. L'audit leur reproche « un vocabulaire interne
  au produit » ; en les lisant, ils sont déjà en français clair et actionnable
  (« Votre page garde l'adresse créée automatiquement. Choisissez une adresse à vous
  pour qu'elle soit proposée à Google. »). Corrigé dans un lot antérieur.
- Les cinq états demandés — en cours, réussie, erreur, restriction, absence de
  résultat — sont **déjà distincts** : `resolveSaveStatus` leur donne à chacun un
  genre, un libellé et un ton différents. Vérifié plutôt que réécrit.

### Q22 — les guides mènent quelque part, et le référencement est contrôlé · **corrigé + vérifié en ligne**

#### La destination des guides était devinée

Sur douze guides, **dix** ne déclaraient pas où mène leur bouton : la route la
déduisait du LIBELLÉ, par une expression régulière sur « dynamique|statistiques ».
Le commentaire du code disait déjà pourquoi c'était fragile — deviner avait envoyé
« Créer mes supports imprimables » vers le générateur de QR.

Les douze déclarent maintenant leur destination, et le champ est devenu
**obligatoire** : le repli a disparu avec lui, TypeScript refuse un guide sans lien.

Deux atterrissaient à côté d'un outil qui existait pourtant. Ce sont les seules
modifications éditoriales que je me suis permises, parce que le libellé devait
suivre la destination :

| Guide | Avant | Après |
| --- | --- | --- |
| `taille-qr-code-impression` | « Générer un QR code prêt à imprimer » → générateur | « Calculer la taille de mon QR code » → **`/outils/taille-qr-code`** |
| `qr-code-scannable` | « Générer un QR code scannable » → générateur | « Tester mon QR code » → **`/outils/testeur-qr-code`** |

#### Le contrôle que l'audit laissait ouvert

L'audit écrivait : « Les erreurs de récupération du sitemap pendant cet audit ne
constituent pas la preuve d'un sitemap absent : ce point reste à contrôler. »

`e2e/refQuiTientEnLigne.spec.ts` fait ce contrôle, et se lance **sur la version
livrée** :

    PROD_URL=https://qrowg.com npx playwright test e2e/refQuiTientEnLigne.spec.ts --config=playwright.prod.config.ts

Il vérifie le sitemap (répond, en XML, adresses absolues du bon hôte, aucune zone
privée, et les pages annoncées répondent vraiment), le `robots.txt`, puis pour
chaque famille de pages publiques : code 200, un seul canonical absolu et
auto-désignant, pas de `noindex`, un titre, une description, un seul H1. Et il
contrôle que les données structurées se parsent.

**Résultat du premier passage : 27 réussites, 5 échecs — et les cinq étaient mes
tests, pas le produit.**

| Ce que j'avais écrit | Ce que le site fait vraiment |
| --- | --- |
| « `/legal` ne doit pas être en noindex » | elle l'est **exprès**, tant que l'identité de l'éditeur manque (Q11). Le garde-fou est donc actif en production. |
| « chaque bloc JSON-LD porte un `@type` » | l'accueil emploie `@graph`, construction valide de schema.org : les types sont sur les nœuds |
| trois zones privées chargées dans un navigateur | elles attendent une session qui ne vient pas — le test expirait sans rien mesurer. Elles se contrôlent par requête. |

La mesure a été corrigée dans les trois cas, et `/legal` n'est pas ignorée pour
autant : elle a désormais sa propre garde, qui vérifie qu'elle reste hors index ET
hors sitemap tant qu'elle est incomplète.

**Second passage : 33 réussites, 0 échec, sur qrowg.com.** Le sitemap, le
`robots.txt`, les canonical, les titres, les descriptions, les H1 et les données
structurées du site livré sont corrects. C'est la réponse à la question que l'audit
laissait explicitement ouverte.

Une garde du dépôt est devenue obsolète au passage : elle vérifiait que la route des
guides appelle `creerUrl()` — ce qu'elle ne faisait que dans le repli supprimé. Elle
vérifie maintenant l'intention, et mieux : **chaque guide pointe vers une route qui
existe**, et plusieurs mènent toujours à l'essai.

## Trouvé en route, hors périmètre de l'audit

**Deux champs « Nom de la page » sur téléphone.** En prouvant Q01 sur le projet
mobile de Playwright, le sélecteur a buté sur deux éléments : la barre historique de
l'éditeur ET la coquille mobile rendent chacune leur champ de nom, avec le même nom
accessible, en même temps, à 390 px. Les deux sont liés au même état — ce n'est donc
pas un défaut de données — mais un lecteur d'écran entend deux fois « Nom de la
page » sans pouvoir les distinguer, et l'écran affiche deux fois le même contrôle.

Ce n'est **pas corrigé ici** : la barre est masquée sur mobile uniquement en mode
aperçu plein écran, et la démasquer autrement demande une décision de mise en page
que je ne peux pas valider sans vous. Cela relève de Q16 (identité et navigation
dupliquées) et Q18 (organisation des commandes de l'éditeur).

## Ce qui manque, et qu'il faut demander

Aucune de ces données n'a été inventée.

0. **`SCAN_IP_SALT` à définir dans Vercel** (Settings › Environment Variables), avec
   une valeur aléatoire d'au moins 16 caractères. Le code fonctionne sans — il se
   rabat sur un secret serveur existant — mais un sel dédié se change sans toucher à
   l'accès à la base, ce que le repli ne permet pas.

1. **Q11 — identité de l'éditeur du site.** `/legal` publie un texte provisoire.
   Il faut : la forme juridique exacte, la raison sociale ou le nom, l'adresse,
   l'immatriculation applicable, le directeur de publication et l'hébergeur. Ces
   champs dépendent du statut réel ; ils ne se déduisent pas.
2. **Q13 — régions d'hébergement réellement configurées** pour la base, le stockage,
   l'application et les services annexes. L'accueil annonce un hébergement européen ;
   les pages sécurité et confidentialité décrivent une base en Irlande et une
   application Vercel en `iad1`. La contradiction des textes est établie ; la
   configuration réelle, non.
3. **Q07 — « Support prioritaire ».** Faut-il le construire, ou l'offre reste-t-elle
   sans distinction de support ?

## Limites de l'environnement

- **Base de données.** Le projet Supabase référencé par `.env.local` n'existe plus
  (NXDOMAIN). Bloque Q24, Q25 et la partie « essais A/B » de Q26.
- **Paiements.** Aucun environnement Stripe de test configuré : Q25 bloqué. Aucun
  paiement réel n'a été ni ne sera déclenché.
- **Déploiement.** La production tourne sur `4089f187`. Les corrections de cette
  session ne sont **pas** en ligne : aucun déploiement n'a été fait, il demande une
  autorisation explicite.
