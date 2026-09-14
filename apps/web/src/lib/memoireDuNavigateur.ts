// memoireDuNavigateur — le navigateur a le droit de refuser de se souvenir.
//
// Relevé du 14 septembre. Soixante-quinze accès à `localStorage` /
// `sessionStorage` dans vingt-trois fichiers. **Quinze** ne sont protégés par
// rien. Les soixante autres le sont par un `try { … } catch {}` écrit sur place,
// à chaque fois — soixante copies du même geste, avec autant de replis
// différents.
//
// Ce n'est pas une précaution théorique. En navigation privée Safari, avec les
// données de site bloquées, ou sous une politique d'entreprise, `localStorage`
// existe mais **lève** au premier appel. Les quinze non protégés deviennent
// alors :
//
//   BuilderV4.tsx:301
//     const [sidebarCollapsed] = useState(() => {
//       if (typeof window !== "undefined") return localStorage.getItem(…) === "true"
//     })
//
//   Une exception dans un initialiseur de `useState` n'est pas rattrapée : le
//   composant ne monte pas. L'éditeur entier est un écran blanc, pour une
//   préférence de barre latérale repliée.
//
//   DashboardShell.tsx:273   la couleur d'accent du commerçant ne charge plus
//   builderHooks.ts:159      l'écriture lève à chaque poignée de redimensionnement
//   profile/page.tsx:319     l'enregistrement du profil s'interrompt au milieu
//
// Le produit connaît le bon geste, et il est bon : `browserStorage()`, dans
// `dashboard/builder/draftStore.ts`, **sonde** le stockage par une écriture
// jetable avant de le rendre — parce que certains navigateurs exposent l'objet
// et ne lèvent qu'à la première écriture. Mais il vit dans un module de
// l'éditeur, et lui seul s'en sert.
//
// La classe : **un refus de mémoire n'efface pas l'écran.** Le geste sort de
// l'éditeur et devient celui de tout le produit ; `draftStore.browserStorage`
// le réexporte plutôt que d'en garder une copie.

/** Interface minimale d'un stockage — permet de tester sans navigateur. */
export type StockageLike = {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
}

/** Durable = survit à la fermeture de l'onglet. Onglet = oublié en le fermant. */
export type Duree = "durable" | "onglet"

// La sonde est faite UNE fois par chargement de page et par durée : elle coûte
// une écriture, et se retrouvait sinon dans des gestes répétés (une poignée de
// redimensionnement écrit à chaque pixel). Ce que la sonde établit — « ce
// navigateur accepte-t-il d'écrire » — ne change pas en cours de page ; ce qui
// peut changer, c'est le quota, et chaque écriture reste donc protégée.
const sondes = new Map<Duree, StockageLike | null>()

function sonder(duree: Duree): StockageLike | null {
  try {
    if (typeof window === "undefined") return null
    const brut = duree === "onglet" ? window.sessionStorage : window.localStorage
    if (!brut) return null
    const jeton = "__qrowg_sonde__"
    brut.setItem(jeton, "1")
    brut.removeItem(jeton)
    return brut
  } catch {
    return null
  }
}

/** Le stockage quand il existe ET qu'il répond. `null` en rendu serveur, ou refusé. */
export function stockage(duree: Duree = "durable"): StockageLike | null {
  if (!sondes.has(duree)) sondes.set(duree, sonder(duree))
  return sondes.get(duree) ?? null
}

/** Le navigateur accepte-t-il de se souvenir ? Sert à ne pas promettre ce qu'on ne tiendra pas. */
export function memoireDisponible(duree: Duree = "durable"): boolean {
  return stockage(duree) !== null
}

/** Refait la sonde. Réservé aux tests : en production l'état ne change pas en cours de page. */
export function oublierLaSonde(): void {
  sondes.clear()
}

/** Ce qui est retenu sous cette clé, ou `null` — jamais une exception. */
export function lire(cle: string, duree: Duree = "durable"): string | null {
  const s = stockage(duree)
  if (!s) return null
  try { return s.getItem(cle) } catch { return null }
}

/**
 * Retient une valeur. Rend `false` quand le navigateur a refusé — quota plein,
 * navigation privée — pour que l'appelant puisse le dire plutôt que de croire
 * que c'est fait.
 */
export function ecrire(cle: string, valeur: string, duree: Duree = "durable"): boolean {
  const s = stockage(duree)
  if (!s) return false
  try { s.setItem(cle, valeur); return true } catch { return false }
}

/** Oublie cette clé. Ne lève jamais : ce qui n'a pas pu être écrit n'a pas à être effacé. */
export function oublier(cle: string, duree: Duree = "durable"): void {
  const s = stockage(duree)
  if (!s) return
  try { s.removeItem(cle) } catch { /* déjà oublié */ }
}

/**
 * La même chose pour une valeur JSON. Un contenu illisible — écrit par une
 * version précédente, tronqué par un quota atteint — rend le repli, jamais une
 * exception et jamais `undefined`.
 */
export function lireJson<T>(cle: string, repli: T, duree: Duree = "durable"): T {
  const brut = lire(cle, duree)
  if (brut === null) return repli
  try {
    const v = JSON.parse(brut)
    return v === undefined || v === null ? repli : (v as T)
  } catch {
    return repli
  }
}

/** Écrit une valeur JSON. `false` si le navigateur refuse, ou si la valeur n'est pas sérialisable. */
export function ecrireJson(cle: string, valeur: unknown, duree: Duree = "durable"): boolean {
  let json: string
  try { json = JSON.stringify(valeur) } catch { return false }
  if (typeof json !== "string") return false
  return ecrire(cle, json, duree)
}
