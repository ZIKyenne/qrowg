import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { PageEnPause } from "./PageEnPause"
import { contraste, CONTRASTE_MIN } from "../dashboard/builder/couleurLisible"
import { sansCommentaires } from "@/lib/codeSeul"

// U4 (revue du 23 nov.) : l'écran de pause écrivait en ivoire fixe. Sur un thème
// clair (ivoire, blanc, rose poudré), le client qui scanne voyait un écran vide.

const FONDS = ["#080808", "#FFFFFF", "#F5F0E8", "#FDF2F4", "#E2603F", "#1B2A4A", "#C9A84C", "#7A7A7A"]

describe("l'écran de pause se lit sur tous les fonds", () => {
  for (const fond of FONDS) {
    it(fond, () => {
      const html = renderToStaticMarkup(<PageEnPause fond={fond} titre="Chez Nénette" />)
      const couleurs = [...html.matchAll(/color:(#[0-9A-Fa-f]{6})/g)].map(m => m[1])
      expect(couleurs.length).toBe(3)
      for (const c of couleurs) expect(contraste(c, fond)!, `${c} sur ${fond}`).toBeGreaterThanOrEqual(CONTRASTE_MIN)
      // Le message principal n'est plus voilé.
      expect(html).not.toMatch(/opacity:0\.7[0-9]?[^0-9]/)
    })
  }
  it("plus aucune couleur de texte en dur", async () => {
    const src = (await import("node:fs")).readFileSync(new URL("./PageEnPause.tsx", import.meta.url), "utf8")
    expect(sansCommentaires(src)).not.toContain('"#F5F0E8"')
  })
})
