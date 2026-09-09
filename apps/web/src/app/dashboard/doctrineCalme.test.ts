import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

// 9 septembre — la doctrine « Calme », vérifiée sur TOUTE la chrome du tableau
// de bord (hors rendu des pages publiées, données, logo) :
//   · pas de police d'affichage déclarée à part (Fraunces) ni de graisse 800 ;
//   · pas d'encre ni de surface écrite en hex ancien dans une ligne de style ;
//   · pas de halo flou animé (filter blur + animation) ;
//   · les animations perpétuelles se limitent aux états système (chargement,
//     « en direct », squelettes) et aux animations que l'utilisateur choisit
//     pour SA page (thème animé, séquence de scan du paiement).

const SRC = join(__dirname, "..")
const HORS = ["shared-renderer", "/blocks/", "[slug]", "builderPreview", "renduLegacy", "TemplatePreviewModal", "TemplateComposer", ".test.", "editorPresets", "page-templates", "QrowgLogo", "IntroOverlay", "Particles", "AvatarStudio", "BannerStudio", "/avatar/", "presetsQr", "stylesQr", "catalog", "mockup", "templates.ts", "supportsImprimables", "printSupports", "themes.ts", "typesProfil"]

function fichiers(dir: string): string[] {
  const out: string[] = []
  for (const e of readdirSync(dir).sort()) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) out.push(...fichiers(p))
    else if (p.endsWith(".tsx") && !HORS.some(h => p.includes(h))) out.push(p)
  }
  return out
}
const CHROME = [...fichiers(join(SRC, "dashboard")), ...fichiers(join(SRC, "..", "components")), ...fichiers(join(SRC, "upgrade"))]
const DONNEES = /\b(name|bg|primary|accent|fg|surface|hex|value|defaultValue)\s*[:=]|\|\|\s*"/
const HEX_ANCIENS = /#(?:F5F0E8|F8F4EC|F4EFE6|E8E3DA|C9C3B6|A8A190|8A8478|8A8177|B8B1A6|6B6258|5C554B|080808|0A0A0A|111009|0F0E0B|141210|100E0C|221F1B)\b/i
const LOOPS_ADMISES = /mo-spin|mo-pulse|qfspin|spin |rotate\(360|gradientShift|auroraShift|sb-|scanLine|kpi|live\.active|ring 1\.6s/

describe("doctrine « Calme » — chrome du tableau de bord", () => {
  it("couvre un vrai périmètre", () => { expect(CHROME.length).toBeGreaterThan(80) })

  for (const f of CHROME) {
    const nom = relative(SRC, f)
    const lignes = readFileSync(f, "utf8").split("\n")
    it(`${nom}`, () => {
      const fautes: string[] = []
      lignes.forEach((l, i) => {
        if (/fontFamily:\s*"Fraunces/.test(l)) fautes.push(`${i + 1}: Fraunces`)
        if (/fontWeight:\s*800\b/.test(l)) fautes.push(`${i + 1}: graisse 800`)
        if ((l.includes("style={{") || l.includes("CSSProperties")) && !DONNEES.test(l) && HEX_ANCIENS.test(l)) fautes.push(`${i + 1}: hex ancien ${l.match(HEX_ANCIENS)![0]}`)
        if (/filter:\s*"blur\(/.test(l) && /animation:/.test(l)) fautes.push(`${i + 1}: halo flou animé`)
        if (/infinite/.test(l) && !LOOPS_ADMISES.test(l)) fautes.push(`${i + 1}: animation perpétuelle`)
      })
      expect(fautes).toEqual([])
    })
  }
})
