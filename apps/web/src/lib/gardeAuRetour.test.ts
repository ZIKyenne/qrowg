import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { gardesDAbord, choixNettoye, colonneGardeAbsente, placesAuRetour } from "./gardeAuRetour"
import { planDynamicReconcile } from "./dynamicReconcile"
import { planPagesReconcile } from "./pauseDesPages"

// D3 (audit UX v2, 23 nov.) : l'abonné choisit AVANT l'échéance ce qui reste
// actif au retour au gratuit. Sans choix, l'ordre d'avant (les plus anciens).

const id = (n: number) => `00000000-0000-0000-0000-00000000000${n}`
const NOW = Date.parse("2026-11-23T10:00:00Z")

describe("ce que l'abonné garde passe en premier", () => {
  it("partition stable : les gardés d'abord, chacun dans son ordre", () => {
    const l = [{ id: "a" }, { id: "b", keep_on_downgrade: true }, { id: "c" }, { id: "d", keep_on_downgrade: true }]
    expect(gardesDAbord(l).map(x => x.id)).toEqual(["b", "d", "a", "c"])
  })

  it("sans choix, rien ne bouge", () => {
    const l = [{ id: "a" }, { id: "b", keep_on_downgrade: false }, { id: "c", keep_on_downgrade: null }]
    expect(gardesDAbord(l).map(x => x.id)).toEqual(["a", "b", "c"])
  })

  it("QR modifiables : au retour au gratuit, c'est le QR choisi qui reste actif", () => {
    const liens = [
      { id: "vitrine", status: "active", expires_at: null, paused_reason: null },
      { id: "table", status: "active", expires_at: null, paused_reason: null },
      { id: "flyer", status: "active", expires_at: null, paused_reason: null, keep_on_downgrade: true },
    ]
    // Avant D3 : le plus ancien (vitrine) restait, les deux autres s'éteignaient.
    const avant = planDynamicReconcile(liens, 1, NOW).filter(o => o.patch.status === "paused").map(o => o.id)
    expect(avant).toEqual(["table", "flyer"])
    const apres = planDynamicReconcile(gardesDAbord(liens), 1, NOW).filter(o => o.patch.status === "paused").map(o => o.id)
    expect(apres).toEqual(["vitrine", "table"])
  })

  it("QR de page : même règle", () => {
    const qrs = [
      { id: "p1", status: "active" }, { id: "p2", status: "active", keep_on_downgrade: true }, { id: "p3", status: "active" },
    ]
    const coupes = planPagesReconcile(gardesDAbord(qrs), 1).filter(o => o.patch.status === "paused").map(o => o.id)
    expect(coupes).toEqual(["p1", "p3"])
  })

  it("une pause choisie à la main reste une pause, même marquée « à garder »", () => {
    const liens = [
      { id: "a", status: "paused", expires_at: null, paused_reason: "manual", keep_on_downgrade: true },
      { id: "b", status: "active", expires_at: null, paused_reason: null },
    ]
    expect(planDynamicReconcile(gardesDAbord(liens), 1, NOW)).toEqual([])
  })
})

describe("le choix envoyé par le navigateur est borné", () => {
  it("des identifiants, sans doublon, pas plus que le plan gratuit n'en couvre", () => {
    expect(choixNettoye([id(1), id(1), id(2)], 1)).toEqual([id(1)])
    expect(choixNettoye([id(1), "x", 3, null], 5)).toEqual([id(1)])
    expect(choixNettoye("pas un tableau", 1)).toEqual([])
    expect(choixNettoye([id(1)], 0)).toEqual([])
  })

  it("les places sont celles du plan gratuit", () => {
    expect(placesAuRetour()).toEqual({ liens: 1, pages: 1 })
  })

  it("reconnaît une colonne pas encore créée", () => {
    expect(colonneGardeAbsente({ code: "42703", message: "column qr_codes.keep_on_downgrade does not exist" })).toBe(true)
    expect(colonneGardeAbsente({ code: "PGRST204", message: "Could not find the 'keep_on_downgrade' column" })).toBe(true)
    expect(colonneGardeAbsente({ code: "23505", message: "duplicate key" })).toBe(false)
    expect(colonneGardeAbsente(null)).toBe(false)
  })
})

describe("le webhook et l'écran tiennent sans la migration", () => {
  const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
  it("le webhook réordonne les deux réconciliations, avec repli", () => {
    const w = lire("../app/api/webhooks/stripe/route.ts")
    expect(w).toContain("planDynamicReconcile(gardesDAbord(")
    expect(w).toContain("planPagesReconcile(gardesDAbord(")
    expect(w.match(/colonneGardeAbsente\(/g)?.length).toBeGreaterThanOrEqual(2)
  })
  it("Facturation propose le choix là où elle prévient", () => {
    const g = lire("../components/GestionAbonnement.tsx")
    expect(g).toContain("{avertissement && <ChoixAuRetour pagesEnPauseAuRetour={joursOffertsEcoules} />}")
  })
  it("la migration existe, et n'ajoute que deux colonnes", () => {
    const dir = join(__dirname, "../../../../supabase/migrations")
    const f = readdirSync(dir).sort().find(n => n.endsWith("_garde_au_retour.sql"))
    expect(f, "migration du choix au retour").toBeTruthy()
    const sql = readFileSync(join(dir, f!), "utf8")
    expect(sql.match(/add column if not exists keep_on_downgrade boolean not null default false/gi)).toHaveLength(2)
    expect(sql).not.toMatch(/\b(drop|delete|truncate|update)\b/i)
  })
})
