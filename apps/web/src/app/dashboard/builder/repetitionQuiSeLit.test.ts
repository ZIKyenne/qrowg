// Une répétition déclarée se lit, elle ne se réécrit pas — garde de classe.
//
// Suite du lot v144. Celui-là avait converti la rangée d'icônes au répéteur et
// laissé un CLIQUET de vingt-sept blocs, au motif écrit : « chacun a ses
// suffixes à lui — `cert_1`, `link_1`, `transport1` — et les convertir en
// aveugle casserait l'édition de vingt-sept types de blocs. »
//
// **En lisant vraiment les clés, ce n'est pas ce qu'elles disent.** Une clé
// répétée s'écrit partout de la même façon, à deux trous près :
//
//     grid_section    c1_title   c1_text      le numéro suit le préfixe du bloc
//     testimonials    name1      text1        le numéro suit le NOM DU CHAMP
//
// `<avant><n>` ou `<avant><n>_<après>`. Une seule forme, pas deux familles. Le
// répéteur n'en parlait qu'une : il lui manquait un trou, pas une capacité.
//
// **Et le nom d'une ligne est déjà écrit**, dans chaque libellé, mot pour mot :
//
//     « Avis 1 — Nom »        la ligne s'appelle « Avis », le champ « Nom »
//     « Carte 3 — Texte »     la ligne « Carte », le champ « Texte »
//     « Ville 2 »             la ligne « Ville », et c'est son seul champ
//
// Le panneau réécrivait à la main (`noun="Plat"`, `fields=[{suffix:"label"}]`)
// ce que la déclaration dit déjà. Ce lot le lit.
//
// ── Trois refus, chacun avec sa raison ───────────────────────────────────────
//
// La dérivation ne force jamais. Treize blocs restent dans la liste générique :
//
//   plafond non mesuré (10)   **trouvé en vérifiant, et c'est le refus qui
//     compte le plus.** Dix rendus lisent leurs emplacements EN DUR —
//     `amount1`, `amount2`, `amount3` — et pas dans une boucle. Leur offrir un
//     bouton « Ajouter » écrirait un `amount4` que rien ne lit : exactement la
//     promesse fausse que le lot v148 vient de fermer. La preuve qu'un rendu a
//     été mesuré, c'est qu'il porte un plafond déclaré.
//   pas de répétition lisible (3)
//     `image_mosaic` — ses libellés disent que les emplacements ne sont PAS
//       interchangeables : « Grande image », « Petite image 1 ». Monter et
//       descendre des lignes y serait faux. Le refus est la bonne réponse.
//     `numbered_list` — ses libellés ne nomment pas la ligne (« 1 — Titre »).
//     `progress_bars` — sa couleur par barre est un `color`, que le répéteur ne
//       rend pas ; le router ferait disparaître un réglage.
//   genre non déclaré (0 aujourd'hui)
//     Le genre d'un nom français n'est écrit ni dans une clé ni dans un
//     libellé. Il se déclare, ou le bloc n'est pas routé.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { BLOCK_DEFS } from "./blockDefs"
import { PLAFOND_DES_LIGNES } from "./shared-renderer/models/plafondDesLignes"
import {
  ARTICLE_DES_LIGNES, EMPLACEMENTS_MIN, TYPES_RENDUS,
  cleRepetee, decouperLaCle, libelleDAjout, lireLeLibelle, repetitionDeclaree,
} from "./repetitionDeclaree"

const lire = (p: string) => fs.readFileSync(path.join(__dirname, p), "utf8")
type Champ = { key: string; label: string; type: string; options?: string[]; placeholder?: string }
const champsDe = (t: string): Champ[] => ((BLOCK_DEFS as Record<string, { fields?: Champ[] }>)[t]?.fields ?? [])

/** Les blocs qui déclarent au moins trois emplacements d'un même préfixe. */
function blocsARepetition(): string[] {
  const out: string[] = []
  for (const t of Object.keys(BLOCK_DEFS)) {
    const par = new Map<string, Set<number>>()
    for (const f of champsDe(t)) {
      const d = decouperLaCle(f.key)
      if (!d) continue
      const s = par.get(d.avant) ?? new Set<number>()
      s.add(d.n); par.set(d.avant, s)
    }
    if ([...par.values()].some(s => s.size >= EMPLACEMENTS_MIN)) out.push(t)
  }
  return out.sort()
}

/** Les blocs qui ont leur propre éditeur écrit à la main dans le panneau. */
function aEditeurDedie(): Set<string> {
  const p = lire("builderPanels.tsx")
  return new Set([...p.matchAll(/block\.type === "([a-z0-9_]+)"/g)].map(m => m[1]))
}

/** Ce que le panneau route par dérivation — exactement sa condition, relue ici. */
function routesParDerivation(): string[] {
  const dedies = aEditeurDedie()
  return blocsARepetition().filter(t => {
    if (dedies.has(t)) return false
    if (!(t in PLAFOND_DES_LIGNES)) return false
    const r = repetitionDeclaree(champsDe(t) as never)
    return !!r && !!libelleDAjout(r.nom)
  })
}

/** Ceux qui tombent encore dans la liste générique de champs, à plat. */
function restants(): string[] {
  const routes = new Set(routesParDerivation())
  const dedies = aEditeurDedie()
  return blocsARepetition().filter(t => !routes.has(t) && !dedies.has(t))
}

describe("comment une clé répétée s'écrit", () => {
  it("les deux formes, et rien d'autre", () => {
    expect(decouperLaCle("c1_title")).toEqual({ avant: "c", n: 1, apres: "title" })
    expect(decouperLaCle("name1")).toEqual({ avant: "name", n: 1, apres: "" })
    expect(decouperLaCle("old_price3")).toEqual({ avant: "old_price", n: 3, apres: "" })
    expect(decouperLaCle("line_2")).toEqual({ avant: "line_", n: 2, apres: "" })
    expect(decouperLaCle("title"), "une clé sans numéro ne se répète pas").toBeNull()
  })

  it("…et elles se reconstituent à l'identique : la clé plate ne bouge pas", () => {
    for (const k of ["c1_title", "name1", "q8_link_label", "transport2_icon", "line_4"]) {
      const d = decouperLaCle(k)!
      expect(cleRepetee(d, d.n), k).toBe(k)
    }
  })
})

describe("ce qu'un libellé déclare", () => {
  it("le nom de la ligne, et celui du champ", () => {
    expect(lireLeLibelle("Avis 1 — Nom", 1)).toEqual({ ligne: "Avis", champ: "Nom" })
    expect(lireLeLibelle("Carte 3 — Texte", 3)).toEqual({ ligne: "Carte", champ: "Texte" })
    expect(lireLeLibelle("Ville 2", 2), "un seul champ : il porte le nom de la ligne").toEqual({ ligne: "Ville", champ: "Ville" })
  })

  it("une parenthèse appartient au champ, pas à la ligne", () => {
    expect(lireLeLibelle("Nom 1 (si pas de logo)", 1)).toEqual({ ligne: "Nom", champ: "Nom (si pas de logo)" })
  })

  it("…et un libellé qui ne nomme pas la ligne ne déclare rien", () => {
    expect(lireLeLibelle("1 — Titre", 1)!.ligne, "numbered_list").toBe("")
    expect(lireLeLibelle("Alignement", 1), "aucun numéro").toBeNull()
  })
})

describe("garde de classe : la dérivation rend exactement ce qui est déclaré", () => {
  it("aucune clé déclarée n'est perdue, et aucune n'est rendue deux fois", () => {
    const fautifs: string[] = []
    for (const t of routesParDerivation()) {
      const r = repetitionDeclaree(champsDe(t) as never)!
      const auRepeteur = new Set(champsDe(t).map(f => f.key).filter(k => {
        const d = decouperLaCle(k)
        return !!d && r.champs.some(c => c.avant === d.avant && c.apres === d.apres)
      }))
      const fixes = new Set(r.fixes.map(f => f.key))
      for (const f of champsDe(t)) {
        const au = auRepeteur.has(f.key), fi = fixes.has(f.key)
        if (!au && !fi) fautifs.push(`${t}.${f.key} — perdu`)
        if (au && fi) fautifs.push(`${t}.${f.key} — rendu deux fois`)
      }
    }
    expect(fautifs).toEqual([])
  })

  it("chaque champ répété a un type que le répéteur sait rendre", () => {
    for (const t of routesParDerivation())
      for (const c of repetitionDeclaree(champsDe(t) as never)!.champs)
        expect(TYPES_RENDUS as readonly string[], `${t} — ${c.nom}`).toContain(c.type)
  })

  it("chaque ligne porte un nom, et ce nom vient du produit", () => {
    for (const t of routesParDerivation()) {
      const r = repetitionDeclaree(champsDe(t) as never)!
      expect(r.nom.length, t).toBeGreaterThan(1)
      expect(champsDe(t).some(f => f.label.startsWith(r.nom)), `${t} : « ${r.nom} » doit être écrit dans un libellé`).toBe(true)
    }
  })

  it("le panneau applique la même condition que ce test", () => {
    const p = lire("builderPanels.tsx")
    expect(p).toContain('const repetition = (!only || only === "content") && block.type in PLAFOND_DES_LIGNES ? repetitionDeclaree(def.fields) : null')
    expect(p, "les clés répétées quittent la liste générique")
      .toContain("const scoped = def.fields.filter(f => !clesRepetees.has(f.key))")
    expect(p, "et un champ nommé le reste (lot v123)").toContain("const n = f.nom")
  })
})

describe("le cliquet, et les trois refus", () => {
  it("le cliquet descend : de vingt-sept à treize", () => {
    const r = restants()
    expect(r.length, `restants : ${r.join(", ")}`).toBeLessThanOrEqual(13)
    expect(routesParDerivation().length, "et quatorze blocs y entrent d'un coup").toBeGreaterThanOrEqual(14)
  })

  it("dix restent parce que leur rendu lit ses emplacements EN DUR", () => {
    const sansPlafond = restants().filter(t => !(t in PLAFOND_DES_LIGNES))
    expect(sansPlafond.length).toBeGreaterThanOrEqual(10)
    // `gift_card` est le cas d'école : trois montants écrits un par un.
    expect(sansPlafond, "gift_card").toContain("gift_card")
    expect(lire("shared-renderer/models/giftCard.ts")).toContain("amount1")
    expect(lire("shared-renderer/models/giftCard.ts"), "aucune boucle : rien à répéter").not.toContain("${i}")
  })

  it("trois restent parce que leur déclaration ne dit pas assez", () => {
    for (const t of ["image_mosaic", "numbered_list", "progress_bars"]) {
      expect(restants(), t).toContain(t)
      expect(repetitionDeclaree(champsDe(t) as never), t).toBeNull()
    }
    // …et chacun pour sa raison, vérifiée dans le produit :
    expect(champsDe("image_mosaic").map(f => f.label), "des emplacements qui ne sont pas interchangeables")
      .toContain("Grande image")
    expect(champsDe("numbered_list").some(f => f.label === "1 — Titre"), "pas de nom de ligne").toBe(true)
    expect(champsDe("progress_bars").some(f => f.key === "b1_color" && f.type === "color"), "un type non rendu").toBe(true)
  })

  it("le genre se déclare : un nom absent de la table n'est pas routé", () => {
    expect(libelleDAjout("Carte")).toBe("Ajouter une carte")
    expect(libelleDAjout("Produit")).toBe("Ajouter un produit")
    expect(libelleDAjout("TikTok"), "un nom propre garde sa casse").toBe("Ajouter un TikTok")
    expect(libelleDAjout("Machin"), "non déclaré : pas de libellé, donc pas de routage").toBeNull()
    // La table ne porte rien d'inutile : chaque nom sert à un bloc réellement
    // repéré par la dérivation.
    const nomsVus = new Set(blocsARepetition()
      .map(t => repetitionDeclaree(champsDe(t) as never)?.nom)
      .filter(Boolean) as string[])
    const inutiles = Object.keys(ARTICLE_DES_LIGNES).filter(n => !nomsVus.has(n))
    expect(inutiles, "un article que personne ne demande").toEqual([])
  })
})

describe("le balayage voit bien les répétitions — sinon il ne prouve rien", () => {
  it("des blocs, des répétitions, et une majorité déjà rangée", () => {
    expect(Object.keys(BLOCK_DEFS).length, "des blocs au catalogue").toBeGreaterThan(150)
    expect(blocsARepetition().length, "dont beaucoup à emplacements répétés").toBeGreaterThan(50)
    expect(aEditeurDedie().size, "et beaucoup ont déjà leur éditeur").toBeGreaterThan(30)
  })

  it("le détecteur sait dire oui, et non", () => {
    expect(repetitionDeclaree(champsDe("testimonials") as never)!.nom, "le numéro après le nom du champ").toBe("Avis")
    expect(repetitionDeclaree(champsDe("grid_section") as never)!.nom, "le numéro après le préfixe").toBe("Carte")
    expect(repetitionDeclaree(champsDe("text_block") as never), "un bloc sans répétition").toBeNull()
  })

  it("…et le répéteur parle bien les deux formes", () => {
    const p = lire("builderPanels.tsx")
    expect(p).toContain("const a = f.avant ?? prefix; return f.suffix ? `${a}${i}_${f.suffix}` : `${a}${i}`")
    expect(p, "deux champs peuvent partager un suffixe vide").toContain("const idc = (f: ChampDuRepeteur) =>")
  })
})
