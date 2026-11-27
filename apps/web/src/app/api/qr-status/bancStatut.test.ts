import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Mettre en pause, réactiver, archiver, supprimer un QR de page — la VRAIE route,
// jouée contre une fausse base qui applique la RLS (v400) : on ne lit que son
// propre profil, les QR de son compte et ceux des équipes dont on est membre.
// Avant, pauseDesPages.test, bornes.test et leurs voisins lisaient le texte de
// la route. Ici on regarde ce qui change en base, et ce qui ne change pas.
//
// En le jouant (v400) : le quota de QR actifs était lu sur le compte de QUI
// CLIQUE. Un membre d'équipe qui rallumait le QR du propriétaire était compté
// sur son propre forfait et ses propres QR : le compte du propriétaire
// dépassait son plan sans limite. Le quota est désormais celui du propriétaire.

const banc = vi.hoisted(() => ({
  session: null as null | { id: string },
  base: {} as Record<string, Record<string, any>[]>,
  equipes: {} as Record<string, string[]>, // membre -> propriétaires dont il est membre
  echecs: [] as ((table: string, patch: Record<string, any>) => any)[],
}))

const UU = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`
const MOI = "u_moi", AUTRE = "u_autre", PROPRIO = "u_proprio"

// ── Fausse base ───────────────────────────────────────────────────────────────
function requete(table: string, rls: string | null) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "update" | "delete" = "select"
  let patch: Record<string, any> = {}, tete = false, retour = false
  const t = () => (banc.base[table] ??= [])
  // RLS : profil propre ; QR de son compte ou d'un propriétaire dont on est membre.
  const visible = (l: Record<string, any>) => {
    if (rls === null) return true
    if (table === "profiles") return l.id === rls
    return l.user_id === rls || (banc.equipes[rls] ?? []).includes(l.user_id)
  }
  const garde = (l: Record<string, any>) => visible(l) && filtres.every(f => f(l))
  const executer = (): { data: any; error: any; count?: number } => {
    if (op === "update") {
      for (const e of banc.echecs) { const err = e(table, patch); if (err) return { data: null, error: err } }
      const ls = t().filter(garde); ls.forEach(l => Object.assign(l, patch))
      return { data: retour ? ls.map(l => ({ ...l })) : null, error: null }
    }
    if (op === "delete") {
      const ls = t().filter(garde); banc.base[table] = t().filter(l => !ls.includes(l))
      return { data: retour ? ls.map(l => ({ ...l })) : null, error: null }
    }
    const ls = t().filter(garde)
    return tete ? { data: null, count: ls.length, error: null } : { data: ls.map(l => ({ ...l })), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(_c?: string, o?: { head?: boolean }) { if (op === "select") { if (o?.head) tete = true } else retour = true; return q },
    update(p: Record<string, any>) { op = "update"; patch = p; return q },
    delete() { op = "delete"; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    // .or("status.eq.active,status.is.null") — la seule forme qu'emploie lib/quota.
    or(expr: string) {
      const termes = expr.split(",").map(s => s.split("."))
      filtres.push(l => termes.some(([c, o, v]) => o === "eq" ? l[c] === v : o === "is" && v === "null" ? (l[c] ?? null) === null : false))
      return q
    },
    maybeSingle: une, single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: banc.session } }) },
    from: (t: string) => requete(t, banc.session?.id ?? "anon"),
  }),
  createAdminClient: () => ({ from: (t: string) => requete(t, null) }),
}))

import { POST, DELETE } from "./route"

const appel = (methode: "POST" | "DELETE", corps: unknown) => {
  const req = new NextRequest("https://qrowg.com/api/qr-status", {
    method: methode, headers: { "content-type": "application/json" },
    body: typeof corps === "string" ? corps : JSON.stringify(corps),
  })
  return methode === "POST" ? POST(req) : DELETE(req)
}
const qr = (n: number, user_id: string, status: string | null, extra: Record<string, any> = {}) =>
  ({ id: UU(n), user_id, status, pause_message: null, paused_reason: null, ...extra })
const ligne = (n: number) => banc.base.qr_codes.find(l => l.id === UU(n))

beforeEach(() => {
  banc.session = { id: MOI }
  banc.equipes = {}
  banc.echecs = []
  banc.base = {
    profiles: [{ id: MOI, plan: "free" }, { id: AUTRE, plan: "free" }, { id: PROPRIO, plan: "free" }],
    qr_codes: [],
  }
})

describe("qui peut toucher à un QR", () => {
  it("sans session : 401, rien ne bouge", async () => {
    banc.session = null
    banc.base.qr_codes = [qr(1, MOI, "active")]
    expect((await appel("POST", { qr_id: UU(1), action: "pause" })).status).toBe(401)
    expect((await appel("DELETE", { qr_id: UU(1) })).status).toBe(401)
    expect(ligne(1)!.status).toBe("active")
  })

  it("le QR d'un autre compte est introuvable, et reste tel quel", async () => {
    banc.base.qr_codes = [qr(1, AUTRE, "active"), qr(2, AUTRE, "archived")]
    for (const action of ["pause", "archive", "set_pause_message"]) {
      expect((await appel("POST", { qr_id: UU(1), action, pause_message: "fermé" })).status).toBe(404)
    }
    expect((await appel("DELETE", { qr_id: UU(2) })).status).toBe(404)
    expect(ligne(1)).toMatchObject({ status: "active", pause_message: null })
    expect(ligne(2)).toBeTruthy()
  })

  it("un corps invalide est un 400, jamais une exception", async () => {
    banc.base.qr_codes = [qr(1, MOI, "archived")]
    for (const c of ["{pas du json", { action: "pause" }, { qr_id: "abc", action: "pause" }, { qr_id: UU(1) }, { qr_id: UU(1), action: 42 }]) {
      expect((await appel("POST", c)).status).toBe(400)
    }
    for (const c of ["{pas du json", {}, { qr_id: 12 }, { qr_id: "abc" }]) {
      expect((await appel("DELETE", c)).status).toBe(400)
    }
    expect(ligne(1)).toBeTruthy()
  })
})

describe("pause et réactivation", () => {
  it("la pause est marquée « choisie » et garde son message, borné à 300 caractères", async () => {
    banc.base.qr_codes = [qr(1, MOI, "active")]
    const r = await appel("POST", { qr_id: UU(1), action: "pause", pause_message: "x".repeat(500) })
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, status: "paused" })
    expect(ligne(1)!.status).toBe("paused")
    expect(ligne(1)!.paused_reason).toBe("manual")
    expect(ligne(1)!.pause_message.length).toBe(300)
  })

  it("réactiver efface le motif de pause, même une pause imposée par le plan", async () => {
    banc.base.qr_codes = [qr(1, MOI, "paused", { paused_reason: "plan", pause_message: "à bientôt" })]
    const r = await appel("POST", { qr_id: UU(1), action: "activate" })
    expect(r.status).toBe(200)
    expect(ligne(1)).toMatchObject({ status: "active", paused_reason: null })
  })

  it("une transition interdite est refusée avec les gestes possibles", async () => {
    banc.base.qr_codes = [qr(1, MOI, "archived"), qr(2, MOI, "active")]
    const r = await appel("POST", { qr_id: UU(1), action: "activate" })
    expect(r.status).toBe(400)
    expect((await r.json()).allowed).toEqual(["restore"])
    expect((await appel("POST", { qr_id: UU(2), action: "activate" })).status).toBe(400)
    expect((await appel("POST", { qr_id: UU(2), action: "n_importe_quoi" })).status).toBe(400)
    expect(ligne(1)!.status).toBe("archived")
  })

  it("un statut vide compte comme actif (lignes d'avant la machine à états)", async () => {
    banc.base.qr_codes = [qr(1, MOI, null)]
    expect((await appel("POST", { qr_id: UU(1), action: "pause" })).status).toBe(200)
    expect(ligne(1)!.status).toBe("paused")
  })

  it("le message de pause se change sans toucher au statut", async () => {
    banc.base.qr_codes = [qr(1, MOI, "paused", { paused_reason: "manual" })]
    const r = await appel("POST", { qr_id: UU(1), action: "set_pause_message", pause_message: "Fermé pour travaux" })
    expect(r.status).toBe(200)
    expect(ligne(1)).toMatchObject({ status: "paused", paused_reason: "manual", pause_message: "Fermé pour travaux" })
  })

  it("une écriture qui échoue n'est jamais un faux succès", async () => {
    banc.base.qr_codes = [qr(1, MOI, "active")]
    banc.echecs = [() => ({ code: "XX000", message: "panne" })]
    const err = vi.spyOn(console, "error").mockImplementation(() => {})
    expect((await appel("POST", { qr_id: UU(1), action: "set_pause_message", pause_message: "fermé" })).status).toBe(500)
    expect((await appel("POST", { qr_id: UU(1), action: "pause" })).status).toBe(500)
    err.mockRestore()
    expect(ligne(1)).toMatchObject({ status: "active", pause_message: null })
  })

  it("base sans la colonne du motif : la pause marche quand même", async () => {
    banc.base.qr_codes = [qr(1, MOI, "active")]
    banc.echecs = [(_t, p) => "paused_reason" in p ? { code: "42703", message: 'column "paused_reason" does not exist' } : null]
    const r = await appel("POST", { qr_id: UU(1), action: "pause" })
    expect(r.status).toBe(200)
    expect(ligne(1)!.status).toBe("paused")
  })
})

describe("le quota de QR actifs", () => {
  it("au plafond, réactiver est refusé, et rien ne change", async () => {
    banc.base.qr_codes = [qr(1, MOI, "active"), qr(2, MOI, "paused"), qr(3, MOI, "draft"), qr(4, MOI, "archived")]
    for (const [n, action] of [[2, "activate"], [3, "activate"], [4, "restore"]] as const) {
      const r = await appel("POST", { qr_id: UU(n), action })
      expect(r.status).toBe(403)
      expect((await r.json()).error).toContain("Limite de 1 QR actif atteinte")
    }
    expect(banc.base.qr_codes.map(l => l.status)).toEqual(["active", "paused", "draft", "archived"])
  })

  it("un QR au statut vide occupe une place", async () => {
    banc.base.qr_codes = [qr(1, MOI, null), qr(2, MOI, "paused")]
    expect((await appel("POST", { qr_id: UU(2), action: "activate" })).status).toBe(403)
  })

  it("en pause, brouillon ou archivé, un QR ne prend pas de place ; ceux d'un autre compte non plus", async () => {
    banc.base.qr_codes = [qr(1, MOI, "paused"), qr(2, MOI, "draft"), qr(3, MOI, "archived"), qr(4, AUTRE, "active"), qr(5, AUTRE, "active")]
    expect((await appel("POST", { qr_id: UU(1), action: "activate" })).status).toBe(200)
    expect(ligne(1)!.status).toBe("active")
  })

  it("libérer une place permet d'en rallumer un autre", async () => {
    banc.base.qr_codes = [qr(1, MOI, "active"), qr(2, MOI, "paused")]
    expect((await appel("POST", { qr_id: UU(1), action: "pause" })).status).toBe(200)
    expect((await appel("POST", { qr_id: UU(2), action: "activate" })).status).toBe(200)
    expect(banc.base.qr_codes.map(l => l.status)).toEqual(["paused", "active"])
  })

  it("le plafond suit le forfait : 3 en Starter, aucun en Multi-sites", async () => {
    banc.base.profiles[0].plan = "starter"
    banc.base.qr_codes = [qr(1, MOI, "active"), qr(2, MOI, "active"), qr(3, MOI, "paused"), qr(4, MOI, "paused")]
    expect((await appel("POST", { qr_id: UU(3), action: "activate" })).status).toBe(200)
    expect((await appel("POST", { qr_id: UU(4), action: "activate" })).status).toBe(403)
    banc.base.profiles[0].plan = "business"
    expect((await appel("POST", { qr_id: UU(4), action: "activate" })).status).toBe(200)
  })

  it("la pause n'est jamais bloquée par le quota", async () => {
    banc.base.qr_codes = [qr(1, MOI, "active"), qr(2, MOI, "active"), qr(3, MOI, "active")]
    for (const n of [1, 2, 3]) expect((await appel("POST", { qr_id: UU(n), action: "pause" })).status).toBe(200)
  })
})

describe("en équipe : le quota est celui du propriétaire du QR", () => {
  beforeEach(() => { banc.equipes = { [MOI]: [PROPRIO] } })

  it("un membre ne rallume pas le QR du propriétaire au-delà de SON forfait", async () => {
    banc.base.profiles[0].plan = "business" // le membre a un grand forfait, le propriétaire non
    banc.base.qr_codes = [qr(1, PROPRIO, "active"), qr(2, PROPRIO, "paused")]
    const r = await appel("POST", { qr_id: UU(2), action: "activate" })
    expect(r.status).toBe(403)
    expect((await r.json()).error).toContain("Limite de 1 QR actif")
    expect(ligne(2)!.status).toBe("paused")
  })

  it("ni en comptant ses propres QR à la place de ceux du propriétaire", async () => {
    banc.base.qr_codes = [qr(1, PROPRIO, "active"), qr(2, PROPRIO, "paused")] // le membre : 0 actif
    expect((await appel("POST", { qr_id: UU(2), action: "activate" })).status).toBe(403)
  })

  it("et les QR du membre ne prennent pas la place de ceux du propriétaire", async () => {
    banc.base.qr_codes = [qr(1, MOI, "active"), qr(2, PROPRIO, "paused")] // le membre est à SON plafond
    expect((await appel("POST", { qr_id: UU(2), action: "activate" })).status).toBe(200)
    expect(ligne(2)!.status).toBe("active")
  })

  it("le membre met en pause et supprime un QR archivé du propriétaire", async () => {
    banc.base.qr_codes = [qr(1, PROPRIO, "active"), qr(2, PROPRIO, "archived")]
    expect((await appel("POST", { qr_id: UU(1), action: "pause" })).status).toBe(200)
    expect((await appel("DELETE", { qr_id: UU(2) })).status).toBe(200)
    expect(banc.base.qr_codes.map(l => l.id)).toEqual([UU(1)])
  })
})

describe("suppression définitive", () => {
  it("seulement après l'archivage", async () => {
    banc.base.qr_codes = [qr(1, MOI, "active"), qr(2, MOI, "paused"), qr(3, MOI, "archived")]
    expect((await appel("DELETE", { qr_id: UU(1) })).status).toBe(400)
    expect((await appel("DELETE", { qr_id: UU(2) })).status).toBe(400)
    const r = await appel("DELETE", { qr_id: UU(3) })
    expect(r.status).toBe(200)
    expect(banc.base.qr_codes.map(l => l.id)).toEqual([UU(1), UU(2)])
  })
})
