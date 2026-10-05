import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { descriptionRepli, texteDeLaPage } from "./identitePageSeo"

const SRC = join(__dirname, "..")
const lire = (p: string) => readFileSync(join(SRC, p), "utf8")
const demos = lire("app/examples/[modele]/page.tsx")
const redirection = lire("app/q/[code]/route.ts")
const robots = lire("app/robots.ts")

// ═══════════════════════════════════════════════════════════════════════════════
// LES SIGNAUX ENVOYÉS AUX MOTEURS NE SE CONTREDISENT PAS.
//
// Trois constats d'un audit SEO technique du 29 septembre, mesurés sur qrowg.com :
//
// SEO-01. Les 34 pages de démonstration portaient `noindex` ET un canonical vers
// `/examples`. Un canonical désigne l'URL à conserver ; un `noindex` demande de ne
// rien conserver. Google traite ce cas comme ambigu et peut reporter le `noindex`
// sur la cible — donc sur `/examples`, qu'on veut indexée.
//
// SEO-02. `/q/<code>` redirige presque toujours, mais rend du HTML dans trois cas :
// mur de quota, demande de mot de passe, code introuvable. Ces réponses n'étaient
// ni bloquées ni marquées. Un QR partagé sur le web pouvait faire indexer
// « Saisissez le mot de passe » sous le nom d'un commerçant.
//
// SEO-03. Les six pages clientes indexées portaient la MÊME description, au nom
// près — le repli générique — alors que leur contenu était déjà chargé.
// ═══════════════════════════════════════════════════════════════════════════════

describe("SEO-01 — une page hors index ne désigne pas une autre URL", () => {
  it("le canonical des démonstrations est auto-référent", () => {
    expect(demos).toContain("canonical: `${APP}/examples/${t.key}`")
    expect(demos, "le canonical pointait vers une autre page").not.toContain("canonical: `${APP}/examples`")
  })

  it("et elles restent volontairement hors index", () => {
    // Trente-quatre pages de contenus de démonstration n'ont rien à faire dans
    // l'index : c'est le `noindex` qui est juste, pas le canonical qui était faux.
    expect(demos).toContain("robots: { index: false, follow: true }")
    // `follow` : la valeur continue de circuler vers la galerie et les modèles.
    expect(demos, "en nofollow, la galerie perdrait ces liens").not.toContain("follow: false, ")
  })
})

describe("SEO-02 — les réponses HTML de la redirection ne s'indexent pas", () => {
  it("toutes passent par le même jeu d'en-têtes", () => {
    expect(redirection).toContain("const ENTETES_HTML = {")
    expect(redirection).toContain('"X-Robots-Tag": "noindex, nofollow"')
    // Deux endroits construisent du HTML : le mur et le lien instantané. Aucun ne
    // doit refabriquer ses en-têtes dans son coin.
    const bruts = redirection.match(/"Content-Type": "text\/html/g) ?? []
    expect(bruts.length, "une réponse HTML pose encore ses en-têtes à la main").toBe(1)
    expect(redirection.match(/\{ \.\.\.ENTETES_HTML \}/g)?.length, "les deux réponses doivent l'utiliser").toBe(2)
  })

  it("mais la redirection reste explorable", () => {
    // Interdire `/q/` dans robots.txt empêcherait de suivre la redirection — et
    // empêcherait même de LIRE le noindex. Un fichier robots n'est pas une
    // désindexation : c'est exactement la confusion à ne pas faire ici.
    expect(robots, "/q/ ne doit pas être bloqué à l'exploration").not.toContain('"/q/"')
    expect(robots).toContain('disallow: ["/dashboard/", "/auth/", "/api/", "/e2e-harness/"]')
  })
})

describe("SEO-03 — la description dit ce que la page contient", () => {
  const bloc = (contenu: Record<string, unknown>) => ({ content: contenu })

  it("deux pages au contenu différent produisent deux descriptions différentes", () => {
    const a = descriptionRepli({ titre: "The Red Fish" }, [
      bloc({ text: "Poissonnerie et bar à huîtres depuis 1994, au cœur des Halles. Arrivage quotidien." }),
    ])
    const b = descriptionRepli({ titre: "Coffee shop" }, [
      bloc({ bio: "Torréfaction artisanale, pâtisseries maison et wifi libre, ouvert du mardi au dimanche." }),
    ])
    expect(a).not.toBe(b)
    expect(a).toContain("The Red Fish")
    expect(a).toContain("bar à huîtres")
    expect(b).toContain("Torréfaction")
  })

  it("sans texte, la phrase générique reste — mieux qu'une description vide", () => {
    const d = descriptionRepli({ titre: "Ma brasserie" }, [])
    expect(d).toBe("Ma brasserie — coordonnées, horaires, liens et contact réunis sur une seule page, accessible en un scan.")
    expect(descriptionRepli({ titre: "Ma brasserie" })).toBe(d)
  })

  it("elle tient dans la fenêtre de la SERP, coupée au mot entier", () => {
    const long = "a".repeat(40) + " " + "b".repeat(40) + " " + "c".repeat(100)
    const d = descriptionRepli({ titre: "Un nom" }, [bloc({ text: long })])
    expect(d.length).toBeLessThanOrEqual(158)
    expect(d.endsWith("…"), "elle doit se terminer par des points de suspension").toBe(true)

    // « coupé au mot entier » ne veut pas dire « ne finit pas par une lettre » :
    // un mot complet finit forcément par une lettre. Ce qu'on vérifie, c'est que
    // ce qui reste est bien un DÉBUT du texte d'origine, arrêté sur une frontière
    // de mot — donc suivi d'une espace dans l'original, ou de rien.
    const garde = d.replace(/^Un nom — /, "").replace(/…$/, "")
    const complet = long
    expect(complet.startsWith(garde), "le texte gardé n'est pas un début du texte d'origine").toBe(true)
    const suite = complet.slice(garde.length)
    expect(suite === "" || suite.startsWith(" "), `coupé au milieu d'un mot : « …${garde.slice(-8)}|${suite.slice(0, 8)}… »`).toBe(true)
  })

  it("elle ne prend ni une adresse, ni du balisage, ni un fragment trop court", () => {
    expect(texteDeLaPage([bloc({ text: "https://exemple.fr/une/adresse/tres/longue/qui/depasse/soixante/caracteres" })])).toBe("")
    expect(texteDeLaPage([bloc({ text: "<p>du balisage qui traîne dans un champ et dépasse largement soixante caractères</p>" })])).toBe("")
    expect(texteDeLaPage([bloc({ text: "Trop court." })])).toBe("")
    expect(texteDeLaPage([bloc({ label: "Réserver une table maintenant, chez nous, tout de suite, vraiment" })]), "un libellé de bouton n'est pas une description").toBe("")
  })

  it("elle prend le PREMIER texte substantiel, dans l'ordre de la page", () => {
    const d = texteDeLaPage([
      bloc({ label: "Appeler" }),
      bloc({ text: "Le premier vrai paragraphe de la page, assez long pour valoir une description." }),
      bloc({ text: "Un second paragraphe, qui ne doit pas passer devant le premier du tout." }),
    ])
    expect(d).toMatch(/^Le premier vrai paragraphe/)
  })

  it("la page publiée lui passe bien son contenu", () => {
    const page = lire("app/[slug]/page.tsx")
    expect(page).toContain("descriptionRepli(identite, (page as any).blocks)")
    // Le contenu est déjà chargé pour `jugerPage` : aucune requête en plus.
    expect(page).toContain("blocks(content)")
  })
})
