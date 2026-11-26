import { test, expect, type Page } from "@playwright/test"

// La feuille de réglages de l'atelier, sur téléphone, n'existe qu'ouverte —
// jouée (v394), plus citée (feuilleNonRendue.test.ts lisait le code). Revue du
// 9 septembre : fermée, elle restait dans la page, glissée hors écran — 217
// cibles et 152 textes jamais vus. Contrat : montée à l'ouverture, avec son
// animation d'entrée ; à la fermeture, gardée le temps de glisser (360 ms),
// puis démontée.

async function ouvrir(page: Page) {
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /Sticker de table/ }).first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
  await expect(page.getByRole("button", { name: "Couleurs", exact: true })).toBeVisible()
}
const fermer = (page: Page) => page.getByRole("button", { name: "Fermer", exact: true })
const boutons = (page: Page) => page.getByRole("button").count()
/** Le nom de l'animation d'entrée du panneau qui porte « Fermer ». */
const animation = (page: Page) => fermer(page).first().evaluate(b => {
  for (let el: HTMLElement | null = b as HTMLElement; el; el = el.parentElement)
    if (getComputedStyle(el).position === "fixed") return getComputedStyle(el).animationName
  return ""
})

test.beforeEach(({}, info) => { test.skip(info.project.name !== "mobile", "la feuille est l'interface du téléphone") })

for (const [orientation, taille, sens] of [["debout", { width: 390, height: 844 }, "ps-sheet-in-y"], ["couché", { width: 844, height: 390 }, "ps-sheet-in-x"]] as const) {
  test(`${orientation} : absente fermée, animée à l'ouverture, démontée après avoir glissé`, async ({ page }) => {
    await page.setViewportSize(taille)
    await ouvrir(page)
    await expect(fermer(page), "fermée : rien dans la page").toHaveCount(0)
    const fermee = await boutons(page)

    await page.getByRole("button", { name: "Couleurs", exact: true }).click()
    await expect(fermer(page)).toHaveCount(1)
    expect(await animation(page), "l'entrée est animée bien que montée déjà ouverte").toBe(sens)
    expect(await boutons(page), "ouverte, ses réglages sont là").toBeGreaterThan(fermee)

    // Juste après « × » : encore là, le temps de glisser…
    const encoreLa = await fermer(page).first().evaluate(b => {
      (b as HTMLElement).click()
      return new Promise<boolean>(r => setTimeout(() => r(!!document.querySelector('[aria-label="Fermer"]')), 100))
    })
    expect(encoreLa, "gardée pendant qu'elle glisse").toBe(true)
    // …puis plus rien : la page revient exactement à son état fermé.
    await expect(fermer(page)).toHaveCount(0)
    expect(await boutons(page)).toBe(fermee)
  })
}
