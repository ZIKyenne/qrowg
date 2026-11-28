import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { NextRequest } from "next/server"

// Les messages laissés sur une page publique (`/api/leads`) — la VRAIE route, et
// les deux e-mails qu'elle déclenche (au commerçant, au visiteur), joués contre
// une fausse base (le déclencheur `leads_set_user_id` compris) et un faux Resend
// qui refuse, comme le vrai, un `reply_to` qui n'est pas une adresse (v411).
//
// En le jouant (v411) :
//  - l'e-mail au commerçant reprenait en `replyTo` l'adresse BRUTE du visiteur :
//    une adresse mal tapée (« jean@gmail ») faisait refuser tout l'envoi — le
//    message était en base, le commerçant jamais prévenu ;
//  - des réponses de formulaire de plus de 8 Ko étaient remplacées par {} EN
//    SILENCE : « envoyé » pour le visiteur, un message vide pour le commerçant.

const banc = vi.hoisted(() => {
  vi.stubEnv("RESEND_API_KEY", "re_banc")
  return {
    base: {} as Record<string, Record<string, any>[]>,
    limiteAtteinte: false,
    sansColonneSource: false,
    insertionRefusee: false,
    apres: [] as (() => Promise<void>)[],
    envoyes: [] as { to: string; replyTo?: string; subject: string; html: string }[],
  }
})
afterAll(() => { vi.unstubAllEnvs() })

vi.mock("@/lib/rateLimit", () => ({ rateLimit: async () => !banc.limiteAtteinte, ipOf: () => "203.0.113.9" }))
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => Promise<void>) => { banc.apres.push(fn) } }))
vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (m: { to: string; replyTo?: string; subject: string; html: string }) => {
        // Comme l'API Resend : un reply_to invalide fait échouer TOUT l'envoi (422).
        if (m.replyTo !== undefined && !/^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i.test(m.replyTo)) return { data: null, error: { message: "Invalid `reply_to` field" } }
        banc.envoyes.push(m); return { data: { id: `e${banc.envoyes.length}` }, error: null }
      },
    }
  },
}))

let seq = 0
function requete(table: string) {
  const filtres: ((l: Record<string, any>) => boolean)[] = []
  let op: "select" | "insert" = "select", charge: any = null
  const t = () => (banc.base[table] ??= [])
  const executer = () => {
    if (op === "insert") {
      if (banc.insertionRefusee) return { data: null, error: { code: "XX000", message: "panne" } }
      if (banc.sansColonneSource && "qr_source" in charge) return { data: null, error: { code: "PGRST204", message: "Could not find the 'qr_source' column" } }
      // trg_leads_set_user_id : le propriétaire de la PAGE, jamais le visiteur.
      const page = (banc.base.pages ?? []).find(p => p.id === charge.page_id)
      t().push({ id: `lead_${++seq}`, status: "new", ...charge, user_id: page?.user_id ?? null })
      return { data: null, error: null }
    }
    return { data: t().filter(l => filtres.every(f => f(l))).map(l => ({ ...l })), error: null }
  }
  const une = async () => { const r = executer(); return { ...r, data: r.data?.[0] ?? null } }
  const q: any = {
    select() { return q },
    insert(p: any) { op = "insert"; charge = p; return q },
    eq(c: string, v: unknown) { filtres.push(l => l[c] === v); return q },
    maybeSingle: une, single: une,
    then(ok: any, ko: any) { return Promise.resolve(executer()).then(ok, ko) },
  }
  return q
}
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ from: (t: string) => requete(t) }) }))

import { POST } from "./route"

const PAGE = "11111111-1111-4111-8111-111111111111"
const PROPRIO = "u_proprio"
const envoyer = async (corps: unknown) => {
  const r = await POST(new NextRequest("https://qrowg.com/api/leads", {
    method: "POST", headers: { "content-type": "application/json" },
    body: typeof corps === "string" ? corps : JSON.stringify(corps),
  }))
  for (const f of banc.apres.splice(0)) await f()       // les e-mails partent après la réponse
  return r
}
const leads = () => banc.base.leads ?? []
const auCommercant = () => banc.envoyes.filter(e => e.subject.includes(" — ") && !e.subject.startsWith("Nous avons"))
const auVisiteur = () => banc.envoyes.filter(e => e.subject.startsWith("Nous avons bien reçu"))
const lead = (extra: Record<string, unknown> = {}) => ({ pageId: PAGE, blockId: "b_form", type: "quote", name: "Jeanne", email: "jeanne@exemple.fr", message: "Un devis pour 40 couverts", ...extra })

beforeEach(() => {
  banc.limiteAtteinte = false
  banc.sansColonneSource = false
  banc.insertionRefusee = false
  banc.apres = []
  banc.envoyes = []
  banc.base = {
    pages: [{ id: PAGE, user_id: PROPRIO, title: "Le Comptoir" }],
    blocks: [{ id: "b_form", page_id: PAGE, content: { email_dest: "devis@lecomptoir.fr" } }, { id: "b_autre", page_id: PAGE, content: {} }],
    profiles: [{ id: PROPRIO, email: "patron@lecomptoir.fr", full_name: "Paul", preferences: {} }],
    leads: [],
  }
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("ce qui entre", () => {
  it("le message est rangé chez le propriétaire de la page, champs bornés, support d'origine compris", async () => {
    const r = await envoyer(lead({ name: "J".repeat(500), message: "m".repeat(5000), qrSource: "table-4", data: { couverts: "40" } }))
    expect(r.status).toBe(200)
    expect(leads()).toHaveLength(1)
    const l = leads()[0]
    expect(l).toMatchObject({ page_id: PAGE, user_id: PROPRIO, block_id: "b_form", type: "quote", email: "jeanne@exemple.fr", qr_source: "table-4", data: { couverts: "40" } })
    expect(l.name.length).toBeLessThanOrEqual(200)
    expect(l.message.length).toBeLessThanOrEqual(3000)
  })

  it("sans type : un message ; sans réponses : {}", async () => {
    await envoyer({ pageId: PAGE, message: "Bonjour" })
    expect(leads()[0]).toMatchObject({ type: "form", data: {} })
  })

  it("trop d'envois depuis la même adresse : 429, rien n'est rangé ni envoyé", async () => {
    banc.limiteAtteinte = true
    expect((await envoyer(lead())).status).toBe(429)
    expect(leads()).toEqual([])
    expect(banc.envoyes).toEqual([])
  })

  it("page invalide ou inconnue, corps illisible : refusé, rien n'est rangé ni envoyé", async () => {
    for (const c of [{ pageId: "pas-un-uuid" }, {}, "{pas du json", { pageId: 42 }]) expect((await envoyer(c)).status, JSON.stringify(c)).toBe(400)
    expect((await envoyer(lead({ pageId: "22222222-2222-4222-8222-222222222222" }))).status).toBe(404)
    expect(leads()).toEqual([])
    expect(banc.envoyes).toEqual([])
  })

  it("des réponses de plus de 8 Ko : 413, au lieu d'un message vidé en silence (défaut v411)", async () => {
    const r = await envoyer(lead({ data: { projet: "x".repeat(9_000) } }))
    expect(r.status).toBe(413)
    expect(leads()).toEqual([])
    expect((await envoyer(lead({ data: "pas un objet" }))).status).toBe(413)
  })

  it("base sans la colonne du support : le message passe quand même", async () => {
    banc.sansColonneSource = true
    expect((await envoyer(lead({ qrSource: "vitrine" }))).status).toBe(200)
    expect(leads()).toHaveLength(1)
    expect(leads()[0].qr_source).toBeUndefined()
  })

  it("une base qui refuse : 500, et personne n'est prévenu d'un message qui n'existe pas", async () => {
    banc.insertionRefusee = true
    expect((await envoyer(lead())).status).toBe(500)
    expect(banc.envoyes).toEqual([])
  })
})

describe("le commerçant est prévenu", () => {
  it("à l'adresse choisie sur le bloc, sinon à celle du compte ; répondre écrit au visiteur", async () => {
    await envoyer(lead())
    await envoyer(lead({ blockId: "b_autre" }))
    expect(auCommercant().map(e => e.to)).toEqual(["devis@lecomptoir.fr", "patron@lecomptoir.fr"])
    expect(auCommercant()[0]).toMatchObject({ replyTo: "jeanne@exemple.fr", subject: "Demande de devis — Jeanne" })
    expect(auCommercant()[0].html).toContain("Un devis pour 40 couverts")
  })

  it("une adresse de visiteur mal tapée ne coûte plus la notification (défaut v411)", async () => {
    for (const email of ["jean@gmail", "a@x.fr, pirate@y.fr", "a@b.fr?bcc=pirate@y.fr", "pas une adresse"]) {
      banc.envoyes = []
      expect((await envoyer(lead({ email }))).status).toBe(200)
      expect(auCommercant(), email).toHaveLength(1)
      expect(auCommercant()[0].replyTo, email).toBeUndefined()
    }
  })

  it("ce que le visiteur a tapé n'est jamais du HTML, ni un saut de ligne dans le sujet", async () => {
    await envoyer(lead({ name: "Jeanne\r\nBcc: pirate@y.fr", message: "<script>alert(1)</script>", data: { "<b>champ</b>": "<img src=x onerror=alert(1)>" } }))
    const e = auCommercant()[0]
    expect(e.subject).not.toMatch(/[\r\n]/)
    expect(e.html).not.toContain("<script>alert(1)</script>")
    expect(e.html).not.toContain("<img src=x")
    expect(e.html).toContain("&lt;script&gt;")
  })

  it("il a coupé ces e-mails : rien ne lui part (le message est quand même rangé)", async () => {
    banc.base.profiles[0].preferences = { email_leads: false }
    await envoyer(lead())
    expect(auCommercant()).toEqual([])
    expect(leads()).toHaveLength(1)
  })
})

describe("le visiteur reçoit un accusé", () => {
  it("à son adresse, au nom de la page, avec son prénom — sans rien de ce qu'il a pu glisser", async () => {
    await envoyer(lead({ name: "<b>Jeanne</b>\nautre ligne" }))
    const [a] = auVisiteur()
    expect(a).toMatchObject({ to: "jeanne@exemple.fr", replyTo: "patron@lecomptoir.fr", subject: "Nous avons bien reçu votre demande — Le Comptoir" })
    expect(a.html).not.toContain("<b>Jeanne</b>")
    expect(a.html).toContain("Votre demande de devis a bien été reçue.")
  })

  it("sans adresse valide, ou si le commerçant l'a coupé : pas d'accusé", async () => {
    await envoyer(lead({ email: "jean@gmail" }))
    await envoyer(lead({ email: undefined }))
    banc.base.profiles[0].preferences = { lead_confirmation: false }
    await envoyer(lead())
    expect(auVisiteur()).toEqual([])
    expect(auCommercant()).toHaveLength(3)
  })
})
