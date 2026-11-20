import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// ─────────────────────────────────────────────────────────────────────────────
// LES FONCTIONS TOURNENT À CÔTÉ DE LA BASE (20 nov.)
//
// Relevé : sans région déclarée, Vercel exécutait toutes les fonctions à iad1
// (Washington — en-tête `x-vercel-id: cdg1::iad1::…`), alors que la base
// Supabase est en Europe (37 à 75 ms depuis la France, traitement compris).
// Chaque requête serveur → base traversait donc l'Atlantique aller-retour
// (~80-100 ms), et l'accueil du tableau de bord en enchaîne six vagues : plus
// d'une demi-seconde d'attente à chaque affichage, autant à chaque appel d'API.
//
// cdg1 (Paris) : à 10-20 ms de la base, quelle que soit sa région européenne,
// et au plus près des commerçants. Changer de région = vérifier d'abord où vit
// la base (Supabase → Settings → General → Region).
// ─────────────────────────────────────────────────────────────────────────────

const RACINE = join(__dirname, "..", "..", "..", "..")
const EUROPE = ["cdg1", "fra1", "dub1", "lhr1", "arn1"]

describe("région des fonctions", () => {
  it("vercel.json déclare une région européenne, à côté de la base", () => {
    const conf = JSON.parse(readFileSync(join(RACINE, "vercel.json"), "utf8"))
    expect(Array.isArray(conf.regions), "aucune région : Vercel retombe sur iad1 (Washington)").toBe(true)
    expect(conf.regions.length).toBeGreaterThan(0)
    for (const r of conf.regions) expect(EUROPE, `région ${r} loin de la base européenne`).toContain(r)
  })
})
