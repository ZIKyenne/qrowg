import { test, expect, type Page } from "@playwright/test"

// Vague 3, point 4 (revue du 23 nov.) : avant la boîte d'impression, le QR du
// support est relu par un décodeur à sa taille physique ; les couleurs qui virent
// à l'impression sont signalées (le calcul existait, il n'était pas relié).

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "content-type": "application/json" }

async function ouvrir(page: Page, styleDuQr: Record<string, unknown>) {
  await page.route(/supabase\.co\/rest\/v1\/(qr_codes|instant_qrs)/, route => {
    const corps = route.request().url().includes("/qr_codes")
      ? [{ short_code: "vitrine9", label: "Vitrine", status: "active", expires_at: null, pages: { title: "Le Comptoir", slug: "le-comptoir", status: "published" }, error_correction: "M", logo_url: null, ...styleDuQr }]
      : []
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(corps) })
  })
  // La boîte d'impression ne s'ouvre pas en test : on compte ses appels.
  await page.addInitScript(() => { (window as any).__impressions = 0; window.print = () => { (window as any).__impressions++ } })
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
  await page.getByRole("button", { name: /Sticker de table/ }).first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
  await page.getByRole("button", { name: /Vérifier & exporter|À vérifier/ }).first().click()
}
const impressions = (page: Page) => page.evaluate(() => (window as any).__impressions as number)

test("un QR lisible : relu, puis la boîte d'impression s'ouvre", async ({ page }) => {
  await ouvrir(page, { foreground_color: "#111111", background_color: "#FFFFFF", style_config: {} })
  await page.getByRole("button", { name: "Imprimer ou enregistrer en PDF" }).click()
  await expect.poll(() => impressions(page), { timeout: 15_000 }).toBe(1)
  await expect(page.getByRole("dialog").filter({ hasText: "n'a pas été relu" })).toHaveCount(0)
})

test("des yeux presque couleur du fond : on prévient AVANT d'imprimer", async ({ page }, info) => {
  await ouvrir(page, { foreground_color: "#111411", background_color: "#F4F1E8", style_config: { eyeColor: "#ECE8DC", cornerColor: "#ECE8DC" } })
  await page.getByRole("button", { name: "Imprimer ou enregistrer en PDF" }).click()
  const dialogue = page.getByRole("dialog").filter({ hasText: "Le QR de ce support n'a pas été relu" })
  await expect(dialogue).toBeVisible({ timeout: 15_000 })
  await page.screenshot({ path: `test-results/impression-non-relue-${info.project.name}.png` })
  await dialogue.getByRole("button", { name: "Revoir le QR" }).click()
  expect(await impressions(page)).toBe(0)
})

test("une couleur qui vire à l'impression est signalée", async ({ page }) => {
  await ouvrir(page, { foreground_color: "#00FF66", background_color: "#FFFFFF", style_config: {} })
  await expect(page.getByText(/très vive\(s\) risquent de virer en CMYK/).first()).toBeVisible()
})
