// Types partagés du Builder QRfolio V3
export type BlockContent = Record<string, string>

export type Block = {
  id: string
  type: string
  content: BlockContent
}

export type PageTheme = "midnight_gold" | "pure_white" | "deep_ocean" | "forest" | "sunset"

export const SOCIAL_NETWORKS = [
  { key: "instagram",  label: "Instagram",  icon: "📸", color: "#E1306C", bg: "rgba(225,48,108,0.12)" },
  { key: "facebook",   label: "Facebook",   icon: "👥", color: "#1877F2", bg: "rgba(24,119,242,0.12)" },
  { key: "tiktok",     label: "TikTok",     icon: "🎵", color: "#F5F0E8", bg: "rgba(245,240,232,0.08)" },
  { key: "linkedin",   label: "LinkedIn",   icon: "💼", color: "#0A66C2", bg: "rgba(10,102,194,0.12)" },
  { key: "twitter",    label: "Twitter/X",  icon: "🐦", color: "#1DA1F2", bg: "rgba(29,161,242,0.12)" },
  { key: "youtube",    label: "YouTube",    icon: "▶️", color: "#FF0000", bg: "rgba(255,0,0,0.12)" },
  { key: "snapchat",   label: "Snapchat",   icon: "👻", color: "#FFFC00", bg: "rgba(255,252,0,0.1)" },
  { key: "pinterest",  label: "Pinterest",  icon: "📌", color: "#E60023", bg: "rgba(230,0,35,0.12)" },
  { key: "whatsapp",   label: "WhatsApp",   icon: "💬", color: "#25D366", bg: "rgba(37,211,102,0.12)" },
  { key: "telegram",   label: "Telegram",   icon: "✈️", color: "#26A5E4", bg: "rgba(38,165,228,0.12)" },
  { key: "discord",    label: "Discord",    icon: "🎮", color: "#5865F2", bg: "rgba(88,101,242,0.12)" },
  { key: "github",     label: "GitHub",     icon: "💻", color: "#F5F0E8", bg: "rgba(245,240,232,0.08)" },
  { key: "website",    label: "Site web",   icon: "🌐", color: "#C9A84C", bg: "rgba(201,168,76,0.12)" },
  { key: "email",      label: "Email",      icon: "✉️", color: "#39FF8F", bg: "rgba(57,255,143,0.12)" },
]

export const BLOCK_CATEGORIES = [
  { id: "identity", label: "Identité",  icon: "👤", color: "#C9A84C" },
  { id: "action",   label: "Action",    icon: "⚡", color: "#39FF8F" },
  { id: "social",   label: "Réseaux",   icon: "🔗", color: "#7B61FF" },
  { id: "content",  label: "Contenu",   icon: "📝", color: "#FF6B6B" },
  { id: "media",    label: "Médias",    icon: "🖼️", color: "#4ECDC4" },
  { id: "local",    label: "Local",     icon: "📍", color: "#FFE66D" },
  { id: "commerce", label: "Commerce",  icon: "💳", color: "#C9A84C" },
]

export type BlockDef = {
  type: string
  icon: string
  label: string
  category: string
  color: string
  description: string
  fields: FieldDef[]
  defaultContent: BlockContent
}

export type FieldDef = {
  key: string
  label: string
  type: "text" | "textarea" | "url" | "select" | "image" | "color" | "number"
  placeholder?: string
  options?: string[]
  hint?: string
}

export const BLOCK_DEFS: Record<string, BlockDef> = {
  profile: {
    type: "profile", icon: "👤", label: "Profil", category: "identity", color: "#C9A84C",
    description: "Photo + nom + accroche",
    fields: [
      { key: "name", label: "Nom complet", type: "text", placeholder: "Jean Dupont" },
      { key: "tagline", label: "Accroche", type: "text", placeholder: "Développeur freelance" },
      { key: "avatar", label: "Photo de profil", type: "image", hint: "JPG, PNG ou WebP — max 2MB" },
    ],
    defaultContent: { name: "Mon Nom", tagline: "Mon activité" }
  },
  bio: {
    type: "bio", icon: "✏️", label: "Bio", category: "identity", color: "#C9A84C",
    description: "Texte de présentation",
    fields: [{ key: "text", label: "Texte", type: "textarea", placeholder: "Parle de toi..." }],
    defaultContent: { text: "Bienvenue sur ma page !" }
  },
  cta_button: {
    type: "cta_button", icon: "⚡", label: "Bouton CTA", category: "action", color: "#39FF8F",
    description: "Appel à l'action cliquable",
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "Me contacter" },
      { key: "url", label: "Lien", type: "url", placeholder: "https://..." },
      { key: "style", label: "Style", type: "select", options: ["gold", "neon", "outline", "ghost"] },
      { key: "icon", label: "Icône (emoji)", type: "text", placeholder: "📩" },
    ],
    defaultContent: { label: "Me contacter", url: "#", style: "gold" }
  },
  social_links: {
    type: "social_links", icon: "🔗", label: "Réseaux sociaux", category: "social", color: "#7B61FF",
    description: "Liens vers tes réseaux",
    fields: SOCIAL_NETWORKS.map(n => ({ key: n.key, label: n.label, type: "url" as const, placeholder: n.key === "email" ? "mon@email.com" : `https://${n.key}.com/...` })),
    defaultContent: {}
  },
  heading: {
    type: "heading", icon: "H", label: "Titre", category: "content", color: "#FF6B6B",
    description: "Titre de section",
    fields: [
      { key: "text", label: "Titre", type: "text", placeholder: "Mon titre" },
      { key: "size", label: "Taille", type: "select", options: ["small", "medium", "large"] },
      { key: "align", label: "Alignement", type: "select", options: ["left", "center", "right"] },
      { key: "color", label: "Couleur", type: "select", options: ["default", "gold", "neon", "muted"] },
    ],
    defaultContent: { text: "Mon titre", size: "medium", align: "center", color: "default" }
  },
  rich_text: {
    type: "rich_text", icon: "📝", label: "Texte", category: "content", color: "#FF6B6B",
    description: "Paragraphe de texte",
    fields: [
      { key: "text", label: "Contenu", type: "textarea", placeholder: "Ton texte ici..." },
      { key: "align", label: "Alignement", type: "select", options: ["left", "center", "right"] },
    ],
    defaultContent: { text: "Mon texte...", align: "left" }
  },
  image: {
    type: "image", icon: "🖼️", label: "Image", category: "media", color: "#4ECDC4",
    description: "Photo ou illustration",
    fields: [
      { key: "src", label: "Image", type: "image", hint: "JPG, PNG, WebP — max 5MB" },
      { key: "caption", label: "Légende", type: "text", placeholder: "Description de l'image" },
      { key: "rounded", label: "Forme", type: "select", options: ["none", "rounded", "circle"] },
    ],
    defaultContent: {}
  },
  gallery: {
    type: "gallery", icon: "🎨", label: "Galerie", category: "media", color: "#4ECDC4",
    description: "Grille de photos",
    fields: [
      { key: "img1", label: "Image 1", type: "image" },
      { key: "img2", label: "Image 2", type: "image" },
      { key: "img3", label: "Image 3", type: "image" },
      { key: "img4", label: "Image 4", type: "image" },
      { key: "columns", label: "Colonnes", type: "select", options: ["2", "3"] },
    ],
    defaultContent: { columns: "2" }
  },
  video: {
    type: "video", icon: "▶️", label: "Vidéo", category: "media", color: "#4ECDC4",
    description: "YouTube ou Vimeo",
    fields: [
      { key: "url", label: "URL YouTube/Vimeo", type: "url", placeholder: "https://youtube.com/watch?v=..." },
      { key: "title", label: "Titre", type: "text", placeholder: "Ma vidéo" },
    ],
    defaultContent: { title: "Ma vidéo" }
  },
  contact_form: {
    type: "contact_form", icon: "✉️", label: "Formulaire", category: "action", color: "#39FF8F",
    description: "Formulaire de contact",
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Contactez-moi" },
      { key: "button_label", label: "Bouton", type: "text", placeholder: "Envoyer" },
      { key: "email_to", label: "Recevoir sur", type: "url", placeholder: "mon@email.com", hint: "Email de réception" },
    ],
    defaultContent: { title: "Contactez-moi", button_label: "Envoyer" }
  },
  testimonials: {
    type: "testimonials", icon: "💬", label: "Avis clients", category: "social", color: "#7B61FF",
    description: "Témoignages & avis",
    fields: [
      { key: "name1", label: "Nom 1", type: "text", placeholder: "Marie D." },
      { key: "text1", label: "Avis 1", type: "textarea", placeholder: "Excellent travail !" },
      { key: "stars1", label: "Note 1", type: "select", options: ["5", "4", "3"] },
      { key: "name2", label: "Nom 2", type: "text", placeholder: "Paul M." },
      { key: "text2", label: "Avis 2", type: "textarea", placeholder: "Je recommande." },
      { key: "stars2", label: "Note 2", type: "select", options: ["5", "4", "3"] },
    ],
    defaultContent: { name1: "Marie D.", text1: "Excellent travail !", stars1: "5" }
  },
  google_maps: {
    type: "google_maps", icon: "📍", label: "Adresse", category: "local", color: "#FFE66D",
    description: "Carte et adresse",
    fields: [
      { key: "address", label: "Adresse", type: "text", placeholder: "12 rue de la Paix, Paris" },
      { key: "label", label: "Nom du lieu", type: "text", placeholder: "Mon cabinet" },
    ],
    defaultContent: { address: "Paris, France", label: "Mon adresse" }
  },
  opening_hours: {
    type: "opening_hours", icon: "🕐", label: "Horaires", category: "local", color: "#FFE66D",
    description: "Horaires d'ouverture",
    fields: [
      { key: "mon_fri", label: "Lun-Ven", type: "text", placeholder: "9h - 18h" },
      { key: "saturday", label: "Samedi", type: "text", placeholder: "10h - 16h" },
      { key: "sunday", label: "Dimanche", type: "text", placeholder: "Fermé" },
    ],
    defaultContent: { mon_fri: "9h - 18h", saturday: "Fermé", sunday: "Fermé" }
  },
  pricing: {
    type: "pricing", icon: "💳", label: "Tarifs", category: "commerce", color: "#C9A84C",
    description: "Grille tarifaire",
    fields: [
      { key: "title1", label: "Offre 1", type: "text", placeholder: "Basique" },
      { key: "price1", label: "Prix 1", type: "text", placeholder: "49€" },
      { key: "desc1",  label: "Desc 1",  type: "text", placeholder: "Idéal pour démarrer" },
      { key: "title2", label: "Offre 2", type: "text", placeholder: "Pro" },
      { key: "price2", label: "Prix 2", type: "text", placeholder: "99€" },
      { key: "desc2",  label: "Desc 2",  type: "text", placeholder: "Pour les pros" },
    ],
    defaultContent: { title1: "Basique", price1: "49€", title2: "Pro", price2: "99€" }
  },
  visit_counter: {
    type: "visit_counter", icon: "👁️", label: "Compteur", category: "social", color: "#7B61FF",
    description: "Compteur de visiteurs",
    fields: [{ key: "label", label: "Texte", type: "text", placeholder: "visiteurs ce mois" }],
    defaultContent: { label: "visiteurs ce mois" }
  },
  divider: {
    type: "divider", icon: "─", label: "Séparateur", category: "content", color: "#FF6B6B",
    description: "Ligne de séparation",
    fields: [{ key: "style", label: "Style", type: "select", options: ["line", "dots", "gold"] }],
    defaultContent: { style: "gold" }
  },
  spacer: {
    type: "spacer", icon: "↕️", label: "Espace", category: "content", color: "#FF6B6B",
    description: "Espace vertical",
    fields: [{ key: "size", label: "Taille", type: "select", options: ["small", "medium", "large"] }],
    defaultContent: { size: "medium" }
  },
}
