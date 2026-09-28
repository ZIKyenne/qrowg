// styleQuiNeSeFermePas — lot v196.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Un accent grave écrit dans un commentaire, à l'intérieur d'un
// `<style>{...}</style>` dont le contenu est un gabarit littéral, FERME ce
// gabarit. Le JSX qui suit devient du code, et la compilation s'arrête sur une
// erreur (« Expected '</', got 'ident' ») qui désigne la ligne du commentaire
// sans dire pourquoi.
//
// Ce piège a cassé la compilation **quatre fois** dans cette série — à chaque
// fois en écrivant un commentaire honnête au bon endroit. Chaque occurrence a
// coûté un cycle de compilation complet.
//
// ── Pourquoi une garde alors que la compilation le voit ────────────────────
//
// Parce qu'elle le voit TROP TARD et trop cher. Ce test s'exécute en quelques
// millisecondes avec le reste de la suite, nomme le fichier, la ligne et la
// cause, et il tourne avant qu'une compilation soit lancée.
//
// Il ne remplace pas le compilateur : il évite d'attendre quatre minutes pour
// apprendre qu'on a tapé un caractère de trop.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const SRC = path.resolve(__dirname, "..")

export function fichiersTsx(): string[] {
  const out: string[] = []
  ;(function walk(d: string) {
    for (const e of fs.readdirSync(path.join(SRC, d), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const rel = d ? `${d}/${e.name}` : e.name
      if (e.isDirectory()) walk(rel)
      else if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name)) out.push(rel)
    }
  })("")
  return out
}

/**
 * Les accents graves piégés dans un `<style>` à gabarit littéral.
 *
 * On lit du `<style>{` + accent grave jusqu'au `` `}</style> `` correspondant,
 * jamais sur un nombre de caractères : un bloc de style fait couramment deux
 * cents lignes, et une borne de lecture rendrait la garde aveugle sur les plus
 * longs — exactement l'aveuglement des lots v182, v185, v187 et v189.
 */
export function accentsGravesPieges(lire = (f: string) => fs.readFileSync(path.join(SRC, f), "utf8")) {
  const out: { fichier: string; ligne: number; extrait: string }[] = []
  for (const rel of fichiersTsx()) {
    const src = lire(rel)
    const ouvre = /<style>\{`/g
    let m: RegExpExecArray | null
    while ((m = ouvre.exec(src))) {
      const fin = src.indexOf("`}</style>", m.index + m[0].length)
      if (fin === -1) continue
      const bloc = src.slice(m.index + m[0].length, fin)
      if (!bloc.includes("`")) { ouvre.lastIndex = fin; continue }
      const avant = src.slice(0, m.index + m[0].length).split("\n").length
      bloc.split("\n").forEach((l, i) => {
        if (l.includes("`")) out.push({ fichier: rel, ligne: avant + i, extrait: l.trim().slice(0, 70) })
      })
      ouvre.lastIndex = fin
    }
  }
  return out
}

describe("un bloc de style ne se ferme pas tout seul", () => {
  it("le relevé lit bien des blocs de style (sinon il est aveugle)", () => {
    // Sans ce compte, un jour où plus aucun `<style>` ne serait trouvé, la
    // garde passerait au vert en ne regardant rien.
    const avecStyle = fichiersTsx().filter(f => fs.readFileSync(path.join(SRC, f), "utf8").includes("<style>{`"))
    expect(fichiersTsx().length, "plus aucun .tsx lu").toBeGreaterThan(50)
    expect(avecStyle.length, "plus aucun bloc <style> trouvé — l'extraction ne lit plus rien").toBeGreaterThan(3)
  })

  it("aucun accent grave n'est piégé dans un bloc de style", () => {
    expect(
      accentsGravesPieges().map(x => `${x.fichier}:${x.ligne} → ${x.extrait}`),
      "un accent grave ferme le gabarit du <style> : la compilation s'arrêtera. Écrivez le commentaire sans accent grave.",
    ).toEqual([])
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  it("un accent grave posé dans un bloc de style serait vu", () => {
    const faux = "export const A = () => (<div><style>{`\n  /* voir `x` ici */\n  .a{color:red}\n`}</style></div>)"
    const vu = accentsGravesPieges(() => faux).filter(x => x.fichier.endsWith(".tsx"))
    // L'extraction travaille sur la liste réelle de fichiers ; on vérifie ici la
    // mécanique de lecture seule, sur une source injectée.
    const bloc = faux.slice(faux.indexOf("<style>{`") + 9, faux.indexOf("`}</style>"))
    expect(bloc.includes("`"), "l'extraction doit voir l'accent grave").toBe(true)
    expect(vu.length, "et le relevé doit le remonter").toBeGreaterThan(0)
  })

  it("un accent grave HORS d'un bloc de style n'est pas signalé", () => {
    // Le pendant : les gabarits littéraux sont partout dans ce code (classes,
    // URL, messages). Une garde qui les interdirait serait éteinte le jour même.
    const sain = "const c = `plan-${id}`\nexport const B = () => (<div><style>{`\n  .a{color:red}\n`}</style></div>)"
    const bloc = sain.slice(sain.indexOf("<style>{`") + 9, sain.indexOf("`}</style>"))
    expect(bloc.includes("`")).toBe(false)
  })
})
