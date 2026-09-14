// effetConfirme.ts — l'écran efface ce que le serveur a refusé d'effacer.
//
// Relevé du 14 septembre, en balayant les appels réseau qui MODIFIENT quelque
// chose (POST, PATCH, DELETE) et ce que l'écran fait juste après. Trois d'entre
// eux agissent sans avoir regardé la réponse :
//
//   DomainRoutesPanel.tsx:120  deleteRoute()
//       await fetch("/api/domains/routes", { method: "DELETE", … })
//       setRoutes(prev => prev.filter(r => r.id !== id))
//     → la ligne disparaît de l'écran quoi que le serveur ait répondu. Et sans
//       try/catch : si le réseau ne répond pas, la fonction s'interrompt là,
//       `setDeleting(null)` n'est jamais atteint, la ligne reste figée.
//
//   QRStudio.tsx:695  removeDest()
//       await fetch("/api/qr-destination", { method: "DELETE", … })
//       setDestOverride(null)
//     → le plus grave des trois. L'écran annonce que le QR est revenu à sa page ;
//       en base la redirection est toujours là. Le commerçant croit que son QR
//       mène au menu — il mène encore à la campagne de l'été.
//
//   PrintStudioClient.tsx:640  saveDesign()
//       await fetch("/api/print-design", { method: "POST", … })
//       setDesignSaved(true)
//     → le badge « Enregistré » s'affiche même sur un refus. La route refuse
//       vraiment : 413 « Design trop volumineux (64 Ko maximum). » Le commerçant
//       ajoute une image de fond, voit « Enregistré », ferme l'onglet. Perdu.
//
// Les trois routes répondent pourtant correctement : `{ ok: true }` en cas de
// succès, `{ error }` avec un statut HTTP en cas de refus — aucune des 266
// réponses d'erreur de l'API ne sort en 200. L'information était là.
//
// Leurs voisines du même fichier lisent, elles : `restoreDest` teste `d.ok`,
// `addRoute` teste `d.error`. Le produit connaît le bon geste ; trois endroits
// l'ont oublié.
//
// La classe : **l'écran ne montre un changement que si le serveur l'a fait.**
//
// Le message du refus n'est pas réinventé ici : il vient de `messageDeRoute`
// (lot v71), qui sait déjà ce qu'une réponse a le droit de dire.

import { messageDeRoute } from "./messageDeRoute"

/** Le réseau n'a pas répondu : pas de statut HTTP du tout. */
export const STATUT_RESEAU_MUET = 0

/** Une réponse de nos routes, réduite à ce qui décide. */
export type ReponseLue = { statut: number; corps: unknown }

/**
 * Le serveur a-t-il fait ce qu'on lui demandait ?
 *
 * Un 2xx, et un corps qui ne porte pas d'erreur. La seconde condition est une
 * ceinture : aujourd'hui aucune route du produit ne renvoie `{ error }` en 200,
 * et si l'une s'y mettait, l'écran ne prendrait pas son refus pour un succès.
 */
export function serveurAFait(r: ReponseLue | null | undefined): boolean {
  if (!r || r.statut < 200 || r.statut >= 300) return false
  const c = (r.corps ?? {}) as Record<string, unknown>
  if (typeof c.error === "string" && c.error.trim()) return false
  return c.ok !== false
}

/**
 * Ce qu'on dit quand il ne l'a pas fait. `null` quand il l'a fait — de sorte
 * qu'un écran ne puisse pas afficher une erreur et le succès en même temps.
 */
export function refusDuServeur(r: ReponseLue | null | undefined, repli: string): string | null {
  if (serveurAFait(r)) return null
  return messageDeRoute(r?.statut ?? STATUT_RESEAU_MUET, r?.corps, repli)
}

/**
 * Exécute un appel qui modifie, et rapporte ce qui s'est réellement passé.
 *
 * C'est la SEULE fonction impure du module, et elle ne lève jamais : un réseau
 * muet devient un statut 0, que `messageDeRoute` traduit déjà en « Connexion
 * perdue ». Sans ça, chaque appelant doit son propre try/catch — et c'est
 * précisément le try/catch manquant qui figeait la ligne de `deleteRoute`.
 */
export async function effetDe(url: string, init?: RequestInit): Promise<ReponseLue> {
  try {
    const res = await fetch(url, init)
    const corps = await res.json().catch(() => null)
    return { statut: res.status, corps }
  } catch {
    return { statut: STATUT_RESEAU_MUET, corps: null }
  }
}

// ── La troisième face de la règle (lot v109) ─────────────────────────────────
//
// Relevé du 14 septembre. Le lot v100 a traité l'écran qui AGIT SANS VÉRIFIER,
// le lot v107 celui qui agit À TRAVERS UNE AIDE. Reste la troisième :
// **l'écran qui vérifie, et se tait.**
//
// Treize fonctions écrivent et ne disent jamais rien quand le serveur refuse.
// Les plus coûteuses sont sur l'écran qui encaisse l'argent :
//
//   upgrade/page.tsx:61   handleUpgrade
//     if (data.url)    { window.location.href = data.url; return }
//     if (data.portal) { await ouvrirPortail(); return }
//     setLoading(null)                       ← le refus finit ici, sans un mot
//
//   upgrade/page.tsx:82   ouvrirPortail
//     if (d.url) window.location.href = d.url
//     } catch {}                             ← idem
//
// Le commerçant clique « Passer à Pro », le bouton tourne, s'arrête, et il ne se
// passe rien. Il reclique. « Gérer mon abonnement » ne fait rien non plus.
//
//   ReportSubscriptionPanel:62   toggle
//     if (data.ok) { … }                     ← l'interrupteur revient tout seul
//
//   QRStudio:325   archiveQR
//     await sb.from("pages").update({ status: "archived" }).eq("id", pid)
//     setQRCodes(…)                          ← résultat jeté, écran modifié
//
// Ce dernier est le défaut du lot v100 tel quel, raté par son balayage parce que
// l'écriture passe par le client Supabase et non par `fetch`. Son voisin
// `deleteQR`, dans le même fichier, porte pourtant la phrase : « la ligne ne
// quitte l'écran qu'après confirmation de la base ».
//
// La règle ne change pas, elle se complète : **un refus se voit.**

import { erreurLisible } from "./erreurLisible"

/**
 * Le message d'un refus venu du CLIENT Supabase — l'autre moitié du produit.
 * `null` quand il n'y a pas eu de refus, comme `refusDuServeur` : un écran ne
 * peut pas afficher l'erreur et le succès en même temps.
 */
export function refusDeLaBase(erreur: unknown, repli: string): string | null {
  if (!erreur) return null
  return erreurLisible(erreur, repli)
}

/**
 * Une écriture Supabase dont on veut savoir si elle a porté sur quelque chose.
 *
 * `update`/`delete` réussissent sans rien changer quand la ligne n'existe plus
 * ou que la politique d'accès la masque : `error` est nul et `data` est vide.
 * Pour l'écran, ce n'est pas une réussite — il allait effacer une ligne qui est
 * toujours là.
 */
export function ligneTouchee(reponse: { data?: unknown; error?: unknown } | null | undefined): boolean {
  if (!reponse || reponse.error) return false
  const d = reponse.data
  return Array.isArray(d) ? d.length > 0 : d != null
}
