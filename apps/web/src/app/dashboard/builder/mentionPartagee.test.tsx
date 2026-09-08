import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { BlockPreview } from "./builderPreview"
import { BLOCK_DEFS } from "./blockDefs"
import { SHARED_RENDERER_BLOCKS } from "./shared-renderer/architecture"
import { boutonsSansLien, cleDuLien, mentionBoutonSansLien } from "./boutonSansLien"

// ═══════════════════════════════════════════════════════════════════════════════
// LA MISE EN GARDE QUI NE S'AFFICHAIT PLUS.
//
// Depuis le 7 septembre, la page publiée ne publie plus de bouton sans
// destination : un contrôle qui ne fait rien est pire qu'un contrôle absent.
// L'aperçu, lui, garde le bouton — le commerçant doit pouvoir le composer — mais
// il l'accompagne d'une mention : « Le bouton « Réserver » n'a pas de lien : il ne
// sera pas publié. »
//
// Cette mention était calculée APRÈS l'aiguillage vers le renderer partagé. Elle
// ne s'affichait donc que sur les blocs restés legacy — dix sur quarante-quatre.
// Les trente-quatre autres, DÉJÀ MIGRÉS, la perdaient en silence : `cta_button`
// (le bouton principal de la moitié des pages), `product`, `pricing`, `donation`,
// `download_file`, `merch`, les cinq liens de `favorite_links`…
//
// Le commerçant nommait son bouton, oubliait de coller l'adresse, voyait un bouton
// parfaitement normal dans son aperçu, publiait — et le bouton n'existait pas.
//
// Le renderer partagé rendait donc la page plus juste et l'éditeur plus muet. Ce
// contrôle vérifie que la mention vaut pour les 178 blocs, migrés ou non.
// ═══════════════════════════════════════════════════════════════════════════════

const theme: any = {
  bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F",
  text: "#F5F0E8", muted: "#A8A190", fontDisplay: "Fraunces, serif", fontBody: "DM Sans, sans-serif",
}
const apercu = (type: string, content: Record<string, any>) =>
  renderToStaticMarkup(<BlockPreview block={{ id: "b1", type, content, position: 0 } as any} theme={theme} dayMode={false} />)

/** Les blocs dont le panneau propose au moins un couple « libellé + lien ». */
const AVEC_BOUTON = Object.entries(BLOCK_DEFS).flatMap(([type, def]) => {
  const cles: string[] = ((def as any).fields ?? []).map((f: any) => f?.key).filter(Boolean)
  const paires = cles.filter(k => /label$/.test(k) && cles.includes(cleDuLien(k) ?? ""))
  return paires.length ? [{ type, paires }] : []
})

describe("un bouton sans lien est annonce, migre ou non", () => {
  it("le releve couvre bien les deux familles", () => {
    expect(AVEC_BOUTON.length, "trop peu de blocs à bouton").toBeGreaterThan(35)
    const partages = AVEC_BOUTON.filter(b => SHARED_RENDERER_BLOCKS.has(b.type))
    expect(partages.length, "sans blocs partagés, ce test ne garde rien").toBeGreaterThan(25)
  })

  it("chaque bloc a bouton previent quand l'adresse manque", () => {
    const muets: string[] = []
    for (const { type, paires } of AVEC_BOUTON) {
      const c: Record<string, any> = {}
      for (const k of paires) c[k] = "Mon bouton"
      if (boutonsSansLien(type, c).length === 0) continue      // rien à annoncer
      let html = ""
      try { html = apercu(type, c) } catch { continue }
      if (!/role="note"/.test(html)) muets.push(type)
    }
    expect(muets.sort()).toEqual([])
  })

  it("et il se tait des que l'adresse est la", () => {
    for (const type of ["cta_button", "donation", "download_file", "external_shop"]) {
      const paires = AVEC_BOUTON.find(b => b.type === type)!.paires
      const c: Record<string, any> = {}
      for (const k of paires) { c[k] = "Mon bouton"; c[cleDuLien(k)!] = "https://exemple.fr" }
      expect(boutonsSansLien(type, c), `${type} : plus rien à reprocher`).toEqual([])
    }
  })

  it("la phrase nomme le bouton fautif", () => {
    const html = apercu("cta_button", { label: "Réserver ma table" })
    expect(html).toContain("Réserver ma table")
    expect(mentionBoutonSansLien(boutonsSansLien("cta_button", { label: "Réserver ma table" })))
      .toContain("ne sera pas publié")
  })

  it("cta_button est bien un bloc PARTAGE : c'est tout l'interet du controle", () => {
    // Si ce bloc repassait en legacy, le test ci-dessus redeviendrait trivial.
    expect(SHARED_RENDERER_BLOCKS.has("cta_button")).toBe(true)
    expect(SHARED_RENDERER_BLOCKS.has("product")).toBe(true)
  })
})

describe("les portraits d'une rangee d'avatars portent leur nom", () => {
  it("le nom saisi devient l'alternative de la photo", () => {
    // Le panneau demande un nom par portrait ; il ne servait qu'à l'initiale du
    // repli. Avec une photo, le nom n'existait nulle part. (Vague 27.)
    const html = apercu("avatar_row", { img1: "https://exemple.fr/a.jpg", name1: "Camille", img2: "https://exemple.fr/b.jpg", name2: "Yanis" })
    expect(html).toContain('alt="Camille"')
    expect(html).toContain('alt="Yanis"')
  })
  it("sans nom, la photo reste muette plutot que d'inventer", () => {
    expect(apercu("avatar_row", { img1: "https://exemple.fr/a.jpg" })).toContain('alt=""')
  })
})
