"use client"

// ─────────────────────────────────────────────────────────────────────────────
// QR Studio « ZERO SCROLL » (le Studio QR de tout le monde depuis le 18 nov.).
// Objectif : 3 zones stables (Mes QR / Aperçu / Personnaliser) tenant dans 100dvh,
// personnalisation réduite à Style / Forme / Couleurs / Logo (+ Avancé caché),
// lisibilité AUTOMATIQUE (un seul indicateur), supports déportés vers Atelier d'impression.
// Réutilise les moteurs existants (QRCanvas, presets, qrScannability, qrRender) —
// aucune logique QR réimplémentée. L'ancien QRStudio reste intact (zéro régression).
// ─────────────────────────────────────────────────────────────────────────────
import Vignette from "@/components/Vignette"
import { ButtonLink, Button } from "@/components/ui/Button"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { QrCode, Search, Copy, Check, Download, Printer, Plus, Settings, ChevronDown, PanelLeftClose, PanelLeftOpen, X, AlertTriangle, Trash2, Maximize2, MoreVertical, Archive, RotateCcw, Pencil, ExternalLink, Pause, Play } from "lucide-react"
import { useToast } from "@/components/Toast"
import { Modal } from "@/components/ui/Modal"
import { useFermetureEchap } from "@/components/ui/useDialogue"
import DestinationQr from "./DestinationQr"
import { gestesDuMenu, confirmationDe, phraseApres, changerStatut, supprimerQr, dupliquerQr, type Geste, type GesteDeStatut, type DestEntry } from "./gestesQr"
import QRCanvas from "./QRCanvas"
import { getQRBlob, downloadBlob, buildAndDownloadPdf } from "./qrRender"
import { styleComplet, eccEffectif, useStyleDeRendu } from "./styleDuQr"
import { qrScannability, scanLevelColor } from "./qrScannability"
import { DOT_STYLES, CORNER_STYLE_LIST, DEFAULT_STYLE, type QRStyleConfig, type QRCode } from "./styleQr"
import { PRESETS, PRESET_CATS, canUsePreset, presetUpsellPlan, type Preset } from "./presetsQr"
import { getPlan, pageLimit, type PlanId } from "@/lib/plans"
import { TAILLES_PROPOSEES, phraseTaille } from "./taillePourImpression"
import { ajouterUnSupport, messageDeSupport } from "./ajoutDeSupport"
import { peutAjouterUnSupport, phraseRestants } from "@/lib/supportImprime"
import { verrouDe, reglagesFermes, type Verrou } from "./droitsDuStudio"
import { creerSauvegardeParQr, type EtatDeQr } from "./sauvegardeParQr"
import { effetDe, refusDuServeur } from "@/lib/effetConfirme"
import { useRetenirLaSortie } from "@/lib/useTravailNonEnregistre"
import { empreinte } from "@/lib/travailNonEnregistre"
import { correspondAuxChamps } from "@/lib/rechercheSouple"
import { ecrire, lire, oublier } from "@/lib/memoireDuNavigateur"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { useFermetureModale } from "@/lib/useFermetureModale"
import { phraseCopieEnBrouillon } from "@/lib/qrEnBrouillon"
import { qrAPreselectionner } from "@/lib/qrDeLaPage"
import { fichierDuQr, nomDeLigneQr } from "@/lib/nomDuQr"
import { useHauteurReservee } from "@/lib/hauteurReservee"
import { useIsMobile } from "@/lib/useIsMobile"
import { ActionSheet, type ActionDeFeuille } from "@/components/mobile/ActionSheet"

const G = "var(--accent)"
const INK = "var(--ink)"
const MUTED = "var(--muted)"
const FAINT = "rgba(245,240,232,0.42)"
const SHELL_BG = "#0B0A08"
const SURF = "rgba(255,255,255,0.035)"
const LINE = "rgba(255,255,255,0.08)"



// Mesure d'un conteneur → taille carrée d'aperçu qui s'ajuste (fit-to-view, pas de scroll).
function useFitSize(min = 180, max = 380) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(280)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize(Math.max(min, Math.min(max, Math.floor(Math.min(r.width, r.height) - 8))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [min, max])
  return { ref, size }
}

type Props = { qrCodes: QRCode[]; userPlan: string; appUrl: string }

export default function QRStudioZero({ qrCodes: initialQRCodes, userPlan, appUrl }: Props) {
  // Chaque barre qui reste en haut réserve sa hauteur dans la zone qui défile
  // sous elle : sinon ce qu'on vise au clavier atterrit dessous (lot v143).
  useHauteurReservee()
  const [qrCodes, setQRCodes] = useState<QRCode[]>(initialQRCodes)
  const [activeId, setActiveId] = useState<string | null>(initialQRCodes.find(q => (q.status ?? "active") === "active")?.id ?? initialQRCodes[0]?.id ?? null)
  // Téléphone (≤ 980 px) : « liste » puis « qr ». Sur ordinateur, les trois zones restent côte à côte.
  const [vue, setVue] = useState<"liste" | "qr">("liste")
  // Gérer un QR (étape 1 du Studio compact) : menu « ⋯ », archives, confirmation, destination.
  const toast = useToast()
  const [menuId, setMenuId] = useState<string | null>(null)
  // Au doigt, le menu « ⋯ » est une feuille d'actions ; à la souris, un menu flottant.
  const auDoigt = useIsMobile("md")
  // Le menu est en position FIXE : dans la colonne qui défile, il était rogné (capture du 17 nov.).
  const [menuPos, setMenuPos] = useState<React.CSSProperties>({})
  const [archives, setArchives] = useState(false)
  const [aConfirmer, setAConfirmer] = useState<{ geste: "pause" | "archive" | "supprimer"; qrId: string } | null>(null)
  const [occupeId, setOccupeId] = useState<string | null>(null)
  const [destId, setDestId] = useState<string | null>(null)
  useFermetureEchap(menuId !== null, () => setMenuId(null))
  // Fixé à l'écran, le menu se détacherait de son bouton au défilement : on le ferme.
  // Pas au doigt : la feuille d'actions ne dépend d'aucun bouton, et défiler en
  // elle (ou faire apparaître le clavier) la refermait sous le doigt.
  useEffect(() => {
    if (menuId === null || auDoigt) return
    const fermer = () => setMenuId(null)
    window.addEventListener("scroll", fermer, true)
    window.addEventListener("resize", fermer)
    return () => { window.removeEventListener("scroll", fermer, true); window.removeEventListener("resize", fermer) }
  }, [menuId, auDoigt])
  // `?page=<id>` : arrivée depuis « Afficher le QR à scanner » — on ouvre LE QR de cette page.
  useEffect(() => {
    try {
      const id = qrAPreselectionner(initialQRCodes, new URLSearchParams(window.location.search).get("page"))
      if (id) { setActiveId(id); setVue("qr") }
    } catch { /* adresse illisible : la liste */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [search, setSearch] = useState("")
  const [collapsed, setCollapsed] = useState(false)          // mode focus : replier la colonne Mes QR
  const [fg, setFg] = useState("")
  const [bg, setBg] = useState("")
  const [corner, setCorner] = useState<"square" | "rounded" | "dot">("square")
  const [ecc, setEcc] = useState<"L" | "M" | "Q" | "H">("M")
  const [styleConf, setStyleConf] = useState<QRStyleConfig>({ ...DEFAULT_STYLE })
  // État d'enregistrement PAR QR (voir ./sauvegardeParQr) ; l'écran montre celui du QR ouvert.
  const [etats, setEtats] = useState<Record<string, EtatDeQr>>({})
  // Fenêtre « inclus dès la formule X » : un réglage fermé le dit au lieu de rediriger d'office.
  const [upsell, setUpsell] = useState<Verrou | null>(null)
  const [advOpen, setAdvOpen] = useState(false)
  const [dlOpen, setDlOpen] = useState(false)
  const [dlBusy, setDlBusy] = useState<string | null>(null)
  // Taille de l'image PNG. Le commerçant imprime des centimètres : la phrase
  // sous les boutons dit ce que ces pixels donnent (./taillePourImpression).
  const [taillePx, setTaillePx] = useState<(typeof TAILLES_PROPOSEES)[number]>(1024)
  const [scanOpen, setScanOpen] = useState(false)
  const [gradOpen, setGradOpen] = useState(false)
  const [allPresets, setAllPresets] = useState(false)       // « Voir tout » : bibliothèque complète de presets
  const [fsPreview, setFsPreview] = useState(false)         // aperçu QR plein écran (mode focus)
  // Échap ferme ce qui se ferme en cliquant à côté (lot v139).
  useFermetureModale(dlOpen, () => setDlOpen(false))
  useFermetureModale(allPresets, () => setAllPresets(false))
  useFermetureModale(fsPreview, () => setFsPreview(false))
  const [copied, setCopied] = useState(false)
  const [logoErr, setLogoErr] = useState("")
  // Le style tel que chargé ou dernièrement demandé, par QR : rien d'identique ne repart.
  const chargeRef = useRef<{ qrId: string; emp: string; pret: boolean } | null>(null)
  const logoInput = useRef<HTMLInputElement>(null)
  const { ref: previewBox, size: previewSize } = useFitSize()

  const active = qrCodes.find(q => q.id === activeId) ?? null
  const qrUrl = active ? `${appUrl}/q/${active.short_code}` : ""

  // Restaurer la palette focus persistée (mode focus laptop).
  useEffect(() => { try { if (lire("qrowg-qr-focus") === "1") setCollapsed(true) } catch {} }, [])

  // ── Sauvegarde automatique, sans perte (./sauvegardeParQr) ──
  type Instantane = { fg: string; bg: string; corner: QRCode["corner_style"]; ecc: QRCode["error_correction"]; styleConf: QRStyleConfig }
  const quitteRef = useRef(false)
  const refusRef = useRef<Record<string, { n: number; phrase: string }>>({})
  const corpsDe = (qrId: string, x: Instantane) => JSON.stringify({ qr_id: qrId, foreground_color: x.fg, background_color: x.bg, corner_style: x.corner, error_correction: x.ecc, style_config: x.styleConf })
  const [sauvegarde] = useState(() => creerSauvegardeParQr<Instantane>({
    enregistrer: async (qrId, x) => {
      const corps = corpsDe(qrId, x)
      // En quittant la page, `keepalive` laisse partir la requête (corps < 64 Ko seulement).
      const r = await effetDe("/api/qr-style", { method: "POST", headers: { "Content-Type": "application/json" }, body: corps, keepalive: quitteRef.current && corps.length < 60000 })
      const refus = refusDuServeur(r, "Le style n'a pas pu être enregistré.")
      if (refus) { const n = (refusRef.current[qrId]?.n ?? 0) + 1; refusRef.current[qrId] = { n, phrase: refus }; throw new Error(refus) }
      delete refusRef.current[qrId]
      setQRCodes(prev => prev.map(q => q.id === qrId ? { ...q, foreground_color: x.fg, background_color: x.bg, corner_style: x.corner, error_correction: x.ecc, style_config: x.styleConf } : q))
    },
    onEtat: (qrId, e) => {
      setEtats(prev => ({ ...prev, [qrId]: e }))
      // Le premier échec se réessaie seul ; le second se DIT.
      const r = refusRef.current[qrId]
      if (e === "error" && r && r.n === 2) toast.error(`${r.phrase} Touchez « Réessayer ».`)
    },
  }))
  // Quitter l'écran (lien du menu) ou la page : ce qui attendait part, au lieu d'être perdu.
  // La retenue passe par le crochet partagé (un seul écouteur « beforeunload » dans le
  // produit) : elle ne parle que si quelque chose reste VRAIMENT à enregistrer.
  useRetenirLaSortie(() => {
    quitteRef.current = true
    sauvegarde.vider()
    return !sauvegarde.toutEstEnregistre()
  })
  useEffect(() => {
    const surCacher = () => { quitteRef.current = true; sauvegarde.vider() }
    window.addEventListener("pagehide", surCacher)
    return () => { window.removeEventListener("pagehide", surCacher); sauvegarde.vider() }
  }, [sauvegarde])

  // Charger la config du QR actif (et geler l'autosave le temps du chargement).
  useEffect(() => {
    if (!active) return
    sauvegarde.vider()   // le QR précédent part maintenant, il n'attend pas son délai
    // La même lecture que le Print Studio (./styleDuQr) : un QR se dessine d'une façon.
    const sc = styleComplet(active)
    const charge = empreinte({ fg: active.foreground_color, bg: active.background_color, corner: active.corner_style, ecc: active.error_correction, styleConf: sc })
    // Déjà à l'écran (même style que le QR d'avant) : React ne rerendra pas, on est prêt.
    chargeRef.current = { qrId: active.id, emp: charge, pret: empreinte({ fg, bg, corner, ecc, styleConf }) === charge }
    setFg(active.foreground_color)
    setBg(active.background_color)
    setCorner(active.corner_style)
    setEcc(active.error_correction)
    setStyleConf(sc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  // Sauvegarde AUTOMATIQUE (§12). Le délai vit dans ./sauvegardeParQr : changer de QR
  // ne l'annule plus. On n'enregistre que ce qui DIFFÈRE du dernier état connu — l'ancienne
  // garde (un minuteur à 0 ms) laissait partir une sauvegarde inutile à chaque ouverture.
  useEffect(() => {
    const c = chargeRef.current
    if (!active || c?.qrId !== active.id) return
    const emp = empreinte({ fg, bg, corner, ecc, styleConf })
    if (!c.pret) { if (emp === c.emp) c.pret = true; return }   // le chargement n'est pas encore à l'écran
    if (emp === c.emp) return
    c.emp = emp
    sauvegarde.modifier(active.id, { fg, bg, corner, ecc, styleConf })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fg, bg, corner, ecc, styleConf])

  // Logo : ECC forcé H (le logo masque des modules) + logo COMPOSÉ (forme/fond) au rendu.
  // Règles partagées avec le Print Studio (./styleDuQr, vague 3) : le QR imprimé est celui-ci.
  const effectiveEcc = eccEffectif(styleConf, ecc)
  const renderStyle: QRStyleConfig = useStyleDeRendu(styleConf)

  // Lisibilité AUTOMATIQUE — un seul moteur, un seul indicateur (§16).
  const scan = useMemo(() => qrScannability({
    fg: fg || "#080808", bg: bg || "#FFFFFF", transparent: styleConf.transparent,
    ecc: effectiveEcc, dotStyle: styleConf.dotStyle, hasLogo: !!styleConf.logoUrl,
  }), [fg, bg, styleConf.transparent, effectiveEcc, styleConf.dotStyle, styleConf.logoUrl])
  const scanColor = scanLevelColor(scan.level)
  const risky = scan.level === "risque"

  // Un réglage fermé par la formule ouvre la fenêtre « inclus dès… » ; ouvert, il s'applique.
  function siOuvert(v: Verrou | null, appliquer: () => void) { if (v) setUpsell(v); else appliquer() }
  const verrouDuPreset = (p: Preset): Verrou | null => {
    if (canUsePreset(userPlan, p)) return null
    const plan = presetUpsellPlan(p.plan ?? "") as PlanId
    return { plan, nomDuPlan: getPlan(plan).label, phrase: `Le style « ${p.label} » : inclus dès la formule ${getPlan(plan).label}.` }
  }
  const fermes = reglagesFermes(userPlan, { dotStyle: styleConf.dotStyle, cornerStyle: styleConf.cornerStyle, ecc })

  function applyPreset(p: Preset) {
    const v = verrouDuPreset(p); if (v) { setUpsell(v); return }
    setFg(p.fg); setBg(p.bg)
    if (p.cornerStyle === "rounded" || p.cornerStyle === "circle" || p.cornerStyle === "luxury" || p.dotStyle === "rounded") setCorner("rounded")
    else if (p.dotStyle === "dot" || p.cornerStyle === "minimal") setCorner("dot")
    else setCorner("square")
    if (p.ecc) setEcc(p.ecc)
    setStyleConf(s => ({
      ...s,
      fg2: p.fg2 ?? "", cornerColor: p.cornerColor ?? "", eyeColor: p.eyeColor ?? "",
      gradient: p.gradient ?? "none", gradientBg: p.gradientBg ?? "",
      dotStyle: (p.dotStyle as any) ?? "square", cornerStyle: (p.cornerStyle as any) ?? "square",
      ...(p.silence !== undefined ? { silence: p.silence } : {}),
      ...(p.density !== undefined ? { density: p.density } : {}),
      ...(p.transparent !== undefined ? { transparent: p.transparent } : {}),
    }))
  }
  const presetActive = (p: Preset) => fg.toLowerCase() === p.fg.toLowerCase() && bg.toLowerCase() === p.bg.toLowerCase()

  // Prévention (§14/15 #8) : corriger une combinaison illisible en un clic (noir sur blanc).
  function fixContrast() { setFg("#0A0A0A"); setBg("#FFFFFF"); setStyleConf(s => ({ ...s, transparent: false })) }
  function invert() { setFg(bg || "#FFFFFF"); setBg(fg || "#0A0A0A") }

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return
    setLogoErr("")
    if (!f.type.startsWith("image/")) { setLogoErr("Fichier image requis (PNG, JPG, SVG)."); return }
    if (f.size > 2 * 1024 * 1024) { setLogoErr("Logo trop volumineux (max 2 Mo)."); return }
    const r = new FileReader()
    r.onload = () => setStyleConf(s => ({ ...s, logoUrl: String(r.result), logoSize: Math.min(s.logoSize ?? 18, 22) }))
    r.readAsDataURL(f)
  }

  function filename(ext: string) {
    // Le nom du support d'abord, accents compris (« Café » → « cafe », pas « caf- »).
    return `${fichierDuQr({ label: active?.label, pageTitre: active?.pages?.title, short_code: active?.short_code })}.${ext}`
  }
  async function download(fmt: "png" | "png-t" | "svg" | "pdf") {
    if (!active || risky) return
    const v = verrouDe(userPlan, { type: "format", id: fmt }); if (v) { setUpsell(v); return }
    setDlBusy(fmt)
    try {
      const opts = { data: qrUrl, fg, bg, ecc: effectiveEcc, style: renderStyle, size: taillePx }
      if (fmt === "svg") { const b = await getQRBlob(opts, "svg"); if (b) downloadBlob(b, filename("svg")); else throw new Error("vide") }
      else if (fmt === "pdf") {
        const png = await getQRBlob({ ...opts, size: 1024, style: { ...renderStyle, transparent: false } }, "png")
        if (png) await buildAndDownloadPdf(png, filename("pdf"), { title: active.pages?.title || undefined, url: qrUrl }); else throw new Error("vide")
      } else if (fmt === "png-t") {
        const b = await getQRBlob({ ...opts, style: { ...renderStyle, transparent: true } }, "png"); if (b) downloadBlob(b, filename("png")); else throw new Error("vide")
      } else { const b = await getQRBlob(opts, "png"); if (b) downloadBlob(b, filename("png")); else throw new Error("vide") }
    } catch { toast.error("Le téléchargement n'a pas pu se faire. Réessayez.") }
    setDlBusy(null)
  }

  function copyUrl() { try { navigator.clipboard.writeText(qrUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }
  function toggleFocus() { setCollapsed(v => { const n = !v; try { n ? ecrire("qrowg-qr-focus", "1") : oublier("qrowg-qr-focus") } catch {} ; return n }) }

  // Liste filtrée (archivés masqués) — la colonne ne sert qu'à changer de QR, pas à gérer.
  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return qrCodes
      .filter(x => ((x.status ?? "active") === "archived") === archives)
      .filter(x => correspondAuxChamps([x.label, x.pages?.title, x.short_code], q))
  }, [qrCodes, search, archives])
  const nbArchives = qrCodes.filter(x => x.status === "archived").length

  // ── Gestes sur un QR (appels : ./gestesQr) ──
  const nomDe = (q: QRCode | undefined | null) => q?.pages?.title || q?.short_code || "Ce QR"
  /** Après un départ de la liste (archive, suppression), on ouvre le QR suivant encore visible. */
  function suivantApres(qrId: string, restants: QRCode[]) {
    if (activeId !== qrId) return
    setActiveId(restants.find(x => x.id !== qrId && (x.status ?? "active") !== "archived")?.id ?? null)
    setVue("liste")
  }
  function lancer(q: QRCode, g: Geste) {
    setMenuId(null)
    if (g.cle === "supprimer" || g.confirmer) { setAConfirmer({ geste: g.cle as "pause" | "archive" | "supprimer", qrId: q.id }); return }
    void appliquerStatut(q.id, g.cle)
  }
  async function appliquerStatut(qrId: string, geste: GesteDeStatut) {
    setOccupeId(qrId)
    const r = await changerStatut(qrId, geste)
    setOccupeId(null); setAConfirmer(null)
    if (!r.ok) { toast.error(r.refus); return }
    const apres = qrCodes.map(q => q.id === qrId ? { ...q, status: r.statut as QRCode["status"] } : q)
    setQRCodes(apres)
    if (geste === "archive") suivantApres(qrId, apres)
    toast.success(phraseApres(geste))
  }
  async function supprimer(qrId: string) {
    setOccupeId(qrId)
    const r = await supprimerQr(qrId)
    setOccupeId(null); setAConfirmer(null)
    if (!r.ok) { toast.error(r.refus); return }
    const restants = qrCodes.filter(q => q.id !== qrId)
    setQRCodes(restants)
    suivantApres(qrId, restants)
    toast.success(phraseApres("supprimer"))
  }
  // Un QR de plus vers LA MÊME page : la vitrine, les tables, les flyers. Le
  // quota se dit AVANT l'aller-retour, avec la règle du serveur (pageLimit, lue
  // par initialQrStatus) — l'ancien studio comptait avec qrLimit et pouvait
  // annoncer des places que le serveur n'avait pas.
  async function ajouterSupport(q: QRCode) {
    setMenuId(null)
    if (occupeId || !q.page_id) return
    const v = peutAjouterUnSupport({ actifs: qrCodes.filter(x => (x.status ?? "active") === "active").length, limite: pageLimit(userPlan) })
    if (!v.possible) { toast.error(v.phrase); return }
    setOccupeId(q.id)
    const r = await ajouterUnSupport(q.page_id, q.id)
    setOccupeId(null)
    if (!r.ok) { toast.error(r.phrase); return }
    setQRCodes(prev => [r.qr, ...prev])
    setArchives(false); setActiveId(r.qr.id); setVue("qr")
    // « Il vous reste N » ne se dit que si le support a pris une place.
    const reste = r.brouillon ? null : phraseRestants(v)
    toast.success(reste ? `${messageDeSupport(r)} ${reste}` : messageDeSupport(r))
  }

  async function dupliquer(qrId: string) {
    setMenuId(null)
    if (occupeId) return
    setOccupeId(qrId)
    const r = await dupliquerQr<QRCode>(qrId)
    setOccupeId(null)
    if (!r.ok) { toast.error(r.refus); return }
    setQRCodes(prev => [r.qr, ...prev])
    setArchives(false); setActiveId(r.qr.id); setVue("qr")
    toast.success(r.qr.status === "draft" ? phraseCopieEnBrouillon(userPlan) : "Copie créée, avec sa propre page.")
  }

  // Les entrées du menu « ⋯ » d'un QR — UNE liste, deux présentations : petit
  // menu flottant à la souris, feuille d'actions au doigt (lot 2 « appli »).
  // Les gestes de statut viennent de la machine à états du serveur.
  function entreesDuMenu(q: QRCode): (ActionDeFeuille & { geste?: boolean })[] {
    const icone = (c: string) => c === "pause" ? <Pause size={15} /> : c === "activate" ? <Play size={15} /> : c === "restore" ? <RotateCcw size={15} /> : c === "archive" ? <Archive size={15} /> : <Trash2 size={15} />
    return [
      ...(q.status !== "archived" ? [
        ...(q.page_id ? [{ icone: <Pencil size={15} />, libelle: "Modifier la page", href: `/dashboard/builder/${q.page_id}` }] : []),
        { icone: <ExternalLink size={15} />, libelle: "Où mène ce QR ?", onClick: () => { setMenuId(null); setDestId(q.id) } },
        ...(q.page_id ? [{ icone: <Plus size={15} />, libelle: "Ajouter un support", onClick: () => ajouterSupport(q) }] : []),
        { icone: <Copy size={15} />, libelle: "Dupliquer", onClick: () => dupliquer(q.id) },
      ] : []),
      ...gestesDuMenu(q.status).map(g => ({
        icone: icone(g.cle), libelle: g.libelle, onClick: () => lancer(q, g), geste: true,
        danger: g.ton === "danger", attention: g.ton === "attention",
      })),
    ]
  }

  function menuDe(q: QRCode, ancre: "ligne" | "barre") {
    const ouvert = menuId === `${ancre}:${q.id}`
    const item: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: "0 12px", background: "none", border: "none", borderRadius: 8, color: INK, fontSize: 14, cursor: "pointer", textAlign: "left" }
    return (
      <span style={{ position: "relative", flexShrink: 0 }}>
        <button type="button" aria-label={`Gérer ${nomDe(q)}`} aria-haspopup="menu" aria-expanded={ouvert}
          onClick={e => {
            e.stopPropagation()
            if (ouvert) { setMenuId(null); return }
            if (auDoigt) { setMenuId(`${ancre}:${q.id}`); return }
            // Calé sous le bouton, dans l'écran ; vers le haut si la place manque en bas.
            const r = e.currentTarget.getBoundingClientRect()
            const largeur = Math.min(250, window.innerWidth - 16)
            const left = Math.max(8, Math.min(ancre === "barre" ? r.left : r.right - largeur, window.innerWidth - largeur - 8))
            const enBas = window.innerHeight - r.bottom > 320 || r.top < window.innerHeight / 2
            setMenuPos({ left, width: largeur, ...(enBas ? { top: r.bottom + 4, maxHeight: window.innerHeight - r.bottom - 12 } : { bottom: window.innerHeight - r.top + 4, maxHeight: r.top - 12 }) })
            setMenuId(`${ancre}:${q.id}`)
          }}
          className="qz-cible"
          style={{ width: 40, height: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 9, background: ouvert ? "rgba(255,255,255,0.08)" : "transparent", border: ancre === "barre" ? `1px solid ${LINE}` : "none", color: MUTED, cursor: "pointer" }}>
          {occupeId === q.id ? <span className="mo-spin ui-btn__spin" aria-hidden /> : <MoreVertical size={17} />}
        </button>
        {ouvert && !auDoigt && (
          <div role="menu" onClick={e => e.stopPropagation()} style={{ position: "fixed", ...menuPos, overflowY: "auto", boxSizing: "border-box", zIndex: 120, padding: 5, background: "#1A1710", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)", borderRadius: 12, boxShadow: "0 12px 36px rgba(0,0,0,0.7)" }}>
            {entreesDuMenu(q).map((e, i, tout) => (
              <span key={e.libelle} style={{ display: "contents" }}>
                {e.geste && i > 0 && !tout[i - 1].geste && <div aria-hidden="true" style={{ height: 1, background: LINE, margin: "4px 6px" }} />}
                {e.href
                  ? <a role="menuitem" href={e.href} style={{ ...item, textDecoration: "none" }}>{e.icone} {e.libelle}</a>
                  : <button role="menuitem" type="button" onClick={e.onClick}
                      style={{ ...item, color: e.danger ? "var(--danger)" : e.attention ? "#F5B74A" : INK }}>{e.icone} {e.libelle}</button>}
              </span>
            ))}
          </div>
        )}
      </span>
    )
  }

  const status: EtatDeQr = active ? (etats[active.id] ?? "idle") : "idle"
  const enCours = status === "attente" || status === "saving"
  const statusText = enCours ? "Enregistrement…" : status === "error" ? "Non enregistré" : "Enregistré"
  const statusColor = status === "error" ? "var(--danger)" : enCours ? MUTED : "var(--success)"

  // Presets recommandés d'abord (catégorie détectée) puis le reste, limité pour rester compact.
  const detectedCat = useMemo(() => {
    const blob = `${active?.pages?.title ?? ""} ${active?.pages?.slug ?? ""}`.toLowerCase()
    const KW: Record<string, string[]> = {
      restaurant: ["resto", "restaurant", "pizz", "bistro", "cafe", "café", "menu", "burger", "sushi", "brasserie"],
      business: ["agence", "consult", "avocat", "cabinet", "finance", "immo", "corporate", "coach", "salon", "barber"],
      creator: ["photo", "studio", "portfolio", "artist", "design", "insta", "music", "podcast", "beauty", "tattoo"],
      tech: ["tech", "dev", "app", "saas", "crypto", "startup", "gaming", "digital"],
      event: ["mariage", "wedding", "event", "gala", "concert", "festival", "soiree", "club"],
      luxury: ["luxe", "luxury", "premium", "bijou", "prestige", "spa"],
    }
    for (const [cat, words] of Object.entries(KW)) if (words.some(w => blob.includes(w))) return cat
    return "classic"
  }, [active])
  const stylePresets = useMemo(() => {
    const reco = PRESETS.filter(p => p.cat === detectedCat)
    const rest = PRESETS.filter(p => p.cat !== detectedCat)
    return [...reco, ...rest].slice(0, 6)
  }, [detectedCat])

  const leftW = collapsed ? "0px" : "clamp(210px, 17vw, 244px)"

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", color: INK }}>
      <style>{`
        .qz-shell { height: calc(100dvh - 66px - 40px); }
        .qz-col::-webkit-scrollbar { width: 8px }
        .qz-col::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px }
        .qz-row { transition: background var(--mo-fast,.12s) var(--mo-ease-standard,ease), border-color var(--mo-fast,.12s) }
        .qz-row:hover { background: rgba(255,255,255,0.04) }
        .qz-preset { transition: transform var(--mo-fast,.12s) var(--mo-ease-standard,ease), border-color var(--mo-fast,.12s) }
        .qz-preset:hover { transform: translateY(-2px) }
        .qz-row:focus-visible, .qz-preset:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }
        @media (prefers-reduced-motion: reduce) { .qz-preset:hover { transform: none } }
        .qz-retour { display: none }
        @media (max-width: 980px) {
          .qz-shell { height: auto }
          /* minmax(0,1fr) : « 1fr » s'élargissait au contenu (395 px pour 342) — tout débordait à gauche. */
          .qz-grid { grid-template-columns: minmax(0, 1fr) !important }
          .qz-center { order: 1; min-height: 0 }
          .qz-right { order: 2; overflow: visible !important; border-left: none !important; border-top: 1px solid ${LINE} }
          .qz-aside { order: 3; display: flex !important; border-right: none !important }
          .qz-barre { flex-wrap: wrap }
          .qz-focus { display: none !important }
          .qz-retour { display: inline-flex }
          /* Deux écrans : la liste, OU le QR ouvert. */
          .qz-shell[data-vue="liste"] .qz-center, .qz-shell[data-vue="liste"] .qz-right { display: none !important }
          .qz-shell[data-vue="qr"] .qz-aside { display: none !important }
          .qz-row { min-height: 56px; gap: 8px !important; margin-bottom: 8px !important }
          /* Au doigt : 44 px partout, et 16 px dans le champ pour qu'iOS ne zoome pas. */
          .qz-cible { width: 44px !important; height: 44px !important }
          .qz-recherche { height: 44px !important; font-size: 16px !important }
          /* Rien ne dépasse de la colonne : les actions passent sous le retour, pleine largeur,
             et les noms de style se coupent proprement au lieu d'élargir la grille. */
          .qz-center, .qz-right, .qz-right > div { min-width: 0 }
          .qz-barre > div:last-child { margin-left: 0 !important; width: 100%; }
          .qz-barre > div:last-child > * { flex: 1 1 0; justify-content: center }
          .qz-preset { min-width: 0; overflow: hidden }
          .qz-preset * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
        }
      `}</style>

      <div className="qz-shell qz-grid" data-vue={vue} style={{ display: "grid", gridTemplateColumns: `${leftW} minmax(0,1fr) clamp(300px, 24vw, 344px)`, gap: 0, background: SHELL_BG, border: `1px solid ${LINE}`, borderRadius: 16, overflow: "hidden" }}>

        {/* ── GAUCHE — MES QR ─────────────────────────────────────────── */}
        <aside className="qz-col qz-aside" style={{ borderRight: `1px solid ${LINE}`, display: collapsed ? "none" : "flex", flexDirection: "column", minHeight: 0, background: "rgba(0,0,0,0.18)" }}>
          <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: MUTED, textTransform: "uppercase" }}>{archives ? "Archives" : "Mes QR"}</span>
                {(nbArchives > 0 || archives) && (
                  <button type="button" onClick={() => { setArchives(a => !a); setMenuId(null) }} aria-pressed={archives} className={"da-pill" + (archives ? " on" : "")} style={{ minHeight: 30, fontSize: 11.5 }}>
                    {archives ? "← Mes QR" : <><Archive size={12} /> Archives ({nbArchives})</>}
                  </button>
                )}
              </span>
              <Link href="/dashboard/templates" title="Nouveau QR" aria-label="Nouveau QR" className="qz-cible" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 8, background: "color-mix(in srgb, var(--accent) 14%, transparent)", border: `1px solid color-mix(in srgb, var(--accent) 30%, transparent)`, color: G }}><Plus size={15} /></Link>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={13} color={FAINT} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher un QR" className="qz-recherche" style={{ width: "100%", boxSizing: "border-box", height: 34, padding: "0 10px 0 30px", background: SURF, border: `1px solid ${LINE}`, borderRadius: 9, color: INK, fontSize: 12.5, outline: "none" }} />
            </div>
          </div>
          <div className="qz-col" style={{ flex: 1, overflowY: "auto", padding: "0 8px 10px", minHeight: 0 }}>
            {list.map(q => {
              const on = q.id === activeId
              return (
                <div key={q.id} className="qz-row" style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 3, borderRadius: 10, background: on ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent", border: `1px solid ${on ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "transparent"}` }}>
                <button type="button" onClick={() => { setActiveId(q.id); setVue("qr"); setMenuId(null) }} style={{ flex: 1, minWidth: 0, alignSelf: "stretch", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "none", border: "none", borderRadius: 10, cursor: "pointer", textAlign: "left", color: "inherit" }}>
                  {/* Pastille légère (PAS de moteur QR par ligne — cf. perfs mobile). */}
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: q.background_color || "#fff", border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}><QrCode size={16} color={q.foreground_color || "var(--field)"} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: on ? INK : "#D9D3C7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nomDeLigneQr(q)}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: FAINT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {q.status === "paused" ? <span style={{ color: "#F5B74A" }}>En pause · </span> : q.status === "draft" ? <span style={{ color: "var(--accent)" }}>Brouillon · </span> : null}
                      {q.dest_override ? "Redirigé" : q.pages ? "Page" : "Lien"} · {q.short_code}
                    </span>
                  </span>
                  {(q.status ?? "active") === "active" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />}
                </button>
                {menuDe(q, "ligne")}
                </div>
              )
            })}
            {list.length === 0 && <p style={{ color: FAINT, fontSize: 12, textAlign: "center", padding: "16px 8px" }}>{archives ? "Aucun QR archivé." : "Aucun QR."}</p>}
          </div>
        </aside>

        {/* ── CENTRE — APERÇU ─────────────────────────────────────────── */}
        <section className="qz-center" style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          {/* Barre d'action (autosave + sorties) — pas de toolbar chargée. */}
          <div className="qz-barre" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
            {/* Téléphone : retour à la liste (la barre latérale n'existe pas). */}
            <button type="button" className="qz-retour" onClick={() => setVue("liste")} style={{ alignItems: "center", gap: 6, minHeight: 44, padding: "0 8px 0 0", background: "none", border: "none", color: MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Mes QR</button>
            <button type="button" className="qz-focus" onClick={toggleFocus} title={collapsed ? "Afficher mes QR" : "Masquer mes QR (mode focus)"} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "transparent", border: `1px solid ${LINE}`, color: MUTED, cursor: "pointer" }}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button>
            {active && menuDe(active, "barre")}
            {active && <button type="button" onClick={() => setFsPreview(true)} title="Aperçu plein écran" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "transparent", border: `1px solid ${LINE}`, color: MUTED, cursor: "pointer" }}><Maximize2 size={15} /></button>}
            <span style={{ fontSize: 11.5, color: statusColor, display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
              {enCours ? <span className="mo-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: MUTED }} /> : status === "error" ? <AlertTriangle size={13} /> : <Check size={13} />}{active ? statusText : ""}
              {status === "error" && active && <button type="button" onClick={() => sauvegarde.reessayer(active.id)} style={{ minHeight: 32, padding: "0 6px", background: "none", border: "none", color: "var(--danger)", textDecoration: "underline", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>Réessayer</button>}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
              <ButtonLink href={`/dashboard/print-studio${active ? `?qr=${active.short_code}` : ""}`} variant="secondary" size="sm"><Printer size={14} /> Créer un support</ButtonLink>
              <button type="button" onClick={() => setDlOpen(true)} disabled={!active} className="da-btn-primary da-btn-primary--sm"><Download className="da-ic da-ic-dl" size={14} /> <span>Télécharger</span></button>
            </div>
          </div>

          {/* Résultat dominant : QR + nom + destination + UNE ligne de lisibilité. */}
          {active ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 20, minHeight: 0 }}>
              <div ref={previewBox} style={{ flex: 1, width: "100%", maxWidth: 460, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
                <div style={{ padding: 18, background: bg || "#fff", borderRadius: 20, boxShadow: "0 18px 50px rgba(0,0,0,0.45)", lineHeight: 0 }}>
                  <QRCanvas value={qrUrl} size={previewSize} fg={fg || "#080808"} bg={bg || "#FFFFFF"} ecc={effectiveEcc} style={renderStyle} />
                </div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: INK, margin: "0 0 2px" }}>{active.pages?.title || active.short_code}</p>
                <button type="button" onClick={copyUrl} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: MUTED, fontSize: 12, cursor: "pointer", fontFamily: "ui-monospace, monospace" }}>{qrUrl.replace(/^https?:\/\//, "")} {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}</button>
              </div>
              {/* Indicateur UNIQUE de lisibilité (§16) — détails au clic. */}
              <div style={{ flexShrink: 0, width: "100%", maxWidth: 460 }}>
                <button type="button" onClick={() => setScanOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 13px", borderRadius: 11, background: `color-mix(in srgb, ${scanColor} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${scanColor} 30%, transparent)`, color: INK, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: scanColor, flexShrink: 0, boxShadow: `0 0 8px ${scanColor}` }} />
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: scanColor }}>{scan.label}</span>
                  {risky && <span onClick={e => { e.stopPropagation(); fixContrast() }} style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-on-accent)", background: scanColor, borderRadius: 7, padding: "4px 9px" }}>Corriger</span>}
                  <ChevronDown size={15} color={MUTED} style={{ transform: scanOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
                </button>
                {scanOpen && (
                  <div className="mo-fade-up" style={{ marginTop: 8, padding: "10px 13px", background: SURF, border: `1px solid ${LINE}`, borderRadius: 11, fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>
                    <p style={{ margin: "0 0 6px", color: INK, fontWeight: 700 }}>Diagnostic {scan.contrast != null ? `· contraste ${scan.contrast.toFixed(1)}:1` : ""} · correction {effectiveEcc}{styleConf.logoUrl ? " (auto pour logo)" : ""}</p>
                    {scan.advices.length ? <ul style={{ margin: 0, paddingLeft: 16 }}>{scan.advices.map((a, i) => <li key={i} style={{ marginBottom: 3 }}>{a}</li>)}</ul> : <p style={{ margin: 0 }}>Contraste, structure et marges conformes : ce QR devrait se lire sans difficulté.</p>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: MUTED, padding: 24, textAlign: "center" }}>
              <QrCode size={40} color={FAINT} />
              <p style={{ margin: 0, fontSize: 14 }}>{qrCodes.length ? "Choisissez un QR à gauche." : "Créez votre première page pour obtenir un QR."}</p>
              {!qrCodes.length && <ButtonLink href="/dashboard/templates" variant="secondary" size="sm">Nouvelle page + QR</ButtonLink>}
            </div>
          )}
        </section>

        {/* ── DROITE — PERSONNALISER ──────────────────────────────────── */}
        <aside className="qz-col qz-right" style={{ borderLeft: `1px solid ${LINE}`, display: active ? "flex" : "none", flexDirection: "column", minHeight: 0, overflowY: "auto", background: "rgba(0,0,0,0.12)" }}>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* STYLE */}
            <section>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                <h3 style={{ ...secH, margin: 0 }}>Style</h3>
                <button type="button" onClick={() => setAllPresets(true)} style={{ background: "none", border: "none", color: MUTED, fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>Voir tout</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {stylePresets.map(p => {
                  const locked = !canUsePreset(userPlan, p)
                  const on = presetActive(p)
                  const dotR = p.dotStyle === "dot" ? "50%" : p.dotStyle === "rounded" ? "34%" : "2px"
                  return (
                    <button key={p.id} type="button" onClick={() => applyPreset(p)} className="qz-preset" title={p.label} style={{ position: "relative", padding: 8, borderRadius: 11, cursor: "pointer", background: p.bg, border: `2px solid ${on ? G : "transparent"}`, boxShadow: on ? `0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent)` : "none", opacity: locked ? 0.55 : 1 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, width: 30, height: 30, margin: "0 auto" }}>
                        {Array.from({ length: 9 }).map((_, i) => <span key={i} style={{ background: [0, 2, 4, 6, 8, 3, 5].includes(i) ? p.fg : "transparent", borderRadius: dotR }} />)}
                      </div>
                      <span style={{ display: "block", marginTop: 6, fontSize: 11.5, fontWeight: 700, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{p.label}</span>
                      {locked && <span style={{ position: "absolute", top: 4, right: 4, fontSize: 11.5, fontWeight: 700, color: G, background: "rgba(0,0,0,0.6)", borderRadius: 5, padding: "1px 4px" }}>{verrouDuPreset(p)?.nomDuPlan}</span>}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* FORME */}
            <section>
              <h3 style={secH}>Forme</h3>
              <p style={miniLabel}>Modules</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {DOT_STYLES.slice(0, 6).map(d => {
                  const on = (styleConf.dotStyle ?? "square") === d.id
                  const v = verrouDe(userPlan, { type: "module", id: d.id ?? "square" })
                  return <button key={d.id} type="button" onClick={() => siOuvert(v, () => setStyleConf(s => ({ ...s, dotStyle: d.id })))} title={v ? `${d.label} · ${v.nomDuPlan}` : d.label} aria-label={v ? `${d.label} (formule ${v.nomDuPlan})` : d.label} style={{ ...shapeBtn(on), position: "relative", opacity: v ? 0.55 : 1 }}>{d.emoji}{v && <Cadenas />}</button>
                })}
              </div>
              <p style={miniLabel}>Coins</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CORNER_STYLE_LIST.map(c => {
                  const on = (styleConf.cornerStyle ?? "square") === c.id
                  const g = c.id === "circle" ? "◉" : c.id === "rounded" ? "▢" : c.id === "diamond" ? "◈" : c.id === "luxury" ? "❖" : c.id === "minimal" ? "▫" : "■"
                  const v = verrouDe(userPlan, { type: "coin", id: c.id ?? "square" })
                  return <button key={c.id} type="button" onClick={() => siOuvert(v, () => setStyleConf(s => ({ ...s, cornerStyle: c.id })))} title={v ? `${c.label} · ${v.nomDuPlan}` : c.label} aria-label={v ? `${c.label} (formule ${v.nomDuPlan})` : c.label} style={{ ...shapeBtn(on), position: "relative", opacity: v ? 0.55 : 1 }}>{g}{v && <Cadenas />}</button>
                })}
              </div>
              {/* Style gardé d'avant (formule baissée, modèle appliqué) : dit, pas effacé. */}
              {fermes.length > 0 && <p style={{ margin: "8px 0 0", fontSize: 11.5, color: MUTED, lineHeight: 1.45 }}>Ce QR garde un réglage de la formule {fermes[0].nomDuPlan}. Il reste tel quel ; un nouveau choix se fait parmi les styles de votre formule.</p>}
            </section>

            {/* COULEURS */}
            <section>
              <h3 style={secH}>Couleurs</h3>
              <ColorRow label="QR" value={fg || "#0A0A0A"} onChange={setFg} />
              <ColorRow label="Fond" value={bg || "#FFFFFF"} onChange={setBg} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                <button type="button" onClick={invert} style={{ background: "none", border: "none", color: G, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>Inverser</button>
                <button type="button" onClick={() => setGradOpen(o => !o)} style={{ background: "none", border: "none", color: MUTED, fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>{gradOpen || (styleConf.gradient && styleConf.gradient !== "none") ? "− Dégradé" : "+ Dégradé"}</button>
              </div>
              {/* Palettes recommandées (contraste élevé) */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                {PALETTES.map(([pfg, pbg]) => {
                  const on = fg.toLowerCase() === pfg.toLowerCase() && bg.toLowerCase() === pbg.toLowerCase()
                  return <button key={pfg + pbg} type="button" onClick={() => { setFg(pfg); setBg(pbg) }} title="Palette" style={{ width: 30, height: 30, borderRadius: 8, cursor: "pointer", background: pbg, border: `2px solid ${on ? G : LINE}`, position: "relative", flexShrink: 0 }}><span style={{ position: "absolute", inset: 6, borderRadius: 4, background: pfg }} /></button>
                })}
              </div>
              {(gradOpen || (styleConf.gradient && styleConf.gradient !== "none")) && (
                <div className="mo-fade-up" style={{ marginTop: 12, padding: 10, background: SURF, border: `1px solid ${LINE}`, borderRadius: 10 }}>
                  <p style={miniLabel}>Type de dégradé</p>
                  <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 3, marginBottom: 8 }}>
                    {(["none", "linear", "radial", "diagonal"] as const).map(gt => <Button key={gt} type="button" onClick={() => setStyleConf(s => ({ ...s, gradient: gt }))} variant="secondary" size="sm">{gt === "none" ? "Aucun" : gt === "linear" ? "Linéaire" : gt === "radial" ? "Radial" : "Diagonal"}</Button>)}
                  </div>
                  {styleConf.gradient && styleConf.gradient !== "none" && <ColorRow label="2ᵉ ton" value={styleConf.fg2 || fg || "#0A0A0A"} onChange={v => setStyleConf(s => ({ ...s, fg2: v }))} />}
                </div>
              )}
            </section>

            {/* LOGO */}
            <section>
              <h3 style={secH}>Logo</h3>
              <input ref={logoInput} type="file" aria-label="Importer un logo" accept="image/*" onChange={onLogoFile} style={{ display: "none" }} />
              {styleConf.logoUrl ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Vignette src={styleConf.logoUrl} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "contain", background: "#fff", border: `1px solid ${LINE}` }} />
                    <button type="button" onClick={() => logoInput.current?.click()} style={{ ...smallBtn, flex: 1 }}>Remplacer</button>
                    <button type="button" onClick={() => setStyleConf(s => ({ ...s, logoUrl: "" }))} title="Retirer" style={{ ...smallBtn, width: 34, padding: 0, color: "var(--danger)" }}><Trash2 size={14} /></button>
                  </div>
                  <p style={miniLabel}>Taille — plafonnée pour rester lisible</p>
                  <input type="range" min={10} max={22} step={1} aria-label="Taille du logo" value={styleConf.logoSize ?? 18} onChange={e => setStyleConf(s => ({ ...s, logoSize: Number(e.target.value) }))} style={{ width: "100%", accentColor: "var(--accent)" }} />
                  <p style={{ ...miniLabel, marginTop: 8 }}>Forme</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["square", "rounded", "circle"] as const).map(sh => <button key={sh} type="button" onClick={() => setStyleConf(s => ({ ...s, logoShape: sh }))} style={shapeBtn((styleConf.logoShape ?? "rounded") === sh)}>{sh === "circle" ? "●" : sh === "rounded" ? "▢" : "■"}</button>)}
                  </div>
                </>
              ) : (
                <Button type="button" onClick={() => logoInput.current?.click()} size="sm" fullWidth>+ Ajouter un logo</Button>
              )}
              {logoErr && <p {...propsAnnonce("erreur")} style={{ margin: "6px 0 0", fontSize: 11, color: "var(--danger)" }}>{logoErr}</p>}
            </section>

            {/* AVANCÉ (drawer discret) */}
            <div>
              <button type="button" onClick={() => setAdvOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "9px 0", background: "none", border: "none", borderTop: `1px solid ${LINE}`, color: MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Settings size={14} /> Réglages avancés <ChevronDown size={14} style={{ marginLeft: "auto", transform: advOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </button>
              {advOpen && (
                <div className="mo-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 6 }}>
                  <div>
                    <p style={miniLabel}>Correction d'erreur</p>
                    <div style={{ display: "flex", gap: 4, background: SURF, borderRadius: 9, padding: 3 }}>
                      {(["L", "M", "Q", "H"] as const).map(l => {
                        const v = verrouDe(userPlan, { type: "correction", id: l })
                        return <Button key={l} type="button" aria-pressed={ecc === l} onClick={() => siOuvert(v, () => setEcc(l))} variant={ecc === l ? "primary" : "secondary"} size="sm" title={v ? `Formule ${v.nomDuPlan}` : undefined}>{l}{v ? " 🔒" : ""}</Button>
                      })}
                    </div>
                  </div>
                  <div>
                    {/* Le curseur 0–30 réglait `margin`, que le moteur ne lit plus : il ne
                        changeait rien. La marge vit en MODULES (`silence`, norme : 4). */}
                    <p style={miniLabel}>Marge blanche autour du QR</p>
                    <div role="radiogroup" aria-label="Marge blanche" style={{ display: "flex", gap: 6 }}>
                      {([["Normale", 4], ["Large", 6]] as const).map(([lbl, val]) => {
                        const on = ((styleConf.silence ?? 4) > 5 ? 6 : 4) === val
                        return <Button key={lbl} type="button" role="radio" aria-checked={on} onClick={() => setStyleConf(s => ({ ...s, silence: val }))} variant={on ? "primary" : "secondary"} size="sm">{lbl}</Button>
                      })}
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: INK, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!styleConf.transparent} onChange={e => setStyleConf(s => ({ ...s, transparent: e.target.checked }))} style={{ accentColor: "var(--accent)" }} /> Fond transparent
                  </label>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── MODALE TÉLÉCHARGER (§10) — sortie simple ─────────────────── */}
      {dlOpen && (
        <div onClick={() => setDlOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="mo-pop-in" style={{ width: "100%", maxWidth: 380, background: SHELL_BG, border: `1px solid ${LINE}`, borderRadius: 18, padding: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Télécharger votre QR</h3>
              <button aria-label="Fermer" type="button" onClick={() => setDlOpen(false)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }}><X size={18} /></button>
            </div>
            {risky ? (
              <div style={{ margin: "10px 0", padding: "12px 14px", borderRadius: 12, background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: 12.5, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Ce QR risque de ne pas être lu. <button type="button" onClick={() => { fixContrast(); }} style={{ background: "none", border: "none", color: "var(--danger)", textDecoration: "underline", cursor: "pointer", fontWeight: 700, padding: 0 }}>Corriger automatiquement</button> avant de télécharger.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
                <div role="group" aria-label="Taille de l'image PNG">
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: MUTED }}>Taille de l&apos;image PNG</p>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${TAILLES_PROPOSEES.length}, minmax(0, 1fr))`, gap: 6 }}>
                    {TAILLES_PROPOSEES.map(t => (
                      <button key={t} type="button" aria-pressed={taillePx === t} onClick={() => setTaillePx(t)}
                        style={{ minHeight: 44, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                          background: taillePx === t ? "color-mix(in srgb, var(--accent) 14%, transparent)" : SURF,
                          border: `1px solid ${taillePx === t ? G : LINE}`, color: taillePx === t ? INK : MUTED }}>
                        {t} px
                      </button>
                    ))}
                  </div>
                  <p style={{ margin: "6px 0 2px", fontSize: 12, color: MUTED, lineHeight: 1.4 }}>Soit {phraseTaille(taillePx)}.</p>
                </div>
                {([["png", "PNG", "Web, documents, présentations"], ["png-t", "PNG fond transparent", "Superposition sur un visuel"], ["svg", "SVG", "Vectoriel, qualité illimitée"], ["pdf", "PDF", "Impression simple"]] as const).map(([fmt, label, sub]) => (
                  (() => {
                    const v = verrouDe(userPlan, { type: "format", id: fmt })
                    return (
                  <button key={fmt} type="button" onClick={() => v ? (setDlOpen(false), setUpsell(v)) : download(fmt)} disabled={!!dlBusy} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 12, background: SURF, border: `1px solid ${LINE}`, color: v ? MUTED : INK, cursor: "pointer", textAlign: "left" }}>
                    <Download size={16} color={v ? MUTED : G} />
                    <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{label}</span><span style={{ display: "block", fontSize: 11.5, color: MUTED }}>{sub}</span></span>
                    {v && <span style={{ fontSize: 11.5, fontWeight: 700, color: G, whiteSpace: "nowrap" }}>Dès {v.nomDuPlan}</span>}
                    {dlBusy === fmt && <span className="mo-pulse" style={{ fontSize: 11, color: MUTED }}>…</span>}
                  </button>
                    )
                  })()
                ))}
              </div>
            )}
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}><Check size={13} /> Lisibilité vérifiée automatiquement</p>
          </div>
        </div>
      )}

      {/* ── BIBLIOTHÈQUE COMPLÈTE DE STYLES (§P1.1 « Voir tout ») ─────── */}
      {allPresets && (
        <div onClick={() => setAllPresets(false)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="mo-pop-in qz-col" style={{ width: "100%", maxWidth: 560, maxHeight: "80vh", overflowY: "auto", background: SHELL_BG, border: `1px solid ${LINE}`, borderRadius: 18, padding: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
            <div data-barre-collante="" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "sticky", top: 0, background: SHELL_BG }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Tous les styles</h3>
              <button aria-label="Fermer" type="button" onClick={() => setAllPresets(false)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }}><X size={18} /></button>
            </div>
            {PRESET_CATS.map(cat => {
              const inCat = PRESETS.filter(p => p.cat === cat.id)
              if (!inCat.length) return null
              return (
                <div key={cat.id} style={{ marginBottom: 16 }}>
                  <p style={{ ...miniLabel, marginBottom: 8 }}>{cat.emoji} {cat.label}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                    {inCat.map(p => {
                      const locked = !canUsePreset(userPlan, p)
                      const on = presetActive(p)
                      const dotR = p.dotStyle === "dot" ? "50%" : p.dotStyle === "rounded" ? "34%" : "2px"
                      return (
                        <button key={p.id} type="button" onClick={() => { applyPreset(p); if (canUsePreset(userPlan, p)) setAllPresets(false) }} className="qz-preset" title={p.label} style={{ position: "relative", padding: 8, borderRadius: 11, cursor: "pointer", background: p.bg, border: `2px solid ${on ? G : "transparent"}`, opacity: locked ? 0.55 : 1 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, width: 28, height: 28, margin: "0 auto" }}>
                            {Array.from({ length: 9 }).map((_, i) => <span key={i} style={{ background: [0, 2, 4, 6, 8, 3, 5].includes(i) ? p.fg : "transparent", borderRadius: dotR }} />)}
                          </div>
                          <span style={{ display: "block", marginTop: 5, fontSize: 11.5, fontWeight: 700, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{p.label}</span>
                          {locked && <span style={{ position: "absolute", top: 4, right: 4, fontSize: 11.5, fontWeight: 700, color: G, background: "rgba(0,0,0,0.6)", borderRadius: 5, padding: "1px 4px" }}>{verrouDuPreset(p)?.nomDuPlan}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Téléphone : le menu « ⋯ » est LA feuille d'actions du produit. */}
      {auDoigt && (() => {
        const q = menuId ? qrCodes.find(x => menuId.endsWith(`:${x.id}`)) : undefined
        return <ActionSheet open={!!q} titre={q ? nomDe(q) : ""} onFermer={() => setMenuId(null)} actions={q ? entreesDuMenu(q) : []} />
      })()}
      {menuId !== null && !auDoigt && <div aria-hidden="true" onClick={() => setMenuId(null)} style={{ position: "fixed", inset: 0, zIndex: 110 }} />}

      {upsell && (
        <Modal open onClose={() => setUpsell(null)} title={`Inclus dès la formule ${upsell.nomDuPlan}`}
          footer={<>
            <Button variant="ghost" onClick={() => setUpsell(null)}>Plus tard</Button>
            <ButtonLink href={`/upgrade?plan=${upsell.plan}`} variant="primary">Voir la formule {upsell.nomDuPlan}</ButtonLink>
          </>}>
          {upsell.phrase} Votre QR et vos réglages actuels restent tels quels.
        </Modal>
      )}

      {aConfirmer && (() => {
        const q = qrCodes.find(x => x.id === aConfirmer.qrId)
        const c = confirmationDe(aConfirmer.geste, nomDe(q))
        const occupe = occupeId === aConfirmer.qrId
        return (
          <Modal open onClose={() => { if (!occupe) setAConfirmer(null) }} title={c.titre}
            footer={<>
              <Button variant="ghost" onClick={() => setAConfirmer(null)} disabled={occupe}>Annuler</Button>
              <Button variant={c.destructif ? "danger" : "primary"} loading={occupe}
                onClick={() => aConfirmer.geste === "supprimer" ? supprimer(aConfirmer.qrId) : appliquerStatut(aConfirmer.qrId, aConfirmer.geste)}>
                {c.verbe}
              </Button>
            </>}>
            {c.texte}
          </Modal>
        )
      })()}

      {destId && (() => {
        const q = qrCodes.find(x => x.id === destId)
        if (!q) return null
        return (
          <DestinationQr open onClose={() => setDestId(null)} qrId={q.id}
            nomDeLaPage={q.pages?.title || "Votre page"} urlDeLaPage={q.pages ? `${appUrl}/${q.pages.slug}` : `${appUrl}/q/${q.short_code}`}
            etat={{ dest_override: (q.dest_override ?? null) as DestEntry | null, dest_history: (q.dest_history ?? []) as DestEntry[] }}
            onEtat={e => setQRCodes(prev => prev.map(x => x.id === q.id ? { ...x, dest_override: e.dest_override, dest_history: e.dest_history } : x))}
            onSucces={t => toast.success(t)} />
        )
      })()}

      {/* ── APERÇU PLEIN ÉCRAN (§P0.3 mode focus) ────────────────────── */}
      {fsPreview && active && (
        <div onClick={() => setFsPreview(false)} style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
          <button type="button" onClick={() => setFsPreview(false)} aria-label="Fermer" style={{ position: "absolute", top: 20, right: 20, width: 42, height: 42, borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
          <div onClick={e => e.stopPropagation()} style={{ padding: 26, background: bg || "#fff", borderRadius: 24, lineHeight: 0, boxShadow: "0 24px 70px rgba(0,0,0,0.55)" }}>
            <QRCanvas value={qrUrl} size={Math.min(460, typeof window !== "undefined" ? Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.62) : 360)} fg={fg || "#080808"} bg={bg || "#FFFFFF"} ecc={effectiveEcc} style={renderStyle} />
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>{active.pages?.title || active.short_code} · <span style={{ color: scanColor }}>{scan.label}</span></p>
        </div>
      )}
    </div>
  )
}

// Palettes recommandées — paires à contraste élevé.
const PALETTES: [string, string][] = [
  ["#0A0A0A", "#FFFFFF"], ["#1E3A5F", "#FFFFFF"], ["#B91C1C", "#FFF7ED"],
  ["#047857", "#ECFDF5"], ["#4F46E5", "#FFFFFF"], ["#C9A84C", "#0A0A0A"], ["#2D2D2D", "#F5F0E8"],
]
const secH: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: INK, margin: "0 0 10px" }
const miniLabel: React.CSSProperties = { margin: "0 0 6px", fontSize: 11.5, fontWeight: 600, color: MUTED }
const smallBtn: React.CSSProperties = { minHeight: 34, padding: "0 12px", borderRadius: 9, background: SURF, border: `1px solid ${LINE}`, color: INK, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }
function shapeBtn(on: boolean): React.CSSProperties {
  return { width: 38, height: 38, borderRadius: 9, cursor: "pointer", fontSize: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", background: on ? "color-mix(in srgb, var(--accent) 16%, transparent)" : SURF, border: `1px solid ${on ? "color-mix(in srgb, var(--accent) 45%, transparent)" : LINE}`, color: INK }
}
function Cadenas() {
  return <span aria-hidden="true" style={{ position: "absolute", top: -5, right: -5, fontSize: 11, lineHeight: 1, padding: 2, borderRadius: 4, background: "rgba(0,0,0,0.75)" }}>🔒</span>
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ width: 42, fontSize: 12, color: MUTED }}>{label}</span>
      <label style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${LINE}`, background: value, cursor: "pointer", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none" }} />
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1, minWidth: 0, height: 30, padding: "0 8px", background: SURF, border: `1px solid ${LINE}`, borderRadius: 8, color: INK, fontSize: 12, fontFamily: "ui-monospace, monospace", outline: "none" }} />
    </div>
  )
}
