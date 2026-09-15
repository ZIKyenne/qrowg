"use client"

import type { CSSProperties } from "react"

/**
 * Ce qu'on montre quand on n'a PAS pu lire — à la place de l'écran de bienvenue.
 *
 * Le dessin vient de `DomainsPage`, le seul écran qui portait déjà le geste
 * (lot v55). Il est repris ici tel quel pour qu'il n'en existe qu'un : un refus
 * de lecture se reconnaît d'un écran à l'autre, et la phrase — venue de
 * `refusDuServeur` — est déjà écrite pour le commerçant.
 *
 * `reessayer` est optionnel : certaines lectures partent d'un effet qu'on ne
 * peut pas relancer d'un bouton. Mieux vaut alors le dire sans bouton que de
 * proposer un geste qui ne fait rien.
 */
export function LectureRatee({ message, reessayer, style }: {
  message: string
  reessayer?: () => void
  style?: CSSProperties
}) {
  return (
    <div role="alert" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap", padding:"18px 20px", border:"1px solid var(--line-strong)", borderRadius:14, background:"var(--surface)", color:"var(--muted)", fontSize:13.5, ...style }}>
      <span>{message}</span>
      {reessayer ? <button type="button" onClick={reessayer} className="da-btn-neutral da-btn-neutral--sm">Réessayer</button> : null}
    </div>
  )
}

export default LectureRatee
