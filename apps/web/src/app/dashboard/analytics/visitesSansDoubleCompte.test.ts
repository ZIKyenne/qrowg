import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { visitesDuJour } from "./lectureHonnete"

// U5 (revue du 23 nov.) : « Aujourd'hui » additionnait scans et vues — 20
// clients venus par QR affichaient 40 — et coupait la journée à minuit du
// NAVIGATEUR.

// Lundi 23 nov. 2026, 13 h à Paris (12 h UTC).
const NOW = Date.parse("2026-11-23T12:00:00Z")

describe("les visites du jour, sans double compte", () => {
  it("20 clients par QR = 20 visites, pas 40", () => {
    const t = Array.from({ length: 20 }, (_, i) => `2026-11-23T11:${String(i).padStart(2, "0")}:00Z`)
    expect(visitesDuJour(t, t, "Europe/Paris", NOW).aujourdhui).toBe(20)
  })
  it("des visites directes (vues sans scan) comptent, des vues perdues aussi", () => {
    const scans = ["2026-11-23T09:00:00Z", "2026-11-23T09:10:00Z"]
    const vues = ["2026-11-23T09:00:05Z", "2026-11-23T09:10:05Z", "2026-11-23T10:00:00Z"]
    expect(visitesDuJour(scans, vues, "Europe/Paris", NOW).aujourdhui).toBe(3)
    expect(visitesDuJour(vues, scans, "Europe/Paris", NOW).aujourdhui).toBe(3)
  })
  it("la journée est celle du commerce : 0 h 30 à Paris, c'est aujourd'hui", () => {
    // 23:30 UTC le 22 = 0 h 30 le 23 à Paris.
    const r = visitesDuJour(["2026-11-22T23:30:00Z"], [], "Europe/Paris", NOW)
    expect(r).toEqual({ aujourdhui: 1, hier: 0 })
    // À la Martinique (UTC-4), le même instant est la veille au soir.
    const m = visitesDuJour(["2026-11-22T23:30:00Z"], [], "America/Martinique", NOW)
    expect(m).toEqual({ aujourdhui: 0, hier: 1 })
  })
  it("hier se compte de même", () => {
    const t = ["2026-11-22T10:00:00Z", "2026-11-22T11:00:00Z"]
    expect(visitesDuJour(t, t, "Europe/Paris", NOW)).toEqual({ aujourdhui: 0, hier: 2 })
  })
  it("la carte n'additionne plus, et ne lit plus minuit du navigateur", () => {
    const c = readFileSync(join(__dirname, "AnalyticsClient.tsx"), "utf8")
    expect(c).toContain("visitesDuJour(")
    expect(c).not.toContain("startToday.setHours(0, 0, 0, 0)")
    expect(c).not.toContain("scans + vues\"")
  })
})
