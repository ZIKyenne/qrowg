// Le détecteur appelle ce qu'il reflète, il ne le recopie plus — garde de classe.
//
// Fin d'une série. `blockEmptyState.ts` promet, depuis sa première ligne,
// d'être « le miroir EXACT du filtre public » :
//
//     hasPublishableContent === false  ⟺  le bloc rend `null` en ligne
//
// Trois lots ont vérifié cette promesse de trois façons, et chacun a trouvé
// qu'elle était fausse quelque part :
//
//   v151   sur le CADRE — le détecteur balayait cinquante emplacements quand le
//          rendu s'arrêtait à trois.
//   v152   sur la QUESTION — il demandait « y a-t-il du texte ? » quand la page
//          demandait « est-ce un numéro, une adresse, un lien Spotify ? ».
//          Vingt désaccords, sur cinq cent soixante-douze sondes.
//   v153   sur la SOURCE — onze modèles publics demandaient leur visibilité au
//          détecteur de l'éditeur. Le miroir servait de source.
//
// Trois relevés, une seule cause : **une copie qu'on relit est une copie qui
// dérive.** Le cercle coupé au lot v153, le détecteur peut enfin appeler ce
// qu'il reflète — et trente-cinq règles recopiées deviennent trente-cinq
// appels. Ce n'est plus un miroir : c'est la même vitre.
//
// ── Ce que l'inversion a révélé, et qui n'était visible que comme ça ─────────
//
// En remplaçant les copies par des appels, **quinze blocs se sont mis à
// accepter une ligne d'espaces.** Leur modèle, lui, n'avait jamais nettoyé :
//
//     if (!cc[`a${i}_title`]) return null        discography, concerts,
//                                                favorite_links, product_catalog
//     visible: !!(c.title || c.amount1)          gift_card, pdf_viewer,
//                                                album_block, before_after…
//
// La copie les rattrapait **en silence**, parce qu'elle, elle nettoyait. Le
// défaut était réel depuis toujours — une carte cadeau titrée « ␣␣␣ » se
// publiait — et il ne pouvait apparaître qu'en retirant le rattrapage. Le lot
// v153 avait trouvé quinze filtres du même genre ; son balayage n'en voyait
// qu'une forme sur trois. Les deux autres sont dans sa garde maintenant.
//
// La classe : **le détecteur appelle ce qu'il reflète.**

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "./blockEmptyState"
import { favoriteLinksViewModel } from "./shared-renderer/models/favoriteLinks"
import { productCatalogViewModel } from "./shared-renderer/models/productCatalog"
import { beforeAfterViewModel } from "./shared-renderer/models/beforeAfter"

const SRC = fs.readFileSync(path.join(__dirname, "blockEmptyState.ts"), "utf8")

/** Une entrée du tableau des détecteurs : `type: c => …`. */
function detecteurs(): { type: string; corps: string }[] {
  const lignes = SRC.split("\n")
  const out: { type: string; corps: string }[] = []
  for (let i = 0; i < lignes.length; i++) {
    const m = /^ {2}([a-z0-9_]+):\s+(c => .*)$/.exec(lignes[i])
    if (!m) continue
    let corps = m[2]
    for (let j = i + 1; j < lignes.length && /^\s{20,}/.test(lignes[j]); j++) corps += " " + lignes[j].trim()
    out.push({ type: m[1], corps })
  }
  return out
}

/** Un détecteur qui APPELLE : son corps n'est qu'un appel de modèle. */
const APPEL = /^c => \w+ViewModel\(c\)(\.link)?\.visible,?$/

describe("garde de classe : ce qui a un modèle est appelé, pas recopié", () => {
  it("trente-cinq détecteurs sont devenus des appels", () => {
    const appels = detecteurs().filter(d => APPEL.test(d.corps.trim()))
    expect(appels.length, "des détecteurs qui appellent leur modèle").toBeGreaterThanOrEqual(35)
    // Et chacun appelle le modèle de SON bloc, pas d'un autre.
    for (const d of appels) {
      const fn = /(\w+)ViewModel/.exec(d.corps)![1]
      const attendu = d.type.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      expect(fn.toLowerCase(), `${d.type} appelle ${fn}ViewModel`).toContain(attendu.toLowerCase().slice(0, 5))
    }
  })

  it("le détecteur sait dire oui — sinon il ne dirait jamais non", () => {
    expect(APPEL.test("c => merchViewModel(c).visible,")).toBe(true)
    expect(APPEL.test("c => donationViewModel(c).link.visible,")).toBe(true)
    // Une règle recopiée n'est pas un appel.
    expect(APPEL.test('c => hasMeaningfulText(c.title) || hasMeaningfulText(c.amount1),')).toBe(false)
    expect(APPEL.test('c => anyIndexed(c, "values", i => c[`v${i}_label`]),')).toBe(false)
  })

  it("plus aucun de ces trente-cinq blocs ne recopie une règle que son modèle porte", () => {
    const appels = new Set(detecteurs().filter(d => APPEL.test(d.corps.trim())).map(d => d.type))
    for (const t of ["merch", "values", "testimonials", "lineup", "gift_card", "pdf_viewer",
      "album_block", "podcast_links", "event_ticketing", "spotify_embed", "video",
      "whatsapp_button", "email_button", "heading", "menu_tabs", "timeline"])
      expect(appels, t).toContain(t)
  })

  it("ce qui reste recopié n'a pas de modèle à appeler", () => {
    // `call_button` et `directions_button` vivent encore dans `renduLegacy` :
    // il n'y a rien à appeler, la règle reste donc écrite ici — avec la
    // fonction du produit, ce qui est déjà l'essentiel (lot v152).
    expect(SRC).toContain("call_button:             c => !!telLink(c.phone),")
    expect(fs.existsSync(path.join(__dirname, "shared-renderer", "models", "callButton.ts")),
      "s'il avait un modèle, il faudrait l'appeler").toBe(false)
  })
})

describe("exécuté : une ligne d'espaces ne publie rien, et l'éditeur le dit", () => {
  /** Les quinze blocs dont le modèle ne nettoyait pas, révélés par l'inversion. */
  const REVELES: [string, string][] = [
    ["discography", "a1_title"], ["concerts", "c1_city"], ["gift_card", "title"],
    ["pdf_viewer", "title"], ["album_block", "title"], ["podcast_links", "podcast_name"],
    ["event_ticketing", "event_name"], ["google_maps_embed", "address"],
    ["menu_section", "category"], ["timeline", "e1_title"], ["heading", "text"],
    ["menu_tabs", "sec1_title"],
  ]

  /**
   * Trois de plus dont le modèle ne nettoyait pas — mais qui n'ont pas encore de
   * détecteur : `hasPublishableContent` leur répond « oui » par défaut. Leur
   * page, elle, ne publie plus une ligne d'espaces. Ils restaient dans le cliquet
   * des blocs qui disparaissent sans que l'éditeur le dise — le lot v166 les en
   * a sortis : ils ont leur détecteur, et l'éditeur montre leur état vide.
   */
  const SANS_DETECTEUR: [string, () => boolean][] = [
    ["favorite_links", () => favoriteLinksViewModel({ link_1_label: "   " }).items.length === 0],
    ["product_catalog", () => productCatalogViewModel({ p1_name: "   " }).items.length === 0],
    ["before_after", () => !beforeAfterViewModel({ before_img: "   " }).visible],
  ]

  it("les trois d'alors ont reçu leur détecteur, et leur page refuse toujours les espaces", () => {
    // Réancré au lot v166. Ce test disait « attend encore son détecteur » : les
    // trois l'ont reçu, et l'éditeur dit maintenant pourquoi le bloc disparaît.
    // Ce qui ne devait pas bouger — leur PAGE refuse une ligne d'espaces — est
    // toujours vérifié, et c'est cela que le test protégeait vraiment.
    for (const [nom, verifie] of SANS_DETECTEUR) expect(verifie(), nom).toBe(true)
    for (const [nom] of SANS_DETECTEUR) {
      expect(EMPTY_STATE_BLOCK_TYPES, `${nom} a son détecteur depuis le lot v166`).toContain(nom)
      expect(hasPublishableContent(nom, {}), `${nom} à vide`).toBe(false)
    }
  })

  it("les douze qui ont un détecteur refusent des espaces seuls", () => {
    const fautifs = REVELES.filter(([t, k]) => hasPublishableContent(t, { [k]: "   " }))
      .map(([t, k]) => `${t}.${k}`)
    expect(fautifs, "le modèle doit nettoyer, la copie ne le rattrape plus").toEqual([])
  })

  it("…et acceptent toujours une vraie valeur", () => {
    for (const [t, k] of REVELES)
      expect(hasPublishableContent(t, { [k]: "Wi-Fi" }), `${t}.${k}`).toBe(true)
  })

  it("le balayage voit bien les détecteurs — sinon il ne prouve rien", () => {
    expect(detecteurs().length, "des détecteurs dans le produit").toBeGreaterThan(70)
    expect(EMPTY_STATE_BLOCK_TYPES.length).toBe(detecteurs().length)
    // Les trois arrivés à ce lot : leur adapter éditeur savait déjà dire
    // « invisible en ligne », il ne leur manquait que le détecteur.
    for (const t of ["heading", "menu_tabs", "timeline"]) {
      expect(EMPTY_STATE_BLOCK_TYPES, t).toContain(t)
      expect(hasPublishableContent(t, {}), `${t} à vide`).toBe(false)
    }
  })
})
