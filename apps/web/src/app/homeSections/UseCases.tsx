"use client"

import { useState } from "react"
import { ButtonLink } from "@/components/ui/Button"
import { useInView } from "../homeUi"
import { Icone } from "@/components/ui/Icone"

const USE_CASES = [
  {
    id: "restaurant",
    icon: "restaurant",
    label: "Restaurant",
    title: "Transformez votre table en expérience connectée.",
    desc: "Vos clients scannent, consultent votre menu à jour, réservent et laissent un avis en 2 gestes.",
    color: "#F97316",
    blocks: [
      { icon:"menu", label:"Menu interactif",   note:"Mis à jour sans réimprimer" },
      { icon:"reservation", label:"Réservations",      note:"Lien direct vers votre système" },
      { icon:"avis", label:"Avis Google",        note:"Redirection automatique" },
      { icon:"horaires", label:"Horaires",          note:"Modifiables à tout moment" },
      { icon:"lieu", label:"Itinéraire",         note:"Google Maps intégré" },
      { icon:"evenement", label:"Événements spéciaux",note:"Soirées, menus du jour" },
    ],
    cta: "Composer ma page restaurant",
  },
  {
    id: "freelance",
    icon: "freelance",
    label: "Freelance",
    title: "Votre carte de visite devient une vitrine interactive.",
    desc: "Un seul QR sur vos cartes pro. Le client arrive sur votre portfolio, vos services et votre contact.",
    color: "var(--action)",
    blocks: [
      { icon:"portfolio",  label:"Portfolio",       note:"Galerie de projets" },
      { icon:"services",  label:"Services & tarifs",note:"Vos prestations" },
      { icon:"message", label:"WhatsApp direct",   note:"Bouton de prise de contact" },
      { icon:"document", label:"CV téléchargeable", note:"PDF en un clic" },
      { icon:"lien", label:"Liens sociaux",     note:"LinkedIn, Behance…" },
      { icon:"reservation", label:"Calendly",          note:"Prise de RDV intégrée" },
    ],
    cta: "Composer ma page indépendant",
  },
  {
    id: "creator",
    icon: "musique",
    label: "Créateur",
    title: "Un lien unique pour tous vos contenus.",
    desc: "Centralisez vos réseaux, musiques, vidéos et collaborations sur une page élégante.",
    color: "#A78BFA",
    blocks: [
      { icon:"galerie", label:"Instagram / TikTok", note:"Vos dernières publications" },
      { icon:"video", label:"YouTube / Twitch",   note:"Lien vers votre chaîne" },
      { icon:"musique", label:"Streaming",          note:"Spotify, Apple Music…" },
      { icon:"partenariat", label:"Partenariats",       note:"Vos codes promo" },
      { icon:"newsletter", label:"Newsletter",         note:"Formulaire d'inscription" },
      { icon:"commerce",  label:"Boutique",          note:"Vos produits / merch" },
    ],
    cta: "Composer ma page créateur",
  },
  {
    id: "immo",
    icon: "immobilier",
    label: "Immobilier",
    title: "Chaque panneau devient un outil de vente.",
    desc: "Collez votre QR sur vos panneaux et brochures. L'acheteur accède à tous les détails en 1 scan.",
    color: "#C9A84C",
    blocks: [
      { icon:"immobilier", label:"Fiche du bien",      note:"Photos, surface, prix" },
      { icon:"telephone", label:"Contact direct",     note:"Appel ou message" },
      { icon:"reservation", label:"Visites",            note:"Demande de visite en ligne" },
      { icon:"document", label:"Brochure PDF",       note:"Téléchargement instantané" },
      { icon:"lieu",  label:"Localisation",      note:"Plan interactif" },
      { icon:"paiement", label:"Financement",        note:"Simulateur de crédit" },
    ],
    cta: "Composer ma page immobilier",
  },
  {
    id: "event",
    icon: "evenement",
    label: "Événement",
    title: "Tenez vos participants informés en temps réel.",
    desc: "Programme, billets, accès et mises à jour — tout sur une page modifiable même la veille.",
    color: "var(--success)",
    blocks: [
      { icon:"menu", label:"Programme",          note:"Mis à jour en direct" },
      { icon:"billetterie", label:"Billetterie",        note:"Lien d'achat direct" },
      { icon:"compteARebours", label:"Compte à rebours",   note:"Décompte automatique" },
      { icon:"lieu", label:"Lieu & accès",       note:"Plan et transport" },
      { icon:"galerie", label:"Galerie",            note:"Photos de l'édition passée" },
      { icon:"annonce", label:"Intervenants",       note:"Biographies et horaires" },
    ],
    cta: "Composer ma page événement",
  },
  {
    id: "commerce",
    icon: "commerce",
    label: "Commerce local",
    title: "Attirez plus de clients avec un QR sur votre vitrine.",
    desc: "Vos promotions, vos produits et vos horaires toujours à jour. Un scan depuis la rue suffit.",
    color: "#F43F5E",
    blocks: [
      { icon:"promotion",  label:"Promotions",        note:"Offres du moment" },
      { icon:"catalogue", label:"Catalogue produits", note:"Mis à jour facilement" },
      { icon:"horaires", label:"Horaires",           note:"Jours fériés inclus" },
      { icon:"avis", label:"Avis clients",        note:"Lien Google / Tripadvisor" },
      { icon:"lieu", label:"Itinéraire",          note:"Depuis n'importe où" },
      { icon:"message", label:"Contact rapide",      note:"WhatsApp ou appel" },
    ],
    cta: "Composer ma page commerce",
  },
] as const

export function UseCasesSection() {
  const { ref, visible } = useInView(0.06)
  const [active, setActive] = useState(0)
  const uc = USE_CASES[active]

  return (
    <section id="examples" ref={ref} aria-labelledby="uc-title"
      style={{ padding: "var(--rythme-section) var(--gouttiere)", position: "relative", zIndex: 1 }}>
      <style>{`
        .uc-tabs  { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
        .uc-tab   { display:flex; align-items:center; gap:7px; padding:9px 18px; border-radius:999px;
                    cursor:pointer; border:1px solid; transition:all 0.2s ease; font-size:13px; font-weight:500;
                    background:transparent; white-space:nowrap; }
        .uc-tab:focus-visible{ outline:2px solid rgba(201,168,76,0.6); outline-offset:3px; border-radius:999px; }
        .uc-blocks{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        @media(max-width:640px){
          .uc-blocks{ grid-template-columns:repeat(2,1fr)!important; }
          .uc-tabs { gap:6px!important; }
          .uc-tab  { padding:7px 12px!important; font-size:12px!important; }
          
        }
        @media(max-width:400px){
          .uc-blocks{ grid-template-columns:1fr!important; }
        }
        @keyframes ucFade{ from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{
        maxWidth: "var(--largeur-page)", margin: "0 auto 36px", textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        <h2 id="uc-title" style={{
          fontFamily: "var(--police-titre)",
          fontSize: "clamp(28px, 3.4vw, 44px)",
          color: "#F5F0E8", fontWeight: 700,
          margin: "0 auto 16px", lineHeight: 1.1,
          maxWidth: "var(--mesure-titre)", letterSpacing: "var(--approche-titre)",
        }}>
          Fait pour votre métier.
        </h2>
        <p style={{ color: "var(--texte-discret)", fontSize: 16,
          maxWidth: "var(--mesure-texte)", margin: "0 auto", lineHeight: 1.65 }}>
          Sélectionnez votre activité et voyez exactement ce que QRowg peut faire pour vous.
        </p>
      </div>

      <div style={{ maxWidth: "var(--largeur-page)", margin: "0 auto" }}>

        {/* Tabs */}
        <div className="uc-tabs" style={{
          marginBottom: 28,
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
                // L'onglet, la carte et son étiquette appartiennent au PRODUIT.
                // Ils prenaient la couleur du métier sélectionné : orange pour
                // Restaurant, violet pour Artiste, rose pour Événement… Six
                // teintes étrangères à la charte, et le site changeait d'identité
                // à chaque clic. La maquette du téléphone, elle, GARDE la couleur
                // du métier : c'est l'aperçu de SA page, et c'est vrai.
                borderColor: active === i ? "var(--accent)" : "rgba(255,255,255,0.1)",
                background: active === i
                  ? "var(--accent)"
                  : "rgba(255,255,255,0.02)",
                fontFamily: "inherit",
              }}
            >
              <Icone nom={uc_item.icon} taille={16} />
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
            border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
            borderRadius: 16, padding: "22px 22px",
            position: "sticky", top: 88,
          }}>
            {/* Header card */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "color-mix(in srgb, var(--accent) 9%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 26%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
              }}><Icone nom={uc.icon} taille={19} /></div>
              <div>
                <p style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700,
                  letterSpacing: 1.6, textTransform: "uppercase", margin: "0 0 4px" }}>{uc.label}</p>
                <h3 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700,
                  margin: 0, lineHeight: 1.3 }}>{uc.title}</h3>
              </div>
            </div>

            <p style={{ color: "var(--texte-discret)", fontSize: 14,
              lineHeight: 1.65, marginBottom: 16 }}>{uc.desc}</p>

            {/* Aperçu du rendu : mini-téléphone (Pb 9) */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 148, borderRadius: 20, padding: 6, background: "#080705", border: "1px solid rgba(255,255,255,0.12)", boxShadow: `0 18px 50px rgba(0,0,0,0.5), 0 0 0 1px ${uc.color}14` }}>
                <div style={{ borderRadius: 16, overflow: "hidden", background: "#0E0D0B" }}>
                  {/* en-tête coloré + encoche */}
                  <div style={{ position: "relative", height: 58, background: uc.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 4, background: "rgba(0,0,0,0.35)" }} />
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginTop: 6 }}><Icone nom={uc.icon} taille={19} /></div>
                  </div>
                  {/* corps */}
                  <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                    <div style={{ height: 6, width: "62%", borderRadius: 4, background: "rgba(245,240,232,0.9)" }} />
                    <div style={{ height: 4, width: "44%", borderRadius: 4, background: "rgba(188,182,166,0.55)" }} />
                    {/* mini QR */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 1.5, width: 40, height: 40, marginTop: 4, padding: 4, background: "#fff", borderRadius: 6 }}>
                      {Array.from({ length: 25 }).map((_, k) => <div key={k} style={{ background: (k * 7 + 3) % 3 === 0 ? "#0E0D0B" : "transparent", borderRadius: 2 }} />)}
                    </div>
                    {/* CTA */}
                    <div style={{ marginTop: 6, minHeight: 26, width: "86%", borderRadius: 6, background: uc.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#080808", fontSize: 11, fontWeight: 800, padding: "3px 5px", textAlign: "center", lineHeight: 1.15 }}>{uc.cta.replace(/^Composer ma page /i, "").replace(/^./, c => c.toUpperCase())}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ligne d'accent */}
            <div style={{
              height: 1, marginBottom: 16,
              background: "color-mix(in srgb, var(--accent) 32%, transparent)",
            }} />

            <ButtonLink href="/creer" size="sm" fullWidth rightIcon={<span aria-hidden="true" className="da-ic da-ic-arrow">→</span>}>{uc.cta}</ButtonLink>
          </div>

          {/* Grille de blocs droite */}
          <div>
            <p style={{ color: "var(--muted)", fontSize: 11,
              letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 16 }}>
              Blocs inclus dans ce modèle
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
                    // Survol d'une carte de bloc : commande du produit, donc or.
                    el.style.borderColor = "color-mix(in srgb, var(--accent) 34%, transparent)"
                    el.style.background = "color-mix(in srgb, var(--accent) 5%, transparent)"
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = "rgba(255,255,255,0.07)"
                    el.style.background = "rgba(255,255,255,0.025)"
                  }}>
                  <Icone nom={block.icon} taille={18} />
                  <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 700, margin: 0 }}>{block.label}</p>
                  <p style={{ color: "var(--texte-discret)", fontSize: 11, margin: 0, lineHeight: 1.4 }}>{block.note}</p>
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
