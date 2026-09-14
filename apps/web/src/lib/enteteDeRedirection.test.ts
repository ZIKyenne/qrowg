// La leçon apprise sur /q, et les écrans où elle ne l'était pas — garde de classe.
//
// Relevé du 14 septembre, sur toutes les redirections que le produit émet :
//
//   app/q/[code]/route.ts               l.21    302            no-store
//   app/api/domains/resolve/route.ts    l.57    301            AUCUN en-tête
//   app/api/domains/resolve/route.ts    l.87    301 (au choix) AUCUN en-tête
//   app/api/domains/resolve/route.ts    l.105   301 (au choix) AUCUN en-tête
//   app/api/domains/resolve/route.ts    l.142   302            AUCUN en-tête
//   app/api/domains/resolve/route.ts    l.157   302            AUCUN en-tête
//   app/api/subdomain/resolve/route.ts  l.64    302            AUCUN en-tête
//
// La redirection du QR — dont la destination se change à tout moment — porte
// `Cache-Control: no-store, must-revalidate`. Les six autres, dont les
// destinations sont tout aussi modifiables depuis le tableau de bord, n'en
// portaient aucun. Un 301 reste dans le navigateur du visiteur : celui qui l'a
// suivie une fois ne redemande plus.
//
// Et l'écran promettait, en supprimant une règle : « Elle cessera
// immédiatement. » L'aide « 301 vs 302 » parlait de Google, jamais du
// navigateur — le mot n'y figurait pas une seule fois.
//
// La classe : une redirection dont la destination peut changer le dit au
// navigateur, et un écran ne promet pas un effet immédiat qu'il ne produit pas.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  CACHE_REDIRECTION, entetesDeRedirection, estPermanente,
  phraseCacheNavigateur, phraseSuppression, phraseDesactivation,
} from "./enteteDeRedirection"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Les redirections que le produit émet et dont la destination est modifiable. */
const RESOLVEURS = [
  "app/api/domains/resolve/route.ts",
  "app/api/subdomain/resolve/route.ts",
]

describe("la formulation vient du produit, pas de nulle part", () => {
  it("c'est exactement celle que la redirection du QR envoie déjà", () => {
    const q = lire("app/q/[code]/route.ts")
    expect(q, "le cœur du produit a changé d'en-tête : la règle doit être revue")
      .toContain(`"Cache-Control": "${CACHE_REDIRECTION}"`)
  })

  it("et elle s'ajoute sans écraser les en-têtes déjà là", () => {
    expect(entetesDeRedirection()).toEqual({ "Cache-Control": CACHE_REDIRECTION })
    expect(entetesDeRedirection({ "X-Subdomain": "lecomptoir" })).toEqual({
      "X-Subdomain": "lecomptoir", "Cache-Control": CACHE_REDIRECTION,
    })
    // Personne ne peut désactiver le cache par un `extra` bien placé.
    expect(entetesDeRedirection({ "Cache-Control": "public, max-age=31536000" })["Cache-Control"]).toBe(CACHE_REDIRECTION)
  })
})

describe("permanent veut dire quelque chose pour le navigateur", () => {
  it("301 et 308 sont permanentes, 302 et 307 ne le sont pas", () => {
    expect(estPermanente(301)).toBe(true)
    expect(estPermanente(308)).toBe(true)
    expect(estPermanente(302)).toBe(false)
    expect(estPermanente(307)).toBe(false)
    expect(estPermanente(null)).toBe(false)
  })

  it("l'aide le dit enfin, et seulement quand c'est vrai", () => {
    const p = phraseCacheNavigateur(301)!
    expect(p).toContain("navigateur")
    expect(p).toContain("déjà suivie")
    expect(phraseCacheNavigateur(302), "rien à signaler sur une temporaire").toBeNull()
  })
})

describe("l'écran ne promet plus un effet immédiat qu'il ne produit pas", () => {
  const REGLE = { from_domain: "ancien-site.fr", from_path: "/menu", to_url: "https://lecomptoir.fr/carte", redirect_type: 301, hit_count: 1420 }

  it("le cas du relevé : supprimer une permanente déjà suivie", () => {
    const p = phraseSuppression(REGLE)
    expect(p).toContain("ancien-site.fr/menu")
    expect(p).toContain("https://lecomptoir.fr/carte")
    expect(p, "le nombre de visiteurs concernés").toMatch(/1\s420 visiteurs/)
    expect(p).toContain("navigateur")
    expect(p, "l'ancienne promesse").not.toContain("immédiatement")
  })

  it("sans passage enregistré, on ne cite pas de chiffre", () => {
    const p = phraseSuppression({ ...REGLE, hit_count: 0 })
    expect(p).toContain("déjà suivie")
    expect(p).not.toMatch(/\d/)
  })

  it("une temporaire, elle, cesse vraiment", () => {
    const p = phraseSuppression({ ...REGLE, redirect_type: 302 })
    expect(p).toContain("prochains visiteurs")
    expect(p).not.toContain("navigateur")
  })

  it("et rien ne casse sur une règle abîmée", () => {
    expect(phraseSuppression(null)).toContain("ne s'appliquera plus")
    expect(phraseSuppression({})).toContain("ne s'appliquera plus")
  })

  it("désactiver dit la même vérité que supprimer", () => {
    expect(phraseDesactivation(301)).toContain("continuer")
    expect(phraseDesactivation(302)).toContain("plus personne")
  })

  it("le panneau applique les deux phrases", () => {
    const panel = lire("app/dashboard/redirects/RedirectsPanel.tsx")
    expect(panel).toContain("phraseSuppression(r)")
    expect(panel).toContain("phraseCacheNavigateur(301)")
    // Hors commentaires : la phrase est citée dans celui qui explique le lot.
    const code = panel.split("\n").filter(l => !l.trim().startsWith("//")).join("\n")
    expect(code, "l'ancienne promesse est revenue").not.toContain("Elle cessera immédiatement")
  })
})

describe("garde de classe : une redirection modifiable le dit au navigateur", () => {
  it("chaque redirection des résolveurs porte l'en-tête", () => {
    for (const f of RESOLVEURS) {
      const lignes = lire(f).split("\n")
      let vues = 0
      for (const [i, l] of lignes.entries()) {
        if (!/NextResponse\.redirect\(/.test(l) || l.trim().startsWith("//")) continue
        vues++
        const bloc = lignes.slice(i, i + 4).join(" ")
        expect(/entetesDeRedirection\(|Cache-Control/.test(bloc),
          `${f}:${i + 1} — redirection sans en-tête de cache : ${l.trim()}`).toBe(true)
      }
      expect(vues, `${f} : plus aucune redirection ?`).toBeGreaterThan(0)
    }
  })

  it("et la redirection du QR garde la sienne", () => {
    const q = lire("app/q/[code]/route.ts")
    const lignes = q.split("\n")
    const i = lignes.findIndex(l => l.includes("Location: url.toString()"))
    expect(i, "la redirection du QR a disparu").toBeGreaterThan(-1)
    expect(lignes[i]).toContain("Cache-Control")
  })

  it("personne ne réécrit la formulation dans son coin", () => {
    const marcher = (d: string, out: string[] = []): string[] => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p, out) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
      return out
    }
    let ecrits = 0
    for (const f of marcher(SRC)) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/enteteDeRedirection.ts") continue
      for (const l of fs.readFileSync(f, "utf8").split("\n")) {
        if (!l.includes(CACHE_REDIRECTION)) continue
        ecrits++
        // `/q/[code]` est l'original : il a le droit de porter la sienne en clair,
        // c'est lui qui sert d'oracle. Ailleurs, on passe par le module.
        expect(rel, `${rel} recopie la formulation au lieu de l'importer`).toBe("app/q/[code]/route.ts")
      }
    }
    expect(ecrits, "l'oracle a disparu").toBeGreaterThan(0)
  })
})
