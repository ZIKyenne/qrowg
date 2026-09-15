// Une réponse publique lit la grille, elle ne la récite pas — garde de classe.
//
// Relevé du 14 septembre, en reprenant les 44 points P1 de la revue du
// 4 septembre. Quarante-trois sont faits. Le dernier, **P1-20**, ne l'était
// pas — et le fichier fautif se contredisait lui-même :
//
//   guides.ts:91   « Créer un QR code est-il gratuit ? »
//     `… le plan ${PLANS.free.label} en inclut ${PLANS.free.limits.dyn} …`
//     → « le plan Gratuit en inclut 1 ». Juste, parce qu'elle LIT la grille.
//
//   guides.ts:169  « Peut-on suivre les scans d'un QR code gratuit ? »
//     « Non. »
//     → faux. `plans.ts` donne `dyn: 1` au plan Gratuit : un QR modifiable,
//       donc mesurable, sans payer. Cette réponse RÉCITE, et elle se trompe.
//
// Deux réponses du même fichier, sur deux pages publiques que Google indexe,
// disent le contraire l'une de l'autre. Celle qui se trompe décourage
// exactement les gens que l'autre page vient convaincre.
//
// Deux autres récitaient aussi, sur l'arrêt d'un abonnement : « la redirection
// peut cesser de fonctionner », « tant que l'abonnement associé est en cours ».
// Le produit met en pause au-delà de `limits.dyn` et n'efface rien (lot v82) —
// et il en garde un, gratuitement, pour toujours.
//
// Le produit connaissait déjà la règle : `app/promessesTenues.ts` exige qu'une
// promesse de la grille tarifaire porte une PREUVE — un champ de son plan. Elle
// n'avait jamais été étendue aux guides, qui sont pourtant les pages par
// lesquelles on arrive.
//
// La classe : **une réponse publique lit la grille, elle ne la récite pas.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { GUIDES } from "./guides"
import { PLANS } from "@/lib/plans"

const SRC = fs.readFileSync(path.join(__dirname, "guides.ts"), "utf8")

/** Les mots qui annoncent un fait de la grille : un plan, un prix, une limite. */
const PARLE_DE_LA_GRILLE = /\bgratuit(e|ement)?\b|\babonnement\b|\bplan(s)? (gratuit|payant)|\billimité/i

/** Ce qui prouve qu'une réponse a LU la grille plutôt que de la réciter. */
const LIT_LA_GRILLE = /\$\{PLANS\./

describe("ce que le plan Gratuit permet vraiment", () => {
  it("il inclut au moins un QR modifiable — donc mesurable", () => {
    expect(PLANS.free.limits.dyn).toBeGreaterThan(0)
  })

  it("et les guides le disent, au lieu de dire le contraire", () => {
    const suivi = GUIDES["qr-code-avec-statistiques"]?.faq
      .find(f => /suivre les scans d'un QR code gratuit/i.test(f.q))
    expect(suivi, "la question du relevé existe toujours").toBeTruthy()
    expect(suivi!.a, "elle ne commence plus par « Non »").not.toMatch(/^Non\b/)
    expect(suivi!.a).toContain(PLANS.free.label)
    expect(suivi!.a).toContain(String(PLANS.free.limits.dyn))
    // Et elle garde ce qui était juste : un QR statique n'est pas mesurable.
    expect(suivi!.a).toMatch(/statique/i)
  })

  it("l'arrêt d'un abonnement est décrit comme le produit le fait", () => {
    const g = GUIDES["duree-de-vie-qr-code"]?.faq ?? []
    const arret = g.find(f => /arrête mon abonnement/i.test(f.q))
    const duree = g.find(f => /combien de temps un QR code dynamique/i.test(f.q))
    expect(arret?.a, "rien n'est effacé, les QR au-delà du plan sont mis en pause").toMatch(/pause/i)
    expect(arret?.a).toContain(PLANS.free.label)
    expect(duree?.a, "un QR modifiable reste gratuit").toContain(String(PLANS.free.limits.dyn))
    expect(duree?.a).not.toMatch(/tant que l'abonnement associé est en cours/)
  })

  it("les deux réponses sur la gratuité ne se contredisent plus", () => {
    // Celle qui lisait déjà la grille, et celle qui la récitait.
    const creer = GUIDES["comment-creer-un-qr-code"]?.faq.find(f => /est-il gratuit/i.test(f.q))
    const suivi = GUIDES["qr-code-avec-statistiques"]?.faq.find(f => /gratuit/i.test(f.q))
    for (const r of [creer?.a, suivi?.a]) {
      expect(r, "les deux nomment le même nombre").toContain(String(PLANS.free.limits.dyn))
    }
  })
})

describe("garde de classe : une réponse publique lit la grille", () => {
  /** Les réponses de FAQ du fichier source, avec leur ligne. */
  function reponses(): { ligne: number; texte: string }[] {
    const out: { ligne: number; texte: string }[] = []
    SRC.split("\n").forEach((l, i) => {
      const m = /\{\s*q:\s*"[^"]*",\s*a:\s*([`"])([\s\S]*)$/.exec(l)
      if (m) out.push({ ligne: i + 1, texte: l })
    })
    return out
  }

  it("aucune réponse ne récite un fait de la grille", () => {
    const fautes: string[] = []
    for (const r of reponses()) {
      if (!PARLE_DE_LA_GRILLE.test(r.texte)) continue
      if (LIT_LA_GRILLE.test(r.texte)) continue
      // « gratuitement » au sens courant, sans chiffre ni plan nommé, n'est pas
      // un fait de la grille : c'est le ton du produit.
      if (!/\d|\bplan\b/i.test(r.texte.replace(/q:\s*"[^"]*"/, ""))) continue
      fautes.push(`guides.ts:${r.ligne} — ${r.texte.trim().slice(0, 90)}`)
    }
    expect(fautes, "lire PLANS plutôt que réciter un chiffre").toEqual([])
  })

  it("et aucun NOM de plan n'est tapé à la main", () => {
    // Une ligne peut lire la grille d'un côté et la réciter de l'autre — c'est
    // exactement la mutation qui a échappé à la règle précédente. Le nom d'un
    // plan est un fait : il vient de `PLANS.*.label`, jamais du clavier.
    const labels = Object.values(PLANS).map(p => p.label)
    const fautes: string[] = []
    for (const r of reponses()) {
      // On retire les interpolations avant de chercher : `${PLANS.free.label}`
      // ne contient pas le mot, c'est justement l'intérêt.
      const sansLecture = r.texte.replace(/\$\{[^}]*\}/g, "·")
      for (const l of labels) {
        if (new RegExp(`\\b${l}\\b`).test(sansLecture)) {
          fautes.push(`guides.ts:${r.ligne} — « ${l} » écrit en clair`)
        }
      }
    }
    expect(fautes, "le nom d'un plan se lit, il ne se tape pas").toEqual([])
  })

  it("le balayage voit bien les réponses — sinon il ne prouve rien", () => {
    const toutes = reponses()
    expect(toutes.length, "des réponses de FAQ dans le fichier").toBeGreaterThan(30)
    expect(toutes.filter(r => PARLE_DE_LA_GRILLE.test(r.texte)).length,
      "dont certaines parlent de la grille").toBeGreaterThan(3)
    expect(toutes.filter(r => LIT_LA_GRILLE.test(r.texte)).length,
      "et plusieurs la lisent vraiment").toBeGreaterThan(2)
  })

  it("la règle existait pour la grille tarifaire — elle est simplement étendue", () => {
    const p = fs.readFileSync(path.join(__dirname, "../promessesTenues.ts"), "utf8")
    expect(p).toContain("Une promesse sans preuve n'est pas une promesse")
    expect(SRC, "et les guides lisent la même source").toContain('import { PLANS } from "@/lib/plans"')
  })
})
