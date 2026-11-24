import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { taillesDeLecture, verdict, phraseDeRelecture, PIXELS_PAR_MODULE_DE_LOIN } from "./relectureQr"
import { qrScannability } from "../app/dashboard/qr-codes/qrScannability"
import { sansCommentaires } from "./codeSeul"

// Vague 3, point 3 (revue du 23 nov.) : la lisibilité mesurée, plus seulement estimée.

describe("la relecture par un décodeur", () => {
  it("deux lectures : le fichier, puis réduit à ~3 pixels par module (vu de loin)", () => {
    // 29 modules + 8 de zone silencieuse.
    expect(taillesDeLecture(1024, 29)).toEqual([1024, 37 * PIXELS_PAR_MODULE_DE_LOIN])
    expect(taillesDeLecture(4000, 29)[0]).toBe(1200)
    expect(taillesDeLecture(50, 29)).toEqual([111])
  })
  it("il faut EXACTEMENT l'adresse encodée, à chaque lecture", () => {
    const u = "https://qrowg.com/q/abc"
    expect(verdict([{ pixels: 1024, lu: u }, { pixels: 111, lu: u }], u)).toBe(true)
    expect(verdict([{ pixels: 1024, lu: u }, { pixels: 111, lu: null }], u)).toBe(false)
    expect(verdict([{ pixels: 1024, lu: "https://autre.fr" }], u)).toBe(false)
    expect(verdict([], u)).toBe(false)
  })
  it("la phrase dit si le QR ne passe qu'en grand", () => {
    expect(phraseDeRelecture({ ok: false, essais: [{ pixels: 1024, lu: "x" }, { pixels: 111, lu: null }] })).toMatch(/plus quand il est petit/)
    expect(phraseDeRelecture({ ok: false, essais: [{ pixels: 1024, lu: null }] })).toMatch(/n'arrive pas à lire ce fichier/)
  })
  it("les deux studios relisent avant de télécharger, et la promesse affichée est vraie", () => {
    const lire = (p: string) => sansCommentaires(readFileSync(join(__dirname, "../app/dashboard", p), "utf8"))
    const studio = lire("qr-codes/QRStudioZero.tsx")
    expect((studio.match(/await relu\(/g) ?? []).length).toBe(4)          // PNG, PNG transparent, SVG, PDF
    expect(studio).not.toContain("Lisibilité vérifiée automatiquement")
    const atelier = lire("print-studio/PrintStudioClient.tsx")
    expect(atelier).toContain("relireUnFichier(blob, qrValue,")
    // Vague 3, point 4 : le support entier aussi, avant la boîte d'impression (support seul ET planche).
    expect((atelier.match(/await qrReluAvantImpression\(\)/g) ?? []).length).toBe(2)
    // Et les couleurs qui virent à l'impression sont comptées (le calcul n'était pas relié).
    expect(atelier).not.toContain("cmykRiskyColors: null")
    expect(atelier).toContain("cmykRiskyColors: countOutOfGamut(")
  })
})

describe("la note de lisibilité voit enfin le dégradé, les yeux et le logo", () => {
  const BASE = { fg: "#111111", bg: "#FFFFFF", ecc: "M" as const }
  it("un dégradé est jugé sur sa couleur la plus pâle", () => {
    const sans = qrScannability(BASE)
    const pale = qrScannability({ ...BASE, gradient: "linear", fg2: "#D8D8D8" })
    expect(pale.contrast!).toBeLessThan(sans.contrast!)
    expect(pale.score).toBeLessThan(sans.score)
    // Sans dégradé, fg2 ne compte pas.
    expect(qrScannability({ ...BASE, gradient: "none", fg2: "#D8D8D8" }).score).toBe(sans.score)
  })
  it("des yeux presque couleur du fond coûtent cher", () => {
    const r = qrScannability({ ...BASE, eyeColor: "#EEEEEE", cornerColor: "#EEEEEE" })
    expect(r.score).toBeLessThanOrEqual(qrScannability(BASE).score - 30)
    expect(r.advices[0]).toMatch(/Les yeux du QR/)
    expect(qrScannability({ ...BASE, eyeColor: "#6B5212" }).score).toBeGreaterThan(r.score)   // un or foncé passe ; l’or #C9A84C sur blanc, non
  })
  it("un logo trop grand est signalé", () => {
    const h = { ...BASE, ecc: "H" as const, hasLogo: true }
    expect(qrScannability({ ...h, logoSize: 18 }).advices.join(" ")).not.toMatch(/Logo/)
    expect(qrScannability({ ...h, logoSize: 24 }).advices.join(" ")).toMatch(/Logo assez grand/)
    expect(qrScannability({ ...h, logoSize: 28 }).advices[0]).toMatch(/Logo trop grand/)
  })
})
