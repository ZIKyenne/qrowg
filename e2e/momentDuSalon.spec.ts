import { test, expect, type Page } from "@playwright/test"
import { collect, problems } from "./helpers/collect"

// 19 nov. — beauté : créneaux libres du jour et attente en direct. Les deux
// disent l'information DU MOMENT : un créneau passé ou une attente de plus de
// 3 h ne s'affiche pas. Banc générique /e2e-harness/bloc.

const banc = (page: Page, type: string, c?: Record<string, string>) =>
  page.goto(`/e2e-harness/bloc?type=${type}${c ? `&c=${encodeURIComponent(JSON.stringify(c))}` : ""}`, { waitUntil: "networkidle", timeout: 120_000 })

/** Le jour et l'heure À PARIS (le fuseau du commerce), pas ceux de la machine. */
function paris() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date()).map(x => [x.type, x.value]))
  return { jour: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) }
}
const hh = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`

test("créneaux du jour : les passés disparaissent, chaque créneau à venir appelle", async ({ page }) => {
  const { jour, minutes } = paris()
  test.skip(minutes < 70 || minutes > 22 * 60, "il faut un créneau passé ET deux à venir le même jour")
  const passe = minutes - 60, a = minutes + 30, b = Math.min(minutes + 90, 23 * 60 + 59)
  const c = collect(page)
  await banc(page, "creneaux_du_jour", { creneaux: `${hh(passe)}, ${hh(a)}, ${hh(b)}`, date: jour, action: "Appeler", phone: "06 12 34 56 78" })
  const liens = page.locator("[data-creneaux] a[data-creneau]")
  await expect(liens).toHaveCount(2)
  await expect(page.locator(`[data-creneau="${passe}"]`)).toHaveCount(0)
  await expect(liens.first()).toHaveAttribute("href", "tel:0612345678")
  await expect(liens.first()).toHaveAccessibleName(/Réserver le créneau de/)
  expect(problems(c)).toEqual([])
})

test("créneaux du jour : WhatsApp prérempli avec l'heure ; une liste d'hier ne s'affiche pas", async ({ page }) => {
  const { jour, minutes } = paris()
  test.skip(minutes > 22 * 60, "il faut un créneau à venir aujourd'hui")
  const a = minutes + 30
  await banc(page, "creneaux_du_jour", { creneaux: hh(a), date: jour, action: "WhatsApp", phone: "06 12 34 56 78" })
  const lien = page.locator("[data-creneaux] a[data-creneau]")
  await expect(lien).toHaveAttribute("href", /wa\.me\/33612345678\?text=/)
  await expect(lien).toHaveAttribute("target", "_blank")

  await banc(page, "creneaux_du_jour", { creneaux: hh(a), date: "2020-01-01", action: "Appeler", phone: "06 12 34 56 78" })
  await expect(page.locator("[data-creneaux]")).toHaveCount(0)
})

test("attente en direct : fraîche, elle s'affiche avec son âge ; vieille de 4 h, elle se tait", async ({ page }) => {
  const c = collect(page)
  await banc(page, "attente_live", { attente: "Environ 20 min", maj: String(Date.now() - 12 * 60_000) })
  const b = page.locator("[data-attente]")
  await expect(b).toHaveAttribute("data-attente", "attente")
  await expect(b.getByText("Environ 20 min")).toBeVisible()
  await expect(b.getByText(/Mis à jour il y a 1[23] min/)).toBeVisible()
  expect(problems(c)).toEqual([])

  await banc(page, "attente_live", { attente: "Complet pour aujourd'hui", maj: String(Date.now()) })
  await expect(page.locator("[data-attente]")).toHaveAttribute("data-attente", "complet")

  await banc(page, "attente_live", { attente: "Environ 20 min", maj: String(Date.now() - 4 * 3_600_000) })
  await expect(page.locator("[data-attente]")).toHaveCount(0)
})
