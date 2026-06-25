"use client"

import { useState, useEffect } from "react"

// Couleur d'accent par défaut (or signature QRfolio)
export const DEFAULT_ACCENT = "#C9A84C"

/**
 * Renvoie la couleur d'accent choisie par l'utilisateur (profil → couleur d'accent).
 * - Lue instantanément depuis localStorage (pas de flash après le 1er rendu)
 * - Mise à jour en direct quand l'utilisateur la change (événement "qrfolio-accent")
 *
 * Utilisée comme valeur de `G` dans les pages du dashboard : tous les `${G}`, `${G}12`,
 * dégradés, bordures… suivent donc la couleur (l'accent reste un hex 6 chiffres,
 * donc la concaténation d'alpha type `${G}12` reste valide).
 */
export function useAccent(): string {
  const [accent, setAccent] = useState(DEFAULT_ACCENT)
  useEffect(() => {
    const cached = localStorage.getItem("qrfolio_accent")
    if (cached) setAccent(cached)
    const onAccent = (e: Event) => {
      const c = (e as CustomEvent).detail
      if (typeof c === "string" && c) setAccent(c)
    }
    window.addEventListener("qrfolio-accent", onAccent)
    return () => window.removeEventListener("qrfolio-accent", onAccent)
  }, [])
  return accent
}
