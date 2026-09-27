import Link from "next/link"

// FilDAriane — le fil d'Ariane des pages publiques, en un seul endroit.
//
// ── Pourquoi ce composant existe (lot v186) ────────────────────────────────
//
// Il était recopié à la main dans **neuf fichiers**, toujours de la même forme :
// un `<nav aria-label="Fil d'Ariane">`, des liens séparés par « · », et un
// `<span>` pour la page courante. Neuf copies, donc neuf endroits où corriger
// quoi que ce soit — et c'est exactement ce qui est arrivé.
//
// Relevé au navigateur le 27 septembre, sur iPhone 13 : ces liens font **15 px
// de haut**. En dessous du minimum tenable au pouce (44 px), et même en dessous
// du plancher absolu de WCAG 2.5.8 (24 px).
//
// Une copie sur neuf portait déjà le correctif, posé à la main :
// `display: "inline-flex", alignItems: "center", minHeight: 32, margin: "-8px 0"`
// dans `generateur-qr-code`. **La neuvième copie savait quelque chose que les
// huit autres ignoraient** — à 32 px, qui plus est, pas 44.
//
// C'est le troisième exemplaire du même motif trouvé en deux lots : le zoom iOS
// corrigé pour `.ps-root textarea` seulement (v185), les 44 px appliqués à
// `.filter-btn` mais pas à `.ex-voir` sur la même page (v186), et celui-ci. Le
// correctif local d'un défaut global est la forme que prend la dette quand
// personne n'a d'endroit où la payer une fois pour toutes. Cet endroit-ci.
//
// ── La hauteur sans le décalage ────────────────────────────────────────────
//
// Le lien devient une boîte de 44 px, mais une marge verticale négative rend au
// flux la hauteur gagnée : le fil reste visuellement à sa place, et le doigt
// touche une cible trois fois plus grande. C'est le procédé de la copie qui
// avait été corrigée, porté à 44 px et écrit une seule fois.

/** La teinte des pages publiques, celle que les neuf copies employaient déjà. */
const MUT = "var(--texte-discret)"
const INK = "#F5F0E8"

export interface Maillon {
  libelle: string
  /** Absent = page courante : rendue en texte, pas en lien. */
  href?: string
}

export interface FilDArianeProps {
  chemin: Maillon[]
  /** L'espace sous le fil. Les pages en employaient 18, 20 ou 22. */
  marge?: number
}

export function FilDAriane({ chemin, marge = 18 }: FilDArianeProps) {
  return (
    <nav aria-label="Fil d'Ariane" style={{ color: MUT, fontSize: 13, marginBottom: marge }}>
      {chemin.map((m, i) => (
        <span key={`${m.libelle}-${i}`}>
          {i > 0 && " · "}
          {m.href ? (
            <Link
              href={m.href}
              style={{
                color: MUT,
                textDecoration: "none",
                // La cible au pouce. `min-height` n'a aucun effet sur un élément
                // `inline` : c'est pour ça que la règle globale `nav a` du
                // fichier de styles, qui refuse volontairement de toucher au
                // `display`, ne pouvait pas corriger ce fil. `inline-flex` garde
                // le lien dans le flux du texte tout en lui donnant une hauteur.
                display: "inline-flex",
                alignItems: "center",
                minHeight: "var(--cible-pouce)",
                // Rend au flux la hauteur gagnée : le fil ne bouge pas à l'œil.
                margin: "-13px 0",
              }}
            >
              {m.libelle}
            </Link>
          ) : (
            <span style={{ color: INK }} aria-current="page">{m.libelle}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
