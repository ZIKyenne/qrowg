"use client"

// ─────────────────────────────────────────────────────────────────────────────
// RENDU LEGACY DE LA PAGE PUBLIÉE — chargé À LA DEMANDE.
//
// Mesuré le 6 septembre sur le fichier construit : le morceau de JavaScript que
// tout visiteur télécharge après un scan pesait 143 Ko (33 Ko compressés). Sur
// les 99 Ko de `case` qu'il contenait, 91 Ko concernaient des blocs DÉJÀ servis
// par le renderer partagé : du code que plus personne n'exécute, conservé pour
// pouvoir revenir en arrière — et payé par chaque visiteur, à chaque scan.
//
// L'assurance reste, elle cesse simplement de voyager avec le visiteur. Ce
// module n'est chargé que si un bloc de la page n'est PAS servi par le renderer
// partagé : retirer un type de SHARED_RENDERER_BLOCKS le fait revenir aussitôt.
// `dynamic()` conserve le rendu serveur — le HTML arrive complet, rien ne
// clignote, le référencement est intact.
//
// Après découpe : 143 Ko → 63 Ko (33 → 19 Ko compressés) pour une page dont
// tous les blocs sont migrés.
// ─────────────────────────────────────────────────────────────────────────────

import { fabriqueLisible } from "@/app/dashboard/builder/shared-renderer/renderTypes"
import { type AnchorHTMLAttributes } from "react"
import { ExternalLink } from "lucide-react"
// Les images de la page publiée : celles qui SONT le contenu (galerie, carrousel,
// bannière sans texte incrusté) reçoivent un texte alternatif ; les vignettes
// posées à côté d'un titre déjà lisible gardent `alt=""` — un lecteur d'écran
// qui annonce deux fois le même nom est plus pénible qu'utile (WCAG H67).
import { RsvpPublic, EventRegisterPublic, LeadFormPublic } from "./blocsPublics"
import { trackLinkClick } from "@/lib/trackLinkClick"
import { contactFormFields, reservationFormFields, quoteFormFields, bookingRequestFields, telephoneDirect } from "@/lib/leadForms"
import { destinationUtile } from "../dashboard/builder/types"
import { hasPublishableContent } from "../dashboard/builder/blockEmptyState"
import { paymentBrand, paymentLink, buildVCard, telLink } from "../dashboard/builder/types"
type Block = { id: string; type: string; content: Record<string, any>; position: number }

/**
 * Un lien qui n'existe pas sans destination.
 *
 * Le rendu public repliait chaque href sur une ancre morte à trente
 * endroits. Le commerçant remplit « Commander », oublie l'adresse — ou en colle
 * une que `extHref` refuse — et la page publiait quand même un bouton bien
 * visible : le visiteur clique, la page se recharge, rien ne se passe. Il en
 * conclut que le commerce ne fonctionne pas. Un bouton absent est moins grave.
 *
 * Rendre `null` plutôt qu'une ancre sans href : une ancre nue se clique aussi.
 */
function LienPublic({ href, children, ...reste }: { href?: string | null } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cible = destinationUtile(href)
  if (!cible) return null
  return <a href={cible} {...reste}>{children}</a>
}

export function RenduLegacy({ block, theme, pageId, ownerEmail, totalViews, h1Owner, nomCommerce }: { block: Block; theme: any; pageId: string; ownerEmail?: string; totalViews?: number; h1Owner?: string; nomCommerce?: string | null }) {
  const c = block.content
  // ── Lot v169 : le chemin de repli pose la MÊME question que la page ───────
  //
  // Ce module est l'assurance : « retirer un type de SHARED_RENDERER_BLOCKS le
  // fait revenir aussitôt », dit l'en-tête. Sauf que les corrections, elles,
  // n'y sont pas revenues. Comparés bloc à bloc sur un contenu VIDE, six blocs
  // migrés publiaient ici ce que le renderer partagé refuse — dont la carte
  // « 🎧 Écouter sur Spotify » sans bouton, le défaut même que le lot v166 a
  // réparé, et la carte « 📍 Adresse » sans adresse.
  //
  // `hasPublishableContent` est le miroir exact du filtre public, vérifié en
  // l'exécutant sur les cent quarante-six blocs (lots v166 et v167). Poser la
  // question ici, c'est faire dire au repli ce que dit le produit — une fois,
  // pour tous les blocs, y compris ceux qu'aucun lot n'a encore regardés.
  if (!hasPublishableContent(block.type, c)) return null
  const G = theme.primary || "#C9A84C"
  const MUTED = theme.muted || "#8A8478"
  const TEXT = theme.text || "#F5F0E8"
  const FONT_B = theme.fontBody || "DM Sans, sans-serif"

  switch (block.type) {

    // Réutilise le formulaire de leads partagé (envoi réel via submitLead → /api/leads,
    // owner résolu côté serveur, honeypot, état d'envoi, anti-double-clic, accusé email).
    // Ancienne version : <form> décorative sans handler ⇒ les messages étaient perdus.
    case "contact_form": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} nomCommerce={nomCommerce} leadType="contact" title={c.title || "Contact"} fields={contactFormFields(c)} button={c.button_label || "Envoyer"} accent={`linear-gradient(90deg,${G},${G}cc)`} buttonTextColor="#080808" subject="Nouveau message de contact" TEXT={TEXT} MUTED={MUTED} />


    // Sans adresse de reservation, ce bloc publiait un bouton « Reserver » qui
    // menait a « # ». Un bouton mort est pire qu'un bloc absent.
    case "calendly": return !(c.url || "").trim() ? null : (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ background: `${G}07`, border: `1px solid ${G}20`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📅</div>
            <div>
              {/* `c.label` servait à la fois de titre de la carte ET de texte du
                  bouton, avec deux replis différents : une page en ligne affichait
                  deux fois « Reserver un appel decouverte ». Le titre est celui du
                  commerçant ; le bouton porte son propre libellé. (Vague 24.) */}
              {c.label && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label}</p>}
              {c.description && <p style={{ color: MUTED, fontSize: 13.5, margin: 0, fontFamily: FONT_B }}>{c.description}</p>}
            </div>
          </div>
          <LienPublic href={c.url} onClick={() => trackLinkClick(pageId, block.id, c.url||"calendly")} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", textAlign: "center", padding: "13px", borderRadius: 9, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{"Réserver un créneau"}</LienPublic>
        </div>
      </div>
    )
    case "payment_button": {
      const href = paymentLink(c)
      if (!href) return null
      const br = paymentBrand(c.platform)
      return (
        <div style={{ padding: "6px 24px 10px" }}>
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "payment")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: br.color, borderRadius: 13, padding: "15px 18px", textDecoration: "none", color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: FONT_B, boxShadow: `0 4px 16px ${br.color}44` }}>
            <span>{br.icon}</span> {c.label || "Payer maintenant"}{c.amount ? ` — ${c.amount}` : ""}
          </a>
        </div>
      )
    }
    case "booking_button": return c.url ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <LienPublic href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "booking")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: `${G}12`, border: `1.5px solid ${G}35`, borderRadius: 13, padding: "15px 18px", textDecoration: "none", color: G, fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>
          📅 {c.label || "Prendre rendez-vous"}
        </LienPublic>
        {/* La description (« Consultation de 30 min », « Sur rendez-vous uniquement »…)
            était réglable, affichée dans l'aperçu, et n'arrivait jamais au visiteur. */}
        {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "6px 0 0", textAlign: "center", fontFamily: FONT_B }}>{c.description}</p>}
        {/* « Plateforme » (Google Calendar, Microsoft Bookings…) etait reglable et
            affichee nulle part : le commercant la choisissait, rien ne changeait. */}
        {c.platform && <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0", textAlign: "center", fontFamily: FONT_B }}>via {c.platform}</p>}
      </div>
    ) : null
    case "event_register": return <EventRegisterPublic block={block} pageId={pageId} TEXT={TEXT} MUTED={MUTED} ownerEmail={ownerEmail} nomCommerce={nomCommerce} />
    case "rsvp": return <RsvpPublic block={block} pageId={pageId} TEXT={TEXT} MUTED={MUTED} nomCommerce={nomCommerce} />

    case "vcard": {
      const vcf = buildVCard(c)
      const href = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcf)}`
      return (c.name || c.phone || c.email) ? (
        <div style={{ padding: "6px 24px 12px" }}>
          <div style={{ background: `${G}08`, border: `1.5px solid ${G}25`, borderRadius: 13, padding: "13px 15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${G},${G}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👤</div>
              <div>{c.name && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.name}</p>}{c.company && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.company}</p>}</div>
            </div>
            <a href={href} download={`${(c.name || "contact").replace(/\s+/g, "_")}.vcf`} onClick={() => trackLinkClick(pageId, block.id, "vcard")} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#080808", textDecoration: "none", fontFamily: FONT_B }}>{c.label || "Ajouter à mes contacts"}</a>
          </div>
        </div>
      ) : null
    }
    case "table_booking": {
      // Vague 2 (23 nov.) : rouge en dur (#EF4444), à 3,8:1 sur fond blanc et
      // étranger à tout thème. La couleur du thème, rendue lisible sur le fond de
      // la page par la même règle que les blocs partagés (fabriqueLisible).
      const encre = fabriqueLisible(theme)(G)
      return c.url ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <LienPublic href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url)} data-reserver="" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: `color-mix(in srgb, ${encre} 10%, transparent)`, border: `1.5px solid color-mix(in srgb, ${encre} 35%, transparent)`, borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>🍽️</span>
          <span style={{ color: encre, fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Réserver une table"}</span>
        </LienPublic>
        {c.platform && <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0", textAlign: "center", fontFamily: FONT_B }}>via {c.platform}</p>}
      </div>
    ) : null
    }
    // Même cadre vide que external_shop, même cause. (Vague 25.)
    case "quote_request": return destinationUtile(c.url) ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <LienPublic href={c.url} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "quote")} style={{ display: "flex", alignItems: "center", gap: 11, background: `${G}08`, border: `1.5px solid ${G}20`, borderRadius: 13, padding: "12px 15px", textDecoration: "none" }}>
          <div style={{ width: 40, height: 40, background: `${G}12`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label || "Demander un devis"}</p>{c.description && <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{c.description}</p>}</div>
          <span style={{ color: G, fontSize: 15 }}>→</span>
        </LienPublic>
      </div>
    ) : null
    case "reservation_form": {
      // Le « Téléphone direct » du panneau : un restaurant qui le renseigne veut
      // qu'on l'appelle. Il était réglable et rendu nulle part (vague 23).
      const ligneDirecte = telephoneDirect(c)
      const appel = telLink(ligneDirecte)
      return (
        <>
          <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} nomCommerce={nomCommerce} leadType="reservation" title={c.title || "Réserver"} fields={reservationFormFields(c)} button={c.button_label || "Réserver"} accent="linear-gradient(90deg,#EF4444,#dc2626)" subject={`Réservation: ${c.title || ""}`} TEXT={TEXT} MUTED={MUTED} />
          {appel && (
            <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 13 }}>
              <a href={appel} onClick={() => trackLinkClick(pageId, block.id, appel)} style={{ color: MUTED, textDecoration: "none" }}>
                ou appelez directement le <strong style={{ color: TEXT }}>{ligneDirecte}</strong>
              </a>
            </p>
          )}
        </>
      )
    }
    case "quote_form": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} nomCommerce={nomCommerce} leadType="quote" title={c.title || "Demander un devis"} description={c.description} fields={quoteFormFields(c)} button={c.button_label || "Envoyer ma demande"} accent={`linear-gradient(90deg,${G},${G}cc)`} buttonTextColor="#080808" subject="Demande de devis" TEXT={TEXT} MUTED={MUTED} />
    case "booking_request": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} nomCommerce={nomCommerce} leadType="booking" title={c.title || "Réserver pour un événement"} description={c.description} fields={bookingRequestFields(c)} button={c.button_label || "Envoyer ma demande"} accent="linear-gradient(90deg,#9146FF,#7B3FCC)" subject="Demande de réservation événement" TEXT={TEXT} MUTED={MUTED} />
    // Sans destination, ce bloc n'avait plus rien à publier — mais la condition
    // regardait le LIBELLÉ. Un commerçant qui posait « Voir la boutique » sans
    // coller son adresse publiait un cadre vide de 41 octets. (Vague 25.)
    case "external_shop": return destinationUtile(c.url) ? (
      <div style={{ padding: "6px 24px 14px" }}>
        {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 11px", textAlign: "center" }}>{c.description}</p>}
        <LienPublic href={c.url} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "shop")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: `${G}10`, border: `1.5px solid ${G}30`, borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 21 }}>🛒</span>
          <div><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label || "Voir la boutique"}</p>{c.platform && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>via {c.platform}</p>}</div>
          <ExternalLink size={14} color={G} style={{ marginLeft: "auto" }} />
        </LienPublic>
      </div>
    ) : null
    case "qr_code_block": return null

    default: return null
  }
}
