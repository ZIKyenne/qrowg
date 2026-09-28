import Link from "next/link"
import QrowgLogo from "@/components/QrowgLogo"

// PiedDeSiteCourt — lot v197.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Le même pied de page court — un logo, puis une rangée de liens séparés par
// des points médians — était recopié dans **huit fichiers de page**. Chacun
// avait sa propre liste de liens (c'est légitime : ils sont contextuels), mais
// aussi sa propre mise en forme, sa propre couleur locale, et sa propre
// hauteur de cible.
//
// Conséquence : une seule des huit copies avait reçu `minHeight:
// var(--cible-pouce)`. Les sept autres alignaient des liens de **16 px de
// haut** — sur téléphone, cinq cibles de 16 px côte à côte.
//
// C'est la signature de cette série : une population recopiée finit par ne plus
// dire la même chose. Un composant, une forme, un plancher.
//
// La liste des liens reste un paramètre : le pied de la page « Sécurité »
// pointe vers les mentions légales, celui de « Guides » vers le générateur.
// C'est le CONTENU qui varie, jamais la forme.

export type LienDePied = { href: string; libelle: string }

export function PiedDeSiteCourt({ liens }: { liens: LienDePied[] }) {
  return (
    <footer
      style={{
        position: "relative", zIndex: 1,
        borderTop: "1px solid var(--line)",
        padding: "24px var(--gouttiere)",
        textAlign: "center", color: "var(--texte-discret)", fontSize: 13,
      }}
    >
      <QrowgLogo size={16} />
      <nav
        aria-label="Liens de bas de page"
        style={{
          marginTop: 2, display: "flex", flexWrap: "wrap",
          justifyContent: "center", alignItems: "center",
        }}
      >
        {liens.map((l, i) => (
          <span key={l.href} style={{ display: "inline-flex", alignItems: "center" }}>
            <Link
              href={l.href}
              style={{
                color: "var(--texte-discret)", textDecoration: "none",
                display: "inline-flex", alignItems: "center",
                // Le plancher du pouce est LU, jamais recopié : c'est le jeton
                // posé au lot v186, après avoir trouvé 44 écrit à deux endroits
                // et 32 à un troisième.
                minHeight: "var(--cible-pouce)", padding: "0 10px",
              }}
            >
              {l.libelle}
            </Link>
            {i < liens.length - 1 && (
              <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
            )}
          </span>
        ))}
      </nav>
    </footer>
  )
}
