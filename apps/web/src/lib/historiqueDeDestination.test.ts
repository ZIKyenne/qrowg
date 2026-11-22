import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { historiqueApres, historiqueLu, colonneAbsente, HISTORIQUE_MAX } from "./historiqueDeDestination"

const T = new Date("2026-11-22T10:00:00.000Z")

describe("historique des destinations d'un lien dynamique (QR-010)", () => {
  it("l'adresse remplacée entre en tête, avec le jour du changement", () => {
    expect(historiqueApres("https://a.fr/", "https://b.fr/", [], T)).toEqual([{ url: "https://a.fr/", remplaceeLe: T.toISOString() }])
  })

  it("rien ne s'écrit quand rien ne change", () => {
    expect(historiqueApres("https://a.fr/", "https://a.fr/", [], T)).toBeNull()
    expect(historiqueApres(null, "https://a.fr/", [], T)).toBeNull()
  })

  it("on garde les dix dernières, les plus récentes d'abord", () => {
    const vieux = Array.from({ length: HISTORIQUE_MAX }, (_, i) => ({ url: `https://${i}.fr/`, remplaceeLe: T.toISOString() }))
    const h = historiqueApres("https://neuf.fr/", "https://autre.fr/", vieux, T)!
    expect(h).toHaveLength(HISTORIQUE_MAX)
    expect(h[0].url).toBe("https://neuf.fr/")
    expect(h.at(-1)!.url).toBe("https://8.fr/")
  })

  it("une valeur abîmée en base ne casse rien", () => {
    expect(historiqueLu(null)).toEqual([])
    expect(historiqueLu("x")).toEqual([])
    expect(historiqueLu([{ url: "" }, { foo: 1 }, { url: "https://ok.fr/", remplaceeLe: "2026-11-01" }])).toEqual([{ url: "https://ok.fr/", remplaceeLe: "2026-11-01" }])
  })

  it("on ne garde que l'adresse et la date, rien de sensible", () => {
    const [e] = historiqueApres("https://a.fr/", "https://b.fr/", [], T)!
    expect(Object.keys(e).sort()).toEqual(["remplaceeLe", "url"])
  })

  it("reconnaît une colonne pas encore créée", () => {
    expect(colonneAbsente({ code: "42703", message: "column instant_qrs.dest_history does not exist" })).toBe(true)
    expect(colonneAbsente({ code: "PGRST204", message: "Could not find the 'dest_history' column" })).toBe(true)
    expect(colonneAbsente({ code: "23505", message: "duplicate key" })).toBe(false)
    expect(colonneAbsente(null)).toBe(false)
  })
})

describe("la route des liens tient sans la migration", () => {
  const route = readFileSync(join(__dirname, "../app/api/qr-instant/route.ts"), "utf8")
  it("lit l'historique avec un repli si la colonne manque", () => {
    expect(route).toContain("colonneAbsente(")
    // La liste ne doit jamais dépendre de la colonne : COLS ne la contient pas.
    expect(route).toMatch(/const COLS = "[^"]*"/)
    expect(route.match(/const COLS = "([^"]*)"/)![1]).not.toContain("dest_history")
  })
  it("la migration existe, et n'ajoute qu'une colonne", () => {
    const dir = join(__dirname, "../../../../supabase/migrations")
    const f = readdirSync(dir).sort().find(n => n.endsWith("_instant_qrs_historique.sql"))
    expect(f, "migration de l'historique").toBeTruthy()
    const sql = readFileSync(join(dir, f!), "utf8")
    expect(sql).toMatch(/add column if not exists dest_history jsonb not null default '\[\]'/i)
    expect(sql).not.toMatch(/\b(drop|delete|truncate)\b/i)
  })
})
