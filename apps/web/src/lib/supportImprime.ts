// supportImprime.ts — le support qu'on ne peut pas créer.
//
// Relevé du 13 septembre, en lisant ce que le produit dit à son utilisateur, et
// ce qu'il fait ensuite.
//
// Ce qu'il DIT, deux fois :
//
//   · écran Statistiques, panneau « Performance par support », état vide :
//     « Créez un QR par support (un pour la vitrine, un pour les tables…) —
//       dupliquez un QR depuis le QR Studio POUR UNE MÊME PAGE. »
//   · FAQ publique (app/qr-code/verticals.ts) :
//     « Créez un QR par support pour comparer les scans par affiche, flyer ou
//       publication. »
//
// Ce qu'il FAIT, dans `api/qr-duplicate` :
//
//     // 2. Dupliquer la page liee (si elle existe)
//     if (orig.page_id) { … setIfPresent(p, "slug", …); setIfPresent(p, "status", "draft") … }
//     q.page_id = newPageId
//
// La duplication crée TOUJOURS une nouvelle page : nouveau slug, remise en
// brouillon, contenu dédoublé. Suivre l'instruction du produit donne donc, pour
// quatre supports, quatre pages différentes à tenir à jour — et le panneau
// « Performance par support », qui attribue les scans par `qr_code_id` sur UNE
// page, reste vide pour toujours. L'écran ne peut pas être rempli en suivant sa
// propre consigne.
//
// Rien dans la base ne s'y oppose : `qr_codes.page_id` est une clé étrangère
// ordinaire, plusieurs QR peuvent pointer la même page, et toute la chaîne de
// mesure existe déjà (`qr_source` posé par /q/<code>, `supportFunnel`,
// `api/qr-label` qui nomme « Vitrine », « Table 4 »).
//
// Ce qui manquait, c'est le bouton. Module PUR.

/** Le quota de QR actifs est celui des pages : un support de plus en consomme un. */
export type EtatDuQuota = { actifs: number; limite: number | null }

export type VerdictSupport =
  | { possible: true; restants: number | null }
  | { possible: false; raison: "quota"; phrase: string }

/**
 * Peut-on ajouter un support à cette page ?
 *
 * La règle n'est pas inventée ici : c'est celle de `lib/quota.ts`, qui compte
 * les QR de page ACTIFS et les borne par `pageLimit`. On ne la change pas — on
 * la dit, avant de cliquer, au lieu de laisser le nouveau support arriver en
 * brouillon sans explication.
 */
export function peutAjouterUnSupport(q: EtatDuQuota): VerdictSupport {
  if (q.limite === null) return { possible: true, restants: null }
  const restants = q.limite - q.actifs
  if (restants > 0) return { possible: true, restants }
  return {
    possible: false,
    raison: "quota",
    phrase: q.limite === 1
      ? "Votre plan couvre un seul QR actif : un deuxième support demande un plan supérieur."
      : `Votre plan couvre ${q.limite} QR actifs, et ils le sont tous. Mettez-en un en pause, ou passez au plan supérieur.`,
  }
}

/** Ce qu'il reste, dit simplement. Null quand il n'y a rien à dire. */
export function phraseRestants(v: VerdictSupport): string | null {
  if (!v.possible) return v.phrase
  if (v.restants === null) return null
  return v.restants === 1
    ? "Il vous reste 1 QR actif : ce support le prendra."
    : `Il vous reste ${v.restants} QR actifs.`
}

const NOM_PAR_DEFAUT = "Support"

/**
 * Un nom libre pour le prochain support. « Support 2 », « Support 3 »… en
 * évitant ceux déjà pris, quelle que soit la casse ou les espaces.
 */
export function nomDeSupportLibre(existants: (string | null | undefined)[]): string {
  const pris = new Set(existants.map(n => (n || "").trim().toLowerCase()).filter(Boolean))
  for (let i = 2; i < 500; i++) {
    const n = `${NOM_PAR_DEFAUT} ${i}`
    if (!pris.has(n.toLowerCase())) return n
  }
  return NOM_PAR_DEFAUT
}

/**
 * L'instruction, refaite pour décrire ce que le produit fait vraiment. Elle sert
 * à l'état vide du panneau « Performance par support » — l'écran qui n'avait
 * aucun moyen d'être rempli.
 */
export const CONSIGNE_SUPPORTS =
  "Un QR par support pour les comparer : un pour la vitrine, un pour les tables, un pour les flyers. Tous mènent à cette même page, et chacun compte ses propres scans."

/** Ce que fait la duplication, dite sans détour — elle ne reste pas sur la page. */
export const CONSIGNE_DUPLICATION =
  "Dupliquer un QR crée une autre page, à tenir à jour séparément. Pour comparer des supports d'une même page, ajoutez un support."
