import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { prochaineEtape } from "./prochaineEtape"

// Relevé du 11 septembre, banc d'essai « retour » (/e2e-harness/accueil?debut=1) :
// une page publiée il y a trois jours, 3 scans, 4 vues. L'accueil conseillait
// « Créez une 2ᵉ page pour un autre usage » — parce que le conseil lisait
// pages.length, pas la situation. Ce test empêche le retour de ce raccourci.

const lire = (f: string) => readFileSync(join(__dirname, f), "utf8")
const client = lire("DashboardClient.tsx")
const banc = readFileSync(join(__dirname, "../e2e-harness/accueil/page.tsx"), "utf8")

describe("le conseil de l'accueil suit la situation, pas un compte d'objets", () => {
  it("il passe par prochaineEtape, et plus par pages.length === 1", () => {
    expect(client).toContain('import { prochaineEtape } from "./prochaineEtape"')
    expect(client).toContain("const etape = prochaineEtape({ pagesPubliees: publishedCount, pages: pages.length, scans: totalScans })")
    expect(client).not.toContain("const onePage = pages.length === 1")
  })
  it("les trois conseils existent, et « diffuser » mène au QR, pas à un nouveau modèle", () => {
    expect(client).toContain('const tip = etape === "diffuser"')
    expect(client).toContain("Votre page est en ligne : montrez son QR code à vos clients")
    expect(client).toContain('label: "Voir mon QR code", href: "/dashboard/qr-codes"')
    expect(client).toContain('etape === "elargir"')
    expect(client).toContain("Créez une 2ᵉ page pour un autre usage")
  })
  it("le cas relevé rend bien « diffuser », et le compte mûr garde « imprimer »", () => {
    expect(prochaineEtape({ pagesPubliees: 1, pages: 1, scans: 3 })).toBe("diffuser")
    expect(prochaineEtape({ pagesPubliees: 2, pages: 3, scans: 169 })).toBe("imprimer")
  })
})

describe("l'état « retour » est mesurable : le banc d'essai le monte", () => {
  it("?debut=1 donne une seule page publiée il y a trois jours, plan gratuit", () => {
    expect(banc).toContain('const jeune = debut === "1"')
    expect(banc).toContain('{ id: "demo-page-1", title: "Ma carte (démo)", slug: "ma-carte-demo", status: "published", total_views: 4, created_at: il_y_a(3) },')
    expect(banc).toContain('plan: "free", total_scans: 3, total_pages: 1')
    // et l'état mûr reste montable, pour vérifier qu'on n'a rien cassé pour lui
    expect(banc).toContain('total_scans: 169, total_pages: 3')
  })
})
