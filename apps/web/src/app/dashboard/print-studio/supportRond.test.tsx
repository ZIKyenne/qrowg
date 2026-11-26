// @vitest-environment jsdom
//
// Le support rond est traité comme un rond — RENDU, plus cité (v394). On monte
// le vrai composant du support (le même qui part à l'imprimeur) sur un sticker
// rond et sur un carré, et on compte ce qui est dessiné : équerres de coin,
// filets circulaires. Chaque attente sur le rond a son témoin sur le carré :
// le détecteur qui ne voit pas d'équerre sur le rond EN voit quatre sur le carré.

import { describe, it, expect, afterEach } from "vitest"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { SupportVisual } from "./renduDuSupport"
import { TemplateThumb } from "./bibliothequesDuStudio"
import { ITEMS, STYLE_BY_ID, type Item } from "./catalog"
import { paletteFromStyle } from "./mockup"
import { TEMPLATES } from "./templates"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const ROND = ITEMS.find(i => i.shape === "round")!
const CARRE = ITEMS.find(i => i.shape !== "round" && i.ratio === 1)!
const RECTANGLE = ITEMS.find(i => i.shape !== "round" && i.ratio < 0.8)!

let hote: HTMLDivElement | null = null
let racine: Root | null = null
afterEach(() => { if (racine) act(() => racine!.unmount()); hote?.remove(); hote = null; racine = null })
function monter(el: React.ReactElement): HTMLElement {
  hote = document.createElement("div"); document.body.appendChild(hote); racine = createRoot(hote)
  act(() => racine!.render(el))
  return hote
}

function support(item: Item, frame: string, deco: string | null = null) {
  const style = STYLE_BY_ID[item.pal]
  return monter(<SupportVisual item={item} style={style} pal={paletteFromStyle(style)} layout={{ content: "center", deco }}
    brand="Café Lune" subtitle="" title="Menu du jour" cta="Voir le menu" size={{ factor: 1 }} qrValue="https://qrowg.com/r/abc123" qrImg={null}
    qrBadge="carre" qrPos="centre" qrStatic physW={item.hMm} qrDx={0} qrDy={0} logo="aucun" logoUrl={null} bgFinish="uni" bgImage={null}
    frame={frame} accent="auto" titleCase="normal" titleWeight="normal" titleColor="" subColor="" ctaColor="" blockY={0}
    eCorner="adouci" eAccent="plein" eTypo="auto" eAlign="center" eTitle={1} ePad={1} w={300} h={300} />)
}

/** Une équerre : un trait sur deux côtés adjacents, rien sur les deux autres. */
const equerres = (racine: HTMLElement) => [...racine.querySelectorAll<HTMLElement>("span")].filter(s => {
  const st = s.style
  if (st.position !== "absolute") return false
  const traits = [st.borderTopStyle, st.borderBottomStyle, st.borderLeftStyle, st.borderRightStyle].map(v => v === "solid")
  return traits.filter(Boolean).length === 2 && traits[0] !== traits[1] && traits[2] !== traits[3]
}).length
/** Les filets de cadre : traits absolus non cliquables, et leur forme. */
const filets = (racine: HTMLElement) => [...racine.querySelectorAll<HTMLElement>("div")]
  .filter(d => d.style.position === "absolute" && d.style.pointerEvents === "none" && d.style.borderTopStyle === "solid")
  .map(d => d.style.borderRadius)

describe("le support rond est traité comme un rond", () => {
  it("le cadre « Coins » : un filet qui épouse le cercle, pas quatre équerres rognées", () => {
    const rond = support(ROND, "coins")
    expect(equerres(rond), "aucune équerre sur le rond").toBe(0)
    expect(filets(rond)).toEqual(["50%"])
    // Témoin : sur un carré, ce sont bien des équerres.
    const carre = support(CARRE, "coins")
    expect(equerres(carre)).toBe(4)
    expect(filets(carre)).toEqual([])
  })

  it("le décor orné ne pose pas d'équerres sur un rond, ni par-dessus le cadre « Coins »", () => {
    expect(equerres(support(ROND, "aucun", "ornate")), "orné sur un rond").toBe(0)
    expect(equerres(support(CARRE, "aucun", "ornate")), "témoin : orné sur un carré").toBe(4)
    expect(equerres(support(CARRE, "coins", "ornate")), "orné + coins : une seule série d'équerres").toBe(4)
  })

  it("les filets simples et doubles prennent la forme du support", () => {
    expect(filets(support(ROND, "filet"))).toEqual(["50%"])
    expect(filets(support(ROND, "double"))).toEqual(["50%", "50%"])
    for (const r of filets(support(CARRE, "double"))) expect(r).not.toBe("50%")
  })

  it("le support lui-même est un disque", () => {
    const fond = support(ROND, "aucun").firstElementChild as HTMLElement
    expect(fond.style.borderRadius).toBe("50%")
    expect((support(CARRE, "aucun").firstElementChild as HTMLElement).style.borderRadius).not.toBe("50%")
  })
})

describe("la vignette d'un modèle prend la forme du support choisi", () => {
  const forme = (item?: Item) => {
    const r = monter(<TemplateThumb t={TEMPLATES[0]} item={item} onClick={() => {}} />)
    const cadre = [...r.querySelectorAll<HTMLElement>("button > div > div")][0]
    return { rayon: cadre.style.borderRadius, largeur: parseFloat(cadre.style.width), hauteur: parseFloat(cadre.style.height) }
  }
  it("ronde et aussi large que haute pour un sticker rond", () => {
    const v = forme(ROND)
    expect(v.rayon).toBe("50%")
    expect(v.largeur).toBe(v.hauteur)
  })
  it("rectangulaire, au ratio du support, pour un support étroit", () => {
    const v = forme(RECTANGLE)
    expect(v.rayon).not.toBe("50%")
    expect(v.largeur).toBeLessThan(v.hauteur)
  })
})
