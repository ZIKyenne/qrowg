// Résumé, près du bouton « Publier », de ce qui ne partira pas en ligne
// (revue du 9 septembre). Les mentions restent sous chaque bloc dans l'aperçu ;
// ici on les réunit pour ne pas avoir à faire défiler la page pour les trouver.
// Rien ne bloque la publication : c'est une liste à vérifier, chaque ligne mène au bloc.
import { AlertTriangle } from "lucide-react"
import { BLOCK_DEFS } from "./blockDefs"
import { boutonsSansLien } from "./boutonSansLien"
import type { Block } from "./types"

export type AlertePublication = { blocId: string; bloc: string; texte: string }

/** Les boutons sans lien des blocs VISIBLES (un bloc masqué ne publie rien de toute façon). */
export function alertesPublication(blocks: Block[]): AlertePublication[] {
  const out: AlertePublication[] = []
  for (const b of blocks) {
    if (b.visible === false) continue
    const bloc = BLOCK_DEFS[b.type]?.label || b.type
    for (const o of boutonsSansLien(b.type, b.content as any)) out.push({ blocId: b.id, bloc, texte: `Bouton « ${o.libelle} » sans lien` })
  }
  return out
}

export function AlertesPublication({ blocks, onVoir }: { blocks: Block[]; onVoir: (blocId: string) => void }) {
  const alertes = alertesPublication(blocks)
  if (alertes.length === 0) return null
  return (
    <div role="status" style={{ marginBottom: 10, padding: "9px 12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 9 }}>
      <p style={{ display: "flex", alignItems: "center", gap: 6, color: "#F59E0B", fontSize: 12, fontWeight: 700, margin: "0 0 6px" }}>
        <AlertTriangle size={13} aria-hidden="true" /> {alertes.length === 1 ? "1 élément ne sera pas publié" : `${alertes.length} éléments ne seront pas publiés`}
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {alertes.map((a, i) => (
          <li key={a.blocId + i}>
            <button type="button" onClick={() => onVoir(a.blocId)} title="Ouvrir ce bloc"
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "2px 0", color: "var(--ink)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", gap: 6 }}>
              <span style={{ color: "var(--muted)", flexShrink: 0 }}>{a.bloc} ·</span><span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>{a.texte}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
