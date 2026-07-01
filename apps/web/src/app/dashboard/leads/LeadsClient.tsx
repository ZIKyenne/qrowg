"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Inbox, Mail, Phone, Trash2, Check, Search } from "lucide-react"

const G = "var(--accent, #C9A84C)"
const MUTED = "#8A8478"
const TEXT = "#F5F0E8"

type Lead = {
  id: string; page_id: string; block_id: string | null; type: string
  name: string | null; email: string | null; phone: string | null
  message: string | null; data: Record<string, any>; is_read: boolean; created_at: string
}
type Page = { id: string; title: string; slug: string }

const TYPE_LABELS: Record<string, string> = {
  quote: "Devis", reservation: "Réservation", booking: "Réservation événement",
  register: "Inscription", rsvp: "RSVP", form: "Message",
}
const TYPE_COLORS: Record<string, string> = {
  quote: "#C9A84C", reservation: "#EF4444", booking: "#9146FF",
  register: "#EC4899", rsvp: "#39FF8F", form: "#38BDF8",
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) + " · " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

export default function LeadsClient({ leads: initialLeads, pages }: { leads: Lead[]; pages: Page[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [filter, setFilter] = useState<string>("all")
  const [query, setQuery] = useState("")
  const supabase = createClient()

  const pageTitle = (id: string) => pages.find(p => p.id === id)?.title || "Page"

  const unreadCount = leads.filter(l => !l.is_read).length

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (filter === "unread" && l.is_read) return false
      if (filter !== "all" && filter !== "unread" && l.type !== filter) return false
      if (query) {
        const q = query.toLowerCase()
        const hay = [l.name, l.email, l.phone, l.message, JSON.stringify(l.data)].join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [leads, filter, query])

  const markRead = async (id: string, is_read: boolean) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, is_read } : l))
    await supabase.from("leads").update({ is_read }).eq("id", id)
  }
  const remove = async (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    await supabase.from("leads").delete().eq("id", id)
  }
  const exportCsv = () => {
    const rows = [["Date", "Type", "Page", "Nom", "Email", "Téléphone", "Message", "Détails"]]
    filtered.forEach(l => rows.push([
      fmtDate(l.created_at), TYPE_LABELS[l.type] || l.type, pageTitle(l.page_id),
      l.name || "", l.email || "", l.phone || "", (l.message || "").replace(/\n/g, " "),
      Object.entries(l.data || {}).map(([k, v]) => `${k}=${v}`).join("; "),
    ]))
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url; a.download = `messages-qrfolio.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const types = ["all", "unread", ...Array.from(new Set(leads.map(l => l.type)))]

  return (
    <div style={{ padding: "28px 24px 60px", maxWidth: 900, margin: "0 auto", fontFamily: "DM Sans, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 6, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: `color-mix(in srgb, ${G} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${G} 30%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Inbox size={20} color={G as string} />
          </div>
          <div>
            <h1 style={{ color: TEXT, fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>Messages</h1>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{leads.length} reçu{leads.length > 1 ? "s" : ""}{unreadCount > 0 ? ` · ${unreadCount} non lu${unreadCount > 1 ? "s" : ""}` : ""}</p>
          </div>
        </div>
        {leads.length > 0 && (
          <button onClick={exportCsv} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 14px", color: TEXT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>↓ Exporter CSV</button>
        )}
      </div>

      {leads.length === 0 ? (
        <div style={{ marginTop: 40, textAlign: "center", padding: "50px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16 }}>
          <Inbox size={40} color={MUTED} style={{ marginBottom: 14 }} />
          <p style={{ color: TEXT, fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>Aucun message pour l&apos;instant</p>
          <p style={{ color: MUTED, fontSize: 13, margin: 0, maxWidth: 380, marginInline: "auto", lineHeight: 1.6 }}>
            Les demandes de devis, réservations, inscriptions et réponses RSVP envoyées depuis vos pages publiques apparaîtront ici.
          </p>
        </div>
      ) : (
        <>
          {/* Filtres + recherche */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "20px 0 16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {types.map(t => (
                <button key={t} onClick={() => setFilter(t)} style={{
                  background: filter === t ? `color-mix(in srgb, ${G} 16%, transparent)` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${filter === t ? `color-mix(in srgb, ${G} 35%, transparent)` : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 20, padding: "6px 13px", color: filter === t ? (G as string) : MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  {t === "all" ? "Tous" : t === "unread" ? `Non lus${unreadCount ? ` (${unreadCount})` : ""}` : TYPE_LABELS[t] || t}
                </button>
              ))}
            </div>
            <div style={{ position: "relative", marginLeft: "auto", minWidth: 180 }}>
              <Search size={14} color={MUTED} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher…" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "8px 12px 8px 32px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Liste */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(l => {
              const tc = TYPE_COLORS[l.type] || G as string
              const extra = Object.entries(l.data || {}).filter(([k]) => !["nom", "email", "telephone"].includes(k.toLowerCase()))
              return (
                <div key={l.id} style={{
                  background: l.is_read ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${l.is_read ? "rgba(255,255,255,0.07)" : `color-mix(in srgb, ${tc} 30%, transparent)`}`,
                  borderRadius: 14, padding: "15px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                      {!l.is_read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: tc, flexShrink: 0 }} />}
                      <span style={{ background: `color-mix(in srgb, ${tc} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${tc} 30%, transparent)`, borderRadius: 20, padding: "3px 10px", color: tc, fontSize: 11, fontWeight: 700 }}>{TYPE_LABELS[l.type] || l.type}</span>
                      <span style={{ color: MUTED, fontSize: 12 }}>{pageTitle(l.page_id)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ color: MUTED, fontSize: 11 }}>{fmtDate(l.created_at)}</span>
                      <button title={l.is_read ? "Marquer non lu" : "Marquer lu"} onClick={() => markRead(l.id, !l.is_read)} style={{ background: "transparent", border: "none", cursor: "pointer", color: l.is_read ? MUTED : "#39FF8F", padding: 2 }}><Check size={15} /></button>
                      <button title="Supprimer" onClick={() => remove(l.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: MUTED, padding: 2 }}><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {l.name && <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{l.name}</p>}
                  {l.message && <p style={{ color: TEXT, fontSize: 13, margin: "0 0 8px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{l.message}</p>}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: extra.length ? 8 : 0 }}>
                    {l.email && <a href={`mailto:${l.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 8, padding: "6px 11px", color: "#38BDF8", textDecoration: "none", fontSize: 12, fontWeight: 600 }}><Mail size={12} /> {l.email}</a>}
                    {l.phone && <a href={`tel:${l.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(57,255,143,0.1)", border: "1px solid rgba(57,255,143,0.25)", borderRadius: 8, padding: "6px 11px", color: "#39FF8F", textDecoration: "none", fontSize: 12, fontWeight: 600 }}><Phone size={12} /> {l.phone}</a>}
                  </div>

                  {extra.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, background: "rgba(0,0,0,0.2)", borderRadius: 9, padding: "9px 12px" }}>
                      {extra.map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}>
                          <span style={{ color: MUTED }}>{k}</span>
                          <span style={{ color: TEXT, fontWeight: 500, textAlign: "right" }}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && <p style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: "30px" }}>Aucun message ne correspond à ce filtre.</p>}
          </div>
        </>
      )}
    </div>
  )
}
