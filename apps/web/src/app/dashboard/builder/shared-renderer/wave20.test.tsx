import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { invites, initialeInvite, acces, agenda, dateLisible, billetterie } from "./models/evenement"
import { EditorEventGuests, PublicEventGuests } from "./blocks/event_guests"
import { EditorEventAccess, PublicEventAccess } from "./blocks/event_access"
import { EditorAddToCalendar, PublicAddToCalendar } from "./blocks/add_to_calendar"
import { EditorTicketing, PublicTicketing } from "./blocks/ticketing"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Vague 20 — la famille événement.
//
//   · add_to_calendar dessinait TROIS boutons dans l'aperçu (Google, Apple,
//     Outlook) là où la page en publie DEUX. Le troisième n'a jamais existé :
//     il n'y a que deux liens, l'un vers Google Agenda, l'autre un fichier .ics
//     qu'Apple ET Outlook ouvrent tous les deux ;
//   · ticketing dessinait sa carte de billetterie complète, bouton compris,
//     même entièrement vide ;
//   · event_access dessinait un cadre de carte de 130 px sans aucune carte ;
//   · event_guests écrasait le rôle à 9 px et la description à 10 px, contre
//     13 et 13,5 en ligne — bien au-delà de son échelle de 0,86.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const clair: any = { ...sombre, bg: "#FFFFFF", text: "#1A1A1A", muted: "#6B7280" }
const eCtx = (theme: any = sombre): EditorRenderCtx =>
  ({ theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (theme: any = sombre): PublicRenderCtx =>
  ({ theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })
const H = (el: any) => renderToStaticMarkup(el)

const INVITES = { title: "Nos invités", g1_name: "Camille Nord", g1_role: "Cheffe", g1_desc: "Vingt ans de métier.", g3_name: "Alex Rivière" }
const ACCES = { title: "Comment venir", address: "12 rue des Peupliers, Reims", transport1_icon: "🚋", transport1_label: "Tram A — arrêt Comédie" }
const AGENDA = { event_name: "Concert d'été", start_date: "2026-08-15T20:30", location: "Reims" }
const BILLETS = { event_name: "Concert d'été", date: "15 août", venue: "La Cartonnerie", price: "18 €", url: "https://billets.fr/x", platform: "Dice" }

describe("vague 20 - add_to_calendar : deux boutons, pas trois", () => {
  it("le fichier .ics sert a la fois a Apple et a Outlook", () => {
    const a = agenda(AGENDA)!
    expect(a.liens.map(l => l.label)).toEqual(["📅 Google Agenda", "🍎 Apple / Outlook"])
  })
  it("l'apercu en dessine exactement autant que la page", () => {
    const ed = H(<EditorAddToCalendar content={AGENDA} ctx={eCtx()} />)
    // Il en dessinait trois : Google, Apple, Outlook. Il en dessine deux.
    expect((ed.match(/aria-disabled/g) ?? []).length).toBe(2)
    expect((H(<PublicAddToCalendar content={AGENDA} ctx={pCtx()} />).match(/<a /g) ?? []).length).toBe(2)
    expect(ed).toContain("Apple / Outlook")
  })
  it("sans date ni nom, aucun bouton invente", () => {
    // L'apercu dessinait un bouton rose « Ajouter a mon agenda » sur un bloc
    // que la page ne publie pas.
    expect(agenda({})).toBeNull()
    const h = H(<EditorAddToCalendar content={{}} ctx={eCtx()} />)
    expect(h).toContain("Invisible en ligne")
    expect(h).not.toContain("Ajouter à mon agenda")
  })
  it("un nom sans date donne la carte, mais aucun lien", () => {
    const a = agenda({ event_name: "Concert" })!
    expect(a.liens).toEqual([])
  })
  it("la date se lit, elle ne s'affiche plus brute", () => {
    // L'apercu ecrivait « 2026-08-15T20:30 ».
    expect(dateLisible("2026-08-15T20:30")).toBe("2026-08-15 à 20:30")
    expect(dateLisible("")).toBe("")
    for (const h of [H(<EditorAddToCalendar content={AGENDA} ctx={eCtx()} />), H(<PublicAddToCalendar content={AGENDA} ctx={pCtx()} />)]) {
      expect(h).toContain("2026-08-15 à 20:30")
      expect(h).not.toContain("T20:30")
    }
  })
  it("le fichier telecharge porte un nom lisible", () => {
    // « Concert d'été » donnait « Concert_d_t_.ics » : les accents etaient
    // supprimes, pas translitteres, et le visiteur retrouvait ca dans son
    // dossier de telechargements.
    expect(agenda(AGENDA)!.liens[1].fichier).toBe("concert-d-ete.ics")
    expect(agenda({ event_name: "", start_date: "2026-08-15T20:30" })!.liens[1].fichier).toBe("evenement.ics")
  })
})

describe("vague 20 - ticketing : plus de billetterie fantome", () => {
  it("un bloc vide ne dessine plus la carte", () => {
    expect(billetterie({})).toBeNull()
    const h = H(<EditorTicketing content={{}} ctx={eCtx()} />)
    expect(h).toContain("Invisible en ligne")
    expect(h).not.toContain("Acheter mes billets")
  })
  it("la plateforme choisie complete le libelle, des deux cotes", () => {
    expect(billetterie(BILLETS)!.cta!.label).toBe("Acheter mes billets — Dice")
    expect(billetterie({ ...BILLETS, platform: "URL personnalisée" })!.cta!.label).toBe("Acheter mes billets")
  })
  it("sans adresse de billetterie, aucun bouton", () => {
    expect(billetterie({ event_name: "Concert" })!.cta).toBeNull()
    expect(billetterie({ event_name: "Concert", url: "#" })!.cta).toBeNull()
  })
})

describe("vague 20 - event_access : plus de cadre de carte sans carte", () => {
  it("sans plan ni adresse ni transport, rien", () => {
    expect(acces({ title: "Comment venir" })).toBeNull()
    expect(H(<EditorEventAccess content={{ title: "Comment venir" }} ctx={eCtx()} />)).toContain("Invisible en ligne")
  })
  it("des transports seuls suffisent, mais ne fabriquent pas de carte", () => {
    const a = acces({ transport1_label: "Tram A" })!
    expect(a.plan).toBe("")
    expect(a.transports).toHaveLength(1)
    const h = H(<PublicEventAccess content={{ transport1_label: "Tram A" }} ctx={pCtx()} />)
    expect(h).toContain("Tram A")
    expect(h).not.toContain("🗺️")
  })
  it("une adresse construit le plan, un embed etranger est refuse", () => {
    expect(acces({ address: "Reims" })!.plan).toContain("maps.google.com")
    expect(acces({ address: "Reims", embed_url: "https://evil.com/maps" })!.plan).toContain("maps.google.com")
    expect(acces({ address: "Reims", embed_url: "https://evil.com/maps" })!.plan).not.toContain("evil.com")
  })
})

describe("vague 20 - event_guests : les invités ne sont plus ecrases", () => {
  it("le nom porte l'invite, les trous ne coupent pas la liste", () => {
    expect(invites(INVITES).map(g => g.nom)).toEqual(["Camille Nord", "Alex Rivière"])
    expect(invites({ g1_role: "Chef" })).toEqual([])
  })
  it("sans photo, l'initiale", () => {
    expect(initialeInvite("camille")).toBe("C")
    expect(initialeInvite("")).toBe("?")
  })
  it("le role et la description gardent leur taille de reference", () => {
    // 13 et 13,5 en ligne ; l'apercu les ecrasait a 9 et 10.
    const pub = H(<PublicEventGuests content={INVITES} ctx={pCtx()} />)
    expect(pub).toContain("font-size:13px")    // le role
    expect(pub).toContain("font-size:14px")    // la description (13,5 arrondi)
    const ed = H(<EditorEventGuests content={INVITES} ctx={eCtx()} />)
    expect(ed).toContain("font-size:11px")     // 13 x 0,86 — il ecrivait 9
    expect(ed).toContain("font-size:12px")     // 13,5 x 0,86 — il ecrivait 10
  })
  it("la photo passe par le meme chemin dimensionne des deux cotes", () => {
    const c = { g1_name: "Camille", g1_photo: "https://abcdefgh.supabase.co/storage/v1/object/public/g/1.jpg" }
    for (const h of [H(<EditorEventGuests content={c} ctx={eCtx()} />), H(<PublicEventGuests content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("/_next/image")
      expect(h).toContain('sizes="58px"')
    }
  })
})

describe("vague 20 - l'apercu montre ce qui sera publie", () => {
  const textes = (h: string) => h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
  for (const [type, Ed, Pub, contenu] of [
    ["event_guests", EditorEventGuests, PublicEventGuests, INVITES],
    ["event_access", EditorEventAccess, PublicEventAccess, ACCES],
    ["event_access-transports", EditorEventAccess, PublicEventAccess, { transport1_icon: "🚋", transport1_label: "Tram A" }],
    ["add_to_calendar", EditorAddToCalendar, PublicAddToCalendar, AGENDA],
    ["ticketing", EditorTicketing, PublicTicketing, BILLETS],
  ] as const) {
    it(type + " : memes textes des deux cotes", () => {
      expect(textes(H(<Ed content={contenu} ctx={eCtx()} />))).toEqual(textes(H(<Pub content={contenu} ctx={pCtx()} /> as any)))
    })
  }
})

describe("vague 20 - liens reels en ligne, coquilles inertes dans l'apercu", () => {
  for (const [type, Ed, Pub, contenu] of [
    ["add_to_calendar", EditorAddToCalendar, PublicAddToCalendar, AGENDA],
    ["ticketing", EditorTicketing, PublicTicketing, BILLETS],
  ] as const) {
    it(type + " : vrai lien public, rien de navigable dans le canvas", () => {
      expect(H(<Pub content={contenu} ctx={pCtx()} /> as any)).toContain("href=")
      expect(H(<Ed content={contenu} ctx={eCtx()} />)).not.toContain("href=")
    })
  }
})

describe("vague 20 - les surfaces suivent le theme", () => {
  it("les lignes de transport restent visibles sur un theme clair", () => {
    expect(H(<PublicEventAccess content={ACCES} ctx={pCtx(clair)} />)).not.toMatch(/rgba\(255,255,255/)
    expect(H(<PublicEventAccess content={ACCES} ctx={pCtx()} />)).toMatch(/rgba\(255,255,255/)
  })
})

describe("vague 20 - activation", () => {
  it("les quatre blocs sont dans le drapeau de migration", () => {
    for (const t of ["event_guests", "event_access", "add_to_calendar", "ticketing"]) expect(SHARED_RENDERER_BLOCKS.has(t)).toBe(true)
  })
})
