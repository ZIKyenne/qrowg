import { test, expect, type Page } from "@playwright/test"

// Le curseur avant / après — la condition posée pour sa migration.
//
// Depuis B09.11, `media_before_after` restait dans l'ancien rendu pour une
// raison écrite : un curseur à glisser « demande des tests DOM (curseur à
// glisser, tactile) que le pipeline actuel n'a pas ». Le pipeline les a : ce
// fichier les joue, dans le vrai navigateur, à chaque push (job `filet`).
// Rendu unique, lot 4 (24 nov.).

const IMG = "/icon.png"
const URL_BLOC = "/e2e-harness/bloc?type=media_before_after&c=" + encodeURIComponent(JSON.stringify({
  mode: "slider", before_img: IMG, after_img: IMG, before_label: "Avant", after_label: "Après", title: "La façade",
}))

async function ouvrir(page: Page) {
  await page.goto(URL_BLOC, { waitUntil: "networkidle" })
  const curseur = page.getByRole("slider", { name: /Comparateur/ })
  await expect(curseur).toBeVisible()
  await expect(curseur).toHaveAttribute("aria-valuenow", "50")
  return curseur
}

test("à la souris : glisser déplace le curseur, borné à 0–100", async ({ page }) => {
  const curseur = await ouvrir(page)
  const b = (await curseur.boundingBox())!
  const y = b.y + b.height / 2
  await page.mouse.move(b.x + b.width / 2, y)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width * 0.2, y, { steps: 5 })
  await page.mouse.up()
  const v = Number(await curseur.getAttribute("aria-valuenow"))
  expect(v).toBeGreaterThan(15)
  expect(v).toBeLessThan(25)
  // Au-delà du bord : borné.
  await page.mouse.move(b.x + b.width / 2, y)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width + 80, y, { steps: 5 })
  await page.mouse.up()
  await expect(curseur).toHaveAttribute("aria-valuenow", "100")
})

test("au doigt : le glisser horizontal déplace le curseur, la page défile toujours verticalement", async ({ page }) => {
  const curseur = await ouvrir(page)
  // `pan-y` : le navigateur garde le défilement vertical, le curseur reçoit le
  // geste horizontal. Sans lui, poser le doigt sur la photo bloquerait la page.
  expect(await curseur.evaluate(el => getComputedStyle(el).touchAction)).toBe("pan-y")
  const b = (await curseur.boundingBox())!
  const y = Math.round(b.y + b.height / 2)
  const cdp = await page.context().newCDPSession(page)
  const point = (x: number) => [{ x: Math.round(x), y, id: 1 }]
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(b.x + b.width / 2) })
  for (const f of [0.6, 0.7, 0.8]) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(b.x + b.width * f) })
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  const v = Number(await curseur.getAttribute("aria-valuenow"))
  expect(v, "le doigt a emmené le curseur vers la droite").toBeGreaterThan(70)
})

test("au clavier : focus, flèches par pas de 5, Début et Fin", async ({ page }) => {
  const curseur = await ouvrir(page)
  await curseur.focus()
  await page.keyboard.press("ArrowRight")
  await expect(curseur).toHaveAttribute("aria-valuenow", "55")
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("ArrowLeft")
  await expect(curseur).toHaveAttribute("aria-valuenow", "45")
  await page.keyboard.press("End")
  await expect(curseur).toHaveAttribute("aria-valuenow", "100")
  await page.keyboard.press("Home")
  await expect(curseur).toHaveAttribute("aria-valuenow", "0")
  // Ce que voit la personne suit la valeur : l'image « après » est découpée.
  const decoupe = await curseur.locator("img").nth(1).evaluate(el => (el as HTMLElement).style.clipPath)
  expect(decoupe).toBe("inset(0px 100% 0px 0px)")
})
