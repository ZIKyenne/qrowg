import { test, expect, type Page } from "@playwright/test"

// L'atelier ne se dit pas « prêt » quand il manque le QR — joué, bureau et
// mobile (v393). Avant, ce contrat était cité dans atelier.test.ts (le texte des
// conditions `!qrReady ? …`). En le jouant : la fenêtre de vérification tenait
// parole, mais la PASTILLE de la barre annonçait « Prêt à imprimer » sans QR —
// le seul cas où elle se disait prête, et rien ne pouvait être exporté.

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "content-type": "application/json" }
const QR_ACTIF = { short_code: "vitrine2", label: "Vitrine", status: "active", expires_at: null, pages: { title: "Le Comptoir", slug: "le-comptoir", status: "published" } }

async function ouvrir(page: Page, avecQr: boolean) {
  await page.route(/supabase\.co\/rest\/v1\/(qr_codes|instant_qrs)/, route => route.fulfill({
    status: 200, headers: CORS,
    body: JSON.stringify(avecQr && route.request().url().includes("/qr_codes") ? [QR_ACTIF] : []),
  }))
  await page.goto("/e2e-harness/print-studio", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /Sticker de table/ }).first().click()
  await page.getByRole("button", { name: "Garder le design de base" }).click()
}
const pastille = (page: Page) => page.getByRole("button", { name: /Prêt à imprimer|À vérifier|à corriger|Il manque votre QR/ }).first()
async function laVerification(page: Page) {
  await page.getByRole("button", { name: "Vérifier & exporter" }).click()
  return page.getByRole("dialog").last()
}

test("sans QR : ni « prêt », ni note, ni export — et le geste qui manque", async ({ page }, info) => {
  await ouvrir(page, false)
  await expect(pastille(page)).toHaveText(/Il manque votre QR/)
  const v = await laVerification(page)
  await expect(v.getByText("Il manque votre QR")).toBeVisible()
  await expect(v.getByText("Votre création est prête")).toHaveCount(0)
  await expect(v.getByText(/\/ 100/), "pas de note sans QR").toHaveCount(0)
  await expect(v.getByText(/★/), "pas d'étoiles sans QR").toHaveCount(0)
  await expect(v.getByText(`Ajoutez d'abord votre QR — onglet « ${info.project.name === "mobile" ? "QR" : "Contenu"} ».`)).toBeVisible()
  for (const nom of ["Ajoutez votre QR pour exporter", "PNG", "SVG", "PDF"])
    await expect(v.getByRole("button", { name: nom, exact: true }), `${nom} bloqué`).toBeDisabled()
})

test("avec un QR : la note, l'état réel, et l'export ouvert", async ({ page }) => {
  await ouvrir(page, true)
  await expect(pastille(page)).not.toHaveText(/Il manque votre QR/)
  const v = await laVerification(page)
  await expect(v.getByText(/\d+ \/ 100/)).toBeVisible()
  await expect(v.getByText("Il manque votre QR")).toHaveCount(0)
  for (const nom of ["Imprimer ou enregistrer en PDF", "PNG", "SVG", "PDF"])
    await expect(v.getByRole("button", { name: nom, exact: true }), `${nom} ouvert`).toBeEnabled()
})
