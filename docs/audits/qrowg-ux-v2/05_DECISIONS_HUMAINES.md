# 05 — Décisions qui reviennent au propriétaire

Aucune de ces décisions n'a été prise par l'agent. Chacune indique ce qui est prêt et ce qui reste à trancher.

## D1 — Modifier une page déjà publiée : en direct ou en brouillon ? (priorité haute)

**Constat.** Il n'existe qu'une version des blocs (`savePage.ts` → table `blocks`, lue telle quelle par la page publique). Sur une page en ligne, chaque frappe sauvegardée est visible des clients dans la seconde. « Mettre à jour la page » ne fait que revalider.

**Deux options.**
- **A. Assumer le direct.** On le dit dans l'éditeur : « Page en ligne · vos modifications sont visibles tout de suite ». Le bouton redondant est retiré ou renommé. Coût faible, aucune migration. C'est cohérent avec « Ma carte » (épuisé sans republier).
- **B. Brouillon séparé.** Ajouter une copie publiée (colonne JSON ou table `page_versions`) que lit la page publique, mise à jour seulement par « Publier ». Cela donne aussi un historique et une restauration (EDIT-010). Coût élevé : migration, lecture publique, Ma carte à brancher sur la copie publiée, tests. L'agent ne la lance pas sans accord.

**Statut :** A appliquée en v327 (« enchaîne » du 22/11). B non lancée.

**Recommandation d'origine :** A tout de suite, pour l'honnêteté. B seulement si des gérants se plaignent d'avoir montré une modification inachevée.

## D2 — Politique de confidentialité : région d'hébergement

**Constat.** `/privacy` (5/09) dit « application servie depuis les États-Unis (Vercel iad1) ». Les fonctions tournent à Paris depuis la v309. Les fichiers statiques restent servis par le réseau mondial de Vercel.

**Texte proposé, à valider :**

> « La base de données est située dans l'Union européenne (AWS eu-west-1, Irlande). Les traitements de l'application s'exécutent à Paris (Vercel, région cdg1). Les fichiers statiques du site (images, scripts) sont diffusés par le réseau de distribution mondial de Vercel. »

C'est un document juridique : il change seulement sur ton feu vert, en mettant aussi à jour sa date.

**Décision (22/11/2026) : validée telle quelle. Appliquée en v335.**

**Nuance relevée en appliquant :** le middleware (`src/middleware.ts`) tourne en Edge Runtime. Vercel l'exécute dans la région la plus proche du visiteur, pas forcément à Paris : il aiguille les requêtes et lit le cookie de session. Pour un visiteur en France, c'est en pratique une région européenne. Le texte validé ne le mentionne pas ; le préciser demanderait un nouveau feu vert.

## D3 — Rétrogradation et QR déjà imprimés

**Constat.** À la rétrogradation, le webhook éteint les QR dynamiques les plus récents au-delà du quota, puis prévient par e-mail. Le gérant peut ensuite choisir lesquels rallumer. Mais il n'a **aucun préavis ni choix avant l'échéance**, alors que les CGU disent « l'utilisateur choisissant celles à conserver actives ».

**À trancher :**
1. Faut-il un écran de choix avant la résiliation, dans le portail ou dans Paramètres → Facturation ?
2. Quels QR éteindre par défaut : les plus récents (comme aujourd'hui) ou les moins scannés ?
3. Faut-il une période de grâce ?

**Décision (23/11/2026) : option A, « il choisit ». Appliquée en v336.**
1. Écran de choix dans Paramètres → Facturation (et /upgrade), sous l'avertissement qui existait déjà : une page et un QR modifiable, ce que couvre le gratuit. Le choix est fait avant l'échéance et lu par le webhook à la bascule, y compris après un impayé.
2. Sans choix : ordre inchangé (les plus anciens restent), règle décidée plus tôt avec le propriétaire (`dynamicReconcile`).
3. Pas de période de grâce.

Les CGU ne changent pas : elles décrivent maintenant ce que fait le produit.

## D4 — Les quatre décisions restées ouvertes depuis le 17 novembre

1. Facture pro (TVA, adresse, SEPA).
2. Ce que compte le quota : pages publiées ou QR actifs (aujourd'hui : QR actifs).
3. Le nom « Starter ».
4. Les statistiques de pages incluses pour tous (aujourd'hui : oui).

## D5 — Vérifications qui demandent un vrai compte ou un vrai appareil

Ce ne sont pas des décisions, mais elles ne se font pas sans toi :
- **Retrait du branding dès Starter :** à vérifier sur une page réelle avec un compte payant.
- **Photo iPhone (HEIC, orientation) :** à essayer sur un appareil réel.
- **Deux comptes :** un accès croisé refusé, et un membre d'équipe retiré qui perd l'accès.
- **Impression et scan réels** d'un QR petit format avec logo.
