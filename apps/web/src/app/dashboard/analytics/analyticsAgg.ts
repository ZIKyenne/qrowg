// analyticsAgg.ts — Agregations pures et testables pour le tableau de bord analytics.
// Aucune dependance React : ces fonctions sont couvertes par des tests unitaires.
// `now` est injectable partout ou une fenetre glissante est calculee (testabilite).

export type AggScan = { scanned_at: string; device?: string | null; page_id?: string }
export type AggView = { viewed_at: string; source?: string | null; page_id?: string }
export type DailyPoint = { date: string; scans: number; views: number }
export type NameValue = { name: string; value: number }

// Libelle court jour/mois a partir d'une date ISO (ex "2026-07-05" -> "5/7").
export function formatDay(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// Serie sur les 30 derniers jours (buckets UTC), scans + vues par jour.
// Les jours sans evenement restent a 0 (pas de trous dans le graphe).
export function buildDailyData(scans: AggScan[], views: AggView[], now: number = Date.now()): DailyPoint[] {
  const map: Record<string, DailyPoint> = {}
  const base = new Date(now)
  for (let i = 29; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map[key] = { date: formatDay(key), scans: 0, views: 0 }
  }
  for (const s of scans) {
    const key = (s.scanned_at || "").slice(0, 10)
    if (map[key]) map[key].scans++
  }
  for (const v of views) {
    const key = (v.viewed_at || "").slice(0, 10)
    if (map[key]) map[key].views++
  }
  return Object.values(map)
}

// Repartition par type d'appareil (mobile/tablet/desktop/…). Valeurs manquantes -> "unknown".
export function buildDeviceData(scans: AggScan[]): NameValue[] {
  const counts: Record<string, number> = {}
  for (const s of scans) {
    const key = s.device || "unknown"
    counts[key] = (counts[key] || 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

// Repartition par source de trafic. Source absente/vide -> "direct".
export function buildSourceData(views: AggView[]): NameValue[] {
  const counts: Record<string, number> = {}
  for (const v of views) {
    const src = v.source || "direct"
    counts[src] = (counts[src] || 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}
