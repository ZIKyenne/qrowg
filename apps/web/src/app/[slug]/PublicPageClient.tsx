"use client"

import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"

type Block = { id: string; type: string; content: Record<string, string>; position: number }
type Page = {
  id: string; title: string; slug: string; theme: any;
  total_views: number; profiles: any
}

const SOCIAL_NETWORKS: Record<string, { icon: string; color: string; bg: string }> = {
  instagram: { icon: "📸", color: "#E1306C", bg: "rgba(225,48,108,0.12)" },
  facebook:  { icon: "👥", color: "#1877F2", bg: "rgba(24,119,242,0.12)" },
  tiktok:    { icon: "🎵", color: "#F5F0E8", bg: "rgba(245,240,232,0.08)" },
  linkedin:  { icon: "💼", color: "#0A66C2", bg: "rgba(10,102,194,0.12)" },
  twitter:   { icon: "🐦", color: "#1DA1F2", bg: "rgba(29,161,242,0.12)" },
  youtube:   { icon: "▶️", color: "#FF0000", bg: "rgba(255,0,0,0.12)" },
  snapchat:  { icon: "👻", color: "#FFFC00", bg: "rgba(255,252,0,0.1)" },
  pinterest: { icon: "📌", color: "#E60023", bg: "rgba(230,0,35,0.12)" },
  whatsapp:  { icon: "💬", color: "#25D366", bg: "rgba(37,211,102,0.12)" },
  telegram:  { icon: "✈️", color: "#26A5E4", bg: "rgba(38,165,228,0.12)" },
  discord:   { icon: "🎮", color: "#5865F2", bg: "rgba(88,101,242,0.12)" },
  github:    { icon: "💻", color: "#F5F0E8", bg: "rgba(245,240,232,0.08)" },
  website:   { icon: "🌐", color: "#C9A84C", bg: "rgba(201,168,76,0.12)" },
  email:     { icon: "✉️", color: "#39FF8F", bg: "rgba(57,255,143,0.12)" },
  phone:     { icon: "📞", color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  spotify:   { icon: "🎧", color: "#1DB954", bg: "rgba(29,185,84,0.12)" },
}

// Countdown
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
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {[["d", "Jours"], ["h", "Heures"], ["m", "Min"], ["s", "Sec"]].map(([k, l]) => (
        <div key={k} style={{ textAlign: "center", background: `${theme.primary}15`, border: `1px solid ${theme.primary}30`, borderRadius: 12, padding: "12px 16px", minWidth: 56 }}>
          <p style={{ color: theme.primary, fontSize: 28, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay || "Cormorant Garamond, serif" }}>{String((time as any)[k]).padStart(2,"0")}</p>
          <p style={{ color: theme.muted, fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{l}</p>
        </div>
      ))}
    </div>
  )
}

// FAQ Item
function FAQItem({ q, a, theme }: { q: string; a: string; theme: any }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: `1px solid ${open ? theme.primary + "40" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, overflow: "hidden", marginBottom: 8, transition: "all 0.2s" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: open ? `${theme.primary}08` : "transparent", border: "none", color: theme.text, fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: theme.fontBody }}>
        {q}<span style={{ color: theme.primary, fontSize: 20, flexShrink: 0, marginLeft: 12 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "0 18px 16px", background: `${theme.primary}04` }}><p style={{ color: theme.muted, fontSize: 14, lineHeight: 1.7, margin: 0, fontFamily: theme.fontBody }}>{a}</p></div>}
    </div>
  )
}

// Render a single block
function RenderBlock({ block, theme }: { block: Block; theme: any }) {
  const c = block.content
  const G = theme.primary
  const MUTED = theme.muted
  const TEXT = theme.text
  const SURFACE = theme.surface
  const FONT_D = theme.fontDisplay || "Cormorant Garamond, serif"
  const FONT_B = theme.fontBody || "DM Sans, sans-serif"

  const style = { fontFamily: FONT_B }

  switch (block.type) {
    case "profile": return (
      <div style={{ ...style, textAlign: "center", padding: "28px 20px 20px" }}>
        {c.avatar
          ? <img src={c.avatar} alt="" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", margin: "0 auto 14px", display: "block", border: `3px solid ${G}60`, boxShadow: `0 0 30px ${G}30` }} />
          : <div style={{ width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg,${G},${theme.accent || "#39FF8F"})`, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 700, color: "#080808", boxShadow: `0 0 30px ${G}40` }}>{(c.name || "?")[0].toUpperCase()}</div>}
        <h1 style={{ color: TEXT, fontSize: 26, fontWeight: 700, margin: "0 0 6px", fontFamily: FONT_D }}>{c.name || "Mon Nom"}</h1>
        <p style={{ color: MUTED, fontSize: 15, margin: c.badge ? "0 0 10px" : "0" }}>{c.tagline}</p>
        {c.badge && <span style={{ background: `${G}15`, border: `1px solid ${G}35`, borderRadius: 20, padding: "4px 14px", fontSize: 13, color: G, display: "inline-block" }}>{c.badge}</span>}
      </div>
    )
    case "bio": return (
      <div style={{ ...style, padding: "6px 24px 16px", textAlign: (c.align as any) || "left" }}>
        <p style={{ color: TEXT, fontSize: 15, lineHeight: 1.75, margin: 0 }}>{c.text}</p>
      </div>
    )
    case "skills": {
      const tags = (c.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean)
      return (
        <div style={{ ...style, padding: "8px 24px 16px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.map((tag: string, i: number) => <span key={i} style={{ background: `${G}12`, border: `1px solid ${G}30`, borderRadius: 20, padding: "5px 14px", fontSize: 13, color: G, fontWeight: 600 }}>{tag}</span>)}
          </div>
        </div>
      )
    }
    case "cta_button": {
      const btnStyles: Record<string, React.CSSProperties> = {
        gold: { background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", border: "none", boxShadow: `0 4px 20px ${G}40` },
        neon: { background: `${theme.accent}15`, border: `1.5px solid ${theme.accent}`, color: theme.accent },
        outline: { background: "transparent", border: `2px solid ${G}`, color: G },
        ghost: { background: "rgba(255,255,255,0.08)", color: TEXT, border: `1px solid rgba(255,255,255,0.12)` },
        red: { background: "rgba(239,68,68,0.15)", border: "1.5px solid #EF4444", color: "#EF4444" },
      }
      const s = btnStyles[c.style || "gold"]
      return (
        <div style={{ ...style, padding: "8px 24px" }}>
          <a href={c.url || "#"} style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, padding: "16px 24px", textDecoration: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", width: c.full_width !== "no" ? "100%" : "auto", boxSizing: "border-box", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)" }}>
            {c.icon && <span>{c.icon}</span>}{c.label || "Bouton"}
          </a>
        </div>
      )
    }
    case "social_links": {
      const active = Object.entries(SOCIAL_NETWORKS).filter(([key]) => c[key])
      return (
        <div style={{ ...style, padding: "8px 24px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {active.map(([key, n]) => (
            <a key={key} href={c[key]} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 14, background: n.bg, border: `1px solid ${n.color}30`, borderRadius: 14, padding: "14px 18px", textDecoration: "none", transition: "transform 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: n.color + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{n.icon}</div>
              <span style={{ color: TEXT, fontSize: 15, fontWeight: 600, flex: 1 }}>
                {key === "email" ? "Email" : key === "phone" ? "Téléphone" : key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              <ExternalLink size={15} color={n.color} />
            </a>
          ))}
        </div>
      )
    }
    case "heading": {
      const sizes: Record<string, number> = { small: 18, medium: 26, large: 34, xl: 44 }
      const hColors: Record<string, string> = { default: TEXT, primary: G, accent: theme.accent || "#39FF8F", muted: MUTED }
      return (
        <div style={{ ...style, padding: "14px 24px", textAlign: (c.align as any) || "center" }}>
          <h2 style={{ fontFamily: FONT_D, fontSize: sizes[c.size || "medium"], color: hColors[c.color || "default"], fontWeight: 700, margin: "0 0 4px", lineHeight: 1.2 }}>{c.text || "Titre"}</h2>
          {c.subtitle && <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>{c.subtitle}</p>}
        </div>
      )
    }
    case "rich_text": {
      const tSizes: Record<string, number> = { small: 13, normal: 15, large: 17 }
      return <div style={{ ...style, padding: "6px 24px 14px", textAlign: (c.align as any) || "left" }}><p style={{ color: MUTED, fontSize: tSizes[c.size || "normal"], lineHeight: 1.75, margin: 0 }}>{c.text}</p></div>
    }
    case "faq": return (
      <div style={{ ...style, padding: "8px 24px 16px" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 14px" }}>{c.title}</p>}
        {[[c.q1,c.a1],[c.q2,c.a2],[c.q3,c.a3]].filter(([q]) => q).map(([q,a],i) => <FAQItem key={i} q={q!} a={a||""} theme={theme} />)}
      </div>
    )
    case "image": return (
      <div style={{ padding: c.src ? 0 : "8px 24px" }}>
        {c.src
          ? <div><img src={c.src} alt={c.caption||""} style={{ width:"100%", maxHeight:340, objectFit:"cover", display:"block", borderRadius: c.rounded==="circle" ? "50%" : c.rounded==="rounded" ? 16 : 0 }} />{c.caption && <p style={{ color:MUTED, fontSize:12, textAlign:"center", margin:"8px 24px", fontFamily:FONT_B }}>{c.caption}</p>}</div>
          : null}
      </div>
    )
    case "gallery": {
      const imgs = [c.img1,c.img2,c.img3,c.img4,c.img5,c.img6].filter(Boolean)
      const cols = parseInt(c.columns||"3")
      return imgs.length > 0 ? (
        <div style={{ padding:"8px 24px 16px", display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap:8 }}>
          {imgs.map((img,i) => <img key={i} src={img} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:10 }} />)}
        </div>
      ) : null
    }
    case "video": return c.url ? (
      <div style={{ padding:"8px 24px 16px" }}>
        <div style={{ position:"relative", paddingBottom:"56.25%", height:0, borderRadius:14, overflow:"hidden" }}>
          <iframe src={c.url.replace("watch?v=","embed/").replace("youtu.be/","www.youtube.com/embed/")}
            style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }} allowFullScreen />
        </div>
        {c.title && <p style={{ color:MUTED, fontSize:13, textAlign:"center", margin:"8px 0 0", fontFamily:FONT_B }}>{c.title}</p>}
      </div>
    ) : null
    case "contact_form": return (
      <div style={{ ...style, padding:"8px 24px 20px" }}>
        {c.title && <h3 style={{ color:TEXT, fontSize:18, fontWeight:700, margin:"0 0 16px", fontFamily:FONT_D }}>{c.title}</h3>}
        <form style={{ display:"flex", flexDirection:"column", gap:10 }} onSubmit={e => e.preventDefault()}>
          {["Nom","Email",...(c.show_phone==="yes"?["Téléphone"]:[])].map(f => (
            <input key={f} placeholder={f} style={{ background:`${SURFACE}80`, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, padding:"13px 16px", color:TEXT, fontSize:14, outline:"none", fontFamily:FONT_B, width:"100%", boxSizing:"border-box" }} />
          ))}
          <textarea placeholder="Message" rows={4} style={{ background:`${SURFACE}80`, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, padding:"13px 16px", color:TEXT, fontSize:14, outline:"none", fontFamily:FONT_B, resize:"vertical", width:"100%", boxSizing:"border-box" }} />
          <button type="submit" style={{ background:`linear-gradient(90deg,${G},${G}cc)`, border:"none", borderRadius:12, padding:"14px", color:"#080808", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT_B }}>{c.button_label||"Envoyer"}</button>
        </form>
      </div>
    )
    case "testimonials": {
      const reviews = [[c.name1,c.text1,c.stars1],[c.name2,c.text2,c.stars2],[c.name3,c.text3,c.stars3]].filter(([n]) => n)
      return reviews.length > 0 ? (
        <div style={{ ...style, padding:"8px 24px 16px", display:"flex", flexDirection:"column", gap:10 }}>
          {reviews.map(([n,t,s],i) => (
            <div key={i} style={{ background:`${G}06`, border:`1px solid ${G}15`, borderRadius:14, padding:"16px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <p style={{ color:TEXT, fontSize:14, fontWeight:700, margin:0 }}>{n}</p>
                <p style={{ color:"#FFD700", fontSize:14, margin:0 }}>{"★".repeat(parseInt(s||"5"))}</p>
              </div>
              <p style={{ color:MUTED, fontSize:13, margin:0, fontStyle:"italic", lineHeight:1.6 }}>"{t}"</p>
            </div>
          ))}
        </div>
      ) : null
    }
    case "google_maps": return (
      <div style={{ ...style, padding:"8px 24px 16px" }}>
        <a href={`https://maps.google.com/?q=${encodeURIComponent(c.address||"")}`} target="_blank" rel="noopener noreferrer"
          style={{ display:"flex", alignItems:"flex-start", gap:14, background:"rgba(255,230,109,0.06)", border:"1px solid rgba(255,230,109,0.15)", borderRadius:14, padding:"16px 18px", textDecoration:"none" }}>
          <span style={{ fontSize:28, flexShrink:0 }}>📍</span>
          <div style={{ flex:1 }}>
            <p style={{ color:TEXT, fontSize:14, fontWeight:700, margin:"0 0 3px", fontFamily:FONT_B }}>{c.label||"Adresse"}</p>
            <p style={{ color:MUTED, fontSize:13, margin:c.transport?"0 0 4px":"0", fontFamily:FONT_B }}>{c.address}</p>
            {c.transport && <p style={{ color:MUTED, fontSize:12, margin:0, fontFamily:FONT_B }}>🚇 {c.transport}</p>}
          </div>
          <ExternalLink size={16} color="rgba(255,230,109,0.6)" style={{ flexShrink:0, marginTop:2 }} />
        </a>
      </div>
    )
    case "opening_hours": return (
      <div style={{ ...style, padding:"8px 24px 16px" }}>
        {c.title && <p style={{ color:MUTED, fontSize:11, textTransform:"uppercase", letterSpacing:2, margin:"0 0 12px" }}>{c.title}</p>}
        <div style={{ background:`${SURFACE}60`, border:`1px solid rgba(255,255,255,0.06)`, borderRadius:14, overflow:"hidden" }}>
          {[["Lun — Ven",c.mon_fri],["Samedi",c.saturday],["Dimanche",c.sunday]].filter(([,h]) => h).map(([d,h],i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"12px 18px", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ color:MUTED, fontSize:14 }}>{d}</span>
              <span style={{ color:TEXT, fontSize:14, fontWeight:600 }}>{h}</span>
            </div>
          ))}
          {c.note && <div style={{ padding:"10px 18px", background:`${G}05` }}><p style={{ color:MUTED, fontSize:12, margin:0, fontStyle:"italic" }}>{c.note}</p></div>}
        </div>
      </div>
    )
    case "pricing": {
      const plans = [[c.title1,c.price1,c.desc1],[c.title2,c.price2,c.desc2],[c.title3,c.price3,c.desc3]].filter(([t]) => t)
      return plans.length > 0 ? (
        <div style={{ ...style, padding:"8px 24px 16px" }}>
          {c.title && <p style={{ color:MUTED, fontSize:11, textTransform:"uppercase", letterSpacing:2, margin:"0 0 14px" }}>{c.title}</p>}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {plans.map(([t,p,d],i) => (
              <div key={i} style={{ flex:1, minWidth:100, background: i===1 ? `${G}12` : `${SURFACE}80`, border:`1px solid ${i===1 ? G+"50" : "rgba(255,255,255,0.08)"}`, borderRadius:14, padding:"18px 14px", textAlign:"center" }}>
                <p style={{ color:MUTED, fontSize:11, margin:"0 0 6px", textTransform:"uppercase", letterSpacing:1 }}>{t}</p>
                <p style={{ color:G, fontSize:26, fontWeight:700, margin:"0 0 6px", fontFamily:FONT_D }}>{p}</p>
                <p style={{ color:MUTED, fontSize:12, margin:0 }}>{d}</p>
                {c.cta_label && <a href={c.cta_url||"#"} style={{ display:"block", background:`${G}15`, border:`1px solid ${G}30`, color:G, textDecoration:"none", borderRadius:8, padding:"8px", marginTop:10, fontSize:12, fontWeight:700 }}>{c.cta_label}</a>}
              </div>
            ))}
          </div>
        </div>
      ) : null
    }
    case "product": return (
      <div style={{ ...style, padding:"8px 24px 16px" }}>
        <div style={{ background:`${SURFACE}80`, border:`1px solid rgba(255,255,255,0.07)`, borderRadius:16, overflow:"hidden" }}>
          {c.image && <img src={c.image} alt={c.name||""} style={{ width:"100%", height:200, objectFit:"cover", display:"block" }} />}
          <div style={{ padding:"16px 18px" }}>
            <p style={{ color:TEXT, fontSize:17, fontWeight:700, margin:"0 0 6px", fontFamily:FONT_D }}>{c.name}</p>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ color:G, fontSize:20, fontWeight:700 }}>{c.price}</span>
              {c.old_price && <span style={{ color:MUTED, fontSize:14, textDecoration:"line-through" }}>{c.old_price}</span>}
            </div>
            {c.description && <p style={{ color:MUTED, fontSize:13, margin:"0 0 12px", lineHeight:1.6 }}>{c.description}</p>}
            {c.cta_label && <a href={c.cta_url||"#"} style={{ display:"block", background:`linear-gradient(90deg,${G},${G}cc)`, color:"#080808", textAlign:"center", padding:"13px", borderRadius:10, textDecoration:"none", fontSize:14, fontWeight:700 }}>{c.cta_label}</a>}
          </div>
        </div>
      </div>
    )
    case "promo_banner": return (
      <div style={{ ...style, padding:"8px 24px 16px" }}>
        <div style={{ background:"linear-gradient(135deg,rgba(249,115,22,0.15),rgba(249,115,22,0.08))", border:"1px solid rgba(249,115,22,0.3)", borderRadius:14, padding:"18px 20px", textAlign:"center" }}>
          {c.emoji && <span style={{ fontSize:32, display:"block", marginBottom:8 }}>{c.emoji}</span>}
          <p style={{ color:TEXT, fontSize:17, fontWeight:700, margin:"0 0 4px", fontFamily:FONT_D }}>{c.text}</p>
          {c.subtext && <p style={{ color:MUTED, fontSize:13, margin:"0 0 12px" }}>{c.subtext}</p>}
          {c.cta_label && <a href={c.cta_url||"#"} style={{ display:"inline-block", background:"#F97316", color:"#fff", padding:"10px 24px", borderRadius:10, textDecoration:"none", fontSize:14, fontWeight:700 }}>{c.cta_label}</a>}
        </div>
      </div>
    )
    case "menu_section": return (
      <div style={{ ...style, padding:"8px 24px 16px" }}>
        {c.category && <p style={{ color:G, fontSize:13, fontWeight:700, margin:"0 0 12px", textTransform:"uppercase", letterSpacing:1.5 }}>{c.category}</p>}
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {[[c.item1_name,c.item1_price,c.item1_desc],[c.item2_name,c.item2_price,c.item2_desc],[c.item3_name,c.item3_price,c.item3_desc]].filter(([n]) => n).map(([n,p,d],i,arr) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, padding:"12px 0", borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ flex:1 }}>
                <p style={{ color:TEXT, fontSize:15, fontWeight:600, margin:"0 0 2px" }}>{n}</p>
                {d && <p style={{ color:MUTED, fontSize:12, margin:0, lineHeight:1.5 }}>{d}</p>}
              </div>
              <span style={{ color:G, fontSize:15, fontWeight:700, flexShrink:0 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    )
    case "services_list": {
      const services = [[c.s1_icon,c.s1_name,c.s1_desc],[c.s2_icon,c.s2_name,c.s2_desc],[c.s3_icon,c.s3_name,c.s3_desc]].filter(([,n]) => n)
      return services.length > 0 ? (
        <div style={{ ...style, padding:"8px 24px 16px", display:"flex", flexDirection:"column", gap:10 }}>
          {c.title && <p style={{ color:MUTED, fontSize:11, textTransform:"uppercase", letterSpacing:2, margin:"0 0 4px" }}>{c.title}</p>}
          {services.map(([icon,name,desc],i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"rgba(139,92,246,0.07)", border:"1px solid rgba(139,92,246,0.15)", borderRadius:14 }}>
              <span style={{ fontSize:26 }}>{icon}</span>
              <div>
                <p style={{ color:TEXT, fontSize:14, fontWeight:700, margin:0 }}>{name}</p>
                {desc && <p style={{ color:MUTED, fontSize:12, margin:0, lineHeight:1.5 }}>{desc}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : null
    }
    case "countdown": return (
      <div style={{ ...style, padding:"16px 24px 20px", textAlign:"center" }}>
        {c.title && <p style={{ color:MUTED, fontSize:12, margin:"0 0 16px", textTransform:"uppercase", letterSpacing:1.5 }}>{c.title}</p>}
        <CountdownTimer date={c.date||"2025-12-31"} theme={theme} />
        {c.subtitle && <p style={{ color:MUTED, fontSize:13, margin:"14px 0 0", lineHeight:1.6 }}>{c.subtitle}</p>}
      </div>
    )
    case "event_info": return (
      <div style={{ ...style, padding:"8px 24px 16px" }}>
        <div style={{ background:"rgba(236,72,153,0.08)", border:"1px solid rgba(236,72,153,0.2)", borderRadius:16, padding:"20px 20px" }}>
          <p style={{ color:TEXT, fontSize:20, fontWeight:700, margin:"0 0 14px", fontFamily:FONT_D }}>{c.name}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:c.cta_label?"14px":"0" }}>
            {[["📅",c.date],["🕐",c.time],["📍",c.location],["🎟️",c.price]].filter(([,v]) => v).map(([icon,val]) => (
              <p key={String(icon)} style={{ color:MUTED, fontSize:14, margin:0 }}>{icon} {val}</p>
            ))}
          </div>
          {c.cta_label && <a href={c.cta_url||"#"} style={{ display:"block", background:"#EC4899", color:"#fff", textAlign:"center", padding:"13px", borderRadius:10, textDecoration:"none", fontSize:14, fontWeight:700 }}>{c.cta_label}</a>}
        </div>
      </div>
    )
    case "spotify_player": return (
      <div style={{ ...style, padding:"8px 24px 16px" }}>
        <div style={{ background:"rgba(29,185,84,0.08)", border:"1px solid rgba(29,185,84,0.2)", borderRadius:14, padding:"18px 20px", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, background:"#1DB954", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>🎧</div>
          <div style={{ flex:1 }}>
            <p style={{ color:TEXT, fontSize:14, fontWeight:700, margin:"0 0 2px", fontFamily:FONT_B }}>{c.title||"Ma musique"}</p>
            <p style={{ color:MUTED, fontSize:12, margin:0 }}>Écouter sur Spotify</p>
          </div>
          {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ background:"#1DB954", color:"#000", padding:"8px 16px", borderRadius:20, textDecoration:"none", fontSize:13, fontWeight:700, flexShrink:0 }}>▶ Play</a>}
        </div>
      </div>
    )
    case "music_links": {
      const platforms = [["spotify","🎵","#1DB954","Spotify"],["apple_music","🍎","#FC3C44","Apple Music"],["deezer","🎶","#A238FF","Deezer"],["youtube_music","▶️","#FF0000","YouTube Music"],["soundcloud","☁️","#FF5500","SoundCloud"]].filter(([k]) => c[k as string])
      return platforms.length > 0 ? (
        <div style={{ ...style, padding:"8px 24px 16px" }}>
          {c.artist_name && <p style={{ color:TEXT, fontSize:16, fontWeight:700, margin:"0 0 14px", textAlign:"center", fontFamily:FONT_D }}>{c.artist_name}</p>}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {platforms.map(([k,icon,color,label]) => (
              <a key={k} href={(c as any)[k as string]} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", gap:14, background:(color as string)+"12", border:`1px solid ${color}30`, borderRadius:12, padding:"13px 16px", textDecoration:"none" }}>
                <span style={{ fontSize:20 }}>{icon}</span>
                <span style={{ color:TEXT, fontSize:14, fontWeight:600, flex:1, fontFamily:FONT_B }}>{label}</span>
                <ExternalLink size={14} color={color as string} />
              </a>
            ))}
          </div>
        </div>
      ) : null
    }
    case "visit_counter": return (
      <div style={{ ...style, padding:"14px 24px 18px", textAlign:"center" }}>
        <p style={{ fontFamily:FONT_D, fontSize:44, color:G, fontWeight:700, margin:"0 0 4px" }}>1 234</p>
        <p style={{ color:MUTED, fontSize:13, margin:0 }}>{c.label||"visiteurs"}</p>
      </div>
    )
    case "divider": {
      const dvStyles: Record<string, React.ReactNode> = {
        gold: <div style={{ height:1, background:`linear-gradient(90deg,transparent,${G}60,transparent)` }} />,
        line: <div style={{ height:1, background:"rgba(255,255,255,0.08)" }} />,
        dots: <div style={{ textAlign:"center", color:MUTED, letterSpacing:10, fontSize:18 }}>• • •</div>,
        stars: <div style={{ textAlign:"center", color:G, letterSpacing:10, fontSize:16 }}>✦ ✦ ✦</div>,
      }
      return <div style={{ padding:"10px 24px" }}>{dvStyles[c.style||"gold"]}</div>
    }
    case "spacer": {
      const spSizes: Record<string, number> = { xs:8, sm:16, md:28, lg:48, xl:72 }
      return <div style={{ height: spSizes[c.size||"md"] }} />
    }
    case "calendly": return (
      <div style={{ ...style, padding:"8px 24px 16px" }}>
        <div style={{ background:`${G}08`, border:`1px solid ${G}25`, borderRadius:14, padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <div style={{ width:42, height:42, background:`${G}15`, border:`1px solid ${G}30`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📅</div>
            <div>
              <p style={{ color:TEXT, fontSize:15, fontWeight:700, margin:0, fontFamily:FONT_B }}>{c.label||"Réserver"}</p>
              {c.description && <p style={{ color:MUTED, fontSize:12, margin:0 }}>{c.description}</p>}
            </div>
          </div>
          <a href={c.url||"#"} target="_blank" rel="noopener noreferrer" style={{ display:"block", background:`linear-gradient(90deg,${G},${G}cc)`, color:"#080808", textAlign:"center", padding:"13px", borderRadius:10, textDecoration:"none", fontSize:14, fontWeight:700 }}>{c.label||"Réserver un créneau"}</a>
        </div>
      </div>
    )
    case "reservation_form": return (
      <div style={{ ...style, padding:"8px 24px 16px" }}>
        <p style={{ color:TEXT, fontSize:17, fontWeight:700, margin:"0 0 14px", fontFamily:FONT_D }}>{c.title||"Réserver"}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {["Nom","Date souhaitée","Nb de personnes","Téléphone"].map(f => (
            <input key={f} placeholder={f} style={{ background:`${SURFACE}80`, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, padding:"13px 16px", color:TEXT, fontSize:14, outline:"none", fontFamily:FONT_B, width:"100%", boxSizing:"border-box" }} />
          ))}
          {c.phone && <a href={`tel:${c.phone}`} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", color:"#EF4444", padding:"13px", borderRadius:10, textDecoration:"none", fontSize:14, fontWeight:700 }}>📞 {c.phone}</a>}
          <button style={{ background:"linear-gradient(90deg,#EF4444,#dc2626)", border:"none", borderRadius:10, padding:"14px", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT_B }}>{c.button_label||"Réserver"}</button>
        </div>
      </div>
    )
    default: return null
  }
}

export default function PublicPageClient({ page, blocks }: { page: Page; blocks: Block[] }) {
  const theme = page.theme || {
    bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F",
    text: "#F5F0E8", muted: "#8A8478", fontDisplay: "Cormorant Garamond, serif", fontBody: "DM Sans, sans-serif"
  }

  // Load Google Fonts
  useEffect(() => {
    const fonts = [theme.fontDisplay, theme.fontBody].filter(Boolean).map((f: string) => f.replace(/ /g, "+")).join("&family=")
    if (fonts) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = `https://fonts.googleapis.com/css2?family=${fonts}&display=swap`
      document.head.appendChild(link)
    }
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: theme.bgGradient || theme.bg, fontFamily: theme.fontBody || "DM Sans, sans-serif" }}>
      {/* Max width container */}
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: theme.bg, boxShadow: "0 0 60px rgba(0,0,0,0.5)", position: "relative" }}>
        {/* Blocks */}
        {blocks.map(block => (
          <div key={block.id}>
            <RenderBlock block={block} theme={theme} />
          </div>
        ))}

        {/* Branding footer */}
        <div style={{ padding: "24px 24px 32px", textAlign: "center", borderTop: `1px solid ${theme.primary}15`, marginTop: 16 }}>
          <a href="https://qrfolio.app" target="_blank" rel="noopener noreferrer"
            style={{ color: theme.muted, fontSize: 12, textDecoration: "none", opacity: 0.6, letterSpacing: 1 }}>
            Créé avec QRfolio
          </a>
        </div>
      </div>
    </div>
  )
}
