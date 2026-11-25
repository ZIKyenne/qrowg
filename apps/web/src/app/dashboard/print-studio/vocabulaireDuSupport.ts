// Le vocabulaire du support imprimé : mises en page compatibles, accents,
// encres lisibles, éléments libres (texte / icône / forme), icônes, formes,
// compositions prêtes et modèles « 1 clic ». Sorti de PrintStudioClient (v383) :
// le rendu du support et l'atelier parlent tous deux cette langue, et aucune
// de ces définitions ne dépend de l'état de l'atelier.

import { Star, Heart, Phone, Mail, MapPin, Wifi, Clock, Gift, Coffee, Globe, Sparkles, Camera, Music, Tag, Zap, Award, Sun, Moon, Leaf, Navigation, Home, Users, Utensils, Wine, Beer, Pizza, ShoppingBag, ShoppingCart, CreditCard, Percent, MessageCircle, ThumbsUp, Share2, Send, AtSign, Link2, QrCode, Smartphone, Calendar, Bell, Info, Scissors, ArrowDown } from "lucide-react"
import { LAYOUT_BY_ID, LAYOUTS, type Item } from "./catalog"
import { paletteFromStyle } from "./mockup"

// item.layout est parfois une clé de contenu ('stack'), parfois un id de layout ('orne').
// On résout toujours vers un id de LAYOUTS valide (pour le volet Mise en page).
export function resolveLayoutId(itemLayout: string): string {
  if (LAYOUT_BY_ID[itemLayout]) return itemLayout
  const byContent = LAYOUTS.find(l => l.content === itemLayout)
  return byContent ? byContent.id : "centre"
}
// Mises en page adaptées aux supports RONDS (centrées/symétriques) : les autres (bandeau, affiche, colonnes…)
// supposent un rectangle et se retrouvent rognées par le cercle.
export const ROUND_LAYOUTS = new Set(["centre", "qrgeant", "cadre", "orne"])
// Une mise en page est-elle COMPATIBLE avec la forme/le ratio du support ?
// - rond : uniquement les mises en page centrées.
// - « colonnes/split » (QR À CÔTÉ du texte) : besoin de largeur (ratio ≥ 1.15) sinon le texte est écrasé/déborde.
export function layoutOk(id: string, item: Item): boolean {
  if (item.shape === "round") return ROUND_LAYOUTS.has(id)
  const l = LAYOUT_BY_ID[id]
  if (!l) return false
  if (l.content === "split") return item.ratio >= 1.15
  // « Affiche » (poster) suppose un GRAND support (A5+) : titre géant + QR + bouton côte à côte
  // débordent sur une petite carte. Sur un petit support, le preset est ramené au centré.
  if (l.content === "poster") return item.hMm >= 180
  return true
}
// Ramène une mise en page vers une compatible (fallback = centré).
export function fitLayout(id: string, item: Item): string {
  return layoutOk(id, item) ? id : "centre"
}
// Couleurs d'accent (override de l'ambiance) : « auto » = laisse l'ambiance décider.
export const ACCENTS: { id: string; label: string; hex: string }[] = [
  { id: "auto", label: "Auto", hex: "" },
  { id: "or", label: "Or", hex: "#C9A84C" },
  { id: "rouge", label: "Rouge", hex: "#D4483B" },
  { id: "corail", label: "Corail", hex: "#E5735B" },
  { id: "vert", label: "Vert", hex: "#3E9E6E" },
  { id: "bleu", label: "Bleu", hex: "#3B6FD4" },
  { id: "violet", label: "Violet", hex: "#7A5CD4" },
  { id: "rose", label: "Rose", hex: "#D45C9E" },
]
// L'accent est un id de la palette OU une couleur précise choisie au nuancier
// (« #rrggbb ») : on ne pouvait choisir que parmi huit teintes (relevé du 16 nov.).
export const HEX6 = /^#[0-9a-f]{6}$/i
export function hexDAccent(accent: string): string {
  return ACCENTS.find(a => a.id === accent)?.hex || (HEX6.test(accent) ? accent : "")
}
export const TITLE_WEIGHT: Record<string, number> = { fin: 400, normal: 0, gras: 800 } // 0 = graisse de l'ambiance
// Encre lisible (noir/blanc) sur une couleur donnée — pour le libellé du bouton accentué.
export function readableOn(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return "#0A0A0A"
  const L = (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255
  return L > 0.6 ? "#0A0A0A" : "#FFFFFF"
}
// Éclaircit (amt>0) ou assombrit (amt<0) une couleur hex ; renvoie l'entrée si non hex (bi-ton du bouton).
export function shade(hex: string, amt: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return hex
  const adj = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)))
  return `#${[1, 2, 3].map(i => adj(parseInt(m[i], 16)).toString(16).padStart(2, "0")).join("")}`
}
// Élément LIBRE (mode « Studio libre ») : texte / icône / forme posé et déplacé n'importe où sur le support.
// x/y/w/h2/size en FRACTION du support -> invariant à l'échelle (aperçu, planche PDF identiques).
export type FreeEl = { id: string; kind: "text" | "icon" | "shape"; x: number; y: number; w: number; h2?: number; size: number; color: string; align: "left" | "center" | "right"; weight: number; font: string; text: string; icon?: string; shape?: string; rot?: number; opacity?: number; hidden?: boolean; locked?: boolean }
// Libellé court d'un élément pour la liste des calques.
export function layerLabel(el: FreeEl): string {
  if (el.kind === "text") return el.text.trim() ? (el.text.length > 22 ? el.text.slice(0, 22) + "…" : el.text) : "Texte"
  if (el.kind === "icon") return el.icon || "Icône"
  return el.shape === "line" ? "Ligne" : el.shape === "pill" ? "Pilule" : el.shape === "rrect" ? "Rectangle" : "Cercle"
}
// Bibliothèque d'icônes libres (lucide, NON-marque — lucide-react 1.17 n'a plus les logos ; cf [[lucide-icons-gotcha]]).
// Le garde-fou check-jsx-imports + tsc valident leur existence au build.
export const ICON_LIB: Record<string, any> = {
  Star, Heart, Sparkles, Award, Sun, Moon, Leaf,
  Phone, Mail, MapPin, Navigation, Globe, Clock, Home, Users,
  Coffee, Utensils, Wine, Beer, Pizza,
  ShoppingBag, ShoppingCart, CreditCard, Percent, Tag, Gift,
  Camera, Music, MessageCircle, ThumbsUp, Share2, Send, AtSign, Link2,
  Wifi, QrCode, Smartphone, Zap, Calendar, Bell, Info, Scissors, ArrowDown,
}
// Bibliothèque d'icônes ORGANISÉE (catégories + libellés FR pour la recherche du « + Ajouter »).
export const ICON_CATS: { cat: string; items: { name: string; label: string }[] }[] = [
  { cat: "Général", items: [{ name: "Star", label: "Étoile" }, { name: "Heart", label: "Cœur" }, { name: "Sparkles", label: "Éclat" }, { name: "Award", label: "Récompense" }, { name: "Sun", label: "Soleil" }, { name: "Moon", label: "Lune" }, { name: "Leaf", label: "Feuille" }] },
  { cat: "Contact", items: [{ name: "Phone", label: "Téléphone" }, { name: "Mail", label: "Email" }, { name: "MapPin", label: "Adresse" }, { name: "Navigation", label: "Itinéraire" }, { name: "Globe", label: "Site web" }, { name: "Clock", label: "Horaires" }, { name: "Home", label: "Accueil" }, { name: "Users", label: "Équipe" }] },
  { cat: "Restaurant", items: [{ name: "Coffee", label: "Café" }, { name: "Utensils", label: "Couverts" }, { name: "Wine", label: "Vin" }, { name: "Beer", label: "Bière" }, { name: "Pizza", label: "Pizza" }] },
  { cat: "Commerce", items: [{ name: "ShoppingBag", label: "Sac" }, { name: "ShoppingCart", label: "Panier" }, { name: "CreditCard", label: "Paiement" }, { name: "Percent", label: "Promo" }, { name: "Tag", label: "Étiquette" }, { name: "Gift", label: "Cadeau" }] },
  { cat: "Réseaux", items: [{ name: "Camera", label: "Photo" }, { name: "Music", label: "Musique" }, { name: "MessageCircle", label: "Message" }, { name: "ThumbsUp", label: "J'aime" }, { name: "Share2", label: "Partager" }, { name: "Send", label: "Envoyer" }, { name: "AtSign", label: "Mention" }, { name: "Link2", label: "Lien" }] },
  { cat: "Fonctionnel", items: [{ name: "wifi", label: "wifi" }, { name: "QrCode", label: "QR" }, { name: "Smartphone", label: "Mobile" }, { name: "Zap", label: "Éclair" }, { name: "Calendar", label: "Agenda" }, { name: "Bell", label: "Cloche" }, { name: "Info", label: "Info" }, { name: "Scissors", label: "Coupe" }] },
]
// Formes libres (avec libellé FR pour la recherche du « + Ajouter »).
export const SHAPES: { id: string; label: string; g: string }[] = [
  { id: "circle", label: "Cercle", g: "●" }, { id: "rrect", label: "Rectangle", g: "▢" }, { id: "pill", label: "Pilule", g: "▬" }, { id: "line", label: "Ligne", g: "―" },
]
// Safe-area des éléments libres : plus petite distance d'un élément au bord du support (mm).
// Sert au pré-vol (mode Studio libre) — un élément au ras du bord = risque de rognage.
export function freeElsEdgeMm(els: FreeEl[], item: Item): number {
  const wmm = item.shape === "round" ? item.hMm : item.hMm * item.ratio, hmm = item.hMm
  let min = Infinity
  for (const e of els) {
    const wEl = e.kind === "icon" ? e.size : e.w
    const hEl = e.kind === "shape" ? (e.h2 ?? 0.12) : e.size
    const m = Math.min(e.x * wmm, (1 - (e.x + wEl)) * wmm, e.y * hmm, (1 - (e.y + hEl)) * hmm)
    if (m < min) min = m
  }
  return min === Infinity ? item.margin : Math.max(0, +min.toFixed(1))
}
// Compositions prêtes (§13) : des GROUPES d'éléments finis, posés en un clic autour du QR (près du haut du support,
// pour ne pas recouvrir le QR au centre). Positions en fraction ; couleurs dérivées du thème courant à l'ajout.
export type Palette = ReturnType<typeof paletteFromStyle>
export function cT(x: number, y: number, w: number, size: number, text: string, weight: number, color: string, align: "left" | "center" | "right" = "center"): Omit<FreeEl, "id"> { return { kind: "text", x, y, w, size, color, align, weight, font: "", text } }
export function cI(x: number, y: number, size: number, icon: string, color: string): Omit<FreeEl, "id"> { return { kind: "icon", x, y, w: size, h2: size, size, color, align: "center", weight: 700, font: "", text: "", icon } }
export function cS(x: number, y: number, w: number, h2: number, shape: string, color: string): Omit<FreeEl, "id"> { return { kind: "shape", x, y, w, h2, size: 0.06, color, align: "center", weight: 700, font: "", text: "", shape } }
export const COMPOSITIONS: { id: string; label: string; hint: string; build: (p: Palette) => Omit<FreeEl, "id">[] }[] = [
  { id: "scannez", label: "Scannez ici", hint: "flèche + accroche", build: p => [cT(0.2, 0.06, 0.6, 0.07, "Scannez ici", 800, p.fg), cI(0.44, 0.18, 0.12, "ArrowDown", p.band)] },
  { id: "avis", label: "Votre avis", hint: "5 étoiles + texte", build: p => [...[0, 1, 2, 3, 4].map(i => cI(0.18 + i * 0.13, 0.08, 0.08, "Star", p.band)), cT(0.15, 0.2, 0.7, 0.055, "Votre avis compte", 700, p.fg)] },
  { id: "wifi", label: "Wi-Fi gratuit", hint: "icône + réseau", build: p => [cI(0.43, 0.06, 0.14, "wifi", p.band), cT(0.15, 0.24, 0.7, 0.07, "Wi-Fi gratuit", 800, p.fg), cT(0.15, 0.34, 0.7, 0.04, "Réseau : ________", 500, p.fg)] },
  { id: "suivre", label: "Suivez-nous", hint: "@ + identifiant", build: p => [cI(0.34, 0.06, 0.1, "AtSign", p.band), cT(0.15, 0.19, 0.7, 0.065, "Suivez-nous", 800, p.fg), cT(0.15, 0.28, 0.7, 0.045, "@votrecompte", 600, p.band)] },
  { id: "reserver", label: "Réservez", hint: "bouton + infos", build: p => [cS(0.28, 0.08, 0.44, 0.1, "pill", p.band), cT(0.28, 0.1, 0.44, 0.055, "Réservez", 800, p.bandFg), cT(0.2, 0.23, 0.6, 0.04, "Sur place ou en ligne", 500, p.fg)] },
  { id: "fidelite", label: "Fidélité", hint: "tampons + points", build: p => [cT(0.2, 0.06, 0.6, 0.065, "Vos points", 800, p.fg), ...[0, 1, 2, 3, 4].map(i => cS(0.18 + i * 0.13, 0.18, 0.08, 0.08, "circle", p.band))] },
]
// Modèles « 1 clic » : combinaisons de réglages prêtes (ambiance + mise en page + accent + fond + cadre + textes).
export type Preset = { id: string; label: string; style: string; layout: string; accent: string; bgFinish: string; frame: string; titleCase: string; titleWeight: string; qrBadge: string; eCorner: string; eAccent: string; eAlign: "left" | "center" | "right" }
export const PRESETS: Preset[] = [
  { id: "epure", label: "Épuré", style: "minimal", layout: "centre", accent: "auto", bgFinish: "uni", frame: "aucun", titleCase: "normal", titleWeight: "normal", qrBadge: "carre", eCorner: "adouci", eAccent: "trait", eAlign: "center" },
  { id: "luxe", label: "Luxe", style: "luxgold", layout: "cadre", accent: "or", bgFinish: "degrade", frame: "coins", titleCase: "upper", titleWeight: "normal", qrBadge: "cercle", eCorner: "adouci", eAccent: "plein", eAlign: "center" },
  { id: "nuit", label: "Nuit", style: "premiumdark", layout: "centre", accent: "auto", bgFinish: "degrade", frame: "filet", titleCase: "normal", titleWeight: "normal", qrBadge: "carre", eCorner: "adouci", eAccent: "plein", eAlign: "center" },
  { id: "pop", label: "Pop", style: "neon", layout: "bandeau", accent: "rose", bgFinish: "grain", frame: "aucun", titleCase: "upper", titleWeight: "gras", qrBadge: "carre", eCorner: "vif", eAccent: "plein", eAlign: "left" },
  { id: "nature", label: "Nature", style: "sage", layout: "centre", accent: "vert", bgFinish: "uni", frame: "filet", titleCase: "normal", titleWeight: "normal", qrBadge: "carre", eCorner: "rond", eAccent: "plein", eAlign: "center" },
  { id: "affiche", label: "Affiche", style: "sunset", layout: "affiche", accent: "corail", bgFinish: "degrade", frame: "aucun", titleCase: "upper", titleWeight: "gras", qrBadge: "carre", eCorner: "vif", eAccent: "plein", eAlign: "left" },
  { id: "carte", label: "Carte", style: "modernblack", layout: "colonnes", accent: "auto", bgFinish: "uni", frame: "filet", titleCase: "normal", titleWeight: "normal", qrBadge: "carre", eCorner: "adouci", eAccent: "trait", eAlign: "left" },
  { id: "edito", label: "Édito", style: "inkedit", layout: "diagonale", accent: "auto", bgFinish: "quadrillage", frame: "aucun", titleCase: "upper", titleWeight: "normal", qrBadge: "carre", eCorner: "vif", eAccent: "trait", eAlign: "left" },
]
