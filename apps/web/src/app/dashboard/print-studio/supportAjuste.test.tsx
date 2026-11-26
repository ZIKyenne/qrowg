// @vitest-environment jsdom
//
// Le contenu ne déborde plus du support — RENDU, plus cité (v395). Avant,
// atelier.test.ts vérifiait que le texte `fontSize: titleSize * k` figurait dans
// le fichier. Ici, on monte le vrai composant du support à hauteur confortable,
// puis de plus en plus serrée, et on compare ce qui est rendu. Le calcul
// lui-même (ajusterAuSupport) a ses tests purs dans ajustement.test.ts ; ici,
// on vérifie que le RENDU s'en sert, dans l'ordre promis :
//   1. les textes rétrécissent, le QR garde sa taille ;
//   2. puis le sous-titre et le bouton s'effacent, plutôt que de rapetisser le QR ;
//   3. en dernier, le QR cède — jamais sous 24 px.

import { describe, it, expect, afterEach } from "vitest"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { SupportVisual } from "./renduDuSupport"
import { ITEMS, STYLE_BY_ID } from "./catalog"
import { paletteFromStyle } from "./mockup"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const CARRE = ITEMS.find(i => i.shape !== "round" && i.ratio === 1)!
const TITRE = "Menu du jour", SOUS_TITRE = "Produits frais, cuisine maison", BOUTON = "Voir le menu"

const racines: { hote: HTMLDivElement; racine: Root }[] = []
afterEach(() => { for (const { hote, racine } of racines.splice(0)) { act(() => racine.unmount()); hote.remove() } })

/** Le support rendu à `h` px de haut (300 de large), et ce qu'on en mesure. */
function rendu(h: number, titre = TITRE) {
  const hote = document.createElement("div"); document.body.appendChild(hote)
  const racine = createRoot(hote); racines.push({ hote, racine })
  const style = STYLE_BY_ID[CARRE.pal]
  act(() => racine.render(<SupportVisual item={CARRE} style={style} pal={paletteFromStyle(style)} layout={{ content: "center", deco: null }}
    brand="" subtitle={SOUS_TITRE} title={titre} cta={BOUTON} size={{ factor: 1 }} qrValue="https://qrowg.com/r/abc123" qrImg={null}
    qrBadge="carre" qrPos="centre" qrStatic physW={CARRE.hMm} qrDx={0} qrDy={0} logo="aucun" logoUrl={null} bgFinish="uni" bgImage={null}
    frame="aucun" accent="auto" titleCase="normal" titleWeight="normal" titleColor="" subColor="" ctaColor="" blockY={0}
    eCorner="adouci" eAccent="plein" eTypo="auto" eAlign="center" eTitle={1} ePad={1} w={300} h={h} />))
  const texte = (t: string) => [...hote.querySelectorAll<HTMLElement>("[data-contenu-du-support]")].find(el => el.textContent === t)
  const taille = (t: string) => { const el = texte(t); return el ? parseFloat(el.style.fontSize) : null }
  // Le QR lui-même (premier enfant), pas sa pastille : elle rétrécit de son côté,
  // et la mesurer laissait passer un QR jamais ajusté (vu en v395, par mutation).
  const qr = hote.querySelector<HTMLElement>("[data-qr-du-support]")!.firstElementChild as HTMLElement
  return { titre: taille(titre)!, sousTitre: taille(SOUS_TITRE), bouton: taille(BOUTON), qr: parseFloat(qr.style.width) }
}

describe("le contenu s'ajuste au support au lieu de déborder", () => {
  const large = rendu(600)

  it("de la place : tout est à sa taille, rien n'est retiré", () => {
    expect(large.sousTitre).not.toBeNull()
    expect(large.bouton).not.toBeNull()
    expect(large.qr).toBeGreaterThan(24)
  })

  it("1. un peu serré : les textes rétrécissent ensemble, le QR garde sa taille", () => {
    // Hauteur cherchée : la plus grande où le titre rétrécit déjà, contenu complet.
    let h = 600, r = rendu(h)
    while (r.titre >= large.titre && h > 60) { h -= 10; r = rendu(h) }
    expect(r.titre, "le titre a rétréci").toBeLessThan(large.titre)
    expect(r.sousTitre, "le sous-titre est encore là").not.toBeNull()
    const k = r.titre / large.titre
    expect(r.sousTitre! / large.sousTitre!, "le sous-titre suit le même facteur").toBeCloseTo(k, 5)
    expect(r.bouton! / large.bouton!, "le bouton aussi").toBeCloseTo(k, 5)
    expect(r.qr, "le QR, lui, ne bouge pas").toBe(large.qr)
  })

  it("2. trop serré : le sous-titre s'efface avant que le QR ne rapetisse", () => {
    let h = 600, r = rendu(h)
    while (r.sousTitre !== null && h > 40) { h -= 5; r = rendu(h) }
    expect(r.sousTitre, "le sous-titre a cédé sa place").toBeNull()
    expect(r.qr, "le QR a gardé la sienne").toBe(large.qr)
  })

  it("3. quand le titre seul ne tient plus : le QR cède en dernier, à support identique", () => {
    // Même support (300 × 300), seul le titre change : un QR plus petit ne peut
    // venir QUE de l'ajustement. (Comparer deux hauteurs ne prouvait rien : la
    // taille maximale du QR suit déjà le plus petit côté du support.)
    const court = rendu(300)
    const long = rendu(300, "Notre carte du jour change chaque matin selon le marché ".repeat(4).trim())
    expect(long.sousTitre, "le sous-titre a cédé d'abord").toBeNull()
    expect(long.bouton, "le bouton aussi").toBeNull()
    expect(long.qr, "puis le QR").toBeLessThan(court.qr)
  })

  it("…et jamais sous 24 px, même à l'extrême", () => {
    expect(rendu(40, "Notre carte du jour change chaque matin selon le marché ".repeat(6).trim()).qr).toBeGreaterThanOrEqual(24)
  })
})
