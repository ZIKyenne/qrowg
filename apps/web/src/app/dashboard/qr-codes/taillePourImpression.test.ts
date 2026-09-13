// Des pixels, alors que le commerçant imprime des centimètres — garde de classe.
//
// Relevé du 13 septembre, sur l'écran d'export du QR Studio. Le panneau
// « Taille » propose 512px, 1024px, 2048px, 4096px, et dit, en tout et pour
// tout :
//
//     Export : 1024×1024px
//
// Rien ne relie ces pixels à la seule question de celui qui va imprimer : « ça
// fait quelle taille sur mon autocollant ? ». Le produit connaît pourtant la
// réponse et s'en sert ailleurs — `printPreflight` note 300 DPI « qualité
// imprimeur » et 150 DPI « correct pour un tirage rapide », `exportPlan` sait
// convertir, et le lot v74 connaît le plancher de 20 mm.
//
// Un commerçant qui prend « 512px » et le fait tirer en autocollant de 10 cm
// imprime à 130 DPI : sous le seuil que le produit lui-même appelle « trop
// faible pour l'impression ».
//
// La classe : quand le produit fabrique quelque chose qui finira sur du papier,
// il le dit dans l'unité du papier, avec ses propres seuils.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  DPI_IMPRIMEUR, DPI_TIRAGE_RAPIDE, TAILLES_PROPOSEES,
  mmPour, pxPour, formatTaille, phraseTaille, verdictImpression, tailleConseillee,
} from "./taillePourImpression"
import { MM_MIN_SCANNABLE } from "../print-studio/tailleQrImprimable"

const lire = (p: string) => fs.readFileSync(path.join(__dirname, p), "utf8")

describe("la conversion, dans les deux sens", () => {
  it("1024 px donnent 8,7 cm en qualité imprimeur", () => {
    expect(Math.round(mmPour(1024, DPI_IMPRIMEUR))).toBe(87)
    expect(Math.round(mmPour(512, DPI_IMPRIMEUR))).toBe(43)
    expect(Math.round(mmPour(4096, DPI_IMPRIMEUR))).toBe(347)
  })

  it("et l'aller-retour se retrouve", () => {
    for (const mm of [20, 50, 87, 200]) {
      const px = pxPour(mm, DPI_IMPRIMEUR)
      expect(Math.round(mmPour(px, DPI_IMPRIMEUR)), `${mm} mm`).toBe(mm)
    }
  })

  it("ne renvoie jamais de valeur absurde sur une entrée absurde", () => {
    for (const v of [0, -5, NaN]) {
      expect(mmPour(v, DPI_IMPRIMEUR), String(v)).toBe(0)
      expect(pxPour(v, DPI_IMPRIMEUR), String(v)).toBe(0)
      expect(mmPour(1024, v), String(v)).toBe(0)
    }
    expect(formatTaille(0)).toBe("—")
  })

  it("affiche l'unité dans laquelle on pense à cette échelle", () => {
    expect(formatTaille(43)).toBe("43 mm")
    expect(formatTaille(86.7)).toBe("87 mm")
    expect(formatTaille(173)).toBe("17,3 cm")
    expect(formatTaille(200)).toBe("20 cm")
  })
})

describe("ce qu'on dit à côté de chaque taille", () => {
  it("donne les deux qualités, dans les mots du produit", () => {
    const p = phraseTaille(1024)
    expect(p).toContain("87 mm")
    expect(p).toContain("imprimeur")
    expect(p).toContain("17,3 cm")
    expect(p).toContain("tirage rapide")
  })
})

describe("le jugement, quand la taille voulue est dite", () => {
  it("le cas du relevé : 512 px sur 10 cm, c'est trop peu", () => {
    const v = verdictImpression(512, 100)
    expect(v.qualite).toBe("insuffisante")
    expect(v.phrase).toContain("130 DPI")
    // Et il dit quoi prendre à la place.
    expect(v.phrase).toContain(`${pxPour(100, DPI_IMPRIMEUR)} px`)
  })

  it("reconnaît la qualité imprimeur et le tirage rapide", () => {
    expect(verdictImpression(1024, 80).qualite).toBe("imprimeur")
    expect(verdictImpression(1024, 150).qualite).toBe("rapide")
  })

  it("les seuils sont ceux de printPreflight, pas des inventions", () => {
    const preflight = lire("printPreflight.ts")
    expect(preflight).toContain("grade3(m.dpi, 300, 150)")
    expect(DPI_IMPRIMEUR).toBe(300)
    expect(DPI_TIRAGE_RAPIDE).toBe(150)
  })

  it("sous le plancher de scannabilité, la résolution ne sauve rien", () => {
    const v = verdictImpression(4096, MM_MIN_SCANNABLE - 1)
    expect(v.qualite).toBe("trop_petit")
    expect(v.phrase).toContain(`${MM_MIN_SCANNABLE} mm`)
    expect(v.phrase).toContain("ne se scannera pas")
    // À la limite exacte, on ne crie plus au loup.
    expect(verdictImpression(4096, MM_MIN_SCANNABLE).qualite).not.toBe("trop_petit")
  })
})

describe("le bouton qu'on propose de prendre", () => {
  it("la plus petite taille proposée qui suffit vraiment", () => {
    expect(tailleConseillee(43)).toBe(512)
    expect(tailleConseillee(50)).toBe(1024)
    expect(tailleConseillee(100)).toBe(2048)
    expect(tailleConseillee(300)).toBe(4096)
  })

  it("et rien du tout quand aucune ne suffit — on ne fait pas croire", () => {
    expect(tailleConseillee(1000)).toBeNull()
    expect(tailleConseillee(0)).toBeNull()
    expect(tailleConseillee(-10)).toBeNull()
  })

  it("ce qu'elle conseille passe bien le jugement", () => {
    for (const mm of [25, 43, 60, 100, 200, 340]) {
      const t = tailleConseillee(mm)
      expect(t, `${mm} mm`).toBeTruthy()
      expect(verdictImpression(t!, mm).qualite, `${mm} mm`).toBe("imprimeur")
    }
  })

  it("les tailles conseillées sont celles que l'écran propose", () => {
    const studio = lire("QRStudio.tsx")
    for (const t of TAILLES_PROPOSEES) expect(studio, `${t}px`).toContain(String(t))
    expect(studio).toContain("[512, 1024, 2048, 4096, \"custom\"]")
  })
})

describe("l'écran d'export le dit enfin", () => {
  it("le bloc est branché", () => {
    const studio = lire("QRStudio.tsx")
    expect(studio).toContain("<TaillePhysique")
    expect(studio).toContain("expMm")
  })

  it("l'affichage vit à part — QRStudio.tsx est tenu sous 3 000 lignes", () => {
    const bloc = lire("TaillePhysique.tsx")
    expect(bloc).toContain("phraseTaille(")
    expect(bloc).toContain("verdictImpression(")
    expect(bloc).toContain("tailleConseillee(")
    expect(lire("QRStudio.tsx").split("\n").length).toBeLessThan(3000)
  })
})
