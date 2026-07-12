import { describe, it, expect } from "vitest"
import { alignDeltas, distributeDeltas, type Box } from "./alignDistribute"

const b = (left: number, top: number, width: number, height: number): Box => ({ left, top, width, height })
// applique un delta à une boîte
const apply = (box: Box, d: { dx: number; dy: number }): Box => ({ ...box, left: box.left + d.dx, top: box.top + d.dy })

describe("alignDeltas", () => {
  const boxes = [b(10, 10, 40, 20), b(100, 50, 20, 20), b(60, 200, 30, 60)]
  it("left : tous les bords gauches à la valeur mini (10)", () => {
    const out = alignDeltas(boxes, "left").map((d, i) => apply(boxes[i], d))
    expect(out.every(o => o.left === 10)).toBe(true)
    expect(alignDeltas(boxes, "left").every(d => d.dy === 0)).toBe(true)  // n'agit qu'en X
  })
  it("right : tous les bords droits à la valeur maxi (120)", () => {
    const out = alignDeltas(boxes, "right").map((d, i) => apply(boxes[i], d))
    expect(out.every(o => o.left + o.width === 120)).toBe(true)
  })
  it("centerH : tous les centres X égaux au centre commun", () => {
    // minL=10, maxR=120 -> cx=65
    const out = alignDeltas(boxes, "centerH").map((d, i) => apply(boxes[i], d))
    expect(out.every(o => o.left + o.width / 2 === 65)).toBe(true)
  })
  it("top / bottom / middleV agissent en Y", () => {
    // minT=10, maxB=260 -> cy=135
    expect(alignDeltas(boxes, "top").map((d, i) => apply(boxes[i], d)).every(o => o.top === 10)).toBe(true)
    expect(alignDeltas(boxes, "bottom").map((d, i) => apply(boxes[i], d)).every(o => o.top + o.height === 260)).toBe(true)
    expect(alignDeltas(boxes, "middleV").map((d, i) => apply(boxes[i], d)).every(o => o.top + o.height / 2 === 135)).toBe(true)
    expect(alignDeltas(boxes, "top").every(d => d.dx === 0)).toBe(true)
  })
  it("liste vide -> []", () => {
    expect(alignDeltas([], "left")).toEqual([])
  })
})

describe("distributeDeltas", () => {
  it("< 3 objets -> aucune translation", () => {
    expect(distributeDeltas([b(0, 0, 10, 10), b(100, 0, 10, 10)], "h")).toEqual([{ dx: 0, dy: 0 }, { dx: 0, dy: 0 }])
  })
  it("horizontal : espacement égal, extrêmes fixes", () => {
    // 3 objets largeur 10 entre x=0 et x=100 (fin du dernier = 110). span=110, total=30, gap=(110-30)/2=40
    const boxes = [b(0, 0, 10, 10), b(30, 0, 10, 10), b(100, 0, 10, 10)]
    const out = distributeDeltas(boxes, "h").map((d, i) => apply(boxes[i], d))
    expect(out[0].left).toBe(0)            // 1er fixe
    expect(out[2].left).toBe(100)          // dernier fixe
    expect(out[1].left).toBe(50)           // 0 + 10 + 40 = 50
    // gaps égaux entre bords
    const g1 = out[1].left - (out[0].left + 10)
    const g2 = out[2].left - (out[1].left + 10)
    expect(g1).toBe(g2)
  })
  it("respecte l'ordre spatial même si la liste est désordonnée", () => {
    const boxes = [b(100, 0, 10, 10), b(0, 0, 10, 10), b(30, 0, 10, 10)] // désordonné
    const out = distributeDeltas(boxes, "h").map((d, i) => apply(boxes[i], d))
    // le plus à gauche (index 1, x=0) reste ; le plus à droite (index 0, x=100) reste ; le milieu (index 2) -> 50
    expect(out[1].left).toBe(0)
    expect(out[0].left).toBe(100)
    expect(out[2].left).toBe(50)
  })
  it("vertical : distribue en Y", () => {
    const boxes = [b(0, 0, 10, 10), b(0, 20, 10, 10), b(0, 100, 10, 10)]
    const out = distributeDeltas(boxes, "v").map((d, i) => apply(boxes[i], d))
    expect(out[0].top).toBe(0)
    expect(out[2].top).toBe(100)
    expect(out[1].top).toBe(50)
    expect(distributeDeltas(boxes, "v").every(d => d.dx === 0)).toBe(true)
  })
})
