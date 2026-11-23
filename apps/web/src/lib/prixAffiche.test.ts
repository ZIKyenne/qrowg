import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { prixAffiche } from "./prixAffiche"
import { sansCommentaires } from "./codeSeul"
import { INSECABLE, FINE } from "./typographieFr"

// Vague 2 (revue du 23 nov.) : « 12.00€ » et « 20.00 » sans devise, sur une vraie
// carte en production. Un prix de carte s'affiche « 12,00 € ».

const N = INSECABLE, F = FINE

describe("un montant net s'affiche « 12,00 € »", () => {
  it("les relevés de production", () => {
    expect(prixAffiche("12.00€")).toBe(`12,00${N}€`)
    expect(prixAffiche("20.00")).toBe(`20,00${N}€`)
  })
  it("toutes les façons d'écrire un même prix donnent la même chose", () => {
    for (const v of ["12", "12 €", "12€", "12,00 €", "12.00", "12,0", " 12 EUR ", "12 euros", "012"])
      expect(prixAffiche(v), v).toBe(`12,00${N}€`)
    expect(prixAffiche("8,5")).toBe(`8,50${N}€`)
    expect(prixAffiche("8.50 €")).toBe(`8,50${N}€`)
    expect(prixAffiche("1250")).toBe(`1${F}250,00${N}€`)
  })
})

describe("tout le reste est rendu tel quel : on ne devine pas", () => {
  it.each([
    "Prix du marché", "5 / 9", "18 € (15 € le midi)", "+1 €", "+1,50 €", "$12", "12 CHF", "£8",
    "À partir de 9 €", "12,5,0", "12.345", "Offert",
  ])("%s", v => expect(prixAffiche(v)).toBe(v.trim()))
  it("vide ou absent : rien", () => {
    expect(prixAffiche("")).toBe("")
    expect(prixAffiche(undefined)).toBe("")
    expect(prixAffiche(12 as never)).toBe("")
  })
})

describe("les six affichages de prix de carte passent par prixAffiche", () => {
  const lire = (p: string) => sansCommentaires(readFileSync(join(__dirname, "../app/dashboard/builder/shared-renderer", p), "utf8"))
  it.each([
    ["primitives/MenuItemList.tsx", 2],
    ["blocks/carte_illustree/PublicCarteIllustree.tsx", 3],
    ["blocks/carte_boissons/index.tsx", 2],
    ["blocks/happy_hour/index.tsx", 2],
    ["blocks/plat_du_jour/index.tsx", 1],
  ] as const)("%s", (p, n) => {
    expect((lire(p).match(/prixAffiche\(/g) ?? []).length, p).toBe(n)
  })
})
