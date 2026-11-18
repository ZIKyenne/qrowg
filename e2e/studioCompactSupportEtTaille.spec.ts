import { test, expect, type Page } from "@playwright/test"

// Studio QR compact, lot v280 : deux gestes revenus de l'ancien studio.
//  · la taille de l'image PNG, dite en centimètres d'impression ;
//  · « Ajouter un support » : un QR de plus vers LA MÊME page, quota dit avant.
// La route /api/qr-support est simulée : le banc d'essai n'a pas de base. Le banc
// porte deux QR actifs ; la formule Gratuite en couvre 1, Starter 3.

const banc = (plan: string) => `/e2e-harness/qr-studio?plan=${plan}`
const gerer = (page: Page) => page.getByRole("button", { name: "Gérer Carte restaurant (démo)" }).first()

test("la taille du PNG se choisit, et se dit en centimètres", async ({ page }, info) => {
  await page.goto(banc("pro"), { waitUntil: "networkidle" })
  if (info.project.name === "mobile") await page.getByRole("button", { name: /Carte restaurant \(démo\)/ }).first().click()
  await page.getByRole("button", { name: "Télécharger" }).click()

  const tailles = page.getByRole("group", { name: "Taille de l'image PNG" })
  await expect(tailles.getByRole("button", { name: "1024 px" })).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByText(/Soit 87\smm de côté chez un imprimeur/)).toBeVisible()

  await tailles.getByRole("button", { name: "4096 px" }).click()
  await expect(tailles.getByRole("button", { name: "4096 px" })).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByText(/Soit 34,7\scm de côté chez un imprimeur/)).toBeVisible()
  // Au doigt : chaque taille est une vraie cible.
  const h = await tailles.getByRole("button", { name: "512 px" }).evaluate(b => b.getBoundingClientRect().height)
  expect(h).toBeGreaterThanOrEqual(44)
  await page.screenshot({ path: `test-results/qr-compact-taille-${info.project.name}.png` })

  if (info.project.name === "desktop") {
    const dl = page.waitForEvent("download")
    await page.getByRole("button", { name: /^PNG Web/ }).click()
    expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  }
})

test("ajouter un support : un QR de plus vers la même page, places restantes dites", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur ; le menu ⋯ est le même sur téléphone")
  let appels = 0
  await page.route("**/api/qr-support", async route => {
    appels++
    expect(route.request().postDataJSON()).toEqual({ page_id: "demo-page-1" })
    const qr = {
      id: "demo-qr-9", page_id: "demo-page-1", short_code: "demo9", label: "Support 2", status: "active",
      foreground_color: "#111411", background_color: "#F4F1E8", corner_style: "rounded", error_correction: "M",
      style_config: {}, dest_override: null, dest_history: [], total_scans: 0, created_at: "2026-11-18T10:00:00Z",
      pages: { id: "demo-page-1", title: "Carte restaurant (démo)", slug: "carte-restaurant-demo", status: "published", total_views: 0, updated_at: "2026-11-18T10:00:00Z" },
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, qr, brouillon: false }) })
  })
  await page.goto(banc("starter"), { waitUntil: "networkidle" })
  await gerer(page).click()
  await page.getByRole("menuitem", { name: "Ajouter un support" }).click()
  await expect(page.getByText(/Support\s*«\s*Support 2\s*»\s*ajouté/)).toBeVisible()
  await expect(page.getByText(/Il vous reste 1 QR actif/)).toBeVisible()
  await expect(page.getByText("Carte restaurant (démo) — Support 2").first()).toBeVisible()
  expect(appels).toBe(1)
})

test("formule pleine : le refus se dit AVANT, sans appel au serveur", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  let appels = 0
  await page.route("**/api/qr-support", route => { appels++; return route.abort() })
  await page.goto(banc("free"), { waitUntil: "networkidle" })
  await gerer(page).click()
  await page.getByRole("menuitem", { name: "Ajouter un support" }).click()
  await expect(page.getByText(/Votre plan couvre un seul QR actif/)).toBeVisible()
  expect(appels).toBe(0)
})
