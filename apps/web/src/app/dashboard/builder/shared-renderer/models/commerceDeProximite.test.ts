import { describe, it, expect } from "vitest"
import { lireFournees, etatFournees, dansLisible, lireArticles, etatArrivage, arriveLisible, totalEstime, messageDeCommande } from "./commerceDeProximite"

// 19 nov. 2026, 10 h 30 à Paris (UTC+1).
const MATIN = new Date("2026-11-19T09:30:00Z")

describe("fournées", () => {
  it("lit l'horaire, trie, ignore ce qui n'est pas une heure", () => {
    const f = lireFournees("16h30 Viennoiseries\n7h Baguettes tradition\nFermé le lundi\n11:00 — Pains spéciaux\n25h Rien")
    expect(f.map(x => [x.minutes, x.quoi])).toEqual([[420, "Baguettes tradition"], [660, "Pains spéciaux"], [990, "Viennoiseries"]])
  })
  it("dit ce qui est sorti et la prochaine, à l'heure du commerce", () => {
    const e = etatFournees({ fournees: "7h Baguettes\n11h Pains spéciaux\n16h30 Viennoiseries" }, MATIN)
    expect(e.fournees.map(f => f.sortie)).toEqual([true, false, false])
    expect(e.prochaine?.quoi).toBe("Pains spéciaux")
    expect(e.dansMin).toBe(30)
  })
  it("après la dernière : plus de prochaine", () => {
    expect(etatFournees({ fournees: "7h Baguettes" }, MATIN).prochaine).toBeNull()
  })
  it("« dans » se lit", () => {
    expect([dansLisible(45), dansLisible(120), dansLisible(75)]).toEqual(["dans 45 min", "dans 2 h", "dans 1 h 15"])
  })
})

describe("arrivage", () => {
  const c = (date: string, duree?: string) => ({ articles: "Pivoines — 4 € la tige\nRenoncules", date, duree })
  it("lit nom et prix", () => {
    const a = lireArticles("Pivoines — 4 € la tige\nRenoncules")
    expect(a[0]).toMatchObject({ nom: "Pivoines", montant: 4 })
    expect(a[0].prix).toContain("4")
    expect(a[1]).toMatchObject({ nom: "Renoncules", prix: "", montant: null })
  })
  it("visible le jour même, pas le lendemain par défaut", () => {
    expect(etatArrivage(c("2026-11-19"), MATIN).visible).toBe(true)
    expect(etatArrivage(c("2026-11-18"), MATIN).visible).toBe(false)
  })
  it("« 3 jours » : visible jusqu'au surlendemain, puis se tait", () => {
    expect(etatArrivage(c("2026-11-17", "3 jours"), MATIN)).toMatchObject({ visible: true, depuisJours: 2 })
    expect(etatArrivage(c("2026-11-16", "3 jours"), MATIN).visible).toBe(false)
  })
  it("sans date ou sans article : rien", () => {
    expect(etatArrivage({ articles: "Pivoines" }, MATIN).visible).toBe(false)
    expect(etatArrivage({ date: "2026-11-19" }, MATIN).visible).toBe(false)
  })
  it("l'âge se dit", () => {
    expect([arriveLisible(0), arriveLisible(1), arriveLisible(3)]).toEqual(["Arrivé aujourd'hui", "Arrivé hier", "Arrivé il y a 3 jours"])
  })
})

describe("commande à retirer", () => {
  const articles = lireArticles("Baguette tradition — 1,30 €\nCroissant — 1,20 €\nGâteau sur commande")
  it("total estimé, au centime", () => {
    expect(totalEstime(articles, { 0: 2, 1: 3 })).toBe(6.2)
  })
  it("pas de total si un article choisi n'a pas de prix, ni si rien n'est choisi", () => {
    expect(totalEstime(articles, { 0: 1, 2: 1 })).toBeNull()
    expect(totalEstime(articles, {})).toBeNull()
  })
  it("le message nomme quantités, total et précisions", () => {
    const m = messageDeCommande(articles, { 0: 2, 1: 0 }, "  Retrait vers 17 h, au nom de Paul ")
    expect(m).toBe("Bonjour, je souhaite commander :\n• 2 × Baguette tradition\nTotal estimé : 2,60 €\nRetrait vers 17 h, au nom de Paul\nMerci !")
  })
})
