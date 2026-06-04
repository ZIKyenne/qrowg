// QRfolio — Templates prêts à l'emploi
import type { BlockContent } from "../dashboard/builder/types"

export type Template = {
  id: string
  name: string
  category: string
  description: string
  emoji: string
  color: string
  preview_blocks: string[]
  blocks: { type: string; content: BlockContent }[]
  theme: {
    name: string; bg: string; surface: string; primary: string
    accent: string; text: string; muted: string
    fontDisplay: string; fontBody: string; bgMode: string
  }
}

export const TEMPLATES: Template[] = [
  {
    id: "restaurant",
    name: "Restaurant & Bar",
    category: "Food & Drink",
    description: "Menu, horaires, réservation table, ambiance",
    emoji: "🍽️",
    color: "#EF4444",
    preview_blocks: ["Profil restaurant", "Menu du jour", "Horaires", "Réservation"],
    theme: { name: "Velvet Rouge", bg: "#0D0505", surface: "#1A0A0A", primary: "#EF4444", accent: "#F97316", text: "#FFF5F5", muted: "#B8837A", fontDisplay: "Playfair Display", fontBody: "DM Sans", bgMode: "solid" },
    blocks: [
      { type: "profile", content: { name: "Le Bistrot Parisien", tagline: "Cuisine française depuis 1985", badge: "🌟 Étoile Michelin" } },
      { type: "image", content: { src: "", caption: "Notre salle principale", rounded: "rounded" } },
      { type: "cta_button", content: { label: "Réserver une table", url: "#", style: "gold", icon: "🍷", full_width: "yes" } },
      { type: "menu_section", content: { category: "🥗 Entrées", item1_name: "Foie gras poêlé", item1_price: "18€", item1_desc: "Chutney de figues, brioche toastée", item2_name: "Soupe à l'oignon", item2_price: "12€", item2_desc: "Gratinée au comté", item3_name: "Tartare de saumon", item3_price: "16€", item3_desc: "Avocat, citron vert, aneth" } },
      { type: "menu_section", content: { category: "🥩 Plats", item1_name: "Entrecôte 300g", item1_price: "32€", item1_desc: "Sauce béarnaise, frites maison", item2_name: "Filet de sole", item2_price: "28€", item2_desc: "Beurre blanc, légumes vapeur", item3_name: "Risotto aux truffes", item3_price: "24€", item3_desc: "Parmesan 24 mois, truffe noire" } },
      { type: "opening_hours", content: { title: "Nos horaires", mon_fri: "12h — 14h30 · 19h — 23h", saturday: "19h — 23h30", sunday: "12h — 15h", note: "Réservation recommandée" } },
      { type: "google_maps", content: { label: "Le Bistrot Parisien", address: "12 rue de la Paix, 75001 Paris", transport: "Métro Opéra — Ligne 3, 7, 8" } },
      { type: "social_links", content: { instagram: "https://instagram.com", facebook: "https://facebook.com" } },
    ]
  },
  {
    id: "freelance",
    name: "Freelance & Consultant",
    category: "Business",
    description: "Portfolio, services, tarifs, prise de contact",
    emoji: "💼",
    color: "#C9A84C",
    preview_blocks: ["Profil pro", "Services", "Tarifs", "Calendly"],
    theme: { name: "Midnight Gold", bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F", text: "#F5F0E8", muted: "#8A8478", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans", bgMode: "solid" },
    blocks: [
      { type: "profile", content: { name: "Jean Dupont", tagline: "Développeur Full-Stack & Consultant Digital", badge: "✅ Disponible pour missions" } },
      { type: "bio", content: { text: "10 ans d'expérience en développement web. Je transforme vos idées en produits digitaux performants. Spécialisé React, Node.js et architecture cloud.", align: "left" } },
      { type: "skills", content: { title: "Mes expertises", tags: "React, Next.js, Node.js, TypeScript, AWS, Docker, UX Design" } },
      { type: "services_list", content: { title: "Mes services", s1_icon: "💻", s1_name: "Développement sur mesure", s1_desc: "Applications web et mobiles performantes", s2_icon: "🎨", s2_name: "Design & Prototypage", s2_desc: "Figma, design system, UI/UX", s3_icon: "🚀", s3_name: "Conseil & Architecture", s3_desc: "Audit technique, roadmap, choix stack" } },
      { type: "pricing", content: { title: "Mes tarifs", title1: "Journée", price1: "650€", desc1: "TJM standard", title2: "Forfait web", price2: "3 500€", desc2: "Site vitrine complet", title3: "Retainer", price3: "2 000€", desc3: "20h/mois", cta_label: "Demander un devis", cta_url: "#" } },
      { type: "calendly", content: { label: "Réserver un appel découverte", url: "https://calendly.com", description: "30 min · Gratuit · Visio ou téléphone" } },
      { type: "testimonials", content: { name1: "Sarah M., CEO Startup", text1: "Jean a livré notre MVP en 6 semaines. Code propre, communication parfaite. Je recommande sans hésiter.", stars1: "5", name2: "Thomas R., DSI", text2: "Excellent consultant, vision claire et pragmatique. A su cadrer notre projet avec brio.", stars2: "5" } },
      { type: "social_links", content: { linkedin: "https://linkedin.com", github: "https://github.com", website: "https://monsite.com" } },
    ]
  },
  {
    id: "artiste",
    name: "Artiste & Musicien",
    category: "Créatif",
    description: "Bio, musique, événements, réseaux sociaux",
    emoji: "🎵",
    color: "#8B5CF6",
    preview_blocks: ["Profil artiste", "Spotify", "Concerts", "Réseaux"],
    theme: { name: "Velvet Purple", bg: "#0A0510", surface: "#130A20", primary: "#A78BFA", accent: "#F472B6", text: "#F5F3FF", muted: "#9D84BC", fontDisplay: "Syne", fontBody: "DM Sans", bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0A0510,#130A20,#0A0515)" },
    blocks: [
      { type: "profile", content: { name: "NOVA", tagline: "Artiste électro-pop · Paris", badge: "🎤 Nouvel EP disponible" } },
      { type: "bio", content: { text: "Productrice et chanteuse, NOVA mélange électronique et pop émotionnelle pour créer un univers sonore unique. Ses titres cumulent + de 2M de streams.", align: "center" } },
      { type: "spotify_player", content: { title: "Écouter mon dernier EP", url: "https://open.spotify.com" } },
      { type: "music_links", content: { artist_name: "NOVA", spotify: "https://open.spotify.com", apple_music: "https://music.apple.com", deezer: "https://deezer.com", youtube_music: "https://music.youtube.com" } },
      { type: "event_info", content: { name: "Concert Release Party", date: "Samedi 28 juin 2025", time: "21h00", location: "La Cigale, Paris 18e", price: "25€ · Places limitées", cta_label: "Réserver ma place", cta_url: "#" } },
      { type: "gallery", content: { columns: "3" } },
      { type: "social_links", content: { instagram: "https://instagram.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com", spotify: "https://open.spotify.com" } },
    ]
  },
  {
    id: "coach",
    name: "Coach & Thérapeute",
    category: "Bien-être",
    description: "Présentation, méthode, témoignages, rendez-vous",
    emoji: "🧘",
    color: "#4ADE80",
    preview_blocks: ["Profil", "Méthode", "Témoignages", "RDV"],
    theme: { name: "Forest Zen", bg: "#040D06", surface: "#081A0C", primary: "#4ADE80", accent: "#86EFAC", text: "#F0FDF4", muted: "#6DB882", fontDisplay: "Lora", fontBody: "Nunito", bgMode: "solid" },
    blocks: [
      { type: "profile", content: { name: "Marie Laurent", tagline: "Coach de vie certifiée · PNL & Mindfulness", badge: "🌿 +200 clients accompagnés" } },
      { type: "bio", content: { text: "Je vous accompagne vers une vie plus alignée avec vos valeurs. Ma méthode combine la PNL, la pleine conscience et le coaching systémique pour des transformations durables.", align: "center" } },
      { type: "services_list", content: { title: "Mon accompagnement", s1_icon: "🎯", s1_name: "Coaching individuel", s1_desc: "Séances 1h, en visio ou présentiel", s2_icon: "👥", s2_name: "Ateliers de groupe", s2_desc: "Petits groupes de 6 personnes max", s3_icon: "📖", s3_name: "Programme 3 mois", s3_desc: "Transformation en profondeur" } },
      { type: "pricing", content: { title: "Tarifs", title1: "Séance unique", price1: "90€", desc1: "1h en visio", title2: "Pack 5 séances", price2: "380€", desc2: "Économisez 70€", title3: "Programme 3 mois", price3: "850€", desc3: "12 séances + suivi" } },
      { type: "testimonials", content: { name1: "Lucie D.", text1: "Marie m'a aidée à reprendre confiance en moi après une période difficile. Sa bienveillance et sa méthode sont remarquables.", stars1: "5", name2: "Pierre M.", text2: "Un accompagnement qui m'a permis de changer de cap professionnel. Merci infiniment.", stars2: "5", name3: "Sophie L.", text3: "Chaque séance est une avancée concrète. Je me sens enfin alignée avec qui je suis vraiment.", stars3: "5" } },
      { type: "calendly", content: { label: "Séance découverte offerte", url: "https://calendly.com", description: "45 min · Gratuit · Sans engagement" } },
      { type: "social_links", content: { instagram: "https://instagram.com", linkedin: "https://linkedin.com" } },
    ]
  },
  {
    id: "ecommerce",
    name: "Boutique & E-commerce",
    category: "Commerce",
    description: "Produits phares, promos, lien boutique",
    emoji: "🛍️",
    color: "#F97316",
    preview_blocks: ["Profil boutique", "Promo", "Produits", "Contact"],
    theme: { name: "Sunset Shop", bg: "#0D0700", surface: "#1A1000", primary: "#F97316", accent: "#FCD34D", text: "#FFF7ED", muted: "#B89070", fontDisplay: "Raleway", fontBody: "Poppins", bgMode: "gradient", bgGradient: "linear-gradient(135deg,#0D0700,#1A1000)" },
    blocks: [
      { type: "profile", content: { name: "Maison Lumière", tagline: "Décoration artisanale & objets de créateurs", badge: "🚚 Livraison gratuite dès 60€" } },
      { type: "promo_banner", content: { emoji: "🎉", text: "Soldes d'été — jusqu'à -40%", subtext: "Offre valable jusqu'au 31 juillet", cta_label: "Voir les offres", cta_url: "#" } },
      { type: "product", content: { name: "Vase céramique artisanal", price: "45€", old_price: "75€", description: "Fait main en France, collection printemps. Livré avec certificat d'authenticité.", cta_label: "Commander", cta_url: "#" } },
      { type: "product", content: { name: "Bougie parfumée 200g", price: "28€", description: "Cire végétale, parfum vanille & santal. Durée de combustion : 45h.", cta_label: "Commander", cta_url: "#" } },
      { type: "cta_button", content: { label: "Voir toute la boutique", url: "#", style: "gold", icon: "🛍️", full_width: "yes" } },
      { type: "testimonials", content: { name1: "Claire B.", text1: "Des produits magnifiques, emballage soigné. Je recommande à 100% !", stars1: "5", name2: "Antoine L.", text2: "Livraison rapide, qualité au rendez-vous. Mon vase est parfait.", stars2: "5" } },
      { type: "social_links", content: { instagram: "https://instagram.com", pinterest: "https://pinterest.com", website: "https://monsite.com" } },
    ]
  },
  {
    id: "event",
    name: "Événement & Soirée",
    category: "Event",
    description: "Countdown, programme, billetterie",
    emoji: "🎉",
    color: "#EC4899",
    preview_blocks: ["Countdown", "Programme", "Billetterie", "Réseaux"],
    theme: { name: "Electric Night", bg: "#05020D", surface: "#0D0620", primary: "#EC4899", accent: "#A855F7", text: "#FDF4FF", muted: "#B07AAA", fontDisplay: "Syne", fontBody: "Outfit", bgMode: "gradient", bgGradient: "linear-gradient(135deg,#05020D,#0D0620,#050D15)" },
    blocks: [
      { type: "profile", content: { name: "GALA NIGHT 2025", tagline: "La soirée de l'année · 500 invités", badge: "🎟️ Dernières places disponibles" } },
      { type: "countdown", content: { title: "La soirée commence dans", date: "2025-12-31", subtitle: "Soyez prêts pour une nuit inoubliable !" } },
      { type: "event_info", content: { name: "GALA NIGHT 2025", date: "Mercredi 31 décembre 2025", time: "21h00 — 6h00", location: "Palais Brongniart, Paris 2e", price: "À partir de 80€", cta_label: "Réserver mes billets", cta_url: "#" } },
      { type: "heading", content: { text: "Au programme", size: "medium", align: "center", color: "primary" } },
      { type: "rich_text", content: { text: "21h — Accueil cocktail & DJ set
23h — Dîner gastronomique 5 services
00h — Spectacle & surprises
02h — Dancefloor jusqu'à l'aube", align: "left" } },
      { type: "promo_banner", content: { emoji: "🥂", text: "Early Bird — 20% de réduction", subtext: "Offre valable jusqu'au 30 novembre", cta_label: "Profiter de l'offre", cta_url: "#" } },
      { type: "social_links", content: { instagram: "https://instagram.com", facebook: "https://facebook.com" } },
    ]
  },
  {
    id: "coiffeur",
    name: "Coiffeur & Esthéticien",
    category: "Beauté",
    description: "Services, tarifs, galerie, prise de RDV",
    emoji: "✂️",
    color: "#F472B6",
    preview_blocks: ["Profil salon", "Services", "Galerie", "RDV"],
    theme: { name: "Rose Luxe", bg: "#0D0508", surface: "#1A0812", primary: "#F472B6", accent: "#FB7185", text: "#FFF0F6", muted: "#B87A99", fontDisplay: "Playfair Display", fontBody: "DM Sans", bgMode: "solid" },
    blocks: [
      { type: "profile", content: { name: "Salon Éclat", tagline: "Coiffure & Beauté · Paris 11e", badge: "⭐ 4.9/5 — 300 avis" } },
      { type: "bio", content: { text: "Votre salon de coiffure & beauté à Paris. Spécialisés en colorations naturelles, soins kératine et balayage californien. Produits bio et éco-responsables.", align: "center" } },
      { type: "services_list", content: { title: "Nos prestations", s1_icon: "✂️", s1_name: "Coupe & Brushing", s1_desc: "Femme 55€ · Homme 35€", s2_icon: "🎨", s2_name: "Coloration & Balayage", s2_desc: "À partir de 80€", s3_icon: "💆", s3_name: "Soins & Traitements", s3_desc: "Kératine, lissage, soin profond" } },
      { type: "gallery", content: { columns: "3" } },
      { type: "calendly", content: { label: "Prendre rendez-vous", url: "https://calendly.com", description: "Réservation en ligne 24h/24" } },
      { type: "testimonials", content: { name1: "Emma R.", text1: "Super salon ! Le balayage est parfait, l'équipe est adorable. Je reviendrai !", stars1: "5", name2: "Julie M.", text2: "Meilleure coloration de ma vie. Merci Sophie pour ta patience et ton talent !", stars2: "5" } },
      { type: "social_links", content: { instagram: "https://instagram.com" } },
    ]
  },
  {
    id: "agence",
    name: "Agence & Studio",
    category: "Business",
    description: "Présentation agence, services, portfolio, contact",
    emoji: "🏢",
    color: "#38BDF8",
    preview_blocks: ["Présentation", "Services", "Portfolio", "Contact"],
    theme: { name: "Deep Ocean", bg: "#020C18", surface: "#041828", primary: "#38BDF8", accent: "#818CF8", text: "#F0F9FF", muted: "#6494B0", fontDisplay: "Space Grotesk", fontBody: "Inter", bgMode: "gradient", bgGradient: "linear-gradient(135deg,#020C18,#041828,#060420)" },
    blocks: [
      { type: "profile", content: { name: "Studio PIXEL", tagline: "Agence créative · Web · Brand · Motion", badge: "🏆 50+ projets livrés" } },
      { type: "bio", content: { text: "Nous créons des expériences digitales mémorables. De la stratégie de marque au développement web, nous accompagnons startups et entreprises dans leur transformation digitale.", align: "left" } },
      { type: "services_list", content: { title: "Nos expertises", s1_icon: "🎨", s1_name: "Branding & Identité", s1_desc: "Logo, charte graphique, guidelines", s2_icon: "💻", s2_name: "Développement web", s2_desc: "Sites, apps, e-commerce", s3_icon: "📱", s3_name: "Social Media & Contenu", s3_desc: "Stratégie, création, gestion" } },
      { type: "gallery", content: { columns: "2" } },
      { type: "pricing", content: { title: "Nos offres", title1: "Starter", price1: "2 500€", desc1: "Site vitrine 5 pages", title2: "Business", price2: "6 500€", desc2: "Site + branding complet", title3: "Premium", price3: "Sur devis", desc3: "Solution sur mesure" } },
      { type: "contact_form", content: { title: "Parlons de votre projet", button_label: "Envoyer" } },
      { type: "social_links", content: { linkedin: "https://linkedin.com", instagram: "https://instagram.com", website: "https://monsite.com" } },
    ]
  },
  {
    id: "createur",
    name: "Créateur de contenu",
    category: "Créatif",
    description: "Liens réseaux, partenariats, contenu, abonnement",
    emoji: "📱",
    color: "#FF6B6B",
    preview_blocks: ["Profil creator", "Réseaux", "Contenu", "Partenariats"],
    theme: { name: "Creator Vibe", bg: "#080810", surface: "#10101E", primary: "#FF6B6B", accent: "#FFD93D", text: "#FFFBFF", muted: "#9A8AAA", fontDisplay: "Bricolage Grotesque", fontBody: "Plus Jakarta Sans", bgMode: "gradient", bgGradient: "linear-gradient(135deg,#080810,#10101E)" },
    blocks: [
      { type: "profile", content: { name: "Alex Creator", tagline: "Tech · Lifestyle · Voyages · 500K followers", badge: "🔥 Partenariats ouverts" } },
      { type: "bio", content: { text: "Créateur de contenu passionné par la tech et les voyages. Je partage mes découvertes, mes aventures et mes bons plans sur YouTube, Instagram et TikTok.", align: "center" } },
      { type: "social_links", content: { youtube: "https://youtube.com", instagram: "https://instagram.com", tiktok: "https://tiktok.com", twitter: "https://twitter.com" } },
      { type: "instagram_feed", content: { username: "@alexcreator", cta_label: "Me suivre sur Instagram", cta_url: "https://instagram.com" } },
      { type: "cta_button", content: { label: "Voir ma dernière vidéo YouTube", url: "#", style: "neon", icon: "▶️", full_width: "yes" } },
      { type: "cta_button", content: { label: "Me contacter pour un partenariat", url: "mailto:contact@alexcreator.com", style: "outline", icon: "📩", full_width: "yes" } },
      { type: "heading", content: { text: "Mes stats", size: "small", align: "center", color: "muted" } },
      { type: "visit_counter", content: { label: "vues ce mois" } },
    ]
  },
  {
    id: "vente_produits",
    name: "Vente de produits digitaux",
    category: "Commerce",
    description: "Formations, ebooks, templates, accès membres",
    emoji: "📦",
    color: "#A78BFA",
    preview_blocks: ["Profil vendeur", "Produits", "Témoignages", "Accès"],
    theme: { name: "Lavender Dream", bg: "#060410", surface: "#0E0820", primary: "#A78BFA", accent: "#F472B6", text: "#F5F3FF", muted: "#8B80AA", fontDisplay: "Cabinet Grotesk", fontBody: "Outfit", bgMode: "gradient", bgGradient: "linear-gradient(135deg,#060410,#0E0820)" },
    blocks: [
      { type: "profile", content: { name: "Digital Studio", tagline: "Formations & Ressources pour entrepreneurs", badge: "🎓 +1 200 élèves formés" } },
      { type: "bio", content: { text: "Je crée des formations et ressources pratiques pour aider les entrepreneurs à développer leur business en ligne. Accès immédiat après paiement.", align: "center" } },
      { type: "promo_banner", content: { emoji: "⚡", text: "Formation bestseller à -50%", subtext: "Offre limitée — 47€ au lieu de 97€", cta_label: "Profiter de l'offre", cta_url: "#" } },
      { type: "product", content: { name: "Formation Marketing Digital 2025", price: "47€", old_price: "97€", description: "8h de contenu vidéo, 50 ressources, accès à vie. Apprenez à attirer des clients en ligne.", cta_label: "Accéder à la formation", cta_url: "#" } },
      { type: "product", content: { name: "Pack Templates Canva Pro", price: "27€", description: "200+ templates premium pour vos réseaux sociaux. Personnalisables en 5 min.", cta_label: "Télécharger le pack", cta_url: "#" } },
      { type: "testimonials", content: { name1: "Marine C.", text1: "Formation ultra complète et actionnable. J'ai triplé mon CA en 3 mois !", stars1: "5", name2: "Romain D.", text2: "Les templates sont incroyables. Mon feed Instagram a complètement changé.", stars2: "5", name3: "Lisa P.", text3: "Meilleur investissement de l'année. Rentabilisé dès la première semaine.", stars3: "5" } },
      { type: "social_links", content: { instagram: "https://instagram.com", youtube: "https://youtube.com", linkedin: "https://linkedin.com" } },
    ]
  },
]

export default TEMPLATES

