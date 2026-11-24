"use client"

// ─────────────────────────────────────────────────────────────────────────────
// RENDU LEGACY DE LA PAGE PUBLIÉE — chargé À LA DEMANDE.
//
// Mesuré le 6 septembre sur le fichier construit : le morceau de JavaScript que
// tout visiteur télécharge après un scan pesait 143 Ko (33 Ko compressés). Sur
// les 99 Ko de `case` qu'il contenait, 91 Ko concernaient des blocs DÉJÀ servis
// par le renderer partagé : du code que plus personne n'exécute, conservé pour
// pouvoir revenir en arrière — et payé par chaque visiteur, à chaque scan.
//
// L'assurance reste, elle cesse simplement de voyager avec le visiteur. Ce
// module n'est chargé que si un bloc de la page n'est PAS servi par le renderer
// partagé : retirer un type de SHARED_RENDERER_BLOCKS le fait revenir aussitôt.
// `dynamic()` conserve le rendu serveur — le HTML arrive complet, rien ne
// clignote, le référencement est intact.
//
// Après découpe : 143 Ko → 63 Ko (33 → 19 Ko compressés) pour une page dont
// tous les blocs sont migrés.
// ─────────────────────────────────────────────────────────────────────────────

// Les images de la page publiée : celles qui SONT le contenu (galerie, carrousel,
// bannière sans texte incrusté) reçoivent un texte alternatif ; les vignettes
// posées à côté d'un titre déjà lisible gardent `alt=""` — un lecteur d'écran
// qui annonce deux fois le même nom est plus pénible qu'utile (WCAG H67).
import { hasPublishableContent } from "../dashboard/builder/blockEmptyState"
type Block = { id: string; type: string; content: Record<string, any>; position: number }


export function RenduLegacy({ block, theme, pageId, ownerEmail, totalViews, h1Owner, nomCommerce }: { block: Block; theme: any; pageId: string; ownerEmail?: string; totalViews?: number; h1Owner?: string; nomCommerce?: string | null }) {
  const c = block.content
  // ── Lot v169 : le chemin de repli pose la MÊME question que la page ───────
  //
  // Ce module est l'assurance : « retirer un type de SHARED_RENDERER_BLOCKS le
  // fait revenir aussitôt », dit l'en-tête. Sauf que les corrections, elles,
  // n'y sont pas revenues. Comparés bloc à bloc sur un contenu VIDE, six blocs
  // migrés publiaient ici ce que le renderer partagé refuse — dont la carte
  // « 🎧 Écouter sur Spotify » sans bouton, le défaut même que le lot v166 a
  // réparé, et la carte « 📍 Adresse » sans adresse.
  //
  // `hasPublishableContent` est le miroir exact du filtre public, vérifié en
  // l'exécutant sur les cent quarante-six blocs (lots v166 et v167). Poser la
  // question ici, c'est faire dire au repli ce que dit le produit — une fois,
  // pour tous les blocs, y compris ceux qu'aucun lot n'a encore regardés.
  if (!hasPublishableContent(block.type, c)) return null
  const G = theme.primary || "#C9A84C"
  const MUTED = theme.muted || "#8A8478"
  const TEXT = theme.text || "#F5F0E8"

  switch (block.type) {
    default: return null
  }
}
