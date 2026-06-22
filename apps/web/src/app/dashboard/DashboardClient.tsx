"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Plus, QrCode, BarChart2, Eye, Zap, ArrowRight, Globe, Trash2, ExternalLink, Edit3, AlertTriangle, X } from "lucide-react"
import { getPlan, fmtPrice } from "@/lib/plans"

type Page = { id: string; title: string; slug: string; status: string; total_views: number; created_at: string }
type Profile = { full_name: string | null; plan: string; total_scans: number; total_pages: number; avatar_url: string | null }

const PLAN_CONFIG: Record<string, { color: string; label: string }> = {
  free: { color: "#8A8478", label: "Free" },
  starter: { color: "#38BDF8", label: "Starter" },
  pro: { color: "#C9A84C", label: "Pro" },
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
      const { count } = await supabase.from("page_views").select("id", { count: "exact", head: true }).in("page_id", ids).gte("viewed_at", monthStart)
      setMonthViews(count ?? 0)
    } else setMonthViews(0)
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
  const G = "#C9A84C"; const MUTED = "#8A8478"
  const publishedCount = pages.filter(p => p.status === "published").length
  // Quota de vues mensuel (soft-cap : on alerte, on ne bloque jamais les pages publiques)
  const viewsLimit = getPlan(profile?.plan).limits.views // null = illimité
  const viewsPct   = viewsLimit ? Math.min(Math.round((monthViews / viewsLimit) * 100), 999) : 0
  const nearViews  = viewsLimit != null && monthViews >= viewsLimit * 0.8 && monthViews < viewsLimit
  const overViews  = viewsLimit != null && monthViews >= viewsLimit

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "2px solid rgba(201,168,76,0.15)", borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 28px", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {pageToDelete && (
        <DeleteModal
          page={pageToDelete}
          onConfirm={() => deletePage(pageToDelete)}
          onCancel={() => setPageToDelete(null)}
          deleting={deleting}
        />
      )}

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 30, color: "#F5F0E8", fontWeight: 700, margin: "0 0 4px" }}>
              {greeting}{profile?.full_name ? ", " + profile.full_name.split(" ")[0] : ""} !
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: planCfg.color, boxShadow: "0 0 6px " + planCfg.color + "80" }} />
              <span style={{ color: planCfg.color, fontSize: 12, fontWeight: 600 }}>Plan {planCfg.label}</span>
            </div>
          </div>
          <Link href="/dashboard/templates"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius: 12, padding: "10px 20px", color: "#080808", textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 20px rgba(201,168,76,0.25)", flexShrink: 0 }}>
            <Plus size={16} /> Nouvelle page
          </Link>
        </div>

        {/* Soft-cap quota de vues : alerte (jamais de blocage des pages publiques) */}
        {(nearViews || overViews) && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: overViews ? "rgba(255,107,107,0.08)" : "rgba(201,168,76,0.08)", border: "1px solid " + (overViews ? "rgba(255,107,107,0.3)" : "rgba(201,168,76,0.3)"), borderRadius: 14, padding: "14px 18px", marginBottom: 22 }}>
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
                <div style={{ height: "100%", width: Math.min(viewsPct, 100) + "%", background: overViews ? "linear-gradient(90deg,#FF6B6B,#F97316)" : "linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius: 3 }} />
              </div>
            </div>
            <Link href="/upgrade" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, background: overViews ? "linear-gradient(90deg,#FF6B6B,#F97316)" : "linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius: 10, padding: "9px 16px", color: "#080808", textDecoration: "none", fontSize: 12.5, fontWeight: 800 }}>
              <Zap size={13} /> Augmenter mon quota
            </Link>
          </div>
        )}

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { icon: <Eye size={18} />, label: "Pages creees", value: profile?.total_pages || 0, color: G, sub: publishedCount + " publiee" + (publishedCount > 1 ? "s" : "") },
            { icon: <QrCode size={18} />, label: "Scans totaux", value: profile?.total_scans || 0, color: "#39FF8F", sub: "tous temps" },
            { icon: <BarChart2 size={18} />, label: "Vues ce mois", value: monthViews, color: overViews ? "#FF6B6B" : "#7B61FF", sub: viewsLimit ? `/ ${viewsLimit.toLocaleString("fr-FR")} ce mois` : "illimitées" },
            { icon: <Globe size={18} />, label: "Publiees", value: publishedCount, color: "#38BDF8", sub: "sur " + pages.length + " pages" },
          ].map((kpi, i) => (
            <div key={i} style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: "radial-gradient(circle," + kpi.color + "12,transparent 70%)" }} />
              <div style={{ color: kpi.color, background: kpi.color + "15", borderRadius: 8, padding: 8, width: "fit-content", marginBottom: 10 }}>{kpi.icon}</div>
              <p style={{ color: "#F5F0E8", fontSize: 28, fontWeight: 700, margin: "0 0 2px", fontFamily: "Cormorant Garamond, serif" }}>{kpi.value}</p>
              <p style={{ color: MUTED, fontSize: 11, margin: "0 0 2px" }}>{kpi.label}</p>
              <p style={{ color: kpi.color + "80", fontSize: 10, margin: 0 }}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Layout 2 colonnes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>

          {/* Pages */}
          <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0 }}>Mes pages ({pages.length})</p>
              <Link href="/dashboard/templates" style={{ display: "flex", alignItems: "center", gap: 4, color: G, fontSize: 11, textDecoration: "none" }}>
                <Plus size={11} /> Nouvelle
              </Link>
            </div>
            {pages.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>📄</p>
                <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>Aucune page</p>
                <p style={{ color: MUTED, fontSize: 12, margin: "0 0 16px" }}>Cree ta premiere page avec un template</p>
                <Link href="/dashboard/templates" style={{ background: "linear-gradient(90deg," + G + ",#b8953f)", color: "#080808", textDecoration: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  Choisir un template
                </Link>
              </div>
            ) : (
              <div>
                {pages.map((page, i) => (
                  <div key={page.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < pages.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

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
              <div style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(57,255,143,0.05))", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Zap size={16} color={G} />
                  <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: 0 }}>Passe a Starter — {fmtPrice(getPlan("starter").priceMonthly)}€/mois</p>
                </div>
                <p style={{ color: MUTED, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>{getPlan("starter").limits.pages} pages, {getPlan("starter").limits.views!.toLocaleString("fr-FR")} vues/mois, QR personnalises, sans branding</p>
                <Link href="/upgrade" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "linear-gradient(90deg," + G + ",#b8953f)", color: "#080808", textDecoration: "none", padding: "9px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  Voir les offres <ArrowRight size={11} />
                </Link>
              </div>
            )}

            <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, overflow: "hidden" }}>
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
                <Link key={i} href={action.href}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", textDecoration: "none", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 16 }}>{action.icon}</span>
                  <span style={{ color: "#F5F0E8", fontSize: 13 }}>{action.label}</span>
                  <ArrowRight size={12} color={MUTED} style={{ marginLeft: "auto" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
