"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, FileText, BarChart, QrCode, User,
  Activity, ChevronRight, LogOut, Settings, Menu, X, Eye, Inbox, Images
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const DEFAULT_ACCENT = "#C9A84C"
const MUTED = "#8A8478"

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/templates", icon: FileText, label: "Templates" },
  { href: "/dashboard/assets", icon: Images, label: "Médias" },
  { href: "/dashboard/analytics", icon: BarChart, label: "Analytics" },
  { href: "/dashboard/leads", icon: Inbox, label: "Messages" },
  { href: "/dashboard/qr-codes", icon: QrCode, label: "QR Codes" },
  { href: "/dashboard/profile", icon: User, label: "Profil" },
  { href: "/dashboard/settings", icon: Settings, label: "Parametres" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("qrfolio_sidebar") === "collapsed"
    }
    return false
  })
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [accent, setAccent] = useState(DEFAULT_ACCENT) // couleur d'accent de l'utilisateur
  const [isMobile, setIsMobile] = useState(false) // < 860px : menu replié d'office
  const [unreadLeads, setUnreadLeads] = useState(0) // messages non lus (badge nav)
  const G = accent

  useEffect(() => {
    setMounted(true)
    // accent instantané depuis le cache local (évite le flash)
    const cached = localStorage.getItem("qrfolio_accent")
    if (cached) setAccent(cached)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        supabase.from("profiles").select("*").eq("id", data.user.id).single()
          .then(({ data: p }) => {
            setProfile(p)
            const acc = p?.preferences?.accent_color || p?.accent_color
            if (acc) { setAccent(acc); localStorage.setItem("qrfolio_accent", acc) }
          })
        // Compteur de messages non lus (RLS limite aux pages de l'utilisateur)
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("is_read", false)
          .then(({ count }: any) => { if (typeof count === "number") setUnreadLeads(count) })
      }
    })
  }, [])

  // Rafraîchit le compteur quand on quitte la page Messages (les lus y sont marqués)
  useEffect(() => {
    if (!user || pathname === "/dashboard/leads") return
    const supabase = createClient()
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("is_read", false)
      .then(({ count }: any) => { if (typeof count === "number") setUnreadLeads(count) })
  }, [pathname, user])

  // Mise à jour live quand on change la couleur depuis la page Profil
  useEffect(() => {
    const onAccent = (e: Event) => { const c = (e as CustomEvent).detail; if (c) setAccent(c) }
    window.addEventListener("qrfolio-accent", onAccent)
    return () => window.removeEventListener("qrfolio-accent", onAccent)
  }, [])

  // Expose l'accent en variable CSS globale -> toutes les pages du dashboard (et portails) la suivent
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent)
  }, [accent])

  // Responsive : sous 860px on replie d'office (sans écraser la préférence desktop)
  useEffect(() => {
    const onResize = () => {
      const mob = window.innerWidth < 860
      setIsMobile(mob)
      if (mob) setCollapsed(true)
      else setCollapsed(localStorage.getItem("qrfolio_sidebar") === "collapsed")
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    if (mounted && !isMobile) {
      localStorage.setItem("qrfolio_sidebar", collapsed ? "collapsed" : "expanded")
    }
  }, [collapsed, mounted, isMobile])

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const W = isMobile ? 0 : (collapsed ? 72 : 240)

  return (
    <div style={{
      display: "flex", height: "100vh", fontFamily: "DM Sans, sans-serif", overflow: "hidden",
      // Signature QRfolio : socle doré + trame matrice QR (cellules carrées) partagée par toute l'app
      background:
        "radial-gradient(120% 80% at 50% -8%, rgba(201,168,76,0.05), transparent 55%)," +
        "linear-gradient(rgba(201,168,76,0.022) 1px, transparent 1px) 0 0 / 24px 24px," +
        "linear-gradient(90deg, rgba(201,168,76,0.022) 1px, transparent 1px) 0 0 / 24px 24px," +
        "#070707",
    }}>
      {/* SIDEBAR (masquée sur mobile : remplacée par la barre du bas) */}
      <div style={{
        width: W, minWidth: W, background: "#0A0A0A",
        borderRight: "1px solid rgba(201,168,76,0.1)",
        display: isMobile ? "none" : "flex", flexDirection: "column",
        transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden", flexShrink: 0, position: "relative", zIndex: 30
      }}>
        {/* Header: Logo + Toggle */}
        <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: collapsed ? "0 14px" : "0 16px 0 20px", borderBottom: "1px solid rgba(201,168,76,0.08)", flexShrink: 0 }}>
          {/* Logo */}
          <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${G}, color-mix(in srgb, var(--accent) 75%, #000))`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${G}40` }}>
              <QrCode size={14} color="#080808" />
            </div>
            {!collapsed && (
              <span style={{ color: G, fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden" }}>
                QRfolio
              </span>
            )}
          </Link>
          {/* Bouton toggle */}
          <button onClick={() => setCollapsed(p => !p)}
            style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, cursor: "pointer", color: MUTED, flexShrink: 0, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.1)"; e.currentTarget.style.color = G; e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}>
            <ChevronRight size={13} style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s" }} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }} className="sidebar-nav">
          {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact)
            return (
              <div key={href} style={{ position: "relative" }} className="sidebar-item">
                <Link href={href} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: collapsed ? "10px 0" : "9px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: 9,
                    background: active ? `${G}12` : "transparent",
                    border: `1px solid ${active ? G+"30" : "transparent"}`,
                    color: active ? G : MUTED,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    marginBottom: 2,
                    whiteSpace: "nowrap", overflow: "hidden",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#F5F0E8" } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = MUTED } }}>
                    <div style={{ position: "relative", flexShrink: 0, display: "flex" }}>
                      <Icon size={16} />
                      {href === "/dashboard/leads" && unreadLeads > 0 && (
                        <span style={{ position: "absolute", top: -5, right: collapsed ? -5 : -6, minWidth: 15, height: 15, padding: "0 4px", borderRadius: 8, background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, boxShadow: "0 0 0 2px #0A0A0A" }}>{unreadLeads > 99 ? "99+" : unreadLeads}</span>
                      )}
                    </div>
                    {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
                    {!collapsed && href === "/dashboard/leads" && unreadLeads > 0 && <span style={{ marginLeft: "auto", background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 9, padding: "1px 7px", flexShrink: 0 }}>{unreadLeads > 99 ? "99+" : unreadLeads}</span>}
                    {!collapsed && active && href !== "/dashboard/leads" && <div style={{ width: 4, height: 4, borderRadius: "50%", background: G, marginLeft: "auto", flexShrink: 0 }} />}
                  </div>
                </Link>
                {/* Tooltip en mode collapsed */}
                {collapsed && (
                  <div className="sidebar-tooltip" style={{
                    position: "absolute", left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)",
                    background: "#1A1A1A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8,
                    padding: "6px 12px", color: "#F5F0E8", fontSize: 12, fontWeight: 600,
                    whiteSpace: "nowrap", pointerEvents: "none", zIndex: 100,
                    opacity: 0, transition: "opacity 0.15s", boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
                  }}>
                    {label}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Section bas: Upgrade + User */}
        <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          {/* Upgrade */}
          <div style={{ position: "relative" }} className="sidebar-item">
            <Link href="/upgrade" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "10px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 9, cursor: "pointer",
                background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                marginBottom: 6, transition: "all 0.15s", overflow: "hidden",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.14)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)" }}>
                <Activity size={16} color={G} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <div style={{ overflow: "hidden", minWidth: 0 }}>
                    <p style={{ color: G, fontSize: 12, fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Upgrade</p>
                    <p style={{ color: MUTED, fontSize: 10, margin: 0, whiteSpace: "nowrap" }}>{profile?.plan === "business" ? "Business" : profile?.plan === "pro" ? "Plan Pro" : "Passer Pro"}</p>
                  </div>
                )}
              </div>
            </Link>
            {collapsed && (
              <div className="sidebar-tooltip" style={{
                position: "absolute", left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)",
                background: "#1A1A1A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8,
                padding: "6px 12px", color: G, fontSize: 12, fontWeight: 600,
                whiteSpace: "nowrap", pointerEvents: "none", zIndex: 100,
                opacity: 0, transition: "opacity 0.15s", boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
              }}>
                Upgrade
              </div>
            )}
          </div>

          {/* Utilisateur */}
          {user && (
            <div style={{ position: "relative" }} className="sidebar-item">
              <Link href="/dashboard/profile" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "8px 0" : "8px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 9, overflow: "hidden", cursor: "pointer" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${G}, color-mix(in srgb, var(--accent) 75%, #000))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#080808", flexShrink: 0 }}>
                  {(profile?.full_name || user.email || "?")[0].toUpperCase()}
                </div>
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {profile?.full_name || user.email?.split("@")[0] || "Utilisateur"}
                    </p>
                    <p style={{ color: MUTED, fontSize: 10, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {profile?.plan ? `Plan ${profile.plan}` : "Plan Free"}
                    </p>
                  </div>
                )}
              </Link>
              {collapsed && (
                <div className="sidebar-tooltip" style={{
                  position: "absolute", left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)",
                  background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  padding: "6px 12px", color: "#F5F0E8", fontSize: 12, fontWeight: 600,
                  whiteSpace: "nowrap", pointerEvents: "none", zIndex: 100,
                  opacity: 0, transition: "opacity 0.15s", boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
                }}>
                  {profile?.full_name || user.email?.split("@")[0] || "Compte"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflow: "auto", minWidth: 0, paddingBottom: isMobile ? "calc(64px + env(safe-area-inset-bottom))" : 0 }}>
        {children}
      </main>

      {/* BARRE DE NAVIGATION MOBILE (bottom bar) */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          display: "flex", alignItems: "stretch",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "rgba(10,10,10,0.96)", backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(201,168,76,0.14)",
          boxShadow: "0 -8px 24px rgba(0,0,0,0.4)",
        }}>
          {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link key={href} href={href}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  padding: "10px 4px",
                  textDecoration: "none", color: active ? G : MUTED, position: "relative", transition: "color .15s",
                }}>
                {active && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 3, borderRadius: "0 0 3px 3px", background: G }} />}
                <div style={{ position: "relative", display: "flex" }}>
                  <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                  {href === "/dashboard/leads" && unreadLeads > 0 && (
                    <span style={{ position: "absolute", top: -6, right: -8, minWidth: 15, height: 15, padding: "0 4px", borderRadius: 8, background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{unreadLeads > 99 ? "99+" : unreadLeads}</span>
                  )}
                </div>
                <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, letterSpacing: 0.1 }}>{label}</span>
              </Link>
            )
          })}
        </nav>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .sidebar-nav::-webkit-scrollbar { display: none }
        .sidebar-item:hover .sidebar-tooltip { opacity: 1 !important }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
