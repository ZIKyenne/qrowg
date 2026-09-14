// Destinataire choisi par le commercant pour UN bloc de formulaire.
//
// `quote_form` et `booking_request` proposent depuis toujours un champ « Email
// destinataire » / « Email de contact booking ». Lu dans le code le 6 septembre :
// personne ne lisait ce champ. Les demandes partaient toujours vers l'adresse du
// compte. Un artisan qui routait ses devis vers devis@son-entreprise.fr ne
// recevait rien a cette adresse — et ne pouvait pas le deviner, puisque les
// messages arrivaient quand meme, ailleurs.
//
// Ce module est PUR et teste seul : il choisit l'adresse, il n'envoie rien.

// La regle a demenage dans `lib/lienDeContact` (lot v114) : elle ne servait ici
// qu'au destinataire d'un formulaire, alors que le produit fabrique onze
// `mailto:` ailleurs sans jamais l'appeler. Le nom reste, les appelants aussi.
import { adresseEmailValide } from "./lienDeContact"
export { adresseEmailValide }

type BlocPage = { id?: unknown; type?: unknown; content?: unknown }

// Renvoie l'adresse saisie sur le bloc a l'origine du message, si elle est
// exploitable. Sinon null : l'appelant retombe sur l'adresse du compte.
export function destinataireDuBloc(blocks: unknown, blockId: unknown): string | null {
  if (!Array.isArray(blocks) || typeof blockId !== "string" || !blockId) return null
  const bloc = (blocks as BlocPage[]).find(b => b && typeof b === "object" && b.id === blockId)
  const contenu = bloc?.content
  if (!contenu || typeof contenu !== "object") return null
  return adresseEmailValide((contenu as Record<string, unknown>).email_dest)
}
