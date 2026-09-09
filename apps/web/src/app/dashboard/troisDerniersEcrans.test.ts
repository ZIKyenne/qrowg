import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// v57 — QR de pages, Statistiques et Atelier d'impression vus sur PC et téléphone
// (bancs d'essai). Ce qu'on y a corrigé : vocabulaire, un seul dessin de segment.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("QR de pages", () => {
  const q = lire("qr-codes/QRStudio.tsx")
  it("parle français : « QR de pages », « au total », « Plus récents », « lisibilité »", () => {
    expect(q).toContain(">QR de pages</p>")
    expect(q).toContain("{qrCodes.length} au total")
    expect(q).toContain('<option value="date-desc">Plus récents</option>')
    expect(q).not.toContain("· scannabilité")
    expect(q).toContain('title="Marge et lisibilité"')
  })
})

describe("Statistiques", () => {
  it("la source « qr » se lit « QR code », comme « qr_scan »", () => {
    const s = lire("../../lib/sourcesTrafic.ts")
    expect(s).toContain('qr_scan:   "QR code"')
    expect(s).toContain('qr:        "QR code"')
  })
  it("« Publiez vos contenus », « contre hier »", () => {
    const a = lire("analytics/AnalyticsClient.tsx")
    expect(a).toContain("Publiez vos contenus autour de ${story.peakHour} h")
    expect(a).toContain("contre hier ({live.ydayN})")
    expect(a).not.toContain("vos posts")
  })
})

describe("Atelier d'impression", () => {
  const p = lire("print-studio/PrintStudioClient.tsx")
  it("un seul dessin de segment : surface-2 + filet d'accent, plus d'or plein hors action primaire", () => {
    expect(p).not.toContain("background: actif ? C.gold")
    expect(p).not.toContain('background: sem === cid ? C.gold')
    expect(p).not.toContain("background: value === o ? C.gold")
    expect(p).toContain('boxShadow: value === o ? "inset 0 -2px 0 var(--accent)" : "none"')
    expect(p).toContain('boxShadow: actif ? "inset 0 -2px 0 var(--accent)" : "none"')
    // L'action primaire garde l'or plein
    expect(p).toContain("Vérifier & exporter")
  })
})
