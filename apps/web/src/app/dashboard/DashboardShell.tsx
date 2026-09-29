"use client"

import { useDialogue, useFermetureEchap } from "@/components/ui/useDialogue"
import { ButtonLink } from "@/components/ui/Button"
import { useCallback, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  QrCode, ChevronRight, Printer, Sparkles, Link2, LayoutTemplate, Image as ImageIcon,
  LayoutDashboard, FileText, BarChart3, Settings, MessageSquare, Users, Globe,
  CornerUpRight, User, Menu, X, LogOut, CreditCard, Target,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import MobileNav from "@/components/MobileNav"
import { SessionShellContext } from "./sessionShell"
import { accessibleOwnerIds } from "@/lib/team"
import { pageLimit, getPlan } from "@/lib/plans"
import QrowgLogo from "@/components/QrowgLogo"
import Vignette from "@/components/Vignette"
import { BandeauHorsConnexion } from "@/components/BandeauHorsConnexion"
import { jauge, nombreFr } from "@/lib/chiffresLisibles"
import { phraseDuQuota, texteDeCompte, type Compte } from "@/lib/comptesDuTableauDeBord"
import { attente } from "@/lib/reponseAttendue"
import { ecrire, lire } from "@/lib/memoireDuNavigateur"

const DEFAULT_ACCENT = "#D4AF45"
const MUTED = "var(--qd-muted)"

// Le jeu d'icônes de la navigation (refonte du 28 septembre).
//
// Il était dessiné à la main : treize glyphes en `<span>` empilés, avec des
// bordures de 1,4 px et des masques calés sur le fond réel de la coquille. Ils
// tenaient à 16 px et à ce fond-là ; passer la navigation à 18 px et changer la
// couleur des surfaces les aurait tous décalés d'un demi-pixel, un par un.
//
// Le produit dépend déjà de lucide-react partout ailleurs. Une seule famille,
// une seule épaisseur de trait (1,6 px), une seule taille : c'est ce que « des
// icônes d'épaisseur uniforme » veut dire, et un dessin de plus ne l'aurait pas
// donné. Le nom de glyphe reste le même — la navigation ne change pas de langue.
const GLYPHES = {
  dashboard: LayoutDashboard,
  templates: FileText,
  media: ImageIcon,
  qr: QrCode,
  dynamic: Link2,
  print: Printer,
  analytics: BarChart3,
  goals: Target,
  messages: MessageSquare,
  team: Users,
  domains: Globe,
  redirects: CornerUpRight,
  profile: User,
  settings: Settings,
} as const

function NavGlyph({ name }: { name: string }) {
  const Icone = (GLYPHES as Record<string, typeof LayoutDashboard>)[name]
  if (!Icone) return null
  return <Icone size={18} strokeWidth={1.6} aria-hidden="true" />
}

// Navigation en MODULES : une entrée par chose qu'on vient faire, et — quand le
// module a plusieurs écrans — la liste de ces écrans sous l'entrée ouverte.
// Aucune route n'a disparu : les treize écrans sont tous là.
//
// L'ordre et les noms sont ceux du dessin du 28 septembre : Tableau de bord ·
// Pages · QR codes · Impression · Statistiques, puis Paramètres, calé en bas et
// séparé par un filet. « Réglages » s'appelait ainsi dans la barre latérale alors
// que l'écran qu'il contient s'appelle « Paramètres » : un même endroit portait
// deux noms. Le groupe prend le nom de sa destination principale ; ses quatre
// autres écrans (Profil, Équipe, Domaines, Redirections) restent listés dessous.
type NavItem = { href: string; glyph: string; label: string; exact?: boolean }
type NavGroup = { key: string; label: string; kicker: string; glyph: string; items: NavItem[] }
const NAV_GROUPS: NavGroup[] = [
  { key: "accueil", label: "Tableau de bord", kicker: "Votre espace", glyph: "dashboard", items: [
    { href: "/dashboard", glyph: "dashboard", label: "Tableau de bord", exact: true },
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
  { key: "reglages", label: "Paramètres", kicker: "Espace", glyph: "settings", items: [
    { href: "/dashboard/settings", glyph: "settings", label: "Paramètres" },
    { href: "/dashboard/profile", glyph: "profile", label: "Profil" },
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

// Les écrans qui n'ont pas d'entrée de menu — on y arrive par une action, pas par
// la navigation. Sans eux, le fil d'Ariane de l'en-tête s'arrêterait à « Mon
// espace » et n'aurait plus rien à dire de la page ouverte.
const ECRANS_SANS_MENU: { prefixe: string; label: string }[] = [
  { prefixe: "/dashboard/onboarding", label: "Créer ma page" },
  { prefixe: "/dashboard/builder", label: "Éditeur de page" },
  { prefixe: "/dashboard/subdomain", label: "Sous-domaine" },
  { prefixe: "/dashboard/ui-demo", label: "Démo d'interface" },
]

// Actions du bouton central « Créer ».
//
// Réécrit en partant de la question que se pose vraiment un commerçant qui ouvre
// ce menu : « je veux faire quoi ? ». L'ordre suit le trajet réel : je fais ma
// page → j'obtiens son QR → je l'imprime.
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
  // La préférence « écrans du module repliés » arrive du SERVEUR (cookie lu dans
  // layout.tsx), donc identique des deux côtés de l'hydratation : plus de menu qui
  // se rétracte après coup. localStorage reste la copie de secours (cookie perdu).
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
  const [accent, setAccent] = useState(DEFAULT_ACCENT) // couleur d'accent de l'utilisateur
  const [mounted, setMounted] = useState(false)
  // < 620px : la colonne de navigation laisse la place au menu mobile. Le serveur
  // ne connaît pas l'écran (false) ; ce qui est visible AVANT le JavaScript est
  // décidé par les media queries .qf-sidebar / .qf-mobile-nav, jamais par cette
  // valeur — elle ne sert qu'à ne pas persister une préférence de PC sur mobile.
  const [isMobile, setIsMobile] = useState(false)
  const [unreadLeads, setUnreadLeads] = useState(0) // messages non lus (badge nav)
  const [qrActive, setQrActive] = useState<Compte>(null) // QR de page actifs = quota du plan
  const [pagesTotal, setPagesTotal] = useState<Compte>(null) // compteur réel à côté de « Pages »
  const [createOpen, setCreateOpen] = useState(false) // sheet "Créer" (bouton central mobile)
  const [menuCompte, setMenuCompte] = useState(false) // menu de compte (en-tête)
  const [menuMobile, setMenuMobile] = useState(false) // navigation en tiroir (< 620px)

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

  // Échap fermait déjà la feuille « Créer » — mais elle seule. La tabulation
  // sortait, le focus ne revenait pas au bouton central (lot v122).
  const fermerCreer = useCallback(() => setCreateOpen(false), [])
  const { ref: refCreer, props: propsCreer } = useDialogue(createOpen, fermerCreer, { label: "Créer" })
  // Le tiroir de navigation mobile EST une fenêtre : rôle annoncé, focus piégé,
  // rendu au bouton du menu en sortant.
  const fermerMenuMobile = useCallback(() => setMenuMobile(false), [])
  const { ref: refMenu, props: propsMenu } = useDialogue(menuMobile, fermerMenuMobile, { label: "Navigation" })
  // Le menu de compte n'est PAS une fenêtre (on doit pouvoir en sortir à la
  // tabulation) : Échap le ferme, le clic à côté aussi.
  useFermetureEchap(menuCompte, () => setMenuCompte(false))
  const boiteCompte = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuCompte) return
    const dehors = (e: MouseEvent) => {
      if (!boiteCompte.current?.contains(e.target as Node)) setMenuCompte(false)
    }
    document.addEventListener("mousedown", dehors)
    return () => document.removeEventListener("mousedown", dehors)
  }, [menuCompte])

  const G = accent
  // Masquer la barre mobile dans les editeurs plein ecran (l'atelier d'impression se porte deja au-dessus).
  // Studios immersifs (Mode Focus) : la barre de nav globale ne doit jamais recouvrir un réglage.
  const hideMobileNav = pathname.startsWith("/dashboard/builder") || pathname.startsWith("/dashboard/print-studio")

  useEffect(() => {
    setMounted(true)
    // accent instantané depuis le cache local (évite le flash)
    const cached = lire("qrfolio_accent")
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
            if (acc) { setAccent(acc); ecrire("qrfolio_accent", acc) }
          })
        // Compteurs (les siens + ceux des équipes dont il est membre) : messages non
        // lus, QR actifs (quota), et le nombre RÉEL de pages — un `count: "exact"`,
        // pas la longueur d'une liste d'écran (cf. lib/comptesDuTableauDeBord).
        accessibleOwnerIds(supabase, data.user.id).then(ownerIds => {
          supabase.from("leads").select("id", { count: "exact", head: true }).in("user_id", ownerIds).eq("is_read", false)
            .then(({ count }: any) => { if (typeof count === "number") setUnreadLeads(count) })
          // Quota = QR ACTIFS (status "active" ou nul par défaut) — cf. modèle de quota par actifs.
          supabase.from("qr_codes").select("id", { count: "exact", head: true }).in("user_id", ownerIds).or("status.eq.active,status.is.null")
            .then(({ count }: any) => { if (typeof count === "number") setQrActive(count) })
          supabase.from("pages").select("id", { count: "exact", head: true }).in("user_id", ownerIds)
            .then(({ count }: any) => { if (typeof count === "number") setPagesTotal(count) })
        })
      }
    })
  }, [])

  // Rafraîchit le compteur quand on quitte la page Messages (les lus y sont marqués)
  useEffect(() => {
    if (!user || pathname === "/dashboard/leads") return
    const a = attente()   // en naviguant vite, le compte d'une page s'affichait sur une autre (v111)
    const supabase = createClient()
    accessibleOwnerIds(supabase, user.id).then(ownerIds =>
      supabase.from("leads").select("id", { count: "exact", head: true }).in("user_id", ownerIds).eq("is_read", false)
        .then(a.siEncoreLa(({ count }: any) => { if (typeof count === "number") setUnreadLeads(count) })))
    return a.abandonner
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

  // Responsive : sous 620px la colonne disparaît (menu mobile), sans écraser la
  // préférence de PC.
  useEffect(() => {
    const onResize = () => {
      const mob = window.innerWidth <= 620
      setIsMobile(mob)
      if (!mob) setCollapsed(lire("qrfolio_sidebar") === "collapsed")
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    // Ne pas persister un repli piloté par le mode Focus (préférence utilisateur préservée).
    if (mounted && !isMobile && !focusActive.current) {
      const v = collapsed ? "collapsed" : "expanded"
      ecrire("qrfolio_sidebar", v)
      document.cookie = `qrfolio_sidebar=${v}; path=/; max-age=31536000; samesite=lax`
    }
  }, [collapsed, mounted, isMobile])

  // Une navigation ferme ce qui était ouvert par-dessus.
  useEffect(() => { setMenuMobile(false); setMenuCompte(false) }, [pathname])

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    // `startsWith` seul rendait /dashboard/qr-codes actif sur /dashboard/qr-link :
    // on exige la fin du chemin ou un séparateur.
    return pathname === href || pathname.startsWith(href + "/")
  }

  // Module et écran courants : la navigation éclaire l'entrée, l'en-tête écrit
  // « Mon espace › Écran ».
  const groups = guest ? GUEST_NAV : NAV_GROUPS
  const principaux = groups.filter(g => g.key !== "reglages")
  const reglages = groups.find(g => g.key === "reglages")
  const moduleActif = groups.find(g => g.items.some(it => isActive(it.href, it.exact)))
  const ecranActif = moduleActif?.items.find(it => isActive(it.href, it.exact))
  // Le titre de l'en-tête suit la ROUTE, pas l'écran d'accueil : sur un écran sans
  // entrée de menu (l'éditeur, le tunnel de création), il dit quand même où on est.
  const horsMenu = ECRANS_SANS_MENU.find(e => pathname.startsWith(e.prefixe))
  const titreCourant = ecranActif?.label ?? moduleActif?.label ?? horsMenu?.label ?? null
  // Studios immersifs : ils portent leur propre barre du haut.
  const immersif = hideMobileNav

  const nomCompte = profile?.full_name || user?.email || ""
  const initiale = (profile?.full_name || user?.email || "?")[0].toUpperCase()
  const plan = profile?.plan || "free"
  const planLabel = `Plan ${getPlan(plan).label}`
  // La jauge du plan compte les QR DE PAGE ACTIFS (lib/quota) : c'est ce que le
  // quota borne. Elle s'appelait « Pages publiées » et affichait 13 pendant que le
  // cockpit en annonçait 8 sur 13 — deux nombres, un seul nom (lot du 28 septembre).
  const planLimit = pageLimit(plan)
  const quota = phraseDuQuota(qrActive, planLimit)
  const jaugePlan = planLimit && qrActive != null ? jauge(qrActive, planLimit) : null

  // Replier / déployer les écrans des modules (préférence gardée par cookie).
  const bouton = !guest ? (
    <button type="button" onClick={() => setCollapsed(p => !p)} aria-label={collapsed ? "Déployer le menu" : "Replier le menu"} aria-expanded={!collapsed}
      className="qf-tile"
      style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid var(--qd-line)", borderRadius: 9, cursor: "pointer", color: MUTED, flexShrink: 0 }}>
      <ChevronRight size={14} style={{ transform: collapsed ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform var(--mo-fast) var(--mo-ease-standard)" }} />
    </button>
  ) : null

  /** Une entrée de navigation : icône, nom, et — sous l'entrée ouverte — ses écrans. */
  const entree = (g: NavGroup, options: { compte?: Compte; fermer?: () => void } = {}) => {
    const actif = moduleActif?.key === g.key
    const cible = g.items[0]
    const nonLus = g.items.some(it => it.href === "/dashboard/leads") && unreadLeads > 0
    const sous = g.items.length > 1 && actif && !collapsed
    return (
      <div key={g.key}>
        <Link href={cible.href} className="qd-nav-link" aria-current={actif ? "page" : undefined} onClick={options.fermer}>
          <span className="qd-nav-ic"><NavGlyph name={g.glyph} /></span>
          <span className="qd-nav-libelle" style={{ whiteSpace: "nowrap" }}>{g.label}</span>
          {nonLus && <span className="qd-badge">{unreadLeads > 99 ? "99+" : unreadLeads}</span>}
          {!nonLus && options.compte != null && <span className="qd-nav-compte">{texteDeCompte(options.compte)}</span>}
        </Link>
        {sous && g.items.map(it => (
          <Link key={it.href} href={it.href} className="qd-nav-sous" aria-current={isActive(it.href, it.exact) ? "page" : undefined} onClick={options.fermer}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
            {it.href === "/dashboard/leads" && unreadLeads > 0 && <span className="qd-badge" style={{ marginLeft: "auto" }}>{unreadLeads > 99 ? "99+" : unreadLeads}</span>}
          </Link>
        ))}
      </div>
    )
  }

  /** Le forfait et ce qu'il borne — dit une fois, réutilisé dans la colonne et dans le menu de compte. */
  const blocForfait = (
    <div style={{ padding: "0 12px 12px" }}>
      <Link href="/upgrade" aria-label="Voir les offres" className="qd-forfait-bloc">
        <span style={{ display: "block", color: "var(--qd-ink)", fontSize: 13, fontWeight: 600 }}>{planLabel}</span>
        {quota && <span style={{ display: "block", color: MUTED, fontSize: 12, marginTop: 2 }}>{quota}</span>}
        {jaugePlan && (
          <span aria-hidden="true" style={{ display: "block", height: 2, borderRadius: 2, background: "var(--qd-line)", marginTop: 8, overflow: "hidden" }}>
            <span style={{ display: "block", width: `${jaugePlan.largeur}%`, height: "100%", background: "var(--qd-gold)" }} />
          </span>
        )}
      </Link>
    </div>
  )

  return (
    <div className="qd" style={{
      display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Hors connexion : dit une fois, ici, pour tous les écrans (studios immersifs compris). */}
      <BandeauHorsConnexion />

      {/* EN-TÊTE — marque à gauche (exactement la largeur de la navigation), fil
          d'Ariane et compte à droite. Le filet sous le logo et le filet sous
          l'en-tête sont le MÊME filet : une seule bordure basse sur la grille. */}
      {!immersif && (
        <header className="qf-topbar qd-head">
          <div className="qd-brand">
            <Link href="/dashboard" aria-label="QRowg — tableau de bord" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <QrowgLogo size={28} variant="wordmark" />
            </Link>
          </div>

          <div className="qd-head-main">
            {/* Menu mobile : le bouton n'existe que sous 620 px (CSS), et ouvre la
                MÊME navigation que la colonne — une seule source, NAV_GROUPS. */}
            <button type="button" className="qd-menu-btn" onClick={() => setMenuMobile(true)}
              aria-label="Ouvrir le menu" aria-expanded={menuMobile} aria-haspopup="dialog">
              <Menu size={22} strokeWidth={1.6} />
            </button>
            {/* La marque sur mobile : la cellule de gauche a disparu, le nom reste. */}
            <Link href="/dashboard" aria-label="QRowg — tableau de bord" className="qd-brand-mobile" style={{ textDecoration: "none", alignItems: "center" }}>
              <QrowgLogo size={22} variant="wordmark" />
            </Link>

            {/* Fil : « Mon espace › Écran ». « Mon espace » n'est pas un lien — il n'a
                pas de destination propre, et le tableau de bord est déjà sous le logo. */}
            <nav aria-label="Vous êtes ici" className="qd-fil">
              <span className="qd-fil-racine">Mon espace</span>
              {titreCourant && <>
                <span aria-hidden="true" className="qd-fil-racine" style={{ opacity: .6 }}>›</span>
                <span className="qd-fil-courant">{titreCourant}</span>
              </>}
            </nav>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {/* Visiteur sans compte : « Passer au Pro » et sa jauge n'ont aucun sens — il
                  n'a même pas de plan. On lui dit plutôt ce qu'un compte apporte. */}
              {guest && (
                <ButtonLink href="/auth/signup" title="Pour publier votre page, obtenir son QR code et suivre les scans. Gratuit." size="sm">Créer mon compte</ButtonLink>
              )}

              {/* Le forfait, sobrement : son nom, et rien d'autre. Le quota vit dans la
                  colonne et dans le menu de compte, là où on va le chercher. */}
              {!guest && (
                <Link href="/upgrade" className="qd-forfait" aria-label="Voir les offres" title={quota ?? planLabel}>{planLabel}</Link>
              )}

              {/* Compte : avatar → menu. Toutes les actions du compte y sont, et le
                  forfait y reste lisible quand l'en-tête compact le retire. */}
              {user && (
                <div ref={boiteCompte} style={{ position: "relative" }}>
                  <button type="button" className="qd-compte-btn" onClick={() => setMenuCompte(o => !o)}
                    aria-label="Mon compte" aria-expanded={menuCompte} aria-haspopup="menu" title={nomCompte || "Mon compte"}>
                    <span className="qd-avatar">
                      {/* `Vignette` demande la taille affichée : un avatar de 34 px ne
                          retélécharge pas la photo d'origine (components/Vignette). */}
                      {profile?.avatar_url
                        ? <Vignette src={profile.avatar_url} alt="" eager style={{ width: 34, height: 34, objectFit: "cover" }} />
                        : initiale}
                    </span>
                  </button>
                  {menuCompte && (
                    <div className="qd-menu" role="menu" aria-label="Mon compte">
                      <div className="qd-menu-entete">
                        <p style={{ margin: 0, color: "var(--qd-ink)", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nomCompte || "Mon compte"}</p>
                        <p style={{ margin: "2px 0 0", color: MUTED, fontSize: 12 }}>
                          {planLabel}{quota ? ` · ${quota}` : ""}
                        </p>
                      </div>
                      <Link href="/dashboard/profile" role="menuitem" className="qd-menu-ligne" onClick={() => setMenuCompte(false)}>
                        <User size={16} strokeWidth={1.6} aria-hidden="true" /> Mon profil
                      </Link>
                      <Link href="/dashboard/settings" role="menuitem" className="qd-menu-ligne" onClick={() => setMenuCompte(false)}>
                        <Settings size={16} strokeWidth={1.6} aria-hidden="true" /> Paramètres
                      </Link>
                      <Link href="/upgrade" role="menuitem" className="qd-menu-ligne" onClick={() => setMenuCompte(false)}>
                        <CreditCard size={16} strokeWidth={1.6} aria-hidden="true" /> Voir les offres
                      </Link>
                      <button type="button" role="menuitem" className="qd-menu-ligne" onClick={async () => {
                        setMenuCompte(false)
                        const supabase = createClient()
                        await supabase.auth.signOut()
                        window.location.href = "/auth/login"
                      }}>
                        <LogOut size={16} strokeWidth={1.6} aria-hidden="true" /> Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="qd-frame">
        {/* COLONNE DE NAVIGATION (208 px). Cachée sous 620 px par le CSS — avant tout
            JavaScript — et remplacée par le tiroir + la barre du bas. */}
        <nav aria-label="Navigation principale" className="qf-sidebar qd-nav">
          <div className="qd-nav-groupe">
            {principaux.map(g => entree(g, { compte: g.key === "pages" ? pagesTotal : undefined }))}
          </div>

          {reglages && (
            <div className="qd-nav-groupe qd-nav-pied">
              {!guest && blocForfait}
              {entree(reglages)}
              {bouton && <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 12px 0" }}>{bouton}</div>}
            </div>
          )}
        </nav>

        {/* ZONE DE TRAVAIL — le seul ascenseur de l'application. */}
        <main className={hideMobileNav ? "qd-main" : "qf-main-nav qd-main"}>
          <SessionShellContext.Provider value={{ signedIn, confirmee: sessionConfirmee }}>
            <ToastProvider><ConfirmProvider>{children}</ConfirmProvider></ToastProvider>
          </SessionShellContext.Provider>
        </main>
      </div>

      {/* TIROIR DE NAVIGATION (< 620 px) : la même navigation que la colonne, tous
          les écrans compris. Il ne double pas la barre du bas — celle-ci garde les
          cinq destinations les plus fréquentes, celui-ci les porte toutes. */}
      {menuMobile && (
        <div onClick={() => setMenuMobile(false)} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.55)", display: "flex" }}>
          <div ref={refMenu} {...propsMenu} onClick={e => e.stopPropagation()}
            style={{
              width: "min(300px, 86vw)", display: "flex", flexDirection: "column", background: "var(--qd-chrome)",
              borderRight: "1px solid var(--qd-line)", overflowY: "auto",
              paddingTop: "env(safe-area-inset-top)", paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
              animation: "qdTiroir var(--mo-sheet) var(--mo-ease-standard)",
            }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--qd-line)" }}>
              <QrowgLogo size={22} variant="wordmark" />
              <button type="button" onClick={() => setMenuMobile(false)} aria-label="Fermer le menu"
                style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 9, color: MUTED, cursor: "pointer" }}>
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>
            <div className="qd-nav-groupe" style={{ paddingTop: 12 }}>
              {principaux.map(g => entree(g, { compte: g.key === "pages" ? pagesTotal : undefined, fermer: () => setMenuMobile(false) }))}
            </div>
            {reglages && (
              <div className="qd-nav-groupe qd-nav-pied" style={{ paddingBottom: 12 }}>
                {!guest && blocForfait}
                {entree(reglages, { fermer: () => setMenuMobile(false) })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sheet "Créer" (bouton central de la barre mobile) */}
      {isMobile && !hideMobileNav && createOpen && (
        <div onClick={() => setCreateOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}>
          <div ref={refCreer} {...propsCreer} onClick={e => e.stopPropagation()} style={{ width: "100%", background: "var(--surface)", borderTopLeftRadius: 18, borderTopRightRadius: 18, border: "1px solid var(--line-strong)", borderBottom: "none", padding: "10px 14px calc(16px + env(safe-area-inset-bottom))", animation: "sheetUp .2s var(--mo-ease-standard)" }}>
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

      {/* BARRE DE NAVIGATION MOBILE (components/MobileNav).
          Le bouton central « Créer » ouvre le même sheet qu'avant (onCreate). */}
      {!hideMobileNav && (
        <div className="qf-mobile-nav">
          <MobileNav onCreate={() => setCreateOpen(true)} unread={unreadLeads} guest={guest} />
        </div>
      )}

      <style>{`
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes qdTiroir { from { transform: translateX(-100%) } to { transform: translateX(0) } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
