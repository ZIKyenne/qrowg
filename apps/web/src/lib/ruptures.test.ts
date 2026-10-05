import { describe, it, expect } from "vitest"
import { RUPTURES, largeurDe, requete, estCompact, densite, palier, LARGEURS_CONNUES } from "./ruptures"

// Le moteur des ruptures. Pur, donc testable sans navigateur.
//
// On vérifie surtout ce qui ferait repartir la dérive : qu'il y en ait QUATRE,
// qu'elles soient ordonnées, et que la frontière du tactile soit une seule.

describe("ruptures — quatre, ordonnées, nommées", () => {
  it("il y en a exactement quatre", () => {
    // Le jour où une cinquième apparaît, ce test le dit. C'est tout son objet :
    // le dépôt en comptait 44.
    expect(Object.keys(RUPTURES)).toEqual(["sm", "md", "lg", "xl"])
  })

  it("elles sont strictement croissantes", () => {
    expect(LARGEURS_CONNUES).toEqual([360, 640, 900, 1200])
    for (let i = 1; i < LARGEURS_CONNUES.length; i++)
      expect(LARGEURS_CONNUES[i]).toBeGreaterThan(LARGEURS_CONNUES[i - 1])
  })

  it("largeurDe et requete disent la même chose", () => {
    expect(largeurDe("md")).toBe(640)
    expect(requete("md")).toBe("(max-width: 640px)")
    expect(requete("xl")).toBe("(max-width: 1200px)")
  })
})

describe("estCompact — une seule frontière tactile", () => {
  it("la frontière est md, bornes incluses du bon côté", () => {
    expect(estCompact(320)).toBe(true)
    expect(estCompact(390)).toBe(true)
    expect(estCompact(430)).toBe(true)
    expect(estCompact(640)).toBe(true)   // la borne appartient au compact
    expect(estCompact(641)).toBe(false)
    expect(estCompact(1280)).toBe(false)
  })

  it("les sept largeurs de téléphone de la matrice QA sont toutes compactes", () => {
    // Si l'une d'elles tombait du mauvais côté, un iPhone recevrait la mise en
    // page de tablette. C'est arrivé : 859 d'un côté, 860 de l'autre.
    for (const l of [320, 360, 375, 390, 393, 414, 430]) expect(estCompact(l), `${l}px`).toBe(true)
  })

  it("une tablette portrait n'est PAS compacte", () => {
    // 768 px : le défaut historique de `useIsMobile` l'aurait dit « mobile ».
    expect(estCompact(768)).toBe(false)
  })
})

describe("densite — le pont vers le CSS", () => {
  it("rend deux valeurs, et deux seulement", () => {
    expect(densite(390)).toBe("compacte")
    expect(densite(1280)).toBe("confortable")
  })

  it("elle suit estCompact sans jamais s'en écarter", () => {
    for (const l of [200, 320, 639, 640, 641, 900, 1201, 2000])
      expect(densite(l), `${l}px`).toBe(estCompact(l) ? "compacte" : "confortable")
  })
})

describe("palier", () => {
  it("classe chaque largeur dans son palier", () => {
    expect(palier(320)).toBe("sm")
    expect(palier(360)).toBe("sm")
    expect(palier(390)).toBe("md")
    expect(palier(640)).toBe("md")
    expect(palier(768)).toBe("lg")
    expect(palier(900)).toBe("lg")
    expect(palier(1024)).toBe("xl")
    expect(palier(1200)).toBe("xl")
  })

  it("au-delà de xl, il n'y a pas de nom — et c'est voulu", () => {
    // Inventer « xxl » ferait revenir la cinquième rupture par la fenêtre.
    expect(palier(1201)).toBeNull()
    expect(palier(3840)).toBeNull()
  })
})
