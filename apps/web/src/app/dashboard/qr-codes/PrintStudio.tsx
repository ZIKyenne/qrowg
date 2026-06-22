"use client"

// =============================================================================
// PrintStudio.tsx — QR Print Studio (Phase 1)
// Editeur de supports marketing type Canva, specialise QR, base sur Fabric.js (v5).
// Plein ecran (overlay). Monte dans l'onglet "Imprimables" de QRStudio derriere un flag.
//
// Garde-fous :
// - Composant CLIENT. Fabric initialise/dispose dans useEffect (StrictMode-safe).
// - Le VRAI QR est injecte (prop qrDataUrl) et marque isQR (regenerable plus tard).
// - Sauvegarde via route serveur /api/print-design (RLS). Jamais d'ecriture client directe.
// - Export haute def via toDataURL({ multiplier }).
// - Charger Fabric via import npm (pas de CDN).
// =============================================================================

import { useEffect, useRef, useState, useCallback } from "react"
import { fabric } from "fabric"
import {
  X, Type as TypeIcon, QrCode, Square, Circle as CircleIcon, Minus,
  Copy, Trash2, Lock, Unlock, ChevronUp, ChevronDown,
  Download, Printer, Loader2, Check, Save,
  Shapes, Star, Award, MousePointerClick, ArrowRight, LayoutTemplate,
  Undo2, Redo2, Sparkles, Image as ImageIcon, Palette, Eye,
} from "lucide-react"

// ---- Constantes design (Midnight Gold) -------------------------------------
const G       = "#C9A84C"
const INK     = "#F5F0E8"
const MUTED   = "#8A8478"
const SURFACE = "#111009"
const BG      = "#080808"
const CANVAS_BG_DEFAULT = "#FFFFFF"

// ---- Formats supportes -----------------------------------------------------
// ratio = largeur / hauteur ; exportW = largeur cible export (~300 DPI / format reseau)
type FormatId = "a4" | "square" | "story" | "carte" | "flyer" | "table"
const FORMATS: Record<FormatId, { label: string; ratio: number; exportW: number }> = {
  a4:     { label: "A4",     ratio: 210 / 297,   exportW: 2480 }, // portrait, ~300 DPI
  square: { label: "Carré",  ratio: 1,           exportW: 2000 },
  story:  { label: "Story",  ratio: 1080 / 1920, exportW: 1080 }, // 9:16
  carte:  { label: "Carte",  ratio: 85 / 55,     exportW: 1004 }, // carte de visite 85x55mm paysage
  flyer:  { label: "Flyer",  ratio: 148 / 210,   exportW: 1748 }, // A5 portrait
  table:  { label: "Table",  ratio: 100 / 70,    exportW: 1181 }, // carte de table 10x7cm paysage
}
const EDIT_MAX_H = 620 // hauteur max du canvas d'edition a l'ecran
const EDIT_MAX_W = 740 // largeur max (pour les formats paysage)

function editDims(fmt: FormatId) {
  const { ratio } = FORMATS[fmt] // largeur / hauteur
  let h = EDIT_MAX_H, w = h * ratio
  if (w > EDIT_MAX_W) { w = EDIT_MAX_W; h = w / ratio }
  return { w: Math.round(w), h: Math.round(h) }
}

// ---- Polices web-safe (rendu canvas fiable) --------------------------------
// Polices : web-safe + Google (injectees par QRStudio et par PrintStudio)
const FONT_GROUPS: { label: string; fonts: string[] }[] = [
  { label: "Élégantes",  fonts: ["Cormorant Garamond", "Playfair Display", "Lora", "Merriweather", "Abril Fatface", "Georgia", "Times New Roman"] },
  { label: "Modernes",   fonts: ["Poppins", "Montserrat", "Raleway", "Oswald", "Bebas Neue", "Arial", "Helvetica", "Trebuchet MS", "Verdana", "Impact"] },
  { label: "Manuscrites", fonts: ["Dancing Script", "Pacifico"] },
  { label: "Autre",      fonts: ["Courier New"] },
]

// ---- Helpers geometrie (etoile / polygone reguliers) -----------------------
function starPts(spikes: number, outer: number, inner: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  let rot = (Math.PI / 2) * 3
  const step = Math.PI / spikes
  for (let i = 0; i < spikes; i++) {
    pts.push({ x: outer + Math.cos(rot) * outer, y: outer + Math.sin(rot) * outer }); rot += step
    pts.push({ x: outer + Math.cos(rot) * inner, y: outer + Math.sin(rot) * inner }); rot += step
  }
  return pts
}
function polyPts(sides: number, r: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2
    pts.push({ x: r + r * Math.cos(a), y: r + r * Math.sin(a) })
  }
  return pts
}

// ---- Catalogue d'icones (SVG mono-path => recolorables via le panneau) ------
const LIB_ICONS: { key: string; label: string; d: string }[] = [
  { key:"star",  label:"Avis",      d:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { key:"phone", label:"Téléphone", d:"M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.21z" },
  { key:"mail",  label:"Email",     d:"M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
  { key:"pin",   label:"Adresse",   d:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" },
  { key:"clock", label:"Horaires",  d:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" },
  { key:"web",   label:"Site web",  d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" },
  { key:"cal",   label:"Réserver",  d:"M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" },
  { key:"cam",   label:"Photo",     d:"M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z" },
  { key:"heart", label:"J'aime",    d:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
  { key:"check", label:"Validé",    d:"M12 2a10 10 0 100 20 10 10 0 000-20zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
  { key:"cart",  label:"Commander", d:"M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 15h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" },
  { key:"gift",  label:"Offre",     d:"M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z" },
  { key:"play",  label:"Vidéo",     d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM10 16.5v-9l6 4.5-6 4.5z" },
  { key:"chat",  label:"Message",   d:"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" },
  { key:"like",  label:"J'aime",    d:"M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1z" },
  { key:"music", label:"Audio",     d:"M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" },
  { key:"home",  label:"Adresse",   d:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
  { key:"user",  label:"Profil",    d:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" },
  { key:"tag",   label:"Étiquette", d:"M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" },
  { key:"bell",  label:"Alerte",    d:"M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" },
  { key:"key",   label:"Accès",     d:"M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" },
  { key:"coffee",label:"Café",      d:"M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM2 21h18v-2H2v2z" },
  { key:"truck", label:"Livraison", d:"M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-1.5-9l1.96 2.5H17V9.5h-.5z" },
  { key:"search",label:"Recherche", d:"M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" },
  { key:"share", label:"Partager",  d:"M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" },
  { key:"link",  label:"Lien",      d:"M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" },
  { key:"dl",    label:"Télécharger",d:"M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" },
  { key:"sun",   label:"Soleil",    d:"M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm-7 6H2v-2h3v2zm17 0h-3v-2h3v2zM13 2v3h-2V2h2zm0 17v3h-2v-3h2zM6.76 5.34L4.96 3.55 3.55 4.96l1.79 1.8 1.42-1.42zm12.69 12.69l-1.79-1.8-1.42 1.42 1.8 1.79 1.41-1.41zM5.34 17.24l-1.79 1.8 1.41 1.41 1.8-1.79-1.42-1.42zM20.45 4.96l-1.41-1.41-1.8 1.79 1.42 1.42 1.79-1.8z" },
  { key:"info",  label:"Info",      d:"M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" },
  { key:"lock",  label:"Sécurité",  d:"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" },
  { key:"eye",   label:"Voir",      d:"M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" },
  { key:"flag",  label:"Drapeau",   d:"M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" },
  { key:"book",  label:"Favori",    d:"M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" },
  { key:"send",  label:"Envoyer",   d:"M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" },
  { key:"smile", label:"Avis +",    d:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" },
]

// ---- Props -----------------------------------------------------------------
type Props = {
  qrId: string
  qrDataUrl: string
  userPlan: string
  onClose: () => void
  onUpsell?: (feature: string, plan: string) => void
  // Donnees deja saisies cote QRStudio, pour pre-remplir les modeles
  prefill?: { name?: string; phone?: string; website?: string }
}

// ---- Etat de selection (pour le panneau proprietes) ------------------------
type SelState = {
  isText: boolean
  fill: string
  opacity: number
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
  underline: boolean
  locked: boolean
  label: string | null    // libelle editable (groupe CTA/badge contenant un texte)
  isGroup: boolean        // true => "Couleur" recolore les formes du groupe
  textFill: string | null // couleur du texte interne (groupe avec texte)
  shadow: boolean         // ombre portee active
  shadowBlur: number      // intensite du flou de l'ombre
  textAlign: string       // alignement du texte (gauche/centre/droite)
  charSpacing: number     // espacement des lettres
  lineHeight: number      // interligne
  border: boolean         // bordure/contour active
  strokeColor: string     // couleur du contour
  strokeWidth: number     // epaisseur du contour
  radius: number | null   // coins arrondis (rectangles uniquement), null sinon
  isGroupObj: boolean     // un vrai groupe (degroupable)
  multi: boolean          // selection multiple (groupable)
} | null

// Trouve l'objet texte dans un groupe (CTA / badge), s'il y en a un
function groupText(o: fabric.Object | undefined | null): fabric.Text | null {
  if (!o || o.type !== "group") return null
  const child = (o as fabric.Group).getObjects().find(c => c.type === "text" || c.type === "i-text" || c.type === "textbox")
  return (child as fabric.Text) ?? null
}

const TOJSON_PROPS = [
  "isQR", "name", "role", "isQrCard",
  "lockMovementX", "lockMovementY",
  "lockScalingX", "lockScalingY",
  "lockRotation", "selectable", "evented",
]
const ROLE_PREFIX: Record<string, string> = { phone: "📞  ", website: "🌐  " }
const ROLE_LABEL: Record<string, string> = { title: "Titre", subtitle: "Sous-titre", phone: "Téléphone", website: "Site / adresse" }
const ROLE_ORDER = ["title", "subtitle", "phone", "website"]

// Couleur de texte lisible (noir/blanc) sur un fond donne
function lum(hex: string): number {
  const h = hex.replace("#", "")
  if (h.length < 6) return 1
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
function readableOn(hex: string): string { return lum(hex) > 0.6 ? "#111111" : "#FFFFFF" }

// Construit un bouton "pilule" (rect arrondi + texte) dimensionne au texte
function buildPill(label: string, o: { rectFill: string; textFill: string; height: number; fontSize: number }): fabric.Group {
  const txt = new fabric.Text(label, { fontSize: o.fontSize, fontFamily: "Arial", fontWeight: "bold", fill: o.textFill, originX: "center", originY: "center" })
  const padX = o.height * 0.6
  const rw = Math.max(o.height * 2, (txt.width ?? 0) + padX * 2)
  const rect = new fabric.Rect({ width: rw, height: o.height, rx: o.height / 2, ry: o.height / 2, fill: o.rectFill })
  txt.set({ left: rw / 2, top: o.height / 2 })
  return new fabric.Group([rect, txt])
}

// ---- Modeles orientes objectifs (points de depart editables) ---------------
// Chaque modele compose un design (fond + titre + sous-titre + QR + decor) dans
// l'editeur. Les couleurs sont reprises des palettes signature de QRStudio.
const PRINT_TEMPLATES: { id: string; label: string; obj: string; emoji: string; desc: string; bg: string; ink: string; accent: string }[] = [
  { id:"avis-or",       label:"Avis — Or",          obj:"Avis",     emoji:"⭐", desc:"5 étoiles dorées + invitation à noter",   bg:"#0B0805", ink:"#F4E7C4", accent:"#D4AF37" },
  { id:"avis-clair",    label:"Avis — Clair",       obj:"Avis",     emoji:"⭐", desc:"Fond crème, sobre et lisible",            bg:"#FFF9EF", ink:"#2A2419", accent:"#C0392B" },
  { id:"menu",          label:"Menu — Élégant",     obj:"Menu",     emoji:"🍽️", desc:"Bandeau coloré + « Notre carte »",        bg:"#101010", ink:"#F5F0E8", accent:"#C9A84C" },
  { id:"menu-clair",    label:"Menu — Clair",       obj:"Menu",     emoji:"🍽️", desc:"Fond crème, bandeau doré",               bg:"#FBF3E7", ink:"#3A2316", accent:"#B8860B" },
  { id:"reserver",      label:"Réservation",        obj:"Réserver", emoji:"📅", desc:"Picto agenda + « Réservez votre table »", bg:"#06231C", ink:"#EAF7F0", accent:"#34D399" },
  { id:"reserver-clair",label:"Réservation — Clair",obj:"Réserver", emoji:"📅", desc:"Fond clair, accent vert",                bg:"#F2F7F4", ink:"#10271E", accent:"#0E7A5F" },
  { id:"insta",         label:"Instagram",          obj:"Abonnés",  emoji:"📷", desc:"Picto photo + « Suivez-nous » + @compte", bg:"#1A0A14", ink:"#FFF0F6", accent:"#E1306C" },
  { id:"insta-clair",   label:"Instagram — Clair",  obj:"Abonnés",  emoji:"📷", desc:"Fond clair, accent rose",                bg:"#FFF5F8", ink:"#2A0A18", accent:"#E1306C" },
  { id:"contact",       label:"Carte contact",      obj:"Contact",  emoji:"💳", desc:"Nom, métier, coordonnées + QR",          bg:"#0F1729", ink:"#F1F5FF", accent:"#5B8DEF" },
  { id:"contact-clair", label:"Carte contact — Clair",obj:"Contact",emoji:"💳", desc:"Fond clair, sobre",                      bg:"#F7F9FC", ink:"#0F2540", accent:"#1D4ED8" },
  { id:"decouvrir",     label:"Découvrir",          obj:"Page",     emoji:"🔗", desc:"Invitation simple à scanner",            bg:"#FFFFFF", ink:"#1A1A1A", accent:"#1D4ED8" },
  { id:"decouvrir-or",  label:"Découvrir — Or",     obj:"Page",     emoji:"🔗", desc:"Fond sombre, accent or",                 bg:"#0B0805", ink:"#F4E7C4", accent:"#D4AF37" },
  { id:"avis-band",     label:"Avis — Bandeau",     obj:"Avis",     emoji:"⭐", desc:"Grand bandeau en-tête doré",              bg:"#1A1206", ink:"#F4E7C4", accent:"#D4AF37" },
  { id:"reserver-band", label:"Réservation — Bandeau", obj:"Réserver", emoji:"📅", desc:"Bandeau d'en-tête, accent teal",       bg:"#0E1B2A", ink:"#EAF2FF", accent:"#2DD4BF" },
  { id:"insta-band",    label:"Instagram — Bandeau",obj:"Abonnés",  emoji:"📷", desc:"Grand bandeau rose",                    bg:"#15101C", ink:"#FBEAF4", accent:"#E1306C" },
  { id:"contact-band",  label:"Contact — Bandeau",  obj:"Contact",  emoji:"💳", desc:"Bandeau d'en-tête bleu",                bg:"#0F1729", ink:"#F1F5FF", accent:"#5B8DEF" },
  { id:"decouvrir-band",label:"Découvrir — Bandeau",obj:"Page",     emoji:"🔗", desc:"Bandeau d'en-tête vert",                bg:"#10130F", ink:"#EAF4E6", accent:"#16A34A" },
  { id:"avis-frame",    label:"Avis — Cadre",       obj:"Avis",     emoji:"⭐", desc:"Filet doré, élégant",                   bg:"#FBF6EC", ink:"#2A2419", accent:"#B8860B" },
  { id:"menu-frame",    label:"Menu — Cadre",       obj:"Menu",     emoji:"🍽️", desc:"Cadre or sur fond sombre",              bg:"#0E0E0E", ink:"#F5F0E8", accent:"#C9A84C" },
  { id:"reserver-frame",label:"Réservation — Cadre",obj:"Réserver", emoji:"📅", desc:"Cadre vert, sobre",                     bg:"#F2F7F4", ink:"#10271E", accent:"#0E7A5F" },
  { id:"insta-frame",   label:"Instagram — Cadre",  obj:"Abonnés",  emoji:"📷", desc:"Cadre rose sur fond clair",            bg:"#FFF5F8", ink:"#2A0A18", accent:"#E1306C" },
  { id:"contact-frame", label:"Contact — Cadre",    obj:"Contact",  emoji:"💳", desc:"Cadre or, premium",                    bg:"#0F1729", ink:"#F1F5FF", accent:"#C9A84C" },
  { id:"decouvrir-frame",label:"Découvrir — Cadre", obj:"Page",     emoji:"🔗", desc:"Cadre bleu, minimal",                  bg:"#FFFFFF", ink:"#1A1A1A", accent:"#1D4ED8" },
  { id:"avis-footer",    label:"Avis — Footer",      obj:"Avis",     emoji:"⭐", desc:"Barre d'appel en bas",                  bg:"#FFFDF7", ink:"#2A2419", accent:"#C0392B" },
  { id:"menu-footer",    label:"Menu — Footer",      obj:"Menu",     emoji:"🍽️", desc:"Footer doré sur fond sombre",           bg:"#101010", ink:"#F5F0E8", accent:"#C9A84C" },
  { id:"reserver-footer",label:"Réservation — Footer",obj:"Réserver",emoji:"📅", desc:"Footer bleu, pro",                      bg:"#F3F7FB", ink:"#0F2540", accent:"#1D4ED8" },
  { id:"insta-footer",   label:"Instagram — Footer", obj:"Abonnés",  emoji:"📷", desc:"Footer rose",                          bg:"#FFF7FB", ink:"#2A0A18", accent:"#E1306C" },
  { id:"contact-footer", label:"Contact — Footer",   obj:"Contact",  emoji:"💳", desc:"Footer teal",                          bg:"#0E1B2A", ink:"#EAF2FF", accent:"#2DD4BF" },
  { id:"decouvrir-footer",label:"Découvrir — Footer",obj:"Page",     emoji:"🔗", desc:"Footer or sur fond sombre",            bg:"#0B0805", ink:"#F4E7C4", accent:"#D4AF37" },
  { id:"avis-hero",     label:"Avis — QR géant",    obj:"Avis",     emoji:"⭐", desc:"Minimal, QR dominant",                  bg:"#FFFFFF", ink:"#1A1A1A", accent:"#C0392B" },
  { id:"menu-hero",     label:"Menu — QR géant",    obj:"Menu",     emoji:"🍽️", desc:"Minimal sombre, QR dominant",           bg:"#0E0E0E", ink:"#F5F0E8", accent:"#C9A84C" },
  { id:"reserver-hero", label:"Réservation — QR géant",obj:"Réserver",emoji:"📅",desc:"Minimal, QR dominant",                 bg:"#FFFFFF", ink:"#0F2540", accent:"#0E7A5F" },
  { id:"insta-hero",    label:"Instagram — QR géant",obj:"Abonnés", emoji:"📷", desc:"Minimal, QR dominant",                  bg:"#FFFFFF", ink:"#2A0A18", accent:"#E1306C" },
  { id:"contact-hero",  label:"Contact — QR géant", obj:"Contact",  emoji:"💳", desc:"Minimal sombre, QR dominant",          bg:"#0F1729", ink:"#F1F5FF", accent:"#5B8DEF" },
  { id:"decouvrir-hero",label:"Découvrir — QR géant",obj:"Page",    emoji:"🔗", desc:"Minimal sombre, QR dominant",          bg:"#0B0805", ink:"#F4E7C4", accent:"#D4AF37" },
  { id:"avis-diag",     label:"Avis — Diagonale",   obj:"Avis",     emoji:"⭐", desc:"Bandeau en biais, dynamique",          bg:"#0B0805", ink:"#F4E7C4", accent:"#D4AF37" },
  { id:"menu-diag",     label:"Menu — Diagonale",   obj:"Menu",     emoji:"🍽️", desc:"Bandeau en biais, chaleureux",         bg:"#FFF6EC", ink:"#3A2316", accent:"#C0392B" },
  { id:"reserver-diag", label:"Réservation — Diagonale",obj:"Réserver",emoji:"📅",desc:"Bandeau en biais, vert",            bg:"#06231C", ink:"#EAF7F0", accent:"#34D399" },
  { id:"insta-diag",    label:"Instagram — Diagonale",obj:"Abonnés",emoji:"📷", desc:"Bandeau en biais, rose",              bg:"#1A0A14", ink:"#FFF0F6", accent:"#E1306C" },
  { id:"contact-diag",  label:"Contact — Diagonale",obj:"Contact",  emoji:"💳", desc:"Bandeau en biais, bleu",              bg:"#0F1729", ink:"#F1F5FF", accent:"#5B8DEF" },
  { id:"decouvrir-diag",label:"Découvrir — Diagonale",obj:"Page",   emoji:"🔗", desc:"Bandeau en biais, violet",            bg:"#FFFFFF", ink:"#1A1A1A", accent:"#7C3AED" },
  { id:"avis-ornate",   label:"Avis — Orné",        obj:"Avis",     emoji:"⭐", desc:"Étoiles décoratives, élégant",          bg:"#0B0805", ink:"#F4E7C4", accent:"#D4AF37" },
  { id:"menu-ornate",   label:"Menu — Orné",        obj:"Menu",     emoji:"🍽️", desc:"Ornements dorés",                       bg:"#1A0A14", ink:"#FFF0F6", accent:"#E0B84C" },
  { id:"reserver-ornate",label:"Réservation — Orné",obj:"Réserver", emoji:"📅", desc:"Ornements verts",                       bg:"#06231C", ink:"#EAF7F0", accent:"#34D399" },
  { id:"insta-ornate",  label:"Instagram — Orné",   obj:"Abonnés",  emoji:"📷", desc:"Ornements roses",                       bg:"#15101C", ink:"#FBEAF4", accent:"#E1306C" },
  { id:"contact-ornate",label:"Contact — Orné",     obj:"Contact",  emoji:"💳", desc:"Ornements dorés, royal",               bg:"#0C1A3A", ink:"#F5F8FF", accent:"#D4AF37" },
  { id:"decouvrir-ornate",label:"Découvrir — Orné", obj:"Page",     emoji:"🔗", desc:"Ornements dorés, crème",               bg:"#FBF6EC", ink:"#2A2419", accent:"#B8860B" },
]

// Mini-apercu schematique d'un modele (fond + couleurs + disposition)
function tplThumb(t: { id: string; bg: string; ink: string; accent: string }) {
  const isMenu = t.id.startsWith("menu") || t.id.endsWith("-band")
  const isContact = t.id === "contact" || t.id === "contact-clair"
  const isAvis = t.id.startsWith("avis") && !t.id.endsWith("-band")
  const isFrame = t.id.endsWith("-frame")
  const isFooter = t.id.endsWith("-footer")
  const isHero = t.id.endsWith("-hero")
  const isDiag = t.id.endsWith("-diag")
  const isOrnate = t.id.endsWith("-ornate")
  const starClip = "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 4", background: t.bg, borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", gap: "6%", padding: isMenu ? "0 10% 12%" : "13% 10%", boxSizing: "border-box" }}>
      {isFrame && <div style={{ position: "absolute", inset: "7%", border: `1.5px solid ${t.accent}`, borderRadius: 4, pointerEvents: "none" }} />}
      {isDiag && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "32%", background: t.accent, clipPath: "polygon(0 0,100% 0,100% 55%,0 100%)" }} />}
      {isOrnate && <><div style={{ position: "absolute", top: "9%", left: "12%", width: "11%", aspectRatio: "1", background: t.accent, clipPath: starClip }} /><div style={{ position: "absolute", bottom: "9%", right: "12%", width: "9%", aspectRatio: "1", background: t.accent, clipPath: starClip }} /></>}
      {isMenu && <div style={{ width: "100%", height: "18%", background: t.accent, marginBottom: "8%" }} />}
      <div style={{ width: "68%", height: 5, borderRadius: 3, background: t.ink, opacity: 0.92 }} />
      {isAvis ? (
        <div style={{ display: "flex", gap: "4%", width: "52%", justifyContent: "center" }}>
          {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ width: "13%", aspectRatio: "1", background: t.accent, clipPath: starClip }} />)}
        </div>
      ) : (
        <div style={{ width: "38%", height: 4, borderRadius: 2, background: t.accent }} />
      )}
      <div style={{ width: isHero ? "66%" : "44%", aspectRatio: "1", background: "#fff", borderRadius: 3, marginTop: "2%" }} />
      {isContact ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "72%", alignItems: "center", marginTop: "5%" }}>
          <div style={{ width: "82%", height: 3, borderRadius: 2, background: t.ink, opacity: 0.7 }} />
          <div style={{ width: "64%", height: 3, borderRadius: 2, background: t.ink, opacity: 0.7 }} />
        </div>
      ) : isFooter ? null : (
        <div style={{ width: "56%", height: 8, borderRadius: 5, background: t.accent, marginTop: "6%" }} />
      )}
      {isFooter && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "20%", background: t.accent }} />}
    </div>
  )
}

// Palette de couleurs rapides (pastilles cliquables)
const SWATCHES = ["#C9A84C", "#0A0A0A", "#FFFFFF", "#F5F0E8", "#8A8478", "#C0392B", "#EA580C", "#E0B84C", "#16A34A", "#0E7490", "#1D4ED8", "#7C3AED", "#E1306C", "#6B3F2A"]

// Fonds prets a l'emploi (couleurs unies + degrades) — galerie visible
const BG_PRESETS: { id: string; type: "solid" | "grad"; c1: string; c2?: string }[] = [
  { id: "white",   type: "solid", c1: "#FFFFFF" },
  { id: "cream",   type: "solid", c1: "#F6F1E7" },
  { id: "sand",    type: "solid", c1: "#EFE7D8" },
  { id: "rose",    type: "solid", c1: "#FBEEF0" },
  { id: "mint",    type: "solid", c1: "#E7F4EC" },
  { id: "sky",     type: "solid", c1: "#E7F0FA" },
  { id: "black",   type: "solid", c1: "#0A0A0A" },
  { id: "dark",    type: "solid", c1: "#101010" },
  { id: "navy",    type: "solid", c1: "#0F1729" },
  { id: "emerald", type: "solid", c1: "#06231C" },
  { id: "wine",    type: "solid", c1: "#1A0A14" },
  { id: "plum",    type: "solid", c1: "#1A0F2E" },
  { id: "gold",    type: "grad",  c1: "#1A1206", c2: "#0A0703" },
  { id: "sunset",  type: "grad",  c1: "#FF7E5F", c2: "#FEB47B" },
  { id: "ocean",   type: "grad",  c1: "#2193B0", c2: "#6DD5ED" },
  { id: "purple",  type: "grad",  c1: "#41295A", c2: "#2F0743" },
  { id: "night",   type: "grad",  c1: "#0F2027", c2: "#203A43" },
  { id: "peach",   type: "grad",  c1: "#FFF1EB", c2: "#ACE0F9" },
  { id: "roseg",   type: "grad",  c1: "#FFF5F8", c2: "#F7C5D6" },
  { id: "charcoal",type: "grad",  c1: "#3A3D40", c2: "#181A1B" },
  { id: "teal",    type: "solid", c1: "#0B3A3A" },
  { id: "terra",   type: "solid", c1: "#7A2E1E" },
  { id: "slate",   type: "solid", c1: "#1E232B" },
  { id: "blush",   type: "solid", c1: "#F7E9E4" },
  { id: "goldrich",type: "grad",  c1: "#D4AF37", c2: "#8A6E2F" },
  { id: "fire",    type: "grad",  c1: "#F83600", c2: "#FE8C00" },
  { id: "forest",  type: "grad",  c1: "#134E5E", c2: "#71B280" },
  { id: "lavender",type: "grad",  c1: "#C9D6FF", c2: "#E2E2F0" },
  { id: "midnight",type: "grad",  c1: "#0F2027", c2: "#2C5364" },
  { id: "candy",   type: "grad",  c1: "#FF6FD8", c2: "#3813C2" },
  { id: "coral",   type: "grad",  c1: "#FF512F", c2: "#DD2476" },
  { id: "lime",    type: "grad",  c1: "#56AB2F", c2: "#A8E063" },
  { id: "steel",   type: "grad",  c1: "#485563", c2: "#29323C" },
  { id: "cream2",  type: "solid", c1: "#F3E9DC" },
]

// Styles globaux : un clic recolore + retypographie tout le design
const GLOBAL_STYLES: { id: string; label: string; bg: string; ink: string; accent: string; titleFont: string; bodyFont: string }[] = [
  { id: "luxgold",     label: "Luxury Gold",      bg: "#0B0805", ink: "#F4E7C4", accent: "#D4AF37", titleFont: "Cormorant Garamond", bodyFont: "Montserrat" },
  { id: "modernblack", label: "Modern Black",     bg: "#0E0E10", ink: "#FFFFFF", accent: "#FFFFFF", titleFont: "Bebas Neue",         bodyFont: "Montserrat" },
  { id: "restofresh",  label: "Restaurant Fresh", bg: "#FFF8EE", ink: "#2A2419", accent: "#C0392B", titleFont: "Playfair Display",   bodyFont: "Poppins" },
  { id: "corporate",   label: "Corporate Blue",   bg: "#F4F8FC", ink: "#0F2540", accent: "#1D4ED8", titleFont: "Montserrat",         bodyFont: "Arial" },
  { id: "neon",        label: "Neon Creator",     bg: "#0A0A14", ink: "#EAEAFF", accent: "#FF3D9A", titleFont: "Bebas Neue",         bodyFont: "Poppins" },
  { id: "minimal",     label: "Minimal White",    bg: "#FFFFFF", ink: "#1A1A1A", accent: "#1A1A1A", titleFont: "Raleway",            bodyFont: "Arial" },
  { id: "premiumdark", label: "Premium Dark",     bg: "#101010", ink: "#F5F0E8", accent: "#C9A84C", titleFont: "Cormorant Garamond", bodyFont: "Montserrat" },
]

// Generateur par metier : metier -> objectifs (template + style + textes pre-remplis)
type MObj = { label: string; tpl: string; title: string; subtitle: string; cta: string }
const METIERS: { id: string; label: string; emoji: string; style: string; objs: MObj[] }[] = [
  { id: "resto", label: "Restaurant", emoji: "🍽️", style: "restofresh", objs: [
    { label: "Voir le menu", tpl: "menu", title: "Notre Carte", subtitle: "Scannez pour découvrir nos plats", cta: "Voir le menu" },
    { label: "Réserver une table", tpl: "reserver", title: "Réservez votre table", subtitle: "En quelques secondes", cta: "Réserver" },
    { label: "Laisser un avis", tpl: "avis-clair", title: "Vous avez aimé ?", subtitle: "Laissez-nous un avis en 30 s", cta: "Donner mon avis" },
    { label: "Suivre Instagram", tpl: "insta", title: "Suivez-nous", subtitle: "@votrecompte", cta: "Nous suivre" },
  ] },
  { id: "bar", label: "Bar", emoji: "🍸", style: "neon", objs: [
    { label: "Voir la carte", tpl: "menu", title: "La Carte", subtitle: "Cocktails & boissons", cta: "Voir la carte" },
    { label: "Instagram", tpl: "insta", title: "Suivez le bar", subtitle: "@votrecompte", cta: "Nous suivre" },
    { label: "Laisser un avis", tpl: "avis-or", title: "Bonne soirée ?", subtitle: "Laissez un avis", cta: "Donner mon avis" },
  ] },
  { id: "commerce", label: "Commerce", emoji: "🛍️", style: "corporate", objs: [
    { label: "Laisser un avis", tpl: "avis-clair", title: "Votre avis compte", subtitle: "30 secondes suffisent", cta: "Donner mon avis" },
    { label: "Voir le catalogue", tpl: "decouvrir", title: "Notre catalogue", subtitle: "Découvrez nos produits", cta: "Voir le catalogue" },
    { label: "Obtenir une réduction", tpl: "decouvrir", title: "Votre réduction", subtitle: "Scannez pour en profiter", cta: "J'en profite" },
    { label: "Programme fidélité", tpl: "decouvrir", title: "Programme fidélité", subtitle: "Rejoignez le programme", cta: "M'inscrire" },
  ] },
  { id: "immo", label: "Immobilier", emoji: "🏠", style: "premiumdark", objs: [
    { label: "Visite virtuelle", tpl: "decouvrir", title: "Visite virtuelle", subtitle: "Découvrez ce bien", cta: "Voir le bien" },
    { label: "Me contacter", tpl: "contact", title: "Votre conseiller", subtitle: "Agent immobilier", cta: "Me contacter" },
    { label: "Estimer un bien", tpl: "decouvrir", title: "Estimation gratuite", subtitle: "En 2 minutes", cta: "Estimer mon bien" },
  ] },
  { id: "airbnb", label: "Airbnb", emoji: "🛏️", style: "minimal", objs: [
    { label: "Guide du logement", tpl: "decouvrir", title: "Bienvenue !", subtitle: "Le guide du logement", cta: "Voir le guide" },
    { label: "Laisser un avis", tpl: "avis-clair", title: "Bon séjour ?", subtitle: "Laissez un avis", cta: "Donner mon avis" },
    { label: "Wifi & infos", tpl: "decouvrir", title: "Infos pratiques", subtitle: "Wifi, check-out, contacts…", cta: "Voir les infos" },
  ] },
  { id: "event", label: "Événement", emoji: "🎉", style: "modernblack", objs: [
    { label: "Le programme", tpl: "decouvrir", title: "Le programme", subtitle: "Toutes les infos", cta: "Voir le programme" },
    { label: "Billetterie", tpl: "decouvrir", title: "Réservez vos places", subtitle: "Billetterie en ligne", cta: "Réserver" },
    { label: "Instagram", tpl: "insta", title: "Suivez l'événement", subtitle: "@votrecompte", cta: "Nous suivre" },
  ] },
  { id: "createur", label: "Créateur", emoji: "🎬", style: "neon", objs: [
    { label: "Mes réseaux", tpl: "insta", title: "Suivez-moi", subtitle: "@votrecompte", cta: "Me suivre" },
    { label: "Tous mes liens", tpl: "decouvrir", title: "Tous mes liens", subtitle: "Retrouvez-moi ici", cta: "Découvrir" },
  ] },
  { id: "coach", label: "Coach", emoji: "💪", style: "corporate", objs: [
    { label: "Prendre RDV", tpl: "reserver", title: "Réservez une séance", subtitle: "En quelques clics", cta: "Prendre RDV" },
    { label: "Me contacter", tpl: "contact", title: "Votre coach", subtitle: "Coach certifié", cta: "Me contacter" },
    { label: "Mes offres", tpl: "decouvrir", title: "Mes programmes", subtitle: "Découvrez mes offres", cta: "Voir les offres" },
  ] },
  { id: "artisan", label: "Artisan", emoji: "🔨", style: "premiumdark", objs: [
    { label: "Devis gratuit", tpl: "decouvrir", title: "Devis gratuit", subtitle: "Réponse rapide", cta: "Demander un devis" },
    { label: "Me contacter", tpl: "contact", title: "Votre artisan", subtitle: "Savoir-faire local", cta: "Me contacter" },
    { label: "Mes réalisations", tpl: "decouvrir", title: "Mes réalisations", subtitle: "Découvrez mon travail", cta: "Voir le portfolio" },
  ] },
  { id: "asso", label: "Association", emoji: "🤝", style: "corporate", objs: [
    { label: "Faire un don", tpl: "decouvrir", title: "Soutenez-nous", subtitle: "Chaque don compte", cta: "Faire un don" },
    { label: "Adhérer", tpl: "decouvrir", title: "Rejoignez-nous", subtitle: "Devenez membre", cta: "Adhérer" },
    { label: "Nos actions", tpl: "decouvrir", title: "Nos actions", subtitle: "Découvrez nos projets", cta: "En savoir plus" },
  ] },
]

export default function PrintStudio({ qrId, qrDataUrl, userPlan, onClose, onUpsell, prefill }: Props) {
  const elRef   = useRef<HTMLCanvasElement>(null)
  const fcRef   = useRef<fabric.Canvas | null>(null)
  const qrUrlRef = useRef(qrDataUrl)
  const vGuideRef = useRef<fabric.Line | null>(null)
  const hGuideRef = useRef<fabric.Line | null>(null)
  const clipRef = useRef<fabric.Object | null>(null) // presse-papier (copier/coller)
  const histRef = useRef<{ stack: string[]; i: number; lock: boolean }>({ stack: [], i: -1, lock: false })
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dragIdxRef = useRef<number | null>(null) // index du calque en cours de glissement
  const scrollRef = useRef<HTMLDivElement>(null) // zone scrollable autour du canvas
  const fileRef = useRef<HTMLInputElement>(null) // import d'image / logo

  const [format, setFormat]   = useState<FormatId>("a4")
  const [sel, setSel]         = useState<SelState>(null)
  const [bgColor, setBgColor] = useState(CANVAS_BG_DEFAULT)
  const [bgGrad, setBgGrad]   = useState(false)
  const [bgC2, setBgC2]       = useState("#0A0A0A")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [exporting, setExporting] = useState(false)
  const [expOpen, setExpOpen] = useState(false)
  const [expDpi, setExpDpi]   = useState(300)
  const [expMarks, setExpMarks] = useState(false)
  const [mockOpen, setMockOpen] = useState(false)
  const [mockEnv, setMockEnv] = useState<"wall" | "table" | "window" | "desk" | "cadre" | "counter">("wall")
  const [mockUrl, setMockUrl] = useState("")
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null) // menu clic-droit
  const [showAdvanced, setShowAdvanced] = useState(false) // panneau de reglages avances (progressive disclosure)
  const [libOpen, setLibOpen] = useState(false)
  const [libCat, setLibCat]   = useState<"text" | "shapes" | "lines" | "frames" | "cta" | "icons" | "badges" | "arrows" | "deco">("text")
  const [tplOpen, setTplOpen] = useState(false)
  const [tplSearch, setTplSearch] = useState("")
  const [showHelp, setShowHelp] = useState(false)
  const [hintOff, setHintOff] = useState(false)
  const [histVer, setHistVer] = useState(0) // force le rafraichissement des boutons undo/redo
  const [layersVer, setLayersVer] = useState(0) // force le rafraichissement de la liste des calques
  const [dragOver, setDragOver] = useState<number | null>(null) // ligne survolee pendant un glisser
  const [editLayer, setEditLayer] = useState<number | null>(null) // index du calque en cours de renommage
  const [zoom, setZoom] = useState(1)
  const [wizard, setWizard] = useState(0) // 0 = ferme, 1 = objectif, 2 = style, 3 = pret
  const [wizMetier, setWizMetier] = useState("")
  const [infoVer, setInfoVer] = useState(0) // rafraichit le panneau infos
  const [side, setSide] = useState<"" | "layers" | "bg" | "styles">("") // panneaux gauche Calques / Fond / Styles

  const isPro = userPlan === "pro" || userPlan === "business"

  // ---- Lecture d'un objet -> etat de selection -----------------------------
  const readSel = useCallback((o: fabric.Object | undefined | null): SelState => {
    if (!o) return null
    const isText = o.type === "i-text" || o.type === "text" || o.type === "textbox"
    const isGroup = o.type === "group"
    const t = o as any
    const txtChild = groupText(o)
    // Pour un groupe, la "couleur" affichee = celle de la 1re forme (non-texte)
    let fill = typeof o.fill === "string" ? o.fill : "#C9A84C"
    if (isGroup) {
      const shape = (o as fabric.Group).getObjects().find(c => c.type !== "text" && c.type !== "i-text" && c.type !== "textbox")
      if (shape && typeof shape.fill === "string") fill = shape.fill
    }
    return {
      isText,
      fill,
      opacity: o.opacity ?? 1,
      fontFamily: isText ? (t.fontFamily ?? "Georgia") : "Georgia",
      fontSize: isText ? (t.fontSize ?? 40) : 40,
      bold: isText ? (t.fontWeight === "bold" || t.fontWeight === 700) : false,
      italic: isText ? (t.fontStyle === "italic") : false,
      underline: isText ? !!t.underline : false,
      locked: !!o.lockMovementX,
      label: txtChild?.text ?? null,
      isGroup,
      textFill: txtChild && typeof txtChild.fill === "string" ? txtChild.fill : null,
      shadow: !!o.shadow,
      shadowBlur: o.shadow ? ((o.shadow as fabric.Shadow).blur ?? 18) : 18,
      textAlign: isText ? (t.textAlign ?? "left") : "left",
      charSpacing: isText ? (t.charSpacing ?? 0) : 0,
      lineHeight: isText ? (t.lineHeight ?? 1.16) : 1.16,
      border: !!o.stroke && (o.strokeWidth ?? 0) > 0,
      strokeColor: typeof o.stroke === "string" ? o.stroke : G,
      strokeWidth: o.strokeWidth ?? 0,
      radius: o.type === "rect" ? ((o as fabric.Rect).rx ?? 0) : null,
      isGroupObj: o.type === "group",
      multi: o.type === "activeSelection",
    }
  }, [])

  const refreshSel = useCallback(() => {
    const fc = fcRef.current
    setSel(readSel(fc?.getActiveObject()))
  }, [readSel])

  // ---- Centrer un objet ----------------------------------------------------
  const centerObj = useCallback((o: fabric.Object) => {
    const fc = fcRef.current; if (!fc) return
    fc.add(o)
    fc.viewportCenterObject(o)
    fc.setActiveObject(o)
    fc.requestRenderAll()
    refreshSel()
  }, [refreshSel])

  // ---- Historique (undo / redo) --------------------------------------------
  // Snapshot du canvas en JSON (guides exclus). Le verrou evite que la
  // restauration (loadFromJSON) ne reempile des etats.
  const snapshot = (fc: fabric.Canvas): string => {
    const json = fc.toJSON([...TOJSON_PROPS, "isGuide"]) as { objects?: { isGuide?: boolean }[] }
    json.objects = (json.objects ?? []).filter(o => !o.isGuide)
    return JSON.stringify(json)
  }
  const pushHistory = () => {
    const fc = fcRef.current, h = histRef.current
    if (!fc || h.lock) return
    h.stack = h.stack.slice(0, h.i + 1)
    h.stack.push(snapshot(fc))
    if (h.stack.length > 60) h.stack.shift()
    h.i = h.stack.length - 1
    setHistVer(v => v + 1)
  }
  const pushHistorySoon = () => {
    if (histRef.current.lock) return
    clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(pushHistory, 350)
  }
  const restoreHistory = (s: string) => {
    const fc = fcRef.current; if (!fc) return
    histRef.current.lock = true
    fc.loadFromJSON(JSON.parse(s), () => {
      const vG = vGuideRef.current, hG = hGuideRef.current
      if (vG) fc.add(vG)
      if (hG) fc.add(hG)
      syncBgFromCanvas(fc)
      fc.discardActiveObject(); fc.requestRenderAll()
      histRef.current.lock = false
      setSel(null)
    })
  }
  const undo = () => {
    const h = histRef.current
    if (h.i <= 0) return
    h.i--; restoreHistory(h.stack[h.i]); setHistVer(v => v + 1)
  }
  const redo = () => {
    const h = histRef.current
    if (h.i >= h.stack.length - 1) return
    h.i++; restoreHistory(h.stack[h.i]); setHistVer(v => v + 1)
  }

  // ---- Init Fabric (une seule fois) ---------------------------------------
  useEffect(() => {
    if (!elRef.current) return
    const { w, h } = editDims("a4")
    const fc = new fabric.Canvas(elRef.current, {
      width: w,
      height: h,
      backgroundColor: CANVAS_BG_DEFAULT,
      preserveObjectStacking: true,
    })
    fcRef.current = fc

    // Guides de centrage (dores), exclus de l'export
    const guideOpts = {
      stroke: G, strokeWidth: 1, selectable: false, evented: false,
      excludeFromExport: true, visible: false,
    }
    const vG = new fabric.Line([0, 0, 0, 0], guideOpts)
    const hG = new fabric.Line([0, 0, 0, 0], guideOpts)
    ;(vG as any).isGuide = true; (hG as any).isGuide = true
    fc.add(vG); fc.add(hG)
    vGuideRef.current = vG; hGuideRef.current = hG

    // Snap au centre + guides (dimensions en coords design = element / zoom)
    // Guides magnetiques : centre/bords du support + bords/centres des autres objets
    fc.on("object:moving", (e) => {
      const o = e.target; if (!o) return
      const z = fc.getZoom() || 1
      const cw = fc.getWidth() / z, ch = fc.getHeight() / z
      const snap = 7
      const b = o.getBoundingRect(true)
      const ax = [b.left, b.left + b.width / 2, b.left + b.width]
      const ay = [b.top, b.top + b.height / 2, b.top + b.height]
      const xs = [0, cw / 2, cw], ys = [0, ch / 2, ch]
      fc.getObjects().forEach(t => {
        if (t === o || (t as any).isGuide) return
        const r = t.getBoundingRect(true)
        xs.push(r.left, r.left + r.width / 2, r.left + r.width)
        ys.push(r.top, r.top + r.height / 2, r.top + r.height)
      })
      let dx: number | null = null, dxBest = snap, gx = 0
      for (const a of ax) for (const c of xs) { const d = Math.abs(a - c); if (d < dxBest) { dxBest = d; dx = c - a; gx = c } }
      let dy: number | null = null, dyBest = snap, gy = 0
      for (const a of ay) for (const c of ys) { const d = Math.abs(a - c); if (d < dyBest) { dyBest = d; dy = c - a; gy = c } }
      if (dx !== null) { o.set("left", (o.left ?? 0) + dx); vG.set({ x1: gx, y1: 0, x2: gx, y2: ch, visible: true }) } else vG.set({ visible: false })
      if (dy !== null) { o.set("top", (o.top ?? 0) + dy); hG.set({ x1: 0, y1: gy, x2: cw, y2: gy, visible: true }) } else hG.set({ visible: false })
      o.setCoords()
      fc.bringToFront(vG); fc.bringToFront(hG)
    })
    fc.on("object:modified", () => { vG.set({ visible: false }); hG.set({ visible: false }); fc.requestRenderAll() })
    fc.on("mouse:up",       () => { vG.set({ visible: false }); hG.set({ visible: false }); fc.requestRenderAll() })

    fc.on("selection:created", () => { refreshSel(); setShowAdvanced(false) })
    fc.on("selection:updated", () => { refreshSel(); setShowAdvanced(false) })
    fc.on("selection:cleared", () => { setSel(null); setShowAdvanced(false) })

    // Double-clic sur une zone vide = ajouter un texte (reflexe type Canva)
    fc.on("mouse:dblclick", (e) => {
      if (e.target) return
      const p = (e as any).absolutePointer || fc.getPointer(e.e)
      const t = new fabric.IText("Votre texte", { left: p.x, top: p.y, originX: "center", originY: "center", fontFamily: "Georgia", fontWeight: "bold", fontSize: 38, fill: INK })
      fc.add(t); fc.setActiveObject(t)
      t.enterEditing(); t.selectAll()
      fc.requestRenderAll(); refreshSel()
    })

    // Historique : capter ajout / suppression / modification (drag, scale, rotate)
    fc.on("object:added", () => { pushHistory(); setLayersVer(v => v + 1) })
    fc.on("object:removed", () => { pushHistory(); setLayersVer(v => v + 1) })
    fc.on("object:modified", pushHistory)

    // ---- Chargement du design existant ou QR initial ----------------------
    ;(async () => {
      try {
        const res = await fetch(`/api/print-design?qr_id=${encodeURIComponent(qrId)}`)
        const json = res.ok ? await res.json() : null
        if (json?.format && (json.format in FORMATS)) {
          setFormat(json.format)
          const d = editDims(json.format)
          fc.setDimensions({ width: d.w, height: d.h })
        }
        if (json?.design) {
          histRef.current.lock = true // ne pas empiler pendant le chargement
          fc.loadFromJSON(json.design, () => {
            // remettre les guides au-dessus apres rechargement
            fc.add(vG); fc.add(hG)
            syncBgFromCanvas(fc)
            fc.requestRenderAll()
            histRef.current.lock = false
            pushHistory() // etat initial = design charge
            setLoading(false)
          })
          return
        }
      } catch { /* pas de design : on pose le QR */ }
      // Aucun design sauvegarde -> poser le vrai QR au centre + ouvrir la galerie de modeles
      placeQr(fc)
      setLoading(false)
      setTplOpen(true)
    })()

    return () => { fc.dispose(); fcRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Maj de la ref qrDataUrl + regeneration du QR present ----------------
  useEffect(() => {
    qrUrlRef.current = qrDataUrl
    const fc = fcRef.current; if (!fc) return
    const existing = fc.getObjects().find(o => (o as any).isQR) as fabric.Image | undefined
    if (existing) {
      fabric.Image.fromURL(qrDataUrl, (img) => {
        existing.setElement((img as any).getElement())
        fc.requestRenderAll()
      })
    }
  }, [qrDataUrl])

  // ---- Raccourcis clavier (supprimer, copier/coller, dupliquer, deplacer) --
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
    }
    // Clone + ajoute au canvas, decale et selectionne
    const dropClone = (fc: fabric.Canvas, src: fabric.Object, dx: number, dy: number) => {
      src.clone((c: fabric.Object) => {
        c.set({ left: (src.left ?? 0) + dx, top: (src.top ?? 0) + dy })
        ;(c as any).isQR = (src as any).isQR
        fc.add(c); fc.setActiveObject(c); fc.requestRenderAll(); refreshSel()
      }, TOJSON_PROPS)
    }
    const onKey = (e: KeyboardEvent) => {
      const fc = fcRef.current; if (!fc) return
      const o = fc.getActiveObject()
      if (isTyping() || (o as any)?.isEditing) return // ne pas gener la saisie de texte
      const meta = e.ctrlKey || e.metaKey

      if (e.key === "Delete" || e.key === "Backspace") {
        const objs = fc.getActiveObjects() // gere la selection multiple
        if (!objs.length) return
        e.preventDefault(); objs.forEach(x => fc.remove(x)); fc.discardActiveObject(); fc.requestRenderAll(); setSel(null)
      } else if (e.key === "Escape") {
        fc.discardActiveObject(); fc.requestRenderAll(); setSel(null)
      } else if (meta && (e.key === "c" || e.key === "C")) {
        if (!o) return
        e.preventDefault(); o.clone((c: fabric.Object) => { clipRef.current = c }, TOJSON_PROPS)
      } else if (meta && (e.key === "v" || e.key === "V")) {
        if (!clipRef.current) return
        e.preventDefault(); dropClone(fc, clipRef.current, 24, 24)
      } else if (meta && (e.key === "d" || e.key === "D")) {
        if (!o) return
        e.preventDefault(); dropClone(fc, o, 24, 24)
      } else if (meta && (e.key === "z" || e.key === "Z")) {
        e.preventDefault(); if (e.shiftKey) redo(); else undo()
      } else if (meta && (e.key === "y" || e.key === "Y")) {
        e.preventDefault(); redo()
      } else if (meta && (e.key === "a" || e.key === "A")) {
        e.preventDefault(); selectAll()
      } else if (meta && e.shiftKey && (e.key === "g" || e.key === "G")) {
        e.preventDefault(); ungroupSel()
      } else if (meta && (e.key === "g" || e.key === "G")) {
        e.preventDefault(); groupSel()
      } else if (meta && (e.key === "+" || e.key === "=")) {
        e.preventDefault(); applyZoom((fcRef.current?.getZoom() || 1) * 1.25)
      } else if (meta && e.key === "-") {
        e.preventDefault(); applyZoom((fcRef.current?.getZoom() || 1) / 1.25)
      } else if (meta && e.key === "0") {
        e.preventDefault(); applyZoom(1)
      } else if (o && e.key.startsWith("Arrow")) {
        e.preventDefault()
        const s = e.shiftKey ? 10 : 1
        if (e.key === "ArrowLeft")  o.set("left", (o.left ?? 0) - s)
        if (e.key === "ArrowRight") o.set("left", (o.left ?? 0) + s)
        if (e.key === "ArrowUp")    o.set("top",  (o.top  ?? 0) - s)
        if (e.key === "ArrowDown")  o.set("top",  (o.top  ?? 0) + s)
        o.setCoords(); fc.requestRenderAll(); pushHistorySoon()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [refreshSel])

  // ---- Zoom a la molette (Ctrl/Cmd + molette), centre sur le curseur -------
  useEffect(() => {
    const cont = scrollRef.current; if (!cont) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return // sinon : scroll normal
      e.preventDefault()
      const fc = fcRef.current, canvas = elRef.current; if (!fc || !canvas) return
      const r0 = canvas.getBoundingClientRect()
      const fx = (e.clientX - r0.left) / r0.width   // fraction design sous le curseur
      const fy = (e.clientY - r0.top) / r0.height
      applyZoom((fc.getZoom() || 1) * (e.deltaY < 0 ? 1.1 : 1 / 1.1))
      // garder le point sous le curseur en compensant via le scroll
      const r1 = canvas.getBoundingClientRect()
      cont.scrollLeft += (r1.left + fx * r1.width) - e.clientX
      cont.scrollTop += (r1.top + fy * r1.height) - e.clientY
    }
    cont.addEventListener("wheel", onWheel, { passive: false })
    return () => cont.removeEventListener("wheel", onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Polices Google (injecter le lien si absent) -------------------------
  useEffect(() => {
    const id = "qrfolio-print-fonts"
    if (typeof document === "undefined" || document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id; link.rel = "stylesheet"
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@500;700&family=Lora:wght@400;700&family=Merriweather:wght@400;700&family=Poppins:wght@400;600&family=Montserrat:wght@400;700&family=Raleway:wght@400;600&family=Oswald:wght@400;600&family=Bebas+Neue&family=Abril+Fatface&family=Dancing+Script:wght@700&family=Pacifico&display=swap"
    document.head.appendChild(link)
  }, [])

  // Changer la police d'un texte : charger la fonte puis re-rendre (sinon fallback)
  const setFont = (family: string) => {
    mutate(o => (o as fabric.IText).set("fontFamily", family))
    try {
      const d = document as Document & { fonts?: { load: (f: string) => Promise<unknown> } }
      d.fonts?.load(`700 40px '${family}'`).then(() => fcRef.current?.requestRenderAll()).catch(() => {})
    } catch { /* noop */ }
  }

  // ---- Poser le vrai QR ----------------------------------------------------
  function placeQr(fc: fabric.Canvas) {
    fabric.Image.fromURL(qrUrlRef.current, (img) => {
      const w = Math.round((fc.getWidth() / (fc.getZoom() || 1)) * 0.42)
      img.scaleToWidth(w)
      ;(img as any).isQR = true
      const pad = Math.round(w * 0.07)
      const card = new fabric.Rect({
        width: w + pad * 2, height: w + pad * 2, rx: Math.round(w * 0.06), ry: Math.round(w * 0.06),
        fill: "#FFFFFF", shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.20)", blur: 26, offsetX: 0, offsetY: 10 }),
      })
      ;(card as any).isQrCard = true
      fc.add(card); fc.add(img)
      fc.viewportCenterObject(card); fc.viewportCenterObject(img)
      fc.setActiveObject(img)
      fc.requestRenderAll()
      refreshSel()
    })
  }

  // ---- Outils d'ajout ------------------------------------------------------
  const addQr = () => { const fc = fcRef.current; if (fc) placeQr(fc) }
  // Import d'une image / logo depuis le disque
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // permettre de re-importer le meme fichier
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      fabric.Image.fromURL(String(reader.result), (img) => {
        const fc = fcRef.current; if (!fc) return
        const W = fc.getWidth() / (fc.getZoom() || 1)
        img.scaleToWidth(Math.min(W * 0.6, img.width ?? W * 0.6))
        ;(img as any).name = "Image"
        centerObj(img)
      })
    }
    reader.readAsDataURL(file)
  }

  // ---- Bibliotheque d'elements ---------------------------------------------
  // Icone : SVG mono-path => Fabric renvoie un Path unique (recolorable via panneau)
  const addIcon = (d: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}" fill="${G}"/></svg>`
    fabric.loadSVGFromString(svg, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options) as fabric.Object
      obj.scaleToWidth(110)
      centerObj(obj)
    })
  }
  // Formes decoratives
  const addShape = (k: string) => {
    let o: fabric.Object
    switch (k) {
      case "rrect":   o = new fabric.Rect({ width: 220, height: 130, rx: 18, ry: 18, fill: G }); break
      case "circle":  o = new fabric.Circle({ radius: 75, fill: G }); break
      case "tri":     o = new fabric.Triangle({ width: 160, height: 140, fill: G }); break
      case "star":    o = new fabric.Polygon(starPts(5, 85, 36), { fill: G }); break
      case "hexa":    o = new fabric.Polygon(polyPts(6, 85), { fill: G }); break
      case "diamond": o = new fabric.Polygon(polyPts(4, 90), { fill: G }); break
      case "penta":   o = new fabric.Polygon(polyPts(5, 85), { fill: G }); break
      case "pill":    o = new fabric.Rect({ width: 280, height: 96, rx: 48, ry: 48, fill: G }); break
      case "banner":  o = new fabric.Rect({ width: 300, height: 70, fill: G }); break
      case "octo":    o = new fabric.Polygon(polyPts(8, 85), { fill: G }); break
      case "heart":   o = new fabric.Path("M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z", { fill: G }); o.scaleToWidth(150); break
      case "cross": {
        const a = new fabric.Rect({ width: 44, height: 150, rx: 8, ry: 8, fill: G, left: 53, top: 0 })
        const b = new fabric.Rect({ width: 150, height: 44, rx: 8, ry: 8, fill: G, left: 0, top: 53 })
        o = new fabric.Group([a, b]); break
      }
      case "tag":     o = new fabric.Polygon([{ x: 40, y: 0 }, { x: 230, y: 0 }, { x: 230, y: 120 }, { x: 40, y: 120 }, { x: 0, y: 60 }], { fill: G }); break
      case "bubble": {
        const r = new fabric.Rect({ left: 0, top: 0, width: 210, height: 130, rx: 18, ry: 18, fill: G })
        const tail = new fabric.Polygon([{ x: 0, y: 0 }, { x: 46, y: 0 }, { x: 8, y: 36 }], { fill: G, left: 38, top: 128 })
        o = new fabric.Group([r, tail]); break
      }
      default:        o = new fabric.Rect({ width: 200, height: 120, fill: G })
    }
    centerObj(o)
  }
  // Texte pre-style (titre / sous-titre / corps / impact / manuscrit)
  const addTextPreset = (p: { text: string; size: number; weight: string; font: string }) => {
    centerObj(new fabric.IText(p.text, { fontFamily: p.font, fontWeight: p.weight, fontSize: p.size, fill: INK }))
    try {
      const d = document as Document & { fonts?: { load: (f: string) => Promise<unknown> } }
      d.fonts?.load(`${p.weight} ${p.size}px '${p.font}'`).then(() => fcRef.current?.requestRenderAll()).catch(() => {})
    } catch { /* noop */ }
  }
  // Lignes & separateurs (variantes)
  const addLineVariant = (k: string) => {
    const L = 260
    switch (k) {
      case "thick":  centerObj(new fabric.Line([0, 0, L, 0], { stroke: G, strokeWidth: 10, strokeLineCap: "round" })); break
      case "thin":   centerObj(new fabric.Line([0, 0, L, 0], { stroke: G, strokeWidth: 1.5 })); break
      case "dashed": centerObj(new fabric.Line([0, 0, L, 0], { stroke: G, strokeWidth: 4, strokeDashArray: [14, 9] })); break
      case "dotted": centerObj(new fabric.Line([0, 0, L, 0], { stroke: G, strokeWidth: 6, strokeDashArray: [1, 14], strokeLineCap: "round" })); break
      case "double": {
        const a = new fabric.Line([0, 0, L, 0], { stroke: G, strokeWidth: 2 })
        const b = new fabric.Line([0, 10, L, 10], { stroke: G, strokeWidth: 2 })
        centerObj(new fabric.Group([a, b])); break
      }
      case "ornament": {
        const ln = new fabric.Line([0, 0, L, 0], { stroke: G, strokeWidth: 2, left: 0, top: 0 })
        const dot = new fabric.Polygon(starPts(4, 14, 5), { fill: G, left: L / 2 - 14, top: -14 })
        centerObj(new fabric.Group([ln, dot])); break
      }
      default: centerObj(new fabric.Line([0, 0, L, 0], { stroke: G, strokeWidth: 4 }))
    }
  }
  // Cadres / bordures autour du support (clic inside ignore via perPixelTargetFind)
  const addFrame = (k: string) => {
    const fc = fcRef.current; if (!fc) return
    const z = fc.getZoom() || 1, W = fc.getWidth() / z, H = fc.getHeight() / z
    const m = Math.round(W * 0.05)
    const base = { fill: "transparent", stroke: G, strokeUniform: true, perPixelTargetFind: true } as const
    let o: fabric.Object
    if (k === "double") {
      const r1 = new fabric.Rect({ left: 0, top: 0, width: W - 2 * m, height: H - 2 * m, ...base, strokeWidth: 2 })
      const r2 = new fabric.Rect({ left: 9, top: 9, width: W - 2 * m - 18, height: H - 2 * m - 18, ...base, strokeWidth: 1 })
      o = new fabric.Group([r1, r2], { left: m, top: m })
    } else {
      const sw = k === "thick" ? 8 : 2
      const rx = k === "rounded" ? 26 : 0
      o = new fabric.Rect({ left: m, top: m, width: W - 2 * m, height: H - 2 * m, ...base, strokeWidth: sw, rx, ry: rx })
    }
    ;(o as any).perPixelTargetFind = true
    fc.add(o); fc.setActiveObject(o); fc.requestRenderAll(); refreshSel()
  }
  // Decorations (formes decoratives construites en Fabric)
  const addDeco = (k: string) => {
    let o: fabric.Object
    switch (k) {
      case "sparkle": o = new fabric.Polygon(starPts(4, 80, 22), { fill: G }); break
      case "burst":   o = new fabric.Polygon(starPts(12, 85, 66), { fill: G }); break
      case "ring":    o = new fabric.Circle({ radius: 70, fill: "transparent", stroke: G, strokeWidth: 8, strokeUniform: true }); break
      case "dots": {
        const a: fabric.Object[] = []
        for (let i = 0; i < 5; i++) a.push(new fabric.Circle({ radius: 9, fill: G, left: i * 30, top: 0 }))
        o = new fabric.Group(a); break
      }
      case "wave":
        o = new fabric.Polyline([{ x: 0, y: 14 }, { x: 22, y: 0 }, { x: 44, y: 14 }, { x: 66, y: 0 }, { x: 88, y: 14 }, { x: 110, y: 0 }, { x: 132, y: 14 }],
          { fill: "", stroke: G, strokeWidth: 5, strokeLineCap: "round", strokeLineJoin: "round" }); break
      case "confetti": {
        const a: fabric.Object[] = []
        ;[[0, 0, 15], [40, 12, -20], [82, 2, 30], [22, 44, 40], [72, 48, -15], [114, 26, 10], [126, 64, -30]]
          .forEach(([x, y, ang]) => a.push(new fabric.Rect({ left: x, top: y, width: 10, height: 22, rx: 3, ry: 3, fill: G, angle: ang })))
        o = new fabric.Group(a); break
      }
      case "stars3": {
        const a: fabric.Object[] = []
        ;[[0, 22, 20], [44, 0, 28], [88, 26, 17]].forEach(([x, y, s]) => a.push(new fabric.Polygon(starPts(5, s, s * 0.42), { fill: G, left: x, top: y })))
        o = new fabric.Group(a); break
      }
      case "dotgrid": {
        const a: fabric.Object[] = []
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) a.push(new fabric.Circle({ radius: 6, fill: G, left: c * 28, top: r * 28 }))
        o = new fabric.Group(a); break
      }
      case "chevrons": {
        const a: fabric.Object[] = []
        for (let i = 0; i < 3; i++) a.push(new fabric.Polyline([{ x: 0, y: 0 }, { x: 18, y: 16 }, { x: 0, y: 32 }], { fill: "", stroke: G, strokeWidth: 5, strokeLineCap: "round", strokeLineJoin: "round", left: i * 20, top: 0 }))
        o = new fabric.Group(a); break
      }
      case "corners": {
        const W = 200, H = 140, t = 6, l = 38
        const r = (x: number, y: number, w: number, h: number) => new fabric.Rect({ left: x, top: y, width: w, height: h, fill: G })
        o = new fabric.Group([
          r(0, 0, l, t), r(0, 0, t, l),                 // haut gauche
          r(W - l, 0, l, t), r(W - t, 0, t, l),          // haut droite
          r(0, H - t, l, t), r(0, H - l, t, l),          // bas gauche
          r(W - l, H - t, l, t), r(W - t, H - l, t, l),  // bas droite
        ]); break
      }
      case "swoosh": o = new fabric.Path("M0 22 Q 75 -8 150 16", { fill: "", stroke: G, strokeWidth: 7, strokeLineCap: "round" }); break
      default: o = new fabric.Polygon(starPts(4, 80, 22), { fill: G })
    }
    centerObj(o)
  }
  // Ouvrir la bibliotheque sur un onglet donne (depuis le rail)
  const openLib = (c: typeof libCat) => {
    setLibCat(c); setLibOpen(true); setTplOpen(false); setSide("")
    setTimeout(() => document.getElementById("lib-" + c)?.scrollIntoView({ behavior: "smooth", block: "start" }), 70)
  }
  // Ouvrir / fermer un panneau lateral (calques / fond)
  const openSide = (s: "layers" | "bg" | "styles") => { setSide(prev => prev === s ? "" : s); setLibOpen(false); setTplOpen(false) }
  // Bouton CTA (pilule dimensionnee au texte)
  const addCTA = (label: string) => {
    centerObj(buildPill(label, { rectFill: G, textFill: "#080808", height: 80, fontSize: 30 }))
  }
  // Badge rond (sceau cranté) ou ruban (fanion)
  const addBadge = (label: string, kind: "seal" | "ribbon") => {
    if (kind === "seal") {
      const burst = new fabric.Polygon(starPts(16, 95, 80), { fill: G })
      const txt   = new fabric.Text(label, { fontSize: 26, fontFamily: "DM Sans", fontWeight: "bold", fill: "#080808", originX: "center", originY: "center", left: 95, top: 95 })
      centerObj(new fabric.Group([burst, txt]))
    } else {
      const W = 300, H = 74, N = 30
      const ribbon = new fabric.Polygon([
        { x: 0, y: 0 }, { x: W, y: 0 }, { x: W - N, y: H / 2 }, { x: W, y: H }, { x: 0, y: H }, { x: N, y: H / 2 },
      ], { fill: G })
      const txt = new fabric.Text(label, { fontSize: 28, fontFamily: "DM Sans", fontWeight: "bold", fill: "#080808", originX: "center", originY: "center", left: W / 2, top: H / 2 })
      centerObj(new fabric.Group([ribbon, txt]))
    }
  }
  // Fleche (polygone), pointant vers la droite par defaut + rotation
  const addArrow = (angle: number) => {
    const w = 230, h = 130
    const pts = [
      { x: 0, y: h * 0.3 }, { x: w * 0.6, y: h * 0.3 }, { x: w * 0.6, y: 0 }, { x: w, y: h * 0.5 },
      { x: w * 0.6, y: h }, { x: w * 0.6, y: h * 0.7 }, { x: 0, y: h * 0.7 },
    ]
    centerObj(new fabric.Polygon(pts, { fill: G, angle }))
  }

  // ---- Mutation de l'objet actif -------------------------------------------
  const mutate = (fn: (o: fabric.Object) => void) => {
    const fc = fcRef.current; if (!fc) return
    const o = fc.getActiveObject(); if (!o) return
    fn(o)
    fc.requestRenderAll()
    refreshSel()
    pushHistorySoon()
  }

  // Changer le libelle d'un groupe CTA / badge (texte interne) + ajuster la pilule
  const setLabel = (value: string) => {
    const fc = fcRef.current; if (!fc) return
    const grp = fc.getActiveObject() as fabric.Group | undefined
    const txt = groupText(grp)
    if (!grp || !txt) return
    txt.set({ text: value })
    ;(txt as unknown as { initDimensions?: () => void }).initDimensions?.()
    // Pilule (rect arrondi + texte) : ajuster la largeur au texte, garder centre
    const kids = grp.getObjects()
    const rect = kids.find(o => o.type === "rect") as fabric.Rect | undefined
    if (rect && kids.length === 2) {
      const h = rect.height ?? 60
      const newW = Math.max(h * 2, (txt.width ?? 0) + h * 0.6 * 2)
      rect.set({ width: newW, left: -newW / 2 })
      txt.set({ left: 0 })
      grp.set({ width: newW })
    }
    grp.dirty = true
    grp.setCoords()
    fc.requestRenderAll()
    refreshSel()
    pushHistorySoon()
  }

  // Couleur : recolore les formes (non-texte) d'un groupe, ou l'objet simple
  const setFill = (color: string) => mutate(o => {
    if (o.type === "group") {
      ;(o as fabric.Group).getObjects().forEach(c => {
        if (c.type !== "text" && c.type !== "i-text" && c.type !== "textbox") c.set("fill", color)
      })
      o.dirty = true
    } else {
      o.set("fill", color)
    }
  })

  // Couleur du texte interne d'un groupe (CTA / badge)
  const setTextColor = (color: string) => mutate(o => {
    const txt = groupText(o); if (!txt) return
    txt.set("fill", color)
    o.dirty = true
  })

  // Effet : ombre portee
  const setShadow = (on: boolean) => mutate(o => {
    o.set("shadow", on ? new fabric.Shadow({ color: "rgba(0,0,0,0.35)", blur: 18, offsetX: 0, offsetY: 8 }) : null)
    o.dirty = true
  })
  const setShadowBlur = (v: number) => mutate(o => {
    const s = o.shadow as fabric.Shadow | null; if (!s) return
    s.blur = v
    o.dirty = true
  })

  // Effet : bordure / contour (strokeUniform => epaisseur constante)
  const setBorder = (on: boolean) => mutate(o => {
    if (on) o.set({ stroke: G, strokeWidth: (o.strokeWidth ?? 0) > 0 ? o.strokeWidth : 4, strokeUniform: true })
    else o.set({ stroke: null, strokeWidth: 0 })
    o.dirty = true
  })
  const setBorderColor = (color: string) => mutate(o => {
    o.set({ stroke: color, strokeUniform: true })
    if ((o.strokeWidth ?? 0) === 0) o.set("strokeWidth", 4)
    o.dirty = true
  })
  const setBorderWidth = (v: number) => mutate(o => {
    o.set({ strokeWidth: v, strokeUniform: true })
    if (v > 0 && !o.stroke) o.set("stroke", G)
    o.dirty = true
  })

  // Coins arrondis (rectangles)
  const setRadius = (v: number) => mutate(o => {
    if (o.type !== "rect") return
    ;(o as fabric.Rect).set({ rx: v, ry: v })
    o.dirty = true
  })

  // ---- Calques -------------------------------------------------------------
  const layer = (action: "front" | "back" | "fwd" | "bwd" | "dup" | "lock" | "del") => {
    const fc = fcRef.current; if (!fc) return
    const o = fc.getActiveObject(); if (!o) return
    switch (action) {
      case "front": fc.bringToFront(o); break
      case "back":  fc.sendToBack(o);   break
      case "fwd":   fc.bringForward(o); break
      case "bwd":   fc.sendBackwards(o); break
      case "dup":
        o.clone((c: fabric.Object) => {
          c.set({ left: (o.left ?? 0) + 20, top: (o.top ?? 0) + 20 })
          ;(c as any).isQR = (o as any).isQR
          fc.add(c); fc.setActiveObject(c); fc.requestRenderAll(); refreshSel()
        }, TOJSON_PROPS)
        return
      case "lock": {
        const locked = !o.lockMovementX
        o.set({
          lockMovementX: locked, lockMovementY: locked,
          lockScalingX: locked, lockScalingY: locked, lockRotation: locked,
          hasControls: !locked,
        })
        break
      }
      case "del":
        fc.remove(o); fc.discardActiveObject(); setSel(null); fc.requestRenderAll()
        return
    }
    // garder les guides au sommet
    if (vGuideRef.current) fc.bringToFront(vGuideRef.current)
    if (hGuideRef.current) fc.bringToFront(hGuideRef.current)
    fc.requestRenderAll(); refreshSel()
    pushHistorySoon() // front/back/fwd/bwd/lock ne declenchent pas d'evenement
    setLayersVer(v => v + 1)
  }

  // ---- Liste des calques ---------------------------------------------------
  const layerName = (o: fabric.Object): string => {
    const custom = (o as any).name
    if (typeof custom === "string" && custom.trim()) return custom.trim().slice(0, 22)
    if ((o as any).isQR) return "QR Code"
    const t = groupText(o)
    if (t) return (t.text || "Bouton").slice(0, 18)
    switch (o.type) {
      case "i-text": case "text": case "textbox": return ((o as fabric.IText).text || "Texte").slice(0, 18)
      case "rect": return "Rectangle"
      case "circle": return "Cercle"
      case "triangle": return "Triangle"
      case "polygon": return "Forme"
      case "line": return "Ligne"
      case "image": return "Image"
      case "path": return "Icône"
      case "group": return "Groupe"
      default: return "Élément"
    }
  }
  // Objets du plus haut (devant) au plus bas (derriere), guides exclus
  const layerList = (): fabric.Object[] =>
    (fcRef.current?.getObjects() ?? []).filter(o => !(o as any).isGuide).slice().reverse()
  const selectLayer = (o: fabric.Object) => {
    const fc = fcRef.current; if (!fc) return
    fc.setActiveObject(o); fc.requestRenderAll(); refreshSel()
  }
  const toggleVisible = (o: fabric.Object) => {
    const fc = fcRef.current; if (!fc) return
    o.visible = !o.visible; o.dirty = true
    fc.requestRenderAll(); setLayersVer(v => v + 1); pushHistorySoon()
  }
  const moveLayer = (o: fabric.Object, dir: "up" | "down") => {
    const fc = fcRef.current; if (!fc) return
    fc.setActiveObject(o); layer(dir === "up" ? "fwd" : "bwd")
  }
  const removeLayer = (o: fabric.Object) => {
    const fc = fcRef.current; if (!fc) return
    fc.setActiveObject(o); layer("del")
  }
  const renameLayer = (o: fabric.Object, value: string) => {
    ;(o as any).name = value.trim() || undefined
    setEditLayer(null); setLayersVer(v => v + 1); pushHistorySoon()
  }
  // Infos du support : textes marques par role (titre / sous-titre / tel / site)
  const roleObjects = (): fabric.Object[] => {
    const objs = fcRef.current?.getObjects() ?? []
    return ROLE_ORDER.map(r => objs.find(o => (o as any).role === r)).filter(Boolean) as fabric.Object[]
  }
  const roleValue = (o: fabric.Object): string => {
    const role = (o as any).role as string
    const txt = ((o as fabric.Textbox).text ?? "")
    const p = ROLE_PREFIX[role]
    return p && txt.startsWith(p) ? txt.slice(p.length) : txt
  }
  const updateRole = (role: string, value: string) => {
    const fc = fcRef.current; if (!fc) return
    const o = fc.getObjects().find(x => (x as any).role === role) as fabric.Textbox | undefined
    if (!o) return
    o.set({ text: (ROLE_PREFIX[role] ?? "") + value })
    fc.requestRenderAll(); setInfoVer(v => v + 1); pushHistorySoon()
  }
  // Reordonner par glisser-deposer (indices dans la liste affichee = front-first)
  const reorderLayers = (from: number, to: number) => {
    const fc = fcRef.current; if (!fc || from === to) return
    const disp = layerList()
    if (from < 0 || from >= disp.length || to < 0 || to >= disp.length) return
    const moved = disp.splice(from, 1)[0]
    disp.splice(to, 0, moved)
    // disp est front-first => l'ordre Fabric (arriere->avant) est l'inverse
    disp.slice().reverse().forEach((obj, i) => fc.moveTo(obj, i))
    if (vGuideRef.current) fc.bringToFront(vGuideRef.current)
    if (hGuideRef.current) fc.bringToFront(hGuideRef.current)
    fc.requestRenderAll(); setLayersVer(v => v + 1); pushHistorySoon()
  }

  // ---- Alignement sur le support -------------------------------------------
  const align = (action: "left" | "centerH" | "right" | "top" | "centerV" | "bottom") => {
    const fc = fcRef.current; if (!fc) return
    const o = fc.getActiveObject(); if (!o) return
    const z = fc.getZoom() || 1
    const W = fc.getWidth() / z, H = fc.getHeight() / z // dimensions en coords design
    const b = o.getBoundingRect(true) // boite englobante en coords canvas
    switch (action) {
      case "left":    o.set("left", (o.left ?? 0) - b.left); break
      case "centerH": o.set("left", (o.left ?? 0) + (W / 2 - (b.left + b.width / 2))); break
      case "right":   o.set("left", (o.left ?? 0) + (W - (b.left + b.width))); break
      case "top":     o.set("top",  (o.top ?? 0) - b.top); break
      case "centerV": o.set("top",  (o.top ?? 0) + (H / 2 - (b.top + b.height / 2))); break
      case "bottom":  o.set("top",  (o.top ?? 0) + (H - (b.top + b.height))); break
    }
    o.setCoords(); fc.requestRenderAll(); pushHistorySoon()
  }

  // ---- Outils : miroir, grouper, degrouper, tout selectionner --------------
  const flip = (axis: "x" | "y") => mutate(o => o.set(axis === "x" ? "flipX" : "flipY", !(axis === "x" ? o.flipX : o.flipY)))
  const groupSel = () => {
    const fc = fcRef.current; if (!fc) return
    const a = fc.getActiveObject()
    if (!a || a.type !== "activeSelection") return
    ;(a as fabric.ActiveSelection).toGroup()
    fc.requestRenderAll(); refreshSel(); setLayersVer(v => v + 1); pushHistorySoon()
  }
  const ungroupSel = () => {
    const fc = fcRef.current; if (!fc) return
    const a = fc.getActiveObject()
    if (!a || a.type !== "group") return
    ;(a as fabric.Group).toActiveSelection()
    fc.requestRenderAll(); refreshSel(); setLayersVer(v => v + 1); pushHistorySoon()
  }
  const onCanvasContext = (e: React.MouseEvent) => {
    const fc = fcRef.current; if (!fc) return
    e.preventDefault()
    const target = (fc as unknown as { findTarget: (ev: Event, skip?: boolean) => fabric.Object | undefined }).findTarget(e.nativeEvent, false)
    if (target && !(target as any).isGuide) { fc.setActiveObject(target); fc.requestRenderAll(); refreshSel() }
    if (fc.getActiveObject()) setCtx({ x: e.clientX, y: e.clientY })
    else setCtx(null)
  }
  const selectAll = () => {
    const fc = fcRef.current; if (!fc) return
    const objs = fc.getObjects().filter(o => !(o as any).isGuide && o.selectable !== false && o.visible !== false)
    if (!objs.length) return
    fc.discardActiveObject()
    if (objs.length === 1) fc.setActiveObject(objs[0])
    else fc.setActiveObject(new fabric.ActiveSelection(objs, { canvas: fc }))
    fc.requestRenderAll(); refreshSel()
  }

  // ---- Format --------------------------------------------------------------
  const applyFormat = (fmt: FormatId) => {
    const fc = fcRef.current; if (!fc) return
    const d = editDims(fmt)
    fc.setZoom(1); fc.setDimensions({ width: d.w, height: d.h }) // changer de format reinitialise le zoom
    if (bgGrad) applyGradient(bgColor, bgC2) // recalculer le degrade aux nouvelles dimensions
    fc.requestRenderAll()
    setFormat(fmt); setZoom(1)
  }

  // ---- Zoom ----------------------------------------------------------------
  // Zoom = setZoom + agrandissement de l'element (la zone autour scrolle).
  const applyZoom = (z: number) => {
    const fc = fcRef.current; if (!fc) return
    const z0 = fc.getZoom() || 1
    const baseW = fc.getWidth() / z0, baseH = fc.getHeight() / z0 // dims design courantes
    const nz = Math.min(3, Math.max(0.25, z))
    fc.setZoom(nz)
    fc.setDimensions({ width: Math.round(baseW * nz), height: Math.round(baseH * nz) })
    fc.requestRenderAll()
    setZoom(nz)
  }
  // Execute fn() avec le canvas ramene a zoom 1 (pour un export propre), puis restaure.
  const withBaseZoom = <T,>(fc: fabric.Canvas, fn: (base: { w: number; h: number }) => T): T => {
    const z = fc.getZoom() || 1
    const base = editDims(format)
    fc.setZoom(1); fc.setDimensions({ width: base.w, height: base.h }); fc.requestRenderAll()
    const out = fn(base)
    fc.setZoom(z); fc.setDimensions({ width: Math.round(base.w * z), height: Math.round(base.h * z) }); fc.requestRenderAll()
    return out
  }

  // ---- Couleur / degrade de fond -------------------------------------------
  // Degrade vertical en coordonnees design (getHeight/zoom), insensible au zoom.
  const applyGradient = (c1: string, c2: string) => {
    const fc = fcRef.current; if (!fc) return
    const h = fc.getHeight() / (fc.getZoom() || 1)
    const grad = new fabric.Gradient({
      type: "linear", gradientUnits: "pixels",
      coords: { x1: 0, y1: 0, x2: 0, y2: h },
      colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }],
    })
    fc.setBackgroundColor(grad as unknown as string, fc.renderAll.bind(fc))
    pushHistorySoon()
  }
  const applyBg = (color: string) => {
    const fc = fcRef.current; if (!fc) return
    setBgColor(color)
    if (bgGrad) { applyGradient(color, bgC2); return }
    fc.setBackgroundColor(color, fc.renderAll.bind(fc))
    pushHistorySoon()
  }
  const toggleGrad = (on: boolean) => {
    setBgGrad(on)
    const fc = fcRef.current; if (!fc) return
    if (on) applyGradient(bgColor, bgC2)
    else { fc.setBackgroundColor(bgColor, fc.renderAll.bind(fc)); pushHistorySoon() }
  }
  const applyBgC2 = (c2: string) => { setBgC2(c2); if (bgGrad) applyGradient(bgColor, c2) }
  const applyBgPreset = (p: typeof BG_PRESETS[number]) => {
    const fc = fcRef.current; if (!fc) return
    if (p.type === "grad" && p.c2) { setBgGrad(true); setBgColor(p.c1); setBgC2(p.c2); applyGradient(p.c1, p.c2) }
    else { setBgGrad(false); setBgColor(p.c1); fc.setBackgroundColor(p.c1, fc.renderAll.bind(fc)); pushHistorySoon() }
  }
  // Synchronise les controles de fond avec l'etat reel du canvas (apres chargement / undo)
  const syncBgFromCanvas = (fc: fabric.Canvas) => {
    const bg = fc.backgroundColor as unknown as { colorStops?: { color: string }[] } | string
    if (bg && typeof bg === "object" && Array.isArray(bg.colorStops) && bg.colorStops.length) {
      setBgGrad(true)
      setBgColor(bg.colorStops[0]?.color ?? CANVAS_BG_DEFAULT)
      setBgC2(bg.colorStops[bg.colorStops.length - 1]?.color ?? "#0A0A0A")
    } else {
      setBgGrad(false)
      setBgColor(typeof bg === "string" ? bg : CANVAS_BG_DEFAULT)
    }
  }

  // ---- Appliquer un style global (couleurs + typo + accents) ---------------
  const applyStyle = (s: typeof GLOBAL_STYLES[number]) => {
    const fc = fcRef.current; if (!fc) return
    histRef.current.lock = true
    setBgGrad(false); fc.setBackgroundColor(s.bg, () => {}); setBgColor(s.bg)
    const isTxt = (t?: string) => t === "i-text" || t === "text" || t === "textbox"
    fc.getObjects().forEach(o => {
      if ((o as any).isGuide || (o as any).isQR || (o as any).isQrCard) return
      if (isTxt(o.type)) {
        ;(o as fabric.IText).set({ fontFamily: (o as any).role === "title" ? s.titleFont : s.bodyFont, fill: s.ink })
      } else if (o.type === "group") {
        ;(o as fabric.Group).getObjects().forEach(c => {
          c.set("fill", isTxt(c.type) ? readableOn(s.accent) : s.accent)
        })
        o.dirty = true
      } else {
        if (typeof o.fill === "string" && o.fill && o.fill !== "transparent") o.set("fill", s.accent)
        if (typeof o.stroke === "string" && o.stroke) o.set("stroke", s.accent)
      }
    })
    histRef.current.lock = false
    fc.requestRenderAll(); pushHistory(); setLayersVer(v => v + 1); setInfoVer(v => v + 1)
    try {
      const d = document as Document & { fonts?: { load: (f: string) => Promise<unknown> } }
      Promise.all([d.fonts?.load(`700 40px '${s.titleFont}'`), d.fonts?.load(`400 24px '${s.bodyFont}'`)]).then(() => fc.requestRenderAll()).catch(() => {})
    } catch { /* noop */ }
  }

  // Changer le libelle du 1er bouton CTA (pilule) du design
  const setCtaLabel = (value: string) => {
    const fc = fcRef.current; if (!fc) return
    const grp = fc.getObjects().find(o => o.type === "group" && !!groupText(o) && (o as fabric.Group).getObjects().some(c => c.type === "rect")) as fabric.Group | undefined
    const txt = grp ? groupText(grp) : null
    if (!grp || !txt) return
    txt.set({ text: value }); (txt as unknown as { initDimensions?: () => void }).initDimensions?.()
    const rect = grp.getObjects().find(o => o.type === "rect") as fabric.Rect | undefined
    if (rect) { const h = rect.height ?? 60; const nw = Math.max(h * 2, (txt.width ?? 0) + h * 0.6 * 2); rect.set({ width: nw, left: -nw / 2 }); txt.set({ left: 0 }); grp.set({ width: nw }) }
    grp.dirty = true; grp.setCoords(); fc.requestRenderAll()
  }

  // ---- Generateur : metier + objectif -> design complet auto ---------------
  const generate = async (metier: typeof METIERS[number], o: MObj) => {
    await applyTemplate(o.tpl, true)
    const st = GLOBAL_STYLES.find(s => s.id === metier.style); if (st) applyStyle(st)
    updateRole("title", o.title); updateRole("subtitle", o.subtitle)
    setCtaLabel(o.cta)
    setWizard(3)
  }

  // ---- Appliquer un modele oriente objectif --------------------------------
  // Vide le canvas (hors guides), pose un design complet et editable, place le vrai QR.
  const applyTemplate = async (id: string, skipConfirm = false) => {
    const fc = fcRef.current; if (!fc) return
    const meta = PRINT_TEMPLATES.find(t => t.id === id); if (!meta) return
    const vG = vGuideRef.current, hG = hGuideRef.current
    const hasContent = fc.getObjects().some(o => o !== vG && o !== hG && !(o as any).isQR && !(o as any).isQrCard)
    if (!skipConfirm && hasContent && !window.confirm("Remplacer le contenu actuel par ce modèle ?")) return

    histRef.current.lock = true // tout le modele = une seule etape d'historique
    fc.getObjects().slice().forEach(o => { if (o !== vG && o !== hG) fc.remove(o) })
    const z = fc.getZoom() || 1
    const W = fc.getWidth() / z, H = fc.getHeight() / z // coords design
    const { bg, ink, accent } = meta
    fc.setBackgroundColor(bg, () => {}); setBgColor(bg)

    const addText = (s: string, top: number, size: number, o: { weight?: string; fill?: string; font?: string; width?: number; role?: string } = {}) => {
      const t = new fabric.Textbox(s, {
        width: o.width ?? W * 0.82, left: W / 2, top, originX: "center", textAlign: "center",
        fontFamily: o.font ?? "Georgia", fontWeight: o.weight ?? "normal", fontSize: size, fill: o.fill ?? ink,
      })
      if (o.role) (t as any).role = o.role
      fc.add(t); return t
    }
    const addStars = (n: number, cy: number, s: number, color: string) => {
      const objs: fabric.Object[] = []
      for (let i = 0; i < n; i++) objs.push(new fabric.Polygon(starPts(5, s / 2, s / 5), { fill: color, left: i * (s * 1.25), top: 0 }))
      fc.add(new fabric.Group(objs, { originX: "center", left: W / 2, top: cy }))
    }
    const addCTA = (label: string, top: number) => {
      const rh = Math.round(Math.min(W * 0.7, 360) * 0.2)
      const g = buildPill(label, { rectFill: accent, textFill: readableOn(accent), height: rh, fontSize: Math.round(rh * 0.42) })
      g.set({ originX: "center", left: W / 2, top })
      fc.add(g)
    }
    const addIconT = (d: string, size: number, top: number, color: string) => new Promise<void>(res => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}" fill="${color}"/></svg>`
      fabric.loadSVGFromString(svg, (objs, opt) => {
        const o = fabric.util.groupSVGElements(objs, opt) as fabric.Object
        o.scaleToWidth(size); o.set({ originX: "center", originY: "top", left: W / 2, top }); fc.add(o); res()
      })
    })
    const placeQrT = (top: number, wFrac: number) => new Promise<void>(res => {
      fabric.Image.fromURL(qrUrlRef.current, (img) => {
        const w = W * wFrac
        img.scaleToWidth(w); (img as any).isQR = true
        img.set({ originX: "center", originY: "top", left: W / 2, top })
        // carte blanche derriere le QR (look premium + zone de silence pour le scan)
        const pad = Math.round(w * 0.07)
        const card = new fabric.Rect({
          width: w + pad * 2, height: w + pad * 2, rx: Math.round(w * 0.06), ry: Math.round(w * 0.06),
          fill: "#FFFFFF", originX: "center", originY: "top", left: W / 2, top: top - pad,
          shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.20)", blur: 26, offsetX: 0, offsetY: 10 }),
        })
        ;(card as any).isQrCard = true
        fc.add(card); fc.add(img); res()
      })
    })
    const ICON = (k: string) => LIB_ICONS.find(i => i.key === k)!.d
    // Filet d'accent (divider) centre, sous un titre
    const rule = (top: number) => fc.add(new fabric.Rect({ width: Math.round(W * 0.13), height: Math.max(3, Math.round(W * 0.007)), rx: 2, ry: 2, fill: accent, originX: "center", left: W / 2, top }))
    // Mise en page "bandeau" : grand en-tete colore + QR + CTA
    const bandLayout = async (title: string, subtitle: string, cta: string) => {
      fc.add(new fabric.Rect({ left: 0, top: 0, width: W, height: Math.round(H * 0.30), fill: accent }))
      addText(title, H * 0.085, W * 0.08, { weight: "bold", fill: readableOn(accent), role: "title" })
      addText(subtitle, H * 0.205, W * 0.032, { font: "Arial", fill: readableOn(accent), role: "subtitle" })
      await placeQrT(H * 0.40, 0.46)
      addCTA(cta, H * 0.86)
    }
    // Mise en page "cadre premium" : filet insere + divider + QR + CTA
    const frameLayout = async (title: string, subtitle: string, cta: string) => {
      const f = new fabric.Rect({ left: W * 0.05, top: H * 0.05, width: W * 0.90, height: H * 0.90, fill: "transparent", stroke: accent, strokeWidth: Math.max(2, Math.round(W * 0.006)), strokeUniform: true, rx: 8, ry: 8 })
      ;(f as any).perPixelTargetFind = true
      fc.add(f)
      addText(title, H * 0.12, W * 0.072, { weight: "bold", role: "title" })
      fc.add(new fabric.Rect({ width: Math.round(W * 0.14), height: Math.max(3, Math.round(W * 0.007)), rx: 2, ry: 2, fill: accent, originX: "center", left: W / 2, top: H * 0.205 }))
      addText(subtitle, H * 0.25, W * 0.032, { font: "Arial", role: "subtitle" })
      await placeQrT(H * 0.36, 0.44)
      addCTA(cta, H * 0.82)
    }
    // Mise en page "footer" : titre + QR en haut, barre coloree en bas avec le CTA
    const footerLayout = async (title: string, subtitle: string, cta: string) => {
      addText(title, H * 0.075, W * 0.078, { weight: "bold", role: "title" })
      addText(subtitle, H * 0.175, W * 0.032, { font: "Arial", role: "subtitle" })
      await placeQrT(H * 0.30, 0.46)
      fc.add(new fabric.Rect({ left: 0, top: Math.round(H * 0.82), width: W, height: Math.round(H * 0.18), fill: accent }))
      addText(cta, H * 0.875, W * 0.05, { weight: "bold", fill: readableOn(accent) })
    }
    // Mise en page "QR geant" : minimal, QR dominant
    const heroLayout = async (title: string, subtitle: string, cta: string) => {
      addText(title, H * 0.10, W * 0.062, { weight: "bold", role: "title" })
      await placeQrT(H * 0.24, 0.60)
      addText(subtitle, H * 0.80, W * 0.034, { font: "Arial", role: "subtitle" })
      addText(cta, H * 0.87, W * 0.04, { weight: "bold", fill: accent })
    }
    // Mise en page "orne" : stack centre + etoiles decoratives en coins
    const ornateLayout = async (title: string, subtitle: string, cta: string) => {
      fc.add(new fabric.Polygon(starPts(4, W * 0.05, W * 0.016), { fill: accent, originX: "center", originY: "center", left: W * 0.16, top: H * 0.11 }))
      fc.add(new fabric.Polygon(starPts(4, W * 0.04, W * 0.013), { fill: accent, originX: "center", originY: "center", left: W * 0.85, top: H * 0.88 }))
      addText(title, H * 0.105, W * 0.075, { weight: "bold", role: "title" })
      rule(H * 0.18)
      addText(subtitle, H * 0.21, W * 0.032, { font: "Arial", role: "subtitle" })
      await placeQrT(H * 0.30, 0.46)
      addCTA(cta, H * 0.84)
    }
    // Mise en page "diagonale" : bandeau d'accent en biais en haut
    const diagLayout = async (title: string, subtitle: string, cta: string) => {
      fc.add(new fabric.Polygon([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H * 0.22 }, { x: 0, y: H * 0.34 }], { fill: accent }))
      addText(title, H * 0.085, W * 0.072, { weight: "bold", fill: readableOn(accent), role: "title" })
      addText(subtitle, H * 0.42, W * 0.032, { font: "Arial", role: "subtitle" })
      await placeQrT(H * 0.48, 0.44)
      addCTA(cta, H * 0.86)
    }

    // Donnees reelles (deja saisies cote QRStudio) ; sinon placeholders
    const name    = (prefill?.name ?? "").trim()
    const phone   = (prefill?.phone ?? "").trim()
    const website = (prefill?.website ?? "").trim()
    // Ligne de marque (nom de l'etablissement) ajoutee si dispo
    const brand = (top: number) => { if (name) addText(name, top, W * 0.038, { font: "Arial", weight: "bold", fill: accent }) }

    switch (id) {
      case "avis-or":
      case "avis-clair":
        brand(H * 0.02)
        addText("Vous avez aimé ?", H * 0.06, W * 0.075, { weight: "bold", role: "title" })
        addStars(5, H * 0.19, W * 0.07, accent)
        addText("Laissez-nous un avis en 30 secondes", H * 0.27, W * 0.034, { font: "Arial", width: W * 0.72, role: "subtitle" })
        await placeQrT(H * 0.37, 0.46)
        addCTA("Scannez-moi", H * 0.85)
        break
      case "menu":
      case "menu-clair":
        fc.add(new fabric.Rect({ left: 0, top: 0, width: W, height: Math.round(H * 0.16), fill: accent }))
        addText(name || "Notre Carte", H * 0.045, W * 0.085, { weight: "bold", fill: readableOn(accent), role: "title" })
        addText("Scannez pour découvrir nos plats", H * 0.24, W * 0.034, { font: "Arial", role: "subtitle" })
        await placeQrT(H * 0.34, 0.5)
        addCTA("Voir le menu", H * 0.85)
        break
      case "reserver":
      case "reserver-clair":
        brand(H * 0.015)
        await addIconT(ICON("cal"), W * 0.14, H * 0.07, accent)
        addText("Réservez votre table", H * 0.2, W * 0.07, { weight: "bold", role: "title" })
        rule(H * 0.255)
        addText("En quelques secondes, où que vous soyez", H * 0.285, W * 0.032, { font: "Arial", width: W * 0.72, role: "subtitle" })
        await placeQrT(H * 0.38, 0.44)
        addCTA("Réservez", H * 0.85)
        break
      case "insta":
      case "insta-clair":
        brand(H * 0.015)
        await addIconT(ICON("cam"), W * 0.14, H * 0.07, accent)
        addText("Suivez-nous", H * 0.2, W * 0.085, { weight: "bold", role: "title" })
        addText("@votrecompte", H * 0.29, W * 0.04, { font: "Arial", fill: accent, role: "subtitle" })
        await placeQrT(H * 0.38, 0.44)
        addCTA("Suivez-nous", H * 0.85)
        break
      case "contact":
      case "contact-clair":
        addText(name || "Prénom Nom", H * 0.09, W * 0.08, { weight: "bold", role: "title" })
        rule(H * 0.16)
        addText("Votre métier", H * 0.185, W * 0.036, { font: "Arial", fill: accent, role: "subtitle" })
        await placeQrT(H * 0.28, 0.5)
        addText(`📞  ${phone || "06 12 34 56 78"}`, H * 0.76, W * 0.034, { font: "Arial", role: "phone" })
        addText(`🌐  ${website || "monsite.fr"}`, H * 0.83, W * 0.034, { font: "Arial", role: "website" })
        break
      case "decouvrir":
      case "decouvrir-or":
        brand(H * 0.035)
        addText("Découvrez-nous", H * 0.1, W * 0.08, { weight: "bold", role: "title" })
        rule(H * 0.165)
        addText("Scannez pour en savoir plus", H * 0.195, W * 0.034, { font: "Arial", role: "subtitle" })
        await placeQrT(H * 0.3, 0.5)
        addCTA("En savoir plus", H * 0.85)
        break
      case "avis-band":      await bandLayout("Votre avis ?", "Aidez-nous en 30 secondes", "Donner mon avis"); break
      case "reserver-band":  await bandLayout("Réservez", "Votre table en 1 clic", "Réserver"); break
      case "insta-band":     await bandLayout("Suivez-nous", "@votrecompte", "Nous suivre"); break
      case "contact-band":   await bandLayout("Mes coordonnées", "Scannez pour me contacter", "Enregistrer"); break
      case "decouvrir-band": await bandLayout("Découvrez-nous", "Tout est ici", "En savoir plus"); break
      case "avis-frame":      await frameLayout("Vous avez aimé ?", "Laissez-nous un avis", "Donner mon avis"); break
      case "menu-frame":      await frameLayout(name || "Notre Carte", "Scannez pour la carte", "Voir le menu"); break
      case "reserver-frame":  await frameLayout("Réservez votre table", "En quelques secondes", "Réserver"); break
      case "insta-frame":     await frameLayout("Suivez-nous", "@votrecompte", "Nous suivre"); break
      case "contact-frame":   await frameLayout(name || "Mes coordonnées", "Scannez pour me contacter", "Enregistrer"); break
      case "decouvrir-frame": await frameLayout("Découvrez-nous", "Scannez pour en savoir plus", "En savoir plus"); break
      case "avis-footer":      await footerLayout("Vous avez aimé ?", "Votre avis compte", "Donner mon avis →"); break
      case "menu-footer":      await footerLayout(name || "Notre Carte", "Tous nos plats", "Voir le menu →"); break
      case "reserver-footer":  await footerLayout("Réservez votre table", "En quelques secondes", "Réserver →"); break
      case "insta-footer":     await footerLayout("Suivez-nous", "@votrecompte", "Nous suivre →"); break
      case "contact-footer":   await footerLayout(name || "Mes coordonnées", "Restons en contact", "Me contacter →"); break
      case "decouvrir-footer": await footerLayout("Découvrez-nous", "Scannez pour explorer", "En savoir plus →"); break
      case "avis-hero":      await heroLayout("Vous avez aimé ?", "Scannez pour laisser un avis", "MERCI 🙏"); break
      case "menu-hero":      await heroLayout(name || "Notre Carte", "Scannez pour voir le menu", "BON APPÉTIT"); break
      case "reserver-hero":  await heroLayout("Réservez", "Scannez pour réserver", "À BIENTÔT"); break
      case "insta-hero":     await heroLayout("Suivez-nous", "Scannez pour nous suivre", "@votrecompte"); break
      case "contact-hero":   await heroLayout(name || "Mon contact", "Scannez ma carte", ""); break
      case "decouvrir-hero": await heroLayout("Scannez-moi", "Pour tout découvrir", ""); break
      case "avis-diag":      await diagLayout("Vous avez aimé ?", "Laissez-nous un avis", "Donner mon avis"); break
      case "menu-diag":      await diagLayout(name || "Notre Carte", "Scannez pour la carte", "Voir le menu"); break
      case "reserver-diag":  await diagLayout("Réservez votre table", "En quelques secondes", "Réserver"); break
      case "insta-diag":     await diagLayout("Suivez-nous", "@votrecompte", "Nous suivre"); break
      case "contact-diag":   await diagLayout(name || "Mes coordonnées", "Scannez pour me contacter", "Enregistrer"); break
      case "decouvrir-diag": await diagLayout("Découvrez-nous", "Scannez pour en savoir plus", "En savoir plus"); break
      case "avis-ornate":      await ornateLayout("Vous avez aimé ?", "Laissez-nous un avis", "Donner mon avis"); break
      case "menu-ornate":      await ornateLayout(name || "Notre Carte", "Scannez pour la carte", "Voir le menu"); break
      case "reserver-ornate":  await ornateLayout("Réservez votre table", "En quelques secondes", "Réserver"); break
      case "insta-ornate":     await ornateLayout("Suivez-nous", "@votrecompte", "Nous suivre"); break
      case "contact-ornate":   await ornateLayout(name || "Mes coordonnées", "Restons en contact", "Me contacter"); break
      case "decouvrir-ornate": await ornateLayout("Découvrez-nous", "Scannez pour explorer", "En savoir plus"); break
    }

    if (vG) fc.bringToFront(vG)
    if (hG) fc.bringToFront(hG)
    fc.discardActiveObject(); setSel(null); fc.requestRenderAll()
    histRef.current.lock = false
    pushHistory() // modele applique = une etape
    setTplOpen(false)
  }

  // ---- Sauvegarde ----------------------------------------------------------
  const save = async (silent = false) => {
    const fc = fcRef.current; if (!fc) return
    if (!silent) { setSaving(true); setSaved(false) }
    try {
      // ne pas serialiser les guides (excludeFromExport ne suffit pas pour toJSON)
      const vG = vGuideRef.current, hG = hGuideRef.current
      if (vG) fc.remove(vG)
      if (hG) fc.remove(hG)
      const design = fc.toJSON(TOJSON_PROPS)
      if (vG) fc.add(vG)
      if (hG) fc.add(hG)

      const res = await fetch("/api/print-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_id: qrId, design, format }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Echec")
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (e) {
      if (!silent) alert("Sauvegarde impossible : " + (e as Error).message)
    } finally {
      if (!silent) setSaving(false)
    }
  }

  // Auto-sauvegarde : 2,5 s apres la derniere modification (silencieuse)
  useEffect(() => {
    if (loading || histRef.current.i < 1) return
    const t = setTimeout(() => { save(true) }, 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histVer, loading])

  // ---- Export --------------------------------------------------------------
  const prepExport = (fc: fabric.Canvas) => {
    fc.discardActiveObject()
    const vG = vGuideRef.current, hG = hGuideRef.current
    if (vG) vG.set({ visible: false })
    if (hG) hG.set({ visible: false })
    fc.requestRenderAll()
  }

  const exportPng = async () => {
    const fc = fcRef.current; if (!fc) return
    setExporting(true)
    try {
      prepExport(fc)
      const url = withBaseZoom(fc, base => fc.toDataURL({ format: "png", multiplier: FORMATS[format].exportW / base.w }))
      const a = document.createElement("a")
      a.href = url; a.download = `qrfolio-${format}.png`; a.click()
    } finally { setExporting(false) }
  }

  const exportPdf = async () => {
    if (!isPro) { onUpsell?.("l'export PDF prêt à imprimer", "pro"); return }
    const fc = fcRef.current; if (!fc) return
    setExporting(true)
    try {
      prepExport(fc)
      const url = withBaseZoom(fc, base => fc.toDataURL({ format: "png", multiplier: FORMATS[format].exportW / base.w }))
      const w = FORMATS[format].exportW
      const h = Math.round(w / FORMATS[format].ratio)
      const { jsPDF } = await import("jspdf")
      const pdf = new jsPDF({ orientation: w > h ? "l" : "p", unit: "px", format: [w, h] })
      pdf.addImage(url, "PNG", 0, 0, w, h)
      pdf.save(`qrfolio-${format}.pdf`)
    } finally { setExporting(false) }
  }

  // ---- Apercu en situation (mockup CSS) ------------------------------------
  const openMock = () => {
    const fc = fcRef.current; if (!fc) return
    prepExport(fc)
    const url = withBaseZoom(fc, base => fc.toDataURL({ format: "png", multiplier: Math.min(2, 1000 / base.w) }))
    setMockUrl(url); setMockOpen(true)
  }

  // ---- Export pro (DPI + format + traits de coupe / fond perdu) -------------
  const targetWidth = () => Math.round(FORMATS[format].exportW * (expDpi / 300))
  const exportImage = (type: "png" | "jpeg") => {
    const fc = fcRef.current; if (!fc) return
    setExporting(true)
    try {
      prepExport(fc)
      const tw = targetWidth()
      const url = withBaseZoom(fc, base => fc.toDataURL({ format: type, quality: type === "jpeg" ? 0.92 : 1, multiplier: tw / base.w }))
      const a = document.createElement("a")
      a.href = url; a.download = `qrfolio-${format}-${expDpi}dpi.${type === "jpeg" ? "jpg" : "png"}`; a.click()
    } finally { setExporting(false); setExpOpen(false) }
  }
  const exportPdfPro = async () => {
    if (!isPro) { onUpsell?.("l'export PDF pro (traits de coupe, fond perdu)", "pro"); return }
    const fc = fcRef.current; if (!fc) return
    setExporting(true)
    try {
      prepExport(fc)
      const w = targetWidth(), h = Math.round(w / FORMATS[format].ratio)
      const url = withBaseZoom(fc, base => fc.toDataURL({ format: "png", multiplier: w / base.w }))
      const { jsPDF } = await import("jspdf")
      const bleed = expMarks ? Math.round(w * 0.03) : 0
      const pageW = w + bleed * 2, pageH = h + bleed * 2
      const pdf = new jsPDF({ orientation: pageW > pageH ? "l" : "p", unit: "px", format: [pageW, pageH] })
      pdf.addImage(url, "PNG", bleed, bleed, w, h)
      if (expMarks) {
        const m = bleed, L = Math.round(bleed * 0.6)
        pdf.setDrawColor(0); pdf.setLineWidth(Math.max(1, Math.round(w / 800)))
        // 4 coins du trait de coupe (lignes a l'exterieur de la zone de rognage)
        pdf.line(0, m, L, m);           pdf.line(m, 0, m, L)                       // haut-gauche
        pdf.line(pageW, m, pageW - L, m); pdf.line(m + w, 0, m + w, L)             // haut-droite
        pdf.line(0, m + h, L, m + h);   pdf.line(m, pageH, m, pageH - L)           // bas-gauche
        pdf.line(pageW, m + h, pageW - L, m + h); pdf.line(m + w, pageH, m + w, pageH - L) // bas-droite
      }
      pdf.save(`qrfolio-${format}-${expDpi}dpi.pdf`)
    } finally { setExporting(false); setExpOpen(false) }
  }

  // ==========================================================================
  // UI
  // ==========================================================================
  const btnTool = {
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3,
    width: "100%", padding: "8px 2px", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, color: INK,
    fontSize: 8.5, cursor: "pointer",
  }
  const topBtn = (primary = false) => ({
    display: "flex", alignItems: "center", gap: 6, padding: "8px 13px",
    background: primary ? "linear-gradient(90deg,#C9A84C,#b8953f)" : "rgba(255,255,255,0.05)",
    border: primary ? "none" : "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9, color: primary ? "#080808" : INK, fontSize: 12,
    fontWeight: primary ? 700 : 500, cursor: "pointer",
  })
  const layerBtn = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    padding: "8px", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: INK,
    fontSize: 10, cursor: "pointer",
  }
  const iconMini = {
    display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22,
    background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0, flexShrink: 0,
  } as const
  const tb = {
    display: "flex", alignItems: "center", justifyContent: "center", minWidth: 26, height: 26, padding: "0 7px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: INK, fontSize: 12, cursor: "pointer",
  } as const
  const swatch = {
    width: 28, height: 24, borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0, flexShrink: 0,
  } as const

  const canUndo = histVer >= 0 && histRef.current.i > 0
  const canRedo = histVer >= 0 && histRef.current.i < histRef.current.stack.length - 1

  // Garde-fou scannabilite du QR (recalcule a chaque rendu ; histVer/layersVer declenchent)
  const qrIssues = (() => {
    void histVer; void layersVer
    const fc = fcRef.current; if (!fc) return null
    const objs = fc.getObjects()
    const qr = objs.find(o => (o as any).isQR); if (!qr) return null
    const z = fc.getZoom() || 1
    const W = fc.getWidth() / z
    const qb = qr.getBoundingRect(true)
    const small = qb.width < W * 0.16
    let covered = false
    const qi = objs.indexOf(qr)
    for (let i = qi + 1; i < objs.length; i++) {
      const o = objs[i]; if ((o as any).isGuide || o.visible === false) continue
      const b = o.getBoundingRect(true)
      const ix = Math.min(b.left + b.width, qb.left + qb.width) - Math.max(b.left, qb.left)
      const iy = Math.min(b.top + b.height, qb.top + qb.height) - Math.max(b.top, qb.top)
      if (ix > qb.width * 0.15 && iy > qb.height * 0.15) { covered = true; break }
    }
    return small || covered ? { small, covered } : null
  })()
  const histBtn = (enabled: boolean) => ({
    display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
    color: enabled ? INK : MUTED, cursor: enabled ? "pointer" : "not-allowed", opacity: enabled ? 1 : 0.4,
  })

  return (
    <div className="ps-root" style={{
      position: "fixed", inset: 0, zIndex: 3000, background: BG,
      display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif",
    }}>
      <style>{`
        .ps-root button { transition: background .14s ease, border-color .14s ease, color .14s ease, transform .07s ease, filter .14s ease; }
        .ps-root button:hover:not(:disabled) { filter: brightness(1.13); }
        .ps-root button:active:not(:disabled) { transform: scale(0.96); }
        .ps-root input, .ps-root select { transition: border-color .14s ease, box-shadow .14s ease; }
        .ps-root input:focus, .ps-root select:focus { border-color: ${G} !important; box-shadow: 0 0 0 2px rgba(201,168,76,0.18); }
        .ps-fly { animation: psSlide .18s cubic-bezier(.2,.8,.2,1); }
        .ps-pop { animation: psPop .18s cubic-bezier(.2,.8,.2,1); }
        @keyframes psSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes psPop { from { opacity: 0; transform: translate(-50%, -8px) scale(.97); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        .ps-root .qr-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .ps-root .qr-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }
        .ps-root .qr-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.4); }
        .ps-root .qr-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
      {/* ---- Barre du haut ---- */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: SURFACE, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: G, fontWeight: 800, fontSize: 14, letterSpacing: 0.3 }}>QR Print Studio</span>
          <span style={{ color: MUTED, fontSize: 10, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>BÊTA</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Formats */}
          <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 3 }}>
            {(Object.keys(FORMATS) as FormatId[]).map(f => (
              <button key={f} type="button" onClick={() => applyFormat(f)}
                style={{
                  padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: format === f ? 700 : 500,
                  background: format === f ? "rgba(201,168,76,0.18)" : "transparent",
                  color: format === f ? G : MUTED,
                }}>
                {FORMATS[f].label}
              </button>
            ))}
          </div>

          {/* Zoom */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 3 }}>
            <button type="button" onClick={() => applyZoom(zoom / 1.25)} title="Zoom arrière" aria-label="Zoom arrière"
              style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 6, color: INK, fontSize: 16, cursor: "pointer" }}>−</button>
            <button type="button" onClick={() => applyZoom(1)} title="100 %"
              style={{ minWidth: 42, height: 26, background: "none", border: "none", color: MUTED, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{Math.round(zoom * 100)}%</button>
            <button type="button" onClick={() => applyZoom(zoom * 1.25)} title="Zoom avant" aria-label="Zoom avant"
              style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 6, color: INK, fontSize: 15, cursor: "pointer" }}>+</button>
          </div>

          <button type="button" onClick={() => setShowHelp(true)} title="Aide & raccourcis" aria-label="Aide et raccourcis"
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: INK, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>?</button>

          <button type="button" onClick={openMock} title="Aperçu en situation"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: INK, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Eye size={14} /> Aperçu
          </button>

          <button type="button" onClick={undo} disabled={!canUndo} aria-label="Annuler" title="Annuler (Ctrl/⌘+Z)" style={histBtn(canUndo)}>
            <Undo2 size={15} />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} aria-label="Rétablir" title="Rétablir (Ctrl/⌘+Maj+Z)" style={histBtn(canRedo)}>
            <Redo2 size={15} />
          </button>

          <button type="button" onClick={() => save()} disabled={saving} style={topBtn(false)}>
            {saving ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
              : saved ? <Check size={13} color="#39FF8F" /> : <Save size={13} />}
            {saved ? "Enregistré" : "Enregistrer"}
          </button>
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => setExpOpen(v => !v)} disabled={exporting} style={topBtn(true)}>
              {exporting ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Download size={13} />} Exporter
            </button>
            {expOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 232, background: "#14120C", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, boxShadow: "0 18px 50px rgba(0,0,0,0.6)", zIndex: 60 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 6px" }}>Qualité</p>
                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  {[72, 150, 300].map(d => (
                    <button key={d} type="button" onClick={() => setExpDpi(d)}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: `1px solid ${expDpi === d ? G : "rgba(255,255,255,0.1)"}`, background: expDpi === d ? "rgba(201,168,76,0.15)" : "transparent", color: expDpi === d ? G : INK, fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>{d}<span style={{ fontSize: 7, opacity: 0.7 }}> DPI</span></button>
                  ))}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer", color: INK, fontSize: 10.5, lineHeight: 1.3 }}>
                  <input type="checkbox" checked={expMarks} onChange={e => setExpMarks(e.target.checked)} style={{ accentColor: G, flexShrink: 0 }} />
                  Traits de coupe + fond perdu <span style={{ color: MUTED }}>(PDF)</span>
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button type="button" onClick={() => exportImage("png")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 11px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: INK, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Download size={13} /> PNG</button>
                  <button type="button" onClick={() => exportImage("jpeg")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 11px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: INK, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Download size={13} /> JPG</button>
                  <button type="button" onClick={exportPdfPro} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 11px", background: "linear-gradient(90deg,#C9A84C,#b8953f)", border: "none", borderRadius: 9, color: "#080808", fontSize: 12, fontWeight: 800, cursor: "pointer" }}><Printer size={13} /> PDF{!isPro ? " 🔒" : ""}</button>
                </div>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: MUTED, cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ---- Corps : rail outils | canvas | proprietes ---- */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Assistant debutant (colonne guidee) */}
        {wizard > 0 && (() => {
          const metier = METIERS.find(m => m.id === wizMetier)
          return (
            <div className="qr-scroll ps-fly" style={{ width: 300, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: SURFACE, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                <span style={{ color: G, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={14} /> Création guidée</span>
                <button type="button" onClick={() => setWizard(0)} aria-label="Fermer l'assistant"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 7, color: MUTED, cursor: "pointer" }}>
                  <X size={13} />
                </button>
              </div>

              {/* Fil d'etapes */}
              <div style={{ display: "flex", gap: 6, padding: "10px 14px", flexShrink: 0 }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: wizard >= s ? G : "rgba(255,255,255,0.1)" }} />
                ))}
              </div>

              <div className="qr-scroll" style={{ flex: 1, overflowY: "auto", padding: "6px 14px 18px" }}>
                {/* Etape 1 : metier */}
                {wizard === 1 && (
                  <>
                    <p style={{ color: INK, fontSize: 14, fontWeight: 700, margin: "4px 0 3px" }}>Quel est ton métier ?</p>
                    <p style={{ color: MUTED, fontSize: 11, margin: "0 0 12px", lineHeight: 1.4 }}>On adapte les designs à ton activité.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                      {METIERS.map(m => (
                        <button key={m.id} type="button" onClick={() => { setWizMetier(m.id); setWizard(2) }}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "12px 6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, cursor: "pointer" }}>
                          <span style={{ fontSize: 22 }}>{m.emoji}</span>
                          <span style={{ color: INK, fontSize: 11, fontWeight: 600, textAlign: "center" }}>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Etape 2 : objectif -> generation auto */}
                {wizard === 2 && metier && (
                  <>
                    <button type="button" onClick={() => setWizard(1)} style={{ background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", padding: 0, marginBottom: 8 }}>← Métier</button>
                    <p style={{ color: INK, fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>{metier.emoji} Ton objectif ?</p>
                    <p style={{ color: MUTED, fontSize: 11, margin: "0 0 12px", lineHeight: 1.4 }}>Clique : on génère tout (design, couleurs, textes, QR).</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {metier.objs.map((o, i) => (
                        <button key={i} type="button" onClick={() => generate(metier, o)}
                          style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", background: "linear-gradient(90deg,rgba(201,168,76,0.14),rgba(201,168,76,0.05))", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
                          <Sparkles size={14} color={G} style={{ flexShrink: 0 }} />
                          <span style={{ color: INK, fontSize: 12.5, fontWeight: 600 }}>{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Etape 3 : pret */}
                {wizard === 3 && (
                  <>
                    <button type="button" onClick={() => setWizard(2)} style={{ background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", padding: 0, marginBottom: 8 }}>← Objectif</button>
                    <p style={{ color: INK, fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>C&apos;est prêt ! 🎉</p>
                    <p style={{ color: MUTED, fontSize: 11, margin: "0 0 12px", lineHeight: 1.4 }}>Régénère un autre objectif, exporte, ou personnalise tout en mode avancé.</p>
                    {metier && (
                      <>
                        <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 6px" }}>Autre objectif</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                          {metier.objs.map((o, i) => (
                            <button key={i} type="button" onClick={() => generate(metier, o)}
                              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer", textAlign: "left" }}>
                              <Sparkles size={12} color={G} style={{ flexShrink: 0 }} />
                              <span style={{ color: INK, fontSize: 11, fontWeight: 600 }}>{o.label}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <button type="button" onClick={() => save()} disabled={saving}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", marginBottom: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: INK, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      <Save size={14} /> {saved ? "Enregistré ✓" : "Enregistrer"}
                    </button>
                    <button type="button" onClick={exportPng} disabled={exporting}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", marginBottom: 8, background: "linear-gradient(90deg,#C9A84C,#b8953f)", border: "none", borderRadius: 10, color: "#080808", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      <Download size={14} /> Télécharger en PNG
                    </button>
                    <button type="button" onClick={() => setWizard(0)}
                      style={{ width: "100%", padding: "10px", background: "none", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 10, color: MUTED, fontSize: 11.5, cursor: "pointer" }}>
                      Tout personnaliser (mode avancé) →
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })()}

        {/* Rail outils */}
        {wizard === 0 && (
        <div style={{ width: 76, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 6, background: SURFACE }}>
          <button type="button" onClick={() => { setTplOpen(v => !v); setLibOpen(false); setSide(""); setWizard(0) }}
            style={{ ...btnTool, background: tplOpen ? "rgba(201,168,76,0.16)" : "linear-gradient(180deg,rgba(201,168,76,0.14),rgba(201,168,76,0.05))", border: `1px solid ${tplOpen ? G : "rgba(201,168,76,0.3)"}`, color: tplOpen ? G : INK, fontWeight: 700 }}>
            <LayoutTemplate size={16} /> Modèles
          </button>
          <p style={{ color: MUTED, fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "6px 0 2px" }}>Ajouter</p>
          {([
            ["text", "Texte", <TypeIcon size={16} key="i" />],
            ["shapes", "Formes", <Shapes size={16} key="i" />],
            ["lines", "Lignes", <Minus size={16} key="i" />],
            ["frames", "Cadres", <Square size={16} key="i" />],
          ] as const).map(([cat, label, icon]) => {
            const on = libOpen && libCat === cat
            return (
              <button key={cat} type="button" onClick={() => openLib(cat)}
                style={{ ...btnTool, background: on ? "rgba(201,168,76,0.16)" : btnTool.background, border: `1px solid ${on ? G : "rgba(255,255,255,0.07)"}`, color: on ? G : INK }}>
                {icon} {label}
              </button>
            )
          })}
          <button type="button" onClick={addQr} style={btnTool}><QrCode size={16} /> QR</button>
          <button type="button" onClick={() => fileRef.current?.click()} style={btnTool}><ImageIcon size={16} /> Image</button>
          <button type="button" onClick={() => openLib("cta")}
            style={{ ...btnTool, marginTop: 4, background: (libOpen && ["cta", "icons", "badges", "arrows"].includes(libCat)) ? "rgba(201,168,76,0.16)" : "linear-gradient(180deg,rgba(201,168,76,0.12),rgba(201,168,76,0.05))", border: `1px solid ${(libOpen && ["cta", "icons", "badges", "arrows"].includes(libCat)) ? G : "rgba(201,168,76,0.3)"}`, color: INK, fontWeight: 700 }}>
            <MousePointerClick size={16} /> Éléments
          </button>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => openSide("styles")}
            style={{ ...btnTool, background: side === "styles" ? "rgba(201,168,76,0.16)" : btnTool.background, border: `1px solid ${side === "styles" ? G : "rgba(255,255,255,0.07)"}`, color: side === "styles" ? G : INK }}>
            <Palette size={16} /> Styles
          </button>
          <button type="button" onClick={() => openSide("layers")}
            style={{ ...btnTool, background: side === "layers" ? "rgba(201,168,76,0.16)" : btnTool.background, border: `1px solid ${side === "layers" ? G : "rgba(255,255,255,0.07)"}`, color: side === "layers" ? G : INK }}>
            <Copy size={16} /> Calques
          </button>
          <button type="button" onClick={() => openSide("bg")}
            style={{ ...btnTool, background: side === "bg" ? "rgba(201,168,76,0.16)" : btnTool.background, border: `1px solid ${side === "bg" ? G : "rgba(255,255,255,0.07)"}`, color: side === "bg" ? G : INK }}>
            <Square size={16} /> Fond
          </button>
        </div>
        )}

        {/* Modeles orientes objectif (flyout) */}
        {tplOpen && (
          <div className="qr-scroll ps-fly" style={{ width: 250, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: SURFACE, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ color: INK, fontWeight: 800, fontSize: 12.5 }}>Modèles par objectif</span>
              <button type="button" onClick={() => setTplOpen(false)} aria-label="Fermer les modèles"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 7, color: MUTED, cursor: "pointer" }}>
                <X size={13} />
              </button>
            </div>
            <div style={{ padding: "10px 12px 0", flexShrink: 0 }}>
              <input value={tplSearch} onChange={e => setTplSearch(e.target.value)} placeholder="Rechercher un modèle…"
                style={{ width: "100%", background: BG, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: INK, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div className="qr-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 10px 16px" }}>
              {["Avis", "Menu", "Réserver", "Abonnés", "Contact", "Page"].map(obj => {
                const q = tplSearch.trim().toLowerCase()
                const items = PRINT_TEMPLATES.filter(t => t.obj === obj && (!q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || obj.toLowerCase().includes(q)))
                if (!items.length) return null
                return (
                  <div key={obj} style={{ marginBottom: 12 }}>
                    <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 6px" }}>{obj}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {items.map(t => (
                        <button key={t.id} type="button" onClick={() => applyTemplate(t.id)} title={t.desc}
                          style={{ display: "flex", flexDirection: "column", gap: 5, padding: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, cursor: "pointer" }}>
                          {tplThumb(t)}
                          <span style={{ color: INK, fontSize: 10, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              <p style={{ color: MUTED, fontSize: 9, margin: "4px 2px 0", lineHeight: 1.4 }}>
                Un modèle remplace le contenu actuel. Tout reste ensuite modifiable (textes, couleurs, position…).
              </p>
            </div>
          </div>
        )}

        {/* Bibliotheque d'elements (flyout) */}
        {libOpen && (
          <div className="qr-scroll ps-fly" style={{ width: 234, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: SURFACE, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ color: INK, fontWeight: 800, fontSize: 12.5 }}>Bibliothèque</span>
              <button type="button" onClick={() => setLibOpen(false)} aria-label="Fermer la bibliothèque"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 7, color: MUTED, cursor: "pointer" }}>
                <X size={13} />
              </button>
            </div>

            <div className="qr-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 10px 16px" }}>
              {/* Texte */}
              <div id="lib-text" style={{ marginBottom: 16 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Texte</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {([
                    { text: "Titre", size: 54, weight: "bold", font: "Cormorant Garamond", label: "Titre", pv: 22 },
                    { text: "Sous-titre", size: 30, weight: "normal", font: "Montserrat", label: "Sous-titre", pv: 15 },
                    { text: "Votre texte ici", size: 20, weight: "normal", font: "Arial", label: "Corps de texte", pv: 12 },
                    { text: "TITRE", size: 62, weight: "bold", font: "Bebas Neue", label: "Titre impact", pv: 20 },
                    { text: "Merci", size: 46, weight: "normal", font: "Pacifico", label: "Manuscrit", pv: 20 },
                    { text: "Élégance", size: 50, weight: "bold", font: "Playfair Display", label: "Titre chic", pv: 21 },
                    { text: "Nouveauté", size: 34, weight: "bold", font: "Oswald", label: "Accroche condensée", pv: 17 },
                    { text: "« Citation »", size: 28, weight: "normal", font: "Cormorant Garamond", label: "Citation", pv: 16 },
                    { text: "Bienvenue", size: 40, weight: "normal", font: "Dancing Script", label: "Script élégant", pv: 20 },
                  ] as const).map((p, i) => (
                    <button key={i} type="button" onClick={() => addTextPreset(p)}
                      style={{ width: "100%", textAlign: "left", padding: "11px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer", color: INK, fontFamily: p.font, fontSize: p.pv, fontWeight: p.weight as any }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Lignes & separateurs */}
              <div id="lib-lines" style={{ marginBottom: 16 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Lignes</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {([
                    ["solid", "Pleine", { sw: 2 }], ["thick", "Épaisse", { sw: 5 }], ["thin", "Fine", { sw: 1 }],
                    ["dashed", "Pointillés", { sw: 2, dash: "7,5" }], ["dotted", "Points", { sw: 3, dash: "0.5,6", round: true }],
                    ["double", "Double", { double: true }], ["ornament", "Ornement", { orn: true }],
                  ] as const).map(([k, label, o]) => (
                    <button key={k} type="button" onClick={() => addLineVariant(k)} title={label}
                      style={{ display: "flex", flexDirection: "column", gap: 5, padding: "9px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer" }}>
                      <svg width="100%" height="14" viewBox="0 0 100 14" preserveAspectRatio="none">
                        {"double" in o && (o as any).double ? (
                          <>
                            <line x1="2" y1="5" x2="98" y2="5" stroke={G} strokeWidth="2" />
                            <line x1="2" y1="9" x2="98" y2="9" stroke={G} strokeWidth="2" />
                          </>
                        ) : "orn" in o && (o as any).orn ? (
                          <>
                            <line x1="2" y1="7" x2="98" y2="7" stroke={G} strokeWidth="2" />
                            <rect x="46" y="3" width="8" height="8" fill={G} transform="rotate(45 50 7)" />
                          </>
                        ) : (
                          <line x1="2" y1="7" x2="98" y2="7" stroke={G} strokeWidth={(o as any).sw} strokeDasharray={(o as any).dash} strokeLinecap={(o as any).round ? "round" : "butt"} />
                        )}
                      </svg>
                      <span style={{ color: MUTED, fontSize: 9 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Cadres */}
              <div id="lib-frames" style={{ marginBottom: 16 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Cadres</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {([
                    ["filet", "Filet", 1, 0], ["thick", "Épais", 3, 0], ["double", "Double", 1, 0], ["rounded", "Arrondi", 2, 6],
                  ] as const).map(([k, label, sw, rx]) => (
                    <button key={k} type="button" onClick={() => addFrame(k)} title={label}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 2px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer" }}>
                      <svg width="36" height="46" viewBox="0 0 36 46">
                        <rect x="3" y="3" width="30" height="40" rx={rx} fill="none" stroke={G} strokeWidth={sw} />
                        {k === "double" && <rect x="6" y="6" width="24" height="34" fill="none" stroke={G} strokeWidth="0.7" />}
                      </svg>
                      <span style={{ color: MUTED, fontSize: 9 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* CTA */}
              <div id="lib-cta" style={{ marginBottom: 16 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Boutons CTA</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {["Scannez-moi", "Réservez", "Voir le menu", "Suivez-nous", "Commandez", "En savoir plus", "Laisser un avis", "Télécharger", "S'inscrire", "Nous trouver", "Profiter de l'offre", "Prendre RDV", "Rejoignez-nous", "Contactez-nous", "Voir plus", "Profitez-en"].map(l => (
                    <button key={l} type="button" onClick={() => addCTA(l)}
                      style={{ width: "100%", padding: "11px 0", borderRadius: 22, border: "none", cursor: "pointer", background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808", fontSize: 11.5, fontWeight: 800 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Icones */}
              <div id="lib-icons" style={{ marginBottom: 16 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Icônes</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {LIB_ICONS.map(ic => (
                    <button key={ic.key} type="button" onClick={() => addIcon(ic.d)} title={ic.label}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "9px 2px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24"><path d={ic.d} fill={INK} /></svg>
                      <span style={{ color: MUTED, fontSize: 8 }}>{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Badges & rubans */}
              <div id="lib-badges" style={{ marginBottom: 16 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Badges & rubans</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {([
                    ["NOUVEAU", "ribbon"], ["-20%", "ribbon"], ["-30%", "ribbon"], ["-50%", "ribbon"], ["PROMO", "seal"], ["TOP", "seal"], ["VIP", "seal"], ["GRATUIT", "ribbon"], ["OFFERT", "ribbon"], ["LIMITÉ", "ribbon"], ["EXCLU", "seal"], ["★★★★★", "ribbon"],
                  ] as const).map(([l, k]) => (
                    <button key={l} type="button" onClick={() => addBadge(l, k)}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 54, padding: "4px 8px", background: G, color: "#080808", fontSize: 10, fontWeight: 800, borderRadius: k === "seal" ? "50%" : 4, width: k === "seal" ? 32 : "auto", height: k === "seal" ? 32 : "auto" }}>{l}</span>
                      <span style={{ color: INK, fontSize: 10.5 }}>{k === "seal" ? "Sceau rond" : "Ruban"}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Formes */}
              <div id="lib-shapes" style={{ marginBottom: 16 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Formes</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {([
                    ["rrect", "Rectangle", <svg width="30" height="22" key="s"><rect x="2" y="3" width="26" height="16" rx="4" fill={G} /></svg>],
                    ["circle", "Cercle",   <svg width="24" height="24" key="s"><circle cx="12" cy="12" r="10" fill={G} /></svg>],
                    ["tri", "Triangle",    <svg width="26" height="24" key="s"><polygon points="13,2 24,22 2,22" fill={G} /></svg>],
                    ["star", "Étoile",     <svg width="24" height="24" viewBox="0 0 24 24" key="s"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={G} /></svg>],
                    ["hexa", "Hexagone",   <svg width="24" height="24" viewBox="0 0 24 24" key="s"><path d="M12 2l8.66 5v10L12 22 3.34 17V7z" fill={G} /></svg>],
                    ["diamond", "Losange", <svg width="24" height="24" viewBox="0 0 24 24" key="s"><polygon points="12,1 23,12 12,23 1,12" fill={G} /></svg>],
                    ["penta", "Pentagone", <svg width="24" height="24" viewBox="0 0 24 24" key="s"><polygon points="12,1 23,9.5 18.5,23 5.5,23 1,9.5" fill={G} /></svg>],
                    ["pill", "Pilule",     <svg width="30" height="18" key="s"><rect x="1" y="2" width="28" height="14" rx="7" fill={G} /></svg>],
                    ["banner", "Bandeau",  <svg width="30" height="16" key="s"><rect x="1" y="3" width="28" height="10" fill={G} /></svg>],
                    ["octo", "Octogone",   <svg width="24" height="24" viewBox="0 0 24 24" key="s"><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z" fill={G} /></svg>],
                    ["heart", "Cœur",      <svg width="24" height="24" viewBox="0 0 24 24" key="s"><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z" fill={G} /></svg>],
                    ["cross", "Croix",     <svg width="24" height="24" viewBox="0 0 24 24" key="s"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" fill={G} /></svg>],
                    ["tag", "Étiquette",   <svg width="30" height="20" viewBox="0 0 30 20" key="s"><polygon points="9,1 29,1 29,19 9,19 1,10" fill={G} /></svg>],
                    ["bubble", "Bulle",    <svg width="26" height="24" viewBox="0 0 26 24" key="s"><rect x="2" y="2" width="22" height="15" rx="4" fill={G} /><polygon points="6,16 14,16 6,23" fill={G} /></svg>],
                  ] as const).map(([k, label, prev]) => (
                    <button key={k} type="button" onClick={() => addShape(k)} title={label}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 2px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer" }}>
                      {prev}
                      <span style={{ color: MUTED, fontSize: 8 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Fleches */}
              <div id="lib-arrows" style={{ marginBottom: 16 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Flèches</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {([["→", 0], ["↓", 90], ["←", 180], ["↑", 270]] as const).map(([sym, ang]) => (
                    <button key={ang} type="button" onClick={() => addArrow(ang)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "16px 0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer", color: G, fontSize: 22, fontWeight: 800 }}>
                      {sym}
                    </button>
                  ))}
                  <p style={{ gridColumn: "1 / 3", color: MUTED, fontSize: 9, margin: "2px 0 0", lineHeight: 1.4 }}>Astuce : fais pointer une flèche vers ton QR pour guider le scan.</p>
                </div>
              </div>
              {/* Decorations */}
              <div id="lib-deco" style={{ marginBottom: 4 }}>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Décorations</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {([
                    ["sparkle", "Étincelle", <svg width="24" height="24" viewBox="0 0 24 24" key="d"><path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={G} /></svg>],
                    ["burst", "Éclat",       <svg width="24" height="24" viewBox="0 0 24 24" key="d"><path d="M12 2l1.8 4.5 4.7-1.6-1.6 4.7L21.4 12l-4.5 1.4 1.6 4.7-4.7-1.6L12 21l-1.8-4.5-4.7 1.6 1.6-4.7L2.6 12l4.5-1.4-1.6-4.7 4.7 1.6z" fill={G} /></svg>],
                    ["ring", "Anneau",       <svg width="24" height="24" key="d"><circle cx="12" cy="12" r="9" fill="none" stroke={G} strokeWidth="3" /></svg>],
                    ["dots", "Points",       <svg width="34" height="14" key="d">{[3, 11, 19, 27].map(x => <circle key={x} cx={x} cy="7" r="3" fill={G} />)}</svg>],
                    ["wave", "Vague",        <svg width="34" height="14" viewBox="0 0 34 14" key="d"><polyline points="1,11 7,3 13,11 19,3 25,11 31,3" fill="none" stroke={G} strokeWidth="2" /></svg>],
                    ["confetti", "Confettis", <svg width="26" height="24" viewBox="0 0 26 24" key="d">{[[2, 2, 12], [12, 8, -20], [20, 3, 25], [7, 15, 35], [18, 16, -15]].map(([x, y, a], i) => <rect key={i} x={x} y={y} width="4" height="8" rx="1" fill={G} transform={`rotate(${a} ${x + 2} ${y + 4})`} />)}</svg>],
                    ["stars3", "Étoiles",  <svg width="26" height="22" viewBox="0 0 26 22" key="d">{[[5, 11, 4.5], [14, 5, 6], [21, 13, 4]].map(([cx, cy, r], i) => <path key={i} d="M0 -1L0.3 -0.3L1 -0.3L0.4 0.2L0.6 1L0 0.5L-0.6 1L-0.4 0.2L-1 -0.3L-0.3 -0.3Z" fill={G} transform={`translate(${cx} ${cy}) scale(${r})`} />)}</svg>],
                    ["dotgrid", "Grille",  <svg width="24" height="24" key="d">{[4, 11, 18].map(y => [4, 11, 18].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={G} />))}</svg>],
                    ["chevrons", "Chevrons", <svg width="26" height="20" viewBox="0 0 26 20" key="d">{[2, 10, 18].map((x, i) => <polyline key={i} points={`${x},3 ${x + 7},10 ${x},17`} fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" />)}</svg>],
                    ["corners", "Angles",  <svg width="26" height="20" viewBox="0 0 26 20" key="d"><path d="M2 7V2h5M19 2h5v5M24 13v5h-5M7 18H2v-5" fill="none" stroke={G} strokeWidth="2.2" /></svg>],
                    ["swoosh", "Trait",    <svg width="26" height="14" viewBox="0 0 26 14" key="d"><path d="M2 9 Q13 1 24 7" fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" /></svg>],
                  ] as const).map(([k, label, prev]) => (
                    <button key={k} type="button" onClick={() => addDeco(k)} title={label}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 2px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer" }}>
                      {prev}
                      <span style={{ color: MUTED, fontSize: 8 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panneau Styles globaux (gauche) */}
        {side === "styles" && (
          <div className="qr-scroll ps-fly" style={{ width: 250, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: SURFACE, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ color: INK, fontWeight: 800, fontSize: 12.5 }}>Styles</span>
              <button type="button" onClick={() => setSide("")} aria-label="Fermer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 7, color: MUTED, cursor: "pointer" }}><X size={13} /></button>
            </div>
            <div className="qr-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 12px 16px" }}>
              <p style={{ color: MUTED, fontSize: 10, margin: "0 0 10px", lineHeight: 1.4 }}>Un clic restyle tout le design (couleurs, polices, accents).</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {GLOBAL_STYLES.map(s => (
                  <button key={s.id} type="button" onClick={() => applyStyle(s)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ display: "flex", flexShrink: 0, width: 44, height: 34, borderRadius: 7, overflow: "hidden", border: "1px solid rgba(0,0,0,0.25)" }}>
                      <span style={{ flex: 1, background: s.bg }} />
                      <span style={{ width: 14, background: s.accent }} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", color: INK, fontSize: 12, fontWeight: 700, fontFamily: s.titleFont }}>{s.label}</span>
                      <span style={{ display: "block", color: MUTED, fontSize: 9 }}>{s.titleFont}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Panneau Calques (gauche) */}
        {side === "layers" && (
          <div className="qr-scroll ps-fly" style={{ width: 250, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: SURFACE, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ color: INK, fontWeight: 800, fontSize: 12.5 }}>Calques</span>
              <button type="button" onClick={() => setSide("")} aria-label="Fermer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 7, color: MUTED, cursor: "pointer" }}><X size={13} /></button>
            </div>
            <div className="qr-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 12px 16px" }}>
              {(() => {
                const items = layerList()
                const active = fcRef.current?.getActiveObject()
                if (!items.length) return <p style={{ color: MUTED, fontSize: 11 }}>Aucun élément. Ajoute du texte, une forme ou un modèle.</p>
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {items.map((o, idx) => {
                      const on = active === o
                      return (
                        <div key={idx} draggable
                          onDragStart={() => { dragIdxRef.current = idx }}
                          onDragOver={e => { e.preventDefault(); if (dragOver !== idx) setDragOver(idx) }}
                          onDragLeave={() => { if (dragOver === idx) setDragOver(null) }}
                          onDrop={() => { if (dragIdxRef.current !== null) reorderLayers(dragIdxRef.current, idx); dragIdxRef.current = null; setDragOver(null) }}
                          onDragEnd={() => { dragIdxRef.current = null; setDragOver(null) }}
                          style={{ display: "flex", alignItems: "center", gap: 2, padding: "5px 7px", borderRadius: 7, background: on ? "rgba(201,168,76,0.14)" : "rgba(255,255,255,0.03)", border: `1px solid ${on ? G : "rgba(255,255,255,0.06)"}`, boxShadow: dragOver === idx ? `inset 0 2px 0 ${G}` : "none" }}>
                          <svg width="9" height="14" viewBox="0 0 9 14" style={{ cursor: "grab", flexShrink: 0, marginRight: 2 }}>
                            {[2.5, 7, 11.5].map((cy, r) => [2.5, 6.5].map((cx, c) => <circle key={`${r}-${c}`} cx={cx} cy={cy} r="1" fill={MUTED} />))}
                          </svg>
                          {editLayer === idx ? (
                            <input autoFocus defaultValue={layerName(o)}
                              onBlur={e => renameLayer(o, e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") renameLayer(o, (e.target as HTMLInputElement).value); else if (e.key === "Escape") setEditLayer(null) }}
                              style={{ flex: 1, minWidth: 0, background: BG, border: `1px solid ${G}`, borderRadius: 5, padding: "2px 5px", color: INK, fontSize: 10.5, outline: "none" }} />
                          ) : (
                            <button type="button" onClick={() => selectLayer(o)} onDoubleClick={() => setEditLayer(idx)} title="Double-clic pour renommer"
                              style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", color: on ? G : INK, fontSize: 10.5, cursor: "pointer", padding: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: o.visible ? 1 : 0.4 }}>
                              {layerName(o)}
                            </button>
                          )}
                          <button type="button" onClick={() => toggleVisible(o)} title="Afficher / masquer" style={iconMini}>
                            <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7zm0 11.5A4.5 4.5 0 1112 7a4.5 4.5 0 010 9.5z" fill={o.visible ? G : MUTED} /></svg>
                          </button>
                          <button type="button" onClick={() => moveLayer(o, "up")} title="Monter" style={iconMini}><ChevronUp size={13} /></button>
                          <button type="button" onClick={() => moveLayer(o, "down")} title="Descendre" style={iconMini}><ChevronDown size={13} /></button>
                          <button type="button" onClick={() => removeLayer(o)} title="Supprimer" style={{ ...iconMini, color: "#FF6B6B" }}><Trash2 size={12} /></button>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Panneau Fond + infos (gauche) */}
        {side === "bg" && (
          <div className="qr-scroll ps-fly" style={{ width: 250, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: SURFACE, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ color: INK, fontWeight: 800, fontSize: 12.5 }}>Fond &amp; infos</span>
              <button type="button" onClick={() => setSide("")} aria-label="Fermer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 7, color: MUTED, cursor: "pointer" }}><X size={13} /></button>
            </div>
            <div className="qr-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 12px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Fonds</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                  {BG_PRESETS.map(p => {
                    const active = bgGrad ? (p.type === "grad" && bgColor === p.c1 && bgC2 === p.c2) : (p.type === "solid" && bgColor === p.c1)
                    return (
                      <button key={p.id} type="button" onClick={() => applyBgPreset(p)} title={p.id}
                        style={{ width: "100%", aspectRatio: "1.3", borderRadius: 8, cursor: "pointer", border: `2px solid ${active ? G : "rgba(255,255,255,0.14)"}`, background: p.type === "grad" ? `linear-gradient(180deg, ${p.c1}, ${p.c2})` : p.c1, padding: 0 }} />
                    )
                  })}
                </div>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 6px" }}>Couleur personnalisée</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={/^#/.test(bgColor) ? bgColor : "#FFFFFF"} onChange={e => applyBg(e.target.value)}
                    style={{ width: 34, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0 }} />
                  <input value={bgColor} onChange={e => applyBg(e.target.value)}
                    style={{ flex: 1, background: BG, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px 9px", color: INK, fontSize: 11, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                </div>
                <button type="button" onClick={() => toggleGrad(!bgGrad)}
                  style={{ ...layerBtn, width: "100%", marginTop: 8, background: bgGrad ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", color: bgGrad ? G : INK, fontWeight: 700 }}>
                  Dégradé {bgGrad ? "✓" : ""}
                </button>
                {bgGrad && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <input type="color" value={/^#/.test(bgC2) ? bgC2 : "#0A0A0A"} onChange={e => applyBgC2(e.target.value)}
                      style={{ width: 34, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0 }} />
                    <span style={{ color: MUTED, fontSize: 10 }}>2ᵉ couleur</span>
                  </div>
                )}
              </div>
              {infoVer >= 0 && (() => {
                const ros = roleObjects()
                if (!ros.length) return null
                return (
                  <div>
                    <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Infos du support</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ros.map(o => {
                        const role = (o as any).role as string
                        return (
                          <div key={role}>
                            <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 3 }}>{ROLE_LABEL[role] ?? role}</label>
                            <input value={roleValue(o)} onChange={e => updateRole(role, e.target.value)}
                              style={{ width: "100%", background: BG, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 9px", color: INK, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Zone canvas */}
        <div ref={scrollRef} onContextMenu={onCanvasContext} style={{ flex: 1, overflow: "auto", display: "flex", padding: 24, background: "#0A0907", position: "relative" }}>
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: MUTED, zIndex: 5, pointerEvents: "none" }}>
              <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} /> Chargement…
            </div>
          )}
          <div style={{ margin: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.15)", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
            <canvas ref={elRef} />
          </div>
        </div>

        {/* Panneau de reglages avances (ouvert via "Réglages") */}
        {sel && showAdvanced && (
        <div className="qr-scroll ps-fly" style={{ width: 280, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.07)", padding: 14, overflowY: "auto", background: SURFACE, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Élément sélectionné</p>

                {/* Texte du bouton / badge (groupe avec texte) */}
                {sel.label !== null && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Texte du bouton</label>
                    <input value={sel.label} onChange={e => setLabel(e.target.value)} placeholder="Votre texte"
                      style={{ width: "100%", background: BG, border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, padding: "7px 9px", color: INK, fontSize: 11, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                    {sel.textFill !== null && (
                      <>
                        <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Couleur du texte</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                          {SWATCHES.map(c => (
                            <button key={c} type="button" onClick={() => setTextColor(c)} title={c}
                              style={{ width: 22, height: 22, borderRadius: "50%", cursor: "pointer", background: c, border: (sel.textFill ?? "").toUpperCase() === c.toUpperCase() ? `2px solid ${G}` : "1px solid rgba(255,255,255,0.2)", padding: 0 }} />
                          ))}
                        </div>
                        <input type="color" value={/^#/.test(sel.textFill) ? sel.textFill : "#080808"}
                          onChange={e => setTextColor(e.target.value)}
                          style={{ width: 34, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0 }} />
                      </>
                    )}
                  </div>
                )}

                {/* Couleur (fond du groupe ou objet simple) */}
                <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>{sel.isGroup ? "Couleur du fond" : "Couleur"}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {SWATCHES.map(c => (
                    <button key={c} type="button" onClick={() => setFill(c)} title={c}
                      style={{ width: 22, height: 22, borderRadius: "50%", cursor: "pointer", background: c, border: sel.fill.toUpperCase() === c.toUpperCase() ? `2px solid ${G}` : "1px solid rgba(255,255,255,0.2)", padding: 0 }} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <input type="color" value={/^#/.test(sel.fill) ? sel.fill : "#C9A84C"}
                    onChange={e => setFill(e.target.value)}
                    style={{ width: 34, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0 }} />
                  <input value={sel.fill} onChange={e => setFill(e.target.value)}
                    style={{ flex: 1, background: BG, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px 9px", color: INK, fontSize: 11, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                </div>

                {/* Opacite */}
                <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>
                  Opacité — {Math.round(sel.opacity * 100)}%
                </label>
                <input type="range" min={0} max={1} step={0.05} value={sel.opacity}
                  onChange={e => mutate(o => o.set("opacity", parseFloat(e.target.value)))}
                  style={{ width: "100%", accentColor: G, marginBottom: 12 }} />

                {/* Bordure / contour */}
                <button type="button" onClick={() => setBorder(!sel.border)}
                  style={{ ...layerBtn, width: "100%", background: sel.border ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", color: sel.border ? G : INK, fontWeight: 700, marginBottom: sel.border ? 8 : 12 }}>
                  Bordure {sel.border ? "✓" : ""}
                </button>
                {sel.border && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <input type="color" value={/^#/.test(sel.strokeColor) ? sel.strokeColor : "#C9A84C"}
                        onChange={e => setBorderColor(e.target.value)}
                        style={{ width: 34, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0 }} />
                      <span style={{ color: MUTED, fontSize: 10 }}>Épaisseur — {Math.round(sel.strokeWidth)}px</span>
                    </div>
                    <input type="range" min={1} max={30} step={1} value={sel.strokeWidth || 4}
                      onChange={e => setBorderWidth(parseInt(e.target.value))}
                      style={{ width: "100%", accentColor: G }} />
                  </div>
                )}

                {/* Coins arrondis (rectangles) */}
                {sel.radius !== null && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Coins arrondis — {Math.round(sel.radius)}px</label>
                    <input type="range" min={0} max={80} step={1} value={sel.radius}
                      onChange={e => setRadius(parseInt(e.target.value))}
                      style={{ width: "100%", accentColor: G }} />
                  </div>
                )}

                {/* Texte uniquement */}
                {sel.isText && (
                  <>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Police</label>
                    <select value={sel.fontFamily}
                      onChange={e => setFont(e.target.value)}
                      style={{ width: "100%", background: BG, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px 9px", color: INK, fontSize: 11, outline: "none", cursor: "pointer", marginBottom: 10, boxSizing: "border-box" }}>
                      {FONT_GROUPS.map(g => (
                        <optgroup key={g.label} label={g.label}>
                          {g.fonts.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                        </optgroup>
                      ))}
                    </select>

                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>
                      Taille — {sel.fontSize}px
                    </label>
                    <input type="range" min={10} max={140} step={1} value={sel.fontSize}
                      onChange={e => mutate(o => (o as fabric.IText).set("fontSize", parseInt(e.target.value)))}
                      style={{ width: "100%", accentColor: G, marginBottom: 10 }} />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                      <button type="button" title="Gras"
                        onClick={() => mutate(o => (o as fabric.IText).set("fontWeight", sel.bold ? "normal" : "bold"))}
                        style={{ ...layerBtn, background: sel.bold ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", color: sel.bold ? G : INK, fontWeight: 800 }}>
                        B
                      </button>
                      <button type="button" title="Italique"
                        onClick={() => mutate(o => (o as fabric.IText).set("fontStyle", sel.italic ? "normal" : "italic"))}
                        style={{ ...layerBtn, background: sel.italic ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", color: sel.italic ? G : INK, fontStyle: "italic", fontWeight: 700 }}>
                        I
                      </button>
                      <button type="button" title="Souligné"
                        onClick={() => mutate(o => (o as fabric.IText).set("underline", !sel.underline))}
                        style={{ ...layerBtn, background: sel.underline ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", color: sel.underline ? G : INK, textDecoration: "underline", fontWeight: 700 }}>
                        U
                      </button>
                    </div>

                    {/* Alignement du texte */}
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Alignement</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                      {(["left", "center", "right"] as const).map(a => {
                        const on = sel.textAlign === a
                        const bars = a === "left" ? [[1, 14], [1, 9], [1, 12]] : a === "center" ? [[1, 14], [4, 8], [2.5, 11]] : [[1, 14], [6, 9], [3, 12]]
                        return (
                          <button key={a} type="button" onClick={() => mutate(o => (o as fabric.IText).set("textAlign", a))} title={a}
                            style={{ ...layerBtn, padding: "7px", background: on ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)" }}>
                            <svg width="16" height="16" viewBox="0 0 16 16">
                              {bars.map(([x, w], i) => <rect key={i} x={x} y={3 + i * 4} width={w} height="2" rx="1" fill={on ? G : MUTED} />)}
                            </svg>
                          </button>
                        )
                      })}
                    </div>

                    {/* Espacement des lettres */}
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Espacement — {Math.round(sel.charSpacing)}</label>
                    <input type="range" min={0} max={800} step={10} value={sel.charSpacing}
                      onChange={e => mutate(o => (o as fabric.IText).set("charSpacing", parseInt(e.target.value)))}
                      style={{ width: "100%", accentColor: G, marginBottom: 10 }} />

                    {/* Interligne */}
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Interligne — {sel.lineHeight.toFixed(2)}</label>
                    <input type="range" min={0.8} max={2} step={0.05} value={sel.lineHeight}
                      onChange={e => mutate(o => (o as fabric.IText).set("lineHeight", parseFloat(e.target.value)))}
                      style={{ width: "100%", accentColor: G }} />
                  </>
                )}
              </div>

              {/* Effets */}
              <div>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Effets</p>
                <button type="button" onClick={() => setShadow(!sel.shadow)}
                  style={{ ...layerBtn, width: "100%", background: sel.shadow ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", color: sel.shadow ? G : INK, fontWeight: 700, marginBottom: sel.shadow ? 8 : 0 }}>
                  Ombre portée {sel.shadow ? "✓" : ""}
                </button>
                {sel.shadow && (
                  <>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Flou — {Math.round(sel.shadowBlur)}px</label>
                    <input type="range" min={0} max={60} step={1} value={sel.shadowBlur}
                      onChange={e => setShadowBlur(parseInt(e.target.value))}
                      style={{ width: "100%", accentColor: G }} />
                  </>
                )}
              </div>

              {/* Alignement sur le support */}
              <div>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Aligner sur le support</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {([
                    ["left", "Gauche", "v", 1.5], ["centerH", "Centre H", "v", 7], ["right", "Droite", "v", 12.5],
                    ["top", "Haut", "h", 1.5], ["centerV", "Centre V", "h", 7], ["bottom", "Bas", "h", 12.5],
                  ] as const).map(([action, label, axis, pos]) => (
                    <button key={action} type="button" onClick={() => align(action)} title={label}
                      style={{ ...layerBtn, padding: "7px" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <rect x="0.5" y="0.5" width="15" height="15" rx="2" fill="none" stroke={MUTED} strokeWidth="1" />
                        {axis === "v"
                          ? <rect x={pos} y="3" width="2" height="10" rx="1" fill={G} />
                          : <rect x="3" y={pos} width="10" height="2" rx="1" fill={G} />}
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions rapides */}
              <div>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Actions</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <button type="button" onClick={() => layer("dup")}   style={layerBtn}><Copy size={12} /> Dupliquer</button>
                  <button type="button" onClick={() => layer("lock")}  style={{ ...layerBtn, color: sel.locked ? G : INK }}>
                    {sel.locked ? <Lock size={12} /> : <Unlock size={12} />} {sel.locked ? "Verr." : "Libre"}
                  </button>
                  <button type="button" onClick={() => flip("x")} style={layerBtn} title="Miroir horizontal">⇆ Miroir H</button>
                  <button type="button" onClick={() => flip("y")} style={layerBtn} title="Miroir vertical">⇅ Miroir V</button>
                  {sel.multi && <button type="button" onClick={groupSel} style={{ ...layerBtn, gridColumn: "1 / 3", color: G }}>⊞ Grouper</button>}
                  {sel.isGroupObj && <button type="button" onClick={ungroupSel} style={{ ...layerBtn, gridColumn: "1 / 3" }}>⊟ Dégrouper</button>}
                </div>
                <button type="button" onClick={() => layer("del")}
                  style={{ ...layerBtn, width: "100%", marginTop: 6, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)", color: "#FF6B6B" }}>
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            </div>
        )}

        {/* Garde-fou scannabilite du QR */}
        {qrIssues && (
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 39, display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", background: "rgba(40,28,8,0.92)", border: "1px solid rgba(249,158,46,0.5)", borderRadius: 10, color: "#F9C46E", fontSize: 11, fontWeight: 600, maxWidth: 260, boxShadow: "0 8px 22px rgba(0,0,0,0.4)" }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span>{qrIssues.covered ? "Un élément couvre le QR — il risque de ne pas se scanner." : "QR un peu petit : agrandis-le pour un scan fiable."}</span>
          </div>
        )}

        {/* Barre contextuelle flottante (progressive disclosure) */}
        {sel && (
          <div className="ps-pop" style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 40, display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#14120C", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", maxWidth: "92%", flexWrap: "wrap" }}>
            {sel.isText ? (
              <>
                <input type="color" value={/^#/.test(sel.fill) ? sel.fill : "#C9A84C"} onChange={e => setFill(e.target.value)} style={swatch} />
                <button type="button" style={tb} title="Réduire" onClick={() => mutate(o => (o as fabric.IText).set("fontSize", Math.max(8, sel.fontSize - 2)))}>A−</button>
                <span style={{ color: MUTED, fontSize: 11, minWidth: 22, textAlign: "center" }}>{Math.round(sel.fontSize)}</span>
                <button type="button" style={tb} title="Agrandir" onClick={() => mutate(o => (o as fabric.IText).set("fontSize", sel.fontSize + 2))}>A+</button>
                <button type="button" style={{ ...tb, color: sel.bold ? G : INK, fontWeight: 800 }} onClick={() => mutate(o => (o as fabric.IText).set("fontWeight", sel.bold ? "normal" : "bold"))}>B</button>
                <button type="button" style={{ ...tb, color: sel.italic ? G : INK, fontStyle: "italic" }} onClick={() => mutate(o => (o as fabric.IText).set("fontStyle", sel.italic ? "normal" : "italic"))}>I</button>
                <button type="button" style={{ ...tb, color: sel.underline ? G : INK, textDecoration: "underline" }} onClick={() => mutate(o => (o as fabric.IText).set("underline", !sel.underline))}>U</button>
              </>
            ) : sel.label !== null ? (
              <>
                <input value={sel.label} onChange={e => setLabel(e.target.value)} placeholder="Texte"
                  style={{ background: BG, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, padding: "5px 8px", color: INK, fontSize: 11, width: 130, outline: "none" }} />
                <input type="color" value={/^#/.test(sel.fill) ? sel.fill : "#C9A84C"} onChange={e => setFill(e.target.value)} style={swatch} title="Couleur du fond" />
              </>
            ) : (
              <input type="color" value={/^#/.test(sel.fill) ? sel.fill : "#C9A84C"} onChange={e => setFill(e.target.value)} style={swatch} title="Couleur" />
            )}
            {SWATCHES.slice(0, 8).map(c => (
              <button key={c} type="button" onClick={() => setFill(c)} title={c}
                style={{ width: 18, height: 18, borderRadius: "50%", cursor: "pointer", background: c, border: sel.fill.toUpperCase() === c.toUpperCase() ? `2px solid ${G}` : "1px solid rgba(255,255,255,0.25)", padding: 0, flexShrink: 0 }} />
            ))}
            <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.12)" }} />
            <button type="button" style={tb} title="Dupliquer" onClick={() => layer("dup")}><Copy size={14} /></button>
            <button type="button" style={tb} title="Mettre devant" onClick={() => layer("front")}><ChevronUp size={14} /></button>
            <button type="button" style={tb} title="Mettre derrière" onClick={() => layer("back")}><ChevronDown size={14} /></button>
            <button type="button" style={{ ...tb, color: sel.locked ? G : INK }} title={sel.locked ? "Déverrouiller" : "Verrouiller"} onClick={() => layer("lock")}>{sel.locked ? <Unlock size={14} /> : <Lock size={14} />}</button>
            <button type="button" style={{ ...tb, color: "#FF6B6B" }} title="Supprimer" onClick={() => layer("del")}><Trash2 size={14} /></button>
            <button type="button" onClick={() => setShowAdvanced(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: showAdvanced ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.06)", border: `1px solid ${showAdvanced ? G : "rgba(255,255,255,0.1)"}`, borderRadius: 8, color: showAdvanced ? G : INK, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Réglages {showAdvanced ? "▸" : ""}
            </button>
          </div>
        )}

        {/* Astuce d'accueil (masquable) : guide le debutant quand rien n'est selectionne */}
        {!sel && !hintOff && (
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", zIndex: 35, display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(20,18,12,0.92)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.45)", maxWidth: "90%" }}>
            <Sparkles size={13} color={G} style={{ flexShrink: 0 }} />
            <span style={{ color: INK, fontSize: 11.5 }}>Choisis un <b>modèle</b> à gauche, ou <b>double-clique</b> ici pour ajouter du texte.</span>
            <button type="button" onClick={() => setHintOff(true)} aria-label="Masquer l'astuce"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, color: MUTED, cursor: "pointer", flexShrink: 0 }}><X size={11} /></button>
          </div>
        )}
      </div>

      {/* Aide & raccourcis */}
      {showHelp && (
        <div onClick={() => setShowHelp(false)} style={{ position: "fixed", inset: 0, zIndex: 4200, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "DM Sans, sans-serif" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "min(560px,100%)", maxHeight: "86vh", overflowY: "auto", background: SURFACE, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ color: INK, fontWeight: 800, fontSize: 16 }}>Aide & raccourcis</span>
              <button type="button" onClick={() => setShowHelp(false)} aria-label="Fermer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: MUTED, cursor: "pointer" }}><X size={14} /></button>
            </div>
            <p style={{ color: G, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>Astuces</p>
            <ul style={{ color: INK, fontSize: 12.5, lineHeight: 1.7, margin: "0 0 16px", paddingLeft: 18 }}>
              <li>Choisis un <b>modèle</b> dans la galerie, puis personnalise tout.</li>
              <li><b>Double-clic</b> sur une zone vide = ajouter un texte.</li>
              <li><b>Double-clic</b> sur un texte = l'éditer.</li>
              <li>Sélectionne un élément pour voir la <b>barre d'outils flottante</b> (couleur, calques, réglages).</li>
              <li>Le <b>guide doré</b> apparaît quand un élément est centré.</li>
              <li>Ton QR reste net : ne le déforme pas (garde-fou intégré).</li>
            </ul>
            <p style={{ color: G, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>Raccourcis clavier</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
              {([
                ["Suppr", "Supprimer la sélection"], ["Ctrl + C / V", "Copier / Coller"],
                ["Ctrl + D", "Dupliquer"], ["Ctrl + Z / Y", "Annuler / Rétablir"],
                ["Ctrl + A", "Tout sélectionner"], ["Ctrl + G", "Grouper"],
                ["Ctrl + Maj + G", "Dégrouper"], ["Ctrl + + / − / 0", "Zoom"],
                ["Flèches", "Déplacer (Maj = plus vite)"], ["Échap", "Désélectionner"],
              ] as const).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <kbd style={{ flexShrink: 0, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, padding: "2px 7px", color: INK, fontSize: 10.5, fontWeight: 600, fontFamily: "monospace" }}>{k}</kbd>
                  <span style={{ color: MUTED }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apercu en situation (mockup) */}
      {mockOpen && (() => {
        const scenes: Record<string, { bg: string; transform: string; maxH: string; glass?: boolean; frame?: boolean }> = {
          wall:   { bg: "linear-gradient(180deg,#ece7dd 0%,#ddd6ca 62%,#c7bfb0 62%,#b4ac9c 100%)", transform: "none", maxH: "74%" },
          table:  { bg: "linear-gradient(180deg,#3a2a1c,#5a4330)", transform: "perspective(1300px) rotateX(50deg)", maxH: "62%" },
          window: { bg: "linear-gradient(135deg,#d3e6ed,#a9c6d2 55%,#8aacba)", transform: "rotate(-2deg)", maxH: "62%", glass: true },
          desk:   { bg: "linear-gradient(180deg,#2c2c31,#191920)", transform: "perspective(1500px) rotateX(44deg) rotateZ(-3deg)", maxH: "56%" },
          cadre:  { bg: "linear-gradient(180deg,#e6ded2,#cdc4b4)", transform: "none", maxH: "70%", frame: true },
          counter:{ bg: "linear-gradient(180deg,#d9d2c6 0%,#cfc7b8 54%,#8d7f6a 54%,#6f6353 100%)", transform: "perspective(1400px) rotateX(38deg)", maxH: "58%" },
        }
        const s = scenes[mockEnv]
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
              <span style={{ color: INK, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}><Eye size={15} /> Aperçu en situation</span>
              <button type="button" onClick={() => setMockOpen(false)} aria-label="Fermer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, color: INK, cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", paddingBottom: 12 }}>
              {([["wall", "Mur"], ["table", "Table"], ["window", "Vitrine"], ["desk", "Bureau"], ["cadre", "Cadre"], ["counter", "Comptoir"]] as const).map(([id, l]) => (
                <button key={id} type="button" onClick={() => setMockEnv(id)}
                  style={{ padding: "7px 16px", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: mockEnv === id ? 700 : 500, background: mockEnv === id ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.05)", border: `1px solid ${mockEnv === id ? G : "rgba(255,255,255,0.1)"}`, color: mockEnv === id ? G : INK }}>{l}</button>
              ))}
            </div>
            <div style={{ flex: 1, margin: "0 16px 16px", borderRadius: 16, overflow: "hidden", position: "relative", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", perspective: "1400px" }}>
              {mockUrl && (s.frame
                ? <div style={{ maxHeight: s.maxH, maxWidth: "62%", padding: "3% 3% 3%", background: "linear-gradient(145deg,#3a2c18,#1c140a)", borderRadius: 4, boxShadow: "0 40px 70px rgba(0,0,0,0.5), 0 6px 14px rgba(0,0,0,0.35)", display: "flex" }}>
                    <div style={{ padding: "5%", background: "#fff" }}><img src={mockUrl} alt="aperçu" style={{ maxHeight: "100%", maxWidth: "100%", display: "block" }} /></div>
                  </div>
                : <img src={mockUrl} alt="aperçu" style={{ maxHeight: s.maxH, maxWidth: "62%", transform: s.transform, transformOrigin: "center", boxShadow: "0 40px 70px rgba(0,0,0,0.45), 0 6px 14px rgba(0,0,0,0.3)", borderRadius: 3 }} />)}
              {s.glass && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg,rgba(255,255,255,0.28) 0%,transparent 28%,transparent 70%,rgba(255,255,255,0.18) 100%)", pointerEvents: "none" }} />}
            </div>
          </div>
        )
      })()}

      {/* Menu clic-droit */}
      {ctx && (
        <>
          <div onClick={() => setCtx(null)} onContextMenu={e => { e.preventDefault(); setCtx(null) }} style={{ position: "fixed", inset: 0, zIndex: 3500 }} />
          <div style={{ position: "fixed", left: Math.min(ctx.x, (typeof window !== "undefined" ? window.innerWidth : 9999) - 180), top: ctx.y, zIndex: 3600, background: "#14120C", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: 6, minWidth: 168, boxShadow: "0 12px 36px rgba(0,0,0,0.6)" }}>
            {([
              ["Dupliquer", () => layer("dup")],
              ["Mettre devant", () => layer("front")],
              ["Mettre derrière", () => layer("back")],
              [sel?.locked ? "Déverrouiller" : "Verrouiller", () => layer("lock")],
              ["__del__", () => layer("del")],
            ] as const).map(([label, fn], i) => (
              <button key={i} type="button" onClick={() => { fn(); setCtx(null) }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", background: "none", border: "none", borderRadius: 7, color: label === "__del__" ? "#FF6B6B" : INK, fontSize: 12, cursor: "pointer" }}>
                {label === "__del__" ? "Supprimer" : label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
