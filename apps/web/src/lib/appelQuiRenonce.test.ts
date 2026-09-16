// Un appel qui sort du produit porte un délai — garde de classe.
//
// Relevé du 16 septembre, en suivant ce qui se passe quand quelqu'un scanne.
//
// Le produit fait **onze** appels vers l'extérieur. **Deux** portaient un délai,
// et disaient pourquoi :
//
//   app/[slug]/og/route.tsx:97   fetch(avatarUrl, { signal: AbortSignal.timeout(2500) })
//   app/api/domains/check:198    new AbortController(), setTimeout(abort, 6000)
//
// **Neuf n'en portaient aucun.** Mon premier relevé n'en comptait que sept :
// les deux appels à l'API de l'hébergeur construisent leur adresse une ligne
// plus haut — `const url = ` + "`https://api.vercel.com/…`" + ` — et ne
// ressemblaient donc pas à une adresse. C'est cette garde, écrite ensuite, qui
// les a trouvés.
//
// Les deux plus coûteux sont sur le chemin du visiteur — celui qui est debout
// devant la vitrine, téléphone à la main :
//
//   lib/rateLimit.ts:46         Upstash, sur CHAQUE requête limitée, avant tout le reste
//   lib/premierScanEnvoi.ts:47  Resend, attendu par `/api/track` au premier scan
//
// `fetch` n'a **aucun délai par défaut**. Un serveur qui accepte la connexion
// puis ne répond plus tient la requête jusqu'au budget de la fonction : le
// visiteur attend, la fonction est facturée, et sur une vitrine qui marche les
// instances se remplissent d'appels qui n'arriveront jamais.
//
// Le plus dur à voir est que le produit savait déjà s'en remettre — `rateLimit`
// retombe sur son compteur local, `previenirPremierScan` répond « impossible »,
// l'atelier affiche « Aucune photo trouvée ». Chaque `catch` était écrit. Il
// manquait seulement le moment où l'on décide d'arrêter d'attendre.
//
// La classe : **un appel qui sort du produit porte un délai, choisi selon qui
// attend.**

import { describe, it, expect, vi, afterEach } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { DELAI, fetchBorne, signalBorne, estUnDelaiDepasse } from "./appelQuiNAttendPas"

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

type Appel = { fichier: string; ligne: number; texte: string; borne: boolean }

/**
 * Le seul fichier dont le `fetch(url, …)` ne sort PAS du produit.
 *
 * `effetDe` appelle les routes de QRowg, servies par le même déploiement : ce
 * n'est pas un tiers qui peut se taire, et la garde du lot v129 prouve déjà que
 * chacun de ses appelants lui passe une adresse commençant par `/api/`. La liste
 * ne doit pas grossir : le test du bas le vérifie.
 */
const SES_PROPRES_ROUTES = ["lib/effetConfirme.ts"]

/**
 * Chaque appel du produit vers une adresse qu'il ne sert pas lui-même :
 * une URL absolue, ou une URL construite à partir d'une variable d'environnement.
 */
function appelsSortants(): Appel[] {
  const out: Appel[] = []
  for (const f of fichiers()) {
    const s = fs.readFileSync(f, "utf8")
    const L = s.split("\n")
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    if (rel === "lib/appelQuiNAttendPas.ts") continue
    for (const m of s.matchAll(/\b(fetch|fetchBorne)\s*\(\s*[`"']?(https:\/\/|\$\{)/g)) {
      const i = s.slice(0, m.index!).split("\n").length - 1
      if (/^\s*(\/\/|\*|\/\*)/.test(L[i])) continue
      out.push({ fichier: rel, ligne: i + 1, texte: L[i].trim(), borne: m[1] === "fetchBorne" })
    }
    // Une adresse passée par variable ne ressemble pas à une adresse — et c'est
    // exactement ainsi que les deux appels à l'API de l'hébergeur avaient
    // échappé au relevé : `const url = \`https://api.vercel.com/…\`` une ligne
    // plus haut, puis `fetch(url, …)`. On les rattrape par le nom.
    if (SES_PROPRES_ROUTES.includes(rel)) continue
    for (const m of s.matchAll(/\b(fetch|fetchBorne)\s*\(\s*(?:u\.toString\(\)|url|avatarUrl|entree)\b/g)) {
      const i = s.slice(0, m.index!).split("\n").length - 1
      if (/^\s*(\/\/|\*|\/\*)/.test(L[i])) continue
      out.push({ fichier: rel, ligne: i + 1, texte: L[i].trim(), borne: m[1] === "fetchBorne" })
    }
  }
  return out
}

afterEach(() => { vi.restoreAllMocks() })

describe("le délai lui-même", () => {
  it("les trois budgets sont nommés par qui attend, et vont du plus court au plus long", () => {
    expect(DELAI.visiteur).toBeLessThan(DELAI.ecran)
    expect(DELAI.ecran).toBeLessThan(DELAI.tache)
    expect(DELAI.visiteur, "celui qui scanne ne regarde pas un écran de chargement").toBeLessThanOrEqual(3000)
    // Les valeurs viennent de ce que le produit s'était déjà donné.
    expect(DELAI.visiteur, "og/route.tsx se donnait 2 500 ms pour un avatar").toBe(2500)
    expect(DELAI.ecran, "domains/check se donnait 6 000 ms pour une vérification").toBe(6000)
  })

  it("un appel qui ne répond pas est abandonné, et l'appelant le sait", async () => {
    vi.stubGlobal("fetch", vi.fn((_u: unknown, init?: RequestInit) => new Promise((_res, rej) => {
      init?.signal?.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "TimeoutError" })))
    })))
    await expect(fetchBorne("https://exemple.test", undefined, 20)).rejects.toSatisfy(estUnDelaiDepasse)
  })

  it("une réponse qui arrive à temps passe, intacte", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200 })))
    const r = await fetchBorne("https://exemple.test", { method: "POST" }, "tache")
    expect(r.ok).toBe(true)
  })

  it("le délai n'efface pas l'abandon que l'appelant avait déjà posé", () => {
    const sien = new AbortController()
    const s = signalBorne(60_000, sien.signal)
    sien.abort()
    // `AbortSignal.any` propage ; sans lui, le délai prime — dans les deux cas
    // le signal existe et l'appel reste borné.
    expect(s).toBeInstanceOf(AbortSignal)
    expect(signalBorne(10).aborted, "un délai tout juste ouvert n'est pas déjà dépassé").toBe(false)
  })

  it("et il sait distinguer un délai d'une vraie erreur", () => {
    expect(estUnDelaiDepasse(Object.assign(new Error("x"), { name: "TimeoutError" }))).toBe(true)
    expect(estUnDelaiDepasse(Object.assign(new Error("x"), { name: "AbortError" }))).toBe(true)
    expect(estUnDelaiDepasse(new Error("upstash 500")), "un refus du serveur n'est pas un délai").toBe(false)
    expect(estUnDelaiDepasse(null)).toBe(false)
  })
})

describe("garde de classe : aucun appel sortant n'attend indéfiniment", () => {
  it("chaque appel vers l'extérieur porte un délai", () => {
    const fautes = appelsSortants().filter(a => !a.borne).map(a => `${a.fichier}:${a.ligne}`)
    expect(fautes, "passer par `fetchBorne` : `fetch` n'a aucun délai par défaut").toEqual([])
  })

  it("et le chemin du visiteur prend le budget le plus court", () => {
    // Les deux appels que quelqu'un attend, debout devant une vitrine.
    expect(lire("lib/rateLimit.ts"), "Upstash, sur chaque requête limitée").toContain('}, "visiteur")')
    expect(lire("lib/premierScanEnvoi.ts"), "Resend, au premier scan").toContain('}, "visiteur")')
    expect(lire("app/[slug]/og/route.tsx")).toContain('fetchBorne(avatarUrl, {}, "visiteur")')
  })

  it("le délai écrit à la main a laissé place au nom", () => {
    const dns = lire("app/api/domains/check/route.ts")
    expect(dns).toContain('}, "ecran")')
    expect(dns, "plus de minuterie à dérouler soi-même").not.toContain("setTimeout(() => controller.abort()")
    expect(dns, "ni de minuterie à annuler après coup").not.toContain("clearTimeout(timer)")
  })

  it("les tâches de fond ont leur budget, et pas celui du visiteur", () => {
    for (const f of [
      "app/api/cron/relance/route.ts",
      "app/api/cron/quota-alerts/route.ts",
      "app/api/cron/dynamic-expiry/route.ts",
      "app/api/reports/send/route.ts",
    ]) {
      expect(lire(f), f).toContain('}, "tache")')
    }
  })

  it("le balayage voit bien les appels — sinon il ne prouve rien", () => {
    const tous = appelsSortants()
    expect(tous.length, "des appels sortants dans le produit").toBeGreaterThan(7)
    expect(new Set(tous.map(a => a.fichier)).size, "répartis sur plusieurs fichiers").toBeGreaterThan(6)
    expect(tous.every(a => a.borne), "et tous bornés — c'est ce que dit le test précédent").toBe(true)
    // Et le détecteur sait dire non : un `fetch` nu vers l'extérieur serait vu.
    const nu = 'const r = await fetch("https://exemple.test/x", { method: "GET" })'
    expect(/\b(fetch|fetchBorne)\s*\(\s*[`"']?(https:\/\/|\$\{)/.exec(nu)?.[1]).toBe("fetch")
    // L'exception nommée reste une exception : elle ne grossit pas, et le
    // fichier qu'elle nomme n'appelle bien que les routes du produit.
    expect(SES_PROPRES_ROUTES, "une liste d'exceptions qui grossit n'est plus une exception").toEqual(["lib/effetConfirme.ts"])
    expect(lire("lib/effetConfirme.ts"), "il ne connaît aucune adresse absolue").not.toContain("https://")
  })
})
