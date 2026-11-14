// Audit du 14 novembre 2026, lot B : une relance de la tâche ne renvoie pas le rapport.
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { semaineEcoulee } from "@/lib/weeklyReport"

describe("le rapport hebdomadaire part une fois par compte et par semaine", () => {
  it("l'envoi porte une clé d'idempotence compte + semaine", () => {
    const src = readFileSync(join(__dirname, "route.ts"), "utf8")
    expect(src).toContain("idempotencyKey: `rapport-hebdo/${profile.id}/${debutIso.slice(0, 10)}`")
  })
  it("deux relances le même jour donnent la même semaine", () => {
    const a = semaineEcoulee(new Date("2026-11-16T07:00:00Z")).debutIso.slice(0, 10)
    const b = semaineEcoulee(new Date("2026-11-16T09:30:00Z")).debutIso.slice(0, 10)
    expect(a).toBe(b)
  })
})
