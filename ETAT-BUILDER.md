# QRfolio — État du Builder (référence complète)

> Document généré le 2026-07-08. Décrit **toutes les fonctionnalités actuelles** du builder de pages.
> Chiffres clés : **142 blocs** · **10 catégories** · **~150 thèmes** · **195 tests verts** · `tsc` 0 erreur · build OK.

---

## 1. Vue d'ensemble

QRfolio est un SaaS de création de **pages professionnelles mobiles** (type « link in bio ») reliées à des **QR codes dynamiques**, avec analytics et messagerie.

**Stack** : Next.js 16 (App Router) · React 19 · TypeScript · Supabase (auth + Postgres + storage) · styles **inline** (pas de Tailwind) · pnpm monorepo · Vitest.

**Fichiers cœur du builder**
- `apps/web/src/app/dashboard/builder/BuilderV4.tsx` — l'éditeur complet (canvas, panneaux, aperçu).
- `apps/web/src/app/dashboard/builder/types.ts` — définitions des blocs, thèmes, presets, **helpers purs testés**.
- `apps/web/src/app/[slug]/PublicPageClient.tsx` — le rendu de la page publique.
- Parité stricte : le même helper pur (dans `types.ts`) sert l'aperçu builder **et** la page publique.

---

## 2. Les 10 catégories de blocs (142 au total)

| Catégorie | Blocs | Rôle |
|---|---|---|
| 👤 **Identité** | 11 | Profil, présentation |
| ⚡ **Actions** | 21 | Boutons, liens, CTA |
| 📲 **Réseaux** | 10 | Liens réseaux sociaux |
| 🛍️ **Commerce** | 22 | Produits, tarifs, promo |
| 🎬 **Médias** | 12 | Images, vidéos, galeries, audio |
| 📋 **Infos** | 18 | Contenu informatif (voir §3) |
| 🏢 **Business** | 12 | Adresse, horaires, contact |
| 🎵 **Musique** | 12 | Spotify, plateformes, concerts |
| 🎉 **Event** | 12 | Compte à rebours, programme, billetterie |
| 📐 **Mise en page** | 12 | Espaceurs, sections, colonnes, embed |

### Inventaire complet

**Identité (11)** — Profil · Bio · Compétences · Bannière/Cover · À propos · Disponibilité · Parcours · Expertises · Langues · Certifications · Entreprise

**Actions (21)** — Bouton CTA · Calendly · Appeler · Itinéraire · Barre d'actions (mobile) · WhatsApp · Email · Télécharger un fichier · Ajouter aux contacts (vCard) · Laisser un avis Google · Réserver une table · Commander en ligne · Cadeau gratuit · Faire un don · Multi CTA · Télécharger l'application · Coupon promo · Offre limitée · Prendre rendez-vous · Paiement direct · Demander un devis

**Réseaux (10)** — Réseaux sociaux · Réseau mis en avant · Instagram Feed · TikTok Feed · Chaîne YouTube · Twitch Live · Discord · Telegram · Podcast · Liens favoris

**Commerce (22)** — Produit · Tarifs · Bannière promo · Menu/Carte · Liste de services · Catalogue produits · Produit vedette · Comparatif offres · Packs/Formules · Avant/Après · Réalisations · Avis clients · Statistiques business · Partenaires/Clients · Marques distribuées · Bon cadeau · Liste de prestations · Boutique externe · Liste des avantages · Garantie/Réassurance · Compteur de ventes · Produits populaires

**Médias (12)** — Image · Galerie photos · Vidéo · Carrousel d'images · Avant/Après média · Vidéo locale · Lecteur audio · PDF Viewer · Galerie YouTube · Galerie TikTok · Témoignages vidéo · Logo/Marques

**Business (12)** — Adresse/Maps · Horaires · Formulaire contact · Formulaire réservation · Carte Google Maps · Demande de devis · Contact rapide · Multi-contact · Zone d'intervention · Informations légales · Certifications pro · Services sur place

**Musique (12)** — Spotify · Plateformes musicales · Lecteur Spotify · Dernière sortie · Discographie · Album · Playlist · Concerts à venir · Billetterie · Pré-save · Demande de booking · Merchandising

**Event (12)** — Compte à rebours · Infos événement · Programme · Billetterie événement · Invités/Artistes · Line-up · Plan d'accès · Formulaire d'inscription · RSVP · Ajouter au calendrier (.ics) · Nombre de participants · Places restantes

**Mise en page (12)** — Séparateur · Espacement · Bloc QR Code · Hero Banner · Bannière de section · Colonnes · Grille · Section · Embed (iframe) · Onglets · Accordéon · Encadré info

---

## 3. Zoom : la catégorie **Infos** (18 blocs)

La catégorie phare, refondue en profondeur pour être la « bibliothèque de contenu » façon Notion.

### Les 18 blocs
Titre · Texte · **FAQ** · Témoignages · Compteur de vues · **Documents** · Statistiques · Compteur (preuve sociale) · **Timeline** · Étapes/Processus · Valeurs · **Équipe** · Engagements · Badge de confiance · Citation · **Annonce/Alerte** · Tableau d'infos · Message du fondateur

### Sous-catégories (panneau organisé façon Notion)
1. **Présentation** — Titre, Texte, Citation, À propos, Annonce
2. **Organisation** — Étapes, Timeline, Valeurs, Engagements
3. **Preuves & confiance** — Témoignages, Statistiques, Badge de confiance, Compteur de vues, Compteur de scans
4. **Entreprise** — Équipe, Message du fondateur, Tableau d'infos
5. **Informations pratiques** — Horaires, Carte, Zone desservie, Services sur place *(empruntés à Business)*
6. **Questions fréquentes** — FAQ
7. **Documents** — Documents, Télécharger un fichier
8. **Informations légales** — Mentions légales, Certifications pro

> Les blocs « empruntés » restent aussi dans leur catégorie d'origine — ils sont juste rendus découvrables ici.

### 8 modèles par métier (1 clic → section complète)
Restaurant/Bar · Entreprise · Freelance · Coach/Formation · Artisan · Association · Immobilier · Événement

### Blocs Infos premium (détail)
- **FAQ** — recherche instantanée, filtres par catégorie (onglets), 3 styles (Accordéon/Compact/Cartes), sous-titre, lien par question, jusqu'à 8 questions, accordéon animé accessible.
- **Documents** — bibliothèque jusqu'à 6 fichiers, 9 types (PDF/Menu/Brochure/Notice/Catalogue/Guide/Tarifs/Contrat-CGV/Autre) avec icône+couleur dédiée, bouton « Télécharger/Consulter » intelligent, tracké.
- **Horaires** (Business, surfacé ici) — mode simple **ou jour-par-jour** (coupure déjeuner), **statut en direct** : Ouvert · **Ferme bientôt** (≤30 min) · **Ouvre demain / tel jour** · Fermé ; jour du jour surligné ; bannière exception/congés.
- **Équipe** — 4 membres, contacts par membre (téléphone → `tel:`, email → `mailto:`, LinkedIn), disposition Liste ou Grille.
- **Timeline** — disposition Verticale ou Horizontale (défilement snap), emoji par étape, 5 étapes.
- **Annonce/Alerte** — 5 types (Information/Succès/Attention/Urgent/Promo) avec **icône + couleur automatiques**, couleurs douces (jamais agressives), couleur personnalisée, bouton optionnel, **fermeture par le visiteur** (mémorisée), **fenêtre de dates** (afficher à partir de / masquer après, ré-évaluée en direct), styles Détaillé/Compact.
- **Compteurs** — « Compteur de vues » affiche le **vrai** nombre de vues ; « Compteur preuve sociale » = chiffre configurable.

---

## 4. Système de style universel (par bloc)

Chaque bloc — **toutes catégories** — peut recevoir une apparence, via des clés réservées `__` (opt-in, **inerte par défaut** = aucune régression). Helper pur `blockDecoration` appliqué aux **3 surfaces** : canvas, aperçu mobile, page publique.

### Panneau d'édition à 4 onglets
| Onglet | Contenu |
|---|---|
| **Contenu** | Champs du bloc (titre, texte, listes, liens…) + éditeurs personnalisés (bannière, compétences, galerie…) |
| **Style** | Modèles d'apparence · fond dégradé/uni · **intensité** · bordure · coins · ombre · glow · verre · **Copier/Coller le style** · Réinitialiser |
| **Mise en page** | Alignement/disposition/taille du bloc · largeur · espacement vertical |
| **Avancé** | Visibilité mobile/ordinateur · animation · nom interne · dupliquer/supprimer |

### Options d'apparence
- **Fond** : 12 dégradés (Or nuit, Océan, Nuit bleue, Sunset, Cuivre, Violet, Menthe, Émeraude, Rose, Bordeaux, Ardoise, Charbon) via **sélecteur visuel de vignettes** (plus de menu déroulant natif) — ou couleur unie.
- **Intensité** (Plein/Moyen/Léger) — adoucit le fond sans jamais toucher la lisibilité du texte.
- **Bordure · Coins** (S/M/L/XL) · **Ombre** (Douce/Forte) · **Halo lumineux (glow)** · **Effet verre** (backdrop-blur).
- **Largeur** (Normale/Étroite) · **Espacement** vertical · **Animation d'apparition** (Fondu/Glissé/Zoom, respecte `prefers-reduced-motion`).

### 10 modèles d'apparence 1-clic
Carte · Premium · Luxe noir · Corporate · Chaleureux · Verre · Néon · Océan · Sombre · Minimal

### Copier / coller le style
Bouton **Copier le style** (mémorise les 11 clés d'apparence) → **Coller le style** sur un autre bloc.

---

## 5. Thèmes de page (~150)

- **~150 thèmes prédéfinis** classés par catégorie (Minimal, Business, Luxe, Créateur…), 1 clic pour l'appliquer.
- Personnalisation fine : couleurs (principale/accent/texte/fond, avec historique des couleurs récentes + contraste WCAG affiché), **polices** (Google Fonts display+body), et **fond de page** en 6 modes : uni · dégradé linéaire · **radial** · **mesh** · **motif** (points/grille/lignes…) · image.
- 10 presets de bannière (Luxe, Spotify, Apple, Gaming, Minimal, Créateur, Mode, Océan, Sunset, Corail).

---

## 6. L'éditeur (UX)

- **Canvas central** — glisser-déposer des blocs, poignée de déplacement, bloc sélectionné **clairement isolé** (anneau or + halo + teinte).
- **Aperçu mobile** — maquette iPhone live (encoche, statut), reflète style + thème ; cliquer un bloc l'ouvre dans l'éditeur.
- **Bibliothèque de blocs** (gauche) — recherche, **Récents**, **Favoris** (⭐), catégories en accordéon, popovers d'aperçu, modèles par métier en tête.
- **Contrôles segmentés sombres** (pastilles) partout — plus aucun menu déroulant blanc hors charte ; libellés traduits en FR.
- **États vides premium** — « Ajoutez une question / un membre / un document / une étape » (pointillé), au lieu de blocs vides bruts.
- Par bloc : **Dupliquer · Brouillon · Verrouiller · Masquer · Supprimer** + compteur de clics (90 j) affiché.
- **Undo / Redo**, **Mode Focus** (Ctrl+F), panneaux repliables (gauche/droite), bascule aperçu jour/nuit, raccourcis clavier (Ctrl+B/E/P/F).
- **Accessibilité** — contour clavier `:focus-visible` or partout (éditeur + public), accordéons ARIA, `aria-label` sur boutons icônes.

---

## 7. Sauvegarde & publication

- **Sauvegarde automatique** (debounce ~800 ms) — statut clair : ● **Modifications non enregistrées → Enregistrer** (immédiat) · Enregistrement… · ✓ **Enregistré** · ⚠ **Erreur / Réessayer**.
- **Fiabilité** : `upsert` qui **conserve les IDs** (jamais de delete-all → préserve les `block_clicks`), sauvegarde tout le `content` (y compris clés de style `__`), rechargement **brut** sans écrasement par les valeurs par défaut. Garde anti-écrasement (`ready`) + avertissement avant fermeture si modifs non sauvegardées.
- **Publication** — bascule brouillon/publié, **QR code dynamique** (généré localement, studio de scannabilité : contraste/logo/correction d'erreur + score), « Voir en direct ».
- 100 % **rétrocompatible** : aucune migration, les anciennes pages rendent à l'identique.

---

## 8. Page publique (rendu final)

- **Parité builder↔public** garantie par les helpers purs partagés.
- **Blocs interactifs** : FAQ (recherche/accordéon), Horaires (statut live), comparateur Avant/Après (glisser), onglets, accordéons, carrousels, lightbox galerie, compte à rebours (tick 1 s).
- **Liens fiabilisés** : normalisation d'URL (`extHref`), réseaux depuis pseudo (`socialHref`), WhatsApp/tel (France par défaut), Spotify/YouTube (embeds nocookie), Maps sans clé API, vCard (RFC 6350), calendrier (.ics + Google), partage multi-réseaux.
- **Tracking** : vues de page + clics par bloc (analytics), sources de trafic (utm).
- **SEO / partage** : image **OG dynamique**, apple-icon, manifest PWA, `error.tsx` de secours, `BlockBoundary` (un bloc en erreur ne casse pas la page).
- **Performance** : lazy-loading images, `preconnect`, avatar prioritaire, compression WebP à l'upload, animations légères.

---

## 9. Qualité & robustesse

- **195 tests** unitaires (Vitest) sur les helpers purs — `pnpm test`.
- **Type-check verrouillé au build** (`tsc` 0 erreur ; le build échoue sur toute erreur TS).
- **Check pré-build** `check-jsx-imports.mjs` (détecte un composant JSX utilisé sans import).
- Error boundaries (public + builder), fallbacks images/avatar, garde `IntersectionObserver`.

---

## 10. Limites connues

- **Fuseau horaire** de la fenêtre de dates d'annonce : `datetime-local` est interprété dans le fuseau du **visiteur** (pas du propriétaire) — correct seulement si même fuseau. Pas de correctif propre sans champ de fuseau dédié.
- **Vérification visuelle mobile fine** (rendu réel bloc par bloc) : à valider à l'œil (le conteneur public est en largeur mobile fixe 480 px, donc pas de débordement horizontal, mais le rendu détaillé reste à confirmer).
- `scan_counter` : le vrai nombre de scans n'est pas encore câblé (chiffre configurable en attendant).

---

*Fin du document. Pour le détail d'un bloc précis, voir sa définition dans `types.ts` et son rendu dans `PublicPageClient.tsx`.*
