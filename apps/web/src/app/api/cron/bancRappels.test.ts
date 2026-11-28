import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Les trois RAPPELS qu'écrit le produit sans qu'on agisse — les VRAIES tâches :
// la relance du surlendemain (`cron/relance`), la fin d'essai (`cron/essai`) et
// l'échéance d'un QR modifiable (`cron/dynamic-expiry`). Leur vraie garde
// d'entrée et leur vrai journal, contre une fausse base qui coupe chaque réponse
// à un plafond de lignes, comme PostgREST, et un faux Resend (v414).
//
// En le jouant (v414) :
//  - une lecture des pages refusée laissait l'ensemble VIDE : la relance disait
//    « votre première page n'est pas encore là » à qui en avait, et la fin
//    d'essai ne prévenait plus personne avant la coupure, en notant « rien » ;
//  - au-delà de 500 comptes dans la fenêtre du jour, les suivants ne recevaient
//    jamais leur unique rappel ;
//  - un membre d'équipe recevait « votre première page n'est pas encore là » ;
//  - aucun des trois ne portait de clé anti-doublon : un passage rejoué doublait ;
//  - l'échéance : le palier notifié n'était pas confirmé (l'alerte repartait),
//    le repli « colonne absente » prenait toute erreur pour cette absence, et
//    l'objet parlait d'un QR « gratuit », reste d'un essai qui n'existe plus.

const banc = vi.hoisted(() => {
  process.env.CRON_SECRET = "secret_banc"
  process.env.RESEND_API_KEY = "re_banc"
  return {
    base: {} as Record<string, Record<string, any>[]>,
    plafond: 3,
    lectureRefusee: new Set<string>(),
    ecritureMuette: new Set<string>(),
    envois: [] as { to: string; sujet: string; cle?: string }[],
    resendEnPanne: false,
  }
})

vi.mock("@/lib/appelQuiNAttendPas", () => ({
  fetchBorne: async (_url: string, init: any) => {
    if (banc.resendEnPanne) return new Response("panne d'envoi", { status: 500 })
    const m = JSON.parse(init.body)
    banc.envois.push({ to: m.to[0], sujet: m.subject, cle: init.headers["Idempotency-Key"] })
    return new Response("{}", { status: 200 })
  },
}))

function requete(table: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  const tris: [string, boolean][] = []
  let op: "select" | "insert" | "update" | "delete" = "select", charge: any = null, retour = false
  let de = 0, a = Infinity, limite = Infinity
  const t = () => (banc.base[table] ??= [])
  const executer = () => {
    if (op !== "insert" && banc.lectureRefusee.has(table)) return { data: null, error: { message: `lecture refusée : ${table}` } }
    if (op === "insert") { t().push({ ...charge }); return { data: null, error: null } }
    const ls = t().filter(l => filtres.every(f => f(l)))
    if (op === "update") {
      if (banc.ecritureMuette.has(table)) return { data: retour ? [] : null, error: null }
      ls.forEach(l => Object.assign(l, charge)); return { data: retour ? ls.map(l => ({ id: l.id })) : null, error: null }
    }
    if (op === "delete") { banc.base[table] = t().filter(l => !ls.includes(l)); return { data: null, error: null } }
    const tries = [...ls].sort((x, y) => { for (const [c, asc] of tris) { if (x[c] < y[c]) return asc ? -1 : 1; if (x[c] > y[c]) return asc ? 1 : -1 } return 0 })
    // PostgREST : la réponse s'arrête au plafond du projet, quoi qu'on demande.
    return { data: tries.slice(de, a + 1).slice(0, Math.min(limite, banc.plafond)).map(l => ({ ...l })), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select() { if (op !== "select") retour = true; return q },
    insert(p: any) { op = "insert"; charge = p; return q },
    update(p: any) { op = "update"; charge = p; return q },
    delete() { op = "delete"; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    in(c: string, v: unknown[]) { filtres.push(l => v.includes(l[c])); return q },
    gte(c: string, v: string) { filtres.push(l => l[c] >= v); return q },
    gt(c: string, v: string) { filtres.push(l => l[c] > v); return q },
    lt(c: string, v: string) { filtres.push(l => l[c] < v); return q },
    lte(c: string, v: string) { filtres.push(l => l[c] <= v); return q },
    not(c: string) { filtres.push(l => l[c] !== null && l[c] !== undefined); return q },
    order(c: string, o?: { ascending?: boolean }) { tris.push([c, o?.ascending !== false]); return q },
    range(x: number, y: number) { de = x; a = y; return q },
    limit(n: number) { limite = n; return q },
    maybeSingle: une, single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({ from: (t: string) => requete(t) }),
  createServerSupabaseClient: async () => ({ from: (t: string) => requete(t) }),
}))

import { GET as relance } from "./relance/route"
import { GET as essai } from "./essai/route"
import { GET as echeance } from "./dynamic-expiry/route"

const tache = (f: (r: NextRequest) => Promise<Response>, chemin: string, secret = "secret_banc") =>
  f(new NextRequest(`https://qrowg.com${chemin}`, { headers: { authorization: `Bearer ${secret}` } }))
const journal = () => banc.base.cron_runs ?? []
const dernier = () => journal()[journal().length - 1]
const JOUR = 86_400_000
/** Midi UTC, il y a `n` jours civils : loin de toute borne de minuit. */
const ilYA = (n: number) => { const d = new Date(Date.now() - n * JOUR); d.setUTCHours(12, 0, 0, 0); return d.toISOString() }
const id = (i: number) => `u_${String(i).padStart(2, "0")}`

beforeEach(() => {
  banc.base = { profiles: [], pages: [], team_members: [], instant_qrs: [], cron_runs: [] }
  banc.plafond = 3
  banc.lectureRefusee = new Set()
  banc.ecritureMuette = new Set()
  banc.envois = []
  banc.resendEnPanne = false
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("la relance du surlendemain", () => {
  const inscrire = (n: number, quand = 2) => {
    for (let i = 0; i < n; i++) banc.base.profiles.push({ id: id(i), email: `c${i}@exemple.fr`, full_name: `Prénom${i} Nom`, created_at: ilYA(quand) })
  }

  it("refuse sans le secret de la tâche", async () => {
    inscrire(1)
    expect((await tache(relance, "/api/cron/relance", "faux")).status).toBe(401)
    expect(banc.envois).toHaveLength(0)
  })

  it("relance chaque inscrit du surlendemain sans page — au-delà du plafond de lignes", async () => {
    inscrire(7)
    inscrire(0)
    banc.base.profiles.push({ id: "u_hier", email: "hier@exemple.fr", full_name: null, created_at: ilYA(1) })
    banc.base.profiles.push({ id: "u_avant", email: "avant@exemple.fr", full_name: null, created_at: ilYA(3) })
    await tache(relance, "/api/cron/relance")
    expect(banc.envois.map(e => e.to).sort()).toEqual(Array.from({ length: 7 }, (_, i) => `c${i}@exemple.fr`).sort())
    expect(banc.envois[0].sujet).toBe("Votre page QRowg vous attend")
    expect(dernier()).toMatchObject({ tache: "cron/relance", statut: "ok" })
  })

  it("pas chez qui a déjà une page — même quand une autre remplit la réponse — ni chez un membre d'équipe", async () => {
    inscrire(4)
    for (let k = 0; k < 6; k++) banc.base.pages.push({ id: `p_a${k}`, user_id: id(0), status: "draft" })
    banc.base.pages.push({ id: "p_b", user_id: id(1), status: "draft" })
    banc.base.team_members.push({ team_id: "t", user_id: id(2) })
    await tache(relance, "/api/cron/relance")
    expect(banc.envois.map(e => e.to)).toEqual(["c3@exemple.fr"])
  })

  it("une clé par compte : un passage rejoué ne relance pas deux fois", async () => {
    inscrire(1)
    await tache(relance, "/api/cron/relance")
    expect(banc.envois[0].cle).toBe(`relance/${id(0)}`)
  })

  it("pages illisibles : personne n'est relancé à tort, et le journal le dit", async () => {
    inscrire(2)
    for (const table of ["pages", "team_members", "profiles"]) {
      banc.lectureRefusee = new Set([table])
      expect((await tache(relance, "/api/cron/relance")).status).toBe(500)
      expect(dernier()).toMatchObject({ statut: "erreur" })
    }
    expect(banc.envois).toHaveLength(0)
  })

  it("un envoi refusé se lit au journal", async () => {
    inscrire(1)
    banc.resendEnPanne = true
    await tache(relance, "/api/cron/relance")
    expect(dernier()).toMatchObject({ statut: "erreur" })
  })
})

describe("la fin d'essai", () => {
  // Jalon 7 : la pause tombe dans sept jours civils ; jalon 1 : demain.
  const enEssai = (n: number, jalon: 7 | 1 = 7, extra: (i: number) => Record<string, any> = () => ({})) => {
    for (let i = 0; i < n; i++) {
      banc.base.profiles.push({ id: id(i), email: `c${i}@exemple.fr`, full_name: null, plan: "free", free_published_since: ilYA(30 - jalon), ...extra(i) })
      banc.base.pages.push({ id: `p_${i}`, user_id: id(i), status: "published" })
    }
  }

  it("prévient chaque compte au jalon, au-delà du plafond, avec le bon message", async () => {
    enEssai(5)
    await tache(essai, "/api/cron/essai")
    expect(banc.envois).toHaveLength(5)
    expect(new Set(banc.envois.map(e => e.sujet))).toEqual(new Set(["Il vous reste une semaine d'essai QRowg"]))
  })

  it("demain : le dernier rappel ; une clé par compte et par jalon", async () => {
    enEssai(1, 1)
    await tache(essai, "/api/cron/essai")
    expect(banc.envois[0]).toMatchObject({ sujet: "Demain, vos clients ne verront plus votre page", cle: `essai/${id(0)}/1` })
  })

  it("pas un compte payant, ni un compte dont rien n'est en ligne", async () => {
    enEssai(3, 7, i => (i === 0 ? { plan: "pro" } : {}))
    banc.base.pages.find(p => p.user_id === id(1))!.status = "draft"
    for (let k = 0; k < 6; k++) banc.base.pages.push({ id: `p_x${k}`, user_id: id(0), status: "published" })
    await tache(essai, "/api/cron/essai")
    expect(banc.envois.map(e => e.to)).toEqual(["c2@exemple.fr"])
  })

  it("pages illisibles : une ERREUR au journal, pas « rien » — la coupure arriverait sans prévenir", async () => {
    enEssai(2)
    banc.lectureRefusee = new Set(["pages"])
    expect((await tache(essai, "/api/cron/essai")).status).toBe(500)
    expect(dernier()).toMatchObject({ tache: "cron/essai", statut: "erreur" })
    expect(banc.envois).toHaveLength(0)
  })
})

describe("l'échéance d'un QR modifiable", () => {
  const qr = (i: number, joursRestants: number, extra: Record<string, any> = {}) => banc.base.instant_qrs.push({
    id: `q_${String(i).padStart(2, "0")}`, user_id: id(i), label: `QR ${i}`, dynamic: true, status: "active",
    expires_at: new Date(Date.now() + (joursRestants - 0.5) * JOUR).toISOString(), expiry_alert_stage: null, ...extra,
  })
  const proprietaires = (n: number) => { for (let i = 0; i < n; i++) banc.base.profiles.push({ id: id(i), email: `c${i}@exemple.fr`, full_name: null }) }

  it("prévient chaque propriétaire à trois jours et la veille — au-delà du plafond — et note le palier", async () => {
    proprietaires(5)
    for (let i = 0; i < 4; i++) qr(i, 3)
    qr(4, 1)
    await tache(echeance, "/api/cron/dynamic-expiry")
    expect(banc.envois).toHaveLength(5)
    expect(banc.envois.find(e => e.to === "c4@exemple.fr")?.sujet).toBe("⏳ Votre QR modifiable expire demain — QRowg")
    expect(banc.envois.find(e => e.to === "c0@exemple.fr")?.sujet).toBe("⏳ Votre QR modifiable expire dans 3 jours — QRowg")
    expect(banc.envois.every(e => !/gratuit/i.test(e.sujet))).toBe(true)
    expect(banc.base.instant_qrs.map(q => q.expiry_alert_stage)).toEqual(["d3", "d3", "d3", "d3", "d1"])
    // Rejoué : le palier est noté, personne n'est réalerté.
    banc.envois = []
    await tache(echeance, "/api/cron/dynamic-expiry")
    expect(banc.envois).toHaveLength(0)
  })

  it("une clé par QR et par palier", async () => {
    proprietaires(1); qr(0, 3)
    await tache(echeance, "/api/cron/dynamic-expiry")
    expect(banc.envois[0].cle).toBe("expiration/q_00/d3")
  })

  it("pas un QR en pause, statique, ou hors palier", async () => {
    proprietaires(3)
    qr(0, 3, { status: "paused" }); qr(1, 3, { dynamic: false }); qr(2, 2)
    await tache(echeance, "/api/cron/dynamic-expiry")
    expect(banc.envois).toHaveLength(0)
  })

  it("le palier non écrit se lit au journal", async () => {
    proprietaires(1); qr(0, 3)
    banc.ecritureMuette = new Set(["instant_qrs"])
    await tache(echeance, "/api/cron/dynamic-expiry")
    expect(banc.envois).toHaveLength(1)
    expect(dernier()).toMatchObject({ statut: "erreur" })
    expect(dernier().detail).toContain("palier non enregistré")
  })

  it("QR illisibles : une erreur, pas un réenvoi sans dédup ni un « rien »", async () => {
    proprietaires(1); qr(0, 3, { expiry_alert_stage: "d3" })
    banc.lectureRefusee = new Set(["instant_qrs"])
    expect((await tache(echeance, "/api/cron/dynamic-expiry")).status).toBe(500)
    expect(dernier()).toMatchObject({ statut: "erreur" })
    expect(banc.envois).toHaveLength(0)
  })

  it("profil illisible : rien ne part, le palier reste à notifier, et ce n'est pas « sans adresse »", async () => {
    proprietaires(1); qr(0, 3)
    banc.lectureRefusee = new Set(["profiles"])
    await tache(echeance, "/api/cron/dynamic-expiry")
    expect(banc.envois).toHaveLength(0)
    expect(banc.base.instant_qrs[0].expiry_alert_stage).toBeNull()
    expect(dernier().detail).toContain("profil illisible")
    expect(dernier().detail).not.toContain("sans adresse")
  })
})
