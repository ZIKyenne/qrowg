import { test, expect, type Page } from "@playwright/test"

// Studio QR compact (?zero=1), étape 1 : on GÈRE un QR (pause, archive, suppression,
// destination) sans repasser par l'ancien studio. Les routes sont simulées : le banc
// d'essai n'a pas de base. On vérifie ce que l'écran fait de chaque réponse —
// y compris d'un refus, qui doit se dire au lieu de faire semblant.

const BANC = "/e2e-harness/qr-studio?zero=1"

async function simulerStatut(page: Page, repondre: (action: string) => { status: number; body: unknown }) {
  await page.route("**/api/qr-status", async route => {
    const req = route.request()
    const corps = req.postDataJSON() ?? {}
    const r = req.method() === "DELETE" ? { status: 200, body: { ok: true } } : repondre(corps.action)
    await route.fulfill({ status: r.status, contentType: "application/json", body: JSON.stringify(r.body) })
  })
}
const ligne = (page: Page) => page.getByRole("button", { name: "Gérer Carte restaurant (démo)" }).first()

test("pause, archive, restauration et suppression aboutissent", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur ; le téléphone a son test")
  const vers: Record<string, string> = { pause: "paused", archive: "archived", restore: "active", activate: "active" }
  await simulerStatut(page, a => ({ status: 200, body: { ok: true, status: vers[a] } }))
  await page.goto(BANC, { waitUntil: "networkidle" })

  // Pause : confirmée, puis dite dans la liste.
  await ligne(page).click()
  await expect(page.getByRole("menuitem", { name: "Supprimer définitivement" })).toHaveCount(0) // jamais sur un QR actif
  await page.getByRole("menuitem", { name: "Mettre en pause" }).click()
  await expect(page.getByText("Le code imprimé reste valable")).toBeVisible()
  await page.getByRole("button", { name: "Mettre en pause", exact: true }).click()
  await expect(page.getByText("En pause ·").first()).toBeVisible()

  // Archive : le QR quitte la liste, les archives apparaissent.
  await ligne(page).click()
  await page.getByRole("menuitem", { name: "Archiver" }).click()
  await page.getByRole("button", { name: "Archiver", exact: true }).click()
  await expect(page.getByRole("button", { name: /Archives \(1\)/ })).toBeVisible()
  await page.getByRole("button", { name: /Archives \(1\)/ }).click()

  // Dans les archives : restaurer ou supprimer.
  await ligne(page).click()
  await expect(page.getByRole("menuitem", { name: "Restaurer" })).toBeVisible()
  await page.getByRole("menuitem", { name: "Supprimer définitivement" }).click()
  await expect(page.getByText("avec toutes ses statistiques")).toBeVisible()
  await page.getByRole("button", { name: "Supprimer définitivement", exact: true }).click()
  await expect(page.getByText("Aucun QR archivé.")).toBeVisible()
})

test("un refus du serveur se dit, et rien ne change", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  await simulerStatut(page, () => ({ status: 403, body: { error: "Vous avez atteint le nombre de QR actifs de votre formule." } }))
  await page.goto(BANC, { waitUntil: "networkidle" })
  await ligne(page).click()
  await page.getByRole("menuitem", { name: "Mettre en pause" }).click()
  await page.getByRole("button", { name: "Mettre en pause", exact: true }).click()
  await expect(page.getByText("Vous avez atteint le nombre de QR actifs de votre formule.")).toBeVisible()
  await expect(page.getByText("En pause ·")).toHaveCount(0)
})

test("changer la destination, avec confirmation", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  let envoye: any = null
  await page.route("**/api/qr-destination", async route => {
    envoye = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true, dest_override: { type: "url", value: envoye.value, url: envoye.value, label: null }, dest_history: [],
    }) })
  })
  await page.goto(BANC, { waitUntil: "networkidle" })
  await ligne(page).click()
  await page.getByRole("menuitem", { name: "Où mène ce QR ?" }).click()
  await expect(page.getByText("Mène à votre page")).toBeVisible()
  await page.getByRole("button", { name: "Changer la destination" }).click()
  await page.getByLabel("Nouvelle destination").fill("https://promo-ete.fr")
  await page.getByRole("button", { name: "Continuer" }).click()
  await expect(page.getByText("tous les QR déjà imprimés")).toBeVisible()
  await page.getByRole("button", { name: "Confirmer le changement" }).click()
  await expect(page.getByText("Redirigé vers")).toBeVisible()
  expect(envoye).toMatchObject({ qr_id: "demo-qr-1", type: "url", value: "https://promo-ete.fr" })
  await page.screenshot({ path: "test-results/qr-compact-destination.png" })
  await page.getByRole("button", { name: "Fermer" }).last().click()
  await expect(page.getByText("Redirigé ·").first()).toBeVisible()
})

test("téléphone : le menu tient dans l'écran, et existe aussi sur le QR ouvert", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "téléphone")
  await page.goto(BANC, { waitUntil: "networkidle" })
  await ligne(page).click()
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  const b = (await menu.boundingBox())!
  const vw = page.viewportSize()!.width
  expect(b.x).toBeGreaterThanOrEqual(0)
  expect(b.x + b.width).toBeLessThanOrEqual(vw)
  for (const item of await page.getByRole("menuitem").all()) expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  // Rogné par la colonne, le menu passait le contrôle de position : on vérifie que la
  // DERNIÈRE entrée est réellement atteignable au doigt (rien ne la recouvre).
  const derniere = page.getByRole("menuitem").last()
  const d = (await derniere.boundingBox())!
  const touche = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("[role=menuitem]")?.textContent ?? "", [d.x + d.width / 2, d.y + d.height / 2])
  expect(touche).toContain("Archiver")
  await page.screenshot({ path: "test-results/qr-compact-menu-tel.png" })
  await page.keyboard.press("Escape")
  await expect(menu).toHaveCount(0)

  // Sur le QR ouvert : le même menu, dans la barre.
  await page.getByRole("button", { name: /Carte restaurant \(démo\)/ }).first().click()
  await expect(page.getByRole("button", { name: "← Mes QR" })).toBeVisible()
  await page.getByRole("button", { name: "Gérer Carte restaurant (démo)" }).click()
  const m2 = (await page.getByRole("menu").boundingBox())!
  expect(m2.x + m2.width).toBeLessThanOrEqual(vw)
  expect(m2.x).toBeGreaterThanOrEqual(0)
})
