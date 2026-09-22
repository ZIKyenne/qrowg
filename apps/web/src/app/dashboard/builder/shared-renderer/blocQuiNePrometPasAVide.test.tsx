// Un bloc qui ne peut rien montrer ne promet rien — garde de classe.
//
// Relevé du 22 septembre, en rendant les cent quarante-six blocs publics avec un
// contenu VIDE, et en demandant à chacun ce que le commerçant verrait :
//
//     restent visibles           7
//     disparaissent, et l'éditeur le dit      68
//     disparaissent EN SILENCE   71
//
// ── Le défaut, et il se voyait sur la page publiée ─────────────────────────
//
// Des sept qui restaient visibles, six sont des décorations — un trait, une
// marge, une bande de couleur, un retour en haut : elles n'ont rien à remplir,
// et rester visible est leur travail.
//
// Le septième était `spotify_player`, et son modèle l'écrivait : « Carte
// toujours rendue (fidèle legacy) ». Rendu à vide, il publiait, sur la page
// qu'un client atteint en scannant un QR code :
//
//     🎧  Ma musique
//         Écouter sur Spotify
//
// **et aucun bouton** — le bouton dépend du lien, et il n'y en avait pas. Le
// client tapait sur une carte qui promet et ne mène nulle part.
//
// L'éditeur, lui, dessinait le bouton ▶ Play **dans tous les cas**. Le
// commerçant voyait donc une carte complète, la publiait, et la page en montrait
// une autre. Ni l'un ni l'autre ne le lui disait.
//
// Ses propres frères — `music_links`, `presave`, `latest_release` — disparaissent
// quand ils n'ont rien à montrer. L'aligner sur eux ne lui retire rien : cela
// cesse de publier une promesse vide.
//
// ── Les onze autres, et ce qui les rendait dérivables ──────────────────────
//
// Onze blocs disparaissaient sans que l'éditeur le dise, alors que **leur modèle
// savait déjà** : il expose un `visible` que le rendu lit pour s'effacer. Le
// détecteur de l'éditeur n'avait qu'à poser la même question — c'est le geste du
// lot v154, « le détecteur appelle ce qu'il reflète, il ne le recopie plus ».
//
//     advantages  app_download  before_after  favorite_links  image  languages
//     portfolio_work  pricing  product_catalog  services_list  video_local
//
// ── Ce qui reste, compté ───────────────────────────────────────────────────
//
// Soixante blocs disparaissent encore en silence.
//
// ── Ce que le lot v167 a corrigé de cette phrase ──────────────────────────
//
// La première rédaction ajoutait : « leur rendu décide seul, sans modèle à
// interroger ». Le relevé du lot v167 l'a démentie. Sur ces soixante :
//
//     vingt-neuf ont un modèle qui décide     et leur rendu ne fait que
//                                             l'appeler — `if (!apropos(c))
//                                             return null`. Il ne dit pas
//                                             `visible` : il rend l'objet, ou
//                                             `null`. C'est la même décision.
//     trente et un décident dans le composant leur tour viendra en leur
//                                             donnant un modèle.
//
// Les vingt-neuf ont reçu leur détecteur au lot v167, et le cliquet est passé
// à trente et un. Le nombre ne peut que descendre.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "../blockEmptyState"
import { spotifyPlayerViewModel } from "./models/spotifyPlayer"

const RACINE = __dirname
const REG = fs.readFileSync(path.join(RACINE, "publicRegistry.tsx"), "utf8")

function adaptersPublics(): Record<string, [string, string]> {
  const parNom: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/const (Public\w+) = dynamic\(\(\) => import\("\.\/blocks\/([^"]+)"\)\.then\(m => m\.(\w+)\)\)/g))
    parNom[m[1]] = [m[2], m[3]]
  const out: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/^\s{2}([a-z0-9_]+): (Public\w+),/gm)) if (parNom[m[2]]) out[m[1]] = parNom[m[2]]
  return out
}

const theme = { fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const ctx = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {} }

/** Ce que la page publie pour ce bloc, avec ce contenu. `null` si rien. */
async function rendu(chemin: string, nom: string, contenu: Record<string, unknown>): Promise<string | null> {
  const mod = (await import(/* @vite-ignore */ `./blocks/${chemin}`)) as Record<string, ComponentType<never>>
  const C = mod[nom]
  if (!C) return null
  try {
    const html = renderToStaticMarkup(createElement(C as never, { content: contenu, ctx } as never))
    return html.trim() === "" ? null : html
  } catch { return null }
}

/**
 * Les six blocs qui restent visibles à vide, et pourquoi c'est juste : ils n'ont
 * rien à remplir. Rester visible EST leur travail.
 */
const DECORATIONS: Record<string, string> = {
  divider: "un trait de séparation n'a pas de contenu",
  spacer: "une marge n'a pas de contenu",
  shape_divider: "une séparation dessinée n'a pas de contenu",
  decor_line: "une ligne décorative n'a pas de contenu",
  color_band: "une bande de couleur n'a pas de contenu",
  back_to_top: "un retour en haut n'a pas de contenu",
}

describe("garde de classe : ce qui reste visible à vide n'a rien à remplir", () => {
  it("six décorations, et rien d'autre", async () => {
    const restent: string[] = []
    let vus = 0
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      vus++
      if ((await rendu(chemin, nom, {})) !== null) restent.push(type)
    }
    expect(vus, "des blocs publics rendus").toBeGreaterThan(140)
    expect(restent.sort(), "un bloc de CONTENU vide ne publie pas de coquille")
      .toEqual(Object.keys(DECORATIONS).sort())
    for (const [bloc, raison] of Object.entries(DECORATIONS))
      expect(raison.length, `${bloc} : sa raison est écrite`).toBeGreaterThan(24)
  }, 120_000)
})

describe("le bloc Spotify : une carte qui ne mène nulle part ne se publie plus", () => {
  const CHEMIN = ["spotify_player/PublicSpotifyPlayer", "PublicSpotifyPlayer"] as const

  it("sans lien, la page ne publie rien", async () => {
    expect(await rendu(...CHEMIN, {}), "rien à vide").toBeNull()
    expect(await rendu(...CHEMIN, { title: "Ma playlist du samedi" }),
      "un titre seul ne fait pas un lien — et c'est le lien qui est le bloc").toBeNull()
  })

  it("avec un lien, la carte est là, entière, et le bouton avec", async () => {
    const html = await rendu(...CHEMIN, { title: "Mon album", url: "https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3" })
    expect(html, "la carte est publiée").not.toBeNull()
    expect(html, "son titre").toContain("Mon album")
    expect(html, "et le bouton, cette fois, existe").toContain("Play")
  })

  it("l'éditeur ne dessine plus un bouton que la page n'aura pas", () => {
    // C'était le cœur du défaut : l'éditeur montrait ▶ Play dans tous les cas.
    const src = fs.readFileSync(path.join(RACINE, "blocks", "spotify_player", "EditorSpotifyPlayer.tsx"), "utf8")
    expect(src, "l'éditeur lit la visibilité du modèle").toContain("const { visible, title }")
    expect(src, "et montre l'état vide du produit").toContain("BlockEmptyState")
    expect(src, "…avec la phrase du produit").toContain("HIDDEN_WHEN_EMPTY_NOTE")
    // Le bouton reste dans la branche « rempli », il n'a pas disparu.
    expect(src, "le bouton existe toujours quand il y a un lien").toContain("▶ Play")
  })

  it("le modèle porte la décision, une seule fois", () => {
    expect(spotifyPlayerViewModel({}).visible, "à vide").toBe(false)
    expect(spotifyPlayerViewModel({ title: "x" }).visible, "un titre seul").toBe(false)
    expect(spotifyPlayerViewModel({ url: "https://open.spotify.com/track/1" }).visible, "avec lien").toBe(true)
    // …et le détecteur de l'éditeur l'appelle, il ne le recopie pas (lot v154).
    const src = fs.readFileSync(path.join(RACINE, "..", "blockEmptyState.ts"), "utf8")
    // Ancré sur l'appel, pas sur l'alignement de la table : c'est l'intention.
    expect(src).toMatch(/spotify_player:\s+c => spotifyPlayerViewModel\(c\)\.visible,/)
  })
})

describe("exécuté : le détecteur dit la vérité du rendu", () => {
  it("pour chaque bloc qui a un détecteur, l'éditeur et la page s'accordent", async () => {
    const desaccords: string[] = []
    let vus = 0
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      if (!(EMPTY_STATE_BLOCK_TYPES as readonly string[]).includes(type)) continue
      vus++
      const publieRien = (await rendu(chemin, nom, {})) === null
      const detecteurDitVide = !hasPublishableContent(type, {})
      if (publieRien !== detecteurDitVide)
        desaccords.push(`${type} : la page publie ${publieRien ? "rien" : "quelque chose"}, le détecteur dit ${detecteurDitVide ? "vide" : "plein"}`)
    }
    expect(vus, "des blocs à détecteur").toBeGreaterThan(75)
    expect(desaccords, "le détecteur est le miroir EXACT du filtre public").toEqual([])
  }, 120_000)

  it("les douze posés à ce lot disparaissent ET le disent", () => {
    for (const t of ["advantages", "app_download", "before_after", "favorite_links", "image",
                     "languages", "portfolio_work", "pricing", "product_catalog",
                     "services_list", "spotify_player", "video_local"]) {
      expect(EMPTY_STATE_BLOCK_TYPES, `${t} a un détecteur`).toContain(t)
      expect(hasPublishableContent(t, {}), `${t} à vide`).toBe(false)
    }
  })

  it("le détecteur sait dire oui — sinon il ne dirait jamais non", () => {
    // Sans ceci, un détecteur qui répond toujours « vide » passerait pour juste.
    // Les clés sont celles que les modèles lisent vraiment — je les ai d'abord
    // inventées, et le test a échoué en accusant le produit à tort.
    expect(hasPublishableContent("pricing", { title1: "Formule simple", price1: "19 €" })).toBe(true)
    expect(hasPublishableContent("languages", { lang_1_name: "Français" })).toBe(true)
    expect(hasPublishableContent("image", { src: "https://x.supabase.co/a.png" })).toBe(true)
    expect(hasPublishableContent("spotify_player", { url: "https://open.spotify.com/track/1" })).toBe(true)
    expect(hasPublishableContent("advantages", { adv1: "Livraison offerte" })).toBe(true)
  })
})

describe("le cliquet : ceux qui disparaissent encore en silence", () => {
  it("leur nombre ne peut que descendre", async () => {
    const muets: string[] = []
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      if ((EMPTY_STATE_BLOCK_TYPES as readonly string[]).includes(type)) continue
      if (type in DECORATIONS) continue
      if ((await rendu(chemin, nom, {})) === null) muets.push(type)
    }
    // 71 au relevé, 60 après les douze du lot v166, 31 depuis que les
    // vingt-neuf du lot v167 parlent. Ces trente et un-là décident VRAIMENT
    // dans leur composant : écrire leur détecteur à la main serait recopier
    // leur condition — la dérive que les lots v151 à v154 ont défaite. Leur
    // tour viendra en leur donnant un modèle, pas un détecteur.
    expect(muets.length, `muets : ${muets.slice(0, 8).join(", ")}…`).toBeLessThanOrEqual(31)
    expect(muets.length, "il en reste — sinon ce cliquet n'aurait plus de sens").toBeGreaterThan(0)
  }, 120_000)
})
