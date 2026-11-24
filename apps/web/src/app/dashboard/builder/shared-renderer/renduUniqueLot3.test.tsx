import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { onglets, sectionsAccordeon, actionsDeBarre, boutonsMultiples, documentsListe } from "./models/structureEtActions"
import { EditorAccordionBlock, PublicAccordionBlock } from "./blocks/accordion_block"
import { EditorTabsBlock, PublicTabsBlock } from "./blocks/tabs_block"
import { EditorStickyBar, PublicStickyBar } from "./blocks/sticky_bar"
import { EditorMultiCta, PublicMultiCta } from "./blocks/multi_cta"
import { EditorDocuments, PublicDocuments } from "./blocks/documents"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import { hasPublishableContent } from "../blockEmptyState"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Rendu unique, lot 3 — la structure (24 nov.).
//
// Onglets, accordéon, barre fixe, grille de boutons, documents. Ce que les
// trois copies disaient de différent :
//   · l'aperçu de `multi_cta` dessinait les boutons sans adresse, que la page
//     ne publie pas ; celui de `documents`, « Télécharger ↓ » sur un document
//     sans fichier ;
//   · l'aperçu des onglets écrivait « Ajoutez du contenu... » dans un onglet vide ;
//   · l'aperçu de l'accordéon montrait tout fermé, la page ouvrait la première ;
//   · la barre fixe ne filtrait pas ses actions pareil des deux côtés.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const eCtx = (): EditorRenderCtx =>
  ({ theme: sombre, primary: sombre.primary, text: sombre.text, muted: sombre.muted, accent: sombre.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (): PublicRenderCtx =>
  ({ theme: sombre, G: sombre.primary, TEXT: sombre.text, MUTED: sombre.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })
const H = (el: any) => renderToStaticMarkup(el)
// Les entités sortent aussi : « &#x27; » (une apostrophe) contient des chiffres.
const texte = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&[#a-z0-9]+;/gi, " ").replace(/\s+/g, " ").trim()

const CINQ = ["accordion_block", "tabs_block", "sticky_bar", "multi_cta", "documents"]

describe("rendu unique, lot 3 — les cinq sont servis par le renderer partagé", () => {
  it("activés, et sans copie dans les trois anciens rendus", () => {
    for (const t of CINQ) expect(SHARED_RENDERER_BLOCKS.has(t), t).toBe(true)
    for (const f of ["../../../[slug]/renduLegacy.tsx", "../builderPreview.tsx", "../../templates/TemplatePreviewModal.tsx"]) {
      const src = readFileSync(join(__dirname, f), "utf8")
      for (const t of CINQ) expect(src, `${f} : ${t}`).not.toContain(`case "${t}"`)
    }
  })
  it("à vide : l'éditeur le dit, la page se tait, le détecteur est d'accord", () => {
    const paires: [string, any, any][] = [
      ["accordion_block", EditorAccordionBlock, PublicAccordionBlock], ["tabs_block", EditorTabsBlock, PublicTabsBlock],
      ["sticky_bar", EditorStickyBar, PublicStickyBar], ["multi_cta", EditorMultiCta, PublicMultiCta], ["documents", EditorDocuments, PublicDocuments],
    ]
    for (const [t, E, P] of paires) {
      expect(H(<P content={{}} ctx={pCtx()} />), t).toBe("")
      expect(H(<E content={{}} ctx={eCtx()} />), t).toContain("Invisible en ligne")
      expect(hasPublishableContent(t, {}), t).toBe(false)
    }
  })
})

describe("multi_cta", () => {
  it("un bouton sans destination n'existe pas — dans l'aperçu non plus", () => {
    const c = { btn1_label: "Réserver", btn1_url: "https://exemple.fr/resa", btn2_label: "Sans lien", btn3_label: "Mort", btn3_url: "javascript:x" }
    expect(boutonsMultiples(c).map(b => b.label)).toEqual(["Réserver"])
    expect(H(<EditorMultiCta content={c} ctx={eCtx()} />), "l'aperçu dessinait ce bouton").not.toContain("Sans lien")
    const p = H(<PublicMultiCta content={c} ctx={pCtx()} />)
    expect(p).toContain('href="https://exemple.fr/resa"')
    expect(p.match(/<li\b/g)?.length).toBe(1)
  })
  it("le détecteur EST le modèle", () => {
    expect(hasPublishableContent("multi_cta", { btn1_label: "Sans lien" })).toBe(false)
    expect(hasPublishableContent("multi_cta", { btn1_label: "Ok", btn1_url: "exemple.fr" })).toBe(true)
  })
})

describe("documents", () => {
  it("« Télécharger » n'apparaît que sur un document qui a un fichier", () => {
    const c = { d1_title: "Notre carte", d1_type: "menu", d1_url: "https://exemple.fr/carte.pdf", d2_title: "Tarifs 2027", d2_type: "tarifs" }
    const docs = documentsListe(c)
    expect(docs.map(d => [d.nom, d.href, d.action])).toEqual([["Notre carte", "https://exemple.fr/carte.pdf", "Consulter"], ["Tarifs 2027", null, "Télécharger"]])
    for (const h of [H(<EditorDocuments content={c} ctx={eCtx()} />), H(<PublicDocuments content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("Consulter")
      expect(h, "aucun « Télécharger » sans fichier").not.toContain("Télécharger")
    }
    expect(texte(H(<EditorDocuments content={c} ctx={eCtx()} />))).toBe(texte(H(<PublicDocuments content={c} ctx={pCtx()} />)))
  })
  it("seule la page publiée mène au fichier", () => {
    const c = { d1_title: "Notre carte", d1_url: "https://exemple.fr/carte.pdf" }
    expect(H(<PublicDocuments content={c} ctx={pCtx()} />)).toContain('href="https://exemple.fr/carte.pdf"')
    expect(H(<EditorDocuments content={c} ctx={eCtx()} />)).not.toContain("href=")
  })
})

describe("tabs_block", () => {
  it("un onglet vide reste vide — plus de « Ajoutez du contenu... »", () => {
    const c = { tab1_label: "Midi", tab2_label: "Soir", tab2_content: "Menu du soir" }
    expect(onglets(c)).toEqual([{ label: "Midi", contenu: "" }, { label: "Soir", contenu: "Menu du soir" }])
    expect(H(<EditorTabsBlock content={c} ctx={eCtx()} />)).not.toContain("Ajoutez du contenu")
  })
  it("le motif ARIA : un tablist, des tabs reliés à leur panneau, le premier sélectionné", () => {
    const h = H(<PublicTabsBlock content={{ tab1_label: "Midi", tab1_content: "Plat du jour", tab2_label: "Soir" }} ctx={pCtx()} />)
    expect(h).toContain('role="tablist"')
    expect(h.match(/role="tab"/g)?.length).toBe(2)
    expect(h).toMatch(/aria-selected="true"[^>]*>Midi</)
    expect(h).toContain('role="tabpanel"')
    expect(h).toContain("Plat du jour")
  })
})

describe("accordion_block", () => {
  it("la première section est ouverte, des deux côtés", () => {
    const c = { title: "Infos", a1_title: "Accès", a1_content: "Métro ligne 4", a2_title: "Parking", a2_content: "Rue voisine" }
    for (const h of [H(<EditorAccordionBlock content={c} ctx={eCtx()} />), H(<PublicAccordionBlock content={c} ctx={pCtx()} />)]) {
      expect(h, "l'aperçu montrait tout fermé").toContain("Métro ligne 4")
      expect(h).not.toContain("Rue voisine")
      expect(h).toContain('aria-expanded="true"')
    }
    expect(sectionsAccordeon(c).length).toBe(2)
  })
})

describe("sticky_bar", () => {
  it("même filtre que le détecteur, cas par cas", () => {
    const cas: Record<string, string>[] = [
      {}, { a1_type: "none" }, { a1_type: "call" }, { a1_type: "call", a1_value: "06 12 34 56 78" },
      { a1_type: "share" }, { a1_type: "link", a1_value: "javascript:alert(1)" }, { a1_type: "reserve", a1_value: "exemple.fr/resa" },
    ]
    for (const c of cas) expect(actionsDeBarre(c).length > 0, JSON.stringify(c)).toBe(hasPublishableContent("sticky_bar", c))
  })
  it("au-delà de cinq actions, rien", () => {
    expect(actionsDeBarre({ a6_type: "share" })).toEqual([])
  })
  it("en ligne : une barre FIXE, nommée, et la clé de suivi historique", () => {
    const traces: string[] = []
    const c = { a1_type: "call", a1_value: "06 12 34 56 78", a2_type: "share", position: "bottom" }
    const h = H(<PublicStickyBar content={c} ctx={{ ...pCtx(), trackClick: (t: string) => { traces.push(t) } }} />)
    expect(h).toContain("position:fixed")
    expect(h).toContain('aria-label="Actions rapides"')
    expect(h).toContain('href="tel:')
    expect(h, "le partage est un bouton").toContain('aria-haspopup="menu"')
  })
  it("dans l'aperçu : à sa place, sans lien, avec la position annoncée", () => {
    const h = H(<EditorStickyBar content={{ a1_type: "call", a1_value: "06 12 34 56 78", position: "top" }} ctx={eCtx()} />)
    expect(h).not.toContain("position:fixed")
    expect(h).not.toContain("href=")
    expect(texte(h)).toContain("haut de l écran")
  })
  it("libellés masqués : le lecteur d'écran garde le nom de l'action", () => {
    const h = H(<PublicStickyBar content={{ a1_type: "call", a1_value: "0612345678", show_labels: "no" }} ctx={pCtx()} />)
    expect(h).toContain("Appeler")
    expect(h).toContain("clip:rect(0 0 0 0)")
  })
})
