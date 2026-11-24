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

// Les images de la page publiée : celles qui SONT le contenu (galerie, carrousel,
// bannière sans texte incrusté) reçoivent un texte alternatif ; les vignettes
// posées à côté d'un titre déjà lisible gardent `alt=""` — un lecteur d'écran
// qui annonce deux fois le même nom est plus pénible qu'utile (WCAG H67).
import { RsvpPublic, EventRegisterPublic, LeadFormPublic } from "./blocsPublics"
import { trackLinkClick } from "@/lib/trackLinkClick"
import { contactFormFields, reservationFormFields, quoteFormFields, bookingRequestFields, telephoneDirect } from "@/lib/leadForms"
import { hasPublishableContent } from "../dashboard/builder/blockEmptyState"
import { telLink } from "../dashboard/builder/types"
type Block = { id: string; type: string; content: Record<string, any>; position: number }


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

  switch (block.type) {

    // Réutilise le formulaire de leads partagé (envoi réel via submitLead → /api/leads,
    // owner résolu côté serveur, honeypot, état d'envoi, anti-double-clic, accusé email).
    // Ancienne version : <form> décorative sans handler ⇒ les messages étaient perdus.
    case "contact_form": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} nomCommerce={nomCommerce} leadType="contact" title={c.title || "Contact"} fields={contactFormFields(c)} button={c.button_label || "Envoyer"} accent={`linear-gradient(90deg,${G},${G}cc)`} buttonTextColor="#080808" subject="Nouveau message de contact" TEXT={TEXT} MUTED={MUTED} />

    case "event_register": return <EventRegisterPublic block={block} pageId={pageId} TEXT={TEXT} MUTED={MUTED} ownerEmail={ownerEmail} nomCommerce={nomCommerce} />
    case "rsvp": return <RsvpPublic block={block} pageId={pageId} TEXT={TEXT} MUTED={MUTED} nomCommerce={nomCommerce} />

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
    default: return null
  }
}
