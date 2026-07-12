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

// ── Engagement (page_events : scroll + impressions + temps par bloc) ──────────
export type PageEvent = { kind: "scroll" | "impression" | "dwell"; ref: string; value?: number | null; page_id?: string }
export type ScrollStep = { depth: string; count: number; pct: number }

// Entonnoir de profondeur de scroll : jalons 25/50/75/100 %. Chaque visiteur qui atteint
// un jalon a aussi franchi les precedents (un evenement par jalon et par session), donc
// count(25) >= count(50) >= ... Le pct est relatif au 1er jalon (base = a scrolle un minimum).
export function buildScrollFunnel(events: PageEvent[]): ScrollStep[] {
  const counts: Record<string, number> = { "25": 0, "50": 0, "75": 0, "100": 0 }
  for (const e of events) {
    if (e.kind === "scroll" && counts[e.ref] !== undefined) counts[e.ref]++
  }
  const base = counts["25"] || 0
  return ["25", "50", "75", "100"].map(m => ({
    depth: `${m}%`,
    count: counts[m],
    pct: base > 0 ? Math.round((counts[m] / base) * 100) : 0,
  }))
}

// Nombre d'impressions (bloc reellement vu) par block_id.
export function buildBlockImpressions(events: PageEvent[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of events) {
    if (e.kind === "impression" && e.ref) counts[e.ref] = (counts[e.ref] || 0) + 1
  }
  return counts
}

// CTR reel d'un bloc = clics / impressions (borne a 100 %). Renvoie null si aucune impression.
export function blockCtr(clicks: number, impressions: number): number | null {
  if (!impressions) return null
  return Math.min(100, Math.round((clicks / impressions) * 100))
}

// Temps d'attention moyen (secondes) par block_id, a partir des evenements 'dwell'.
export function buildBlockDwell(events: PageEvent[]): Record<string, number> {
  const sum: Record<string, number> = {}
  const n: Record<string, number> = {}
  for (const e of events) {
    if (e.kind === "dwell" && e.ref && typeof e.value === "number") {
      sum[e.ref] = (sum[e.ref] || 0) + e.value
      n[e.ref] = (n[e.ref] || 0) + 1
    }
  }
  const avg: Record<string, number> = {}
  for (const ref of Object.keys(sum)) avg[ref] = Math.round(sum[ref] / n[ref])
  return avg
}
