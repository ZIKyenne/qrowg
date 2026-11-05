// menuImport.ts — Parseur PUR pour importer un menu depuis un tableur (Excel / Google Sheets /
// Numbers) par copier-coller. Mappe les colonnes positionnellement : Nom, Prix, Description,
// Catégorie. Aucune dépendance, aucun réseau, ne mute rien.
//
// La lecture du tableau lui-même — détection du séparateur (tabulation, barre
// verticale, point-virgule, virgule), tableaux markdown, lignes vides, ligne
// d'en-têtes — a été EXTRAITE vers `lib/tableauColle.ts` au moment d'importer
// une liste d'établissements, qui a besoin exactement des mêmes règles. Elles
// ne sont pas réécrites : ce fichier les appelle. Les onze tests de
// `menuImport.test.ts` n'ont pas été touchés, et c'est eux qui prouvent que
// l'extraction n'a rien changé ici.

import { corpsEtEntete } from "@/lib/tableauColle"

export type ParsedMenuItem = { name: string; price: string; desc: string; category: string }

// Sépare un « Nom 12€ » (mono-colonne) en nom + prix si un prix est détecté en fin de chaîne.
function splitTrailingPrice(s: string): { name: string; price: string } {
  const m = s.match(/^(.*?)[\s—–-]*((?:\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|eur|euros?|\$|£|chf)?)\s*$/i)
  if (m && m[1].trim() && /\d/.test(m[2])) return { name: m[1].trim(), price: m[2].trim() }
  return { name: s.trim(), price: "" }
}

export function parseMenuPaste(text: string, max = 50): ParsedMenuItem[] {
  const { corps } = corpsEtEntete(text)
  if (corps.length === 0) return []

  const out: ParsedMenuItem[] = []
  for (let i = 0; i < corps.length && out.length < max; i++) {
    const cells = corps[i]
    let name = cells[0] || ""
    let price = cells[1] || ""
    const desc = cells[2] || ""
    const category = cells[3] || ""
    // Mono-colonne « Nom 12€ » → on récupère le prix en fin de nom.
    if (!price && cells.length === 1) { const sp = splitTrailingPrice(name); name = sp.name; price = sp.price }
    if (!name) continue
    out.push({ name, price, desc, category })
  }
  return out
}
