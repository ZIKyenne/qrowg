import { test, expect } from "@playwright/test"

// Kit de démarchage au navigateur : la page publique (avec ?ref=), et la fiche
// A5 mesurée sur le PDF que Chromium produit vraiment.
const MM_EN_PT = 72 / 25.4

test("page Bars & restaurants : le code de parrainage suit jusqu'à l'essai ; trois captures ; pas d'index", async ({ page }, info) => {
  await page.goto("/bars-et-restaurants?ref=Demo-Ref")
  await expect(page.getByRole("heading", { level: 1, name: "Votre carte, à jour depuis le comptoir." })).toBeVisible()
  for (const a of await page.getByRole("link", { name: /Créer ma carte/ }).all())
    await expect(a).toHaveAttribute("href", "/creer?metier=Bar&ref=demo-ref")
  await expect(page.getByRole("link", { name: "Voir une carte d'exemple" })).toHaveAttribute("href", "/examples/resto_bar")
  await expect(page.locator("figure img")).toHaveCount(3)
  // Chargées à la demande (next/image) : on les fait venir à l'écran, puis on attend.
  for (const img of await page.locator("figure img").all()) {
    await img.scrollIntoViewIfNeeded()
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0)
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false)
  // Masque le badge de développement pour la capture ; facultatif (peut échouer
  // quand le script d'audience Vercel est bloqué au même instant).
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
  await page.screenshot({ path: `test-results/kit-page-${info.project.name}.png`, fullPage: true })
})

test("un code de parrainage invalide n'est pas propagé", async ({ page }) => {
  await page.goto("/bars-et-restaurants?ref=%3Cscript%3E")
  await expect(page.getByRole("link", { name: /Créer ma carte gratuitement/ }).first()).toHaveAttribute("href", "/creer?metier=Bar")
})

test("fiche comptoir : une page A5 (148 × 210 mm), deux QR", async ({ page }, info) => {
  await page.goto("/e2e-harness/kit")
  await expect(page.getByText(/Démonstration en direct/)).toBeVisible()
  // Rien ne dépasse du format A5 : le contenu tient dans la fiche (sinon l'impression le couperait).
  const deborde = await page.locator(".kit-fiche").first().evaluate(e => {
    const f = e.getBoundingClientRect()
    return [...e.querySelectorAll("*")].some(c => { const r = c.getBoundingClientRect(); return r.height > 0 && r.bottom > f.bottom + 0.5 })
  })
  expect(deborde, "un élément sort du format A5").toBe(false)
  // Masque le badge de développement pour la capture ; facultatif (peut échouer
  // quand le script d'audience Vercel est bloqué au même instant).
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
  await page.screenshot({ path: `test-results/kit-fiche-${info.project.name}.png`, fullPage: true })
  test.skip(info.project.name === "mobile", "page.pdf : Chromium de bureau")
  await page.evaluate(() => { (window as any).print = () => {} })
  await page.getByRole("button", { name: /Imprimer ou enregistrer en PDF/ }).click()
  await expect(page.locator(".ps-print-root .kit-qr svg")).toHaveCount(2)
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
  const boites = [...pdf.toString("latin1").matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)]
  expect(boites.length, "une seule page").toBe(1)
  expect(Number(boites[0][1]) / MM_EN_PT).toBeCloseTo(148, 0)
  expect(Number(boites[0][2]) / MM_EN_PT).toBeCloseTo(210, 0)
})

test("choisir la carte d'exemple de Qrowg ne fait pas dire « aucune page »", async ({ page }) => {
  await page.goto("/e2e-harness/kit")
  // Page prête (QR dessinés par un effet) avant d'agir : sinon le choix est perdu à l'hydratation.
  await page.locator(".kit-qr svg").first().waitFor()
  await page.getByLabel("Carte montrée en exemple").selectOption("")
  await expect(page.getByText("La fiche montre la carte d'exemple de Qrowg (pas de démonstration en direct avec elle).")).toBeVisible()
  await expect(page.getByText(/Aucune de vos pages en ligne/)).toHaveCount(0)
})
