import { test, expect, type Page } from "@playwright/test"
import { collect, problems } from "./helpers/collect"

// 20 nov. — sport et événement : planning des cours, programme « en ce moment ».
// Banc générique /e2e-harness/bloc ; les heures se construisent depuis Paris.

const banc = (page: Page, type: string, c?: Record<string, string>) =>
  page.goto(`/e2e-harness/bloc?type=${type}${c ? `&c=${encodeURIComponent(JSON.stringify(c))}` : ""}`, { waitUntil: "networkidle", timeout: 120_000 })

const ABREV = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
function paris(decalageJours = 0) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
  }).formatToParts(new Date(Date.now() + decalageJours * 86_400_000)).map(x => [x.type, x.value]))
  const jour = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday)
  return { cle: `${p.year}-${p.month}-${p.day}`, jour, minutes: Number(p.hour) * 60 + Number(p.minute) }
}
const hh = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`

test("planning : aujourd'hui marqué, réservation WhatsApp préremplie, un cours complet sans bouton", async ({ page }) => {
  const c = collect(page)
  await banc(page, "planning_cours")
  const b = page.locator("[data-planning]")
  // « Aujourd'hui » marque le jour du commerce, s'il a des cours (lun, mar, mer, jeu, sam).
  const aujourdhuiACours = [1, 2, 3, 4, 6].includes(paris().jour)
  await expect(b.getByText("Aujourd'hui", { exact: true })).toHaveCount(aujourdhuiACours ? 1 : 0)
  if (aujourdhuiACours) await expect(b.locator(`[data-jour="${paris().jour}"]`).getByText("Aujourd'hui", { exact: true })).toBeVisible()
  const yoga = b.getByRole("link", { name: /Réserver : Yoga, lundi à 18h30/ })
  const href = decodeURIComponent((await yoga.getAttribute("href")) || "")
  expect(href).toMatch(/^https:\/\/wa\.me\/33612345678\?text=/)
  expect(href).toContain("le cours « Yoga » du lundi à 18h30")
  const complet = b.locator("li", { hasText: "Yoga doux" })
  await expect(complet.getByText("Complet")).toBeVisible()
  await expect(complet.getByRole("link")).toHaveCount(0)
  await expect(b.locator("[data-prochain-cours]")).toHaveText(/^Prochain cours : /)
  expect(problems(c)).toEqual([])
})

test("planning : le prochain cours est celui de tout à l'heure, aujourd'hui", async ({ page }) => {
  const { jour, minutes } = paris()
  test.skip(minutes > 23 * 60, "il faut un cours plus tard aujourd'hui")
  await banc(page, "planning_cours", { planning: `${ABREV[jour]} ${hh(minutes + 30)} Boxe\n${ABREV[(jour + 2) % 7]} 9h Cardio` })
  await expect(page.locator("[data-prochain-cours]")).toHaveText(/Prochain cours : Boxe — aujourd'hui à .* \(dans (29|30) min\)/)
})

test("programme : le jour J, « En ce moment » suit l'heure ; terminé, il disparaît", async ({ page }) => {
  const { cle, minutes } = paris()
  test.skip(minutes < 70 || minutes > 22 * 60, "il faut un moment passé, un en cours et un à venir le même soir")
  const c = collect(page)
  await banc(page, "programme_live", { date: cle, programme: `${hh(minutes - 60)} Ouverture\n${hh(minutes - 10)} Concert\n${hh(minutes + 50)} DJ set` })
  const b = page.locator("[data-programme]")
  await expect(b).toHaveAttribute("data-phase", "pendant")
  await expect(b.locator("[data-en-ce-moment]")).toHaveText("En ce moment : Concert")
  await expect(b.locator('li[data-etat="passe"]')).toHaveCount(1)
  await expect(b.locator('li[data-etat="a_venir"]')).toHaveCount(1)
  expect(problems(c)).toEqual([])

  await banc(page, "programme_live", { date: paris(-3).cle })
  await expect(page.locator("[data-programme]")).toHaveCount(0)
})

test("programme : à toute heure du test, horloge figée à 21 h 30 le soir J", async ({ page }) => {
  // L'état est recalculé au montage : l'horloge du NAVIGATEUR décide.
  await page.clock.setFixedTime(new Date("2026-11-19T20:30:00Z"))   // 21 h 30 à Paris
  await banc(page, "programme_live", { date: "19/11/2026", programme: "20h Ouverture des portes\n21h Concert\n23h DJ set\n1h Dernier service" })
  const b = page.locator("[data-programme]")
  await expect(b).toHaveAttribute("data-phase", "pendant")
  await expect(b.locator("[data-en-ce-moment]")).toHaveText("En ce moment : Concert")
  await expect(b.locator("li").nth(1)).toHaveAttribute("data-etat", "en_cours")
  await expect(b.getByText("jeudi 19 novembre")).toBeVisible()
})

test("programme : avant le jour J, tout est à venir et la date se lit", async ({ page }) => {
  await banc(page, "programme_live", { date: paris(5).cle })
  const b = page.locator("[data-programme]")
  await expect(b).toHaveAttribute("data-phase", "avant")
  await expect(b.locator("[data-en-ce-moment]")).toHaveCount(0)
  await expect(b.locator('li[data-etat="a_venir"]')).toHaveCount(4)
})
