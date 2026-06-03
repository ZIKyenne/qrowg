"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Eye, QrCode, FileText, Trash2, ExternalLink, Edit3, Check, X, BarChart2 } from "lucide-react"

type Page = {
  id: string
  title: string
  slug: string
  status: string
  total_views: number
  unique_views: number
  created_at: string
  qr_codes?: { short_code: string; total_scans: number }[]
}

type Profile = {
  full_name: string | null
  email: string
  plan: string
  total_scans: number
  total_pages: number
} | null

interface Props {
  profile: Profile
  pages: Page[]
}

function StatusBadge({ status }: { status: string }) {
  const published = status === "published"
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: published ? "rgba(57,255,143,0.08)" : "rgba(138,132,120,0.1)",
      border: `1px solid ${published ? "rgba(57,255,143,0.25)" : "rgba(138,132,120,0.2)"}`,
      borderRadius: 20, padding: "3px 10px"
    }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: published ? "#39FF8F" : "#8A8478", boxShadow: published ? "0 0 6px rgba(57,255,143,0.6)" : "none" }} />
      <span style={{ color: published ? "#39FF8F" : "#8A8478", fontSize: 11, fontWeight: 600 }}>
        {published ? "Publiée" : "Brouillon"}
      </span>
    </div>
  )
}

export default function DashboardClient({ profile, pages: initialPages }: Props) {
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const supabase = createClient()

  const totalViews = pages.reduce((s, p) => s + (p.total_views || 0), 0)
  const totalScans = pages.reduce((s, p) => s + ((p.qr_codes as any)?.[0]?.total_scans || 0), 0)
  const publishedCount = pages.filter(p => p.status === "published").length

  async function handleDelete(pageId: string) {
    setDeletingId(pageId)
    await supabase.from("pages").delete().eq("id", pageId)
    setPages(prev => prev.filter(p => p.id !== pageId))
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  async function handleSaveTitle(pageId: string) {
    if (!editTitle.trim()) return
    await supabase.from("pages").update({ title: editTitle.trim() }).eq("id", pageId)
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, title: editTitle.trim() } : p))
    setEditingId(null)
  }

  const planColor: Record<string, string> = { free: "#8A8478", pro: "#C9A84C", business: "#39FF8F" }
  const pc = planColor[profile?.plan || "free"]

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 24px", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>
              Bonjour{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
            </h1>
            <p style={{ color: "#8A8478", marginTop: 4, fontSize: 14 }}>
              {pages.length} page{pages.length > 1 ? "s" : ""} créée{pages.length > 1 ? "s" : ""}
            </p>
          </div>
          <a href="/dashboard/pages/new" style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(90deg, #C9A84C, #b8953f)",
            color: "#080808", textDecoration: "none", fontSize: 14, fontWeight: 700,
            padding: "12px 22px", borderRadius: 10,
            boxShadow: "0 4px 20px rgba(201,168,76,0.3)"
          }}>
            <Plus size={16} /> Nouvelle page
          </a>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { icon: <FileText size={18} />, label: "Pages publiées", value: publishedCount, color: "#C9A84C" },
            { icon: <Eye size={18} />, label: "Vues totales", value: totalViews, color: "#39FF8F" },
            { icon: <QrCode size={18} />, label: "Scans totaux", value: totalScans, color: "#7B61FF" },
            { icon: <BarChart2 size={18} />, label: "Plan actuel", value: profile?.plan || "free", color: pc, isText: true },
          ].map((kpi, i) => (
            <div key={i} style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ color: kpi.color, background: `${kpi.color}15`, borderRadius: 8, padding: 10, flexShrink: 0 }}>{kpi.icon}</div>
              <div>
                <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>{kpi.label}</p>
                <p style={{ color: "#F5F0E8", fontSize: (kpi as any).isText ? 16 : 22, fontWeight: 700, margin: 0, textTransform: "capitalize" }}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pages list */}
        {pages.length === 0 ? (
          <div style={{ border: "1px dashed rgba(201,168,76,0.2)", borderRadius: 20, padding: "80px 40px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={32} color="#C9A84C" />
            </div>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, color: "#F5F0E8", fontWeight: 700, margin: "0 0 12px" }}>
              Ta première page t'attend
            </h2>
            <p style={{ color: "#8A8478", marginBottom: 28, fontSize: 14, lineHeight: 1.7 }}>
              Crée ta landing page en quelques minutes, sans coder.
            </p>
            <a href="/dashboard/pages/new" style={{ background: "linear-gradient(90deg, #C9A84C, #b8953f)", color: "#080808", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "14px 28px", borderRadius: 10, display: "inline-block" }}>
              Créer ma première page →
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pages.map((page) => {
              const scans = (page.qr_codes as any)?.[0]?.total_scans || 0
              const isEditing = editingId === page.id
              const isConfirmDelete = confirmDeleteId === page.id
              const isDeleting = deletingId === page.id

              return (
                <div key={page.id} style={{
                  background: "#111009", border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: 16, padding: "24px 28px", position: "relative", overflow: "hidden",
                  transition: "border-color 0.2s",
                }}>
                  {/* Top glow line */}
                  <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleSaveTitle(page.id); if (e.key === "Escape") setEditingId(null) }}
                            autoFocus
                            style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 8, padding: "8px 12px", color: "#F5F0E8", fontSize: 15, fontWeight: 600, outline: "none" }}
                          />
                          <button onClick={() => handleSaveTitle(page.id)} style={{ background: "rgba(57,255,143,0.1)", border: "1px solid rgba(57,255,143,0.3)", borderRadius: 8, padding: "8px", cursor: "pointer", color: "#39FF8F" }}>
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "8px", cursor: "pointer", color: "#FF6B6B" }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <h3 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: 0 }}>{page.title}</h3>
                          <button onClick={() => { setEditingId(page.id); setEditTitle(page.title) }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8478", padding: 2, display: "flex" }}>
                            <Edit3 size={13} />
                          </button>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <StatusBadge status={page.status} />
                        <span style={{ color: "#8A8478", fontSize: 12 }}>qrfolio.app/{page.slug}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      {[
                        { icon: <Eye size={13} />, value: page.total_views || 0, label: "vues" },
                        { icon: <QrCode size={13} />, value: scans, label: "scans" },
                      ].map((s, i) => (
                        <div key={i} style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#C9A84C", justifyContent: "center" }}>
                            {s.icon}
                            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, fontWeight: 700 }}>{s.value}</span>
                          </div>
                          <p style={{ color: "#8A8478", fontSize: 11, margin: 0 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {page.status === "published" && (
                        <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(57,255,143,0.25)", color: "#39FF8F", padding: "8px 14px", borderRadius: 8, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                          <ExternalLink size={12} /> Voir
                        </a>
                      )}
                      <a href={`/dashboard/builder/${page.id}`} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C", padding: "8px 14px", borderRadius: 8, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                        <Edit3 size={12} /> Modifier
                      </a>

                      {/* Delete */}
                      {isConfirmDelete ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleDelete(page.id)} disabled={isDeleting}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.4)", borderRadius: 8, padding: "8px 12px", color: "#FF6B6B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            {isDeleting ? "..." : <><Trash2 size={12} /> Confirmer</>}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: "#8A8478", cursor: "pointer" }}>
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(page.id)}
                          style={{ background: "none", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 8, padding: "8px 10px", color: "#8A8478", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.2s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,107,0.4)"; (e.currentTarget as HTMLElement).style.color = "#FF6B6B" }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,107,0.15)"; (e.currentTarget as HTMLElement).style.color = "#8A8478" }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Upgrade banner si free */}
        {profile?.plan === "free" && pages.length > 0 && (
          <div style={{ marginTop: 24, background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: "#8A8478", fontSize: 13, margin: 0 }}>
              🔒 Plan Free — limité à 1 page et 500 vues/mois
            </p>
            <a href="/upgrade" style={{ background: "linear-gradient(90deg, #C9A84C, #b8953f)", color: "#080808", textDecoration: "none", fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 8 }}>
              Passer Pro →
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
