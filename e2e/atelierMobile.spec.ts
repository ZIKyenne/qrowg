import { test, expect, type Page } from "@playwright/test"

// L'atelier d'impression sur téléphone, debout et couché — JOUÉ (v396), plus
// cité : atelier.test.ts vérifiait que `estPaysage(`, `tiroirW + 12` ou
// `minHeight: 36` figuraient dans le fichier. Ici on mesure l'écran.
// Le cadrage des 16 supports (aperçu jamais sous la barre ni sous la feuille,
// entête mesuré) vit dans atelierCadrageMobile.spec.ts.
//
// En le jouant (v396), six commandes passaient sous 36 px au doigt : la poignée
// de la feuille (20 px), quatre liens « Voir les 43 coloris / Réglages avancés…»
// (32), le champ de recherche (34), les puces de métier (32), « créez-en un »
// (15 px, la seule issue quand on n'a aucun QR).

const DEBOUT = { width: 390, height: 844 }, COUCHE = { width: 844, height: 390 }
const PLEIN_ECRAN = "Voir en situation (plein écran)"

async function ouvrir(page: Page) {
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /Sticker de table/ }).first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
  await expect(page.getByRole("button", { name: "Couleurs", exact: true })).toBeVisible()
}
async function onglet(page: Page, nom: "Couleurs" | "Texte" | "QR") {
  await page.getByRole("button", { name: nom, exact: true }).click()
  await expect(page.getByRole("button", { name: "Fermer", exact: true })).toHaveCount(1)
  await page.waitForTimeout(500) // la feuille finit de glisser
}

/** Boîtes de l'entête, du bouton plein écran, de la feuille et de l'aperçu. */
const mesure = (page: Page) => page.evaluate(nomFs => {
  const boite = (e: Element | null | undefined) => {
    if (!e) return null
    const b = e.getBoundingClientRect()
    return { g: b.left, h: b.top, d: b.right, b: b.bottom }
  }
  const fs = document.querySelector(`[aria-label="${nomFs}"]`)
  const fb = fs?.getBoundingClientRect()
  // Atteignable = c'est bien lui (ou son contenu) qui reçoit le toucher en son centre.
  const touche = fb ? document.elementFromPoint(fb.left + fb.width / 2, fb.top + fb.height / 2) : null
  let feuille: Element | null = null
  for (let e = document.querySelector('[aria-label="Fermer"]')?.parentElement ?? null; e; e = e.parentElement)
    if (getComputedStyle(e).position === "fixed") { feuille = e; break }
  const zone = [...document.querySelectorAll("div")].find(d => (d as HTMLElement).style.cursor === "zoom-in")
  return {
    l: innerWidth, H: innerHeight,
    entete: document.querySelector(".ps-hdr")?.textContent ?? "",
    fsDansEntete: !!fs?.closest(".ps-hdr"),
    fsAtteignable: !!fs && !!touche && fs.contains(touche),
    feuille: boite(feuille), apercu: boite(zone?.firstElementChild),
    poignee: !!document.querySelector('[aria-label="Hauteur du panneau"]'),
  }
}, PLEIN_ECRAN)

/** Les commandes visibles à l'écran qui font moins de 36 px dans un sens. */
const tropPetites = (page: Page) => page.evaluate(() =>
  [...document.querySelectorAll("button, a, select, input, textarea, [role=slider]")].flatMap(e => {
    // Le curseur natif se prend par son pouce, pas par sa piste : hors mesure.
    if (e instanceof HTMLInputElement && (e.type === "range" || e.type === "file" || e.type === "hidden")) return []
    const b = e.getBoundingClientRect()
    if (!b.width || !b.height || b.bottom <= 0 || b.top >= innerHeight || b.right <= 0 || b.left >= innerWidth) return []
    if (b.width >= 36 && b.height >= 36) return []
    const nom = (e.getAttribute("aria-label") || e.getAttribute("placeholder") || e.textContent || e.tagName).trim().slice(0, 40)
    return [`« ${nom} » ${Math.round(b.width)}×${Math.round(b.height)}`]
  }))

test.beforeEach(({}, info) => { test.skip(info.project.name !== "mobile", "l'atelier du téléphone") })

test("debout : le support est nommé, la feuille sous l'aperçu, le plein écran atteignable", async ({ page }) => {
  await page.setViewportSize(DEBOUT)
  await ouvrir(page)
  const f = await mesure(page)
  // L'entête ne disait que « Bibliothèque » : on ne savait pas ce qu'on réglait.
  expect(f.entete, "le nom du support, dans l'entête").toContain("Sticker de table")
  expect(f.fsDansEntete, "le plein écran vit dans l'entête").toBe(true)

  for (const nom of ["Couleurs", "Texte", "QR"] as const) {
    await onglet(page, nom)
    const o = await mesure(page)
    expect(o.poignee, `${nom} : debout, la feuille se tire par sa poignée`).toBe(true)
    expect(o.feuille!.b, `${nom} : ancrée en bas`).toBeCloseTo(o.H, 0)
    expect(o.apercu!.b, `${nom} : l'aperçu reste au-dessus de la feuille`).toBeLessThanOrEqual(o.feuille!.h + 1)
    // Ancré sur l'aperçu, il disparaissait (ou recouvrait le support) dès que la feuille s'ouvrait.
    expect(o.fsAtteignable, `${nom} : plein écran atteignable, feuille ouverte`).toBe(true)
  }
  await page.getByRole("button", { name: PLEIN_ECRAN }).click()
  await expect(page.getByRole("button", { name: "Fermer l'aperçu" })).toBeVisible()
})

test("couché : les réglages passent dans un tiroir à droite, l'aperçu lui laisse la place", async ({ page }) => {
  await page.setViewportSize(COUCHE)
  await ouvrir(page)
  const fermee = await mesure(page)
  // Ancrée en bas sur 390 px de haut, la feuille ne montait qu'à ~148 px dont la
  // barre d'action masquait 117 : rien n'était atteignable.
  for (const nom of ["Couleurs", "Texte", "QR"] as const) {
    await onglet(page, nom)
    const o = await mesure(page)
    expect(o.poignee, `${nom} : un tiroir ne se tire pas en hauteur`).toBe(false)
    expect(o.feuille, `${nom} : tiroir`).toMatchObject({ h: 0, d: o.l, b: o.H })
    expect(o.feuille!.g, `${nom} : sur une partie de la largeur seulement`).toBeGreaterThan(o.l / 3)
    expect(o.apercu!.g, `${nom} : aperçu entier à gauche`).toBeGreaterThanOrEqual(0)
    expect(o.apercu!.d, `${nom} : l'aperçu se range à côté du tiroir, pas dessous`).toBeLessThanOrEqual(o.feuille!.g)
    expect(o.apercu!.d, `${nom} : il s'est bien décalé`).toBeLessThan(fermee.apercu!.d)
    expect(o.fsAtteignable, `${nom} : plein écran atteignable, tiroir ouvert`).toBe(true)
  }
})

for (const [orientation, taille] of [["debout", DEBOUT], ["couché", COUCHE]] as const) {
  test(`${orientation} : aucune commande sous 36 px au doigt`, async ({ page }) => {
    await page.setViewportSize(taille)
    await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
    expect(await tropPetites(page), "bibliothèque").toEqual([])
    await page.getByPlaceholder("Sticker, chevalet, carte…").fill("sticker")
    expect(await tropPetites(page), "bibliothèque, recherche saisie").toEqual([])

    await page.getByRole("button", { name: /Sticker de table/ }).first().click()
    await page.getByRole("button", { name: "Garder le design de base" }).click()
    await expect(page.getByRole("button", { name: "Couleurs", exact: true })).toBeVisible()
    expect(await tropPetites(page), "atelier, feuille fermée").toEqual([])
    for (const nom of ["Couleurs", "Texte", "QR"] as const) {
      await onglet(page, nom)
      expect(await tropPetites(page), `feuille « ${nom} »`).toEqual([])
      // …et ce qui n'apparaît qu'en la faisant défiler.
      const fin = await page.getByRole("button", { name: "Fermer", exact: true }).evaluate(b => {
        for (let e = b.parentElement; e; e = e.parentElement)
          if (getComputedStyle(e).position === "fixed") { const avant = e.scrollTop; e.scrollTop = e.scrollHeight; return e.scrollTop > avant }
        return false
      })
      if (fin) expect(await tropPetites(page), `feuille « ${nom} », défilée`).toEqual([])
    }
  })
}
