"use client"
// TraductionsCarte — l'éditeur des langues de la Carte illustrée (lot fast-food 3, 19 nov.).
//
// Sans service tiers ni coût : le commerçant coche une langue, copie une demande
// toute prête (toute sa carte + le format exigé), la colle dans ChatGPT ou DeepL,
// et colle la réponse ici. L'éditeur dit ce qui manque, produit par produit.
// Composants communs uniquement (Button, .ui-textarea, .trad-langue) : aucun champ
// ni bouton dessiné à la main.

import { useState } from "react"
import { Copy, Check, Languages } from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { Block } from "./types"
import { produitsDeLaCarte } from "./shared-renderer/models/carteIllustree"
import {
  LANGUES_PROPOSEES, NOM_FR, languesCochees, lireTraduction, couverture, demandeDeTraduction, type CodeLangue,
} from "./shared-renderer/models/traductionCarte"

export function TraductionsCarte({ block, onChange }: { block: Block; onChange: (key: string, val: string) => void }) {
  const c = block.content as Record<string, any>
  const cochees = languesCochees(c)
  const produits = produitsDeLaCarte(c)
  const [copiee, setCopiee] = useState<CodeLangue | null>(null)

  const basculer = (l: CodeLangue) => {
    const suivantes = cochees.includes(l) ? cochees.filter(x => x !== l) : [...cochees, l]
    onChange("langues", LANGUES_PROPOSEES.filter(x => suivantes.includes(x)).join(","))
  }
  const copier = async (l: CodeLangue) => {
    try { await navigator.clipboard.writeText(demandeDeTraduction(produits, l)); setCopiee(l); setTimeout(() => setCopiee(null), 2000) } catch { /* presse-papiers refusé */ }
  }

  return (
    <section data-traductions-carte="" style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", fontSize: 14, fontWeight: 700 }}>
        <Languages size={16} aria-hidden="true" /> Traduire la carte
      </p>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
        Vos clients choisissent leur langue en haut de la carte ; celle de leur téléphone est proposée d&apos;office.
        Ce qui n&apos;est pas traduit reste en français.
      </p>
      <div role="group" aria-label="Langues proposées" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {LANGUES_PROPOSEES.map(l => (
          <button key={l} type="button" className="trad-langue cible-doigt" aria-pressed={cochees.includes(l)} onClick={() => basculer(l)}>{NOM_FR[l]}</button>
        ))}
      </div>

      {cochees.map(l => {
        const texte = String(c[`tr_${l}`] || "")
        const cv = couverture(produits, lireTraduction(texte))
        const complet = cv.total > 0 && cv.traduits === cv.total
        return (
          <div key={l} data-langue={l} style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <span style={{ color: "var(--ink)", fontSize: 13, fontWeight: 700 }}>{NOM_FR[l]}</span>
              <span role="status" style={{ color: complet ? "var(--success)" : "var(--muted)", fontSize: 12, fontWeight: 600 }}>
                {cv.traduits} produit{cv.traduits > 1 ? "s" : ""} traduit{cv.traduits > 1 ? "s" : ""} sur {cv.total}
              </span>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => copier(l)}>
              {copiee === l ? <><Check size={14} /> Demande copiée — collez-la dans ChatGPT ou DeepL</> : <><Copy size={14} /> Copier la demande de traduction</>}
            </Button>
            <textarea className="ui-textarea" rows={5} aria-label={`Traduction en ${NOM_FR[l].toLowerCase()}`}
              placeholder={"Collez ici la réponse, une ligne par produit :\nSandwich grec ; Greek sandwich ; Grilled meat, salad"}
              value={texte} onChange={e => onChange(`tr_${l}`, e.target.value)} />
            {texte.trim() && cv.manquants.length > 0 && (
              <p style={{ margin: 0, color: "var(--warning)", fontSize: 12, lineHeight: 1.5 }}>
                Restent en français : {cv.manquants.slice(0, 6).join(", ")}{cv.manquants.length > 6 ? `… (+${cv.manquants.length - 6})` : ""}
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}
