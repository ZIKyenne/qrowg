"use client"
// defsALaDemande — le catalogue des blocs (BLOCK_DEFS, ~195 Ko) chargé SEULEMENT
// quand on en a besoin (20 nov.).
//
// La galerie ne s'en servait que pour deux libellés de secours : le nom d'un bloc
// sans rendu partagé, et la liste « Blocs du modèle » de l'aperçu. Importé en
// tête de TemplatePreviewModal, il entrait pourtant dans le premier chargement de
// /creer et de /dashboard/templates (que chaque miniature tire via BlockPreview).

import { useEffect, useState } from "react"
import type { BlockDef } from "../builder/types"

type Catalogue = Record<string, BlockDef>
let catalogue: Catalogue | null = null
let enCours: Promise<Catalogue> | null = null

function charger(): Promise<Catalogue> {
  enCours ??= import("../builder/blockDefs").then(m => (catalogue = m.BLOCK_DEFS as Catalogue))
  return enCours
}

/** Le catalogue, ou null tant qu'il n'est pas arrivé (on affiche alors le type). */
export function useCatalogueDesBlocs(): Catalogue | null {
  const [c, setC] = useState<Catalogue | null>(catalogue)
  useEffect(() => {
    if (catalogue) return
    let vivant = true
    charger().then(x => { if (vivant) setC(x) }).catch(() => {})
    return () => { vivant = false }
  }, [])
  return c
}
