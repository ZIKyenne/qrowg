import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PAGE_TEMPLATES } from "./dashboard/builder/page-templates"
import { OBJECTIVES } from "./dashboard/onboarding/objectives"
import { EMPTY_STATE_BLOCK_TYPES } from "./dashboard/builder/blockEmptyState"

// 10 septembre. En ouvrant les 34 pages de démonstration, on a vu ce que les
// modèles écrivaient à la place de l'utilisateur : « Marie L. — La meilleure
// entrecôte de Paris », « Sarah M., CEO — MVP livré en 6 semaines », « 4,9/5 sur
// 312 avis », « +1 200 clientes et clients fidèles », « Assurance RC Pro ».
//
// Quelqu'un qui découvre le produit prend un modèle, remplace le nom et l'adresse,
// publie — et diffuse des avis fabriqués signés de prénoms inventés, une note qu'il
// n'a pas reçue, une assurance qu'il n'a peut-être pas. Le produit lui faisait
// écrire un mensonge sans qu'il s'en rende compte.
//
// Règle : le pré-remplissage donne la STRUCTURE et le TITRE (l'emplacement), jamais
// l'AFFIRMATION. Les champs de preuve arrivent vides ; le bloc ne publie rien tant
// qu'ils le sont, et l'éditeur dit quoi y mettre.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

// Champ = affirmation, par type de bloc. Le titre du bloc n'en fait pas partie :
// « Ils nous recommandent » est une invite, pas une preuve.
const AFFIRMATIONS: Record<string, RegExp[]> = {
  testimonials:            [/^name\d+$/, /^text\d+$/, /^stars\d+$/, /^role\d+$/],
  video_testimonials:      [/^t\d+_name$/, /^t\d+_quote$/],
  google_review:           [/^name\d+$/, /^text\d+$/],
  stats_block:             [/^s\d+_value$/],
  business_stats:          [/^s\d+_value$/, /^stat\d+_value$/],
  stat_hero:               [/^value$/, /^unit$/, /^label$/],
  avatar_row:              [/^count$/, /^label$/, /^name\d+$/],
  logo_marquee:            [/^name\d+$/],
  logo_wall:               [/^logo\d+_name$/],
  partners:                [/^logo\d+_name$/],
  trust_badge:             [/^b\d+_label$/],
  business_certifications: [/^c\d+_name$/],
}

function fautes(blocks: { type: string; content: Record<string, any> }[], source: string): string[] {
  const out: string[] = []
  for (const b of blocks) {
    const regles = AFFIRMATIONS[b.type]
    if (!regles) continue
    for (const [k, v] of Object.entries(b.content || {})) {
      if (typeof v !== "string" || !v.trim()) continue
      if (regles.some(re => re.test(k))) out.push(`${source} · ${b.type}.${k} = « ${v} »`)
    }
  }
  return out
}

describe("aucun modèle n'écrit la preuve à la place de l'utilisateur", () => {
  it("les 34 modèles de page arrivent sans avis, sans note, sans chiffre inventé", () => {
    const tous = PAGE_TEMPLATES.flatMap(t => fautes(t.blocks as any, t.key))
    expect(tous, tous.slice(0, 8).join("\n")).toEqual([])
  })

  it("les recettes de la création guidée non plus", () => {
    const tous = OBJECTIVES.flatMap(o => fautes((o as any).blocks ?? [], o.key))
    expect(tous, tous.slice(0, 8).join("\n")).toEqual([])
  })

  it("les prénoms et notes des anciens modèles ont bien disparu", () => {
    const src = lire("dashboard/builder/page-templates.ts") + lire("dashboard/onboarding/objectives.ts") + lire("dashboard/builder/templatesStudio.ts")
    for (const faux of ["Marie L.", "Sarah M., CEO", "Famille Moreau", "M. et Mme Blanc", "Client vérifié", "Client satisfait", "sur 312 avis", "+1 200"]) {
      expect(src, faux).not.toContain(faux)
    }
  })

  it("mais la structure reste : le bloc et son titre sont toujours là", () => {
    const avecAvis = PAGE_TEMPLATES.filter(t => t.blocks.some(b => b.type === "testimonials"))
    expect(avecAvis.length).toBeGreaterThanOrEqual(8)
    for (const t of avecAvis) {
      const bloc = t.blocks.find(b => b.type === "testimonials")!
      expect(Object.keys(bloc.content).some(k => k === "title"), `${t.key} : le titre invite à remplir`).toBe(true)
    }
  })
})

describe("un bloc de preuve vide se voit et se dit", () => {
  it("chaque type concerné a son état vide déclaré", () => {
    for (const t of ["testimonials", "video_testimonials", "logo_marquee", "avatar_row", "stat_hero"]) {
      expect(EMPTY_STATE_BLOCK_TYPES, t).toContain(t)
    }
  })
  it("l'éditeur dit quoi mettre, et prévient que rien ne sera publié", () => {
    const t = lire("dashboard/builder/shared-renderer/blocks/testimonials/EditorTestimonials.tsx")
    expect(t).toContain('label="Collez ici un avis reçu"')
    expect(t).toContain("HIDDEN_WHEN_EMPTY_NOTE")
    // Ces trois-là ont leur adapter éditeur dans un fichier à part : l'état vide est du
    // code d'édition et n'a rien à faire dans le bundle de la page publiée.
    expect(lire("dashboard/builder/shared-renderer/blocks/stat_hero/EditorStatHero.tsx")).toContain('label="Votre chiffre qui compte"')
    expect(lire("dashboard/builder/shared-renderer/blocks/avatar_row/EditorAvatarRow.tsx")).toContain('label="Vos clients, en chiffre réel"')
    expect(lire("dashboard/builder/shared-renderer/blocks/logo_marquee/EditorLogoMarquee.tsx")).toContain('label="Vos partenaires, vos marques"')
    for (const f of ["stat_hero", "avatar_row", "logo_marquee"]) {
      expect(lire(`dashboard/builder/shared-renderer/blocks/${f}/index.tsx`), f).not.toContain("BlockEmptyState")
    }
    expect(lire("dashboard/builder/builderPreview.tsx")).toContain('emptyHint("🎥", "Ajoutez une vidéo de client"')
  })
  it("et la page publiée ne montre pas de cadre vide à la place", () => {
    // Même règle des deux côtés : vide en édition ⟺ absent en ligne.
    for (const [f, garde] of [
      ["dashboard/builder/shared-renderer/blocks/avatar_row/index.tsx", "if (rowAvatars(c).length === 0 && !c.count && !c.label) return null"],
      ["dashboard/builder/shared-renderer/blocks/logo_marquee/index.tsx", "if (marqueeLogos(c).length === 0) return null"],
      ["dashboard/builder/shared-renderer/blocks/stat_hero/index.tsx", 'if (!String(c.value || "").trim()) return null'],
      ["dashboard/builder/shared-renderer/blocks/testimonials/PublicTestimonials.tsx", "if (items.length === 0) return null"],
    ] as const) {
      expect(lire(f), f).toContain(garde)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite, 11 septembre. En suivant le parcours réel — « Modèles » → Bistrot
// français → Appliquer — l'écran d'après montrait une carte Google morte : le
// modèle plaçait l'établissement « 12 rue de la Paix, 75001 Paris ». Une adresse
// réelle, qui appartient à quelqu'un d'autre. Vingt-et-un modèles en avaient une.
// Quelqu'un qui publie sans la changer envoie ses clients chez un inconnu.

describe("aucune coordonnée réelle inventée", () => {
  it("les modèles n'installent l'établissement nulle part", () => {
    const src = lire("dashboard/builder/page-templates.ts") + lire("dashboard/builder/templatesStudio.ts")
    const adresses = [...src.matchAll(/address: "([^"]+)"/g)].map(m => m[1])
    expect(adresses, adresses.slice(0, 5).join(" · ")).toEqual([])
  })
  it("et ne posent pas de bouton vers une page de service nue", () => {
    const src = lire("dashboard/builder/page-templates.ts") + lire("dashboard/builder/templatesStudio.ts")
    for (const nu of ['url: "https://calendly.com"', 'url: "https://open.spotify.com"']) {
      expect(src, nu).not.toContain(nu)
    }
  })
  it("la carte sans adresse ne publie rien et le dit dans l'éditeur", () => {
    expect(lire("dashboard/builder/blockEmptyState.ts")).toContain("google_maps_embed:       c => hasMeaningfulText(c.address) || hasMeaningfulText(c.embed_url)")
    expect(lire("dashboard/builder/shared-renderer/blocks/google_maps_embed/EditorGoogleMapsEmbed.tsx")).toContain('label="Ajoutez une adresse"')
    expect(lire("dashboard/builder/builderPreview.tsx")).toContain('emptyHint("🗺️", "Ajoutez une adresse"')
  })
  it("l'assistant de modèle demande l'adresse au lieu de l'inventer", () => {
    expect(lire("dashboard/builder/templateWizard.ts")).toContain('google_maps_embed:  { label: "businessName", address: "address" }')
  })
})

describe("avant de publier, on sait ce qui manque", () => {
  it("un bloc vide est annoncé au même endroit qu'un bouton sans lien", () => {
    const a = lire("dashboard/builder/AlertesPublication.tsx")
    expect(a).toContain('import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "./blockEmptyState"')
    expect(a).toContain('out.push({ blocId: b.id, bloc, texte: "Bloc vide — rien à publier pour l\'instant" })')
    expect(a).toContain("if (b.visible === false) continue")
  })
  it("la liste se calcule sur un vrai modèle appliqué", async () => {
    const { alertesPublication } = await import("./dashboard/builder/AlertesPublication")
    const bistrot = PAGE_TEMPLATES.find(t => t.key === "resto_bistrot")!
    const blocks = bistrot.blocks.map((b, i) => ({ id: `b${i}`, type: b.type, content: b.content, visible: true })) as any
    const alertes = alertesPublication(blocks)
    // Le bloc d'avis et la carte arrivent vides ; le bouton de réservation n'a pas de lien.
    expect(alertes.some(a => a.texte.includes("Bloc vide"))).toBe(true)
    expect(alertes.some(a => a.texte.includes("sans lien"))).toBe(true)
    expect(alertes.length).toBeGreaterThanOrEqual(3)
  })
})
