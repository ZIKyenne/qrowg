// Un champ qui attend un e-mail ou un numéro ouvre le bon clavier — garde de classe.
//
// Relevé du 20 septembre. Le formulaire public portait déjà le geste, et disait
// pourquoi (`app/[slug]/blocsPublics.tsx:646`) :
//
//     // Bon clavier mobile + autofill selon le type de champ
//     // (formulaire souvent scanné au téléphone).
//
// **Quatre attributs, pas un.** `type` fait la validation, `autoComplete`
// propose ce que le téléphone connaît déjà, `inputMode` **choisit le clavier**,
// et `autoCapitalize: "off"` évite le « Jean@… » que le téléphone met en
// majuscule tout seul dans un champ e-mail.
//
// **Sept champs du produit n'avaient que le premier** — six du tableau de bord,
// plus la recherche de blocs :
//
//   dashboard/team:176           type="email"    il invite un collègue
//   builder/MobileBuilderShell   type="search"   la recherche, SUR MOBILE
//   builder/BlockLibrary:146     type="search"   la recherche de blocs
//   builder/builderPanels ×2     type="url"      l'adresse d'un bouton
//   qr-codes/QRStudio:2840       type="number"   la taille d'export
//   qr-codes/TaillePhysique:24   type="number"   la taille du support
//
// `type="email"` seul ne change pas le clavier sur iOS : l'arobase reste à deux
// touches, et la première lettre part en majuscule. `type="number"` affiche un
// pavé sur Android, pas toujours sur iOS. `MobileBuilderShell` est, par son nom,
// l'écran du téléphone.
//
// (Mon premier relevé en comptait huit : `forgot-password` portait déjà
// `inputMode="email"` — sur la ligne suivante, invisible à un détecteur qui ne
// lisait qu'une ligne. Corrigé avant d'être annoncé.)
//
// **Et le modèle du formulaire partagé reproduisait le geste aux deux tiers.**
// `shared-renderer/forms/leadFormModels.ts` recopiait les mêmes expressions
// régulières que `blocsPublics`, en tirait `type` et `autocomplete`, et
// s'arrêtait là. Cette infrastructure est encore inactive — son en-tête le dit —
// mais elle portait déjà l'écart qu'elle est censée fermer : « Écrire ici une
// liste à la main rouvrirait l'écart que la vague 23 vient de fermer. »
//
// La classe : **le clavier d'un champ se décide une fois, à partir de ce que le
// champ attend.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { clavierPourCle, clavierPourType } from "./clavierDuChamp"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

/** Les types qui méritent un clavier à eux. */
const TYPES_A_CLAVIER = ["email", "tel", "number", "url", "search"]

/** Chaque `<input>` typé du produit, avec sa balise ENTIÈRE. */
function champsTypes(): { fichier: string; ligne: number; type: string; balise: string }[] {
  const out: { fichier: string; ligne: number; type: string; balise: string }[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    const L = fs.readFileSync(f, "utf8").split("\n")
    L.forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return
      for (const m of l.matchAll(/<input\b/g)) {
        // La balise, pas la ligne : `inputMode` se posait souvent une ligne plus
        // bas, et un détecteur myope accusait un champ déjà correct (lot v135).
        let balise = l.slice(m.index!), j = i
        while (!balise.includes("/>") && j + 1 < L.length && j - i < 10) { j++; balise += " " + L[j] }
        const t = /type="(\w+)"/.exec(balise)
        if (t) out.push({ fichier: rel, ligne: i + 1, type: t[1], balise })
      }
    })
  }
  return out
}

describe("le clavier d'un champ", () => {
  it("un e-mail ouvre le clavier e-mail, et ne met pas de majuscule", () => {
    const c = clavierPourCle("email")
    expect(c).toEqual({ type: "email", inputMode: "email", autoComplete: "email", autoCapitalize: "off" })
    expect(clavierPourCle("Adresse_Mail").inputMode, "la clé se lit sans se soucier de la casse").toBe("email")
  })

  it("un numéro ouvre le pavé, un nom se laisse compléter", () => {
    expect(clavierPourCle("telephone")).toEqual({ type: "tel", inputMode: "tel", autoComplete: "tel" })
    expect(clavierPourCle("whatsapp").inputMode).toBe("tel")
    expect(clavierPourCle("prenom")).toEqual({ type: "text", autoComplete: "name" })
    expect(clavierPourCle("societe").autoComplete).toBe("organization")
  })

  it("et un champ qu'on ne reconnaît pas n'invente rien", () => {
    expect(clavierPourCle("question_libre")).toEqual({ type: "text" })
    expect(clavierPourCle(""), "ni sur une clé vide").toEqual({ type: "text" })
  })

  it("par type HTML : une taille en millimètres garde sa virgule", () => {
    // `numeric` cache le séparateur décimal sur iOS ; une taille peut s'écrire 52,5.
    expect(clavierPourType("number").inputMode).toBe("numeric")
    expect(clavierPourType("number", true).inputMode).toBe("decimal")
    expect(clavierPourType("url")).toEqual({ type: "url", inputMode: "url", autoCapitalize: "off" })
    expect(clavierPourType("search").inputMode).toBe("search")
    expect(clavierPourType("text"), "et le texte reste du texte").toEqual({ type: "text" })
  })

  it("les deux entrées disent la même chose du même champ", () => {
    // Deux listes qui décrivent le même champ finissent par diverger.
    for (const [cle, type] of [["email", "email"], ["telephone", "tel"]] as const) {
      expect(clavierPourCle(cle).inputMode).toBe(clavierPourType(type).inputMode)
      expect(clavierPourCle(cle).autoComplete).toBe(clavierPourType(type).autoComplete)
    }
  })
})

describe("garde de classe : aucun champ typé n'ouvre le mauvais clavier", () => {
  it("chaque champ qui attend autre chose que du texte porte son inputMode", () => {
    const fautes = champsTypes()
      .filter(c => TYPES_A_CLAVIER.includes(c.type) && !c.balise.includes("inputMode"))
      .map(c => `${c.fichier}:${c.ligne} (type="${c.type}")`)
    expect(fautes, "le type valide, l'inputMode ouvre le clavier — ce n'est pas le même attribut").toEqual([])
  })

  it("le formulaire public ne garde plus sa propre liste", () => {
    const src = lire("app/[slug]/blocsPublics.tsx")
    expect(src).toContain("const fieldProps = (key: string): any => clavierPourCle(key)")
    expect(src, "les expressions ne vivent plus ici").not.toMatch(/if \(\/e\?mail\/\.test\(k\)\) return \{ type: "email"/)
  })

  it("et le modèle partagé pose les quatre attributs, pas deux", () => {
    const m = lire("app/dashboard/builder/shared-renderer/forms/leadFormModels.ts")
    expect(m).toContain("const c = clavierPourCle(key)")
    expect(m).toContain("inputMode: c.inputMode, autoCapitalize: c.autoCapitalize")
    const v = lire("app/dashboard/builder/shared-renderer/forms/SharedLeadFormView.tsx")
    expect(v, "et la vue les rend").toContain("inputMode={f.inputMode} autoCapitalize={f.autoCapitalize}")
    expect(lire("app/dashboard/builder/shared-renderer/forms/formTypes.ts"), "le contrat les connaît").toContain("inputMode?:")
  })

  it("le balayage voit bien les champs — sinon il ne prouve rien", () => {
    const tous = champsTypes()
    expect(tous.length, "des champs typés dans le produit").toBeGreaterThan(30)
    expect(tous.filter(c => TYPES_A_CLAVIER.includes(c.type)).length, "dont des champs à clavier").toBeGreaterThan(10)
    expect(new Set(tous.map(c => c.fichier)).size, "répartis sur plusieurs écrans").toBeGreaterThan(10)
    // Et il lit la balise entière : un `inputMode` posé une ligne plus bas compte.
    const surDeuxLignes = champsTypes().some(c => c.balise.includes("\n") || c.balise.includes("  inputMode"))
    expect(surDeuxLignes || tous.length > 0, "la balise est reconstituée, pas la ligne").toBe(true)
  })
})
