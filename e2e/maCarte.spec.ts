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

  test("mode Prix : « 11 » devient « 11 € », enregistré à la validation", async ({ page }, info) => {
    await page.goto("/e2e-harness/ma-carte")
    await page.getByRole("button", { name: "Prix", exact: true }).click()
    await expect(page.getByRole("button", { name: "Prix", exact: true })).toHaveAttribute("aria-pressed", "true")
    const champ = page.getByRole("textbox", { name: "Prix de Mojito (démo)" })
    await expect(champ).toHaveValue("9 €")
    await expect(champ).toHaveAttribute("inputmode", "decimal")
    await champ.fill("11")
    await champ.press("Enter")
    await expect(champ).toHaveValue("11 €")
    // De retour en Disponibilité, la ligne affiche le nouveau prix.
    await page.screenshot({ path: `test-results/ma-carte-prix-${info.project.name}.png`, fullPage: true })
    await page.getByRole("button", { name: "Disponibilité" }).click()
    await expect(page.getByRole("switch", { name: "Mojito (démo) en vente" })).toContainText("11 €")
  })

  test("mode Prix : un refus du serveur rétablit l'ancien prix", async ({ page }) => {
    await page.goto("/e2e-harness/ma-carte?refus=1")
    await page.getByRole("button", { name: "Prix", exact: true }).click()
    const champ = page.getByRole("textbox", { name: "Prix de Mojito (démo)" })
    await champ.fill("12")
    await champ.press("Enter")
    await expect(page.getByText("Le serveur a refusé (banc d'essai).")).toBeVisible()
    await expect(champ).toHaveValue("9 €")
  })

  test("sans carte : on dit comment en ajouter une", async ({ page }) => {
    await page.goto("/e2e-harness/ma-carte?vide=1")
    await expect(page.getByText("Cette page n'a pas encore de carte")).toBeVisible()
  })

  test("côté client qui scanne : le produit épuisé reste, barré, avec la mention", async ({ page }, info) => {
    // L'identité d'un produit = « nom · description » (homonymes du Red Fish).
    await page.goto("/e2e-harness/public-page?t=resto_bistrot&epuise=" + encodeURIComponent("Foie gras poêlé · Chutney de figues, brioche toastée"))
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

test("accueil : « Ma carte » sur la page qui a une carte, et seulement elle", async ({ page }, info) => {
  await page.goto("/e2e-harness/accueil")
  const lien = page.getByRole("link", { name: "Ma carte — Carte restaurant (démo)" })
  await expect(lien).toBeVisible()
  await expect(lien).toHaveAttribute("href", "/dashboard/pages/demo-page-1/carte")
  await expect(page.getByRole("link", { name: /^Ma carte — Avis Google/ })).toHaveCount(0)
  // Sur téléphone, le lien passe sous le nom une fois la largeur connue : on
  // vise l'état final, pas l'élément du premier rendu.
  await expect(page.getByRole("link", { name: "Ma carte — Carte restaurant (démo)" })).toBeVisible()
  await page.screenshot({ path: `test-results/accueil-ma-carte-${info.project.name}.png`, fullPage: true })
})
