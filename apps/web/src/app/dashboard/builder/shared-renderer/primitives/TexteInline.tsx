"use client"
// Le rendu de texte de la PAGE PUBLIÉE — l'une des deux implémentations du
// contrat `RenduTexte` (voir renderTypes.ts).
//
// L'autre, `texteEditable`, vit dans `TexteEditable.tsx` depuis le lot v170.
// Elles étaient dans le même fichier, et ce fichier importait `InlineEditable`,
// le composant d'édition en place : cinq blocs le tirent, et les cinq sont
// atteints depuis le registre public. L'éditeur voyageait donc avec le
// visiteur, dans un module que la garde de frontière ne nommait pas.
//
// La géométrie, elle, vit une seule fois dans la vue partagée : c'est tout
// l'intérêt de passer le rendu du texte en paramètre plutôt que d'écrire deux
// vues qui se recopient. Les séparer ne change rien à cela.
import type { RenduTexte } from "../renderTypes"

/** Rendu figé : la page publiée. */
export const texteFige: RenduTexte = ({ valeur, style, balise }) => {
  const T = (balise ?? "p") as "p" | "span" | "h1" | "h2"
  return <T style={style}>{valeur}</T>
}
