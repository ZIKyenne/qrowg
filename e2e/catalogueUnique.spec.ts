import { test, expect } from "@playwright/test"

// Un seul catalogue de modèles, partout (vague 4, point 5, lot 2 — 24 nov.).
// Les 14 modèles historiques n'existaient que dans la galerie ; /examples et la
// fenêtre « Modèles » de l'éditeur en proposaient 51 sur 65.

test("/examples annonce et liste les 127 modèles (62 métiers ajoutés au lot 3)", async ({ page }) => {
  await page.goto("/examples", { waitUntil: "networkidle" })
  await expect(page.getByText(/127 modèles/)).toBeVisible()
  await page.screenshot({ path: "test-results/examples-hub.png", fullPage: false })
})

test("un modèle historique a sa page de démonstration, dans son thème", async ({ page }) => {
  const erreurs: string[] = []
  page.on("pageerror", e => erreurs.push(String(e)))
  const rep = await page.goto("/examples/coach", { waitUntil: "networkidle" })
  expect(rep?.status()).toBe(200)
  // Le thème du modèle : fond clair #F5FFF5.
  const fonds = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("body *")).map(e => getComputedStyle(e).backgroundColor))
  expect(fonds).toContain("rgb(245, 255, 245)")
  // (Le moyen de joindre ajouté au modèle est vérifié par registreDesModeles.test.ts :
  // sans numéro saisi, la démonstration ne publie pas de bouton d'appel.)
  expect(erreurs).toEqual([])
  await page.screenshot({ path: "test-results/examples-coach.png", fullPage: false })
})

// Lot 3 (24 nov.) : les 62 métiers du moteur, vérifiés PUIS exposés. Chacun se
// rend, sans erreur, dans son ambiance — avant d'être montré à qui que ce soit.
test("les 62 métiers se rendent, chacun sans erreur", async ({ page }) => {
  test.setTimeout(600_000)
  const { EXTRA_STRUCTURES } = await import("../apps/web/src/app/dashboard/builder/templateStructures.extra")
  expect(EXTRA_STRUCTURES).toHaveLength(62)
  const fautes: string[] = []
  for (const s of EXTRA_STRUCTURES) {
    const erreurs: string[] = []
    const ecoute = (e: Error) => erreurs.push(String(e))
    page.on("pageerror", ecoute)
    const rep = await page.goto(`/examples/${s.key}`, { waitUntil: "load" })
    if (rep?.status() !== 200) fautes.push(`${s.key} : HTTP ${rep?.status()}`)
    // Le profil du modèle est à l'écran : les blocs ont bien été rendus (le
    // libellé du métier, lui, est dans un en-tête masqué sur mobile).
    const nom = String(s.blocks.find(b => b.type === "profile")?.content.name ?? "")
    if (!nom) fautes.push(`${s.key} : pas de profil`)
    else if (!(await page.getByText(nom, { exact: false }).first().isVisible().catch(() => false))) fautes.push(`${s.key} : « ${nom} » absent`)
    page.off("pageerror", ecoute)
    for (const e of erreurs) fautes.push(`${s.key} : ${e}`)
  }
  expect(fautes).toEqual([])
})

test("un métier clair est rendu clair : le cabinet dentaire en menthe", async ({ page }) => {
  await page.goto("/examples/sante_dentiste", { waitUntil: "networkidle" })
  // Menthe pose un DÉGRADÉ (#F8FDFC → #E6F4F0) : il se lit dans background-image.
  const fonds = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("body *")).map(e => getComputedStyle(e).backgroundImage).join(" "))
  expect(fonds).toContain("rgb(248, 253, 252)")
  await page.screenshot({ path: "test-results/examples-dentiste.png", fullPage: false })
})
