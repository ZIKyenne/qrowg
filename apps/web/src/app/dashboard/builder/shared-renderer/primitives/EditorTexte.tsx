"use client"
// Le rendu de texte de l'ÉDITEUR — l'autre implémentation du contrat
// `RenduTexte`. Séparée de `TexteInline.tsx` au lot v170 : ce fichier-là est
// atteint depuis le registre public, et il n'a rien à faire d'`InlineEditable`.
import { InlineEditable } from "../../InlineEditable"
import type { RenduTexte } from "../renderTypes"

/** Rendu editable : l'apercu de l'editeur. `edit(cle)` ecrit dans le bloc. */
export function texteEditable(canEdit: boolean, edit: (cle: string) => (v: string) => void): RenduTexte {
  return ({ valeur, cle, style, multiligne, balise, placeholder }) => (
    <InlineEditable as={balise ?? "p"} editable={canEdit} value={valeur} placeholder={placeholder}
      multiline={multiligne} onCommit={edit(cle)} style={style} />
  )
}
