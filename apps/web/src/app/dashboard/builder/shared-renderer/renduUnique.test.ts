import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { SHARED_RENDERER_BLOCKS } from "./architecture"

// Vague 4, point 4 — UN SEUL MOTEUR DE RENDU (24 nov.).
//
// Les trois anciens rendus — la page publique (renduLegacy), l'aperçu de
// l'éditeur (builderPreview) et l'aperçu de la galerie (TemplatePreviewModal) —
// gardaient chacun une copie des 163 blocs déjà servis par le renderer partagé :
// environ 5 800 lignes inatteignables (registry.test.ts garantit que tout type
// activé a ses deux adaptateurs, et les trois appelants les consultent d'abord).
// Ces copies ne s'exécutaient plus, mais elles se corrigeaient encore, et les
// gardes qui les lisaient donnaient un faux sentiment de sécurité.
//
// Elles ont été retirées. Ce fichier empêche qu'elles reviennent, et fait
// descendre la taille de ces trois fichiers à mesure que les 32 derniers blocs
// rejoignent le moteur partagé. Le retour arrière d'un bloc passe par git.

const ICI = __dirname
const ANCIENS: [string, string, number][] = [
  // [fichier, rôle, plafond de lignes (compté comme ci-dessous, une ligne de
  // plus que `wc -l`) — il ne peut que DESCENDRE]
  // Lot 1 (24 nov.) : 535 / 712 / 978. Lot 2 (affichages simples, 6 blocs) :
  // 432 / 564 / 873. Lot 3 (structure, 5 blocs) : 352 / 452 / 812.
  ["../../../[slug]/renduLegacy.tsx", "la page publique", 352],
  ["../builderPreview.tsx", "l'aperçu de l'éditeur", 452],
  ["../../templates/TemplatePreviewModal.tsx", "l'aperçu de la galerie", 812],
]

describe("un bloc migré n'a plus qu'un rendu", () => {
  for (const [f, role] of ANCIENS) {
    it(`${role} ne garde aucune copie d'un bloc migré`, () => {
      const src = readFileSync(join(ICI, f), "utf8")
      const copies = [...src.matchAll(/case "([a-z0-9_]+)":/g)].map(m => m[1]).filter(t => SHARED_RENDERER_BLOCKS.has(t))
      expect(copies, `${f} : ces blocs ont leur vue partagée, leur copie doit disparaître`).toEqual([])
    })
  }
})

describe("les anciens rendus ne font que maigrir", () => {
  for (const [f, role, plafond] of ANCIENS) {
    it(`${role} : ${plafond} lignes au plus`, () => {
      const n = readFileSync(join(ICI, f), "utf8").split("\n").length
      expect(n, `${f} a grossi : un bloc s'écrit dans le renderer partagé, pas ici`).toBeLessThanOrEqual(plafond)
    })
  }
})
