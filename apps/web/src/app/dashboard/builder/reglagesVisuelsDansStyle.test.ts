import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { BLOCK_DEFS } from "./blockDefs"
import { champDe, isAppearanceField } from "./builderPanels"

// Revue du 9 septembre (P0, éditeur) : « aucun réglage visuel dans Contenu ».
// Forme / contour / fond / ombre d'avatar, couleurs, styles, coins, cadres,
// voiles… vivent dans Style › Apparence du bloc. Le contenu (textes, liens,
// images, « Rayon (km) » de la carte) reste dans Contenu.

const src = readFileSync(join(__dirname, "BuilderV4.tsx"), "utf8")

describe("classement des champs", () => {
  it("les quatre réglages d'avatar du bloc Profil sont de l'apparence", () => {
    for (const k of ["avatar_shape", "avatar_border", "avatar_bg", "avatar_shadow"]) {
      const f = BLOCK_DEFS.profile.fields.find((x: any) => x.key === k)
      expect(f, k).toBeTruthy()
      expect(champDe(f as any), k).toBe("apparence")
    }
  })
  it("tout champ de type couleur est de l'apparence ; un texte, un lien ou une image n'en est jamais", () => {
    for (const [t, d] of Object.entries(BLOCK_DEFS as any)) for (const f of ((d as any).fields ?? []) as any[]) {
      if (f.type === "color") expect(champDe(f), `${t}.${f.key}`).toBe("apparence")
      if (["text", "textarea", "url", "image"].includes(f.type) && !String(f.key).startsWith("overlay")) expect(champDe(f), `${t}.${f.key}`).not.toBe("apparence")
    }
  })
  it("« Rayon (km) » de la carte reste du contenu, « Coins » des sections est de l'apparence", () => {
    const rayon = Object.values(BLOCK_DEFS as any).flatMap((d: any) => d.fields ?? []).find((f: any) => f.key === "radius" && f.type === "text")
    expect(rayon).toBeTruthy()
    expect(champDe(rayon as any)).toBe("content")
    expect(champDe({ key: "radius", type: "select" })).toBe("apparence")
    expect(champDe({ key: "align", type: "select" })).toBe("layout")
    expect(isAppearanceField({ key: "title", type: "text" })).toBe(false)
  })
  it("au moins 200 champs d'apparence quittent Contenu", () => {
    const n = Object.values(BLOCK_DEFS as any).flatMap((d: any) => d.fields ?? []).filter((f: any) => champDe(f) === "apparence").length
    expect(n).toBeGreaterThan(200)
  })
})

describe("inspecteur", () => {
  it("Contenu ne rend que only=\"content\" ; Style rend Apparence du bloc puis Mise en page", () => {
    expect(src).toContain('{editTab === "contenu" && <EditPanel key={selectedBlock.id+"-c"} block={selectedBlock} onChange={set} only="content" />}')
    expect(src).toContain('only="apparence" />')
    expect(src).toContain(">Apparence du bloc</p>")
    expect(src.indexOf(">Apparence du bloc</p>")).toBeLessThan(src.indexOf(">Mise en page</p>"))
  })
  it("sur mobile, l'onglet Design reçoit aussi l'apparence (rien ne disparaît)", () => {
    expect(src).toContain('renderLegacyDesign={(b) => <><EditPanel key={b.id + "-ma"} block={b} onChange={(k, v) => updateBlock(b.id, k, v)} only="apparence" />')
    expect(src).toContain('renderLegacyDesign={(b) => <><EditPanel key={b.id+"-a"} block={b} onChange={(k, v) => updateBlock(b.id, k, v)} only="apparence" />')
  })
  it("EditPanel filtre par champDe (une seule règle pour les trois onglets)", () => {
    const p = readFileSync(join(__dirname, "builderPanels.tsx"), "utf8")
    expect(p).toContain("const scoped = def.fields.filter(f => only ? champDe(f as ChampDef) === only : true)")
  })
})

describe("premier clic guidé", () => {
  it("à l'ouverture sur grand écran, le premier bloc est sélectionné d'office (une fois par page)", () => {
    expect(src).toContain("if (isMobile || !pagePrete || selectedId || blocks.length === 0) return")
    expect(src).toContain("premierBlocChoisiRef.current = liveId ?? pageId")
    expect(src).toContain('setSelectedId(blocks[0].id); setRightTab("edit")')
  })
  it("l'inspecteur vide dit quoi faire et le fait : page vide → Choisir un bloc ; sinon → Modifier le premier bloc", () => {
    const iv = readFileSync(join(__dirname, "InspecteurVide.tsx"), "utf8")
    expect(src).toContain("<InspecteurVide vide={blocks.length === 0} isMobile={isMobile}")
    expect(src).toContain('onPremierBloc={() => { setSelectedId(blocks[0].id); setRightTab("edit") }}')
    expect(iv).toContain('data-inspecteur-vide={vide ? "page-vide" : "aucune-selection"}')
    for (const t of ["Votre page est vide", "Choisir un bloc", "Aucun bloc sélectionné", "Modifier le premier bloc"]) expect(iv).toContain(t)
  })
  it("le brouillon restauré d'un invité refait la sélection d'ouverture", () => {
    expect(src).toContain("setSelectedId(null); premierBlocChoisiRef.current = undefined")
  })
})

describe("canevas d'abord", () => {
  it("largeurs par défaut : bibliothèque 260, inspecteur 300 (avec le rail de 76, canevas ≥ 55 % dès 1440 px)", () => {
    expect(src).toContain('useResize("blocks", 260, 240, 520)')
    expect(src).toContain('useResize("right", 300, 280, 520)')
  })
  it("écran étroit sans préférence : la bibliothèque s'ouvre repliée (un clic la déploie)", () => {
    expect(src).toContain('if (localStorage.getItem("qrfolio_blocks_collapsed") !== null) return')
    expect(src).toContain("if (window.innerWidth >= 1024 && window.innerWidth < 1366) setBlocksCollapsed(true)")
    // et jamais dans l'initialiseur d'état (rendu serveur ≠ client → erreur d'hydratation)
    expect(src).not.toMatch(/useState\(\(\) => \{[^}]*innerWidth/)
  })
})
