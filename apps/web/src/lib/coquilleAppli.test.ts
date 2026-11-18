import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { positionEnArrivant, FENETRE_DU_RETOUR_MS } from "./coquilleAppli"

const lire = (p: string) => readFileSync(join(__dirname, "..", p), "utf8")

// Lot 1 « appli » (18 nov.) : retrouver sa place au retour, le titre dans la
// barre, le bouton retour qui ferme les couches, le toucher qui répond.
describe("revenir sur une liste retrouve l'endroit où on était", () => {
  it("au retour, la position notée est rendue", () => {
    expect(positionEnArrivant({ retourIlYAMs: 40, notee: 812.4 })).toBe(812)
  })
  it("une navigation ordinaire repart en haut, même si une position est notée", () => {
    expect(positionEnArrivant({ retourIlYAMs: null, notee: 812 })).toBe(0)
    // Un retour ancien (qui a fermé une feuille, il y a longtemps) ne compte pas.
    expect(positionEnArrivant({ retourIlYAMs: FENETRE_DU_RETOUR_MS + 1, notee: 812 })).toBe(0)
  })
  it("rien de noté : en haut", () => {
    expect(positionEnArrivant({ retourIlYAMs: 10, notee: undefined })).toBe(0)
    expect(positionEnArrivant({ retourIlYAMs: 10, notee: -5 })).toBe(0)
  })
})

describe("les briques sont branchées, pas seulement écrites (leçon du 5 octobre)", () => {
  const coquille = lire("app/dashboard/DashboardShell.tsx")
  it("la coquille retrouve le défilement et fait remonter le titre", () => {
    expect(coquille).toContain("useDefilementRetrouve(zoneRef, pathname)")
    expect(coquille).toContain("const titreSorti = useTitreSorti(zoneRef, pathname)")
    expect(coquille).toMatch(/<main ref=\{zoneRef\}/)
    expect(coquille).toContain('className="qd-titre-mobile"')
  })
  it("le CSS montre le titre à la place du logo, et le cache sinon", () => {
    const css = lire("app/globals.css")
    expect(css).toContain(".qd-head--titre .qd-brand-mobile { display: none; }")
    expect(css).toContain(".qd-head--titre .qd-titre-mobile { position: static; opacity: 1; transform: none; }")
  })
  it("les couches faites à la main se ferment au bouton retour", () => {
    expect(lire("lib/useFermetureModale.ts")).toContain("historiqueDesFeuilles().ouvrir(() => fermerRef.current())")
  })
  it("au toucher, le bouton s'enfonce et ne reste pas soulevé", () => {
    const css = lire("app/globals.css")
    const bloc = css.slice(css.indexOf("@media (hover: none) {"), css.indexOf("@media (hover: none) and (prefers-reduced-motion: reduce)"))
    expect(bloc).toContain(".da-btn-primary:hover")
    expect(bloc).toContain("transform: scale(.97)")
    expect(css, "et en douceur pour qui demande moins d'animation").toContain("@media (hover: none) and (prefers-reduced-motion: reduce)")
  })
})
