import { describe, it, expect } from "vitest"
import { placerLElement, placerSansCouvrir, tailleLibre, type Boite } from "./vocabulaireDuSupport"

// Un élément ajouté dans l'éditeur à plat se posait au centre du support — donc
// sur le QR (capture du 25 nov.). `placerSansCouvrir` choisit la place libre la
// plus proche de la position voulue.

const croise = (a: Boite, b: Boite) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y)
const MARGE = { x: 0.05, y: 0.05 }
const QR_AU_CENTRE: Boite = { x: 0.35, y: 0.35, w: 0.3, h: 0.3 }

describe("poser un élément sans couvrir le QR", () => {
  it("rien sur le chemin : la position voulue, telle quelle", () => {
    expect(placerSansCouvrir({ w: 0.3, h: 0.2 }, [], MARGE, { x: 0.35, y: 0.4 })).toEqual({ x: 0.35, y: 0.4 })
  })

  it("le QR au centre : l'élément se pose à côté, jamais dessus", () => {
    const t = { w: 0.3, h: 0.2 }
    const p = placerSansCouvrir(t, [QR_AU_CENTRE], MARGE, { x: 0.35, y: 0.4 })
    expect(croise({ ...p, ...t }, QR_AU_CENTRE)).toBe(false)
    // …et reste dans la zone de sécurité.
    expect(p.x).toBeGreaterThanOrEqual(MARGE.x)
    expect(p.y).toBeGreaterThanOrEqual(MARGE.y)
    expect(p.x + t.w).toBeLessThanOrEqual(1 - MARGE.x + 1e-9)
    expect(p.y + t.h).toBeLessThanOrEqual(1 - MARGE.y + 1e-9)
  })

  it("il garde un écart : il ne colle pas au QR", () => {
    const t = { w: 0.3, h: 0.2 }
    const p = placerSansCouvrir(t, [QR_AU_CENTRE], MARGE, { x: 0.35, y: 0.4 })
    const elargi: Boite = { x: QR_AU_CENTRE.x - 0.019, y: QR_AU_CENTRE.y - 0.019, w: QR_AU_CENTRE.w + 0.038, h: QR_AU_CENTRE.h + 0.038 }
    expect(croise({ ...p, ...t }, elargi)).toBe(false)
  })

  it("deux ajouts de suite ne s'empilent pas", () => {
    const t = { w: 0.3, h: 0.2 }
    const a = placerSansCouvrir(t, [QR_AU_CENTRE], MARGE, { x: 0.35, y: 0.4 })
    const b = placerSansCouvrir(t, [QR_AU_CENTRE, { ...a, ...t }], MARGE, { x: 0.35, y: 0.4 })
    expect(croise({ ...a, ...t }, { ...b, ...t })).toBe(false)
    expect(croise({ ...b, ...t }, QR_AU_CENTRE)).toBe(false)
  })

  it("sur un support rond, les quatre coins restent dans le cercle de sécurité", () => {
    const t = { w: 0.2, h: 0.1 }
    const p = placerSansCouvrir(t, [QR_AU_CENTRE], MARGE, { x: 0.4, y: 0.45 }, true)
    const R = 0.5 - 0.05
    for (const [x, y] of [[p.x, p.y], [p.x + t.w, p.y], [p.x, p.y + t.h], [p.x + t.w, p.y + t.h]])
      expect((x - 0.5) ** 2 + (y - 0.5) ** 2).toBeLessThanOrEqual(R * R + 1e-9)
    expect(croise({ ...p, ...t }, QR_AU_CENTRE)).toBe(false)
  })

  it("aucune place libre : la position voulue, comme avant (on ne perd pas l'ajout)", () => {
    const plein: Boite = { x: 0, y: 0, w: 1, h: 1 }
    expect(placerSansCouvrir({ w: 0.3, h: 0.2 }, [plein], MARGE, { x: 0.35, y: 0.4 })).toEqual({ x: 0.35, y: 0.4 })
  })

  it("la place choisie est la plus proche de celle voulue, pas un coin au hasard", () => {
    // Un QR étroit au centre : la place libre la plus proche est juste à côté.
    const qr: Boite = { x: 0.45, y: 0.3, w: 0.1, h: 0.4 }
    const p = placerSansCouvrir({ w: 0.1, h: 0.1 }, [qr], MARGE, { x: 0.45, y: 0.45 })
    expect(Math.hypot(p.x - 0.45, p.y - 0.45)).toBeLessThan(0.2)
  })
})

describe("sur un vrai support : marge, QR et contenu mesurés à l'écran", () => {
  const sticker = { shape: "rect", ratio: 1, hMm: 100, margin: 5 } as const
  const forme = { kind: "shape" as const, x: 0.35, y: 0.4, w: 0.3, h2: 0.2, size: 0.06, color: "#000", align: "center" as const, weight: 700, font: "", text: "", shape: "circle" }
  const t = { w: 0.3, h: 0.2 }
  const TITRE: Boite = { x: 0.1, y: 0.1, w: 0.8, h: 0.15 }

  it("la forme qui tombait sur le QR se pose ailleurs, hors du titre, dans la marge de 5 mm", () => {
    const p = placerLElement(forme, sticker, { qr: QR_AU_CENTRE, libres: [], contenu: [TITRE] })
    expect(croise({ ...p, ...t }, QR_AU_CENTRE)).toBe(false)
    expect(croise({ ...p, ...t }, TITRE)).toBe(false)
    expect(Math.min(p.x, p.y, 1 - p.x - t.w, 1 - p.y - t.h)).toBeGreaterThanOrEqual(0.05 - 1e-9)
  })

  it("pas de place hors de tout : au moins hors du QR", () => {
    // Le contenu remplit tout sauf le QR : on ne trouve rien de libre de tout.
    const partout: Boite[] = [{ x: 0, y: 0, w: 1, h: 0.33 }, { x: 0, y: 0.67, w: 1, h: 0.33 }, { x: 0, y: 0, w: 0.33, h: 1 }, { x: 0.67, y: 0, w: 0.33, h: 1 }]
    const p = placerLElement(forme, sticker, { qr: QR_AU_CENTRE, libres: [], contenu: partout })
    expect(croise({ ...p, ...t }, QR_AU_CENTRE), "le QR reste lisible").toBe(false)
  })

  it("pas de place hors de tout : on chevauche un titre plutôt qu'un élément de l'utilisateur", () => {
    const partout: Boite[] = [{ x: 0, y: 0, w: 1, h: 0.33 }, { x: 0, y: 0.67, w: 1, h: 0.33 }, { x: 0, y: 0, w: 0.33, h: 1 }, { x: 0.67, y: 0, w: 0.33, h: 1 }]
    const sien: Boite = { x: 0.05, y: 0.05, w: 0.4, h: 0.25 }
    const p = placerLElement(forme, sticker, { qr: QR_AU_CENTRE, libres: [sien], contenu: partout })
    expect(croise({ ...p, ...t }, QR_AU_CENTRE)).toBe(false)
    expect(croise({ ...p, ...t }, sien), "l'élément déjà posé reste visible").toBe(false)
  })

  it("rien de mesuré (aucun support affiché) : la position d'avant", () => {
    expect(placerLElement(forme, sticker, { qr: null, libres: [], contenu: [] })).toEqual({ x: 0.35, y: 0.4 })
  })
})

describe("l'emprise d'un élément, comme l'éditeur à plat la dessine", () => {
  it("un texte : sa largeur, et une hauteur rapportée au petit côté", () => {
    expect(tailleLibre({ kind: "text", w: 0.44, size: 0.06 }, 1)).toEqual({ w: 0.44, h: 0.06 * 1.2 })
    // Support deux fois plus large que haut : le petit côté est la hauteur.
    expect(tailleLibre({ kind: "text", w: 0.44, size: 0.06 }, 2).h).toBeCloseTo(0.072)
    // Deux fois plus haut que large : le petit côté est la largeur, la fraction de hauteur se divise par deux.
    expect(tailleLibre({ kind: "text", w: 0.44, size: 0.06 }, 0.5).h).toBeCloseTo(0.036)
  })
  it("une icône est carrée à l'écran", () => {
    const t = tailleLibre({ kind: "icon", w: 0.12, size: 0.12 }, 2)
    expect(t.w * 2).toBeCloseTo(t.h)   // largeur en fraction × rapport = hauteur en fraction
  })
  it("une forme : sa largeur et sa hauteur propres", () => {
    expect(tailleLibre({ kind: "shape", w: 0.3, h2: 0.2, size: 0.06 }, 1)).toEqual({ w: 0.3, h: 0.2 })
  })
})
