"use client"

// useTravailNonEnregistre — le geste du builder, rendu disponible aux autres ateliers.
//
// Le builder le faisait déjà, enfermé dans son fichier : un `dirty` tenu à jour
// et un `beforeunload` qui retient la fermeture de l'onglet. Les sept autres
// ateliers du produit n'avaient rien (voir le relevé dans `travailNonEnregistre`).
//
// Usage, deux lignes par écran :
//
//   const { nonEnregistre, marquerEnregistre } = useTravailNonEnregistre({ form, theme })
//   …  après le chargement  → marquerEnregistre()
//   …  après l'enregistrement → marquerEnregistre()
//
// Tant que `marquerEnregistre` n'a pas été appelé une première fois, le crochet
// se tait : un écran qui oublie de poser sa référence après le chargement
// retombe sur le comportement d'avant, au lieu d'avertir à tort.

import { useCallback, useEffect, useRef, useState } from "react"
import { empreinte, travailPerdu } from "./travailNonEnregistre"

/**
 * La retenue elle-même, pour un écran qui sait déjà s'il a du travail en
 * attente — le builder tient son `dirty` depuis son contrôleur de sauvegarde.
 * Le prédicat est lu AU MOMENT de l'événement : l'écouteur est posé une fois,
 * pas à chaque frappe, et voit quand même l'état courant.
 */
export function useRetenirLaSortie(nonEnregistre: () => boolean): void {
  const lire = useRef(nonEnregistre)
  lire.current = nonEnregistre
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (lire.current()) { e.preventDefault(); e.returnValue = "" } }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])
}

export function useTravailNonEnregistre(actuel: unknown): {
  nonEnregistre: boolean
  marquerEnregistre: () => void
} {
  const [reference, setReference] = useState<string | null>(null)
  const nonEnregistre = travailPerdu(actuel, reference)

  const perduRef = useRef(nonEnregistre)
  perduRef.current = nonEnregistre
  useRetenirLaSortie(useCallback(() => perduRef.current, []))

  // Identité STABLE, valeur FRAÎCHE : posé dans un `useEffect` ou un écouteur
  // `afterprint`, un `marquerEnregistre` qui change à chaque rendu capturerait
  // un état périmé — et reposerait une référence qui n'est plus celle de
  // l'écran. La valeur passe par une ref, la fonction ne bouge jamais.
  const actuelRef = useRef(actuel)
  actuelRef.current = actuel
  const marquerEnregistre = useCallback(() => { setReference(empreinte(actuelRef.current)) }, [])

  return { nonEnregistre, marquerEnregistre }
}

/**
 * L'autre porte, pour un écran dont la valeur enregistrée est sous la main :
 * la référence n'est pas un instant, c'est la ligne en base. Aucun problème de
 * moment — un écran qui recharge, enregistre ou change de fiche voit l'écart
 * disparaître de lui-même, sans avoir à penser à reposer sa référence.
 *
 * `enregistre` à `null`/`undefined` = pas encore chargé : on se tait.
 */
export function useEcartAvecLEnregistre(actuel: unknown, enregistre: unknown): boolean {
  const nonEnregistre = enregistre == null ? false : empreinte(actuel) !== empreinte(enregistre)
  const perduRef = useRef(nonEnregistre)
  perduRef.current = nonEnregistre
  useRetenirLaSortie(useCallback(() => perduRef.current, []))
  return nonEnregistre
}
