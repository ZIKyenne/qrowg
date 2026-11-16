import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Pilotage (audit F) : écran interne, lu avec la clé de service. Deux promesses.
const page = readFileSync(join(__dirname, "page.tsx"), "utf8")

describe("l'écran de pilotage", () => {
  it("est fermé : administrateur exigé, refus indistinct d'une adresse inexistante", () => {
    expect(page).toContain("estAdministrateur(user.email)")
    expect(page).toContain("notFound()")
    expect(page).toContain('redirect("/auth/login")')
    // La garde passe AVANT toute lecture service-role.
    expect(page.indexOf("notFound()")).toBeLessThan(page.indexOf("createAdminClient()"))
  })
  it("ne lit ni ne transmet d'adresse ni de nom", () => {
    const selects = [...page.matchAll(/\.select\("([^"]+)"\)/g)].map(m => m[1]).join(",")
    expect(selects).not.toMatch(/email|full_name|phone/)
  })
  it("une base qui ne répond pas n'affiche pas des zéros", () => {
    expect(page).toContain("pilotage={null} erreur=")
  })
})
