import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { bilanDuMidi, phraseDuMidi } from "./clientsDuService"
import { sansCommentaires } from "./codeSeul"

// Vague 3, point 5 (revue du 23 nov.) : « combien de clients ce midi, par
// support ? », à l'heure du commerce, sans jamais compter un client deux fois.

const PARIS = "Europe/Paris"
// Lundi 23 novembre 2026, 16 h à Paris (UTC+1).
const APRES = Date.parse("2026-11-23T15:00:00Z")
const s = (heureParis: string, qr: string, h: string | null, jour = "2026-11-23") =>
  ({ scanned_at: new Date(`${jour}T${heureParis}:00+01:00`).toISOString(), qr_code_id: qr, ip_hash: h })

describe("le service de midi, à l'heure du commerce", () => {
  it("de 11 h à 15 h exactement, ce jour-là", () => {
    const b = bilanDuMidi([s("10:59", "vitrine", "a"), s("11:00", "vitrine", "b"), s("14:59", "table", "c"), s("15:00", "table", "d"), s("12:00", "table", "e", "2026-11-22")], PARIS, APRES)
    expect(b.jour).toBe("2026-11-23")
    expect(b.quand).toBe("ce_midi")
    expect(b.total).toBe(2)
  })
  it("avant 11 h, « ce midi » n'a pas eu lieu : c'est celui d'hier", () => {
    const matin = Date.parse("2026-11-23T08:30:00Z")   // 9 h 30 à Paris
    const b = bilanDuMidi([s("12:00", "table", "e", "2026-11-22"), s("12:00", "table", "f", "2026-11-23")], PARIS, matin)
    expect([b.quand, b.jour, b.total]).toEqual(["hier_midi", "2026-11-22", 1])
    expect(phraseDuMidi(b)).toBe("Hier midi, entre 11 h et 15 h : 1 client.")
  })
  it("le fuseau du commerce, pas celui du serveur : 12 h à la Martinique", () => {
    const b = bilanDuMidi([{ scanned_at: "2026-11-23T16:00:00Z", qr_code_id: "table", ip_hash: "x" }], "America/Martinique", Date.parse("2026-11-23T20:00:00Z"))
    expect(b.total).toBe(1)
  })
})

describe("des clients, comptés honnêtement", () => {
  it("un client qui scanne deux fois compte une fois ; deux supports, une fois au total", () => {
    const b = bilanDuMidi([s("12:00", "table", "a"), s("12:05", "table", "a"), s("12:10", "vitrine", "a"), s("12:20", "table", "b")], PARIS, APRES)
    expect(b.mesure).toBe("clients")
    expect(b.lignes).toEqual([{ qrId: "table", scans: 3, clients: 2 }, { qrId: "vitrine", scans: 1, clients: 1 }])
    expect(b.total).toBe(2)
    expect(phraseDuMidi(b)).toBe("Ce midi, entre 11 h et 15 h : 2 clients.")
  })
  it("sans empreinte (sel non configuré), ce sont des scans — et on le dit", () => {
    const b = bilanDuMidi([s("12:00", "table", null), s("12:05", "table", null)], PARIS, APRES)
    expect(b.mesure).toBe("scans")
    expect(b.lignes[0]).toEqual({ qrId: "table", scans: 2, clients: null })
    expect(phraseDuMidi(b)).toBe("Ce midi, entre 11 h et 15 h : 2 scans.")
  })
  it("empreintes partielles : pas de total mêlé, des scans", () => {
    expect(bilanDuMidi([s("12:00", "table", "a"), s("12:05", "table", null)], PARIS, APRES).mesure).toBe("scans")
  })
  it("rien : une phrase, pas un zéro sec", () => {
    expect(phraseDuMidi(bilanDuMidi([], PARIS, APRES))).toBe("Ce midi, entre 11 h et 15 h : aucun scan.")
  })
})

describe("les empreintes ne quittent pas le serveur", () => {
  it("l'écran reçoit des bilans ; la requête de la période ne lit pas ip_hash ; le fuseau vient des préférences", () => {
    const page = sansCommentaires(readFileSync(join(__dirname, "../app/dashboard/analytics/page.tsx"), "utf8"))
    expect(page).toContain("bilansDuMidi={bilansDuMidi}")
    expect(page).toMatch(/\.select\("scanned_at, device, country, city, os, browser, page_id, qr_code_id"\)/)
    expect(page).toContain("preferences?.timezone")
    const client = sansCommentaires(readFileSync(join(__dirname, "../app/dashboard/analytics/MidiParSupport.tsx"), "utf8"))
    expect(client).not.toContain("ip_hash")
  })
})
