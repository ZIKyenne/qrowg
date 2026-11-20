import { test, expect, type Page } from "@playwright/test"

// Garde (20 nov.) — toucher un bloc l'OUVRE, il ne le déplace pas.
//
// Les commandes d'un bloc (Monter / Descendre / Dupliquer / ⋯) étaient cachées
// par opacité 0 mais restaient cliquables. Au téléphone, toucher le milieu d'un
// bloc bas — le texte « Bienvenue sur ma page ! » d'une page neuve — tombait
// sur « Monter » invisible : le bloc passait au-dessus du profil au lieu de
// s'ouvrir. Mesuré en mode invité (/dashboard/builder/new), l'éditeur que voient
// les clients (coquille redessinée éteinte).

const URL = "/dashboard/builder/new?builderRedesign=0"
const ordre = (page: Page) => page.locator("[data-block-id]").evaluateAll(els => els.map(e => (e as HTMLElement).dataset.blockId))

async function ouvrir(page: Page) {
  await page.addInitScript(() => {
    const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"
    document.addEventListener("DOMContentLoaded", () => document.documentElement.appendChild(s))
  })
  await page.goto(URL, { waitUntil: "networkidle", timeout: 120_000 })
  await expect(page.locator("[data-block-id]").nth(2)).toBeVisible({ timeout: 30_000 })
  const passer = page.getByRole("button", { name: "Passer" })
  if (await passer.isVisible().catch(() => false)) await passer.click()
}

test("téléphone : toucher le milieu d'un bloc l'ouvre sans le déplacer", async ({ page }, ti) => {
  test.skip(ti.project.name !== "mobile", "geste tactile")
  test.setTimeout(150_000)
  await ouvrir(page)
  const avant = await ordre(page)
  const box = (await page.locator("[data-block-id]").nth(1).boundingBox())!
  const x = box.x + box.width / 2, y = box.y + box.height / 2
  // Ce qui reçoit le doigt au centre du bloc ne doit pas être une commande cachée.
  const cible = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label") ?? null, { x, y })
  expect(cible, "une commande invisible intercepte le toucher").toBeNull()
  await page.touchscreen.tap(x, y)
  await page.waitForTimeout(500)
  expect(await ordre(page), "le bloc a changé de place").toEqual(avant)
  // Et le toucher a bien ouvert quelque chose : l'onglet Réglages devient l'onglet courant.
  await expect(page.getByRole("button", { name: /^Page$/ })).toBeVisible()
})

test("ordinateur : au survol, « Monter » reste utilisable", async ({ page }, ti) => {
  test.skip(ti.project.name !== "desktop", "survol souris")
  test.setTimeout(150_000)
  await ouvrir(page)
  const avant = await ordre(page)
  const bloc = page.locator("[data-block-id]").nth(1)
  await bloc.hover()
  await bloc.getByRole("button", { name: "Monter le bloc" }).click()
  await expect.poll(() => ordre(page)).toEqual([avant[1], avant[0], avant[2]])
})
