import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { lienQrDeLaPage, qrAPreselectionner } from "./qrDeLaPage"

// Audit du 14 novembre 2026 (C) : « Tester mon QR code » ouvrait le studio générique.
describe("Tester mon QR code ouvre le QR de la page", () => {
  const qrs = [{ id: "q1", page_id: "pA" }, { id: "q2", page_id: "pB" }]
  it("présélectionne le QR de la page demandée", () => {
    const page = new URL(lienQrDeLaPage("pB"), "https://x").searchParams.get("page")
    expect(qrAPreselectionner(qrs, page)).toBe("q2")
  })
  it("page inconnue ou absente : garde le comportement par défaut", () => {
    expect(qrAPreselectionner(qrs, "pZ")).toBeNull()
    expect(qrAPreselectionner(qrs, null)).toBeNull()
    expect(lienQrDeLaPage(undefined)).toBe("/dashboard/qr-codes")
  })
  it("les deux boutons et le studio sont câblés", () => {
    const lire = (p: string) => readFileSync(join(__dirname, "..", p), "utf8")
    expect(lire("app/dashboard/DashboardClient.tsx")).toContain('label: "Tester mon QR code", href: lienQrDeLaPage(')
    expect(lire("app/dashboard/analytics/AnalyticsClient.tsx")).toContain("href={lienQrDeLaPage(")
    expect(lire("app/dashboard/qr-codes/QRStudio.tsx")).toContain('qrAPreselectionner(initialQRCodes, new URLSearchParams(window.location.search).get("page"))')
  })
})
