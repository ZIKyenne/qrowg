// hotesDeCadre.mjs — les hôtes que le produit peut mettre dans un `<iframe>`.
//
// Écrit en ESM simple, et non en TypeScript, pour une seule raison : ce fichier
// a DEUX lecteurs qui ne parlent pas le même langage.
//
//   app/dashboard/builder/types.ts   le bloc « Intégration » filtre là-dessus
//   next.config.mjs                  en fabrique l'en-tête `frame-src`
//
// Une liste d'hôtes recopiée dans un en-tête finirait par dire autre chose que
// la liste qui filtre : un embed accepté par le produit et refusé par le
// navigateur donnerait un cadre vide, sans message, sur la page d'un client.
// C'est la même raison qu'au lot v160 pour les schémas d'adresse, et la même
// qu'au lot v159, où une règle recopiée avait fini par laisser passer
// `javascript:`.
//
// ── Pourquoi cette liste suffit ────────────────────────────────────────────
//
// Le produit ne met une adresse dans un `<iframe>` que par quatre chemins, et
// tous les quatre aboutissent dans cette liste :
//
//   embedHref        bloc « Intégration » : filtre explicitement sur cette liste
//   embedVideoUrl    reconstruit vers youtube-nocookie.com, player.vimeo.com,
//                    www.dailymotion.com
//   mapEmbedUrl      reconstruit vers google.com / maps.google.com (lot v161 :
//                    un domaine national est ramené à `.com`, sans quoi
//                    l'ensemble des hôtes ne serait pas borné)
//   spotifyEmbedUrl  reconstruit vers open.spotify.com (lot v159)
//
// Les trois derniers ne renvoient JAMAIS leur entrée : ils reconstruisent une
// adresse canonique, ou rien. C'est ce qui rend l'ensemble fini, donc écrivable
// dans un en-tête.

/**
 * Les hôtes autorisés dans un cadre d'intégration.
 *
 * Le bloc « Embed » insérait l'adresse saisie telle quelle dans un `<iframe>`.
 * Sur une page publique servie par qrowg.com, cela permettait à n'importe quel
 * compte gratuit d'exécuter du code sur notre propre origine, donc de lire les
 * jetons de session des visiteurs connectés.
 *
 * La liste reprend ce que le bloc promet dans son propre libellé (« Forms,
 * Typeform, Notion… ») plus les intégrations déjà présentes ailleurs dans le
 * produit. Tout le reste est refusé : mieux vaut un bloc vide qu'une page
 * piégée. Correspondance sur le domaine ET ses sous-domaines uniquement — un
 * hôte comme « google.com.evil.fr » ne passe pas.
 */
export const EMBED_HOTES = [
  "docs.google.com", "forms.gle", "calendar.google.com", "drive.google.com",
  "google.com", "maps.google.com",
  "typeform.com", "notion.so", "notion.site", "airtable.com",
  "youtube.com", "youtube-nocookie.com", "youtu.be",
  "vimeo.com", "player.vimeo.com", "dailymotion.com",
  "open.spotify.com", "spotify.com", "soundcloud.com", "w.soundcloud.com",
  "calendly.com", "tally.so", "framer.com",
]

/**
 * Un cadre de paiement ne doit JAMAIS être ce qu'un en-tête de sécurité casse.
 *
 * Le produit envoie aujourd'hui vers la page de paiement Stripe par une
 * redirection, et n'ouvre donc aucun cadre Stripe. Ces deux hôtes sont là par
 * précaution : le jour où un champ de carte s'affiche en ligne, il s'affichera.
 * Ce sont les deux hôtes que Stripe documente pour ses cadres, et le produit
 * déclare déjà `js.stripe.com` dans sa politique d'observation.
 */
export const CADRES_DE_PAIEMENT = ["js.stripe.com", "hooks.stripe.com"]

/**
 * La directive `frame-src`, fabriquée à partir de la liste.
 *
 * `'self'` d'abord : une page du produit peut encadrer une page du produit —
 * c'est ce que fait l'aperçu de l'éditeur. Puis chaque hôte, et ses
 * sous-domaines : `embedHref` accepte `h` et `*.h`, l'en-tête dit la même chose.
 */
export function frameSrc() {
  const hotes = [...EMBED_HOTES, ...CADRES_DE_PAIEMENT]
  return ["'self'", ...hotes.flatMap(h => [`https://${h}`, `https://*.${h}`])].join(" ")
}
