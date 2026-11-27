import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { secretsEgaux } from "./gardeCron"
import { estAdministrateur, administrateurs } from "./admin"

// P1-36 · sept points de robustesse serveur relevés le 4 septembre.
const api = (p: string) => readFileSync(join(__dirname, "../app/api", p), "utf8")

describe("secret des tâches planifiées", () => {
  it("comparaison à temps constant, même longueur exigée", () => {
    expect(secretsEgaux("abc", "abc")).toBe(true)
    expect(secretsEgaux("abc", "abd")).toBe(false)
    expect(secretsEgaux("ab", "abc")).toBe(false)
    expect(secretsEgaux("", "")).toBe(true)
  })
  it("n'est plus lu ni en query string ni dans le corps", () => {
    // Réancré sur l'intention (lot v131) : les deux règles — une seule porte et
    // une comparaison à temps constant — ont quitté ce fichier pour
    // `secretQuiSeCompare`, d'où trois autres endroits les prennent aussi. Ce
    // qu'on vérifie n'a pas changé ; l'endroit où c'est écrit, oui.
    const g = readFileSync(join(__dirname, "gardeCron.ts"), "utf8")
    const c = readFileSync(join(__dirname, "secretQuiSeCompare.ts"), "utf8")
    expect(g).not.toContain('searchParams.get("secret")')
    expect(g).not.toContain("body?.secret")
    expect(g, "la garde délègue au module partagé").toContain('from "@/lib/secretQuiSeCompare"')
    expect(c).toContain("timingSafeEqual")
    expect(c, "et la porte unique y est écrite une fois").toContain('auth?.startsWith("Bearer ")')
  })
})

describe("administrateurs", () => {
  it("liste vide = personne ; comparaison insensible à la casse et aux espaces", () => {
    expect(estAdministrateur("a@b.fr", "")).toBe(false)
    expect(estAdministrateur("a@b.fr", undefined)).toBe(false)
    expect(administrateurs(" A@b.fr , c@d.fr")).toEqual(["a@b.fr", "c@d.fr"])
    expect(estAdministrateur("A@B.FR", "a@b.fr")).toBe(true)
    expect(estAdministrateur(null, "a@b.fr")).toBe(false)
  })
  it("/api/cron/etat est réservé aux administrateurs", () => {
    const s = api("cron/etat/route.ts")
    expect(s).toContain("if (!estAdministrateur(user.email))")
    expect(s).toContain("status: 403")
  })
})

describe("le reste", () => {
  it("contact : limiteur partagé, plus de Map locale", () => {
    const s = api("contact/route.ts")
    expect(s).not.toContain("new Map<")
    expect(s).toContain('rateLimit("contact:" + ip, 3, 3600_000)')
  })
  it("qr-duplicate : pas d'aléa prédictible", () => {
    // Le reste (code court neuf, domaine non copié) est JOUÉ depuis v402
    // (app/api/qr-duplicate/bancDuplication.test.ts).
    expect(api("qr-duplicate/route.ts")).not.toContain("Math.random")
  })
  it("les écritures sont vérifiées : qr-label, qr-destination, pages/create", () => {
    const label = api("qr-label/route.ts")
    expect(label).toContain('.select("id")')
    expect(label).toContain("if (!data?.length) return NextResponse.json({ error: \"QR introuvable\" }, { status: 404 })")
    const dest = api("qr-destination/route.ts")
    expect(dest).toContain("if (restoreErr || !touche?.length)")
    // pages/create : « QR non posé => la page part » est JOUÉ depuis v401
    // (app/api/pages/bancCreation.test.ts), pour les deux routes de création.
  })
  // « v1 destination : typeof avant trim » : JOUÉ depuis v399 (app/api/v1/bancApi.test.ts)
  // — nombre, objet ou tableau en `type`/`value` : 400, jamais une exception.
  it("plus de clé « constructor » lisible sur un objet littéral", () => {
    // stripe/checkout : « constructor » et « __proto__ » refusés en 400 — JOUÉ depuis v407 (stripe/bancCaisse.test.ts).
    expect(api("emails/new-lead/route.ts")).toContain("status: 410")
  })
})
