// Garde des compteurs du tableau de bord — refonte de la coquille (28 septembre).
//
// Le relevé qui a motivé le module : sur un compte à 13 pages, la puce de
// l'en-tête annonçait « Pages publiées 13 / 25 » (en comptant des QR actifs) et
// le cockpit « Pages créées 13 · 8 publiées » (en comptant une liste plafonnée
// à 20). Trois nombres différents portaient le même nom.

import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PAGES_LISTE } from "./perimetreDeMesure"
import {
  totalDePages, totalDePubliees, texteDeCompte, phrasePubliees,
  phraseVues, precisionDesVues, phraseDuQuota,
} from "./comptesDuTableauDeBord"

describe("le total de pages n'est pas la longueur de la liste", () => {
  it("un count exact fait toujours foi", () => {
    expect(totalDePages(26, 20, 20)).toBe(26)
    expect(totalDePages(0, 0, 20)).toBe(0)
  })

  it("sans count, une liste plus courte que son plafond EST le compte", () => {
    expect(totalDePages(null, 13, 20)).toBe(13)
    expect(totalDePages(undefined, 0, 20)).toBe(0)
  })

  it("au plafond exact, on ne sait pas — et on ne devine pas", () => {
    // C'est le cas du relevé du 14 septembre : 26 pages, 20 lues, « 20 » affiché.
    expect(totalDePages(null, 20, 20)).toBeNull()
    expect(totalDePages(NaN, 20, 20)).toBeNull()
  })

  it("une valeur absurde ne devient pas un chiffre", () => {
    for (const v of [-3, "douze", {}, NaN, Infinity]) expect(totalDePages(v, null, 20), String(v)).toBeNull()
  })
})

describe("les publiées sont un sous-ensemble, jamais l'inverse", () => {
  it("un compte cohérent passe", () => {
    expect(totalDePubliees(8, 13)).toBe(8)
    expect(totalDePubliees(0, 13)).toBe(0)
    expect(totalDePubliees(13, 13)).toBe(13)
  })

  it("plus de publiées que de pages : les deux ne parlent pas du même périmètre, on se taît", () => {
    expect(totalDePubliees(13, 8)).toBeNull()
  })

  it("total inconnu : la publication reste affichable telle quelle", () => {
    expect(totalDePubliees(8, null)).toBe(8)
  })
})

describe("un inconnu ne s'écrit pas « 0 »", () => {
  it("le compteur", () => {
    expect(texteDeCompte(0)).toBe("0")
    expect(texteDeCompte(1234)).toBe("1 234")
    expect(texteDeCompte(null)).toBe("—")
  })

  it("la précision sous « Pages créées »", () => {
    expect(phrasePubliees(8, 13)).toBe("8 publiées sur 13")
    expect(phrasePubliees(1, 13)).toBe("1 publiée sur 13")
    expect(phrasePubliees(0, 13)).toBe("Aucune publiée")
    expect(phrasePubliees(0, 0)).toBe("Aucune page pour l'instant")
    expect(phrasePubliees(null, 13)).toBe("Publication inconnue")
    expect(phrasePubliees(3, null)).toBe("3 publiées")
  })

  it("les vues d'une page, avec l'accord français", () => {
    expect(phraseVues(0)).toBe("0 vue")
    expect(phraseVues(1)).toBe("1 vue")
    expect(phraseVues(2)).toBe("2 vues")
    expect(phraseVues(1500)).toBe("1 500 vues")
    expect(phraseVues(null)).toBe("—")
  })
})

describe("les quotas disent ce qu'ils comptent", () => {
  it("les vues : aucun plan n'en limite, la phrase ne promet donc rien", () => {
    expect(precisionDesVues(null, 507)).toBe("Sans limite sur votre plan")
    expect(precisionDesVues(undefined, 0)).toBe("Sans limite sur votre plan")
  })

  it("...mais un plan qui en limiterait serait dit exactement", () => {
    expect(precisionDesVues(2000, 507)).toBe("507 sur 2 000 ce mois-ci")
    expect(precisionDesVues(2000, null)).toBe("0 sur 2 000 ce mois-ci")
  })

  it("le quota du plan compte des QR de page actifs, et le dit", () => {
    // L'étiquette « Pages publiées » posée sur ce nombre est l'origine exacte de
    // l'incohérence 13 / 8 relevée à l'écran.
    expect(phraseDuQuota(13, 25)).toBe("13 / 25 QR de page actifs")
    expect(phraseDuQuota(1, 25)).toBe("1 / 25 QR de page actifs")
    expect(phraseDuQuota(12, null)).toBe("12 QR de page actifs · illimité")
    expect(phraseDuQuota(1, null)).toBe("1 QR de page actif · illimité")
    expect(phraseDuQuota(null, 25)).toBeNull()
  })
})

describe("l'écran lit bien ces compteurs", () => {
  const lire = (p: string) => readFileSync(join(__dirname, "..", p), "utf8")

  it("le serveur compte les pages ET les publiées, exactement", () => {
    const page = lire("app/dashboard/page.tsx")
    expect(page).toContain('.eq("status", "published")')
    expect(page).toContain("pagesTotal={pagesTotal ?? null}")
    expect(page).toContain("initialPagesTotal=")
    expect(page).toContain("initialPubliees=")
  })

  it("le cockpit n'affiche plus la longueur de la liste comme un total", () => {
    const client = lire("app/dashboard/DashboardClient.tsx")
    expect(client).toContain("totalDePages(")
    expect(client).toContain("totalDePubliees(")
    expect(client).toContain("PAGES_LISTE")
    expect(client, "« Pages créées » repart de la liste affichée")
      .not.toMatch(/label: "Pages créées", value: String\(pages\.length\)/)
  })

  it("la puce du plan ne s'appelle plus « Pages publiées »", () => {
    const shell = lire("app/dashboard/DashboardShell.tsx")
    expect(shell).toContain("phraseDuQuota(")
    expect(shell, "l'étiquette fausse est revenue").not.toContain("Pages publiées {quota}")
  })

  it("le plafond de la liste reste celui du périmètre de mesure", () => {
    expect(PAGES_LISTE).toBe(20)
  })
})
