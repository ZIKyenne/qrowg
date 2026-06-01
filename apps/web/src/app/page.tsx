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
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}>
      {/* Glow ring */}
      <div style={{
        position: "absolute", inset: -20, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)",
        transform: pulse ? "scale(1.1)" : "scale(1)",
        transition: "transform 2s ease-in-out"
      }} />
      {/* Card */}
      <div style={{
        width: 280, height: 280, background: "#111009",
        border: "1px solid rgba(201,168,76,0.4)", borderRadius: 20,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, position: "relative", overflow: "hidden",
        boxShadow: pulse ? "0 0 60px rgba(201,168,76,0.3)" : "0 0 30px rgba(201,168,76,0.1)",
        transition: "box-shadow 2s ease-in-out"
      }}>
        {/* Shimmer */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.05) 50%, transparent 60%)",
          animation: "shimmer 3s infinite"
        }} />
        {/* QR grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, padding: 8 }}>
          {Array.from({ length: 49 }, (_, i) => {
            const corners = [0,1,2,7,8,9,14,15,16,6,13,20,3,4,5,10,11,12,17,18,19,
              28,29,30,35,36,37,42,43,44,49,32,33,34,39,40,41,46,47,48]
            const isGold = [24, 25, 26, 31, 32, 33, 38].includes(i)
            return (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: 2,
                background: isGold ? "#C9A84C" : corners.includes(i) ? "#F5F0E8" : Math.random() > 0.5 ? "#F5F0E8" : "transparent",
                opacity: isGold ? 1 : 0.9
              }} />
            )
          })}
        </div>
        <p style={{ color: "#C9A84C", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: 0 }}>qrfolio.app</p>
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

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <FadeIn delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? "rgba(201,168,76,0.08)" : "#111009",
          border: `1px solid ${hovered ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.15)"}`,
          borderRadius: 16, padding: "28px 24px",
          transition: "all 0.3s ease",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered ? "0 12px 40px rgba(201,168,76,0.12)" : "none",
          cursor: "default"
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
        <h3 style={{ color: "#F5F0E8", fontSize: 18, fontWeight: 600, margin: "0 0 8px", fontFamily: "Cormorant Garamond, serif" }}>{title}</h3>
        <p style={{ color: "#8A8478", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{desc}</p>
      </div>
    </FadeIn>
  )
}

// ── Pricing card ──────────────────────────────────────────────────────────────
function PricingCard({ plan, price, features, highlight, delay }: any) {
  const [hovered, setHovered] = useState(false)
  return (
    <FadeIn delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: highlight ? "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(57,255,143,0.05))" : "#111009",
          border: `1px solid ${highlight ? "rgba(201,168,76,0.6)" : hovered ? "rgba(201,168,76,0.3)" : "rgba(201,168,76,0.15)"}`,
          borderRadius: 20, padding: "32px 28px",
          position: "relative", overflow: "hidden",
          transform: highlight ? "scale(1.03)" : hovered ? "translateY(-4px)" : "none",
          transition: "all 0.3s ease",
          boxShadow: highlight ? "0 0 60px rgba(201,168,76,0.15)" : "none"
        }}
      >
        {highlight && (
          <div style={{
            position: "absolute", top: 16, right: 16,
            background: "linear-gradient(90deg, #C9A84C, #39FF8F)",
            borderRadius: 20, padding: "4px 12px",
            fontSize: 11, fontWeight: 700, color: "#080808", letterSpacing: 1
          }}>POPULAIRE</div>
        )}
        <p style={{ color: "#8A8478", fontSize: 13, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{plan}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
          <span style={{ color: "#F5F0E8", fontSize: 40, fontWeight: 700, fontFamily: "Cormorant Garamond, serif" }}>{price}</span>
          {price !== "0€" && <span style={{ color: "#8A8478", fontSize: 14 }}>/mois</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {features.map((f: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#39FF8F", fontSize: 14 }}>✓</span>
              <span style={{ color: "#8A8478", fontSize: 14 }}>{f}</span>
            </div>
          ))}
        </div>
        <Link href="/auth/signup" style={{
          display: "block", textAlign: "center", textDecoration: "none",
          padding: "12px 24px", borderRadius: 10, fontWeight: 600, fontSize: 14,
          background: highlight ? "linear-gradient(90deg, #C9A84C, #b8953f)" : "rgba(201,168,76,0.1)",
          color: highlight ? "#080808" : "#C9A84C",
          border: highlight ? "none" : "1px solid rgba(201,168,76,0.3)",
          transition: "all 0.2s ease"
        }}>
          {price === "0€" ? "Commencer gratuitement" : "Essayer 14 jours"}
        </Link>
      </div>
    </FadeIn>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [titleVisible, setTitleVisible] = useState(false)
  const [charIndex, setCharIndex] = useState(0)
  const title = "Votre identité, un QR code."

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!titleVisible) return
    if (charIndex < title.length) {
      const t = setTimeout(() => setCharIndex(i => i + 1), 45)
      return () => clearTimeout(t)
    }
  }, [titleVisible, charIndex, title.length])

  const features = [
    { icon: "⚡", title: "Builder drag & drop", desc: "Crée ta page en 5 minutes sans coder. Blocs prêts à l'emploi, thème personnalisable." },
    { icon: "📱", title: "QR codes dynamiques", desc: "Modifie ta page sans changer le QR. Les scans sont trackés en temps réel." },
    { icon: "📊", title: "Analytics détaillés", desc: "Vues, scans, appareils, sources de trafic. Comprends ton audience." },
    { icon: "🎨", title: "Design premium", desc: "Templates professionnels pour freelances, restaurants, artistes et plus." },
    { icon: "🔗", title: "Domaine personnalisé", desc: "Utilise ton propre domaine pour une image 100% professionnelle." },
    { icon: "👥", title: "Gestion d'équipe", desc: "Collaborez à plusieurs sur vos pages avec des rôles et permissions." },
  ]

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "DM Sans, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        * { box-sizing: border-box; }
      `}</style>

      <Particles />

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 48px",
        background: "rgba(8,8,8,0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(201,168,76,0.1)"
      }}>
        <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, color: "#C9A84C", fontWeight: 700 }}>QRfolio</span>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="#features" style={{ color: "#8A8478", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F5F0E8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8A8478")}>Fonctionnalités</Link>
          <Link href="#pricing" style={{ color: "#8A8478", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F5F0E8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8A8478")}>Tarifs</Link>
          <Link href="/auth/login" style={{ color: "#8A8478", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F5F0E8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8A8478")}>Connexion</Link>
          <Link href="/auth/signup" style={{
            background: "linear-gradient(90deg, #C9A84C, #b8953f)",
            color: "#080808", textDecoration: "none", fontSize: 14, fontWeight: 700,
            padding: "10px 20px", borderRadius: 10,
            transition: "opacity 0.2s", display: "inline-block"
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Commencer
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "120px 48px 80px", position: "relative", zIndex: 1
      }}>
        <div style={{ maxWidth: 1100, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{
              display: "inline-block", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: 20, padding: "6px 16px", marginBottom: 24,
              fontSize: 12, color: "#C9A84C", letterSpacing: 2, textTransform: "uppercase"
            }}>
              ✦ La page qui remplace ta carte de visite
            </div>
            <h1 style={{
              fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(36px, 5vw, 64px)",
              color: "#F5F0E8", fontWeight: 700, lineHeight: 1.1, margin: "0 0 24px",
              minHeight: "2.5em"
            }}>
              {title.slice(0, charIndex)}
              <span style={{ borderRight: "2px solid #C9A84C", animation: charIndex < title.length ? "none" : "blink 1s infinite", marginLeft: 2 }} />
            </h1>
            <p style={{ color: "#8A8478", fontSize: 18, lineHeight: 1.7, margin: "0 0 40px", maxWidth: 480 }}>
              Crée une landing page professionnelle en quelques minutes. Génère un QR code dynamique. Analyse chaque scan.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link href="/auth/signup" style={{
                background: "linear-gradient(90deg, #C9A84C, #b8953f)",
                backgroundSize: "200% 200%", animation: "gradientShift 3s ease infinite",
                color: "#080808", textDecoration: "none", fontSize: 16, fontWeight: 700,
                padding: "16px 32px", borderRadius: 12, display: "inline-block",
                boxShadow: "0 4px 24px rgba(201,168,76,0.4)", transition: "transform 0.2s, box-shadow 0.2s"
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(201,168,76,0.5)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(201,168,76,0.4)" }}>
                Créer ma page — c'est gratuit
              </Link>
              <Link href="#features" style={{
                background: "transparent", border: "1px solid rgba(201,168,76,0.3)",
                color: "#F5F0E8", textDecoration: "none", fontSize: 16,
                padding: "16px 32px", borderRadius: 12, display: "inline-block",
                transition: "all 0.2s"
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.6)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.05)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"; (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                Voir comment ça marche →
              </Link>
            </div>
            <p style={{ color: "#8A8478", fontSize: 13, marginTop: 20 }}>✓ Gratuit · ✓ Sans carte bancaire · ✓ Prêt en 5 min</p>
          </div>
          <div style={{ animation: "float 4s ease-in-out infinite", zIndex: 1 }}>
            <QRMockup />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p style={{ color: "#C9A84C", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>Fonctionnalités</p>
              <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px, 4vw, 48px)", color: "#F5F0E8", fontWeight: 700, margin: 0 }}>
                Tout ce dont tu as besoin
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 100} />)}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "100px 48px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p style={{ color: "#C9A84C", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>Tarifs</p>
              <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px, 4vw, 48px)", color: "#F5F0E8", fontWeight: 700, margin: 0 }}>
                Simple et transparent
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "center" }}>
            <PricingCard plan="Free" price="0€" delay={0}
              features={["1 page", "500 vues / mois", "QR code basique", "Branding QRfolio"]} />
            <PricingCard plan="Pro" price="9,90€" highlight delay={150}
              features={["Pages illimitées", "Vues illimitées", "Domaine personnalisé", "Analytics avancés", "Sans branding"]} />
            <PricingCard plan="Business" price="24,90€" delay={300}
              features={["Tout Pro inclus", "Gestion d'équipe", "Accès API", "Intégrations premium", "Support prioritaire"]} />
          </div>
        </div>
      </section>

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
