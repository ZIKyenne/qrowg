import { test, expect, type Page } from "@playwright/test"

// ═══════════════════════════════════════════════════════════════════════════════
// Q04 / Q05 — LE CHOIX DU VISITEUR DOIT LUI SURVIVRE.
//
// Q04 : sur /examples, « Utiliser » menait à /creer?metier=Bar — une galerie de
// 48 cartes où il fallait retrouver soi-même le modèle qu'on venait de regarder.
// Q05 : « QR code artisan » et « QR code garage » envoyaient chez les consultants,
// « QR code association » nulle part en particulier, hôtel et camping chez les
// restaurateurs.
//
// Ce que ce fichier mesure, que les gardes unitaires ne mesurent pas : le
// PARCOURS, du clic de la vitrine jusqu'à la fenêtre qui s'ouvre dans la galerie.
// ═══════════════════════════════════════════════════════════════════════════════

const FENETRE = "Créer une page depuis ce modèle"

/** La galerie n'est comparable qu'une fois hydratée (voir `data-galerie`). */
async function galeriePrete(page: Page) {
  await expect(page.locator('[data-galerie="prete"]')).toBeAttached({ timeout: 30_000 })
}

test.describe("Q04 — d'un exemple public au bon modèle", () => {
  test("« Utiliser » ouvre le modèle qu'on venait de regarder", async ({ page }, testInfo) => {
    await page.goto("/examples", { waitUntil: "domcontentloaded" })

    const carte = page.locator("article.ex-card").first()
    await expect(carte).toBeVisible({ timeout: 30_000 })
    const nomDuModele = (await carte.locator("h2").innerText()).trim()

    const utiliser = carte.getByRole("link", { name: "Utiliser" })
    // Le lien porte le modèle, pas seulement le rayon — c'était tout le défaut.
    await expect(utiliser).toHaveAttribute("href", /[?&]modele=[a-z0-9_]+/)

    await utiliser.click()
    await galeriePrete(page)

    // On arrive sur l'étape « personnaliser », pas devant 48 cartes.
    const fenetre = page.getByRole("dialog", { name: FENETRE })
    await expect(fenetre).toBeVisible({ timeout: 30_000 })
    // Et c'est bien LE modèle regardé : son nom est déjà dans le champ.
    await expect(fenetre.getByLabel("Nom du projet")).toHaveValue(nomDuModele)

    await testInfo.attach(`q04-${testInfo.project.name}`, { body: await page.screenshot(), contentType: "image/png" })
  })

  test("refermer la fenêtre laisse la galerie, pas un cul-de-sac", async ({ page }) => {
    await page.goto("/examples", { waitUntil: "domcontentloaded" })
    const carte = page.locator("article.ex-card").first()
    await expect(carte).toBeVisible({ timeout: 30_000 })
    await carte.getByRole("link", { name: "Utiliser" }).click()
    await galeriePrete(page)

    const fenetre = page.getByRole("dialog", { name: FENETRE })
    await expect(fenetre).toBeVisible({ timeout: 30_000 })
    await page.keyboard.press("Escape")
    await expect(fenetre).toBeHidden()
    // La galerie est là, avec ses cartes : le contexte n'a pas été perdu.
    await expect(page.locator("[data-mini-dessine]").first()).toBeVisible({ timeout: 30_000 })
  })

  test("un identifiant inconnu ne casse rien : la galerie reste la galerie", async ({ page }) => {
    await page.goto("/creer?modele=modele_qui_nexiste_pas&metier=Bar", { waitUntil: "domcontentloaded" })
    await galeriePrete(page)
    await expect(page.locator("[data-mini-dessine]").first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole("dialog", { name: FENETRE })).toHaveCount(0)
  })
})

test.describe("Q05 — chaque page par usage mène là où elle promet", () => {
  for (const [usage, attendu] of [["artisan", "metier=Artisan"], ["garage", "metier=Artisan"], ["association", "metier=Association"]] as const) {
    test(`« QR code ${usage} » mène au bon rayon`, async ({ page }) => {
      await page.goto(`/qr-code/${usage}`, { waitUntil: "domcontentloaded" })
      const cta = page.getByRole("link", { name: "Composer ma page" }).first()
      await expect(cta).toBeVisible({ timeout: 30_000 })
      await expect(cta).toHaveAttribute("href", new RegExp(attendu.replace("=", "=")))
    })
  }

  test("hôtel ouvre le gîte, pas la carte d'un restaurant", async ({ page }) => {
    await page.goto("/qr-code/hotel", { waitUntil: "domcontentloaded" })
    const cta = page.getByRole("link", { name: "Composer ma page" }).first()
    await expect(cta).toHaveAttribute("href", /modele=studio_gite/)
    await cta.click()
    await galeriePrete(page)
    const fenetre = page.getByRole("dialog", { name: FENETRE })
    await expect(fenetre).toBeVisible({ timeout: 30_000 })
    await expect(fenetre.getByLabel("Nom du projet")).toHaveValue(/[Gg]îte/)
  })
})
