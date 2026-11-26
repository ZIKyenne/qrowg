  "use client"

  import { useState, useRef, useEffect, useCallback, useMemo, Component, memo } from "react"
  import PanneauGenerationIa from "./PanneauGenerationIa"
  import {
  X, ChevronUp, ChevronDown, Trash2, Eye, Plus, Check, Search, Copy, EyeOff, ExternalLink,
  MoreHorizontal, Sparkles, Pencil, Palette, Lightbulb,
  Smartphone, RefreshCw, Lock, Unlock, Layers, ArrowLeft, LayoutTemplate, Maximize2
  } from "lucide-react"
  import { BLOCK_CATEGORIES, SOCIAL_PRESETS, SOCIAL_URL_TEMPLATES, blockDecoration, normalizePageTheme, type Block, type BlockContent, type PageTheme } from "./types"
import { LIGNES_AGREGEES } from "@/lib/perimetreDeMesure"
import { ButtonLink, Button } from "@/components/ui/Button"
import { BLOCK_HINTS, PRESET_THEMES, IDENTITY_PRESETS, ACTION_PRESETS, COMMERCE_PRESETS, MEDIA_PRESETS, INFO_PRESETS } from "./editorPresets"
import { BLOCK_DEFS, blocsProposables } from "./blockDefs"
  import { type PageTemplate } from "./page-templates"
  // Un seul catalogue de modèles, le même que la galerie et /examples (vague 4, point 5, lot 2).
  import { CATALOGUE_DES_MODELES, GROUPES_DU_CATALOGUE } from "../templates/registreDesModeles"
  import { useUndoRedo, useResize, reorderArray, cloneBlocks, deplacerLeBloc } from "./builderHooks"
  import { scoreBlock } from "./builderSearch"
  import { CommandPalette, type PaletteCommand } from "./CommandPalette"
  import { OutlinePanel } from "./OutlinePanel"
  import { G, MUTED, IS_UUID, NOISE_SVG_URL, INITIAL_BLOCKS, INITIAL_NAME, type EditorSnapshot } from "./builderConstants"
  import { useRetenirLaSortie } from "@/lib/useTravailNonEnregistre"
  import { BlockPreview } from "./builderPreview"
  import { FUNNEL, marque, etiquette, precharge } from "@/lib/funnel"
  // Mémoïsé : lors d'une frappe, seul le bloc édité change de référence (setBlocks
  // via .map préserve les autres) -> les blocs inchangés ne re-rendent plus.
  // Props stables (block/theme/dayMode, aucun callback) -> aucun risque de rendu périmé.
  const MemoBlockPreview = memo(BlockPreview)
  import { EditPanel, ThemePanel } from "./builderPanels"
  import { InspecteurVide } from "./InspecteurVide"
  import QrowgLogo from "@/components/QrowgLogo"
import { motifDeFond } from "./types"
import { blocVoisin } from "./raccourcisClavier"
import { useRaccourcisDeLEditeur } from "./useRaccourcisDeLEditeur"
  import { BuilderStatus } from "./BuilderStatus"
  import { BlockLibrary } from "./BlockLibrary"
  import { essentialsForContext, contexteDeLaPage, ONGLET_DU_METIER } from "./builderLibrary"
  import { BlockSettingsPanel } from "./BlockSettingsPanel"
  import { CanvasToolbar } from "./CanvasToolbar"
  import { MobileBuilderShell } from "./MobileBuilderShell"
  import { PHRASE_EN_DIRECT } from "./builderUx"
  import BuilderWelcome from "./BuilderWelcome"
  import { InsertBetweenBlocks } from "./InsertBetweenBlocks"
  import { deviceFrameWidth, deviceLabel, canvasChrome, fitZoom, stepZoom, toggleOrientation, type CanvasDevice, type CanvasOrientation, type CanvasMode } from "./builderCanvas"
  import { useBuilderRedesign } from "./builderFlags"
  import { useIsMobile } from "@/lib/useIsMobile"
  import { useToast } from "@/components/Toast"
import { messageApresCreation, qrVisitable } from "@/lib/qrEnBrouillon"
import { limite } from "@/lib/limitesDeSaisie"
import { attente } from "@/lib/reponseAttendue"
  import { useConfirm } from "@/components/ui/Confirm"
  import QRCanvas from "../qr-codes/QRCanvas"
  import { getQRBlob, downloadBlob } from "../qr-codes/qrRender"
  import { createClient } from "@/lib/supabase/client"
  import { useSauvegardeAuto } from "./useSauvegardeAuto"
  import { persistSnapshot, repereDe, type PageSnapshot } from "./savePage"
  import { createPublishController } from "./publish"
  import { publishPage } from "./publishActions"
  import { safeErrorMessage, loadStateFromError, type LoadState } from "./builderErrors"
  import { printHandoff, printStudioUrl } from "../print-studio/handoff"
  import PublishedScreen from "./PublishedScreen"
  import { FenetrePublier } from "./FenetrePublier"
  import { AnnulerRetablir, AideDesRaccourcis, PanneauQrDeLaPage } from "./OutilsDeLaBarre"
  import { BarreMultiSelection } from "./BarreMultiSelection"
  import { ListeDeLaBibliotheque } from "./ListeDeLaBibliotheque"
  import { ReglagesDuBloc } from "./ReglagesDuBloc"
  import { browserStorage, loadDraft, saveDraft, clearDraft, makeDraft, draftIsMeaningful, draftSummary, type LocalDraft } from "./draftStore"
  import { useDialogue } from "@/components/ui/useDialogue"
import { ecrire, ecrireJson, lire, lireJson } from "@/lib/memoireDuNavigateur"
import { useHauteurReservee } from "@/lib/hauteurReservee"
  import { styleDeDescription } from "./descriptionQuiTient"
  import { ActionSheet } from "@/components/mobile/ActionSheet"

  // Frontiere d'erreur : isole un apercu de bloc qui planterait (contenu en cours d'edition
  // malforme) pour ne pas crasher toute la session du builder.
  class PreviewBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
    constructor(props: { children: React.ReactNode }) { super(props); this.state = { failed: false } }
    static getDerivedStateFromError() { return { failed: true } }
    componentDidUpdate(prev: { children: React.ReactNode }) { if (prev.children !== this.props.children && this.state.failed) this.setState({ failed: false }) }
    render() { return this.state.failed
      ? <div style={{ padding: "12px 16px", textAlign: "center", color: "var(--muted)", fontSize: 11 }}>⚠ Aperçu indisponible pour ce bloc</div>
      : this.props.children }
  }



  export default function BuilderV4({ pageId }: { pageId?: string }) {
  // Une barre qui reste en haut réserve sa hauteur dans sa zone (lot v143).
  useHauteurReservee()
    const confirm = useConfirm()
    const toast = useToast()
    const undoRedo = useUndoRedo<EditorSnapshot>({ blocks: INITIAL_BLOCKS, theme: PRESET_THEMES.midnight_gold, name: INITIAL_NAME })
    // Refs synchronisées : thème/nom lus AU MOMENT d'un push d'historique (les push
    // de blocs et de nom ont besoin du thème courant, et inversement).
    const themeRef = useRef<PageTheme>(PRESET_THEMES.midnight_gold)
    const nameRef = useRef(INITIAL_NAME)
    const [blocks, setBlocksRaw] = useState<Block[]>(INITIAL_BLOCKS)

    // setBlocks avec push historique automatique.
    // `coalesceKey` (optionnel) : regroupe les frappes rapides sur un même champ en
    // une seule entrée d'undo (voir useUndoRedo). Les opérations structurelles n'en
    // passent pas -> chacune reste une entrée distincte.
    const setBlocks = useCallback((updater: Block[] | ((prev: Block[]) => Block[]), skipHistory = false, coalesceKey?: string) => {
      setBlocksRaw(prev => {
        const next = typeof updater === "function" ? updater(prev) : updater
        // Rien n'a changé (bloc verrouillé, extrémité) : pas d'entrée d'annulation vide.
        if (next === prev) return prev
        if (!skipHistory) undoRedo.push({ blocks: next, theme: themeRef.current, name: nameRef.current }, coalesceKey)
        return next
      })
    }, [undoRedo])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [multiSelection, setMultiSelection] = useState<string[]>([])
    // Glisser-déposer (Phase 2 §2.14) : index du bloc glissé + position d'insertion.
    const [dragIdx, setDragIdx] = useState<number | null>(null)
    const [dropBefore, setDropBefore] = useState<number | null>(null)
    const [paletteOpen, setPaletteOpen] = useState(false) // palette de commandes (Cmd/Ctrl+K)
    const [outlineOpen, setOutlineOpen] = useState(false)  // plan de la page (outline)
    // Refs synchronisées : lecture fraîche de la sélection / des blocs depuis le
    // handler clavier global (deps []), sans re-souscrire l'écouteur à chaque frappe.
    const blocksKbRef = useRef(blocks)
    const selectedIdKbRef = useRef(selectedId)
    // Sélection d'ouverture (premier bloc) déjà faite pour cette page ? (revue du 9 septembre)
    const premierBlocChoisiRef = useRef<string | undefined>(undefined)
    useEffect(() => { blocksKbRef.current = blocks }, [blocks])
    useEffect(() => { selectedIdKbRef.current = selectedId }, [selectedId])
    // multiSelection était lu depuis le state figé au montage dans le handler
    // clavier (deps []) -> Ctrl+A/Suppr multi cassés. On passe par une ref fraîche.
    const multiSelectionKbRef = useRef(multiSelection)
    useEffect(() => { multiSelectionKbRef.current = multiSelection }, [multiSelection])
    // Refs vers les actions (redéfinies à chaque render) : le handler clavier doit
    // appeler la DERNIÈRE version, pas celle capturée au montage.
    const deleteMultiRef = useRef<() => void>(() => {})
    const deleteBlockRef = useRef<(id: string) => void>(() => {})
    // Presse-papier de blocs + actions copier/coller/dupliquer (appelées via ref
    // depuis le handler clavier global, toujours à jour). Voir §2.5 du plan.
    const clipboardRef = useRef<Block[]>([])
    const copyRef = useRef<() => void>(() => {})
    const pasteRef = useRef<() => void>(() => {})
    const duplicateSelRef = useRef<() => void>(() => {})
    const [pageName, setPageName] = useState("Ma Page")
    const [pageSlug, setPageSlug] = useState("ma-page")
    const [pageStatus, setPageStatus] = useState("draft")
    const [theme, setTheme] = useState<PageTheme>(PRESET_THEMES.midnight_gold)
    // Sync refs pour les push d'historique (thème/nom lus au moment du push).
    useEffect(() => { themeRef.current = theme }, [theme])
    useEffect(() => { nameRef.current = pageName }, [pageName])
    // Applique un snapshot (undo/redo) : restaure blocs + thème + nom via les setters
    // BRUTS -> AUCUN nouveau push. Stable (useCallback) pour le handler clavier.
    const applySnapshot = useCallback((s: EditorSnapshot) => {
      setBlocksRaw(s.blocks); setTheme(s.theme); setPageName(s.name)
    }, [])
    // Poser un DOCUMENT dans l'éditeur : blocs, thème, nom — ET l'historique qui va
    // avec. Un seul geste, parce que les séparer a déjà coûté une page : le 29
    // septembre, un modèle de dix blocs hydraté sans reset laissait pour seul passé
    // le squelette du montage, et la PREMIÈRE annulation le ramenait par-dessus
    // (titre « Ma Page » compris), à charge pour l'autosave de le persister.
    // Toute entrée de document passe ici : page relue en base, brouillon d'un
    // visiteur, brouillon repris après inscription, blocs renumérotés.
    // Les refs thème/nom sont posées TOUT DE SUITE : elles sont normalement
    // synchronisées par un effet, et un push survenant avant cet effet lirait
    // l'ancien thème.
    const hydrater = useCallback((s: EditorSnapshot) => {
      setBlocksRaw(s.blocks); setTheme(s.theme); setPageName(s.name)
      themeRef.current = s.theme; nameRef.current = s.name
      undoRedo.reset(s)
    }, [undoRedo])
    // Change le thème ET l'enregistre dans l'historique (coalescé "theme" : un réglage
    // continu de curseur = une seule entrée d'undo). Utilisé par le panneau Thème.
    const commitTheme = useCallback((updater: PageTheme | ((p: PageTheme) => PageTheme)) => {
      const nt = typeof updater === "function" ? (updater as (p: PageTheme) => PageTheme)(themeRef.current) : updater
      setTheme(nt)
      undoRedo.push({ blocks: blocksKbRef.current, theme: nt, name: nameRef.current }, "theme")
    }, [undoRedo])
    // Plan de l'utilisateur (gating UI de l'animation d'entrée ; l'enforcement réel
    // est côté serveur au rendu de la page publique).
    const [userPlan, setUserPlan] = useState<string | null>(null)
    // Mode invité : on compose AVANT de créer un compte. Tant que la session n'est
    // pas connue on ne déclenche rien de réseau — sinon un visiteur anonyme sur
    // /builder/new déclencherait une création de page vouée à un 401.
    const [authState, setAuthState] = useState<"unknown" | "guest" | "user">("unknown")
    const guest = authState === "guest"
    useEffect(() => {
      const sb = createClient()
      sb.auth.getUser().then(({ data }) => {
        if (!data.user) { setAuthState("guest"); return }
        setAuthState("user")
        sb.from("profiles").select("plan").eq("id", data.user.id).single()
          // « free » et non null : null veut dire « pas encore lu » (panneau IA, generationIa.ts).
          .then(({ data: p }) => setUserPlan((p as any)?.plan ?? "free"))
      }).catch(() => setAuthState("guest"))
    }, [])
    const [rightTab, setRightTab] = useState<"preview"|"edit"|"theme">("edit")
    // Inspecteur (9 septembre, maquette) : trois onglets toujours visibles — Contenu · Style ·
    // Effets — et « Réglages avancés » replié en bas. Les anciens onglets « Mise en page » et
    // « Avancé » vivent respectivement dans Style et dans le repli : aucun réglage n'a disparu.
    const [editTab, setEditTab] = useState<"contenu"|"style"|"effets">("contenu")
    const [avanceOuvert, setAvanceOuvert] = useState(false)
    // Mode Simple (defaut) = un seul contexte "Contenu" (audit #10/#14 "montrer moins"). Expert = 4 onglets.
    // Defaut false = ce que rend le SSR ; on lit localStorage APRES montage (pas de mismatch d'hydratation),
    // et on persiste DANS le setter (pas dans un effet -> pas d'ecrasement au montage). Cf review #2.
    const [expertMode, setExpertModeRaw] = useState(false)
    useEffect(() => { try { if (lire("qrfolio_expert_mode") === "1") { setExpertModeRaw(true); setAvanceOuvert(true) } } catch {} }, [])
    const setExpertMode = (v: boolean | ((p: boolean) => boolean)) => setExpertModeRaw(prev => {
      const next = typeof v === "function" ? v(prev) : v
      ecrire("qrfolio_expert_mode", next ? "1" : "0")
      return next
    })
    // Modeles par metier : menu deplie a la demande (replie par defaut) pour alleger la palette.
    const [metierOpen, setMetierOpen] = useState(false)
    const [styleClipboard, setStyleClipboard] = useState<Record<string, string> | null>(null)
    const [showTemplates, setShowTemplates] = useState(false)
    const [templateGroup, setTemplateGroup] = useState<string>(GROUPES_DU_CATALOGUE[0])
    const [activeCategory, setActiveCategory] = useState("essentials")
    const [search, setSearch] = useState("")
    const [dayMode] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [saveError, setSaveError] = useState(false)
    const [saveErrorMsg, setSaveErrorMsg] = useState("")
    const [hasUnsaved, setHasUnsaved] = useState(false)
    // ID reel de la page en base. Si l'URL est /builder/new (pageId non-UUID),
    // on cree d'abord la page puis on bascule sur son vrai UUID.
    const [liveId, setLiveId] = useState<string | undefined>(() => (IS_UUID(pageId) ? pageId : undefined))
    const [bootstrapError, setBootstrapError] = useState("")
    // État de chargement d'une page existante : distingue chargé / absente / accès refusé /
    // erreur récupérable. loadNonce permet de relancer le chargement (bouton « Réessayer »).
    const [loadState, setLoadState] = useState<LoadState>("loading")
    const [loadNonce, setLoadNonce] = useState(0)
    const creatingRef = useRef(false)
    // ── Essai sans inscription ────────────────────────────────────────────────
    // Le brouillon d'un visiteur vit dans son navigateur (la table `pages` impose
    // user_id NOT NULL : une page anonyme ne peut pas exister en base).
    const claimRef = useRef<LocalDraft | null>(null)   // brouillon à reprendre juste après l'inscription
    const [claimed, setClaimed] = useState(false)
    const modifRef = useRef(false)                     // repère « page modifiée » : une seule fois
    const wantPublishRef = useRef(false)               // « publier » cliqué AVANT le compte
    const autoPubRef = useRef(false)                   // la mise en ligne automatique n'a lieu qu'une fois
    const publieeRef = useRef(false)                   // repère « page publiée » : une seule fois
    // Première mise en ligne : un écran qui reste, contrairement au « Page publiée ! »
    // du bouton, qui disparaissait au bout de 3,5 s. Se ferme sur décision, pas sur minuterie.
    const [premiereEnLigne, setPremiereEnLigne] = useState(false)
    const blocksRef = useRef(0)                        // nb de blocs, lisible depuis un callback stable
    // La mesure est chargée d'avance : le repère « publier sans compte » est posé
    // juste avant de quitter la page, il n'aurait pas le temps de partir sinon.
    useEffect(() => { precharge() }, [])      // confirmation « votre travail a été repris »
    const guestReady = useRef(false)                   // brouillon restauré : la sauvegarde locale peut démarrer
    // Reprise de brouillon : la page vient d'être créée VIDE en base et son contenu
    // n'est encore qu'en mémoire. Sans ce garde, le chargement qui suit lisait zéro
    // bloc et écrasait la page reprise — tout le travail du visiteur, perdu à la
    // dernière seconde. On saute ce premier chargement ; l'autosave écrit la suite.
    const skipLoadRef = useRef(false)
    const draftTimer = useRef<any>(null)
    const [draftState, setDraftState] = useState<"idle" | "saved" | "too_big" | "unavailable">("idle")
    const [draftFound, setDraftFound] = useState<LocalDraft | null>(null)   // proposition « reprendre »
    const [fromTemplate, setFromTemplate] = useState(false)                 // arrivée depuis la galerie
    const templateKeyRef = useRef<string | undefined>(undefined)            // modèle d'origine, à ne pas perdre
    const [showPublishPopup, setShowPublishPopup] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [publishSuccess, setPublishSuccess] = useState(false)
    const [publishWasUpdate, setPublishWasUpdate] = useState(false) // succès = mise à jour (déjà publiée) vs 1re publication
    const [publishError, setPublishError] = useState("")
    const [qrShortCode, setQrShortCode] = useState("")
    // Cible du QR (lien de scan) + telechargement PNG genere en local (sans API externe).
    const qrTarget = qrShortCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/q/${qrShortCode}` : ""
    // Pont vers l'atelier d'impression : on déduit métier, usage et textes depuis la page elle-même,
    // pour que l'utilisateur atterrisse sur un support déjà rempli au lieu d'une page blanche.
    const handoff = useMemo(() => printHandoff({ title: pageName, blocks: blocks.filter(b => b.visible !== false) }), [pageName, blocks])
    const downloadQrPng = async () => {
      if (!qrTarget) return
      const b = await getQRBlob({ data: qrTarget, fg: "#080808", bg: "#FFFFFF", ecc: "M", style: {}, size: 512 }, "png")
      if (b) downloadBlob(b, "qrcode.png")
    }
    const [pageStats, setPageStats] = useState({ views: 0, scans: 0 })
    const [clickCounts, setClickCounts] = useState<Record<string, number>>({}) // clics par bloc (90j) pour le compteur builder
    // Vrai s'il reste des modifications non encore sauvegardees (evite la perte de donnees
    // si l'onglet est ferme/recharge pendant le debounce de sauvegarde).
    const dirty = useRef(false)
    // Vrai seulement une fois la page CHARGEE (existante) ou CREEE (nouvelle). Empeche la
    // sauvegarde de partir avec les blocs de demo par defaut avant que load() n'ait ramene
    // les vrais blocs -> sinon, sur connexion lente, on ecraserait le contenu reel.
    // Armé par un effet APRÈS l'autosave, dans le rendu de la page chargée (v390) : avant, à la fin des lectures QR/clics.
    const ready = useRef(false); const [armement, setArmement] = useState(0)

    // ── États collapse panneaux ────────────────────────────────────────────────
    // Préférences lues APRÈS le montage (20 nov.) : lues dans l'état initial, elles
    // donnaient côté navigateur un autre arbre que le HTML du serveur (qui n'a pas
    // de stockage) — React jetait alors tout l'éditeur pour le refaire, à chaque
    // chargement d'un commerçant qui avait replié un panneau.
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [blocksCollapsed, setBlocksCollapsed] = useState(false)
    useEffect(() => {
      if (lire("qrfolio_sidebar_collapsed") === "true") setSidebarCollapsed(true)
      if (lire("qrfolio_blocks_collapsed") === "true") setBlocksCollapsed(true)
    }, [])
    const [rightCollapsed, setRightCollapsed] = useState(false)
    const [focusMode, setFocusMode] = useState(false)
    const [drawerCategory, setDrawerCategory] = useState<string|null>(null)
    const drawerRef = useRef<HTMLDivElement>(null)

    // Persister collapse sidebar
    useEffect(() => {
      if (typeof window !== "undefined") ecrire("qrfolio_sidebar_collapsed", String(sidebarCollapsed))
    }, [sidebarCollapsed])

    // Écran étroit (1024–1365 px) sans préférence enregistrée : la bibliothèque s'ouvre repliée,
    // le canevas d'abord (revue du 9 septembre). Décidé au montage — pas dans l'initialiseur, qui
    // ferait diverger le rendu serveur du rendu client. Déclaré AVANT l'effet qui mémorise le choix.
    useEffect(() => {
      if (lire("qrfolio_blocks_collapsed") !== null) return
      if (window.innerWidth >= 1024 && window.innerWidth < 1366) setBlocksCollapsed(true)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    useEffect(() => {
      if (typeof window !== "undefined") ecrire("qrfolio_blocks_collapsed", String(blocksCollapsed))
    }, [blocksCollapsed])

    // ── Raccourcis clavier ────────────────────────────────────────────────────
    // La table des seize raccourcis est une règle pure, dans raccourcisClavier.ts :
    // ici on ne fait qu'exécuter ce qu'elle décide.
    // Le câble (écoute, champ de saisie, touche confisquée) : useRaccourcisDeLEditeur.
    const replier = (valeur: boolean) => { setSidebarCollapsed(valeur); setBlocksCollapsed(valeur); setRightCollapsed(valeur) }
    useRaccourcisDeLEditeur(
      () => ({ blocSelectionne: !!selectedIdKbRef.current, selectionMultiple: multiSelectionKbRef.current.length > 0 }),
      d => {
        switch (d.action) {
          case "palette":          setPaletteOpen(o => !o); return
          case "paletteOuvrir":    setPaletteOpen(true); return
          case "annuler":          { const p = undoRedo.undo(); if (p) applySnapshot(p); return }
          case "retablir":         { const n = undoRedo.redo(); if (n) applySnapshot(n); return }
          case "bibliotheque":     setBlocksCollapsed(p => !p); setFocusMode(false); return
          case "editeur":          setRightCollapsed(p => !p); setFocusMode(false); return
          case "apercu":           setRightCollapsed(false); setRightTab("edit"); return
          case "dupliquer":        duplicateSelRef.current(); return
          case "copier":           copyRef.current(); return
          case "coller":           pasteRef.current(); return
          case "focus":            setFocusMode(prev => { const next = !prev; replier(next); return next }); return
          case "deselectionner":   setMultiSelection([]); setSelectedId(null); return
          case "toutSelectionner": setMultiSelection(blocksKbRef.current.map(b => b.id)); return
          case "supprimerSelection": deleteMultiRef.current(); return
          case "supprimerBloc":    deleteBlockRef.current(selectedIdKbRef.current!); return
          case "deplacerBloc":     { const cur = selectedIdKbRef.current!; setBlocks(p => deplacerLeBloc(p, cur, d.direction!)); return }
          case "deplacerSelection": { const v = blocVoisin(blocksKbRef.current, selectedIdKbRef.current, d.direction!); if (v) { setMultiSelection([]); setSelectedId(v) } return }
        }
      },
    )

    // Fermer drawer au clic extérieur
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setDrawerCategory(null)
      }
      if (drawerCategory) document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }, [drawerCategory])

    function toggleBlocks() { setBlocksCollapsed(p => !p); setFocusMode(false) }
    function toggleRight() { setRightCollapsed(p => !p); setFocusMode(false) }

    // ── Resize panneaux ────────────────────────────────────────────────────
    // Largeurs par défaut (revue du 9 septembre) : rail 76 + bibliothèque 260 + inspecteur 300 = 636 px,
    // le canevas garde ≥ 55 % de la largeur dès 1440 px (53 % à 1366) ; en dessous, la bibliothèque
    // s'ouvre repliée (icônes) la première fois — un clic la déploie, rien n'est retiré.
    const blocksResize = useResize("blocks", 260, 240, 520)
    const rightResize = useResize("right", 300, 280, 520)
    // Responsive : sous 1024px, les 3 colonnes (palette | page | réglages) ne tiennent plus côte à côte.
    // On bascule en mode « un panneau à la fois » piloté par une barre d'onglets en bas.
    const isMobile = useIsMobile(1024)
    const focusNarrow = useIsMobile(1500) // < 1500 : en Focus, on masque la colonne Aperçu (le canvas fait office d'aperçu) → 2 colonnes
    const [mobileTab, setMobileTab] = useState<"blocks"|"canvas"|"panel">("canvas")
    // C04 — canvas responsive (actif seulement avec BUILDER_REDESIGN). Défauts = neutres (fluid/100 %)
    // → identique à l'existant tant que l'utilisateur ne change rien.
    const [canvasDevice, setCanvasDevice] = useState<CanvasDevice>("fluid")
    const [canvasOrientation, setCanvasOrientation] = useState<CanvasOrientation>("portrait")
    const [canvasZoom, setCanvasZoom] = useState(1)
    const [canvasMode, setCanvasMode] = useState<CanvasMode>("edit")
    // C06 — activation progressive : valeur ENV au 1er rendu (SSR-safe), override canary après montage.
    const BUILDER_REDESIGN = useBuilderRedesign()
    const [blockMenu, setBlockMenu] = useState<string | null>(null) // #10 : actions secondaires d'un bloc en bottom sheet
    // La feuille « ⋯ » d'un bloc est une vraie fenêtre modale : rôle, Échap,
    // piège de focus, focus rendu au bouton « ⋯ ».
    // La proposition « reprendre votre page » s'annonçait modale sans l'être : la
    // tabulation en sortait. Échap n'y ferme rien — elle décide du sort d'un
    // brouillon, et un choix ne se prend pas par accident (lot v122).
    const { ref: repriseDlg, props: repriseDlgProps } = useDialogue(!!draftFound, () => {}, { label: "Reprendre votre page" })
    const [blockSearchFocus, setBlockSearchFocus] = useState(false) // #13 : recherche de bloc focus -> on masque la barre du bas pour degager les resultats
    const [preview, setPreview] = useState(false) // #02 : mode Apercu plein ecran (masque tout le chrome d'edition)
    // En mobile, les panneaux occupent 100% : on force l'état déplié (le mode réduit à icônes n'a plus de sens).
    useEffect(() => { if (isMobile) { setBlocksCollapsed(false); setRightCollapsed(false) } }, [isMobile])

    // ── Favoris ───────────────────────────────────────────────────────────────
    // ── Popover aperçu bloc ─────────────────────────────────────────────────
    const [popover, setPopover] = useState<{ type: string; x: number; y: number } | null>(null)
    const popoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const showPopover = useCallback((type: string, e: React.MouseEvent | React.FocusEvent) => {
      clearTimeout(popoverTimer.current)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      popoverTimer.current = setTimeout(() => {
        setPopover({ type, x: rect.right + 8, y: rect.top })
      }, 300)
    }, [])

    // Les commandes d'un bloc apparaissaient au seul survol : ni le clavier ni le doigt (lot v146).
    // Une commande invisible ne doit pas être touchable (20 nov.) : à opacité 0,
    // les boutons Monter/Descendre/Dupliquer restaient cliquables. Au téléphone,
    // toucher le milieu d'un bloc bas (un texte d'une ligne) appuyait sur
    // « Monter » qu'on ne voyait pas — le bloc changeait de place au lieu de
    // s'ouvrir. Opacité et capacité à recevoir le doigt vont donc ensemble.
    const commandesDuBloc = useCallback((cadre: HTMLElement, visible: boolean) => {
      for (const s of [".block-overlay", ".block-handle"]) { const el = cadre.querySelector(s) as HTMLElement | null; if (el) { el.style.opacity = visible ? "1" : "0"; el.style.pointerEvents = visible ? "auto" : "none" } }
    }, [])

    const hidePopover = useCallback(() => {
      clearTimeout(popoverTimer.current)
      setPopover(null)
    }, [])

    const [favorites, setFavorites] = useState<string[]>(() => {
      if (typeof window !== "undefined") { return lireJson("qrfolio_fav_blocks", []) }
      return []
    })

    const toggleFav = useCallback((type: string) => {
      setFavorites(prev => {
        const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        ecrireJson("qrfolio_fav_blocks", next)
        return next
      })
    }, [])

    const isFav = useCallback((type: string) => favorites.includes(type), [favorites])

    // ── Blocs récents ─────────────────────────────────────────────────────────
    const [recentBlocks, setRecentBlocks] = useState<string[]>(() => {
      if (typeof window !== "undefined") { return lireJson("qrfolio_recent_blocks", []) }
      return []
    })

    const pushRecent = useCallback((type: string) => {
      setRecentBlocks(prev => {
        const next = [type, ...prev.filter(t => t !== type)].slice(0, 8)
        ecrireJson("qrfolio_recent_blocks", next)
        return next
      })
    }, [])

    // ── Catégories repliées ───────────────────────────────────────────────────
    const [collapsedCats, setCollapsedCats] = useState<string[]>(() => {
      if (typeof window !== "undefined") { return lireJson("qrfolio_collapsed_cats", []) }
      return []
    })

    const toggleCat = useCallback((catId: string) => {
      setCollapsedCats(prev => {
        const next = prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
        ecrireJson("qrfolio_collapsed_cats", next)
        return next
      })
    }, [])

    const isCatCollapsed = useCallback((catId: string) => collapsedCats.includes(catId), [collapsedCats])
    // Mode Focus : on se concentre sur le CANVAS + l'ÉDITEUR. On masque la bibliothèque de blocs et
    // on replie la nav du dashboard (via événement), mais on GARDE l'éditeur ouvert pour éditer.
    function toggleFocus() {
      setFocusMode(p => {
        const next = !p
        setSidebarCollapsed(next); setBlocksCollapsed(next); setRightCollapsed(false)
        return next
      })
    }
    // Synchronise la nav du dashboard avec le mode Focus (toute transition, quelle que soit la sortie),
    // + restauration garantie en quittant le builder.
    useEffect(() => {
      try { window.dispatchEvent(new CustomEvent("qrowg:builder-focus", { detail: focusMode })) } catch { /* noop */ }
      return () => { try { window.dispatchEvent(new CustomEvent("qrowg:builder-focus", { detail: false })) } catch { /* noop */ } }
    }, [focusMode])

    // En mode Focus, les 3 sections (Aperçu/Éditeur/Thème) s'affichent EMPILÉES en même temps ; ce
    // petit en-tête collant les distingue et reste visible pendant le scroll de chaque section.
    const focusSectionHeader = (label: string) => focusMode ? (
      <div data-barre-collante="" style={{ position: "sticky" as const, top: 0, zIndex: 6, padding: "8px 12px", background: "#1B1B1B", borderBottom: `1px solid ${G}40`, color: G, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.5, flexShrink: 0 }}>{label}</div>
    ) : null


    // Polices des thèmes : HÉBERGÉES par le site (public/fonts, déclarées dans
    // globals.css — 18 familles). Ce qui les demandait à fonts.googleapis.com a été
    // retiré le 20 nov. : la politique de sécurité (style-src / font-src 'self')
    // bloquait la feuille, et chaque page ne gagnait qu'une requête refusée et une
    // erreur dans la console.

    // Bootstrap : URL /builder/new (ou tout pageId non-UUID) -> on cree la page en base,
    // on recupere son vrai UUID, on met a jour l'URL sans rechargement, puis liveId prend le relais.
    // Le brouillon doit être en main AVANT la création de la page : le bootstrap
    // s'en sert comme contenu initial au lieu de créer une page vide.
    useEffect(() => {
      try {
        const q = new URLSearchParams(window.location.search)
        if (q.get("claim") === "1") claimRef.current = loadDraft(browserStorage())
        if (q.get("publier") === "1") wantPublishRef.current = true
      } catch {}
    }, [])

    useEffect(() => {
      if (!pageId || IS_UUID(pageId)) return
      if (authState !== "user") return        // invité ou session inconnue : aucune écriture
      if (creatingRef.current) return
      creatingRef.current = true
      const att = attente()
      ;(async () => {
        try {
          // Reprise du travail fait AVANT l'inscription : le brouillon local devient
          // le contenu de la page créée. C'est tout l'intérêt de l'essai sans compte.
          const claimed = claimRef.current
          const res = await fetch("/api/pages/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: claimed?.pageName || pageName }) })
          const json = await res.json().catch(() => ({}))
          if (!att.encoreAttendue()) return   // l'éditeur a été quitté : plus rien à poser (v111)
          if (!res.ok || !json?.pageId) { setBootstrapError(json?.message || json?.error || "Impossible de créer la page."); return }
          // Quota de QR actifs atteint : le QR existe mais affiche le mur au
          // scan. L'éditeur le dit au lieu de laisser imprimer (lot v98).
          if (!qrVisitable(json)) toast.info(messageApresCreation(json))
          if (claimed) {
            hydrater({
              blocks: claimed.blocks.map(b => ({ id: IS_UUID(b.id) ? b.id : genId(), type: b.type, content: { ...b.content }, visible: b.visible !== false, draft: b.draft, locked: b.locked })),
              theme: claimed.theme ? normalizePageTheme(claimed.theme) : themeRef.current,
              name: claimed.pageName,
            })
            clearDraft(browserStorage())
            claimRef.current = null
            setClaimed(true)
            // Repère 5 — bout du parcours : le compte existe ET le travail a été retrouvé.
            marque(FUNNEL.brouillonRepris, { modele: etiquette(claimed?.templateKey) })
            skipLoadRef.current = true
            // On saute le rechargement (le contenu est en mémoire, le relire l'effacerait),
            // donc le code court du QR doit venir d'ici : c'est la seule autre source.
            // Sans lui, qrTarget reste vide et l'écran de fin du parcours ne s'affiche pas.
            if (json.shortCode) setQrShortCode(String(json.shortCode))
          } else {
            // Normalise les IDs de blocs par defaut (\"1\"/\"2\"/\"3\") en UUID -> chemin upsert propre.
            // L'historique doit repartir des MÊMES identifiants : sinon une annulation
            // ramènerait les blocs sous leur ancien nom, et l'upsert en créerait des doubles.
            hydrater({
              blocks: blocksKbRef.current.map(b => IS_UUID(b.id) ? b : { ...b, id: genId() }),
              theme: themeRef.current,
              name: nameRef.current,
            })
          }
          // Page neuve creee : la sauvegarde peut persister les blocs initiaux.
          ready.current = true
          setLiveId(json.pageId)
          if (json.slug) setPageSlug(json.slug)
          try { window.history.replaceState(null, "", "/dashboard/builder/" + json.pageId) } catch {}
        } catch (e: any) {
          att.siEncoreLa(() => setBootstrapError(e?.message || "Impossible de créer la page."))()
        }
      })()
      return att.abandonner
    }, [pageId, authState])

    useEffect(() => {
      if (!IS_UUID(liveId)) return
      // Page tout juste créée à partir d'un brouillon : son contenu est en mémoire,
      // pas encore en base. Relire maintenant reviendrait à l'effacer.
      if (skipLoadRef.current) { skipLoadRef.current = false; setLoadState("loaded"); return }
      const supabase = createClient()
      const a = attente()                   // ignore les résultats si l'effet est remplacé/démonté
      const alive = () => a.encoreAttendue() && mountedRef.current
      setLoadState("loading"); ready.current = false     // « Réessayer » : rien ne part avant le nouveau chargement
      async function load() {
        try {
          // 1) Page (CRITIQUE). Erreur/absence → écran dédié, et surtout ready RESTE false
          //    (aucun autosave sur une page fantôme ou inaccessible → aucun écrasement).
          const { data: pg, error: pageErr } = await supabase.from("pages").select("title,slug,status,theme,total_views").eq("id", liveId!).single()
          if (!alive()) return
          if (pageErr || !pg) { setLoadState(loadStateFromError(pageErr, false)); return }

          // 2) Blocs (CRITIQUES pour l'édition). Une erreur bloque le chargement (récupérable).
          const { data: blks, error: blkErr } = await supabase.from("blocks").select("*").eq("page_id", liveId!).order("position")
          if (!alive()) return
          if (blkErr) { setLoadState(loadStateFromError(blkErr, false)); return }
          repereRef.current = repereDe(blks ?? [])

          // Application de l'état chargé (uniquement après succès des lectures critiques →
          // pas de rendu partiel incohérent).
          // Thème NORMALISÉ à la frontière (fin des casts aveugles) : accepte les anciens
          // formats et garantit un PageTheme canonique complet côté Builder.
          const normTheme = normalizePageTheme(pg.theme)
          setPageSlug(pg.slug); setPageStatus(pg.status || "draft")
          setPageStats(s => ({ ...s, views: pg.total_views || 0 }))
          // Repart de l'état chargé (blocs + thème + nom) : évite l'undo->démo qui
          // écrasait le contenu, et cale le snapshot d'historique sur la page réelle.
          // Une page sans bloc en a zéro — pas les trois du montage, que l'autosave
          // écrirait ensuite par-dessus.
          const loaded = (blks ?? []).map(b => { const c = (b.content || {}) as Record<string, any>; return { id: b.id, type: b.type, content: c, visible: c.__visible !== undefined ? c.__visible !== false : (b.is_visible !== false), draft: c.__draft || false, locked: c.__locked || false } })
          hydrater({ blocks: loaded, theme: normTheme, name: pg.title ?? nameRef.current }); setArmement(n => n + 1)

          // 3) Lectures NON critiques (QR, clics) : une erreur n'empêche PAS l'édition.
          const { data: qr } = await supabase.from("qr_codes").select("short_code,total_scans").eq("page_id", liveId!).single()
          if (alive() && qr) { setQrShortCode(qr.short_code || ""); setPageStats(s => ({ ...s, scans: qr.total_scans || 0 })) }
          const since = new Date(); since.setDate(since.getDate() - 90)
          const { data: clk } = await supabase.from("block_clicks").select("block_id").eq("page_id", liveId!).gte("clicked_at", since.toISOString()).order("clicked_at", { ascending: false }).limit(LIGNES_AGREGEES)
          if (alive() && clk?.length) {
            const counts: Record<string, number> = {}
            for (const r of clk as any[]) { if (r.block_id) counts[r.block_id] = (counts[r.block_id] || 0) + 1 }
            setClickCounts(counts) }

          if (!alive()) return
          setLoadState("loaded")
        } catch (e) {
          // Exception (réseau, JSON, inattendue) : écran récupérable, ready reste false.
          if (alive()) setLoadState(loadStateFromError(e, false))
        }
      }
      load()
      return a.abandonner
    }, [liveId, loadNonce])

    // ── Invité : restauration du brouillon ────────────────────────────────────
    // Un visiteur qui revient retrouve son travail. On restaure d'office quand il
    // arrive depuis un modèle (?draft=1) ; sinon on propose, sans rien écraser.
    useEffect(() => {
      if (authState !== "guest" || guestReady.current) return
      const d = loadDraft(browserStorage())
      const asked = (() => { try { return new URLSearchParams(window.location.search).get("draft") === "1" } catch { return false } })()
      if (d && (asked || !draftIsMeaningful(d))) {
        applyDraft(d)
      } else if (d && d.templateKey) {
        templateKeyRef.current = d.templateKey
        setDraftFound(d)
      } else if (d) {
        setDraftFound(d)          // on demande avant d'écraser ce qu'il a peut-être commencé
      }
      guestReady.current = true
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authState])

    function applyDraft(d: LocalDraft) {
      templateKeyRef.current = d.templateKey
      // Page déjà remplie : le guide « on a posé 3 blocs pour toi » n'a plus de sens.
      if (d.templateKey || d.blocks.length > 3) setFromTemplate(true)
      hydrater({
        blocks: d.blocks.map(b => ({ id: b.id, type: b.type, content: { ...b.content }, visible: b.visible !== false, draft: b.draft, locked: b.locked })),
        theme: d.theme ? normalizePageTheme(d.theme) : themeRef.current,
        name: d.pageName,
      })
      // Les identifiants changent : on laisse la sélection d'ouverture se refaire sur le brouillon.
      setSelectedId(null); premierBlocChoisiRef.current = undefined
      setDraftFound(null)
      guestReady.current = true
    }

    // ── Invité : sauvegarde du brouillon dans le navigateur ───────────────────
    // Sans compte il n'y a rien à écrire en base : on écrit localement, au même
    // format que ce que la base attend, pour que la reprise après inscription soit
    // une simple relecture — pas une conversion.
    useEffect(() => {
      if (authState !== "guest" || !guestReady.current || draftFound) return
      clearTimeout(draftTimer.current)
      draftTimer.current = setTimeout(() => {
        const d = makeDraft({ pageName, theme, blocks, templateKey: templateKeyRef.current, now: Date.now() })
        if (!draftIsMeaningful(d)) return          // le squelette de départ ne mérite pas d'être conservé
        const r = saveDraft(browserStorage(), d)
        setDraftState(r.ok === true ? "saved" : r.reason)
        dirty.current = !r.ok                       // rien n'est perdu si l'écriture a réussi
        // Repère 3 — la personne a VRAIMENT touché à sa page : draftIsMeaningful, juste
        // au-dessus, a déjà écarté le squelette de départ. Posé une seule fois.
        if (r.ok === true && !modifRef.current) { modifRef.current = true; marque(FUNNEL.pageModifiee, { blocs: blocks.length }) }
      }, 600)
      return () => clearTimeout(draftTimer.current)
    }, [blocks, pageName, theme, authState, draftFound])

    // Avertit avant de fermer/recharger l'onglet s'il reste des changements non
    // sauvegardes. Le geste a quitte ce fichier : sept autres ateliers du produit
    // n'en avaient aucun (lot v121). Ici on ne garde que l'appel.
    useRetenirLaSortie(useCallback(() => dirty.current, []))

    // ── Coordinateur de sauvegarde « single-flight » ───────────────────────────
    // Sérialise les sauvegardes d'un MÊME client : jamais deux en parallèle, le dernier
    // snapshot gagne, une sauvegarde ancienne ne peut ni marquer un état neuf comme
    // « Enregistré » ni supprimer un bloc ajouté après son démarrage. Créé une seule
    // fois ; la persistance et le snapshot portent tout le contexte (pas de closure stale).
    // Dernier `updated_at` connu des blocs de la page (heure du serveur).
    const repereRef = useRef<string | null>(null)
    // Le câble (délai, écriture immédiate, rien de perdu en quittant) : useSauvegardeAuto.
    const sauvegarde = useSauvegardeAuto<PageSnapshot>({
      // Contrôle de version (savePage) : refuse d'écraser ce que « Ma carte » a écrit.
      persist: (snap) => persistSnapshot(createClient(), snap, { repere: repereRef.current, onRepere: r => { repereRef.current = r } }),
      onEtat: (s) => {
        dirty.current = s.dirty
        setSaving(s.saving)
        setHasUnsaved(s.dirty)
        setSaved(s.status === "saved")
        setSaveError(s.status === "error")
        // Message SÛR (jamais le message Supabase brut : table, code SQL, détail RLS).
        if (s.status === "error" && s.error) setSaveErrorMsg(safeErrorMessage(s.error))
      },
    })

    // Refs fraîches pour les closures stables du contrôleur de publication (créé une fois).
    const liveIdRef = useRef(liveId); useEffect(() => { liveIdRef.current = liveId }, [liveId])
    const mountedRef = useRef(true); useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, []) // true à CHAQUE montage : le mode strict remonte (v390)

    // ── Contrôleur de publication ───────────────────────────────────────────────
    // Contrat : intention → flush (persiste le DERNIER snapshot via le coordinateur) →
    // mutation serveur (statut + revalidation ISR) → succès. Garde single-flight impérative
    // (anti double-clic). Aucun « Publié » n'est affiché tant que le serveur n'a pas confirmé.
    const publishCtrlRef = useRef<ReturnType<typeof createPublishController> | null>(null)
    if (!publishCtrlRef.current) {
      publishCtrlRef.current = createPublishController({
        flush: () => sauvegarde.flush(),
        publish: () => publishPage(liveIdRef.current!),
        onChange: (s) => {
          if (!mountedRef.current) return // aucun setState après démontage
          setPublishing(s.phase === "publishing")
          if (s.phase === "publishing") setPublishError("")
          if (s.phase === "error") setPublishError(s.message)
          if (s.phase === "published") {
            setPublishError("")
            // Repère 6 — le bout du parcours : une page en ligne, un QR qui sert.
            if (!publieeRef.current) { publieeRef.current = true; marque(FUNNEL.pagePubliee, { auto: autoPubRef.current, blocs: blocksRef.current }) }
            setPageStatus("published")
            setPublishWasUpdate(s.alreadyPublished)
            setPublishSuccess(true)
            // Uniquement la PREMIÈRE fois : une mise à jour de page n'est pas un événement.
            if (!s.alreadyPublished) { setShowPublishPopup(false); setPremiereEnLigne(true) }
            setTimeout(() => { if (mountedRef.current) setPublishSuccess(false) }, 3500)
          }
        },
      })
    }

    // Compteur de blocs lisible depuis les callbacks stables du contrôleur.
    useEffect(() => { blocksRef.current = blocks.length }, [blocks])

    // Tenir la promesse : elle a cliqué « publier », créé un compte, et sa page est
    // maintenant en base avec son contenu. On enregistre puis on publie — sans lui
    // redemander. L'ordre compte : saveNow() dépose le snapshot, publishLatest()
    // attend qu'il soit persisté avant de basculer le statut. Publier sans cela
    // mettrait en ligne une page vide.
    useEffect(() => {
      if (!wantPublishRef.current || autoPubRef.current) return
      if (!claimed || !IS_UUID(liveId) || !ready.current) return
      autoPubRef.current = true
      wantPublishRef.current = false
      setShowPublishPopup(true)          // on montre ce qui se passe, on ne le fait pas en douce
      saveNow()
      void publishCtrlRef.current?.publishLatest()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimed, liveId])

    // Snapshot IMMUABLE de l'état courant (cloné avant tout appel réseau). Renvoie null
    // tant que la page n'est pas prête (garde anti-écrasement des blocs de démo).
    const buildSnapshot = useCallback((): PageSnapshot | null => {
      if (!IS_UUID(liveId) || !ready.current) return null
      return {
        liveId: liveId!,
        pageName,
        theme: { ...(theme as any) },
        blocks: blocks.map(b => ({ id: b.id, type: b.type, content: { ...b.content }, visible: b.visible, draft: b.draft, locked: b.locked })),
      }
    }, [liveId, pageName, theme, blocks])

    useEffect(() => {
      // ready.current : garde anti-ecrasement — on ne sauvegarde pas tant que la page n'est
      // pas chargee (existante) ou creee (nouvelle), pour ne jamais persister les blocs de demo.
      if (!IS_UUID(liveId) || !ready.current) return
      // Feedback immédiat « non enregistré » ; le coordinateur confirmera après le réseau.
      dirty.current = true; setHasUnsaved(true); setSaved(false)
      sauvegarde.programmer(buildSnapshot)
    }, [blocks, pageName, theme, liveId, buildSnapshot, sauvegarde])
    // Déclaré APRÈS l'autosave : le rendu qui affiche la page chargée ne l'écrit pas (l'autosave
    // y lit encore false), mais toute frappe qui suit est programmée — même avant la fin des lectures QR/clics.
    useEffect(() => { if (armement) ready.current = true }, [armement])

    // Déclenchement manuel immédiat (bouton « Enregistrer maintenant »).
    function saveNow() { sauvegarde.maintenant(buildSnapshot) }

    // Publication / mise à jour : délègue au contrôleur (flush → mutation serveur →
    // revalidation). La garde single-flight vit dans le contrôleur (double-clic sûr).
    function handlePublish() {
      // Invité : publier, c'est le moment où le compte devient nécessaire (la page
      // doit appartenir à quelqu'un). On emporte le brouillon — rien n'est resaisi.
      if (guest) { goSignup(); return }
      if (!IS_UUID(liveId)) return
      void publishCtrlRef.current?.publishLatest()
    }

    /** Emporte le brouillon vers l'inscription, puis revient créer la page. */
    function goSignup() {
      // Repère 4 — la marche décisive : elle a une page, on lui demande un compte.
      marque(FUNNEL.publierSansCompte, { blocs: blocks.length, modele: etiquette(templateKeyRef.current) })
      const d = makeDraft({ pageName, theme, blocks, templateKey: templateKeyRef.current, now: Date.now() })
      const r = saveDraft(browserStorage(), d)
      if (r.ok !== true) { setDraftState(r.reason); return }   // on ne l'envoie pas perdre son travail
      // L'INTENTION voyage, pas seulement le contenu : la personne n'a pas cliqué
      // « créer un compte », elle a cliqué « publier ». Sans ce marqueur, elle
      // revenait devant un brouillon et devait retrouver le bouton toute seule.
      const back = encodeURIComponent("/dashboard/builder/new?claim=1&publier=1")
      // Un souffle avant de partir : le temps que le repère parte vraiment. Personne
      // ne perçoit 120 ms, et sans cela la marche la plus intéressante du parcours
      // ne serait jamais comptée.
      setTimeout(() => { try { window.location.href = `/auth/signup?redirect=${back}` } catch {} }, 120)
    }

    // ID de bloc = UUID valide (colonne uuid en base) -> IDs stables entre sauvegardes,
    // ce qui préserve l'historique de clics (block_clicks.block_id) au lieu de le perdre à chaque publication.
    function genId(): string {
      try { if (typeof crypto !== "undefined" && (crypto as any).randomUUID) return (crypto as any).randomUUID() } catch {}
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, ch => { const r = Math.floor(Math.random() * 16); const v = ch === "x" ? r : (r & 0x3 | 0x8); return v.toString(16) })
    }

    function addBlock(type: string, content?: BlockContent, insertAt?: number | null) {
      const def = BLOCK_DEFS[type]; if (!def) return
      const id = genId()
      const nb = { id, type, content: content||{...def.defaultContent}, visible: true }
      // C06 — index d'insertion optionnel (bouton « + » entre blocs). Absent = ajout en fin (inchangé).
      setBlocks(p => {
        if (insertAt == null) return [...p, nb]
        const at = Math.max(0, Math.min(p.length, insertAt))
        const next = p.slice(); next.splice(at, 0, nb); return next
      })
      setSelectedId(id); setRightTab("edit")
      if (isMobile) setMobileTab("panel")   // mobile : on ouvre direct l'éditeur du bloc ajouté
      pushRecent(type)
      // Scroll vers le nouveau bloc (page longue).
      setTimeout(() => { try { document.querySelector(`[data-block-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }) } catch {} }, 60)
    }
    // Index d'insertion en attente (déposé par un bouton « + » entre blocs, consommé au prochain ajout).
    const insertGapRef = useRef<number | null>(null)
    function onInsertAtGap(index: number) {
      insertGapRef.current = index
      if (isMobile) setMobileTab("blocks")   // mobile : ouvrir la bibliothèque
      else setActiveCategory("identity")     // desktop : la bibliothèque (panneau gauche) est déjà visible
    }
    // Ajout depuis la bibliothèque, en respectant l'index « + » en attente (puis on le consomme).
    function addFromLibrary(type: string) {
      const at = insertGapRef.current
      insertGapRef.current = null
      addBlock(type, undefined, at ?? undefined)
    }

    // Applique un MODÈLE DE PAGE complet : thème cohérent + jeu de blocs prêt à personnaliser.
    // Remplace les blocs (réversible via Ctrl+Z / undo). Confirme si la page a déjà du contenu.
    async function applyPageTemplate(tpl: PageTemplate) {
      const nonEmpty = blocks.filter(b => !(b.type === "profile" && !(b.content?.name))).length
      if (blocks.length > 1 || nonEmpty > 0) {
        if (!(await confirm({ title: "Appliquer ce modèle ?", message: `Appliquer le modèle « ${tpl.label} » ?\n\nLes blocs actuels seront remplacés et le thème mis à jour. Réversible avec Annuler (Ctrl+Z).`, confirmLabel: "Appliquer" }))) return
      }
      // Transactionnel : blocs + thème appliqués en UNE SEULE entrée d'undo
      // (setters bruts + un push explicite), plutôt que deux entrées séparées.
      const nextTheme = { ...themeRef.current, ...tpl.theme }
      const next = tpl.blocks.map(b => ({ id: genId(), type: b.type, content: { ...(BLOCK_DEFS[b.type]?.defaultContent || {}), ...b.content }, visible: true }))
      setBlocksRaw(next)
      setTheme(nextTheme)
      undoRedo.push({ blocks: next, theme: nextTheme, name: nameRef.current })
      setSelectedId(null); setRightTab("edit"); setShowTemplates(false)
      if (isMobile) setMobileTab("canvas")   // mobile : on montre la page fraîchement générée
    }

    // (Bouton "Generer une identite de base" retire — QWG-0019 : la page part deja
    //  pre-remplie et les "Modeles par metier" couvrent ce besoin.)

    function generateIdentityPreset(preset: typeof IDENTITY_PRESETS[number]) {
      const mk = (type: string, ov: Record<string, string>) => ({ ...(BLOCK_DEFS[type]?.defaultContent || {}), ...ov })
      const hasProfile = blocks.some(b => b.type === "profile")
      preset.blocks.forEach(b => {
        if (b.type === "profile" && hasProfile) return // ne recrée pas un profil existant
        addBlock(b.type, mk(b.type, b.content))
      })
    }

    function generateActionPreset(preset: typeof ACTION_PRESETS[number]) {
      const mk = (type: string, ov: Record<string, string>) => ({ ...(BLOCK_DEFS[type]?.defaultContent || {}), ...ov })
      preset.blocks.forEach(b => addBlock(b.type, mk(b.type, b.content)))
    }

    function generateSocialPreset(preset: typeof SOCIAL_PRESETS[number]) {
      const content: Record<string, string> = {}
      preset.networks.forEach(k => { content[k] = SOCIAL_URL_TEMPLATES[k] || "https://" })
      addBlock("social_links", content)
    }

    function generateCommercePreset(preset: typeof COMMERCE_PRESETS[number]) {
      const mk = (type: string, ov: Record<string, string>) => ({ ...(BLOCK_DEFS[type]?.defaultContent || {}), ...ov })
      preset.blocks.forEach(b => addBlock(b.type, mk(b.type, b.content)))
    }

    function generateMediaPreset(preset: typeof MEDIA_PRESETS[number]) {
      const mk = (type: string, ov: Record<string, string>) => ({ ...(BLOCK_DEFS[type]?.defaultContent || {}), ...ov })
      preset.blocks.forEach(b => addBlock(b.type, mk(b.type, b.content)))
    }

    function generateInfoPreset(preset: typeof INFO_PRESETS[number]) {
      const mk = (type: string, ov: Record<string, string>) => ({ ...(BLOCK_DEFS[type]?.defaultContent || {}), ...ov })
      preset.blocks.forEach(b => addBlock(b.type, mk(b.type, b.content)))
    }

    // Une seule règle pour supprimer un bloc, quel que soit le chemin (panneau de
    // réglages, feuille « ⋯ », barre mobile, touche Suppr) : on ne demande rien, on
    // supprime, et on rend la marche arrière immédiate. Avant, le panneau de réglages
    // ouvrait une confirmation et les trois autres chemins non — la même touche
    // faisait deux choses différentes selon l'endroit d'où on la pressait.
    function retirerBlocs(ids: string[], message: string) {
      const supprimables = ids.filter(id => !blocks.find(b => b.id === id)?.locked)
      if (supprimables.length === 0) return
      // On garde la position d'origine de chacun : « Annuler » remet les blocs là où
      // ils étaient, pas à la fin de la page.
      const retires = blocks
        .map((b, i) => ({ b, i }))
        .filter(({ b }) => supprimables.includes(b.id))
      setBlocks(p => p.filter(b => !supprimables.includes(b.id)))
      if (selectedId && supprimables.includes(selectedId)) { setSelectedId(null); setRightTab("edit") }
      setMultiSelection(prev => prev.filter(id => !supprimables.includes(id)))
      toast.info(message, {
        action: {
          label: "Annuler",
          onClick: () => {
            setBlocks(p => {
              const next = [...p]
              for (const { b, i } of retires) next.splice(Math.min(i, next.length), 0, b)
              return next
            })
          },
        },
      })
    }

    function deleteBlock(id: string) {
      retirerBlocs([id], "Bloc supprimé.")
    }

    function resetBlock(id: string) {
      const block = blocks.find(b => b.id === id); if (!block || block.locked) return
      const def = BLOCK_DEFS[block.type]
      setBlocks(p => p.map(b => b.id === id ? { ...b, content: { ...(def?.defaultContent || {}) } } : b))
    }

    function duplicateBlock(id: string) {
      const block = blocks.find(b => b.id === id); if (!block) return
      const newId = genId()
      const idx = blocks.findIndex(b => b.id === id)
      setBlocks(p => [...p.slice(0, idx+1), { ...block, id: newId, content: {...block.content} }, ...p.slice(idx+1)])
      setSelectedId(newId)
    }

    function toggleVisible(id: string) { setBlocks(p => p.map(b => b.id===id ? {...b, visible: !b.visible} : b)) }
    function toggleDraft(id: string) { setBlocks(p => p.map(b => b.id===id ? {...b, draft: !b.draft} : b)) }
    function toggleLock(id: string) { setBlocks(p => p.map(b => b.id===id ? {...b, locked: !b.locked} : b)) }

    // ── Sélection multiple ────────────────────────────────────────────────────
    function handleBlockClick(e: React.MouseEvent, blockId: string, blockIdx: number) {
      if (preview) return // #02 : en mode Apercu, aucun clic d'edition
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+clic : toggle dans la sélection multiple
        e.preventDefault()
        setMultiSelection(prev =>
          prev.includes(blockId) ? prev.filter(id => id !== blockId) : [...prev, blockId]
        )
        if (multiSelection.length === 0) setSelectedId(blockId)
      } else if (e.shiftKey && selectedId) {
        // Shift+clic : sélectionner une plage
        e.preventDefault()
        const selectedIdx = blocks.findIndex(b => b.id === selectedId)
        const min = Math.min(selectedIdx, blockIdx)
        const max = Math.max(selectedIdx, blockIdx)
        setMultiSelection(blocks.slice(min, max + 1).map(b => b.id))
      } else {
        // Clic simple
        setMultiSelection([]); setSelectedId(blockId); setRightTab("edit")
        // Téléphone : le panneau de réglages vit sur un autre onglet que la page.
        // Sans cette bascule, taper un bloc ne faisait rien de visible.
        if (isMobile) setMobileTab("panel")
      }
    }

    function deleteMulti() {
      const ids = multiSelection.length > 0 ? multiSelection : []
      if (ids.length === 0) return
      const n = ids.filter(id => !blocks.find(b => b.id === id)?.locked).length
      retirerBlocs(ids, `${n} bloc${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}.`)
    }
    // Le handler clavier global appelle ces actions via ref (toujours à jour).
    deleteMultiRef.current = deleteMulti
    deleteBlockRef.current = deleteBlock

    function duplicateMulti() {
      const ids = multiSelection
      if (ids.length === 0) return
      setBlocks(p => {
        const result = [...p]
        const newIds: string[] = []
        // Insérer les clones après le dernier bloc sélectionné
        const lastIdx = Math.max(...ids.map(id => result.findIndex(b => b.id === id)))
        const clones = ids.map(id => {
          const orig = result.find(b => b.id === id)!
          const newId = genId()
          newIds.push(newId)
          return { ...orig, id: newId, content: { ...orig.content } }
        })
        result.splice(lastIdx + 1, 0, ...clones)
        return result
      })
      setMultiSelection([])
    }

    // ── Dupliquer / Copier / Coller (clavier + palette) ───────────────────────
    function duplicateSelection() {
      if (multiSelection.length > 0) duplicateMulti()
      else if (selectedId) duplicateBlock(selectedId)
    }
    function copySelection() {
      const ids = multiSelection.length > 0 ? multiSelection : (selectedId ? [selectedId] : [])
      if (!ids.length) return
      clipboardRef.current = blocks.filter(b => ids.includes(b.id)).map(b => ({ ...b, content: { ...b.content } }))
    }
    function pasteClipboard() {
      const clip = clipboardRef.current
      if (!clip.length) return
      const clones = cloneBlocks(clip, genId)
      const anchorIds = multiSelection.length > 0 ? multiSelection : (selectedId ? [selectedId] : [])
      setBlocks(p => {
        let at = p.length
        if (anchorIds.length) at = Math.max(...anchorIds.map(id => p.findIndex(b => b.id === id))) + 1
        return [...p.slice(0, at), ...clones, ...p.slice(at)]
      })
      setSelectedId(clones[clones.length - 1].id)
      setMultiSelection(clones.length > 1 ? clones.map(c => c.id) : [])
      setRightTab("edit")
    }
    copyRef.current = copySelection
    pasteRef.current = pasteClipboard
    duplicateSelRef.current = duplicateSelection

    function toggleVisibleMulti() {
      const ids = multiSelection
      if (ids.length === 0) return
      // Si tous visibles → masquer tous, sinon → afficher tous
      const allVisible = ids.every(id => blocks.find(b => b.id === id)?.visible)
      setBlocks(p => p.map(b => ids.includes(b.id) ? { ...b, visible: !allVisible } : b))
    }

    // Verrou et extrémités : deplacerLeBloc (builderHooks), le même geste qu'Alt+flèche.
    function moveBlock(id: string, dir: number) { setBlocks(p => deplacerLeBloc(p, id, dir)) }

    // ── FIX CRITIQUE: updateBlock immédiat + EditPanel key ────────────────────
    function updateBlock(id: string, key: string, value: string) {
      // Clé de coalescing par (bloc, champ) : taper dans un champ = UNE entrée d'undo,
      // pas une par caractère. Changer de champ/bloc démarre une nouvelle entrée.
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, [key]: value } } : b), false, `field:${id}:${key}`)
    }

    // Édition inline (canvas) : committer STABLE (via ref) pour préserver la
    // mémoïsation de MemoBlockPreview (une prop callback recréée casserait le memo).
    const editFieldRef = useRef<(id: string, key: string, value: string) => void>(() => {})
    editFieldRef.current = updateBlock
    const onEditField = useCallback((id: string, key: string, value: string) => editFieldRef.current(id, key, value), [])


    // ── Recherche enrichie (moteur pur partagé : builderSearch.ts) ─────────────
    const searchScore = scoreBlock
    // Le métier lu dans les blocs : un resto voit son menu et sa carte d'abord (20 nov.).
    const metier = contexteDeLaPage(blocks.map(b => b.type))

    const filteredBlocks = (() => {
      if (!search) {
        if (activeCategory === "essentials") {
          // ~20 blocs les plus utiles (contextuels + universels). Les 143 restent
          // accessibles via les categories et la recherche. (QWG-0017b)
          return essentialsForContext(metier)
            .filter(type => BLOCK_DEFS[type])
            .map(type => [type, BLOCK_DEFS[type]] as [string, (typeof BLOCK_DEFS)[string]])
        }
        if (activeCategory === "recents") {
          return recentBlocks
            .filter(type => BLOCK_DEFS[type])
            .map(type => [type, BLOCK_DEFS[type]] as [string, (typeof BLOCK_DEFS)[string]])
        }
        if (activeCategory === "favorites") {
          return blocsProposables().filter(([type]) => favorites.includes(type))
        }
        return blocsProposables().filter(([, def]) => def.category === activeCategory)
      }
      return blocsProposables()
        .map(([type, def]) => ({ type, def, score: searchScore(type, def, search) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ type, def }) => [type, def] as [string, (typeof BLOCK_DEFS)[string]])
    })()

    const groupedResults = search
      ? BLOCK_CATEGORIES.map(cat => ({
          cat,
          blocks: filteredBlocks.filter(([, def]) => def.category === cat.id)
        })).filter(({ blocks }) => blocks.length > 0)
      : null

    // Compteurs par catégorie — calculés une seule fois par render
    const catCounts = Object.values(BLOCK_DEFS).reduce((acc, def) => {
      acc[def.category] = (acc[def.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Compteurs recherche — nb de résultats par catégorie
    const searchCounts = search && groupedResults
      ? Object.fromEntries(groupedResults.map(({ cat, blocks }) => [cat.id, blocks.length]))
      : null

    // selectedBlock recalculé depuis blocks à chaque render — garantit fraîcheur
    const selectedBlock = blocks.find(b => b.id === selectedId)
    // Revenir à l'onglet Contenu à chaque changement de bloc sélectionné.
    useEffect(() => { setEditTab("contenu") }, [selectedId])

    // Revue du 9 septembre (P0) : à l'ouverture, l'inspecteur ne doit jamais rester
    // vide sans consigne. Sur grand écran, le premier bloc de la page est sélectionné
    // d'office une fois la page chargée — l'utilisateur voit tout de suite « où » on
    // édite. Une seule fois par page, et jamais par-dessus un choix déjà fait.
    // Page en base : après le chargement ; page neuve ou invité : dès que la session est connue
    // (le brouillon restauré remet le compteur à zéro, voir applyDraft).
    const pagePrete = IS_UUID(liveId) ? loadState === "loaded" : authState !== "unknown"
    useEffect(() => {
      if (isMobile || !pagePrete || selectedId || blocks.length === 0) return
      if (premierBlocChoisiRef.current === (liveId ?? pageId)) return
      premierBlocChoisiRef.current = liveId ?? pageId
      setSelectedId(blocks[0].id); setRightTab("edit")
    }, [isMobile, pagePrete, selectedId, blocks, liveId, pageId])

    // Fond du thème appliqué partout
    function bgStyle(): React.CSSProperties {
      if (dayMode) return { background: "#FAFAFA" }
      if (!theme) return { background: "#080808" }
      const t = theme as any
      let base: React.CSSProperties = {}

      if (t.bgMode === "pattern") {
        // Même définition que la pastille du panneau et que la page publiée.
        const patSize = t.pattern_size || 20
        base = {
          background: theme.bg,
          backgroundImage: motifDeFond(t.bgPattern || "dots", t.pattern_color || "#C9A84C", patSize, t.pattern_opacity ?? 0.15),
          backgroundSize: `${patSize}px ${patSize}px`,
        }
      } else if (t.bgMode === "radial") {
        return { background: t.bgGradient || `radial-gradient(circle at 50% 50%, ${theme.primary}, ${theme.bg})` }
      } else if (t.bgMode === "mesh") {
        const c1 = t.mesh_c1 || "#C9A84C"; const c2 = t.mesh_c2 || "var(--success)"; const c3 = t.mesh_c3 || "#7B2FBE"
        const blurPx = Math.round((t.mesh_blur||40)/3)
        base = {
          background: `radial-gradient(ellipse at 10% 20%, ${c1}90, transparent 55%), radial-gradient(ellipse at 90% 80%, ${c2}90, transparent 55%), radial-gradient(ellipse at 80% 10%, ${c3}70, transparent 55%), ${theme.bg}`,
          ...(blurPx > 0 ? { backdropFilter: `blur(${blurPx}px)` } : {})
        }
      } else if (t.bgMode === "image" && t.bgImage) {
        base = {
          backgroundImage: `url(${t.bgImage})`,
          backgroundSize: t.bgImageSize || "cover",
          backgroundPosition: "center",
          ...(t.bgBlur > 0 ? { filter: `blur(${t.bgBlur}px)` } : {})
        }
      } else {
        const animStyle: React.CSSProperties = t.bgAnimation === "gradient-flow"
          ? { backgroundSize: "400% 400%", animation: `gradientShift ${t.anim_speed||8}s ease infinite` }
          : t.bgAnimation === "aurora"
          ? { backgroundSize: "300% 300%", animation: `auroraShift ${t.anim_speed||12}s ease infinite` }
          : {}
        base = { background: theme.bgGradient || theme.bg, ...animStyle }
      }
      return base
    }

    // Chargement d'une page existante en échec : écran clair plutôt qu'un builder rempli de
    // blocs de démo (page fantôme). not_found/forbidden = terminaux ; error = « Réessayer ».
    if (IS_UUID(liveId) && (loadState === "not_found" || loadState === "forbidden" || loadState === "error")) {
      const info = loadState === "not_found"
        ? { icon: "🗑️", title: "Cette page n'existe plus", sub: "Elle a peut-être été supprimée." }
        : loadState === "forbidden"
        ? { icon: "🔒", title: "Vous n'avez plus accès à cette page", sub: "Demandez au propriétaire de vous réinviter." }
        : { icon: "⚠️", title: "Impossible de charger la page", sub: "Vérifiez votre connexion puis réessayez." }
      return (
        <div style={{ height: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", color: "var(--ink)", padding: 24 }}>
          <div role="alert" style={{ maxWidth: 380, textAlign: "center", background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--accent) 16%, transparent)", borderRadius: 16, padding: "32px 28px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden>{info.icon}</div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{info.title}</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 22px", lineHeight: 1.6 }}>{info.sub}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {loadState === "error" && (
                <button onClick={() => { setLoadState("loading"); setLoadNonce(n => n + 1) }} className="da-btn-primary da-btn-primary--sm"><span>Réessayer</span></button>
              )}
              <a href="/dashboard" className="da-btn-neutral da-btn-neutral--sm">Retour au tableau de bord</a>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="builder-root" style={{ height: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif", color: "var(--ink)", overflow: "hidden", position: "relative" }}>

        {/* Guide de bienvenue au 1er lancement (auto-gere via localStorage) — QWG-0016 */}
        {/* Le guide dit « on a posé 3 blocs pour toi » : hors sujet quand on arrive
            d'un modèle avec une page déjà remplie. On le garde pour la page vierge. */}
        {!preview && !draftFound && !fromTemplate && !claimed && <BuilderWelcome mobile={isMobile} />}

        {/* Un visiteur qui revient a laissé du travail derrière lui. On demande avant
            de l'écraser : reprendre, ou repartir de zéro — jamais à son insu. */}
        {draftFound && (
          <div ref={repriseDlg} {...repriseDlgProps}
            style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ maxWidth: 380, width: "100%", background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)", borderRadius: 18, padding: "26px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }} aria-hidden>📝</div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: "var(--ink)" }}>Vous aviez commencé une page</h2>
              <p style={{ fontSize: 13, color: MUTED, margin: "0 0 20px", lineHeight: 1.55 }}>
                {draftSummary(draftFound, Date.now())} — gardée dans ce navigateur.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => applyDraft(draftFound)} className="da-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  <span>Reprendre où j'en étais</span>
                </button>
                <Button onClick={() => { clearDraft(browserStorage()); setDraftFound(null); guestReady.current = true }} variant="ghost" size="sm" fullWidth>Repartir de zéro</Button>
              </div>
            </div>
          </div>
        )}

        {/* Retour d'inscription : on confirme que le travail a bien suivi. */}
        {premiereEnLigne && qrTarget && pageSlug && (
          <PublishedScreen
            pageUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/${pageSlug}`}
            qrTarget={qrTarget}
            metier={handoff.metier}
            supports={handoff.suggested}
            printUrl={(id) => printStudioUrl(qrShortCode, handoff, id)}
            onDownloadQr={() => { void downloadQrPng() }}
            onClose={() => setPremiereEnLigne(false)}
            mobile={isMobile}
          />
        )}

        {claimed && (
          <div role="status" style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 380, background: "rgba(57,255,143,0.12)", border: "1px solid rgba(57,255,143,0.35)", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 9, maxWidth: "calc(100vw - 28px)" }}>
            <Check size={14} color="var(--success)" />
            <span style={{ color: "var(--success)", fontSize: 12.5, fontWeight: 600 }}>{autoPubRef.current ? "Votre page vous a suivi et part en ligne." : "Votre page vous a suivi — elle est maintenant dans votre compte."}</span>
            <button onClick={() => setClaimed(false)} aria-label="Fermer" style={{ background: "none", border: "none", color: "var(--success)", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}

        {/* C05 — Shell mobile dédié (flag ON + viewport mobile). Recouvre le Builder desktop-compressé.
            Flag OFF ou desktop = interface historique strictement inchangée (zéro régression). */}
        {BUILDER_REDESIGN && isMobile && !preview && (
          <MobileBuilderShell
            pageName={pageName} saving={saving} saved={saved} saveError={saveError} saveErrorMsg={saveErrorMsg} hasUnsaved={hasUnsaved}
            canUndo={undoRedo.canUndo()} canRedo={undoRedo.canRedo()}
            onUndo={() => { const p = undoRedo.undo(); if (p) applySnapshot(p) }}
            onRedo={() => { const n = undoRedo.redo(); if (n) applySnapshot(n) }}
            onSave={saveNow} onRetry={() => sauvegarde.retry()}
            onBack={() => { try { window.location.assign(guest ? "/dashboard/templates" : "/dashboard") } catch { /* noop */ } }}
            blocks={blocks} selectedId={selectedId} onSelect={setSelectedId}
            favorites={favorites} recents={recentBlocks} onToggleFavorite={toggleFav}
            onAddBlock={(t) => addBlock(t)}
            onChange={(id, k, v) => updateBlock(id, k, v)}
            onDuplicate={(id) => duplicateBlock(id)} onDelete={(id) => deleteBlock(id)}
            onToggleVisible={(id) => toggleVisible(id)} onToggleLock={(id) => toggleLock(id)} onToggleDraft={(id) => toggleDraft(id)}
            onMove={(id, dir) => moveBlock(id, dir)}
            onReset={(id) => resetBlock(id)}
            confirm={(m) => confirm({ title: "Confirmer", message: m, confirmLabel: "Confirmer" })}
            // Le thème, les modèles, le QR et le nom de la page n'existaient que dans
            // la colonne de droite du bureau : sur téléphone, la coquille les cachait.
            onRename={(v) => { setPageName(v); undoRedo.push({ blocks: blocksKbRef.current, theme: themeRef.current, name: v }, "pagename") }}
            renderTheme={() => (
              <ThemePanel theme={theme} onThemeChange={commitTheme} userPlan={userPlan}
                previewName={(blocks.find(b => b.type === "profile")?.content as any)?.name || pageName}
                previewAvatar={(blocks.find(b => b.type === "profile")?.content as any)?.avatar || ""} />
            )}
            renderTemplates={() => (
              <button type="button" onClick={() => setShowTemplates(true)}
                style={{ width: "100%", minHeight: 44, borderRadius: 10, border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: G, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Voir les modèles de page
              </button>
            )}
            renderQr={() => (
              pageStatus === "published" && qrTarget ? (
                <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ color: MUTED, fontSize: 11, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Votre QR code</p>
                  <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 8, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <QRCanvas value={qrTarget} size={132} />
                  </div>
                  <button type="button" onClick={downloadQrPng} style={{ width: "100%", minHeight: 44, background: "color-mix(in srgb, var(--accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius: 10, color: G, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>↓ Télécharger le QR (PNG)</button>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: MUTED, textAlign: "center" }}>Le QR est généré dès que la page est en ligne.</p>
              )
            )}
            pageStatus={pageStatus} publishing={publishing} publishError={publishError} onPublish={() => { void handlePublish() }}
            publicUrl={pageStatus === "published" && pageSlug ? `/${pageSlug}` : undefined} guest={guest}
            renderCanvas={() => blocks.map(b => (
              <div key={b.id} data-block-id={b.id} onClick={() => setSelectedId(b.id)} style={{ cursor: "pointer", boxShadow: selectedId === b.id ? `inset 0 0 0 2px ${G}` : "none", opacity: b.visible ? (b.draft ? 0.6 : 1) : 0.35 }}>
                <PreviewBoundary><MemoBlockPreview block={b} theme={theme} dayMode={dayMode} /></PreviewBoundary>
              </div>
            ))}
            renderLegacyContent={(b) => <EditPanel key={b.id + "-mc"} block={b} onChange={(k, v) => updateBlock(b.id, k, v)} only="content" />}
            renderLegacyDesign={(b) => <><EditPanel key={b.id + "-ma"} block={b} onChange={(k, v) => updateBlock(b.id, k, v)} only="apparence" /><EditPanel key={b.id + "-ml"} block={b} onChange={(k, v) => updateBlock(b.id, k, v)} only="layout" /></>}
          />
        )}

        {/* TOPBAR (masquee en mode Apercu plein ecran sur mobile) */}
        <div style={{ height: isMobile ? 50 : 56, background: "var(--bg)", borderBottom: "1px solid var(--line)", display: (preview && isMobile) ? "none" : "flex", alignItems: "center", padding: isMobile ? "0 9px" : "0 16px", gap: isMobile ? 6 : 10, flexShrink: 0, zIndex: 20 }}>
          <a href={guest ? "/dashboard/templates" : "/dashboard"} aria-label={guest ? "Retour aux modèles" : "Retour au tableau de bord"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexShrink: 0, textDecoration: "none", color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap", minHeight: 32, ...(isMobile ? { width: 44, height: 44, fontSize: 19 } : {}) }}>
            <ArrowLeft size={16} aria-hidden="true" />{!isMobile && <QrowgLogo size={16} />}
          </a>
          {!isMobile && <div style={{ width: 1, height: 18, background: "var(--line-strong)" }} />}
          {!isMobile && <span style={{ color: "var(--muted)", fontSize: 13 }}>Page</span>}
          {/* Le nom se coupait au milieu d'un mot, sans point de suspension : on lui
              laisse la place restante et on l'ellipse proprement. */}
          {/* L'éditeur n'avait aucun h1 : le nom de la page en est un, visuellement
              discret (le champ reste le contrôle ; le titre est lu par les lecteurs d'écran). */}
          <h1 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", margin: 0 }}>{pageName || "Page sans titre"} — éditeur</h1>
          <input value={pageName} onChange={e => { const v = e.target.value; setPageName(v); undoRedo.push({ blocks: blocksKbRef.current, theme: themeRef.current, name: v }, "pagename") }}
            aria-label="Nom de la page"
            // `/api/pages/create` coupait le titre à 80 sans le dire (lot v110).
            maxLength={limite("titreDePage")}
            // 18 px de haut sur téléphone : on tape à côté et on ouvre autre chose.
            style={{ background: "transparent", border: "none", color: "var(--ink)", fontSize: 14, fontWeight: 600, outline: "none", minWidth: 0, textOverflow: "ellipsis", ...(isMobile ? { flex: "1 1 0", minHeight: 40 } : { width: 200, minHeight: 32, padding: "0 6px", borderRadius: 6 }) }} />
          {/* Statut de sauvegarde. Flag ON (C01) : indicateur unifié tokenisé + a11y (role=status/aria-live).
              Flag OFF : coquille historique inchangée (zéro régression). */}
          {BUILDER_REDESIGN ? (
            <BuilderStatus mobile={isMobile} saving={saving} saved={saved} saveError={saveError} saveErrorMsg={saveErrorMsg} hasUnsaved={hasUnsaved} onSave={saveNow} onRetry={() => sauvegarde.retry()} />
          ) : (<>
          {saving && <span style={{ color: MUTED, fontSize: 11 }}>Enregistrement…</span>}
          {saved && !saveError && !saving && <span style={{ color: "var(--success)", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}><Check size={10} /> Enregistré</span>}
          {hasUnsaved && !saving && !saved && !saveError && (
            <Button onClick={saveNow} title="Enregistrer maintenant (sinon sauvegarde auto après ~1s)" variant="secondary" size="sm"><span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--warning)" }} /> {isMobile ? "Enregistrer" : "Modifications non enregistrées · Enregistrer"}</Button>
          )}
          {saveError && <Button onClick={() => sauvegarde.retry()} title={saveErrorMsg ? `Erreur : ${saveErrorMsg} — cliquer pour réessayer` : "Réessayer la sauvegarde"} variant="danger" size="sm">⚠ {isMobile ? "Réessayer" : `${saveErrorMsg ? saveErrorMsg : "Échec"} — Réessayer`}</Button>}
          </>)}
          {pageId && !IS_UUID(pageId) && !liveId && !bootstrapError && <span style={{ color: MUTED, fontSize: 11 }}>Création de la page…</span>}
          {bootstrapError && <span style={{ color: "var(--danger)", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }} title={bootstrapError}>⚠ {bootstrapError}</span>}
          {/* Invité : « Mode démo » laissait croire que rien n'est gardé. C'est faux
              depuis qu'on écrit un brouillon local — on dit ce qui se passe vraiment. */}
          {/* Sur mobile, la barre du haut n'a pas la place : le logo passait à la ligne
              et le nom de la page se coupait au milieu d'un mot. Le bandeau du canvas,
              juste en dessous, porte déjà la même information — celle-ci est en trop. */}
          {guest && !isMobile && draftState === "saved" && <span style={{ color: "var(--success)", fontSize: 11, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}><Check size={10} /> Brouillon gardé</span>}
          {guest && draftState === "too_big" && <span style={{ color: "var(--warning)", fontSize: 11, whiteSpace: "nowrap" }} title="Le brouillon dépasse ce que le navigateur peut garder — créez un compte pour ne rien perdre.">⚠ {isMobile ? "Trop lourd" : "Brouillon trop lourd"}</span>}
          {guest && draftState === "unavailable" && <span style={{ color: "var(--warning)", fontSize: 11, whiteSpace: "nowrap" }} title="Ce navigateur refuse d'enregistrer (navigation privée ?) — créez un compte pour garder votre page.">⚠ {isMobile ? "Non gardé" : "Rien ne peut être gardé ici"}</span>}
          {!guest && !pageId && !isMobile && <span style={{ color: "var(--muted)", fontSize: 11 }}>Mode démo</span>}
          {/* Ce vide extensible partageait la place restante avec le champ du nom :
              mesure au navigateur sur un ecran de 360 px, le nom de la page tombait
              a 33 px de large — trois lettres. Sur telephone, la place va au nom. */}
          {!isMobile && <div style={{ flex: 1 }} />}

          {/* Boutons Undo / Redo */}
          <AnnulerRetablir isMobile={isMobile} peutAnnuler={undoRedo.canUndo()} peutRetablir={undoRedo.canRedo()}
            onAnnuler={() => { const p = undoRedo.undo(); if (p) applySnapshot(p) }} onRetablir={() => { const n = undoRedo.redo(); if (n) applySnapshot(n) }} />
          {/* Modèles de page complets (icone seule sur mobile pour degager la barre) */}
          <button onClick={() => setShowTemplates(true)} title="Partir d'un modèle de page complet"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, padding: isMobile ? "0 12px" : "0 12px", minHeight: isMobile ? 40 : 32, ...(isMobile ? { minHeight: 40, justifyContent: "center" } : {}), color: "var(--ink)", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
            <LayoutTemplate size={13} aria-hidden="true" />{!isMobile && " Modèles"}
          </button>

          {/* Bouton Focus Mode (desktop uniquement — panneaux redimensionnables) */}
          {!isMobile && <button onClick={toggleFocus} title="Mode Focus — Ctrl+F"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-2)", border: `1px solid ${focusMode ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--line-strong)"}`, borderRadius: 8, padding: "0 12px", minHeight: 32, color: focusMode ? G : "var(--ink)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Maximize2 size={13} aria-hidden="true" /> Focus
          </button>}

          {/* Raccourcis clavier — OutilsDeLaBarre.tsx (liste : raccourcisClavier.ts) */}
          <AideDesRaccourcis isMobile={isMobile} />
          {/* Aperçu plein écran + Thème retirés de la barre : redondants avec les onglets du panneau
              de droite (Aperçu / Éditer / Thème) et « Voir en direct ». */}
          {qrTarget && !isMobile && <PanneauQrDeLaPage qrTarget={qrTarget} pageStatus={pageStatus} qrShortCode={qrShortCode} onPng={downloadQrPng} />}
          {pageId && pageSlug && pageStatus === "published" && !isMobile && (
            <ButtonLink href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer" size="sm"><ExternalLink size={11} /> Voir en direct</ButtonLink>
          )}

          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => { setShowPublishPopup(true); if (!guest && pageStatus !== "published" && !publishing && IS_UUID(liveId)) void handlePublish() }}
              title={pageStatus === "published" ? `En ligne · ${PHRASE_EN_DIRECT}` : undefined}
              className={pageStatus === "published" ? undefined : "da-btn-primary da-btn-primary--sm"}
              style={pageStatus === "published"
                ? { display: "flex", alignItems: "center", gap: 6, background: "rgba(57,255,143,0.12)", border: "1px solid rgba(57,255,143,0.35)", borderRadius: 9, padding: "8px 18px", color: "var(--success)", fontSize: 14, fontWeight: 700, cursor: "pointer" }
                : undefined}>
              {pageStatus==="published" ? <><Check size={13} /> Publié</> : <span>Publier</span>}
            </button>
            {/* Fenêtre « Publier » — FenetrePublier.tsx */}
            {showPublishPopup && (
              <FenetrePublier onClose={() => setShowPublishPopup(false)}
                guest={guest} pageStatus={pageStatus} pageSlug={pageSlug} pageName={pageName} blocks={blocks} theme={theme}
                pageStats={pageStats} liveId={liveId} publishing={publishing} publishSuccess={publishSuccess}
                publishWasUpdate={publishWasUpdate} publishError={publishError} setPublishError={setPublishError}
                handlePublish={handlePublish} qrTarget={qrTarget} qrShortCode={qrShortCode} handoff={handoff} downloadQrPng={downloadQrPng}
                onVoir={id => { setSelectedId(id); setRightTab("edit"); setShowPublishPopup(false); if (isMobile) setMobileTab("panel") }}
                onVoirTheme={() => { setRightTab("theme"); setShowPublishPopup(false); if (isMobile) setMobileTab("panel") }}
                onMasquer={id => setBlocks(p => p.map(b => b.id === id ? { ...b, visible: false } : b))} />
            )}
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

          {/* SIDEBAR BLOCS — masquée en mode Focus (concentration canvas + éditeur) */}
          <div style={{ width: isMobile ? "100%" : (blocksCollapsed ? 64 : blocksResize.width), background: "var(--bg)", borderRight: "1px solid var(--line)", display: (focusMode && !isMobile) ? "none" : (isMobile && mobileTab !== "blocks" ? "none" : "flex"), flexDirection: "column", flexShrink: isMobile ? 1 : 0, overflow: "hidden", transition: blocksCollapsed ? "width 0.25s ease" : "none", position: "relative" }}>
            {/* C02 — Bibliothèque refondue en overlay (flag ON, panneau déplié). Flag OFF ou rail replié :
                la bibliothèque legacy ci-dessous reste strictement inchangée (zéro régression). */}
            {BUILDER_REDESIGN && !blocksCollapsed && (
              <div style={{ position: "absolute", inset: 0, zIndex: 6, display: "flex", flexDirection: "column", background: "var(--field)" }}>
                <BlockLibrary favorites={favorites} recents={recentBlocks} recoContext={metier} mobile={isMobile} onAdd={addFromLibrary} onToggleFavorite={toggleFav} />
              </div>
            )}
            {/* Bouton collapse/expand */}
            <button onClick={toggleBlocks} aria-label={blocksCollapsed ? "Déployer la bibliothèque de blocs" : "Replier la bibliothèque de blocs"} title={blocksCollapsed ? "Ouvrir" : "Réduire"}
              style={{ position: "absolute", top: 8, right: 8, zIndex: 20, width: 32, height: 32, background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              {blocksCollapsed ? "›" : "‹"}
            </button>
            {/* Mode étendu: recherche normale */}
            {!blocksCollapsed && (
              <div style={{ padding: "10px 8px 10px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                <div style={{ position: "relative" }}>
                  <Search size={isMobile ? 15 : 13} style={{ position: "absolute", left: isMobile ? 12 : 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un bloc..."
                    style={{ width: "100%", height: isMobile ? 46 : 36, background: "var(--field)", border: "1px solid var(--line)", borderRadius: isMobile ? 11 : 9, padding: isMobile ? "0 34px 0 36px" : "0 28px 0 28px", color: "var(--ink)", fontSize: isMobile ? 15 : 12.5, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = "color-mix(in srgb, var(--accent) 50%, transparent)"; setBlockSearchFocus(true) }}
                    onBlur={e => { e.target.style.borderColor = "var(--line)"; setBlockSearchFocus(false) }} />
                  {search && <button onClick={() => setSearch("")} aria-label="Effacer" style={{ position: "absolute", right: isMobile ? 8 : 7, top: "50%", transform: "translateY(-50%)", width: isMobile ? 30 : undefined, height: isMobile ? 30 : undefined, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0 }}><X size={isMobile ? 15 : 10} /></button>}
                </div>
              </div>
            )}
            {/* Mode réduit: icône loupe */}
            {blocksCollapsed && (
              <div style={{ padding: "10px 0", display: "flex", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                <button onClick={toggleBlocks} aria-label="Replier la bibliothèque de blocs" style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "-4px 0" }}>
                  <Search size={16} />
                </button>
              </div>
            )}

            {!search && !blocksCollapsed && (
              <div style={{ padding: "8px 10px 6px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                {/* Téléphone (20 nov.) : les catégories tiennent sur UNE rangée qui défile
                    de côté. En grille 4 × 3, elles prenaient ~300 px — un tiers de
                    l'écran — avant le premier bloc. Libellés lisibles (13,5 px, plus 9,5). */}
                <div className={isMobile ? "biblio-rangee" : undefined} style={isMobile ? { display: "flex", gap: 6, overflowX: "auto", margin: "0 -10px", padding: "0 10px 2px" } : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {/* Essentiels — vue par defaut (~20 blocs les plus utiles). QWG-0017b */}
                  <button onClick={() => setActiveCategory("essentials")} title="Les blocs les plus utiles pour démarrer"
                    style={{ display: "flex", flexDirection: "row" as const, alignItems: "center", gap: isMobile ? 3 : 7, minWidth: 0, background: activeCategory==="essentials" ? "var(--surface-2)" : "transparent", border: `1px solid ${activeCategory==="essentials" ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--line)"}`, borderRadius: 9, padding: isMobile ? "0 13px" : "8px 10px", color: activeCategory==="essentials" ? "var(--accent)" : MUTED, fontSize: 12, fontWeight: activeCategory==="essentials" ? 600 : 500, cursor: "pointer", transition: "all 0.15s", textAlign: "left" as const }}>
                    <span style={{ fontSize: isMobile ? 16 : 15, flexShrink: 0 }}>✨</span>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontSize: isMobile ? 13.5 : undefined }}>{ONGLET_DU_METIER[metier]}</span>
                  </button>
                  {/* Catégorie Récents — visible seulement si au moins 1 récent */}
                  {recentBlocks.length > 0 && (
                    <button onClick={() => setActiveCategory("recents")} title="Blocs récemment utilisés"
                      style={{ display: "flex", flexDirection: "row" as const, alignItems: "center", gap: isMobile ? 3 : 7, minWidth: 0, background: activeCategory==="recents" ? "var(--surface-2)" : "transparent", border: `1px solid ${activeCategory==="recents" ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--line)"}`, borderRadius: 9, padding: isMobile ? "0 13px" : "8px 10px", color: activeCategory==="recents" ? "var(--accent)" : MUTED, fontSize: 12, fontWeight: activeCategory==="recents" ? 600 : 500, cursor: "pointer", transition: "all 0.15s", textAlign: "left" as const }}>
                      <span style={{ fontSize: isMobile ? 16 : 15, flexShrink: 0 }}>🕐</span>
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontSize: isMobile ? 13.5 : undefined }}>Récents</span>
                    </button>
                  )}
                  {/* Catégorie Favoris — visible seulement si au moins 1 favori */}
                  {favorites.length > 0 && (
                    <button onClick={() => setActiveCategory("favorites")} title="Vos blocs favoris"
                      style={{ display: "flex", flexDirection: "row" as const, alignItems: "center", gap: isMobile ? 3 : 5, minWidth: 0, background: activeCategory==="favorites" ? "var(--surface-2)" : "transparent", border: `1px solid ${activeCategory==="favorites" ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--line)"}`, borderRadius: 9, padding: isMobile ? "0 13px" : "8px 8px", color: activeCategory==="favorites" ? "var(--accent)" : MUTED, fontSize: 12, fontWeight: activeCategory==="favorites" ? 600 : 500, cursor: "pointer", transition: "all 0.15s", textAlign: "left" as const }}>
                      <span aria-hidden="true" style={{ fontSize: isMobile ? 16 : 15, flexShrink: 0 }}>⭐</span>
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontSize: isMobile ? 13.5 : undefined }}>Favoris</span>
                      <span style={{ display: isMobile ? "none" : undefined, marginLeft: "auto", flexShrink: 0, background: "rgba(255,215,0,0.15)", borderRadius: 10, padding: "0px 6px", fontSize: 11.5, fontWeight: 700 }}>{favorites.length}</span>
                    </button>
                  )}
                  {BLOCK_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} title={cat.desc}
                      className={activeCategory===cat.id ? "da-cat on" : "da-cat"}
                      style={{ display: "flex", flexDirection: "row" as const, alignItems: "center", gap: isMobile ? 3 : 5, minWidth: 0, background: activeCategory===cat.id ? "var(--surface-2)" : "transparent", border: `1px solid ${activeCategory===cat.id ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--line)"}`, borderRadius: 9, padding: isMobile ? "0 13px" : "6px 8px", minHeight: isMobile ? 44 : 32, color: activeCategory===cat.id ? "var(--accent)" : MUTED, fontSize: 12, fontWeight: activeCategory===cat.id ? 600 : 500, cursor: "pointer", transition: "background .18s ease, border-color .18s ease, color .18s ease", textAlign: "left" as const }}>
                      <span aria-hidden="true" style={{ fontSize: isMobile ? 16 : 15, flexShrink: 0 }}>{cat.icon}</span>
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontSize: isMobile ? 13.5 : undefined }}>{cat.label}</span>
                      {search && searchCounts ? (
                      <span style={{ display: isMobile ? "none" : undefined, marginLeft: "auto", flexShrink: 0, background: "var(--surface)", color: activeCategory===cat.id ? "var(--accent)" : MUTED, borderRadius: 999, padding: "0px 7px", fontSize: 11.5, fontWeight: 700, lineHeight: "17px" }}>
                        {searchCounts[cat.id] || 0}
                      </span>
                      ) : null}
                    </button>
                  ))}
                </div>
                {!(isMobile && activeCategory==="essentials") && <p style={{ color: MUTED, fontSize: 11.5, margin: "6px 0 0", paddingLeft: 2 }}>
                  {activeCategory==="essentials" ? (metier === "default" ? "Les blocs les plus utiles pour démarrer" : "Choisis d'après les blocs de votre page") + " — parcourez les catégories pour tout voir." : activeCategory==="recents" ? `${recentBlocks.length} bloc${recentBlocks.length>1?"s":""} récent${recentBlocks.length>1?"s":""}` : activeCategory==="favorites" ? `${favorites.length} bloc${favorites.length>1?"s":""} favori${favorites.length>1?"s":""}` : BLOCK_CATEGORIES.find(c => c.id===activeCategory)?.desc}
                </p>}
              </div>
            )}
            {/* Mode réduit : icônes catégories + drawer flottant */}
            {blocksCollapsed && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                {recentBlocks.length > 0 && (
                  <button onClick={() => { setDrawerCategory("recents"); setActiveCategory("recents") }}
                    title={`Récents (${recentBlocks.length})`} aria-label={`Blocs récents (${recentBlocks.length})`}
                    style={{ width: 44, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: (drawerCategory==="recents" || activeCategory==="recents") ? "var(--action)18" : "transparent", border: `1px solid ${(drawerCategory==="recents" || activeCategory==="recents") ? "var(--action)40" : "transparent"}`, borderRadius: 8, cursor: "pointer", fontSize: 16, transition: "all 0.15s" }}>
                    🕐
                  </button>
                )}
                {favorites.length > 0 && (
                  <button onClick={() => { setDrawerCategory("favorites"); setActiveCategory("favorites") }}
                    title={`Favoris (${favorites.length})`} aria-label={`Blocs favoris (${favorites.length})`}
                    style={{ width: 44, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: (drawerCategory==="favorites" || activeCategory==="favorites") ? "#FFD70018" : "transparent", border: `1px solid ${(drawerCategory==="favorites" || activeCategory==="favorites") ? "#FFD70040" : "transparent"}`, borderRadius: 8, cursor: "pointer", fontSize: 16, transition: "all 0.15s" }}>
                    ⭐
                  </button>
                )}
                {BLOCK_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setDrawerCategory(drawerCategory===cat.id ? null : cat.id); setActiveCategory(cat.id) }}
                    title={`${cat.label} (${catCounts[cat.id] || 0})`}
                    // Audit E (a11y) : l'emoji seul était le NOM annoncé (« bouton, éclair »).
                    aria-label={`Catégorie ${cat.label} (${catCounts[cat.id] || 0} blocs)`}
                    style={{ width: 44, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: (drawerCategory===cat.id || activeCategory===cat.id) ? cat.color+"18" : "transparent", border: `1px solid ${(drawerCategory===cat.id || activeCategory===cat.id) ? cat.color+"40" : "transparent"}`, borderRadius: 8, cursor: "pointer", fontSize: 16, transition: "all 0.15s", position: "relative" as const }}>
                    {cat.icon}
                  </button>
                ))}
              </div>
            )}

            {/* Liste de la bibliothèque (panneau déplié) — ListeDeLaBibliotheque.tsx */}
            {!blocksCollapsed && (
              <ListeDeLaBibliotheque search={search} setSearch={setSearch} filteredBlocks={filteredBlocks} groupedResults={groupedResults}
                activeCategory={activeCategory} recentBlocks={recentBlocks} favorites={favorites} isMobile={isMobile}
                metierOpen={metierOpen} setMetierOpen={setMetierOpen} addBlock={type => addBlock(type)}
                showPopover={showPopover} hidePopover={hidePopover} toggleFav={toggleFav} isFav={isFav} isCatCollapsed={isCatCollapsed} toggleCat={toggleCat}
                generateIdentityPreset={generateIdentityPreset} generateActionPreset={generateActionPreset} generateSocialPreset={generateSocialPreset}
                generateCommercePreset={generateCommercePreset} generateMediaPreset={generateMediaPreset} generateInfoPreset={generateInfoPreset} />
            )}
          </div>

          {/* POIGNÉE RESIZE sidebar blocs (souris uniquement -> masquée en mobile) */}
          {!blocksCollapsed && !isMobile && (
            <div
              onMouseDown={blocksResize.onMouseDown}
              style={{
                width: 4, flexShrink: 0, background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                borderRight: "1px solid color-mix(in srgb, var(--accent) 10%, transparent)",
                cursor: "col-resize", position: "relative", zIndex: 10,
                transition: "background 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 40%, transparent)"}
              onMouseLeave={e => e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 10%, transparent)"}
            >
              {/* Indicateur visuel */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", gap: 3 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 60%, transparent)" }} />)}
              </div>
            </div>
          )}

          {/* DRAWER FLOTTANT — mode réduit blocs */}
          {blocksCollapsed && drawerCategory && (
            <div ref={drawerRef} style={{ position: "absolute", left: 64, top: 0, width: 240, height: "100%", background: "#0D0D0D", borderRight: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 14 }}>{drawerCategory==="recents" ? "🕐" : drawerCategory==="favorites" ? "⭐" : BLOCK_CATEGORIES.find(c => c.id===drawerCategory)?.icon}</span>
                  <span style={{ color: drawerCategory==="recents" ? "var(--action)" : drawerCategory==="favorites" ? "#FFD700" : "var(--ink)", fontSize: 12, fontWeight: 700 }}>{drawerCategory==="recents" ? `Récents (${recentBlocks.length})` : drawerCategory==="favorites" ? `Favoris (${favorites.length})` : BLOCK_CATEGORIES.find(c => c.id===drawerCategory)?.label}</span>
                  {drawerCategory!=="recents" && drawerCategory!=="favorites" && (
                    <span style={{ background: "rgba(255,255,255,0.07)", color: MUTED, borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700, marginLeft: 4 }}>
                      {catCounts[drawerCategory||""] || 0}
                    </span>
                  )}
                </div>
                <button aria-label="Fermer la liste" onClick={() => setDrawerCategory(null)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 2 }}><X size={13} /></button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "5px 6px" }}>
                {(drawerCategory === "recents"
                  ? recentBlocks.filter(t => BLOCK_DEFS[t]).map(t => [t, BLOCK_DEFS[t]] as [string, (typeof BLOCK_DEFS)[string]])
                  : drawerCategory === "favorites"
                  ? blocsProposables().filter(([type]) => favorites.includes(type))
                  : blocsProposables().filter(([, def]) => def.category === drawerCategory)
                ).map(([type, def]) => (
                  <button key={type} onClick={() => { addBlock(type); setDrawerCategory(null) }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left" as const, marginBottom: 2 }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.background = BLOCK_DEFS[type]?.color+"10"; el.style.color = "var(--ink)" }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{def.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "inherit", lineHeight: 1.2 }}>{def.label}</p>
                      <p style={{ ...styleDeDescription(), color: MUTED }}>{def.description}</p>
                    </div>
                    <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); toggleFav(type) }}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleFav(type) } }}
                      title={isFav(type) ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={isFav(type)}
                      style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", flexShrink: 0, fontSize: 12, color: isFav(type) ? "#FFD700" : "rgba(255,255,255,0.25)" }}>
                      {isFav(type) ? "⭐" : "☆"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CANVAS */}
          <div className={isMobile ? undefined : "stage-grid"} style={{ flex: 1, overflowY: "auto", padding: preview && isMobile ? "0 0 96px" : isMobile ? "12px" : "24px", background: "var(--bg)", display: isMobile && mobileTab !== "canvas" ? "none" : undefined }}
            onClick={e => { if (e.target === e.currentTarget) { setSelectedId(null); setMultiSelection([]) } }}>
            {/* C04 — Toolbar canvas responsive (flag ON, desktop). Flag OFF = rien (canvas inchangé). */}
            {BUILDER_REDESIGN && !isMobile && !preview && canvasMode === "edit" && (() => {
              const chrome = canvasChrome(canvasDevice, false, "edit")
              return (
                <div data-barre-collante="" style={{ position: "sticky", top: 0, zIndex: 25, marginBottom: 12, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <CanvasToolbar
                    device={canvasDevice} orientation={canvasOrientation} zoom={canvasZoom} mode={canvasMode}
                    label={deviceLabel(canvasDevice, canvasOrientation, 900)} showOrientation={chrome.showOrientation} showZoom={chrome.showZoom}
                    onDevice={d => { setCanvasDevice(d); setCanvasZoom(1); setCanvasOrientation("portrait") }}
                    onToggleOrientation={() => setCanvasOrientation(toggleOrientation)}
                    onZoomIn={() => setCanvasZoom(z => stepZoom(z, 1))}
                    onZoomOut={() => setCanvasZoom(z => stepZoom(z, -1))}
                    onFit={() => setCanvasZoom(fitZoom(canvasDevice, canvasOrientation, 900))}
                    onReset={() => setCanvasZoom(1)}
                    onCenter={() => { try { document.querySelector('[data-block-id]')?.scrollIntoView({ behavior: "smooth", block: "start" }) } catch {} }}
                    onToggleMode={() => setCanvasMode("preview")}
                    onFullscreen={toggleFocus}
                  />
                </div>
              )
            })()}
            {BUILDER_REDESIGN && !isMobile && canvasMode === "preview" && (
              <div data-barre-collante="" style={{ position: "sticky", top: 0, zIndex: 25, marginBottom: 12, display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", background: "rgba(12,12,12,0.92)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: G, fontWeight: 700 }}>Aperçu</span>
                <div style={{ flex: 1 }} />
                <Button onClick={() => setCanvasMode("edit")} variant="ghost" size="sm">Éditer</Button>
              </div>
            )}
            <div style={BUILDER_REDESIGN && !isMobile
              ? { width: canvasDevice === "fluid" ? "100%" : deviceFrameWidth(canvasDevice, canvasOrientation, 900), maxWidth: canvasDevice === "fluid" ? 640 : "100%", margin: "0 auto", transform: canvasZoom !== 1 ? `scale(${canvasZoom})` : undefined, transformOrigin: "top center", borderRadius: canvasDevice !== "fluid" ? (canvasDevice === "mobile" ? 26 : 14) : 0, border: canvasDevice !== "fluid" ? "1px solid rgba(255,255,255,0.12)" : "none", boxShadow: canvasDevice !== "fluid" ? "0 10px 40px rgba(0,0,0,0.45)" : "none", overflow: canvasDevice !== "fluid" ? "hidden" : "visible", transition: "width 0.2s ease" }
              : { maxWidth: 640, margin: "0 auto" }}>
              {/* ── Toolbar flottante multi-sélection (≥2 blocs) : BarreMultiSelection.tsx ─────────────── */}
              {multiSelection.length >= 2 && (
                <BarreMultiSelection multiSelection={multiSelection} blocks={blocks} setBlocks={setBlocks}
                  toggleVisibleMulti={toggleVisibleMulti} duplicateMulti={duplicateMulti} deleteMulti={deleteMulti}
                  onDeselectionner={() => setMultiSelection([])} />
              )}
              {!preview && <div data-barre-collante="" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "6px 12px", background: "color-mix(in srgb, var(--bg) 88%, transparent)", border: "1px solid var(--line)", borderRadius: 9, backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10 }}>
                <span style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>Page</span>
                <span style={{ background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 6, padding: "2px 7px", fontSize: 11, color: "var(--ink)" }}>{blocks.length} bloc{blocks.length!==1?"s":""}</span>
                {blocks.filter(b => b.draft).length > 0 && (
                  <span style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 6, padding: "2px 6px", fontSize: 11, color: "var(--warning)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <Pencil size={9} /> {blocks.filter(b => b.draft).length} brouillon{blocks.filter(b => b.draft).length > 1 ? "s" : ""}
                  </span>
                )}
                {guest && isMobile && draftState === "saved" && <span style={{ color: "var(--success)", fontSize: 11, marginLeft: "auto" }}>Brouillon gardé</span>}
                {!guest && !pageId && <span style={{ color: "var(--muted)", fontSize: 11, marginLeft: "auto" }}>Mode démo</span>}
              </div>}

              <div style={{ ...bgStyle(), borderRadius: 20, overflow: "hidden", minHeight: 200, position: "relative", boxShadow: "0 24px 60px -30px rgba(0,0,0,0.8)", border: "1px solid var(--line-strong)" }}>
              {/* Effets overlay */}
              {(theme as any).effect_noise && (
                <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", opacity: (theme as any).noise_opacity ? (theme as any).noise_opacity/100 : 0.06, mixBlendMode: "overlay" as const, backgroundImage: NOISE_SVG_URL, backgroundRepeat: "repeat", backgroundSize: "128px 128px" }} />
              )}
              {(theme as any).effect_glow && <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 0%, ${(theme as any).glow_color||"#C9A84C"}${Math.round(((theme as any).glow_intensity||40)/100*180).toString(16).padStart(2,"0")}, transparent ${(theme as any).glow_size||300}px)` }} />}
              {(theme as any).effect_overlay && <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: (theme as any).overlay_color||"#000000", opacity: ((theme as any).overlay_opacity||30)/100 }} />}
              {(theme as any).effect_vignette && <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 50%, transparent ${Math.max(10, 100-((theme as any).vignette_intensity||40))}%, rgba(0,0,0,${((theme as any).vignette_intensity||40)/100}) 100%)` }} />}
              {(theme as any).effect_blur && (
                <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", backdropFilter: `blur(${(theme as any).blur_amount||4}px)`, WebkitBackdropFilter: `blur(${(theme as any).blur_amount||4}px)` }} />
              )}
              {blocks.length===0 ? (
                <div style={{ padding: "56px 30px 60px", textAlign: "center" }}>
                  <p style={{ color: "var(--muted)", fontSize: 28, margin: "0 0 8px" }}>✦</p>
                  <p style={{ color: "var(--ink)", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Votre page est vide</p>
                  <p style={{ color: MUTED, fontSize: 13, margin: "0 0 16px" }}>Ajoutez un premier bloc pour démarrer.</p>
                  <button type="button" onClick={() => { if (isMobile) setMobileTab("blocks"); else addBlock("profile") }} className="da-btn-primary da-btn-primary--sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Plus size={14} /> Ajouter un bloc
                  </button>
                </div>
              ) : blocks.map((block, idx) => {
                const def = BLOCK_DEFS[block.type]
                const isSelected = block.id === selectedId
                const isMultiSelected = multiSelection.includes(block.id)
                return (
                  <div key={block.id}
                    data-block-id={block.id}
                    onClick={(e) => handleBlockClick(e, block.id, idx)}
                    onDragOver={dragIdx === null ? undefined : (e) => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); const nb = (e.clientY - r.top) < r.height / 2 ? idx : idx + 1; setDropBefore(p => p === nb ? p : nb) }}
                    onDrop={dragIdx === null ? undefined : (e) => { e.preventDefault(); if (dragIdx === null) return; const ib = dropBefore ?? idx; const from = dragIdx; setBlocks(prev => reorderArray(prev, from, ib)); setDragIdx(null); setDropBefore(null) }}
                    style={{ fontFamily: theme.fontBody || "DM Sans, sans-serif", position: "relative", marginBottom: 0, border: "none", borderRadius: isSelected ? 10 : 0, overflow: "visible", cursor: block.locked ? "default" : "pointer", transition: "box-shadow 0.15s, background 0.1s", opacity: idx === dragIdx ? 0.4 : (block.visible ? (block.draft ? 0.6 : 1) : 0.35), background: isSelected ? "color-mix(in srgb, var(--accent) 5%, transparent)" : isMultiSelected ? "color-mix(in srgb, var(--accent) 6%, transparent)" : block.draft ? "rgba(251,191,36,0.03)" : "transparent", boxShadow: isSelected ? `inset 0 0 0 2px ${G}, 0 0 0 4px ${G}1f` : isMultiSelected ? `inset 3px 0 0 ${G}80` : block.draft ? "inset 3px 0 0 rgba(251,191,36,0.5)" : block.locked ? "inset 3px 0 0 rgba(168,161,144,0.55)" : "none" }}
                    onFocus={e => commandesDuBloc(e.currentTarget, true)}
                    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) commandesDuBloc(e.currentTarget, false) }}
                    // Survol = vraie souris seulement. Au doigt, le navigateur simule un
                    // survol juste AVANT le clic : les commandes réapparaissaient sous le
                    // doigt et c'est « Monter » qui recevait le toucher (20 nov.).
                    onPointerEnter={e => { if (e.pointerType !== "mouse") return; if (!isSelected) e.currentTarget.style.boxShadow = `inset 3px 0 0 color-mix(in srgb, var(--accent) 30%, transparent)`; commandesDuBloc(e.currentTarget, true) }}
                    onPointerLeave={e => { if (e.pointerType !== "mouse") return; if (!isSelected) e.currentTarget.style.boxShadow = "none"; commandesDuBloc(e.currentTarget, false) }}>

                    {/* C06 — bouton « + » d'insertion entre blocs (flag ON, desktop, mode édition) */}
                    {BUILDER_REDESIGN && !isMobile && !preview && canvasMode === "edit" && dragIdx === null && (
                      <div className="insert-between" style={{ position: "absolute", top: -9, left: 0, right: 0, zIndex: 16, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                        <div style={{ pointerEvents: "auto" }}><InsertBetweenBlocks index={idx} onInsert={onInsertAtGap} /></div>
                      </div>
                    )}

                    {/* Indicateur d'insertion du glisser-déposer (ligne dorée) */}
                    {dragIdx !== null && dropBefore === idx && <div style={{ position: "absolute", left: 0, right: 0, top: -1, height: 3, background: G, borderRadius: 2, zIndex: 20, boxShadow: `0 0 6px ${G}`, pointerEvents: "none" }} />}
                    {dragIdx !== null && idx === blocks.length - 1 && dropBefore === blocks.length && <div style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 3, background: G, borderRadius: 2, zIndex: 20, boxShadow: `0 0 6px ${G}`, pointerEvents: "none" }} />}

                    {/* Poignée de glisser-déposer (Phase 2, §2.14). draggable natif ; les blocs
                        verrouillés ne se glissent pas. Réordonnancement clavier (chevrons /
                        Alt+flèches) conservé pour l'accessibilité. */}
                    {!preview && <div className="block-handle"
                      draggable={!block.locked}
                      onDragStart={e => { e.stopPropagation(); setDragIdx(idx); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", String(idx)) } catch {} }}
                      onDragEnd={() => { setDragIdx(null); setDropBefore(null) }}
                      style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s", cursor: block.locked ? "not-allowed" : "grab", zIndex: 10, pointerEvents: "none" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 50%, transparent)" }} />)}
                      </div>
                    </div>}

                    {!preview && <div className="block-overlay" style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: isMobile ? 6 : 3, opacity: (isMobile && isSelected) ? 1 : 0, pointerEvents: (isMobile && isSelected) ? "auto" : "none", transition: "opacity 0.15s", zIndex: 10 }}
                      onClick={e => e.stopPropagation()}>
                      {/* Barre contextuelle du bloc (§2.1) : Monter/Descendre + Dupliquer (action fréquente) + "..." (reste dans le bottom sheet, cibles 40px mobile #6) */}
                      <button onClick={() => moveBlock(block.id, -1)} disabled={idx===0} title="Monter" aria-label="Monter le bloc" style={{ width: isMobile?40:32, height: isMobile?40:32, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: idx===0 ? "rgba(255,255,255,0.2)" : "var(--ink)", cursor: idx===0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7 }}><ChevronUp size={isMobile?17:10} /></button>
                      <button onClick={() => moveBlock(block.id, 1)} disabled={idx===blocks.length-1} title="Descendre" aria-label="Descendre le bloc" style={{ width: isMobile?40:32, height: isMobile?40:32, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: idx===blocks.length-1 ? "rgba(255,255,255,0.2)" : "var(--ink)", cursor: idx===blocks.length-1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7 }}><ChevronDown size={isMobile?17:10} /></button>
                      <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id) }} title="Dupliquer (Ctrl+D)" aria-label="Dupliquer le bloc" style={{ width: isMobile?40:32, height: isMobile?40:32, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7 }}><Copy size={isMobile?16:11} /></button>
                      <button onClick={e => { e.stopPropagation(); setBlockMenu(block.id) }} title="Plus d'actions" aria-label="Plus d'actions" style={{ width: isMobile?40:32, height: isMobile?40:32, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7 }}><MoreHorizontal size={isMobile?17:12} /></button>
                    </div>}

                    {!preview && isSelected && (isMobile || rightCollapsed || !(focusMode || rightTab === "edit")) && (
                      <div data-etiquette-bloc="" style={{ position: "absolute", bottom: -11, left: 22, display: "flex", alignItems: "center", gap: 4, background: "rgba(8,8,8,0.88)", backdropFilter: "blur(4px)", border: `1px solid ${G}25`, borderRadius: 6, padding: "2px 7px", zIndex: 12, pointerEvents: "none" }}>
                        <span style={{ fontSize: 11 }}>{def?.icon}</span>
                        <span style={{ color: G, fontSize: 11, fontWeight: 700 }}>{def?.label}</span>
                      </div>
                    )}
                    {block.draft && !block.locked && (
                      <div style={{ position: "absolute", top: 6, left: 22, display: "flex", alignItems: "center", gap: 4, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 5, padding: "2px 7px", zIndex: 10, pointerEvents: "none" }}>
                        <Pencil size={8} color="var(--warning)" />
                        <span style={{ color: "var(--warning)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const }}>Brouillon</span>
                      </div>
                    )}
                    {block.locked && (
                      <div style={{ position: "absolute", top: 6, right: 8, display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 5, padding: "2px 6px", zIndex: 10, pointerEvents: "none" }}>
                        <Lock size={8} color="var(--muted)" />
                        <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const }}>Verrouillé</span>
                      </div>
                    )}
                    {clickCounts[block.id] > 0 && (
                      <div title={`${clickCounts[block.id]} clic${clickCounts[block.id] > 1 ? "s" : ""} sur 90 jours`} style={{ position: "absolute", bottom: 6, right: 8, display: "flex", alignItems: "center", gap: 3, background: "rgba(57,255,143,0.12)", border: "1px solid rgba(57,255,143,0.3)", borderRadius: 20, padding: "2px 8px", zIndex: 10, pointerEvents: "none" }}>
                        <span style={{ fontSize: 11 }}>👆</span>
                        <span style={{ color: "var(--success)", fontSize: 11, fontWeight: 700 }}>{clickCounts[block.id]} clic{clickCounts[block.id] > 1 ? "s" : ""}</span>
                      </div>
                    )}

                    <div style={{ overflow: "hidden", minHeight: 36, position: "relative", zIndex: 2, ...blockDecoration(block.content, theme).style }}>
                      <PreviewBoundary><MemoBlockPreview block={block} theme={theme} dayMode={dayMode} editable={!preview && !(BUILDER_REDESIGN && canvasMode === "preview")} onEditField={onEditField} /></PreviewBoundary>
                    </div>
                  </div>
                )
              })}

              {/* C06 — insertion en fin de page via « + » (flag ON, desktop) */}
              {BUILDER_REDESIGN && !isMobile && !preview && canvasMode === "edit" && blocks.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                  <InsertBetweenBlocks index={blocks.length} onInsert={onInsertAtGap} />
                </div>
              )}

              {!preview && <button onClick={() => { setActiveCategory("identity"); setSearch("") }}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "color-mix(in srgb, var(--accent) 4%, transparent)", border: "2px dashed color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 14, padding: "18px", color: MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="color-mix(in srgb, var(--accent) 50%, transparent)"; e.currentTarget.style.color=G; e.currentTarget.style.background="color-mix(in srgb, var(--accent) 8%, transparent)"; e.currentTarget.style.transform="translateY(-1px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="color-mix(in srgb, var(--accent) 20%, transparent)"; e.currentTarget.style.color=MUTED; e.currentTarget.style.background="color-mix(in srgb, var(--accent) 4%, transparent)"; e.currentTarget.style.transform="translateY(0)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} color={G} /></div>
                Ajouter un nouveau bloc
              </button>}
              {!preview && <button onClick={() => setShowTemplates(true)}
                style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", border: "none", color: MUTED, fontSize: 12, cursor: "pointer", marginTop: 10 }}
                onMouseEnter={e => e.currentTarget.style.color = G} onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                <Sparkles size={13} /> ou partir d&apos;un modèle de page complet
              </button>}
              </div>
            </div>
          </div>

          {/* PANEL DROIT */}
          {/* POIGNÉE RESIZE panel droit (souris uniquement -> masquée en mobile) */}
          {!rightCollapsed && !isMobile && (
            <div
              onMouseDown={rightResize.onMouseDown}
              style={{
                width: 4, flexShrink: 0, background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                borderLeft: "1px solid color-mix(in srgb, var(--accent) 10%, transparent)",
                cursor: "col-resize", position: "relative", zIndex: 10,
                transition: "background 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 40%, transparent)"}
              onMouseLeave={e => e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 10%, transparent)"}
            >
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", gap: 3 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 60%, transparent)" }} />)}
              </div>
            </div>
          )}
          <div style={{ width: isMobile ? "100%" : (rightCollapsed ? 48 : (focusMode ? (focusNarrow ? 620 : 740) : rightResize.width)), background: "var(--bg)", borderLeft: "1px solid var(--line)", display: isMobile && mobileTab !== "panel" ? "none" : "flex", flexDirection: (focusMode && !isMobile) ? "row" : "column", flexShrink: isMobile ? 1 : 0, overflow: "hidden", transition: rightCollapsed ? "width 0.25s ease" : "none", position: "relative" }}>
            {/* Un seul niveau d'onglets (revue interne du 9 septembre) : Contenu · Style · Effets
                pour le bloc, Page pour le thème — plus de bandeau « Éditer · Thème » au-dessus. */}
            {rightCollapsed ? (
              <div style={{ display: focusMode ? "none" : "flex", flexDirection: "column", width: "100%", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
                {(["edit","theme"] as const).map(tab => (
                  <button key={tab} onClick={() => { setRightTab(tab); setRightCollapsed(false) }} aria-label={tab==="edit" ? "Ouvrir les réglages du bloc" : "Ouvrir le thème de la page"}
                    style={{ minHeight: 40, padding: "8px 4px", background: "transparent", border: "none", borderLeft: `2px solid ${rightTab===tab ? G : "transparent"}`, color: rightTab===tab ? G : MUTED, cursor: "pointer" }}>
                    {tab==="edit" ? <Pencil size={13} /> : <Palette size={13} />}
                  </button>
                ))}
                <button onClick={toggleRight} aria-label="Déployer le panneau" style={{ minHeight: 32, padding: "6px 4px", background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 14 }}>›</button>
              </div>
            ) : !focusMode && !(isMobile && rightTab === "theme") && (
              <div role="tablist" aria-label="Réglages" style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
                {([["contenu","Contenu"],["style","Style"],["effets","Effets"]] as const).map(([k, l]) => { const on = rightTab==="edit" && editTab===k; return (
                  <button key={k} role="tab" aria-selected={on} aria-disabled={!selectedBlock || undefined} onClick={() => { if (!selectedBlock) return; setRightTab("edit"); setEditTab(k) }}
                    style={{ flex: 1, minHeight: isMobile ? 44 : 40, padding: "0 3px", background: "transparent", border: "none", borderBottom: `2px solid ${on ? "var(--accent)" : "transparent"}`, marginBottom: -1, color: on ? "var(--ink)" : MUTED, opacity: selectedBlock ? 1 : 0.45, fontSize: 12.5, fontWeight: on ? 600 : 500, cursor: selectedBlock ? "pointer" : "default", whiteSpace: "nowrap" as const }}>{l}</button>
                ) })}
                <button role="tab" aria-selected={rightTab==="theme"} onClick={() => setRightTab("theme")}
                  style={{ display: isMobile ? "none" : undefined, flex: 1, minHeight: isMobile ? 44 : 40, padding: "0 3px", background: "transparent", border: "none", borderBottom: `2px solid ${rightTab==="theme" ? "var(--accent)" : "transparent"}`, marginBottom: -1, color: rightTab==="theme" ? "var(--ink)" : MUTED, fontSize: 12.5, fontWeight: rightTab==="theme" ? 600 : 500, cursor: "pointer", whiteSpace: "nowrap" as const }}>Page</button>
                {!isMobile && <button onClick={toggleRight} aria-label="Réduire le panneau" title="Réduire" style={{ width: 32, background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 14 }}>‹</button>}
              </div>
            )}

            {!rightCollapsed && (focusMode || rightTab==="edit") && (
              <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: "auto", padding: 14, position: "relative", borderRight: focusMode ? "1px solid rgba(255,255,255,0.08)" : undefined }}>
                {focusSectionHeader("Éditeur")}
                {/* C03 — Réglages refondus (flag ON) : coquille Simple/Avancé + injection du panneau
                    legacy (EditPanel) pour le design/disposition et les blocs non pilotes. Flag OFF =
                    éditeur historique ci-dessous strictement inchangé (zéro régression). */}
                {BUILDER_REDESIGN && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 6, background: "var(--bg)" }}>
                    <BlockSettingsPanel
                      block={selectedBlock ?? null}
                      mobile={isMobile}
                      index={selectedBlock ? blocks.findIndex(b => b.id === selectedBlock.id) : 0}
                      total={blocks.length}
                      onChange={(k, v) => { if (selectedBlock) updateBlock(selectedBlock.id, k, v) }}
                      onDuplicate={() => { if (selectedBlock) duplicateBlock(selectedBlock.id) }}
                      onDelete={() => { if (selectedBlock) deleteBlock(selectedBlock.id) }}
                      onToggleVisible={() => { if (selectedBlock) toggleVisible(selectedBlock.id) }}
                      onToggleLock={() => { if (selectedBlock) toggleLock(selectedBlock.id) }}
                      onToggleDraft={() => { if (selectedBlock) toggleDraft(selectedBlock.id) }}
                      onResetBlock={() => { if (selectedBlock) resetBlock(selectedBlock.id) }}
                      onRequestClose={() => setSelectedId(null)}
                      onOpenLibrary={() => { if (isMobile) setMobileTab("blocks") }}
                      onOpenOutline={() => setOutlineOpen(true)}
                      confirm={(m) => confirm({ title: "Confirmer", message: m, confirmLabel: "Confirmer" })}
                      renderLegacyContent={(b) => <EditPanel key={b.id+"-c"} block={b} onChange={(k, v) => updateBlock(b.id, k, v)} only="content" />}
                      renderLegacyDesign={(b) => <><EditPanel key={b.id+"-a"} block={b} onChange={(k, v) => updateBlock(b.id, k, v)} only="apparence" /><EditPanel key={b.id+"-l"} block={b} onChange={(k, v) => updateBlock(b.id, k, v)} only="layout" /></>}
                    />
                  </div>
                )}
                {!selectedBlock
                  ? <InspecteurVide vide={blocks.length === 0} isMobile={isMobile}
                      onChoisirBloc={() => { if (isMobile) setMobileTab("blocks"); else { setBlocksCollapsed(false); setFocusMode(false) } }}
                      onVoirPage={() => setMobileTab("canvas")}
                      onPremierBloc={() => { setSelectedId(blocks[0].id); setRightTab("edit") }} />
                  : <>
                      {/* Au téléphone (20 nov.) : une ligne — icône, nom, ⋯. « Propriétés » et la
                          description répétaient ce qu'on vient de toucher, sur ~160 px. */}
                      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: isMobile ? 12 : 16, paddingBottom: isMobile ? 10 : 12, borderBottom: "1px solid var(--line)" }}>
                        <div style={{ minWidth: 0 }}>
                          {!isMobile && <p style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", margin: "0 0 3px" }}>Propriétés</p>}
                          <p style={{ color: "var(--ink)", fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: "-.01em" }}><span aria-hidden="true" style={{ marginRight: 7 }}>{BLOCK_DEFS[selectedBlock.type]?.icon}</span>{BLOCK_DEFS[selectedBlock.type]?.label}</p>
                          {!isMobile && <p style={{ color: MUTED, fontSize: 11, margin: "2px 0 0" }}>{BLOCK_DEFS[selectedBlock.type]?.description}</p>}
                        </div>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                          {/* #11 : une seule action "..." -> meme bottom sheet que l'overlay (dup/masquer/verrouiller/brouillon/supprimer) */}
                          <button onClick={() => setBlockMenu(selectedBlock.id)} title="Plus d'actions" aria-label="Plus d'actions" style={{ background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, cursor: "pointer", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}><MoreHorizontal size={isMobile ? 17 : 14} /></button>
                        </div>
                      </div>
                      {/* Réglages du bloc (Contenu · Style · Effets · Avancés) — ReglagesDuBloc.tsx */}
                      <ReglagesDuBloc selectedBlock={selectedBlock} updateBlock={updateBlock} setBlocks={setBlocks}
                        duplicateBlock={duplicateBlock} deleteBlock={deleteBlock} focusMode={focusMode} isMobile={isMobile}
                        editTab={editTab} setEditTab={setEditTab} styleClipboard={styleClipboard} setStyleClipboard={setStyleClipboard}
                        avanceOuvert={avanceOuvert} setAvanceOuvert={setAvanceOuvert} />
                    </>
                }
              </div>
            )}

            {!rightCollapsed && (focusMode || rightTab==="theme") && (
              <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: "auto", padding: 14 }}>
                {focusSectionHeader("Thème")}
                <ThemePanel theme={theme} onThemeChange={commitTheme} userPlan={userPlan}
                  previewName={(blocks.find(b => b.type === "profile")?.content as any)?.name || pageName}
                  previewAvatar={(blocks.find(b => b.type === "profile")?.content as any)?.avatar || ""} />
              </div>
            )}

          </div>
        </div>

        {/* BARRE D'ONGLETS MOBILE — un panneau à la fois (palette | page | réglages) */}
        {/* Barre flottante en mode Apercu : sortir + voir en direct (#02) */}
        {isMobile && preview && (
          <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, display: "flex", gap: 10, padding: "10px 14px calc(10px + env(safe-area-inset-bottom))", background: "rgba(12,11,9,0.9)", backdropFilter: "blur(14px)", borderTop: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
            <button onClick={() => setPreview(false)} className="da-btn-primary da-btn-primary--sm" style={{ flex: 1, minHeight: 48, justifyContent: "center" }}>
              <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} /> <span>Modifier</span>
            </button>
            {pageSlug && <ButtonLink href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm"><ExternalLink size={14} /> Voir en direct</ButtonLink>}
          </div>
        )}

        {/* #13 : pendant la recherche de bloc, on masque la barre du bas -> les resultats prennent toute la hauteur au-dessus du clavier */}
        {/* C06 — le shell mobile (flag ON) remplace la barre historique : on l'évite pour ne pas
            créer deux navigations simultanées (§4). */}
        {isMobile && !BUILDER_REDESIGN && !preview && !(blockSearchFocus && mobileTab === "blocks") && (
          <div style={{ flexShrink: 0, display: "flex", background: "var(--bg)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
            {/* Quatre onglets (20 nov.) : le thème de la page avait son propre bouton
                dans la coquille redessinée, mais ici il dormait dans Réglages, sous un
                sous-onglet… « Page » — le même mot que l'onglet du bas, pour autre
                chose. « Thème » s'ouvre maintenant en un toucher ; « Modifier » dit
                ce qu'on y fait. */}
            {([
              { id: "blocks", label: "Blocs", icon: <Layers size={18} aria-hidden="true" />, ouvrir: () => setMobileTab("blocks"), on: mobileTab === "blocks" },
              { id: "canvas", label: "Page", icon: <Smartphone size={18} aria-hidden="true" />, ouvrir: () => setMobileTab("canvas"), on: mobileTab === "canvas" },
              { id: "edit", label: "Modifier", icon: <Pencil size={18} aria-hidden="true" />, ouvrir: () => { setRightTab("edit"); setMobileTab("panel") }, on: mobileTab === "panel" && rightTab !== "theme" },
              { id: "theme", label: "Thème", icon: <Palette size={18} aria-hidden="true" />, ouvrir: () => { setRightTab("theme"); setMobileTab("panel") }, on: mobileTab === "panel" && rightTab === "theme" },
            ]).map(t => {
              const on = t.on
              return (
                <button key={t.id} onClick={t.ouvrir} aria-current={on ? "page" : undefined}
                  style={{ flex: 1, minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 4px", background: "transparent", border: "none", borderTop: `2px solid ${on ? G : "transparent"}`, color: on ? G : MUTED, fontSize: 11, fontWeight: on ? 600 : 500, cursor: "pointer" }}>
                  <span style={{ display: "flex" }}>{t.icon}</span>{t.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Actions secondaires d'un bloc (bottom sheet) — #10 : sorties de l'overlay pour desencombrer */}
        {blockMenu && (() => {
          const b = blocks.find(x => x.id === blockMenu)
          if (!b) return null
          const def = BLOCK_DEFS[b.type]
          const items: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }[] = [
            { icon: <Copy size={17} />, label: "Dupliquer", onClick: () => { duplicateBlock(b.id); setBlockMenu(null) } },
            { icon: b.visible ? <EyeOff size={17} /> : <Eye size={17} />, label: b.visible ? "Masquer" : "Afficher", onClick: () => { toggleVisible(b.id); setBlockMenu(null) } },
            { icon: b.locked ? <Unlock size={16} /> : <Lock size={16} />, label: b.locked ? "Déverrouiller" : "Verrouiller", onClick: () => { toggleLock(b.id); setBlockMenu(null) } },
            ...(b.locked ? [] : [{ icon: <Pencil size={16} />, label: b.draft ? "Retirer du brouillon" : "Mettre en brouillon", onClick: () => { toggleDraft(b.id); setBlockMenu(null) } }]),
            ...(b.locked ? [] : [{ icon: <RefreshCw size={16} />, label: "Réinitialiser", onClick: () => { resetBlock(b.id); setBlockMenu(null) } }]),
            ...(b.locked ? [] : [{ icon: <Trash2 size={17} color="var(--danger)" />, label: "Supprimer", danger: true, onClick: () => { deleteBlock(b.id); setBlockMenu(null) } }]),
          ]
          return (
            <ActionSheet open titre={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span>{def?.icon}</span> {def?.label || "Bloc"}</span>}
              onFermer={() => setBlockMenu(null)}
              actions={items.map(it => ({ icone: it.icon, libelle: it.label, onClick: it.onClick, danger: it.danger }))} />
          )
        })()}

        {/* Popover aperçu bloc */}
        {popover && (() => {
          const def = BLOCK_DEFS[popover.type]
          const hint = BLOCK_HINTS[popover.type]
          if (!def) return null
          const cat = BLOCK_CATEGORIES.find(c => c.id === def.category)
          // Ajustement vertical pour rester dans l'écran
          const adjustedY = Math.min(popover.y, window.innerHeight - 200)
          return (
            <div style={{
              position: "fixed", left: popover.x, top: adjustedY, zIndex: 9999,
              width: 220, background: "var(--surface)",
              border: `1px solid ${def.color}30`,
              borderRadius: 14, overflow: "hidden",
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
              animation: "popoverIn 0.15s ease",
              pointerEvents: "none",
            }}>
              {/* Header coloré */}
              <div style={{ padding: "12px 14px", background: `linear-gradient(135deg, ${def.color}12, ${def.color}06)`, borderBottom: `1px solid ${def.color}20` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: def.color+"18", border: `1px solid ${def.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{def.icon}</div>
                  <div>
                    <p style={{ color: "var(--ink)", fontSize: 12, fontWeight: 700, margin: "0 0 1px" }}>{def.label}</p>
                    {cat && <span style={{ background: cat.color+"15", color: cat.color, borderRadius: 10, padding: "1px 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.8 }}>{cat.label}</span>}
                  </div>
                </div>
                <p style={{ color: "rgba(245,240,232,0.65)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{def.description}</p>
              </div>
              {/* Preview + hint */}
              <div style={{ padding: "10px 14px" }}>
                {hint ? (
                  <>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 10px", marginBottom: 8, fontFamily: "monospace", fontSize: 11, color: "rgba(245,240,232,0.5)", lineHeight: 1.5 }}>
                      {hint.preview}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Lightbulb size={10} />
                      <span style={{ color: def.color, fontSize: 11, fontWeight: 500 }}>{hint.hint}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Lightbulb size={10} />
                    <span style={{ color: MUTED, fontSize: 11 }}>Cliquez pour ajouter à la page</span>
                  </div>
                )}
              </div>
              {/* Champs disponibles */}
              {def.fields.length > 0 && (
                <div style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {def.fields.slice(0, 4).map(f => (
                    <span key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "2px 6px", fontSize: 11, color: "rgba(245,240,232,0.4)" }}>{f.label.split(" — ").pop()}</span>
                  ))}
                  {def.fields.length > 4 && <span style={{ fontSize: 11, color: MUTED }}>+{def.fields.length - 4}</span>}
                </div>
              )}
            </div>
          )
        })()}

        {/* MODALE — Modèles de page complets (par métier -> sous-variantes) */}
        {showTemplates && (
          <div onClick={() => setShowTemplates(false)}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 860, maxHeight: "88vh", background: "#111", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
              {/* En-tête */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkles size={20} color={G} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: "var(--ink)", fontSize: 15, fontWeight: 700 }}>Modèles de page</p>
                  <p style={{ margin: 0, color: MUTED, fontSize: 11 }}>Une page complète et cohérente en un clic — personnalisable ensuite.</p>
                </div>
                <button onClick={() => setShowTemplates(false)} aria-label="Fermer" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: MUTED, cursor: "pointer", width: 30, height: 30, fontSize: 16 }}>×</button>
              </div>
              {/* Génération par IA : ./PanneauGenerationIa (formule dite avant, lib/generationIa). */}
              <PanneauGenerationIa session={authState} plan={userPlan} isMobile={isMobile} onPage={applyPageTemplate} />
              <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
                {/* Colonne métiers */}
                <div style={{ width: 190, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", padding: 8 }} className="iphone-scroll">
                  {GROUPES_DU_CATALOGUE.map(grp => {
                    const on = templateGroup === grp
                    const emoji = CATALOGUE_DES_MODELES.find(t => t.group === grp)?.emoji || "📄"
                    return (
                      <button key={grp} onClick={() => setTemplateGroup(grp)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", marginBottom: 3, borderRadius: 9, border: "none", cursor: "pointer", background: on ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent", color: on ? G : "#C8C2B6", fontSize: 12, fontWeight: on ? 700 : 500, textAlign: "left" as const }}>
                        <span style={{ fontSize: 15 }}>{emoji}</span>{grp}
                      </button>
                    )
                  })}
                </div>
                {/* Variantes du métier */}
                <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignContent: "start" }} className="iphone-scroll">
                  {CATALOGUE_DES_MODELES.filter(t => t.group === templateGroup).map(tpl => (
                    <div key={tpl.key} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 13, overflow: "hidden", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column" }}>
                      {/* Mini-apercu de page (avatar + titre + CTA aux couleurs du theme) — plus visuel (#16) */}
                      <div style={{ height: 148, background: tpl.theme.bgGradient || tpl.theme.bg, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "16px" }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${tpl.theme.primary}, ${tpl.theme.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>{tpl.emoji}</div>
                        <div style={{ width: "56%", height: 6, borderRadius: 3, background: (tpl.theme as any).text || "#F5F0E8", opacity: 0.9 }} />
                        <div style={{ width: "40%", height: 4, borderRadius: 2, background: (tpl.theme as any).muted || "#9A948A", opacity: 0.7 }} />
                        <div style={{ width: "74%", height: 15, borderRadius: 8, background: tpl.theme.accent || tpl.theme.primary, marginTop: 3, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
                        <div style={{ position: "absolute", bottom: 7, right: 7, display: "flex", gap: 3 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: tpl.theme.primary, border: "1px solid rgba(255,255,255,0.25)" }} />
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: tpl.theme.accent, border: "1px solid rgba(255,255,255,0.25)" }} />
                        </div>
                      </div>
                      <div style={{ padding: "11px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <p style={{ margin: "0 0 2px", color: "var(--ink)", fontSize: 13, fontWeight: 700 }}>{tpl.label}</p>
                        <p style={{ margin: "0 0 8px", color: MUTED, fontSize: 12, lineHeight: 1.4 }}>{tpl.desc}</p>
                        <p style={{ margin: "0 0 10px", color: "#6E685E", fontSize: 11.5 }}>{tpl.blocks.length} sections · {(BLOCK_DEFS[tpl.blocks[0]?.type]?.label) || ""}…</p>
                        <Button onClick={() => applyPageTemplate(tpl)} variant="secondary" size="sm" fullWidth>Utiliser ce modèle</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          blockDefs={BLOCK_DEFS}
          recentBlockTypes={recentBlocks}
          onInsertBlock={(t) => addBlock(t)}
          commands={[
            { id: "undo", label: "Annuler", hint: "Ctrl+Z", keywords: "undo revenir historique", icon: "↶", run: () => { const p = undoRedo.undo(); if (p) applySnapshot(p) } },
            { id: "redo", label: "Rétablir", hint: "Ctrl+⇧+Z", keywords: "redo refaire", icon: "↷", run: () => { const n = undoRedo.redo(); if (n) applySnapshot(n) } },
            { id: "save", label: "Enregistrer maintenant", hint: "Ctrl+S", keywords: "sauvegarder save", icon: "💾", run: saveNow },
            { id: "publish", label: "Publier la page", keywords: "publier ligne", icon: "🚀", run: () => { void handlePublish() } },
            { id: "preview", label: "Aperçu plein écran", hint: "Ctrl+P", keywords: "prévisualiser voir", icon: "👁", run: () => setPreview(true) },
            { id: "templates", label: "Modèles de page", keywords: "template modèle gabarit", icon: "✨", run: () => setShowTemplates(true) },
            { id: "duplicate", label: "Dupliquer la sélection", hint: "Ctrl+D", keywords: "dupliquer clone copie", icon: "⧉", run: duplicateSelection },
            { id: "copy", label: "Copier la sélection", hint: "Ctrl+C", keywords: "copier", icon: "⎘", run: copySelection },
            { id: "paste", label: "Coller", hint: "Ctrl+V", keywords: "coller paste", icon: "📋", run: pasteClipboard },
            { id: "outline", label: "Plan de la page", keywords: "plan structure calques navigation sommaire", icon: "☰", run: () => setOutlineOpen(true) },
            { id: "theme", label: "Ouvrir le thème", keywords: "thème couleur police design", icon: "🎨", run: () => setRightTab("theme") },
            { id: "focus", label: "Mode Focus", hint: "Ctrl+F", keywords: "focus concentration", icon: "◱", run: toggleFocus },
            { id: "expert", label: expertMode ? "Replier les réglages avancés" : "Déplier les réglages avancés", keywords: "simple expert avancé réglages", icon: "⚙", run: () => { setExpertMode(v => !v); setAvanceOuvert(v => !v) } },
          ] as PaletteCommand[]}
        />

        <OutlinePanel
          open={outlineOpen}
          onClose={() => setOutlineOpen(false)}
          blocks={blocks}
          blockDefs={BLOCK_DEFS}
          onSelect={(id) => {
            setSelectedId(id); setRightTab("edit")
            if (isMobile) setMobileTab("canvas")
            setOutlineOpen(false)
            setTimeout(() => { try { document.querySelector(`[data-block-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }) } catch {} }, 60)
          }}
          onMove={(id, dir) => moveBlock(id, dir)}
        />

        <style>{`
          @keyframes popoverIn { from { opacity: 0; transform: translateX(-4px) scale(0.97) } to { opacity: 1; transform: translateX(0) scale(1) } }
          @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
          @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
          @keyframes auroraShift{0%{background-position:0% 0%}33%{background-position:100% 0%}66%{background-position:50% 100%}100%{background-position:0% 0%}}
          .iphone-scroll::-webkit-scrollbar{display:none}
          .panel-collapse{transition:width 0.25s var(--mo-ease-emphasized)}
          .focus-mode .sidebar{width:64px!important}
          /* Le contour de focus clavier vit dans globals.css : il vaut pour toute l'application, pas seulement quand l'éditeur est ouvert. */
        `}</style>
      </div>
    )
  }
