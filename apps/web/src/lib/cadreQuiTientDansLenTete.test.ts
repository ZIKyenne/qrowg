// Un cadre tient dans l'en-tête — garde de classe.
//
// Troisième lot de la passe de sécurité. Il referme la question que les deux
// précédents ont laissée ouverte, chacun en la nommant.
//
// ── L'histoire, en trois lots ───────────────────────────────────────────────
//
// **v159** : le bloc Spotify renvoyait l'adresse saisie telle quelle dès qu'elle
// contenait `open.spotify.com/embed/` n'importe où. Une adresse `javascript:`
// arrivait donc dans `<iframe src>` sur la page publiée, et s'y exécutait — sur
// notre origine. Le correctif : **on ne renvoie jamais l'entrée, on reconstruit.**
// Et la note du lot finissait par : rien ne l'arrêtait, parce que la politique
// de sécurité appliquée n'a ni `frame-src` ni `script-src`.
//
// **v160** : j'ai voulu poser ce `frame-src`, et je n'ai pas pu. `mapEmbedUrl`
// acceptait un embed sur `google.<tld>` — un test du produit garantit que
// `https://maps.google.fr/maps?…` est conservé — et une politique de sécurité de
// contenu **ne sait pas écrire `google.*`**. L'appliquer aurait cassé un
// comportement gardé. Le lot l'a dit, et a laissé la question ouverte avec son
// chemin : « reconstruire l'adresse d'un embed de carte comme le lot v159 l'a
// fait pour Spotify — ce second chemin est le même geste ».
//
// **v161**, ici. C'est ce geste, et il est minimal : seul l'hôte change, le
// chemin et la requête sont conservés au caractère près.
//
//     https://maps.google.fr/maps?q=x&output=embed
//       →  https://maps.google.com/maps?q=x&output=embed
//
// Ce qui choisit la carte est `q=` ou la charge `pb=` ; le domaine national
// n'est qu'une préférence de langue. L'ensemble des hôtes que le produit peut
// émettre devient alors **fini** — et un ensemble fini s'écrit dans un en-tête.
//
// ── Ce qui rend la directive sûre à appliquer ──────────────────────────────
//
// Une directive `frame-src` trop étroite ne se voit pas : le cadre reste vide,
// sans message, sur la page d'un client. Le danger n'est donc pas d'écrire la
// règle, c'est d'écrire une SECONDE liste à côté de celle qui filtre.
//
// Elle n'est pas recopiée. `src/lib/hotesDeCadre.mjs` porte la liste, le bloc
// « Intégration » filtre dessus, et `next.config.mjs` en fabrique l'en-tête.
// Le fichier est en ESM simple pour cette seule raison : ses deux lecteurs ne
// parlent pas le même langage.
//
// La garde ci-dessous ne lit pas la liste : elle FAIT ÉMETTRE au produit ses
// adresses de cadre, par les quatre chemins qui en produisent, et vérifie que
// l'en-tête les admet.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { frameSrc, EMBED_HOTES, CADRES_DE_PAIEMENT } from "./hotesDeCadre.mjs"
import { mapEmbedUrl, embedVideoUrl, spotifyEmbedUrl, embedHref, EMBED_HOTES as HOTES_DU_BLOC } from "@/app/dashboard/builder/types"

/** La directive, telle que le navigateur la lira. */
const DIRECTIVE = frameSrc().split(" ")

/** Le navigateur admet-il cette adresse dans un cadre ? */
function admise(url: string): boolean {
  let hote: string
  try {
    const u = new URL(url)
    if (u.protocol !== "https:") return false
    hote = u.hostname.toLowerCase()
  } catch { return false }
  return DIRECTIVE.some(source => {
    if (!source.startsWith("https://")) return false
    const motif = source.slice(8).toLowerCase()
    return motif.startsWith("*.") ? hote.endsWith(motif.slice(1)) : hote === motif
  })
}

/** Les adresses de cadre que le produit sait émettre, par ses quatre chemins. */
function adressesEmises(): { chemin: string; url: string }[] {
  const out: { chemin: string; url: string }[] = []
  const pousser = (chemin: string, url: string) => { if (url) out.push({ chemin, url }) }

  // 1. Les cartes — adresse saisie, embed personnalisé, domaine national.
  pousser("carte (adresse)", mapEmbedUrl("12 rue des Lilas, Paris"))
  for (const e of [
    "https://www.google.com/maps/embed?pb=!1m18!1m12",
    "https://maps.google.fr/maps?q=Lyon&output=embed",
    "https://www.google.de/maps/embed?pb=XYZ",
    "https://google.co.uk/maps?q=London",
    "https://maps.google.com/maps?q=Nice&output=embed",
  ]) pousser("carte (embed)", mapEmbedUrl("", e))

  // 2. Les vidéos — les trois fournisseurs, toutes leurs formes d'adresse.
  for (const v of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/abc123", "https://youtube.com/live/xyz789",
    "https://vimeo.com/123456", "https://player.vimeo.com/video/123456",
    "https://www.dailymotion.com/video/x8abcd", "https://dai.ly/x8abcd",
  ]) pousser("vidéo", embedVideoUrl(v))

  // 3. Spotify — les quatre formes reconnues.
  for (const s of [
    "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
    "https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3",
    "https://open.spotify.com/intl-fr/playlist/37i9dQZF1DXcBWIGoYBM5M",
    "spotify:episode:512ojhOuo1ktJprKbVcKyQ",
  ]) pousser("spotify", spotifyEmbedUrl(s))

  // 4. Le bloc « Intégration » — un exemple par hôte de la liste, et un
  //    sous-domaine, puisque le filtre accepte `h` comme `*.h`.
  for (const h of EMBED_HOTES) {
    pousser("intégration", embedHref(`https://${h}/exemple`))
    pousser("intégration (sous-domaine)", embedHref(`https://un.${h}/exemple`))
  }
  return out
}

describe("garde de classe : tout cadre que le produit émet tient dans l'en-tête", () => {
  it("les adresses des quatre chemins sont toutes admises", () => {
    const emises = adressesEmises()
    // Sans ce plancher, un chemin cassé rendrait la garde muette.
    expect(emises.length, "des adresses de cadre émises").toBeGreaterThan(50)
    const refusees = emises.filter(e => !admise(e.url)).map(e => `${e.chemin} → ${e.url}`)
    expect([...new Set(refusees)], "un cadre refusé par l'en-tête est un cadre vide, sans message").toEqual([])
  })

  it("le détecteur sait dire non — sinon il ne dirait jamais oui", () => {
    expect(admise("https://open.spotify.com/embed/track/1"), "un hôte de la liste").toBe(true)
    expect(admise("https://un.sous.domaine.notion.so/x"), "un sous-domaine").toBe(true)
    expect(admise("https://piege.invalide/x"), "un hôte hors liste").toBe(false)
    expect(admise("https://open.spotify.com.piege.invalide/x"), "un domaine ressemblant").toBe(false)
    expect(admise("http://open.spotify.com/embed/track/1"), "en clair").toBe(false)
    expect(admise("javascript:alert(1)"), "un schéma exécutable").toBe(false)
  })

  it("l'en-tête est FABRIQUÉ à partir de la liste qui filtre, jamais recopié", () => {
    const config = fs.readFileSync(path.join(__dirname, "..", "..", "next.config.mjs"), "utf8")
    expect(config, "la directive est appliquée").toContain("`frame-src ${frameSrc()}`")
    expect(config, "et elle vient de la liste").toContain('from "./src/lib/hotesDeCadre.mjs"')
    // Une liste d'hôtes écrite en dur dans l'en-tête, c'est la divergence promise.
    expect(config, "aucun hôte recopié dans la configuration")
      .not.toMatch(/frame-src[^`\n]*https:\/\/(?:open\.spotify|youtube|maps\.google)/)
    // …et le bloc « Intégration » filtre sur la MÊME liste.
    expect(HOTES_DU_BLOC, "une seule liste pour les deux").toEqual(EMBED_HOTES)
    const t = fs.readFileSync(path.join(__dirname, "..", "app", "dashboard", "builder", "types.ts"), "utf8")
    expect(t, "types.ts la prend là, il ne la réécrit pas").toContain('from "@/lib/hotesDeCadre.mjs"')
    expect(t, "…et ne la redéclare pas").not.toMatch(/const EMBED_HOTES\s*[:=]/)
  })

  it("exécuté : l'en-tête que la configuration produit vraiment", async () => {
    // Lire le fichier dit ce qui est écrit ; l'exécuter dit ce qui PART. Une
    // directive peut être écrite et ne jamais être servie — la configuration
    // est du code, pas une déclaration.
    const config = (await import("../../next.config.mjs")).default as {
      headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]>
    }
    const regles = await config.headers()
    expect(regles.some(r => r.source === "/:path*"), "appliquée à toutes les réponses").toBe(true)
    const csp = regles.flatMap(r => r.headers).find(h => h.key === "Content-Security-Policy")
    expect(csp, "la politique est bien envoyée").toBeTruthy()
    const directive = csp!.value.split("; ").find(d => d.startsWith("frame-src "))
    expect(directive, "et elle borne les cadres").toBeTruthy()
    // La directive servie est EXACTEMENT celle que la liste fabrique.
    expect(directive).toBe(`frame-src ${frameSrc()}`)
    // …et elle admet bien ce que le produit émet, jusque dans l'en-tête servi.
    for (const { url } of adressesEmises().slice(0, 12))
      expect(directive!.includes(new URL(url).hostname) || directive!.includes(`*.${new URL(url).hostname.split(".").slice(1).join(".")}`), url).toBe(true)
  })

  it("le cadre de paiement est admis, même s'il ne sert pas encore", () => {
    // Un champ de carte ne doit jamais être ce qu'un en-tête de sécurité casse.
    for (const h of CADRES_DE_PAIEMENT) expect(admise(`https://${h}/v3/x`), h).toBe(true)
  })
})

describe("les cartes : l'hôte est ramené à .com, le reste ne bouge pas", () => {
  it("un domaine national devient .com, au caractère près pour le reste", () => {
    for (const [entree, attendu] of [
      ["https://maps.google.fr/maps?q=x&output=embed", "https://maps.google.com/maps?q=x&output=embed"],
      ["https://www.google.de/maps/embed?pb=!1m18!1m12", "https://www.google.com/maps/embed?pb=!1m18!1m12"],
      ["https://google.co.uk/maps?q=London&z=12", "https://google.com/maps?q=London&z=12"],
      // Déjà en .com : rien ne change, et surtout pas deux fois.
      ["https://www.google.com/maps/embed?pb=XYZ", "https://www.google.com/maps/embed?pb=XYZ"],
      ["https://maps.google.com/maps?q=Nice&output=embed", "https://maps.google.com/maps?q=Nice&output=embed"],
    ] as const) expect(mapEmbedUrl("", entree), entree).toBe(attendu)
  })

  it("…et ce qui n'est pas une carte Google est toujours refusé", () => {
    for (const mauvaise of [
      "https://google.com.piege.invalide/maps", "https://piege.invalide/maps",
      "javascript:alert(1)//google.com/maps", "http://maps.google.com/maps?q=x",
      "https://notgoogle.fr/maps",
    ]) expect(mapEmbedUrl("", mauvaise), mauvaise).toBe("")
    // Le repli sur l'adresse marche toujours quand l'embed est refusé.
    expect(mapEmbedUrl("Lyon", "https://piege.invalide/x")).toBe("https://maps.google.com/maps?q=Lyon&z=15&output=embed")
  })

  it("l'ensemble des hôtes de carte est FINI — c'est ce qui débloque l'en-tête", () => {
    const hotes = new Set<string>()
    for (const tld of ["fr", "de", "co.uk", "com", "be", "ch", "ca", "com.au"])
      for (const prefixe of ["", "www.", "maps."]) {
        const u = mapEmbedUrl("", `https://${prefixe}google.${tld}/maps?q=x`)
        if (u) hotes.add(new URL(u).hostname)
      }
    expect([...hotes].sort(), "trois hôtes, et pas un de plus")
      .toEqual(["google.com", "maps.google.com", "www.google.com"])
    for (const h of hotes) expect(admise(`https://${h}/maps`), h).toBe(true)
  })
})
