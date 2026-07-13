import { describe, it, expect } from "vitest"
import { pointInBox, stackedAt, boxCenter, type LayerBox } from "./stackedObjects"

const A: LayerBox = { id: "a", left: 0, top: 0, width: 100, height: 100 }   // grand fond
const B: LayerBox = { id: "b", left: 40, top: 40, width: 40, height: 40 }   // au-dessus, centre
const C: LayerBox = { id: "c", left: 200, top: 200, width: 20, height: 20 } // ailleurs

describe("pointInBox", () => {
  it("point interieur", () => expect(pointInBox(50, 50, A)).toBe(true))
  it("point sur le bord (inclus)", () => expect(pointInBox(0, 0, A)).toBe(true))
  it("point exterieur", () => expect(pointInBox(150, 50, A)).toBe(false))
})

describe("stackedAt — ordre pile (devant d'abord)", () => {
  it("dans la zone commune => B (devant) avant A (derriere)", () => {
    // boxes en ordre de dessin arriere->avant : [A, B]
    expect(stackedAt(50, 50, [A, B])).toEqual(["b", "a"])
  })
  it("hors de B mais dans A => seulement A", () => {
    expect(stackedAt(10, 10, [A, B])).toEqual(["a"])
  })
  it("aucune boite => vide", () => {
    expect(stackedAt(500, 500, [A, B, C])).toEqual([])
  })
  it("respecte l'ordre de dessin fourni (empilement a 3)", () => {
    const A2 = { ...A, id: "x1" }, B2 = { ...A, id: "x2" }, C2 = { ...A, id: "x3" }
    // dessine x1(fond) -> x2 -> x3(devant)
    expect(stackedAt(50, 50, [A2, B2, C2])).toEqual(["x3", "x2", "x1"])
  })
  it("n'inclut pas une boite non touchee", () => {
    expect(stackedAt(50, 50, [A, B, C])).toEqual(["b", "a"])
  })
})

describe("boxCenter", () => {
  it("centre correct", () => {
    expect(boxCenter(B)).toEqual({ x: 60, y: 60 })
  })
  it("le centre de B est bien dans A et B", () => {
    const c = boxCenter(B)
    expect(stackedAt(c.x, c.y, [A, B])).toEqual(["b", "a"])
  })
})
