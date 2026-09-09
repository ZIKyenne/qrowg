import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Revue du 9 septembre (P0) — la carte de modèle était un `role="button"`
// contenant d'autres boutons : imbrication interdite par ARIA, clics qui se
// marchaient dessus (stopPropagation partout), aperçu qui ne s'ouvrait pas
// selon le point d'appui. Désormais : un <article> et trois vrais contrôles.

const src = readFileSync(join(__dirname, "page.tsx"), "utf8")
const carte = src.slice(src.indexOf('className="tpl-card"'), src.indexOf("</article>"))

describe("carte de modèle", () => {
  it("est un <article> nommé par son titre, pas un bouton", () => {
    expect(src).toContain('<article key={template.id}\n                  className="tpl-card"')
    expect(carte).toContain("aria-labelledby={`tpl-nom-${template.id}`}")
    expect(carte).toContain("<h2 id={`tpl-nom-${template.id}`}")
    expect(carte).not.toContain('role="button"')
    expect(carte).not.toContain("tabIndex=")
    expect(carte).not.toMatch(/<article[^>]*onClick/)
  })
  it("la vignette est un bouton « Aperçu » qui ouvre l'aperçu", () => {
    expect(carte).toContain('<button type="button" className="tpl-vignette" aria-label={`Aperçu de ${template.name}`}')
    expect(carte).toContain("onClick={() => setPreview(template.id)}\n                      style={{ display: \"block\", width: \"100%\"")
  })
  it("Favori et badge de plan sont des frères de la vignette, jamais dedans", () => {
    const finVignette = carte.indexOf("</button>")
    expect(finVignette).toBeGreaterThan(0)
    expect(carte.indexOf('className={`dat-fav')).toBeGreaterThan(finVignette)
    expect(carte.indexOf("Badge plan (haut gauche)")).toBeGreaterThan(finVignette)
    // Aucun bouton dans le bouton : entre l'ouverture de la vignette et sa fermeture, pas de <button ni de <a
    const corps = carte.slice(carte.indexOf('className="tpl-vignette"'), finVignette)
    expect(corps).not.toContain("<button")
    expect(corps).not.toContain("<a ")
  })
  it("Aperçu et Utiliser n'ont plus besoin de stopPropagation, ils ne sont plus dans un bouton", () => {
    expect(carte).toContain('<button type="button" onClick={() => setPreview(template.id)}\n                        className="da-btn-neutral da-btn-neutral--sm" aria-label={`Aperçu de ${template.name}`}')
    expect(carte).toContain('onClick={() => { if (locked) { router.push("/upgrade?reason=template"); return } setNamingFor(template.id) }}')
    expect(carte).not.toContain("e.stopPropagation(); setPreview")
    expect(carte).not.toContain("e.stopPropagation(); if (locked)")
  })
  it("un modèle verrouillé reste consultable : le voile est décoratif et n'est pas un contrôle", () => {
    expect(carte).toContain('{locked && (\n                        <span aria-hidden="true"')
    expect(carte).not.toContain("cursor: locked ? \"not-allowed\"")
  })
  it("le focus clavier de la vignette est dessiné (globals.css)", () => {
    const css = readFileSync(join(__dirname, "../../globals.css"), "utf8")
    expect(css).toContain(".tpl-vignette:focus-visible { outline:none; box-shadow:inset 0 0 0 3px")
  })
})
