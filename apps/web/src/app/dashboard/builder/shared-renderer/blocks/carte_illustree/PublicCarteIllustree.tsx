"use client"
// carte_illustree — la carte d'un snack, d'un kebab, d'un burger (lot fast-food, 18 nov.).
//
// On commande avec les yeux : photo par produit, badges choisis dans une liste,
// catégories en pastilles collantes AVEC leur compte, recherche dans toute la
// carte, et une fiche au toucher (grande photo, suppléments, allergènes).
//
// La fiche est un <dialog> natif : focus, Échap et voile fournis par le
// navigateur, zéro octet de plus sur la page qu'un client ouvre en scannant.
// Le modèle (lecture, catégories, recherche) est PUR : models/carteIllustree.

import { useLangueDeLaPage } from "../../primitives/langueDeLaPage"
import { prixAffiche } from "@/lib/prixAffiche"
import { barre, Mention } from "../../primitives/MenuItemList"
import { useEffect, useMemo, useRef, useState } from "react"
import SmartImage from "@/components/SmartImage"
import {
  produitsDeLaCarte, categoriesDeLaCarte, produitsParCategorie, chercherDansLaCarte,
  ancreDeCategorie, aUneFiche, STYLE_DES_BADGES, type ProduitDeCarte,
} from "../../models/carteIllustree"
import type { UnifiedCtx } from "../../renderTypes"
import { lire, ecrire } from "@/lib/memoireDuNavigateur"
import {
  LIBELLES, languesCochees, lireTraduction, traduireProduits, langueDuVisiteur, type CodeLangue,
} from "../../models/traductionCarte"

type L = (typeof LIBELLES)["fr"]
const CLE_LANGUE = "qrowg.carte.langue"

const px = (u: UnifiedCtx, n: number) => Math.round(n * u.scale)

function Badge({ badge, u, petit, L }: { badge: ProduitDeCarte["badge"]; u: UnifiedCtx; petit?: boolean; L: L }) {
  if (!badge) return null
  const s = STYLE_DES_BADGES[badge]
  const teinte = u.lisible(s.teinte, 4.5)
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: px(u, 4), whiteSpace: "nowrap",
      padding: `${px(u, 2)}px ${px(u, petit ? 7 : 9)}px`, borderRadius: 999,
      background: `color-mix(in srgb, ${s.teinte} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${s.teinte} 38%, transparent)`,
      color: teinte, fontSize: px(u, petit ? 11 : 12), fontWeight: 700, fontFamily: u.FONT_B, lineHeight: 1.3,
    }}>
      <span aria-hidden="true">{s.icone}</span>{L.badges[badge]}
    </span>
  )
}

function Ligne({ p, u, grille, onOuvrir, L }: { p: ProduitDeCarte; u: UnifiedCtx; grille: boolean; onOuvrir?: (p: ProduitDeCarte) => void; L: L }) {
  const ouvrable = !!onOuvrir && aUneFiche(p)
  // <bdi dir="ltr"> : en arabe, « 8,50 € » s'inversait en « € 8,50 ».
  const prix = p.prix && <bdi dir="ltr" style={{ alignSelf: "flex-start", color: u.G, fontSize: px(u, 15), fontWeight: 800, fontFamily: u.FONT_B, whiteSpace: "nowrap", ...barre(p.epuise) }}>{prixAffiche(p.prix)}</bdi>
  const texte = (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: px(u, 4) }}>
      {p.badge && <div><Badge badge={p.badge} u={u} petit L={L} /></div>}
      <p style={{ margin: 0, color: u.TEXT, fontSize: px(u, 15), fontWeight: 700, fontFamily: u.FONT_D, lineHeight: 1.25 }}><span style={barre(p.epuise)}>{p.nom}</span>{p.epuise && <Mention primary={u.G} fs={n => px(u, n)} libelle={L.epuise} />}</p>
      {p.description && (
        <p style={{ margin: 0, color: u.MUTED, fontSize: px(u, 13), lineHeight: 1.45, fontFamily: u.FONT_B,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</p>
      )}
      {!grille && prix}
    </div>
  )
  const style: React.CSSProperties = grille
    ? { display: "flex", flexDirection: "column", background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 14, overflow: "hidden", textAlign: "start", padding: 0, width: "100%", font: "inherit", color: "inherit" }
    : { display: "flex", alignItems: "center", gap: px(u, 12), background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: 14, padding: px(u, 10), textAlign: "start", width: "100%", font: "inherit", color: "inherit", minHeight: 44 }
  const image = p.image && (
    <SmartImage src={p.image} alt="" width={grille ? 320 : 88} height={grille ? 200 : 88} sizes={grille ? "(max-width: 640px) 50vw, 320px" : "88px"}
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
      style={grille
        ? { width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }
        : { width: px(u, 84), height: px(u, 84), borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
  )
  const contenu = grille
    ? <>{image}<div style={{ padding: px(u, 10), display: "flex", flexDirection: "column", gap: px(u, 6), flex: 1 }}>{texte}{prix}</div></>
    : <>{image}{texte}</>
  return ouvrable
    ? <button type="button" data-produit={p.rang} aria-haspopup="dialog" onClick={() => onOuvrir!(p)} style={{ ...style, cursor: "pointer" }}>{contenu}</button>
    : <div data-produit={p.rang} style={style}>{contenu}</div>
}

function Fiche({ p, u, refDialog, onFermer, L }: { p: ProduitDeCarte | null; u: UnifiedCtx; refDialog: React.RefObject<HTMLDialogElement>; onFermer: () => void; L: L }) {
  return (
    <dialog ref={refDialog} className="carte-fiche" aria-label={p ? p.nom : "Produit"} onClose={onFermer}
      onClick={e => { if (e.target === e.currentTarget) refDialog.current?.close() }}
      style={{ padding: 0, border: "none", borderRadius: 18, width: "min(440px, calc(100vw - 24px))", maxHeight: "calc(100dvh - 32px)", background: u.SURFACE, color: u.TEXT, overflow: "auto" }}>
      {p && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {p.image && <SmartImage src={p.image} alt={p.nom} width={440} height={300} sizes="440px" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", display: "block" }} />}
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <h3 style={{ flex: 1, margin: 0, fontSize: 20, fontWeight: 800, fontFamily: u.FONT_D, lineHeight: 1.2 }}><span style={barre(p.epuise)}>{p.nom}</span>{p.epuise && <Mention primary={u.G} libelle={L.epuise} />}</h3>
              {p.prix && <bdi dir="ltr" style={{ color: u.G, fontSize: 18, fontWeight: 800, fontFamily: u.FONT_B, whiteSpace: "nowrap" }}>{prixAffiche(p.prix)}</bdi>}
            </div>
            {p.badge && <div><Badge badge={p.badge} u={u} L={L} /></div>}
            {p.description && <p style={{ margin: 0, color: u.MUTED, fontSize: 14, lineHeight: 1.55, fontFamily: u.FONT_B }}>{p.description}</p>}
            {p.supplements.length > 0 && (
              <div>
                <p style={{ margin: "6px 0 6px", fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: u.MUTED, fontFamily: u.FONT_B }}>{L.supplements}</p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  {p.supplements.map((s, i) => (
                    <li key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, fontFamily: u.FONT_B, padding: "6px 0", borderBottom: `1px solid ${u.LINE}` }}>
                      <span>{s.nom}</span>{s.prix && <bdi dir="ltr" style={{ color: u.G, fontWeight: 700 }}>{prixAffiche(s.prix)}</bdi>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.allergenes.length > 0 && (
              <div>
                <p style={{ margin: "6px 0 6px", fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: u.MUTED, fontFamily: u.FONT_B }}>{L.allergenes}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.allergenes.map(a => <span key={a} style={{ padding: "3px 10px", borderRadius: 999, border: `1px solid ${u.LINE_STRONG}`, fontSize: 13, fontFamily: u.FONT_B }}>{a}</span>)}
                </div>
              </div>
            )}
            <button type="button" className="carte-bouton carte-bouton--large" onClick={() => refDialog.current?.close()}>{L.fermer}</button>
          </div>
        </div>
      )}
    </dialog>
  )
}

export function CarteIllustreeVue({ content: c, u, blockId }: { content: Record<string, any>; u: UnifiedCtx; blockId: string }) {
  // La langue (lot fast-food 3) : celles que le commerçant a cochées ET remplies.
  const offertes = useMemo(() => languesCochees(c).filter(l => String(c[`tr_${l}`] || "").trim()), [c])
  const [langLocale, setLang] = useState<CodeLangue>("fr")
  // Vague 2 : sur une page publiée, la langue est celle de la PAGE (une barre pour
  // toutes ses cartes) ; hors page (éditeur, miniatures), la carte garde la sienne.
  const page = useLangueDeLaPage()
  const lang: CodeLangue = page ? (offertes.includes(page.langue) ? page.langue : "fr") : langLocale
  const publicModeLangue = u.mode === "public" && !page
  useEffect(() => {
    if (!publicModeLangue || offertes.length === 0) return
    const choisie = lire(CLE_LANGUE)
    const prefs = [...(choisie ? [choisie] : []), ...(typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [])]
    setLang(langueDuVisiteur(prefs, offertes))
  }, [publicModeLangue, offertes])
  const choisirLangue = (l: CodeLangue) => { setLang(l); ecrire(CLE_LANGUE, l) }
  const L = LIBELLES[lang]
  const traduction = useMemo(() => (lang === "fr" ? null : lireTraduction(c[`tr_${lang}`])), [c, lang])
  const produits = useMemo(() => traduireProduits(produitsDeLaCarte(c), traduction), [c, traduction])
  const categories = useMemo(() => categoriesDeLaCarte(produits), [produits])
  const [requete, setRequete] = useState("")
  const [active, setActive] = useState<string | null>(null)
  const [ouvert, setOuvert] = useState<ProduitDeCarte | null>(null)
  const refDialog = useRef<HTMLDialogElement>(null)
  const publicMode = u.mode === "public"
  const grille = String(c.layout || "Liste") === "Grille"
  const recherche = String(c.show_search || "Oui") !== "Non" && produits.length > 6
  const trouves = useMemo(() => chercherDansLaCarte(produits, requete), [produits, requete])
  const enRecherche = requete.trim().length > 0

  const ouvrir = publicMode ? (p: ProduitDeCarte) => { setOuvert(p); requestAnimationFrame(() => refDialog.current?.showModal()) } : undefined
  const aller = (nom: string) => {
    setActive(nom)
    if (!publicMode) return
    document.getElementById(ancreDeCategorie(blockId, nom))?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const liste = (ps: ProduitDeCarte[]) => (
    <div style={grille
      ? { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: px(u, 10) }
      : { display: "flex", flexDirection: "column", gap: px(u, 8) }}>
      {ps.map(p => <Ligne key={p.rang} p={p} u={u} grille={grille} onOuvrir={ouvrir} L={L} />)}
    </div>
  )

  return (
    // Les couleurs du COMMERÇANT, posées une fois en variables : le champ et les
    // boutons de la carte les lisent par leur classe (globals.css, `.carte-*`) au
    // lieu de se dessiner chacun en ligne.
    <section data-carte-illustree="" lang={lang} dir={L.dir} style={{
      padding: `${px(u, 14)}px ${px(u, 16)}px`,
      ["--carte-texte" as string]: u.TEXT, ["--carte-ligne" as string]: u.LINE_STRONG, ["--carte-fond" as string]: u.FILL,
      ["--carte-police" as string]: u.FONT_B, ["--carte-accent" as string]: u.G, ["--carte-discret" as string]: u.MUTED,
    }}>
      {(c.title || c.subtitle) && (
        <div style={{ marginBottom: px(u, 12) }}>
          {c.title && <h2 style={{ margin: 0, color: u.TEXT, fontSize: px(u, 22), fontWeight: 800, fontFamily: u.FONT_D }}>{c.title}</h2>}
          {c.subtitle && <p style={{ margin: `${px(u, 4)}px 0 0`, color: u.MUTED, fontSize: px(u, 13), fontFamily: u.FONT_B }}>{c.subtitle}</p>}
        </div>
      )}

      {/* Barre collante : recherche + pastilles. Reste sous le pouce pendant le défilement. */}
      {/* Collante sur la page, JAMAIS dans une miniature de la galerie (`mini_…`) :
          une barre sticky dans un cadre réduit par `transform` accroche le
          défilement sur Safari (retour du 19 nov. : « bugs au scroll » sur la
          galerie complète, seuls les modèles fast-food portent ce bloc). */}
      <div style={{ position: publicMode && !blockId.startsWith("mini_") ? "sticky" : "relative", top: 0, zIndex: 5, background: (u.theme as any)?.bg || u.SURFACE, paddingBottom: px(u, 8), marginInline: -px(u, 16), paddingInline: px(u, 16) }}>
        {/* Hors de la page publiée (éditeur, miniature de modèle), la barre est
            DESSINÉE, pas branchée : aucun champ ni bouton qu'on ne pourrait pas
            utiliser — la règle de tous les blocs (relevé du 19 nov. : les
            miniatures de /creer exposaient des pastilles de 10 px). */}
        {offertes.length > 0 && !page && (
          <div role="group" aria-label={L.langue} style={{ display: "flex", gap: px(u, 6), overflowX: "auto", scrollbarWidth: "none", marginBottom: px(u, 8) }}>
            {(["fr", ...offertes] as CodeLangue[]).map(l => publicMode
              ? <button key={l} type="button" lang={l} aria-pressed={lang === l} className={lang === l ? "carte-pastille carte-pastille--on" : "carte-pastille"}
                  onClick={() => choisirLangue(l)} title={LIBELLES[l].nom}>{LIBELLES[l].nom}</button>
              : <span key={l} className="carte-pastille">{LIBELLES[l].nom}</span>)}
          </div>
        )}
        {recherche && (publicMode
          ? <input type="search" inputMode="search" enterKeyHint="search" aria-label={L.rechercher} className="carte-recherche"
              placeholder={L.rechercher} value={requete} onChange={e => setRequete(e.target.value)} />
          : <div aria-hidden="true" className="carte-recherche" style={{ display: "flex", alignItems: "center", opacity: 0.7 }}>{L.rechercher}</div>
        )}
        {!enRecherche && categories.length > 1 && (
          <nav aria-label={L.rubriques} style={{ display: "flex", gap: px(u, 6), overflowX: "auto", scrollbarWidth: "none", paddingTop: px(u, 2) }}>
            {categories.map(cat => {
              const on = active === cat.nom
              const contenu = <>{cat.nom}<span className="carte-pastille__compte">{cat.compte}</span></>
              return publicMode
                ? <button key={cat.nom} type="button" className={on ? "carte-pastille carte-pastille--on" : "carte-pastille"}
                    aria-current={on ? "true" : undefined} onClick={() => aller(cat.nom)}>{contenu}</button>
                : <span key={cat.nom} className="carte-pastille">{contenu}</span>
            })}
          </nav>
        )}
      </div>

      {enRecherche ? (
        trouves.length > 0 ? (
          <div style={{ marginTop: px(u, 8) }}>
            <p role="status" style={{ margin: `0 0 ${px(u, 8)}px`, color: u.MUTED, fontSize: px(u, 13), fontFamily: u.FONT_B }}>{L.produits(trouves.length)}</p>
            {liste(trouves)}
          </div>
        ) : (
          <div role="status" style={{ textAlign: "center", padding: `${px(u, 24)}px 0`, color: u.MUTED, fontFamily: u.FONT_B }}>
            <p style={{ margin: 0, fontSize: px(u, 14) }}>{L.aucun(requete.trim())}</p>
            <button type="button" className="carte-bouton" onClick={() => setRequete("")}>{L.voirTout}</button>
          </div>
        )
      ) : (
        produitsParCategorie(produits).map(g => (
          <div key={g.categorie} id={ancreDeCategorie(blockId, g.categorie)} style={{ marginTop: px(u, 14), scrollMarginTop: 120 }}>
            {categories.length > 1 && (
              <h3 style={{ margin: `0 0 ${px(u, 8)}px`, color: u.TEXT, fontSize: px(u, 17), fontWeight: 800, fontFamily: u.FONT_D }}>
                {g.categorie} <span style={{ color: u.MUTED, fontWeight: 600, fontSize: px(u, 13) }}>· {g.produits.length}</span>
              </h3>
            )}
            {liste(g.produits)}
          </div>
        ))
      )}

      {String(c.allergen_note || "Oui") !== "Non" && (
        <p style={{ margin: `${px(u, 14)}px 0 0`, color: u.MUTED, fontSize: px(u, 12), fontFamily: u.FONT_B, textAlign: "center" }}>
          {L.mention}
        </p>
      )}

      {publicMode && <Fiche p={ouvert} u={u} refDialog={refDialog} onFermer={() => setOuvert(null)} L={L} />}
    </section>
  )
}

