import { test, expect, type Page } from "@playwright/test"

// Atelier d'impression sur téléphone (relevé iPhone du 16 nov.) :
//  · feuille fermée, l'affiche débordait à droite (colonne de grille élargie
//    par la légende) ;
//  · feuille ouverte, son bas passait sous la feuille : l'entête (sur deux
//    rangées avec « Enregistrer ») n'était jamais mesuré — hook branché sur un
//    élément absent au premier rendu.
// On rejoue les 16 supports avec un entête volontairement haut.

const SUPPORTS = Array.from({ length: 16 }, (_, i) => `i${i + 1}`)

async function cadre(page: Page) {
  return page.evaluate(() => {
    const zone = [...document.querySelectorAll("div")].find(d => (d as HTMLElement).style.cursor === "zoom-in")!
    const a = (zone.firstElementChild as HTMLElement).getBoundingClientRect()
    const barre = document.querySelector(".ps-actionbar")!.getBoundingClientRect()
    const titre = [...document.querySelectorAll("p")].find(p => p.textContent === "Couleur d'accent")
    let feuille: DOMRect | null = null
    for (let e = titre?.parentElement ?? null; e; e = e.parentElement) if (getComputedStyle(e).position === "fixed") { feuille = e.getBoundingClientRect(); break }
    return { g: a.left, d: a.right, b: a.bottom, l: innerWidth, barre: barre.top, feuille: feuille?.top ?? null, defile: document.documentElement.scrollWidth }
  })
}

test("les 16 supports tiennent dans l'écran, feuille fermée et ouverte", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "cadrage téléphone")
  test.setTimeout(240_000)
  // Le plancher dur (120 px) ne doit jamais faire planter le moteur de QR.
  const erreurs: string[] = []
  page.on("pageerror", e => erreurs.push(e.message))
  page.on("console", m => { if (m.type() === "error" && /too small|canvas/i.test(m.text())) erreurs.push(m.text()) })
  for (const id of SUPPORTS) {
    await page.goto(`/e2e-harness/print-studio?item=${id}`)
    await page.getByRole("button", { name: "Couleurs" }).waitFor()
    // Entête sur deux rangées, comme sur iPhone avec « Enregistrer ».
    await page.evaluate(() => { const s = document.createElement("style"); s.textContent = ".ps-hdr{padding-top:70px!important}"; document.head.append(s) })
    await page.waitForTimeout(500)
    const f = await cadre(page)
    expect(f.g, `${id} gauche`).toBeGreaterThanOrEqual(0)
    expect(f.d, `${id} droite`).toBeLessThanOrEqual(f.l)
    expect(f.defile, `${id} défilement`).toBeLessThanOrEqual(f.l)
    expect(f.b, `${id} sous la barre`).toBeLessThanOrEqual(f.barre + 1)
    await page.getByRole("button", { name: "Couleurs" }).click()
    await page.waitForTimeout(700)
    const o = await cadre(page)
    expect(o.feuille, `${id} feuille`).not.toBeNull()
    expect(o.b, `${id} sous la feuille`).toBeLessThanOrEqual(o.feuille! + 1)
    expect(o.d, `${id} droite (ouverte)`).toBeLessThanOrEqual(o.l)
  }
  expect(erreurs).toEqual([])
})
