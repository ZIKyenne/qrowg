import {
  Ambulance, Apple, BarChart3, BedDouble, Briefcase, Building2, CalendarDays,
  Camera, Car, CheckCircle2, ClipboardList, Clock, CreditCard, Croissant, Database, Eye,
  FileText, Flower2, Gift, Globe, Handshake, Home, Image as ImageIcon, KeyRound,
  Layers, Lightbulb, Link2, Mail, MapPin, Martini, Megaphone, MessageCircle, Music,
  Package, Palette, PartyPopper, Phone, Pill, RefreshCw, Ruler, Scale, Scissors, Search,
  Settings, Shield, ShoppingBag, Smartphone, Sparkles, Star, Tag, Target, Tent, Ticket, Timer,
  TrendingUp, Truck, User, Users, UtensilsCrossed, Video, Wifi, Wrench, Zap,
  Coffee, Dumbbell, Gem, GraduationCap, Hammer, HeartHandshake, Mic, Palmtree, Rocket, Sandwich, Stethoscope,
  AlertTriangle,
  XCircle,
} from "lucide-react"
// Séparé : la vérification d'imports du projet lit la liste comme des valeurs
// exportées, et un `type` glissé dedans lui fait annoncer une icône manquante.
import type { LucideIcon } from "lucide-react"

// Icone — le vocabulaire d'icônes du produit, en un seul endroit.
//
// ── Pourquoi (lot v188) ────────────────────────────────────────────────────
//
// Relevé du 27 septembre, au navigateur, sur les 54 pages publiques :
// **748 emojis**. Quarante rien que sur l'accueil, cinquante-deux sur la page
// des usages. Ils servaient d'icônes : ⚡ pour « éditeur simple », 🔄 pour
// « QR dynamique », 🏢 pour « marque professionnelle », 🍽️ pour « restaurant ».
//
// C'est le signal numéro un d'une page générée, pour trois raisons qui n'ont
// rien de théorique :
//
//   1. **Un emoji n'est pas dessiné par le produit.** Il est dessiné par Apple,
//      par Google ou par Microsoft, différemment sur chaque appareil. Une charte
//      noir et or se retrouve avec du rouge pomme, du bleu Twitter et du vert
//      WhatsApp qu'elle n'a pas choisis. Le relevé de contraste du lot v187 a
//      d'ailleurs dû les exclure : leur couleur n'obéit à personne.
//   2. **Il ne se met pas à l'échelle.** À 20 px il est illisible, à 44 px il
//      pixellise. Il n'a ni épaisseur de trait ni grille commune.
//   3. **Le produit avait déjà une bibliothèque.** `lucide-react` était installé
//      et employé dans le tableau de bord — mais pas sur le site vitrine.
//
// ── Ce que ce fichier est ──────────────────────────────────────────────────
//
// Une table qui traduit un CONCEPT DU PRODUIT en icône. Les données des pages
// nomment désormais « restaurant », « reservation », « avis » — pas un
// pictogramme. Si l'icône du restaurant doit changer, elle change ici, une fois,
// et partout.
//
// C'est la même règle que le lot v186 a appliquée au plancher du pouce et le
// v187 au ton discret : **ce qui est écrit à plusieurs endroits finit par ne
// plus dire la vérité.**

/** Les concepts que le produit sait dessiner. */
export const ICONES = {
  // Métiers
  restaurant: UtensilsCrossed,
  bar: Martini,
  boulangerie: Croissant,
  hotel: BedDouble,
  coiffeur: Scissors,
  garage: Car,
  pharmacie: Pill,
  camping: Tent,
  fleuriste: Flower2,
  freelance: Briefcase,
  musique: Music,
  immobilier: Home,
  commerce: ShoppingBag,
  evenement: PartyPopper,
  creatif: Palette,
  entreprise: Building2,
  bienEtre: Flower2,
  urgence: Ambulance,
  alerte: AlertTriangle,
  refus: XCircle,
  fastfood: Sandwich,
  spa: Flower2,
  coach: Target,
  formation: GraduationCap,
  vacances: Palmtree,
  batiment: Hammer,
  startup: Rocket,
  photo: Camera,
  micro: Mic,
  mariage: Gem,
  association: HeartHandshake,
  sport: Dumbbell,
  sante: Stethoscope,
  cafe: Coffee,

  // Blocs d'une page
  menu: ClipboardList,
  reservation: CalendarDays,
  avis: Star,
  horaires: Clock,
  compteARebours: Timer,
  lieu: MapPin,
  portfolio: ImageIcon,
  galerie: Camera,
  services: Wrench,
  message: MessageCircle,
  document: FileText,
  lien: Link2,
  video: Video,
  partenariat: Handshake,
  newsletter: Mail,
  telephone: Phone,
  paiement: CreditCard,
  billetterie: Ticket,
  annonce: Megaphone,
  promotion: Tag,
  catalogue: Package,
  profil: User,
  equipe: Users,
  livraison: Truck,
  cadeau: Gift,

  // Mesure et produit
  scans: Smartphone,
  vues: Eye,
  cible: Target,
  statistiques: BarChart3,
  croissance: TrendingUp,
  idee: Lightbulb,
  rapide: Zap,
  dynamique: RefreshCw,
  wifi: Wifi,
  domaine: Globe,
  etincelle: Sparkles,
  mesure: Ruler,
  recherche: Search,
  reglages: Settings,

  // États
  actif: CheckCircle2,

  // Sécurité
  securite: Shield,
  cle: KeyRound,
  base: Database,
  cloison: Layers,
  conformite: Scale,
} satisfies Record<string, LucideIcon>

export type NomIcone = keyof typeof ICONES

export interface IconeProps {
  /** Un nom absent est toléré : la donnée peut ne pas en porter. Rien ne se
   *  dessine alors — voir le commentaire du composant. */
  nom: NomIcone | string | undefined
  taille?: number
  /** Par défaut l'icône suit la couleur du texte : elle appartient à la charte. */
  couleur?: string
  className?: string
}

/**
 * Une icône du vocabulaire. Un nom inconnu ne rend RIEN plutôt qu'un carré de
 * remplacement : une icône manquante doit se voir comme un vide, pas se
 * déguiser en icône juste.
 */
export function Icone({ nom, taille = 20, couleur, className }: IconeProps) {
  const C = nom ? (ICONES as Record<string, LucideIcon>)[nom] : undefined
  if (!C) return null
  return <C size={taille} color={couleur} className={className} strokeWidth={1.75} aria-hidden />
}
