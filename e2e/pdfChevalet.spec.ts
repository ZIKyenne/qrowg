import { test, expect } from "@playwright/test"

// Audit du 14 novembre 2026 (C6) : la sortie Chevalet mesurée sur le PDF que
// Chromium produit réellement (moteur de « Enregistrer en PDF »), pas sur le code.
const MM_EN_PT = 72 / 25.4

test("le PDF du chevalet fait 114 × 84 mm, comme l'écran l'annonce", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "page.pdf : Chromium de bureau")
  await page.goto("/e2e-harness/print-studio?item=i2&brand=Red%20Fish&message=La%20carte&cta=Scannez", { waitUntil: "domcontentloaded" })
  // Le banc n'a pas de QR en base : on en importe un en PNG (n'importe quelle image valide).
  await page.getByRole("button", { name: "Importer un PNG" }).first().click({ timeout: 30_000 })
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")
  await page.locator('input[type="file"]').first().setInputFiles({ name: "qr.png", mimeType: "image/png", buffer: png })
  await page.getByRole("button", { name: /Vérifier & exporter/ }).click()
  await expect(page.getByText(/PDF de 114 × 84 mm/)).toBeVisible()
  await page.screenshot({ path: "test-results/pdf-chevalet-etape.png" })
  // window.print() ne doit pas ouvrir de dialogue : la planche reste montée.
  await page.evaluate(() => { (window as any).print = () => {} })
  await page.getByRole("button", { name: /Imprimer ou enregistrer en PDF/ }).first().click()
  await expect(page.locator(".ps-print-root")).toHaveCount(1)
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
  const boites = [...pdf.toString("latin1").matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)]
  expect(boites.length).toBeGreaterThan(0)
  const [, w, h] = boites[0]
  expect(Number(w) / MM_EN_PT).toBeCloseTo(114, 0)
  expect(Number(h) / MM_EN_PT).toBeCloseTo(84, 0)
  expect(boites.length, "une seule page").toBe(1)
})
