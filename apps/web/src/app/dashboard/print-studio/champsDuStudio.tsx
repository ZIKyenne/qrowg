"use client"

// Les champs de l'atelier d'impression : sélecteurs, puces, segmenteurs,
// interrupteurs, curseurs, couleurs. Sortis de PrintStudioClient (v382) : ils
// ne dépendent que des jetons du studio, et le volet qui les assemble reste
// dans l'atelier.

import { useState } from "react"
import { Plus } from "lucide-react"
import type { Style } from "./catalog"
import { color as C, radius as R } from "./tokens"
import { zoneDeTouche } from "@/lib/cibleTactile"
import { useFermetureEchap } from "@/components/ui/useDialogue"

export const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", height: 48, background: "var(--field)", border: `1px solid ${C.hairline}`, borderRadius: 12, color: C.fg, fontSize: 16, padding: "0 14px", outline: "none" }
// Libellé de section/champ unifié (casse normale, muted) — même convention que <Field>.
export const secLabel: React.CSSProperties = { margin: "0 0 8px", fontSize: 11.5, fontWeight: 600, color: C.fgMuted }

// Sélecteur déroulant doré (barre de filtres du Atelier d'impression, refonte DA) : déclencheur + menu ancré,
// overlay de fermeture au clic extérieur. Or fixe assumé (identité DA), a11y : bouton + aria-expanded.
export function FilterSelect({ label, value, options, onPick }: { label: string; value: string; options: string[]; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  // Échap ferme ce qui se ferme en cliquant à côté (lot v139).
  useFermetureEchap(open, () => setOpen(false))
  return (
    <div style={{ position: "relative" }}>
      <button type="button" className="ps2-sel" aria-expanded={open} onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, background: "rgba(255,255,255,.025)", border: "1px solid #26211a", color: "var(--muted)", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>
        <span style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--faint)", fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>{value}</span>
        <span aria-hidden style={{ width: 6, height: 6, borderRight: "1.5px solid var(--accent)", borderBottom: "1.5px solid var(--accent)", transform: open ? "rotate(-135deg) translate(-1px,-1px)" : "rotate(45deg) translateY(-2px)", transition: "transform .22s ease" }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div role="listbox" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 41, minWidth: 190, maxHeight: 300, overflowY: "auto", background: "#17140f", border: "1px solid #2e281f", borderRadius: 12, padding: 6, boxShadow: "0 18px 44px rgba(0,0,0,.62)" }}>
            {options.map(o => {
              const on = o === value
              return (
                <button key={o} type="button" className="ps2-menuitem" onClick={() => { onPick(o); setOpen(false) }}
                  style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 10px", borderRadius: 8, background: on ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent", border: "none", color: on ? "#e8c877" : "var(--muted)", fontSize: 12.5, fontWeight: on ? 600 : 500, cursor: "pointer", textAlign: "left" }}>
                  {o}{on && <span aria-hidden style={{ width: 6, height: 6, borderRight: "1.5px solid var(--gold-light)", borderBottom: "1.5px solid var(--gold-light)", transform: "rotate(45deg)" }} />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Pastille de filtre actif (dorée) avec croix de retrait.
export function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 8px 5px 11px", borderRadius: 999, background: "color-mix(in srgb, var(--accent) 7%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)", color: "var(--gold-light)", fontSize: 11.5, fontWeight: 600 }}>
      {label}
      <button type="button" aria-label={`Retirer ${label}`} onClick={onClear} className="ps2-x" style={{ ...zoneDeTouche(14), borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 15%, transparent)", border: "none", cursor: "pointer", padding: 0 }}>
        <span style={{ position: "relative", width: 7, height: 7 }}>
          <span style={{ position: "absolute", top: 2.8, left: 0, width: 7, height: 1.4, background: "var(--gold-light)", transform: "rotate(45deg)" }} />
          <span style={{ position: "absolute", top: 2.8, left: 0, width: 7, height: 1.4, background: "var(--gold-light)", transform: "rotate(-45deg)" }} />
        </span>
      </button>
    </span>
  )
}

export function RailInline({ value, options, onPick }: { value: string; options: { id: string; label: string; note?: string }[]; onPick: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map(o => (
        <button key={o.id} className="ps-chip" onClick={() => onPick(o.id)} style={{ ...chipStyle(value === o.id), flexDirection: "column", alignItems: "flex-start", minWidth: o.note ? 108 : undefined }}>
          <span>{o.label}</span>{o.note && <span style={{ fontSize: 11.5, color: value === o.id ? "var(--ink-on-accent)" : C.fgFaint }}>{o.note}</span>}
        </button>
      ))}
    </div>
  )
}
export function chipStyle(on: boolean): React.CSSProperties {
  // minHeight 44 = cible tactile mobile (§12). alignItems center pour centrer le texte à cette hauteur.
  // Hiérarchie de l'or (review G) : SÉLECTION = or FAIBLE (fond doux + texte/bord or), jamais l'or plein
  // (réservé à l'action primaire « Vérifier & exporter »). Inactif = neutre.
  return { flexShrink: 0, minHeight: 44, padding: "10px 14px", borderRadius: R.chip, cursor: "pointer", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", border: `1px solid ${on ? C.gold : C.hairline}`, background: on ? C.goldSoft : C.surfaceUp, color: on ? C.gold : C.fg, display: "inline-flex", alignItems: "center", justifyContent: "center" }
}

export function Field({ label, children, affiche }: { label: string; children: React.ReactNode; affiche?: { on: boolean; basculer: () => void } }) {
  if (!affiche) return <div><p style={{ margin: "0 0 7px", fontSize: 11.5, fontWeight: 600, color: C.fgMuted }}>{label}</p>{children}</div>
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 0 7px" }}>
        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: C.fgMuted }}>{label}</p>
        <button type="button" role="switch" aria-checked={affiche.on} aria-label={`Afficher : ${label}`} onClick={affiche.basculer}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 36, padding: "0 4px", background: "none", border: "none", cursor: "pointer", color: affiche.on ? C.fg : C.fgMuted, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
          {affiche.on ? "Affiché" : "Masqué"}
          <span aria-hidden style={{ width: 34, height: 20, borderRadius: 999, background: affiche.on ? C.gold : "var(--field)", border: `1px solid ${affiche.on ? C.gold : C.hairline}`, position: "relative", transition: "background var(--mo-fast) var(--mo-ease-standard)" }}>
            <span style={{ position: "absolute", top: 2, left: affiche.on ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: affiche.on ? "#1a1408" : C.fgMuted, transition: "left var(--mo-fast) var(--mo-ease-standard)" }} />
          </span>
        </button>
      </div>
      {affiche.on && children}
    </div>
  )
}
// Rangée de suggestions CONTEXTUELLES (secondaire, compacte) : petites puces sous un input.
export function SuggRow({ items, active, onPick }: { items: string[]; active: string; onPick: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {items.map(m => {
        const on = active === m
        // 24 px de haut : impossible à viser au doigt. Le minimum tenable est 36.
        return <button key={m} className="ps-chip" onClick={() => onPick(m)} style={{ padding: "0 12px", minHeight: 36, display: "inline-flex", alignItems: "center", borderRadius: 8, cursor: "pointer", fontSize: 11.5, fontWeight: 600, border: `1px solid ${on ? C.gold : C.hairline}`, background: on ? C.goldSoft : "transparent", color: on ? C.gold : C.fgMuted, whiteSpace: "nowrap" }}>{m}</button>
      })}
    </div>
  )
}
export function Seg({ value, options, onPick, labels }: { value: string; options: string[]; onPick: (v: string) => void; labels?: string[] }) {
  return (
    // MÊME dessin que tous les segmenteurs de l'application (couche « Calme », v57) :
    // piste = champ + filet, segment retenu = surface-2 + encre + filet d'accent en
    // bas. L'or plein reste réservé à l'action primaire « Vérifier & exporter ».
    <div style={{ display: "flex", gap: 4, background: "var(--field)", border: "1px solid var(--line-strong)", borderRadius: 12, padding: 4 }}>
      {options.map((o, i) => <button key={o} onClick={() => onPick(o)} aria-pressed={value === o} style={{ flex: 1, minHeight: 40, borderRadius: 9, border: "none", cursor: "pointer", background: value === o ? "var(--surface-2)" : "transparent", color: value === o ? "var(--ink)" : C.fgMuted, boxShadow: value === o ? "inset 0 -2px 0 var(--accent)" : "none", fontSize: 12.5, fontWeight: value === o ? 700 : 500, fontFamily: "inherit" }}>{labels?.[i] ?? o}</button>)}
    </div>
  )
}
// La tuile « couleur précise » des accents : le nuancier du système, et la
// couleur choisie qui reste affichée (bordure dorée tant qu'elle est retenue).
export function TuileCouleurLibre({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const on = !!valeur
  return (
    <label title="Couleur précise" style={{ width: 44, height: 44, borderRadius: 12, cursor: "pointer", position: "relative", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      border: `2px solid ${on ? C.gold : C.hairline}`, boxShadow: on ? `0 0 0 2px ${C.goldA33}` : "none", background: valeur || "var(--field)" }}>
      {!on && <Plus size={18} color={C.fgMuted} aria-hidden="true" />}
      <input type="color" aria-label="Choisir une couleur précise" value={valeur || "#C9A84C"} onChange={e => onChange(e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none" }} />
    </label>
  )
}
export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // value === "" => auto (couleur du thème). Sinon un hex choisi librement.
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={() => onChange("")} style={{ ...chipStyle(value === ""), minHeight: 40 }}>Auto</button>
      <label style={{ width: 44, height: 44, borderRadius: 11, border: `2px solid ${value ? C.gold : C.hairline}`, cursor: "pointer", position: "relative", flexShrink: 0, background: value || "conic-gradient(from 210deg,#C9A84C,#D4483B,#3E9E6E,#3B6FD4,#7A5CD4,#C9A84C)", overflow: "hidden" }}>
        <input type="color" value={value || "#C9A84C"} onChange={e => onChange(e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none" }} />
      </label>
      {value && <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.fgMuted }}>{value}</span>}
    </div>
  )
}
export function Range({ value, min, max, step, onChange, hint, label }: { label?: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <input type="range" aria-label={label ?? hint ?? "Régler la valeur"} min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: "100%", accentColor: C.gold, height: 40, cursor: "pointer" }} />
      {hint && <div style={{ fontSize: 11.5, color: C.fgFaint, marginTop: -2 }}>{hint}</div>}
    </div>
  )
}
export function Swatch({ s, on, label, onClick }: { s: Style; on: boolean; label?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={s.label} style={{ borderRadius: 12, overflow: "hidden", border: `2px solid ${on ? C.gold : "transparent"}`, cursor: "pointer", background: "none", padding: 0 }}>
      <div style={{ height: 46, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: s.accent }} />
        <span style={{ width: 12, height: 12, borderRadius: 3, background: s.ink }} />
      </div>
      {label && <div style={{ fontSize: 11.5, color: C.fgMuted, padding: "3px 4px", background: C.surface, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>}
    </button>
  )
}
