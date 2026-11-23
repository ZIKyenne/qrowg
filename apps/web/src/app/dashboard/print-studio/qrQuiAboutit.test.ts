import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { alerteAvantImpression } from "./qrQuiAboutit"

// U6 (revue du 23 nov.) : le Print Studio imprimait sans un mot un QR en pause,
// en brouillon ou dont la page n'était pas publiée.
const NOW = Date.parse("2026-11-23T12:00:00Z")

describe("avant d'imprimer, le QR mène-t-il quelque part ?", () => {
  it("actif, page publiée : rien à dire", () => {
    expect(alerteAvantImpression({ statut: "active", statutPage: "published" }, true, NOW)).toBeNull()
    expect(alerteAvantImpression({}, false, NOW)).toBeNull()
  })
  it("en pause, en brouillon, expiré : on le dit, avec le geste", () => {
    expect(alerteAvantImpression({ statut: "paused" }, true, NOW)).toMatchObject({ action: "Réactiver ce QR", lien: "/dashboard/pages" })
    expect(alerteAvantImpression({ statut: "draft" }, false, NOW)).toMatchObject({ action: "Activer ce QR", lien: "/dashboard/qr-link" })
    expect(alerteAvantImpression({ statut: "expired" }, false, NOW)?.texte).toContain("expiré")
    expect(alerteAvantImpression({ statut: "active", expireLe: "2026-11-01T00:00:00Z" }, false, NOW)?.texte).toContain("expiré")
    expect(alerteAvantImpression({ statut: "active", expireLe: "2026-12-01T00:00:00Z" }, false, NOW)).toBeNull()
  })
  it("QR actif mais page en brouillon : la page à publier", () => {
    expect(alerteAvantImpression({ statut: "active", statutPage: "draft" }, true, NOW)?.action).toBe("Publier la page")
  })
  it("le studio lit les statuts et affiche l'alerte aux trois endroits, sans bloquer l'export", () => {
    const c = readFileSync(join(__dirname, "PrintStudioClient.tsx"), "utf8")
    // Vague 3 : la même lecture, plus le style du QR (COLONNES_DU_STYLE).
    expect(c.split("select(`short_code, label, status, expires_at, pages(title, slug, status), ${COLONNES_DU_STYLE}`)").length - 1).toBe(2)
    expect(c).toContain('select("id, label, kind, payload, dynamic, short_code, status, expires_at")')
    expect(c.match(/blocAlerteQr\}/g)?.length).toBe(3)
    expect(c).toContain('disabled={!ok || !qrReady} leftIcon={<Download size={18} />}')
  })
})
