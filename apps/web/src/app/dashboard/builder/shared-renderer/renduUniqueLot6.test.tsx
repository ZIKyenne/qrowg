import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { EditorContactForm, PublicContactForm } from "./blocks/contact_form"
import { EditorQuoteForm, PublicQuoteForm } from "./blocks/quote_form"
import { EditorReservationForm, PublicReservationForm } from "./blocks/reservation_form"
import { EditorBookingRequest, PublicBookingRequest } from "./blocks/booking_request"
import { EditorEventRegister, PublicEventRegister } from "./blocks/event_register"
import { EditorRsvp, PublicRsvp } from "./blocks/rsvp"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import { BLOCK_DEFS } from "../blockDefs"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Rendu unique, lot 6 — les formulaires (24 nov.). Le dernier lot de migration :
// plus aucun bloc du catalogue n'a de copie dans les anciens rendus.
//
// Le formulaire de la page publiée est DÉPLACÉ tel quel — pot de miel,
// validation de l'e-mail, plafonds de saisie, repli courrier, confirmation
// honnête. L'aperçu de l'éditeur, qui dessinait des boîtes grises, montre
// désormais ce même formulaire, en lecture seule, et n'envoie jamais rien.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const clair: any = { bg: "#FFFFFF", surface: "#FFFFFF", fontDisplay: "Fraunces", fontBody: "DM Sans", primary: "#2563EB", text: "#111111", muted: "#555555" }
const eCtx = (theme = sombre): EditorRenderCtx =>
  ({ theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (theme = sombre): PublicRenderCtx =>
  ({ theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {}, nomCommerce: "Atelier Nord" })
const H = (el: any) => renderToStaticMarkup(el)
const texte = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&[#a-z0-9]+;/gi, " ").replace(/\s+/g, " ").trim()

const PAIRES: [string, any, any, Record<string, string>][] = [
  ["contact_form", EditorContactForm, PublicContactForm, { title: "Écrivez-nous", show_phone: "yes" }],
  ["quote_form", EditorQuoteForm, PublicQuoteForm, { description: "Réponse sous 48 h" }],
  ["reservation_form", EditorReservationForm, PublicReservationForm, { phone: "03 26 00 00 00" }],
  ["booking_request", EditorBookingRequest, PublicBookingRequest, {}],
  ["event_register", EditorEventRegister, PublicEventRegister, { title: "Atelier bougies" }],
  ["rsvp", EditorRsvp, PublicRsvp, { title: "Serez-vous là samedi ?" }],
]

describe("rendu unique, lot 6 — plus aucun bloc n'a de copie", () => {
  it("les six formulaires sont servis par le renderer partagé", () => {
    for (const [t] of PAIRES) expect(SHARED_RENDERER_BLOCKS.has(t), t).toBe(true)
  })
  it("TOUT le catalogue a son rendu partagé : les anciens rendus n'ont plus un seul `case`", () => {
    expect(Object.keys(BLOCK_DEFS).filter(t => !SHARED_RENDERER_BLOCKS.has(t)), "des blocs encore dans l'ancien moteur").toEqual([])
    for (const f of ["../../../[slug]/renduLegacy.tsx", "../builderPreview.tsx"]) {
      expect(readFileSync(join(__dirname, f), "utf8").match(/case "[a-z_0-9]+":/g) ?? [], f).toEqual([])
    }
  })
})

describe("l'aperçu montre le VRAI formulaire, et n'envoie rien", () => {
  it("même texte des deux côtés — plus des boîtes grises", () => {
    for (const [t, E, P, c] of PAIRES) {
      const e = texte(H(<E content={c} ctx={eCtx()} />))
      // La seule différence admise : le nom du commerce, que l'éditeur ne connaît
      // pas. On compare donc à une page publiée qui ne le donne pas non plus.
      const p = texte(H(<P content={c} ctx={{ ...pCtx(), nomCommerce: undefined }} />))
      expect(e, t).toBe(p)
    }
  })
  it("dans l'aperçu, les champs ne se saisissent pas et les boutons ne s'activent pas", () => {
    for (const [t, E, , c] of PAIRES) {
      const h = H(<E content={c} ctx={eCtx()} />)
      for (const champ of h.match(/<(input|textarea)\b[^>]*>/g) ?? []) expect(champ, `${t} : ${champ.slice(0, 60)}`).toMatch(/readonly/i)
      for (const b of h.match(/<button\b[^>]*>/g) ?? []) expect(b, `${t} : bouton`).toContain("disabled")
    }
  })
  it("en ligne, ils se saisissent", () => {
    for (const [t, , P, c] of PAIRES.filter(p => p[0] !== "rsvp")) {
      const h = H(<P content={c} ctx={pCtx()} />)
      const visibles = (h.match(/<(input|textarea)\b[^>]*>/g) ?? []).filter(x => !x.includes('name="website"'))
      expect(visibles.length, t).toBeGreaterThan(1)
      for (const champ of visibles) expect(champ, t).not.toMatch(/readonly/i)
    }
  })
  it("chaque chemin d'envoi s'arrête net dans l'aperçu", () => {
    const src = readFileSync(join(__dirname, "forms/FormulairesEnLigne.tsx"), "utf8")
    expect(src.match(/if \(apercu\) return \/\/ l'aperçu de l'éditeur n'envoie jamais rien/g)?.length, "rsvp, inscription, formulaire générique").toBe(3)
  })
})

describe("la logique d'envoi est celle de la production, intacte", () => {
  const src = readFileSync(join(__dirname, "forms/FormulairesEnLigne.tsx"), "utf8")
  it("pot de miel, enregistrement, repli courrier, confirmation", () => {
    for (const ligne of [
      'if (hp) { setStatus("enregistre"); return } // honeypot rempli = bot',
      "const ok = await submitLead({ pageId, blockId: block.id, type: leadType, name: vals.name, email: vals.email, phone: vals.phone, message: vals.message || vals.project || subject, data })",
      'const ok = await submitLead({ pageId, blockId: block.id, type: "register", name, email, phone: demande("phone") ? phone : undefined, message: `Inscription: ${c.title || "événement"}`, data })',
      'const ok = await submitLead({ pageId, blockId: block.id, type: "rsvp", message: val, data: { question: c.title || "RSVP", reponse: val } })',
      "const dest = adresseEmailValide((block.content as any)?.email_dest) || ownerEmail",
      "const required = fields.slice(0, 2).map(f => f.key)",
    ]) expect(src, ligne.slice(0, 60)).toContain(ligne)
    expect(src.match(/window\.location\.href = brouillon/g)?.length, "deux replis courrier").toBe(2)
  })
  it("la page publiée transmet le nom du commerce et l'adresse de repli", () => {
    const page = readFileSync(join(__dirname, "../../../[slug]/PublicPageClient.tsx"), "utf8")
    expect(page).toContain("nomCommerce, courrielDuCompte: ownerEmail,")
    expect(texte(H(<PublicContactForm content={{}} ctx={pCtx()} />))).toContain("Atelier Nord")
  })
})

describe("thème clair : les champs se voient enfin", () => {
  it("le fond et la bordure viennent du thème (blancs sur blanc avant)", () => {
    const h = H(<PublicContactForm content={{}} ctx={pCtx(clair)} />)
    expect(h).not.toContain("border:1px solid rgba(255,255,255,0.09)")
    expect(h).toContain("border:1px solid rgba(0,0,0,0.12)")
  })
  it("en sombre, rien ne change", () => {
    expect(H(<PublicContactForm content={{}} ctx={pCtx()} />)).toContain("border:1px solid rgba(255,255,255,0.09)")
  })
})

describe("réservation : le téléphone direct est un lien en ligne, un texte dans l'aperçu", () => {
  it("tel: en ligne, pas de lien dans l'éditeur", () => {
    const c = { phone: "03 26 00 00 00" }
    expect(H(<PublicReservationForm content={c} ctx={pCtx()} />)).toMatch(/href="tel:/)
    expect(H(<EditorReservationForm content={c} ctx={eCtx()} />)).not.toContain("href=")
  })
})
