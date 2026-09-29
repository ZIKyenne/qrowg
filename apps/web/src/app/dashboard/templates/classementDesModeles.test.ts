import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PAGE_TEMPLATES } from "../builder/page-templates"
import { SECTEURS, SECTEUR_PAR_MODELE } from "../../creer/entry"
import {
  IDS_SECTEURS, SECTEURS_GALERIE, SECTEURS_FILTRABLES,
  secteursDuModele, appartientAuSecteur, compteParSecteur,
  correspondALaRecherche, gisementDeRecherche, nomsEnDouble, estHomonyme,
  type ModeleClassable,
} from "./classementDesModeles"

// Le catalogue tel que la galerie le voit : les 34 modèles partagés (par leur
// clé, qui EST leur identifiant dans la galerie) + les 14 modèles historiques.
const ambiance = (desc: string) => (desc.includes(" — ") ? desc.split(" — ").slice(1).join(" — ") : undefined)
const PARTAGES: ModeleClassable[] = PAGE_TEMPLATES.map(t => ({
  id: t.key,
  name: t.label,
  category: t.group,
  description: t.desc.split(" — ")[0],
  // À défaut de suffixe d'ambiance dans la description, le nom du thème fait
  // la variante — c'est ce que compose la galerie (SHARED_META).
  variante: ambiance(t.desc) ?? t.theme.name,
}))

const src = readFileSync(join(__dirname, "page.tsx"), "utf8")

/** Les 14 modèles historiques, relus dans la galerie (id + nom + catégorie). */
const HISTORIQUES: ModeleClassable[] = [...src.matchAll(
  /\{ id: "([a-z_]+)", name: "([^"]+)", variante: "([^"]+)", category: "([^"]+)"/g,
)].map(m => ({ id: m[1], name: m[2], variante: m[3], category: m[4] }))

const CATALOGUE = [...HISTORIQUES, ...PARTAGES]

const nom = (id: string) => CATALOGUE.find(t => t.id === id)?.name ?? `?${id}`
const idsDuSecteur = (s: string) => CATALOGUE.filter(t => appartientAuSecteur(t, s)).map(t => t.id)

describe("le catalogue relu est complet", () => {
  it("les 14 modèles historiques et les modèles partagés sont tous là", () => {
    expect(HISTORIQUES).toHaveLength(14)
    expect(PARTAGES.length).toBeGreaterThanOrEqual(34)
  })
  it("aucun identifiant en double : un modèle, une carte, un favori", () => {
    const ids = CATALOGUE.map(t => t.id)
    expect(ids.length).toBe(new Set(ids).size)
  })
})

describe("les secteurs de la galerie sont ceux que ?metier=… accepte", () => {
  it("même liste, même ordre", () => {
    expect(IDS_SECTEURS).toEqual([...SECTEURS])
  })
  it("chaque secteur a un libellé et une couleur", () => {
    for (const s of SECTEURS_GALERIE) {
      expect(s.label, s.id).toBeTruthy()
      expect(s.color, s.id).toBeTruthy()
    }
  })
})

describe("les modèles constatés manquants sont revenus (audit visiteur du 29 septembre)", () => {
  it("« Restaurant » contient « Bistrot français »", () => {
    expect(idsDuSecteur("Restaurant")).toContain("resto_bistrot")
    expect(nom("resto_bistrot")).toBe("Bistrot français")
  })
  it("« Bar » contient « Bar à cocktails » ET « Bar de nuit »", () => {
    const bar = idsDuSecteur("Bar")
    expect(bar).toContain("resto_bar")
    expect(bar).toContain("studio_bar_nuit")
    expect(nom("resto_bar")).toBe("Bar à cocktails")
    expect(nom("studio_bar_nuit")).toBe("Bar de nuit")
  })
  it("« Café » contient « Coffee shop »", () => {
    expect(idsDuSecteur("Cafe")).toContain("studio_coffee")
    expect(nom("studio_coffee")).toBe("Coffee shop")
  })
  it("« Restaurant » remonte toute la famille Restauration, pas le seul modèle historique", () => {
    const attendus = PARTAGES.filter(t => t.category === "Restauration").map(t => t.id)
    const remontes = idsDuSecteur("Restaurant").concat(idsDuSecteur("Bar"), idsDuSecteur("Cafe"))
    for (const id of attendus) expect(remontes, id).toContain(id)
  })
})

describe("aucune famille de modèles n'est hors d'atteinte", () => {
  it("chaque modèle du catalogue appartient à au moins un secteur", () => {
    const orphelins = CATALOGUE.filter(t => secteursDuModele(t).length === 0).map(t => t.id)
    expect(orphelins, "modèles qu'aucun filtre ne peut afficher").toEqual([])
  })
  it("chaque famille du catalogue partagé a un rayon", () => {
    const familles = [...new Set(PARTAGES.map(t => t.category!))]
    for (const f of familles) {
      const dedans = PARTAGES.filter(t => t.category === f)
      const couverte = dedans.every(t => secteursDuModele(t).length > 0)
      expect(couverte, `famille « ${f} » sans rayon`).toBe(true)
    }
  })
  it("un modèle inconnu classé dans une famille connue tombe quand même dans un rayon", () => {
    // Garde-fou : un modèle ajouté demain sans être nommé dans les tables.
    expect(secteursDuModele({ id: "resto_futur", category: "Restauration" })).toContain("Restaurant")
    expect(secteursDuModele({ id: "asso_futur", category: "Association" })).toContain("Association")
  })
  it("les trois nouveaux rayons ne sont pas vides", () => {
    for (const s of ["Artisan", "Association", "Sport"]) {
      expect(idsDuSecteur(s).length, `rayon ${s} vide`).toBeGreaterThan(0)
    }
  })
  it("aucun rayon affiché n'est vide : chaque secteur filtrable a au moins un modèle", () => {
    const vides = SECTEURS_FILTRABLES.filter(s => idsDuSecteur(s).length === 0)
    expect(vides).toEqual([])
  })
})

describe("le secteur principal reste celui des liens publics", () => {
  it("« Utiliser » depuis un exemple mène au rayon qui contient ce modèle", () => {
    const faux: string[] = []
    for (const t of PARTAGES) {
      const principal = SECTEUR_PAR_MODELE[t.id]
      if (!principal) continue
      if (secteursDuModele(t)[0] !== principal) faux.push(`${t.id} → ${secteursDuModele(t)[0]} ≠ ${principal}`)
      if (!appartientAuSecteur(t, principal)) faux.push(`${t.id} absent de ${principal}`)
    }
    expect(faux).toEqual([])
  })
})

describe("compteurs et filtre disent la même chose", () => {
  const counts = compteParSecteur(CATALOGUE)
  it("« Tous » compte tout le catalogue", () => {
    expect(counts.Tous).toBe(CATALOGUE.length)
  })
  it("chaque compteur vaut exactement le nombre de cartes affichées", () => {
    const ecarts: string[] = []
    for (const s of SECTEURS_FILTRABLES) {
      const affichees = idsDuSecteur(s).length
      if (counts[s] !== affichees) ecarts.push(`${s}: compteur ${counts[s]} ≠ ${affichees} cartes`)
    }
    expect(ecarts).toEqual([])
  })
})

describe("recherche : accents, casse et synonymes", () => {
  const trouve = (q: string) => CATALOGUE.filter(t => correspondALaRecherche(t, q)).map(t => t.id)

  it("« cafe » et « café » trouvent Coffee shop", () => {
    expect(trouve("cafe")).toContain("studio_coffee")
    expect(trouve("café")).toContain("studio_coffee")
    expect(trouve("CAFÉ")).toContain("studio_coffee")
  })
  it("« coffee » trouve Coffee shop par son nom", () => {
    expect(trouve("coffee")).toContain("studio_coffee")
  })
  it("« bar » trouve les deux bars", () => {
    const r = trouve("bar")
    expect(r).toContain("resto_bar")
    expect(r).toContain("studio_bar_nuit")
  })
  it("« cocktail » trouve le bar à cocktails", () => {
    expect(trouve("cocktail")).toContain("resto_bar")
  })
  it("« resto » trouve les restaurants même sans le mot complet", () => {
    expect(trouve("resto")).toContain("resto_bistrot")
  })
  it("« bistrot » trouve le bistrot", () => {
    expect(trouve("bistrot")).toContain("resto_bistrot")
  })
  it("« coiffeur » trouve les salons, écrits « coiffure »", () => {
    const r = trouve("coiffeur")
    expect(r).toContain("beaute_coiffure")
    expect(r).toContain("studio_coiffure")
  })
  it("« plombier » trouve les artisans", () => {
    expect(trouve("plombier")).toContain("artisan_batiment")
  })
  it("« don » trouve l'association", () => {
    expect(trouve("don")).toContain("asso_ong")
  })
  it("l'ordre des mots ne compte pas", () => {
    expect(trouve("shop coffee")).toContain("studio_coffee")
  })
  it("une recherche vide ne filtre rien", () => {
    expect(trouve("")).toHaveLength(CATALOGUE.length)
    expect(trouve("   ")).toHaveLength(CATALOGUE.length)
  })
  it("une recherche sans rapport ne rend rien plutôt que tout", () => {
    expect(trouve("zzzzqwxyz")).toEqual([])
  })
  it("le gisement ne contient jamais de valeur vide parasite", () => {
    for (const t of CATALOGUE) {
      expect(gisementDeRecherche(t).some(x => typeof x !== "string"), t.id).toBe(false)
    }
  })
})

describe("les homonymes se distinguent", () => {
  const doubles = nomsEnDouble(CATALOGUE)
  it("les deux « Salon de coiffure » sont repérés comme homonymes", () => {
    const deux = CATALOGUE.filter(t => t.name === "Salon de coiffure")
    expect(deux.map(t => t.id).sort()).toEqual(["beaute_coiffure", "studio_coiffure"])
    for (const t of deux) expect(estHomonyme(t, doubles), t.id).toBe(true)
  })
  it("un nom unique n'est pas marqué", () => {
    const seul = CATALOGUE.find(t => t.id === "resto_bistrot")!
    expect(estHomonyme(seul, doubles)).toBe(false)
  })
  it("chaque homonyme porte une variante pour les séparer", () => {
    const sans = CATALOGUE.filter(t => estHomonyme(t, doubles) && !(t.variante || "").trim()).map(t => t.id)
    expect(sans, "homonymes sans variante affichable").toEqual([])
  })
})
