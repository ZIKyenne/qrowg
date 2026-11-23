"use client"
// Le prix est en `flexShrink: 0` pour qu'un « 18€ » ne se coupe jamais en deux.
// Mais un champ prix contient parfois « 18€ (15€ le midi) » ou une phrase entiere :
// l'element gardait alors sa largeur naturelle — 665 px mesures sur un ecran de
// 360 — et le surplus etait COUPE, pas defilable (html/body/.qf-public sont en
// overflow-x hidden|clip). Un plafond de largeur le fait revenir a la ligne au
// lieu de disparaitre, sans rien changer au cas courant (verifie : 21 px avant
// comme apres pour « 18€ »).
// La description d'un plat se lit a table, au telephone, souvent en lumiere
// basse : elle etait rendue a 11,5 et 12 px. Mesure au navigateur sur les
// modeles Bistrot et Fast-food, a 360 et 390 px. Portee a 13 / 13,5 px.
// Liste de produits d'un menu, en 1 ou 2 colonnes. Présentationnel pur (public ET aperçu éditeur),
// paramétré par les couleurs/typo, la densité (rowPad) et l'échelle de police (fs). Réutilisé par
// menu_section et menu_tabs pour éviter la duplication.
import type { CSSProperties } from "react"

export type MenuListItem = { name: string; price?: string; desc?: string; epuise?: boolean }

// Un produit épuisé reste sur la carte — barré, atténué, avec la mention dite
// en toutes lettres (pas seulement une rature, que la lecture vocale ignore).
// Partagés avec la carte illustrée, les boissons et l'happy hour (vague 1, 23 nov.).
export const barre = (e?: boolean): CSSProperties => (e ? { textDecoration: "line-through", opacity: 0.55 } : {})
export function Mention({ primary, fs = (n: number) => n, libelle = "Épuisé" }: { primary: string; fs?: (n: number) => number; libelle?: string }) {
  return <span style={{ display: "inline-block", marginInlineStart: 6, padding: "1px 7px", borderRadius: 999, border: `1px solid ${primary}`, color: primary, fontSize: fs(11), fontWeight: 700, letterSpacing: 0.3, textDecoration: "none", verticalAlign: "middle", whiteSpace: "nowrap" }}>{libelle}</span>
}

export function MenuItemList({ items, columns = 1, rowPad = 11, fs = (n: number) => n, text, muted, primary, fontB, fontD }: {
  items: MenuListItem[]
  columns?: number
  rowPad?: number
  fs?: (n: number) => number
  text: string; muted: string; primary: string; fontB?: string; fontD?: string
}) {
  if (items.length === 0) return null

  if (columns === 2) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16, rowGap: Math.max(4, rowPad) }}>
        {items.map((it, i) => (
          <div key={i} style={{ minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: text, fontSize: fs(13.5), fontWeight: 600, fontFamily: fontB, minWidth: 0, overflowWrap: "anywhere" }}><span style={barre(it.epuise)}>{it.name}</span>{it.epuise && <Mention primary={primary} fs={fs} />}</span>
              {it.price && <span style={{ color: primary, fontSize: fs(13.5), fontWeight: 700, flexShrink: 0, maxWidth: "50%", overflowWrap: "anywhere", fontFamily: fontD, ...barre(it.epuise) }}>{it.price}</span>}
            </div>
            {it.desc && <p style={{ color: muted, fontSize: fs(13), margin: "1px 0 0", fontFamily: fontB, lineHeight: 1.4, overflowWrap: "anywhere" }}>{it.desc}</p>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {items.map((it, i) => {
        const row: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: `${rowPad}px 0`, borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }
        return (
          <div key={i} style={row}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: text, fontSize: fs(14), fontWeight: 600, margin: "0 0 2px", fontFamily: fontB, overflowWrap: "anywhere" }}><span style={barre(it.epuise)}>{it.name}</span>{it.epuise && <Mention primary={primary} fs={fs} />}</p>
              {it.desc && <p style={{ color: muted, fontSize: fs(13.5), margin: 0, fontFamily: fontB, lineHeight: 1.45, overflowWrap: "anywhere", ...barre(it.epuise) }}>{it.desc}</p>}
            </div>
            {it.price && <span style={{ color: primary, fontSize: fs(14), fontWeight: 700, flexShrink: 0, maxWidth: "50%", overflowWrap: "anywhere", fontFamily: fontD, ...barre(it.epuise) }}>{it.price}</span>}
          </div>
        )
      })}
    </div>
  )
}
