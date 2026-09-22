// Une politique qui s'applique — garde de classe.
//
// Quatrième lot de la passe de sécurité, et celui qui ferme la boucle ouverte au
// lot v159 : « rien ne l'arrêtait, la politique appliquée n'ayant ni `frame-src`
// ni `script-src` ». Les cadres ont été bornés au lot v161. Le reste l'est ici.
//
// ── Mesuré AVANT d'écrire la règle ─────────────────────────────────────────
//
// Douze pages du produit construit, chargées dans un vrai navigateur :
// **cinq cent quarante-deux requêtes, toutes en même origine.** Scripts,
// récupérations, polices, feuilles de style — rien qui vienne d'ailleurs. Il n'y
// avait donc rien à autoriser au-delà de `'self'`, et une politique qui
// n'autorise que ce que le produit demande n'a rien à casser. Rechargées sous la
// nouvelle politique : **aucune violation appliquée**.
//
// ── Ce que la politique fait vraiment, vérifié dans le navigateur ──────────
//
// Un script de la page a essayé, depuis le HTML SERVI :
//
//     script externe          refusé      connexion à un tiers    refusée
//     feuille de style tierce refusée     WebSocket vers un tiers refusé
//     cadre hors liste        refusé      plugin/objet distant    refusé
//     eval / new Function     refusés     connexion à soi         autorisée
//     script EN LIGNE         EXÉCUTÉ  ← et il faut le dire
//
// `'unsafe-inline'` reste dans `script-src`, parce que le produit compte mille
// trois cent quatre balises `<script>` en ligne sur ses quatre-vingt-dix pages
// pré-rendues — ce sont celles de Next. Un script en ligne injecté s'exécuterait
// donc encore. Ce que la politique empêche, c'est **ce qu'il pourrait en faire** :
// il ne peut ni charger de code d'ailleurs, ni envoyer ce qu'il a lu ailleurs
// qu'à notre origine ou à Supabase.
//
// ── Deux mesures que j'ai d'abord lues de travers ──────────────────────────
//
// Elles valent d'être écrites, parce qu'elles disent comment se tromper ici.
//
// 1. `eval` semblait passer. Il ne passait pas : `page.evaluate` fait exécuter
//    le code par le protocole de débogage, qui **contourne la politique** et
//    transmet ce contournement à ce qu'il crée. Refait en injectant le script
//    dans le HTML SERVI, `eval` et `new Function` sont refusés (`EvalError`).
// 2. Un refus « Refused to execute script from /_vercel/insights/script.js »
//    semblait être un blocage de la politique. C'est une erreur de **type MIME** :
//    l'analytique de Vercel n'existe pas en local, la page reçoit un 404 HTML.
//    Rien à voir avec la CSP.
//
// Un message de refus ne dit pas de lui-même quelle règle l'a prononcé.
//
// ── Ce que cette garde vérifie ─────────────────────────────────────────────
//
// Elle ne lit pas le fichier : elle **charge la configuration et appelle sa
// fonction `headers()`**, puis évalue la politique obtenue comme un navigateur
// le ferait — quelle adresse chaque directive admet, laquelle elle refuse.

import { describe, it, expect } from "vitest"
import { frameSrc } from "./hotesDeCadre.mjs"

type Politique = Record<string, string[]>

/** La politique que la configuration produit VRAIMENT, découpée en directives. */
async function politiques(): Promise<{ appliquee: Politique; observee: Politique }> {
  const config = (await import("../../next.config.mjs")).default as {
    headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]>
  }
  const entetes = (await config.headers()).flatMap(r => r.headers)
  const lire = (cle: string): Politique => {
    const v = entetes.find(h => h.key.toLowerCase() === cle)?.value ?? ""
    const out: Politique = {}
    for (const d of v.split(";").map(s => s.trim()).filter(Boolean)) {
      const [nom, ...sources] = d.split(/\s+/)
      out[nom] = sources
    }
    return out
  }
  return { appliquee: lire("content-security-policy"), observee: lire("content-security-policy-report-only") }
}

/** Une directive admet-elle cette adresse ? Comme le ferait un navigateur. */
function admet(sources: string[] | undefined, url: string, origine = "https://qrowg.com"): boolean {
  if (!sources) return false
  let u: URL
  try { u = new URL(url, origine) } catch { return false }
  return sources.some(s => {
    if (s === "'none'") return false
    if (s === "'self'") return u.origin === new URL(origine).origin
    if (s.endsWith(":") && !s.includes("//")) return u.protocol === s          // https:, data:, blob:
    if (s.startsWith("'")) return false                                        // 'unsafe-inline'…
    const m = /^(https?|wss?):\/\/(.+)$/.exec(s)
    if (!m) return false
    if (`${u.protocol}//` !== `${m[1]}://`) return false
    const motif = m[2].toLowerCase()
    return motif.startsWith("*.") ? u.hostname.endsWith(motif.slice(1)) : u.hostname === motif
  })
}

describe("garde de classe : la politique appliquée borne ce qu'un script pourrait faire", () => {
  it("les directives qui comptent sont là, et rien n'est laissé au défaut du navigateur", async () => {
    const { appliquee } = await politiques()
    for (const d of ["default-src", "script-src", "style-src", "img-src", "font-src", "media-src",
                     "connect-src", "frame-src", "worker-src", "manifest-src", "frame-ancestors",
                     "base-uri", "object-src", "form-action"])
      expect(Object.keys(appliquee), `${d} est appliquée`).toContain(d)
    expect(appliquee["default-src"], "ce qui n'est pas nommé retombe sur 'self'").toEqual(["'self'"])
  })

  it("aucun code ne vient d'ailleurs, et aucun ne se fabrique à l'exécution", async () => {
    const { appliquee } = await politiques()
    expect(admet(appliquee["script-src"], "/_next/static/x.js"), "nos propres scripts").toBe(true)
    expect(admet(appliquee["script-src"], "/_vercel/insights/script.js"), "l'analytique, servie par nous").toBe(true)
    expect(admet(appliquee["script-src"], "https://piege.invalide/x.js"), "un script d'ailleurs").toBe(false)
    // Vérifié dans le navigateur : `eval` et `new Function` lèvent une EvalError.
    expect(appliquee["script-src"], "'unsafe-eval' ouvrirait eval et new Function").not.toContain("'unsafe-eval'")
    // Et ce qui reste ouvert, dit franchement plutôt que caché.
    expect(appliquee["script-src"], "un script EN LIGNE s'exécute encore — c'est la marche suivante")
      .toContain("'unsafe-inline'")
  })

  it("ce qu'un script lirait ne peut pas partir ailleurs", async () => {
    const { appliquee } = await politiques()
    const c = appliquee["connect-src"]
    expect(admet(c, "/api/leads"), "nos propres routes").toBe(true)
    expect(admet(c, "https://abcdefgh.supabase.co/rest/v1/pages"), "la base, que le navigateur joint").toBe(true)
    expect(admet(c, "wss://abcdefgh.supabase.co/realtime/v1"), "…et son canal temps réel").toBe(true)
    expect(admet(c, "https://piege.invalide/vol?c=session"), "un serveur choisi par un attaquant").toBe(false)
    expect(admet(c, "wss://piege.invalide/"), "…même en WebSocket").toBe(false)
  })

  it("les images et les médias restent larges — et c'est un choix, pas un oubli", async () => {
    const { appliquee } = await politiques()
    // Un commerçant héberge ses photos où il veut : `safeMediaSrc` accepte tout
    // hôte sûr. Resserrer `img-src` casserait des pages en ligne.
    expect(admet(appliquee["img-src"], "https://un-hebergeur-quelconque.fr/photo.jpg")).toBe(true)
    expect(admet(appliquee["img-src"], "data:image/png;base64,iVBOR")).toBe(true)
    expect(admet(appliquee["media-src"], "https://un-hebergeur-quelconque.fr/a.mp3")).toBe(true)
    // Les feuilles de style, elles, n'ont aucune raison de venir d'ailleurs.
    expect(admet(appliquee["style-src"], "https://piege.invalide/s.css"), "une feuille distante").toBe(false)
    expect(appliquee["object-src"], "plus aucun greffon").toEqual(["'none'"])
  })

  it("les cadres restent bornés par la liste du lot v161", async () => {
    const { appliquee } = await politiques()
    expect(appliquee["frame-src"].join(" ")).toBe(frameSrc())
    expect(admet(appliquee["frame-src"], "https://open.spotify.com/embed/track/1")).toBe(true)
    expect(admet(appliquee["frame-src"], "https://piege.invalide/")).toBe(false)
  })

  it("la politique OBSERVÉE ne dit que la marche suivante, et elle est plus stricte", async () => {
    const { appliquee, observee } = await politiques()
    // Elle ne double plus la politique appliquée : elle porte le seul pas qui
    // reste — `script-src` sans `'unsafe-inline'`, qui demande des nonces.
    expect(Object.keys(observee), "une seule directive observée").toEqual(["script-src"])
    expect(observee["script-src"]).toEqual(["'self'"])
    // Une politique d'observation plus LÂCHE que celle qui s'applique
    // n'observerait rien d'utile — c'était le cas avant le lot v161.
    expect(observee["script-src"].length, "plus stricte que l'appliquée")
      .toBeLessThan(appliquee["script-src"].length)
  })

  it("le détecteur sait dire non — sinon il ne dirait jamais oui", () => {
    expect(admet(["'self'"], "/x.js"), "même origine").toBe(true)
    expect(admet(["'self'"], "https://ailleurs.fr/x.js")).toBe(false)
    expect(admet(["https://*.supabase.co"], "https://abc.supabase.co/x")).toBe(true)
    expect(admet(["https://*.supabase.co"], "https://supabase.co.piege.invalide/x"), "domaine ressemblant").toBe(false)
    expect(admet(["https://*.supabase.co"], "http://abc.supabase.co/x"), "en clair").toBe(false)
    expect(admet(["'none'"], "https://quoi-que-ce-soit.fr")).toBe(false)
    expect(admet(["'unsafe-inline'"], "https://ailleurs.fr/x.js"), "un mot-clé n'autorise pas un hôte").toBe(false)
    expect(admet(["https:"], "https://n-importe-ou.fr/p.jpg"), "un schéma seul autorise l'hôte").toBe(true)
    expect(admet(undefined, "https://x.fr"), "une directive absente").toBe(false)
  })
})
