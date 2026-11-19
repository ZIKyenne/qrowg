import { test, expect, type Page } from "@playwright/test"

// Lot fast-food 2 (19 nov.) : l'« Appel en salle ». Le client choisit sa demande,
// elle part par /api/leads (intercepté ici : la base locale n'existe plus) et
// arrive dans Messages en « Appel en salle · Table 12 ».

async function intercepter(page: Page, statut = 200) {
  const envois: any[] = []
  await page.route("**/api/leads", async r => { envois.push(r.request().postDataJSON()); await r.fulfill({ status: statut, body: "{}" }) })
  return envois
}

test("le QR de la table préremplit son numéro, et l'addition part avec", async ({ page }) => {
  const envois = await intercepter(page)
  await page.goto("/e2e-harness/appel-serveur?table=12", { waitUntil: "networkidle", timeout: 120_000 })
  await expect(page.getByLabel("Numéro de table")).toHaveValue("12")
  await page.getByRole("button", { name: /L'addition/ }).click()
  await expect(page.getByRole("status")).toContainText("envoyé à l'équipe — table 12")
  expect(envois).toHaveLength(1)
  expect(envois[0]).toMatchObject({ type: "serveur", name: "Table 12", message: "L'addition, s'il vous plaît", data: { demande: "addition", table: "12" }, blockId: "appel" })
  // Pause d'une minute : le doigt qui insiste n'envoie pas dix appels.
  await expect(page.getByRole("button", { name: /Appeler un serveur/ })).toBeDisabled()
  await expect(page.getByRole("status")).toContainText(/Nouvel appel possible dans \d+ s/)
})

test("un envoi refusé se dit, et invite à faire signe", async ({ page }) => {
  await intercepter(page, 500)
  await page.goto("/e2e-harness/appel-serveur", { waitUntil: "networkidle", timeout: 120_000 })
  await page.getByLabel("Numéro de table").fill("t-4")
  await expect(page.getByLabel("Numéro de table")).toHaveValue("T4")
  await page.getByRole("button", { name: /Appeler un serveur/ }).click()
  await expect(page.getByRole("status")).toContainText("L'envoi n'a pas abouti")
  await expect(page.getByRole("button", { name: /Appeler un serveur/ })).toBeEnabled()
})

test("au téléphone : tout se vise au doigt, rien ne déborde", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "mesure au téléphone")
  await page.goto("/e2e-harness/appel-serveur", { waitUntil: "networkidle", timeout: 120_000 })
  const petits = await page.evaluate(() => [...document.querySelectorAll("[data-appel-serveur] button, [data-appel-serveur] input")]
    .map(e => e.getBoundingClientRect()).filter(r => r.height < 44).length)
  expect(petits).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
