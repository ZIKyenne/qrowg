import { test, expect } from "@playwright/test"

// Garde (20 nov.) — la bibliothèque propose d'abord les blocs du métier de la
// page. Le métier se lit dans les blocs déjà posés (contexteDeLaPage) : une page
// neuve garde « Essentiels » ; dès qu'un menu est ajouté, l'onglet devient
// « Pour un resto » et Menu / Carte illustrée passent en tête.
// Éditeur que voient les clients (coquille redessinée éteinte), mode invité.

test("un menu posé : la bibliothèque parle resto", async ({ page }, ti) => {
  test.skip(ti.project.name !== "mobile", "bibliothèque au téléphone")
  test.setTimeout(150_000)
  await page.addInitScript(() => {
    const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"
    document.addEventListener("DOMContentLoaded", () => document.documentElement.appendChild(s))
  })
  await page.goto("/dashboard/builder/new?builderRedesign=0", { waitUntil: "networkidle", timeout: 120_000 })
  await expect(page.locator("[data-block-id]").nth(2)).toBeVisible({ timeout: 30_000 })
  const passer = page.getByRole("button", { name: "Passer" })
  if (await passer.isVisible().catch(() => false)) await passer.click()

  await page.getByRole("button", { name: /^Blocs$/ }).click()
  const rangee = page.locator(".biblio-rangee")
  await expect(rangee.locator(":scope > button").first()).toHaveText(/Essentiels/)

  await page.getByPlaceholder("Rechercher un bloc...").fill("menu")
  await page.getByText("Menu / Carte", { exact: true }).filter({ visible: true }).first().click()

  await page.getByRole("button", { name: /^Blocs$/ }).click()
  await page.getByPlaceholder("Rechercher un bloc...").fill("")
  const onglet = rangee.locator(":scope > button").first()
  await expect(onglet).toHaveText(/Pour un resto/)
  await onglet.click()
  const libelles = await page.getByText(/^(Menu \/ Carte|Carte illustrée|Profil.*)$/).filter({ visible: true }).allTextContents()
  expect(libelles[0], "le menu n'est pas en tête").toBe("Menu / Carte")
  expect(libelles[1]).toBe("Carte illustrée")
})
