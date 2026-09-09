"use client"

import { useState } from "react"
import Link from "next/link"
import { useInView, Eyebrow } from "../homeUi"

// Revue interne du 9 septembre : « Comment ça marche » (6 étapes) et « Tout ce
// qu'il faut pour convertir » (6 cartes) se recouvraient. Une seule section :
// les 6 étapes en sommaire, à plat, puis les 6 cartes, toutes de la même taille.

export const HOW_STEPS = [
  { title: "Créer",         desc: "Composez votre page : menu, portfolio, promo, contact…" },
  { title: "Connecter",     desc: "Générez le QR code dynamique relié à cette page." },
  { title: "Personnaliser", desc: "Couleurs, logo, style — le QR et la page à votre image." },
  { title: "Imprimer",      desc: "Affiche, sticker, carte, chevalet, flyer — prêt à imprimer." },
  { title: "Convertir",     desc: "Réservation, WhatsApp, appel, achat, avis Google." },
  { title: "Mesurer",       desc: "Suivez chaque scan et optimisez ce qui marche." },
] as const

const FEATURES = [
  {
    icon: "⚡",
    tag: "Éditeur simple",
    title: "Créez votre page sans rien coder",
    desc: "Un éditeur en glisser-déposer, des blocs prêts à l'emploi : votre page est en ligne en 5 minutes.",
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
    detail: {
      role: "Le QR code pointe vers votre page QRowg. Vous modifiez la page, le QR code imprimé reste valable.",
      example: "Un restaurant imprime le QR sur ses tables une seule fois, puis change son menu chaque semaine.",
      benefit: "Vous économisez les réimpressions et vous corrigez une erreur en 30 secondes.",
    },
  },
  {
    icon: "📊",
    tag: "Statistiques",
    title: "Sachez exactement qui scanne",
    desc: "Vues, scans, appareils et sources de trafic, en temps réel. Vous pilotez vos résultats.",
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
    desc: "Votre domaine personnalisé, sans mention QRowg, avec un design premium. Une image irréprochable.",
    detail: {
      role: "Votre page sur votre propre nom de domaine, sans aucune mention QRowg.",
      example: "Un cabinet utilise carte.soncabinet.fr : ses clients ne voient que sa marque.",
      benefit: "Une image 100 % professionnelle qui inspire confiance et crédibilité.",
    },
  },
] as const

export function FeaturesSection() {
  const { ref, visible } = useInView(0.06)
  const [hovered, setHovered] = useState<number | null>(null)
  const [info, setInfo] = useState<number | null>(null)
  const fInfo = info !== null ? FEATURES[info] : null
  return (
    <section
      id="features"
      ref={ref}
      aria-labelledby="features-title"
      style={{ padding: "64px 48px", position: "relative", zIndex: 1 }}
    >
      <style>{`
        .how-steps { list-style:none; margin:0 auto 36px; padding:0; max-width:1140px;
          display:grid; grid-template-columns:repeat(6,1fr); gap:0;
          border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
        .how-step { padding:16px 14px 16px 0; display:flex; flex-direction:column; gap:4px; border-right:1px solid var(--line); margin-right:14px; }
        .how-step:last-child { border-right:none; margin-right:0; }
        .feat-grid { max-width:1140px; margin:0 auto; display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media (max-width: 1000px) {
          .how-steps { grid-template-columns:repeat(3,1fr); }
          .how-step:nth-child(3) { border-right:none; margin-right:0; }
          .how-step:nth-child(-n+3) { border-bottom:1px solid var(--line); }
        }
        @media (max-width: 900px) { .feat-grid { grid-template-columns:repeat(2,1fr); } }
        @media (max-width: 580px) {
          .how-steps { grid-template-columns:repeat(2,1fr); }
          .how-step { border-right:none; margin-right:0; padding-right:10px; }
          .how-step:nth-child(odd) { border-right:1px solid var(--line); margin-right:10px; }
          .how-step:nth-child(-n+4) { border-bottom:1px solid var(--line); }
          .how-step:nth-child(3) { border-right:1px solid var(--line); margin-right:10px; }
          .feat-grid { grid-template-columns:1fr; }
          #features { padding:56px 24px !important; }
        }
      `}</style>

      {/* En-tête */}
      <div style={{
        maxWidth: 1140, margin: "0 auto 36px", textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <Eyebrow>Le système QRowg</Eyebrow>
        <h2 id="features-title" style={{
          fontFamily: "Fraunces, serif",
          fontSize: "clamp(28px, 3.4vw, 44px)",
          color: "#F5F0E8", fontWeight: 700, margin: "0 auto",
          lineHeight: 1.1, maxWidth: 800, letterSpacing: "-0.02em",
        }}>
          Du support physique{" "}
          <span style={{ color: "var(--accent)" }}>à la mesure</span>
        </h2>
      </div>

      {/* Sommaire : les 6 temps du système, dans l'ordre où on les vit */}
      <ol className="how-steps" aria-label="Les six étapes" style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s ease 0.1s" }}>
        {HOW_STEPS.map((step, i) => (
          <li key={step.title} className="how-step">
            <span style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
            <h3 style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{step.title}</h3>
            <p style={{ color: "var(--muted)", fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
          </li>
        ))}
      </ol>

      {/* Les 6 cartes, toutes de la même taille, à plat */}
      <div className="feat-grid">
        {FEATURES.map((f, i) => {
          const isHovered = hovered === i
          return (
            <div
              key={f.tag}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isHovered ? "var(--surface-2)" : "var(--surface)",
                border: `1px solid ${isHovered ? "var(--line-strong)" : "var(--line)"}`,
                borderRadius: 14,
                padding: "22px 22px 24px",
                display: "flex", flexDirection: "column", gap: 12,
                position: "relative",
                transform: visible ? "translateY(0)" : "translateY(20px)",
                opacity: visible ? 1 : 0,
                transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms, border-color 0.2s ease, background 0.2s ease`,
              }}
            >
              {/* Bouton info → fenêtre explicative. La pastille fait 22 px ; le bouton
                  qui la porte fait 40 px : cible tactile conforme, même dessin. */}
              <button type="button" onClick={() => setInfo(i)} aria-label={"En savoir plus : " + f.title}
                style={{ position: "absolute", top: 7, right: 7, width: 40, height: 40, borderRadius: "50%", background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <span aria-hidden style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: `1px solid ${isHovered ? "var(--line-strong)" : "var(--line)"}`, color: isHovered ? "var(--ink)" : "var(--muted)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>?</span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                  background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
                }} aria-hidden>{f.icon}</div>
                <span style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase" }}>{f.tag}</span>
              </div>
              <h3 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{f.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: 13.5, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Fenêtre explicative d'une fonctionnalité */}
      {fInfo && (
        <div onClick={() => setInfo(null)} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="feat-info-title" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 18, padding: "28px 26px", position: "relative", boxShadow: "0 30px 90px rgba(0,0,0,0.7)", fontFamily: "DM Sans, sans-serif" }}>
            <button type="button" onClick={() => setInfo(null)} aria-label="Fermer" style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "none", color: "#BCB6A6", fontSize: 16, cursor: "pointer" }}>✕</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }} aria-hidden>{fInfo.icon}</div>
              <div>
                <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase", margin: 0 }}>{fInfo.tag}</p>
                <p id="feat-info-title" style={{ color: "#F5F0E8", fontSize: 17, fontWeight: 800, margin: "2px 0 0", fontFamily: "Fraunces, serif" }}>{fInfo.title}</p>
              </div>
            </div>
            {([["À quoi ça sert", fInfo.detail.role], ["Exemple concret", fInfo.detail.example], ["Ce que ça vous apporte", fInfo.detail.benefit]] as const).map(([h, txt]) => (
              <div key={h} style={{ marginBottom: 14 }}>
                <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 4px" }}>{h}</p>
                <p style={{ color: "#EDEBE4", fontSize: 15, lineHeight: 1.65, margin: 0 }}>{txt}</p>
              </div>
            ))}
            <Link href="/creer" style={{ display: "block", textAlign: "center", marginTop: 20, padding: "12px", borderRadius: 11, background: "var(--accent)", color: "var(--ink-on-accent)", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
              Composer ma page — sans compte
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
