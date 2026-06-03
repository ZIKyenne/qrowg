// QRfolio Builder V4 — Types & Définitions complètes

export type BlockContent = Record<string, string>

export type Block = {
  id: string
  type: string
  content: BlockContent
  visible: boolean
  section?: "header" | "body" | "footer"
}

export type PageTheme = {
  name: string
  bg: string
  surface: string
  primary: string
  accent: string
  text: string
  muted: string
  fontDisplay: string
  fontBody: string
  bgMode: "solid" | "gradient" | "image"
  bgGradient?: string
  bgImage?: string
}

export const GOOGLE_FONTS = [
  "DM Sans", "Inter", "Poppins", "Raleway", "Nunito",
  "Cormorant Garamond", "Playfair Display", "Lora", "Merriweather",
  "Space Grotesk", "Syne", "Cabinet Grotesk", "Outfit", "Plus Jakarta Sans", "Bricolage Grotesque"
]

export const PRESET_THEMES: Record<string, PageTheme> = {
  midnight_gold: { name: "Midnight Gold", bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F", text: "#F5F0E8", muted: "#8A8478", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans", bgMode: "solid" },
  pure_white: { name: "Pure White", bg: "#FAFAFA", surface: "#FFFFFF", primary: "#1A1A1A", accent: "#C9A84C", text: "#1A1A1A", muted: "#6B7280", fontDisplay: "Playfair Display", fontBody: "Inter", bgMode: "solid" },
  deep_ocean: { name: "Deep Ocean", bg: "#0A0E1A", surface: "#111827", primary: "#38BDF8", accent: "#818CF8", text: "#F0F9FF", muted: "#94A3B8", fontDisplay: "Space Grotesk", fontBody: "Inter", bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0A0E1A,#0F172A)" },
  forest: { name: "Forest", bg: "#0A1A0E", surface: "#0F2414", primary: "#4ADE80", accent: "#86EFAC", text: "#ECFDF5", muted: "#6EE7B7", fontDisplay: "Lora", fontBody: "Nunito", bgMode: "solid" },
  sunset: { name: "Sunset", bg: "#1A0A00", surface: "#2D1500", primary: "#FB923C", accent: "#F472B6", text: "#FFF7ED", muted: "#FDBA74", fontDisplay: "Raleway", fontBody: "Poppins", bgMode: "gradient", bgGradient: "linear-gradient(135deg,#1A0A00,#2D1500,#1A001A)" },
  lavender: { name: "Lavender", bg: "#0D0A1A", surface: "#160F2E", primary: "#A78BFA", accent: "#F472B6", text: "#F5F3FF", muted: "#C4B5FD", fontDisplay: "Syne", fontBody: "Outfit", bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0D0A1A,#160F2E)" },
  minimal: { name: "Minimal", bg: "#F8F8F8", surface: "#FFFFFF", primary: "#111111", accent: "#555555", text: "#111111", muted: "#9CA3AF", fontDisplay: "Cabinet Grotesk", fontBody: "Plus Jakarta Sans", bgMode: "solid" },
}

export const SOCIAL_NETWORKS = [
  { key: "instagram", label: "Instagram", icon: "📸", color: "#E1306C", bg: "rgba(225,48,108,0.12)" },
  { key: "facebook", label: "Facebook", icon: "👥", color: "#1877F2", bg: "rgba(24,119,242,0.12)" },
  { key: "tiktok", label: "TikTok", icon: "🎵", color: "#F5F0E8", bg: "rgba(245,240,232,0.08)" },
  { key: "linkedin", label: "LinkedIn", icon: "💼", color: "#0A66C2", bg: "rgba(10,102,194,0.12)" },
  { key: "twitter", label: "Twitter/X", icon: "🐦", color: "#1DA1F2", bg: "rgba(29,161,242,0.12)" },
  { key: "youtube", label: "YouTube", icon: "▶️", color: "#FF0000", bg: "rgba(255,0,0,0.12)" },
  { key: "snapchat", label: "Snapchat", icon: "👻", color: "#FFFC00", bg: "rgba(255,252,0,0.1)" },
  { key: "pinterest", label: "Pinterest", icon: "📌", color: "#E60023", bg: "rgba(230,0,35,0.12)" },
  { key: "whatsapp", label: "WhatsApp", icon: "💬", color: "#25D366", bg: "rgba(37,211,102,0.12)" },
  { key: "telegram", label: "Telegram", icon: "✈️", color: "#26A5E4", bg: "rgba(38,165,228,0.12)" },
  { key: "discord", label: "Discord", icon: "🎮", color: "#5865F2", bg: "rgba(88,101,242,0.12)" },
  { key: "github", label: "GitHub", icon: "💻", color: "#F5F0E8", bg: "rgba(245,240,232,0.08)" },
  { key: "website", label: "Site web", icon: "🌐", color: "#C9A84C", bg: "rgba(201,168,76,0.12)" },
  { key: "email", label: "Email", icon: "✉️", color: "#39FF8F", bg: "rgba(57,255,143,0.12)" },
  { key: "phone", label: "Téléphone", icon: "📞", color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  { key: "spotify", label: "Spotify", icon: "🎧", color: "#1DB954", bg: "rgba(29,185,84,0.12)" },
  { key: "twitch", label: "Twitch", icon: "🎮", color: "#9146FF", bg: "rgba(145,70,255,0.12)" },
  { key: "bereal", label: "BeReal", icon: "📷", color: "#F5F0E8", bg: "rgba(245,240,232,0.08)" },
]

export const BLOCK_CATEGORIES = [
  { id: "identity", label: "Identité", icon: "👤", color: "#C9A84C", desc: "Profil, bio, présentation" },
  { id: "action", label: "Action", icon: "⚡", color: "#39FF8F", desc: "Boutons, formulaires, liens" },
  { id: "social", label: "Réseaux", icon: "🔗", color: "#7B61FF", desc: "Liens sociaux, avis" },
  { id: "content", label: "Contenu", icon: "📝", color: "#FF6B6B", desc: "Texte, titres, médias" },
  { id: "media", label: "Médias", icon: "🖼️", color: "#4ECDC4", desc: "Images, vidéos, galerie" },
  { id: "local", label: "Local", icon: "📍", color: "#FFE66D", desc: "Adresse, horaires, maps" },
  { id: "commerce", label: "Commerce", icon: "💳", color: "#F97316", desc: "Produits, tarifs, promo" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️", color: "#EF4444", desc: "Menu, plats, réservation" },
  { id: "services", label: "Services", icon: "🛠️", color: "#8B5CF6", desc: "Calendly, FAQ, devis" },
  { id: "event", label: "Événement", icon: "🎉", color: "#EC4899", desc: "Countdown, programme" },
  { id: "music", label: "Musique", icon: "🎵", color: "#1DB954", desc: "Spotify, podcast, concert" },
  { id: "layout", label: "Mise en page", icon: "⊞", color: "#94A3B8", desc: "Espace, séparateur" },
]

export type FieldDef = {
  key: string
  label: string
  type: "text" | "textarea" | "url" | "select" | "image" | "color" | "number" | "toggle"
  placeholder?: string
  options?: string[]
  hint?: string
}

export type BlockDef = {
  type: string; icon: string; label: string; category: string
  color: string; description: string; fields: FieldDef[]; defaultContent: BlockContent
  isPremium?: boolean
}

export const BLOCK_DEFS: Record<string, BlockDef> = {
  // ── IDENTITY ──────────────────────────────────────────────────────────────
  profile: {
    type: "profile", icon: "👤", label: "Profil", category: "identity", color: "#C9A84C",
    description: "Photo + nom + accroche",
    fields: [
      { key: "name", label: "Nom complet", type: "text", placeholder: "Jean Dupont" },
      { key: "tagline", label: "Accroche", type: "text", placeholder: "Développeur freelance" },
      { key: "avatar", label: "Photo de profil", type: "image", hint: "JPG, PNG — max 2MB" },
      { key: "badge", label: "Badge (emoji)", type: "text", placeholder: "✅ Disponible" },
    ],
    defaultContent: { name: "Mon Nom", tagline: "Mon activité" }
  },
  bio: {
    type: "bio", icon: "✏️", label: "Bio", category: "identity", color: "#C9A84C",
    description: "Texte de présentation",
    fields: [
      { key: "text", label: "Texte", type: "textarea", placeholder: "Parle de toi en quelques mots..." },
      { key: "align", label: "Alignement", type: "select", options: ["left", "center", "right"] },
    ],
    defaultContent: { text: "Bienvenue sur ma page !", align: "left" }
  },
  skills: {
    type: "skills", icon: "⭐", label: "Compétences", category: "identity", color: "#C9A84C",
    description: "Tags de compétences",
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Mes compétences" },
      { key: "tags", label: "Compétences (séparées par virgule)", type: "text", placeholder: "React, Design, SEO, Marketing" },
    ],
    defaultContent: { title: "Mes compétences", tags: "Design, Marketing, SEO" }
  },
  // ── ACTION ────────────────────────────────────────────────────────────────
  cta_button: {
    type: "cta_button", icon: "⚡", label: "Bouton CTA", category: "action", color: "#39FF8F",
    description: "Appel à l'action cliquable",
    fields: [
      { key: "label", label: "Texte du bouton", type: "text", placeholder: "Me contacter" },
      { key: "url", label: "Lien", type: "url", placeholder: "https://..." },
      { key: "style", label: "Style", type: "select", options: ["gold", "neon", "outline", "ghost", "red"] },
      { key: "icon", label: "Icône (emoji)", type: "text", placeholder: "📩" },
      { key: "full_width", label: "Pleine largeur", type: "select", options: ["yes", "no"] },
    ],
    defaultContent: { label: "Me contacter", url: "#", style: "gold", full_width: "yes" }
  },
  contact_form: {
    type: "contact_form", icon: "✉️", label: "Formulaire contact", category: "action", color: "#39FF8F",
    description: "Formulaire de contact",
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Contactez-moi" },
      { key: "button_label", label: "Bouton", type: "text", placeholder: "Envoyer" },
      { key: "email_to", label: "Email de réception", type: "text", placeholder: "mon@email.com" },
      { key: "show_phone", label: "Champ téléphone", type: "select", options: ["yes", "no"] },
    ],
    defaultContent: { title: "Contactez-moi", button_label: "Envoyer", show_phone: "no" }
  },
  calendly: {
    type: "calendly", icon: "📅", label: "Réservation", category: "action", color: "#39FF8F",
    description: "Lien Calendly ou autre",
    fields: [
      { key: "label", label: "Texte du bouton", type: "text", placeholder: "Réserver un appel" },
      { key: "url", label: "Lien Calendly", type: "url", placeholder: "https://calendly.com/..." },
      { key: "description", label: "Description", type: "text", placeholder: "30 min • Gratuit" },
    ],
    defaultContent: { label: "Réserver un appel gratuit", description: "30 min • Visio ou téléphone" }
  },
  // ── SOCIAL ────────────────────────────────────────────────────────────────
  social_links: {
    type: "social_links", icon: "🔗", label: "Réseaux sociaux", category: "social", color: "#7B61FF",
    description: "Liens vers tes réseaux",
    fields: SOCIAL_NETWORKS.map(n => ({ key: n.key, label: n.label, type: "url" as const, placeholder: `https://${n.key}.com/...` })),
    defaultContent: {}
  },
  testimonials: {
    type: "testimonials", icon: "💬", label: "Avis clients", category: "social", color: "#7B61FF",
    description: "Témoignages et avis",
    fields: [
      { key: "name1", label: "Nom 1", type: "text", placeholder: "Marie D." },
      { key: "text1", label: "Avis 1", type: "textarea", placeholder: "Excellent travail !" },
      { key: "stars1", label: "Note", type: "select", options: ["5", "4", "3"] },
      { key: "name2", label: "Nom 2", type: "text", placeholder: "Paul M." },
      { key: "text2", label: "Avis 2", type: "textarea", placeholder: "Je recommande." },
      { key: "stars2", label: "Note", type: "select", options: ["5", "4", "3"] },
      { key: "name3", label: "Nom 3", type: "text", placeholder: "Sophie L." },
      { key: "text3", label: "Avis 3", type: "textarea", placeholder: "Parfait !" },
      { key: "stars3", label: "Note", type: "select", options: ["5", "4", "3"] },
    ],
    defaultContent: { name1: "Marie D.", text1: "Excellent travail !", stars1: "5" }
  },
  visit_counter: {
    type: "visit_counter", icon: "👁️", label: "Compteur visites", category: "social", color: "#7B61FF",
    description: "Compteur de visiteurs",
    fields: [{ key: "label", label: "Texte", type: "text", placeholder: "visiteurs ce mois" }],
    defaultContent: { label: "visiteurs ce mois" }
  },
  // ── CONTENT ───────────────────────────────────────────────────────────────
  heading: {
    type: "heading", icon: "H", label: "Titre", category: "content", color: "#FF6B6B",
    description: "Titre de section",
    fields: [
      { key: "text", label: "Titre", type: "text", placeholder: "Mon titre" },
      { key: "size", label: "Taille", type: "select", options: ["small", "medium", "large", "xl"] },
      { key: "align", label: "Alignement", type: "select", options: ["left", "center", "right"] },
      { key: "color", label: "Couleur", type: "select", options: ["default", "primary", "accent", "muted"] },
      { key: "subtitle", label: "Sous-titre", type: "text", placeholder: "Description optionnelle" },
    ],
    defaultContent: { text: "Mon titre", size: "medium", align: "center", color: "default" }
  },
  rich_text: {
    type: "rich_text", icon: "📝", label: "Texte", category: "content", color: "#FF6B6B",
    description: "Paragraphe libre",
    fields: [
      { key: "text", label: "Contenu", type: "textarea", placeholder: "Ton texte ici..." },
      { key: "align", label: "Alignement", type: "select", options: ["left", "center", "right"] },
      { key: "size", label: "Taille", type: "select", options: ["small", "normal", "large"] },
    ],
    defaultContent: { text: "Mon texte...", align: "left", size: "normal" }
  },
  faq: {
    type: "faq", icon: "❓", label: "FAQ", category: "content", color: "#FF6B6B",
    description: "Questions fréquentes",
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Questions fréquentes" },
      { key: "q1", label: "Question 1", type: "text", placeholder: "Comment ça marche ?" },
      { key: "a1", label: "Réponse 1", type: "textarea", placeholder: "C'est très simple..." },
      { key: "q2", label: "Question 2", type: "text", placeholder: "Quel est le délai ?" },
      { key: "a2", label: "Réponse 2", type: "textarea", placeholder: "En général..." },
      { key: "q3", label: "Question 3", type: "text", placeholder: "Comment vous contacter ?" },
      { key: "a3", label: "Réponse 3", type: "textarea", placeholder: "Par email ou..." },
    ],
    defaultContent: { title: "FAQ", q1: "Comment ça marche ?", a1: "C'est simple..." }
  },
  divider: {
    type: "divider", icon: "─", label: "Séparateur", category: "content", color: "#FF6B6B",
    description: "Ligne de séparation",
    fields: [{ key: "style", label: "Style", type: "select", options: ["gold", "line", "dots", "stars"] }],
    defaultContent: { style: "gold" }
  },
  spacer: {
    type: "spacer", icon: "↕️", label: "Espace", category: "content", color: "#FF6B6B",
    description: "Espace vide",
    fields: [{ key: "size", label: "Hauteur", type: "select", options: ["xs", "sm", "md", "lg", "xl"] }],
    defaultContent: { size: "md" }
  },
  // ── MEDIA ─────────────────────────────────────────────────────────────────
  image: {
    type: "image", icon: "🖼️", label: "Image", category: "media", color: "#4ECDC4",
    description: "Photo ou illustration",
    fields: [
      { key: "src", label: "Image", type: "image", hint: "JPG, PNG, WebP — max 5MB" },
      { key: "caption", label: "Légende", type: "text", placeholder: "Description..." },
      { key: "rounded", label: "Forme", type: "select", options: ["none", "rounded", "circle"] },
      { key: "link", label: "Lien au clic", type: "url", placeholder: "https://..." },
    ],
    defaultContent: { rounded: "rounded" }
  },
  gallery: {
    type: "gallery", icon: "🎨", label: "Galerie", category: "media", color: "#4ECDC4",
    description: "Grille de photos",
    fields: [
      { key: "img1", label: "Image 1", type: "image" },
      { key: "img2", label: "Image 2", type: "image" },
      { key: "img3", label: "Image 3", type: "image" },
      { key: "img4", label: "Image 4", type: "image" },
      { key: "img5", label: "Image 5", type: "image" },
      { key: "img6", label: "Image 6", type: "image" },
      { key: "columns", label: "Colonnes", type: "select", options: ["2", "3"] },
    ],
    defaultContent: { columns: "3" }
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
  // ── LOCAL ─────────────────────────────────────────────────────────────────
  google_maps: {
    type: "google_maps", icon: "📍", label: "Adresse & Carte", category: "local", color: "#FFE66D",
    description: "Adresse avec carte",
    fields: [
      { key: "label", label: "Nom du lieu", type: "text", placeholder: "Mon cabinet" },
      { key: "address", label: "Adresse complète", type: "text", placeholder: "12 rue de la Paix, 75001 Paris" },
      { key: "transport", label: "Transport", type: "text", placeholder: "Métro Opéra — Ligne 3, 7, 8" },
    ],
    defaultContent: { label: "Notre adresse", address: "Paris, France" }
  },
  opening_hours: {
    type: "opening_hours", icon: "🕐", label: "Horaires", category: "local", color: "#FFE66D",
    description: "Horaires d'ouverture",
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Nos horaires" },
      { key: "mon_fri", label: "Lundi — Vendredi", type: "text", placeholder: "9h — 18h" },
      { key: "saturday", label: "Samedi", type: "text", placeholder: "10h — 16h" },
      { key: "sunday", label: "Dimanche", type: "text", placeholder: "Fermé" },
      { key: "note", label: "Note", type: "text", placeholder: "Jours fériés : fermé" },
    ],
    defaultContent: { title: "Nos horaires", mon_fri: "9h — 18h", saturday: "Fermé", sunday: "Fermé" }
  },
  // ── COMMERCE ──────────────────────────────────────────────────────────────
  pricing: {
    type: "pricing", icon: "💳", label: "Tarifs", category: "commerce", color: "#F97316",
    description: "Grille de prix",
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mes tarifs" },
      { key: "title1", label: "Offre 1 — Nom", type: "text", placeholder: "Essentiel" },
      { key: "price1", label: "Offre 1 — Prix", type: "text", placeholder: "49€" },
      { key: "desc1", label: "Offre 1 — Description", type: "text", placeholder: "Pour démarrer" },
      { key: "title2", label: "Offre 2 — Nom", type: "text", placeholder: "Pro" },
      { key: "price2", label: "Offre 2 — Prix", type: "text", placeholder: "149€" },
      { key: "desc2", label: "Offre 2 — Description", type: "text", placeholder: "Pour les pros" },
      { key: "title3", label: "Offre 3 — Nom", type: "text", placeholder: "Premium" },
      { key: "price3", label: "Offre 3 — Prix", type: "text", placeholder: "Sur devis" },
      { key: "desc3", label: "Offre 3 — Description", type: "text", placeholder: "Solution complète" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Choisir cette offre" },
      { key: "cta_url", label: "Lien bouton", type: "url", placeholder: "https://..." },
    ],
    defaultContent: { title: "Mes tarifs", title1: "Essentiel", price1: "49€", title2: "Pro", price2: "149€" }
  },
  product: {
    type: "product", icon: "🛍️", label: "Produit", category: "commerce", color: "#F97316",
    description: "Fiche produit e-commerce",
    fields: [
      { key: "image", label: "Photo produit", type: "image" },
      { key: "name", label: "Nom du produit", type: "text", placeholder: "Mon produit" },
      { key: "price", label: "Prix", type: "text", placeholder: "29,90€" },
      { key: "old_price", label: "Ancien prix (promo)", type: "text", placeholder: "49,90€" },
      { key: "description", label: "Description courte", type: "textarea", placeholder: "Ce produit est..." },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Acheter" },
      { key: "cta_url", label: "Lien achat", type: "url", placeholder: "https://..." },
    ],
    defaultContent: { name: "Mon produit", price: "29,90€", cta_label: "Acheter maintenant" }
  },
  promo_banner: {
    type: "promo_banner", icon: "🎯", label: "Bannière promo", category: "commerce", color: "#F97316",
    description: "Offre spéciale / réduction",
    fields: [
      { key: "emoji", label: "Emoji", type: "text", placeholder: "🎉" },
      { key: "text", label: "Texte promo", type: "text", placeholder: "-20% sur tout le site" },
      { key: "subtext", label: "Sous-texte", type: "text", placeholder: "Code : WELCOME20" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "En profiter" },
      { key: "cta_url", label: "Lien", type: "url", placeholder: "https://..." },
    ],
    defaultContent: { emoji: "🎉", text: "Offre spéciale -20%", subtext: "Durée limitée" }
  },
  // ── RESTAURANT ────────────────────────────────────────────────────────────
  menu_section: {
    type: "menu_section", icon: "🍽️", label: "Section menu", category: "restaurant", color: "#EF4444",
    description: "Entrées, plats, desserts...",
    fields: [
      { key: "category", label: "Catégorie", type: "text", placeholder: "🥗 Entrées" },
      { key: "item1_name", label: "Plat 1 — Nom", type: "text", placeholder: "Salade César" },
      { key: "item1_price", label: "Plat 1 — Prix", type: "text", placeholder: "12€" },
      { key: "item1_desc", label: "Plat 1 — Description", type: "text", placeholder: "Poulet grillé, parmesan..." },
      { key: "item2_name", label: "Plat 2 — Nom", type: "text", placeholder: "Soupe du jour" },
      { key: "item2_price", label: "Plat 2 — Prix", type: "text", placeholder: "8€" },
      { key: "item2_desc", label: "Plat 2 — Description", type: "text", placeholder: "Selon arrivage" },
      { key: "item3_name", label: "Plat 3 — Nom", type: "text", placeholder: "Tartare de saumon" },
      { key: "item3_price", label: "Plat 3 — Prix", type: "text", placeholder: "16€" },
      { key: "item3_desc", label: "Plat 3 — Description", type: "text", placeholder: "Avocat, citron vert" },
    ],
    defaultContent: { category: "🥗 Entrées", item1_name: "Salade César", item1_price: "12€" }
  },
  reservation_form: {
    type: "reservation_form", icon: "🪑", label: "Réservation table", category: "restaurant", color: "#EF4444",
    description: "Formulaire réservation restaurant",
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Réserver une table" },
      { key: "phone", label: "Téléphone restaurant", type: "text", placeholder: "+33 1 23 45 67 89" },
      { key: "button_label", label: "Bouton", type: "text", placeholder: "Réserver maintenant" },
    ],
    defaultContent: { title: "Réserver une table", button_label: "Réserver maintenant" }
  },
  // ── SERVICES ──────────────────────────────────────────────────────────────
  services_list: {
    type: "services_list", icon: "🛠️", label: "Liste services", category: "services", color: "#8B5CF6",
    description: "Tes prestations",
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Mes services" },
      { key: "s1_icon", label: "Service 1 — Icône", type: "text", placeholder: "🎨" },
      { key: "s1_name", label: "Service 1 — Nom", type: "text", placeholder: "Design graphique" },
      { key: "s1_desc", label: "Service 1 — Description", type: "text", placeholder: "Logo, identité visuelle" },
      { key: "s2_icon", label: "Service 2 — Icône", type: "text", placeholder: "💻" },
      { key: "s2_name", label: "Service 2 — Nom", type: "text", placeholder: "Développement web" },
      { key: "s2_desc", label: "Service 2 — Description", type: "text", placeholder: "Site vitrine, e-commerce" },
      { key: "s3_icon", label: "Service 3 — Icône", type: "text", placeholder: "📱" },
      { key: "s3_name", label: "Service 3 — Nom", type: "text", placeholder: "App mobile" },
      { key: "s3_desc", label: "Service 3 — Description", type: "text", placeholder: "iOS et Android" },
    ],
    defaultContent: { title: "Mes services", s1_icon: "🎨", s1_name: "Design", s1_desc: "Logo, identité visuelle" }
  },
  // ── EVENT ─────────────────────────────────────────────────────────────────
  countdown: {
    type: "countdown", icon: "⏱️", label: "Compte à rebours", category: "event", color: "#EC4899",
    description: "Timer jusqu'à un événement",
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Ouverture dans..." },
      { key: "date", label: "Date cible (YYYY-MM-DD)", type: "text", placeholder: "2025-12-31" },
      { key: "subtitle", label: "Sous-titre", type: "text", placeholder: "Ne manquez pas ça !" },
    ],
    defaultContent: { title: "L'événement commence dans", date: "2025-12-31" }
  },
  event_info: {
    type: "event_info", icon: "🎉", label: "Info événement", category: "event", color: "#EC4899",
    description: "Date, lieu, programme",
    fields: [
      { key: "name", label: "Nom événement", type: "text", placeholder: "Mon événement" },
      { key: "date", label: "Date", type: "text", placeholder: "Samedi 15 juin 2025" },
      { key: "time", label: "Heure", type: "text", placeholder: "19h — 23h" },
      { key: "location", label: "Lieu", type: "text", placeholder: "Salle des fêtes, Paris" },
      { key: "price", label: "Tarif", type: "text", placeholder: "Entrée libre" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Je participe" },
      { key: "cta_url", label: "Lien inscription", type: "url", placeholder: "https://..." },
    ],
    defaultContent: { name: "Mon événement", date: "15 juin 2025", time: "19h00" }
  },
  // ── MUSIC ─────────────────────────────────────────────────────────────────
  spotify_player: {
    type: "spotify_player", icon: "🎧", label: "Lecteur Spotify", category: "music", color: "#1DB954",
    description: "Intègre un track ou playlist",
    fields: [
      { key: "url", label: "URL Spotify", type: "url", placeholder: "https://open.spotify.com/track/..." },
      { key: "title", label: "Titre affiché", type: "text", placeholder: "Écoute ma playlist" },
    ],
    defaultContent: { title: "Ma musique" }
  },
  music_links: {
    type: "music_links", icon: "🎵", label: "Liens musique", category: "music", color: "#1DB954",
    description: "Spotify, Apple Music, Deezer...",
    fields: [
      { key: "artist_name", label: "Nom artiste", type: "text", placeholder: "Mon Nom" },
      { key: "spotify", label: "Spotify", type: "url", placeholder: "https://open.spotify.com/..." },
      { key: "apple_music", label: "Apple Music", type: "url", placeholder: "https://music.apple.com/..." },
      { key: "deezer", label: "Deezer", type: "url", placeholder: "https://deezer.com/..." },
      { key: "youtube_music", label: "YouTube Music", type: "url", placeholder: "https://music.youtube.com/..." },
      { key: "soundcloud", label: "SoundCloud", type: "url", placeholder: "https://soundcloud.com/..." },
    ],
    defaultContent: { artist_name: "Mon Nom" }
  },
  // ── LAYOUT ────────────────────────────────────────────────────────────────
  instagram_feed: {
    type: "instagram_feed", icon: "📸", label: "Instagram Feed", category: "social", color: "#E1306C",
    description: "Derniers posts Instagram",
    fields: [
      { key: "username", label: "Nom d'utilisateur", type: "text", placeholder: "@monpseudo" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Me suivre" },
      { key: "cta_url", label: "Lien profil", type: "url", placeholder: "https://instagram.com/..." },
    ],
    defaultContent: { username: "@moi", cta_label: "Me suivre sur Instagram" }
  },
}
