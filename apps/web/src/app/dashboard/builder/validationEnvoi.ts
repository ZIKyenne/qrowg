// validationEnvoi — règles PURES appliquées AVANT d'envoyer un fichier au stockage.
// Un import qui échouait ne disait rien (Médias) ; un message d'erreur arrivait
// avec un rendu de retard (Éditeur). Ici : la raison est calculée d'abord, et
// retournée avec le résultat, jamais lue depuis un état périmé.

export const TAILLE_MAX_IMAGE = 20 * 1024 * 1024   // avant compression côté client (photo smartphone : 5-12 Mo)
export const TAILLE_MAX_FICHIER = 20 * 1024 * 1024

// ── Pourquoi le SVG n'est PAS dans cette liste (audit du 23/09/2026) ────────
//
// Le bucket `page-assets` est public en lecture : tout fichier déposé est
// servi par une URL `…supabase.co/storage/v1/object/public/…`, avec son type
// réel. Un SVG contient du script — ouvert directement par cette URL, il
// s'exécute. Affiché dans une `<img>`, il ne s'exécute pas ; le risque n'est
// donc pas la page du commerçant, c'est l'URL elle-même : une page d'hameçonnage
// hébergée sous une adresse qui a l'air d'appartenir à QRowg.
//
// Le relevé a tranché : en trois mois et 421 fichiers, **aucun SVG n'a jamais
// été déposé**. Le format était accepté sans que personne s'en serve. On ne
// retire donc pas une fonction, on retire une surface.
//
// Les formats qui restent sont inertes : un décodeur d'image ne lit pas de
// script. `ceQuiEstAccepteEstInerte.test.ts` refuse qu'un format actif revienne
// dans cette liste — ici ou ailleurs — sans une raison écrite qui se vérifie.
const IMAGES = /^image\/(jpeg|png|webp|gif|avif)$/i
const DOCS: Record<string, true> = {
  "application/pdf": true,
  "application/msword": true,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
  "application/vnd.ms-powerpoint": true,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
  "application/vnd.ms-excel": true,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
  "text/csv": true,
}
const EXT_DOCS = /\.(pdf|docx?|pptx?|xlsx?|csv)$/i

export type RaisonEnvoi = "no_account" | "type" | "taille" | "failed"

export type ResultatEnvoi = { url: string | null; raison: RaisonEnvoi | null }

export const mo = (n: number) => `${Math.round(n / 1024 / 1024)} Mo`

// null = acceptable ; sinon la raison.
export function validerImage(f: { type: string; size: number; name: string }): RaisonEnvoi | null {
  if (!IMAGES.test(f.type)) return "type"
  if (f.size > TAILLE_MAX_IMAGE) return "taille"
  return null
}

export function validerFichier(f: { type: string; size: number; name: string }): RaisonEnvoi | null {
  if (!(Object.hasOwn(DOCS, f.type) || EXT_DOCS.test(f.name))) return "type"
  if (f.size > TAILLE_MAX_FICHIER) return "taille"
  return null
}

// Phrase à afficher. `quoi` = "photo" | "fichier" ; `compte` = phrase pour un invité.
export function messageEnvoi(raison: RaisonEnvoi, quoi: "photo" | "fichier", nom?: string): string {
  const n = nom ? `« ${nom} »` : (quoi === "photo" ? "Cette image" : "Ce fichier")
  switch (raison) {
    case "no_account": return quoi === "photo"
      ? "Créez un compte (gratuit) pour ajouter vos propres photos — votre page est gardée."
      : "Créez un compte (gratuit) pour joindre vos fichiers — votre page est gardée."
    case "type": return quoi === "photo"
      ? `${n} n'est pas une image acceptée (JPG, PNG, WEBP, GIF, AVIF).`
      : `${n} n'est pas un format accepté (PDF, Word, PowerPoint, Excel, CSV).`
    case "taille": return `${n} dépasse ${mo(quoi === "photo" ? TAILLE_MAX_IMAGE : TAILLE_MAX_FICHIER)}.`
    case "failed": return quoi === "photo"
      ? "L'envoi de la photo a échoué. Vérifiez votre connexion puis réessayez."
      : "L'import du fichier a échoué. Vérifiez votre connexion puis réessayez."
  }
}
