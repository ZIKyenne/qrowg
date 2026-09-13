import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { buildOptions } from "./dashboard/qr-codes/qrRender"
import { modulesPourCharge, silenceObtenu, margePx, MODULES_SILENCE } from "./dashboard/qr-codes/margeQr"
import { TOLERANCE_MARGE } from "./outils/testeur-qr-code/diagnostic"

// Relevé du 13 septembre. QRowg publie un testeur de QR code
// (/outils/testeur-qr-code) qui écrit : « La norme demande quatre modules ».
// Son propre générateur comptait pourtant en PIXELS — `margin: 10` par défaut,
// réglable de 0 à 30 px. Mesuré sur les charges réelles du produit :
//
//     400 px,  marge 10 px (défaut)  → 0,66 à 0,97 module
//     400 px,  marge 30 px (maximum) → 2,2 à 3,3 modules
//     1000 px, marge 10 px           → 0,26 à 0,38 module
//
// Le produit ne pouvait produire AUCUN code conforme, pas même en poussant le
// curseur à fond — et plus on exportait grand, pire c'était. Passé dans le
// testeur de QRowg lui-même, l'export par défaut ressortait « risque · La marge
// blanche est trop courte », et l'export en 1000 px « bloquant ».

const CHARGES = [
  "https://qrowg.com/r/ab12cd",
  "https://qrowg.com/p/bistrot-le-moulin",
  "https://carte.bistrot-horizon.fr/menu-du-jour?utm_source=sticker",
]
const TAILLES = [200, 400, 512, 1000, 2048]

const base = (data: string, size: number, style: any = {}) => ({
  data, fg: "#080808", bg: "#FFFFFF", ecc: "M" as const, size,
  style: { dotStyle: "square", gradient: "none", ...style },
})

describe("ce que QRowg exporte passe le contrôle de QRowg", () => {
  it("quatre modules de silence, sur toutes les charges et toutes les tailles", () => {
    const fautes: string[] = []
    for (const c of CHARGES) for (const t of TAILLES) {
      const o = buildOptions(base(c, t) as any)
      const s = silenceObtenu(t, o.margin, modulesPourCharge(c, "M"))
      if (s < MODULES_SILENCE - 0.05) fautes.push(`${c} @${t} → ${s} module`)
    }
    expect(fautes, fautes.join(" · ")).toEqual([])
  })
  it("le verdict du testeur public, appliqué à notre propre export : « bon »", () => {
    // Le testeur classe « bon » à partir de 4 modules, tolérance comprise.
    for (const c of CHARGES) for (const t of TAILLES) {
      const o = buildOptions(base(c, t) as any)
      const mesure = silenceObtenu(t, o.margin, modulesPourCharge(c, "M"))
      expect(mesure + TOLERANCE_MARGE, `${c} @${t}`).toBeGreaterThanOrEqual(4)
    }
  })
  it("l'ancien réglage échouait à ce même contrôle — c'est le sens du lot", () => {
    const n = modulesPourCharge(CHARGES[1], "M")
    expect(silenceObtenu(400, 10, n) + TOLERANCE_MARGE).toBeLessThan(4)   // « risque »
    expect(silenceObtenu(1000, 10, n) + TOLERANCE_MARGE).toBeLessThan(1)  // « bloquant »
    expect(silenceObtenu(400, 30, n) + TOLERANCE_MARGE).toBeLessThan(4)   // même au maximum
  })
  it("agrandir l'export ne dégrade plus la marge", () => {
    const n = modulesPourCharge(CHARGES[2], "M")
    const petit = silenceObtenu(200, margePx(200, n), n)
    const grand = silenceObtenu(2048, margePx(2048, n), n)
    expect(Math.abs(grand - petit)).toBeLessThan(0.1)
  })
})

describe("la marge ne se règle plus en pixels", () => {
  const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
  it("le renderer calcule la marge, il ne la lit plus telle quelle", () => {
    const r = lire("dashboard/qr-codes/qrRender.ts")
    expect(r).not.toContain("const margin = o.style.margin ?? 10")
    expect(r).toContain("margePourCharge(size, o.data")
  })
  it("l'écran propose des modules, pas des pixels", () => {
    const q = lire("dashboard/qr-codes/QRStudio.tsx")
    expect(q).toContain('[["Normale · 4 modules",4],["Large · 6 modules",6]]')
    expect(q).not.toContain('[["Petit",8],["Grand",20]]')
  })
  it("le contrôle interne ne dit plus « 4 modules (10px) »", () => {
    // hors commentaire : le code ne l'affirme plus nulle part
    const d = lire("dashboard/qr-codes/diagnosticQr.ts")
    const code = d.split("\n").filter(l => !l.trim().startsWith("//")).join("\n")
    expect(code).not.toContain("minimum 4 modules (10px)")
    expect(d).toContain("la norme en demande ${MODULES_SILENCE}")
  })
  it("un réglage sous la norme est ramené à la norme", () => {
    const sous = buildOptions(base(CHARGES[0], 400, { silence: 1 }) as any)
    const norme = buildOptions(base(CHARGES[0], 400) as any)
    expect(sous.margin).toBe(norme.margin)
  })
  it("le type du style n'existe plus en double", () => {
    const q = lire("dashboard/qr-codes/QRStudio.tsx")
    expect(q).toContain('export type { QRStyleConfig } from "./qrRender"')
    expect(q).not.toMatch(/export type QRStyleConfig = \{/)
  })
})
