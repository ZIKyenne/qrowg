import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { sansCommentaires } from "@/lib/codeSeul"

// Vague 4, point 1 (revue du 23 nov.) : les types de la base sont RÉELS, et le
// dépôt décrit toutes les tables de la production.

const ICI = __dirname
const RACINE = join(ICI, "../../../../..")
const genere = readFileSync(join(ICI, "database.generated.ts"), "utf8")

function tablesDuSchema(): string[] {
  const debut = genere.indexOf("    Tables: {"), fin = genere.indexOf("    Views: {")
  return [...genere.slice(debut, fin).matchAll(/^      ([a-z_0-9]+): \{\n        Row:/gm)].map(m => m[1])
}

describe("les types de la base sont les vrais", () => {
  it("Database n'est plus `any` : il vient du schéma généré", () => {
    const t = sansCommentaires(readFileSync(join(ICI, "database.types.ts"), "utf8"))
    expect(t).not.toMatch(/Database\s*=\s*any/)
    expect(t).toContain('from "./database.generated"')
    expect(genere).toContain("export type Database = {")
  })
  it("les clients Supabase sont typés par ce schéma", () => {
    for (const f of ["client.ts", "server.ts"]) expect(readFileSync(join(ICI, f), "utf8"), f).toContain("<Database>")
  })
  it("le script de régénération écrit au bon endroit", () => {
    const pkg = JSON.parse(readFileSync(join(RACINE, "package.json"), "utf8"))
    expect(pkg.scripts["db:types"]).toContain("apps/web/src/lib/supabase/database.generated.ts")
  })
})

describe("chaque table de la production a sa migration", () => {
  // `plan_limits` : table présente en production (4 lignes), lue par AUCUN code ni
  // fonction de la base, créée hors migration. À supprimer ou à documenter : décision
  // du propriétaire (relevé du 24 nov.). La liste ne peut que RÉTRÉCIR.
  const TOLEREES_SANS_MIGRATION = ["plan_limits"]
  it("aucune nouvelle table sans `create table` dans supabase/migrations", () => {
    const dossier = join(RACINE, "supabase/migrations")
    const sql = readdirSync(dossier).sort().map(f => readFileSync(join(dossier, f), "utf8").toLowerCase()).join("\n")
    const manquantes = tablesDuSchema().filter(t => !new RegExp(`create table (if not exists )?(public\\.)?"?${t}"?\\b`).test(sql))
    expect(manquantes).toEqual(TOLEREES_SANS_MIGRATION)
  })
  it("cron_runs et contact_messages sont décrites, comme en production", () => {
    const m = readFileSync(join(RACINE, "supabase/migrations/20261124120000_cron_runs_contact_messages.sql"), "utf8")
    expect(m).toContain("check (statut in ('ok', 'rien', 'erreur', 'refuse'))")
    expect(m).toContain("force row level security")
    expect(m).toContain("create policy \"Contact service role\"")
  })
})

describe("les défauts que les types ont révélés restent corrigés", () => {
  it("la notification d'un contact ne lit plus `pages.blocks` (colonne inexistante)", () => {
    const s = sansCommentaires(readFileSync(join(ICI, "../notifierProprietaireLead.ts"), "utf8"))
    expect(s).not.toContain('select("title, user_id, blocks")')
    expect(s).toContain('.from("blocks").select("id, content").eq("page_id", pageId)')
  })
  it("le journal d'activité suit l'énumération de la base, et sait dessiner chacune de ses valeurs", async () => {
    const enumeration = /activity_event_type:\n((?:\s+\| "[a-z_]+"\n)+)/.exec(genere)![1].match(/"([a-z_]+)"/g)!.map(v => v.slice(1, -1))
    const { ACTIVITY_CFG } = await import("../../app/dashboard/profile/typesProfil")
    expect(Object.keys(ACTIVITY_CFG).sort()).toEqual([...enumeration].sort())
  })
})
