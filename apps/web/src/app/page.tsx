"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

// ── Helpers ──────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ── Particle background ───────────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.1
    }))
    let raf: number
    function draw() {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(201,168,76,${p.o})`
        ctx.fill()
        p.x += p.dx; p.y += p.dy
        if (p.x < 0 || p.x > W) p.dx *= -1
        if (p.y < 0 || p.y > H) p.dy *= -1
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener("resize", onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />
}

// ── Animated QR mockup ────────────────────────────────────────────────────────
function QRMockup() {
  const [pulse, setPulse] = useState(false)
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2400)
    return () => clearInterval(t)
  }, [])
  const corners = [0,1,2,7,8,9,14,15,16,6,13,20,3,4,5,10,11,12,17,18,19,
    28,29,30,35,36,37,42,43,44,49,32,33,34,39,40,41,46,47,48]
  const goldCells = [24, 25, 26, 31, 32, 33, 38]
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", width: 300, height: 300, margin: "0 auto",
        cursor: "default" }}
    >
      {/* Ambient glow outer */}
      <div style={{
        position: "absolute", inset: -40, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%)",
        transform: pulse ? "scale(1.15)" : "scale(1)",
        transition: "transform 2.4s ease-in-out",
        pointerEvents: "none"
      }} />
      {/* Glow ring inner */}
      <div style={{
        position: "absolute", inset: -12, borderRadius: 28,
        background: hovered
          ? "radial-gradient(circle at 50% 50%, rgba(201,168,76,0.18) 0%, transparent 70%)"
          : "radial-gradient(circle at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 70%)",
        transition: "background 0.4s ease",
        pointerEvents: "none"
      }} />
      {/* Card */}
      <div style={{
        width: 300, height: 300,
        background: "linear-gradient(145deg, #151210, #111009)",
        border: `1px solid ${hovered ? "rgba(201,168,76,0.6)" : pulse ? "rgba(201,168,76,0.45)" : "rgba(201,168,76,0.3)"}`,
        borderRadius: 22,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 18,
        position: "relative", overflow: "hidden",
        boxShadow: hovered
          ? "0 0 80px rgba(201,168,76,0.35), 0 0 160px rgba(201,168,76,0.1), inset 0 1px 0 rgba(201,168,76,0.15)"
          : pulse
          ? "0 0 50px rgba(201,168,76,0.2), 0 0 100px rgba(201,168,76,0.06)"
          : "0 0 30px rgba(201,168,76,0.1)",
        transform: hovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
      }}>
        {/* Shimmer */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, transparent 30%, rgba(201,168,76,0.04) 50%, transparent 70%)",
          animation: "shimmer 3s infinite"
        }} />
        {/* Corner accent top-left */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: 40, height: 40,
          borderTop: "2px solid rgba(201,168,76,0.4)", borderLeft: "2px solid rgba(201,168,76,0.4)",
          borderRadius: "22px 0 0 0", pointerEvents: "none"
        }} />
        {/* Corner accent bottom-right */}
        <div style={{
          position: "absolute", bottom: 0, right: 0, width: 40, height: 40,
          borderBottom: "2px solid rgba(201,168,76,0.4)", borderRight: "2px solid rgba(201,168,76,0.4)",
          borderRadius: "0 0 22px 0", pointerEvents: "none"
        }} />
        {/* QR grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, padding: 4, position: "relative", zIndex: 1 }}>
          {Array.from({ length: 49 }, (_, i) => (
            <div key={i} style={{
              width: 11, height: 11, borderRadius: 2.5,
              background: goldCells.includes(i)
                ? "#C9A84C"
                : corners.includes(i)
                ? "#F5F0E8"
                : "rgba(245,240,232,0.15)",
              opacity: goldCells.includes(i) ? 1 : corners.includes(i) ? 0.92 : 0.5,
              boxShadow: goldCells.includes(i) ? "0 0 6px rgba(201,168,76,0.6)" : "none",
              transition: "all 0.3s ease"
            }} />
          ))}
        </div>
        <p style={{ color: "#C9A84C", fontSize: 10, letterSpacing: 4, textTransform: "uppercase", position: "relative", zIndex: 1, fontWeight: 600 }}>QRFOLIO.APP</p>
      </div>
    </div>
  )
}

// ── Section wrapper avec fade-in ──────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`
    }}>
      {children}
    </div>
  )
}

// ── Features section ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "⚡",
    tag: "Builder",
    title: "Cree ta page sans coder",
    desc: "Builder drag & drop, blocs prets a l'emploi, personnalisation rapide. En ligne en 5 minutes.",
    accent: "#C9A84C",
  },
  {
    icon: "🔄",
    tag: "QR Dynamique",
    title: "Transforme ton QR en outil business",
    desc: "Modifie ta destination, ton contenu, tes liens — sans jamais reimprimer ton QR code.",
    accent: "#38BDF8",
  },
  {
    icon: "📊",
    tag: "Analytics",
    title: "Mesure chaque scan",
    desc: "Vues, scans, appareils, sources et performances. Tout en temps reel, tout inclus.",
    accent: "#39FF8F",
  },
  {
    icon: "🎯",
    tag: "Conversion",
    title: "Convertis tes visiteurs",
    desc: "Boutons WhatsApp, reservation, paiement, formulaire de contact, CTA personnalises.",
    accent: "#F97316",
  },
  {
    icon: "🎨",
    tag: "Templates",
    title: "Demarre avec un template metier",
    desc: "Restaurant, freelance, coach, artiste, immobilier, commerce. Adapte a ton secteur.",
    accent: "#A78BFA",
  },
  {
    icon: "🏢",
    tag: "Marque pro",
    title: "Passe en marque pro",
    desc: "Domaine personnalise, sans branding QRfolio, design premium. Une image irreprochable.",
    accent: "#C9A84C",
  },
] as const

function FeaturesSection() {
  const { ref, visible } = useInView(0.06)
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <section
      id="features"
      ref={ref}
      aria-labelledby="features-title"
      style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}
    >
      {/* Header */}
      <div style={{
        maxWidth: 1140, margin: "0 auto 64px", textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <p style={{
          color: "#C9A84C", fontSize: 11, letterSpacing: 3.5,
          textTransform: "uppercase", fontWeight: 600, marginBottom: 16,
        }}>Fonctionnalites</p>
        <h2 id="features-title" style={{
          fontFamily: "Cormorant Garamond, serif",
          fontSize: "clamp(28px, 4vw, 52px)",
          color: "#F5F0E8", fontWeight: 700, margin: "0 auto",
          lineHeight: 1.1, maxWidth: 560, letterSpacing: "-0.02em",
        }}>
          Tout ce qu'il faut pour{" "}
          <span style={{ color: "#C9A84C" }}>convertir</span>
        </h2>
      </div>

      {/* Grid */}
      <div
        className="feat-grid"
        style={{
          maxWidth: 1140, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {FEATURES.map((f, i) => {
          const isHovered = hovered === i
          return (
            <div
              key={f.tag}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isHovered
                  ? "rgba(255,255,255,0.035)"
                  : "rgba(255,255,255,0.018)",
                border: `1px solid ${isHovered ? f.accent + "35" : "rgba(201,168,76,0.1)"}`,
                borderRadius: 18,
                padding: "28px 26px",
                display: "flex", flexDirection: "column", gap: 14,
                position: "relative", overflow: "hidden",
                cursor: "default",
                transform: visible
                  ? isHovered ? "translateY(-4px)" : "translateY(0)"
                  : "translateY(28px)",
                opacity: visible ? 1 : 0,
                transition: `opacity 0.5s ease ${i * 80}ms, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${visible ? "0ms" : i * 80 + "ms"}, border-color 0.25s ease, background 0.25s ease`,
                boxShadow: isHovered
                  ? `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${f.accent}18`
                  : "none",
              }}
            >
              {/* Top accent */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: isHovered
                  ? `linear-gradient(90deg, transparent, ${f.accent}55, transparent)`
                  : "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)",
                transition: "background 0.3s ease",
              }} />

              {/* Icon + tag row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `${f.accent}12`,
                  border: `1px solid ${f.accent}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                  transition: "background 0.25s ease, border-color 0.25s ease",
                  ...(isHovered && {
                    background: `${f.accent}20`,
                    borderColor: `${f.accent}50`,
                  }),
                }}>{f.icon}</div>
                <span style={{
                  color: f.accent,
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: 2, textTransform: "uppercase",
                  opacity: 0.8,
                }}>{f.tag}</span>
              </div>

              {/* Title */}
              <h3 style={{
                color: "#F5F0E8", fontSize: 16, fontWeight: 700,
                margin: 0, lineHeight: 1.3,
              }}>{f.title}</h3>

              {/* Desc */}
              <p style={{
                color: "rgba(138,132,120,0.85)", fontSize: 13,
                margin: 0, lineHeight: 1.65,
              }}>{f.desc}</p>
            </div>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 900px) { .feat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 580px) { .feat-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { #features { padding: 72px 24px !important; } }
      `}</style>
    </section>
  )
}


// ── Pricing card ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Pour tester QRfolio",
    price: "0",
    period: "",
    highlight: false,
    badge: null,
    color: "#8A8478",
    cta: "Commencer gratuitement",
    ctaHref: "/auth/signup",
    features: [
      { text: "1 page active",             ok: true  },
      { text: "500 vues / mois",           ok: true  },
      { text: "QR code basique",           ok: true  },
      { text: "Analytics simples",         ok: true  },
      { text: "Branding QRfolio",          ok: false },
      { text: "Domaine personnalise",      ok: false },
    ],
    note: null,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Pour les independants et commerces",
    price: "9,90",
    period: "/ mois",
    highlight: true,
    badge: "Le plus populaire",
    color: "#C9A84C",
    cta: "Demarrer l'essai gratuit",
    ctaHref: "/auth/signup?plan=pro",
    features: [
      { text: "Pages illimitees",          ok: true },
      { text: "Vues illimitees",           ok: true },
      { text: "QR dynamiques",             ok: true },
      { text: "Analytics avances",         ok: true },
      { text: "Sans branding QRfolio",     ok: true },
      { text: "Domaine personnalise",      ok: true },
    ],
    note: "14 jours d'essai · Sans engagement · Sans CB",
  },
  {
    id: "business",
    name: "Business",
    tagline: "Pour equipes, agences et marques",
    price: "24,90",
    period: "/ mois",
    highlight: false,
    badge: null,
    color: "#A78BFA",
    cta: "Contacter l'equipe",
    ctaHref: "/auth/signup?plan=business",
    features: [
      { text: "Tout Pro inclus",           ok: true },
      { text: "Gestion d'equipe",          ok: true },
      { text: "Acces API",                 ok: true },
      { text: "Integrations premium",      ok: true },
      { text: "Support prioritaire",       ok: true },
      { text: "Facturation equipe",        ok: true },
    ],
    note: null,
  },
] as const

function PricingSection() {
  const { ref, visible } = useInView(0.06)

  return (
    <section id="pricing" ref={ref} aria-labelledby="pricing-title"
      style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
      <style>{`
        .plans-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; align-items:center; }
        .plan-card  { border-radius:22px; padding:32px 28px; position:relative; overflow:hidden;
                      transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s, border-color 0.25s; }
        .plan-card:hover { transform:translateY(-6px); }
        .plan-card.highlight { transform:scale(1.04); }
        .plan-card.highlight:hover { transform:scale(1.04) translateY(-6px); }
        @media(max-width:900px){ .plans-grid{ grid-template-columns:1fr!important; max-width:420px!important; margin:0 auto!important; } .plan-card.highlight{ transform:none!important; } .plan-card.highlight:hover{ transform:translateY(-4px)!important; } }
        @media(max-width:640px){ #pricing{ padding:72px 20px!important; } }
      `}</style>

      {/* Header */}
      <div style={{
        maxWidth: 1000, margin: "0 auto 64px", textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <p style={{ color:"#C9A84C", fontSize:11, letterSpacing:3.5,
          textTransform:"uppercase", fontWeight:600, marginBottom:16 }}>Tarifs</p>
        <h2 id="pricing-title" style={{
          fontFamily:"Cormorant Garamond, serif",
          fontSize:"clamp(28px,4vw,52px)",
          color:"#F5F0E8", fontWeight:700,
          margin:"0 auto 16px", lineHeight:1.1,
          maxWidth:520, letterSpacing:"-0.02em",
        }}>
          Simple, transparent,{" "}
          <span style={{ color:"#C9A84C" }}>sans surprise.</span>
        </h2>
        <p style={{ color:"rgba(138,132,120,0.8)", fontSize:16,
          maxWidth:440, margin:"0 auto", lineHeight:1.65 }}>
          Commence gratuitement. Passe au Pro quand tu es pret.
        </p>
      </div>

      {/* Cards */}
      <div style={{ maxWidth:1000, margin:"0 auto" }}>
        <div className="plans-grid">
          {PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className={"plan-card" + (plan.highlight ? " highlight" : "")}
              style={{
                background: plan.highlight
                  ? "linear-gradient(145deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))"
                  : "rgba(255,255,255,0.02)",
                border: "1px solid " + (plan.highlight
                  ? "rgba(201,168,76,0.55)"
                  : "rgba(255,255,255,0.08)"),
                boxShadow: plan.highlight
                  ? "0 0 80px rgba(201,168,76,0.18), 0 0 0 1px rgba(201,168,76,0.12)"
                  : "none",
                opacity: visible ? 1 : 0,
                transform: visible
                  ? (plan.highlight ? "scale(1.04)" : "translateY(0)")
                  : "translateY(28px)",
                transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s, border-color 0.25s, box-shadow 0.3s`,
              }}
            >
              {/* Accent top */}
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:2,
                background: plan.highlight
                  ? "linear-gradient(90deg,#C9A84C,#d4a843,#C9A84C)"
                  : "transparent",
                borderRadius:"22px 22px 0 0",
              }}/>

              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position:"absolute", top:18, right:18,
                  background:"linear-gradient(90deg,#C9A84C,#b8953f)",
                  borderRadius:20, padding:"4px 12px",
                  fontSize:10, fontWeight:800, color:"#080808",
                  letterSpacing:0.5,
                  boxShadow:"0 2px 12px rgba(201,168,76,0.4)",
                }}>{plan.badge}</div>
              )}

              {/* Plan name */}
              <p style={{
                color: plan.color, fontSize:10, fontWeight:700,
                letterSpacing:2.5, textTransform:"uppercase",
                margin:"0 0 4px",
              }}>{plan.name}</p>
              <p style={{ color:"rgba(138,132,120,0.7)", fontSize:12,
                margin:"0 0 20px", lineHeight:1.4 }}>{plan.tagline}</p>

              {/* Prix */}
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:24 }}>
                <span style={{
                  fontFamily:"Cormorant Garamond, serif",
                  color:"#F5F0E8", fontSize:48, fontWeight:700, lineHeight:1,
                }}>{plan.price}</span>
                <span style={{ color:"rgba(201,168,76,0.7)", fontSize:15, fontWeight:600 }}>€</span>
                {plan.period && (
                  <span style={{ color:"rgba(138,132,120,0.6)", fontSize:13, marginLeft:2 }}>
                    {plan.period}
                  </span>
                )}
              </div>

              {/* Séparateur */}
              <div style={{
                height:1, marginBottom:24,
                background: plan.highlight
                  ? "linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)"
                  : "rgba(255,255,255,0.06)",
              }}/>

              {/* Features */}
              <div style={{ display:"flex", flexDirection:"column", gap:11, marginBottom:28 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{
                      width:16, height:16, borderRadius:"50%", flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:9,
                      background: f.ok
                        ? "rgba(57,255,143,0.15)"
                        : "rgba(138,132,120,0.08)",
                      color: f.ok ? "#39FF8F" : "rgba(138,132,120,0.4)",
                    }}>{f.ok ? "✓" : "✕"}</span>
                    <span style={{
                      color: f.ok ? "rgba(245,240,232,0.85)" : "rgba(138,132,120,0.45)",
                      fontSize:13.5,
                      textDecoration: f.ok ? "none" : "none",
                    }}>{f.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link href={plan.ctaHref} style={{
                display:"block", textAlign:"center", textDecoration:"none",
                padding:"13px 24px", borderRadius:11,
                fontWeight:700, fontSize:14, letterSpacing:0.1,
                background: plan.highlight
                  ? "linear-gradient(90deg,#C9A84C,#b8953f)"
                  : "transparent",
                color: plan.highlight ? "#080808" : plan.color,
                border: plan.highlight ? "none" : "1px solid " + plan.color + "40",
                transition:"all 0.2s ease",
                boxShadow: plan.highlight ? "0 4px 20px rgba(201,168,76,0.35)" : "none",
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  if (plan.highlight) {
                    el.style.boxShadow = "0 6px 28px rgba(201,168,76,0.5)"
                    el.style.transform = "translateY(-1px)"
                  } else {
                    el.style.background = plan.color + "12"
                    el.style.borderColor = plan.color + "70"
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  if (plan.highlight) {
                    el.style.boxShadow = "0 4px 20px rgba(201,168,76,0.35)"
                    el.style.transform = "none"
                  } else {
                    el.style.background = "transparent"
                    el.style.borderColor = plan.color + "40"
                  }
                }}>
                {plan.cta}
              </Link>

              {/* Note sous le CTA */}
              {plan.note && (
                <p style={{
                  color:"rgba(138,132,120,0.6)", fontSize:11,
                  textAlign:"center", margin:"12px 0 0", lineHeight:1.5,
                }}>{plan.note}</p>
              )}
            </div>
          ))}
        </div>

        {/* Lien comparaison complète */}
        <div style={{
          textAlign:"center", marginTop:40,
          opacity: visible ? 1 : 0,
          transition:"opacity 0.6s ease 0.5s",
        }}>
          <Link href="/upgrade" style={{
            color:"rgba(138,132,120,0.6)", fontSize:13,
            textDecoration:"none", display:"inline-flex",
            alignItems:"center", gap:6,
            transition:"color 0.2s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#C9A84C" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(138,132,120,0.6)" }}>
            Voir la comparaison complete des plans
            <span style={{ fontSize:14 }}>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}


// ── Proof strip ───────────────────────────────────────────────────────────────
const PROOFS = [
  {
    icon: "⚡",
    value: "5 min",
    label: "pour créer une page complète",
    sub: "Sans coder, sans designer",
  },
  {
    icon: "🔄",
    value: "QR dynamique",
    label: "Modifie le contenu sans changer le QR",
    sub: "Le lien reste le même, toujours",
  },
  {
    icon: "📊",
    value: "Analytics",
    label: "Scans, vues, appareils en temps réel",
    sub: "Inclus dans tous les plans",
  },
  {
    icon: "🎨",
    value: "Templates",
    label: "Prêts à l'emploi, adaptés au mobile",
    sub: "Personnalisables en un clic",
  },
] as const

function ProofStrip() {
  const { ref, visible } = useInView(0.1)
  return (
    <section
      ref={ref}
      aria-label="Points clés"
      style={{
        padding: "0 48px 80px",
        position: "relative", zIndex: 1,
      }}
    >
      <div style={{
        maxWidth: 1140, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
      }} className="proof-grid">
        {PROOFS.map((p, i) => (
          <div
            key={p.value}
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(201,168,76,0.12)",
              borderRadius: 16,
              padding: "24px 22px",
              display: "flex", flexDirection: "column", gap: 10,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transition: `opacity 0.5s ease ${i * 90}ms, transform 0.5s ease ${i * 90}ms`,
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Accent line top */}
            <div style={{
              position: "absolute", top: 0, left: 24, right: 24, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)",
            }} />
            {/* Icon */}
            <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">{p.icon}</span>
            {/* Value */}
            <p style={{
              color: "#C9A84C",
              fontSize: 18, fontWeight: 700,
              margin: 0, letterSpacing: "-0.01em",
              fontFamily: "Cormorant Garamond, serif",
            }}>{p.value}</p>
            {/* Label */}
            <p style={{
              color: "#F5F0E8", fontSize: 13, fontWeight: 500,
              margin: 0, lineHeight: 1.45,
            }}>{p.label}</p>
            {/* Sub */}
            <p style={{
              color: "rgba(138,132,120,0.75)", fontSize: 11.5,
              margin: 0, lineHeight: 1.4,
            }}>{p.sub}</p>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) { .proof-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 480px) { .proof-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .proof-grid { padding: 0 !important; } }
      `}</style>
    </section>
  )
}
// ── Templates section ─────────────────────────────────────────────────────────
const TEMPLATE_DATA = [
  {
    id: "restaurant",
    name: "Restaurant & Bar",
    category: "Food & Beverage",
    blocks: 7,
    isPro: false,
    accent: "#F97316",
    icon: "🍽️",
    preview: [
      { type: "avatar", label: "Logo & Nom" },
      { type: "bar",    color: "rgba(249,115,22,0.5)", w: "85%" },
      { type: "bar",    color: "rgba(249,115,22,0.25)", w: "65%" },
      { type: "grid2",  color: "rgba(249,115,22,0.15)" },
      { type: "btn",    color: "rgba(249,115,22,0.35)", label: "Voir le menu" },
    ],
  },
  {
    id: "freelance",
    name: "Freelance Pro",
    category: "Services",
    blocks: 6,
    isPro: false,
    accent: "#38BDF8",
    icon: "💼",
    preview: [
      { type: "avatar", label: "Photo & Titre" },
      { type: "bar",    color: "rgba(56,189,248,0.5)", w: "70%" },
      { type: "tags",   color: "rgba(56,189,248,0.2)" },
      { type: "bar",    color: "rgba(56,189,248,0.2)", w: "90%" },
      { type: "btn",    color: "rgba(56,189,248,0.35)", label: "Me contacter" },
    ],
  },
  {
    id: "coach",
    name: "Coach & Therapeute",
    category: "Bien-être",
    blocks: 8,
    isPro: false,
    accent: "#39FF8F",
    icon: "🧘",
    preview: [
      { type: "avatar", label: "Portrait" },
      { type: "bar",    color: "rgba(57,255,143,0.45)", w: "80%" },
      { type: "bar",    color: "rgba(57,255,143,0.2)",  w: "60%" },
      { type: "bar",    color: "rgba(57,255,143,0.15)", w: "75%" },
      { type: "btn",    color: "rgba(57,255,143,0.3)", label: "Prendre RDV" },
    ],
  },
  {
    id: "artist",
    name: "Artiste & Musicien",
    category: "Creatif",
    blocks: 7,
    isPro: true,
    accent: "#A78BFA",
    icon: "🎵",
    preview: [
      { type: "avatar", label: "Photo artistique" },
      { type: "bar",    color: "rgba(167,139,250,0.5)", w: "90%" },
      { type: "grid3",  color: "rgba(167,139,250,0.2)" },
      { type: "bar",    color: "rgba(167,139,250,0.2)", w: "60%" },
      { type: "btn",    color: "rgba(167,139,250,0.35)", label: "Ecouter" },
    ],
  },
  {
    id: "immo",
    name: "Agent Immobilier",
    category: "Immobilier",
    blocks: 6,
    isPro: true,
    accent: "#C9A84C",
    icon: "🏠",
    preview: [
      { type: "avatar", label: "Agent" },
      { type: "bar",    color: "rgba(201,168,76,0.5)", w: "75%" },
      { type: "grid2",  color: "rgba(201,168,76,0.15)" },
      { type: "bar",    color: "rgba(201,168,76,0.2)", w: "55%" },
      { type: "btn",    color: "rgba(201,168,76,0.35)", label: "Estimer" },
    ],
  },
  {
    id: "boutique",
    name: "Boutique E-commerce",
    category: "Commerce",
    blocks: 9,
    isPro: true,
    accent: "#F43F5E",
    icon: "🛍️",
    preview: [
      { type: "avatar", label: "Marque" },
      { type: "bar",    color: "rgba(244,63,94,0.45)", w: "80%" },
      { type: "grid3",  color: "rgba(244,63,94,0.2)" },
      { type: "bar",    color: "rgba(244,63,94,0.15)", w: "65%" },
      { type: "btn",    color: "rgba(244,63,94,0.35)", label: "Commander" },
    ],
  },
] as const

function TemplateMiniPreview({ preview, accent }: { preview: readonly {type:string;color?:string;w?:string;label?:string}[]; accent: string }) {
  return (
    <div style={{
      background: "#0c0a08",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10, padding: "10px 10px",
      display: "flex", flexDirection: "column", gap: 6,
      height: 120,
    }}>
      {preview.map((p, i) => {
        if (p.type === "avatar") return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%",
              background: `linear-gradient(135deg, ${accent}, ${accent}80)`, flexShrink: 0 }} />
            <div style={{ height: 5, width: "50%", borderRadius: 3,
              background: "rgba(245,240,232,0.18)" }} />
          </div>
        )
        if (p.type === "bar") return (
          <div key={i} style={{ height: 6, width: p.w ?? "100%", borderRadius: 3,
            background: p.color }} />
        )
        if (p.type === "btn") return (
          <div key={i} style={{ height: 20, borderRadius: 5,
            background: p.color, display: "flex", alignItems: "center",
            justifyContent: "center", marginTop: "auto" }}>
            <div style={{ height: 4, width: "45%", borderRadius: 2,
              background: "rgba(255,255,255,0.4)" }} />
          </div>
        )
        if (p.type === "grid2") return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {[0,1].map(j => (
              <div key={j} style={{ height: 16, borderRadius: 4, background: p.color }} />
            ))}
          </div>
        )
        if (p.type === "grid3") return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
            {[0,1,2].map(j => (
              <div key={j} style={{ height: 14, borderRadius: 3, background: p.color }} />
            ))}
          </div>
        )
        if (p.type === "tags") return (
          <div key={i} style={{ display: "flex", gap: 4 }}>
            {[0,1,2].map(j => (
              <div key={j} style={{ height: 12, width: 28 + j * 8, borderRadius: 6,
                background: p.color }} />
            ))}
          </div>
        )
        return null
      })}
    </div>
  )
}

function TemplateCard({ tpl, i, visible }: { tpl: typeof TEMPLATE_DATA[number]; i: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.018)",
        border: `1px solid ${hovered ? tpl.accent + "40" : "rgba(201,168,76,0.1)"}`,
        borderRadius: 18, padding: "20px",
        display: "flex", flexDirection: "column", gap: 14,
        position: "relative", overflow: "hidden",
        transform: visible ? (hovered ? "translateY(-4px)" : "translateY(0)") : "translateY(28px)",
        opacity: visible ? 1 : 0,
        transition: `opacity 0.5s ease ${i * 80}ms, transform ${hovered ? "0.3s cubic-bezier(0.34,1.56,0.64,1)" : "0.5s ease " + i * 80 + "ms"}, border-color 0.25s, background 0.25s`,
        boxShadow: hovered ? `0 8px 28px rgba(0,0,0,0.35), 0 0 0 1px ${tpl.accent}18` : "none",
        cursor: "default",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: hovered
          ? `linear-gradient(90deg, transparent, ${tpl.accent}60, transparent)`
          : "linear-gradient(90deg, transparent, rgba(201,168,76,0.12), transparent)",
        transition: "background 0.3s",
      }} />

      {/* Badge Pro/Free */}
      <div style={{ position: "absolute", top: 14, right: 14 }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 1.5,
          padding: "3px 8px", borderRadius: 20,
          background: tpl.isPro ? "rgba(167,139,250,0.15)" : "rgba(57,255,143,0.12)",
          border: `1px solid ${tpl.isPro ? "rgba(167,139,250,0.35)" : "rgba(57,255,143,0.3)"}`,
          color: tpl.isPro ? "#A78BFA" : "#39FF8F",
        }}>{tpl.isPro ? "PRO" : "GRATUIT"}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${tpl.accent}14`, border: `1px solid ${tpl.accent}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
          transition: "background 0.2s, border-color 0.2s",
          ...(hovered && { background: `${tpl.accent}22`, borderColor: `${tpl.accent}50` }),
        }}>{tpl.icon}</div>
        <div>
          <h3 style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>
            {tpl.name}
          </h3>
          <span style={{ color: tpl.accent, fontSize: 10, fontWeight: 600,
            letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.75 }}>
            {tpl.category}
          </span>
        </div>
      </div>

      {/* Mini preview */}
      <TemplateMiniPreview preview={tpl.preview} accent={tpl.accent} />

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "rgba(138,132,120,0.6)", fontSize: 11 }}>
          {tpl.blocks} blocs inclus
        </span>
        <a href="/dashboard/templates" style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          color: hovered ? tpl.accent : "#C9A84C",
          textDecoration: "none", fontSize: 12, fontWeight: 600,
          transition: "color 0.2s",
        }}>
          Utiliser <span style={{ fontSize: 13 }}>→</span>
        </a>
      </div>
    </div>
  )
}

function TemplatesSection() {
  const { ref, visible } = useInView(0.06)
  return (
    <section id="templates" ref={ref} aria-labelledby="templates-title"
      style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
      <style>{`
        .tpl-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        @media(max-width:900px){ .tpl-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media(max-width:580px){
          .tpl-grid { display:flex !important; gap:14px !important;
            overflow-x:auto !important; scroll-snap-type:x mandatory !important;
            padding-bottom:16px !important; -webkit-overflow-scrolling:touch !important; }
          .tpl-grid > * { min-width:280px !important; scroll-snap-align:start !important; }
        }
        .tpl-grid::-webkit-scrollbar { height:4px; }
        .tpl-grid::-webkit-scrollbar-track { background:rgba(255,255,255,0.04); border-radius:2px; }
        .tpl-grid::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.3); border-radius:2px; }
        @media(max-width:640px){ #templates { padding:72px 24px !important; } }
      `}</style>

      {/* Header */}
      <div style={{
        maxWidth: 1140, margin: "0 auto 64px", textAlign: "center",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <p style={{ color: "#C9A84C", fontSize: 11, letterSpacing: 3.5,
          textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>Templates</p>
        <h2 id="templates-title" style={{
          fontFamily: "Cormorant Garamond, serif",
          fontSize: "clamp(28px, 4vw, 52px)",
          color: "#F5F0E8", fontWeight: 700, margin: "0 auto 20px",
          lineHeight: 1.1, maxWidth: 620, letterSpacing: "-0.02em",
        }}>
          Des templates prets{" "}
          <span style={{ color: "#C9A84C" }}>pour ton metier.</span>
        </h2>
        <p style={{
          color: "rgba(138,132,120,0.85)", fontSize: 16,
          maxWidth: 540, margin: "0 auto", lineHeight: 1.7,
        }}>
          Restaurant, freelance, coach, artiste, immobilier, commerce :{" "}
          commence avec une page deja structuree.
        </p>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <div className="tpl-grid">
          {TEMPLATE_DATA.map((tpl, i) => (
            <TemplateCard key={tpl.id} tpl={tpl} i={i} visible={visible} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        textAlign: "center", marginTop: 52,
        opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 0.65s",
      }}>
        <a href="/dashboard/templates" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "transparent",
          border: "1px solid rgba(201,168,76,0.25)",
          color: "#C9A84C", textDecoration: "none",
          fontSize: 14, fontWeight: 600,
          padding: "12px 28px", borderRadius: 10,
          transition: "all 0.2s ease",
        }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = "rgba(201,168,76,0.08)"
            el.style.borderColor = "rgba(201,168,76,0.5)"
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = "transparent"
            el.style.borderColor = "rgba(201,168,76,0.25)"
          }}>
          Voir tous les templates
          <span style={{ fontSize: 16 }}>→</span>
        </a>
      </div>
    </section>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Fonctionnalites", href: "#features"  },
  { label: "Templates",       href: "#templates" },
  { label: "Exemples",        href: "#examples"  },
  { label: "Tarifs",          href: "#pricing"   },
  { label: "FAQ",             href: "#faq"       },
]
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active,   setActive]   = useState("")
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])
  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.href.replace("#",""))
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: "-40% 0px -55% 0px" }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])
  return (
    <>
      <style>{`
        .nl::after{content:"";position:absolute;bottom:-2px;left:0;right:0;height:1.5px;
          background:linear-gradient(90deg,#C9A84C,#d4a843);transform:scaleX(0);
          transform-origin:left;transition:transform 0.25s ease;border-radius:2px;}
        .nl:hover::after,.nl.act::after{transform:scaleX(1);}
        .nl:hover{color:#F5F0E8 !important;}
        .nl:focus-visible,.nct:focus-visible{outline:2px solid rgba(201,168,76,0.6);outline-offset:4px;border-radius:4px;}
        .ml{display:block;color:#8A8478;text-decoration:none;font-size:18px;padding:16px 0;
          border-bottom:1px solid rgba(201,168,76,0.08);transition:color 0.2s;}
        .ml:hover,.ml.act{color:#F5F0E8;}
        @keyframes slideMenu{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:900px){.dNav{display:none !important;}.brg{display:flex !important;}}
        @media(min-width:901px){.brg{display:none !important;}#mobileMenu{display:none !important;}}
        @media(max-width:640px){.navWrap{padding:0 20px !important;}}
        @media(prefers-reduced-motion:reduce){.nl::after{transition:none;}}
      `}</style>
      <nav aria-label="Navigation principale" className="navWrap" style={{
        position:"fixed",top:0,left:0,right:0,zIndex:200,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 48px",height:68,
        background:scrolled?"rgba(8,8,8,0.93)":"rgba(8,8,8,0.65)",
        backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
        borderBottom:scrolled?"1px solid rgba(201,168,76,0.2)":"1px solid rgba(201,168,76,0.07)",
        boxShadow:scrolled?"0 4px 32px rgba(0,0,0,0.5)":"none",
        transition:"background 0.3s,border-color 0.3s,box-shadow 0.3s",
      }}>
        <Link href="/" style={{textDecoration:"none"}}>
          <span style={{fontFamily:"Cormorant Garamond, serif",fontSize:22,color:"#C9A84C",fontWeight:700}}>QRfolio</span>
        </Link>
        <div className="dNav" role="menubar" style={{display:"flex",alignItems:"center",gap:32}}>
          {NAV_LINKS.map(({label,href})=>{
            const id=href.replace("#",""); const isAct=active===id
            return(<Link key={href} href={href} role="menuitem" aria-current={isAct?"page":undefined}
              className={"nl"+(isAct?" act":"")}
              style={{color:isAct?"#F5F0E8":"#8A8478",textDecoration:"none",fontSize:14,
                fontWeight:isAct?600:400,position:"relative",paddingBottom:2,transition:"color 0.2s"}}>{label}</Link>)
          })}
        </div>
        <div className="dNav" style={{display:"flex",alignItems:"center",gap:16}}>
          <Link href="/auth/login" className="nl"
            style={{color:"#8A8478",textDecoration:"none",fontSize:14,position:"relative",paddingBottom:2,transition:"color 0.2s"}}>Connexion</Link>
          <Link href="/auth/signup" className="nct" style={{
            background:"linear-gradient(90deg,#C9A84C,#b8953f)",color:"#080808",
            textDecoration:"none",fontSize:14,fontWeight:700,padding:"9px 22px",borderRadius:10,
            display:"inline-block",boxShadow:"0 2px 16px rgba(201,168,76,0.3)",
            transition:"transform 0.2s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s",
          }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="translateY(-2px) scale(1.03)";el.style.boxShadow="0 6px 24px rgba(201,168,76,0.5)"}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="none";el.style.boxShadow="0 2px 16px rgba(201,168,76,0.3)"}}>
            Commencer
          </Link>
          <button onClick={()=>setMenuOpen(o=>!o)} aria-label={menuOpen?"Fermer":"Menu"}
            aria-expanded={menuOpen} aria-controls="mobileMenu" className="brg"
            style={{display:"none",background:"none",border:"none",cursor:"pointer",
              padding:8,flexDirection:"column",gap:5,alignItems:"center",justifyContent:"center"}}>
            {[
              {tf:menuOpen?"rotate(45deg) translate(4.5px,4.5px)":"none",op:1},
              {tf:"none",op:menuOpen?0:1},
              {tf:menuOpen?"rotate(-45deg) translate(4.5px,-4.5px)":"none",op:1},
            ].map((s,i)=>(
              <span key={i} style={{display:"block",width:22,height:1.5,background:"#C9A84C",
                borderRadius:2,transform:s.tf,opacity:s.op,transition:"transform 0.25s,opacity 0.2s"}}/>
            ))}
          </button>
        </div>
      </nav>
      {menuOpen&&(
        <div id="mobileMenu" role="dialog" aria-label="Menu mobile" style={{
          position:"fixed",top:68,left:0,right:0,bottom:0,zIndex:199,
          background:"rgba(8,8,8,0.97)",backdropFilter:"blur(20px)",
          padding:"32px",display:"flex",flexDirection:"column",
          animation:"slideMenu 0.25s ease",overflowY:"auto",
        }}>
          {NAV_LINKS.map(({label,href})=>(
            <Link key={href} href={href}
              className={"ml"+(active===href.replace("#","")?" act":"")}
              onClick={()=>setMenuOpen(false)}>{label}</Link>
          ))}
          <div style={{marginTop:32,display:"flex",flexDirection:"column",gap:12}}>
            <Link href="/auth/login" onClick={()=>setMenuOpen(false)} style={{
              display:"block",textAlign:"center",color:"#8A8478",textDecoration:"none",
              fontSize:16,padding:"14px",border:"1px solid rgba(201,168,76,0.15)",borderRadius:12}}>Connexion</Link>
            <Link href="/auth/signup" onClick={()=>setMenuOpen(false)} style={{
              display:"block",textAlign:"center",
              background:"linear-gradient(90deg,#C9A84C,#b8953f)",
              color:"#080808",textDecoration:"none",fontSize:16,fontWeight:700,
              padding:"16px",borderRadius:12,boxShadow:"0 4px 24px rgba(201,168,76,0.4)"}}>
              Commencer gratuitement →</Link>
          </div>
        </div>
      )}
    </>
  )
}

// ── How it works ──────────────────────────────────────────────────────────────
const HOW_STEPS = [
  {icon:"🎨",title:"Choisis un template",   desc:"Selectionne parmi nos modeles concus pour convertir. Adapte a ton secteur."},
  {icon:"✏️", title:"Personnalise ta page",  desc:"Ajoute tes infos, liens, photo. Zero code, resultat professionnel en minutes."},
  {icon:"📱",title:"Genere ton QR code",    desc:"Un QR dynamique est cree automatiquement. Change ta page sans le reimprimer."},
  {icon:"🚀",title:"Partage partout",        desc:"Cartes de visite, reseaux, emails, en presentiel. Un seul QR, partout."},
  {icon:"📊",title:"Analyse les resultats", desc:"Vois qui scanne, quand et depuis quel appareil. En temps reel."},
] as const
function HowItWorks() {
  const {ref,visible}=useInView(0.08)
  return(
    <section id="how" ref={ref} aria-labelledby="how-title"
      style={{padding:"100px 48px",position:"relative",zIndex:1}}>
      <style>{`
        .hsteps{display:grid;grid-template-columns:repeat(5,1fr);gap:20px;position:relative;}
        .hstep{display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px;}
        .hline{position:absolute;top:44px;left:calc(10%+28px);right:calc(10%+28px);height:1px;
          background:linear-gradient(90deg,transparent,rgba(201,168,76,0.25)10%,rgba(201,168,76,0.25)90%,transparent);
          pointer-events:none;}
        @media(max-width:900px){.hsteps{grid-template-columns:1fr!important;gap:0!important;}
          .hline{display:none!important;}
          .hstep{flex-direction:row!important;text-align:left!important;align-items:flex-start!important;
            gap:20px!important;padding:24px 0!important;border-bottom:1px solid rgba(201,168,76,0.07)!important;}
          .hstep:last-child{border-bottom:none!important;}}
        @media(max-width:640px){#how{padding:72px 24px!important;}}
      `}</style>
      <div style={{maxWidth:1140,margin:"0 auto 72px",textAlign:"center",
        opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(24px)",
        transition:"opacity 0.6s ease,transform 0.6s ease"}}>
        <p style={{color:"#C9A84C",fontSize:11,letterSpacing:3.5,textTransform:"uppercase",fontWeight:600,marginBottom:16}}>Comment ca marche</p>
        <h2 id="how-title" style={{fontFamily:"Cormorant Garamond, serif",fontSize:"clamp(28px,4vw,52px)",
          color:"#F5F0E8",fontWeight:700,margin:"0 auto",lineHeight:1.12,maxWidth:560,letterSpacing:"-0.02em"}}>
          De zero a scannable{" "}<span style={{color:"#C9A84C"}}>en 5 minutes</span>
        </h2>
      </div>
      <div style={{maxWidth:1140,margin:"0 auto",position:"relative"}}>
        <div aria-hidden="true" className="hline" style={{opacity:visible?1:0,transition:"opacity 0.8s ease 0.3s"}}/>
        <div className="hsteps">
          {HOW_STEPS.map((step,i)=>(
            <div key={step.title} className="hstep"
              style={{opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(28px)",
                transition:`opacity 0.55s ease ${i*110}ms,transform 0.55s ease ${i*110}ms`}}>
              <div style={{position:"relative",flexShrink:0}}>
                <span style={{position:"absolute",top:-6,right:-8,width:18,height:18,borderRadius:"50%",
                  background:"linear-gradient(135deg,#C9A84C,#b8953f)",display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:9,fontWeight:800,color:"#080808",zIndex:1,
                  boxShadow:"0 0 0 2px #080808"}}>{i+1}</span>
                <div style={{width:56,height:56,borderRadius:16,background:"rgba(201,168,76,0.07)",
                  border:"1px solid rgba(201,168,76,0.18)",display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:24,boxShadow:"0 0 0 6px rgba(8,8,8,0.9)"}}>{step.icon}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <h3 style={{color:"#F5F0E8",fontSize:14,fontWeight:700,margin:0,lineHeight:1.3}}>{step.title}</h3>
                <p style={{color:"rgba(138,132,120,0.85)",fontSize:12.5,margin:0,lineHeight:1.6}}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{textAlign:"center",marginTop:64,opacity:visible?1:0,transition:"opacity 0.6s ease 0.7s"}}>
        <a href="/auth/signup" style={{display:"inline-flex",alignItems:"center",gap:10,
          background:"transparent",border:"1px solid rgba(201,168,76,0.3)",
          color:"#C9A84C",textDecoration:"none",fontSize:14,fontWeight:600,
          padding:"12px 28px",borderRadius:10,transition:"all 0.2s ease"}}
          onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background="rgba(201,168,76,0.08)";el.style.borderColor="rgba(201,168,76,0.55)"}}
          onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background="transparent";el.style.borderColor="rgba(201,168,76,0.3)"}}>
          Essayer maintenant — c'est gratuit <span style={{fontSize:16}}>→</span>
        </a>
      </div>
    </section>
  )
}

// ── Builder section ───────────────────────────────────────────────────────────
function BuilderMockup(){
  const BL=[{icon:"👤",label:"Profil",c:"#C9A84C"},{icon:"🔗",label:"Liens",c:"#38BDF8"},
    {icon:"📸",label:"Galerie",c:"#A78BFA"},{icon:"💬",label:"WhatsApp",c:"#39FF8F"},
    {icon:"📅",label:"Reservation",c:"#F97316"},{icon:"💳",label:"Paiement",c:"#F43F5E"}]
  const PH=[{h:28,c:"rgba(201,168,76,0.5)",w:"80%"},{h:14,c:"rgba(255,255,255,0.12)",w:"60%"},
    {h:10,c:"rgba(201,168,76,0.25)",w:"40%"},{h:32,c:"rgba(56,189,248,0.25)",w:"90%"},
    {h:12,c:"rgba(255,255,255,0.08)",w:"70%"},{h:28,c:"rgba(57,255,143,0.2)",w:"85%"}]
  return(
    <div className="bm" style={{display:"grid",gridTemplateColumns:"1fr 2.2fr 1fr",gap:12,alignItems:"start",maxWidth:820,margin:"0 auto"}}>
      <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(201,168,76,0.12)",borderRadius:14,padding:"14px 10px",display:"flex",flexDirection:"column",gap:6}}>
        <p style={{color:"rgba(201,168,76,0.6)",fontSize:9,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:4,paddingLeft:4}}>Blocs</p>
        {BL.map(b=>(<div key={b.label} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
          <span style={{fontSize:14}}>{b.icon}</span>
          <span style={{color:"rgba(245,240,232,0.7)",fontSize:11,fontWeight:500}}>{b.label}</span>
          <span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:b.c,opacity:0.7,flexShrink:0}}/>
        </div>))}
      </div>
      <div style={{background:"rgba(255,255,255,0.018)",border:"1px solid rgba(201,168,76,0.15)",borderRadius:16,padding:16,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,paddingBottom:10,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          {["#FF6B6B","#F97316","#39FF8F"].map((c,i)=>(<div key={i} style={{width:8,height:8,borderRadius:"50%",background:c,opacity:0.6}}/>))}
          <span style={{flex:1,textAlign:"center",color:"rgba(201,168,76,0.5)",fontSize:10,letterSpacing:1}}>Canvas</span>
          <div style={{padding:"3px 10px",borderRadius:5,background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.25)",fontSize:9,color:"#C9A84C",fontWeight:700}}>PUBLIER</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"16px 12px",background:"rgba(201,168,76,0.04)",border:"1px dashed rgba(201,168,76,0.2)",borderRadius:10}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#C9A84C,#b8953f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👤</div>
            <div style={{height:7,width:"60%",borderRadius:4,background:"rgba(245,240,232,0.2)"}}/>
            <div style={{height:5,width:"40%",borderRadius:4,background:"rgba(245,240,232,0.1)"}}/>
          </div>
          <div style={{padding:"10px 12px",borderRadius:9,background:"linear-gradient(90deg,rgba(201,168,76,0.25),rgba(201,168,76,0.12))",border:"1px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>💬</span><div style={{height:6,width:"50%",borderRadius:3,background:"rgba(201,168,76,0.5)"}}/>
          </div>
          <div style={{padding:"10px 12px",borderRadius:9,background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>🔗</span><div style={{height:5,width:"65%",borderRadius:3,background:"rgba(56,189,248,0.3)"}}/>
          </div>
          <div style={{padding:"10px 12px",borderRadius:9,background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.12)",display:"flex",gap:6}}>
            {[0,1,2].map(i=>(<div key={i} style={{flex:1,height:28,borderRadius:6,background:"rgba(167,139,250,0.2)"}}/>))}
          </div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <p style={{color:"rgba(201,168,76,0.5)",fontSize:9,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Apercu</p>
        <div style={{width:88,border:"2px solid rgba(201,168,76,0.25)",borderRadius:18,padding:"10px 6px",background:"rgba(8,8,8,0.8)",boxShadow:"0 0 24px rgba(201,168,76,0.08)",display:"flex",flexDirection:"column"}}>
          <div style={{width:24,height:4,borderRadius:2,background:"rgba(255,255,255,0.1)",margin:"0 auto 8px"}}/>
          <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"center"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#C9A84C,#b8953f)",marginBottom:2}}/>
            {PH.map((b,i)=>(<div key={i} style={{height:b.h,width:b.w,borderRadius:5,background:b.c}}/>))}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:"rgba(57,255,143,0.08)",border:"1px solid rgba(57,255,143,0.2)"}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:"#39FF8F",animation:"livePulse 1.5s ease-in-out infinite"}}/>
          <span style={{color:"#39FF8F",fontSize:9,fontWeight:700,letterSpacing:1}}>LIVE</span>
        </div>
      </div>
    </div>
  )
}
function BuilderSection(){
  const {ref,visible}=useInView(0.07)
  const BEN=[
    {icon:"🧱",title:"Blocs prets a l'emploi",desc:"Profil, liens, galerie, WhatsApp, paiement — tout y est."},
    {icon:"🎨",title:"Templates metiers",desc:"Restaurant, freelance, artiste, coach — adapte des le depart."},
    {icon:"📱",title:"Apercu mobile instantane",desc:"Vois le rendu en temps reel pendant que tu edites."},
  ]
  return(
    <section id="builder" ref={ref} aria-labelledby="builder-title"
      style={{padding:"100px 48px",position:"relative",zIndex:1}}>
      <style>{`
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}
        @media(max-width:900px){.bm{grid-template-columns:1fr 1fr!important;}}
        @media(max-width:640px){#builder{padding:72px 20px!important;}.bm{grid-template-columns:1fr!important;}}
        @media(max-width:900px){.bben{grid-template-columns:1fr!important;}}
      `}</style>
      <div style={{maxWidth:1140,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:64,opacity:visible?1:0,
          transform:visible?"translateY(0)":"translateY(24px)",transition:"opacity 0.6s,transform 0.6s"}}>
          <p style={{color:"#C9A84C",fontSize:11,letterSpacing:3.5,textTransform:"uppercase",fontWeight:600,marginBottom:16}}>Builder</p>
          <h2 id="builder-title" style={{fontFamily:"Cormorant Garamond, serif",fontSize:"clamp(28px,4vw,52px)",
            color:"#F5F0E8",fontWeight:700,margin:"0 auto 20px",lineHeight:1.1,maxWidth:680,letterSpacing:"-0.02em"}}>
            Construis une page professionnelle{" "}<span style={{color:"#C9A84C"}}>en quelques minutes.</span>
          </h2>
          <p style={{color:"rgba(138,132,120,0.85)",fontSize:16,maxWidth:520,margin:"0 auto",lineHeight:1.7}}>
            Ajoute des blocs, personnalise ton theme, publie et partage ton QR code.
          </p>
        </div>
        <div style={{opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(32px)",
          transition:"opacity 0.7s ease 0.15s,transform 0.7s ease 0.15s",marginBottom:56}}>
          <BuilderMockup/>
        </div>
        <div className="bben" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:860,margin:"0 auto"}}>
          {BEN.map((b,i)=>(
            <div key={b.title} style={{display:"flex",flexDirection:"column",gap:10,padding:"20px",
              background:"rgba(255,255,255,0.02)",border:"1px solid rgba(201,168,76,0.1)",borderRadius:14,
              opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(20px)",
              transition:`opacity 0.5s ease ${0.35+i*0.1}s,transform 0.5s ease ${0.35+i*0.1}s`}}>
              <span style={{fontSize:22}}>{b.icon}</span>
              <h3 style={{color:"#F5F0E8",fontSize:14,fontWeight:700,margin:0}}>{b.title}</h3>
              <p style={{color:"rgba(138,132,120,0.8)",fontSize:12.5,margin:0,lineHeight:1.6}}>{b.desc}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:48,opacity:visible?1:0,transition:"opacity 0.6s ease 0.7s"}}>
          <a href="/dashboard/builder" style={{display:"inline-flex",alignItems:"center",gap:10,
            background:"linear-gradient(90deg,#C9A84C,#b8953f)",color:"#080808",textDecoration:"none",
            fontSize:14,fontWeight:700,padding:"13px 30px",borderRadius:11,
            boxShadow:"0 4px 24px rgba(201,168,76,0.35)",transition:"transform 0.2s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s"}}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="translateY(-3px) scale(1.03)";el.style.boxShadow="0 8px 32px rgba(201,168,76,0.5)"}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="none";el.style.boxShadow="0 4px 24px rgba(201,168,76,0.35)"}}>
            Ouvrir le builder <span style={{fontSize:16}}>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

// ── QR Dynamique section ──────────────────────────────────────────────────────

// Mini QR code SVG généré en pur SVG (performance max, 0 dépendance)
function QRMiniSvg({ fg, bg, accent, size = 80 }: { fg: string; bg: string; accent: string; size?: number }) {
  // Matrice QR simplifiée 7x7 (pattern visuel, pas un vrai QR scannable)
  const matrix = [
    [1,1,1,1,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,0,1,1,0,1,1,0,1,1,1,0,1,0,1,1,0],
    [0,1,0,0,1,1,0,1,1,0,0,1,0,1,0,1,0,1,0,0,1],
    [1,1,0,1,0,1,1,0,1,1,0,0,1,0,1,1,0,0,1,1,0],
    [0,0,1,0,1,0,0,0,0,1,1,0,0,1,0,0,1,1,0,1,1],
    [1,0,1,0,0,1,1,1,0,1,0,1,1,0,1,0,1,0,0,1,0],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,1,0,1,1,1,1,0,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,0,0,0,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,0,1,1,0,1,0,1,0,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,0,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,0],
    [1,1,1,1,1,1,1,0,0,0,1,0,1,0,0,1,0,0,0,1,0],
  ]
  const cols = matrix[0].length
  const rows = matrix.length
  const cell = size / Math.max(cols, rows)
  // Cellules dorées (centre)
  const goldCells = new Set(['10-10','10-11','11-10','9-10','10-9'])

  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}
      xmlns="http://www.w3.org/2000/svg" style={{ display:"block" }}>
      <rect width={size} height={size} fill={bg} rx={4}/>
      {matrix.map((row, r) =>
        row.map((cell_val, c) => {
          if (!cell_val) return null
          const isGold = goldCells.has(r + "-" + c)
          return (
            <rect key={r + "-" + c}
              x={c * cell + 1} y={r * cell + 1}
              width={cell - 1.5} height={cell - 1.5}
              rx={1}
              fill={isGold ? accent : fg}
            />
          )
        })
      )}
    </svg>
  )
}

const QR_STYLES = [
  {
    id: "classic",
    name: "Classic",
    desc: "Intemporel",
    fg: "#1a1a1a", bg: "#ffffff", accent: "#C9A84C",
    cardBg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.1)",
    tag: "#8A8478",
  },
  {
    id: "gold",
    name: "Gold",
    desc: "Premium",
    fg: "#C9A84C", bg: "#111009", accent: "#F5F0E8",
    cardBg: "rgba(201,168,76,0.06)",
    border: "rgba(201,168,76,0.3)",
    tag: "#C9A84C",
  },
  {
    id: "neon",
    name: "Neon",
    desc: "Impact",
    fg: "#39FF8F", bg: "#050505", accent: "#A78BFA",
    cardBg: "rgba(57,255,143,0.05)",
    border: "rgba(57,255,143,0.25)",
    tag: "#39FF8F",
  },
  {
    id: "sunset",
    name: "Sunset",
    desc: "Chaleureux",
    fg: "#F97316", bg: "#0d0805", accent: "#F43F5E",
    cardBg: "rgba(249,115,22,0.06)",
    border: "rgba(249,115,22,0.25)",
    tag: "#F97316",
  },
  {
    id: "business",
    name: "Business",
    desc: "Institutionnel",
    fg: "#38BDF8", bg: "#030d14", accent: "#7C3AED",
    cardBg: "rgba(56,189,248,0.05)",
    border: "rgba(56,189,248,0.2)",
    tag: "#38BDF8",
  },
] as const

const QR_BENEFITS = [
  { icon: "🔄", text: "Destination modifiable à tout moment" },
  { icon: "🎨", text: "Couleurs et styles personnalisés" },
  { icon: "⬇️", text: "Téléchargement PNG · SVG · PDF" },
  { icon: "📊", text: "Analytics par scan en temps réel" },
  { icon: "🖨️", text: "Résolution print HD incluse" },
] as const

function QRDynamicSection() {
  const { ref, visible } = useInView(0.07)
  const [active, setActive] = useState(0)

  return (
    <section id="qr-dynamique" ref={ref} aria-labelledby="qr-dyn-title"
      style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
      <style>{`
        .qr-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
        .qr-card { display:flex; flex-direction:column; align-items:center; gap:14px;
          padding:20px 16px; border-radius:18px; cursor:pointer;
          transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.25s, background 0.25s; }
        .qr-card:hover { transform:translateY(-6px) scale(1.03); }
        .qr-card:focus-visible { outline:2px solid rgba(201,168,76,0.6); outline-offset:4px; border-radius:18px; }
        .qr-ben { display:flex; flex-direction:column; gap:14px; }
        @media(max-width:900px){ .qr-grid{ grid-template-columns:repeat(3,1fr)!important; } }
        @media(max-width:580px){
          .qr-grid{ grid-template-columns:repeat(2,1fr)!important; gap:10px!important; }
          #qr-dynamique{ padding:72px 20px!important; }
        }
        @keyframes qrFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes qrGlow  { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>

      <div style={{ maxWidth: 1140, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64,
          alignItems: "center", marginBottom: 72,
        }} className="qr-header">
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}>
            <p style={{ color: "#C9A84C", fontSize: 11, letterSpacing: 3.5,
              textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
              QR Codes dynamiques
            </p>
            <h2 id="qr-dyn-title" style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(28px, 3.5vw, 48px)",
              color: "#F5F0E8", fontWeight: 700,
              margin: "0 0 20px", lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
              Un QR code dynamique,{" "}
              <span style={{ color: "#C9A84C" }}>pas une image figée.</span>
            </h2>
            <p style={{ color: "rgba(138,132,120,0.85)", fontSize: 16,
              lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
              Modifie ta page ou ta destination sans jamais reimprimer ton QR code.
            </p>

            {/* Bénéfices */}
            <div className="qr-ben">
              {QR_BENEFITS.map((b, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-16px)",
                  transition: `opacity 0.5s ease ${0.2 + i * 0.08}s, transform 0.5s ease ${0.2 + i * 0.08}s`,
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13,
                  }}>{b.icon}</span>
                  <span style={{ color: "rgba(245,240,232,0.8)", fontSize: 13.5 }}>{b.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              marginTop: 36,
              opacity: visible ? 1 : 0,
              transition: "opacity 0.6s ease 0.7s",
            }}>
              <a href="/auth/signup" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "linear-gradient(90deg,#C9A84C,#b8953f)",
                color: "#080808", textDecoration: "none",
                fontSize: 14, fontWeight: 700,
                padding: "12px 26px", borderRadius: 11,
                boxShadow: "0 4px 20px rgba(201,168,76,0.35)",
                transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s",
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = "translateY(-2px) scale(1.03)"
                  el.style.boxShadow = "0 8px 28px rgba(201,168,76,0.5)"
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = "none"
                  el.style.boxShadow = "0 4px 20px rgba(201,168,76,0.35)"
                }}>
                Creer mon QR gratuit <span style={{ fontSize: 16 }}>→</span>
              </a>
            </div>
          </div>

          {/* QR actif en grand */}
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.7s ease 0.2s",
          }}>
            <div style={{
              position: "relative",
              animation: "qrFloat 4s ease-in-out infinite",
            }}>
              {/* Glow */}
              <div style={{
                position: "absolute", inset: -24,
                background: "radial-gradient(circle, " + QR_STYLES[active].tag + "25 0%, transparent 65%)",
                borderRadius: "50%",
                animation: "qrGlow 3s ease-in-out infinite",
                pointerEvents: "none",
              }} />
              {/* Card principale */}
              <div style={{
                width: 180, height: 180,
                background: QR_STYLES[active].cardBg,
                border: "1px solid " + QR_STYLES[active].border,
                borderRadius: 22,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 12,
                boxShadow: "0 0 60px " + QR_STYLES[active].tag + "30, 0 0 0 1px " + QR_STYLES[active].border,
                transition: "all 0.4s ease",
              }}>
                <QRMiniSvg
                  fg={QR_STYLES[active].fg}
                  bg={QR_STYLES[active].bg}
                  accent={QR_STYLES[active].accent}
                  size={130}
                />
                <span style={{
                  color: QR_STYLES[active].tag,
                  fontSize: 10, letterSpacing: 2.5,
                  textTransform: "uppercase", fontWeight: 700,
                }}>QRFOLIO.APP</span>
              </div>
              {/* Badge style */}
              <div style={{
                position: "absolute", top: -10, right: -10,
                background: "linear-gradient(135deg, #C9A84C, #b8953f)",
                borderRadius: 20, padding: "4px 10px",
                fontSize: 10, fontWeight: 800, color: "#080808",
                boxShadow: "0 2px 12px rgba(201,168,76,0.5)",
              }}>{QR_STYLES[active].name}</div>
            </div>
          </div>
        </div>

        {/* Grille de styles */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s",
        }}>
          <p style={{ color: "rgba(138,132,120,0.6)", fontSize: 11,
            letterSpacing: 2, textTransform: "uppercase", textAlign: "center",
            marginBottom: 20 }}>Choisir un style</p>

          <div className="qr-grid">
            {QR_STYLES.map((style, i) => (
              <button
                key={style.id}
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                aria-label={"Style " + style.name}
                className="qr-card"
                style={{
                  background: active === i ? style.cardBg : "rgba(255,255,255,0.015)",
                  border: "1px solid " + (active === i ? style.border : "rgba(255,255,255,0.07)"),
                  boxShadow: active === i ? "0 0 32px " + style.tag + "20" : "none",
                }}
              >
                <QRMiniSvg fg={style.fg} bg={style.bg} accent={style.accent} size={64} />
                <div style={{ textAlign: "center" }}>
                  <p style={{
                    color: active === i ? style.tag : "#F5F0E8",
                    fontSize: 13, fontWeight: 700, margin: "0 0 2px",
                    transition: "color 0.25s",
                  }}>{style.name}</p>
                  <p style={{ color: "rgba(138,132,120,0.7)", fontSize: 10, margin: 0 }}>
                    {style.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .qr-header { grid-template-columns:1fr!important; }
        }
      `}</style>
    </section>
  )
}

// ── Analytics section ─────────────────────────────────────────────────────────

// Données démo cohérentes (pas de chiffres marketing abusifs)
const ANALYTICS_DEMO = {
  stats: [
    { label: "Scans ce mois", value: "847",  delta: "+12%", color: "#39FF8F",  icon: "📱" },
    { label: "Vues de page",  value: "2 341", delta: "+8%",  color: "#38BDF8",  icon: "👁️" },
    { label: "Taux de clic",  value: "36%",   delta: "+4pt", color: "#C9A84C",  icon: "🎯" },
    { label: "QR actifs",     value: "5",     delta: "",      color: "#A78BFA",  icon: "✅" },
  ],
  chart: [
    { day: "L",  scans: 38,  views: 102 },
    { day: "M",  scans: 52,  views: 141 },
    { day: "M",  scans: 41,  views: 118 },
    { day: "J",  scans: 67,  views: 184 },
    { day: "V",  scans: 84,  views: 231 },
    { day: "S",  scans: 121, views: 312 },
    { day: "D",  scans: 93,  views: 248 },
  ],
  pages: [
    { name: "Ma carte pro",   scans: 312, bar: 100, color: "#C9A84C"  },
    { name: "Menu restaurant",scans: 198, bar: 63,  color: "#38BDF8"  },
    { name: "Portfolio",      scans: 142, bar: 45,  color: "#A78BFA"  },
    { name: "Promo flash",    scans: 89,  bar: 28,  color: "#39FF8F"  },
  ],
  devices: [
    { label: "Mobile", pct: 72, color: "#C9A84C"  },
    { label: "Tablette",pct: 18, color: "#38BDF8" },
    { label: "Desktop", pct: 10, color: "#A78BFA" },
  ],
  sources: [
    { label: "Direct QR",    pct: 58, color: "#C9A84C" },
    { label: "Réseaux soc.", pct: 24, color: "#F97316" },
    { label: "Email",        pct: 11, color: "#38BDF8" },
    { label: "Autre",        pct: 7,  color: "#8A8478" },
  ],
}

const ANALYTICS_BENEFITS = [
  { icon: "📍", text: "Savoir quels QR codes fonctionnent vraiment" },
  { icon: "📱", text: "Comprendre les appareils de tes visiteurs" },
  { icon: "🎯", text: "Optimiser tes CTA et pages de destination" },
  { icon: "📈", text: "Suivre ta croissance semaine après semaine" },
]

function AnalyticsMockup() {
  const maxScans = Math.max(...ANALYTICS_DEMO.chart.map(d => d.scans))
  const maxViews = Math.max(...ANALYTICS_DEMO.chart.map(d => d.views))
  const chartH = 80

  return (
    <div style={{
      background: "linear-gradient(145deg, #0e0c08, #111009)",
      border: "1px solid rgba(201,168,76,0.18)",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["#FF6B6B","#F97316","#39FF8F"].map((c,i) => (
            <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:c, opacity:0.6 }}/>
          ))}
          <span style={{ color:"rgba(201,168,76,0.5)", fontSize:10, letterSpacing:1.5, marginLeft:4 }}>ANALYTICS</span>
        </div>
        <div style={{
          background: "rgba(57,255,143,0.1)", border: "1px solid rgba(57,255,143,0.25)",
          borderRadius: 6, padding: "3px 10px",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:"#39FF8F", animation:"livePulse 1.5s ease-in-out infinite" }}/>
          <span style={{ color:"#39FF8F", fontSize:9, fontWeight:700, letterSpacing:1 }}>LIVE</span>
        </div>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* 4 KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {ANALYTICS_DEMO.stats.map((s) => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, padding: "10px 10px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              <p style={{ color: s.color, fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: "rgba(138,132,120,0.7)", fontSize: 9, margin: 0, lineHeight: 1.3 }}>{s.label}</p>
              {s.delta && (
                <span style={{ color: "#39FF8F", fontSize: 8, fontWeight: 700 }}>{s.delta}</span>
              )}
            </div>
          ))}
        </div>

        {/* Graphique barres — scans 7 jours */}
        <div style={{
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 12, padding: "12px 14px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ color: "#F5F0E8", fontSize: 11, fontWeight: 600, margin: 0 }}>Scans · 7 jours</p>
            <div style={{ display: "flex", gap: 10 }}>
              {[["#C9A84C","Scans"],["#38BDF8","Vues"]].map(([c,l]) => (
                <div key={l as string} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:6, height:6, borderRadius:2, background:c as string }}/>
                  <span style={{ color:"rgba(138,132,120,0.7)", fontSize:9 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: chartH + 16 }}>
            {ANALYTICS_DEMO.chart.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2, width: "100%" }}>
                  {/* Vues bar (derrière) */}
                  <div style={{
                    width: "100%", borderRadius: "3px 3px 0 0",
                    background: "rgba(56,189,248,0.2)",
                    height: Math.round((d.views / maxViews) * chartH) + "px",
                  }}/>
                  {/* Scans bar (devant, plus courte) */}
                  <div style={{
                    position: "absolute",
                    width: "40%", borderRadius: "2px 2px 0 0",
                    background: "linear-gradient(to top, #C9A84C, #d4a843)",
                    height: Math.round((d.scans / maxScans) * chartH) + "px",
                    alignSelf: "center",
                  }}/>
                </div>
                <span style={{ color: "rgba(138,132,120,0.5)", fontSize: 8 }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ligne du bas: top pages + appareils + sources */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 10 }}>

          {/* Top pages */}
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 12, padding: "12px",
          }}>
            <p style={{ color: "#F5F0E8", fontSize: 10, fontWeight: 600, margin: "0 0 10px" }}>Top pages</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {ANALYTICS_DEMO.pages.map((p) => (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: "rgba(245,240,232,0.7)", fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{p.name}</span>
                    <span style={{ color: p.color, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{p.scans}</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: p.bar + "%", background: p.color, borderRadius: 2, opacity: 0.7 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Appareils */}
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 12, padding: "12px",
          }}>
            <p style={{ color: "#F5F0E8", fontSize: 10, fontWeight: 600, margin: "0 0 10px" }}>Appareils</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ANALYTICS_DEMO.devices.map((d) => (
                <div key={d.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: "rgba(245,240,232,0.7)", fontSize: 9 }}>{d.label}</span>
                    <span style={{ color: d.color, fontSize: 9, fontWeight: 700 }}>{d.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: d.pct + "%", background: d.color, borderRadius: 2, opacity: 0.8 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 12, padding: "12px",
          }}>
            <p style={{ color: "#F5F0E8", fontSize: 10, fontWeight: 600, margin: "0 0 10px" }}>Sources</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ANALYTICS_DEMO.sources.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }}/>
                  <span style={{ color: "rgba(245,240,232,0.65)", fontSize: 9, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                  <span style={{ color: s.color, fontSize: 9, fontWeight: 700 }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function AnalyticsSection() {
  const { ref, visible } = useInView(0.06)
  return (
    <section id="analytics" ref={ref} aria-labelledby="analytics-title"
      style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
      <style>{`
        .analytics-layout { display:grid; grid-template-columns:1fr 1.5fr; gap:72px; align-items:center; }
        @media(max-width:1024px){ .analytics-layout{ grid-template-columns:1fr!important; gap:48px!important; } }
        @media(max-width:640px){ #analytics{ padding:72px 20px!important; } }
      `}</style>

      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <div className="analytics-layout">

          {/* Left: texte + bénéfices */}
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}>
            <p style={{ color: "#C9A84C", fontSize: 11, letterSpacing: 3.5,
              textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>Analytics</p>
            <h2 id="analytics-title" style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(26px, 3.5vw, 46px)",
              color: "#F5F0E8", fontWeight: 700,
              margin: "0 0 20px", lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}>
              Comprends ce qui se passe{" "}
              <span style={{ color: "#C9A84C" }}>apres chaque scan.</span>
            </h2>
            <p style={{ color: "rgba(138,132,120,0.85)", fontSize: 15,
              lineHeight: 1.75, marginBottom: 36, maxWidth: 400 }}>
              Suivi des vues, scans, appareils, sources et pages les plus performantes.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
              {ANALYTICS_BENEFITS.map((b, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-16px)",
                  transition: `opacity 0.5s ease ${0.15 + i * 0.1}s, transform 0.5s ease ${0.15 + i * 0.1}s`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15,
                  }}>{b.icon}</div>
                  <span style={{ color: "rgba(245,240,232,0.8)", fontSize: 13.5, lineHeight: 1.4 }}>{b.text}</span>
                </div>
              ))}
            </div>

            <a href="/auth/signup" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#C9A84C", textDecoration: "none",
              fontSize: 14, fontWeight: 600,
              padding: "12px 26px", borderRadius: 10,
              transition: "all 0.2s ease",
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = "rgba(201,168,76,0.08)"
                el.style.borderColor = "rgba(201,168,76,0.55)"
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = "transparent"
                el.style.borderColor = "rgba(201,168,76,0.3)"
              }}>
              Voir mes analytics <span style={{ fontSize: 16 }}>→</span>
            </a>
          </div>

          {/* Right: mockup */}
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
          }}>
            <AnalyticsMockup />
          </div>

        </div>
      </div>
    </section>
  )
}

// ── Use cases section ─────────────────────────────────────────────────────────
const USE_CASES = [
  {
    id: "restaurant",
    icon: "🍽️",
    label: "Restaurant",
    title: "Transforme ta table en experience connectee.",
    desc: "Tes clients scannent, voient ton menu a jour, reservent et laissent un avis en 2 taps.",
    color: "#F97316",
    blocks: [
      { icon:"📋", label:"Menu interactif",   note:"Mis a jour sans reimprimer" },
      { icon:"📅", label:"Reservations",      note:"Lien direct vers ton systeme" },
      { icon:"⭐", label:"Avis Google",        note:"Redirection automatique" },
      { icon:"🕐", label:"Horaires",          note:"Modifiables a tout moment" },
      { icon:"📍", label:"Itineraire",         note:"Google Maps integre" },
      { icon:"🎉", label:"Evenements speciaux",note:"Soirees, menus du jour" },
    ],
    cta: "Creer ma page restaurant",
  },
  {
    id: "freelance",
    icon: "💼",
    label: "Freelance",
    title: "Ta carte de visite devient une vitrine interactive.",
    desc: "Un seul QR sur tes cartes pro. Le client arrive sur ton portfolio, tes services et ton contact.",
    color: "#38BDF8",
    blocks: [
      { icon:"🖼️",  label:"Portfolio",       note:"Galerie de projets" },
      { icon:"🛠️",  label:"Services & tarifs",note:"Ce que tu proposes" },
      { icon:"💬", label:"WhatsApp direct",   note:"CTA de prise de contact" },
      { icon:"📄", label:"CV telechargeable", note:"PDF en un clic" },
      { icon:"🔗", label:"Liens sociaux",     note:"LinkedIn, Behance..." },
      { icon:"📅", label:"Calendly",          note:"Prise de RDV integree" },
    ],
    cta: "Creer ma page freelance",
  },
  {
    id: "creator",
    icon: "🎵",
    label: "Createur",
    title: "Un lien unique pour tous tes contenus.",
    desc: "Centralise tes reseaux, musiques, videos et collaborations sur une page elegante.",
    color: "#A78BFA",
    blocks: [
      { icon:"📸", label:"Instagram / TikTok", note:"Tes dernieres publications" },
      { icon:"🎬", label:"YouTube / Twitch",   note:"Lien vers ta chaine" },
      { icon:"🎵", label:"Streaming",          note:"Spotify, Apple Music..." },
      { icon:"🤝", label:"Partenariats",       note:"Tes codes promo" },
      { icon:"💌", label:"Newsletter",         note:"Formulaire d'inscription" },
      { icon:"🛍️",  label:"Boutique",          note:"Tes produits / merch" },
    ],
    cta: "Creer ma page createur",
  },
  {
    id: "immo",
    icon: "🏠",
    label: "Immobilier",
    title: "Chaque panneau devient un outil de vente.",
    desc: "Colle ton QR sur tes panneaux et brochures. L'acheteur accede aux details en 1 scan.",
    color: "#C9A84C",
    blocks: [
      { icon:"🏡", label:"Fiche du bien",      note:"Photos, surface, prix" },
      { icon:"📞", label:"Contact direct",     note:"Appel ou message" },
      { icon:"📅", label:"Visites",            note:"Demande de visite en ligne" },
      { icon:"📄", label:"Brochure PDF",       note:"Telechargement instantane" },
      { icon:"🗺️",  label:"Localisation",      note:"Plan interactif" },
      { icon:"💶", label:"Financement",        note:"Simulateur de credit" },
    ],
    cta: "Creer ma page immobilier",
  },
  {
    id: "event",
    icon: "🎪",
    label: "Evenement",
    title: "Tiens tes participants informes en temps reel.",
    desc: "Programme, billets, acces et mises a jour — tout sur une page modifiable meme la veille.",
    color: "#39FF8F",
    blocks: [
      { icon:"📋", label:"Programme",          note:"Mis a jour en direct" },
      { icon:"🎫", label:"Billetterie",        note:"Lien d'achat direct" },
      { icon:"⏳", label:"Countdown",          note:"Decompte automatique" },
      { icon:"📍", label:"Lieu & acces",       note:"Plan et transport" },
      { icon:"📸", label:"Galerie",            note:"Photos de l'edition passee" },
      { icon:"📣", label:"Intervenants",       note:"Biographies et horaires" },
    ],
    cta: "Creer ma page evenement",
  },
  {
    id: "commerce",
    icon: "🛍️",
    label: "Commerce local",
    title: "Attire plus de clients avec un QR sur ta vitrine.",
    desc: "Tes promo, tes produits et tes horaires toujours a jour. Un scan depuis la rue suffit.",
    color: "#F43F5E",
    blocks: [
      { icon:"🏷️",  label:"Promotions",        note:"Offres du moment" },
      { icon:"📦", label:"Catalogue produits", note:"Mis a jour facilement" },
      { icon:"🕐", label:"Horaires",           note:"Feries inclus" },
      { icon:"⭐", label:"Avis clients",        note:"Lien Google / Tripadvisor" },
      { icon:"📍", label:"Itineraire",          note:"Depuis n'importe ou" },
      { icon:"💬", label:"Contact rapide",      note:"WhatsApp ou appel" },
    ],
    cta: "Creer ma page commerce",
  },
] as const

function UseCasesSection() {
  const { ref, visible } = useInView(0.06)
  const [active, setActive] = useState(0)
  const uc = USE_CASES[active]

  return (
    <section id="examples" ref={ref} aria-labelledby="uc-title"
      style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
      <style>{`
        .uc-tabs  { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
        .uc-tab   { display:flex; align-items:center; gap:7px; padding:9px 18px; border-radius:100px;
                    cursor:pointer; border:1px solid; transition:all 0.2s ease; font-size:13px; font-weight:500;
                    background:transparent; white-space:nowrap; }
        .uc-tab:focus-visible{ outline:2px solid rgba(201,168,76,0.6); outline-offset:3px; border-radius:100px; }
        .uc-blocks{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        @media(max-width:640px){
          .uc-blocks{ grid-template-columns:repeat(2,1fr)!important; }
          .uc-tabs { gap:6px!important; }
          .uc-tab  { padding:7px 12px!important; font-size:12px!important; }
          #examples{ padding:72px 20px!important; }
        }
        @media(max-width:400px){
          .uc-blocks{ grid-template-columns:1fr!important; }
        }
        @keyframes ucFade{ from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{
        maxWidth: 1140, margin: "0 auto 56px", textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <p style={{ color: "#C9A84C", fontSize: 11, letterSpacing: 3.5,
          textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>Cas d'usage</p>
        <h2 id="uc-title" style={{
          fontFamily: "Cormorant Garamond, serif",
          fontSize: "clamp(28px, 4vw, 52px)",
          color: "#F5F0E8", fontWeight: 700,
          margin: "0 auto 16px", lineHeight: 1.1,
          maxWidth: 600, letterSpacing: "-0.02em",
        }}>
          Fait pour <span style={{ color: "#C9A84C" }}>ton metier.</span>
        </h2>
        <p style={{ color: "rgba(138,132,120,0.8)", fontSize: 16,
          maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
          Selectionne ton activite et vois exactement ce que QRfolio peut faire pour toi.
        </p>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto" }}>

        {/* Tabs */}
        <div className="uc-tabs" style={{
          marginBottom: 40,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease 0.15s",
        }}>
          {USE_CASES.map((uc_item, i) => (
            <button
              key={uc_item.id}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              aria-label={uc_item.label}
              className="uc-tab"
              style={{
                color: active === i ? "#080808" : "rgba(245,240,232,0.65)",
                borderColor: active === i ? uc_item.color : "rgba(255,255,255,0.1)",
                background: active === i
                  ? uc_item.color
                  : "rgba(255,255,255,0.02)",
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 15 }}>{uc_item.icon}</span>
              {uc_item.label}
            </button>
          ))}
        </div>

        {/* Contenu actif */}
        <div key={uc.id} style={{
          display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 40,
          alignItems: "start",
          animation: "ucFade 0.35s ease",
        }} className="uc-content">
          <style>{`@media(max-width:800px){.uc-content{grid-template-columns:1fr!important;}}`}</style>

          {/* Info gauche */}
          <div style={{
            background: "rgba(255,255,255,0.018)",
            border: "1px solid " + uc.color + "25",
            borderRadius: 18, padding: "28px 24px",
            position: "sticky", top: 88,
          }}>
            {/* Header card */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: uc.color + "14",
                border: "1px solid " + uc.color + "30",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
              }}>{uc.icon}</div>
              <div>
                <p style={{ color: uc.color, fontSize: 10, fontWeight: 700,
                  letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px" }}>{uc.label}</p>
                <h3 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700,
                  margin: 0, lineHeight: 1.3 }}>{uc.title}</h3>
              </div>
            </div>

            <p style={{ color: "rgba(138,132,120,0.85)", fontSize: 13.5,
              lineHeight: 1.65, marginBottom: 24 }}>{uc.desc}</p>

            {/* Ligne d'accent */}
            <div style={{
              height: 1, marginBottom: 24,
              background: "linear-gradient(90deg, " + uc.color + "40, transparent)",
            }} />

            <a href="/auth/signup" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: uc.color,
              color: "#080808", textDecoration: "none",
              fontSize: 13, fontWeight: 700,
              padding: "12px 20px", borderRadius: 10,
              transition: "opacity 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.opacity = "0.85"
                el.style.transform = "translateY(-2px)"
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.opacity = "1"
                el.style.transform = "none"
              }}>
              {uc.cta} →
            </a>
          </div>

          {/* Grille de blocs droite */}
          <div>
            <p style={{ color: "rgba(138,132,120,0.55)", fontSize: 10,
              letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
              Blocs inclus dans ce template
            </p>
            <div className="uc-blocks">
              {uc.blocks.map((block, i) => (
                <div key={block.label} style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "14px 14px",
                  display: "flex", flexDirection: "column", gap: 6,
                  transition: "border-color 0.2s, background 0.2s",
                  animationDelay: i * 0.04 + "s",
                  animation: "ucFade 0.35s ease both",
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = uc.color + "40"
                    el.style.background = uc.color + "06"
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = "rgba(255,255,255,0.07)"
                    el.style.background = "rgba(255,255,255,0.025)"
                  }}>
                  <span style={{ fontSize: 18 }}>{block.icon}</span>
                  <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 700, margin: 0 }}>{block.label}</p>
                  <p style={{ color: "rgba(138,132,120,0.7)", fontSize: 11, margin: 0, lineHeight: 1.4 }}>{block.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ── FAQ section ───────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q:"Est-ce que le QR code reste le meme si je modifie ma page ?",       a:"Oui, c'est l'avantage cle d'un QR dynamique. Tu modifies ta page autant de fois que tu veux — le QR code imprime reste identique et continue de fonctionner." },
  { q:"Puis-je utiliser QRfolio gratuitement ?",                           a:"Oui. Le plan Free donne acces a 1 page active, 500 vues par mois et un QR code basique. Aucune carte bancaire requise pour commencer." },
  { q:"Est-ce que je peux connecter mon propre domaine ?",                 a:"Oui, a partir du plan Pro. Tu peux utiliser un sous-domaine personnalise (ex: carte.tonsite.fr) pour donner une image professionnelle." },
  { q:"Est-ce que je vois les statistiques de scans ?",                   a:"Oui. Vues, scans, appareils, sources de trafic et pages les plus visitees. Analytics basiques inclus sur Free, analytics avances sur Pro." },
  { q:"Puis-je retirer le branding QRfolio ?",                             a:"Oui, a partir du plan Pro. Sur le plan Free, une mention discrete apparait en bas de ta page." },
  { q:"Est-ce adapte aux restaurants et commerces locaux ?",              a:"Oui. Des templates dedies sont disponibles : menu, horaires, reservation, avis Google, promotions. Prets a utiliser en 5 minutes." },
  { q:"Puis-je telecharger mon QR code pour l'imprimer ?",                a:"Oui. Export disponible en PNG haute resolution, SVG et PDF — prets pour l'impression sur cartes de visite, flyers, menus ou affiches." },
  { q:"Puis-je annuler mon abonnement ?",                                  a:"Oui, a tout moment depuis ton espace compte. Aucun engagement, aucun frais d'annulation. Ton acces reste actif jusqu'a la fin de la periode payee." },
  { q:"QRfolio fonctionne-t-il bien sur mobile ?",                        a:"Oui. Toutes les pages sont concues mobile-first. La majorite des scans se faisant sur smartphone, le rendu est optimise pour les petits ecrans." },
  { q:"Ai-je besoin de savoir coder ?",                                    a:"Non. QRfolio est entierement no-code. Tu ajoutes des blocs, tu personnalises, tu publies. Aucune competence technique requise." },
] as const

function FAQSection() {
  const { ref, visible } = useInView(0.06)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  return (
    <section id="faq" ref={ref} aria-labelledby="faq-title"
      style={{ padding:"100px 48px", position:"relative", zIndex:1 }}>
      <style>{`
        .faq-item{ border-bottom:1px solid rgba(255,255,255,0.06); }
        .faq-item:first-child{ border-top:1px solid rgba(255,255,255,0.06); }
        .faq-btn{ width:100%; display:flex; align-items:center; justify-content:space-between;
          gap:20px; padding:20px 0; background:none; border:none; cursor:pointer;
          text-align:left; font-family:inherit; }
        .faq-btn:focus-visible{ outline:2px solid rgba(201,168,76,0.5); outline-offset:4px; border-radius:4px; }
        .faq-btn:hover .fq{ color:#F5F0E8 !important; }
        .faq-icon{ width:20px; height:20px; border-radius:50%;
          border:1px solid rgba(201,168,76,0.25); display:flex; align-items:center;
          justify-content:center; flex-shrink:0;
          transition:transform 0.3s ease, background 0.2s, border-color 0.2s; }
        .faq-ans{ overflow:hidden; transition:max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s; }
        @media(max-width:640px){ #faq{ padding:72px 20px !important; } }
        @media(prefers-reduced-motion:reduce){ .faq-ans,.faq-icon{ transition:none !important; } }
      `}</style>
      <div style={{ maxWidth:720, margin:"0 auto 56px", textAlign:"center",
        opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)",
        transition:"opacity 0.6s ease,transform 0.6s ease" }}>
        <p style={{ color:"#C9A84C", fontSize:11, letterSpacing:3.5, textTransform:"uppercase", fontWeight:600, marginBottom:16 }}>FAQ</p>
        <h2 id="faq-title" style={{ fontFamily:"Cormorant Garamond, serif",
          fontSize:"clamp(28px,4vw,52px)", color:"#F5F0E8", fontWeight:700,
          margin:"0 auto 16px", lineHeight:1.1, letterSpacing:"-0.02em" }}>
          Les questions{" "}<span style={{ color:"#C9A84C" }}>les plus frequentes.</span>
        </h2>
        <p style={{ color:"rgba(138,132,120,0.8)", fontSize:16, lineHeight:1.65, margin:0 }}>
          Une question sans reponse ? Ecris-nous, on est la.
        </p>
      </div>
      <div style={{ maxWidth:720, margin:"0 auto",
        opacity:visible?1:0, transition:"opacity 0.6s ease 0.15s" }}>
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIdx === i
          return (
            <div key={i} className="faq-item">
              <button className="faq-btn" onClick={() => setOpenIdx(isOpen ? null : i)}
                aria-expanded={isOpen} aria-controls={"fa-" + i} id={"fb-" + i}>
                <span className="fq" style={{
                  color:isOpen?"#F5F0E8":"rgba(245,240,232,0.8)",
                  fontSize:15, fontWeight:isOpen?600:500, lineHeight:1.45,
                  transition:"color 0.2s" }}>{item.q}</span>
                <span className="faq-icon" aria-hidden="true" style={{
                  transform:isOpen?"rotate(45deg)":"rotate(0deg)",
                  background:isOpen?"rgba(201,168,76,0.12)":"transparent",
                  borderColor:isOpen?"rgba(201,168,76,0.5)":"rgba(201,168,76,0.25)" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="5" y1="1" x2="5" y2="9" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="1" y1="5" x2="9" y2="5" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
              </button>
              <div id={"fa-" + i} role="region" aria-labelledby={"fb-" + i}
                className="faq-ans"
                style={{ maxHeight:isOpen?"500px":"0px", opacity:isOpen?1:0 }}>
                <p style={{ color:"rgba(138,132,120,0.85)", fontSize:14.5,
                  lineHeight:1.75, margin:"0 0 20px", paddingRight:40 }}>{item.a}</p>
              </div>
            </div>
          )
        })}
        <div style={{ marginTop:48, textAlign:"center",
          borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:40 }}>
          <p style={{ color:"rgba(138,132,120,0.7)", fontSize:14, marginBottom:16 }}>
            Tu as une autre question ?
          </p>
          <a href="/auth/signup" style={{ display:"inline-flex", alignItems:"center", gap:8,
            color:"#C9A84C", textDecoration:"none", fontSize:14, fontWeight:600,
            padding:"11px 24px", borderRadius:10,
            border:"1px solid rgba(201,168,76,0.3)", transition:"all 0.2s ease" }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background="rgba(201,168,76,0.08)";el.style.borderColor="rgba(201,168,76,0.55)"}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background="transparent";el.style.borderColor="rgba(201,168,76,0.3)"}}>
            Nous contacter <span style={{fontSize:15}}>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [titleVisible, setTitleVisible] = useState(false)
  const [charIndex, setCharIndex] = useState(0)
  const title = "Ton QR code mérite mieux qu'un simple lien."

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!titleVisible) return
    if (charIndex < title.length) {
      const t = setTimeout(() => setCharIndex(i => i + 1), 38)
      return () => clearTimeout(t)
    }
  }, [titleVisible, charIndex, title.length])



  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
          .hero-ctas { justify-content: center !important; }
          .hero-badge { margin: 0 auto 24px !important; }
          .hero-reassurance { text-align: center !important; }
          .hero-qr { margin-top: 48px !important; }
          .hero-qr > div { margin: 0 auto !important; }
          nav { padding: 16px 24px !important; }
          .nav-links { gap: 20px !important; }
        }
        * { box-sizing: border-box; }
      `}</style>

      <Particles />

      {/* NAV */}
      <Navbar />

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "120px 48px 80px", position: "relative", zIndex: 1
      }}>
        <div className="hero-grid" style={{
          maxWidth: 1140, width: "100%", margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 64, alignItems: "center"
        }}>
          {/* Left: texte */}
          <div>
            {/* Badge */}
            <div className="hero-badge" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: 100, padding: "7px 18px", marginBottom: 32,
              fontSize: 11, color: "#C9A84C", letterSpacing: 2.5,
              textTransform: "uppercase", fontWeight: 600,
              animation: "fadeUp 0.6s ease 0.1s both"
            }}>
              <span style={{ fontSize: 9, animation: "glowPulse 2s ease-in-out infinite" }}>✦</span>
              La page qui remplace ta carte de visite
            </div>

            {/* Titre */}
            <h1 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(38px, 4.5vw, 68px)",
              color: "#F5F0E8", fontWeight: 700, lineHeight: 1.08,
              margin: "0 0 28px", letterSpacing: "-0.02em",
              minHeight: "3em",
              animation: "fadeUp 0.6s ease 0.2s both"
            }}>
              {title.slice(0, charIndex)}
              <span style={{
                borderRight: "2px solid #C9A84C",
                animation: charIndex < title.length ? "none" : "glowPulse 1s ease-in-out infinite",
                opacity: charIndex < title.length ? 1 : 0.7
              }} />
            </h1>

            {/* Sous-titre */}
            <p style={{
              color: "rgba(138,132,120,0.9)", fontSize: 17, lineHeight: 1.75,
              margin: "0 0 44px", maxWidth: 480,
              animation: "fadeUp 0.6s ease 0.35s both"
            }}>
              Crée une page mobile professionnelle, génère un QR code dynamique
              et analyse chaque scan en quelques minutes.
            </p>

            {/* CTAs */}
            <div className="hero-ctas" style={{
              display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center",
              animation: "fadeUp 0.6s ease 0.5s both"
            }}>
              <Link href="/auth/signup" style={{
                background: "linear-gradient(90deg, #C9A84C, #d4a843, #b8953f)",
                backgroundSize: "200% 200%", animation: "gradientShift 3s ease infinite",
                color: "#080808", textDecoration: "none", fontSize: 15, fontWeight: 700,
                padding: "15px 32px", borderRadius: 12, display: "inline-block",
                boxShadow: "0 4px 28px rgba(201,168,76,0.45), 0 0 0 0 rgba(201,168,76,0)",
                transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
                letterSpacing: 0.2
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = "translateY(-3px) scale(1.02)"
                  el.style.boxShadow = "0 8px 40px rgba(201,168,76,0.55), 0 0 0 4px rgba(201,168,76,0.12)"
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = "translateY(0) scale(1)"
                  el.style.boxShadow = "0 4px 28px rgba(201,168,76,0.45)"
                }}>
                Créer mon QRfolio gratuit
              </Link>
              <Link href="#features" style={{
                background: "transparent",
                border: "1px solid rgba(201,168,76,0.2)",
                color: "rgba(245,240,232,0.7)", textDecoration: "none", fontSize: 15,
                padding: "15px 28px", borderRadius: 12, display: "inline-flex",
                alignItems: "center", gap: 8,
                transition: "all 0.2s ease"
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = "rgba(201,168,76,0.45)"
                  el.style.color = "#F5F0E8"
                  el.style.background = "rgba(201,168,76,0.05)"
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = "rgba(201,168,76,0.2)"
                  el.style.color = "rgba(245,240,232,0.7)"
                  el.style.background = "transparent"
                }}>
                Voir comment ça marche
                <span style={{ fontSize: 16, transition: "transform 0.2s" }}>→</span>
              </Link>
            </div>

            {/* Micro-réassurance */}
            <div className="hero-reassurance" style={{
              display: "flex", gap: 20, marginTop: 28, flexWrap: "wrap",
              animation: "fadeUp 0.6s ease 0.65s both"
            }}>
              {["Gratuit", "Sans carte bancaire", "Prêt en 5 min"].map((item) => (
                <span key={item} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  color: "#8A8478", fontSize: 12.5
                }}>
                  <span style={{ color: "#39FF8F", fontSize: 11 }}>✓</span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right: QR */}
          <div className="hero-qr" style={{
            animation: "float 5s ease-in-out infinite",
            zIndex: 1, display: "flex", justifyContent: "center"
          }}>
            <QRMockup />
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <ProofStrip />

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* FEATURES */}
      <FeaturesSection />

      {/* BUILDER */}
      <BuilderSection />

      {/* TEMPLATES */}
      <TemplatesSection />

      {/* QR DYNAMIQUE */}
      <QRDynamicSection />

      {/* ANALYTICS */}
      <AnalyticsSection />

      {/* USE CASES */}
      <UseCasesSection />

      {/* PRICING */}
      <PricingSection />


      {/* FAQ */}
      <FAQSection />

      {/* CTA FINAL */}
      <section style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
        <FadeIn>
          <div style={{
            maxWidth: 700, margin: "0 auto", textAlign: "center",
            background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(57,255,143,0.04))",
            border: "1px solid rgba(201,168,76,0.25)", borderRadius: 24, padding: "64px 48px"
          }}>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px, 4vw, 44px)", color: "#F5F0E8", fontWeight: 700, margin: "0 0 20px" }}>
              Prêt à te démarquer ?
            </h2>
            <p style={{ color: "#8A8478", fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
              Rejoins les créateurs qui utilisent QRfolio pour transformer leurs QR codes en expériences mémorables.
            </p>
            <Link href="/auth/signup" style={{
              background: "linear-gradient(90deg, #C9A84C, #39FF8F)",
              color: "#080808", textDecoration: "none", fontSize: 16, fontWeight: 700,
              padding: "18px 40px", borderRadius: 12, display: "inline-block",
              boxShadow: "0 4px 32px rgba(201,168,76,0.3)", transition: "all 0.2s"
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(201,168,76,0.5)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 32px rgba(201,168,76,0.3)" }}>
              Créer mon QRfolio gratuit →
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid rgba(201,168,76,0.1)", padding: "40px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", zIndex: 1
      }}>
        <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, color: "#C9A84C", fontWeight: 700 }}>QRfolio</span>
        <p style={{ color: "#8A8478", fontSize: 13, margin: 0 }}>© 2026 QRfolio. Tous droits réservés.</p>
      </footer>
    </div>
  )
}