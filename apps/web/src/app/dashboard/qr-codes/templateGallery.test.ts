import { describe, it, expect } from "vitest"
import { isFav, toggleFav, pushRecentTpl, keepValid } from "./templateGallery"

describe("favoris", () => {
  it("isFav", () => {
    expect(isFav(["a", "b"], "b")).toBe(true)
    expect(isFav(["a"], "z")).toBe(false)
  })
  it("toggle ajoute en tete", () => {
    expect(toggleFav(["a"], "b")).toEqual(["b", "a"])
  })
  it("toggle retire si present", () => {
    expect(toggleFav(["a", "b"], "a")).toEqual(["b"])
  })
  it("id vide ignore", () => {
    expect(toggleFav(["a"], "")).toEqual(["a"])
  })
})

describe("recents", () => {
  it("ajoute en tete", () => {
    expect(pushRecentTpl(["a"], "b")).toEqual(["b", "a"])
  })
  it("dedupe et remonte", () => {
    expect(pushRecentTpl(["a", "b", "c"], "c")).toEqual(["c", "a", "b"])
  })
  it("plafonne", () => {
    const list = ["1", "2", "3", "4", "5", "6", "7", "8"]
    const out = pushRecentTpl(list, "9", 8)
    expect(out).toHaveLength(8)
    expect(out[0]).toBe("9")
    expect(out).not.toContain("8")
  })
  it("id vide ignore", () => {
    expect(pushRecentTpl(["a"], "")).toEqual(["a"])
  })
})

describe("keepValid", () => {
  const valid = new Set(["a", "b", "c"])
  it("filtre les ids inconnus", () => {
    expect(keepValid(["a", "zzz", "b"], valid)).toEqual(["a", "b"])
  })
  it("retire les doublons en gardant l'ordre", () => {
    expect(keepValid(["a", "a", "b"], valid)).toEqual(["a", "b"])
  })
  it("vide si rien de valide", () => {
    expect(keepValid(["x", "y"], valid)).toEqual([])
  })
})
