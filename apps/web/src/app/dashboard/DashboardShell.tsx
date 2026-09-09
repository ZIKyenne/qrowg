"use client"

import { Fragment, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { QrCode, ChevronRight, Printer, Sparkles, Link2, LayoutTemplate, Image as ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import MobileNav from "@/components/MobileNav"
import { SessionShellContext } from "./sessionShell"
import { accessibleOwnerIds } from "@/lib/team"
import { pageLimit } from "@/lib/plans"

const DEFAULT_ACCENT = "#D4AF45"
const MUTED = "var(--muted)"

// Jeu de glyphes filaires de la nav (DA §10) : 16×16, traits 1.4px, dessinés en `currentColor` → ils s'éclairent
// avec le libellé (actif or / survol clair / repos muté). Fond des masques = le fond réel de la coquille.
const S16 = { position: "relative" as const, display: "inline-block" as const, width: 16, height: 16, flexShrink: 0 }
const SB  = "var(--bg)"

// Glyphe QR partagé (même dessin que la tuile du header, à l'échelle nav) : 3 repères + matrice de données.
function QRNavGlyph() {
  const finder = { position: "absolute" as const, display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const, width: 6.5, height: 6.5, border: "1.4px solid currentColor", borderRadius: 1.5 }
  const eye = { width: 1.8, height: 1.8, background: "currentColor" }
  return (
    <span aria-hidden="true" style={S16}>
      <span style={{ ...finder, left: 0, top: 0 }}><span style={eye} /></span>
      <span style={{ ...finder, right: 0, top: 0 }}><span style={eye} /></span>
      <span style={{ ...finder, left: 0, bottom: 0 }}><span style={eye} /></span>
      <span style={{ position: "absolute", right: 0, bottom: 0, width: 2.4, height: 2.4, background: "currentColor" }} />
      <span style={{ position: "absolute", right: 4, bottom: 4, width: 2.4, height: 2.4, background: "currentColor", opacity: 0.5 }} />
    </span>
  )
}

// Glyphe par entrée (voir tableau du handoff §10). Chacun décrit littéralement sa page.
function NavGlyph({ name }: { name: string }) {
  switch (name) {
    case "qr": return <QRNavGlyph />
    case "dashboard": return (
      <span aria-hidden="true" style={S16}>
        <span style={{ position: "absolute", left: 0, top: 0, width: 6, height: 16, border: "1.4px solid currentColor", borderRadius: 2 }} />
        <span style={{ position: "absolute", right: 0, top: 0, width: 8, height: 7, border: "1.4px solid currentColor", borderRadius: 2 }} />
        <span style={{ position: "absolute", right: 0, bottom: 0, width: 8, height: 7, border: "1.4px solid currentColor", borderRadius: 2, opacity: 0.55 }} />
      </span>)
    case "templates": return (
      <span aria-hidden="true" style={S16}>
        <span style={{ position: "absolute", right: 0, top: 0, width: 11, height: 13, border: "1.4px solid currentColor", borderRadius: 2, opacity: 0.4 }} />
        <span style={{ position: "absolute", left: 0, bottom: 0, width: 12.5, height: 14.5, border: "1.4px solid currentColor", borderRadius: 2.5, background: SB, overflow: "hidden" }}>
          <span style={{ position: "absolute", left: 0, top: 0, right: 0, height: 4, background: "currentColor" }} />
          <span style={{ position: "absolute", left: 2.5, top: 6.5, width: 5, height: 5, background: "currentColor", borderRadius: 1, opacity: 0.6 }} />
        </span>
      </span>)
    case "media": return (
      <span aria-hidden="true" style={S16}>
        <span style={{ position: "absolute", left: 0, top: 1, width: 16, height: 13, border: "1.4px solid currentColor", borderRadius: 2, overflow: "hidden" }}>
          <span style={{ position: "absolute", left: 2, top: 2, width: 3, height: 3, borderRadius: "50%", background: "currentColor" }} />
          <span style={{ position: "absolute", left: 2, bottom: 0, width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: "6px solid currentColor" }} />
        </span>
      </span>)
    case "print": return (
      <span aria-hidden="true" style={S16}>
        <span style={{ position: "absolute", left: 3.5, top: 0, width: 9, height: 4, border: "1.4px solid currentColor", borderBottom: "none", borderRadius: "1.5px 1.5px 0 0", opacity: 0.55 }} />
        <span style={{ position: "absolute", left: 0, top: 4, width: 16, height: 7.5, border: "1.4px solid currentColor", borderRadius: 2.5 }} />
        <span style={{ position: "absolute", right: 2.5, top: 6.5, width: 2.2, height: 2.2, borderRadius: "50%", background: "currentColor" }} />
        <span style={{ position: "absolute", left: 3.5, bottom: 0, width: 9, height: 5, background: "currentColor", borderRadius: "0 0 1.5px 1.5px" }} />
      </span>)
    case "dynamic": return (
      <span aria-hidden="true" style={{ ...S16, background: "currentColor", clipPath: "polygon(58% 0, 20% 55%, 45% 55%, 38% 100%, 80% 42%, 53% 42%)" }} />)
    case "analytics": return (
      <span aria-hidden="true" style={{ display: "flex", alignItems: "flex-end", gap: 2.5, width: 16, height: 16, flexShrink: 0 }}>
        <span style={{ width: 3, height: 7, background: "currentColor", borderRadius: 1, opacity: 0.6 }} />
        <span style={{ width: 3, height: 12, background: "currentColor", borderRadius: 1 }} />
        <span style={{ width: 3, height: 16, background: "currentColor", borderRadius: 1 }} />
      </span>)
    case "goals": return (
      <span aria-hidden="true" style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, flexShrink: 0 }}>
        <span style={{ position: "absolute", inset: 0, border: "1.4px solid currentColor", borderRadius: "50%", opacity: 0.55 }} />
        <span style={{ position: "absolute", inset: 4.5, border: "1.4px solid currentColor", borderRadius: "50%" }} />
        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "currentColor" }} />
      </span>)
    case "messages": return (
      <span aria-hidden="true" style={S16}>
        <span style={{ position: "absolute", left: 0, top: 1, width: 16, height: 11, border: "1.4px solid currentColor", borderRadius: 3 }} />
        <span style={{ position: "absolute", left: 2.5, top: 11.4, width: 0, height: 0, borderRight: "5.5px solid transparent", borderTop: "4.5px solid currentColor" }} />
        <span style={{ position: "absolute", left: 4, top: 5, width: 8, height: 1.4, background: "currentColor" }} />
      </span>)
    case "team": return (
      <span aria-hidden="true" style={S16}>
        <span style={{ position: "absolute", left: 1.5, top: 1, width: 6, height: 6, border: "1.4px solid currentColor", borderRadius: "50%" }} />
        <span style={{ position: "absolute", left: 0.5, bottom: 1, width: 8, height: 5, border: "1.4px solid currentColor", borderBottom: "none", borderRadius: "5px 5px 0 0" }} />
        <span style={{ position: "absolute", right: 1.5, top: 1, width: 6, height: 6, border: "1.4px solid currentColor", borderRadius: "50%" }} />
        <span style={{ position: "absolute", right: 0.5, bottom: 1, width: 8, height: 5, border: "1.4px solid currentColor", borderBottom: "none", borderRadius: "5px 5px 0 0", background: SB }} />
      </span>)
    case "domains": return (
      <span aria-hidden="true" style={S16}>
        <span style={{ position: "absolute", inset: 0, border: "1.4px solid currentColor", borderRadius: "50%", overflow: "hidden" }}>
          <span style={{ position: "absolute", left: -2, top: 7.5, width: 20, height: 1.4, background: "currentColor", transform: "rotate(-24deg)" }} />
        </span>
      </span>)
    case "redirects": return (
      <span aria-hidden="true" style={S16}>
        <span style={{ position: "absolute", left: 0.7, bottom: 1.2, width: 8.5, height: 9.5, borderLeft: "1.4px solid currentColor", borderBottom: "1.4px solid currentColor", borderBottomLeftRadius: 4, transform: "scaleX(-1)" }} />
        <span style={{ position: "absolute", left: 5.4, top: 0, width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: "5px solid currentColor" }} />
      </span>)
    case "profile": return (
      <span aria-hidden="true" style={S16}>
        <span style={{ position: "absolute", left: 4.5, top: 0, width: 7, height: 7, border: "1.4px solid currentColor", borderRadius: "50%" }} />
        <span style={{ position: "absolute", left: 1, bottom: 0, width: 14, height: 7, border: "1.4px solid currentColor", borderBottom: "none", borderRadius: "7px 7px 0 0" }} />
      </span>)
    case "settings": return (
      <span aria-hidden="true" style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, flexShrink: 0 }}>
        <span style={{ position: "absolute", inset: 0, background: "currentColor", clipPath: "polygon(41% 0,59% 0,63% 12%,78% 8%,88% 22%,80% 33%,94% 41%,94% 59%,80% 67%,88% 78%,78% 92%,63% 88%,59% 100%,41% 100%,37% 88%,22% 92%,12% 78%,20% 67%,6% 59%,6% 41%,20% 33%,12% 22%,22% 8%,37% 12%)" }} />
        <span style={{ position: "relative", width: 5.5, height: 5.5, borderRadius: "50%", background: SB }} />
      </span>)
    default: return null
  }
}

// Navigation en MODULES (8 septembre, d'après la maquette « nouvelle direction ») :
// un rail d'icônes à gauche — Accueil · Pages · QR codes · Impression ·
// Statistiques · Réglages — et, quand le module a plusieurs écrans, une colonne
// qui les liste. Aucune route n'a disparu : les 13 écrans de l'ancienne barre
// latérale sont tous là, simplement rangés par ce qu'on vient y faire.
// Le rail montre toujours l'icône ET le nom du module (pas d'icône muette).
type NavItem = { href: string; glyph: string; label: string; exact?: boolean }
type NavGroup = { key: string; label: string; kicker: string; glyph: string; items: NavItem[] }
const NAV_GROUPS: NavGroup[] = [
  { key: "accueil", label: "Accueil", kicker: "Votre espace", glyph: "dashboard", items: [
    { href: "/dashboard", glyph: "dashboard", label: "Accueil", exact: true },
  ] },
  { key: "pages", label: "Pages", kicker: "Construire", glyph: "templates", items: [
    { href: "/dashboard/templates", glyph: "templates", label: "Modèles" },
    { href: "/dashboard/assets", glyph: "media", label: "Médias" },
  ] },
  // Deux entrées fabriquent des QR codes. Elles portent le nom de ce vers quoi
  // le QR mène — la seule question que se pose vraiment un commerçant.
  { key: "qr", label: "QR codes", kicker: "Mes QR codes", glyph: "qr", items: [
    { href: "/dashboard/qr-codes", glyph: "qr", label: "QR de pages" },
    { href: "/dashboard/qr-link", glyph: "dynamic", label: "QR vers un lien" },
  ] },
  { key: "print", label: "Impression", kicker: "Imprimer", glyph: "print", items: [
    { href: "/dashboard/print-studio", glyph: "print", label: "Atelier d'impression" },
  ] },
  { key: "stats", label: "Statistiques", kicker: "Mesurer", glyph: "analytics", items: [
    { href: "/dashboard/analytics", glyph: "analytics", label: "Statistiques" },
    // « Objectifs » n'est plus une page : la section vit en bas de l'Accueil (#objectifs).
    { href: "/dashboard/leads", glyph: "messages", label: "Messages" },
  ] },
  { key: "reglages", label: "Réglages", kicker: "Espace", glyph: "settings", items: [
    { href: "/dashboard/profile", glyph: "profile", label: "Profil" },
    { href: "/dashboard/settings", glyph: "settings", label: "Paramètres" },
    { href: "/dashboard/team", glyph: "team", label: "Équipe" },
    { href: "/dashboard/domains", glyph: "domains", label: "Domaines" },
    { href: "/dashboard/redirects", glyph: "redirects", label: "Redirections" },
  ] },
]

// Navigation d'un VISITEUR SANS COMPTE. Depuis l'essai sans inscription, cette
// personne atterrit ici avant même d'avoir un compte : lui montrer Analytics,
// Messages, Équipe, Domaines ou Facturation revient à lui présenter douze portes
// dont neuf sont fermées à clé. On ne garde que ce qui marche vraiment sans session.
const GUEST_NAV: NavGroup[] = [
  { key: "modeles", label: "Modèles", kicker: "Construire", glyph: "templates", items: [
    { href: "/dashboard/templates", glyph: "templates", label: "Modèles" },
  ] },
  { key: "page", label: "Ma page", kicker: "Construire", glyph: "dashboard", items: [
    { href: "/dashboard/builder", glyph: "dashboard", label: "Ma page" },
  ] },
  { key: "qr", label: "QR codes", kicker: "Mes QR codes", glyph: "qr", items: [
    { href: "/dashboard/qr-link", glyph: "dynamic", label: "QR vers un lien" },
  ] },
]

// Actions du bouton central « Créer ».
//
// Réécrit en partant de la question que se pose vraiment un commerçant qui ouvre
// ce menu : « je veux faire quoi ? ». Les libellés d'avant répondaient à une
// autre question — comment le logiciel range ses fonctions.
//
//  · « Créer par objectif » : personne ne se dit « je vais créer par objectif ».
//  · « QR de mes pages » et « Créer un QR » : deux entrées qui disent « QR »
//    sans qu'on puisse les distinguer. La vraie différence n'est pas le mot QR,
//    c'est OÙ il mène : « QR de mes pages » / « QR vers un lien ». Ces noms sont
//    aussi ceux de la barre latérale — une destination, un seul nom dans toute
//    l'application (invariant tenu par nomsEtQuotas.test.ts).
//  · « Support imprimable » : du vocabulaire d'imprimeur. C'est le sticker qu'on
//    colle sur la table.
//  · « Créer une page » (page vierge) est RETIRÉE : partir d'une page blanche est
//    le pire départ possible pour quelqu'un qui n'a jamais fait de site. Les deux
//    entrées du haut mènent au même éditeur, avec du contenu déjà en place.
//
// L'ordre suit le trajet réel : je fais ma page → j'obtiens son QR → je l'imprime.
const CREATE_ACTIONS = [
  { href: "/dashboard/onboarding", icon: Sparkles, label: "Créer ma page", sub: "Guidé en quelques questions — le plus simple" },
  { href: "/dashboard/templates", icon: LayoutTemplate, label: "Partir d'un modèle", sub: "48 designs par métier, à personnaliser" },
  { href: "/dashboard/qr-codes", icon: QrCode, label: "QR de pages", sub: "Celui qui mène à une page QRowg" },
  { href: "/dashboard/qr-link", icon: Link2, label: "QR vers un lien", sub: "Site web, Wi-Fi, téléphone, fiche contact" },
  { href: "/dashboard/print-studio", icon: Printer, label: "Un support à imprimer", sub: "Sticker de table, chevalet, affiche" },
  { href: "/dashboard/assets", icon: ImageIcon, label: "Mes photos et logos", sub: "À importer une fois, réutilisables partout" },
]

// Sans compte, plusieurs de ces actions mènent à la page de connexion. On ne
// propose que celles qui aboutissent vraiment — et pas davantage la page vierge.
const GUEST_CREATE_ACTIONS = [
  { href: "/dashboard/templates", icon: LayoutTemplate, label: "Partir d'un modèle", sub: "Le plus rapide — 48 modèles par métier" },
  { href: "/dashboard/qr-link", icon: Link2, label: "QR vers un lien", sub: "Site web, Wi-Fi, téléphone — sans compte" },
]

export default function DashboardShell({ children, initialSignedIn, initialCollapsed = false }: { children: React.ReactNode; initialSignedIn: boolean; initialCollapsed?: boolean }) {
  const pathname = usePathname()
  // La préférence « barre repliée » arrive du SERVEUR (cookie lu dans layout.tsx),
  // donc identique des deux côtés de l'hydratation : plus de barre qui se rétracte
  // après coup. localStorage reste la copie de secours (cookie perdu).
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [user, setUser] = useState<any>(null)
  // « invité » = session absente. La valeur initiale vient du SERVEUR (cookie de
  // session lu dans layout.tsx) : le HTML rendu porte donc déjà le bon menu, et un
  // visiteur ne voit jamais clignoter des entrées de compte auxquelles il n'a pas
  // accès. `getUser()` confirme ensuite — c'est lui qui fait foi.
  const [signedIn, setSignedIn] = useState<boolean>(initialSignedIn)
  const [sessionConfirmee, setSessionConfirmee] = useState(false) // getUser() a répondu
  const guest = !signedIn
  const [profile, setProfile] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [accent, setAccent] = useState(DEFAULT_ACCENT) // couleur d'accent de l'utilisateur
  // < 860px : menu replié d'office. Le serveur ne connaît pas l'écran (false) ;
  // ce qui est visible AVANT le JavaScript est décidé par les media queries
  // .qf-sidebar / .qf-mobile-nav plus bas, jamais par cette valeur.
  const [isMobile, setIsMobile] = useState(false)
  const [unreadLeads, setUnreadLeads] = useState(0) // messages non lus (badge nav)
  const [qrActive, setQrActive] = useState<number | null>(null) // QR actifs (jauge de quota du pied de page)
  const [createOpen, setCreateOpen] = useState(false) // sheet "Créer" (bouton central mobile)

  // Mode Focus du builder : replie la nav (via l'événement `qrowg:builder-focus`) SANS écraser la
  // préférence utilisateur (garde-fou `focusActive` sur la persistance + restauration à la sortie).
  const focusActive = useRef(false)
  const preFocus = useRef<boolean | null>(null)
  useEffect(() => {
    const onSig = (e: Event) => {
      const on = !!(e as CustomEvent).detail
      focusActive.current = on
      setCollapsed(prev => {
        if (on) { if (preFocus.current === null) preFocus.current = prev; return true }
        const restore = preFocus.current ?? prev; preFocus.current = null; return restore
      })
    }
    window.addEventListener("qrowg:builder-focus", onSig as EventListener)
    return () => window.removeEventListener("qrowg:builder-focus", onSig as EventListener)
  }, [])

  // Fermer le sheet "Créer" sur Échap (a11y clavier).
  useEffect(() => {
    if (!createOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCreateOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [createOpen])
  const G = accent
  // Masquer la barre mobile dans les editeurs plein ecran (l'atelier d'impression se porte deja au-dessus).
  // Studios immersifs (Mode Focus) : la barre de nav globale ne doit jamais recouvrir un réglage.
  const hideMobileNav = pathname.startsWith("/dashboard/builder") || pathname.startsWith("/dashboard/print-studio")

  useEffect(() => {
    setMounted(true)
    // accent instantané depuis le cache local (évite le flash)
    const cached = localStorage.getItem("qrfolio_accent")
    if (cached) setAccent(cached)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user)
      setSessionConfirmee(true)
      if (data.user) {
        setUser(data.user)
        supabase.from("profiles").select("*").eq("id", data.user.id).single()
          .then(({ data: p }) => {
            setProfile(p)
            const acc = p?.preferences?.accent_color || p?.accent_color
            if (acc) { setAccent(acc); localStorage.setItem("qrfolio_accent", acc) }
          })
        // Compteurs (le sien + celui des équipes dont il est membre) : messages non lus + QR actifs (quota).
        accessibleOwnerIds(supabase, data.user.id).then(ownerIds => {
          supabase.from("leads").select("id", { count: "exact", head: true }).in("user_id", ownerIds).eq("is_read", false)
            .then(({ count }: any) => { if (typeof count === "number") setUnreadLeads(count) })
          // Quota = QR ACTIFS (status "active" ou nul par défaut) — cf. modèle de quota par actifs.
          supabase.from("qr_codes").select("id", { count: "exact", head: true }).in("user_id", ownerIds).or("status.eq.active,status.is.null")
            .then(({ count }: any) => { if (typeof count === "number") setQrActive(count) })
        })
      }
    })
  }, [])

  // Rafraîchit le compteur quand on quitte la page Messages (les lus y sont marqués)
  useEffect(() => {
    if (!user || pathname === "/dashboard/leads") return
    const supabase = createClient()
    accessibleOwnerIds(supabase, user.id).then(ownerIds =>
      supabase.from("leads").select("id", { count: "exact", head: true }).in("user_id", ownerIds).eq("is_read", false)
        .then(({ count }: any) => { if (typeof count === "number") setUnreadLeads(count) }))
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
    // Ne pas persister un repli piloté par le mode Focus (préférence utilisateur préservée).
    if (mounted && !isMobile && !focusActive.current) {
      const v = collapsed ? "collapsed" : "expanded"
      localStorage.setItem("qrfolio_sidebar", v)
      document.cookie = `qrfolio_sidebar=${v}; path=/; max-age=31536000; samesite=lax`
    }
  }, [collapsed, mounted, isMobile])

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  // Module et écran courants : le rail éclaire le module, la colonne liste ses
  // écrans, la barre du haut écrit « Module › Écran ».
  const groups = guest ? GUEST_NAV : NAV_GROUPS
  const moduleActif = groups.find(g => g.items.some(it => isActive(it.href, it.exact)))
  const ecranActif = moduleActif?.items.find(it => isActive(it.href, it.exact))
  // La colonne n'existe que si le module a plusieurs écrans ; « collapsed » (préférence
  // utilisateur, cookie) la replie — ses écrans restent joignables par le survol du rail.
  const colonne = !!moduleActif && moduleActif.items.length > 1 && !collapsed
  // Studios immersifs : ils portent leur propre barre du haut.
  const immersif = hideMobileNav

  const initiale = (profile?.full_name || user?.email || "?")[0].toUpperCase()

  // Replier / déployer la colonne des écrans (préférence gardée par cookie) ; calé
  // en bas du rail, juste au-dessus de Réglages.
  const bouton = !guest && moduleActif && moduleActif.items.length > 1 ? (
      <button type="button" onClick={() => setCollapsed(p => !p)} aria-label={collapsed ? "Déployer le menu" : "Replier le menu"} aria-expanded={!collapsed}
        className="qf-tile"
        style={{ width: 32, height: 32, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer", color: MUTED, flexShrink: 0 }}>
        <ChevronRight size={13} style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform .2s" }} />
      </button>
    
  ) : null

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "DM Sans, sans-serif", overflow: "hidden",
      // Aplat : la trame QR et la lueur qui couvraient toute l'application sont
      // retirées (couche « Calme », 8 septembre) — la trame ne sert plus qu'aux
      // scènes de travail.
      background: "var(--bg)",
    }}>
      {/* BARRE DU HAUT (PC) : logo · Module › Écran · compte. Cachée sur téléphone par le
          CSS (.qf-topbar) et dans les studios immersifs qui ont la leur. */}
      {!immersif && (
        <header className="qf-topbar" style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 18, padding: "0 18px 0 16px", borderBottom: "1px solid var(--line)" }}>
          <Link href="/dashboard" aria-label="QROWG — tableau de bord" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ display: "inline-flex", width: 28, height: 28, borderRadius: 8 }}>
              <svg viewBox="0 0 32 32" width="28" height="28" style={{ flex: "none" }} aria-hidden="true">
                <rect x=".9" y=".9" width="30.2" height="30.2" rx="9" fill="none" stroke="rgba(212,175,69,.35)" strokeWidth="1.4" />
                <rect x="7" y="7" width="7" height="7" rx="2" fill="none" stroke="var(--gold)" strokeWidth="1.5" /><rect x="10" y="10" width="1.9" height="1.9" fill="var(--gold)" />
                <rect x="18" y="7" width="7" height="7" rx="2" fill="none" stroke="rgba(244,241,232,.55)" strokeWidth="1.5" /><rect x="21" y="10" width="1.9" height="1.9" fill="rgba(244,241,232,.55)" />
                <rect x="7" y="18" width="7" height="7" rx="2" fill="none" stroke="rgba(244,241,232,.55)" strokeWidth="1.5" /><rect x="10" y="21" width="1.9" height="1.9" fill="rgba(244,241,232,.55)" />
                <rect x="19.5" y="19.5" width="2.6" height="2.6" fill="var(--gold)" /><rect x="23.4" y="23.4" width="2.6" height="2.6" fill="rgba(244,241,232,.3)" />
              </svg>
            </span>
            <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: ".16em", color: "var(--ink)" }}>QROWG</span>
          </Link>

          {/* Fil : Module › Écran */}
          {moduleActif && (
            <nav aria-label="Vous êtes ici" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, fontSize: 13.5 }}>
              <span style={{ color: MUTED }}>{moduleActif.label}</span>
              {ecranActif && ecranActif.label !== moduleActif.label && <>
                <span aria-hidden="true" style={{ color: "var(--faint)" }}>›</span>
                <span style={{ color: "var(--ink)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ecranActif.label}</span>
              </>}
            </nav>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* Visiteur sans compte : « Passer au Pro » et sa jauge n'ont aucun sens — il
                n'a même pas de plan. On lui dit plutôt ce qu'un compte apporte. */}
            {guest && (
              <Link href="/auth/signup" className="da-btn-primary--sm" title="Pour publier votre page, obtenir son QR code et suivre les scans. Gratuit."
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", height: 34, padding: "0 14px", fontSize: 12.5, fontWeight: 700, background: "var(--accent)", color: "var(--ink-on-accent)", borderRadius: 9 }}>
                Créer mon compte
              </Link>
            )}

            {/* Puce du plan (DA §10) : nom du plan + jauge de quota RÉELLE (pages publiées / limite). */}
            {!guest && (() => {
              const plan = profile?.plan || "free"
              const isPaid = plan === "pro" || plan === "business" || plan === "starter"
              const planLabel = plan === "business" ? "Business" : plan === "pro" ? "Plan Pro" : plan === "starter" ? "Starter" : "Passer au Pro"
              // Une page = un QR de page : la jauge parle donc de pages, et le dit.
              const planLimit = pageLimit(plan)
              const pct = planLimit && qrActive != null ? Math.min(100, Math.round((qrActive / planLimit) * 100)) : 0
              const quota = planLimit && qrActive != null ? `${qrActive} / ${planLimit}` : planLimit == null && qrActive != null ? `${qrActive} · illimité` : null
              return (
                <Link href="/upgrade" className="qf-chip" aria-label="Voir les offres"
                  title={quota ? `Pages publiées : ${quota}` : isPaid ? "Abonnement actif" : "Débloquez tout QRowg"}
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, height: 34, padding: "0 12px", borderRadius: 9, border: "1px solid var(--line-strong)", background: "var(--surface)" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: isPaid ? "var(--ink)" : "var(--accent)", whiteSpace: "nowrap" }}>{planLabel}</span>
                  {quota && <>
                    <span style={{ fontSize: 11.5, color: MUTED, whiteSpace: "nowrap" }}>Pages publiées {quota}</span>
                    {planLimit && <span aria-hidden="true" style={{ width: 44, height: 3, borderRadius: 2, background: "var(--surface-2)", overflow: "hidden" }}>
                      <span style={{ display: "block", width: `${pct}%`, height: "100%", background: "var(--accent)", transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
                    </span>}
                  </>}
                </Link>
              )
            })()}

            {/* Compte : avatar → profil. */}
            {user && (
              <Link href="/dashboard/profile" aria-label="Mon profil" title={profile?.full_name || user.email || "Mon profil"}
                style={{ textDecoration: "none", width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", color: "var(--ink-on-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {initiale}
              </Link>
            )}
          </div>
        </header>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* RAIL + COLONNE (masqués sur mobile : remplacés par la barre du bas). La classe
            porte la media query qui les cache dès le HTML serveur, avant tout JS. */}
        <div className="qf-sidebar" style={{ display: isMobile ? "none" : "flex", flexShrink: 0, position: "relative", zIndex: 30 }}>
          {/* Rail : un module = une tuile (icône + nom). Réglages est calé en bas. */}
          <nav aria-label="Navigation principale" className="sidebar-nav" style={{ width: 76, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 8px 12px", borderRight: "1px solid var(--line)", overflowY: "auto", overflowX: "visible" }}>
            {groups.map((g, gi) => {
              const actif = moduleActif?.key === g.key
              const cible = g.items[0]
              const dernier = gi === groups.length - 1 && !guest
              const badge = g.items.some(it => it.href === "/dashboard/leads") && unreadLeads > 0
              return (<Fragment key={g.key}>
                {dernier && <div style={{ marginTop: "auto", display: "flex", justifyContent: "center", width: "100%" }}>
                  {bouton}
                </div>}
                <div className="sidebar-item" style={{ position: "relative", width: "100%" }}>
                  <Link href={cible.href} className="qf-tile" aria-current={actif ? "page" : undefined}
                    style={{
                      textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
                      height: 58, borderRadius: 10,
                      background: actif ? "var(--surface-2)" : "transparent",
                      border: actif ? "1px solid color-mix(in srgb, var(--accent) 45%, transparent)" : "1px solid transparent",
                      color: actif ? "var(--accent)" : MUTED,
                      transition: "background .15s, color .15s, border-color .15s",
                    }}>
                    <span style={{ position: "relative", display: "flex" }}>
                      <NavGlyph name={g.glyph} />
                      {badge && <span style={{ position: "absolute", top: -5, right: -7, minWidth: 15, height: 15, padding: "0 4px", borderRadius: 8, background: "var(--danger)", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, boxShadow: "0 0 0 2px var(--bg)" }}>{unreadLeads > 99 ? "99+" : unreadLeads}</span>}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: actif ? 600 : 500, letterSpacing: ".01em", whiteSpace: "nowrap" }}>{g.label}</span>
                  </Link>
                  {/* Survol : les écrans du module, quand la colonne est repliée ou que le module n'est pas ouvert. */}
                  {g.items.length > 1 && (!colonne || !actif) && (
                    <div className="sidebar-tooltip" role="group" aria-label={g.label} style={{
                      position: "absolute", left: "calc(100% + 8px)", top: 0, minWidth: 190,
                      background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 10,
                      padding: 6, zIndex: 100, opacity: 0, pointerEvents: "none", transition: "opacity .15s", boxShadow: "0 12px 32px rgba(0,0,0,.45)"
                    }}>
                      <div style={{ padding: "6px 10px 4px", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--faint)", fontWeight: 700 }}>{g.label}</div>
                      {g.items.map(it => (
                        <Link key={it.href} href={it.href} className="qf-row" aria-current={isActive(it.href, it.exact) ? "page" : undefined}
                          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7, fontSize: 12.5, color: isActive(it.href, it.exact) ? "var(--accent)" : "var(--ink)", whiteSpace: "nowrap" }}>
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </Fragment>)
            })}
          </nav>

          {/* Colonne : les écrans du module ouvert. */}
          {colonne && moduleActif && (
            <nav aria-label={`Écrans — ${moduleActif.label}`} style={{ width: 232, display: "flex", flexDirection: "column", padding: "18px 12px 12px", borderRight: "1px solid var(--line)", overflowY: "auto" }}>
              <div style={{ padding: "0 8px 12px" }}>
                <div style={{ fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--faint)", fontWeight: 700 }}>{moduleActif.kicker}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", letterSpacing: "-.01em", marginTop: 4 }}>{moduleActif.label}</div>
              </div>
              {moduleActif.items.map(({ href, label, exact }) => {
                const active = isActive(href, exact)
                const nonLus = href === "/dashboard/leads" && unreadLeads > 0
                return (
                  <Link key={href} href={href} className="qf-row" aria-current={active ? "page" : undefined}
                    style={{
                      position: "relative", textDecoration: "none", display: "flex", alignItems: "center", gap: 10,
                      minHeight: 44, padding: "0 12px", borderRadius: 9, marginBottom: 2,
                      background: active ? "var(--surface-2)" : "transparent",
                      border: active ? "1px solid var(--line-strong)" : "1px solid transparent",
                      color: active ? "var(--ink)" : MUTED, fontSize: 13.5, fontWeight: active ? 600 : 400,
                      transition: "background .15s, color .15s",
                    }}>
                    {active && <span aria-hidden="true" style={{ position: "absolute", left: -1, top: 10, bottom: 10, width: 2, borderRadius: 2, background: "var(--accent)" }} />}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                    {nonLus && <span style={{ marginLeft: "auto", background: "var(--danger)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 9, padding: "1px 7px", flexShrink: 0 }}>{unreadLeads > 99 ? "99+" : unreadLeads}</span>}
                    {!nonLus && <ChevronRight size={14} aria-hidden="true" style={{ marginLeft: "auto", flexShrink: 0, opacity: active ? .9 : .45 }} />}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>

      {/* MAIN CONTENT */}
      <main className={hideMobileNav ? undefined : "qf-main-nav"} style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        <SessionShellContext.Provider value={{ signedIn, confirmee: sessionConfirmee }}>
          <ToastProvider><ConfirmProvider>{children}</ConfirmProvider></ToastProvider>
        </SessionShellContext.Provider>
      </main>
      </div>

      {/* Sheet "Créer" (bouton central de la barre mobile) */}
      {isMobile && !hideMobileNav && createOpen && (
        <div onClick={() => setCreateOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}>
          <div role="dialog" aria-modal="true" aria-label="Créer" onClick={e => e.stopPropagation()} style={{ width: "100%", background: "var(--surface)", borderTopLeftRadius: 18, borderTopRightRadius: 18, border: "1px solid var(--line-strong)", borderBottom: "none", padding: "10px 14px calc(16px + env(safe-area-inset-bottom))", animation: "sheetUp .2s var(--mo-ease-standard)" }}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--line-strong)", margin: "0 auto 12px" }} />
            <p style={{ margin: "0 4px 10px", color: "var(--ink)", fontSize: 15, fontWeight: 600 }}>Créer</p>
            {(guest ? GUEST_CREATE_ACTIONS : CREATE_ACTIONS).map(({ href, icon: Icon, label, sub }, i) => (
              <Link key={i} href={href} onClick={() => setCreateOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 10px", textDecoration: "none", borderTop: i ? "1px solid var(--line)" : "none" }}>
                <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: G }}><Icon size={19} /></span>
                {/* `minWidth: 0` : sans lui, un libellé long pousse le chevron
                    hors de l'écran au lieu de se replier. */}
                <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ color: "var(--ink)", fontSize: 15, fontWeight: 700 }}>{label}</span>
                  <span style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.35 }}>{sub}</span>
                </span>
                <ChevronRight size={18} color={MUTED} style={{ marginLeft: "auto", flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* BARRE DE NAVIGATION MOBILE — « Liquid Nav » (components/MobileNav).
          Le bouton central « Créer » ouvre le même sheet qu'avant (onCreate). */}
      {!hideMobileNav && (
        <div className="qf-mobile-nav">
          <MobileNav onCreate={() => setCreateOpen(true)} unread={unreadLeads} guest={guest} />
        </div>
      )}

      <style>{`
        .sidebar-nav::-webkit-scrollbar { display: none }
        .sidebar-item:hover .sidebar-tooltip, .sidebar-item:focus-within .sidebar-tooltip { opacity: 1 !important; pointer-events: auto !important }
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
