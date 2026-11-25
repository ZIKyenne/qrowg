"use client"
// La barre flottante de sélection multiple (≥ 2 blocs) — sortie de BuilderV4
// (vague 4, point 6). Rendu déplacé à l'identique ; aucun état propre : la
// sélection et les actions restent celles de l'éditeur.
import { Eye, EyeOff, Lock, Unlock, Copy, Trash2 } from "lucide-react"
import { G, MUTED } from "./builderConstants"
import type { Block } from "./types"

export type BarreMultiSelectionProps = {
  multiSelection: string[]
  blocks: Block[]
  setBlocks: (maj: (prev: Block[]) => Block[]) => void
  toggleVisibleMulti: () => void
  duplicateMulti: () => void
  /** Sans fenêtre de confirmation : un retour en arrière suffit (suppressionBloc.test). */
  deleteMulti: () => void
  onDeselectionner: () => void
}

export function BarreMultiSelection({ multiSelection, blocks, setBlocks, toggleVisibleMulti, duplicateMulti, deleteMulti, onDeselectionner }: BarreMultiSelectionProps) {
  return (
    <div data-barre-collante="" style={{
      position: "sticky", top: 0, zIndex: 20, marginBottom: 10,
      display: "flex", alignItems: "center", gap: 6,
      padding: "8px 12px",
      background: "rgba(8,8,8,0.92)",
      border: `1px solid ${G}40`,
      borderRadius: 12,
      backdropFilter: "blur(12px)",
      boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${G}15`,
      animation: "popoverIn 0.15s ease",
    }}>
      {/* Badge sélection */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 8, borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 20, height: 20, borderRadius: 6, background: G+"20", border: `1px solid ${G}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: G, fontSize: 11, fontWeight: 700 }}>{multiSelection.length}</span>
        </div>
        <span style={{ color: G, fontSize: 11, fontWeight: 700 }}>
          {multiSelection.length} bloc{multiSelection.length>1?"s":""} sélectionné{multiSelection.length>1?"s":""}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Actions */}
      {(() => {
        const allVisible = multiSelection.every(id => blocks.find(b => b.id===id)?.visible)
        const allLocked = multiSelection.every(id => blocks.find(b => b.id===id)?.locked)
        const lockedCount = multiSelection.filter(id => blocks.find(b => b.id===id)?.locked).length

        return (<>
          {/* Masquer/Afficher */}
          <button onClick={toggleVisibleMulti}
            title={allVisible ? "Masquer les blocs sélectionnés" : "Afficher les blocs sélectionnés"}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 11px", color: allVisible ? MUTED : "#EF4444", fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.color="var(--ink)" }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.color=allVisible?MUTED:"#EF4444" }}>
            {allVisible ? <><EyeOff size={11} /> <span>Masquer</span></> : <><Eye size={11} /> <span>Afficher</span></>}
          </button>

          {/* Verrouiller/Déverrouiller */}
          <button onClick={() => {
              const ids = multiSelection
              setBlocks(p => p.map(b => ids.includes(b.id) ? {...b, locked: !allLocked} : b))
            }}
            title={allLocked ? "Déverrouiller" : `Verrouiller${lockedCount>0?` (${lockedCount} déjà verrouillé${lockedCount>1?"s":""})`:""}`}
            style={{ display: "flex", alignItems: "center", gap: 5, background: allLocked ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "rgba(255,255,255,0.05)", border: `1px solid ${allLocked ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: "6px 11px", color: allLocked ? G : MUTED, fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="color-mix(in srgb, var(--accent) 15%, transparent)"; e.currentTarget.style.color=G }}
            onMouseLeave={e => { e.currentTarget.style.background=allLocked?"color-mix(in srgb, var(--accent) 12%, transparent)":"rgba(255,255,255,0.05)"; e.currentTarget.style.color=allLocked?G:MUTED }}>
            {allLocked ? <Unlock size={11} /> : <Lock size={11} />}
            <span>{allLocked ? "Déverrouiller" : "Verrouiller"}</span>
          </button>

          {/* Dupliquer */}
          <button onClick={duplicateMulti}
            title={`Dupliquer ${multiSelection.length} blocs`}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 11px", color: MUTED, fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.color="var(--ink)" }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.color=MUTED }}>
            <Copy size={11} /> <span>Dupliquer</span>
          </button>

          {/* Même règle que pour un bloc seul : pas de fenêtre, un retour en arrière. */}
          <button onClick={() => deleteMulti()}
            title="Supprimer les blocs sélectionnés"
            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "6px 11px", color: "var(--danger)", fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.18)"; e.currentTarget.style.borderColor="rgba(239,68,68,0.5)" }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor="rgba(239,68,68,0.25)" }}>
            <Trash2 size={11} /> <span>Supprimer</span>
          </button>
        </>)
      })()}

      {/* Séparateur */}
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />

      {/* Désélectionner */}
      <button onClick={onDeselectionner} title="Désélectionner (Échap)"
        style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, color: MUTED, cursor: "pointer", fontSize: 14, fontWeight: 300 }}
        onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.color="var(--ink)" }}
        onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color=MUTED }}>
        ×
      </button>
    </div>
  )
}
