"use client"

import { useMemo, useState } from "react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import TrafficSourcesPanel from "./TrafficSourcesPanel"
import { QrCode, Eye, TrendingUp, Smartphone, Globe, BarChart2 } from "lucide-react"

type Profile = { total_pages: number; total_scans: number; plan: string } | null
type Page = { id: string; title: string; slug: string; total_views: number; unique_views: number; status: string }
type Scan = { scanned_at: string; device: string; country: string | null; page_id: string }
type View = { viewed_at: string; device: string; source: string | null; country: string | null; page_id: string }

interface Props {
  profile: Profile
  pages: Page[]
  recentScans: Scan[]
  recentViews: View[]
}

const GOLD = "#C9A84C"
const NEON = "#39FF8F"
const MUTED = "#8A8478"
const COLORS = [GOLD, NEON, "#7B61FF", "#FF6B6B", "#4ECDC4", "#FFE66D"]

function formatDay(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function buildDailyData(scans: Scan[], views: View[]) {
  const map: Record<string, { date: string; scans: number; views: number }> = {}
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map[key] = { date: formatDay(key), scans: 0, views: 0 }
  }
  scans.forEach(s => {
    const key = s.scanned_at.slice(0, 10)
    if (map[key]) map[key].scans++
  })
  views.forEach(v => {
    const key = v.viewed_at.slice(0, 10)
    if (map[key]) map[key].views++
  })
  return Object.values(map)
}

function buildDeviceData(scans: Scan[]) {
  const counts: Record<string, number> = {}
  scans.forEach(s => { counts[s.device] = (counts[s.device] || 0) + 1 })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function buildSourceData(views: View[]) {
  const counts: Record<string, number> = {}
  views.forEach(v => {
    const src = v.source || "direct"
    counts[src] = (counts[src] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ color: "#8A8478", fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name} : {p.value}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsClient({ profile, pages, recentScans, recentViews }: Props) {
  const [selectedPage, setSelectedPage] = useState<string>("all")

  const filteredScans = useMemo(() =>
    selectedPage === "all" ? recentScans : recentScans.filter(s => s.page_id === selectedPage),
    [recentScans, selectedPage]
  )
  const filteredViews = useMemo(() =>
    selectedPage === "all" ? recentViews : recentViews.filter(v => v.page_id === selectedPage),
    [recentViews, selectedPage]
  )

  const dailyData = useMemo(() => buildDailyData(filteredScans, filteredViews), [filteredScans, filteredViews])
  const deviceData = useMemo(() => buildDeviceData(filteredScans), [filteredScans])
  const sourceData = useMemo(() => buildSourceData(filteredViews), [filteredViews])

  const totalScans30 = filteredScans.length
  const totalViews30 = filteredViews.length

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 24px", fontFamily: "DM Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>
              Analytics
            </h1>
            <p style={{ color: "#8A8478", marginTop: 4, fontSize: 14 }}>30 derniers jours</p>
          </div>
          {/* Filtre page */}
          <select
            value={selectedPage}
            onChange={e => setSelectedPage(e.target.value)}
            style={{
              background: "#111009", border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: 8, color: "#F5F0E8", padding: "8px 14px", fontSize: 14, cursor: "pointer"
            }}
          >
            <option value="all">Toutes les pages</option>
            {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { icon: <QrCode size={20} />, label: "Scans (30j)", value: totalScans30, color: GOLD },
            { icon: <Eye size={20} />, label: "Vues (30j)", value: totalViews30, color: NEON },
            { icon: <BarChart2 size={20} />, label: "Pages actives", value: pages.filter(p => p.status === "published").length, color: "#7B61FF" },
            { icon: <TrendingUp size={20} />, label: "Total scans", value: profile?.total_scans || 0, color: "#FF6B6B" },
          ].map((kpi, i) => (
            <div key={i} style={{
              background: "#111009", border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: 12, padding: "20px 24px",
              display: "flex", alignItems: "center", gap: 16
            }}>
              <div style={{ color: kpi.color, background: `${kpi.color}18`, borderRadius: 8, padding: 10 }}>
                {kpi.icon}
              </div>
              <div>
                <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>{kpi.label}</p>
                <p style={{ color: "#F5F0E8", fontSize: 24, fontWeight: 700, margin: 0 }}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Graphique principal — scans + vues */}
        <div style={{
          background: "#111009", border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: 12, padding: "24px", marginBottom: 24
        }}>
          <h2 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>
            Scans & Vues — 30 jours
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="gScans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NEON} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={NEON} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: MUTED, fontSize: 13 }} />
              <Area type="monotone" dataKey="scans" name="Scans QR" stroke={GOLD} strokeWidth={2} fill="url(#gScans)" />
              <Area type="monotone" dataKey="views" name="Vues page" stroke={NEON} strokeWidth={2} fill="url(#gViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Row : Device + Source */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Device */}
          <div style={{
            background: "#111009", border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: 12, padding: "24px"
          }}>
            <h2 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 600, marginBottom: 20, marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Smartphone size={16} color={GOLD} /> Appareils
            </h2>
            {deviceData.length === 0 ? (
              <p style={{ color: MUTED, textAlign: "center", marginTop: 40 }}>Pas encore de données</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111009", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>

        {/* ── Sources de trafic ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <TrafficSourcesPanel views={filteredViews} period={30} />
        </div>

        {/* Top pages */}
        <div style={{
          background: "#111009", border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: 12, padding: "24px"
        }}>
          <h2 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>
            Top Pages
          </h2>
          {pages.length === 0 ? (
            <p style={{ color: MUTED }}>Aucune page créée</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pages.slice(0, 5).map((page, i) => {
                const maxViews = pages[0]?.total_views || 1
                const pct = Math.max(4, (page.total_views / maxViews) * 100)
                return (
                  <div key={page.id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ color: MUTED, fontSize: 13, width: 20, textAlign: "right" }}>#{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ color: "#F5F0E8", fontSize: 14 }}>{page.title}</span>
                        <span style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}>{page.total_views} vues</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}, ${NEON})`, borderRadius: 3, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
