"use client"
// Les six formulaires, câblés sur le contexte du renderer partagé (rendu
// unique, lot 6). Chaque bloc appelle le MÊME composant des deux côtés :
// en ligne, il enregistre ; dans l'éditeur (`apercu`), il se dessine à
// l'identique et n'envoie rien.
//
// Les libellés, champs et couleurs par défaut sont ceux de l'ancien rendu
// public, au caractère près — ceux que l'aperçu de l'éditeur ne reprenait
// qu'à moitié (des boîtes grises à la place des champs).
import type { ReactNode } from "react"
import { contactFormFields, reservationFormFields, quoteFormFields, bookingRequestFields, telephoneDirect } from "@/lib/leadForms"
import { telLink } from "../../types"
import { LeadFormPublic, EventRegisterPublic, RsvpPublic } from "./FormulairesEnLigne"
import { editorCtx, publicCtx, type UnifiedCtx, type EditorAdapterProps, type PublicAdapterProps } from "../renderTypes"

type Contexte = { u: UnifiedCtx; pageId: string; blockId: string; apercu: boolean; nomCommerce?: string | null; courriel?: string }

const enLigne = (ctx: PublicAdapterProps["ctx"]): Contexte =>
  ({ u: publicCtx(ctx), pageId: ctx.pageId, blockId: ctx.blockId, apercu: false, nomCommerce: ctx.nomCommerce, courriel: ctx.courrielDuCompte })
const enApercu = (ctx: EditorAdapterProps["ctx"]): Contexte =>
  ({ u: editorCtx(ctx), pageId: "apercu", blockId: "apercu", apercu: true })

type Rendu = (c: Record<string, any>, x: Contexte) => ReactNode

function commun(c: Record<string, any>, x: Contexte) {
  return {
    block: { id: x.blockId, content: c }, pageId: x.pageId, ownerEmail: x.courriel, nomCommerce: x.nomCommerce,
    TEXT: x.u.TEXT, MUTED: x.u.MUTED, apercu: x.apercu, champ: { fond: x.u.FILL, bordure: x.u.LINE },
  }
}

const contact: Rendu = (c, x) => (
  <LeadFormPublic {...commun(c, x)} leadType="contact" title={c.title || "Contact"} fields={contactFormFields(c)} button={c.button_label || "Envoyer"}
    accent={`linear-gradient(90deg,${x.u.G},${x.u.G}cc)`} buttonTextColor="#080808" subject="Nouveau message de contact" />
)
const devis: Rendu = (c, x) => (
  <LeadFormPublic {...commun(c, x)} leadType="quote" title={c.title || "Demander un devis"} description={c.description} fields={quoteFormFields(c)} button={c.button_label || "Envoyer ma demande"}
    accent={`linear-gradient(90deg,${x.u.G},${x.u.G}cc)`} buttonTextColor="#080808" subject="Demande de devis" />
)
const evenement: Rendu = (c, x) => (
  <LeadFormPublic {...commun(c, x)} leadType="booking" title={c.title || "Réserver pour un événement"} description={c.description} fields={bookingRequestFields(c)} button={c.button_label || "Envoyer ma demande"}
    accent="linear-gradient(90deg,#9146FF,#7B3FCC)" subject="Demande de réservation événement" />
)
// Le « Téléphone direct » du panneau : un restaurant qui le renseigne veut
// qu'on l'appelle (vague 23). En ligne c'est un lien ; dans l'aperçu, un texte.
const reservation: Rendu = (c, x) => {
  const ligneDirecte = telephoneDirect(c)
  const appel = telLink(ligneDirecte)
  const phrase = <>ou appelez directement le <strong style={{ color: x.u.TEXT }}>{ligneDirecte}</strong></>
  return (
    <>
      <LeadFormPublic {...commun(c, x)} leadType="reservation" title={c.title || "Réserver"} fields={reservationFormFields(c)} button={c.button_label || "Réserver"}
        accent="linear-gradient(90deg,#EF4444,#dc2626)" subject={`Réservation: ${c.title || ""}`} />
      {appel && (
        <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 13 }}>
          {x.apercu
            ? <span style={{ color: x.u.MUTED }}>{phrase}</span>
            : <a href={appel} onClick={() => { try { x.u.trackClick(appel) } catch {} }} style={{ color: x.u.MUTED, textDecoration: "none" }}>{phrase}</a>}
        </p>
      )}
    </>
  )
}
const inscription: Rendu = (c, x) => <EventRegisterPublic {...commun(c, x)} />
const rsvp: Rendu = (c, x) => { const { champ: _champ, ownerEmail: _o, ...reste } = commun(c, x); return <RsvpPublic {...reste} /> }

function adapter(rendu: Rendu) {
  return {
    Editor: ({ content, ctx }: EditorAdapterProps) => <>{rendu(content || {}, enApercu(ctx))}</>,
    Public: ({ content, ctx }: PublicAdapterProps) => <>{rendu(content || {}, enLigne(ctx))}</>,
  }
}

export const FORMULAIRES_PARTAGES = {
  contact_form: adapter(contact),
  quote_form: adapter(devis),
  booking_request: adapter(evenement),
  reservation_form: adapter(reservation),
  event_register: adapter(inscription),
  rsvp: adapter(rsvp),
}
