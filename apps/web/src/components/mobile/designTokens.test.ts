import { describe, it, expect } from "vitest"
import { T, clampTap, elevation, tokensCss } from "./designTokens"

describe("designTokens", () => {
  it("cible tactile ≥ 44px (garantie ergonomie)", () => {
    expect(T.tap).toBeGreaterThanOrEqual(44)
  })
  it("échelle d'espacement strictement croissante", () => {
    const s = Object.values(T.space)
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1])
  })
  it("échelle de rayons croissante (sm<md<lg<xl)", () => {
    expect(T.radius.sm).toBeLessThan(T.radius.md)
    expect(T.radius.md).toBeLessThan(T.radius.lg)
    expect(T.radius.lg).toBeLessThan(T.radius.xl)
  })
  it("clampTap ne descend jamais sous la cible minimale", () => {
    expect(clampTap(10)).toBe(T.tap)
    expect(clampTap(60)).toBe(60)
    expect(clampTap(45.6)).toBe(T.tap) // 46 arrondi, >= tap
  })
  it("elevation borne les niveaux (pas d'index hors limites)", () => {
    expect(elevation(0)).toBe("none")
    expect(elevation(99)).toBe(T.elevation[T.elevation.length - 1])
    expect(elevation(-5)).toBe("none")
  })
  it("tokensCss expose les variables clés", () => {
    const css = tokensCss()
    expect(css).toContain("--qf-gold:#C9A84C")
    expect(css).toContain(`--qf-tap:${T.tap}px`)
    expect(css.startsWith(":root{")).toBe(true)
    expect(css.trim().endsWith("}")).toBe(true)
  })
})
