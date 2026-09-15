"use client"

// Reglage — le nom d'un réglage, et le champ qu'il nomme.
//
// Relevé du 15 septembre. Le produit écrit 166 étiquettes. **Quarante-six**
// désignent leur champ — par `htmlFor`, ou en l'englobant. **Cent vingt ne
// désignent rien** : le texte est là, écrit, juste, visible, et il n'est relié à
// aucun champ.
//
// Sur ces cent vingt, cinquante et une sont posées DIRECTEMENT au-dessus d'un
// vrai champ de saisie — le cas le plus net :
//
//   builder/builderPanels.tsx          27
//   profile/page.tsx                    7
//   domains/DomainRoutesPanel.tsx       3
//   templates/page.tsx                  3
//   analytics/GoalsDashboard.tsx        3
//   … et huit autres écrans
//
// Ce que ça coûte, concrètement :
//
//  · un lecteur d'écran annonce le champ par son `placeholder` — donc par un
//    EXEMPLE (« Jean Dupont »), jamais par son nom (« Nom complet ») ;
//  · cliquer le mot ne place pas le curseur dans le champ, alors que ce geste
//    marche dans tous les formulaires du web et dans tout le système ;
//  · sur un téléphone, le mot n'agrandit pas la cible : onze pixels de surface
//    morte juste au-dessus d'un champ qu'on vise au pouce.
//
// Et le produit sait faire : quarante-six fois.
//
// La règle posée : **un nom de réglage désigne le champ qu'il nomme.**
//
// Ce composant ne rend AUCUN élément en plus : un fragment, l'étiquette et le
// champ, exactement les deux frères d'avant — une grille ou une rangée `flex`
// autour ne voit aucune différence. Il tient l'identifiant, c'est tout.

import { useId, type CSSProperties, type ReactNode } from "react"

export function Reglage({ nom, style, className, children }: {
  /** Le nom du réglage, tel qu'on le lit. */
  nom: ReactNode
  style?: CSSProperties
  className?: string
  /** Le champ, qui reçoit l'identifiant que porte l'étiquette. */
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <>
      <label htmlFor={id} style={style} className={className}>{nom}</label>
      {children(id)}
    </>
  )
}
