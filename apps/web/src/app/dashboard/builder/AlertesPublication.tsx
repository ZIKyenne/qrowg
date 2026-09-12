// Résumé, près du bouton « Publier », de ce qui ne partira pas en ligne
// (revue du 9 septembre). Les mentions restent sous chaque bloc dans l'aperçu ;
// ici on les réunit pour ne pas avoir à faire défiler la page pour les trouver.
// Rien ne bloque la publication : c'est une liste à vérifier, chaque ligne mène au bloc.
import { AlertTriangle } from "lucide-react"
import { BLOCK_DEFS } from "./blockDefs"
import { boutonsSansLien } from "./boutonSansLien"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "./blockEmptyState"
import { problemesDeTheme, phraseProbleme } from "./themeLisible"
import type { Block } from "./types"

/** `blocId` vide : l'alerte porte sur la PAGE (son thème), pas sur un bloc. */
export type AlertePublication = { blocId: string; bloc: string; texte: string }

/**
 * Ce qui ne partira pas en ligne, dans les blocs VISIBLES (un bloc masqué ne publie
 * rien de toute façon) :
 *  • un bouton dont le lien manque — il disparaîtrait sans prévenir ;
 *  • un bloc encore vide — depuis le 10 septembre les modèles ne pré-remplissent plus
 *    ni avis, ni chiffres, ni adresse, donc un modèle appliqué tel quel arrive avec
 *    des emplacements à remplir. Ils sont annoncés ici plutôt que découverts en ligne.
 */
export function alertesPublication(blocks: Block[]): AlertePublication[] {
  const out: AlertePublication[] = []
  for (const b of blocks) {
    if (b.visible === false) continue
    const bloc = BLOCK_DEFS[b.type]?.label || b.type
    // Un bloc entièrement vide se signale UNE fois. Depuis que les blocs d'action
    // sont entrés dans la doctrine (lot v72), le même bloc pouvait remonter deux
    // lignes — « bouton sans lien » et « bloc vide » — pour une seule chose à faire.
    const vide = EMPTY_STATE_BLOCK_TYPES.includes(b.type) && !hasPublishableContent(b.type, b.content as any)
    if (vide) {
      out.push({ blocId: b.id, bloc, texte: "Bloc vide — rien à publier pour l'instant" })
      continue
    }
    for (const o of boutonsSansLien(b.type, b.content as any)) out.push({ blocId: b.id, bloc, texte: `Bouton « ${o.libelle} » sans lien` })
  }
  return out
}

/**
 * Ce que le produit ne corrige pas à la place du client : les couleurs de SON
 * thème qui ne se lisent pas. QRowg adapte désormais les couleurs qu'il impose
 * (statuts, pastilles, encre des boutons — lot v68) ; celles que le client a
 * choisies, il les signale. Relevé du 11 septembre : « 80 € » à 2,9 : 1 sur le
 * modèle Institut, illisible dehors sur un téléphone.
 */
export function alertesTheme(theme: Record<string, any> | null | undefined): AlertePublication[] {
  return problemesDeTheme(theme).map(p => ({ blocId: "", bloc: "Thème de la page", texte: phraseProbleme(p) }))
}

export function AlertesPublication({ blocks, theme, onVoir, onVoirTheme }: {
  blocks: Block[]
  theme?: Record<string, any> | null
  onVoir: (blocId: string) => void
  onVoirTheme?: () => void
}) {
  const alertes = [...alertesTheme(theme), ...alertesPublication(blocks)]
  if (alertes.length === 0) return null
  return (
    <div role="status" style={{ marginBottom: 10, padding: "9px 12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 9 }}>
      <p style={{ display: "flex", alignItems: "center", gap: 6, color: "#F59E0B", fontSize: 12, fontWeight: 700, margin: "0 0 6px" }}>
        <AlertTriangle size={13} aria-hidden="true" /> {alertes.length === 1 ? "1 point à vérifier avant de publier" : `${alertes.length} points à vérifier avant de publier`}
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {alertes.map((a, i) => (
          <li key={a.blocId + i}>
            <button type="button" onClick={() => (a.blocId ? onVoir(a.blocId) : onVoirTheme?.())} title={a.blocId ? "Ouvrir ce bloc" : "Ouvrir le thème de la page"}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "2px 0", color: "var(--ink)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", gap: 6 }}>
              <span style={{ color: "var(--muted)", flexShrink: 0 }}>{a.bloc} ·</span><span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>{a.texte}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
