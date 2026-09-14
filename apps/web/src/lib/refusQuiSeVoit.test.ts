// Un refus se voit — garde de classe.
//
// Relevé du 14 septembre. Le lot v100 a traité l'écran qui AGIT SANS VÉRIFIER.
// Le lot v107, celui qui agit À TRAVERS UNE AIDE. Reste la troisième face :
// **l'écran qui vérifie, et se tait.**
//
// Les plus coûteuses sont sur l'écran qui encaisse l'argent :
//
//   upgrade/page.tsx:61   handleUpgrade
//     if (data.url)    { window.location.href = data.url; return }
//     if (data.portal) { await ouvrirPortail(); return }
//     setLoading(null)                    ← le refus finit ici, sans un mot
//
//   upgrade/page.tsx:82   ouvrirPortail
//     if (d.url) window.location.href = d.url
//     } catch {}                          ← idem
//
// Le commerçant clique « Passer à Pro », le bouton tourne, s'arrête, et il ne se
// passe rien. Il reclique. « Gérer mon abonnement » ne fait rien non plus.
//
//   ReportSubscriptionPanel:62  toggle        l'interrupteur revient tout seul
//   qr-link:277  deleteInstant                le QR reste dans la liste
//   SupportPanel:46  saveLabel                « /* silencieux */ » dans le code
//   print-studio  saveCurrent, saveBrandKit   le repli LOCAL réussit : le style
//                                             est gardé sur cet appareil, pas
//                                             sur le compte, et rien ne le dit
//
//   QRStudio:325  archiveQR
//     await sb.from("pages").update({ status: "archived" }).eq("id", pid)
//     setQRCodes(…)                       ← résultat jeté, écran modifié
//
// Ce dernier est le défaut du lot v100 tel quel, raté par son balayage parce que
// l'écriture passe par le CLIENT SUPABASE et non par `fetch`. Son voisin
// `deleteQR`, dans le même fichier, porte pourtant la phrase : « la ligne ne
// quitte l'écran qu'après confirmation de la base ».
//
// La règle ne change pas, elle se complète : **un refus se voit.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { refusDeLaBase, ligneTouchee, refusDuServeur } from "./effetConfirme"
import { USER_MESSAGES } from "@/app/dashboard/builder/builderErrors"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

describe("l'autre moitié du produit : le client Supabase", () => {
  it("un refus de la base se dit, comme un refus de route", () => {
    expect(refusDeLaBase(null, "repli")).toBeNull()
    expect(refusDeLaBase(undefined, "repli")).toBeNull()
    // Un code SQL brut ne s'affiche pas : il passe par la traduction du produit.
    const m = refusDeLaBase({ message: "duplicate key value violates unique constraint" }, "Ce nom est déjà pris.")
    expect(m).toBeTruthy()
    expect(m).not.toContain("duplicate key")
  })

  it("le repli de l'appelant est utilisé quand l'erreur n'apprend rien", () => {
    expect(refusDeLaBase({ message: "quelque chose d'inconnu" }, "Ce QR n'a pas pu être archivé."))
      .toBe("Ce QR n'a pas pu être archivé.")
  })

  it("et une écriture qui ne touche aucune ligne n'est pas une réussite", () => {
    // `update`/`delete` réussissent sans rien changer quand la ligne n'existe
    // plus ou que la politique d'accès la masque.
    expect(ligneTouchee({ data: [{ id: "x" }], error: null })).toBe(true)
    expect(ligneTouchee({ data: [], error: null })).toBe(false)
    expect(ligneTouchee({ data: null, error: null })).toBe(false)
    expect(ligneTouchee({ data: [{ id: "x" }], error: { message: "non" } })).toBe(false)
    expect(ligneTouchee(null)).toBe(false)
    // Un `single()` rend un objet, pas un tableau.
    expect(ligneTouchee({ data: { id: "x" }, error: null })).toBe(true)
  })

  it("les deux moitiés vivent au même endroit", () => {
    const mod = lire("lib/effetConfirme.ts")
    expect(mod).toContain("export function refusDuServeur")
    expect(mod).toContain("export function refusDeLaBase")
    expect(refusDuServeur({ statut: 401, corps: { error: "Non authentifié" } }, "repli"))
      .toBe(USER_MESSAGES.UNAUTHORIZED)
  })
})

describe("les sept endroits du relevé disent maintenant leur refus", () => {
  it("l'écran qui encaisse l'argent", () => {
    const src = lire("app/upgrade/page.tsx")
    expect(src).toContain('refusDuServeur(r, "Le paiement n\'a pas pu démarrer. Réessayez dans un instant.")')
    expect(src).toContain('refusDuServeur(r, "L\'espace de gestion de l\'abonnement n\'a pas pu s\'ouvrir.")')
    expect(src, "un endroit où le dire").toContain('role="alert"')
    expect(src, "le refus ne finit plus sur un setLoading muet").not.toContain("} catch { setLoading(null) }")
  })

  it("l'abonnement aux rapports", () => {
    const src = lire("app/dashboard/analytics/ReportSubscriptionPanel.tsx")
    expect(src).toContain('refusDuServeur(r, "Ce réglage n\'a pas pu être enregistré.")')
    expect(src).toContain('role="alert"')
  })

  it("l'archivage d'un QR — le défaut v100 par le client Supabase", () => {
    const src = lire("app/dashboard/qr-codes/QRStudio.tsx")
    expect(src).toContain('refusDeLaBase(rep?.error, "Ce QR n\'a pas pu être archivé.")')
    expect(src).toContain("ligneTouchee(rep)")
    expect(src, "le résultat n'est plus jeté").not.toContain('if (pid) await sb.from("pages").update({ status: "archived" }).eq("id", pid)')
    // Le voisin qui avait déjà raison — c'est lui qui justifie la règle.
    expect(src).toContain("La ligne ne quitte l'écran qu'après confirmation de la base")
  })

  it("la suppression d'un QR dynamique et le nom d'un support", () => {
    expect(lire("app/dashboard/qr-link/page.tsx"))
      .toContain('refusDuServeur(r, "Ce QR n\'a pas pu être supprimé.")')
    const sp = lire("app/dashboard/analytics/SupportPanel.tsx")
    expect(sp).toContain('refusDuServeur(rep, "Ce nom n\'a pas pu être enregistré.")')
    expect(sp, "« silencieux » n'est plus une réponse").not.toContain("/* silencieux */")
  })

  it("et le repli local du studio d'impression le dit", () => {
    // Le cas le plus discret : l'enregistrement local RÉUSSIT toujours, donc
    // rien ne semblait cassé — mais le style ne suivait pas le commerçant.
    const src = lire("app/dashboard/print-studio/PrintStudioClient.tsx")
    expect(src).toContain("Style gardé sur cet appareil seulement.")
    expect(src).toContain("Charte gardée sur cet appareil seulement.")
  })
})

describe("garde de classe : un refus se voit", () => {
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

  /**
   * Ce qui compte comme « dire quelque chose ».
   *
   * La règle est une FORME, pas une liste de noms : nommer l'échec quelque part
   * — dans le nom de l'état posé (`setDestError`) ou dans sa valeur
   * (`setStatus("error")`) — appeler une infobulle, ou lever. Un écran qui ne
   * fait rien de tout cela ne peut rien avoir dit.
   */
  const DIT = /set\w*(Err|Error|Erreur|Message|Messages|Msg|Refus)\w*\(|set\w+\(\s*["'](error|erreur|echec|invalid)|toast\.|showToast\(|annoncer\(|erreur\(|alert\(|\bthrow /

  /** Ce qui compte comme « écrire ». */
  const ECRIT = /method:\s*["'](POST|PUT|PATCH|DELETE)|effetDe\(|\.upsert\(|\.insert\(|\.update\(|\.delete\(/

  function fonctionsQuiEcrivent(): { rel: string; ligne: number; nom: string; corps: string }[] {
    const out: { rel: string; ligne: number; nom: string; corps: string }[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      const lignes = fs.readFileSync(f, "utf8").split("\n")
      for (const [i, l] of lignes.entries()) {
        const m = /^\s*(?:async function (\w+)\s*\(|const (\w+)\s*=\s*async\s*\()/.exec(l)
        if (!m) continue
        let prof = 0, ouvert = false, fin = -1
        for (let j = i; j < lignes.length && j < i + 60; j++) {
          for (const c of lignes[j]) { if (c === "{") { prof++; ouvert = true } else if (c === "}") prof-- }
          if (ouvert && prof === 0) { fin = j; break }
        }
        if (fin < 0) continue
        const corps = lignes.slice(i, fin + 1).join("\n")
        if (!ECRIT.test(corps)) continue
        out.push({ rel, ligne: i + 1, nom: m[1] || m[2], corps })
      }
    }
    return out
  }

  it("aucune fonction qui écrit ne reste muette sur un refus", () => {
    const fautes = fonctionsQuiEcrivent()
      .filter(f => !DIT.test(f.corps))
      .map(f => `${f.rel}:${f.ligne} — ${f.nom}()`)
    expect(fautes, "elle écrit, et ne dit rien quand ça rate").toEqual([])
  })

  it("le balayage voit bien les fonctions qui écrivent — sinon il ne prouve rien", () => {
    const vues = fonctionsQuiEcrivent()
    expect(vues.length).toBeGreaterThan(20)
    // Et il reconnaît bien celles qui parlent : sinon il serait vide par erreur.
    expect(vues.filter(f => DIT.test(f.corps)).length).toBeGreaterThan(20)
  })

  it("les trois faces de la règle tiennent ensemble", () => {
    // Si l'une des deux premières disparaissait, celle-ci ne couvrirait qu'un
    // tiers du chemin.
    expect(fs.existsSync(path.join(SRC, "lib/effetConfirme.test.ts"))).toBe(true)
    expect(fs.existsSync(path.join(SRC, "lib/reponseEnregistree.test.ts"))).toBe(true)
    expect(lire("lib/effetConfirme.ts")).toContain("l'écran ne montre un changement que si le serveur l'a fait")
    expect(lire("lib/effetConfirme.ts")).toContain("un refus se voit")
  })
})
