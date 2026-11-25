import { test, expect } from "@playwright/test"
import { AIDE_DES_RACCOURCIS } from "../apps/web/src/app/dashboard/builder/raccourcisClavier"

// Les outils de la barre du haut de l'éditeur, sortis de BuilderV4 en v386 :
// Annuler / Rétablir, et l'aide « ? » dont la liste vient désormais de la
// table des raccourcis. (Le panneau « QR Code » n'apparaît qu'une fois la page
// enregistrée en base : sans base dans ce banc, sa garde est unitaire.)

function brouillon() {
  return {
    v: 1, savedAt: Date.now(), pageName: "Avant", theme: null,
    blocks: [{ id: "local-0", type: "profile", content: { name: "Le Comptoir", tagline: "Cuisine de saison" }, visible: true, draft: false, locked: false }],
  }
}

test("Annuler / Rétablir sur le nom de la page, et l'aide qui dit les vrais raccourcis", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "l'aide « ? » est réservée au bureau")
  await page.goto("/creer", { waitUntil: "domcontentloaded" })
  await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  await page.goto("/dashboard/builder?draft=1", { waitUntil: "domcontentloaded" })
  const nom = page.getByLabel("Nom de la page").first()
  await expect(nom).toHaveValue("Avant", { timeout: 30_000 })
  const guide = page.getByRole("dialog", { name: "Bienvenue dans votre éditeur" })
  await guide.getByRole("button", { name: "Passer" }).click()
  await expect(guide).toHaveCount(0)

  // Renommer, annuler, rétablir — avec les boutons de la barre.
  await nom.fill("Après")
  const annuler = page.getByRole("button", { name: "Annuler — Ctrl+Z" })
  const retablir = page.getByRole("button", { name: "Rétablir — Ctrl+Shift+Z" })
  await expect(annuler).toBeEnabled()
  await annuler.click()
  await expect(nom).toHaveValue("Avant")
  await expect(retablir).toBeEnabled()
  await retablir.click()
  await expect(nom).toHaveValue("Après")

  // L'aide « ? » : au survol, chaque ligne de la table, rien d'autre.
  await page.getByRole("button", { name: "Raccourcis clavier" }).hover()
  const bulle = page.getByText("Raccourcis", { exact: true }).locator("..")
  await expect(bulle).toBeVisible()
  for (const r of AIDE_DES_RACCOURCIS) await expect(bulle.getByText(r.libelle, { exact: true })).toBeVisible()
  // Les touches, toutes et dans l'ordre (« ↑ / ↓ » est contenu dans « Alt+↑ / ↓ » : on compare le texte entier).
  await expect(bulle.locator("kbd")).toHaveText(AIDE_DES_RACCOURCIS.map(r => r.touches))
  await page.screenshot({ path: `test-results/outils-de-la-barre-${info.project.name}.png`, clip: { x: 640, y: 0, width: 640, height: 640 } })
})
