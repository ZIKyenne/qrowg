// L'éditeur et la page disent la même chose du même contenu — garde de classe.
//
// Suite du lot v151. Celui-là a recadré le miroir : le détecteur d'état vide
// regarde désormais le même nombre d'emplacements que le rendu. Mais il
// regardait toujours la mauvaise CHOSE.
//
// Le contrat de `blockEmptyState.ts`, écrit en tête du fichier :
//
//     hasPublishableContent === false  ⟺  le bloc rend `null` en ligne
//
// Jusqu'ici, on le vérifiait en LISANT. Ce fichier le vérifie en EXÉCUTANT :
// pour chaque bloc et pour chacun de ses champs déclarés, il remplit ce champ
// et rien d'autre, demande son verdict à l'éditeur, rend la page pour de vrai,
// et exige qu'ils soient d'accord. **Cinq cent soixante-douze sondes.**
//
// ── Ce que les sondes ont trouvé ─────────────────────────────────────────────
//
// **Vingt désaccords, dans les deux sens.**
//
// Six fois, l'éditeur disait « ça se publie » et la page ne publiait rien. Le
// détecteur demandait « y a-t-il du texte ? » pendant que la page demande
// « ce texte est-il un numéro, une adresse e-mail, un lien Spotify ? » :
//
//     call_button  whatsapp_button  email_button   → un numéro, une adresse
//     spotify_embed  video                         → un hôte autorisé
//     event_access.embed_url                       → une carte lisible
//
// Un commerçant qui écrit « à venir » dans le champ téléphone voyait un bouton
// entier dans l'éditeur, et rien en ligne. **Et le produit savait déjà** : le
// détecteur d'`embed_block` posait la même question que la page, avec la même
// fonction, et son commentaire disait pourquoi — « Le détecteur doit être le
// miroir EXACT du filtre public, c'est le contrat de ce module ». Un endroit le
// faisait, six ne le faisaient pas.
//
// Quatorze fois, l'inverse — plus grave. Un logo SANS nom, une photo SANS nom :
// la page les affiche, et l'éditeur annonçait « Invisible en ligne tant qu'il
// est vide » sur un bloc qui s'affichait. Le commerçant pouvait le supprimer en
// croyant qu'il ne servait à rien.
//
// ── Et cinq blocs qui écrivaient à la place du commerçant ────────────────────
//
// Sans détecteur, l'aperçu dessinait « 💿 Mon Album », « 🎙️ Mon Podcast »,
// « 📄 Mon document PDF ↓ PDF », « 🎟️ Mon événement · Réserver ma place »,
// « 🎁 Offrez une expérience » — pendant que la page ne publiait rien. C'est
// mot pour mot ce que la première ligne de `blockEmptyState.ts` interdit :
// « l'éditeur ne doit jamais montrer de faux contenu (données de démo) comme
// s'il serait publié ».
//
// La classe : **l'éditeur et la page disent la même chose du même contenu.**

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "../blockEmptyState"
import { BLOCK_DEFS } from "../blockDefs"

const REG = fs.readFileSync(path.join(__dirname, "publicRegistry.tsx"), "utf8")

/** Le registre public, relu : type de bloc → (dossier, nom de l'adapter). */
function adaptersPublics(): Record<string, [string, string]> {
  const parNom: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/const (Public\w+) = dynamic\(\(\) => import\("\.\/blocks\/([^"]+)"\)\.then\(m => m\.(\w+)\)\)/g))
    parNom[m[1]] = [m[2], m[3]]
  const out: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/^\s{2}([a-z0-9_]+): (Public\w+),/gm)) if (parNom[m[2]]) out[m[1]] = parNom[m[2]]
  return out
}

const theme = { fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const ctx = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} }

type Champ = { key: string; type: string; options?: string[] }

/** Une valeur plausible pour ce champ — celle qu'un commerçant y mettrait. */
function valeurDEssai(f: Champ): string {
  switch (f.type) {
    case "url": return "https://exemple.fr"
    case "image": return "https://exemple.fr/photo.png"
    case "color": return "#123456"
    case "select": return f.options?.[1] ?? f.options?.[0] ?? "x"
    case "date": return "2026-10-01"
    case "datetime": return "2026-10-01T10:00"
    default: return "Essai"
  }
}

const champsDe = (t: string) => (((BLOCK_DEFS as Record<string, { fields?: Champ[] }>)[t]?.fields) ?? [])

async function charger(chemin: string, nom: string): Promise<ComponentType<never> | null> {
  const mod = (await import(/* @vite-ignore */ `./blocks/${chemin}`)) as Record<string, ComponentType<never>>
  return mod[nom] ?? null
}

const publie = (C: ComponentType<never>, content: Record<string, string>) =>
  renderToStaticMarkup(createElement(C as never, { content, ctx } as never)).trim() !== ""

describe("garde de classe : le verdict de l'éditeur est celui de la page", () => {
  it("champ par champ, sur tous les blocs qui portent un détecteur", async () => {
    const desaccords: string[] = []
    let sondes = 0
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      if (!EMPTY_STATE_BLOCK_TYPES.includes(type)) continue
      const C = await charger(chemin, nom)
      if (!C) { desaccords.push(`${type} : l'adapter ${nom} est introuvable`); continue }
      for (const f of champsDe(type)) {
        const contenu = { [f.key]: valeurDEssai(f) }
        sondes++
        const dit = hasPublishableContent(type, contenu)
        const fait = publie(C, contenu)
        if (dit !== fait) desaccords.push(`${type}.${f.key} : l'éditeur dit ${dit}, la page fait ${fait}`)
      }
    }
    expect(sondes, "des sondes — sinon la garde ne prouve rien").toBeGreaterThan(500)
    expect(desaccords, "le détecteur doit poser la MÊME question que le rendu").toEqual([])
  }, 60_000)

  it("…et sur les deux extrêmes : rien du tout, puis tout rempli", async () => {
    const fautifs: string[] = []
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      if (!EMPTY_STATE_BLOCK_TYPES.includes(type)) continue
      const C = await charger(chemin, nom)
      if (!C) continue
      if (hasPublishableContent(type, {}) !== publie(C, {})) fautifs.push(`${type} : à vide`)
      const tout: Record<string, string> = {}
      for (const f of champsDe(type)) tout[f.key] = valeurDEssai(f)
      if (Object.keys(tout).length && hasPublishableContent(type, tout) !== publie(C, tout)) fautifs.push(`${type} : tout rempli`)
    }
    expect(fautifs).toEqual([])
  }, 60_000)
})

describe("les questions que le détecteur pose sont celles du produit", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "blockEmptyState.ts"), "utf8")

  it("un lien, un numéro, une adresse : la fonction du produit, pas un test de non-vide", () => {
    // Réancré au lot v154. La question est toujours posée — mais une fois, et à
    // l'endroit qui décide : le modèle public. Le détecteur l'appelle.
    expect(src, "call_button n'a pas de modèle partagé : sa règle reste ici").toContain("telLink(c.phone)")
    for (const [bloc, modele, regle] of [
      ["whatsapp_button", "whatsappButton", "waLink(c.phone, c.message, c.country_code)"],
      ["email_button", "emailButton", "lienEmail(c.email"],
      // Lot v159 : l'argument est passé au tamis (`typeof c.url === "string"`)
      // avant d'atteindre la fonction. Ce qui compte ici est que le modèle
      // APPELLE la fonction du produit, pas la forme exacte de son argument.
      ["spotify_embed", "spotifyEmbed", "spotifyEmbedUrl("],
      ["video", "videoBlock", "videoEmbedModel(c)"],
    ] as const) {
      expect(src, `${bloc} : le détecteur appelle`).toMatch(new RegExp(`${bloc}:\\s+c => \\w+ViewModel\\(c\\)`))
      expect(fs.readFileSync(path.join(__dirname, "models", `${modele}.ts`), "utf8"), `${modele} pose la question`).toContain(regle)
    }
    // Et le geste existait déjà, écrit avec sa raison, à un seul endroit.
    expect(src).toContain("embedHref(c.url).length > 0")
    expect(src).toContain("miroir EXACT du filtre public")
  })

  it("une image compte autant qu'un nom, là où la page l'affiche", () => {
    expect(src).toContain('anyIndexed(c, "logo_marquee", i => safeImageUrl(c[`logo${i}`]))')
    expect(src).toContain('anyIndexed(c, "avatar_row", i => safeImageUrl(c[`img${i}`]))')
  })

  it("les cinq blocs qui écrivaient le contenu à la place du commerçant ont leur détecteur", () => {
    for (const t of ["gift_card", "event_ticketing", "pdf_viewer", "album_block", "podcast_links"])
      expect(EMPTY_STATE_BLOCK_TYPES, t).toContain(t)
    // …et ils ne publient plus rien à vide, du côté de l'éditeur non plus.
    for (const t of ["gift_card", "event_ticketing", "pdf_viewer", "album_block", "podcast_links"])
      expect(hasPublishableContent(t, {}), t).toBe(false)
  })
})

describe("le cliquet : les blocs qui disparaissent sans que l'éditeur le dise", () => {
  it("leur nombre ne peut que descendre", async () => {
    const muets: string[] = []
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      if (EMPTY_STATE_BLOCK_TYPES.includes(type)) continue
      const C = await charger(chemin, nom)
      if (!C) continue
      if (!publie(C, {})) muets.push(type)
    }
    // 79 au relevé du lot v152, 74 après les cinq blocs qui inventaient du
    // contenu, 71 depuis que le lot v154 a donné leur détecteur à `heading`,
    // `menu_tabs` et `timeline` — les trois dont l'adapter éditeur savait déjà
    // dire « invisible en ligne ». Chacun des restants demande d'abord un état
    // vide dans son adapter : un travail bloc par bloc, pas un balayage.
    expect(muets.length, `restants : ${muets.join(", ")}`).toBe(0)
    // Fermé au lot v171 : la garde demeure, elle empêche le prochain.
  }, 60_000)

  it("le balayage voit bien tout le registre — sinon il ne prouve rien", () => {
    const tous = Object.keys(adaptersPublics())
    expect(tous.length, "des blocs au registre public").toBeGreaterThan(140)
    expect(EMPTY_STATE_BLOCK_TYPES.length, "dont ceux qui portent un détecteur").toBeGreaterThan(70)
    expect(tous, "et le registre est bien celui du produit").toContain("icon_row")
  })
})
