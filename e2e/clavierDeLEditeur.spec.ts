import { test, expect, type Page } from "@playwright/test"

// Le clavier de l'éditeur, sur le vrai éditeur (v388). Le câble est sorti de
// BuilderV4 dans useRaccourcisDeLEditeur et joué en unitaire ; ici on vérifie
// que l'éditeur s'en sert : Alt+flèche déplace, Ctrl+Z remet, et un déplacement
// impossible (bloc verrouillé, bord) n'empile pas d'annulation vide — sinon le
// Ctrl+Z suivant semblerait ne rien faire.

function brouillon() {
  const bloc = (i: number, type: string, content: Record<string, string>, locked = false) => ({ id: `local-${i}`, type, content, visible: true, draft: false, locked })
  return {
    v: 1, savedAt: Date.now(), pageName: "Clavier", theme: null,
    blocks: [
      bloc(0, "profile", { name: "Le Comptoir", tagline: "Cuisine de saison" }),
      bloc(1, "rich_text", { text: "Premier paragraphe" }),
      bloc(2, "rich_text", { text: "Second paragraphe" }),
      bloc(3, "rich_text", { text: "Verrouillé" }, true),
    ],
  }
}

/** L'ordre des blocs sur le canevas (un même bloc peut apparaître ailleurs : le premier compte). */
const ordre = (page: Page) => page.evaluate(() => {
  const vus: string[] = []
  for (const el of document.querySelectorAll("[data-block-id]")) {
    const id = el.getAttribute("data-block-id")!
    if (!vus.includes(id)) vus.push(id)
  }
  return vus
})
/** Les touches vont à l'éditeur, pas au champ que la sélection a pu focaliser. */
const horsChamp = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())

test("Alt+flèche déplace, Ctrl+Z remet, et un déplacement impossible ne compte pas", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "raccourcis clavier : bureau")
  await page.goto("/creer", { waitUntil: "domcontentloaded" })
  await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  await page.goto("/dashboard/builder?draft=1", { waitUntil: "domcontentloaded" })
  await expect(page.getByLabel("Nom de la page").first()).toHaveValue("Clavier", { timeout: 30_000 })
  // Plus de trois blocs : l'éditeur le prend pour un modèle, sans guide de bienvenue.
  await expect(page.getByRole("dialog", { name: "Bienvenue dans votre éditeur" })).toHaveCount(0)

  const depart = ["local-0", "local-1", "local-2", "local-3"]
  await expect.poll(() => ordre(page)).toEqual(depart)

  // Alt+↓ sur « Premier paragraphe » : il passe sous le second.
  await page.locator(`[data-block-id="local-1"]`).first().click()
  await horsChamp(page)
  await page.keyboard.press("Alt+ArrowDown")
  await expect.poll(() => ordre(page)).toEqual(["local-0", "local-2", "local-1", "local-3"])

  // Le bloc verrouillé ne bouge pas, ni au clavier…
  await page.locator(`[data-block-id="local-3"]`).first().click()
  await horsChamp(page)
  await page.keyboard.press("Alt+ArrowUp")
  await expect.poll(() => ordre(page)).toEqual(["local-0", "local-2", "local-1", "local-3"])
  // …et le haut de page est un bord.
  await page.locator(`[data-block-id="local-0"]`).first().click()
  await horsChamp(page)
  await page.keyboard.press("Alt+ArrowUp")

  // Un seul Ctrl+Z suffit à défaire le seul vrai déplacement : les deux
  // tentatives impossibles n'ont rien empilé.
  await page.keyboard.press("Control+z")
  await expect.poll(() => ordre(page)).toEqual(depart)
  await expect(page.getByRole("button", { name: "Annuler — Ctrl+Z" }), "plus rien à annuler").toBeDisabled()

  // ↓ sans Alt change de bloc sans rien déplacer.
  await page.keyboard.press("ArrowDown")
  await expect.poll(() => ordre(page)).toEqual(depart)
})
