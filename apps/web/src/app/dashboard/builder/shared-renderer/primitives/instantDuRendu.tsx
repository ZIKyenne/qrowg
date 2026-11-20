"use client"
// instantDuRendu — l'heure des blocs « du moment », sans mismatch d'hydratation
// (20 nov.).
//
// La page publiée est en cache 60 s (ISR). Un bloc qui calculait son état avec
// l'heure COURANTE dès le premier rendu (créneaux, attente, ardoise, fournées,
// planning, programme…) pouvait différer entre le HTML du serveur et le premier
// rendu du téléphone : React jetait alors le HTML pour tout refaire (#418).
//
// Le motif : la page serveur transmet l'INSTANT où elle a été rendue ; le premier
// rendu côté client calcule avec ce même instant (HTML identique, contenu gardé
// pour le référencement), puis, monté, le bloc se recale sur l'heure réelle et
// se recalcule chaque minute. Hors de la page publiée (éditeur, galerie), pas de
// cache : l'heure courante suffit.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

const Instant = createContext<number | null>(null)

export function InstantDuRendu({ instant, children }: { instant: number | null; children: ReactNode }) {
  return <Instant.Provider value={instant}>{children}</Instant.Provider>
}

/** Un état calculé à partir de l'heure : instant du rendu d'abord, heure réelle une fois monté, puis chaque minute. */
export function useALaMinute<T>(calcul: (maintenant: Date) => T, deps: readonly unknown[]): T {
  const rendu = useContext(Instant)
  // Seul endroit autorisé à lire l'horloge dans un état initial — et seulement
  // hors de la page publiée (sans instant de rendu transmis).
  const [v, setV] = useState<T>(() => calcul(new Date(rendu ?? Date.now())))
  useEffect(() => {
    const maj = () => setV(calcul(new Date()))
    maj()
    const t = setInterval(maj, 60_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return v
}
