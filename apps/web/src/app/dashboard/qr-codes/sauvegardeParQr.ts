// sauvegardeParQr.ts — la sauvegarde automatique du Studio compact, sans perte.
//
// Relevé du 17 nov. : l'autosave du Studio compact attendait 650 ms puis
// enregistrait. Le minuteur était annulé à chaque changement de QR et au départ
// de la page : modifier une couleur puis cliquer aussitôt sur un autre QR (ou
// fermer l'onglet) PERDAIT la modification, sans un mot. Un échec réseau affichait
// « Échec — réessayer »… sur un texte qui ne réessayait rien.
//
// Ici :
//   · un contrôleur « single-flight » PAR QR (celui du Builder, déjà testé) : deux
//     QR modifiés coup sur coup ne se marchent pas dessus ;
//   · l'attente (debounce) est vidée — pas annulée — quand on change de QR ou
//     qu'on quitte la page ;
//   · un échec se réessaie seul une fois, puis attend un geste explicite.
//
// Pur : le réseau et les minuteurs sont injectés. Testable sans React.

import { createSaveController, type SaveController, type SaveState } from "@/app/dashboard/builder/saveController"

export type Planificateur = {
  plus: (fn: () => void, ms: number) => unknown
  annuler: (t: unknown) => void
}
const MINUTEURS: Planificateur = { plus: (fn, ms) => setTimeout(fn, ms), annuler: t => clearTimeout(t as ReturnType<typeof setTimeout>) }

export type OptionsSauvegarde<S> = {
  enregistrer: (qrId: string, s: S) => Promise<void>
  /** Appelé à chaque changement d'état d'un QR (y compris « en attente »). */
  onEtat?: (qrId: string, etat: EtatDeQr) => void
  delai?: number
  delaiReessai?: number
  minuteurs?: Planificateur
}

export type EtatDeQr = "idle" | "attente" | "saving" | "saved" | "error"

export function creerSauvegardeParQr<S>(o: OptionsSauvegarde<S>) {
  const delai = o.delai ?? 650
  const delaiReessai = o.delaiReessai ?? 3000
  const t = o.minuteurs ?? MINUTEURS
  const ctrls = new Map<string, SaveController<S>>()
  const reessaiFait = new Set<string>()
  let enAttente: { qrId: string; s: S; minuteur: unknown } | null = null

  function dire(qrId: string, e: EtatDeQr) { o.onEtat?.(qrId, e) }

  function controleur(qrId: string): SaveController<S> {
    let c = ctrls.get(qrId)
    if (c) return c
    c = createSaveController<S>({
      persist: s => o.enregistrer(qrId, s),
      onChange: (st: SaveState) => {
        if (st.status === "error") {
          dire(qrId, "error")
          // Une seule relance automatique : un réseau qui hoquette ne doit pas
          // demander un geste ; un refus durable, si.
          if (!reessaiFait.has(qrId)) { reessaiFait.add(qrId); t.plus(() => ctrls.get(qrId)?.retry(), delaiReessai) }
        } else if (st.status === "saved") { reessaiFait.delete(qrId); dire(qrId, "saved") }
        else if (st.status === "saving" || st.status === "queued") dire(qrId, "saving")
        else dire(qrId, "idle")
      },
    })
    ctrls.set(qrId, c)
    return c
  }

  /** Envoie tout de suite ce qui attendait la fin du délai. */
  function vider() {
    if (!enAttente) return
    const { qrId, s, minuteur } = enAttente
    enAttente = null
    t.annuler(minuteur)
    controleur(qrId).request(s)
  }

  return {
    /** Un réglage a changé : on enregistrera après `delai`, sauf nouveau changement. */
    modifier(qrId: string, s: S) {
      // Un autre QR attendait : il part maintenant, il ne se perd pas.
      if (enAttente && enAttente.qrId !== qrId) vider()
      if (enAttente) t.annuler(enAttente.minuteur)
      enAttente = { qrId, s, minuteur: t.plus(vider, delai) }
      dire(qrId, "attente")
    },
    vider,
    /** Tout est-il enregistré (rien en attente, rien en cours, aucun échec) ? */
    toutEstEnregistre(): boolean {
      if (enAttente) return false
      for (const c of ctrls.values()) if (c.getState().dirty) return false
      return true
    },
    /** Attend que tout soit enregistré. `true` si c'est le cas. */
    async attendre(): Promise<boolean> {
      vider()
      const r = await Promise.all([...ctrls.values()].map(c => c.flush()))
      return r.every(Boolean)
    },
    reessayer(qrId: string) { reessaiFait.delete(qrId); controleur(qrId).retry() },
    /** Ce qui reste à enregistrer pour un QR (pour un envoi de dernière chance). */
    enAttentePour(qrId: string): S | null { return enAttente?.qrId === qrId ? enAttente.s : null },
    fermer() { if (enAttente) t.annuler(enAttente.minuteur); for (const c of ctrls.values()) c.dispose() },
  }
}
