import { describe, it, expect } from "vitest"
import { dist, isLongPress, exceedsMove, LONG_PRESS_MS, MOVE_TOLERANCE } from "./touchGestures"

describe("dist", () => {
  it("distance 3-4-5", () => expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5))
  it("meme point => 0", () => expect(dist({ x: 7, y: 9 }, { x: 7, y: 9 })).toBe(0))
})

describe("isLongPress", () => {
  it("appui assez long et immobile => vrai", () => {
    expect(isLongPress(600, 3)).toBe(true)
  })
  it("trop court => faux", () => {
    expect(isLongPress(300, 0)).toBe(false)
  })
  it("assez long mais a bouge => faux (c'est un glisser)", () => {
    expect(isLongPress(800, 40)).toBe(false)
  })
  it("bornes inclusives (>= ms, <= tolerance)", () => {
    expect(isLongPress(LONG_PRESS_MS, MOVE_TOLERANCE)).toBe(true)
    expect(isLongPress(LONG_PRESS_MS - 1, 0)).toBe(false)
    expect(isLongPress(LONG_PRESS_MS, MOVE_TOLERANCE + 1)).toBe(false)
  })
  it("seuils personnalises", () => {
    expect(isLongPress(200, 2, 150, 5)).toBe(true)
    expect(isLongPress(100, 2, 150, 5)).toBe(false)
  })
})

describe("exceedsMove", () => {
  it("faible deplacement => faux", () => {
    expect(exceedsMove({ x: 0, y: 0 }, { x: 5, y: 5 })).toBe(false) // ~7.07 < 12
  })
  it("grand deplacement => vrai", () => {
    expect(exceedsMove({ x: 0, y: 0 }, { x: 20, y: 0 })).toBe(true)
  })
  it("pile a la tolerance => faux (strict >)", () => {
    expect(exceedsMove({ x: 0, y: 0 }, { x: MOVE_TOLERANCE, y: 0 })).toBe(false)
  })
})
