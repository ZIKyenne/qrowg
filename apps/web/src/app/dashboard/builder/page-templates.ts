// QRfolio — Modèles de PAGE complets (multi-sections) par métier + sous-variantes.
// Appliqué depuis le builder : pose un thème cohérent + un jeu de blocs prêts à personnaliser.
// N'utilise QUE des types de blocs existants et des clés de contenu réelles (mêmes clés que le rendu).
import type { PageTheme } from "./types"

export type PageTemplate = {
  key: string
  group: string   // métier, ex: "Restauration"
  label: string   // sous-variante, ex: "Bistrot français"
  emoji: string
  desc: string
  theme: PageTheme
  blocks: { type: string; content: Record<string, any> }[]
}

// Thèmes réutilisés (cohérence visuelle par ambiance).
const T = {
  velvet:   { name: "Velvet Rouge",   bg: "#0D0505", surface: "#1A0A0A", primary: "#EF4444", accent: "#F97316", text: "#FFF5F5", muted: "#B8837A", fontDisplay: "Playfair Display", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
  gold:     { name: "Midnight Gold",  bg: "#080808", surface: "#111009", primary: "#C9A84C", accent: "#39FF8F", text: "#F5F0E8", muted: "#8A8478", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
  neon:     { name: "Neon Punch",     bg: "#0A0A0F", surface: "#12121C", primary: "#F59E0B", accent: "#EF4444", text: "#FFF7ED", muted: "#9A8478", fontDisplay: "Poppins", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
  cocktail: { name: "Nuit Cocktail",  bg: "#0B0616", surface: "#160C26", primary: "#A78BFA", accent: "#F472B6", text: "#F5EEFF", muted: "#9E8FB8", fontDisplay: "Playfair Display", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
  rose:     { name: "Rose Poudré",    bg: "#140A10", surface: "#20101A", primary: "#F472B6", accent: "#C9A84C", text: "#FFF0F7", muted: "#C08FA8", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
  spa:      { name: "Zen Émeraude",   bg: "#04120E", surface: "#0A1F19", primary: "#34D399", accent: "#C9A84C", text: "#ECFDF5", muted: "#7FA898", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
  calm:     { name: "Bleu Sérénité",  bg: "#060B14", surface: "#0C1524", primary: "#60A5FA", accent: "#34D399", text: "#EFF6FF", muted: "#7E93B8", fontDisplay: "Poppins", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
  navy:     { name: "Corporate Navy", bg: "#0A1628", surface: "#142240", primary: "#3B82F6", accent: "#60A5FA", text: "#EFF6FF", muted: "#7E93B8", fontDisplay: "Poppins", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
  slate:    { name: "Ardoise Pro",    bg: "#0B0F14", surface: "#141A22", primary: "#38BDF8", accent: "#39FF8F", text: "#F1F5F9", muted: "#8598AD", fontDisplay: "Poppins", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
  wood:     { name: "Atelier Bois",   bg: "#120C06", surface: "#1E140A", primary: "#D9A066", accent: "#39FF8F", text: "#FBF3E8", muted: "#A88C6E", fontDisplay: "Poppins", fontBody: "DM Sans", bgMode: "solid" } as PageTheme,
}

// Petits helpers de contenu récurrents.
const social = (extra: Record<string, string> = {}) => ({ instagram: "https://instagram.com", ...extra })

export const PAGE_TEMPLATES: PageTemplate[] = [
  // ── Restauration ────────────────────────────────────────────────────────────
  {
    key: "resto_bistrot", group: "Restauration", label: "Bistrot français", emoji: "🍽️",
    desc: "Menu, horaires, réservation, avis, plan",
    theme: T.velvet,
    blocks: [
      { type: "profile", content: { name: "Le Bistrot Parisien", tagline: "Cuisine française maison depuis 1985", badge: "🌟 Recommandé" } },
      { type: "table_booking", content: { label: "Réserver une table", platform: "TheFork" } },
      { type: "menu_section", content: { category: "🥗 Entrées", item1_name: "Foie gras poêlé", item1_price: "18€", item1_desc: "Chutney de figues, brioche toastée", item2_name: "Soupe à l'oignon", item2_price: "12€", item2_desc: "Gratinée au comté", item3_name: "Tartare de saumon", item3_price: "16€", item3_desc: "Avocat, citron vert, aneth" } },
      { type: "menu_section", content: { category: "🥩 Plats", item1_name: "Entrecôte 300g", item1_price: "32€", item1_desc: "Sauce béarnaise, frites maison", item2_name: "Filet de sole meunière", item2_price: "28€", item2_desc: "Beurre blanc, légumes vapeur", item3_name: "Risotto aux truffes", item3_price: "24€", item3_desc: "Parmesan 24 mois" } },
      { type: "documents", content: { title: "Notre carte", d1_type: "Menu", d1_title: "Carte complète", d1_desc: "Entrées, plats, desserts, vins", d1_meta: "PDF · mise à jour ce mois" } },
      { type: "opening_hours", content: { title: "Horaires", mode: "Simple (Lun-Ven / Sam / Dim)", mon_fri: "12h - 14h30, 19h - 23h", saturday: "19h - 23h30", sunday: "Fermé", note: "Réservation recommandée le week-end" } },
      { type: "testimonials", content: { name1: "Marie L.", text1: "La meilleure entrecôte de Paris, service impeccable.", stars1: "5", name2: "Pierre M.", text2: "Cadre chaleureux, plats savoureux. On reviendra !", stars2: "5" } },
      { type: "google_maps_embed", content: { label: "Le Bistrot Parisien", address: "12 rue de la Paix, 75001 Paris", zoom: "16" } },
      { type: "social_links", content: social({ facebook: "https://facebook.com" }) },
    ],
  },
  {
    key: "resto_fastfood", group: "Restauration", label: "Fast-food & Burger", emoji: "🍔",
    desc: "Commande en ligne, best-sellers, promo, horaires",
    theme: T.neon,
    blocks: [
      { type: "profile", content: { name: "Big Bite", tagline: "Burgers smashés & frites maison", badge: "🔥 Ouvert maintenant" } },
      { type: "announcement", content: { type: "Promo", title: "Menu du midi -20%", message: "Du lundi au vendredi, de 11h30 à 14h.", style: "Détaillé" } },
      { type: "cta_button", content: { label: "Commander en ligne", url: "#", style: "gold", icon: "🛵", full_width: "yes" } },
      { type: "popular_products", content: { title: "Les best-sellers", p1_name: "Le Smash Classic", p1_price: "9,90€", p1_sales: "🔥 le plus vendu", p2_name: "Double Cheese", p2_price: "12,50€", p2_sales: "★ coup de cœur", p3_name: "Menu Chicken", p3_price: "11€" } },
      { type: "menu_section", content: { category: "🍟 Accompagnements", item1_name: "Frites maison", item1_price: "3,50€", item2_name: "Onion rings", item2_price: "4,50€", item3_name: "Potatoes", item3_price: "4€" } },
      { type: "opening_hours", content: { title: "Horaires", mon_fri: "11h30 - 23h", saturday: "11h30 - 00h", sunday: "18h - 23h" } },
      { type: "google_maps_embed", content: { label: "Big Bite", address: "5 avenue de la République, 75011 Paris", zoom: "16" } },
      { type: "social_links", content: social({ tiktok: "https://tiktok.com" }) },
    ],
  },
  {
    key: "resto_bar", group: "Restauration", label: "Bar à cocktails", emoji: "🍸",
    desc: "Carte cocktails, happy hour, ambiance, événements",
    theme: T.cocktail,
    blocks: [
      { type: "profile", content: { name: "The Alchemist", tagline: "Cocktails d'auteur · Paris", badge: "🍸 Mixologie" } },
      { type: "announcement", content: { type: "Information", title: "Happy hour 18h - 20h", message: "Tous les cocktails signature à -30%.", style: "Compact" } },
      { type: "menu_section", content: { category: "🍸 Signatures", item1_name: "Smoked Old Fashioned", item1_price: "14€", item1_desc: "Bourbon, fumée de hêtre", item2_name: "Garden Spritz", item2_price: "12€", item2_desc: "Gin, concombre, basilic", item3_name: "Velvet Espresso", item3_price: "13€", item3_desc: "Vodka, café, tonka" } },
      { type: "table_booking", content: { label: "Réserver une table", platform: "URL personnalisee" } },
      { type: "timeline", content: { title: "La soirée", layout: "Horizontale", e1_icon: "🍸", e1_date: "18h", e1_title: "Happy hour", e2_icon: "🎧", e2_date: "21h", e2_title: "DJ set", e3_icon: "✨", e3_date: "23h", e3_title: "Ambiance club" } },
      { type: "opening_hours", content: { title: "Horaires", mon_fri: "18h - 02h", saturday: "18h - 03h", sunday: "Fermé" } },
      { type: "google_maps_embed", content: { label: "The Alchemist", address: "8 rue Oberkampf, 75011 Paris", zoom: "16" } },
      { type: "social_links", content: social() },
    ],
  },

  // ── Beauté & bien-être ───────────────────────────────────────────────────────
  {
    key: "beaute_coiffure", group: "Beauté & bien-être", label: "Salon de coiffure", emoji: "💇",
    desc: "Prestations, tarifs, réservation, équipe, avis",
    theme: T.rose,
    blocks: [
      { type: "profile", content: { name: "Salon Éclat", tagline: "Coiffure & couleur · Paris 11e", badge: "⭐ 4,9/5" } },
      { type: "services_pricing", content: { title: "Nos prestations", s1_name: "Coupe & brushing", s1_price: "à partir de 45€", s2_name: "Coloration / balayage", s2_price: "à partir de 80€", s3_name: "Soin kératine", s3_price: "à partir de 60€" } },
      { type: "cta_button", content: { label: "Prendre rendez-vous", url: "#", style: "gold", icon: "📅", full_width: "yes" } },
      { type: "team", content: { title: "L'équipe", layout: "Grille", m1_name: "Sophie", m1_role: "Coloriste experte", m2_name: "Léa", m2_role: "Coiffeuse styliste" } },
      { type: "gift_card", content: { title: "Offrir un moment beauté", description: "Le cadeau parfait, valable 1 an", cta_label: "Offrir un bon" } },
      { type: "testimonials", content: { name1: "Emma R.", text1: "Le balayage est parfait, l'équipe est adorable.", stars1: "5", name2: "Julie M.", text2: "Meilleure coloration de ma vie !", stars2: "5" } },
      { type: "opening_hours", content: { title: "Horaires", mon_fri: "9h - 19h", saturday: "9h - 18h", sunday: "Fermé" } },
      { type: "google_maps_embed", content: { label: "Salon Éclat", address: "24 rue de la Roquette, 75011 Paris", zoom: "16" } },
      { type: "social_links", content: social() },
    ],
  },
  {
    key: "beaute_spa", group: "Beauté & bien-être", label: "Institut & Spa", emoji: "🧖",
    desc: "Soins, forfaits, ambiance zen, réservation",
    theme: T.spa,
    blocks: [
      { type: "profile", content: { name: "Maison Sérénité", tagline: "Institut de beauté & spa", badge: "🌿 Bio & naturel" } },
      { type: "announcement", content: { type: "Promo", title: "Offre découverte", message: "-15% sur votre premier soin visage.", style: "Compact" } },
      { type: "services_pricing", content: { title: "Nos soins", s1_name: "Massage relaxant 60 min", s1_price: "75€", s2_name: "Soin visage éclat", s2_price: "65€", s3_name: "Rituel corps complet", s3_price: "120€" } },
      { type: "packs", content: { title: "Nos forfaits", t1: "Escapade", p1: "150€", d1: "2 soins au choix", t2: "Journée détente", p2: "260€", d2: "3 soins + déjeuner" } },
      { type: "cta_button", content: { label: "Réserver un soin", url: "#", style: "gold", icon: "🌸", full_width: "yes" } },
      { type: "testimonials", content: { name1: "Clara B.", text1: "Un vrai moment hors du temps, je recommande.", stars1: "5", name2: "Nadia S.", text2: "Cadre magnifique et praticiennes en or.", stars2: "5" } },
      { type: "opening_hours", content: { title: "Horaires", mon_fri: "10h - 20h", saturday: "10h - 19h", sunday: "Fermé" } },
      { type: "google_maps_embed", content: { label: "Maison Sérénité", address: "3 rue du Calme, 75006 Paris", zoom: "16" } },
      { type: "social_links", content: social() },
    ],
  },

  // ── Coaching & Formation ─────────────────────────────────────────────────────
  {
    key: "coach_vie", group: "Coaching & Formation", label: "Coach de vie", emoji: "🎯",
    desc: "Méthode, offres, témoignages, appel découverte",
    theme: T.calm,
    blocks: [
      { type: "profile", content: { name: "Marie Laurent", tagline: "Coach de vie certifiée · PNL & pleine conscience", badge: "✅ +200 accompagnés" } },
      { type: "bio", content: { text: "Je vous accompagne vers une vie alignée avec vos valeurs. Ma méthode combine PNL, pleine conscience et coaching systémique.", align: "center" } },
      { type: "process_steps", content: { title: "Comment ça se passe", s1_icon: "📞", s1_title: "Appel découverte", s1_desc: "Gratuit, 30 min", s2_icon: "🎯", s2_title: "Objectifs", s2_desc: "On définit le cap ensemble", s3_icon: "🚀", s3_title: "Séances", s3_desc: "En visio ou présentiel", s4_icon: "✨", s4_title: "Transformation", s4_desc: "Un vrai changement durable" } },
      { type: "pricing", content: { title: "Mes offres", title1: "Séance", price1: "90€", desc1: "1h en visio", title2: "Pack 5", price2: "380€", desc2: "Économisez 70€", title3: "Programme", price3: "850€", desc3: "12 séances + suivi" } },
      { type: "testimonials", content: { name1: "Lucie D.", text1: "Marie m'a aidée à reprendre confiance. Bienveillance remarquable.", stars1: "5", name2: "Paul R.", text2: "Un accompagnement qui m'a fait changer de cap pro.", stars2: "5" } },
      { type: "cta_button", content: { label: "Réserver un appel découverte offert", url: "https://calendly.com", style: "gold", icon: "📅", full_width: "yes" } },
      { type: "social_links", content: social({ linkedin: "https://linkedin.com" }) },
    ],
  },
  {
    key: "coach_formateur", group: "Coaching & Formation", label: "Formateur en ligne", emoji: "🎓",
    desc: "Formations, programme, preuve sociale, inscription",
    theme: T.gold,
    blocks: [
      { type: "profile", content: { name: "Digital Academy", tagline: "Formations pratiques pour entrepreneurs", badge: "🎓 +1200 élèves" } },
      { type: "stats_block", content: { s1_icon: "🎓", s1_value: "1200+", s1_label: "Élèves formés", s2_icon: "⭐", s2_value: "4,9/5", s2_label: "Note moyenne", s3_icon: "🎬", s3_value: "80+", s3_label: "Heures de contenu" } },
      { type: "announcement", content: { type: "Promo", title: "Formation bestseller à -50%", message: "47€ au lieu de 97€ — offre limitée.", style: "Détaillé" } },
      { type: "process_steps", content: { title: "Le programme", s1_icon: "📚", s1_title: "Fondations", s1_desc: "Les bases solides", s2_icon: "🛠️", s2_title: "Pratique", s2_desc: "Exercices guidés", s3_icon: "🚀", s3_title: "Passage à l'action", s3_desc: "Votre projet réel" } },
      { type: "faq", content: { title: "Questions fréquentes", search: "Non", q1: "L'accès est-il à vie ?", a1: "Oui, accès illimité + mises à jour.", q2: "Y a-t-il un certificat ?", a2: "Oui, à la fin de la formation.", q3: "Puis-je payer en plusieurs fois ?", a3: "Oui, 3× sans frais." } },
      { type: "cta_button", content: { label: "Accéder à la formation", url: "#", style: "gold", icon: "🎓", full_width: "yes" } },
      { type: "social_links", content: social({ youtube: "https://youtube.com" }) },
    ],
  },

  // ── Immobilier ───────────────────────────────────────────────────────────────
  {
    key: "immo_agence", group: "Immobilier", label: "Agence immobilière", emoji: "🏢",
    desc: "Services, estimation, chiffres, avis, contact",
    theme: T.navy,
    blocks: [
      { type: "profile", content: { name: "Dubois Immobilier", tagline: "Agent immobilier · Paris & IDF", badge: "🏠 +150 biens vendus" } },
      { type: "stats_block", content: { s1_icon: "🏠", s1_value: "150+", s1_label: "Biens vendus", s2_icon: "⭐", s2_value: "4,9/5", s2_label: "Satisfaction", s3_icon: "📅", s3_value: "12 ans", s3_label: "Expérience" } },
      { type: "services_list", content: { title: "Mes services", s1_icon: "🏠", s1_name: "Vente & achat", s1_desc: "Estimation, négociation, closing", s2_icon: "🔑", s2_name: "Location & gestion", s2_desc: "Mise en location, suivi", s3_icon: "📊", s3_name: "Estimation gratuite", s3_desc: "Valorisation de votre bien" } },
      { type: "process_steps", content: { title: "Notre accompagnement", s1_icon: "📞", s1_title: "Contact", s1_desc: "On échange sur votre projet", s2_icon: "📊", s2_title: "Estimation", s2_desc: "Gratuite et précise", s3_icon: "🤝", s3_title: "Vente", s3_desc: "Au meilleur prix" } },
      { type: "testimonials", content: { name1: "Famille Moreau", text1: "Notre appartement idéal trouvé en 3 semaines.", stars1: "5", name2: "Sophie L.", text2: "Vente rapide au meilleur prix. Je recommande !", stars2: "5" } },
      { type: "cta_button", content: { label: "Estimation gratuite de mon bien", url: "#", style: "gold", icon: "🏡", full_width: "yes" } },
      { type: "multi_contact", content: { title: "Me contacter" } },
      { type: "social_links", content: social({ linkedin: "https://linkedin.com" }) },
    ],
  },
  {
    key: "immo_location", group: "Immobilier", label: "Location saisonnière", emoji: "🏖️",
    desc: "Le logement, équipements, avis, réservation, accès",
    theme: T.slate,
    blocks: [
      { type: "profile", content: { name: "Villa Azur", tagline: "Location vue mer · 6 personnes", badge: "🏖️ Superhost" } },
      { type: "cta_button", content: { label: "Réserver mon séjour", url: "#", style: "gold", icon: "🗓️", full_width: "yes" } },
      { type: "values", content: { title: "Les équipements", v1_icon: "📶", v1_label: "Wifi fibre", v2_icon: "🅿️", v2_label: "Parking privé", v3_icon: "🏊", v3_label: "Piscine chauffée", v4_icon: "🌅", v4_label: "Terrasse vue mer" } },
      { type: "stats_block", content: { s1_icon: "⭐", s1_value: "4,95/5", s1_label: "Note voyageurs", s2_icon: "🛏️", s2_value: "3 ch.", s2_label: "6 couchages", s3_icon: "📐", s3_value: "110 m²", s3_label: "Surface" } },
      { type: "testimonials", content: { name1: "Camille & Théo", text1: "Vue à couper le souffle, logement impeccable.", stars1: "5", name2: "Marc D.", text2: "Accueil parfait, on reviendra sans hésiter.", stars2: "5" } },
      { type: "faq", content: { title: "Infos pratiques", q1: "Quelle est l'heure d'arrivée ?", a1: "Check-in à partir de 16h, check-out avant 11h.", q2: "Les animaux sont-ils acceptés ?", a2: "Oui, sur demande préalable.", q3: "Y a-t-il une caution ?", a3: "Oui, 500€ restitués au départ." } },
      { type: "google_maps_embed", content: { label: "Villa Azur", address: "Route des Calanques, 06400 Cannes", zoom: "13" } },
      { type: "social_links", content: social() },
    ],
  },

  // ── Artisan ──────────────────────────────────────────────────────────────────
  {
    key: "artisan_batiment", group: "Artisan & Services", label: "Artisan du bâtiment", emoji: "🔨",
    desc: "Savoir-faire, réalisations, zone, garanties, devis",
    theme: T.wood,
    blocks: [
      { type: "profile", content: { name: "Atelier Renov", tagline: "Rénovation tous corps d'état · 15 ans", badge: "🔨 Devis gratuit" } },
      { type: "services_list", content: { title: "Nos prestations", s1_icon: "🧱", s1_name: "Maçonnerie", s1_desc: "Gros œuvre, extension", s2_icon: "🎨", s2_name: "Peinture & finitions", s2_desc: "Intérieur / extérieur", s3_icon: "🚿", s3_name: "Plomberie & salle de bain", s3_desc: "Rénovation complète" } },
      { type: "process_steps", content: { title: "Comment ça marche", s1_icon: "📞", s1_title: "Contact", s1_desc: "Prise de rendez-vous", s2_icon: "📋", s2_title: "Devis", s2_desc: "Gratuit sous 48h", s3_icon: "🔨", s3_title: "Réalisation", s3_desc: "Dans les délais", s4_icon: "✅", s4_title: "Garantie", s4_desc: "Travaux garantis" } },
      { type: "trust_badge", content: { title: "Nos garanties", b1_icon: "🛡️", b1_label: "Garantie décennale", b2_icon: "✅", b2_label: "Assurance RC Pro", b3_icon: "🏅", b3_label: "Artisan certifié RGE" } },
      { type: "service_area", content: { title: "Zone d'intervention", areas: "Paris, Boulogne, Neuilly, Levallois, Issy" } },
      { type: "testimonials", content: { name1: "M. et Mme Blanc", text1: "Chantier propre, dans les temps, résultat parfait.", stars1: "5", name2: "Karim B.", text2: "Devis clair, équipe pro et à l'écoute.", stars2: "5" } },
      { type: "cta_button", content: { label: "Demander un devis gratuit", url: "#", style: "gold", icon: "📋", full_width: "yes" } },
      { type: "multi_contact", content: { title: "Nous joindre" } },
    ],
  },
]

// Groupes ordonnés pour l'affichage (dérivé, garde l'ordre d'apparition).
export const PAGE_TEMPLATE_GROUPS: string[] = PAGE_TEMPLATES.reduce<string[]>((acc, t) => {
  if (!acc.includes(t.group)) acc.push(t.group)
  return acc
}, [])
