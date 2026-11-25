import { test, expect } from "@playwright/test"

// L'étiquette du bloc sélectionné (« 📄 Texte ») était posée À L'INTÉRIEUR du
// bloc (bottom: 6). Sur un paragraphe d'une ligne, elle couvrait le début du
// texte qu'on venait de choisir (relevé du 25 nov., captures de v380). Elle est
// maintenant à cheval sur le bord bas, et ne prend pas les clics : elle désigne,
// elle n'agit pas. Repère dans BuilderV4 : `data-etiquette-bloc`.
//
// Et quand l'inspecteur est ouvert à côté, elle n'apparaît pas : son en-tête
// (« Propriétés · 📄 Texte ») dit déjà la même chose, et une étiquette
// extérieure empiète forcément sur le bloc voisin quand deux blocs se touchent.

function brouillon() {
  const bloc = (i: number, type: string, content: Record<string, string>) => ({ id: `local-${i}`, type, content, visible: true, draft: false, locked: false })
  return {
    v: 1, savedAt: Date.now(), pageName: "Étiquette", theme: null,
    blocks: [
      bloc(0, "profile", { name: "Le Comptoir", tagline: "Cuisine de saison" }),
      bloc(1, "rich_text", { text: "Premier paragraphe" }),
      bloc(2, "rich_text", { text: "Second paragraphe" }),
    ],
  }
}

test("l'étiquette du bloc sélectionné ne couvre pas son texte", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "canevas de bureau")
  await page.goto("/creer", { waitUntil: "domcontentloaded" })
  await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  await page.goto("/dashboard/builder?draft=1", { waitUntil: "domcontentloaded" })
  await expect(page.getByLabel("Nom de la page").first()).toHaveValue("Étiquette", { timeout: 30_000 })
  const guide = page.getByRole("dialog", { name: "Bienvenue dans votre éditeur" })
  await guide.getByRole("button", { name: "Passer" }).click()
  await expect(guide).toHaveCount(0)

  const bloc = page.locator('[data-block-id="local-1"]').first()
  await bloc.click()
  const etiquette = bloc.locator("[data-etiquette-bloc]")
  // Inspecteur ouvert : le nom du bloc est dans son en-tête, pas sur le canevas.
  await expect(page.getByText("Paragraphe de texte libre")).toBeVisible()
  await expect(etiquette).toHaveCount(0)

  // Panneau replié : l'étiquette revient, et reste hors du texte.
  await page.getByRole("button", { name: "Réduire le panneau" }).click()
  await expect(etiquette).toContainText("Texte")

  const texte = await bloc.getByText("Premier paragraphe").boundingBox()
  const marque = await etiquette.boundingBox()
  expect(texte && marque, "les deux sont rendus").toBeTruthy()
  const seCroisent = !(marque!.x + marque!.width <= texte!.x || texte!.x + texte!.width <= marque!.x
    || marque!.y + marque!.height <= texte!.y || texte!.y + texte!.height <= marque!.y)
  expect(seCroisent, "l'étiquette chevauche le texte du bloc").toBe(false)
  await expect(etiquette).toHaveCSS("pointer-events", "none")
  await bloc.screenshot({ path: `test-results/etiquette-du-bloc-${info.project.name}.png` })
})
