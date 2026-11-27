import { describe, it, expect } from "vitest"
import { createPublishController, computePublishedAt, SAVE_FAIL_MSG, PUBLISH_FAIL_MSG } from "./publish"

const tick = () => new Promise<void>(r => setTimeout(r, 0))

// ── computePublishedAt : sémantique de la date de publication ────────────────
describe("computePublishedAt", () => {
  it("première publication → maintenant", () => {
    expect(computePublishedAt(null, "2026-08-03T10:00:00Z")).toBe("2026-08-03T10:00:00Z")
    expect(computePublishedAt(undefined, "2026-08-03T10:00:00Z")).toBe("2026-08-03T10:00:00Z")
    expect(computePublishedAt("", "2026-08-03T10:00:00Z")).toBe("2026-08-03T10:00:00Z")
  })
  it("republication → conserve la date de 1re publication (SEO/analytics)", () => {
    expect(computePublishedAt("2026-01-01T00:00:00Z", "2026-08-03T10:00:00Z")).toBe("2026-01-01T00:00:00Z")
  })
})

// ── persistPublishedStatus : JOUÉ depuis v403 par bancPublication.test.ts, à
// travers la vraie action serveur et une base qui sait refuser d'écrire.

// ── createPublishController : orchestration flush → mutation ─────────────────
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

describe("createPublishController", () => {
  it("Test 1 — la mutation n'est appelée qu'APRÈS un flush positif", async () => {
    const order: string[] = []
    const flushD = deferred<boolean>()
    const ctrl = createPublishController({
      flush: () => { order.push("flush"); return flushD.promise },
      publish: async () => { order.push("publish"); return { ok: true, publishedAt: "t" } },
    })
    const p = ctrl.publishLatest()
    await tick()
    expect(order).toEqual(["flush"])       // publish pas encore appelé
    flushD.resolve(true); await p
    expect(order).toEqual(["flush", "publish"])
  })

  it("Test 2 — flush échoué : aucune mutation, erreur d'étape save, pas de faux succès", async () => {
    let published = false
    const seen: string[] = []
    const ctrl = createPublishController({
      flush: async () => false,
      publish: async () => { published = true; return { ok: true, publishedAt: "t" } },
      onChange: s => seen.push(s.phase),
    })
    const res = await ctrl.publishLatest()
    expect(published).toBe(false)
    expect(res).toEqual({ ok: false, stage: "save", message: SAVE_FAIL_MSG })
    expect(seen).toContain("error")
    expect(seen).not.toContain("published")
  })

  it("Test 3 — publication réussie : état publié + publishing repasse à false", async () => {
    const seen: string[] = []
    const ctrl = createPublishController({
      flush: async () => true,
      publish: async () => ({ ok: true, publishedAt: "2026-08-03T10:00:00Z", alreadyPublished: false }),
      onChange: s => seen.push(s.phase),
    })
    const res = await ctrl.publishLatest()
    expect(res).toEqual({ ok: true, publishedAt: "2026-08-03T10:00:00Z", alreadyPublished: false })
    expect(seen).toEqual(["publishing", "published"])
    expect(ctrl.isPublishing()).toBe(false)
  })

  it("Test 4 — mutation échouée : erreur d'étape publish, contenu déjà sauvegardé", async () => {
    const ctrl = createPublishController({
      flush: async () => true,
      publish: async () => ({ ok: false, message: "boom" }),
    })
    const res = await ctrl.publishLatest()
    expect(res).toEqual({ ok: false, stage: "publish", message: "boom" })
  })

  it("mutation échouée sans message → message par défaut de publication", async () => {
    const ctrl = createPublishController({ flush: async () => true, publish: async () => ({ ok: false, message: "" }) })
    const res = await ctrl.publishLatest()
    expect(res).toMatchObject({ ok: false, stage: "publish", message: PUBLISH_FAIL_MSG })
  })

  it("Test 5 — double clic : une seule mutation, un seul succès", async () => {
    let publishCount = 0
    const flushD = deferred<boolean>()
    const ctrl = createPublishController({
      flush: () => flushD.promise,
      publish: async () => { publishCount++; return { ok: true, publishedAt: "t" } },
    })
    const p1 = ctrl.publishLatest()
    const p2 = ctrl.publishLatest()   // 2e clic pendant que le 1er tourne
    flushD.resolve(true)
    const [r1, r2] = await Promise.all([p1, p2])
    expect(publishCount).toBe(1)       // une seule mutation
    expect([r1.ok, r2.ok].filter(Boolean).length).toBe(1) // un seul succès
  })

  it("Test 6 — modification pendant le flush : la mutation suit le dernier flush", async () => {
    // flush() (saveController) attend déjà le dernier snapshot ; on vérifie l'ordre.
    const order: string[] = []
    const flushD = deferred<boolean>()
    const ctrl = createPublishController({
      flush: () => { order.push("flush-start"); return flushD.promise },
      publish: async () => { order.push("publish"); return { ok: true, publishedAt: "t" } },
    })
    const p = ctrl.publishLatest()
    await tick()
    order.push("edit-pendant-flush")     // l'utilisateur modifie encore
    flushD.resolve(true); await p
    expect(order).toEqual(["flush-start", "edit-pendant-flush", "publish"])
  })

  it("Test 9 — après erreur, une nouvelle tentative peut réussir (rien de bloqué)", async () => {
    let ok = false
    const ctrl = createPublishController({
      flush: async () => ok,           // échoue d'abord, réussit ensuite
      publish: async () => ({ ok: true, publishedAt: "t" }),
    })
    const r1 = await ctrl.publishLatest()
    expect(r1.ok).toBe(false)
    expect(ctrl.isPublishing()).toBe(false)  // garde libérée
    ok = true
    const r2 = await ctrl.publishLatest()
    expect(r2.ok).toBe(true)
  })

  it("Test 11 — publish (qui revalide en interne) jamais appelé si le flush échoue", async () => {
    let publishCalled = false
    const ctrl = createPublishController({
      flush: async () => false,
      publish: async () => { publishCalled = true; return { ok: true, publishedAt: "t" } },
    })
    await ctrl.publishLatest()
    expect(publishCalled).toBe(false)
  })

  it("Test 12 — transitions de phase idle → publishing → published", async () => {
    const seen: string[] = []
    const ctrl = createPublishController({
      flush: async () => true,
      publish: async () => ({ ok: true, publishedAt: "t" }),
      onChange: s => seen.push(s.phase),
    })
    await ctrl.publishLatest()
    expect(seen).toEqual(["publishing", "published"])
  })
})
