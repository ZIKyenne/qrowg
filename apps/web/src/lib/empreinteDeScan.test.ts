import { describe, it, expect } from "vitest"
import { sansCommentaires } from "@/lib/codeSeul"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createHash } from "node:crypto"
import { selDeHachage, selEstDedie, empreinteAppareil, LONGUEUR_MIN_SEL } from "./empreinteDeScan"

const redirection = readFileSync(join(__dirname, "../app/q/[code]/route.ts"), "utf8")
const sha = (e: string) => createHash("sha256").update(e).digest("hex")
const SEL_VALIDE = "un-sel-assez-long-pour-servir"

// ═══════════════════════════════════════════════════════════════════════════════
// UNE EMPREINTE QU'ON NE SAIT PAS PROTÉGER NE S'ÉCRIT PAS.
//
// Trouvé le 29 septembre en instruisant Q14. La redirection écrivait, pour chaque
// scan, `SHA-256(ip | navigateur | sel)` avec
// `sel = process.env.SCAN_IP_SALT ?? "qrowg-scan-v1"`.
//
// `SCAN_IP_SALT` n'est pas défini dans les variables du projet en production : le
// sel était donc la constante écrite en clair dans ce dépôt. Or la politique RLS
// `Lecture scans propres` laisse chaque propriétaire de page lire SES scans,
// `ip_hash` compris — et les colonnes `os` et `browser` de la même ligne réduisent
// les navigateurs candidats à une poignée. Retrouver l'adresse revenait à
// parcourir les adresses IPv4 : quelques minutes.
//
// Un client pouvait donc dés-anonymiser les visiteurs de son propre QR code.
//
// La règle : **sans sel secret, aucune empreinte.** Le compte de visiteurs uniques
// devient approximatif — c'est un moindre mal.
// ═══════════════════════════════════════════════════════════════════════════════

describe("le sel", () => {
  it("le réglage dédié est retenu quand il existe", () => {
    expect(selDeHachage({ SCAN_IP_SALT: SEL_VALIDE })).toBe(SEL_VALIDE)
    expect(selEstDedie({ SCAN_IP_SALT: SEL_VALIDE })).toBe(true)
  })

  it("un sel trop court ne compte pas pour un sel", () => {
    // Un secret de huit caractères se devine ; il donnerait une fausse
    // impression de protection, ce qui est pire que pas de protection du tout.
    expect(selDeHachage({ SCAN_IP_SALT: "court" })).toBeNull()
    expect(selDeHachage({ SCAN_IP_SALT: "x".repeat(LONGUEUR_MIN_SEL - 1) })).toBeNull()
    expect(selDeHachage({ SCAN_IP_SALT: "x".repeat(LONGUEUR_MIN_SEL) })).toBe("x".repeat(LONGUEUR_MIN_SEL))
  })

  it("à défaut, un secret serveur qui ne sort jamais de la machine", () => {
    const sel = selDeHachage({ SUPABASE_SERVICE_ROLE_KEY: "une-cle-de-service-tres-longue" })
    expect(sel).toBe("repli:une-cle-de-service-tres-longue")
    expect(selEstDedie({ SUPABASE_SERVICE_ROLE_KEY: "une-cle-de-service-tres-longue" }), "le repli n'est pas la cible").toBe(false)
  })

  it("le réglage dédié passe avant le repli", () => {
    expect(selDeHachage({ SCAN_IP_SALT: SEL_VALIDE, SUPABASE_SERVICE_ROLE_KEY: "une-cle-de-service-tres-longue" }))
      .toBe(SEL_VALIDE)
  })

  it("sans aucun secret, il n'y a pas de sel — et on le dit", () => {
    expect(selDeHachage({})).toBeNull()
    expect(selDeHachage({ SCAN_IP_SALT: "   " })).toBeNull()
  })
})

describe("l'empreinte", () => {
  it("distingue deux adresses, et se répète pour la même", () => {
    const a = empreinteAppareil("1.2.3.4", "Safari", SEL_VALIDE, sha)
    const b = empreinteAppareil("1.2.3.5", "Safari", SEL_VALIDE, sha)
    expect(a).toBeTruthy()
    expect(a).not.toBe(b)
    expect(empreinteAppareil("1.2.3.4", "Safari", SEL_VALIDE, sha)).toBe(a)
  })

  it("dépend du sel : changer de sel change toutes les empreintes", () => {
    const a = empreinteAppareil("1.2.3.4", "Safari", SEL_VALIDE, sha)
    const b = empreinteAppareil("1.2.3.4", "Safari", "un-autre-sel-assez-long", sha)
    expect(a).not.toBe(b)
  })

  it("ne rend RIEN quand le sel manque — c'est tout l'objet du correctif", () => {
    expect(empreinteAppareil("1.2.3.4", "Safari", null, sha)).toBeNull()
    expect(empreinteAppareil("1.2.3.4", "Safari", selDeHachage({}), sha)).toBeNull()
  })

  it("ne rend rien non plus sans adresse : on n'invente pas d'empreinte", () => {
    for (const vide of ["", "   ", null, undefined]) {
      expect(empreinteAppareil(vide as any, "Safari", SEL_VALIDE, sha)).toBeNull()
    }
  })

  it("ne laisse fuir ni l'adresse ni le sel dans son résultat", () => {
    const e = empreinteAppareil("203.0.113.42", "Safari", SEL_VALIDE, sha)!
    expect(e).not.toContain("203.0.113")
    expect(e).not.toContain(SEL_VALIDE)
    expect(e).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe("la redirection n'a plus de sel public", () => {
  it("la constante écrite en clair a disparu", () => {
    // Le commentaire qui RACONTE le défaut la cite : on ne lit que le code.
    const code = sansCommentaires(redirection)
    expect(code, "le sel de repli public est revenu").not.toContain("qrowg-scan-v1")
    expect(code).not.toContain("process.env.SCAN_IP_SALT")
  })

  it("elle passe par le module, et lui injecte SHA-256", () => {
    expect(redirection).toContain("empreinteAppareil(rawIp, ua, selDeHachage(process.env)")
    expect(redirection).toContain('createHash("sha256")')
  })

  it("et l'empreinte reste déclarée dans l'inventaire de la mesure", () => {
    // Elle peut désormais valoir null, mais quand elle existe, elle est décrite.
    expect(redirection).toContain("ip_hash: ipHash")
  })
})
