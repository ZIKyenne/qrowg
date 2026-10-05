# Qrowg Audit et plan de réparation

29 septembre 2026 · Site public et parcours invité · Dossier pour Claude Code

**La première priorité est la fiabilité de l'éditeur.** Pendant cet audit, une première annulation a remplacé un modèle de 10 blocs par la page générique de 3 blocs. Le comportement a été reproduit deux fois, dont une après rechargement. La commande Rétablir a récupéré le contenu pendant les essais ; aucune perte irréversible n'a été démontrée.

Les autres corrections prioritaires concernent les modèles introuvables par secteur, les aperçus qui s'ouvrent au milieu de la page, la continuité du choix d'un modèle, les prix annuels et les promesses commerciales contradictoires. Une amélioration visuelle seule laisserait ces obstacles dans le parcours.

Ce dossier contient **30 chantiers**, identifiés Q01 à Q30. Ils regroupent des anomalies observées, des améliorations proposées et des validations encore nécessaires. Ils ne représentent pas 30 bugs tous confirmés. Les critères de réussite permettent à Claude Code de fermer chaque point avec une preuve.

> **Note de suivi.** L'avancement, les preuves et les blocages sont tenus dans `AUDIT_QROWG_SUIVI.md`, à la racine du dépôt. Ce dossier-ci ne change pas : c'est le constat d'origine.

## Décisions recommandées

1. Corriger et vérifier Q01 avant toute refonte étendue de l'éditeur.
2. Comparer la version déployée aux corrections locales déjà annoncées, puis traiter Q02 à Q10 sans refaire ce qui fonctionne déjà.
3. Réconcilier les informations commerciales et de confiance avec la configuration réelle du produit.
4. Terminer par les écrans connectés, les essais mobiles et une validation du build de la révision livrée.

**Cadre.** Audit réalisé par observation et interaction avec qrowg.com, sans accès au dépôt local, aux données clients ni aux réglages de production. Les captures de preuve sont intégrées au document Word. La version Markdown est destinée à Claude Code ; elle contient les mêmes constats et critères.

## 1 Périmètre et niveau de preuve

Les observations datent du 29 septembre 2026, dans Chrome, en mode anonyme, avec une fenêtre de 1363 × 936 pixels CSS. Les contrôles ont des profondeurs différentes.

| Ensemble | Contrôle réellement effectué | Limite |
| --- | --- | --- |
| Accueil et tarifs | Lecture, captures, bascule mensuel et annuel, comparatifs | Aucun paiement |
| Modèles et création | Catalogue, filtres, recherche, aperçu, création d'un brouillon | Une démonstration complète et un modèle édité |
| Éditeur invité | Modification, annulation, rétablissement, rechargement | Aucune publication |
| QR et outils | Création de lien, export invité, générateur public, calculateur, lecture d'un QR de contrôle | Fichier exporté non récupéré indépendamment |
| 26 pages métiers | Titres, H1, canonical, contenu, liens d'action, images et débordement à cette largeur | Pas un test complet de chaque parcours |
| 12 guides | Structure sur les 12, lecture approfondie de plusieurs articles | Pas une validation de toutes les affirmations |
| Pages de confiance | Contact, sécurité, mentions légales ; confidentialité et conditions consultées | Pas d'audit juridique ou technique complet |

### Comment lire les tickets

**Observé** signifie que l'état ou le comportement a été constaté dans le site accessible. **Amélioration** désigne un choix de conception recommandé, sans prétendre qu'une norme est violée. **À vérifier** désigne un contrôle qui nécessite le code, une session connectée ou un environnement de test. **Rapport local** désigne une information fournie dans le compte rendu précédent, non reproduite ici.

P0 signifie « risque fonctionnel à traiter en premier ». P1 signifie « parcours, information ou validation indispensable avant de considérer la livraison prête ». P2 signifie « amélioration à planifier après les blocages ». Une priorité P1 attribuée à un contrôle ne constitue pas la découverte d'une faille.

### Ce qui fonctionne et doit être préservé

Le brouillon modifié a survécu au rechargement. Rétablir a récupéré le modèle après l'annulation défectueuse. L'aperçu possède une boîte de dialogue nommée ; Échap a rendu le focus au bouton d'ouverture. Les exemples publics utilisent des rendus concrets et signalent leur caractère démonstratif. Le générateur détecte un contraste faible et propose une correction. Le testeur a décodé le QR de contrôle. Les pages métiers et guides inspectées avaient un H1, des titres distincts et des canonical cohérents.

## 2 Priorités de réparation

Ce tableau donne l'ordre de travail. Les détails et scénarios suivent ; rechercher l'identifiant Q dans ce document pour retrouver un chantier.

| Priorité | Tickets | Résultat recherché |
| --- | --- | --- |
| P0 | Q01 | Une annulation conserve le bon document et son historique |
| P1 | Q02 à Q05 | Trouver, prévisualiser et utiliser le modèle attendu |
| P1 | Q06 à Q08 | Prix cohérents, droits explicites et export sans rupture surprise |
| P1 | Q09 et Q10 | Champs nommés et identifiants HTML uniques |
| P1 | Q11 à Q14 | Informations légales et de confidentialité vérifiables |
| P1 à vérifier | Q23 à Q27 | Build, comptes, paiements, permissions et mobile validés |
| P2 | Q15 à Q19 | Galerie, navigation, éditeur et textes plus clairs |
| P2 | Q20 à Q22 | Promesses, outils et contenus publics plus précis |
| P2 à vérifier | Q28 à Q30 | Performance, impression, domaines et mesure des usages |

### Ne pas confondre état local et état en ligne

Le compte rendu fourni annonce déjà un module commun de classement, des miniatures réelles et une correction de focus. Le site déployé présente encore les anciens symptômes dans les essais de cet audit. Cela établit une différence de comportement ; cela ne prouve pas que les corrections locales sont mauvaises.

Avant de modifier ces composants, relever la branche, la révision Git, les changements non commités, la version réellement déployée et l'environnement de test. Classer chaque ticket : à reproduire, confirmé, déjà corrigé localement, corrigé et vérifié, ou bloqué avec une raison précise.

### Définition de terminé

Un ticket est fermé quand son scénario échoue avant la correction, réussit après elle et possède une preuve adaptée : assertion comportementale, capture, résultat de build ou vérification manuelle documentée. Un changement de texte de test ou une capture isolée ne prouve pas la réparation d'un comportement.

Les limitations d'environnement restent visibles dans le suivi. Un échec antérieur peut être hors du lot courant ; il ne doit pas disparaître du bilan ni être présenté comme une validation réussie.

## 3 Fiabilité des brouillons

### Q01 Historique initial du brouillon

**P0 · Observé deux fois · `/dashboard/builder?draft=1`.** Depuis `/creer`, utiliser Bistrot français, créer un brouillon, modifier le nom du premier bloc puis cliquer sur Annuler. Le modèle de 10 blocs devient une page générique de 3 blocs et le titre revient à Ma Page. Après Rétablir puis rechargement, une nouvelle modification suivie d'Annuler reproduit le problème.

**Impact.** Une commande habituelle peut remplacer toute la page et cet état peut être sauvegardé. L'essai ne permet pas de conclure à une suppression définitive ni à un impact sur les comptes connectés.

**Correction à instruire.** Examiner l'initialisation de l'historique par rapport au chargement du brouillon. L'hypothèse est un état générique enregistré avant l'hydratation ; elle doit être confirmée dans le code. Initialiser l'historique à partir du document chargé, conserver les identifiants des blocs et isoler les historiques de documents différents.

**Réussite.** La première annulation ne retire que la modification récente. Le nombre et l'ordre des 10 blocs, les styles et le titre du brouillon restent corrects. Tester aussi après rechargement, plusieurs annulations, rétablissement et nouvelle modification après annulation. Vérifier que la sauvegarde ne remplace pas le brouillon par un état transitoire.

## 4 Retrouver tous les modèles pertinents

### Q02 Classement recherche et compteurs

**P1 · Observé · `/creer?metier=Bar`.** Le catalogue affiche 48 modèles. Le filtre Bar ne retourne que Restaurant & Bar, alors que Bar à cocktails et Bar de nuit existent dans le catalogue. Café et Restaurant affichent aussi un compteur de 1. La recherche `cafe` donne zéro résultat malgré Coffee shop ; `bistrot` retrouve Bistrot français. Artisan, Association et Sport n'apparaissent pas dans les filtres observés.

**Correction.** Vérifier en premier le module `classementDesModeles.ts` annoncé dans le rapport local. Utiliser la même règle d'appartenance pour filtre, compteur, tri d'arrivée et recherche, avec catégories secondaires explicites et synonymes pertinents. Conserver les identifiants, les favoris et les restrictions de forfait. Distinguer les 34 exemples publics des 48 entrées de la galerie de création : ces volumes différents ne prouvent pas à eux seuls un bug.

**Réussite.** Les deux bars sont accessibles par Bar, Coffee shop par Café et Bistrot français par Restaurant. `cafe`, `café` et `CAFÉ` donnent le même ensemble. Vérifier également `cocktail` et `plombier`. Un compteur doit refléter exactement sa règle annoncée, y compris lorsque recherche, secteur et forfait se combinent. Un nouveau modèle ne doit pas devenir invisible faute de correspondance.

## 5 Ouvrir des aperçus fidèles et stables

### Q03 Focus et position des aperçus

**P1 · Observé · `/creer`.** Chercher Bistrot français puis ouvrir Aperçu. La simulation s'ouvre dans sa partie basse avec le focus sur Instagram. Le conteneur observé avait un défilement de 707 px pour 590 px de hauteur visible. La fermeture par Échap rendait correctement le focus au bouton d'ouverture.

**Correction.** Donner le focus initial à un contrôle du dialogue ou à son titre avec `preventScroll`, réinitialiser le bon conteneur et exclure les liens de la simulation du parcours clavier. Si la simulation doit être purement visuelle, rendre son sous-arbre inerte sans neutraliser les commandes du dialogue. Vérifier React, React DOM et l'attribut réellement produit avant de modifier la solution locale annoncée.

**Réussite.** Chaque ouverture commence en haut, y compris après avoir parcouru un autre modèle. Tabulation et Échap restent utilisables, le focus ne sort pas du dialogue, les liens simulés ne déclenchent pas de navigation et le défilement visuel reste possible.

### Q15 Miniatures réellement représentatives

**P2 · Amélioration.** Les cartes de création observées ressemblent à des schémas ; les exemples publics montrent mieux leur contenu. Réutiliser le rendu partagé ou la solution `MiniApercu.tsx` déjà annoncée, avec un nombre de blocs borné. Charger progressivement les cartes hors écran, sans iframes tierces ni contrôles imbriqués dans un bouton. Vérifier fidélité et coût de rendu au navigateur.

## 6 Conserver le choix du visiteur

### Q04 Utiliser exactement le modèle choisi

**P1 · Observé · `/examples/resto_bar`.** Le bouton d'utilisation conduit à `/creer?metier=Bar`, où le visiteur retrouve une galerie générale. Le choix exact du modèle n'est pas transmis. Les liens du catalogue public observés transmettent un secteur plutôt qu'un identifiant de modèle.

**Correction.** Transporter un identifiant stable validé du modèle, en conservant le paramètre métier pour les entrées par secteur. Préserver ce choix pendant l'identification éventuelle et la création du brouillon. En cas d'identifiant inconnu, fournir un repli explicite. Ne pas élargir les droits d'accès à un modèle payant.

**Réussite.** Exemple public → Utiliser → création ou personnalisation du même modèle. Le nom, le thème et la structure correspondent ; le retour arrière conserve le contexte. Les anciens liens restent valides.

### Q05 Relier chaque page métier au bon départ

**P1 · Observé pour les destinations ci-dessous.** Plusieurs appels à l'action envoient vers un secteur éloigné de la page consultée.

| Pages sources | Destination observée | Correction attendue |
| --- | --- | --- |
| Hôtel et camping | Secteur Restaurant | Modèle ou famille d'hébergement adaptée |
| Artisan et garage | Secteur Consultant | Modèle ou famille correspondant à l'activité |
| Association | Galerie sans secteur | Contexte associatif conservé |
| Avis Google, WhatsApp, SMS, PDF, paiement | Galerie générale | Fonction existante adaptée ou sélection explicitement contextualisée |

La page WiFi possède déjà une destination dédiée pertinente : préserver ce comportement. Centraliser la correspondance entre usages publics, secteurs et modèles plutôt que corriger chaque lien à la main. Si un usage n'a aucun modèle adapté, nommer honnêtement la prochaine étape sans en promettre un.

**Réussite.** Un contrôle de toutes les correspondances et un essai des parcours représentatifs vérifient que le visiteur retrouve son intention. La page d'arrivée rappelle le modèle ou l'usage sélectionné ; aucun paramètre d'entrée ne permet de contourner les restrictions du produit.

## 7 Corriger les prix annuels

### Q06 Une source de prix et des remises exactes

**P1 · Observé · accueil et `/upgrade`, option annuelle.** Le total annuel diffère entre les deux pages. Le badge de réduction commun ne correspond pas aux économies calculées à partir des prix affichés.

| Plan | Mensuel | Total annuel accueil | Total annuel upgrade | Économie selon upgrade |
| --- | --- | --- | --- | --- |
| Établissement | 19 € | 149,04 € | 149 € | 79 €, soit environ 34,65 % |
| Multi-sites | 49 € | 489,96 € | 490 € | 98 €, soit environ 16,67 % |

**Correction.** Partir des montants annuels et mensuels réellement configurés pour la vente. Stocker les montants en centimes et dériver l'équivalent mensuel arrondi pour l'affichage ; ne pas le multiplier pour reconstruire la facture annuelle. Calculer la remise par plan. Réconcilier le badge commun de 20 % et la promesse de mois offerts avec ces calculs.

**Réussite.** Accueil, abonnement, récapitulatif et paiement de test affichent le même plan, la même période, la même devise et le même montant dû. La bascule annuelle doit survivre au parcours d'inscription. Son absence dans l'URL observée est un point à vérifier, pas la preuve d'une perte : l'état peut être conservé autrement.

## 8 Aligner les droits et les parcours QR

### Q07 Une offre compréhensible sur toutes les pages

**P1 · Observé · accueil et `/upgrade`.** La carte gratuite inclut l'atelier d'impression, tandis que les tableaux comparatifs le donnent indisponible. Les formats d'export et leur répartition entre outils et forfaits ne sont pas expliqués de façon uniforme.

**Correction.** Créer ou réutiliser un catalogue central des droits : pages publiées, QR autonomes, QR modifiables, modèles, domaines, impression, statistiques et formats. Vérifier chaque promesse dans le serveur et les écrans. Un SVG gratuit dans un générateur statique public peut coexister avec un export payant dans un autre produit ; expliquer cette différence au lieu d'uniformiser les droits arbitrairement.

**Réussite.** Une capacité a la même signification sur la carte, le comparatif, la documentation et l'écran de restriction. Le nombre de modèles gratuits annoncé est dérivé ou vérifié. Pour un visiteur sans compte, le bouton du plan gratuit mène à une étape utile ; un bouton de plan actuel désactivé est réservé à l'état réellement correspondant.

### Q08 Éviter la rupture au téléchargement

**P1 · Observé · `/dashboard/qr-link`, sans compte.** Après saisie d'un lien valide, Télécharger PNG est disponible mais conduit à la connexion. Aucun retour n'est visible dans l'URL de destination. L'essai n'a pas vérifié la récupération des réglages après identification.

Le générateur public `/generateur-qr-code` annonce un téléchargement sans compte et a affiché un message de succès. La récupération indépendante du fichier n'a pas abouti dans l'outil d'audit ; aucun contrôle du fichier exporté n'est donc revendiqué.

**Correction.** Définir le contrat de chacun des deux parcours. Lorsque l'export est gratuit et public, le terminer. Si un compte est nécessaire, le signaler avant le clic et préserver contenu, style et destination de retour. Valider la destination de retour côté application. Réutiliser le moteur d'export existant pour éviter les divergences.

**Réussite.** Le visiteur reçoit le fichier attendu ou comprend l'étape d'identification et retrouve son QR après celle-ci. Le fichier téléchargé est ouvert puis décodé ; son contenu correspond à la saisie. Une génération répétée ne réutilise pas une image ou un lien périmé.

## 9 Donner un nom fiable à chaque contrôle

### Q09 Libellés de recherche et de formulaire

**P1 · Observé.** Dans `/creer`, la recherche n'a pas de libellé propre fiable ; après saisie, elle emprunte le nom du bouton d'effacement placé dans l'étiquette. Dans l'éditeur, les intitulés visibles de plusieurs champs du profil ne sont pas associés aux entrées, qui reposent sur leur texte indicatif. Un champ hexadécimal de style et le champ de lien du QR présentent aussi des lacunes de nommage.

**Correction.** Associer chaque label à un identifiant unique et stable, relier les aides et erreurs et séparer les boutons de l'étiquette du champ. Un placeholder donne un exemple de valeur ; il ne remplace pas un intitulé durable. Utiliser une abstraction de champ commune si elle existe déjà. Nommer les actions répétées avec le modèle concerné.

**Réussite.** Les sélecteurs accessibles trouvent les champs par leur vrai nom, avec et sans valeur. Le bouton Effacer garde son propre nom. Cliquer sur le label cible le bon champ. Au clavier et au lecteur d'écran, le rôle, l'intitulé, l'erreur et l'état sont compréhensibles. Référence W3C [S1].

### Q10 Identifiant dupliqué dans le calculateur

**P1 · Observé · `/outils/taille-qr-code`.** L'élément principal et un sélecteur portent tous deux `id="contenu"`. Le libellé du type de contenu vise cet identifiant ; le sélecteur est apparu sans nom dans l'arbre d'accessibilité.

**Correction.** Conserver une cible unique pour le lien d'évitement et donner au sélecteur son propre identifiant. Vérifier l'association dans le DOM rendu, y compris si plusieurs calculateurs sont montés.

**Réussite.** Chaque identifiant est unique, le lien d'évitement mène au contenu principal et le sélecteur s'annonce avec son intitulé. Ajouter un test ciblé de la relation label–champ plutôt qu'une simple recherche de chaîne dans le code.

### Contraste et taille des cibles

Les textes atténués et les petites commandes de l'éditeur méritent des mesures. Cet audit ne leur attribue pas de ratios inventés. Viser des commandes tactiles confortables autour de 44 px constitue un objectif de conception ; ce n'est pas le seuil minimal universel WCAG 2.2 AA, qui est de 24 px sous les conditions et exceptions du critère [S2].

## 10 Clarifier les commandes du produit

### Q16 Identité et navigation partagées

**P2 · Observé et amélioration.** Plusieurs écritures et assemblages du logo coexistent entre pages publiques, éditeur, QR et contenus légaux. La capture du tableau de bord fournie par l'utilisateur montre aussi Accueil dans le bandeau et dans la navigation latérale. Cette duplication n'a pas été revue dans une session connectée récente.

**Correction.** Choisir le composant de marque existant de référence. Le logo mène au point de départ prévu ; le bandeau indique la section courante et la navigation latérale porte l'état actif. Réutiliser les mêmes espacements, icônes, infobulles et noms accessibles. Un fil d'Ariane doit aider à se situer, sans répéter un menu identique.

**Réussite.** En passant de galerie à éditeur puis QR, l'utilisateur reconnaît le même produit et sait revenir. Le tableau de bord distingue pages créées et publiées, définit la période des statistiques et présente un état vide utile. Les valeurs connectées doivent être contrôlées sur un compte de test.

### Q18 Organisation des commandes de création

**P2 · Amélioration.** Les entrées Modèles sont répétées et la bibliothèque repliée expose surtout des pictogrammes. Une commande d'aperçu immédiatement identifiable améliorerait la lecture avant publication.

**Correction.** Renforcer les groupes déjà présents : ajouter du contenu, modifier le bloc sélectionné, régler la page, prévisualiser puis publier. Préserver la recherche et les catégories utiles. Donner des noms textuels aux icônes et rendre l'aperçu visible. Pour réordonner les blocs, prévoir une alternative au glisser-déposer.

**Réussite.** Les tâches modifier un titre, ajouter un lien, déplacer un bloc et prévisualiser restent accessibles à la souris et au clavier. Les raccourcis de l'application respectent les champs éditables et les raccourcis usuels du navigateur. Aucune commande existante n'est supprimée pour simplifier la capture.

### Q19 Textes et états qui expliquent la suite

**P2 · Observé et amélioration.** Le sous-titre métier de la galerie comporte une faute d'accord ; certains pluriels sont assemblés maladroitement ; le contact mélange tutoiement et vouvoiement. Des avertissements de publication utilisent un vocabulaire interne au produit.

**Correction et réussite.** Utiliser des phrases françaises complètes et des pluriels corrects. Préférer une consigne liée au champ manquant. Sauvegarde en cours, sauvegarde réussie, erreur, restriction et absence de résultat doivent être distincts et vérifiables. Conserver les contrôles préalables à publication qui détectent déjà des blocs incomplets.

## 11 Unifier la galerie et les pages publiques

### Q17 Alignement densité et variantes

**P2 · Observé et amélioration.** Dans la galerie de création, le titre et les filtres commencent vers x = 162 px tandis que les cartes commencent vers x = 59 px. La première carte commence vers y = 533 px à la largeur auditée. La galerie publique utilise elle aussi une grande partie du premier écran avant les cartes.

**Correction.** Donner une grille et une largeur de contenu cohérentes au titre, à la recherche, aux filtres, au résultat et aux cartes. Réduire les espaces qui retardent la comparaison des modèles sans tasser les contrôles. Conserver l'identité sombre et or ; réserver l'intensité visuelle à la hiérarchie des actions plutôt qu'à toutes les bordures et tous les états.

Les modèles homonymes doivent afficher une variante utile, notamment dans les exemples publics. Le suffixe ou le thème doit rester visible sur petit écran. Ne pas modifier les identifiants pour résoudre un problème de nom affiché.

**Réussite.** Titres, filtres et grille partagent les mêmes repères à chaque largeur prévue. Les états actif, survol, focus et désactivé restent distincts sans dépendre uniquement de la couleur. Les cartes annoncent le modèle, sa variante et son niveau d'accès.

### Q22 Pages métiers et guides utiles

**P2 · Amélioration après contrôle structurel.** Les 26 pages métiers et les 12 guides inspectés possèdent des éléments de structure cohérents. Aucune image cassée ni aucun débordement horizontal n'a été détecté lors de ce contrôle desktop. Cela ne prouve ni l'indexation Google ni la qualité SEO de toutes les pages.

**Correction.** Relier chaque guide à une action existante, corriger les liens métiers de Q05 et enrichir les articles qui manquent d'exemples vérifiables : capture réelle, étapes, résultat attendu et cas d'échec. Éviter d'allonger les textes uniquement pour leur volume. Les démonstrations doivent rester identifiables comme telles ; ne pas transformer leurs avis, badges ou chiffres en témoignages réels.

**Réussite.** Vérifier les canonical, robots, sitemap, réponses HTTP et données structurées sur la version livrée. Seules les pages destinées à être publiques doivent être indexables. Les erreurs de récupération du sitemap pendant cet audit ne constituent pas la preuve d'un sitemap absent : ce point reste à contrôler.

## 12 Réparer les informations de confiance

### Q11 Identité du responsable du site

**P1 · Observé · `/legal`.** Les mentions légales indiquent que les informations d'éditeur sont en cours de mise à jour et ne permettent pas d'identifier complètement l'entité responsable.

**Correction.** Compléter les champs applicables à la situation réelle : identité ou raison sociale, coordonnées, immatriculation et autres mentions requises selon le statut. Vérifier les conditions B2B ou B2C et l'identité du responsable. Utiliser uniquement des informations confirmées par le propriétaire ; ne jamais générer un SIREN, une adresse ou une société fictive. Le cadre officiel dépend du statut [S3].

**Réussite.** Aucun texte provisoire publié, entité identique sur mentions, conditions, factures et contact. Les données manquantes sont consignées comme un blocage ciblé ; les autres réparations continuent.

### Q12 Ancien lien européen de règlement des litiges

**P1 · Observé dans les contenus légaux.** Un lien renvoie à l'ancienne plateforme européenne ODR. La Commission confirme son arrêt au 20 juillet 2025 [S4].

**Correction.** Retirer la référence devenue obsolète et adapter l'information sur les réclamations ou la médiation au statut et aux clients du service. La nouvelle page d'information européenne n'est pas un remplacement automatique d'un médiateur compétent.

**Réussite.** Les références sont actuelles, les coordonnées nécessaires sont réelles et la procédure correspond à l'activité. Faire valider les éléments juridiques qui dépendent du statut avant leur publication.

### Q13 Localisation des composants hébergés

**P1 · Contradiction observée entre textes.** L'accueil présente un hébergement européen. Les pages de sécurité et de confidentialité décrivent une base Supabase en Irlande et une application Vercel dans la région américaine `iad1`.

**Correction.** Vérifier les régions effectivement configurées pour base, stockage, application et services annexes. Décrire séparément ces composants. Une base européenne ne suffit pas à présenter tout le traitement comme européen. Ne pas déplacer l'infrastructure dans le cadre d'une correction de texte sans étude de ses effets.

**Réussite.** Les affirmations publiques correspondent à un inventaire technique vérifié et aux contrats pertinents. Les éventuels transferts et sous-traitants sont traités dans la documentation appropriée. L'audit n'a pas inspecté les régions de production : la contradiction des textes, elle, est établie.

## 13 Décrire les statistiques et la confidentialité avec précision

### Q14 Vérifier les traceurs et leur justification

**P1 · À vérifier à partir de la politique publiée.** Le texte de confidentialité évoque un identifiant pseudonymisé fondé notamment sur IP et navigateur, un stockage de session, des interactions et une conservation de 400 jours. Il mentionne aussi des outils de mesure. Le fonctionnement technique réel n'a pas été inspecté.

**Correction à instruire.** Inventorier les données émises sur les pages publiques, l'éditeur et les pages publiées : finalités, destinataires, stockage, durée et mécanisme de choix ou d'opposition. Confronter chaque outil aux conditions d'exemption applicables. L'absence de cookie ne suffit pas à décider qu'aucune règle relative aux traceurs ne s'applique ; une pseudonymisation n'est pas automatiquement une anonymisation [S5].

**Réussite.** La politique correspond au comportement réseau et au stockage observés dans un environnement de test. Les durées sont appliquées, les mécanismes nécessaires fonctionnent et les données évitables ne sont pas collectées. Ne pas ajouter arbitrairement une bannière universelle ni conclure à une illégalité sur la seule lecture du texte.

### Q20 Promesses commerciales sur les visiteurs

**P2 · Observé.** Certaines formulations promettent de savoir qui scanne, alors que les informations publiées sur le produit décrivent des statistiques agrégées et une protection de l'identité.

**Correction.** Nommer les mesures réellement disponibles : ouvertures, période, appareil, pays ou clics selon le produit. Ne pas laisser penser que le service identifie personnellement chaque visiteur. Vérifier les chiffres de performance et les formulations quantitatives des guides ; retirer les statistiques non étayées ou en donner une source pertinente.

**Réussite.** Un client comprend ce qu'il verra réellement dans son tableau de bord et les limites de cette mesure. Les pages commerciales, l'aide, la confidentialité et les intitulés des graphiques utilisent les mêmes définitions.

### Q30 Définir ce que les compteurs mesurent

**P2 · À vérifier.** Documenter la différence entre lecture optique, requête de redirection, visite de page, session estimée et clic de lien. Un serveur observe une requête ; il ne voit pas chaque ouverture de caméra. Un QR statique contenant une URL peut conduire à une page dont les visites sont mesurées.

**Réussite.** Un jeu de tests explicite le traitement des rechargements, aperçus automatiques, robots, répétitions et fuseaux horaires. Les valeurs affichées et exportées proviennent des mêmes définitions. Aucun compteur artificiel n'est ajouté pour donner une impression d'activité.

## 14 Rendre les outils QR plus fiables à comprendre

### Q21 Distinguer diagnostic et garantie

**P2 · Observé et amélioration · `/outils/testeur-qr-code`.** Un QR de contrôle noir sur blanc encodant l'adresse publique de Qrowg a été lu. Le rapport a affiché le bon contenu, un contraste de 21:1, 20 pixels par module et une marge de quatre modules. C'est un résultat positif sur ce fichier, pas une certification du moteur pour toutes les images.

L'outil conclut que le code est prêt à imprimer. Il déduit aussi de l'usage de HTTPS une ouverture sans avertissement. La présence de ce schéma ne vérifie pas à elle seule le certificat, l'accessibilité du site ou la sécurité de la destination. L'aide recommande déjà un essai papier, ce qui est utile.

**Correction.** Afficher un verdict proportionné : décodage réussi sur l'image fournie, points techniques contrôlés, puis nécessité de tester un exemplaire imprimé à la taille et à la distance prévues. Distinguer une URL syntaxiquement en HTTPS d'une destination réellement contrôlée. Si une vérification réseau est ajoutée, évaluer ses effets de confidentialité et de sécurité avant de l'activer.

**Réussite.** Tester une image valide, une image sans QR, un fichier invalide, une image volumineuse et un QR recadré. Le chargement aboutit à un résultat ou à une erreur compréhensible, et une seconde image remplace correctement la première. Confirmer dans le code et le réseau la promesse d'analyse locale.

### Textes à réconcilier dans les guides

La formulation sur un fonctionnement hors ligne doit préciser que le décodage d'un QR peut être local, mais qu'ouvrir un site nécessite une connexion. Les usages texte ou certaines données intégrées ne dépendent pas de la même manière du réseau.

Le guide sur les statistiques doit distinguer QR statique et dynamique sans affirmer qu'aucune mesure n'est possible avec une URL statique. Le guide sans inscription contient déjà des nuances utiles ; les réutiliser de façon cohérente.

### Export et impression

Le générateur public a détecté une combinaison à faible contraste et sa commande de correction a rétabli un fond clair. L'export restait disponible dans l'état signalé. Définir une règle de prévention proportionnée : avertissement visible, correction simple et confirmation explicite si le résultat demeure risqué. Vérifier la lisibilité du fichier réel, pas seulement celle de l'aperçu.

## 15 Réconcilier le rapport local et la livraison

### Q23 Build et vérifications de la bonne révision

**P1 · Rapport local et contrôles à refaire.** Le compte rendu fourni annonce 6 454 tests Vitest réussis, 22 échecs antérieurs, 57 tests ajoutés, TypeScript sans erreur et 37 scénarios Playwright réussis sur `/creer`. Il signale un environnement Supabase indisponible et un build Windows bloqué par `QrWatermark.tsx` et `qrWatermark.ts`. Ces résultats n'ont pas été exécutés par cet audit.

**Correction.** Identifier le commit auquel chaque résultat appartient. Relever les erreurs avant intervention puis après, dans les mêmes conditions. Lire le message exact du build et les imports concernés : une différence de nom et d'extension ne suffit pas à établir seule la cause. Résoudre l'ambiguïté avec des noms explicites et des imports cohérents ; utiliser un renommage intermédiaire suivi par Git si nécessaire.

Ne pas modifier les politiques PowerShell ou demander un script absent pour masquer un problème d'environnement. Utiliser les commandes présentes dans le dépôt, la version de Node et le gestionnaire de paquets attendus. Vérifier le build Windows utilisé par le développeur et le build de livraison lorsqu'ils ont des comportements différents.

**Réussite.** Build réussi sur la révision livrée, contrôles requis exécutés et rapport d'échecs restants explicite. Une réussite TypeScript ne remplace pas le build. Une affirmation selon laquelle Vercel n'est pas affecté doit s'appuyer sur un déploiement de cette même révision.

### Fichiers signalés dans le compte rendu

| Zone | Fichiers à examiner si présents |
| --- | --- |
| Classement | `apps/web/src/app/dashboard/templates/classementDesModeles.ts` et `page.tsx` |
| Secteurs | `apps/web/src/app/creer/entry.ts` |
| Aperçus | `apps/web/src/components/ui/useDialogue.ts` et `apps/web/src/lib/inerte.ts` |
| Miniatures | `apps/web/src/app/dashboard/templates/MiniApercu.tsx` |

Les chemins viennent du rapport utilisateur. Confirmer leur existence et rechercher les autres appels avant toute modification. Le marqueur de disponibilité `data-galerie="prete"` peut aider les tests, mais doit représenter un état réellement prêt et rester accompagné d'assertions fonctionnelles.

## 16 Valider les zones qui nécessitent un compte

### Q24 Parcours connecté et conservation du brouillon

**P1 · À vérifier.** Sur un environnement de test fonctionnel, utiliser des comptes autorisés pour les trois forfaits. Vérifier connexion, retour à la destination prévue, récupération du brouillon invité, galerie, éditeur, publication puis modification de la page publiée. Tester aussi lien d'authentification invalide ou expiré, déconnexion et erreur réseau. Une réussite sur `/creer` ne valide pas l'enveloppe de `/dashboard/templates` ni ses droits connectés.

**Réussite.** Aucun doublon ou écrasement silencieux, droits corrects, redirections internes contrôlées et messages utiles. Un échec de sauvegarde est visible et permet de réessayer sans perdre les saisies.

### Q25 Paiements et limites de forfait

**P1 · À vérifier en environnement de paiement de test.** Relier les droits de Q07 aux contrôles serveur. Vérifier période annuelle, montant, annulation du paiement, événement reçu plusieurs fois, événement retardé, changement de formule et fin de droits. Ne pas tirer les droits d'un simple paramètre d'URL ou d'un état client.

**Réussite.** Les événements sont traités de façon idempotente, l'interface reflète l'état serveur et une baisse de formule n'efface pas arbitrairement le contenu. Les limites et le maintien éventuel des pages sont explicités. Aucun paiement réel n'est requis pour ces validations.

### Q26 Permissions et données entre utilisateurs

**P1 · À vérifier dans le dépôt et sur des données de test.** Examiner les contrôles de propriété et les politiques RLS pour pages, médias, QR, statistiques et domaines. Tester qu'un compte A ne peut pas lire ou modifier les objets privés de B en changeant un identifiant. Examiner les secrets exposés au client, les protocoles de liens autorisés et les chemins d'upload réellement utilisés.

**Réussite.** Les opérations non autorisées échouent côté serveur, les secrets restent côté serveur et les entrées risquées sont traitées au bon endroit. L'audit public n'a découvert ni démontré une vulnérabilité ; il définit les contrôles nécessaires au produit.

### Q29 Impression et domaines personnalisés

**P2 · À vérifier.** Tester le support réellement exporté, ses dimensions, polices, marges et résolution, puis scanner un exemplaire imprimé. Vérifier les états de domaine en attente, validé et en erreur, l'isolation des comptes et le retour au domaine par défaut.

**Réussite.** Le fichier respecte les réglages et le QR reste valide après modification autorisée de sa destination. Les opérations de domaine ne détournent pas un domaine appartenant à un autre compte et fournissent une consigne DNS compréhensible.

## 17 Vérifier mobile accessibilité et performance

### Q27 Essais mobiles et parcours au clavier

**P1 · À vérifier.** Aucun essai sur un véritable téléphone ni sur une fenêtre mobile redimensionnée n'est revendiqué ici. Le rapport local fourni mentionne des tests mobiles, mais ceux-ci restent à rattacher à la version livrée.

**Protocole.** Examiner 360, 390 et 430 px, puis tablette et bureau. Tester le clavier logiciel, le bas de l'écran, l'orientation, les zones protégées par le système, les panneaux et les dialogues. Le contenu ne doit pas devenir inaccessible derrière une barre fixe. Vérifier les retours arrière et la conservation du contexte.

Pour l'accessibilité, parcourir sans souris la recherche, les filtres, les cartes, l'aperçu, les champs et les actions de l'éditeur. Vérifier le focus visible, l'ordre de lecture, les erreurs, les états sélectionnés et les annonces de résultat. Mesurer les contrastes avec les couleurs calculées. Les contrôles automatiques complètent ce parcours ; ils ne le remplacent pas.

**Réussite.** Créer et modifier une page reste possible sur Safari iOS et Chrome Android. La sélection d'un modèle, la fermeture d'un dialogue et les actions critiques fonctionnent sans survol. Documenter appareil, navigateur, dimensions et résultat réel ; une vue réduite dans une capture desktop ne constitue pas un test mobile.

### Q28 Mesurer puis optimiser

**P2 · À vérifier.** Aucun score Lighthouse, Core Web Vitals ou poids de bundle n'a été mesuré pendant cet audit. Les miniatures utilisant le rendu réel peuvent avoir un coût ; celui-ci doit être quantifié avant d'ajouter une optimisation complexe.

**Protocole.** Mesurer accueil, galerie, page publiée et éditeur dans des conditions explicites. Distinguer chargement initial, navigation et interaction avec filtres ou blocs. Vérifier dimensions réservées aux images, polices, import des blocs, requêtes tierces et rendu des cartes hors écran.

**Réussite.** Fixer les budgets après un état initial reproductible et corriger les principales causes mesurées. À titre de référence, les seuils recommandés au 75e percentile pour les Core Web Vitals sont LCP ≤ 2,5 s, INP ≤ 200 ms et CLS ≤ 0,1 [S6]. Un score de laboratoire isolé ne démontre pas ces résultats pour les visiteurs.

L'amélioration ne doit pas transformer l'aperçu en miniature fausse, masquer une erreur de rendu ou supprimer une fonctionnalité utilisée.

## 18 Exécuter les corrections par lots

| Lot | Travail | Preuve attendue |
| --- | --- | --- |
| 0 | Lire les règles du dépôt, relever la révision et les écarts de déploiement | Inventaire, état initial et suivi créé |
| 1 | Q01 puis contrôles de sauvegarde associés | Reproduction réparée avant et après rechargement |
| 2 | Q02 à Q05, Q15 et Q17 | Modèle trouvé, aperçu correct, choix conservé |
| 3 | Q06 à Q08 et validation Q25 | Montants cohérents et parcours QR continu |
| 4 | Q09, Q10, Q16, Q18, Q19 et Q27 | Parcours au clavier et mobile documentés |
| 5 | Q11 à Q14 et Q20 à Q22 | Textes conformes aux faits, données manquantes identifiées |
| 6 | Q23, Q24, Q26, Q28 à Q30 | Build, scénarios connectés et bilan final |

Les contrôles de permissions et de paiement doivent accompagner les changements qui les concernent, même s'ils figurent dans la validation finale. Une dépendance indisponible ne bloque que les tickets qui en ont réellement besoin.

### Suivi persistant dans le dépôt

Créer `AUDIT_QROWG_SUIVI.md` avec, pour chaque ticket : priorité, statut, révision, reproduction, cause confirmée, fichiers modifiés, preuve et blocage éventuel. Ajouter une section courte Prochaine action pour reprendre après compactage sans relire tout l'historique.

Lire ce dossier par sections utiles au lot courant. Éviter de coller le dossier entier à chaque échange. Conserver les sorties volumineuses de tests dans des fichiers et n'en résumer que les résultats et les erreurs pertinentes.

### Discipline de modification

Réutiliser les composants existants, préserver les changements de l'utilisateur et limiter chaque lot à des causes identifiées. Ne pas remplacer une logique centrale par des correctifs spécifiques à quelques captures. Les tests doivent vérifier le comportement, pas seulement le nom d'un fichier ou le texte d'une implémentation.

Une information commerciale ou juridique absente doit être demandée précisément après les travaux réalisables. Aucune identité d'entreprise, promesse de sécurité, statistique client ou condition de forfait ne doit être inventée pour remplir un écran.

La livraison du travail local comprend les changements vérifiables et le bilan. Le déploiement en production est une étape distincte, à effectuer seulement lorsqu'il est autorisé.

## 19 Scénarios de réception

Les cases suivantes décrivent des résultats à produire par Claude Code. Elles ne sont pas cochées par cet audit.

| Scénario | Attendu vérifiable | Tickets |
| --- | --- | --- |
| Modèle puis première modification et Annuler | Seule la modification est annulée ; structure et titre conservés | Q01 |
| Même essai après rechargement | Historique attaché au brouillon chargé | Q01 |
| Filtrer Bar puis rechercher Café | Modèles pertinents présents et compteurs cohérents | Q02 |
| Ouvrir deux aperçus successifs | Début visible, focus approprié, sortie par Échap | Q03 |
| Utiliser un exemple précis | Même modèle retrouvé jusqu'au brouillon | Q04 |
| Partir de Hôtel ou Artisan | Arrivée liée à l'activité choisie | Q05 |
| Choisir une formule annuelle | Même montant et même période jusqu'au paiement de test | Q06, Q25 |
| Télécharger un QR invité | Résultat conforme au contrat ; saisie conservée si identification | Q08 |
| Remplir au clavier | Champs nommés, erreurs liées et focus visible | Q09, Q10 |
| Connecter puis publier un brouillon | Pas de doublon, contenu fidèle, droits appliqués | Q24 |
| Accéder à l'objet privé d'un autre compte | Refus côté serveur sur données de test | Q26 |
| Exporter et imprimer un support | Fichier ouvert, dimensions justes et QR décodé | Q29 |

### Bilan de livraison demandé

Lister les tickets corrigés avec leurs preuves, ceux déjà réparés avant intervention, ceux qui restent bloqués et les améliorations différées. Donner les commandes réellement exécutées, leurs résultats et la révision concernée. Nommer les erreurs antérieures encore présentes et leur impact.

Une capture sert à vérifier la présentation ; une assertion de comportement sert à vérifier un parcours ; un build valide l'assemblage. Choisir la preuve adaptée à chaque conclusion et ne pas extrapoler un résultat local à une version de production différente.

## 20 Inventaire des pages examinées

### Principaux écrans et outils

Accueil `/`, fonctionnalités `/features`, tarifs `/upgrade`, exemples `/examples`, démonstration `/examples/resto_bar`, création `/creer` avec contexte métier, éditeur invité `/dashboard/builder?draft=1`, QR par lien `/dashboard/qr-link`, générateur `/generateur-qr-code`, connexion `/auth/login`, index `/guides`, `/qr-code` et `/outils`, calculateur `/outils/taille-qr-code`, testeur `/outils/testeur-qr-code`, contact `/contact`, sécurité `/security`, mentions `/legal`, confidentialité `/privacy` et conditions `/terms`.

Les pages de confidentialité et de conditions ont été consultées par leur contenu public récupéré ; cela n'équivaut pas à un test de leurs interactions. La connexion a été inspectée sans saisie d'identifiants. Le tableau de bord authentifié et la galerie connectée n'ont pas été validés.

### Pages métiers et usages

Sous `/qr-code/`, contrôle structurel des 26 pages : restaurant, menu, food-truck, boulangerie, bar, avis-google, whatsapp, sms, cv, carte-de-visite, wifi, instagram, pdf, association, musique, evenement, immobilier, hotel, camping, salon, boutique, artisan, paiement, garage, pharmacie et fleuriste.

### Guides

Sous `/guides/`, contrôle structurel des 12 pages : qr-code-dynamique-vs-statique, comment-creer-un-qr-code, comment-scanner-un-qr-code, personnaliser-qr-code, taille-qr-code-impression, qr-code-scannable, qr-code-avec-statistiques, duree-de-vie-qr-code, qr-code-ne-fonctionne-pas, ou-placer-son-qr-code, qr-code-rgpd et qr-code-gratuit-sans-inscription.

### Limites à conserver dans tout compte rendu

Le dépôt local, les secrets et réglages de production n'étaient pas accessibles. Aucun test de charge, audit de dépendances, pentest, paiement, contrôle des politiques RLS ou certification d'accessibilité n'a été réalisé. Aucun compte, message de contact ou contenu public n'a été créé. Un brouillon de test a servi aux interactions invitées.

L'absence d'erreur dans une inspection structurelle ne signifie pas que toute la page est sans défaut. Inversement, un blocage de l'outil d'audit ou de l'environnement ne suffit pas à conclure à un défaut du produit.

## 21 Références et preuves

Les constats produit proviennent des pages Qrowg examinées et des interactions décrites dans les tickets. Les routes sont relatives à `https://qrowg.com`. Les quatre captures du document Word correspondent aux filtres, à l'aperçu, à l'annulation et aux tarifs observés le 29 septembre 2026. Le compte rendu local fourni par l'utilisateur est une source distincte, identifiée comme telle en section 15.

Les références suivantes servent aux critères et aux vérifications ciblées. Elles ne constituent pas une certification du site.

**S1 — W3C, libellés et instructions de formulaire.**

https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html

**S2 — W3C, taille minimale des cibles dans WCAG 2.2.**

https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

**S3 — Service Public Entreprendre, mentions obligatoires selon la situation de l'entreprise.** Vérifier la fiche adaptée au statut réel du responsable.

https://entreprendre.service-public.fr/vosdroits/F37351

**S4 — Commission européenne, fermeture de la plateforme ODR.**

https://consumer-redress.ec.europa.eu/site-relocation_en

**S5 — CNIL, conditions applicables à la mesure d'audience et aux traceurs.**

https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience

https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ

**S6 — Google web.dev, définitions et seuils des Core Web Vitals.**

https://web.dev/articles/vitals

### Versions et application technique

Les choix d'implémentation doivent suivre les versions réellement installées. Le comportement d'`inert`, du rendu dynamique et des dialogues doit être vérifié dans le DOM final et au clavier. Aucune recommandation de ce dossier ne justifie une montée de version générale sans besoin démontré.

Pour réviser l'audit plus tard, conserver la date, la révision et l'environnement de chaque preuve. Fermer un ticket quand le critère attendu est démontré sur la version à livrer.
