"use client"
import { menuSectionViewModel } from "../../models/menuSection"
import { BlockEmptyState, HIDDEN_WHEN_EMPTY_NOTE } from "../../primitives/BlockEmptyState"
import { MenuItemList } from "../../primitives/MenuItemList"
import type { EditorAdapterProps } from "../../renderTypes"

// Aperçu éditeur : liste (1 ou 2 colonnes) ou carte dépliable. Toujours rendu.
export function EditorMenuSection({ content, ctx }: EditorAdapterProps) {
  const { visible, category, items, collapsible, columns } = menuSectionViewModel(content)
  const { text, muted, primary, surfaceStyle } = ctx
  // La page ne publie plus le décor d'un bloc vide ; l'aperçu le dit, plutôt que
  // de laisser un cadre muet dans le canvas. (Vague 25.)
  if (!visible) return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      <BlockEmptyState icon="🍽️" label="Ajoutez une catégorie ou un plat" sub={HIDDEN_WHEN_EMPTY_NOTE} muted={muted} />
    </div>
  )
  const rows = <MenuItemList items={items} columns={columns} rowPad={7} text={text} muted={muted} primary={primary} />
  if (collapsible) {
    // Aperçu éditeur : carte toujours dépliée (édition), avec l'en-tête « dépliable ».
    return (
      <div style={{ padding: "10px 16px", ...surfaceStyle }}>
        <div style={{ border: `1px solid ${primary}2e`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 12px", background: `${primary}0f` }}>
            <span style={{ flex: 1, color: primary, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{category || "Menu"}</span>
            <span style={{ color: muted, fontSize: 11, fontWeight: 600 }}>{items.length}</span>
            <span aria-hidden style={{ color: primary, fontSize: 12 }}>▾</span>
          </div>
          <div style={{ padding: "4px 12px 10px" }}>{rows}</div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ padding: "10px 16px", ...surfaceStyle }}>
      {category && <p style={{ color: primary, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>{category}</p>}
      {rows}
    </div>
  )
}
