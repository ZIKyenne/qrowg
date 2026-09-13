import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { bornesCurseur, distanceLisible, MM_MIN_SCANNABLE } from "./dashboard/print-studio/tailleQrImprimable"
import { ITEMS } from "./dashboard/print-studio/catalog"
import { partQrMax } from "./dashboard/print-studio/ajustement"

// Relevé du 13 septembre. L'atelier d'impression portait ce commentaire :
// « Sert au rendu ET au contrôle (guard ≥ 20 mm honnête). » La borne basse du
// curseur était pourtant :
//
//     Math.min(qMax * 0.55, Math.max(0.55, Math.min(0.95, 20 / item.qrMm)))
//
// Un `Math.min` entre le plancher et 55 % du maximum de la mise en page : dès
// que la mise en page serre, le plancher tombe. Mesuré sur les 16 supports du
// catalogue, toutes pastilles et mises en page confondues :
//
//     63 combinaisons atteignables sous 20 mm — la pire à 5,4 mm.
//
// Cinq millimètres et demi, sur un sticker que le commerçant fait imprimer et
// colle sur sa vitrine. Il n'a aucun moyen de le savoir avant d'avoir payé.

const src = readFileSync(join(__dirname, "dashboard/print-studio/PrintStudioClient.tsx"), "utf8")

describe("aucun support ne peut produire un QR illisible", () => {
  it("le catalogue entier, toutes pastilles et mises en page", () => {
    const fautes: string[] = []
    for (const it of ITEMS as any[]) {
      const rond = it.shape === "round"
      for (const badge of ["aucune", "carre", "cercle"] as const) {
        for (const geant of [false, true]) {
          const qMax = partQrMax(rond, badge as any, rond ? 0.15 : 0.09, geant)
          const b = bornesCurseur(it.qrMm, qMax)
          if (b.troopetit) continue          // annoncé à l'écran, jamais autorisé en silence
          const mm = +(it.qrMm * b.min).toFixed(1)
          if (mm < MM_MIN_SCANNABLE) fautes.push(`${it.name} · ${badge}${geant ? " · géant" : ""} → ${mm} mm`)
        }
      }
    }
    expect(fautes, fautes.join(" · ")).toEqual([])
  })
  it("l'ancienne expression a disparu des deux curseurs", () => {
    expect(src).not.toContain("Math.min(qMax * 0.55")
    expect((src.match(/const bornes = bornesCurseur\(item\.qrMm, qMax\)/g) ?? []).length).toBe(2)
    expect((src.match(/const qMin = bornes\.min/g) ?? []).length).toBe(2)
  })
  it("quand la mise en page ne tient pas 20 mm, l'écran le dit", () => {
    expect((src.match(/\{bornes\.troopetit &&/g) ?? []).length).toBe(2)
    expect(src).toContain("il en faut {MM_MIN_SCANNABLE} pour qu'il se scanne")
    // et le curseur est épinglé, pas laissé libre
    const b = bornesCurseur(24, 0.4)
    expect(b.min).toBe(b.max)
    expect(b.troopetit).toBe(true)
  })
})

describe("la distance de lecture est dite, pas devinée", () => {
  it("elle vient de la taille réelle, sur les deux curseurs", () => {
    expect((src.match(/distanceLisible\(item\.qrMm \* size\.factor \* qrScale\)/g) ?? []).length).toBe(2)
  })
  it("règle du métier : côté × 10", () => {
    expect(distanceLisible(20)).toBe("environ 20 cm")
    expect(distanceLisible(60)).toBe("environ 60 cm")
    expect(distanceLisible(200)).toBe("environ 2 m")
  })
  it("un QR de vitrine lu à deux mètres demande 200 mm — le chiffre le dit", () => {
    const vitrine: any = (ITEMS as any[]).find(i => i.place === "Vitrine")
    expect(vitrine).toBeTruthy()
    expect(distanceLisible(vitrine.qrMm)).toMatch(/cm|m$/)
  })
})
