// LienDEvitement — lot v199.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Mesuré au clavier sur les 54 pages du sitemap : **aucune n'offrait de moyen
// de sauter l'en-tête**. Un visiteur au clavier — ou au lecteur d'écran —
// retraversait le logo, les quatre liens de navigation, « Connexion » et
// « Composer ma page » à chaque page, avant d'atteindre le contenu.
//
// Trois à sept commandes selon la page. Ce n'est pas énorme, et je le dis :
// le défaut est réel (WCAG 2.4.1, niveau A) sans être dramatique. Mais il se
// corrige en un composant, et le composant se garde.
//
// ── Comment il se comporte ─────────────────────────────────────────────────
//
// Invisible tant qu'on ne le focalise pas — il ne prend aucune place et ne
// change rien pour qui navigue à la souris. Au premier Tab, il se pose en haut
// à gauche, par-dessus tout. `<main>` porte `tabIndex={-1}` pour que le focus
// y atterrisse vraiment : sans ça, le navigateur fait défiler la page mais
// laisse le focus derrière lui, et le Tab suivant repart de l'en-tête.

export function LienDEvitement() {
  // Tout l'habillage vit dans `globals.css`, sous `.lien-evitement`.
  //
  // Première version : il était écrit ici, en style INLINE. Le retrait
  // `translateY(-160%)` gagnait alors contre la règle `:focus-visible` de la
  // feuille de style — un style inline bat toujours un sélecteur — et le lien
  // restait hors de l'écran au moment même où on le focalisait. Il annonçait
  // donc une accessibilité qu'il n'offrait pas.
  return (
    <a href="#contenu" className="lien-evitement">
      Aller au contenu
    </a>
  )
}
