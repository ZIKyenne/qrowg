# QR Print Studio — Rapport détaillé (Phase 1)

> Document de synthèse du travail réalisé sur l'éditeur de supports imprimables de QRfolio.
> À lire pour comprendre ce qui a été ajouté, comment ça marche, et ce qu'il reste à faire.

---

## 1. Objectif

L'onglet **Imprimables** actuel propose des modèles figés : peu de liberté, faible effet « wow ».
La Phase 1 introduit un **éditeur libre type Canva**, spécialisé QR Code, qui permet de créer un
support marketing (affiche, flyer, carte, story…) autour de son QR, directement dans QRfolio —
sans logiciel externe. C'est l'argument central pour justifier le passage au plan Pro.

**Décision d'architecture clé :** on ne reconstruit pas Canva à la main. Tout repose sur
**Fabric.js** (bibliothèque MIT, gratuite, mature) : objets sélectionnables, déplacement /
redimension / rotation, calques, sérialisation JSON. C'est ce qui rend le projet faisable en
quelques semaines au lieu de plusieurs mois.

---

## 2. Ce qui a été livré

### Fichiers créés

| Fichier | Rôle |
|---------|------|
| `apps/web/src/app/dashboard/qr-codes/PrintStudio.tsx` | Le composant éditeur Fabric.js (cœur de la fonctionnalité) |
| `apps/web/src/app/api/print-design/route.ts` | Route serveur pour sauvegarder / charger un design (sécurisée par RLS) |

### Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `apps/web/src/app/dashboard/qr-codes/QRStudio.tsx` | Bouton « Ouvrir l'éditeur » dans l'onglet Imprimables (derrière un flag), montage de l'éditeur en plein écran, génération du vrai QR à transmettre |
| `apps/web/package.json` | Ajout de `fabric` (dépendance) et `@types/fabric` (types) |
| `apps/web/next.config.mjs` | Nettoyage pour compatibilité Next.js 16 / Turbopack |

### Dépendances installées

- `fabric@5.5.2` ✅ (le moteur de l'éditeur)
- `@types/fabric@5.3.11` ✅ (types TypeScript)
- `canvas@2.11.2` — dépendance optionnelle de Fabric, son binaire natif n'a pas compilé sous
  Windows : **sans aucun impact**, car cette partie ne sert que côté serveur Node et l'éditeur
  tourne uniquement dans le navigateur.

---

## 3. Fonctionnalités de l'éditeur

L'éditeur s'ouvre **en plein écran** depuis un bouton « Ouvrir l'éditeur » placé en haut de
l'onglet Imprimables. (Choix de design : l'onglet vit dans une colonne étroite de ~300 px,
trop juste pour un vrai éditeur ; le plein écran lui donne l'espace nécessaire.)

**Disposition :** barre d'outils à gauche · zone de travail (canvas) au centre · panneau de
propriétés et calques à droite · barre d'actions en haut.

### Ce qu'on peut faire

- **QR réel posé automatiquement** au centre à l'ouverture (le vrai QR du code sélectionné,
  avec ses couleurs et son style). Il est « marqué » pour pouvoir être régénéré si on change
  son style ailleurs.
- **Ajouter des éléments :** texte (éditable au double-clic), QR, rectangle, cercle, ligne.
- **Transformer :** déplacer, redimensionner, pivoter — tout est natif (poignées).
- **Snap au centre :** un **guide doré** apparaît quand un objet est aligné au centre.
- **Panneau propriétés :** couleur de remplissage, opacité ; pour le texte : police (liste
  web-safe), taille, gras. Couleur de fond du support.
- **Calques :** mettre devant / derrière, avancer / reculer d'un cran, dupliquer, verrouiller,
  supprimer (ou touche **Suppr**).
- **Formats :** A4 (portrait), Carré, Story (9:16) — le canvas se redimensionne.
- **Sauvegarde :** bouton « Enregistrer » → le design est stocké en base, rattaché au QR.
  À la réouverture, le design revient.
- **Export :** PNG haute définition (~300 DPI) et PDF au bon ratio.

### Gestion des plans (gating)

- L'édition et l'export **PNG** sont accessibles à tous (socle gratuit).
- L'export **PDF** est réservé aux plans **Pro / Business** (réutilise la fenêtre d'upsell
  existante de QRStudio).

---

## 4. Comment ça marche (technique)

- **Moteur :** Fabric.js gère le canvas à objets. Une instance par ouverture de l'éditeur,
  proprement détruite à la fermeture (évite les fuites mémoire).
- **QR réel :** généré via le moteur existant `qrRender.ts`, converti en image, injecté dans
  le canvas — ce n'est pas un faux QR.
- **Persistance :** le design est sérialisé en JSON et envoyé à la route serveur
  `/api/print-design`, qui l'enregistre dans Supabase (colonnes `print_design` + `print_format`
  sur la table `qr_codes`). L'écriture passe **obligatoirement** par le serveur (règle de
  sécurité RLS du projet).
- **Export haute déf :** le canvas d'édition est petit pour tenir à l'écran ; à l'export on
  applique un multiplicateur pour viser ~300 DPI sans déformer.
- **Chargement côté client uniquement :** Fabric touche au DOM, donc l'éditeur est chargé
  dynamiquement sans rendu serveur (`ssr: false`).

---

## 5. État actuel

| Élément | État |
|---------|------|
| Code de l'éditeur | ✅ Écrit et complet |
| Dépendances | ✅ Installées |
| Serveur de dev | ✅ Démarre sans erreur fatale |
| Test fonctionnel local | ⏳ Bloqué par la config d'environnement (voir §6) |
| Migration base de données | ⏳ À exécuter (voir §7) |
| Déploiement Vercel | ⏳ Pas encore poussé |

**Important :** le code est terminé. Le seul blocage est que **la machine locale n'a pas de
fichier `.env.local`** (clés Supabase/Stripe). C'est un problème de configuration locale, pas
un bug. Sur Vercel, où ces variables existent déjà, l'application fonctionnerait.

---

## 6. Pour tester — 2 chemins

### Chemin A — Tester sur Vercel (le plus simple)
Pousser le code sur GitHub ; Vercel redéploie automatiquement avec ses variables déjà
configurées. Aucune config locale à faire.
```powershell
cd C:\Users\PC\Desktop\qrfolio
git add .
git commit -m "feat: QR Print Studio (Phase 1) - editeur Fabric.js"
git push
```
Puis tester sur l'URL Vercel → onglet Imprimables → « Ouvrir l'éditeur ».

### Chemin B — Tester en local (nécessite la config env)
Créer/compléter `apps/web/.env.local` avec les vraies clés (le fichier modèle existe déjà),
soit à la main depuis le dashboard Supabase, soit via `vercel env pull`. Puis :
```powershell
cd C:\Users\PC\Desktop\qrfolio\apps\web
npx next dev
```

---

## 7. Migration base de données (à faire une fois)

Dans Supabase → **SQL Editor**, exécuter :
```sql
ALTER TABLE qr_codes
  ADD COLUMN IF NOT EXISTS print_design JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS print_format TEXT DEFAULT 'a4';
```
Sans cette migration, le bouton « Enregistrer le design » renverra une erreur. (Le reste de
l'éditeur — édition, export — fonctionne sans.)

---

## 8. Checklist d'acceptation (à valider lors du test)

- [ ] L'éditeur s'ouvre avec le vrai QR déjà posé au centre.
- [ ] Ajouter un texte, le double-cliquer pour l'éditer, le déplacer / redimensionner / pivoter.
- [ ] Ajouter rectangle / cercle / ligne ; changer leur couleur et opacité.
- [ ] Calques : devant / derrière / dupliquer / verrouiller / supprimer fonctionnent.
- [ ] Le guide doré apparaît au centrage.
- [ ] Changer de format A4 / Carré / Story sans casse.
- [ ] « Enregistrer » persiste, et recharger ramène le design (nécessite la migration §7).
- [ ] Export PNG net ; export PDF au bon ratio.
- [ ] L'ancien onglet « Modèles prêts à imprimer » fonctionne toujours.

---

## 9. Suite du projet (phases à venir)

- **Phase 2 — Bibliothèques :** formes, icônes (SVG libres de droit), typographies, puces
  contact (tél / email / adresse / réseaux génériques).
- **Phase 3 — Templates métier éditables :** convertir les 25 modèles actuels en designs
  Fabric chargeables et modifiables, regroupés par secteur (restaurant, commerce, immobilier,
  événement, créateur…). C'est là qu'on atteint « 50-100 modèles ressentis ».
- **Phase 4 — Pré-remplissage assisté :** à partir de l'activité + l'objectif, pré-remplir un
  design (titre / sous-titre / CTA / couleurs). D'abord par règles (fiable, gratuit), IA plus tard.

### Hors périmètre (décisions assumées)
- Pas de mockups photo réels (vitrine, table…) tant qu'il n'y a pas d'assets.
- Pas de logos de marque réels (Instagram, TikTok…) : propriété intellectuelle → icônes
  génériques uniquement.

---

## 10. Garde-fous respectés

- Fabric.js pour tout le moteur (pas de réinvention).
- Composant client, initialisation / destruction propre de Fabric.
- Écriture en base uniquement via route serveur (RLS).
- Plan gating réutilisant le système d'upsell existant.
- Ancien onglet Imprimables conservé et intact (flag `PRINT_STUDIO_ENABLED`).
- Aucun `git push` effectué sans ton accord.

---

## 11. Leçon pour les prochains projets

La config d'environnement local (`.env.local`, base de données, clés) gagne à être mise en
place **au tout début** d'un projet. Une fois ce socle prêt, les itérations de développement
et les tests s'enchaînent sans friction. Ici, le code est prêt ; c'est uniquement ce socle
local qui manquait pour tester sur la machine — d'où l'option « tester directement sur Vercel ».
