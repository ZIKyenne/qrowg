"use client"

import { useEffect, useState } from "react"

/**
 * Renvoie true quand la largeur de la fenêtre est <= breakpoint (768px par défaut).
 * Sert à adapter les styles inline (grilles, paddings, tailles) en mobile, là où
 * les media queries CSS ne s'appliquent pas (styles inline React).
 *
 * SSR-safe : false au premier rendu serveur, recalculé au montage client.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [breakpoint])
  return isMobile
}
