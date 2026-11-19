import { test, expect } from "@playwright/test"

// Lot fast-food 3 (19 nov.) : la Carte illustrée dans la langue du client.
// Banc /e2e-harness/carte-illustree?langues=1 (anglais + arabe).

const BANC = "/e2e-harness/carte-illustree?langues=1"

test.describe("un téléphone réglé en arabe", () => {
  test.use({ locale: "ar-MA" })
  test("la carte s'ouvre en arabe, de droite à gauche ; le non-traduit reste en français", async ({ page }) => {
    await page.goto(BANC, { waitUntil: "networkidle", timeout: 120_000 })
    const carte = page.locator("[data-carte-illustree]")
    await expect(carte).toHaveAttribute("lang", "ar")
    await expect(carte).toHaveAttribute("dir", "rtl")
    await expect(carte.getByText("سندويش يوناني")).toBeVisible()
    await expect(carte.getByText("Coca-Cola 33 cl")).toBeVisible()                 // non traduit
    await expect(carte.getByRole("button", { name: "العربية" })).toHaveAttribute("aria-pressed", "true")
  })
})

test.describe("un téléphone réglé en français", () => {
  test.use({ locale: "fr-FR" })
test("le client choisit sa langue, et elle est retenue", async ({ page }) => {
  await page.goto(BANC, { waitUntil: "networkidle", timeout: 120_000 })
  const carte = page.locator("[data-carte-illustree]")
  await expect(carte).toHaveAttribute("lang", "fr")                                 // téléphone en français
  const langues = carte.getByRole("group", { name: "Langue de la carte" })
  await expect(langues.getByRole("button")).toHaveText(["Français", "English", "العربية"])
  await langues.getByRole("button", { name: "English" }).click()
  await expect(carte).toHaveAttribute("lang", "en")
  await expect(carte.getByText("Greek sandwich")).toBeVisible()
  await expect(carte.getByRole("searchbox", { name: "Search the menu…" })).toBeVisible()
  await expect(carte.getByText("Best seller").first()).toBeVisible()               // badge traduit
  // La fiche parle anglais aussi.
  await carte.locator('[data-produit="1"]').click()
  const fiche = page.getByRole("dialog", { name: "Greek sandwich" })
  await expect(fiche.getByText("Extras")).toBeVisible()
  await fiche.getByRole("button", { name: "Close" }).click()
  // Retenue au rechargement.
  await page.reload({ waitUntil: "networkidle" })
  await expect(page.locator("[data-carte-illustree]")).toHaveAttribute("lang", "en")
})
})

test("sans traduction collée, aucun choix de langue n'apparaît", async ({ page }) => {
  await page.goto("/e2e-harness/carte-illustree", { waitUntil: "networkidle", timeout: 120_000 })
  await expect(page.getByRole("group", { name: "Langue de la carte" })).toHaveCount(0)
})

test("l'éditeur : cocher une langue, coller, et le compte suit", async ({ page }) => {
  await page.goto("/e2e-harness/menu-editor?type=carte_illustree", { waitUntil: "networkidle", timeout: 120_000 })
  // Une carte de deux produits, collée depuis un tableur.
  await expect(async () => {
    await page.getByRole("button", { name: /Importer depuis un tableur/ }).click()
    await expect(page.getByLabel("Menu collé depuis un tableur")).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })
  await page.getByLabel("Menu collé depuis un tableur").fill("Sandwich grec\t8,50 €\t\tSandwiches\nFrites\t3 €\t\tAccompagnements")
  await page.getByRole("button", { name: "Ajouter les produits" }).click()

  const zone = page.locator("[data-traductions-carte]")
  await zone.getByRole("button", { name: "Anglais" }).click()
  await expect(zone.getByRole("button", { name: "Anglais" })).toHaveAttribute("aria-pressed", "true")
  await expect(zone.getByRole("status")).toHaveText("0 produit traduit sur 2")
  await zone.getByLabel("Traduction en anglais").fill("Sandwich grec ; Greek sandwich")
  await expect(zone.getByRole("status")).toHaveText("1 produit traduit sur 2")
  await expect(zone.getByText(/Restent en français : Frites/)).toBeVisible()
})
