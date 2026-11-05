import { test, expect } from "@playwright/test"

// apercuGenere — la preuve que la phase 1 tient au navigateur.
//
// Les tests unitaires prouvent que le générateur n'invente rien. Ils ne
// prouvent pas que la page SE REND. Ici on ouvre les trois établissements
// fictifs avec le vrai `PublicPageClient` — celui qui s'affiche quand un client
// scanne un QR code — à trois largeurs, et on vérifie ce qui doit l'être.

const LARGEURS = [
  { nom: "mobile", w: 390, h: 844 },
  { nom: "tablette", w: 768, h: 1024 },
  { nom: "bureau", w: 1440, h: 900 },
]

const PROSPECTS = [
  { cle: "bistrot", nom: "Chez Mariette", modele: "resto_bistrot" },
  { cle: "rapide", nom: "Le Comptoir Express", modele: "resto_fastfood" },
  { cle: "bar", nom: "La Cave aux Notes", modele: "resto_bar" },
]

/** L'hydratation d'abord : en `next dev`, la première requête compile. */
async function ouvrir(page: import("@playwright/test").Page, cle: string) {
  await page.goto(`/e2e-harness/growth-preview?prospect=${cle}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByTestId("growth-preview")).toBeVisible({ timeout: 30_000 })
}

test.describe("l'aperçu généré rend une vraie page QRowg", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 })

  for (const p of PROSPECTS) {
    test(`${p.cle} — page rendue, modèle attendu, aucun débordement`, async ({ page }, info) => {
      for (const l of LARGEURS) {
        await page.setViewportSize({ width: l.w, height: l.h })
        await ouvrir(page, p.cle)

        // Le modèle vient bien de la bibliothèque QRowg.
        await expect(page.getByTestId("growth-preview")).toHaveAttribute("data-modele", p.modele)

        // Le nom de l'établissement est là — c'est le minimum d'une page
        // personnalisée.
        await expect(page.getByText(p.nom, { exact: false }).first()).toBeVisible()

        // Aucun débordement horizontal : la page est vue au téléphone.
        const debord = await page.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(debord, `${p.cle} déborde de ${debord}px à ${l.w}px`).toBeLessThanOrEqual(1)

        await info.attach(`${p.cle}-${l.nom}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" })
      }
    })
  }

  test("le bandeau « proposition non officielle » est visible d'emblée", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await ouvrir(page, "bistrot")
    const bandeau = page.getByTestId("bandeau-non-officiel")
    await expect(bandeau).toBeVisible()
    await expect(bandeau).toContainText("Proposition non officielle")
    await expect(bandeau).toContainText("n'a pas approuvé cette page")
    // Il est en haut, sans défiler : une mise en garde qu'il faut chercher
    // n'est pas une mise en garde.
    const b = await bandeau.boundingBox()
    expect(b!.y, "le bandeau doit être visible sans défiler").toBeLessThan(80)
  })

  test("aucun prix ni horaire inventé n'apparaît", async ({ page }) => {
    // Les valeurs de démonstration du modèle bistrot. Si l'une d'elles sort à
    // l'écran, c'est la carte d'un autre restaurant affichée sous l'enseigne de
    // celui-ci.
    await page.setViewportSize({ width: 390, height: 844 })
    await ouvrir(page, "bistrot")
    const texte = await page.locator("body").innerText()
    for (const demo of ["Le Bistrot Parisien", "Entrecôte 300g", "32€", "Foie gras poêlé", "18€", "🌟 Recommandé"]) {
      expect(texte, `« ${demo} » vient du modèle de démonstration`).not.toContain(demo)
    }
  })

  test("un établissement sans carte n'affiche pas de carte", async ({ page }) => {
    // Le Comptoir Express n'a ni horaires, ni plats, ni réservation relevés.
    // La page doit rester honnête ET rester une page.
    await page.setViewportSize({ width: 390, height: 844 })
    await ouvrir(page, "rapide")
    const texte = await page.locator("body").innerText()
    expect(texte).toContain("Le Comptoir Express")
    expect(texte).toContain("Reims")
    // Le bandeau annonce les trous plutôt que de les combler.
    await expect(page.getByTestId("bandeau-non-officiel")).toContainText("À compléter")
  })
})
