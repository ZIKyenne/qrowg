import { describe, it, expect } from "vitest"
import { formatDay, buildDailyData, buildDeviceData, buildSourceData, buildScrollFunnel, buildBlockImpressions, blockCtr } from "./analyticsAgg"

// now fixe pour des fenetres glissantes deterministes : 2026-07-07T12:00:00Z
const NOW = Date.parse("2026-07-07T12:00:00Z")

describe("formatDay", () => {
  it("formate jour/mois sans zero", () => {
    expect(formatDay("2026-07-05")).toBe("5/7")
    expect(formatDay("2026-12-25")).toBe("25/12")
  })
})

describe("buildDailyData", () => {
  it("renvoie exactement 30 jours, du plus ancien au plus recent", () => {
    const d = buildDailyData([], [], NOW)
    expect(d).toHaveLength(30)
    // dernier bucket = aujourd'hui (07/07)
    expect(d[29].date).toBe("7/7")
    // premier bucket = il y a 29 jours (08/06)
    expect(d[0].date).toBe("8/6")
  })
  it("jours sans evenement -> 0 (pas de trous)", () => {
    const d = buildDailyData([], [], NOW)
    expect(d.every(p => p.scans === 0 && p.views === 0)).toBe(true)
  })
  it("compte scans et vues dans le bon bucket", () => {
    const scans = [{ scanned_at: "2026-07-07T09:00:00Z" }, { scanned_at: "2026-07-07T10:00:00Z" }, { scanned_at: "2026-07-06T10:00:00Z" }]
    const views = [{ viewed_at: "2026-07-07T08:00:00Z" }]
    const d = buildDailyData(scans, views, NOW)
    const today = d[29], yday = d[28]
    expect(today.scans).toBe(2)
    expect(today.views).toBe(1)
    expect(yday.scans).toBe(1)
    expect(yday.views).toBe(0)
  })
  it("ignore les evenements hors fenetre (plus de 30 jours)", () => {
    const scans = [{ scanned_at: "2026-01-01T00:00:00Z" }]
    const d = buildDailyData(scans, [], NOW)
    expect(d.reduce((a, p) => a + p.scans, 0)).toBe(0)
  })
})

describe("buildDeviceData", () => {
  it("compte par appareil", () => {
    const r = buildDeviceData([{ scanned_at: "x", device: "mobile" }, { scanned_at: "x", device: "mobile" }, { scanned_at: "x", device: "desktop" }])
    expect(r).toContainEqual({ name: "mobile", value: 2 })
    expect(r).toContainEqual({ name: "desktop", value: 1 })
  })
  it("appareil manquant -> 'unknown'", () => {
    const r = buildDeviceData([{ scanned_at: "x" }, { scanned_at: "x", device: null }])
    expect(r).toContainEqual({ name: "unknown", value: 2 })
  })
  it("liste vide -> []", () => {
    expect(buildDeviceData([])).toEqual([])
  })
})

describe("buildSourceData", () => {
  it("compte par source", () => {
    const r = buildSourceData([{ viewed_at: "x", source: "instagram" }, { viewed_at: "x", source: "instagram" }, { viewed_at: "x", source: "google" }])
    expect(r).toContainEqual({ name: "instagram", value: 2 })
    expect(r).toContainEqual({ name: "google", value: 1 })
  })
  it("source absente/vide -> 'direct'", () => {
    const r = buildSourceData([{ viewed_at: "x" }, { viewed_at: "x", source: "" }, { viewed_at: "x", source: null }])
    expect(r).toContainEqual({ name: "direct", value: 3 })
  })
})

describe("buildScrollFunnel", () => {
  const ev = (ref: string) => ({ kind: "scroll" as const, ref })
  it("compte les jalons et calcule le pct relatif au 1er (25%)", () => {
    // 4 sessions atteignent 25, 3 atteignent 50, 2 -> 75, 1 -> 100
    const events = [
      ev("25"), ev("50"), ev("75"), ev("100"),
      ev("25"), ev("50"), ev("75"),
      ev("25"), ev("50"),
      ev("25"),
    ]
    const f = buildScrollFunnel(events)
    expect(f.map(s => s.count)).toEqual([4, 3, 2, 1])
    expect(f.map(s => s.depth)).toEqual(["25%", "50%", "75%", "100%"])
    expect(f[0].pct).toBe(100)
    expect(f[3].pct).toBe(25)
  })
  it("aucun scroll -> tout a 0 (pas de division par zero)", () => {
    const f = buildScrollFunnel([{ kind: "impression", ref: "b1" }])
    expect(f.every(s => s.count === 0 && s.pct === 0)).toBe(true)
  })
})

describe("buildBlockImpressions", () => {
  it("compte les impressions par block_id (ignore le scroll)", () => {
    const counts = buildBlockImpressions([
      { kind: "impression", ref: "b1" },
      { kind: "impression", ref: "b1" },
      { kind: "impression", ref: "b2" },
      { kind: "scroll", ref: "50" },
    ])
    expect(counts).toEqual({ b1: 2, b2: 1 })
  })
})

describe("blockCtr", () => {
  it("clics/impressions en %, borne a 100, null si 0 impression", () => {
    expect(blockCtr(3, 12)).toBe(25)
    expect(blockCtr(0, 10)).toBe(0)
    expect(blockCtr(5, 0)).toBeNull()
    expect(blockCtr(20, 10)).toBe(100) // borne
  })
})
