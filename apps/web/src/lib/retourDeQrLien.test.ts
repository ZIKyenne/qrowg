import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { retourDeQrLien, lienQrLienDepuis } from "./retourDeQrLien"

// Audit du 14 novembre 2026 (C) : « Créer un QR » depuis la liste, puis « Retour » → tableau de bord.
describe("Retour de /dashboard/qr-link", () => {
  it("revient à la liste d'origine", () => {
    const url = new URL(lienQrLienDepuis("qr-codes"), "https://x")
    expect(retourDeQrLien(url.searchParams.get("depuis"))).toEqual({ href: "/dashboard/qr-codes", label: "Retour aux QR de pages" })
  })
  it("accès direct ou valeur inconnue : destination nommée", () => {
    expect(retourDeQrLien(null)).toEqual({ href: "/dashboard", label: "Tableau de bord" })
    expect(retourDeQrLien("https://evil")).toEqual({ href: "/dashboard", label: "Tableau de bord" })
    expect(retourDeQrLien("toString")).toEqual({ href: "/dashboard", label: "Tableau de bord" })
  })
  it("les deux écrans sont câblés", () => {
    const lien = readFileSync(join(__dirname, "../app/dashboard/qr-link/page.tsx"), "utf8")
    expect(lien).toContain("<PageHeader back={retour}")
    const liste = readFileSync(join(__dirname, "../app/dashboard/qr-codes/page.tsx"), "utf8")
    expect(liste).toContain('lienQrLienDepuis("qr-codes")')
  })
})

// Audit C : « Télécharger le PDF » ouvrait en fait la boîte d'impression du navigateur.
describe("le bouton d'export de l'atelier dit ce qu'il fait", () => {
  it("il imprime (window.print) : il ne se dit plus « Télécharger »", () => {
    const src = readFileSync(join(__dirname, "../app/dashboard/print-studio/PrintStudioClient.tsx"), "utf8")
    expect(src).toContain("window.print()")
    expect(src).not.toContain("Télécharger le PDF prêt à imprimer")
    expect(src).toContain("Imprimer ou enregistrer en PDF")
  })
})
