"use client"

import { useEffect, useState, useRef } from "react"
import { ExternalLink } from "lucide-react"
import { trackPageView } from "@/lib/trackPageView"
import { trackLinkClick } from "@/lib/trackLinkClick"
import { submitLead } from "@/lib/submitLead"
import { themeBackgroundStyle, avatarShapeStyle, avatarDecoStyle, avatarBgStyle, bannerBackgroundStyle, bannerHeight, bannerImageStyle, bannerTitleStyle, bannerOverlayLayers, bannerFrame, availabilityStatus, profileBadgeStyle, productBadgeStyle, priceDiscount, countdownParts, stockStatus, paymentBrand, paymentLink, starRow, openStatus, waLink, telLink, directionsLink, embedVideoUrl, stickyActionHref, ctaButtonStyle, CTA_ANIM_CSS, SOCIAL_NETWORKS_MAP, BANNER_ANIM_CSS } from "../dashboard/builder/types"

type Block = { id: string; type: string; content: Record<string, any>; position: number }
type Page = { id: string; title: string; slug: string; theme: any; total_views: number; profiles: any }

// ── Intersection Observer Hook ──────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

// ── Animated Block Wrapper ───────────────────────────────────────────────────
function AnimatedBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{ transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)" }}>
      {children}
    </div>
  )
}

// ── Countdown ────────────────────────────────────────────────────────────────
// ── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a, theme }: { q: string; a: string; theme: any }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: `1px solid ${open ? theme.primary + "30" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, overflow: "hidden", marginBottom: 8, transition: "all 0.2s" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: open ? `${theme.primary}06` : "transparent", border: "none", color: theme.text, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
        {q}<span style={{ color: theme.primary, fontSize: 20, flexShrink: 0, marginLeft: 12, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </button>
      <div style={{ maxHeight: open ? 200 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ padding: "0 16px 14px" }}><p style={{ color: theme.muted, fontSize: 13, margin: 0, lineHeight: 1.7 }}>{a}</p></div>
      </div>
    </div>
  )
}

// ── Social Networks ──────────────────────────────────────────────────────────
// Réseaux : map dérivée de l'éditeur (source unique) + repli pour d'éventuelles clés legacy.
const SOCIAL_NETWORKS: Record<string, { icon: string; color: string; label: string }> = {
  website: { icon: "🌐", color: "#C9A84C", label: "Site web" },
  ...SOCIAL_NETWORKS_MAP,
}

// ── Render Block ─────────────────────────────────────────────────────────────
// ── Blocs interactifs publics (onglets / accordéon) ──────────────────────────
// ── Avant / Après interactif (curseur à glisser, clip-path) ──────────────────
function BeforeAfterPublic({ before, after, beforeLabel, afterLabel }: { before: string; after: string; beforeLabel: string; afterLabel: string }) {
  const [pos, setPos] = useState(50)
  const boxRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const move = (clientX: number) => { const b = boxRef.current?.getBoundingClientRect(); if (!b) return; setPos(Math.min(100, Math.max(0, ((clientX - b.left) / b.width) * 100))) }
  return (
    <div ref={boxRef} role="slider" aria-valuenow={Math.round(pos)} aria-label="Comparateur avant / après"
      onPointerDown={e => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX) }}
      onPointerMove={e => { if (dragging.current) move(e.clientX) }}
      onPointerUp={() => dragging.current = false} onPointerCancel={() => dragging.current = false}
      style={{ position: "relative", height: 260, borderRadius: 12, overflow: "hidden", touchAction: "none", userSelect: "none", cursor: "ew-resize" }}>
      <img src={before} alt="Avant" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <img src={after} alt="Après" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      {/* Ligne + poignée */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, background: "#fff", transform: "translateX(-1px)", boxShadow: "0 0 8px rgba(0,0,0,0.5)" }} />
      <div style={{ position: "absolute", top: "50%", left: `${pos}%`, transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#080808", fontSize: 14, fontWeight: 700 }}>⇔</div>
      {/* Labels */}
      <span style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(239,68,68,0.85)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 9px" }}>{beforeLabel}</span>
      <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(57,255,143,0.85)", color: "#080808", fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 9px" }}>{afterLabel}</span>
    </div>
  )
}

// ── Badge "Ouvert / Fermé" calculé en direct (tick 60s) ──────────────────────
function OpenBadge({ c, FONT_B }: { c: any; FONT_B: string }) {
  const [st, setSt] = useState<ReturnType<typeof openStatus>>(null)
  useEffect(() => {
    const upd = () => setSt(openStatus(c, new Date()))
    upd(); const t = setInterval(upd, 60000); return () => clearInterval(t)
  }, [c.mon_fri, c.saturday, c.sunday])
  if (!st) return null
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${st.color}18`, border: `1px solid ${st.color}55`, color: st.color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, fontFamily: FONT_B }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.color, boxShadow: `0 0 6px ${st.color}` }} />{st.label}
    </span>
  )
}

// ── Rangée d'étoiles à remplissage partiel précis ────────────────────────────
function StarRow({ fills, size = 13, color = "#FBBF24", empty = "rgba(255,255,255,0.18)", gap = 2 }: { fills: number[]; size?: number; color?: string; empty?: string; gap?: number }) {
  return (
    <div style={{ display: "inline-flex", gap }} aria-hidden="true">
      {fills.map((f, i) => (
        <span key={i} style={{ position: "relative", display: "inline-block", color: empty, fontSize: size, lineHeight: 1 }}>★
          <span style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", width: `${Math.round(f * 100)}%`, color }}>★</span>
        </span>
      ))}
    </div>
  )
}

// ── Compte à rebours d'offre (tick 1s, urgence) ──────────────────────────────
function CountdownPublic({ c, TEXT, MUTED, FONT_D, FONT_B, pageId, blockId }: { c: any; TEXT: string; MUTED: string; FONT_D: string; FONT_B: string; pageId: string; blockId: string }) {
  const accent = c.accent || "#EF4444"
  const rawTarget = c.target || c.date  // rétrocompat : ancien bloc event utilisait `date`
  const targetMs = rawTarget ? new Date(rawTarget).getTime() : NaN
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    if (!isFinite(targetMs)) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [targetMs])
  if (!isFinite(targetMs)) return null
  const p = countdownParts(targetMs, now)
  const units: [string, number][] = [["Jours", p.days], ["Heures", p.hours], ["Min", p.mins], ["Sec", p.secs]]
  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ background: `linear-gradient(135deg,${accent}22,${accent}0d)`, border: `1px solid ${accent}55`, borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
        {c.title && <p style={{ color: TEXT, fontSize: 18, fontWeight: 800, margin: "0 0 4px", fontFamily: FONT_D }}>{c.title}</p>}
        {c.subtitle && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 14px", fontFamily: FONT_B }}>{c.subtitle}</p>}
        {p.expired
          ? <p style={{ color: accent, fontSize: 17, fontWeight: 800, margin: "8px 0 0", fontFamily: FONT_D }}>{c.expired_text || "Offre terminée"}</p>
          : <div style={{ display: "flex", justifyContent: "center", gap: 10 }} role="timer" aria-label="Compte à rebours">
              {units.map(([lbl, val]) => (
                <div key={lbl} style={{ minWidth: 62, background: "rgba(0,0,0,0.28)", border: `1px solid ${accent}33`, borderRadius: 11, padding: "10px 6px" }}>
                  <div style={{ color: accent, fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1, fontFamily: FONT_D }}>{String(val).padStart(2, "0")}</div>
                  <div style={{ color: MUTED, fontSize: 10, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: FONT_B }}>{lbl}</div>
                </div>
              ))}
            </div>}
        {!p.expired && c.cta_label && <a href={c.cta_url || "#"} onClick={() => trackLinkClick(pageId, blockId, c.cta_url || "countdown")} style={{ display: "inline-block", marginTop: 16, background: accent, color: "#fff", padding: "11px 24px", borderRadius: 9, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.cta_label}</a>}
      </div>
    </div>
  )
}

// ── Carrousel plein largeur (autoplay + points + flèches + swipe) ────────────
function CarouselPublic({ imgs, title, autoplay, MUTED, FONT_B }: { imgs: string[]; title?: string; autoplay: boolean; MUTED: string; FONT_B: string }) {
  const [idx, setIdx] = useState(0)
  const paused = useRef(false)
  const drag = useRef<{ x: number } | null>(null)
  const go = (n: number) => setIdx(((n % imgs.length) + imgs.length) % imgs.length)
  useEffect(() => {
    if (!autoplay || imgs.length < 2) return
    const t = setInterval(() => { if (!paused.current) setIdx(i => (i + 1) % imgs.length) }, 3500)
    return () => clearInterval(t)
  }, [autoplay, imgs.length])
  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX }; paused.current = true }
  const onUp = (e: React.PointerEvent) => {
    if (drag.current) { const dx = e.clientX - drag.current.x; if (dx > 40) go(idx - 1); else if (dx < -40) go(idx + 1) }
    drag.current = null; paused.current = false
  }
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      {title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{title}</p>}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, touchAction: "pan-y" }}
        onPointerDown={onDown} onPointerUp={onUp} onMouseEnter={() => paused.current = true} onMouseLeave={() => paused.current = false}>
        <div style={{ display: "flex", transition: "transform .45s cubic-bezier(.2,.8,.2,1)", transform: `translateX(-${idx * 100}%)` }}>
          {imgs.map((img, i) => <img key={i} src={img} alt="" loading={i === 0 ? "eager" : "lazy"} draggable={false} style={{ width: "100%", height: 240, flexShrink: 0, objectFit: "cover", display: "block", userSelect: "none" }} />)}
        </div>
        {imgs.length > 1 && <>
          <button onClick={() => go(idx - 1)} aria-label="Précédente" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <button onClick={() => go(idx + 1)} aria-label="Suivante" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
            {imgs.map((_, i) => <button key={i} onClick={() => go(i)} aria-label={`Photo ${i + 1}`} style={{ width: i === idx ? 18 : 7, height: 7, borderRadius: 4, border: "none", background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "width .2s, background .2s", padding: 0 }} />)}
          </div>
        </>}
      </div>
    </div>
  )
}

// ── Galerie publique avec lightbox plein écran (clic pour agrandir + navigation) ──
function GalleryPublic({ imgs, layout, cols, colsMobile, title, MUTED, FONT_B }: { imgs: string[]; layout: string; cols: number; colsMobile: number; title?: string; MUTED: string; FONT_B: string }) {
  const [idx, setIdx] = useState<number | null>(null)
  useEffect(() => {
    if (idx === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIdx(null)
      else if (e.key === "ArrowRight") setIdx(i => (i === null ? i : (i + 1) % imgs.length))
      else if (e.key === "ArrowLeft") setIdx(i => (i === null ? i : (i - 1 + imgs.length) % imgs.length))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [idx, imgs.length])

  const titleEl = title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{title}</p>
  const open = (i: number) => setIdx(i)

  const lightbox = idx !== null && (
    <div onClick={() => setIdx(null)} role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <button onClick={e => { e.stopPropagation(); setIdx(null) }} aria-label="Fermer" style={{ position: "absolute", top: 14, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
      {imgs.length > 1 && <>
        <button onClick={e => { e.stopPropagation(); setIdx(i => i === null ? i : (i - 1 + imgs.length) % imgs.length) }} aria-label="Précédente" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>‹</button>
        <button onClick={e => { e.stopPropagation(); setIdx(i => i === null ? i : (i + 1) % imgs.length) }} aria-label="Suivante" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>›</button>
      </>}
      <img src={imgs[idx]} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
      {imgs.length > 1 && <span style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.8)", fontSize: 12, background: "rgba(0,0,0,0.4)", borderRadius: 20, padding: "4px 12px" }}>{idx + 1} / {imgs.length}</span>}
    </div>
  )

  if (layout === "masonry") return (
    <div style={{ padding: "6px 24px 16px" }}>
      {titleEl}
      <div className={`qf-cm-${colsMobile}`} style={{ columnCount: cols, columnGap: 8 }}>
        {imgs.map((img, i) => <img key={i} src={img} alt="" loading="lazy" onClick={() => open(i)} onError={e => (e.currentTarget.style.display = "none")} style={{ width: "100%", borderRadius: 10, marginBottom: 8, display: "block", breakInside: "avoid", cursor: "zoom-in" }} />)}
      </div>
      {lightbox}
    </div>
  )
  const effCols = layout === "compact" ? Math.max(cols, 3) : cols
  const gap = layout === "compact" ? 5 : 7
  const rad = layout === "compact" ? 8 : 10
  return (
    <div style={{ padding: "6px 24px 16px" }}>
      {titleEl}
      <div className={`qf-gm-${colsMobile}`} style={{ display: "grid", gridTemplateColumns: `repeat(${effCols},1fr)`, gap }}>
        {imgs.map((img, i) => (
          <div key={i} onClick={() => open(i)} style={{ overflow: "hidden", borderRadius: rad, aspectRatio: "1", cursor: "zoom-in" }}>
            <img src={img} alt="" loading="lazy" onError={e => { const p = e.currentTarget.parentElement; if (p) p.style.display = "none" }} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
          </div>
        ))}
      </div>
      {lightbox}
    </div>
  )
}

function TabsPublic({ tabs, G, TEXT, MUTED, FONT_B }: { tabs: [string, string][]; G: string; TEXT: string; MUTED: string; FONT_B: string }) {
  const [active, setActive] = useState(0)
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 13, overflowX: "auto" }}>
        {tabs.map(([label], i) => (
          <button key={i} onClick={() => setActive(i)} style={{ padding: "9px 15px", background: "transparent", border: "none", borderBottom: `2px solid ${active === i ? G : "transparent"}`, color: active === i ? G : MUTED, fontSize: 13, fontWeight: active === i ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT_B }}>{label}</button>
        ))}
      </div>
      <p style={{ color: TEXT, fontSize: 14, margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: FONT_B }}>{tabs[active]?.[1] || ""}</p>
    </div>
  )
}

function AccordionPublic({ items, title, G, TEXT, MUTED, FONT_B }: { items: [string, string][]; title?: string; G: string; TEXT: string; MUTED: string; FONT_B: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      {title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{title}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {items.map(([t, content], i) => (
          <div key={i} style={{ border: `1px solid ${openIdx === i ? `${G}40` : "rgba(255,255,255,0.07)"}`, borderRadius: 11, overflow: "hidden" }}>
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 15px", background: openIdx === i ? `${G}08` : "transparent", border: "none", color: openIdx === i ? G : TEXT, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: FONT_B }}>
              {t}
              <span style={{ color: G, fontSize: 18, lineHeight: 1, flexShrink: 0, marginLeft: 10 }}>{openIdx === i ? "−" : "+"}</span>
            </button>
            {openIdx === i && content && (
              <div style={{ padding: "4px 15px 14px", background: "rgba(0,0,0,0.15)" }}>
                <p style={{ color: MUTED, fontSize: 13, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: FONT_B }}>{content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── RSVP interactif public (réponse enregistrée en base + trackée) ───────────
function RsvpPublic({ block, pageId, TEXT, MUTED }: { block: Block; pageId: string; TEXT: string; MUTED: string }) {
  const c = block.content
  const [choice, setChoice] = useState<string | null>(null)
  const pick = (val: string) => {
    setChoice(val)
    trackLinkClick(pageId, block.id, `rsvp:${val}`)
    submitLead({ pageId, blockId: block.id, type: "rsvp", message: val, data: { question: c.title || "RSVP", reponse: val } })
  }
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{c.title || "Serez-vous présent ?"}</p>
      {c.description && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 14px" }}>{c.description}</p>}
      {choice ? (
        <div style={{ background: "rgba(57,255,143,0.08)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 11, padding: "14px", textAlign: "center", color: "#39FF8F", fontSize: 13, fontWeight: 700 }}>✅ Merci, votre réponse est enregistrée !</div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => pick("oui")} style={{ flex: 2, background: "rgba(57,255,143,0.1)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 11, padding: "13px 8px", color: "#39FF8F", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{c.yes_label || "✅ Oui, je viens"}</button>
          <button onClick={() => pick("peut-etre")} style={{ flex: 1, background: "rgba(251,191,36,0.08)", border: "1.5px solid rgba(251,191,36,0.25)", borderRadius: 11, padding: "13px 8px", color: "#FBBF24", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{c.maybe_label || "🤔 Peut-être"}</button>
          <button onClick={() => pick("non")} style={{ flex: 1, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", borderRadius: 11, padding: "13px 8px", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{c.no_label || "❌ Non"}</button>
        </div>
      )}
    </div>
  )
}

// ── Inscription événement public (enregistrée en base) ───────────────────────
function EventRegisterPublic({ block, pageId, TEXT, MUTED, ownerEmail }: { block: Block; pageId: string; TEXT: string; MUTED: string; ownerEmail?: string }) {
  const c = block.content
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")
  const inputStyle: any = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9, padding: "11px 13px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }
  const submit = async () => {
    setStatus("sending")
    trackLinkClick(pageId, block.id, "register")
    const data: Record<string, any> = { nom: name, email }
    if (c.show_phone === "yes") data.telephone = phone
    if (c.show_company === "yes") data.societe = company
    const ok = await submitLead({ pageId, blockId: block.id, type: "register", name, email, phone: c.show_phone === "yes" ? phone : undefined, message: `Inscription: ${c.title || "événement"}`, data })
    if (ok) { setStatus("done"); return }
    // Repli mailto si l'enregistrement échoue
    if (ownerEmail) {
      const body = encodeURIComponent(Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n"))
      window.location.href = `mailto:${ownerEmail}?subject=${encodeURIComponent(`Inscription: ${c.title || "evenement"}`)}&body=${body}`
      setStatus("done")
    } else setStatus("error")
  }
  if (status === "done") return (
    <div style={{ padding: "10px 24px 14px" }}>
      <div style={{ background: "rgba(57,255,143,0.08)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 12, padding: "16px", textAlign: "center", color: "#39FF8F", fontSize: 14, fontWeight: 700 }}>✅ Inscription enregistrée, merci !</div>
    </div>
  )
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{c.title || "S'inscrire gratuitement"}</p>
      {c.description && <p style={{ color: "#EC4899", fontSize: 12, margin: "0 0 13px", fontWeight: 600 }}>⚡ {c.description}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input placeholder="Prénom & Nom" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        {c.show_phone === "yes" && <input placeholder="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />}
        {c.show_company === "yes" && <input placeholder="Société" value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} />}
        {status === "error" && <p style={{ color: "#EF4444", fontSize: 12, margin: 0 }}>Une erreur est survenue. Réessayez.</p>}
        <button onClick={submit} disabled={!name || !email || status === "sending"} style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 10, padding: "13px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff", border: "none", cursor: name && email && status !== "sending" ? "pointer" : "not-allowed", opacity: name && email && status !== "sending" ? 1 : 0.55 }}>{status === "sending" ? "Envoi…" : (c.button_label || "Je m'inscris")}</button>
      </div>
    </div>
  )
}

// ── Formulaire public générique (enregistré en base, repli mailto) ───────────
function LeadFormPublic({ block, pageId, ownerEmail, leadType, title, description, descColor, fields, button, accent, subject, TEXT, MUTED }: { block: Block; pageId: string; ownerEmail?: string; leadType: string; title: string; description?: string; descColor?: string; fields: { key: string; label: string; area?: boolean }[]; button: string; accent: string; subject: string; TEXT: string; MUTED: string }) {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")
  const set = (k: string, v: string) => setVals(p => ({ ...p, [k]: v }))
  const required = fields.slice(0, 2).map(f => f.key)
  const ready = required.every(k => (vals[k] || "").trim())
  const inputStyle: any = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9, padding: "11px 13px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }
  const submit = async () => {
    setStatus("sending")
    trackLinkClick(pageId, block.id, "form")
    const data: Record<string, any> = {}
    fields.forEach(f => { if (vals[f.key]) data[f.label] = vals[f.key] })
    const ok = await submitLead({ pageId, blockId: block.id, type: leadType, name: vals.name, email: vals.email, phone: vals.phone, message: vals.message || vals.project || subject, data })
    if (ok) { setStatus("done"); return }
    if (ownerEmail) {
      const body = encodeURIComponent(fields.map(f => `${f.label}: ${vals[f.key] || ""}`).join("\n"))
      window.location.href = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${body}`
      setStatus("done")
    } else setStatus("error")
  }
  if (status === "done") return (
    <div style={{ padding: "10px 24px 14px" }}>
      <div style={{ background: "rgba(57,255,143,0.08)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 12, padding: "16px", textAlign: "center", color: "#39FF8F", fontSize: 14, fontWeight: 700 }}>✅ Demande envoyée, merci ! Nous revenons vers vous rapidement.</div>
    </div>
  )
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{title}</p>
      {description && <p style={{ color: descColor || MUTED, fontSize: 12, margin: "0 0 13px" }}>{description}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {fields.map(f => f.area
          ? <textarea key={f.key} placeholder={f.label} value={vals[f.key] || ""} onChange={e => set(f.key, e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          : <input key={f.key} placeholder={f.label} value={vals[f.key] || ""} onChange={e => set(f.key, e.target.value)} style={inputStyle} />)}
        {status === "error" && <p style={{ color: "#EF4444", fontSize: 12, margin: 0 }}>Une erreur est survenue. Réessayez.</p>}
        <button onClick={submit} disabled={!ready || status === "sending"} style={{ background: accent, borderRadius: 10, padding: "13px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff", border: "none", cursor: ready && status !== "sending" ? "pointer" : "not-allowed", opacity: ready && status !== "sending" ? 1 : 0.55 }}>{status === "sending" ? "Envoi…" : button}</button>
      </div>
    </div>
  )
}

function RenderBlock({ block, theme, pageId, ownerEmail }: { block: Block; theme: any; pageId: string; ownerEmail?: string }) {
  const c = block.content
  const G = theme.primary || "#C9A84C"
  const MUTED = theme.muted || "#8A8478"
  const TEXT = theme.text || "#F5F0E8"
  const SURFACE = theme.surface || "#111009"
  const FONT_D = theme.fontDisplay || "Cormorant Garamond, serif"
  const FONT_B = theme.fontBody || "DM Sans, sans-serif"

  switch (block.type) {
    case "profile": return (
      <div style={{ textAlign: "center", padding: "32px 20px 20px" }}>
        {c.avatar
          ? <img src={c.avatar} alt="" style={{ width: 96, height: 96, ...avatarShapeStyle(c.avatar_shape), ...avatarDecoStyle(c.avatar_shape, c.avatar_border, c.avatar_shadow, G), objectFit: "cover", margin: "0 auto 14px", display: "block" }} />
          : <div style={{ width: 96, height: 96, ...avatarShapeStyle(c.avatar_shape), ...avatarDecoStyle(c.avatar_shape, c.avatar_border, c.avatar_shadow, G), ...avatarBgStyle(c.avatar_bg, G, theme.accent || "#39FF8F"), margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 700, color: "#080808", fontFamily: FONT_D }}>{(c.name || "?")[0]?.toUpperCase()}</div>}
        <h1 style={{ color: TEXT, fontSize: 26, fontWeight: 700, margin: "0 0 5px", fontFamily: FONT_D }}>{c.name || "Mon Nom"}</h1>
        <p style={{ color: MUTED, fontSize: 14, margin: c.badge ? "0 0 10px" : "0", fontFamily: FONT_B }}>{c.tagline}</p>
        {c.badge && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {c.badge.split(/[,\n]/).map((b: string) => b.trim()).filter(Boolean).slice(0, 5).map((b: string, i: number) => { const bs = profileBadgeStyle(b, G); return (
              <span key={i} style={{ background: bs.bg, border: `1px solid ${bs.border}`, borderRadius: 20, padding: "4px 14px", fontSize: 12, color: bs.color, fontWeight: 600, fontFamily: FONT_B }}>{bs.icon ? bs.icon + " " : ""}{b}</span>
            ) })}
          </div>
        )}
      </div>
    )

    case "bio": return (
      <div style={{ padding: "6px 24px 16px", textAlign: (c.align as any) || "left" }}>
        <p style={{ color: TEXT, fontSize: 15, lineHeight: 1.75, margin: 0, fontFamily: FONT_B }}>{c.text}</p>
      </div>
    )

    case "skills": {
      const tags = (c.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean)
      return (
        <div style={{ padding: "6px 24px 16px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {tags.map((tag: string, i: number) => (
              <span key={i} style={{ background: `${G}10`, border: `1px solid ${G}22`, borderRadius: 20, padding: "5px 13px", fontSize: 12, color: G, fontWeight: 600, fontFamily: FONT_B }}>{tag}</span>
            ))}
          </div>
        </div>
      )
    }

    case "cta_button": {
      const { style: s, className } = ctaButtonStyle(c.style, { G, accent: theme.accent, text: TEXT })
      return (
        <div style={{ padding: "6px 24px 12px" }}>
          {className && <style>{CTA_ANIM_CSS}</style>}
          <a className={className} href={c.url || "#"} onClick={() => trackLinkClick(pageId, block.id, c.url || block.type)} style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, padding: "15px 24px", textDecoration: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", boxSizing: "border-box", fontFamily: FONT_B, transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${G}30` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = s.boxShadow as string || "none" }}>
            {c.icon && <span style={{ fontSize: 16 }}>{c.icon}</span>}{c.label || "Bouton"}
          </a>
        </div>
      )
    }

    case "social_links": {
      const active = Object.entries(SOCIAL_NETWORKS).filter(([key]) => c[key])
      if (active.length === 0) return null
      const disp = c.display || "list"
      const lbl = (key: string, n: any) => c[`${key}__label`] || n.label
      if (disp === "icons") return (
        <div style={{ padding: "6px 24px 16px", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {active.map(([key, n]) => (
            <a key={key} href={c[key]} onClick={() => trackLinkClick(pageId, block.id, c[key])} target="_blank" rel="noopener noreferrer" aria-label={lbl(key, n)} title={lbl(key, n)}
              style={{ width: 48, height: 48, borderRadius: "50%", background: n.color + "1a", border: `1px solid ${n.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, textDecoration: "none" }}>{n.icon}</a>
          ))}
        </div>
      )
      if (disp === "grid") return (
        <div style={{ padding: "6px 24px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          {active.map(([key, n]) => (
            <a key={key} href={c[key]} onClick={() => trackLinkClick(pageId, block.id, c[key])} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: n.color + "10", border: `1px solid ${n.color}25`, borderRadius: 13, padding: "16px 8px", textDecoration: "none", textAlign: "center" }}>
              <span style={{ fontSize: 26 }}>{n.icon}</span>
              <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, fontFamily: FONT_B }}>{lbl(key, n)}</span>
              {c[`${key}__count`] && <span style={{ color: n.color, fontSize: 11, fontWeight: 700, fontFamily: FONT_B }}>{c[`${key}__count`]}</span>}
            </a>
          ))}
        </div>
      )
      return (
        <div style={{ padding: "6px 24px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
          {active.map(([key, n]) => (
            <a key={key} href={c[key]} onClick={() => trackLinkClick(pageId, block.id, c[key])} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 13, background: n.color + "10", border: `1px solid ${n.color}22`, borderRadius: 13, padding: "13px 16px", textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${n.color}20` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: n.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{n.icon}</div>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: TEXT, fontSize: 14, fontWeight: 600, fontFamily: FONT_B, display: "block" }}>{lbl(key, n)}</span>
                {c[`${key}__count`] && <span style={{ color: MUTED, fontSize: 12, fontFamily: FONT_B }}>{c[`${key}__count`]}</span>}
              </span>
              <ExternalLink size={14} color={n.color} style={{ opacity: 0.7 }} />
            </a>
          ))}
        </div>
      )
    }

    case "social_feature": {
      const n = SOCIAL_NETWORKS_MAP[c.network] || { icon: "🔗", color: G, label: "Réseau" }
      const col = n.color
      return (c.url || c.title) ? (
        <div style={{ padding: "8px 24px 14px" }}>
          <a href={c.url || "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "social")} style={{ display: "block", background: `linear-gradient(135deg,${col}22,${col}0a)`, border: `1.5px solid ${col}45`, borderRadius: 18, overflow: "hidden", textDecoration: "none" }}>
            {c.image && <img src={c.image} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />}
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{n.icon}</span>
                <span style={{ color: col, fontSize: 12, fontWeight: 700, fontFamily: FONT_B }}>{n.label}</span>
                <span style={{ marginLeft: "auto", background: col, color: "#080808", borderRadius: 20, padding: "2px 10px", fontSize: 9, fontWeight: 700 }}>PRINCIPAL</span>
              </div>
              <p style={{ color: TEXT, fontSize: 18, fontWeight: 700, margin: "0 0 4px", fontFamily: FONT_D }}>{c.title || "Suivez-moi"}</p>
              {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 6px", lineHeight: 1.5, fontFamily: FONT_B }}>{c.description}</p>}
              {c.count && <p style={{ color: col, fontSize: 13, fontWeight: 700, margin: "0 0 12px", fontFamily: FONT_B }}>{c.count}</p>}
              <div style={{ background: col, color: "#080808", borderRadius: 11, padding: "12px", textAlign: "center", fontSize: 14, fontWeight: 800, marginTop: c.count ? 0 : 12, fontFamily: FONT_B }}>{c.cta_label || "Suivre"}</div>
            </div>
          </a>
        </div>
      ) : null
    }
    case "heading": {
      const sizes: Record<string, number> = { small: 18, medium: 24, large: 32, xl: 42 }
      const hColors: Record<string, string> = { default: TEXT, primary: G, accent: theme.accent || "#39FF8F", muted: MUTED }
      return (
        <div style={{ padding: "12px 24px 6px", textAlign: (c.align as any) || "center" }}>
          <h2 style={{ fontFamily: FONT_D, fontSize: sizes[c.size || "medium"], color: hColors[c.color || "default"], fontWeight: 700, margin: "0 0 4px", lineHeight: 1.2 }}>{c.text || "Titre"}</h2>
          {c.subtitle && <p style={{ color: MUTED, fontSize: 13, margin: 0, fontFamily: FONT_B }}>{c.subtitle}</p>}
        </div>
      )
    }

    case "rich_text": return (
      <div style={{ padding: "4px 24px 14px", textAlign: (c.align as any) || "left" }}>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.75, margin: 0, fontFamily: FONT_B }}>{c.text}</p>
      </div>
    )

    case "faq": return (
      <div style={{ padding: "6px 24px 16px" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
        {[[c.q1,c.a1],[c.q2,c.a2],[c.q3,c.a3],[c.q4,c.a4],[c.q5,c.a5]].filter(([q]) => q).map(([q,a],i) => <FAQItem key={i} q={q!} a={a||""} theme={theme} />)}
      </div>
    )

    case "image": {
      if (!c.src) return null
      const isCircle = c.rounded === "circle"
      const ratioMap: Record<string, string | undefined> = { square: "1", "16:9": "16/9", "9:16": "9/16", "4:3": "4/3" }
      // Cercle -> toujours carré et contenu (évite l'ellipse géante sur une image large)
      const ar = isCircle ? "1" : ratioMap[c.ratio || "original"]
      const radius = isCircle ? "50%" : c.rounded === "rounded" ? 16 : 0
      const imgEl = (
        <img src={c.src} alt={c.alt || c.caption || ""} loading="lazy" onError={e => (e.currentTarget.style.display = "none")}
          style={{ width: "100%", height: ar ? "100%" : undefined, maxHeight: ar ? undefined : 320, aspectRatio: ar, objectFit: "cover", display: "block", borderRadius: radius, transition: "transform 0.3s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
      )
      const wrapped = c.link
        ? <a href={c.link} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.link)} style={{ display: "block", textDecoration: "none" }}>{imgEl}</a>
        : imgEl
      return (
        <div style={{ overflow: "hidden", padding: isCircle ? "8px 24px 0" : 0 }}>
          {isCircle ? <div style={{ maxWidth: 240, margin: "0 auto" }}>{wrapped}</div> : wrapped}
          {c.caption && <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: "7px 24px", fontFamily: FONT_B }}>{c.caption}</p>}
        </div>
      )
    }

    case "gallery": {
      const imgs = [c.img1, c.img2, c.img3, c.img4, c.img5, c.img6, c.img7, c.img8, c.img9, c.img10, c.img11, c.img12].filter(Boolean)
      if (imgs.length === 0) return null
      return <GalleryPublic imgs={imgs} layout={c.layout || "grid"} cols={parseInt(c.columns || "3")} colsMobile={parseInt(c.columns_mobile || "2")} title={c.title} MUTED={MUTED} FONT_B={FONT_B} />
    }

    case "video": return c.url ? (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 14, overflow: "hidden", boxShadow: `0 8px 30px rgba(0,0,0,0.4)` }}>
          <iframe src={embedVideoUrl(c.url)} loading="lazy" title={c.title || "Vidéo"}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
        {c.title && <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: "8px 0 0", fontFamily: FONT_B }}>{c.title}</p>}
      </div>
    ) : null

    case "contact_form": return (
      <div style={{ padding: "6px 24px 20px" }}>
        {c.title && <h3 style={{ color: TEXT, fontSize: 18, fontWeight: 700, margin: "0 0 14px", fontFamily: FONT_D }}>{c.title}</h3>}
        <form style={{ display: "flex", flexDirection: "column", gap: 10 }} onSubmit={e => e.preventDefault()}>
          {["Nom","Email",...(c.show_phone === "yes" ? ["Téléphone"] : [])].map(f => (
            <input key={f} placeholder={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "12px 15px", color: TEXT, fontSize: 14, outline: "none", fontFamily: FONT_B, width: "100%", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = G + "60"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
          ))}
          <textarea placeholder="Message" rows={4} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "12px 15px", color: TEXT, fontSize: 14, outline: "none", fontFamily: FONT_B, resize: "vertical", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = G + "60"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"} />
          <button type="submit" style={{ background: `linear-gradient(90deg,${G},${G}cc)`, border: "none", borderRadius: 12, padding: "14px", color: "#080808", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT_B, transition: "transform 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>{c.button_label || "Envoyer"}</button>
        </form>
      </div>
    )

    case "testimonials": {
      const reviews = [[c.name1,c.text1,c.stars1],[c.name2,c.text2,c.stars2],[c.name3,c.text3,c.stars3]].filter(([n]) => n)
      return reviews.length > 0 ? (
        <div style={{ padding: "6px 24px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map(([n,t,s],i) => (
            <div key={i} style={{ background: `${G}05`, border: `1px solid ${G}12`, borderRadius: 14, padding: "15px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{n}</p>
                <p style={{ color: "#FFD700", fontSize: 13, margin: 0 }}>{"★".repeat(parseInt(s||"5"))}</p>
              </div>
              <p style={{ color: MUTED, fontSize: 13, margin: 0, fontStyle: "italic", lineHeight: 1.65, fontFamily: FONT_B }}>"{t}"</p>
            </div>
          ))}
        </div>
      ) : null
    }

    case "google_maps": return (
      <div style={{ padding: "6px 24px 16px" }}>
        <a href={`https://maps.google.com/?q=${encodeURIComponent(c.address||"")}`} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", gap: 13, background: "rgba(255,230,109,0.06)", border: "1px solid rgba(255,230,109,0.14)", borderRadius: 14, padding: "15px 16px", textDecoration: "none", transition: "transform 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
          <span style={{ fontSize: 26, flexShrink: 0 }}>📍</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.label || "Adresse"}</p>
            <p style={{ color: MUTED, fontSize: 12, margin: c.transport ? "0 0 3px" : "0", fontFamily: FONT_B }}>{c.address}</p>
            {c.transport && <p style={{ color: MUTED, fontSize: 11, margin: 0, fontFamily: FONT_B }}>🚇 {c.transport}</p>}
          </div>
          <ExternalLink size={15} color="rgba(255,230,109,0.5)" style={{ flexShrink: 0, marginTop: 2 }} />
        </a>
      </div>
    )

    case "opening_hours": return (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 0 10px", flexWrap: "wrap" }}>
          {c.title ? <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: 0, fontFamily: FONT_B }}>{c.title}</p> : <span />}
          <OpenBadge c={c} FONT_B={FONT_B} />
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, overflow: "hidden" }}>
          {[["Lun — Ven",c.mon_fri],["Samedi",c.saturday],["Dimanche",c.sunday]].filter(([,h]) => h).map(([d,h],i,arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <span style={{ color: MUTED, fontSize: 13, fontFamily: FONT_B }}>{d}</span>
              <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, fontFamily: FONT_B }}>{h}</span>
            </div>
          ))}
          {c.note && <div style={{ padding: "9px 16px", background: `${G}05` }}><p style={{ color: MUTED, fontSize: 11, margin: 0, fontStyle: "italic", fontFamily: FONT_B }}>{c.note}</p></div>}
        </div>
      </div>
    )

    case "pricing": {
      const plans = [[c.title1,c.price1,c.desc1,c.old_price1],[c.title2,c.price2,c.desc2,c.old_price2],[c.title3,c.price3,c.desc3,c.old_price3]].filter(([t]) => t)
      return plans.length > 0 ? (
        <div style={{ padding: "6px 24px 16px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {plans.map(([t,p,d,op]: any[],i: number) => { const disc = priceDiscount(p, op); return (
              <div key={i} style={{ flex: 1, minWidth: 90, position: "relative", background: i===1 ? `${G}10` : "rgba(255,255,255,0.03)", border: `1px solid ${i===1 ? G+"40" : "rgba(255,255,255,0.06)"}`, borderRadius: 13, padding: "16px 12px", textAlign: "center", transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                {disc && <span style={{ position: "absolute", top: -9, right: 8, background: "#EF4444", color: "#fff", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 800, fontFamily: FONT_B }}>{disc.label}</span>}
                <p style={{ color: MUTED, fontSize: 10, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: 1, fontFamily: FONT_B }}>{t}</p>
                <p style={{ color: G, fontSize: 26, fontWeight: 700, margin: "0 0 4px", fontFamily: FONT_D }}>{p}</p>
                {op && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 4px", textDecoration: "line-through", fontFamily: FONT_B }}>{op}</p>}
                <p style={{ color: MUTED, fontSize: 11, margin: 0, fontFamily: FONT_B }}>{d}</p>
                {c.cta_label && <a href={c.cta_url||"#"} onClick={() => trackLinkClick(pageId, block.id, c.cta_url||block.type)} style={{ display: "block", background: `${G}12`, border: `1px solid ${G}25`, color: G, textDecoration: "none", borderRadius: 7, padding: "7px", marginTop: 8, fontSize: 11, fontWeight: 700, fontFamily: FONT_B }}>{c.cta_label}</a>}
              </div>
            ) })}
          </div>
        </div>
      ) : null
    }

    case "product": return (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 15, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.3)` }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}>
          {c.image && <img src={c.image} alt={c.name||""} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />}
          <div style={{ padding: "14px 16px" }}>
            <p style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: "0 0 5px", fontFamily: FONT_D }}>{c.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
              <span style={{ color: G, fontSize: 20, fontWeight: 700, fontFamily: FONT_D }}>{c.price}</span>
              {c.old_price && <span style={{ color: MUTED, fontSize: 13, textDecoration: "line-through", fontFamily: FONT_B }}>{c.old_price}</span>}
              {(() => { const d = priceDiscount(c.price, c.old_price); return d ? <span style={{ background: "#EF4444", color: "#fff", borderRadius: 5, padding: "2px 7px", fontSize: 11, fontWeight: 800, fontFamily: FONT_B }}>{d.label}</span> : null })()}
            </div>
            {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 10px", lineHeight: 1.6, fontFamily: FONT_B }}>{c.description}</p>}
            {(() => { const st = stockStatus(c.stock); return st ? <p style={{ color: st.color, fontSize: 12, fontWeight: 700, margin: "0 0 10px", fontFamily: FONT_B }}>{st.state === "in" ? "✓ " : st.state === "out" ? "⛔ " : "🔥 "}{st.label}</p> : null })()}
            {c.cta_label && (() => { const out = stockStatus(c.stock)?.soldOut; return out
              ? <div style={{ background: "rgba(255,255,255,0.06)", color: MUTED, textAlign: "center", padding: "12px", borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: FONT_B, cursor: "not-allowed" }}>Épuisé</div>
              : <a href={c.cta_url||"#"} onClick={() => trackLinkClick(pageId, block.id, c.cta_url||block.type)} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", textAlign: "center", padding: "12px", borderRadius: 9, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.cta_label}</a> })()}
          </div>
        </div>
      </div>
    )

    case "countdown": return <CountdownPublic c={c} TEXT={TEXT} MUTED={MUTED} FONT_D={FONT_D} FONT_B={FONT_B} pageId={pageId} blockId={block.id} />

    case "promo_banner": return (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.12),rgba(249,115,22,0.06))", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 14, padding: "18px 18px", textAlign: "center" }}>
          {c.emoji && <span style={{ fontSize: 30, display: "block", marginBottom: 8 }}>{c.emoji}</span>}
          <p style={{ color: TEXT, fontSize: 17, fontWeight: 700, margin: "0 0 4px", fontFamily: FONT_D }}>{c.text}</p>
          {c.subtext && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 12px", fontFamily: FONT_B }}>{c.subtext}</p>}
          {c.cta_label && <a href={c.cta_url||"#"} onClick={() => trackLinkClick(pageId, block.id, c.cta_url||block.type)} style={{ display: "inline-block", background: "#F97316", color: "#fff", padding: "10px 22px", borderRadius: 9, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.cta_label}</a>}
        </div>
      </div>
    )

    case "menu_section": return (
      <div style={{ padding: "6px 24px 16px" }}>
        {c.category && <p style={{ color: G, fontSize: 12, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: FONT_B }}>{c.category}</p>}
        <div>
          {[[c.item1_name,c.item1_price,c.item1_desc],[c.item2_name,c.item2_price,c.item2_desc],[c.item3_name,c.item3_price,c.item3_desc]].filter(([n]) => n).map(([n,p,d],i,arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "11px 0", borderBottom: i<arr.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: "0 0 2px", fontFamily: FONT_B }}>{n}</p>
                {d && <p style={{ color: MUTED, fontSize: 12, margin: 0, fontFamily: FONT_B }}>{d}</p>}
              </div>
              <span style={{ color: G, fontSize: 14, fontWeight: 700, flexShrink: 0, fontFamily: FONT_D }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    )

    case "services_list": {
      const svcs = [[c.s1_icon,c.s1_name,c.s1_desc],[c.s2_icon,c.s2_name,c.s2_desc],[c.s3_icon,c.s3_name,c.s3_desc]].filter(([,n]) => n)
      return svcs.length > 0 ? (
        <div style={{ padding: "6px 24px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 4px", fontFamily: FONT_B }}>{c.title}</p>}
          {svcs.map(([icon,name,desc],i) => (
            <div key={i} style={{ display: "flex", gap: 13, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 13, padding: "13px 15px", transition: "transform 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateX(4px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateX(0)")}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
              <div>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{name}</p>
                {desc && <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.5, fontFamily: FONT_B }}>{desc}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : null
    }

    case "event_info": return (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ background: "rgba(236,72,153,0.07)", border: "1px solid rgba(236,72,153,0.18)", borderRadius: 15, padding: "18px 18px" }}>
          <p style={{ color: TEXT, fontSize: 19, fontWeight: 700, margin: "0 0 12px", fontFamily: FONT_D }}>{c.name}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: c.cta_label ? "14px" : "0" }}>
            {[["📅",c.date],["🕐",c.time],["📍",c.location],["🎟️",c.price]].filter(([,v]) => v).map(([icon,val]) => (
              <p key={String(icon)} style={{ color: MUTED, fontSize: 13, margin: 0, fontFamily: FONT_B }}>{icon} {val}</p>
            ))}
          </div>
          {c.cta_label && <a href={c.cta_url||"#"} onClick={() => trackLinkClick(pageId, block.id, c.cta_url||block.type)} style={{ display: "block", background: "#EC4899", color: "#fff", textAlign: "center", padding: "12px", borderRadius: 9, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.cta_label}</a>}
        </div>
      </div>
    )

    case "spotify_player": return (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ background: "rgba(29,185,84,0.07)", border: "1px solid rgba(29,185,84,0.18)", borderRadius: 13, padding: "16px 16px", display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 48, height: 48, background: "#1DB954", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎧</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.title || "Ma musique"}</p>
            <p style={{ color: MUTED, fontSize: 12, margin: 0, fontFamily: FONT_B }}>Ecouter sur Spotify</p>
          </div>
          {c.url && <a href={c.url} onClick={() => trackLinkClick(pageId, block.id, c.url||block.type)} target="_blank" rel="noopener noreferrer" style={{ background: "#1DB954", color: "#000", padding: "8px 16px", borderRadius: 20, textDecoration: "none", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>▶ Play</a>}
        </div>
      </div>
    )

    case "music_links": {
      const platforms = [["spotify","🎵","#1DB954","Spotify"],["apple_music","🍎","#FC3C44","Apple Music"],["deezer","🎶","#A238FF","Deezer"],["youtube_music","▶️","#FF0000","YouTube Music"],["soundcloud","☁️","#FF5500","SoundCloud"]].filter(([k]) => c[k as string])
      return platforms.length > 0 ? (
        <div style={{ padding: "6px 24px 16px" }}>
          {c.artist_name && <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 12px", textAlign: "center", fontFamily: FONT_D }}>{c.artist_name}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {platforms.map(([k,icon,color,label]) => (
              <a key={k} href={(c as any)[k as string]} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 13, background: (color as string)+"10", border: `1px solid ${color}22`, borderRadius: 12, padding: "12px 15px", textDecoration: "none", transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ color: TEXT, fontSize: 14, fontWeight: 600, flex: 1, fontFamily: FONT_B }}>{label}</span>
                <ExternalLink size={13} color={color as string} style={{ opacity: 0.7 }} />
              </a>
            ))}
          </div>
        </div>
      ) : null
    }

    case "visit_counter": return (
      <div style={{ padding: "12px 24px 16px", textAlign: "center" }}>
        <p style={{ fontFamily: FONT_D, fontSize: 44, color: G, fontWeight: 700, margin: "0 0 3px" }}>1 234</p>
        <p style={{ color: MUTED, fontSize: 13, margin: 0, fontFamily: FONT_B }}>{c.label || "visiteurs"}</p>
      </div>
    )

    case "divider": {
      const dvStyles: Record<string, React.ReactNode> = {
        gold: <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${G}60,transparent)` }} />,
        line: <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />,
        dots: <div style={{ textAlign: "center", color: MUTED, letterSpacing: 10, fontSize: 18 }}>• • •</div>,
        stars: <div style={{ textAlign: "center", color: G, letterSpacing: 10, fontSize: 16 }}>✦ ✦ ✦</div>,
      }
      return <div style={{ padding: "10px 24px" }}>{dvStyles[c.style || "gold"]}</div>
    }

    case "spacer": {
      const spSizes: Record<string, number> = { xs: 8, sm: 16, md: 28, lg: 48, xl: 72 }
      return <div style={{ height: spSizes[c.size || "md"] }} />
    }

    case "calendly": return (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ background: `${G}07`, border: `1px solid ${G}20`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📅</div>
            <div>
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label || "Reserver"}</p>
              {c.description && <p style={{ color: MUTED, fontSize: 12, margin: 0, fontFamily: FONT_B }}>{c.description}</p>}
            </div>
          </div>
          <a href={c.url||"#"} onClick={() => trackLinkClick(pageId, block.id, c.url||"calendly")} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", textAlign: "center", padding: "13px", borderRadius: 9, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Reserver un creneau"}</a>
        </div>
      </div>
    )

    case "instagram_feed": return (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 10 }}>
          {[0,1,2,3,4,5].map(i => <div key={i} style={{ aspectRatio: "1", background: "rgba(225,48,108,0.08)", border: "1px solid rgba(225,48,108,0.12)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📸</div>)}
        </div>
        <a href={c.cta_url || "#"} onClick={() => trackLinkClick(pageId, block.id, c.cta_url||"instagram")} style={{ display: "block", background: "rgba(225,48,108,0.1)", border: "1px solid rgba(225,48,108,0.25)", color: "#E1306C", textAlign: "center", padding: "12px", borderRadius: 9, textDecoration: "none", fontSize: 13, fontWeight: 700, fontFamily: FONT_B }}>{c.cta_label || "Me suivre sur Instagram"}</a>
      </div>
    )

    case "cover_banner": {
      const h = bannerHeight(c, "public")
      const btype = c.banner_type || (c.src ? "image" : "gradient")
      const pos = c.text_position || "bottom-left"
      const anim = c.animation && c.animation !== "none" ? c.animation : null
      const rad = parseInt(c.block_radius) || 0
      const txtColor = c.text_color || "#fff"
      const bannerBg = bannerBackgroundStyle(c, G)
      const ovLayers = bannerOverlayLayers(c, G)
      const frame = bannerFrame(c, G, rad || 0)
      const alignItems = pos === "center" ? "center" : "flex-end"
      const justifyContent = (pos === "bottom-center" || pos === "center") ? "center" : "flex-start"
      const textAlign: any = (pos === "bottom-center" || pos === "center") ? "center" : "left"
      const inner = (
        <div className={anim ? `qfb qfb-${anim}` : undefined} style={{ position: "relative", overflow: "hidden", borderRadius: rad || undefined, boxShadow: frame.boxShadow }}>
          {anim && <style>{BANNER_ANIM_CSS}</style>}
          {btype === "image"
            ? (c.src
              ? <img className="qfb-media" src={c.src} alt="" style={{ width: "100%", height: h, display: "block", ...bannerImageStyle(c) }} />
              : <div className="qfb-media" style={{ width: "100%", height: h, background: `linear-gradient(135deg,${G}33,${theme.accent || "#39FF8F"}22)` }} />)
            : <div className="qfb-media" style={{ width: "100%", height: h, ...bannerBg }} />}
          {anim === "shimmer" && <div className="qfb-shine" />}
          {ovLayers.map((l, i) => <div key={i} className={l.className} style={l.style} />)}
          {frame.borderLayer && <div style={frame.borderLayer.style} />}
          {(c.cover_title || c.cover_subtitle || c.badge) && (
            <div className="qfb-content" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems, justifyContent, padding: "16px 22px", textAlign, gap: 6 }}>
              {c.badge && <span style={{ alignSelf: pos === "bottom-left" ? "flex-start" : "center", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>{c.badge}</span>}
              {c.cover_title && <p style={bannerTitleStyle(c, "public", txtColor, FONT_D)}>{c.cover_title}</p>}
              {c.cover_subtitle && <p style={{ color: txtColor, opacity: 0.9, fontSize: parseInt(c.subtitle_size) || 14, margin: 0, textShadow: "0 1px 8px rgba(0,0,0,0.55)", fontFamily: FONT_B }}>{c.cover_subtitle}</p>}
            </div>
          )}
        </div>
      )
      return c.link_url
        ? <a href={c.link_url} target={c.link_blank !== "no" && /^https?:/.test(c.link_url) ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.link_url)} style={{ display: "block", textDecoration: "none", cursor: "pointer" }}>{inner}</a>
        : inner
    }
    case "about": return (c.text || c.title) ? (
      <div style={{ padding: "10px 24px 16px", textAlign: (c.align as any) || "left" }}>
        {c.emoji && <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{c.emoji}</span>}
        {c.title && <p style={{ color: G, fontSize: 11, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: FONT_B }}>{c.title}</p>}
        <p style={{ color: TEXT, fontSize: 15, lineHeight: 1.75, margin: 0, fontFamily: FONT_B, whiteSpace: "pre-wrap" }}>{c.text}</p>
      </div>
    ) : null
    case "availability": {
      const sc = availabilityStatus(c.status, c.dot_color)
      return (
        <div style={{ padding: "8px 24px 12px" }}>
          <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: c.message ? 7 : 0 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: sc.color, boxShadow: `0 0 8px ${sc.color}80`, flexShrink: 0 }} />
              <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{sc.label}</p>
              {c.available_from && <span style={{ color: MUTED, fontSize: 12, marginLeft: "auto" }}>dès {c.available_from}</span>}
            </div>
            {c.message && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 10px", lineHeight: 1.5, fontFamily: FONT_B }}>{c.message}</p>}
            {c.cta_label && <a href={c.cta_url || "#"} onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "availability")} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 10, padding: "11px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#080808", textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label}</a>}
          </div>
        </div>
      )
    }
    case "journey": {
      const lines = [c.line_1, c.line_2, c.line_3, c.line_4].filter(Boolean)
      return lines.length > 0 ? (
        <div style={{ padding: "8px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 9px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {lines.map((line: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11, background: `${G}0a`, border: `1px solid ${G}18`, borderRadius: 11, padding: "11px 12px" }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{line.split(" ")[0]}</span>
                <span style={{ color: TEXT, fontSize: 14, lineHeight: 1.5, fontFamily: FONT_B }}>{line.split(" ").slice(1).join(" ")}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "expertise": {
      const skills = [[c.s1_name, c.s1_level, c.s1_icon], [c.s2_name, c.s2_level, c.s2_icon], [c.s3_name, c.s3_level, c.s3_icon], [c.s4_name, c.s4_level, c.s4_icon], [c.s5_name, c.s5_level, c.s5_icon]].filter(([n]) => n)
      return skills.length > 0 ? (
        <div style={{ padding: "8px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {skills.map(([name, level, icon]: any[], i: number) => {
              const pct = Math.round((parseInt(String(level) || "3") / 5) * 100)
              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: TEXT, fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_B }}>{icon && <span>{icon}</span>}{name}</span>
                    <span style={{ color: G, fontSize: 11, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${G},${theme.accent || "#39FF8F"})`, borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null
    }
    case "languages": {
      const langs = [[c.lang_1_flag, c.lang_1_name, c.lang_1_level], [c.lang_2_flag, c.lang_2_name, c.lang_2_level], [c.lang_3_flag, c.lang_3_name, c.lang_3_level], [c.lang_4_flag, c.lang_4_name, c.lang_4_level]].filter(([, n]) => n)
      return langs.length > 0 ? (
        <div style={{ padding: "8px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 9px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {langs.map(([flag, name, level]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11 }}>
                <span style={{ fontSize: 20 }}>{flag || "🌐"}</span>
                <span style={{ color: TEXT, fontSize: 14, fontWeight: 600, flex: 1, fontFamily: FONT_B }}>{name}</span>
                <span style={{ background: `${G}18`, border: `1px solid ${G}28`, borderRadius: 20, padding: "3px 10px", color: G, fontSize: 11, fontWeight: 600 }}>{level || "Courant"}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "certifications": {
      const certs = [[c.cert_1_icon, c.cert_1_name, c.cert_1_org, c.cert_1_year], [c.cert_2_icon, c.cert_2_name, c.cert_2_org, c.cert_2_year], [c.cert_3_icon, c.cert_3_name, c.cert_3_org, c.cert_3_year], [c.cert_4_icon, c.cert_4_name, c.cert_4_org, c.cert_4_year]].filter(([, n]) => n)
      return certs.length > 0 ? (
        <div style={{ padding: "8px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 9px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {certs.map(([icon, name, org, year]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", background: `${G}0a`, border: `1px solid ${G}18`, borderRadius: 12 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon || "🏆"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{name}</p>
                  <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{org}{year ? ` · ${year}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }

    case "call_button": { const href = telLink(c.phone); return href ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={href} onClick={() => trackLinkClick(pageId, block.id, "call")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(57,255,143,0.1)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 13, padding: c.sub ? "12px 18px" : "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>{c.icon || "📞"}</span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ color: "#39FF8F", fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Appeler maintenant"}</span>
            {c.sub && <span style={{ color: "rgba(57,255,143,0.7)", fontSize: 11, fontFamily: FONT_B }}>{c.sub}</span>}
          </span>
        </a>
      </div>
    ) : null }
    case "whatsapp_button": { const href = waLink(c.phone, c.message, c.country_code); return href ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "whatsapp")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(37,211,102,0.12)", border: "1.5px solid rgba(37,211,102,0.35)", borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>💬</span>
          <span style={{ color: "#25D366", fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Discuter sur WhatsApp"}</span>
        </a>
      </div>
    ) : null }
    case "sticky_bar": {
      const acts = [1, 2, 3, 4, 5].map(i => ({ ...stickyActionHref(c[`a${i}_type`], c[`a${i}_value`]), t: c[`a${i}_type`] })).filter(a => a.t && a.t !== "none" && (a.href || a.share))
      if (acts.length === 0) return null
      const showL = c.show_labels !== "no"
      const barBg = c.bar_style === "solid" ? "#0A0A0A" : c.bar_style === "gold" ? `linear-gradient(90deg,${G},${G}dd)` : "rgba(12,12,12,0.82)"
      const goldStyle = c.bar_style === "gold"
      const pos = c.position === "top" ? { top: 0 } : { bottom: 0 }
      const doShare = () => { const u = typeof window !== "undefined" ? window.location.href : ""; if (navigator.share) navigator.share({ url: u }).catch(() => {}); else { navigator.clipboard?.writeText(u) } ; trackLinkClick(pageId, block.id, "share") }
      return (
        <>
          <div style={{ height: 68 }} aria-hidden />
          <div style={{ position: "fixed", ...pos, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, zIndex: 60, background: barBg, backdropFilter: c.bar_style === "blur" ? "blur(14px)" : undefined, WebkitBackdropFilter: c.bar_style === "blur" ? "blur(14px)" : undefined, borderTop: c.position === "top" ? "none" : "1px solid rgba(255,255,255,0.1)", borderBottom: c.position === "top" ? "1px solid rgba(255,255,255,0.1)" : "none", boxShadow: c.position === "top" ? "0 8px 24px rgba(0,0,0,0.4)" : "0 -8px 24px rgba(0,0,0,0.4)", display: "flex", justifyContent: "space-around", alignItems: "stretch", padding: `8px 6px calc(8px + env(safe-area-inset-bottom))` }}>
            {acts.slice(0, 5).map((a, i) => {
              const col = goldStyle ? "#080808" : a.color
              const inner = <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}><span style={{ fontSize: 20 }}>{a.icon}</span>{showL && <span style={{ color: col, fontSize: 10, fontWeight: 700 }}>{a.label}</span>}</span>
              const st: any = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 4px", textDecoration: "none", background: "transparent", border: "none", cursor: "pointer" }
              return a.share
                ? <button key={i} onClick={doShare} style={st}>{inner}</button>
                : <a key={i} href={a.href} target={/^https?:/.test(a.href || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, `bar:${a.t}`)} style={st}>{inner}</a>
            })}
          </div>
        </>
      )
    }
    case "directions_button": { const href = directionsLink(c.address, c.provider); return (c.address || c.label) ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={href || "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "directions")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(66,133,244,0.12)", border: "1.5px solid rgba(66,133,244,0.35)", borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>🧭</span>
          <span style={{ color: "#4285F4", fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Obtenir l'itinéraire"}</span>
        </a>
        {c.show_copy !== "no" && c.address && (
          <button onClick={() => { navigator.clipboard?.writeText(c.address); trackLinkClick(pageId, block.id, "copy-address") }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: "10px", color: MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT_B }}>📋 Copier l&apos;adresse</button>
        )}
      </div>
    ) : null }
    case "email_button": return c.email ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={`mailto:${c.email}${c.subject ? `?subject=${encodeURIComponent(c.subject)}` : ""}`} onClick={() => trackLinkClick(pageId, block.id, "email")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>✉️</span>
          <span style={{ color: "#38BDF8", fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Envoyer un email"}</span>
        </a>
      </div>
    ) : null
    case "payment_button": {
      const href = paymentLink(c)
      if (!href) return null
      const br = paymentBrand(c.platform)
      return (
        <div style={{ padding: "6px 24px 10px" }}>
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "payment")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: br.color, borderRadius: 13, padding: "15px 18px", textDecoration: "none", color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: FONT_B, boxShadow: `0 4px 16px ${br.color}44` }}>
            <span>{br.icon}</span> {c.label || "Payer maintenant"}{c.amount ? ` — ${c.amount}` : ""}
          </a>
        </div>
      )
    }
    case "booking_button": return c.url ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "booking")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: `${G}12`, border: `1.5px solid ${G}35`, borderRadius: 13, padding: "15px 18px", textDecoration: "none", color: G, fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>
          📅 {c.label || "Prendre rendez-vous"}
        </a>
      </div>
    ) : null
    case "download_file": return c.url ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "download")} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(167,139,250,0.08)", border: "1.5px solid rgba(167,139,250,0.28)", borderRadius: 13, padding: "13px 16px", textDecoration: "none" }}>
          <div style={{ width: 42, height: 42, background: "rgba(167,139,250,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.icon || "📄"}</div>
          <div style={{ flex: 1, minWidth: 0 }}><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label || "Télécharger"}</p>{c.type_doc && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.type_doc}</p>}</div>
          <span style={{ color: "#A78BFA", fontSize: 20, flexShrink: 0 }}>↓</span>
        </a>
      </div>
    ) : null
    case "multi_cta": {
      const btns = [[c.btn1_icon, c.btn1_label, c.btn1_url], [c.btn2_icon, c.btn2_label, c.btn2_url], [c.btn3_icon, c.btn3_label, c.btn3_url], [c.btn4_icon, c.btn4_label, c.btn4_url]].filter(([, l]) => l)
      return btns.length > 0 ? (
        <div style={{ padding: "6px 24px 10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {btns.map(([icon, label, url]: any[], i: number) => (
              <a key={i} href={url || "#"} target={/^https?:/.test(url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, url || "cta")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: `${G}10`, border: `1px solid ${G}22`, borderRadius: 12, padding: "13px 8px", textDecoration: "none" }}>
                <span style={{ fontSize: 22 }}>{icon || "⚡"}</span>
                <span style={{ color: TEXT, fontSize: 12, fontWeight: 600, textAlign: "center", fontFamily: FONT_B }}>{label}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null
    }

    case "product_catalog": {
      const products = [[c.p1_img, c.p1_name, c.p1_price, c.p1_desc, c.p1_url], [c.p2_img, c.p2_name, c.p2_price, c.p2_desc, c.p2_url], [c.p3_img, c.p3_name, c.p3_price, c.p3_desc, c.p3_url]].filter(([, n]) => n)
      return products.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {products.map(([img, name, price, desc, url]: any[], i: number) => (
              <a key={i} href={url || "#"} target={/^https?:/.test(url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, url || "product")} style={{ display: "flex", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden", textDecoration: "none" }}>
                {img ? <img src={String(img)} alt="" style={{ width: 84, height: 84, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 84, height: 84, background: "rgba(249,115,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🛍️</div>}
                <div style={{ flex: 1, minWidth: 0, padding: "10px 12px 10px 0" }}>
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{name}</p>
                  {desc && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 5px" }}>{desc}</p>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: G, fontSize: 16, fontWeight: 700 }}>{price}</span>
                    {c.cta_label && <span style={{ background: G, color: "#080808", borderRadius: 7, padding: "4px 11px", fontSize: 11, fontWeight: 700 }}>{c.cta_label}</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null
    }
    case "featured_product": return (c.name || c.image) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        <div style={{ background: `linear-gradient(135deg,${G}12,${theme.accent || "#39FF8F"}0a)`, border: `1.5px solid ${G}30`, borderRadius: 16, overflow: "hidden" }}>
          {c.badge && (() => { const bs = productBadgeStyle(c.badge, G); return <div style={{ background: bs.color, color: bs.fg, padding: "7px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" }}>{bs.icon ? bs.icon + " " : ""}{c.badge}</div> })()}
          {c.image
            ? <img src={c.image} alt="" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
            : <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(249,115,22,0.06)", fontSize: 48 }}>⭐</div>}
          <div style={{ padding: "16px" }}>
            <p style={{ color: TEXT, fontSize: 18, fontWeight: 700, margin: "0 0 6px", fontFamily: FONT_D }}>{c.name || "Mon produit phare"}</p>
            {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 12px", lineHeight: 1.5, fontFamily: FONT_B }}>{c.description}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: c.cta_label ? 14 : 0 }}>
              <span style={{ color: G, fontSize: 24, fontWeight: 700 }}>{c.price || "99€"}</span>
              {c.old_price && <span style={{ color: MUTED, fontSize: 15, textDecoration: "line-through" }}>{c.old_price}</span>}
              {(() => { const d = priceDiscount(c.price || "99€", c.old_price); return c.old_price ? <span style={{ background: "#EF4444", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>{d ? d.label : "Promo"}</span> : null })()}
            </div>
            {(() => { const st = stockStatus(c.stock); return st ? <p style={{ color: st.color, fontSize: 12, fontWeight: 700, margin: "0 0 12px", fontFamily: FONT_B }}>{st.state === "in" ? "✓ " : st.state === "out" ? "⛔ " : "🔥 "}{st.label}</p> : null })()}
            {c.cta_label && (() => { const out = stockStatus(c.stock)?.soldOut; return out
              ? <div style={{ background: "rgba(255,255,255,0.06)", color: MUTED, borderRadius: 11, padding: "13px", textAlign: "center", fontSize: 14, fontWeight: 800, fontFamily: FONT_B, cursor: "not-allowed" }}>Épuisé</div>
              : <a href={c.cta_url || c.url || "#"} target={/^https?:/.test(c.cta_url || c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || c.url || "product")} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 11, padding: "13px", textAlign: "center", fontSize: 14, fontWeight: 800, color: "#080808", textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label}</a> })()}
          </div>
        </div>
      </div>
    ) : null
    case "offer_comparison": {
      const plans = [{ name: c.plan1_name, price: c.plan1_price, old_price: c.plan1_old_price, features: c.plan1_features, hl: false }, { name: c.plan2_name, price: c.plan2_price, old_price: c.plan2_old_price, features: c.plan2_features, hl: c.plan2_highlight === "yes" }, { name: c.plan3_name, price: c.plan3_price, old_price: c.plan3_old_price, features: c.plan3_features, hl: false }].filter(p => p.name)
      return plans.length > 0 ? (
        <div style={{ padding: "16px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 14px", textAlign: "center", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            {plans.map((p, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, background: p.hl ? `${G}12` : "rgba(255,255,255,0.03)", border: `1.5px solid ${p.hl ? `${G}50` : "rgba(255,255,255,0.08)"}`, borderRadius: 13, padding: "14px 10px", position: "relative" }}>
                {p.hl && <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: G, color: "#080808", borderRadius: 20, padding: "2px 10px", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>⭐ Populaire</div>}
                <p style={{ color: p.hl ? G : TEXT, fontSize: 12, fontWeight: 700, margin: "0 0 5px", textAlign: "center", fontFamily: FONT_B }}>{p.name}</p>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 0 9px" }}>
                  <p style={{ color: G, fontSize: 19, fontWeight: 700, margin: 0, textAlign: "center", fontFamily: FONT_D }}>{p.price}</p>
                  {p.old_price && (() => { const disc = priceDiscount(p.price, p.old_price); return <p style={{ margin: "2px 0 0", fontSize: 11, fontFamily: FONT_B }}><span style={{ color: MUTED, textDecoration: "line-through" }}>{p.old_price}</span>{disc && <span style={{ color: "#EF4444", fontWeight: 800, marginLeft: 4 }}>{disc.label}</span>}</p> })()}
                </div>
                {(p.features || "").split("\n").filter(Boolean).map((f: string, j: number) => (
                  <p key={j} style={{ color: MUTED, fontSize: 10.5, margin: "0 0 4px", display: "flex", gap: 5 }}><span style={{ color: "#39FF8F" }}>✓</span> {f}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "packs": {
      const packs = [[c.pack1_icon, c.pack1_name, c.pack1_price, c.pack1_content, c.pack1_url], [c.pack2_icon, c.pack2_name, c.pack2_price, c.pack2_content, c.pack2_url], [c.pack3_icon, c.pack3_name, c.pack3_price, c.pack3_content, c.pack3_url]].filter(([, n]) => n)
      return packs.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {packs.map(([icon, name, price, content]: any[], i: number) => (
              <div key={i} style={{ background: i === 1 ? `${G}10` : "rgba(255,255,255,0.03)", border: `1.5px solid ${i === 1 ? `${G}35` : "rgba(255,255,255,0.07)"}`, borderRadius: 13, padding: "14px 15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ fontSize: 22 }}>{icon || "🚀"}</span><p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{name}</p></div>
                  <span style={{ color: G, fontSize: 17, fontWeight: 700 }}>{price}</span>
                </div>
                {(content || "").split("\n").filter(Boolean).map((line: string, j: number) => (
                  <p key={j} style={{ color: MUTED, fontSize: 12, margin: "0 0 4px", display: "flex", gap: 7 }}><span style={{ color: "#39FF8F" }}>✓</span> {line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "promo_code": return c.code ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <div style={{ background: "rgba(249,115,22,0.08)", border: "2px dashed rgba(249,115,22,0.3)", borderRadius: 13, padding: "16px", textAlign: "center" }}>
          {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 9px", fontFamily: FONT_B }}>{c.description}</p>}
          <div style={{ display: "inline-block", background: "rgba(249,115,22,0.15)", border: "2px solid rgba(249,115,22,0.4)", borderRadius: 9, padding: "10px 18px", fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#F97316", letterSpacing: 3 }}>{c.code}</div>
          {c.expires && <p style={{ color: MUTED, fontSize: 11, margin: "7px 0 0" }}>Expire le {c.expires}</p>}
        </div>
      </div>
    ) : null
    case "limited_offer": return (c.title || c.description) ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 13, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}><span style={{ color: "#EF4444" }}>⚡</span><p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.title || "Offre limitée"}</p></div>
          {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 7px" }}>{c.description}</p>}
          {c.expires && <p style={{ color: "#EF4444", fontSize: 12, margin: "0 0 10px", fontWeight: 600 }}>⏰ Expire le {c.expires}</p>}
          {c.cta_label && <a href={c.cta_url || "#"} target={/^https?:/.test(c.cta_url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "offer")} style={{ display: "block", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#EF4444", textDecoration: "none" }}>{c.cta_label}</a>}
        </div>
      </div>
    ) : null
    case "order_online": return (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={c.url || "#"} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "order")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(249,115,22,0.12)", border: "1.5px solid rgba(249,115,22,0.3)", borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>🛒</span>
          <span style={{ color: "#F97316", fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Commander maintenant"}</span>
        </a>
      </div>
    )
    case "free_gift": return (
      <div style={{ padding: "6px 24px 12px" }}>
        <div style={{ background: "rgba(236,72,153,0.08)", border: "1.5px solid rgba(236,72,153,0.25)", borderRadius: 13, padding: "16px", textAlign: "center" }}>
          <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>{c.emoji || "🎁"}</span>
          {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 11px", fontFamily: FONT_B }}>{c.description}</p>}
          <a href={c.url || "#"} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "gift")} style={{ display: "block", background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: FONT_B }}>{c.label || "Recevoir mon cadeau"}</a>
        </div>
      </div>
    )

    case "business_stats": {
      const stats = [[c.stat1_icon, c.stat1_value, c.stat1_label], [c.stat2_icon, c.stat2_value, c.stat2_label], [c.stat3_icon, c.stat3_value, c.stat3_label], [c.stat4_icon, c.stat4_value, c.stat4_label]].filter(([, v]) => v)
      return stats.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: stats.length <= 2 ? "1fr 1fr" : stats.length === 3 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 9 }}>
            {stats.map(([icon, value, label]: any[], i: number) => (
              <div key={i} style={{ background: `${G}08`, border: `1px solid ${G}15`, borderRadius: 13, padding: "16px 10px", textAlign: "center" }}>
                {icon && <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{icon}</span>}
                <p style={{ color: G, fontSize: 24, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_D, lineHeight: 1 }}>{value}</p>
                <p style={{ color: MUTED, fontSize: 11, margin: 0, fontFamily: FONT_B }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "google_reviews_block": {
      const reviews = [[c.r1_name, c.r1_text, c.r1_stars], [c.r2_name, c.r2_text, c.r2_stars], [c.r3_name, c.r3_text, c.r3_stars]].filter(([n]) => n)
      return (reviews.length > 0 || c.avg_rating) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {(c.avg_rating || c.title) && (
            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 13, padding: "12px 14px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 11 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#FBBF24", fontSize: 30, fontWeight: 700, margin: 0, fontFamily: FONT_D }}>{c.avg_rating || "5.0"}</p>
                <StarRow fills={starRow(c.avg_rating || 5)} size={11} />
              </div>
              <div>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.title || "Avis clients"}</p>
                {c.total_reviews && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.total_reviews} avis</p>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviews.map(([name, txt, stars]: any[], i: number) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{name}</p>
                  <StarRow fills={starRow(stars || 5)} size={11} />
                </div>
                <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>&quot;{txt}&quot;</p>
              </div>
            ))}
          </div>
          {c.google_url && <a href={c.google_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.google_url)} style={{ marginTop: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "#4285F4", fontSize: 12, fontWeight: 600, textDecoration: "none" }}><span>📍</span> Voir sur Google</a>}
        </div>
      ) : null
    }
    case "portfolio_work": {
      const works = [[c.work1_img, c.work1_title, c.work1_desc], [c.work2_img, c.work2_title, c.work2_desc], [c.work3_img, c.work3_title, c.work3_desc]].filter(([, t]) => t)
      return works.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {works.map(([img, title, desc]: any[], i: number) => (
              <div key={i} style={{ borderRadius: 11, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {img ? <img src={String(img)} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} /> : <div style={{ height: 100, background: `${G}08`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📂</div>}
                <div style={{ padding: "9px 10px" }}>
                  <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{title}</p>
                  {desc && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{desc}</p>}
                </div>
              </div>
            ))}
          </div>
          {c.cta_label && (c.cta_url
            ? <a href={c.cta_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url)} style={{ display: "block", marginTop: 11, background: `${G}10`, border: `1px solid ${G}25`, borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: G, textDecoration: "none" }}>{c.cta_label}</a>
            : <div style={{ marginTop: 11, background: `${G}10`, border: `1px solid ${G}25`, borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: G }}>{c.cta_label}</div>)}
        </div>
      ) : null
    }
    case "team": {
      const accent = theme.accent || "#39FF8F"
      const members = [[c.m1_photo, c.m1_name, c.m1_role, c.m1_bio], [c.m2_photo, c.m2_name, c.m2_role, c.m2_bio], [c.m3_photo, c.m3_name, c.m3_role, c.m3_bio]].filter(([, n]) => n)
      return members.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {members.map(([photo, name, role, bio]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 13, padding: "13px 15px" }}>
                {photo
                  ? <img src={String(photo)} alt={String(name)} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${G}40` }} />
                  : <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg,${G},${accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#080808", flexShrink: 0 }}>{String(name)[0]}</div>}
                <div>
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{name}</p>
                  {role && <p style={{ color: G, fontSize: 12, margin: "0 0 1px" }}>{role}</p>}
                  {bio && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{bio}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "partners": {
      const logos = [[c.logo1_img, c.logo1_name], [c.logo2_img, c.logo2_name], [c.logo3_img, c.logo3_name], [c.logo4_img, c.logo4_name], [c.logo5_img, c.logo5_name], [c.logo6_img, c.logo6_name]].filter(([, n]) => n)
      return logos.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", textAlign: "center", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
            {logos.map(([img, name]: any[], i: number) => (
              <div key={i} style={{ height: 48, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {img ? <img src={String(img)} alt={String(name)} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 5 }} /> : <p style={{ color: MUTED, fontSize: 11, margin: 0, textAlign: "center", padding: "0 5px" }}>{name}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "logo_wall": {
      const logos = [[c.logo1, c.logo1_name], [c.logo2, c.logo2_name], [c.logo3, c.logo3_name], [c.logo4, c.logo4_name], [c.logo5, c.logo5_name], [c.logo6, c.logo6_name], [c.logo7, c.logo7_name], [c.logo8, c.logo8_name]].filter(([, n]) => n)
      return logos.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", textAlign: "center", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
            {logos.map(([img, name]: any[], i: number) => (
              <div key={i} style={{ height: 40, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {img ? <img src={String(img)} alt={String(name)} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} /> : <p style={{ color: MUTED, fontSize: 9, margin: 0, textAlign: "center", padding: "0 4px", lineHeight: 1.2 }}>{name}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "process_steps": {
      const accent = theme.accent || "#39FF8F"
      const steps = [[c.s1_icon, c.s1_title, c.s1_desc], [c.s2_icon, c.s2_title, c.s2_desc], [c.s3_icon, c.s3_title, c.s3_desc], [c.s4_icon, c.s4_title, c.s4_desc]].filter(([, t]) => t)
      return steps.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {steps.map(([icon, title, desc]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${G},${accent})`, color: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontSize: icon ? 17 : 14, fontWeight: 700, flexShrink: 0 }}>{icon || i + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "5px 0 2px", fontFamily: FONT_B }}>{title}</p>
                  {desc && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "trust_badge": {
      const badges = [[c.b1_icon, c.b1_label], [c.b2_icon, c.b2_label], [c.b3_icon, c.b3_label], [c.b4_icon, c.b4_label]].filter(([, l]) => l)
      return badges.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", textAlign: "center", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center" }}>
            {badges.map(([icon, label]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(57,255,143,0.08)", border: "1px solid rgba(57,255,143,0.2)", borderRadius: 20, padding: "8px 15px" }}>
                <span style={{ color: "#39FF8F", fontSize: 15, fontWeight: 700 }}>{icon}</span>
                <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, fontFamily: FONT_B }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }

    case "quote_block": return (c.quote || c.author) ? (
      <div style={{ padding: "14px 24px" }}>
        <div style={{ background: `${G}08`, border: `1px solid ${G}20`, borderRadius: 15, padding: "22px 20px", position: "relative" }}>
          <span style={{ position: "absolute", top: 12, left: 16, color: G, fontSize: 44, fontFamily: "Georgia, serif", lineHeight: 1, opacity: 0.35 }}>&ldquo;</span>
          <p style={{ color: TEXT, fontSize: 17, fontStyle: "italic", lineHeight: 1.7, margin: "0 0 12px", paddingTop: 14, fontFamily: FONT_D }}>{c.quote}</p>
          {c.author && (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 26, height: 2, background: G, borderRadius: 1 }} />
              <p style={{ color: G, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.author}{c.source ? <span style={{ color: MUTED, fontWeight: 400 }}> — {c.source}</span> : null}</p>
            </div>
          )}
        </div>
      </div>
    ) : null
    case "timeline": {
      const events = [[c.e1_date, c.e1_title, c.e1_desc], [c.e2_date, c.e2_title, c.e2_desc], [c.e3_date, c.e3_title, c.e3_desc], [c.e4_date, c.e4_title, c.e4_desc]].filter(([, t]) => t)
      return events.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 16px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ position: "relative", paddingLeft: 22 }}>
            <div style={{ position: "absolute", left: 6, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg,${G},${G}40)`, borderRadius: 1 }} />
            {events.map(([date, title, desc]: any[], i: number) => (
              <div key={i} style={{ position: "relative", marginBottom: i < events.length - 1 ? 18 : 0 }}>
                <div style={{ position: "absolute", left: -19, top: 4, width: 11, height: 11, borderRadius: "50%", background: i === events.length - 1 ? "#39FF8F" : G, border: `2px solid ${i === events.length - 1 ? "#39FF8F40" : `${G}40`}` }} />
                <p style={{ color: G, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{date}</p>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: "0 0 2px", fontFamily: FONT_B }}>{title}</p>
                {desc && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{desc}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "two_columns": {
      const cols = [[c.col1_icon, c.col1_title, c.col1_text], [c.col2_icon, c.col2_title, c.col2_text]].filter(([, t, txt]) => t || txt)
      return cols.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
            {cols.map(([icon, title, txt]: any[], i: number) => (
              <div key={i} style={{ background: `${G}06`, border: `1px solid ${G}15`, borderRadius: 13, padding: "14px 13px" }}>
                {icon && <span style={{ fontSize: 26, display: "block", marginBottom: 9 }}>{icon}</span>}
                {title && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 5px", fontFamily: FONT_B }}>{title}</p>}
                {txt && <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{txt}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "tabs_block": {
      const tabs = [[c.tab1_label, c.tab1_content], [c.tab2_label, c.tab2_content], [c.tab3_label, c.tab3_content]].filter(([l]) => l) as [string, string][]
      return tabs.length > 0 ? <TabsPublic tabs={tabs} G={G} TEXT={TEXT} MUTED={MUTED} FONT_B={FONT_B} /> : null
    }
    case "accordion_block": {
      const items = [[c.a1_title, c.a1_content], [c.a2_title, c.a2_content], [c.a3_title, c.a3_content], [c.a4_title, c.a4_content]].filter(([t]) => t) as [string, string][]
      return items.length > 0 ? <AccordionPublic items={items} title={c.title} G={G} TEXT={TEXT} MUTED={MUTED} FONT_B={FONT_B} /> : null
    }
    case "info_box": {
      const boxStyles: Record<string, any> = {
        info: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.3)", color: "#38BDF8" },
        warning: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.3)", color: "#FBBF24" },
        success: { bg: "rgba(57,255,143,0.08)", border: "rgba(57,255,143,0.3)", color: "#39FF8F" },
        tip: { bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.3)", color: "#C9A84C" },
        important: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", color: "#EF4444" },
      }
      const bs = boxStyles[c.type || "info"]
      return (c.message || c.title) ? (
        <div style={{ padding: "8px 24px" }}>
          <div style={{ background: bs.bg, border: `1.5px solid ${bs.border}`, borderRadius: 13, padding: "15px 17px" }}>
            <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{c.emoji || "💡"}</span>
              <div>
                {c.title && <p style={{ color: bs.color, fontSize: 13, fontWeight: 700, margin: "0 0 4px", fontFamily: FONT_B }}>{c.title}</p>}
                {c.message && <p style={{ color: TEXT, fontSize: 13, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: FONT_B }}>{c.message}</p>}
              </div>
            </div>
          </div>
        </div>
      ) : null
    }
    case "values": {
      const vals = [[c.v1_icon, c.v1_label, c.v1_desc], [c.v2_icon, c.v2_label, c.v2_desc], [c.v3_icon, c.v3_label, c.v3_desc], [c.v4_icon, c.v4_label, c.v4_desc]].filter(([, l]) => l)
      return vals.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {vals.map(([icon, label, desc]: any[], i: number) => (
              <div key={i} style={{ background: `${G}08`, border: `1px solid ${G}15`, borderRadius: 13, padding: "14px 11px", textAlign: "center" }}>
                {icon && <span style={{ fontSize: 26, display: "block", marginBottom: 7 }}>{icon}</span>}
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: desc ? "0 0 3px" : "0", fontFamily: FONT_B }}>{label}</p>
                {desc && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{desc}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "stats_block": {
      const stats = [[c.s1_icon, c.s1_value, c.s1_label], [c.s2_icon, c.s2_value, c.s2_label], [c.s3_icon, c.s3_value, c.s3_label], [c.s4_icon, c.s4_value, c.s4_label]].filter(([, v]) => v)
      return stats.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: stats.length <= 2 ? "1fr 1fr" : stats.length === 3 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 9 }}>
            {stats.map(([icon, value, label]: any[], i: number) => (
              <div key={i} style={{ background: `${G}08`, border: `1px solid ${G}15`, borderRadius: 13, padding: "16px 10px", textAlign: "center" }}>
                {icon && <span style={{ fontSize: 22, display: "block", marginBottom: 5 }}>{icon}</span>}
                <p style={{ color: G, fontSize: 24, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_D, lineHeight: 1 }}>{value}</p>
                <p style={{ color: MUTED, fontSize: 11, margin: 0, fontFamily: FONT_B }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }

    case "discord_server": return (c.server_name || c.cta_url) ? (
      <div style={{ padding: "10px 24px 12px" }}>
        <div style={{ background: "rgba(88,101,242,0.08)", border: "1.5px solid rgba(88,101,242,0.25)", borderRadius: 13, padding: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(88,101,242,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>🎮</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 1px", fontFamily: FONT_B }}>{c.server_name || "Mon Serveur"}</p>
              {c.members && <p style={{ color: MUTED, fontSize: 11, margin: "0 0 1px" }}>👥 {c.members}</p>}
              {c.description && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.description}</p>}
            </div>
          </div>
          <a href={c.cta_url || "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "discord")} style={{ display: "block", background: "#5865F2", color: "#fff", textAlign: "center", padding: "12px", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label || "Rejoindre le Discord"}</a>
        </div>
      </div>
    ) : null
    case "telegram_channel": return (c.channel_name || c.cta_url) ? (
      <div style={{ padding: "10px 24px 12px" }}>
        <div style={{ background: "rgba(38,165,228,0.08)", border: "1.5px solid rgba(38,165,228,0.25)", borderRadius: 13, padding: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(38,165,228,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>✈️</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 1px", fontFamily: FONT_B }}>{c.channel_name || "Mon Canal"}</p>
              {c.members && <p style={{ color: MUTED, fontSize: 11, margin: "0 0 1px" }}>👥 {c.members}</p>}
              {c.description && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.description}</p>}
            </div>
          </div>
          <a href={c.cta_url || "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "telegram")} style={{ display: "block", background: "#26A5E4", color: "#fff", textAlign: "center", padding: "12px", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label || "Rejoindre le canal"}</a>
        </div>
      </div>
    ) : null
    case "youtube_channel": return (c.channel_name || c.cta_url) ? (
      <div style={{ padding: "10px 24px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,0,0,0.15)", border: "2px solid rgba(255,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>▶️</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.channel_name || "Ma Chaîne"}</p>
            {c.subscribers && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.subscribers}</p>}
          </div>
        </div>
        <a href={c.cta_url || "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "youtube")} style={{ display: "block", background: "#FF0000", color: "#fff", textAlign: "center", padding: "12px", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label || "S'abonner"}</a>
      </div>
    ) : null
    case "twitch_live": {
      const isLive = c.status === "live"
      return (c.username || c.cta_url) ? (
        <div style={{ padding: "10px 24px 12px" }}>
          <div style={{ background: isLive ? "rgba(145,70,255,0.1)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${isLive ? "rgba(145,70,255,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 13, padding: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(145,70,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>🎮</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.username || "monpseudo"}</p>
                  {isLive && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>● LIVE</span>}
                </div>
                {c.game && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>🎯 {c.game}</p>}
                {c.viewers && isLive && <p style={{ color: "#9146FF", fontSize: 11, margin: 0 }}>👁 {c.viewers}</p>}
                {!isLive && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Hors ligne</p>}
              </div>
            </div>
            <a href={c.cta_url || "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "twitch")} style={{ display: "block", background: "#9146FF", color: "#fff", textAlign: "center", padding: "11px", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label || "Rejoindre le live"}</a>
          </div>
        </div>
      ) : null
    }
    case "tiktok_feed": return (c.username || c.cta_url) ? (
      <div style={{ padding: "10px 24px 12px" }}>
        <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(245,240,232,0.12)", borderRadius: 13, padding: "15px", textAlign: "center" }}>
          <span style={{ fontSize: 30, display: "block", marginBottom: 8 }}>🎵</span>
          {c.username && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 10px", fontFamily: FONT_B }}>{c.username}</p>}
          <a href={c.cta_url || "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "tiktok")} style={{ display: "block", background: "linear-gradient(90deg,#ff0050,#00f2ea)", color: "#fff", padding: "11px", borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label || "Voir sur TikTok"}</a>
        </div>
      </div>
    ) : null
    case "podcast_links": {
      const platforms = [["spotify_url", "🟢", "#1DB954", "Spotify Podcasts"], ["apple_url", "🍎", "#B150E2", "Apple Podcasts"], ["pocket_url", "📻", "#F43E37", "Pocket Casts"], ["rss_url", "📡", "#F97316", "RSS Feed"]].filter(([k]) => c[k as string])
      return (platforms.length > 0 || c.podcast_name) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
            {c.cover_url
              ? <img src={c.cover_url} alt="" style={{ width: 54, height: 54, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 54, height: 54, borderRadius: 11, background: "rgba(177,80,226,0.15)", border: "1px solid rgba(177,80,226,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 27, flexShrink: 0 }}>🎙️</div>}
            <div>
              <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.podcast_name || "Mon Podcast"}</p>
              {c.description && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{c.description}</p>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {platforms.map(([k, icon, color, label]: any[]) => (
              <a key={String(k)} href={c[k as string]} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c[k as string])} style={{ display: "flex", alignItems: "center", gap: 11, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 10, padding: "11px 13px", textDecoration: "none" }}>
                <span style={{ fontSize: 17 }}>{icon}</span>
                <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, flex: 1, fontFamily: FONT_B }}>{label}</span>
                <ExternalLink size={12} color={color as string} />
              </a>
            ))}
          </div>
        </div>
      ) : null
    }
    case "favorite_links": {
      const links = [[c.link_1_icon, c.link_1_label, c.link_1_url], [c.link_2_icon, c.link_2_label, c.link_2_url], [c.link_3_icon, c.link_3_label, c.link_3_url], [c.link_4_icon, c.link_4_label, c.link_4_url], [c.link_5_icon, c.link_5_label, c.link_5_url]].filter(([, l]) => l)
      return links.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {links.map(([icon, label, url]: any[], i: number) => (
              <a key={i} href={url || "#"} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, url || "link")} style={{ display: "flex", alignItems: "center", gap: 13, background: `${G}08`, border: `1px solid ${G}15`, borderRadius: 11, padding: "12px 13px", textDecoration: "none" }}>
                <span style={{ fontSize: 21, flexShrink: 0 }}>{icon || "🔗"}</span>
                <span style={{ color: TEXT, fontSize: 14, fontWeight: 600, flex: 1, fontFamily: FONT_B }}>{label}</span>
                <ExternalLink size={12} color={G} />
              </a>
            ))}
          </div>
        </div>
      ) : null
    }
    case "image_carousel": {
      const imgs = [c.img1, c.img2, c.img3, c.img4, c.img5, c.img6, c.img7, c.img8, c.img9, c.img10, c.img11, c.img12].filter(Boolean)
      return imgs.length > 0 ? <CarouselPublic imgs={imgs} title={c.title} autoplay={c.auto_play === "yes"} MUTED={MUTED} FONT_B={FONT_B} /> : null
    }
    case "media_before_after": return (c.before_img || c.after_img) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        {c.title && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 11px", textAlign: "center", fontFamily: FONT_B }}>{c.title}</p>}
        {c.mode === "slider" && c.before_img && c.after_img
          ? <BeforeAfterPublic before={c.before_img} after={c.after_img} beforeLabel={c.before_label || "Avant"} afterLabel={c.after_label || "Après"} />
          : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          <div style={{ borderRadius: 11, overflow: "hidden" }}>
            {c.before_img ? <img src={c.before_img} alt="Avant" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, background: "rgba(239,68,68,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📸</div>}
            <div style={{ background: "rgba(239,68,68,0.15)", padding: "7px", textAlign: "center" }}><p style={{ color: "#EF4444", fontSize: 12, fontWeight: 700, margin: 0 }}>{c.before_label || "Avant"}</p></div>
          </div>
          <div style={{ borderRadius: 11, overflow: "hidden" }}>
            {c.after_img ? <img src={c.after_img} alt="Après" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, background: "rgba(57,255,143,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>✨</div>}
            <div style={{ background: "rgba(57,255,143,0.15)", padding: "7px", textAlign: "center" }}><p style={{ color: "#39FF8F", fontSize: 12, fontWeight: 700, margin: 0 }}>{c.after_label || "Après"}</p></div>
          </div>
        </div>}
        {c.description && <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: "9px 0 0" }}>{c.description}</p>}
      </div>
    ) : null
    case "video_local": {
      if (!c.src) return null
      const arMap: Record<string, string | undefined> = { "16:9": "16/9", "9:16": "9/16", "1:1": "1" }
      const ar = arMap[c.ratio || "16:9"]
      const vertical = c.ratio === "9:16"
      return (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ borderRadius: 13, overflow: "hidden", background: "#000", maxWidth: vertical ? 280 : undefined, margin: vertical ? "0 auto" : undefined }}>
            <video src={c.src} poster={c.poster || undefined} controls
              style={{ width: "100%", aspectRatio: ar, maxHeight: ar ? undefined : 260, objectFit: "cover", display: "block" }}
              autoPlay={c.autoplay === "yes"} loop={c.loop === "yes"} muted={c.muted !== "no"} playsInline />
          </div>
          {c.title && <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: "9px 0 0", textAlign: "center", fontFamily: FONT_B }}>{c.title}</p>}
        </div>
      )
    }
    case "audio_player": return c.src ? (
      <div style={{ padding: "10px 24px 14px" }}>
        <div style={{ background: "rgba(167,139,250,0.06)", border: "1.5px solid rgba(167,139,250,0.22)", borderRadius: 15, padding: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 13 }}>
            {c.cover
              ? <img src={c.cover} alt="" loading="lazy" style={{ width: 60, height: 60, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 60, height: 60, borderRadius: 11, background: "rgba(167,139,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🎧</div>}
            <div style={{ minWidth: 0 }}>
              <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title || "Écouter"}</p>
              {c.artist && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{c.artist}</p>}
            </div>
          </div>
          <audio src={c.src} controls preload="none" style={{ width: "100%", display: "block" }} />
          {c.show_download === "yes" && <a href={c.src} download onClick={() => trackLinkClick(pageId, block.id, "audio-download")} style={{ display: "inline-block", marginTop: 9, color: MUTED, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>↓ Télécharger</a>}
        </div>
      </div>
    ) : null
    case "pdf_viewer": return (c.url || c.title) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        <div style={{ background: "rgba(78,205,196,0.06)", border: "1.5px solid rgba(78,205,196,0.2)", borderRadius: 15, padding: "17px" }}>
          {c.cover && <div style={{ borderRadius: 11, overflow: "hidden", marginBottom: 13, boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}><img src={c.cover} alt={c.title || "Couverture du document"} loading="lazy" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} /></div>}
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: c.url ? 13 : 0 }}>
            {!c.cover && <div style={{ width: 46, height: 54, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>📄</div>}
            <div style={{ flex: 1 }}>
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.title || "Mon document PDF"}</p>
              {c.description && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 2px" }}>{c.description}</p>}
              {(c.pages || c.file_size) && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>📄 PDF{c.pages ? ` · ${c.pages} pages` : ""}{c.file_size ? ` · ${c.file_size}` : ""}</p>}
            </div>
          </div>
          {c.url && (
            <div style={{ display: "flex", gap: 8 }}>
              <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url)} style={{ flex: 1, background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 9, padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#080808", textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label || "Consulter le PDF"}</a>
              {c.show_download !== "no" && <a href={c.url} download onClick={() => trackLinkClick(pageId, block.id, c.url)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px 16px", fontSize: 13, fontWeight: 600, color: MUTED, textDecoration: "none" }}>↓ PDF</a>}
            </div>
          )}
        </div>
      </div>
    ) : null
    case "youtube_gallery": {
      const videos = [[c.video1_url, c.video1_title], [c.video2_url, c.video2_title], [c.video3_url, c.video3_title]].filter(([u]) => u)
      return videos.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {videos.map(([url, title]: any[], i: number) => {
              const videoId = String(url).match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
              return (
                <a key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ display: "block", borderRadius: 11, overflow: "hidden", background: "#000", position: "relative", textDecoration: "none" }}>
                  {videoId ? <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, background: "rgba(255,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>▶️</div>}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 44, height: 44, background: "rgba(255,0,0,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 16, marginLeft: 3 }}>▶</span></div>
                  </div>
                  {title && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.85))", padding: "24px 12px 10px" }}><p style={{ color: "#fff", fontSize: 12, margin: 0, fontFamily: FONT_B }}>{title}</p></div>}
                </a>
              )
            })}
          </div>
          {c.cta_label && c.channel_url && <a href={c.channel_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.channel_url)} style={{ display: "block", marginTop: 11, background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#FF0000", textDecoration: "none" }}>{c.cta_label}</a>}
        </div>
      ) : null
    }
    case "tiktok_gallery": {
      const vids = [c.video1_url, c.video2_url, c.video3_url].filter(Boolean)
      return (vids.length > 0 || c.cta_url) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          {c.username && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 10px", textAlign: "center" }}>{c.username}</p>}
          {vids.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {[c.video1_url, c.video2_url, c.video3_url].map((url, i) => url ? (
                <a key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ aspectRatio: "9/16", background: "linear-gradient(135deg,rgba(255,0,80,0.15),rgba(0,242,234,0.15))", border: "1px solid rgba(245,240,232,0.12)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, textDecoration: "none" }}>🎵</a>
              ) : <div key={i} style={{ aspectRatio: "9/16", background: "rgba(245,240,232,0.06)", borderRadius: 9 }} />)}
            </div>
          )}
          {c.cta_label && c.cta_url && <a href={c.cta_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url)} style={{ display: "block", marginTop: 11, background: "linear-gradient(90deg,#ff0050,#00f2ea)", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label}</a>}
        </div>
      ) : null
    }
    case "video_testimonials": {
      const testi = [[c.t1_video_url, c.t1_name, c.t1_company, c.t1_quote], [c.t2_video_url, c.t2_name, c.t2_company, c.t2_quote]].filter(([, n]) => n)
      return testi.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {testi.map(([url, name, company, quote]: any[], i: number) => {
              const videoId = String(url || "").match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
              const inner = (
                <>
                  {videoId && (
                    <div style={{ position: "relative" }}>
                      <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 15, marginLeft: 3 }}>▶</span></div>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: "12px 14px" }}>
                    {quote && <p style={{ color: TEXT, fontSize: 13, fontStyle: "italic", margin: "0 0 7px", lineHeight: 1.5, fontFamily: FONT_B }}>&quot;{quote}&quot;</p>}
                    <p style={{ color: G, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{name}{company ? <span style={{ color: MUTED, fontWeight: 400 }}> — {company}</span> : null}</p>
                  </div>
                </>
              )
              return videoId
                ? <a key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ display: "block", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 13, overflow: "hidden", textDecoration: "none" }}>{inner}</a>
                : <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 13, overflow: "hidden" }}>{inner}</div>
            })}
          </div>
        </div>
      ) : null
    }

    case "event_program": {
      const steps = [[c.s1_time, c.s1_title, c.s1_desc], [c.s2_time, c.s2_title, c.s2_desc], [c.s3_time, c.s3_title, c.s3_desc], [c.s4_time, c.s4_title, c.s4_desc], [c.s5_time, c.s5_title, c.s5_desc]].filter(([, t]) => t)
      return steps.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {steps.map(([time, title, desc]: any[], i: number, arr: any[]) => (
              <div key={i} style={{ display: "flex", gap: 15, paddingBottom: i < arr.length - 1 ? 15 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#EC4899,#F472B6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{time}</div>
                  {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(236,72,153,0.2)", marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, paddingTop: 7 }}>
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{title}</p>
                  {desc && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "event_ticketing": return (c.event_name || c.url) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        <div style={{ background: "rgba(236,72,153,0.08)", border: "1.5px solid rgba(236,72,153,0.3)", borderRadius: 15, padding: "17px" }}>
          <div style={{ display: "flex", gap: 13, alignItems: "flex-start", marginBottom: 15 }}>
            <span style={{ fontSize: 34, flexShrink: 0 }}>🎟️</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_B }}>{c.event_name || "Mon événement"}</p>
              {c.date && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 2px" }}>📅 {c.date}</p>}
              {c.location && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 2px" }}>📍 {c.location}</p>}
              {c.price && <p style={{ color: "#EC4899", fontSize: 13, fontWeight: 700, margin: 0 }}>💶 {c.price}</p>}
            </div>
          </div>
          <a href={c.url || "#"} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "ticket")} style={{ display: "block", background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 11, padding: "13px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: FONT_B }}>{c.label || "Réserver ma place"}{c.platform && c.platform !== "URL personnalisée" ? ` — ${c.platform}` : ""}</a>
        </div>
      </div>
    ) : null
    case "event_guests": {
      const guests = [[c.g1_photo, c.g1_name, c.g1_role, c.g1_desc], [c.g2_photo, c.g2_name, c.g2_role, c.g2_desc], [c.g3_photo, c.g3_name, c.g3_role, c.g3_desc], [c.g4_photo, c.g4_name, c.g4_role, c.g4_desc]].filter(([, n]) => n)
      return guests.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            {guests.map(([photo, name, role, desc]: any[], i: number) => (
              <div key={i} style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.15)", borderRadius: 13, padding: "14px 11px", textAlign: "center" }}>
                {photo
                  ? <img src={String(photo)} alt="" style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover", margin: "0 auto 9px", display: "block", border: "2px solid rgba(236,72,153,0.4)" }} />
                  : <div style={{ width: 58, height: 58, borderRadius: "50%", background: "linear-gradient(135deg,#EC4899,#F472B6)", margin: "0 auto 9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff" }}>{String(name)[0]}</div>}
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_B }}>{name}</p>
                {role && <span style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.25)", borderRadius: 20, padding: "2px 9px", color: "#EC4899", fontSize: 10, fontWeight: 700 }}>{role}</span>}
                {desc && <p style={{ color: MUTED, fontSize: 11, margin: "5px 0 0" }}>{desc}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "lineup": {
      const artists = [[c.a1_name, c.a1_stage, c.a1_time, c.a1_headliner], [c.a2_name, c.a2_stage, c.a2_time, c.a2_headliner], [c.a3_name, c.a3_stage, c.a3_time, c.a3_headliner], [c.a4_name, c.a4_stage, c.a4_time, c.a4_headliner]].filter(([n]) => n)
      return artists.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {artists.map(([name, stage, time, headliner]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: headliner === "yes" ? "rgba(236,72,153,0.1)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${headliner === "yes" ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 13, padding: "12px 15px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ color: headliner === "yes" ? "#EC4899" : TEXT, fontSize: headliner === "yes" ? 16 : 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{name}</p>
                    {headliner === "yes" && <span style={{ background: "#EC4899", color: "#fff", borderRadius: 10, padding: "1px 8px", fontSize: 9, fontWeight: 700 }}>HEADLINER</span>}
                  </div>
                  {stage && <p style={{ color: MUTED, fontSize: 11, margin: "2px 0 0" }}>🎭 {stage}</p>}
                </div>
                {time && <span style={{ color: headliner === "yes" ? "#EC4899" : MUTED, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{time}</span>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "event_access": {
      const transports = [[c.transport1_icon, c.transport1_label], [c.transport2_icon, c.transport2_label], [c.transport3_icon, c.transport3_label]].filter(([, l]) => l)
      return (c.embed_url || c.address || transports.length > 0) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          {c.embed_url
            ? <iframe src={c.embed_url} width="100%" height={180} style={{ border: "none", borderRadius: 13, display: "block", marginBottom: 11 }} loading="lazy" />
            : c.address ? <div style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 13, padding: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, marginBottom: 11 }}><span style={{ fontSize: 30 }}>🗺️</span><p style={{ color: MUTED, fontSize: 12, margin: 0, textAlign: "center" }}>📍 {c.address}</p></div> : null}
          {transports.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {transports.map(([icon, label]: any[], i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 13px" }}>
                  <span style={{ fontSize: 19 }}>{icon}</span>
                  <span style={{ color: TEXT, fontSize: 13, fontFamily: FONT_B }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null
    }
    case "event_register": return <EventRegisterPublic block={block} pageId={pageId} TEXT={TEXT} MUTED={MUTED} ownerEmail={ownerEmail} />
    case "rsvp": return <RsvpPublic block={block} pageId={pageId} TEXT={TEXT} MUTED={MUTED} />
    case "add_to_calendar": return (c.event_name || c.google_url) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        <div style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 15, padding: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: c.google_url ? 13 : 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: "rgba(236,72,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>📅</div>
            <div>
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.event_name || "Mon événement"}</p>
              {c.start_date && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>🕐 {c.start_date}</p>}
              {c.location && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>📍 {c.location}</p>}
            </div>
          </div>
          {c.google_url && <a href={c.google_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.google_url)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(66,133,244,0.12)", border: "1px solid rgba(66,133,244,0.3)", borderRadius: 10, padding: "13px", fontSize: 13, fontWeight: 700, color: "#4285F4", textDecoration: "none", fontFamily: FONT_B }}>📅 {c.cta_label || "Ajouter à Google Agenda"}</a>}
        </div>
      </div>
    ) : null
    case "participants_count": {
      const total = parseInt(c.count || "0")
      const max = parseInt(c.max || "0")
      const pct = max > 0 ? Math.min(100, Math.round((total / max) * 100)) : 0
      return c.count ? (
        <div style={{ padding: "14px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 13, background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 15, padding: "17px 26px", marginBottom: (c.show_progress !== "no" && max > 0) ? 13 : 0 }}>
            <span style={{ fontSize: 30 }}>{c.emoji || "👥"}</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ color: "#EC4899", fontSize: 34, fontWeight: 700, margin: 0, fontFamily: FONT_D, lineHeight: 1 }}>{c.count}</p>
              <p style={{ color: MUTED, fontSize: 12, margin: "3px 0 0" }}>{c.label || "participants inscrits"}</p>
            </div>
          </div>
          {c.show_progress !== "no" && max > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: MUTED, fontSize: 11 }}>Inscriptions</span>
                <span style={{ color: "#EC4899", fontSize: 11, fontWeight: 700 }}>{pct}% · {total}/{max}</span>
              </div>
              <div style={{ height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 4 }} />
              </div>
            </div>
          )}
        </div>
      ) : null
    }
    case "tickets_left": {
      const urgencyStyles: Record<string, any> = {
        high: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.4)", color: "#EF4444" },
        medium: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.3)", color: "#FBBF24" },
        low: { bg: "rgba(57,255,143,0.08)", border: "rgba(57,255,143,0.25)", color: "#39FF8F" },
      }
      const us = urgencyStyles[c.urgency || "high"]
      return c.count ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ background: us.bg, border: `1.5px solid ${us.border}`, borderRadius: 15, padding: "17px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, marginBottom: c.cta_label ? 13 : 0 }}>
              <span style={{ fontSize: 30 }}>🎟️</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ color: us.color, fontSize: 34, fontWeight: 700, margin: 0, fontFamily: FONT_D, lineHeight: 1 }}>{c.count}</p>
                <p style={{ color: MUTED, fontSize: 12, margin: "3px 0 0" }}>{c.label || "places restantes"}</p>
              </div>
            </div>
            {c.cta_label && <a href={c.cta_url || "#"} target={/^https?:/.test(c.cta_url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "tickets")} style={{ display: "block", background: us.color, borderRadius: 11, padding: "13px", fontSize: 14, fontWeight: 700, color: c.urgency === "medium" || c.urgency === "low" ? "#080808" : "#fff", textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label}</a>}
          </div>
        </div>
      ) : null
    }

    case "vcard": {
      const vcf = ["BEGIN:VCARD", "VERSION:3.0", c.name ? `FN:${c.name}` : "", c.company ? `ORG:${c.company}` : "", c.phone ? `TEL:${c.phone}` : "", c.email ? `EMAIL:${c.email}` : "", c.website ? `URL:${c.website}` : "", "END:VCARD"].filter(Boolean).join("\n")
      const href = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcf)}`
      return (c.name || c.phone || c.email) ? (
        <div style={{ padding: "6px 24px 12px" }}>
          <div style={{ background: `${G}08`, border: `1.5px solid ${G}25`, borderRadius: 13, padding: "13px 15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${G},${G}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👤</div>
              <div>{c.name && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.name}</p>}{c.company && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.company}</p>}</div>
            </div>
            <a href={href} download={`${(c.name || "contact").replace(/\s+/g, "_")}.vcf`} onClick={() => trackLinkClick(pageId, block.id, "vcard")} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#080808", textDecoration: "none", fontFamily: FONT_B }}>{c.label || "Ajouter à mes contacts"}</a>
          </div>
        </div>
      ) : null
    }
    case "google_review": return c.url ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url)} style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(251,191,36,0.08)", border: "1.5px solid rgba(251,191,36,0.25)", borderRadius: 13, padding: "13px 15px", textDecoration: "none" }}>
          <div style={{ display: "flex", gap: 1 }}>{Array.from({ length: parseInt(c.stars || "5") }).map((_, i) => <span key={i} style={{ color: "#FBBF24", fontSize: 13 }}>★</span>)}</div>
          <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label || "Donner un avis"}</p><p style={{ color: MUTED, fontSize: 10, margin: 0 }}>Google Reviews</p></div>
          <span style={{ fontSize: 19 }}>⭐</span>
        </a>
      </div>
    ) : null
    case "table_booking": return c.url ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>🍽️</span>
          <span style={{ color: "#EF4444", fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Réserver une table"}</span>
        </a>
      </div>
    ) : null
    case "donation": {
      const dc = ({ "Ko-fi": "#FF5E5B", "Buy Me A Coffee": "#FFDD00", "Patreon": "#FF424D", "PayPal": "#009CDE", "Tipeee": "#E55100" } as any)[c.platform || "Ko-fi"] || "#F59E0B"
      return c.url ? (
        <div style={{ padding: "6px 24px 12px" }}>
          <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: `${dc}12`, border: `1.5px solid ${dc}30`, borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
            <span style={{ fontSize: 19 }}>☕</span>
            <span style={{ color: dc, fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Soutenir mon travail"}</span>
          </a>
        </div>
      ) : null
    }
    case "app_download": return (c.ios_url || c.android_url) ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {c.ios_url && <a href={c.ios_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.ios_url)} style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "11px 15px", textDecoration: "none" }}><span style={{ fontSize: 24 }}>🍎</span><div><p style={{ color: MUTED, fontSize: 9, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Disponible sur</p><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>App Store</p></div></a>}
          {c.android_url && <a href={c.android_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.android_url)} style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "11px 15px", textDecoration: "none" }}><span style={{ fontSize: 24 }}>🤖</span><div><p style={{ color: MUTED, fontSize: 9, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Disponible sur</p><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>Google Play</p></div></a>}
        </div>
      </div>
    ) : null
    case "quote_request": return (c.label || c.url) ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <a href={c.url || "#"} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "quote")} style={{ display: "flex", alignItems: "center", gap: 11, background: `${G}08`, border: `1.5px solid ${G}20`, borderRadius: 13, padding: "12px 15px", textDecoration: "none" }}>
          <div style={{ width: 40, height: 40, background: `${G}12`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label || "Demander un devis"}</p>{c.description && <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{c.description}</p>}</div>
          <span style={{ color: G, fontSize: 15 }}>→</span>
        </a>
      </div>
    ) : null
    case "reservation_form": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} leadType="reservation" title={c.title || "Réserver"} fields={[{ key: "name", label: "Nom" }, { key: "date", label: "Date souhaitée" }, { key: "people", label: "Nb personnes" }]} button={c.button_label || "Réserver"} accent="linear-gradient(90deg,#EF4444,#dc2626)" subject={`Réservation: ${c.title || ""}`} TEXT={TEXT} MUTED={MUTED} />
    case "quote_form": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} leadType="quote" title={c.title || "Demander un devis"} description={c.description} fields={[{ key: "name", label: "Nom complet" }, { key: "email", label: "Email" }, ...(c.show_phone !== "no" ? [{ key: "phone", label: "Téléphone" }] : []), ...(c.show_budget === "yes" ? [{ key: "budget", label: "Budget estimé" }] : []), { key: "project", label: "Description du projet", area: true }]} button={c.button_label || "Envoyer ma demande"} accent={`linear-gradient(90deg,${G},${G}cc)`} subject="Demande de devis" TEXT={TEXT} MUTED={MUTED} />
    case "booking_request": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} leadType="booking" title={c.title || "Réserver pour un événement"} description={c.description} fields={[{ key: "name", label: "Nom / Organisation" }, { key: "email", label: "Email" }, { key: "type", label: "Type d'événement" }, { key: "date", label: "Date souhaitée" }, { key: "message", label: "Message", area: true }]} button={c.button_label || "Envoyer ma demande"} accent="linear-gradient(90deg,#9146FF,#7B3FCC)" subject="Demande de réservation événement" TEXT={TEXT} MUTED={MUTED} />
    case "quick_contact": {
      const items = [[c.phone, "📞", "#39FF8F", telLink(c.phone) || null], [c.email, "✉️", "#38BDF8", c.email ? `mailto:${c.email}` : null], [c.whatsapp, "💬", "#25D366", waLink(c.whatsapp) || null], [c.address, "📍", G, null], [c.hours, "🕐", MUTED, null]].filter(([v]) => v)
      return items.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map(([value, icon, color, href]: any[], i: number) => {
              const inner = <><span style={{ fontSize: 19, flexShrink: 0 }}>{icon}</span><span style={{ color: TEXT, fontSize: 13, fontWeight: 600, flex: 1, fontFamily: FONT_B }}>{value}</span>{href && <ExternalLink size={12} color={color} style={{ flexShrink: 0 }} />}</>
              const st: any = { display: "flex", alignItems: "center", gap: 12, background: `${color}10`, border: `1px solid ${color}20`, borderRadius: 11, padding: "12px 15px", textDecoration: "none" }
              return href ? <a key={i} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, href)} style={st}>{inner}</a> : <div key={i} style={st}>{inner}</div>
            })}
          </div>
        </div>
      ) : null
    }
    case "multi_contact": {
      const contacts = [[c.c1_photo, c.c1_name, c.c1_role, c.c1_phone, c.c1_email], [c.c2_photo, c.c2_name, c.c2_role, c.c2_phone, c.c2_email], [c.c3_photo, c.c3_name, c.c3_role, c.c3_phone, c.c3_email]].filter(([, n]) => n)
      const accent = theme.accent || "#39FF8F"
      return contacts.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contacts.map(([photo, name, role, phone, email]: any[], i: number) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 13, padding: "13px 15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: (phone || email) ? 11 : 0 }}>
                  {photo ? <img src={String(photo)} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${G}40` }} /> : <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${G},${accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: "#080808", flexShrink: 0 }}>{String(name)[0]}</div>}
                  <div><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{name}</p>{role && <p style={{ color: G, fontSize: 11, margin: 0 }}>{role}</p>}</div>
                </div>
                {(phone || email) && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {phone && <a href={`tel:${phone}`} onClick={() => trackLinkClick(pageId, block.id, "tel")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(57,255,143,0.08)", border: "1px solid rgba(57,255,143,0.2)", borderRadius: 9, padding: "9px", color: "#39FF8F", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>📞 Appeler</a>}
                    {email && <a href={`mailto:${email}`} onClick={() => trackLinkClick(pageId, block.id, "email")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 9, padding: "9px", color: "#38BDF8", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>✉️ Email</a>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "service_area": {
      const cities = [c.city1, c.city2, c.city3, c.city4, c.city5, c.city6].filter(Boolean)
      return (c.area || cities.length > 0) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          {c.area && (
            <div style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 11, padding: "12px 15px", marginBottom: cities.length > 0 ? 11 : 0 }}>
              <span style={{ fontSize: 21 }}>📍</span>
              <div><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.area}</p>{c.radius && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{c.radius}</p>}</div>
            </div>
          )}
          {cities.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{cities.map((city: string, i: number) => <span key={i} style={{ background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 20, padding: "6px 13px", color: TEXT, fontSize: 13 }}>📍 {city}</span>)}</div>}
          {c.note && <p style={{ color: MUTED, fontSize: 12, margin: "11px 0 0", fontStyle: "italic" }}>{c.note}</p>}
        </div>
      ) : null
    }
    case "legal_info": {
      const rows = [["Société", c.company_name], ["SIRET", c.siret], ["N° TVA", c.tva], ["Siège social", c.address], ["Capital", c.capital], ["RCS", c.rcs], ["Email", c.email]].filter(([, v]) => v)
      return rows.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 13, overflow: "hidden" }}>
            {rows.map(([label, value]: any[], i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color: MUTED, fontSize: 12 }}>{label}</span>
                <span style={{ color: TEXT, fontSize: 12, fontWeight: 600, maxWidth: "55%", textAlign: "right" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "business_certifications": {
      const certs = [[c.c1_icon, c.c1_name, c.c1_org, c.c1_year], [c.c2_icon, c.c2_name, c.c2_org, c.c2_year], [c.c3_icon, c.c3_name, c.c3_org, c.c3_year], [c.c4_icon, c.c4_name, c.c4_org, c.c4_year]].filter(([, n]) => n)
      return certs.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {certs.map(([icon, name, org, year]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, background: `${G}06`, border: `1px solid ${G}15`, borderRadius: 12, padding: "11px 13px" }}>
                <span style={{ fontSize: 21 }}>{icon || "🏅"}</span>
                <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{name}</p><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{org}{year ? ` · ${year}` : ""}</p></div>
                <span style={{ color: G, fontSize: 15 }}>✓</span>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "on_site_services": {
      const svcs = [[c.s1_icon, c.s1_label], [c.s2_icon, c.s2_label], [c.s3_icon, c.s3_label], [c.s4_icon, c.s4_label], [c.s5_icon, c.s5_label], [c.s6_icon, c.s6_label], [c.s7_icon, c.s7_label], [c.s8_icon, c.s8_label]].filter(([, l]) => l)
      return svcs.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {svcs.map(([icon, label]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(66,133,244,0.06)", border: "1px solid rgba(66,133,244,0.15)", borderRadius: 11, padding: "11px 13px" }}>
                <span style={{ fontSize: 21, flexShrink: 0 }}>{icon}</span>
                <span style={{ color: TEXT, fontSize: 12, fontWeight: 600, fontFamily: FONT_B }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "google_maps_embed": return (c.embed_url || c.address) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        {c.label && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.label}</p>}
        {c.embed_url
          ? <iframe src={c.embed_url} width="100%" height={c.height === "lg" ? 240 : c.height === "sm" ? 140 : 190} style={{ border: "none", borderRadius: 13, display: "block" }} loading="lazy" />
          : <div style={{ height: 190, background: "rgba(66,133,244,0.06)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 13, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ fontSize: 34 }}>🗺️</span><p style={{ color: MUTED, fontSize: 12, margin: 0, textAlign: "center" }}>📍 {c.address}</p></div>}
        {c.show_directions !== "no" && c.address && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "directions")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 11, background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.25)", borderRadius: 10, padding: "12px", color: "#4285F4", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>🧭 Obtenir l&apos;itinéraire</a>}
      </div>
    ) : null
    case "company": return (c.company_name || c.logo_url) ? (
      <div style={{ padding: "8px 24px 12px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, padding: "12px 13px" }}>
          {c.logo_url ? <img src={c.logo_url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 44, height: 44, borderRadius: 10, background: `${G}15`, border: `1px solid ${G}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>🏢</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 1px", fontFamily: FONT_D }}>{c.company_name || "Mon Entreprise"}</p>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.sector}{c.founded_year ? ` · Depuis ${c.founded_year}` : ""}</p>
          </div>
        </div>
      </div>
    ) : null

    case "before_after": return (c.before_img || c.after_img) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        {c.title && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 11px", textAlign: "center", fontFamily: FONT_B }}>{c.title}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          <div style={{ borderRadius: 11, overflow: "hidden" }}>
            {c.before_img ? <img src={c.before_img} alt="Avant" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, background: "rgba(239,68,68,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📸</div>}
            <div style={{ background: "rgba(239,68,68,0.15)", padding: "7px", textAlign: "center" }}><p style={{ color: "#EF4444", fontSize: 12, fontWeight: 700, margin: 0 }}>{c.before_label || "Avant"}</p></div>
          </div>
          <div style={{ borderRadius: 11, overflow: "hidden" }}>
            {c.after_img ? <img src={c.after_img} alt="Après" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, background: "rgba(57,255,143,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>✨</div>}
            <div style={{ background: "rgba(57,255,143,0.15)", padding: "7px", textAlign: "center" }}><p style={{ color: "#39FF8F", fontSize: 12, fontWeight: 700, margin: 0 }}>{c.after_label || "Après"}</p></div>
          </div>
        </div>
        {c.description && <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: "9px 0 0" }}>{c.description}</p>}
      </div>
    ) : null
    case "brands": {
      const brandList = [[c.brand1_icon, c.brand1_name], [c.brand2_icon, c.brand2_name], [c.brand3_icon, c.brand3_name], [c.brand4_icon, c.brand4_name], [c.brand5_icon, c.brand5_name], [c.brand6_icon, c.brand6_name]].filter(([, n]) => n)
      return brandList.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {brandList.map(([icon, name]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 13px" }}>
                {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
                <span style={{ color: TEXT, fontSize: 12, fontWeight: 600, fontFamily: FONT_B }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "gift_card": return (c.title || c.amount1) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        <div style={{ background: "linear-gradient(135deg,#EC489915,#F472B610)", border: "1.5px solid rgba(236,72,153,0.3)", borderRadius: 15, padding: "17px" }}>
          <div style={{ textAlign: "center", marginBottom: 13 }}>
            <span style={{ fontSize: 34 }}>🎁</span>
            <p style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: "6px 0 3px", fontFamily: FONT_B }}>{c.title || "Offrez une expérience"}</p>
            {c.description && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{c.description}</p>}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: c.cta_label ? 13 : 0 }}>
            {[c.amount1, c.amount2, c.amount3].filter(Boolean).map((amount, i) => (
              <div key={i} style={{ background: i === 1 ? "rgba(236,72,153,0.2)" : "rgba(255,255,255,0.06)", border: `1.5px solid ${i === 1 ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 11, padding: "11px 16px", textAlign: "center" }}>
                <p style={{ color: i === 1 ? "#EC4899" : TEXT, fontSize: 17, fontWeight: 700, margin: 0 }}>{amount}</p>
              </div>
            ))}
          </div>
          {c.cta_label && <a href={c.cta_url || "#"} target={/^https?:/.test(c.cta_url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "giftcard")} style={{ display: "block", background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 11, padding: "12px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label}</a>}
        </div>
      </div>
    ) : null
    case "services_pricing": {
      const svcs = [[c.s1_name, c.s1_price, c.s1_duration, c.s1_desc], [c.s2_name, c.s2_price, c.s2_duration, c.s2_desc], [c.s3_name, c.s3_price, c.s3_duration, c.s3_desc], [c.s4_name, c.s4_price, c.s4_duration, c.s4_desc], [c.s5_name, c.s5_price, c.s5_duration, c.s5_desc]].filter(([n]) => n)
      return svcs.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div>
            {svcs.map(([name, price, duration, desc]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: i < svcs.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: "0 0 1px", fontFamily: FONT_B }}>{name}</p>{desc && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{desc}</p>}</div>
                <div style={{ textAlign: "right", flexShrink: 0 }}><p style={{ color: G, fontSize: 15, fontWeight: 700, margin: 0 }}>{price}</p>{duration && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{duration}</p>}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "external_shop": return (c.label || c.url) ? (
      <div style={{ padding: "6px 24px 14px" }}>
        {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 11px", textAlign: "center" }}>{c.description}</p>}
        <a href={c.url || "#"} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "shop")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: `${G}10`, border: `1.5px solid ${G}30`, borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 21 }}>🛒</span>
          <div><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label || "Voir la boutique"}</p>{c.platform && <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>via {c.platform}</p>}</div>
          <ExternalLink size={14} color={G} style={{ marginLeft: "auto" }} />
        </a>
      </div>
    ) : null
    case "advantages": {
      const advList = [c.adv1, c.adv2, c.adv3, c.adv4, c.adv5, c.adv6].filter(Boolean)
      return advList.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {advList.map((adv: string, i: number) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", background: "rgba(57,255,143,0.05)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 10 }}><p style={{ color: TEXT, fontSize: 13, margin: 0, fontFamily: FONT_B }}>{adv}</p></div>)}
          </div>
        </div>
      ) : null
    }
    case "reassurance": {
      const guarantees = [[c.g1_icon, c.g1_label, c.g1_desc], [c.g2_icon, c.g2_label, c.g2_desc], [c.g3_icon, c.g3_label, c.g3_desc], [c.g4_icon, c.g4_label, c.g4_desc]].filter(([, l]) => l)
      return guarantees.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {guarantees.map(([icon, label, desc]: any[], i: number) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "rgba(57,255,143,0.05)", border: "1px solid rgba(57,255,143,0.12)", borderRadius: 12, padding: "13px 9px", textAlign: "center" }}>
                <span style={{ fontSize: 26 }}>{icon || "✅"}</span>
                <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{label}</p>
                {desc && <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{desc}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "sales_counter": return c.count ? (
      <div style={{ padding: "10px 24px 14px" }}>
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 15, padding: "17px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, marginBottom: c.subtext ? 7 : 0 }}>
            <span style={{ fontSize: 30 }}>{c.emoji || "🔥"}</span>
            <div><p style={{ margin: 0, lineHeight: 1, fontFamily: FONT_D }}><span style={{ color: TEXT, fontSize: 30, fontWeight: 700 }}>{c.count}</span> <span style={{ color: "#EF4444", fontSize: 15, fontWeight: 700 }}>{c.label || "ventes"}</span></p>{c.period && <p style={{ color: MUTED, fontSize: 12, margin: "3px 0 0" }}>{c.period}</p>}</div>
          </div>
          {c.subtext && <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 600, margin: 0 }}>{c.subtext}</p>}
        </div>
      </div>
    ) : null
    case "popular_products": {
      const tops = [[c.p1_rank, c.p1_img, c.p1_name, c.p1_price, c.p1_sales, c.p1_url], [c.p2_rank, c.p2_img, c.p2_name, c.p2_price, c.p2_sales, c.p2_url], [c.p3_rank, null, c.p3_name, c.p3_price, c.p3_sales, c.p3_url]].filter(([, , n]) => n)
      return tops.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tops.map(([rank, img, name, price, sales, url]: any[], i: number) => {
              const inner = <>
                {rank && <span style={{ fontSize: 19, flexShrink: 0 }}>{String(rank).split(" ")[0]}</span>}
                {img ? <img src={String(img)} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 44, height: 44, background: `${G}10`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>🏆</div>}
                <div style={{ flex: 1, minWidth: 0 }}><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 1px", fontFamily: FONT_B }}>{name}</p>{sales && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{sales}</p>}</div>
                {price && <span style={{ color: G, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{price}</span>}
              </>
              const st: any = { display: "flex", alignItems: "center", gap: 11, background: i === 0 ? `${G}08` : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? `${G}20` : "rgba(255,255,255,0.07)"}`, borderRadius: 11, padding: "11px 13px", textDecoration: "none" }
              return url ? <a key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={st}>{inner}</a> : <div key={i} style={st}>{inner}</div>
            })}
          </div>
        </div>
      ) : null
    }
    case "scan_counter": return null
    case "engagements": {
      const engList = [c.e1, c.e2, c.e3, c.e4, c.e5, c.e6].filter(Boolean)
      return engList.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {engList.map((eng: string, i: number) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", background: "rgba(57,255,143,0.05)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 11 }}><p style={{ color: TEXT, fontSize: 13, margin: 0, lineHeight: 1.4, fontFamily: FONT_B }}>{eng}</p></div>)}
          </div>
        </div>
      ) : null
    }
    case "announcement": {
      const typeStyles: Record<string, any> = {
        warning: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.3)", color: "#FBBF24" },
        info: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.3)", color: "#38BDF8" },
        success: { bg: "rgba(57,255,143,0.08)", border: "rgba(57,255,143,0.3)", color: "#39FF8F" },
        promo: { bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.3)", color: "#C9A84C" },
      }
      const ts = typeStyles[c.type || "warning"]
      return (c.title || c.message) ? (
        <div style={{ padding: "8px 24px" }}>
          <div style={{ background: ts.bg, border: `1.5px solid ${ts.border}`, borderRadius: 13, padding: "15px 17px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
              <span style={{ fontSize: 23, flexShrink: 0 }}>{c.emoji || "⚠️"}</span>
              <div>{c.title && <p style={{ color: ts.color, fontSize: 14, fontWeight: 700, margin: "0 0 4px", fontFamily: FONT_B }}>{c.title}</p>}{c.message && <p style={{ color: TEXT, fontSize: 13, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.message}</p>}</div>
            </div>
          </div>
        </div>
      ) : null
    }
    case "info_table": {
      const rows = [[c.r1_label, c.r1_value], [c.r2_label, c.r2_value], [c.r3_label, c.r3_value], [c.r4_label, c.r4_value], [c.r5_label, c.r5_value], [c.r6_label, c.r6_value]].filter(([l]) => l)
      return rows.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          <div>
            {rows.map(([label, value]: any[], i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <span style={{ color: MUTED, fontSize: 13 }}>{label}</span>
                <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, fontFamily: FONT_B }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "founder_message": {
      const accent = theme.accent || "#39FF8F"
      return (c.message || c.name) ? (
        <div style={{ padding: "12px 24px 14px" }}>
          <div style={{ background: `${G}06`, border: `1px solid ${G}15`, borderRadius: 15, padding: "17px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 13 }}>
              {c.photo ? <img src={c.photo} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${G}40` }} /> : <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg,${G},${accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23, flexShrink: 0 }}>👤</div>}
              <div><p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_D }}>{c.name || "Jean Dupont"}</p><p style={{ color: G, fontSize: 12, margin: 0 }}>{c.role || "Fondateur & CEO"}</p></div>
            </div>
            <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: c.signature ? "0 0 11px" : "0", fontStyle: "italic" }}>&quot;{c.message}&quot;</p>
            {c.signature && <p style={{ color: G, fontSize: 15, fontFamily: "Georgia, serif", margin: 0, fontStyle: "italic" }}>{c.signature}</p>}
          </div>
        </div>
      ) : null
    }
    case "spotify_embed": {
      const embedType = c.type || "track"
      const spotifyId = c.url ? (String(c.url).match(new RegExp(`spotify\\.com/${embedType}/([a-zA-Z0-9]+)`))?.[1] || null) : null
      const height = c.size === "lg" ? 352 : c.size === "sm" ? 80 : 152
      return spotifyId ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <iframe src={`https://open.spotify.com/embed/${embedType}/${spotifyId}?utm_source=generator&theme=0`} width="100%" height={height} style={{ borderRadius: 13, border: "none", display: "block" }} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
        </div>
      ) : null
    }
    case "latest_release": {
      const platforms = [[c.spotify_url, "🎧 Spotify", "#1DB954", "#000"], [c.apple_url, "🍎 Apple", "#FC3C44", "#fff"], [c.youtube_url, "▶ YT", "#FF0000", "#fff"]].filter(([u]) => u)
      return (c.title || c.cover || platforms.length > 0) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ background: "linear-gradient(135deg,rgba(29,185,84,0.12),rgba(29,185,84,0.06))", border: "1.5px solid rgba(29,185,84,0.3)", borderRadius: 16, overflow: "hidden" }}>
            {c.badge && <div style={{ background: "rgba(29,185,84,0.2)", padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#1DB954", textAlign: "center" }}>{c.badge}</div>}
            <div style={{ display: "flex", gap: 14, padding: "15px" }}>
              {c.cover ? <img src={c.cover} alt="" style={{ width: 84, height: 84, borderRadius: 11, objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }} /> : <div style={{ width: 84, height: 84, borderRadius: 11, background: "rgba(29,185,84,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, flexShrink: 0 }}>🎵</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: TEXT, fontSize: 17, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_D }}>{c.title || "Nouveau titre"}</p>
                {c.artist && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 4px" }}>{c.artist}</p>}
                {c.release_date && <p style={{ color: "#1DB954", fontSize: 12, margin: "0 0 10px", fontWeight: 600 }}>📅 {c.release_date}</p>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {platforms.map(([url, label, bg]: any[], i: number) => <a key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ background: `${bg}22`, border: `1px solid ${bg}44`, borderRadius: 7, padding: "5px 11px", fontSize: 11, fontWeight: 700, color: bg, textDecoration: "none" }}>{label}</a>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null
    }
    case "discography": {
      const albums = [[c.a1_cover, c.a1_title, c.a1_year, c.a1_type, c.a1_url], [c.a2_cover, c.a2_title, c.a2_year, c.a2_type, c.a2_url], [c.a3_cover, c.a3_title, c.a3_year, c.a3_type, c.a3_url]].filter(([, t]) => t)
      return albums.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {albums.map(([cover, title, year, type, url]: any[], i: number) => {
              const inner = <>
                {cover ? <img src={String(cover)} alt="" style={{ width: 54, height: 54, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 54, height: 54, borderRadius: 9, background: "rgba(29,185,84,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 25, flexShrink: 0 }}>💿</div>}
                <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_B }}>{title}</p><div style={{ display: "flex", alignItems: "center", gap: 7 }}>{type && <span style={{ background: "rgba(29,185,84,0.12)", border: "1px solid rgba(29,185,84,0.2)", borderRadius: 10, padding: "1px 8px", color: "#1DB954", fontSize: 10, fontWeight: 700 }}>{type}</span>}{year && <span style={{ color: MUTED, fontSize: 12 }}>{year}</span>}</div></div>
                <span style={{ color: "#1DB954", fontSize: 19 }}>▶</span>
              </>
              const st: any = { display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }
              return url ? <a key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={st}>{inner}</a> : <div key={i} style={st}>{inner}</div>
            })}
          </div>
        </div>
      ) : null
    }
    case "album_block": {
      const platforms = [[c.spotify_url, "🎧 Spotify", "#1DB954"], [c.apple_url, "🍎 Apple", "#FC3C44"], [c.deezer_url, "🎶 Deezer", "#A238FF"]].filter(([u]) => u)
      return (c.title || c.cover) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ background: "rgba(29,185,84,0.06)", border: "1px solid rgba(29,185,84,0.2)", borderRadius: 15, overflow: "hidden" }}>
            {c.cover ? <img src={c.cover} alt="" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, background: "rgba(29,185,84,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>💿</div>}
            <div style={{ padding: "15px" }}>
              <p style={{ color: TEXT, fontSize: 19, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_D }}>{c.title || "Mon Album"}</p>
              {c.artist && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 3px" }}>{c.artist}</p>}
              <div style={{ display: "flex", gap: 10, marginBottom: c.description ? 11 : 13 }}>{c.year && <span style={{ color: "#1DB954", fontSize: 12, fontWeight: 600 }}>{c.year}</span>}{c.tracks && <span style={{ color: MUTED, fontSize: 12 }}>· {c.tracks}</span>}</div>
              {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 13px", lineHeight: 1.6 }}>{c.description}</p>}
              {platforms.length > 0 && <div style={{ display: "flex", gap: 8 }}>{platforms.map(([url, label, color]: any[], i: number) => <a key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ flex: 1, background: `${color}18`, border: `1px solid ${color}33`, borderRadius: 9, padding: "9px", textAlign: "center", fontSize: 12, fontWeight: 700, color, textDecoration: "none" }}>{label}</a>)}</div>}
            </div>
          </div>
        </div>
      ) : null
    }
    case "playlist_block": {
      const platforms = [[c.spotify_url, "🎧 Spotify", "#1DB954"], [c.apple_url, "🍎 Apple", "#FC3C44"], [c.deezer_url, "🎶 Deezer", "#A238FF"]].filter(([u]) => u)
      return (c.title || platforms.length > 0) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ display: "flex", gap: 13, alignItems: "center", marginBottom: 13 }}>
            {c.cover ? <img src={c.cover} alt="" style={{ width: 62, height: 62, borderRadius: 11, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 62, height: 62, borderRadius: 11, background: "rgba(29,185,84,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 29, flexShrink: 0 }}>📋</div>}
            <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_B }}>{c.title || "Ma Playlist"}</p>{c.description && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 3px" }}>{c.description}</p>}{c.tracks_count && <p style={{ color: "#1DB954", fontSize: 12, margin: 0, fontWeight: 600 }}>🎵 {c.tracks_count}</p>}</div>
          </div>
          {platforms.length > 0 && <div style={{ display: "flex", gap: 8 }}>{platforms.map(([url, label, color]: any[], i: number) => <a key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ flex: 1, background: `${color}18`, border: `1px solid ${color}33`, borderRadius: 9, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color, textDecoration: "none" }}>{label}</a>)}</div>}
        </div>
      ) : null
    }
    case "concerts": {
      const shows = [[c.c1_date, c.c1_city, c.c1_venue, c.c1_url], [c.c2_date, c.c2_city, c.c2_venue, c.c2_url], [c.c3_date, c.c3_city, c.c3_venue, c.c3_url], [c.c4_date, c.c4_city, c.c4_venue, c.c4_url]].filter(([, city]) => city)
      return shows.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {shows.map(([date, city, venue, url]: any[], i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(145,70,255,0.06)", border: "1px solid rgba(145,70,255,0.2)", borderRadius: 13, padding: "12px 15px" }}>
                <div style={{ textAlign: "center", flexShrink: 0, minWidth: 48 }}><p style={{ color: "#9146FF", fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{date}</p></div>
                <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{city}</p>{venue && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>🎭 {venue}</p>}</div>
                {url && <a href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ background: "#9146FF", borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, textDecoration: "none" }}>Billets →</a>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "ticketing": return (c.event_name || c.url) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        <div style={{ background: "rgba(145,70,255,0.08)", border: "1.5px solid rgba(145,70,255,0.3)", borderRadius: 15, padding: "17px" }}>
          <div style={{ display: "flex", gap: 13, alignItems: "flex-start", marginBottom: 15 }}>
            <span style={{ fontSize: 34, flexShrink: 0 }}>🎟️</span>
            <div><p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_B }}>{c.event_name || "Mon Concert"}</p>{c.date && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 2px" }}>📅 {c.date}</p>}{c.venue && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 2px" }}>📍 {c.venue}</p>}{c.price && <p style={{ color: "#9146FF", fontSize: 13, fontWeight: 700, margin: 0 }}>💶 {c.price}</p>}</div>
          </div>
          <a href={c.url || "#"} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "ticket")} style={{ display: "block", background: "#9146FF", borderRadius: 11, padding: "13px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: FONT_B }}>{c.label || "Acheter mes billets"}{c.platform && c.platform !== "URL personnalisée" ? ` — ${c.platform}` : ""}</a>
        </div>
      </div>
    ) : null
    case "presave": {
      const platforms = [[c.spotify_url, "💾 Pré-save Spotify", "#1DB954", "#000"], [c.apple_url, "🍎 Apple Music", "#FC3C44", "#fff"]].filter(([u]) => u)
      return (c.release_name || platforms.length > 0) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ background: "linear-gradient(135deg,rgba(29,185,84,0.1),rgba(29,185,84,0.05))", border: "1.5px solid rgba(29,185,84,0.3)", borderRadius: 16, padding: "17px", textAlign: "center" }}>
            {c.cover ? <img src={c.cover} alt="" style={{ width: 110, height: 110, borderRadius: 13, objectFit: "cover", margin: "0 auto 13px", display: "block", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }} /> : <div style={{ width: 110, height: 110, borderRadius: 13, background: "rgba(29,185,84,0.15)", margin: "0 auto 13px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>💾</div>}
            <p style={{ color: TEXT, fontSize: 17, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_D }}>{c.release_name || "Mon prochain titre"}</p>
            {c.release_date && <p style={{ color: "#1DB954", fontSize: 13, fontWeight: 600, margin: "0 0 15px" }}>📅 Sortie le {c.release_date}</p>}
            {platforms.length > 0 && <div style={{ display: "flex", gap: 8 }}>{platforms.map(([url, label, bg, fg]: any[], i: number) => <a key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ flex: 1, background: bg, borderRadius: 10, padding: "12px", fontSize: 12, fontWeight: 700, color: fg, textDecoration: "none" }}>{label}</a>)}</div>}
          </div>
        </div>
      ) : null
    }
    case "merch": {
      const products = [[c.img1, c.name1, c.price1], [c.img2, c.name2, c.price2], [c.img3, c.name3, c.price3]].filter(([, n]) => n)
      return products.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          {c.description && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 12px" }}>{c.description}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginBottom: c.cta_label ? 13 : 0 }}>
            {products.map(([img, name, price]: any[], i: number) => (
              <div key={i} style={{ background: "rgba(145,70,255,0.06)", border: "1px solid rgba(145,70,255,0.15)", borderRadius: 11, overflow: "hidden" }}>
                {img ? <img src={String(img)} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} /> : <div style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>👕</div>}
                <div style={{ padding: "7px 9px" }}><p style={{ color: TEXT, fontSize: 11, fontWeight: 700, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FONT_B }}>{name}</p><p style={{ color: "#9146FF", fontSize: 12, fontWeight: 700, margin: 0 }}>{price}</p></div>
              </div>
            ))}
          </div>
          {c.cta_label && <a href={c.cta_url || "#"} target={/^https?:/.test(c.cta_url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "merch")} style={{ display: "block", background: "linear-gradient(90deg,#9146FF,#7B3FCC)", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label}</a>}
        </div>
      ) : null
    }
    case "hero_banner": {
      const accent = theme.accent || "#39FF8F"
      const h = c.height === "lg" ? 280 : c.height === "sm" ? 170 : 220
      const align = c.align === "left" ? "flex-start" : "center"
      const ta: any = c.align === "left" ? "left" : "center"
      return (c.title || c.bg_image) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 14 }}>
            {c.bg_image ? <img src={c.bg_image} alt="" style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: h, background: c.bg_color ? c.bg_color : `linear-gradient(135deg,${G}30,${accent}15,#080808)` }} />}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 20%,rgba(0,0,0,0.7) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: align, justifyContent: "flex-end", padding: "22px" }}>
              {c.title && <h2 style={{ color: "#fff", fontSize: c.height === "lg" ? 28 : 22, fontWeight: 700, margin: "0 0 6px", fontFamily: FONT_D, textAlign: ta, textShadow: "0 2px 10px rgba(0,0,0,0.5)", lineHeight: 1.2 }}>{c.title}</h2>}
              {c.subtitle && <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, margin: "0 0 15px", textAlign: ta }}>{c.subtitle}</p>}
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start" }}>
                {c.cta_label && <a href={c.cta_url || "#"} target={/^https?:/.test(c.cta_url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || "hero")} style={{ background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 700, color: "#080808", textDecoration: "none" }}>{c.cta_label}</a>}
                {c.cta2_label && <a href={c.cta2_url || "#"} target={/^https?:/.test(c.cta2_url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta2_url || "hero2")} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none" }}>{c.cta2_label}</a>}
              </div>
            </div>
          </div>
        </div>
      ) : null
    }
    case "section_banner": {
      const col = c.color || G
      const t = c.title || "SECTION"
      const style = c.style || "lines"
      return (
        <div style={{ padding: "12px 24px" }}>
          {style === "lines" && <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${col}60)` }} /><span style={{ color: col, fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", whiteSpace: "nowrap" }}>{t}</span><div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${col}60,transparent)` }} /></div>}
          {style === "dots" && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}><div style={{ display: "flex", gap: 3 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: col }} />)}</div><span style={{ color: col, fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>{t}</span><div style={{ display: "flex", gap: 3 }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: col }} />)}</div></div>}
          {style === "gradient" && <div style={{ background: `linear-gradient(90deg,${col}15,${col}08)`, borderRadius: 9, padding: "11px 16px", textAlign: "center" }}><span style={{ color: col, fontSize: 14, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{t}</span></div>}
          {style === "minimal" && <p style={{ color: col, fontSize: 14, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", textAlign: "center", margin: 0 }}>{t}</p>}
          {style === "badge" && <div style={{ textAlign: "center" }}><span style={{ background: `${col}18`, border: `1px solid ${col}35`, borderRadius: 20, padding: "7px 19px", color: col, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{t}</span></div>}
        </div>
      )
    }
    case "grid_section": {
      const cols = parseInt(c.columns || "3")
      const cards = [[c.c1_icon, c.c1_title, c.c1_text], [c.c2_icon, c.c2_title, c.c2_text], [c.c3_icon, c.c3_title, c.c3_text], [c.c4_icon, c.c4_title, c.c4_text], [c.c5_icon, c.c5_title, c.c5_text], [c.c6_icon, c.c6_title, c.c6_text]].filter(([, t]) => t)
      return cards.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 9 }}>
            {cards.map(([icon, title, txt]: any[], i: number) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "13px 10px", textAlign: "center" }}>
                {icon && <span style={{ fontSize: 24, display: "block", marginBottom: 7 }}>{icon}</span>}
                <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_B }}>{title}</p>
                {txt && <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{txt}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "section_block": return (c.title || c.subtitle) ? (
      <div style={{ padding: "10px 24px" }}>
        <div style={{ background: c.bg_style === "card" ? "rgba(255,255,255,0.03)" : c.bg_style === "highlight" ? `${G}08` : "transparent", border: c.bg_style === "card" ? "1px solid rgba(255,255,255,0.07)" : c.bg_style === "highlight" ? `1px solid ${G}20` : "none", borderRadius: c.bg_style !== "transparent" ? 13 : 0, padding: c.bg_style && c.bg_style !== "transparent" ? "15px" : "0" }}>
          {c.title && <p style={{ color: G, fontSize: 16, fontWeight: 700, margin: "0 0 3px", fontFamily: FONT_D }}>{c.title}</p>}
          {c.subtitle && <p style={{ color: MUTED, fontSize: 13, margin: c.show_divider !== "no" ? "0 0 11px" : "0" }}>{c.subtitle}</p>}
          {c.show_divider !== "no" && <div style={{ height: 1, background: `linear-gradient(90deg,${G}50,transparent)`, marginTop: c.title && !c.subtitle ? 8 : 0 }} />}
        </div>
      </div>
    ) : null
    case "embed_block": return c.url ? (
      <div style={{ padding: "10px 24px 14px" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 11, margin: "0 0 9px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: FONT_B }}>{c.title}</p>}
        <iframe src={c.url} width="100%" height={parseInt(c.height || "400")} style={{ border: "none", borderRadius: 13, display: "block" }} loading="lazy" />
      </div>
    ) : null
    case "qr_code_block": return null

    default: return null
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PublicPageClient({ page, blocks }: { page: Page; blocks: Block[] }) {
  const theme = {
    bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F",
    text: "#F5F0E8", muted: "#8A8478",
    fontDisplay: "Cormorant Garamond, serif", fontBody: "DM Sans, sans-serif",
    ...(page.theme || {}),
  }

  const [scrollY, setScrollY] = useState(0)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)

  // Load Google Fonts
  useEffect(() => {
    const fonts = [theme.fontDisplay, theme.fontBody].filter(Boolean)
      .map((f: string) => f.replace(/,.*/, "").trim().replace(/ /g, "+"))
      .join("&family=")
    if (fonts) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = `https://fonts.googleapis.com/css2?family=${fonts}:wght@400;600;700&display=swap`
      document.head.appendChild(link)
    }
  }, [])

  // Scroll handler
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setScrollY(y)
      setHeaderVisible(y < lastScrollY.current || y < 50)
      lastScrollY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: theme.bgGradient || theme.bg, fontFamily: theme.fontBody }}>
      <style>{`
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes profilePulse { 0%,100% { box-shadow: 0 0 0 0 ${theme.primary}30; } 50% { box-shadow: 0 0 0 12px ${theme.primary}00; } }
        * { -webkit-tap-highlight-color: transparent; }
        a:active { opacity: 0.75; }
        @media (max-width: 640px) {
          .qf-hide-mobile { display: none !important; }
          .qf-gm-1 { grid-template-columns: 1fr !important; }
          .qf-gm-2 { grid-template-columns: 1fr 1fr !important; }
          .qf-gm-3 { grid-template-columns: 1fr 1fr 1fr !important; }
          .qf-cm-1 { column-count: 1 !important; }
          .qf-cm-2 { column-count: 2 !important; }
          .qf-cm-3 { column-count: 3 !important; }
        }
        @media (min-width: 641px) { .qf-hide-desktop { display: none !important; } }
      `}</style>

      {/* Container — fond complet selon bgMode (mesh/radial/pattern/image/gradient/solid) pour matcher l'éditeur */}
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", ...themeBackgroundStyle(theme as any), boxShadow: "0 0 80px rgba(0,0,0,0.6)", position: "relative" }}>

        {/* Blocks with staggered animation */}
        {blocks.map((block, idx) => {
          const hideCls = [block.content?.hide_mobile === "yes" ? "qf-hide-mobile" : "", block.content?.hide_desktop === "yes" ? "qf-hide-desktop" : ""].filter(Boolean).join(" ")
          return (
            <AnimatedBlock key={block.id} delay={idx < 3 ? idx * 80 : 0}>
              <div className={hideCls || undefined}>
                <RenderBlock block={block} theme={theme} pageId={page.id} ownerEmail={page.profiles?.contact_email || page.profiles?.email} />
              </div>
            </AnimatedBlock>
          )
        })}

        {/* Footer branding */}
        <div style={{ padding: "20px 24px 32px", textAlign: "center", borderTop: `1px solid ${theme.primary}10`, marginTop: 8 }}>
          <a href="https://qrfolio.app" target="_blank" rel="noopener noreferrer"
            style={{ color: theme.muted, fontSize: 11, textDecoration: "none", opacity: 0.5, letterSpacing: 1, fontFamily: theme.fontBody }}>
            Cree avec QRfolio
          </a>
        </div>
      </div>
    </div>
  )
}
