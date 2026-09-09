'use client'

/**
 * QRowg — MobileNav (barre du bas, 9 septembre)
 * D'après la maquette « nouvelle direction » : une barre plate sur --bg avec un
 * filet, des tuiles icône + nom comme le rail PC, la tuile active sur surface-2
 * avec un contour d'accent. L'ancienne barre « liquide » (bulle dorée, gouttes,
 * filtre goo, halo, éclaboussures) est retirée : rien ne bouge en boucle.
 *
 * AUCUNE classe Tailwind (le projet n'en utilise pas), tout est en styles inline.
 * L'onglet central « Créer » n'est pas un lien : il ouvre la feuille « Créer » du
 * layout via la prop `onCreate`. La visibilité (mobile only) + le masquage dans
 * l'éditeur sont gérés PAR LE LAYOUT.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactElement } from 'react'

type IconC = () => ReactElement
// `more` : l'onglet ouvre la feuille « Plus » ; `routes` : chemins qui le rendent actif.
type Tab = { key: string; label: string; href?: string; icon: IconC; create?: boolean; more?: boolean; routes?: string[] }

const svgBase: CSSProperties = { width: '100%', height: '100%', display: 'block' }

const Icon = {
  home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={svgBase}>
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </svg>
  ),
  qr: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={svgBase}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="15" width="6" height="6" rx="1" />
      <path d="M15 15h2v2h-2z" />
      <path d="M20 15v2M15 20h6" />
    </svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" style={svgBase}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  stats: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={svgBase}>
      <path d="M6 20v-6M12 20V6M18 20v-9" />
    </svg>
  ),
  user: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={svgBase}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" />
    </svg>
  ),
  more: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={svgBase}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </svg>
  ),
}

// Tout ce qui existe dans la barre latérale PC et n'a pas d'onglet : Messages,
// Médias, Équipe, Domaines, Redirections, Paramètres… n'avaient AUCUNE entrée sur
// téléphone. La feuille « Plus » les liste toutes, rangées par module comme le
// rail PC (Pages · QR codes · Impression · Statistiques · Réglages).
export const MORE_GROUPS: { label: string; items: { href: string; label: string; sub: string }[] }[] = [
  { label: 'Pages', items: [
    { href: '/dashboard/templates', label: 'Modèles', sub: '48 modèles par métier' },
    { href: '/dashboard/assets', label: 'Médias', sub: 'Photos et fichiers réutilisables' },
  ] },
  { label: 'QR codes', items: [
    { href: '/dashboard/qr-link', label: 'QR vers un lien', sub: 'Site, Wi-Fi, téléphone' },
  ] },
  { label: 'Impression', items: [
    { href: '/dashboard/print-studio', label: "Atelier d'impression", sub: 'Supports à imprimer' },
  ] },
  { label: 'Statistiques', items: [
    { href: '/dashboard/leads', label: 'Messages', sub: 'Demandes reçues depuis vos pages' },
  ] },
  { label: 'Réglages', items: [
    { href: '/dashboard/profile', label: 'Profil', sub: 'Identité, abonnement' },
    { href: '/dashboard/settings', label: 'Paramètres', sub: 'Notifications, mot de passe, compte' },
    { href: '/dashboard/team', label: 'Équipe', sub: 'Inviter des collaborateurs' },
    { href: '/dashboard/domains', label: 'Domaines', sub: 'Votre propre adresse' },
    { href: '/dashboard/redirects', label: 'Redirections', sub: 'Anciennes adresses' },
  ] },
]
export const MORE_ITEMS: { href: string; label: string; sub: string }[] = MORE_GROUPS.flatMap(g => g.items)

// Routes réelles du projet (cf. dashboard/layout.tsx). "Créer" = sheet, pas de href.
const FULL_TABS: Tab[] = [
  { key: 'home', label: 'Accueil', href: '/dashboard', icon: Icon.home },
  { key: 'pages', label: 'QR de pages', href: '/dashboard/qr-codes', icon: Icon.qr },
  { key: 'create', label: 'Créer', icon: Icon.plus, create: true },
  { key: 'stats', label: 'Statistiques', href: '/dashboard/analytics', icon: Icon.stats },
  { key: 'more', label: 'Plus', icon: Icon.more, more: true, routes: MORE_ITEMS.map(m => m.href) },
]

// Sans compte, quatre des cinq onglets ci-dessus mènent à la page de connexion
// (Accueil, Pages, Stats, Profil). Un visiteur venu essayer l'éditeur se cognerait
// donc à un mur au premier appui. On lui donne les destinations qui existent pour lui.
const GUEST_TABS: Tab[] = [
  { key: 'templates', label: 'Modèles', href: '/dashboard/templates', icon: Icon.home },
  { key: 'create', label: 'Créer', icon: Icon.plus, create: true },
  { key: 'qr', label: 'Créer un QR', href: '/dashboard/qr-link', icon: Icon.qr },
  { key: 'account', label: 'Compte', href: '/auth/signup', icon: Icon.user },
]

const GOLD = 'var(--accent)'
const MUTED = 'var(--muted)'

export default function MobileNav({ onCreate, unread = 0, guest = false }: { onCreate?: () => void; unread?: number; guest?: boolean }) {
  const pathname = usePathname() || '/dashboard'
  const TABS = guest ? GUEST_TABS : FULL_TABS

  const active = useMemo(() => {
    // match le plus long, sur les onglets AYANT une route (Créer exclu)
    let best = 0
    let bestLen = -1
    const hitOn = (h: string) => pathname === h || pathname.startsWith(h + '/')
    TABS.forEach((t, i) => {
      const routes = t.href ? [t.href] : (t.routes ?? [])
      for (const h of routes) if (hitOn(h) && h.length > bestLen) { best = i; bestLen = h.length }
    })
    return best
  }, [pathname, TABS])

  const [moreOpen, setMoreOpen] = useState(false)

  // La feuille « Plus » se ferme à la navigation et à Échap.
  useEffect(() => { setMoreOpen(false) }, [pathname])
  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  const n = TABS.length

  return (
    <nav aria-label="Navigation principale" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', padding: '6px 8px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))', background: 'var(--bg)', borderTop: '1px solid var(--line)' }}>
        {/* `repeat(${n})` : l'invité a 4 onglets ; avec 5 colonnes fixes, la tuile
            active ne tombait plus sous l'icône. */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 4 }}>
          {TABS.map((tab, i) => {
            const isActive = i === active && !tab.create
            const TabIcon = tab.icon
            const cellStyle: CSSProperties = {
              display: 'flex', minHeight: 52, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              textDecoration: 'none', cursor: 'pointer', padding: '6px 2px', borderRadius: 10, fontFamily: 'inherit',
              background: isActive ? 'var(--surface-2)' : 'transparent',
              border: `1px solid ${isActive ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'transparent'}`,
              color: isActive ? GOLD : MUTED, transition: 'background .15s, color .15s, border-color .15s',
            }
            const inner = (
              <>
                <span style={{ position: 'relative', display: 'block', height: 20, width: 20 }}>
                  <TabIcon />
                  {(tab.href === '/dashboard' || tab.more) && unread > 0 && (
                    <span style={{ position: 'absolute', top: -5, right: -7, minWidth: 14, height: 14, padding: '0 3px', borderRadius: 7, background: 'var(--danger)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, boxShadow: '0 0 0 2px var(--bg)' }}>{unread > 99 ? '99+' : unread}</span>
                  )}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap' }}>{tab.label}</span>
              </>
            )

            if (tab.create) {
              // « Créer » : la seule tuile pleine — c'est l'action primaire du téléphone.
              return (
                <button key={tab.key} type="button" onClick={() => onCreate?.()} aria-label="Créer"
                  style={{ ...cellStyle, background: 'var(--accent)', color: 'var(--ink-on-accent)', border: '1px solid transparent' }}>
                  {inner}
                </button>
              )
            }
            if (tab.more) {
              return (
                <button key={tab.key} type="button" onClick={() => setMoreOpen(o => !o)} aria-label={unread > 0 ? `Plus — ${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}` : 'Plus'} aria-expanded={moreOpen} aria-haspopup="dialog" style={cellStyle}>
                  {inner}
                </button>
              )
            }
            return (
              <Link key={tab.key} href={tab.href!} aria-current={isActive ? 'page' : undefined} style={cellStyle}>
                {inner}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Feuille « Plus » : toutes les sections, rangées par module */}
      {moreOpen && (
        <div onClick={() => setMoreOpen(false)} style={{ pointerEvents: 'auto', position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
          <div role="dialog" aria-modal="true" aria-label="Toutes les sections" onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxHeight: '78dvh', overflowY: 'auto', background: 'var(--surface)', borderTopLeftRadius: 18, borderTopRightRadius: 18, border: '1px solid var(--line-strong)', borderBottom: 'none', padding: '10px 14px calc(16px + env(safe-area-inset-bottom))' }}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: 'var(--line-strong)', margin: '0 auto 12px' }} />
            <p style={{ margin: '0 4px 8px', color: 'var(--ink)', fontSize: 15, fontWeight: 600 }}>Toutes les sections</p>
            {MORE_GROUPS.map(g => (
              <div key={g.label} style={{ marginBottom: 10 }}>
                <p style={{ margin: '8px 4px 2px', color: 'var(--faint)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700 }}>{g.label}</p>
                {g.items.map(it => {
                  const courant = pathname === it.href || pathname.startsWith(it.href + '/')
                  const badge = it.href === '/dashboard/leads' && unread > 0
                  return (
                    <Link key={it.href} href={it.href} aria-current={courant ? 'page' : undefined} onClick={() => setMoreOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 50, padding: '6px 10px', marginBottom: 2, borderRadius: 9, textDecoration: 'none', background: courant ? 'var(--surface-2)' : 'transparent', border: `1px solid ${courant ? 'var(--line-strong)' : 'transparent'}` }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                        <span style={{ color: courant ? GOLD : 'var(--ink)', fontSize: 14.5, fontWeight: 600 }}>{it.label}</span>
                        <span style={{ color: MUTED, fontSize: 12, lineHeight: 1.35 }}>{it.sub}</span>
                      </span>
                      {badge && <span style={{ minWidth: 22, height: 22, padding: '0 7px', borderRadius: 11, background: 'var(--danger)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{unread > 99 ? '99+' : unread}</span>}
                      <span aria-hidden style={{ color: MUTED, fontSize: 18, flexShrink: 0 }}>›</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
