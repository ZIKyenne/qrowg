"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart2, TrendingUp, Eye, QrCode, Calendar, ArrowUp, ArrowDown, Minus, Clock } from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from "recharts"

type DailyData = { date: string; views: number; scans: number }
type HourlyData = { hour: string; views: number; scans: number }
type TopPage = { title: string; slug: string; total_views: number; total_scans: number }

const PLAN_LIMITS: Record<string, number> = { free: 500, starter: 5000, pro: 50000, business: Infinity }

function StatCard({ icon, label, value, sub, color, trend }: any) {
  return (
    <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -10, right: -10, width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle," + color + "12,transparent 70%)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ color: color, background: color + "15", borderRadius: 8, padding: 8 }}>{icon}</div>
        {trend !== undefined && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: trend > 0 ? "#39FF8F" : trend < 0 ? "#EF4444" : "#8A8478", fontSize: 12, fontWeight: 600 }}>
            {trend > 0 ? <ArrowUp size={12} /> : trend < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p style={{ color: "#F5F0E8", fontSize: 32, fontWeight: 700, margin: "0 0 4px", fontFamily: "Cormorant Garamond, serif" }}>{value.toLocaleString("fr-FR")}</p>
      <p style={{ color: "#8A8478", fontSize: 12, margin: "0 0 2px" }}>{label}</p>
      {sub && <p style={{ color: color + "80", fontSize: 11, margin: 0 }}>{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "10px 14px", fontFamily: "DM Sans, sans-serif" }}>
      <p style={{ color: "#8A8478", fontSize: 11, margin: "0 0 6px" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600, margin: "2px 0" }}>{p.name}: {p.value.toLocaleString("fr-FR")}</p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [pages, setPages] = useState<any[]>([])
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<"area" | "bar">("area")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [period, setPeriod] = useState<7 | 30 | 90>(30)
  const [devices, setDevices] = useState<{ name: string; value: number; color: string }[]>([])
  const [sources, setSources] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/auth/login"; return }

      const [{ data: prof }, { data: pgs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("pages").select("id,title,slug,total_views,status").eq("user_id", user.id),
      ])
      if (prof) setProfile(prof)
      if (pgs) {
        setPages(pgs)
        const sorted = [...pgs].sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
        setTopPages(sorted.slice(0, 5) as TopPage[])
      }

      // Daily data des 30 derniers jours
      const pageIds = (pgs || []).map((p: any) => p.id)
      if (pageIds.length > 0) {
        // Vues par jour
        const { data: views } = await supabase
          .from("page_views")
          .select("viewed_at")
          .in("page_id", pageIds)
          .gte("viewed_at", new Date(Date.now() - period * 86400000).toISOString())

        // Scans par jour
        const { data: scans } = await supabase
          .from("scans")
          .select("scanned_at, device")
          .in("page_id", pageIds)
          .gte("scanned_at", new Date(Date.now() - period * 86400000).toISOString())

        // Construire les données journalières
        const dayMap: Record<string, { views: number; scans: number }> = {}
        for (let i = period - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000)
          const key = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
          dayMap[key] = { views: 0, scans: 0 }
        }

        ;(views || []).forEach((v: any) => {
          const key = new Date(v.viewed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
          if (dayMap[key]) dayMap[key].views++
        })
        ;(scans || []).forEach((s: any) => {
          const key = new Date(s.scanned_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
          if (dayMap[key]) dayMap[key].scans++
        })

        setDailyData(Object.entries(dayMap).map(([date, d]) => ({ date, ...d })))

        // Devices
        const deviceCount: Record<string, number> = {}
        ;(scans || []).forEach((s: any) => { deviceCount[s.device] = (deviceCount[s.device] || 0) + 1 })
        const deviceColors: Record<string, string> = { mobile: "#C9A84C", desktop: "#39FF8F", tablet: "#7B61FF", unknown: "#8A8478" }
        setDevices(Object.entries(deviceCount).map(([name, value]) => ({ name, value, color: deviceColors[name] || "#8A8478" })))

        // Sources
        const { data: pvSources } = await supabase
          .from("page_views")
          .select("source")
          .in("page_id", pageIds)
          .gte("viewed_at", new Date(Date.now() - period * 86400000).toISOString())

        const sourceCount: Record<string, number> = {}
        ;(pvSources || []).forEach((v: any) => {
          const s = v.source || "direct"
          sourceCount[s] = (sourceCount[s] || 0) + 1
        })
        setSources(Object.entries(sourceCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value))
      }

      setLoading(false)
    }
    load()
  }, [period])

  // Charger les donnees horaires pour la date selectionnee (Business uniquement)
  useEffect(() => {
    if (profile?.plan !== "business") return
    async function loadHourly() {
      const supabase = createClient()
      const pageIds = pages.map(p => p.id)
      if (!pageIds.length) return

      const startOfDay = new Date(selectedDate + "T00:00:00Z").toISOString()
      const endOfDay = new Date(selectedDate + "T23:59:59Z").toISOString()

      const [{ data: views }, { data: scans }] = await Promise.all([
        supabase.from("page_views").select("viewed_at").in("page_id", pageIds).gte("viewed_at", startOfDay).lte("viewed_at", endOfDay),
        supabase.from("scans").select("scanned_at").in("page_id", pageIds).gte("scanned_at", startOfDay).lte("scanned_at", endOfDay),
      ])

      const hourMap: Record<string, { views: number; scans: number }> = {}
      for (let h = 0; h < 24; h++) {
        hourMap[h.toString().padStart(2, "0") + "h"] = { views: 0, scans: 0 }
      }
      ;(views || []).forEach((v: any) => {
        const h = new Date(v.viewed_at).getHours().toString().padStart(2, "0") + "h"
        if (hourMap[h]) hourMap[h].views++
      })
      ;(scans || []).forEach((s: any) => {
        const h = new Date(s.scanned_at).getHours().toString().padStart(2, "0") + "h"
        if (hourMap[h]) hourMap[h].scans++
      })

      setHourlyData(Object.entries(hourMap).map(([hour, d]) => ({ hour, ...d })))
    }
    loadHourly()
  }, [selectedDate, profile?.plan, pages])

  const G = "#C9A84C"; const MUTED = "#8A8478"
  const totalViews = pages.reduce((s, p) => s + (p.total_views || 0), 0)
  const limit = PLAN_LIMITS[profile?.plan || "free"]
  const usagePercent = limit === Infinity ? 0 : Math.min(100, Math.round((totalViews / limit) * 100))

  // Calcul tendance (comparer 7 derniers jours vs 7 jours avant)
  const last7 = dailyData.slice(-7).reduce((s, d) => s + d.views, 0)
  const prev7 = dailyData.slice(-14, -7).reduce((s, d) => s + d.views, 0)
  const trend = prev7 === 0 ? 0 : Math.round(((last7 - prev7) / prev7) * 100)

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "2px solid rgba(201,168,76,0.15)", borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 28px", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 30, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>Analytics</h1>
            <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0" }}>Toutes tes statistiques en temps reel</p>
          </div>
          {/* Period selector */}
          <div style={{ display: "flex", background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 10, overflow: "hidden" }}>
            {([7, 30, 90] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ background: period === p ? "rgba(201,168,76,0.12)" : "transparent", border: "none", padding: "8px 16px", color: period === p ? G : MUTED, fontSize: 12, fontWeight: period === p ? 700 : 400, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                {p}j
              </button>
            ))}
          </div>
        </div>

        {/* Quota bar (plans limites) */}
        {limit !== Infinity && (
          <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600 }}>Quota de vues ce mois</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: usagePercent >= 90 ? "#EF4444" : usagePercent >= 70 ? "#F97316" : G, fontSize: 13, fontWeight: 700 }}>{totalViews.toLocaleString("fr-FR")} / {limit.toLocaleString("fr-FR")}</span>
                {usagePercent >= 80 && (
                  <a href="/upgrade" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, padding: "4px 10px", color: G, textDecoration: "none", fontSize: 11, fontWeight: 700 }}>Upgrader →</a>
                )}
              </div>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: usagePercent + "%", background: usagePercent >= 90 ? "linear-gradient(90deg,#EF4444,#DC2626)" : usagePercent >= 70 ? "linear-gradient(90deg,#F97316,#EA580C)" : "linear-gradient(90deg,#C9A84C,#39FF8F)", borderRadius: 3, transition: "width 0.5s" }} />
            </div>
            <p style={{ color: MUTED, fontSize: 11, margin: "5px 0 0" }}>
              {usagePercent >= 90 ? "Limite presque atteinte — pensez a upgrader" : usagePercent >= 70 ? "70% de ton quota utilise ce mois" : "Consommation normale"}
            </p>
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
          <StatCard icon={<Eye size={18} />} label="Vues totales" value={totalViews} color={G} sub={"ce mois"} trend={trend} />
          <StatCard icon={<QrCode size={18} />} label="Scans totaux" value={profile?.total_scans || 0} color="#39FF8F" sub="tous temps" />
          <StatCard icon={<BarChart2 size={18} />} label="Pages publiees" value={pages.filter(p => p.status === "published").length} color="#7B61FF" sub={"sur " + pages.length + " pages"} />
          <StatCard icon={<TrendingUp size={18} />} label="Tendance 7j" value={last7} color="#38BDF8" sub={trend >= 0 ? "+" + trend + "% vs semaine precedente" : trend + "% vs semaine precedente"} trend={trend} />
        </div>

        {/* Graphique principal */}
        <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: 0 }}>Vues & Scans sur {period} jours</h2>
              <p style={{ color: MUTED, fontSize: 12, margin: "3px 0 0" }}>Evolution quotidienne de ton trafic</p>
            </div>
            <div style={{ display: "flex", background: "#0d0c09", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
              {(["area", "bar"] as const).map(t => (
                <button key={t} onClick={() => setActiveChart(t)}
                  style={{ background: activeChart === t ? "rgba(201,168,76,0.1)" : "transparent", border: "none", padding: "6px 12px", color: activeChart === t ? G : MUTED, fontSize: 11, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                  {t === "area" ? "Courbe" : "Barres"}
                </button>
              ))}
            </div>
          </div>

          {dailyData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: MUTED, fontSize: 13 }}>Pas encore de donnees — les stats apparaitront apres les premiers scans</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              {activeChart === "area" ? (
                <AreaChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#39FF8F" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#39FF8F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: "#8A8478", fontSize: 10 }} tickLine={false} axisLine={false} interval={period === 7 ? 0 : period === 30 ? 4 : 9} />
                  <YAxis tick={{ fill: "#8A8478", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#8A8478" }} />
                  <Area type="monotone" dataKey="views" name="Vues" stroke="#C9A84C" strokeWidth={2} fill="url(#gradViews)" dot={false} />
                  <Area type="monotone" dataKey="scans" name="Scans" stroke="#39FF8F" strokeWidth={2} fill="url(#gradScans)" dot={false} />
                </AreaChart>
              ) : (
                <BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: "#8A8478", fontSize: 10 }} tickLine={false} axisLine={false} interval={period === 7 ? 0 : period === 30 ? 4 : 9} />
                  <YAxis tick={{ fill: "#8A8478", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#8A8478" }} />
                  <Bar dataKey="views" name="Vues" fill="#C9A84C" fillOpacity={0.8} radius={[3,3,0,0]} />
                  <Bar dataKey="scans" name="Scans" fill="#39FF8F" fillOpacity={0.6} radius={[3,3,0,0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* 2 colonnes: devices + top pages */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

          {/* Appareils */}
          <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 16, padding: "22px" }}>
            <h2 style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Appareils</h2>
            {devices.length === 0 ? (
              <p style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Pas encore de donnees</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {devices.map((d, i) => {
                  const total = devices.reduce((s, x) => s + x.value, 0)
                  const pct = Math.round((d.value / total) * 100)
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ color: "#F5F0E8", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                          {d.name === "mobile" ? "📱" : d.name === "desktop" ? "💻" : d.name === "tablet" ? "📟" : "❓"} {d.name}
                        </span>
                        <span style={{ color: d.color, fontSize: 13, fontWeight: 700 }}>{pct}% <span style={{ color: MUTED, fontWeight: 400 }}>({d.value})</span></span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", background: d.color, borderRadius: 3, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top pages */}
          <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 16, padding: "22px" }}>
            <h2 style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Top pages</h2>
            {topPages.length === 0 ? (
              <p style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Aucune page</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topPages.map((page, i) => {
                  const maxViews = topPages[0]?.total_views || 1
                  const pct = Math.round((page.total_views / maxViews) * 100)
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#F5F0E8", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
                          <span style={{ color: G, fontWeight: 700, marginRight: 6 }}>#{i+1}</span>{page.title}
                        </span>
                        <span style={{ color: G, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{page.total_views} vues</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg," + G + "," + G + "80)", borderRadius: 2, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 16, padding: "22px", marginBottom: 20 }}>
            <h2 style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Sources de trafic</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sources.map((s, i) => {
                const total = sources.reduce((sum, x) => sum + x.value, 0)
                const pct = Math.round((s.value / total) * 100)
                const colors = ["#C9A84C", "#39FF8F", "#7B61FF", "#38BDF8", "#F97316"]
                const icons: Record<string, string> = { qr: "📱", direct: "🔗", social: "📲", search: "🔍", email: "✉️" }
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 16, width: 24 }}>{icons[s.name] || "🌐"}</span>
                    <span style={{ color: "#F5F0E8", fontSize: 13, width: 80 }}>{s.name}</span>
                    <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: colors[i % colors.length], borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ color: colors[i % colors.length], fontSize: 12, fontWeight: 700, width: 40, textAlign: "right" }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Graphique horaire — Business uniquement */}
        {profile?.plan === "business" ? (
          <div style={{ background: "#111009", border: "1px solid rgba(57,255,143,0.2)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={18} color="#39FF8F" />
                <div>
                  <h2 style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: 0 }}>Analyse par heure</h2>
                  <p style={{ color: "#8A8478", fontSize: 11, margin: "2px 0 0" }}>Pics de trafic a la minute — Plan Business</p>
                </div>
              </div>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                style={{ background: "#0d0c09", border: "1px solid rgba(57,255,143,0.25)", borderRadius: 8, padding: "8px 12px", color: "#F5F0E8", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }} />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{ fill: "#8A8478", fontSize: 9 }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fill: "#8A8478", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#8A8478" }} />
                <Bar dataKey="views" name="Vues" fill="#39FF8F" fillOpacity={0.7} radius={[3,3,0,0]} />
                <Bar dataKey="scans" name="Scans" fill="#C9A84C" fillOpacity={0.7} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ background: "linear-gradient(135deg,rgba(57,255,143,0.06),rgba(57,255,143,0.02))", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 16, padding: "28px 32px", textAlign: "center" }}>
            <Clock size={32} color="#39FF8F" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: "0 0 8px", fontFamily: "Cormorant Garamond, serif" }}>Analyse par heure — Plan Business</h3>
            <p style={{ color: "#8A8478", fontSize: 13, margin: "0 0 18px", lineHeight: 1.6 }}>
              Visualise les pics de trafic a la minute sur n'importe quelle journee. Identifie les meilleures heures pour partager ton QR code.
            </p>
            <a href="/upgrade" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(57,255,143,0.1)", border: "1px solid rgba(57,255,143,0.3)", borderRadius: 10, padding: "10px 20px", color: "#39FF8F", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
              Passer a Business — 24,99€/mois →
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
