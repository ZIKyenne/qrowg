// clavierDuChamp — un champ qui attend un e-mail ou un numéro ouvre le bon clavier.
//
// Relevé du 20 septembre. Le formulaire public porte déjà le geste, et dit
// pourquoi (`app/[slug]/blocsPublics.tsx:646`) :
//
//     // Bon clavier mobile + autofill selon le type de champ
//     // (formulaire souvent scanné au téléphone).
//     if (/e?mail/.test(k)) return { type: "email", inputMode: "email",
//                                    autoComplete: "email", autoCapitalize: "off" }
//
// Quatre attributs, pas un. `type` fait la validation, `autoComplete` propose
// ce que le téléphone connaît déjà, `inputMode` **choisit le clavier**, et
// `autoCapitalize: "off"` évite le « Jean@… » que le téléphone met en majuscule
// tout seul dans un champ e-mail.
//
// **Sept champs du tableau de bord n'ont que le premier :**
//
//   auth/forgot-password:74     type="email"    le commerçant a perdu son mot de passe
//   dashboard/team:176          type="email"    il invite un collègue
//   builder/MobileBuilderShell  type="search"   la recherche de blocs, SUR MOBILE
//   builder/builderPanels ×2    type="url"      l'adresse d'un bouton
//   qr-codes/QRStudio:2840      type="number"   la taille d'export
//   qr-codes/TaillePhysique:24  type="number"   la taille du support
//
// `type="email"` seul ne change pas le clavier sur iOS : l'arobase reste à deux
// touches de distance, et la première lettre part en majuscule. `type="number"`
// affiche un pavé sur Android mais pas toujours sur iOS. `MobileBuilderShell`
// est, par son nom, l'écran du téléphone.
//
// **Et le modèle du formulaire partagé reproduit le geste aux deux tiers.**
// `shared-renderer/forms/leadFormModels.ts` recopie les mêmes expressions
// régulières que `blocsPublics`, en produit `type` et `autocomplete`, et
// s'arrête là : ni `inputMode`, ni `autoCapitalize`. Cette infrastructure est
// encore inactive — son propre en-tête le dit — mais elle porte déjà l'écart
// qu'elle est censée fermer : « Écrire ici une liste à la main rouvrirait
// l'écart que la vague 23 vient de fermer. »
//
// La classe : **le clavier d'un champ se décide une fois, à partir de ce que le
// champ attend.** Module PUR.

/** Ce qu'un champ pose sur son `<input>` pour que le téléphone aide. */
export type ClavierDuChamp = {
  type: "text" | "email" | "tel" | "url" | "number" | "search"
  inputMode?: "text" | "email" | "tel" | "url" | "numeric" | "decimal" | "search"
  autoComplete?: string
  autoCapitalize?: "off"
}

/**
 * Le clavier d'un champ à partir de sa CLÉ — `email`, `telephone`, `prenom`…
 *
 * Les expressions sont celles de `blocsPublics.fieldProps`, à la lettre : deux
 * listes qui disent la même chose finissent par ne plus la dire.
 */
export function clavierPourCle(cle: string): ClavierDuChamp {
  const k = (cle || "").toLowerCase()
  if (/e?mail/.test(k)) return { type: "email", inputMode: "email", autoComplete: "email", autoCapitalize: "off" }
  if (/phone|tel|mobile|whatsapp|numero/.test(k)) return { type: "tel", inputMode: "tel", autoComplete: "tel" }
  if (/name|nom|prenom/.test(k)) return { type: "text", autoComplete: "name" }
  if (/company|societe|organisation/.test(k)) return { type: "text", autoComplete: "organization" }
  return { type: "text" }
}

/**
 * Le clavier d'un champ à partir de son TYPE HTML, pour les champs du tableau
 * de bord qui n'ont pas de clé canonique — « cet `<input type="url">`, quel
 * clavier ? ».
 *
 * `number` demande `inputMode: "decimal"` plutôt que `"numeric"` : une taille
 * en millimètres peut s'écrire avec une virgule, et `"numeric"` cache le
 * séparateur sur iOS.
 */
export function clavierPourType(type: ClavierDuChamp["type"], decimal = false): ClavierDuChamp {
  switch (type) {
    case "email":  return { type, inputMode: "email", autoComplete: "email", autoCapitalize: "off" }
    case "tel":    return { type, inputMode: "tel", autoComplete: "tel" }
    case "url":    return { type, inputMode: "url", autoCapitalize: "off" }
    case "number": return { type, inputMode: decimal ? "decimal" : "numeric" }
    case "search": return { type, inputMode: "search" }
    default:       return { type }
  }
}
