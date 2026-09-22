// La liste d'avant publication ne ment plus par omission — garde de classe.
//
// ── Ce que le lot v166 a laissé écrit, et que ce relevé corrige ────────────
//
// Le lot v166 a donné leur détecteur à douze blocs, et a noté des soixante
// restants : « leur rendu décide seul, sans modèle à interroger ». J'ai
// recompté, bloc par bloc, en lisant ce que chaque composant public importe :
//
//     vingt-neuf ont un modèle qui décide     `if (!apropos(content)) return null`
//     trente et un décident dans le composant  (helpers de mise en page seuls)
//     aucun n'est sans rien
//
// Ma note était donc fausse pour la moitié d'entre eux. Ces vingt-neuf modèles
// ne disent pas `visible` — ils rendent l'objet à publier, ou `null`, ou une
// liste vide. C'est la même décision, dite autrement, et le lot v154 avait déjà
// nommé le geste : **le détecteur appelle ce qu'il reflète, il ne le recopie
// plus.** Il ne restait qu'à le faire dans cette seconde forme.
//
// ── Pourquoi ce chaînon manquant se voyait chez le commerçant ──────────────
//
// Leur éditeur montrait DÉJÀ l'état vide : « Ajoutez votre adresse »,
// « Ajoutez un membre de l'équipe ». Le bloc n'était donc pas muet dans
// l'aperçu. Mais `AlertesPublication` — le résumé qui s'affiche à côté du
// bouton « Publier », et qui énumère ce qui ne partira pas en ligne — ne
// regarde que les types présents dans `EMPTY_STATE_BLOCK_TYPES` :
//
//     const vide = EMPTY_STATE_BLOCK_TYPES.includes(b.type) && !hasPublishableContent(…)
//
// Sans détecteur, le bloc était **absent de cette liste**. Un commerçant qui
// descend sa page, voit un encart « Ajoutez votre adresse » parmi trente blocs,
// puis remonte, lit « rien à vérifier » et publie — sa page part sans le bloc.
// La liste ne se trompait pas : elle se taisait. C'est pire, parce qu'on la lit
// justement pour ne pas avoir à tout relire.
//
// ── Le septième exemplaire qu'on n'a pas écrit ─────────────────────────────
//
// Six blocs de la famille « chaînes » partagent une fonction, `chaine(c, r)`,
// et chacun portait son réglage dans son composant. Le détecteur doit poser la
// MÊME question, donc appeler `chaine` avec le MÊME réglage : l'écrire ici en
// aurait fait un septième exemplaire. Les réglages sont remontés dans le
// modèle, les composants les y prennent, et cette garde vérifie qu'aucun ne les
// réécrit. C'est la leçon des lots v159 à v163, appliquée avant la dérive.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "./blockEmptyState"
import { alertesPublication } from "./AlertesPublication"
import { SHARED_RENDERER_BLOCKS } from "./shared-renderer/architecture"
import { resolveEditorBlock } from "./shared-renderer/editorRegistry"
import { BLOCK_DEFS } from "./blockDefs"
import type { Block } from "./types"

const RACINE = path.join(__dirname, "shared-renderer")
const SRC = fs.readFileSync(path.join(__dirname, "blockEmptyState.ts"), "utf8")
const REG = fs.readFileSync(path.join(RACINE, "publicRegistry.tsx"), "utf8")

/** Le composant public de chaque type, tel que le registre le déclare. */
function adaptersPublics(): Record<string, [string, string]> {
  const parNom: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/const (Public\w+) = dynamic\(\(\) => import\("\.\/blocks\/([^"]+)"\)\.then\(m => m\.(\w+)\)\)/g))
    parNom[m[1]] = [m[2], m[3]]
  const out: Record<string, [string, string]> = {}
  for (const m of REG.matchAll(/^\s{2}([a-z0-9_]+): (Public\w+),/gm)) if (parNom[m[2]]) out[m[1]] = parNom[m[2]]
  return out
}

/** Le fichier source d'un bloc, qu'il soit `x.tsx` ou `x/index.tsx`. */
function fichierDuBloc(chemin: string): string {
  for (const c of [path.join(RACINE, "blocks", `${chemin}.tsx`), path.join(RACINE, "blocks", chemin, "index.tsx")])
    if (fs.existsSync(c)) return c
  throw new Error(`source introuvable pour ${chemin}`)
}

const theme: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const ctxPublic: any = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {} }
const ctxEditeur: any = { theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: "#39FF8F", surfaceStyle: {}, canEdit: false, edit: () => () => {} }

/** Ce que la PAGE publie pour ce bloc, avec ce contenu. `null` si rien. */
async function rendu(chemin: string, nom: string, contenu: Record<string, unknown>): Promise<string | null> {
  const mod = (await import(/* @vite-ignore */ `./shared-renderer/blocks/${chemin}`)) as Record<string, ComponentType<never>>
  const C = mod[nom]
  if (!C) return null
  try {
    const html = renderToStaticMarkup(createElement(C as never, { content: contenu, ctx: ctxPublic } as never))
    return html.trim() === "" ? null : html
  } catch { return null }
}

/**
 * Les vingt-neuf du lot, avec le nom du modèle que leur rendu appelle et de
 * quoi les remplir pour de vrai.
 *
 * Le champ de remplissage n'est pas décoratif : sans lui, un détecteur qui
 * répondrait toujours « vide » passerait cette garde entière.
 */
const POSES: { type: string; modele: string; rempli: Record<string, string> }[] = [
  { type: "packs", modele: "listePacks", rempli: { pack1_name: "Formule découverte" } },
  { type: "services_pricing", modele: "listePrestations", rempli: { s1_name: "Coupe homme" } },
  { type: "google_maps", modele: "carteAdresse", rempli: { address: "12 rue des Lilas, Lyon" } },
  { type: "quick_contact", modele: "contactsRapides", rempli: { phone: "+33 6 12 34 56 78" } },
  { type: "cta_button", modele: "boutonAction", rempli: { label: "Réserver", url: "https://exemple.fr" } },
  { type: "team", modele: "equipe", rempli: { m1_name: "Marie Dupont" } },
  { type: "multi_contact", modele: "interlocuteurs", rempli: { c1_name: "Service client" } },
  { type: "profile", modele: "profil", rempli: { name: "Chez Marcel" } },
  { type: "opening_hours", modele: "horaires", rempli: { mon_fri: "9h — 19h" } },
  { type: "gallery", modele: "galerie", rempli: { img1: "https://exemple.supabase.co/photo.png" } },
  { type: "social_links", modele: "reseauxActifs", rempli: { instagram: "chezmarcel" } },
  { type: "about", modele: "apropos", rempli: { title: "Notre histoire" } },
  { type: "announcement", modele: "annonce", rempli: { title: "Fermé lundi" } },
  { type: "faq", modele: "faq", rempli: { q1: "Livrez-vous ?" } },
  { type: "offer_comparison", modele: "comparaison", rempli: { plan1_name: "Essentiel" } },
  { type: "instagram_feed", modele: "chaine", rempli: { cta_url: "https://instagram.com/chezmarcel" } },
  { type: "tiktok_feed", modele: "chaine", rempli: { cta_url: "https://tiktok.com/@chezmarcel" } },
  { type: "youtube_channel", modele: "chaine", rempli: { cta_url: "https://youtube.com/@chezmarcel" } },
  { type: "twitch_live", modele: "chaine", rempli: { cta_url: "https://twitch.tv/chezmarcel" } },
  { type: "discord_server", modele: "chaine", rempli: { cta_url: "https://discord.gg/abc" } },
  { type: "telegram_channel", modele: "chaine", rempli: { cta_url: "https://t.me/chezmarcel" } },
  { type: "social_feature", modele: "reseauVedette", rempli: { network: "instagram", url: "chezmarcel" } },
  { type: "add_to_calendar", modele: "agenda", rempli: { event_name: "Portes ouvertes" } },
  { type: "ticketing", modele: "billetterie", rempli: { event_name: "Concert d'été" } },
  { type: "hero_banner", modele: "hero", rempli: { title: "Bienvenue" } },
  { type: "section_block", modele: "enTeteSection", rempli: { title: "Nos services" } },
  { type: "latest_release", modele: "derniereSortie", rempli: { title: "Nouvel album" } },
  { type: "playlist_block", modele: "playlist", rempli: { title: "Ma sélection" } },
  { type: "presave", modele: "presave", rempli: { release_name: "Prochain single" } },
  { type: "music_links", modele: "liensMusique", rempli: { spotify: "https://open.spotify.com/artist/1" } },
]

describe("garde de classe : les trois visages du même bloc disent la même chose", () => {
  it("à vide : la page ne publie rien, l'éditeur le dit, le détecteur le sait", async () => {
    const adapters = adaptersPublics()
    const desaccords: string[] = []
    for (const { type } of POSES) {
      const declare = adapters[type]
      if (!declare) { desaccords.push(`${type} : absent du registre public`); continue }
      const publieRien = (await rendu(declare[0], declare[1], {})) === null
      const detecteurDitVide = !hasPublishableContent(type, {})
      const Adapter = SHARED_RENDERER_BLOCKS.has(type) ? resolveEditorBlock(type) : null
      const editeurLeDit = !!Adapter && renderToStaticMarkup(createElement(Adapter as any, { content: {}, ctx: ctxEditeur })).includes('role="note"')
      if (!publieRien) desaccords.push(`${type} : la page publie quelque chose à vide`)
      if (!detecteurDitVide) desaccords.push(`${type} : le détecteur le croit plein`)
      if (!editeurLeDit) desaccords.push(`${type} : l'éditeur ne montre pas d'état vide`)
    }
    expect(desaccords, "page, éditeur et détecteur regardent la même chose").toEqual([])
    // Trente lignes : les vingt-neuf qui entrent dans la liste, plus
    // `instagram_feed` qui y était déjà et dont la règle recopiée est corrigée.
    expect(POSES.length).toBe(30)
    expect(POSES.filter(p => p.type !== "instagram_feed").length, "les vingt-neuf du relevé").toBe(29)
  }, 120_000)

  it("rempli : la page publie, et le détecteur dit oui — sinon rien ne serait prouvé", async () => {
    // Sans ce second sens, un détecteur qui répondrait toujours « vide »
    // passerait le test précédent, et la liste d'avant publication crierait au
    // loup sur des blocs pleins.
    const adapters = adaptersPublics()
    const fautifs: string[] = []
    for (const { type, rempli } of POSES) {
      const [chemin, nom] = adapters[type]
      if ((await rendu(chemin, nom, rempli)) === null) fautifs.push(`${type} : la page ne publie rien alors qu'il est rempli`)
      if (!hasPublishableContent(type, rempli)) fautifs.push(`${type} : le détecteur le croit vide alors qu'il est rempli`)
    }
    expect(fautifs).toEqual([])
  }, 120_000)
})

describe("exécuté : champ par champ, et non sur un exemple bien choisi", () => {
  // Une mutation me l'a appris, et c'est la leçon du lot v164 : faire appeler au
  // détecteur d'`about` le modèle du bloc voisin (`annonce` au lieu d'`apropos`)
  // ne faisait échouer que la garde qui LIT le source. Les deux modèles sont
  // d'accord sur un titre — et mon exemple rempli était un titre. Ils divergent
  // sur `text`, qu'`apropos` publie et qu'`annonce` ignore.
  //
  // Un exemple bien choisi prouve donc surtout que je l'avais bien choisi. On
  // interroge ici CHAQUE champ que le bloc déclare, un par un, et on compare ce
  // que la page en fait à ce que le détecteur en dit. C'est le geste du lot
  // v152 — cinq cent soixante-douze sondes, vingt désaccords — rejoué sur les
  // trente de ce lot.
  const valeurPour = (cle: string): string =>
    /(^|_)(img|image|photo|cover|src|avatar|logo)/.test(cle) ? "https://exemple.supabase.co/photo.png"
      : /(url|link|href)/.test(cle) ? "https://exemple.fr/page"
      : "Réel"

  it("aucun champ ne publie sans que le détecteur le dise, ni l'inverse", async () => {
    const adapters = adaptersPublics()
    const desaccords: string[] = []
    let sondes = 0
    for (const { type } of POSES) {
      const [chemin, nom] = adapters[type]
      const champs = ((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>)[type]?.fields ?? []).map(f => f.key)
      for (const cle of champs.slice(0, 14)) {
        const contenu = { [cle]: valeurPour(cle) }
        sondes++
        const publie = (await rendu(chemin, nom, contenu)) !== null
        const ditPlein = hasPublishableContent(type, contenu)
        if (publie !== ditPlein)
          desaccords.push(`${type}.${cle} : la page ${publie ? "publie" : "ne publie rien"}, le détecteur dit ${ditPlein ? "plein" : "vide"}`)
      }
    }
    // Le plancher : un balayage devenu aveugle passerait vert sans lui.
    expect(sondes, "des sondes tirées des champs déclarés").toBeGreaterThan(200)
    expect(desaccords, "le détecteur est le miroir EXACT du filtre public").toEqual([])
  }, 180_000)
})

describe("exécuté : la liste d'avant publication les nomme, un par un", () => {
  const bloc = (type: string, content: Record<string, unknown>): Block =>
    ({ id: `b-${type}`, type, content, visible: true } as unknown as Block)

  it("un bloc vide de chacun des vingt-neuf apparaît dans la liste", () => {
    // C'est la fonction du produit, celle qu'appelle le panneau « Publier » —
    // pas une réécriture de sa règle.
    const alertes = alertesPublication(POSES.map(p => bloc(p.type, {})))
    const manquants = POSES.filter(p => !alertes.some(a => a.blocId === `b-${p.type}`)).map(p => p.type)
    expect(manquants, "un bloc absent de la liste se publie dans le dos du commerçant").toEqual([])
    for (const a of alertes) expect(a.texte.length, `${a.blocId} : la ligne dit quelque chose`).toBeGreaterThan(10)
  })

  it("…et disparaît de la liste dès qu'il est rempli", () => {
    // Une liste qui ne se tait jamais ne se lit plus : c'est la moitié utile du
    // contrat, et la seule qui prouve que la première n'est pas un bug.
    const alertes = alertesPublication(POSES.map(p => bloc(p.type, p.rempli)))
    const criards = alertes.map(a => a.blocId)
    expect(criards, "un bloc rempli n'a rien à signaler").toEqual([])
  })

  it("un bloc masqué ne se signale pas — il ne publiait rien de toute façon", () => {
    const masque = { ...bloc("about", {}), visible: false } as Block
    expect(alertesPublication([masque])).toEqual([])
  })
})

describe("garde de classe : ces détecteurs appellent, ils ne recopient pas", () => {
  /** La seconde forme du geste du lot v154 : `c => modele(c) !== null`. */
  const APPEL = /^c => (\w+)\(c(?:, REGLAGES\.\w+)?\)(?:\.length > 0| !== null),$/

  /** Une entrée du tableau des détecteurs, telle qu'elle est écrite. */
  function corpsDu(type: string): string | null {
    const m = new RegExp(`^ {2}${type}: +(c => .*)$`, "m").exec(SRC)
    return m ? m[1] : null
  }

  it("chacun des vingt-neuf est un appel, et rien d'autre", () => {
    const recopies: string[] = []
    for (const { type, modele } of POSES) {
      const corps = corpsDu(type)
      if (!corps) { recopies.push(`${type} : détecteur introuvable`); continue }
      const m = APPEL.exec(corps)
      if (!m) { recopies.push(`${type} : ${corps}`); continue }
      if (m[1] !== modele) recopies.push(`${type} : appelle ${m[1]}, pas ${modele}`)
    }
    expect(recopies, "une condition recopiée finit par ne plus dire la vérité").toEqual([])
  })

  it("le modèle appelé est celui que la PAGE appelle — l'oracle est le produit", () => {
    // Le cœur de la garde : le détecteur n'appelle pas « un » modèle, il appelle
    // la fonction que le composant public interroge pour décider de disparaître.
    // C'est ce qui rend l'équivalence vraie par construction, et pas par accord.
    const adapters = adaptersPublics()
    const ecarts: string[] = []
    for (const { type, modele } of POSES) {
      const src = fs.readFileSync(fichierDuBloc(adapters[type][0]), "utf8")
      if (!src.includes(`${modele}(`)) ecarts.push(`${type} : la page n'appelle pas ${modele}`)
      // …et c'est bien ce qui décide de son effacement.
      if (!new RegExp(`if \\(![\\w ]*${modele}\\(content[^)]*\\)[^)]*\\) return null`).test(src)
          && !new RegExp(`${modele}\\(content\\)\\.length === 0\\) return null`).test(src)
          && !/if \(!\w+\) return null/.test(src))
        ecarts.push(`${type} : ce n'est pas ${modele} qui décide de l'effacement`)
    }
    expect(ecarts).toEqual([])
  })

  it("le balayage sait dire non — sinon il ne dirait jamais oui", () => {
    expect(APPEL.test("c => apropos(c) !== null,")).toBe(true)
    expect(APPEL.test("c => equipe(c).length > 0,")).toBe(true)
    expect(APPEL.test("c => chaine(c, REGLAGES.twitch_live) !== null,")).toBe(true)
    // Une règle recopiée n'est pas un appel, même si elle dit vrai aujourd'hui.
    expect(APPEL.test("c => hasMeaningfulText(c.cta_url),")).toBe(false)
    expect(APPEL.test('c => anyIndexed(c, "team", i => c[`m${i}_name`]),')).toBe(false)
    expect(APPEL.test("c => !!c.address && c.address.trim() !== '',")).toBe(false)
    // Et le balayage voit vraiment le fichier : sans ce plancher, un `SRC` vide
    // ferait passer la garde précédente pour verte.
    expect(corpsDu("about"), "le détecteur d'`about` est lisible dans le source").toBeTruthy()
    expect(corpsDu("bloc_qui_nexiste_pas")).toBeNull()
  })
})

describe("la famille « chaînes » : un seul exemplaire du réglage", () => {
  const FAMILLE = ["instagram_feed", "tiktok_feed", "youtube_channel", "twitch_live", "discord_server", "telegram_channel"]

  it("aucun composant ne réécrit son réglage", () => {
    const adapters = adaptersPublics()
    for (const type of FAMILLE) {
      const src = fs.readFileSync(fichierDuBloc(adapters[type][0]), "utf8")
      expect(src, `${type} prend le réglage du modèle`).toContain(`REGLAGES.${type}`)
      expect(src, `${type} ne le réécrit pas`).not.toMatch(/const REGLAGE: Reglage = \{/)
    }
  })

  it("le modèle porte les six, et le détecteur prend les mêmes", async () => {
    const { REGLAGES } = await import("./shared-renderer/models/chaines")
    expect(Object.keys(REGLAGES).sort(), "six blocs, six réglages").toEqual([...FAMILLE].sort())
    for (const type of FAMILLE) expect(SRC, `${type} interroge le réglage partagé`).toContain(`REGLAGES.${type}`)
  })

  it("`instagram_feed` ne recopie plus la règle — et c'était un écart réel", () => {
    // Sa règle était `hasMeaningfulText(c.cta_url)` : « y a-t-il du texte ? ».
    // Sa page demande une destination UTILISABLE. Un schéma écrit qui n'est pas
    // admis — `ftp:`, `javascript:` — est du texte, et ne mène nulle part : le
    // bloc était annoncé publiable, et ne publiait rien.
    for (const faux of ["ftp://exemple.fr/photos", "javascript:alert(1)", "vbscript:x"]) {
      expect(hasPublishableContent("instagram_feed", { cta_url: faux }), faux).toBe(false)
      expect(hasPublishableContent("tiktok_feed", { cta_url: faux }), `${faux} (toute la famille)`).toBe(false)
    }
    // Et une vraie adresse passe toujours — le bloc n'a rien perdu.
    expect(hasPublishableContent("instagram_feed", { cta_url: "instagram.com/chezmarcel" })).toBe(true)
    expect(SRC, "plus de règle recopiée pour instagram_feed").not.toContain("instagram_feed:          c => hasMeaningfulText")
  })
})

describe("le compte, et ce qu'il laisse encore ouvert", () => {
  it("les vingt-neuf sont entrés dans la liste d'avant publication", () => {
    for (const { type } of POSES) expect(EMPTY_STATE_BLOCK_TYPES, type).toContain(type)
    expect(EMPTY_STATE_BLOCK_TYPES.length, "le balayage voit bien le produit").toBeGreaterThan(100)
  })

  it("ce qui reste est nommé, et c'est un autre travail", () => {
    // Trente et un blocs décident encore dans leur composant, sans modèle. Leur
    // éditeur ne montre pas d'état vide non plus : leur tour demande les deux,
    // pas un détecteur écrit à la main. Le cliquet vit dans la garde du lot
    // v166 (`blocQuiNePrometPasAVide.test.tsx`), qui les compte en les rendant.
    for (const sans of ["free_section", "image_text", "badge_row", "highlight_box", "brands"])
      expect(EMPTY_STATE_BLOCK_TYPES, `${sans} attend encore son modèle`).not.toContain(sans)
  })
})
