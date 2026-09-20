// Une erreur montrée au commerçant lui dit quoi faire, et ne dit rien de la base
// — garde de classe.
//
// Relevé du 20 septembre. `lib/apiError.ts` porte la règle depuis longtemps, en
// tête de fichier :
//
//   « Réponse d'erreur SERVEUR : on logue le détail côté serveur (pour le debug)
//     mais on renvoie un message GÉNÉRIQUE au client — évite de divulguer les
//     internes Postgres (noms de tables/contraintes) ou Stripe. »
//
// Le produit renvoie **trois cent huit** réponses portant un champ `error`, et
// vingt-deux fichiers passent par `serverError`. **Sept tendaient quand même le
// détail brut :**
//
//   api/pages/create:71      `pageError?.message || "Erreur creation page"`
//   api/qr-duplicate:81,108  `e2?.message`, `e3?.message`
//   api/qr-support:54        `error?.message`
//   api/templates/use:97     `pageError?.message` — en repli d'une phrase juste
//   api/domains:48           le message de l'API de l'hébergeur
//   api/cron/prune-events    `error.message`, table par table
//
// Le commerçant clique « Créer ma page » et lit, dans son navigateur :
//
//     duplicate key value violates unique constraint "pages_slug_unique"
//
// Deux problèmes dans une seule phrase. Elle donne le nom d'une table, d'une
// colonne et d'une contrainte — ce que l'en-tête du module dit d'éviter. Et
// **elle ne lui apprend rien** : il voulait publier une page, il ne sait pas ce
// qu'est une contrainte d'unicité, et il ignore ce qu'il doit changer.
//
// Le plus net est `templates/use`. La même ligne portait les deux gestes :
//
//     error: isDup ? "Cette adresse est déjà prise." : (pageError?.message || …)
//
// Quelqu'un avait vu le cas du doublon et écrit la phrase juste. Tous les autres
// codes retombaient sur le message de Postgres.
//
// Et le message de l'hébergeur remontait jusqu'à `vercel_error`, que deux écrans
// affichent tel quel — le commerçant lisait la panne d'un fournisseur dont il n'a
// jamais entendu parler.
//
// La classe : **une erreur montrée au commerçant lui dit quoi faire, et ne dit
// rien de la base.** Le détail part dans le journal du serveur, où il sert.

import { describe, it, expect, vi, afterEach } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { phraseDeLErreurBase, PHRASE_PAR_CODE, PHRASE_GENERIQUE, erreurDeBase } from "./apiError"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function routes(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) marcher(p)
      else if (n === "route.ts") out.push(p)
    }
  }
  marcher(path.join(SRC, "app/api"))
  return out
}

/**
 * Routes dont le détail brut ne sort PAS du produit, avec la raison.
 *
 * `debug-auth` répond 404 en production — sa première ligne. `reports/send` lève
 * une `Error` que son propre `catch` journalise : elle ne part dans aucune
 * réponse. La liste ne doit pas grossir : le dernier test le vérifie.
 */
const HORS_PORTEE: Record<string, string> = {
  "app/api/debug-auth/route.ts": "neutralisée en production (404 dès la première ligne)",
  "app/api/reports/send/route.ts": "l'Error levée est journalisée, jamais renvoyée",
}

type Faute = { fichier: string; ligne: number; texte: string }

/** Chaque réponse qui met un détail d'erreur BRUT dans son corps. */
function fuites(): Faute[] {
  const out: Faute[] = []
  for (const f of routes()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (rel in HORS_PORTEE) continue
    fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return
      const m = /\berror:\s*([^,}\n]+)/.exec(l)
      if (!m) return
      const val = m[1]
      // `x.message`, `String(e)`, ou une variable qui porte le message d'un tiers.
      if (/\b\w*(?:err|error|e\d?|ex)\w*\??\.message\b|\bString\(\s*e\w*\s*\)/.test(val)) {
        out.push({ fichier: rel, ligne: i + 1, texte: l.trim().slice(0, 120) })
      }
    })
  }
  return out
}

afterEach(() => { vi.restoreAllMocks() })

describe("ce qu'une erreur de base dit au commerçant", () => {
  it("un doublon lui dit qu'il doit changer sa valeur, pas le nom de la contrainte", () => {
    const r = phraseDeLErreurBase({ code: "23505", message: 'duplicate key value violates unique constraint "pages_slug_unique"' })
    expect(r.phrase, "aucun nom de table, de colonne ou de contrainte").not.toMatch(/constraint|pages_|violates|duplicate key/)
    expect(r.phrase, "et une action").toMatch(/déjà utilisée|Choisissez/)
    expect(r.statut, "un conflit, pas une panne du serveur").toBe(409)
  })

  it("une route qui sait de quelle unicité il s'agit le dit mieux", () => {
    const r = phraseDeLErreurBase({ code: "23505" }, "repli", { "23505": "Cette adresse est déjà prise." })
    expect(r.phrase).toBe("Cette adresse est déjà prise.")
    expect(r.statut).toBe(409)
  })

  it("un code inconnu ne laisse rien filtrer non plus", () => {
    const r = phraseDeLErreurBase({ code: "XX999", message: 'relation "secrets" does not exist' }, "La page n'a pas pu être créée.")
    expect(r.phrase).toBe("La page n'a pas pu être créée.")
    expect(r.phrase).not.toContain("secrets")
    expect(r.statut).toBe(500)
    // Et sans repli : la phrase générale, jamais le message.
    expect(phraseDeLErreurBase({ code: "XX999", message: "interne" }).phrase).toBe(PHRASE_GENERIQUE)
    expect(phraseDeLErreurBase(null).phrase).toBe(PHRASE_GENERIQUE)
    expect(phraseDeLErreurBase(undefined).statut).toBe(500)
  })

  it("aucune phrase du barème ne parle la langue de la base", () => {
    for (const [code, { phrase, statut }] of Object.entries(PHRASE_PAR_CODE)) {
      expect(phrase, code).not.toMatch(/constraint|relation|column|violates|null value|duplicate key|pg_|SQLSTATE/i)
      expect(phrase, `${code} : une phrase qui se lit`).toMatch(/^[A-ZÀ-Ý].*[.!]$/)
      expect(statut, code).toBeGreaterThanOrEqual(400)
      expect(statut, code).toBeLessThan(500)
    }
  })

  it("le détail part au journal — c'est là qu'il sert", async () => {
    const journal = vi.spyOn(console, "error").mockImplementation(() => {})
    const rep = erreurDeBase("pages/create", { code: "23505", message: 'violates unique constraint "pages_slug_unique"' }, "repli")
    expect(journal).toHaveBeenCalled()
    expect(JSON.stringify(journal.mock.calls), "le détail est journalisé").toContain("pages_slug_unique")
    const corps = await rep.json()
    expect(JSON.stringify(corps), "et absent de la réponse").not.toContain("pages_slug_unique")
    expect(rep.status).toBe(409)
  })
})

describe("garde de classe : aucune réponse ne tend le détail brut", () => {
  it("plus aucune route ne renvoie le message d'un tiers", () => {
    expect(fuites().map(f => `${f.fichier}:${f.ligne} — ${f.texte}`), "passer par `erreurDeBase` ou `serverError`").toEqual([])
  })

  it("les sept endroits du relevé disent maintenant quoi faire", () => {
    for (const [f, morceau] of [
      ["app/api/pages/create/route.ts", 'erreurDeBase("pages/create"'],
      ["app/api/qr-duplicate/route.ts", 'erreurDeBase("qr-duplicate/page"'],
      ["app/api/qr-support/route.ts", 'erreurDeBase("qr-support"'],
      ["app/api/templates/use/route.ts", '"23505": "Cette adresse est déjà prise."'],
      ["app/api/domains/route.ts", "Le rattachement du domaine n'a pas abouti."],
      ["app/api/cron/prune-events/route.ts", 'deleted[table] = error ? "erreur"'],
      ["app/api/webhooks/stripe/route.ts", '{ error: "Signature invalide." }'],
    ] as const) {
      expect(lire(f), f).toContain(morceau)
    }
  })

  it("et le message de l'hébergeur ne remonte plus jusqu'à l'écran", () => {
    const src = lire("app/api/domains/route.ts")
    expect(src, "il est journalisé").toContain('console.error("[domains/addToVercel]", msg)')
    expect(src, "et remplacé par une phrase qui se lit").not.toContain("return { ok: false, error: msg }")
  })

  it("le balayage voit bien les réponses — sinon il ne prouve rien", () => {
    let reponses = 0
    for (const f of routes()) reponses += (fs.readFileSync(f, "utf8").match(/\berror:\s*/g) ?? []).length
    expect(reponses, "des réponses d'erreur dans l'API").toBeGreaterThan(200)
    expect(routes().length, "des routes").toBeGreaterThan(40)
    // Le détecteur sait dire oui : sans quoi il ne dirait jamais non.
    expect(/\b\w*(?:err|error|e\d?|ex)\w*\??\.message\b/.test('{ error: pageError?.message }')).toBe(true)
    expect(/\b\w*(?:err|error|e\d?|ex)\w*\??\.message\b/.test('{ error: "Signature invalide." }')).toBe(false)
    // Et les exceptions restent deux, avec leur raison écrite.
    expect(Object.keys(HORS_PORTEE).sort(), "une liste d'exceptions qui grossit n'est plus une exception")
      .toEqual(["app/api/debug-auth/route.ts", "app/api/reports/send/route.ts"])
    expect(lire("app/api/debug-auth/route.ts"), "et la raison de la première tient toujours")
      .toContain('process.env.NODE_ENV === "production"')
  })
})
