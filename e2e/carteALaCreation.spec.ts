import { test, expect, type Page } from "@playwright/test"

// « Vous avez déjà une carte ? Collez-la » au moment de créer sa page, sur la
// vraie galerie publique (/creer, sans compte : la page part en brouillon local).
const carteDuModele = (page: Page, nom: string) =>
  page.locator("article.tpl-card").filter({ has: page.locator(`h2[id^="tpl-nom-"]:text-is(${JSON.stringify(nom)})`) })

test("modèle Restaurant : la page naît avec la carte collée, à la place des plats d'exemple", async ({ page }, info) => {
  await page.goto("/creer?metier=Restaurant")
  await carteDuModele(page, "Restaurant & Bar").getByRole("button", { name: "Utiliser" }).first().click()
  const fenetre = page.getByRole("dialog")
  await expect(fenetre).toBeVisible()
  // Le nom est à saisir (vide depuis le 17 nov. : prérempli, le nom du modèle partait sur la page).
  await fenetre.getByLabel("Nom affiché sur la page").fill("Le Comptoir")

  await fenetre.getByRole("button", { name: "Vous avez déjà une carte ? Collez-la" }).click()
  await fenetre.getByLabel("Votre carte (facultatif)").fill("COCKTAILS\nMojito 10€\nRhum, menthe\nSpritz 8€\n\nSOFTS\nCoca 4€")
  await expect(fenetre.getByText("2 sections · 3 produits — ils remplaceront les 6 produits d'exemple du modèle.")).toBeVisible()
  await fenetre.screenshot({ path: `test-results/carte-a-la-creation-${info.project.name}.png` })

  await fenetre.getByRole("button", { name: /^Composer ma page/ }).click()
  await page.waitForURL(/\/dashboard\/builder/)
  const brouillon = await page.evaluate(() => JSON.parse(localStorage.getItem("qrowg_draft_v1") ?? "null"))
  const types = brouillon.blocks.map((b: any) => b.type)
  expect(types).not.toContain("menu_section")
  const carte = brouillon.blocks.find((b: any) => b.type === "menu_tabs")
  expect(carte.content.sec1_title).toBe("COCKTAILS")
  expect(carte.content.sec1_items).toBe("Mojito;10€;Rhum, menthe\nSpritz;8€")
  expect(carte.content.sec2_items).toBe("Coca;4€")
})

test("sans rien coller : le modèle est créé exactement comme avant", async ({ page }) => {
  await page.goto("/creer?metier=Restaurant")
  await carteDuModele(page, "Restaurant & Bar").getByRole("button", { name: "Utiliser" }).first().click()
  await page.getByRole("dialog").getByLabel("Nom affiché sur la page").fill("Le Comptoir")
  await page.getByRole("dialog").getByRole("button", { name: /^Composer ma page/ }).click()
  await page.waitForURL(/\/dashboard\/builder/)
  const brouillon = await page.evaluate(() => JSON.parse(localStorage.getItem("qrowg_draft_v1") ?? "null"))
  expect(brouillon.blocks.filter((b: any) => b.type === "menu_section")).toHaveLength(2)
})

test("un modèle sans carte ne propose pas de coller une carte", async ({ page }) => {
  await page.goto("/creer?metier=Freelance")
  await carteDuModele(page, "Freelance").getByRole("button", { name: "Utiliser" }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("button", { name: "Vous avez déjà une carte ? Collez-la" })).toHaveCount(0)
})

test("création guidée « Présenter un menu » : la carte collée part avec la page", async ({ page }) => {
  // On intercepte la création : on vérifie ce qui PART, sans base.
  let envoye: any = null
  await page.route("**/api/templates/use", async route => {
    envoye = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ pageId: "00000000-0000-4000-8000-000000000009", qrCreated: true }) })
  })
  await page.route("**/api/goals", route => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }))
  await page.goto("/e2e-harness/onboarding?objectif=menu")
  await page.getByRole("button", { name: "Vous avez déjà une carte ? Collez-la" }).click()
  await page.getByLabel("Votre carte (facultatif)").fill("COCKTAILS\nMojito 10€\nSpritz 8€")
  await expect(page.getByText(/^1 section · 2 produits — ils remplaceront les \d+ produits d'exemple du modèle\.$/)).toBeVisible()
  await page.getByRole("button", { name: /Bar/ }).first().click()
  await expect.poll(() => envoye).not.toBeNull()
  const types = envoye.blocks.map((b: any) => b.type)
  expect(types).toContain("menu_tabs")
  expect(types).not.toContain("menu_section")
  expect(envoye.blocks.find((b: any) => b.type === "menu_tabs").content.sec1_items).toBe("Mojito;10€\nSpritz;8€")
})

test("assistant « Remplir avec mes infos » : la carte collée remplace aussi les exemples", async ({ page }) => {
  await page.goto("/creer?metier=Restaurant")
  await carteDuModele(page, "Restaurant & Bar").getByRole("button", { name: /^Aperçu/ }).last().click()
  await page.getByRole("button", { name: /Remplir avec mes infos/ }).click()
  await page.getByRole("button", { name: "Passer toutes les questions" }).click()
  await page.getByRole("button", { name: /^Continuer/ }).click()
  await page.getByRole("button", { name: "Vous avez déjà une carte ? Collez-la" }).click()
  await page.getByLabel("Votre carte (facultatif)").fill("COCKTAILS\nMojito 10€\nSpritz 8€")
  await expect(page.getByText(/^1 section · 2 produits/)).toBeVisible()
  await page.getByRole("button", { name: /^Créer ma page/ }).click()
  await page.waitForURL(/\/dashboard\/builder/)
  const brouillon = await page.evaluate(() => JSON.parse(localStorage.getItem("qrowg_draft_v1") ?? "null"))
  const types = brouillon.blocks.map((b: any) => b.type)
  expect(types).toContain("menu_tabs")
  expect(types).not.toContain("menu_section")
})
