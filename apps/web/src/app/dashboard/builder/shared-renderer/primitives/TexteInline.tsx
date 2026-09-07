"use client"
// Les deux implementations du contrat `RenduTexte` (voir renderTypes.ts).
//
// La page publiee rend un element ordinaire. L'editeur rend le meme element,
// editable sur place. La geometrie, elle, vit une seule fois dans la vue
// partagee : c'est tout l'interet de passer le rendu du texte en parametre
// plutot que d'ecrire deux vues qui se recopient.
import { InlineEditable } from "../../InlineEditable"
import type { RenduTexte } from "../renderTypes"

/** Rendu figé : la page publiée. */
export const texteFige: RenduTexte = ({ valeur, style, balise }) => {
  const T = (balise ?? "p") as "p" | "span"
  return <T style={style}>{valeur}</T>
}

/** Rendu editable : l'apercu de l'editeur. `edit(cle)` ecrit dans le bloc. */
export function texteEditable(canEdit: boolean, edit: (cle: string) => (v: string) => void): RenduTexte {
  return ({ valeur, cle, style, multiligne, balise, placeholder }) => (
    <InlineEditable as={balise ?? "p"} editable={canEdit} value={valeur} placeholder={placeholder}
      multiline={multiligne} onCommit={edit(cle)} style={style} />
  )
}
