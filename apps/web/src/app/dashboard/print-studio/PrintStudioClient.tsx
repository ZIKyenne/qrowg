"use client"

// Atelier d'impression — UI guidée « objets, pas outils » (Atelier d'impression Mobile v3).
// Bibliothèque -> aperçu packshot + 3 volets bornés -> contrôle avant export -> export.
// Consomme les modules purs : catalog / mockup / states / tokens.

import { trimWidthMm, mediaDims, phraseFormatPdf, cssDImpression } from "./formatImpression"
import { alerteAvantImpression, type AlerteImpression } from "./qrQuiAboutit"
import { createPortal } from "react-dom"
import { useTravailNonEnregistre } from "@/lib/useTravailNonEnregistre"
import { ButtonLink } from "@/components/ui/Button"
import Vignette from "@/components/Vignette"
import { useEffect, useMemo, useRef, useState } from "react"
import { margeReelleMm } from "./ajustement"
import { modulesPourCharge } from "../qr-codes/margeQr"
import { relireUnFichier, phraseDeRelecture } from "@/lib/relectureQr"
import { pdfDuQrVectoriel } from "@/lib/pdfVectoriel"
import { countOutOfGamut } from "../qr-codes/cmyk"
import { useConfirm } from "@/components/ui/Confirm"
import { bornesCurseur, distanceLisible, MM_MIN_SCANNABLE } from "./tailleQrImprimable"
import { useIsMobile } from "@/lib/useIsMobile"
import Link from "next/link"
import {
  ArrowLeft, Lock, Unlock, Eye, EyeOff, ChevronUp, Check, X, Download, ShieldCheck, AlertTriangle, ChevronDown, Copy, Layers, Undo2, Redo2, Plus, MoreVertical, Type, Wand2, Move,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { getQRBlob, type QROptions } from "../qr-codes/qrRender"
import { renduDuQr, useStyleDeRendu, COLONNES_DU_STYLE, type RenduQr } from "../qr-codes/styleDuQr"
import {
  METIERS, OBJECTIFS, BRANDNAMES, filterItems, ambiancesFor, ITEM_BY_ID, STYLE_BY_ID, LAYOUT_BY_ID, LAYOUTS, STYLES, TYPOS, SIZES, MESSAGES, type Item, type Style,
} from "./catalog"
import { sceneLayers, paletteFromStyle } from "./mockup"
import { filterTemplates, type PrintTemplate, type TemplateVariant } from "./templates"
import { printPreflight, hexContrastRatio } from "../qr-codes/printPreflight"
import { color as C, radius as R } from "./tokens"
import { partQrMax, type Pastille } from "./ajustement"
import { bandeApercuMobile, dimensionsApercuMobile, legendeVisible, vhFeuilleMax, estPaysage, largeurTiroirPaysage, largeurApercuMobile, HAUT_BARRE_PAYSAGE } from "./apercuMobile"
import { nomDuQrSitue } from "@/lib/nomDuQr"
import { effetDe, serveurAFait, refusDuServeur, refusDeLaBase } from "@/lib/effetConfirme"
import { correspondAuxChamps } from "@/lib/rechercheSouple"
import { attente } from "@/lib/reponseAttendue"
import { lireDe } from "@/lib/lectureQuiSeSait"
import { LectureRatee } from "@/components/ui/LectureRatee"
import { ecrire, ecrireJson, lire, lireJson, oublier } from "@/lib/memoireDuNavigateur"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { useFermetureModale } from "@/lib/useFermetureModale"
import { useFermetureEchap } from "@/components/ui/useDialogue"
import { useHauteurReservee } from "@/lib/hauteurReservee"
import { inputStyle, secLabel, FilterSelect, ActiveChip, RailInline, chipStyle, Field, SuggRow, Seg, TuileCouleurLibre, ColorField, Range, Swatch } from "./champsDuStudio"
import { resolveLayoutId, layoutOk, fitLayout, ACCENTS, HEX6, hexDAccent, readableOn, layerLabel, freeElsEdgeMm, COMPOSITIONS, PRESETS, type FreeEl, type Preset } from "./vocabulaireDuSupport"
import { SupportVisual, PrintSheet, MultiSheet, Packshot, STYLE_NEUTRE, MiniSupport } from "./renduDuSupport"
import { PresetThumb, TemplateLibrary, AddLibrary } from "./bibliothequesDuStudio"
import { ZoomBar, FlatEditor } from "./editeurAPlat"

// eTitle / ePad sont des MULTIPLICATEURS continus (curseurs), 1 = valeur nominale.
const FINISH_LABEL: Record<string, string> = { uni: "Uni", degrade: "Dégradé", grain: "Grain", rayures: "Rayures", quadrillage: "Quadrillage" }
const FINISH_OPTS = [{ id: "uni", label: "Uni" }, { id: "degrade", label: "Dégradé" }, { id: "grain", label: "Grain" }, { id: "rayures", label: "Rayures" }, { id: "quadrillage", label: "Quadrillage" }]
const FRAME_LABEL: Record<string, string> = { aucun: "sans cadre", filet: "filet", double: "double filet", coins: "coins ornés" }
// Les réglages tiennent en TROIS onglets toujours visibles. Ils étaient répartis
// en cinq accordéons empilés dans une colonne qui défilait : changer une couleur
// puis une marge demandait de replier l'un, déplier l'autre, et se retrouver.
const ONGLETS_DROITE = [
  { id: "contenu" as const, label: "Contenu" },
  { id: "style" as const, label: "Style" },
  { id: "page" as const, label: "Page" },
]
type OngletDroite = (typeof ONGLETS_DROITE)[number]["id"] | "selection"
// Bottom sheet mobile (#17) : 3 positions ancrées (repère + hauteur en vh). Canvas visible dès « peek »/« half ».
const SHEET_ORDER = ["peek", "half", "full"] as const
type SheetPos = typeof SHEET_ORDER[number]
const SHEET_VH: Record<SheetPos, number> = { peek: 40, half: 66, full: 90 }
// Légende d'aperçu CONTEXTUELLE au support (§23) : selon où l'objet se pose réellement.
function supportHint(item: Item): string {
  switch (item.place) {
    case "Vitrine": return "Placez le téléphone contre la vitre pour prévisualiser"
    case "Mur": return "Visualisez la taille réelle sur votre mur"
    case "Comptoir": return "Posé sur le comptoir — taille réelle"
    case "Main": return "Dans la main — taille réelle"
    case "Table": return "À poser sur la table — taille réelle"
    default: return "Aperçu à taille réelle"
  }
}


// UX clavier mobile (§11) : hauteur du clavier virtuel (visualViewport) + champ texte focalisé.
// Actif seulement sur mobile pour ne pas perturber le desktop (pas de scroll auto au focus).
function useKeyboard(enabled: boolean) {
  const [kb, setKb] = useState(0)
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    if (!enabled) { setKb(0); setTyping(false); return }
    const vv = window.visualViewport
    // On ARRONDIT (pas de re-render pour 1-2px) et on ne réagit QUE si le palier change ⇒ zéro churn pendant la frappe
    // (évite les artefacts de saisie type « jourtr » avec les claviers prédictifs). Pas d'écoute « scroll » (trop bruyante).
    const quant = () => { if (!vv) return 0; const h = Math.max(0, window.innerHeight - vv.height - vv.offsetTop); return h > 120 ? Math.round(h / 20) * 20 : 0 }
    const onResize = () => setKb(prev => { const q = quant(); return q === prev ? prev : q })
    const isField = (el: EventTarget | null) => { const t = el as HTMLElement | null; return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) }
    const onFocus = (e: FocusEvent) => { if (isField(e.target)) { setTyping(true); const t = e.target as HTMLElement; setTimeout(() => { try { t.scrollIntoView({ block: "center", behavior: "smooth" }) } catch {} }, 160) } }
    const onBlur = () => setTyping(false)
    vv?.addEventListener("resize", onResize); onResize()
    window.addEventListener("focusin", onFocus); window.addEventListener("focusout", onBlur)
    return () => { vv?.removeEventListener("resize", onResize); window.removeEventListener("focusin", onFocus); window.removeEventListener("focusout", onBlur) }
  }, [enabled])
  return { kb, typing }
}
// Hauteur RÉELLEMENT visible : `visualViewport` quand il existe (il retire la
// barre d'URL du navigateur mobile, que `innerHeight` compte encore). L'aperçu
// se dimensionne dessus — sinon il déborde sous la feuille de réglages.
function useHauteurEcran(actif: boolean) {
  const [h, setH] = useState(844)
  const [l, setL] = useState(390)
  useEffect(() => {
    if (!actif) return
    const vv = window.visualViewport
    // Quantifié à 8 px : la barre d'URL qui glisse ne doit pas redessiner l'aperçu à chaque pixel.
    const lire = () => {
      const brute = vv?.height ?? window.innerHeight
      setH(prev => { const q = Math.round(brute / 8) * 8; return q === prev ? prev : q })
      setL(prev => { const q = vv?.width ?? window.innerWidth; return q === prev ? prev : q })
    }
    lire()
    vv?.addEventListener("resize", lire)
    window.addEventListener("resize", lire)
    window.addEventListener("orientationchange", lire)
    return () => { vv?.removeEventListener("resize", lire); window.removeEventListener("resize", lire); window.removeEventListener("orientationchange", lire) }
  }, [actif])
  return { hauteurEcran: h, largeurEcran: l }
}

// Hauteur RÉELLE d'un élément (entête, barre d'action). On ne la devine pas :
// la première version annonçait 52 px pour un entête qui en fait 72, et la
// légende de l'aperçu passait sous la barre sur les trois formats testés.
function useHauteurMesuree(actif: boolean) {
  // Ref-callback, pas useRef : l'entête et la barre n'existent qu'en phase
  // « studio », APRÈS le premier rendu (bibliothèque, choix du modèle). Un
  // useRef lu dans un effet [actif] voyait `null` une fois pour toutes — rien
  // n'était jamais mesuré, et les valeurs de repli (entête 72 px) mentaient dès
  // que l'entête passait sur deux rangées (« Enregistrer ») : sur iPhone, le bas
  // de l'affiche glissait sous la feuille (relevé du 16 nov.).
  const [el, ref] = useState<HTMLElement | null>(null)
  const [h, setH] = useState(0)
  useEffect(() => {
    if (!actif) { setH(0); return }
    if (!el || typeof ResizeObserver === "undefined") return
    // Quantifié à 2 px : un sous-pixel de plus ne doit pas relancer un rendu.
    const ro = new ResizeObserver(() => {
      const v = Math.round(el.getBoundingClientRect().height / 2) * 2
      setH(prev => (prev === v ? prev : v))
    })
    // border-box : un changement de PADDING (entête en paysage) change aussi la
    // hauteur occupée — la boîte de contenu, observée par défaut, ne le voit pas.
    ro.observe(el, { box: "border-box" })
    return () => ro.disconnect()
  }, [actif, el])
  return { ref, hauteur: h }
}

// Attributs anti-artefacts pour les champs texte du studio (claviers mobiles prédictifs).
const textInputProps = { autoCorrect: "off", autoCapitalize: "sentences", spellCheck: false, enterKeyHint: "done" as const }

export default function PrintStudioClient({ canAccess }: { canAccess: boolean }) {
  // Chaque barre qui reste en haut réserve sa hauteur dans la zone qui défile
  // sous elle : sinon ce qu'on vise au clavier atterrit dessous (lot v143).
  useHauteurReservee()
  const isMobile = useIsMobile(1024)
  const { kb, typing } = useKeyboard(isMobile)   // clavier virtuel : hauteur + saisie en cours (§11)
  const { hauteurEcran, largeurEcran } = useHauteurEcran(isMobile)
  const mesureEntete = useHauteurMesuree(isMobile)
  const mesureBarre = useHauteurMesuree(isMobile)
  const [sheetOpen, setSheetOpen] = useState(false)   // bottom sheet des réglages (mobile)
  const [sheetPos, setSheetPos] = useState<SheetPos>("half")   // #17 : position ancrée de la sheet (peek/half/full)
  const [sheetDragging, setSheetDragging] = useState(false)    // drag du handle en cours (désactive la transition)
  const [sheetDragPx, setSheetDragPx] = useState(0)            // décalage vertical live pendant le drag
  // La feuille fermée n'est plus rendue (revue interne du 9 septembre : 217 cibles et
  // 152 textes hors écran, du poids pour rien). Elle reste montée le temps de glisser
  // vers le bas, puis disparaît ; à l'ouverture, une animation d'entrée fait le reste.
  const [sheetMontee, setSheetMontee] = useState(false)
  useEffect(() => {
    if (sheetOpen) { setSheetMontee(true); return }
    const t = setTimeout(() => setSheetMontee(false), 360)
    return () => clearTimeout(t)
  }, [sheetOpen])
  const sheetDrag = useRef<{ y0: number; moved: number } | null>(null)
  const [mobileTab, setMobileTab] = useState<"couleurs" | "texte" | "qr">("couleurs")   // onglet simple mobile
  // « modele » (16 nov.) : le support choisi, on choisit son modèle AVANT
  // l'éditeur — le bouton « Modèles » de l'éditeur a disparu.
  const [phase, setPhase] = useState<"library" | "modele" | "studio">("library")
  const [metier, setMetier] = useState("Tout")
  const [objectif, setObjectif] = useState("Tout")
  // Écran bibliothèque (refonte DA) : recherche libre, tri, expansions.
  const [suppSearch, setSuppSearch] = useState("")
  const [suppSort, setSuppSort] = useState<"pop" | "az">("pop")
  const [showOthers, setShowOthers] = useState(false)     // « Voir les N autres »
  const [allMetiers, setAllMetiers] = useState(false)     // « + N métiers » (déplie les raccourcis)
  // Téléphone : la recherche suffit au premier regard ; métier, objectif, tri et
  // raccourcis s'ouvrent sous « Filtres » (relevé UX du 16 nov. : 3 menus et
  // 6 pastilles passaient avant le premier support).
  const petitEcran = useIsMobile(620)
  const [filtresOuverts, setFiltresOuverts] = useState(false)
  const [itemId, setItemId] = useState<string | null>(null)
  // Textes hérités d'une page publiée (?brand/?message/?cta) : réappliqués à chaque objet ouvert,
  // sinon openItem() les écraserait par les valeurs de démonstration du catalogue.
  const handoffRef = useRef<{ brand: string; message: string; cta: string } | null>(null)

  // état studio
  const [styleId, setStyleId] = useState("premiumdark")
  const [layoutId, setLayoutId] = useState("centre")
  const [sizeId, setSizeId] = useState("moyen")
  const [brandText, setBrandText] = useState(BRANDNAMES[0])   // nom affiché (libre)
  // Afficher ou masquer chaque texte (relevé iPhone du 17 nov.) : effacer le nom
  // faisait revenir « Café Lune », effacer le titre celui du support.
  const [masques, setMasques] = useState<{ marque?: boolean; titre?: boolean; sousTitre?: boolean }>({})
  const basculer = (cle: "marque" | "titre" | "sousTitre") => setMasques(m => ({ ...m, [cle]: !m[cle] }))
  const [subtitle, setSubtitle] = useState("")               // accroche / sous-titre optionnel
  const [message, setMessage] = useState("")                 // titre principal
  const [ctaText, setCtaText] = useState("")                 // libellé du bouton
  const [logo, setLogo] = useState("aucun")            // logo de marque sur l'OBJET (jamais sur le QR)
  const [eTitle, setETitle] = useState(1)
  const [ePad, setEPad] = useState(1)
  const [eCorner, setECorner] = useState("adouci")     // arrondi des éléments du support (pas le QR)
  const [eAccent, setEAccent] = useState("plein")
  const [eTypo, setETypo] = useState("auto")
  const [eAlign, setEAlign] = useState<"left" | "center" | "right">("center")
  const [fond, setFond] = useState("")                  // fond précis ("" = celui de l'ambiance)
  const [accent, setAccent] = useState("auto")         // couleur d'accent (override d'ambiance)
  const [titleCase, setTitleCase] = useState("normal") // casse du titre : Aa / MAJUSCULES
  const [titleWeight, setTitleWeight] = useState("normal") // graisse du titre : fin / normal / gras
  const [qrBadge, setQrBadge] = useState("carre")      // pastille derrière le QR : carré / cercle / aucune
  const [qrPos, setQrPos] = useState("centre")         // position verticale du QR (mise en page centrée)
  const [qrScale, setQrScale] = useState(1)            // curseur fin de taille du QR (× facteur du palier)
  const [blockY, setBlockY] = useState(0)              // placement vertical du bloc (curseur, -1..1)
  const [qrDx, setQrDx] = useState(0)                  // décalage fin du QR en X (-1..1)
  const [qrDy, setQrDy] = useState(0)                  // décalage fin du QR en Y (-1..1)
  const [bgImage, setBgImage] = useState<string | null>(null)  // photo de fond optionnelle (data URL ou URL Unsplash)
  const [bgSearch, setBgSearch] = useState("")                 // recherche de photos (Unsplash via /api/unsplash)
  const [bgPhotos, setBgPhotos] = useState<{ id: string; thumb: string; regular: string; author: string }[]>([])
  const [bgLoading, setBgLoading] = useState(false)
  const [bgMsg, setBgMsg] = useState("")
  const [refusDesign, setRefusDesign] = useState<string | null>(null)
  const [bgCredit, setBgCredit] = useState("")
  const [titleColor, setTitleColor] = useState("")     // couleurs par élément ("" = auto/thème)
  const [subColor, setSubColor] = useState("")
  const [ctaColor, setCtaColor] = useState("")
  const [advColor, setAdvColor] = useState(false)      // repli des couleurs avancées
  const [advQr, setAdvQr] = useState(false)            // repli du décalage fin du QR
  const [advText, setAdvText] = useState(false)        // repli des options de texte (casse/graisse/typo/alignement)
  const [advSel, setAdvSel] = useState(false)          // repli des réglages avancés de l'élément sélectionné (X/Y/rotation/opacité)
  const [bgFinish, setBgFinish] = useState("uni")      // fini du fond du support (uni / dégradé / grain)
  const [frame, setFrame] = useState("aucun")          // cadre décoratif indépendant
  const [ongletDroite, setOngletDroite] = useState<OngletDroite>("contenu")   // onglet des réglages (droite)
  const [volet, setVolet] = useState<null | "modeles" | "calques">(null)      // volet latéral (gauche), un seul à la fois
  const [mode, setMode] = useState<"simple" | "studio">("studio")   // #34 : Studio (édition libre) par défaut ; Simple = essentiel. Desktop uniquement, persisté localStorage.
  const [moreMenu, setMoreMenu] = useState(false)   // menu « ··· » : actions secondaires (Décliner/Planche) hors du header principal
  // Mode unique « Studio » : la bascule Simple/Studio a été retirée (un seul canvas, sûr par conception).
  const [showAllColors, setShowAllColors] = useState(false)
  const [control, setControl] = useState(false)           // écran « contrôle avant export »
  const [declineOpen, setDeclineOpen] = useState(false)    // sélecteur « décliner sur un autre support »
  const [campaignOpen, setCampaignOpen] = useState(false)  // sélecteur « planche multi-supports »
  const [campaign, setCampaign] = useState<string[]>([])   // supports retenus pour la planche
  const [campaignQty, setCampaignQty] = useState(1)        // exemplaires par format (imposition N-up)
  const [multiPrinting, setMultiPrinting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [printing, setPrinting] = useState(false)         // la planche PDF n'est montée QUE pendant l'impression
  const [designSaved, setDesignSaved] = useState(false)   // feedback « Enregistré »
  const [designErreur, setDesignErreur] = useState("")    // …et son contraire (lot v100)
  const [qrFree, setQrFree] = useState(false)             // QR en position LIBRE (déplaçable), sinon dans la mise en page
  const [qrFx, setQrFx] = useState(0.32)                  // position libre du QR (coin haut-gauche, fraction)
  const [qrFy, setQrFy] = useState(0.55)
  const [contentFree, setContentFree] = useState(false)   // « Tout déplacer » : le contenu de mise en page devient des éléments libres
  const [zoom, setZoom] = useState(1)                     // zoom de l'éditeur à plat (Studio libre)
  const [fsOpen, setFsOpen] = useState(false)             // aperçu PLEIN ÉCRAN (mobile §2/§9 : « tap = plein écran »)
  const [realSize, setRealSize] = useState(false)         // #24 : aperçu à TAILLE RÉELLE (physique) dans le plein écran
  const [calib, setCalib] = useState(false)               // panneau de calibrage (carte bancaire de référence)
  // Échap ferme ce qui se ferme en cliquant à côté (lot v139). L'ordre du
  // calibrage puis de l'aperçu vient de l'écouteur que cet écran tenait à part :
  // deux couches empilées, la plus haute d'abord.
  useFermetureModale(fsOpen || calib, () => { if (calib) setCalib(false); else setFsOpen(false) })
  useFermetureEchap(moreMenu, () => setMoreMenu(false))
  const [pxPerMm, setPxPerMm] = useState(96 / 25.4)       // px/mm de l'écran (défaut = référence CSS 96 dpi ; calibrable)
  useEffect(() => { try { const v = parseFloat(lire("qrowg-px-per-mm") || ""); if (v > 1 && v < 20) setPxPerMm(v) } catch {} }, [])
  const [addOpen, setAddOpen] = useState(false)           // bibliothèque « + Ajouter » (formes/icônes catégorisées)
  const [addSearch, setAddSearch] = useState("")          // recherche dans la bibliothèque d'éléments
  const [libre, setLibre] = useState(false)               // mode « Studio libre » (édition à plat + éléments libres)
  const [freeEls, setFreeEls] = useState<FreeEl[]>([])    // éléments texte libres posés sur le support
  const [selEl, setSelEl] = useState<string | null>(null) // élément libre sélectionné
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const logoInput = useRef<HTMLInputElement>(null)
  const bgInput = useRef<HTMLInputElement>(null)
  // Historique Annuler/Rétablir : snapshots du design complet, coalescés (une entrée par salve d'édition).
  const undoRef = useRef<{ past: string[]; future: string[]; apply: boolean; last: string; t: any }>({ past: [], future: [], apply: false, last: "", t: null })
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const kbd = useRef<any>({})   // dernières closures (raccourcis clavier montés une seule fois)

  // Source du QR : un QR EXISTANT de l'utilisateur, ou un PNG importé. AUCUNE création ici
  // (Atelier d'impression n'est pas un concepteur de QR — il met en scène un QR déjà fait).
  const [qrSource, setQrSource] = useState<"mine" | "png">("mine")
  const confirmer = useConfirm()
  const [qrPickId, setQrPickId] = useState("")
  const [qrPng, setQrPng] = useState<string | null>(null)
  const [myQRs, setMyQRs] = useState<{ id: string; label: string; url: string; alerte: AlerteImpression | null; rendu?: RenduQr }[]>([])
  const qrPngInput = useRef<HTMLInputElement>(null)

  // Modèles personnels (enregistrés sur CE navigateur — localStorage, aucune donnée serveur).
  const [savedPresets, setSavedPresets] = useState<{ id: string; name: string; cfg: Record<string, any> }[]>([])
  const [presetsRemote, setPresetsRemote] = useState(false)   // true = table print_presets dispo (compte) ; false = localStorage
  const [saving, setSaving] = useState(false)
  const [saveName, setSaveName] = useState("")
  // Ma charte (logo + accent + police), au compte ; repli localStorage.
  const [brandKit, setBrandKit] = useState<{ logo: string | null; accent: string; accent2: string; typo: string } | null>(null)
  const [brandRemote, setBrandRemote] = useState(false)
  // Modèles : d'abord le compte (Supabase, multi-appareils) ; repli localStorage si la table n'existe pas encore.
  useEffect(() => {
    const a = attente()
    const sb = createClient()
    sb.from("print_presets").select("id, name, cfg").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!a.encoreAttendue()) return
        if (!error && data) { setSavedPresets(data.map((r: any) => ({ id: r.id, name: r.name, cfg: r.cfg || {} }))); setPresetsRemote(true) }
        // Ce repli s'exécute quand la base a refusé. Il lisait le brouillon local et le
        // parsait à la main, DANS un `.then` : un contenu tronqué par un quota atteint
        // levait là où personne n'écoute, et les modèles ne chargeaient jamais (lot v136).
        else setSavedPresets(lireJson("qrowg-print-presets", [] as typeof savedPresets))
      })
    // Charte : peut renvoyer plusieurs lignes en équipe (une par membre) -> on prend la plus récente.
    // Sélection avec accent2 (couleur secondaire) : si la colonne n'existe pas encore (migration non appliquée),
    // la requête échoue → repli localStorage (aucune donnée perdue). Sinon, source de vérité = le compte.
    sb.from("print_brand_kit").select("logo, accent, accent2, typo").order("updated_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data, error }) => {
        if (!a.encoreAttendue()) return
        if (!error) { setBrandRemote(true); if (data) setBrandKit({ logo: (data as any).logo || null, accent: (data as any).accent || "auto", accent2: (data as any).accent2 || "", typo: (data as any).typo || "auto" }) }
        else { const k = lireJson<Record<string, unknown> | null>("qrowg-print-brandkit", null); if (k) setBrandKit({ accent2: "", ...k } as typeof brandKit) }
      })
    return a.abandonner
  }, [])
  // Montage à la demande de la planche PDF : on la monte, on laisse le QR se rendre, puis on imprime.
  // Rouvrir un design enregistré : arrivée depuis un QR (?qr=) → on restaure sa composition si elle existe.
  useEffect(() => {
    let code = ""
    try { code = new URLSearchParams(window.location.search).get("qr") || "" } catch {}
    if (!code) return
    const a = attente()
    // Un refus ouvrait le studio vierge, comme si aucun design n'avait jamais
    // été enregistré. On le dit plutôt que de faire recommencer (lot v129).
    void lireDe<{ design?: unknown }>(`/api/print-design?short_code=${encodeURIComponent(code)}`, "Votre design enregistré n'a pas pu être rechargé.")
      .then(a.siEncoreLa(({ valeur, refus }) => {
        if (refus) { setRefusDesign(refus); return }
        if (valeur?.design && typeof valeur.design === "object") restoreDesign(valeur.design as Parameters<typeof restoreDesign>[0])
      }))
    return a.abandonner
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Arrivée depuis une page publiée (bouton « Imprimer un support ») : la page a déjà déduit
  // le métier, l'usage et les textes. On ouvre le studio déjà cadré au lieu de tout resaisir.
  useEffect(() => {
    let q: URLSearchParams
    try { q = new URLSearchParams(window.location.search) } catch { return }
    const g = (k: string) => (q.get(k) || "").replace(/\s+/g, " ").trim().slice(0, 90)
    const m = g("metier"); if (m && METIERS.includes(m)) setMetier(m)
    const o = g("objectif"); if (o && OBJECTIFS.includes(o)) setObjectif(o)
    const h = { brand: g("brand"), message: g("message"), cta: g("cta") }
    if (h.brand || h.message || h.cta) handoffRef.current = h
    const it = g("item")
    if (it && ITEM_BY_ID[it]) openItem(it)   // openItem applique le handoff en fin de course
    else applyHandoff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!printing) return
    const t = setTimeout(() => { try { window.print() } catch {} }, 220)   // laisse le QR SVG se rendre
    const after = () => { marquerEnregistre(); setPrinting(false) }
    window.addEventListener("afterprint", after)
    return () => { clearTimeout(t); window.removeEventListener("afterprint", after) }
  }, [printing])
  useEffect(() => {
    if (!multiPrinting) return
    const t = setTimeout(() => { try { window.print() } catch {} }, 340)   // multi = plus de QR SVG à rendre
    const after = () => { marquerEnregistre(); setMultiPrinting(false) }
    window.addEventListener("afterprint", after)
    return () => { clearTimeout(t); window.removeEventListener("afterprint", after) }
  }, [multiPrinting])
  // Focus canvas (review P1) : pendant l'ÉDITION (phase studio, desktop), on replie la nav globale pour libérer
  // le canvas — via le Mode Focus partagé du dashboard (ne persiste PAS la préférence sidebar ; restaurée à la sortie).
  useEffect(() => {
    if (isMobile) return
    try { window.dispatchEvent(new CustomEvent("qrowg:builder-focus", { detail: phase === "studio" })) } catch {}
    return () => { try { window.dispatchEvent(new CustomEvent("qrowg:builder-focus", { detail: false })) } catch {} }
  }, [phase, isMobile])
  function persistPresets(next: { id: string; name: string; cfg: Record<string, any> }[]) { setSavedPresets(next); ecrireJson("qrowg-print-presets", next) }

  // QR existants de l'utilisateur (codes statiques liés à une page + QR instantanés dynamiques/statiques).
  // RLS scope automatiquement. Le QR imprimé encode /q/<short_code> (redirigeable) ou le payload direct.
  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"
    const att = attente()   // `a` est déjà pris plus bas par la première réponse
    const sb = createClient()
    let codeDemande = ""
    try { codeDemande = new URLSearchParams(window.location.search).get("qr") || "" } catch {}
    Promise.all([
      // `label` — le nom du support — n'était pas même demandé : la liste
      // affichait « Le Comptoir » autant de fois qu'il y a de supports, sans
      // qu'on puisse dire lequel est la vitrine (lot v86).
      sb.from("qr_codes").select(`short_code, label, status, expires_at, pages(title, slug, status), ${COLONNES_DU_STYLE}`).order("created_at", { ascending: false }).limit(60),
      sb.from("instant_qrs").select("id, label, kind, payload, dynamic, short_code, status, expires_at").order("created_at", { ascending: false }).limit(60),
      // Le QR demandé par `?qr=` est lu À PART : au-delà des 60 plus récents, il
      // manquait à la liste et l'atelier retombait en silence sur un AUTRE QR
      // (audit du 14 novembre, C : « Ma page → son QR → son support »).
      codeDemande
        ? sb.from("qr_codes").select(`short_code, label, status, expires_at, pages(title, slug, status), ${COLONNES_DU_STYLE}`).eq("short_code", codeDemande) // short_code est unique : une ligne au plus
        : Promise.resolve({ data: [] as any[] }),
    ]).then(([a, b, c]) => {
      if (!att.encoreAttendue()) return
      const list: { id: string; label: string; url: string; alerte: AlerteImpression | null; rendu?: RenduQr }[] = []
      const lignesQr = [...((a.data || []) as any[])]
      for (const r of ((c.data || []) as any[])) if (!lignesQr.some(x => x.short_code === r.short_code)) lignesQr.unshift(r)
      for (const r of lignesQr) {
        if (!r.short_code) continue
        const pg = Array.isArray(r.pages) ? r.pages[0] : r.pages
        list.push({ id: `q_${r.short_code}`, label: nomDuQrSitue({ label: r.label, pageTitre: pg?.title || pg?.slug, short_code: r.short_code }), url: `${appUrl}/q/${r.short_code}`, alerte: alerteAvantImpression({ statut: r.status, expireLe: r.expires_at, statutPage: pg?.status }, true),
          // Vague 3 : le QR se dessine avec SON style (QR Studio), pas avec l'ambiance du support.
          rendu: renduDuQr(r) })
      }
      for (const r of ((b.data || []) as any[])) {
        const url = r.dynamic && r.short_code ? `${appUrl}/q/${r.short_code}` : (r.payload || "")
        if (!url) continue
        // Un QR statique porte sa destination en dur : son statut ne change rien à ce qu'il ouvre.
        const alerte = r.dynamic ? alerteAvantImpression({ statut: r.status, expireLe: r.expires_at }, false) : null
        list.push({ id: `i_${r.id}`, label: r.label || (r.kind ? `QR ${r.kind}` : "QR instantané"), url, alerte })   // QR autonome : pas de page derrière
      }
      setMyQRs(list)
      // Présélection depuis ?qr=<short_code> (ouverture depuis un QR code) : on cible ce QR précis.
      let preferred = ""
      if (codeDemande && list.some(x => x.id === `q_${codeDemande}`)) preferred = `q_${codeDemande}`
      setQrPickId(prev => prev || preferred || (list[0]?.id ?? ""))
    }).catch(() => { /* liste vide : on retombe sur l'import PNG, pas de crash */ })
    return att.abandonner
  }, [])

  const item = itemId ? ITEM_BY_ID[itemId] : null
  const styleAmbiance = STYLE_BY_ID[styleId] || STYLE_BY_ID.premiumdark
  // Un fond choisi au nuancier remplace celui de l'ambiance ; le texte passe en
  // noir ou en blanc selon ce fond, pour rester lisible. Le QR garde sa pastille.
  const style = HEX6.test(fond) ? { ...styleAmbiance, bg: fond, ink: readableOn(fond) } : styleAmbiance
  const layout = LAYOUT_BY_ID[layoutId] || LAYOUT_BY_ID.centre
  const size = SIZES.find(s => s.id === sizeId) || SIZES[1]
  const messages = item ? (MESSAGES[item.id] || []) : []
  const brand = brandText.trim() || BRANDNAMES[0]
  const title = message.trim() || (messages[0] ?? item?.title ?? "")
  const cta = ctaText.trim() || item?.cta || ""
  const pickedQR = myQRs.find(q => q.id === qrPickId)
  const qrValue = qrSource === "mine" ? (pickedQR?.url || "https://qrowg.com") : "https://qrowg.com"
  const qrImg = qrSource === "png" ? qrPng : null
  // Vague 3 (23 nov.) : le style enregistré dans le QR Studio — couleurs, modules,
  // yeux, logo, correction. Le QR imprimé est le QR dessiné (../qr-codes/styleDuQr).
  const qrRendu: RenduQr | null = qrSource === "mine" ? (pickedQR?.rendu ?? null) : null
  const qrStyleRendu = useStyleDeRendu(qrRendu?.style ?? STYLE_NEUTRE)
  const qrReady = qrSource === "png" ? !!qrPng : !!pickedQR
  // U6 : le QR choisi mène-t-il quelque part ? Dit, jamais bloquant (qrQuiAboutit.ts).
  const alerteQr = qrSource === "mine" ? (pickedQR?.alerte ?? null) : null
  const blocAlerteQr = alerteQr && (
    <p role="status" style={{ margin: "10px 0 0", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.bad}`, background: "rgba(255,86,74,0.08)", color: C.fg, fontSize: 12.5, lineHeight: 1.5, textAlign: "left" }}>
      <AlertTriangle size={13} style={{ color: C.bad, verticalAlign: "-2px", marginRight: 6 }} />{alerteQr.texte}{" "}
      <Link href={alerteQr.lien} style={{ color: C.gold, fontWeight: 700, display: "inline-flex", alignItems: "center", minHeight: 40, margin: "-12px 0" }}>{alerteQr.action}</Link>
    </p>
  )
  const activePreset = PRESETS.find(p => p.style === styleId && p.layout === layoutId && p.accent === accent && p.bgFinish === bgFinish && p.frame === frame && p.titleCase === titleCase && p.titleWeight === titleWeight && p.qrBadge === qrBadge && p.eCorner === eCorner && p.eAccent === eAccent && p.eAlign === eAlign)?.id
  // Config de DESIGN capturable pour un modèle personnel (ni QR ni textes — c'est un « look »).
  const currentCfg: Record<string, any> = { styleId, fond, masques, layoutId, accent, bgFinish, frame, titleCase, titleWeight, qrBadge, qrPos, blockY, qrDx, qrDy, titleColor, subColor, ctaColor, eCorner, eAccent, eTypo, eAlign, eTitle, ePad }
  const activeSavedId = savedPresets.find(p => Object.keys(currentCfg).every(k => p.cfg[k] === currentCfg[k]))?.id
  // Quarante-cinq réglages composés pendant de longues minutes, et un clic sur
  // « Mes QR codes » les effaçait sans un mot. La référence est posée quand un
  // support est ouvert (page blanche) et quand le travail est mis à l'abri :
  // fichier téléchargé, impression terminée, style enregistré (lot v121).
  const { marquerEnregistre } = useTravailNonEnregistre({
    cfg: currentCfg, brandText, subtitle, message, ctaText, logoUrl, bgImage, freeEls,
  })
  const ambiances = useMemo(() => ambiancesFor(metier), [metier])
  // Taille EFFECTIVE du QR = palier × curseur fin. Sert au rendu ET au contrôle (guard ≥ 20 mm honnête).
  const effSize = { ...size, factor: +(size.factor * qrScale).toFixed(3) }
  // Pré-vol impression (moteur pur `printPreflight`, testé) — mesures HONNÊTES du design courant.
  // - Contraste : modules du QR vs son fond immédiat (pastille blanche). Sur photo SANS pastille : non mesurable (na).
  // - Zone franche : le QR (marge intégrée) + pastille blanche la garantissent ; le vrai risque = QR posé sur une PHOTO sans pastille.
  // - Safe-area : distance des éléments libres au bord (mode Studio libre).
  const noBadgeOnPhoto = qrBadge === "aucune" && !!bgImage
  // Le code réellement encodé : sa taille en modules commande la marge exigée.
  const modulesDuCode = modulesPourCharge(qrValue || "https://qrowg.com", qrRendu?.ecc ?? "M")
  const preflight = printPreflight({
    qrSizeMm: item ? +(item.qrMm * effSize.factor).toFixed(1) : null,
    contrastRatio: (qrSource === "png" || noBadgeOnPhoto) ? null : hexContrastRatio(qrRendu?.fg ?? style.qr, qrRendu?.bg ?? style.qrBg),
    // La marge n'est plus affirmée à 5 mm quoi qu'il arrive : elle est mesurée
    // sur la pastille réellement dessinée, et jugée contre les quatre modules
    // que la norme exige pour CE code (relevé du 13 septembre, voir ajustement.ts).
    quietZoneMm: qrBadge === "aucune"
      ? (bgImage ? 1 : null)
      : (item ? margeReelleMm(qrBadge as Pastille, item.qrMm * effSize.factor, modulesDuCode) : null),
    qrModules: modulesDuCode,
    // Le logo du QR Studio, à sa taille réelle (qrRender plafonne à 30 %) — plus « aucun logo » en dur.
    logoPct: qrRendu?.style.logoUrl ? Math.min(qrRendu.style.logoSize ?? 18, 30) : 0,
    // Export vectoriel (QR + texte) = net à toute taille ; seule une PHOTO de fond est limitée par le DPI du support.
    dpi: item ? (bgImage ? item.dpi : Math.max(300, item.dpi)) : null,
    edgeMarginMm: item ? (freeEls.length ? freeElsEdgeMm(freeEls, item) : item.margin) : null,
    isScreen: false,
    // Vague 3 : les couleurs RÉELLEMENT posées sur le support (ambiance, texte, bouton,
    // QR), sans doublon. Avertissement seulement : le vrai rendu dépend de l'imprimeur.
    cmykRiskyColors: countOutOfGamut([...new Set([style.bg, style.ink, style.accent, titleColor, subColor, ctaColor,
      qrRendu?.fg ?? style.qr, qrRendu?.bg ?? style.qrBg].filter(c => HEX6.test(c || "")).map(c => c.toUpperCase()))]),
  })
  const hasFail = preflight.checks.some(c => c.status === "fail")
  const ok = !hasFail

  function applyPreset(p: Preset) {
    // La mise en page du modèle est ramenée à une compatible avec le support courant (ex. « colonnes » sur un portrait).
    setStyleId(p.style); setFond(""); setLayoutId(item ? fitLayout(p.layout, item) : p.layout); setAccent(p.accent); setBgFinish(p.bgFinish); setFrame(p.frame)
    setTitleCase(p.titleCase); setTitleWeight(p.titleWeight); setQrBadge(p.qrBadge); setECorner(p.eCorner); setEAccent(p.eAccent); setEAlign(p.eAlign)
  }
  function applyCfg(c: Record<string, any>) {
    if (c.styleId) setStyleId(c.styleId); if (c.layoutId) setLayoutId(item ? fitLayout(c.layoutId, item) : c.layoutId); if (c.accent) setAccent(c.accent)
    setFond(typeof c.fond === "string" ? c.fond : "")
    if (c.bgFinish) setBgFinish(c.bgFinish); if (c.frame) setFrame(c.frame); if (c.titleCase) setTitleCase(c.titleCase)
    if (c.titleWeight) setTitleWeight(c.titleWeight); if (c.qrBadge) setQrBadge(c.qrBadge); if (c.qrPos) setQrPos(c.qrPos)
    if (c.eCorner) setECorner(c.eCorner); if (c.eAccent) setEAccent(c.eAccent); if (c.eTypo) setETypo(c.eTypo); if (c.eAlign) setEAlign(c.eAlign)
    if (typeof c.eTitle === "number") setETitle(c.eTitle); if (typeof c.ePad === "number") setEPad(c.ePad); if (typeof c.blockY === "number") setBlockY(c.blockY)
    if (typeof c.qrDx === "number") setQrDx(c.qrDx); if (typeof c.qrDy === "number") setQrDy(c.qrDy)
    setTitleColor(c.titleColor || ""); setSubColor(c.subColor || ""); setCtaColor(c.ctaColor || "")
  }
  function resetDesign() {
    if (!item) return
    setStyleId(item.pal); setFond(""); setLayoutId(resolveLayoutId(item.layout)); setAccent("auto"); setBgFinish("uni"); setFrame("aucun")
    setTitleCase("normal"); setTitleWeight("normal"); setQrBadge("carre"); setQrPos("centre"); setQrScale(1); setBlockY(0); setBgImage(null); setBgCredit("")
    setQrDx(0); setQrDy(0); setTitleColor(""); setSubColor(""); setCtaColor("")
    setECorner("adouci"); setEAccent("plein"); setETypo("auto"); setEAlign("center"); setETitle(1); setEPad(1)
    setContentFree(false); setFreeEls(els => els.filter(e => !e.id.startsWith("fc_")))
  }
  async function saveCurrent() {
    const name = saveName.trim() || `Mon style ${savedPresets.length + 1}`
    setSaving(false); setSaveName("")
    if (presetsRemote) {
      const rep = await createClient().from("print_presets").insert({ name, cfg: currentCfg }).select("id, name, cfg").single()
      if (!rep.error && rep.data) { setSavedPresets(p => [{ id: (rep.data as any).id, name: (rep.data as any).name, cfg: (rep.data as any).cfg || {} }, ...p]); return }
      // Le repli local réussit toujours : sans un mot, le commerçant croyait son
      // style enregistré SUR SON COMPTE, et ne le retrouvait pas ailleurs (v109).
      setDesignErreur(refusDeLaBase(rep.error, "Style gardé sur cet appareil seulement.") ?? "Style gardé sur cet appareil seulement.")
    }
    persistPresets([...savedPresets, { id: `sv_${Date.now()}`, name, cfg: currentCfg }])
    marquerEnregistre()
  }
  function deletePreset(id: string) {
    const next = savedPresets.filter(x => x.id !== id)
    setSavedPresets(next)
    if (presetsRemote) createClient().from("print_presets").delete().eq("id", id).then(() => {})
    else persistPresets(next)
  }
  // Recherche de photos de fond (Unsplash via proxy serveur). Orientation calée sur le format du support.
  async function searchPhotos() {
    const q = bgSearch.trim() || "background"
    setBgLoading(true); setBgMsg("")
    try {
      const orient = item ? (item.ratio < 0.9 ? "portrait" : item.ratio > 1.1 ? "landscape" : "squarish") : "squarish"
      // « Aucune photo trouvée » se disait aussi quand la recherche avait échoué :
      // le commerçant changeait de mot-clé au lieu de réessayer (lot v129).
      const { valeur: d, refus } = await lireDe<{ photos?: unknown[] }>(`/api/unsplash?q=${encodeURIComponent(q)}&orientation=${orient}`, "La recherche d'images n'a pas répondu.")
      if (refus) { setBgPhotos([]); setBgMsg(refus) }
      else if (Array.isArray(d?.photos) && d.photos.length) setBgPhotos(d.photos as typeof bgPhotos)
      else { setBgPhotos([]); setBgMsg("Aucune photo trouvée.") }
    } catch { setBgPhotos([]); setBgMsg("Recherche indisponible.") }
    finally { setBgLoading(false) }
  }
  // La charte capture le LOOK courant : logo, couleur principale (accent), couleur secondaire (= couleur du bouton), police.
  async function saveBrandKit() {
    const kit = { logo: logoUrl, accent, accent2: ctaColor || "", typo: eTypo }
    setBrandKit(kit)
    ecrireJson("qrowg-print-brandkit", kit)   // backup local systématique
    if (brandRemote) {
      // Tente avec accent2 ; si la colonne manque (migration non appliquée), replie sur les colonnes historiques.
      const sb = createClient(), now = new Date().toISOString()
      const { error } = await sb.from("print_brand_kit").upsert({ logo: logoUrl, accent, accent2: ctaColor || null, typo: eTypo, updated_at: now }, { onConflict: "user_id" })
      if (error) {
        const repli = await sb.from("print_brand_kit").upsert({ logo: logoUrl, accent, typo: eTypo, updated_at: now }, { onConflict: "user_id" })
        // Les deux ont échoué : la charte ne vit plus que sur cet appareil (v109).
        if (repli.error) setDesignErreur(refusDeLaBase(repli.error, "Charte gardée sur cet appareil seulement.")!)
      }
    }
  }
  function applyBrandKit() {
    if (!brandKit) return
    if (brandKit.logo) { setLogoUrl(brandKit.logo); setLogo("objet") }
    if (brandKit.accent) setAccent(brandKit.accent)
    if (brandKit.accent2) setCtaColor(brandKit.accent2)   // couleur secondaire → bouton
    if (brandKit.typo) setETypo(brandKit.typo)
  }
  // ── Persistance d'un design PAR QR (colonne qr_codes.print_design) ──────────────
  // Le « code » de rattachement = le short_code du QR (via ?qr= à l'ouverture depuis un QR, ou le QR sélectionné).
  const designCode = (() => {
    try { const q = new URLSearchParams(window.location.search).get("qr"); if (q) return q } catch {}
    if (qrSource === "mine" && pickedQR) { const m = pickedQR.url.match(/\/q\/([^/?#]+)/); return m?.[1] || "" }
    return ""
  })()
  function captureDesign(): Record<string, any> {
    return { v: 2, itemId, styleId, fond, masques, layoutId, sizeId, accent, bgFinish, frame, titleCase, titleWeight, qrBadge, qrPos, qrScale, blockY, qrDx, qrDy, qrFree, qrFx, qrFy, contentFree, eCorner, eAccent, eTypo, eAlign, eTitle, ePad, titleColor, subColor, ctaColor, logo, logoUrl, bgImage, bgCredit, brandText, subtitle, message, ctaText, qrSource, qrPickId, qrPng, freeEls }
  }
  function restoreDesign(c: Record<string, any>) {
    if (!c || typeof c !== "object") return
    if (c.itemId && ITEM_BY_ID[c.itemId]) setItemId(c.itemId)
    if (c.styleId) setStyleId(c.styleId); if (c.layoutId) setLayoutId(c.layoutId); if (c.sizeId) setSizeId(c.sizeId)
    setFond(typeof c.fond === "string" ? c.fond : "")
    setMasques(c.masques && typeof c.masques === "object" ? c.masques : {})
    if (c.accent) setAccent(c.accent); if (c.bgFinish) setBgFinish(c.bgFinish); if (c.frame) setFrame(c.frame)
    if (c.titleCase) setTitleCase(c.titleCase); if (c.titleWeight) setTitleWeight(c.titleWeight); if (c.qrBadge) setQrBadge(c.qrBadge)
    if (c.qrPos) setQrPos(c.qrPos); if (c.eCorner) setECorner(c.eCorner); if (c.eAccent) setEAccent(c.eAccent)
    if (c.eTypo) setETypo(c.eTypo); if (c.eAlign) setEAlign(c.eAlign)
    if (typeof c.qrScale === "number") setQrScale(c.qrScale); if (typeof c.blockY === "number") setBlockY(c.blockY)
    if (typeof c.qrDx === "number") setQrDx(c.qrDx); if (typeof c.qrDy === "number") setQrDy(c.qrDy)
    if (typeof c.eTitle === "number") setETitle(c.eTitle); if (typeof c.ePad === "number") setEPad(c.ePad)
    setTitleColor(c.titleColor || ""); setSubColor(c.subColor || ""); setCtaColor(c.ctaColor || "")
    if (c.logo) setLogo(c.logo); setLogoUrl(c.logoUrl ?? null); setBgImage(c.bgImage ?? null); setBgCredit(c.bgCredit || "")
    setBrandText(c.brandText || BRANDNAMES[0]); setSubtitle(c.subtitle || ""); setMessage(c.message || ""); setCtaText(c.ctaText || "")
    if (c.qrSource) setQrSource(c.qrSource); if (c.qrPickId) setQrPickId(c.qrPickId); setQrPng(c.qrPng ?? null)
    setFreeEls(Array.isArray(c.freeEls) ? c.freeEls : [])
    setQrFree(!!c.qrFree); if (typeof c.qrFx === "number") setQrFx(c.qrFx); if (typeof c.qrFy === "number") setQrFy(c.qrFy)
    setContentFree(!!c.contentFree)
    setPhase("studio")
  }
  async function saveDesign() {
    if (!designCode) return
    setDesignErreur("")
    // Le badge « Enregistré » s'allumait sans avoir lu la réponse. La route refuse
    // vraiment : 413 « Design trop volumineux (64 Ko maximum). » Le commerçant
    // ajoutait une image de fond, voyait « Enregistré », fermait l'onglet (v100).
    const r = await effetDe("/api/print-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ short_code: designCode, design: captureDesign(), format: "a4" }) })
    if (serveurAFait(r)) { setDesignSaved(true); setTimeout(() => setDesignSaved(false), 1800) }
    else setDesignErreur(refusDuServeur(r, "Le design n'a pas pu être enregistré.")!)
  }

  // ── Annuler / Rétablir (historique du design complet) ───────────────────────────
  // Snapshot sérialisé du design courant (mêmes champs que captureDesign) — clé de l'historique.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const snap = useMemo(() => JSON.stringify(captureDesign()), [itemId, styleId, layoutId, sizeId, accent, bgFinish, frame, titleCase, titleWeight, qrBadge, qrPos, qrScale, blockY, qrDx, qrDy, qrFree, qrFx, qrFy, contentFree, eCorner, eAccent, eTypo, eAlign, eTitle, ePad, titleColor, subColor, ctaColor, logo, logoUrl, bgImage, bgCredit, brandText, subtitle, message, ctaText, qrSource, qrPickId, qrPng, freeEls])
  // Empile (débounce 350 ms) : une salve de réglages = une seule entrée d'historique.
  useEffect(() => {
    if (phase !== "studio") return
    const u = undoRef.current
    if (u.last === "") { u.last = snap; return }          // base à l'entrée du studio
    if (snap === u.last) return
    if (u.apply) { u.apply = false; u.last = snap; return } // changement dû à undo/redo → ne pas ré-empiler
    clearTimeout(u.t)
    const prev = u.last
    u.t = setTimeout(() => {
      u.past.push(prev); if (u.past.length > 30) u.past.shift()
      u.future = []; u.last = snap
      setCanUndo(true); setCanRedo(false)
    }, 350)
  }, [snap, phase])
  function undo() {
    const u = undoRef.current
    if (!u.past.length) return
    clearTimeout(u.t)
    const prev = u.past.pop() as string
    u.future.push(JSON.stringify(captureDesign())); if (u.future.length > 30) u.future.shift()
    u.apply = true; u.last = prev
    try { restoreDesign(JSON.parse(prev)) } catch {}
    setCanUndo(u.past.length > 0); setCanRedo(true); setSelEl(null)
  }
  function redo() {
    const u = undoRef.current
    if (!u.future.length) return
    clearTimeout(u.t)
    const nxt = u.future.pop() as string
    u.past.push(JSON.stringify(captureDesign())); if (u.past.length > 30) u.past.shift()
    u.apply = true; u.last = nxt
    try { restoreDesign(JSON.parse(nxt)) } catch {}
    setCanUndo(true); setCanRedo(u.future.length > 0); setSelEl(null)
  }
  // Raccourcis clavier — montés une fois, lisent les dernières closures via `kbd`. On n'intercepte jamais la saisie.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = kbd.current
      if (!k || k.phase !== "studio") return
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key === "z" || e.key === "Z")) { e.preventDefault(); if (e.shiftKey) k.redo(); else k.undo(); return }
      if (mod && (e.key === "y" || e.key === "Y")) { e.preventDefault(); k.redo(); return }
      if (typing || !k.selEl) return
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); k.deleteEl(k.selEl); return }
      if (mod && (e.key === "d" || e.key === "D")) { e.preventDefault(); k.duplicateEl(k.selEl); return }
      const step = e.shiftKey ? 0.02 : 0.005
      if (e.key === "ArrowLeft") { e.preventDefault(); k.nudge(k.selEl, -step, 0) }
      else if (e.key === "ArrowRight") { e.preventDefault(); k.nudge(k.selEl, step, 0) }
      else if (e.key === "ArrowUp") { e.preventDefault(); k.nudge(k.selEl, 0, -step) }
      else if (e.key === "ArrowDown") { e.preventDefault(); k.nudge(k.selEl, 0, step) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ── Éléments libres (mode Studio libre) ─────────────────────────────────────────
  function addFreeText() {
    const p = paletteFromStyle(style)
    const id = `f_${Date.now()}`
    setFreeEls(els => [...els, { id, kind: "text", x: 0.28, y: 0.44, w: 0.44, size: 0.06, color: p.fg, align: "center", weight: 700, font: "", text: "Votre texte" }])
    setSelEl(id); setLibre(true)
  }
  function addFreeIcon(name: string) {
    const p = paletteFromStyle(style); const id = `f_${Date.now()}`
    setFreeEls(els => [...els, { id, kind: "icon", x: 0.44, y: 0.44, w: 0.12, h2: 0.12, size: 0.12, color: p.fg, align: "center", weight: 700, font: "", text: "", icon: name }])
    setSelEl(id); setLibre(true)
  }
  function addFreeShape(shape: string) {
    const p = paletteFromStyle(style); const id = `f_${Date.now()}`
    setFreeEls(els => [...els, { id, kind: "shape", x: 0.35, y: 0.4, w: 0.3, h2: shape === "line" ? 0.015 : 0.2, size: 0.06, color: p.band, align: "center", weight: 700, font: "", text: "", shape }])
    setSelEl(id); setLibre(true)
  }
  // Compositions prêtes : ajoute un GROUPE d'éléments finis (ids uniques) dérivés du thème (ou d'un style cible).
  function addComposition(cid: string, styleOverride?: Style) {
    const c = COMPOSITIONS.find(x => x.id === cid); if (!c) return
    const p = paletteFromStyle(styleOverride || style), base = Date.now()
    const parts: FreeEl[] = c.build(p).map((part, i) => ({ ...part, id: `f_${base}_${i}` }))
    setFreeEls(els => [...els, ...parts])
    setSelEl(parts[0]?.id ?? null); setLibre(true)
  }
  // « Tout déplacer » : convertit le contenu de mise en page (marque/titre/sous-titre/bouton) en ÉLÉMENTS LIBRES
  // (ids préfixés `fc_`) + QR en position libre, puis masque le contenu de mise en page (contentFree). Tout devient
  // glissable/redimensionnable/éditable via le système d'éléments libres déjà en place. Réversible (bouton + undo).
  function makeAllMovable() {
    if (contentFree) return
    const p = paletteFromStyle(style), b = Date.now()
    let i = 0
    const seeds: FreeEl[] = []
    const push = (text: string, y: number, size: number, weight: number) => { if (text && text.trim()) seeds.push({ id: `fc_${b}_${i++}`, kind: "text", x: 0.1, y, w: 0.62, size, color: p.fg, align: "left", weight, font: "", text }) }
    push(brand, 0.09, 0.05, 700)
    push(title, 0.17, 0.11, 700)
    push(subtitle, 0.31, 0.05, 500)
    push(cta, 0.86, 0.05, 800)
    setFreeEls(els => [...els, ...seeds])
    if (!qrFree) { setQrFree(true); setQrFx(0.5); setQrFy(0.42) }
    setContentFree(true); setLibre(true); setSelEl(seeds[0]?.id ?? null)
  }
  function undoAllMovable() {
    setContentFree(false); setFreeEls(els => els.filter(e => !e.id.startsWith("fc_"))); setSelEl(null)
  }
  // « ✨ Réorganiser » (P0 review) : récupération 1 clic — le contenu principal (titre/QR/bouton) revient à la mise en
  // page automatique propre ; les éléments AJOUTÉS par l'utilisateur (+ Ajouter) sont conservés.
  function reorganize() {
    setContentFree(false); setFreeEls(els => els.filter(e => !e.id.startsWith("fc_")))
    setQrFree(false); setQrDx(0); setQrDy(0); setBlockY(0); setSelEl(null)
  }
  // Appliquer un TEMPLATE (§7) : look + contenu suggéré (+ composition), recoercé au support. Annulable (undo).
  function applyTemplate(t: PrintTemplate, variant?: TemplateVariant) {
    const L = t.look
    const st = variant?.style || L.style
    setStyleId(st); setFond(""); setLayoutId(item ? fitLayout(L.layout, item) : L.layout); setAccent(variant?.accent || L.accent)
    setBgFinish(L.bgFinish); setFrame(L.frame); setTitleCase(L.titleCase); setTitleWeight(L.titleWeight)
    setQrBadge(L.qrBadge); setECorner(L.eCorner); setEAccent(L.eAccent); setEAlign(L.eAlign)
    if (L.eTypo) setETypo(L.eTypo)
    // Un modèle REMPLACE le design : il ne se pose pas par-dessus les réglages
    // du précédent. Sans ça, un titre agrandi à la main, un bloc décalé, un QR
    // déplacé ou les éléments d'un modèle antérieur survivaient à l'application
    // du suivant — c'est ce qui donnait le titre géant et le rectangle vide en
    // pointillés qui débordait du cercle.
    setETitle(1); setEPad(1); setBlockY(0); setQrPos("centre"); setQrDx(0); setQrDy(0); setQrScale(1)
    setTitleColor(""); setSubColor(""); setCtaColor("")
    setContentFree(false); setQrFree(false); setSelEl(null)
    // On efface ce qui a été POSÉ AUTOMATIQUEMENT (compositions `f_<ts>_<i>`,
    // germes de « Tout déplacer » `fc_*`) et on garde ce que l'utilisateur a
    // ajouté lui-même (`f_<ts>`) : son travail ne disparaît pas sous un modèle.
    setFreeEls(els => els.filter(e => !e.id.startsWith("fc_") && !/^f_\d+_\d+$/.test(e.id)))
    if (t.content.brand) setBrandText(t.content.brand)
    setMessage(t.content.title ?? ""); setSubtitle(t.content.subtitle ?? ""); setCtaText(t.content.cta ?? "")
    // Compositions (comp) NON auto-injectées : posées en absolu, elles chevauchaient le titre/QR du layout
    // (surtout sur les supports ronds/petits). Elles restent disponibles à la demande dans « + Ajouter »
    // (éditeur libre), où l'utilisateur les positionne. Le modèle rend un design propre, sans superposition.
  }
  useEffect(() => { if (selEl) setOngletDroite("selection") }, [selEl])
  function updateEl(id: string, patch: Partial<FreeEl>) { setFreeEls(els => els.map(e => e.id === id ? { ...e, ...patch } : e)) }
  function deleteEl(id: string) { setFreeEls(els => els.filter(e => e.id !== id)); setSelEl(s => (s === id ? null : s)) }
  // Dupliquer un élément libre (léger décalage) et sélectionner la copie ; déplacer au clavier (flèches).
  function duplicateEl(id: string) {
    const e = freeEls.find(x => x.id === id); if (!e) return
    const nid = `f_${Date.now()}`
    setFreeEls(els => [...els, { ...e, id: nid, x: Math.min(0.92, e.x + 0.03), y: Math.min(0.92, e.y + 0.03) }])
    setSelEl(nid)
  }
  function nudge(id: string, dx: number, dy: number) {
    setFreeEls(els => els.map(e => e.id === id && !e.locked ? { ...e, x: Math.max(0, Math.min(1, e.x + dx)), y: Math.max(0, Math.min(1, e.y + dy)) } : e))
  }
  // Ordre des calques (l'ordre du tableau = z) : premier plan = fin, arrière-plan = début.
  function bringFront(id: string) { setFreeEls(els => { const e = els.find(x => x.id === id); return e ? [...els.filter(x => x.id !== id), e] : els }) }
  function sendBack(id: string) { setFreeEls(els => { const e = els.find(x => x.id === id); return e ? [e, ...els.filter(x => x.id !== id)] : els }) }
  // Calques : l'ordre du tableau = z (0 = arrière, dernier = avant). « up » = vers l'avant, « down » = vers l'arrière.
  function moveLayer(id: string, dir: "up" | "down") {
    setFreeEls(els => { const i = els.findIndex(e => e.id === id); if (i < 0) return els; const j = dir === "up" ? i + 1 : i - 1; if (j < 0 || j >= els.length) return els; const next = els.slice(); const [it] = next.splice(i, 1); next.splice(j, 0, it); return next })
  }
  function toggleHide(id: string) { setFreeEls(els => els.map(e => e.id === id ? { ...e, hidden: !e.hidden } : e)) }
  function toggleLock(id: string) { setFreeEls(els => els.map(e => e.id === id ? { ...e, locked: !e.locked } : e)) }
  function centerEl(id: string, axis: "x" | "y" | "both") { setFreeEls(els => els.map(e => e.id === id ? { ...e, ...(axis !== "y" ? { x: 0.5 - e.w / 2 } : {}), ...(axis !== "x" ? { y: 0.5 - (e.kind === "shape" ? (e.h2 ?? 0.12) : e.size) / 2 } : {}) } : e)) }

  // Décliner : on change de support en GARDANT tout (design + textes + QR). Rien n'est réinitialisé.
  function switchSupport(id: string) {
    const it = ITEM_BY_ID[id]; if (!it) return
    // La mise en page courante peut ne pas convenir au nouveau format (rond, ou colonnes sur un portrait) -> on recentre.
    if (!layoutOk(layoutId, it)) setLayoutId(fitLayout(layoutId, it))
    setItemId(id); setDeclineOpen(false)
  }

  // Réapplique les textes venus de la page publiée par-dessus les valeurs de démonstration.
  function applyHandoff() {
    const h = handoffRef.current; if (!h) return
    if (h.brand) setBrandText(h.brand)
    if (h.message) setMessage(h.message)
    if (h.cta) setCtaText(h.cta)
  }

  function openItem(id: string) {
    const it = ITEM_BY_ID[id]; if (!it) return
    setItemId(id); setStyleId(it.pal); setFond(""); setMasques({}); setLayoutId(resolveLayoutId(it.layout))
    setSizeId("moyen"); setBrandText(BRANDNAMES[0]); setSubtitle(""); setMessage(""); setCtaText(it.cta); setLogo("aucun")
    setETitle(1); setEPad(1); setECorner("adouci"); setEAccent("plein"); setETypo("auto"); setEAlign("center")
    setAccent("auto"); setTitleCase("normal"); setTitleWeight("normal"); setQrBadge("carre"); setQrPos("centre"); setQrScale(1); setBlockY(0); setBgImage(null); setBgCredit("")
    setQrDx(0); setQrDy(0); setTitleColor(""); setSubColor(""); setCtaColor(""); setAdvColor(false); setAdvQr(false)
    setBgFinish("uni"); setFrame("aucun"); setLogoUrl(null); setShowAllColors(false); setControl(false)
    setLibre(true); setFreeEls([]); setSelEl(null); setQrFree(false); setQrFx(0.32); setQrFy(0.55); setContentFree(false); setPhase("studio")
    undoRef.current = { past: [], future: [], apply: false, last: "", t: null }; setCanUndo(false); setCanRedo(false)
    applyHandoff()
    marquerEnregistre()
  }

  // Les options du QR tel qu'il est posé sur le support (son style enregistré, sinon l'ambiance).
  const optionsDuQr = (size: number): QROptions => qrRendu
    ? { data: qrValue, fg: qrRendu.fg, bg: qrRendu.bg, ecc: qrRendu.ecc, style: qrStyleRendu, size }
    : { data: qrValue, fg: style.qr, bg: style.qrBg, ecc: "M", style: {}, size }

  // Vague 3 : AVANT d'ouvrir la boîte d'impression, le QR du support est relu par un
  // décodeur, dessiné à sa taille physique réelle (300 dpi) puis vu de loin
  // (lib/relectureQr). Un échec prévient ; on peut passer outre. Un PNG importé n'est
  // pas relu : on ne sait pas quelle adresse il doit contenir.
  const [relecture, setRelecture] = useState(false)
  async function qrReluAvantImpression(): Promise<boolean> {
    if (qrSource !== "mine" || !item) return true
    setRelecture(true)
    try {
      const px = Math.max(256, Math.round((item.qrMm * effSize.factor) / 25.4 * 300))
      const blob = await getQRBlob(optionsDuQr(Math.min(px, 2400)), "png")
      if (!blob) return true
      const r = await relireUnFichier(blob, qrValue, modulesPourCharge(qrValue, optionsDuQr(0).ecc))
      if (r.ok) return true
      return confirmer({ title: "Le QR de ce support n'a pas été relu", message: phraseDeRelecture(r), confirmLabel: "Imprimer quand même", cancelLabel: "Revoir le QR" })
    } catch { return true } finally { setRelecture(false) }
  }

  // Ré-export du QR choisi, seul (source « Mes QR »). On réencode le lien du QR existant :
  // aucune création de destination — c'est le même code, juste au format fichier.
  async function exportQr(ext: "png" | "svg" | "pdf") {
    if (!item || !ok || busy || qrSource !== "mine") return
    setBusy(true)
    try {
      const opts = optionsDuQr(1024)
      // PDF (vague 3) : le SVG du QR, posé en tracés sur une page à la taille physique du QR.
      const svgDuPdf = ext === "pdf" ? await getQRBlob(opts, "svg") : null
      const blob = ext === "pdf"
        ? (svgDuPdf ? await pdfDuQrVectoriel(await svgDuPdf.text(), { format: "taille", mm: +(item.qrMm * effSize.factor).toFixed(1) }) : null)
        : await getQRBlob(opts, ext)
      // Vague 3 : relu par un décodeur avant de partir (à sa résolution, puis vu de loin).
      if (blob) {
        // Un PDF ne se relit pas comme une image : on relit le SVG qu'il contient.
        const r = await relireUnFichier(svgDuPdf ?? blob, qrValue, modulesPourCharge(qrValue, opts.ecc))
        if (!r.ok && !(await confirmer({ title: "Ce fichier n'a pas été relu", message: phraseDeRelecture(r), confirmLabel: "Télécharger quand même", cancelLabel: "Revoir le QR" }))) return
      }
      if (blob) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `qrowg-${item.support}.${ext}`.replace(/\s+/g, "-").toLowerCase(); a.click(); URL.revokeObjectURL(a.href); marquerEnregistre(); setDone(true); setTimeout(() => setDone(false), 1800) }
    } finally { setBusy(false) }
  }

  // « Corriger » un contrôle de pré-vol : ferme le contrôle, ouvre le bon volet, applique un correctif sûr quand c'est net.
  function fixCheck(id: string) {
    setControl(false)
    if (id === "contrast") setOngletDroite("style")                                   // changer l'ambiance (couleurs du QR)
    else if (id === "qrsize") { setQrScale(v => Math.min(1.6, v + 0.3)); setOngletDroite("contenu") }  // agrandir le QR
    else if (id === "quiet") { setQrBadge(qrBadge === "aucune" ? "carre" : "cercle"); setOngletDroite("contenu") }  // pastille = zone franche
    else if (id === "margin") { if (!freeEls.length) setOngletDroite("page") }        // en libre : l'utilisateur écarte l'élément du bord
    else setOngletDroite("page")
  }

  // Dernières closures pour les raccourcis clavier (montés une seule fois plus haut).
  kbd.current = { phase, selEl, undo, redo, deleteEl, duplicateEl, nudge }

  // ── Upsell (free) ──────────────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, color: C.fg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: C.goldSoft, border: `1px solid ${C.goldA55}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Lock size={22} color={C.gold} /></div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Atelier d'impression</h1>
          <p style={{ color: C.fgMuted, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 20px" }}>Concevez des supports imprimables prêts à poser — stickers, chevalets, affiches, cartes — avec votre QR. Inclus dès le plan Établissement.</p>
          <ButtonLink href="/upgrade" variant="secondary">Voir les plans →</ButtonLink>
        </div>
      </div>
    )
  }

  // ── Bibliothèque ─────────────────────────────────────────────────────────────
  if (phase === "library" || !item) {
    // Données réelles dérivées du catalogue (jamais de chiffres inventés).
    const allItems = filterItems("Tout", "Tout")
    const totalFormats = new Set(allItems.map(i => i.size)).size
    const q = suppSearch.trim().toLowerCase()
    const match = (i: Item) => correspondAuxChamps([i.name, i.support, i.size, i.place, i.plain], q)
    const sortList = (l: Item[]) => (suppSort === "az" ? l.slice().sort((a, b) => a.name.localeCompare(b.name, "fr")) : l)
    const hasFilter = metier !== "Tout" || objectif !== "Tout"
    const reco = sortList(filterItems(metier, objectif).filter(match))
    const recoIds = new Set(reco.map(i => i.id))
    const others = hasFilter ? sortList(allItems.filter(i => !recoIds.has(i.id)).filter(match)) : []
    const othersShown = showOthers ? others : others.slice(0, 4)
    const nothing = reco.length === 0 && others.length === 0
    const quick = allMetiers ? METIERS.slice(1) : METIERS.slice(1, 7)
    // Carte de support COMPACTE (19 nov. : « on doit voir presque tout ») : une
    // vignette de 92 px (la miniature réelle mesurait 152×120 dans un cadre 4:3
    // de 400 px — du vide), le format dans la ligne de texte, la description
    // seulement quand la place existe (> md, 640 px). 2 colonnes sur téléphone.
    const card = (it: Item, top?: string) => (
      <button key={it.id} className="ps2-card" onClick={() => { openItem(it.id); setPhase("modele") }} style={{ position: "relative", textAlign: "left", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--surface-2)", borderRadius: 12, overflow: "hidden", cursor: "pointer", color: "var(--ink)", padding: 0 }}>
        <div style={{ position: "relative", height: 92, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(120% 100% at 50% 0%, #191512, var(--surface) 72%)", borderBottom: "1px solid #1c1917" }}>
          {top && <span style={{ position: "absolute", top: 6, left: 6, zIndex: 1, padding: "2px 7px", borderRadius: 999, background: "linear-gradient(135deg,var(--gold-light),var(--accent))", color: "#1a1408", fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap" }}>{top}</span>}
          <MiniSupport item={it} style={STYLE_BY_ID[it.pal]} cadre={{ l: 128, h: 92 }} />
        </div>
        <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-.01em", lineHeight: 1.25 }}>{it.name}</span>
          <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.size}</span>
          <span className="ps2-desc" style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{it.plain}</span>
        </div>
      </button>
    )
    return (
      <div style={{ position: "relative", minHeight: "100dvh", color: "var(--ink)", fontFamily: "Inter, system-ui, sans-serif", padding: "0 16px 56px" }}>
        <style>{`.ps2-card{transition:border-color .26s ease, transform .26s cubic-bezier(.2,.85,.3,1)}.ps2-card:hover{border-color:color-mix(in srgb, var(--accent) 45%, transparent);transform:translateY(-2px)}.ps2-card:hover .ps2-perso{color:var(--gold-light)}.ps2-sel:hover{border-color:color-mix(in srgb, var(--accent) 40%, transparent);color:var(--ink)}.ps2-chip{transition:border-color .24s ease,color .24s ease}.ps2-chip:hover{border-color:color-mix(in srgb, var(--accent) 34%, transparent);color:var(--ink)}.ps2-menuitem:hover{background:color-mix(in srgb, var(--accent) 7%, transparent)!important}.ps2-x{opacity:.7;transition:opacity .2s ease}.ps2-x:hover{opacity:1}.ps2-search::placeholder{color:#6b6258}.ps2-search:focus{outline:none}.ps2-editeur{transition:background .28s ease,color .28s ease}.ps2-editeur:hover{background:linear-gradient(135deg,var(--gold-light),var(--accent))!important;color:#1a1408!important}.ps2-more:hover{color:var(--gold-light)}.ps2-desc{display:none!important}@media(min-width:641px){.ps2-desc{display:-webkit-box!important}.ps2-grille{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))!important;gap:14px!important}}`}</style>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>

          {/* En-tête : fil d'Ariane + eyebrow */}
          <header style={{ padding: "18px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <Link href="/dashboard/qr-codes" className="ps2-chip cible-doigt" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 32, padding: "0 13px 0 10px", borderRadius: 999, border: "1px solid #26211a", color: "var(--muted)", fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
              <span aria-hidden style={{ width: 6, height: 6, borderLeft: "1.5px solid currentColor", borderBottom: "1.5px solid currentColor", transform: "rotate(45deg)" }} /> QR codes
            </Link>
          </header>

          {/* Titre + compteurs réels — même en-tête que les autres écrans (kicker · titre 22 px · sous-titre) */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 620 }}>
              <span style={{ fontSize: 11.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--faint)", fontWeight: 700 }}>Imprimer · Atelier d'impression</span>
              <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.01em", lineHeight: 1.2, margin: 0 }}>Choisissez un support</h1>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)", margin: 0, textWrap: "pretty" as any }}>Un objet réel, déjà réussi. Trois suffisent : à table, en vitrine, dans la main.</p>
            </div>
            {!petitEcran && <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--surface-2)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", letterSpacing: "-.01em", fontVariantNumeric: "tabular-nums" }}>{allItems.length}</div>
                <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>Supports</div>
              </div>
              <span style={{ width: 1, height: 26, background: "var(--surface-2)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", letterSpacing: "-.01em", fontVariantNumeric: "tabular-nums" }}>{totalFormats}</div>
                <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>Formats</div>
              </div>
            </div>}
          </div>

          {/* Barre de filtres collante */}
          <div data-barre-collante="" style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(20,18,16,.95)", backdropFilter: "blur(10px)", border: "1px solid var(--surface-2)", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px", minWidth: 180, display: "flex", alignItems: "center", gap: 9, padding: "5px 13px", borderRadius: 11, background: "var(--surface)", border: "1px solid #26211a" }}>
                <span aria-hidden style={{ position: "relative", width: 11, height: 11, flex: "none", border: "1.5px solid var(--accent)", borderRadius: "50%" }}><span style={{ position: "absolute", right: -4, bottom: -3, width: 5, height: 1.5, background: "var(--accent)", transform: "rotate(45deg)" }} /></span>
                <input className="ps2-search" value={suppSearch} onChange={e => setSuppSearch(e.target.value)} placeholder="Sticker, chevalet, carte…" style={{ flex: 1, minWidth: 0, minHeight: 34, background: "transparent", border: "none", color: "var(--ink)", fontSize: 12.5, caretColor: "var(--gold-light)" }} />
                {suppSearch && <button type="button" aria-label="Effacer" onClick={() => setSuppSearch("")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>}
              </div>
              {petitEcran && (
                <Button type="button" variant="secondary" size="sm" aria-expanded={filtresOuverts} aria-controls="ps2-filtres"
                  onClick={() => setFiltresOuverts(o => !o)} style={{ minHeight: 44, whiteSpace: "nowrap" }}>
                  {filtresOuverts ? "Fermer" : "Filtres"}{hasFilter ? ` · ${(metier !== "Tout" ? 1 : 0) + (objectif !== "Tout" ? 1 : 0)}` : ""}
                </Button>
              )}
              {(!petitEcran || filtresOuverts) && <>
              <FilterSelect label="Métier" value={metier} options={METIERS} onPick={setMetier} />
              <FilterSelect label="Objectif" value={objectif} options={OBJECTIFS} onPick={setObjectif} />
              <FilterSelect label="Trier" value={suppSort === "az" ? "A → Z" : "Populaires"} options={["Populaires", "A → Z"]} onPick={v => setSuppSort(v === "A → Z" ? "az" : "pop")} />
              </>}
            </div>

            {(!petitEcran || filtresOuverts) && <div id="ps2-filtres" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--faint)", fontWeight: 700, marginRight: 2 }}>Rapide</span>
              {quick.map(m => {
                const on = metier === m
                return (
                  <button key={m} type="button" className={on ? undefined : "ps2-chip"} onClick={() => setMetier(on ? "Tout" : m)}
                    style={{ minHeight: 32, padding: "0 13px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: on ? 600 : 500, background: on ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent", border: `1px solid ${on ? "color-mix(in srgb, var(--accent) 40%, transparent)" : "#26211a"}`, color: on ? "#e8c877" : "var(--muted)" }}>{m}</button>
                )
              })}
              <button type="button" className="ps2-more" onClick={() => setAllMetiers(a => !a)} style={{ minHeight: 32, padding: "0 4px", background: "none", border: "none", color: "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textDecorationColor: "color-mix(in srgb, var(--accent) 30%, transparent)", textUnderlineOffset: 3, transition: "color .24s ease" }}>{allMetiers ? "− Réduire" : `+ ${METIERS.length - 1 - 6} métiers`}</button>
            </div>}

            {hasFilter && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, borderTop: "1px solid #1c1917", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap" }}>Filtres actifs</span>
                {metier !== "Tout" && <ActiveChip label={metier} onClear={() => setMetier("Tout")} />}
                {objectif !== "Tout" && <ActiveChip label={objectif} onClear={() => setObjectif("Tout")} />}
                <button type="button" onClick={() => { setMetier("Tout"); setObjectif("Tout") }} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--muted)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Tout effacer</button>
              </div>
            )}
          </div>

          {nothing && (
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "8px 0" }}>Aucun support pour ce filtre. <button type="button" onClick={() => { setMetier("Tout"); setObjectif("Tout"); setSuppSearch("") }} style={{ background: "none", border: "none", color: "var(--gold-light)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Tout afficher</button></p>
          )}

          {/* Section recommandés (filtre actif) */}
          {hasFilter && reco.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em" }}>{reco.length} recommandé{reco.length > 1 ? "s" : ""} pour {metier !== "Tout" ? metier : objectif}{metier !== "Tout" && objectif !== "Tout" ? ` · ${objectif}` : ""}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>les plus adaptés d'abord</span>
              </div>
              <div className="ps2-grille" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {reco.map((it, i) => card(it, i === 0 ? "Recommandé" : undefined))}
              </div>
            </>
          )}

          {/* Section « Tous les supports » (les autres si filtre, sinon tout) */}
          {(hasFilter ? others.length > 0 : reco.length > 0) && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap", paddingTop: 4 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em" }}>Tous les supports</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{hasFilter ? `${others.length} autre${others.length > 1 ? "s" : ""}, tous métiers confondus` : `${reco.length} support${reco.length > 1 ? "s" : ""}`}</span>
                </div>
                {hasFilter && others.length > 4 && (
                  <Button type="button" onClick={() => setShowOthers(s => !s)} variant="secondary" size="sm">{showOthers ? "Réduire" : `Voir les ${others.length - 4} autres`}</Button>
                )}
              </div>
              <div className="ps2-grille" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {(hasFilter ? othersShown : reco).map(it => card(it))}
              </div>
            </>
          )}

          {/* Pied de page : éditeur libre */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 12, background: "#17140f", border: "1px solid #2e281f", flexWrap: "wrap" }}>
            <span aria-hidden style={{ width: 2, alignSelf: "stretch", minHeight: 34, borderRadius: 2, background: "linear-gradient(180deg, var(--gold-light), var(--accent))" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Vous ne trouvez pas votre support ?</span>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>L'éditeur libre part d'un format A4 : vous posez le QR où vous voulez.</span>
            </div>
            <Button type="button" onClick={() => { setMode("studio"); ecrire("qrowg-print-mode", "studio"); openItem("i11") }} size="sm">Éditeur libre</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Choix du modèle (avant l'éditeur) ────────────────────────────────────────
  // Le support est ouvert (openItem) : on choisit d'abord à quoi il ressemble.
  // Les mêmes modèles qu'avant (TemplateLibrary, styles rapides, Mes modèles),
  // mais à l'entrée — et l'éditeur n'a plus besoin de son bouton « Modèles ».
  if (phase === "modele") {
    // Les textes venus d'une page (?brand/?message/?cta) passent APRÈS le modèle :
    // un modèle change le look, jamais ce que la page a déjà dit.
    const choisir = (appliquer: () => void) => { appliquer(); applyHandoff(); setPhase("studio") }
    return (
      <div style={{ position: "relative", minHeight: "100dvh", color: "var(--ink)", fontFamily: "Inter, system-ui, sans-serif", padding: "0 16px 56px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
          <header style={{ padding: "18px 0 0" }}>
            <button type="button" onClick={() => setPhase("library")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.fgMuted, cursor: "pointer", fontSize: 13, minHeight: 44, padding: "0 6px 0 0", marginLeft: -2 }}><ArrowLeft size={16} aria-hidden="true" /> Supports</button>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 620 }}>
            <span style={{ fontSize: 11.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--faint)", fontWeight: 700 }}>{item.name} · {item.size}</span>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.01em", lineHeight: 1.2, margin: 0 }}>Choisissez un modèle</h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>Tout reste modifiable ensuite : textes, couleurs, QR.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <Button type="button" variant="secondary" size="sm" onClick={() => choisir(() => {})}>Garder le design de base</Button>
            {savedPresets.map(sp => (
              <Button key={sp.id} type="button" variant="secondary" size="sm" onClick={() => choisir(() => applyCfg(sp.cfg))}>{sp.name}</Button>
            ))}
          </div>
          <TemplateLibrary item={item} grand onApply={t => choisir(() => applyTemplate(t))} onApplyVariant={(t, v) => choisir(() => applyTemplate(t, v))} />
          <div>
            <p style={secLabel}>Styles rapides</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 10 }}>
              {PRESETS.map(pr => <PresetThumb key={pr.id} preset={pr} item={item} on={false} onClick={() => choisir(() => applyPreset(pr))} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Studio (aperçu + volets + action) ─────────────────────────────────────────
  const scene = sceneLayers(item.scene, metier === "Tout" ? null : metier)
  const pal = paletteFromStyle(style)
  // Tous les réglages de DESIGN partagés (sans `item`/`physW`/`w`/`h`) — réutilisés pour la planche multi-supports.
  const brandRendu = masques.marque ? "" : brand
  const titreRendu = masques.titre ? "" : title
  const sousTitreRendu = masques.sousTitre ? "" : subtitle
  const designProps = { style, pal, layout, size: effSize, qrValue, qrImg, qrRendu, qrBadge, qrPos, qrDx, qrDy, qrFree, qrFx, qrFy, contentFree, logo, logoUrl, bgFinish, bgImage, frame, accent, titleCase, titleWeight, titleColor, subColor, ctaColor, blockY, brand: brandRendu, subtitle: sousTitreRendu, title: titreRendu, cta, eCorner, eAccent, eTypo, eAlign, eTitle, ePad, freeEls }
  // Planche = chaque format retenu, répété `campaignQty` fois (imposition N-up : N exemplaires par format).
  const campaignItems = (campaign.length ? campaign : [item.id]).flatMap(id => Array(Math.max(1, campaignQty)).fill(id)).map(id => ITEM_BY_ID[id]).filter(Boolean)
  const sel = freeEls.find(e => e.id === selEl)
  // Le bouton d'appel se RETIRE là où on l'écrit. « Aucun » existait, mais dans
  // « Style du bouton », sur ordinateur seulement : sur téléphone, effacer le
  // texte faisait revenir celui du support (« M'écrire »), le bouton était
  // impossible à enlever (relevé du 16 nov.).
  const sansBouton = eAccent === "aucun"
  const champBouton = (
    <Field label="Bouton">
      <Seg value={sansBouton ? "sans" : "avec"} options={["avec", "sans"]} labels={["Avec bouton", "Sans bouton"]} onPick={v => setEAccent(v === "sans" ? "aucun" : "plein")} />
      {!sansBouton && <input {...textInputProps} aria-label="Texte du bouton" value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder={item.cta} style={{ ...inputStyle, marginTop: 8 }} />}
    </Field>
  )
  // Un élément sélectionné amène ses réglages tout seul : plus besoin de chercher.
  const ongletEffectif: OngletDroite = sel ? (ongletDroite === "selection" ? "selection" : ongletDroite) : (ongletDroite === "selection" ? "contenu" : ongletDroite)
  // Le rail : créer et empiler à gauche, régler à droite. Deux gestes, deux côtés.
  const RAIL_OUTILS = [
    { id: "texte", court: "Texte", titre: "Ajouter un texte", icone: Type, action: (() => addFreeText()) as null | (() => void) },
    { id: "element", court: "Élément", titre: "Ajouter une icône, une forme, une composition", icone: Plus, action: () => { setAddSearch(""); setAddOpen(true) } },
    { id: "calques", court: "Calques", titre: "Les éléments posés sur le support", icone: Layers, action: null },
    { id: "deplacer", court: contentFree ? "Ranger" : "Libérer", titre: contentFree ? "Revenir à la mise en page automatique" : "Rendre le titre, le QR et le bouton déplaçables", icone: Move, action: () => (contentFree ? undoAllMovable() : makeAllMovable()) },
    { id: "ranger", court: "Aligner", titre: "Remettre le titre, le QR et le bouton dans une mise en page propre", icone: Wand2, action: () => reorganize() },
  ]
  const tmpls = filterTemplates(item)   // templates pertinents au support courant (pertinents d'abord)
  // UN SEUL aperçu sur desktop = l'éditeur où l'on déplace les éléments (plus de « guidé » non-déplaçable en parallèle).
  // Mobile garde l'aperçu guidé simple (le drag fin y est inadapté).
  const showFlat = !isMobile
  // Sélection contextuelle (#12/#32) — DESKTOP uniquement (onFocus n'est pas passé sur mobile : le tap y reste « plein écran »).
  // Cliquer un objet de l'aperçu (titre/QR/bouton/fond) ouvre son volet dédié : accordéon + scroll + surlignage.
  function focusPanel(panel: string) {
    setLibre(false); setSelEl(null)
    // Clics d'aperçu → 5 catégories consolidées : titre/bouton → Contenu, QR → Contenu, fond → Style.
    const MAP: Record<string, OngletDroite> = { texte: "contenu", qr: "contenu", details: "style", allure: "style", page: "page" }
    const cible = MAP[panel] ?? "contenu"
    setOngletDroite(cible)
  }
  // #34 : bascule Simple/Studio (persistée). Passer en Simple ferme l'édition libre et rabat vers un volet essentiel.
  function applyMode(m: "simple" | "studio") {
    setMode(m); ecrire("qrowg-print-mode", m)
    if (m === "simple") { setLibre(false); setSelEl(null); setOngletDroite("contenu") }
    else setLibre(true)   // Studio = édition libre d'office
  }
  // #17 : bottom sheet mobile à positions ancrées. Ouvrir un onglet ouvre la sheet à « half ».
  function openSheet(tab: "couleurs" | "texte" | "qr") { setMobileTab(tab); setSheetPos("half"); setSheetOpen(true) }
  // Bande laissée libre par la feuille de réglages : l'aperçu s'y loge en entier.
  // Avant, il gardait 320 × 400 quoi qu'il arrive, et « Taille du QR » se réglait
  // sur un QR caché derrière la feuille.
  // La feuille ne monte jamais au point de cacher le support : son plafond dépend
  // de la forme de l'objet qu'on est en train de régler. Une même valeur sert à
  // la feuille ET à l'aperçu -> ils ne peuvent pas se contredire.
  // Téléphone couché : les réglages passent sur le CÔTÉ. Ancrés en bas, ils ne
  // pouvaient monter qu'à ~148 px dont la barre d'action en masquait 122 : le
  // panneau existait mais aucun réglage n'était atteignable.
  const paysage = isMobile && estPaysage(largeurEcran, hauteurEcran)
  const tiroirW = paysage ? largeurTiroirPaysage(largeurEcran) : 0
  const chrome = { entete: mesureEntete.hauteur, barre: mesureBarre.hauteur }
  const vhFeuille = isMobile && !paysage
    ? Math.min(SHEET_VH[sheetPos], vhFeuilleMax(hauteurEcran, largeurEcran, item.shape === "round" ? 1 : item.ratio, chrome.entete))
    : 0
  const bandeApercu = isMobile ? bandeApercuMobile(hauteurEcran, sheetOpen, vhFeuille, paysage, chrome) : 0
  const largeurApercu = largeurApercuMobile(largeurEcran, paysage, sheetOpen)
  // Déplace la sheet d'un cran (dir +1 = plus grande, -1 = plus petite ; sous « peek » = fermer).
  function stepSheet(dir: 1 | -1) {
    const i = SHEET_ORDER.indexOf(sheetPos) + dir
    if (i < 0) { setSheetOpen(false); return }
    setSheetPos(SHEET_ORDER[Math.min(SHEET_ORDER.length - 1, i)])
  }
  // Drag du handle : suit le doigt (translate), puis snap au cran voisin ; tap sec = cran suivant (cyclique).
  function onSheetDown(e: React.PointerEvent) { sheetDrag.current = { y0: e.clientY, moved: 0 }; setSheetDragging(true); try { (e.target as HTMLElement).setPointerCapture(e.pointerId) } catch {} }
  function onSheetMove(e: React.PointerEvent) { const d = sheetDrag.current; if (!d) return; d.moved = e.clientY - d.y0; setSheetDragPx(Math.max(-48, d.moved)) }
  function onSheetUp() {
    const d = sheetDrag.current; sheetDrag.current = null; setSheetDragging(false); const dy = d?.moved ?? 0; setSheetDragPx(0)
    if (Math.abs(dy) < 8) { const i = SHEET_ORDER.indexOf(sheetPos); setSheetPos(SHEET_ORDER[(i + 1) % SHEET_ORDER.length]); return }
    if (dy > 56) stepSheet(-1); else if (dy < -56) stepSheet(1)
  }
  const layBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, border: "none", background: "transparent", color: C.fgMuted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }
  return (
    <div className="ps-root" style={{ position: "relative", minHeight: "100dvh", color: C.fg, fontFamily: "Inter, system-ui, sans-serif" }}>
      {refusDesign && <div style={{ maxWidth: 1320, margin: "0 auto", padding: "12px 16px 0" }}><LectureRatee message={refusDesign} /></div>}
      <header ref={mesureEntete.ref as any} className="ps-hdr" style={{ maxWidth: 1320, margin: "0 auto", padding: paysage && sheetOpen ? `14px ${tiroirW + 16}px 14px 16px` : "14px 16px", transition: "padding var(--mo-sheet) var(--mo-ease-standard)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <button onClick={() => setPhase("modele")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.fgMuted, cursor: "pointer", fontSize: 13, flexShrink: 0, minHeight: 44, padding: "0 6px 0 0", marginLeft: -2 }}><ArrowLeft size={16} /> Modèles</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Bascule Simple/Studio retirée : un seul mode d'édition (canvas libre borné, sûr par conception). */}
          {/* Mobile = simplifié : on masque annuler/rétablir · Décliner · Planche (fonctions avancées desktop). */}
          {!isMobile && <>
            <div style={{ display: "inline-flex", gap: 4 }}>
              <button onClick={undo} disabled={!canUndo} title="Annuler (Ctrl+Z)" aria-label="Annuler" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, background: "transparent", border: `1px solid ${C.hairline}`, borderRadius: 10, color: canUndo ? C.fg : C.fgFaint, cursor: canUndo ? "pointer" : "default", opacity: canUndo ? 1 : 0.5 }}><Undo2 size={16} /></button>
              <button onClick={redo} disabled={!canRedo} title="Rétablir (Ctrl+Maj+Z)" aria-label="Rétablir" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, background: "transparent", border: `1px solid ${C.hairline}`, borderRadius: 10, color: canRedo ? C.fg : C.fgFaint, cursor: canRedo ? "pointer" : "default", opacity: canRedo ? 1 : 0.5 }}><Redo2 size={16} /></button>
            </div>
          </>}
          {/* Actions secondaires regroupées dans un menu « ··· » (§P1/§9 : header allégé, sorties clarifiées). */}
          {!isMobile && mode === "studio" && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setMoreMenu(v => !v)} aria-haspopup="menu" aria-expanded={moreMenu} title="Plus d'actions" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, background: moreMenu ? C.surfaceUp : "transparent", border: `1px solid ${C.hairline}`, borderRadius: 10, color: C.fg, cursor: "pointer" }}><MoreVertical size={16} /></button>
              {moreMenu && (
                <>
                  <div onClick={() => setMoreMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                  <div role="menu" className="mo-fade-up" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 41, minWidth: 180, background: C.surface, border: `1px solid ${C.hairline}`, borderRadius: 12, padding: 6, boxShadow: "0 16px 44px rgba(0,0,0,0.5)" }}>
                    <button role="menuitem" onClick={() => { setMoreMenu(false); setDeclineOpen(true) }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 12px", background: "none", border: "none", borderRadius: 8, color: C.fg, cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "left" }}><Copy size={15} color={C.fgMuted} /> Décliner sur un support</button>
                    <button role="menuitem" onClick={() => { setMoreMenu(false); if (!campaign.length) setCampaign([item.id]); setCampaignOpen(true) }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 12px", background: "none", border: "none", borderRadius: 8, color: C.fg, cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "left" }}><Layers size={15} color={C.fgMuted} /> Planche multi-supports</button>
                  </div>
                </>
              )}
            </div>
          )}
          {designCode && <button onClick={saveDesign} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: designSaved ? C.goldSoft : "transparent", border: `1px solid ${designSaved ? C.gold : C.hairline}`, color: designSaved ? C.gold : C.fg, cursor: "pointer", fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: "10px 16px" }}>{designSaved ? <Check size={14} /> : <ShieldCheck size={14} />} {designSaved ? "Enregistré" : "Enregistrer"}</button>}
          {designErreur && <span role="alert" style={{ fontSize: 12, fontWeight: 700, color: C.bad }}>{designErreur}</span>}
          {/* Le nom du support manquait sur mobile : l'entête disait « Bibliothèque »
              et rien d'autre — impossible de savoir ce qu'on était en train de régler. */}
          <span style={{ fontSize: isMobile ? 11.5 : 12.5, fontWeight: 700, color: C.fgMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name} · <span style={{ fontFamily: "ui-monospace, monospace" }}>{item.size}</span></span>
          {/* Dans la légende, il disparaissait dès que le panneau de réglages
              s'ouvrait : la vue « en situation » devenait inatteignable sans tout
              refermer. Dans l'entête, elle est toujours à un tap. */}
          {isMobile && <button onClick={() => setFsOpen(true)} aria-label="Voir en situation (plein écran)" style={{ flexShrink: 0, background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 16, lineHeight: 1, minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: -10 }}>⛶</button>}
        </div>
      </header>

      <div className="ps-grid" style={{ maxWidth: 1320, margin: "0 auto", padding: isMobile ? `0 ${paysage && sheetOpen ? tiroirW + 12 : 12}px 0 12px` : "0 16px 108px", transition: "padding var(--mo-sheet) var(--mo-ease-standard)", display: "grid", gap: 24, gridTemplateColumns: "minmax(0, 1fr)" /* « 1fr » s'élargissait à la légende (nowrap) : l'affiche décentrée, coupée à droite */ }}>
        {/* Canvas héros (#2) + shell ZÉRO-SCROLL (§11) : sur desktop le root est une colonne 100dvh (header figé,
            grille flex:1 à overflow interne, barre d'action en pied statique) → aucun scroll de page, seuls les
            panneaux/canvas scrollent en interne. Mobile inchangé (scroll doux + sheet). */}
        <style>{`@media(min-width:1025px){.ps-grid{grid-template-columns:92px minmax(0,1fr) 356px!important;align-items:start;position:relative}.ps-aside{position:sticky;top:14px;align-self:start}.ps-rail{position:sticky;top:14px;align-self:start}.ps-panels{position:sticky;top:14px;align-self:start;max-height:calc(100dvh - 190px)}}.ps-chip{transition:border-color var(--mo-fast) var(--mo-ease-standard),background var(--mo-fast) var(--mo-ease-standard),color var(--mo-fast) var(--mo-ease-standard)}.ps-chip:hover{border-color:color-mix(in srgb,var(--accent) 50%,transparent)}.ps-foc{outline:2px solid transparent;outline-offset:3px;border-radius:4px;transition:outline-color var(--mo-fast) var(--mo-ease-standard)}.ps-foc:hover{outline-color:color-mix(in srgb,var(--accent) 60%,transparent)}.ps-flash{animation:psflash var(--mo-slow) var(--mo-ease-emphasized)}@keyframes psflash{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 60%,transparent)}30%{box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 45%,transparent)}100%{box-shadow:0 0 0 0 transparent}}@keyframes ps-sheet-in-y{from{transform:translateY(112%)}}@keyframes ps-sheet-in-x{from{transform:translateX(112%)}}@media(prefers-reduced-motion:reduce){.ps-flash{animation:none}.ps-foc{transition:none}}`}</style>

        {/* ── RAIL D'OUTILS (gauche) ────────────────────────────────────────
            Les modèles et les calques ne sont plus des accordéons empilés dans la
            colonne de droite : ce sont des volets qui s'ouvrent à la demande, à
            côté de l'aperçu, et se referment. On ne déroule plus une colonne pour
            trouver un réglage. */}
        {!isMobile && (
        <nav className="ps-rail" aria-label="Outils" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", paddingTop: 2 }}>
          {RAIL_OUTILS.map(o => {
            const Ico = o.icone
            const actif = volet === o.id
            return (
              <button key={o.id} onClick={() => o.action ? o.action() : setVolet(v => (v === o.id ? null : (o.id as "modeles" | "calques")))}
                title={o.titre} aria-label={o.titre} aria-pressed={actif}
                style={{ width: 80, minHeight: 62, borderRadius: 14, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 4px",
                  background: actif ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent",
                  border: `1px solid ${actif ? C.goldA55 : "transparent"}`, color: actif ? C.gold : C.fgMuted, transition: "background var(--mo-fast) var(--mo-ease-standard)" }}>
                <Ico size={21} />
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".01em" }}>{o.court}</span>
              </button>
            )
          })}
        </nav>
        )}

        {/* Volet latéral : un seul à la fois, largeur fixe, défilement interne. */}
        {!isMobile && volet && (
          <aside className="ps-volet" style={{ position: "absolute", left: 104, top: 0, width: 344, maxHeight: "calc(100dvh - 210px)", overflowY: "auto", zIndex: 20,
            background: C.surface, border: `1px solid ${C.goldA33}`, borderRadius: R.card, padding: 14, boxShadow: "0 24px 60px rgba(0,0,0,.55)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 15.5, fontWeight: 600, color: C.fg }}>{volet === "modeles" ? "Modèles" : "Calques"}</span>
              <button onClick={() => setVolet(null)} aria-label="Fermer le volet" style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            {volet === "calques" && (freeEls.length === 0
              ? <p style={{ color: C.fgMuted, fontSize: 12, margin: 0 }}>Aucun élément ajouté. Utilisez « Texte » ou « Élément » dans le rail.</p>
              : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...freeEls].reverse().map(el => {
                  const on = selEl === el.id
                  return (
                    <div key={el.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 8px", borderRadius: 9, background: on ? C.goldSoft : C.surfaceUp, border: `1px solid ${on ? C.goldA55 : C.hairline}` }}>
                      <button onClick={() => setSelEl(el.id)} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", color: el.hidden ? C.fgFaint : (on ? C.gold : C.fg), cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: 0 }}>{layerLabel(el)}</button>
                      <button onClick={() => toggleHide(el.id)} title={el.hidden ? "Afficher" : "Masquer"} aria-label={el.hidden ? "Afficher" : "Masquer"} style={{ ...layBtn, color: el.hidden ? C.gold : C.fgMuted }}>{el.hidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      <button onClick={() => toggleLock(el.id)} title={el.locked ? "Déverrouiller" : "Verrouiller"} aria-label={el.locked ? "Déverrouiller" : "Verrouiller"} style={{ ...layBtn, color: el.locked ? C.gold : C.fgMuted }}>{el.locked ? <Lock size={14} /> : <Unlock size={14} />}</button>
                      <button onClick={() => moveLayer(el.id, "up")} title="Avancer" aria-label="Avancer" style={layBtn}><ChevronUp size={14} /></button>
                      <button onClick={() => moveLayer(el.id, "down")} title="Reculer" aria-label="Reculer" style={layBtn}><ChevronDown size={14} /></button>
                    </div>
                  )
                })}
                </div>)}
          </aside>
        )}

        {/* Aperçu packshot */}
        <div className="ps-aside">
          {showFlat
            ? <>
                <ZoomBar zoom={zoom} setZoom={setZoom} />
                <div style={{ overflow: "auto", maxWidth: "100%", display: "flex", justifyContent: "center", padding: "4px 0" }}>
                  <FlatEditor item={item} design={designProps} freeEls={freeEls} setFreeEls={setFreeEls} selEl={selEl} setSelEl={setSelEl} onQrMove={(x, y) => { setQrFx(x); setQrFy(y) }} zoom={zoom} />
                </div>
              </>
            : <div style={{ position: "relative", ...(isMobile ? {} : { background: "radial-gradient(130% 90% at 50% -10%, rgba(255,255,255,.05), transparent 70%)", border: `1px solid ${C.hairline}`, borderRadius: 24, padding: 22 }) }}>
                {(() => {
                  // Aperçu PLAT au VRAI ratio du support (portrait = haut, paysage = large, rond = cercle),
                  // grand et lisible, avec son propre fond. Le rendu « en situation » 3D reste dans le plein écran (⛶).
                  const r = item.shape === "round" ? 1 : item.ratio
                  let w: number, h: number
                  if (isMobile) {
                    // Le calcul vit dans apercuMobile.ts (testé) : il tient compte de la
                    // bande laissée par la feuille ET du plancher de lisibilité — un
                    // support très portrait devenait si étroit que le moteur de QR
                    // refusait de dessiner (« The canvas is too small »).
                    const d = dimensionsApercuMobile(bandeApercu, largeurApercu, r)
                    w = d.w; h = d.h
                  } else {
                    const boxW = 500, boxH = 500
                    w = r >= 1 ? boxW : boxH * r; h = r >= 1 ? boxW / r : boxH
                    if (h > boxH) { h = boxH; w = h * r }
                    if (w > boxW) { w = boxW; h = w / r }
                    w = Math.round(w); h = Math.round(h)
                  }
                  return (
                    <div onClick={() => { if (isMobile && sheetOpen && sheetPos !== "peek") setSheetPos("peek"); else setFsOpen(true) }} style={{ display: "flex", alignItems: "center", justifyContent: "center", ...(isMobile ? { height: Math.max(110, bandeApercu - (legendeVisible(bandeApercu) ? 30 : 0)), overflow: "hidden" } : { minHeight: 520 }), cursor: "zoom-in" }}>
                      <div style={{ width: w, height: h, flex: "none", borderRadius: item.shape === "round" ? "50%" : 14, overflow: "hidden", boxShadow: "0 28px 66px rgba(0,0,0,.55)" }}>
                        <SupportVisual item={item} {...designProps} physW={trimWidthMm(item)} w={w} h={h} onFocus={isMobile ? undefined : focusPanel} />
                      </div>
                    </div>
                  )
                })()}
                {!isMobile && <button onClick={e => { e.stopPropagation(); setFsOpen(true) }} aria-label="Voir en situation (plein écran)" title="Voir en situation" style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 11, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", fontSize: 17, lineHeight: 1, zIndex: 2 }}>⛶</button>}
              </div>}
          {/* Bascule « Aperçu / Édition libre » retirée : en Studio, l'édition libre est active d'office. */}
          {!showFlat && (!isMobile || legendeVisible(bandeApercu)) && (isMobile
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "6px 0 0" }}>
                <span style={{ color: C.fgMuted, fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{supportHint(item)} · {qrReady ? "votre QR est en place" : "ajoutez votre QR"}</span>
              </div>
            : <p style={{ textAlign: "center", color: C.fgMuted, fontSize: 11.5, margin: "8px 0 0" }}>{supportHint(item)} · {qrReady ? "votre QR est en place" : "ajoutez votre QR"}</p>)}
          {!showFlat && !isMobile && <p style={{ textAlign: "center", color: C.fgFaint, fontSize: 11, margin: "4px 0 0" }}>Cliquez le titre, le QR ou le fond de l'aperçu pour le régler directement.</p>}
          {showFlat && <>
            <p style={{ textAlign: "center", color: C.fgFaint, fontSize: 11, margin: "8px 0 0" }}>Cliquez un objet pour le régler · glissez pour le placer · double-clic pour écrire.</p>
            {sel && (isMobile
              ? <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}><button onClick={() => setSheetOpen(true)} style={chipStyle(true)}>Modifier l'élément</button></div>
              : <p style={{ textAlign: "center", color: C.gold, fontSize: 11, margin: "10px 0 0" }}>Élément sélectionné — onglet « Sélection », à droite.</p>)}
          </>}
        </div>

        {/* Volets — DESKTOP uniquement : colonne accordéon complète. (Mobile = sheet SIMPLIFIÉE, définie plus bas.) */}
        {/* ── RÉGLAGES (droite) — trois onglets, jamais d'accordéon ──────────
            Cinq volets se dépliaient et se repliaient dans une colonne qui
            défilait : pour changer une couleur puis une marge, il fallait fermer
            l'un, ouvrir l'autre, et retrouver sa place. Les onglets sont toujours
            visibles, et sélectionner un élément amène directement ses réglages. */}
        {!isMobile && (
        <div className="ps-panels" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div role="tablist" aria-label="Réglages" style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, marginBottom: 12, flex: "none" }}>
            {ONGLETS_DROITE.map(o => {
              const actif = ongletEffectif === (o.id as OngletDroite)
              return (
                <button key={o.id} role="tab" aria-selected={actif} onClick={() => { setOngletDroite(o.id); setSelEl(null) }}
                  style={{ flex: 1, minHeight: 38, borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: actif ? 700 : 500,
                    background: actif ? "var(--surface-2)" : "transparent", color: actif ? "var(--ink)" : C.fgMuted, boxShadow: actif ? "inset 0 -2px 0 var(--accent)" : "none" }}>{o.label}</button>
              )
            })}
            {sel && (
              <button role="tab" aria-selected={ongletEffectif === "selection"} onClick={() => setOngletDroite("selection")}
                style={{ flex: 1, minHeight: 38, borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: ongletEffectif === "selection" ? 800 : 600,
                  background: ongletEffectif === "selection" ? "var(--surface-2)" : "transparent", color: ongletEffectif === "selection" ? "var(--ink)" : C.gold, boxShadow: ongletEffectif === "selection" ? "inset 0 -2px 0 var(--accent)" : "none" }}>Sélection</button>
            )}
          </div>

          <div className="ps-onglet" style={{ overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column", gap: 14, paddingRight: 4 }}>
            {ongletEffectif === "selection" && sel && (
            <div style={{ background: C.surface, border: `1px solid ${C.goldA55}`, borderRadius: R.card, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: C.fg }}>{sel.kind === "text" ? "Texte" : sel.kind === "icon" ? "Icône" : "Forme"}</span>
                <button onClick={() => setSelEl(null)} aria-label="Désélectionner" style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
              </div>
              {sel.kind === "text" && <input value={sel.text} onChange={e => updateEl(sel.id, { text: e.target.value })} placeholder="Texte…" style={inputStyle} />}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <p style={secLabel}>{sel.kind === "shape" ? "Largeur" : "Taille"}</p>
                  {sel.kind === "shape"
                    ? <Range value={sel.w} min={0.05} max={0.9} step={0.01} onChange={v => updateEl(sel.id, { w: v })} />
                    : <Range value={sel.size} min={0.03} max={0.2} step={0.005} onChange={v => updateEl(sel.id, { size: v })} />}
                </div>
                <label title="Couleur" style={{ width: 44, height: 44, borderRadius: 11, border: `1px solid ${C.hairline}`, overflow: "hidden", position: "relative", flexShrink: 0, background: sel.color, cursor: "pointer" }}><input type="color" value={sel.color} onChange={e => updateEl(sel.id, { color: e.target.value })} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none" }} /></label>
              </div>
              {sel.kind === "shape" && <div><p style={secLabel}>Hauteur</p><Range value={sel.h2 ?? 0.12} min={0.01} max={0.9} step={0.01} onChange={v => updateEl(sel.id, { h2: v })} /></div>}
              {sel.kind === "text" && <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><Seg value={sel.align} options={["left", "center", "right"]} onPick={v => updateEl(sel.id, { align: v as any })} labels={["Gauche", "Centre", "Droite"]} /></div>
                <div style={{ flex: 1 }}><Seg value={String(sel.weight)} options={["400", "700", "800"]} onPick={v => updateEl(sel.id, { weight: Number(v) })} labels={["Fin", "Gras", "Extra"]} /></div>
              </div>}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => centerEl(sel.id, "x")} style={{ ...chipStyle(false), fontSize: 11.5 }}>Centrer ↔</button>
                <button onClick={() => centerEl(sel.id, "y")} style={{ ...chipStyle(false), fontSize: 11.5 }}>Centrer ↕</button>
                <button onClick={() => duplicateEl(sel.id)} style={{ ...chipStyle(false), fontSize: 11.5 }}>Dupliquer</button>
                <button onClick={() => bringFront(sel.id)} style={{ ...chipStyle(false), fontSize: 11.5 }}>Premier plan</button>
                <button onClick={() => sendBack(sel.id)} style={{ ...chipStyle(false), fontSize: 11.5 }}>Arrière-plan</button>
              </div>
              <button onClick={() => setAdvSel(v => !v)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.fgMuted, cursor: "pointer", fontSize: 12, padding: 0 }}>{advSel ? "Masquer les réglages avancés" : "Réglages avancés (position · rotation · opacité) →"}</button>
              {advSel && <>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><p style={secLabel}>Position X</p><Range value={sel.x} min={0} max={1} step={0.01} onChange={v => updateEl(sel.id, { x: v })} hint={`${Math.round(sel.x * 100)} %`} /></div>
                  <div style={{ flex: 1 }}><p style={secLabel}>Position Y</p><Range value={sel.y} min={0} max={1} step={0.01} onChange={v => updateEl(sel.id, { y: v })} hint={`${Math.round(sel.y * 100)} %`} /></div>
                </div>
                <div><p style={secLabel}>Rotation</p><Range value={sel.rot ?? 0} min={-180} max={180} step={1} onChange={v => updateEl(sel.id, { rot: v })} hint={`${Math.round(sel.rot ?? 0)}°`} /></div>
                <div><p style={secLabel}>Opacité</p><Range value={sel.opacity ?? 1} min={0.1} max={1} step={0.05} onChange={v => updateEl(sel.id, { opacity: v })} hint={`${Math.round((sel.opacity ?? 1) * 100)} %`} /></div>
              </>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 11.5, color: C.fgFaint }}>Flèches : déplacer · Suppr · Ctrl+D</span>
                <button onClick={() => deleteEl(sel.id)} style={{ background: "none", border: "none", color: C.bad, cursor: "pointer", fontSize: 12, padding: 0, whiteSpace: "nowrap" }}>Supprimer</button>
              </div>
            </div>

            )}
            {ongletEffectif === "contenu" && (<>
            <p style={secLabel}>Le QR</p>
            <Seg value={qrSource} options={["mine", "png"]} labels={["Mes QR", "Importer un PNG"]} onPick={v => setQrSource(v as "mine" | "png")} />
            {qrSource === "mine" ? (
              myQRs.length > 0 ? (
                <Field label="Votre QR code">
                  <select aria-label="QR code à placer" value={qrPickId} onChange={e => setQrPickId(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                    {myQRs.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                  </select>
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: C.fgFaint, lineHeight: 1.45 }}>On met en scène ce QR existant — il reste pilotable depuis vos QR codes (destination modifiable) même après impression.</p>
                  {blocAlerteQr}
                </Field>
              ) : (
                <p style={{ fontSize: 12.5, color: C.fgMuted, lineHeight: 1.5, margin: "10px 0 0" }}>Vous n'avez pas encore de QR. <Link href="/dashboard/qr-codes" style={{ color: C.gold, display: "inline-flex", alignItems: "center", minHeight: 40, margin: "-12px 0" }}>Créez-en un</Link>, ou importez un PNG ci-dessus.</p>
              )
            ) : (
              qrPng ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: "#fff", overflow: "hidden", flexShrink: 0, border: `1px solid ${C.hairline}` }}><img src={qrPng} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
                  <span style={{ flex: 1, fontSize: 11.5, color: C.fgMuted, lineHeight: 1.4 }}>QR importé — placé tel quel sur le support.</span>
                  <button onClick={() => setQrPng(null)} aria-label="Retirer le QR" style={{ background: "rgba(255,86,74,0.1)", border: "1px solid rgba(255,86,74,0.25)", borderRadius: 8, width: 34, height: 34, color: C.bad, cursor: "pointer", flexShrink: 0 }}><X size={15} /></button>
                </div>
              ) : (
                <button onClick={() => qrPngInput.current?.click()} style={{ marginTop: 10, width: "100%", minHeight: 44, borderRadius: 11, border: `1.5px dashed ${C.goldA55}`, background: C.goldSoft, color: C.gold, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Importer un PNG</button>
              )
            )}
            <input ref={qrPngInput} type="file" aria-label="Importer un QR code en PNG" accept="image/png,image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setQrPng(String(r.result)); r.readAsDataURL(f) } if (e.target) e.target.value = "" }} />
            {/* Taille du QR : 3 tailles sémantiques (Compact/Recommandé/Maximum) + barre fine, bornée à une
                plage SÛRE par support (anti-overflow : le QR ne peut plus écraser la composition — audit §6/§8). */}
            {(() => {
              const minDimMm = Math.min(trimWidthMm(item), item.hMm)
              // Borne RÉELLE du support (ajustement.partQrMax), pas une estimation : le
              // curseur annonçait des millimètres que le rendu ne pouvait pas donner.
              const qMax = (partQrMax(item.shape === "round", qrBadge as Pastille, item.shape === "round" ? 0.15 : 0.09, layout.content === "qrbig", modulesDuCode) * minDimMm) / item.qrMm
              // Le plancher de 20 mm est un PLANCHER : `Math.min` le faisait tomber dès que
              // la mise en page serrait — 63 combinaisons atteignables sous 20 mm sur les
              // 16 supports, la pire à 5,4 mm (relevé du 13 septembre). Voir
              // tailleQrImprimable.ts.
              const bornes = bornesCurseur(item.qrMm, qMax)
              const qMin = bornes.min
              const clampS = (v: number) => Math.min(qMax, Math.max(qMin, v))
              const sem = qrScale <= qMin + (qMax - qMin) * 0.34 ? "compact" : qrScale >= qMin + (qMax - qMin) * 0.67 ? "max" : "reco"
              const chips: [string, string, number][] = [["compact", "Compact", qMin], ["reco", "Recommandé", qMax < 1 ? (qMin + qMax) / 2 : 1], ["max", "Maximum", qMax]]
              return <Field label="Taille du QR">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>{chips.map(([cid, lab, val]) => (
                    <button key={cid} onClick={() => setQrScale(val)} style={{ flex: 1, minHeight: 40, borderRadius: 9, border: "none", cursor: "pointer", background: sem === cid ? "var(--surface-2)" : "transparent", color: sem === cid ? "var(--ink)" : C.fgMuted, boxShadow: sem === cid ? "inset 0 -2px 0 var(--accent)" : "none", fontSize: 12.5, fontWeight: sem === cid ? 700 : 500 }}>{lab}</button>
                  ))}</div>
                  <Range value={clampS(qrScale)} min={qMin} max={qMax} step={0.02} onChange={v => setQrScale(clampS(v))} hint={`${Math.round(item.qrMm * size.factor * qrScale)} mm · lisible ${distanceLisible(item.qrMm * size.factor * qrScale)}`} />
                  {bornes.troopetit && <p style={{ color: "var(--danger)", fontSize: 11.5, margin: "6px 0 0", lineHeight: 1.45 }}>Cette mise en page ne laisse que {bornes.minMm} mm au QR ; il en faut {MM_MIN_SCANNABLE} pour qu'il se scanne. Retirez un élément, ou choisissez un support plus grand.</p>}
                </div>
              </Field>
            })()}
            <Field label="Pastille"><Seg value={qrBadge} options={["carre", "cercle", "aucune"]} onPick={setQrBadge} labels={["Carré", "Cercle", "Aucune"]} /></Field>
            {/* Score QR en temps réel (§4/§10) — lisibilité mesurée, pas décorative. */}
            {(() => {
              const qc = preflight.checks.filter(c => ["contrast", "qrsize", "quiet"].includes(c.id) && c.status !== "na")
              const worst = qc.some(c => c.status === "fail") ? "fail" : qc.some(c => c.status === "warn") ? "warn" : "ok"
              const col = worst === "ok" ? C.ok : worst === "warn" ? C.gold : C.bad
              const label = worst === "ok" ? "QR lisible" : worst === "warn" ? "QR lisible — à surveiller" : "QR peu lisible"
              const dist = preflight.scanDistanceM ? ` · lisible ~${preflight.scanDistanceM} m` : ""
              return <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: col, background: C.surfaceUp, borderRadius: 999, padding: "6px 12px", alignSelf: "flex-start" }}>{worst === "ok" ? <Check size={13} /> : <AlertTriangle size={13} />} {label}{dist}</div>
            })()}
            <button onClick={() => setAdvQr(v => !v)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.fgMuted, textDecoration: "underline", cursor: "pointer", fontSize: 12, minHeight: 32, padding: 0, textAlign: "left" as const }}>{advQr ? "Masquer les réglages avancés" : "Réglages avancés (taille précise · position) →"}</button>
            {advQr && <>
              {layout.content === "stack" && !qrFree && <Field label="Position du QR"><Seg value={qrPos} options={["haut", "centre", "bas"]} onPick={setQrPos} labels={["Haut", "Centre", "Bas"]} /></Field>}
              <Field label="Position libre du QR"><Seg value={qrFree ? "libre" : "auto"} options={["auto", "libre"]} onPick={v => { setQrFree(v === "libre"); if (v === "libre") setLibre(true) }} labels={["Mise en page", "Libre (glisser)"]} /></Field>
              <Field label="Décalage horizontal"><Range value={qrDx} min={-1} max={1} step={0.1} onChange={setQrDx} hint={qrDx < -0.05 ? "← gauche" : qrDx > 0.05 ? "droite →" : "centré"} /></Field>
              <Field label="Décalage vertical"><Range value={qrDy} min={-1} max={1} step={0.1} onChange={setQrDy} hint={qrDy < -0.05 ? "↑ haut" : qrDy > 0.05 ? "bas ↓" : "centré"} /></Field>
            </>}
            <div style={{ height: 1, background: C.hairline, margin: "6px 0 2px" }} />
            <p style={secLabel}>Les textes</p>
            <Field label="Nom affiché" affiche={{ on: !masques.marque, basculer: () => basculer("marque") }}>
              <input {...textInputProps} value={brandText} onChange={e => setBrandText(e.target.value)} placeholder="Votre marque…" style={inputStyle} />
              <SuggRow items={BRANDNAMES} active={brand} onPick={setBrandText} />
            </Field>
            <Field label="Titre" affiche={{ on: !masques.titre, basculer: () => basculer("titre") }}>
              <input {...textInputProps} value={message} onChange={e => setMessage(e.target.value)} placeholder="Titre principal…" style={inputStyle} />
              {messages.length > 0 && <SuggRow items={messages} active={title} onPick={setMessage} />}
            </Field>
            <Field label="Sous-titre" affiche={{ on: !masques.sousTitre, basculer: () => basculer("sousTitre") }}><input {...textInputProps} value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Une ligne d'accroche…" style={inputStyle} /></Field>
            {champBouton}
            <button onClick={() => setAdvText(v => !v)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.fgMuted, textDecoration: "underline", cursor: "pointer", fontSize: 12, minHeight: 32, padding: 0, textAlign: "left" as const }}>{advText ? "Masquer la mise en forme" : "Casse · graisse · typo · alignement →"}</button>
            {advText && <>
              <Field label="Casse du titre"><Seg value={titleCase} options={["normal", "upper"]} onPick={setTitleCase} labels={["Aa normal", "MAJUSCULES"]} /></Field>
              <Field label="Graisse du titre"><Seg value={titleWeight} options={["fin", "normal", "gras"]} onPick={setTitleWeight} labels={["Fin", "Normal", "Gras"]} /></Field>
              <Field label="Typographie"><RailInline value={eTypo} options={TYPOS.map(t => ({ id: t.id, label: t.label }))} onPick={setETypo} /></Field>
              <Field label="Alignement"><Seg value={eAlign} options={["left", "center", "right"]} onPick={(v) => setEAlign(v as any)} labels={["Gauche", "Centre", "Droite"]} /></Field>
            </>}
            </>)}
            {ongletEffectif === "style" && (<>
            {mode === "studio" && <>
            <div>
              <p style={secLabel}>Ma charte</p>
              {brandKit && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 10px", borderRadius: 9, background: C.surfaceUp, border: `1px solid ${C.hairline}` }}>
                  {brandKit.logo && <Vignette src={brandKit.logo} alt="" style={{ width: 24, height: 24, borderRadius: 5, objectFit: "contain", background: "#fff", flexShrink: 0 }} />}
                  <span title="Couleur principale" style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `1px solid ${C.hairline}`, background: hexDAccent(brandKit!.accent) || "conic-gradient(from 210deg,#C9A84C,#D4483B,#3E9E6E,#3B6FD4,#7A5CD4,#C9A84C)" }} />
                  {brandKit.accent2 && <span title="Couleur secondaire (bouton)" style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `1px solid ${C.hairline}`, background: brandKit.accent2 }} />}
                  <span style={{ fontSize: 11, color: C.fgMuted, marginLeft: "auto", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{TYPOS.find(t => t.id === brandKit!.typo)?.label || "Du thème"}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                {brandKit && <button onClick={applyBrandKit} style={chipStyle(false)}>Appliquer</button>}
                <button onClick={saveBrandKit} style={{ ...chipStyle(false), whiteSpace: "nowrap" }}>{brandKit ? "Mettre à jour la charte" : "Enregistrer ma charte (logo · couleurs · police)"}</button>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11.5, color: C.fgFaint }}>Capture le look courant — logo, couleur principale (accent), secondaire (bouton), police.</p>
            </div>
            {/* « Mes modèles » : l'enregistrement du style courant (le choix d'un
                modèle se fait AVANT l'éditeur, voir phase « modele »). */}
          <div>
            <p style={secLabel}>Mes modèles</p>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
              {savedPresets.map(p => (
                <span key={p.id} style={{ ...chipStyle(activeSavedId === p.id), padding: "0 4px 0 12px", gap: 2 }}>
                  <button onClick={() => applyCfg(p.cfg)} style={{ background: "none", border: "none", color: "inherit", font: "inherit", fontWeight: "inherit", cursor: "pointer", padding: "8px 2px 8px 0" }}>{p.name}</button>
                  <button onClick={() => deletePreset(p.id)} aria-label="Supprimer ce modèle" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 8px", opacity: 0.6, fontSize: 15, lineHeight: 1 }}>×</button>
                </span>
              ))}
              {saving ? (
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <input autoFocus value={saveName} onChange={e => setSaveName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveCurrent(); if (e.key === "Escape") { setSaving(false); setSaveName("") } }} placeholder="Nom du modèle…" style={{ ...inputStyle, height: 40, width: 160 }} />
                  <button onClick={saveCurrent} style={{ ...chipStyle(true), minHeight: 40 }}>OK</button>
                  <button onClick={() => { setSaving(false); setSaveName("") }} aria-label="Annuler" style={{ ...chipStyle(false), minHeight: 40, padding: "0 12px" }}>×</button>
                </span>
              ) : (
                <button onClick={() => setSaving(true)} style={{ ...chipStyle(false), whiteSpace: "nowrap", flexShrink: 0 }}>＋ Enregistrer ce style</button>
              )}
            </div>
          </div>
            <div style={{ height: 1, background: C.hairline, margin: "8px 0 2px" }} />
            <p style={secLabel}>Ambiance &amp; accent</p>
            </>}
            <Field label="Ambiance">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {(showAllColors ? STYLES : ambiances.map(a => STYLE_BY_ID[a.rep])).map(s => (
                  <Swatch key={s.id} s={s} on={styleId === s.id} label={showAllColors ? s.label : undefined} onClick={() => { setStyleId(s.id); setFond("") }} />
                ))}
              </div>
              <button onClick={() => setShowAllColors(v => !v)} style={{ background: "none", border: "none", color: C.fgMuted, textDecoration: "underline", cursor: "pointer", fontSize: 12, marginTop: 8, padding: 0 }}>{showAllColors ? "Voir les ambiances" : `Voir les ${STYLES.length} coloris détaillés`}</button>
            </Field>
            <Field label="Couleur d'accent">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ACCENTS.map(a => (
                  <button key={a.id} onClick={() => setAccent(a.id)} title={a.label} style={{ width: 44, height: 44, borderRadius: 11, cursor: "pointer", border: `2px solid ${accent === a.id ? C.gold : "transparent"}`, boxShadow: accent === a.id ? `0 0 0 2px ${C.goldA33}` : "none", background: a.hex || "conic-gradient(from 210deg,#C9A84C,#D4483B,#3E9E6E,#3B6FD4,#7A5CD4,#C9A84C)", position: "relative" }}>
                    {a.id === "auto" && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.6)" }}>AUTO</span>}
                  </button>
                ))}
                <TuileCouleurLibre valeur={HEX6.test(accent) ? accent : ""} onChange={setAccent} />
              </div>
            </Field>
            <Field label="Couleur de fond"><ColorField value={fond} onChange={setFond} /></Field>
            </>)}
            {ongletEffectif === "page" && (<>
            <Field label="Disposition"><RailInline value={layoutId} options={LAYOUTS.filter(l => layoutOk(l.id, item)).map(l => ({ id: l.id, label: l.label }))} onPick={setLayoutId} /></Field>
            {mode === "studio" && <>
            <Field label="Fond"><RailInline value={bgFinish} options={FINISH_OPTS} onPick={setBgFinish} /></Field>
            <Field label="Photo de fond">
              {bgImage
                ? <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: `1px solid ${C.hairline}`, backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                    <span style={{ flex: 1, fontSize: 11.5, color: C.fgMuted, lineHeight: 1.4 }}>Photo en fond — voile de lisibilité auto.{bgCredit ? ` Photo : ${bgCredit} (Unsplash).` : ""}</span>
                    <button onClick={() => { setBgImage(null); setBgCredit("") }} aria-label="Retirer la photo" style={{ background: "rgba(255,86,74,0.1)", border: "1px solid rgba(255,86,74,0.25)", borderRadius: 8, width: 40, height: 40, color: C.bad, cursor: "pointer", flexShrink: 0 }}><X size={15} /></button>
                  </div>
                : <button onClick={() => bgInput.current?.click()} style={{ width: "100%", minHeight: 42, borderRadius: 11, border: `1.5px dashed ${C.goldA55}`, background: C.goldSoft, color: C.gold, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Importer une photo</button>}
              <input ref={bgInput} type="file" aria-label="Importer une image de fond" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setBgImage(String(r.result)); setBgCredit("") }; r.readAsDataURL(f) } if (e.target) e.target.value = "" }} />
              {/* Recherche de photos (Unsplash) — orientation calée sur le support */}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input value={bgSearch} onChange={e => setBgSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") searchPhotos() }} placeholder="Chercher une photo (café, nature…)" style={{ ...inputStyle, height: 42 }} />
                <button onClick={searchPhotos} disabled={bgLoading} style={{ ...chipStyle(false), minHeight: 42, whiteSpace: "nowrap" }}>{bgLoading ? "…" : "Chercher"}</button>
              </div>
              {bgMsg && <p {...propsAnnonce("info")} style={{ margin: "6px 0 0", fontSize: 11, color: C.fgFaint }}>{bgMsg}</p>}
              {bgPhotos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 8 }}>
                  {bgPhotos.map(p => (
                    <button key={p.id} className="ps-chip" onClick={() => { setBgImage(p.regular); setBgCredit(p.author || "") }} title={`Photo : ${p.author} · Unsplash`} style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", border: `1px solid ${bgImage === p.regular ? C.gold : C.hairline}`, cursor: "pointer", backgroundImage: `url(${p.thumb})`, backgroundSize: "cover", backgroundPosition: "center", padding: 0 }} />
                  ))}
                </div>
              )}
            </Field>
            <Field label="Cadre"><Seg value={frame} options={["aucun", "filet", "double", "coins"]} onPick={setFrame} labels={["Aucun", "Filet", "Double", "Coins"]} /></Field>
            <Field label="Taille du titre"><Range value={eTitle} min={0.7} max={1.4} step={0.05} onChange={setETitle} hint={`${Math.round(eTitle * 100)} %`} /></Field>
            <Field label="Air autour"><Range value={ePad} min={0.5} max={1.6} step={0.05} onChange={setEPad} hint={ePad < 0.85 ? "serré" : ePad > 1.2 ? "large" : "équilibré"} /></Field>
            {layout.content !== "band" && <Field label="Placement vertical"><Range value={blockY} min={-1} max={1} step={0.1} onChange={setBlockY} hint={blockY < -0.1 ? "vers le haut" : blockY > 0.1 ? "vers le bas" : "centré"} /></Field>}
            <Field label="Arrondi"><Seg value={eCorner} options={["vif", "adouci", "rond"]} onPick={setECorner} labels={["Vif", "Adouci", "Rond"]} /></Field>
            <Field label="Style du bouton"><Seg value={eAccent} options={["plein", "degrade", "trait", "aucun"]} onPick={setEAccent} labels={["Plein", "Dégradé", "Trait", "Aucun"]} /></Field>
            <Field label="Logo de marque">
              <Seg value={logo} options={["objet", "aucun"]} onPick={setLogo} labels={["Sur l'objet", "Aucun"]} />
              {logo === "objet" && (logoUrl
                ? <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: "#fff", overflow: "hidden", flexShrink: 0, border: `1px solid ${C.hairline}` }}><Vignette src={logoUrl} alt="" sizes="40px" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
                    <span style={{ flex: 1, fontSize: 11.5, color: C.fgMuted, lineHeight: 1.4 }}>Logo posé dans le coin du support.</span>
                    <button onClick={() => setLogoUrl(null)} aria-label="Retirer le logo" style={{ background: "rgba(255,86,74,0.1)", border: "1px solid rgba(255,86,74,0.25)", borderRadius: 8, width: 34, height: 34, color: C.bad, cursor: "pointer", flexShrink: 0 }}><X size={15} /></button>
                  </div>
                : <button onClick={() => logoInput.current?.click()} style={{ marginTop: 8, width: "100%", minHeight: 42, borderRadius: 11, border: `1.5px dashed ${C.goldA55}`, background: C.goldSoft, color: C.gold, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ajouter un logo</button>
              )}
              <input ref={logoInput} type="file" aria-label="Importer un logo" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setLogoUrl(String(r.result)); r.readAsDataURL(f) } if (e.target) e.target.value = "" }} />
            </Field>
            <button onClick={() => setAdvColor(v => !v)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.fgMuted, textDecoration: "underline", cursor: "pointer", fontSize: 12, minHeight: 32, padding: 0, textAlign: "left" as const }}>{advColor ? "Masquer les couleurs par élément" : "Couleurs par élément (avancé) →"}</button>
            {advColor && <>
              <Field label="Couleur du titre"><ColorField value={titleColor} onChange={setTitleColor} /></Field>
              <Field label="Couleur du sous-titre"><ColorField value={subColor} onChange={setSubColor} /></Field>
              <Field label="Couleur du bouton"><ColorField value={ctaColor} onChange={setCtaColor} /></Field>
            </>}
            <button onClick={resetDesign} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.fgMuted, cursor: "pointer", fontSize: 12, padding: 0, textDecoration: "underline" }}>Réinitialiser le design</button>
            </>}
            </>)}
          </div>
        </div>
        )}
      </div>

      {/* ── MOBILE : version SIMPLIFIÉE — Thème · Couleurs · Texte · QR uniquement (sheet courte, canvas visible). ── */}
      {isMobile && sheetMontee && (
        <>
          {/* Backdrop seulement en « full » (tap = revenir à half) ; en peek/half le canvas reste VISIBLE et interactif. */}
          {!paysage && sheetOpen && sheetPos === "full" && <div onClick={() => setSheetPos("half")} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 69, background: "rgba(0,0,0,0.35)" }} />}
          {/* Padding bas généreux : la barre d'onglets (zIndex 71) reste AU-DESSUS de la sheet → onglets toujours cliquables. */}
          <div style={paysage
            ? { position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 70, width: tiroirW, maxWidth: "58vw", overflowY: "auto", WebkitOverflowScrolling: "touch", background: C.bg, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, borderLeft: `1px solid ${C.hairline}`, boxShadow: "-16px 0 44px rgba(0,0,0,0.5)", padding: `0 16px calc(${HAUT_BARRE_PAYSAGE + 12}px + env(safe-area-inset-bottom))`, transform: sheetOpen ? "translateX(0)" : "translateX(112%)", transition: "transform var(--mo-sheet) var(--mo-ease-standard)", animation: "ps-sheet-in-x var(--mo-sheet) var(--mo-ease-standard)", display: "flex", flexDirection: "column", gap: 12 }
            : { position: "fixed", left: 0, right: 0, bottom: kb, zIndex: 70, height: kb ? `calc(74vh - ${kb}px)` : `${vhFeuille}vh`, maxHeight: "92vh", overflowY: "auto", WebkitOverflowScrolling: "touch", background: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTop: `1px solid ${C.hairline}`, boxShadow: "0 -16px 44px rgba(0,0,0,0.5)", padding: `0 16px ${kb ? "66px" : "calc(128px + env(safe-area-inset-bottom))"}`, transform: sheetOpen ? `translateY(${sheetDragPx}px)` : "translateY(112%)", animation: "ps-sheet-in-y var(--mo-sheet) var(--mo-ease-standard)", transition: sheetDragging ? "none" : "transform var(--mo-sheet) var(--mo-ease-standard), height var(--mo-sheet) var(--mo-ease-standard)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div data-barre-collante="" style={{ position: "sticky", top: 0, zIndex: 3, background: C.bg, paddingTop: 8 }}>
              {/* Handle : glisser pour changer de hauteur (snap au cran voisin) · tap pour passer au cran suivant. */}
              {!paysage && <div onPointerDown={onSheetDown} onPointerMove={onSheetMove} onPointerUp={onSheetUp} onPointerCancel={onSheetUp} role="slider" aria-label="Hauteur du panneau" aria-valuetext={sheetPos} tabIndex={0} style={{ touchAction: "none", cursor: "grab", padding: "2px 0 6px" }}>
                <div style={{ width: 40, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.22)", margin: "0 auto 8px" }} />
              </div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{mobileTab === "couleurs" ? "Couleurs" : mobileTab === "texte" ? "Texte" : "QR code"}</span>
                <button onClick={() => setSheetOpen(false)} aria-label="Fermer" style={{ background: "none", border: "none", color: C.fgMuted, cursor: "pointer", fontSize: 22, lineHeight: 1, minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "-8px -10px -8px 0" }}>×</button>
              </div>
            </div>

            {mobileTab === "couleurs" && <>
              <p style={secLabel}>Ambiance</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {(showAllColors ? STYLES : ambiances.map(a => STYLE_BY_ID[a.rep])).map(s => <Swatch key={s.id} s={s} on={styleId === s.id} label={showAllColors ? s.label : undefined} onClick={() => { setStyleId(s.id); setFond("") }} />)}
              </div>
              <button onClick={() => setShowAllColors(v => !v)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.fgMuted, textDecoration: "underline", cursor: "pointer", fontSize: 12, minHeight: 32, padding: 0, textAlign: "left" as const }}>{showAllColors ? "Voir les ambiances" : `Voir les ${STYLES.length} coloris`}</button>
              <p style={secLabel}>Couleur d'accent</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ACCENTS.map(a => (
                  <button key={a.id} onClick={() => setAccent(a.id)} title={a.label} style={{ width: 44, height: 44, borderRadius: 12, cursor: "pointer", border: `2px solid ${accent === a.id ? C.gold : "transparent"}`, boxShadow: accent === a.id ? `0 0 0 2px ${C.goldA33}` : "none", background: a.hex || "conic-gradient(from 210deg,#C9A84C,#D4483B,#3E9E6E,#3B6FD4,#7A5CD4,#C9A84C)", position: "relative" }}>
                    {a.id === "auto" && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.6)" }}>AUTO</span>}
                  </button>
                ))}
                <TuileCouleurLibre valeur={HEX6.test(accent) ? accent : ""} onChange={setAccent} />
              </div>
              <p style={secLabel}>Couleur de fond</p>
              <ColorField value={fond} onChange={setFond} />
            </>}

            {mobileTab === "texte" && <>
              <Field label="Nom affiché" affiche={{ on: !masques.marque, basculer: () => basculer("marque") }}><input {...textInputProps} value={brandText} onChange={e => setBrandText(e.target.value)} placeholder="Votre marque…" style={inputStyle} /></Field>
              <Field label="Titre" affiche={{ on: !masques.titre, basculer: () => basculer("titre") }}><input {...textInputProps} value={message} onChange={e => setMessage(e.target.value)} placeholder="Titre principal…" style={inputStyle} />{messages.length > 0 && <SuggRow items={messages} active={title} onPick={setMessage} />}</Field>
              <Field label="Sous-titre" affiche={{ on: !masques.sousTitre, basculer: () => basculer("sousTitre") }}><input {...textInputProps} value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Une ligne d'accroche…" style={inputStyle} /></Field>
              {champBouton}
              <Field label="Taille du titre"><Range value={eTitle} min={0.7} max={1.4} step={0.05} onChange={setETitle} hint={`${Math.round(eTitle * 100)} %`} /></Field>
              {layout.content !== "band" && <Field label="Position verticale"><Range value={blockY} min={-1} max={1} step={0.1} onChange={setBlockY} hint={blockY < -0.1 ? "vers le haut" : blockY > 0.1 ? "vers le bas" : "centré"} /></Field>}
              <Field label="Alignement"><Seg value={eAlign} options={["left", "center", "right"]} onPick={v => setEAlign(v as any)} labels={["Gauche", "Centre", "Droite"]} /></Field>
              <Field label="Typographie"><RailInline value={eTypo} options={TYPOS.map(t => ({ id: t.id, label: t.label }))} onPick={setETypo} /></Field>
            </>}

            {mobileTab === "qr" && <>
              {/* Source du QR — DOIT être accessible sur mobile (sinon export bloqué faute de QR). */}
              <Field label="Votre QR">
                <Seg value={qrSource} options={["mine", "png"]} labels={["Mes QR", "Importer un PNG"]} onPick={v => setQrSource(v as "mine" | "png")} />
                {qrSource === "mine"
                  ? (myQRs.length > 0
                      ? <>{<select aria-label="QR code à placer" value={qrPickId} onChange={e => setQrPickId(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer", marginTop: 8 }}>{myQRs.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}</select>}{blocAlerteQr}</>
                      : <p style={{ fontSize: 12, color: C.fgMuted, margin: "8px 0 0", lineHeight: 1.45 }}>Aucun QR — <Link href="/dashboard/qr-codes" style={{ color: C.gold }}>créez-en un</Link> ou importez un PNG.</p>)
                  : (qrPng
                      ? <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}><div style={{ width: 42, height: 42, borderRadius: 8, background: "#fff", overflow: "hidden", flexShrink: 0, border: `1px solid ${C.hairline}` }}><img src={qrPng} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div><span style={{ flex: 1, fontSize: 11.5, color: C.fgMuted }}>QR importé.</span><button onClick={() => setQrPng(null)} aria-label="Retirer le QR" style={{ background: "rgba(255,86,74,0.1)", border: "1px solid rgba(255,86,74,0.25)", borderRadius: 8, width: 34, height: 34, color: C.bad, cursor: "pointer", flexShrink: 0 }}><X size={15} /></button></div>
                      : <button onClick={() => qrPngInput.current?.click()} style={{ marginTop: 8, width: "100%", minHeight: 42, borderRadius: 11, border: `1.5px dashed ${C.goldA55}`, background: C.goldSoft, color: C.gold, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Importer un PNG</button>)}
                <input ref={qrPngInput} type="file" aria-label="Importer un QR code en PNG" accept="image/png,image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setQrPng(String(r.result)); r.readAsDataURL(f) } if (e.target) e.target.value = "" }} />
              </Field>
              {(() => {
                const minDimMm = Math.min(trimWidthMm(item), item.hMm)
                // Borne RÉELLE du support (ajustement.partQrMax), pas une estimation : le
              // curseur annonçait des millimètres que le rendu ne pouvait pas donner.
              const qMax = (partQrMax(item.shape === "round", qrBadge as Pastille, item.shape === "round" ? 0.15 : 0.09, layout.content === "qrbig", modulesDuCode) * minDimMm) / item.qrMm
                // Même plancher qu'au-dessus : voir tailleQrImprimable.ts.
                const bornes = bornesCurseur(item.qrMm, qMax)
                const qMin = bornes.min
                const clampS = (v: number) => Math.min(qMax, Math.max(qMin, v))
                const sem = qrScale <= qMin + (qMax - qMin) * 0.34 ? "compact" : qrScale >= qMin + (qMax - qMin) * 0.67 ? "max" : "reco"
                const chips: [string, string, number][] = [["compact", "Compact", qMin], ["reco", "Recommandé", qMax < 1 ? (qMin + qMax) / 2 : 1], ["max", "Maximum", qMax]]
                return <Field label="Taille du QR">
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>{chips.map(([cid, lab, val]) => (
                      <button key={cid} onClick={() => setQrScale(val)} style={{ flex: 1, minHeight: 40, borderRadius: 9, border: "none", cursor: "pointer", background: sem === cid ? "var(--surface-2)" : "transparent", color: sem === cid ? "var(--ink)" : C.fgMuted, boxShadow: sem === cid ? "inset 0 -2px 0 var(--accent)" : "none", fontSize: 12.5, fontWeight: sem === cid ? 700 : 500 }}>{lab}</button>
                    ))}</div>
                    <Range value={clampS(qrScale)} min={qMin} max={qMax} step={0.02} onChange={v => setQrScale(clampS(v))} hint={`${Math.round(item.qrMm * size.factor * qrScale)} mm · ${distanceLisible(item.qrMm * size.factor * qrScale)}`} />
                    {bornes.troopetit && <p style={{ color: "var(--danger)", fontSize: 11.5, margin: "6px 0 0", lineHeight: 1.45 }}>Cette mise en page ne laisse que {bornes.minMm} mm au QR ; il en faut {MM_MIN_SCANNABLE} pour qu'il se scanne. Retirez un élément, ou choisissez un support plus grand.</p>}
                  </div>
                </Field>
              })()}
              <Field label="Pastille"><Seg value={qrBadge} options={["carre", "cercle", "aucune"]} onPick={setQrBadge} labels={["Carré", "Cercle", "Aucune"]} /></Field>
              {(() => {
                const qc = preflight.checks.filter(c => ["contrast", "qrsize", "quiet"].includes(c.id) && c.status !== "na")
                const worst = qc.some(c => c.status === "fail") ? "fail" : qc.some(c => c.status === "warn") ? "warn" : "ok"
                const col = worst === "ok" ? C.ok : worst === "warn" ? C.gold : C.bad
                const label = worst === "ok" ? "QR lisible" : worst === "warn" ? "QR lisible — à surveiller" : "QR peu lisible"
                return <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: col, background: C.surfaceUp, borderRadius: 999, padding: "8px 12px", alignSelf: "flex-start" }}>{worst === "ok" ? <Check size={13} /> : <AlertTriangle size={13} />} {label}{preflight.scanDistanceM ? ` · ~${preflight.scanDistanceM} m` : ""}</div>
              })()}
              <p style={{ margin: 0, fontSize: 11, color: C.fgFaint, lineHeight: 1.4 }}>On met en scène votre QR existant — il reste pilotable (destination modifiable) même après impression.</p>
            </>}
          </div>
        </>
      )}

      {/* Barre d'action ancrée — mobile : onglets (ouvrent la sheet) + action ; desktop : statut + action.
          zIndex 71 > sheet (70) : les onglets restent tappables même sheet ouverte (peek/half = non modal). */}
      <div ref={mesureBarre.ref} className="ps-actionbar" style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "color-mix(in srgb, var(--surface) 92%, transparent)", borderTop: `1px solid ${C.hairline}`, backdropFilter: "blur(8px)", padding: "10px 16px calc(10px + env(safe-area-inset-bottom))", zIndex: isMobile ? 71 : 30 }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", flexDirection: paysage ? "row" : "column", alignItems: paysage ? "center" : undefined, gap: 8, minWidth: 0 }}>
          {/* `flex: 1` UNIQUEMENT couché : en portrait la barre est une COLONNE,
              et un flex-grow y étire la rangée d'onglets en hauteur — la pastille
              de statut venait alors recouvrir les onglets et volait leurs taps. */}
          {isMobile && (
            <div style={{ display: "flex", gap: 6, ...(paysage ? { flex: 1, minWidth: 0 } : null) }}>
              {([["couleurs", "Couleurs"], ["texte", "Texte"], ["qr", "QR"]] as const).map(([id, lbl]) => (
                <button key={id} onClick={() => { if (sheetOpen && mobileTab === id) setSheetOpen(false); else openSheet(id) }} style={{ ...chipStyle(sheetOpen && mobileTab === id), minHeight: 42, fontSize: 12.5, flex: 1 }}>{lbl}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", flexShrink: 0, minWidth: 0 }}>
            {(() => {
              // Statut d'export à 3 états (audit Écran 2 « à conserver ») : Prêt / À vérifier / Bloquant.
              const fails = preflight.checks.filter(c => c.status === "fail").length
              const warns = preflight.checks.filter(c => c.status === "warn").length
              const st = fails ? "block" : warns ? "warn" : "ready"
              const col = st === "ready" ? C.ok : st === "warn" ? C.gold : C.bad
              const bg = st === "ready" ? "var(--success-bg)" : st === "warn" ? C.goldSoft : "var(--danger-bg)"
              const bd = st === "ready" ? "color-mix(in srgb,var(--success) 30%,transparent)" : st === "warn" ? C.gold : "var(--danger-border)"
              const label = st === "ready" ? "Prêt à imprimer" : st === "warn" ? `À vérifier · ${warns}` : `${fails} à corriger`
              return <button onClick={() => setControl(true)} title="Voir la vérification" style={{ ...(paysage ? null : { marginRight: "auto" }), flexShrink: 0, whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, cursor: "pointer", color: col, background: bg, border: `1px solid ${bd}`, borderRadius: 999, padding: "0 14px", minHeight: 44, display: "inline-flex", alignItems: "center", gap: 6 }}>{st === "ready" ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />} {label}</button>
            })()}
            <Button variant="primary" onClick={() => setControl(true)}>Vérifier & exporter</Button>
          </div>
        </div>
      </div>

      {/* Barre « Terminé » au-dessus du clavier (§11) — ferme le clavier sans perdre le champ. */}
      {isMobile && typing && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: kb, zIndex: 90, display: "flex", justifyContent: "flex-end", padding: "8px 12px", background: "color-mix(in srgb, var(--surface) 96%, transparent)", borderTop: `1px solid ${C.hairline}`, backdropFilter: "blur(6px)" }}>
          <button onPointerDown={e => e.preventDefault()} onClick={() => { const a = document.activeElement as HTMLElement | null; a?.blur?.() }} style={{ ...chipStyle(true), minHeight: 40 }}>Terminé</button>
        </div>
      )}

      {/* Écran de VALIDATION & export — moment de satisfaction : score mis en scène + bénéfices + CTA clair. */}
      <Modal open={control} onClose={() => setControl(false)} title="Votre création" maxWidth={520}>
        {/* Score mis en scène (§8/§27) : gros chiffre + étoiles + titre + bénéfice de lecture. */}
        <div className="mo-pop-in" style={{ textAlign: "center", padding: "4px 0 16px" }}>
          {/* « 100 / 100 — Votre création est prête » s'affichait alors qu'AUCUN QR
              n'avait été choisi et que le téléchargement était bloqué. Les contrôles
              portent sur un QR d'exemple : tant qu'il n'y en a pas de vrai, le score
              ne promet rien, et il faut le dire. */}
          {/* Audit C7 : sans QR, une note n'a pas d'objet — elle n'est plus affichée. */}
          {qrReady && <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, color: hasFail ? C.bad : preflight.score >= 90 ? C.ok : C.gold }}>{preflight.score}<span style={{ fontSize: 17, fontWeight: 700, color: C.fgMuted }}> / 100</span></div>}
          {/* Étoiles ternes tant que le QR manque : cinq étoiles pleines sous
              « Il manque votre QR », c'était se contredire dans la même phrase. */}
          {qrReady && <div aria-hidden="true" style={{ fontSize: 16, letterSpacing: 2, margin: "6px 0 4px", color: C.gold }}>{"★".repeat(preflight.stars)}<span style={{ color: C.fgFaint }}>{"☆".repeat(5 - preflight.stars)}</span></div>}
          <div style={{ fontSize: 17, fontWeight: 600, color: C.fg }}>{hasFail ? "Un réglage à corriger" : !qrReady ? "Il manque votre QR" : "Votre création est prête"}</div>
          {!qrReady && <p style={{ margin: "8px auto 0", maxWidth: 340, fontSize: 12.5, color: C.fgMuted, lineHeight: 1.4 }}>Les contrôles ci-dessous portent sur la mise en page ; ils seront refaits avec votre QR.</p>}
          {preflight.scanDistanceM && !hasFail && qrReady && <p style={{ margin: "8px auto 0", maxWidth: 340, fontSize: 12.5, color: C.fgMuted, lineHeight: 1.4 }}>Estimation : lisible jusqu'à ~{preflight.scanDistanceM} m à cette taille. Validez en scannant le support imprimé, à sa taille réelle.</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {preflight.checks.filter(c => c.status !== "na").map(c => {
            const col = c.status === "ok" ? C.ok : c.status === "warn" ? C.gold : C.bad
            const bgA = c.status === "ok" ? C.okA22 : c.status === "warn" ? C.goldA22 : C.badA22
            const canFix = c.status !== "ok" && ["contrast", "qrsize", "quiet", "margin"].includes(c.id)
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 11, background: C.surfaceUp, border: `1px solid ${c.status === "ok" ? "transparent" : (c.status === "fail" ? C.badA55 : C.goldA55)}` }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", background: bgA, color: col }}>{c.status === "ok" ? <Check size={12} /> : <AlertTriangle size={12} />}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.fg }}>{c.label}</span>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.fgMuted, lineHeight: 1.35 }}>{c.detail}</p>
                </div>
                {canFix && <Button onClick={() => fixCheck(c.id)} variant="secondary" size="sm">Corriger</Button>}
              </div>
            )
          })}
        </div>
        {!qrReady && <p style={{ margin: "12px 0 0", fontSize: 12, color: C.gold, display: "inline-flex", alignItems: "center", gap: 6 }}><AlertTriangle size={13} /> Ajoutez d'abord votre QR — onglet « {isMobile ? "QR" : "Contenu"} ».</p>}
        {qrReady && blocAlerteQr}
        <div style={{ marginTop: 16 }}>
          <Button variant="primary" fullWidth disabled={!ok || !qrReady} leftIcon={<Download size={18} />} loading={relecture} onClick={async () => { if (await qrReluAvantImpression()) { setControl(false); setPrinting(true) } }}>{!ok ? "Corrigez les points rouges" : !qrReady ? "Ajoutez votre QR pour exporter" : relecture ? "Relecture du QR…" : "Imprimer ou enregistrer en PDF"}</Button>
        </div>
        <p style={{ color: C.fgFaint, fontSize: 11, textAlign: "center", margin: "8px 0 0" }}>{phraseFormatPdf(item)}, texte et QR vectoriels — via « Enregistrer en PDF » de l'impression.</p>
        {qrSource === "mine" && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: C.fgFaint }}>Autres formats — QR seul</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" fullWidth disabled={!ok || !qrReady || busy} leftIcon={done ? <Check size={16} /> : <Download size={16} />} onClick={() => exportQr("png")}>{busy ? "…" : done ? "Téléchargé" : "PNG"}</Button>
              <Button variant="secondary" fullWidth disabled={!ok || !qrReady || busy} onClick={() => exportQr("svg")}>SVG</Button>
              <Button variant="secondary" fullWidth disabled={!ok || !qrReady || busy} onClick={() => exportQr("pdf")}>PDF</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Décliner : choisir un autre support en gardant tout le design + textes + QR. */}
      {declineOpen && (
        <Modal open={declineOpen} onClose={() => setDeclineOpen(false)} title="Décliner sur un autre support" maxWidth={720}>
          <p style={{ margin: "0 0 14px", fontSize: 12.5, color: C.fgMuted }}>Le design, les textes et le QR sont conservés — même campagne, autre format.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
            {filterItems("Tout", "Tout").map(it => (
              <button key={it.id} className="ps-card" onClick={() => switchSupport(it.id)} style={{ textAlign: "left", background: it.id === item.id ? C.goldSoft : C.surfaceUp, border: `1px solid ${it.id === item.id ? `${C.goldA88}` : C.hairline}`, borderRadius: R.card, padding: 10, cursor: "pointer", color: C.fg, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ height: 96, borderRadius: 9, background: "radial-gradient(80% 70% at 50% 8%, #2a2e34, #16181c)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <MiniSupport item={it} style={style} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: C.fg }}>{it.name}{it.id === item.id && <span style={{ color: C.gold }}> · actuel</span>}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.fgFaint, fontFamily: "ui-monospace, monospace" }}>{it.size}</p>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Planche multi-supports : choisir plusieurs formats, tous avec le MÊME design. */}
      {campaignOpen && (
        <Modal open={campaignOpen} onClose={() => setCampaignOpen(false)} title="Planche multi-supports" maxWidth={720}
          footer={<Button variant="primary" fullWidth disabled={!campaign.length} leftIcon={<Download size={18} />} loading={relecture} onClick={async () => { if (campaign.length && await qrReluAvantImpression()) { setCampaignOpen(false); setMultiPrinting(true) } }}>Exporter la planche ({campaign.length} format{campaign.length > 1 ? "s" : ""}{campaignQty > 1 ? ` × ${campaignQty}` : ""})</Button>}>
          <p style={{ margin: "0 0 14px", fontSize: 12.5, color: C.fgMuted }}>Cochez les formats à imprimer ensemble (même design, mêmes textes, même QR). Une seule feuille, à découper.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
            {filterItems("Tout", "Tout").map(it => {
              const on = campaign.includes(it.id)
              return (
                <button key={it.id} className="ps-card" onClick={() => setCampaign(cur => on ? cur.filter(x => x !== it.id) : [...cur, it.id])} style={{ position: "relative", textAlign: "left", background: on ? C.goldSoft : C.surfaceUp, border: `1px solid ${on ? `${C.goldA88}` : C.hairline}`, borderRadius: R.card, padding: 10, cursor: "pointer", color: C.fg, display: "flex", flexDirection: "column", gap: 8 }}>
                  {on && <span style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: C.gold, color: "var(--ink-on-accent)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><Check size={13} /></span>}
                  <div style={{ height: 96, borderRadius: 9, background: "radial-gradient(80% 70% at 50% 8%, #2a2e34, #16181c)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <MiniSupport item={it} style={style} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: C.fg }}>{it.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.fgFaint, fontFamily: "ui-monospace, monospace" }}>{it.size}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 14 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 600, color: C.fgMuted }}>Exemplaires par format · {campaignQty}</p>
            <Range value={campaignQty} min={1} max={24} step={1} onChange={v => setCampaignQty(Math.round(v))} hint={`${(campaign.length || 1) * campaignQty} vignette${(campaign.length || 1) * campaignQty > 1 ? "s" : ""} au total`} />
          </div>
          <p style={{ color: C.fgFaint, fontSize: 11, textAlign: "center", margin: "10px 0 0" }}>Une feuille auto-dimensionnée, chaque exemplaire à sa taille réelle avec repère de découpe (idéal cartes/stickers en série).</p>
        </Modal>
      )}

      {/* Aperçu PLEIN ÉCRAN (mobile §2/§9) — tap/⛶ ouvre ; tap hors visuel, X ou Échap ferme. */}
      {fsOpen && (
        <div onClick={() => setFsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px)" }}>
          <button onClick={() => setFsOpen(false)} aria-label="Fermer l'aperçu" style={{ position: "absolute", top: "calc(env(safe-area-inset-top) + 12px)", right: 16, width: 42, height: 42, borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><X size={20} /></button>
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, maxWidth: "100%", maxHeight: "100%" }}>
            {/* Bascule Scène / Taille réelle (#24) — répond à « est-ce assez grand ? » avant impression. */}
            <div style={{ display: "inline-flex", gap: 3, background: "rgba(255,255,255,0.1)", borderRadius: 999, padding: 3 }}>
              {([["scene", "Scène"], ["real", "Taille réelle"]] as const).map(([id, lbl]) => {
                const on = realSize === (id === "real")
                return <button key={id} onClick={() => setRealSize(id === "real")} style={{ minHeight: 40, padding: "0 16px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: on ? 800 : 600, background: on ? "#fff" : "transparent", color: on ? "var(--ink-on-accent)" : "rgba(255,255,255,0.7)" }}>{lbl}</button>
              })}
            </div>
            {realSize ? (
              <>
                <div style={{ overflow: "auto", maxWidth: "92vw", maxHeight: "62vh", display: "flex", justifyContent: "center", alignItems: "flex-start", borderRadius: 8 }}>
                  <div style={{ flexShrink: 0 }}><SupportVisual {...designProps} item={item} physW={trimWidthMm(item)} w={Math.round(trimWidthMm(item) * pxPerMm)} h={Math.round(item.hMm * pxPerMm)} /></div>
                </div>
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 13, margin: 0 }}>Taille réelle : <b>{trimWidthMm(item)} × {item.hMm} mm</b> · QR ≈ <b>{(item.qrMm * effSize.factor).toFixed(1)} mm</b></p>
                {/* Le calibrage carte bancaire (85,6 mm) n'a de sens que sur un écran plus large qu'une carte → desktop. */}
                {!isMobile && <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Button onClick={() => setCalib(true)} variant="ghost" size="sm">Ajuster à mon écran</Button>
                </div>}
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.42)", fontSize: 11, margin: 0, maxWidth: 340 }}>Approximatif selon l'écran{!isMobile ? " — ajustez avec une carte bancaire pour une précision au millimètre." : "."}</p>
              </>
            ) : (
              <>
                <div style={{ width: "min(92vw, 76vh)", maxWidth: 760 }}><Packshot item={item} scene={scene} {...designProps} box={1400} /></div>
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0 }}>{supportHint(item)} · {qrReady ? "votre QR est en place" : "ajoutez votre QR"}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Calibrage écran (#24) — carte bancaire de référence : règle px/mm pour un aperçu au mm près (persisté). */}
      {calib && (
        <div style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: 24 }}>
          <p style={{ color: "#fff", fontSize: 14, textAlign: "center", maxWidth: 360, margin: 0, lineHeight: 1.45 }}>Placez une carte bancaire contre l'écran et ajustez jusqu'à ce que le rectangle ait <b>exactement</b> sa taille.</p>
          <div style={{ width: 85.6 * pxPerMm, height: 53.98 * pxPerMm, borderRadius: 3.18 * pxPerMm, border: `2px solid ${C.gold}`, background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.8)", fontSize: 12, flexShrink: 0 }}>Carte bancaire</div>
          <div style={{ width: "min(90vw, 360px)" }}><Range value={pxPerMm} min={2.5} max={7.5} step={0.01} onChange={v => { setPxPerMm(v); ecrire("qrowg-px-per-mm", String(v)) }} hint={`${pxPerMm.toFixed(2)} px/mm`} /></div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={() => { setPxPerMm(96 / 25.4); oublier("qrowg-px-per-mm") }} variant="ghost" size="sm">Réinitialiser</Button>
            <Button variant="primary" onClick={() => setCalib(false)}>Terminé</Button>
          </div>
        </div>
      )}

      {/* Bibliothèque d'éléments « + Ajouter » : formes + icônes catégorisées + recherche. */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Ajouter un élément" maxWidth={560}>
        <AddLibrary query={addSearch} setQuery={setAddSearch}
          onComp={(id) => { addComposition(id); setAddOpen(false) }}
          onText={() => { addFreeText(); setAddOpen(false) }}
          onShape={(s) => { addFreeShape(s); setAddOpen(false) }}
          onIcon={(n) => { addFreeIcon(n); setAddOpen(false) }} />
      </Modal>

      {/* État CONTRÔLÉ avant l'ouverture de la fenêtre d'impression (review P1) : plus de « flash blanc = plantage ».
          Écran-only (le CSS d'impression masque body * -> n'apparaît pas dans le PDF). */}
      {(printing || multiPrinting) && (
        <div aria-live="polite" style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(8,8,8,0.88)", backdropFilter: "blur(4px)" }}>
          <style>{`@keyframes psspin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.ps-spin{animation:none!important}}`}</style>
          <div className="ps-spin" style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${C.hairline}`, borderTopColor: C.gold, animation: "psspin .8s linear infinite" }} />
          <div style={{ fontSize: 17, fontWeight: 600, color: C.fg }}>Préparation de votre fichier PDF…</div>
          <div style={{ fontSize: 12.5, color: C.fgMuted, maxWidth: 320, textAlign: "center", lineHeight: 1.5 }}>La fenêtre d'impression va s'ouvrir — choisissez <b style={{ color: C.fg }}>« Enregistrer au format PDF »</b> comme destination.</div>
        </div>
      )}

      {/* Rendu de la PLANCHE multi-supports — monté seulement pendant l'impression. */}
      {multiPrinting && <MultiSheet items={campaignItems} design={designProps} />}

      {/* Planche d'impression — montée UNIQUEMENT pendant l'impression (évite un 2e moteur QR en fond). */}
      {/* Rendue sous <body> : à l'impression, tout le reste est retiré (cssDImpression). */}
      {printing && typeof document !== "undefined" && createPortal(<div className="ps-print-root" aria-hidden>
        <style>{cssDImpression(mediaDims(item).mediaWmm, mediaDims(item).mediaHmm)}</style>
        <PrintSheet item={item} style={style} pal={pal} layout={layout} brand={brandRendu} subtitle={sousTitreRendu} title={titreRendu} cta={cta} size={effSize} qrValue={qrValue} qrImg={qrImg} qrRendu={qrRendu} qrBadge={qrBadge} qrPos={qrPos} qrDx={qrDx} qrDy={qrDy} qrFree={qrFree} qrFx={qrFx} qrFy={qrFy} logo={logo} logoUrl={logoUrl} bgFinish={bgFinish} bgImage={bgImage} frame={frame} accent={accent} titleCase={titleCase} titleWeight={titleWeight} titleColor={titleColor} subColor={subColor} ctaColor={ctaColor} blockY={blockY} freeEls={freeEls} contentFree={contentFree} eCorner={eCorner} eAccent={eAccent} eTypo={eTypo} eAlign={eAlign} eTitle={eTitle} ePad={ePad} />
      </div>, document.body)}
    </div>
  )
}
