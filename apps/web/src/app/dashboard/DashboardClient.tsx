"use client"

import { PageHeader } from "@/components/ui/PageHeader"
import { ButtonLink } from "@/components/ui/Button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Plus, QrCode, BarChart2, Eye, Zap, ArrowRight, Globe, Trash2, ExternalLink, Pencil, AlertTriangle, Check, MoreHorizontal, Printer, Settings, FileText } from "lucide-react"
import { getPlan, fmtPrice } from "@/lib/plans"
import { useIsMobile } from "@/lib/useIsMobile"
import NextStepCard from "@/components/NextStepCard"
import { accessibleOwnerIds } from "@/lib/team"
import RecentLeadsCard from "./RecentLeadsCard"
import { useToast } from "@/components/Toast"
import { Button } from "@/components/ui/Button"
import { APPAREIL_ROBOT } from "@/lib/robots"
import { PAGES_LISTE, PAGES_MESUREES, LIGNES_AGREGEES } from "@/lib/perimetreDeMesure"
import { consequencesDeSuppression, phraseCodesImprimes, exigeConfirmationEcrite, confirmationAttendue, confirmationValide, type CeQuiDisparait } from "@/lib/suppressionDePage"
import { Modal } from "@/components/ui/Modal"
import PostCheckoutBanner from "@/components/PostCheckoutBanner"
import { erreurLisible } from "@/lib/erreurLisible"
import { prochaineEtape } from "./prochaineEtape"
import { raisonDeProposer, accrocheOffre, avantagesEnPlus } from "./offreUtile"
import { debutDuMois, debutDuJour, debutDuJourIlYA, serieDeJours, jourDuCommerce, heureDuCommerce } from "@/lib/jourDuCommerce"
import { attente } from "@/lib/reponseAttendue"
import { useFermetureModale } from "@/lib/useFermetureModale"
import {
  totalDePages, totalDePubliees, texteDeCompte, phrasePubliees, phraseVues, precisionDesVues,
  type Compte,
} from "@/lib/comptesDuTableauDeBord"

type Page = { id: string; title: string; slug: string; status: string; total_views: number; created_at: string }
type Profile = { full_name: string | null; plan: string; total_scans: number; avatar_url: string | null }

/**
 * Ce qu'on montre avant de supprimer une page.
 *
 * La phrase d'avant disait « le QR code », au singulier, sans un chiffre : une
 * page porte autant de QR qu'elle a de supports, ils sont collés sur des tables
 * et distribués en flyers, et la clé étrangère les détruit en cascade — le
 * `short_code` étant unique, aucun nouveau QR ne peut le reprendre (lot v84,
 * voir lib/suppressionDePage.ts). On nomme, on chiffre, et quand la perte est
 * irrattrapable on demande d'écrire le nom de la page.
 */
function DeleteModal({ page, perte, chargement, onConfirm, onCancel, deleting }: { page: Page; perte: CeQuiDisparait | null; chargement: boolean; onConfirm: () => void; onCancel: () => void; deleting: boolean }) {
  const [saisie, setSaisie] = useState("")
  const lignes = perte ? consequencesDeSuppression(perte) : []
  const imprimes = perte ? phraseCodesImprimes(perte.supports.length) : null
  const exige = !!perte && exigeConfirmationEcrite(perte)
  const pret = !chargement && (!exige || confirmationValide(saisie, page.title))
  return (
    <Modal open onClose={onCancel} title="Supprimer cette page ?"
      footer={<>
        <Button variant="ghost" onClick={onCancel} disabled={deleting}>Annuler</Button>
        <Button variant="danger" onClick={onConfirm} loading={deleting} disabled={!pret} leftIcon={<Trash2 size={15} />}>Supprimer définitivement</Button>
      </>}>
      Vous êtes sur le point de supprimer <strong style={{ color: "var(--ink)" }}>« {page.title} »</strong>.
      {chargement && <p style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0 0" }}>Vérification de ce qui disparaîtrait…</p>}
      {!chargement && lignes.length > 0 && (
        <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "var(--ink)", fontSize: 14, lineHeight: 1.7 }}>
          {lignes.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      )}
      {!chargement && imprimes && (
        <p style={{ color: "var(--warning)", fontSize: 13, margin: "12px 0 0", lineHeight: 1.6 }}>{imprimes}</p>
      )}
      {!chargement && lignes.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0 0" }}>Cette page n&apos;a ni QR imprimable, ni historique : sa suppression n&apos;emporte que son contenu.</p>
      )}
      {exige && (
        <div style={{ marginTop: 14 }}>
          <label htmlFor="conf-suppr" style={{ display: "block", color: "var(--muted)", fontSize: 13, margin: "0 0 6px" }}>
            Pour confirmer, écrivez le nom de la page : <strong style={{ color: "var(--ink)" }}>{confirmationAttendue(page.title)}</strong>
          </label>
          <input id="conf-suppr" value={saisie} onChange={e => setSaisie(e.target.value)} autoComplete="off"
            style={{ width: "100%", height: 44, background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 9, color: "var(--ink)", fontSize: 16, padding: "0 12px", boxSizing: "border-box" }} />
        </div>
      )}
    </Modal>
  )
}

type DashProps = {
  // Données préchargées côté SERVEUR (évite le double getUser() + le waterfall
  // client + le spinner initial). Optionnelles : si absentes, on charge au montage.
  initialProfile?: Profile | null
  initialPages?: Page[]
  initialMonthViews?: number
  initialTodayViews?: number
  initialWeekViews?: number[]
  // Les DEUX comptes exacts. `undefined` = le serveur n'a rien passé (banc
  // d'essai, ancien appel) : on retombe alors sur la longueur de la liste, et
  // seulement si elle est plus courte que son plafond (comptesDuTableauDeBord).
  initialPagesTotal?: number | null
  initialPubliees?: number | null
}

export default function DashboardClient({
  initialProfile = null, initialPages = [], initialMonthViews = 0, initialTodayViews = 0, initialWeekViews = [],
  initialPagesTotal = null, initialPubliees = null,
}: DashProps = {}) {
  const isMobile = useIsMobile(620)
  const toast = useToast()
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [loading, setLoading] = useState(!initialProfile) // pas de spinner si déjà seedé par le serveur
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null)
  const [perte, setPerte] = useState<CeQuiDisparait | null>(null)
  const [perteEnCours, setPerteEnCours] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // « Bonjour » / « Bonsoir » : l'heure du commerce, comme tout le reste (v108).
  const [hour] = useState(() => heureDuCommerce(Date.now()) ?? 12)
  const [monthViews, setMonthViews] = useState(initialMonthViews) // vues du mois en cours (quota)
  const [todayViews, setTodayViews] = useState(initialTodayViews) // vues aujourd'hui (vie du dashboard)
  const [weekViews, setWeekViews] = useState<number[]>(initialWeekViews) // 7 derniers jours (mini-sparkline)
  // Les deux compteurs exacts, distincts de la liste affichée : `null` veut dire
  // « pas encore lu », et s'écrit « — » plutôt que « 0 ».
  const [pagesTotalBrut, setPagesTotalBrut] = useState<number | null>(initialPagesTotal)
  const [publieesBrut, setPublieesBrut] = useState<number | null>(initialPubliees)
  const [menuPage, setMenuPage] = useState<Page | null>(null) // ligne "..." -> bottom sheet d'actions (echappe l'overflow de la carte)
  // Échap ferme ce qui se ferme en cliquant à côté (lot v139).
  useFermetureModale(menuPage !== null, () => setMenuPage(null))
  const [copiedId, setCopiedId] = useState<string | null>(null) // feedback "Lien copie"

  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir"

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/auth/login"; return }
    // Pages accessibles : les siennes + celles des équipes dont il est membre.
    const ownerIds = await accessibleOwnerIds(supabase, user.id)
    const [{ data: prof }, { data: pgs }, { data: pagesMesurees }, { count: total }, { count: publiees }] = await Promise.all([
      supabase.from("profiles").select("full_name,plan,total_scans,avatar_url").eq("id", user.id).single(),
      supabase.from("pages").select("id,title,slug,status,total_views,created_at").in("user_id", ownerIds).order("created_at", { ascending: false }).limit(PAGES_LISTE),
      supabase.from("pages").select("id").in("user_id", ownerIds).order("created_at", { ascending: false }).limit(PAGES_MESUREES),
      // Les deux chiffres du cockpit : comptés PAR LA BASE, sur toutes les pages.
      // Avant, « Pages créées » valait `pages.length` — la longueur de la liste
      // plafonnée à vingt — et « publiées » le filtre de cette même liste.
      supabase.from("pages").select("id", { count: "exact", head: true }).in("user_id", ownerIds),
      supabase.from("pages").select("id", { count: "exact", head: true }).in("user_id", ownerIds).eq("status", "published"),
    ])
    if (prof) setProfile(prof)
    if (pgs) setPages(pgs)
    setPagesTotalBrut(typeof total === "number" ? total : null)
    setPublieesBrut(typeof publiees === "number" ? publiees : null)
    // Vues du mois en cours (quota) — sur TOUTES les pages, pas sur les vingt
    // affichées : la liste est un écran, pas un périmètre de mesure (lot v89).
    const ids = (pagesMesurees ?? []).map(p => p.id)
    if (ids.length) {
      // Les mêmes bornes que l'alerte de quota, calculées au même endroit : sinon
      // « ce mois-ci » ne veut pas dire la même chose des deux côtés (lot v108).
      const monthStart = debutDuMois()
      const todayStart = debutDuJour()
      const weekStart  = debutDuJourIlYA(6)
      const [{ count: mCount }, { count: tCount }, { data: wRows }] = await Promise.all([
        supabase.from("page_views").select("id", { count: "exact", head: true }).in("page_id", ids).gte("viewed_at", monthStart).neq("device", APPAREIL_ROBOT),
        supabase.from("page_views").select("id", { count: "exact", head: true }).in("page_id", ids).gte("viewed_at", todayStart).neq("device", APPAREIL_ROBOT),
        supabase.from("page_views").select("viewed_at").in("page_id", ids).gte("viewed_at", weekStart).neq("device", APPAREIL_ROBOT).order("viewed_at", { ascending: false }).limit(LIGNES_AGREGEES),
      ])
      setMonthViews(mCount ?? 0)
      setTodayViews(tCount ?? 0)
      // Répartition sur 7 jours pour la mini-courbe
      // Le rang se lit sur le JOUR, pas sur un écart de 24 h : les deux dimanches
      // de changement d'heure durent 23 h et 25 h, et un pas fixe y décale toute
      // la courbe (lot v108).
      const jours = serieDeJours(7)
      const buckets = Array(jours.length).fill(0)
      for (const r of (wRows ?? [])) {
        const idx = jours.indexOf(jourDuCommerce((r as any).viewed_at))
        if (idx >= 0) buckets[idx]++
      }
      setWeekViews(buckets)
    } else { setMonthViews(0); setTodayViews(0); setWeekViews([]) }
    setLoading(false)
  }

  // Si le serveur a déjà seedé les données (props), on évite le fetch initial
  // (et le 2e getUser()). load() reste utilisé pour rafraîchir après une mutation.
  useEffect(() => { if (!initialProfile) load() }, [])

  // Ce que la cascade emporterait : les supports (nommés), l'historique de
  // scans, les vues, les messages. Lu à l'ouverture du modal, pas avant.
  useEffect(() => {
    if (!pageToDelete) { setPerte(null); return }
    const a = attente()
    setPerteEnCours(true)
    const supabase = createClient()
    Promise.all([
      supabase.from("qr_codes").select("label, short_code").eq("page_id", pageToDelete.id),
      // Les mêmes chiffres que ceux de l'écran Statistiques : les aperçus de
      // lien y sont écartés (lot v77). Annoncer ici un total « robots compris »
      // donnerait deux nombres différents pour la même chose.
      supabase.from("scans").select("id", { count: "exact", head: true }).eq("page_id", pageToDelete.id).neq("device", APPAREIL_ROBOT),
      supabase.from("page_views").select("id", { count: "exact", head: true }).eq("page_id", pageToDelete.id).neq("device", APPAREIL_ROBOT),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("page_id", pageToDelete.id),
    ]).then(([qr, sc, vu, ms]) => {
      if (!a.encoreAttendue()) return
      setPerte({ supports: (qr.data as any) || [], scans: sc.count ?? 0, vues: vu.count ?? 0, messages: ms.count ?? 0 })
      setPerteEnCours(false)
    }, a.siEncoreLa(() => { setPerte({ supports: [] }); setPerteEnCours(false) }))
    return a.abandonner
  }, [pageToDelete])

  async function deletePage(page: Page) {
    setDeleting(true)
    const supabase = createClient()
    // Supprimer blocs, QR codes, scans, vues (cascade via FK). On ne retire de
    // l'UI qu'en cas de SUCCÈS (sinon la page "disparaissait" puis revenait au
    // reload sans explication).
    const { error } = await supabase.from("pages").delete().eq("id", page.id)
    setDeleting(false)
    setPageToDelete(null)
    if (error) { toast.error("Suppression impossible. " + erreurLisible(error)); return }
    setPages(p => p.filter(pg => pg.id !== page.id))
    toast.success("Page supprimée")
    // Refresh profile stats
    load()
  }

  async function togglePublish(page: Page) {
    const supabase = createClient()
    const newStatus = page.status === "published" ? "draft" : "published"
    // .select() confirme que l'update a porté : sinon on affichait "En ligne"
    // alors que la page restait en brouillon (état mensonger).
    const { data, error } = await supabase.from("pages").update({ status: newStatus }).eq("id", page.id).select("id")
    if (error || !data || data.length === 0) {
      toast.error("Action impossible. " + (error ? erreurLisible(error) : "La page n'a pas été trouvée."))
      return
    }
    setPages(p => p.map(pg => pg.id === page.id ? { ...pg, status: newStatus } : pg))
    setMenuPage(m => m && m.id === page.id ? { ...m, status: newStatus } : m)
    // Le compteur de publiées suit l'action, sans relire toute la base.
    setPublieesBrut(n => (typeof n === "number" ? Math.max(0, n + (newStatus === "published" ? 1 : -1)) : n))
    toast.success(newStatus === "published" ? "Page publiée" : "Page dépubliée")
  }

  // Miniature deterministe (pas de theme stocke) : teinte derivee du titre.
  function pageHue(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h }
  // Temps relatif court (fr) a partir d'une date ISO.
  function relTime(iso?: string) {
    if (!iso) return ""
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (d < 60) return "à l'instant"
    if (d < 3600) return `il y a ${Math.floor(d / 60)} min`
    if (d < 86400) return `il y a ${Math.floor(d / 3600)} h`
    if (d < 2592000) return `il y a ${Math.floor(d / 86400)} j`
    return `il y a ${Math.floor(d / 2592000)} mois`
  }
  function copyLink(page: Page) {
    try { navigator.clipboard?.writeText(window.location.origin + "/" + page.slug) } catch {}
    setCopiedId(page.id); setTimeout(() => setCopiedId(null), 1600)
  }

  const MUTED = "var(--qd-muted)"
  // Les trois nombres du cockpit, chacun de sa source — et jamais l'un pour
  // l'autre (lib/comptesDuTableauDeBord) :
  //   · scans totaux    profiles.total_scans, depuis le début
  //   · vues du mois    page_views, sur toutes les pages
  //   · pages créées    count exact ; à défaut, la liste SI elle est complète
  const pagesTotal: Compte = totalDePages(pagesTotalBrut, pages.length, PAGES_LISTE)
  const publiees: Compte = totalDePubliees(
    publieesBrut ?? (pagesTotal !== null && pagesTotal === pages.length ? pages.filter(p => p.status === "published").length : null),
    pagesTotal,
  )
  // Le parcours guidé, lui, raisonne sur ce qu'il a sous les yeux : la liste.
  const publishedCount = publiees ?? pages.filter(p => p.status === "published").length
  const totalScans = profile?.total_scans || 0
  const guide: null | "nopage" | "noscan" = pages.length === 0 ? "nopage" : totalScans === 0 ? "noscan" : null
  // Quota de vues mensuel (soft-cap : on alerte, on ne bloque jamais les pages publiques)
  const viewsLimit = getPlan(profile?.plan).limits.views // null = illimité
  const viewsPct   = viewsLimit ? Math.min(Math.round((monthViews / viewsLimit) * 100), 999) : 0
  const nearViews  = viewsLimit != null && monthViews >= viewsLimit * 0.8 && monthViews < viewsLimit
  const overViews  = viewsLimit != null && monthViews >= viewsLimit
  const maxToday = Math.max(1, ...weekViews)

  if (loading) return (
    <div className="qd-page">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="skeleton" style={{ width: 280, height: 32, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: 200, height: 16 }} />
        </div>
        <div className="skeleton" style={{ width: 160, height: 44, borderRadius: 9 }} />
      </div>
      <div className="skeleton" style={{ height: 116, borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
    </div>
  )

  return (
    <div className="qd-page" style={{ paddingBottom: 24 }}>
      <PostCheckoutBanner param="upgraded" message="Bienvenue ! Votre abonnement est actif. 🎉" />

      {/* 1 · SALUTATION + ACTION PRINCIPALE — « Nouvelle page » est le seul bouton
             d'or plein de l'écran. Sur téléphone, il passe sous la salutation
             (PageHeader replie ses actions) au lieu de serrer le titre. */}
      <PageHeader variante="sobre" gap={0}
        title={<>{greeting}{profile?.full_name ? ", " + profile.full_name.split(" ")[0] : ""}</>}
        sub="Voici l'activité de vos pages."
        actions={
          <Link href="/dashboard/onboarding" className="da-btn-primary da-btn-primary--sm qd-btn" style={isMobile ? { width: "100%", justifyContent: "center" } : undefined}>
            <Plus className="da-ic da-ic-plus" size={16} strokeWidth={2.4} /> <span>Nouvelle page</span>
          </Link>
        } />

      {/* Soft-cap quota de vues : alerte (jamais de blocage des pages publiques) */}
      {(nearViews || overViews) && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: overViews ? "var(--danger-bg)" : "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid " + (overViews ? "var(--danger-border)" : "color-mix(in srgb, var(--accent) 30%, transparent)"), borderRadius: 12, padding: "14px 18px" }}>
          <AlertTriangle size={18} color={overViews ? "var(--danger)" : "var(--qd-gold)"} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ color: "var(--qd-ink)", fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>
              {overViews
                ? `Quota de vues atteint (${monthViews.toLocaleString("fr-FR")} / ${viewsLimit!.toLocaleString("fr-FR")} ce mois-ci)`
                : `Bientôt à court de vues : ${monthViews.toLocaleString("fr-FR")} / ${viewsLimit!.toLocaleString("fr-FR")} (${viewsPct}%)`}
            </p>
            <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              {overViews
                ? "Vos QR codes et vos pages restent en ligne — rien n'est coupé. Passez à un plan supérieur pour relancer le compteur et débloquer plus de vues."
                : "Vos pages restent en ligne sans interruption. Un plan supérieur lève la limite."}
            </p>
          </div>
          <ButtonLink href="/upgrade" variant="danger" size="sm"><Zap size={13} /> Augmenter mon quota</ButtonLink>
        </div>
      )}

      {/* Assistant : conseil contextuel du parcours « normal » (onboarding fini, pas de quota).
          Il reste en haut parce qu'il ne parle que d'un compte qui n'a pas encore
          de quoi lire des statistiques. */}
      {!guide && !nearViews && !overViews && (() => {
        // Le conseil suit la situation du client, pas le nombre d'objets : tant que
        // la première page publiée ne reçoit presque rien, en faire créer une
        // deuxième double le travail sans rien lancer (voir prochaineEtape.ts).
        const etape = prochaineEtape({ pagesPubliees: publishedCount, pages: pages.length, scans: totalScans })
        // « imprimer » n'apparaît plus ici : le bloc d'impression, plus bas, porte
        // déjà cette action. Deux boutons « Créer un support » sur le même écran ne
        // donnent pas deux fois plus envie — ils font douter qu'ils mènent au même
        // endroit (refonte du 28 septembre).
        const tip = etape === "diffuser"
          ? { icon: <QrCode size={17} />, text: <>Votre page est en ligne : montrez son QR code à vos clients — vitrine, comptoir, réseaux.</>, label: "Voir mon QR code", href: "/dashboard/qr-codes" }
          : etape === "elargir"
          ? { icon: <Plus size={17} />, text: <>Créez une 2ᵉ page pour un autre usage (menu, événement, promo).</>, label: "Nouvelle page", href: "/dashboard/templates" }
          : null   // « imprimer » : c'est le bloc d'impression, plus bas, qui le porte
        if (!tip) return null
        return <NextStepCard icon={tip.icon} ctaLabel={tip.label} href={tip.href} ton="secondaire">{tip.text}</NextStepCard>
      })()}

      {/* Premiers pas : checklist d'onboarding (tant qu'aucun scan) */}
      {guide && (() => {
        const firstPage = pages[0]
        const steps = [
          { label: "Créer une page", desc: "Partez d'un modèle adapté à votre métier.", done: pages.length > 0, cta: { label: "Créer ma première page", href: "/dashboard/templates", Icon: Plus } },
          { label: "Publier votre page", desc: "Rendez-la accessible via son lien et son QR.", done: publishedCount > 0, cta: firstPage ? { label: "Publier ma page", href: "/dashboard/builder/" + firstPage.id, Icon: Globe } : { label: "Créer une page", href: "/dashboard/templates", Icon: Plus } },
          { label: "Obtenir un premier scan", desc: "Testez ou partagez votre QR pour démarrer le suivi.", done: totalScans > 0, cta: { label: "Tester mon QR code", href: "/dashboard/qr-codes", Icon: QrCode } },
        ]
        const doneN = steps.filter(s => s.done).length
        const current = steps.find(s => !s.done)
        return (
          <section className="qd-carte" style={{ padding: "20px 20px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <p style={{ color: "var(--qd-gold)", fontSize: 12, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", margin: "0 0 4px" }}>Premiers pas</p>
                <h2 style={{ color: "var(--qd-ink)", fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: "-.01em" }}>Lancez votre QRowg en 3 étapes</h2>
              </div>
              <div style={{ textAlign: "right" as const, minWidth: 120 }}>
                <span style={{ color: "var(--qd-ink)", fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{doneN}<span style={{ color: MUTED, fontSize: 14 }}> / {steps.length}</span></span>
                <div style={{ height: 2, width: 120, borderRadius: 2, background: "var(--qd-line)", marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(doneN / steps.length) * 100}%`, background: "var(--qd-gold)" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {steps.map((s, i) => {
                const isCurrent = !s.done && current === s
                // Mobile : on ne montre que l'étape en cours (la barre indique déjà X/3)
                if (isMobile && !isCurrent) return null
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? 10 : 12, padding: "10px 12px", borderRadius: 9,
                    background: isCurrent ? "color-mix(in srgb, var(--accent) 9%, transparent)" : "var(--qd-hover)",
                    border: `1px solid ${isCurrent ? "color-mix(in srgb, var(--accent) 28%, transparent)" : "var(--qd-line-fine)"}` }}>
                    <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                      background: s.done ? "color-mix(in srgb, var(--qd-ok) 18%, transparent)" : "transparent",
                      border: s.done ? "1px solid var(--qd-ok)" : `2px solid ${isCurrent ? "var(--qd-gold)" : "var(--qd-line)"}` }}>
                      {s.done ? <Check size={13} color="var(--qd-ok)" /> : <span style={{ color: isCurrent ? "var(--qd-gold)" : MUTED, fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: s.done ? MUTED : "var(--qd-ink)", fontSize: 14, fontWeight: 600, margin: 0, textDecoration: s.done ? "line-through" : "none" }}>{s.label}</p>
                      {!s.done && <p style={{ color: MUTED, fontSize: 12, margin: "1px 0 0" }}>{s.desc}</p>}
                    </div>
                    {isCurrent && (
                      <Link href={s.cta.href} className="da-btn-primary da-btn-primary--sm qd-btn" style={{ flexShrink: 0, width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                        <s.cta.Icon size={14} strokeWidth={2.5} /> <span>{s.cta.label}</span>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })()}

      {/* 2 · STATISTIQUES — trois colonnes sur une seule surface, des séparateurs
             fins, aucune tendance inventée. Les nombres viennent chacun de leur
             source ; un nombre non lu s'écrit « — », jamais « 0 ». */}
      <section className="qd-carte" aria-label="Chiffres de vos pages">
        <div className="qd-stats">
          {[
            {
              icon: <QrCode size={15} strokeWidth={1.6} />, label: "Scans totaux",
              valeur: texteDeCompte(profile ? totalScans : null), precision: "Depuis le début",
            },
            {
              icon: <BarChart2 size={15} strokeWidth={1.6} />, label: "Vues ce mois",
              valeur: texteDeCompte(monthViews), precision: precisionDesVues(viewsLimit, monthViews),
              alerte: overViews, spark: true,
            },
            {
              icon: <FileText size={15} strokeWidth={1.6} />, label: "Pages créées",
              valeur: texteDeCompte(pagesTotal), precision: phrasePubliees(publiees, pagesTotal),
            },
          ].map((s, i) => (
            <div key={i} className="qd-stat">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ color: MUTED, display: "flex", flexShrink: 0 }}>{s.icon}</span>
                  <span style={{ color: MUTED, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
                </div>
                {s.spark && !isMobile && weekViews.length === 7 && (
                  <div aria-hidden="true" title="7 derniers jours" style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18, flexShrink: 0 }}>
                    {weekViews.map((v, j) => (
                      <div key={j} style={{ width: 3, height: Math.max(2, Math.round((v / maxToday) * 18)), borderRadius: 2, background: j === 6 ? "var(--qd-gold)" : "color-mix(in srgb, var(--accent) 35%, transparent)" }} />
                    ))}
                  </div>
                )}
              </div>
              <p style={{ color: s.alerte ? "var(--danger)" : "var(--qd-ink)", fontSize: 30, fontWeight: 600, margin: "10px 0 0", lineHeight: 1, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>{s.valeur}</p>
              <p style={{ color: MUTED, fontSize: 12, margin: "6px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.precision}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 · MES PAGES — le bloc principal de l'écran. */}
      <section className="qd-carte" aria-label="Mes pages">
        <div className="qd-carte-entete">
          <h2 style={{ color: "var(--qd-ink)", fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: "-.01em" }}>
            Mes pages <span style={{ color: MUTED, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{texteDeCompte(pagesTotal)}</span>
          </h2>
          {/* `minHeight: 44` + marges négatives : la cible se touche au doigt sans
              que le lien grandisse l'en-tête de la carte (procédé de FilDAriane). */}
          {pages.length > 0 && (
            <Link href="/dashboard/qr-codes" className="da-btn-link" style={{ fontSize: 13, minHeight: 44, margin: "-10px 0 -10px auto" }}>
              Tout voir <ArrowRight className="da-ic da-ic-arrow" size={14} />
            </Link>
          )}
        </div>

        {pages.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <span style={{ width: 44, height: 44, margin: "0 auto 12px", borderRadius: 12, background: "var(--qd-hover)", border: "1px solid var(--qd-line)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={20} color="var(--qd-gold)" strokeWidth={1.6} /></span>
            <p style={{ color: "var(--qd-ink)", fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>Aucune page pour l&apos;instant</p>
            <p style={{ color: MUTED, fontSize: 13, margin: "0 0 16px" }}>Créez votre première page à partir d&apos;un modèle.</p>
            <Link href="/dashboard/templates" className="da-btn-ghost da-btn-ghost--sm qd-btn"><span>Choisir un modèle</span></Link>
          </div>
        ) : (
          <div>
            {pages.slice(0, 5).map(page => {
              const pub = page.status === "published"
              const hue = pageHue(page.title || page.slug)
              return (
                <div key={page.id} className="qd-ligne">
                  {/* Miniature : initiale sur une teinte dérivée du titre. Le contour
                      est NEUTRE — l'anneau vert disait « en ligne » sans un mot, et
                      le même vert servait de décor sur les trois autres lignes. */}
                  <div aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 9, background: `hsl(${hue} 22% 20%)`, border: "1px solid var(--qd-line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--qd-ink)", fontWeight: 600, fontSize: 16 }}>
                    {(page.title || page.slug || "?").trim()[0]?.toUpperCase() || "?"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Un nom long revient à la ligne (deux au plus) au lieu d'être
                        coupé net : c'est le nom que le commerçant a écrit. */}
                    <p style={{ color: "var(--qd-ink)", fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.35, overflowWrap: "anywhere", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{page.title || page.slug}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: pub ? "var(--qd-ok)" : MUTED, flexShrink: 0 }}>
                        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: pub ? "var(--qd-ok)" : MUTED }} />{pub ? "En ligne" : "Brouillon"}
                      </span>
                      {/* Le point médian est un SÉPARATEUR : replié sur une ligne à
                          lui, il n'est plus qu'une puce orpheline en début de ligne.
                          Il disparaît donc quand la ligne se replie (globals.css). */}
                      <span aria-hidden="true" className="qd-sep">·</span>
                      <span style={{ color: MUTED, fontSize: 12 }}>{phraseVues(page.total_views)}</span>
                      {relTime(page.created_at) && <>
                        <span aria-hidden="true" className="qd-sep">·</span>
                        <span style={{ color: MUTED, fontSize: 12 }}>créée {relTime(page.created_at)}</span>
                      </>}
                    </div>
                  </div>

                  {/* Action principale de la ligne : secondaire dans l'écran. Un or
                      plein répété cinq fois ne hiérarchise plus rien. */}
                  <Link href={"/dashboard/builder/" + page.id} className="da-btn-neutral da-btn-neutral--sm qd-btn"
                    aria-label={`Modifier ${page.title || page.slug}`} style={{ flexShrink: 0 }}>
                    <Pencil className="da-ic da-ic-edit" size={14} strokeWidth={1.8} />{!isMobile && <span>Modifier</span>}
                  </Link>

                  {/* Menu secondaire (bottom sheet -> echappe l'overflow de la carte) */}
                  <button onClick={() => setMenuPage(page)} aria-label={`Autres actions pour ${page.title || page.slug}`} className="da-btn-icon" style={{ flexShrink: 0, width: 44, height: 44 }}>
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Derniers messages reçus (masqué si aucun) */}
      <RecentLeadsCard />

      {/* 4 · IMPRESSION — sous les pages, et plus discret qu'elles. */}
      <section className="qd-carte" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "18px 20px" }}>
        <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 9, background: "var(--qd-hover)", border: "1px solid var(--qd-line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--qd-gold)" }}>
          <Printer size={18} strokeWidth={1.6} />
        </span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <p style={{ color: "var(--qd-ink)", fontSize: 15, fontWeight: 600, margin: 0 }}>Donnez vie à vos QR codes</p>
          <p style={{ color: MUTED, fontSize: 13, margin: "2px 0 0" }}>Créez un support prêt à imprimer.</p>
        </div>
        <Link href="/dashboard/print-studio" className="da-btn-ghost da-btn-ghost--sm qd-btn" style={{ flexShrink: 0, width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
          <span>Créer un support</span>
        </Link>
      </section>

      {/* 5 · RACCOURCIS SECONDAIRES — et l'offre, quand elle a une raison. */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "repeat(2, minmax(0,1fr))", gap: 16 }}>
        {[
          { icon: <Globe size={16} strokeWidth={1.6} />, label: "Domaines personnalisés", sub: "Votre propre adresse", href: "/dashboard/domains" },
          { icon: <Settings size={16} strokeWidth={1.6} />, label: "Paramètres", sub: "Notifications, mot de passe, compte", href: "/dashboard/settings" },
        ].map(a => (
          <Link key={a.href} href={a.href} className="qd-carte qd-raccourci">
            <span aria-hidden="true" style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 9, background: "var(--qd-hover)", border: "1px solid var(--qd-line)", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>{a.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", color: "var(--qd-ink)", fontSize: 14, fontWeight: 600 }}>{a.label}</span>
              <span style={{ display: "block", color: MUTED, fontSize: 12, marginTop: 2 }}>{a.sub}</span>
            </span>
            <ArrowRight className="da-ic da-ic-arrow" size={15} color={MUTED} />
          </Link>
        ))}
      </div>

      {(() => {
        // L'offre attend d'avoir une raison, et ne promet que les écarts réels
        // entre les deux plans (voir offreUtile.ts).
        const raison = raisonDeProposer({ plan: profile?.plan ?? "free", pages: pages.length, scans: totalScans })
        if (!raison) return null
        const plus = avantagesEnPlus("free", "pro").slice(0, 4)
        return (
          <section className="qd-carte" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "18px 20px" }}>
            <span aria-hidden="true" style={{ flexShrink: 0, color: "var(--qd-gold)", display: "flex" }}><Zap size={18} strokeWidth={1.6} /></span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ color: "var(--qd-ink)", fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{accrocheOffre(raison)}</p>
              <p style={{ color: MUTED, fontSize: 12, margin: "2px 0 0", lineHeight: 1.5 }}>
                {getPlan("pro").label}, {fmtPrice(getPlan("pro").priceMonthly)}€/mois — {plus.join(", ")}
              </p>
            </div>
            <Link href="/upgrade" className="da-btn-neutral da-btn-neutral--sm qd-btn" style={{ flexShrink: 0, width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
              <span>Voir les offres</span> <ArrowRight className="da-ic da-ic-arrow" size={13} />
            </Link>
          </section>
        )
      })()}

      {pageToDelete && (
        <DeleteModal
          page={pageToDelete}
          perte={perte}
          chargement={perteEnCours}
          onConfirm={() => deletePage(pageToDelete)}
          onCancel={() => setPageToDelete(null)}
          deleting={deleting}
        />
      )}

      {/* Menu secondaire d'une page (bottom sheet) — rendu hors de la carte pour ne pas etre clippe */}
      {menuPage && (
        <div onClick={() => setMenuPage(null)} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "var(--qd-hover)", borderTopLeftRadius: 18, borderTopRightRadius: 18, border: "1px solid var(--qd-line)", borderBottom: "none", padding: "10px 12px calc(14px + env(safe-area-inset-bottom))" }}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--qd-line)", margin: "0 auto 10px" }} />
            <p style={{ color: "var(--qd-ink)", fontSize: 14, fontWeight: 600, margin: "0 6px 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{menuPage.title}</p>
            {([
              ...(menuPage.status === "published" ? [{ icon: <ExternalLink size={17} />, label: "Voir la page", onClick: () => { window.open("/" + menuPage.slug, "_blank"); setMenuPage(null) } }] : []),
              { icon: copiedId === menuPage.id ? <Check size={17} color="var(--qd-ok)" /> : <Globe size={17} />, label: copiedId === menuPage.id ? "Lien copié !" : "Copier le lien", onClick: () => copyLink(menuPage) },
              { icon: <Eye size={17} />, label: menuPage.status === "published" ? "Dépublier" : "Publier", onClick: () => { togglePublish(menuPage); setMenuPage(null) } },
              { icon: <Trash2 size={17} color="var(--danger)" />, label: "Supprimer", danger: true, onClick: () => { setPageToDelete(menuPage); setMenuPage(null) } },
            ] as { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }[]).map((a, i) => (
              <button key={i} onClick={a.onClick}
                style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", minHeight: 48, padding: "13px 12px", background: "none", border: "none", borderTop: i ? "1px solid var(--qd-line-fine)" : "none", color: a.danger ? "var(--danger)" : "var(--qd-ink)", fontSize: 15, fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 24, display: "flex", justifyContent: "center", flexShrink: 0 }}>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
