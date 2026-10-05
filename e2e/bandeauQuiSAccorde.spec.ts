import { test, expect } from "@playwright/test"

// Q19 — le bandeau d'arrivée s'accorde, pour de vrai.
// « Ceux de la bars », « Ceux de la immobilier », « Ceux de la SaaS » : dix-huit
// secteurs sur dix-neuf sortaient faux. On les lit à l'écran.
const SECTEURS: [string, string][] = [
  ["Bar", "Ceux des bars"],
  ["Immobilier", "Ceux de l’immobilier"],
  ["SaaS", "Ceux du SaaS"],
  ["Restaurant", "Ceux de la restauration"],
  ["Sport", "Ceux du sport et de la remise en forme"],
  ["Association", "Ceux des associations"],
]

for (const [secteur, attendu] of SECTEURS) {
  test(`« ${secteur} » : ${attendu}`, async ({ page }) => {
    await page.goto(`/creer?metier=${secteur}`, { waitUntil: "domcontentloaded" })
    await expect(page.locator('[data-galerie="prete"]')).toBeAttached({ timeout: 30_000 })
    const texte = (await page.locator("body").innerText()).replace(/ /g, " ")
    expect(texte, `le bandeau n'écrit pas « ${attendu} »`).toContain(attendu)
    expect(texte, "une forme fautive subsiste").not.toMatch(/Ceux de la (bars|immobilier|SaaS|sport|associations)/)
  })
}

test("et le décompte des autres modèles est celui du secteur", async ({ page }) => {
  // Il annonçait « les 47 autres », c'est-à-dire 48 moins UN : la formule tenait
  // pour acquis qu'un seul modèle appartienne au secteur.
  await page.goto("/creer?metier=Bar", { waitUntil: "domcontentloaded" })
  await expect(page.locator('[data-galerie="prete"]')).toBeAttached({ timeout: 30_000 })
  const texte = (await page.locator("body").innerText()).replace(/ /g, " ")
  const autres = Number((texte.match(/puis\s+(\d+)\s+autres?/) || [])[1] ?? NaN)

  // « Bar » compte TROIS modèles sur 48 — les deux bars et « Restaurant & Bar » —
  // donc 45 autres. Cette valeur est MESURÉE, pas devinée : si le catalogue
  // change, ce test échoue, et c'est ce qu'on veut. Que le nombre soit bien
  // DÉRIVÉ du compteur de secteur, et non figé, est garanti à part par
  // `app/francaisQuiSAccorde.test.ts`.
  expect(autres, "le bandeau n'annonce pas le reste du catalogue").toBe(45)
  expect(texte, "l'ancien décompte figé est revenu").not.toMatch(/puis les \d+ autres/)
})
