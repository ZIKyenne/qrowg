import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { equipe, interlocuteurs, enGrille, initiale } from "./models/equipeEtContacts"
import { EditorTeam, PublicTeam } from "./blocks/team"
import { EditorMultiContact, PublicMultiContact } from "./blocks/multi_contact"
import { texteFige } from "./primitives/TexteInline"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Vague 14 — « notre équipe » et « vos interlocuteurs », deux blocs très posés.
// C'est aussi le premier bloc migré qui GARDE l'édition en ligne : jusqu'ici, la
// seule façon de la conserver était d'écrire deux adapters qui recopient la même
// géométrie — c'est-à-dire de réintroduire la divergence que le renderer partagé
// existe pour supprimer. La vue reçoit désormais le rendu du texte en paramètre.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const clair: any = { ...sombre, bg: "#FFFFFF", text: "#1A1A1A", muted: "#6B7280" }

const ecrits: Array<[string, string]> = []
// `canEdit` distingue les deux états de l'aperçu : le canvas d'édition (où le
// texte est éditable) et le mini-aperçu (où il ne l'est pas). InlineEditable pose
// son texte par ref, après le montage, pour ne pas déplacer le curseur : en rendu
// statique, un champ éditable sort donc VIDE. La comparaison de contenu se fait
// donc sur le mini-aperçu, et l'édition a son propre test.
const eCtx = (theme: any = sombre, canEdit = false): EditorRenderCtx =>
  ({ theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit, edit: (k: string) => (v: string) => { ecrits.push([k, v]) } })
const pCtx = (theme: any = sombre): PublicRenderCtx =>
  ({ theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })

const H = (el: any) => renderToStaticMarkup(el)
const EQUIPE = { title: "L'équipe", m1_name: "Camille Nord", m1_role: "Cheffe", m1_bio: "Vingt ans de métier.", m1_phone: "03 26 12 34 56", m1_email: "camille@atelier.fr" }
const CONTACTS = { title: "Vos interlocuteurs", c1_name: "Camille Nord", c1_role: "Commerciale", c1_phone: "0326123456" }

describe("vague 14 - modeles purs", () => {
  it("equipe : le nom porte le membre, les trous ne coupent pas la liste", () => {
    expect(equipe({ m1_role: "Chef" })).toEqual([])
    expect(equipe({ m1_name: "A", m3_name: "C" }).map(m => [m.i, m.nom])).toEqual([[1, "A"], [3, "C"]])
    expect(equipe({ m1_name: "  " })).toEqual([])
  })
  it("equipe : les moyens de joindre sont durcis et nommes pour un lecteur d'ecran", () => {
    const m = equipe({ m1_name: "Camille", m1_phone: "03 26 12 34 56", m1_email: "c@a.fr", m1_linkedin: "camille-nord" })[0]
    expect(m.jointures.map(j => j.icone)).toEqual(["📞", "✉️", "in"])
    expect(m.jointures[0].lien.href).not.toContain(" ")          // le numero est nettoye
    expect(m.jointures[0].libelle).toBe("Appeler Camille")
    expect(m.jointures[1].lien.href).toBe("mailto:c@a.fr")
    expect(m.jointures[2].lien.href).toContain("linkedin")
    expect(m.jointures[2].lien.external).toBe(true)
  })
  it("equipe : sans coordonnees, aucun bouton", () => {
    expect(equipe({ m1_name: "Camille" })[0].jointures).toEqual([])
  })
  it("interlocuteurs : memes regles, sans LinkedIn", () => {
    expect(interlocuteurs({ c1_role: "Poste" })).toEqual([])
    const p = interlocuteurs({ c1_name: "Camille", c1_phone: "0326123456", c1_email: "c@a.fr" })[0]
    expect(p.jointures.map(j => j.icone)).toEqual(["📞", "✉️"])
  })
  it("enGrille : le libelle du panneau decide", () => {
    expect(enGrille({ layout: "Grille" })).toBe(true)
    expect(enGrille({ layout: "Liste" })).toBe(false)
    expect(enGrille({})).toBe(false)
  })
  it("initiale : la premiere lettre affichable, meme avec un espace ou un accent", () => {
    expect(initiale("camille")).toBe("C")
    expect(initiale("  élodie")).toBe("É")
    expect(initiale("")).toBe("?")
    expect(initiale("   ")).toBe("?")
  })
})

describe("vague 14 - un bloc vide ne publie rien et n'invente personne", () => {
  for (const [type, Ed, Pub] of [["team", EditorTeam, PublicTeam], ["multi_contact", EditorMultiContact, PublicMultiContact]] as const) {
    it(type + " : public null ; l'editeur invite", () => {
      expect(Pub({ content: {}, ctx: pCtx() } as any)).toBeNull()
      const h = H(<Ed content={{}} ctx={eCtx()} />)
      expect(h).toContain('role="note"')
      expect(h).toContain("Invisible en ligne")
    })
  }

  it("multi_contact : les deux fausses fiches « Prénom Nom » ont disparu", () => {
    const h = H(<EditorMultiContact content={{ title: "Contacts" }} ctx={eCtx()} />)
    expect(h).not.toContain("Prénom Nom")
    expect(h).not.toContain("Poste")
  })
})

describe("vague 14 - l'apercu montre ce qui sera publie", () => {
  const textes = (h: string) => h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
  for (const [type, Ed, Pub, contenu] of [
    ["team", EditorTeam, PublicTeam, EQUIPE],
    ["team-grille", EditorTeam, PublicTeam, { ...EQUIPE, layout: "Grille", m2_name: "Alex Rivière" }],
    ["multi_contact", EditorMultiContact, PublicMultiContact, CONTACTS],
  ] as const) {
    it(type + " : memes textes des deux cotes", () => {
      expect(textes(H(<Ed content={contenu} ctx={eCtx()} />))).toEqual(textes(H(<Pub content={contenu} ctx={pCtx()} /> as any)))
    })
  }

  it("l'avatar sans photo montre l'initiale des deux cotes, plus un « 👤 » d'un seul", () => {
    const c = { m1_name: "Camille Nord" }
    for (const h of [H(<EditorTeam content={c} ctx={eCtx()} />), H(<PublicTeam content={c} ctx={pCtx()} />)]) {
      expect(h).toContain(">C<")
      expect(h).not.toContain("👤")
    }
  })
})

describe("vague 14 - l'edition en ligne survit a la migration", () => {
  it("l'apercu rend le nom, le role et la bio editables", () => {
    const h = H(<EditorTeam content={EQUIPE} ctx={eCtx(sombre, true)} />)
    expect(h).toContain("contenteditable")
    // Trois champs editables pour un membre complet : nom, role, bio.
    expect((h.match(/contenteditable/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it("la page publiee, elle, ne rend rien d'editable", () => {
    const h = H(<PublicTeam content={EQUIPE} ctx={pCtx()} />)
    expect(h).not.toContain("contenteditable")
    expect(h).toContain("Camille Nord")
  })

  it("texteFige rend un element ordinaire, sans capacite d'edition", () => {
    expect(H(<>{texteFige({ valeur: "Bonjour", cle: "x", style: {}, balise: "span" })}</>)).toBe("<span>Bonjour</span>")
  })
})

describe("vague 14 - liens reels en ligne, coquilles inertes dans l'apercu", () => {
  it("les boutons de contact sont de vrais liens sur la page publiee", () => {
    const h = H(<PublicTeam content={EQUIPE} ctx={pCtx()} />)
    expect(h).toContain('href="tel:')
    expect(h).toContain('href="mailto:camille@atelier.fr"')
    expect(h).toContain('aria-label="Appeler Camille Nord"')
  })
  it("et de simples coquilles dans l'apercu", () => {
    const h = H(<EditorTeam content={EQUIPE} ctx={eCtx()} />)
    expect(h).not.toContain("href=")
    expect(h).toContain('aria-disabled="true"')
  })
})

describe("vague 14 - les surfaces suivent le theme", () => {
  for (const [type, Pub, contenu] of [["team", PublicTeam, EQUIPE], ["multi_contact", PublicMultiContact, CONTACTS]] as const) {
    it(type + " : les cartes restent visibles sur un theme clair", () => {
      expect(H(<Pub content={contenu} ctx={pCtx(clair)} />)).not.toMatch(/rgba\(255,255,255/)
      expect(H(<Pub content={contenu} ctx={pCtx()} />)).toMatch(/rgba\(255,255,255/)
    })
  }
})

describe("vague 14 - activation", () => {
  it("les deux blocs sont dans le drapeau de migration", () => {
    for (const t of ["team", "multi_contact"]) expect(SHARED_RENDERER_BLOCKS.has(t)).toBe(true)
  })
})
