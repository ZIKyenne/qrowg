import { test, expect } from "@playwright/test"

// Audit UX v2 (SECT-005, 22 nov.) : un code de porte tapé en texte libre dans un
// livret d'accueil s'affiche en clair à quiconque scanne le QR. La fenêtre
// « Publier » le signale et renvoie vers le champ « Code », masqué sur la page.

function brouillon() {
  const bloc = (i: number, type: string, content: Record<string, string>) => ({ id: `local-${i}`, type, content, visible: true, draft: false, locked: false })
  return {
    v: 1, savedAt: Date.now(), pageName: "Gîte des Tilleuls", theme: null, templateKey: "sejour_gite",
    blocks: [
      bloc(0, "profile", { name: "Gîte des Tilleuls", tagline: "Bienvenue" }),
      bloc(1, "infos_sejour", { title: "Votre séjour", arrivee: "À partir de 16 h", acces: "Digicode 4521, puis la porte de gauche." }),
    ],
  }
}

test("un digicode écrit en clair est signalé avant de publier", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "fenêtre Publier de bureau")
  await page.goto("/creer", { waitUntil: "domcontentloaded" })
  await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  await page.goto("/dashboard/builder?draft=1", { waitUntil: "domcontentloaded" })
  await expect(page.getByLabel("Nom de la page").first()).toHaveValue("Gîte des Tilleuls", { timeout: 30_000 })

  await page.getByRole("button", { name: /^Publier/ }).first().click()
  const liste = page.getByRole("status").filter({ hasText: "à vérifier avant de publier" })
  await expect(liste).toBeVisible()
  await expect(liste).toContainText("Code d'accès écrit en clair (« Digicode 4521 »)")
  await expect(liste).toContainText("champ « Code » du bloc Infos séjour")
  await liste.screenshot({ path: `test-results/code-en-clair-${info.project.name}.png` })
})
