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

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState("")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const sections = ["features","templates","examples","pricing","faq"]
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: "-40% 0px -55% 0px" }
    )
    sections.forEach(id => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const NAV_LINKS = [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Templates",       href: "#templates" },
    { label: "Exemples",        href: "#examples" },
    { label: "Tarifs",          href: "#pricing" },
    { label: "FAQ",             href: "#faq" },
  ]

  const linkStyle = (id: string) => ({
    color: active === id ? "#F5F0E8" : "#8A8478",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: active === id ? 600 : 400,
    position: "relative" as const,
    paddingBottom: 2,
    transition: "color 0.2s ease",
    outline: "none",
  })

  return (
    <>
      <style>{`
        .nav-link::after {
          content: "";
          position: absolute;
          bottom: -2px; left: 0; right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, #C9A84C, #d4a843);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
          border-radius: 2px;
        }
        .nav-link:hover::after,
        .nav-link.active::after { transform: scaleX(1); }
        .nav-link:hover { color: #F5F0E8 !important; }
        .nav-link:focus-visible {
          outline: 2px solid rgba(201,168,76,0.6);
          outline-offset: 4px;
          border-radius: 4px;
        }
        .nav-cta:focus-visible {
          outline: 2px solid rgba(201,168,76,0.8);
          outline-offset: 3px;
          border-radius: 11px;
        }
        .mobile-link {
          display: block;
          color: #8A8478;
          text-decoration: none;
          font-size: 18px;
          font-weight: 500;
          padding: 16px 0;
          border-bottom: 1px solid rgba(201,168,76,0.08);
          transition: color 0.2s ease;
        }
        .mobile-link:hover, .mobile-link.active { color: #F5F0E8; }
        .mobile-link:focus-visible {
          outline: 2px solid rgba(201,168,76,0.6);
          outline-offset: 4px;
          border-radius: 4px;
        }
        @keyframes menuSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-link::after { transition: none; }
        }
      `}</style>

      <nav
        role="navigation"
        aria-label="Navigation principale"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 48px",
          height: 68,
          background: scrolled
            ? "rgba(8,8,8,0.92)"
            : "rgba(8,8,8,0.6)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderBottom: scrolled
            ? "1px solid rgba(201,168,76,0.18)"
            : "1px solid rgba(201,168,76,0.06)",
          transition: "background 0.3s ease, border-color 0.3s ease",
          boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="QRfolio - Retour à l'accueil"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}
        >
          <span style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: 22, color: "#C9A84C", fontWeight: 700,
            letterSpacing: "-0.01em"
          }}>QRfolio</span>
        </Link>

        {/* Desktop links */}
        <div
          role="menubar"
          aria-label="Liens de navigation"
          style={{
            display: "flex", alignItems: "center", gap: 36,
          }}
          className="desktop-nav"
        >
          {NAV_LINKS.map(({ label, href }) => {
            const id = href.replace("#", "")
            const isActive = active === id
            return (
              <Link
                key={href}
                href={href}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
                className={"nav-link" + (isActive ? " active" : "")}
                style={linkStyle(id)}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Desktop right */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }} className="desktop-nav">
          <Link
            href="/auth/login"
            className="nav-link"
            style={{ color: "#8A8478", textDecoration: "none", fontSize: 14, position: "relative", paddingBottom: 2, transition: "color 0.2s ease" }}
          >
            Connexion
          </Link>
          <Link
            href="/auth/signup"
            className="nav-cta"
            aria-label="Commencer gratuitement"
            style={{
              background: "linear-gradient(90deg, #C9A84C, #b8953f)",
              color: "#080808", textDecoration: "none",
              fontSize: 14, fontWeight: 700,
              padding: "9px 22px", borderRadius: 10,
              display: "inline-block",
              boxShadow: "0 2px 16px rgba(201,168,76,0.3)",
              transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, opacity 0.2s ease",
              whiteSpace: "nowrap" as const,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = "translateY(-2px) scale(1.03)"
              el.style.boxShadow = "0 6px 24px rgba(201,168,76,0.5)"
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = "translateY(0) scale(1)"
              el.style.boxShadow = "0 2px 16px rgba(201,168,76,0.3)"
            }}
          >
            Commencer
          </Link>

          {/* Burger mobile */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="mobile-burger"
            style={{
              display: "none",
              background: "none", border: "none",
              cursor: "pointer", padding: 8,
              color: "#F5F0E8", flexDirection: "column",
              gap: 5, alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{
              display: "block", width: 22, height: 1.5,
              background: "#C9A84C", borderRadius: 2,
              transform: menuOpen ? "rotate(45deg) translate(4.5px, 4.5px)" : "none",
              transition: "transform 0.25s ease"
            }} />
            <span style={{
              display: "block", width: 22, height: 1.5,
              background: "#C9A84C", borderRadius: 2,
              opacity: menuOpen ? 0 : 1,
              transition: "opacity 0.2s ease"
            }} />
            <span style={{
              display: "block", width: 22, height: 1.5,
              background: "#C9A84C", borderRadius: 2,
              transform: menuOpen ? "rotate(-45deg) translate(4.5px, -4.5px)" : "none",
              transition: "transform 0.25s ease"
            }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-label="Menu mobile"
          style={{
            position: "fixed", top: 68, left: 0, right: 0, bottom: 0,
            zIndex: 199,
            background: "rgba(8,8,8,0.97)",
            backdropFilter: "blur(20px)",
            padding: "32px 32px 48px",
            display: "flex", flexDirection: "column",
            animation: "menuSlideIn 0.25s ease",
            overflowY: "auto",
          }}
        >
          {NAV_LINKS.map(({ label, href }) => {
            const id = href.replace("#", "")
            return (
              <Link
                key={href}
                href={href}
                className={"mobile-link" + (active === id ? " active" : "")}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            )
          })}
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{
              display: "block", textAlign: "center",
              color: "#8A8478", textDecoration: "none",
              fontSize: 16, padding: "14px",
              border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12,
              transition: "all 0.2s ease"
            }}>
              Connexion
            </Link>
            <Link href="/auth/signup" onClick={() => setMenuOpen(false)} style={{
              display: "block", textAlign: "center",
              background: "linear-gradient(90deg, #C9A84C, #b8953f)",
              color: "#080808", textDecoration: "none",
              fontSize: 16, fontWeight: 700, padding: "16px",
              borderRadius: 12,
              boxShadow: "0 4px 24px rgba(201,168,76,0.4)"
            }}>
              Commencer gratuitement →
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-burger { display: flex !important; }
        }
        @media (min-width: 901px) {
          .mobile-burger { display: none !important; }
          #mobile-menu { display: none !important; }
        }
        nav { padding: 0 48px !important; }
        @media (max-width: 640px) {
          nav { padding: 0 20px !important; }
        }
      `}</style>
    </>
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

  const features = [
    { icon: "⚡", title: "Builder drag & drop", desc: "Crée ta page en 5 minutes sans coder." },
    { icon: "📱", title: "QR codes dynamiques", desc: "Modifie ta page sans changer le QR. Toujours à jour." },
    { icon: "📊", title: "Analytics détaillés", desc: "Vues, scans, appareils, sources de trafic en temps réel." },
    { icon: "🎨", title: "Design premium", desc: "Templates professionnels pour freelances, créateurs, pros." },
    { icon: "🔗", title: "Domaine personnalisé", desc: "Utilise ton propre domaine pour une image professionnelle." },
    { icon: "👥", title: "Gestion d'équipe", desc: "Collaborez à plusieurs sur vos pages avec les rôles." },
  ]

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
