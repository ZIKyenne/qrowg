// Un refus de mémoire n'efface pas l'écran — garde de classe.
//
// Relevé du 14 septembre. Soixante-quinze accès à `localStorage` /
// `sessionStorage` dans vingt-trois fichiers. **Quinze** n'étaient protégés par
// rien ; les soixante autres l'étaient par un `try { … } catch {}` écrit sur
// place — soixante copies du même geste.
//
// En navigation privée Safari, avec les données de site bloquées, ou sous une
// politique d'entreprise, `localStorage` existe et **lève** au premier appel :
//
//   BuilderV4.tsx:301
//     const [sidebarCollapsed] = useState(() => {
//       if (typeof window !== "undefined") return localStorage.getItem(…) === "true"
//     })
//
//   Une exception dans un initialiseur de `useState` n'est pas rattrapée : le
//   composant ne monte pas. L'éditeur entier devient un écran blanc, pour une
//   préférence de barre latérale repliée.
//
//   DashboardShell.tsx:273  la couleur d'accent du commerçant ne charge plus
//   builderHooks.ts:159     l'écriture lève à chaque poignée de redimensionnement
//   profile/page.tsx:319    l'enregistrement du profil s'interrompt au milieu
//
// Le produit avait déjà le bon geste — `browserStorage()` sonde le stockage par
// une écriture jetable, parce que certains navigateurs exposent l'objet et ne
// lèvent qu'à la première écriture. Mais il vivait dans `draftStore.ts`, un
// module de l'éditeur, et lui seul s'en servait.
//
// La classe : **un refus de mémoire n'efface pas l'écran.**

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  stockage, memoireDisponible, oublierLaSonde,
  lire, ecrire, oublier, lireJson, ecrireJson,
} from "./memoireDuNavigateur"
import { browserStorage } from "@/app/dashboard/builder/draftStore"

const SRC = path.join(__dirname, "..")
const lireFichier = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

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

/** Un navigateur qui se comporte comme Safari en navigation privée. */
function navigateurQuiRefuse(quand: "toujours" | "a-l-ecriture") {
  const vrai = { getItem: () => { throw new Error("SecurityError") }, setItem: () => { throw new Error("SecurityError") }, removeItem: () => {} }
  const sournois = { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError") }, removeItem: () => {} }
  return quand === "toujours" ? vrai : sournois
}

const vraiWindow = (globalThis as any).window

function poserNavigateur(local: unknown, session: unknown = local) {
  ;(globalThis as any).window = { localStorage: local, sessionStorage: session }
  oublierLaSonde()
}

describe("le navigateur a le droit de refuser", () => {
  beforeEach(() => oublierLaSonde())
  afterEach(() => { ;(globalThis as any).window = vraiWindow; oublierLaSonde() })

  function memoireDeTest() {
    const m = new Map<string, string>()
    return {
      getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
      setItem: (k: string, v: string) => { m.set(k, v) },
      removeItem: (k: string) => { m.delete(k) },
      taille: () => m.size,
    }
  }

  it("un navigateur qui répond se souvient", () => {
    const m = memoireDeTest()
    poserNavigateur(m)
    expect(memoireDisponible()).toBe(true)
    expect(ecrire("couleur", "#39FF8F")).toBe(true)
    expect(lire("couleur")).toBe("#39FF8F")
    oublier("couleur")
    expect(lire("couleur")).toBeNull()
    // La sonde ne laisse rien derrière elle.
    expect(m.taille()).toBe(0)
  })

  it("un navigateur qui lève ne casse rien — il dit non", () => {
    poserNavigateur(navigateurQuiRefuse("toujours"))
    expect(memoireDisponible()).toBe(false)
    expect(() => lire("couleur")).not.toThrow()
    expect(lire("couleur")).toBeNull()
    expect(ecrire("couleur", "#000"), "l'appelant peut le dire au lieu de le croire fait").toBe(false)
    expect(() => oublier("couleur")).not.toThrow()
  })

  it("le sournois — celui qui expose l'objet et ne lève qu'à l'écriture", () => {
    // C'est exactement ce cas qui justifie la sonde : sans elle, `getItem`
    // répond, on croit la mémoire disponible, et la première écriture casse.
    poserNavigateur(navigateurQuiRefuse("a-l-ecriture"))
    expect(memoireDisponible()).toBe(false)
    expect(ecrire("x", "1")).toBe(false)
    expect(lire("x")).toBeNull()
  })

  it("en rendu serveur, il n'y a pas de navigateur du tout", () => {
    ;(globalThis as any).window = undefined
    oublierLaSonde()
    expect(stockage()).toBeNull()
    expect(lire("x")).toBeNull()
    expect(ecrire("x", "1")).toBe(false)
    expect(lireJson("x", { repli: true })).toEqual({ repli: true })
  })

  it("durable et onglet sont deux mémoires distinctes", () => {
    const d = memoireDeTest(), o = memoireDeTest()
    poserNavigateur(d, o)
    ecrire("vu", "1", "onglet")
    expect(lire("vu", "onglet")).toBe("1")
    expect(lire("vu"), "l'onglet n'écrit pas dans le durable").toBeNull()
  })

  it("un contenu illisible rend le repli, jamais une exception", () => {
    const m = memoireDeTest()
    poserNavigateur(m)
    m.setItem("liste", "{ceci n'est pas du json")
    expect(lireJson("liste", ["repli"])).toEqual(["repli"])
    m.setItem("liste", "null")
    expect(lireJson("liste", ["repli"]), "`null` écrit n'est pas une valeur").toEqual(["repli"])
    expect(ecrireJson("liste", ["a", "b"])).toBe(true)
    expect(lireJson("liste", [])).toEqual(["a", "b"])
  })

  it("une valeur circulaire est refusée, pas jetée à la figure de l'appelant", () => {
    poserNavigateur(memoireDeTest())
    const boucle: any = {}; boucle.soi = boucle
    expect(ecrireJson("boucle", boucle)).toBe(false)
  })

  it("le brouillon de l'éditeur passe par le même geste — pas par une copie", () => {
    // `draftStore.browserStorage` était l'original ; il réexporte maintenant.
    expect(browserStorage).toBe(stockage)
    expect(lireFichier("app/dashboard/builder/draftStore.ts"))
      .toContain('export const browserStorage = stockage')
  })
})

describe("garde de classe : un refus de mémoire n'efface pas l'écran", () => {
  it("aucun fichier du produit ne touche localStorage directement", () => {
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/memoireDuNavigateur.ts") continue   // le seul endroit qui a le droit
      fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => {
        if (/\b(?:window\.)?(?:localStorage|sessionStorage)\s*\.\s*(?:getItem|setItem|removeItem|clear)\s*\(/.test(l))
          fautes.push(`${rel}:${i + 1}`)
      })
    }
    expect(fautes, "passer par lib/memoireDuNavigateur").toEqual([])
  })

  it("et le balayage voit bien où la mémoire est utilisée — sinon il ne prouve rien", () => {
    let appels = 0, fichiersConcernes = 0
    for (const f of fichiers()) {
      if (path.relative(SRC, f) === "lib/memoireDuNavigateur.ts") continue
      const src = fs.readFileSync(f, "utf8")
      const n = (src.match(/\b(?:lire|ecrire|oublier|lireJson|ecrireJson)\(/g) || []).length
      if (/from "@\/lib\/memoireDuNavigateur"/.test(src)) { fichiersConcernes++; appels += n }
    }
    expect(fichiersConcernes, "des fichiers qui se souviennent de quelque chose").toBeGreaterThan(15)
    expect(appels, "et beaucoup d'appels, tous sûrs").toBeGreaterThan(50)
  })

  it("le geste sonde avant de promettre", () => {
    // Sans l'écriture jetable, le navigateur sournois passe pour disponible et
    // la première vraie écriture casse l'appelant.
    const mod = lireFichier("lib/memoireDuNavigateur.ts")
    expect(mod).toContain("brut.setItem(jeton")
    expect(mod).toContain("brut.removeItem(jeton)")
    expect(mod).toContain("un refus de mémoire n'efface pas l'écran")
  })
})
