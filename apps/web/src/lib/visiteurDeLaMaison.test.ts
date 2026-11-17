import { describe, it, expect } from "vitest"
import { aUneSessionQrowg, utilisateurDesCookies, estDeLaMaison } from "./visiteurDeLaMaison"

const adminAvec = (ligne: unknown) => ({
  from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: ligne }) }) }) }) }) }),
})

describe("le commerçant ne se compte pas lui-même", () => {
  it("reconnaît le cookie de session, y compris découpé", () => {
    expect(aUneSessionQrowg([{ name: "sb-abc-auth-token" }])).toBe(true)
    expect(aUneSessionQrowg([{ name: "sb-abc-auth-token.0" }, { name: "sb-abc-auth-token.1" }])).toBe(true)
    expect(aUneSessionQrowg([{ name: "_ga" }, { name: "sb-abc-code-verifier" }])).toBe(false)
    expect(aUneSessionQrowg([])).toBe(false)
  })
  it("un visiteur sans session : aucune requête, compté", async () => {
    expect(await utilisateurDesCookies([{ name: "_ga", value: "x" }])).toBeNull()
  })
  it("propriétaire ou membre d'équipe : de la maison ; sinon, ou sans utilisateur : un client", async () => {
    expect(await estDeLaMaison(adminAvec(null), "u1", { user_id: "u1" })).toBe(true)
    expect(await estDeLaMaison(adminAvec({ id: "m" }), "u2", { user_id: "u1", team_id: "t" })).toBe(true)
    expect(await estDeLaMaison(adminAvec(null), "u2", { user_id: "u1", team_id: "t" })).toBe(false)
    expect(await estDeLaMaison(adminAvec(null), "u2", { user_id: "u1" })).toBe(false)
    expect(await estDeLaMaison(adminAvec({ id: "m" }), null, { user_id: "u1", team_id: "t" })).toBe(false)
  })
  it("en cas de panne, on compte (un client perdu coûte plus qu'un scan du gérant)", async () => {
    const enPanne = { from: () => { throw new Error("réseau") } }
    expect(await estDeLaMaison(enPanne, "u2", { user_id: "u1", team_id: "t" })).toBe(false)
  })
})
