import { test, expect, type Page } from "@playwright/test"

// Les réglages d'un bloc (panneau de droite) sont sortis de BuilderV4 dans
// ReglagesDuBloc.tsx (vague 4, point 6). Ce test les joue dans l'éditeur réel :
// les trois onglets, un réglage par onglet, les réglages avancés, et le
// copier-coller de style d'un bloc à l'autre.

function brouillon() {
  const bloc = (i: number, type: string, content: Record<string, string>) => ({ id: `local-${i}`, type, content, visible: true, draft: false, locked: false })
  return {
    v: 1, savedAt: Date.now(), pageName: "Réglages", theme: null,
    blocks: [
      bloc(0, "profile", { name: "Le Comptoir", tagline: "Cuisine de saison" }),
      bloc(1, "rich_text", { text: "Premier paragraphe" }),
      bloc(2, "rich_text", { text: "Second paragraphe" }),
    ],
  }
}

async function ouvrir(page: Page) {
  await page.goto("/creer", { waitUntil: "domcontentloaded" })
  await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  await page.goto("/dashboard/builder?draft=1&builderRedesign=0", { waitUntil: "domcontentloaded" })
  await expect(page.getByLabel("Nom de la page").first()).toHaveValue("Réglages", { timeout: 30_000 })
  const guide = page.getByRole("dialog", { name: "Bienvenue dans votre éditeur" })
  await guide.getByRole("button", { name: "Passer" }).click()
  await expect(guide).toHaveCount(0)
}

test("les réglages d'un bloc : Style, Effets, avancés, copier-coller du style", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "inspecteur de bureau (le téléphone a modifierAuPouce)")
  await ouvrir(page)
  const bloc = (id: string) => page.locator(`[data-block-id="${id}"]`).first()
  const onglet = (nom: string) => page.getByRole("tablist", { name: "Réglages" }).getByRole("tab", { name: nom })

  await bloc("local-1").click()
  await expect(onglet("Contenu")).toHaveAttribute("aria-selected", "true")

  // Style : la bordure s'allume, les coins prennent une valeur.
  await onglet("Style").click()
  await expect(page.getByText("Modèles d'apparence")).toBeVisible()
  const bordure = page.getByRole("switch", { name: "Bordure" })
  await expect(bordure).toHaveAttribute("aria-checked", "false")
  await bordure.click()
  await expect(bordure).toHaveAttribute("aria-checked", "true")
  await expect(page.getByText("Apparence du bloc").or(page.getByText("Mise en page", { exact: true })).first()).toBeVisible()
  await page.screenshot({ path: `test-results/reglages-du-bloc-style-${info.project.name}.png` })

  // Copier le style de ce bloc, le coller sur l'autre : la bordure suit.
  await page.getByRole("button", { name: "Copier le style" }).click()
  await bloc("local-2").click()
  await onglet("Style").click()
  await expect(page.getByRole("switch", { name: "Bordure" })).toHaveAttribute("aria-checked", "false")
  await page.getByRole("button", { name: "Coller le style" }).click()
  await expect(page.getByRole("switch", { name: "Bordure" })).toHaveAttribute("aria-checked", "true")

  // Effets : le halo s'allume.
  await onglet("Effets").click()
  const halo = page.getByRole("switch", { name: "Halo lumineux (glow)" })
  await halo.click()
  await expect(halo).toHaveAttribute("aria-checked", "true")

  // Réglages avancés : repliés, puis ouverts ; le nom interne se saisit ; Dupliquer ajoute un bloc.
  const avances = page.getByRole("button", { name: "Réglages avancés" })
  await expect(avances).toHaveAttribute("aria-expanded", "false")
  await avances.click()
  await expect(avances).toHaveAttribute("aria-expanded", "true")
  await page.getByLabel("Nom interne du bloc").fill("Paragraphe du bas")
  await expect(page.getByLabel("Nom interne du bloc")).toHaveValue("Paragraphe du bas")
  const avant = await page.locator("[data-block-id]").count()
  await page.locator("#reglages-avances-bloc").getByRole("button", { name: "Dupliquer" }).click()
  await expect(page.locator("[data-block-id]")).toHaveCount(avant + 1)
})
