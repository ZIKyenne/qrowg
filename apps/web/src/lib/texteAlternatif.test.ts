import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { altGalerie, altDe, legendeSaine } from "./texteAlternatif"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import { PublicCoverBanner } from "@/app/dashboard/builder/shared-renderer/blocks/cover_banner"

// La galerie de la page publiée rendait ses photos avec alt="" — et le bloc
// n'offrait aucun champ pour en écrire un. Sur une page dont les photos SONT le
// contenu, une personne aveugle n'entendait rien.

describe("texte alternatif d'une photo de galerie", () => {
  it("la légende de l'auteur passe avant tout", () => {
    expect(altGalerie("Tarte aux figues", "Nos desserts", 0, 6)).toBe("Tarte aux figues")
  })
  it("sans légende, le titre du bloc et le rang", () => {
    expect(altGalerie("", "Nos desserts", 1, 6)).toBe("Nos desserts — photo 2 sur 6")
    expect(altGalerie(undefined, "", 1, 6)).toBe("Photo 2 sur 6")
    expect(altGalerie(null, "", 0, 1)).toBe("Photo")
  })
  it("une légende est nettoyée et bornée", () => {
    expect(legendeSaine("  deux   lignes\n ici ")).toBe("deux lignes ici")
    expect(legendeSaine("a".repeat(400))).toHaveLength(160)
    expect(legendeSaine(42)).toBe("")
  })
  it("altDe reprend un nom existant, sinon le repli", () => {
    expect(altDe("Entrecôte")).toBe("Entrecôte")
    expect(altDe("  ", "Bannière")).toBe("Bannière")
  })
})

describe("la page publiée", () => {
  // + le carrousel, primitive partagée depuis le rendu unique (lot 4).
  const src = ["PublicPageClient.tsx", "blocsPublics.tsx", "../dashboard/builder/shared-renderer/primitives/Carrousel.tsx"].map(f => readFileSync(join(__dirname, "../app/[slug]/" + f), "utf8")).join("\n")
  const defs = readFileSync(join(__dirname, "../app/dashboard/builder/blockDefs.ts"), "utf8")

  it("les quatre rendus de galerie décrivent leurs photos", () => {
    expect(src.match(/alt=\{altGalerie\(/g) ?? []).toHaveLength(4)
  })
  it("les légendes suivent le même filtre que les photos", () => {
    // Retirer la photo 2 décalait sinon toutes les descriptions d'un cran.
    // Le carrousel lit ses photos avec la galerie (rendu unique, lot 4) : un seul
    // filtre, qui garde chaque légende avec SA photo.
    const modeles = readFileSync(join(__dirname, "../app/dashboard/builder/shared-renderer/models/horairesGalerieReseaux.ts"), "utf8")
    expect(modeles).toContain(".filter(p => p.src !== \"\")")
    expect(readFileSync(join(__dirname, "../app/dashboard/builder/shared-renderer/models/medias.ts"), "utf8")).toContain("const g = galerie(c)")
    expect(src).not.toContain("const imgs = [c.img1, c.img2, c.img3, c.img4, c.img5, c.img6, c.img7, c.img8, c.img9, c.img10, c.img11, c.img12].filter(Boolean)")
  })
  it("le bloc galerie offre un champ description par photo", () => {
    for (let n = 1; n <= 6; n++) expect(defs, `img${n}_alt`).toContain(`{ key: "img${n}_alt", label: "Photo ${n} — description"`)
  })
  it("une bannière sans texte incrusté est décrite, avec texte elle se tait", () => {
    // La bannière a rejoint le renderer partagé (rendu unique, lot 2) : on
    // exécute son rendu public au lieu de lire une ligne de l'ancien.
    const ctx: any = { theme: {}, G: "#C9A84C", TEXT: "#fff", MUTED: "#aaa", FONT_D: "f", FONT_B: "b", pageId: "p", blockId: "b", trackClick: () => {} }
    const rendre = (content: Record<string, unknown>) => renderToStaticMarkup(createElement(PublicCoverBanner, { content, ctx }))
    const img = "https://exemple.supabase.co/storage/v1/object/public/page-assets/a.png"
    expect(rendre({ src: img })).toContain('alt="Bannière"')
    expect(rendre({ src: img, title: "Notre terrasse" })).toContain('alt="Notre terrasse"')
    expect(rendre({ src: img, cover_title: "Bienvenue" }), "le texte incrusté se lit déjà").toContain('alt=""')
  })
  it("le choix de laisser des vignettes muettes est écrit noir sur blanc", () => {
    expect(src).toContain("WCAG H67")
  })
})
