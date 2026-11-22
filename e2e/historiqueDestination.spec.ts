import { test, expect } from "@playwright/test"
import { connecter } from "./sessionSimulee"

// QR-010 (audit UX v2, 22 nov.) : la fiche d'un QR de lien dynamique dit où il
// menait avant, et « Revenir » rouvre la boîte de destination pré-remplie — un
// changement sur un QR imprimé se confirme toujours. Session simulée, réponse
// de /api/qr-instant interceptée (pas de base sur cette machine).

const LIEN = {
  id: "11111111-1111-4111-8111-111111111111", kind: "link", label: "Carte du midi",
  payload: "https://qrowg.com/q/abc123", inputs: { url: "https://chez-lea.fr/carte-hiver" }, style: null,
  created_at: "2026-10-01T10:00:00Z", dynamic: true, short_code: "abc123",
  dest_url: "https://chez-lea.fr/carte-hiver", status: "active", expires_at: null,
  total_scans: 42, last_scan_at: "2026-11-21T19:00:00Z", paused_reason: null, has_password: false,
  dest_history: [
    { url: "https://chez-lea.fr/carte-automne", remplaceeLe: "2026-11-15T09:00:00Z" },
    { url: "https://chez-lea.fr/carte-ete", remplaceeLe: "2026-09-20T09:00:00Z" },
  ],
}

test("la fiche montre les destinations précédentes, et « Revenir » demande confirmation", async ({ page }, info) => {
  await connecter(page, "pro")
  await page.route("**/api/qr-instant", route =>
    route.request().method() === "GET"
      ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [LIEN], plan: "pro" }) })
      : route.fallback())
  await page.goto("/dashboard/qr-link", { waitUntil: "domcontentloaded" })

  await page.getByRole("button", { name: /Voir le détail de Carte du midi/ }).click()
  const liste = page.getByLabel("Destinations précédentes")
  await expect(liste).toBeVisible({ timeout: 20_000 })
  await expect(liste).toContainText("chez-lea.fr/carte-automne")
  await expect(liste).toContainText("jusqu'au 15 novembre")
  await liste.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/historique-destination-${info.project.name}.png` })

  await liste.getByRole("button", { name: "Revenir à https://chez-lea.fr/carte-automne" }).click()
  const boite = page.getByRole("dialog")
  await expect(boite).toContainText("Modifier la destination")
  await expect(boite.getByRole("textbox")).toHaveValue("https://chez-lea.fr/carte-automne")
})
