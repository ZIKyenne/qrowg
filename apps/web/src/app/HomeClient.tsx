"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { PLAN_LIST, PLAN_COMPARISON, PLANS as PLANS_DEF, fmtPrice } from "@/lib/plans"
import { useIsMobile } from "@/lib/useIsMobile"
import QrowgLogo from "@/components/QrowgLogo"
import EnTeteSite from "@/components/EnTeteSite"
import { serializeJsonLd } from "@/lib/jsonLd"
import { landingJsonLd } from "@/lib/landingJsonLd"

// ── Helpers ──────────────────────────────────────────────────────────────────

// ── Fond ─────────────────────────────────────────────────────────────────────
// 9 septembre : plus de particules — le fond est un aplat --bg (voir globals.css).

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
      style={{ position: "relative", width: "min(380px, 88vw)", aspectRatio: "1 / 1", margin: "0 auto",
        cursor: "default" }}
    >
      {/* Ecosysteme — cartes de metiers flottantes derriere le QR (donne l'impression
          d'une plateforme, pas d'un simple generateur). Purement decoratif. */}
      {[
        { label: "Restaurant", emoji: "🍽", pos: { top: "-6%",  left: "-33%"  }, rot: -9, dur: 6.5, delay: 0   },
        { label: "Portfolio",  emoji: "🎨", pos: { top: "8%",   right: "-35%" }, rot: 8,  dur: 7.5, delay: 0.9 },
        { label: "Immobilier", emoji: "🏠", pos: { bottom: "14%", left: "-38%" }, rot: -6, dur: 8,   delay: 1.6 },
        { label: "Bar",        emoji: "🍸", pos: { bottom: "-2%",  right: "-30%" }, rot: 10, dur: 6.8, delay: 0.5 },
      ].map((c) => (
        <div key={c.label} className="eco-card" aria-hidden="true" style={{
          position: "absolute", ...c.pos, zIndex: 0, pointerEvents: "none",
          transform: `rotate(${c.rot}deg)`, filter: "blur(0.4px)",
          animation: inView ? "revealUp 0.8s ease 0.4s both" : "none",
        }}>
          <div style={{  }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "10px 14px", borderRadius: 14,
              background: "rgba(20,18,13,0.94)",
              border: "1px solid var(--line-strong)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.2)",
              }}>{c.emoji}</span>
              <span style={{ color: "#E8E2D4", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>{c.label}</span>
            </div>
          </div>
        </div>
      ))}
      {/* Ambient glow outer */}
      <div style={{
        position: "absolute", inset: -40, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 65%)",
        transform: pulse ? "scale(1.15)" : "scale(1)",
        transition: "transform 2.4s ease-in-out",
        pointerEvents: "none"
      }} />
      {/* Card */}
      <div style={{
        width: "100%", height: "100%",
        background: "linear-gradient(145deg, #151210, #111009)",
        border: `1px solid ${hovered ? "rgba(201,168,76,0.6)" : pulse ? "rgba(201,168,76,0.45)" : "rgba(201,168,76,0.3)"}`,
        borderRadius: 22,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 18,
        position: "relative", overflow: "hidden",
        boxShadow: hovered
          ? "0 30px 80px rgba(0,0,0,0.55), 0 0 80px rgba(201,168,76,0.35), 0 0 160px rgba(201,168,76,0.1), inset 0 1px 0 rgba(201,168,76,0.15)"
          : pulse
          ? "0 26px 60px rgba(0,0,0,0.5), 0 0 50px rgba(201,168,76,0.2), 0 0 100px rgba(201,168,76,0.06)"
          : "0 24px 56px rgba(0,0,0,0.5), 0 0 30px rgba(201,168,76,0.1)",
        transform: hovered
          ? "perspective(1300px) rotateX(0deg) rotateY(0deg) translateY(-6px) scale(1.03)"
          : "perspective(1300px) rotateX(4deg) rotateY(-7deg) scale(1)",
        transition: "all 0.5s var(--mo-ease-spring)"
      }}>
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
        {/* Faisceau de scan — signature visuelle QRowg */}
        <div aria-hidden="true" style={{
          position: "absolute", left: "10%", right: "10%", top: "12%", height: 2, borderRadius: 2,
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.95), transparent)",
          boxShadow: "0 0 18px 3px rgba(201,168,76,0.55)",
          animation: "scanLine 3.4s ease-in-out infinite", pointerEvents: "none", zIndex: 3,
        }} />
        {/* QR grid (échelle relative -> grandit avec la carte). Construction progressive
            module par module a l'apparition (stagger sequentiel = effet "assemblage"). */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4.5%", width: "60%", aspectRatio: "1 / 1", position: "relative", zIndex: 1 }}>
          {Array.from({ length: 49 }, (_, i) => {
            const o = goldCells.includes(i) ? 1 : corners.includes(i) ? 0.92 : 0.5
            return (
              <div key={i} style={{
                aspectRatio: "1 / 1", borderRadius: "22%",
                background: goldCells.includes(i)
                  ? "#C9A84C"
                  : corners.includes(i)
                  ? "#F5F0E8"
                  : "rgba(245,240,232,0.15)",
                opacity: o,
                ["--o" as string]: o,
                boxShadow: goldCells.includes(i) ? "0 0 6px rgba(201,168,76,0.6)" : "none",
                animation: inView ? `qrReveal 0.5s var(--mo-ease-spring) ${i * 12}ms both` : "none",
                willChange: "transform, opacity",
              } as React.CSSProperties} />
            )
          })}
        </div>
        <p style={{ color: "#C9A84C", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", position: "relative", zIndex: 1, fontWeight: 600 }}>QROWG.COM</p>
      </div>
    </div>
  )
}

// ── Section wrapper avec fade-in ──────────────────────────────────────────────
// ── Features section ──────────────────────────────────────────────────────────
import { creerUrl } from "./creer/entry"
import { useInView, QRFinder, Eyebrow, QRMiniSvg } from "./homeUi"

// Sections sous la ligne de flottaison : chargées à part, pas dans le JavaScript de
// premier affichage. L'accueil était un seul composant de 3 976 lignes — tout le
// contenu de la page, jusqu'à la FAQ, était téléchargé et analysé avant que le
// héros ne s'anime. Chacune reste rendue côté serveur : le texte est dans le HTML,
// donc lisible par les moteurs de recherche, seul son JavaScript arrive plus tard.
import { FAQ_ITEMS } from "./homeSections/faqData"
const FeaturesSection = dynamic(() => import("./homeSections/Features").then(m => m.FeaturesSection))
const TemplatesSection = dynamic(() => import("./homeSections/Templates").then(m => m.TemplatesSection))
const AnalyticsSection = dynamic(() => import("./homeSections/Analytics").then(m => m.AnalyticsSection))
const UseCasesSection = dynamic(() => import("./homeSections/UseCases").then(m => m.UseCasesSection))
const PricingSection = dynamic(() => import("./homeSections/Pricing").then(m => m.PricingSection))
const FAQSection = dynamic(() => import("./homeSections/Faq").then(m => m.FAQSection))
// La démo interactive dessine un vrai QR dans un canvas : rien à indexer, et rien à
// afficher tant que le visiteur ne l'a pas atteinte.
const QRStudioLive = dynamic(() => import("./homeSections/QRStudioLive").then(m => m.QRStudioLive), {
  ssr: false,
  loading: () => <div style={{ minHeight: 520 }} aria-hidden="true" />,
})

// ── Couture entre sections ────────────────────────────────────────────────────
function SectionSeam() {
  // Séparateur signature : un trait et le « finder pattern » d'un QR au centre.
  return (
    <div aria-hidden="true" style={{
      position: "relative", overflow: "hidden", maxWidth: 1140, margin: "0 auto", zIndex: 1,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px",
    }}>
      <div style={{ flex: 1, maxWidth: 360, height: 1, background: "var(--line)" }} />
      <QRFinder size={14} color="rgba(201,168,76,0.5)" style={{ position: "relative" }} />
      <div style={{ flex: 1, maxWidth: 360, height: 1, background: "var(--line)" }} />
    </div>
  )
}

// ── Mockup narratif : le parcours animé Création → Scan → Analytics ───────────
// ── Colonne de footer : accordéon repliable sur mobile, normale sur desktop ───
function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  const isMobile = useIsMobile(700)
  const [open, setOpen] = useState(false)
  if (!isMobile) {
    return (
      <nav aria-label={"Navigation " + title}>
        <p className="fc-title">{title}</p>
        {children}
      </nav>
    )
  }
  return (
    <nav aria-label={"Navigation " + title} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: "9px 0", cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>
        <span className="fc-title" style={{ marginBottom: 0 }}>{title}</span>
        <span style={{ color: "#C9A84C", fontSize: 13, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}>▾</span>
      </button>
      <div style={{ overflow: "hidden", maxHeight: open ? 400 : 0, opacity: open ? 1 : 0, transition: "max-height 0.32s ease, opacity 0.25s ease", paddingBottom: open ? 8 : 0 }}>
        {children}
      </div>
    </nav>
  )
}

// ── Eyebrow de section : motif finder QR + label (signature récurrente) ───────

// ── Comparaison Qrowg vs Linktree vs carte papier ────────────────────────────
// Contenu factuel et defendable : Linktree recoit du credit la ou il le merite
// (editable, analytics/domaine en payant = "partiel"). On ne surclaime pas.
export default function HomeClient() {
  // Barre CTA mobile : apparaît une fois le hero dépassé, MAIS se masque pres du
  // bas de page pour ne pas doublonner le CTA final (#01).
  const [showSticky, setShowSticky] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const nearBottom = y + window.innerHeight >= document.documentElement.scrollHeight - 260
      setShowSticky(y > 620 && !nearBottom)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll) }
  }, [])



  return (
    <div style={{ background: "transparent", minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      {/* Données structurées (SEO) — Organization/WebSite/SoftwareApplication+offres/
          HowTo/FAQPage/BreadcrumbList, construites depuis le vrai contenu. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(landingJsonLd(FAQ_ITEMS)) }} />
      <style>{`
        html { scroll-padding-top: 80px; }
        @keyframes heroShimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;}}
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes qrReveal { from{opacity:0;transform:scale(0.25)} to{opacity:var(--o,1);transform:scale(1)} }
        @keyframes revealUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sweepLight { 0%{transform:translateX(-140%) skewX(-18deg);opacity:0} 12%{opacity:0.9} 30%{opacity:0} 100%{transform:translateX(140%) skewX(-18deg);opacity:0} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes heroAura { 0%,100%{opacity:0.82;transform:translateX(-50%) scale(1)} 50%{opacity:1;transform:translateX(-50%) scale(1.06)} }
        @keyframes ctaPulse { 0%,100%{box-shadow:0 4px 28px rgba(201,168,76,0.42)} 50%{box-shadow:0 6px 40px rgba(201,168,76,0.62),0 0 0 6px rgba(201,168,76,0.07)} }
        @keyframes scanLine { 0%{top:12%;opacity:0} 12%{opacity:1} 50%{top:84%} 60%{opacity:1} 70%{opacity:0} 100%{top:84%;opacity:0} }
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
        @media (max-width: 760px) { .hero-finder { display: none !important; } }
        @media (max-width: 900px) { .eco-card { display: none !important; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* NAV */}
      <EnTeteSite />

      {/* HERO */}
      <section style={{
        minHeight: "min(100vh, 740px)", display: "flex", alignItems: "center",
        padding: "88px 48px 56px", position: "relative", zIndex: 1, overflow: "hidden"
      }}>
        {/* Ambiance cinématographique — halo doré lumineux + profondeur + vignette */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(125% 80% at 50% 2%, transparent 52%, rgba(0,0,0,0.55) 100%)" }} />
          {/* Halo carré (signature : finder pattern QR, pas un cercle) */}
          <div className="hero-finder" style={{ position: "absolute", top: "14%", right: "8%", width: 180, height: 180, borderRadius: 36, background: "radial-gradient(rgba(201,168,76,0.10), transparent 70%)", filter: "blur(26px)" }} />
        </div>
        <div className="hero-grid" style={{
          maxWidth: 1140, width: "100%", margin: "0 auto", position: "relative", zIndex: 1,
          display: "grid", gridTemplateColumns: "1.1fr 0.9fr",
          gap: 52, alignItems: "center"
        }}>
          {/* Left: texte */}
          <div>
            {/* Badge */}
            <div className="hero-badge" style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.28)",
              borderRadius: 11, padding: "8px 15px", marginBottom: 20,
              fontSize: 11, color: "#D8BE72", letterSpacing: 2,
              textTransform: "uppercase", fontWeight: 700,
            }}>
              <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 2, background: "#C9A84C",  }} />
              Reliez le monde physique au digital
            </div>

            {/* Titre — hiérarchie forte, rendu immédiatement (revue du 9 septembre :
                le contenu essentiel n'attend aucune animation d'entrée, JavaScript ou non).
                Les 2 premières lignes posent le produit, la 3e (or) porte le différenciateur. */}
            <h1 style={{
              fontFamily: "Fraunces, serif",
              fontSize: "clamp(30px, 3.4vw, 52px)",
              color: "#F5F0E8", fontWeight: 800, lineHeight: 1.06,
              margin: "0 0 18px", letterSpacing: "-0.02em",
            }}>
              <span style={{ display: "block" }}>
                Votre page pro et son
              </span>
              <span style={{ display: "block", color: "var(--accent)" }}>
                QR code dynamique,
              </span>
              <span style={{ display: "block" }}>
                prêts en 5 minutes.
              </span>
            </h1>

            {/* Sous-titre — benefice d'abord, phrases courtes, tres lisible */}
            <p style={{
              color: "rgba(226,220,206,0.92)", fontSize: 16.5, lineHeight: 1.58,
              margin: "0 0 26px", maxWidth: 452, fontWeight: 400,
            }}>
              Pour les <strong style={{ color: "#F5F0E8", fontWeight: 600 }}>commerçants, indépendants et créateurs</strong> : créez votre page (menu, portfolio, liens…), générez son <strong style={{ color: "#F5F0E8", fontWeight: 600 }}>QR&nbsp;code dynamique</strong>, imprimez-le — puis <strong style={{ color: "#F5F0E8", fontWeight: 600 }}>suivez chaque scan</strong>. Modifiable à tout moment, sans jamais réimprimer.
            </p>

            {/* CTAs */}
            <div className="hero-ctas" style={{
              display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center",
            }}>
              <Link href="/creer" style={{
                background: "var(--accent)",
                color: "var(--ink-on-accent)", textDecoration: "none", fontSize: 15, fontWeight: 700,
                padding: "15px 32px", borderRadius: 12, display: "inline-block",
                boxShadow: "0 4px 28px rgba(201,168,76,0.45), 0 0 0 0 rgba(201,168,76,0)",
                transition: "transform 0.25s var(--mo-ease-spring), box-shadow 0.25s ease",
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
                Composer ma page — sans compte <span aria-hidden="true">→</span>
              </Link>
              <Link href="#qr-studio" style={{
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
                Tester le générateur de QR
              </Link>
            </div>

            {/* Micro-réassurance */}
            <div className="hero-reassurance" style={{
              display: "flex", gap: 20, marginTop: 26, flexWrap: "wrap",
            }}>
              {[
                { t: "Chiffré", href: "/security" },
                { t: "Hébergé en Europe", href: "/security" },
                { t: "QR dynamique", href: undefined as string | undefined },
                { t: "Sans engagement", href: undefined as string | undefined },
              ].map(({ t, href }) => {
                // Mesure au navigateur : 15 px de haut pour deux liens vers la page
                // Securite. `minHeight` sur les deux, marge negative pour que la ligne
                // garde exactement la meme allure ; les deux mentions non cliquables
                // gardent leur hauteur naturelle.
                const st: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, color: "#BCB6A6", fontSize: 12.5, textDecoration: "none" }
                const stLien: React.CSSProperties = { ...st, minHeight: 44, margin: "-14px 0" }
                const inner = <><span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 2, background: "rgba(201,168,76,0.85)" }} />{t}</>
                return href
                  ? <Link key={t} href={href} style={stLien} title="En savoir plus sur la sécurité">{inner}</Link>
                  : <span key={t} style={st}>{inner}</span>
              })}
            </div>
          </div>

          {/* Right: QR */}
          <div className="hero-qr" style={{
            
            zIndex: 1, display: "flex", justifyContent: "center"
          }}>
            <QRMockup />
          </div>
        </div>
      </section>

      {/* (Bande de réassurance retirée : redondante avec les puces du hero.) */}

      {/* LE SYSTÈME QROWG — les 6 étapes en sommaire, puis les 6 fonctionnalités
          (une seule section depuis la revue interne du 9 septembre). */}
      <FeaturesSection />
      <SectionSeam />

      {/* TEMPLATES — les RÉSULTATS montrés AVANT le builder (« voici ce que vous pouvez créer »). */}
      <TemplatesSection />
      <SectionSeam />

      {/* BuilderSection retiree (declutter accueil) — composant conserve, non rendu. */}

      {/* StoryFlow retiree (declutter accueil) — composant conserve, non rendu. */}

      {/* QR STUDIO LIVE — démo interactive (vrai QR généré en local, aperçu en direct) */}
      <QRStudioLive />
      <SectionSeam />

      {/* QR DYNAMIQUE — fusionné : concept déjà couvert (hero, key-points, fonctionnalités, FAQ).
          Section retirée pour réduire la redondance (Pb 10). Le composant est conservé
          dans homeSectionsRetirees.tsx, sous le nom QRDynamicSection. */}

      {/* ANALYTICS */}
      <AnalyticsSection />
      <SectionSeam />

      {/* PrintStudioSection retiree (declutter accueil) — composant conserve, non rendu. */}

      {/* USE CASES */}
      <UseCasesSection />
      <SectionSeam />

      {/* BrandProSection retiree (declutter accueil) — le "Sans branding" reste dans les tarifs. */}

      {/* ComparisonSection retiree (declutter accueil) — composant conserve, non rendu. */}

      {/* PRICING */}
      <PricingSection />
      <SectionSeam />

      {/* FAQ */}
      <FAQSection />

      {/* CTA FINAL */}
      <section className="cta-final-section" style={{ padding:"56px 48px 48px", position:"relative", zIndex:1, overflow:"hidden" }}>
        <style>{`
          @keyframes ctaGlow{0%,100%{opacity:0.5}50%{opacity:1}}
          @media(max-width:640px){ .cta-final-section{padding:64px 20px 56px!important;} }
        `}</style>
        {/* Halo cinématographique du CTA final */}
        <div style={{
          maxWidth:820, margin:"0 auto", textAlign:"center",
          position:"relative", zIndex:1,
        }}>

          {/* Card */}
          <div style={{
            background:"var(--surface)",
            border:"1px solid var(--line-strong)",
            borderRadius:20, padding:"36px 36px",
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

            {/* QR flottant — l'objet de désir, en tête du CTA */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
              <div style={{
                width:72, height:72, borderRadius:18,
                background:"linear-gradient(145deg,#151210,#0d0c09)",
                border:"1px solid rgba(201,168,76,0.42)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 16px 44px rgba(0,0,0,0.55), 0 0 54px rgba(201,168,76,0.2)",
                
              }}>
                <QRMiniSvg fg="#F5F0E8" bg="transparent" accent="#C9A84C" size={46} />
              </div>
            </div>

            <h2 style={{
              fontFamily:"Fraunces, serif",
              fontSize:"clamp(28px,3.4vw,44px)",
              color:"#F5F0E8", fontWeight:700,
              margin:"0 0 16px", lineHeight:1.12,
              letterSpacing:"-0.02em",
            }}>
              Prêt à transformer votre QR code en{" "}
              <span style={{ color:"#C9A84C" }}>vraie page professionnelle ?</span>
            </h2>

            <p style={{
              color:"rgba(188,182,166,0.85)", fontSize:17,
              lineHeight:1.7, margin:"0 0 32px", maxWidth:520,
              marginLeft:"auto", marginRight:"auto",
            }}>
              Créez votre QRowg gratuitement, personnalisez votre page et commencez à suivre vos scans en quelques minutes.
            </p>

            <Link href="/creer" style={{
              display:"inline-flex", alignItems:"center", gap:10,
              background:"var(--accent)",
              color:"var(--ink-on-accent)", textDecoration:"none",
              fontSize:16, fontWeight:800,
              padding:"16px 40px", borderRadius:13,
              letterSpacing:0.2,
              transition:"transform 0.25s var(--mo-ease-spring), box-shadow 0.25s",
            }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="translateY(-3px) scale(1.03)";el.style.animation="none";el.style.boxShadow="0 8px 40px rgba(201,168,76,0.55)"}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform="none"}}>
              Composer ma page — sans compte
              <span style={{ fontSize:18 }}>→</span>
            </Link>

            <p style={{
              color:"rgba(188,182,166,0.5)", fontSize:12.5,
              margin:"20px 0 0", letterSpacing:0.3,
            }}>
              Gratuit · Sans carte bancaire · Annulation à tout moment
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid rgba(201,168,76,0.1)", position:"relative", zIndex:2 }} aria-label="Pied de page">
        <style>{`
          .fg { display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr 1fr 1fr; gap:36px; padding:44px 48px 40px; }
          .fc-title { color:#C9A84C; font-size:10px; letter-spacing:2.5px; text-transform:uppercase; font-weight:700; margin-bottom:18px; }
          .fl { display:block; color:rgba(188,182,166,0.72); text-decoration:none; font-size:13.5px; margin-bottom:11px; line-height:1.4; transition:color 0.2s; }
          .fl:hover { color:#F5F0E8; }
          .fl:focus-visible { outline:2px solid rgba(201,168,76,0.5); outline-offset:3px; border-radius:3px; }
          .fl-soon { color:rgba(188,182,166,0.35) !important; cursor:default; pointer-events:none; }
          .fl-soon::after { content:" (bientôt)"; font-size:10px; }
          .fb { padding:16px 48px 24px; border-top:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
          .fsoc { display:flex; align-items:center; gap:8px; margin-top:20px; }
          .fsoc a { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); color:rgba(188,182,166,0.65); text-decoration:none; font-size:14px; transition:all 0.2s; }
          .fsoc a:hover { border-color:rgba(201,168,76,0.4); color:#C9A84C; background:rgba(201,168,76,0.07); }
          .fsoc a:focus-visible { outline:2px solid rgba(201,168,76,0.5); outline-offset:3px; }
          .fstatus { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; background:rgba(57,255,143,0.07); border:1px solid rgba(57,255,143,0.18); color:rgba(57,255,143,0.8); font-size:11px; font-weight:600; text-decoration:none; transition:all 0.2s; }
          .fstatus:hover { background:rgba(57,255,143,0.12); border-color:rgba(57,255,143,0.35); }
          .fstatus-dot { width:6px; height:6px; border-radius:50%; background:var(--success); animation:fpulse 2s ease-in-out infinite; }
          @keyframes fpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @media(max-width:1100px){ .fg{ grid-template-columns:1fr 1fr 1fr!important; gap:32px!important; } }
          @media(max-width:700px){
            /* Footer ultra compact sur mobile : 1 colonne, accordéons repliés, méta masquée */
            .fg{ grid-template-columns:1fr!important; gap:0!important; padding:16px 22px 8px!important; }
            .f-brand-desc{ display:none!important; }
            .f-brand-link{ margin-bottom:6px!important; }
            .f-brand-link span{ font-size:19px!important; }
            .fl{ margin-bottom:6px!important; font-size:13px!important; }
            .fsoc{ margin-top:8px!important; margin-bottom:4px!important; gap:6px!important; }
            .fsoc a{ width:26px!important; height:26px!important; }
            .fb{ padding:10px 22px 14px!important; flex-direction:column!important; align-items:flex-start!important; gap:6px!important; }
            .fstatus{ display:none!important; }
            .f-meta{ display:none!important; }
          }
          @media(prefers-reduced-motion:reduce){ .fstatus-dot{ animation:none!important; } }
        `}</style>

        {/* Grille 6 colonnes (brand + 5 colonnes de liens) */}
        <div className="fg">

          {/* Col 1: Brand */}
          <div>
            <Link href="/" aria-label="QRowg — Accueil" className="f-brand-link" style={{ textDecoration:"none", display:"inline-block", marginBottom:12 }}>
              <QrowgLogo size={24} />
            </Link>
            <p className="f-brand-desc" style={{ color:"rgba(188,182,166,0.65)", fontSize:13, lineHeight:1.7, maxWidth:220, margin:0 }}>
              QRowg transforme les QR codes en expériences interactives.
            </p>
            {/* Réseaux sociaux — retirés jusqu'à l'ouverture des comptes officiels
                (règle anti-faux : pas de liens vers des comptes inexistants). */}
          </div>

          {/* Col 2: Produit */}
          <FooterCol title="Produit">
            <Link href="/features"          className="fl">Fonctionnalités</Link>
            <Link href="/#templates"        className="fl">Modèles</Link>
            {/* /dashboard/* est bloqué aux robots : un lien de pied de page vers
                l'éditeur envoyait Google dans un cul-de-sac, et un visiteur sans
                compte sur un écran de connexion. /creer est la même porte, ouverte. */}
            <Link href="/creer"             className="fl">Composer ma page</Link>
            <Link href="/#analytics"        className="fl">Statistiques</Link>
            <Link href="/#features"         className="fl">QR Codes</Link>
            <Link href="/#pricing"          className="fl">Tarifs</Link>
          </FooterCol>

          {/* Col 3: Ressources */}
          <FooterCol title="Ressources">
            <Link href="/guides"   className="fl">Guides</Link>
            <Link href="/#faq"     className="fl">FAQ</Link>
            <Link href="/examples" className="fl">Exemples</Link>
            <Link href="/contact"  className="fl">Contact</Link>
            <span className="fl fl-soon" aria-label="Blog — bientôt disponible">Blog</span>
          </FooterCol>

          {/* Col: QR codes par usage (maillage interne SEO) */}
          <FooterCol title="QR codes">
            <Link href="/generateur-qr-code"   className="fl">Générateur gratuit</Link>
            <Link href="/qr-code"              className="fl">Tous les usages</Link>
            <Link href="/qr-code/restaurant"   className="fl">QR code restaurant</Link>
            <Link href="/qr-code/menu"         className="fl">QR code menu</Link>
            <Link href="/qr-code/avis-google"  className="fl">QR code avis Google</Link>
            <Link href="/qr-code/wifi"         className="fl">QR code Wi-Fi</Link>
          </FooterCol>

          {/* Col 4: Légal */}
          <FooterCol title="Légal">
            <Link href="/security" className="fl">Sécurité</Link>
            <Link href="/privacy" className="fl">Confidentialité</Link>
            <Link href="/terms"   className="fl">Conditions</Link>
            <Link href="/legal"   className="fl">Mentions légales</Link>
          </FooterCol>

          {/* Col 5: Entreprise */}
          <FooterCol title="Entreprise">
            <span className="fl fl-soon" aria-label="À propos — bientôt disponible">À propos</span>
            <span className="fl fl-soon" aria-label="Roadmap — bientôt disponible">Roadmap</span>
            <span className="fl fl-soon" aria-label="Changelog — bientôt disponible">Changelog</span>
          </FooterCol>

        </div>

        {/* Barre bas */}
        <div className="fb" role="contentinfo">
          <div style={{ display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" }}>
            <p style={{ color:"rgba(188,182,166,0.45)",fontSize:12,margin:0 }}>
              © {new Date().getFullYear()} QRowg. Tous droits réservés.
            </p>
            <span className="f-meta" style={{ color:"rgba(188,182,166,0.2)",fontSize:12 }} aria-hidden="true">·</span>
            <span className="f-meta" style={{ color:"rgba(188,182,166,0.35)",fontSize:11,fontFamily:"monospace" }}>
              v1.0.0
            </span>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:16,flexWrap:"wrap" }}>
            <span className="fstatus" role="status" aria-label="Tous les systèmes opérationnels">
              <span className="fstatus-dot" aria-hidden="true"/>
              Tous les systèmes opérationnels
            </span>
            <div style={{ display:"flex",gap:14 }}>
              {([["Confidentialité","/privacy"],["Conditions","/terms"]] as const).map(([lbl,href])=>(
                <Link key={href} href={href} style={{ color:"rgba(188,182,166,0.4)",fontSize:12,textDecoration:"none",transition:"color 0.2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color="#C9A84C"}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color="rgba(188,182,166,0.4)"}}>
                  {lbl}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Reserve d'espace en bas quand la barre CTA collante est visible (mobile) -> ne masque plus le contenu */}
      <div aria-hidden className={`m-sticky-cta-spacer${showSticky ? " show" : ""}`} />
      {/* CTA mobile collant — apparaît après le hero, masqué sur desktop (CSS .m-sticky-cta) */}
      <div className={`m-sticky-cta${showSticky ? " show" : ""}`} aria-hidden={!showSticky}>
        <Link href="/creer" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "14px", borderRadius: 12,
          background: "var(--accent)",
          color: "var(--ink-on-accent)", fontWeight: 800, fontSize: 15, textDecoration: "none",
          }}>
          Composer ma page — sans compte <span style={{ fontSize: 16 }}>→</span>
        </Link>
      </div>
    </div>
  )
}
