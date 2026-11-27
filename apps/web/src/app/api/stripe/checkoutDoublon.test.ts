import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// Un abonné qui relançait un checkout obtenait un DEUXIÈME abonnement Stripe ;
// l'upsert du webhook (une ligne par compte) écrasait le premier, qui restait
// facturé et invisible.
//
// Côté serveur (refus d'une seconde caisse, portail de changement, client Stripe
// existant, plan « constructor ») : JOUÉ depuis v407 (bancCaisse.test.ts). Reste
// ici l'écran, qu'un banc de route ne voit pas.

const ici = dirname(fileURLToPath(import.meta.url))
const page = readFileSync(join(ici, "..", "..", "upgrade", "page.tsx"), "utf8")

describe("pas de double abonnement", () => {
  it("la page Tarifs envoie l'abonné vers le portail au lieu d'un bouton mort", () => {
    expect((page.match(/if \(data\.portal\) \{ await ouvrirPortail\(\); return \}/g) || []).length).toBe(2)
    // Ancré sur l'INTENTION, pas sur la forme de l'appel : depuis le lot v109 il
    // passe par `effetDe`, qui lit la réponse et dit le refus.
    expect(page).toContain('effetDe("/api/stripe/portal", { method: "POST" })')
  })
})
