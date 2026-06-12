"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Copy, Check, Gift, Star, TrendingUp, Users, QrCode, Eye,
  Crown, Zap, Camera, Save, ExternalLink, Shield, Key,
  Bell, Globe, Trash2, Download, ChevronRight, Lock,
  LogOut, AlertTriangle, Plus, X, RotateCcw, Activity,
  CreditCard, Code, Settings, CheckCircle, AtSign, Link, Link2,
  ImageOff, Crop, UserCheck, UserX,
  Clock, Filter, Calendar, FileEdit, Scan, Tag, Award,
  Share2, MessageCircle, Mail, Twitter, Linkedin
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
  total_views: number; unique_views: number; updated_at: string; created_at: string
}

type RecentScan = {
  id: string; scanned_at: string; device: string; country: string | null
}

// -- Activity Log -------------------------------------------------------------
type ActivityEventType =
  | "page_created" | "page_published" | "page_updated"
  | "qr_created"   | "qr_customized"  | "qr_scanned"   | "qr_downloaded"
  | "plan_changed" | "referral_validated" | "profile_updated"
  | "template_used"| "api_key_created"    | "export_done"

type ActivityEvent = {
  id:           string
  user_id?:     string
  event_type:   ActivityEventType
  title:        string
  description:  string | null
  entity_id:    string | null
  entity_type:  string | null
  entity_label: string | null
  metadata:     Record<string, any>
  created_at:   string
}

// Config d'affichage par type d'evenement
const ACTIVITY_CFG: Record<ActivityEventType, { icon: any; color: string; bg: string }> = {
  page_created:       { icon: FileEdit,  color: "#C9A84C",  bg: "rgba(201,168,76,0.1)"  },
  page_published:     { icon: CheckCircle,color: "#39FF8F", bg: "rgba(57,255,143,0.1)"  },
  page_updated:       { icon: FileEdit,  color: "#38BDF8",  bg: "rgba(56,189,248,0.1)"  },
  qr_created:         { icon: QrCode,    color: "#C9A84C",  bg: "rgba(201,168,76,0.1)"  },
  qr_customized:      { icon: Settings,  color: "#7B61FF",  bg: "rgba(123,97,255,0.1)"  },
  qr_scanned:         { icon: Scan,      color: "#39FF8F",  bg: "rgba(57,255,143,0.1)"  },
  qr_downloaded:      { icon: Download,  color: "#38BDF8",  bg: "rgba(56,189,248,0.1)"  },
  plan_changed:       { icon: Zap,       color: "#C9A84C",  bg: "rgba(201,168,76,0.1)"  },
  referral_validated: { icon: Award,     color: "#EC4899",  bg: "rgba(236,72,153,0.1)"  },
  profile_updated:    { icon: Settings,  color: "#8A8478",  bg: "rgba(138,132,120,0.1)" },
  template_used:      { icon: Tag,       color: "#F97316",  bg: "rgba(249,115,22,0.1)"  },
  api_key_created:    { icon: Key,       color: "#7B61FF",  bg: "rgba(123,97,255,0.1)"  },
  export_done:        { icon: Download,  color: "#38BDF8",  bg: "rgba(56,189,248,0.1)"  },
}

const ACTIVITY_FILTER_OPTS = [
  { id: "all",       label: "Tout"       },
  { id: "pages",     label: "Pages"      },
  { id: "qr",        label: "QR Codes"   },
  { id: "account",   label: "Compte"     },
]

type QRStat = {
  id: string; short_code: string; total_scans: number; status: string | null
  pages: { title: string } | null
}

// -- Constantes ---------------------------------------------------------------
const G = "#C9A84C"
const MUTED = "#8A8478"
const BG = "#080808"
const SURF = "#111009"
const SURF2 = "#0F0E0B"

// -- Plans complets avec limites reelles --------------------------------------
type PlanLimit = { pages: number|null; views: number|null; qr: number|null; team: number|null }

const PLAN_CFG: Record<string, {
  color: string; label: string; icon: any
  price_monthly: string; price_annual: string
  description: string
  limits: PlanLimit
  features: string[]
  badge?: string
}> = {
  free: {
    color: MUTED, label: "Gratuit", icon: Star,
    price_monthly: "0", price_annual: "0",
    description: "Pour decouvrir QRfolio",
    limits: { pages: 1, views: 500, qr: 1, team: null },
    features: ["1 page active","500 vues/mois","1 QR code basique","Analytics de base","Branding QRfolio visible"],
  },
  starter: {
    color: "#38BDF8", label: "Starter", icon: Zap,
    price_monthly: "2.99", price_annual: "2.39",
    description: "Pour les createurs individuels",
    limits: { pages: 3, views: 5000, qr: null, team: null },
    features: ["3 pages","5 000 vues/mois","QR codes personnalises","Sans branding","Analytics standard","Domaine personnalise"],
    badge: "POPULAIRE",
  },
  pro: {
    color: G, label: "Pro", icon: Zap,
    price_monthly: "9.99", price_annual: "7.99",
    description: "Pour les professionnels et commerces",
    limits: { pages: null, views: 50000, qr: null, team: null },
    features: ["Pages illimitees","50 000 vues/mois","QR codes avances","Analytics avances + export","Tous les templates","Support prioritaire"],
  },
  business: {
    color: "#39FF8F", label: "Business", icon: Crown,
    price_monthly: "24.99", price_annual: "19.99",
    description: "Pour les agences et equipes",
    limits: { pages: null, views: null, qr: null, team: 5 },
    features: ["Vues illimitees","Tout Plan Pro inclus","Equipe 5 membres","Acces API complet","Marque blanche","Support 24/7 dedie"],
  },
}

// Plans ordonnes pour l'upsell
const PLAN_ORDER = ["free","starter","pro","business"]

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
  const [formOriginal, setFormOriginal] = useState({ full_name: "", username: "", bio: "", website: "" })
  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"ok"|"taken"|"invalid">("idle")
  const [usernameMsg, setUsernameMsg]   = useState("")
  const [copiedUrl, setCopiedUrl]       = useState(false)
  const [copiedRef, setCopiedRef]       = useState(false)
  const [refFilter, setRefFilter]       = useState("all")
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [toast, setToast]               = useState<{msg:string;type:"ok"|"err"}|null>(null)
  const [cropMode, setCropMode]         = useState(false)
  const [cropSrc, setCropSrc]           = useState<string|null>(null)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  const [allPages,   setAllPages]   = useState<RecentPage[]>([])
  const [qrStats,    setQrStats]    = useState<QRStat[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsTooltip, setStatsTooltip]     = useState<string | null>(null)
  const [activityLog,  setActivityLog]       = useState<ActivityEvent[]>([])
  const [activityLoading, setActivityLoading]= useState(true)
  const [activityFilter,  setActivityFilter] = useState("all")
  const [activityPage,    setActivityPage]   = useState(0)
  const ACTIVITY_PAGE_SIZE = 10
  // Subscription state (simule depuis le plan Supabase, enrichi si Stripe webhook)
  const [subStatus,   setSubStatus]   = useState<"active"|"trialing"|"canceled"|"past_due"|"free">("free")
  const [subRenewal,  setSubRenewal]  = useState<string|null>(null)
  const [subCycle,    setSubCycle]    = useState<"monthly"|"annual">("monthly")
  const [subLoading,  setSubLoading]  = useState(true)
  const usernameTimer = useRef<NodeJS.Timeout | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cropRef = useRef<HTMLCanvasElement>(null)

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
        { data: allPagesData },
        { data: qrData },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("referrals").select("id,status,reward_months,created_at,referee_id").eq("referrer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("api_keys").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("pages").select("id,title,slug,status,total_views,unique_views,updated_at,created_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
        supabase.from("pages").select("id,title,slug,status,total_views,unique_views,updated_at,created_at").eq("user_id", user.id),
        supabase.from("qr_codes").select("id,short_code,total_scans,status,pages(title)").eq("user_id", user.id).order("total_scans", { ascending: false }),
      ])

      if (prof) {
        setProfile(prof)
        const init = { full_name: prof.full_name || "", username: prof.username || "", bio: prof.bio || "", website: prof.website || "" }
        setForm(init)
        setFormOriginal(init)
      }
      if (refs)  setReferrals(refs)
      if (keys)  setApiKeys(keys)
      if (pages)       setRecentPages(pages)
      if (allPagesData) setAllPages(allPagesData)
      if (qrData)      setQrStats(qrData)
      // Charger activity_logs (ou construire depuis donnees existantes)
      try {
        const { data: actData } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100)
        if (actData && actData.length > 0) {
          setActivityLog(actData)
        }
        // Sera override par buildTimelineFromData si vide
      } catch { /* activity_logs pas encore cree */ }
      // Statut subscription (simplifie : free = free, autre = active)
      // En prod, ces donnees viendraient d'un webhook Stripe
      if (prof) {
        setSubStatus(prof.plan === "free" ? "free" : "active")
      }
      setSubLoading(false)
      setActivityLoading(false)
      setStatsLoading(false)
      setLoading(false)
    }
    load()
  }, [])

  // -- Actions -----------------------------------------------------------------
  // -- Helpers timeline -------------------------------------------------------
  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 2)  return "a l'instant"
    if (m < 60) return `il y a ${m}min`
    if (h < 24) return `il y a ${h}h`
    if (d < 7)  return `il y a ${d}j`
    return new Date(iso).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })
  }

  function groupLabel(iso: string): string {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    if (d === 0) return "Aujourd'hui"
    if (d === 1) return "Hier"
    if (d < 7)   return "Cette semaine"
    if (d < 30)  return "Ce mois"
    return "Plus ancien"
  }

  function filterEvents(evts: ActivityEvent[]): ActivityEvent[] {
    if (activityFilter === "all") return evts
    if (activityFilter === "pages") return evts.filter(e =>
      ["page_created","page_published","page_updated"].includes(e.event_type))
    if (activityFilter === "qr") return evts.filter(e =>
      ["qr_created","qr_customized","qr_scanned","qr_downloaded"].includes(e.event_type))
    if (activityFilter === "account") return evts.filter(e =>
      ["plan_changed","referral_validated","profile_updated","api_key_created","export_done"].includes(e.event_type))
    return evts
  }

  // Construire la timeline depuis les donnees existantes (fallback si activity_logs vide)
  function buildTimelineFromData(): ActivityEvent[] {
    const evts: ActivityEvent[] = []
    const now = Date.now()
    // Pages
    for (const p of allPages) {
      if (p.created_at) evts.push({
        id: `page-created-${p.id}`, event_type: "page_created",
        title: "Page creee", description: p.title,
        entity_id: p.id, entity_type: "page", entity_label: p.title,
        metadata: {}, created_at: p.created_at,
      })
      if (p.updated_at && p.updated_at !== p.created_at) {
        const diffMs = new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()
        if (diffMs > 60000) evts.push({
          id: `page-updated-${p.id}-${p.updated_at}`, event_type: p.status === "published" ? "page_published" : "page_updated",
          title: p.status === "published" ? "Page publiee" : "Page modifiee",
          description: p.title, entity_id: p.id, entity_type: "page",
          entity_label: p.title, metadata: {}, created_at: p.updated_at,
        })
      }
    }
    // QR
    for (const q of qrStats) {
      evts.push({
        id: `qr-created-${q.id}`, event_type: "qr_created",
        title: "QR Code cree", description: (q.pages as any)?.title || `/${q.short_code}`,
        entity_id: q.id, entity_type: "qr_code", entity_label: q.short_code,
        metadata: {}, created_at: new Date(now - Math.random()*86400000*30).toISOString(),
      })
    }
    // Referrals
    for (const r of referrals.filter(r => r.status !== "pending")) {
      evts.push({
        id: `ref-${r.id}`, event_type: "referral_validated",
        title: "Parrainage valide", description: `+${r.reward_months || 1} mois Pro`,
        entity_id: r.id, entity_type: "referral", entity_label: null,
        metadata: {}, created_at: r.created_at,
      })
    }
    return evts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  // Logger un evenement
  async function logActivity(
    event_type: ActivityEventType, title: string,
    opts?: { description?: string; entity_id?: string; entity_type?: string; entity_label?: string; metadata?: Record<string, any> }
  ) {
    if (!profile?.id) return
    const sb = createClient()
    const evt: Omit<ActivityEvent, "id"> = {
      user_id: profile.id, event_type, title,
      description:  opts?.description  ?? null,
      entity_id:    opts?.entity_id    ?? null,
      entity_type:  opts?.entity_type  ?? null,
      entity_label: opts?.entity_label ?? null,
      metadata:     opts?.metadata     ?? {},
      created_at:   new Date().toISOString(),
    }
    // Optimistic update
    const tempId = crypto.randomUUID()
    setActivityLog(prev => [{ id: tempId, ...evt } as ActivityEvent, ...prev])
    // Persist
    try {
      await sb.from("activity_logs").insert({ ...evt })
    } catch { /* table peut ne pas exister encore */ }
  }

  function showToast(msg: string, type: "ok"|"err" = "ok") {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  // Validation username temps reel
  function handleUsernameChange(val: string) {
    const clean2 = val.toLowerCase().replace(/[^a-z0-9_-]/g, "")
    setForm(f => ({ ...f, username: clean2 }))
    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    if (!clean2) { setUsernameStatus("idle"); setUsernameMsg(""); return }
    if (clean2.length < 3) {
      setUsernameStatus("invalid")
      setUsernameMsg("Minimum 3 caracteres")
      return
    }
    if (clean2.length > 30) {
      setUsernameStatus("invalid")
      setUsernameMsg("Maximum 30 caracteres")
      return
    }
    if (clean2 === formOriginal.username) {
      setUsernameStatus("ok"); setUsernameMsg("Username actuel"); return
    }
    setUsernameStatus("checking"); setUsernameMsg("Verification...")
    usernameTimer.current = setTimeout(async () => {
      const sb = createClient()
      const { data } = await sb.from("profiles").select("id").eq("username", clean2).single()
      if (data) {
        setUsernameStatus("taken"); setUsernameMsg("Deja utilise")
      } else {
        setUsernameStatus("ok"); setUsernameMsg("Disponible")
      }
    }, 500)
  }

  async function saveProfile() {
    if (!profile || !hasChanges) return
    if (usernameStatus === "taken") { showToast("Username deja utilise", "err"); return }
    if (usernameStatus === "invalid") { showToast("Username invalide", "err"); return }
    if (form.username && form.username.length < 3) { showToast("Username trop court", "err"); return }
    setSaving(true)
    const sb = createClient()
    const { error } = await sb.from("profiles").update({
      full_name: form.full_name || null,
      username:  form.username || null,
      bio:       form.bio || null,
      website:   form.website || null,
    }).eq("id", profile.id)
    if (error) { showToast("Erreur de sauvegarde", "err"); setSaving(false); return }
    const updated = { ...form }
    setProfile(p => p ? { ...p, ...updated } : p)
    setFormOriginal(updated)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
    showToast("Profil sauvegarde avec succes")
    logActivity("profile_updated", "Profil mis a jour", { entity_type: "profile" })
  }

  // Ouvre le crop preview
  function handleAvatarFile(file: File) {
    if (!file.type.startsWith("image/")) { showToast("Format non supporte (PNG, JPG, WEBP)", "err"); return }
    if (file.size > 5 * 1024 * 1024) { showToast("Image trop lourde (max 5 Mo)", "err"); return }
    const reader = new FileReader()
    reader.onload = e => { setCropSrc(e.target?.result as string); setCropMode(true) }
    reader.readAsDataURL(file)
  }

  // Crop carre 400x400 et upload
  async function uploadAvatar(dataUrl?: string) {
    if (!profile) return
    const src = dataUrl || cropSrc
    if (!src) return
    setUploadingAvatar(true); setCropMode(false); setCropSrc(null)
    try {
      // Redimensionner en 400x400 via canvas
      const canvas = document.createElement("canvas")
      canvas.width = 400; canvas.height = 400
      const ctx = canvas.getContext("2d")!
      const img = new Image(); img.src = src
      await new Promise<void>(r => { img.onload = () => r() })
      // Crop carre centree
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2; const sy = (img.height - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400)
      // Convertir en blob
      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.92))
      const sb = createClient()
      const path = `avatars/${profile.id}.jpg`
      const { error } = await sb.storage.from("page-assets").upload(path, blob, { upsert: true, contentType: "image/jpeg" })
      if (error) { showToast("Erreur upload avatar", "err"); return }
      const { data: { publicUrl } } = sb.storage.from("page-assets").getPublicUrl(path)
      const cacheBust = publicUrl + "?v=" + Date.now()
      await sb.from("profiles").update({ avatar_url: cacheBust }).eq("id", profile.id)
      setProfile(p => p ? { ...p, avatar_url: cacheBust } : p)
      showToast("Avatar mis a jour")
    } catch { showToast("Erreur lors de l'upload", "err") }
    setUploadingAvatar(false)
  }

  async function deleteAvatar() {
    if (!profile?.avatar_url) return
    setDeletingAvatar(true)
    const sb = createClient()
    await sb.from("profiles").update({ avatar_url: null }).eq("id", profile.id)
    setProfile(p => p ? { ...p, avatar_url: null } : p)
    setDeletingAvatar(false); showToast("Avatar supprime")
  }

  function copyReferral() {
    navigator.clipboard.writeText(referralLink).then(() => { setCopiedRef(true); setTimeout(() => setCopiedRef(false), 2500) })
  }

  // Partage vers les reseaux
  function shareRef(platform: "whatsapp"|"email"|"twitter"|"linkedin") {
    const msg = `Rejoins QRfolio, la plateforme de QR codes dynamiques professionnels ! Cree ta premiere page gratuitement : ${referralLink}`
    const urls: Record<string, string> = {
      whatsapp:  `https://wa.me/?text=${encodeURIComponent(msg)}`,
      email:     `mailto:?subject=${encodeURIComponent("Rejoins QRfolio !")}&body=${encodeURIComponent(msg)}`,
      twitter:   `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
      linkedin:  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    }
    window.open(urls[platform], "_blank", "noopener,noreferrer")
    setShowShareMenu(false)
  }

  function copyPublicUrl() {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl).then(() => { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2500) })
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
  // -- Stats calculees ------------------------------------------------------
  const totalPages     = allPages.length
  const publishedPages = allPages.filter(p => p.status === "published").length
  const draftPages     = allPages.filter(p => p.status === "draft").length
  const totalViews     = allPages.reduce((s, p) => s + (p.total_views || 0), 0)
  const uniqueViews    = allPages.reduce((s, p) => s + (p.unique_views || 0), 0)
  const totalQR        = qrStats.length
  const activeQR       = qrStats.filter(q => (q.status ?? "active") === "active").length
  const totalScansQR   = qrStats.reduce((s, q) => s + (q.total_scans || 0), 0)
  const topPage        = [...allPages].sort((a,b) => (b.total_views||0)-(a.total_views||0))[0] ?? null
  const topQR          = qrStats[0] ?? null  // deja trie par total_scans DESC
  const convRate       = totalViews > 0 ? Math.round((totalScansQR / totalViews) * 100) : 0
  const avgViews       = totalPages > 0 ? Math.round(totalViews / totalPages) : 0

  // -- Badges + Niveau QRfolio -----------------------------------
  type Badge = {
    id: string; emoji: string; label: string; desc: string
    category: "pages"|"scans"|"referrals"|"plan"|"milestone"
    color: string; unlocked: boolean
  }

  function computeBadges(): Badge[] {
    const plan    = profile?.plan || "free"
    const isPro   = plan === "pro" || plan === "business"
    const isBiz   = plan === "business"
    const isEarly = memberMonths >= 0 && memberMonths <= 6
    return [
      { id:"first_page",     emoji:"📄", label:"Premiere page",      desc:"Publiez votre premiere page",               category:"pages",     color:"#C9A84C", unlocked: publishedPages >= 1      },
      { id:"builder_expert", emoji:"🏗",  label:"Builder Expert",     desc:"Publiez 10 pages differentes",              category:"pages",     color:"#38BDF8", unlocked: publishedPages >= 10     },
      { id:"template_master",emoji:"🎨", label:"Template Master",     desc:"Creez 3 pages ou plus",                    category:"pages",     color:"#7B61FF", unlocked: totalPages >= 3          },
      { id:"first_qr",       emoji:"⬛", label:"Premier QR",         desc:"Creez votre premier QR Code",              category:"scans",     color:"#F97316", unlocked: qrStats.length >= 1      },
      { id:"scans_100",      emoji:"📡", label:"100 Scans",          desc:"Atteignez 100 scans au total",             category:"scans",     color:"#39FF8F", unlocked: totalScansQR >= 100      },
      { id:"scans_1k",       emoji:"🚀", label:"1 000 Scans",        desc:"Atteignez 1 000 scans",                    category:"scans",     color:"#C9A84C", unlocked: totalScansQR >= 1000     },
      { id:"scans_10k",      emoji:"💫", label:"10 000 Scans",       desc:"Top 1% des utilisateurs",                  category:"scans",     color:"#EC4899", unlocked: totalScansQR >= 10000    },
      { id:"first_ref",      emoji:"🤝", label:"Parrain",            desc:"Validez votre premier parrainage",         category:"referrals", color:"#7B61FF", unlocked: validatedRefs >= 1       },
      { id:"refs_5",         emoji:"🌟", label:"Super Parrain",      desc:"Validez 5 parrainages",                    category:"referrals", color:"#EC4899", unlocked: validatedRefs >= 5       },
      { id:"pro_user",       emoji:"⚡", label:"Utilisateur Pro",    desc:"Passez au plan Pro ou superieur",          category:"plan",      color:"#C9A84C", unlocked: isPro                   },
      { id:"business_user",  emoji:"👑", label:"Business",           desc:"Atteignez le plan Business",               category:"plan",      color:"#39FF8F", unlocked: isBiz                   },
      { id:"early_user",     emoji:"🌱", label:"Early User",         desc:"Parmi les premiers utilisateurs",          category:"milestone", color:"#39FF8F", unlocked: isEarly                 },
    ]
  }

  function computeLevel() {
    const score = Math.min(Math.round(
      Math.min(totalScansQR / 100, 30)   +
      Math.min(publishedPages * 5, 25)   +
      Math.min(validatedRefs * 5, 20)    +
      (profile?.plan==="business"?15 : profile?.plan==="pro"?10 : profile?.plan==="starter"?5 : 0) +
      Math.min(memberMonths, 10)
    ), 100)
    type LevelDef = { min:number; label:string; color:string; emoji:string; next:number }
    const LEVELS: LevelDef[] = [
      { min:0,  label:"Debutant",      color:"#8A8478", emoji:"🌱", next:15  },
      { min:15, label:"Explorateur",   color:"#38BDF8", emoji:"🧭", next:30  },
      { min:30, label:"Createur",      color:"#C9A84C", emoji:"✨", next:50  },
      { min:50, label:"Professionnel", color:"#F97316", emoji:"🔥", next:70  },
      { min:70, label:"Expert",        color:"#7B61FF", emoji:"💎", next:90  },
      { min:90, label:"Legende",       color:"#EC4899", emoji:"👑", next:100 },
    ]
    const current     = [...LEVELS].reverse().find(l => score >= l.min) ?? LEVELS[0]
    const nextIdx     = LEVELS.findIndex(l => l.min === current.min) + 1
    const nextLvl     = nextIdx < LEVELS.length ? LEVELS[nextIdx] : null
    const progressPct = nextLvl
      ? Math.round(((score - current.min) / (nextLvl.min - current.min)) * 100)
      : 100
    return { score, current, nextLvl, progressPct }
  }

  // -- Consommation calculee --------------------------------------------------
  const currentPlan  = profile?.plan || "free"
  const planLimits   = PLAN_CFG[currentPlan]?.limits ?? { pages:1, views:500, qr:1, team:null }
  const nextPlanKey  = PLAN_ORDER[Math.min(PLAN_ORDER.indexOf(currentPlan)+1, PLAN_ORDER.length-1)]
  const nextPlan     = PLAN_CFG[nextPlanKey]
  const pagesUsagePct  = planLimits.pages  ? Math.min((totalPages  / planLimits.pages)  * 100, 100) : 0
  const viewsUsagePct  = planLimits.views  ? Math.min((totalViews  / planLimits.views)  * 100, 100) : 0
  const isNearPages    = planLimits.pages  && totalPages  >= Math.floor(planLimits.pages  * 0.8)
  const isNearViews    = planLimits.views  && totalViews  >= Math.floor(planLimits.views  * 0.8)
  const isAtLimitPages = planLimits.pages  && totalPages  >= planLimits.pages
  const isAtLimitViews = planLimits.views  && totalViews  >= planLimits.views

  const hasChanges = form.full_name !== formOriginal.full_name
    || form.username !== formOriginal.username
    || form.bio !== formOriginal.bio
    || form.website !== formOriginal.website
  const publicUrl  = form.username ? `https://qrfolio.app/@${form.username}` : null

  const planCfg       = PLAN_CFG[profile?.plan || "free"] || PLAN_CFG["free"]
  const PlanIcon      = planCfg.icon
  const pc            = planCfg.color
  const pendingRefs   = referrals.filter(r => r.status === "pending").length
  const validatedRefs = referrals.filter(r => r.status === "validated" || r.status === "rewarded").length
  const expiredRefs   = referrals.filter(r => r.status === "expired").length
  const totalMonths   = referrals.reduce((s, r) => s + (r.reward_months || 0), 0)
  const referralLink  = `https://qrfolio.app?ref=${profile?.ref_code || profile?.id?.slice(0, 8) || ""}`
  const filteredRefs  = refFilter === "all" ? referrals
    : referrals.filter(r => refFilter === "validated"
      ? (r.status === "validated" || r.status === "rewarded")
      : r.status === refFilter)
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
        @keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.3}50%{opacity:0.7}}
        input:focus,textarea:focus,select:focus{border-color:rgba(201,168,76,0.4)!important}
        .section-card{animation:fadeIn 0.3s ease}
        * { box-sizing: border-box }
      `}</style>

      {/* Tooltip stats */}
      {statsTooltip && (
        <div style={{ position:"fixed", bottom:70, left:"50%", transform:"translateX(-50%)", zIndex:9998, padding:"7px 14px", background:"rgba(20,18,12,0.95)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:8, color:"#8A8478", fontSize:11, whiteSpace:"nowrap" as const, backdropFilter:"blur(8px)", pointerEvents:"none" }}>
          {statsTooltip}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:9999, display:"flex", alignItems:"center", gap:9, padding:"11px 20px", background:toast.type==="ok"?"rgba(57,255,143,0.12)":"rgba(255,107,107,0.12)", border:`1px solid ${toast.type==="ok"?"rgba(57,255,143,0.3)":"rgba(255,107,107,0.3)"}`, borderRadius:12, backdropFilter:"blur(12px)", boxShadow:"0 8px 32px rgba(0,0,0,0.5)", whiteSpace:"nowrap" as const }}>
          {toast.type==="ok" ? <Check size={14} color="#39FF8F"/> : <AlertTriangle size={14} color="#FF6B6B"/>}
          <span style={{ color:toast.type==="ok"?"#39FF8F":"#FF6B6B", fontSize:13, fontWeight:600 }}>{toast.msg}</span>
        </div>
      )}


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
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.target.value="" }}/>
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
            { icon: Eye,       label: "Pages",       value: totalPages || profile?.total_pages || 0,   color: G },
            { icon: TrendingUp,label: "Vues",         value: totalViews > 0 ? totalViews.toLocaleString("fr-FR") : (profile?.total_scans || 0),   color: "#39FF8F" },
            { icon: QrCode,    label: "QR actifs",    value: activeQR,                    color: "#38BDF8" },
            { icon: Users,     label: "Parrainages",  value: validatedRefs,               color: "#7B61FF" },
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
          <SectionCard title="Identite" icon={Settings} color={G}
            action={
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {profile?.plan === "free" && memberMonths <= 6 && (
                  <span style={{ background:"rgba(57,255,143,0.1)", border:"1px solid rgba(57,255,143,0.2)", borderRadius:20, padding:"2px 8px", fontSize:9, color:"#39FF8F", fontWeight:700 }}>
                    Early User
                  </span>
                )}
                <span style={{ background:pc+"15", border:`1px solid ${pc}30`, borderRadius:20, padding:"2px 9px", fontSize:9, color:pc, fontWeight:700 }}>
                  {planCfg.label}
                </span>
              </div>
            }>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Avatar premium */}
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px", background:"#0F0E0B", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)" }}>
                {/* Avatar */}
                <div style={{ position:"relative", flexShrink:0 }}>
                  <div style={{ width:72, height:72, borderRadius:"50%", background:profile?.avatar_url?"transparent":`linear-gradient(135deg,${pc},${pc}80)`, border:`2px solid ${pc}40`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 20px ${pc}15` }}>
                    {uploadingAvatar ? (
                      <div style={{ width:22, height:22, border:`2px solid ${pc}30`, borderTopColor:pc, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                    ) : profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    ) : (
                      <span style={{ fontSize:26, fontWeight:700, color:"#080808", fontFamily:"Cormorant Garamond, serif" }}>
                        {(form.full_name || profile?.email || "?")[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Bouton camera */}
                  <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}
                    style={{ position:"absolute", bottom:0, right:0, width:24, height:24, borderRadius:"50%", background:G, border:"2px solid #080808", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>
                    <Camera size={10} color="#080808"/>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.target.value="" }}/>
                </div>
                {/* Infos preview + actions */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:"#F5F0E8", fontSize:14, fontWeight:700, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, fontFamily:"Cormorant Garamond, serif" }}>
                    {form.full_name || "Sans nom"}
                  </p>
                  {form.username && (
                    <p style={{ color:"#8A8478", fontSize:12, margin:"0 0 8px", fontFamily:"monospace" }}>@{form.username}</p>
                  )}
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => fileRef.current?.click()}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:7, color:G, fontSize:11, cursor:"pointer" }}>
                      <Camera size={11}/> Changer
                    </button>
                    {profile?.avatar_url && (
                      <button onClick={deleteAvatar} disabled={deletingAvatar}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.15)", borderRadius:7, color:"#FF6B6B", fontSize:11, cursor:"pointer" }}>
                        <ImageOff size={11}/> Supprimer
                      </button>
                    )}
                  </div>
                  <p style={{ color:"#8A8478", fontSize:9, margin:"6px 0 0" }}>PNG, JPG, WEBP -- max 5 Mo -- recadrage automatique 400x400</p>
                </div>
              </div>

              {/* Modal crop */}
              {cropMode && cropSrc && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:24 }}
                  onClick={() => { setCropMode(false); setCropSrc(null) }}>
                  <div style={{ background:"#111009", border:"1px solid rgba(201,168,76,0.2)", borderRadius:16, padding:24, maxWidth:440, width:"100%" }}
                    onClick={e => e.stopPropagation()}>
                    <p style={{ color:"#F5F0E8", fontSize:15, fontWeight:700, margin:"0 0 14px" }}>Apercu de l'avatar</p>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:18 }}>
                      <img src={cropSrc} alt="preview" style={{ width:120, height:120, objectFit:"cover", borderRadius:"50%", border:"2px solid rgba(201,168,76,0.3)" }}/>
                      <div>
                        <p style={{ color:"#8A8478", fontSize:11, margin:"0 0 6px" }}>L'image sera recadree<br/>en carre 400x400 px.</p>
                        <p style={{ color:"#8A8478", fontSize:10, margin:0 }}>Format: JPEG 92%</p>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => { setCropMode(false); setCropSrc(null) }}
                        style={{ flex:1, padding:"10px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, color:"#8A8478", fontSize:13, cursor:"pointer" }}>
                        Annuler
                      </button>
                      <button onClick={() => uploadAvatar(cropSrc)}
                        style={{ flex:2, padding:"10px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", border:"none", borderRadius:9, color:"#080808", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                        <Camera size={13}/> Utiliser cette photo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Nom complet */}
              <div>
                <label style={{ color:"#8A8478", fontSize:11, display:"block", marginBottom:5, fontWeight:500 }}>Nom complet</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Jean Dupont"
                  style={{ width:"100%", background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, padding:"10px 13px", color:"#F5F0E8", fontSize:13, outline:"none", boxSizing:"border-box" as const }}/>
              </div>

              {/* Username avec validation live */}
              <div>
                <label style={{ color:"#8A8478", fontSize:11, display:"block", marginBottom:5, fontWeight:500 }}>Nom d'utilisateur</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#8A8478", fontSize:13 }}>@</span>
                  <input value={form.username}
                    onChange={e => handleUsernameChange(e.target.value)}
                    placeholder="jean-dupont"
                    style={{ width:"100%", background:"#0F0E0B", border:`1px solid ${usernameStatus==="ok"?"rgba(57,255,143,0.3)":usernameStatus==="taken"||usernameStatus==="invalid"?"rgba(255,107,107,0.3)":"rgba(255,255,255,0.08)"}`, borderRadius:9, padding:"10px 36px 10px 26px", color:"#F5F0E8", fontSize:13, outline:"none", boxSizing:"border-box" as const }}/>
                  {/* Icone statut */}
                  <div style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)" }}>
                    {usernameStatus==="checking" && <div style={{ width:13, height:13, border:"1.5px solid rgba(201,168,76,0.3)", borderTopColor:"#C9A84C", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>}
                    {usernameStatus==="ok"      && <UserCheck size={14} color="#39FF8F"/>}
                    {(usernameStatus==="taken"||usernameStatus==="invalid") && <UserX size={14} color="#FF6B6B"/>}
                  </div>
                </div>
                {/* Message validation */}
                {usernameMsg && (
                  <p style={{ color:usernameStatus==="ok"?"#39FF8F":usernameStatus==="checking"?"#8A8478":"#FF6B6B", fontSize:10, margin:"4px 0 0", display:"flex", alignItems:"center", gap:4 }}>
                    {usernameMsg}
                  </p>
                )}
                <p style={{ color:"#8A8478", fontSize:10, margin:"3px 0 0" }}>3-30 caracteres -- lettres, chiffres, _ et -</p>
              </div>

              {/* URL publique */}
              {publicUrl && (
                <div style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 12px", background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:9 }}>
                  <Link size={12} color={G} style={{ flexShrink:0 }}/>
                  <span style={{ flex:1, color:G, fontSize:11, fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                    {publicUrl}
                  </span>
                  <button onClick={copyPublicUrl}
                    style={{ width:26, height:26, background:"none", border:"none", cursor:"pointer", color:copiedUrl?"#39FF8F":G, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {copiedUrl ? <Check size={12}/> : <Copy size={12}/>}
                  </button>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                    style={{ width:26, height:26, background:"none", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:"#8A8478", flexShrink:0 }}>
                    <ExternalLink size={12}/>
                  </a>
                </div>
              )}

              {/* Bio */}
              <div>
                <label style={{ color:"#8A8478", fontSize:11, display:"block", marginBottom:5, fontWeight:500 }}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Decris-toi en quelques mots..." rows={2}
                  style={{ width:"100%", background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, padding:"10px 13px", color:"#F5F0E8", fontSize:13, outline:"none", boxSizing:"border-box" as const, resize:"vertical" as const, lineHeight:1.6 }}/>
                <p style={{ color:"#8A8478", fontSize:10, margin:"3px 0 0" }}>{form.bio.length}/160</p>
              </div>

              {/* Site web */}
              <div>
                <label style={{ color:"#8A8478", fontSize:11, display:"block", marginBottom:5, fontWeight:500 }}>Site web</label>
                <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://mon-site.com"
                  style={{ width:"100%", background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, padding:"10px 13px", color:"#F5F0E8", fontSize:13, outline:"none", boxSizing:"border-box" as const }}/>
              </div>

              {/* Bouton save */}
              <button onClick={saveProfile}
                disabled={saving || !hasChanges || usernameStatus==="taken" || usernameStatus==="invalid" || usernameStatus==="checking"}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:saved?"rgba(57,255,143,0.1)":hasChanges?"linear-gradient(90deg,#C9A84C,#b8953f)":"rgba(255,255,255,0.04)", border:saved?"1px solid rgba(57,255,143,0.3)":"none", borderRadius:9, padding:"11px", color:saved?"#39FF8F":hasChanges?"#080808":"#8A8478", fontSize:13, fontWeight:700, cursor:saving||!hasChanges||usernameStatus==="taken"||usernameStatus==="invalid"||usernameStatus==="checking"?"not-allowed":"pointer", transition:"all 0.2s", opacity:saving?0.7:1 }}>
                {saved ? <><Check size={13}/> Sauvegarde !</>
                  : saving ? "Sauvegarde..."
                  : !hasChanges ? "Aucune modification"
                  : <><Save size={13}/> Sauvegarder les modifications</>}
              </button>
            </div>
          </SectionCard>


          {/* 2. ACTIVITE RECENTE */}
          <SectionCard title="Activite recente" icon={Clock} color="#38BDF8"
            action={
              <a href="/dashboard/analytics" style={{ color:MUTED, fontSize:11, display:"flex", alignItems:"center", gap:3, textDecoration:"none" }}>
                Tout voir <ChevronRight size={12}/>
              </a>
            }>
            {(() => {
              // Fusionner activity_logs et timeline reconstituee
              const rawEvts = activityLog.length > 0 ? activityLog : buildTimelineFromData()
              const filtered = filterEvents(rawEvts)
              const paginated = filtered.slice(0, (activityPage + 1) * ACTIVITY_PAGE_SIZE)
              const hasMore  = filtered.length > paginated.length

              // Grouper par periode
              const groups: Record<string, ActivityEvent[]> = {}
              for (const evt of paginated) {
                const label = groupLabel(evt.created_at)
                if (!groups[label]) groups[label] = []
                groups[label].push(evt)
              }
              const GROUP_ORDER = ["Aujourd'hui","Hier","Cette semaine","Ce mois","Plus ancien"]
              const sortedGroups = GROUP_ORDER.filter(g => groups[g])

              return (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                  {/* Filtres */}
                  <div style={{ display:"flex", gap:5, overflowX:"auto" }}>
                    {ACTIVITY_FILTER_OPTS.map(f => (
                      <button key={f.id} type="button" onClick={() => { setActivityFilter(f.id); setActivityPage(0) }}
                        style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", background:activityFilter===f.id?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.04)", border:`1px solid ${activityFilter===f.id?"rgba(201,168,76,0.35)":"rgba(255,255,255,0.08)"}`, borderRadius:20, color:activityFilter===f.id?G:MUTED, fontSize:10, fontWeight:activityFilter===f.id?700:400, cursor:"pointer", whiteSpace:"nowrap" as const, flexShrink:0 }}>
                        {f.label}
                        <span style={{ background:activityFilter===f.id?"rgba(201,168,76,0.2)":"rgba(255,255,255,0.06)", borderRadius:10, padding:"0px 5px", fontSize:9 }}>
                          {f.id==="all" ? rawEvts.length
                            : f.id==="pages" ? rawEvts.filter(e=>["page_created","page_published","page_updated"].includes(e.event_type)).length
                            : f.id==="qr"    ? rawEvts.filter(e=>["qr_created","qr_customized","qr_scanned","qr_downloaded"].includes(e.event_type)).length
                            : rawEvts.filter(e=>["plan_changed","referral_validated","profile_updated","api_key_created","export_done"].includes(e.event_type)).length
                          }
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Loading skeleton */}
                  {activityLoading ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {[...Array(5)].map((_,i) => (
                        <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0" }}>
                          <div style={{ width:32, height:32, borderRadius:9, background:"rgba(255,255,255,0.04)", flexShrink:0, animation:"pulse 1.4s ease-in-out infinite", animationDelay:`${i*0.1}s` }}/>
                          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
                            <div style={{ height:12, width:`${60+i*8}%`, borderRadius:4, background:"rgba(255,255,255,0.04)", animation:"pulse 1.4s ease-in-out infinite", animationDelay:`${i*0.1+0.05}s` }}/>
                            <div style={{ height:10, width:"40%", borderRadius:4, background:"rgba(255,255,255,0.03)", animation:"pulse 1.4s ease-in-out infinite", animationDelay:`${i*0.1+0.1}s` }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    /* Empty state */
                    <div style={{ textAlign:"center" as const, padding:"24px 0" }}>
                      <Clock size={28} color={MUTED} style={{ marginBottom:10 }}/>
                      <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:600, margin:"0 0 4px" }}>Aucune activite</p>
                      <p style={{ color:MUTED, fontSize:11, margin:0, lineHeight:1.5 }}>
                        {activityFilter === "all"
                          ? "Vos actions apparaitront ici au fur et a mesure"
                          : "Aucun evenement de ce type"}
                      </p>
                    </div>
                  ) : (
                    /* Timeline */
                    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                      {sortedGroups.map(groupName => (
                        <div key={groupName}>
                          {/* Label de groupe */}
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                            <span style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:1.2, whiteSpace:"nowrap" as const }}>
                              {groupName}
                            </span>
                            <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.05)" }}/>
                          </div>

                          {/* Events du groupe */}
                          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                            {groups[groupName].map((evt, idx) => {
                              const cfg = ACTIVITY_CFG[evt.event_type] || ACTIVITY_CFG.page_updated
                              const Icon = cfg.icon
                              const isLast = idx === groups[groupName].length - 1
                              const href = evt.entity_type === "page"
                                ? `/dashboard/builder/${evt.entity_id}`
                                : evt.entity_type === "qr_code"
                                ? `/dashboard/qr-codes`
                                : null
                              return (
                                <div key={evt.id} style={{ display:"flex", gap:12, position:"relative" as const }}>
                                  {/* Ligne de timeline */}
                                  {!isLast && (
                                    <div style={{ position:"absolute", left:15, top:34, bottom:-1, width:1, background:"rgba(255,255,255,0.06)", zIndex:0 }}/>
                                  )}
                                  {/* Icone */}
                                  <div style={{ width:32, height:32, borderRadius:9, background:cfg.bg, border:`1px solid ${cfg.color}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1, position:"relative" as const }}>
                                    <Icon size={14} color={cfg.color}/>
                                  </div>
                                  {/* Contenu */}
                                  <div style={{ flex:1, paddingTop:6, paddingBottom:isLast?0:10 }}>
                                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                                      <div style={{ flex:1, minWidth:0 }}>
                                        <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:600, margin:"0 0 2px", display:"flex", alignItems:"center", gap:6 }}>
                                          {evt.title}
                                          {evt.entity_label && (
                                            <span style={{ color:cfg.color, fontSize:10, fontWeight:400, background:cfg.bg, padding:"1px 6px", borderRadius:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, maxWidth:120 }}>
                                              {evt.entity_label}
                                            </span>
                                          )}
                                        </p>
                                        {evt.description && (
                                          <p style={{ color:MUTED, fontSize:11, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{evt.description}</p>
                                        )}
                                      </div>
                                      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                                        <span style={{ color:MUTED, fontSize:9, whiteSpace:"nowrap" as const }}>{timeAgo(evt.created_at)}</span>
                                        {href && (
                                          <a href={href} style={{ color:MUTED, display:"flex", alignItems:"center" }}>
                                            <ExternalLink size={10}/>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Pagination */}
                      {hasMore && (
                        <button type="button" onClick={() => setActivityPage(p => p + 1)}
                          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:9, color:MUTED, fontSize:11, cursor:"pointer" }}>
                          Voir plus ({filtered.length - paginated.length} evenements)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </SectionCard>


          {/* 3. PARRAINAGE */}
          <SectionCard title="Programme de parrainage" icon={Gift} color="#EC4899">
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Etapes visuelles */}
              <div style={{ display:"flex", alignItems:"center", gap:0 }}>
                {([
                  { emoji:"🔗", step:"1", label:"Partage",     desc:"Tu envoies ton lien"          },
                  { emoji:"👤", step:"2", label:"Inscription",  desc:"Un ami cree son compte"       },
                  { emoji:"🎁", step:"3", label:"Recompense",   desc:"+1 mois Pro offert"            },
                ] as const).map((s, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", flex:1 }}>
                    <div style={{ flex:1, background:"rgba(236,72,153,0.06)", border:"1px solid rgba(236,72,153,0.14)", borderRadius:9, padding:"10px 8px", textAlign:"center" as const, position:"relative" as const }}>
                      <div style={{ position:"absolute" as const, top:-8, left:"50%", transform:"translateX(-50%)", background:"rgba(236,72,153,0.15)", border:"1px solid rgba(236,72,153,0.3)", borderRadius:20, padding:"1px 7px", fontSize:8, color:"#EC4899", fontWeight:800 }}>{s.step}</div>
                      <span style={{ fontSize:20, display:"block", margin:"4px 0 5px" }}>{s.emoji}</span>
                      <p style={{ color:"#F5F0E8", fontSize:10, fontWeight:700, margin:"0 0 2px" }}>{s.label}</p>
                      <p style={{ color:MUTED, fontSize:9, margin:0, lineHeight:1.4 }}>{s.desc}</p>
                    </div>
                    {i < 2 && <div style={{ width:16, height:1, background:"rgba(236,72,153,0.25)", flexShrink:0 }}/>}
                  </div>
                ))}
              </div>

              {/* KPIs */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}>
                {([
                  { value:referrals.length, label:"Invitations",  color:"#38BDF8" },
                  { value:pendingRefs,       label:"En attente",   color:"#F97316" },
                  { value:validatedRefs,     label:"Valides",      color:"#7B61FF" },
                  { value:totalMonths,       label:"Mois Pro",     color:"#39FF8F" },
                ] as const).map((k, i) => (
                  <div key={i} style={{ background:SURF2, border:"1px solid rgba(255,255,255,0.05)", borderRadius:9, padding:"10px 8px", textAlign:"center" as const }}>
                    <p style={{ color:k.color, fontSize:20, fontWeight:800, margin:0, fontFamily:"Cormorant Garamond, serif", lineHeight:1 }}>{k.value}</p>
                    <p style={{ color:MUTED, fontSize:9, margin:"3px 0 0", lineHeight:1.3 }}>{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Condition de validation */}
              <div style={{ padding:"10px 13px", background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:9 }}>
                <p style={{ color:G, fontSize:11, fontWeight:700, margin:"0 0 3px", display:"flex", alignItems:"center", gap:6 }}>
                  Comment gagner un mois Pro ?
                </p>
                <p style={{ color:MUTED, fontSize:10, margin:0, lineHeight:1.6 }}>
                  Ton filleul doit s'inscrire via ton lien et <strong style={{ color:"#F5F0E8" }}>souscrire a un plan payant</strong> dans les 30 jours. La recompense est creditee automatiquement.
                </p>
              </div>

              {/* Lien + actions partage */}
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                <label style={{ color:MUTED, fontSize:10, fontWeight:500 }}>Ton lien de parrainage</label>
                <div style={{ display:"flex", gap:7 }}>
                  <div style={{ flex:1, background:SURF2, border:`1px solid ${G}20`, borderRadius:9, padding:"9px 12px", color:G, fontSize:11, fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, display:"flex", alignItems:"center" }}>
                    {referralLink}
                  </div>
                  <button onClick={copyReferral}
                    style={{ flexShrink:0, display:"flex", alignItems:"center", gap:5, background:copiedRef?"rgba(57,255,143,0.1)":G+"12", border:`1px solid ${copiedRef?"rgba(57,255,143,0.3)":G+"25"}`, borderRadius:9, padding:"9px 14px", color:copiedRef?"#39FF8F":G, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                    {copiedRef ? <><Check size={12}/> Copie !</> : <><Copy size={12}/> Copier</>}
                  </button>
                </div>

                {/* Boutons de partage */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                  {([
                    { id:"whatsapp" as const, label:"WhatsApp", color:"#25D366", emoji:"💬" },
                    { id:"email"    as const, label:"Email",    color:"#38BDF8", emoji:"✉" },
                    { id:"twitter"  as const, label:"X / Twitter", color:"#F5F0E8", emoji:"🐦" },
                    { id:"linkedin" as const, label:"LinkedIn", color:"#0A66C2", emoji:"💼" },
                  ]).map(btn => (
                    <button key={btn.id} type="button" onClick={() => shareRef(btn.id)}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"8px 4px", background:`${btn.color}10`, border:`1px solid ${btn.color}25`, borderRadius:9, cursor:"pointer" }}>
                      <span style={{ fontSize:16 }}>{btn.emoji}</span>
                      <span style={{ color:MUTED, fontSize:8, fontWeight:600 }}>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Historique filleuls */}
              {referrals.length === 0 ? (
                <div style={{ textAlign:"center" as const, padding:"20px 0" }}>
                  <Gift size={28} color={MUTED} style={{ marginBottom:8 }}/>
                  <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:600, margin:"0 0 5px" }}>Aucun filleul pour l'instant</p>
                  <p style={{ color:MUTED, fontSize:11, margin:"0 0 12px", lineHeight:1.5 }}>
                    Partage ton lien et gagne 1 mois Pro<br/>pour chaque ami qui s'abonne.
                  </p>
                  <button onClick={copyReferral}
                    style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", background:`linear-gradient(90deg,#EC4899,#c73b7e)`, border:"none", borderRadius:9, color:"#F5F0E8", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    <Share2 size={13}/> Partager maintenant
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {/* Filtres */}
                  <div style={{ display:"flex", gap:5 }}>
                    {([
                      { id:"all",       label:"Tous",       count:referrals.length },
                      { id:"pending",   label:"En attente", count:pendingRefs      },
                      { id:"validated", label:"Valides",    count:validatedRefs    },
                      { id:"expired",   label:"Expires",    count:expiredRefs      },
                    ] as const).filter(f => f.id === "all" || f.count > 0).map(f => (
                      <button key={f.id} type="button" onClick={() => setRefFilter(f.id)}
                        style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", background:refFilter===f.id?"rgba(236,72,153,0.12)":"rgba(255,255,255,0.04)", border:`1px solid ${refFilter===f.id?"rgba(236,72,153,0.35)":"rgba(255,255,255,0.07)"}`, borderRadius:20, color:refFilter===f.id?"#EC4899":MUTED, fontSize:10, fontWeight:refFilter===f.id?700:400, cursor:"pointer" }}>
                        {f.label}
                        <span style={{ background:"rgba(255,255,255,0.07)", borderRadius:10, padding:"0 5px", fontSize:9 }}>{f.count}</span>
                      </button>
                    ))}
                  </div>

                  {/* Liste filleuls */}
                  <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                    {filteredRefs.slice(0, 8).map((r, i) => {
                      const STATUS_CFG2: Record<string, { label:string; color:string; bg:string }> = {
                        pending:   { label:"Inscrit",  color:"#F97316", bg:"rgba(249,115,22,0.1)"  },
                        validated: { label:"Valide",   color:"#39FF8F", bg:"rgba(57,255,143,0.1)"  },
                        rewarded:  { label:"Recompense",color:"#7B61FF",bg:"rgba(123,97,255,0.1)"  },
                        expired:   { label:"Expire",   color:"#FF6B6B", bg:"rgba(255,107,107,0.1)" },
                      }
                      const scfg = STATUS_CFG2[r.status] ?? STATUS_CFG2.pending
                      const isLast = i === Math.min(filteredRefs.length, 8) - 1
                      return (
                        <div key={r.id || i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:isLast?"none":"1px solid rgba(255,255,255,0.04)" }}>
                          {/* Avatar initiales anonyme */}
                          <div style={{ width:30, height:30, borderRadius:"50%", background:`${scfg.color}18`, border:`1px solid ${scfg.color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12 }}>
                            👤
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ color:"#F5F0E8", fontSize:11, fontWeight:600, margin:"0 0 1px" }}>Filleul #{i+1}</p>
                            <p style={{ color:MUTED, fontSize:9, margin:0 }}>{formatDate(r.created_at)}{r.reward_months ? ` . +${r.reward_months} mois Pro` : ""}</p>
                          </div>
                          <span style={{ background:scfg.bg, border:`1px solid ${scfg.color}30`, borderRadius:5, padding:"2px 8px", fontSize:9, color:scfg.color, fontWeight:700, flexShrink:0 }}>
                            {scfg.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {filteredRefs.length > 8 && (
                    <p style={{ color:MUTED, fontSize:11, textAlign:"center" as const, margin:"4px 0 0" }}>
                      +{filteredRefs.length - 8} autres filleuls
                    </p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>


          {/* STATISTIQUES */}
          <SectionCard title="Statistiques" icon={TrendingUp} color="#38BDF8"
            tag={statsLoading ? "..." : `${totalPages} pages`}
            action={
              <a href="/dashboard/analytics"
                style={{ display:"flex", alignItems:"center", gap:4, color:MUTED, fontSize:11, textDecoration:"none" }}>
                Analytics <ChevronRight size={12}/>
              </a>
            }>
            {statsLoading ? (
              /* Skeleton */
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[...Array(6)].map((_,i) => (
                    <div key={i} style={{ height:60, borderRadius:9, background:"rgba(255,255,255,0.04)", animation:"pulse 1.5s ease-in-out infinite", animationDelay:`${i*0.1}s` }}/>
                  ))}
                </div>
              </div>
            ) : totalPages === 0 && totalQR === 0 ? (
              /* Empty state */
              <div style={{ textAlign:"center" as const, padding:"20px 0" }}>
                <TrendingUp size={28} color={MUTED} style={{ marginBottom:8 }}/>
                <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:600, margin:"0 0 4px" }}>Aucune donnee</p>
                <p style={{ color:MUTED, fontSize:11, margin:"0 0 12px" }}>Creez votre premiere page pour voir vos stats</p>
                <a href="/dashboard" style={{ color:G, fontSize:11, display:"inline-block" }}>Creer une page</a>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

                {/* Grille principale 3x2 */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[
                    { icon:Eye,        label:"Pages",        value:totalPages,              color:G,          tooltip:"Nombre total de pages creees" },
                    { icon:CheckCircle,label:"Publiees",      value:publishedPages,          color:"#39FF8F",  tooltip:"Pages avec statut Publie" },
                    { icon:QrCode,     label:"QR actifs",     value:activeQR,                color:"#38BDF8",  tooltip:"QR Codes avec statut Actif" },
                    { icon:TrendingUp, label:"Vues total",    value:totalViews.toLocaleString("fr-FR"), color:"#C9A84C", tooltip:"Total des vues sur toutes les pages" },
                    { icon:Users,      label:"Visiteurs uniq",value:uniqueViews.toLocaleString("fr-FR"),color:"#7B61FF", tooltip:"Visiteurs uniques (hors doublons)" },
                    { icon:QrCode,     label:"Scans QR",      value:totalScansQR.toLocaleString("fr-FR"),color:"#F97316",tooltip:"Total des scans sur tous les QR" },
                  ].map((s, i) => (
                    <div key={i}
                      onMouseEnter={() => setStatsTooltip(s.tooltip)}
                      onMouseLeave={() => setStatsTooltip(null)}
                      style={{ position:"relative" as const, background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.05)", borderRadius:9, padding:"10px 11px", cursor:"default" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                        <div style={{ width:22, height:22, borderRadius:6, background:s.color+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <s.icon size={11} color={s.color}/>
                        </div>
                        <span style={{ color:MUTED, fontSize:9, textTransform:"uppercase" as const, letterSpacing:0.8, lineHeight:1.2 }}>{s.label}</span>
                      </div>
                      <p style={{ color:"#F5F0E8", fontSize:18, fontWeight:800, margin:0, fontFamily:"Cormorant Garamond, serif", lineHeight:1 }}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Ligne de conversion */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={{ background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.05)", borderRadius:9, padding:"10px 12px" }}>
                    <p style={{ color:MUTED, fontSize:9, textTransform:"uppercase" as const, letterSpacing:0.8, margin:"0 0 5px" }}>Taux conversion</p>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:6 }}>
                      <p style={{ color:convRate > 10 ? "#39FF8F" : convRate > 5 ? G : MUTED, fontSize:22, fontWeight:800, margin:0, fontFamily:"Cormorant Garamond, serif", lineHeight:1 }}>
                        {convRate}%
                      </p>
                      <span style={{ color:MUTED, fontSize:9, paddingBottom:2 }}>scans / vues</span>
                    </div>
                    {/* Barre */}
                    <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2, marginTop:6, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(convRate*5, 100)}%`, background:`linear-gradient(90deg,${G},#39FF8F)`, borderRadius:2, transition:"width 0.6s ease" }}/>
                    </div>
                  </div>
                  <div style={{ background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.05)", borderRadius:9, padding:"10px 12px" }}>
                    <p style={{ color:MUTED, fontSize:9, textTransform:"uppercase" as const, letterSpacing:0.8, margin:"0 0 5px" }}>Vues / page moy.</p>
                    <p style={{ color:"#F5F0E8", fontSize:22, fontWeight:800, margin:0, fontFamily:"Cormorant Garamond, serif", lineHeight:1 }}>
                      {avgViews.toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>

                {/* Top page / Top QR -- Pro+ */}
                {(profile?.plan === "pro" || profile?.plan === "business") && (topPage || topQR) && (
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    <p style={{ color:MUTED, fontSize:9, textTransform:"uppercase" as const, letterSpacing:1, margin:0 }}>Top performers</p>
                    {topPage && (
                      <a href={`/dashboard/builder/${topPage.id}`} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 11px", background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.12)", borderRadius:9, textDecoration:"none" }}>
                        <div style={{ width:28, height:28, borderRadius:7, background:"rgba(201,168,76,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Eye size={13} color={G}/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ color:"#F5F0E8", fontSize:11, fontWeight:600, margin:"0 0 1px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                            {topPage.title}
                          </p>
                          <p style={{ color:MUTED, fontSize:10, margin:0 }}>{topPage.total_views.toLocaleString("fr-FR")} vues</p>
                        </div>
                        <span style={{ color:G, fontSize:9, fontWeight:700, background:"rgba(201,168,76,0.1)", borderRadius:5, padding:"2px 7px", flexShrink:0 }}>Top page</span>
                      </a>
                    )}
                    {topQR && topQR.total_scans > 0 && (
                      <div style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 11px", background:"rgba(249,115,22,0.05)", border:"1px solid rgba(249,115,22,0.12)", borderRadius:9 }}>
                        <div style={{ width:28, height:28, borderRadius:7, background:"rgba(249,115,22,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <QrCode size={13} color="#F97316"/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ color:"#F5F0E8", fontSize:11, fontWeight:600, margin:"0 0 1px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                            {(topQR.pages as any)?.title || topQR.short_code}
                          </p>
                          <p style={{ color:MUTED, fontSize:10, margin:0 }}>/{topQR.short_code} . {topQR.total_scans.toLocaleString("fr-FR")} scans</p>
                        </div>
                        <span style={{ color:"#F97316", fontSize:9, fontWeight:700, background:"rgba(249,115,22,0.1)", borderRadius:5, padding:"2px 7px", flexShrink:0 }}>Top QR</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Teaser Pro si free */}
                {profile?.plan === "free" && (
                  <div style={{ padding:"10px 12px", background:"rgba(201,168,76,0.04)", border:"1px dashed rgba(201,168,76,0.2)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                    <div>
                      <p style={{ color:"#F5F0E8", fontSize:11, fontWeight:600, margin:"0 0 2px" }}>Top page & Top QR</p>
                      <p style={{ color:MUTED, fontSize:10, margin:0 }}>Disponible en plan Pro</p>
                    </div>
                    <a href="/upgrade" style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:`linear-gradient(90deg,${G},#b8953f)`, borderRadius:7, color:"#080808", textDecoration:"none", fontSize:11, fontWeight:700, flexShrink:0 }}>
                      Upgrade
                    </a>
                  </div>
                )}
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
            {subLoading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[...Array(3)].map((_,i) => (
                  <div key={i} style={{ height:52, borderRadius:10, background:"rgba(255,255,255,0.04)", animation:"pulse 1.4s ease-in-out infinite", animationDelay:`${i*0.15}s` }}/>
                ))}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                {/* En-tete plan */}
                <div style={{ padding:"14px 16px", background:pc+"08", border:`1px solid ${pc}20`, borderRadius:12, position:"relative" as const, overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`radial-gradient(circle,${pc}15,transparent 70%)`, pointerEvents:"none" }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:44, height:44, borderRadius:11, background:pc+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <PlanIcon size={20} color={pc}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <p style={{ color:"#F5F0E8", fontSize:16, fontWeight:700, margin:0 }}>
                          Plan {planCfg.label}
                        </p>
                        {planCfg.badge && (
                          <span style={{ background:"rgba(56,189,248,0.15)", border:"1px solid rgba(56,189,248,0.3)", borderRadius:5, padding:"1px 7px", fontSize:9, color:"#38BDF8", fontWeight:800 }}>
                            {planCfg.badge}
                          </span>
                        )}
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:subStatus==="active"?"rgba(57,255,143,0.1)":subStatus==="trialing"?"rgba(201,168,76,0.1)":subStatus==="free"?"rgba(138,132,120,0.1)":"rgba(255,107,107,0.1)", border:`1px solid ${subStatus==="active"?"rgba(57,255,143,0.25)":subStatus==="trialing"?"rgba(201,168,76,0.25)":subStatus==="free"?"rgba(138,132,120,0.2)":"rgba(255,107,107,0.25)"}`, borderRadius:20, padding:"2px 9px" }}>
                          <div style={{ width:5, height:5, borderRadius:"50%", background:subStatus==="active"?"#39FF8F":subStatus==="trialing"?"#C9A84C":subStatus==="free"?"#8A8478":"#FF6B6B" }}/>
                          <span style={{ color:subStatus==="active"?"#39FF8F":subStatus==="trialing"?"#C9A84C":subStatus==="free"?"#8A8478":"#FF6B6B", fontSize:10, fontWeight:600 }}>
                            {subStatus==="active"?"Actif":subStatus==="trialing"?"Essai gratuit":subStatus==="free"?"Plan gratuit":subStatus==="past_due"?"Paiement en attente":"Annule"}
                          </span>
                        </span>
                      </div>
                      <p style={{ color:MUTED, fontSize:11, margin:0 }}>{planCfg.description}</p>
                    </div>
                    {/* Prix */}
                    <div style={{ textAlign:"right" as const, flexShrink:0 }}>
                      {planCfg.price_monthly === "0" ? (
                        <p style={{ color:MUTED, fontSize:14, fontWeight:700, margin:0 }}>Gratuit</p>
                      ) : (
                        <>
                          <p style={{ color:"#F5F0E8", fontSize:18, fontWeight:800, margin:0, fontFamily:"Cormorant Garamond, serif", lineHeight:1 }}>
                            {subCycle==="annual" ? planCfg.price_annual : planCfg.price_monthly}.
                          </p>
                          <p style={{ color:MUTED, fontSize:9, margin:"2px 0 0" }}>/ mois</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Cycle toggle */}
                  {planCfg.price_monthly !== "0" && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                      <p style={{ color:MUTED, fontSize:10, margin:0 }}>Cycle de facturation :</p>
                      <div style={{ display:"flex", gap:5 }}>
                        {(["monthly","annual"] as const).map(c => (
                          <button key={c} type="button" onClick={() => setSubCycle(c)}
                            style={{ padding:"3px 10px", background:subCycle===c?"rgba(201,168,76,0.12)":"transparent", border:`1px solid ${subCycle===c?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.08)"}`, borderRadius:6, color:subCycle===c?G:MUTED, fontSize:10, fontWeight:subCycle===c?700:400, cursor:"pointer" }}>
                            {c==="monthly"?"Mensuel":"Annuel -20%"}
                          </button>
                        ))}
                      </div>
                      {subRenewal && (
                        <p style={{ color:MUTED, fontSize:10, margin:"0 0 0 auto" }}>
                          Renouvellement : {new Date(subRenewal).toLocaleDateString("fr-FR", { day:"numeric", month:"long" })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Features incluses */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {planCfg.features.map((f, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <CheckCircle size={12} color="#39FF8F" style={{ flexShrink:0 }}/>
                      <span style={{ color:MUTED, fontSize:11 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Boutons action */}
                <div style={{ display:"flex", gap:8 }}>
                  {currentPlan !== "business" && (
                    <a href="/upgrade"
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"10px", background:`linear-gradient(90deg,${pc},${pc}cc)`, borderRadius:9, color: pc === MUTED ? "#F5F0E8" : "#080808", textDecoration:"none", fontSize:12, fontWeight:700 }}>
                      <Zap size={13}/>
                      {currentPlan==="free"?"Choisir un plan":"Upgrader vers "+nextPlan?.label}
                    </a>
                  )}
                  {currentPlan !== "free" && (
                    <a href="https://billing.stripe.com/p/login/test" target="_blank" rel="noopener noreferrer"
                      style={{ flex:currentPlan==="business"?1:0, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, color:MUTED, textDecoration:"none", fontSize:12, cursor:"pointer", whiteSpace:"nowrap" as const }}>
                      <CreditCard size={13}/> Gerer la facturation
                    </a>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* CONSOMMATION */}
          <SectionCard title="Consommation" icon={TrendingUp} color="#38BDF8">
            {statsLoading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[...Array(3)].map((_,i) => (
                  <div key={i} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <div style={{ height:10, width:"60%", borderRadius:4, background:"rgba(255,255,255,0.04)", animation:"pulse 1.4s ease-in-out infinite" }}/>
                    <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.04)", animation:"pulse 1.4s ease-in-out infinite", animationDelay:`${i*0.1}s` }}/>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                {/* Alert limite atteinte */}
                {(isAtLimitPages || isAtLimitViews) && (
                  <div style={{ display:"flex", alignItems:"flex-start", gap:9, padding:"10px 12px", background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.25)", borderRadius:9 }}>
                    <AlertTriangle size={14} color="#FF6B6B" style={{ flexShrink:0, marginTop:1 }}/>
                    <div>
                      <p style={{ color:"#FF6B6B", fontSize:12, fontWeight:700, margin:"0 0 2px" }}>Limite atteinte</p>
                      <p style={{ color:"rgba(255,107,107,0.8)", fontSize:11, margin:"0 0 8px" }}>
                        {isAtLimitPages ? "Vous avez atteint la limite de pages de votre plan." : "Vous avez atteint la limite de vues mensuelle."}
                      </p>
                      <a href="/upgrade" style={{ color:"#FF6B6B", fontSize:11, fontWeight:700 }}>Upgrader maintenant .</a>
                    </div>
                  </div>
                )}

                {/* Barre Pages */}
                {(() => {
                  const limit = planLimits.pages
                  const used  = totalPages
                  const pct   = limit ? Math.min((used/limit)*100, 100) : 0
                  const isNear = limit && used >= Math.floor(limit * 0.8)
                  const isAt   = limit && used >= limit
                  const barColor = isAt ? "#FF6B6B" : isNear ? "#F97316" : "#38BDF8"
                  return (
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <Eye size={12} color="#38BDF8"/>
                          <span style={{ color:"#F5F0E8", fontSize:12, fontWeight:600 }}>Pages</span>
                          {isNear && !isAt && <span style={{ color:"#F97316", fontSize:9, fontWeight:700, background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:4, padding:"1px 5px" }}>Bientot plein</span>}
                          {isAt && <span style={{ color:"#FF6B6B", fontSize:9, fontWeight:700, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:4, padding:"1px 5px" }}>Limite atteinte</span>}
                        </div>
                        <span style={{ color:isAt?"#FF6B6B":isNear?"#F97316":MUTED, fontSize:11, fontWeight:600 }}>
                          {used} {limit ? `/ ${limit}` : "/ illimite"}
                        </span>
                      </div>
                      {limit ? (
                        <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:isAt?"#FF6B6B":isNear?`linear-gradient(90deg,#F97316,#FF6B6B)`:`linear-gradient(90deg,#38BDF8,#7B61FF)`, borderRadius:3, transition:"width 0.6s ease" }}/>
                        </div>
                      ) : (
                        <div style={{ height:6, background:`linear-gradient(90deg,#38BDF8,#7B61FF)`, borderRadius:3, opacity:0.3 }}/>
                      )}
                    </div>
                  )
                })()}

                {/* Barre Vues */}
                {(() => {
                  const limit = planLimits.views
                  const used  = totalViews
                  const pct   = limit ? Math.min((used/limit)*100, 100) : 0
                  const isNear = limit && used >= Math.floor(limit * 0.8)
                  const isAt   = limit && used >= limit
                  const barColor = isAt ? "#FF6B6B" : isNear ? "#F97316" : G
                  return (
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <TrendingUp size={12} color={G}/>
                          <span style={{ color:"#F5F0E8", fontSize:12, fontWeight:600 }}>Vues ce mois</span>
                          {isNear && !isAt && <span style={{ color:"#F97316", fontSize:9, fontWeight:700, background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:4, padding:"1px 5px" }}>Bientot plein</span>}
                          {isAt && <span style={{ color:"#FF6B6B", fontSize:9, fontWeight:700, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:4, padding:"1px 5px" }}>Limite atteinte</span>}
                        </div>
                        <span style={{ color:isAt?"#FF6B6B":isNear?"#F97316":MUTED, fontSize:11, fontWeight:600 }}>
                          {used.toLocaleString("fr-FR")} {limit ? `/ ${limit.toLocaleString("fr-FR")}` : "/ illimite"}
                        </span>
                      </div>
                      {limit ? (
                        <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:isAt?"#FF6B6B":isNear?`linear-gradient(90deg,#F97316,#FF6B6B)`:`linear-gradient(90deg,${G},#38BDF8)`, borderRadius:3, transition:"width 0.6s ease" }}/>
                        </div>
                      ) : (
                        <div style={{ height:6, background:`linear-gradient(90deg,${G},#39FF8F)`, borderRadius:3, opacity:0.3 }}/>
                      )}
                    </div>
                  )
                })()}

                {/* QR Codes */}
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <QrCode size={12} color="#F97316"/>
                      <span style={{ color:"#F5F0E8", fontSize:12, fontWeight:600 }}>QR Codes actifs</span>
                    </div>
                    <span style={{ color:MUTED, fontSize:11, fontWeight:600 }}>
                      {activeQR} {planLimits.qr ? `/ ${planLimits.qr}` : "/ illimite"}
                    </span>
                  </div>
                  {planLimits.qr ? (
                    <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min((activeQR/planLimits.qr)*100,100)}%`, background:"linear-gradient(90deg,#F97316,#FF6B6B)", borderRadius:3, transition:"width 0.6s ease" }}/>
                    </div>
                  ) : (
                    <div style={{ height:6, background:"linear-gradient(90deg,#F97316,#C9A84C)", borderRadius:3, opacity:0.3 }}/>
                  )}
                </div>

                {/* Equipe -- Business only */}
                {planLimits.team && (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <Users size={12} color="#7B61FF"/>
                        <span style={{ color:"#F5F0E8", fontSize:12, fontWeight:600 }}>Membres equipe</span>
                      </div>
                      <span style={{ color:MUTED, fontSize:11, fontWeight:600 }}>1 / {planLimits.team}</span>
                    </div>
                    <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(1/planLimits.team)*100}%`, background:"linear-gradient(90deg,#7B61FF,#38BDF8)", borderRadius:3 }}/>
                    </div>
                  </div>
                )}

                {/* CTA upgrade contextuel */}
                {currentPlan !== "business" && (isNearPages || isNearViews) && (
                  <div style={{ padding:"12px 14px", background:`${nextPlan?.color || G}06`, border:`1px solid ${nextPlan?.color || G}20`, borderRadius:10 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                      <div>
                        <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:700, margin:"0 0 3px" }}>
                          Passez a {nextPlan?.label}
                        </p>
                        <p style={{ color:MUTED, fontSize:11, margin:0 }}>
                          {planLimits.views ? `${(nextPlan?.limits.views || 0) > (planLimits.views || 0) ? "+" + ((nextPlan?.limits.views ?? 0) - (planLimits.views ?? 0)).toLocaleString("fr-FR") : "Illimite"} vues/mois` : "Capacite augmentee"}
                          {" "}&middot; {nextPlan?.price_monthly}./mois
                        </p>
                      </div>
                      <a href="/upgrade"
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 14px", background:`linear-gradient(90deg,${nextPlan?.color || G},${nextPlan?.color || G}cc)`, borderRadius:8, color:"#080808", textDecoration:"none", fontSize:11, fontWeight:700, flexShrink:0 }}>
                        <Zap size={11}/> Upgrader
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>


          {/* 7. RECOMPENSES */}
          <SectionCard title="Recompenses & Niveau" icon={Star} color="#F59E0B">
            {(() => {
              const badges  = computeBadges()
              const lvl     = computeLevel()
              const earned  = badges.filter(b => b.unlocked)
              const locked  = badges.filter(b => !b.unlocked)
              const cats    = ["pages","scans","referrals","plan","milestone"] as const
              const catLabels: Record<string, string> = {
                pages:"Pages", scans:"Scans", referrals:"Parrainage", plan:"Plan", milestone:"Special"
              }
              return (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* Niveau + Score */}
                  <div style={{ padding:"16px", background:`${lvl.current.color}08`, border:`1px solid ${lvl.current.color}25`, borderRadius:12, position:"relative" as const, overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:-24, right:-24, width:90, height:90, borderRadius:"50%", background:`radial-gradient(circle,${lvl.current.color}15,transparent 70%)`, pointerEvents:"none" }}/>

                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                      {/* Emoji niveau */}
                      <div style={{ width:44, height:44, borderRadius:12, background:`${lvl.current.color}15`, border:`1px solid ${lvl.current.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                        {lvl.current.emoji}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:2 }}>
                          <p style={{ color:"#F5F0E8", fontSize:15, fontWeight:800, margin:0 }}>{lvl.current.label}</p>
                          {lvl.nextLvl && (
                            <span style={{ color:MUTED, fontSize:10 }}>{"-> "}{lvl.nextLvl.label}</span>
                          )}
                        </div>
                        <p style={{ color:MUTED, fontSize:11, margin:0 }}>Score QRfolio : <span style={{ color:lvl.current.color, fontWeight:700 }}>{lvl.score}/100</span></p>
                      </div>
                      {/* Score cercle */}
                      <div style={{ position:"relative" as const, width:48, height:48, flexShrink:0 }}>
                        <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform:"rotate(-90deg)" }}>
                          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
                          <circle cx="24" cy="24" r="20" fill="none"
                            stroke={lvl.current.color} strokeWidth="4"
                            strokeDasharray={`${(lvl.score/100)*125.7} 125.7`}
                            strokeLinecap="round"
                            style={{ transition:"stroke-dasharray 0.8s ease" }}/>
                        </svg>
                        <span style={{ position:"absolute" as const, inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:lvl.current.color, fontSize:11, fontWeight:800 }}>
                          {lvl.score}
                        </span>
                      </div>
                    </div>

                    {/* Barre progression vers prochain niveau */}
                    {lvl.nextLvl && (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <span style={{ color:MUTED, fontSize:9 }}>Progression vers {lvl.nextLvl.label}</span>
                          <span style={{ color:lvl.current.color, fontSize:9, fontWeight:700 }}>{lvl.progressPct}%</span>
                        </div>
                        <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${lvl.progressPct}%`, background:`linear-gradient(90deg,${lvl.current.color},${lvl.nextLvl.color})`, borderRadius:3, transition:"width 0.8s ease" }}/>
                        </div>
                        <p style={{ color:MUTED, fontSize:9, margin:"4px 0 0" }}>
                          Gagnez des points en publiant des pages, obtenant des scans et parrainant des amis
                        </p>
                      </div>
                    )}
                    {!lvl.nextLvl && (
                      <p style={{ color:lvl.current.color, fontSize:11, fontWeight:700, margin:0, textAlign:"center" as const }}>
                        Niveau maximum atteint !
                      </p>
                    )}
                  </div>

                  {/* Compteur badges */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <p style={{ color:MUTED, fontSize:9, textTransform:"uppercase" as const, letterSpacing:1.2, margin:0 }}>
                      Badges debloques
                    </p>
                    <span style={{ color:"#F5F0E8", fontSize:11, fontWeight:700 }}>
                      {earned.length} / {badges.length}
                    </span>
                  </div>

                  {/* Grille badges par categorie */}
                  {cats.map(cat => {
                    const catBadges = badges.filter(b => b.category === cat)
                    if (catBadges.length === 0) return null
                    return (
                      <div key={cat}>
                        <p style={{ color:MUTED, fontSize:9, textTransform:"uppercase" as const, letterSpacing:1, margin:"0 0 8px", display:"flex", alignItems:"center", gap:6 }}>
                          {catLabels[cat]}
                          <span style={{ color:"rgba(138,132,120,0.5)", fontSize:9 }}>
                            {catBadges.filter(b=>b.unlocked).length}/{catBadges.length}
                          </span>
                        </p>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7 }}>
                          {catBadges.map(badge => (
                            <div key={badge.id}
                              title={badge.unlocked ? badge.desc : `Verrou : ${badge.desc}`}
                              style={{ position:"relative" as const, display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"10px 8px", background:badge.unlocked?`${badge.color}08`:"rgba(255,255,255,0.02)", border:`1px solid ${badge.unlocked?`${badge.color}25`:"rgba(255,255,255,0.05)"}`, borderRadius:10, textAlign:"center" as const, filter:badge.unlocked?"none":"grayscale(1)", opacity:badge.unlocked?1:0.45, transition:"all 0.2s" }}>
                              <span style={{ fontSize:22, lineHeight:1, filter:badge.unlocked?"none":"brightness(0.3)" }}>
                                {badge.emoji}
                              </span>
                              <p style={{ color:badge.unlocked?badge.color:MUTED, fontSize:9, fontWeight:badge.unlocked?700:400, margin:0, lineHeight:1.3 }}>
                                {badge.label}
                              </p>
                              {badge.unlocked && (
                                <div style={{ position:"absolute" as const, top:-4, right:-4, width:14, height:14, borderRadius:"50%", background:"#39FF8F", border:"2px solid #080808", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                  <span style={{ fontSize:7, color:"#080808", fontWeight:900 }}>v</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* Stats parrainage conservees */}
                  {(totalMonths > 0 || validatedRefs > 0) && (
                    <div style={{ padding:"12px 14px", background:"rgba(236,72,153,0.05)", border:"1px solid rgba(236,72,153,0.12)", borderRadius:10 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, textAlign:"center" as const }}>
                        <div>
                          <p style={{ color:"#EC4899", fontSize:20, fontWeight:800, margin:0, fontFamily:"Cormorant Garamond, serif" }}>{totalMonths}</p>
                          <p style={{ color:MUTED, fontSize:10, margin:0 }}>Mois Pro gagnes</p>
                        </div>
                        <div>
                          <p style={{ color:"#7B61FF", fontSize:20, fontWeight:800, margin:0, fontFamily:"Cormorant Garamond, serif" }}>{validatedRefs}</p>
                          <p style={{ color:MUTED, fontSize:10, margin:0 }}>Parrainages valides</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
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
