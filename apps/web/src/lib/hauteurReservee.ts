"use client"

// hauteurReservee — une zone qui défile réserve la hauteur de ce qui la surplombe.
//
// Relevé du 21 septembre, après la revue de l'éditeur (F05, F07). Le produit
// pose **onze barres qui restent en haut** — la barre d'outils du canevas, le
// bandeau « Page · 12 blocs », l'en-tête d'une section de réglages, la barre de
// filtres de l'atelier d'impression, le retour du téléphone… Aucune des sept
// surfaces qui défilent dessous ne réserve leur hauteur.
//
// Le produit connaît pourtant le geste, et il l'écrit une fois — dans
// `globals.css` :
//
//     html { scroll-padding-top: 80px; }
//
// C'est exactement cette règle. Elle sert à l'en-tête fixe de la page publique,
// et à lui seul : les zones qui défilent À L'INTÉRIEUR de l'éditeur ne sont pas
// `html`, et n'en héritent pas.
//
// Ce que ça donne pour le commerçant :
//
//   « le contrôle du nombre d'éléments par ligne apparaît partiellement sous la
//     barre fixe » — F05. On tabule jusqu'à un champ, le navigateur le fait
//     défiler dans la zone, et il s'arrête pile dessous. Le champ a le focus,
//     et on ne le voit pas. C'est le critère WCAG 2.4.11.
//
//   « la barre PAGE · 12 blocs recouvre le document pendant son défilement »
//     — F07. Elle est posée DANS la colonne du document, à la même origine que
//     le contenu : sans hauteur réservée, il n'y a aucune place à lui.
//
// La classe : **une zone qui défile réserve la hauteur de ce qui la surplombe.**
//
// Pas de constante : la hauteur est MESURÉE. Un nombre écrit à la main serait
// faux au premier zoom navigateur, à la première fenêtre moins haute, au
// premier libellé qui passe sur deux lignes — les trois cas que la revue
// demande justement de tester.

import { useEffect } from "react"

/** Une barre qui reste en haut se déclare, pour qu'on sache quoi mesurer. */
export const MARQUEUR_BARRE = "data-barre-collante"

/**
 * La hauteur à réserver, à partir de ce qu'on a mesuré.
 *
 * Plusieurs barres peuvent se poser au même `top: 0` dans une même zone — la
 * barre d'outils du canevas et le bandeau de page, par exemple. Elles se
 * recouvrent alors, et la place à réserver est celle de la PLUS HAUTE, pas leur
 * somme : additionner réserverait un vide que rien n'occupe.
 */
export function hauteurAReserver(hauteurs: readonly number[]): number {
  let max = 0
  for (const h of hauteurs) if (Number.isFinite(h) && h > max) max = h
  return Math.ceil(max)
}

/** L'ancêtre qui défile réellement, ou `null` — c'est lui qui doit réserver. */
export function zoneQuiDefile(depuis: HTMLElement | null): HTMLElement | null {
  let n: HTMLElement | null = depuis?.parentElement ?? null
  while (n && n !== document.body) {
    const s = getComputedStyle(n)
    if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1) return n
    n = n.parentElement
  }
  return null
}

/**
 * Mesure les barres déclarées de cet écran et réserve leur hauteur dans la zone
 * qui défile sous chacune.
 *
 * Appelé une fois par écran : les barres se déclarent elles-mêmes, et une barre
 * qui apparaît ou disparaît selon l'état n'oblige donc personne à recâbler quoi
 * que ce soit.
 */
export function useHauteurReservee(actif = true): void {
  useEffect(() => {
    if (!actif || typeof window === "undefined") return
    const reservees = new Set<HTMLElement>()

    const poser = () => {
      const parZone = new Map<HTMLElement, number[]>()
      for (const barre of Array.from(document.querySelectorAll<HTMLElement>(`[${MARQUEUR_BARRE}]`))) {
        const zone = zoneQuiDefile(barre)
        if (!zone) continue
        const h = barre.getBoundingClientRect().height
        if (h <= 0) continue
        parZone.set(zone, [...(parZone.get(zone) ?? []), h])
      }
      for (const [zone, hauteurs] of parZone) {
        zone.style.scrollPaddingTop = `${hauteurAReserver(hauteurs)}px`
        reservees.add(zone)
      }
    }

    poser()
    const ro = new ResizeObserver(poser)
    for (const b of Array.from(document.querySelectorAll<HTMLElement>(`[${MARQUEUR_BARRE}]`))) ro.observe(b)
    window.addEventListener("resize", poser)
    // Une barre peut apparaître avec un état (sélection multiple, aperçu) : on
    // remesure quand l'écran change de forme, sans observer chaque frappe.
    const mo = new MutationObserver(poser)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener("resize", poser)
      for (const z of reservees) z.style.scrollPaddingTop = ""
    }
  }, [actif])
}
