"use client"

import { type Block, type PageTheme } from "./types"
import { BLOCK_DEFS } from "./blockDefs"
import { boutonsSansLien, mentionBoutonSansLien } from "./boutonSansLien"
import { resolveEditorBlock } from "./shared-renderer/editorRegistry"
  export function BlockPreview({ block, theme, dayMode, editable = false, onEditField }: { block: Block; theme: PageTheme; dayMode: boolean; editable?: boolean; onEditField?: (blockId: string, key: string, value: string) => void }) {
    const c = block.content
    // Édition inline : n'est active que dans le canvas (editable), jamais si verrouillé.
    const canEdit = editable && !block.locked
    const edit = (key: string) => (v: string) => onEditField?.(block.id, key, v)
    const bg = "transparent"
    const text = dayMode ? "#1A1A1A" : theme.text
    const muted = dayMode ? "#6B7280" : theme.muted
    const primary = theme.primary
    const accent = theme.accent
    const s = { background: bg, fontFamily: theme.fontBody || "DM Sans, sans-serif" }

    // Un bouton sans destination n'est plus publié : la page le retire. L'aperçu
    // le garde — le commerçant doit pouvoir le composer — mais il le dit.
    //
    // Cette mention était calculée APRÈS l'aiguillage vers le renderer partagé,
    // donc elle ne s'affichait que sur les blocs restés legacy. Trente-quatre
    // blocs déjà migrés — dont `cta_button`, le bouton principal de la moitié des
    // pages — la perdaient en silence : le commerçant nommait son bouton, oubliait
    // l'adresse, voyait un bouton normal dans son aperçu, publiait, et le bouton
    // n'existait pas. (Vague 27.)
    const mention = mentionBoutonSansLien(boutonsSansLien(block.type, c))
    const avecMention = (contenu: any) => mention
      ? <>{contenu}<p role="note" style={{ margin: "0 16px 8px", padding: "6px 9px", borderRadius: 8, border: `1px dashed ${muted}40`, color: muted, fontSize: 11.5, textAlign: "center" }}>⚠︎ {mention}</p></>
      : contenu

    // Renderer PARTAGÉ (pilotes derrière flag). Flag vide en prod → null → `case` legacy.
    // Rollback = retirer le type de SHARED_RENDERER_BLOCKS ; aucune donnée touchée.
    const SharedEditor = resolveEditorBlock(block.type)
    if (SharedEditor) return avecMention(<SharedEditor content={c} ctx={{ theme, primary, text, muted, accent, surfaceStyle: s, canEdit, edit }} />)

    return avecMention((() => {
    switch (block.type) {
      default: {
        const def = BLOCK_DEFS[block.type]
        return <div style={{ padding: "12px 16px", textAlign: "center", ...s }}><span style={{ fontSize: 22 }}>{def?.icon||"📦"}</span><p style={{ color: muted, fontSize: 11, margin: "5px 0 0" }}>{def?.label||block.type}</p></div>
      }
    }
    })())
  }

