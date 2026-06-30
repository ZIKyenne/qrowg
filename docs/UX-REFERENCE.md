# QRfolio — Dossier de référence UX

> **La boussole.** Avant de coder un écran, on le confronte à ce document.
> Règle unique : **1 écran = 1 objectif + 1 action primaire.**

Statut : vivant. Mettre à jour quand une page change de structure.
Dernière révision : 2026-06-30.

---

## 1. Philosophie

QRfolio n'est pas un logiciel qui **montre** ses possibilités.
C'est un assistant qui **guide**.

- Montrer **peu**, mais **au bon moment**.
- Poser une question → guider → passer à la suivante.
- Le design est mature (identité 9,4 / UI 9). Le levier restant est le **Product Design** : architecture UX, hiérarchie, expérience intelligente.

Trois axes de travail (90 % de l'effort) :
1. **Architecture UX** — réduire les décisions visibles : accordéons, bottom sheets, parcours guidés.
2. **Hiérarchie** — une seule action primaire par écran ; moins de cartes concurrentes ; moins de CTA rouges ; aperçus (QR, avatar, templates) compacts.
3. **Expérience intelligente** — remplacer les états vides par des conseils ; recommandations contextuelles selon l'état réel.

---

## 2. Principes transverses

| Principe | Règle concrète |
|----------|----------------|
| **Une action primaire** | Un seul bouton plein/accent par écran. Le reste est secondaire (fantôme) ou replié. |
| **Moins de cartes** | Fusionner les blocs voisins. Si deux cartes se touchent et parlent du même sujet → une seule. |
| **Hauteurs réduites** | Chaque section peut perdre 20-35 % de hauteur. Resserrer paddings et interlignes. |
| **Accordéons** | Tout ce qui est « avancé » est replié, **une seule section ouverte** à la fois. |
| **Aperçus, pas posters** | QR, avatar, template = aperçu compact. Jamais le héros de l'écran ; l'action prime. |
| **États vides intelligents** | Une seule belle carte : illustration + une phrase + un CTA. Jamais une pile de cartes vides. |
| **Texte court** | Une phrase suffit. On montre, on n'explique pas. |
| **Reco contextuelle** | Quand c'est pertinent : *icône + une phrase + un seul CTA*, choisi selon l'état réel. |

---

## 3. La grammaire « assistant »

Partout, la recommandation contextuelle suit **le même patron** :

```
[icône/emoji]  Une phrase qui dit la prochaine étape.      [ CTA unique → ]
```

- **Une seule** reco visible à la fois par écran.
- Choisie par l'**état réel** (données, pas hasard).
- **Disparaît** quand elle n'a plus lieu d'être (objectif atteint).
- Fond accent discret, jamais rouge (le rouge = alerte/quota uniquement).

Implémentée sur : **Dashboard, QR Studio, Analytics, Templates, Profil**.

---

## 4. Référence par écran

Pour chaque écran : **Objectif** (la mission unique) · **Action primaire** · **Secondaire / replié** · **Reco assistant** · **Spécifique mobile**.

### Dashboard — `/dashboard`
- **Objectif** : savoir où j'en suis et quoi faire ensuite.
- **Action primaire** : la prochaine étape du moment (varie selon l'état).
- **Secondaire** : stats, raccourcis, activité.
- **Reco assistant** :
  - 0 page/0 scan → checklist « Premiers pas » (onboarding).
  - Parcours normal → ➕ *Créez une 2ᵉ page* / 🖨️ *X scans, créez un support*.
  - Quota proche/atteint → ⚠️ alerte vues + Passer Pro (rouge = alerte).
- **Mobile** : onboarding réduit à l'étape en cours (barre X/3) ; CTA pleine largeur.
- **Cockpit** : les 4 KPI ont été fusionnés en un bloc unique (Scans totaux = héro 44px ; Vues / Pages / Publiées = stats secondaires). ✅

### Templates — `/dashboard/templates`
- **Objectif** : choisir le bon modèle pour mon métier, vite.
- **Action primaire** : **Utiliser** le template recommandé / sélectionné.
- **Secondaire / replié** : filtres (secteur + plan), recherche, favoris.
- **Reco assistant** : bandeau **« Recommandé pour vous »** (basé sur les `template_id` des pages existantes ; modèle de démarrage si aucune page). Masqué pendant recherche/filtre.
- **Mobile** : filtres rangés dans un **bottom sheet** (bouton « Filtrer » + résumé du filtre actif). Carrousel scroll-snap. Modal d'aperçu empilé.

### QR Studio — `/dashboard/qr-codes`
- **Objectif** : personnaliser **et exporter** un QR.
- **Action primaire** : **Télécharger** (dominant). *Tester* juste avant.
- **Secondaire / replié** : options d'export, scènes, actions secondaires, onglets Style/Supports/Télécharger.
- **Reco assistant** : selon l'état du QR — *Publiez votre page* / *Aucun scan : testez* / *X scans : passez Pro* / *X scans : créez un support*.
- **Aperçu** : QR ≤ 260px (compact), bouton **Agrandir**. Le QR n'est pas le héros.
- **Mobile** : 2 écrans séparés **Liste ↔ Éditeur** (bouton retour). Hiérarchie : Nom → Score → Reco → Actions → QR. Parcours « Étape X/3 ».

### Analytics — `/dashboard/analytics`
- **Objectif** : comprendre comment mon QR performe.
- **Action primaire** : lire la synthèse (puis explorer le détail).
- **Secondaire** : graphes (devices, sources, évolution, top pays).
- **Reco assistant** : **synthèse narrative** en tête — *Votre trafic augmente / ralentit · X scans sur 30j, surtout via SOURCE sur APPAREIL · pic vers Xh* (calculée des vraies données).
- **État vide** : une seule carte pédagogique (pas de graphes vides). Aperçu de démo dessous.
- **Repli** : par défaut synthèse + KPIs + graphe principal (220px) ; tout le détail derrière **« Voir l'analyse complète »**. ✅

### Profil — `/dashboard/profile`
- **Objectif** : gérer mon identité et mon compte.
- **Action primaire** : compléter / enregistrer mon identité.
- **Secondaire / onglets** : Abonnement, Sécurité, Données, Préférences, Parrainage.
- **Reco assistant** : complétion par priorité — *Avatar QR-art → Identifiant → Bio → Site web*. Disparaît quand complet.
- **Mobile** : onglets scrollables ; éviter le hero trop haut.

### Avatar Studio — `/dashboard/avatar`
- **Objectif** : composer un avatar QR-art et l'enregistrer.
- **Action primaire** : **Enregistrer sur mon profil**.
- **Secondaire** : Télécharger PNG/SVG, Partager.
- **Aperçu** : compact (≤ 200px desktop, 148px mobile).
- **Mobile** : aperçu **collant en haut** (sticky) + actions, réglages qui défilent dessous (logique Canva). Bouton **← Retour au profil**.

### Print Studio — `/dashboard/qr-codes` → Print Studio
- **Objectif** : produire un support imprimable (affiche, flyer, sticker).
- **Action primaire** : exporter le support (PDF/haute qualité).
- **Statut produit** : sous-exploité — devrait devenir une **partie entière** du produit, pas une extension.
- **Mobile** : édition non disponible → écran premium « à utiliser sur ordinateur » (mockup éditeur + retour).

---

## 5. Règles mobile (déjà appliquées)

- Pas d'**overflow horizontal** ; `overflow-x:hidden` global.
- **Bottom nav** : safe-area iPhone (`env(safe-area-inset-bottom)`), icônes 21px, zones tactiles ≥ 44px ; le contenu réserve la place.
- **Cibles tactiles** ≥ 44px ; boutons hauteur ~48px.
- **Bottom sheets** pour les filtres/options denses (fond assombri, poignée, bouton d'application, safe-area).
- **Aperçus compacts** + bouton « Agrandir » plutôt qu'un aperçu plein écran.
- **Accordéons** pour les réglages avancés ; une seule action principale visible.
- Padding écran ~16-20px ; espacement cartes ~16px ; coins 16-24px ; contraste AA mini.

---

## 6. Checklist nouvel écran

Avant de livrer un écran, vérifier :

- [ ] Je peux nommer **son objectif unique** en une phrase.
- [ ] Il y a **une seule** action primaire (un seul bouton accent/plein).
- [ ] Les options avancées sont **repliées** (accordéon / bottom sheet).
- [ ] Les aperçus (QR/avatar/template) sont **compacts**, l'action prime.
- [ ] Les états vides = **une** carte (illustration + phrase + CTA).
- [ ] S'il y a une reco, elle suit la **grammaire assistant** et disparaît quand inutile.
- [ ] Mobile : pas plus de **2 écrans** pour accomplir l'action ; pas d'overflow ; safe-area OK.
- [ ] La couleur d'accent (`--accent`) est respectée (pas de doré codé en dur).

---

## 7. Dette UX connue (backlog)

1. ~~**Dashboard** : fusionner les KPI en un cockpit unique.~~ ✅ fait (cockpit 1 héro + 3 stats).
2. ~~**Analytics** : réduire les graphes + « Voir l'analyse complète ».~~ ✅ fait.
3. **Print Studio** : en faire un pilier produit (pas une extension).
4. Réduire les hauteurs partout (-20 à -35 %). 🟡 en cours — fait : cockpit Dashboard, Analytics replié, hero Profil (-28 %). Restent : headers Templates/Analytics si besoin.
5. Étendre l'IA contextuelle (suggestions de thème, d'horaire de partage, d'upsell intelligent).
