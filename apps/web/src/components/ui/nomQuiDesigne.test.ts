// Un nom de réglage désigne le champ qu'il nomme — garde de classe.
//
// Relevé du 15 septembre. Le produit écrit 166 étiquettes. **Quarante-six**
// désignent leur champ, par `htmlFor` ou en l'englobant. **Cent vingt ne
// désignent rien.** Le texte est là — écrit, juste, visible — et relié à rien.
//
// Sur ces cent vingt, **cinquante et une** étaient posées DIRECTEMENT au-dessus
// d'un vrai champ de saisie : le cas où il n'y a pas à discuter.
//
//   builder/builderPanels.tsx        27      profile/page.tsx              7
//   domains/DomainRoutesPanel.tsx     3      templates/page.tsx            3
//   analytics/GoalsDashboard.tsx      3      … et huit autres écrans
//
// Ce que ça coûte :
//
//  · un lecteur d'écran annonce le champ par son `placeholder`, donc par un
//    EXEMPLE — « Jean Dupont » — jamais par son nom, « Nom complet » ;
//  · cliquer le mot ne place pas le curseur dans le champ, alors que ce geste
//    marche partout ailleurs sur le web et dans tout le système ;
//  · sur un téléphone, le mot n'agrandit pas la cible : onze pixels de surface
//    morte au-dessus d'un champ qu'on vise au pouce.
//
// Et le produit savait faire : quarante-six fois.
//
// Les soixante-neuf autres sont posées sur autre chose qu'un champ — un groupe
// de boutons, un interrupteur. Une `<label>` n'y a rien à désigner : ce n'est
// pas une étiquette, c'est le nom d'un groupe. Trois d'entre elles, mêlées aux
// cinquante et une, ont été reprises : le groupe reçoit son nom par
// `role="group" aria-label`, l'étiquette redevient un `<span>`. Les soixante-six
// qui restent sont comptées ici et ne peuvent que diminuer.
//
// La classe : **un nom de réglage désigne le champ qu'il nomme.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const SRC = path.join(__dirname, "../..")
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

/** Fin de la balise ouverte en `i0` : le premier `>` hors accolade et hors chaîne. */
function finDeBalise(s: string, i0: number): number {
  let i = i0, prof = 0, chaine: string | null = null
  while (i < s.length) {
    const c = s[i]
    if (chaine) {
      if (c === "\\") { i += 2; continue }
      if (c === chaine) chaine = null
    } else if (c === '"' || c === "'" || c === "`") chaine = c
    else if (c === "{") prof++
    else if (c === "}") prof--
    else if (c === ">" && prof === 0) return i
    i++
  }
  return -1
}

type Etiquette = { fichier: string; ligne: number; relie: boolean; surUnChamp: boolean }

function etiquettes(): Etiquette[] {
  const out: Etiquette[] = []
  for (const f of fichiers()) {
    const s = fs.readFileSync(f, "utf8")
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    for (const m of s.matchAll(/<label\b/g)) {
      const i0 = m.index! + m[0].length
      const fin = finDeBalise(s, i0)
      if (fin < 0) continue
      const tag = s.slice(m.index!, fin + 1)
      const finLbl = s.indexOf("</label>", fin)
      const ligne = s.slice(0, m.index!).split("\n").length
      // Reliée : par htmlFor, ou parce qu'elle englobe son champ.
      const relie = tag.includes("htmlFor") ||
        (finLbl > 0 && /<(input|textarea|select)\b/.test(s.slice(fin + 1, finLbl)))
      if (relie) { out.push({ fichier: rel, ligne, relie: true, surUnChamp: true }); continue }
      const apres = finLbl > 0 ? s.slice(finLbl + 8, finLbl + 8 + 240) : ""
      const mc = /<(input|textarea|select)\b/.exec(apres)
      const surUnChamp = !!mc && !/<(div|span|p|button|section)\b/.test(apres.slice(0, mc.index))
      out.push({ fichier: rel, ligne, relie: false, surUnChamp })
    }
  }
  return out
}

/**
 * Les étiquettes posées sur autre chose qu'un champ — un groupe de boutons, un
 * interrupteur. Ce ne sont pas des étiquettes : ce sont des noms de groupe, et
 * ils se posent autrement (`role="group"` + `aria-label`, ou un simple `span`).
 * Ce plafond est un cliquet : il ne peut que descendre.
 */
const ETIQUETTES_POSEES_SUR_UN_GROUPE = 69

describe("le nom d'un réglage et le champ qu'il nomme", () => {
  it("aucune étiquette n'est posée sur un champ sans le désigner", () => {
    const fautes = etiquettes()
      .filter(e => !e.relie && e.surUnChamp)
      .map(e => `${e.fichier}:${e.ligne}`)
    expect(fautes, "passer par <Reglage nom=… >{id => <input id={id} …/>}</Reglage>").toEqual([])
  })

  it("et celles qui nomment un groupe ne se multiplient pas", () => {
    const surUnGroupe = etiquettes().filter(e => !e.relie && !e.surUnChamp).length
    expect(surUnGroupe, "une <label> qui ne désigne aucun champ n'est pas une étiquette")
      .toBeLessThanOrEqual(ETIQUETTES_POSEES_SUR_UN_GROUPE)
  })

  it("Reglage ne rend aucun élément en plus — une rangée autour ne voit rien changer", () => {
    const src = lire("components/ui/Reglage.tsx")
    expect(src, "un fragment : l'étiquette et le champ, les deux frères d'avant").toContain("<>")
    expect(src).toContain("<label htmlFor={id}")
    expect(src, "l'identifiant vient de React, il ne se devine pas").toContain("const id = useId()")
    expect(src, "le champ le reçoit").toContain("{children(id)}")
  })

  it("un groupe de boutons porte son nom, au lieu d'une étiquette orpheline", () => {
    const src = lire("app/dashboard/builder/builderPanels.tsx")
    expect(src, "le segmenteur accepte un nom").toContain("ariaLabel?: string")
    expect(src, "et l'annonce comme groupe").toContain('<div role="group" aria-label={ariaLabel}')
    // Le nom est écrit UNE fois puis porté par la forme choisie.
    expect(src).toContain("const nom = labelOverride ?? field.label")
    expect(src).toContain("<Segmented ariaLabel={nom}")
  })

  it("le balayage voit bien les étiquettes — sinon il ne prouve rien", () => {
    const tout = etiquettes()
    // 116 : 47 reliées + 69 nommant un groupe. Les 48 reprises ne comptent plus
    // ici — leur <label> vit dans `Reglage`, écrit une fois pour toutes.
    expect(tout.length, "des étiquettes dans le produit").toBeGreaterThan(100)
    expect(tout.filter(e => e.relie).length, "et beaucoup désignent vraiment leur champ").toBeGreaterThan(40)
    let appels = 0
    for (const f of fichiers()) appels += (fs.readFileSync(f, "utf8").match(/<Reglage\b/g) ?? []).length
    expect(appels, "et le composant sert vraiment").toBeGreaterThan(40)
  })
})
