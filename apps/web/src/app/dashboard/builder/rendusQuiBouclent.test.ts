// Un rendu qui écrit ses emplacements un par un n'en aura jamais un de plus — garde de classe.
//
// Le lot v149 a refusé dix blocs pour cette raison, et c'était le bon refus :
// leur rendu ne BOUCLE pas. Il lit ses emplacements écrits un par un —
//
//     const amounts = [c.amount1, c.amount2, c.amount3].filter(Boolean)
//     const cartes  = [1, 2, 3, 4, 5, 6].map(i => …)
//     return [src.line_1, src.line_2, src.line_3, src.line_4]
//
// — et un bouton « Ajouter » y écrirait un `amount4` que rien ne lit. C'est la
// promesse fausse que le lot v148 a fermée.
//
// La classe : **un rendu qui écrit ses emplacements un par un n'en aura jamais
// un de plus.** Ce n'est pas une limite du produit : c'est une limite de la
// façon dont il est écrit, et elle se voit à l'œil nu dans le fichier.
//
// ── Ce que le lot change, et ce qu'il ne change PAS ──────────────────────────
//
// Sept rendus bouclent maintenant, **sur le nombre qu'ils déclaraient déjà** :
//
//     pricing 3   gift_card 3   merch 3   offer_comparison 3
//     event_access 3   journey 4   grid_section 6
//
// Aucune capacité ajoutée, aucune retirée : une page existante rend exactement
// ce qu'elle rendait. Ce qui change est dans l'ÉDITEUR — ces sept blocs entrent
// au répéteur (lot v149) et gagnent monter, descendre, supprimer, et la fin des
// emplacements vides déroulés à plat.
//
// Une exception, écrite : `offer_comparison` lisait « mise en avant » sur
// `plan2_highlight` SEULEMENT, par un `i === 2` posé dans le rendu. La deuxième
// ligne d'un tableau n'a rien de particulier, et le champ existe déjà dans le
// vocabulaire du bloc. Le rendu lit maintenant `plan${i}_highlight`. Aucune page
// ne change : `plan1_highlight` n'était pas déclaré, donc personne n'en a un.
//
// ── Ce qui reste, et pourquoi ────────────────────────────────────────────────
//
// Trois blocs — `service_area`, `sticky_bar`, `tiktok_gallery` — n'ont pas de
// modèle dans le renderer partagé **du tout** : ils vivent encore dans
// `renduLegacy`. Les migrer est un autre travail que lire une répétition, et
// l'architecture du produit le fait par vagues.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { PLAFOND_DES_LIGNES, plafondDesLignes } from "./shared-renderer/models/plafondDesLignes"
import { pricingViewModel } from "./shared-renderer/models/pricing"
import { giftCardViewModel } from "./shared-renderer/models/giftCard"
import { merchViewModel } from "./shared-renderer/models/merch"
import { lignesParcours } from "./shared-renderer/models/presentationEtEncadres"
import { comparaison } from "./shared-renderer/models/produitsEtTarifs"
import { grille } from "./shared-renderer/models/structurePage"
import { acces } from "./shared-renderer/models/evenement"

const RENDU = path.join(__dirname, "shared-renderer")

function fichiers(racine: string): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(racine)
  return out
}

/**
 * Les trois façons d'écrire une série à la main, telles qu'elles étaient dans
 * le produit avant ce lot. Chacune a son exemple, plus bas, dans le
 * contre-test — un détecteur qui ne sait pas dire oui ne dit jamais non.
 */
const SERIE_A_LA_MAIN = [
  // `[c.amount1, c.amount2, …]` ou `[src.line_1, src.line_2, …]`
  /\[\s*\w+\.\w+_?1\s*,\s*\w+\.\w+_?2\s*,/g,
  // `[1, 2, 3].map(` ou `[1, 2, 3, 4, 5, 6].map(`. Le `.map(` compte : une liste
  // de nombres qui ne sert pas à indexer des clés n'est pas une série — l'ordre
  // des jours de la semaine (`[1, 2, 3, 4, 5, 6, 0]`) en est une, et il reste.
  /\[\s*1\s*,\s*2\s*,\s*3[\s,0-9]*\]\s*\.map\(/g,
  // `[[c.img1, …], [c.img2, …]]`
  /\[\s*\[\s*\w+\.\w+1\s*,/g,
]

describe("la forme qu'un rendu ne doit plus avoir", () => {
  it("aucun modèle du renderer partagé n'écrit plus sa série à la main", () => {
    const fautifs: string[] = []
    for (const f of fichiers(RENDU)) {
      const rel = path.relative(RENDU, f).split(path.sep).join("/")
      const src = fs.readFileSync(f, "utf8")
      for (const re of SERIE_A_LA_MAIN) for (const m of src.matchAll(re)) fautifs.push(`${rel} → ${m[0]}`)
    }
    expect(fautifs, "passer par extractIndexed + plafondDesLignes").toEqual([])
  })

  it("le détecteur sait dire oui — sinon il ne dirait jamais non", () => {
    // Un motif global garde sa position d'une recherche à l'autre : on en
    // refait un propre à chaque essai, sinon le test se mentirait à lui-même.
    const voit = (l: string) => SERIE_A_LA_MAIN.some(re => new RegExp(re.source).test(l))
    const avant = [
      "const amounts = [c.amount1, c.amount2, c.amount3].filter(Boolean)",
      "const cartes = [1, 2, 3, 4, 5, 6].map(i => ({",
      "const formules = [1, 2, 3].map(i => ({",
      "const raw: [any, any, any][] = [[c.img1, c.name1, c.price1], [c.img2, c.name2, c.price2]]",
    ]
    for (const l of avant) expect(voit(l), l).toBe(true)
    // …et non à une liste de nombres qui n'indexe rien.
    expect(voit("const ORDRE = [1, 2, 3, 4, 5, 6, 0]"), "l'ordre des jours").toBe(false)
    expect(voit("const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"), "les douze mois").toBe(false)
    // …et non à la forme d'après.
    expect(voit('extractIndexed<string>(c, plafondDesLignes("gift_card"), (src, i) => src[`amount${i}`] || null)')).toBe(false)
  })
})

describe("garde de classe : ce que la page rend n'a pas bougé", () => {
  const troisPlans = { title1: "Essentiel", price1: "49€", desc1: "Par mois", title2: "Pro", price2: "99€", title3: "Business", price3: "199€" }

  it("pricing — mêmes offres, mêmes trous, même ordre", () => {
    expect(pricingViewModel(troisPlans).plans.map(p => p.title)).toEqual(["Essentiel", "Pro", "Business"])
    // Un trou au milieu ne décale rien : la 2 vide, la 3 reste la 3.
    expect(pricingViewModel({ title1: "A", title3: "C" }).plans.map(p => p.title)).toEqual(["A", "C"])
    expect(pricingViewModel({}).plans, "rien à montrer").toEqual([])
    expect(pricingViewModel({ title4: "Au-delà" }).plans, "le plafond tient").toEqual([])
  })

  it("gift_card — trois montants, et pas un quatrième", () => {
    expect(giftCardViewModel({ amount1: "20€", amount2: "", amount3: "50€" }).amounts).toEqual(["20€", "50€"])
    expect(giftCardViewModel({ amount4: "100€" }).amounts).toEqual([])
  })

  it("merch — filtré sur le nom, l'image reste optionnelle", () => {
    const vm = merchViewModel({ name1: "Tee-shirt", price1: "25€", img2: "x.png", name3: "Mug" })
    expect(vm.items.map(i => i.name)).toEqual(["Tee-shirt", "Mug"])
    expect(vm.items[0].price).toBe("25€")
    expect(merchViewModel({ name4: "Trop loin" }).items).toEqual([])
  })

  it("journey — le premier mot reste l'icône, la convention du bloc", () => {
    expect(lignesParcours({ line_1: "🚚 Livraison", line_3: "✅ Fini" }))
      .toEqual([{ icone: "🚚", texte: "Livraison" }, { icone: "✅", texte: "Fini" }])
    expect(lignesParcours({ line_5: "🙅 Au-delà" })).toEqual([])
  })

  it("grid_section — jusqu'à six cartes, le titre décide", () => {
    const g = grille({ c1_title: "Un", c2_text: "sans titre", c6_title: "Six" })!
    expect(g.cartes.map(c => c.titre)).toEqual(["Un", "Six"])
    expect(grille({ c7_title: "Sept" }), "au-delà du plafond, plus rien").toBeNull()
  })

  it("event_access — les transports filtrés sur leur libellé", () => {
    const a = acces({ address: "12 rue X", transport1_label: "Métro 4", transport3_label: "Bus 91" })!
    expect(a.transports.map(t => t.label)).toEqual(["Métro 4", "Bus 91"])
    expect(acces({ address: "12 rue X", transport4_label: "Tram" })!.transports).toEqual([])
  })

  it("offer_comparison — trois formules, et « mise en avant » n'est plus réservée à la deuxième", () => {
    const t = comparaison({ plan1_name: "A", plan2_name: "B", plan3_name: "C", plan2_highlight: "yes" })!
    expect(t.formules.map(f => f.nom)).toEqual(["A", "B", "C"])
    expect(t.formules.map(f => f.vedette), "la deuxième, comme avant").toEqual([false, true, false])
    // Ce que le `i === 2` du rendu interdisait, et que le champ déclarait.
    const u = comparaison({ plan1_name: "A", plan2_name: "B", plan3_name: "C", plan1_highlight: "yes" })!
    expect(u.formules.map(f => f.vedette)).toEqual([true, false, false])
    // Et aucune page existante ne bouge : `plan1_highlight` n'est pas déclaré.
    expect(comparaison({ plan1_name: "A", plan2_name: "B" })!.formules.every(f => !f.vedette)).toBe(true)
  })
})

describe("les sept plafonds sont ceux que les blocs déclaraient déjà", () => {
  it("aucune capacité ajoutée, aucune retirée", () => {
    for (const [t, n] of [["pricing", 3], ["gift_card", 3], ["merch", 3], ["offer_comparison", 3],
      ["event_access", 3], ["journey", 4], ["grid_section", 6]] as const)
      expect(plafondDesLignes(t), t).toBe(n)
  })

  it("…et chacun est appliqué par son rendu", () => {
    const lus = new Set<string>()
    for (const f of fichiers(RENDU))
      for (const m of fs.readFileSync(f, "utf8").matchAll(/plafondDesLignes\("([a-z0-9_]+)"\)/g)) lus.add(m[1])
    for (const t of ["pricing", "gift_card", "merch", "offer_comparison", "event_access", "journey", "grid_section"])
      expect(lus, t).toContain(t)
    // La règle du lot v148 tient toujours : rien d'orphelin dans la table.
    expect(Object.keys(PLAFOND_DES_LIGNES).filter(t => !lus.has(t))).toEqual([])
  })
})
