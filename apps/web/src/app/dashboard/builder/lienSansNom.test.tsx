import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { RenduLegacy } from "../../[slug]/renduLegacy"
import { BLOCK_DEFS } from "./blockDefs"
import { SHARED_RENDERER_BLOCKS } from "./shared-renderer/architecture"

// ═══════════════════════════════════════════════════════════════════════════════
// UN LIEN QUE RIEN N'ANNONCE.
//
// Le 4 septembre, une session a donné un texte aux IMAGES de la page publiée.
// Elle s'est arrêtée là. Les LIENS, eux, sont restés muets là où ils n'ont qu'une
// icône : un lecteur d'écran annonce « lien », et c'est tout. Le visiteur aveugle
// entend trois fois « lien » sur une galerie TikTok, et ne sait pas non plus
// lequel des deux boutons ronds d'une fiche appelle et lequel écrit.
//
// Le pire venait de la migration elle-même. `team` et `multi_contact` — deux des
// blocs les plus posés — avaient les bons intitulés en legacy, sur le <a> :
//
//     <a href="tel:…" aria-label="Appeler Camille">📞</a>
//
// La vue partagée les a déplacés d'un cran, sur le <span> intérieur :
//
//     <SmartCta label={<span aria-label="Appeler Camille">📞</span>} />
//
// `aria-label` sur un <span> sans rôle n'est lu par AUCUN lecteur d'écran. Les
// intitulés étaient donc écrits, testés, présents dans le HTML — et inertes.
// Quatorze liens par page d'équipe.
//
// La règle tenue ici : tout lien publié a un nom — son texte, l'alternative de
// son image, ou un aria-label posé SUR LE LIEN.
// ═══════════════════════════════════════════════════════════════════════════════

const theme: any = {
  bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F",
  text: "#F5F0E8", muted: "#A8A190", fontDisplay: "Fraunces, serif", fontBody: "DM Sans, sans-serif",
}
const pctx: any = { theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} }

// Le registre public passe par `next/dynamic`, qui ne rend rien hors navigateur :
// on charge les vues partagées directement, sinon 146 blocs sur 178 passeraient
// pour « sans lien » sans avoir été regardés.
const MODULES = import.meta.glob("./shared-renderer/blocks/*/{index,Public*}.tsx", { eager: true }) as Record<string, any>
const VUES: Record<string, any> = (() => {
  const out: Record<string, any> = {}
  for (const [chemin, mod] of Object.entries(MODULES)) {
    const type = chemin.split("/")[3]
    const vue = Object.entries(mod as Record<string, any>).find(([n, v]) => typeof v === "function" && /^Public/.test(n))?.[1]
    if (vue) out[type] = vue
  }
  return out
})()

/** Un bloc rempli comme le ferait un commerçant : tout est saisi, rien ne manque. */
export function contenuRempli(type: string): Record<string, any> {
  const def = BLOCK_DEFS[type] as any
  const c: Record<string, any> = { ...(def?.defaultContent ?? {}) }
  for (const f of (def?.fields ?? []) as any[]) {
    const k = f?.key
    if (!k) continue
    if (/(^|_)(url|link|href)$/.test(k)) c[k] = "https://exemple.fr/x"
    else if (/(^|_)(src|embed_url)$/.test(k)) c[k] = "https://exemple.fr/media.mp4"
    else if (/image|img|cover|logo|photo|avatar/.test(k)) c[k] = "https://exemple.fr/i.jpg"
    else if (/phone|tel/.test(k)) c[k] = "0612345678"
    else if (/email/.test(k)) c[k] = "camille@exemple.fr"
    else if (f.type === "select") c[k] = (f.options ?? ["yes"])[0]
    else if (c[k] === undefined) c[k] = /price|amount|montant/.test(k) ? "12 €" : "Texte " + k
  }
  return c
}

function publie(type: string, content: Record<string, any>): string {
  try {
    if (SHARED_RENDERER_BLOCKS.has(type)) {
      const Vue = VUES[type]
      if (!Vue) return ""
      return renderToStaticMarkup(<Vue content={content} ctx={pctx} />)
    }
    return renderToStaticMarkup(
      <RenduLegacy block={{ id: "b1", type, content, position: 0 } as any} theme={theme} pageId="p1" ownerEmail="a@b.co" totalViews={0} />,
    )
  } catch { return "" }
}

// Emoji, flèches, puces : ce qu'un lecteur d'écran n'annonce pas, ou annonce mal.
const DECOR = /[\s  -㌀\uD83C-􏰀-\uDFFF←-⇿☀-➿️‍]/g

/** Les liens du HTML dont rien ne dit où ils mènent. */
export function liensSansNom(html: string): string[] {
  const out: string[] = []
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const [, attrs, dedans] = m
    // 1) un nom posé SUR LE LIEN
    if (/aria-label="[^"]+"/.test(attrs) || /\btitle="[^"]+"/.test(attrs)) continue
    // 2) du texte lisible dedans
    const texte = dedans.replace(/<[^>]*>/g, "").replace(/&[a-z#0-9]+;/gi, "").replace(DECOR, "").trim()
    if (texte) continue
    // 3) l'alternative d'une image qu'il contient
    if ([...dedans.matchAll(/\balt="([^"]*)"/g)].some(a => a[1].trim())) continue
    out.push((attrs.match(/href="([^"]*)"/)?.[1] ?? "(sans adresse)").slice(0, 40))
  }
  return out
}

describe("tout lien publie dit ou il mene", () => {
  it("le detecteur reconnait les trois façons de nommer un lien", () => {
    expect(liensSansNom('<a href="/x">Voir la carte</a>')).toEqual([])
    expect(liensSansNom('<a href="/x" aria-label="Appeler Camille">📞</a>')).toEqual([])
    expect(liensSansNom('<a href="/x"><img src="i.jpg" alt="Notre terrasse"/></a>')).toEqual([])
    // …et les cas muets, y compris l'aria-label posé un cran trop bas.
    expect(liensSansNom('<a href="/x">📞</a>')).toEqual(["/x"])
    expect(liensSansNom('<a href="/x"><span aria-label="Appeler">📞</span></a>')).toEqual(["/x"])
    expect(liensSansNom('<a href="/x"><img src="i.jpg" alt=""/></a>')).toEqual(["/x"])
  })

  it("aucun bloc ne publie de lien muet", () => {
    const muets: Record<string, string[]> = {}
    for (const type of Object.keys(BLOCK_DEFS)) {
      const html = publie(type, contenuRempli(type))
      if (!html) continue
      const sans = liensSansNom(html)
      if (sans.length) muets[type] = sans
    }
    expect(muets).toEqual({})
  })

  it("le balayage voit bien des liens : sinon il ne prouve rien", () => {
    let liens = 0, blocs = 0
    for (const type of Object.keys(BLOCK_DEFS)) {
      const n = (publie(type, contenuRempli(type)).match(/<a\b/g) ?? []).length
      liens += n
      if (n) blocs++
    }
    expect(liens, "trop peu de liens rendus").toBeGreaterThan(150)
    expect(blocs, "trop peu de blocs à lien").toBeGreaterThan(50)
  })

  it("les intitules de team et multi_contact sont sur le LIEN, pas sur un span", () => {
    for (const type of ["team", "multi_contact"]) {
      const html = publie(type, contenuRempli(type))
      expect(html, `${type} : « Appeler … » doit être sur le <a>`).toMatch(/<a\b[^>]*aria-label="Appeler [^"]+"/)
      expect(html, `${type} : et « Écrire à … » aussi`).toMatch(/<a\b[^>]*aria-label="Écrire à [^"]+"/)
      expect(html, `${type} : plus d'aria-label sur un span, il n'y est pas lu`).not.toMatch(/<span[^>]*aria-label=/)
    }
  })

  it("une image cliquable et muette annonce au moins ce qu'elle fait", () => {
    const lie = publie("image", { src: "https://exemple.fr/i.jpg", link: "https://exemple.fr" })
    expect(liensSansNom(lie)).toEqual([])
    // Mais une image seulement décorative reste muette : l'annoncer deux fois
    // est pire que se taire (doctrine du 4 septembre, WCAG H67).
    expect(publie("image", { src: "https://exemple.fr/i.jpg" })).toContain('alt=""')
    // Et la légende de l'auteur passe avant tout.
    expect(publie("image", { src: "https://exemple.fr/i.jpg", link: "https://exemple.fr", alt: "Notre vitrine" })).toContain('alt="Notre vitrine"')
  })

  it("les trois vignettes TikTok se distinguent l'une de l'autre", () => {
    const html = publie("tiktok_gallery", { username: "@atelier", video1_url: "https://tiktok.com/1", video2_url: "https://tiktok.com/2", video3_url: "https://tiktok.com/3" })
    expect(html).toContain('aria-label="@atelier — TikTok 1 sur 3"')
    expect(html).toContain('aria-label="@atelier — TikTok 3 sur 3"')
  })
})
