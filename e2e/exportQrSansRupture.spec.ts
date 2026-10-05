import { test, expect } from "@playwright/test"

// ═══════════════════════════════════════════════════════════════════════════════
// Q08 — LE TÉLÉCHARGEMENT S'ARRÊTAIT SUR UN MUR.
//
// Relevé du 29 septembre sur /dashboard/qr-link, sans compte : « Télécharger PNG »
// est proposé, le clic mène à la connexion, et aucun retour n'apparaît dans l'URL
// de destination. Le QR composé était perdu en chemin.
//
// Ce que ce fichier mesure : le parcours d'un visiteur sans compte, du champ
// rempli jusqu'au retour sur l'écran.
// ═══════════════════════════════════════════════════════════════════════════════

const LIEN = "https://exemple-de-commerce.fr/carte"

test.describe("Q08 — un visiteur sans compte n'est pas surpris", () => {
  test("le bouton annonce l'étape AVANT le clic", async ({ page }, testInfo) => {
    await page.goto("/dashboard/qr-link", { waitUntil: "domcontentloaded" })
    const champ = page.getByLabel("Lien à encoder")
    await expect(champ).toBeVisible({ timeout: 30_000 })
    await champ.fill(LIEN)

    const bouton = page.getByRole("button", { name: /Créer un compte pour télécharger/ })
    await expect(bouton, "le bouton reste inactif alors que le lien est saisi").toBeEnabled()
    await expect(bouton, "rien ne prévient que le téléchargement demande un compte").toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole("button", { name: /^Télécharger PNG$/ })).toHaveCount(0)

    await testInfo.attach(`q08-avant-${testInfo.project.name}`, { body: await page.screenshot(), contentType: "image/png" })
  })

  test("le clic mène à la connexion AVEC le chemin du retour", async ({ page }) => {
    await page.goto("/dashboard/qr-link", { waitUntil: "domcontentloaded" })
    const champ = page.getByLabel("Lien à encoder")
    await expect(champ).toBeVisible({ timeout: 30_000 })
    await champ.fill(LIEN)

    const partir = page.getByRole("button", { name: /Créer un compte pour télécharger/ })
    await expect(partir).toBeEnabled()
    await partir.click()
    await page.waitForURL(/\/auth\/login/, { timeout: 30_000 })

    const url = new URL(page.url())
    expect(url.pathname).toBe("/auth/login")
    const retour = url.searchParams.get("redirect")
    expect(retour, "l'URL de connexion ne dit pas d'où l'on vient").toBe("/dashboard/qr-link?reprise=1")
    // Et l'adresse de retour est interne : jamais un hôte extérieur.
    expect(retour!.startsWith("/") && !retour!.startsWith("//")).toBe(true)
  })

  test("et la composition est retrouvée au retour", async ({ page }, testInfo) => {
    await page.goto("/dashboard/qr-link", { waitUntil: "domcontentloaded" })
    const champ = page.getByLabel("Lien à encoder")
    await expect(champ).toBeVisible({ timeout: 30_000 })
    await champ.fill(LIEN)
    const partir = page.getByRole("button", { name: /Créer un compte pour télécharger/ })
    await expect(partir).toBeEnabled()
    await partir.click()
    await page.waitForURL(/\/auth\/login/, { timeout: 30_000 })

    // Le retour tel que l'identification le produirait.
    await page.goto("/dashboard/qr-link?reprise=1", { waitUntil: "domcontentloaded" })
    const repris = page.getByLabel("Lien à encoder")
    await expect(repris, "le lien saisi avant la connexion a été perdu").toHaveValue(LIEN, { timeout: 30_000 })
    // Le paramètre est consommé : un rechargement ne rejoue pas la reprise.
    await expect.poll(() => new URL(page.url()).search, { timeout: 15_000 }).toBe("")

    await testInfo.attach(`q08-retour-${testInfo.project.name}`, { body: await page.screenshot(), contentType: "image/png" })
  })
})

test.describe("Q08 — le générateur public, lui, tient sa promesse", () => {
  test("il annonce un téléchargement sans compte, et n'exige rien", async ({ page }) => {
    await page.goto("/generateur-qr-code", { waitUntil: "domcontentloaded" })
    const champ = page.getByRole("textbox").first()
    await expect(champ).toBeVisible({ timeout: 30_000 })
    await champ.fill(LIEN)

    // La promesse affichée…
    await expect(page.getByText(/aucun compte requis/)).toBeVisible({ timeout: 30_000 })
    // …et le fichier réellement produit, sans passer par la connexion.
    const bouton = page.getByRole("button", { name: /Télécharger PNG/ })
    await expect(bouton).toBeEnabled()
    const telechargement = page.waitForEvent("download", { timeout: 30_000 })
    await bouton.click()
    const fichier = await telechargement
    expect(fichier.suggestedFilename()).toBe("qrcode.png")
    expect(page.url()).not.toContain("/auth/")
  })
})
