import { test, expect } from "@playwright/test"

// QA navigateur de « Mes pages » (audit du 14 novembre, C1/C2), sur le banc
// d'essai à données fictives — l'écran réel exige une session et une base.

test.describe("Mes pages", () => {
  test("liste les projets, actions selon l'état, filtres et recherche", async ({ page }, info) => {
    await page.goto("/e2e-harness/mes-pages")
    await expect(page.getByRole("heading", { level: 1, name: "Mes pages" })).toBeVisible()

    const lignes = page.locator("section[aria-label='Liste de mes pages'] li")
    await expect(lignes).toHaveCount(3)

    // En ligne : Modifier, Ouvrir, Partager, QR, Stats, Imprimer.
    // Téléphone : deux gestes visibles, le reste sous « Plus » (relevé du 16 nov.).
    const bar = lignes.filter({ hasText: "Carte du bar (démo)" })
    if (info.project.name === "mobile") {
      await expect(bar.getByRole("link", { name: /^Stats — / })).toHaveCount(0)
      await expect(bar.getByRole("link", { name: /^Modifier — / })).toBeVisible()
      await expect(bar.getByRole("link", { name: /^Ouvrir — / })).toBeVisible()
      const plus = bar.getByRole("button", { name: /^Plus d'actions — / })
      await expect(plus).toHaveAttribute("aria-expanded", "false")
      await page.screenshot({ path: `test-results/mes-pages-replie.png` })
      await plus.click()
      await expect(bar.getByRole("button", { name: /^Moins d'actions — / })).toHaveAttribute("aria-expanded", "true")
    }
    for (const n of ["Modifier", "Ouvrir", "Partager", "QR", "Stats", "Imprimer"]) {
      await expect(bar.getByRole(n === "Partager" ? "button" : "link", { name: new RegExp(`^${n} — `) })).toBeVisible()
    }
    await expect(bar.getByRole("link", { name: /^Imprimer — / })).toHaveAttribute("href", "/dashboard/print-studio?qr=demo01")
    await expect(bar.getByRole("link", { name: /^Stats — / })).toHaveAttribute("href", "/dashboard/analytics?page=demo-1")

    // Brouillon : seulement Reprendre.
    const brouillon = lignes.filter({ hasText: "Menu du soir" })
    await expect(brouillon.getByRole("link")).toHaveCount(1)
    await expect(brouillon.getByRole("link", { name: /^Reprendre — / })).toBeVisible()
    await expect(brouillon.getByRole("button")).toHaveCount(0)

    // Les modèles restent atteignables depuis l'écran.
    await expect(page.getByRole("link", { name: "Partir d'un modèle" })).toHaveAttribute("href", "/dashboard/templates")

    // Pas de défilement horizontal.
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(deborde).toBe(false)
    await page.screenshot({ path: `test-results/mes-pages-${info.project.name}.png`, fullPage: true })

    // Filtres et recherche.
    await page.getByRole("button", { name: /^Brouillons/ }).click()
    await expect(lignes).toHaveCount(1)
    await page.getByRole("button", { name: /^Toutes/ }).click()
    await page.getByRole("searchbox", { name: "Rechercher une page" }).fill("avis")
    await expect(lignes).toHaveCount(1)
    await expect(lignes.first()).toContainText("Avis Google")
    await page.getByRole("searchbox", { name: "Rechercher une page" }).fill("zzz")
    await expect(page.getByRole("status")).toContainText("Aucune page ne correspond.")
  })

  test("compte vide : une invitation à créer, pas une liste vide", async ({ page }) => {
    await page.goto("/e2e-harness/mes-pages?vide=1")
    await expect(page.getByText("Aucune page pour l'instant")).toBeVisible()
    await expect(page.getByRole("link", { name: "Créer ma première page" })).toHaveAttribute("href", "/dashboard/onboarding")
  })
})
