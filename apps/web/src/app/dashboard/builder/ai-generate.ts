// QRfolio — Génération de page par IA.
// L'IA ne produit qu'un BRIEF structuré et simple (nom, accroche, ambiance, sections en texte).
// Le mapper PUR ci-dessous transforme ce brief en un PageTemplate valide (types + clés de blocs réels),
// donc l'IA ne peut jamais émettre de bloc malformé. Fichier sans React -> testable (ai-generate.test.ts).
import { themeForAmbiance, AMBIANCE_KEYS, type PageTemplate } from "./page-templates"

// ── Schéma de sortie imposé à l'IA (JSON Schema pour output_config.format) ────────
export const AI_SECTION_KINDS = [
  "about", "services", "menu", "pricing", "testimonials",
  "faq", "hours", "cta", "announcement", "social", "map", "skills",
] as const

export const AI_BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    tagline: { type: "string" },
    badge: { type: "string" },
    ambiance: { type: "string", enum: AMBIANCE_KEYS },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kind: { type: "string", enum: [...AI_SECTION_KINDS] },
          title: { type: "string" },
          text: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                label: { type: "string" },
                value: { type: "string" },
                detail: { type: "string" },
              },
              required: ["label", "value", "detail"],
            },
          },
        },
        required: ["kind", "title", "text", "items"],
      },
    },
  },
  required: ["name", "tagline", "badge", "ambiance", "sections"],
} as const

// ── Types du brief (côté TS) ──────────────────────────────────────────────────────
export type AiItem = { label?: string; value?: string; detail?: string }
export type AiSection = { kind?: string; title?: string; text?: string; items?: AiItem[] }
export type AiBrief = {
  name?: string; tagline?: string; badge?: string; ambiance?: string; sections?: AiSection[]
}

// Nettoyage doux : coupe les chaînes trop longues, coerce en string.
const s = (v: unknown, max = 400): string => (typeof v === "string" ? v : v == null ? "" : String(v)).slice(0, max).trim()
const nonEmpty = (v: string) => v.length > 0

// Réseau social : normalise un libellé libre ("Instagram", "insta") vers une clé connue.
const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "linkedin", "youtube", "twitter", "x", "whatsapp", "snapchat", "pinterest", "twitch", "telegram"]
// URL d'accueil correcte par réseau (les domaines diffèrent : twitch.tv, t.me, wa.me…).
const SOCIAL_FALLBACK: Record<string, string> = {
  instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com",
  linkedin: "https://linkedin.com", youtube: "https://youtube.com", twitter: "https://twitter.com",
  x: "https://x.com", whatsapp: "https://wa.me", snapchat: "https://snapchat.com",
  pinterest: "https://pinterest.com", twitch: "https://twitch.tv", telegram: "https://t.me",
}
// Une chaîne ressemble-t-elle à une URL/lien (pas une phrase) ? (pas d'espace + un caractère d'URL)
function looksLikeUrl(v: string): boolean {
  return v.length > 0 && !/\s/.test(v) && /[.#/@:]/.test(v)
}
function socialKeyOf(label: string): string | null {
  const l = label.toLowerCase().replace(/[^a-z]/g, "")
  if (!l) return null
  if (l.includes("insta")) return "instagram"
  if (l === "x" || l.includes("twitter")) return "twitter"
  if (l.includes("face")) return "facebook"
  if (l.includes("what")) return "whatsapp"
  const hit = SOCIAL_KEYS.find(k => l.includes(k))
  return hit || null
}

// ── Mapper PUR : brief IA -> PageTemplate valide ─────────────────────────────────
export function aiBriefToTemplate(brief: AiBrief): PageTemplate {
  const name = s(brief?.name, 80) || "Mon activité"
  const tagline = s(brief?.tagline, 120)
  const badge = s(brief?.badge, 40)
  const ambiance = typeof brief?.ambiance === "string" ? brief.ambiance : "gold"
  const theme = themeForAmbiance(ambiance)

  const blocks: PageTemplate["blocks"] = [
    { type: "profile", content: { name, tagline, badge } },
  ]

  const sections = Array.isArray(brief?.sections) ? brief.sections : []
  for (const sec of sections) {
    const kind = typeof sec?.kind === "string" ? sec.kind : ""
    const title = s(sec?.title, 80)
    const text = s(sec?.text, 800)
    const items = (Array.isArray(sec?.items) ? sec.items : []).map(it => ({
      label: s(it?.label, 120), value: s(it?.value, 80), detail: s(it?.detail, 240),
    }))
    const rows = items.filter(it => nonEmpty(it.label) || nonEmpty(it.value))
    const block = mapSection(kind, title, text, rows)
    if (block) blocks.push(block)
  }

  return {
    key: "ai_generated",
    group: "IA",
    label: name,
    emoji: "✨",
    desc: tagline || "Généré par l'IA",
    theme,
    blocks,
  }
}

type Block = { type: string; content: Record<string, string> } | null

function mapSection(kind: string, title: string, text: string, rows: { label: string; value: string; detail: string }[]): Block {
  switch (kind) {
    case "about": {
      const body = text || title
      if (!body) return null
      return { type: "bio", content: { text: body, align: "center" } }
    }
    case "skills": {
      const tags = rows.map(r => r.label).filter(nonEmpty).join(", ") || text
      if (!tags) return null
      return { type: "skills", content: { title: title || "Mes compétences", tags } }
    }
    case "services": {
      if (!rows.length) return null
      const content: Record<string, string> = { title: title || "Mes services" }
      rows.slice(0, 3).forEach((r, i) => {   // le rendu public de services_list ne lit que s1..s3
        const n = i + 1
        content[`s${n}_name`] = r.label
        content[`s${n}_desc`] = r.detail
        if (nonEmpty(r.value)) content[`s${n}_icon`] = r.value
      })
      return { type: "services_list", content }
    }
    case "menu": {
      if (!rows.length) return null
      const content: Record<string, string> = { category: title || "Notre carte" }
      rows.slice(0, 3).forEach((r, i) => {
        const n = i + 1
        content[`item${n}_name`] = r.label
        content[`item${n}_price`] = r.value
        content[`item${n}_desc`] = r.detail
      })
      return { type: "menu_section", content }
    }
    case "pricing": {
      if (!rows.length) return null
      const content: Record<string, string> = { title: title || "Mes tarifs" }
      rows.slice(0, 3).forEach((r, i) => {
        const n = i + 1
        content[`title${n}`] = r.label
        content[`price${n}`] = r.value
        content[`desc${n}`] = r.detail
      })
      return { type: "pricing", content }
    }
    case "testimonials": {
      if (!rows.length) return null
      const content: Record<string, string> = {}
      if (title) content.title = title
      rows.slice(0, 3).forEach((r, i) => {
        const n = i + 1
        content[`name${n}`] = r.label
        content[`text${n}`] = r.detail || r.value
        content[`stars${n}`] = /^[1-5]$/.test(r.value) ? r.value : "5"
      })
      return { type: "testimonials", content }
    }
    case "faq": {
      if (!rows.length) return null
      const content: Record<string, string> = { title: title || "Questions fréquentes" }
      rows.slice(0, 3).forEach((r, i) => {
        const n = i + 1
        content[`q${n}`] = r.label
        content[`a${n}`] = r.detail || r.value
      })
      return { type: "faq", content }
    }
    case "hours": {
      const content: Record<string, string> = { title: title || "Horaires", mode: "Simple (Lun-Ven / Sam / Dim)" }
      const slots = ["mon_fri", "saturday", "sunday"]
      rows.slice(0, 3).forEach((r, i) => { content[slots[i]] = r.value || r.detail || r.label })
      if (!rows.length && !text) return null
      if (text) content.note = text
      return { type: "opening_hours", content }
    }
    case "cta": {
      const label = title || rows[0]?.label || "Me contacter"
      // N'utilise comme href que ce qui ressemble vraiment à une URL (jamais une phrase).
      const url = [text, rows[0]?.value].find(v => v && looksLikeUrl(v)) || "#"
      return { type: "cta_button", content: { label, url, style: "gold", icon: "" } }
    }
    case "announcement": {
      const message = text || rows[0]?.detail
      if (!title && !message) return null
      return { type: "announcement", content: { type: "Information", title: title || "À la une", message: message || "", style: "Détaillé" } }
    }
    case "social": {
      const content: Record<string, string> = {}
      rows.forEach(r => {
        const key = socialKeyOf(r.label)
        if (key) content[key] = looksLikeUrl(r.value) ? r.value : (SOCIAL_FALLBACK[key] || `https://${key}.com`)
      })
      if (!Object.keys(content).length) content.instagram = "https://instagram.com"
      return { type: "social_links", content }
    }
    case "map": {
      const address = text || rows[0]?.value || rows[0]?.detail
      if (!address) return null
      return { type: "google_maps_embed", content: { label: title || "Nous trouver", address, zoom: "16" } }
    }
    default:
      return null
  }
}

// Prompt système (FR) — QRfolio, ambiances, ton premium. Exporté pour la route API.
export function buildSystemPrompt(): string {
  return [
    "Tu es le générateur de pages QRfolio : une page mobile « link in bio » premium, en français.",
    "À partir de la description d'une activité, tu produis un BRIEF structuré (JSON) pour construire la page.",
    "",
    "Règles :",
    "- Écris TOUT en français, ton premium et concret (pas de remplissage générique).",
    "- Invente un nom crédible si aucun n'est donné, une accroche courte et un petit badge (ex. « ⭐ Recommandé », « Ouvert »).",
    `- ambiance : choisis la clé la plus adaptée parmi : ${AMBIANCE_KEYS.join(", ")}. (velvet/neon = restauration chaleureuse, rose/spa = beauté/bien-être, navy/slate = corporate/tech, wood = artisan, ink/violet/coral = créatif, forest = association, gold = premium neutre, calm/cocktail = ambiance douce/nocturne.)`,
    "- sections : 4 à 7 sections pertinentes pour le métier, dans un ordre logique (présentation, offre, preuve sociale, infos pratiques, contact).",
    "- Types de section (kind) : about (texte), services, menu (restauration), pricing, testimonials, faq, hours (horaires), cta (bouton d'action), announcement (annonce), social (réseaux), map (adresse), skills (compétences).",
    "- items : lignes génériques {label, value, detail}. Selon le kind : services -> label=nom, value=emoji, detail=description ; menu -> label=plat, value=prix, detail=description ; pricing -> label=formule, value=prix, detail=détail ; testimonials -> label=auteur, value=note 1-5, detail=avis ; faq -> label=question, detail=réponse ; hours -> value=horaires (3 lignes : Lun-Ven, Samedi, Dimanche) ; social -> label=réseau, value=URL.",
    "- Remplis chaque champ requis (mets une chaîne vide si non pertinent). Reste sobre : 3 items max par section (menu, services, pricing, testimonials, faq).",
  ].join("\n")
}
