import { test, expect, type Page } from "@playwright/test"

// Garde (20 nov.) — l'écran « Modifier » au téléphone, sur l'éditeur que voient
// les clients (coquille redessinée éteinte), en mode invité.
//   1. Le bouton d'une page neuve : « Appel » + un numéro tapé comme sur une carte
//      de visite suffisent — plus de `tel:` à connaître. Le bouton devient publiable.
//   2. Réseaux sociaux : Instagram d'un toucher, un pseudo suffit, et le clavier
//      reste dans le champ pendant la frappe.
//   3. L'en-tête du bloc tient sur une ligne (plus de « Propriétés » + description).

async function ouvrir(page: Page) {
  await page.addInitScript(() => {
    const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"
    document.addEventListener("DOMContentLoaded", () => document.documentElement.appendChild(s))
  })
  await page.goto("/dashboard/builder/new?builderRedesign=0", { waitUntil: "networkidle", timeout: 120_000 })
  await expect(page.locator("[data-block-id]").nth(2)).toBeVisible({ timeout: 30_000 })
  const passer = page.getByRole("button", { name: "Passer" })
  if (await passer.isVisible().catch(() => false)) await passer.click()
}

async function toucherBloc(page: Page, i: number) {
  const b = (await page.locator("[data-block-id]").nth(i).boundingBox())!
  await page.touchscreen.tap(b.x + b.width / 2, b.y + Math.min(20, b.height / 2))
  await expect(page.getByRole("button", { name: /^Modifier$/ })).toHaveAttribute("aria-current", "page")
}

test.beforeEach(({}, ti) => { test.skip(ti.project.name !== "mobile", "écran Modifier au téléphone"); test.setTimeout(150_000) })

test("bouton : Appel + numéro = bouton publiable", async ({ page }) => {
  await ouvrir(page)
  await toucherBloc(page, 2)
  await expect(page.getByText("Bouton d'action").filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText(/^Propriétés$/i)).toHaveCount(0)
  await expect(page.getByText(/ne mène nulle part/).filter({ visible: true }).first()).toBeVisible()
  await page.getByRole("group", { name: /type de destination/ }).getByRole("button", { name: "Appel" }).click()
  const champ = page.getByRole("textbox", { name: /Appel/ })
  await expect(champ).toHaveAttribute("inputmode", "tel")
  await champ.fill("06 12 34 56 78")
  await expect(page.getByText(/ne mène nulle part/).filter({ visible: true })).toHaveCount(0)
  // Revenu sur la page : l'avertissement « n'a pas de lien » a disparu du bouton.
  await page.getByRole("button", { name: /^Page$/ }).click()
  await expect(page.getByText(/n.a pas de lien/).filter({ visible: true })).toHaveCount(0)
})

test("réseaux : Instagram d'un toucher, le clavier reste pendant la frappe", async ({ page }) => {
  await ouvrir(page)
  await page.getByRole("button", { name: /^Blocs$/ }).click()
  await page.getByText("Réseaux sociaux", { exact: true }).first().click()
  await expect(page.getByRole("button", { name: /^Modifier$/ })).toHaveAttribute("aria-current", "page")
  // Le choix d'affichage actif se voit.
  await expect(page.getByRole("group", { name: "Affichage" }).getByRole("button", { name: "Liste" })).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("group", { name: "Réseaux courants" }).getByRole("button", { name: /Instagram/ }).click()
  const champ = page.locator(".reseau-en-cours input").first()
  await expect(champ).toBeFocused()
  await page.keyboard.type("@monresto", { delay: 30 })
  await expect(champ).toBeFocused()
  await expect(champ).toHaveValue("@monresto")
  // Plus proposé dans les raccourcis une fois ajouté.
  await expect(page.getByRole("group", { name: "Réseaux courants" }).getByRole("button", { name: /Instagram/ })).toHaveCount(0)
})
