import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { PAGE_TEMPLATES } from "./dashboard/builder/page-templates"
import { creerUrlSecteur, SECTEUR_PAR_MODELE } from "./creer/entry"

// Refonte du 10 septembre. La page Exemples montrait six entreprises inventées —
// « Brasserie Le Moulin », « Thomas Dupont · Dev » — avec des aperçus dessinés qui
// ne s'ouvraient sur rien. Un visiteur venu voir une page QRowg repartait sans en
// avoir vu une seule, et le site affichait des clients qui n'existent pas.
//
// Désormais : les modèles réels du produit, et chacun s'ouvre sur une vraie page
// rendue par le moteur public.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const hub = lire("examples/page.tsx")
const demo = lire("examples/[modele]/DemoModele.tsx")
const route = lire("examples/[modele]/page.tsx")

describe("plus aucun client inventé", () => {
  it("les six entreprises fictives ont disparu", () => {
    // On lit le CODE, pas le commentaire d'en-tête qui raconte d'où l'on vient.
    const code = hub.split("\n").filter(l => !l.trim().startsWith("//")).join("\n")
    for (const faux of ["Brasserie Le Moulin", "Thomas Dupont", "brasserie-le-moulin", "thomas-dupont-dev"]) {
      expect(code, faux).not.toContain(faux)
    }
    // et la structure qui les portait avec : plus de catalogue parallèle à maintenir
    expect(hub).not.toContain("const EXAMPLES")
    expect(hub).not.toMatch(/tagline:/)
  })
  it("la page lit la même source que la galerie et l'éditeur", () => {
    expect(hub).toContain('import { PAGE_TEMPLATES } from "../dashboard/builder/page-templates"')
    expect(PAGE_TEMPLATES.length).toBeGreaterThanOrEqual(20)
  })
})

describe("chaque exemple s'ouvre sur une vraie page", () => {
  it("la route existe et rend le moteur public, pas une maquette", () => {
    expect(existsSync(join(__dirname, "examples/[modele]/page.tsx"))).toBe(true)
    expect(demo).toContain('import PublicPageClient from "../../[slug]/PublicPageClient"')
    expect(demo).toContain("<PublicPageClient page={page as any} blocks={blocks as any} showBranding introEligible={false} />")
    expect(hub).toContain("href={`/examples/${t.key}`}")
  })
  it("chaque modèle a sa page, et une clé inconnue tombe en 404", () => {
    expect(route).toContain("export function generateStaticParams()")
    expect(route).toContain("PAGE_TEMPLATES.map(t => ({ modele: t.key }))")
    expect(route).toContain("if (!tpl) notFound()")
  })
  it("la démonstration se dit démonstration, et le dit encore sur téléphone", () => {
    expect(demo).toContain("Page de démonstration — les textes et les photos sont des exemples")
    expect(demo).toContain('role="region" aria-label="Page de démonstration"')
    // sous 600 px c'est le nom du modèle qui s'efface, jamais la mention
    expect(demo).toContain(".demo-nom { display:none; }")
    expect(demo).not.toContain(".demo-mention { display:none; }")
  })
  it("ces pages ne s'indexent pas : une démo n'est pas une fiche d'établissement", () => {
    expect(route).toContain("robots: { index: false, follow: true }")
    expect(route).toContain("alternates: { canonical: `${APP}/examples` }")
  })
  it("aucun chiffre inventé n'accompagne la démonstration", () => {
    expect(demo).not.toContain("total_views")
  })
})

describe("« Utiliser » mène quelque part de sensé", () => {
  it("chaque modèle du catalogue a un secteur, ou la galerie entière", () => {
    const sans = PAGE_TEMPLATES.filter(t => SECTEUR_PAR_MODELE[t.key] === undefined).map(t => t.key)
    expect(sans, "modèles sans correspondance").toEqual([])
  })
  it("les secteurs cités existent : aucun filtre inventé", () => {
    const mauvais = Object.entries(SECTEUR_PAR_MODELE)
      .filter(([, s]) => s !== "" && creerUrlSecteur(s) === "/creer")
      .map(([k, s]) => `${k} → ${s}`)
    expect(mauvais).toEqual([])
  })
  it("le hub et la démonstration utilisent la même table", () => {
    expect(hub).toContain("creerUrlSecteur(SECTEUR_PAR_MODELE[t.key])")
    expect(demo).toContain("creerUrlSecteur(SECTEUR_PAR_MODELE[tpl.key])")
  })
})

describe("le hub respecte les règles de la maison", () => {
  it("filtres au pouce (44 px) et cibles à 32 px minimum", () => {
    expect(hub).toContain("min-height:44px")
    expect(hub).toContain("min-height:36px")
    expect(hub).not.toMatch(/fontSize: (7|8|9|10)(\.\d+)?\b/)
  })
  it("un seul h1, les modèles en h2", () => {
    expect((hub.match(/<h1/g) ?? []).length).toBe(1)
    expect(hub).toContain('<h2 id={`ex-${t.key}`}')
  })
  it("l'en-tête public porte la règle des cibles, et le vrai logo", () => {
    expect(hub).toContain("qf-entete")
    expect(hub).toContain("<QrowgLogo size={20} />")
  })
  it("aucun dégradé : la page suit l'aplat des autres écrans", () => {
    expect(hub).not.toContain("gradient")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Ouvrir 34 pages de démonstration a montré ce qu'aucun écran d'administration
// ne montrait : la PAGE PUBLIÉE elle-même — celle que le client fait scanner à
// ses propres clients — descendait à 7 px par endroits (badges de produit,
// « aujourd'hui » des horaires, titres de formules, mention « Créé avec QRowg »).
// Le moteur partagé applique une échelle : dans le canvas de l'éditeur elle
// rapetisse le rendu, c'est légitime ; mais la TAILLE DE RÉFÉRENCE, elle, est
// celle du public et doit tenir la règle des 11 px.

import { readdirSync } from "node:fs"

describe("le moteur public respecte les 11 px", () => {
  const RENDU = join(__dirname, "dashboard/builder/shared-renderer/blocks")
  const publics = readdirSync(RENDU).sort().flatMap(d => {
    try { return readdirSync(join(RENDU, d)).sort().filter(f => f === "index.tsx" || f.startsWith("Public")).map(f => `dashboard/builder/shared-renderer/blocks/${d}/${f}`) }
    catch { return [] }
  })

  it("le catalogue de blocs est bien celui qu'on croit", () => {
    expect(publics.length).toBeGreaterThan(40)
  })

  it("aucune taille de référence sous 11 px dans les rendus publics", () => {
    const fautes: string[] = []
    for (const f of [...publics, "[slug]/blocsPublics.tsx", "[slug]/renduLegacy.tsx", "[slug]/PublicPageClient.tsx"]) {
      const src = lire(f)
      src.split("\n").forEach((l, i) => {
        // fontSize direct, via sz(u, n) ou via une échelle écrite à la main.
        for (const re of [/fontSize: (\d+(?:\.\d+)?)/g, /fontSize: sz\(u, (\d+(?:\.\d+)?)\)/g, /fontSize: Math\.round\((\d+(?:\.\d+)?) \* (?:u\.)?scale\)/g]) {
          for (const m of l.matchAll(re)) if (parseFloat(m[1]) < 11) fautes.push(`${f}:${i + 1} → ${m[1]} px`)
        }
      })
    }
    expect(fautes, fautes.slice(0, 6).join(" · ")).toEqual([])
  })

  it("l'échelle du canvas reste libre : c'est une miniature, pas un texte lu", () => {
    // sz() multiplie la référence par l'échelle du contexte : c'est ce mécanisme
    // qui autorise un rendu réduit dans l'éditeur sans toucher au public.
    expect(lire("dashboard/builder/shared-renderer/renderTypes.ts")).toContain("return Math.max(1, Math.round(n * u.scale))")
  })
})
