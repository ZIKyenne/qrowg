// commerceDeProximite.ts — les modèles PURS du commerce de proximité (boulangerie,
// fleuriste, primeur, épicerie — 19 nov.) :
//  · les FOURNÉES : l'horaire habituel des sorties du four, et la prochaine ;
//  · l'ARRIVAGE : une liste datée qui se tait quand sa durée est passée ;
//  · la COMMANDE À RETIRER : des quantités, un total ESTIMÉ, un message prêt.
//
// Rien n'est inventé : une fournée « sortie à 7 h » dit l'horaire, pas le stock ;
// un arrivage n'existe que le temps choisi ; le total est annoncé « estimé ».

import { texteUtile } from "./repeaterExtract"
import { jourDuCommerce } from "./platDuJour"
import { prixDansLaLigne } from "./lectureDeCarte"
import { chezLeCommerce, fuseauDuBloc } from "@/lib/heureDuCommerce"
import { fmtMinutes, parsePrice } from "../../types"

const lignes = (v: unknown) => texteUtile(v).split(/\r?\n/).map(l => l.trim()).filter(Boolean)

// ── Fournées ────────────────────────────────────────────────────────────────
export type Fournee = { minutes: number; heure: string; quoi: string }

/** « 7h Baguettes tradition » → { 420, "7h00", "Baguettes tradition" }. Triées. */
export function lireFournees(v: unknown): Fournee[] {
  const out: Fournee[] = []
  for (const l of lignes(v)) {
    const m = /^(\d{1,2})\s?[h:.]\s?(\d{2})?\s*[-–—:·]?\s*(.*)$/i.exec(l)
    if (!m) continue
    const h = Number(m[1]), mn = m[2] ? Number(m[2]) : 0
    if (h > 23 || mn > 59) continue
    out.push({ minutes: h * 60 + mn, heure: fmtMinutes(h * 60 + mn), quoi: m[3].trim() })
  }
  return out.sort((a, b) => a.minutes - b.minutes)
}

export type EtatFournees = { fournees: (Fournee & { sortie: boolean })[]; prochaine: Fournee | null; dansMin: number | null }

/** Chaque fournée : déjà sortie aujourd'hui ou à venir ; la prochaine, et dans combien de temps. */
export function etatFournees(c: Record<string, any>, now: Date): EtatFournees {
  const { minutes } = chezLeCommerce(now, fuseauDuBloc(c))
  const fournees = lireFournees(c?.fournees).map(f => ({ ...f, sortie: f.minutes <= minutes }))
  const prochaine = fournees.find(f => !f.sortie) ?? null
  return { fournees, prochaine, dansMin: prochaine ? prochaine.minutes - minutes : null }
}

/** « dans 45 min », « dans 2 h », « dans 1 h 15 ». */
export function dansLisible(min: number): string {
  if (min < 60) return `dans ${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `dans ${h} h ${String(m).padStart(2, "0")}` : `dans ${h} h`
}

// ── Articles (arrivage, commande) ───────────────────────────────────────────
export type Article = { rang: number; nom: string; prix: string; montant: number | null }

/** « Pivoines de la Drôme — 4 € la tige » → nom + prix (si la ligne en porte un). */
export function lireArticles(v: unknown): Article[] {
  return lignes(v).map((l, rang) => {
    const p = prixDansLaLigne(l)
    if (!p || !p.avant) return { rang, nom: l, prix: "", montant: null }
    const prix = [p.prix, p.apres].filter(Boolean).join(" ")
    return { rang, nom: p.avant, prix, montant: parsePrice(p.prix) }
  })
}

// ── Arrivage ────────────────────────────────────────────────────────────────
export const DUREES_ARRIVAGE = ["Aujourd'hui seulement", "3 jours", "Une semaine"] as const
const JOURS_DE: Record<string, number> = { "Aujourd'hui seulement": 1, "3 jours": 3, "Une semaine": 7 }

/** Jours écoulés entre deux clés « AAAA-MM-JJ » (b − a). */
function ecart(a: string, b: string): number {
  const ta = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))
  const tb = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10))
  return Math.round((tb - ta) / 86_400_000)
}

export type EtatArrivage = { visible: boolean; depuisJours: number | null; articles: Article[] }

/** Visible si des articles existent ET que la date est dans la durée choisie. */
export function etatArrivage(c: Record<string, any>, now: Date): EtatArrivage {
  const articles = lireArticles(c?.articles)
  const date = texteUtile(c?.date)
  if (!articles.length || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { visible: false, depuisJours: null, articles }
  const d = ecart(date, jourDuCommerce(now, c))
  const duree = JOURS_DE[texteUtile(c?.duree)] ?? 1
  return { visible: d >= 0 && d < duree, depuisJours: d, articles }
}

export function arriveLisible(depuisJours: number): string {
  return depuisJours === 0 ? "Arrivé aujourd'hui" : depuisJours === 1 ? "Arrivé hier" : `Arrivé il y a ${depuisJours} jours`
}

// ── Commande à retirer ─────────────────────────────────────────────────────
export const CANAUX_COMMANDE = ["WhatsApp", "SMS"] as const
export const QUANTITE_MAX = 20

export type Panier = Record<number, number>

export function lignesDuPanier(articles: Article[], panier: Panier) {
  return articles.filter(a => (panier[a.rang] ?? 0) > 0).map(a => ({ ...a, quantite: panier[a.rang] }))
}

/** Le total, seulement si TOUS les articles choisis ont un prix lisible. */
export function totalEstime(articles: Article[], panier: Panier): number | null {
  const choisis = lignesDuPanier(articles, panier)
  if (!choisis.length || choisis.some(a => a.montant === null)) return null
  return Math.round(choisis.reduce((s, a) => s + (a.montant as number) * a.quantite, 0) * 100) / 100
}

export const eurosLisibles = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"

/** Le message prérempli de la commande. */
export function messageDeCommande(articles: Article[], panier: Panier, precisions: string): string {
  const choisis = lignesDuPanier(articles, panier)
  const total = totalEstime(articles, panier)
  return [
    "Bonjour, je souhaite commander :",
    ...choisis.map(a => `• ${a.quantite} × ${a.nom}`),
    ...(total !== null ? [`Total estimé : ${eurosLisibles(total)}`] : []),
    ...(precisions.trim() ? [precisions.trim()] : []),
    "Merci !",
  ].join("\n")
}
