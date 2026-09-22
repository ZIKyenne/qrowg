// Une version corrigée ne redescend pas — garde de classe.
//
// Relevé du 22 septembre, sur l'arbre des dépendances. Deux **failles
// critiques** dans la version de Next que le produit installait (16.2.12) :
//
//   GHSA-p293-qw3h-jr36   exécution de code à distance, non authentifiée, sur
//                         un serveur hébergé sous Windows. « There is no known
//                         workaround. » QRowg est déployé sur Vercel, donc sous
//                         Linux : la production n'était pas exposée. Un
//                         développeur qui lance le serveur sur sa machine
//                         Windows, si.
//
//   GHSA-xv57-4mr9-gjw6   exécution de code à distance, non authentifiée, dans
//                         l'API d'optimisation d'images, par un fichier AVIF.
//                         **Celle-ci touchait la production** : le produit
//                         active `formats: ["image/avif", "image/webp"]` et
//                         optimise les photos que les commerçants téléversent
//                         sur Supabase.
//
// Les deux sont corrigées en **16.3.3**. Le produit déclarait `~16.2.11`, un
// intervalle qui ne peut PAS atteindre 16.3 : la correction n'était pas à un
// `pnpm update` près, il fallait changer l'intervalle.
//
// Neuf autres alertes, moins graves, sont tombées avec : `sharp` (libheif, sur
// le chemin de production, via l'optimiseur d'images), puis `js-yaml`,
// `fast-uri`, `vitest` et `baseline-browser-mapping`, tous limités à l'outillage
// de développement. L'arbre est à **zéro alerte**.
//
// ── Pourquoi une garde, et ce qu'elle peut vraiment ────────────────────────
//
// Elle ne relance pas l'audit : cela demanderait le réseau, et une suite de
// tests qui dépend du réseau ne dit plus si le code est bon. Elle vérifie ce qui
// est vérifiable hors ligne et qui suffit à empêcher le retour en arrière : que
// les intervalles déclarés ne puissent pas redescendre sous la version corrigée.
//
// C'est un plancher, pas un plafond : monter plus haut reste libre, et c'est
// même ce qu'on veut. Ce qui est interdit, c'est de repasser sous une version
// dont on sait qu'elle est trouée.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

const RACINE = path.join(__dirname, "..", "..", "..", "..")
const manifeste = JSON.parse(fs.readFileSync(path.join(RACINE, "package.json"), "utf8")) as {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  pnpm: { overrides: Record<string, string> }
}

/**
 * Les planchers, avec l'avis qui les impose. Descendre sous l'un d'eux, c'est
 * réinstaller une faille connue — d'où le nom de chaque avis, écrit ici pour
 * qu'on puisse aller le lire plutôt que de me croire sur parole.
 */
const PLANCHERS: { paquet: string; ou: "dependencies" | "devDependencies" | "overrides"; min: string; avis: string; portee: string }[] = [
  { paquet: "next", ou: "dependencies", min: "16.3.3", portee: "PRODUCTION",
    avis: "GHSA-p293-qw3h-jr36 (RCE Windows) + RCE optimisation d'images AVIF" },
  { paquet: "sharp", ou: "overrides", min: "0.35.4", portee: "PRODUCTION",
    avis: "GHSA-rgj7-g3m4-5g8c — libheif, via l'optimiseur d'images de Next" },
  { paquet: "vitest", ou: "devDependencies", min: "4.1.11", portee: "développement",
    avis: "traversée de chemin dans @vitest/mocker" },
  { paquet: "js-yaml@4", ou: "overrides", min: "4.3.2", portee: "développement",
    avis: "consommation quadratique de processeur sur les clés de fusion YAML" },
  { paquet: "fast-uri", ou: "overrides", min: "3.1.6", portee: "développement",
    avis: "confusion d'hôte et requêtes falsifiées côté serveur" },
  { paquet: "baseline-browser-mapping", ou: "overrides", min: "2.11.0", portee: "développement",
    avis: "arrêt du processus sur une entrée invalide" },
]

/** Le numéro plancher d'un intervalle comme `~16.3.3`, `^0.35.4`, `4.1.11`. */
export function plancherDe(intervalle: string): number[] | null {
  const m = /^[~^>=]*\s*(\d+)\.(\d+)\.(\d+)/.exec(intervalle.trim())
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

/** `a` est-il au moins `b` ? */
export function auMoins(a: number[], b: number[]): boolean {
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true
    if (a[i] < b[i]) return false
  }
  return true
}

describe("garde de classe : aucune dépendance ne redescend sous sa version corrigée", () => {
  it("les six planchers sont tenus, et chacun porte son avis", () => {
    for (const p of PLANCHERS) {
      const source = p.ou === "overrides" ? manifeste.pnpm.overrides
        : p.ou === "devDependencies" ? manifeste.devDependencies : manifeste.dependencies
      const declare = source[p.paquet]
      expect(declare, `${p.paquet} est déclaré dans ${p.ou}`).toBeTruthy()
      const a = plancherDe(declare), b = plancherDe(p.min)
      expect(a, `${p.paquet} : intervalle lisible (« ${declare} »)`).not.toBeNull()
      expect(auMoins(a!, b!), `${p.paquet} « ${declare} » doit rester ≥ ${p.min} — ${p.avis}`).toBe(true)
      expect(p.avis.length, `${p.paquet} : la raison est écrite`).toBeGreaterThan(20)
    }
  })

  it("`~16.2.11` n'aurait jamais atteint le correctif — c'est le piège de ce lot", () => {
    // Un intervalle `~` fige le mineur : `~16.2.11` va de 16.2.11 à 16.2.x, et
    // la correction est en 16.3.3. Aucune mise à jour automatique n'y menait.
    // C'est pour cela que l'alerte pouvait dormir : l'outil disait « à jour ».
    expect(auMoins(plancherDe("~16.2.11")!, plancherDe("16.3.3")!), "16.2.11 < 16.3.3").toBe(false)
    expect(auMoins(plancherDe("~16.3.3")!, plancherDe("16.3.3")!), "…et l'intervalle posé y arrive").toBe(true)
    expect(manifeste.dependencies.next, "l'intervalle déclaré vise bien la ligne corrigée").toMatch(/16\.3\./)
  })

  it("les deux planchers de PRODUCTION sont distingués des autres", () => {
    // Les quatre autres ne concernent que l'outillage : les confondre ferait
    // traiter une gêne de développement comme une faille de production, et
    // finirait par faire ignorer les deux.
    const prod = PLANCHERS.filter(p => p.portee === "PRODUCTION").map(p => p.paquet)
    expect(prod.sort(), "ce qui part chez le client").toEqual(["next", "sharp"])
    expect(PLANCHERS.filter(p => p.portee === "développement").length).toBe(4)
  })

  it("le comparateur sait dire non — sinon il ne dirait jamais oui", () => {
    expect(auMoins([16, 3, 5], [16, 3, 3]), "un correctif plus récent").toBe(true)
    expect(auMoins([16, 3, 3], [16, 3, 3]), "la version exacte").toBe(true)
    expect(auMoins([16, 3, 2], [16, 3, 3]), "un correctif manquant").toBe(false)
    expect(auMoins([16, 2, 99], [16, 3, 0]), "un mineur en dessous").toBe(false)
    expect(auMoins([17, 0, 0], [16, 3, 3]), "un majeur au-dessus").toBe(true)
    expect(plancherDe("^0.35.4")).toEqual([0, 35, 4])
    expect(plancherDe("~16.3.3")).toEqual([16, 3, 3])
    expect(plancherDe("4.1.11")).toEqual([4, 1, 11])
    expect(plancherDe("latest"), "ce qui n'est pas un numéro").toBeNull()
  })
})
