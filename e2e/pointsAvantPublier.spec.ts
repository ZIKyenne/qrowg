import { test, expect } from "@playwright/test"

// Audit du 14 novembre 2026 (D5/D6) : le modèle publié tel quel partait avec ses
// plats et prix fictifs, et une action principale sans lien. Le panneau
// « Publier » le dit, en tête l'action principale, et chaque ligne a « Masquer ».

function brouillon() {
  const bloc = (i: number, type: string, content: Record<string, string>) => ({ id: `local-${i}`, type, content, visible: true, draft: false, locked: false })
  return {
    v: 1, savedAt: Date.now(), pageName: "Bistrot français", theme: null, templateKey: "resto_bistrot",
    blocks: [
      bloc(0, "profile", { name: "Le Bistrot Parisien", tagline: "Cuisine française maison depuis 1985" }),
      bloc(1, "table_booking", { label: "Réserver une table", platform: "TheFork" }),
      bloc(2, "menu_section", { category: "Entrées", item1_name: "Foie gras poêlé", item1_price: "18€", item2_name: "Soupe à l'oignon", item2_price: "12€" }),
    ],
  }
}

test("le panneau Publier liste action principale et valeurs d'exemple, et masque un bloc", async ({ page }, info) => {
  // La fenêtre « Publier » de bureau ; sur téléphone, la coquille mobile a son propre chemin.
  test.skip(info.project.name === "mobile", "fenêtre Publier de bureau")
  await page.goto("/creer", { waitUntil: "domcontentloaded" })
  await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  await page.goto("/dashboard/builder?draft=1", { waitUntil: "domcontentloaded" })
  await expect(page.getByLabel("Nom de la page").first()).toHaveValue("Bistrot français", { timeout: 30_000 })

  await page.getByRole("button", { name: /^Publier/ }).first().click()
  const liste = page.getByRole("status").filter({ hasText: "à vérifier avant de publier" })
  await expect(liste).toBeVisible()
  const lignes = liste.locator("li")
  await expect(lignes.first()).toContainText("Action principale « Réserver une table » sans lien")
  await expect(liste).toContainText("« Foie gras poêlé », « 18€ »")
  await expect(liste).toContainText("Le Bistrot Parisien")
  await liste.screenshot({ path: `test-results/points-avant-publier-${info.project.name}.png` })

  // « Masquer » retire le bloc de la page : l'alerte d'action principale disparaît.
  await lignes.first().getByRole("button", { name: /^Masquer le bloc/ }).click()
  await expect(liste).not.toContainText("Action principale")
})
