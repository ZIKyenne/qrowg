import { describe, it, expect } from "vitest"
import { bornesCurseur, distanceLisible, distanceLisibleMm, MM_MIN_SCANNABLE } from "./tailleQrImprimable"
import { ITEMS } from "./catalog"
import { partQrMax } from "./ajustement"

describe("un plancher est un plancher", () => {
  it("le cas relevé : la carte de visite ne descend plus à 11,9 mm", () => {
    const carte: any = (ITEMS as any[]).find(i => i.name === "Carte de visite")
    const b = bornesCurseur(carte.qrMm, 0.9)
    expect(+(carte.qrMm * b.min).toFixed(1)).toBeGreaterThanOrEqual(MM_MIN_SCANNABLE)
  })
  it("aucun support du catalogue n'autorise un QR sous 20 mm", () => {
    const fautes: string[] = []
    for (const it of ITEMS as any[]) {
      const rond = it.shape === "round"
      for (const badge of ["aucune", "carre", "cercle"] as const) {
        for (const geant of [false, true]) {
          const qMax = partQrMax(rond, badge as any, rond ? 0.15 : 0.09, geant)
          const b = bornesCurseur(it.qrMm, qMax)
          if (b.troopetit) continue                 // signalé, pas autorisé en silence
          const mm = +(it.qrMm * b.min).toFixed(1)
          if (mm < MM_MIN_SCANNABLE) fautes.push(`${it.name} ${badge}${geant ? " géant" : ""} → ${mm} mm`)
        }
      }
    }
    expect(fautes, fautes.join(" · ")).toEqual([])
  })
  it("quand la mise en page ne peut pas tenir 20 mm, on le DIT au lieu de descendre", () => {
    const b = bornesCurseur(24, 0.5)               // 24 × 0,5 = 12 mm au mieux
    expect(b.troopetit).toBe(true)
    expect(b.min).toBe(b.max)                      // le curseur est épinglé
    expect(b.minMm).toBe(12)
  })
  it("le maximum reste celui de la mise en page : on n'invente pas de place", () => {
    const b = bornesCurseur(60, 0.86)
    expect(b.max).toBe(0.86)
    expect(b.troopetit).toBe(false)
    expect(b.minMm).toBe(MM_MIN_SCANNABLE)
  })
})

describe("la distance de lecture, dite plutôt que devinée", () => {
  it("la règle du métier : côté × 10", () => {
    expect(distanceLisibleMm(20)).toBe(200)
    expect(distanceLisibleMm(60)).toBe(600)
    expect(distanceLisibleMm(0)).toBe(0)
  })
  it("elle se lit en centimètres, puis en mètres", () => {
    expect(distanceLisible(20)).toBe("environ 20 cm")
    expect(distanceLisible(60)).toBe("environ 60 cm")
    expect(distanceLisible(150)).toBe("environ 1,5 m")
    expect(distanceLisible(200)).toBe("environ 2 m")
  })
})
