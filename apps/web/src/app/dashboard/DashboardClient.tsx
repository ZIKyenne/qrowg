"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Plus, QrCode, BarChart2, Eye, Zap, ArrowRight, Globe, Trash2, ExternalLink, Edit3, AlertTriangle, X, Check } from "lucide-react"
import { getPlan, fmtPrice } from "@/lib/plans"
import Particles from "@/components/Particles"

type Page = { id: string; title: string; slug: string; status: string; total_views: number; created_at: string }
type Profile = { full_name: string | null; plan: string; total_scans: number; total_pages: number; avatar_url: string | null }

const PLAN_CONFIG: Record<string, { color: string; label: string }> = {
  free: { color: "#8A8478", label: "Free" },
  starter: { color: "#38BDF8", label: "Starter" },
  pro: { color: "var(--accent)", label: "Pro" },
  business: { color: "#39FF8F", label: "Business" },
}

function DeleteModal({ page, onConfirm, onCancel, deleting }: { page: Page; onConfirm: () => void; onCancel: () => void; deleting: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div style={{ background: "#111009", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: "28px 32px", maxWidth: 420, width: "100%", fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={18} color="#EF4444" />
          </div>
          <h3 style={{ color: "#F5F0E8", fontSize: 17, fontWeight: 700, margin: 0 }}>Supprimer cette page ?</h3>
        </div>
        <p style={{ color: "#8A8478", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
          Tu es sur le point de supprimer <span style={{ color: "#F5F0E8", fontWeight: 600 }}>"{page.title}"</span>.
        </p>
        <p style={{ color: "#8A8478", fontSize: 13, lineHeight: 1.6, margin: "0 0 24px" }}>
          Cette action supprimera aussi les blocs, le QR code et toutes les donnees analytics associees. Elle est irreversible.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={deleting}
            style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px", color: "#8A8478", fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            Annuler
          </button>
          <button onClick={onConfirm} disabled={deleting}
            style={{ flex: 1, background: deleting ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "11px", color: "#EF4444", fontSize: 14, fontWeight: 700, cursor: deleting ? "wait" : "pointer", fontFamily: "DM Sans, sans-serif" }}>
            {deleting ? "Suppression..." : "Supprimer definitivement"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [hour] = useState(new Date().getHours())
  const [monthViews, setMonthViews] = useState(0) // vues du mois en cours (quota)
  const [todayViews, setTodayViews] = useState(0) // vues aujourd'hui (vie du dashboard)
  const [weekViews, setWeekViews] = useState<number[]>([]) // 7 derniers jours (mini-sparkline)

  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon apres-midi" : "Bonsoir"

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/auth/login"; return }
    const [{ data: prof }, { data: pgs }] = await Promise.all([
      supabase.from("profiles").select("full_name,plan,total_scans,total_pages,avatar_url").eq("id", user.id).single(),
      supabase.from("pages").select("id,title,slug,status,total_views,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ])
    if (prof) setProfile(prof)
    if (pgs) setPages(pgs)
    // Vues du mois en cours (quota) — compte les page_views des pages de l'user depuis le 1er du mois
    const ids = (pgs ?? []).map(p => p.id)
    if (ids.length) {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 6)
      const [{ count: mCount }, { count: tCount }, { data: wRows }] = await Promise.all([
        supabase.from("page_views").select("id", { count: "exact", head: true }).in("page_id", ids).gte("viewed_at", monthStart),
        supabase.from("page_views").select("id", { count: "exact", head: true }).in("page_id", ids).gte("viewed_at", todayStart.toISOString()),
        supabase.from("page_views").select("viewed_at").in("page_id", ids).gte("viewed_at", weekStart.toISOString()),
      ])
      setMonthViews(mCount ?? 0)
      setTodayViews(tCount ?? 0)
      // Répartition sur 7 jours pour la mini-courbe
      const buckets = Array(7).fill(0)
      for (const r of (wRows ?? [])) {
        const d = new Date((r as any).viewed_at)
        const idx = Math.floor((d.getTime() - weekStart.getTime()) / 86400000)
        if (idx >= 0 && idx < 7) buckets[idx]++
      }
      setWeekViews(buckets)
    } else { setMonthViews(0); setTodayViews(0); setWeekViews([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deletePage(page: Page) {
    setDeleting(true)
    const supabase = createClient()
    // Supprimer blocs, QR codes, scans, vues (cascade via FK)
    await supabase.from("pages").delete().eq("id", page.id)
    setPages(p => p.filter(pg => pg.id !== page.id))
    setPageToDelete(null)
    setDeleting(false)
    // Refresh profile stats
    load()
  }

  async function togglePublish(page: Page) {
    const supabase = createClient()
    const newStatus = page.status === "published" ? "draft" : "published"
    await supabase.from("pages").update({ status: newStatus }).eq("id", page.id)
    setPages(p => p.map(pg => pg.id === page.id ? { ...pg, status: newStatus } : pg))
  }

  const planCfg = PLAN_CONFIG[profile?.plan || "free"]
  const G = "var(--accent)"; const MUTED = "#8A8478"
  const publishedCount = pages.filter(p => p.status === "published").length
  // Parcours guidé : tant qu'aucun scan, on montre la prochaine meilleure action
  const totalScans = profile?.total_scans || 0
  const firstPub = pages.find(p => p.status === "published")
  const guide: null | "nopage" | "noscan" = pages.length === 0 ? "nopage" : totalScans === 0 ? "noscan" : null
  // Quota de vues mensuel (soft-cap : on alerte, on ne bloque jamais les pages publiques)
  const viewsLimit = getPlan(profile?.plan).limits.views // null = illimité
  const viewsPct   = viewsLimit ? Math.min(Math.round((monthViews / viewsLimit) * 100), 999) : 0
  const nearViews  = viewsLimit != null && monthViews >= viewsLimit * 0.8 && monthViews < viewsLimit
  const overViews  = viewsLimit != null && monthViews >= viewsLimit

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "30px 28px 48px", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* En-tête */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div className="skeleton" style={{ width: 280, height: 38, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: 150, height: 16 }} />
          </div>
          <div className="skeleton" style={{ width: 150, height: 44, borderRadius: 12 }} />
        </div>
        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 13, marginBottom: 20 }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 104, borderRadius: 14 }} />)}
        </div>
        {/* Colonnes */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
          <div className="skeleton" style={{ height: 340, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 340, borderRadius: 16 }} />
        </div>
      </div>
    </div>
  )

  // Hover lift réutilisable (anime + restaure l'ombre de repos)
  const hov = (rest = "none") => ({
    onMouseEnter: (e: any) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 38px rgba(0,0,0,0.5)" },
    onMouseLeave: (e: any) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = rest },
  })
  const maxToday = Math.max(1, ...weekViews)

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 600px at 70% -10%, color-mix(in srgb, var(--accent) 6%, transparent), transparent 60%), #080808", padding: "30px 28px 48px", fontFamily: "DM Sans, sans-serif", position: "relative" }}>
      <Particles />
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        .dz{animation:fadeUp .5s cubic-bezier(.2,.8,.2,1) backwards}
        .dz-row{transition:background .15s, transform .15s}
        .dz-row:hover{background:rgba(255,255,255,0.025)!important;transform:translateX(2px)}
        .dz-card{transition:transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s, border-color .2s}
        .dz-arrow{transition:transform .2s}
        .dz-row:hover .dz-arrow,.dz-act:hover .dz-arrow{transform:translateX(3px)}
        .dz-cta{transition:transform .18s, box-shadow .18s}
        .dz-cta:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 10px 30px color-mix(in srgb, var(--accent) 40%, transparent)!important}
        .dz-cta:active{transform:translateY(0) scale(.98)}
      `}</style>

      {pageToDelete && (
        <DeleteModal
          page={pageToDelete}
          onConfirm={() => deletePage(pageToDelete)}
          onCancel={() => setPageToDelete(null)}
          deleting={deleting}
        />
      )}

      <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div className="dz" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(30px,4.5vw,44px)", lineHeight: 1.05, color: "#F5F0E8", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
              {greeting}{profile?.full_name ? ", " + profile.full_name.split(" ")[0] : ""} !
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: planCfg.color + "14", border: "1px solid " + planCfg.color + "33", borderRadius: 999, padding: "3px 11px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: planCfg.color, boxShadow: "0 0 7px " + planCfg.color, animation: "pulse 2.4s ease-in-out infinite" }} />
                <span style={{ color: planCfg.color, fontSize: 12, fontWeight: 700 }}>Plan {planCfg.label}</span>
              </span>
              <span style={{ color: MUTED, fontSize: 12.5 }}>
                <span style={{ color: "#39FF8F", fontWeight: 700 }}>{todayViews}</span> vue{todayViews > 1 ? "s" : ""} aujourd'hui
              </span>
            </div>
          </div>
          <Link href="/dashboard/templates" className="dz-cta"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(90deg,var(--accent),color-mix(in srgb, var(--accent) 75%, #000))", borderRadius: 12, padding: "11px 22px", color: "#080808", textDecoration: "none", fontSize: 14, fontWeight: 800, boxShadow: "0 6px 22px color-mix(in srgb, var(--accent) 28%, transparent)", flexShrink: 0 }}>
            <Plus size={16} strokeWidth={2.6} /> Nouvelle page
          </Link>
        </div>

        {/* Soft-cap quota de vues : alerte (jamais de blocage des pages publiques) */}
        {(nearViews || overViews) && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: overViews ? "rgba(255,107,107,0.08)" : "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid " + (overViews ? "rgba(255,107,107,0.3)" : "color-mix(in srgb, var(--accent) 30%, transparent)"), borderRadius: 14, padding: "14px 18px", marginBottom: 22 }}>
            <AlertTriangle size={18} color={overViews ? "#FF6B6B" : G} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ color: "#F5F0E8", fontSize: 13.5, fontWeight: 700, margin: "0 0 2px" }}>
                {overViews
                  ? `Quota de vues atteint (${monthViews.toLocaleString("fr-FR")} / ${viewsLimit!.toLocaleString("fr-FR")} ce mois-ci)`
                  : `Bientôt à court de vues : ${monthViews.toLocaleString("fr-FR")} / ${viewsLimit!.toLocaleString("fr-FR")} (${viewsPct}%)`}
              </p>
              <p style={{ color: MUTED, fontSize: 11.5, margin: 0, lineHeight: 1.5 }}>
                {overViews
                  ? "Tes QR codes et pages restent 100% en ligne — rien n'est coupé. Passe à un plan supérieur pour relancer le compteur et débloquer plus de vues."
                  : "Tes pages restent en ligne sans interruption. Pense à monter en plan pour ne pas être limité."}
              </p>
              <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", marginTop: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: Math.min(viewsPct, 100) + "%", background: overViews ? "linear-gradient(90deg,#FF6B6B,#F97316)" : "linear-gradient(90deg,var(--accent),color-mix(in srgb, var(--accent) 75%, #000))", borderRadius: 3 }} />
              </div>
            </div>
            <Link href="/upgrade" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, background: overViews ? "linear-gradient(90deg,#FF6B6B,#F97316)" : "linear-gradient(90deg,var(--accent),color-mix(in srgb, var(--accent) 75%, #000))", borderRadius: 10, padding: "9px 16px", color: "#080808", textDecoration: "none", fontSize: 12.5, fontWeight: 800 }}>
              <Zap size={13} /> Augmenter mon quota
            </Link>
          </div>
        )}

        {/* Premiers pas : checklist d'onboarding (tant qu'aucun scan) */}
        {guide && (() => {
          const firstPage = pages[0]
          const steps = [
            { label: "Créer une page", desc: "Partez d'un modèle adapté à votre métier.", done: pages.length > 0, cta: { label: "Créer ma première page", href: "/dashboard/templates", Icon: Plus } },
            { label: "Publier votre page", desc: "Rendez-la accessible via son lien et son QR.", done: publishedCount > 0, cta: firstPage ? { label: "Publier ma page", href: "/dashboard/builder/" + firstPage.id, Icon: Globe } : { label: "Créer une page", href: "/dashboard/templates", Icon: Plus } },
            { label: "Obtenir un premier scan", desc: "Testez ou partagez votre QR pour démarrer le suivi.", done: totalScans > 0, cta: { label: "Tester mon QR code", href: "/dashboard/qr-codes", Icon: QrCode } },
          ]
          const doneN = steps.filter(s => s.done).length
          const current = steps.find(s => !s.done)
          return (
            <div className="dz" style={{ animationDelay: "40ms", marginBottom: 20, padding: "20px 22px", borderRadius: 16, position: "relative", overflow: "hidden",
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, #100F0A), #100F0A)",
              border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", boxShadow: "0 10px 34px rgba(0,0,0,0.3)" }}>
              <div style={{ position: "absolute", top: -30, right: -20, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 8, background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: G }}><Zap size={15} /></span>
                    <span style={{ color: G, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" as const }}>Premiers pas</span>
                  </div>
                  <h2 style={{ color: "#F8F4EC", fontSize: 21, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif", letterSpacing: "-0.3px" }}>Lancez votre QRfolio en 3 étapes</h2>
                </div>
                <div style={{ textAlign: "right" as const, minWidth: 120 }}>
                  <span style={{ color: "#F8F4EC", fontSize: 22, fontWeight: 700, fontFamily: "Cormorant Garamond, serif" }}>{doneN}<span style={{ color: MUTED, fontSize: 15 }}> / {steps.length}</span></span>
                  <div style={{ height: 6, width: 120, borderRadius: 3, background: "rgba(255,255,255,0.08)", marginTop: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(doneN / steps.length) * 100}%`, background: "linear-gradient(90deg,var(--accent),color-mix(in srgb, var(--accent) 75%, #000))", borderRadius: 3, transition: "width .5s ease" }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {steps.map((s, i) => {
                  const isCurrent = !s.done && current === s
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 11,
                      background: isCurrent ? "color-mix(in srgb, var(--accent) 9%, transparent)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isCurrent ? "color-mix(in srgb, var(--accent) 28%, transparent)" : "rgba(255,255,255,0.05)"}` }}>
                      <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: s.done ? "rgba(57,255,143,0.15)" : "transparent",
                        border: s.done ? "1px solid rgba(57,255,143,0.4)" : `2px solid ${isCurrent ? G : "rgba(255,255,255,0.15)"}` }}>
                        {s.done ? <Check size={13} color="#39FF8F" /> : <span style={{ color: isCurrent ? G : MUTED, fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: s.done ? MUTED : "#F5F0E8", fontSize: 13.5, fontWeight: 600, margin: 0, textDecoration: s.done ? "line-through" : "none" }}>{s.label}</p>
                        {!s.done && <p style={{ color: MUTED, fontSize: 11.5, margin: "1px 0 0" }}>{s.desc}</p>}
                      </div>
                      {isCurrent && (
                        <Link href={s.cta.href} className="dz-cta" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "8px 15px", borderRadius: 9, background: "linear-gradient(90deg,var(--accent),color-mix(in srgb, var(--accent) 75%, #000))", color: "#080808", textDecoration: "none", fontSize: 12.5, fontWeight: 800, boxShadow: "0 5px 16px color-mix(in srgb, var(--accent) 25%, transparent)" }}>
                          <s.cta.Icon size={14} strokeWidth={2.5} /> {s.cta.label}
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 13, marginBottom: 20 }}>
          {[
            { icon: <QrCode size={18} />, label: "Scans totaux", value: (profile?.total_scans || 0).toLocaleString("fr-FR"), color: "#39FF8F", sub: "tous temps", hero: true },
            { icon: <BarChart2 size={18} />, label: "Vues ce mois", value: monthViews.toLocaleString("fr-FR"), color: overViews ? "#FF6B6B" : "#7B61FF", sub: viewsLimit ? `/ ${viewsLimit.toLocaleString("fr-FR")}` : "illimitées", spark: true },
            { icon: <Eye size={18} />, label: "Pages créées", value: profile?.total_pages || 0, color: G, sub: publishedCount + " publiée" + (publishedCount > 1 ? "s" : "") },
            { icon: <Globe size={18} />, label: "Publiées", value: publishedCount, color: "#38BDF8", sub: "sur " + pages.length + " pages" },
          ].map((kpi, i) => (
            <div key={i} className="dz dz-card" {...hov("none")}
              style={{ animationDelay: `${i * 70}ms`, background: kpi.hero ? "linear-gradient(135deg, color-mix(in srgb,#39FF8F 9%,#111009), #100F0A)" : "#100F0A", border: "1px solid " + (kpi.hero ? "rgba(57,255,143,0.28)" : "color-mix(in srgb, var(--accent) 12%, transparent)"), borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden", cursor: "default" }}>
              <div style={{ position: "absolute", top: -14, right: -14, width: 72, height: 72, borderRadius: "50%", background: "radial-gradient(circle," + kpi.color + "1f,transparent 70%)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ color: kpi.color, background: kpi.color + "1a", borderRadius: 9, padding: 8, display: "flex" }}>{kpi.icon}</div>
                {kpi.spark && weekViews.length === 7 && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 24 }}>
                    {weekViews.map((v, j) => (
                      <div key={j} style={{ width: 4, height: Math.max(3, Math.round((v / maxToday) * 24)), borderRadius: 2, background: j === 6 ? kpi.color : kpi.color + "55" }} />
                    ))}
                  </div>
                )}
              </div>
              <p style={{ color: "#F8F4EC", fontSize: kpi.hero ? 36 : 30, fontWeight: 700, margin: "10px 0 1px", fontFamily: "Cormorant Garamond, serif", lineHeight: 1 }}>{kpi.value}</p>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
                <p style={{ color: "#C9C3B6", fontSize: 11.5, margin: 0, fontWeight: 500 }}>{kpi.label}</p>
                <p style={{ color: kpi.color + "b0", fontSize: 10, margin: 0, whiteSpace: "nowrap" }}>{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Layout 2 colonnes — Mes pages = carte principale */}
        <div className="dz dash-2col" style={{ animationDelay: "180ms", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>

          {/* Pages (PRINCIPAL) */}
          <div style={{ background: "linear-gradient(180deg,#13110B,#100F0A)", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.25)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }} />
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ color: "#F8F4EC", fontSize: 15.5, fontWeight: 700, margin: 0, letterSpacing: "-0.2px" }}>Mes pages <span style={{ color: MUTED, fontWeight: 500 }}>({pages.length})</span></p>
              <Link href="/dashboard/templates" className="dz-cta" style={{ display: "flex", alignItems: "center", gap: 5, color: "#080808", background: "color-mix(in srgb, var(--accent) 90%, #fff)", padding: "5px 11px", borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: "none" }}>
                <Plus size={11} strokeWidth={2.8} /> Nouvelle
              </Link>
            </div>
            {pages.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>📄</p>
                <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>Aucune page</p>
                <p style={{ color: MUTED, fontSize: 12, margin: "0 0 16px" }}>Cree ta premiere page avec un template</p>
                <Link href="/dashboard/templates" style={{ background: "linear-gradient(90deg," + G + ",color-mix(in srgb, var(--accent) 75%, #000))", color: "#080808", textDecoration: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  Choisir un template
                </Link>
              </div>
            ) : (
              <div>
                {pages.map((page, i) => (
                  <div key={page.id} className="dz-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: i < pages.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>

                    {/* Status dot cliquable pour publier/depublier */}
                    <button onClick={() => togglePublish(page)} title={page.status === "published" ? "Depublier" : "Publier"}
                      style={{ width: 10, height: 10, borderRadius: "50%", background: page.status === "published" ? "#39FF8F" : MUTED, border: "none", cursor: "pointer", flexShrink: 0, boxShadow: page.status === "published" ? "0 0 6px #39FF8F60" : "none", padding: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.title}</p>
                      <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>/{page.slug}</p>
                    </div>

                    <span style={{ color: G, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{page.total_views} vues</span>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <Link href={"/dashboard/builder/" + page.id} title="Editer"
                        style={{ width: 26, height: 26, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: MUTED }}>
                        <Edit3 size={11} />
                      </Link>
                      {page.status === "published" && (
                        <a href={"/" + page.slug} target="_blank" rel="noopener noreferrer" title="Voir"
                          style={{ width: 26, height: 26, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: MUTED }}>
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <button onClick={() => setPageToDelete(page)} title="Supprimer"
                        style={{ width: 26, height: 26, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444" }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {profile?.plan === "free" && (
              <div style={{ background: "linear-gradient(135deg,color-mix(in srgb, var(--accent) 10%, transparent),rgba(57,255,143,0.05))", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Zap size={16} color={G} />
                  <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: 0 }}>Passe a Starter — {fmtPrice(getPlan("starter").priceMonthly)}€/mois</p>
                </div>
                <p style={{ color: MUTED, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>{getPlan("starter").limits.pages} pages, {getPlan("starter").limits.views!.toLocaleString("fr-FR")} vues/mois, QR personnalises, sans branding</p>
                <Link href="/upgrade" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "linear-gradient(90deg," + G + ",color-mix(in srgb, var(--accent) 75%, #000))", color: "#080808", textDecoration: "none", padding: "9px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  Voir les offres <ArrowRight size={11} />
                </Link>
              </div>
            )}

            <div style={{ background: "#111009", border: "1px solid color-mix(in srgb, var(--accent) 12%, transparent)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0 }}>Actions rapides</p>
              </div>
              {[
                { icon: "📋", label: "Choisir un template", href: "/dashboard/templates", color: G },
                { icon: "📊", label: "Voir les analytics", href: "/dashboard/analytics", color: "#7B61FF" },
                { icon: "🎨", label: "Mes QR codes", href: "/dashboard/qr-codes", color: "#38BDF8" },
                { icon: "🌐", label: "Domaines perso", href: "/dashboard/domains", color: "#39FF8F" },
                { icon: "⚙️", label: "Parametres", href: "/dashboard/settings", color: MUTED },
              ].map((action, i, arr) => (
                <Link key={i} href={action.href} className="dz-row dz-act"
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", textDecoration: "none", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: action.color + "14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{action.icon}</span>
                  <span style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 500 }}>{action.label}</span>
                  <ArrowRight className="dz-arrow" size={13} color={action.color} style={{ marginLeft: "auto" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
