"use client"
// styleDuQr.ts — un QR se dessine d'UNE façon, dans le QR Studio comme sur un
// support imprimé (vague 3, revue du 23 nov.).
//
// Le QR Studio enregistre le style d'un QR (couleurs, modules, yeux, dégradé,
// logo, correction d'erreur) ; le Print Studio l'ignorait et redessinait le QR à
// sa façon — couleurs de l'ambiance du support, modules carrés, correction M,
// sans logo. Le QR imprimé n'était pas le QR dessiné.
//
// Les deux règles de rendu du QR Studio vivent ici, une seule fois :
//  · le style enregistré, complété des valeurs par défaut, avec le logo de
//    l'ancienne colonne `logo_url` quand `style_config` n'en porte pas ;
//  · un logo force la correction H (il masque des modules) ;
//  · le logo est COMPOSÉ (forme, fond) avant d'être posé (useStyleDeRendu).

import { useEffect, useState } from "react"
import { DEFAULT_STYLE } from "./styleQr"
import { composeLogo } from "./logoCompose"
import { attente } from "@/lib/reponseAttendue"
import type { QRStyleConfig } from "./qrRender"

export type Ecc = "L" | "M" | "Q" | "H"
/** Les colonnes d'un QR enregistré qui disent comment il se dessine. */
export type QrEnregistre = {
  foreground_color?: string | null
  background_color?: string | null
  error_correction?: string | null
  style_config?: Partial<QRStyleConfig> | null
  logo_url?: string | null
}
export type RenduQr = { fg: string; bg: string; ecc: Ecc; style: QRStyleConfig }

/** Les colonnes à demander à la base pour dessiner un QR comme le QR Studio. */
export const COLONNES_DU_STYLE = "foreground_color, background_color, error_correction, style_config, logo_url"

/** Le style complet, tel que le QR Studio le charge. */
export function styleComplet(row: QrEnregistre): QRStyleConfig {
  const sc: QRStyleConfig = { ...DEFAULT_STYLE, ...(row.style_config ?? {}) }
  if (!sc.logoUrl && row.logo_url) sc.logoUrl = row.logo_url
  return sc
}

/** Un logo masque des modules : la correction monte à H. */
export function eccEffectif(style: QRStyleConfig, ecc: Ecc): Ecc {
  return style.logoUrl ? "H" : ecc
}

const ECC = new Set(["L", "M", "Q", "H"])
/** Tout ce qu'il faut pour dessiner ce QR comme le QR Studio le montre. */
export function renduDuQr(row: QrEnregistre): RenduQr {
  const style = styleComplet(row)
  const ecc = (ECC.has(String(row.error_correction)) ? row.error_correction : "M") as Ecc
  return { fg: row.foreground_color || "#080808", bg: row.background_color || "#FFFFFF", ecc: eccEffectif(style, ecc), style }
}

/** Le style prêt à dessiner : le logo composé (forme, fond) remplace le logo brut dès qu'il est prêt. */
export function useStyleDeRendu(style: QRStyleConfig): QRStyleConfig {
  const [compose, setCompose] = useState("")
  useEffect(() => {
    const a = attente()
    const src = style.logoUrl
    if (!src) { setCompose(""); return }
    composeLogo(src, { shape: style.logoShape, bg: style.logoBg, bgColor: style.logoBgColor })
      .then(a.siEncoreLa(setCompose))
      .catch(a.siEncoreLa(() => setCompose(src)))
    return a.abandonner
  }, [style.logoUrl, style.logoShape, style.logoBg, style.logoBgColor])
  return (style.logoUrl && compose && compose !== style.logoUrl) ? { ...style, logoUrl: compose } : style
}
