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
