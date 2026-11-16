import { test, expect, type Page } from "@playwright/test"

// Audit du 14 novembre 2026 (E, accessibilité) : « plusieurs catégories de blocs
// sont exposées par des noms composés seulement d'un emoji ». Un lecteur d'écran
// annonce alors « bouton, visage souriant ». Ce relevé lit le nom ACCESSIBLE
// calculé par le navigateur (arbre d'accessibilité Chromium), pas le code.

async function nomsSansLettre(page: Page): Promise<string[]> {
  const snap = await page.locator("body").ariaSnapshot()
  const out: string[] = []
  for (const ligne of snap.split("\n")) {
    const m = /^\s*- (button|link|tab|menuitem|option|radio|checkbox|switch)(?=[\s:\[]|$)(?: "([^"]*)")?/.exec(ligne)
    if (!m) continue
    const nom = m[2] ?? ""
    if (!/\p{L}|\p{N}/u.test(nom)) out.push(`${m[1]} « ${nom} »`)
  }
  return out
}

function brouillon() {
  return {
    v: 1, savedAt: Date.now(), pageName: "Relevé a11y", theme: null, templateKey: "",
    blocks: [{ id: "local-0", type: "profile", content: { name: "Relevé" }, visible: true, draft: false, locked: false }],
  }
}

test("éditeur : aucun contrôle nommé seulement par un emoji ou un symbole", async ({ page }) => {
  await page.goto("/creer", { waitUntil: "domcontentloaded" })
  await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  await page.goto("/dashboard/builder?draft=1", { waitUntil: "domcontentloaded" })
  await expect(page.getByLabel("Nom de la page").first()).toHaveValue("Relevé a11y", { timeout: 30_000 })
  expect(await nomsSansLettre(page)).toEqual([])
})

for (const url of ["/e2e-harness/block-library", "/creer", "/e2e-harness/accueil", "/e2e-harness/mes-pages", "/e2e-harness/qr-studio", "/e2e-harness/print-studio", "/e2e-harness/statistiques", "/e2e-harness/reglages", "/e2e-harness/messages", "/e2e-harness/medias", "/e2e-harness/domaines", "/e2e-harness/equipe", "/e2e-harness/onboarding", "/", "/upgrade", "/generateur-qr-code"]) {
  test(`${url} : aucun contrôle nommé seulement par un symbole`, async ({ page }) => {
    await page.goto(url, { waitUntil: "domcontentloaded" })
    await page.waitForLoadState("networkidle").catch(() => {})
    expect(await nomsSansLettre(page)).toEqual([])
  })
}
