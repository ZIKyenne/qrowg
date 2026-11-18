import { test, expect } from "@playwright/test"

// Lot 3 « appli » (18 nov.) : l'Accueil invite à installer QRowg sur le
// téléphone — les gestes de Safari sur iPhone, ceux du menu ⋮ sur Android,
// rien une fois installé, rien après « Plus tard ».

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"
const carte = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "Installer QRowg sur ce téléphone" })

test.describe("iPhone", () => {
  test.use({ userAgent: IPHONE })
  test("les gestes de Safari, puis « Plus tard » range la carte", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "téléphone")
    await page.goto("/e2e-harness/accueil", { waitUntil: "networkidle" })
    await expect(carte(page)).toBeVisible()
    await expect(carte(page)).toContainText("Touchez Partager")
    await expect(carte(page)).toContainText("Sur l'écran d'accueil")
    await carte(page).scrollIntoViewIfNeeded()
    await page.screenshot({ path: "test-results/installer-iphone.png" })
    await carte(page).getByRole("button", { name: "Plus tard" }).click()
    await expect(carte(page)).toHaveCount(0)
    // …et elle ne revient pas au rechargement.
    await page.reload({ waitUntil: "networkidle" })
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(carte(page)).toHaveCount(0)
  })
})

test.describe("Android", () => {
  test.use({ userAgent: ANDROID })
  test("les gestes du menu ⋮", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "téléphone")
    await page.goto("/e2e-harness/accueil", { waitUntil: "networkidle" })
    await expect(carte(page)).toContainText("Installer l'application")
  })
  test("déjà installé (ouvert depuis l'icône) : rien", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "téléphone")
    await page.addInitScript(() => {
      const mm = window.matchMedia.bind(window)
      window.matchMedia = (q: string) => q.includes("display-mode: standalone")
        ? ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList)
        : mm(q)
    })
    await page.goto("/e2e-harness/accueil", { waitUntil: "networkidle" })
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(carte(page)).toHaveCount(0)
  })
})

test("ordinateur : rien", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  await page.goto("/e2e-harness/accueil", { waitUntil: "networkidle" })
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expect(carte(page)).toHaveCount(0)
})
