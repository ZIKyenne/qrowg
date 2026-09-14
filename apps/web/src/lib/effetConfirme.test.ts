// L'écran efface ce que le serveur a refusé d'effacer — garde de classe.
//
// Relevé du 14 septembre, en balayant les appels réseau qui MODIFIENT (POST,
// PATCH, DELETE) et ce que l'écran fait dans les lignes qui suivent. Cinq
// endroits agissent sans avoir regardé la réponse :
//
//   DomainRoutesPanel.deleteRoute   la ligne quitte la liste quoi qu'il arrive —
//                                   et sans try/catch : réseau muet, la fonction
//                                   s'arrête là, la ligne reste figée
//   DomainRoutesPanel.addRoute      `fetch` nu : même gel du bouton
//   QRStudio.removeDest             le pire : l'écran annonce que le QR est
//                                   revenu à sa page, la redirection est encore
//                                   en base. Le QR mène toujours ailleurs.
//   QRStudio.saveDest               le `return` du refus sortait AVANT
//                                   `setDestLoading(false)` : bouton figé
//   QRStudio.restoreDest            un refus ne faisait rien du tout : ni
//                                   changement, ni message
//   PrintStudioClient.saveDesign    « Enregistré » sur un refus. La route refuse
//                                   vraiment : 413 « Design trop volumineux ».
//
// Les routes répondaient correctement : `{ ok: true }` en succès, `{ error }` +
// statut en refus — aucune des réponses d'erreur de l'API ne sort en 200.
//
// Et leurs voisines lisent, elles. Le produit connaît le geste ; six endroits
// l'avaient oublié.
//
// La classe : **l'écran ne montre un changement que si le serveur l'a fait.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { serveurAFait, refusDuServeur, effetDe, STATUT_RESEAU_MUET } from "./effetConfirme"
import { messageDeRoute } from "./messageDeRoute"
import { USER_MESSAGES } from "@/app/dashboard/builder/builderErrors"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

describe("ce que « le serveur l'a fait » veut dire", () => {
  it("un 2xx avec le corps que nos routes renvoient", () => {
    expect(serveurAFait({ statut: 200, corps: { ok: true } })).toBe(true)
    expect(serveurAFait({ statut: 201, corps: { route: { id: "r1" } } })).toBe(true)
    expect(serveurAFait({ statut: 204, corps: null })).toBe(true)
  })

  it("les trois refus du relevé", () => {
    expect(serveurAFait({ statut: 401, corps: { error: "Non authentifié" } })).toBe(false)
    expect(serveurAFait({ statut: 404, corps: { error: "QR introuvable" } })).toBe(false)
    expect(serveurAFait({ statut: 413, corps: { error: "Design trop volumineux (64 Ko maximum)." } })).toBe(false)
  })

  it("et le réseau muet, qui n'est pas un succès", () => {
    expect(serveurAFait({ statut: STATUT_RESEAU_MUET, corps: null })).toBe(false)
    expect(serveurAFait(null)).toBe(false)
    expect(serveurAFait(undefined)).toBe(false)
  })

  it("un 200 qui porte une erreur n'est pas un succès non plus", () => {
    // Ceinture : aujourd'hui aucune route du produit ne fait ça. Si l'une s'y
    // mettait, l'écran ne prendrait pas son refus pour une réussite.
    expect(serveurAFait({ statut: 200, corps: { error: "Quota atteint." } })).toBe(false)
    expect(serveurAFait({ statut: 200, corps: { ok: false } })).toBe(false)
    // Mais un `error` vide n'est pas une erreur.
    expect(serveurAFait({ statut: 200, corps: { error: "" } })).toBe(true)
  })
})

describe("ce qu'on dit quand il ne l'a pas fait", () => {
  it("rien, quand il l'a fait — un écran ne dit pas les deux", () => {
    expect(refusDuServeur({ statut: 200, corps: { ok: true } }, "Raté.")).toBeNull()
  })

  it("le message ne se réinvente pas : il vient de messageDeRoute (lot v71)", () => {
    const r = { statut: 413, corps: { error: "Design trop volumineux (64 Ko maximum)." } }
    expect(refusDuServeur(r, "Le design n'a pas pu être enregistré."))
      .toBe(messageDeRoute(413, r.corps, "Le design n'a pas pu être enregistré."))
    // Donc : une vraie phrase de la route passe telle quelle…
    expect(refusDuServeur(r, "repli")).toContain("64 Ko")
    // …un code déguisé en français ne passe pas.
    expect(refusDuServeur({ statut: 401, corps: { error: "Non authentifié" } }, "repli"))
      .toBe(USER_MESSAGES.UNAUTHORIZED)
  })

  it("et le réseau muet a déjà sa phrase", () => {
    expect(refusDuServeur({ statut: STATUT_RESEAU_MUET, corps: null }, "repli")).toBe(USER_MESSAGES.NETWORK)
    expect(refusDuServeur(null, "repli")).toBe(USER_MESSAGES.NETWORK)
  })
})

describe("l'appel lui-même ne lève jamais", () => {
  const vrai = globalThis.fetch

  it("un réseau muet devient un statut 0, pas une exception", async () => {
    globalThis.fetch = (() => Promise.reject(new Error("Failed to fetch"))) as typeof fetch
    try {
      const r = await effetDe("/api/x", { method: "DELETE" })
      expect(r).toEqual({ statut: STATUT_RESEAU_MUET, corps: null })
      expect(serveurAFait(r)).toBe(false)
    } finally { globalThis.fetch = vrai }
  })

  it("un corps illisible ne fait pas échouer un vrai succès", async () => {
    globalThis.fetch = (() => Promise.resolve({
      status: 204, json: () => Promise.reject(new Error("no body")),
    } as unknown as Response)) as typeof fetch
    try {
      const r = await effetDe("/api/x", { method: "DELETE" })
      expect(serveurAFait(r)).toBe(true)
    } finally { globalThis.fetch = vrai }
  })

  it("et un refus remonte son statut et son corps", async () => {
    globalThis.fetch = (() => Promise.resolve({
      status: 413, json: () => Promise.resolve({ error: "Design trop volumineux (64 Ko maximum)." }),
    } as unknown as Response)) as typeof fetch
    try {
      const r = await effetDe("/api/print-design", { method: "POST" })
      expect(serveurAFait(r)).toBe(false)
      expect(refusDuServeur(r, "repli")).toContain("64 Ko")
    } finally { globalThis.fetch = vrai }
  })
})

describe("les six endroits du relevé lisent maintenant leur réponse", () => {
  it("les routes de domaine", () => {
    const src = lire("app/dashboard/domains/DomainRoutesPanel.tsx")
    expect(src, "la ligne ne quitte la liste que si le serveur l'a retirée")
      .toContain("if (serveurAFait(r)) setRoutes(prev => prev.filter(x => x.id !== id))")
    expect(src.split("effetDe(").length - 1, "les deux appels passent par le module").toBe(2)
    expect(src).toContain('refusDuServeur(r, "Cette route n\'a pas pu être supprimée.")')
  })

  it("la redirection d'un QR — les trois gestes", () => {
    const src = lire("app/dashboard/qr-codes/QRStudio.tsx")
    expect(src.split("effetDe(").length - 1).toBe(3)
    for (const phrase of [
      "La redirection n'a pas pu être retirée.",
      "La redirection n'a pas pu être enregistrée.",
      "Cette redirection n'a pas pu être rétablie.",
    ]) expect(src, `« ${phrase} » manque`).toContain(phrase)
    // Le défaut exact : l'écran oubliait la redirection sans condition.
    for (const [i, ligne] of src.split("\n").entries()) {
      const l = ligne.trim()
      if (l.startsWith("//") || !l.startsWith("setDestOverride(null)")) continue
      const avant = src.split("\n").slice(Math.max(0, i - 4), i).join(" ")
      expect(/serveurAFait\(/.test(avant),
        `QRStudio.tsx:${i + 1} efface la redirection sans regarder la réponse`).toBe(true)
    }
  })

  it("le design imprimable — et son refus a maintenant où s'afficher", () => {
    const src = lire("app/dashboard/print-studio/PrintStudioClient.tsx")
    expect(src).toContain("if (serveurAFait(r)) { setDesignSaved(true)")
    expect(src).toContain('refusDuServeur(r, "Le design n\'a pas pu être enregistré.")')
    expect(src, "un message sans endroit où s'afficher n'existe pas")
      .toContain('role="alert"')
    expect(src).toContain("{designErreur}")
  })

  it("et la route de design refuse bien ce que le message annonce", () => {
    // Le 413 n'est pas une hypothèse : il est écrit dans la route.
    expect(lire("app/api/print-design/route.ts")).toContain("Design trop volumineux (64 Ko maximum).")
  })
})

describe("garde de classe : l'écran ne montre un changement que si le serveur l'a fait", () => {
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

  // Ce qui prouve qu'on a regardé la réponse avant d'agir.
  const LECTURE = /\bres(ponse)?\.(ok|status)\b|serveurAFait\(|\.error\b|\bok\b\s*[?:)]|catch|\.json\(\)/
  // Ce qui change l'écran.
  const ECRAN = /set[A-Z]\w*\(|router\.(push|refresh|replace)|location\.(href|reload)|toast\./

  it("aucun appel qui modifie n'est suivi d'un changement d'écran non vérifié", () => {
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      const lignes = fs.readFileSync(f, "utf8").split("\n")
      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i]
        if (!/await\s+fetch\(/.test(l) || l.trim().startsWith("//")) continue
        // réponse capturée dans une variable : elle sera lue plus bas
        if (/=\s*await\s+fetch\(|return\s+await\s+fetch\(/.test(l)) continue
        let prof = 0, ouvert = false, fin = i
        for (let j = i; j < lignes.length && j < i + 25; j++) {
          for (const c of lignes[j]) { if (c === "(") { prof++; ouvert = true } else if (c === ")") prof-- }
          if (ouvert && prof <= 0) { fin = j; break }
        }
        const appel = lignes.slice(i, fin + 1).join(" ")
        const meth = /method\s*:\s*["'](\w+)["']/.exec(appel)
        if (!meth || meth[1] === "GET") continue
        const suite = lignes.slice(fin + 1, fin + 7)
        const iEcran = suite.findIndex(s => ECRAN.test(s) && !s.trim().startsWith("//"))
        if (iEcran < 0) continue
        if (LECTURE.test(suite.slice(0, iEcran + 1).join(" "))) continue
        fautes.push(`${rel}:${i + 1} (${meth[1]}) → ${suite[iEcran].trim().slice(0, 70)}`)
      }
    }
    expect(fautes, "acte un changement que le serveur n'a peut-être pas fait").toEqual([])
  })

  it("le balayage voit bien les appels qui modifient — sinon il ne prouve rien", () => {
    let vus = 0
    for (const f of fichiers()) {
      for (const l of fs.readFileSync(f, "utf8").split("\n")) {
        if (/await\s+fetch\(|effetDe\(/.test(l) && !l.trim().startsWith("//")) vus++
      }
    }
    expect(vus).toBeGreaterThan(40)
  })

  it("et le module ne double pas messageDeRoute", () => {
    // Une seule traduction des réponses dans le produit : celle du lot v71.
    const mod = lire("lib/effetConfirme.ts")
    expect(mod).toContain('import { messageDeRoute } from "./messageDeRoute"')
    for (const [i, ligne] of mod.split("\n").entries()) {
      const l = ligne.trim()
      if (l.startsWith("//") || l.startsWith("*")) continue
      expect(/USER_MESSAGES|"Connexion|"Votre session/.test(l),
        `effetConfirme.ts:${i + 1} réécrit une phrase que messageDeRoute possède`).toBe(false)
    }
  })
})
