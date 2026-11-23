import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { purgerLesFichiersDuCompte, fichiersSous, type StockageMinimal } from "./purgeDuStockage"

// U7 (revue du 23 nov.) : supprimer son compte laissait photos, logos et cartes
// lisibles dans le bucket public.

const UID = "11111111-2222-4333-8444-555555555555"
const AUTRE = "99999999-2222-4333-8444-555555555555"

/** Un faux bucket : une liste de chemins, avec dossiers implicites. */
function faux(chemins: string[]) {
  const presents = new Set(chemins)
  const supprimes: string[] = []
  const st: StockageMinimal = {
    async list(prefixe, { limit, offset }) {
      const noms = new Map<string, boolean>()   // nom → est un fichier
      for (const c of presents) if (c.startsWith(prefixe + "/")) {
        const reste = c.slice(prefixe.length + 1)
        const [tete, ...suite] = reste.split("/")
        noms.set(tete, suite.length === 0)
      }
      const data = [...noms].sort().slice(offset, offset + limit).map(([name, fichier]) => ({ name, id: fichier ? "id-" + name : null }))
      return { data, error: null }
    },
    async remove(l) { for (const c of l) { supprimes.push(c); presents.delete(c) } return { error: null } },
  }
  return { st, presents, supprimes }
}

describe("la purge des fichiers d'un compte", () => {
  it("efface tout sous son identifiant, sous-dossiers compris, et son avatar", async () => {
    const b = faux([`${UID}/logo-1.webp`, `${UID}/menu/carte-2.webp`, `${UID}/menu/a/b.png`, `avatars/${UID}.jpg`, `${AUTRE}/logo.webp`, `avatars/${AUTRE}.jpg`, "social/2026-11-23/x.png"])
    expect(await purgerLesFichiersDuCompte(b.st, UID)).toBe(3)
    expect([...b.presents].sort()).toEqual([`${AUTRE}/logo.webp`, `avatars/${AUTRE}.jpg`, "social/2026-11-23/x.png"])
  })
  it("un compte sans fichier : seul l'avatar est demandé, rien d'autre n'est touché", async () => {
    const b = faux([`${AUTRE}/logo.webp`])
    expect(await purgerLesFichiersDuCompte(b.st, UID)).toBe(0)
    expect(b.supprimes).toEqual([`avatars/${UID}.jpg`])
  })
  it("refuse un identifiant qui viderait le bucket d'autres comptes", async () => {
    const b = faux([`${AUTRE}/logo.webp`])
    for (const mauvais of ["", "avatars", "social", "../x", "*"])
      await expect(purgerLesFichiersDuCompte(b.st, mauvais), mauvais).rejects.toThrow()
    expect(b.supprimes).toEqual([])
  })
  it("pagine au-delà de 1 000 fichiers", async () => {
    const b = faux(Array.from({ length: 2345 }, (_, i) => `${UID}/f${String(i).padStart(5, "0")}.webp`))
    expect((await fichiersSous(b.st, UID)).length).toBe(2345)
    expect(await purgerLesFichiersDuCompte(b.st, UID)).toBe(2345)
    expect(b.presents.size).toBe(0)
  })
  it("une erreur de lecture remonte au lieu de faire croire à une purge", async () => {
    const st: StockageMinimal = { list: async () => ({ data: null, error: { message: "refus" } }), remove: async () => ({ error: null }) }
    await expect(purgerLesFichiersDuCompte(st, UID)).rejects.toThrow("refus")
  })
  it("la route purge APRÈS la suppression réussie, et journalise un échec", () => {
    const r = readFileSync(join(__dirname, "../app/api/account/delete/route.ts"), "utf8")
    const suppr = r.indexOf("admin.auth.admin.deleteUser(uid)")
    const purge = r.indexOf("purgerLesFichiersDuCompte(admin.storage.from(BUCKET_DES_COMPTES)")
    expect(suppr).toBeGreaterThan(0)
    expect(purge).toBeGreaterThan(suppr)
    expect(r).toContain("PURGE DU STOCKAGE À REJOUER")
  })
})
