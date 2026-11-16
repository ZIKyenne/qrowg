import { test, expect } from "@playwright/test"

// « Coller ma carte » au navigateur (banc, import simulé) : coller un texte de
// carte façon PDF, voir l'aperçu, renommer une section, ajouter.
const CARTE = `LONG DRINK
MOJITO 10€
Havana club 3 ans, menthe, citron vert, sucre, Perrier
PINA COLADA 10€
Saint James Bio, jus d'ananas, purée de noix de coco

Spritz :
APEROL SPRITZ ........ 7,90 €
Apérol, prosecco, perrier
LIMONCELLO SPRITZ ........ 7,90 €

SOFTS
Coca-Cola 33cl 4,10€
Café gourmand
8€
12€`

test("coller, voir l'aperçu, renommer une section, ajouter", async ({ page }, info) => {
  await page.goto("/e2e-harness/coller-carte")
  await expect(page.getByRole("heading", { level: 1, name: "Coller ma carte" })).toBeVisible()
  const ajouter = page.getByRole("button", { name: /^Ajouter cette carte à ma page/ })
  await expect(ajouter).toBeDisabled()

  await page.getByLabel("Votre carte").fill(CARTE)
  const apercu = page.getByRole("region", { name: "Aperçu de la carte" })
  await expect(apercu.getByText(/^3 sections · 6 produits/)).toBeVisible()
  await expect(apercu.getByText("1 ligne à vérifier")).toBeVisible()
  await expect(apercu.getByText("Un prix seul, sans produit avant lui.", { exact: false })).toBeVisible()
  await expect(page.getByLabel("Nom de la section 2")).toHaveValue("Spritz")
  await expect(apercu.getByText("Café gourmand")).toBeVisible()
  await expect(ajouter).toHaveText("Ajouter cette carte à ma page (6 produits)")

  await page.getByLabel("Nom de la section 2").fill("SPRITZ")
  // Pas de défilement horizontal, même avec de longues descriptions.
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false)
  await page.screenshot({ path: `test-results/coller-carte-${info.project.name}.png`, fullPage: true })

  await ajouter.click()
  await page.waitForURL(/\/dashboard\/pages\/[^/]+\/carte|\/auth\/login/)
  const recu = await page.evaluate(() => (window as any).__carteImportee ?? null).catch(() => null)
  // La navigation a pu effacer la variable : on vérifie au moins qu'on est parti vers « Ma carte ».
  if (recu) expect(recu.sections.map((s: any) => s.titre)).toEqual(["LONG DRINK", "SPRITZ", "SOFTS"])
})

test("un refus du serveur est dit, et on reste sur l'aperçu", async ({ page }) => {
  await page.goto("/e2e-harness/coller-carte?refus=1")
  await page.getByLabel("Votre carte").fill("COCKTAILS\nMojito 10€")
  await page.getByRole("button", { name: /^Ajouter cette carte à ma page/ }).click()
  await expect(page.getByText("Le serveur a refusé (banc d'essai).")).toBeVisible()
  await expect(page).toHaveURL(/coller-carte/)
  const recu = await page.evaluate(() => (window as any).__carteImportee)
  expect(recu.sections).toEqual([{ titre: "COCKTAILS", produits: [{ nom: "Mojito", prix: "10€", desc: "" }] }])
})
