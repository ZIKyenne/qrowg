import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { derniereSortie, playlist, presave, liensMusique } from "./models/musique"
import { EditorLatestRelease, PublicLatestRelease } from "./blocks/latest_release"
import { EditorPlaylistBlock, PublicPlaylistBlock } from "./blocks/playlist_block"
import { EditorPresave, PublicPresave } from "./blocks/presave"
import { EditorMusicLinks, PublicMusicLinks } from "./blocks/music_links"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Vague 22 — la famille musique.
//
//   · music_links publiait jusqu'à CINQ liens et n'en traçait AUCUN. Tous les
//     autres blocs à lien remontent le clic ; celui-ci n'avait simplement pas
//     de `onClick`. L'artiste voyait donc zéro statistique sur le bloc dont
//     c'est tout l'objet, et pouvait en conclure que personne ne cliquait ;
//   · presave dessinait un bouton vert « Pré-sauvegarder sur Spotify » sans
//     aucune adresse de plateforme. La page n'en publie aucun ;
//   · latest_release et playlist_block peignaient le bouton Spotify en vert
//     plein dans l'aperçu et translucide en ligne — et seulement Spotify.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const eCtx = (): EditorRenderCtx =>
  ({ theme: sombre, primary: sombre.primary, text: sombre.text, muted: sombre.muted, accent: sombre.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const traces: string[] = []
const pCtx = (): PublicRenderCtx =>
  ({ theme: sombre, G: sombre.primary, TEXT: sombre.text, MUTED: sombre.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: (t: string) => { traces.push(t) } })
const H = (el: any) => renderToStaticMarkup(el)

/** Les <a> d'un arbre React, gestionnaires compris — ce que le HTML statique ne
 *  montre pas. Les composants intermédiaires sont exécutés au passage : ces
 *  vues n'ont pas d'état, donc les appeler suffit à obtenir leur sortie. */
function ancres(noeud: any, out: any[] = []): any[] {
  if (!noeud || typeof noeud !== "object") return out
  if (Array.isArray(noeud)) { for (const n of noeud) ancres(n, out); return out }
  if (noeud.type === "a") { out.push(noeud); return ancres(noeud.props?.children, out) }
  if (typeof noeud.type === "function") {
    try { return ancres(noeud.type(noeud.props), out) } catch { return out }
  }
  return ancres(noeud.props?.children, out)
}

const SORTIE = { badge: "🔥 Nouveau single", title: "Nuit blanche", artist: "Atelier Nord", release_date: "15 août", spotify_url: "https://open.spotify.com/track/x", apple_url: "https://music.apple.com/x" }
const PLAYLIST = { title: "Ma playlist", description: "Pour travailler", tracks_count: "42 titres", spotify_url: "https://open.spotify.com/playlist/x", deezer_url: "https://deezer.com/x" }
const PRESAVE = { title: "Bientôt disponible", release_name: "Nuit blanche", release_date: "15 août", spotify_url: "https://open.spotify.com/x" }
const LIENS = { artist_name: "Atelier Nord", spotify: "https://open.spotify.com/artist/x", deezer: "deezer.com/artist/x", soundcloud: "https://soundcloud.com/x" }

describe("vague 22 - music_links : les clics sont enfin comptes", () => {
  it("chaque lien remonte le clic sur la page publiee", () => {
    // Le bloc publiait cinq liens et n'en tracait aucun. Le HTML statique ne
    // montre pas les gestionnaires : on parcourt l'arbre React et on DECLENCHE
    // chaque clic. Un test qui lirait le HTML ne prouverait rien ici.
    traces.length = 0
    const el = PublicMusicLinks({ content: LIENS, ctx: pCtx() } as any)
    const liens = ancres(el)
    expect(liens.map(a => a.props.href)).toEqual([
      "https://open.spotify.com/artist/x", "https://deezer.com/artist/x", "https://soundcloud.com/x",
    ])
    for (const a of liens) a.props.onClick?.()
    expect(traces).toEqual(liens.map(a => a.props.href))
  })

  it("le canvas, lui, ne trace rien : il n'y a rien a cliquer", () => {
    traces.length = 0
    const el = EditorMusicLinks({ content: LIENS, ctx: eCtx() } as any)
    expect(ancres(el)).toEqual([])
    expect(traces).toEqual([])
  })
  it("le modele ne garde que les plateformes reellement renseignees", () => {
    expect(liensMusique({})).toBeNull()
    expect(liensMusique({ artist_name: "Atelier Nord" }), "un nom seul ne suffit pas").toBeNull()
    expect(liensMusique(LIENS)!.plateformes.map(p => p.cle)).toEqual(["spotify", "deezer", "soundcloud"])
  })
  it("un pseudo-lien inutilisable ne cree pas d'entree", () => {
    expect(liensMusique({ spotify: "#" })).toBeNull()
    expect(liensMusique({ spotify: "javascript:alert(1)" })).toBeNull()
  })
  it("un domaine nu devient une vraie adresse", () => {
    expect(liensMusique({ deezer: "deezer.com/artist/x" })!.plateformes[0].href).toBe("https://deezer.com/artist/x")
  })
  it("le tracking est bien branche dans le bloc", async () => {
    const { readFileSync } = await import("node:fs")
    const { fileURLToPath } = await import("node:url")
    const src = readFileSync(fileURLToPath(new URL("./blocks/music_links/index.tsx", import.meta.url)), "utf8")
    expect(src, "chaque lien doit remonter le clic").toMatch(/onClick=\{\(\) => u\.trackClick\(p\.href\)\}/)
  })
})

describe("vague 22 - presave : plus de bouton sans destination", () => {
  it("sans adresse, aucun bouton de pre-save", () => {
    // L'apercu en dessinait un, vert, avec « Pre-sauvegarder sur Spotify ».
    const c = { release_name: "Nuit blanche" }
    expect(presave(c)!.plateformes).toEqual([])
    for (const h of [H(<EditorPresave content={c} ctx={eCtx()} />), H(<PublicPresave content={c} ctx={pCtx()} />)]) {
      expect(h).not.toContain("Pré-sauvegarder")
      expect(h).toContain("Nuit blanche")
    }
  })
  it("un bloc entierement vide ne publie rien", () => {
    expect(presave({})).toBeNull()
    expect(presave({ title: "Bientôt disponible" }), "le titre de section seul ne suffit pas").toBeNull()
    expect(H(<EditorPresave content={{}} ctx={eCtx()} />)).toContain("Invisible en ligne")
  })
})

describe("vague 22 - le bouton Spotify a le meme dessin des deux cotes", () => {
  it("latest_release : translucide, comme en ligne", () => {
    // L'apercu le peignait en vert plein, la page en translucide.
    for (const h of [H(<EditorLatestRelease content={SORTIE} ctx={eCtx()} />), H(<PublicLatestRelease content={SORTIE} ctx={pCtx()} />)]) {
      expect(h).toContain("#1DB95422")
      expect(h, "le vert plein etait le dessin de l'apercu seul").not.toContain("background:#1DB954;")
    }
  })
  it("playlist_block : idem", () => {
    for (const h of [H(<EditorPlaylistBlock content={PLAYLIST} ctx={eCtx()} />), H(<PublicPlaylistBlock content={PLAYLIST} ctx={pCtx()} />)]) {
      expect(h).toContain("#1DB95422")
    }
  })
  it("presave garde ses boutons pleins : c'est son dessin d'origine", () => {
    expect(H(<PublicPresave content={PRESAVE} ctx={pCtx()} />)).toContain("background:#1DB954;")
  })
})

describe("vague 22 - regles de publication", () => {
  it("derniere sortie : un titre, une pochette OU un lien suffit", () => {
    expect(derniereSortie({})).toBeNull()
    expect(derniereSortie({ artist: "Atelier Nord" }), "un artiste seul ne suffit pas").toBeNull()
    expect(derniereSortie({ title: "Nuit blanche" })).not.toBeNull()
    expect(derniereSortie({ spotify_url: "https://open.spotify.com/x" })).not.toBeNull()
  })
  it("playlist : un titre ou un lien", () => {
    expect(playlist({})).toBeNull()
    expect(playlist({ description: "Pour travailler" })).toBeNull()
    expect(playlist({ title: "Ma playlist" })).not.toBeNull()
  })
})

describe("vague 22 - l'apercu montre ce qui sera publie", () => {
  const textes = (h: string) => h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
  for (const [type, Ed, Pub, contenu] of [
    ["latest_release", EditorLatestRelease, PublicLatestRelease, SORTIE],
    ["playlist_block", EditorPlaylistBlock, PublicPlaylistBlock, PLAYLIST],
    ["presave", EditorPresave, PublicPresave, PRESAVE],
    ["music_links", EditorMusicLinks, PublicMusicLinks, LIENS],
  ] as const) {
    it(type + " : memes textes des deux cotes", () => {
      expect(textes(H(<Ed content={contenu} ctx={eCtx()} />))).toEqual(textes(H(<Pub content={contenu} ctx={pCtx()} /> as any)))
    })
    it(type + " : vrai lien public, rien de navigable dans le canvas", () => {
      expect(H(<Pub content={contenu} ctx={pCtx()} /> as any)).toContain("href=")
      expect(H(<Ed content={contenu} ctx={eCtx()} />)).not.toContain("href=")
    })
  }

  it("la pochette passe par le meme chemin dimensionne des deux cotes", () => {
    const c = { ...SORTIE, cover: "https://abcdefgh.supabase.co/storage/v1/object/public/c/1.jpg" }
    for (const h of [H(<EditorLatestRelease content={c} ctx={eCtx()} />), H(<PublicLatestRelease content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("/_next/image")
      expect(h).toContain('sizes="84px"')
    }
  })
})

describe("vague 22 - activation", () => {
  it("les quatre blocs sont dans le drapeau de migration", () => {
    for (const t of ["latest_release", "playlist_block", "presave", "music_links"]) expect(SHARED_RENDERER_BLOCKS.has(t)).toBe(true)
  })
  it("les deux blocs reellement bloques le restent", () => {
    // `embed_block` : adresse arbitraire dans un <iframe>. `media_before_after` :
    // curseur a glisser, sans tests DOM dans le pipeline actuel.
    for (const t of ["embed_block", "media_before_after"]) expect(SHARED_RENDERER_BLOCKS.has(t), t).toBe(false)
  })
})
