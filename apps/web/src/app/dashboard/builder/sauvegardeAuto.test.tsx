// @vitest-environment jsdom
//
// La sauvegarde automatique de l'éditeur, jouée — point 7 de la vague 4, lot 3
// (v389). On monte le vrai crochet dans un composant, on « tape », on attend,
// on quitte l'écran, et on regarde ce qui a été écrit, et dans quel ordre.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { useSauvegardeAuto, DELAI_SAUVEGARDE_MS, type SauvegardeAuto } from "./useSauvegardeAuto"
import type { SaveState } from "./saveController"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Une base qu'on fait répondre quand on veut : chaque écriture attend son feu vert. */
function base() {
  const ecrits: string[] = []
  const enCours: { texte: string; ok: () => void; ko: () => void }[] = []
  let automatique = true
  return {
    ecrits, enCours,
    manuelle() { automatique = false },
    persist: (texte: string) => new Promise<void>((resolve, reject) => {
      if (automatique) { ecrits.push(texte); resolve(); return }
      enCours.push({ texte, ok: () => { ecrits.push(texte); resolve() }, ko: () => reject(new Error("réseau")) })
    }),
  }
}

let hote: HTMLDivElement
let racine: Root
let api: SauvegardeAuto<string>
let etats: SaveState[]

function Editeur({ persist }: { persist: (s: string) => Promise<void> }) {
  api = useSauvegardeAuto<string>({ persist, onEtat: e => etats.push(e) })
  return null
}
const monter = (b: ReturnType<typeof base>) => act(() => racine.render(<Editeur persist={b.persist} />))
const quitter = () => act(() => racine.unmount())
/** Laisse passer le temps ET les promesses qu'il libère. */
const attendre = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }

beforeEach(() => {
  vi.useFakeTimers()
  etats = []
  hote = document.createElement("div"); document.body.appendChild(hote); racine = createRoot(hote)
})
afterEach(() => { try { act(() => racine.unmount()) } catch { /* déjà démonté */ } hote.remove(); vi.useRealTimers() })

describe("pendant qu'on tape", () => {
  it("une rafale de frappes = une seule écriture, de la dernière version, après un moment de calme", async () => {
    const b = base(); monter(b)
    for (const v of ["B", "Bo", "Bon", "Bonj", "Bonjour"]) { act(() => api.programmer(() => v)); await attendre(100) }
    expect(b.ecrits, "rien avant le calme").toEqual([])
    await attendre(DELAI_SAUVEGARDE_MS)
    expect(b.ecrits).toEqual(["Bonjour"])
  })

  it("la version écrite est relue à la fin du délai, pas au moment de la frappe", async () => {
    const b = base(); monter(b)
    let ecran = "avant"
    act(() => api.programmer(() => ecran))
    ecran = "après"
    await attendre(DELAI_SAUVEGARDE_MS)
    expect(b.ecrits).toEqual(["après"])
  })

  it("« Enregistrer » écrit tout de suite et annule l'attente : pas de seconde écriture", async () => {
    const b = base(); monter(b)
    act(() => api.programmer(() => "brouillon"))
    act(() => api.maintenant(() => "brouillon"))
    await attendre(0)
    expect(b.ecrits).toEqual(["brouillon"])
    await attendre(DELAI_SAUVEGARDE_MS * 2)
    expect(b.ecrits, "le minuteur annulé ne réécrit pas").toEqual(["brouillon"])
  })

  it("une page pas encore prête n'écrit rien (les blocs de démonstration ne partent pas)", async () => {
    const b = base(); monter(b)
    act(() => api.programmer(() => null))
    act(() => api.maintenant(() => null))
    await attendre(DELAI_SAUVEGARDE_MS * 2)
    expect(b.ecrits).toEqual([])
  })

  it("l'écran suit : non enregistré, en cours, enregistré", async () => {
    const b = base(); b.manuelle(); monter(b)
    act(() => api.maintenant(() => "v1"))
    await attendre(0)
    expect(etats.at(-1)).toMatchObject({ status: "saving", dirty: true })
    await act(async () => { b.enCours[0].ok() })
    await attendre(0)
    expect(etats.at(-1)).toMatchObject({ status: "saved", dirty: false })
  })

  it("une erreur se dit, et « Réessayer » écrit la DERNIÈRE version", async () => {
    const b = base(); b.manuelle(); monter(b)
    act(() => api.maintenant(() => "v1"))
    await attendre(0)
    await act(async () => { b.enCours[0].ko() })
    await attendre(0)
    expect(etats.at(-1)).toMatchObject({ status: "error", dirty: true })
    act(() => api.retry())
    await attendre(0)
    await act(async () => { b.enCours[1].ok() })
    await attendre(0)
    expect(b.ecrits).toEqual(["v1"])
    expect(etats.at(-1)?.status).toBe("saved")
  })

  it("publier attend que la dernière version soit écrite", async () => {
    const b = base(); b.manuelle(); monter(b)
    act(() => api.maintenant(() => "v1"))
    let fini: boolean | null = null
    act(() => { void api.flush().then(v => { fini = v }) })
    await attendre(0)
    expect(fini, "pas avant la base").toBeNull()
    await act(async () => { b.enCours[0].ok() })
    await attendre(0)
    expect(fini).toBe(true)
  })
})

describe("en quittant l'éditeur — rien ne se perd", () => {
  it("une modification encore dans son délai est écrite au départ", async () => {
    // Le défaut de v389 : « Mes pages » cliqué juste après une frappe.
    const b = base(); monter(b)
    act(() => api.programmer(() => "dernière frappe"))
    await attendre(200)
    quitter()
    await attendre(0)
    expect(b.ecrits).toEqual(["dernière frappe"])
    await attendre(DELAI_SAUVEGARDE_MS * 2)
    expect(b.ecrits, "et une seule fois").toEqual(["dernière frappe"])
  })

  it("une modification en file derrière une écriture en cours est écrite après elle", async () => {
    const b = base(); b.manuelle(); monter(b)
    act(() => api.maintenant(() => "v1"))
    await attendre(0)
    act(() => api.maintenant(() => "v2"))           // en file
    quitter()
    await act(async () => { b.enCours[0].ok() })   // v1 arrive en base
    await attendre(0)
    expect(b.enCours.map(e => e.texte), "v2 part ensuite").toEqual(["v1", "v2"])
    await act(async () => { b.enCours[1].ok() })
    await attendre(0)
    expect(b.ecrits).toEqual(["v1", "v2"])
  })

  it("une version restée en échec est retentée une fois au départ", async () => {
    const b = base(); b.manuelle(); monter(b)
    act(() => api.maintenant(() => "v1"))
    await attendre(0)
    await act(async () => { b.enCours[0].ko() })
    await attendre(0)
    quitter()
    await attendre(0)
    expect(b.enCours.map(e => e.texte)).toEqual(["v1", "v1"])
  })

  it("parti, l'éditeur n'entend plus parler de la sauvegarde (aucune mise à jour d'un écran disparu)", async () => {
    const b = base(); b.manuelle(); monter(b)
    act(() => api.programmer(() => "v1"))
    quitter()
    const avant = etats.length
    await attendre(0)
    await act(async () => { b.enCours[0].ok() })
    await attendre(0)
    expect(b.ecrits).toEqual(["v1"])
    expect(etats.length, "aucun état annoncé après le départ").toBe(avant)
  })

  it("sans rien en attente, partir n'écrit rien", async () => {
    const b = base(); monter(b)
    act(() => api.maintenant(() => "v1"))
    await attendre(0)
    quitter()
    await attendre(DELAI_SAUVEGARDE_MS * 2)
    expect(b.ecrits).toEqual(["v1"])
  })
})
