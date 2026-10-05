import { describe, it, expect } from "vitest"
import {
  FRACTION_TAILLE, PALIERS, hauteurDeFeuille, hauteurUtile, seuilDeFermeture,
  glissementFerme, tailleApresGlissement, laFeuilleSuitLeDoigt, ouvrir, actionDeRetour,
} from "./feuilleMobile"
import { SNAP_FRACTION, snapHeight, usableHeight } from "@/app/dashboard/builder/builderMobile"

describe("les fractions restent celles qui ont été validées", () => {
  it("elles sont identiques à celles du builder, au centième près", () => {
    // Le point le plus important de ce fichier. La feuille de route proposait
    // 0,38 / 0,58 / 0,84 — des nombres que j'avais choisis seul. Ceux-ci ont été
    // réglés en juillet avec de vraies captures sur un vrai iPhone. Si ce test
    // rougit, c'est qu'on a changé le comportement d'un écran validé sans
    // qu'aucune mesure ne le demande.
    expect(FRACTION_TAILLE.compact).toBe(SNAP_FRACTION.compact)
    expect(FRACTION_TAILLE.medium).toBe(SNAP_FRACTION.medium)
    expect(FRACTION_TAILLE.expanded).toBe(SNAP_FRACTION.expanded)
  })

  it("la hauteur calculée est la même que celle du builder", () => {
    for (const d of [0, 100, 200, 400, 844, 932, 1200])
      for (const t of PALIERS)
        expect(hauteurDeFeuille(t, d), `${t} sur ${d}px`).toBe(snapHeight(t, d))
  })

  it("la hauteur utile sous le clavier est la même", () => {
    for (const [v, k] of [[844, 0], [844, 336], [844, 900], [0, 0], [600, -10]])
      expect(hauteurUtile(v, k)).toBe(usableHeight(v, k))
  })
})

describe("hauteurDeFeuille — bornes", () => {
  it("ne descend pas sous 160 px : en dessous, l'en-tête mange tout", () => {
    expect(hauteurDeFeuille("compact", 100)).toBe(160)
    expect(hauteurDeFeuille("compact", 0)).toBe(160)
  })

  it("ne dépasse jamais la hauteur disponible", () => {
    for (const d of [200, 400, 844]) for (const t of PALIERS)
      expect(hauteurDeFeuille(t, d)).toBeLessThanOrEqual(Math.max(160, d))
  })

  it("les paliers sont ordonnés, à hauteur égale", () => {
    const h = (t: (typeof PALIERS)[number]) => hauteurDeFeuille(t, 844)
    expect(h("compact")).toBeLessThan(h("medium"))
    expect(h("medium")).toBeLessThan(h("expanded"))
  })
})

describe("seuilDeFermeture — relatif, mais borné", () => {
  it("vaut un tiers de la feuille entre les bornes", () => {
    expect(seuilDeFermeture(600)).toBe(200)   // 200 = le plafond
    expect(seuilDeFermeture(450)).toBe(150)
    expect(seuilDeFermeture(300)).toBe(100)
  })

  it("ne descend pas sous 60 px : sinon le geste part au tremblement", () => {
    expect(seuilDeFermeture(160)).toBe(60)
    expect(seuilDeFermeture(60)).toBe(60)
  })

  it("ne dépasse pas 200 px : sinon il faut traverser l'écran", () => {
    expect(seuilDeFermeture(2000)).toBe(200)
  })

  it("une petite feuille se ferme d'un geste plus court qu'une grande", () => {
    // La raison d'être du seuil relatif : un seuil fixe ferme la petite par
    // accident et rend la grande impossible à fermer d'une main.
    expect(seuilDeFermeture(hauteurDeFeuille("compact", 844)))
      .toBeLessThan(seuilDeFermeture(hauteurDeFeuille("expanded", 844)))
  })
})

describe("glissementFerme", () => {
  it("ferme au-delà du seuil, pas en deçà", () => {
    const h = 450                      // seuil = 150
    expect(glissementFerme(149, h)).toBe(false)
    expect(glissementFerme(150, h)).toBe(true)
    expect(glissementFerme(400, h)).toBe(true)
  })

  it("un glissement vers le haut ne ferme jamais", () => {
    expect(glissementFerme(-300, 450)).toBe(false)
  })
})

describe("tailleApresGlissement", () => {
  const h = 450                        // seuil 150, minimum d'intention 75

  it("descend d'un palier vers le bas, monte d'un palier vers le haut", () => {
    expect(tailleApresGlissement("medium", 100, h)).toBe("compact")
    expect(tailleApresGlissement("medium", -100, h)).toBe("expanded")
  })

  it("ignore ce qui est sous l'intention : c'est un doigt qui tremble", () => {
    expect(tailleApresGlissement("medium", 40, h)).toBe("medium")
    expect(tailleApresGlissement("medium", -40, h)).toBe("medium")
  })

  it("ne sort jamais des paliers existants", () => {
    expect(tailleApresGlissement("compact", 300, h)).toBe("compact")
    expect(tailleApresGlissement("expanded", -300, h)).toBe("expanded")
  })
})

describe("laFeuilleSuitLeDoigt — le défaut le plus pénible des feuilles", () => {
  it("vers le bas, en haut de liste : la feuille bouge", () => {
    expect(laFeuilleSuitLeDoigt(0, 50)).toBe(true)
  })

  it("vers le bas, au MILIEU d'une liste : c'est la liste qui défile", () => {
    // Sans cette règle : on lit une liste, on continue vers le bas, et la
    // feuille se ferme sous les doigts.
    expect(laFeuilleSuitLeDoigt(120, 50)).toBe(false)
  })

  it("vers le haut : toujours la liste", () => {
    expect(laFeuilleSuitLeDoigt(0, -50)).toBe(false)
    expect(laFeuilleSuitLeDoigt(300, -50)).toBe(false)
  })

  it("un défilement négatif (rebond iOS) compte comme le haut de liste", () => {
    expect(laFeuilleSuitLeDoigt(-20, 50)).toBe(true)
  })
})

describe("une seule feuille à la fois", () => {
  it("la seconde demande remplace la première, elle ne l'empile pas", () => {
    expect(ouvrir("filtres", "tri")).toBe("tri")
    expect(ouvrir(null, "filtres")).toBe("filtres")
  })
})

describe("actionDeRetour", () => {
  it("la feuille passe avant le plein écran, qui passe avant quitter", () => {
    expect(actionDeRetour({ feuilleOuverte: true, pleinEcran: true })).toBe("fermerFeuille")
    expect(actionDeRetour({ pleinEcran: true })).toBe("quitterPleinEcran")
    expect(actionDeRetour({})).toBe("partir")
  })
})
