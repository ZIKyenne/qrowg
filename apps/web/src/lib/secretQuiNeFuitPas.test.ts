// Un secret se compare en temps constant, et n'entre que par une porte — garde de classe.
//
// Relevé du 15 septembre. `gardeCron` a écrit les deux règles il y a quelques
// jours, en refermant les portes des cinq tâches planifiées :
//
//   « Le secret présenté : en-tête Authorization uniquement. Il était aussi
//     accepté en query string — donc dans les journaux d'accès et l'historique —
//     et dans le corps. »
//   « Comparaison à temps constant : `includes` s'arrêtait au premier octet
//     différent. »
//
// **Trois endroits ne les suivaient pas**, et le plus exposé est celui qui efface.
//
// `app/api/cron/prune-events` est la SEULE route destructive du produit : elle
// supprime définitivement les lignes de `scans`, `page_views`, `block_clicks`
// au-delà de la fenêtre de rétention. C'est aussi la seule qui avait gardé les
// trois faiblesses d'un coup :
//
//   const secret = req.nextUrl.searchParams.get("secret")        ← la porte fermée ailleurs
//   auth !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET   ← comparaison qui fuit
//   return NextResponse.json({ error: "Non autorisé" }, …)       ← refus sans trace
//
// Un secret dans l'URL vit dans les journaux d'accès de l'hébergeur, dans
// l'historique du navigateur, et dans l'en-tête `Referer` de la requête suivante.
// Pour une route qui efface, c'est la mauvaise porte à laisser ouverte.
//
// `lib/rateLimit.hasInternalToken` comparait le même CRON_SECRET avec `===`. Et
// le lien de désabonnement des rapports portait un « jeton » qui n'en est pas un :
// `base64url(sub.id)`, l'identifiant de la ligne écrit autrement, comparé avec
// `!==` — dans un e-mail, donc dans une boîte de réception partagée, transférée,
// ouverte par un filtre.
//
// La classe : **un secret se compare en temps constant, et n'entre que par
// l'en-tête `Authorization`.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { secretsEgaux, secretPresente, enTetePorteLeSecret, jetonDeDesabonnement, jetonHistorique, jetonValide } from "./secretQuiSeCompare"
import { TACHES } from "./journalCron"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

const requete = (entetes: Record<string, string>) => ({
  headers: { get: (n: string) => entetes[n.toLowerCase()] ?? null },
})

describe("comparer un secret", () => {
  it("deux secrets identiques passent, un seul octet suffit à refuser", () => {
    expect(secretsEgaux("abc123", "abc123")).toBe(true)
    expect(secretsEgaux("abc123", "abc124")).toBe(false)
    expect(secretsEgaux("abc123", "abc1234")).toBe(false)
    expect(secretsEgaux("", "")).toBe(true)
    expect(secretsEgaux("abc", ""), "un secret vide n'ouvre rien de non vide").toBe(false)
  })

  it("des octets non ASCII ne la font pas lever", () => {
    // `Buffer.from(…, "utf8")` change la longueur : la garde doit tenir.
    expect(secretsEgaux("clé-été", "clé-été")).toBe(true)
    expect(secretsEgaux("clé", "cle")).toBe(false)
    expect(() => secretsEgaux("🔑", "ab")).not.toThrow()
  })
})

describe("une seule porte", () => {
  it("le secret se lit dans l'en-tête Authorization, et nulle part ailleurs", () => {
    expect(secretPresente(requete({ authorization: "Bearer s3cr3t" }))).toBe("s3cr3t")
    expect(secretPresente(requete({ authorization: "Basic s3cr3t" })), "un autre schéma n'est pas un porteur").toBeNull()
    expect(secretPresente(requete({}))).toBeNull()
  })

  it("un en-tête nommé ne s'ouvre pas sans secret attendu", () => {
    expect(enTetePorteLeSecret(requete({ "x-internal-token": "s3cr3t" }), "x-internal-token", "s3cr3t")).toBe(true)
    expect(enTetePorteLeSecret(requete({ "x-internal-token": "s3cr3t" }), "x-internal-token", "autre")).toBe(false)
    // Fail-closed : sans secret configuré, personne ne passe — pas tout le monde.
    expect(enTetePorteLeSecret(requete({ "x-internal-token": "" }), "x-internal-token", "")).toBe(false)
    expect(enTetePorteLeSecret(requete({ "x-internal-token": "x" }), "x-internal-token", undefined)).toBe(false)
    expect(enTetePorteLeSecret(requete({}), "x-internal-token", "s3cr3t")).toBe(false)
  })
})

describe("le lien de désabonnement : plus sûr, sans rien casser", () => {
  const ID = "3f2b1c9e-0000-4000-8000-abcdefabcdef"

  it("le jeton signé ne ressemble plus à l'identifiant", () => {
    const signe = jetonDeDesabonnement(ID, "secret-du-serveur")
    expect(signe, "l'identifiant ne se lit plus dedans").not.toContain(ID.slice(0, 8))
    expect(Buffer.from(signe, "base64url").toString("utf8"), "et ne se décode pas non plus").not.toBe(ID)
    expect(signe).not.toBe(jetonHistorique(ID))
    expect(jetonDeDesabonnement(ID, "autre-secret"), "il dépend du secret").not.toBe(signe)
  })

  it("les liens déjà partis fonctionnent toujours", () => {
    // Un désabonnement qui cesse de marcher est une promesse rompue — celle que
    // la loi impose. L'ancien jeton reste accepté, pour toujours.
    expect(jetonValide(jetonHistorique(ID), ID, "secret-du-serveur")).toBe(true)
    expect(jetonValide(jetonDeDesabonnement(ID, "secret-du-serveur"), ID, "secret-du-serveur")).toBe(true)
  })

  it("et un jeton qui ne va pas avec la ligne n'ouvre rien", () => {
    expect(jetonValide("", ID, "s")).toBe(false)
    expect(jetonValide(jetonHistorique("un-autre-id"), ID, "s")).toBe(false)
    expect(jetonValide(jetonDeDesabonnement("un-autre-id", "s"), ID, "s")).toBe(false)
  })

  it("sans secret configuré, le lien marche quand même", () => {
    // Le produit ne doit pas se casser parce qu'une variable manque : il retombe
    // sur l'ancien jeton, qui est exactement ce qu'il faisait avant.
    expect(jetonDeDesabonnement(ID, undefined)).toBe(jetonHistorique(ID))
    expect(jetonValide(jetonHistorique(ID), ID, undefined)).toBe(true)
  })
})

describe("garde de classe : aucun secret ne passe par une autre porte", () => {
  it("aucune route ne lit un secret dans l'URL", () => {
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f).split(path.sep).join("/")
      if (rel === "lib/secretQuiSeCompare.ts") continue
      fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
        if (/^\s*(\/\/|\*)/.test(l)) return
        if (/searchParams\.get\(\s*["'](secret|key|api_?key|sig|signature|password)["']/.test(l)) {
          fautes.push(`${rel}:${i + 1}`)
        }
      })
    }
    expect(fautes, "journaux d'accès, historique, en-tête Referer : l'URL n'est pas une porte").toEqual([])
  })

  /** Le vocabulaire d'un secret, de quelque côté du signe qu'il se trouve. */
  const PARLE_DUN_SECRET = /SECRET|[Tt]oken|[Ss]ecret|apiKey|api_key|signature|password|mot_?de_?passe/

  it("et aucun secret ne se compare avec === ou !==", () => {
    // Le premier balayage ne regardait QUE la gauche du signe. Remettre
    // `req.headers.get("x-internal-token") === secret` ne faisait alors rien
    // tomber : le secret était à droite, et la gauche était un appel. On regarde
    // les deux côtés (lot v131, trouvé par mutation).
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f).split(path.sep).join("/")
      if (rel === "lib/secretQuiSeCompare.ts") continue
      fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
        if (/^\s*(\/\/|\*)/.test(l)) return
        const m = /^(.*?)(!==|===)(.*)$/.exec(l)
        if (!m) return
        // Ce qui TOUCHE le signe, pas ce qui traîne sur la ligne : `action ===
        // "pause"` sur une ligne qui parle d'un mot de passe ailleurs ne compare
        // pas un secret. Et comparer à une constante littérale — `null`, `0`,
        // `"string"` — ne fuit rien : la valeur est déjà écrite dans le code.
        const gauche = /([\w.$]+)\s*$/.exec(m[1])?.[1] ?? ""
        const droite = m[3].trim()
        const litteral = /^(null|undefined|true|false|-?\d|["'])/.test(droite)
        const gabarit = droite.startsWith("`") && PARLE_DUN_SECRET.test(droite)
        if (litteral && !gabarit) return
        if (gabarit || PARLE_DUN_SECRET.test(gauche) || PARLE_DUN_SECRET.test(/^([\w.$]+)/.exec(droite)?.[1] ?? "")) {
          fautes.push(`${rel}:${i + 1}`)
        }
      })
    }
    expect(fautes, "passer par `secretsEgaux` : `===` s'arrête au premier octet différent").toEqual([])
  })

  it("la route qui EFFACE passe par le contrôle d'entrée commun", () => {
    const purge = lire("app/api/cron/prune-events/route.ts")
    expect(purge).toContain('const refus = await gardeCron(req, "cron/prune-events")')
    expect(purge, "plus de secret lu dans l'URL").not.toContain('searchParams.get("secret")')
    const code = purge.split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n")
    expect(code, "ni de comparaison à la main — l'en-tête du fichier a le droit d'en parler").not.toContain("CRON_SECRET")
    expect(TACHES, "et son refus laisse une trace dans le journal").toContain("cron/prune-events")
  })

  it("le contrôle d'entrée des tâches n'a plus sa propre copie des règles", () => {
    const garde = lire("lib/gardeCron.ts")
    expect(garde).toContain('from "@/lib/secretQuiSeCompare"')
    expect(garde, "une règle en deux exemplaires finit par diverger").not.toContain("timingSafeEqual(a, b)")
  })

  it("et la comparaison du module est bien celle qui ne fuit pas", () => {
    // Un test unitaire ne peut pas observer le temps : remplacer le corps par
    // `donne === attendu` donne exactement les mêmes réponses. C'est donc la
    // FORME qu'on épingle ici — c'est tout ce qui distingue les deux (v131).
    const c = lire("lib/secretQuiSeCompare.ts")
    expect(c).toContain("return timingSafeEqual(a, b)")
    expect(c, "et jamais le raccourci qu'on vient de retirer partout").not.toMatch(/return donne (===|!==) attendu/)
  })

  it("le balayage voit bien les secrets — sinon il ne prouve rien", () => {
    let lignes = 0, fichiersVus = 0
    for (const f of fichiers()) {
      const s = fs.readFileSync(f, "utf8")
      if (!/CRON_SECRET|x-internal-token|jetonValide|secretsEgaux/.test(s)) continue
      fichiersVus++
      lignes += (s.match(/CRON_SECRET|x-internal-token|jetonValide|secretsEgaux/g) ?? []).length
    }
    expect(fichiersVus, "des fichiers qui manipulent un secret").toBeGreaterThan(4)
    expect(lignes, "et plusieurs occurrences dedans").toBeGreaterThan(8)
    // Et le détecteur de comparaison sait dire oui : sans quoi il ne dirait jamais non.
    const faux = 'if (userToken !== attendu) return'
    expect(/(?:SECRET|[Tt]oken|[Ss]ecret|apiKey|signature)\w*\s*(?:!==|===)\s*[^\s=]/.test(faux)).toBe(true)
  })
})
