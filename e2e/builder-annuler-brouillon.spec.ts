import { test, expect, type Page } from "@playwright/test"

// ═══════════════════════════════════════════════════════════════════════════════
// Q01 — LA PREMIÈRE ANNULATION REMPLAÇAIT LA PAGE.
//
// Scénario de l'audit du 29 septembre : depuis /creer, ouvrir un modèle, renommer
// quelque chose, cliquer sur Annuler. Les dix blocs du modèle laissaient place aux
// trois blocs génériques du montage, et le titre redevenait « Ma Page ».
//
// Ce que ce fichier mesure, que la garde unitaire ne mesure pas : l'ÉDITEUR RÉEL,
// avec son brouillon relu dans le navigateur, son bouton Annuler, et le second
// essai après rechargement — les deux reproductions décrites par l'audit.
// ═══════════════════════════════════════════════════════════════════════════════

const NOM = "Bistrot français"
const TYPES = ["profile", "bio", "opening_hours", "menu_section", "gallery",
               "social_links", "google_maps", "contact_form", "testimonials", "cta_button"]

/** Le brouillon exactement tel que /creer l'écrit (voir templates/page.tsx → makeDraft). */
function brouillon() {
  return {
    v: 1,
    savedAt: Date.now(),
    pageName: NOM,
    theme: null,
    templateKey: "bistrot_francais",
    blocks: TYPES.map((type, i) => ({
      id: `local-${i}`, type,
      content: { titre: `Bloc ${i}`, text: `Contenu ${i}` },
      visible: true, draft: false, locked: false,
    })),
  }
}

/** Nombre de blocs réellement posés dans l'éditeur (identifiants distincts). */
async function nombreDeBlocs(page: Page) {
  return page.evaluate(() =>
    new Set([...document.querySelectorAll("[data-block-id]")].map(e => e.getAttribute("data-block-id"))).size)
}

/**
 * Le champ du nom de la page.
 *
 * Sur téléphone, l'éditeur en affiche DEUX : la barre historique et la coquille
 * mobile rendent chacune le leur, avec le même nom accessible. Les deux sont liés
 * au même état, donc l'un vaut l'autre pour ce que ce fichier mesure — mais la
 * duplication est un constat en soi, consigné au suivi d'audit (Q16 / Q18).
 */
const champDuNom = (page: Page) => page.getByLabel("Nom de la page").first()

async function ouvrirLeBrouillon(page: Page) {
  await page.goto("/dashboard/builder?draft=1", { waitUntil: "domcontentloaded" })
  await expect(champDuNom(page)).toHaveValue(NOM, { timeout: 30_000 })
  await expect.poll(() => nombreDeBlocs(page), { timeout: 30_000 }).toBe(TYPES.length)
}

test.describe("Q01 — Annuler ne remplace pas le document", () => {
  test.beforeEach(async ({ page }) => {
    // Le brouillon doit exister AVANT que l'éditeur ne démarre.
    await page.goto("/creer", { waitUntil: "domcontentloaded" })
    await page.evaluate(d => localStorage.setItem("qrowg_draft_v1", JSON.stringify(d)), brouillon())
  })

  test("la première annulation ne retire que la modification — et autant après rechargement", async ({ page }, testInfo) => {
    // Deux tours : le premier essai de l'audit, puis le même après rechargement.
    for (const tour of ["premier essai", "après rechargement"]) {
      await ouvrirLeBrouillon(page)

      // La modification : renommer la page (le geste le plus court qui pousse une
      // entrée d'historique, et celui dont l'audit a observé la perte du titre).
      const nom = champDuNom(page)
      await nom.fill(NOM + " — Halles")
      await expect(nom).toHaveValue(NOM + " — Halles")

      const annuler = page.getByTitle(/^Annuler/).first()
      await expect(annuler, `${tour} : Annuler devrait être actif`).toBeEnabled()
      await annuler.click()

      // Le document est intact ; seule la modification est partie.
      await expect(nom, tour).toHaveValue(NOM)
      expect(await nombreDeBlocs(page), `${tour} : les blocs du modèle`).toBe(TYPES.length)

      // Et on ne peut pas descendre plus bas : le modèle est le passé, pas le squelette.
      await expect(annuler, `${tour} : plus rien à annuler`).toBeDisabled()

      await testInfo.attach(`q01-${tour.replace(/\s/g, "-")}-${testInfo.project.name}`,
        { body: await page.screenshot(), contentType: "image/png" })
    }
  })

  test("s'acharner sur Annuler ne fait pas réapparaître la page générique", async ({ page }) => {
    await ouvrirLeBrouillon(page)
    const nom = champDuNom(page)
    await nom.fill(NOM + " A")
    const annuler = page.getByTitle(/^Annuler/).first()
    for (let i = 0; i < 5; i++) {
      if (await annuler.isEnabled()) await annuler.click()
    }
    await expect(nom).toHaveValue(NOM)
    expect(await nombreDeBlocs(page)).toBe(TYPES.length)
  })

  test("Rétablir ramène la modification, sans exhumer le squelette", async ({ page }) => {
    await ouvrirLeBrouillon(page)
    const nom = champDuNom(page)
    await nom.fill(NOM + " — Halles")
    await page.getByTitle(/^Annuler/).first().click()
    await expect(nom).toHaveValue(NOM)

    await page.getByTitle(/^Rétablir/).first().click()
    await expect(nom).toHaveValue(NOM + " — Halles")
    expect(await nombreDeBlocs(page)).toBe(TYPES.length)
  })
})
