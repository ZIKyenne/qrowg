"use client"

// ActionSheet — LE menu « ⋯ » du produit (lot 2 « appli », 18 nov.).
//
// Avant : la même feuille d'actions recopiée à la main dans trois écrans
// (Accueil, Médias, éditeur), chacune avec sa poignée décorative, son voile,
// ses rayons et ses couleurs — presque pareilles, jamais tout à fait. Aucune
// ne se fermait au bouton retour, aucune ne se tirait vers le bas.
//
// Elle est bâtie sur `MobileSheet` (une seule feuille dans le produit) : elle
// en hérite le geste, le bouton retour, le piège de focus, Échap, le verrou du
// fond iOS et la safe area. Ce fichier n'ajoute que la LISTE d'actions.
//
// Règles de la liste, celles des applis du téléphone :
//  · une ligne = 52 px, icône à gauche, le libellé lisible à 15 px ;
//  · les actions destructrices (rouges) vont EN BAS, séparées des autres —
//    on ne supprime pas en visant « Dupliquer » ;
//  · une action peut être un lien (`href`) : la feuille se ferme en le suivant.
//
// La garde : `e2e`/vitest `actionSheet` vérifie que les écrans l'utilisent et
// qu'aucune feuille d'actions faite main ne revient.

import type { ReactNode } from "react"
import Link from "next/link"
import { MobileSheet } from "./MobileSheet"

export type ActionDeFeuille = {
  libelle: string
  /** Une ligne d'explication sous le libellé (« Photo, photothèque ou
   *  fichier ») — pour un choix de SOURCE, pas pour un menu « ⋯ ». */
  detail?: string
  icone?: ReactNode
  /** Action. Si elle ne ferme pas la feuille elle-même (ex. « Lien copié »),
   *  la feuille reste ouverte : c'est voulu, l'écran le décide. */
  onClick?: () => void
  /** Lien interne : la feuille se ferme en le suivant. */
  href?: string
  /** Lien externe : nouvel onglet. */
  externe?: boolean
  danger?: boolean
  /** Arrête quelque chose sans rien détruire (pause, archive) : orange. */
  attention?: boolean
}

export function ActionSheet({ open, titre, actions, onFermer, zIndex = 1100 }: {
  open: boolean
  titre: ReactNode
  actions: readonly ActionDeFeuille[]
  onFermer: () => void
  /** Au-dessus de la barre du bas ET des barres propres à un écran (l'éditeur). */
  zIndex?: number
}) {
  const normales = actions.filter(a => !a.danger)
  const dangereuses = actions.filter(a => a.danger)

  return (
    <MobileSheet open={open} titre={titre} taille="compact" onTaille={() => {}} paliers={false}
      hauteurAuContenu safeAreaBasse zIndex={zIndex} onFermer={onFermer}>
      {/* Une liste d'actions EST un menu : c'est ce que les lecteurs d'écran
          annoncent, et ce que les tests désignent. */}
      <div role="menu" aria-label={typeof titre === "string" ? titre : "Actions"} style={{ padding: "0 8px 12px" }}>
        <Groupe actions={normales} onFermer={onFermer} />
        {dangereuses.length > 0 && (
          <div style={{ marginTop: normales.length ? 8 : 0, paddingTop: normales.length ? 8 : 0, borderTop: normales.length ? "1px solid var(--line, rgba(255,255,255,0.08))" : "none" }}>
            <Groupe actions={dangereuses} onFermer={onFermer} />
          </div>
        )}
      </div>
    </MobileSheet>
  )
}

function Groupe({ actions, onFermer }: { actions: readonly ActionDeFeuille[]; onFermer: () => void }) {
  return (
    <>
      {actions.map((a, i) => {
        const style: React.CSSProperties = {
          display: "flex", alignItems: "center", gap: 14, width: "100%", minHeight: 52, padding: "0 12px",
          background: "none", border: "none", borderRadius: 12, cursor: "pointer", textAlign: "left",
          color: a.danger ? "var(--danger)" : a.attention ? "var(--warning)" : "var(--ink)", fontSize: 15, fontWeight: 500, textDecoration: "none",
          boxSizing: "border-box",
        }
        const contenu = <>
          <span aria-hidden="true" style={{ width: 24, display: "flex", justifyContent: "center", flexShrink: 0 }}>{a.icone}</span>
          {a.detail
            ? <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, padding: "8px 0" }}>
                <span>{a.libelle}</span>
                <span style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.35 }}>{a.detail}</span>
              </span>
            : <span style={{ flex: 1, minWidth: 0 }}>{a.libelle}</span>}
        </>
        if (a.href && a.externe) return <a key={i} role="menuitem" className="feuille-action" href={a.href} target="_blank" rel="noopener noreferrer" onClick={() => { a.onClick?.(); onFermer() }} style={style}>{contenu}</a>
        if (a.href) return <Link key={i} role="menuitem" className="feuille-action" href={a.href} onClick={() => { a.onClick?.(); onFermer() }} style={style}>{contenu}</Link>
        return <button key={i} type="button" role="menuitem" className="feuille-action" onClick={a.onClick} style={style}>{contenu}</button>
      })}
    </>
  )
}
