import { test, expect } from "@playwright/test"

// La barre de sélection multiple est sortie de BuilderV4 dans
// BarreMultiSelection.tsx (vague 4, point 6). Aucun test navigateur ne
// l'exerçait : celui-ci joue le geste entier, de la sélection à la sortie.

function brouillon() {
  const bloc = (i: number, type: string, content: Record<string, string>) => ({ id: `local-${i}`, type, content, visible: true, draft: false, locked: false })
  return {
    v: 1, savedAt: Date.now(), pageName: "Sélection multiple", theme: null,
    blocks: [
      bloc(0, "profile", { name: "Le Comptoir", tagline: "Cuisine de saison" }),
      bloc(1, "rich_text", { text: "Premier paragraphe" }),
      bloc(2, "rich_text", { text: "Second paragraphe" }),
    ],
  }
}

test("Maj+clic sélectionne deux blocs : la barre les compte, masque, se ferme", async ({ page }, info) => {
  // Maj+clic sur le canevas de bureau ; le téléphone a sa propre coquille.
  test.skip(info.project.name === "mobile", "sélection multiple de bureau")
  await page.goto("/creer", { waitUntil: "domcontentloaded" })
  await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  await page.goto("/dashboard/builder?draft=1", { waitUntil: "domcontentloaded" })
  await expect(page.getByLabel("Nom de la page").first()).toHaveValue("Sélection multiple", { timeout: 30_000 })

  // Premier passage sans modèle : le guide de bienvenue couvre le canevas.
  const guide = page.getByRole("dialog", { name: "Bienvenue dans votre éditeur" })
  await guide.getByRole("button", { name: "Passer" }).click()
  await expect(guide).toHaveCount(0)

  const bloc = (id: string) => page.locator(`[data-block-id="${id}"]`).first()
  await bloc("local-1").click()
  await bloc("local-2").click({ modifiers: ["Shift"] })

  const barre = page.locator("[data-barre-collante]").filter({ hasText: "blocs sélectionnés" })
  await expect(barre).toBeVisible()
  await expect(barre).toContainText("2 blocs sélectionnés")
  await barre.screenshot({ path: `test-results/selection-multiple-${info.project.name}.png` })

  // « Masquer » agit sur les deux blocs : la barre propose alors « Afficher ».
  await barre.getByRole("button", { name: "Masquer" }).click()
  await expect(barre.getByRole("button", { name: "Afficher" })).toBeVisible()
  await barre.getByRole("button", { name: "Afficher" }).click()
  await expect(barre.getByRole("button", { name: "Masquer" })).toBeVisible()

  // Le × vide la sélection : la barre disparaît.
  await barre.getByTitle("Désélectionner (Échap)").click()
  await expect(barre).toHaveCount(0)
})
