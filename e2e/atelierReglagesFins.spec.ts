import { test, expect } from "@playwright/test"

// Atelier d'impression — relevé iPhone du 16 nov. :
//  · le bouton d'appel (« M'écrire ») était impossible à retirer ;
//  · on ne pouvait choisir qu'une couleur PROPOSÉE (fond et accent) ;
//  · le QR flottait dans un carré blanc deux fois trop grand : la pastille
//    ajoutait sa marge à celle que le QR porte déjà (4 modules).

const fixer = (sel: string, valeur: string) => async (page: import("@playwright/test").Page, n: number) =>
  page.locator(sel).nth(n).evaluate((i: HTMLInputElement, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(i, v)
    i.dispatchEvent(new Event("input", { bubbles: true }))
  }, valeur)

test.beforeEach(async ({ page }) => {
  await page.goto("/e2e-harness/print-studio?item=i4")
  await page.getByRole("button", { name: "Modèles" }).click()
  await page.getByRole("button", { name: /Contact · Clair/ }).first().click()
  await expect(page.getByText("M'écrire").first()).toBeVisible()
})

test("le bouton d'appel se retire depuis son champ", async ({ page }, info) => {
  if (info.project.name === "mobile") await page.getByRole("button", { name: "Texte", exact: true }).click()
  else await page.getByRole("tab", { name: /Contenu/ }).click()
  await page.getByRole("button", { name: "Sans bouton" }).first().click()
  await expect(page.getByText("M'écrire")).toHaveCount(0)
  await expect(page.getByRole("textbox", { name: "Texte du bouton" })).toHaveCount(0)
  await page.getByRole("button", { name: "Avec bouton" }).first().click()
  await expect(page.getByText("M'écrire").first()).toBeVisible()
})

test("couleur précise : fond et accent au nuancier, texte lisible", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "nuancier de la feuille téléphone")
  await page.getByRole("button", { name: "Couleurs" }).click()
  await fixer('input[type="color"]', "#1f3a2e")(page, 1)
  await expect(page.getByText("#1f3a2e")).toBeVisible()
  const titre = page.locator(".ps-aside").getByText("Restons en contact").first()
  await expect(titre).toHaveCSS("color", "rgb(255, 255, 255)")   // fond sombre → texte blanc
  await fixer('input[type="color"]', "#e8b04a")(page, 0)
  await expect(page.locator(".ps-aside").getByText("Votre nom", { exact: false }).first()).toHaveCSS("color", "rgb(232, 176, 74)")
})

// Le QR de l'aperçu : un SVG dessiné à 640 px puis réduit (qr-code-styling
// arrondit un module au pixel inférieur — à 66 px, le code tombait à 29 px).
const qrDuSupport = (page: import("@playwright/test").Page) =>
  page.locator(".ps-aside svg[viewBox]").filter({ has: page.locator("rect, path") }).first()

test("la pastille du QR n'ajoute pas de marge à la sienne", async ({ page }) => {
  const ecart = await qrDuSupport(page).evaluate(svg => {
    const pastille = svg.parentElement!.parentElement as HTMLElement
    return pastille.getBoundingClientRect().width - svg.getBoundingClientRect().width
  })
  expect(ecart).toBeLessThan(2)
})

test("pastille ronde : le QR la remplit, même en taille compacte", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "feuille téléphone")
  await page.getByRole("button", { name: "QR", exact: true }).click()
  await page.getByRole("button", { name: "Cercle" }).click()
  await page.getByRole("button", { name: "Compact" }).click()
  await page.waitForTimeout(400)
  const r = await qrDuSupport(page).evaluate(svg => {
    const pastille = svg.parentElement!.parentElement as HTMLElement
    return { part: svg.getBoundingClientRect().width / pastille.getBoundingClientRect().width, coupe: getComputedStyle(pastille).overflow }
  })
  // Le carré du dessin dans le disque : ~0,75 du diamètre (4 modules de silence aux coins).
  expect(r.part).toBeGreaterThan(0.7)
  expect(r.coupe).toBe("hidden")   // les coins du dessin ne dépassent plus du disque
})

test("chaque texte s'affiche ou se masque", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "feuille téléphone")
  await page.getByRole("button", { name: "Texte", exact: true }).click()
  const support = page.locator(".ps-aside")
  await expect(support.getByText("Restons en contact").first()).toBeVisible()
  await page.getByRole("switch", { name: "Afficher : Titre" }).click()
  await expect(support.getByText("Restons en contact")).toHaveCount(0)
  await page.getByRole("switch", { name: "Afficher : Nom affiché" }).click()
  await expect(support.getByText("Votre nom", { exact: false })).toHaveCount(0)
  await page.getByRole("switch", { name: "Afficher : Titre" }).click()
  await expect(support.getByText("Restons en contact").first()).toBeVisible()
})
