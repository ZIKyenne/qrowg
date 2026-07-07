import { describe, it, expect } from "vitest"
import { formatDay, buildDailyData, buildDeviceData, buildSourceData } from "./analyticsAgg"

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
