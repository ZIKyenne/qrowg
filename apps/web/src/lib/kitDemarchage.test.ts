import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { liensDuKit, EXEMPLE_PUBLIC } from "./kitDemarchage"
import { creerUrl } from "../app/creer/entry"

describe("les deux QR de la fiche comptoir", () => {
  it("exemple = le QR de votre page de démonstration (scan compté) ; inscription = votre code", () => {
    const l = liensDuKit("https://qrowg.com/", "emir369", { id: "p", title: "The Red Fish", slug: "the-red-fish", qr: "abc123" })
    expect(l).toEqual({ exemple: "https://qrowg.com/q/abc123", inscription: "https://qrowg.com/bars-et-restaurants?ref=emir369" })
  })
  it("page sans QR : son adresse ; sans page : l'exemple public ; code invalide : pas de ref", () => {
    expect(liensDuKit("https://qrowg.com", null, { id: "p", title: null, slug: "bar", qr: null }).exemple).toBe("https://qrowg.com/bar")
    expect(liensDuKit("https://qrowg.com", "x", null)).toEqual({ exemple: `https://qrowg.com${EXEMPLE_PUBLIC}`, inscription: "https://qrowg.com/bars-et-restaurants" })
  })
  it("le code suit jusqu'à l'inscription (creerUrl) depuis la page Bars & restaurants", () => {
    expect(creerUrl("bar", "emir369")).toBe("/creer?metier=Bar&ref=emir369")
    const page = readFileSync(join(__dirname, "../app/bars-et-restaurants/page.tsx"), "utf8")
    expect(page).toContain("cleanRefCode(ref)")
    expect(page).toContain('creerUrl("bar", code || null)')
    expect(page).toContain("robots: { index: false, follow: true }")
  })
})
