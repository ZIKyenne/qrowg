import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { agendaEnLigne, priseDeRendezVous, reservationDeTable, boutiqueEnLigne, demandeDeDevis, boutonDePaiement, ficheContact } from "./models/actionsExternes"
import { EditorCalendly, PublicCalendly } from "./blocks/calendly"
import { EditorBookingButton, PublicBookingButton } from "./blocks/booking_button"
import { EditorTableBooking, PublicTableBooking } from "./blocks/table_booking"
import { EditorExternalShop, PublicExternalShop } from "./blocks/external_shop"
import { EditorQuoteRequest, PublicQuoteRequest } from "./blocks/quote_request"
import { EditorPaymentButton, PublicPaymentButton } from "./blocks/payment_button"
import { EditorVcard, PublicVcard } from "./blocks/vcard"
import { EditorQrCodeBlock, PublicQrCodeBlock } from "./blocks/qr_code_block"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import { hasPublishableContent } from "../blockEmptyState"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Rendu unique, lot 5 — les actions externes (24 nov.).
//
// Ce que les trois copies disaient de différent :
//   · l'aperçu du bloc QR dessinait un FAUX QR code tiré au hasard
//     (`Math.random()`), sous une fausse adresse « /q/... » ;
//   · la demande de devis n'avait pas de détecteur : l'aperçu dessinait son
//     bouton sans adresse, la page n'en publiait aucun ;
//   · l'aperçu peignait la table en rouge et le rendez-vous en bleu, la page
//     dans la couleur du thème ;
//   · rendez-vous, agenda et table se publiaient pour n'importe quel texte
//     d'adresse, puis la page retirait le bouton : une carte sans action.

const clair: any = { bg: "#FFFFFF", surface: "#FFFFFF", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#2563EB", text: "#111111", muted: "#555555" }
const eCtx = (theme = clair): EditorRenderCtx =>
  ({ theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (theme = clair): PublicRenderCtx =>
  ({ theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })
const H = (el: any) => renderToStaticMarkup(el)
const texte = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&[#a-z0-9]+;/gi, " ").replace(/\s+/g, " ").trim()

const PAIRES: [string, any, any, Record<string, string>][] = [
  ["calendly", EditorCalendly, PublicCalendly, { url: "https://calendly.com/atelier", label: "Un appel", description: "30 min" }],
  ["booking_button", EditorBookingButton, PublicBookingButton, { url: "https://exemple.fr/rdv", description: "Sur rendez-vous", platform: "Google Calendar" }],
  ["table_booking", EditorTableBooking, PublicTableBooking, { url: "https://www.thefork.fr/x", platform: "TheFork" }],
  ["external_shop", EditorExternalShop, PublicExternalShop, { url: "https://atelier.etsy.com", platform: "Etsy", description: "Nos bougies" }],
  ["quote_request", EditorQuoteRequest, PublicQuoteRequest, { url: "https://exemple.fr/devis", description: "Réponse sous 24 h" }],
  ["payment_button", EditorPaymentButton, PublicPaymentButton, { platform: "PayPal", url: "https://paypal.me/atelier", amount: "25 €" }],
  ["vcard", EditorVcard, PublicVcard, { name: "Marie Nord", company: "Atelier Nord", phone: "06 12 34 56 78" }],
]

describe("rendu unique, lot 5 — les huit sont servis par le renderer partagé", () => {
  it("activés, et sans copie dans les trois anciens rendus", () => {
    for (const t of [...PAIRES.map(p => p[0]), "qr_code_block"]) expect(SHARED_RENDERER_BLOCKS.has(t), t).toBe(true)
    for (const f of ["../../../[slug]/renduLegacy.tsx", "../builderPreview.tsx", "../../templates/TemplatePreviewModal.tsx"]) {
      const src = readFileSync(join(__dirname, f), "utf8")
      for (const [t] of PAIRES) expect(src, `${f} : ${t}`).not.toContain(`case "${t}"`)
      expect(src).not.toContain('case "qr_code_block"')
    }
  })
  it("à vide : l'éditeur le dit, la page se tait, le détecteur est d'accord", () => {
    for (const [t, E, P] of PAIRES) {
      expect(H(<P content={{}} ctx={pCtx()} />), t).toBe("")
      expect(H(<E content={{}} ctx={eCtx()} />), t).toContain("Invisible en ligne")
      expect(hasPublishableContent(t, {}), t).toBe(false)
    }
  })
  it("rempli : le même texte dans l'aperçu et en ligne, et seul l'en-ligne mène quelque part", () => {
    for (const [t, E, P, c] of PAIRES) {
      const e = H(<E content={c} ctx={eCtx()} />), p = H(<P content={c} ctx={pCtx()} />)
      expect(texte(e), t).toBe(texte(p))
      expect(p, t).toContain("href=")
      expect(e, t).not.toContain("href=")
      expect(hasPublishableContent(t, c), t).toBe(true)
    }
  })
  it("une adresse que la page refuse ne publie plus une carte sans action", () => {
    for (const [t, , P] of PAIRES.filter(p => p[0] !== "vcard" && p[0] !== "payment_button")) {
      expect(H(<P content={{ url: "javascript:alert(1)", label: "Réserver" }} ctx={pCtx()} />), t).toBe("")
      expect(hasPublishableContent(t, { url: "javascript:alert(1)" }), t).toBe(false)
    }
  })
})

describe("les boutons d'action prennent toute la largeur", () => {
  it("comme dans l'ancien rendu — `display: flex` seul les faisait rétrécir (vu au banc)", () => {
    // avecCibleTactile ne garde la pleine largeur qu'avec `display: block` ou
    // `width: 100%` : un `flex` seul devenait `inline-flex`, collé à son texte.
    for (const [t, , P, c] of PAIRES.filter(p => ["booking_button", "table_booking", "external_shop", "quote_request", "payment_button"].includes(p[0]))) {
      const lien = /<a [^>]*style="([^"]*)"/.exec(H(<P content={c} ctx={pCtx()} />))![1]
      expect(lien, t).toContain("width:100%")
      expect(lien, t).toMatch(/display:flex(;|$)/)
    }
  })
})

describe("quote_request a enfin un détecteur", () => {
  it("sans adresse : invisible, et l'aperçu ne dessine plus le bouton", () => {
    expect(demandeDeDevis({ label: "Demander un devis" })).toBeNull()
    expect(hasPublishableContent("quote_request", { label: "Demander un devis" })).toBe(false)
    expect(texte(H(<EditorQuoteRequest content={{ label: "Demander un devis" }} ctx={eCtx()} />))).not.toContain("→")
  })
})

describe("la couleur du thème, des deux côtés", () => {
  it("la table n'est plus rouge dans l'aperçu, le rendez-vous plus bleu", () => {
    const table = H(<EditorTableBooking content={{ url: "https://www.thefork.fr/x" }} ctx={eCtx()} />)
    expect(table, "le rouge en dur de l'aperçu").not.toContain("239,68,68")
    const rdv = H(<EditorBookingButton content={{ url: "https://exemple.fr/rdv" }} ctx={eCtx()} />)
    expect(rdv, "le bleu en dur de l'aperçu").not.toContain("56,189,248")
  })
})

describe("payment_button et vcard", () => {
  it("le paiement passe par paymentLink, puis par le juge commun", () => {
    expect(boutonDePaiement({ platform: "PayPal", url: "https://paypal.me/atelier" })!.href).toBe("https://paypal.me/atelier")
    expect(boutonDePaiement({ platform: "Stripe" })).toBeNull()
  })
  it("la fiche contact se télécharge en ligne seulement, sous le nom du contact", () => {
    const c = { name: "Marie Nord", phone: "06 12 34 56 78" }
    const p = H(<PublicVcard content={c} ctx={pCtx()} />)
    expect(p).toContain('download="Marie_Nord.vcf"')
    expect(p).toContain("data:text/vcard")
    expect(H(<EditorVcard content={c} ctx={eCtx()} />)).toContain('aria-disabled="true"')
    expect(ficheContact({ company: "Seule" }), "une entreprise seule ne fait pas une fiche").toBeNull()
  })
  it("les autres modèles refusent le vide", () => {
    for (const f of [agendaEnLigne, priseDeRendezVous, reservationDeTable, boutiqueEnLigne]) expect(f({})).toBeNull()
  })
})

describe("qr_code_block", () => {
  it("plus de faux QR : l'aperçu dit la vérité, la page ne publie rien", () => {
    const e = H(<EditorQrCodeBlock content={{ size: "lg", label: "Scannez-moi" }} ctx={eCtx()} />)
    expect(e).toContain("n&#x27;apparaît pas sur la page publiée")
    expect(e, "la fausse adresse").not.toContain("/q/")
    expect(H(<PublicQrCodeBlock content={{ size: "lg" }} ctx={pCtx()} />)).toBe("")
    expect(hasPublishableContent("qr_code_block", { size: "lg", label: "x" }), "la liste d'avant publication le signale").toBe(false)
    // Le faux QR changeait à chaque rendu : deux rendus doivent être identiques.
    expect(H(<EditorQrCodeBlock content={{ size: "lg" }} ctx={eCtx()} />)).toBe(H(<EditorQrCodeBlock content={{ size: "lg" }} ctx={eCtx()} />))
  })
})
