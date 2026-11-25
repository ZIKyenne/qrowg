"use client"
// Les réglages d'un bloc sélectionné, dans le panneau de droite : onglets
// internes (mode Focus), Contenu, Style (modèles d'apparence, fond, bordure,
// coins, ombre), Apparence du bloc, Mise en page, Effets, Réglages avancés
// (visibilité, nom interne, actions). Sortis de BuilderV4 (vague 4, point 6).
//
// Rendu déplacé à l'identique. Aucun état propre : l'onglet ouvert, le
// presse-papiers de style et l'ouverture des réglages avancés restent dans
// l'éditeur, qui les garde d'un bloc à l'autre.
import React from "react"
import { propsInterrupteur } from "@/components/ui/interrupteur"
import { Button } from "@/components/ui/Button"
import { ChevronDown, Copy, Layers, Settings, Smartphone, Sparkles, Square, Trash2 } from "lucide-react"
import {
  BLOCK_GRADIENTS, BLOCK_RADIUS_OPTIONS, BLOCK_SHADOW_OPTIONS, BLOCK_SPACE_OPTIONS, BLOCK_WIDTH_OPTIONS,
  BLOCK_ANIM_OPTIONS, BLOCK_ANIM_SPEED_OPTIONS, BLOCK_HOVER_OPTIONS, BLOCK_LOOP_OPTIONS, BLOCK_INTENSITY_OPTIONS,
  type Block,
} from "./types"
import { BLOCK_STYLE_PRESETS } from "./editorPresets"
import { BLOCK_DEFS } from "./blockDefs"
import { EditPanel, Segmented, STYLE_COPY_KEYS, isAppearanceField } from "./builderPanels"
import { G, MUTED } from "./builderConstants"

export type OngletDuBloc = "contenu" | "style" | "effets"

export type ReglagesDuBlocProps = {
  selectedBlock: Block
  updateBlock: (id: string, key: string, value: string) => void
  setBlocks: (maj: (prev: Block[]) => Block[]) => void
  duplicateBlock: (id: string) => void
  deleteBlock: (id: string) => void
  focusMode: boolean
  isMobile: boolean
  editTab: OngletDuBloc
  setEditTab: (t: OngletDuBloc) => void
  styleClipboard: Record<string, string> | null
  setStyleClipboard: (s: Record<string, string> | null) => void
  avanceOuvert: boolean
  setAvanceOuvert: (maj: (v: boolean) => boolean) => void
}

export function ReglagesDuBloc({
  selectedBlock, updateBlock, setBlocks, duplicateBlock, deleteBlock, focusMode, isMobile,
  editTab, setEditTab, styleClipboard, setStyleClipboard, avanceOuvert, setAvanceOuvert,
}: ReglagesDuBlocProps) {
  const bc = selectedBlock.content as any
  const set = (k: string, v: string) => updateBlock(selectedBlock.id, k, v)
  const selStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 8, color: "var(--ink)", fontSize: 13, padding: "8px 9px", cursor: "pointer" }
  const labelStyle: React.CSSProperties = { color: MUTED, fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }
  const secTitle: React.CSSProperties = { color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 9px" }
  // Helpers appelés en ligne (sel/toggle) au lieu de composants JSX — évite un remontage à chaque rendu.
  const sel = (k: string, label: string, options: string[], def: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <Segmented value={bc[k] || def} options={options} onChange={v => set(k, v)} active={G} muted={MUTED} />
    </div>
  )
  const toggle = (k: string, label: string, icon: React.ReactNode) => {
    const on = bc[k] === "Oui"
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
        <span style={{ color: "var(--ink)", fontSize: 12, display: "flex", alignItems: "center", gap: 7 }}><span style={{ display: "inline-flex" }}>{icon}</span>{label}</span>
        <button {...propsInterrupteur(label, on)} onClick={() => set(k, on ? "" : "Oui")}
          style={{ width: 44, height: 32, borderRadius: 16, padding: 0, background: on ? G : "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
          <span style={{ position: "absolute", top: 4, left: on ? 20 : 4, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
        </button>
      </div>
    )
  }
  const active = STYLE_COPY_KEYS.some(k => bc[k] && !["Aucun", "Défaut", "Non", "Normale", "Aucune", "Plein", ""].includes(bc[k]))
  const applyPreset = (apply: Record<string, string>) => setBlocks(p => p.map(b => b.id === selectedBlock.id ? { ...b, content: { ...b.content, ...apply } } : b))
  const TABS = [
    { k: "contenu", label: "Contenu" },
    { k: "style", label: "Style" },
    { k: "effets", label: "Effets" },
  ] as const
  return (
    <>
      {/* Onglets internes : seulement en mode focus (le thème y est une colonne à part) */}
      {focusMode && <div role="tablist" style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--line)", margin: "0 0 14px" }}>
        {TABS.map(t => (
          <button key={t.k} role="tab" aria-selected={editTab===t.k} onClick={() => setEditTab(t.k)}
            style={{ flex: 1, minHeight: isMobile ? 44 : 40, padding: isMobile ? "10px 3px" : "8px 3px", border: "none", borderBottom: `2px solid ${editTab===t.k ? "var(--accent)" : "transparent"}`, marginBottom: -1, cursor: "pointer", background: "transparent", color: editTab===t.k ? "var(--ink)" : MUTED, fontSize: isMobile ? 12.5 : 12.5, fontWeight: editTab===t.k ? 600 : 500, transition: "color .18s ease, border-color .18s ease", whiteSpace: "nowrap" as const }}>{t.label}</button>
        ))}
      </div>}

      {/* CONTENU — toujours affiché en mode Simple, ou sous l'onglet Contenu en Expert */}
      {editTab === "contenu" && <EditPanel key={selectedBlock.id+"-c"} block={selectedBlock} onChange={set} only="content" />}

      {/* STYLE */}
      {editTab === "style" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 10px" }}>
            <p style={secTitle}>Modèles d&apos;apparence</p>
            {active && <button onClick={() => STYLE_COPY_KEYS.forEach(k => set(k, ""))} title="Réinitialiser l'apparence de ce bloc"
              style={{ background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>Réinitialiser</button>}
          </div>
          {/* Copier / coller le style entre blocs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setStyleClipboard(Object.fromEntries(STYLE_COPY_KEYS.map(k => [k, bc[k] || ""])))} title="Copier l'apparence de ce bloc"
              className="da-btn-neutral da-btn-neutral--sm" style={{ flex: 1, padding: "8px", fontSize: 11 }}>
              <Copy size={11} /> Copier le style
            </button>
            <button onClick={() => { if (styleClipboard) applyPreset(styleClipboard) }} disabled={!styleClipboard} title={styleClipboard ? "Appliquer l'apparence copiée" : "Copiez d'abord le style d'un bloc"}
              className="da-btn-neutral da-btn-neutral--sm" style={{ flex: 1, padding: "8px", fontSize: 11, borderColor: styleClipboard ? "color-mix(in srgb, var(--accent) 45%, transparent)" : undefined, color: styleClipboard ? G : "var(--faint)", cursor: styleClipboard ? "pointer" : "not-allowed" }}>
              Coller le style
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {BLOCK_STYLE_PRESETS.map(p => (
              <button key={p.key} onClick={() => applyPreset(p.apply)} title={`Appliquer le style ${p.label}`}
                className="qf-row"
                style={{ display: "flex", alignItems: "center", gap: 5, minHeight: 32, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line-strong)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                <span style={{ fontSize: 13 }}>{p.emoji}</span>{p.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Fond dégradé — sélecteur visuel (swatches), fini le menu natif blanc */}
            <div>
              <label style={labelStyle}>Fond dégradé</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {[["Aucun", "transparent"] as const, ...Object.entries(BLOCK_GRADIENTS)].map(([name, val]) => {
                  const sel = (bc.__grad || "Aucun") === name
                  return (
                    <button key={name} onClick={() => set("__grad", name === "Aucun" ? "" : name)} title={name}
                      style={{ height: 34, borderRadius: 8, cursor: "pointer", border: sel ? `2px solid ${G}` : "1px solid rgba(255,255,255,0.12)", background: name === "Aucun" ? "repeating-conic-gradient(rgba(255,255,255,0.06) 0% 25%, transparent 0% 50%) 50% / 10px 10px" : val, position: "relative", padding: 0 }}>
                      {name === "Aucun" && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: MUTED }}>Aucun</span>}
                      {sel && name !== "Aucun" && <span style={{ position: "absolute", top: 2, right: 3, color: "#fff", fontSize: 11, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
            {(!bc.__grad || bc.__grad === "Aucun") && (
              <div>
                <label style={labelStyle}>Fond (couleur unie)</label>
                <div style={{ display: "flex", gap: 7 }}>
                  <input type="color" aria-label="Couleur de fond du bloc" value={bc.__bg || "#111111"} onChange={e => set("__bg", e.target.value)} style={{ width: 34, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0, background: "none" }} />
                  <input type="text" value={bc.__bg || ""} onChange={e => set("__bg", e.target.value)} placeholder="Aucun (transparent)" style={{ ...selStyle, flex: 1, cursor: "text" }} />
                  {bc.__bg && <Button onClick={() => set("__bg", "")} title="Retirer le fond" variant="ghost" size="sm">✕</Button>}
                </div>
              </div>
            )}
            {/* Intensité : n'a de sens que si un fond est actif */}
            {((bc.__grad && bc.__grad !== "Aucun") || (bc.__bg && bc.__bg.startsWith("#"))) && (
              <div>
                <label style={labelStyle}>Intensité du fond</label>
                <Segmented value={bc.__intensity || "Plein"} options={BLOCK_INTENSITY_OPTIONS} onChange={v => set("__intensity", v)} active={G} muted={MUTED} />
                <p style={{ color: MUTED, fontSize: 11.5, margin: "4px 0 0" }}>« Léger » laisse transparaître le fond de la page — plus doux, texte toujours lisible.</p>
              </div>
            )}
            {toggle("__border", "Bordure", <Square size={12} />)}
            {sel("__radius", "Coins arrondis", BLOCK_RADIUS_OPTIONS, "Défaut")}
            {sel("__shadow", "Ombre", BLOCK_SHADOW_OPTIONS, "Non")}
          </div>
        </div>
      )}

      {/* APPARENCE DU BLOC — les réglages visuels propres au bloc (forme, contour,
          fond, ombre, couleurs, style…) : dans Style, jamais dans Contenu (revue du 9 septembre). */}
      {editTab === "style" && (BLOCK_DEFS[selectedBlock.type]?.fields ?? []).some(f => isAppearanceField(f as any)) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <p style={secTitle}>Apparence du bloc</p>
          <EditPanel key={selectedBlock.id+"-a"} block={selectedBlock} onChange={set} only="apparence" />
        </div>
      )}
      {/* MISE EN PAGE — vit dans l'onglet Style, après l'apparence */}
      {editTab === "style" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <p style={secTitle}>Mise en page</p>
          <EditPanel key={selectedBlock.id+"-l"} block={selectedBlock} onChange={set} only="layout" />
          {sel("__width", "Largeur du bloc", BLOCK_WIDTH_OPTIONS, "Normale")}
          {sel("__space", "Espacement vertical", BLOCK_SPACE_OPTIONS, "Défaut")}
          {/* Taille du texte — curseur (met à l'échelle le contenu du bloc). 100 % = normal. */}
          <div>
            <label style={labelStyle}>Taille du texte</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="range" min={80} max={140} step={5}
                value={Number(bc.__text_scale) || 100}
                onChange={e => set("__text_scale", e.target.value === "100" ? "" : e.target.value)}
                aria-label="Taille du texte" style={{ flex: 1, accentColor: G }} />
              <span style={{ minWidth: 42, textAlign: "right", color: "var(--ink)", fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{Number(bc.__text_scale) || 100}%</span>
            </div>
            {(Number(bc.__text_scale) || 100) !== 100 && (
              <button onClick={() => set("__text_scale", "")} style={{ marginTop: 5, background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}>Réinitialiser</button>
            )}
          </div>
        </div>
      )}

      {/* EFFETS */}
      {editTab === "effets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={secTitle}>Animations</p>
          {sel("__anim", "À l'apparition (au scroll)", BLOCK_ANIM_OPTIONS, "Aucune")}
          {bc.__anim && bc.__anim !== "Aucune" && sel("__anim_speed", "Vitesse d'apparition", BLOCK_ANIM_SPEED_OPTIONS, "Normal")}
          {sel("__hover", "Au survol", BLOCK_HOVER_OPTIONS, "Aucun")}
          {sel("__loop", "En boucle (emphase)", BLOCK_LOOP_OPTIONS, "Aucune")}
          <p style={{ color: MUTED, fontSize: 11, margin: "-2px 0 0" }}>L&apos;apparition se déclenche quand le bloc entre à l&apos;écran (visible sur la page publiée).</p>
          <p style={{ ...secTitle, marginTop: 8 }}>Lumière et matière</p>
          {toggle("__glow", "Halo lumineux (glow)", <Sparkles size={12} />)}
          {toggle("__glass", "Effet verre (flou)", <Layers size={12} />)}
        </div>
      )}

      {/* RÉGLAGES AVANCÉS — repliés par défaut (maquette), sous chaque onglet : visibilité, nom interne, actions */}
      <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
        <button type="button" onClick={() => setAvanceOuvert(v => !v)} aria-expanded={avanceOuvert} aria-controls="reglages-avances-bloc"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 44, padding: "0 12px", border: "1px solid var(--line-strong)", borderRadius: 9, background: "var(--surface-2)", color: "var(--ink)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Settings size={14} aria-hidden="true" /> Réglages avancés</span>
          <ChevronDown size={14} aria-hidden="true" style={{ transform: avanceOuvert ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
        </button>
        {avanceOuvert && (
        <div id="reglages-avances-bloc" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>
          <div>
            <p style={secTitle}>Visibilité</p>
            {[
              { key: "hide_mobile", label: "Afficher sur mobile", icon: <Smartphone size={12} aria-hidden="true" /> },
              { key: "hide_desktop", label: "Afficher sur ordinateur", icon: <Square size={12} aria-hidden="true" /> },
            ].map(o => {
              const shown = bc[o.key] !== "yes" // "yes" = masqué
              return (
                <div key={o.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0" }}>
                  <span style={{ color: "var(--ink)", fontSize: 12, display: "flex", alignItems: "center", gap: 7 }}><span style={{ display: "inline-flex" }}>{o.icon}</span>{o.label}</span>
                  <button {...propsInterrupteur(`Afficher ${o.label}`, shown)} onClick={() => set(o.key, shown ? "yes" : "")} title={shown ? "Cliquer pour masquer" : "Cliquer pour afficher"}
                    style={{ width: 44, height: 32, borderRadius: 16, padding: 0, background: shown ? G : "var(--surface-2)", border: "1px solid var(--line-strong)", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                    <span style={{ position: "absolute", top: 4, left: shown ? 20 : 4, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                  </button>
                </div>
              )
            })}
            {(bc.hide_mobile === "yes" || bc.hide_desktop === "yes") && (
              <p style={{ color: "var(--warning)", fontSize: 11, margin: "4px 0 0" }}>⚠ Ce bloc est masqué sur {bc.hide_mobile === "yes" ? "mobile" : ""}{bc.hide_mobile === "yes" && bc.hide_desktop === "yes" ? " et " : ""}{bc.hide_desktop === "yes" ? "ordinateur" : ""} (page publiée).</p>
            )}
          </div>
          <div>
            <p style={secTitle}>Nom interne</p>
            <input type="text" value={bc.__name || ""} onChange={e => set("__name", e.target.value)} placeholder="Ex : Section horaires (privé)" aria-label="Nom interne du bloc" style={{ ...selStyle, cursor: "text" }} />
            <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0" }}>Aide-mémoire visible uniquement par vous.</p>
          </div>
          <div>
            <p style={secTitle}>Actions</p>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => duplicateBlock(selectedBlock.id)} className="da-btn-neutral da-btn-neutral--sm" style={{ flex: 1 }}><Copy size={11} /> Dupliquer</button>
              {!selectedBlock.locked && <Button onClick={() => deleteBlock(selectedBlock.id)} variant="danger" size="sm"><Trash2 size={11} /> Supprimer</Button>}
            </div>
          </div>
        </div>
        )}
      </div>
    </>
  )
}
