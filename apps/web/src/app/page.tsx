"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { PLAN_LIST, PLAN_COMPARISON, fmtPrice } from "@/lib/plans"

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const canvas = canvasRef.current!
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })!

    // ── Zones de contenu (colonnes centrales) ───────────────────────────────
    // Le contenu est centré dans max-width:1140px avec padding:0 48px
    // On recalcule dynamiquement les zones où les particules doivent s'atténuer
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight

    const getContentZone = () => {
      const contentW = Math.min(1140, W - 96)
      const cx = W / 2
      return {
        x1: cx - contentW / 2,
        x2: cx + contentW / 2,
      }
    }

    const isMobile = W < 768
    const COUNT    = isMobile ? 22 : 38

    // ── 3 couches de profondeur ───────────────────────────────────────────────
    // Layer = 0 (lointain), 1 (intermédiaire), 2 (proche)
    const pts = Array.from({ length: COUNT }, (_, idx) => {
      const layer = idx < COUNT * 0.4 ? 0 : idx < COUNT * 0.75 ? 1 : 2
      return {
        x:     Math.random() * W,
        y:     Math.random() * H,
        layer,
        // Rayon selon profondeur : lointain petit, proche plus grand
        r:     layer === 0 ? Math.random() * 0.8 + 0.3
             : layer === 1 ? Math.random() * 1.2 + 0.6
             :                Math.random() * 1.6 + 0.9,
        // Vitesse selon profondeur (parallaxe)
        dx:    (Math.random() - 0.5) * (layer === 0 ? 0.12 : layer === 1 ? 0.22 : 0.32),
        dy:    (Math.random() - 0.5) * (layer === 0 ? 0.12 : layer === 1 ? 0.22 : 0.32),
        // Opacité max selon profondeur : lointain très discret
        oMax:  layer === 0 ? 0.20 : layer === 1 ? 0.38 : 0.55,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.012 + 0.005,
        // Rayon glow selon profondeur
        glowR: layer === 0 ? Math.random() * 6 + 3
             : layer === 1 ? Math.random() * 10 + 5
             :                Math.random() * 14 + 7,
      }
    })

    let raf = 0
    let paused = false
    let t = 0

    const onVisibility = () => { paused = document.hidden }
    document.addEventListener("visibilitychange", onVisibility)

    function draw() {
      t += 0.016
      if (paused) { raf = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, W, H)
      const zone = getContentZone()

      // Dessiner les couches de l'arrière vers l'avant
      for (let layer = 0; layer <= 2; layer++) {
        for (const p of pts) {
          if (p.layer !== layer) continue

          const pulse      = (Math.sin(t * p.speed * 60 + p.phase) + 1) / 2 // 0..1
          const glowRadius = p.glowR * (0.45 + pulse * 0.55)
          let   alpha      = p.oMax * (0.5 + pulse * 0.5)

          // ── Protection de lisibilité : atténuer dans la zone contenu ──────
          // La zone contenu est entre zone.x1 et zone.x2
          // Plus la particule est proche du centre, plus elle s'atténue
          const inContentH = p.x > zone.x1 && p.x < zone.x2
          if (inContentH) {
            // Atténuation progressive : pleine au bord, max -80% au centre
            const relX   = (p.x - zone.x1) / (zone.x2 - zone.x1) // 0..1
            const dist   = Math.abs(relX - 0.5) * 2               // 0..1 (0=centre, 1=bord)
            const fade   = 0.12 + dist * 0.28                     // 0.12 bord centre, 0.40 bords
            alpha        = alpha * fade
          }

          if (alpha < 0.005) {
            p.x += p.dx; p.y += p.dy
            if (p.x < -glowRadius)    p.x = W + glowRadius
            if (p.x > W + glowRadius) p.x = -glowRadius
            if (p.y < -glowRadius)    p.y = H + glowRadius
            if (p.y > H + glowRadius) p.y = -glowRadius
            continue
          }

          // ── Halo diffus (très subtil dans la zone contenu) ─────────────────
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius)
          grad.addColorStop(0,    `rgba(201,168,76,${(alpha * 0.6).toFixed(3)})`)
          grad.addColorStop(0.4,  `rgba(201,168,76,${(alpha * 0.18).toFixed(3)})`)
          grad.addColorStop(0.75, `rgba(201,168,76,${(alpha * 0.04).toFixed(3)})`)
          grad.addColorStop(1,    "rgba(201,168,76,0)")
          ctx.beginPath()
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()

          // ── Point central ──────────────────────────────────────────────────
          const coreR = p.r * (0.75 + pulse * 0.25)
          ctx.beginPath()
          ctx.arc(p.x, p.y, coreR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(245,210,110,${(alpha * 0.9).toFixed(3)})`
          ctx.fill()

          // Mouvement
          p.x += p.dx; p.y += p.dy
          if (p.x < -glowRadius)    p.x = W + glowRadius
          if (p.x > W + glowRadius) p.x = -glowRadius
          if (p.y < -glowRadius)    p.y = H + glowRadius
          if (p.y > H + glowRadius) p.y = -glowRadius
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    let resizeTimer = 0
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        W = canvas.width  = window.innerWidth
        H = canvas.height = window.innerHeight
      }, 200) as unknown as number
    }
    window.addEventListener("resize", onResize, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} style={{
    position: "fixed", inset: 0, pointerEvents: "none",
    zIndex: 0, opacity: 1,
    transform: "translateZ(0)",
    willChange: "transform",
  }} />
}

// ── Animated QR mockup ────────────────────────────────────────────────────────
function QRMockup() {
  const [pulse, setPulse] = useState(false)
  const [hovered, setHovered] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 })
    if (qrRef.current) obs.observe(qrRef.current)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!inView) return
    const t = setInterval(() => setPulse(p => !p), 2400)
    return () => clearInterval(t)
  }, [])
  const corners = [0,1,2,7,8,9,14,15,16,6,13,20,3,4,5,10,11,12,17,18,19,
    28,29,30,35,36,37,42,43,44,49,32,33,34,39,40,41,46,47,48]
  const goldCells = [24, 25, 26, 31, 32, 33, 38]
  return (
    <div ref={qrRef}
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
    tag: "Éditeur simple",
    title: "Créez votre page sans rien coder",
    desc: "Un éditeur en glisser-déposer, des blocs prêts à l'emploi : votre page est en ligne en 5 minutes.",
    accent: "#C9A84C",
    detail: {
      role: "Un éditeur visuel où vous assemblez votre page en glissant des blocs (titre, photo, liens, boutons) — aucune ligne de code.",
      example: "Un coach ajoute sa photo, ses tarifs et un bouton « Réserver » en quelques clics, depuis son téléphone.",
      benefit: "Vous êtes autonome : plus besoin d'un développeur ni d'attendre des semaines pour publier.",
    },
  },
  {
    icon: "🔄",
    tag: "QR dynamique",
    title: "Un QR code que vous modifiez à volonté",
    desc: "Changez la destination, le contenu et les liens quand vous voulez — sans jamais réimprimer votre QR code.",
    accent: "#38BDF8",
    detail: {
      role: "Le QR code pointe vers votre page QRfolio. Vous modifiez la page, le QR code imprimé reste valable.",
      example: "Un restaurant imprime le QR sur ses tables une seule fois, puis change son menu chaque semaine.",
      benefit: "Vous économisez les réimpressions et vous corrigez une erreur en 30 secondes.",
    },
  },
  {
    icon: "📊",
    tag: "Statistiques",
    title: "Sachez exactement qui scanne",
    desc: "Vues, scans, appareils et sources de trafic, en temps réel. Vous pilotez vos résultats.",
    accent: "#39FF8F",
    detail: {
      role: "Un tableau de bord qui mesure les scans, les vues, les appareils utilisés et d'où viennent vos visiteurs.",
      example: "Un commerce voit que 70 % des scans viennent de sa vitrine le week-end, et adapte ses promos.",
      benefit: "Vous prenez des décisions sur des chiffres réels, pas au feeling.",
    },
  },
  {
    icon: "🎯",
    tag: "Conversion",
    title: "Transformez vos visiteurs en clients",
    desc: "Boutons WhatsApp, réservation, paiement, formulaire de contact… toutes vos actions au même endroit.",
    accent: "#F97316",
    detail: {
      role: "Des boutons d'action prêts à l'emploi : appel, WhatsApp, réservation, paiement, formulaire de contact.",
      example: "Un artisan place un bouton « Demander un devis » qui ouvre directement WhatsApp.",
      benefit: "Chaque visite a une chance de devenir un contact ou une vente.",
    },
  },
  {
    icon: "🎨",
    tag: "Modèles",
    title: "Démarrez avec un modèle fait pour votre métier",
    desc: "Restaurant, indépendant, coach, artiste, immobilier, commerce : un modèle adapté à votre activité.",
    accent: "#A78BFA",
    detail: {
      role: "Des modèles déjà conçus par métier, qu'il suffit de personnaliser avec vos informations.",
      example: "Une agence immobilière part du modèle « fiche de bien » et publie une annonce en 5 minutes.",
      benefit: "Vous ne partez jamais d'une page blanche et le résultat est pro dès le départ.",
    },
  },
  {
    icon: "🏢",
    tag: "Marque professionnelle",
    title: "Affichez votre propre marque",
    desc: "Votre domaine personnalisé, sans mention QRfolio, avec un design premium. Une image irréprochable.",
    accent: "#C9A84C",
    detail: {
      role: "Votre page sur votre propre nom de domaine, sans aucune mention QRfolio.",
      example: "Un cabinet utilise carte.soncabinet.fr : ses clients ne voient que sa marque.",
      benefit: "Une image 100 % professionnelle qui inspire confiance et crédibilité.",
    },
  },
] as const

function FeaturesSection() {
  const { ref, visible } = useInView(0.06)
  const [hovered, setHovered] = useState<number | null>(null)
  const [info, setInfo] = useState<number | null>(null)
  const fInfo = info !== null ? FEATURES[info] : null
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
        }}>Fonctionnalités</p>
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

              {/* Bouton info -> fenêtre explicative */}
              <button type="button" onClick={() => setInfo(i)} aria-label={"En savoir plus : " + f.title}
                style={{ position: "absolute", top: 16, right: 16, width: 22, height: 22, borderRadius: "50%", background: isHovered ? `${f.accent}22` : "rgba(255,255,255,0.05)", border: `1px solid ${isHovered ? f.accent + "55" : "rgba(255,255,255,0.12)"}`, color: isHovered ? f.accent : "rgba(138,132,120,0.8)", fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", zIndex: 2 }}>?</button>

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

      {/* Fenetre explicative d'une fonctionnalite (Pb 6) */}
      {fInfo && (
        <div onClick={() => setInfo(null)} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "linear-gradient(180deg,#16140E,#0C0B08)", border: `1px solid ${fInfo.accent}40`, borderRadius: 20, padding: "30px 28px", position: "relative", boxShadow: `0 30px 90px rgba(0,0,0,0.7), 0 0 50px ${fInfo.accent}12`, fontFamily: "DM Sans, sans-serif" }}>
            <button type="button" onClick={() => setInfo(null)} aria-label="Fermer" style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "none", color: "#8A8478", fontSize: 16, cursor: "pointer" }}>✕</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `${fInfo.accent}18`, border: `1px solid ${fInfo.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{fInfo.icon}</div>
              <div>
                <p style={{ color: fInfo.accent, fontSize: 9.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>{fInfo.tag}</p>
                <p style={{ color: "#F5F0E8", fontSize: 17, fontWeight: 800, margin: "2px 0 0", fontFamily: "Cormorant Garamond, serif" }}>{fInfo.title}</p>
              </div>
            </div>
            {([["À quoi ça sert", fInfo.detail.role], ["Exemple concret", fInfo.detail.example], ["Ce que ça vous apporte", fInfo.detail.benefit]] as const).map(([h, txt]) => (
              <div key={h} style={{ marginBottom: 14 }}>
                <p style={{ color: "rgba(138,132,120,0.7)", fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 4px" }}>{h}</p>
                <p style={{ color: "#E8E6E0", fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{txt}</p>
              </div>
            ))}
            <Link href="/auth/signup" style={{ display: "block", textAlign: "center", marginTop: 20, padding: "12px", borderRadius: 11, background: `linear-gradient(90deg, ${fInfo.accent}, ${fInfo.accent}cc)`, color: "#080808", textDecoration: "none", fontSize: 13.5, fontWeight: 800 }}>
              Essayer gratuitement
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}


// ── Marque professionnelle (Pb 5) ──────────────────────────────────────────────
function BrandProSection() {
  const { ref, visible } = useInView(0.08)
  const [open, setOpen] = useState(false)
  const G = "#C9A84C"
  const MiniPage = ({ pro }: { pro: boolean }) => (
    <div style={{ flex: 1, minWidth: 0, background: "#0E0D0B", border: `1px solid ${pro ? G : "rgba(255,255,255,0.08)"}`, borderRadius: 16, overflow: "hidden", boxShadow: pro ? `0 12px 40px rgba(201,168,76,0.18)` : "none", position: "relative" }}>
      {pro && <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2, background: G, color: "#080808", fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 20, letterSpacing: 0.5 }}>PRO</div>}
      {/* barre d'URL */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: pro ? "#39FF8F" : "rgba(138,132,120,0.5)" }} />
        <span style={{ color: pro ? "#F5F0E8" : "rgba(138,132,120,0.7)", fontSize: 10.5, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pro ? "carte.votremarque.fr" : "qrfolio.app/p/votre-page"}</span>
      </div>
      {/* contenu mock */}
      <div style={{ padding: "22px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: pro ? `${G}22` : "rgba(255,255,255,0.06)", border: `1px solid ${pro ? G + "55" : "rgba(255,255,255,0.1)"}` }} />
        <div style={{ height: 7, width: "55%", borderRadius: 4, background: "rgba(245,240,232,0.85)" }} />
        <div style={{ height: 5, width: "38%", borderRadius: 3, background: "rgba(138,132,120,0.5)" }} />
        <div style={{ height: 30, width: "70%", borderRadius: 8, background: pro ? `linear-gradient(90deg,${G},#b8953f)` : "rgba(255,255,255,0.08)", marginTop: 4 }} />
      </div>
      {/* pied de page : mention QRfolio sur le gratuit, rien sur le Pro */}
      <div style={{ padding: "9px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center", minHeight: 30 }}>
        {pro
          ? <span style={{ color: G, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5 }}>✓ 100 % votre marque</span>
          : <span style={{ color: "rgba(138,132,120,0.65)", fontSize: 9.5 }}>✦ Propulsé par QRfolio</span>}
      </div>
    </div>
  )
  return (
    <section ref={ref} aria-labelledby="brandpro-title" style={{ padding: "90px 48px", position: "relative", zIndex: 1 }}>
      <div className="brandpro-wrap" style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
        {/* Texte */}
        <div>
          <p style={{ color: G, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>Marque professionnelle</p>
          <h2 id="brandpro-title" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(30px,3.6vw,46px)", color: "#F5F0E8", fontWeight: 700, lineHeight: 1.08, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
            Votre marque.<br /><span style={{ color: G }}>Pas la nôtre.</span>
          </h2>
          <p style={{ color: "rgba(138,132,120,0.9)", fontSize: 16, lineHeight: 1.7, margin: "0 0 24px", maxWidth: 420 }}>
            Sur les plans payants, votre page s'affiche sur <strong style={{ color: "#E8E6E0" }}>votre propre nom de domaine</strong>, <strong style={{ color: "#E8E6E0" }}>sans aucune mention QRfolio</strong>. Vos clients ne voient que vous.
          </p>
          <button type="button" onClick={() => setOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: `1px solid ${G}55`, color: G, fontSize: 14, fontWeight: 700, padding: "12px 22px", borderRadius: 12, cursor: "pointer" }}>
            Découvrir la marque professionnelle →
          </button>
        </div>
        {/* Avant / Après */}
        <div>
          <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
            <MiniPage pro={false} />
            <MiniPage pro={true} />
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <span style={{ flex: 1, textAlign: "center", color: "rgba(138,132,120,0.7)", fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Plan gratuit</span>
            <span style={{ flex: 1, textAlign: "center", color: G, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Plan Pro</span>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:820px){ .brandpro-wrap{ grid-template-columns:1fr!important; gap:32px!important; } } @media(max-width:640px){ section[aria-labelledby="brandpro-title"]{ padding:64px 22px!important; } }`}</style>

      {/* Modale explicative */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "linear-gradient(180deg,#16140E,#0C0B08)", border: `1px solid ${G}40`, borderRadius: 20, padding: "30px 28px", position: "relative", boxShadow: `0 30px 90px rgba(0,0,0,0.7), 0 0 50px ${G}12`, fontFamily: "DM Sans, sans-serif" }}>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "none", color: "#8A8478", fontSize: 16, cursor: "pointer" }}>✕</button>
            <p style={{ color: G, fontSize: 9.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>Marque professionnelle</p>
            <p style={{ color: "#F5F0E8", fontSize: 22, fontWeight: 800, margin: "4px 0 18px", fontFamily: "Cormorant Garamond, serif" }}>Une image 100 % à vous</p>
            {([
              ["🌐", "Votre nom de domaine", "Au lieu de qrfolio.app/p/…, votre page vit sur carte.votremarque.fr. Plus crédible, plus mémorisable."],
              ["🚫", "Zéro mention QRfolio", "La mention « Propulsé par QRfolio » disparaît : vos visiteurs ne voient que votre marque."],
              ["✨", "Design premium", "Polices, couleurs et finitions soignées pour une page qui inspire confiance dès le premier coup d'œil."],
            ] as const).map(([emo, h, txt]) => (
              <div key={h} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{emo}</span>
                <div>
                  <p style={{ color: "#F5F0E8", fontSize: 13.5, fontWeight: 700, margin: "0 0 2px" }}>{h}</p>
                  <p style={{ color: "rgba(138,132,120,0.9)", fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>{txt}</p>
                </div>
              </div>
            ))}
            <Link href="/upgrade" style={{ display: "block", textAlign: "center", marginTop: 18, padding: "12px", borderRadius: 11, background: `linear-gradient(90deg,${G},#b8953f)`, color: "#080808", textDecoration: "none", fontSize: 13.5, fontWeight: 800 }}>
              Activer ma marque (dès le plan Pro)
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}


// ── Pricing card ──────────────────────────────────────────────────────────────
// Pricing landing : derive de la source unique (lib/plans) -> 4 plans, Pro en avant
const PLAN_LANDING_UI = {
  free:     { cta: "Commencer gratuitement",     href: "/auth/signup",                 badge: null,                note: null },
  starter:  { cta: "Démarrer l'essai gratuit",    href: "/auth/signup?plan=starter",  badge: "Meilleur rapport Q/P", note: null },
  pro:      { cta: "Démarrer l'essai gratuit",    href: "/auth/signup?plan=pro",      badge: "Le plus populaire",   note: "14 jours d'essai · Sans engagement · Sans carte bancaire" },
  business: { cta: "Contacter l equipe",          href: "/auth/signup?plan=business", badge: null,                note: null },
} as Record<string, { cta: string; href: string; badge: string | null; note: string | null }>

// Bénéfices orientés résultat (Pb 12) — on vend ce que ça apporte, pas une liste de specs
const LANDING_BENEFITS: Record<string, { text: string; ok: boolean }[]> = {
  free: [
    { text: "Votre page en ligne en 5 minutes", ok: true },
    { text: "Un QR code dynamique prêt à imprimer", ok: true },
    { text: "Suivez vos premières visites", ok: true },
    { text: "3 pages · 200 vues / mois", ok: true },
    { text: "Sans la mention QRfolio", ok: false },
    { text: "Votre nom de domaine", ok: false },
  ],
  starter: [
    { text: "Votre marque, sans mention QRfolio", ok: true },
    { text: "Votre propre nom de domaine", ok: true },
    { text: "Des QR codes personnalisés à votre image", ok: true },
    { text: "5 pages · 850 vues / mois", ok: true },
    { text: "Téléchargement PNG prêt à imprimer", ok: true },
    { text: "Génération assistée par IA", ok: false },
  ],
  pro: [
    { text: "Créez des QR codes uniques et professionnels", ok: true },
    { text: "Concevez vos supports imprimés (affiches, flyers, cartes)", ok: true },
    { text: "Recevez des recommandations automatiques pour progresser", ok: true },
    { text: "Lancez votre page avec tous les modèles premium", ok: true },
    { text: "Téléchargement PNG · JPG · PDF haute définition", ok: true },
    { text: "25 pages · 15 000 vues / mois", ok: true },
  ],
  business: [
    { text: "Pages et vues illimitées", ok: true },
    { text: "Travaillez à plusieurs (5 membres)", ok: true },
    { text: "Votre marque uniquement (marque blanche)", ok: true },
    { text: "Automatisez grâce à l'accès API", ok: true },
    { text: "Tout le plan Pro inclus", ok: true },
    { text: "Support prioritaire 24/7", ok: true },
  ],
}

const PLANS = PLAN_LIST.map(p => ({
  id: p.id,
  name: p.label,
  tagline: p.description,
  price: fmtPrice(p.priceMonthly),
  period: p.priceMonthly === 0 ? "" : "/ mois",
  highlight: p.id === "pro",
  badge: PLAN_LANDING_UI[p.id].badge,
  color: p.color,
  cta: PLAN_LANDING_UI[p.id].cta,
  ctaHref: PLAN_LANDING_UI[p.id].href,
  features: LANDING_BENEFITS[p.id] ?? p.perks.slice(0, 6).map(k => ({ text: k.text, ok: k.included })),
  note: PLAN_LANDING_UI[p.id].note,
}))

function PricingSection() {
  const { ref, visible } = useInView(0.06)

  return (
    <section id="pricing" ref={ref} aria-labelledby="pricing-title"
      style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
      <style>{`
        .plans-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; align-items:center; }
        .plan-card  { border-radius:20px; padding:28px 22px; position:relative; overflow:hidden;
                      transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s, border-color 0.25s; }
        .plan-card:hover { transform:translateY(-6px); }
        .plan-card.highlight { transform:scale(1.05); }
        .plan-card.highlight:hover { transform:scale(1.05) translateY(-6px); }
        @media(max-width:1024px){ .plans-grid{ grid-template-columns:repeat(2,1fr)!important; max-width:680px!important; margin:0 auto!important; } .plan-card.highlight{ transform:none!important; } .plan-card.highlight:hover{ transform:translateY(-4px)!important; } }
        @media(max-width:560px){ .plans-grid{ grid-template-columns:1fr!important; max-width:420px!important; } #pricing{ padding:72px 20px!important; } }
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
          Commencez gratuitement. Passez au Pro quand vous êtes prêt.
        </p>
      </div>

      {/* Cards */}
      <div style={{ maxWidth:1180, margin:"0 auto" }}>
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

        {/* Comparaison détaillée des plans (Pb 13) */}
        <div style={{ marginTop: 56, opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 0.4s" }}>
          <h3 style={{ fontFamily: "Cormorant Garamond, serif", color: "#F5F0E8", fontSize: "clamp(22px,2.6vw,32px)", fontWeight: 700, textAlign: "center", margin: "0 0 6px" }}>
            Comparez les plans en détail
          </h3>
          <p style={{ color: "rgba(138,132,120,0.7)", fontSize: 13, textAlign: "center", margin: "0 0 26px" }}>
            Survolez le <span style={{ color: "#C9A84C" }}>?</span> de chaque ligne pour plus d'explications.
          </p>
          {(() => {
            const INFO: Record<string, string> = {
              "Pages": "Nombre de pages publiables en même temps.",
              "Vues / mois": "Nombre de visites comptabilisées chaque mois sur vos pages.",
              "QR codes": "Nombre de QR codes que vous pouvez générer.",
              "QR Studio": "Personnalisation avancée du QR : couleurs, formes des modules et des coins.",
              "QR Print Studio": "Éditeur d'imprimables (affiches, flyers, cartes, stickers) façon Canva.",
              "IA": "Génération de design et recommandations automatiques.",
              "Export HD": "Formats de téléchargement haute définition pour l'impression.",
              "Templates": "Bibliothèque de modèles prêts à l'emploi.",
              "Branding QRfolio": "Mention QRfolio en bas de page (retirée dès le plan Starter).",
              "Domaine perso": "Utiliser votre propre nom de domaine.",
              "Analytics": "Niveau de détail des statistiques.",
              "Equipe": "Nombre de membres pouvant collaborer sur le compte.",
              "API": "Accès programmatique pour automatiser vos QR codes.",
              "Marque blanche": "Aucune trace de QRfolio : votre marque uniquement.",
              "Support": "Niveau et rapidité de l'assistance.",
            }
            const cell = (v: string, hl: boolean) => {
              const ok = v === "✓" || v === "Oui"
              const no = v === "❌" || v === "—" || v === "Non"
              return (
                <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 12.5, fontWeight: hl ? 700 : 500, color: ok ? "#39FF8F" : no ? "rgba(138,132,120,0.45)" : hl ? "#C9A84C" : "#E8E6E0", borderBottom: "1px solid rgba(255,255,255,0.05)", background: hl ? "rgba(201,168,76,0.05)" : "transparent" }}>
                  {ok ? "✓" : no ? "—" : v}
                </td>
              )
            }
            return (
              <div style={{ overflowX: "auto", maxWidth: 960, margin: "0 auto", border: "1px solid rgba(201,168,76,0.14)", borderRadius: 16, background: "rgba(255,255,255,0.02)" }}>
                <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "16px 14px", textAlign: "left", fontSize: 11, color: "rgba(138,132,120,0.8)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Fonctionnalité</th>
                      {PLAN_LIST.map(p => (
                        <th key={p.id} style={{ padding: "16px 14px", textAlign: "center", fontSize: 13, fontWeight: 800, color: p.id === "pro" ? "#C9A84C" : "#F5F0E8", background: p.id === "pro" ? "rgba(201,168,76,0.06)" : "transparent" }}>
                          {p.label}{p.id === "pro" && <div style={{ fontSize: 8.5, color: "#C9A84C", fontWeight: 700, letterSpacing: 0.5 }}>POPULAIRE</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_COMPARISON.map(row => (
                      <tr key={row.feature}>
                        <td style={{ padding: "12px 14px", textAlign: "left", fontSize: 12.5, color: "#E8E6E0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          {row.feature}
                          {INFO[row.feature] && <span title={INFO[row.feature]} style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: "50%", background: "rgba(201,168,76,0.15)", color: "#C9A84C", fontSize: 9, fontWeight: 800, cursor: "help" }}>?</span>}
                        </td>
                        {cell(row.free, false)}
                        {cell(row.starter, false)}
                        {cell(row.pro, true)}
                        {cell(row.business, false)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()}
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
          <span style={{ color: "#C9A84C" }}>pour votre métier.</span>
        </h2>
        <p style={{
          color: "rgba(138,132,120,0.85)", fontSize: 16,
          maxWidth: 540, margin: "0 auto", lineHeight: 1.7,
        }}>
          Restaurant, indépendant, coach, artiste, immobilier, commerce :{" "}
          partez d'une page déjà structurée.
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
  { label: "Fonctionnalités", href: "#features"  },
  { label: "Modèles",         href: "#templates" },
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
  {icon:"🎨",title:"Choisissez un modèle",   desc:"Parmi nos modèles conçus pour convertir, adaptés à votre secteur."},
  {icon:"✏️", title:"Personnalisez votre page", desc:"Ajoutez vos infos, vos liens, vos photos. Sans code, résultat professionnel en minutes."},
  {icon:"📱",title:"Générez votre QR code",  desc:"Un QR dynamique est créé automatiquement. Modifiez votre page sans le réimprimer."},
  {icon:"🚀",title:"Partagez partout",       desc:"Cartes de visite, réseaux, e-mails, en présentiel. Un seul QR, partout."},
  {icon:"📊",title:"Analysez les résultats", desc:"Voyez qui scanne, quand et depuis quel appareil. En temps réel."},
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
          De zéro à scannable{" "}<span style={{color:"#C9A84C"}}>en 5 minutes</span>
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
        <p style={{color:"rgba(201,168,76,0.5)",fontSize:9,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Aperçu</p>
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
    {icon:"🧱",title:"Blocs prêts à l'emploi",desc:"Profil, liens, galerie, WhatsApp, paiement — tout y est."},
    {icon:"🎨",title:"Modèles par métier",desc:"Restaurant, indépendant, artiste, coach — adaptés dès le départ."},
    {icon:"📱",title:"Aperçu mobile instantané",desc:"Voyez le rendu en temps réel pendant que vous modifiez votre page."},
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
            Ajoutez des blocs, personnalisez votre thème, publiez et partagez votre QR code.
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
              Modifiez votre page ou votre destination sans jamais réimprimer votre QR code.
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
                Créer mon QR gratuit <span style={{ fontSize: 16 }}>→</span>
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
              animation: "qrFloat 4s ease-in-out infinite", willChange: "transform",
            }}>
              {/* Glow */}
              <div style={{
                position: "absolute", inset: -24,
                background: "radial-gradient(circle, " + QR_STYLES[active].tag + "25 0%, transparent 65%)",
                borderRadius: "50%",
                animation: "qrGlow 3s ease-in-out infinite", willChange: "opacity",
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
  { icon: "📱", text: "Comprendre les appareils de vos visiteurs" },
  { icon: "🎯", text: "Optimiser vos boutons d'action et vos pages" },
  { icon: "📈", text: "Suivre votre croissance semaine après semaine" },
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
    title: "Transformez votre table en expérience connectée.",
    desc: "Vos clients scannent, consultent votre menu à jour, réservent et laissent un avis en 2 gestes.",
    color: "#F97316",
    blocks: [
      { icon:"📋", label:"Menu interactif",   note:"Mis à jour sans réimprimer" },
      { icon:"📅", label:"Réservations",      note:"Lien direct vers votre système" },
      { icon:"⭐", label:"Avis Google",        note:"Redirection automatique" },
      { icon:"🕐", label:"Horaires",          note:"Modifiables à tout moment" },
      { icon:"📍", label:"Itinéraire",         note:"Google Maps intégré" },
      { icon:"🎉", label:"Événements spéciaux",note:"Soirées, menus du jour" },
    ],
    cta: "Créer ma page restaurant",
  },
  {
    id: "freelance",
    icon: "💼",
    label: "Freelance",
    title: "Votre carte de visite devient une vitrine interactive.",
    desc: "Un seul QR sur vos cartes pro. Le client arrive sur votre portfolio, vos services et votre contact.",
    color: "#38BDF8",
    blocks: [
      { icon:"🖼️",  label:"Portfolio",       note:"Galerie de projets" },
      { icon:"🛠️",  label:"Services & tarifs",note:"Vos prestations" },
      { icon:"💬", label:"WhatsApp direct",   note:"Bouton de prise de contact" },
      { icon:"📄", label:"CV téléchargeable", note:"PDF en un clic" },
      { icon:"🔗", label:"Liens sociaux",     note:"LinkedIn, Behance…" },
      { icon:"📅", label:"Calendly",          note:"Prise de RDV intégrée" },
    ],
    cta: "Créer ma page indépendant",
  },
  {
    id: "creator",
    icon: "🎵",
    label: "Createur",
    title: "Un lien unique pour tous vos contenus.",
    desc: "Centralisez vos réseaux, musiques, vidéos et collaborations sur une page élégante.",
    color: "#A78BFA",
    blocks: [
      { icon:"📸", label:"Instagram / TikTok", note:"Vos dernières publications" },
      { icon:"🎬", label:"YouTube / Twitch",   note:"Lien vers votre chaîne" },
      { icon:"🎵", label:"Streaming",          note:"Spotify, Apple Music…" },
      { icon:"🤝", label:"Partenariats",       note:"Vos codes promo" },
      { icon:"💌", label:"Newsletter",         note:"Formulaire d'inscription" },
      { icon:"🛍️",  label:"Boutique",          note:"Vos produits / merch" },
    ],
    cta: "Créer ma page créateur",
  },
  {
    id: "immo",
    icon: "🏠",
    label: "Immobilier",
    title: "Chaque panneau devient un outil de vente.",
    desc: "Collez votre QR sur vos panneaux et brochures. L'acheteur accède à tous les détails en 1 scan.",
    color: "#C9A84C",
    blocks: [
      { icon:"🏡", label:"Fiche du bien",      note:"Photos, surface, prix" },
      { icon:"📞", label:"Contact direct",     note:"Appel ou message" },
      { icon:"📅", label:"Visites",            note:"Demande de visite en ligne" },
      { icon:"📄", label:"Brochure PDF",       note:"Téléchargement instantané" },
      { icon:"🗺️",  label:"Localisation",      note:"Plan interactif" },
      { icon:"💶", label:"Financement",        note:"Simulateur de crédit" },
    ],
    cta: "Créer ma page immobilier",
  },
  {
    id: "event",
    icon: "🎪",
    label: "Evenement",
    title: "Tenez vos participants informés en temps réel.",
    desc: "Programme, billets, accès et mises à jour — tout sur une page modifiable même la veille.",
    color: "#39FF8F",
    blocks: [
      { icon:"📋", label:"Programme",          note:"Mis à jour en direct" },
      { icon:"🎫", label:"Billetterie",        note:"Lien d'achat direct" },
      { icon:"⏳", label:"Compte à rebours",   note:"Décompte automatique" },
      { icon:"📍", label:"Lieu & accès",       note:"Plan et transport" },
      { icon:"📸", label:"Galerie",            note:"Photos de l'édition passée" },
      { icon:"📣", label:"Intervenants",       note:"Biographies et horaires" },
    ],
    cta: "Créer ma page événement",
  },
  {
    id: "commerce",
    icon: "🛍️",
    label: "Commerce local",
    title: "Attirez plus de clients avec un QR sur votre vitrine.",
    desc: "Vos promotions, vos produits et vos horaires toujours à jour. Un scan depuis la rue suffit.",
    color: "#F43F5E",
    blocks: [
      { icon:"🏷️",  label:"Promotions",        note:"Offres du moment" },
      { icon:"📦", label:"Catalogue produits", note:"Mis à jour facilement" },
      { icon:"🕐", label:"Horaires",           note:"Jours fériés inclus" },
      { icon:"⭐", label:"Avis clients",        note:"Lien Google / Tripadvisor" },
      { icon:"📍", label:"Itinéraire",          note:"Depuis n'importe où" },
      { icon:"💬", label:"Contact rapide",      note:"WhatsApp ou appel" },
    ],
    cta: "Créer ma page commerce",
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
          Fait pour <span style={{ color: "#C9A84C" }}>votre métier.</span>
        </h2>
        <p style={{ color: "rgba(138,132,120,0.8)", fontSize: 16,
          maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
          Sélectionnez votre activité et voyez exactement ce que QRfolio peut faire pour vous.
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
              lineHeight: 1.65, marginBottom: 22 }}>{uc.desc}</p>

            {/* Aperçu du rendu : mini-téléphone (Pb 9) */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
              <div style={{ width: 168, borderRadius: 22, padding: 7, background: "#080705", border: "1px solid rgba(255,255,255,0.12)", boxShadow: `0 18px 50px rgba(0,0,0,0.5), 0 0 0 1px ${uc.color}14` }}>
                <div style={{ borderRadius: 16, overflow: "hidden", background: "#0E0D0B" }}>
                  {/* en-tête coloré + encoche */}
                  <div style={{ position: "relative", height: 58, background: `linear-gradient(135deg, ${uc.color}, ${uc.color}99)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 3, background: "rgba(0,0,0,0.35)" }} />
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginTop: 6 }}>{uc.icon}</div>
                  </div>
                  {/* corps */}
                  <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                    <div style={{ height: 6, width: "62%", borderRadius: 4, background: "rgba(245,240,232,0.9)" }} />
                    <div style={{ height: 4, width: "44%", borderRadius: 3, background: "rgba(138,132,120,0.55)" }} />
                    {/* mini QR */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 1.5, width: 40, height: 40, marginTop: 4, padding: 4, background: "#fff", borderRadius: 5 }}>
                      {Array.from({ length: 25 }).map((_, k) => <div key={k} style={{ background: (k * 7 + 3) % 3 === 0 ? "#0E0D0B" : "transparent", borderRadius: 1 }} />)}
                    </div>
                    {/* CTA */}
                    <div style={{ marginTop: 6, height: 22, width: "82%", borderRadius: 7, background: uc.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#080808", fontSize: 8.5, fontWeight: 800, padding: "0 4px", textAlign: "center", lineHeight: 1 }}>{uc.cta.replace(/^Créer ma page /i, "").replace(/^./, c => c.toUpperCase())}</div>
                  </div>
                </div>
              </div>
            </div>

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
  { q:"Le QR code reste-t-il le même si je modifie ma page ?",            a:"Oui, c'est tout l'intérêt d'un QR code dynamique : vous modifiez votre page autant de fois que vous voulez, et le QR code déjà imprimé reste identique et continue de fonctionner." },
  { q:"Qu'est-ce qu'une carte de visite numérique QRfolio ?",             a:"Une page mobile professionnelle qui regroupe vos informations, vos liens et vos boutons d'action (appel, WhatsApp, réservation…). On y accède en scannant votre QR code ou via un simple lien." },
  { q:"Puis-je utiliser QRfolio gratuitement ?",                          a:"Oui. Le plan gratuit donne accès à 3 pages, 200 vues par mois et 3 QR codes. Aucune carte bancaire n'est demandée pour commencer." },
  { q:"Puis-je connecter mon propre nom de domaine ?",                    a:"Oui, à partir du plan Pro. Vous pouvez utiliser un sous-domaine personnalisé (ex. : carte.votresite.fr) pour une image vraiment professionnelle." },
  { q:"Est-ce que je vois les statistiques de scans ?",                   a:"Oui. Vues, scans, appareils, sources de trafic et pages les plus consultées. Statistiques de base sur le plan gratuit, statistiques avancées sur Pro." },
  { q:"Puis-je retirer la mention QRfolio de ma page ?",                  a:"Oui, à partir du plan Pro : votre page affiche uniquement votre marque. Sur le plan gratuit, une mention discrète apparaît en bas de page." },
  { q:"Est-ce adapté aux restaurants et commerces locaux ?",             a:"Tout à fait. Des modèles prêts à l'emploi existent pour le menu numérique, les horaires, la réservation, les avis Google et les promotions — utilisables en 5 minutes." },
  { q:"Puis-je télécharger mon QR code pour l'imprimer ?",               a:"Oui. Le téléchargement est disponible en PNG haute résolution, SVG et PDF — prêts à imprimer sur cartes de visite, flyers, menus ou affiches." },
  { q:"Puis-je annuler mon abonnement à tout moment ?",                  a:"Oui, à tout moment depuis votre espace compte. Aucun engagement, aucun frais d'annulation : votre accès reste actif jusqu'à la fin de la période déjà payée." },
  { q:"QRfolio fonctionne-t-il bien sur mobile ?",                       a:"Oui. Toutes les pages sont conçues pour le mobile en priorité. Comme la majorité des scans se font sur smartphone, l'affichage est optimisé pour les petits écrans." },
  { q:"Faut-il savoir coder pour créer sa page ?",                       a:"Non, aucune compétence technique n'est requise. Vous ajoutez des blocs, vous personnalisez, vous publiez — c'est tout." },
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
            Vous avez une autre question ?
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
  const title = "Votre QR code mérite mieux qu'un simple lien."

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
    <div style={{ background: "transparent", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`
        html { scroll-padding-top: 80px; }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;}}
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
              <span style={{ fontSize: 9, animation: "glowPulse 2s ease-in-out infinite", willChange: "opacity" }}>✦</span>
              La page qui remplace votre carte de visite
            </div>

            {/* Titre */}
            <h1 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(40px, 5vw, 76px)",
              color: "#F5F0E8", fontWeight: 700, lineHeight: 1.06,
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
              Créez une page mobile professionnelle, générez un QR code dynamique
              et suivez chaque scan — en quelques minutes, sans rien coder.
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
              <Link href="#how" style={{
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
            animation: "float 5s ease-in-out infinite", willChange: "transform",
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

      {/* MARQUE PRO */}
      <BrandProSection />

      {/* PRICING */}
      <PricingSection />


      {/* FAQ */}
      <FAQSection />

      {/* CTA FINAL */}
      <section style={{ padding:"100px 48px 80px", position:"relative", zIndex:1 }}>
        <style>{`
          @keyframes ctaGlow{0%,100%{opacity:0.5}50%{opacity:1}}
          @media(max-width:640px){ .cta-final-section{padding:72px 20px 60px!important;} }
        `}</style>
        <div style={{
          maxWidth:720, margin:"0 auto", textAlign:"center",
          position:"relative",
        }}>
          {/* Glow orb */}
          <div aria-hidden="true" style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:400, height:200,
            background:"radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%)",
            animation:"ctaGlow 4s ease-in-out infinite",
            pointerEvents:"none",
          }}/>

          {/* Card */}
          <div style={{
            background:"linear-gradient(145deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))",
            border:"1px solid rgba(201,168,76,0.28)",
            borderRadius:24, padding:"60px 48px",
            position:"relative", overflow:"hidden",
          }}>
            {/* Corner accents */}
            {[{top:0,left:0,bt:"2px solid rgba(201,168,76,0.5)",bl:"2px solid rgba(201,168,76,0.5)",br:0,bb:0,btr:"24px 0 0 0"},
              {bottom:0,right:0,bb:"2px solid rgba(201,168,76,0.5)",br2:"2px solid rgba(201,168,76,0.5)",bt:0,bl:0,btr:"0 0 24px 0"}
            ].map((_, idx) => idx === 0 ? (
              <div key={0} aria-hidden="true" style={{
                position:"absolute",top:0,left:0,width:40,height:40,
                borderTop:"2px solid rgba(201,168,76,0.45)",
                borderLeft:"2px solid rgba(201,168,76,0.45)",
                borderRadius:"24px 0 0 0",pointerEvents:"none",
              }}/>
            ) : (
              <div key={1} aria-hidden="true" style={{
                position:"absolute",bottom:0,right:0,width:40,height:40,
                borderBottom:"2px solid rgba(201,168,76,0.45)",
                borderRight:"2px solid rgba(201,168,76,0.45)",
                borderRadius:"0 0 24px 0",pointerEvents:"none",
              }}/>
            ))}

            <h2 style={{
              fontFamily:"Cormorant Garamond, serif",
              fontSize:"clamp(28px,4vw,48px)",
              color:"#F5F0E8", fontWeight:700,
              margin:"0 0 20px", lineHeight:1.12,
              letterSpacing:"-0.02em",
            }}>
              Prêt à transformer votre QR code en{" "}
              <span style={{ color:"#C9A84C" }}>vraie page professionnelle ?</span>
            </h2>

            <p style={{
              color:"rgba(138,132,120,0.85)", fontSize:17,
              lineHeight:1.7, margin:"0 0 44px", maxWidth:520,
              marginLeft:"auto", marginRight:"auto",
            }}>
              Créez votre QRfolio gratuitement, personnalisez votre page et commencez à suivre vos scans en quelques minutes.
            </p>

            <Link href="/auth/signup" style={{
              display:"inline-flex", alignItems:"center", gap:10,
              background:"linear-gradient(90deg,#C9A84C,#b8953f)",
              color:"#080808", textDecoration:"none",
              fontSize:16, fontWeight:800,
              padding:"16px 40px", borderRadius:13,
              boxShadow:"0 4px 32px rgba(201,168,76,0.4)",
              letterSpacing:0.2,
              transition:"transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s",
            }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="translateY(-3px) scale(1.03)";el.style.boxShadow="0 8px 40px rgba(201,168,76,0.55)"}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="none";el.style.boxShadow="0 4px 32px rgba(201,168,76,0.4)"}}>
              Créer mon QRfolio gratuit
              <span style={{ fontSize:18 }}>→</span>
            </Link>

            <p style={{
              color:"rgba(138,132,120,0.5)", fontSize:12.5,
              margin:"20px 0 0", letterSpacing:0.3,
            }}>
              Gratuit · Sans carte bancaire · Annulation a tout moment
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid rgba(201,168,76,0.1)", position:"relative", zIndex:2 }} aria-label="Pied de page">
        <style>{`
          .fg { display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr; gap:40px; padding:56px 48px 48px; }
          .fc-title { color:#C9A84C; font-size:10px; letter-spacing:2.5px; text-transform:uppercase; font-weight:700; margin-bottom:18px; }
          .fl { display:block; color:rgba(138,132,120,0.72); text-decoration:none; font-size:13.5px; margin-bottom:11px; line-height:1.4; transition:color 0.2s; }
          .fl:hover { color:#F5F0E8; }
          .fl:focus-visible { outline:2px solid rgba(201,168,76,0.5); outline-offset:3px; border-radius:3px; }
          .fl-soon { color:rgba(138,132,120,0.35) !important; cursor:default; pointer-events:none; }
          .fl-soon::after { content:" (bientôt)"; font-size:10px; }
          .fb { padding:16px 48px 24px; border-top:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
          .fsoc { display:flex; align-items:center; gap:8px; margin-top:20px; }
          .fsoc a { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); color:rgba(138,132,120,0.65); text-decoration:none; font-size:14px; transition:all 0.2s; }
          .fsoc a:hover { border-color:rgba(201,168,76,0.4); color:#C9A84C; background:rgba(201,168,76,0.07); }
          .fsoc a:focus-visible { outline:2px solid rgba(201,168,76,0.5); outline-offset:3px; }
          .fstatus { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; background:rgba(57,255,143,0.07); border:1px solid rgba(57,255,143,0.18); color:rgba(57,255,143,0.8); font-size:11px; font-weight:600; text-decoration:none; transition:all 0.2s; }
          .fstatus:hover { background:rgba(57,255,143,0.12); border-color:rgba(57,255,143,0.35); }
          .fstatus-dot { width:6px; height:6px; border-radius:50%; background:#39FF8F; animation:fpulse 2s ease-in-out infinite; }
          @keyframes fpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @media(max-width:1100px){ .fg{ grid-template-columns:1fr 1fr 1fr!important; gap:32px!important; } }
          @media(max-width:700px){ .fg{ grid-template-columns:1fr 1fr!important; padding:40px 24px 32px!important; } .fb{ padding:16px 24px 20px!important; flex-direction:column!important; align-items:flex-start!important; } }
          @media(max-width:420px){ .fg{ grid-template-columns:1fr!important; } }
          @media(prefers-reduced-motion:reduce){ .fstatus-dot{ animation:none!important; } }
        `}</style>

        {/* Grille 5 colonnes */}
        <div className="fg">

          {/* Col 1: Brand */}
          <div>
            <Link href="/" aria-label="QRfolio — Accueil" style={{ textDecoration:"none", display:"inline-block", marginBottom:12 }}>
              <span style={{ fontFamily:"Cormorant Garamond, serif", fontSize:24, color:"#C9A84C", fontWeight:700, letterSpacing:"-0.01em" }}>QRfolio</span>
            </Link>
            <p style={{ color:"rgba(138,132,120,0.65)", fontSize:13, lineHeight:1.7, maxWidth:220, margin:0 }}>
              QRfolio transforme les QR codes en expériences interactives.
            </p>
            {/* Réseaux sociaux */}
            <div className="fsoc" role="list" aria-label="Réseaux sociaux">
              <a href="https://x.com/qrfolio" target="_blank" rel="noopener noreferrer" aria-label="QRfolio sur X (Twitter)" role="listitem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com/company/qrfolio" target="_blank" rel="noopener noreferrer" aria-label="QRfolio sur LinkedIn" role="listitem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://instagram.com/qrfolio" target="_blank" rel="noopener noreferrer" aria-label="QRfolio sur Instagram" role="listitem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
            </div>
          </div>

          {/* Col 2: Produit */}
          <nav aria-label="Navigation Produit">
            <p className="fc-title">Produit</p>
            <Link href="/features"          className="fl">Fonctionnalités</Link>
            <Link href="/#templates"        className="fl">Templates</Link>
            <Link href="/dashboard/builder" className="fl">Builder</Link>
            <Link href="/#analytics"        className="fl">Analytics</Link>
            <Link href="/#qr-dynamique"     className="fl">QR Codes</Link>
            <Link href="/#pricing"          className="fl">Tarifs</Link>
          </nav>

          {/* Col 3: Ressources */}
          <nav aria-label="Navigation Ressources">
            <p className="fc-title">Ressources</p>
            <Link href="/#faq"     className="fl">FAQ</Link>
            <Link href="/examples" className="fl">Exemples</Link>
            <Link href="/contact"  className="fl">Contact</Link>
            <span className="fl fl-soon" aria-label="Blog — bientôt disponible">Blog</span>
          </nav>

          {/* Col 4: Légal */}
          <nav aria-label="Navigation Légal">
            <p className="fc-title">Légal</p>
            <Link href="/privacy" className="fl">Confidentialité</Link>
            <Link href="/terms"   className="fl">Conditions</Link>
            <Link href="/legal"   className="fl">Mentions légales</Link>
          </nav>

          {/* Col 5: Entreprise */}
          <nav aria-label="Navigation Entreprise">
            <p className="fc-title">Entreprise</p>
            <span className="fl fl-soon" aria-label="À propos — bientôt disponible">À propos</span>
            <span className="fl fl-soon" aria-label="Roadmap — bientôt disponible">Roadmap</span>
            <span className="fl fl-soon" aria-label="Changelog — bientôt disponible">Changelog</span>
          </nav>

        </div>

        {/* Barre bas */}
        <div className="fb" role="contentinfo">
          <div style={{ display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" }}>
            <p style={{ color:"rgba(138,132,120,0.45)",fontSize:12,margin:0 }}>
              © {new Date().getFullYear()} QRfolio. Tous droits réservés.
            </p>
            <span style={{ color:"rgba(138,132,120,0.2)",fontSize:12 }} aria-hidden="true">·</span>
            <span style={{ color:"rgba(138,132,120,0.35)",fontSize:11,fontFamily:"monospace" }}>
              v1.0.0
            </span>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:16,flexWrap:"wrap" }}>
            <a href="https://status.qrfolio.app" target="_blank" rel="noopener noreferrer" className="fstatus" aria-label="Statut de la plateforme — Tous les systèmes opérationnels">
              <span className="fstatus-dot" aria-hidden="true"/>
              Tous les systèmes opérationnels
            </a>
            <div style={{ display:"flex",gap:14 }}>
              {([["Confidentialité","/privacy"],["Conditions","/terms"]] as const).map(([lbl,href])=>(
                <Link key={href} href={href} style={{ color:"rgba(138,132,120,0.4)",fontSize:12,textDecoration:"none",transition:"color 0.2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color="#C9A84C"}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color="rgba(138,132,120,0.4)"}}>
                  {lbl}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
