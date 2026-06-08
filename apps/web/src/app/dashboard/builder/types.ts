// QRfolio Builder — Types & Definitions

// ── Types de base ─────────────────────────────────────────────────────────────
export type BlockContent = Record<string, string>

export interface Block {
  id: string
  type: string
  content: BlockContent
  visible: boolean
}

export interface PageTheme {
  name: string
  bg: string
  surface: string
  primary: string
  accent: string
  text: string
  muted: string
  fontDisplay: string
  fontBody: string
  bgMode: "solid" | "gradient" | "pattern" | "image"
  bgGradient?: string
  bgPattern?: string
  bgImage?: string
}

// ── 50+ Google Fonts ──────────────────────────────────────────────────────────
export const GOOGLE_FONTS = [
  // Serif display
  "Cormorant Garamond", "Playfair Display", "Lora", "Merriweather", "EB Garamond",
  "Libre Baskerville", "Crimson Text", "DM Serif Display", "Spectral", "Bitter",
  // Sans-serif moderne
  "DM Sans", "Inter", "Outfit", "Plus Jakarta Sans", "Nunito",
  "Poppins", "Raleway", "Montserrat", "Work Sans", "Mulish",
  // Display / Titre
  "Syne", "Space Grotesk", "Manrope", "Bricolage Grotesque", "Cabinet Grotesk",
  "Clash Display", "Unbounded", "Epilogue", "Oswald", "Barlow Condensed",
  // Mono
  "JetBrains Mono", "Fira Code", "Space Mono", "Roboto Mono", "IBM Plex Mono",
  // Handwriting / Script
  "Dancing Script", "Pacifico", "Caveat", "Sacramento", "Great Vibes",
  "Kaushan Script", "Satisfy", "Lobster",
  // Fun / Unique
  "Abril Fatface", "Righteous", "Russo One", "Bangers", "Bebas Neue",
  "Anton", "Black Han Sans", "Fredoka One",
]

// ── Thèmes prédéfinis ─────────────────────────────────────────────────────────
export const PRESET_THEMES: Record<string, PageTheme> = {
  midnight_gold: {
    name: "Midnight Gold",
    bg: "#080808", surface: "#111009",
    primary: "#C9A84C", accent: "#39FF8F",
    text: "#F5F0E8", muted: "#8A8478",
    fontDisplay: "Cormorant Garamond", fontBody: "DM Sans",
    bgMode: "solid",
  },
  velvet_noir: {
    name: "Velvet Noir",
    bg: "#0A0A0F", surface: "#13131A",
    primary: "#A78BFA", accent: "#F472B6",
    text: "#F5F3FF", muted: "#9D84BC",
    fontDisplay: "Syne", fontBody: "DM Sans",
    bgMode: "gradient",
    bgGradient: "linear-gradient(135deg, #0A0A0F 0%, #13131A 50%, #0A0A0F 100%)",
  },
  ocean_deep: {
    name: "Ocean Deep",
    bg: "#020C18", surface: "#041828",
    primary: "#38BDF8", accent: "#818CF8",
    text: "#F0F9FF", muted: "#6494B0",
    fontDisplay: "Space Grotesk", fontBody: "Inter",
    bgMode: "gradient",
    bgGradient: "linear-gradient(135deg, #020C18 0%, #041828 60%, #060420 100%)",
  },
  forest_zen: {
    name: "Forest Zen",
    bg: "#040D06", surface: "#081A0C",
    primary: "#4ADE80", accent: "#86EFAC",
    text: "#F0FDF4", muted: "#6DB882",
    fontDisplay: "Lora", fontBody: "Nunito",
    bgMode: "solid",
  },
  sunset_fire: {
    name: "Sunset Fire",
    bg: "#0D0700", surface: "#1A1000",
    primary: "#F97316", accent: "#FCD34D",
    text: "#FFF7ED", muted: "#B89070",
    fontDisplay: "Raleway", fontBody: "Poppins",
    bgMode: "gradient",
    bgGradient: "linear-gradient(135deg, #0D0700 0%, #1A0A00 50%, #0D0700 100%)",
  },
  rose_luxe: {
    name: "Rose Luxe",
    bg: "#0D0508", surface: "#1A0812",
    primary: "#F472B6", accent: "#FB7185",
    text: "#FFF0F6", muted: "#B87A99",
    fontDisplay: "Playfair Display", fontBody: "DM Sans",
    bgMode: "gradient",
    bgGradient: "linear-gradient(135deg, #0D0508 0%, #1A0812 100%)",
  },
  pure_white: {
    name: "Pure White",
    bg: "#FFFFFF", surface: "#F8F8F8",
    primary: "#111111", accent: "#6366F1",
    text: "#111111", muted: "#6B7280",
    fontDisplay: "Playfair Display", fontBody: "Inter",
    bgMode: "solid",
  },
  minimal_cream: {
    name: "Minimal Cream",
    bg: "#FAFAF7", surface: "#F0EFE9",
    primary: "#C9A84C", accent: "#2D2D2D",
    text: "#1A1A1A", muted: "#8A8478",
    fontDisplay: "Cormorant Garamond", fontBody: "DM Sans",
    bgMode: "solid",
  },
  electric_neon: {
    name: "Electric Neon",
    bg: "#050505", surface: "#0F0F0F",
    primary: "#39FF8F", accent: "#FF006E",
    text: "#FFFFFF", muted: "#707070",
    fontDisplay: "Bebas Neue", fontBody: "Space Grotesk",
    bgMode: "pattern",
    bgPattern: "dots",
  },
  deep_space: {
    name: "Deep Space",
    bg: "#030308", surface: "#08081A",
    primary: "#818CF8", accent: "#E879F9",
    text: "#EDE9FE", muted: "#7C7A9E",
    fontDisplay: "Unbounded", fontBody: "Outfit",
    bgMode: "pattern",
    bgPattern: "stars",
  },
  aurora: {
    name: "Aurora",
    bg: "#020B0D", surface: "#041518",
    primary: "#22D3EE", accent: "#A855F7",
    text: "#F0FDFF", muted: "#64B5C4",
    fontDisplay: "Syne", fontBody: "Plus Jakarta Sans",
    bgMode: "gradient",
    bgGradient: "linear-gradient(135deg, #020B0D 0%, #041518 30%, #08101A 60%, #030B0D 100%)",
  },
  golden_luxury: {
    name: "Golden Luxury",
    bg: "#0A0700", surface: "#171200",
    primary: "#FBBF24", accent: "#F59E0B",
    text: "#FFFBEB", muted: "#A0885A",
    fontDisplay: "Cormorant Garamond", fontBody: "Raleway",
    bgMode: "pattern",
    bgPattern: "grid",
  },
  cherry_blossom: {
    name: "Cherry Blossom",
    bg: "#0F0408", surface: "#1A0812",
    primary: "#FB7185", accent: "#FBBF24",
    text: "#FFF1F2", muted: "#BF8A96",
    fontDisplay: "Dancing Script", fontBody: "Nunito",
    bgMode: "gradient",
    bgGradient: "linear-gradient(135deg, #0F0408 0%, #1A0812 50%, #100408 100%)",
  },
  matrix_code: {
    name: "Matrix Code",
    bg: "#000000", surface: "#050A05",
    primary: "#00FF41", accent: "#008F11",
    text: "#00FF41", muted: "#007A1A",
    fontDisplay: "JetBrains Mono", fontBody: "Fira Code",
    bgMode: "pattern",
    bgPattern: "matrix",
  },
  candy_pop: {
    name: "Candy Pop",
    bg: "#0D0510", surface: "#1A0820",
    primary: "#F0ABFC", accent: "#67E8F9",
    text: "#FAF5FF", muted: "#C084FC",
    fontDisplay: "Fredoka One", fontBody: "Poppins",
    bgMode: "gradient",
    bgGradient: "linear-gradient(135deg, #0D0510 0%, #1A0820 50%, #0D0510 100%)",
  },
}

// ── Reseaux sociaux ───────────────────────────────────────────────────────────
export const SOCIAL_NETWORKS = [
  { key: "instagram", label: "Instagram", icon: "📸", color: "#E1306C" },
  { key: "facebook", label: "Facebook", icon: "👥", color: "#1877F2" },
  { key: "tiktok", label: "TikTok", icon: "🎵", color: "#F5F0E8" },
  { key: "linkedin", label: "LinkedIn", icon: "💼", color: "#0A66C2" },
  { key: "twitter", label: "Twitter / X", icon: "🐦", color: "#1DA1F2" },
  { key: "youtube", label: "YouTube", icon: "▶️", color: "#FF0000" },
  { key: "snapchat", label: "Snapchat", icon: "👻", color: "#FFFC00" },
  { key: "pinterest", label: "Pinterest", icon: "📌", color: "#E60023" },
  { key: "whatsapp", label: "WhatsApp", icon: "💬", color: "#25D366" },
  { key: "telegram", label: "Telegram", icon: "✈️", color: "#26A5E4" },
  { key: "discord", label: "Discord", icon: "🎮", color: "#5865F2" },
  { key: "github", label: "GitHub", icon: "💻", color: "#F5F0E8" },
  { key: "spotify", label: "Spotify", icon: "🎧", color: "#1DB954" },
  { key: "website", label: "Site web", icon: "🌐", color: "#C9A84C" },
  { key: "email", label: "Email", icon: "✉️", color: "#39FF8F" },
  { key: "phone", label: "Telephone", icon: "📞", color: "#4ADE80" },
]

// ── Categories de blocs ───────────────────────────────────────────────────────
export const BLOCK_CATEGORIES = [
  { id: "identity", label: "Identite", icon: "👤", color: "#C9A84C", desc: "Profil, bio, presentation" },
  { id: "actions", label: "Actions", icon: "⚡", color: "#39FF8F", desc: "Boutons, liens, CTA" },
  { id: "social", label: "Reseaux", icon: "📲", color: "#1DA1F2", desc: "Liens reseaux sociaux" },
  { id: "commerce", label: "Commerce", icon: "🛍️", color: "#F97316", desc: "Produits, tarifs, promo" },
  { id: "media", label: "Medias", icon: "🎬", color: "#A78BFA", desc: "Images, videos, galeries" },
  { id: "info", label: "Infos", icon: "📋", color: "#38BDF8", desc: "Texte, FAQ, temoignages" },
  { id: "business", label: "Business", icon: "🏢", color: "#EC4899", desc: "Maps, horaires, contact" },
  { id: "music", label: "Musique", icon: "🎵", color: "#1DB954", desc: "Spotify, plateformes" },
  { id: "event", label: "Event", icon: "🎉", color: "#F472B6", desc: "Countdown, evenements" },
  { id: "layout", label: "Mise en page", icon: "📐", color: "#8A8478", desc: "Espaceurs, separateurs" },
]

// ── Definitions des blocs ─────────────────────────────────────────────────────
export interface BlockField {
  key: string
  label: string
  type: "text" | "textarea" | "url" | "select" | "color" | "image" | "date"
  placeholder?: string
  options?: string[]
  hint?: string
}

export interface BlockDef {
  label: string
  description: string
  icon: string
  color: string
  category: string
  defaultContent: BlockContent
  fields: BlockField[]
}

export const BLOCK_DEFS: Record<string, BlockDef> = {
  // ── Identite ──────────────────────────────────────────────────────────────
  profile: {
    label: "Profil", description: "Photo, nom, accroche et badge",
    icon: "👤", color: "#C9A84C", category: "identity",
    defaultContent: { name: "Mon Nom", tagline: "Mon activite", badge: "" },
    fields: [
      { key: "name", label: "Nom complet", type: "text", placeholder: "Jean Dupont" },
      { key: "tagline", label: "Accroche", type: "text", placeholder: "Developpeur, artiste, coach..." },
      { key: "avatar", label: "Photo de profil", type: "image" },
      { key: "badge", label: "Badge (optionnel)", type: "text", placeholder: "Disponible, Nouveau, Pro..." },
    ],
  },
  bio: {
    label: "Bio", description: "Texte de presentation libre",
    icon: "✍️", color: "#C9A84C", category: "identity",
    defaultContent: { text: "Bienvenue sur ma page !", align: "left" },
    fields: [
      { key: "text", label: "Texte", type: "textarea", placeholder: "Decris-toi en quelques mots..." },
      { key: "align", label: "Alignement", type: "select", options: ["left", "center", "right"] },
    ],
  },
  skills: {
    label: "Competences", description: "Tags de competences ou interets",
    icon: "🏷️", color: "#C9A84C", category: "identity",
    defaultContent: { title: "Mes competences", tags: "React, Design, Marketing" },
    fields: [
      { key: "title", label: "Titre (optionnel)", type: "text", placeholder: "Mes competences" },
      { key: "tags", label: "Tags (separes par virgule)", type: "text", placeholder: "React, Design, Marketing" },
    ],
  },
  // ── Actions ───────────────────────────────────────────────────────────────
  cta_button: {
    label: "Bouton CTA", description: "Bouton d'appel a l'action",
    icon: "⚡", color: "#39FF8F", category: "actions",
    defaultContent: { label: "Me contacter", url: "#", style: "gold", icon: "" },
    fields: [
      { key: "label", label: "Texte du bouton", type: "text", placeholder: "Me contacter" },
      { key: "url", label: "Lien", type: "url", placeholder: "https://" },
      { key: "icon", label: "Emoji (optionnel)", type: "text", placeholder: "📞" },
      { key: "style", label: "Style", type: "select", options: ["gold", "neon", "outline", "ghost", "red"] },
      { key: "full_width", label: "Pleine largeur", type: "select", options: ["yes", "no"] },
    ],
  },
  calendly: {
    label: "Calendly", description: "Bouton de prise de RDV",
    icon: "📅", color: "#39FF8F", category: "actions",
    defaultContent: { label: "Reserver un creneau", url: "https://calendly.com", description: "" },
    fields: [
      { key: "label", label: "Titre", type: "text", placeholder: "Reserver un appel" },
      { key: "url", label: "Lien Calendly", type: "url", placeholder: "https://calendly.com/monnom" },
      { key: "description", label: "Description", type: "text", placeholder: "30 min - Gratuit" },
    ],
  },
  // ── Reseaux sociaux ───────────────────────────────────────────────────────
  social_links: {
    label: "Reseaux sociaux", description: "Liens vers tes profils",
    icon: "📲", color: "#1DA1F2", category: "social",
    defaultContent: {},
    fields: SOCIAL_NETWORKS.map(n => ({
      key: n.key, label: n.label, type: "url" as const, placeholder: `https://${n.key}.com/monprofil`
    })),
  },
  instagram_feed: {
    label: "Instagram Feed", description: "Grille de photos Instagram",
    icon: "📸", color: "#E1306C", category: "social",
    defaultContent: { username: "@moncompte", cta_label: "Me suivre", cta_url: "https://instagram.com" },
    fields: [
      { key: "username", label: "Username Instagram", type: "text", placeholder: "@moncompte" },
      { key: "cta_label", label: "Texte du bouton", type: "text", placeholder: "Me suivre" },
      { key: "cta_url", label: "Lien profil", type: "url", placeholder: "https://instagram.com/moncompte" },
    ],
  },
  // ── Commerce ──────────────────────────────────────────────────────────────
  product: {
    label: "Produit", description: "Fiche produit avec prix et CTA",
    icon: "📦", color: "#F97316", category: "commerce",
    defaultContent: { name: "Mon produit", price: "29€", description: "", cta_label: "Commander", cta_url: "#" },
    fields: [
      { key: "name", label: "Nom du produit", type: "text", placeholder: "Formation Marketing" },
      { key: "price", label: "Prix", type: "text", placeholder: "29€" },
      { key: "old_price", label: "Ancien prix (optionnel)", type: "text", placeholder: "59€" },
      { key: "description", label: "Description", type: "textarea", placeholder: "Description du produit..." },
      { key: "image", label: "Image", type: "image" },
      { key: "cta_label", label: "Texte bouton", type: "text", placeholder: "Commander" },
      { key: "cta_url", label: "Lien", type: "url", placeholder: "https://" },
    ],
  },
  pricing: {
    label: "Tarifs", description: "Grille de prix / abonnements",
    icon: "💰", color: "#F97316", category: "commerce",
    defaultContent: { title: "Mes tarifs", title1: "Essentiel", price1: "49€", desc1: "Par mois" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mes tarifs" },
      { key: "title1", label: "Plan 1 — Nom", type: "text", placeholder: "Essentiel" },
      { key: "price1", label: "Plan 1 — Prix", type: "text", placeholder: "49€" },
      { key: "desc1", label: "Plan 1 — Description", type: "text", placeholder: "Par mois" },
      { key: "title2", label: "Plan 2 — Nom", type: "text", placeholder: "Pro" },
      { key: "price2", label: "Plan 2 — Prix", type: "text", placeholder: "99€" },
      { key: "desc2", label: "Plan 2 — Description", type: "text", placeholder: "Par mois" },
      { key: "title3", label: "Plan 3 — Nom", type: "text", placeholder: "Business" },
      { key: "price3", label: "Plan 3 — Prix", type: "text", placeholder: "199€" },
      { key: "desc3", label: "Plan 3 — Description", type: "text", placeholder: "Par mois" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Commencer" },
      { key: "cta_url", label: "Lien bouton", type: "url", placeholder: "https://" },
    ],
  },
  promo_banner: {
    label: "Banniere promo", description: "Offre speciale ou reduction",
    icon: "🎁", color: "#F97316", category: "commerce",
    defaultContent: { emoji: "🎉", text: "Offre speciale", subtext: "Valable ce mois", cta_label: "Profiter", cta_url: "#" },
    fields: [
      { key: "emoji", label: "Emoji", type: "text", placeholder: "🎉" },
      { key: "text", label: "Titre", type: "text", placeholder: "Offre speciale -50%" },
      { key: "subtext", label: "Sous-titre", type: "text", placeholder: "Valable jusqu au 31" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Profiter de l offre" },
      { key: "cta_url", label: "Lien", type: "url", placeholder: "https://" },
    ],
  },
  menu_section: {
    label: "Menu / Carte", description: "Section de menu restaurant",
    icon: "🍽️", color: "#EF4444", category: "commerce",
    defaultContent: { category: "Entrees" },
    fields: [
      { key: "category", label: "Categorie", type: "text", placeholder: "Entrees, Plats, Desserts..." },
      { key: "item1_name", label: "Plat 1 — Nom", type: "text", placeholder: "Salade cesar" },
      { key: "item1_price", label: "Plat 1 — Prix", type: "text", placeholder: "12€" },
      { key: "item1_desc", label: "Plat 1 — Description", type: "text", placeholder: "Laitue, parmesan, croutons" },
      { key: "item2_name", label: "Plat 2 — Nom", type: "text", placeholder: "Soupe du jour" },
      { key: "item2_price", label: "Plat 2 — Prix", type: "text", placeholder: "8€" },
      { key: "item2_desc", label: "Plat 2 — Description", type: "text", placeholder: "Selon saison" },
      { key: "item3_name", label: "Plat 3 — Nom", type: "text", placeholder: "Tartare de saumon" },
      { key: "item3_price", label: "Plat 3 — Prix", type: "text", placeholder: "16€" },
      { key: "item3_desc", label: "Plat 3 — Description", type: "text", placeholder: "Avocat, citron" },
    ],
  },
  services_list: {
    label: "Liste de services", description: "3 services avec icones",
    icon: "⚙️", color: "#7B61FF", category: "commerce",
    defaultContent: { title: "Mes services", s1_icon: "💻", s1_name: "Service 1", s1_desc: "Description" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mes services" },
      { key: "s1_icon", label: "Service 1 — Emoji", type: "text", placeholder: "💻" },
      { key: "s1_name", label: "Service 1 — Nom", type: "text", placeholder: "Developpement web" },
      { key: "s1_desc", label: "Service 1 — Description", type: "text", placeholder: "Sites et applications" },
      { key: "s2_icon", label: "Service 2 — Emoji", type: "text", placeholder: "🎨" },
      { key: "s2_name", label: "Service 2 — Nom", type: "text", placeholder: "Design" },
      { key: "s2_desc", label: "Service 2 — Description", type: "text", placeholder: "UI/UX, branding" },
      { key: "s3_icon", label: "Service 3 — Emoji", type: "text", placeholder: "🚀" },
      { key: "s3_name", label: "Service 3 — Nom", type: "text", placeholder: "Conseil" },
      { key: "s3_desc", label: "Service 3 — Description", type: "text", placeholder: "Strategie digitale" },
    ],
  },
  // ── Medias ────────────────────────────────────────────────────────────────
  image: {
    label: "Image", description: "Photo ou illustration",
    icon: "🖼️", color: "#A78BFA", category: "media",
    defaultContent: { src: "", caption: "", rounded: "rounded" },
    fields: [
      { key: "src", label: "Image", type: "image" },
      { key: "caption", label: "Legende (optionnel)", type: "text", placeholder: "Description de l image" },
      { key: "rounded", label: "Forme", type: "select", options: ["rounded", "square", "circle"] },
    ],
  },
  gallery: {
    label: "Galerie photos", description: "Grille de 2 a 6 photos",
    icon: "🎨", color: "#A78BFA", category: "media",
    defaultContent: { columns: "3" },
    fields: [
      { key: "columns", label: "Colonnes", type: "select", options: ["2", "3"] },
      { key: "img1", label: "Photo 1", type: "image" },
      { key: "img2", label: "Photo 2", type: "image" },
      { key: "img3", label: "Photo 3", type: "image" },
      { key: "img4", label: "Photo 4", type: "image" },
      { key: "img5", label: "Photo 5", type: "image" },
      { key: "img6", label: "Photo 6", type: "image" },
    ],
  },
  video: {
    label: "Video", description: "Video YouTube ou Vimeo",
    icon: "▶️", color: "#FF0000", category: "media",
    defaultContent: { url: "", title: "" },
    fields: [
      { key: "url", label: "Lien YouTube ou Vimeo", type: "url", placeholder: "https://youtube.com/watch?v=..." },
      { key: "title", label: "Titre (optionnel)", type: "text", placeholder: "Titre de la video" },
    ],
  },
  // ── Infos ─────────────────────────────────────────────────────────────────
  heading: {
    label: "Titre", description: "Titre ou sous-titre de section",
    icon: "📝", color: "#38BDF8", category: "info",
    defaultContent: { text: "Mon titre", size: "medium", align: "center", color: "primary" },
    fields: [
      { key: "text", label: "Titre", type: "text", placeholder: "Mon titre de section" },
      { key: "subtitle", label: "Sous-titre", type: "text", placeholder: "Une phrase de description" },
      { key: "size", label: "Taille", type: "select", options: ["small", "medium", "large", "xl"] },
      { key: "align", label: "Alignement", type: "select", options: ["left", "center", "right"] },
      { key: "color", label: "Couleur", type: "select", options: ["default", "primary", "accent", "muted"] },
    ],
  },
  rich_text: {
    label: "Texte", description: "Paragraphe de texte libre",
    icon: "📄", color: "#38BDF8", category: "info",
    defaultContent: { text: "", align: "left", size: "normal" },
    fields: [
      { key: "text", label: "Texte", type: "textarea", placeholder: "Votre texte ici..." },
      { key: "align", label: "Alignement", type: "select", options: ["left", "center", "right"] },
      { key: "size", label: "Taille", type: "select", options: ["small", "normal", "large"] },
    ],
  },
  faq: {
    label: "FAQ", description: "Questions / reponses accordeon",
    icon: "❓", color: "#38BDF8", category: "info",
    defaultContent: { title: "Questions frequentes" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Questions frequentes" },
      { key: "q1", label: "Question 1", type: "text", placeholder: "Comment ca fonctionne ?" },
      { key: "a1", label: "Reponse 1", type: "textarea", placeholder: "La reponse detaillee..." },
      { key: "q2", label: "Question 2", type: "text", placeholder: "Quel est votre delai ?" },
      { key: "a2", label: "Reponse 2", type: "textarea", placeholder: "" },
      { key: "q3", label: "Question 3", type: "text", placeholder: "Acceptez-vous les acomptes ?" },
      { key: "a3", label: "Reponse 3", type: "textarea", placeholder: "" },
      { key: "q4", label: "Question 4", type: "text", placeholder: "" },
      { key: "a4", label: "Reponse 4", type: "textarea", placeholder: "" },
      { key: "q5", label: "Question 5", type: "text", placeholder: "" },
      { key: "a5", label: "Reponse 5", type: "textarea", placeholder: "" },
    ],
  },
  testimonials: {
    label: "Temoignages", description: "Avis et retours clients",
    icon: "⭐", color: "#FFD700", category: "info",
    defaultContent: {},
    fields: [
      { key: "name1", label: "Avis 1 — Nom", type: "text", placeholder: "Marie D." },
      { key: "text1", label: "Avis 1 — Texte", type: "textarea", placeholder: "Excellent travail, je recommande !" },
      { key: "stars1", label: "Avis 1 — Etoiles", type: "select", options: ["5", "4", "3"] },
      { key: "name2", label: "Avis 2 — Nom", type: "text", placeholder: "Pierre M." },
      { key: "text2", label: "Avis 2 — Texte", type: "textarea", placeholder: "" },
      { key: "stars2", label: "Avis 2 — Etoiles", type: "select", options: ["5", "4", "3"] },
      { key: "name3", label: "Avis 3 — Nom", type: "text", placeholder: "Sophie L." },
      { key: "text3", label: "Avis 3 — Texte", type: "textarea", placeholder: "" },
      { key: "stars3", label: "Avis 3 — Etoiles", type: "select", options: ["5", "4", "3"] },
    ],
  },
  visit_counter: {
    label: "Compteur de vues", description: "Affiche le nombre de visiteurs",
    icon: "👁️", color: "#38BDF8", category: "info",
    defaultContent: { label: "visiteurs" },
    fields: [
      { key: "label", label: "Label", type: "text", placeholder: "visiteurs ce mois" },
    ],
  },
  // ── Business ──────────────────────────────────────────────────────────────
  google_maps: {
    label: "Adresse / Maps", description: "Lien vers Google Maps",
    icon: "📍", color: "#EC4899", category: "business",
    defaultContent: { label: "Mon adresse", address: "Paris, France" },
    fields: [
      { key: "label", label: "Nom du lieu", type: "text", placeholder: "Mon restaurant" },
      { key: "address", label: "Adresse", type: "text", placeholder: "12 rue de la Paix, 75001 Paris" },
      { key: "transport", label: "Acces transport", type: "text", placeholder: "Metro Opera - Ligne 3" },
    ],
  },
  opening_hours: {
    label: "Horaires", description: "Horaires d'ouverture",
    icon: "🕐", color: "#EC4899", category: "business",
    defaultContent: { title: "Horaires", mon_fri: "9h - 18h" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Nos horaires" },
      { key: "mon_fri", label: "Lundi — Vendredi", type: "text", placeholder: "9h - 18h" },
      { key: "saturday", label: "Samedi", type: "text", placeholder: "10h - 16h" },
      { key: "sunday", label: "Dimanche", type: "text", placeholder: "Ferme" },
      { key: "note", label: "Note (optionnel)", type: "text", placeholder: "Reservation recommandee" },
    ],
  },
  contact_form: {
    label: "Formulaire contact", description: "Formulaire nom, email, message",
    icon: "📬", color: "#EC4899", category: "business",
    defaultContent: { title: "Contactez-moi", button_label: "Envoyer" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Contactez-moi" },
      { key: "button_label", label: "Texte bouton", type: "text", placeholder: "Envoyer" },
      { key: "show_phone", label: "Champ telephone", type: "select", options: ["no", "yes"] },
    ],
  },
  reservation_form: {
    label: "Formulaire reservation", description: "Formulaire pour restaurants",
    icon: "📋", color: "#EF4444", category: "business",
    defaultContent: { title: "Reserver une table", button_label: "Reserver" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Reserver une table" },
      { key: "phone", label: "Telephone direct", type: "text", placeholder: "+33 1 23 45 67 89" },
      { key: "button_label", label: "Texte bouton", type: "text", placeholder: "Reserver" },
    ],
  },
  // ── Musique ───────────────────────────────────────────────────────────────
  spotify_player: {
    label: "Spotify", description: "Lien vers Spotify",
    icon: "🎧", color: "#1DB954", category: "music",
    defaultContent: { title: "Ecouter ma musique", url: "" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Mon dernier album" },
      { key: "url", label: "Lien Spotify", type: "url", placeholder: "https://open.spotify.com/..." },
    ],
  },
  music_links: {
    label: "Plateformes musicales", description: "Liens multi-plateformes",
    icon: "🎵", color: "#1DB954", category: "music",
    defaultContent: {},
    fields: [
      { key: "artist_name", label: "Nom artiste", type: "text", placeholder: "Mon Artiste" },
      { key: "spotify", label: "Spotify", type: "url", placeholder: "https://open.spotify.com/..." },
      { key: "apple_music", label: "Apple Music", type: "url", placeholder: "https://music.apple.com/..." },
      { key: "deezer", label: "Deezer", type: "url", placeholder: "https://deezer.com/..." },
      { key: "youtube_music", label: "YouTube Music", type: "url", placeholder: "https://music.youtube.com/..." },
      { key: "soundcloud", label: "SoundCloud", type: "url", placeholder: "https://soundcloud.com/..." },
    ],
  },
  // ── Event ─────────────────────────────────────────────────────────────────
  countdown: {
    label: "Countdown", description: "Compte a rebours",
    icon: "⏱️", color: "#F472B6", category: "event",
    defaultContent: { title: "Dans combien de temps...", date: "2025-12-31", subtitle: "" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Le lancement arrive dans..." },
      { key: "date", label: "Date cible", type: "date" },
      { key: "subtitle", label: "Sous-titre", type: "text", placeholder: "Soyez au rendez-vous !" },
    ],
  },
  event_info: {
    label: "Infos evenement", description: "Details d'un evenement",
    icon: "🎉", color: "#EC4899", category: "event",
    defaultContent: { name: "Mon evenement" },
    fields: [
      { key: "name", label: "Nom", type: "text", placeholder: "Soiree de lancement" },
      { key: "date", label: "Date", type: "text", placeholder: "Samedi 28 juin 2025" },
      { key: "time", label: "Heure", type: "text", placeholder: "19h00 - 23h00" },
      { key: "location", label: "Lieu", type: "text", placeholder: "Paris 11e" },
      { key: "price", label: "Prix", type: "text", placeholder: "Entree libre" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Je participe" },
      { key: "cta_url", label: "Lien", type: "url", placeholder: "https://" },
    ],
  },
  // ── Mise en page ──────────────────────────────────────────────────────────
  divider: {
    label: "Separateur", description: "Ligne decorative de separation",
    icon: "➖", color: "#8A8478", category: "layout",
    defaultContent: { style: "gold" },
    fields: [
      { key: "style", label: "Style", type: "select", options: ["gold", "line", "dots", "stars"] },
    ],
  },
  spacer: {
    label: "Espacement", description: "Espace vide entre les blocs",
    icon: "↕️", color: "#8A8478", category: "layout",
    defaultContent: { size: "md" },
    fields: [
      { key: "size", label: "Taille", type: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    ],
  },
  // ── Nouveaux blocs Actions ────────────────────────────────────────────────
  call_button: {
    label: "Appeler", description: "Bouton d appel telephonique direct",
    icon: "📞", color: "#39FF8F", category: "actions",
    defaultContent: { label: "Appeler maintenant", phone: "" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Appeler maintenant" },
      { key: "phone", label: "Numero de telephone", type: "text", placeholder: "+33 6 12 34 56 78" },
      { key: "icon", label: "Emoji", type: "text", placeholder: "📞" },
    ],
  },
  whatsapp_button: {
    label: "WhatsApp", description: "Ouvrir une conversation WhatsApp",
    icon: "💬", color: "#25D366", category: "actions",
    defaultContent: { label: "Discuter sur WhatsApp", phone: "", message: "" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Discuter sur WhatsApp" },
      { key: "phone", label: "Numero (avec indicatif)", type: "text", placeholder: "33612345678" },
      { key: "message", label: "Message pre-rempli", type: "text", placeholder: "Bonjour, j ai une question..." },
    ],
  },
  email_button: {
    label: "Email", description: "Bouton pour envoyer un email",
    icon: "✉️", color: "#38BDF8", category: "actions",
    defaultContent: { label: "Envoyer un email", email: "", subject: "" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Envoyer un email" },
      { key: "email", label: "Adresse email", type: "text", placeholder: "contact@monsite.com" },
      { key: "subject", label: "Sujet pre-rempli", type: "text", placeholder: "Demande de renseignements" },
    ],
  },
  download_file: {
    label: "Telecharger un fichier", description: "Bouton de telechargement document",
    icon: "📄", color: "#A78BFA", category: "actions",
    defaultContent: { label: "Telecharger la brochure", type_doc: "PDF" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Telecharger la brochure" },
      { key: "url", label: "Lien du fichier", type: "url", placeholder: "https://..." },
      { key: "type_doc", label: "Type", type: "select", options: ["PDF","Brochure","CV","Carte","Catalogue","Tarif"] },
      { key: "icon", label: "Emoji", type: "text", placeholder: "📄" },
    ],
  },
  vcard: {
    label: "Ajouter aux contacts", description: "vCard — ajouter la fiche contact",
    icon: "👤", color: "#C9A84C", category: "actions",
    defaultContent: { label: "Ajouter a mes contacts", name: "" },
    fields: [
      { key: "label", label: "Texte bouton", type: "text", placeholder: "Ajouter a mes contacts" },
      { key: "name", label: "Nom complet", type: "text", placeholder: "Jean Dupont" },
      { key: "phone", label: "Telephone", type: "text", placeholder: "+33 6 12 34 56 78" },
      { key: "email", label: "Email", type: "text", placeholder: "jean@email.com" },
      { key: "company", label: "Entreprise", type: "text", placeholder: "Studio PIXEL" },
      { key: "website", label: "Site web", type: "url", placeholder: "https://monsite.com" },
      { key: "address", label: "Adresse", type: "text", placeholder: "Paris, France" },
    ],
  },
  google_review: {
    label: "Laisser un avis Google", description: "Redirection vers Google Reviews",
    icon: "⭐", color: "#FBBF24", category: "actions",
    defaultContent: { label: "Donner un avis", url: "" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Donner un avis" },
      { key: "url", label: "Lien Google Review", type: "url", placeholder: "https://g.page/r/..." },
      { key: "stars", label: "Etoiles affichees", type: "select", options: ["5","4","3"] },
    ],
  },
  table_booking: {
    label: "Reserver une table", description: "Reservation restaurant externe",
    icon: "🍽️", color: "#EF4444", category: "actions",
    defaultContent: { label: "Reserver une table", platform: "TheFork" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Reserver une table" },
      { key: "url", label: "Lien reservation", type: "url", placeholder: "https://..." },
      { key: "platform", label: "Plateforme", type: "select", options: ["TheFork","Zenchef","OpenTable","URL personnalisee"] },
    ],
  },
  order_online: {
    label: "Commander en ligne", description: "Livraison ou commande en ligne",
    icon: "🛒", color: "#F97316", category: "actions",
    defaultContent: { label: "Commander maintenant", platform: "Uber Eats" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Commander maintenant" },
      { key: "url", label: "Lien commande", type: "url", placeholder: "https://..." },
      { key: "platform", label: "Plateforme", type: "select", options: ["Uber Eats","Deliveroo","Just Eat","DoorDash","Glovo","Site web"] },
    ],
  },
  free_gift: {
    label: "Cadeau gratuit", description: "Offrir un document ou ressource",
    icon: "🎁", color: "#EC4899", category: "actions",
    defaultContent: { label: "Recevoir mon guide gratuit", description: "" },
    fields: [
      { key: "label", label: "Texte bouton", type: "text", placeholder: "Recevoir mon guide gratuit" },
      { key: "description", label: "Description courte", type: "text", placeholder: "Guide PDF gratuit - 20 pages" },
      { key: "url", label: "Lien du fichier", type: "url", placeholder: "https://..." },
      { key: "emoji", label: "Emoji", type: "text", placeholder: "🎁" },
    ],
  },
  donation: {
    label: "Faire un don", description: "Soutenir le createur",
    icon: "☕", color: "#F59E0B", category: "actions",
    defaultContent: { label: "Soutenir mon travail", platform: "Ko-fi" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Soutenir mon travail" },
      { key: "url", label: "Lien", type: "url", placeholder: "https://ko-fi.com/..." },
      { key: "platform", label: "Plateforme", type: "select", options: ["Ko-fi","Buy Me A Coffee","Patreon","PayPal","Tipeee"] },
    ],
  },
  multi_cta: {
    label: "Multi CTA", description: "Plusieurs actions dans un seul bloc",
    icon: "⚡", color: "#39FF8F", category: "actions",
    defaultContent: { btn1_label: "Appeler", btn1_icon: "📞", btn1_url: "tel:", btn2_label: "WhatsApp", btn2_icon: "💬", btn2_url: "https://wa.me/" },
    fields: [
      { key: "btn1_icon", label: "Btn 1 — Emoji", type: "text", placeholder: "📞" },
      { key: "btn1_label", label: "Btn 1 — Texte", type: "text", placeholder: "Appeler" },
      { key: "btn1_url", label: "Btn 1 — Lien", type: "url", placeholder: "tel:+33..." },
      { key: "btn2_icon", label: "Btn 2 — Emoji", type: "text", placeholder: "💬" },
      { key: "btn2_label", label: "Btn 2 — Texte", type: "text", placeholder: "WhatsApp" },
      { key: "btn2_url", label: "Btn 2 — Lien", type: "url", placeholder: "https://wa.me/..." },
      { key: "btn3_icon", label: "Btn 3 — Emoji", type: "text", placeholder: "📅" },
      { key: "btn3_label", label: "Btn 3 — Texte", type: "text", placeholder: "Reserver" },
      { key: "btn3_url", label: "Btn 3 — Lien", type: "url", placeholder: "https://..." },
      { key: "btn4_icon", label: "Btn 4 — Emoji", type: "text", placeholder: "✉️" },
      { key: "btn4_label", label: "Btn 4 — Texte", type: "text", placeholder: "Email" },
      { key: "btn4_url", label: "Btn 4 — Lien", type: "url", placeholder: "mailto:..." },
    ],
  },
  app_download: {
    label: "Telecharger l application", description: "Liens App Store et Google Play",
    icon: "📲", color: "#818CF8", category: "actions",
    defaultContent: { label: "Telecharger l application", ios_url: "", android_url: "" },
    fields: [
      { key: "label", label: "Titre", type: "text", placeholder: "Telecharger l application" },
      { key: "ios_url", label: "Lien App Store", type: "url", placeholder: "https://apps.apple.com/..." },
      { key: "android_url", label: "Lien Google Play", type: "url", placeholder: "https://play.google.com/..." },
    ],
  },
  promo_code: {
    label: "Coupon promo", description: "Afficher un code promotionnel",
    icon: "🎟️", color: "#F97316", category: "actions",
    defaultContent: { code: "QRFOLIO10", description: "-10% sur votre commande" },
    fields: [
      { key: "code", label: "Code promo", type: "text", placeholder: "QRFOLIO10" },
      { key: "description", label: "Description", type: "text", placeholder: "-10% sur votre commande" },
      { key: "expires", label: "Date expiration", type: "text", placeholder: "30 juin 2025" },
    ],
  },
  limited_offer: {
    label: "Offre limitee", description: "Promotion temporaire urgente",
    icon: "⚡", color: "#EF4444", category: "actions",
    defaultContent: { title: "Offre limitee", description: "Valable jusqu au 30 juin", cta_label: "Profiter de l offre", cta_url: "#" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Offre speciale -30%" },
      { key: "description", label: "Description", type: "text", placeholder: "Valable jusqu au 30 juin" },
      { key: "expires", label: "Date limite", type: "text", placeholder: "30 juin 2025" },
      { key: "cta_label", label: "Texte bouton", type: "text", placeholder: "Profiter de l offre" },
      { key: "cta_url", label: "Lien", type: "url", placeholder: "https://..." },
    ],
  },
  booking_button: {
    label: "Prendre rendez-vous", description: "Reservation autre que Calendly",
    icon: "📅", color: "#38BDF8", category: "actions",
    defaultContent: { label: "Prendre rendez-vous", platform: "URL personnalisee" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Prendre rendez-vous" },
      { key: "url", label: "Lien", type: "url", placeholder: "https://..." },
      { key: "platform", label: "Plateforme", type: "select", options: ["Google Calendar","Microsoft Bookings","HubSpot Meetings","URL personnalisee"] },
      { key: "description", label: "Description", type: "text", placeholder: "30 min - Gratuit" },
    ],
  },
  payment_button: {
    label: "Paiement direct", description: "Encaisser un paiement en ligne",
    icon: "💳", color: "#39FF8F", category: "actions",
    defaultContent: { label: "Payer maintenant", platform: "Stripe" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Payer maintenant" },
      { key: "url", label: "Lien de paiement", type: "url", placeholder: "https://buy.stripe.com/..." },
      { key: "platform", label: "Plateforme", type: "select", options: ["Stripe","PayPal","Lydia","Revolut","SumUp"] },
      { key: "amount", label: "Montant affiche", type: "text", placeholder: "29€" },
    ],
  },
  quote_request: {
    label: "Demander un devis", description: "Redirection vers formulaire devis",
    icon: "📋", color: "#C9A84C", category: "actions",
    defaultContent: { label: "Demander un devis", url: "#" },
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Demander un devis" },
      { key: "url", label: "Lien formulaire", type: "url", placeholder: "https://..." },
      { key: "description", label: "Description", type: "text", placeholder: "Reponse sous 24h" },
    ],
  },
}

  // ── Nouveaux blocs Identite ───────────────────────────────────────────────
  cover_banner: {
    label: "Banniere / Cover", description: "Image de fond en haut de page",
    icon: "🖼️", color: "#C9A84C", category: "identity",
    defaultContent: { height: "md", overlay_opacity: "0.2" },
    fields: [
      { key: "src", label: "Image de banniere", type: "image" },
      { key: "height", label: "Hauteur", type: "select", options: ["sm", "md", "lg"] },
      { key: "overlay_color", label: "Couleur overlay", type: "color" },
      { key: "overlay_opacity", label: "Opacite overlay (0 a 1)", type: "text", placeholder: "0.3" },
      { key: "cover_title", label: "Titre sur la banniere", type: "text", placeholder: "Mon titre..." },
    ],
  },
  about: {
    label: "A propos", description: "Histoire et texte narratif long",
    icon: "📖", color: "#C9A84C", category: "identity",
    defaultContent: { title: "Mon histoire", emoji: "📖", collapsible: "yes" },
    fields: [
      { key: "emoji", label: "Emoji decoratif", type: "text", placeholder: "📖" },
      { key: "title", label: "Titre", type: "text", placeholder: "Mon histoire" },
      { key: "text", label: "Texte", type: "textarea", placeholder: "Racontez votre histoire..." },
      { key: "collapsible", label: "Afficher Lire la suite", type: "select", options: ["yes", "no"] },
    ],
  },
  availability: {
    label: "Disponibilite", description: "Statut de disponibilite pour freelances",
    icon: "🟢", color: "#39FF8F", category: "identity",
    defaultContent: { status: "available", message: "Ouvert aux nouvelles missions", cta_label: "Prendre contact", cta_url: "#" },
    fields: [
      { key: "status", label: "Statut", type: "select", options: ["available", "busy", "closed"] },
      { key: "available_from", label: "Disponible a partir de", type: "text", placeholder: "Janvier 2025" },
      { key: "message", label: "Message", type: "text", placeholder: "Ouvert aux missions freelance" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Prendre contact" },
      { key: "cta_url", label: "Lien", type: "url", placeholder: "https://calendly.com/..." },
    ],
  },
  journey: {
    label: "Parcours", description: "Chiffres cles et faits marquants",
    icon: "🚀", color: "#C9A84C", category: "identity",
    defaultContent: { title: "Mon parcours", line_1: "🚀 5 ans d experience", line_2: "💼 20+ projets realises" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mon parcours" },
      { key: "line_1", label: "Ligne 1", type: "text", placeholder: "🚀 5 ans d experience en SaaS" },
      { key: "line_2", label: "Ligne 2", type: "text", placeholder: "💼 20+ projets realises" },
      { key: "line_3", label: "Ligne 3", type: "text", placeholder: "🌍 Clients dans 8 pays" },
      { key: "line_4", label: "Ligne 4", type: "text", placeholder: "🎯 Specialiste Next.js" },
    ],
  },
  expertise: {
    label: "Expertises", description: "Competences avec barres de progression",
    icon: "📊", color: "#C9A84C", category: "identity",
    defaultContent: { title: "Mes expertises" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mes expertises" },
      { key: "s1_icon", label: "Expertise 1 — Icone", type: "text", placeholder: "💻" },
      { key: "s1_name", label: "Expertise 1 — Nom", type: "text", placeholder: "Developpement web" },
      { key: "s1_level", label: "Expertise 1 — Niveau (1-5)", type: "select", options: ["1","2","3","4","5"] },
      { key: "s2_icon", label: "Expertise 2 — Icone", type: "text", placeholder: "🎨" },
      { key: "s2_name", label: "Expertise 2 — Nom", type: "text", placeholder: "UI/UX Design" },
      { key: "s2_level", label: "Expertise 2 — Niveau (1-5)", type: "select", options: ["1","2","3","4","5"] },
      { key: "s3_icon", label: "Expertise 3 — Icone", type: "text", placeholder: "☁️" },
      { key: "s3_name", label: "Expertise 3 — Nom", type: "text", placeholder: "Cloud & DevOps" },
      { key: "s3_level", label: "Expertise 3 — Niveau (1-5)", type: "select", options: ["1","2","3","4","5"] },
      { key: "s4_icon", label: "Expertise 4 — Icone", type: "text", placeholder: "📱" },
      { key: "s4_name", label: "Expertise 4 — Nom", type: "text", placeholder: "Mobile" },
      { key: "s4_level", label: "Expertise 4 — Niveau (1-5)", type: "select", options: ["1","2","3","4","5"] },
      { key: "s5_icon", label: "Expertise 5 — Icone", type: "text", placeholder: "🚀" },
      { key: "s5_name", label: "Expertise 5 — Nom", type: "text", placeholder: "Product" },
      { key: "s5_level", label: "Expertise 5 — Niveau (1-5)", type: "select", options: ["1","2","3","4","5"] },
    ],
  },
  languages: {
    label: "Langues", description: "Langues parles avec niveau",
    icon: "🌍", color: "#38BDF8", category: "identity",
    defaultContent: { title: "Langues" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Langues" },
      { key: "lang_1_flag", label: "Langue 1 — Drapeau emoji", type: "text", placeholder: "🇫🇷" },
      { key: "lang_1_name", label: "Langue 1 — Nom", type: "text", placeholder: "Francais" },
      { key: "lang_1_level", label: "Langue 1 — Niveau", type: "select", options: ["Natif","Courant","Avance","Intermediaire","Debutant"] },
      { key: "lang_2_flag", label: "Langue 2 — Drapeau emoji", type: "text", placeholder: "🇬🇧" },
      { key: "lang_2_name", label: "Langue 2 — Nom", type: "text", placeholder: "Anglais" },
      { key: "lang_2_level", label: "Langue 2 — Niveau", type: "select", options: ["Natif","Courant","Avance","Intermediaire","Debutant"] },
      { key: "lang_3_flag", label: "Langue 3 — Drapeau emoji", type: "text", placeholder: "🇪🇸" },
      { key: "lang_3_name", label: "Langue 3 — Nom", type: "text", placeholder: "Espagnol" },
      { key: "lang_3_level", label: "Langue 3 — Niveau", type: "select", options: ["Natif","Courant","Avance","Intermediaire","Debutant"] },
      { key: "lang_4_flag", label: "Langue 4 — Drapeau emoji", type: "text", placeholder: "🇩🇪" },
      { key: "lang_4_name", label: "Langue 4 — Nom", type: "text", placeholder: "Allemand" },
      { key: "lang_4_level", label: "Langue 4 — Niveau", type: "select", options: ["Natif","Courant","Avance","Intermediaire","Debutant"] },
    ],
  },
  certifications: {
    label: "Certifications", description: "Certifications et badges professionnels",
    icon: "🏆", color: "#FBBF24", category: "identity",
    defaultContent: { title: "Certifications" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Certifications" },
      { key: "cert_1_icon", label: "Cert 1 — Emoji", type: "text", placeholder: "🏆" },
      { key: "cert_1_name", label: "Cert 1 — Nom", type: "text", placeholder: "AWS Certified" },
      { key: "cert_1_org", label: "Cert 1 — Organisme", type: "text", placeholder: "Amazon" },
      { key: "cert_1_year", label: "Cert 1 — Annee", type: "text", placeholder: "2023" },
      { key: "cert_2_icon", label: "Cert 2 — Emoji", type: "text", placeholder: "✅" },
      { key: "cert_2_name", label: "Cert 2 — Nom", type: "text", placeholder: "PSM I" },
      { key: "cert_2_org", label: "Cert 2 — Organisme", type: "text", placeholder: "Scrum.org" },
      { key: "cert_2_year", label: "Cert 2 — Annee", type: "text", placeholder: "2022" },
      { key: "cert_3_icon", label: "Cert 3 — Emoji", type: "text", placeholder: "🎓" },
      { key: "cert_3_name", label: "Cert 3 — Nom", type: "text", placeholder: "" },
      { key: "cert_3_org", label: "Cert 3 — Organisme", type: "text", placeholder: "" },
      { key: "cert_3_year", label: "Cert 3 — Annee", type: "text", placeholder: "" },
      { key: "cert_4_icon", label: "Cert 4 — Emoji", type: "text", placeholder: "📜" },
      { key: "cert_4_name", label: "Cert 4 — Nom", type: "text", placeholder: "" },
      { key: "cert_4_org", label: "Cert 4 — Organisme", type: "text", placeholder: "" },
      { key: "cert_4_year", label: "Cert 4 — Annee", type: "text", placeholder: "" },
    ],
  },
  company: {
    label: "Entreprise", description: "Logo, nom et infos de l entreprise",
    icon: "🏢", color: "#38BDF8", category: "identity",
    defaultContent: { company_name: "Mon Entreprise" },
    fields: [
      { key: "logo_url", label: "Logo", type: "image" },
      { key: "company_name", label: "Nom de l entreprise", type: "text", placeholder: "Studio PIXEL" },
      { key: "sector", label: "Secteur / Type", type: "text", placeholder: "Agence digitale" },
      { key: "website", label: "Site web", type: "url", placeholder: "https://monentreprise.com" },
      { key: "founded_year", label: "Annee de creation", type: "text", placeholder: "2019" },
      { key: "team_size", label: "Taille equipe", type: "text", placeholder: "5 personnes" },
    ],
  },
}
