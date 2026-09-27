"use client"

// Primitive Button QRowg — 1re brique du design system (Bible Ch.2/Ch.3).
// Styles en CLASSES (globals.css → .ui-btn*) pour de vrais états :hover/:active
// impossibles en inline. Couleurs = tokens (var(--accent) suit l'utilisateur ;
// rôles sémantiques) ; motion = var(--mo-*) ; spinner = classe .mo-spin ;
// cible tactile md = 46px ; focus visible via la règle globale :focus-visible.
//
// ── Pourquoi un bouton-lien vit ici, et pas ailleurs (lot v181) ────────────
//
// Relevé du 24 septembre : **192 boutons écrits à la main** dans le produit,
// contre **39 usages de ce composant**. Sur le site public — celui que verront
// les commerçants au lancement — 71 faits main et **pas un seul** usage d'ici.
// Vingt-deux rayons de bordure différents, quarante-sept fonds littéraux.
//
// La cause n'est pas la négligence : la moitié de ces boutons sont des LIENS.
// `<Button>` rend un `<button>`, il ne sait pas porter un `href`. Chacun a donc
// redessiné le sien à côté — ce qui, à l'échelle du site, revient à ne pas avoir
// de bouton du tout.
//
// `ButtonLink` rend un lien avec EXACTEMENT les mêmes classes. Pas une variante
// de plus, pas une feuille de style de plus : la même. Les deux composants
// passent par `classesBouton()`, pour qu'aucun des deux ne puisse dériver de
// l'autre — c'est la règle que cette série applique depuis le lot v151.

import Link from "next/link"
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

/** L'apparence d'un bouton, écrite UNE fois pour les deux composants. */
export function classesBouton(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  fullWidth = false,
  className?: string,
): string {
  return ["ui-btn", `ui-btn--${variant}`, `ui-btn--${size}`, fullWidth ? "ui-btn--full" : "", className ?? ""]
    .filter(Boolean).join(" ")
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, fullWidth = false, leftIcon, rightIcon, disabled, children, className, ...rest },
  ref,
) {
  const isDisabled = disabled || loading
  return (
    <button ref={ref} className={classesBouton(variant, size, fullWidth, className)} disabled={isDisabled} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="mo-spin ui-btn__spin" aria-hidden />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
})

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  /**
   * Adresse hors du site. Rend un `<a>` simple au lieu de `<Link>` — Next ne
   * préchargera pas une page qu'il ne sert pas — et pose `rel="noopener
   * noreferrer"` si la cible s'ouvre dans un onglet.
   */
  externe?: boolean
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { href, variant = "primary", size = "md", fullWidth = false, leftIcon, rightIcon, children, className, externe, target, rel, ...rest },
  ref,
) {
  const cls = classesBouton(variant, size, fullWidth, className)
  const contenu = <>{leftIcon}{children}{rightIcon}</>
  // Une adresse absolue est externe, qu'on l'ait dit ou non : l'oublier
  // laisserait Next tenter de précharger un site qu'il ne sert pas.
  const dehors = externe || /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")
  const relSur = rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)

  if (dehors) {
    return <a ref={ref} href={href} className={cls} target={target} rel={relSur} {...rest}>{contenu}</a>
  }
  return <Link ref={ref} href={href} className={cls} target={target} rel={relSur} {...rest}>{contenu}</Link>
})
