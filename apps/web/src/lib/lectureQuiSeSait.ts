// lectureQuiSeSait — une lecture qui échoue n'est pas une liste vide.
//
// Relevé du 15 septembre. Le produit porte déjà la règle, écrite sur UN écran :
//
//   DomainsPage.tsx:74
//   « Une réponse en erreur n'est pas "aucun domaine" (v55) : l'écran le dit
//     et propose de réessayer. »
//
// Vingt-quatre écrans LISENT une route de l'API. **Dix** regardent la réponse
// avant de la croire. **Treize** appellent `.json()` et se servent :
//
//   GoalsDashboard:181     setGoals(d.goals ?? [])            « Aucun objectif »
//   DomainRoutesPanel:65   setRoutes(d.routes ?? [])          « Aucune route »
//   ReportSubscription:55  setSubs(d.subscriptions ?? [])     les rapports éteints
//   qr-link/page:188       if (Array.isArray(d.items)) …      « Aucun QR direct »
//   profile/page:223       setDomains(dData.domains ?? [])    « Aucun domaine »
//
// Sur un refus — une session expirée pendant que l'onglet dormait, un 500, un
// wifi qui tombe — la réponse est `{ error: "…" }`. `d.goals` n'existe pas,
// `?? []` donne une liste vide, et l'écran affiche **son écran de bienvenue** :
// « Vous n'avez pas encore d'objectif. Créez-en un. »
//
// Le commerçant ne lit pas une panne. Il lit une **disparition**. Et il agit en
// conséquence : il recrée ce qu'il croit perdu. Le cas le plus cher est le
// rapport programmé — l'interrupteur revient à zéro, il le rallume, et il se
// retrouve avec deux abonnements au même rapport.
//
// Le plus ironique tient en deux lignes de `QRStudio:718`. Le rétablissement
// d'une redirection vérifie sa PATCH (lot v100), puis relit l'état :
//
//     const hd = await fetch(`/api/qr-destination?qr_id=…`).then(x=>x.json()).catch(()=>({}))
//     setDestOverride(hd.dest_override ?? null)
//
// Si cette relecture échoue, l'écran annonce que le QR est revenu à sa page —
// alors que la redirection vient d'être rétablie avec succès. Le bon geste et
// l'autre, sur deux lignes qui se suivent.
//
// La classe : **une lecture dit si elle a réussi. Une absence de donnée et une
// absence de réponse ne s'affichent pas pareil.**
//
// Ce module ne double pas `effetConfirme` : il s'appuie dessus. `effetDe` sait
// déjà appeler sans jamais lever, `refusDuServeur` sait déjà quoi dire d'un
// refus. Il manquait la face lecture — et le nom qui la rend cherchable.

import { effetDe, refusDuServeur, type ReponseLue } from "./effetConfirme"

/**
 * Ce qu'une lecture rapporte : la donnée, ou la raison de son absence.
 *
 * Jamais les deux. `valeur` non nulle veut dire que le serveur a répondu et
 * qu'on peut afficher ; `refus` non nul veut dire qu'on ne sait pas, et qu'il
 * faut le dire au lieu de montrer du vide.
 */
export type Lecture<T> = { valeur: T | null; refus: string | null }

/**
 * Lit une route de l'API et dit si elle a répondu.
 *
 * @param url    la route à lire.
 * @param repli  ce qu'on dit quand la réponse n'explique pas son refus —
 *               écrit du point de vue du commerçant : « Vos objectifs n'ont
 *               pas pu être chargés. », pas « Erreur 500 ».
 *
 * Ne lève jamais : un réseau muet devient un refus comme un autre, traduit par
 * `messageDeRoute` en « Connexion perdue ».
 */
export async function lireDe<T = Record<string, unknown>>(
  url: string, repli: string, init?: RequestInit,
): Promise<Lecture<T>> {
  return lectureDe<T>(await effetDe(url, init), repli)
}

/**
 * La même décision, sur une réponse déjà lue.
 *
 * Utile là où l'appel est déjà fait autrement (un `.then` existant, un appel
 * partagé) : la règle reste au même endroit.
 */
export function lectureDe<T = Record<string, unknown>>(r: ReponseLue | null | undefined, repli: string): Lecture<T> {
  const refus = refusDuServeur(r, repli)
  if (refus) return { valeur: null, refus }
  return { valeur: (r?.corps ?? null) as T | null, refus: null }
}

/**
 * Le tableau d'une réponse, quand on n'en attend qu'un.
 *
 * `d.goals ?? []` est exactement le geste qui confond « pas d'objectif » et
 * « pas de réponse ». Ici le repli vide n'existe que sur une lecture RÉUSSIE :
 * un refus a déjà mis `valeur` à `null`, et l'appelant n'arrive pas jusqu'ici.
 */
export function listeDe<E>(valeur: unknown, cle: string): E[] {
  const v = (valeur as Record<string, unknown> | null)?.[cle]
  return Array.isArray(v) ? (v as E[]) : []
}
