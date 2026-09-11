import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { contraste, encreSur, surFond, CONTRASTE_MIN } from "./dashboard/builder/couleurLisible"
import { textOn } from "./dashboard/builder/shared-renderer/models/layoutStyle"
import { AlertesPublication, alertesTheme } from "./dashboard/builder/AlertesPublication"
import { STUDIO_THEMES } from "./dashboard/builder/templatesStudio"

// Relevé du 11 septembre : balayage de contraste au navigateur sur les 34 pages
// de démonstration, rendues par le vrai moteur public.
//
// Trois familles de fautes, toutes du fait du PRODUIT, pas du client :
//  1. des liens sans couleur déclarée, rendus dans le bleu par défaut du
//     navigateur (#0000EE) — 1,8 à 2,1 : 1 sur les thèmes sombres ;
//  2. des couleurs de sens écrites en dur pour le fond noir de QRowg, sorties
//     telles quelles sur un thème clair : « Ouvert · ferme à 19h » à 1,1 : 1,
//     « Nouveaux patients acceptés » à 1,17, « Produits bio » à 1,9 ;
//  3. l'encre des boutons fixée à blanc quelle que soit la couleur dessous :
//     3,5 : 1 sur la terracotta du modèle Pizzeria, là où le noir donnait 6,0.
//
// Ce que le client choisit lui-même n'est pas corrigé en douce : c'est signalé
// avant publication.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("le navigateur n'a plus son mot à dire sur la couleur des liens", () => {
  it("la page publiée fait hériter tout lien qui n'a pas choisi sa couleur", () => {
    const pc = lire("[slug]/PublicPageClient.tsx")
    expect(pc).toContain(".qf-public a { color: inherit; }")
    // et la règle est bien dans la feuille de la page publique, pas ailleurs
    expect(pc.indexOf(".qf-public a { color: inherit; }")).toBeGreaterThan(pc.indexOf("<style>"))
  })
})

describe("les couleurs imposées par le produit s'adaptent au fond du client", () => {
  it("le contexte de rendu expose « lisible », en éditeur comme en public", () => {
    const rt = lire("dashboard/builder/shared-renderer/renderTypes.ts")
    expect(rt).toContain("lisible: (couleur: string, min?: number) => string")
    expect((rt.match(/lisible: fabriqueLisible\(ctx\.theme\)/g) ?? []).length).toBe(2)
    // le seuil est exigé sur le fond ET sur la carte : les deux existent sur l'écran
    expect(rt).toContain("surFond(surFond(couleur, bg, vise), surface, vise)")
  })
  it("le badge d'horaires, les pastilles de profil et les marqueurs ✓/✕ y passent", () => {
    const b = "dashboard/builder/shared-renderer/blocks/"
    expect(lire(b + "opening_hours/index.tsx")).toContain("color: u.lisible(st.color)")
    expect(lire(b + "profile/index.tsx")).toContain("color: u.lisible(bs.color)")
    expect(lire(b + "compare_two/index.tsx")).toContain('u.lisible(safeColor(c.left_color, "#39FF8F"))')
    expect(lire(b + "checklist/index.tsx")).toContain('u.lisible(safeColor(c.check_color, "#39FF8F"))')
  })
  it("le cas relevé se corrige vraiment : 1,1 devient lisible, et reste vert", () => {
    const MENTHE = STUDIO_THEMES.menthe.bg!
    expect(contraste("#39FF8F", MENTHE)!).toBeLessThan(1.3)
    const corrige = surFond("#39FF8F", MENTHE, CONTRASTE_MIN)
    expect(contraste(corrige, MENTHE)!).toBeGreaterThanOrEqual(CONTRASTE_MIN)
  })
  it("sur les thèmes sombres, rien ne bouge : le produit garde ses couleurs", () => {
    for (const nom of ["noir_or", "ember", "graphite"]) {
      const bg = (STUDIO_THEMES as any)[nom].bg
      expect(surFond("#39FF8F", bg), nom).toBe("#39FF8F")
    }
  })
})

describe("l'encre d'un bouton est calculée, plus estimée", () => {
  it("textOn compare les deux rapports au lieu de trancher sur un seuil", () => {
    const ls = lire("dashboard/builder/shared-renderer/models/layoutStyle.ts")
    expect(ls).toContain('return typeof color === "string" ? encreSur(color) : ENCRE_CLAIRE')
    expect(ls).not.toContain('l !== null && l > 0.45 ? "#0A0A0A" : "#FFFFFF"')
  })
  it("la terracotta du modèle Pizzeria prend enfin une encre lisible", () => {
    const TERRACOTTA = "#E2603F"
    expect(contraste("#FFFFFF", TERRACOTTA)!).toBeLessThan(CONTRASTE_MIN)
    expect(textOn(TERRACOTTA)).toBe(encreSur(TERRACOTTA))
    expect(contraste(textOn(TERRACOTTA), TERRACOTTA)!).toBeGreaterThanOrEqual(CONTRASTE_MIN)
  })
  it("aucune couleur d'accent des modèles ne reçoit la pire des deux encres", () => {
    for (const [nom, t] of Object.entries(STUDIO_THEMES)) {
      const acc = (t as any).primary
      if (typeof acc !== "string") continue
      const choisie = textOn(acc)
      const autre = choisie === "#FFFFFF" ? "#0A0A0A" : "#FFFFFF"
      expect(contraste(choisie, acc)!, nom).toBeGreaterThanOrEqual(contraste(autre, acc)!)
    }
  })
})

describe("ce que le client a choisi est signalé, pas réécrit", () => {
  it("un thème qui tient ne produit aucune alerte", () => {
    expect(alertesTheme(STUDIO_THEMES.menthe)).toEqual([])
  })
  it("un thème illisible produit une ligne nommée, avec son rapport chiffré", () => {
    const a = alertesTheme({ bg: "#FFFFFF", text: "#E8E8E8", muted: "#222222", primary: "#111111" })
    expect(a).toHaveLength(1)
    expect(a[0].bloc).toBe("Thème de la page")
    expect(a[0].blocId).toBe("")          // page, pas bloc : la ligne ouvre le thème
    expect(a[0].texte).toContain("il en faut 4,5")
  })
  it("l'encadré de pré-publication l'affiche vraiment", () => {
    const html = renderToStaticMarkup(
      <AlertesPublication blocks={[]} theme={{ bg: "#FFFFFF", text: "#E8E8E8", muted: "#222", primary: "#111" }}
        onVoir={() => {}} onVoirTheme={() => {}} />)
    expect(html).toContain("Thème de la page")
    expect(html).toContain("la couleur du texte se lit mal sur le fond")
    expect(html).toContain("1 point à vérifier avant de publier")
  })
  it("sans thème fautif ni bloc fautif, l'encadré ne s'affiche pas du tout", () => {
    const html = renderToStaticMarkup(
      <AlertesPublication blocks={[]} theme={STUDIO_THEMES.menthe} onVoir={() => {}} onVoirTheme={() => {}} />)
    expect(html).toBe("")
  })
})
