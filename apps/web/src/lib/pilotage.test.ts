import { describe, it, expect } from "vitest"
import { calculerPilotage, mediane, SEUIL_TAUX } from "./pilotage"

const J = 864e5
const NOW = Date.parse("2026-11-16T12:00:00Z")
const il_y_a = (j: number) => new Date(NOW - j * J).toISOString()

describe("pilotage — entonnoir depuis la base", () => {
  const comptes = [
    { id: "a", inscritLe: il_y_a(40) },
    { id: "b", inscritLe: il_y_a(20) },
    { id: "c", inscritLe: il_y_a(5) },
    { id: "vieux", inscritLe: il_y_a(200) },   // hors fenêtre de 90 jours
  ]
  const pages = [
    { id: "pa", user_id: "a", created_at: il_y_a(39), published_at: il_y_a(38) },
    { id: "pb", user_id: "b", created_at: il_y_a(19), published_at: null },
    { id: "pv", user_id: "vieux", created_at: il_y_a(150), published_at: il_y_a(150) },
  ]
  const scans = [
    { page_id: "pa", scanned_at: il_y_a(36) },
    { page_id: "pa", scanned_at: il_y_a(3) },
    { page_id: "pv", scanned_at: il_y_a(2) },
  ]
  const abonnements = [
    { user_id: "a", status: "active", plan: "pro", cancel_at_period_end: true },
    { user_id: "vieux", status: "past_due", plan: "starter", cancel_at_period_end: false },
  ]
  const p = calculerPilotage({ comptes, pages, scans, abonnements }, NOW)

  it("compte des SUCCÈS par étape, sur la cohorte de la fenêtre", () => {
    expect(p.etapes.map(e => [e.cle, e.nombre])).toEqual([["inscrit", 3], ["page", 2], ["publiee", 1], ["scan", 1], ["payant", 1]])
  })
  it("sous le seuil : « n sur m », jamais de pourcentage", () => {
    expect(p.etapes[1]).toMatchObject({ taux: null, surPrecedente: "2 sur 3" })
    expect(SEUIL_TAUX).toBeGreaterThanOrEqual(10)
  })
  it("le payant se rapporte aux comptes créés, pas aux scannés", () => {
    expect(p.etapes.find(e => e.cle === "payant")!.surPrecedente).toBe("1 sur 3")
  })
  it("délai médian depuis l'inscription", () => {
    expect(p.etapes.find(e => e.cle === "publiee")!.delaiMedianJours).toBe(2)
    expect(p.etapes.find(e => e.cle === "scan")!.delaiMedianJours).toBe(4)
  })
  it("rétention : comptes de plus de 30 jours avec un scan dans les 30 derniers", () => {
    expect(p.retention).toEqual({ comptesDePlusDe30j: 2, actifsSur30j: 2, taux: null })
  })
  it("revenu : abonnements en cours, mix, résiliations programmées, impayés", () => {
    expect(p.revenu).toEqual({ payants: 2, parPlan: { pro: 1, starter: 1 }, resiliationsProgrammees: 1, impayes: 1 })
  })
  it("ce qui n'est pas mesuré est nommé", () => {
    expect(p.nonMesure.join(" ")).toMatch(/Export réellement terminé/)
  })
  it("au-delà du seuil, un pourcentage", () => {
    const beaucoup = Array.from({ length: 20 }, (_, i) => ({ id: `u${i}`, inscritLe: il_y_a(10) }))
    const pg = beaucoup.slice(0, 5).map(c => ({ id: `p${c.id}`, user_id: c.id, created_at: il_y_a(9), published_at: null }))
    expect(calculerPilotage({ comptes: beaucoup, pages: pg, scans: [], abonnements: [] }, NOW).etapes[1].taux).toBe(25)
  })
  it("médiane paire / impaire / vide", () => {
    expect(mediane([3, 1, 2])).toBe(2)
    expect(mediane([1, 2, 3, 4])).toBe(2.5)
    expect(mediane([])).toBeNull()
  })
})

describe("pilotage — le démarchage", () => {
  it("compte les comptes inscrits avec VOTRE code, et ceux qui ont publié", () => {
    const NOW2 = Date.parse("2026-11-16T12:00:00Z")
    const j = (n: number) => new Date(NOW2 - n * 864e5).toISOString()
    const comptes = [
      { id: "moi", inscritLe: j(200) },
      { id: "a", inscritLe: j(10), parrain: "moi" },
      { id: "b", inscritLe: j(5), parrain: "moi" },
      { id: "c", inscritLe: j(5), parrain: "quelquun" },
      { id: "d", inscritLe: j(120), parrain: "moi" },          // hors fenêtre
    ]
    const pages = [{ id: "pa", user_id: "a", created_at: j(9), published_at: j(8) }]
    const p = calculerPilotage({ comptes, pages, scans: [], abonnements: [] }, NOW2, 90, "moi")
    expect(p.demarchage).toEqual({ inscrits: 2, publies: 1 })
    expect(calculerPilotage({ comptes, pages, scans: [], abonnements: [] }, NOW2, 90).demarchage).toBeNull()
  })
})
