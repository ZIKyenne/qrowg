import { test, expect, type Page } from "@playwright/test"
import { connecter } from "./sessionSimulee"

// U2 + U3 (revue du 23 nov.) : ni la galerie ni la création guidée n'écrivent
// un fait à la place du commerçant — ni avis, ni adresse, ni nom de commerce.

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "content-type": "application/json" }

test("création guidée : le nom saisi fait le titre et la tête de page", async ({ page }, info) => {
  await connecter(page, "pro")
  let envoye: any = null
  await page.route("**/api/templates/use", route => {
    envoye = route.request().postDataJSON()
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({ pageId: "00000000-0000-4000-8000-0000000000c1", qrStatus: "active" }) })
  })
  await page.route("**/api/goals", route => route.fulfill({ status: 200, headers: CORS, body: "{}" }))
  await page.route("**/dashboard/builder/**", route => route.fulfill({ status: 200, contentType: "text/html", body: "<p>éditeur</p>" }))

  await page.goto("/e2e-harness/onboarding?objectif=menu")
  const champ = page.getByLabel("Nom de votre commerce")
  await expect(champ).toBeVisible()
  await champ.fill("Chez Nénette")
  await page.screenshot({ path: `test-results/nom-du-commerce-${info.project.name}.png` })
  await page.getByRole("button", { name: /Bar · Cocktails/ }).click()
  await page.waitForURL(/\/dashboard\/builder\//)

  expect(envoye.templateName).toBe("Chez Nénette")
  expect(envoye.blocks.find((b: any) => b.type === "profile").content.name).toBe("Chez Nénette")
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  expect(deborde).toBe(false)
})

test("création guidée sans nom : aucun nom de commerce inventé", async ({ page }) => {
  await connecter(page, "pro")
  let envoye: any = null
  await page.route("**/api/templates/use", route => {
    envoye = route.request().postDataJSON()
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({ pageId: "00000000-0000-4000-8000-0000000000c2", qrStatus: "active" }) })
  })
  await page.route("**/api/goals", route => route.fulfill({ status: 200, headers: CORS, body: "{}" }))
  await page.route("**/dashboard/builder/**", route => route.fulfill({ status: 200, contentType: "text/html", body: "<p>éditeur</p>" }))

  await page.goto("/e2e-harness/onboarding?objectif=menu")
  await page.getByRole("button", { name: /Restaurant · Café/ }).click()
  await page.waitForURL(/\/dashboard\/builder\//)
  expect(envoye.templateName).toBe("Ma page — Présenter un menu")
  expect(JSON.stringify(envoye)).not.toContain("Le Bistrot")
})

const carteDuModele = (page: Page, nom: string) =>
  page.locator("article.tpl-card").filter({ has: page.locator(`h2[id^="tpl-nom-"]:text-is(${JSON.stringify(nom)})`) })

test("galerie : le modèle Restaurant & Bar n'installe plus d'avis ni d'adresse", async ({ page }) => {
  await page.goto("/creer?metier=Restaurant")
  await carteDuModele(page, "Restaurant & Bar").getByRole("button", { name: "Utiliser" }).first().click()
  await page.getByRole("dialog").getByLabel("Nom affiché sur la page").fill("Le Comptoir")
  await page.getByRole("dialog").getByRole("button", { name: /^Composer ma page/ }).click()
  await page.waitForURL(/\/dashboard\/builder/)
  const brouillon = await page.evaluate(() => JSON.parse(localStorage.getItem("qrowg_draft_v1") ?? "null"))
  const tout = JSON.stringify(brouillon.blocks)
  for (const faux of ["Marie L.", "rue de la Paix", "meilleure entrecote", "Ouvert aujourd"]) expect(tout, faux).not.toContain(faux)
  // La structure reste : le bloc d'avis attend de vrais avis.
  expect(brouillon.blocks.some((b: any) => b.type === "testimonials")).toBe(true)
})
