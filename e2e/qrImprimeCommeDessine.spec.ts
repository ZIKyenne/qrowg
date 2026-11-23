import { test, expect } from "@playwright/test"

// Vague 3, point 2 (revue du 23 nov.) : le Print Studio dessine le QR avec le
// style enregistré dans le QR Studio — pas avec les couleurs de l'ambiance.

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "content-type": "application/json" }
const VERT = "#0B6E4F", CREME = "#FFF6E0"

test("le QR du support porte la couleur, le fond et les modules du QR Studio", async ({ page }, info) => {
  await page.route(/supabase\.co\/rest\/v1\/(qr_codes|instant_qrs)/, route => {
    const corps = route.request().url().includes("/qr_codes")
      ? [{ short_code: "vitrine3", label: "Vitrine", status: "active", expires_at: null, pages: { title: "Le Comptoir", slug: "le-comptoir", status: "published" },
          foreground_color: VERT, background_color: CREME, error_correction: "Q", style_config: { dotStyle: "dot" }, logo_url: null }]
      : []
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(corps) })
  })
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
  await page.getByRole("button", { name: /Sticker de table/ }).first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()

  // Le dessin du QR (SVG de qr-code-styling) : ses modules sont dans la couleur du QR Studio.
  await expect.poll(async () => page.evaluate(() => {
    const svgs = [...document.querySelectorAll("svg")].filter(s => s.querySelectorAll("rect, circle, path").length > 50)
    return svgs.map(s => s.innerHTML).join(" ")
  }), { timeout: 15_000 }).toMatch(/#0B6E4F|rgb\(11, ?110, ?79\)/i)
  const html = await page.evaluate(() => [...document.querySelectorAll("svg")].map(s => s.innerHTML).join(" "))
  expect(html).toMatch(/#FFF6E0|rgb\(255, ?246, ?224\)/i)
  // Modules ronds (« dot ») : des cercles ou des chemins arrondis, pas des carrés seuls.
  expect(html).toMatch(/<circle|a\s*[\d.]+[ ,][\d.]+/i)
  await page.screenshot({ path: `test-results/qr-imprime-comme-dessine-${info.project.name}.png` })
})
