// Une réponse ne parle que si elle est encore attendue — garde de classe.
//
// Relevé du 14 septembre. Douze effets ATTENDENT (`await`, `.then`) puis POSENT
// un état, avec des dépendances qui changent — donc deux réponses possibles en
// vol pour deux questions différentes. Six portaient déjà le bon geste, six ne
// l'avaient pas.
//
//   QRStudio.tsx:385   deps = [activeId, statsPeriod]
//     fetch(`/api/qr-stats/${activeId}?period=${statsPeriod}`)
//       .then(d => setStats(d))
//       .finally(() => setStatsLoading(false))
//
//   Deux QR cliqués coup sur coup : la réponse du PREMIER arrive en dernier et
//   s'installe sous le nom du SECOND. Le commerçant lit 312 scans en face du
//   mauvais QR. Le `finally` fait pire : la réponse périmée éteint le voyant de
//   chargement pendant que la bonne est toujours en route.
//
//   templates/page.tsx:765  la vérification d'adresse écrivait « disponible »
//                           sur une adresse qu'on ne tapait plus
//   DashboardShell.tsx:299  le compteur de messages d'une page sur une autre
//
// Et ceux qui avaient raison écrivaient le geste **sous trois noms** :
// `cancelled` (4), `vivant` (2), `alive` (3) — neuf copies. Le relevé initial
// n'en voyait que six : c'est cette garde qui a trouvé les trois dernières,
// dans `PrintStudioClient`. Elles étaient justes ; elles étaient introuvables.
//
// La classe : **une réponse ne parle que si elle est encore attendue.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { attente } from "./reponseAttendue"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

describe("le geste, une fois pour toutes", () => {
  it("une attente ouverte laisse parler", () => {
    const a = attente()
    expect(a.encoreAttendue()).toBe(true)
    let vu: string | null = null
    a.siEncoreLa((v: string) => { vu = v })("312 scans")
    expect(vu).toBe("312 scans")
  })

  it("une attente abandonnée ne laisse plus rien poser", () => {
    const a = attente()
    a.abandonner()
    expect(a.encoreAttendue()).toBe(false)
    let pose = 0
    a.siEncoreLa(() => { pose++ })()
    a.siEncoreLa(() => { pose++ })()
    expect(pose, "la réponse en retard se tait").toBe(0)
  })

  it("abandonner deux fois ne rouvre pas l'attente", () => {
    const a = attente()
    a.abandonner(); a.abandonner()
    expect(a.encoreAttendue()).toBe(false)
  })

  it("deux attentes sont indépendantes — c'est tout l'intérêt", () => {
    const premiere = attente(), seconde = attente()
    premiere.abandonner()
    expect(premiere.encoreAttendue()).toBe(false)
    expect(seconde.encoreAttendue()).toBe(true)
  })

  it("`abandonner` se rend tel quel comme nettoyage d'effet", () => {
    // `return a.abandonner` ne doit pas dépendre du `this` de l'objet.
    const a = attente()
    const nettoyage = a.abandonner
    nettoyage()
    expect(a.encoreAttendue()).toBe(false)
  })

  it("l'enrobage garde les arguments et n'en invente pas", () => {
    const a = attente()
    const vus: unknown[] = []
    a.siEncoreLa((...args: unknown[]) => { vus.push(args) })(1, "deux", null)
    expect(vus).toEqual([[1, "deux", null]])
  })

  it("le scénario du relevé, joué dans l'ordre qui casse", () => {
    // Le commerçant clique le QR A, puis le QR B. React nettoie l'effet de A
    // AVANT de relancer celui de B ; la réponse de A arrive après.
    let affiche: string | null = null
    let voyant = true
    const posePour = (qr: string) => {
      const a = attente()
      return {
        abandonner: a.abandonner,
        repond: a.siEncoreLa(() => { affiche = qr }),
        fini: a.siEncoreLa(() => { voyant = false }),
      }
    }
    const A = posePour("A")
    A.abandonner()          // deps changent : React nettoie
    const B = posePour("B")
    A.repond()              // la lente réponse de A arrive enfin
    A.fini()
    expect(affiche, "ce n'est pas A qui est à l'écran").toBeNull()
    expect(voyant, "et A n'éteint pas le voyant de B").toBe(true)
    B.repond(); B.fini()
    expect(affiche).toBe("B")
    expect(voyant).toBe(false)
  })
})

describe("les six endroits du relevé attendent maintenant leur tour", () => {
  it("les statistiques d'un QR — le plus coûteux", () => {
    // Réancré sur l'intention (lot v129) : l'appel passe désormais par `lireDe`,
    // et ce qui compte ici n'a pas changé — la réponse ne pose son état, voyant
    // compris, que si c'est encore ce QR-là qu'on regarde.
    const src = lire("app/dashboard/qr-codes/QRStudio.tsx")
    expect(src).toMatch(/\/api\/qr-stats\/\$\{activeId\}\?period=\$\{statsPeriod\}/)
    expect(src, "l'état ne se pose qu'à l'intérieur de l'attente").toContain("a.siEncoreLa(({ valeur, refus }) => {")
    expect(src, "le voyant aussi : une réponse périmée l'éteignait").toMatch(/a\.siEncoreLa\([\s\S]{0,260}setStatsLoading\(false\)/)
  })

  it("la vérification d'adresse et le compteur de messages", () => {
    expect(lire("app/dashboard/templates/page.tsx")).toContain("a.abandonner(); clearTimeout(t)")
    expect(lire("app/dashboard/DashboardShell.tsx")).toContain("a.siEncoreLa(({ count }: any)")
  })

  it("les trois bascules, tenues par la même règle", () => {
    // Le risque y est théorique — une règle qui souffre des exceptions au cas
    // par cas n'est plus une règle.
    expect(lire("app/dashboard/builder/BuilderV4.tsx")).toContain("if (!att.encoreAttendue()) return")
    // Même réancrage (lot v129) : la forme a changé, le geste non.
    expect(lire("app/dashboard/qr-link/page.tsx")).toContain("a.siEncoreLa(({ valeur, refus }) =>")
    expect(lire("app/generateur-qr-code/GeneratorClient.tsx")).toContain("a.siEncoreLa((d: any) =>")
  })
})

describe("garde de classe : une réponse encore attendue", () => {
  /** Le corps d'un `useEffect`, et ses dépendances. */
  function effets(): { rel: string; ligne: number; corps: string; deps: string }[] {
    const out: { rel: string; ligne: number; corps: string; deps: string }[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      const L = fs.readFileSync(f, "utf8").split("\n")
      for (const [i, l] of L.entries()) {
        if (!/\buseEffect\(/.test(l)) continue
        let prof = 0, ouvert = false, fin = -1
        for (let j = i; j < L.length && j < i + 120; j++) {
          for (const c of L[j]) {
            if (c === "(" || c === "{" || c === "[") { prof++; ouvert = true }
            else if (c === ")" || c === "}" || c === "]") prof--
          }
          if (ouvert && prof <= 0) { fin = j; break }
        }
        if (fin < 0) continue
        const corps = L.slice(i, fin + 1).join("\n")
        const m = /\},\s*\[([^\]]*)\]\s*\)\s*$/.exec(corps.trim())
        out.push({ rel, ligne: i + 1, corps, deps: m ? m[1].trim() : "?" })
      }
    }
    return out
  }

  const ATTEND = /\bawait\b|\.then\(/
  const POSE = /\bset[A-Z]\w*\(/
  const GESTE = /attente\(/

  /** Ceux qui peuvent avoir deux réponses en vol : ils attendent, ils posent, et leurs dépendances changent. */
  function courses() {
    return effets().filter(e => ATTEND.test(e.corps) && POSE.test(e.corps) && e.deps !== "" && e.deps !== "?")
  }

  it("aucun effet qui peut se faire doubler ne pose un état sans attente", () => {
    const fautes = courses().filter(e => !GESTE.test(e.corps)).map(e => `${e.rel}:${e.ligne} — deps [${e.deps}]`)
    expect(fautes, "une réponse périmée peut s'y installer").toEqual([])
  })

  /** L'argument d'un `.then(`/`.catch(`/`.finally(`, parenthèses équilibrées. */
  function rappels(corps: string): string[] {
    const out: string[] = []
    for (const m of corps.matchAll(/\.(?:then|catch|finally)\(/g)) {
      let prof = 1, i = m.index! + m[0].length
      const debut = i
      for (; i < corps.length && prof > 0; i++) {
        if (corps[i] === "(") prof++
        else if (corps[i] === ")") prof--
      }
      out.push(corps.slice(debut, i - 1))
    }
    return out
  }

  it("et aucun rappel de ces effets ne pose un état sans passer par l'attente", () => {
    // Ouvrir une attente au début de l'effet ne suffit pas : c'est la LIGNE qui
    // pose l'état qui doit la nommer. Un seul `.then` oublié rouvre la porte.
    const fautes: string[] = []
    for (const e of courses())
      for (const r of rappels(e.corps))
        if (POSE.test(r) && !/siEncoreLa|encoreAttendue\(\)/.test(r))
          fautes.push(`${e.rel}:${e.ligne} — ${r.trim().slice(0, 60)}…`)
    expect(fautes, "siEncoreLa(...) ou un encoreAttendue() en tête").toEqual([])
  })

  it("le geste n'est plus réécrit à la main, sous aucun nom", () => {
    // `cancelled` (4), `vivant` (2), `alive` (3), `active` (1) : quatre mots
    // pour une chose. La règle est donc une FORME, pas une liste de noms — un
    // drapeau booléen qu'on rabaisse DANS LE NETTOYAGE de l'effet est toujours
    // cette attente-là, quel que soit son nom.
    //
    // Et seulement celui-là : un verrou « envoyé une fois » (`dwellSent`, dans
    // le suivi de lecture de la page publique) est un booléen d'effet lui
    // aussi, mais il ne se rabaisse jamais au départ — ce n'est pas une
    // attente, et la règle ne doit pas l'avaler.
    const fautes: string[] = []
    for (const e of effets()) {
      const net = /return\s*(?:\(\s*\)\s*=>|function\s*\w*\s*\(\s*\))\s*\{([\s\S]*)\}/.exec(e.corps)
      const rabaisses = new Set(
        [...(net?.[1] ?? "").matchAll(/(\w+)\s*=\s*(?:true|false)\b/g)].map(m => m[1]),
      )
      for (const [n, l] of e.corps.split("\n").entries()) {
        const d = /^\s*let\s+(\w+)\s*=\s*(?:true|false)\s*(?:\/\/.*)?$/.exec(l)
        if (d && rabaisses.has(d[1])) fautes.push(`${e.rel}:${e.ligne + n} — ${l.trim()}`)
      }
    }
    expect(fautes, "passer par lib/reponseAttendue").toEqual([])
  })

  it("le balayage voit bien les effets — sinon il ne prouve rien", () => {
    const tous = effets()
    expect(tous.length, "des useEffect dans le produit").toBeGreaterThan(80)
    const c = courses()
    expect(c.length, "dont certains peuvent se faire doubler").toBeGreaterThan(5)
    expect(c.filter(e => GESTE.test(e.corps)).length, "et il les reconnaît gardés").toBeGreaterThan(5)
  })

  it("le geste vit à un seul endroit", () => {
    const mod = lire("lib/reponseAttendue.ts")
    expect(mod).toContain("export function attente")
    expect(mod).toContain("une réponse ne parle que si elle est encore attendue")
  })
})
