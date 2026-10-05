import { test, expect } from "@playwright/test"

// fenetreQuiDevientFeuille — M04.
//
// ── Ce qu'on prouve, et pourquoi au navigateur ────────────────────────────
//
// `Modal` rend une feuille montante sous la rupture `md` (640 px) et sa boîte
// centrée au-dessus. Un test de source dirait seulement que le code CONTIENT
// les deux branches. Seul un navigateur dit laquelle sort, à quelle largeur, et
// si le desktop a bougé.
//
// Le banc `/e2e-harness/primitives-ui` monte la page de revue du design system :
// c'est le seul endroit où une fenêtre s'ouvre sans authentification.
//
// ── Ce que ce fichier ne mesure pas ───────────────────────────────────────
//
// Le confort du glissement, l'inertie, le clavier natif. Chromium en mode
// tactile ne les reproduit pas. Ils restent du ressort d'un vrai téléphone
// (lot M27).

const BANC = "/e2e-harness/primitives-ui"

/**
 * Ouvre la fenêtre de démonstration, en tolérant l'hydratation.
 *
 * Première version : `goto` puis `click`. Elle a échoué, et pas à cause du
 * produit — une sonde a montré la feuille parfaitement rendue au même endroit.
 * En `next dev`, la première requête sur une route la COMPILE : le HTML arrive
 * avant que React ne soit branché, et le bouton — visible, actif, donc
 * « actionnable » pour Playwright — n'a pas encore son gestionnaire. Le clic
 * part dans le vide.
 *
 * On réessaie donc jusqu'à ce que la fenêtre s'ouvre réellement. C'est la seule
 * façon honnête : attendre un délai fixe marcherait sur cette machine et
 * échouerait sur une plus lente.
 */
async function ouvrirLaFenetre(page: import("@playwright/test").Page) {
  const bouton = page.getByRole("button", { name: "Ouvrir la modale" })
  await expect(bouton).toBeVisible()
  await expect(async () => {
    await bouton.click()
    await expect(page.getByRole("dialog").filter({ hasText: "Supprimer cette page" }))
      .toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 30_000 })
}

test.describe("une fenêtre devient une feuille sur un téléphone", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 })

  test("à 390 px : feuille montante, ancrée en bas, avec poignée", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BANC, { waitUntil: "domcontentloaded" })

    await ouvrirLaFenetre(page)

    const feuille = page.getByTestId("mobile-sheet")
    await expect(feuille, "sous 640 px, la fenêtre doit être une feuille").toBeVisible()
    await expect(page.getByTestId("mobile-sheet-handle")).toBeVisible()

    // Ancrée en bas : son bord inférieur touche celui de la fenêtre. C'est la
    // différence concrète avec une boîte centrée, et elle se mesure.
    const boite = await feuille.boundingBox()
    expect(boite, "la feuille doit avoir une boîte").not.toBeNull()
    expect(Math.abs((boite!.y + boite!.height) - 844), "la feuille n'est pas collée en bas").toBeLessThanOrEqual(2)

    // Elle prend toute la largeur : aucune marge perdue de part et d'autre.
    expect(boite!.width, "la feuille doit occuper toute la largeur").toBeGreaterThanOrEqual(386)

    // Une fenêtre a UNE taille utile : pas de boutons de palier.
    await expect(page.locator('[data-snap-btn]')).toHaveCount(0)
  })

  test("à 390 px : elle est une vraie fenêtre, pas un simple panneau", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BANC, { waitUntil: "domcontentloaded" })
    await ouvrirLaFenetre(page)

    const feuille = page.getByTestId("mobile-sheet")
    await expect(feuille).toHaveAttribute("aria-modal", "true")
    await expect(feuille).toHaveAttribute("role", "dialog")

    // Nommée par son titre VISIBLE, pas par une étiquette recopiée à côté.
    const nomme = await feuille.getAttribute("aria-labelledby")
    expect(nomme, "la feuille doit être nommée par son titre").toBeTruthy()
    // Sélecteur d attribut, pas `#id` : `useId` rend des identifiants du genre
    // `«r1»` ou `:r1:`, invalides en sélecteur CSS brut — et `CSS.escape` n existe
    // pas côté Node, où tourne ce fichier.
    await expect(page.locator(`[id="${nomme}"]`)).toBeVisible()

    // Échap ferme — le chemin clavier, puisque le voile est décor.
    await page.keyboard.press("Escape")
    await expect(feuille).toHaveCount(0)
  })

  test("à 1280 px : la boîte centrée, inchangée", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(BANC, { waitUntil: "domcontentloaded" })
    await ouvrirLaFenetre(page)

    // Aucune feuille : c'est la non-régression du bureau.
    await expect(page.getByTestId("mobile-sheet")).toHaveCount(0)

    const boite = page.getByRole("dialog")
    await expect(boite).toBeVisible()
    const b = await boite.boundingBox()
    // Centrée verticalement : elle ne touche NI le haut NI le bas.
    expect(b!.y, "la boîte ne doit pas être collée en haut").toBeGreaterThan(20)
    expect(900 - (b!.y + b!.height), "la boîte ne doit pas être collée en bas").toBeGreaterThan(20)
  })

  test("le voile ferme au doigt, et ne masque pas la fenêtre aux lecteurs d'écran", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BANC, { waitUntil: "domcontentloaded" })
    await ouvrirLaFenetre(page)

    // Le voile est décor (`aria-hidden`) et FRÈRE du panneau. S'il en était le
    // parent, cet attribut aurait masqué le dialogue entier aux lecteurs
    // d'écran — c'est ce que `clicQuiSAtteintAuClavier` a attrapé en M06.
    const voile = page.getByTestId("mobile-sheet-backdrop")
    await expect(voile).toHaveAttribute("aria-hidden", "true")
    await expect(page.getByTestId("mobile-sheet")).toBeVisible()

    await voile.click({ position: { x: 10, y: 10 } })
    await expect(page.getByTestId("mobile-sheet")).toHaveCount(0)
  })
})
