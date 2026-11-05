import { describe, it, expect } from "vitest"
import { lireListe, bilanDe, MAX_LIGNES } from "./importProspects"
import { cellulesDuCollage, corpsEtEntete, colonnesParNom, separateurProbable } from "@/lib/tableauColle"

const ENTETE = "Nom\tCode NAF\tÉtat\tCommune\tSIREN"
const colle = (...lignes: string[]) => [ENTETE, ...lignes].join("\n")

describe("le tableau collé se lit d'où qu'il vienne", () => {
  it("tabulation, point-virgule, virgule, markdown", () => {
    const attendu = [["Nom", "Ville"], ["Chez Mariette", "Reims"]]
    expect(cellulesDuCollage("Nom\tVille\nChez Mariette\tReims")).toEqual(attendu)
    expect(cellulesDuCollage("Nom;Ville\nChez Mariette;Reims")).toEqual(attendu)
    expect(cellulesDuCollage("Nom,Ville\nChez Mariette,Reims")).toEqual(attendu)
    expect(cellulesDuCollage("| Nom | Ville |\n| --- | --- |\n| Chez Mariette | Reims |")).toEqual(attendu)
  })

  it("le point-virgule passe AVANT la virgule, à cause des montants français", () => {
    // « 12,50 » ferait voir une colonne de plus à chaque ligne. L'ordre de
    // détection n'est pas cosmétique : il décide du découpage.
    expect(separateurProbable(["Nom;Prix", "Plat;12,50"])).toBe(";")
  })

  it("une tabulation en tête ne décale pas les colonnes", () => {
    // Rogner la ligne entière avant de découper ferait glisser tout d'un cran.
    expect(cellulesDuCollage("\tNom\tVille")).toEqual([["", "Nom", "Ville"]])
  })

  it("les lignes vides et les fins de ligne Windows ne comptent pas", () => {
    expect(cellulesDuCollage("Nom\tVille\r\n\r\nChez Mariette\tReims\r\n")).toHaveLength(2)
  })

  it("un en-tête seul reste une donnée : il n'y a rien derrière", () => {
    const { entete, corps } = corpsEtEntete("Nom\tVille")
    expect(entete).toBeNull()
    expect(corps).toHaveLength(1)
  })
})

describe("les colonnes se reconnaissent par leur nom", () => {
  it("accents, casse et ponctuation n'empêchent rien", () => {
    const c = colonnesParNom(["Raison sociale", "CODE NAF", "état"], {
      nom: ["nom", "raison sociale"], codeActivite: ["code naf"], etat: ["etat"],
    })
    expect(c).toEqual({ nom: 0, codeActivite: 1, etat: 2 })
  })

  it("l'ordre des colonnes n'a aucune importance", () => {
    const c = colonnesParNom(["Ville", "Nom"], { nom: ["nom"], commune: ["ville"] })
    expect(c.nom).toBe(1)
    expect(c.commune).toBe(0)
  })

  it("une colonne déjà prise n'est pas réattribuée", () => {
    // Deux colonnes « Nom » : en perdre une silencieusement masquerait une
    // partie du tableau.
    const c = colonnesParNom(["Nom", "Nom"], { nom: ["nom"], autre: ["nom"] })
    expect(c.nom).toBe(0)
    expect(c.autre).toBe(1)
  })
})

describe("l'import refuse plutôt que de deviner", () => {
  it("un collage vide ne rend pas une liste vide sans rien dire", () => {
    expect(lireListe("").raison).toBe("vide")
    expect(lireListe("   \n  \n").raison).toBe("vide")
  })

  it("sans en-tête, il REFUSE — et c'est le point du module", () => {
    // Pour une carte, l'ordre des colonnes est conventionnel. Pour une liste
    // d'entreprises, non : une colonne mal attribuée produit un résultat faux
    // sans rien signaler — des établissements jugés sur le mauvais champ.
    const l = lireListe("Chez Mariette\t5610A\tA\tReims")
    expect(l.raison).toBe("sans en-tête")
    expect(l.lignes).toEqual([])
  })

  it("un en-tête sans colonne de nom est refusé aussi", () => {
    const l = lireListe("Ville\tCode NAF\nReims\t5610A")
    expect(l.raison).toBe("colonnes inconnues")
  })

  it("une entrée absurde ne fait pas tomber le module", () => {
    for (const x of [null, undefined, 42, {}, []])
      expect(() => lireListe(x as unknown as string)).not.toThrow()
  })
})

describe("ce qui est retenu, et ce qui ne l'est pas", () => {
  const lecture = lireListe(colle(
    "Chez Mariette\t56.10A\tA\tChâlons-en-Champagne\t111111111",
    "Le Comptoir Express\t5610C\tActif\tReims\t222222222",
    "Ancien Café\t5630Z\tC\tReims\t333333333",
    "Agence Dupont\t6201Z\tA\tReims\t444444444",
  ))

  it("les colonnes nommées sont trouvées", () => {
    expect(lecture.raison).toBeNull()
    expect(lecture.colonnes.nom).toBe(0)
    expect(lecture.colonnes.codeActivite).toBe(1)
    expect(lecture.colonnes.siren).toBe(4)
  })

  it("deux restaurants actifs passent, le fermé et l'agence non", () => {
    const b = bilanDe(lecture)
    expect(b.retenus.map(l => l.fiche.nom)).toEqual(["Chez Mariette", "Le Comptoir Express"])
    expect(b.ecartes.map(l => l.fiche.nom)).toEqual(["Ancien Café", "Agence Dupont"])
  })

  it("chaque ligne porte son numéro, en-tête compris", () => {
    // Sans numéro, « quatre lignes écartées » est inexploitable : on ne sait
    // pas lesquelles corriger dans le tableau d'origine.
    expect(lecture.lignes[0].numero).toBe(2)
    expect(lecture.lignes[3].numero).toBe(5)
  })

  it("le bilan dit ce qui a écarté le plus de monde", () => {
    // C'est LA question devant un import raté. Une liste entière refusée pour
    // « état administratif inconnu » signifie que la colonne manque, pas que
    // les établissements sont fermés.
    const sansEtat = lireListe([
      "Nom\tCode NAF\tCommune",
      "A\t5610A\tReims", "B\t5610A\tReims", "C\t6201Z\tReims",
    ].join("\n"))
    const b = bilanDe(sansEtat)
    expect(b.retenus).toEqual([])
    expect(b.parRaison[0]).toEqual({ raison: "état administratif inconnu", nombre: 3 })
  })

  it("à nombre égal, l'ordre est stable d'un passage à l'autre", () => {
    // Un compte rendu dont l'ordre change tout seul n'est pas comparable à
    // celui de la veille.
    const b = bilanDe(lireListe(colle("A\t6201Z\tC\tReims\t1")))
    expect(b.parRaison.map(r => r.raison)).toEqual(
      [...b.parRaison.map(r => r.raison)].sort((x, y) => x.localeCompare(y, "fr")))
  })

  it("un entrepreneur individuel nommé dans la ligne est reconnu", () => {
    const l = lireListe([
      "Nom\tCode NAF\tÉtat\tForme",
      "Chez Paul\t5610A\tA\tEntrepreneur individuel",
    ].join("\n"))
    expect(l.lignes[0].fiche.entrepreneurIndividuel).toBe(true)
    expect(l.lignes[0].verdict.refus.join(" ")).toContain("donnée personnelle")
  })

  it("…et son absence ne vaut PAS « c'est une société »", () => {
    expect(lireListe(colle("Chez Mariette\t5610A\tA\tReims\t1"))
      .lignes[0].fiche.entrepreneurIndividuel).toBeUndefined()
  })
})

describe("les doublons et le plafond", () => {
  it("un SIREN répété est signalé sans être supprimé", () => {
    // Signaler, pas trancher : c'est à l'humain de dire laquelle des deux
    // lignes garder.
    const b = bilanDe(lireListe(colle(
      "Chez Mariette\t5610A\tA\tReims\t111111111",
      "Chez Mariette (bis)\t5610A\tA\tReims\t111111111",
    )))
    expect(b.retenus).toHaveLength(2)
    expect(b.doublons.map(l => l.fiche.nom)).toEqual(["Chez Mariette (bis)"])
  })

  it("deux établissements d'une même enseigne ne sont PAS des doublons", () => {
    // Même nom, SIREN différents : deux adresses réelles. Les fusionner en
    // perdrait une.
    const b = bilanDe(lireListe(colle(
      "Pizza Nova\t5610C\tA\tReims\t111111111",
      "Pizza Nova\t5610C\tA\tÉpernay\t222222222",
    )))
    expect(b.doublons).toEqual([])
  })

  it("au-delà du plafond, le reste n'est pas lu — et c'est DIT", () => {
    const lignes = Array.from({ length: MAX_LIGNES + 10 },
      (_, i) => `Resto ${i}\t5610A\tA\tReims\t${100000000 + i}`)
    const l = lireListe(colle(...lignes))
    expect(l.lignes).toHaveLength(MAX_LIGNES)
    expect(l.tronque, "une troncature silencieuse ferait croire la liste traitée").toBe(true)
  })

  it("en deçà du plafond, rien n'est tronqué", () => {
    expect(lireListe(colle("A\t5610A\tA\tReims\t1")).tronque).toBe(false)
  })
})
