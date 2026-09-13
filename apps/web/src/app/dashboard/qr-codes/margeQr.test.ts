import { describe, it, expect } from "vitest"
import { createRequire } from "node:module"
import { margePx, margePourCharge, modulesPourCharge, modulesDeVersion, silenceObtenu, MODULES_SILENCE } from "./margeQr"

// L'encodeur réellement embarqué sert d'oracle : la table de capacités du module
// n'est pas recopiée de mémoire, elle est confrontée à lui.
const require_ = createRequire(import.meta.url)
let qr: any = null
try { qr = require_("qrcode-generator") } catch { try { qr = require_("../../../../../../node_modules/.pnpm/qrcode-generator@1.5.2/node_modules/qrcode-generator") } catch { qr = null } }

const CHARGES = [
  "https://qrowg.com/r/ab12cd",
  "https://qrowg.com/p/bistrot-le-moulin",
  "https://carte.bistrot-horizon.fr/menu-du-jour?utm_source=sticker",
]

describe("le nombre de modules est celui du vrai encodeur", () => {
  it.runIf(qr)("charges réelles du produit, à tous les niveaux de correction", () => {
    for (const c of CHARGES) {
      for (const ecc of ["L", "M", "Q", "H"] as const) {
        const q = qr(0, ecc); q.addData(c); q.make()
        expect(modulesPourCharge(c, ecc), `${c} · ${ecc}`).toBe(q.getModuleCount())
      }
    }
  })
  it("une version se lit en modules : 21, 25, 29…", () => {
    expect(modulesDeVersion(1)).toBe(21)
    expect(modulesDeVersion(2)).toBe(25)
    expect(modulesDeVersion(10)).toBe(57)
  })
  it("une charge vide ou démesurée ne fait rien exploser", () => {
    expect(modulesPourCharge("")).toBe(21)
    expect(modulesPourCharge("a".repeat(5000), "H")).toBe(modulesDeVersion(20))
  })
})

describe("la marge fait quatre modules — le cas relevé", () => {
  it("l'ancien réglage en pixels n'y arrivait jamais", () => {
    // 400 px, marge 10 px, lien de page : moins d'un module.
    const n = modulesPourCharge("https://qrowg.com/p/bistrot-le-moulin", "M")
    expect(silenceObtenu(400, 10, n)).toBeLessThan(1)
    // et le maximum du curseur, 30 px, restait sous la norme
    expect(silenceObtenu(400, 30, n)).toBeLessThan(MODULES_SILENCE)
    // pire encore en exportant plus grand : la marge est en pixels, les modules rétrécissent
    expect(silenceObtenu(1000, 10, n)).toBeLessThan(silenceObtenu(400, 10, n))
  })
  it("la nouvelle marge donne exactement quatre modules, quelle que soit la taille", () => {
    for (const c of CHARGES) {
      for (const taille of [200, 400, 1000, 2048]) {
        const n = modulesPourCharge(c, "M")
        const m = margePx(taille, n)
        expect(silenceObtenu(taille, m, n), `${c} @${taille}`).toBeGreaterThanOrEqual(MODULES_SILENCE - 0.05)
      }
    }
  })
  it("agrandir l'export ne dégrade plus la marge : elle suit l'image", () => {
    const n = modulesPourCharge(CHARGES[1], "M")
    const petit = silenceObtenu(400, margePx(400, n), n)
    const grand = silenceObtenu(2048, margePx(2048, n), n)
    expect(Math.abs(grand - petit)).toBeLessThan(0.1)
  })
  it("on peut demander plus de silence, jamais moins", () => {
    const n = modulesPourCharge(CHARGES[0], "M")
    expect(margePx(400, n, 6)).toBeGreaterThan(margePx(400, n, 4))
    expect(silenceObtenu(400, margePx(400, n, 6), n)).toBeGreaterThanOrEqual(6 - 0.05)
  })
  it("margePourCharge répond directement, sans passer par le compte de modules", () => {
    expect(margePourCharge(400, CHARGES[1], "M")).toBe(margePx(400, modulesPourCharge(CHARGES[1], "M")))
  })
})
