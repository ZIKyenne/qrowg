import { test, expect, type Page } from "@playwright/test"
import { collect, problems } from "./helpers/collect"

// 19 nov. — commerce de proximité : sorties du four, arrivage du jour, commande à
// retirer. Banc générique /e2e-harness/bloc.

const banc = (page: Page, type: string, c?: Record<string, string>) =>
  page.goto(`/e2e-harness/bloc?type=${type}${c ? `&c=${encodeURIComponent(JSON.stringify(c))}` : ""}`, { waitUntil: "networkidle", timeout: 120_000 })

/** Le jour et l'heure À PARIS (le fuseau du commerce), pas ceux de la machine. */
function paris(decalageJours = 0) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(Date.now() + decalageJours * 86_400_000)).map(x => [x.type, x.value]))
  return { jour: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) }
}
const hh = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`

test("sorties du four : ce qui est sorti, et la prochaine fournée", async ({ page }) => {
  const { minutes } = paris()
  test.skip(minutes < 70 || minutes > 22 * 60, "il faut une fournée passée ET une à venir le même jour")
  const c = collect(page)
  await banc(page, "fournees", { fournees: `${hh(minutes - 60)} Baguettes\n${hh(minutes + 45)} Viennoiseries` })
  const b = page.locator("[data-fournees]")
  await expect(b.locator('li[data-sortie="oui"]')).toHaveCount(1)
  await expect(b.locator('li[data-sortie="non"]')).toHaveCount(1)
  await expect(b.locator("[data-prochaine]")).toHaveText(/Prochaine fournée à .* · Viennoiseries — dans 4[45] min/)
  expect(problems(c)).toEqual([])
})

test("sorties du four : à toute heure, une fournée à 23 h 59 est la prochaine", async ({ page }) => {
  test.skip(paris().minutes >= 23 * 60 + 58, "la minute même")
  await banc(page, "fournees", { fournees: "23h59 Pain de nuit" })
  const b = page.locator("[data-fournees]")
  await expect(b.locator('li[data-sortie="non"]')).toHaveCount(1)
  await expect(b.locator("[data-prochaine]")).toHaveText(/^Prochaine fournée à 23h59 · Pain de nuit — dans /)
})

test("arrivage : daté du jour il s'affiche ; passé sa durée, il se tait", async ({ page }) => {
  await banc(page, "arrivage")
  const b = page.locator("[data-arrivage]")
  await expect(b.getByText("Arrivé aujourd'hui")).toBeVisible()
  await expect(b.getByText("Pivoines de la Drôme")).toBeVisible()

  await banc(page, "arrivage", { date: paris(-2).jour, duree: "3 jours" })
  await expect(page.locator("[data-arrivage]").getByText("Arrivé il y a 2 jours")).toBeVisible()

  await banc(page, "arrivage", { date: paris(-1).jour, duree: "Aujourd'hui seulement" })
  await expect(page.locator("[data-arrivage]")).toHaveCount(0)
})

test("commande à retirer : quantités, total estimé, message WhatsApp prêt", async ({ page }) => {
  const c = collect(page)
  await banc(page, "commande_retrait")
  const b = page.locator("[data-commande]")
  await expect(b.getByText("Choisissez au moins un article")).toBeVisible()
  await b.getByRole("button", { name: "Ajouter un Baguette tradition" }).click()
  await b.getByRole("button", { name: "Ajouter un Baguette tradition" }).click()
  await b.getByRole("button", { name: "Ajouter un Croissant" }).click()
  await expect(b.locator("[data-total]")).toHaveText("Total estimé : 3,80 €")
  await b.getByLabel(/Précisions/).fill("Retrait vers 17 h, au nom de Paul")
  const envoi = b.getByRole("link", { name: "Envoyer la commande par WhatsApp" })
  await expect(envoi).toHaveAttribute("target", "_blank")
  const href = decodeURIComponent((await envoi.getAttribute("href")) || "")
  expect(href).toMatch(/^https:\/\/wa\.me\/33612345678\?text=/)
  expect(href).toContain("• 2 × Baguette tradition\n• 1 × Croissant\nTotal estimé : 3,80 €\nRetrait vers 17 h, au nom de Paul")
  // Retirer redescend, jamais sous zéro.
  await b.getByRole("button", { name: "Retirer un Croissant" }).click()
  await expect(b.getByRole("button", { name: "Retirer un Croissant" })).toBeDisabled()
  await expect(b.locator("[data-total]")).toHaveText("Total estimé : 2,60 €")
  expect(problems(c)).toEqual([])
})

test("commande à retirer : par SMS, le lien s'écrit en sms:", async ({ page }) => {
  await banc(page, "commande_retrait", { canal: "SMS" })
  const b = page.locator("[data-commande]")
  await b.getByRole("button", { name: "Ajouter un Croissant" }).click()
  await expect(b.getByRole("link", { name: "Envoyer la commande par SMS" })).toHaveAttribute("href", /^sms:0612345678\?&body=/)
})
