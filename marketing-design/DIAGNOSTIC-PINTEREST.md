> # 🛑 08/09/2026 — CE DIAGNOSTIC EST CADUC. IL N'Y A JAMAIS EU DE PROBLÈME DE DISTRIBUTION.
>
> L'export natif *Pinterest Analytics overview 2026-08-08 → 2026-09-07* dit l'inverse de
> tout ce qui précède. **Les impressions ne sont pas nulles, elles triplent.**
>
> | Période | Jours | Impressions | Moyenne/jour |
> |---|---|---|---|
> | 08 → 30 août (avant la production quotidienne) | 23 | 562 | **24,4** |
> | 31 août → 07 sept (production quotidienne) | 8 | 645 | **80,6** |
>
> **×3,3 en moyenne**, et la courbe monte toujours : 113 impressions le 06/09,
> **129 le 07/09**, le meilleur jour des trente. Total 1 207 impressions sur la période.
>
> ### La cause réelle : l'instrument était cassé
> Les « 0 impression » lus chaque jour depuis le 02/09 venaient tous de **Buffer**, qui
> ne remonte pas les métriques par épingle de Pinterest. Ce zéro était un **défaut de
> reporting**, jamais un fait. Six jours de notes (02 → 07/09) ont bâti des hypothèses —
> tableaux, domaine, audience, shadowban — sur une mesure vide.
> **Règle : les chiffres Pinterest se lisent dans l'analytique native de Pinterest.
> Buffer sert à programmer, pas à mesurer Pinterest.**
>
> ### Le test de placement est lisible, et les tableaux thématiques gagnent
> Impressions par tableau sur 30 jours :
>
> | Tableau | Impressions |
> |---|---|
> | QR code restaurant | **119** |
> | Avis Google commerce | 94 |
> | QR code food truck | 82 |
> | QR code boutique commerce | 51 |
> | QR code immobilier | 28 |
> | QR code hôtel | 20 |
> | Templates gratuits *(historique)* | 19 |
> | QR code salon coiffure | 15 |
> | Idées rangement *(historique)* | 5 |
> | Productivité au travail *(historique)* | absent du classement |
>
> Les tableaux **« QR code X » écrasent les tableaux historiques** (119 contre 19, et
> *Productivité au travail* ne marque même pas). La consigne conditionnelle « si les
> tableaux historiques gagnent, basculer sur eux » est donc **caduque** : ils perdent.
> On garde les tableaux thématiques par défaut. Le pont d'audience se fait par le
> **sujet** des épingles (food, commerce de proximité), pas par le tableau.
>
> ### Le vrai problème, désormais : la conversion, pas la portée
> Sur 1 207 impressions en 30 jours : **7 clics sur épingle, 2 clics sortants, 1
> enregistrement.** Soit 0,6 % de clic sur épingle et **0,17 % de clic sortant**.
> L'audience voit les épingles et ne les ouvre pas. C'est là qu'il faut travailler :
> - le **titre** de l'épingle et la première ligne de description (ce qui décide du clic),
> - la promesse : « idée d'organisation » attire le regard mais ne promet rien à ouvrir,
> - l'appel à l'action explicite vers la page,
> - et le fait que le visuel *donne déjà toute la réponse* — il ne reste aucune raison
>   de cliquer. Garder une part de la réponse derrière le lien.
>
> ### Ce qui reste vrai du reste de ce fichier
> Rien concernant les causes. Le contenu ci-dessous est conservé **à titre d'archive**,
> pour mémoire de la méthode et de l'erreur.

---

> ## Note intermédiaire 08/09/2026 (écrite avant l'export natif — partiellement fausse)
>
> **Cause n°1 (tableaux neufs) : éliminée.** Le test du 03/09 est tranché avant sa date
> de lecture. Les épingles placées sur les tableaux historiques (*Productivité au
> travail*, *Templates gratuits*) sont à **0 impression**, exactement comme le témoin sur
> un tableau neuf. Le placement n'y est pour rien.
>
> **Cause n°2 (domaine non revendiqué) : éliminée — l'hypothèse était fausse.**
> Vérification faite dans *Paramètres → Lien vers Pinterest* le 08/09 : `qrowg.com`
> figure bien dans « Sites Web » avec le bouton **« Ne plus revendiquer »**, ce qui
> signifie que le domaine **est revendiqué**. Cette cause a été supposée le 03/09 sans
> être vérifiée dans l'interface, puis répétée comme un fait dans les notes du 05, 06 et
> 07/09. À ne plus écrire sans avoir regardé l'écran.
>
> **Cause n°3 (audience hors sujet) : insuffisante.** Un contenu hors sujet est montré à
> quelques centaines de personnes avant d'être enterré. Zéro strict, sur 56 épingles et
> plusieurs semaines, n'est pas un problème d'intérêt.
>
> ### Ce qui reste, et le signal nouveau
> Le même jour, on découvre que **4 carrousels Instagram ont été refusés** avec
> « flagged this post as potential spam ». Deux plateformes différentes, le même verdict,
> sur le même flux : le problème n'est probablement ni le tableau, ni le domaine, ni le
> sujet, mais le **motif de publication** — volume quotidien automatisé, visuels très
> proches les uns des autres, lien sortant systématique vers le même domaine, sur des
> comptes hérités reconvertis. C'est le profil que les deux plateformes classent en spam.
>
> ### Les deux vérifications à faire avant toute nouvelle hypothèse
> 1. **Les zéros sont-ils réels ?** Les chiffres viennent tous de Buffer. Ouvrir
>    l'analytique **de Pinterest** (Business Hub → Analytics → Vue d'ensemble, 30 jours)
>    et comparer. Si Pinterest affiche des impressions que Buffer ne remonte pas, il n'y
>    a jamais eu de problème de distribution, seulement un problème de reporting.
> 2. **Y a-t-il une notification de non-conformité ?** Regarder la cloche et la boîte
>    mail du compte : Pinterest prévient quand il restreint un compte ou un domaine.
>
> ### Le test qui sépare « domaine » de « compte »
> Si les zéros sont confirmés : publier **deux épingles à la main depuis Pinterest**
> (pas via Buffer, pas via l'API), le même jour, même soin —
> l'une **sans aucun lien sortant**, l'autre avec le lien `qrowg.com` habituel.
> - Les deux à zéro → le compte est restreint, pas le lien.
> - Seule celle sans lien décolle → c'est le domaine ou le lien sortant qui est filtré.
> - Les deux décollent → c'est la **publication via API/Buffer** qui est déclassée, et il
>   faut repasser en publication manuelle ou espacer fortement le rythme.
>
> En attendant ces réponses, **augmenter le volume d'épingles n'a aucun sens** : le
> plafond reste à 4 par jour, et l'effort se reporte sur TikTok, seul canal réellement
> distribué.

---

# Pourquoi Pinterest ne distribue rien — 03/09/2026

## Le chiffre

Statistiques Buffer, toutes les épingles publiées depuis le 22/08 :

| | |
|---|---|
| Épingles publiées | 56 |
| Impressions cumulées | ≈ 100 |
| Enregistrements | 1 |
| Clics sortants | 0 |
| Abonnés du compte | ~9 400 |

Une épingle plafonne à **1 ou 2 impressions**. Les meilleures — 8 et 11 impressions —
datent du 23/08 et pointent vers `qrowg.com/social/`. Depuis, la courbe descend : les
épingles du 31/08 et du 02/09 sont à **0**.

Ce n'est pas une question de qualité de visuel ni de titre. À ce niveau, **le contenu
n'est simplement pas distribué**. Corriger le QR des anciennes épingles n'a donc aucune
valeur : personne ne les voit. Cette action est annulée.

## Les trois causes plausibles, par ordre de probabilité

**1. On épingle dans des tableaux neufs et vides.** Les 9 400 abonnés ont suivi le
compte pour son ancien contenu — organisation, productivité, bullet journal, rangement.
Or toute la production part dans « QR code restaurant », « QR code food truck »,
« QR code boutique commerce »… des tableaux **créés récemment, sans historique et sans
abonnés**. Pinterest distribue d'abord par tableau et par intérêt : un tableau neuf
démarre à zéro, quel que soit le compte qui le porte. C'est l'explication la plus
simple et la plus cohérente avec la chronologie — les rares impressions viennent des
épingles les plus anciennes.

**2. Le domaine `qrowg.com` n'est probablement pas revendiqué** (*claim*) dans les
réglages Pinterest. Un domaine non revendiqué voit ses liens sortants déclassés, et le
compte ne récupère aucune statistique de destination. Cela expliquerait aussi les
**0 clic sortant**. À vérifier dans Paramètres → Comptes connectés.

**3. Le sujet est hors de l'intérêt de l'audience héritée.** Réel, mais insuffisant pour
expliquer 1 impression par épingle : même hors sujet, Pinterest teste un contenu auprès
de quelques centaines de personnes avant de l'enterrer. Un plafond à 1–2 impressions
ressemble davantage à un problème de placement ou de compte qu'à un problème d'audience.

## Le test à lancer (3 épingles, 3 emplacements)

Une seule variable change : **le tableau**. Même soin, mêmes règles, angle adapté au
tableau visé — c'est le principe du pont décrit dans `audience-bridge.md`, appliqué cette
fois au placement et pas seulement au texte.

| Épingle | Tableau visé | Pourquoi |
|---|---|---|
| `checklist-ouverture-commerce-matin` | **Productivité au travail** (`726416683586787011`) | Tableau historique, angle checklist/organisation : exactement ce que l'audience suit. |
| `qr-code-bar-happy-hour-ardoise-v2` | **Templates gratuits** (`726416683586787015`) | Tableau historique, angle « modèle à utiliser ». |
| `qr-code-pizzeria-carte-du-soir-v2` | **QR code restaurant** (`726416683586817614`) | Le **témoin** : tableau neuf, placement actuel. Point de comparaison. |

Lecture à J+7 : si les deux premières dépassent nettement la troisième, la cause n°1 est
confirmée et toute la stratégie de tableaux bascule sur les tableaux historiques, les
tableaux « QR code X » ne servant plus qu'en second épinglage. Si les trois restent à
zéro, la cause est le compte ou le domaine (n°2), et il faut régler cela **avant** de
produire une épingle de plus.

## Point mort à signaler

**Supermetrics : essai expiré le 30/08.** L'étape « apprentissage » de la tâche
quotidienne échoue donc en silence depuis quatre jours — le run continue sans données.
Les statistiques utilisées ici viennent de Buffer, qui donne les impressions et les
enregistrements mais **pas les clics sortants par épingle**. Soit on prend un abonnement,
soit on retire cette étape du run pour ne pas croire qu'elle tourne.

## Note sur le QR (correctif technique du jour)

Une URL longue (lien profond + UTM complets) produit un QR de version 9, soit 53 × 53
modules. Rétréci à l'affichage, il devient illisible. Le générateur fabrique désormais
l'image du QR **à la résolution finale exacte**, sans réduction, avec
`image-rendering: pixelated`. Le contrôleur, lui, rejoue la détection par tuiles : un
détecteur qui reçoit une affiche 2000 × 3000 décroche sur un motif occupant 8 % du cadre,
alors qu'un téléphone, qui cadre de près, le lit sans peine.
