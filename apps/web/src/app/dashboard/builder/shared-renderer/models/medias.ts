// Rendu unique, lot 4 — les médias (24 nov.).
//
// Avis Google, carrousel, avant/après, galeries YouTube et TikTok, témoignages
// vidéo, intégration. Ce que chacun publie se décide ICI ; l'aperçu de
// l'éditeur et la page publiée ne font que dessiner.
//
// Ce que les copies disaient de différent :
//   · l'aperçu des avis Google INVENTAIT une note « 5.0 » et cinq étoiles quand
//     le commerçant n'avait écrit qu'un titre — la page n'en publiait aucune ;
//   · l'aperçu de l'intégration posait son <iframe> SANS sandbox, sur l'origine
//     du tableau de bord ; la page publiée, elle, la sandboxait ;
//   · l'aperçu de l'avant/après montrait toujours deux images côte à côte,
//     même réglé en curseur ;
//   · les galeries vidéo et TikTok dessinaient leur bouton sans destination ;
//   · TikTok publiait un cadre vide quand seule l'adresse du compte était
//     remplie (le bouton exigeait AUSSI un libellé).
import { destinationUtile, youtubeId, embedHref, starRow } from "../../types"
import { entierDuContenu } from "@/lib/nombreDuContenu"
import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"
import { safeMediaSrc } from "./mediaUrl"
import { galerie, type Photo } from "./horairesGalerieReseaux"
import { etoilesDeLAvis } from "./testimonials"

type C = Record<string, any> | null | undefined
const lien = (label: string, href: string | null) => (label && href ? { label, href } : null)
const vignetteYoutube = (url: string) => { const id = youtubeId(url); return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : "" }

// ── google_reviews_block ────────────────────────────────────────────────────
export type AvisGoogle = {
  enTete: { note: string; etoiles: number[]; titre: string; total: string } | null
  avis: { nom: string; texte: string; etoiles: number[] }[]
  lienGoogle: string | null
}
/** La note est celle que le commerçant a écrite — jamais un « 5.0 » de repli. */
export function avisGoogle(c: C): AvisGoogle | null {
  const avis = extractIndexed(c || {}, plafondDesLignes("google_reviews_block"), (s, i) => {
    const nom = texteUtile(s[`r${i}_name`])
    if (!nom) return null
    const n = etoilesDeLAvis(s[`r${i}_stars`])
    return { nom, texte: texteUtile(s[`r${i}_text`]), etoiles: n > 0 ? starRow(n) : [] }
  })
  const note = texteUtile(c?.avg_rating)
  if (avis.length === 0 && !note) return null
  const titre = texteUtile(c?.title)
  return {
    enTete: note || titre ? { note, etoiles: note ? starRow(note) : [], titre: titre || "Avis clients", total: texteUtile(c?.total_reviews) } : null,
    avis,
    lienGoogle: destinationUtile(c?.google_url),
  }
}

// ── image_carousel ──────────────────────────────────────────────────────────
/** Même panneau que la galerie (douze photos), donc même lecture : la légende
 *  suit SA photo, et une adresse refusée disparaît comme une photo vide. */
export function photosCarrousel(c: C): { titre: string; photos: Photo[]; defilement: boolean } | null {
  const g = galerie(c)
  if (!g) return null
  return { titre: g.titre, photos: g.photos, defilement: c?.auto_play === "yes" }
}

// ── media_before_after ──────────────────────────────────────────────────────
export function avantApres(c: C) {
  const avant = safeMediaSrc(texteUtile(c?.before_img)) ?? ""
  const apres = safeMediaSrc(texteUtile(c?.after_img)) ?? ""
  if (!avant && !apres) return null
  return {
    titre: texteUtile(c?.title),
    avant, apres,
    labelAvant: texteUtile(c?.before_label) || "Avant",
    labelApres: texteUtile(c?.after_label) || "Après",
    // Le curseur demande les deux images ; avec une seule, la grille la montre.
    curseur: c?.mode === "slider" && !!avant && !!apres,
    description: texteUtile(c?.description),
  }
}

// ── youtube_gallery ─────────────────────────────────────────────────────────
export function videosYoutube(c: C) {
  const videos = extractIndexed(c || {}, plafondDesLignes("youtube_gallery"), (s, i) => {
    const href = destinationUtile(s[`video${i}_url`])
    if (!href) return null
    return { href, vignette: vignetteYoutube(href), titre: texteUtile(s[`video${i}_title`]) }
  })
  if (videos.length === 0) return null
  return { titre: texteUtile(c?.title), videos, cta: lien(texteUtile(c?.cta_label), destinationUtile(c?.channel_url)) }
}

// ── tiktok_gallery ──────────────────────────────────────────────────────────
/** Trois tuiles verticales côte à côte : ce que tient la largeur d'un
 *  téléphone, pas un plafond de répéteur (le panneau déclare trois champs). */
export const VIDEOS_TIKTOK = 3
export function galerieTiktok(c: C) {
  const videos = extractIndexed(c || {}, VIDEOS_TIKTOK, (s, i) => destinationUtile(s[`video${i}_url`]))
  const compte = destinationUtile(c?.cta_url)
  if (videos.length === 0 && !compte) return null
  return {
    titre: texteUtile(c?.title),
    pseudo: texteUtile(c?.username),
    videos,
    // Le compte suffit à publier le bloc : son bouton existe donc toujours,
    // avec un libellé par défaut si le commerçant n'en a pas écrit.
    cta: compte ? { label: texteUtile(c?.cta_label) || "Voir sur TikTok", href: compte } : null,
  }
}

// ── video_testimonials ──────────────────────────────────────────────────────
export function temoignagesVideo(c: C) {
  const items = extractIndexed(c || {}, plafondDesLignes("video_testimonials"), (s, i) => {
    const nom = texteUtile(s[`t${i}_name`])
    if (!nom) return null
    const url = texteUtile(s[`t${i}_video_url`])
    const href = youtubeId(url) ? destinationUtile(url) : null
    return { nom, entreprise: texteUtile(s[`t${i}_company`]), citation: texteUtile(s[`t${i}_quote`]), href, vignette: href ? vignetteYoutube(href) : "" }
  })
  return items.length ? { titre: texteUtile(c?.title), items } : null
}

// ── embed_block ─────────────────────────────────────────────────────────────
/** Seuls les hôtes de la liste (`EMBED_HOTES`) passent : une adresse
 *  arbitraire s'exécutait sur notre origine. */
export function integration(c: C): { src: string; titre: string; hauteur: number } | null {
  const src = embedHref(c?.url)
  if (!src) return null
  return { src, titre: texteUtile(c?.title), hauteur: entierDuContenu(c?.height, 400, 80, 2000) }
}
