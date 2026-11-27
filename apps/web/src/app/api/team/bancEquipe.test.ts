import { describe, it, expect, vi, beforeEach } from "vitest"

// L'équipe — les VRAIES routes (inviter, accepter, changer un rôle, retirer,
// quitter), jouées contre une fausse base (v398). Avant, invitationsEquipe.test
// et ses voisins testaient les règles pures ou lisaient le texte des routes. Ici
// on regarde QUI entre, avec QUEL rôle, et qui ne peut rien faire.
//
// En le jouant (v398) : l'acceptation comparait l'invitation à `profiles.email`,
// une colonne que l'utilisateur réécrit lui-même depuis le navigateur (la RLS
// ne verrouille que `plan` et `stripe_customer_id`). Un lien d'invitation
// transféré suffisait : réécrire son profil avec l'adresse invitée, puis
// accepter — et entrer comme administrateur. La comparaison se fait désormais
// sur l'e-mail du compte de connexion.

const banc = vi.hoisted(() => ({
  session: null as null | { id: string; email: string },
  base: {} as Record<string, Record<string, any>[]>,
}))

// ── Fausse base : ce que les routes demandent à PostgREST ─────────────────────
let seq = 0
function requete(table: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "update" | "delete" | "upsert" | "insert" = "select"
  let patch: Record<string, any> = {}, conflit: string[] = ["id"], tete = false, colonnes = "*", lim = Infinity
  const t = () => (banc.base[table] ??= [])
  const garde = (l: Record<string, any>) => filtres.every(f => f(l))
  const embarquer = (l: Record<string, any>) => {
    const r: Record<string, any> = { ...l }
    if (colonnes.includes("teams(")) r.teams = (banc.base.teams ?? []).find(x => x.id === l.team_id) ?? null
    if (colonnes.includes("profiles(")) r.profiles = (banc.base.profiles ?? []).find(x => x.id === l.user_id) ?? null
    return r
  }
  const executer = (): { data: any; error: any; count?: number } => {
    if (op === "update") { t().filter(garde).forEach(l => Object.assign(l, patch)); return { data: null, error: null } }
    if (op === "delete") { banc.base[table] = t().filter(l => !garde(l)); return { data: null, error: null } }
    if (op === "insert") { const l = { id: `${table}_${++seq}`, ...patch }; t().push(l); return { data: [l], error: null } }
    if (op === "upsert") {
      const ex = t().find(l => conflit.every(c => l[c] === patch[c]))
      if (ex) Object.assign(ex, patch); else t().push({ id: `${table}_${++seq}`, ...patch })
      return { data: null, error: null }
    }
    const ls = t().filter(garde).slice(0, lim)
    return tete ? { data: null, count: ls.length, error: null } : { data: ls.map(embarquer), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select(c?: string, o?: { head?: boolean }) { if (op === "select") { colonnes = c ?? "*"; if (o?.head) tete = true } return q },
    update(p: Record<string, any>) { op = "update"; patch = p; return q },
    delete() { op = "delete"; return q },
    insert(p: Record<string, any>) { op = "insert"; patch = p; return q },
    upsert(p: Record<string, any>, o?: { onConflict?: string }) { op = "upsert"; patch = p; conflit = (o?.onConflict ?? "id").split(","); return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    is(c: string, v: unknown) { filtres.push(l => (l[c] ?? null) === v); return q },
    order() { return q },
    limit(n: number) { lim = n; return q },
    maybeSingle: une, single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: banc.session } }) } }),
  createAdminClient: () => ({ from: (t: string) => requete(t) }),
}))
vi.mock("@/lib/rateLimit", () => ({ rateLimit: async () => true }))

// ── Les personnes ─────────────────────────────────────────────────────────────
const PATRON = { id: "u_patron", email: "patron@comptoir.fr" }
const ADMIN = { id: "u_admin", email: "admin@comptoir.fr" }
const EDITEUR = { id: "u_editeur", email: "editeur@comptoir.fr" }
const INVITEE = { id: "u_invitee", email: "serveuse@comptoir.fr" }
const INTRUS = { id: "u_intrus", email: "intrus@ailleurs.fr" }
const dans = (j: number) => new Date(Date.now() + j * 86400_000).toISOString()

beforeEach(() => {
  banc.session = null
  banc.base = {
    profiles: [PATRON, ADMIN, EDITEUR, INVITEE, INTRUS].map(p => ({ ...p, full_name: null, plan: p === PATRON ? "business" : "free" })),
    teams: [{ id: "t1", owner_id: PATRON.id, name: "Le Comptoir", slug: "le-comptoir" }],
    team_members: [
      { id: "m_admin", team_id: "t1", user_id: ADMIN.id, role: "admin", joined_at: "1" },
      { id: "m_editeur", team_id: "t1", user_id: EDITEUR.id, role: "editor", joined_at: "2" },
    ],
    team_invitations: [
      { id: "i1", team_id: "t1", email: INVITEE.email, role: "admin", token: "jeton-serveuse", accepted_at: null, expires_at: dans(5), created_at: dans(-2) },
    ],
  }
})

async function appeler(route: "team" | "accept" | "member", methode: "POST" | "PATCH" | "DELETE", qui: { id: string; email: string } | null, corps: unknown) {
  banc.session = qui
  const mod: any = route === "team" ? await import("./route") : route === "accept" ? await import("./accept/route") : await import("./member/route")
  const { NextRequest } = await import("next/server")
  const res = await mod[methode](new NextRequest("http://banc.invalid/api/team", { method: methode, body: JSON.stringify(corps) }))
  return { statut: res.status as number, corps: await res.json() }
}
const membres = () => (banc.base.team_members ?? []).map(m => `${m.user_id}:${m.role}`).sort()
const AVANT = ["u_admin:admin", "u_editeur:editor"]

describe("accepter une invitation", () => {
  it("la bonne personne, avec le bon lien : elle entre, au rôle de l'invitation, une seule fois", async () => {
    expect(await appeler("accept", "POST", INVITEE, { token: "jeton-serveuse" })).toEqual({ statut: 200, corps: { ok: true, teamId: "t1" } })
    expect(membres()).toEqual([...AVANT, "u_invitee:admin"].sort())
    expect(banc.base.team_invitations[0].accepted_at).not.toBeNull()
    expect((await appeler("accept", "POST", INVITEE, { token: "jeton-serveuse" })).statut, "le lien ne sert qu'une fois").toBe(410)
  })

  it("le lien transféré à quelqu'un d'autre : refusé", async () => {
    const r = await appeler("accept", "POST", INTRUS, { token: "jeton-serveuse" })
    expect(r.statut).toBe(403)
    expect(membres()).toEqual(AVANT)
  })

  it("…même s'il a réécrit son profil avec l'adresse invitée (défaut v398)", async () => {
    // Ce que la RLS laisse faire depuis le navigateur : update profiles set email = … where id = moi.
    banc.base.profiles.find(p => p.id === INTRUS.id)!.email = INVITEE.email
    const r = await appeler("accept", "POST", INTRUS, { token: "jeton-serveuse" })
    expect(r.statut, "l'adresse du profil n'est pas une preuve").toBe(403)
    expect(membres()).toEqual(AVANT)
    expect(banc.base.team_invitations[0].accepted_at, "le lien reste à sa destinataire").toBeNull()
  })

  it("l'adresse se compare sans la casse", async () => {
    expect((await appeler("accept", "POST", { ...INVITEE, email: "Serveuse@Comptoir.FR" }, { token: "jeton-serveuse" })).statut).toBe(200)
  })

  it("sans session, sans jeton, ou avec un faux jeton : rien", async () => {
    expect((await appeler("accept", "POST", null, { token: "jeton-serveuse" })).statut).toBe(401)
    expect((await appeler("accept", "POST", INVITEE, {})).statut).toBe(400)
    expect((await appeler("accept", "POST", INVITEE, { token: "jeton-invente" })).statut).toBe(404)
    expect(membres()).toEqual(AVANT)
  })

  it("expirée : refusée", async () => {
    banc.base.team_invitations[0].expires_at = dans(-1)
    expect((await appeler("accept", "POST", INVITEE, { token: "jeton-serveuse" })).statut).toBe(410)
    expect(membres()).toEqual(AVANT)
  })

  it("sans date d'expiration, la règle des 7 jours s'applique depuis la création", async () => {
    Object.assign(banc.base.team_invitations[0], { expires_at: null, created_at: dans(-8) })
    expect((await appeler("accept", "POST", INVITEE, { token: "jeton-serveuse" })).statut, "créée il y a 8 jours").toBe(410)
    banc.base.team_invitations[0].created_at = dans(-6)
    expect((await appeler("accept", "POST", INVITEE, { token: "jeton-serveuse" })).statut, "créée il y a 6 jours").toBe(200)
  })

  it("le patron est repassé en gratuit depuis l'envoi : le lien ne donne plus d'accès payant", async () => {
    banc.base.profiles.find(p => p.id === PATRON.id)!.plan = "free"
    // Le motif compte : sans plan, la limite de sièges tombe aussi à 0, et ce
    // refus-là masquait un plan jamais revérifié (vu par mutation, v398).
    expect(await appeler("accept", "POST", INVITEE, { token: "jeton-serveuse" }))
      .toEqual({ statut: 403, corps: { error: "La fonction Équipe n'est plus active sur ce compte." } })
    expect(membres()).toEqual(AVANT)
  })

  it("une invitation d'éditeur fait entrer un éditeur, pas plus", async () => {
    banc.base.team_invitations[0].role = "editor"
    expect((await appeler("accept", "POST", INVITEE, { token: "jeton-serveuse" })).statut).toBe(200)
    expect(membres()).toEqual([...AVANT, "u_invitee:editor"].sort())
  })

  it("l'équipe est complète : refusée", async () => {
    for (let i = 0; i < 3; i++) banc.base.team_members.push({ id: `m${i}`, team_id: "t1", user_id: `u${i}`, role: "editor", joined_at: "3" })
    expect((await appeler("accept", "POST", INVITEE, { token: "jeton-serveuse" })).statut).toBe(403)
    expect(banc.base.team_members.some(m => m.user_id === INVITEE.id)).toBe(false)
  })
})

describe("inviter", () => {
  it("le patron et l'admin invitent ; l'éditeur et un inconnu non", async () => {
    // L'éditeur d'abord, équipe loin d'être pleine : refusé pour son RÔLE, pas
    // faute de siège (en dernier, l'équipe complète masquait l'autorisation —
    // vu par mutation, v398).
    expect(await appeler("team", "POST", EDITEUR, { email: "c@comptoir.fr", role: "editor" })).toEqual({ statut: 403, corps: { error: "Réservé au propriétaire / admin." } })
    expect((await appeler("team", "POST", null, { email: "d@comptoir.fr" })).statut).toBe(401)
    expect((await appeler("team", "POST", PATRON, { email: "a@comptoir.fr", role: "editor" })).statut).toBe(200)
    expect((await appeler("team", "POST", ADMIN, { email: "b@comptoir.fr", role: "admin" })).statut).toBe(200)
    expect(banc.base.team_invitations.map(i => `${i.email}:${i.role}`).sort()).toEqual(["a@comptoir.fr:editor", "b@comptoir.fr:admin", "serveuse@comptoir.fr:admin"])
  })

  it("personne n'invite un propriétaire (ni un rôle inventé)", async () => {
    for (const role of ["owner", "viewer", "superadmin"]) {
      expect((await appeler("team", "POST", PATRON, { email: "x@comptoir.fr", role })).statut, role).toBe(400)
    }
    expect(banc.base.team_invitations).toHaveLength(1)
  })

  it("le lien envoyé est neuf et unique, et une ré-invitation le remplace", async () => {
    await appeler("team", "POST", PATRON, { email: "a@comptoir.fr", role: "editor" })
    const premier = banc.base.team_invitations.find(i => i.email === "a@comptoir.fr")!.token
    await appeler("team", "POST", PATRON, { email: "A@Comptoir.fr", role: "editor" })
    const lignes = banc.base.team_invitations.filter(i => i.email === "a@comptoir.fr")
    expect(lignes, "une seule invitation par adresse").toHaveLength(1)
    expect(lignes[0].token).not.toBe(premier)
    expect(lignes[0].token).toMatch(/^[0-9a-f-]{36}$/)
  })

  it("le lien vit 7 jours, la durée du produit", async () => {
    const avant = Date.now()
    await appeler("team", "POST", PATRON, { email: "a@comptoir.fr" })
    const exp = new Date(banc.base.team_invitations.find(i => i.email === "a@comptoir.fr")!.expires_at).getTime()
    expect(exp - avant).toBeGreaterThanOrEqual(7 * 86400_000 - 1000)
    expect(exp - avant).toBeLessThanOrEqual(7 * 86400_000 + 5000)
  })

  it("les sièges : les liens expirés ne prennent la place de personne, les vivants si", async () => {
    // 5 sièges en Business : 2 membres + 1 invitation vivante (beforeEach).
    banc.base.team_invitations.push(
      ...[1, 2, 3].map(i => ({ id: `morte${i}`, team_id: "t1", email: `m${i}@comptoir.fr`, role: "editor", token: `t${i}`, accepted_at: null, expires_at: dans(-i), created_at: dans(-10) })),
    )
    expect((await appeler("team", "POST", PATRON, { email: "a@comptoir.fr" })).statut, "4e siège, malgré 3 liens morts").toBe(200)
    expect((await appeler("team", "POST", PATRON, { email: "b@comptoir.fr" })).statut, "5e siège").toBe(200)
    const plein = await appeler("team", "POST", PATRON, { email: "c@comptoir.fr" })
    expect(plein.statut, "complet").toBe(403)
  })

  it("sans le plan Équipe : refusé", async () => {
    banc.base.profiles.find(p => p.id === PATRON.id)!.plan = "pro"
    expect((await appeler("team", "POST", PATRON, { email: "a@comptoir.fr" })).statut).toBe(403)
    expect(banc.base.team_invitations).toHaveLength(1)
  })
})

describe("rôles et départs", () => {
  it("l'admin change un rôle dans SON équipe ; jamais vers « propriétaire »", async () => {
    expect((await appeler("member", "PATCH", ADMIN, { memberId: "m_editeur", role: "admin" })).statut).toBe(200)
    expect((await appeler("member", "PATCH", ADMIN, { memberId: "m_editeur", role: "owner" })).statut).toBe(400)
    expect(membres()).toEqual(["u_admin:admin", "u_editeur:admin"])
  })

  it("l'éditeur ne se promeut pas, et ne retire personne", async () => {
    expect((await appeler("member", "PATCH", EDITEUR, { memberId: "m_editeur", role: "admin" })).statut).toBe(403)
    expect((await appeler("member", "DELETE", EDITEUR, { memberId: "m_admin" })).statut).toBe(403)
    expect((await appeler("member", "DELETE", EDITEUR, { invitationId: "i1" })).statut).toBe(403)
    expect(membres()).toEqual(AVANT)
    expect(banc.base.team_invitations).toHaveLength(1)
  })

  it("un admin d'une AUTRE équipe ne touche pas à celle-ci", async () => {
    const AUTRE = { id: "u_autre", email: "autre@bistrot.fr" }
    banc.base.profiles.push({ ...AUTRE, full_name: null, plan: "business" })
    banc.base.teams.push({ id: "t2", owner_id: AUTRE.id, name: "Le Bistrot", slug: "le-bistrot" })
    expect((await appeler("member", "PATCH", AUTRE, { memberId: "m_editeur", role: "admin" })).statut).toBe(404)
    expect((await appeler("member", "DELETE", AUTRE, { memberId: "m_editeur" })).statut).toBe(404)
    expect((await appeler("member", "DELETE", AUTRE, { invitationId: "i1" })).statut).toBe(404)
    expect(membres()).toEqual(AVANT)
    expect(banc.base.team_invitations).toHaveLength(1)
  })

  it("un membre quitte ; le propriétaire ne quitte pas sa propre équipe", async () => {
    expect((await appeler("member", "DELETE", EDITEUR, { leave: true })).statut).toBe(200)
    expect(membres()).toEqual(["u_admin:admin"])
    expect((await appeler("member", "DELETE", PATRON, { leave: true })).statut).toBe(400)
    expect(banc.base.teams).toHaveLength(1)
  })

  it("l'admin retire un membre et annule une invitation ; le lien annulé ne mène plus nulle part", async () => {
    expect((await appeler("member", "DELETE", ADMIN, { memberId: "m_editeur" })).statut).toBe(200)
    expect(membres()).toEqual(["u_admin:admin"])
    expect((await appeler("member", "DELETE", ADMIN, { invitationId: "i1" })).statut).toBe(200)
    expect((await appeler("accept", "POST", INVITEE, { token: "jeton-serveuse" })).statut).toBe(404)
  })
})
