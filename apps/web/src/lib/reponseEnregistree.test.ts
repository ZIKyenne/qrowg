// L'angle mort de la garde v100 — garde de classe.
//
// Relevé du 14 septembre. Le lot v100 a posé : **l'écran ne montre un changement
// que si le serveur l'a fait.** Son balayage cherche un `await fetch(` qui
// modifie, suivi d'un changement d'écran non vérifié. Il ne voit donc pas les
// écrans qui écrivent à travers une FONCTION du produit.
//
// Le produit en a sept qui écrivent par le réseau ; deux rendent un résultat :
//
//     submitLead(input): Promise<boolean>       lib/submitLead.ts
//     ajouterUnSupport(…)                       qr-codes/ajoutDeSupport.ts
//
// Un seul appel jetait ce résultat, et c'était sur la PAGE PUBLIQUE :
//
//     blocsPublics.tsx:512  RsvpPublic
//       const pick = (val) => {
//         setChoice(val)                     ← l'écran bascule d'abord
//         trackLinkClick(…)
//         submitLead({ … })                  ← ni `await`, ni résultat lu
//       }
//
//     puis, aussitôt :  « ✅ Merci, votre réponse est enregistrée ! »
//
// `/api/leads` refuse pour de vraies raisons : 429 au-delà de 15 soumissions par
// IP et par 10 minutes, 404 si la page n'existe plus, 500 si l'insertion échoue.
// Un mariage, une soirée, une réunion de copropriété : les invités répondent
// depuis le Wi-Fi du lieu, donc depuis UNE seule IP. Le seizième lisait
// « enregistrée » et n'était pas sur la liste — celle sur laquelle le commerçant
// compte ses couverts.
//
// Les deux autres formulaires de la même page font le bon geste depuis le lot
// v81 : ils attendent, distinguent « enregistré », « repli courrier » et
// « échec », et affichent la phrase juste. Le RSVP, plus ancien, gardait son
// bandeau vert écrit à la main.
//
// La classe : **la règle du lot v100 vaut aussi quand l'écriture passe par une
// fonction du produit.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { resultatDuRsvp, confirmationRsvp, reponseRejouable, choixArrete } from "./reponseEnregistree"
import { confirmationDuFormulaire } from "./promesseDuFormulaire"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

describe("ce que vaut une réponse RSVP", () => {
  it("elle n'est enregistrée que si l'aide l'a dit", () => {
    expect(resultatDuRsvp(true)).toBe("enregistre")
    expect(resultatDuRsvp(false)).toBe("echec")
    // `submitLead` rend `false` sur un refus comme sur une coupure : pour le
    // client c'est la même chose, sa réponse n'est pas partie.
    expect(resultatDuRsvp(undefined)).toBe("echec")
    expect(resultatDuRsvp(null)).toBe("echec")
    expect(resultatDuRsvp("oui")).toBe("echec")
  })

  it("la phrase vient du module du lot v81, elle n'est pas réécrite", () => {
    expect(confirmationRsvp("enregistre", "Le Comptoir"))
      .toEqual(confirmationDuFormulaire("enregistre", { nomCommerce: "Le Comptoir", libelle: "Votre réponse", feminin: true }))
    // « Votre réponse est bien arrivé » : le genre ne se devine pas avec une
    // règle, l'appelant le dit. Trouvé en branchant le RSVP (lot v107).
    expect(confirmationRsvp("enregistre").titre).toContain("arrivée")
    expect(confirmationDuFormulaire("enregistre").titre).toContain("arrivé.")
    expect(confirmationRsvp("enregistre", "Le Comptoir").titre).toContain("Votre réponse")
    expect(confirmationRsvp("enregistre", "Le Comptoir").detail).toContain("Le Comptoir")
  })

  it("un échec le dit, et sur le bon ton", () => {
    const c = confirmationRsvp("echec")
    expect(c.ton).toBe("erreur")
    expect(c.titre).not.toContain("enregistrée")
    expect(confirmationRsvp("enregistre").ton).toBe("ok")
  })

  it("un échec laisse réessayer ; une réussite arrête le choix", () => {
    expect(reponseRejouable("echec")).toBe(true)
    expect(reponseRejouable("enregistre")).toBe(false)
    expect(reponseRejouable("envoi")).toBe(false)
    expect(choixArrete("enregistre")).toBe(true)
    expect(choixArrete("echec")).toBe(false)
    expect(choixArrete("envoi")).toBe(false)
  })
})

describe("le RSVP public fait maintenant le même geste que ses voisins", () => {
  const src = lire("app/[slug]/blocsPublics.tsx")

  it("il attend la réponse avant de changer l'écran", () => {
    expect(src).toContain("const ok = await submitLead({ pageId, blockId: block.id, type: \"rsvp\"")
    expect(src).toContain("setEtat(resultatDuRsvp(ok))")
  })

  it("le bandeau vert écrit à la main a disparu", () => {
    expect(src, "« enregistrée ! » ne dépendait de rien").not.toContain("votre réponse est enregistrée !")
  })

  it("un échec s'affiche au-dessus des boutons, qui restent cliquables", () => {
    expect(src).toContain("reponseRejouable(etat!)")
    expect(src).toContain('role="alert"')
    expect(src).toContain('disabled={etat === "envoi"}')
  })

  it("et le nom du commerce lui parvient, comme aux deux autres formulaires", () => {
    expect(src).toContain("confirmationRsvp(etat, nomCommerce)")
    expect(lire("app/[slug]/renduLegacy.tsx"))
      .toContain('<RsvpPublic block={block} pageId={pageId} TEXT={TEXT} MUTED={MUTED} nomCommerce={nomCommerce} />')
  })
})

describe("garde de classe : la règle v100 vaut aussi pour les aides du produit", () => {
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

  /**
   * Les fonctions exportées du produit qui écrivent par le réseau ET rendent un
   * résultat. On les retrouve dans le code plutôt que de les lister : une
   * huitième aide écrite demain entre dans la règle sans qu'on y pense.
   */
  function aidesQuiEcrivent(): string[] {
    const noms = new Set<string>()
    for (const f of fichiers()) {
      const lignes = fs.readFileSync(f, "utf8").split("\n")
      for (const [i, l] of lignes.entries()) {
        const m = /export (?:async )?function (\w+)/.exec(l.trim())
        if (!m) continue
        const corps = lignes.slice(i, i + 60).join("\n")
        if (!/fetch\(/.test(corps)) continue
        if (!/method:\s*["'](POST|PUT|PATCH|DELETE)/.test(corps)) continue
        // Rend-elle quelque chose à lire ?
        if (!/:\s*Promise<(boolean|[A-Z]\w*)/.test(l) && !/return (true|false|\{)/.test(corps)) continue
        noms.add(m[1])
      }
    }
    return [...noms]
  }

  it("le balayage retrouve les aides qui écrivent — sinon il ne prouve rien", () => {
    const aides = aidesQuiEcrivent()
    expect(aides, "submitLead doit en faire partie").toContain("submitLead")
    expect(aides.length).toBeGreaterThanOrEqual(2)
  })

  it("personne n'appelle une de ces aides en jetant ce qu'elle rend", () => {
    const aides = aidesQuiEcrivent()
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*") || l.startsWith("import") || l.startsWith("export")) continue
        for (const nom of aides) {
          if (!new RegExp(`(^|[^.\\w])${nom}\\(`).test(l)) continue
          // Le résultat est lu s'il est affecté, rendu, ou chaîné.
          if (/=\s*await\s|=\s*\w*\(|\.then\(|return /.test(l)) continue
          fautes.push(`${rel}:${i + 1} — ${nom} : ${l.slice(0, 80)}`)
        }
      }
    }
    expect(fautes, "une écriture dont personne ne lit le résultat").toEqual([])
  })

  it("et aucun écran n'annonce un enregistrement écrit en dur", () => {
    // Le motif exact du défaut : la phrase « enregistré » dans du JSX, sans
    // qu'un résultat l'ait décidée. Les phrases du produit vivent dans
    // `lib/promesseDuFormulaire` — c'est là qu'on les lit.
    const fautes: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      if (rel === "lib/promesseDuFormulaire.ts") continue
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        if (!/réponse est enregistrée|message est enregistré|bien enregistré/i.test(l)) continue
        fautes.push(`${rel}:${i + 1} — ${l.slice(0, 90)}`)
      }
    }
    expect(fautes, "une phrase d'enregistrement que rien ne conditionne").toEqual([])
  })

  it("la règle du lot v100 est toujours là, et celle-ci la prolonge", () => {
    // Si la garde v100 disparaissait, celle-ci ne couvrirait plus que la moitié
    // du chemin : les `fetch` nus reviendraient sans que rien ne le dise.
    expect(lire("lib/effetConfirme.ts")).toContain("l'écran ne montre un changement que si le serveur l'a fait")
    expect(fs.existsSync(path.join(SRC, "lib/effetConfirme.test.ts"))).toBe(true)
  })
})
