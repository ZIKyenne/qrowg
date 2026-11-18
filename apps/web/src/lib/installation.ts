"use client"

// installation.ts — installer QRowg sur le téléphone, comme une appli (lot 3
// « appli », 18 nov.).
//
// Le produit était installable depuis longtemps (manifeste `standalone`), mais
// personne ne le savait : rien ne le proposait, et rien ne savait s'il l'était
// déjà. Trois cas, et trois seulement :
//
//  · Android (Chrome, Edge, Samsung…) annonce qu'il PEUT installer, par
//    l'événement `beforeinstallprompt`. On le garde, et un bouton « Installer »
//    ouvre la vraie fenêtre du système. C'est le seul cas en un toucher ;
//  · iPhone / iPad : Safari ne propose rien par programme. On donne les gestes
//    (Partager, puis « Sur l'écran d'accueil ») ;
//  · Android sans l'événement (navigateur qui ne le fait pas) : les gestes du
//    menu ⋮.
//
// Et une règle : ouvert DEPUIS l'icône (mode `standalone`), on ne dit plus rien.
// Sur ordinateur non plus : la demande porte sur le téléphone.

import { useEffect, useState } from "react"
import { lire, ecrire } from "./memoireDuNavigateur"

export type ModeInstallation = "installee" | "native" | "ios" | "android" | "aucun"

/** Décision pure : ce qu'on peut proposer sur cet appareil. */
export function modeInstallation(o: { ua: string; standalone: boolean; offreNative: boolean; tactile: boolean }): ModeInstallation {
  if (o.standalone) return "installee"
  if (o.offreNative) return "native"
  // iPadOS se présente comme un Mac : on le reconnaît au toucher.
  if (/iPhone|iPad|iPod/i.test(o.ua) || (/Macintosh/i.test(o.ua) && o.tactile)) return "ios"
  if (/Android/i.test(o.ua)) return "android"
  return "aucun"
}

/** Les gestes à faire quand le système ne propose pas l'installation lui-même. */
export function etapesInstallation(mode: ModeInstallation): string[] {
  if (mode === "ios") return [
    "Touchez Partager, le carré avec une flèche, en bas de l'écran.",
    "Choisissez « Sur l'écran d'accueil ».",
    "Touchez « Ajouter » : l'icône QRowg apparaît avec vos applis.",
  ]
  if (mode === "android") return [
    "Touchez le menu ⋮ en haut à droite du navigateur.",
    "Choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ».",
    "Confirmez : l'icône QRowg apparaît avec vos applis.",
  ]
  return []
}

/** L'invitation de l'Accueil revient au bout de ce délai après « Plus tard ». */
export const REPORT_JOURS = 30
const CLE_REPORT = "qrowg-installation-reportee"

/** L'Accueil invite-t-il ? Seulement avec une page en ligne : il y a alors quelque chose à garder sous la main. */
export function inviterSurLAccueil(o: { mode: ModeInstallation; pagesEnLigne: number; reporteeLe: number | null; maintenant: number }): boolean {
  if (o.mode === "installee" || o.mode === "aucun") return false
  if (o.pagesEnLigne < 1) return false
  if (o.reporteeLe !== null && o.maintenant - o.reporteeLe < REPORT_JOURS * 864e5) return false
  return true
}

// ── Le navigateur ────────────────────────────────────────────────────────────

type OffreInstallation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

// L'événement n'arrive qu'UNE fois, au chargement : on l'écoute dès que ce
// module est chargé (la coquille du tableau de bord l'importe), pas quand la
// carte apparaît — elle arrive souvent bien après.
let offre: OffreInstallation | null = null
let installeeIci = false
const abonnes = new Set<() => void>()
const prevenir = () => abonnes.forEach(f => f())
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault()        // pas le bandeau automatique : c'est NOTRE carte qui propose
    offre = e as OffreInstallation
    prevenir()
  })
  window.addEventListener("appinstalled", () => { offre = null; installeeIci = true; prevenir() })
}

function lireMode(): ModeInstallation {
  if (typeof window === "undefined") return "aucun"
  const standalone = installeeIci
    || window.matchMedia?.("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
  return modeInstallation({ ua: navigator.userAgent, standalone, offreNative: !!offre, tactile: navigator.maxTouchPoints > 1 })
}

export function useInstallation() {
  // « aucun » au serveur et au premier rendu : la carte n'apparaît qu'une fois
  // le navigateur lu, sans décalage d'hydratation.
  const [mode, setMode] = useState<ModeInstallation>("aucun")
  useEffect(() => {
    const maj = () => setMode(lireMode())
    maj()
    abonnes.add(maj)
    return () => { abonnes.delete(maj) }
  }, [])
  return {
    mode,
    /** Ouvre la fenêtre d'installation du système (Android). Vrai si acceptée. */
    async installer(): Promise<boolean> {
      const o = offre
      if (!o) return false
      await o.prompt()
      const { outcome } = await o.userChoice
      offre = null
      prevenir()
      return outcome === "accepted"
    },
  }
}

export function reporteeLe(): number | null {
  const v = Number(lire(CLE_REPORT))
  return Number.isFinite(v) && v > 0 ? v : null
}
export function reporterLInvitation(): void { ecrire(CLE_REPORT, String(Date.now())) }
