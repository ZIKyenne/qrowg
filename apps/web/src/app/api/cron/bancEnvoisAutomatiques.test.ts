import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Les e-mails qui partent SANS que le commerçant agisse — les VRAIES tâches
// planifiées : le rapport du lundi (`emails/weekly`), le rapport de l'abonnement
// (`reports/send`) et la vérification d'installation à J+3 (`cron/installation`).
// Leur vraie garde d'entrée et leur vrai journal, contre une fausse base qui fait
// ce que fait PostgREST : chaque réponse est COUPÉE à un plafond de lignes, quoi
// que demande `.limit()`, sans rien signaler (v413).
//
// En le jouant (v413) :
//  - au-delà du plafond, des commerçants sortaient du rapport du lundi en silence ;
//    et une lecture refusée se notait « rien — aucun destinataire » ;
//  - une page très scannée remplissait la réponse : sa voisine, scannée elle
//    aussi, recevait « votre QR n'a pas encore été scanné » ;
//  - sans profil lu, l'interrupteur des Réglages valait « activé » : le rapport
//    de l'abonnement partait chez qui l'avait coupé ;
//  - la date d'envoi n'était pas confirmée, et rien n'empêchait un double envoi
//    au rejeu : le rapport hebdomadaire pouvait repartir chaque jour.

const banc = vi.hoisted(() => {
  process.env.CRON_SECRET = "secret_banc"
  process.env.RESEND_API_KEY = "re_banc"
  return {
    base: {} as Record<string, Record<string, any>[]>,
    plafond: 3,
    lectureRefusee: new Set<string>(),
    ecritureMuette: new Set<string>(),
    envois: [] as { to: string; sujet: string; cle?: string; html: string }[],
    resendEnPanne: false,
  }
})

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (m: any, o?: { idempotencyKey?: string }) => {
        if (banc.resendEnPanne) return { data: null, error: { message: `refusé pour ${m.to}` } }
        banc.envois.push({ to: m.to, sujet: m.subject, cle: o?.idempotencyKey, html: m.html })
        return { data: { id: "e" }, error: null }
      },
    }
  },
}))
vi.mock("@/lib/appelQuiNAttendPas", () => ({
  fetchBorne: async (_url: string, init: any) => {
    if (banc.resendEnPanne) return new Response("panne d'envoi", { status: 500 })
    const m = JSON.parse(init.body)
    banc.envois.push({ to: m.to[0], sujet: m.subject, cle: init.headers["Idempotency-Key"], html: m.html })
    return new Response("{}", { status: 200 })
  },
}))

function requete(table: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  const tris: [string, boolean][] = []
  let op: "select" | "insert" | "update" | "delete" = "select", charge: any = null, retour = false, tete = false, colonnes = ""
  let de = 0, a = Infinity, limite = Infinity
  const t = () => (banc.base[table] ??= [])
  const joindre = (l: Record<string, any>) => {
    const o = { ...l }
    if (colonnes.includes("teams(")) o.teams = (banc.base.teams ?? []).find(x => x.id === l.team_id) ?? null
    return o
  }
  const executer = () => {
    if (op !== "insert" && banc.lectureRefusee.has(table)) return { data: null, error: { message: `lecture refusée : ${table}` } }
    if (op === "insert") { t().push({ ...charge }); return { data: null, error: null } }
    const ls = t().filter(l => filtres.every(f => f(l)))
    if (op === "update") {
      if (banc.ecritureMuette.has(table)) return { data: retour ? [] : null, error: null }
      ls.forEach(l => Object.assign(l, charge)); return { data: retour ? ls.map(l => ({ id: l.id })) : null, error: null }
    }
    if (op === "delete") { banc.base[table] = t().filter(l => !ls.includes(l)); return { data: null, error: null } }
    if (tete) return { data: null, count: ls.length, error: null }
    const tries = [...ls].sort((x, y) => { for (const [c, asc] of tris) { if (x[c] < y[c]) return asc ? -1 : 1; if (x[c] > y[c]) return asc ? 1 : -1 } return 0 })
    // PostgREST : la réponse s'arrête au plafond du projet, quoi qu'on demande.
    return { data: tries.slice(de, a + 1).slice(0, Math.min(limite, banc.plafond)).map(joindre), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(c = "", o?: { head?: boolean }) { colonnes = c; if (op !== "select") retour = true; if (o?.head) tete = true; return q },
    insert(p: any) { op = "insert"; charge = p; return q },
    update(p: any) { op = "update"; charge = p; return q },
    delete() { op = "delete"; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    in(c: string, v: unknown[]) { filtres.push(l => v.includes(l[c])); return q },
    gte(c: string, v: string) { filtres.push(l => l[c] >= v); return q },
    lt(c: string, v: string) { filtres.push(l => l[c] < v); return q },
    not(c: string, _op: string, _v: null) { filtres.push(l => l[c] !== null && l[c] !== undefined); return q },
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

import { GET as lundi } from "../emails/weekly/route"
import { GET as abonnes } from "../reports/send/route"
import { GET as installation } from "./installation/route"
import { semaineEcoulee } from "@/lib/weeklyReport"
import { jourDuCommerce } from "@/lib/jourDuCommerce"

const tache = (f: (r: NextRequest) => Promise<Response>, chemin: string, secret = "secret_banc") =>
  f(new NextRequest(`https://qrowg.com${chemin}`, { headers: { authorization: `Bearer ${secret}` } }))
const journal = () => banc.base.cron_runs ?? []
const dernier = () => journal()[journal().length - 1]
const aujourdhui = jourDuCommerce(new Date())

function commercants(n: number, extra: (i: number) => Record<string, any> = () => ({})) {
  for (let i = 0; i < n; i++) {
    const id = `u_${String(i).padStart(2, "0")}`
    banc.base.profiles.push({ id, email: `c${i}@exemple.fr`, full_name: `Commerçant ${i}`, total_scans: 0, preferences: {}, ...extra(i) })
    banc.base.pages.push({ id: `p_${String(i).padStart(2, "0")}`, user_id: id, title: `Page ${i}`, slug: `page-${i}`, status: "published" })
  }
}

beforeEach(() => {
  banc.base = { profiles: [], pages: [], team_members: [], teams: [], report_subscriptions: [], page_views: [], scans: [], block_clicks: [], cron_runs: [] }
  banc.plafond = 3
  banc.lectureRefusee = new Set()
  banc.ecritureMuette = new Set()
  banc.envois = []
  banc.resendEnPanne = false
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("le rapport du lundi", () => {
  it("refuse sans le secret de la tâche, et n'envoie rien", async () => {
    commercants(1)
    expect((await tache(lundi, "/api/emails/weekly", "faux")).status).toBe(401)
    expect(banc.envois).toHaveLength(0)
  })

  it("part chez CHAQUE commerçant qui a une page, au-delà du plafond de lignes de la base", async () => {
    commercants(8)
    const r = await tache(lundi, "/api/emails/weekly")
    expect((await r.json()).sent).toBe(8)
    expect(banc.envois.map(e => e.to).sort()).toEqual(Array.from({ length: 8 }, (_, i) => `c${i}@exemple.fr`).sort())
    expect(dernier()).toMatchObject({ tache: "emails/weekly", statut: "ok" })
    // Rien cette semaine : il le dit, sans chiffre gonflé.
    expect(banc.envois[0].sujet).toMatch(/^Semaine calme sur QRowg — /)
  })

  it("compte la SEMAINE : un scan de robot ou d'il y a dix jours n'entre pas", async () => {
    commercants(1)
    const maintenant = Date.now()
    banc.base.scans.push(
      { id: "s1", page_id: "p_00", scanned_at: new Date(maintenant - 3600000).toISOString(), device: "mobile" },
      { id: "s2", page_id: "p_00", scanned_at: new Date(maintenant - 7200000).toISOString(), device: "desktop" },
      { id: "s3", page_id: "p_00", scanned_at: new Date(maintenant - 10 * 86400000).toISOString(), device: "mobile" },
      { id: "s4", page_id: "p_00", scanned_at: new Date(maintenant - 3600000).toISOString(), device: "bot" },
    )
    await tache(lundi, "/api/emails/weekly")
    expect(banc.envois[0].sujet).toBe("2 scans cette semaine — QRowg")
  })

  it("un envoi refusé ne compte pas, et le journal le dit — sans l'adresse", async () => {
    commercants(2)
    banc.resendEnPanne = true
    const r = await (await tache(lundi, "/api/emails/weekly")).json()
    expect(r).toMatchObject({ sent: 0, success: false, echecs: 2 })
    expect(dernier()).toMatchObject({ statut: "erreur" })
    expect(dernier().detail).not.toContain("@")
  })

  it("un membre d'équipe le reçoit aussi, sur les pages de l'équipe", async () => {
    commercants(1)
    banc.base.profiles.push({ id: "u_membre", email: "membre@exemple.fr", full_name: null, preferences: {} })
    banc.base.teams.push({ id: "t_1", owner_id: "u_00" })
    banc.base.team_members.push({ team_id: "t_1", user_id: "u_membre" })
    banc.base.scans.push({ id: "s1", page_id: "p_00", scanned_at: new Date().toISOString(), device: "mobile" })
    await tache(lundi, "/api/emails/weekly")
    const membre = banc.envois.find(e => e.to === "membre@exemple.fr")
    expect(membre?.sujet).toBe("1 scan cette semaine — QRowg")
  })

  it("pas chez qui l'a coupé, ni chez l'abonné au rapport détaillé ; une clé par compte et par semaine", async () => {
    commercants(3, i => (i === 0 ? { preferences: { weekly_report: false } } : {}))
    banc.base.report_subscriptions.push({ id: "r1", user_id: "u_01", enabled: true, frequency: "weekly" })
    await tache(lundi, "/api/emails/weekly")
    expect(banc.envois.map(e => e.to)).toEqual(["c2@exemple.fr"])
    expect(banc.envois[0].cle).toBe(`rapport-hebdo/u_02/${semaineEcoulee(new Date()).debutIso.slice(0, 10)}`)
    expect(dernier().detail).toContain("1 rapport coupé dans les Réglages")
  })

  it("une lecture refusée est une ERREUR au journal, pas « aucun destinataire »", async () => {
    commercants(2)
    for (const table of ["profiles", "pages", "team_members"]) {
      banc.lectureRefusee = new Set([table]); banc.base.cron_runs = []
      const r = await tache(lundi, "/api/emails/weekly")
      expect(r.status).toBe(500)
      expect(dernier()).toMatchObject({ statut: "erreur" })
    }
    expect(banc.envois).toHaveLength(0)
  })
})

describe("le rapport de l'abonnement", () => {
  const abonner = (n: number) => {
    commercants(n)
    for (let i = 0; i < n; i++) banc.base.report_subscriptions.push({ id: `r_${i}`, user_id: `u_${String(i).padStart(2, "0")}`, email: `c${i}@exemple.fr`, frequency: "weekly", enabled: true, last_sent_at: null })
  }

  it("part chez chaque abonné dû, au-delà du plafond, et note la date d'envoi", async () => {
    abonner(5)
    const r = await (await tache(abonnes, "/api/reports/send")).json()
    expect(r.sent).toBe(5)
    expect(banc.base.report_subscriptions.every(s => s.last_sent_at)).toBe(true)
    // Rejoué le même jour : personne n'est dû.
    banc.envois = []
    await tache(abonnes, "/api/reports/send")
    expect(banc.envois).toHaveLength(0)
  })

  it("une clé d'envoi par abonnement et par jour : un rejeu ne double pas l'e-mail", async () => {
    abonner(1)
    await tache(abonnes, "/api/reports/send")
    expect(banc.envois[0].cle).toBe(`rapport-abonne/r_0/${aujourdhui}`)
  })

  it("profil illisible : on ne sait pas s'il l'a coupé, donc rien ne part", async () => {
    abonner(1)
    banc.base.profiles[0].preferences = { weekly_report: false }
    banc.lectureRefusee = new Set(["profiles"])
    await tache(abonnes, "/api/reports/send")
    expect(banc.envois).toHaveLength(0)
    expect(banc.base.report_subscriptions[0].last_sent_at).toBeNull()
    expect(dernier()).toMatchObject({ tache: "reports/send", statut: "erreur" })
  })

  it("profil lu et rapport coupé : rien ne part, et le journal le compte", async () => {
    abonner(1)
    banc.base.profiles[0].preferences = { weekly_report: false }
    await tache(abonnes, "/api/reports/send")
    expect(banc.envois).toHaveLength(0)
    expect(dernier().detail).toContain("1 rapport coupé dans les Réglages")
  })

  it("un abonné sans page reçoit quand même son rapport, et n'est plus re-tenté chaque jour", async () => {
    abonner(1)
    banc.base.pages = []
    await tache(abonnes, "/api/reports/send")
    expect(banc.envois.map(e => e.to)).toEqual(["c0@exemple.fr"])
    expect(banc.base.report_subscriptions[0].last_sent_at).toBeTruthy()
  })

  it("la date d'envoi non écrite se lit au journal", async () => {
    abonner(1)
    banc.ecritureMuette = new Set(["report_subscriptions"])
    const r = await (await tache(abonnes, "/api/reports/send")).json()
    expect(r.sent).toBe(1)
    expect(dernier()).toMatchObject({ statut: "erreur" })
    expect(dernier().detail).toContain("date d'envoi non enregistrée")
  })

  it("un envoi refusé ne marque pas l'abonnement comme servi", async () => {
    abonner(1)
    banc.resendEnPanne = true
    await tache(abonnes, "/api/reports/send")
    expect(banc.base.report_subscriptions[0].last_sent_at).toBeNull()
    expect(dernier()).toMatchObject({ statut: "erreur" })
  })

  it("les abonnements illisibles : erreur, pas « aucun abonnement actif »", async () => {
    abonner(1)
    banc.lectureRefusee = new Set(["report_subscriptions"])
    await tache(abonnes, "/api/reports/send")
    expect(dernier()).toMatchObject({ statut: "erreur" })
    expect(banc.envois).toHaveLength(0)
  })
})

describe("la vérification d'installation (J+3)", () => {
  // Publiée il y a trois jours civils, à midi UTC.
  const ilYATroisJours = () => { const d = new Date(); d.setUTCDate(d.getUTCDate() - 3); d.setUTCHours(12, 0, 0, 0); return d.toISOString() }
  const publier = (n: number) => {
    commercants(n)
    banc.base.pages.forEach(p => { p.published_at = ilYATroisJours(); p.created_at = p.published_at })
  }
  const scanner = (page: string, n: number, quand = Date.now()) => {
    for (let i = 0; i < n; i++) banc.base.scans.push({ id: `s_${page}_${i}`, page_id: page, device: "mobile", scanned_at: new Date(quand - i * 1000).toISOString() })
  }

  it("ne prévient que la page jamais scannée — même quand une voisine très scannée remplit la réponse", async () => {
    publier(3)
    scanner("p_00", 10)                              // remplit à elle seule le plafond
    scanner("p_01", 1, Date.now() - 2 * 86400000)    // scannée, plus anciennement
    await tache(installation, "/api/cron/installation")
    expect(banc.envois.map(e => e.to)).toEqual(["c2@exemple.fr"])
  })

  it("refuse sans le secret de la tâche", async () => {
    publier(1)
    expect((await tache(installation, "/api/cron/installation", "faux")).status).toBe(401)
    expect(banc.envois).toHaveLength(0)
  })

  it("un scan de robot ne compte pas comme une installation", async () => {
    publier(1)
    banc.base.scans.push({ id: "s_bot", page_id: "p_00", device: "bot", scanned_at: new Date().toISOString() })
    await tache(installation, "/api/cron/installation")
    expect(banc.envois.map(e => e.to)).toEqual(["c0@exemple.fr"])
  })

  it("sans les scans lus, personne n'est prévenu à tort", async () => {
    publier(2)
    banc.lectureRefusee = new Set(["scans"])
    await tache(installation, "/api/cron/installation")
    expect(banc.envois).toHaveLength(0)
    expect(dernier()).toMatchObject({ tache: "cron/installation", statut: "erreur" })
  })
})
