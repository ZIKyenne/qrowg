// Le panneau ne propose pas une ligne que la page ne rendra pas — garde de classe.
//
// Relevé du 21 septembre, en préparant la suite du lot v144. Le répéteur de
// l'éditeur portait un plafond, et il portait SA RAISON, écrite :
//
//     const MAX = 50 // plafond aligne sur les renderers (Array.from({length:50}))
//                    // -> aucun item cree mais non rendu
//
// « Aucun item créé mais non rendu. » **La promesse était fausse.** Les rendus
// publics n'ont pas tous le même plafond : trente-six endroits posent le leur,
// en clair, chacun dans son fichier — de TROIS (`testimonials`, `columns_text`)
// à cinquante. Deux blocs déjà confiés au répéteur étaient dans ce cas :
//
//   icon_row    le rendu s'arrête à SIX points forts, le panneau en proposait
//               cinquante. C'est le lot v144 qui l'y a confié : le défaut vient
//               de là.
//   menu_tabs   le rendu s'arrête à VINGT sections, même écart.
//
// Un bouton « Ajouter un point fort » qui ajoute un septième point fort que la
// page ne montrera jamais n'est pas une gêne : c'est une promesse fausse, et
// elle est MUETTE — rien ne prévient, la ligne se remplit, et elle disparaît à
// la publication.
//
// La classe : **le panneau s'arrête là où la page s'arrête.**
//
// Et le plafond ferme l'AJOUT, pas la lecture : une page qui porte déjà dix
// points forts les garde tous modifiables, avec un avertissement qui dit ce
// que la page publiée en fera. Masquer ces lignes effacerait du texte que
// quelqu'un a tapé.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { PLAFOND_DES_LIGNES, PLAFOND_PAR_DEFAUT, plafondDesLignes } from "./shared-renderer/models/plafondDesLignes"

const SRC = path.join(__dirname, "../../..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")
const PANNEAUX = "app/dashboard/builder/builderPanels.tsx"
const RENDU = path.join(SRC, "app/dashboard/builder/shared-renderer")

function fichiers(racine: string, motif = /\.tsx?$/): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (motif.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(racine)
  return out
}

/** Un plafond de lignes écrit en clair : `extractIndexed(c, 12, …)`, `i <= 8`. */
const EN_CLAIR = [
  /extractIndexed(?:<[^>]*>)?\([^,]+,\s*\d+\s*,/g,
  /for \(let i = 1; i <= \d+/g,
]
/** …et le même, lu là où il est déclaré. */
const DECLARE = /plafondDesLignes\("([a-z0-9_]+)"\)/g

/** Les types de blocs que le panneau confie au répéteur. */
function viaRepeteur(): string[] {
  const p = lire(PANNEAUX)
  const out = new Set<string>()
  for (const m of p.matchAll(/RepeaterEditor block=/g)) {
    const avant = p.slice(0, m.index!)
    const i = avant.lastIndexOf("if (block.type ===")
    if (i < 0) continue
    for (const t of avant.slice(i, avant.indexOf(")", i) + 1).matchAll(/"([a-z0-9_]+)"/g)) out.add(t[1])
  }
  return [...out].sort()
}

describe("le plafond se lit à un seul endroit", () => {
  it("aucun rendu n'écrit plus le sien en clair", () => {
    const fautifs: string[] = []
    for (const f of fichiers(RENDU)) {
      const rel = path.relative(SRC, f).split(path.sep).join("/")
      const src = fs.readFileSync(f, "utf8")
      for (const re of EN_CLAIR) for (const m of src.matchAll(re))
        fautifs.push(`${rel} → ${m[0].trim()}`)
    }
    expect(fautifs, "passer par plafondDesLignes(\"<type>\")").toEqual([])
  })

  it("…et le répéteur non plus", () => {
    const p = lire(PANNEAUX)
    expect(p, "le plafond vient du bloc").toContain("const MAX = plafondDesLignes(block.type)")
    expect(p, "plus de nombre posé dans le panneau").not.toContain("const MAX = 50")
  })

  it("le balayage voit bien les plafonds — sinon il ne prouve rien", () => {
    let n = 0
    for (const f of fichiers(RENDU)) n += [...fs.readFileSync(f, "utf8").matchAll(DECLARE)].length
    expect(n, "des plafonds déclarés dans les rendus").toBeGreaterThan(30)
    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    expect([...'extractIndexed<Line>(c || {}, 12, (src, i) => {'.matchAll(EN_CLAIR[0])]).toHaveLength(1)
    expect([...'for (let i = 1; i <= 8; i++) {'.matchAll(EN_CLAIR[1])]).toHaveLength(1)
    // …et non à celui qui passe par la déclaration.
    expect([...'extractIndexed<Line>(c || {}, plafondDesLignes("checklist"), (src, i) => {'.matchAll(EN_CLAIR[0])]).toHaveLength(0)
  })
})

describe("garde de classe : le plafond du panneau est celui du rendu", () => {
  it("chaque valeur déclarée est bien celle que son rendu applique", () => {
    // Le tableau RECOPIE le produit : chaque type nommé doit être lu quelque
    // part dans les rendus, sinon la valeur ne vient de nulle part.
    const lus = new Set<string>()
    for (const f of fichiers(RENDU)) for (const m of fs.readFileSync(f, "utf8").matchAll(DECLARE)) lus.add(m[1])
    const orphelins = Object.keys(PLAFOND_DES_LIGNES).filter(t => !lus.has(t))
    expect(orphelins, "un plafond que personne n'applique ne veut rien dire").toEqual([])
  })

  it("les deux blocs du relevé sont au plafond de leur rendu", () => {
    expect(plafondDesLignes("icon_row"), "six points forts — lot v144").toBe(6)
    expect(lire("app/dashboard/builder/shared-renderer/blocks/icon_row/index.tsx"))
      .toContain('plafondDesLignes("icon_row")')
    expect(plafondDesLignes("menu_tabs"), "vingt sections").toBe(20)
    expect(lire("app/dashboard/builder/shared-renderer/models/menuTabs.ts"))
      .toContain('plafondDesLignes("menu_tabs")')
  })

  it("aucun bloc confié au répéteur n'offre plus que son rendu", () => {
    const routes = viaRepeteur()
    expect(routes.length, "des blocs au répéteur").toBeGreaterThan(35)
    // Le plafond du panneau EST `plafondDesLignes(type)` : l'égalité est
    // structurelle. Ce qui se vérifie ici, c'est qu'aucun de ces types n'a
    // perdu sa valeur en route — un type absent du tableau retombe à 50, et
    // c'est faux dès que son rendu s'arrête avant.
    const sousLeDefaut = routes.filter(t => plafondDesLignes(t) < PLAFOND_PAR_DEFAUT)
    expect(sousLeDefaut.sort(), "les deux du relevé, et eux seuls pour l'instant").toEqual(["icon_row", "menu_tabs"])
  })

  it("le défaut vaut cinquante, et il reste le cas général", () => {
    expect(PLAFOND_PAR_DEFAUT).toBe(50)
    expect(plafondDesLignes("un_bloc_qui_n_existe_pas")).toBe(PLAFOND_PAR_DEFAUT)
    expect(Object.keys(PLAFOND_DES_LIGNES).length, "une minorité déclare autre chose").toBeLessThan(30)
    expect(Math.min(...Object.values(PLAFOND_DES_LIGNES)), "le plus bas mesuré : trois").toBe(3)
  })
})

describe("le plafond ferme l'ajout, pas la lecture", () => {
  it("ce qui est déjà écrit au-delà reste visible et modifiable", () => {
    const p = lire(PANNEAUX)
    expect(p, "la détection va jusqu'au défaut, pas jusqu'au plafond du bloc")
      .toContain("for (let i = 1; i <= PLAFOND_PAR_DEFAUT; i++)")
    expect(p, "et la raison est écrite").toContain("les masquer effacerait du")
  })

  it("…et le panneau le DIT, au lieu de laisser disparaître le texte", () => {
    const p = lire(PANNEAUX)
    expect(p).toContain("ne s&apos;affichent pas sur la page publiée")
    expect(p, "un message qui apparaît tout seul se fait annoncer (lot v138)")
      .toMatch(/\{count > MAX && <p \{\.\.\.propsAnnonce\(\)\}/)
    expect(p, "et le plafond atteint se dit aussi").toContain("Ce bloc affiche {MAX} {MAX > 1 ? \"éléments\" : \"élément\"} au maximum.")
  })
})
