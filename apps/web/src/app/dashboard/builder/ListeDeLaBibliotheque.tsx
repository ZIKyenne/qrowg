"use client"
// La liste de la bibliothèque de blocs (colonne de gauche, panneau déplié) —
// sortie de BuilderV4 (vague 4, point 6). Résultats de recherche, Essentiels,
// Récents, Favoris, catégories en accordéon et modèles par métier.
// Rendu déplacé à l'identique. Aucun état propre : la catégorie active, la
// recherche, les favoris et les actions restent ceux de l'éditeur.
import React from "react"
import { Button } from "@/components/ui/Button"
import { ChevronDown, Sparkles } from "lucide-react"
import { BLOCK_CATEGORIES, SOCIAL_PRESETS } from "./types"
import { IDENTITY_PRESETS, ACTION_PRESETS, COMMERCE_PRESETS, MEDIA_PRESETS, INFO_PRESETS } from "./editorPresets"
import { BLOCK_DEFS, blocsProposables } from "./blockDefs"
import { G, MUTED } from "./builderConstants"
import { styleDeDescription } from "./descriptionQuiTient"

type EntreeDeBloc = [string, (typeof BLOCK_DEFS)[string]]

/** Surligne la première occurrence de la recherche dans un libellé. */
export function hlText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const lo = text.toLowerCase()
  const idx = lo.indexOf(query.toLowerCase())
  if (idx === -1) return text
  return <>{text.slice(0, idx)}<mark style={{ background: "color-mix(in srgb, var(--accent) 25%, transparent)", color: "var(--ink)", borderRadius: 2, padding: "0 1px" }}>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>
}

export type ListeDeLaBibliothequeProps = {
  search: string
  setSearch: (s: string) => void
  filteredBlocks: EntreeDeBloc[]
  groupedResults: { cat: (typeof BLOCK_CATEGORIES)[number]; blocks: EntreeDeBloc[] }[] | null
  activeCategory: string
  recentBlocks: string[]
  favorites: string[]
  isMobile: boolean
  metierOpen: boolean
  setMetierOpen: (maj: (o: boolean) => boolean) => void
  addBlock: (type: string) => void
  showPopover: (type: string, e: React.MouseEvent | React.FocusEvent) => void
  hidePopover: () => void
  toggleFav: (type: string) => void
  isFav: (type: string) => boolean
  isCatCollapsed: (catId: string) => boolean
  toggleCat: (catId: string) => void
  generateIdentityPreset: (p: (typeof IDENTITY_PRESETS)[number]) => void
  generateActionPreset: (p: (typeof ACTION_PRESETS)[number]) => void
  generateSocialPreset: (p: (typeof SOCIAL_PRESETS)[number]) => void
  generateCommercePreset: (p: (typeof COMMERCE_PRESETS)[number]) => void
  generateMediaPreset: (p: (typeof MEDIA_PRESETS)[number]) => void
  generateInfoPreset: (p: (typeof INFO_PRESETS)[number]) => void
}

export function ListeDeLaBibliotheque({
  search, setSearch, filteredBlocks, groupedResults, activeCategory, recentBlocks, favorites, isMobile,
  metierOpen, setMetierOpen, addBlock, showPopover, hidePopover, toggleFav, isFav, isCatCollapsed, toggleCat,
  generateIdentityPreset, generateActionPreset, generateSocialPreset, generateCommercePreset, generateMediaPreset, generateInfoPreset,
}: ListeDeLaBibliothequeProps) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "5px 6px" }}>
      {search
        ? (filteredBlocks.length===0
          ? (
            <div style={{ padding: "30px 14px", textAlign: "center" }}>
              <p style={{ fontSize: 22, margin: "0 0 8px" }}>🔍</p>
              <p style={{ color: "var(--ink)", fontSize: 12, fontWeight: 600, margin: "0 0 3px" }}>Aucun bloc trouvé</p>
              <p style={{ color: MUTED, fontSize: 11, margin: "0 0 12px" }}>"{search}"</p>
              <Button onClick={() => setSearch("")} size="sm">Effacer</Button>
            </div>
          )
          : (<>
            {(groupedResults||[]).map(({ cat, blocks: catBlocks }) => (
              <div key={cat.id} style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 6px 3px" }}>
                  <span style={{ fontSize: 11 }}>{cat.icon}</span>
                  <span style={{ color: cat.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>{cat.label}</span>
                  <span style={{ color: MUTED, fontSize: 11 }}>·{catBlocks.length}</span>
                </div>
                {catBlocks.map(([type, def]) => (
                  <button key={type} onClick={() => addBlock(type)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left" as const, marginBottom: 1 }}
                    onFocus={e => showPopover(type, e)} onBlur={hidePopover}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--ink)"; showPopover(type, e) }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = MUTED; hidePopover() }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{def.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hlText(def.label, search)}</p>
                      <p style={{ ...styleDeDescription(), color: MUTED }}>{hlText(def.description, search)}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </>)
        )
        : (
          /* Mode normal — accordéon par catégorie */
          <>
            {/* Essentiels — liste plate des ~20 blocs les plus utiles (QWG-0019b) */}
            {activeCategory==="essentials" && filteredBlocks.map(([type, def]) => (
              <button key={type} onClick={() => addBlock(type)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left" as const, marginBottom: 2 }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = "var(--surface)"; el.style.color = "var(--ink)" }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{def.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "inherit", lineHeight: 1.2 }}>{def.label}</p>
                  <p style={{ ...styleDeDescription(), color: MUTED }}>{def.description}</p>
                </div>
                <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); toggleFav(type) }}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleFav(type) } }}
                  title={isFav(type) ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={isFav(type)}
                  style={{ width: 32, height: 32, margin: "-5px -5px -5px 0", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", flexShrink: 0, fontSize: 14, opacity: isFav(type) ? 1 : 0, color: isFav(type) ? "#FFD700" : MUTED }}
                  className="fav-star">
                  {isFav(type) ? "⭐" : "☆"}
                </span>
              </button>
            ))}
            {/* Récents */}
            {activeCategory==="recents" && recentBlocks.length > 0 && filteredBlocks.map(([type, def]) => (
              <button key={type} onClick={() => addBlock(type)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left" as const, marginBottom: 2 }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = "var(--action)10"; el.style.color = "var(--ink)" }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{def.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "inherit", lineHeight: 1.2 }}>{def.label}</p>
                  <p style={{ ...styleDeDescription(), color: MUTED }}>{def.description}</p>
                </div>
                <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); toggleFav(type) }}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleFav(type) } }}
                  title={isFav(type) ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={isFav(type)}
                  style={{ width: 32, height: 32, margin: "-5px -5px -5px 0", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", flexShrink: 0, fontSize: 14, opacity: isFav(type) ? 1 : 0, color: isFav(type) ? "#FFD700" : MUTED }}
                  className="fav-star">
                  {isFav(type) ? "⭐" : "☆"}
                </span>
              </button>
            ))}
            {/* Favoris */}
            {activeCategory==="favorites" && favorites.length > 0 && filteredBlocks.map(([type, def]) => (
              <button key={type} onClick={() => addBlock(type)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left" as const, marginBottom: 2 }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = "#FFD70010"; el.style.color = "var(--ink)" }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{def.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "inherit", lineHeight: 1.2 }}>{def.label}</p>
                  <p style={{ ...styleDeDescription(), color: MUTED }}>{def.description}</p>
                </div>
                <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); toggleFav(type) }}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleFav(type) } }}
                  title="Retirer des favoris" aria-pressed
                  style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", flexShrink: 0, fontSize: 13, opacity: 1, color: "#FFD700" }}
                  className="fav-star">⭐</span>
              </button>
            ))}
            {/* Catégories normales en accordéon */}
            {activeCategory!=="recents" && activeCategory!=="favorites" && (
              <div>
                {/* Header catégorie active avec collapse */}
                {(() => {
                  const cat = BLOCK_CATEGORIES.find(c => c.id===activeCategory)
                  if (!cat) return null
                  const collapsed = isCatCollapsed(activeCategory)
                  const catBlocks = blocsProposables().filter(([, def]) => def.category === activeCategory)
                  // Sous-groupes clairs pour la section Identité (Essentiel / Image / Présentation / Confiance)
                  const IDENTITY_GROUPS: { label: string; keys: string[] }[] = [
                    { label: "Essentiel",    keys: ["profile", "bio"] },
                    { label: "Image",        keys: ["cover_banner"] },
                    { label: "Présentation", keys: ["skills", "about", "expertise", "languages", "journey"] },
                    { label: "Confiance",    keys: ["availability", "certifications"] },
                    // Preuve sociale : blocs existants (rendu déjà en place) rendus découvrables ici
                    { label: "Preuve sociale", keys: ["business_stats", "testimonials", "visit_counter"] },
                  ]
                  const RECO = new Set(["profile"])
                  const blockBtn = (type: string, def: any) => (
                    <button key={type} onClick={() => addBlock(type)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left" as const, marginBottom: 2, transition: "all 0.15s" }}
                      onFocus={e => showPopover(type, e)} onBlur={hidePopover}
                      onMouseEnter={e => { const el = e.currentTarget; el.style.background = "var(--surface)"; el.style.color = "var(--ink)"; el.style.borderColor = "var(--line-strong)"; const star = el.querySelector(".fav-star") as HTMLElement; if(star && !isFav(type)) star.style.opacity = "0.5"; showPopover(type, e) }}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED; el.style.borderColor = "transparent"; const star = el.querySelector(".fav-star") as HTMLElement; if(star && !isFav(type)) star.style.opacity = "0"; hidePopover() }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{def.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "inherit", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{def.label}</p>
                          {RECO.has(type) && <span style={{ flexShrink: 0, background: "color-mix(in srgb, var(--accent) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)", color: G, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, borderRadius: 6, padding: "1px 5px", textTransform: "uppercase" as const }}>★ Reco</span>}
                        </div>
                        <p style={{ ...styleDeDescription(), color: MUTED }}>{def.description}</p>
                      </div>
                      <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); toggleFav(type) }}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleFav(type) } }}
                        title={isFav(type) ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={isFav(type)}
                        style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", flexShrink: 0, fontSize: 13, opacity: isFav(type) ? 1 : 0, transition: "opacity 0.15s", color: isFav(type) ? "#FFD700" : MUTED }}
                        className="fav-star">
                        {isFav(type) ? "⭐" : "☆"}
                      </span>
                    </button>
                  )
                  const subHeader = { color: MUTED, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.2, margin: "9px 6px 3px" }
                  return (
                    <div>
                      <button onClick={() => toggleCat(activeCategory)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 9px 6px", background: "transparent", border: "none", borderBottom: `1px solid rgba(255,255,255,0.05)`, cursor: "pointer", marginBottom: collapsed ? 0 : 4 }}>
                        <span style={{ fontSize: 13 }}>{cat.icon}</span>
                        <span style={{ color: cat.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.5, flex: 1, textAlign: "left" as const }}>{cat.label}</span>
                        <span style={{ color: MUTED, fontSize: 11, marginRight: 4 }}>{catBlocks.length}</span>
                        <span style={{ color: MUTED, fontSize: 11, display: "inline-block", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
                      </button>
                      {!collapsed && (activeCategory === "identity"
                        ? (() => {
                            const grouped = IDENTITY_GROUPS.flatMap(g => g.keys)
                            const rest = catBlocks.filter(([t]) => !grouped.includes(t)) // blocs identité non classés -> "Autres"
                            return (<>
                              {/* Modèles par métier : 1 clic crée une identité adaptée */}
                              <div style={{ margin: "0 0 10px" }}>
                                <button type="button" onClick={() => setMetierOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, width: "100%", background: metierOpen ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "color-mix(in srgb, var(--accent) 9%, transparent)", border: `1px solid ${metierOpen ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "color-mix(in srgb, var(--accent) 30%, transparent)"}`, borderRadius: 9, cursor: "pointer", padding: "9px 12px", margin: "8px 0" }}><span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink)", fontSize: 12.5, fontWeight: 700 }}><Sparkles size={13} /> Modèles par métier</span><ChevronDown size={15} color={G} style={{ transform: metierOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                  {metierOpen && IDENTITY_PRESETS.map(p => (
                                    <button key={p.key} type="button" onClick={() => generateIdentityPreset(p)} title={`Crée : ${p.blocks.map(b => (BLOCK_DEFS as any)[b.type]?.label || b.type).join(", ")}`}
                                      style={{ display: "flex", alignItems: "center", gap: 7, minHeight: isMobile ? 46 : undefined, padding: isMobile ? "11px 11px" : "9px 10px", borderRadius: 10, border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)", cursor: "pointer", background: "color-mix(in srgb, var(--accent) 5%, transparent)", color: "var(--ink)", fontSize: isMobile ? 12 : 11, fontWeight: 600, textAlign: "left" as const, transition: "all .15s" }}
                                      onMouseEnter={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 12%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, transparent)" }}
                                      onMouseLeave={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 5%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                                      <span style={{ fontSize: 16 }}>{p.emoji}</span>
                                      <span style={{ flex: 1, lineHeight: 1.2 }}>{p.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {IDENTITY_GROUPS.map(g => {
                                const gb = g.keys.filter(k => (BLOCK_DEFS as any)[k])
                                if (!gb.length) return null
                                return (
                                  <div key={g.label}>
                                    <p style={subHeader}>{g.label}</p>
                                    {gb.map(k => blockBtn(k, (BLOCK_DEFS as any)[k]))}
                                  </div>
                                )
                              })}
                              {rest.length > 0 && (<div><p style={subHeader}>Autres</p>{rest.map(([t, d]) => blockBtn(t, d))}</div>)}
                            </>)
                          })()
                        : activeCategory === "actions"
                        ? (<>
                            <div style={{ margin: "2px 0 10px" }}>
                              <button type="button" onClick={() => setMetierOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, width: "100%", background: metierOpen ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "color-mix(in srgb, var(--accent) 9%, transparent)", border: `1px solid ${metierOpen ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "color-mix(in srgb, var(--accent) 30%, transparent)"}`, borderRadius: 9, cursor: "pointer", padding: "9px 12px", margin: "8px 0" }}><span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink)", fontSize: 12.5, fontWeight: 700 }}><Sparkles size={13} /> Modèles par métier</span><ChevronDown size={15} color={G} style={{ transform: metierOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                {metierOpen && ACTION_PRESETS.map(p => (
                                  <button key={p.key} type="button" onClick={() => generateActionPreset(p)} title={`Crée : ${p.blocks.map(b => (BLOCK_DEFS as any)[b.type]?.label || b.type).join(", ")}`}
                                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 10px", borderRadius: 9, border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)", cursor: "pointer", background: "color-mix(in srgb, var(--accent) 5%, transparent)", color: "var(--ink)", fontSize: 11, fontWeight: 600, textAlign: "left" as const, transition: "all .15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 12%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, transparent)" }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 5%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                                    <span style={{ fontSize: 16 }}>{p.emoji}</span>
                                    <span style={{ flex: 1, lineHeight: 1.2 }}>{p.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <p style={subHeader}>Toutes les actions</p>
                            {catBlocks.map(([type, def]) => blockBtn(type, def))}
                          </>)
                        : activeCategory === "media"
                        ? (<>
                            <div style={{ margin: "2px 0 10px" }}>
                              <button type="button" onClick={() => setMetierOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, width: "100%", background: metierOpen ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "color-mix(in srgb, var(--accent) 9%, transparent)", border: `1px solid ${metierOpen ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "color-mix(in srgb, var(--accent) 30%, transparent)"}`, borderRadius: 9, cursor: "pointer", padding: "9px 12px", margin: "8px 0" }}><span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink)", fontSize: 12.5, fontWeight: 700 }}><Sparkles size={13} /> Modèles par métier</span><ChevronDown size={15} color={G} style={{ transform: metierOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                {metierOpen && MEDIA_PRESETS.map(p => (
                                  <button key={p.key} type="button" onClick={() => generateMediaPreset(p)} title={`Crée : ${p.blocks.map(b => (BLOCK_DEFS as any)[b.type]?.label || b.type).join(", ")}`}
                                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 10px", borderRadius: 9, border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)", cursor: "pointer", background: "color-mix(in srgb, var(--accent) 5%, transparent)", color: "var(--ink)", fontSize: 11, fontWeight: 600, textAlign: "left" as const, transition: "all .15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 12%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, transparent)" }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 5%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                                    <span style={{ fontSize: 16 }}>{p.emoji}</span>
                                    <span style={{ flex: 1, lineHeight: 1.2 }}>{p.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <p style={subHeader}>Tous les blocs médias</p>
                            {catBlocks.map(([type, def]) => blockBtn(type, def))}
                          </>)
                        : activeCategory === "commerce"
                        ? (<>
                            <div style={{ margin: "2px 0 10px" }}>
                              <button type="button" onClick={() => setMetierOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, width: "100%", background: metierOpen ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "color-mix(in srgb, var(--accent) 9%, transparent)", border: `1px solid ${metierOpen ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "color-mix(in srgb, var(--accent) 30%, transparent)"}`, borderRadius: 9, cursor: "pointer", padding: "9px 12px", margin: "8px 0" }}><span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink)", fontSize: 12.5, fontWeight: 700 }}><Sparkles size={13} /> Modèles par métier</span><ChevronDown size={15} color={G} style={{ transform: metierOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                {metierOpen && COMMERCE_PRESETS.map(p => (
                                  <button key={p.key} type="button" onClick={() => generateCommercePreset(p)} title={`Crée : ${p.blocks.map(b => (BLOCK_DEFS as any)[b.type]?.label || b.type).join(", ")}`}
                                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 10px", borderRadius: 9, border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)", cursor: "pointer", background: "color-mix(in srgb, var(--accent) 5%, transparent)", color: "var(--ink)", fontSize: 11, fontWeight: 600, textAlign: "left" as const, transition: "all .15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 12%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, transparent)" }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 5%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                                    <span style={{ fontSize: 16 }}>{p.emoji}</span>
                                    <span style={{ flex: 1, lineHeight: 1.2 }}>{p.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <p style={subHeader}>Tous les blocs commerce</p>
                            {catBlocks.map(([type, def]) => blockBtn(type, def))}
                          </>)
                        : activeCategory === "social"
                        ? (<>
                            <div style={{ margin: "2px 0 10px" }}>
                              <button type="button" onClick={() => setMetierOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, width: "100%", background: metierOpen ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "color-mix(in srgb, var(--accent) 9%, transparent)", border: `1px solid ${metierOpen ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "color-mix(in srgb, var(--accent) 30%, transparent)"}`, borderRadius: 9, cursor: "pointer", padding: "9px 12px", margin: "8px 0" }}><span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink)", fontSize: 12.5, fontWeight: 700 }}><Sparkles size={13} /> Modèles par métier</span><ChevronDown size={15} color={G} style={{ transform: metierOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                {metierOpen && SOCIAL_PRESETS.map(p => (
                                  <button key={p.key} type="button" onClick={() => generateSocialPreset(p)} title={`Crée un bloc Liens sociaux : ${p.networks.join(", ")}`}
                                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 10px", borderRadius: 9, border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)", cursor: "pointer", background: "color-mix(in srgb, var(--accent) 5%, transparent)", color: "var(--ink)", fontSize: 11, fontWeight: 600, textAlign: "left" as const, transition: "all .15s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 12%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, transparent)" }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 5%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                                    <span style={{ fontSize: 16 }}>{p.emoji}</span>
                                    <span style={{ flex: 1, lineHeight: 1.2 }}>{p.label}</span>
                                  </button>
                                ))}
                              </div>
                              <p style={{ color: MUTED, fontSize: 11, margin: "6px 0 0" }}>Les liens de base sont pré-remplis : complétez-les avec votre nom d&apos;utilisateur.</p>
                            </div>
                            <p style={subHeader}>Tous les réseaux</p>
                            {catBlocks.map(([type, def]) => blockBtn(type, def))}
                          </>)
                        : activeCategory === "info"
                        ? (() => {
                            // Sous-catégories Infos : bibliothèque de contenu organisée façon Notion.
                            // Certains blocs sont "empruntés" à d'autres catégories (par clé) pour la découvrabilité,
                            // sans changer leur catégorie d'origine (ils restent aussi dans Business/Actions).
                            const INFO_GROUPS: { label: string; keys: string[] }[] = [
                              { label: "Présentation",           keys: ["heading", "rich_text", "quote_block", "about", "announcement"] },
                              { label: "Organisation",           keys: ["process_steps", "timeline", "values", "engagements"] },
                              { label: "Preuves & confiance",     keys: ["testimonials", "stats_block", "trust_badge", "visit_counter", "scan_counter"] },
                              { label: "Entreprise",              keys: ["team", "founder_message", "info_table"] },
                              { label: "Informations pratiques",  keys: ["opening_hours", "google_maps_embed", "service_area", "on_site_services"] },
                              { label: "Questions fréquentes",    keys: ["faq"] },
                              { label: "Documents",               keys: ["documents", "download_file"] },
                              { label: "Informations légales",    keys: ["legal_info", "business_certifications"] },
                            ]
                            const grouped = new Set(INFO_GROUPS.flatMap(g => g.keys))
                            const rest = catBlocks.filter(([t]) => !grouped.has(t))
                            return (<>
                              {/* Modèles par métier : 1 clic crée une section informative complète */}
                              <div style={{ margin: "2px 0 10px" }}>
                                <button type="button" onClick={() => setMetierOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, width: "100%", background: metierOpen ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "color-mix(in srgb, var(--accent) 9%, transparent)", border: `1px solid ${metierOpen ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "color-mix(in srgb, var(--accent) 30%, transparent)"}`, borderRadius: 9, cursor: "pointer", padding: "9px 12px", margin: "8px 0" }}><span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink)", fontSize: 12.5, fontWeight: 700 }}><Sparkles size={13} /> Modèles par métier</span><ChevronDown size={15} color={G} style={{ transform: metierOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                  {metierOpen && INFO_PRESETS.map(p => (
                                    <button key={p.key} type="button" onClick={() => generateInfoPreset(p)} title={`Crée : ${p.blocks.map(b => (BLOCK_DEFS as any)[b.type]?.label || b.type).join(", ")}`}
                                      style={{ display: "flex", alignItems: "center", gap: 7, minHeight: isMobile ? 46 : undefined, padding: isMobile ? "11px 11px" : "9px 10px", borderRadius: 10, border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)", cursor: "pointer", background: "color-mix(in srgb, var(--accent) 5%, transparent)", color: "var(--ink)", fontSize: isMobile ? 12 : 11, fontWeight: 600, textAlign: "left" as const, transition: "all .15s" }}
                                      onMouseEnter={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 12%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, transparent)" }}
                                      onMouseLeave={e => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 5%, transparent)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                                      <span style={{ fontSize: 16 }}>{p.emoji}</span>
                                      <span style={{ flex: 1, lineHeight: 1.2 }}>{p.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {INFO_GROUPS.map(g => {
                                const gb = g.keys.filter(k => (BLOCK_DEFS as any)[k])
                                if (!gb.length) return null
                                return (
                                  <div key={g.label}>
                                    <p style={subHeader}>{g.label}</p>
                                    {gb.map(k => blockBtn(k, (BLOCK_DEFS as any)[k]))}
                                  </div>
                                )
                              })}
                              {rest.length > 0 && (<div><p style={subHeader}>Autres</p>{rest.map(([t, d]) => blockBtn(t, d))}</div>)}
                            </>)
                          })()
                        : catBlocks.map(([type, def]) => blockBtn(type, def))
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </>
        )}
    </div>
  )
}
