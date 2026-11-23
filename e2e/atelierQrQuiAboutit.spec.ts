import { test, expect } from "@playwright/test"

// U6 (revue du 23 nov.) : l'atelier d'impression prévient quand le QR choisi
// mène à un écran d'attente (pause, brouillon, page non publiée) — sans bloquer.

async function ouvrirLeQr(page: import("@playwright/test").Page, projet: string) {
  await page.getByRole("button", { name: /Sticker de table/ }).first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
  const onglet = projet === "mobile" ? "QR" : "Contenu"
  await page.getByRole("tab", { name: onglet, exact: true }).or(page.getByRole("button", { name: onglet, exact: true })).first().click()
}

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "content-type": "application/json" }

test("un QR en pause est signalé, avec le geste qui le réactive", async ({ page }, info) => {
  await page.route(/supabase\.co\/rest\/v1\/(qr_codes|instant_qrs)/, route => {
    const u = route.request().url()
    const corps = u.includes("/qr_codes")
      ? [{ short_code: "vitrine1", label: "Vitrine", status: "paused", expires_at: null, pages: { title: "Le Comptoir", slug: "le-comptoir", status: "published" } }]
      : []
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(corps) })
  })
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
  await ouvrirLeQr(page, info.project.name)

  const alerte = page.getByText(/Ce QR est en pause : imprimé tel quel, il mène à un écran d'attente/).first()
  await expect(alerte).toBeVisible()
  await expect(page.getByRole("link", { name: "Réactiver ce QR" }).first()).toHaveAttribute("href", "/dashboard/pages")
  await alerte.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/atelier-qr-en-pause-${info.project.name}.png` })
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  expect(deborde).toBe(false)
})

test("un QR actif n'affiche rien", async ({ page }, info) => {
  await page.route(/supabase\.co\/rest\/v1\/(qr_codes|instant_qrs)/, route => {
    const corps = route.request().url().includes("/qr_codes")
      ? [{ short_code: "vitrine2", label: "Vitrine", status: "active", expires_at: null, pages: { title: "Le Comptoir", slug: "le-comptoir", status: "published" } }]
      : []
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(corps) })
  })
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await ouvrirLeQr(page, info.project.name)
  await expect(page.getByLabel("QR code à placer").first()).toBeVisible()
  await expect(page.getByText(/écran d'attente/)).toHaveCount(0)
})
