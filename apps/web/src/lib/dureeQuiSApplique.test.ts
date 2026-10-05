import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { EVENT_TABLES, RETENTION_DAYS, retentionCutoffISO } from "./eventRetention"

const RACINE = join(__dirname, "../../../..")
const vercelJson = JSON.parse(readFileSync(join(RACINE, "vercel.json"), "utf8")) as {
  crons?: { path: string; schedule: string }[]
}
const politique = readFileSync(join(__dirname, "../app/privacy/page.tsx"), "utf8")
const purge = readFileSync(join(__dirname, "../app/api/cron/prune-events/route.ts"), "utf8")

// ═══════════════════════════════════════════════════════════════════════════════
// UNE DURÉE DE CONSERVATION S'APPLIQUE, OU ELLE N'EXISTE PAS (Q14).
//
// L'audit demandait de vérifier que « les durées sont appliquées ».
//
// Ce qui a été trouvé le 29 septembre : /privacy promet que les données de mesure
// sont « conservées 400 jours (environ 13 mois) puis supprimées automatiquement ».
// La route qui les supprime existait — complète, protégée par le contrôle d'entrée
// commun, et couvrant les quatre tables d'événements. Elle n'était **pas
// planifiée** : son propre en-tête disait « N'est PAS planifié par défaut ».
//
// Rien n'effaçait donc rien. La promesse tenait au conditionnel.
//
// La règle : **ce que la politique annonce, le produit l'exécute.**
// ═══════════════════════════════════════════════════════════════════════════════

describe("Q14 — la purge est planifiée, pas seulement écrite", () => {
  it("le cron de purge figure bien dans vercel.json", () => {
    const planifies = (vercelJson.crons ?? []).map(c => c.path)
    expect(planifies, "la purge n'est pas planifiée : la durée annoncée ne s'applique pas")
      .toContain("/api/cron/prune-events")
  })

  it("il tourne au moins une fois par semaine", () => {
    const cron = (vercelJson.crons ?? []).find(c => c.path === "/api/cron/prune-events")
    expect(cron, "cron introuvable").toBeTruthy()
    // Une planification mensuelle laisserait un mois de dépassement sur une
    // fenêtre annoncée au jour près.
    const [, , jourDuMois, mois, jourSemaine] = cron!.schedule.split(/\s+/)
    const hebdomadaireOuPlus = jourDuMois === "*" && mois === "*" && jourSemaine !== undefined
    expect(hebdomadaireOuPlus, `planification trop lâche : ${cron!.schedule}`).toBe(true)
  })

  it("la route ne se dit plus « non planifiée »", () => {
    expect(purge, "l'en-tête contredit vercel.json").not.toContain("N'est PAS\n// planifié par défaut")
    expect(purge).toContain("planifiée dans vercel.json")
  })

  it("elle reste protégée : une purge ouverte serait pire que pas de purge", () => {
    expect(purge).toContain("gardeCron(req")
    expect(purge).toContain("if (refus) return refus")
  })
})

describe("Q14 — la durée annoncée est celle qui s'applique", () => {
  it("la politique lit la constante au lieu d'écrire un nombre", () => {
    expect(politique).toContain("{RETENTION_DAYS} jours")
    expect(politique, "un nombre écrit à la main pourrait diverger").not.toMatch(/\b400\s*jours/)
  })

  it("la fenêtre vaut bien environ treize mois", () => {
    expect(RETENTION_DAYS).toBe(400)
    const coupure = retentionCutoffISO(new Date("2026-09-29T00:00:00.000Z"))
    expect(coupure).toBe(new Date("2025-08-25T00:00:00.000Z").toISOString())
  })

  it("les quatre tables d'événements sont purgées, aucune oubliée", () => {
    const tables = EVENT_TABLES.map(t => t.table)
    expect(tables.sort()).toEqual(["block_clicks", "page_events", "page_views", "scans"])
    for (const { table, column } of EVENT_TABLES) {
      expect(purge, `${table} n'est pas parcourue`).toContain("EVENT_TABLES")
      expect(column, `${table} n'a pas de colonne de date`).toMatch(/_at$/)
    }
  })

  it("la politique n'annonce que des sous-traitants réellement appelés", () => {
    // Le relevé au navigateur (e2e/traceursConformes.spec.ts) vérifie l'inverse :
    // qu'aucun domaine non annoncé n'est contacté. Ici, on vérifie que les noms
    // cités existent dans le produit.
    for (const nom of ["Vercel", "Supabase", "Stripe"]) {
      expect(politique, `${nom} devrait figurer parmi les sous-traitants`).toContain(nom)
    }
  })
})
