import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

// Vague 4, point 2 : le filet navigateur tourne à CHAQUE push, sans secret.
// Une primitive sans garde disparaît (voir les relevés de juillet) : celle-ci
// vérifie que le filet existe, qu'il vise des fichiers réels, et qu'il ne dépend
// d'aucun secret du dépôt.

const RACINE = join(__dirname, "../../../..")
const pkg = JSON.parse(readFileSync(join(RACINE, "package.json"), "utf8"))
const ci = readFileSync(join(RACINE, ".github/workflows/ci-cd.yml"), "utf8")
const jobFilet = ci.slice(ci.indexOf("\n  filet:"), ci.indexOf("\n  e2e:"))

describe("le filet navigateur", () => {
  it("vise des fichiers qui existent, et au moins les parcours de l'argent et de la redirection", () => {
    const fichiers: string[] = pkg.scripts["test:e2e:filet"].match(/e2e\/[\w-]+\.spec\.ts/g)
    for (const f of fichiers) expect(existsSync(join(RACINE, f)), f).toBe(true)
    for (const critique of ["choixAuRetour", "galerieDashboardForfaits", "prixAnnuelCoherent", "historiqueDestination", "exportQrSansRupture"])
      expect(fichiers, critique).toContain(`e2e/${critique}.spec.ts`)
  })
  it("tourne à chaque push, pas seulement à la main", () => {
    expect(jobFilet).toContain("run: pnpm test:e2e:filet")
    expect(jobFilet).not.toMatch(/if: github\.event_name == 'workflow_dispatch'/)
    expect(ci).toMatch(/on:\s*\n\s*push:/)
  })
  it("ne dépend d'aucun secret : session simulée, adresse Supabase factice", () => {
    expect(jobFilet).not.toContain("secrets.")
    expect(jobFilet).toMatch(/NEXT_PUBLIC_SUPABASE_URL: https:\/\/[a-z0-9]+\.supabase\.co/)
  })
  it("la CI tourne sur la même version de Node que la production", () => {
    const prod = pkg.engines?.node ?? JSON.parse(readFileSync(join(RACINE, "apps/web/package.json"), "utf8")).engines?.node
    const majeur = String(prod).match(/\d+/)![0]
    for (const v of ci.match(/node-version: '(\d+)'/g)!) expect(v).toContain(`'${majeur}'`)
  })
})
