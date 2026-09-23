import { describe, it, expect } from "vitest"
import { hasMeaningfulText, hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "./blockEmptyState"

describe("hasMeaningfulText", () => {
  it("vide / espaces / non-texte → faux", () => {
    expect(hasMeaningfulText("")).toBe(false)
    expect(hasMeaningfulText("   ")).toBe(false)
    expect(hasMeaningfulText("\n\t")).toBe(false)
    expect(hasMeaningfulText(undefined)).toBe(false)
    expect(hasMeaningfulText(null)).toBe(false)
    expect(hasMeaningfulText(0 as any)).toBe(false)
  })
  it("texte réel → vrai", () => {
    expect(hasMeaningfulText("Transparence")).toBe(true)
    expect(hasMeaningfulText("  x  ")).toBe(true)
  })
})

// Champ « significatif » par famille (celui qui décide de la publication).
const KEY: Record<string, (v: string) => Record<string, any>> = {
  values: v => ({ [`v1_label`]: v }),
  // Lot v166 : douze blocs disparaissaient de la page sans que l'éditeur le dise.
  // Leur modèle savait déjà : le détecteur l'appelle, et voici de quoi l'éprouver.
  advantages: v => ({ adv1: v }),
  app_download: v => ({ ios_url: v }),
  before_after: v => ({ before_img: v }),
  favorite_links: v => ({ link_1_label: v }),
  image: v => ({ src: v }),
  languages: v => ({ lang_1_name: v }),
  portfolio_work: v => ({ work1_title: v }),
  pricing: v => ({ title1: v }),
  product_catalog: v => ({ p1_name: v }),
  services_list: v => ({ s1_name: v }),
  spotify_player: v => ({ url: v }),
  video_local: v => ({ src: v }),
  process_steps: v => ({ [`s1_title`]: v }),
  business_certifications: v => ({ [`c1_name`]: v }),
  on_site_services: v => ({ [`s1_label`]: v }),
  event_program: v => ({ [`s1_title`]: v }),
  event_guests: v => ({ [`g1_name`]: v }),
  lineup: v => ({ [`a1_name`]: v }),
  discography: v => ({ [`a1_title`]: v }),
  concerts: v => ({ [`c1_city`]: v }),
  merch: v => ({ [`name1`]: v }),
  trust_badge: v => ({ [`b1_label`]: v }),
  info_table: v => ({ [`r1_label`]: v }),
  engagements: v => ({ [`e1`]: v }),
  stats_block: v => ({ [`s1_value`]: v }),
  grid_section: v => ({ [`c1_title`]: v }),
  tabs_block: v => ({ [`tab1_label`]: v }),
  accordion_block: v => ({ [`a1_title`]: v }),
  two_columns: v => ({ col1_title: v }),
  // Les dix blocs qui affichaient des chiffres et des noms inventés dans l'aperçu.
  promo_code: v => ({ code: v }),
  sales_counter: v => ({ count: v }),
  participants_count: v => ({ count: v }),
  scan_counter: v => ({ count: v }),
  featured_product: v => ({ name: v }),
  quote_block: v => ({ quote: v }),
  founder_message: v => ({ message: v }),
  info_box: v => ({ message: v }),
  google_reviews_block: v => ({ r1_name: v }),
  event_access: v => ({ address: v }),
  // Vague 9 du renderer partage : quatre blocs qui disparaissaient en ligne sans
  // que la doctrine ne le declare.
  logo_wall: v => ({ logo1_name: v }),
  partners: v => ({ logo1_name: v }),
  // 10 septembre : la preuve sociale n'est plus pré-remplie par le produit.
  testimonials: v => ({ name1: v }),
  video_testimonials: v => ({ t1_name: v }),
  logo_marquee: v => ({ name1: v }),
  avatar_row: v => ({ count: v }),
  stat_hero: v => ({ value: v }),
  google_maps_embed: v => ({ address: v }),
  // Les blocs d'action (lot v72) : leur destination n'est pas toujours une url.
  call_button:       v => ({ phone: v }),
  whatsapp_button:   v => ({ phone: v }),
  email_button:      v => ({ email: v }),
  directions_button: v => ({ address: v }),
  booking_button:    v => ({ url: v }),
  table_booking:     v => ({ url: v }),
  donation:          v => ({ url: v }),
  download_file:     v => ({ url: v }),
  google_review:     v => ({ url: v }),
  video:             v => ({ url: v }),
  // L'hôte doit être autorisé ET la valeur réelle : une chaîne blanche ne
  // devient pas une adresse parce qu'on la colle derrière un domaine valide.
  embed_block:       v => ({ url: v.trim() ? `https://www.youtube.com/embed/${v.trim()}` : v }),
  spotify_embed:     v => ({ url: v }),
  audio_player:      v => ({ src: v }),
  certifications: v => ({ cert_1_name: v }),
  legal_info: v => ({ siret: v }),
  // Vague 10.
  company: v => ({ company_name: v }),
  journey: v => ({ line_1: v }),
  expertise: v => ({ s1_name: v }),
  // Vague 11.
  tickets_left: v => ({ count: v }),
  limited_offer: v => ({ title: v }),
  vcard: v => ({ name: v }),
  // Balayage du 6 septembre au soir.
  rich_text: v => ({ text: v }),
  cover_banner: v => ({ cover_title: v }),
  product: v => ({ name: v }),
  availability: v => ({ status: v }),
  section_banner: v => ({ title: v }),
  calendly: v => ({ url: v }),
  free_gift: v => ({ url: v }),
  instagram_feed: v => ({ cta_url: v }),
  // Vague 25 : six blocs qui publiaient leur décor sans rien dedans.
  bio: v => ({ text: v }),
  skills: v => ({ tags: v }),
  event_info: v => ({ name: v }),
  menu_section: v => ({ category: v }),
  promo_banner: v => ({ text: v }),
  order_online: v => ({ url: v }),
  // Lot v152 : cinq blocs qui dessinaient « Mon Album », « Mon Podcast »,
  // « Mon document PDF », « Mon événement », « Offrez une expérience » dans
  // l'aperçu, pour une page qui ne publiait rien.
  gift_card: v => ({ title: v }),
  event_ticketing: v => ({ event_name: v }),
  pdf_viewer: v => ({ title: v }),
  album_block: v => ({ title: v }),
  podcast_links: v => ({ podcast_name: v }),
  // Lot v154 : trois de plus, dont l'adapter éditeur savait déjà dire
  // « invisible en ligne » — il ne leur manquait que le détecteur.
  heading: v => ({ text: v }),
  menu_tabs: v => ({ sec1_title: v }),
  timeline: v => ({ e1_title: v }),
  // Lot v167 : vingt-neuf blocs de plus. Leur modèle décidait déjà — il rend
  // l'objet à publier ou `null` — et le détecteur l'appelle. Voici de quoi
  // l'éprouver : le champ qui, à lui seul, fait exister le bloc.
  packs: v => ({ pack1_name: v }),
  services_pricing: v => ({ s1_name: v }),
  google_maps: v => ({ address: v }),
  quick_contact: v => ({ phone: v }),
  cta_button: v => ({ label: v }),
  team: v => ({ m1_name: v }),
  multi_contact: v => ({ c1_name: v }),
  profile: v => ({ name: v }),
  opening_hours: v => ({ mon_fri: v }),
  gallery: v => ({ img1: v }),
  social_links: v => ({ instagram: v }),
  about: v => ({ title: v }),
  announcement: v => ({ title: v }),
  faq: v => ({ q1: v }),
  offer_comparison: v => ({ plan1_name: v }),
  // La famille « chaînes » n'existe que pour envoyer quelque part : c'est
  // l'adresse qui fait le bloc, jamais le pseudo seul.
  tiktok_feed: v => ({ cta_url: v }),
  youtube_channel: v => ({ cta_url: v }),
  twitch_live: v => ({ cta_url: v }),
  discord_server: v => ({ cta_url: v }),
  telegram_channel: v => ({ cta_url: v }),
  social_feature: v => ({ network: "instagram", url: v }),
  add_to_calendar: v => ({ event_name: v }),
  ticketing: v => ({ event_name: v }),
  hero_banner: v => ({ title: v }),
  section_block: v => ({ title: v }),
  latest_release: v => ({ title: v }),
  playlist_block: v => ({ title: v }),
  presave: v => ({ release_name: v }),
  music_links: v => ({ spotify: v }),
  // Lot v170 : quatorze blocs de mise en page. Leur condition vivait dans leur
  // adapter public ; elle est déclarée, et les trois côtés la lisent au même
  // endroit. Le champ ci-dessous est celui qui, seul, fait exister le bloc.
  free_section: v => ({ title: v }),
  image_text: v => ({ title: v }),
  split_panel: v => ({ l_title: v }),
  overlay_card: v => ({ title: v }),
  frame_box: v => ({ title: v }),
  banner_strip: v => ({ text: v }),
  full_bleed_image: v => ({ image: v }),
  ribbon_banner: v => ({ text: v }),
  big_statement: v => ({ text: v }),
  text_columns: v => ({ text: v }),
  card_link: v => ({ title: v }),
  toggle_content: v => ({ text: v }),
  highlight_box: v => ({ text: v }),
  anchor_target: v => ({ name: v }),
}

/**
 * Ce qui compte comme « réel » pour un champ que la page VALIDE (lot v152).
 *
 * Le mot « Réel » suffisait tant que le détecteur demandait seulement « y a-t-il
 * du texte ? ». Il pose maintenant la question de la page — « est-ce un numéro,
 * une adresse e-mail, un lien Spotify ? » — et « Réel » n'est aucun des trois.
 * Ce n'est pas le test qui a raison ici : c'est la page.
 */
const REEL: Record<string, string> = {
  call_button: "+33 6 12 34 56 78",
  whatsapp_button: "+33 6 12 34 56 78",
  email_button: "contact@exemple.fr",
  video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  spotify_embed: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
  embed_block: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  // Lot v167 : la galerie passe ses photos par le contrat de média du produit
  // (`safeMediaSrc`, lot v159). « Réel » n'est pas une image.
  gallery: "https://exemple.supabase.co/photo.png",
  // Lot v170 : l'image pleine largeur passe par le contrat de média du produit.
  full_bleed_image: "https://exemple.supabase.co/photo.png",
}

describe("hasPublishableContent — toutes les familles listées sont couvertes", () => {
  it("chaque type détecteur a un cas de test", () => {
    for (const t of EMPTY_STATE_BLOCK_TYPES) expect(KEY[t], `manque un test pour ${t}`).toBeTypeOf("function")
  })

  for (const type of Object.keys(KEY)) {
    it(`${type} : vide → false`, () => {
      expect(hasPublishableContent(type, {})).toBe(false)
      expect(hasPublishableContent(type, undefined)).toBe(false)
    })
    it(`${type} : espaces seuls → false (aucune carte fantôme)`, () => {
      expect(hasPublishableContent(type, KEY[type]("   "))).toBe(false)
    })
    it(`${type} : un item réel → true`, () => {
      expect(hasPublishableContent(type, KEY[type](REEL[type] ?? "Réel"))).toBe(true)
    })
  }
})

describe("hasPublishableContent — listes mixtes / cas particuliers", () => {
  it("values : premier vide, deuxième rempli → true (pas d'exclusion du vrai contenu)", () => {
    expect(hasPublishableContent("values", { v1_label: "", v2_label: "Qualité" })).toBe(true)
  })
  it("merch : seul le 3e produit rempli → true", () => {
    expect(hasPublishableContent("merch", { name1: "", name2: "  ", name3: "Vinyle" })).toBe(true)
  })
  it("lineup : uniquement des espaces sur 4 artistes → false", () => {
    expect(hasPublishableContent("lineup", { a1_name: " ", a2_name: "", a3_name: "  ", a4_name: "" })).toBe(false)
  })
  it("two_columns : seul le texte de la colonne 2 rempli → true", () => {
    expect(hasPublishableContent("two_columns", { col2_text: "Bonjour" })).toBe(true)
  })
  it("type hors périmètre → true (jamais masqué par erreur)", () => {
    // Réancré au lot v167 (`profile` avait reçu son détecteur), puis au lot
    // v170 (`free_section` aussi). `stack_cards` prend la place : il reste dans
    // le cliquet des blocs dont la condition porte sur une LISTE d'items, et
    // qu'aucun modèle ne décide encore.
    expect(hasPublishableContent("stack_cards", {})).toBe(true)
    expect(hasPublishableContent("inconnu", {})).toBe(true)
  })
})
