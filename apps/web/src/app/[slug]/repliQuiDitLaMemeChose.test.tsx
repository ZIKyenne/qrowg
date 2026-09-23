// Le chemin de repli dit la même chose que le produit — garde de classe.
//
// ── Ce que le fichier promet, et ce qu'il tenait ───────────────────────────
//
// `renduLegacy.tsx` porte, en tête, la raison de son existence :
//
//     « L'assurance reste, elle cesse simplement de voyager avec le visiteur.
//       Ce module n'est chargé que si un bloc de la page n'est PAS servi par le
//       renderer partagé : **retirer un type de SHARED_RENDERER_BLOCKS le fait
//       revenir aussitôt.** »
//
// Le repli est donc une opération prévue, documentée, et faite pour être sûre.
// Mais les corrections, elles, ne sont jamais revenues ici : chaque lot a
// réparé le renderer partagé, et le repli a gardé les défauts d'avant.
//
// Relevé de ce lot, en rendant les deux renderers sur un contenu VIDE, bloc par
// bloc. **Six blocs migrés publiaient ici ce que le partagé refuse :**
//
//     spotify_player   « 🎧 Écouter sur Spotify » — et aucun bouton : le défaut
//                      exact que le lot v166 a réparé, mot pour mot.
//     google_maps      « 📍 Adresse » — une carte d'adresse sans adresse.
//     event_info       une carte bordée, et rien dedans (le lot v152 la
//                      décrivait déjà : « 351 octets, et rien dedans »).
//     order_online     une coquille vide
//     menu_section     une coquille vide
//     promo_banner     une coquille vide
//
// Et le lot v168 en avait compté sept autres qui fabriquaient leur adresse.
//
// ── Pourquoi la garde de parité ne l'a jamais vu ──────────────────────────
//
// `rendererParity.test.ts` vérifie que chaque bloc a un `case`. C'est une
// parité d'EXISTENCE : elle dit qu'un bloc sera rendu, jamais ce qu'il rendra.
// Les deux renderers pouvaient donc publier des choses différentes sans qu'une
// seule ligne ne s'en aperçoive. C'est ce que cette garde-ci compare.
//
// ── Ce qui a été fait, et pourquoi c'est une ligne ────────────────────────
//
// `hasPublishableContent` est déjà le miroir EXACT du filtre public — les lots
// v166 et v167 l'ont vérifié en l'exécutant sur les cent quarante-six blocs.
// Le repli pose donc la même question, une fois, en tête de `RenduLegacy` :
// tous les blocs d'un coup, y compris ceux qu'aucun lot n'a encore regardés.
// Et ses trente ancres écrites à la main passent par `LienPublic`, qui juge —
// la primitive était là, dans le même fichier, employée trente fois par
// ailleurs.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"
import { RenduLegacy } from "./renduLegacy"
import { BLOCK_DEFS } from "../dashboard/builder/blockDefs"
import { SHARED_RENDERER_BLOCKS } from "../dashboard/builder/shared-renderer/architecture"
import { socialHref } from "../dashboard/builder/types"

const PARTAGE = path.join(__dirname, "..", "dashboard", "builder", "shared-renderer")
const REG = fs.readFileSync(path.join(PARTAGE, "publicRegistry.tsx"), "utf8")
const LEGACY = fs.readFileSync(path.join(__dirname, "renduLegacy.tsx"), "utf8")

function adaptersPublics(): Record<string, [string, string]> {
  const parNom: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/const (Public\w+) = dynamic\(\(\) => import\("\.\/blocks\/([^"]+)"\)\.then\(m => m\.(\w+)\)\)/g))
    parNom[m[1]] = [m[2], m[3]]
  const out: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/^\s{2}([a-z0-9_]+): (Public\w+),/gm)) if (parNom[m[2]]) out[m[1]] = parNom[m[2]]
  return out
}

const theme: any = { bg: "#080808", primary: "#C9A84C", muted: "#8A8478", text: "#F5F0E8", surface: "#111009", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F" }
const ctx: any = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {} }

async function duPartage(chemin: string, nom: string, contenu: Record<string, unknown>): Promise<string> {
  const mod = (await import(/* @vite-ignore */ `../dashboard/builder/shared-renderer/blocks/${chemin}`)) as Record<string, ComponentType<never>>
  const C = mod[nom]
  if (!C) return ""
  try { return renderToStaticMarkup(createElement(C as never, { content: contenu, ctx } as never)).trim() } catch { return "" }
}

function duRepli(type: string, contenu: Record<string, unknown>): string {
  try {
    return renderToStaticMarkup(createElement(RenduLegacy as never,
      { block: { id: "b1", type, content: contenu, visible: true }, theme, pageId: "p1" } as never)).trim()
  } catch { return "" }
}

const lu = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

/** Une adresse que le produit refuse, et qui ne ressemble pas à une absence. */
const REFUSEE = "ftp://exemple.fr/x"
const ADMISE = "https://exemple.fr/reserver"
/**
 * Un champ d'adresse, c'est celui que le PRODUIT déclare ainsi.
 *
 * Ma première rédaction devinait le rôle d'un champ à son nom (`…url`, `…link`).
 * Une mutation me l'a montrée trop étroite : les cinq plateformes de
 * `music_links` s'appellent `spotify`, `deezer`, `soundcloud`… — des adresses
 * que mon balayage ne poivrait jamais. Le panneau de réglages, lui, le sait :
 * il écrit `type: "url"` pour chacune. C'est sa déclaration qui fait foi.
 */
const champsDAdresse = (type: string): string[] =>
  ((BLOCK_DEFS as Record<string, { fields?: { key: string; type?: string }[] }>)[type]?.fields ?? [])
    .filter(f => f.type === "url" || /url$|link$/.test(f.key) || f.key === "src" || f.key === "href")
    .map(f => f.key)

function contenuGarni(type: string, adresse: string): Record<string, string> | null {
  const def = (BLOCK_DEFS as Record<string, { fields?: { key: string; type?: string }[] }>)[type]
  const adresses = new Set(champsDAdresse(type))
  if (adresses.size === 0) return null
  const out: Record<string, string> = {}
  for (const f of def?.fields ?? [])
    out[f.key] = adresses.has(f.key) ? adresse
      : /(^|_)(img|image|photo|cover|avatar|logo)\d*$/.test(f.key) ? "https://exemple.supabase.co/a.png"
      : /(^|_)(emoji|icon)\d*$/.test(f.key) ? "★" : "Réel"
  return out
}

describe("garde de classe : à vide, le repli se tait comme le produit", () => {
  it("aucun bloc migré ne publie ici ce que le renderer partagé refuse", async () => {
    const ecarts: string[] = []
    let compares = 0
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      if (!SHARED_RENDERER_BLOCKS.has(type)) continue
      compares++
      const partage = await duPartage(chemin, nom, {})
      if (partage !== "") continue          // le partagé publie : le repli a le droit
      const repli = duRepli(type, {})
      if (repli !== "") ecarts.push(`${type} : le repli publie « ${lu(repli).slice(0, 60) || "(une coquille vide)"} »`)
    }
    expect(compares, "des blocs comparés des deux côtés").toBeGreaterThan(140)
    expect(ecarts, "un repli qui publie ce que le produit refuse ramène les défauts d'avant").toEqual([])
  }, 180_000)

  it("…et il n'est pas devenu muet pour autant", async () => {
    // Le plancher. `RenduLegacy` rend `null` sur un bloc vide depuis ce lot :
    // sans cette contre-épreuve, un repli qui ne publierait PLUS RIEN, jamais,
    // passerait le test précédent avec les honneurs.
    const CAS: [string, Record<string, string>][] = [
      ["spotify_player", { title: "Mon album", url: "https://open.spotify.com/album/1" }],
      ["google_maps", { address: "12 rue des Lilas, Lyon" }],
      ["event_info", { name: "Portes ouvertes" }],
      ["order_online", { url: ADMISE }],
      ["menu_section", { category: "Entrées" }],
      ["promo_banner", { text: "-20 % ce week-end" }],
      ["podcast_links", { podcast_name: "Le café du matin", spotify_url: ADMISE }],
    ]
    for (const [type, contenu] of CAS) {
      const repli = duRepli(type, contenu)
      expect(repli, `${type} : rempli, le repli publie`).not.toBe("")
      expect(lu(repli).length, `${type} : et il publie quelque chose de lisible`).toBeGreaterThan(3)
    }
  })

  it("les six du relevé, nommément", async () => {
    // Ceux-là publiaient une promesse ou une coquille. On les cite pour que la
    // garde dise ce qu'elle protège, et pas seulement qu'elle protège.
    for (const type of ["spotify_player", "google_maps", "event_info", "order_online", "menu_section", "promo_banner"])
      expect(duRepli(type, {}), `${type} à vide`).toBe("")
    // Le plus parlant : la carte qui promettait une écoute sans bouton.
    expect(duRepli("spotify_player", { title: "Ma musique" }), "un titre seul ne fait pas un lien").toBe("")
    expect(lu(duRepli("spotify_player", { title: "Ma musique", url: "https://open.spotify.com/track/1" })),
      "…et avec le lien, la carte revient entière").toContain("Ma musique")
  })
})

describe("garde de classe : le repli ne fabrique plus d'adresse", () => {
  it("aucun bloc, migré ou non, ne publie ici un schéma refusé", () => {
    // Le lot v168 en comptait sept, et laissait un cliquet. Il est à zéro.
    const fautifs: string[] = []
    let sondes = 0, champs = 0
    for (const type of Object.keys(BLOCK_DEFS)) {
      const contenu = contenuGarni(type, REFUSEE)
      if (!contenu) continue
      sondes++
      champs += champsDAdresse(type).length
      const html = duRepli(type, contenu)
      const fabriquees = html.match(/href="[^"]*ftp:[^"]*"/g) ?? []
      if (fabriquees.length) fautifs.push(`${type} : ${fabriquees.length} × ${fabriquees[0]}`)
    }
    expect(sondes, "des blocs qui déclarent une adresse").toBeGreaterThan(50)
    expect(champs, "des champs d'adresse poivrés").toBeGreaterThan(120)
    // …et il reste LARGE. Un compte ne suffit pas à le dire : en cessant de
    // deviner au nom, le total n'a presque pas bougé — ce sont les champs
    // CONCERNÉS qui ont changé. On nomme donc ceux que seul `type: "url"`
    // désigne, et ce sont exactement ceux par lesquels le défaut est arrivé.
    expect(champsDAdresse("music_links"), "les plateformes de `music_links`").toContain("spotify")
    expect(champsDAdresse("social_links"), "les réseaux de `social_links`").toContain("instagram")
    expect(champsDAdresse("podcast_links"), "…et ce que le nom désignait déjà").toContain("spotify_url")
    expect(fautifs, "« https://ftp://… » n'est pas une adresse, c'en est la fabrication").toEqual([])
  }, 180_000)

  it("…et il publie toujours les vraies — sinon le test précédent ne dirait rien", () => {
    let liens = 0, blocs = 0
    for (const type of Object.keys(BLOCK_DEFS)) {
      const contenu = contenuGarni(type, ADMISE)
      if (!contenu) continue
      const n = (duRepli(type, contenu).match(/href="https:\/\/exemple\.fr\/reserver"/g) ?? []).length
      liens += n
      if (n) blocs++
    }
    expect(blocs, "des blocs qui publient vraiment un lien").toBeGreaterThan(15)
    expect(liens, "et des ancres dedans").toBeGreaterThan(25)
  }, 180_000)

  it("`podcast_links` posait la valeur du commerçant telle quelle", () => {
    // La plus brute des trente : `href={c[k as string]}`, sans même `extHref`.
    // La garde `adressesFiltrees` cherchait `href={c.quelque_chose}` — la forme
    // à crochets lui échappait, et ce fichier-là était justement celui qu'elle
    // avait été écrite pour surveiller.
    expect(LEGACY, "plus d'ancre à la main sur cette valeur").not.toMatch(/<a [^>]*href=\{c\[k as string\]\}/)
    expect(LEGACY, "elle passe par la primitive qui juge").toMatch(/LienPublic key=\{String\(k\)\} href=\{c\[k as string\]\}/)
    const html = duRepli("podcast_links", { podcast_name: "Le café", spotify_url: "javascript:alert(1)", apple_url: ADMISE })
    expect(html, "un schéma exécutable ne devient pas une ancre").not.toContain("javascript:")
    expect(html, "…et la plateforme valide reste publiée").toContain(ADMISE)
  })
})

describe("le constructeur d'adresse de réseau ne juge pas non plus", () => {
  // Trouvé en élargissant le balayage aux champs que le produit DÉCLARE comme
  // des adresses. `socialHref` fabrique une adresse à partir d'un pseudo — et
  // fabriquait aussi à partir d'une valeur portant un schéma refusé :
  //
  //     socialHref("linkedin", "ftp://exemple.fr/x")
  //         → "https://linkedin.com/in/ftp://exemple.fr/x"
  //
  // Soixante-dix-huit ancres de ce genre sur le seul bloc « Réseaux sociaux »,
  // quatre sur « Équipe ». C'est le défaut du lot v168 un cran plus bas : un
  // CONSTRUCTEUR d'adresse ne juge pas, il faut le lui demander.
  it("un schéma refusé ne devient pas un profil", () => {
    for (const mauvaise of ["ftp://exemple.fr/x", "javascript:alert(1)", "data:text/html,x", "vbscript:x"]) {
      expect(socialHref("linkedin", mauvaise), mauvaise).toBe("")
      expect(socialHref("instagram", mauvaise), mauvaise).toBe("")
    }
  })

  it("…et tout ce qui marchait marche encore", () => {
    // La contre-épreuve : sans elle, `return ""` partout passerait le test.
    expect(socialHref("instagram", "@marcel")).toBe("https://instagram.com/marcel")
    expect(socialHref("instagram", "marcel")).toBe("https://instagram.com/marcel")
    expect(socialHref("instagram", "https://instagram.com/marcel")).toBe("https://instagram.com/marcel")
    expect(socialHref("instagram", "www.instagram.com/marcel")).toBe("https://www.instagram.com/marcel")
    expect(socialHref("email", "marcel@exemple.fr")).toContain("marcel@exemple.fr")
    expect(socialHref("linkedin", "in/marcel")).toContain("marcel")
  })

  it("exécuté : les deux blocs qui en vivaient ne publient plus d'adresse fabriquée", () => {
    const reseaux = duRepli("social_links", { instagram: "ftp://exemple.fr/x", facebook: "marcel" })
    expect(reseaux, "le profil fabriqué a disparu").not.toContain("ftp:")
    expect(reseaux, "…et le vrai est toujours là").toContain("https://facebook.com/marcel")
    const equipe = duRepli("team", { m1_name: "Marie", m1_linkedin: "ftp://exemple.fr/x" })
    expect(equipe, "aucun LinkedIn fabriqué").not.toContain("ftp:")
    expect(duRepli("team", { m1_name: "Marie", m1_linkedin: "in/marie" }), "un vrai passe").toContain("marie")
  })
})

describe("la parité d'existence ne suffisait pas, et le dit maintenant", () => {
  it("l'ancienne garde compare des `case`, celle-ci compare ce qui est publié", () => {
    const parite = fs.readFileSync(path.join(__dirname, "rendererParity.test.ts"), "utf8")
    expect(parite, "elle lit bien des `case`").toContain('matchAll(/case\\s+"([a-z0-9_]+)"/g)')
    expect(parite, "et elle renvoie vers la comparaison de ce qui est publié").toContain("repliQuiDitLaMemeChose")
  })

  it("le repli pose la question du produit, une fois, pour tous les blocs", () => {
    expect(LEGACY, "il interroge le détecteur du produit").toContain("if (!hasPublishableContent(block.type, c)) return null")
    expect(LEGACY, "qu'il prend là où il est écrit").toContain('from "../dashboard/builder/blockEmptyState"')
    // Et il ne réécrit pas la règle bloc par bloc : ce serait la dérive que les
    // lots v151 à v154 ont passé leur temps à défaire.
    expect((LEGACY.match(/hasPublishableContent\(/g) ?? []).length, "une seule question, posée une fois").toBe(1)
  })
})
