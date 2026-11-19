"use client"
// EquipementsAcocher — l'éditeur des équipements (livret d'accueil, 19 nov.) :
// une liste FERMÉE de bascules (mêmes pastilles que les langues de la carte,
// `.trad-langue`), rangée dans `liste` ; les « autres » restent un champ libre.
import type { Block } from "./types"
import { EQUIPEMENTS } from "./shared-renderer/models/livretAccueil"

export function EquipementsAcocher({ block, onChange }: { block: Block; onChange: (key: string, val: string) => void }) {
  const coches = new Set(String((block.content as Record<string, any>).liste || "").split(",").map(s => s.trim()).filter(Boolean))
  const basculer = (cle: string) => {
    const suivants = new Set(coches)
    if (suivants.has(cle)) suivants.delete(cle); else suivants.add(cle)
    onChange("liste", EQUIPEMENTS.filter(e => suivants.has(e.cle)).map(e => e.cle).join(","))
  }
  return (
    <div role="group" aria-label="Équipements du logement" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {EQUIPEMENTS.map(e => (
        <button key={e.cle} type="button" className="trad-langue cible-doigt" aria-pressed={coches.has(e.cle)} onClick={() => basculer(e.cle)}>
          <span aria-hidden="true">{e.icone} </span>{e.libelle}
        </button>
      ))}
    </div>
  )
}
