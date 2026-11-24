// TemplatePreviewModal.tsx — Preview d'un template dans une simulation iPhone
"use client"
import { etoilesDeLAvis } from "@/app/dashboard/builder/shared-renderer/models/testimonials"
import Vignette from "@/components/Vignette"
import { Icone, ICONES } from "@/components/ui/Icone"
import { Button } from "@/components/ui/Button"
import { Suspense, useEffect, useRef } from "react"
import { X, ArrowRight, Lock, Check, Layers, Clock, ExternalLink, Sparkles } from "lucide-react"
import { type Block, type PageTheme } from "../builder/types"
import { useCatalogueDesBlocs } from "./defsALaDemande"
import { resolvePublicBlock } from "../builder/shared-renderer/publicRegistry"
import { useIsMobile } from "@/lib/useIsMobile"
import { getPlan } from "@/lib/plans"
import { categorieLue } from "./categorieLue"
import { useDialogue } from "@/components/ui/useDialogue"
import { inerte } from "@/lib/inerte"
const NOISE_SVG_URL = "url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E')"

// ── Compte à rebours (aperçu des modèles) ────────────────────────────────────
function CountdownDisplay({ date, theme }: { date: string; theme: PageTheme }) {
  const target = new Date(date).getTime()
  let diff = Math.max(0, (isNaN(target) ? 0 : target) - Date.now())
  const days = Math.floor(diff / 86400000); diff -= days * 86400000
  const hours = Math.floor(diff / 3600000); diff -= hours * 3600000
  const mins = Math.floor(diff / 60000)
  const units: [number, string][] = [[days, "Jours"], [hours, "Heures"], [mins, "Min"]]
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
      {units.map(([val, label], i) => (
        <div key={i} style={{ background: theme.primary + "12", border: `1px solid ${theme.primary}25`, borderRadius: 10, padding: "10px 12px", minWidth: 52 }}>
          <p style={{ color: theme.primary, fontSize: 22, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay, lineHeight: 1 }}>{String(val).padStart(2, "0")}</p>
          <p style={{ color: theme.muted, fontSize: 9, margin: "3px 0 0", textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
        </div>
      ))}
    </div>
  )
}

const SETUP_TIME: Record<string, string> = {
  freelance:"5 min",restaurant:"7 min",artiste:"5 min",coach:"6 min",
  createur:"4 min",event:"6 min",ecommerce:"8 min",coiffeur:"6 min",
  agence:"7 min",medecin:"6 min",vente_produits:"8 min",
  immobilier:"7 min",startup:"7 min",influenceur:"5 min",
}

export function computeBgStyle(theme: PageTheme, dayMode: boolean): React.CSSProperties {
  if (dayMode) return { background: "#FAFAFA" }
  const t = theme as any
  let base: React.CSSProperties = {}

  if (t.bgMode === "pattern") {
    const patSize = t.pattern_size || 20
    const patOpacity = t.pattern_opacity || 0.15
    const patColor = t.pattern_color || "var(--accent)"
    const alpha = Math.round(patOpacity * 255).toString(16).padStart(2, "0")
    const c = patColor + alpha
    let bgImg = ""
    switch(t.bgPattern || "dots") {
      case "dots": bgImg = `radial-gradient(circle, ${c} 1px, transparent 1px)`; break
      case "grid": bgImg = `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`; break
      case "lines": bgImg = `linear-gradient(0deg, ${c} 1px, transparent 1px)`; break
      case "diagonals": bgImg = `linear-gradient(45deg, ${c} 1px, transparent 1px)`; break
      case "hexagons": bgImg = `radial-gradient(circle, ${c} 2px, transparent 2px)`; break
      case "circles": bgImg = `radial-gradient(circle, transparent ${patSize*0.3}px, ${c} ${patSize*0.3}px, ${c} ${patSize*0.32}px, transparent ${patSize*0.32}px)`; break
      case "zigzag": bgImg = `linear-gradient(135deg, ${c} 25%, transparent 25%), linear-gradient(225deg, ${c} 25%, transparent 25%)`; break
      default: bgImg = `radial-gradient(circle, ${c} 1px, transparent 1px)`
    }
    base = { background: theme.bg, backgroundImage: bgImg, backgroundSize: `${patSize}px ${patSize}px` }
  } else if (t.bgMode === "radial") {
    return { background: t.bgGradient || `radial-gradient(circle at 50% 50%, ${theme.primary}, ${theme.bg})` }
  } else if (t.bgMode === "mesh") {
    const c1 = t.mesh_c1 || "var(--accent)"; const c2 = t.mesh_c2 || "var(--success)"; const c3 = t.mesh_c3 || "#7B2FBE"
    const blurPx = Math.round((t.mesh_blur||40)/3)
    base = {
      background: `radial-gradient(ellipse at 10% 20%, ${c1}90, transparent 55%), radial-gradient(ellipse at 90% 80%, ${c2}90, transparent 55%), radial-gradient(ellipse at 80% 10%, ${c3}70, transparent 55%), ${theme.bg}`,
      ...(blurPx > 0 ? { backdropFilter: `blur(${blurPx}px)` } : {})
    }
  } else if (t.bgMode === "image" && t.bgImage) {
    base = {
      backgroundImage: `url(${t.bgImage})`,
      backgroundSize: t.bgImageSize || "cover",
      backgroundPosition: "center",
      ...(t.bgBlur > 0 ? { filter: `blur(${t.bgBlur}px)` } : {})
    }
  } else {
    const animStyle: React.CSSProperties = t.bgAnimation === "gradient-flow"
      ? { backgroundSize: "400% 400%", animation: `gradientShift ${t.anim_speed||8}s ease infinite` }
      : t.bgAnimation === "aurora"
      ? { backgroundSize: "300% 300%", animation: `auroraShift ${t.anim_speed||12}s ease infinite` }
      : {}
    base = { background: theme.bgGradient || theme.bg, ...animStyle }
  }
  return base
}

export function BlockPreview({ block, theme, dayMode }: { block: Block; theme: PageTheme; dayMode: boolean }) {
  // Renderer PARTAGÉ d'abord : l'aperçu montre alors EXACTEMENT ce que verra un visiteur.
  // Sans lui, tout bloc absent du `switch` ci-dessous tombait sur une vignette « icône +
  // nom », ce qui vidait l'aperçu des modèles récents. Repli sur le rendu maison sinon.
  const Shared = resolvePublicBlock(block.type)
  if (Shared) {
    // Le code de chaque bloc se charge à la demande (`dynamic`). Sans frontière
    // ICI, le premier rendu d'un bloc pas encore chargé suspendait jusqu'au
    // `loading.tsx` de la route : la galerie entière devenait un squelette, sa
    // hauteur s'effondrait et le défilement repartait en haut — à chaque
    // miniature qui entrait à l'écran (bug du 19 nov., « ça remet en haut »).
    return (
      <Suspense fallback={null}>
      <Shared
        content={block.content as any}
        ctx={{
          theme,
          G: theme.primary || "var(--accent)",
          TEXT: theme.text || "#F5F0E8",
          MUTED: theme.muted || "#8A8478",
          FONT_D: theme.fontDisplay || "Fraunces, serif",
          FONT_B: theme.fontBody || "DM Sans, sans-serif",
          pageId: "preview",
          blockId: block.id,
          trackClick: () => {},
        } as any}
      />
      </Suspense>
    )
  }
  const c = block.content
  const bg = "transparent"
  const text = dayMode ? "#1A1A1A" : theme.text
  const muted = dayMode ? "#6B7280" : theme.muted
  const primary = theme.primary
  const accent = theme.accent
  const s = { background: bg }

  switch (block.type) {
    case "visit_counter": return (
      <div style={{ padding: "14px 16px", textAlign: "center", ...s }}>
        <p style={{ fontFamily: theme.fontDisplay, fontSize: 34, color: primary, fontWeight: 700, margin: "0 0 3px" }}>1 234</p>
        <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.label||"visiteurs"}</p>
      </div>
    )
    case "reservation_form": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{c.title||"Réserver"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Nom","Date souhaitée","Nb personnes"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "7px 10px", color: muted, fontSize: 11 }}>{f}</div>)}
          <div style={{ background: "linear-gradient(90deg,#EF4444,#dc2626)", borderRadius: 7, padding: "9px", textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{c.button_label||"Réserver"}</div>
        </div>
      </div>
    )
    case "countdown": return (
      <div style={{ padding: "14px 16px", textAlign: "center", ...s }}>
        {c.title && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>{c.title}</p>}
        <CountdownDisplay date={c.date||"2026-12-31"} theme={theme} />
        {c.subtitle && <p style={{ color: muted, fontSize: 11, margin: "10px 0 0" }}>{c.subtitle}</p>}
      </div>
    )
    case "contact_form": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{c.title||"Contact"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Nom","Email","Message"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: f==="Message" ? "7px 10px 32px" : "7px 10px", color: muted, fontSize: 11 }}>{f}</div>)}
          <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 7, padding: "9px", textAlign: "center", color: "#080808", fontSize: 12, fontWeight: 700 }}>{c.button_label||"Envoyer"}</div>
        </div>
      </div>
    )
    case "vcard": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ background: primary+"08", border: `1.5px solid ${primary}25`, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${primary}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
            <div>{c.name && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.name}</p>}{c.company && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.company}</p>}</div>
          </div>
          <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#080808" }}>{c.label||"Ajouter à mes contacts"}</div>
        </div>
      </div>
    )
    case "table_booking": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "13px 18px" }}>
          <span style={{ fontSize: 16 }}>🍽️</span>
          <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Réserver une table"}</p>
        </div>
      </div>
    )
    case "free_gift": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ background: "rgba(236,72,153,0.08)", border: "1.5px solid rgba(236,72,153,0.25)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
          <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>{c.emoji||"🎁"}</span>
          {c.description && <p style={{ color: muted, fontSize: 10, margin: "0 0 8px" }}>{c.description}</p>}
          <div style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.label||"Recevoir mon guide gratuit"}</div>
        </div>
      </div>
    )
    case "multi_cta": {
      const btns = [[c.btn1_icon,c.btn1_label],[c.btn2_icon,c.btn2_label],[c.btn3_icon,c.btn3_label],[c.btn4_icon,c.btn4_label]].filter(([,l])=>l)
      return (
        <div style={{ padding: "4px 16px 10px", ...s }}>
          <div style={{ display: "grid", gridTemplateColumns: btns.length<=2 ? "1fr 1fr" : "1fr 1fr", gap: 6 }}>
            {btns.map(([icon,label],i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: primary+"10", border: `1px solid ${primary}20`, borderRadius: 10, padding: "10px 6px" }}>
                <span style={{ fontSize: 20 }}>{icon||"⚡"}</span>
                <span style={{ color: text, fontSize: 10, fontWeight: 600, textAlign: "center" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "booking_button": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(56,189,248,0.08)", border: "1.5px solid rgba(56,189,248,0.25)", borderRadius: 12, padding: "11px 14px" }}>
          <div style={{ width: 38, height: 38, background: "rgba(56,189,248,0.12)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📅</div>
          <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.label||"Prendre rendez-vous"}</p>{c.description && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{c.description}</p>}</div>
        </div>
      </div>
    )
    case "payment_button": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(57,255,143,0.1)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 12, padding: "13px 18px" }}>
          <span style={{ fontSize: 16 }}>💳</span>
          <p style={{ color: "var(--success)", fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Payer maintenant"}{c.amount ? ` — ${c.amount}` : ""}</p>
        </div>
      </div>
    )
    case "quote_request": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: primary+"08", border: `1.5px solid ${primary}20`, borderRadius: 12, padding: "11px 14px" }}>
          <div style={{ width: 38, height: 38, background: primary+"12", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.label||"Demander un devis"}</p>{c.description && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{c.description}</p>}</div>
          <span style={{ color: primary, fontSize: 14 }}>→</span>
        </div>
      </div>
    )
    case "cover_banner": return (
      <div style={{ position: "relative", overflow: "hidden", borderRadius: "10px 10px 0 0" }}>
        {c.src
          ? <Vignette src={c.src} alt="" style={{ width: "100%", height: c.height==="lg" ? 140 : c.height==="sm" ? 70 : 100, objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: c.height==="lg" ? 140 : c.height==="sm" ? 70 : 100, background: `linear-gradient(135deg,${primary}30,${accent}20)`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: muted, fontSize: 11 }}>Bannière / Cover</span></div>}
        {c.cover_title && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: "10px 14px" }}><p style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.5)", fontFamily: theme.fontDisplay }}>{c.cover_title}</p></div>}
      </div>
    )

    case "google_reviews_block": {
      const reviews = [[c.r1_name,c.r1_text,c.r1_stars],[c.r2_name,c.r2_text,c.r2_stars],[c.r3_name,c.r3_text,c.r3_stars]].filter(([n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {(c.avg_rating || c.title) && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 12px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#FBBF24", fontSize: 28, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay }}>{c.avg_rating||"5.0"}</p>
                <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: "#FBBF24", fontSize: 10 }}>★</span>)}</div>
              </div>
              <div>
                <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{c.title||"Avis clients"}</p>
                {c.total_reviews && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.total_reviews} avis</p>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {reviews.map(([name,text_review,stars],i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ color: text, fontSize: 11, fontWeight: 700, margin: 0 }}>{name}</p>
                  <p style={{ color: "#FBBF24", fontSize: 10, margin: 0 }}>{"★".repeat(etoilesDeLAvis(stars))}</p>
                </div>
                <p style={{ color: muted, fontSize: 11, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{text_review}"</p>
              </div>
            ))}
          </div>
          {c.google_url && <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#4285F4", fontSize: 11, fontWeight: 600 }}>
            <span>📍</span> Voir sur Google
          </div>}
        </div>
      )
    }

    case "external_shop": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        {c.description && <p style={{ color: muted, fontSize: 12, margin: "0 0 10px", textAlign: "center" }}>{c.description}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: primary+"10", border: `1.5px solid ${primary}30`, borderRadius: 12, padding: "14px 18px" }}>
          <span style={{ fontSize: 20 }}>🛒</span>
          <div>
            <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Voir la boutique"}</p>
            {c.platform && <p style={{ color: muted, fontSize: 9, margin: 0 }}>via {c.platform}</p>}
          </div>
          <ExternalLink size={13} color={primary} style={{ marginLeft: "auto" }} />
        </div>
      </div>
    )

    case "popular_products": {
      const tops = [
        [c.p1_rank, c.p1_img, c.p1_name, c.p1_price, c.p1_sales, c.p1_url],
        [c.p2_rank, c.p2_img, c.p2_name, c.p2_price, c.p2_sales, c.p2_url],
        [c.p3_rank, null, c.p3_name, c.p3_price, c.p3_sales, c.p3_url],
      ].filter(([,, n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tops.map(([rank, img, name, price, sales], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: i===0 ? primary+"08" : "rgba(255,255,255,0.03)", border: `1px solid ${i===0 ? primary+"20" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: "10px 12px" }}>
                {rank && <span style={{ fontSize: 18, flexShrink: 0 }}>{rank.split(" ")[0]}</span>}
                {img
                  ? <Vignette src={String(img)} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 7, flexShrink: 0 }} />
                  : <div style={{ width: 40, height: 40, background: primary+"10", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏆</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                  {sales && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{sales}</p>}
                </div>
                {price && <span style={{ color: primary, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{price}</span>}
              </div>
            ))}
          </div>
        </div>
      )
    }


    case "image_carousel": {
      const imgs = [c.img1,c.img2,c.img3,c.img4,c.img5,c.img6].filter(Boolean)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="iphone-scroll">
            {imgs.length===0
              ? [0,1,2].map(i => <div key={i} style={{ width: 120, height: 120, flexShrink: 0, background: "rgba(78,205,196,0.06)", border: "1px solid rgba(78,205,196,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📸</div>)
              : imgs.map((img, i) => <Vignette key={i} src={String(img)} alt="" style={{ width: 120, height: 120, flexShrink: 0, objectFit: "cover", borderRadius: 10 }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
            {Array.from({length: Math.max(imgs.length, 3)}).map((_,i) => <div key={i} style={{ width: i===0 ? 16 : 6, height: 6, borderRadius: 3, background: i===0 ? primary : "rgba(255,255,255,0.2)" }} />)}
          </div>
        </div>
      )
    }

    case "media_before_after": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.title && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 10px", textAlign: "center" }}>{c.title}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ borderRadius: 10, overflow: "hidden" }}>
            {c.before_img
              ? <Vignette src={c.before_img} alt="Avant" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              : <div style={{ height: 130, background: "rgba(239,68,68,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📸</div>}
            <div style={{ background: "rgba(239,68,68,0.15)", padding: "6px", textAlign: "center" }}>
              <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: 0 }}>{c.before_label||"Avant"}</p>
            </div>
          </div>
          <div style={{ borderRadius: 10, overflow: "hidden" }}>
            {c.after_img
              ? <Vignette src={c.after_img} alt="Après" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              : <div style={{ height: 130, background: "rgba(57,255,143,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✨</div>}
            <div style={{ background: "rgba(57,255,143,0.15)", padding: "6px", textAlign: "center" }}>
              <p style={{ color: "var(--success)", fontSize: 11, fontWeight: 700, margin: 0 }}>{c.after_label||"Après"}</p>
            </div>
          </div>
        </div>
        {c.description && <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: "8px 0 0" }}>{c.description}</p>}
      </div>
    )

    case "youtube_gallery": {
      const videos = [[c.video1_url,c.video1_title],[c.video2_url,c.video2_title],[c.video3_url,c.video3_title]].filter(([u])=>u)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {videos.length===0
              ? [0,1,2].map(i => <div key={i} style={{ height: 90, background: "rgba(255,0,0,0.06)", border: "1px solid rgba(255,0,0,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><span style={{ fontSize: 24 }}>▶️</span><p style={{ color: muted, fontSize: 11, margin: 0 }}>Vidéo YouTube {i+1}</p></div>)
              : videos.map(([url, title], i) => {
                  const videoId = String(url).match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
                  return (
                    <div key={i} style={{ borderRadius: 10, overflow: "hidden", background: "#000", position: "relative" }}>
                      {videoId
                        ? <Vignette src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                        : <div style={{ height: 90, background: "rgba(255,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>▶️</div>}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 32, height: 32, background: "rgba(255,0,0,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontSize: 12, marginLeft: 2 }}>▶</span>
                        </div>
                      </div>
                      {title && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.8))", padding: "20px 10px 8px" }}><p style={{ color: "#fff", fontSize: 10, margin: 0 }}>{title}</p></div>}
                    </div>
                  )
                })}
          </div>
          {c.cta_label && <div style={{ marginTop: 10, background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: 9, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#FF0000" }}>{c.cta_label}</div>}
        </div>
      )
    }

    case "tiktok_gallery": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
        {c.username && <p style={{ color: muted, fontSize: 11, margin: "0 0 10px", textAlign: "center" }}>{c.username}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
          {[c.video1_url, c.video2_url, c.video3_url].map((url, i) => (
            <div key={i} style={{ aspectRatio: "9/16", background: "rgba(245,240,232,0.06)", border: "1px solid rgba(245,240,232,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {url ? "🎵" : "📱"}
            </div>
          ))}
        </div>
        {c.cta_label && <div style={{ marginTop: 10, background: "rgba(245,240,232,0.06)", border: "1px solid rgba(245,240,232,0.15)", borderRadius: 9, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: text }}>{c.cta_label}</div>}
      </div>
    )

    case "video_testimonials": {
      const testi = [[c.t1_video_url,c.t1_name,c.t1_company,c.t1_quote],[c.t2_video_url,c.t2_name,c.t2_company,c.t2_quote]].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {testi.length===0
              ? <div style={{ height: 80, background: "rgba(78,205,196,0.06)", border: "1px dashed rgba(78,205,196,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: 11 }}>Ajoutez vos témoignages vidéo</div>
              : testi.map(([url, name, company, quote], i) => {
                const videoId = String(url||"").match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
                return (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
                    {videoId
                      ? <div style={{ position: "relative" }}>
                          <Vignette src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 36, height: 36, background: "rgba(0,0,0,0.7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 14, marginLeft: 2 }}>▶</span></div>
                          </div>
                        </div>
                      : <div style={{ height: 80, background: "rgba(78,205,196,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎬</div>}
                    <div style={{ padding: "10px 12px" }}>
                      {quote && <p style={{ color: muted, fontSize: 11, fontStyle: "italic", margin: "0 0 7px" }}>"{quote}"</p>}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: primary+"20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</div>
                        <div><p style={{ color: text, fontSize: 11, fontWeight: 700, margin: 0 }}>{name}</p>{company && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{company}</p>}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )
    }

    case "quote_form": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Demander un devis"}</p>
        {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>{c.description}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {["Nom complet","Email"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>{f}</div>)}
          {c.show_phone!=="no" && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>Téléphone</div>}
          {c.show_budget==="yes" && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>Budget estimé</div>}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px 36px", color: muted, fontSize: 11 }}>Description du projet</div>
          <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#080808" }}>{c.button_label||"Envoyer ma demande"}</div>
        </div>
      </div>
    )

    case "service_area": {
      const cities = [c.city1,c.city2,c.city3,c.city4,c.city5,c.city6].filter(Boolean)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          {c.area && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 10, padding: "11px 14px", marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{c.area}</p>
                {c.radius && <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.radius}</p>}
              </div>
            </div>
          )}
          {cities.length>0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {cities.map((city: string, i: number) => (
                <span key={i} style={{ background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 20, padding: "5px 12px", color: text, fontSize: 12 }}>📍 {city}</span>
              ))}
            </div>
          )}
          {c.note && <p style={{ color: muted, fontSize: 11, margin: "10px 0 0", fontStyle: "italic" }}>{c.note}</p>}
        </div>
      )
    }

    case "booking_request": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Réserver pour un événement"}</p>
        {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>{c.description}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {["Nom / Organisation","Email","Type d événement","Date souhaitée"].map(f => (
            <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>{f}</div>
          ))}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px 32px", color: muted, fontSize: 11 }}>Message</div>
          <div style={{ background: "linear-gradient(90deg,#9146FF,#7B3FCC)", borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.button_label||"Envoyer ma demande"}</div>
        </div>
      </div>
    )

    case "event_register": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"S inscrire gratuitement"}</p>
        {c.description && <p style={{ color: "#EC4899", fontSize: 11, margin: "0 0 12px", fontWeight: 600 }}>⚡ {c.description}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {["Prénom & Nom","Email"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>{f}</div>)}
          {c.show_phone==="yes" && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>Téléphone</div>}
          {c.show_company==="yes" && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>Société</div>}
          <div style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.button_label||"Je m inscris"}</div>
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


    case "qr_code_block": return (
      <div style={{ padding: "16px", textAlign: "center", ...s }}>
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#FFFFFF", border: `3px solid ${primary}30`, borderRadius: 14, padding: c.size==="lg" ? 14 : c.size==="sm" ? 7 : 10, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
            <div style={{ width: c.size==="lg" ? 160 : c.size==="sm" ? 80 : 120, height: c.size==="lg" ? 160 : c.size==="sm" ? 80 : 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 2, width: "100%", height: "100%" }}>
                {Array.from({length:25}).map((_,i) => {
                  const corners = [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24]
                  return <div key={i} style={{ background: corners.includes(i) ? "#111" : Math.random()>0.4 ? "#111" : "transparent", borderRadius: 1 }} />
                })}
              </div>
            </div>
          </div>
          {c.label && <p style={{ color: text, fontSize: 12, fontWeight: 600, margin: 0 }}>{c.label}</p>}
          {c.show_url!=="no" && <p style={{ color: muted, fontSize: 10, margin: 0, fontFamily: "monospace" }}>/q/...</p>}
        </div>
      </div>
    )

    case "embed_block": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.url
          ? <div>
              {c.title && <p style={{ color: muted, fontSize: 10, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1.5 }}>{c.title}</p>}
              <iframe src={c.url} width="100%" height={parseInt(c.height||"400")} style={{ border: "none", borderRadius: 12, display: "block" }} loading="lazy" />
            </div>
          : <div style={{ background: "color-mix(in srgb, var(--accent) 6%, transparent)", border: "1.5px dashed color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius: 12, padding: "30px", textAlign: "center" }}>
              <span style={{ fontSize: 32, display: "block", marginBottom: 10 }}>🔗</span>
              <p style={{ color: text, fontSize: 13, fontWeight: 600, margin: "0 0 5px" }}>{c.title||"Embed externe"}</p>
              <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.type||"Google Forms, Typeform, Notion..."}</p>
            </div>}
      </div>
    )

    case "tabs_block": { const [activeTab, setActiveTab] = [0, (_:number) => {}] as const
      const tabs = [[c.tab1_label,c.tab1_content],[c.tab2_label,c.tab2_content],[c.tab3_label,c.tab3_content]].filter(([l])=>l)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }}>
            {(tabs.length===0 ? [["Présentation"],["Tarifs"],["FAQ"]] : tabs).map(([label],i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                style={{ padding: "8px 14px", background: "transparent", border: "none", borderBottom: `2px solid ${activeTab===i ? primary : "transparent"}`, color: activeTab===i ? primary : muted, fontSize: 11, fontWeight: activeTab===i ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ minHeight: 60 }}>
            {tabs.length===0
              ? <p style={{ color: muted, fontSize: 11, margin: 0 }}>Contenu de l onglet {activeTab+1}</p>
              : <p style={{ color: text, fontSize: 12, margin: 0, lineHeight: 1.7 }}>{tabs[activeTab]?.[1]||"Ajoutez du contenu..."}</p>}
          </div>
        </div>
      )
    }

    case "accordion_block": { const [openIdx, setOpenIdx] = [null as number|null, (_:number|null) => {}] as const
      const items = [[c.a1_title,c.a1_content],[c.a2_title,c.a2_content],[c.a3_title,c.a3_content],[c.a4_title,c.a4_content]].filter(([t])=>t)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(items.length===0 ? [["Nos services","Détail des services..."],["Nos tarifs","Détail des tarifs..."],["Conditions","Nos conditions..."]] : items).map(([title,content],i) => (
              <div key={i} style={{ border: `1px solid ${openIdx===i ? primary+"40" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => setOpenIdx(openIdx===i ? null : i)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: openIdx===i ? primary+"08" : "transparent", border: "none", color: openIdx===i ? primary : text, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                  {title}
                  <span style={{ color: primary, fontSize: 16, lineHeight: 1 }}>{openIdx===i ? "−" : "+"}</span>
                </button>
                {openIdx===i && content && (
                  <div style={{ padding: "4px 14px 12px", background: "rgba(0,0,0,0.15)" }}>
                    <p style={{ color: muted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    default:
      return <BlocSansRendu type={block.type} style={s} muted={muted} />
  }
}

/** Un bloc sans rendu partagé ni rendu maison : son icône et son nom, lus dans
 *  le catalogue chargé à la demande (voir defsALaDemande). */
function BlocSansRendu({ type, style, muted }: { type: string; style: React.CSSProperties; muted: string }) {
  const def = useCatalogueDesBlocs()?.[type]
  return <div style={{ padding: "12px 16px", textAlign: "center", ...style }}><span style={{ fontSize: 22 }}>{def?.icon||"📦"}</span><p style={{ color: muted, fontSize: 11, margin: "5px 0 0" }}>{def?.label||type}</p></div>
}

// ── Props ────────────────────────────────────────────────────────────────────
interface TemplatePreviewModalProps {
  template: {
    id: string; name: string; category: string; plan: string
    emoji: string; color: string; accent: string; bg: string; surface: string
    description: string; tags: string[]
    /** Accroche courte (galerie → aperçu) et variante d'ambiance quand deux modèles portent le même nom. */
    highlight?: string; variante?: string
  }
  blocks: { type: string; content: Record<string, string> }[]
  onClose: () => void
  onUse: () => void
  /** Ouvre l'assistant de personnalisation (questions → revue → création). */
  onCustomize?: () => void
  canUse: boolean
  isCreating?: boolean
}

const MUTED = "var(--muted)"
const G = "var(--accent)"

export default function TemplatePreviewModal({
  template, blocks, onClose, onUse, onCustomize, canUse, isCreating
}: TemplatePreviewModalProps) {
  // Le catalogue des blocs arrive à la demande : la liste affiche le type en attendant.
  const catalogue = useCatalogueDesBlocs()
  const scrollRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile(768) // mobile : aperçu + panneau empilés et scrollables
  // Rôle, Échap, piège de focus, restitution du focus, verrou du défilement :
  // cette fenêtre n'avait que l'Échap et le verrou.
  const { ref: dlg, props: dlgProps } = useDialogue(true, onClose, { label: `Aperçu du modèle ${template?.name ?? ""}`.trim() })

  // Chaque modèle s'ouvre EN HAUT de sa page.
  //
  // Constat du 29 septembre, sur « Bistrot français » et « Freelance /
  // Consultant » : l'aperçu s'ouvrait près du bas, le focus sur un lien
  // Instagram. Deux causes, réparées ensemble :
  //
  //   1. la fenêtre posait le focus sur le premier élément atteignable qu'elle
  //      trouvait — un lien de la page SIMULÉE — et le navigateur faisait
  //      défiler le téléphone jusqu'à lui. La page simulée est donc `inert`
  //      (elle n'est plus un contrôle) et le cadre porte `data-focus-initial` :
  //      le focus entre sur la fenêtre elle-même, sans rien déplacer.
  //   2. le conteneur de défilement est REMPLOYÉ d'un modèle à l'autre (même
  //      élément, contenu remplacé) : il gardait la position du précédent. On la
  //      remet à zéro à chaque changement de modèle.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = 0
  }, [template?.id])


  // Convertir les blocs du template en Block[] pour BlockPreview
  const previewBlocks: Block[] = blocks.map((b, i) => ({
    id: "prev_" + i,
    type: b.type,
    content: b.content,
    visible: true,
  }))

  // Thème reconstruit depuis les props
  const theme: PageTheme = {
    name: template.name,
    bg: template.bg,
    surface: template.surface,
    primary: template.color,
    accent: template.accent,
    text: "#F5F0E8",
    muted: "#A8A190",
    fontDisplay: "Fraunces",
    fontBody: "DM Sans",
    bgMode: "solid",
  }

  const bgStyles = computeBgStyle(theme, false)
  const blockCount = blocks.length
  const setupTime = SETUP_TIME[template.id] || "5 min"

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
        backdropFilter: "blur(6px)",
        animation: "tplFadeIn 0.18s ease",
      }}>

      {/* Conteneur central — stop propagation */}
      <div ref={dlg} {...dlgProps} data-focus-initial="" onClick={e => e.stopPropagation()} style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 16 : 24,
        alignItems: "center",
        maxWidth: isMobile ? 420 : 820, width: "100%", maxHeight: "92vh",
        overflowY: isMobile ? "auto" : "visible",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}>

        {/* ── Simulation iPhone ────────────────────────────────────────────
            MAQUETTE, pas page : ses liens d'exemple (« https://instagram.com »)
            et ses boutons ne mènent nulle part. `inert` les retire du parcours
            au clavier et de l'arbre d'accessibilité — le panneau de droite dit
            en clair ce que contient le modèle (blocs, description, palette).

            L'inertie porte sur le CONTENU, pas sur la coque. Mesuré au
            navigateur le 29 septembre, sur le build de production : posée sur le
            conteneur, elle emportait le cadre de défilement qui est dedans, et
            la page simulée ne bougeait plus — ni à la molette, ni au doigt, alors
            qu'elle mesure 1332 px pour 590 px de hublot. On ne pouvait donc plus
            voir un modèle au-delà de son premier écran. */}
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {/* Coque iPhone */}
          <div style={{
            width: isMobile ? 264 : 320, height: isMobile ? 528 : 640,
            background: "#1A1A1A",
            border: "2px solid #333",
            borderRadius: 44,
            padding: "14px 10px",
            boxShadow: "0 0 0 1px #111, 0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
            position: "relative",
            display: "flex", flexDirection: "column",
          }}>
            {/* Notch */}
            <div aria-hidden="true" style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 100, height: 22, background: "#111", borderRadius: 12, zIndex: 2 }}>
              <div style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", width: 10, height: 10, borderRadius: "50%", background: "#222", border: "1px solid #333" }} />
            </div>

            {/* Boutons latéraux (déco) */}
            <div aria-hidden="true" style={{ position: "absolute", left: -3, top: 90, width: 3, height: 28, background: "#333", borderRadius: "2px 0 0 2px" }} />
            <div style={{ position: "absolute", left: -3, top: 130, width: 3, height: 52, background: "#333", borderRadius: "2px 0 0 2px" }} />
            <div style={{ position: "absolute", right: -3, top: 120, width: 3, height: 60, background: "#333", borderRadius: "0 2px 2px 0" }} />

            {/* Écran */}
            <div style={{
              flex: 1, borderRadius: 34, overflow: "hidden",
              position: "relative", marginTop: 8,
            }}>
              {/* Status bar */}
              <div aria-hidden="true" style={{
                height: 28, background: theme.bg,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 16px", flexShrink: 0,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ color: theme.text, fontSize: 11, fontWeight: 700, opacity: 0.8 }}>9:41</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                    {[3,4,5,6].map((h,i) => <div key={i} style={{ width: 2, height: h, background: theme.text, opacity: 0.7, borderRadius: 1 }} />)}
                  </div>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M6 1.5C7.5 1.5 9 2 10.5 3.2L11.5 2.2C9.8 0.8 8 0 6 0C4 0 2.2 0.8 0.5 2.2L1.5 3.2C3 2 4.5 1.5 6 1.5Z" fill={theme.text} opacity="0.7"/>
                    <path d="M6 4.5C7 4.5 7.9 4.8 8.7 5.4L9.7 4.4C8.6 3.6 7.4 3.2 6 3.2C4.6 3.2 3.4 3.6 2.3 4.4L3.3 5.4C4.1 4.8 5 4.5 6 4.5Z" fill={theme.text} opacity="0.7"/>
                    <circle cx="6" cy="7" r="1" fill={theme.text} opacity="0.8"/>
                  </svg>
                  <div style={{ width: 20, height: 10, border: "1.5px solid " + theme.text, borderRadius: 3, opacity: 0.7, position: "relative" }}>
                    <div style={{ position: "absolute", left: 1, top: 1, bottom: 1, width: "80%", background: theme.text, borderRadius: 1, opacity: 0.8 }} />
                    <div style={{ position: "absolute", right: -3, top: "50%", transform: "translateY(-50%)", width: 2, height: 5, background: theme.text, borderRadius: 1, opacity: 0.5 }} />
                  </div>
                </div>
              </div>

              {/* Page scrollable */}
              <div
                ref={scrollRef}
                style={{
                  flex: 1, overflowY: "auto", height: "100%",
                  ...bgStyles,
                  position: "relative",
                  scrollbarWidth: "none",
                }}
                className="preview-scroll"
                // Une région qu'on fait défiler doit être atteignable au clavier
                // (WCAG 2.1.1) et porter un nom : sinon l'aperçu n'existe que pour
                // la souris. Son CONTENU reste inerte, juste en dessous.
                tabIndex={0} role="group" aria-label={`Aperçu de la page du modèle ${template?.name ?? ""} — faites défiler`.trim()}>

                {/* Effets visuels du thème */}
                {(theme as any).effect_noise && (
                  <div style={{ position: "sticky", top: 0, height: 0, zIndex: 2, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", inset: 0, height: "100vh", opacity: (theme as any).noise_opacity/100||0.06, mixBlendMode: "overlay", backgroundImage: NOISE_SVG_URL, backgroundRepeat: "repeat", backgroundSize: "128px" }} />
                  </div>
                )}
                {(theme as any).effect_glow && (
                  <div style={{ position: "sticky", top: 0, height: 0, zIndex: 1, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", inset: 0, height: "60vh", background: `radial-gradient(ellipse at 50% 0%, ${(theme as any).glow_color||G}50, transparent ${(theme as any).glow_size||200}px)` }} />
                  </div>
                )}

                {/* Blocs — le contenu de la maquette : inerte (voir plus haut). */}
                <div {...inerte} style={{ minHeight: "100%" }}>
                  {(canUse ? previewBlocks : previewBlocks.slice(0, 2)).map((block, i) => (
                    <BlockPreview key={i} block={block} theme={theme} dayMode={false} />
                  ))}
                  {!canUse && (<div style={{ margin: "8px 16px 0", padding: "24px 16px", borderRadius: 14, background: theme.primary + "0A", border: "1px solid " + theme.primary + "25", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: theme.primary + "18", border: "1px solid " + theme.primary + "40", display: "flex", alignItems: "center", justifyContent: "center" }}><Lock size={16} color={theme.primary} /></div><p style={{ color: theme.text, fontSize: 13, fontWeight: 700, margin: 0 }}>Aperçu limite</p><p style={{ color: theme.muted, fontSize: 11, margin: 0, lineHeight: 1.5 }}>{previewBlocks.length > 2 ? "+" + (previewBlocks.length - 2) + " blocs reserves au plan superieur" : "Reserve a un plan superieur"}</p></div>)}<div style={{ height: 40 }} />
                </div>
              </div>
            </div>

            {/* Home indicator */}
            <div aria-hidden="true" style={{ height: 6, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
              <div style={{ width: 100, height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 2 }} />
            </div>
          </div>

          {/* Label sous l'iPhone */}
          <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 11 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", animation: "mo-pulse 2s ease-in-out infinite" }} />
            Aperçu en temps réel
          </div>
        </div>

        {/* ── Panneau info ───────────────────────────────────────────────── */}
        <div style={{
          flex: isMobile ? "0 0 auto" : 1, width: isMobile ? "100%" : "auto",
          background: "#0F0E0B",
          border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
          borderRadius: 20, padding: isMobile ? "20px" : "24px",
          display: "flex", flexDirection: "column", gap: 20,
          maxHeight: isMobile ? "none" : "90vh", overflowY: isMobile ? "visible" : "auto",
          scrollbarWidth: "none",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 48, height: 48, background: template.bg, border: "1.5px solid " + template.color + "30", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {/* Même cause qu'au lot v195 sur la galerie : le champ `emoji` du
                  catalogue converti (v188) contient un NOM de concept, pas un
                  pictogramme. Écrit tel quel, il s'affichait en toutes lettres. */}
              {template.emoji in ICONES
                ? <Icone nom={template.emoji} taille={24} couleur={template.color} />
                : template.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ color: "#F5F0E8", fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{template.name}</h2>
              <span style={{ background: template.color + "15", border: "1px solid " + template.color + "25", borderRadius: 8, padding: "2px 8px", fontSize: 11, color: template.color, fontWeight: 600 }}>{categorieLue(template.category)}</span>
              {template.variante && <span style={{ marginLeft: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "2px 8px", fontSize: 11, color: MUTED, fontWeight: 500 }}>{template.variante}</span>}
            </div>
            <button type="button" onClick={onClose} aria-label="Fermer l'aperçu" style={{ width: 40, height: 40, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <X size={14} color={MUTED} />
            </button>
          </div>

          {/* Description + accroche (l'accroche a quitté la carte de la galerie : elle vit ici) */}
          <p style={{ color: MUTED, fontSize: 13, margin: 0, lineHeight: 1.7 }}>{template.description}</p>
          {template.highlight && <p style={{ color: "#F5F0E8", fontSize: 12.5, margin: "-6px 0 0", fontWeight: 500 }}>{template.highlight}</p>}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: <Layers size={14} color={template.color} />, label: "Blocs inclus", value: blockCount + " blocs" },
              { icon: <Clock size={14} color={template.color} />, label: "Prêt en", value: "≈ " + setupTime },
            ].map((stat, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  {stat.icon}
                  <span style={{ color: MUTED, fontSize: 11 }}>{stat.label}</span>
                </div>
                <span style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700 }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Liste des blocs */}
          <div>
            <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px" }}>Blocs du modèle</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 220, overflowY: "auto", scrollbarWidth: "none" }}>
            {(canUse ? blocks : blocks.slice(0, 3)).map((block, i) => {
                const def = catalogue?.[block.type]
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8 }}>
                    <Check size={10} color={template.color} />
                    <span style={{ fontSize: 14 }}>{def?.icon || "📦"}</span>
                    <span style={{ color: "#F5F0E8", fontSize: 11, fontWeight: 500, flex: 1 }}>{def?.label || block.type}</span>
                    <span style={{ color: MUTED, fontSize: 11, opacity: 0.6 }}>{i + 1}</span>
                  </div>
                )
              })}
         </div>
            {!canUse && blocks.length > 3 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginTop: 5, background: "color-mix(in srgb, var(--accent) 6%, transparent)", border: "1px dashed color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius: 8 }}>
                <Lock size={11} color={template.color} />
                <span style={{ color: MUTED, fontSize: 11, fontWeight: 500, flex: 1 }}>+{blocks.length - 3} blocs reserves au plan superieur</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {template.tags.map((tag, i) => (
              <span key={i} style={{ background: template.color + "10", border: "1px solid " + template.color + "20", borderRadius: 6, padding: "3px 9px", fontSize: 11, color: template.color, fontWeight: 500 }}>{tag}</span>
            ))}
          </div>

          {/* Aperçu couleurs thème */}
          <div>
            <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 8px" }}>Palette de couleurs</p>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { c: template.bg, label: "Fond" },
                { c: template.surface, label: "Surface" },
                { c: template.color, label: "Primaire" },
                { c: template.accent, label: "Accent" },
                { c: "#F5F0E8", label: "Texte" },
              ].map((col, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: col.c, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }} />
                  <span style={{ color: MUTED, fontSize: 11, textAlign: "center" }}>{col.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action principale — sticky en bas sur mobile (toujours accessible sans scroller) */}
          <div style={{ marginTop: "auto", display: "flex", gap: 10,
            // Sur mobile les actions s'empilent : côte à côte, les deux boutons
            // secondaires ne se comprimaient pas et écrasaient l'action principale,
            // dont le libellé finissait tronqué au milieu d'un mot.
            ...(isMobile ? { flexDirection: "column" as const, position: "sticky" as const, bottom: 0, margin: "12px -20px 0", padding: "12px 20px calc(4px + env(safe-area-inset-bottom))", background: "rgba(16,15,10,0.92)", backdropFilter: "blur(8px)", borderTop: "1px solid rgba(255,255,255,0.08)", zIndex: 3 } : {}) }}>
            {/* « Fermer » ferait une troisième ligne sur mobile alors que la croix
                de l'en-tête est juste au-dessus, toujours visible. */}
            {!isMobile && (
              <button type="button" onClick={onClose} className="da-btn-neutral da-btn-neutral--sm">
                <X className="da-ic da-ic-x" size={13} /> Fermer
              </button>
            )}
            {canUse && onCustomize
              ? <>
                  {/* Chemin recommandé : on remplit le modèle avec ses propres informations
                      AVANT d'entrer dans l'éditeur — la page ne contient alors aucun exemple. */}
                  <button type="button" onClick={onCustomize} disabled={!!isCreating}
                    className="da-btn-primary da-btn-primary--sm" style={{ flex: 1, justifyContent: "center" }}>
                    <Sparkles size={13} /> <span>Remplir avec mes infos</span> <ArrowRight className="da-ic da-ic-arrow" size={14} />
                  </button>
                  <button type="button" onClick={onUse} disabled={!!isCreating}
                    className="da-btn-neutral da-btn-neutral--sm" title="Créer la page telle quelle, avec le contenu d'exemple"
                    style={isMobile ? { justifyContent: "center" } : undefined}>
                    Utiliser tel quel
                  </button>
                </>
              : <button type="button" onClick={onUse} disabled={!!isCreating}
                  className={canUse ? "da-btn-primary da-btn-primary--sm" : "da-btn-neutral da-btn-neutral--sm"}
                  style={{ flex: 1, justifyContent: "center" }}>
                  {isCreating
                    ? <><span style={{ width: 12, height: 12, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "mo-spin 0.8s linear infinite" }} /> <span>Création...</span></>
                    : canUse
                      ? <><span>Utiliser ce modèle</span> <ArrowRight className="da-ic da-ic-arrow" size={14} /></>
                      : <><Lock size={12} /> <span>Plan {getPlan(template.plan).label} requis</span></>
                  }
                </button>
            }
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tplFadeIn { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }
        .preview-scroll::-webkit-scrollbar { display: none }
      `}</style>
    </div>
  )
}
