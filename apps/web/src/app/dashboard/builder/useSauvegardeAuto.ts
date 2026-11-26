"use client"

// useSauvegardeAuto — le branchement de la sauvegarde automatique de l'éditeur.
//
// Le COORDINATEUR (`saveController.ts`) est pur et testé : jamais deux écritures
// en parallèle, la dernière version gagne. Ce crochet en est le câble, sorti de
// BuilderV4 en v389 où il n'avait aucun test : attendre une pause dans la frappe
// avant d'écrire, écrire tout de suite sur demande, et — c'est ce qui manquait —
// ne rien perdre quand on quitte l'éditeur.
//
// **Le défaut trouvé en le sortant.** Au démontage, l'éditeur appelait
// `dispose()`, qui coupe tout. Quitter par un lien interne (« Mes pages » dans
// la barre latérale) moins de 0,8 s après une modification la jetait : le
// minuteur se déclenchait ensuite sur un coordinateur détruit. Et une
// modification en file derrière une sauvegarde en cours était jetée aussi.
// L'avertissement de sortie ne couvre que la fermeture de l'onglet
// (`beforeunload`) : un lien interne ne le déclenche pas. Désormais, au
// démontage, l'attente est écrite tout de suite et le coordinateur est
// « lâché » : il se tait, mais finit d'écrire.

import { useEffect, useRef } from "react"
import { createSaveController, type SaveController, type SaveState } from "./saveController"

/** Délai de calme avant d'écrire : une rafale de frappes = une écriture. */
export const DELAI_SAUVEGARDE_MS = 800

export type SauvegardeAuto<S> = {
  /** Une modification : on écrira `lire()` après un moment de calme. */
  programmer(lire: () => S | null): void
  /** Tout de suite (bouton « Enregistrer », publication). Annule l'attente. */
  maintenant(lire: () => S | null): void
  /** Écrit la frappe en attente puis attend que tout soit en base (avant de publier). */
  flush(): Promise<boolean>
  /** Après une erreur, retente avec la DERNIÈRE version. */
  retry(): void
}

export function useSauvegardeAuto<S>(opts: {
  persist: (s: S) => Promise<void>
  onEtat: (e: SaveState) => void
  delai?: number
}): SauvegardeAuto<S> {
  const persistRef = useRef(opts.persist)
  const onEtatRef = useRef(opts.onEtat)
  persistRef.current = opts.persist
  onEtatRef.current = opts.onEtat
  const delai = opts.delai ?? DELAI_SAUVEGARDE_MS

  const ctrlRef = useRef<SaveController<S> | null>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  /** Ce qu'il faudra écrire à la fin du délai — relu à ce moment-là, pas avant. */
  const enAttente = useRef<(() => S | null) | null>(null)

  const ctrl = (): SaveController<S> => {
    if (!ctrlRef.current) {
      ctrlRef.current = createSaveController<S>({
        persist: s => persistRef.current(s),
        onChange: e => onEtatRef.current(e),
      })
    }
    return ctrlRef.current
  }

  const ecrire = (lire: () => S | null) => {
    const s = lire()
    if (s !== null) ctrl().request(s)
  }

  /** Ce qui attendait son délai part maintenant (publication, départ). */
  const envoyerLAttente = () => {
    clearTimeout(minuteur.current)
    const lire = enAttente.current
    enAttente.current = null
    if (lire) ecrire(lire)
  }

  const api = useRef<SauvegardeAuto<S> | null>(null)
  if (!api.current) {
    api.current = {
      programmer(lire) {
        clearTimeout(minuteur.current)
        enAttente.current = lire
        minuteur.current = setTimeout(() => { enAttente.current = null; ecrire(lire) }, delai)
      },
      maintenant(lire) {
        clearTimeout(minuteur.current)
        enAttente.current = null
        ecrire(lire)
      },
      // Une frappe encore dans son délai part D'ABORD (v391) : sans cela, « Publier »
      // juste après une modification mettait en ligne la version d'avant.
      flush() { envoyerLAttente(); return ctrl().flush() },
      retry: () => ctrl().retry(),
    }
  }

  useEffect(() => () => {
    // On quitte l'éditeur : ce qui attendait son délai part maintenant, puis le
    // coordinateur finit d'écrire sans plus rien dire à un écran qui n'est plus là.
    envoyerLAttente()
    ctrlRef.current?.lacher()
    // Un nouveau montage (double montage du mode strict, en développement)
    // repart avec un coordinateur neuf.
    ctrlRef.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return api.current
}
