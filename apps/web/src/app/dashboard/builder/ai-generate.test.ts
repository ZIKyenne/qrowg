import { describe, it, expect } from "vitest"
import { aiBriefToTemplate, AI_BRIEF_SCHEMA, AI_SECTION_KINDS, buildSystemPrompt, type AiBrief } from "./ai-generate"
import { AMBIANCE_KEYS } from "./page-templates"
import { BLOCK_DEFS } from "./blockDefs"

// Tout bloc émis par le mapper doit avoir un type existant dans BLOCK_DEFS.
function assertValidBlocks(blocks: { type: string; content: Record<string, string> }[]) {
  for (const b of blocks) {
    expect(BLOCK_DEFS[b.type], `type inconnu: ${b.type}`).toBeTruthy()
    for (const v of Object.values(b.content)) expect(typeof v).toBe("string")
  }
}

describe("aiBriefToTemplate", () => {
  it("profil toujours en tête + thème résolu depuis l'ambiance", () => {
    const t = aiBriefToTemplate({ name: "Le Bistrot", tagline: "Cuisine maison", badge: "⭐", ambiance: "velvet", sections: [] })
    expect(t.blocks[0].type).toBe("profile")
    expect(t.blocks[0].content).toEqual({ name: "Le Bistrot", tagline: "Cuisine maison", badge: "⭐" })
    expect(t.theme.primary).toBe("#EF4444") // T.velvet
    expect(t.group).toBe("IA")
    assertValidBlocks(t.blocks)
  })

  it("ambiance inconnue -> thème gold par défaut, nom vide -> secours", () => {
    const t = aiBriefToTemplate({ ambiance: "inexistant" as any, sections: [] })
    expect(t.theme.primary).toBe("#C9A84C") // T.gold
    expect(t.blocks[0].content.name).toBe("Mon activité")
  })

  it("mappe chaque kind vers un bloc valide avec les bonnes clés", () => {
    const brief: AiBrief = {
      name: "Test", tagline: "", badge: "", ambiance: "gold",
      sections: [
        { kind: "about", title: "", text: "Une belle histoire.", items: [] },
        { kind: "skills", title: "Expertises", text: "", items: [{ label: "SEO", value: "", detail: "" }, { label: "Ads", value: "", detail: "" }] },
        { kind: "services", title: "Services", text: "", items: [{ label: "Coaching", value: "💪", detail: "1h" }] },
        { kind: "menu", title: "Entrées", text: "", items: [{ label: "Soupe", value: "8€", detail: "maison" }] },
        { kind: "pricing", title: "Tarifs", text: "", items: [{ label: "Pro", value: "49€", detail: "/mois" }] },
        { kind: "testimonials", title: "Avis", text: "", items: [{ label: "Marie", value: "5", detail: "Top !" }] },
        { kind: "faq", title: "FAQ", text: "", items: [{ label: "Parking ?", value: "", detail: "Oui" }] },
        { kind: "hours", title: "Horaires", text: "Sur RDV", items: [{ label: "Semaine", value: "9h-18h", detail: "" }] },
        { kind: "cta", title: "Réserver", text: "https://calendly.com", items: [] },
        { kind: "announcement", title: "Promo", text: "-20%", items: [] },
        { kind: "social", title: "", text: "", items: [{ label: "Instagram", value: "https://instagram.com/x", detail: "" }] },
        { kind: "map", title: "Adresse", text: "12 rue de Paris", items: [] },
      ],
    }
    // Depuis le lot v92, un prix / horaire / adresse / lien n'entre dans la page
    // que s'il vient de ce que le commerçant a écrit. On le lui donne ici : ce
    // cas vérifie le MAPPAGE, pas la règle des faits (elle a sa propre garde).
    const DESCRIPTION = "Coaching et restauration. Soupe maison 8€, formule Pro 49€/mois. "
      + "Ouvert 9h-18h sur RDV, 12 rue de Paris. Réservation https://calendly.com, instagram.com/x"
    const t = aiBriefToTemplate(brief, DESCRIPTION)
    assertValidBlocks(t.blocks)
    const types = t.blocks.map(b => b.type)
    expect(types).toEqual([
      "profile", "bio", "skills", "services_list", "menu_section", "pricing",
      "testimonials", "faq", "opening_hours", "cta_button", "announcement", "social_links", "google_maps_embed",
    ])
    const byType = Object.fromEntries(t.blocks.map(b => [b.type, b.content]))
    expect(byType.skills.tags).toBe("SEO, Ads")
    expect(byType.services_list.s1_name).toBe("Coaching")
    expect(byType.services_list.s1_icon).toBe("💪")
    expect(byType.menu_section.item1_price).toBe("8€")
    expect(byType.pricing.title1).toBe("Pro")
    // La preuve, elle, n'est jamais relayée — même écrite dans la description :
    // personne d'autre que ses clients ne peut la donner (lot v92).
    expect(byType.testimonials.stars1).toBe("")
    expect(byType.testimonials.name1).toBe("")
    expect(byType.faq.a1).toBe("Oui")
    expect(byType.opening_hours.mon_fri).toBe("9h-18h")
    expect(byType.opening_hours.note).toBe("Sur RDV")
    expect(byType.cta_button.url).toBe("https://calendly.com")
    expect(byType.social_links.instagram).toBe("https://instagram.com/x")
    expect(byType.google_maps_embed.address).toBe("12 rue de Paris")

    // Et sans description, la même structure arrive sans aucun de ces faits.
    const nu = Object.fromEntries(aiBriefToTemplate(brief).blocks.map(b => [b.type, b.content]))
    expect(nu.menu_section.item1_name, "la structure doit rester").toBe("Soupe")
    for (const [type, champ] of [["menu_section", "item1_price"], ["opening_hours", "mon_fri"],
      ["google_maps_embed", "address"], ["cta_button", "url"], ["social_links", "instagram"]] as const) {
      expect(nu[type][champ], `${type}.${champ}`).toBe("")
    }
  })

  it("plafonne les listes à 3 (rendu public) et ignore les lignes vides", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ label: `P${i}`, value: `${i}€`, detail: "" }))
    const t = aiBriefToTemplate({ name: "X", ambiance: "gold", sections: [
      { kind: "menu", title: "Carte", text: "", items: [...many, { label: "", value: "", detail: "" }] },
      { kind: "services", title: "S", text: "", items: many },
    ] })
    const menu = t.blocks.find(b => b.type === "menu_section")!.content
    expect(menu.item3_name).toBe("P2")
    expect(menu.item4_name).toBeUndefined()
    const svc = t.blocks.find(b => b.type === "services_list")!.content
    expect(svc.s3_name).toBe("P2")   // le rendu public ne lit que s1..s3
    expect(svc.s4_name).toBeUndefined()
  })

  it("cta : n'accepte comme URL que ce qui ressemble à un lien (jamais une phrase)", () => {
    const phrase = aiBriefToTemplate({ ambiance: "gold", sections: [{ kind: "cta", title: "Réserver", text: "Contactez-nous vite", items: [] }] })
    // Valait « # » avant le lot v92 : un bouton mort en ligne, qui a l'air d'un
    // lien. Sans lien réel, l'emplacement reste vide et l'écran de publication
    // le signale (« Bouton « Réserver » sans lien »).
    expect(phrase.blocks.find(b => b.type === "cta_button")!.content.url).toBe("")
    // Et un vrai lien n'est gardé que s'il vient de la description.
    const withUrl = aiBriefToTemplate(
      { ambiance: "gold", sections: [{ kind: "cta", title: "Réserver", text: "une phrase", items: [{ label: "", value: "calendly.com/x", detail: "" }] }] },
      "Réservations sur calendly.com/x",
    )
    expect(withUrl.blocks.find(b => b.type === "cta_button")!.content.url).toBe("calendly.com/x")
  })

  it("social : un réseau nommé sans lien ne devient pas un lien vers l'accueil du réseau", () => {
    // Le mapper repliait sur « https://twitch.tv » / « https://t.me » : sur la
    // page d'un commerçant, ce n'est pas son compte, c'est l'accueil du réseau.
    // Un bouton qui promet un profil et n'y mène pas (lot v92).
    const t = aiBriefToTemplate({ ambiance: "gold", sections: [{ kind: "social", title: "", text: "", items: [
      { label: "Twitch", value: "", detail: "" },
      { label: "Telegram", value: "", detail: "" },
    ] }] })
    const soc = t.blocks.find(b => b.type === "social_links")!.content
    expect(soc.twitch).toBeUndefined()
    expect(soc.telegram).toBeUndefined()
  })

  it("kind inconnu ou section vide -> ignoré (pas de bloc parasite)", () => {
    const t = aiBriefToTemplate({ name: "X", ambiance: "gold", sections: [
      { kind: "inconnu", title: "?", text: "", items: [] },
      { kind: "services", title: "", text: "", items: [] }, // vide -> null
      { kind: "faq", title: "", text: "", items: [] },      // vide -> null
    ] })
    expect(t.blocks.map(b => b.type)).toEqual(["profile"])
  })

  it("robuste aux entrées non-tableau / null", () => {
    expect(() => aiBriefToTemplate({} as any)).not.toThrow()
    expect(() => aiBriefToTemplate({ sections: null } as any)).not.toThrow()
    expect(() => aiBriefToTemplate(null as any)).not.toThrow()
    expect(aiBriefToTemplate(null as any).blocks[0].type).toBe("profile")
  })

  it("réseau social : libellés libres normalisés, et seuls les vrais liens gardés", () => {
    const t = aiBriefToTemplate({ name: "X", ambiance: "gold", sections: [
      { kind: "social", title: "", text: "", items: [
        { label: "insta", value: "", detail: "" },
        { label: "Le Facebook", value: "https://fb.com/x", detail: "" },
        { label: "zzz", value: "", detail: "" },
      ] },
    ] }, "Notre page facebook : https://fb.com/x")
    const soc = t.blocks.find(b => b.type === "social_links")!.content
    // « insta » sans URL ne produit plus « https://instagram.com » (lot v92).
    expect(soc.instagram).toBeUndefined()
    expect(soc.facebook).toBe("https://fb.com/x")
    expect(soc.zzz).toBeUndefined()
  })

  it("schéma : enum ambiance/kind cohérent avec les constantes", () => {
    expect((AI_BRIEF_SCHEMA.properties.ambiance as any).enum).toEqual(AMBIANCE_KEYS)
    expect((AI_BRIEF_SCHEMA.properties.sections.items.properties.kind as any).enum).toEqual([...AI_SECTION_KINDS])
    expect(buildSystemPrompt()).toContain("QRowg")
  })
})
