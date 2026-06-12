"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Copy, Check, Gift, Star, TrendingUp, Users, QrCode, Eye,
  Crown, Zap, Camera, Save, ExternalLink, Shield, Key,
  Bell, Globe, Trash2, Download, ChevronRight, Lock,
  LogOut, AlertTriangle, Plus, X, RotateCcw, Activity,
  CreditCard, Code, Settings, CheckCircle
} from "lucide-react"

// -- Types --------------------------------------------------------------------
type Profile = {
  id: string; email: string; full_name: string | null; username: string | null
  bio: string | null; avatar_url: string | null; plan: string; website: string | null
  total_pages: number; total_scans: number; created_at: string; ref_code: string | null
}

type ApiKey = {
  id: string; name: string; key_preview: string; last_used_at: string | null
  expires_at: string | null; is_active: boolean; created_at: string
}

type RecentPage = {
  id: string; title: string; slug: string; status: string
  total_views: number; updated_at: string
}

type RecentScan = {
  id: string; scanned_at: string; device: string; country: string | null
}

// -- Constantes ---------------------------------------------------------------
const G = "#C9A84C"
const MUTED = "#8A8478"
const BG = "#080808"
const SURF = "#111009"
const SURF2 = "#0F0E0B"

const PLAN_CFG = {
  free:     { color: MUTED,      label: "Free",     icon: Star,   features: ["1 page active","500 vues/mois","QR code basique","Analytics 7j"] },
  pro:      { color: G,          label: "Pro",       icon: Zap,    features: ["Pages illimitees","Vues illimitees","Domaine personnalise","Analytics 30j","QR premium"] },
  business: { color: "#39FF8F",  label: "Business",  icon: Crown,  features: ["Tout Plan Pro inclus","Gestion equipe","Acces API complet","Support dedie 24/7","Exports PDF"] },
}

// -- Composants utilitaires ----------------------------------------------------
function SectionCard({ title, icon: Icon, color = G, children, action, tag }: {
  title: string; icon: any; color?: string; children: React.ReactNode
  action?: React.ReactNode; tag?: string
}) {
  return (
    <div style={{ background: SURF, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: color + "12", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={14} color={color}/>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: 0 }}>{title}</p>
            {tag && <span style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 4, padding: "1px 6px", fontSize: 9, color: G, fontWeight: 700 }}>{tag}</span>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  )
}

function StatPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: SURF2, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color={color}/>
      </div>
      <div>
        <p style={{ color: "#F5F0E8", fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1, fontFamily: "Cormorant Garamond, serif" }}>{value}</p>
        <p style={{ color: MUTED, fontSize: 10, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</p>
      </div>
    </div>
  )
}

// -- Page principale -----------------------------------------------------------
export default function ProfilePage() {
  const [profile, setProfile]           = useState<Profile | null>(null)
  const [referrals, setReferrals]       = useState<any[]>([])
  const [apiKeys, setApiKeys]           = useState<ApiKey[]>([])
  const [recentPages, setRecentPages]   = useState<RecentPage[]>([])
  const [recentScans, setRecentScans]   = useState<RecentScan[]>([])
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [copied, setCopied]             = useState(false)
  const [copiedKey, setCopiedKey]       = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showNewKey, setShowNewKey]     = useState(false)
  const [newKeyName, setNewKeyName]     = useState("")
  const [newKeyCreated, setNewKeyCreated] = useState<string | null>(null)
  const [deletingKey, setDeletingKey]   = useState<string | null>(null)
  const [showDanger, setShowDanger]     = useState(false)
  const [dangerConfirm, setDangerConfirm] = useState("")
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [form, setForm]                 = useState({ full_name: "", username: "", bio: "", website: "" })
  const fileRef = useRef<HTMLInputElement>(null)

  // -- Chargement --------------------------------------------------------------
  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/auth/login"; return }

      const [
        { data: prof },
        { data: refs },
        { data: keys },
        { data: pages },
        { data: scans },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("api_keys").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("pages").select("id,title,slug,status,total_views,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
        supabase.from("scans").select("id,scanned_at,device,country").eq("qr_code_id", user.id).order("scanned_at", { ascending: false }).limit(8),
      ])

      if (prof) {
        setProfile(prof)
        setForm({ full_name: prof.full_name || "", username: prof.username || "", bio: prof.bio || "", website: prof.website || "" })
      }
      if (refs)  setReferrals(refs)
      if (keys)  setApiKeys(keys)
      if (pages) setRecentPages(pages)
      if (scans) setRecentScans(scans)
      setLoading(false)
    }
    load()
  }, [])

  // -- Actions -----------------------------------------------------------------
  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("profiles").update({
      full_name: form.full_name || null,
      username:  form.username || null,
      bio:       form.bio || null,
      website:   form.website || null,
    }).eq("id", profile.id)
    setProfile(p => p ? { ...p, ...form } : p)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  async function uploadAvatar(file: File) {
    if (!profile) return
    if (file.size > 5 * 1024 * 1024) { alert("Image trop lourde (max 5 Mo)"); return }
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split(".").pop()
    const path = `avatars/${profile.id}.${ext}`
    const { error } = await supabase.storage.from("page-assets").upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("page-assets").getPublicUrl(path)
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id)
      setProfile(p => p ? { ...p, avatar_url: publicUrl } : p)
    }
    setUploadingAvatar(false)
  }

  function copyReferral() {
    const link = `https://qrfolio.app?ref=${profile?.ref_code || profile?.id?.slice(0, 8)}`
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }

  async function createApiKey() {
    if (!profile || !newKeyName.trim()) return
    const supabase = createClient()
    // Genere une cle preview cote client (la vraie est creee via Edge Function en prod)
    const preview = `qrf_sk_live_${Math.random().toString(36).slice(2, 10)}...`
    const { data } = await supabase.from("api_keys").insert({
      user_id: profile.id, name: newKeyName.trim(),
      key_hash: crypto.randomUUID(), key_preview: preview, is_active: true,
    }).select().single()
    if (data) {
      setApiKeys(prev => [data, ...prev])
      setNewKeyCreated(preview)
      setNewKeyName("")
      setShowNewKey(false)
    }
  }

  async function revokeApiKey(id: string) {
    setDeletingKey(id)
    const supabase = createClient()
    await supabase.from("api_keys").update({ is_active: false }).eq("id", id)
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: false } : k))
    setDeletingKey(null)
  }

  async function exportData() {
    if (!profile) return
    const data = { profile, referrals, apiKeys: apiKeys.map(k => ({ ...k, key_hash: "[REDACTED]" })) }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a"); a.href = url; a.download = `qrfolio-export-${profile.username || profile.id.slice(0,8)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  // -- Donnees calculees --------------------------------------------------------
  const planCfg       = PLAN_CFG[profile?.plan as keyof typeof PLAN_CFG] || PLAN_CFG.free
  const PlanIcon      = planCfg.icon
  const pc            = planCfg.color
  const validatedRefs = referrals.filter(r => r.status === "validated" || r.status === "rewarded").length
  const totalMonths   = referrals.reduce((s, r) => s + (r.reward_months || 0), 0)
  const referralLink  = `https://qrfolio.app?ref=${profile?.ref_code || profile?.id?.slice(0, 8) || ""}`
  const memberMonths  = profile ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0

  const inputStyle: React.CSSProperties = {
    width: "100%", background: SURF2, border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, padding: "10px 13px", color: "#F5F0E8", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif",
    transition: "border-color 0.15s",
  }

  const labelStyle: React.CSSProperties = {
    color: MUTED, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 500
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
  }

  // -- Loading ------------------------------------------------------------------
  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `2px solid ${G}20`, borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
        <p style={{ color: MUTED, fontSize: 13 }}>Chargement du profil...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // -- RENDER -------------------------------------------------------------------
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "DM Sans, sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        input:focus,textarea:focus,select:focus{border-color:rgba(201,168,76,0.4)!important}
        .section-card{animation:fadeIn 0.3s ease}
        * { box-sizing: border-box }
      `}</style>

      {/* -- Hero header ------------------------------------------------------- */}
      <div style={{ background: "linear-gradient(180deg,rgba(201,168,76,0.05) 0%,transparent 100%)", borderBottom: "1px solid rgba(201,168,76,0.1)", padding: "28px 28px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: profile?.avatar_url ? "transparent" : `linear-gradient(135deg,${pc},${pc}80)`, border: `2px solid ${pc}50`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 28px ${pc}20` }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                  : <span style={{ fontSize: 26, fontWeight: 700, color: "#080808", fontFamily: "Cormorant Garamond, serif" }}>{(form.full_name || profile?.email || "?")[0]?.toUpperCase()}</span>}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}
                style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: G, border: "2px solid #080808", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {uploadingAvatar
                  ? <div style={{ width: 9, height: 9, border: "1.5px solid #080808", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }}/>
                  : <Camera size={10} color="#080808"/>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }}/>
            </div>

            {/* Infos */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>
                  {form.full_name || "Sans nom"}
                </h1>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: pc + "15", border: `1px solid ${pc}30`, borderRadius: 12, padding: "3px 10px" }}>
                  <PlanIcon size={11} color={pc}/>
                  <span style={{ color: pc, fontSize: 10, fontWeight: 700 }}>Plan {planCfg.label}</span>
                </div>
              </div>
              {form.username && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 2px" }}>@{form.username}</p>}
              <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>
                {profile?.email} . Membre depuis {memberMonths} mois
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={signOut}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: MUTED, fontSize: 12, cursor: "pointer" }}>
              <LogOut size={13}/> Deconnexion
            </button>
            {profile?.plan !== "business" && (
              <a href="/upgrade"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: `linear-gradient(90deg,${G},#b8953f)`, border: "none", borderRadius: 9, color: "#080808", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                <Zap size={13}/> Upgrade
              </a>
            )}
          </div>
        </div>
      </div>

      {/* -- Stats rapides ------------------------------------------------------ */}
      <div style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "14px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 12, overflowX: "auto" }}>
          {[
            { icon: Eye,       label: "Pages",       value: profile?.total_pages || 0,   color: G },
            { icon: TrendingUp,label: "Scans",        value: profile?.total_scans || 0,   color: "#39FF8F" },
            { icon: Users,     label: "Parrainages",  value: validatedRefs,               color: "#7B61FF" },
            { icon: Gift,      label: "Mois Pro",     value: totalMonths,                 color: "#EC4899" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: SURF, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, flexShrink: 0 }}>
              <s.icon size={13} color={s.color}/>
              <span style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700 }}>{s.value}</span>
              <span style={{ color: MUTED, fontSize: 11 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* -- Corps en 2 colonnes ------------------------------------------------ */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 28px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>

        {/* == COLONNE GAUCHE ================================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* 1. IDENTITE */}
          <SectionCard title="Identite" icon={Settings} color={G}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Nom complet</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Jean Dupont" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Nom d'utilisateur</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: MUTED, fontSize: 13 }}>@</span>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))}
                    placeholder="jean-dupont" style={{ ...inputStyle, paddingLeft: 26 }}/>
                </div>
                <p style={{ color: MUTED, fontSize: 10, margin: "3px 0 0" }}>3-30 caracteres, lettres, chiffres, _ et -</p>
              </div>
              <div>
                <label style={labelStyle}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Decris-toi en quelques mots..." rows={2}
                  style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6 }}/>
              </div>
              <div>
                <label style={labelStyle}>Site web</label>
                <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://mon-site.com" style={inputStyle}/>
              </div>
              <button onClick={saveProfile} disabled={saving}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: saved ? "rgba(57,255,143,0.1)" : `linear-gradient(90deg,${G},#b8953f)`, border: saved ? "1px solid rgba(57,255,143,0.3)" : "none", borderRadius: 9, padding: "11px", color: saved ? "#39FF8F" : "#080808", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer", transition: "all 0.2s" }}>
                {saved ? <><Check size={13}/> Sauvegarde !</> : saving ? "Sauvegarde..." : <><Save size={13}/> Sauvegarder les modifications</>}
              </button>
            </div>
          </SectionCard>

          {/* 2. ACTIVITE RECENTE */}
          <SectionCard title="Activite recente" icon={Activity} color="#38BDF8">
            {recentPages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: MUTED }}>
                <Eye size={24} color={MUTED} style={{ marginBottom: 8 }}/>
                <p style={{ fontSize: 12, margin: 0 }}>Aucune page cree</p>
                <a href="/dashboard" style={{ color: G, fontSize: 11, display: "inline-block", marginTop: 6 }}>Creer ma premiere page</a>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentPages.map(page => (
                  <div key={page.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: SURF2, borderRadius: 9, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: page.status === "published" ? "#39FF8F" : MUTED, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.title}</p>
                      <p style={{ color: MUTED, fontSize: 10, margin: "1px 0 0" }}>{page.total_views} vues . {formatDate(page.updated_at)}</p>
                    </div>
                    <a href={`/dashboard/builder/${page.id}`} style={{ color: MUTED, flexShrink: 0 }}><ExternalLink size={12}/></a>
                  </div>
                ))}
                <a href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px", color: MUTED, fontSize: 11, textDecoration: "none" }}>
                  Voir toutes les pages <ChevronRight size={12}/>
                </a>
              </div>
            )}
          </SectionCard>

          {/* 3. PARRAINAGE */}
          <SectionCard title="Programme de parrainage" icon={Gift} color="#EC4899">
            {/* Steps */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[["🔗","Partage ton lien"],["👤","Un ami s'inscrit"],["🎁","1 mois Pro offert"]].map(([icon, label], i) => (
                <div key={i} style={{ flex: 1, background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.12)", borderRadius: 8, padding: "10px 6px", textAlign: "center" as const }}>
                  <span style={{ fontSize: 18, display: "block", marginBottom: 4 }}>{icon}</span>
                  <span style={{ color: MUTED, fontSize: 9, lineHeight: 1.4, display: "block" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { value: validatedRefs, label: "Valides",   color: "#7B61FF" },
                { value: totalMonths,   label: "Mois Pro",  color: "#39FF8F" },
                { value: profile?.ref_code || "--", label: "Code", color: G },
              ].map((s, i) => (
                <div key={i} style={{ background: SURF2, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px 8px", textAlign: "center" as const }}>
                  <p style={{ color: s.color, fontSize: 18, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{s.value}</p>
                  <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Lien */}
            <div style={{ display: "flex", gap: 7, marginBottom: referrals.length > 0 ? 14 : 0 }}>
              <div style={{ flex: 1, background: SURF2, border: `1px solid ${G}20`, borderRadius: 8, padding: "9px 11px", color: G, fontSize: 11, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                {referralLink}
              </div>
              <button onClick={copyReferral}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, background: copied ? "rgba(57,255,143,0.1)" : G + "12", border: `1px solid ${copied ? "rgba(57,255,143,0.3)" : G + "25"}`, borderRadius: 8, padding: "9px 13px", color: copied ? "#39FF8F" : G, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {copied ? <><Check size={12}/> Copie !</> : <><Copy size={12}/> Copier</>}
              </button>
            </div>

            {/* Historique */}
            {referrals.length > 0 && (
              <div>
                <p style={{ color: MUTED, fontSize: 10, margin: "0 0 7px", textTransform: "uppercase", letterSpacing: 0.8 }}>Historique</p>
                {referrals.slice(0, 4).map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ color: MUTED, fontSize: 11 }}>{formatDate(r.created_at)}</span>
                    <span style={{ color: r.status === "validated" || r.status === "rewarded" ? "#39FF8F" : MUTED, fontSize: 11, fontWeight: 600, background: (r.status === "validated" || r.status === "rewarded") ? "rgba(57,255,143,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${(r.status === "validated" || r.status === "rewarded") ? "rgba(57,255,143,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 5, padding: "2px 7px" }}>
                      {r.status === "pending" ? "En attente" : r.status === "validated" ? "Valide" : "Recompense"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 4. SECURITE */}
          <SectionCard title="Securite" icon={Shield} color="#FF6B6B">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: Lock,     label: "Changer le mot de passe", desc: "Envoie un email de reinitialisation",
                  action: () => { const s = createClient(); s.auth.resetPasswordForEmail(profile?.email || ""); alert("Email envoye !") } },
                { icon: LogOut,   label: "Deconnexion", desc: "Se deconnecter de tous les appareils",
                  action: signOut },
              ].map((item, i) => (
                <button key={i} onClick={item.action}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: SURF2, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, cursor: "pointer", textAlign: "left" as const, width: "100%" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,107,107,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <item.icon size={14} color="#FF6B6B"/>
                  </div>
                  <div>
                    <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: 0 }}>{item.label}</p>
                    <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{item.desc}</p>
                  </div>
                  <ChevronRight size={14} color={MUTED} style={{ marginLeft: "auto" }}/>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* 5. EXPORT + DANGER */}
          <SectionCard title="Donnees & Compte" icon={Download} color="#6B7280">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={exportData}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: SURF2, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, cursor: "pointer", textAlign: "left" as const }}>
                <Download size={14} color="#6B7280"/>
                <div>
                  <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: 0 }}>Exporter mes donnees</p>
                  <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>Telecharger profil, pages et QR codes en JSON</p>
                </div>
              </button>

              <div style={{ padding: "12px 14px", background: "rgba(255,107,107,0.04)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 9 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showDanger ? 12 : 0 }}>
                  <div>
                    <p style={{ color: "#FF6B6B", fontSize: 12, fontWeight: 700, margin: 0 }}>Supprimer mon compte</p>
                    <p style={{ color: MUTED, fontSize: 10, margin: "2px 0 0" }}>Action irreversible -- toutes les donnees seront perdues</p>
                  </div>
                  <button onClick={() => setShowDanger(!showDanger)}
                    style={{ padding: "6px 12px", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 7, color: "#FF6B6B", fontSize: 11, cursor: "pointer" }}>
                    {showDanger ? "Annuler" : "Supprimer"}
                  </button>
                </div>
                {showDanger && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ color: "#FF6B6B", fontSize: 11, margin: 0 }}>Tape <strong>SUPPRIMER</strong> pour confirmer :</p>
                    <input value={dangerConfirm} onChange={e => setDangerConfirm(e.target.value)}
                      placeholder="SUPPRIMER" style={{ ...inputStyle, borderColor: "rgba(255,107,107,0.3)" }}/>
                    <button disabled={dangerConfirm !== "SUPPRIMER"}
                      style={{ padding: "9px", background: dangerConfirm === "SUPPRIMER" ? "rgba(255,107,107,0.2)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, color: dangerConfirm === "SUPPRIMER" ? "#FF6B6B" : MUTED, fontSize: 12, fontWeight: 700, cursor: dangerConfirm === "SUPPRIMER" ? "pointer" : "not-allowed" }}>
                      Confirmer la suppression
                    </button>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* == COLONNE DROITE ================================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* 6. ABONNEMENT */}
          <SectionCard title="Abonnement" icon={CreditCard} color={pc}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "14px 16px", background: pc + "08", border: `1px solid ${pc}20`, borderRadius: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: pc + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PlanIcon size={18} color={pc}/>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: 0 }}>Plan {planCfg.label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#39FF8F" }}/>
                  <span style={{ color: "#39FF8F", fontSize: 11 }}>Actif</span>
                </div>
              </div>
              {profile?.plan !== "business" && (
                <a href="/upgrade" style={{ display: "flex", alignItems: "center", gap: 5, background: `linear-gradient(90deg,${G},#b8953f)`, borderRadius: 8, padding: "7px 13px", color: "#080808", textDecoration: "none", fontSize: 11, fontWeight: 700 }}>
                  <Zap size={11}/> Upgrade
                </a>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {planCfg.features.map((perk, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={13} color="#39FF8F"/>
                  <span style={{ color: MUTED, fontSize: 12 }}>{perk}</span>
                </div>
              ))}
            </div>

            {profile?.plan === "free" && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: `${G}06`, border: `1px solid ${G}15`, borderRadius: 9 }}>
                <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>Passez a Pro</p>
                <p style={{ color: MUTED, fontSize: 11, margin: "0 0 10px" }}>Pages illimitees, domaine perso, analytics avances</p>
                <a href="/upgrade" style={{ display: "block", textAlign: "center" as const, padding: "8px", background: `linear-gradient(90deg,${G},#b8953f)`, borderRadius: 8, color: "#080808", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                  Voir les plans
                </a>
              </div>
            )}
          </SectionCard>

          {/* 7. RECOMPENSES */}
          <SectionCard title="Recompenses" icon={Star} color="#F59E0B" tag={totalMonths > 0 ? `${totalMonths} mois` : undefined}>
            {totalMonths === 0 && validatedRefs === 0 ? (
              <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
                <Gift size={28} color={MUTED} style={{ marginBottom: 8 }}/>
                <p style={{ color: MUTED, fontSize: 12, margin: "0 0 4px" }}>Aucune recompense pour l'instant</p>
                <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Parrainez des amis pour gagner des mois Pro</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 9, padding: "12px", textAlign: "center" as const }}>
                    <p style={{ color: "#F59E0B", fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{totalMonths}</p>
                    <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>Mois Pro gagnes</p>
                  </div>
                  <div style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.15)", borderRadius: 9, padding: "12px", textAlign: "center" as const }}>
                    <p style={{ color: "#7B61FF", fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{validatedRefs}</p>
                    <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>Parrainages valides</p>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* 8. API BUSINESS */}
          <SectionCard title="API Business" icon={Code} color="#7B61FF" tag={profile?.plan === "business" ? "Business" : "Pro+"}>
            {profile?.plan === "free" ? (
              <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
                <Lock size={24} color={MUTED} style={{ marginBottom: 8 }}/>
                <p style={{ color: MUTED, fontSize: 12, margin: "0 0 8px" }}>Disponible a partir du plan Pro</p>
                <a href="/upgrade" style={{ color: G, fontSize: 11, display: "inline-block" }}>Voir les plans</a>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {newKeyCreated && (
                  <div style={{ padding: "10px 12px", background: "rgba(57,255,143,0.08)", border: "1px solid rgba(57,255,143,0.2)", borderRadius: 9 }}>
                    <p style={{ color: "#39FF8F", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>Cle creee -- copiez-la maintenant</p>
                    <code style={{ color: "#F5F0E8", fontSize: 10, background: SURF2, padding: "4px 8px", borderRadius: 5, display: "block", marginBottom: 6 }}>{newKeyCreated}</code>
                    <button onClick={() => { navigator.clipboard.writeText(newKeyCreated); setCopiedKey("new") }}
                      style={{ fontSize: 10, color: copiedKey === "new" ? "#39FF8F" : G, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      {copiedKey === "new" ? "Copie !" : "Copier la cle"}
                    </button>
                  </div>
                )}

                {apiKeys.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {apiKeys.map(key => (
                      <div key={key.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", background: SURF2, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: key.is_active ? "#39FF8F" : MUTED, flexShrink: 0 }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: "#F5F0E8", fontSize: 11, fontWeight: 600, margin: 0 }}>{key.name}</p>
                          <code style={{ color: MUTED, fontSize: 10 }}>{key.key_preview}</code>
                        </div>
                        {key.is_active && (
                          <button onClick={() => revokeApiKey(key.id)} disabled={deletingKey === key.id}
                            style={{ padding: "3px 8px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 5, color: "#FF6B6B", fontSize: 9, cursor: "pointer" }}>
                            Revoquer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {showNewKey ? (
                  <div style={{ display: "flex", gap: 7 }}>
                    <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                      placeholder="Nom de la cle (ex: Mon App)" style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={e => e.key === "Enter" && createApiKey()}/>
                    <button onClick={createApiKey} disabled={!newKeyName.trim()}
                      style={{ padding: "0 14px", background: `linear-gradient(90deg,${G},#b8953f)`, border: "none", borderRadius: 9, color: "#080808", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Creer
                    </button>
                    <button onClick={() => setShowNewKey(false)}
                      style={{ padding: "0 10px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: MUTED, cursor: "pointer" }}>
                      <X size={13}/>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewKey(true)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)", borderRadius: 9, color: "#7B61FF", fontSize: 12, cursor: "pointer" }}>
                    <Plus size={13}/> Nouvelle cle API
                  </button>
                )}

                <p style={{ color: MUTED, fontSize: 10, margin: 0, lineHeight: 1.5 }}>
                  Les cles API permettent d'integrer QRfolio dans vos applications.
                  <a href="https://docs.qrfolio.app" target="_blank" rel="noopener noreferrer" style={{ color: G, marginLeft: 4 }}>Documentation</a>
                </p>
              </div>
            )}
          </SectionCard>

          {/* 9. DOMAINES */}
          <SectionCard title="Domaines personnalises" icon={Globe} color="#38BDF8" tag="Bientot">
            <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
              <Globe size={28} color={MUTED} style={{ marginBottom: 8 }}/>
              <p style={{ color: MUTED, fontSize: 12, margin: "0 0 4px" }}>Connectez votre domaine</p>
              <p style={{ color: MUTED, fontSize: 11, margin: "0 0 10px", lineHeight: 1.5 }}>
                Bientot : utilisez votre propre domaine<br/>pour toutes vos pages QRfolio
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 20 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#38BDF8" }}/>
                <span style={{ color: "#38BDF8", fontSize: 10 }}>En cours de developpement</span>
              </div>
            </div>
          </SectionCard>

          {/* 10. PREFERENCES */}
          <SectionCard title="Preferences" icon={Bell} color="#F97316">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                { label: "Notifications par email", desc: "Recevez les alertes scan et analytics" },
                { label: "Resume hebdomadaire", desc: "Stats de la semaine chaque lundi" },
                { label: "Alertes de securite", desc: "Connexions et changements de compte" },
              ] as const).map((pref, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: SURF2, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 9 }}>
                  <div>
                    <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: 0 }}>{pref.label}</p>
                    <p style={{ color: MUTED, fontSize: 10, margin: "2px 0 0" }}>{pref.desc}</p>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: `linear-gradient(90deg,${G},#b8953f)`, position: "relative" as const, flexShrink: 0 }}>
                    <div style={{ position: "absolute", top: 2, left: 18, width: 16, height: 16, borderRadius: "50%", background: "#F5F0E8" }}/>
                  </div>
                </div>
              ))}
              <p style={{ color: MUTED, fontSize: 10, margin: "4px 0 0", lineHeight: 1.5 }}>
                La gestion des preferences sera disponible dans une prochaine version.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
