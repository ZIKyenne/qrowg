// purgeDuStockage.ts — la suppression d'un compte efface aussi ses fichiers (U7, revue du 23 nov.).
//
// `api/account/delete` supprimait l'utilisateur, et la cascade emportait pages,
// blocs, QR et statistiques. Le stockage, lui, n'est pas une table : photos,
// logos et cartes restaient dans le bucket PUBLIC `page-assets`, lisibles par
// leur adresse. La politique de confidentialité promet l'effacement (RGPD, art. 17).
//
// Où vivent les fichiers d'un compte :
//   • `<uid>/…`            — tout ce que l'éditeur téléverse (useImageUpload) ;
//   • `avatars/<uid>.jpg`  — la photo de profil (dashboard/profile).
// Le dossier `social/` appartient au produit, pas aux comptes : jamais touché.
//
// Le stockage est passé en argument : le module se teste sans réseau.

export const BUCKET_DES_COMPTES = "page-assets"
const PAGE = 1000

type Entree = { name: string; id?: string | null }
export type StockageMinimal = {
  list(prefixe: string, options: { limit: number; offset: number }): Promise<{ data: Entree[] | null; error: { message: string } | null }>
  remove(chemins: string[]): Promise<{ error: { message: string } | null }>
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Tous les fichiers sous `prefixe`, sous-dossiers compris. Un dossier n'a pas d'`id`. */
export async function fichiersSous(st: StockageMinimal, prefixe: string): Promise<string[]> {
  const out: string[] = []
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await st.list(prefixe, { limit: PAGE, offset })
    if (error) throw new Error(`lecture de ${prefixe} : ${error.message}`)
    const lot = data ?? []
    for (const e of lot) {
      const chemin = `${prefixe}/${e.name}`
      if (e.id) out.push(chemin)
      else out.push(...(await fichiersSous(st, chemin)))
    }
    if (lot.length < PAGE) return out
  }
}

/**
 * Efface les fichiers d'un compte. Renvoie le nombre de fichiers supprimés.
 * Lève si l'identifiant n'est pas un UUID : un préfixe vide ou « avatars »
 * viderait le bucket d'autres comptes.
 */
export async function purgerLesFichiersDuCompte(st: StockageMinimal, uid: string): Promise<number> {
  if (!UUID.test(uid)) throw new Error("identifiant de compte invalide")
  const fichiers = await fichiersSous(st, uid)
  // L'avatar est demandé à tout hasard : `remove` ignore un chemin absent.
  const chemins = [...fichiers, `avatars/${uid}.jpg`]
  for (let i = 0; i < chemins.length; i += PAGE) {
    const { error } = await st.remove(chemins.slice(i, i + PAGE))
    if (error) throw new Error(`suppression : ${error.message}`)
  }
  return fichiers.length
}
