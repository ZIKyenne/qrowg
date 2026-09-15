"use client"

import { Reglage } from "@/components/ui/Reglage"
import { useState, useCallback } from "react"
import { Download, Calendar, Lock, CheckCircle, Loader, Eye, QrCode, Link2, Layers, Globe } from "lucide-react"
import { construireCsv, TYPE_CSV } from "@/lib/exportCsv"
import { aujourdHuiDuCommerce, serieDeJours } from "@/lib/jourDuCommerce"
import { dateLisible } from "@/lib/jourDuCommerce"

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewRow    = { viewed_at: string; device: string; source: string | null; country: string | null; page_id: string }
type ScanRow    = { scanned_at: string; device: string; country: string | null; city: string | null; os: string | null; browser: string | null; page_id: string }
type ClickRow   = { block_id: string; click_target: string | null; clicked_at: string; page_id: string; block_type?: string }
type BlockRow   = { id: string; type: string; page_id: string; position: number; is_visible: boolean }
type GeoScan    = { country: string | null; city: string | null; page_id: string; scanned_at: string }
type PageRow    = { id: string; title: string; slug: string }

interface Props {
  plan:        string
  pages:       PageRow[]
  views:       ViewRow[]
  scans:       ScanRow[]
  clicks:      ClickRow[]
  blocks:      BlockRow[]
  geoScans:    GeoScan[]
}

// ── Datasets exportables ──────────────────────────────────────────────────────
const DATASETS = [
  { id: "visits",    label: "Visites",    icon: <Eye size={14} />,    desc: "Toutes les vues de page avec source, device, pays" },
  { id: "scans",     label: "Scans QR",   icon: <QrCode size={14} />, desc: "Scans avec device, OS, navigateur, pays, ville" },
  { id: "links",     label: "Liens cliqués", icon: <Link2 size={14} />, desc: "Clics sur liens avec URL cible et type de bloc" },
  { id: "blocks",    label: "Blocs",      icon: <Layers size={14} />, desc: "Inventaire des blocs par type et page" },
  { id: "geo",       label: "Géographie", icon: <Globe size={14} />,  desc: "Pays et villes avec compteur visites + scans" },
]

type DatasetId = typeof DATASETS[number]["id"]

const PERIODS = [
  { id: "today",  label: "Aujourd'hui",   days: 0  },
  { id: "7d",     label: "7 jours",       days: 7  },
  { id: "30d",    label: "30 jours",      days: 30 },
  { id: "custom", label: "Personnalisé",  days: -1 },
] as const

type PeriodId = typeof PERIODS[number]["id"]

const PAID_PLANS = ["pro", "business"]

const G     = "var(--accent)"
const MUTED = "var(--muted)"

// ── CSV helpers ───────────────────────────────────────────────────────────────
// Échappement, séparateur et neutralisation : `lib/exportCsv`, comme les cinq
// autres exports du produit (lot v90).
function toCSV(headers: string[], rows: unknown[][]): string {
  return construireCsv(headers, rows)
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: TYPE_CSV })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(iso: string): string {
  return dateLisible(iso, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function todaySlug(): string {
  return aujourdHuiDuCommerce()
}

export default function ExportPanel({ plan, pages, views, scans, clicks, blocks, geoScans }: Props) {
  const [selected,    setSelected]    = useState<Set<DatasetId>>(new Set(["visits"]))
  const [period,      setPeriod]      = useState<PeriodId>("30d")
  const [customFrom,  setCustomFrom]  = useState(() => {
    return serieDeJours(31)[0]
  })
  const [customTo,    setCustomTo]    = useState(() => aujourdHuiDuCommerce())
  const [exporting,   setExporting]   = useState(false)
  const [lastExport,  setLastExport]  = useState<string | null>(null)

  const isPaid = PAID_PLANS.includes(plan?.toLowerCase() ?? "")

  const pageMap = Object.fromEntries(pages.map(p => [p.id, p.title]))

  function getCutoff(): { from: Date; to: Date } {
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    if (period === "today") {
      const from = new Date()
      from.setHours(0, 0, 0, 0)
      return { from, to }
    }
    if (period === "custom") {
      return { from: new Date(customFrom + "T00:00:00"), to: new Date(customTo + "T23:59:59") }
    }
    const days = period === "7d" ? 7 : 30
    const from = new Date()
    from.setDate(from.getDate() - days)
    from.setHours(0, 0, 0, 0)
    return { from, to }
  }

  function toggleDataset(id: DatasetId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const doExport = useCallback(() => {
    if (!isPaid || selected.size === 0) return
    setExporting(true)

    setTimeout(() => {
      const { from, to } = getCutoff()
      const periodLabel = period === "custom"
        ? `${customFrom}_${customTo}`
        : period

      selected.forEach(id => {
        let csv = ""
        let filename = `qrfolio_${id}_${periodLabel}_${todaySlug()}.csv`

        if (id === "visits") {
          const rows = views
            .filter(v => { const d = new Date(v.viewed_at); return d >= from && d <= to })
            .map(v => [
              formatDate(v.viewed_at),
              pageMap[v.page_id] ?? v.page_id,
              v.device,
              v.source ?? "direct",
              v.country ?? "",
            ])
          csv = toCSV(["Date", "Page", "Appareil", "Source", "Pays"], rows)
        }

        if (id === "scans") {
          const rows = scans
            .filter(s => { const d = new Date(s.scanned_at); return d >= from && d <= to })
            .map(s => [
              formatDate(s.scanned_at),
              pageMap[s.page_id] ?? s.page_id,
              s.device,
              s.os ?? "",
              s.browser ?? "",
              s.country ?? "",
              s.city ?? "",
            ])
          csv = toCSV(["Date", "Page", "Appareil", "OS", "Navigateur", "Pays", "Ville"], rows)
        }

        if (id === "links") {
          const rows = clicks
            .filter(c => { const d = new Date(c.clicked_at); return d >= from && d <= to })
            .map(c => [
              formatDate(c.clicked_at),
              pageMap[c.page_id] ?? c.page_id,
              c.block_type ?? "",
              c.click_target ?? "",
            ])
          csv = toCSV(["Date", "Page", "Type de bloc", "URL / Cible"], rows)
        }

        if (id === "blocks") {
          const rows = blocks.map(b => [
            pageMap[b.page_id] ?? b.page_id,
            b.type,
            b.position,
            b.is_visible ? "Oui" : "Non",
          ])
          csv = toCSV(["Page", "Type", "Position", "Visible"], rows)
        }

        if (id === "geo") {
          const map: Record<string, { scans: number; views: number; cities: Set<string> }> = {}
          geoScans
            .filter(s => { const d = new Date(s.scanned_at); return d >= from && d <= to })
            .forEach(s => {
              const k = s.country ?? "Inconnu"
              if (!map[k]) map[k] = { scans: 0, views: 0, cities: new Set() }
              map[k].scans++
              if (s.city) map[k].cities.add(s.city)
            })
          views
            .filter(v => { const d = new Date(v.viewed_at); return d >= from && d <= to })
            .forEach(v => {
              const k = v.country ?? "Inconnu"
              if (!map[k]) map[k] = { scans: 0, views: 0, cities: new Set() }
              map[k].views++
            })
          const rows = Object.entries(map)
            .sort((a, b) => (b[1].scans + b[1].views) - (a[1].scans + a[1].views))
            .map(([country, d]) => [
              country,
              d.views,
              d.scans,
              d.scans + d.views,
              [...d.cities].join(" / "),
            ])
          csv = toCSV(["Pays", "Vues", "Scans QR", "Total", "Villes"], rows)
        }

        if (csv) downloadCSV(csv, filename)
      })

      setLastExport(dateLisible(Date.now(), { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
      setExporting(false)
    }, 100)
  }, [isPaid, selected, period, customFrom, customTo, views, scans, clicks, blocks, geoScans, pageMap])

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 16, padding: 24, fontFamily: "DM Sans, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Download size={16} color={G} />
            <h3 style={{ color: "var(--ink)", fontSize: 15, fontWeight: 700, margin: 0 }}>Export CSV</h3>
            {isPaid ? (
              <span style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius: 6, padding: "2px 8px", fontSize: 11.5, color: G, fontWeight: 700 }}>
                {plan?.toUpperCase()}
              </span>
            ) : (
              <span style={{ background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 11.5, color: "var(--danger)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <Lock size={9} /> PRO
              </span>
            )}
          </div>
          <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>
            {isPaid ? "Téléchargez vos données au format CSV" : "Disponible à partir du plan Pro"}
          </p>
        </div>
        {lastExport && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--success)", fontSize: 11 }}>
            <CheckCircle size={12} />
            Exporté à {lastExport}
          </div>
        )}
      </div>

      {!isPaid ? (
        /* Paywall */
        <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)" }}>
          <Lock size={32} color={MUTED} style={{ marginBottom: 12 }} />
          <p style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>
            Export disponible en Pro et Business
          </p>
          <p style={{ color: MUTED, fontSize: 12, margin: "0 0 20px" }}>
            Exportez visites, scans, liens, blocs et géographie en CSV
          </p>
          <a href="/upgrade" className="da-btn-primary da-btn-primary--sm"><span>Passer au Pro</span></a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Sélection datasets */}
          <div>
            <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 10px" }}>
              Données à exporter
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {DATASETS.map(ds => {
                const active = selected.has(ds.id)
                return (
                  <button key={ds.id} type="button" onClick={() => toggleDataset(ds.id)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: active ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "rgba(255,255,255,0.02)", border: active ? "1px solid color-mix(in srgb, var(--accent) 40%, transparent)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: active ? G : "rgba(255,255,255,0.08)", border: active ? "none" : "1px solid rgba(255,255,255,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      {active && <span style={{ color: "var(--ink-on-accent)", fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </div>
                    <div>
                      <p style={{ color: "var(--ink)", fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>
                        {ds.icon} {ds.label}
                      </p>
                      <p style={{ color: MUTED, fontSize: 11.5, margin: 0, lineHeight: 1.4 }}>{ds.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Période */}
          <div>
            <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 10px" }}>
              Période
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PERIODS.map(p => (
                <button key={p.id} type="button" onClick={() => setPeriod(p.id)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: period === p.id ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "rgba(255,255,255,0.03)", border: period === p.id ? "1px solid color-mix(in srgb, var(--accent) 40%, transparent)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 9, color: period === p.id ? G : MUTED, fontSize: 12, fontWeight: period === p.id ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>
                  {p.id === "custom" && <Calendar size={12} />}
                  {p.label}
                </button>
              ))}
            </div>

            {period === "custom" && (
              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Reglage nom="Du" style={{ color: MUTED, fontSize: 11.5, fontWeight: 600 }}>{id => <input id={id} type="date" aria-label="Date de début" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    style={{ background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 8, color: "var(--ink)", padding: "7px 10px", fontSize: 12, outline: "none", cursor: "pointer" }} />}</Reglage>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Reglage nom="Au" style={{ color: MUTED, fontSize: 11.5, fontWeight: 600 }}>{id => <input id={id} type="date" aria-label="Date de fin" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    style={{ background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 8, color: "var(--ink)", padding: "7px 10px", fontSize: 12, outline: "none", cursor: "pointer" }} />}</Reglage>
                </div>
              </div>
            )}
          </div>

          {/* Résumé + bouton */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", background: "color-mix(in srgb, var(--accent) 5%, transparent)", border: "1px solid var(--line-strong)", borderRadius: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "var(--ink)", fontSize: 13, fontWeight: 600, margin: "0 0 3px" }}>
                {selected.size} fichier{selected.size > 1 ? "s" : ""} · {PERIODS.find(p => p.id === period)?.label}
              </p>
              <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>
                {[...selected].map(id => DATASETS.find(d => d.id === id)?.label).filter(Boolean).join(" · ")}
              </p>
            </div>
            <button type="button" onClick={doExport} disabled={exporting || selected.size === 0} className="da-btn-primary da-btn-primary--sm">
              {exporting
                ? <><Loader size={14} style={{ animation: "mo-spin 0.8s linear infinite" }} /> <span>Export...</span></>
                : <><Download className="da-ic da-ic-dl" size={14} /> <span>Télécharger</span></>
              }
            </button>
          </div>
        </div>
      )}

      <style>{``}</style>
    </div>
  )
}
