import { describe, it, expect } from "vitest"
import { infosSejour, equipements, bonnesAdresses, numerosUtiles, URGENCES } from "./livretAccueil"

describe("le livret d'accueil", () => {
  it("infos séjour : rien tant que rien n'est écrit ; règles en liste, puces retirées", () => {
    expect(infosSejour({})).toBeNull()
    expect(infosSejour({ arrivee: "  " })).toBeNull()
    const i = infosSejour({ arrivee: "À partir de 16 h", regles: "- Non-fumeur\n\n• Silence après 22 h", avant_depart: "Sortir les poubelles" })!
    expect(i.arrivee).toBe("À partir de 16 h")
    expect(i.regles).toEqual(["Non-fumeur", "Silence après 22 h"])
    expect(i.avantDepart).toEqual(["Sortir les poubelles"])
  })

  it("équipements : cochés dans l'ordre de la liste, puis les autres saisis ; une clé inconnue est ignorée", () => {
    const e = equipements({ liste: "animaux, wifi,xxx", autres: "Vélos à disposition" })
    expect(e.map(x => x.libelle)).toEqual(["Wi-Fi", "Animaux acceptés", "Vélos à disposition"])
    expect(equipements({})).toEqual([])
  })

  it("bonnes adresses : catégorie hors liste → « Autre » ; une ligne sans nom n'existe pas", () => {
    const a = bonnesAdresses({ a1_name: "Chez Paulette", a1_cat: "Restaurant", a1_distance: "5 min à pied", a2_name: " ", a3_name: "La crique", a3_cat: "Mystère" })
    expect(a.map(x => [x.nom, x.categorie])).toEqual([["Chez Paulette", "Restaurant"], ["La crique", "Autre"]])
    expect(a[0].distance).toBe("5 min à pied")
  })

  it("numéros utiles : ceux du commerçant (nom ET numéro), puis les VRAIS numéros d'urgence s'il les active", () => {
    expect(numerosUtiles({ n1_name: "Votre hôte", n1_phone: "06 12 34 56 78", n2_name: "Sans numéro" })).toEqual([{ nom: "Votre hôte", numero: "06 12 34 56 78", urgence: false, sms: false }])
    expect(numerosUtiles({ urgences: "Oui" }).find(n => n.numero === "114")?.sms, "le 114 ne s'appelle pas").toBe(true)
    const tout = numerosUtiles({ urgences: "Oui" })
    expect(tout.map(n => n.numero)).toEqual(["112", "15", "17", "18", "114"])
    expect(URGENCES.length).toBe(5)
    expect(numerosUtiles({})).toEqual([])
  })
})
