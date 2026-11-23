import { test, expect } from "@playwright/test"
import { connecter } from "./sessionSimulee"

// D3 (audit UX v2, 23 nov.) : dans Paramètres → Facturation, l'abonné choisit
// AVANT l'échéance ce qui reste actif s'il repasse au gratuit.

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "content-type": "application/json" }
const L1 = "00000000-0000-4000-8000-0000000000a1", L2 = "00000000-0000-4000-8000-0000000000a2"
const P1 = "00000000-0000-4000-8000-0000000000b1", P2 = "00000000-0000-4000-8000-0000000000b2"

test("l'abonné choisit la page et le QR qui restent actifs", async ({ page }, info) => {
  await connecter(page, "pro")
  await page.route(/supabase\.co\/rest\/v1\/(profiles|subscriptions|instant_qrs|qr_codes)/, route => {
    const u = route.request().url()
    const seul = (route.request().headers()["accept"] || "").includes("pgrst.object")
    const corps =
      u.includes("/profiles") ? { plan: "pro", stripe_customer_id: "cus_simule" } :
      u.includes("/subscriptions") ? { status: "active", cancel_at_period_end: false, current_period_start: "2026-11-01T00:00:00Z", current_period_end: "2026-12-01T00:00:00Z" } :
      u.includes("/instant_qrs") ? [
        { id: L1, status: "active", expires_at: null, paused_reason: null, label: "Vitrine" },
        { id: L2, status: "active", expires_at: null, paused_reason: null, label: "Flyer" },
      ] : [{ id: P1, status: "active", paused_reason: null }, { id: P2, status: "active", paused_reason: null }]
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(seul && !Array.isArray(corps) ? corps : corps) })
  })
  let envoye: any = null
  await page.route("**/api/abonnement/garde", route => {
    if (route.request().method() === "PUT") { envoye = route.request().postDataJSON(); return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({ ok: true }) }) }
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({
      disponible: true, places: { liens: 1, pages: 1 },
      liens: [{ id: L1, nom: "Vitrine", detail: "https://carte.fr/", garde: false }, { id: L2, nom: "Flyer", detail: "https://promo.fr/", garde: false }],
      pages: [{ id: P1, nom: "Le Bistrot", detail: null, garde: false }, { id: P2, nom: "Brunch du dimanche", detail: null, garde: false }],
    }) })
  })

  await page.goto("/dashboard/settings")
  const bouton = page.getByRole("button", { name: "Choisir ce qui reste actif" })
  await bouton.scrollIntoViewIfNeeded()
  await bouton.click()

  // Par défaut : ce que la bascule garderait (les plus anciens).
  await expect(page.getByRole("radio", { name: /Le Bistrot/ })).toBeChecked()
  await expect(page.getByRole("radio", { name: /Vitrine/ })).toBeChecked()

  await page.getByRole("radio", { name: /Brunch du dimanche/ }).check()
  await page.getByRole("radio", { name: /Flyer/ }).check()
  await page.getByRole("button", { name: "Enregistrer mon choix" }).click()
  await expect(page.getByText("Choix enregistré.")).toBeVisible()
  await expect(page.getByText(/« Brunch du dimanche » et « Flyer » restent actifs/)).toBeVisible()
  expect(envoye).toEqual({ liens: [L2], pages: [P2] })

  // Aucune page plus large que l'écran.
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  expect(deborde).toBe(false)
  await page.getByLabel("Ce qui reste actif au retour au plan gratuit").screenshot({ path: `test-results/choix-au-retour-${info.project.name}.png` })
})

test("jours offerts écoulés : la page n'est pas proposée, et l'avertissement le dit", async ({ page }) => {
  await connecter(page, "pro")
  await page.route(/supabase\.co\/rest\/v1\/(profiles|subscriptions|instant_qrs|qr_codes)/, route => {
    const u = route.request().url()
    const corps =
      u.includes("/profiles") ? { plan: "pro", stripe_customer_id: "cus_simule", free_published_since: "2026-01-01T00:00:00Z" } :
      u.includes("/subscriptions") ? { status: "active", cancel_at_period_end: false, current_period_start: "2026-11-01T00:00:00Z", current_period_end: "2026-12-01T00:00:00Z" } :
      u.includes("/instant_qrs") ? [
        { id: L1, status: "active", expires_at: null, paused_reason: null, label: "Vitrine" },
        { id: L2, status: "active", expires_at: null, paused_reason: null, label: "Flyer" },
      ] : [{ id: P1, status: "active", paused_reason: null }]
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(corps) })
  })
  await page.route("**/api/abonnement/garde", route => route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({
    disponible: true, places: { liens: 1, pages: 1 },
    liens: [{ id: L1, nom: "Vitrine", detail: null, garde: false }, { id: L2, nom: "Flyer", detail: null, garde: false }],
    pages: [{ id: P1, nom: "Le Bistrot", detail: null, garde: false }, { id: P2, nom: "Brunch", detail: null, garde: false }],
  }) }))

  await page.goto("/dashboard/settings")
  await expect(page.getByText(/Vos pages ne seraient plus visibles : les 30 jours de page offerts/)).toBeVisible()
  await page.getByRole("button", { name: "Choisir ce qui reste actif" }).click()
  await expect(page.getByRole("radio", { name: /Vitrine/ })).toBeChecked()
  await expect(page.getByRole("radio", { name: /Le Bistrot/ })).toHaveCount(0)
  await expect(page.getByText(/Vos pages, elles, passeraient en pause/)).toBeVisible()
})
