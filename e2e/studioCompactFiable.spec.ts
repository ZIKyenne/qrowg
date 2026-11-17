import { test, expect, type Page } from "@playwright/test"

// Studio QR compact (?zero=1), étape 2 : il ne perd rien, il ne donne pas ce que la
// formule ne donne pas, et ses réglages font vraiment quelque chose.

type Envoi = { qr_id: string; style_config?: { silence?: number } }
async function ecouterStyle(page: Page, repondre: () => number = () => 200) {
  const envois: Envoi[] = []
  await page.route("**/api/qr-style", async route => {
    envois.push(route.request().postDataJSON())
    const st = repondre()
    await route.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(st === 200 ? { ok: true } : { error: "Enregistrement refusé par le serveur." }) })
  })
  return envois
}

test("changer de QR aussitôt après un réglage n'efface pas ce réglage", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  const envois = await ecouterStyle(page)
  await page.goto("/e2e-harness/qr-studio?zero=1", { waitUntil: "networkidle" })
  // Ouvrir n'enregistre rien (l'ancienne garde laissait partir une sauvegarde à chaque ouverture).
  await page.waitForTimeout(1200)
  expect(envois, "aucune sauvegarde sans réglage").toHaveLength(0)
  await page.getByTitle("Palette").nth(1).click()
  await page.getByRole("button", { name: /^Avis Google/ }).click()   // avant la fin du délai
  await page.waitForTimeout(1200)
  expect(envois.filter(e => e.qr_id === "demo-qr-2"), "ouvrir un autre QR ne l'enregistre pas").toHaveLength(0)
  await expect.poll(() => envois.filter(e => e.qr_id === "demo-qr-1").length, { timeout: 4000 }).toBeGreaterThan(0)
})

test("un échec se dit, et « Réessayer » réessaie vraiment", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  let ok = false
  const envois = await ecouterStyle(page, () => ok ? 200 : 500)
  await page.goto("/e2e-harness/qr-studio?zero=1", { waitUntil: "networkidle" })
  await page.getByTitle("Palette").nth(1).click()
  await expect(page.getByRole("button", { name: "Réessayer" })).toBeVisible({ timeout: 5000 })
  await expect(page.getByText("Non enregistré")).toBeVisible()
  // La relance automatique a lieu, puis l'échec persistant se dit en clair.
  await expect(page.getByText(/Touchez.{1,3}Réessayer/).first()).toBeVisible({ timeout: 8000 })
  const avant = envois.length
  ok = true
  await page.getByRole("button", { name: "Réessayer" }).click()
  await expect(page.getByText("Enregistré", { exact: true })).toBeVisible()
  expect(envois.length).toBe(avant + 1)
})

test("la marge Large est bien celle qu'on enregistre (en modules)", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  const envois = await ecouterStyle(page)
  await page.goto("/e2e-harness/qr-studio?zero=1", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /Réglages avancés/ }).click()
  await page.getByRole("radio", { name: "Large" }).click()
  await expect.poll(() => envois.at(-1)?.style_config?.silence, { timeout: 4000 }).toBe(6)
  await expect(page.getByRole("radio", { name: "Large" })).toHaveAttribute("aria-checked", "true")
})

test("formule gratuite : SVG et styles avancés disent la formule qui les ouvre", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  await page.goto("/e2e-harness/qr-studio?zero=1&plan=free", { waitUntil: "networkidle" })
  expect(await page.locator("body").innerText()).not.toMatch(/garanti/i)

  await page.getByRole("button", { name: "Pixel (formule Starter)" }).click()
  await expect(page.getByRole("heading", { name: "Inclus dès la formule Starter" })).toBeVisible()
  await page.getByRole("button", { name: "Plus tard" }).click()

  await page.getByRole("button", { name: "Télécharger" }).click()
  await expect(page.getByText("Dès Établissement").first()).toBeVisible()
  await page.screenshot({ path: "test-results/qr-compact-formats-gratuit.png" })
  await page.getByRole("button", { name: /^SVG/ }).click()
  await expect(page.getByRole("heading", { name: "Inclus dès la formule Établissement" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Voir la formule Établissement" })).toHaveAttribute("href", "/upgrade?plan=pro")
})

test("formule Établissement : SVG s'ouvre sans fenêtre de formule", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  await page.goto("/e2e-harness/qr-studio?zero=1&plan=pro", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Télécharger" }).click()
  await expect(page.getByText(/^Dès /)).toHaveCount(0)
  const dl = page.waitForEvent("download")
  await page.getByRole("button", { name: /^SVG/ }).click()
  expect((await dl).suggestedFilename()).toMatch(/\.svg$/)
})
