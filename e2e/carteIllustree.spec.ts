import { test, expect, type Page } from "@playwright/test"
import { collect, problems } from "./helpers/collect"

// Lot fast-food (18 nov.) : la « Carte illustrée » telle qu'un client la voit en
// scannant — sur le banc d'un snack fictif (/e2e-harness/carte-illustree).

const BANC = "/e2e-harness/carte-illustree"
const ouvrir = async (page: Page, q = "") => {
  await page.goto(BANC + q, { waitUntil: "networkidle", timeout: 120_000 })
  await expect(page.locator("[data-carte-illustree]")).toBeVisible()
}

test.describe("la carte illustrée", () => {
  test("produits, badges, catégories avec leur compte — sans erreur", async ({ page }) => {
    const c = collect(page)
    await ouvrir(page)
    await expect(page.locator("[data-produit]")).toHaveCount(10)
    const nav = page.getByRole("navigation", { name: "Catégories de la carte" })
    await expect(nav.getByRole("button")).toHaveText([/^Sandwiches\s*3$/, /^Burgers\s*2$/, /^Assiettes\s*1$/, /^Accompagnements\s*1$/, /^Desserts\s*1$/, /^Boissons\s*2$/])
    await expect(page.getByText("N°1 des ventes").first()).toBeVisible()
    expect(problems(c), problems(c).join("\n")).toEqual([])
  })

  test("une pastille mène à sa section, et s'allume", async ({ page }) => {
    await ouvrir(page)
    const boissons = page.getByRole("navigation", { name: "Catégories de la carte" }).getByRole("button", { name: /Boissons/ })
    await boissons.click()
    await expect(boissons).toHaveAttribute("aria-current", "true")
    await expect(page.locator('[id$="-boissons"]')).toBeInViewport()
  })

  test("la recherche trouve sans accent, et dit quand rien ne correspond", async ({ page }) => {
    await ouvrir(page)
    const champ = page.getByRole("searchbox", { name: "Rechercher dans la carte" })
    await champ.fill("epice")
    await expect(page.locator("[data-produit]")).toHaveCount(1)
    await expect(page.getByText("Tacos XL")).toBeVisible()
    await champ.fill("pizza")
    await expect(page.getByText(/Aucun produit ne correspond/)).toBeVisible()
    await page.getByRole("button", { name: "Voir toute la carte" }).click()
    await expect(page.locator("[data-produit]")).toHaveCount(10)
  })

  test("la fiche s'ouvre au toucher, se ferme à Échap et à côté", async ({ page }) => {
    await ouvrir(page)
    await page.locator('[data-produit="1"]').click()
    const fiche = page.getByRole("dialog", { name: "Sandwich grec" })
    await expect(fiche).toBeVisible()
    await expect(fiche.getByText("Frites dans le pain")).toBeVisible()
    await expect(fiche.getByText("1,50 €")).toBeVisible()
    await expect(fiche.getByText("sésame")).toBeVisible()
    // Centrée : autant de marge à gauche qu'à droite.
    const b = (await fiche.boundingBox())!
    const vw = page.viewportSize()!.width
    expect(Math.abs(b.x - (vw - b.x - b.width)), "fiche centrée").toBeLessThan(3)
    await page.keyboard.press("Escape")
    await expect(fiche).toBeHidden()
    await page.locator('[data-produit="1"]').click()
    await expect(fiche).toBeVisible()
    await page.mouse.click(4, 4)  // le voile
    await expect(fiche).toBeHidden()
  })

  test("un produit sans rien de plus que sa ligne n'ouvre pas de fiche", async ({ page }) => {
    await ouvrir(page)
    const coca = page.locator('[data-produit="9"]')
    expect(await coca.evaluate(e => e.tagName)).toBe("DIV")
  })

  test("au téléphone : rien ne déborde, et tout se vise au doigt", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "mesure au téléphone")
    for (const q of ["", "?grille=1", "?theme=clair"]) {
      await ouvrir(page, q)
      const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(debord, `débordement ${q}`).toBeLessThanOrEqual(1)
      const petits = await page.evaluate(() => [...document.querySelectorAll("[data-carte-illustree] button, [data-carte-illustree] input")]
        .map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height < 44).length)
      expect(petits, `commandes sous 44 px ${q}`).toBe(0)
    }
  })
})

test("l'éditeur : coller une carte depuis un tableur ajoute les produits à la suite", async ({ page }) => {
  await page.goto("/e2e-harness/menu-editor?type=carte_illustree", { waitUntil: "networkidle", timeout: 120_000 })
  await expect(async () => {
    await page.getByRole("button", { name: /Importer depuis un tableur/ }).click()
    await expect(page.getByLabel("Menu collé depuis un tableur")).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15000 })
  await page.getByLabel("Menu collé depuis un tableur").fill(
    "Sandwich grec\t8,50 €\tViande grillée\tSandwiches\nCheeseburger\t6,50 €\t\tBurgers\nFrites\t3 €\t\tAccompagnements")
  await page.getByRole("button", { name: "Ajouter les produits" }).click()
  await expect(page.getByText(/3\s+produits ajoutés à la suite/)).toBeVisible()
  await expect(page.getByPlaceholder("Sandwich grec").nth(2)).toHaveValue("Frites")
  await expect(page.getByPlaceholder("Sandwiches, Burgers, Boissons…").nth(1)).toHaveValue("Burgers")
  // Un second collage s'ajoute APRÈS, sans écraser.
  await page.getByLabel("Menu collé depuis un tableur").fill("Tiramisu\t4 €\t\tDesserts")
  await page.getByRole("button", { name: "Ajouter les produits" }).click()
  await expect(page.getByPlaceholder("Sandwich grec").nth(0)).toHaveValue("Sandwich grec")
  await expect(page.getByPlaceholder("Sandwich grec").nth(3)).toHaveValue("Tiramisu")
})

test("la barre de recherche et de catégories reste collée en haut en défilant", async ({ page }) => {
  await page.goto("/e2e-harness/carte-illustree", { waitUntil: "networkidle", timeout: 120_000 })
  await page.evaluate(() => window.scrollTo(0, 900))
  const haut = await page.getByRole("navigation", { name: "Catégories de la carte" }).evaluate(e => e.getBoundingClientRect().top)
  expect(haut, "la barre a quitté l'écran : un ancêtre casse `position: sticky`").toBeGreaterThanOrEqual(0)
  expect(haut).toBeLessThan(80)
})
