// Une adresse passe par la porte, ou elle n'arrive pas — garde de classe.
//
// Relevé du 21 septembre, sur la page publiée. Le produit a un contrat d'adresse
// écrit à trois endroits, et chacun écrit sa raison :
//
//   embedVideoUrl   « Frontière d'hôte (début / `//` du schéma / sous-domaine
//                     `.`) : refuse les domaines ressemblants… » et « aucun repli
//                     sur l'URL brute — une URL non reconnue ne doit JAMAIS
//                     atteindre un iframe.src »
//   mapEmbedUrl     « un embed personnalisé n'est accepté QUE s'il provient d'un
//                     domaine Google Maps… faux domaine google.com.evil.com »
//   safeMediaSrc    « neutralise les schémas exécutables/dangereux (javascript:,
//                     vbscript:, file:, data: non-image) »
//
// Deux endroits ne le respectaient pas. Les deux ont été trouvés en RENDANT les
// cent quarante-six blocs publics avec des adresses hostiles — pas en lisant le
// code, qui promettait le contraire de ce qu'il faisait.
//
// ── 1. Le bloc Spotify : une faille ouverte ─────────────────────────────────
//
//     if (/open\.spotify\.com\/embed\//i.test(u)) return u
//
// Pas d'ancrage — la chaîne était cherchée N'IMPORTE OÙ — et un repli sur
// l'entrée brute. Trois adresses, vérifiées en rendant le bloc :
//
//     javascript:alert(document.domain)//open.spotify.com/embed/
//     data:text/html,<script>…</script>#open.spotify.com/embed/
//     https://evil.example/piege?x=open.spotify.com/embed/
//
// ressortaient telles quelles dans `<iframe src>` sur la page publiée. Un
// `<iframe src="javascript:…">` s'exécute sur l'origine de la page : n'importe
// quel compte gratuit pouvait exécuter du script sur qrowg.com, chez tout
// visiteur qui scanne le QR code du commerçant. La CSP appliquée n'a ni
// `frame-src` ni `script-src` — la version stricte est en Report-Only, elle
// n'interdit rien. Rien ne l'arrêtait.
//
// Et le modèle du bloc PROMETTAIT déjà l'inverse, en tête de fichier : « aucun
// repli sur URL arbitraire », « aucune iframe arbitraire possible ». Le
// commentaire disait vrai de l'intention, faux du code, trois lignes plus bas.
//
// ── 2. La galerie : le contrat contourné, sans faille ouverte ───────────────
//
// `gallery` prend le texte brut de ses champs photo. Toutes les autres images du
// produit passent par `sharedImageModel` → `safeMediaSrc` ; celle dont le
// contenu EST des images, non. Une galerie publiait donc
// `<img src="javascript:…">`. Un `<img>` n'exécute plus ces schémas dans un
// navigateur d'aujourd'hui : ce n'était **pas** une faille ouverte, et je ne la
// compte pas comme telle. C'était la seule brèche du contrat, et une brèche
// n'attend qu'un autre usage de la même valeur.
//
// ── La classe ───────────────────────────────────────────────────────────────
//
// **Une adresse passe par la porte du produit, ou elle n'arrive pas.** Deux
// règles, et la garde ci-dessous les vérifie en RENDANT les blocs :
//
//   partout   un schéma exécutable n'atteint aucun attribut d'adresse ;
//   iframe    en plus, l'hôte est sur la liste — un cadre s'exécute chez nous.
//
// Un lien vers n'importe quel site reste légitime : un commerçant renvoie vers
// sa boutique. Ce qui ne l'est pas, c'est un schéma exécutable, et un cadre
// arbitraire.

import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement, type ComponentType } from "react"
import fs from "node:fs"
import path from "node:path"
import { spotifyEmbedUrl, embedVideoUrl, mapEmbedUrl } from "../types"
import { spotifyEmbedViewModel } from "./models/spotifyEmbed"
import { galerie } from "./models/horairesGalerieReseaux"

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
const ctx = { theme, G: "#C9A84C", TEXT: "#F5F0E8", MUTED: "#A8A190", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {}, titrePrincipal: true }

/** Cinq adresses hostiles : schémas exécutables, et hôtes ressemblants. */
const PIEGES = [
  "javascript:alert(document.domain)//open.spotify.com/embed/track/1",
  "data:text/html,<script>alert(1)</script>#youtube.com/embed/",
  "https://piege.invalide/x?a=open.spotify.com/embed/&b=youtube.com/embed/&c=google.com/maps/",
  "vbscript:msgbox(1)",
  "https://open.spotify.com.piege.invalide/embed/track/1",
]

/** Tous les noms de champ qui, dans ce produit, portent une adresse. */
function champsUrl(): string[] {
  const out = new Set<string>()
  for (const f of ["blockDefs.ts", "types.ts"]) {
    const p = path.join(RACINE, "..", f)
    if (!fs.existsSync(p)) continue
    for (const m of fs.readFileSync(p, "utf8").matchAll(/key:\s*"([a-z0-9_]*(?:url|link|src|href|embed|cover|img|image|photo|video|audio|avatar|logo|plan)[a-z0-9_]*)"/gi))
      out.add(m[1])
  }
  return [...out]
}

function contenu(piege: string): Record<string, unknown> {
  const c: Record<string, unknown> = { title: "T", text: "x", name: "N" }
  for (const k of champsUrl()) c[k] = piege
  for (let i = 1; i <= 4; i++)
    for (const p of ["p", "a", "w", "l", "i", "s", "img", "image", "video", "link"]) {
      c[`${p}${i}_url`] = piege; c[`${p}${i}_img`] = piege; c[`${p}${i}_image`] = piege
      c[`${p}${i}_link`] = piege; c[`${p}${i}_cover`] = piege; c[`${p}${i}_src`] = piege
      c[`${p}_${i}`] = piege; c[`${p}${i}`] = piege
    }
  return c
}

const SCHEMA = /^([a-z][a-z0-9+.-]*):/i
const SCHEMAS_ADMIS = /^(https?|mailto|tel|sms)$/i
const DATA_ADMIS = /^data:(image|audio|video|text\/(vcard|calendar))/i

/** Le verdict sur UN attribut d'adresse rendu. `null` = rien à redire. */
export function verdict(balise: string, valeur: string): string | null {
  const v = valeur.replace(/&amp;/g, "&")
  const s = SCHEMA.exec(v)
  if (s && !SCHEMAS_ADMIS.test(s[1]) && !DATA_ADMIS.test(v)) return "schéma exécutable"
  // Un cadre s'exécute sur NOTRE origine : son hôte doit être sur la liste.
  if (balise.toLowerCase() === "iframe" && v.includes("piege.invalide")) return "cadre hors liste"
  return null
}

const ADRESSES = /<(iframe|img|a|audio|video|source|embed|object)\b[^>]*?\s(src|href|data|poster)="([^"]*)"/gi

describe("garde de classe : une adresse hostile n'atteint aucun attribut de la page publiée", () => {
  it("cent quarante-six blocs, rendus avec cinq adresses hostiles", async () => {
    const abouties: string[] = []
    let blocs = 0, attributs = 0
    for (const [type, [chemin, nom]] of Object.entries(adaptersPublics())) {
      const mod = (await import(/* @vite-ignore */ `./blocks/${chemin}`)) as Record<string, ComponentType<never>>
      const C = mod[nom]
      if (!C) continue
      blocs++
      for (const piege of PIEGES) {
        let html = ""
        try { html = renderToStaticMarkup(createElement(C as never, { content: contenu(piege), ctx } as never)) } catch { continue }
        for (const m of html.matchAll(ADRESSES)) {
          attributs++
          const faute = verdict(m[1], m[3])
          if (faute) abouties.push(`${type} : ${faute} — <${m[1]} ${m[2]}="${m[3].slice(0, 56)}">`)
        }
      }
    }
    // Sans ces deux planchers, un registre cassé rendrait la garde muette.
    expect(blocs, "des blocs publics rendus").toBeGreaterThan(140)
    expect(attributs, "des attributs d'adresse examinés").toBeGreaterThan(250)
    expect([...new Set(abouties)], "une adresse passe par la porte, ou elle n'arrive pas").toEqual([])
  }, 120_000)

  it("le verdict sait dire oui — sinon il ne dirait jamais non", () => {
    // Les formes d'avant, celles qui aboutissaient réellement.
    expect(verdict("iframe", "javascript:alert(1)//open.spotify.com/embed/"), "le cadre exécutable").toBe("schéma exécutable")
    expect(verdict("img", "javascript:alert(1)"), "l'image exécutable").toBe("schéma exécutable")
    expect(verdict("img", "vbscript:msgbox(1)")).toBe("schéma exécutable")
    expect(verdict("img", "data:text/html,&lt;script&gt;")).toBe("schéma exécutable")
    expect(verdict("iframe", "https://piege.invalide/x"), "le cadre hors liste").toBe("cadre hors liste")
    // …et ce qui est légitime passe : un commerçant renvoie où il veut.
    expect(verdict("a", "https://piege.invalide/ma-boutique"), "un lien marchand").toBeNull()
    expect(verdict("a", "tel:+33123456789")).toBeNull()
    expect(verdict("a", "mailto:x@y.fr")).toBeNull()
    expect(verdict("img", "data:image/png;base64,iVBOR")).toBeNull()
    expect(verdict("a", "data:text/vcard;charset=utf-8,BEGIN")).toBeNull()
    expect(verdict("iframe", "https://open.spotify.com/embed/track/1?theme=0")).toBeNull()
    expect(verdict("img", "/local.png")).toBeNull()
  })
})

describe("la porte elle-même : les trois constructeurs d'adresse", () => {
  /** Ce qu'un hostile essaie, pour chacun. */
  const HOSTILES = [
    "javascript:alert(1)//open.spotify.com/embed/track/1",
    "javascript:alert(1)//youtube.com/embed/abc",
    "data:text/html,<script>alert(1)</script>#open.spotify.com/embed/",
    "https://piege.invalide/?x=open.spotify.com/embed/track/1",
    "https://piege.invalide/?x=youtube.com/watch?v=abc",
    "https://open.spotify.com.piege.invalide/embed/track/1",
    "https://youtube.com.piege.invalide/embed/abc",
    "https://google.com.piege.invalide/maps/x",
    "vbscript:msgbox(1)",
  ]

  it("aucun ne renvoie jamais son entrée, ni un hôte hors liste", () => {
    for (const h of HOSTILES) {
      for (const [nom, sortie] of [
        ["spotifyEmbedUrl", spotifyEmbedUrl(h)],
        ["embedVideoUrl", embedVideoUrl(h)],
        ["mapEmbedUrl", mapEmbedUrl("", h)],
      ] as const) {
        expect(sortie, `${nom}(${h.slice(0, 40)}) ne renvoie pas son entrée`).not.toBe(h)
        if (sortie) expect(sortie, `${nom} : hôte hors liste`).not.toContain("piege.invalide")
        if (sortie) expect(/^https:\/\//.test(sortie), `${nom} : ${sortie.slice(0, 40)}`).toBe(true)
      }
    }
  })

  it("et les adresses légitimes marchent toujours — un correctif qui casse n'en est pas un", () => {
    const ID = "6rqhFgbbKwnb9MLmUQDhG6"
    for (const [entree, attendu] of [
      [`https://open.spotify.com/embed/track/${ID}?utm_source=generator`, `https://open.spotify.com/embed/track/${ID}?utm_source=generator&theme=0`],
      [`https://open.spotify.com/track/${ID}`, `https://open.spotify.com/embed/track/${ID}?utm_source=generator&theme=0`],
      [`https://open.spotify.com/intl-fr/album/${ID}?si=x`, `https://open.spotify.com/embed/album/${ID}?utm_source=generator&theme=0`],
      [`open.spotify.com/playlist/${ID}`, `https://open.spotify.com/embed/playlist/${ID}?utm_source=generator&theme=0`],
      [`spotify:track:${ID}`, `https://open.spotify.com/embed/track/${ID}?utm_source=generator&theme=0`],
      // Réparé au passage : un embed servi en clair repart en https.
      [`http://open.spotify.com/embed/album/${ID}`, `https://open.spotify.com/embed/album/${ID}?utm_source=generator&theme=0`],
    ] as const) expect(spotifyEmbedUrl(entree), entree).toBe(attendu)
    // Le thème, seul réglage visible d'un embed, est conservé.
    expect(spotifyEmbedUrl(`https://open.spotify.com/embed/track/${ID}?theme=1`)).toContain("theme=1")
    // La vidéo et la carte, elles, marchaient déjà — et marchent toujours.
    expect(embedVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")
    expect(mapEmbedUrl("", "https://www.google.com/maps/embed?pb=1")).toBe("https://www.google.com/maps/embed?pb=1")
    expect(mapEmbedUrl("12 rue des Lilas, Paris")).toContain("https://maps.google.com/maps?q=")
  })

  it("la frontière d'hôte n'est plus une sécurité — c'est une JUSTESSE, et elle tient", () => {
    // Vérifié par mutation : si l'on retire la frontière d'hôte, rien de
    // dangereux ne sort — la reconstruction suffit. Elle ne protège donc plus.
    // Ce qu'elle fait encore, et qui compte : empêcher qu'un lien vers un AUTRE
    // site, qui mentionne Spotify en passant, devienne un lecteur Spotify. Le
    // commerçant collerait l'adresse de sa boutique et verrait un morceau de
    // musique s'afficher. C'est ce défaut-là que ce test attrape.
    for (const etranger of [
      "https://ma-boutique.fr/playlist?ref=open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
      "https://blog.exemple.fr/article/open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3",
      "https://open.spotify.com.autre-site.fr/track/6rqhFgbbKwnb9MLmUQDhG6",
    ]) expect(spotifyEmbedUrl(etranger), `« ${etranger.slice(0, 46)} » n'est pas un lien Spotify`).toBe("")
    // La même frontière, sur les deux voisines qui l'avaient déjà.
    expect(embedVideoUrl("https://ma-boutique.fr/x?ref=youtube.com/watch?v=dQw4w9WgXcQ")).toBe("")
    expect(mapEmbedUrl("", "https://ma-boutique.fr/x?ref=google.com/maps/")).toBe("")
  })

  it("ce qui sort est une adresse canonique du fournisseur, ou rien", () => {
    // J'ai écrit ce test en attendant « invisible » pour une entrée commençant
    // par `javascript:` — et il a échoué. Le code avait raison, pas moi.
    //
    // La frontière d'hôte admet `//` : c'est ce qui reconnaît `https://…`. Une
    // entrée comme `javascript:alert(1)//open.spotify.com/embed/track/1` la
    // franchit donc — et ressort en `https://open.spotify.com/embed/track/1`,
    // parce que rien de l'entrée ne survit : le type vient d'une liste fermée,
    // l'identifiant est `[a-zA-Z0-9]+`, l'hôte est écrit en dur.
    //
    // L'invariant juste n'est donc pas « une entrée hostile ne donne rien »,
    // c'est **« ce qui sort est canonique, ou rien »** — et il est plus fort :
    // il ne dépend pas de la liste des hostiles auxquels j'ai pensé.
    const CANONIQUE = /^https:\/\/open\.spotify\.com\/embed\/(track|album|playlist|artist|episode|show)\/[a-zA-Z0-9]+\?utm_source=generator&theme=[01]$/
    for (const entree of [...HOSTILES, "n'importe quoi", "", "https://open.spotify.com/track/abc123"]) {
      const m = spotifyEmbedViewModel({ url: entree })
      if (m.src !== null) expect(m.src, `sortie pour « ${entree.slice(0, 40)} »`).toMatch(CANONIQUE)
      expect(m.visible, "visible ⟺ une src").toBe(m.src !== null)
    }
    // Et la seconde garde est bien là, écrite : même forme que `providerOf`
    // (models/embed.ts). Une promesse tenue par une seule fonction tient à
    // cette fonction — celle-ci en a deux.
    const src = fs.readFileSync(path.join(RACINE, "models", "spotifyEmbed.ts"), "utf8")
    expect(src, "l'ancre est écrite").toContain("/^https:\\/\\/open\\.spotify\\.com\\/embed\\/")
    expect(spotifyEmbedViewModel({ url: 42 as never }).src, "et une valeur qui n'est pas du texte").toBeNull()
  })

  it("la galerie passe par le contrat de média, comme toutes les autres images", () => {
    const g = galerie({ img1: "javascript:alert(1)", img2: "https://x.supabase.co/a.png", img3: "data:text/html,<script>" })
    expect(g!.photos.map(p => p.src), "une photo refusée disparaît, comme une photo vide")
      .toEqual(["https://x.supabase.co/a.png"])
    // …et la légende suit toujours SA photo (la raison écrite dans le modèle).
    const h = galerie({ img1: "javascript:alert(1)", img1_alt: "piégée", img2: "/ok.png", img2_alt: "la bonne" })
    expect(h!.photos).toEqual([{ src: "/ok.png", legende: "la bonne" }])
  })
})
