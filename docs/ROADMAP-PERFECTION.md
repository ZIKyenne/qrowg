# QRowg — Revue totale et feuille de route « à la perfection »

*Revue du 23 novembre 2026, état v337. Cinq axes relus en parallèle (client qui scanne et vitrine · commerçant et éditeur · QR, impression et mesure · argent, compte et sécurité · santé du code), chaque constat grave revérifié à la main. Lecture du code et de la production, sans appareil réel.*

---

## 1. Où en est le produit, en vrai

| Chiffre (production, 23/11) | Valeur |
|---|---|
| Comptes | 6 |
| Comptes payants / abonnements Stripe actifs | 2 / 2 |
| Pages | 7 (7 QR de page actifs) |
| QR de lien modifiables | 4 |
| Scans humains sur 30 jours | **12** |
| Inscriptions sur 30 jours | 3 |

**Ce que ça veut dire.** Le produit est bien plus avancé que son usage : environ 7 600 tests, un rendu public suivi au kilo-octet près, un webhook Stripe solide, des garde-fous d'honnêteté partout. Mais douze scans par mois, c'est un produit que presque personne n'utilise encore. La perfection ne viendra pas de cent finitions de plus : elle viendra des **dix premiers restaurants qui s'en servent chaque jour** et de ce qu'ils nous apprennent. La feuille de route est construite pour ça : d'abord ne rien laisser qui mente ou casse, ensuite rendre le quotidien du restaurateur imbattable, puis aller chercher ces dix restaurants.

### Forces réelles (à ne pas casser)

- **Le QR imprimé est protégé.** L'adresse `/q/[code]` est stable et aléatoire. Chaque échec (pause, brouillon, expiré) a son écran, avec le nom du commerce et un moyen de le joindre.
- **Les chiffres sont honnêtes à la source.** Les robots et le commerçant qui scanne son propre QR ne sont pas comptés. Une vue n'est attribuée qu'au QR qui y mène vraiment.
- **L'argent est verrouillé en base.** Un trigger interdit de s'attribuer un plan. Les quotas sont imposés par triggers. Le webhook est signé et rejoué en cas d'échec. Rien de vendu n'est absent.
- **« Ma carte » est un vrai outil de comptoir.** On y passe un plat en épuisé, on change un prix au pavé numérique, et une annulation reste possible pendant 7 s.
- **La page publique est rapide et sous budget** (cliquet à 197 Ko au build). Elle lit l'heure du commerce, et la carte illustrée est traduite.
- **La base est saine pour avancer.** TypeScript bloque le build, la CI tourne à chaque push, les migrations sont additives et le code se replie tant qu'une colonne manque.

### Corrections apportées aux revues

- Les migrations v334 (historique des QR de lien) et v336 (choix au retour au gratuit) **sont appliquées** : vérifié en base le 22 et le 23/11.
- Les tables `cron_runs` et `contact_messages` **existent en production**. Il manque seulement leur fichier de migration dans le dépôt : c'est un écart de documentation, pas une panne.

---

## 2. Les urgences : ce qui ment ou peut casser aujourd'hui

Chaque point ci-dessous a été **revérifié à la main** sur le code ou en base.

| # | Constat | Effet concret | Taille | Il faut |
|---|---|---|---|---|
| **U1** | **Le gratuit est un essai de 30 jours, mais la vitrine dit « sans durée ».** Le code met la page en pause 30 jours après la première publication (`lib/essaiGratuit.ts`, `[slug]/page.tsx:128`). Pourtant `/upgrade` affiche « Plan gratuit sans carte, sans durée », et la carte Gratuit, l'accueil, la page bars-restos et le pied de chaque page publique n'en disent rien. Une garde de test interdit même le mot « essai » dans les plans. **4 comptes ont déjà démarré leur période, aucune n'a expiré.** | Au 31ᵉ jour, la carte imprimée sur toutes les tables passe en pause alors qu'on avait promis « sans durée ». Pire première expérience possible, et risque de pratique commerciale trompeuse. | S | **Tranché le 23/11 : annoncer les 30 jours. FAIT v338** |
| **U2** | **Les modèles de la galerie installent de faux avis, une fausse adresse et de faux prix.** Le modèle gratuit « Restaurant & Bar » de `dashboard/templates/page.tsx` contient l'avis « Marie L. », « 12 rue de la Paix, 75001 Paris » et « Foie gras poêlé 18 € ». Les gardes anti-faux ne lisent pas ce fichier. | Une page peut être publiée avec un faux avis et une fausse adresse, sans aucune alerte. | S | **FAIT v340** |
| **U3** | **La création guidée fabrique le nom du commerce.** Le titre devient « Le Bistrot — Présenter un menu » (`onboarding/objectives.ts:181`), puis il est repris dans l'adresse de la page, le titre Google et l'aperçu WhatsApp, et jugé indexable. | Un faux nom de commerce part dans Google et dans chaque partage. | S | **FAIT v340** |
| **U4** | **L'écran « page en pause » est illisible sur un thème clair.** Son texte est ivoire en dur (`PageEnPause.tsx:49-58`), sur le fond du thème. Avec Bamboo (#F5F0E8), le texte a exactement la couleur du fond. | Le client voit une page blanche, précisément le cas que cet écran devait éviter. | S | **FAIT v341** |
| **U5** | **« Aujourd'hui » compte chaque client deux fois.** Les statistiques additionnent scans et vues (`AnalyticsClient.tsx:199-201`), alors qu'un client venu par QR produit les deux. La journée commence en plus à minuit à l'heure du navigateur, pas du commerce. | 20 clients ce midi affichent « 40 ». | S | **FAIT v341** |
| **U6** | **Le Print Studio laisse imprimer un QR qui ne mène nulle part.** Il ne lit ni le statut du QR ni celui de sa page (`PrintStudioClient.tsx:526`). | Un QR en brouillon ou en pause s'imprime sans avertissement, et le client tombe sur un mur. | S | **FAIT v341** |
| **U7** | **La suppression d'un compte laisse les fichiers en ligne.** Les photos, logos et cartes du bucket public restent accessibles par leur adresse (`api/account/delete`). | Contredit la politique de confidentialité (« efface immédiatement ») : écart RGPD, art. 17. | S | **FAIT v341** |
| **U8** | **Le bloc « Avis clients » pousse à afficher des notes invérifiables.** On saisit à la main la note et le nombre d'avis, et un avis sans note reçoit **5 étoiles par défaut** (`renduLegacy.tsx:977`). | Exposition légale du commerçant (art. L111-7-2 du Code de la consommation) et contradiction avec la règle « rien de faux ». | S | **FAIT v342** (décision : retirer) |
| **U9** | **L'éditeur du site n'est pas identifié.** `lib/editeur.ts` est vide, donc `/legal` reste hors index. La politique de confidentialité nomme « QRowg » comme responsable du traitement, qui n'est pas une entité juridique, alors que les paiements sont ouverts depuis le 11/11. | Mentions légales (LCEN) absentes ; le contrat de vente est fragile. | S | **Tes informations** (raison sociale, SIRET, adresse, directeur de publication) |
| **U10** | **La TVA n'est pas tranchée.** Les CGU disent « TTC », mais Stripe n'applique aucune TVA et les factures ne portent pas la mention « TVA non applicable, art. 293 B du CGI ». | Depuis v337, la caisse collecte le n° de TVA du client : une facture pro sans TVA correcte ni mention de franchise pose problème. | S | **Ton statut fiscal** |

---

## 3. La feuille de route

Chaque vague se livre par petits lots, comme v326 → v337 : un lot = un problème, des tests, une vérification sur mobile et sur ordinateur, une entrée au journal. Les tailles : **S** ≈ un lot, **M** ≈ 2 à 4 lots, **L** ≈ plus de 5 lots.

### Vague 0 — Vérité et sécurité *(maintenant, environ 1 semaine)*

Objectif : **zéro promesse contredite, zéro faux publiable, zéro QR imprimé qui casse en silence.**

1. **U1** Gratuit : la vérité sur sa durée, une fois ta décision prise. Puis une garde de test qui croise la durée de l'essai (`DUREE_ESSAI_JOURS`) avec les textes de la vitrine.
2. **U2 + U3** Purge des faits inventés dans les quatre sources de modèles, puis **une seule** garde anti-faux qui lit toutes ces sources (en ignorant accents et unités). Ajout d'un champ « Nom du commerce » dans la création guidée.
3. **U4** Écran en pause lisible sur tous les thèmes, et test de contraste sur le catalogue entier.
4. **U5** « Aujourd'hui » en visiteurs uniques, journée au fuseau du commerce.
5. **U6** Garde de statut dans le Print Studio, avec avertissement et lien « Activer ».
6. **U7** Purge du stockage à la suppression d'un compte, avec un test.
7. **FAIT v342.** **U8** Bloc avis : suppression des 5 étoiles par défaut, puis sort du bloc selon ta décision.
8. **FAIT v341.** **Sécurité de l'inscription :** le paramètre `?error=` est affiché tel quel sur les pages de connexion, ce qui permet d'écrire n'importe quel texte sur le vrai domaine. Remplacement par des codes d'erreur connus.
9. **Équipe :** une équipe survit aujourd'hui au retour au gratuit, et un éditeur peut supprimer des pages, ce qui supprime aussi leurs QR imprimés, sans corbeille. On rattache les droits au plan et on retire la suppression au rôle éditeur. *Migration RLS : ton accord nécessaire.*

### Vague 1 — Le quotidien du restaurateur, imbattable *(environ 3 semaines)*

Objectif : **première page publiée en moins de 5 minutes au téléphone ; changer un prix en 3 touchers ; l'ardoise du jour en moins de 30 secondes, sans ouvrir l'éditeur.**

1. **FAIT v344 (ardoise), v347 (fermetures et congés), v348 (carte illustrée, boissons, happy hour).** **« Ma carte » devient l'écran du service (M).** Elle couvre aussi la carte illustrée, les boissons, le plat du jour, l'happy hour, les horaires et les congés. Aujourd'hui elle ne lit que deux types de blocs.
2. **FAIT v345 (décision : alerter seulement).** **Nouvelle recette « menu » (M).** On arrive dans Ma carte, ou sur « Coller ma carte », avec des champs vides au lieu de « — » et « À compléter ». *Décidé le 23 nov. : alerter seulement (comportement déjà en place).*
3. **FAIT v343.** **Inscription à 2 champs (S).** Le « Nom complet » obligatoire ne sert pas à publier.
4. **FAIT v346.** **20 blocs pour un resto (M).** La bibliothèque filtrée par métier existe déjà, derrière un drapeau désactivé. Un resto voit d'abord les ~20 blocs utiles (profil, menu, carte illustrée, boissons, plat du jour, happy hour, horaires, plan d'accès, appel, réservation, avis, Wi-Fi, réseaux) au lieu de 194.
5. **D1-B, brouillon séparé (L).** Sur une page publiée, une saisie à moitié tapée part en ligne après 800 ms. Avec un brouillon, l'éditeur prépare et un clic publie ; Ma carte reste en direct, c'est son rôle. *Migration et QA : ton accord nécessaire.*
6. **Mesure réelle (D5).** Chronométrer trois vrais restaurateurs sur leur téléphone. C'est le seul chiffre qui valide cette vague.

### Vague 2 — Le client qui scanne *(environ 2 semaines)*

Objectif : **une carte qui a l'air pro, complète et légale, lisible par un touriste, en moins de 2,5 s sur 4G lente.**

1. **FAIT v349.** **Prix toujours au format « 12,00 € » (S).** Le moteur `prixDeLaCarte` existe déjà ; en production, Red Fish affiche « 12.00€ » et « 20.00 » sans €.
2. **FAIT v351 (allergènes) + v352 (traduction de toutes les cartes).** **Allergènes et traduction sur toutes les cartes (M).** Aujourd'hui, seule la carte illustrée, soit 2 modèles sur 9, les propose. L'information sur les 14 allergènes est obligatoire.
3. **FAIT v350.** **Bouton « Réserver » aux couleurs du thème (S).** Il est rouge en dur aujourd'hui, avec un contraste insuffisant sur fond clair.
4. **FAIT v353.** **Référencement local (M).** Données structurées `Restaurant` (adresse, horaires, carte, téléphone) tirées des blocs ; image de la page et non l'avatar du compte ; langue de la page déclarée correctement.
5. **Poids par scan sous 200 Ko (M).** On poursuit PERF-003 sur les blocs encore rendus par l'ancien moteur et très utilisés en resto (réservation, avis). Mesure sur appareil réel.
6. **« Signaler ce contenu » sur chaque page publique et chaque écran `/q` (M).** Si une seule page d'hameçonnage est signalée par Google, **tous** les QR imprimés de tous les clients affichent l'alerte rouge. C'est aussi une obligation d'hébergeur. *Migration (statut « suspendu ») : ton accord nécessaire.*

### Vague 3 — QR, impression et mesure de niveau imprimeur *(environ 3 semaines)*

Objectif : **0 QR imprimé qui affiche un mur ; 100 % des fichiers exportés relus par un décodeur avant téléchargement ; le QR imprimé identique au QR dessiné.**

1. **FAIT v354 (migration `20261123140000_increment_scan_lien` à appliquer).** **`/q/` robuste (M).**
   - Distinguer « base en panne » de « code inconnu » : aujourd'hui, une panne affiche « Code inconnu ».
   - Garder la dernière destination connue en secours.
   - Compter le scan seulement après les contrôles.
   - Incrément atomique des compteurs des QR de lien.
   - Alerte dédiée sur `/q/`.
2. **FAIT v355.** **Une seule source de rendu du QR (M).** Le Print Studio lit le style enregistré dans le QR Studio (couleurs, logo, correction d'erreur). Aujourd'hui, il redessine le QR à sa façon.
3. **FAIT v356.** **Lisibilité mesurée (M).** On complète la note avec le dégradé, la couleur des yeux et la taille du logo, puis on relit chaque fichier exporté avec jsQR, déjà installé, à sa taille physique réelle.
4. **FAIT v358 (relecture, CMJN) + v359 (PDF du QR vectoriel, svg2pdf.js) — le support entier reste sur l'impression du navigateur (déjà vectoriel) ; recette impression réelle (D5) à faire.** **PDF pro sans boîte d'impression (L).** Le PDF est généré directement au lieu de passer par `window.print()`, ce qui couvre aussi le PDF du QR seul, qui est aujourd'hui une image. On branche l'avertissement sur les couleurs qui virent à l'impression : le calcul existe, il n'est pas relié. *Recette sur une vraie impression (D5).*
5. **FAIT v357.** **« Combien de clients ce midi, par support » sur un seul écran (S).** Visiteurs uniques entre 11 h et 15 h, à l'heure du commerce.

### Vague 4 — Fondations pour aller vite sans casser *(en continu, environ 20 % du temps)*

Objectif : **types de base de données réels, un seul moteur de rendu, aucun fichier de plus de 800 lignes, les parcours critiques testés à chaque push, toute erreur de production signalée en moins de 5 minutes.**

1. **Types Supabase réels (M).** Aujourd'hui, `Database = any` : une faute de frappe dans un nom de colonne passe la compilation et ne casse qu'en production. On les génère depuis la base, on corrige le script `db:types`, on ajoute les migrations manquantes de `cron_runs` et `contact_messages`, puis on résorbe progressivement les 477 `as any`. **→ FAIT v362** (types générés depuis la production, `db:types` corrigé, migrations `cron_runs`/`contact_messages`, 2 vrais défauts corrigés). Reste : ~810 `as any` à résorber au fil des lots ; décision `plan_limits` (table orpheline).
2. **Un filet sur l'argent et la redirection (M).** Le vrai code de `/q/[code]` et du webhook est exécuté contre un faux client, comme pour `qr-instant` ; les tests navigateur en session simulée tournent à chaque push. **→ FAIT v363** (banc du webhook sur la vraie route, signature comprise ; défaut du bienvenue corrigé ; filet navigateur de 11 parcours à chaque push, sans secret). La redirection avait déjà son banc (vague 3, `qrRobuste.test.ts`).
3. **Suivi des erreurs (S).** Sentry ou un drain Vercel, avec alerte. *Ta décision : un outil externe.*
4. **Un seul moteur de rendu (L).** On migre les 31 blocs que seul l'ancien moteur sait encore afficher, on supprime les ~8 100 lignes de rendus en double (`renduLegacy`, `builderPreview`, `TemplatePreviewModal`), et l'éditeur, la galerie et la page publique affichent exactement la même chose. **→ Lot 1 FAIT v364** : les copies mortes des 163 blocs migrés sont retirées des 3 anciens rendus (−6 335 lignes, garde `renduUnique`). **Lot 2 FAIT v365** : les 6 affichages simples migrés. **Lot 3 FAIT v366** : la structure (5 blocs). **Lot 4 FAIT v367** : les médias (7 blocs, dont les deux « bloqués » levés, conditions vérifiées). **Lot 5 FAIT v368** : les actions externes (8 blocs). **Lot 6 FAIT v369** : les 6 formulaires, déplacés tels quels — plus aucun bloc dans l'ancien moteur. **Suppression FAITE v370** : `renduLegacy.tsx` supprimé, plus aucun `switch` de bloc dans les aperçus. **POINT 4 TERMINÉ.**
5. **Une seule source de modèles (L, TPL-001).** Elle remplace les 4 à 5 sources actuelles, qui sont aussi la cause de U2. **→ Lot 1 FAIT v371** : registre unique de la galerie (`registreDesModeles.ts`) ; l'aperçu montre enfin le thème de la page créée. **Lot 2 FAIT v372** : un seul catalogue de 65 modèles (galerie = éditeur = `/examples`) ; historiques joignables et accentués. **Lot 3 FAIT v373** : les 62 métiers du moteur vérifiés (292 faux retirés : avis, adresses, numéros, qualifications) puis exposés, chacun dans son ambiance → 127 modèles partout. **Point 5 terminé.**
6. **Découpe et ménage (M).** **→ Lot 1 FAIT v374** : garde de taille à cliquet (14 fichiers > 800 lignes plafonnés, jamais relevés) ; `themes.ts`, `styles/globals.css`, `jszip`, `nanoid` supprimés ; les gardes de contraste et de polices relues sur les VRAIS thèmes de l'éditeur → **114 thèmes sur 152 sous le seuil AA**, mis en cliquet, correction = lot 2. **→ Lot 2 FAIT v375** : 140 couleurs sur 114 thèmes remises au seuil, en clarté seule (Summer Festival et Pop Art Music traités à la main) ; dette supprimée, règle stricte sur les 152 thèmes. **→ Lot 3 FAIT v376** : `@types/react` 18.3.31 / `@types/react-dom` 18.3.7 (étaient en 19) ; 16 erreurs révélées, une seule cause (refs typées à la React 19), corrigées en trois lignes. **→ Découpe BuilderV4 lot 1 FAIT v377** : fenêtre « Publier » → `FenetrePublier.tsx` (BuilderV4 3 004 → 2 868). **Lot 2 FAIT v378** : barre de sélection multiple → `BarreMultiSelection.tsx` (→ 2 789) + e2e `selectionMultiple`. Référence visuelle `bibliotheque` de builder-visual périmée (VISUAL=1), à valider par le propriétaire. Scripts `.ps1` : non suivis par git, décision du propriétaire.
   - Une garde globale de taille de fichier, à cliquet.
   - Découpe de `BuilderV4` (3 002 lignes, qui a regrossi de 25 % depuis sa décomposition) et de `PrintStudioClient` (2 874 lignes).
   - Suppression du code mort : `styles/globals.css`, `themes.ts`, `jszip`, `nanoid`, et les ~60 scripts `.ps1` de la racine.
   - Alignement de `@types/react` sur React 18.
7. **Tests plus robustes (en continu).** 66 % des fichiers de test lisent le texte du code source, si bien qu'un refactor sans changement de comportement en casse des dizaines. Chaque nouvelle garde teste un comportement plutôt qu'une chaîne de caractères.

### Vague 5 — Croissance : les dix premiers restaurants *(dès la fin de la vague 0, en parallèle)*

Ce n'est pas du code, mais c'est le chantier qui compte le plus.

1. **Dix restaurants réels**, servis à la main : on crée leur page avec eux et on imprime leurs chevalets. On mesure le temps de création, les scans par service, ce qui bloque, ce qu'ils demandent.
2. **Un accueil qui parle au resto dès la première ligne.** Aujourd'hui le titre est générique (« Changez ce que montre votre QR code »), et « Voir une page en vrai » mène à des démos. Dès qu'un restaurant donne son accord, le lien mène à une vraie page en service.
3. **Preuves réelles seulement.** Témoignages et chiffres viennent de ces dix restaurants, avec leur accord ; jamais avant.
4. **Paquet professionnel** : annexe de sous-traitance RGPD (art. 28) dans les CGU, liste complète des sous-traitants et des transferts hors UE. Un acheteur pro le demande. *Ton feu vert sur les CGU et la politique de confidentialité.*

---

## 4. Ce dont j'ai besoin de toi

| Sujet | Question | Bloque |
|---|---|---|
| ~~U1 Gratuit~~ | Tranché le 23/11 : « 30 jours offerts » annoncé partout (v338) | — |
| **U9 Identité** | Raison sociale, forme juridique, SIRET, adresse du siège, directeur de publication | Vague 0, `/legal` |
| **U10 TVA** | Assujetti (on active Stripe Tax) ou en franchise (on ajoute la mention 293 B) ? | Vague 0 |
| **U8 Avis** | Retirer le bloc « Avis clients », ou le garder en n'affichant que des avis marqués « non vérifiés » ? | Vague 0 — **tranché le 23 nov. : retirer** |
| Équipe | Rattacher les droits d'équipe au plan et retirer la suppression au rôle éditeur ? (migration RLS) | Vague 0 |
| Recette menu | Bloquer la publication d'un prix d'exemple, ou seulement alerter ? | Vague 1 |
| D1-B | Lancer le brouillon séparé ? (migration) | Vague 1 |
| Signalement | Ajouter le statut « suspendu » et le lien de signalement ? (migration) | Vague 2 |
| Erreurs | Accepter un outil externe de suivi des erreurs (Sentry ou équivalent) ? | Vague 4 |
| Terrain | Trois restaurateurs pour le chronométrage, et un téléphone pour les mesures réelles (D5) | Vagues 1 à 3 |

---

## 5. La perfection, mesurable

| Domaine | Résultat visé |
|---|---|
| Vérité | 0 promesse de la vitrine contredite par le code ; 0 fait inventé publiable, quelle que soit la source de modèle |
| Création | Première page publiée en moins de 5 min au téléphone, chronométrée sur 3 restaurateurs ; inscription en 2 champs |
| Quotidien | Prix changé en 3 touchers et moins de 15 s ; ardoise du jour en moins de 30 s ; 100 % des blocs carte et horaires dans Ma carte |
| Client | Moins de 2,5 s au premier scan en 4G lente ; contraste ≥ 4,5:1 sur 100 % des écrans servis ; allergènes sur 100 % des cartes ; prix toujours au format « 12,00 € » |
| QR | 0 QR imprimé qui affiche un mur sans que le commerçant ait été prévenu ; « indisponible » et jamais « inconnu » en cas de panne ; 100 % des exports relus par un décodeur |
| Mesure | « Clients aujourd'hui » = visiteurs uniques, journée au fuseau du commerce |
| Confiance | `/legal` indexée ; facture correcte (TVA ou 293 B) ; « Signaler » sur 100 % des pages ; 0 fichier restant après la suppression d'un compte |
| Code | `Database ≠ any` ; 1 seul moteur de rendu ; 0 fichier de plus de 800 lignes ; parcours critiques testés à chaque push ; alerte en moins de 5 min |
| Usage | **10 restaurants actifs chaque semaine** : le chiffre qui dit si tout le reste a servi |

---

## 6. Ce qu'on ne fait pas

- **Pas de nouvelles fonctions** tant que la vague 0 n'est pas finie. Le produit en a déjà plus qu'il n'a d'utilisateurs.
- **Pas de refonte en aveugle.** Tout ce qui touche au rendu passe par une vérification visuelle, mobile et ordinateur.
- **Pas de faux** pour remplir la vitrine en attendant les vrais restaurants.
- **Pas de CMYK** : le choix « RGB haute définition » a été acté le 14/08. On branche seulement l'avertissement sur les couleurs qui virent.

---

*Sources détaillées : les cinq rapports de revue de cette session, `docs/audits/qrowg-ux-v2/` (état v337), `docs/BUILDER-REBUILD-PLAN.md`, `docs/QR-STUDIO-PLAN.md`.*
