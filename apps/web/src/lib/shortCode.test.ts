import { describe, it, expect } from "vitest"
import { uniqueShortCode } from "./shortCode"

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"

// Faux Supabase : `short_code_libre` répond vrai (code libre) ou faux (collision).
function supa(hit: boolean) {
  return { rpc: () => Promise.resolve({ data: !hit, error: null }) } as any
}

// Faux Supabase en panne : la RPC échoue. Une panne n'est PAS une réponse
// favorable — la fonction doit refuser, pas livrer un code non vérifié.
function supaEnPanne() {
  return { rpc: () => Promise.resolve({ data: null, error: { message: "boom" } }) } as any
}

describe("uniqueShortCode", () => {
  it("génère un code de 7 caractères issus de l'alphabet sûr", async () => {
    const code = await uniqueShortCode(supa(false))
    expect(code).toHaveLength(7)
    for (const ch of code) expect(ALPHABET).toContain(ch)
    // aucun caractère ambigu (O, 0, I, l, 1)
    expect(code).not.toMatch(/[O0Il1]/)
  })

  it("ajoute le code généré au set `seen`", async () => {
    const seen = new Set<string>()
    const code = await uniqueShortCode(supa(false), seen)
    expect(seen.has(code)).toBe(true)
  })

  it("deux appels successifs donnent deux codes distincts (seen évite le doublon)", async () => {
    const seen = new Set<string>()
    const a = await uniqueShortCode(supa(false), seen)
    const b = await uniqueShortCode(supa(false), seen)
    expect(a).not.toBe(b)
    expect(seen.size).toBe(2)
  })

  it("échoue si la base renvoie une collision permanente", async () => {
    await expect(uniqueShortCode(supa(true))).rejects.toThrow()
  })

  // Audit du 23/09/2026 : la vérification passe par une RPC. Si elle tombe, le
  // code n'a été vérifié nulle part — le livrer quand même reviendrait à
  // fabriquer un short_code peut-être déjà pris, silencieusement.
  it("refuse de livrer un code quand la vérification est en panne", async () => {
    await expect(uniqueShortCode(supaEnPanne())).rejects.toThrow()
  })

  // Le contrôle interroge la fonction de base, PAS les tables : une lecture
  // directe de `qr_codes` avec le client utilisateur ne voit que ses lignes
  // (ou, pire, exige une policy publique pour voir les autres).
  it("n'interroge aucune table, seulement `short_code_libre`", async () => {
    const appels: { nom: string; arg: any }[] = []
    const faux: any = {
      rpc: (nom: string, arg: any) => { appels.push({ nom, arg }); return Promise.resolve({ data: true, error: null }) },
      from: (t: string) => { throw new Error(`lecture directe interdite : ${t}`) },
    }
    const code = await uniqueShortCode(faux)
    expect(appels).toHaveLength(1)
    expect(appels[0].nom).toBe("short_code_libre")
    expect(appels[0].arg).toEqual({ p_code: code })
  })
})
