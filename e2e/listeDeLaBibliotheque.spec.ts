import { test, expect } from "@playwright/test"

// La liste de la bibliothèque de blocs (colonne de gauche) est sortie de
// BuilderV4 dans ListeDeLaBibliotheque.tsx (vague 4, point 6). Ce test joue ce
// qu'elle fait, dans l'éditeur réel : chercher, ne rien trouver, effacer,
// parcourir une catégorie et ses sous-groupes, mettre en favori au clavier,
// ajouter un bloc à la page.

function brouillon() {
  const bloc = (i: number, type: string, content: Record<string, string>) => ({ id: `local-${i}`, type, content, visible: true, draft: false, locked: false })
  return {
    v: 1, savedAt: Date.now(), pageName: "Bibliothèque", theme: null,
    blocks: [bloc(0, "profile", { name: "Le Comptoir", tagline: "Cuisine de saison" })],
  }
}

test("la liste de la bibliothèque : recherche, catégorie, favori, ajout", async ({ page }, info) => {
  // La colonne de gauche est celle du bureau ; le téléphone a sa coquille.
  test.skip(info.project.name === "mobile", "bibliothèque de bureau")
  await page.goto("/creer", { waitUntil: "domcontentloaded" })
  await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  // ?builderRedesign=0 : la bibliothèque historique, celle que ce lot a déplacée.
  await page.goto("/dashboard/builder?draft=1&builderRedesign=0", { waitUntil: "domcontentloaded" })
  await expect(page.getByLabel("Nom de la page").first()).toHaveValue("Bibliothèque", { timeout: 30_000 })
  const guide = page.getByRole("dialog", { name: "Bienvenue dans votre éditeur" })
  await guide.getByRole("button", { name: "Passer" }).click()
  await expect(guide).toHaveCount(0)

  // À 1 280 px, la bibliothèque s'ouvre repliée en rail d'icônes : on la déplie.
  const deplier = page.getByRole("button", { name: "Déployer la bibliothèque de blocs" })
  if (await deplier.isVisible()) await deplier.click()

  const recherche = page.getByPlaceholder("Rechercher un bloc...")
  // Recherche : le résultat est groupé par catégorie et le mot cherché surligné.
  await recherche.fill("faq")
  const resultat = page.getByRole("button", { name: /^❓\s*FAQ/ }).first()
  await expect(resultat).toBeVisible()
  await expect(resultat.locator("mark").first()).toHaveText(/faq/i)

  // Rien trouvé : la phrase, puis « Effacer » vide le champ.
  await recherche.fill("zzzzqq")
  await expect(page.getByText("Aucun bloc trouvé")).toBeVisible()
  await page.getByRole("button", { name: "Effacer", exact: true }).last().click()
  await expect(recherche).toHaveValue("")

  // Catégorie Infos : ses sous-groupes « façon Notion ».
  await page.getByRole("button", { name: /Infos/ }).first().click()
  await expect(page.getByText("Questions fréquentes", { exact: true })).toBeVisible()
  const faq = page.getByRole("button", { name: /^❓\s*FAQ/ }).first()
  await expect(faq).toBeVisible()

  // Favori au clavier : l'étoile est une commande, pas un bouton dans un bouton.
  // (Dans un bouton, l'arbre d'accessibilité aplatit les enfants : on la vise par son titre.)
  const etoile = faq.locator('[role="button"][title="Ajouter aux favoris"]')
  await etoile.focus()
  await page.keyboard.press("Enter")
  await expect(faq.locator('[role="button"][title="Retirer des favoris"]')).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("button", { name: /Favoris/ }).first()).toBeVisible()
  await page.locator("[data-block-id]").first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/liste-bibliotheque-${info.project.name}.png` })

  // Ajouter : un bloc de plus sur la page.
  const avant = await page.locator("[data-block-id]").count()
  await faq.click()
  await expect(page.locator("[data-block-id]")).toHaveCount(avant + 1)
})
