// signatureQuiSeCompte — lot v180.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// La page publique compte TOUT ce que le commerçant y met : vingt-cinq écrans
// appellent `trackLinkClick`, les impressions de blocs, la profondeur de
// défilement, le temps d'attention, les taps avec leur position. C'est
// l'instrumentation la plus complète du produit.
//
// Et le seul élément que le produit ajoute LUI-MÊME à cette page — le bouton
// « Créez votre page + QR code gratuitement », posé en pied de page sur les
// comptes gratuits — n'était compté nulle part. Il porte pourtant la seule
// distribution que le produit possède : une page scannée dans un restaurant
// montre QRowg à des gens qui n'en avaient jamais entendu parler.
//
// La règle : **ce que le produit ajoute à la page d'un commerçant, il le
// compte.** C'est la suite du lot v156, qui avait posé l'autre moitié — ce qui
// n'est pas le contenu du commerçant se DIT.
//
// ── Les deux choses que cette garde tient ──────────────────────────────────
//
// 1. Tout lien vers une adresse écrite EN DUR dans les rendus publics (donc
//    posé par le produit, pas saisi par le commerçant) porte un comptage. Le
//    relevé est fait dans les fichiers de rendu, pas recopié ici.
// 2. Le type d'événement est la MÊME constante côté client et côté route. Une
//    liste blanche recopiée finirait par diverger, et la route jetterait la
//    ligne en répondant `ok` — une mesure qui disparaît sans un bruit. C'est la
//    leçon du lot v170, appliquée à une frontière client/serveur.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { KIND_SIGNATURE, ADRESSE_SIGNATURE, REF_PIED_DE_PAGE } from "./signatureQrowg"

const SRC = path.resolve(__dirname, "..")
const lire = (r: string) => fs.readFileSync(path.join(SRC, r), "utf8")

/** Les fichiers qui dessinent une page publique. */
const RENDUS = ["app/[slug]/PublicPageClient.tsx", "app/[slug]/renduLegacy.tsx"]

const COMPTAGE = /(trackLinkClick|trackSignature|queueTap|trackDwell)\s*\(/

/**
 * Tout élément de lien dont l'adresse est une CHAÎNE ÉCRITE EN DUR, ou une
 * constante de module en majuscules : dans les deux cas, c'est le produit qui
 * l'a décidée, pas le commerçant. Les `href={c.url}` et consorts viennent du
 * contenu et sont couverts ailleurs (lot v168 pour leur validité, v104 pour
 * leur comptage).
 */
/**
 * Où finissent les attributs d'une balise ouvrante.
 *
 * Premier essai : « jusqu'au premier `>` ». Il tombait sur celui de `() =>` —
 * la balise se terminait donc AVANT l'attribut `onClick`, et la garde
 * annonçait un lien non compté alors qu'il l'était. Un `>` précédé de `=` est
 * une flèche, pas une fermeture.
 */
function finDeBalise(src: string, depuis: number): number {
  for (let i = depuis; i < src.length; i++) {
    if (src[i] !== ">") continue
    if (src[i - 1] === "=") continue           // `=>` : une flèche
    return i
  }
  return src.length
}

export function liensPosesParLeProduit() {
  const trouves: { fichier: string; ligne: number; extrait: string; compte: boolean }[] = []
  for (const f of RENDUS) {
    const src = lire(f)
    const re = /<(?:a|LienPublic)\s+href=(?:"(https?:\/\/[^"]+)"|\{(ADRESSE_[A-Z_]+)\})/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      const balise = src.slice(m.index, finDeBalise(src, m.index) + 1)
      trouves.push({
        fichier: f,
        ligne: src.slice(0, m.index).split("\n").length,
        extrait: (m[1] || m[2] || "").slice(0, 70),
        compte: COMPTAGE.test(balise),
      })
    }
  }
  return trouves
}

describe("ce que le produit ajoute à la page du commerçant, il le compte", () => {
  it("le relevé trouve la signature (sinon la garde est aveugle)", () => {
    const l = liensPosesParLeProduit()
    expect(l.length, "aucun lien posé par le produit n'est vu — l'extraction ne lit plus le rendu").toBeGreaterThan(0)
    expect(l.some(x => x.extrait.startsWith("ADRESSE_") || x.extrait.includes("qrowg.com"))).toBe(true)
  })

  it("chacun de ces liens porte un comptage", () => {
    expect(
      liensPosesParLeProduit().filter(x => !x.compte).map(x => `${x.fichier}:${x.ligne} → ${x.extrait}`),
      "le produit pose un lien sur la page d'un commerçant sans compter le clic",
    ).toEqual([])
  })

  it("le clic part tout de suite, pas dans une file", () => {
    // Le visiteur quitte la page dans la milliseconde : un envoi groupé à quatre
    // secondes ne partirait jamais. `trackSignature` doit appeler `post`
    // directement, comme `trackDwell`, et non `buffer.push`.
    const src = lire("lib/trackEngagement.ts")
    const corps = src.slice(src.indexOf("export function trackSignature"))
    const fin = corps.indexOf("\n}")
    const fonction = corps.slice(0, fin)
    expect(fonction).toContain("post(pageId")
    expect(fonction, "la signature passe par la file : le clic serait perdu au départ du visiteur").not.toContain("buffer.push")
    // `keepalive` est ce qui laisse la requête finir après la navigation.
    expect(src).toContain("keepalive: true")
  })

  // ── La frontière client / serveur ────────────────────────────────────────

  it("la route accepte exactement le type que le client envoie", () => {
    const route = lire("app/api/track/route.ts")
    const m = route.match(/const EVENT_KINDS = new Set\(\[([^\]]+)\]\)/)
    expect(m, "EVENT_KINDS introuvable — la garde ne lit plus la route").not.toBeNull()
    // La route doit citer la CONSTANTE, pas une chaîne recopiée.
    expect(m![1], "la route recopie le type au lieu de lire la constante partagée").toContain("KIND_SIGNATURE")
    expect(route).toContain('from "@/lib/signatureQrowg"')
  })

  it("le type reste une valeur que la colonne accepte", () => {
    // `page_events.kind` est du texte, filtré par la liste blanche. Un type
    // avec une espace ou une casse fantaisiste passerait la liste et rendrait
    // les relevés SQL fragiles.
    expect(KIND_SIGNATURE).toMatch(/^[a-z_]{3,20}$/)
    expect(REF_PIED_DE_PAGE).toMatch(/^[a-z_]{3,20}$/)
  })

  it("l'adresse de la signature garde ses paramètres de source", () => {
    // Les UTM mesurent l'ARRIVÉE sur qrowg.com ; le comptage mesure le DÉPART.
    // Les deux ensemble disent ce qui se perd entre les deux — perdre les UTM
    // reviendrait à ne plus pouvoir rapprocher les deux chiffres.
    expect(ADRESSE_SIGNATURE).toContain("utm_source=badge")
    expect(ADRESSE_SIGNATURE).toContain("utm_medium=public_page")
    expect(ADRESSE_SIGNATURE.startsWith("https://qrowg.com/")).toBe(true)
  })

  // ── Contre-épreuve ──────────────────────────────────────────────────────

  it("un lien posé par le produit et non compté serait vu", () => {
    const faux = [
      { fichier: "faux", ligne: 1, extrait: "https://exemple.fr", compte: false },
      ...liensPosesParLeProduit(),
    ]
    expect(faux.filter(x => !x.compte).length).toBeGreaterThan(0)
  })
})
