import { test, expect } from "@playwright/test"

// « Ma carte ce soir » au navigateur (banc à données fictives, actions simulées).
test.describe("Ma carte", () => {
  test("un toucher épuise, un autre remet en vente ; tout remettre en vente", async ({ page }, info) => {
    await page.goto("/e2e-harness/ma-carte")
    await expect(page.getByRole("heading", { level: 1, name: "Red Fish (démo)" })).toBeVisible()
    await expect(page.getByText("1 produit épuisé")).toBeVisible()

    const mojito = page.getByRole("switch", { name: "Mojito (démo) en vente" })
    await expect(mojito).toHaveAttribute("aria-checked", "true")
    await mojito.click()
    await expect(mojito).toHaveAttribute("aria-checked", "false")
    await expect(page.getByText("2 produits épuisés")).toBeVisible()

    // Les onglets de la grande carte deviennent des rubriques.
    await expect(page.getByRole("region", { name: "Boissons · Bières" })).toBeVisible()
    // Cibles au pouce : chaque ligne fait au moins 44 px.
    const h = await mojito.evaluate(e => e.getBoundingClientRect().height)
    expect(h).toBeGreaterThanOrEqual(44)
    // Pas de défilement horizontal.
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false)
    await page.screenshot({ path: `test-results/ma-carte-${info.project.name}.png`, fullPage: true })

    await page.getByRole("button", { name: "Tout remettre en vente" }).first().click()
    await page.getByRole("dialog").getByRole("button", { name: "Tout remettre en vente" }).click()
    await expect(page.getByText(/^Tout est en vente/)).toBeVisible()
    await expect(page.getByRole("switch", { name: "Spritz (démo) en vente" })).toHaveAttribute("aria-checked", "true")
  })

  test("si le serveur refuse, la ligne revient et on le dit", async ({ page }) => {
    await page.goto("/e2e-harness/ma-carte?refus=1")
    const mojito = page.getByRole("switch", { name: "Mojito (démo) en vente" })
    await mojito.click()
    await expect(page.getByText("Le serveur a refusé (banc d'essai).")).toBeVisible()
    await expect(mojito).toHaveAttribute("aria-checked", "true")
  })

  test("sans carte : on dit comment en ajouter une", async ({ page }) => {
    await page.goto("/e2e-harness/ma-carte?vide=1")
    await expect(page.getByText("Cette page n'a pas encore de carte")).toBeVisible()
  })

  test("côté client qui scanne : le produit épuisé reste, barré, avec la mention", async ({ page }, info) => {
    await page.goto("/e2e-harness/public-page?t=resto_bistrot&epuise=" + encodeURIComponent("Foie gras poêlé"))
    const ligne = page.getByText("Foie gras poêlé", { exact: true }).first()
    await ligne.scrollIntoViewIfNeeded()
    await expect(ligne).toBeVisible()
    await expect(ligne).toHaveCSS("text-decoration-line", "line-through")
    await expect(page.getByText("Épuisé", { exact: true }).first()).toBeVisible()
    await ligne.screenshot({ path: `test-results/ma-carte-public-${info.project.name}.png` }).catch(() => {})
    await page.locator("text=Foie gras poêlé").first().evaluate(e => e.closest("div")?.scrollIntoView({ block: "center" }))
    await page.screenshot({ path: `test-results/ma-carte-public-page-${info.project.name}.png` })
  })
})

// MobileSheet : le `history.back()` qu'une feuille déclenche en se fermant
// arrivait après l'ouverture de la suivante et la refermait (16 novembre).
test("téléphone : rouvrir aussitôt une fenêtre fermée, et le vrai retour ferme toujours", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "feuille mobile")
  await page.goto("/e2e-harness/ma-carte")
  const ouvrir = page.getByRole("button", { name: "Tout remettre en vente" }).first()
  const fenetre = page.getByRole("dialog", { name: "Tout remettre en vente ?" })
  await ouvrir.click()
  await expect(fenetre).toBeVisible()
  // Au clavier : en développement, le badge de Next couvre le coin bas-gauche.
  await fenetre.getByRole("button", { name: "Annuler" }).press("Enter")
  await expect(fenetre).toBeHidden()
  await ouvrir.click()                       // aussitôt
  await page.waitForTimeout(400)             // le retour interne a eu le temps d'arriver
  await expect(fenetre).toBeVisible()
  await page.goBack()                        // le VRAI bouton retour
  await expect(fenetre).toBeHidden()
  await expect(page).toHaveURL(/ma-carte/)   // on ferme, on ne quitte pas l'écran
})
