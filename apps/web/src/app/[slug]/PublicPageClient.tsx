"use client"

import { useEffect, useState, useRef } from "react"
import { ExternalLink } from "lucide-react"
import { trackPageView } from "@/lib/trackPageView"
import { trackLinkClick } from "@/lib/trackLinkClick"
import { themeBackgroundStyle, avatarShapeStyle, avatarDecoStyle, avatarBgStyle, bannerBackgroundStyle } from "../dashboard/builder/types"

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
function CountdownTimer({ date, theme }: { date: string; theme: any }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    function update() {
      const diff = new Date(date).getTime() - Date.now()
      if (diff <= 0) return
      setTime({ d: Math.floor(diff / 86400000), h: Math.floor(diff / 3600000) % 24, m: Math.floor(diff / 60000) % 60, s: Math.floor(diff / 1000) % 60 })
    }
    update(); const t = setInterval(update, 1000); return () => clearInterval(t)
  }, [date])
  const G = theme.primary
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {[["d","Jours"],["h","Heures"],["m","Min"],["s","Sec"]].map(([k,l]) => (
        <div key={k} style={{ textAlign: "center", background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 12, padding: "12px 14px", minWidth: 56, transition: "transform 0.1s" }}>
          <p style={{ color: G, fontSize: 26, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay }}>{String((time as any)[k]).padStart(2,"0")}</p>
          <p style={{ color: theme.muted, fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{l}</p>
        </div>
      ))}
    </div>
  )
}

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
const SOCIAL_NETWORKS: Record<string, { icon: string; color: string; label: string }> = {
  instagram: { icon: "📸", color: "#E1306C", label: "Instagram" },
  facebook: { icon: "👥", color: "#1877F2", label: "Facebook" },
  tiktok: { icon: "🎵", color: "#ffffff", label: "TikTok" },
  linkedin: { icon: "💼", color: "#0A66C2", label: "LinkedIn" },
  twitter: { icon: "🐦", color: "#1DA1F2", label: "Twitter / X" },
  youtube: { icon: "▶️", color: "#FF0000", label: "YouTube" },
  snapchat: { icon: "👻", color: "#FFFC00", label: "Snapchat" },
  pinterest: { icon: "📌", color: "#E60023", label: "Pinterest" },
  whatsapp: { icon: "💬", color: "#25D366", label: "WhatsApp" },
  telegram: { icon: "✈️", color: "#26A5E4", label: "Telegram" },
  discord: { icon: "🎮", color: "#5865F2", label: "Discord" },
  github: { icon: "💻", color: "#ffffff", label: "GitHub" },
  website: { icon: "🌐", color: "#C9A84C", label: "Site web" },
  email: { icon: "✉️", color: "#39FF8F", label: "Email" },
  phone: { icon: "📞", color: "#4ADE80", label: "Téléphone" },
  spotify: { icon: "🎧", color: "#1DB954", label: "Spotify" },
}

// ── Render Block ─────────────────────────────────────────────────────────────
function RenderBlock({ block, theme, pageId }: { block: Block; theme: any; pageId: string }) {
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
            {c.badge.split(/[,\n]/).map((b: string) => b.trim()).filter(Boolean).slice(0, 5).map((b: string, i: number) => (
              <span key={i} style={{ background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 20, padding: "4px 14px", fontSize: 12, color: G, fontFamily: FONT_B }}>{b}</span>
            ))}
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
      const btnStyles: Record<string, React.CSSProperties> = {
        gold: { background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", border: "none", boxShadow: `0 4px 20px ${G}35` },
        neon: { background: `${theme.accent || "#39FF8F"}12`, border: `1.5px solid ${theme.accent || "#39FF8F"}`, color: theme.accent || "#39FF8F" },
        outline: { background: "transparent", border: `2px solid ${G}`, color: G },
        ghost: { background: "rgba(255,255,255,0.06)", color: TEXT, border: "1px solid rgba(255,255,255,0.1)" },
        red: { background: "rgba(239,68,68,0.12)", border: "1.5px solid #EF4444", color: "#EF4444" },
      }
      const s = btnStyles[c.style || "gold"]
      return (
        <div style={{ padding: "6px 24px 12px" }}>
          <a href={c.url || "#"} onClick={() => trackLinkClick(pageId, block.id, c.url || block.type)} style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, padding: "15px 24px", textDecoration: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", boxSizing: "border-box", fontFamily: FONT_B, transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${G}30` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = s.boxShadow as string || "none" }}>
            {c.icon && <span style={{ fontSize: 16 }}>{c.icon}</span>}{c.label || "Bouton"}
          </a>
        </div>
      )
    }

    case "social_links": {
      const active = Object.entries(SOCIAL_NETWORKS).filter(([key]) => c[key])
      return (
        <div style={{ padding: "6px 24px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
          {active.map(([key, n]) => (
            <a key={key} href={c[key]} onClick={() => trackLinkClick(pageId, block.id, c[key])} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 13, background: n.color + "10", border: `1px solid ${n.color}22`, borderRadius: 13, padding: "13px 16px", textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${n.color}20` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: n.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{n.icon}</div>
              <span style={{ color: TEXT, fontSize: 14, fontWeight: 600, flex: 1, fontFamily: FONT_B }}>{n.label}</span>
              <ExternalLink size={14} color={n.color} style={{ opacity: 0.7 }} />
            </a>
          ))}
        </div>
      )
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

    case "image": return c.src ? (
      <div style={{ overflow: "hidden" }}>
        <img src={c.src} alt={c.caption||""} style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block", borderRadius: c.rounded === "circle" ? "50%" : c.rounded === "rounded" ? 16 : 0, transition: "transform 0.3s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
        {c.caption && <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: "7px 24px", fontFamily: FONT_B }}>{c.caption}</p>}
      </div>
    ) : null

    case "gallery": {
      const imgs = [c.img1,c.img2,c.img3,c.img4,c.img5,c.img6].filter(Boolean)
      const cols = parseInt(c.columns || "3")
      return imgs.length > 0 ? (
        <div style={{ padding: "6px 24px 16px", display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 7 }}>
          {imgs.map((img: string, i: number) => (
            <div key={i} style={{ overflow: "hidden", borderRadius: 10, aspectRatio: "1" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
            </div>
          ))}
        </div>
      ) : null
    }

    case "video": return c.url ? (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 14, overflow: "hidden", boxShadow: `0 8px 30px rgba(0,0,0,0.4)` }}>
          <iframe src={c.url.replace("watch?v=","embed/").replace("youtu.be/","www.youtube.com/embed/")}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
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
        {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
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
      const plans = [[c.title1,c.price1,c.desc1],[c.title2,c.price2,c.desc2],[c.title3,c.price3,c.desc3]].filter(([t]) => t)
      return plans.length > 0 ? (
        <div style={{ padding: "6px 24px 16px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {plans.map(([t,p,d],i) => (
              <div key={i} style={{ flex: 1, minWidth: 90, background: i===1 ? `${G}10` : "rgba(255,255,255,0.03)", border: `1px solid ${i===1 ? G+"40" : "rgba(255,255,255,0.06)"}`, borderRadius: 13, padding: "16px 12px", textAlign: "center", transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                <p style={{ color: MUTED, fontSize: 10, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: 1, fontFamily: FONT_B }}>{t}</p>
                <p style={{ color: G, fontSize: 26, fontWeight: 700, margin: "0 0 4px", fontFamily: FONT_D }}>{p}</p>
                <p style={{ color: MUTED, fontSize: 11, margin: 0, fontFamily: FONT_B }}>{d}</p>
                {c.cta_label && <a href={c.cta_url||"#"} onClick={() => trackLinkClick(pageId, block.id, c.cta_url||block.type)} style={{ display: "block", background: `${G}12`, border: `1px solid ${G}25`, color: G, textDecoration: "none", borderRadius: 7, padding: "7px", marginTop: 8, fontSize: 11, fontWeight: 700, fontFamily: FONT_B }}>{c.cta_label}</a>}
              </div>
            ))}
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
            </div>
            {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 10px", lineHeight: 1.6, fontFamily: FONT_B }}>{c.description}</p>}
            {c.cta_label && <a href={c.cta_url||"#"} onClick={() => trackLinkClick(pageId, block.id, c.cta_url||block.type)} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", textAlign: "center", padding: "12px", borderRadius: 9, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.cta_label}</a>}
          </div>
        </div>
      </div>
    )

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

    case "countdown": return (
      <div style={{ padding: "16px 24px 20px", textAlign: "center" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 11, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: FONT_B }}>{c.title}</p>}
        <CountdownTimer date={c.date||"2025-12-31"} theme={theme} />
        {c.subtitle && <p style={{ color: MUTED, fontSize: 13, margin: "12px 0 0", lineHeight: 1.6, fontFamily: FONT_B }}>{c.subtitle}</p>}
      </div>
    )

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
      const h = c.height === "xl" ? 340 : c.height === "lg" ? 260 : c.height === "sm" ? 120 : 180
      const btype = c.banner_type || (c.src ? "image" : "gradient")
      const pos = c.text_position || "bottom-left"
      const bannerBg = bannerBackgroundStyle(c, G)
      const voile = c.overlay_gradient === "bottom" ? "linear-gradient(to top, rgba(0,0,0,0.55), transparent 65%)"
        : c.overlay_gradient === "full" ? "linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0.15))" : null
      const alignItems = pos === "center" ? "center" : "flex-end"
      const justifyContent = (pos === "bottom-center" || pos === "center") ? "center" : "flex-start"
      const textAlign: any = (pos === "bottom-center" || pos === "center") ? "center" : "left"
      return (
        <div style={{ position: "relative", overflow: "hidden" }}>
          {btype === "image"
            ? (c.src
              ? <img src={c.src} alt="" style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} />
              : <div style={{ width: "100%", height: h, background: `linear-gradient(135deg,${G}33,${theme.accent || "#39FF8F"}22)` }} />)
            : <div style={{ width: "100%", height: h, ...bannerBg }} />}
          {voile && <div style={{ position: "absolute", inset: 0, background: voile }} />}
          {c.overlay_color && <div style={{ position: "absolute", inset: 0, background: c.overlay_color, opacity: parseFloat(c.overlay_opacity || "0.3") }} />}
          {(c.cover_title || c.cover_subtitle) && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems, justifyContent, padding: "16px 22px", textAlign }}>
              {c.cover_title && <p style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: 0, textShadow: "0 2px 10px rgba(0,0,0,0.55)", fontFamily: FONT_D }}>{c.cover_title}</p>}
              {c.cover_subtitle && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, margin: "5px 0 0", textShadow: "0 1px 8px rgba(0,0,0,0.55)", fontFamily: FONT_B }}>{c.cover_subtitle}</p>}
            </div>
          )}
        </div>
      )
    }
    case "about": return (c.text || c.title) ? (
      <div style={{ padding: "10px 24px 16px", textAlign: (c.align as any) || "left" }}>
        {c.emoji && <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{c.emoji}</span>}
        {c.title && <p style={{ color: G, fontSize: 11, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: FONT_B }}>{c.title}</p>}
        <p style={{ color: TEXT, fontSize: 15, lineHeight: 1.75, margin: 0, fontFamily: FONT_B, whiteSpace: "pre-wrap" }}>{c.text}</p>
      </div>
    ) : null
    case "availability": {
      const scMap: Record<string, { color: string; bg: string; border: string; label: string }> = {
        available: { color: "#39FF8F", bg: "rgba(57,255,143,0.08)", border: "rgba(57,255,143,0.25)", label: "Disponible" },
        busy: { color: "#F97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", label: "En mission" },
        closed: { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", label: "Indisponible" },
      }
      const sc = scMap[c.status || "available"]
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

    case "call_button": return c.phone ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={`tel:${c.phone}`} onClick={() => trackLinkClick(pageId, block.id, "call")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(57,255,143,0.1)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>{c.icon || "📞"}</span>
          <span style={{ color: "#39FF8F", fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Appeler maintenant"}</span>
        </a>
      </div>
    ) : null
    case "whatsapp_button": { const num = (c.phone || "").replace(/\D/g, ""); return num ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={`https://wa.me/${num}${c.message ? `?text=${encodeURIComponent(c.message)}` : ""}`} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "whatsapp")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(37,211,102,0.12)", border: "1.5px solid rgba(37,211,102,0.35)", borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>💬</span>
          <span style={{ color: "#25D366", fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Discuter sur WhatsApp"}</span>
        </a>
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
    case "payment_button": return c.url ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "payment")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 13, padding: "15px 18px", textDecoration: "none", color: "#080808", fontSize: 15, fontWeight: 800, fontFamily: FONT_B }}>
          💳 {c.label || "Payer maintenant"}
        </a>
      </div>
    ) : null
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
          {c.badge && <div style={{ background: G, color: "#080808", padding: "7px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" }}>{c.badge}</div>}
          {c.image
            ? <img src={c.image} alt="" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
            : <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(249,115,22,0.06)", fontSize: 48 }}>⭐</div>}
          <div style={{ padding: "16px" }}>
            <p style={{ color: TEXT, fontSize: 18, fontWeight: 700, margin: "0 0 6px", fontFamily: FONT_D }}>{c.name || "Mon produit phare"}</p>
            {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 12px", lineHeight: 1.5, fontFamily: FONT_B }}>{c.description}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: c.cta_label ? 14 : 0 }}>
              <span style={{ color: G, fontSize: 24, fontWeight: 700 }}>{c.price || "99€"}</span>
              {c.old_price && <span style={{ color: MUTED, fontSize: 15, textDecoration: "line-through" }}>{c.old_price}</span>}
              {c.old_price && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>Promo</span>}
            </div>
            {c.cta_label && <a href={c.cta_url || c.url || "#"} target={/^https?:/.test(c.cta_url || c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url || c.url || "product")} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 11, padding: "13px", textAlign: "center", fontSize: 14, fontWeight: 800, color: "#080808", textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label}</a>}
          </div>
        </div>
      </div>
    ) : null
    case "offer_comparison": {
      const plans = [{ name: c.plan1_name, price: c.plan1_price, features: c.plan1_features, hl: false }, { name: c.plan2_name, price: c.plan2_price, features: c.plan2_features, hl: c.plan2_highlight === "yes" }, { name: c.plan3_name, price: c.plan3_price, features: c.plan3_features, hl: false }].filter(p => p.name)
      return plans.length > 0 ? (
        <div style={{ padding: "16px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 14px", textAlign: "center", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            {plans.map((p, i) => (
              <div key={i} style={{ flex: 1, minWidth: 0, background: p.hl ? `${G}12` : "rgba(255,255,255,0.03)", border: `1.5px solid ${p.hl ? `${G}50` : "rgba(255,255,255,0.08)"}`, borderRadius: 13, padding: "14px 10px", position: "relative" }}>
                {p.hl && <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: G, color: "#080808", borderRadius: 20, padding: "2px 10px", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>⭐ Populaire</div>}
                <p style={{ color: p.hl ? G : TEXT, fontSize: 12, fontWeight: 700, margin: "0 0 5px", textAlign: "center", fontFamily: FONT_B }}>{p.name}</p>
                <p style={{ color: G, fontSize: 19, fontWeight: 700, margin: "0 0 9px", textAlign: "center", fontFamily: FONT_D }}>{p.price}</p>
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
                <div style={{ display: "flex", gap: 2 }}>{[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: "#FBBF24", fontSize: 11 }}>★</span>)}</div>
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
                  <p style={{ color: "#FBBF24", fontSize: 11, margin: 0 }}>{"★".repeat(parseInt(stars || "5"))}</p>
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
      `}</style>

      {/* Container — fond complet selon bgMode (mesh/radial/pattern/image/gradient/solid) pour matcher l'éditeur */}
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", ...themeBackgroundStyle(theme as any), boxShadow: "0 0 80px rgba(0,0,0,0.6)", position: "relative" }}>

        {/* Blocks with staggered animation */}
        {blocks.map((block, idx) => (
          <AnimatedBlock key={block.id} delay={idx < 3 ? idx * 80 : 0}>
            <RenderBlock block={block} theme={theme} pageId={page.id} />
          </AnimatedBlock>
        ))}

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
