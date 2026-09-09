import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 9 septembre — l'inspecteur du bloc suit la maquette : trois onglets toujours
// visibles (Contenu · Style · Effets) et « Réglages avancés » replié en bas.
// Avant : un mode Simple qui cachait tout sauf Contenu, un mode Expert à quatre
// onglets. Garde-fou : chaque réglage d'avant a toujours une porte.

const src = readFileSync(join(__dirname, "BuilderV4.tsx"), "utf8")
const inspecteur = src.slice(src.indexOf("const TABS = ["), src.indexOf("{!rightCollapsed && (focusMode || rightTab===\"theme\")"))

describe("inspecteur — onglets", () => {
  it("Contenu · Style · Effets, toujours affichés (plus de garde expertMode)", () => {
    expect(inspecteur).toContain('{ k: "contenu", label: "Contenu" },\n                          { k: "style", label: "Style" },\n                          { k: "effets", label: "Effets" },')
    expect(inspecteur).not.toContain("expertMode &&")
    expect(inspecteur).not.toContain('label: "Mise en page"')
    expect(inspecteur).not.toContain('label: "Avancé"')
    expect(src).not.toContain("Style &amp; options avancées")
    expect(src).not.toContain("Revenir au mode simple")
  })
  it("le repli « Réglages avancés » existe, fermé par défaut, avec aria-expanded", () => {
    expect(src).toContain('const [avanceOuvert, setAvanceOuvert] = useState(false)')
    expect(inspecteur).toContain('aria-expanded={avanceOuvert} aria-controls="reglages-avances-bloc"')
    expect(inspecteur).toContain("> Réglages avancés</span>")
  })
})

describe("inspecteur — aucun réglage n'a disparu", () => {
  const portes: [string, string][] = [
    ['sel("__width"', "Style › Mise en page"], ['sel("__space"', "Style › Mise en page"], ['set("__text_scale"', "Style › Mise en page"],
    ['only="layout"', "Style › Mise en page"], ['set("__grad"', "Style"], ['set("__bg"', "Style"], ['set("__intensity"', "Style"],
    ['toggle("__border"', "Style"], ['sel("__radius"', "Style"], ['sel("__shadow"', "Style"], ["STYLE_COPY_KEYS.forEach", "Style › réinitialiser"],
    ["setStyleClipboard(", "Style › copier"], ["BLOCK_STYLE_PRESETS.map", "Style › modèles"],
    ['toggle("__glow"', "Effets"], ['toggle("__glass"', "Effets"], ['sel("__anim"', "Effets"], ['sel("__anim_speed"', "Effets"],
    ['sel("__hover"', "Effets"], ['sel("__loop"', "Effets"],
    ['key: "hide_mobile"', "Avancés › visibilité"], ['key: "hide_desktop"', "Avancés › visibilité"], ['set("__name"', "Avancés › nom interne"],
    ["duplicateBlock(selectedBlock.id)", "Avancés › actions"], ["deleteBlock(selectedBlock.id)", "Avancés › actions"],
  ]
  for (const [marqueur, porte] of portes) {
    it(`${porte} : ${marqueur}`, () => { expect(inspecteur).toContain(marqueur) })
  }
  it("Mise en page vit dans Style (pas d'onglet à part)", () => {
    const style = inspecteur.slice(inspecteur.indexOf('{editTab === "style" && ('))
    expect(style).toContain(">Mise en page</p>")
    expect(style.indexOf('only="layout"')).toBeGreaterThan(-1)
  })
  it("la préférence « expert » d'avant ouvre le repli au lieu de disparaître", () => {
    expect(src).toContain('if (localStorage.getItem("qrfolio_expert_mode") === "1") { setExpertModeRaw(true); setAvanceOuvert(true) }')
    expect(src).toContain('label: expertMode ? "Replier les réglages avancés" : "Déplier les réglages avancés"')
  })
})
