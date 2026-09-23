// listesDeMiseEnPage.ts — ce qui fait exister un bloc de mise en page qui RÉPÈTE.
//
// Suite directe du lot v170. Là-bas, quatorze blocs portaient leur condition
// dans leur adapter public, sur des CHAMPS ; ici, dix-sept la portent sur une
// LISTE d'items — `stackCardsItems(c).length === 0`. La différence n'était pas
// de nature, seulement de forme : dans les deux cas la condition vivait d'un
// seul côté, et l'éditeur rendait la vue sans elle.
//
// Ces douze fonctions vivaient dans le fichier de leur bloc. Un modèle ne peut
// pas importer un composant React, et le détecteur de la liste d'avant
// publication est un module pur : tant qu'elles restaient là-bas, il aurait
// fallu RECOPIER leur condition pour l'interroger — la dérive que les lots
// v151 à v154 ont passé leur temps à défaire. Elles sont ici, inchangées, et
// les trois côtés les appellent : le rendu public, l'aperçu éditeur, et le
// détecteur.

import { alignOf, anchorId, clampInt, flexAlign, safeColor, safeImageUrl, splitList, textOn } from "./layoutStyle"
import { destinationUtile } from "../../types"
import { extractIndexed } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

export type Card = { image: string; title: string; text: string; label: string; href: string | null; badge: string }
export function stackCardsItems(c: Record<string, any>): Card[] {
  return extractIndexed<Card>(c || {}, plafondDesLignes("stack_cards"), (src, i) => {
    const title = String(src[`c${i}_title`] || "").trim()
    const text = String(src[`c${i}_text`] || "").trim()
    const image = safeImageUrl(src[`c${i}_image`])
    if (!title && !text && !image) return null
    return { image, title, text, label: String(src[`c${i}_label`] || "").trim(), href: destinationUtile(String(src[`c${i}_url`] || "")), badge: String(src[`c${i}_badge`] || "").trim() }
  })
}


export type Cell = { emoji: string; image: string; title: string; text: string; href: string | null }
export function freeGridCells(c: Record<string, any>): Cell[] {
  return extractIndexed<Cell>(c || {}, plafondDesLignes("free_grid"), (src, i) => {
    const title = String(src[`c${i}_title`] || "").trim()
    const text = String(src[`c${i}_text`] || "").trim()
    const emoji = String(src[`c${i}_emoji`] || "").trim()
    const image = safeImageUrl(src[`c${i}_image`])
    if (!title && !text && !emoji && !image) return null
    return { emoji, image, title, text, href: destinationUtile(String(src[`c${i}_url`] || "")) }
  })
}


export type Col = { emoji: string; title: string; text: string }
export function columnsTextItems(c: Record<string, any>): Col[] {
  return extractIndexed<Col>(c || {}, plafondDesLignes("columns_text"), (src, i) => {
    const title = String(src[`c${i}_title`] || "").trim()
    const text = String(src[`c${i}_text`] || "").trim()
    const emoji = String(src[`c${i}_emoji`] || "").trim()
    if (!title && !text && !emoji) return null
    return { emoji, title, text }
  })
}


export function mosaicImages(c: Record<string, any>): string[] {
  return extractIndexed<string>(c || {}, plafondDesLignes("image_mosaic"), (src, i) => safeImageUrl(src[`img${i}`]) || null)
}


export type Item = { title: string; text: string }
export function numberedItems(c: Record<string, any>): Item[] {
  return extractIndexed<Item>(c || {}, plafondDesLignes("numbered_list"), (src, i) => {
    const title = String(src[`i${i}_title`] || "").trim()
    const text = String(src[`i${i}_text`] || "").trim()
    if (!title && !text) return null
    return { title, text }
  })
}


export type Line = { text: string; off: boolean; note: string }
export function checklistLines(c: Record<string, any>): Line[] {
  return extractIndexed<Line>(c || {}, plafondDesLignes("checklist"), (src, i) => {
    const text = String(src[`i${i}`] || "").trim()
    if (!text) return null
    return { text, off: String(src[`i${i}_state`] || "") === "Exclu", note: String(src[`i${i}_note`] || "").trim() }
  })
}


export type RangeeDefinition = { label: string; value: string; strong: boolean }
export function definitionRows(c: Record<string, any>): RangeeDefinition[] {
  return extractIndexed<RangeeDefinition>(c || {}, plafondDesLignes("definition_list"), (src, i) => {
    const label = String(src[`r${i}_label`] || "").trim()
    const value = String(src[`r${i}_value`] || "").trim()
    if (!label && !value) return null
    return { label, value, strong: String(src[`r${i}_strong`] || "") === "Oui" }
  })
}


export type Entry = { label: string; target: string; emoji: string }
export function anchorEntries(c: Record<string, any>): Entry[] {
  return extractIndexed<Entry>(c || {}, plafondDesLignes("anchor_nav"), (src, i) => {
    const label = String(src[`i${i}_label`] || "").trim()
    if (!label) return null
    const target = anchorId(src[`i${i}_target`] || label)
    return { label, target, emoji: String(src[`i${i}_emoji`] || "").trim() }
  })
}


export type Step = { emoji: string; title: string; text: string }
export function horizontalSteps(c: Record<string, any>): Step[] {
  return extractIndexed<Step>(c || {}, plafondDesLignes("steps_horizontal"), (src, i) => {
    const title = String(src[`s${i}_title`] || "").trim()
    const text = String(src[`s${i}_text`] || "").trim()
    const emoji = String(src[`s${i}_emoji`] || "").trim()
    if (!title && !text && !emoji) return null
    return { emoji, title, text }
  })
}


export type Ico = { emoji: string; image: string; label: string }
export function iconRowItems(c: Record<string, any>): Ico[] {
  return extractIndexed<Ico>(c || {}, plafondDesLignes("icon_row"), (src, i) => {
    const emoji = String(src[`i${i}_emoji`] || "").trim()
    const label = String(src[`i${i}_label`] || "").trim()
    const image = safeImageUrl(src[`i${i}_image`])
    if (!emoji && !label && !image) return null
    return { emoji, image, label }
  })
}


export type RangeeCompare = { left: string; right: string }
export function compareRows(c: Record<string, any>): RangeeCompare[] {
  return extractIndexed<RangeeCompare>(c || {}, plafondDesLignes("compare_two"), (src, i) => {
    const left = String(src[`r${i}_left`] || "").trim()
    const right = String(src[`r${i}_right`] || "").trim()
    if (!left && !right) return null
    return { left, right }
  })
}


export type Bar = { label: string; value: number | null; note: string; color: string }
export function progressBars(c: Record<string, any>): Bar[] {
  return extractIndexed<Bar>(c || {}, plafondDesLignes("progress_bars"), (src, i) => {
    const label = String(src[`b${i}_label`] || "").trim()
    const raw = src[`b${i}_value`]
    const chiffre = raw !== undefined && String(raw).trim() !== ""
    if (!label && !chiffre) return null
    // Lot v168 : `clampInt(raw, …, 0)` transformait « pas de chiffre » en ZÉRO.
    // Une étiquette seule — « Taux de satisfaction » — publiait donc « 0 % » et
    // une jauge vide : une affirmation faite au visiteur que le commerçant
    // n'avait jamais écrite. C'est la règle du 6 septembre (`availability`
    // annonçait « Disponible »), appliquée ici.
    return { label, value: chiffre ? clampInt(raw, 0, 100, 0) : null, note: String(src[`b${i}_note`] || "").trim(), color: safeColor(src[`b${i}_color`], "") }
  })
}

/** `marquee_text` : une liste d'items, ou à défaut le texte libre. */
export function marqueeItems(c: Record<string, any> | null | undefined): string[] {
  const src = c || {}
  const parts = splitList(src.items, 12)
  return parts.length ? parts : [String(src.text || "").trim()].filter(Boolean)
}

/** `badge_row` : les étiquettes, vingt au plus — le plafond du rendu. */
export function badgeItems(c: Record<string, any> | null | undefined): string[] {
  return splitList((c || {}).items, 20)
}
