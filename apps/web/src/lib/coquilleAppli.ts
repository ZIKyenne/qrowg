"use client"

// coquilleAppli.ts — deux gestes qui font qu'on se sent dans une APPLI, et pas
// sur un site : lot 1 « appli » du 18 nov. (REFONTE_MOBILE_QROWG.md, D.4).
//
//  1. Revenir sur une liste retrouve l'endroit où on était. La zone de travail
//     du tableau de bord (`.qd-main`) est le seul ascenseur de l'application :
//     le navigateur ne sait pas restaurer un ascenseur intérieur. On note la
//     position par écran (mémoire de l'ONGLET, oubliée à sa fermeture) et on la
//     rend au RETOUR — jamais à une navigation ordinaire, qui repart en haut.
//
//  2. Le titre de l'écran remonte dans la barre du haut quand le grand titre de
//     la page sort de l'écran, comme sur iPhone. On sait toujours où on est.
//
// La décision est pure (testée) ; les deux crochets ne font que la brancher.

import { useEffect, useState, type RefObject } from "react"
import { lireJson, ecrireJson } from "./memoireDuNavigateur"

const CLE = "qrowg-defilement"
/** Un `popstate` vieux de plus que ça n'explique plus un changement d'écran. */
export const FENETRE_DU_RETOUR_MS = 1500

/**
 * Où placer l'ascenseur en arrivant sur un écran.
 *  · par le bouton retour (ou avant), avec une position notée : on la rend ;
 *  · sinon : en haut. Une navigation ordinaire ne rouvre pas un écran au milieu.
 */
export function positionEnArrivant(o: { retourIlYAMs: number | null; notee: number | undefined }): number {
  const parRetour = o.retourIlYAMs !== null && o.retourIlYAMs >= 0 && o.retourIlYAMs < FENETRE_DU_RETOUR_MS
  return parRetour && typeof o.notee === "number" && o.notee > 0 ? Math.round(o.notee) : 0
}

// Le dernier `popstate`, quel qu'en soit l'auteur. Un retour qui ferme une
// feuille ne change pas d'écran : il n'est lu que si l'écran change aussitôt.
let dernierRetour = 0
if (typeof window !== "undefined") window.addEventListener("popstate", () => { dernierRetour = Date.now() })

export function useDefilementRetrouve(zone: RefObject<HTMLElement | null>, chemin: string) {
  useEffect(() => {
    const el = zone.current
    if (!el) return
    const positions = lireJson<Record<string, number>>(CLE, {}, "onglet")
    const cible = positionEnArrivant({
      retourIlYAMs: dernierRetour ? Date.now() - dernierRetour : null,
      notee: positions[chemin],
    })
    // Le contenu d'une liste arrive parfois après le premier rendu : on réessaie
    // quelques images, le temps qu'il y ait de quoi défiler jusque-là.
    let essais = 0, image = 0
    const placer = () => {
      el.scrollTop = cible
      if (cible > 0 && Math.abs(el.scrollTop - cible) > 2 && essais++ < 20) image = requestAnimationFrame(placer)
    }
    placer()

    let attente: ReturnType<typeof setTimeout> | undefined
    const noter = () => {
      clearTimeout(attente)
      attente = setTimeout(() => {
        const p = lireJson<Record<string, number>>(CLE, {}, "onglet")
        p[chemin] = el.scrollTop
        ecrireJson(CLE, p, "onglet")
      }, 120)
    }
    el.addEventListener("scroll", noter, { passive: true })
    return () => { cancelAnimationFrame(image); clearTimeout(attente); el.removeEventListener("scroll", noter) }
  }, [zone, chemin])
}

/**
 * Vrai quand le grand titre (le premier <h1> de la zone) n'est plus visible :
 * la barre du haut le reprend alors à sa place.
 */
export function useTitreSorti(zone: RefObject<HTMLElement | null>, chemin: string): boolean {
  const [sorti, setSorti] = useState(false)
  useEffect(() => {
    setSorti(false)
    const el = zone.current
    if (!el || typeof IntersectionObserver === "undefined") return
    let obs: IntersectionObserver | null = null
    // Le titre de l'écran suivant n'est pas encore là au premier rendu : on le
    // cherche le temps qu'il arrive.
    let essais = 0, image = 0
    const brancher = () => {
      const h1 = el.querySelector("h1")
      if (!h1) { if (essais++ < 30) image = requestAnimationFrame(brancher); return }
      obs = new IntersectionObserver(([e]) => setSorti(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0)), { root: el, threshold: 0 })
      obs.observe(h1)
    }
    brancher()
    return () => { cancelAnimationFrame(image); obs?.disconnect() }
  }, [zone, chemin])
  return sorti
}
