import { test, expect, type Download } from "@playwright/test"
import { readFileSync } from "node:fs"

// Vague 3, point 4 (revue du 23 nov.) : le QR des PDF est VECTORIEL (svg2pdf.js),
// plus une image collée. On ouvre le fichier et on regarde ce qu'il contient.

const contenu = async (dl: Download) => readFileSync((await dl.path())!).toString("latin1")
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "content-type": "application/json" }

test("QR Studio : le PDF trace le QR, sans image", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  await page.goto("/e2e-harness/qr-studio?zero=1&plan=pro", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Télécharger" }).click()
  const dl = page.waitForEvent("download")
  await page.getByRole("button", { name: /^PDF/ }).first().click()
  const d = await dl
  expect(d.suggestedFilename()).toMatch(/\.pdf$/)
  const pdf = await contenu(d)
  expect(pdf.startsWith("%PDF")).toBe(true)
  expect(pdf, "une image du QR dans le PDF").not.toMatch(/\/Subtype\s*\/Image/)
  // Des tracés : les modules sont des chemins (opérateurs PDF « m » et « l »), des centaines.
  // (Relevé : 251 « m », 753 « l », 0 image ; « /ImageB » du /ProcSet n'est pas une image.)
  expect((pdf.match(/ [ml]\n/g) ?? []).length).toBeGreaterThan(200)
})

test("Print Studio : « QR seul » en PDF, page à la taille physique du QR, vectoriel", async ({ page }) => {
  await page.route(/supabase\.co\/rest\/v1\/(qr_codes|instant_qrs)/, route => {
    const corps = route.request().url().includes("/qr_codes")
      ? [{ short_code: "vitrine8", label: "Vitrine", status: "active", expires_at: null, pages: { title: "Le Comptoir", slug: "le-comptoir", status: "published" }, foreground_color: "#111111", background_color: "#FFFFFF", error_correction: "M", style_config: { dotStyle: "rounded" }, logo_url: null }]
      : []
    return route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(corps) })
  })
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
  await page.getByRole("button", { name: /Sticker de table/ }).first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
  await page.getByRole("button", { name: /Vérifier & exporter|À vérifier/ }).first().click()
  const dl = page.waitForEvent("download")
  await page.getByRole("button", { name: "PDF", exact: true }).click()
  const pdf = await contenu(await dl)
  expect(pdf).not.toMatch(/\/Subtype\s*\/Image/)
  // MediaBox carrée, de quelques centimètres (la taille physique du QR du sticker), pas une A4.
  const m = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(pdf)
  expect(m).not.toBeNull()
  const [l, h] = [Number(m![1]), Number(m![2])]
  expect(Math.abs(l - h)).toBeLessThan(0.5)
  expect(l).toBeGreaterThan(40)          // > 1,4 cm
  expect(l).toBeLessThan(200)            // < 7 cm : ce n'est pas une A4 (595 pt)
})
