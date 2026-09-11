import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { SEUIL_INTERPRETATION } from "./lectureHonnete"

// Relevé du 11 septembre, banc d'essai « débutant » (3 scans, 4 vues, 30 jours) :
// l'écran annonçait « Votre trafic augmente. », « +100 % contre hier (0) »,
// « surtout via QR code sur mobile · pic d'activité vers 0h », et le graphique
// titrait « pic · 1 scans le 8/9 ». Quatre affirmations, zéro mesure derrière.
//
// Ce test empêche le retour de chacune. La règle vit dans lectureHonnete.ts
// (module pur, testé à part) ; ici on vérifie que l'interface s'y branche
// vraiment, au lieu de refaire le calcul dans son coin.

const lire = (f: string) => readFileSync(join(__dirname, f), "utf8")
const client = lire("AnalyticsClient.tsx")
const cartes = lire("OverviewCards.tsx")

describe("l'écran ne calcule plus la tendance lui-même", () => {
  it("l'évolution du jour passe par evolutionJournaliere, qui peut valoir null", () => {
    expect(client).toContain("const evo = evolutionJournaliere(todayN, ydayN)")
    // la division par zéro déguisée en « +100 % » a disparu du code
    expect(client).not.toContain("(todayN > 0 ? 100 : 0)")
    expect(client).not.toMatch(/ydayN \? Math\.round/)
  })
  it("le badge de pourcentage ne s'affiche que lorsqu'il existe", () => {
    expect(client).toContain("{live.evo != null && (")
    expect(client).toContain('{live.evo != null ? `contre hier (${live.ydayN}) · scans + vues` : "hier : rien · scans + vues"}')
  })
  it("le titre de synthèse vient de titreSynthese, pas d'un ternaire sur place", () => {
    expect(client).toContain("{titreSynthese(story.evenements, live.evo)}")
    expect(client).not.toContain('{live.evo > 5 ? "Votre trafic augmente."')
  })
})

describe("sous le seuil, aucune conclusion n'est tirée", () => {
  it("source, appareil et heure de pic sont coupés en amont par assezPourConclure", () => {
    expect(client).toContain("const assez = assezPourConclure(times.length)")
    expect(client).toContain("if (!assez) return { evenements: times.length, assez, topSource: null, topDevice: null, peakHour: null }")
    expect(SEUIL_INTERPRETATION).toBeGreaterThanOrEqual(10)
  })
  it("l'écran le dit au lieu de laisser croire à une lecture", () => {
    expect(client).toContain("C&apos;est encore trop peu pour en tirer une tendance.")
  })
  it("le conseil vient de conseilLecture : amorcer tant qu'il n'y a rien à lire", () => {
    expect(client).toContain("const advice = conseilLecture(story.evenements, { heurePic: story.peakHour, sourcePrincipale: story.topSource })")
    expect(client).not.toContain("totalScans30 < 10 ?")
  })
})

describe("les accords et les créneaux", () => {
  it("plus de « 1 scans » : le pluriel est fait par la fonction, aux quatre endroits", () => {
    expect(client).toContain('{pluriel(totalScans30, "scan")} et {pluriel(totalViews30, "vue")} sur 30 jours')
    expect(client).not.toContain("scan{totalScans30 > 1")
    expect(cartes).toContain('pic · {pluriel(peakVal, "scan")} le {g.dates[g.peakI]}')
    expect(cartes).toContain('{pluriel(g.scans[hover], "scan")}')
    expect(cartes).toContain('{pluriel(g.views[hover], "vue")}')
    expect(cartes).not.toMatch(/\{g\.(scans|views)\[hover\]\} (scans|vues)/)
  })
  it("l'heure de pic s'écrit en créneau d'une heure", () => {
    expect(client).toContain("{creneauHoraire(story.peakHour)}")
    expect(client).not.toContain("{story.peakHour}h</strong>")
  })
})

describe("un pic n'est montré que s'il en est un", () => {
  it("le graphique exige un maximum unique et supérieur à 1", () => {
    expect(cartes).toContain("const showPeak = showScans && hover === null && picLisible(g.scans)")
    expect(cartes).not.toContain("hover === null && peakVal > 0")
  })
})
