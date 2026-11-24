import { test, expect, type Page } from "@playwright/test"

// L'aperçu en grand montre le thème que la page créée recevra.
//
// Vague 4, point 5, lot 1 (24 nov.) : l'aperçu reconstruisait un thème à
// partir des couleurs de la CARTE — texte clair, Fraunces, fond uni, pour tous
// les modèles. « Coach & Thérapeute » (page claire) se prévisualisait sur fond
// sombre ; « Restaurant & Bar » en rouge alors que la page est orange. Il lit
// désormais le thème du registre des modèles.

const GALERIE = "/creer"

async function ouvrirApercu(page: Page, nom: string) {
  await page.goto(GALERIE, { waitUntil: "networkidle" })
  const recherche = page.getByRole("searchbox").first()
  if (await recherche.count()) await recherche.fill(nom)
  const bouton = page.getByRole("button", { name: `Aperçu de ${nom}` }).first()
  await bouton.scrollIntoViewIfNeeded()
  await bouton.click()
  const dialogue = page.getByRole("dialog")
  await expect(dialogue).toBeVisible()
  return dialogue
}

/** La couleur de fond calculée de la zone d'aperçu de la page (le cadre « téléphone »). */
async function fondsDeLApercu(page: Page): Promise<string[]> {
  return page.getByRole("dialog").evaluate(d => {
    const vus = new Set<string>()
    for (const el of Array.from(d.querySelectorAll<HTMLElement>("*"))) {
      const cs = getComputedStyle(el)
      vus.add(cs.backgroundColor); vus.add(cs.backgroundImage)
    }
    return [...vus]
  })
}

test("« Coach & Thérapeute » se prévisualise CLAIR, comme la page qu'il crée", async ({ page }) => {
  await ouvrirApercu(page, "Coach & Thérapeute")
  const fonds = (await fondsDeLApercu(page)).join(" ")
  // Le thème du modèle : fond #F5FFF5 = rgb(245, 255, 245).
  expect(fonds, "le fond clair du modèle").toContain("rgb(245, 255, 245)")
  await page.screenshot({ path: "test-results/apercu-coach.png" })
})

test("« Restaurant & Bar » se prévisualise dans l'orange de sa page, pas le rouge de sa carte", async ({ page }) => {
  await ouvrirApercu(page, "Restaurant & Bar")
  const html = await page.getByRole("dialog").innerHTML()
  // Primaire du thème : #FF6B00. L'ancienne carte disait var(--danger) = #FF6B6B.
  expect(html.toLowerCase()).toContain("#ff6b00")
  expect(html.toLowerCase()).not.toContain("var(--danger)")
  await page.screenshot({ path: "test-results/apercu-restaurant.png" })
})
