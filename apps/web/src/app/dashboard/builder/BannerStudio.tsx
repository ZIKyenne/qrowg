"use client"

import { useState } from "react"
import { ImageIcon, LayoutGrid, Type, Palette, Sparkles, Layers, ChevronDown } from "lucide-react"
import ImageUpload from "./ImageUpload"
import { BANNER_GRADIENTS, BANNER_PRESETS } from "./types"

const G = "#C9A84C"
const MUTED = "#8A8478"
const TEXT = "#F5F0E8"

// ── Section repliable (accordéon, une seule ouverte à la fois) ───────────────
function Section({ id, title, icon, open, onToggle, children }: { id: string; title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${open ? "rgba(201,168,76,0.28)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, overflow: "hidden", background: open ? "rgba(201,168,76,0.04)" : "transparent", transition: "border-color .2s, background .2s" }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", background: "transparent", border: "none", cursor: "pointer", color: open ? G : TEXT, textAlign: "left" }}>
        <span style={{ display: "flex", color: open ? G : MUTED }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{title}</span>
        <ChevronDown size={15} style={{ color: MUTED, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .22s ease" }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "2px 13px 14px", display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

// ── Slider avec valeur live + double-clic = reset ────────────────────────────
function Slider({ label, value, min, max, step = 1, unit = "", def, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; def: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <label style={{ color: MUTED, fontSize: 11, fontWeight: 500 }}>{label}</label>
        <span style={{ color: G, fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        onDoubleClick={() => onChange(def)}
        title="Double-clic pour réinitialiser"
        style={{ width: "100%", accentColor: G, cursor: "pointer" }} />
    </div>
  )
}

// ── Grille de position 3×3 ───────────────────────────────────────────────────
const POS_GRID = [
  ["top-left", "top-center", "top-right"],
  ["left", "center", "right"],
  ["bottom-left", "bottom-center", "bottom-right"],
]
function PositionGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // On mappe la grille sur les 3 positions réellement supportées par le rendu
  const norm = (p: string) => p.includes("center") && p !== "center" ? p : (p === "center" ? "center" : p.startsWith("bottom") ? (p === "bottom-center" ? "bottom-center" : "bottom-left") : p === "center" ? "center" : "bottom-left")
  return (
    <div>
      <label style={{ color: MUTED, fontSize: 11, fontWeight: 500, display: "block", marginBottom: 6 }}>Position du texte</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, width: 96 }}>
        {POS_GRID.flat().map(p => {
          const active = value === p || (value === "bottom-left" && p === "bottom-left") || (value === "bottom-center" && p === "bottom-center") || (value === "center" && p === "center")
          return (
            <button key={p} onClick={() => onChange(p)} title={p}
              style={{ aspectRatio: "1", borderRadius: 6, background: active ? G : "rgba(255,255,255,0.05)", border: `1px solid ${active ? G : "rgba(255,255,255,0.1)"}`, cursor: "pointer", transition: "all .15s", position: "relative" }}>
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 5, height: 5, borderRadius: "50%", background: active ? "#080808" : "rgba(255,255,255,0.35)" }} />
            </button>
          )
        })}
      </div>
      <p style={{ color: MUTED, fontSize: 9.5, margin: "5px 0 0" }}>Le rendu supporte : bas-gauche, bas-centre, centre.</p>
    </div>
  )
}

// ── Sélecteur segmenté ───────────────────────────────────────────────────────
function Segmented({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 3 }}>
      {options.map(o => {
        const on = value === o.key
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{ flex: 1, padding: "7px 4px", borderRadius: 7, background: on ? G : "transparent", border: "none", color: on ? "#080808" : MUTED, fontSize: 11, fontWeight: on ? 700 : 500, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>{o.label}</button>
        )
      })}
    </div>
  )
}

// ── Chips (choix multiple visuel, ex. animations / dégradés) ─────────────────
function Chips({ options, value, onChange, cols = 3 }: { options: { key: string; label: string; emoji?: string }[]; value: string; onChange: (v: string) => void; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 6 }}>
      {options.map(o => {
        const on = value === o.key
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 4px", borderRadius: 9, background: on ? "rgba(201,168,76,0.16)" : "rgba(255,255,255,0.04)", border: `1px solid ${on ? "rgba(201,168,76,0.45)" : "rgba(255,255,255,0.08)"}`, color: on ? G : MUTED, fontSize: 10.5, fontWeight: on ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>
            {o.emoji && <span style={{ fontSize: 15 }}>{o.emoji}</span>}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function ColorRow({ label, value, fallback, onChange }: { label: string; value?: string; fallback: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <label style={{ color: MUTED, fontSize: 11, fontWeight: 500 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <input value={value || ""} placeholder={fallback} onChange={e => onChange(e.target.value)} style={{ width: 84, background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 7, padding: "6px 8px", color: TEXT, fontSize: 11, outline: "none", fontFamily: "monospace" }} />
        <label style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: value || fallback, cursor: "pointer", flexShrink: 0, position: "relative", overflow: "hidden" }}>
          <input type="color" value={value || fallback} onChange={e => onChange(e.target.value)} style={{ position: "absolute", inset: -4, width: 40, height: 40, border: "none", padding: 0, cursor: "pointer", opacity: 0 }} />
        </label>
      </div>
    </div>
  )
}

const GRAD_OPTS = [
  ...Object.keys(BANNER_GRADIENTS).map(k => ({ key: k, label: k.replace("_", " ") })),
  { key: "personnalise", label: "perso" },
]
const ANIM_OPTS = [
  { key: "none", label: "Aucune", emoji: "⏹" },
  { key: "shimmer", label: "Shimmer", emoji: "✨" },
  { key: "gradient_flow", label: "Flux", emoji: "🌈" },
  { key: "floating", label: "Flottant", emoji: "🎈" },
  { key: "kenburns", label: "Ken Burns", emoji: "🎬" },
  { key: "zoom", label: "Zoom", emoji: "🔍" },
  { key: "pulse", label: "Pulse", emoji: "💓" },
]

export default function BannerStudio({ content, onChange }: { content: Record<string, any>; onChange: (key: string, val: string) => void }) {
  const c = content
  const [open, setOpen] = useState<string>("image")
  const toggle = (id: string) => setOpen(o => o === id ? "" : id)
  const set = (k: string, v: any) => onChange(k, String(v))
  const applyPreset = (preset: Record<string, any>) => { Object.entries(preset).forEach(([k, v]) => onChange(k, String(v))) }

  const type = c.banner_type || (c.src ? "image" : "gradient")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 2px 6px" }}>
        <Sparkles size={14} color={G} />
        <span style={{ color: G, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Studio de bannière</span>
      </div>

      {/* IMAGE / FOND */}
      <Section id="image" title="Image & Fond" icon={<ImageIcon size={15} />} open={open === "image"} onToggle={() => toggle("image")}>
        <Segmented value={type} onChange={v => set("banner_type", v)} options={[{ key: "image", label: "Image" }, { key: "gradient", label: "Dégradé" }, { key: "color", label: "Couleur" }]} />
        {type === "image" && <ImageUpload value={c.src || ""} onChange={url => set("src", url)} hint="Glissez-déposez, collez ou importez une URL" />}
        {type === "gradient" && (
          <>
            <Chips value={c.grad_preset || "or_nuit"} onChange={v => set("grad_preset", v)} cols={3} options={GRAD_OPTS} />
            {c.grad_preset === "personnalise" && (
              <>
                <ColorRow label="Couleur 1" value={c.grad_c1} fallback={G} onChange={v => set("grad_c1", v)} />
                <ColorRow label="Couleur 2" value={c.grad_c2} fallback="#1a1206" onChange={v => set("grad_c2", v)} />
              </>
            )}
          </>
        )}
        {type === "color" && <ColorRow label="Couleur de fond" value={c.bg_color} fallback="#1a1a1a" onChange={v => set("bg_color", v)} />}
      </Section>

      {/* MISE EN PAGE */}
      <Section id="layout" title="Mise en page" icon={<LayoutGrid size={15} />} open={open === "layout"} onToggle={() => toggle("layout")}>
        <Slider label="Hauteur" value={parseInt(c.height_px) || 180} min={80} max={420} unit=" px" def={180} onChange={v => set("height_px", v)} />
        <Slider label="Coins arrondis" value={parseInt(c.block_radius) || 0} min={0} max={32} unit=" px" def={0} onChange={v => set("block_radius", v)} />
        <PositionGrid value={c.text_position || "bottom-left"} onChange={v => set("text_position", v)} />
      </Section>

      {/* CONTENU */}
      <Section id="content" title="Contenu" icon={<Type size={15} />} open={open === "content"} onToggle={() => toggle("content")}>
        <Field label="Badge (optionnel)" value={c.badge} placeholder="Nouveau · Premium…" onChange={v => set("badge", v)} />
        <Field label="Titre" value={c.cover_title} placeholder="Mon titre…" max={40} onChange={v => set("cover_title", v)} />
        <Field label="Sous-titre" value={c.cover_subtitle} placeholder="Une phrase d'accroche…" max={70} onChange={v => set("cover_subtitle", v)} />
        <ColorRow label="Couleur du texte" value={c.text_color} fallback="#ffffff" onChange={v => set("text_color", v)} />
      </Section>

      {/* COULEURS & OVERLAY */}
      <Section id="overlay" title="Couleurs & Overlay" icon={<Palette size={15} />} open={open === "overlay"} onToggle={() => toggle("overlay")}>
        <div>
          <label style={{ color: MUTED, fontSize: 11, fontWeight: 500, display: "block", marginBottom: 6 }}>Voile de lisibilité</label>
          <Segmented value={c.overlay_gradient || "none"} onChange={v => set("overlay_gradient", v)} options={[{ key: "none", label: "Aucun" }, { key: "bottom", label: "Dégradé bas" }, { key: "full", label: "Plein" }]} />
        </div>
        <ColorRow label="Couleur voile" value={c.overlay_color} fallback="#000000" onChange={v => set("overlay_color", v)} />
        <Slider label="Opacité voile" value={Math.round((parseFloat(c.overlay_opacity ?? "0") || 0) * 100)} min={0} max={90} unit=" %" def={0} onChange={v => set("overlay_opacity", (v / 100).toFixed(2))} />
      </Section>

      {/* EFFETS & ANIMATION */}
      <Section id="anim" title="Effets & Animation" icon={<Sparkles size={15} />} open={open === "anim"} onToggle={() => toggle("anim")}>
        <Chips value={c.animation || "none"} onChange={v => set("animation", v)} cols={4} options={ANIM_OPTS} />
        <p style={{ color: MUTED, fontSize: 10, margin: 0, lineHeight: 1.5 }}>L'animation s'affiche sur la page publiée. « Shimmer » ajoute un reflet, « Flux » anime le dégradé, « Ken Burns » fait vivre l'image.</p>
      </Section>

      {/* MODELES */}
      <Section id="presets" title="Modèles" icon={<Layers size={15} />} open={open === "presets"} onToggle={() => toggle("presets")}>
        <p style={{ color: MUTED, fontSize: 10.5, margin: 0 }}>Un clic configure toute la bannière. Ajoutez ensuite votre image ou vos couleurs.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 7 }}>
          {BANNER_PRESETS.map(p => (
            <button key={p.key} onClick={() => applyPreset(p.content)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 11px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: TEXT, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s", textAlign: "left" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; e.currentTarget.style.background = "rgba(201,168,76,0.08)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 17 }}>{p.emoji}</span>{p.label}
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}

// Champ texte avec compteur optionnel
function Field({ label, value, placeholder, max, onChange }: { label: string; value?: string; placeholder?: string; max?: number; onChange: (v: string) => void }) {
  const len = (value || "").length
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <label style={{ color: MUTED, fontSize: 11, fontWeight: 500 }}>{label}</label>
        {max && <span style={{ color: len > max ? "#EF4444" : MUTED, fontSize: 10, fontVariantNumeric: "tabular-nums" }}>{len}/{max}</span>}
      </div>
      <input value={value || ""} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "9px 11px", color: TEXT, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif" }} />
    </div>
  )
}
