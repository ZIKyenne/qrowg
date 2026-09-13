import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ITEMS } from "./dashboard/print-studio/catalog"
import { partQrMax, padPastilleCarree, padPastilleRonde, margeReelleMm, margeExigeeMm } from "./dashboard/print-studio/ajustement"
import { bornesCurseur } from "./dashboard/print-studio/tailleQrImprimable"
import { printPreflight } from "./dashboard/qr-codes/printPreflight"
import { modulesPourCharge, MODULES_SILENCE } from "./dashboard/qr-codes/margeQr"

// Relevé du 13 septembre, suite du lot v75 : la marge blanche de l'image exportée
// est réglée ; restait celle du SUPPORT IMPRIMÉ.
//
// La pastille laissait 2,8 % du côté du QR en blanc — un filet décidé à l'œil.
// La norme demande quatre modules, soit 4/n du côté : 13,8 % pour un code de
// 29 modules. Mesuré sur les 16 supports du catalogue :
//
//     Carte de visite  : 0,7 mm laissés,  3,3 mm exigés
//     Sticker vitrine  : 1,7 mm laissés,  8,3 mm exigés
//     Affiche A2       : 5,6 mm laissés, 27,6 mm exigés
//     Roll-up          : 6,2 mm laissés, 30,3 mm exigés
//
// Les seize étaient insuffisants, d'un facteur 4 à 5. Et le pré-vol les déclarait
// bons : il jugeait sur 4 MILLIMÈTRES fixes, là où la norme parle de MODULES.

const N = modulesPourCharge("https://qrowg.com/p/bistrot-le-moulin", "M")

describe("la marge de la pastille se compte en modules", () => {
  it("elle vaut quatre modules du côté du QR, plus un filet décidé à l'œil", () => {
    expect(padPastilleCarree(N)).toBeCloseTo(MODULES_SILENCE / N, 6)
    expect(padPastilleCarree(21)).toBeGreaterThan(padPastilleCarree(37))   // un petit code a besoin de plus, en proportion
    expect(padPastilleRonde(N)).toBeCloseTo((Math.SQRT2 - 1) / 2 + padPastilleCarree(N), 6)
  })
  it("sur les 16 supports, la marge laissée atteint enfin celle qu'exige la norme", () => {
    const fautes: string[] = []
    for (const i of ITEMS as any[]) {
      const reel = margeReelleMm("carre", i.qrMm, N)!
      const exige = margeExigeeMm(i.qrMm, N)
      if (reel < exige - 0.05) fautes.push(`${i.name} : ${reel} mm laissés pour ${exige} exigés`)
    }
    expect(fautes, fautes.join(" · ")).toEqual([])
  })
  it("l'ancien filet de 2,8 % n'y suffisait sur aucun support — c'est le sens du lot", () => {
    for (const i of ITEMS as any[]) {
      expect(0.028 * i.qrMm, i.name).toBeLessThan(margeExigeeMm(i.qrMm, N))
    }
  })
})

describe("le pré-vol juge en modules, plus en millimètres fixes", () => {
  const base = { contrastRatio: 12, logoPct: 0, dpi: 300, edgeMarginMm: 5, isScreen: false, cmykRiskyColors: null }
  it("un roll-up avec 5 mm de marge n'est plus déclaré bon", () => {
    const roll: any = (ITEMS as any[]).find(i => i.name === "Roll-up")
    const r = printPreflight({ ...base, qrSizeMm: roll.qrMm, qrModules: N, quietZoneMm: 5 } as any)
    const quiet = r.checks.find(c => c.id === "quiet")!
    expect(quiet.status).not.toBe("ok")
    expect(quiet.detail).toContain("quatre modules")
  })
  it("le même roll-up avec la marge exigée passe", () => {
    const roll: any = (ITEMS as any[]).find(i => i.name === "Roll-up")
    const r = printPreflight({ ...base, qrSizeMm: roll.qrMm, qrModules: N, quietZoneMm: margeExigeeMm(roll.qrMm, N) } as any)
    expect(r.checks.find(c => c.id === "quiet")!.status).toBe("ok")
  })
  it("une carte de visite n'exige pas autant qu'un roll-up : la règle suit le code", () => {
    expect(margeExigeeMm(24, N)).toBeLessThan(margeExigeeMm(220, N))
  })
})

describe("ce que la correction coûte, dit plutôt que caché", () => {
  it("les supports qui ne peuvent plus tenir 20 mm sont signalés, pas servis quand même", () => {
    let signales = 0, tenables = 0
    for (const i of ITEMS as any[]) {
      const rond = i.shape === "round"
      for (const badge of ["aucune", "carre", "cercle"] as const) {
        const b = bornesCurseur(i.qrMm, partQrMax(rond, badge as any, rond ? 0.15 : 0.09, false, N))
        if (b.troopetit) signales++; else tenables++
      }
    }
    // La mesure du lot : 35 combinaisons tenables, 13 signalées.
    expect(tenables).toBeGreaterThan(signales * 2)
    expect(signales).toBeGreaterThan(0)
  })
  it("aucune combinaison tenable ne descend sous 20 mm", () => {
    for (const i of ITEMS as any[]) {
      const rond = i.shape === "round"
      for (const badge of ["aucune", "carre", "cercle"] as const) {
        const b = bornesCurseur(i.qrMm, partQrMax(rond, badge as any, rond ? 0.15 : 0.09, false, N))
        if (b.troopetit) continue
        expect(+(i.qrMm * b.min).toFixed(1), `${i.name} ${badge}`).toBeGreaterThanOrEqual(20)
      }
    }
  })
})

describe("l'écran passe de vraies mesures au pré-vol", () => {
  const ps = readFileSync(join(__dirname, "dashboard/print-studio/PrintStudioClient.tsx"), "utf8")
  it("la marge n'est plus affirmée à 5 mm quoi qu'il arrive", () => {
    expect(ps).not.toContain('quietZoneMm: qrBadge === "aucune" ? (bgImage ? 1 : null) : 5,')
    expect(ps).toContain("margeReelleMm(qrBadge as Pastille, item.qrMm * effSize.factor, modulesDuCode)")
    expect(ps).toContain("qrModules: modulesDuCode,")
  })
  it("et le nombre de modules vient du code réellement encodé", () => {
    expect(ps).toContain('const modulesDuCode = modulesPourCharge(qrValue || "https://qrowg.com", "M")')
    expect((ps.match(/layout\.content === "qrbig", modulesDuCode\)/g) ?? []).length).toBe(2)
  })
})
