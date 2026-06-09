// QRfolio Builder — Types & Definitions

// ── Types de base ─────────────────────────────────────────────────────────────
export type BlockContent = Record<string, string>

export interface Block {
  id: string
  type: string
  content: BlockContent
  visible: boolean
  draft?: boolean
  locked?: boolean
}

export interface PageTheme {
  name: string
  _v?: number              // Version du format (pour compatibilité future)
  // ── Design tokens couleurs ────────────────────────────────────────────────
  bg: string           // Fond global de la page
  surface: string      // Fond des cartes / blocs
  primary: string      // Couleur primaire (boutons, CTA)
  secondary?: string   // Couleur secondaire
  accent: string       // Accent / highlights
  text: string         // Texte principal
  muted: string        // Texte secondaire / placeholder
  border?: string      // Couleur des bordures
  // ── Typographie ──────────────────────────────────────────────────────────
  fontDisplay: string
  fontBody: string
  // ── Fond ─────────────────────────────────────────────────────────────────
  bgMode: "solid" | "gradient" | "pattern" | "image"
  bgGradient?: string
  bgPattern?: string
  bgImage?: string
  // ── Preset metadata ───────────────────────────────────────────────────────
  category?: string
  emoji?: string
  tags?: string[]
}

// Utilitaires couleurs
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#","").match(/.{2}/g)
  if (!m || m.length < 3) return null
  return { r: parseInt(m[0],16), g: parseInt(m[1],16), b: parseInt(m[2],16) }
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let h = 0, s = 0
  const l = (max+min)/2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d/(2-max-min) : d/(max+min)
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break
      case g: h = ((b-r)/d + 2)/6; break
      case b: h = ((r-g)/d + 4)/6; break
    }
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) }
}

export function contrastRatio(hex1: string, hex2: string): number {
  function lum(hex: string) {
    const rgb = hexToRgb(hex)
    if (!rgb) return 0
    const { r, g, b } = rgb
    const [R,G,B] = [r,g,b].map(v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4) })
    return 0.2126*R + 0.7152*G + 0.0722*B
  }
  const l1 = lum(hex1), l2 = lum(hex2)
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)
}

export function wcagLevel(ratio: number): "AAA" | "AA" | "fail" {
  if (ratio >= 7) return "AAA"
  if (ratio >= 4.5) return "AA"
  return "fail"
}

// ── Import / Export thème ────────────────────────────────────────────────────
export const THEME_FORMAT_VERSION = 1

export interface ThemeExport {
  _qrfolio: true
  _v: number
  _exported: string        // ISO date
  name: string
  colors: {
    bg: string; surface: string; primary: string; secondary?: string
    accent: string; text: string; muted: string; border?: string
  }
  typography: { fontDisplay: string; fontBody: string }
  background: {
    mode: string; gradient?: string; pattern?: string
    patternSize?: number; patternColor?: string; patternOpacity?: number
    image?: string; imageSize?: string; imageOverlay?: string; imageBlur?: number
    meshC1?: string; meshC2?: string; meshC3?: string; meshBlur?: number
    radialX?: number; radialY?: number; radialShape?: string
    radialC1?: string; radialC2?: string; radialC3?: string
    customCSS?: string
  }
  effects: {
    noise?: boolean; noiseOpacity?: number
    glow?: boolean; glowColor?: string; glowIntensity?: number; glowSize?: number
    overlay?: boolean; overlayColor?: string; overlayOpacity?: number
    blur?: boolean; blurAmount?: number
    vignette?: boolean; vignetteIntensity?: number
  }
  animation: { type?: string; speed?: number }
}

export function exportThemeToJSON(theme: PageTheme): string {
  const t = theme as any
  const data: ThemeExport = {
    _qrfolio: true,
    _v: THEME_FORMAT_VERSION,
    _exported: new Date().toISOString(),
    name: theme.name,
    colors: {
      bg: theme.bg, surface: theme.surface, primary: theme.primary,
      secondary: theme.secondary, accent: theme.accent, text: theme.text,
      muted: theme.muted, border: theme.border,
    },
    typography: { fontDisplay: theme.fontDisplay, fontBody: theme.fontBody },
    background: {
      mode: theme.bgMode, gradient: theme.bgGradient, pattern: theme.bgPattern,
      patternSize: t.pattern_size, patternColor: t.pattern_color, patternOpacity: t.pattern_opacity,
      image: theme.bgImage, imageSize: t.bgImageSize, imageOverlay: t.bgImageOverlay, imageBlur: t.bgImageBlur,
      meshC1: t.mesh_c1, meshC2: t.mesh_c2, meshC3: t.mesh_c3, meshBlur: t.mesh_blur,
      radialX: t.radial_x, radialY: t.radial_y, radialShape: t.radial_shape,
      radialC1: t.radial_c1, radialC2: t.radial_c2, radialC3: t.radial_c3,
      customCSS: t.customCSS,
    },
    effects: {
      noise: t.effect_noise, noiseOpacity: t.noise_opacity,
      glow: t.effect_glow, glowColor: t.glow_color, glowIntensity: t.glow_intensity, glowSize: t.glow_size,
      overlay: t.effect_overlay, overlayColor: t.overlay_color, overlayOpacity: t.overlay_opacity,
      blur: t.effect_blur, blurAmount: t.blur_amount,
      vignette: t.effect_vignette, vignetteIntensity: t.vignette_intensity,
    },
    animation: { type: t.bgAnimation, speed: t.animationSpeed },
  }
  // Nettoyer les undefined
  return JSON.stringify(data, (_, v) => v === undefined ? undefined : v, 2)
}

export interface ThemeValidationResult {
  ok: boolean
  theme?: PageTheme
  errors: string[]
  warnings: string[]
  version: number
}

export function importThemeFromJSON(raw: string): ThemeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  let data: any
  try { data = JSON.parse(raw) } catch {
    return { ok: false, errors: ["JSON invalide"], warnings: [], version: 0 }
  }

  // Validation _qrfolio marker
  if (!data._qrfolio) errors.push("Marqueur _qrfolio manquant — ce fichier n'est pas un thème QRfolio")
  const version = data._v || 0
  if (version > THEME_FORMAT_VERSION) warnings.push(`Version ${version} supérieure à la version actuelle (${THEME_FORMAT_VERSION}) — certains paramètres peuvent être ignorés`)

  // Valider les couleurs obligatoires
  const hexRe = /^#[0-9a-fA-F]{3,8}$/
  for (const key of ["bg","surface","primary","accent","text","muted"] as const) {
    const val = data.colors?.[key]
    if (!val) errors.push(`Couleur obligatoire manquante: ${key}`)
    else if (!hexRe.test(val)) warnings.push(`Couleur ${key} format inhabituel: ${val}`)
  }

  // Valider bgMode
  const validModes = ["solid","gradient","radial","mesh","pattern","image"]
  if (data.background?.mode && !validModes.includes(data.background.mode))
    warnings.push(`bgMode inconnu: ${data.background.mode}`)

  if (errors.length > 0) return { ok: false, errors, warnings, version }

  // Reconstruire le PageTheme
  const c = data.colors || {}
  const bg = data.background || {}
  const fx = data.effects || {}
  const an = data.animation || {}

  const theme: any = {
    name: data.name || "Thème importé",
    _v: version,
    // Couleurs
    bg: c.bg, surface: c.surface, primary: c.primary, secondary: c.secondary,
    accent: c.accent, text: c.text, muted: c.muted, border: c.border,
    // Typo
    fontDisplay: data.typography?.fontDisplay || "DM Sans",
    fontBody: data.typography?.fontBody || "DM Sans",
    // Fond
    bgMode: bg.mode || "solid", bgGradient: bg.gradient, bgPattern: bg.pattern,
    pattern_size: bg.patternSize, pattern_color: bg.patternColor, pattern_opacity: bg.patternOpacity,
    bgImage: bg.image, bgImageSize: bg.imageSize, bgImageOverlay: bg.imageOverlay, bgImageBlur: bg.imageBlur,
    mesh_c1: bg.meshC1, mesh_c2: bg.meshC2, mesh_c3: bg.meshC3, mesh_blur: bg.meshBlur,
    radial_x: bg.radialX, radial_y: bg.radialY, radial_shape: bg.radialShape,
    radial_c1: bg.radialC1, radial_c2: bg.radialC2, radial_c3: bg.radialC3,
    customCSS: bg.customCSS,
    // Effets
    effect_noise: fx.noise, noise_opacity: fx.noiseOpacity,
    effect_glow: fx.glow, glow_color: fx.glowColor, glow_intensity: fx.glowIntensity, glow_size: fx.glowSize,
    effect_overlay: fx.overlay, overlay_color: fx.overlayColor, overlay_opacity: fx.overlayOpacity,
    effect_blur: fx.blur, blur_amount: fx.blurAmount,
    effect_vignette: fx.vignette, vignette_intensity: fx.vignetteIntensity,
    // Animation
    bgAnimation: an.type, animationSpeed: an.speed,
  }

  return { ok: true, theme: theme as PageTheme, errors: [], warnings, version }
}

// ── Catégories de presets ─────────────────────────────────────────────────────
export const PRESET_CATEGORIES = [
  { id: "Business",     icon: "💼", color: "#3B82F6" },
  { id: "Luxury",       icon: "💎", color: "#C9A84C" },
  { id: "Creator",      icon: "🎨", color: "#EC4899" },
  { id: "Startup",      icon: "🚀", color: "#8B5CF6" },
  { id: "Restaurant",   icon: "🍽️", color: "#F97316" },
  { id: "Immobilier",   icon: "🏠", color: "#10B981" },
  { id: "Fitness",      icon: "💪", color: "#EF4444" },
  { id: "Event",        icon: "🎉", color: "#F59E0B" },
  { id: "Music",        icon: "🎵", color: "#1DB954" },
  { id: "Portfolio",    icon: "📐", color: "#6366F1" },
] as const

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

  // ── BUSINESS ─────────────────────────────────────────────────────────────
  midnight_gold: {
    name: "Midnight Gold", category: "Business", emoji: "💼", tags: ["premium","sombre","or"],
    bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F",
    text: "#F5F0E8", muted: "#8A8478", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans",
    bgMode: "solid",
  },
  corporate_navy: {
    name: "Corporate Navy", category: "Business", emoji: "🏢", tags: ["corporate","bleu","professionnel"],
    bg: "#0D1B2A", surface: "#1A2A3D", primary: "#3B82F6", accent: "#60A5FA",
    text: "#F0F4FF", muted: "#7A8FA8", fontDisplay: "Inter", fontBody: "Inter",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0D1B2A,#1A3050)",
  },
  executive_slate: {
    name: "Executive Slate", category: "Business", emoji: "📊", tags: ["consulting","gris","moderne"],
    bg: "#1C2128", surface: "#252C36", primary: "#58A6FF", accent: "#3FB950",
    text: "#E6EDF3", muted: "#8B949E", fontDisplay: "DM Sans", fontBody: "DM Sans",
    bgMode: "solid",
  },
  boardroom: {
    name: "Boardroom", category: "Business", emoji: "👔", tags: ["executive","sombre","elegant"],
    bg: "#111111", surface: "#1A1A1A", primary: "#E5E5E5", accent: "#C9A84C",
    text: "#F5F5F5", muted: "#888888", fontDisplay: "Playfair Display", fontBody: "DM Sans",
    bgMode: "solid",
  },

  // ── LUXURY ───────────────────────────────────────────────────────────────
  velvet_noir: {
    name: "Velvet Noir", category: "Luxury", emoji: "🖤", tags: ["luxe","violet","sombre"],
    bg: "#0A0A0F", surface: "#13131A", primary: "#A78BFA", accent: "#F472B6",
    text: "#F5F3FF", muted: "#7C6FA8", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans",
    bgMode: "solid",
  },
  golden_luxury: {
    name: "Golden Luxury", category: "Luxury", emoji: "✨", tags: ["or","prestige","dark"],
    bg: "#0A0800", surface: "#1A1400", primary: "#FFD700", accent: "#FFA500",
    text: "#FFF8E1", muted: "#9A8A60", fontDisplay: "Cormorant Garamond", fontBody: "Lora",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0A0800,#1A1200)",
  },
  royal_purple: {
    name: "Royal Purple", category: "Luxury", emoji: "👑", tags: ["royal","violet","premium"],
    bg: "#0A0015", surface: "#150020", primary: "#8B00FF", accent: "#DA70D6",
    text: "#F5F0FF", muted: "#8A6A9A", fontDisplay: "Playfair Display", fontBody: "DM Sans",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0A0015,#1A0030)",
  },
  pearl_white: {
    name: "Pearl White", category: "Luxury", emoji: "🤍", tags: ["blanc","pur","minimaliste"],
    bg: "#FAFAFA", surface: "#F0F0F5", primary: "#1A1A2E", accent: "#C9A84C",
    text: "#1A1A2E", muted: "#6B7280", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans",
    bgMode: "solid",
  },
  champagne: {
    name: "Champagne", category: "Luxury", emoji: "🥂", tags: ["champagne","rose","elegant"],
    bg: "#1A0F0A", surface: "#2A1A12", primary: "#E8C896", accent: "#D4A76A",
    text: "#FFF5E6", muted: "#9A8070", fontDisplay: "Cormorant Garamond", fontBody: "Lora",
    bgMode: "gradient", bgGradient: "linear-gradient(160deg,#1A0F0A,#2D1A10)",
  },

  // ── CREATOR ──────────────────────────────────────────────────────────────
  neon_creator: {
    name: "Neon Creator", category: "Creator", emoji: "⚡", tags: ["neon","creator","moderne"],
    bg: "#050505", surface: "#0F0F0F", primary: "#FF0080", accent: "#00FFFF",
    text: "#F5F0E8", muted: "#888888", fontDisplay: "Space Grotesk", fontBody: "Space Grotesk",
    bgMode: "solid",
  },
  electric_neon: {
    name: "Electric Neon", category: "Creator", emoji: "🟢", tags: ["vert","neon","tech"],
    bg: "#050505", surface: "#0A0A0A", primary: "#39FF8F", accent: "#00FFFF",
    text: "#F5F0E8", muted: "#5A8A7A", fontDisplay: "Space Grotesk", fontBody: "DM Sans",
    bgMode: "solid",
  },
  tiktok_vibes: {
    name: "TikTok Vibes", category: "Creator", emoji: "🎵", tags: ["tiktok","rouge","bleu"],
    bg: "#010101", surface: "#111111", primary: "#FF0050", accent: "#00F2EA",
    text: "#FFFFFF", muted: "#888888", fontDisplay: "Inter", fontBody: "Inter",
    bgMode: "solid",
  },
  cyber_punk: {
    name: "Cyber Punk", category: "Creator", emoji: "🤖", tags: ["cyber","violet","futuriste"],
    bg: "#08001A", surface: "#100028", primary: "#BF00FF", accent: "#FF6B00",
    text: "#F5F0E8", muted: "#7A6A8A", fontDisplay: "Space Grotesk", fontBody: "Space Grotesk",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#08001A,#150030)",
  },

  // ── STARTUP ──────────────────────────────────────────────────────────────
  deep_space: {
    name: "Deep Space", category: "Startup", emoji: "🚀", tags: ["tech","sombre","bleu"],
    bg: "#020B18", surface: "#0A1628", primary: "#00D4FF", accent: "#7B2FBE",
    text: "#F5F0E8", muted: "#8A9BA8", fontDisplay: "Space Grotesk", fontBody: "Inter",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#020B18,#0A1628)",
  },
  aurora: {
    name: "Aurora", category: "Startup", emoji: "🌌", tags: ["aurora","gradient","moderne"],
    bg: "#0A0F1E", surface: "#0F1628", primary: "#00FF9D", accent: "#FF6B6B",
    text: "#F5F0E8", muted: "#8A8FA0", fontDisplay: "Space Grotesk", fontBody: "Inter",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0A0F1E,#1A0A28)",
  },
  saas_blue: {
    name: "SaaS Blue", category: "Startup", emoji: "💡", tags: ["saas","bleu","clean"],
    bg: "#F8FAFF", surface: "#EEF2FF", primary: "#4F46E5", accent: "#7C3AED",
    text: "#1E1B4B", muted: "#6B7280", fontDisplay: "Inter", fontBody: "Inter",
    bgMode: "solid",
  },
  matrix_code: {
    name: "Matrix Code", category: "Startup", emoji: "💻", tags: ["matrix","vert","hacker"],
    bg: "#000D00", surface: "#001500", primary: "#00FF41", accent: "#00CC33",
    text: "#00FF41", muted: "#006B1A", fontDisplay: "JetBrains Mono", fontBody: "JetBrains Mono",
    bgMode: "solid",
  },

  // ── RESTAURANT ────────────────────────────────────────────────────────────
  sunset_fire: {
    name: "Sunset Fire", category: "Restaurant", emoji: "🔥", tags: ["orange","chaud","bistro"],
    bg: "#1A0500", surface: "#2D0A00", primary: "#FF6B00", accent: "#FF8C00",
    text: "#FFF5E6", muted: "#9A7A5A", fontDisplay: "Playfair Display", fontBody: "Lora",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#1A0500,#2D0A00)",
  },
  bistro_rouge: {
    name: "Bistro Rouge", category: "Restaurant", emoji: "🍷", tags: ["rouge","vin","francais"],
    bg: "#1A0008", surface: "#2D0012", primary: "#DC2626", accent: "#EF4444",
    text: "#FFF0F0", muted: "#9A7A78", fontDisplay: "Playfair Display", fontBody: "DM Sans",
    bgMode: "solid",
  },
  coffee_house: {
    name: "Coffee House", category: "Restaurant", emoji: "☕", tags: ["cafe","marron","cosy"],
    bg: "#1A0F0A", surface: "#2D1A10", primary: "#8B4513", accent: "#D2691E",
    text: "#FFF5E6", muted: "#9A8A7A", fontDisplay: "Lora", fontBody: "Lora",
    bgMode: "solid",
  },
  garden_fresh: {
    name: "Garden Fresh", category: "Restaurant", emoji: "🌿", tags: ["bio","vert","frais"],
    bg: "#F5FFF5", surface: "#E8F5E8", primary: "#16A34A", accent: "#4ADE80",
    text: "#052E16", muted: "#6B7A6B", fontDisplay: "Merriweather", fontBody: "DM Sans",
    bgMode: "solid",
  },

  // ── IMMOBILIER ────────────────────────────────────────────────────────────
  prestige_immo: {
    name: "Prestige Immo", category: "Immobilier", emoji: "🏠", tags: ["prestige","or","luxe"],
    bg: "#0F0F0F", surface: "#1A1A1A", primary: "#D4AF37", accent: "#F0D060",
    text: "#F5F0E8", muted: "#9A9080", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans",
    bgMode: "solid",
  },
  coastal_living: {
    name: "Coastal Living", category: "Immobilier", emoji: "🌊", tags: ["mer","bleu","clair"],
    bg: "#F0F8FF", surface: "#E0F0FF", primary: "#0284C7", accent: "#0EA5E9",
    text: "#0C2340", muted: "#4A7A9A", fontDisplay: "Playfair Display", fontBody: "Inter",
    bgMode: "solid",
  },
  urban_loft: {
    name: "Urban Loft", category: "Immobilier", emoji: "🏙️", tags: ["urbain","gris","moderne"],
    bg: "#1C1C1C", surface: "#2C2C2C", primary: "#E5E5E5", accent: "#888888",
    text: "#F5F5F5", muted: "#888888", fontDisplay: "Space Grotesk", fontBody: "Inter",
    bgMode: "solid",
  },

  // ── FITNESS ───────────────────────────────────────────────────────────────
  power_red: {
    name: "Power Red", category: "Fitness", emoji: "💪", tags: ["rouge","energie","sport"],
    bg: "#0A0000", surface: "#180000", primary: "#DC2626", accent: "#F97316",
    text: "#FFF0F0", muted: "#9A6A6A", fontDisplay: "Space Grotesk", fontBody: "Space Grotesk",
    bgMode: "solid",
  },
  iron_black: {
    name: "Iron Black", category: "Fitness", emoji: "🏋️", tags: ["noir","metal","muscu"],
    bg: "#080808", surface: "#111111", primary: "#FFFFFF", accent: "#EF4444",
    text: "#F5F5F5", muted: "#888888", fontDisplay: "Space Grotesk", fontBody: "Inter",
    bgMode: "solid",
  },
  zen_wellness: {
    name: "Zen Wellness", category: "Fitness", emoji: "🧘", tags: ["zen","vert","calme"],
    bg: "#F5FFF5", surface: "#E8F5E8", primary: "#059669", accent: "#34D399",
    text: "#064E3B", muted: "#6B8A7A", fontDisplay: "Merriweather", fontBody: "DM Sans",
    bgMode: "solid",
  },
  orange_boost: {
    name: "Orange Boost", category: "Fitness", emoji: "🏃", tags: ["orange","running","energie"],
    bg: "#0A0500", surface: "#1A0A00", primary: "#EA580C", accent: "#FB923C",
    text: "#FFF5E6", muted: "#9A7A5A", fontDisplay: "Space Grotesk", fontBody: "Inter",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0A0500,#1A0800)",
  },

  // ── EVENT ─────────────────────────────────────────────────────────────────
  festival_night: {
    name: "Festival Night", category: "Event", emoji: "🎉", tags: ["festival","sombre","fete"],
    bg: "#050008", surface: "#0A0012", primary: "#FF6B35", accent: "#FFD700",
    text: "#F5F0E8", muted: "#8A7A6A", fontDisplay: "Space Grotesk", fontBody: "DM Sans",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#050008,#0A000F)",
  },
  celebration: {
    name: "Celebration", category: "Event", emoji: "🥳", tags: ["fete","or","festif"],
    bg: "#0A0500", surface: "#150A00", primary: "#F59E0B", accent: "#FCD34D",
    text: "#FFF5E6", muted: "#9A8060", fontDisplay: "Playfair Display", fontBody: "DM Sans",
    bgMode: "solid",
  },
  corporate_event: {
    name: "Corporate Event", category: "Event", emoji: "🎯", tags: ["conference","bleu","pro"],
    bg: "#0D1B2A", surface: "#1A2A3D", primary: "#3B82F6", accent: "#60A5FA",
    text: "#F0F4FF", muted: "#7A8FA8", fontDisplay: "Inter", fontBody: "Inter",
    bgMode: "gradient", bgGradient: "linear-gradient(160deg,#0D1B2A,#1A3050)",
  },
  wedding: {
    name: "Wedding", category: "Event", emoji: "💍", tags: ["mariage","rose","elegant"],
    bg: "#FDF8F5", surface: "#F5EEE8", primary: "#BE8A6A", accent: "#E8B89A",
    text: "#3D2B1A", muted: "#9A8070", fontDisplay: "Cormorant Garamond", fontBody: "Lora",
    bgMode: "solid",
  },

  // ── MUSIC ─────────────────────────────────────────────────────────────────
  studio_dark: {
    name: "Studio Dark", category: "Music", emoji: "🎙️", tags: ["studio","sombre","rap"],
    bg: "#050505", surface: "#0F0F0F", primary: "#1DB954", accent: "#1ED760",
    text: "#FFFFFF", muted: "#B3B3B3", fontDisplay: "Space Grotesk", fontBody: "DM Sans",
    bgMode: "solid",
  },
  rose_luxe: {
    name: "Rose Luxe", category: "Music", emoji: "🌸", tags: ["rose","pop","girly"],
    bg: "#0D0008", surface: "#1A0012", primary: "#EC4899", accent: "#F472B6",
    text: "#FFF0F8", muted: "#9A7A88", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0D0008,#1A0015)",
  },
  vinyl_club: {
    name: "Vinyl Club", category: "Music", emoji: "🎵", tags: ["vinyle","retro","jazz"],
    bg: "#1A1209", surface: "#2A1E10", primary: "#D97706", accent: "#F59E0B",
    text: "#FFF8E6", muted: "#9A8A6A", fontDisplay: "Lora", fontBody: "Lora",
    bgMode: "solid",
  },
  cherry_blossom: {
    name: "Cherry Blossom", category: "Music", emoji: "🌺", tags: ["rose","sakura","doux"],
    bg: "#1A0010", surface: "#2D0018", primary: "#FF6B9D", accent: "#FFB3C8",
    text: "#FFF0F5", muted: "#9A7A85", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans",
    bgMode: "solid",
  },

  // ── PORTFOLIO ─────────────────────────────────────────────────────────────
  pure_white: {
    name: "Pure White", category: "Portfolio", emoji: "⬜", tags: ["blanc","minimaliste","clean"],
    bg: "#FFFFFF", surface: "#F8F8F8", primary: "#1A1A1A", accent: "#C9A84C",
    text: "#1A1A1A", muted: "#6B7280", fontDisplay: "Playfair Display", fontBody: "Inter",
    bgMode: "solid",
  },
  minimal_cream: {
    name: "Minimal Cream", category: "Portfolio", emoji: "🤎", tags: ["creme","chaud","design"],
    bg: "#FAF7F2", surface: "#F0EDE8", primary: "#1A1A1A", accent: "#C9A84C",
    text: "#2D2D2D", muted: "#7A7060", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans",
    bgMode: "solid",
  },
  ocean_deep: {
    name: "Ocean Deep", category: "Portfolio", emoji: "🌊", tags: ["ocean","bleu","sombre"],
    bg: "#050F1A", surface: "#0A1E2A", primary: "#00B4D8", accent: "#0096C7",
    text: "#F5F0E8", muted: "#6A8A9A", fontDisplay: "Space Grotesk", fontBody: "Inter",
    bgMode: "gradient", bgGradient: "linear-gradient(160deg,#050F1A,#0A1E2A)",
  },
  candy_pop: {
    name: "Candy Pop", category: "Portfolio", emoji: "🍭", tags: ["coloré","fun","jeune"],
    bg: "#FFF0FA", surface: "#FFE0F5", primary: "#EC4899", accent: "#8B5CF6",
    text: "#1A1A1A", muted: "#9A6A8A", fontDisplay: "Space Grotesk", fontBody: "Inter",
    bgMode: "solid",
  },
  forest_zen: {
    name: "Forest Zen", category: "Portfolio", emoji: "🌿", tags: ["nature","vert","calme"],
    bg: "#0A1A0E", surface: "#0F2414", primary: "#2ECC71", accent: "#27AE60",
    text: "#F5F0E8", muted: "#6A8A6A", fontDisplay: "Merriweather", fontBody: "DM Sans",
    bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0A1A0E,#0F2414)",
  },
}

// ── Reseaux sociaux ───────────────────────────────────────────────────────────
export const SOCIAL_NETWORKS = [
  // Réseaux sociaux
  { key: "instagram", label: "Instagram", icon: "📸", color: "#E1306C", group: "social" },
  { key: "tiktok", label: "TikTok", icon: "🎵", color: "#F5F0E8", group: "social" },
  { key: "facebook", label: "Facebook", icon: "👥", color: "#1877F2", group: "social" },
  { key: "linkedin", label: "LinkedIn", icon: "💼", color: "#0A66C2", group: "social" },
  { key: "twitter", label: "X / Twitter", icon: "🐦", color: "#1DA1F2", group: "social" },
  { key: "threads", label: "Threads", icon: "🧵", color: "#F5F0E8", group: "social" },
  { key: "bluesky", label: "Bluesky", icon: "🦋", color: "#0085FF", group: "social" },
  { key: "mastodon", label: "Mastodon", icon: "🐘", color: "#6364FF", group: "social" },
  { key: "pinterest", label: "Pinterest", icon: "📌", color: "#E60023", group: "social" },
  { key: "snapchat", label: "Snapchat", icon: "👻", color: "#FFFC00", group: "social" },
  { key: "reddit", label: "Reddit", icon: "🤖", color: "#FF4500", group: "social" },
  // Vidéo & Streaming
  { key: "youtube", label: "YouTube", icon: "▶️", color: "#FF0000", group: "video" },
  { key: "vimeo", label: "Vimeo", icon: "🎬", color: "#1AB7EA", group: "video" },
  { key: "dailymotion", label: "Dailymotion", icon: "📹", color: "#003F6C", group: "video" },
  { key: "twitch", label: "Twitch", icon: "🎮", color: "#9146FF", group: "video" },
  { key: "kick", label: "Kick", icon: "🟢", color: "#53FC18", group: "video" },
  { key: "rumble", label: "Rumble", icon: "📺", color: "#85C742", group: "video" },
  // Messagerie
  { key: "whatsapp", label: "WhatsApp", icon: "💬", color: "#25D366", group: "messaging" },
  { key: "telegram", label: "Telegram", icon: "✈️", color: "#26A5E4", group: "messaging" },
  { key: "discord", label: "Discord", icon: "🎮", color: "#5865F2", group: "messaging" },
  { key: "signal", label: "Signal", icon: "🔒", color: "#3A76F0", group: "messaging" },
  { key: "messenger", label: "Messenger", icon: "💬", color: "#0084FF", group: "messaging" },
  { key: "skype", label: "Skype", icon: "📞", color: "#00AFF0", group: "messaging" },
  { key: "wechat", label: "WeChat", icon: "💚", color: "#07C160", group: "messaging" },
  { key: "line", label: "Line", icon: "🟢", color: "#00B900", group: "messaging" },
  { key: "viber", label: "Viber", icon: "📱", color: "#7360F2", group: "messaging" },
  // Musique
  { key: "spotify", label: "Spotify", icon: "🎧", color: "#1DB954", group: "music" },
  { key: "apple_music", label: "Apple Music", icon: "🍎", color: "#FC3C44", group: "music" },
  { key: "deezer", label: "Deezer", icon: "🎶", color: "#A238FF", group: "music" },
  { key: "soundcloud", label: "SoundCloud", icon: "☁️", color: "#FF5500", group: "music" },
  { key: "bandcamp", label: "Bandcamp", icon: "🎸", color: "#1DA0C3", group: "music" },
  { key: "audiomack", label: "Audiomack", icon: "🎵", color: "#FFA200", group: "music" },
  { key: "tidal", label: "Tidal", icon: "🌊", color: "#00FFFF", group: "music" },
  { key: "amazon_music", label: "Amazon Music", icon: "🎵", color: "#00A8E1", group: "music" },
  { key: "youtube_music", label: "YouTube Music", icon: "▶️", color: "#FF0000", group: "music" },
  // Podcast
  { key: "spotify_podcast", label: "Spotify Podcasts", icon: "🎙️", color: "#1DB954", group: "podcast" },
  { key: "apple_podcast", label: "Apple Podcasts", icon: "🎙️", color: "#B150E2", group: "podcast" },
  { key: "podcast_addict", label: "Podcast Addict", icon: "🎧", color: "#F4842B", group: "podcast" },
  { key: "pocket_casts", label: "Pocket Casts", icon: "📻", color: "#F43E37", group: "podcast" },
  { key: "castbox", label: "Castbox", icon: "📦", color: "#F55B23", group: "podcast" },
  { key: "overcast", label: "Overcast", icon: "🌤️", color: "#FC7E0F", group: "podcast" },
  // Développeurs
  { key: "github", label: "GitHub", icon: "💻", color: "#F5F0E8", group: "dev" },
  { key: "gitlab", label: "GitLab", icon: "🦊", color: "#FC6D26", group: "dev" },
  { key: "bitbucket", label: "Bitbucket", icon: "🪣", color: "#0052CC", group: "dev" },
  { key: "stackoverflow", label: "Stack Overflow", icon: "📚", color: "#F58025", group: "dev" },
  { key: "devto", label: "Dev.to", icon: "💡", color: "#F5F0E8", group: "dev" },
  { key: "hashnode", label: "Hashnode", icon: "✏️", color: "#2962FF", group: "dev" },
  { key: "codepen", label: "CodePen", icon: "🖊️", color: "#F5F0E8", group: "dev" },
  // Design & Créatifs
  { key: "behance", label: "Behance", icon: "🎨", color: "#1769FF", group: "creative" },
  { key: "dribbble", label: "Dribbble", icon: "🏀", color: "#EA4C89", group: "creative" },
  { key: "artstation", label: "ArtStation", icon: "🎭", color: "#13AFF0", group: "creative" },
  { key: "deviantart", label: "DeviantArt", icon: "🎪", color: "#05CC47", group: "creative" },
  { key: "pixiv", label: "Pixiv", icon: "🖼️", color: "#0096FA", group: "creative" },
  { key: "flickr", label: "Flickr", icon: "📷", color: "#FF0084", group: "creative" },
  // Freelance
  { key: "malt", label: "Malt", icon: "🌾", color: "#FF5C57", group: "freelance" },
  { key: "fiverr", label: "Fiverr", icon: "💚", color: "#1DBF73", group: "freelance" },
  { key: "upwork", label: "Upwork", icon: "💼", color: "#14A800", group: "freelance" },
  { key: "comeup", label: "ComeUp", icon: "🚀", color: "#7C3AED", group: "freelance" },
  { key: "freelancer", label: "Freelancer.com", icon: "🖊️", color: "#29B2FE", group: "freelance" },
  // E-commerce
  { key: "shopify", label: "Shopify", icon: "🛍️", color: "#96BF48", group: "ecommerce" },
  { key: "etsy", label: "Etsy", icon: "🧶", color: "#F56400", group: "ecommerce" },
  { key: "amazon_store", label: "Amazon Store", icon: "📦", color: "#FF9900", group: "ecommerce" },
  { key: "vinted", label: "Vinted", icon: "👗", color: "#09B1BA", group: "ecommerce" },
  { key: "leboncoin", label: "Leboncoin", icon: "🏷️", color: "#F56B2A", group: "ecommerce" },
  // Paiement & Soutien
  { key: "paypal", label: "PayPal", icon: "💙", color: "#009CDE", group: "payment" },
  { key: "kofi", label: "Ko-fi", icon: "☕", color: "#FF5E5B", group: "payment" },
  { key: "buymeacoffee", label: "Buy Me A Coffee", icon: "☕", color: "#FFDD00", group: "payment" },
  { key: "patreon", label: "Patreon", icon: "🎨", color: "#FF424D", group: "payment" },
  { key: "tipeee", label: "Tipeee", icon: "💜", color: "#E55100", group: "payment" },
  // Restaurant & Local
  { key: "google_business", label: "Google Business", icon: "📍", color: "#4285F4", group: "local" },
  { key: "tripadvisor", label: "Tripadvisor", icon: "🦉", color: "#34E0A1", group: "local" },
  { key: "thefork", label: "TheFork", icon: "🍽️", color: "#00B183", group: "local" },
  { key: "airbnb", label: "Airbnb", icon: "🏠", color: "#FF5A5F", group: "local" },
  // Liens génériques
  { key: "website", label: "Site web", icon: "🌐", color: "#C9A84C", group: "generic" },
  { key: "blog", label: "Blog", icon: "✏️", color: "#C9A84C", group: "generic" },
  { key: "portfolio", label: "Portfolio", icon: "🗂️", color: "#C9A84C", group: "generic" },
  { key: "email", label: "Email", icon: "✉️", color: "#39FF8F", group: "generic" },
  { key: "phone", label: "Téléphone", icon: "📞", color: "#4ADE80", group: "generic" },
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
  hint?: string    // Cas d usage court (1 ligne)
  preview?: string // Aperçu textuel exemple
}

// Cas d usage pour les blocs clés
export const BLOCK_HINTS: Record<string, { hint: string; preview: string }> = {
  profile:        { hint: "Idéal en premier bloc", preview: "Photo · Nom · Accroche" },
  bio:            { hint: "Présentez-vous en 2-3 phrases", preview: "Dev passionne..." },
  cta_button:     { hint: "Votre action principale", preview: "[ Me contacter → ]" },
  social_links:   { hint: "Tous vos réseaux en un clic", preview: "Instagram · TikTok · LinkedIn" },
  link_button:    { hint: "Lien vers n importe quelle URL", preview: "[ Mon site web → ]" },
  image_block:    { hint: "Photo ou illustration", preview: "🖼 Image pleine largeur" },
  video_embed:    { hint: "YouTube, Vimeo, TikTok...", preview: "▶ Lecture directe" },
  gallery:        { hint: "Grille de photos 2x ou 3x", preview: "📷 📷 📷" },
  product:        { hint: "Fiche produit avec prix et CTA", preview: "Produit · 29€ · [Acheter]" },
  pricing:        { hint: "Grille de tarifs / abonnements", preview: "Free · Pro · Business" },
  faq:            { hint: "Questions fréquentes accordéon", preview: "▸ Comment ça marche ?" },
  testimonials:   { hint: "Avis clients avec étoiles", preview: "⭐⭐⭐⭐⭐ 'Excellent !'" },
  countdown:      { hint: "Compte à rebours événement", preview: "12j 4h 23m 15s" },
  map_embed:      { hint: "Carte Google Maps intégrée", preview: "📍 12 rue de la Paix, Paris" },
  contact_form:   { hint: "Formulaire nom + email + message", preview: "Nom · Email · [Envoyer]" },
  stats:          { hint: "Chiffres clés de votre activité", preview: "500+ clients · 98% satisfaction" },
  spotify_embed:  { hint: "Lecteur Spotify intégré", preview: "🎧 Titre · Album · Artiste" },
  latest_release: { hint: "Mise en avant de votre sortie", preview: "🔥 Nouveau single dispo" },
  concerts:       { hint: "Dates de tournée et billetterie", preview: "📍 Paris · 15 juin · [Billets]" },
  event_program:  { hint: "Planning détaillé de l événement", preview: "18h Accueil · 20h Concert" },
  hero_banner:    { hint: "Grande bannière d ouverture", preview: "TITRE · Sous-titre · [CTA]" },
  section_banner: { hint: "Séparateur visuel de section", preview: "━━━ MES SERVICES ━━━" },
  qr_code_block:  { hint: "Affiche le QR code de la page", preview: "⬛⬛ QR Code ⬛⬛" },
  tabs_block:     { hint: "Contenu organisé par onglets", preview: "| Tab 1 | Tab 2 | Tab 3 |" },
  accordion_block:{ hint: "Sections repliables (FAQ, infos)", preview: "▸ Section 1  ▸ Section 2" },
  embed_block:    { hint: "Intégrer Google Forms, Typeform...", preview: "🔗 iframe externe" },
  two_columns:    { hint: "Mise en page côte à côte", preview: "| Col 1 | Col 2 |" },
  grid_section:   { hint: "Grille de cartes 2/3/4 colonnes", preview: "⬜⬜⬜ cartes" },
  merch:          { hint: "Boutique de produits dérivés", preview: "👕 T-shirt · 🧢 Cap · 💿 Vinyle" },
  presave:        { hint: "Pré-save avant une sortie", preview: "💾 Sort le 15 juin · [Pré-save]" },
  rsvp:           { hint: "Confirmation de présence", preview: "[✅ Oui] [🤔 Peut-être] [❌ Non]" },
  lineup:         { hint: "Liste des artistes festival", preview: "HEADLINER · Artiste 2 · ..." },
  info_box:       { hint: "Mettre un texte important en avant", preview: "💡 À savoir : ..." },
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


  // ── Nouveaux blocs Commerce ───────────────────────────────────────────────
  product_catalog: {
    label: "Catalogue produits", description: "Liste de plusieurs produits",
    icon: "🛍️", color: "#F97316", category: "commerce",
    defaultContent: { title: "Nos produits" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos produits" },
      { key: "p1_img", label: "Produit 1 — Image", type: "image" },
      { key: "p1_name", label: "Produit 1 — Nom", type: "text", placeholder: "Mon produit" },
      { key: "p1_price", label: "Produit 1 — Prix", type: "text", placeholder: "29€" },
      { key: "p1_desc", label: "Produit 1 — Description", type: "text", placeholder: "Description courte" },
      { key: "p1_url", label: "Produit 1 — Lien", type: "url", placeholder: "https://..." },
      { key: "p2_img", label: "Produit 2 — Image", type: "image" },
      { key: "p2_name", label: "Produit 2 — Nom", type: "text", placeholder: "Mon produit 2" },
      { key: "p2_price", label: "Produit 2 — Prix", type: "text", placeholder: "49€" },
      { key: "p2_desc", label: "Produit 2 — Description", type: "text", placeholder: "Description courte" },
      { key: "p2_url", label: "Produit 2 — Lien", type: "url", placeholder: "https://..." },
      { key: "p3_img", label: "Produit 3 — Image", type: "image" },
      { key: "p3_name", label: "Produit 3 — Nom", type: "text", placeholder: "Mon produit 3" },
      { key: "p3_price", label: "Produit 3 — Prix", type: "text", placeholder: "79€" },
      { key: "p3_desc", label: "Produit 3 — Description", type: "text", placeholder: "Description courte" },
      { key: "p3_url", label: "Produit 3 — Lien", type: "url", placeholder: "https://..." },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Acheter" },
    ],
  },
  featured_product: {
    label: "Produit vedette", description: "Mettre en avant une offre principale",
    icon: "⭐", color: "#F97316", category: "commerce",
    defaultContent: { badge: "⭐ Recommandé", cta_label: "Commander maintenant" },
    fields: [
      { key: "badge", label: "Badge", type: "text", placeholder: "⭐ Recommandé" },
      { key: "image", label: "Image produit", type: "image" },
      { key: "name", label: "Nom", type: "text", placeholder: "Mon produit phare" },
      { key: "price", label: "Prix", type: "text", placeholder: "99€" },
      { key: "old_price", label: "Ancien prix", type: "text", placeholder: "149€" },
      { key: "description", label: "Description", type: "textarea", placeholder: "Ce produit change tout..." },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Commander maintenant" },
      { key: "cta_url", label: "Lien", type: "url", placeholder: "https://..." },
    ],
  },
  offer_comparison: {
    label: "Comparatif offres", description: "Comparer plusieurs formules",
    icon: "📊", color: "#F97316", category: "commerce",
    defaultContent: { title: "Nos formules", plan1_name: "Basic", plan1_price: "0€", plan2_name: "Pro", plan2_price: "29€", plan3_name: "Business", plan3_price: "99€" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Nos formules" },
      { key: "plan1_name", label: "Formule 1 — Nom", type: "text", placeholder: "Basic" },
      { key: "plan1_price", label: "Formule 1 — Prix", type: "text", placeholder: "0€" },
      { key: "plan1_features", label: "Formule 1 — Avantages (1 par ligne)", type: "textarea", placeholder: "1 projet / Support email / 5 GB stockage" },
      { key: "plan2_name", label: "Formule 2 — Nom", type: "text", placeholder: "Pro" },
      { key: "plan2_price", label: "Formule 2 — Prix", type: "text", placeholder: "29€" },
      { key: "plan2_features", label: "Formule 2 — Avantages", type: "textarea", placeholder: "10 projets / Support prioritaire / 50 GB stockage" },
      { key: "plan2_highlight", label: "Formule 2 — Mettre en avant", type: "select", options: ["yes", "no"] },
      { key: "plan3_name", label: "Formule 3 — Nom", type: "text", placeholder: "Business" },
      { key: "plan3_price", label: "Formule 3 — Prix", type: "text", placeholder: "99€" },
      { key: "plan3_features", label: "Formule 3 — Avantages", type: "textarea", placeholder: "Illimité / Account manager / API access" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Choisir" },
      { key: "cta_url", label: "Lien", type: "url", placeholder: "https://..." },
    ],
  },
  packs: {
    label: "Packs / Formules", description: "Vente de packs de services",
    icon: "🚀", color: "#F97316", category: "commerce",
    defaultContent: { title: "Nos packs" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos packs" },
      { key: "pack1_icon", label: "Pack 1 — Emoji", type: "text", placeholder: "🚀" },
      { key: "pack1_name", label: "Pack 1 — Nom", type: "text", placeholder: "Starter" },
      { key: "pack1_price", label: "Pack 1 — Prix", type: "text", placeholder: "299€" },
      { key: "pack1_content", label: "Pack 1 — Contenu", type: "textarea", placeholder: "Audit complet / Rapport PDF / 1 heure conseil" },
      { key: "pack1_url", label: "Pack 1 — Lien", type: "url", placeholder: "https://..." },
      { key: "pack2_icon", label: "Pack 2 — Emoji", type: "text", placeholder: "💎" },
      { key: "pack2_name", label: "Pack 2 — Nom", type: "text", placeholder: "Premium" },
      { key: "pack2_price", label: "Pack 2 — Prix", type: "text", placeholder: "599€" },
      { key: "pack2_content", label: "Pack 2 — Contenu", type: "textarea", placeholder: "Tout le Starter / + Formation / + Suivi 3 mois" },
      { key: "pack2_url", label: "Pack 2 — Lien", type: "url", placeholder: "https://..." },
      { key: "pack3_icon", label: "Pack 3 — Emoji", type: "text", placeholder: "👑" },
      { key: "pack3_name", label: "Pack 3 — Nom", type: "text", placeholder: "VIP" },
      { key: "pack3_price", label: "Pack 3 — Prix", type: "text", placeholder: "Sur devis" },
      { key: "pack3_content", label: "Pack 3 — Contenu", type: "textarea", placeholder: "Sur mesure / Accompagnement total" },
      { key: "pack3_url", label: "Pack 3 — Lien", type: "url", placeholder: "https://..." },
    ],
  },
  before_after: {
    label: "Avant / Après", description: "Montrer une transformation ou résultat",
    icon: "🔄", color: "#F97316", category: "commerce",
    defaultContent: { title: "Avant / Après" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Avant / Après" },
      { key: "before_img", label: "Image Avant", type: "image" },
      { key: "before_label", label: "Label Avant", type: "text", placeholder: "Avant" },
      { key: "after_img", label: "Image Après", type: "image" },
      { key: "after_label", label: "Label Après", type: "text", placeholder: "Après" },
      { key: "description", label: "Description", type: "text", placeholder: "Résultat en 4 semaines" },
    ],
  },
  portfolio_work: {
    label: "Réalisations", description: "Portfolio commercial avec projets",
    icon: "📂", color: "#F97316", category: "commerce",
    defaultContent: { title: "Mes réalisations" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mes réalisations" },
      { key: "work1_img", label: "Projet 1 — Image", type: "image" },
      { key: "work1_title", label: "Projet 1 — Titre", type: "text", placeholder: "Projet client A" },
      { key: "work1_desc", label: "Projet 1 — Description", type: "text", placeholder: "Refonte complète du site" },
      { key: "work2_img", label: "Projet 2 — Image", type: "image" },
      { key: "work2_title", label: "Projet 2 — Titre", type: "text", placeholder: "Projet client B" },
      { key: "work2_desc", label: "Projet 2 — Description", type: "text", placeholder: "Campagne réseaux sociaux" },
      { key: "work3_img", label: "Projet 3 — Image", type: "image" },
      { key: "work3_title", label: "Projet 3 — Titre", type: "text", placeholder: "Projet client C" },
      { key: "work3_desc", label: "Projet 3 — Description", type: "text", placeholder: "Application mobile" },
      { key: "cta_label", label: "Bouton voir plus", type: "text", placeholder: "Voir tout le portfolio" },
      { key: "cta_url", label: "Lien portfolio", type: "url", placeholder: "https://..." },
    ],
  },
  google_reviews_block: {
    label: "Avis clients", description: "Affichage avis clients avec notes",
    icon: "⭐", color: "#FBBF24", category: "commerce",
    defaultContent: { title: "Ce que disent nos clients", avg_rating: "4.9", total_reviews: "127" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Ce que disent nos clients" },
      { key: "avg_rating", label: "Note moyenne (ex: 4.9)", type: "text", placeholder: "4.9" },
      { key: "total_reviews", label: "Nombre d avis", type: "text", placeholder: "127" },
      { key: "r1_name", label: "Avis 1 — Auteur", type: "text", placeholder: "Marie D." },
      { key: "r1_stars", label: "Avis 1 — Note", type: "select", options: ["5","4","3","2","1"] },
      { key: "r1_text", label: "Avis 1 — Commentaire", type: "textarea", placeholder: "Excellent service !" },
      { key: "r2_name", label: "Avis 2 — Auteur", type: "text", placeholder: "Paul M." },
      { key: "r2_stars", label: "Avis 2 — Note", type: "select", options: ["5","4","3","2","1"] },
      { key: "r2_text", label: "Avis 2 — Commentaire", type: "textarea", placeholder: "Je recommande vivement" },
      { key: "r3_name", label: "Avis 3 — Auteur", type: "text", placeholder: "Sophie L." },
      { key: "r3_stars", label: "Avis 3 — Note", type: "select", options: ["5","4","3","2","1"] },
      { key: "r3_text", label: "Avis 3 — Commentaire", type: "textarea", placeholder: "Parfait !" },
      { key: "google_url", label: "Lien Google Reviews", type: "url", placeholder: "https://g.page/r/..." },
    ],
  },
  business_stats: {
    label: "Statistiques business", description: "Chiffres clés et preuves sociales",
    icon: "📈", color: "#F97316", category: "commerce",
    defaultContent: { stat1_value: "500+", stat1_label: "Clients", stat2_value: "4.9/5", stat2_label: "Note moyenne", stat3_value: "10 ans", stat3_label: "Expérience" },
    fields: [
      { key: "stat1_value", label: "Stat 1 — Chiffre", type: "text", placeholder: "500+" },
      { key: "stat1_label", label: "Stat 1 — Label", type: "text", placeholder: "Clients" },
      { key: "stat1_icon", label: "Stat 1 — Emoji", type: "text", placeholder: "👥" },
      { key: "stat2_value", label: "Stat 2 — Chiffre", type: "text", placeholder: "4.9/5" },
      { key: "stat2_label", label: "Stat 2 — Label", type: "text", placeholder: "Note moyenne" },
      { key: "stat2_icon", label: "Stat 2 — Emoji", type: "text", placeholder: "⭐" },
      { key: "stat3_value", label: "Stat 3 — Chiffre", type: "text", placeholder: "10 ans" },
      { key: "stat3_label", label: "Stat 3 — Label", type: "text", placeholder: "Expérience" },
      { key: "stat3_icon", label: "Stat 3 — Emoji", type: "text", placeholder: "🏆" },
      { key: "stat4_value", label: "Stat 4 — Chiffre (optionnel)", type: "text", placeholder: "98%" },
      { key: "stat4_label", label: "Stat 4 — Label", type: "text", placeholder: "Satisfaction" },
      { key: "stat4_icon", label: "Stat 4 — Emoji", type: "text", placeholder: "😊" },
    ],
  },
  partners: {
    label: "Partenaires / Clients", description: "Logos de marques partenaires",
    icon: "🤝", color: "#F97316", category: "commerce",
    defaultContent: { title: "Ils nous font confiance" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Ils nous font confiance" },
      { key: "logo1_img", label: "Logo 1", type: "image" },
      { key: "logo1_name", label: "Logo 1 — Nom", type: "text", placeholder: "Partenaire A" },
      { key: "logo2_img", label: "Logo 2", type: "image" },
      { key: "logo2_name", label: "Logo 2 — Nom", type: "text", placeholder: "Partenaire B" },
      { key: "logo3_img", label: "Logo 3", type: "image" },
      { key: "logo3_name", label: "Logo 3 — Nom", type: "text", placeholder: "Partenaire C" },
      { key: "logo4_img", label: "Logo 4", type: "image" },
      { key: "logo4_name", label: "Logo 4 — Nom", type: "text", placeholder: "Partenaire D" },
      { key: "logo5_img", label: "Logo 5", type: "image" },
      { key: "logo5_name", label: "Logo 5 — Nom", type: "text", placeholder: "Partenaire E" },
      { key: "logo6_img", label: "Logo 6", type: "image" },
      { key: "logo6_name", label: "Logo 6 — Nom", type: "text", placeholder: "Partenaire F" },
    ],
  },
  brands: {
    label: "Marques distribuées", description: "Produits ou marques vendus",
    icon: "🏷️", color: "#F97316", category: "commerce",
    defaultContent: { title: "Nos marques" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos marques" },
      { key: "brand1_icon", label: "Marque 1 — Emoji/Logo", type: "text", placeholder: "🥃" },
      { key: "brand1_name", label: "Marque 1 — Nom", type: "text", placeholder: "Jack Daniel's" },
      { key: "brand2_icon", label: "Marque 2 — Emoji/Logo", type: "text", placeholder: "🍹" },
      { key: "brand2_name", label: "Marque 2 — Nom", type: "text", placeholder: "Ricard" },
      { key: "brand3_icon", label: "Marque 3 — Emoji/Logo", type: "text", placeholder: "🥤" },
      { key: "brand3_name", label: "Marque 3 — Nom", type: "text", placeholder: "Coca-Cola" },
      { key: "brand4_icon", label: "Marque 4 — Emoji/Logo", type: "text", placeholder: "🍺" },
      { key: "brand4_name", label: "Marque 4", type: "text", placeholder: "Heineken" },
      { key: "brand5_icon", label: "Marque 5 — Emoji/Logo", type: "text", placeholder: "🫧" },
      { key: "brand5_name", label: "Marque 5", type: "text", placeholder: "Perrier" },
      { key: "brand6_icon", label: "Marque 6 — Emoji/Logo", type: "text", placeholder: "☕" },
      { key: "brand6_name", label: "Marque 6", type: "text", placeholder: "Nespresso" },
    ],
  },
  gift_card: {
    label: "Bon cadeau", description: "Vente de cartes cadeaux",
    icon: "🎁", color: "#EC4899", category: "commerce",
    defaultContent: { title: "Offrez une expérience", description: "Le cadeau parfait pour vos proches", cta_label: "Acheter un bon cadeau" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Offrez une expérience" },
      { key: "description", label: "Description", type: "text", placeholder: "Le cadeau parfait pour vos proches" },
      { key: "amount1", label: "Montant 1", type: "text", placeholder: "25€" },
      { key: "amount2", label: "Montant 2", type: "text", placeholder: "50€" },
      { key: "amount3", label: "Montant 3", type: "text", placeholder: "100€" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Acheter un bon cadeau" },
      { key: "cta_url", label: "Lien", type: "url", placeholder: "https://..." },
    ],
  },
  services_pricing: {
    label: "Liste de prestations", description: "Services avec prix et durée",
    icon: "💆", color: "#8B5CF6", category: "commerce",
    defaultContent: { title: "Nos prestations" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos prestations" },
      { key: "s1_name", label: "Prestation 1 — Nom", type: "text", placeholder: "Coupe femme" },
      { key: "s1_price", label: "Prestation 1 — Prix", type: "text", placeholder: "35€" },
      { key: "s1_duration", label: "Prestation 1 — Durée", type: "text", placeholder: "45 min" },
      { key: "s1_desc", label: "Prestation 1 — Description", type: "text", placeholder: "Coupe + brushing" },
      { key: "s2_name", label: "Prestation 2 — Nom", type: "text", placeholder: "Coupe homme" },
      { key: "s2_price", label: "Prestation 2 — Prix", type: "text", placeholder: "25€" },
      { key: "s2_duration", label: "Prestation 2 — Durée", type: "text", placeholder: "30 min" },
      { key: "s2_desc", label: "Prestation 2 — Description", type: "text", placeholder: "Coupe + styling" },
      { key: "s3_name", label: "Prestation 3 — Nom", type: "text", placeholder: "Coloration" },
      { key: "s3_price", label: "Prestation 3 — Prix", type: "text", placeholder: "65€" },
      { key: "s3_duration", label: "Prestation 3 — Durée", type: "text", placeholder: "2h" },
      { key: "s3_desc", label: "Prestation 3 — Description", type: "text", placeholder: "Couleur + soin" },
      { key: "s4_name", label: "Prestation 4 — Nom", type: "text", placeholder: "Soin profond" },
      { key: "s4_price", label: "Prestation 4 — Prix", type: "text", placeholder: "45€" },
      { key: "s4_duration", label: "Prestation 4 — Durée", type: "text", placeholder: "1h" },
      { key: "s4_desc", label: "Prestation 4 — Description", type: "text", placeholder: "Masque + massage crânien" },
      { key: "s5_name", label: "Prestation 5 — Nom", type: "text", placeholder: "Barbe" },
      { key: "s5_price", label: "Prestation 5 — Prix", type: "text", placeholder: "20€" },
      { key: "s5_duration", label: "Prestation 5 — Durée", type: "text", placeholder: "20 min" },
      { key: "s5_desc", label: "Prestation 5 — Description", type: "text", placeholder: "" },
    ],
  },
  external_shop: {
    label: "Boutique externe", description: "Bouton vers boutique en ligne",
    icon: "🛒", color: "#F97316", category: "commerce",
    defaultContent: { label: "Voir la boutique", platform: "Shopify" },
    fields: [
      { key: "label", label: "Texte bouton", type: "text", placeholder: "Voir la boutique" },
      { key: "description", label: "Description", type: "text", placeholder: "Retrouvez tous nos produits en ligne" },
      { key: "url", label: "Lien boutique", type: "url", placeholder: "https://..." },
      { key: "platform", label: "Plateforme", type: "select", options: ["Shopify","Etsy","WooCommerce","Amazon","Autre"] },
    ],
  },
  advantages: {
    label: "Liste des avantages", description: "Arguments de vente avec coches",
    icon: "✅", color: "#39FF8F", category: "commerce",
    defaultContent: { title: "Pourquoi nous choisir", adv1: "✅ Sans engagement", adv2: "🚚 Livraison rapide", adv3: "💬 Support 24/7" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Pourquoi nous choisir" },
      { key: "adv1", label: "Avantage 1", type: "text", placeholder: "✅ Sans engagement" },
      { key: "adv2", label: "Avantage 2", type: "text", placeholder: "🚚 Livraison rapide" },
      { key: "adv3", label: "Avantage 3", type: "text", placeholder: "💬 Support 24/7" },
      { key: "adv4", label: "Avantage 4", type: "text", placeholder: "🔒 Paiement sécurisé" },
      { key: "adv5", label: "Avantage 5", type: "text", placeholder: "⭐ Satisfait ou remboursé" },
      { key: "adv6", label: "Avantage 6", type: "text", placeholder: "" },
    ],
  },
  reassurance: {
    label: "Garantie / Réassurance", description: "Rassurer avant l achat",
    icon: "🔒", color: "#39FF8F", category: "commerce",
    defaultContent: { g1_icon: "🔒", g1_label: "Paiement sécurisé", g2_icon: "↩️", g2_label: "Satisfait ou remboursé", g3_icon: "🚚", g3_label: "Livraison offerte", g4_icon: "⭐", g4_label: "Qualité garantie" },
    fields: [
      { key: "g1_icon", label: "Garantie 1 — Emoji", type: "text", placeholder: "🔒" },
      { key: "g1_label", label: "Garantie 1 — Texte", type: "text", placeholder: "Paiement sécurisé" },
      { key: "g1_desc", label: "Garantie 1 — Description", type: "text", placeholder: "SSL 256 bits" },
      { key: "g2_icon", label: "Garantie 2 — Emoji", type: "text", placeholder: "↩️" },
      { key: "g2_label", label: "Garantie 2 — Texte", type: "text", placeholder: "Satisfait ou remboursé" },
      { key: "g2_desc", label: "Garantie 2 — Description", type: "text", placeholder: "30 jours" },
      { key: "g3_icon", label: "Garantie 3 — Emoji", type: "text", placeholder: "🚚" },
      { key: "g3_label", label: "Garantie 3 — Texte", type: "text", placeholder: "Livraison offerte" },
      { key: "g3_desc", label: "Garantie 3 — Description", type: "text", placeholder: "Dès 49€" },
      { key: "g4_icon", label: "Garantie 4 — Emoji", type: "text", placeholder: "⭐" },
      { key: "g4_label", label: "Garantie 4 — Texte", type: "text", placeholder: "Qualité garantie" },
      { key: "g4_desc", label: "Garantie 4 — Description", type: "text", placeholder: "" },
    ],
  },
  sales_counter: {
    label: "Compteur de ventes", description: "Preuve sociale en temps réel",
    icon: "🔥", color: "#EF4444", category: "commerce",
    defaultContent: { count: "127", period: "ce mois-ci", label: "ventes", emoji: "🔥" },
    fields: [
      { key: "emoji", label: "Emoji", type: "text", placeholder: "🔥" },
      { key: "count", label: "Nombre", type: "text", placeholder: "127" },
      { key: "label", label: "Label", type: "text", placeholder: "ventes" },
      { key: "period", label: "Période", type: "text", placeholder: "ce mois-ci" },
      { key: "subtext", label: "Sous-texte", type: "text", placeholder: "Plus que 23 disponibles !" },
    ],
  },
  popular_products: {
    label: "Produits populaires", description: "Top ventes mis en avant",
    icon: "🏆", color: "#F97316", category: "commerce",
    defaultContent: { title: "Nos best-sellers" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos best-sellers" },
      { key: "p1_rank", label: "Produit 1 — Badge", type: "text", placeholder: "🥇 Best-seller" },
      { key: "p1_img", label: "Produit 1 — Image", type: "image" },
      { key: "p1_name", label: "Produit 1 — Nom", type: "text", placeholder: "Produit n°1" },
      { key: "p1_price", label: "Produit 1 — Prix", type: "text", placeholder: "49€" },
      { key: "p1_sales", label: "Produit 1 — Ventes", type: "text", placeholder: "234 ventes" },
      { key: "p1_url", label: "Produit 1 — Lien", type: "url", placeholder: "https://..." },
      { key: "p2_rank", label: "Produit 2 — Badge", type: "text", placeholder: "🥈 Top 2" },
      { key: "p2_img", label: "Produit 2 — Image", type: "image" },
      { key: "p2_name", label: "Produit 2 — Nom", type: "text", placeholder: "Produit n°2" },
      { key: "p2_price", label: "Produit 2 — Prix", type: "text", placeholder: "29€" },
      { key: "p2_sales", label: "Produit 2 — Ventes", type: "text", placeholder: "187 ventes" },
      { key: "p2_url", label: "Produit 2 — Lien", type: "url", placeholder: "https://..." },
      { key: "p3_rank", label: "Produit 3 — Badge", type: "text", placeholder: "🥉 Top 3" },
      { key: "p3_name", label: "Produit 3 — Nom", type: "text", placeholder: "Produit n°3" },
      { key: "p3_price", label: "Produit 3 — Prix", type: "text", placeholder: "19€" },
      { key: "p3_sales", label: "Produit 3 — Ventes", type: "text", placeholder: "142 ventes" },
      { key: "p3_url", label: "Produit 3 — Lien", type: "url", placeholder: "https://..." },
    ],
  },







  // ── Nouveaux blocs Mise en page ───────────────────────────────────────────
  qr_code_block: {
    label: "Bloc QR Code", description: "Affiche le QR code de la page",
    icon: "⬛", color: "#C9A84C", category: "layout",
    defaultContent: { size: "md", label: "Scannez-moi", show_url: "yes" },
    fields: [
      { key: "size", label: "Taille", type: "select", options: ["sm", "md", "lg"] },
      { key: "label", label: "Label sous le QR", type: "text", placeholder: "Scannez-moi" },
      { key: "show_url", label: "Afficher l URL", type: "select", options: ["yes", "no"] },
    ],
  },
  hero_banner: {
    label: "Hero Banner", description: "Grande bannière d ouverture premium",
    icon: "🚀", color: "#C9A84C", category: "layout",
    defaultContent: { title: "Mon Titre Principal", subtitle: "Sous-titre accrocheur", cta_label: "Découvrir" },
    fields: [
      { key: "bg_image", label: "Image de fond", type: "image" },
      { key: "bg_color", label: "Couleur de fond", type: "color" },
      { key: "title", label: "Titre principal", type: "text", placeholder: "Mon Titre Principal" },
      { key: "subtitle", label: "Sous-titre", type: "text", placeholder: "Sous-titre accrocheur" },
      { key: "cta_label", label: "Bouton principal", type: "text", placeholder: "Découvrir" },
      { key: "cta_url", label: "Lien bouton", type: "url", placeholder: "https://..." },
      { key: "cta2_label", label: "Bouton secondaire", type: "text", placeholder: "En savoir plus" },
      { key: "cta2_url", label: "Lien bouton 2", type: "url", placeholder: "https://..." },
      { key: "height", label: "Hauteur", type: "select", options: ["sm", "md", "lg"] },
      { key: "align", label: "Alignement texte", type: "select", options: ["center", "left"] },
    ],
  },
  section_banner: {
    label: "Bannière de section", description: "Titre visuel séparateur de section",
    icon: "━", color: "#C9A84C", category: "layout",
    defaultContent: { title: "MES SERVICES", style: "lines" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "MES SERVICES" },
      { key: "style", label: "Style", type: "select", options: ["lines", "dots", "gradient", "minimal", "badge"] },
      { key: "color", label: "Couleur", type: "color" },
    ],
  },
  two_columns: {
    label: "Colonnes", description: "Mise en page 2 colonnes côte à côte",
    icon: "▐", color: "#C9A84C", category: "layout",
    defaultContent: { col1_title: "Colonne 1", col2_title: "Colonne 2" },
    fields: [
      { key: "col1_title", label: "Colonne 1 — Titre", type: "text", placeholder: "Colonne 1" },
      { key: "col1_text", label: "Colonne 1 — Texte", type: "textarea", placeholder: "Votre contenu..." },
      { key: "col1_icon", label: "Colonne 1 — Emoji", type: "text", placeholder: "🚀" },
      { key: "col2_title", label: "Colonne 2 — Titre", type: "text", placeholder: "Colonne 2" },
      { key: "col2_text", label: "Colonne 2 — Texte", type: "textarea", placeholder: "Votre contenu..." },
      { key: "col2_icon", label: "Colonne 2 — Emoji", type: "text", placeholder: "💡" },
    ],
  },
  grid_section: {
    label: "Grille", description: "Organisation en cartes 2 ou 3 colonnes",
    icon: "⊞", color: "#C9A84C", category: "layout",
    defaultContent: { columns: "3", title: "" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "" },
      { key: "columns", label: "Colonnes", type: "select", options: ["2", "3", "4"] },
      { key: "c1_icon", label: "Carte 1 — Emoji", type: "text", placeholder: "🚀" },
      { key: "c1_title", label: "Carte 1 — Titre", type: "text", placeholder: "Innovation" },
      { key: "c1_text", label: "Carte 1 — Texte", type: "text", placeholder: "Description courte" },
      { key: "c2_icon", label: "Carte 2 — Emoji", type: "text", placeholder: "💎" },
      { key: "c2_title", label: "Carte 2 — Titre", type: "text", placeholder: "Qualité" },
      { key: "c2_text", label: "Carte 2 — Texte", type: "text", placeholder: "Description courte" },
      { key: "c3_icon", label: "Carte 3 — Emoji", type: "text", placeholder: "🎯" },
      { key: "c3_title", label: "Carte 3 — Titre", type: "text", placeholder: "Précision" },
      { key: "c3_text", label: "Carte 3 — Texte", type: "text", placeholder: "Description courte" },
      { key: "c4_icon", label: "Carte 4 — Emoji", type: "text", placeholder: "⚡" },
      { key: "c4_title", label: "Carte 4 — Titre", type: "text", placeholder: "Rapidité" },
      { key: "c4_text", label: "Carte 4 — Texte", type: "text", placeholder: "Description courte" },
      { key: "c5_icon", label: "Carte 5 — Emoji", type: "text", placeholder: "🌍" },
      { key: "c5_title", label: "Carte 5 — Titre", type: "text", placeholder: "Global" },
      { key: "c5_text", label: "Carte 5 — Texte", type: "text", placeholder: "Description courte" },
      { key: "c6_icon", label: "Carte 6 — Emoji", type: "text", placeholder: "🔒" },
      { key: "c6_title", label: "Carte 6 — Titre", type: "text", placeholder: "Sécurité" },
      { key: "c6_text", label: "Carte 6 — Texte", type: "text", placeholder: "Description courte" },
    ],
  },
  section_block: {
    label: "Section", description: "Bloc parent avec titre et contenu structuré",
    icon: "📄", color: "#C9A84C", category: "layout",
    defaultContent: { title: "À propos", show_divider: "yes" },
    fields: [
      { key: "title", label: "Titre de section", type: "text", placeholder: "À propos" },
      { key: "subtitle", label: "Sous-titre", type: "text", placeholder: "Description de la section" },
      { key: "show_divider", label: "Ligne séparatrice", type: "select", options: ["yes", "no"] },
      { key: "bg_style", label: "Style fond", type: "select", options: ["transparent", "card", "highlight"] },
    ],
  },
  embed_block: {
    label: "Embed", description: "Intégration iframe (Forms, Typeform, Notion...)",
    icon: "🔗", color: "#C9A84C", category: "layout",
    defaultContent: { height: "400", title: "Formulaire" },
    fields: [
      { key: "url", label: "URL à intégrer", type: "url", placeholder: "https://docs.google.com/forms/..." },
      { key: "title", label: "Titre (optionnel)", type: "text", placeholder: "Mon formulaire" },
      { key: "height", label: "Hauteur (px)", type: "text", placeholder: "400" },
      { key: "type", label: "Type", type: "select", options: ["Google Forms", "Typeform", "Notion", "Airtable", "Autre"] },
    ],
  },
  tabs_block: {
    label: "Onglets", description: "Contenu organisé par tabs",
    icon: "📑", color: "#C9A84C", category: "layout",
    defaultContent: { tab1_label: "Présentation", tab2_label: "Tarifs", tab3_label: "FAQ" },
    fields: [
      { key: "tab1_label", label: "Onglet 1 — Titre", type: "text", placeholder: "Présentation" },
      { key: "tab1_content", label: "Onglet 1 — Contenu", type: "textarea", placeholder: "Contenu de l onglet 1..." },
      { key: "tab2_label", label: "Onglet 2 — Titre", type: "text", placeholder: "Tarifs" },
      { key: "tab2_content", label: "Onglet 2 — Contenu", type: "textarea", placeholder: "Contenu de l onglet 2..." },
      { key: "tab3_label", label: "Onglet 3 — Titre", type: "text", placeholder: "FAQ" },
      { key: "tab3_content", label: "Onglet 3 — Contenu", type: "textarea", placeholder: "Contenu de l onglet 3..." },
    ],
  },
  accordion_block: {
    label: "Accordéon", description: "Sections repliables pour longues pages",
    icon: "🪗", color: "#C9A84C", category: "layout",
    defaultContent: { title: "En savoir plus" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "En savoir plus" },
      { key: "a1_title", label: "Section 1 — Titre", type: "text", placeholder: "Nos services" },
      { key: "a1_content", label: "Section 1 — Contenu", type: "textarea", placeholder: "Détail des services..." },
      { key: "a2_title", label: "Section 2 — Titre", type: "text", placeholder: "Nos tarifs" },
      { key: "a2_content", label: "Section 2 — Contenu", type: "textarea", placeholder: "Détail des tarifs..." },
      { key: "a3_title", label: "Section 3 — Titre", type: "text", placeholder: "Conditions" },
      { key: "a3_content", label: "Section 3 — Contenu", type: "textarea", placeholder: "Nos conditions..." },
      { key: "a4_title", label: "Section 4 — Titre", type: "text", placeholder: "" },
      { key: "a4_content", label: "Section 4 — Contenu", type: "textarea", placeholder: "" },
    ],
  },
  info_box: {
    label: "Encadré info", description: "Mettre un texte important en avant",
    icon: "💡", color: "#C9A84C", category: "layout",
    defaultContent: { type: "info", emoji: "💡", message: "Information importante à retenir." },
    fields: [
      { key: "type", label: "Style", type: "select", options: ["info", "warning", "success", "tip", "important"] },
      { key: "emoji", label: "Emoji", type: "text", placeholder: "💡" },
      { key: "title", label: "Titre (optionnel)", type: "text", placeholder: "À savoir" },
      { key: "message", label: "Message", type: "textarea", placeholder: "Information importante à retenir." },
    ],
  },

  // ── Nouveaux blocs Event ──────────────────────────────────────────────────
  event_program: {
    label: "Programme", description: "Planning détaillé de l événement",
    icon: "📋", color: "#EC4899", category: "event",
    defaultContent: { title: "Programme" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Programme" },
      { key: "s1_time", label: "Étape 1 — Heure", type: "text", placeholder: "18h00" },
      { key: "s1_title", label: "Étape 1 — Titre", type: "text", placeholder: "Accueil & cocktail" },
      { key: "s1_desc", label: "Étape 1 — Description", type: "text", placeholder: "Espace lounge" },
      { key: "s2_time", label: "Étape 2 — Heure", type: "text", placeholder: "19h00" },
      { key: "s2_title", label: "Étape 2 — Titre", type: "text", placeholder: "Concert live" },
      { key: "s2_desc", label: "Étape 2 — Description", type: "text", placeholder: "Scène principale" },
      { key: "s3_time", label: "Étape 3 — Heure", type: "text", placeholder: "21h00" },
      { key: "s3_title", label: "Étape 3 — Titre", type: "text", placeholder: "DJ Set" },
      { key: "s3_desc", label: "Étape 3 — Description", type: "text", placeholder: "Jusqu au matin" },
      { key: "s4_time", label: "Étape 4 — Heure", type: "text", placeholder: "23h00" },
      { key: "s4_title", label: "Étape 4 — Titre", type: "text", placeholder: "Afterparty" },
      { key: "s4_desc", label: "Étape 4 — Description", type: "text", placeholder: "" },
      { key: "s5_time", label: "Étape 5 — Heure", type: "text", placeholder: "" },
      { key: "s5_title", label: "Étape 5 — Titre", type: "text", placeholder: "" },
      { key: "s5_desc", label: "Étape 5 — Description", type: "text", placeholder: "" },
    ],
  },
  event_ticketing: {
    label: "Billetterie événement", description: "Vente ou réservation de billets",
    icon: "🎟️", color: "#EC4899", category: "event",
    defaultContent: { label: "Réserver ma place", platform: "Eventbrite" },
    fields: [
      { key: "label", label: "Texte bouton", type: "text", placeholder: "Réserver ma place" },
      { key: "event_name", label: "Nom de l événement", type: "text", placeholder: "Soirée de lancement" },
      { key: "date", label: "Date", type: "text", placeholder: "15 juin 2025" },
      { key: "location", label: "Lieu", type: "text", placeholder: "Paris, France" },
      { key: "price", label: "Prix", type: "text", placeholder: "Gratuit / 25€" },
      { key: "url", label: "Lien billetterie", type: "url", placeholder: "https://..." },
      { key: "platform", label: "Plateforme", type: "select", options: ["Eventbrite", "Shotgun", "Weezevent", "BilletWeb", "HelloAsso", "URL personnalisée"] },
    ],
  },
  event_guests: {
    label: "Invités / Artistes", description: "Présentation des intervenants",
    icon: "🌟", color: "#EC4899", category: "event",
    defaultContent: { title: "Nos invités" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos invités" },
      { key: "g1_photo", label: "Invité 1 — Photo", type: "image" },
      { key: "g1_name", label: "Invité 1 — Nom", type: "text", placeholder: "DJ Shadow" },
      { key: "g1_role", label: "Invité 1 — Rôle", type: "text", placeholder: "Headliner" },
      { key: "g1_desc", label: "Invité 1 — Description", type: "text", placeholder: "DJ & Producteur" },
      { key: "g2_photo", label: "Invité 2 — Photo", type: "image" },
      { key: "g2_name", label: "Invité 2 — Nom", type: "text", placeholder: "Marie Dupont" },
      { key: "g2_role", label: "Invité 2 — Rôle", type: "text", placeholder: "Conférencière" },
      { key: "g2_desc", label: "Invité 2 — Description", type: "text", placeholder: "CEO TechStartup" },
      { key: "g3_photo", label: "Invité 3 — Photo", type: "image" },
      { key: "g3_name", label: "Invité 3 — Nom", type: "text", placeholder: "Paul Martin" },
      { key: "g3_role", label: "Invité 3 — Rôle", type: "text", placeholder: "Artiste" },
      { key: "g3_desc", label: "Invité 3 — Description", type: "text", placeholder: "Peintre contemporain" },
      { key: "g4_photo", label: "Invité 4 — Photo", type: "image" },
      { key: "g4_name", label: "Invité 4 — Nom", type: "text", placeholder: "" },
      { key: "g4_role", label: "Invité 4 — Rôle", type: "text", placeholder: "" },
    ],
  },
  lineup: {
    label: "Line-up", description: "Liste des artistes pour festivals et concerts",
    icon: "🎸", color: "#EC4899", category: "event",
    defaultContent: { title: "Line-up" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Line-up" },
      { key: "a1_name", label: "Artiste 1 — Nom", type: "text", placeholder: "DJ Shadow" },
      { key: "a1_stage", label: "Artiste 1 — Scène", type: "text", placeholder: "Scène principale" },
      { key: "a1_time", label: "Artiste 1 — Heure", type: "text", placeholder: "22h00" },
      { key: "a1_headliner", label: "Artiste 1 — Headliner", type: "select", options: ["yes", "no"] },
      { key: "a2_name", label: "Artiste 2 — Nom", type: "text", placeholder: "The Blaze" },
      { key: "a2_stage", label: "Artiste 2 — Scène", type: "text", placeholder: "Scène 2" },
      { key: "a2_time", label: "Artiste 2 — Heure", type: "text", placeholder: "20h00" },
      { key: "a2_headliner", label: "Artiste 2 — Headliner", type: "select", options: ["no", "yes"] },
      { key: "a3_name", label: "Artiste 3 — Nom", type: "text", placeholder: "Polo & Pan" },
      { key: "a3_stage", label: "Artiste 3 — Scène", type: "text", placeholder: "Scène électro" },
      { key: "a3_time", label: "Artiste 3 — Heure", type: "text", placeholder: "18h00" },
      { key: "a3_headliner", label: "Artiste 3 — Headliner", type: "select", options: ["no", "yes"] },
      { key: "a4_name", label: "Artiste 4 — Nom", type: "text", placeholder: "" },
      { key: "a4_stage", label: "Artiste 4 — Scène", type: "text", placeholder: "" },
      { key: "a4_time", label: "Artiste 4 — Heure", type: "text", placeholder: "" },
      { key: "a4_headliner", label: "Artiste 4 — Headliner", type: "select", options: ["no", "yes"] },
    ],
  },
  event_access: {
    label: "Plan d accès", description: "Carte et itinéraire vers l événement",
    icon: "🗺️", color: "#EC4899", category: "event",
    defaultContent: { title: "Comment venir" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Comment venir" },
      { key: "address", label: "Adresse complète", type: "text", placeholder: "12 rue de la Paix, 75001 Paris" },
      { key: "embed_url", label: "URL embed Google Maps", type: "url", placeholder: "https://www.google.com/maps/embed?pb=..." },
      { key: "transport1_icon", label: "Transport 1 — Emoji", type: "text", placeholder: "🚇" },
      { key: "transport1_label", label: "Transport 1 — Info", type: "text", placeholder: "Métro ligne 1 — Châtelet" },
      { key: "transport2_icon", label: "Transport 2 — Emoji", type: "text", placeholder: "🚌" },
      { key: "transport2_label", label: "Transport 2 — Info", type: "text", placeholder: "Bus 21, 38, 47" },
      { key: "transport3_icon", label: "Transport 3 — Emoji", type: "text", placeholder: "🚗" },
      { key: "transport3_label", label: "Transport 3 — Info", type: "text", placeholder: "Parking gratuit disponible" },
    ],
  },
  event_register: {
    label: "Formulaire d inscription", description: "Inscription gratuite à l événement",
    icon: "📝", color: "#EC4899", category: "event",
    defaultContent: { title: "S inscrire gratuitement", button_label: "Je m inscris" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "S inscrire gratuitement" },
      { key: "description", label: "Description", type: "text", placeholder: "Places limitées" },
      { key: "show_phone", label: "Champ téléphone", type: "select", options: ["no", "yes"] },
      { key: "show_company", label: "Champ société", type: "select", options: ["no", "yes"] },
      { key: "button_label", label: "Bouton", type: "text", placeholder: "Je m inscris" },
    ],
  },
  rsvp: {
    label: "RSVP", description: "Confirmation de présence",
    icon: "✉️", color: "#EC4899", category: "event",
    defaultContent: { title: "Serez-vous présent ?", yes_label: "✅ Oui, je viens", maybe_label: "🤔 Peut-être", no_label: "❌ Non" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Serez-vous présent ?" },
      { key: "description", label: "Description", type: "text", placeholder: "Merci de confirmer avant le 10 juin" },
      { key: "yes_label", label: "Bouton Oui", type: "text", placeholder: "✅ Oui, je viens" },
      { key: "maybe_label", label: "Bouton Peut-être", type: "text", placeholder: "🤔 Peut-être" },
      { key: "no_label", label: "Bouton Non", type: "text", placeholder: "❌ Non" },
    ],
  },
  add_to_calendar: {
    label: "Ajouter au calendrier", description: "Sauvegarder l événement dans son agenda",
    icon: "📅", color: "#EC4899", category: "event",
    defaultContent: { event_name: "Mon événement", cta_label: "Ajouter à mon agenda" },
    fields: [
      { key: "event_name", label: "Nom de l événement", type: "text", placeholder: "Soirée de lancement" },
      { key: "start_date", label: "Date et heure début", type: "text", placeholder: "2025-06-15T19:00:00" },
      { key: "end_date", label: "Date et heure fin", type: "text", placeholder: "2025-06-15T23:00:00" },
      { key: "location", label: "Lieu", type: "text", placeholder: "Paris, France" },
      { key: "description", label: "Description", type: "text", placeholder: "Rejoignez-nous pour..." },
      { key: "google_url", label: "Lien Google Calendar", type: "url", placeholder: "https://calendar.google.com/..." },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Ajouter à mon agenda" },
    ],
  },
  participants_count: {
    label: "Nombre de participants", description: "Compteur d inscrits en temps réel",
    icon: "👥", color: "#EC4899", category: "event",
    defaultContent: { count: "287", label: "participants inscrits", emoji: "👥", show_progress: "yes", max: "500" },
    fields: [
      { key: "emoji", label: "Emoji", type: "text", placeholder: "👥" },
      { key: "count", label: "Nombre", type: "text", placeholder: "287" },
      { key: "label", label: "Label", type: "text", placeholder: "participants inscrits" },
      { key: "show_progress", label: "Barre de progression", type: "select", options: ["yes", "no"] },
      { key: "max", label: "Capacité max", type: "text", placeholder: "500" },
    ],
  },
  tickets_left: {
    label: "Places restantes", description: "Compteur d urgence de billets restants",
    icon: "🎟️", color: "#EF4444", category: "event",
    defaultContent: { count: "14", label: "places restantes", urgency: "high", cta_label: "Réserver maintenant" },
    fields: [
      { key: "count", label: "Nombre de places restantes", type: "text", placeholder: "14" },
      { key: "label", label: "Label", type: "text", placeholder: "places restantes" },
      { key: "urgency", label: "Niveau d urgence", type: "select", options: ["high", "medium", "low"] },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Réserver maintenant" },
      { key: "cta_url", label: "Lien billetterie", type: "url", placeholder: "https://..." },
    ],
  },

  // ── Nouveaux blocs Musique ────────────────────────────────────────────────
  spotify_embed: {
    label: "Lecteur Spotify", description: "Lecteur Spotify intégré directement",
    icon: "🎧", color: "#1DB954", category: "music",
    defaultContent: { type: "track", size: "md" },
    fields: [
      { key: "url", label: "URL Spotify (titre, album, playlist, artiste)", type: "url", placeholder: "https://open.spotify.com/track/..." },
      { key: "type", label: "Type", type: "select", options: ["track", "album", "playlist", "artist"] },
      { key: "size", label: "Taille", type: "select", options: ["sm", "md", "lg"] },
    ],
  },
  latest_release: {
    label: "Dernière sortie", description: "Mettre en avant le dernier morceau ou album",
    icon: "🔥", color: "#1DB954", category: "music",
    defaultContent: { badge: "🔥 Nouveau single", cta_label: "Écouter maintenant" },
    fields: [
      { key: "badge", label: "Badge", type: "text", placeholder: "🔥 Nouveau single" },
      { key: "cover", label: "Pochette", type: "image" },
      { key: "title", label: "Titre", type: "text", placeholder: "Mon nouveau titre" },
      { key: "artist", label: "Artiste", type: "text", placeholder: "Mon Nom" },
      { key: "release_date", label: "Date de sortie", type: "text", placeholder: "15 juin 2025" },
      { key: "spotify_url", label: "Lien Spotify", type: "url", placeholder: "https://open.spotify.com/..." },
      { key: "apple_url", label: "Lien Apple Music", type: "url", placeholder: "https://music.apple.com/..." },
      { key: "youtube_url", label: "Lien YouTube", type: "url", placeholder: "https://youtube.com/..." },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Écouter maintenant" },
    ],
  },
  discography: {
    label: "Discographie", description: "Liste des albums et singles",
    icon: "💿", color: "#1DB954", category: "music",
    defaultContent: { title: "Discographie" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Discographie" },
      { key: "a1_cover", label: "Album 1 — Pochette", type: "image" },
      { key: "a1_title", label: "Album 1 — Titre", type: "text", placeholder: "Mon Premier Album" },
      { key: "a1_year", label: "Album 1 — Année", type: "text", placeholder: "2024" },
      { key: "a1_type", label: "Album 1 — Type", type: "select", options: ["Album", "Single", "EP", "Mixtape"] },
      { key: "a1_url", label: "Album 1 — Lien", type: "url", placeholder: "https://open.spotify.com/..." },
      { key: "a2_cover", label: "Album 2 — Pochette", type: "image" },
      { key: "a2_title", label: "Album 2 — Titre", type: "text", placeholder: "Mon Deuxième Album" },
      { key: "a2_year", label: "Album 2 — Année", type: "text", placeholder: "2023" },
      { key: "a2_type", label: "Album 2 — Type", type: "select", options: ["Album", "Single", "EP", "Mixtape"] },
      { key: "a2_url", label: "Album 2 — Lien", type: "url", placeholder: "https://open.spotify.com/..." },
      { key: "a3_cover", label: "Album 3 — Pochette", type: "image" },
      { key: "a3_title", label: "Album 3 — Titre", type: "text", placeholder: "Mon Troisième Album" },
      { key: "a3_year", label: "Album 3 — Année", type: "text", placeholder: "2022" },
      { key: "a3_type", label: "Album 3 — Type", type: "select", options: ["Album", "Single", "EP", "Mixtape"] },
      { key: "a3_url", label: "Album 3 — Lien", type: "url", placeholder: "https://open.spotify.com/..." },
    ],
  },
  album_block: {
    label: "Album", description: "Mise en avant d un album complet",
    icon: "🎵", color: "#1DB954", category: "music",
    defaultContent: { cta_label: "Écouter l album" },
    fields: [
      { key: "cover", label: "Pochette", type: "image" },
      { key: "title", label: "Titre de l album", type: "text", placeholder: "Mon Album" },
      { key: "artist", label: "Artiste", type: "text", placeholder: "Mon Nom" },
      { key: "year", label: "Année", type: "text", placeholder: "2025" },
      { key: "description", label: "Description", type: "textarea", placeholder: "Mon premier album..." },
      { key: "tracks", label: "Nombre de titres", type: "text", placeholder: "12 titres" },
      { key: "spotify_url", label: "Lien Spotify", type: "url", placeholder: "https://open.spotify.com/album/..." },
      { key: "apple_url", label: "Lien Apple Music", type: "url", placeholder: "https://music.apple.com/..." },
      { key: "deezer_url", label: "Lien Deezer", type: "url", placeholder: "https://deezer.com/album/..." },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Écouter l album" },
    ],
  },
  playlist_block: {
    label: "Playlist", description: "Playlist publique multi-plateformes",
    icon: "📋", color: "#1DB954", category: "music",
    defaultContent: { title: "Ma Playlist", cta_label: "Écouter la playlist" },
    fields: [
      { key: "title", label: "Titre de la playlist", type: "text", placeholder: "Ma Playlist" },
      { key: "description", label: "Description", type: "text", placeholder: "Mes coups de coeur" },
      { key: "cover", label: "Image de couverture", type: "image" },
      { key: "tracks_count", label: "Nombre de titres", type: "text", placeholder: "25 titres" },
      { key: "spotify_url", label: "Lien Spotify", type: "url", placeholder: "https://open.spotify.com/playlist/..." },
      { key: "apple_url", label: "Lien Apple Music", type: "url", placeholder: "https://music.apple.com/..." },
      { key: "deezer_url", label: "Lien Deezer", type: "url", placeholder: "https://deezer.com/playlist/..." },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Écouter la playlist" },
    ],
  },
  concerts: {
    label: "Concerts à venir", description: "Dates de tournée et concerts",
    icon: "🎤", color: "#9146FF", category: "music",
    defaultContent: { title: "Prochains concerts" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Prochains concerts" },
      { key: "c1_date", label: "Concert 1 — Date", type: "text", placeholder: "15 juin 2025" },
      { key: "c1_city", label: "Concert 1 — Ville", type: "text", placeholder: "Paris" },
      { key: "c1_venue", label: "Concert 1 — Salle", type: "text", placeholder: "L Olympia" },
      { key: "c1_url", label: "Concert 1 — Billetterie", type: "url", placeholder: "https://..." },
      { key: "c2_date", label: "Concert 2 — Date", type: "text", placeholder: "22 juin 2025" },
      { key: "c2_city", label: "Concert 2 — Ville", type: "text", placeholder: "Lyon" },
      { key: "c2_venue", label: "Concert 2 — Salle", type: "text", placeholder: "Le Transbordeur" },
      { key: "c2_url", label: "Concert 2 — Billetterie", type: "url", placeholder: "https://..." },
      { key: "c3_date", label: "Concert 3 — Date", type: "text", placeholder: "30 juin 2025" },
      { key: "c3_city", label: "Concert 3 — Ville", type: "text", placeholder: "Marseille" },
      { key: "c3_venue", label: "Concert 3 — Salle", type: "text", placeholder: "Le Dock des Suds" },
      { key: "c3_url", label: "Concert 3 — Billetterie", type: "url", placeholder: "https://..." },
      { key: "c4_date", label: "Concert 4 — Date", type: "text", placeholder: "7 juillet 2025" },
      { key: "c4_city", label: "Concert 4 — Ville", type: "text", placeholder: "Bordeaux" },
      { key: "c4_venue", label: "Concert 4 — Salle", type: "text", placeholder: "Rock School Barbey" },
      { key: "c4_url", label: "Concert 4 — Billetterie", type: "url", placeholder: "https://..." },
    ],
  },
  ticketing: {
    label: "Billetterie", description: "Acheter des billets en ligne",
    icon: "🎟️", color: "#9146FF", category: "music",
    defaultContent: { label: "Acheter mes billets", platform: "Ticketmaster" },
    fields: [
      { key: "label", label: "Texte bouton", type: "text", placeholder: "Acheter mes billets" },
      { key: "event_name", label: "Nom de l événement", type: "text", placeholder: "Concert de lancement" },
      { key: "date", label: "Date", type: "text", placeholder: "15 juin 2025" },
      { key: "venue", label: "Salle / Lieu", type: "text", placeholder: "L Olympia, Paris" },
      { key: "price", label: "Prix", type: "text", placeholder: "À partir de 25€" },
      { key: "url", label: "Lien billetterie", type: "url", placeholder: "https://..." },
      { key: "platform", label: "Plateforme", type: "select", options: ["Ticketmaster", "SeeTickets", "Fnac Spectacles", "Digitick", "URL personnalisée"] },
    ],
  },
  presave: {
    label: "Pré-save", description: "Pré-enregistrement avant une sortie",
    icon: "💾", color: "#1DB954", category: "music",
    defaultContent: { title: "Bientôt disponible", cta_label: "Pré-sauvegarder sur Spotify" },
    fields: [
      { key: "cover", label: "Pochette", type: "image" },
      { key: "title", label: "Titre", type: "text", placeholder: "Bientôt disponible" },
      { key: "release_name", label: "Nom du titre / album", type: "text", placeholder: "Mon nouveau single" },
      { key: "release_date", label: "Date de sortie", type: "text", placeholder: "15 juin 2025" },
      { key: "spotify_url", label: "Lien pré-save Spotify", type: "url", placeholder: "https://distrokid.com/hyperfollow/..." },
      { key: "apple_url", label: "Lien pré-save Apple Music", type: "url", placeholder: "https://..." },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Pré-sauvegarder sur Spotify" },
    ],
  },
  booking_request: {
    label: "Demande de booking", description: "Formulaire de réservation artiste",
    icon: "🎤", color: "#9146FF", category: "music",
    defaultContent: { title: "Réserver pour un événement", button_label: "Envoyer ma demande" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Réserver pour un événement" },
      { key: "description", label: "Description", type: "text", placeholder: "DJ set, concert, festival..." },
      { key: "email_dest", label: "Email de contact booking", type: "text", placeholder: "booking@monagence.com" },
      { key: "button_label", label: "Bouton", type: "text", placeholder: "Envoyer ma demande" },
    ],
  },
  merch: {
    label: "Merchandising", description: "Vente de produits dérivés",
    icon: "👕", color: "#9146FF", category: "music",
    defaultContent: { title: "Mon Shop", cta_label: "Voir la boutique" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mon Shop" },
      { key: "description", label: "Description", type: "text", placeholder: "T-shirts, casquettes, vinyles..." },
      { key: "img1", label: "Produit 1 — Image", type: "image" },
      { key: "name1", label: "Produit 1 — Nom", type: "text", placeholder: "T-shirt Logo" },
      { key: "price1", label: "Produit 1 — Prix", type: "text", placeholder: "25€" },
      { key: "img2", label: "Produit 2 — Image", type: "image" },
      { key: "name2", label: "Produit 2 — Nom", type: "text", placeholder: "Vinyle édition limitée" },
      { key: "price2", label: "Produit 2 — Prix", type: "text", placeholder: "35€" },
      { key: "img3", label: "Produit 3 — Image", type: "image" },
      { key: "name3", label: "Produit 3 — Nom", type: "text", placeholder: "Casquette" },
      { key: "price3", label: "Produit 3 — Prix", type: "text", placeholder: "20€" },
      { key: "cta_label", label: "Bouton boutique", type: "text", placeholder: "Voir la boutique" },
      { key: "cta_url", label: "Lien boutique", type: "url", placeholder: "https://..." },
    ],
  },

  // ── Nouveaux blocs Business ───────────────────────────────────────────────
  google_maps_embed: {
    label: "Carte Google Maps", description: "Carte interactive intégrée",
    icon: "🗺️", color: "#4285F4", category: "business",
    defaultContent: { label: "Nous trouver", address: "Paris, France", zoom: "15" },
    fields: [
      { key: "label", label: "Titre", type: "text", placeholder: "Nous trouver" },
      { key: "address", label: "Adresse complète", type: "text", placeholder: "12 rue de la Paix, 75001 Paris" },
      { key: "embed_url", label: "URL embed Google Maps", type: "url", placeholder: "https://www.google.com/maps/embed?pb=..." },
      { key: "height", label: "Hauteur", type: "select", options: ["sm", "md", "lg"] },
      { key: "show_directions", label: "Bouton itinéraire", type: "select", options: ["yes", "no"] },
    ],
  },
  quote_form: {
    label: "Demande de devis", description: "Formulaire de demande de devis",
    icon: "📋", color: "#4285F4", category: "business",
    defaultContent: { title: "Demander un devis", button_label: "Envoyer ma demande" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Demander un devis" },
      { key: "description", label: "Description", type: "text", placeholder: "Réponse sous 24h" },
      { key: "show_phone", label: "Champ téléphone", type: "select", options: ["yes", "no"] },
      { key: "show_budget", label: "Champ budget", type: "select", options: ["yes", "no"] },
      { key: "show_deadline", label: "Champ délai souhaité", type: "select", options: ["no", "yes"] },
      { key: "button_label", label: "Bouton", type: "text", placeholder: "Envoyer ma demande" },
      { key: "email_dest", label: "Email destinataire", type: "text", placeholder: "contact@monsite.com" },
    ],
  },
  quick_contact: {
    label: "Contact rapide", description: "Carte de contact compacte multi-canaux",
    icon: "📞", color: "#4285F4", category: "business",
    defaultContent: { title: "Nous contacter" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Nous contacter" },
      { key: "phone", label: "Téléphone", type: "text", placeholder: "+33 6 12 34 56 78" },
      { key: "email", label: "Email", type: "text", placeholder: "contact@monsite.com" },
      { key: "whatsapp", label: "WhatsApp", type: "text", placeholder: "+33612345678" },
      { key: "address", label: "Adresse", type: "text", placeholder: "Paris, France" },
      { key: "hours", label: "Horaires", type: "text", placeholder: "Lun-Ven 9h-18h" },
    ],
  },
  multi_contact: {
    label: "Multi-contact", description: "Plusieurs personnes ou services à contacter",
    icon: "👥", color: "#4285F4", category: "business",
    defaultContent: { title: "Nos contacts" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos contacts" },
      { key: "c1_name", label: "Contact 1 — Nom", type: "text", placeholder: "Service commercial" },
      { key: "c1_role", label: "Contact 1 — Rôle", type: "text", placeholder: "Commercial" },
      { key: "c1_phone", label: "Contact 1 — Tel", type: "text", placeholder: "+33 6 ..." },
      { key: "c1_email", label: "Contact 1 — Email", type: "text", placeholder: "commercial@..." },
      { key: "c1_photo", label: "Contact 1 — Photo", type: "image" },
      { key: "c2_name", label: "Contact 2 — Nom", type: "text", placeholder: "Service support" },
      { key: "c2_role", label: "Contact 2 — Rôle", type: "text", placeholder: "Support" },
      { key: "c2_phone", label: "Contact 2 — Tel", type: "text", placeholder: "+33 6 ..." },
      { key: "c2_email", label: "Contact 2 — Email", type: "text", placeholder: "support@..." },
      { key: "c2_photo", label: "Contact 2 — Photo", type: "image" },
      { key: "c3_name", label: "Contact 3 — Nom", type: "text", placeholder: "Direction" },
      { key: "c3_role", label: "Contact 3 — Rôle", type: "text", placeholder: "Directeur" },
      { key: "c3_phone", label: "Contact 3 — Tel", type: "text", placeholder: "+33 6 ..." },
      { key: "c3_email", label: "Contact 3 — Email", type: "text", placeholder: "direction@..." },
      { key: "c3_photo", label: "Contact 3 — Photo", type: "image" },
    ],
  },
  service_area: {
    label: "Zone d intervention", description: "Zones géographiques couvertes",
    icon: "📍", color: "#4285F4", category: "business",
    defaultContent: { title: "Zone d intervention", area: "France entière", radius: "" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Zone d intervention" },
      { key: "area", label: "Zone principale", type: "text", placeholder: "France entière" },
      { key: "radius", label: "Rayon (km)", type: "text", placeholder: "50 km autour de Paris" },
      { key: "city1", label: "Ville 1", type: "text", placeholder: "Paris" },
      { key: "city2", label: "Ville 2", type: "text", placeholder: "Versailles" },
      { key: "city3", label: "Ville 3", type: "text", placeholder: "Boulogne" },
      { key: "city4", label: "Ville 4", type: "text", placeholder: "Saint-Denis" },
      { key: "city5", label: "Ville 5", type: "text", placeholder: "Nanterre" },
      { key: "city6", label: "Ville 6", type: "text", placeholder: "Montreuil" },
      { key: "note", label: "Note", type: "text", placeholder: "Déplacement possible partout en France" },
    ],
  },
  legal_info: {
    label: "Informations légales", description: "Données entreprise et mentions légales",
    icon: "⚖️", color: "#4285F4", category: "business",
    defaultContent: { title: "Informations légales" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Informations légales" },
      { key: "company_name", label: "Nom de la société", type: "text", placeholder: "Ma Société SAS" },
      { key: "siret", label: "SIRET", type: "text", placeholder: "123 456 789 00012" },
      { key: "tva", label: "N° TVA intracommunautaire", type: "text", placeholder: "FR12 123456789" },
      { key: "address", label: "Adresse du siège", type: "text", placeholder: "12 rue de la Paix, 75001 Paris" },
      { key: "capital", label: "Capital social", type: "text", placeholder: "10 000 €" },
      { key: "rcs", label: "RCS", type: "text", placeholder: "Paris B 123 456 789" },
      { key: "email", label: "Email de contact", type: "text", placeholder: "contact@masociete.com" },
    ],
  },
  business_certifications: {
    label: "Certifications pro", description: "Labels et agréments professionnels",
    icon: "🏅", color: "#FBBF24", category: "business",
    defaultContent: { title: "Nos certifications" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos certifications" },
      { key: "c1_icon", label: "Cert 1 — Emoji", type: "text", placeholder: "✅" },
      { key: "c1_name", label: "Cert 1 — Nom", type: "text", placeholder: "Qualiopi" },
      { key: "c1_org", label: "Cert 1 — Organisme", type: "text", placeholder: "Ministère du Travail" },
      { key: "c1_year", label: "Cert 1 — Année", type: "text", placeholder: "2023" },
      { key: "c2_icon", label: "Cert 2 — Emoji", type: "text", placeholder: "🏆" },
      { key: "c2_name", label: "Cert 2 — Nom", type: "text", placeholder: "RGE" },
      { key: "c2_org", label: "Cert 2 — Organisme", type: "text", placeholder: "ADEME" },
      { key: "c2_year", label: "Cert 2 — Année", type: "text", placeholder: "2024" },
      { key: "c3_icon", label: "Cert 3 — Emoji", type: "text", placeholder: "⭐" },
      { key: "c3_name", label: "Cert 3 — Nom", type: "text", placeholder: "Google Partner" },
      { key: "c3_org", label: "Cert 3 — Organisme", type: "text", placeholder: "Google" },
      { key: "c3_year", label: "Cert 3 — Année", type: "text", placeholder: "2024" },
      { key: "c4_icon", label: "Cert 4 — Emoji", type: "text", placeholder: "🎖️" },
      { key: "c4_name", label: "Cert 4 — Nom", type: "text", placeholder: "ISO 9001" },
      { key: "c4_org", label: "Cert 4 — Organisme", type: "text", placeholder: "AFNOR" },
      { key: "c4_year", label: "Cert 4 — Année", type: "text", placeholder: "2023" },
    ],
  },
  on_site_services: {
    label: "Services sur place", description: "Informations pratiques et accessibilité",
    icon: "🏪", color: "#4285F4", category: "business",
    defaultContent: { title: "Informations pratiques" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Informations pratiques" },
      { key: "s1_icon", label: "Service 1 — Emoji", type: "text", placeholder: "♿" },
      { key: "s1_label", label: "Service 1 — Texte", type: "text", placeholder: "Accès PMR" },
      { key: "s2_icon", label: "Service 2 — Emoji", type: "text", placeholder: "📶" },
      { key: "s2_label", label: "Service 2 — Texte", type: "text", placeholder: "WiFi gratuit" },
      { key: "s3_icon", label: "Service 3 — Emoji", type: "text", placeholder: "🚗" },
      { key: "s3_label", label: "Service 3 — Texte", type: "text", placeholder: "Parking gratuit" },
      { key: "s4_icon", label: "Service 4 — Emoji", type: "text", placeholder: "🐶" },
      { key: "s4_label", label: "Service 4 — Texte", type: "text", placeholder: "Animaux acceptés" },
      { key: "s5_icon", label: "Service 5 — Emoji", type: "text", placeholder: "💳" },
      { key: "s5_label", label: "Service 5 — Texte", type: "text", placeholder: "CB acceptée" },
      { key: "s6_icon", label: "Service 6 — Emoji", type: "text", placeholder: "🍽️" },
      { key: "s6_label", label: "Service 6 — Texte", type: "text", placeholder: "Terrasse" },
      { key: "s7_icon", label: "Service 7 — Emoji", type: "text", placeholder: "🌿" },
      { key: "s7_label", label: "Service 7 — Texte", type: "text", placeholder: "Produits bio" },
      { key: "s8_icon", label: "Service 8 — Emoji", type: "text", placeholder: "🔒" },
      { key: "s8_label", label: "Service 8 — Texte", type: "text", placeholder: "Vestiaires" },
    ],
  },

  // ── Nouveaux blocs Infos ─────────────────────────────────────────────────
  stats_block: {
    label: "Statistiques", description: "Chiffres clés de ton activité",
    icon: "📊", color: "#FF6B6B", category: "content",
    defaultContent: { s1_value: "500+", s1_label: "Clients", s1_icon: "👥", s2_value: "4.9/5", s2_label: "Note moyenne", s2_icon: "⭐", s3_value: "10 ans", s3_label: "Expérience", s3_icon: "🏆" },
    fields: [
      { key: "s1_icon", label: "Stat 1 — Emoji", type: "text", placeholder: "👥" },
      { key: "s1_value", label: "Stat 1 — Valeur", type: "text", placeholder: "500+" },
      { key: "s1_label", label: "Stat 1 — Label", type: "text", placeholder: "Clients" },
      { key: "s2_icon", label: "Stat 2 — Emoji", type: "text", placeholder: "⭐" },
      { key: "s2_value", label: "Stat 2 — Valeur", type: "text", placeholder: "4.9/5" },
      { key: "s2_label", label: "Stat 2 — Label", type: "text", placeholder: "Note moyenne" },
      { key: "s3_icon", label: "Stat 3 — Emoji", type: "text", placeholder: "🏆" },
      { key: "s3_value", label: "Stat 3 — Valeur", type: "text", placeholder: "10 ans" },
      { key: "s3_label", label: "Stat 3 — Label", type: "text", placeholder: "Expérience" },
      { key: "s4_icon", label: "Stat 4 — Emoji (optionnel)", type: "text", placeholder: "🚀" },
      { key: "s4_value", label: "Stat 4 — Valeur", type: "text", placeholder: "98%" },
      { key: "s4_label", label: "Stat 4 — Label", type: "text", placeholder: "Satisfaction" },
    ],
  },
  scan_counter: {
    label: "Compteur de scans", description: "Nombre de scans du QR code",
    icon: "📱", color: "#39FF8F", category: "content",
    defaultContent: { label: "scans QR ce mois", emoji: "📱" },
    fields: [
      { key: "emoji", label: "Emoji", type: "text", placeholder: "📱" },
      { key: "label", label: "Label", type: "text", placeholder: "scans QR ce mois" },
    ],
  },
  timeline: {
    label: "Timeline", description: "Étapes chronologiques",
    icon: "📅", color: "#FF6B6B", category: "content",
    defaultContent: { title: "Notre histoire", e1_date: "2020", e1_title: "Création", e1_desc: "Lancement de l activité" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Notre histoire" },
      { key: "e1_date", label: "Étape 1 — Date", type: "text", placeholder: "2020" },
      { key: "e1_title", label: "Étape 1 — Titre", type: "text", placeholder: "Création" },
      { key: "e1_desc", label: "Étape 1 — Description", type: "text", placeholder: "Lancement de l activité" },
      { key: "e2_date", label: "Étape 2 — Date", type: "text", placeholder: "2022" },
      { key: "e2_title", label: "Étape 2 — Titre", type: "text", placeholder: "Croissance" },
      { key: "e2_desc", label: "Étape 2 — Description", type: "text", placeholder: "100 clients" },
      { key: "e3_date", label: "Étape 3 — Date", type: "text", placeholder: "2024" },
      { key: "e3_title", label: "Étape 3 — Titre", type: "text", placeholder: "Expansion" },
      { key: "e3_desc", label: "Étape 3 — Description", type: "text", placeholder: "500 clients dans 8 pays" },
      { key: "e4_date", label: "Étape 4 — Date", type: "text", placeholder: "2025" },
      { key: "e4_title", label: "Étape 4 — Titre", type: "text", placeholder: "Aujourd hui" },
      { key: "e4_desc", label: "Étape 4 — Description", type: "text", placeholder: "Leader du marché" },
    ],
  },
  process_steps: {
    label: "Étapes / Processus", description: "Expliquer une méthode en étapes",
    icon: "🔢", color: "#FF6B6B", category: "content",
    defaultContent: { title: "Comment ça marche" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Comment ça marche" },
      { key: "s1_icon", label: "Étape 1 — Emoji", type: "text", placeholder: "📞" },
      { key: "s1_title", label: "Étape 1 — Titre", type: "text", placeholder: "Contact" },
      { key: "s1_desc", label: "Étape 1 — Description", type: "text", placeholder: "Prenez rendez-vous" },
      { key: "s2_icon", label: "Étape 2 — Emoji", type: "text", placeholder: "📋" },
      { key: "s2_title", label: "Étape 2 — Titre", type: "text", placeholder: "Devis" },
      { key: "s2_desc", label: "Étape 2 — Description", type: "text", placeholder: "Sous 24h" },
      { key: "s3_icon", label: "Étape 3 — Emoji", type: "text", placeholder: "🚀" },
      { key: "s3_title", label: "Étape 3 — Titre", type: "text", placeholder: "Réalisation" },
      { key: "s3_desc", label: "Étape 3 — Description", type: "text", placeholder: "Livraison dans les délais" },
      { key: "s4_icon", label: "Étape 4 — Emoji", type: "text", placeholder: "✅" },
      { key: "s4_title", label: "Étape 4 — Titre", type: "text", placeholder: "Résultat" },
      { key: "s4_desc", label: "Étape 4 — Description", type: "text", placeholder: "Satisfaction garantie" },
    ],
  },
  values: {
    label: "Valeurs", description: "Les valeurs de la marque",
    icon: "💎", color: "#FF6B6B", category: "content",
    defaultContent: { title: "Nos valeurs", v1_icon: "🤝", v1_label: "Transparence", v2_icon: "⚡", v2_label: "Réactivité", v3_icon: "🎯", v3_label: "Qualité" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos valeurs" },
      { key: "v1_icon", label: "Valeur 1 — Emoji", type: "text", placeholder: "🤝" },
      { key: "v1_label", label: "Valeur 1 — Nom", type: "text", placeholder: "Transparence" },
      { key: "v1_desc", label: "Valeur 1 — Description", type: "text", placeholder: "Honnêteté et clarté" },
      { key: "v2_icon", label: "Valeur 2 — Emoji", type: "text", placeholder: "⚡" },
      { key: "v2_label", label: "Valeur 2 — Nom", type: "text", placeholder: "Réactivité" },
      { key: "v2_desc", label: "Valeur 2 — Description", type: "text", placeholder: "Réponse en 24h" },
      { key: "v3_icon", label: "Valeur 3 — Emoji", type: "text", placeholder: "🎯" },
      { key: "v3_label", label: "Valeur 3 — Nom", type: "text", placeholder: "Qualité" },
      { key: "v3_desc", label: "Valeur 3 — Description", type: "text", placeholder: "Excellence à chaque étape" },
      { key: "v4_icon", label: "Valeur 4 — Emoji", type: "text", placeholder: "🌍" },
      { key: "v4_label", label: "Valeur 4 — Nom", type: "text", placeholder: "Impact" },
      { key: "v4_desc", label: "Valeur 4 — Description", type: "text", placeholder: "" },
    ],
  },
  team: {
    label: "Équipe", description: "Présentation des membres de l équipe",
    icon: "👥", color: "#FF6B6B", category: "content",
    defaultContent: { title: "Notre équipe" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Notre équipe" },
      { key: "m1_photo", label: "Membre 1 — Photo", type: "image" },
      { key: "m1_name", label: "Membre 1 — Nom", type: "text", placeholder: "Marie Dupont" },
      { key: "m1_role", label: "Membre 1 — Poste", type: "text", placeholder: "Fondatrice & CEO" },
      { key: "m1_bio", label: "Membre 1 — Bio courte", type: "text", placeholder: "10 ans d expérience" },
      { key: "m2_photo", label: "Membre 2 — Photo", type: "image" },
      { key: "m2_name", label: "Membre 2 — Nom", type: "text", placeholder: "Paul Martin" },
      { key: "m2_role", label: "Membre 2 — Poste", type: "text", placeholder: "Directeur technique" },
      { key: "m2_bio", label: "Membre 2 — Bio courte", type: "text", placeholder: "Expert développement" },
      { key: "m3_photo", label: "Membre 3 — Photo", type: "image" },
      { key: "m3_name", label: "Membre 3 — Nom", type: "text", placeholder: "Sophie Leroy" },
      { key: "m3_role", label: "Membre 3 — Poste", type: "text", placeholder: "Responsable marketing" },
      { key: "m3_bio", label: "Membre 3 — Bio courte", type: "text", placeholder: "" },
    ],
  },
  engagements: {
    label: "Engagements", description: "Engagements qualité et promesses",
    icon: "✅", color: "#39FF8F", category: "content",
    defaultContent: { title: "Nos engagements", e1: "✅ Réponse sous 24h", e2: "✅ Satisfaction garantie", e3: "✅ Sans engagement" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Nos engagements" },
      { key: "e1", label: "Engagement 1", type: "text", placeholder: "✅ Réponse sous 24h" },
      { key: "e2", label: "Engagement 2", type: "text", placeholder: "✅ Satisfaction garantie" },
      { key: "e3", label: "Engagement 3", type: "text", placeholder: "✅ Sans engagement" },
      { key: "e4", label: "Engagement 4", type: "text", placeholder: "✅ Livraison rapide" },
      { key: "e5", label: "Engagement 5", type: "text", placeholder: "✅ Support 7j/7" },
      { key: "e6", label: "Engagement 6", type: "text", placeholder: "" },
    ],
  },
  trust_badge: {
    label: "Badge de confiance", description: "Labels qualité et certifications",
    icon: "🛡️", color: "#39FF8F", category: "content",
    defaultContent: { title: "Certifié & Vérifié", b1_icon: "✔", b1_label: "Vérifié", b2_icon: "🏆", b2_label: "Certifié", b3_icon: "⭐", b3_label: "Partenaire officiel" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Certifié & Vérifié" },
      { key: "b1_icon", label: "Badge 1 — Emoji", type: "text", placeholder: "✔" },
      { key: "b1_label", label: "Badge 1 — Texte", type: "text", placeholder: "Vérifié" },
      { key: "b2_icon", label: "Badge 2 — Emoji", type: "text", placeholder: "🏆" },
      { key: "b2_label", label: "Badge 2 — Texte", type: "text", placeholder: "Certifié" },
      { key: "b3_icon", label: "Badge 3 — Emoji", type: "text", placeholder: "⭐" },
      { key: "b3_label", label: "Badge 3 — Texte", type: "text", placeholder: "Partenaire officiel" },
      { key: "b4_icon", label: "Badge 4 — Emoji", type: "text", placeholder: "🔒" },
      { key: "b4_label", label: "Badge 4 — Texte", type: "text", placeholder: "Paiement sécurisé" },
    ],
  },
  quote_block: {
    label: "Citation", description: "Citation mise en avant",
    icon: "💬", color: "#FF6B6B", category: "content",
    defaultContent: { quote: "La qualité n est jamais un accident.", author: "", source: "" },
    fields: [
      { key: "quote", label: "Citation", type: "textarea", placeholder: "La qualité n est jamais un accident." },
      { key: "author", label: "Auteur", type: "text", placeholder: "Steve Jobs" },
      { key: "source", label: "Source / Contexte", type: "text", placeholder: "Apple, 2007" },
    ],
  },
  announcement: {
    label: "Annonce", description: "Message important à mettre en avant",
    icon: "📢", color: "#FBBF24", category: "content",
    defaultContent: { emoji: "⚠️", title: "Information importante", message: "Nous serons fermés le 25 décembre.", type: "warning" },
    fields: [
      { key: "emoji", label: "Emoji", type: "text", placeholder: "⚠️" },
      { key: "title", label: "Titre", type: "text", placeholder: "Information importante" },
      { key: "message", label: "Message", type: "textarea", placeholder: "Votre message ici..." },
      { key: "type", label: "Style", type: "select", options: ["warning", "info", "success", "promo"] },
    ],
  },
  info_table: {
    label: "Tableau d infos", description: "Informations structurées en tableau",
    icon: "📋", color: "#FF6B6B", category: "content",
    defaultContent: { title: "Informations" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Informations" },
      { key: "r1_label", label: "Ligne 1 — Label", type: "text", placeholder: "Création" },
      { key: "r1_value", label: "Ligne 1 — Valeur", type: "text", placeholder: "2020" },
      { key: "r2_label", label: "Ligne 2 — Label", type: "text", placeholder: "Localisation" },
      { key: "r2_value", label: "Ligne 2 — Valeur", type: "text", placeholder: "Paris, France" },
      { key: "r3_label", label: "Ligne 3 — Label", type: "text", placeholder: "Clients" },
      { key: "r3_value", label: "Ligne 3 — Valeur", type: "text", placeholder: "500+" },
      { key: "r4_label", label: "Ligne 4 — Label", type: "text", placeholder: "Secteur" },
      { key: "r4_value", label: "Ligne 4 — Valeur", type: "text", placeholder: "Tech & Design" },
      { key: "r5_label", label: "Ligne 5 — Label", type: "text", placeholder: "Email" },
      { key: "r5_value", label: "Ligne 5 — Valeur", type: "text", placeholder: "contact@..." },
      { key: "r6_label", label: "Ligne 6 — Label", type: "text", placeholder: "" },
      { key: "r6_value", label: "Ligne 6 — Valeur", type: "text", placeholder: "" },
    ],
  },
  founder_message: {
    label: "Message du fondateur", description: "Mot du dirigeant ou fondateur",
    icon: "✉️", color: "#FF6B6B", category: "content",
    defaultContent: { name: "Jean Dupont", role: "Fondateur & CEO", message: "Bienvenue ! Notre mission est de..." },
    fields: [
      { key: "photo", label: "Photo", type: "image" },
      { key: "name", label: "Nom", type: "text", placeholder: "Jean Dupont" },
      { key: "role", label: "Titre / Poste", type: "text", placeholder: "Fondateur & CEO" },
      { key: "message", label: "Message", type: "textarea", placeholder: "Bienvenue ! Notre mission est de vous offrir..." },
      { key: "signature", label: "Signature (optionnel)", type: "text", placeholder: "Jean" },
    ],
  },

  // ── Nouveaux blocs Médias ─────────────────────────────────────────────────
  image_carousel: {
    label: "Carrousel d images", description: "Défilement horizontal de photos",
    icon: "🎠", color: "#4ECDC4", category: "media",
    defaultContent: { title: "" },
    fields: [
      { key: "title", label: "Titre (optionnel)", type: "text", placeholder: "Mes photos" },
      { key: "img1", label: "Image 1", type: "image" },
      { key: "img2", label: "Image 2", type: "image" },
      { key: "img3", label: "Image 3", type: "image" },
      { key: "img4", label: "Image 4", type: "image" },
      { key: "img5", label: "Image 5", type: "image" },
      { key: "img6", label: "Image 6", type: "image" },
      { key: "auto_play", label: "Défilement auto", type: "select", options: ["yes", "no"] },
    ],
  },
  media_before_after: {
    label: "Avant / Après média", description: "Comparaison visuelle avant/après",
    icon: "🔄", color: "#4ECDC4", category: "media",
    defaultContent: { before_label: "Avant", after_label: "Après" },
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Transformation" },
      { key: "before_img", label: "Image Avant", type: "image" },
      { key: "before_label", label: "Label Avant", type: "text", placeholder: "Avant" },
      { key: "after_img", label: "Image Après", type: "image" },
      { key: "after_label", label: "Label Après", type: "text", placeholder: "Après" },
      { key: "description", label: "Description", type: "text", placeholder: "Résultat en 4 semaines" },
    ],
  },
  video_local: {
    label: "Vidéo locale", description: "Vidéo uploadée directement (MP4, MOV, WEBM)",
    icon: "🎥", color: "#4ECDC4", category: "media",
    defaultContent: { autoplay: "no", loop: "no", muted: "yes" },
    fields: [
      { key: "src", label: "URL de la vidéo", type: "url", placeholder: "https://... (.mp4, .mov, .webm)" },
      { key: "poster", label: "Image de couverture", type: "image" },
      { key: "title", label: "Titre", type: "text", placeholder: "Ma vidéo" },
      { key: "autoplay", label: "Lecture auto", type: "select", options: ["no", "yes"] },
      { key: "loop", label: "Boucle", type: "select", options: ["no", "yes"] },
      { key: "muted", label: "Muet", type: "select", options: ["yes", "no"] },
    ],
  },
  pdf_viewer: {
    label: "PDF Viewer", description: "Afficher un PDF directement sur la page",
    icon: "📄", color: "#4ECDC4", category: "media",
    defaultContent: { cta_label: "Voir en plein écran" },
    fields: [
      { key: "url", label: "URL du PDF", type: "url", placeholder: "https://...pdf" },
      { key: "title", label: "Titre", type: "text", placeholder: "Mon catalogue" },
      { key: "description", label: "Description", type: "text", placeholder: "Téléchargez notre brochure" },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Voir en plein écran" },
      { key: "show_download", label: "Bouton télécharger", type: "select", options: ["yes", "no"] },
    ],
  },
  youtube_gallery: {
    label: "Galerie YouTube", description: "Plusieurs vidéos YouTube en grille",
    icon: "▶️", color: "#FF0000", category: "media",
    defaultContent: { title: "Mes vidéos" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mes vidéos" },
      { key: "video1_url", label: "Vidéo 1 — URL YouTube", type: "url", placeholder: "https://youtube.com/watch?v=..." },
      { key: "video1_title", label: "Vidéo 1 — Titre", type: "text", placeholder: "Ma première vidéo" },
      { key: "video2_url", label: "Vidéo 2 — URL YouTube", type: "url", placeholder: "https://youtube.com/watch?v=..." },
      { key: "video2_title", label: "Vidéo 2 — Titre", type: "text", placeholder: "Ma deuxième vidéo" },
      { key: "video3_url", label: "Vidéo 3 — URL YouTube", type: "url", placeholder: "https://youtube.com/watch?v=..." },
      { key: "video3_title", label: "Vidéo 3 — Titre", type: "text", placeholder: "Ma troisième vidéo" },
      { key: "channel_url", label: "Lien chaîne", type: "url", placeholder: "https://youtube.com/@..." },
      { key: "cta_label", label: "Bouton voir plus", type: "text", placeholder: "Voir toutes mes vidéos" },
    ],
  },
  tiktok_gallery: {
    label: "Galerie TikTok", description: "Vidéos TikTok en grille verticale",
    icon: "🎵", color: "#F5F0E8", category: "media",
    defaultContent: { title: "Mes TikToks", username: "@monpseudo" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mes TikToks" },
      { key: "username", label: "Nom d utilisateur", type: "text", placeholder: "@monpseudo" },
      { key: "video1_url", label: "TikTok 1 — URL embed", type: "url", placeholder: "https://www.tiktok.com/embed/..." },
      { key: "video2_url", label: "TikTok 2 — URL embed", type: "url", placeholder: "https://www.tiktok.com/embed/..." },
      { key: "video3_url", label: "TikTok 3 — URL embed", type: "url", placeholder: "https://www.tiktok.com/embed/..." },
      { key: "cta_url", label: "Lien profil TikTok", type: "url", placeholder: "https://tiktok.com/@..." },
      { key: "cta_label", label: "Bouton", type: "text", placeholder: "Voir mon TikTok" },
    ],
  },
  video_testimonials: {
    label: "Témoignages vidéo", description: "Avis clients en vidéo",
    icon: "🎬", color: "#4ECDC4", category: "media",
    defaultContent: { title: "Ils témoignent" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Ils témoignent" },
      { key: "t1_video_url", label: "Témoignage 1 — URL vidéo", type: "url", placeholder: "https://youtube.com/..." },
      { key: "t1_name", label: "Témoignage 1 — Auteur", type: "text", placeholder: "Marie D." },
      { key: "t1_company", label: "Témoignage 1 — Société", type: "text", placeholder: "Startup X" },
      { key: "t1_quote", label: "Témoignage 1 — Citation", type: "text", placeholder: "Excellent résultat !" },
      { key: "t2_video_url", label: "Témoignage 2 — URL vidéo", type: "url", placeholder: "https://youtube.com/..." },
      { key: "t2_name", label: "Témoignage 2 — Auteur", type: "text", placeholder: "Paul M." },
      { key: "t2_company", label: "Témoignage 2 — Société", type: "text", placeholder: "Agence Y" },
      { key: "t2_quote", label: "Témoignage 2 — Citation", type: "text", placeholder: "Je recommande !" },
    ],
  },
  logo_wall: {
    label: "Logo / Marques", description: "Grille de logos partenaires ou marques",
    icon: "🏷️", color: "#4ECDC4", category: "media",
    defaultContent: { title: "Ils nous font confiance" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Ils nous font confiance" },
      { key: "logo1", label: "Logo 1", type: "image" },
      { key: "logo1_name", label: "Logo 1 — Nom", type: "text", placeholder: "Marque A" },
      { key: "logo2", label: "Logo 2", type: "image" },
      { key: "logo2_name", label: "Logo 2 — Nom", type: "text", placeholder: "Marque B" },
      { key: "logo3", label: "Logo 3", type: "image" },
      { key: "logo3_name", label: "Logo 3 — Nom", type: "text", placeholder: "Marque C" },
      { key: "logo4", label: "Logo 4", type: "image" },
      { key: "logo4_name", label: "Logo 4 — Nom", type: "text", placeholder: "Marque D" },
      { key: "logo5", label: "Logo 5", type: "image" },
      { key: "logo5_name", label: "Logo 5 — Nom", type: "text", placeholder: "Marque E" },
      { key: "logo6", label: "Logo 6", type: "image" },
      { key: "logo6_name", label: "Logo 6 — Nom", type: "text", placeholder: "Marque F" },
      { key: "logo7", label: "Logo 7", type: "image" },
      { key: "logo7_name", label: "Logo 7 — Nom", type: "text", placeholder: "Marque G" },
      { key: "logo8", label: "Logo 8", type: "image" },
      { key: "logo8_name", label: "Logo 8 — Nom", type: "text", placeholder: "Marque H" },
    ],
  },

  // ── Nouveaux blocs Réseaux ────────────────────────────────────────────────
  tiktok_feed: {
    label: "TikTok Feed", description: "Dernières vidéos TikTok",
    icon: "🎵", color: "#F5F0E8", category: "social",
    defaultContent: { username: "@monpseudo", cta_label: "Me suivre sur TikTok" },
    fields: [
      { key: "username", label: "Nom d utilisateur", type: "text", placeholder: "@monpseudo" },
      { key: "cta_label", label: "Texte bouton", type: "text", placeholder: "Me suivre sur TikTok" },
      { key: "cta_url", label: "Lien profil", type: "url", placeholder: "https://tiktok.com/@..." },
    ],
  },
  youtube_channel: {
    label: "Chaîne YouTube", description: "Dernières vidéos YouTube",
    icon: "▶️", color: "#FF0000", category: "social",
    defaultContent: { channel_name: "Ma Chaîne", cta_label: "S abonner" },
    fields: [
      { key: "channel_name", label: "Nom de la chaîne", type: "text", placeholder: "Ma Chaîne" },
      { key: "subscribers", label: "Abonnés (affiché)", type: "text", placeholder: "12K abonnés" },
      { key: "cta_label", label: "Texte bouton", type: "text", placeholder: "S abonner" },
      { key: "cta_url", label: "Lien chaîne", type: "url", placeholder: "https://youtube.com/@..." },
    ],
  },
  twitch_live: {
    label: "Twitch Live", description: "Statut live Twitch",
    icon: "🎮", color: "#9146FF", category: "social",
    defaultContent: { username: "monpseudo", status: "offline", game: "", cta_label: "Rejoindre le live" },
    fields: [
      { key: "username", label: "Pseudo Twitch", type: "text", placeholder: "monpseudo" },
      { key: "status", label: "Statut", type: "select", options: ["live", "offline"] },
      { key: "game", label: "Jeu / Activité", type: "text", placeholder: "Fortnite" },
      { key: "viewers", label: "Spectateurs (affiché)", type: "text", placeholder: "1.2K viewers" },
      { key: "cta_label", label: "Texte bouton", type: "text", placeholder: "Rejoindre le live" },
      { key: "cta_url", label: "Lien Twitch", type: "url", placeholder: "https://twitch.tv/..." },
    ],
  },
  discord_server: {
    label: "Discord", description: "Bouton rejoindre serveur Discord",
    icon: "🎮", color: "#5865F2", category: "social",
    defaultContent: { server_name: "Mon Serveur", cta_label: "Rejoindre le Discord", members: "" },
    fields: [
      { key: "server_name", label: "Nom du serveur", type: "text", placeholder: "Mon Serveur" },
      { key: "members", label: "Membres (affiché)", type: "text", placeholder: "250 membres" },
      { key: "description", label: "Description", type: "text", placeholder: "Rejoins notre communauté !" },
      { key: "cta_label", label: "Texte bouton", type: "text", placeholder: "Rejoindre le Discord" },
      { key: "cta_url", label: "Lien d invitation", type: "url", placeholder: "https://discord.gg/..." },
    ],
  },
  telegram_channel: {
    label: "Telegram", description: "Bouton rejoindre canal Telegram",
    icon: "✈️", color: "#26A5E4", category: "social",
    defaultContent: { channel_name: "Mon Canal", cta_label: "Rejoindre le canal", members: "" },
    fields: [
      { key: "channel_name", label: "Nom du canal", type: "text", placeholder: "Mon Canal" },
      { key: "members", label: "Membres (affiché)", type: "text", placeholder: "5K membres" },
      { key: "description", label: "Description", type: "text", placeholder: "Actualités et exclusivités" },
      { key: "cta_label", label: "Texte bouton", type: "text", placeholder: "Rejoindre le canal" },
      { key: "cta_url", label: "Lien Telegram", type: "url", placeholder: "https://t.me/..." },
    ],
  },
  podcast_links: {
    label: "Podcast", description: "Liens d écoute multi-plateformes",
    icon: "🎙️", color: "#B150E2", category: "social",
    defaultContent: { podcast_name: "Mon Podcast", description: "" },
    fields: [
      { key: "podcast_name", label: "Nom du podcast", type: "text", placeholder: "Mon Podcast" },
      { key: "description", label: "Description courte", type: "text", placeholder: "Le podcast sur le business" },
      { key: "cover_url", label: "Image de couverture", type: "image" },
      { key: "spotify_url", label: "Spotify Podcasts", type: "url", placeholder: "https://open.spotify.com/show/..." },
      { key: "apple_url", label: "Apple Podcasts", type: "url", placeholder: "https://podcasts.apple.com/..." },
      { key: "rss_url", label: "RSS Feed", type: "url", placeholder: "https://..." },
      { key: "pocket_url", label: "Pocket Casts", type: "url", placeholder: "https://pca.st/..." },
    ],
  },
  favorite_links: {
    label: "Liens favoris", description: "Liens personnalisés avec icône",
    icon: "🔗", color: "#C9A84C", category: "social",
    defaultContent: { title: "Mes liens" },
    fields: [
      { key: "title", label: "Titre section", type: "text", placeholder: "Mes liens" },
      { key: "link_1_icon", label: "Lien 1 — Emoji", type: "text", placeholder: "🌐" },
      { key: "link_1_label", label: "Lien 1 — Texte", type: "text", placeholder: "Mon Portfolio" },
      { key: "link_1_url", label: "Lien 1 — URL", type: "url", placeholder: "https://..." },
      { key: "link_2_icon", label: "Lien 2 — Emoji", type: "text", placeholder: "✏️" },
      { key: "link_2_label", label: "Lien 2 — Texte", type: "text", placeholder: "Mon Blog" },
      { key: "link_2_url", label: "Lien 2 — URL", type: "url", placeholder: "https://..." },
      { key: "link_3_icon", label: "Lien 3 — Emoji", type: "text", placeholder: "🛍️" },
      { key: "link_3_label", label: "Lien 3 — Texte", type: "text", placeholder: "Ma Boutique" },
      { key: "link_3_url", label: "Lien 3 — URL", type: "url", placeholder: "https://..." },
      { key: "link_4_icon", label: "Lien 4 — Emoji", type: "text", placeholder: "🎙️" },
      { key: "link_4_label", label: "Lien 4 — Texte", type: "text", placeholder: "Mon Podcast" },
      { key: "link_4_url", label: "Lien 4 — URL", type: "url", placeholder: "https://..." },
      { key: "link_5_icon", label: "Lien 5 — Emoji", type: "text", placeholder: "⭐" },
      { key: "link_5_label", label: "Lien 5 — Texte", type: "text", placeholder: "Lien personnalisé" },
      { key: "link_5_url", label: "Lien 5 — URL", type: "url", placeholder: "https://..." },
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


// ════════════════════════════════════════════════════════════════
// SYSTÈME DE TEMPLATES
// ════════════════════════════════════════════════════════════════

export const TEMPLATE_FORMAT_VERSION = 1

// Catégories de templates
export type TemplateCategory =
  | "Freelance" | "Restaurant" | "Artiste" | "Événement" | "CV"
  | "Boutique" | "Immobilier" | "Fitness" | "Music" | "Portfolio"
  | "Startup" | "Blogger" | "Agency" | "Personal"

// Source du template
export type TemplateSource = "official" | "user" | "marketplace"

// Métadonnées d'un template
export interface TemplateMeta {
  id: string
  _v: number                   // Version format
  name: string
  description: string
  category: TemplateCategory
  source: TemplateSource
  tags: string[]
  // Aperçu
  preview_url?: string         // Screenshot ou URL image
  preview_colors?: string[]    // [bg, primary, accent] — pour mini-swatch
  // Statistiques (marketplace future)
  author_id?: string
  author_name?: string
  uses?: number
  rating?: number
  // Dates
  created_at: string           // ISO
  updated_at: string           // ISO
  // Flags
  is_premium?: boolean
  is_featured?: boolean
  is_favorite?: boolean        // localStorage uniquement
}

// Bloc d'un template (simplifié, sans id)
export interface TemplateBlock {
  type: string
  content: BlockContent
  visible: boolean
  draft?: boolean
  locked?: boolean
  _order: number               // Position dans la page
}

// Template complet (exportable / importable)
export interface QRfolioTemplate {
  // Identité
  meta: TemplateMeta
  // Contenu
  blocks: TemplateBlock[]
  theme: PageTheme
  // Compatibilité
  min_builder_version?: string // "1.0.0" — pour futures incompatibilités
}

// ── Templates officiels intégrés ────────────────────────────────────────────
export const OFFICIAL_TEMPLATES: QRfolioTemplate[] = [
  {
    meta: {
      id: "tpl_freelance_01", _v: 1,
      name: "Freelance Pro",
      description: "Page professionnelle pour freelances et consultants",
      category: "Freelance", source: "official",
      tags: ["profil","contact","services","tarifs"],
      preview_colors: ["#080808", "#C9A84C", "#39FF8F"],
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      is_featured: true,
    },
    theme: {
      name: "Midnight Gold", bg: "#080808", surface: "#111009",
      primary: "#C9A84C", accent: "#39FF8F", text: "#F5F0E8", muted: "#8A8478",
      fontDisplay: "Cormorant Garamond", fontBody: "DM Sans", bgMode: "solid",
    },
    blocks: [
      { type: "profile", content: { name: "Votre Nom", tagline: "Votre activité" }, visible: true, _order: 0 },
      { type: "bio", content: { text: "Bienvenue sur ma page. Décrivez votre activité et expertise en quelques lignes." }, visible: true, _order: 1 },
      { type: "pricing", content: { title: "Mes services", plans: [] }, visible: true, _order: 2 },
      { type: "cta_button", content: { label: "Me contacter", url: "#", style: "gold" }, visible: true, _order: 3 },
      { type: "contact_form", content: { title: "Contact" }, visible: true, _order: 4 },
    ],
  },
  {
    meta: {
      id: "tpl_restaurant_01", _v: 1,
      name: "Restaurant & Café",
      description: "Menu, horaires, réservation et localisation",
      category: "Restaurant", source: "official",
      tags: ["menu","réservation","horaires","adresse"],
      preview_colors: ["#1A0500", "#FF6B00", "#FF8C00"],
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      is_featured: true,
    },
    theme: {
      name: "Sunset Fire", bg: "#1A0500", surface: "#2D0A00",
      primary: "#FF6B00", accent: "#FF8C00", text: "#FFF5E6", muted: "#9A7A5A",
      fontDisplay: "Playfair Display", fontBody: "Lora", bgMode: "gradient",
      bgGradient: "linear-gradient(135deg,#1A0500,#2D0A00)",
    },
    blocks: [
      { type: "profile", content: { name: "Le Bon Repas", tagline: "Restaurant Gastronomique" }, visible: true, _order: 0 },
      { type: "menu_card", content: { title: "Notre Carte" }, visible: true, _order: 1 },
      { type: "booking_btn", content: { label: "Réserver une table", url: "#" }, visible: true, _order: 2 },
      { type: "opening_hours", content: { title: "Horaires" }, visible: true, _order: 3 },
      { type: "map_embed", content: { address: "Paris, France" }, visible: true, _order: 4 },
    ],
  },
  {
    meta: {
      id: "tpl_artist_01", _v: 1,
      name: "Artiste / Créateur",
      description: "Galerie, réseaux sociaux et liens musicaux",
      category: "Artiste", source: "official",
      tags: ["musique","galerie","social","streaming"],
      preview_colors: ["#050505", "#1DB954", "#FF0080"],
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      is_featured: true,
    },
    theme: {
      name: "Studio Dark", bg: "#050505", surface: "#0F0F0F",
      primary: "#1DB954", accent: "#1ED760", text: "#FFFFFF", muted: "#B3B3B3",
      fontDisplay: "Space Grotesk", fontBody: "DM Sans", bgMode: "solid",
    },
    blocks: [
      { type: "profile", content: { name: "Nom Artiste", tagline: "Artiste Indépendant" }, visible: true, _order: 0 },
      { type: "latest_release", content: { title: "Nouvelle sortie" }, visible: true, _order: 1 },
      { type: "spotify_embed", content: { url: "" }, visible: true, _order: 2 },
      { type: "social_links", content: { links: [] }, visible: true, _order: 3 },
      { type: "gallery", content: { images: [] }, visible: true, _order: 4 },
    ],
  },
  {
    meta: {
      id: "tpl_event_01", _v: 1,
      name: "Événement",
      description: "Page d'événement avec countdown et billetterie",
      category: "Événement", source: "official",
      tags: ["event","billet","date","programme"],
      preview_colors: ["#050008", "#FF6B35", "#FFD700"],
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      is_featured: true,
    },
    theme: {
      name: "Festival Night", bg: "#050008", surface: "#0A0012",
      primary: "#FF6B35", accent: "#FFD700", text: "#F5F0E8", muted: "#8A7A6A",
      fontDisplay: "Space Grotesk", fontBody: "DM Sans", bgMode: "gradient",
      bgGradient: "linear-gradient(135deg,#050008,#0A000F)",
    },
    blocks: [
      { type: "profile", content: { name: "Nom de l Événement", tagline: "Date · Lieu" }, visible: true, _order: 0 },
      { type: "countdown", content: { target_date: "" }, visible: true, _order: 1 },
      { type: "event_program", content: { title: "Programme" }, visible: true, _order: 2 },
      { type: "ticket_link", content: { label: "Prendre mes billets", url: "#" }, visible: true, _order: 3 },
      { type: "map_embed", content: { address: "" }, visible: true, _order: 4 },
    ],
  },
  {
    meta: {
      id: "tpl_portfolio_01", _v: 1,
      name: "Portfolio Design",
      description: "Portfolio minimaliste pour designers et créatifs",
      category: "Portfolio", source: "official",
      tags: ["portfolio","galerie","contact","cv"],
      preview_colors: ["#FAFAFA", "#1A1A1A", "#C9A84C"],
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
      is_featured: true,
    },
    theme: {
      name: "Pure White", bg: "#FAFAFA", surface: "#F0F0F0",
      primary: "#1A1A1A", accent: "#C9A84C", text: "#1A1A1A", muted: "#6B7280",
      fontDisplay: "Playfair Display", fontBody: "Inter", bgMode: "solid",
    },
    blocks: [
      { type: "profile", content: { name: "Votre Nom", tagline: "Designer · Créatif" }, visible: true, _order: 0 },
      { type: "bio", content: { text: "Je crée des expériences visuelles mémorables." }, visible: true, _order: 1 },
      { type: "gallery", content: { images: [] }, visible: true, _order: 2 },
      { type: "skills", content: { tags: ["Design", "Figma", "Branding"] }, visible: true, _order: 3 },
      { type: "cta_button", content: { label: "Voir mon CV", url: "#", style: "outline" }, visible: true, _order: 4 },
    ],
  },
  {
    meta: {
      id: "tpl_cv_01", _v: 1,
      name: "CV Professionnel",
      description: "CV numérique avec compétences et expériences",
      category: "CV", source: "official",
      tags: ["cv","emploi","compétences","linkedin"],
      preview_colors: ["#0D1B2A", "#3B82F6", "#60A5FA"],
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    },
    theme: {
      name: "Corporate Navy", bg: "#0D1B2A", surface: "#1A2A3D",
      primary: "#3B82F6", accent: "#60A5FA", text: "#F0F4FF", muted: "#7A8FA8",
      fontDisplay: "Inter", fontBody: "Inter", bgMode: "gradient",
      bgGradient: "linear-gradient(135deg,#0D1B2A,#1A3050)",
    },
    blocks: [
      { type: "profile", content: { name: "Votre Nom", tagline: "Titre du poste" }, visible: true, _order: 0 },
      { type: "bio", content: { text: "Résumé professionnel en 2-3 phrases." }, visible: true, _order: 1 },
      { type: "skills", content: { tags: ["React", "TypeScript", "Node.js"] }, visible: true, _order: 2 },
      { type: "social_links", content: { links: [] }, visible: true, _order: 3 },
      { type: "cta_button", content: { label: "Télécharger mon CV", url: "#", style: "outline" }, visible: true, _order: 4 },
    ],
  },
]

// ── Fonctions utilitaires templates ─────────────────────────────────────────

export function templateToBlocks(tpl: QRfolioTemplate): Block[] {
  return tpl.blocks
    .sort((a, b) => a._order - b._order)
    .map((b, i) => ({
      id: Date.now().toString(36) + i.toString(36) + Math.random().toString(36).slice(2, 5),
      type: b.type,
      content: { ...b.content },
      visible: b.visible,
      ...(b.draft !== undefined ? { draft: b.draft } : {}),
      ...(b.locked !== undefined ? { locked: b.locked } : {}),
    } as Block))
}

export function exportTemplateToJSON(tpl: QRfolioTemplate): string {
  return JSON.stringify({ ...tpl, meta: { ...tpl.meta, _v: TEMPLATE_FORMAT_VERSION } }, null, 2)
}

export interface TemplateValidationResult {
  ok: boolean
  template?: QRfolioTemplate
  errors: string[]
  warnings: string[]
}

export function importTemplateFromJSON(raw: string): TemplateValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let data: any
  try { data = JSON.parse(raw) } catch {
    return { ok: false, errors: ["JSON invalide"], warnings: [] }
  }
  if (!data.meta) errors.push("Champ meta manquant")
  if (!data.blocks || !Array.isArray(data.blocks)) errors.push("Champ blocks manquant")
  if (!data.theme) errors.push("Champ theme manquant")
  if (errors.length > 0) return { ok: false, errors, warnings }
  if (!data.meta.id) warnings.push("ID template manquant — un ID sera généré")
  if (!data.meta.category) warnings.push("Catégorie non spécifiée")
  // Normaliser
  if (!data.meta.id) data.meta.id = "tpl_user_" + Date.now().toString(36)
  if (!data.meta.source) data.meta.source = "user"
  if (!data.meta._v) data.meta._v = 1
  if (!data.meta.created_at) data.meta.created_at = new Date().toISOString()
  if (!data.meta.updated_at) data.meta.updated_at = new Date().toISOString()
  return { ok: true, template: data as QRfolioTemplate, errors: [], warnings }
}

// localStorage key pour les templates utilisateur
export const USER_TEMPLATES_KEY = "qrfolio_user_templates"
export const FAV_TEMPLATES_KEY = "qrfolio_fav_templates"

export function getUserTemplates(): QRfolioTemplate[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(USER_TEMPLATES_KEY) || "[]") } catch { return [] }
}

export function saveUserTemplate(tpl: QRfolioTemplate): void {
  const existing = getUserTemplates()
  const idx = existing.findIndex(t => t.meta.id === tpl.meta.id)
  if (idx >= 0) existing[idx] = tpl
  else existing.unshift(tpl)
  localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(existing))
}

export function deleteUserTemplate(id: string): void {
  const existing = getUserTemplates().filter(t => t.meta.id !== id)
  localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(existing))
}

export function getFavTemplates(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(FAV_TEMPLATES_KEY) || "[]") } catch { return [] }
}

export function toggleFavTemplate(id: string): string[] {
  const favs = getFavTemplates()
  const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]
  localStorage.setItem(FAV_TEMPLATES_KEY, JSON.stringify(next))
  return next
}
