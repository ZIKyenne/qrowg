import { test, expect } from "@playwright/test"

// Vague 1 (revue du 23 nov.) : l'ardoise du jour en moins de 30 secondes, au
// téléphone, depuis Ma carte — sans ouvrir l'éditeur. Banc /e2e-harness/ma-carte
// (l'écran réel, le vrai module pur, aucune base).

test("l'ardoise d'hier se remet d'un toucher", async ({ page }, info) => {
  await page.goto("/e2e-harness/ma-carte?ardoise=hier")
  const ardoise = page.getByRole("region", { name: "L'ardoise du jour" })
  await expect(ardoise.getByRole("status")).toContainText("Invisible en ligne : c'est l'ardoise du")
  await page.screenshot({ path: `test-results/ardoise-hier-${info.project.name}.png` })

  await ardoise.getByRole("button", { name: /^Remettre celle du / }).click()
  await expect(ardoise.getByRole("status")).toHaveText("En ligne aujourd'hui · 2 plats")
  await expect(ardoise.getByText("Blanquette (démo)")).toBeVisible()
  await expect(page.getByText("L'ardoise est en ligne pour aujourd'hui")).toBeVisible()
})

test("pas d'ardoise : on l'écrit, deux plats, et elle part en ligne", async ({ page }, info) => {
  await page.goto("/e2e-harness/ma-carte")
  const debut = Date.now()
  const ardoise = page.getByRole("region", { name: "L'ardoise du jour" })
  await expect(ardoise.getByRole("status")).toHaveText("Pas d'ardoise en ligne aujourd'hui.")
  await ardoise.getByRole("button", { name: "Écrire l'ardoise du jour" }).click()

  const form = page.getByRole("form", { name: "Écrire l'ardoise du jour" })
  await expect(form.getByLabel("Plat 1", { exact: true })).toBeFocused()
  await form.getByLabel("Plat 1", { exact: true }).fill("Blanquette de veau")
  await form.getByLabel("Prix").first().fill("14")
  await form.getByRole("button", { name: "Un autre plat" }).click()
  await form.getByLabel("Plat 2", { exact: true }).fill("Tarte aux pommes")
  await form.getByLabel("Prix").nth(1).fill("6")
  await page.screenshot({ path: `test-results/ardoise-ecriture-${info.project.name}.png` })
  await form.getByRole("button", { name: "Mettre en ligne" }).click()

  await expect(ardoise.getByRole("status")).toHaveText("En ligne aujourd'hui · 2 plats")
  // « 14 » prend la forme des prix de la carte (« 9 € ») : « 14 € ».
  await expect(ardoise.getByText("14 €")).toBeVisible()
  await expect(form).toHaveCount(0)
  // Le geste humain se chronomètre ailleurs (D5) ; ici, l'écran ne doit rien y ajouter.
  expect(Date.now() - debut).toBeLessThan(30_000)
  await page.screenshot({ path: `test-results/ardoise-en-ligne-${info.project.name}.png` })
})

test("le serveur refuse : la phrase s'affiche, la saisie reste", async ({ page }) => {
  await page.goto("/e2e-harness/ma-carte?refus=1")
  const ardoise = page.getByRole("region", { name: "L'ardoise du jour" })
  await ardoise.getByRole("button", { name: "Écrire l'ardoise du jour" }).click()
  const form = page.getByRole("form", { name: "Écrire l'ardoise du jour" })
  await form.getByLabel("Plat 1", { exact: true }).fill("Blanquette de veau")
  await form.getByRole("button", { name: "Mettre en ligne" }).click()
  await expect(form.getByText("Le serveur a refusé (banc d'essai).")).toBeVisible()
  await expect(form.getByLabel("Plat 1", { exact: true })).toHaveValue("Blanquette de veau")
  await expect(ardoise.getByRole("status").first()).toHaveText("Pas d'ardoise en ligne aujourd'hui.")
})
