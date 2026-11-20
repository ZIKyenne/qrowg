import { test, expect } from "@playwright/test"

// Garde (20 nov.) — au téléphone, la bibliothèque de blocs montre des BLOCS tout
// de suite. Les catégories en grille 4 × 3 (libellés à 9,5 px) prenaient ~300 px :
// cinq blocs visibles sur un écran de 844. En une rangée qui défile de côté :
// huit. Mesuré sur l'éditeur que voient les clients (coquille redessinée éteinte).

test("téléphone : catégories sur une rangée, premier bloc dans le premier tiers", async ({ page }, ti) => {
  test.skip(ti.project.name !== "mobile", "mise en page téléphone")
  test.setTimeout(150_000)
  await page.addInitScript(() => {
    const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"
    document.addEventListener("DOMContentLoaded", () => document.documentElement.appendChild(s))
  })
  await page.goto("/dashboard/builder/new?builderRedesign=0", { waitUntil: "networkidle", timeout: 120_000 })
  const passer = page.getByRole("button", { name: "Passer" })
  if (await passer.isVisible().catch(() => false)) await passer.click()
  await page.getByRole("button", { name: /^Blocs$/ }).click()

  const rangee = page.locator(".biblio-rangee")
  await expect(rangee).toBeVisible()
  const boutons = rangee.locator(":scope > button")
  const n = await boutons.count()
  expect(n).toBeGreaterThanOrEqual(12)
  // Une seule rangée : toutes les catégories partagent le même haut.
  const hauts = await boutons.evaluateAll(bs => bs.map(b => Math.round(b.getBoundingClientRect().top)))
  expect(new Set(hauts).size, "catégories sur plusieurs rangées").toBe(1)
  // Lisibles et au pouce.
  const mesures = await boutons.first().evaluate(b => ({ h: b.getBoundingClientRect().height, fs: parseFloat(getComputedStyle(b.querySelector("span:last-of-type")!).fontSize) }))
  expect(mesures.h).toBeGreaterThanOrEqual(44)
  expect(mesures.fs).toBeGreaterThanOrEqual(13)
  // La rangée défile de côté sans faire déborder la page.
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  // Le premier bloc de la liste apparaît dans le premier tiers de l'écran.
  const premier = page.getByText("Photo, nom, accroche et badge").first()
  const y = (await premier.boundingBox())!.y
  expect(y, "premier bloc trop bas").toBeLessThan(844 / 3)
})
