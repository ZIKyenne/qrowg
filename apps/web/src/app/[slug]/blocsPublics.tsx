"use client"
// blocsPublics.tsx — Les blocs de la page publiée qui se tiennent seuls : questions
// fréquentes, horaires, compte à rebours, carrousel, galerie, accordéon, RSVP,
// inscription à un événement, formulaire de contact, annonce, partage, avant/après.
//
// Ils vivaient en tête de PublicPageClient.tsx — 3 196 lignes pour la page que voit
// chaque visiteur après un scan. C'est le fichier où un bug coûte le plus cher :
// il mérite d'être lisible.
import { useCallback, useEffect, useState, useRef, Component } from "react"
import { zoneDeTouche } from "@/lib/cibleTactile"
import { useDialogue } from "@/components/ui/useDialogue"
import SmartImage from "@/components/SmartImage"
import { altGalerie } from "@/lib/texteAlternatif"
import { sizesGrille } from "../dashboard/builder/shared-renderer/models/horairesGalerieReseaux"
import { trackLinkClick } from "@/lib/trackLinkClick"
import { openStatus, DAY_KEYS, announcementMeta, SOCIAL_NETWORKS_MAP, destinationUtile } from "../dashboard/builder/types"
import { chezLeCommerce, dateChezLeCommerce, fuseauDuBloc, fuseauDuVisiteur, memeHeureQue, mentionFuseau } from "@/lib/heureDuCommerce"
import { etatDesConges } from "@/lib/congesDates"
import { correspondAuxChamps } from "@/lib/rechercheSouple"
import { ecrire, lire } from "@/lib/memoireDuNavigateur"

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Repli : sans IntersectionObserver (ou en cas d'echec), on affiche le contenu
    // immediatement -> jamais de bloc invisible de facon permanente (accessibilite).
    if (typeof IntersectionObserver === "undefined") { setInView(true); return }
    try {
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
      obs.observe(el)
      return () => obs.disconnect()
    } catch { setInView(true) }
  }, [])
  return { ref, inView }
}

// ── Frontière d'erreur par bloc : isole un rendu de bloc qui planterait ──────
// (contenu malformé) pour éviter l'écran blanc — le bloc fautif disparaît, le
// reste de la page s'affiche normalement.
export class BlockBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err: unknown) { if (typeof console !== "undefined") console.error("[QRowg] Bloc ignoré (erreur de rendu) :", err) }
  render() { return this.state.failed ? null : this.props.children }
}

// ── Animated Block Wrapper ───────────────────────────────────────────────────
export function AnimatedBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={inView ? "qf-ab qf-ab-in" : "qf-ab"} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ── FAQ Item ─────────────────────────────────────────────────────────────────
export function FAQItem({ q, a, theme, link, linkLabel, compact, onLink }: { q: string; a: string; theme: any; link?: string; linkLabel?: string; compact?: boolean; onLink?: (url: string) => void }) {
  const [open, setOpen] = useState(false)
  const pad = compact ? "10px 14px" : "13px 16px"
  return (
    <div style={{ border: `1px solid ${open ? theme.primary + "30" : "rgba(255,255,255,0.06)"}`, borderRadius: compact ? 10 : 12, overflow: "hidden", marginBottom: compact ? 6 : 8, transition: "all 0.2s" }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: pad, background: open ? `${theme.primary}06` : "transparent", border: "none", color: theme.text, fontSize: compact ? 13 : 14, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
        {q}<span style={{ color: theme.primary, fontSize: 20, flexShrink: 0, marginLeft: 12, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </button>
      <div style={{ maxHeight: open ? 1500 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <div style={{ padding: compact ? "0 14px 12px" : "0 16px 14px" }}>
          {a && <p style={{ color: theme.muted, fontSize: 13, margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{a}</p>}
          {destinationUtile(link) && <a href={destinationUtile(link)!} target="_blank" rel="noopener noreferrer" onClick={() => onLink?.(destinationUtile(link)!)}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: a ? 10 : 0, color: theme.primary, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
            {linkLabel || "En savoir plus"} <span aria-hidden>→</span>
          </a>}
        </div>
      </div>
    </div>
  )
}

// FAQ premium : recherche instantanée + filtres par catégorie + styles (accordéon / compact / cartes).
export function FAQPublic({ c, theme, pageId, blockId }: { c: any; theme: any; pageId: string; blockId: string }) {
  const items = [1,2,3,4,5,6,7,8]
    .map(i => ({ q: c[`q${i}`] as string, a: (c[`a${i}`] || "") as string, cat: (c[`q${i}_cat`] || "").trim() as string, link: (c[`q${i}_link`] || "").trim() as string, linkLabel: (c[`q${i}_link_label`] || "").trim() as string }))
    .filter(it => it.q)
  const [query, setQuery] = useState("")
  const [cat, setCat] = useState("")
  if (items.length === 0) return null
  const compact = c.style === "Compact"
  const cards = c.style === "Cartes"
  const searchOn = c.search === "Oui"
  const MUTED = theme.muted || "#8A8478"
  const FONT_B = theme.fontBody || "DM Sans, sans-serif"
  const cats = Array.from(new Set(items.map(it => it.cat).filter(Boolean)))
  const q = query.trim().toLowerCase()
  const filtered = items.filter(it => (!cat || it.cat === cat) && correspondAuxChamps([it.q, it.a], q))
  const chip = (active: boolean): any => ({ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? theme.primary + "60" : "rgba(255,255,255,0.1)"}`, background: active ? `${theme.primary}14` : "transparent", color: active ? theme.primary : MUTED, whiteSpace: "nowrap" })
  return (
    <div style={{ padding: "6px 24px 16px" }}>
      {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 4px", fontFamily: FONT_B }}>{c.title}</p>}
      {c.subtitle && <p style={{ color: theme.text, fontSize: 14, fontWeight: 600, margin: "0 0 12px", fontFamily: FONT_B }}>{c.subtitle}</p>}
      {searchOn && (
        <input value={query} onChange={e => setQuery(e.target.value)} type="search" inputMode="search" placeholder="Rechercher une question…" aria-label="Rechercher dans la FAQ"
          style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", marginBottom: cats.length ? 10 : 12, borderRadius: 11, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: theme.text, fontSize: 13.5, outline: "none", fontFamily: FONT_B }} />
      )}
      {cats.length > 0 && (
        <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "2px 0 12px", WebkitOverflowScrolling: "touch" }}>
          <button onClick={() => setCat("")} style={chip(!cat)}>Tout</button>
          {cats.map(cn => <button key={cn} onClick={() => setCat(cn)} style={chip(cat === cn)}>{cn}</button>)}
        </div>
      )}
      {filtered.length > 0
        ? filtered.map((it, i) => <FAQItem key={i} q={it.q} a={it.a} theme={theme} link={it.link || undefined} linkLabel={it.linkLabel || undefined} compact={compact || cards}
            onLink={url => trackLinkClick(pageId, blockId, url)} />)
        : <p style={{ color: theme.muted, fontSize: 13, textAlign: "center", padding: "18px 0", margin: 0 }}>Aucune question ne correspond à votre recherche.</p>}
    </div>
  )
}

// ── Social Networks ──────────────────────────────────────────────────────────
// Réseaux : map dérivée de l'éditeur (source unique) + repli pour d'éventuelles clés legacy.
export const SOCIAL_NETWORKS: Record<string, { icon: string; color: string; label: string }> = {
  website: { icon: "🌐", color: "#C9A84C", label: "Site web" },
  ...SOCIAL_NETWORKS_MAP,
}

// ── Bouton Copier réutilisable (feedback visible, plus de copie silencieuse) ──
export function CopyButton({ value, label, copiedLabel = "Copié", track, style }: { value: string; label: React.ReactNode; copiedLabel?: string; track?: () => void; style: any }) {
  const [copied, setCopied] = useState(false)
  const onClick = async () => {
    try { await navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); track?.() } catch {}
  }
  return <button onClick={onClick} aria-live="polite" style={{ ...style, ...(copied ? { color: "var(--success)", borderColor: "rgba(57,255,143,0.4)" } : null) }}>{copied ? `✓ ${copiedLabel}` : label}</button>
}

// ── Badge "Ouvert / Fermé" calculé en direct (tick 60s) ──────────────────────
export function OpenBadge({ c, FONT_B }: { c: any; FONT_B: string }) {
  const [st, setSt] = useState<ReturnType<typeof openStatus>>(null)
  // Vrai quand le visiteur ne lit pas la même heure que le commerce : on le dit,
  // sinon « Ouvert » se lit comme « ouvert maintenant, chez moi ».
  const [ailleurs, setAilleurs] = useState(false)
  const fuseau = fuseauDuBloc(c)
  useEffect(() => {
    const upd = () => {
      const maintenant = new Date()
      setSt(openStatus(c, maintenant, fuseau))
      setAilleurs(!memeHeureQue(maintenant, fuseau, fuseauDuVisiteur()))
    }
    upd(); const t = setInterval(upd, 60000); return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.mon_fri, c.saturday, c.sunday, c.mon, c.tue, c.wed, c.thu, c.fri, c.sat, c.sun, c.mode, fuseau])
  if (!st) return null
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${st.color}18`, border: `1px solid ${st.color}55`, color: st.color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, fontFamily: FONT_B }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.color, boxShadow: `0 0 6px ${st.color}` }} />{st.label}
      {ailleurs && <span style={{ fontWeight: 500, opacity: 0.85 }}>· {mentionFuseau(fuseau)}</span>}
    </span>
  )
}

// Horaires publics : tableau (mode simple hérité OU jour-par-jour), jour actuel surligné,
// bannière d'exception (congés), badge de statut en direct. `todayIdx` en effet -> pas de mismatch SSR.
export function HoursPublic({ c, theme }: { c: any; theme: any }) {
  const [today, setToday] = useState(-1)
  // Le jour surligné est celui du COMMERCE : à Tokyo, la page d'un bistrot
  // parisien marquait « Aujourd'hui » sur la mauvaise ligne.
  const fuseauBloc = fuseauDuBloc(c)
  useEffect(() => { setToday(chezLeCommerce(new Date(), fuseauBloc).jour) }, [fuseauBloc])
  // Un message d'exception dont la période est PASSÉE n'est plus affiché : il
  // annonçait « Fermé du 1er au 15 août » à côté d'un badge « Ouvert », un mois
  // après (relevé du 13 septembre). Le texte reste dans l'éditeur, et le
  // commerçant y est prévenu. Calculé après le montage, comme le reste.
  const [exceptionPerimee, setExceptionPerimee] = useState(false)
  useEffect(() => {
    setExceptionPerimee(etatDesConges(c.exception, dateChezLeCommerce(new Date(), fuseauBloc)).etat === "terminee")
  }, [c.exception, fuseauBloc])
  const exceptionAffichee = c.exception && !exceptionPerimee
  const MUTED = theme.muted || "#8A8478"
  const TEXT = theme.text || "#F5F0E8"
  const G = theme.primary || "#C9A84C"
  const FONT_B = theme.fontBody || "DM Sans, sans-serif"
  const perDayMode = c.mode === "Jour par jour" || DAY_KEYS.some(k => c[k] && String(c[k]).trim())
  // Lignes { label, hours, dayIdx } — dayIdx sert au surlignage du jour courant (-1 = groupe hérité).
  const DAY_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
  let rows: { label: string; hours: string; dayIdx: number }[]
  if (perDayMode) {
    rows = [1,2,3,4,5,6,0].map(d => ({ label: DAY_FULL[d], hours: (c[DAY_KEYS[d]] || "").trim() || "Fermé", dayIdx: d }))
  } else {
    rows = [
      { label: "Lundi — Vendredi", hours: c.mon_fri, dayIdx: -1 },
      { label: "Samedi", hours: c.saturday, dayIdx: 6 },
      { label: "Dimanche", hours: c.sunday, dayIdx: 0 },
    ].filter(r => r.hours) as any
  }
  if (rows.length === 0 && !exceptionAffichee) return null
  const isToday = (dayIdx: number) => dayIdx === today || (dayIdx === -1 && today >= 1 && today <= 5)
  return (
    <div style={{ padding: "6px 24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 0 10px", flexWrap: "wrap" }}>
        {c.title ? <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: 0, fontFamily: FONT_B }}>{c.title}</p> : <span />}
        <OpenBadge c={c} FONT_B={FONT_B} />
      </div>
      {exceptionAffichee && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 11, padding: "10px 13px", marginBottom: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📅</span>
          <p style={{ color: "#FBBF24", fontSize: 12.5, fontWeight: 600, margin: 0, fontFamily: FONT_B }}>{c.exception}</p>
        </div>
      )}
      {rows.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, overflow: "hidden" }}>
          {rows.map((r, i) => {
            const highlight = isToday(r.dayIdx)
            const closed = /^(fermé|ferme|closed|repos)/i.test(r.hours.trim())
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", background: highlight ? `${G}0c` : "transparent", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ color: highlight ? TEXT : MUTED, fontSize: 13, fontWeight: highlight ? 700 : 400, fontFamily: FONT_B }}>{r.label}{highlight && <span style={{ color: G, fontSize: 11, fontWeight: 700, marginLeft: 7, textTransform: "uppercase", letterSpacing: 0.5 }}>Aujourd&apos;hui</span>}</span>
                <span style={{ color: closed ? MUTED : TEXT, fontSize: 13, fontWeight: 600, fontFamily: FONT_B, opacity: closed ? 0.65 : 1 }}>{r.hours}</span>
              </div>
            )
          })}
          {c.note && <div style={{ padding: "9px 16px", background: `${G}05` }}><p style={{ color: MUTED, fontSize: 13.5, margin: 0, fontStyle: "italic", fontFamily: FONT_B }}>{c.note}</p></div>}
        </div>
      )}
    </div>
  )
}

// ── Galerie publique avec lightbox plein écran (clic pour agrandir + navigation) ──
/**
 * Largeur d'affichage d'une image qui occupe toute la largeur du contenu.
 *
 * La page publiée ne dépasse jamais 520 px. Sans cette indication, le
 * navigateur suppose la pleine largeur de l'écran et prend la plus grosse
 * variante disponible — une photo de 1600 px là où 828 suffisent.
 */
export const SIZES_PLEINE = "(max-width: 520px) 100vw, 520px"

/** Idem pour une image posée dans une grille de deux colonnes. */
export const SIZES_DEMI = "(max-width: 520px) 50vw, 260px"

// Largeur d'affichage d'une vignette de galerie : definie une seule fois, dans
// le modele pur du bloc, pour que les deux renderers la partagent.
export { sizesGrille }

export function GalleryPublic({ imgs, legendes = [], layout, cols, colsMobile, title, MUTED, FONT_B }: { imgs: string[]; legendes?: string[]; layout: string; cols: number; colsMobile: number; title?: string; MUTED: string; FONT_B: string }) {
  const [idx, setIdx] = useState<number | null>(null)
  // Les flèches, et elles seules : Échap, la boucle de tabulation, le focus rendu
  // et le défilement gelé viennent du crochet (lot v122).
  useEffect(() => {
    if (idx === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx(i => (i === null ? i : (i + 1) % imgs.length))
      else if (e.key === "ArrowLeft") setIdx(i => (i === null ? i : (i - 1 + imgs.length) % imgs.length))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [idx, imgs.length])
  const fermerLightbox = useCallback(() => setIdx(null), [])
  const { ref: refLightbox, props: propsLightbox } = useDialogue(idx !== null, fermerLightbox, { label: title || "Photo agrandie" })

  const titleEl = title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{title}</p>
  const open = (i: number) => setIdx(i)

  const lightbox = idx !== null && (
    <div ref={refLightbox} {...propsLightbox} onClick={() => setIdx(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <button onClick={e => { e.stopPropagation(); setIdx(null) }} aria-label="Fermer" style={{ position: "absolute", top: 14, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
      {imgs.length > 1 && <>
        <button onClick={e => { e.stopPropagation(); setIdx(i => i === null ? i : (i - 1 + imgs.length) % imgs.length) }} aria-label="Précédente" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>‹</button>
        <button onClick={e => { e.stopPropagation(); setIdx(i => i === null ? i : (i + 1) % imgs.length) }} aria-label="Suivante" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>›</button>
      </>}
      <SmartImage onError={e => { e.currentTarget.style.display = 'none' }} width={1600} height={1200} sizes="100vw" src={imgs[idx]} alt={altGalerie(legendes[idx], title, idx, imgs.length)} onClick={e => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
      {imgs.length > 1 && <span style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.8)", fontSize: 12, background: "rgba(0,0,0,0.4)", borderRadius: 20, padding: "4px 12px" }}>{idx + 1} / {imgs.length}</span>}
    </div>
  )

  if (layout === "masonry") return (
    <div style={{ padding: "6px 24px 16px" }}>
      {titleEl}
      <div className={`qf-cm-${colsMobile}`} style={{ columnCount: cols, columnGap: 8 }}>
        {imgs.map((img, i) => <SmartImage key={i} src={img} alt={altGalerie(legendes[i], title, i, imgs.length)} width={1200} height={1600} sizes={sizesGrille(colsMobile, cols)} onClick={() => open(i)} onError={e => (e.currentTarget.style.display = "none")} style={{ width: "100%", borderRadius: 10, marginBottom: 8, display: "block", breakInside: "avoid", cursor: "zoom-in" }} />)}
      </div>
      {lightbox}
    </div>
  )
  const effCols = layout === "compact" ? Math.max(cols, 3) : cols
  const gap = layout === "compact" ? 5 : 7
  const rad = layout === "compact" ? 8 : 10
  return (
    <div style={{ padding: "6px 24px 16px" }}>
      {titleEl}
      <div className={`qf-gm-${colsMobile}`} style={{ display: "grid", gridTemplateColumns: `repeat(${effCols},1fr)`, gap }}>
        {imgs.map((img, i) => (
          <button key={i} type="button" onClick={() => open(i)} aria-label={`Agrandir : ${altGalerie(legendes[i], title, i, imgs.length)}`}
            style={{ overflow: "hidden", borderRadius: rad, aspectRatio: "1", cursor: "zoom-in", padding: 0, border: "none", background: "none", display: "block", width: "100%" }}>
            <SmartImage src={img} alt={altGalerie(legendes[i], title, i, imgs.length)} width={1200} height={1200} sizes={sizesGrille(colsMobile, effCols)} onError={e => { const p = e.currentTarget.parentElement; if (p) p.style.display = "none" }} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
          </button>
        ))}
      </div>
      {lightbox}
    </div>
  )
}

// ── Avatar du profil : image avec repli sur l'initiale si l'URL est cassée (404) ─
export function ProfileAvatar({ src, name, shapeStyle, decoStyle, bgStyle, fontD }: { src?: string; name?: string; shapeStyle: any; decoStyle: any; bgStyle: any; fontD: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div style={{ width: 96, height: 96, ...shapeStyle, ...decoStyle, ...bgStyle, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 700, color: "#080808", fontFamily: fontD }}>{(name || "?")[0]?.toUpperCase()}</div>
  }
  return <SmartImage src={src} alt={name || ""} width={96} height={96} eager onError={() => setFailed(true)} style={{ width: 96, height: 96, ...shapeStyle, ...decoStyle, objectFit: "cover", margin: "0 auto 14px", display: "block" }} />
}

// Annonce / alerte : icône + couleur auto (ou personnalisée), fenêtre de dates optionnelle,
// bouton optionnel, fermeture par le visiteur (mémorisée en localStorage). Couleurs douces.
export function AnnouncementPublic({ c, theme, pageId, blockId }: { c: any; theme: any; pageId: string; blockId: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    try { if (c.dismissible === "Oui" && lire("qf-ann-" + blockId) === "1") setDismissed(true) } catch {}
    // Ré-évalue la fenêtre de dates sans rechargement (apparition/expiration en direct).
    if (c.start_date || c.end_date) { const t = setInterval(tick, 60000); return () => clearInterval(t) }
  }, [c.dismissible, c.start_date, c.end_date, blockId])
  const TEXT = theme.text || "#F5F0E8"
  const FONT_B = theme.fontBody || "DM Sans, sans-serif"
  if (!c.title && !c.message) return null
  // Fenêtre d'affichage : appliquée seulement après le montage (évite tout décalage SSR).
  // Une date invalide (NaN) est ignorée plutôt que de masquer/afficher par erreur.
  if (now !== null) {
    const s = c.start_date ? Date.parse(c.start_date) : NaN
    const e = c.end_date ? Date.parse(c.end_date) : NaN
    if (!isNaN(s) && now < s) return null
    if (!isNaN(e) && now > e) return null
  }
  if (dismissed) return null
  const meta = announcementMeta(c.type)
  const color = (typeof c.color === "string" && /^#[0-9a-fA-F]{6}$/.test(c.color.trim())) ? c.color.trim() : meta.color
  const icon = (c.emoji || "").trim() || meta.icon
  const compact = c.style === "Compact"
  const dismiss = () => { setDismissed(true); ecrire("qf-ann-" + blockId, "1") }
  return (
    <div style={{ padding: compact ? "6px 24px" : "8px 24px" }}>
      <div role="status" style={{ background: `${color}14`, border: `1.5px solid ${color}44`, borderRadius: 13, padding: compact ? "10px 13px" : "15px 17px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
          <span style={{ fontSize: compact ? 18 : 23, flexShrink: 0, lineHeight: 1.2 }} aria-hidden>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {c.title && <p style={{ color, fontSize: compact ? 13 : 14, fontWeight: 700, margin: c.message || (c.cta_label && c.cta_url) ? "0 0 4px" : "0", fontFamily: FONT_B, paddingRight: c.dismissible === "Oui" ? 20 : 0 }}>{c.title}</p>}
            {c.message && <p style={{ color: TEXT, fontSize: 13, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.message}</p>}
            {c.cta_label && destinationUtile(c.cta_url) && (
              <a href={destinationUtile(c.cta_url)!} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, blockId, destinationUtile(c.cta_url)!)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, color, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
                {c.cta_label} <span aria-hidden>→</span>
              </a>
            )}
          </div>
          {c.dismissible === "Oui" && (
            <button onClick={dismiss} aria-label="Fermer l'annonce"
              style={{ ...zoneDeTouche(), position: "absolute", top: 6, right: 8, color, opacity: 0.7, fontSize: 18, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>
    </div>
  )
}
