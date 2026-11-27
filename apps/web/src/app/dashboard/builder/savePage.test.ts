import { describe, it, expect } from "vitest"
import { persistSnapshot, blockToRow, type PageSnapshot } from "./savePage"

const A = "11111111-1111-4111-8111-111111111111"
const B = "22222222-2222-4222-8222-222222222222"
const ORPH = "99999999-9999-4999-8999-999999999999"

type Op = { table: string; kind: string; payload?: any; onConflict?: any; filters: any[] }

// Client Supabase mocké : enregistre chaque opération et renvoie des {data,error}
// configurables. `existing` = ce que la lecture des blocs retourne ; `errors` = quelle
// étape doit échouer.
function makeClient(cfg: { existing?: Array<{ id: string }>; pageEcrite?: boolean; errors?: Partial<Record<"pageUpdate" | "upsert" | "select" | "delete" | "insert", any>> } = {}) {
  const ops: Op[] = []
  const from = (table: string) => {
    const op: Op = { table, kind: "", filters: [] }
    const result = () => {
      if (op.kind === "select") return { data: cfg.existing ?? [], error: cfg.errors?.select ?? null }
      // La mise à jour de la page est confirmée par .select() (v405) : une ligne écrite,
      // sauf si le test dit que la RLS n'a rien laissé écrire.
      if (op.kind === "update") return { data: cfg.pageEcrite === false ? [] : [{ id: "page-1" }], error: cfg.errors?.pageUpdate ?? null }
      if (op.kind === "upsert") return { data: null, error: cfg.errors?.upsert ?? null }
      if (op.kind === "insert") return { data: null, error: cfg.errors?.insert ?? null }
      if (op.kind === "delete") return { data: null, error: cfg.errors?.delete ?? null }
      return { data: null, error: null }
    }
    const api: any = {
      update(p: any) { op.kind = "update"; op.payload = p; ops.push(op); return api },
      upsert(rows: any, o: any) { op.kind = "upsert"; op.payload = rows; op.onConflict = o; ops.push(op); return api },
      insert(rows: any) { op.kind = "insert"; op.payload = rows; ops.push(op); return api },
      select() { if (op.kind === "update") return api; op.kind = "select"; ops.push(op); return api },
      delete() { op.kind = "delete"; ops.push(op); return api },
      eq(k: any, v: any) { op.filters.push(["eq", k, v]); return api },
      in(k: any, v: any) { op.filters.push(["in", k, v]); return api },
      then(onF: any, onR: any) { return Promise.resolve(result()).then(onF, onR) },
    }
    return api
  }
  return { client: { from } as any, ops }
}

const snapAB: PageSnapshot = {
  liveId: "page-1", pageName: "Ma page", theme: { primary: "#C9A84C" },
  blocks: [
    { id: A, type: "text", content: { t: "a" }, visible: true },
    { id: B, type: "link", content: { url: "x" }, visible: true },
  ],
}

describe("blockToRow", () => {
  it("persiste draft/locked/visible dans content sous clés réservées", () => {
    const row = blockToRow({ id: A, type: "text", content: { t: "a" }, visible: false, draft: true, locked: true }, 3, "page-1")
    expect(row).toMatchObject({ id: A, page_id: "page-1", type: "text", position: 3, is_visible: false })
    expect(row.content).toMatchObject({ t: "a", __draft: true, __locked: true, __visible: false })
  })
})

describe("persistSnapshot — chemin moderne (UUID)", () => {
  it("met à jour le titre + le thème de la page", async () => {
    const { client, ops } = makeClient({ existing: [{ id: A }, { id: B }] })
    await persistSnapshot(client, snapAB)
    const pageOp = ops.find(o => o.table === "pages")!
    expect(pageOp.payload).toEqual({ title: "Ma page", theme: { primary: "#C9A84C" } })
  })

  it("upsert les blocs en CONSERVANT les UUID existants (onConflict id)", async () => {
    const { client, ops } = makeClient({ existing: [{ id: A }, { id: B }] })
    await persistSnapshot(client, snapAB)
    const up = ops.find(o => o.kind === "upsert")!
    expect(up.payload.map((r: any) => r.id)).toEqual([A, B])
    expect(up.onConflict).toEqual({ onConflict: "id" })
  })

  it("supprime uniquement les blocs orphelins, conserve ceux présents", async () => {
    const { client, ops } = makeClient({ existing: [{ id: A }, { id: B }, { id: ORPH }] })
    await persistSnapshot(client, snapAB)
    const del = ops.find(o => o.kind === "delete")!
    expect(del.filters).toContainEqual(["in", "id", [ORPH]])
  })

  it("ne supprime rien quand aucun bloc n'a été retiré", async () => {
    const { client, ops } = makeClient({ existing: [{ id: A }, { id: B }] })
    await persistSnapshot(client, snapAB)
    expect(ops.find(o => o.kind === "delete")).toBeUndefined()
  })

  it("snapshot vide + blocs existants → purge par page_id", async () => {
    const { client, ops } = makeClient({ existing: [{ id: A }] })
    await persistSnapshot(client, { ...snapAB, blocks: [] })
    const del = ops.find(o => o.kind === "delete")!
    expect(del.filters).toContainEqual(["in", "id", [A]])
  })
})

describe("persistSnapshot — propagation stricte des erreurs (aucun faux succès)", () => {
  it("échec de la mise à jour de page → rejette", async () => {
    const { client } = makeClient({ errors: { pageUpdate: { message: "rls" } } })
    await expect(persistSnapshot(client, snapAB)).rejects.toBeTruthy()
  })
  it("échec de l'upsert des blocs → rejette", async () => {
    const { client } = makeClient({ errors: { upsert: { message: "conflit" } } })
    await expect(persistSnapshot(client, snapAB)).rejects.toBeTruthy()
  })
  it("échec de la lecture des IDs → rejette", async () => {
    const { client } = makeClient({ errors: { select: { message: "timeout" } } })
    await expect(persistSnapshot(client, snapAB)).rejects.toBeTruthy()
  })
  it("échec de la suppression → rejette", async () => {
    const { client } = makeClient({ existing: [{ id: A }, { id: B }, { id: ORPH }], errors: { delete: { message: "fk" } } })
    await expect(persistSnapshot(client, snapAB)).rejects.toBeTruthy()
  })
})

describe("persistSnapshot — l'erreur lancée préserve code/status/stage (classification UI)", () => {
  it("upsert échoué → Error avec code + stage", async () => {
    const { client } = makeClient({ existing: [{ id: A }, { id: B }], errors: { upsert: { code: "42501", status: 403, message: "permission denied for table blocks" } } })
    await expect(persistSnapshot(client, snapAB)).rejects.toMatchObject({ code: "42501", status: 403, stage: "block_upsert" })
  })
  it("update page échouée → stage page_update", async () => {
    const { client } = makeClient({ errors: { pageUpdate: { code: "PGRST301", message: "JWT expired" } } })
    await expect(persistSnapshot(client, snapAB)).rejects.toMatchObject({ code: "PGRST301", stage: "page_update" })
  })
  it("page lisible mais pas modifiable (zéro ligne écrite) → refus, et AUCUN bloc écrit (v405)", async () => {
    const { client, ops } = makeClient({ existing: [{ id: A }, { id: B }], pageEcrite: false })
    const e = await persistSnapshot(client, snapAB).catch(x => x)
    expect(e).toMatchObject({ code: "42501", stage: "page_update" })
    const { classifyError, safeErrorMessage } = await import("./builderErrors")
    expect(classifyError(e).code).toBe("FORBIDDEN")
    expect(safeErrorMessage(e)).toBe("Vous n'avez plus accès à cette page.")
    expect(ops.filter(o => o.table === "blocks" && o.kind !== "select")).toEqual([])
  })
})

describe("persistSnapshot — chemin legacy (IDs non-UUID)", () => {
  it("delete-all + insert, sans upsert", async () => {
    const { client, ops } = makeClient()
    await persistSnapshot(client, { ...snapAB, blocks: [{ id: "1", type: "text", content: {}, visible: true }] })
    expect(ops.find(o => o.kind === "upsert")).toBeUndefined()
    expect(ops.find(o => o.kind === "delete")!.filters).toContainEqual(["eq", "page_id", "page-1"])
    expect(ops.find(o => o.kind === "insert")).toBeDefined()
  })
})

// Contrôle de version (16 novembre) : « Ma carte » écrit les mêmes blocs depuis
// le téléphone ; un éditeur resté ouvert ne doit ni les écraser ni les supprimer.
describe("persistSnapshot — contrôle de version", () => {
  const T0 = "2026-11-16T18:00:00.123456+00:00"
  const T1 = "2026-11-16T18:00:00.123457+00:00"   // une microseconde plus tard

  it("un bloc écrit ailleurs depuis le chargement : RIEN n'est écrit, erreur de conflit", async () => {
    const { client, ops } = makeClient({ existing: [{ id: A, updated_at: T0 } as any, { id: B, updated_at: T1 } as any] })
    const err: any = await persistSnapshot(client, snapAB, { repere: T0 }).catch(e => e)
    expect(err?.code).toBe("QROWG_CONFLIT")
    expect(ops.filter(o => o.kind !== "select")).toEqual([])          // ni update, ni upsert, ni delete
    const { safeErrorMessage } = await import("./builderErrors")
    expect(safeErrorMessage(err)).toMatch(/Rien n'a été écrasé/)
  })

  it("un bloc AJOUTÉ ailleurs (carte importée) compte aussi", async () => {
    const C = "33333333-3333-4333-8333-333333333333"
    const { client } = makeClient({ existing: [{ id: A, updated_at: T0 } as any, { id: C, updated_at: T1 } as any] })
    expect(((await persistSnapshot(client, snapAB, { repere: T0 }).catch(e => e)) as any)?.code).toBe("QROWG_CONFLIT")
  })

  it("rien n'a changé : on écrit, et le repère avance avec nos propres écritures", async () => {
    const { client, ops } = makeClient({ existing: [{ id: A, updated_at: T0 } as any, { id: B, updated_at: T0 } as any] })
    let repere: string | null = T0
    await persistSnapshot(client, snapAB, { repere, onRepere: r => { repere = r } })
    expect(ops.some(o => o.kind === "upsert")).toBe(true)
    expect(repere).toBe(T0)                                            // le mock renvoie les mêmes dates
  })

  it("sans repère (page neuve), pas de contrôle — comportement d'avant", async () => {
    const { client, ops } = makeClient({ existing: [{ id: A }, { id: B }] })
    await persistSnapshot(client, snapAB, { repere: null })
    expect(ops.some(o => o.kind === "upsert")).toBe(true)
  })
})

describe("horodatages : la microseconde départage", () => {
  it("microsDe, repereDe, modifieDepuis", async () => {
    const { microsDe, repereDe, modifieDepuis, REPERE_PAGE_VIDE } = await import("./savePage")
    expect(microsDe("2026-11-16T18:00:00.1+00:00")).toBe(microsDe("2026-11-16T18:00:00.100000+00:00"))
    expect(microsDe("2026-11-16T18:00:00.123457+00:00") - microsDe("2026-11-16T18:00:00.123456+00:00")).toBe(1)
    expect(repereDe([{ updated_at: "2026-11-16T18:00:00.5+00:00" }, { updated_at: "2026-11-16T18:00:01+00:00" }])).toBe("2026-11-16T18:00:01+00:00")
    // Page chargée vide : le premier bloc créé ailleurs est un conflit.
    expect(repereDe([])).toBe(REPERE_PAGE_VIDE)
    expect(modifieDepuis([{ updated_at: "2026-11-16T18:00:00+00:00" }], REPERE_PAGE_VIDE)).toBe(true)
    expect(modifieDepuis([{ updated_at: "2026-11-16T18:00:00+00:00" }], "2026-11-16T18:00:00+00:00")).toBe(false)
  })
})
