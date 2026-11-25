"use client"

// Le rendu du support imprimé : le visuel lui-même (palette, textes, QR,
// éléments libres, arrangés par la mise en page), la planche d'impression à
// taille réelle, la planche multi-supports, le packshot en scène, le QR
// vectoriel et la miniature de la bibliothèque. Sorti de PrintStudioClient
// (v383) : ce qu'on voit à l'écran et ce qui part à l'imprimeur sortent du
// MÊME composant, et il ne lit rien de l'état de l'atelier.

import { trimWidthMm, pageDims, mediaDims, marksMargin, CROP_LEN_MM, CROP_STROKE_MM, cssDImpression } from "./formatImpression"
import { createPortal } from "react-dom"
import Vignette from "@/components/Vignette"
import { useEffect, useRef } from "react"
import { modulesPourCharge, MODULES_SILENCE as MODULES_SILENCE_QR } from "../qr-codes/margeQr"
import { createQRSvg, type QRStyleConfig } from "../qr-codes/qrRender"
import { useStyleDeRendu, type RenduQr } from "../qr-codes/styleDuQr"
import { BRANDNAMES, LAYOUT_BY_ID, TYPOS, MESSAGES, type Item, type Style } from "./catalog"
import { sceneLayers, paletteFromStyle, scaleFor, SCENES, finishLayer, grad, gradStrong, traitInk } from "./mockup"
import { color as C } from "./tokens"
import { ajusterAuSupport, lignesDeTitre, partQrMax, type Pastille } from "./ajustement"
import { resolveLayoutId, hexDAccent, TITLE_WEIGHT, readableOn, shade, ICON_LIB, type FreeEl } from "./vocabulaireDuSupport"

/* Rendu du support (le visuel imprimé) — palette + texte + QR, arrangé par layout. */
export function SupportVisual({ item, pal, layout, brand, subtitle, title, cta, size, qrValue, qrImg, qrRendu, qrBadge, qrPos, qrStatic, qrVector, physW, qrDx, qrDy, qrFree, qrFx, qrFy, logo, logoUrl, bgFinish, bgImage, frame, accent, titleCase, titleWeight, titleColor, subColor, ctaColor, blockY, eCorner, eAccent, eTypo, eAlign, eTitle, ePad, freeEls, contentFree, w, h, onFocus }:
  { item: Item; style: Style; pal: ReturnType<typeof paletteFromStyle>; layout: { content: string; deco: string | null }; brand: string; subtitle: string; title: string; cta: string; size: { factor: number }; qrValue: string; qrImg: string | null; qrRendu?: RenduQr | null; qrBadge: string; qrPos: string; qrStatic?: boolean; qrVector?: boolean; physW: number; qrDx: number; qrDy: number; qrFree?: boolean; qrFx?: number; qrFy?: number; logo: string; logoUrl: string | null; bgFinish: string; bgImage: string | null; frame: string; accent: string; titleCase: string; titleWeight: string; titleColor: string; subColor: string; ctaColor: string; blockY: number; eCorner: string; eAccent: string; eTypo: string; eAlign: "left" | "center" | "right"; eTitle: number; ePad: number; freeEls?: FreeEl[]; contentFree?: boolean; w: number; h: number; onFocus?: (panel: string) => void }) {
  const typo = TYPOS.find(t => t.id === eTypo)
  const titleFont = typo?.t ? `"${typo.t}",Georgia,serif` : pal.titleFont
  const bodyFont = typo?.b ? `"${typo.b}",Helvetica,Arial,sans-serif` : pal.bodyFont
  const unit = Math.min(w, h)
  const isRound = item.shape === "round"
  // Réf. de taille du TEXTE = min(w,h), REHAUSSÉE sur les supports très hauts/étroits (marque-page 55×160)
  // pour que le titre ne soit pas riquiqui à côté du QR (le QR, lui, reste piloté par sa taille physique).
  const sizeRef = unit * (item.ratio < 0.6 ? Math.min(1.5, 0.6 / item.ratio) : 1)
  // Sur un support ROND, le contenu doit tenir dans le CERCLE inscrit (≈ 0,707 × Ø) : marge plancher (~15 %).
  const pad = Math.max(isRound ? unit * 0.15 : 0, unit * 0.09 * ePad)
  const cornerInset = isRound ? unit * 0.15 : pad * 0.5   // repères de coin visibles même sur un rond (près du carré inscrit)
  const titleSize = sizeRef * 0.11 * eTitle
  // Taille du QR pilotée par la PHYSIQUE (item.qrMm × facteur), convertie en px via l'échelle du support.
  // Garde-fou anti-débordement : rond = QR modeste (cercle inscrit + kicker retiré) ; « QR géant » = laisse la place
  // au titre/bouton ; sinon borné à la largeur. Aperçu/planche/contrôle réfèrent toujours le MÊME mm hors garde-fou.
  // Borne PARTAGÉE avec le curseur du panneau (ajustement.partQrMax) : c'étaient
  // deux nombres sans rapport — 72 % de la plus petite dimension côté réglage,
  // 44 % du diamètre côté rendu. Le panneau annonçait 36 mm, le dessin en faisait
  // 22, et de « Compact » à « Maximum » l'image ne bougeait presque pas.
  const qrMax = unit * partQrMax(isRound, qrBadge as Pastille, isRound ? 0.15 : pad / unit, layout.content === "qrbig")
  const qrPx = Math.min(qrMax, Math.max(24, item.qrMm * size.factor * (w / physW)))
  const radiusEl = eCorner === "vif" ? 0 : eCorner === "rond" ? 999 : 10

  // Couleur d'accent : override d'ambiance (« auto » garde pal.band / pal.ctaBg).
  const accHex = hexDAccent(accent)
  const bandColor = accHex || pal.band
  const bandFg = accHex ? readableOn(accHex) : pal.bandFg
  const ctaBg = accHex || pal.ctaBg
  const ctaFg = accHex ? readableOn(accHex) : pal.ctaFg
  const effWeight = TITLE_WEIGHT[titleWeight] || Number(pal.titleWeight) || 500
  const shownTitle = titleCase === "upper" ? title.toUpperCase() : title

  // ── Le contenu doit TENIR dans le support (voir ajustement.ts) ─────────────
  // Les tailles ci-dessus sont des fractions du support, jamais confrontées à la
  // place réelle. Sur un sticker rond de 50 mm, un modèle demandait 0,94 fois le
  // diamètre pour 0,70 disponible : le bloc étant centré et le conteneur coupant
  // ce qui dépasse, le titre était tranché par le haut et le bouton par le bas.
  // On mesure, on réduit, et on ne coupe plus.
  const pileVerticale = layout.content === "stack" || layout.content === "center" || layout.content === "qrbig"
  // La pastille RONDE doit CIRCONSCRIRE le QR, qui est carré : son diamètre vaut
  // au moins la diagonale du carré, soit q√2. Avec une marge fixe de 0,05 × le
  // support, le disque était plus PETIT que cette diagonale — les quatre coins du
  // QR dépassaient du blanc et se posaient sur le fond sombre. Un QR dont les
  // coins mordent le fond, c'est un QR qu'une partie des lecteurs refuse.
  //
  // Le QR que l'atelier DESSINE (canvas, vecteur) porte déjà ses quatre modules
  // de silence, dans la couleur de la pastille (qrRender → margePourCharge). La
  // pastille ajoutait les siens par-dessus : ~6,5 modules de blanc de chaque côté
  // au lieu de 4, et un QR qui ne remplissait que la moitié de son carré blanc
  // (relevé iPhone du 16 nov.). Pastille carrée = le silence du QR, rien de plus.
  // Ronde : elle circonscrit le carré des MODULES (+ 4 modules aux coins), pas
  // l'image entière, silence compris. Un PNG importé garde l'ancienne marge : on
  // ne connaît pas la sienne.
  const modsQr = modulesPourCharge(qrValue || "https://qrowg.com", "M")
  const padCercle = (q: number) => qrImg
    ? q * ((Math.SQRT2 - 1) / 2 + 0.035)
    : q * (modsQr * (Math.SQRT2 - 1)) / (2 * (modsQr + 2 * MODULES_SILENCE_QR))
  const padBadge0 = qrBadge === "aucune" ? 0 : (qrBadge === "cercle" ? padCercle(qrPx) : (qrImg ? unit * 0.028 : 0))
  const ecartBloc = layout.content === "qrbig" ? unit * (isRound ? 0.028 : 0.04) : unit * (isRound ? 0.032 : 0.045)
  const titre0 = titleSize * (layout.content === "qrbig" ? 0.72 : 1)
  const besoin = {
    marque: (isRound || layout.content === "qrbig" || !brand.trim()) ? 0 : sizeRef * 0.045 * 1.2,
    ligneTitre: shownTitle.trim() ? titre0 * 1.02 : 0,
    lignesTitre: shownTitle.trim() ? lignesDeTitre(shownTitle, titre0, Math.max(1, w - pad * 2)) : 0,
    sousTitre: subtitle.trim() ? sizeRef * 0.05 * 1.25 : 0,
    qr: qrPx + padBadge0 * 2,
    bouton: eAccent === "aucun" ? 0 : sizeRef * 0.05 * 1.2 + unit * 0.07,
    ecart: ecartBloc,
  }
  const fit = pileVerticale ? ajusterAuSupport(besoin, Math.max(1, h - pad * 2)) : { k: 1, qr: besoin.qr, masquer: [] as string[], deborde: false }
  const k = fit.k
  const rQr = besoin.qr > 0 ? fit.qr / besoin.qr : 1
  const qrPxFit = Math.max(24, qrPx * rQr)
  const padBadge = qrBadge === "cercle" ? padCercle(qrPxFit) : padBadge0 * rQr
  const gap = ecartBloc * k
  // Quand la place manque, on RETIRE le décoratif au lieu de rapetisser le QR
  // (voir ajustement.ts) : c'est ce qui rendait le curseur « Taille du QR » sans
  // effet visible — Compact, Recommandé et Maximum donnaient la même image.
  const masque = (bloc: "sousTitre" | "bouton") => (fit.masquer as string[]).includes(bloc)

  // Couleurs par élément : "" = auto (couleur du thème/accent). Le bouton peut avoir sa propre couleur.
  const titleCol = titleColor || pal.fg
  const subCol = subColor || pal.fg
  const btnBg = ctaColor || ctaBg
  const btnFg = ctaColor ? readableOn(ctaColor) : ctaFg
  const btnStroke = ctaColor || pal.trait   // #2 : encre sûre pour le bouton « trait »
  const clampTxt: React.CSSProperties = { maxWidth: "100%", overflowWrap: "anywhere" }
  // Sélection contextuelle (#12/#32) : quand `onFocus` est fourni (aperçu principal SEULEMENT), chaque objet
  // du support (titre/QR/bouton/marque) devient cliquable → ouvre son volet dédié. Vignettes/planche/éditeur libre
  // ne reçoivent pas `onFocus` → aucun impact ailleurs.
  const fcur: React.CSSProperties = onFocus ? { cursor: "pointer" } : {}
  const fcls = onFocus ? "ps-foc" : undefined
  const fclick = (panel: string) => onFocus ? (e: React.MouseEvent) => { e.stopPropagation(); onFocus(panel) } : undefined
  const kickerEl = !brand.trim() ? null : <div className={fcls} data-contenu-du-support="" onClick={fclick("texte")} style={{ fontFamily: bodyFont, fontSize: sizeRef * 0.045 * k, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: traitInk(bandColor, pal.flat, pal.fg), ...clampTxt, ...fcur }}>{brand}</div>
  const titleEl = !shownTitle.trim() ? null : <div className={fcls} data-contenu-du-support="" onClick={fclick("texte")} style={{ fontFamily: titleFont, fontSize: titleSize * k, fontWeight: effWeight as any, letterSpacing: pal.titleLs, lineHeight: 1.02, color: titleCol, ...clampTxt, ...fcur }}>{shownTitle}</div>
  const subtitleEl = subtitle.trim() && !masque("sousTitre") ? <div className={fcls} data-contenu-du-support="" onClick={fclick("texte")} style={{ fontFamily: bodyFont, fontSize: sizeRef * 0.05 * k, fontWeight: 500, lineHeight: 1.25, color: subCol, opacity: subColor ? 1 : 0.82, ...clampTxt, ...fcur }}>{subtitle}</div> : null
  // Le QR est FOURNI (code existant réencodé, ou PNG importé) — jamais recréé/redesigné ici.
  const fondDuQr = qrRendu && !qrRendu.style.transparent ? qrRendu.bg : pal.qrBg
  const qrInner = qrImg
    ? <img src={qrImg} alt="" style={{ display: "block", width: Math.round(qrPxFit), height: Math.round(qrPxFit), objectFit: "contain" }} />
    : qrStatic
    ? <FauxQR size={Math.round(qrPxFit)} fg={pal.ink} bg={pal.qrBg} />
    : <QRVector value={qrValue} size={Math.round(qrPxFit)} fg={pal.ink} bg={pal.qrBg} rendu={qrRendu ?? null} />
  const qrBadgeEl = qrBadge === "aucune"
    ? <div className={fcls} data-qr-du-support="" onClick={fclick("qr")} style={{ lineHeight: 0, ...fcur }}>{qrInner}</div>
    : <div className={fcls} data-qr-du-support="" onClick={fclick("qr")} style={{ background: fondDuQr, padding: padBadge, borderRadius: qrBadge === "cercle" ? "50%" : (eCorner === "rond" ? 16 : eCorner === "vif" ? 2 : 8), lineHeight: 0, display: "inline-block",
      // Ronde : les coins du dessin (silence, sans module) dépassaient du disque.
      ...(qrBadge === "cercle" ? { overflow: "hidden" } : null), ...fcur }}>{qrInner}</div>
  // QR libre : retiré du flux de la mise en page (rendu en absolu à qrFx/qrFy plus bas). Sinon, décalage fin X/Y.
  const qrEl = qrFree ? null : ((qrDx || qrDy) ? <div style={{ transform: `translate(${qrDx * 18}%, ${qrDy * 18}%)`, display: "inline-block" }}>{qrBadgeEl}</div> : qrBadgeEl)
  const ctaEl = (eAccent === "aucun" || masque("bouton")) ? null : (
    <div className={fcls} data-contenu-du-support="" onClick={fclick("texte")} style={{ ...fcur, fontFamily: bodyFont, fontSize: sizeRef * 0.05 * k, fontWeight: 700, padding: `${unit * 0.035 * k}px ${unit * 0.09 * k}px`, borderRadius: radiusEl, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", boxSizing: "border-box",
      ...(eAccent === "trait" ? { border: `2px solid ${btnStroke}`, color: btnStroke }
        : eAccent === "degrade" ? { background: `linear-gradient(135deg, ${shade(btnBg, 0.12)}, ${shade(btnBg, -0.28)})`, color: btnFg }
        : { background: btnBg, color: btnFg }) }}>{cta}</div>
  )

  const alignItems = eAlign === "left" ? "flex-start" : eAlign === "right" ? "flex-end" : "center"
  // Fini du fond : uni, dégradé (voile lumière→ombre) ou grain (trame de points fine). Composé sur pal.bg.
  // #4 — finis dérivés de l'encre du thème (mockup.finishLayer) : lisibles sur fond clair ET sombre.
  const bgCss = `${finishLayer(pal.fg, bgFinish)}${bgFinish === "degrade" ? gradStrong(pal.flat) : grad(pal.flat)}`
  // Photo de fond : voile de lisibilité auto (sombre si le texte est clair, clair si le texte est sombre).
  const scrim = readableOn(pal.fg) === "#0A0A0A"
    ? "linear-gradient(rgba(0,0,0,0.30), rgba(0,0,0,0.52))"
    : "linear-gradient(rgba(255,255,255,0.42), rgba(255,255,255,0.64))"
  const finalBg = bgImage ? `${scrim}, url(${bgImage}) center / cover no-repeat` : bgCss
  const base: React.CSSProperties = { width: w, height: h, boxSizing: "border-box", background: finalBg, color: pal.fg, borderRadius: isRound ? "50%" : (item.ratio >= 2 || item.ratio <= 0.5 ? 6 : 10), overflow: "hidden", position: "relative", display: "flex", padding: pad }

  // Cadre décoratif INDÉPENDANT de la mise en page (aucun / filet / double filet / coins ornés).
  const frameEl = frame === "filet"
    ? <div style={{ position: "absolute", inset: pad * 0.5, border: `1.5px solid ${pal.rule}`, borderRadius: isRound ? "50%" : 6, pointerEvents: "none" }} />
    : frame === "double"
    ? <><div style={{ position: "absolute", inset: pad * 0.42, border: `1.5px solid ${pal.rule}`, borderRadius: isRound ? "50%" : 6, pointerEvents: "none" }} /><div style={{ position: "absolute", inset: pad * 0.64, border: `1px solid ${pal.rule}`, borderRadius: isRound ? "50%" : 5, opacity: 0.6, pointerEvents: "none" }} /></>
    : frame === "coins"
    // Sur un rond, les équerres sont posées aux sommets du carré inscrit : à
    // 0,495 du centre pour un rayon de 0,5, elles frôlent le bord et se font
    // rogner — un carré dessiné sur un disque. Le filet, lui, épouse la forme.
    ? (isRound
      ? <div style={{ position: "absolute", inset: pad * 0.5, border: `1.5px solid ${pal.rule}`, borderRadius: "50%", pointerEvents: "none" }} />
      : <><Corner p={pal.rule} s={unit * 0.085} pos={{ top: cornerInset, left: cornerInset }} /><Corner p={pal.rule} s={unit * 0.085} pos={{ top: cornerInset, right: cornerInset }} r /><Corner p={pal.rule} s={unit * 0.085} pos={{ bottom: cornerInset, left: cornerInset }} b /><Corner p={pal.rule} s={unit * 0.085} pos={{ bottom: cornerInset, right: cornerInset }} b r /></>)
    : null

  let body: React.ReactNode
  if (layout.content === "band") {
    body = (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        {shownTitle.trim() && <div className={fcls} data-contenu-du-support="" onClick={fclick("texte")} style={{ background: bandColor, color: bandFg, padding: `${pad * 0.7}px ${pad}px`, fontFamily: titleFont, fontSize: titleSize * 0.86, fontWeight: effWeight as any, ...fcur }}>{shownTitle}</div>}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: unit * 0.05, padding: pad }}>{subtitleEl}{qrEl}{ctaEl}</div>
      </div>
    )
  } else if (layout.content === "qrbig") {
    // « QR géant » = layout centré sur le QR. La taille du QR reste PHYSIQUE (réglée par la taille/le curseur) :
    // pas de scale CSS ici (ça gonflait le QR au-delà de qrMm et débordait). On rapproche juste les textes.
    body = <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap, minHeight: 0, overflow: "hidden" }}>{shownTitle.trim() && <div className={fcls} data-contenu-du-support="" onClick={fclick("texte")} style={{ fontFamily: titleFont, fontSize: titleSize * 0.72 * k, fontWeight: effWeight as any, color: titleCol, textAlign: "center", ...clampTxt, ...fcur }}>{shownTitle}</div>}{subtitleEl}{qrEl}{ctaEl}</div>
  } else if (layout.content === "split") {
    body = <div style={{ flex: 1, display: "flex", alignItems: "center", gap: pad, minWidth: 0 }}><div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: unit * 0.035 }}>{kickerEl}{titleEl}{subtitleEl}{ctaEl}</div>{qrEl}</div>
  } else if (layout.content === "poster") {
    // Bloc bas (QR + bouton) : alignSelf stretch + flexWrap → si la largeur manque, le bouton passe SOUS le QR
    // (jamais coupé au bord). Filet anti-débordement complémentaire au garde-fou layoutOk (poster = A5+).
    body = <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems, justifyContent: "space-between", minWidth: 0 }}><div style={{ display: "flex", flexDirection: "column", gap: unit * 0.03, alignItems, maxWidth: "100%" }}>{kickerEl}{shownTitle.trim() && <div className={fcls} data-contenu-du-support="" onClick={fclick("texte")} style={{ fontFamily: titleFont, fontSize: titleSize * 1.5, fontWeight: effWeight as any, letterSpacing: pal.titleLs, lineHeight: 1, color: titleCol, ...clampTxt, ...fcur }}>{shownTitle}</div>}{subtitleEl}</div><div style={{ alignSelf: "stretch", display: "flex", flexWrap: "wrap", alignItems: "center", gap: pad, justifyContent: eAlign === "right" ? "flex-end" : eAlign === "left" ? "flex-start" : "center" }}>{qrEl}{ctaEl}</div></div>
  } else { // stack / center — la position du QR se règle (haut / centre / bas)
    // Sur un rond, on retire le kicker (marque) : le cercle inscrit ne tient pas kicker+titre+QR+bouton sans rogner.
    const kick = isRound ? null : kickerEl
    const stackInner = qrPos === "haut"
      ? <>{qrEl}{kick}{titleEl}{subtitleEl}{ctaEl}</>
      : qrPos === "bas"
      ? <>{kick}{titleEl}{subtitleEl}{ctaEl}{qrEl}</>
      : <>{kick}{titleEl}{subtitleEl}{qrEl}{ctaEl}</>
    body = <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems, justifyContent: "center", gap, textAlign: eAlign, minHeight: 0, overflow: "hidden" }}>{stackInner}</div>
  }

  // Placement vertical (curseur) : on décale le bloc de contenu — sauf le bandeau (absolu, plein cadre).
  const placed = layout.content === "band"
    ? body
    : <div style={{ flex: 1, display: "flex", minWidth: 0, transform: blockY ? `translateY(${blockY * 12}%)` : undefined }}>{body}</div>
  return (
    <div style={{ ...base, ...fcur }} onClick={onFocus ? (e => { e.stopPropagation(); onFocus("details") }) : undefined}>
      {/* contentFree (« Tout déplacer ») : le contenu de mise en page est masqué — tout passe par les éléments libres + QR libre. */}
      {!contentFree && placed}
      {logo === "objet" && logoUrl && <Vignette src={logoUrl} alt="" style={{ position: "absolute", top: isRound ? unit * 0.2 : pad, left: isRound ? unit * 0.2 : pad, width: unit * 0.14, height: unit * 0.14, objectFit: "contain", zIndex: 2 }} />}
      {frameEl}
      {/* décor optionnel (lié à la mise en page) */}
      {layout.deco === "frame" && <div style={{ position: "absolute", inset: pad * 0.5, border: `2px solid ${pal.rule}`, borderRadius: isRound ? "50%" : 6, pointerEvents: "none" }} />}
      {layout.deco === "footer" && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: unit * 0.04, background: pal.band }} />}
      {layout.deco === "diagonal" && <div style={{ position: "absolute", top: -h * 0.3, right: -w * 0.2, width: w * 0.9, height: h * 0.5, background: pal.band, opacity: 0.16, transform: "rotate(-24deg)", pointerEvents: "none" }} />}
      {layout.deco === "ornate" && frame !== "coins" && !isRound && <><Corner p={pal.rule} s={unit * 0.085} pos={{ top: cornerInset, left: cornerInset }} /><Corner p={pal.rule} s={unit * 0.085} pos={{ top: cornerInset, right: cornerInset }} r /><Corner p={pal.rule} s={unit * 0.085} pos={{ bottom: cornerInset, left: cornerInset }} b /><Corner p={pal.rule} s={unit * 0.085} pos={{ bottom: cornerInset, right: cornerInset }} b r /></>}
      {/* QR en position LIBRE (taille physique conservée -> reste scannable ; seule la position est libre). */}
      {qrFree && <div style={{ position: "absolute", left: `${(qrFx ?? 0.32) * 100}%`, top: `${(qrFy ?? 0.55) * 100}%`, zIndex: 3 }}>{qrBadgeEl}</div>}
      {/* Éléments libres (mode Studio libre) — posés en fraction du support, rendus statiques ici (masqués ignorés). */}
      {(freeEls ?? []).filter(el => !el.hidden).map(el => <FreeElView key={el.id} el={el} unit={unit} bodyFont={bodyFont} />)}
    </div>
  )
}
export function Corner({ p, pos, r, b, s = 14 }: { p: string; pos: React.CSSProperties; r?: boolean; b?: boolean; s?: number }) {
  const bw = `${Math.max(1.5, s * 0.16)}px solid ${p}`
  return <span style={{ position: "absolute", width: s, height: s, ...(pos), borderTop: b ? "none" : bw, borderBottom: b ? bw : "none", borderLeft: r ? "none" : bw, borderRight: r ? bw : "none", pointerEvents: "none" }} />
}
/* Planche d'impression : le support à sa taille RÉELLE (mm) rendu en haute résolution puis
   remis à l'échelle physique — consommé par window.print() -> PDF prêt imprimeur (fidèle à l'aperçu). */
export function PrintSheet(props: Omit<React.ComponentProps<typeof SupportVisual>, "w" | "h" | "physW">) {
  const { item } = props
  const { pageWmm, pageHmm } = pageDims(item)
  const { mediaWmm, mediaHmm } = mediaDims(item)
  const m = marksMargin(item)
  const long = 1600
  const bigW = item.ratio >= 1 ? long : Math.round(long * item.ratio)
  const bigH = item.shape === "round" ? bigW : Math.round(bigW / item.ratio)
  const scale = (pageWmm * 96 / 25.4) / bigW  // px haute-déf -> mm réels (1mm = 96/25.4 px CSS)
  // Traits de coupe : au trait de rogne (trim), dans la marge blanche, sans toucher le fond perdu.
  const L = CROP_LEN_MM, S = CROP_STROKE_MM
  const tlx = m + item.bleed, tty = m + item.bleed
  const trx = m + pageWmm - item.bleed, tby = m + pageHmm - item.bleed
  const marks: { left: number; top: number; width: number; height: number }[] = m === 0 ? [] : [
    { left: tlx, top: m - L, width: S, height: L }, { left: m - L, top: tty, width: L, height: S },           // haut-gauche
    { left: trx, top: m - L, width: S, height: L }, { left: mediaWmm - m, top: tty, width: L, height: S },     // haut-droite
    { left: tlx, top: mediaHmm - m, width: S, height: L }, { left: m - L, top: tby, width: L, height: S },     // bas-gauche
    { left: trx, top: mediaHmm - m, width: S, height: L }, { left: mediaWmm - m, top: tby, width: L, height: S }, // bas-droite
  ]
  return (
    <div style={{ position: "relative", width: `${mediaWmm}mm`, height: `${mediaHmm}mm`, background: "#fff", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: `${m}mm`, top: `${m}mm`, width: `${pageWmm}mm`, height: `${pageHmm}mm`, overflow: "hidden", background: props.pal.flat }}>
        <div style={{ width: bigW, height: bigH, transformOrigin: "top left", transform: `scale(${scale})` }}>
          <SupportVisual {...props} qrVector physW={pageWmm} w={bigW} h={bigH} />
        </div>
      </div>
      {marks.map((mk, i) => <div key={i} aria-hidden style={{ position: "absolute", background: "#000", left: `${mk.left}mm`, top: `${mk.top}mm`, width: `${mk.width}mm`, height: `${mk.height}mm` }} />)}
    </div>
  )
}
// Tous les réglages de design partagés (sans ce qui dépend du support/rendu).
export type DesignProps = Omit<React.ComponentProps<typeof SupportVisual>, "item" | "physW" | "w" | "h" | "qrStatic">
/* Une case de la planche multi-supports : le support à sa taille TRIM réelle (mm), haute-déf puis mis à l'échelle. */
export function GangCell({ it, wmm, design }: { it: Item; wmm: number; design: DesignProps }) {
  const long = 1100
  const bigW = it.ratio >= 1 ? long : Math.round(long * it.ratio)
  const bigH = it.shape === "round" ? bigW : Math.round(bigW / it.ratio)
  const scale = (wmm * 96 / 25.4) / bigW
  return (
    <div style={{ width: bigW, height: bigH, transformOrigin: "top left", transform: `scale(${scale})` }}>
      <SupportVisual {...design} item={it} qrVector physW={wmm} w={bigW} h={bigH} />
    </div>
  )
}
/* Planche multi-supports : une seule feuille auto-dimensionnée, supports rangés en étagères (mm réels),
   chacun avec un repère de découpe. Même mécanisme fixe que la planche simple (une page => fiable). */
export function MultiSheet({ items, design }: { items: Item[]; design: DesignProps }) {
  const GAP = 8, MARGIN = 10, MAXW = 380   // MAXW ~ largeur A3
  let x = 0, y = 0, rowH = 0, totalW = 0
  const placed: { it: Item; x: number; y: number; w: number; h: number }[] = []
  for (const it of items) {
    const w = trimWidthMm(it), h = it.hMm
    if (x > 0 && x + GAP + w > MAXW) { totalW = Math.max(totalW, x - GAP); y += rowH + GAP; x = 0; rowH = 0 }
    placed.push({ it, x, y, w, h })
    x += w + GAP; rowH = Math.max(rowH, h)
  }
  totalW = Math.max(totalW, x - GAP)
  const pageW = +(totalW + 2 * MARGIN).toFixed(1), pageH = +(y + rowH + 2 * MARGIN).toFixed(1)
  const css = cssDImpression(pageW, pageH)
  if (typeof document === "undefined") return null
  return createPortal(
    <div className="ps-print-root" aria-hidden>
      <style>{css}</style>
      <div style={{ position: "relative", width: `${pageW}mm`, height: `${pageH}mm`, background: "#fff" }}>
        {placed.map(({ it, x, y, w, h }, i) => (
          <div key={i} style={{ position: "absolute", left: `${MARGIN + x}mm`, top: `${MARGIN + y}mm`, width: `${w}mm`, height: `${h}mm`, overflow: "hidden", border: "0.2mm dashed rgba(0,0,0,0.45)", borderRadius: it.shape === "round" ? "50%" : 0 }}>
            <GangCell it={it} wmm={w} design={design} />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}
/* Rendu unifié d'un élément libre (texte / icône / forme). editable=true -> déplaçable (éditeur à plat),
   sinon statique (aperçu packshot + planche). Une seule source -> pas de dérive entre édition et rendu. */
export function FreeElView({ el, unit, bodyFont, editable, selected, onDown, onEdit }: { el: FreeEl; unit: number; bodyFont: string; editable?: boolean; selected?: boolean; onDown?: (e: React.PointerEvent, el: FreeEl) => void; onEdit?: (el: FreeEl) => void }) {
  const base: React.CSSProperties = { position: "absolute", left: `${el.x * 100}%`, top: `${el.y * 100}%`,
    ...(el.rot ? { transform: `rotate(${el.rot}deg)`, transformOrigin: "top left" } : {}), ...(el.opacity != null ? { opacity: el.opacity } : {}),
    // `touchAction: "none"` : sans lui, le premier mouvement du doigt fait défiler la
    // page et annule le glissement. Le conteneur du support le pose déjà pour toute sa
    // descendance ; on le redit ici pour que l'élément reste déplaçable au doigt même
    // s'il est un jour rendu ailleurs.
    ...(editable ? { cursor: "move", userSelect: "none", touchAction: "none", outline: selected ? `2px solid ${C.gold}` : "1px dashed rgba(255,255,255,.35)", outlineOffset: 2, zIndex: 5 } : { pointerEvents: "none", zIndex: 4 }) }
  const dp = { "data-element-libre": "", ...(editable && onDown ? { onPointerDown: (e: React.PointerEvent) => onDown(e, el), ...(onEdit ? { onDoubleClick: () => onEdit(el) } : {}) } : {}) }
  if (el.kind === "icon") {
    const Ico = ICON_LIB[el.icon || "Star"] || ICON_LIB.Star
    return <div {...dp} style={{ ...base, lineHeight: 0 }}><Ico size={Math.round(unit * el.size)} color={el.color} /></div>
  }
  if (el.kind === "shape") {
    const s = el.shape || "circle"
    const br = s === "circle" ? "50%" : s === "pill" ? "999px" : s === "rrect" ? "12%" : "0"
    return <div {...dp} style={{ ...base, width: `${el.w * 100}%`, height: `${(el.h2 ?? 0.12) * 100}%`, background: el.color, borderRadius: br }} />
  }
  return <div {...dp} style={{ ...base, width: `${el.w * 100}%`, fontSize: unit * el.size, color: el.color, textAlign: el.align, fontFamily: el.font || bodyFont, fontWeight: el.weight, lineHeight: 1.15, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{el.text}</div>
}
/* Aperçu packshot : le support posé dans sa scène (perspective + ombres + sol). */
export function Packshot(props: { item: Item; scene: ReturnType<typeof sceneLayers>; pal: ReturnType<typeof paletteFromStyle>; style: Style; layout: { content: string; deco: string | null }; size: { factor: number }; qrValue: string; qrImg: string | null; qrRendu?: RenduQr | null; qrBadge: string; qrPos: string; qrDx: number; qrDy: number; qrFree?: boolean; qrFx?: number; qrFy?: number; logo: string; logoUrl: string | null; bgFinish: string; bgImage: string | null; frame: string; accent: string; titleCase: string; titleWeight: string; titleColor: string; subColor: string; ctaColor: string; blockY: number; brand: string; subtitle: string; title: string; cta: string; eCorner: string; eAccent: string; eTypo: string; eAlign: "left" | "center" | "right"; eTitle: number; ePad: number; freeEls?: FreeEl[]; box?: number; onFocus?: (panel: string) => void }) {
  const { item, scene } = props
  const box = props.box ?? 520
  const hPx = scaleFor(item.hMm, box, SCENES[item.scene])
  const wPx = item.shape === "round" ? hPx : hPx * item.ratio
  const clampedW = Math.min(wPx, box - 40)
  const clampedH = item.shape === "round" ? clampedW : clampedW / item.ratio
  const support = (
    <SupportVisual {...props} physW={trimWidthMm(item)} w={clampedW} h={clampedH} />
  )
  // Reflet : QR STATIQUE (FauxQR décoratif) — évite un 2e moteur qr-code-styling live par aperçu.
  const supportMirror = (
    <SupportVisual {...props} qrStatic physW={trimWidthMm(item)} w={clampedW} h={clampedH} />
  )
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", maxWidth: box, margin: "0 auto", borderRadius: 20, overflow: "hidden", background: scene.background }}>
      {/* sol */}
      {scene.floorHeight > 0 && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${scene.floorHeight * 100}%`, background: scene.floor }} />}
      {scene.floorHeight > 0 && <div style={{ position: "absolute", left: 0, right: 0, bottom: `${scene.floorHeight * 100}%`, height: 1, background: scene.horizon }} />}
      {/* scène 3D */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", perspective: scene.perspective, perspectiveOrigin: scene.perspectiveOrigin }}>
        <div style={{ transform: `${scene.transform} translateY(${scene.verticalOffset * 100}%)`, transformStyle: "preserve-3d", position: "relative" }}>
          {/* ombre portée */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,1)", opacity: scene.castShadow.opacity, filter: `blur(${scene.castShadow.blur}px)`, transform: `translate(${scene.castShadow.dx}px, ${scene.castShadow.dy}px) scaleX(${scene.castShadow.scaleX})`, borderRadius: item.shape === "round" ? "50%" : 10 }} />
          {support}
          {/* reflet */}
          {scene.mirror > 0 && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, transform: "scaleY(-1)", opacity: scene.mirror, maskImage: "linear-gradient(to bottom, rgba(0,0,0,.5), transparent 60%)", WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,.5), transparent 60%)", pointerEvents: "none" }}>{supportMirror}</div>}
        </div>
      </div>
      {/* lumière + grain */}
      <div style={{ position: "absolute", inset: 0, background: scene.light, pointerEvents: "none" }} />
      {scene.grainOpacity > 0 && scene.grain !== "none" && <div style={{ position: "absolute", inset: 0, background: scene.grain, opacity: scene.grainOpacity, mixBlendMode: "overlay", pointerEvents: "none" }} />}
      {scene.streak && <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "140%", background: "linear-gradient(105deg, transparent, rgba(255,255,255,.10), transparent)", transform: "rotate(8deg)", pointerEvents: "none" }} />}
    </div>
  )
}
/* Faux QR décoratif (100 % CSS, zéro moteur) — pour les vignettes : on ne veut PAS instancier
   16 moteurs qr-code-styling sur la grille (ça faisait ramer/planter mobile). Non scannable, assumé. */
export function FauxQR({ size, fg, bg }: { size: number; fg: string; bg: string }) {
  const cell = Math.max(3, Math.round(size / 9))
  // Vrais « repères » de coin (carré plein → trou → point) pour que ça se lise comme un QR, pas un damier.
  const finder = (pos: React.CSSProperties) => (
    <span style={{ position: "absolute", width: cell * 2.6, height: cell * 2.6, background: fg, display: "flex", alignItems: "center", justifyContent: "center", ...pos }}>
      <span style={{ width: "56%", height: "56%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: "50%", height: "50%", background: fg }} />
      </span>
    </span>
  )
  return (
    <div style={{ width: size, height: size, backgroundColor: bg, position: "relative", overflow: "hidden", borderRadius: Math.max(2, size * 0.04), backgroundImage: `radial-gradient(${fg} 44%, transparent 47%)`, backgroundSize: `${cell}px ${cell}px`, backgroundPosition: `${cell / 2}px ${cell / 2}px` }}>
      {finder({ top: cell * 0.5, left: cell * 0.5 })}
      {finder({ top: cell * 0.5, right: cell * 0.5 })}
      {finder({ bottom: cell * 0.5, left: cell * 0.5 })}
    </div>
  )
}
/* QR VECTORIEL (SVG natif qr-code-styling) — utilisé sur le chemin d'impression pour un PDF prêt imprimeur. */
// Dessiné GRAND (640 px) puis réduit en CSS. qr-code-styling arrondit la taille
// d'un module au pixel INFÉRIEUR (dotsOptions.roundSize) : à 66 px pour 29
// modules, 1,8 px devenait 1 px — le code tombait à 29 px au milieu de sa
// pastille (« espacement dégueulasse », relevé iPhone du 17 nov.). À 640 px,
// l'arrondi ne coûte plus que ~3 %, et le QR est net sur un écran Retina.
export const QR_DESSIN_PX = 640
export const STYLE_NEUTRE: QRStyleConfig = {}
export function QRVector({ value, size, fg, bg, rendu = null }: { value: string; size: number; fg: string; bg: string; rendu?: RenduQr | null }) {
  const holder = useRef<HTMLDivElement>(null)
  // Avec un QR enregistré : SES couleurs, modules, yeux, logo (composé) et correction.
  const styleRendu = useStyleDeRendu(rendu?.style ?? STYLE_NEUTRE)
  const opts = rendu
    ? { fg: rendu.fg, bg: rendu.bg, ecc: rendu.ecc, style: styleRendu }
    : { fg, bg, ecc: "M" as const, style: STYLE_NEUTRE }
  const cle = JSON.stringify(opts)
  useEffect(() => {
    const qr = createQRSvg({ data: value || "https://qrowg.com", ...opts, size: Math.max(QR_DESSIN_PX, size) })
    if (holder.current) {
      holder.current.innerHTML = ""; qr.append(holder.current)
      const svg = holder.current.querySelector("svg")
      if (svg) { svg.style.width = "100%"; svg.style.height = "100%"; svg.style.display = "block" }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, size, cle])
  return <div ref={holder} style={{ width: size, height: size, lineHeight: 0 }} />
}
/* Mini-visuel pour la grille de bibliothèque : le VRAI support (mise en page + palette + QR),
   rendu grand puis mis à l'échelle et centré dans la vignette — lisible d'un coup d'œil. */
export function MiniSupport({ item, style, cadre }: { item: Item; style: Style; cadre?: { l: number; h: number } }) {
  const pal = paletteFromStyle(style)
  const layout = LAYOUT_BY_ID[resolveLayoutId(item.layout)] || LAYOUT_BY_ID.centre
  const BW = cadre?.l ?? 152, BH = cadre?.h ?? 120   // zone d'aperçu de la vignette
  const baseW = item.shape === "round" ? 220 : (item.ratio >= 1 ? 220 : Math.round(220 * item.ratio))
  const baseH = item.shape === "round" ? 220 : Math.round(baseW / item.ratio)
  const scale = Math.min((BW - 16) / baseW, (BH - 14) / baseH)
  return (
    <div style={{ width: BW, height: BH, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: baseW, height: baseH, transform: `scale(${scale})`, transformOrigin: "center", filter: "drop-shadow(0 10px 22px rgba(0,0,0,.55))" }}>
        <SupportVisual item={item} style={style} pal={pal} layout={layout} brand={BRANDNAMES[0]} subtitle="" title={MESSAGES[item.id]?.[0] || item.title} cta={item.cta} size={{ factor: 1 }} qrValue="https://qrowg.com" qrImg={null} qrBadge="carre" qrPos="centre" qrStatic physW={trimWidthMm(item)} qrDx={0} qrDy={0} logo="aucun" logoUrl={null} bgFinish="uni" bgImage={null} frame="aucun" accent="auto" titleCase="normal" titleWeight="normal" titleColor="" subColor="" ctaColor="" blockY={0} eCorner="adouci" eAccent="plein" eTypo="auto" eAlign="center" eTitle={1} ePad={1} w={baseW} h={baseH} />
      </div>
    </div>
  )
}
