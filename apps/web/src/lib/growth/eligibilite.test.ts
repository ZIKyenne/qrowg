import { describe, it, expect } from "vitest"
import {
  jugerEligibilite, genreDepuisActivite,
  ACTIVITES_ELIGIBLES, ACCEPTE_ENTREPRENEUR_INDIVIDUEL,
} from "./eligibilite"
import {
  depuisAnnuairePublic, codeNafNormalise, estEnActivite, profilDepuisFiche,
  type FicheEntreprise,
} from "./ficheEntreprise"
import { affichable, champsAffichables, assezRichePourUnePage } from "./profilEtablissement"

const BISTROT: FicheEntreprise = {
  siren: "000000000",
  nom: "LES TROIS MARCHES",
  codeActivite: "56.10A",
  etat: "A",
  adresse: "12 rue de Marne",
  codePostal: "51000",
  commune: "Châlons-en-Champagne",
  entrepreneurIndividuel: false,
}

describe("le code d'activité se lit quelle que soit son écriture", () => {
  it("point, espace, minuscules : c'est le même code", () => {
    for (const ecriture of ["56.10A", "5610a", " 56 10 A ", "5610A"])
      expect(codeNafNormalise(ecriture)).toBe("5610A")
  })

  it("un code absent ne devient pas une chaîne trompeuse", () => {
    expect(codeNafNormalise(undefined)).toBe("")
    expect(codeNafNormalise("")).toBe("")
  })
})

describe("l'état administratif", () => {
  it("se lit en lettre comme en toutes lettres", () => {
    expect(estEnActivite({ etat: "A" })).toBe(true)
    expect(estEnActivite({ etat: "Actif" })).toBe(true)
    expect(estEnActivite({ etat: "C" })).toBe(false)
    expect(estEnActivite({ etat: "Cessée" })).toBe(false)
  })

  it("inconnu n'est PAS actif — et c'est tout l'enjeu", () => {
    // Fabriquer une page au nom d'un établissement fermé, puis la lui proposer,
    // est une erreur qu'aucun correctif ne rattrape. « Je ne sais pas » doit
    // donc se comporter comme « non », pas comme « oui ».
    expect(estEnActivite({})).toBeUndefined()
    expect(estEnActivite({ etat: "  " })).toBeUndefined()
    expect(estEnActivite({ etat: "bizarre" })).toBeUndefined()
    expect(jugerEligibilite({ ...BISTROT, etat: undefined }).eligible).toBe(false)
  })
})

describe("qui reçoit une proposition", () => {
  it("un restaurant actif, nommé, dans le périmètre", () => {
    const v = jugerEligibilite(BISTROT)
    expect(v.eligible).toBe(true)
    expect(v.refus).toEqual([])
    expect(v.activite).toBe("restauration traditionnelle")
  })

  it("un établissement cessé, jamais", () => {
    const v = jugerEligibilite({ ...BISTROT, etat: "C" })
    expect(v.eligible).toBe(false)
    expect(v.refus).toContain("établissement cessé")
  })

  it("une activité hors périmètre est refusée en la NOMMANT", () => {
    // Un refus muet est inexploitable : on ne saurait pas si la règle est trop
    // étroite ou si la fiche est mauvaise.
    const v = jugerEligibilite({ ...BISTROT, codeActivite: "6201Z" })
    expect(v.eligible).toBe(false)
    expect(v.refus.join(" ")).toContain("6201Z")
    expect(v.activite).toBeNull()
  })

  it("la restauration collective sous contrat est hors périmètre, et c'est voulu", () => {
    // 5629A sert des salariés sur un site fermé : aucun passant à qui montrer
    // un QR code. C'est la raison pour laquelle la liste est explicite au lieu
    // d'accepter « tout le 56 ».
    expect(ACTIVITES_ELIGIBLES["5629A"]).toBeUndefined()
    expect(jugerEligibilite({ ...BISTROT, codeActivite: "5629A" }).eligible).toBe(false)
  })

  it("toutes les raisons sont dites, pas seulement la première", () => {
    const v = jugerEligibilite({ etat: "C", codeActivite: "6201Z" })
    expect(v.refus).toHaveLength(3)
    expect(v.refus).toContain("établissement cessé")
    expect(v.refus).toContain("sans dénomination")
  })

  it("un entrepreneur individuel est écarté tant que la base légale n'est pas arrêtée", () => {
    // Sa dénomination EST le nom d'une personne : la fiche devient une donnée
    // personnelle. On ne constitue pas ce fichier avant la décision.
    expect(ACCEPTE_ENTREPRENEUR_INDIVIDUEL, "bascule réservée au propriétaire").toBe(false)
    const v = jugerEligibilite({ ...BISTROT, entrepreneurIndividuel: true })
    expect(v.eligible).toBe(false)
    expect(v.refus.join(" ")).toContain("donnée personnelle")
  })

  it("…mais l'inconnu n'est pas traité comme un entrepreneur individuel", () => {
    // Refuser sur une absence d'information écarterait tout annuaire qui ne
    // publie pas ce drapeau. On refuse ce qu'on SAIT être une personne.
    const v = jugerEligibilite({ ...BISTROT, entrepreneurIndividuel: undefined })
    expect(v.eligible).toBe(true)
  })
})

describe("le genre déduit de l'activité", () => {
  it("les trois codes qui tranchent", () => {
    expect(genreDepuisActivite({ codeActivite: "5610A" })).toBe("bistrot")
    expect(genreDepuisActivite({ codeActivite: "5610C" })).toBe("rapide")
    expect(genreDepuisActivite({ codeActivite: "5630Z" })).toBe("bar")
  })

  it("et ceux qui ne tranchent pas ne sont pas devinés", () => {
    // Un traiteur n'est ni un bistrot ni un bar. Choisir quand même reviendrait
    // à poser une affirmation sur l'établissement à partir d'un code comptable.
    for (const code of ["5610B", "5621Z", "5629B", "", "6201Z"])
      expect(genreDepuisActivite({ codeActivite: code }), code).toBeNull()
  })
})

describe("la traduction d'une réponse d'annuaire", () => {
  it("accepte les deux orthographes concurrentes", () => {
    // Les noms de champs réels n'ont pas été constatés : l'adaptateur lit les
    // deux plutôt que de parier sur l'une. Voir l'avertissement en tête de
    // `ficheEntreprise.ts`.
    const a = depuisAnnuairePublic({
      nom_complet: "LES TROIS MARCHES", activite_principale: "56.10A",
      etat_administratif: "A", siege: { libelle_commune: "Reims", code_postal: "51100" },
    })
    const b = depuisAnnuairePublic({
      nom_raison_sociale: "LES TROIS MARCHES", activite_principale_naf: "56.10A",
      siege: { etat_administratif: "A", commune: "Reims", code_postal: "51100" },
    })
    expect(a.nom).toBe(b.nom)
    expect(a.codeActivite).toBe(b.codeActivite)
    expect(a.commune).toBe(b.commune)
    expect(a.etat).toBe(b.etat)
  })

  it("ne rend jamais une chaîne vide déguisée en valeur", () => {
    const f = depuisAnnuairePublic({ nom_complet: "   ", siege: { code_postal: "" } })
    expect(f.nom).toBeUndefined()
    expect(f.codePostal).toBeUndefined()
  })

  it("une réponse absurde ne fait pas tomber le module", () => {
    for (const absurde of [null, undefined, 42, "texte", [], { siege: "pas un objet" }])
      expect(() => depuisAnnuairePublic(absurde)).not.toThrow()
    expect(depuisAnnuairePublic(null)).toEqual({})
  })

  it("lit le drapeau d'entrepreneur individuel sans l'inventer", () => {
    expect(depuisAnnuairePublic({ complements: { est_entrepreneur_individuel: true } })
      .entrepreneurIndividuel).toBe(true)
    // Absent : `undefined`, surtout pas `false` — qui signifierait « on a
    // vérifié, c'est une société ».
    expect(depuisAnnuairePublic({ complements: {} }).entrepreneurIndividuel).toBeUndefined()
    expect(depuisAnnuairePublic({}).entrepreneurIndividuel).toBeUndefined()
  })
})

describe("le profil tiré d'une fiche d'annuaire", () => {
  const profil = profilDepuisFiche(BISTROT, "p1", "2026-11-05")

  it("le nom reste PROBABLE : une raison sociale n'est pas une enseigne", () => {
    // « SARL LES TROIS MARCHES » est exact, et ce n'est pas ce qui est écrit
    // sur la devanture.
    expect(profil.nom?.valeur).toBe("LES TROIS MARCHES")
    expect(profil.nom?.provenance.certitude).toBe("probable")
  });

  it("l'adresse du siège n'est pas affichable telle quelle", () => {
    // Pour une chaîne, le siège n'est pas le restaurant qu'on a sous les yeux.
    // On garde l'information pour la proposer, la page ne l'affirme pas.
    expect(profil.adresse?.valeur).toContain("12 rue de Marne")
    expect(profil.adresse?.provenance.certitude).toBe("a_verifier")
    expect(affichable(profil.adresse)).toBe(false)
  })

  it("rien n'est inventé au-delà de ce que l'annuaire sait", () => {
    // Un annuaire d'immatriculation ne connaît ni le téléphone, ni les
    // horaires, ni la carte. Les laisser nuls est le comportement voulu.
    expect(profil.telephone).toBeNull()
    expect(profil.horaires).toBeNull()
    expect(profil.plats).toBeNull()
    expect(profil.accroche).toBeNull()
  })

  it("et ce profil ne suffit PAS à faire une page", () => {
    // Le point le plus important de ce fichier. Une fiche d'annuaire identifie
    // un prospect ; elle ne fournit pas de quoi lui montrer quoi que ce soit.
    // Si cette garde passait au vert, le moteur produirait des pages portant
    // une enseigne et presque rien d'autre.
    expect(assezRichePourUnePage(profil)).toBe(false)
    expect(champsAffichables(profil).length).toBeLessThan(3)
  })

  it("une fiche vide donne un profil vide, pas une erreur", () => {
    const vide = profilDepuisFiche({}, "p2", "2026-11-05")
    expect(vide.nom).toBeNull()
    expect(vide.adresse).toBeNull()
    expect(champsAffichables(vide)).toEqual([])
  })
})
