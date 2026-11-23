import { test, expect, type Page } from "@playwright/test"
import { collect, problems } from "./helpers/collect"

// 19 nov. — quatre blocs pour diversifier les modèles bars et restaurants :
// Wi-Fi, Plat du jour, Happy hour, Carte des boissons. Banc générique
// /e2e-harness/bloc?type=… (données d'exemple de blocks/fixtures, ?c= surcharge).

const banc = (page: Page, type: string, c?: Record<string, string>) =>
  page.goto(`/e2e-harness/bloc?type=${type}${c ? `&c=${encodeURIComponent(JSON.stringify(c))}` : ""}`, { waitUntil: "networkidle", timeout: 120_000 })

test.describe("Wi-Fi", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] })
  test("le mot de passe est masqué, s'affiche, et se copie d'un geste", async ({ page, browserName }, info) => {
    const c = collect(page)
    await banc(page, "wifi")
    const bloc = page.locator("[data-wifi]")
    await expect(bloc.getByText("Bistrot-Invités")).toBeVisible()
    const mdp = bloc.locator("[data-mot-de-passe]")
    await expect(mdp).not.toHaveText("cafe2026")
    await bloc.getByRole("button", { name: "Afficher" }).click()
    await expect(mdp).toHaveText("cafe2026")
    await expect(bloc.getByRole("button", { name: "Masquer" })).toHaveAttribute("aria-pressed", "true")
    if (browserName === "chromium" && info.project.name === "desktop") {
      await bloc.getByRole("button", { name: "Copier le mot de passe" }).click()
      await expect(bloc.getByRole("button", { name: "✓ Copié" })).toBeVisible()
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("cafe2026")
    }
    expect(problems(c)).toEqual([])
  })
  test("un réseau sans mot de passe le dit, sans bouton inutile", async ({ page }) => {
    await banc(page, "wifi", { password: "" })
    await expect(page.getByText("Réseau ouvert, sans mot de passe.")).toBeVisible()
    await expect(page.locator("[data-wifi] button")).toHaveCount(0)
  })
})

test.describe("Plat du jour", () => {
  test("« jusqu'à nouvel ordre » : l'ardoise se lit, plats et prix", async ({ page }) => {
    await banc(page, "plat_du_jour")
    const a = page.locator("[data-ardoise]")
    await expect(a).toHaveAttribute("data-ardoise", "permanente")
    await expect(a.getByText("Blanquette de veau")).toBeVisible()
    await expect(a.getByText("14,00 €")).toBeVisible()   // vague 2 : « 14 € » s'affiche « 14,00 € »
  })
  test("une ardoise d'un autre jour n'apparaît PAS — jamais d'ardoise périmée", async ({ page }) => {
    await banc(page, "plat_du_jour", { validite: "Aujourd'hui seulement", date: "2020-01-01" })
    await expect(page.locator("[data-banc-bloc]")).toBeVisible()
    await expect(page.locator("[data-ardoise]")).toHaveCount(0)
  })
  test("datée du jour (au jour du commerce) : elle apparaît, avec la date", async ({ page }) => {
    const aujourdhui = await page.evaluate(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()))
    await banc(page, "plat_du_jour", { validite: "Aujourd'hui seulement", date: aujourdhui })
    await expect(page.locator("[data-ardoise]")).toHaveAttribute("data-ardoise", "a_jour")
  })
})

test.describe("Happy hour", () => {
  test("offres avec prix barré, et un statut calculé à l'heure du commerce", async ({ page }) => {
    await banc(page, "happy_hour")
    const h = page.locator("[data-happy-hour]")
    await expect(h.getByText("Toutes les pintes à 5 €")).toBeVisible()
    await expect(h.getByText("Pinte blonde")).toBeVisible()
    await expect(h.locator("[data-statut-happy]")).toHaveText(/^(En cours · jusqu'à 20h|Dans \d+ min|Aujourd'hui à 17h|Demain à 17h)$/)
  })
  test("un créneau illisible : pas de badge inventé", async ({ page }) => {
    await banc(page, "happy_hour", { creneau: "le soir" })
    await expect(page.locator("[data-happy-hour]")).toBeVisible()
    await expect(page.locator("[data-statut-happy]")).toHaveCount(0)
  })
})

test.describe("Carte des boissons", () => {
  test("des tableaux par rubrique, aux colonnes nommées", async ({ page }) => {
    await banc(page, "carte_boissons")
    const t = page.locator("[data-carte-boissons]")
    await expect(t.getByRole("table")).toHaveCount(3)
    const rouges = t.getByRole("table", { name: "Rouges" })
    await expect(rouges.getByRole("columnheader", { name: "Verre" })).toBeVisible()
    await expect(rouges.getByRole("columnheader", { name: "Bouteille" })).toBeVisible()
    await expect(rouges.getByRole("rowheader", { name: /Saint-Joseph/ })).toBeVisible()
    // Les cocktails n'ont qu'un prix : pas de colonne « Bouteille » vide.
    await expect(t.getByRole("table", { name: "Cocktails" }).getByRole("columnheader", { name: "Bouteille" })).toHaveCount(0)
  })
  test("des colonnes « 25 cl / 50 cl » pour une brasserie", async ({ page }) => {
    await banc(page, "carte_boissons", { col1: "25 cl", col2: "50 cl" })
    await expect(page.getByRole("table", { name: "Rouges" }).getByRole("columnheader", { name: "50 cl" })).toBeVisible()
  })
})

test("au téléphone : rien ne déborde, tout se vise au doigt", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "mesure au téléphone")
  for (const type of ["wifi", "plat_du_jour", "happy_hour", "carte_boissons"]) {
    await banc(page, type)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), type).toBeLessThanOrEqual(1)
    const petits = await page.evaluate(() => [...document.querySelectorAll("[data-banc-bloc] button")].filter(e => e.getBoundingClientRect().height < 44).length)
    expect(petits, type).toBe(0)
  }
})
