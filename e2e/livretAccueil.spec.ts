import { test, expect, type Page } from "@playwright/test"
import { collect, problems } from "./helpers/collect"

// 19 nov. — le livret d'accueil (hôtel, gîte, location) : infos séjour,
// équipements, bonnes adresses, numéros utiles. Banc générique /e2e-harness/bloc.

const banc = (page: Page, type: string, c?: Record<string, string>) =>
  page.goto(`/e2e-harness/bloc?type=${type}${c ? `&c=${encodeURIComponent(JSON.stringify(c))}` : ""}`, { waitUntil: "networkidle", timeout: 120_000 })

test("infos séjour : arrivée, départ, et le code masqué jusqu'à « Afficher le code »", async ({ page }) => {
  const c = collect(page)
  await banc(page, "infos_sejour")
  const b = page.locator("[data-infos-sejour]")
  await expect(b.getByText("À partir de 16 h")).toBeVisible()
  await expect(b.getByText("Avant 11 h")).toBeVisible()
  await expect(b.locator("[data-code]")).not.toHaveText("4821")
  await b.getByRole("button", { name: "Afficher le code" }).click()
  await expect(b.locator("[data-code]")).toHaveText("4821")
  await expect(b.getByRole("listitem").filter({ hasText: "Silence après 22 h" })).toBeVisible()
  expect(problems(c)).toEqual([])
})

test("équipements : ceux cochés, en icônes, plus les autres saisis", async ({ page }) => {
  await banc(page, "equipements")
  const items = page.locator("[data-equipements] li")
  await expect(items).toHaveCount(7)
  await expect(items.filter({ hasText: "Animaux acceptés" })).toBeVisible()
  await expect(items.filter({ hasText: "Vélos à disposition" })).toBeVisible()
})

test("bonnes adresses : par catégorie, avec un itinéraire qui mène à la carte", async ({ page }) => {
  await banc(page, "bonnes_adresses")
  const b = page.locator("[data-bonnes-adresses]")
  await expect(b.getByRole("heading", { name: /Restaurant/ })).toBeVisible()
  await expect(b.getByText("5 min à pied")).toBeVisible()
  const itineraire = b.getByRole("link", { name: "Itinéraire" }).first()
  await expect(itineraire).toHaveAttribute("href", /google\.com\/maps\/dir\/.*2%20quai%20du%20Port/)
  await expect(itineraire).toHaveAttribute("target", "_blank")
})

test("numéros utiles : l'hôte puis les VRAIS numéros d'urgence, appelables d'un geste", async ({ page }) => {
  await banc(page, "numeros_utiles")
  const b = page.locator("[data-numeros-utiles]")
  await expect(b.getByRole("link", { name: /Appeler : Votre hôte/ })).toHaveAttribute("href", "tel:0612345678")
  await expect(b.getByRole("link", { name: /Appeler : SAMU \(15\)/ })).toHaveAttribute("href", "tel:15")
  await expect(b.getByRole("link", { name: /Appeler : Urgences \(Europe\) \(112\)/ })).toBeVisible()
  // Le 114 s'écrit, il ne s'appelle pas.
  await expect(b.getByRole("link", { name: /Envoyer un SMS : .*\(114\)/ })).toHaveAttribute("href", "sms:114")
})

test("numéros utiles : sans urgences activées, aucun numéro inventé", async ({ page }) => {
  await banc(page, "numeros_utiles", { urgences: "Non" })
  await expect(page.locator("[data-numeros-utiles] li")).toHaveCount(1)
})

test("au téléphone : rien ne déborde, tout se vise au doigt", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "mesure au téléphone")
  for (const type of ["infos_sejour", "equipements", "bonnes_adresses", "numeros_utiles"]) {
    await banc(page, type)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), type).toBeLessThanOrEqual(1)
    const petits = await page.evaluate(() => [...document.querySelectorAll("[data-banc-bloc] button, [data-banc-bloc] a")].filter(e => e.getBoundingClientRect().height < 44).length)
    expect(petits, type).toBe(0)
  }
})
