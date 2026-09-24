// motDePasseQuiALeake — audit du 23 septembre 2026, dernier constat.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// L'advisor Supabase signalait « Leaked Password Protection Disabled ». Elle
// l'est parce qu'elle est réservée aux offres payantes, et le projet est en
// FREE. Refuser le constat pour cette raison aurait été commode et faux : le
// contrôle ne dépend pas de Supabase, il tient en une requête à HIBP.
//
// ── Les quatre endroits où quelqu'un choisit un mot de passe ───────────────
//
// Un seul passe par le serveur — l'inscription, qui est une Server Action. Les
// trois autres (réinitialisation, profil, réglages) appellent Supabase depuis
// le navigateur : le mot de passe n'arrive jamais chez nous, et c'est très bien.
// Le contrôle vit donc des deux côtés, et cette garde les relève tous les quatre
// dans le produit plutôt que de les recopier ici.
//
// ── Les trois choses que la garde refuse de laisser dériver ────────────────
//
// 1. **Un chemin sans contrôle.** Tout appel à `signUp` ou à `updateUser` avec
//    un mot de passe doit être précédé du contrôle, dans la même fonction.
// 2. **La panne qui bloquerait.** Si HIBP ne répond pas, on LAISSE PASSER. Ce
//    contrôle aide la personne à choisir ; un attaquant qui prendrait un mot de
//    passe faible pour SON compte ne nuit à personne. Bloquer une inscription
//    parce qu'un service tiers est tombé coûterait un client pour rien. C'est
//    une décision, donc elle se teste.
// 3. **Le mot de passe qui sortirait.** Cinq caractères hexadécimaux partent,
//    jamais plus. Ni le mot de passe, ni son empreinte complète.

import { describe, it, expect, vi, afterEach } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { couperLeHachage, compterDansLaPlage, plageHibp, HIBP_RANGE } from "./motDePasseCompromis"
import { doitEtreRefuse, occurrencesDansLesFuites } from "./motDePasseCompromisServeur"
import { refusDuMotDePasse } from "./motDePasseAcceptable"

const RACINE = path.resolve(__dirname, "..")

function sources(): string[] {
  const out: string[] = []
  ;(function walk(d: string) {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p)
    }
  })(RACINE)
  return out
}

// Les deux portes d'entrée du contrôle : `refusDuMotDePasse` côté navigateur
// (qui englobe longueur, confirmation et fuite), `doitEtreRefuse` côté serveur.
const CONTROLE = /(refusDuMotDePasse|estCompromisCoteClient|doitEtreRefuse)\s*\(/

/**
 * Le code, sans les commentaires de ligne.
 *
 * `apresInscription.ts` cite `supabase.auth.signUp({ … })` dans son en-tête
 * pour expliquer ce qu'il reçoit. Une garde qui ne fait pas la différence entre
 * un appel et le récit d'un appel réclame un correctif là où il n'y a rien à
 * corriger — et, le jour où on la croit, elle fait ajouter du code inutile.
 * Les lignes sont blanchies plutôt que supprimées : les numéros restent justes.
 */
function sansCommentaires(src: string): string {
  return src.split("\n").map(l => (/^\s*(\/\/|\*|\/\*)/.test(l) ? "" : l)).join("\n")
}

/** Tous les endroits où le produit pose un mot de passe choisi par quelqu'un. */
export function chemminsDeMotDePasse(lire = (f: string) => fs.readFileSync(f, "utf8")) {
  const trouves: { fichier: string; ligne: number; quoi: string; controle: boolean }[] = []
  for (const f of sources()) {
    const src = sansCommentaires(lire(f))
    const re = /\.auth\s*\.\s*(signUp|updateUser)\s*\(([\s\S]{0,160})/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      const [, quoi, args] = m
      // `updateUser` sert aussi à changer l'e-mail ou les métadonnées : seul
      // celui qui porte un mot de passe nous concerne.
      if (quoi === "updateUser" && !/password/.test(args)) continue
      // Le contrôle doit être DANS la même fonction, donc juste avant.
      const avant = src.slice(Math.max(0, m.index - 1500), m.index)
      trouves.push({
        fichier: path.relative(RACINE, f),
        ligne: src.slice(0, m.index).split("\n").length,
        quoi,
        controle: CONTROLE.test(avant),
      })
    }
  }
  return trouves
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe("un mot de passe qui a fuité n'est pas accepté", () => {
  it("le relevé trouve bien les quatre chemins (sinon la garde est aveugle)", () => {
    const c = chemminsDeMotDePasse()
    expect(c.length).toBeGreaterThanOrEqual(4)
    expect(c.some(x => x.quoi === "signUp")).toBe(true)
    expect(c.filter(x => x.quoi === "updateUser").length).toBeGreaterThanOrEqual(3)
  })

  it("aucun de ces chemins ne pose un mot de passe sans le contrôler", () => {
    expect(
      chemminsDeMotDePasse().filter(x => !x.controle).map(x => `${x.fichier}:${x.ligne} (${x.quoi})`),
      "un mot de passe est posé sans vérifier qu'il n'a pas déjà fuité",
    ).toEqual([])
  })

  // ── La lecture de la réponse HIBP ────────────────────────────────────────

  it("coupe l'empreinte en 5 + 35", () => {
    const { prefixe, suffixe } = couperLeHachage("5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8")
    expect(prefixe).toBe("5BAA6")
    expect(suffixe).toBe("1E4C9B93F3F0682250B6CF8331B7EE68FD8")
    expect(prefixe.length + suffixe.length).toBe(40)
  })

  it("compte les occurrences, et répond 0 pour un suffixe absent", () => {
    const corps = "0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:9545824\r\n"
    expect(compterDansLaPlage(corps, "1E4C9B93F3F0682250B6CF8331B7EE68FD8")).toBe(9545824)
    expect(compterDansLaPlage(corps, "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toBe(0)
  })

  // ── Ce qui sort, et ce qui ne sort pas ───────────────────────────────────

  it("n'envoie que 5 caractères : ni le mot de passe, ni son empreinte complète", async () => {
    const vues: string[] = []
    vi.stubGlobal("fetch", async (url: any) => {
      vues.push(String(url))
      return new Response("ABC:1\n", { status: 200 })
    })
    await occurrencesDansLesFuites("hunter2")
    expect(vues).toHaveLength(1)
    const url = vues[0]
    expect(url.startsWith(HIBP_RANGE)).toBe(true)
    // Ce qui suit l'adresse de base fait exactement 5 caractères hexadécimaux.
    expect(url.slice(HIBP_RANGE.length)).toMatch(/^[0-9A-F]{5}$/)
    // Et le mot de passe n'apparaît nulle part dans ce qui est parti.
    expect(url.toLowerCase()).not.toContain("hunter2")
  })

  // ── Le mode de panne est une décision ────────────────────────────────────

  it("laisse passer quand HIBP ne répond pas — et ne prétend pas avoir vérifié", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("réseau coupé") })
    expect(await occurrencesDansLesFuites("nimportequoi")).toBeNull()   // « on ne sait pas »
    expect((await doitEtreRefuse("nimportequoi")).refuse).toBe(false)   // « on laisse passer »
  })

  it("laisse passer sur une réponse en erreur de HIBP", async () => {
    vi.stubGlobal("fetch", async () => new Response("rate limited", { status: 429 }))
    expect(await plageHibp("ABCDE")).toBeNull()
    expect((await doitEtreRefuse("nimportequoi")).refuse).toBe(false)
  })

  it("refuse quand, et seulement quand, HIBP répond positivement", async () => {
    // Réponse construite pour contenir le vrai suffixe du mot de passe testé.
    const { createHash } = await import("node:crypto")
    const sha1 = createHash("sha1").update("motdepasse", "utf8").digest("hex")
    const { suffixe } = couperLeHachage(sha1)
    vi.stubGlobal("fetch", async () => new Response(`${suffixe}:42\r\nAAAA:1\r\n`, { status: 200 }))
    const r = await doitEtreRefuse("motdepasse")
    expect(r.refuse).toBe(true)
    expect(r.occurrences).toBe(42)

    // Et la même mécanique répond « sain » quand le suffixe n'y est pas.
    vi.stubGlobal("fetch", async () => new Response("AAAA:1\r\n", { status: 200 }))
    expect((await doitEtreRefuse("motdepasse")).refuse).toBe(false)
  })

  // ── La règle partagée par les trois écrans ───────────────────────────────

  it("ce qui se juge sans réseau passe avant l'appel à HIBP", async () => {
    let appels = 0
    vi.stubGlobal("fetch", async () => { appels++; return new Response("AAAA:1\n", { status: 200 }) })
    // Trop court, et mal confirmé : aucune raison de déranger HIBP.
    expect(await refusDuMotDePasse("court", "court")).toContain("8 caractères")
    expect(await refusDuMotDePasse("assezlong1", "autrechose")).toContain("ne correspondent pas")
    expect(appels, "HIBP a été appelé pour un mot de passe déjà refusé localement").toBe(0)
    // Acceptable localement : là, oui, on demande.
    expect(await refusDuMotDePasse("assezlong1", "assezlong1")).toBeNull()
    expect(appels).toBe(1)
  })

  it("les trois écrans disent la même phrase, parce qu'ils lisent la même règle", () => {
    const ecrans = [
      "app/auth/reset-password/ResetPasswordForm.tsx",
      "app/dashboard/profile/page.tsx",
      "app/dashboard/settings/page.tsx",
    ]
    for (const e of ecrans) {
      const src = sansCommentaires(fs.readFileSync(path.join(RACINE, e), "utf8"))
      expect(src, `${e} n'appelle pas la règle partagée`).toMatch(/refusDuMotDePasse\s*\(/)
      // Et il ne rejuge plus la longueur dans son coin.
      expect(src, `${e} garde une règle de longueur écrite à la main`).not.toMatch(/\.length\s*<\s*8/)
    }
  })

  // ── Contre-épreuve ───────────────────────────────────────────────────────

  it("un chemin sans contrôle serait vu", () => {
    const faux = (f: string) => f.endsWith("motDePasseCompromis.ts")
      ? 'const x = 1\nawait sb.auth.updateUser({ password: p })\n'
      : fs.readFileSync(f, "utf8")
    expect(chemminsDeMotDePasse(faux).some(x => !x.controle)).toBe(true)
  })
})
