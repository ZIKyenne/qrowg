// livretAccueil.ts — les modèles PURS du « livret d'accueil » (hôtel, gîte,
// location, 19 nov.) : la page que le voyageur scanne sur place, à la place du
// classeur papier. Quatre blocs : infos séjour, équipements, bonnes adresses,
// numéros utiles.
//
// Règles tenues : rien d'inventé (aucune adresse, aucun numéro d'hôte par
// défaut) ; les numéros d'urgence sont les VRAIS numéros français, et seulement
// si le commerçant les active ; une ligne sans nom n'existe pas.

import { extractIndexed, texteUtile } from "./repeaterExtract"
import { plafondDesLignes } from "./plafondDesLignes"

const lignes = (v: unknown) => texteUtile(v).split(/\r?\n/).map(s => s.replace(/^[-•*✓]\s*/, "").trim()).filter(Boolean)

// ── Infos séjour ───────────────────────────────────────────────────────────
export type InfosSejour = { arrivee: string; depart: string; acces: string; code: string; regles: string[]; avantDepart: string[] }

export function infosSejour(c: Record<string, any>): InfosSejour | null {
  const i: InfosSejour = {
    arrivee: texteUtile(c?.arrivee), depart: texteUtile(c?.depart), acces: texteUtile(c?.acces),
    code: texteUtile(c?.code), regles: lignes(c?.regles), avantDepart: lignes(c?.avant_depart),
  }
  const vide = !i.arrivee && !i.depart && !i.acces && !i.code && !i.regles.length && !i.avantDepart.length
  return vide ? null : i
}

// ── Équipements ────────────────────────────────────────────────────────────
export const EQUIPEMENTS = [
  { cle: "wifi", libelle: "Wi-Fi", icone: "📶" },
  { cle: "parking", libelle: "Parking", icone: "🅿️" },
  { cle: "piscine", libelle: "Piscine", icone: "🏊" },
  { cle: "clim", libelle: "Climatisation", icone: "❄️" },
  { cle: "chauffage", libelle: "Chauffage", icone: "🔥" },
  { cle: "cuisine", libelle: "Cuisine équipée", icone: "🍳" },
  { cle: "lave_linge", libelle: "Lave-linge", icone: "🧺" },
  { cle: "lave_vaisselle", libelle: "Lave-vaisselle", icone: "🍽️" },
  { cle: "tv", libelle: "Télévision", icone: "📺" },
  { cle: "linge", libelle: "Linge fourni", icone: "🛏️" },
  { cle: "petit_dej", libelle: "Petit-déjeuner", icone: "🥐" },
  { cle: "jardin", libelle: "Jardin / terrasse", icone: "🌿" },
  { cle: "barbecue", libelle: "Barbecue", icone: "🍖" },
  { cle: "animaux", libelle: "Animaux acceptés", icone: "🐾" },
  { cle: "pmr", libelle: "Accès PMR", icone: "♿" },
  { cle: "recharge", libelle: "Recharge véhicule électrique", icone: "🔌" },
  { cle: "bebe", libelle: "Équipement bébé", icone: "🍼" },
  { cle: "non_fumeur", libelle: "Non-fumeur", icone: "🚭" },
] as const
export type Equipement = { cle: string; libelle: string; icone: string }

/** Les équipements cochés (dans l'ordre de la liste), puis les « autres » saisis. */
export function equipements(c: Record<string, any>): Equipement[] {
  const coches = new Set(texteUtile(c?.liste).split(",").map(s => s.trim()))
  const connus = EQUIPEMENTS.filter(e => coches.has(e.cle)).map(e => ({ ...e }))
  const autres = lignes(c?.autres).map((l, i) => ({ cle: `autre_${i}`, libelle: l, icone: "✓" }))
  return [...connus, ...autres]
}

// ── Bonnes adresses ────────────────────────────────────────────────────────
export const CATEGORIES_ADRESSE = [
  { nom: "Restaurant", icone: "🍽️" }, { nom: "Boulangerie", icone: "🥖" }, { nom: "Courses", icone: "🛒" },
  { nom: "Plage", icone: "🏖️" }, { nom: "Visite", icone: "🏛️" }, { nom: "Balade", icone: "🥾" },
  { nom: "Santé", icone: "💊" }, { nom: "Transport", icone: "🚉" }, { nom: "Autre", icone: "📍" },
] as const

export type Adresse = { rang: number; nom: string; categorie: string; icone: string; distance: string; conseil: string; adresse: string; lien: string }

export function bonnesAdresses(c: Record<string, any>): Adresse[] {
  return extractIndexed<Adresse>(c || {}, plafondDesLignes("bonnes_adresses"), (src, i) => {
    const nom = texteUtile(src[`a${i}_name`])
    if (!nom) return null
    const cat = CATEGORIES_ADRESSE.find(x => x.nom === texteUtile(src[`a${i}_cat`])) ?? CATEGORIES_ADRESSE[CATEGORIES_ADRESSE.length - 1]
    return {
      rang: i, nom, categorie: cat.nom, icone: cat.icone, distance: texteUtile(src[`a${i}_distance`]),
      conseil: texteUtile(src[`a${i}_tip`]), adresse: texteUtile(src[`a${i}_address`]), lien: texteUtile(src[`a${i}_url`]),
    }
  })
}

// ── Numéros utiles ─────────────────────────────────────────────────────────
/** Les VRAIS numéros d'urgence en France — affichés seulement si le commerçant le choisit. */
export const URGENCES = [
  { nom: "Urgences (Europe)", numero: "112", sms: false },
  { nom: "SAMU", numero: "15", sms: false },
  { nom: "Police", numero: "17", sms: false },
  { nom: "Pompiers", numero: "18", sms: false },
  // Le 114 ne s'APPELLE pas : il reçoit SMS, fax et visio (personnes sourdes,
  // malentendantes, ou qui ne peuvent pas parler).
  { nom: "Urgences par SMS (sourds et malentendants)", numero: "114", sms: true },
] as const

export type Numero = { nom: string; numero: string; urgence: boolean; sms: boolean }

export function numerosUtiles(c: Record<string, any>): Numero[] {
  const propres = extractIndexed<Numero>(c || {}, plafondDesLignes("numeros_utiles"), (src, i) => {
    const nom = texteUtile(src[`n${i}_name`]), numero = texteUtile(src[`n${i}_phone`])
    return nom && numero ? { nom, numero, urgence: false, sms: false } : null
  })
  const urgences = String(c?.urgences ?? "") === "Oui" ? URGENCES.map(u => ({ ...u, urgence: true })) : []
  return [...propres, ...urgences]
}
