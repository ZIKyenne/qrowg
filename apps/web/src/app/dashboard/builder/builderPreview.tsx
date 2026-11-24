"use client"

import { Button } from "@/components/ui/Button"
import { type Block, type PageTheme } from "./types"
import { BLOCK_DEFS } from "./blockDefs"
import { boutonsSansLien, mentionBoutonSansLien } from "./boutonSansLien"
import { CHAMPS_FORMULAIRE, telephoneDirect, type LeadField } from "@/lib/leadForms"

// Les cases grises d'un formulaire dans l'aperçu. Elles étaient écrites en toutes
// lettres, bloc par bloc, et avaient dérivé de la page publiée (vague 23) : le
// commerçant activait « Champ téléphone » ou « Délai souhaité » et l'aperçu ne
// bougeait pas. Une seule liste, partagée avec le rendu public.
function champsDe(type: string, c: Record<string, any>): LeadField[] {
  return (CHAMPS_FORMULAIRE[type] ?? (() => []))(c)
}
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
      case "reservation_form": { const ligneDirecte = telephoneDirect(c); return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{c.title||"Réserver"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {champsDe("reservation_form", c).map(f => <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "7px 10px", color: muted, fontSize: 11 }}>{f.label}</div>)}
            <div style={{ background: "linear-gradient(90deg,#EF4444,#dc2626)", borderRadius: 7, padding: "9px", textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{c.button_label||"Réserver"}</div>
          </div>
          {ligneDirecte && <p style={{ textAlign: "center", margin: "8px 0 0", color: muted, fontSize: 11 }}>ou appelez directement le <strong style={{ color: text }}>{ligneDirecte}</strong></p>}
        </div>
      ) }
      case "contact_form": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{c.title||"Contact"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {champsDe("contact_form", c).map(f => <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: f.area ? "7px 10px 32px" : "7px 10px", color: muted, fontSize: 11 }}>{f.label}</div>)}
            <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 7, padding: "9px", textAlign: "center", color: "#080808", fontSize: 12, fontWeight: 700 }}>{c.button_label||"Envoyer"}</div>
          </div>
        </div>
      )

      case "quote_form": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Demander un devis"}</p>
          {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>{c.description}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {champsDe("quote_form", c).map(f => <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: f.area ? "8px 11px 36px" : "8px 11px", color: muted, fontSize: 11 }}>{f.label}</div>)}
            <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#080808" }}>{c.button_label||"Envoyer ma demande"}</div>
          </div>
        </div>
      )

      case "booking_request": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Réserver pour un événement"}</p>
          {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>{c.description}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {champsDe("booking_request", c).map(f => (
              <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: f.area ? "8px 11px 32px" : "8px 11px", color: muted, fontSize: 11 }}>{f.label}</div>
            ))}
            <div style={{ background: "linear-gradient(90deg,#9146FF,#7B3FCC)", borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.button_label||"Envoyer ma demande"}</div>
          </div>
        </div>
      )

      case "event_register": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"S'inscrire gratuitement"}</p>
          {c.description && <p style={{ color: "#EC4899", fontSize: 11, margin: "0 0 12px", fontWeight: 600 }}>⚡ {c.description}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {champsDe("event_register", c).map(f => <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>{f.label}</div>)}
            <div style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.button_label||"Je m'inscris"}</div>
          </div>
        </div>
      )

      case "rsvp": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Serez-vous présent ?"}</p>
          {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 14px" }}>{c.description}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="sm">{c.yes_label||"✅ Oui, je viens"}</Button>
            <Button variant="secondary" size="sm">{c.maybe_label||"🤔 Peut-être"}</Button>
            <Button variant="secondary" size="sm">{c.no_label||"❌ Non"}</Button>
          </div>
        </div>
      )
      default: {
        const def = BLOCK_DEFS[block.type]
        return <div style={{ padding: "12px 16px", textAlign: "center", ...s }}><span style={{ fontSize: 22 }}>{def?.icon||"📦"}</span><p style={{ color: muted, fontSize: 11, margin: "5px 0 0" }}>{def?.label||block.type}</p></div>
      }
    }
    })())
  }

