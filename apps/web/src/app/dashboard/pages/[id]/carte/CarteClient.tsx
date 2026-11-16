"use client"

// « Ma carte ce soir » — pensée pour le téléphone, derrière le comptoir.
//
// Un produit = une ligne entière à toucher (56 px), un interrupteur En vente /
// Épuisé. L'écran change tout de suite ; si le serveur refuse, la ligne revient
// et on le dit. Rien n'est effacé : un produit épuisé reste sur la carte,
// barré, et revient d'un toucher. « Tout remettre en vente » prépare
// l'ouverture du lendemain.
//
// Mode « Prix » : chaque ligne devient un champ, pavé numérique, enregistré à
// la validation ou en quittant le champ — plusieurs prix d'affilée, sans
// l'éditeur. « 11 » prend la forme des prix voisins (« 11€ »).
//
// « + Ajouter un produit » au bas de chaque rubrique : le formulaire reste
// ouvert après un ajout, pour remplir une rubrique d'affilée (« Mocktail »).
//
// Mode « Modifier » : corriger le nom ou la description d'un produit, ou le
// retirer — retrait immédiat, « Annuler » pendant 7 s (le produit revient à sa
// place exacte, dans son état). Plus de raison d'ouvrir l'éditeur pour la carte.

import { useMemo, useRef, useState } from "react"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button, ButtonLink } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/Toast"
import { useConfirm } from "@/components/ui/Confirm"
import { propsInterrupteur } from "@/components/ui/interrupteur"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { LIEN_MES_PAGES } from "@/lib/actionsDePage"
import { phraseEpuises, cleDuPlat, type RubriqueDeLaCarte } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { formaterCommeAvant, refusDuPrix, PHRASES_REFUS } from "@/app/dashboard/builder/shared-renderer/models/prixDeLaCarte"
import { identiteDuPlat } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { limite } from "@/lib/limitesDeSaisie"
import { useIsMobile } from "@/lib/useIsMobile"
import type { Retire } from "@/app/dashboard/builder/shared-renderer/models/editionDeProduit"
import { basculerEpuise, toutRemettreEnVente, changerPrix, ajouterProduit, modifierUnProduit, retirerUnProduit, remettreUnProduit } from "./actions"

type PageDeLaCarte = { id: string; title: string | null; slug: string; status: string | null }
type Actions = {
  basculer: (blocId: string, nom: string, epuise: boolean) => Promise<{ ok: boolean; phrase?: string }>
  toutRemettre: (pageId: string) => Promise<{ ok: boolean; phrase?: string }>
  prix: (blocId: string, identite: string, prix: string) => Promise<{ ok: boolean; phrase?: string }>
  ajouter: (blocId: string, section: number | null, nom: string, prix: string, desc: string) => Promise<{ ok: true; produit: { nom: string; prix: string; desc: string } } | { ok: false; phrase: string }>
  modifier: (blocId: string, section: number | null, identite: string, nom: string, desc: string) => Promise<{ ok: true; produit: { nom: string; desc: string } } | { ok: false; phrase: string }>
  retirer: (blocId: string, section: number | null, identite: string) => Promise<{ ok: true; retire: Retire } | { ok: false; phrase: string }>
  remettre: (blocId: string, section: number | null, retire: Retire) => Promise<{ ok: true } | { ok: false; phrase: string }>
}
const SERVEUR: Actions = {
  basculer: basculerEpuise, toutRemettre: toutRemettreEnVente, prix: changerPrix, ajouter: ajouterProduit,
  modifier: modifierUnProduit, retirer: retirerUnProduit, remettre: remettreUnProduit,
}
type Mode = "dispo" | "prix" | "modifier"
const MUTED = "var(--muted)"
// Au-delà, la liste se parcourt mal au pouce : on propose de chercher.
const SEUIL_RECHERCHE = 12

export default function CarteClient({ page, rubriques: depart, actions = SERVEUR, erreur }: { page: PageDeLaCarte; rubriques: RubriqueDeLaCarte[]; actions?: Actions; erreur?: string }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [rubriques, setRubriques] = useState(depart)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [recherche, setRecherche] = useState("")
  const [annonce, setAnnonce] = useState("")
  const [mode, setMode] = useState<Mode>("dispo")
  const estMobile = useIsMobile(620)

  const total = rubriques.reduce((n, r) => n + r.plats.length, 0)
  const resume = phraseEpuises(rubriques)
  const q = cleDuPlat(recherche)
  const visibles = useMemo(() => q ? rubriques.map(r => ({ ...r, plats: r.plats.filter(p => cleDuPlat(p.identite).includes(q)) })).filter(r => r.plats.length) : rubriques, [rubriques, q])
  const enLigne = page.status === "published"

  // Un même produit (nom + description) peut figurer dans deux rubriques d'un
  // même bloc : l'état est rangé par identité et par bloc, on met donc à jour
  // toutes ses lignes.
  const poser = (blocId: string, identite: string, epuise: boolean) => setRubriques(rs => rs.map(r => r.blocId !== blocId ? r : {
    ...r, plats: r.plats.map(p => cleDuPlat(p.identite) === cleDuPlat(identite) ? { ...p, epuise } : p),
  }))

  async function basculer(blocId: string, nom: string, identite: string, epuise: boolean) {
    const cle = `${blocId}/${cleDuPlat(identite)}`
    if (enCours === cle) return
    setEnCours(cle)
    poser(blocId, identite, epuise)
    const issue = await actions.basculer(blocId, identite, epuise).catch(() => ({ ok: false, phrase: undefined as string | undefined }))
    setEnCours(null)
    if (!issue.ok) {
      poser(blocId, identite, !epuise)
      toast.error(("phrase" in issue && issue.phrase) || "La carte n'a pas pu être mise à jour. Réessayez.")
      return
    }
    setAnnonce(epuise ? `${nom} : épuisé` : `${nom} : de nouveau en vente`)
  }

  // Un prix : écrit tout de suite à l'écran, rétabli si le serveur refuse.
  const poserPrix = (blocId: string, identite: string, prix: string) => setRubriques(rs => rs.map(r => r.blocId !== blocId ? r : {
    ...r, plats: r.plats.map(p => cleDuPlat(p.identite) === cleDuPlat(identite) ? { ...p, prix } : p),
  }))
  async function enregistrerPrix(blocId: string, nom: string, identite: string, ancien: string, saisi: string): Promise<boolean> {
    const prix = formaterCommeAvant(ancien, saisi)
    if (prix === ancien.trim()) return true
    const refus = refusDuPrix(prix)
    if (refus) { toast.error(PHRASES_REFUS[refus]); return false }
    poserPrix(blocId, identite, prix)
    const issue = await actions.prix(blocId, identite, prix).catch(() => ({ ok: false, phrase: undefined as string | undefined }))
    if (!issue.ok) {
      poserPrix(blocId, identite, ancien)
      toast.error(("phrase" in issue && issue.phrase) || "Le prix n'a pas pu être enregistré. Réessayez.")
      return false
    }
    setAnnonce(`${nom} : ${prix || "sans prix"}`)
    return true
  }

  /** Ajoute en fin de rubrique ; rend la phrase d'erreur, ou null si c'est fait. */
  async function ajouter(r: RubriqueDeLaCarte, saisie: { nom: string; prix: string; desc: string }): Promise<string | null> {
    // La forme des prix voisins ; dans un onglet encore vide, celle du reste de la carte.
    const voisin = r.plats.find(p => p.prix)?.prix ?? rubriques.flatMap(x => x.plats).find(p => p.prix)?.prix ?? ""
    const prix = formaterCommeAvant(voisin, saisie.prix)
    const issue = await actions.ajouter(r.blocId, r.section, saisie.nom, prix, saisie.desc)
      .catch(() => ({ ok: false as const, phrase: "Le produit n'a pas pu être ajouté. Réessayez." }))
    if (!issue.ok) return issue.phrase
    const { nom, prix: p, desc } = issue.produit
    setRubriques(rs => rs.map(x => x.blocId === r.blocId && x.section === r.section
      ? { ...x, plats: [...x.plats, { nom, prix: p, desc, identite: identiteDuPlat(nom, desc), epuise: false }] } : x))
    setAnnonce(`${nom} ajouté à ${r.titre}`)
    return null
  }

  /** Corrige nom / description ; rend la phrase d'erreur, ou null. */
  async function corriger(r: RubriqueDeLaCarte, p: RubriqueDeLaCarte["plats"][number], saisie: { nom: string; desc: string }): Promise<string | null> {
    const issue = await actions.modifier(r.blocId, r.section, p.identite, saisie.nom, saisie.desc)
      .catch(() => ({ ok: false as const, phrase: "Le produit n'a pas pu être corrigé. Réessayez." }))
    if (!issue.ok) return issue.phrase
    const { nom, desc } = issue.produit
    const ancienne = cleDuPlat(p.identite)
    setRubriques(rs => rs.map(x => x.blocId !== r.blocId || x.section !== r.section ? x : {
      ...x, plats: x.plats.map(q => cleDuPlat(q.identite) === ancienne ? { ...q, nom, desc, identite: identiteDuPlat(nom, desc) } : q),
    }))
    setAnnonce(`${nom} corrigé`)
    return null
  }

  /** Retrait immédiat, « Annuler » pendant 7 s. */
  async function retirer(r: RubriqueDeLaCarte, p: RubriqueDeLaCarte["plats"][number]) {
    const issue = await actions.retirer(r.blocId, r.section, p.identite)
      .catch(() => ({ ok: false as const, phrase: "Le produit n'a pas pu être retiré. Réessayez." }))
    if (!issue.ok) { toast.error(issue.phrase); return }
    const { retire } = issue
    const memeRubrique = (x: RubriqueDeLaCarte) => x.blocId === r.blocId && x.section === r.section
    setRubriques(rs => rs.map(x => !memeRubrique(x) ? x : { ...x, plats: x.plats.filter((_, k) => k !== x.plats.findIndex(q => cleDuPlat(q.identite) === cleDuPlat(p.identite))) }))
    setAnnonce(`${p.nom} retiré de la carte`)
    toast.success(`« ${p.nom} » retiré de la carte`, { action: { label: "Annuler", onClick: async () => {
      const back = await actions.remettre(r.blocId, r.section, retire).catch(() => ({ ok: false as const, phrase: "Le produit n'a pas pu revenir." }))
      if (!back.ok) { toast.error(back.phrase); return }
      setRubriques(rs => rs.map(x => {
        if (!memeRubrique(x)) return x
        const plats = [...x.plats]
        plats.splice(Math.min(retire.index, plats.length), 0, p)
        return { ...x, plats }
      }))
      setAnnonce(`${p.nom} est revenu sur la carte`)
    } } })
  }

  async function toutRemettre() {
    const ok = await confirm({ title: "Tout remettre en vente ?", message: `${resume ?? "Aucun produit épuisé"} — ils redeviendront disponibles sur votre carte.`, confirmLabel: "Tout remettre en vente" })
    if (!ok) return
    const avant = rubriques
    setRubriques(rs => rs.map(r => ({ ...r, plats: r.plats.map(p => ({ ...p, epuise: false })) })))
    const issue = await actions.toutRemettre(page.id).catch(() => ({ ok: false, phrase: undefined as string | undefined }))
    if (!issue.ok) { setRubriques(avant); toast.error(("phrase" in issue && issue.phrase) || "La carte n'a pas pu être mise à jour. Réessayez."); return }
    toast.success("Toute la carte est de nouveau en vente")
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 130px" }}>
      <PageHeader back={{ href: LIEN_MES_PAGES, label: "Mes pages" }} kicker="Ma carte" title={page.title || page.slug}
        sub={mode === "dispo"
          ? "Touchez un produit pour l'indiquer épuisé. Vos clients le voient aussitôt, sans republier."
          : mode === "prix" ? "Touchez un prix pour le changer. Il est en ligne dès que vous validez."
          : "Corrigez un nom ou une description, ou retirez un produit de la carte."} />

      {!enLigne && total > 0 && (
        <p role="status" style={{ margin: "0 0 14px", padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)", color: MUTED, fontSize: 13, lineHeight: 1.5 }}>
          Cette page est en brouillon : vos réglages seront visibles dès sa publication.
        </p>
      )}

      {erreur ? (
        <p {...propsAnnonce("erreur")} style={{ margin: 0, padding: "14px 16px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--danger) 40%, transparent)", color: "var(--danger)", fontSize: 14, lineHeight: 1.5 }}>{erreur}</p>
      ) : rubriques.length === 0 ? (
        <section className="qd-carte" style={{ padding: "32px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--ink)", fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Cette page n&apos;a pas encore de carte</p>
          <p style={{ color: MUTED, fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>Collez le texte de votre carte (PDF, document, site) : Qrowg reconnaît sections, produits et prix.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <ButtonLink href={`/dashboard/pages/${page.id}/carte/coller`} size="sm">Coller ma carte</ButtonLink>
            <ButtonLink href={`/dashboard/builder/${page.id}`} size="sm" variant="ghost">Modifier la page</ButtonLink>
          </div>
        </section>
      ) : (
        <>
          {/* Deux gestes, deux modes : pas de bouton dans un bouton sur chaque ligne. */}
          <div role="group" aria-label="Ce que je modifie" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, padding: 4, margin: "0 0 12px", borderRadius: 12, background: "var(--surface-2)" }}>
            {([["dispo", "Disponibilité"], ["prix", "Prix"], ["modifier", "Modifier"]] as [Mode, string][]).map(([m, l]) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
                style={{ minHeight: 44, borderRadius: 9, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                  background: mode === m ? "var(--surface)" : "transparent", color: mode === m ? "var(--ink)" : MUTED,
                  boxShadow: mode === m ? "inset 0 -2px 0 var(--accent), 0 1px 3px rgba(0,0,0,.35)" : "none" }}>{l}</button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "0 0 12px" }}>
            <p style={{ flex: 1, minWidth: 160, margin: 0, fontSize: 14, color: resume ? "var(--ink)" : MUTED, fontWeight: resume ? 600 : 400 }}>
              {resume ?? `Tout est en vente · ${total} produit${total > 1 ? "s" : ""}`}
            </p>
            {resume && mode === "dispo" && <Button size="sm" variant="secondary" onClick={toutRemettre}>Tout remettre en vente</Button>}
            {enLigne && <ButtonLink href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" size="sm" variant="ghost">Voir ma page</ButtonLink>}
            <ButtonLink href={`/dashboard/pages/${page.id}/carte/coller`} size="sm" variant="ghost">Coller une carte</ButtonLink>
          </div>

          {total > SEUIL_RECHERCHE && (
            <div style={{ margin: "0 0 12px" }}>
              <Input type="search" inputMode="search" enterKeyHint="search" aria-label="Chercher un produit" placeholder="Chercher un produit"
                value={recherche} onChange={e => setRecherche(e.target.value)} rightSlot={<Search size={15} aria-hidden="true" style={{ color: MUTED }} />} />
            </div>
          )}

          {visibles.length === 0 && <p role="status" style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: "20px 0" }}>Aucun produit ne correspond.</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {visibles.map((r, k) => (
              <section key={`${r.blocId}-${k}`} className="qd-carte" aria-label={r.titre} style={{ overflow: "hidden" }}>
                <h2 style={{ margin: 0, padding: "12px 16px 8px", fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", color: MUTED, fontWeight: 700 }}>{r.titre}</h2>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {r.plats.map((p, i) => {
                    const cle = `${r.blocId}/${cleDuPlat(p.identite)}`
                    if (mode === "modifier") return (
                      <li key={`${p.nom}-${i}`} style={{ borderTop: "1px solid var(--line)" }}>
                        <LigneEdition plat={p} compact={estMobile} onCorriger={saisie => corriger(r, p, saisie)} onRetirer={() => retirer(r, p)} />
                      </li>
                    )
                    if (mode === "prix") return (
                      <li key={`${p.nom}-${i}`} style={{ borderTop: "1px solid var(--line)" }}>
                        <LignePrix plat={p} onEnregistrer={saisi => enregistrerPrix(r.blocId, p.nom, p.identite, p.prix, saisi)} />
                      </li>
                    )
                    return (
                      <li key={`${p.nom}-${i}`} style={{ borderTop: "1px solid var(--line)" }}>
                        <button {...propsInterrupteur(`${p.desc ? `${p.nom}, ${p.desc}` : p.nom} en vente`, !p.epuise)} onClick={() => basculer(r.blocId, p.nom, p.identite, !p.epuise)} disabled={enCours === cle}
                          style={{ width: "100%", minHeight: 56, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", color: "var(--ink)", fontFamily: "inherit" }}>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 15, fontWeight: 600, overflowWrap: "anywhere", textDecoration: p.epuise ? "line-through" : "none", opacity: p.epuise ? 0.55 : 1 }}>{p.nom}</span>
                            {/* La description distingue les homonymes (« Brut 75CL », « Magnum ») : une ligne, coupée proprement. */}
                            {(p.prix || p.desc) && <span style={{ display: "block", fontSize: 13, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[p.prix, p.desc].filter(Boolean).join(" · ")}</span>}
                          </span>
                          <span aria-hidden="true" style={{ flexShrink: 0, minWidth: 84, textAlign: "center", padding: "6px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700,
                            border: `1px solid ${p.epuise ? "var(--line-strong)" : "color-mix(in srgb, var(--success) 45%, transparent)"}`,
                            color: p.epuise ? MUTED : "var(--success)", background: p.epuise ? "var(--surface-2)" : "color-mix(in srgb, var(--success) 10%, transparent)" }}>
                            {p.epuise ? "Épuisé" : "En vente"}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {r.plats.length === 0 && <p style={{ margin: 0, padding: "4px 16px 10px", color: MUTED, fontSize: 13 }}>Aucun produit pour l&apos;instant.</p>}
                {!q && <AjoutDeProduit titre={r.titre} onAjouter={saisie => ajouter(r, saisie)} />}
              </section>
            ))}
          </div>
        </>
      )}
      <p {...propsAnnonce("info")} className="sr-only">{annonce}</p>
    </div>
  )
}

/**
 * Une ligne du mode Prix. Le brouillon reste local jusqu'à la validation :
 * Entrée ou sortie du champ enregistrent, Échap rétablit.
 */
function LignePrix({ plat, onEnregistrer }: { plat: RubriqueDeLaCarte["plats"][number]; onEnregistrer: (saisi: string) => Promise<boolean> }) {
  const [brouillon, setBrouillon] = useState(plat.prix)
  const [etat, setEtat] = useState<"repos" | "envoi" | "fait">("repos")
  // Le prix confirmé (ou rétabli) par l'écran parent fait foi hors saisie.
  const [vu, setVu] = useState(plat.prix)
  if (vu !== plat.prix) { setVu(plat.prix); setBrouillon(plat.prix) }

  async function valider() {
    if (etat === "envoi" || brouillon.trim() === plat.prix.trim()) return
    setEtat("envoi")
    const ok = await onEnregistrer(brouillon)
    if (!ok) { setBrouillon(plat.prix); setEtat("repos"); return }
    setEtat("fait"); setTimeout(() => setEtat(e => (e === "fait" ? "repos" : e)), 1600)
  }
  const nom = plat.desc ? `${plat.nom}, ${plat.desc}` : plat.nom
  return (
    <div style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 12, padding: "8px 16px" }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "var(--ink)", overflowWrap: "anywhere" }}>{plat.nom}</span>
        {plat.desc && <span style={{ display: "block", fontSize: 13, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{plat.desc}</span>}
      </span>
      <span style={{ width: 112, flexShrink: 0 }}>
        <Input value={brouillon} onChange={e => setBrouillon(e.target.value)} aria-label={`Prix de ${nom}`} placeholder="Prix"
          inputMode="decimal" enterKeyHint="done" autoComplete="off" disabled={etat === "envoi"}
          onBlur={valider} onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setBrouillon(plat.prix) }}
          style={{ textAlign: "right", fontWeight: 700 }}
          rightSlot={etat === "fait" ? <span aria-hidden="true" style={{ color: "var(--success)", fontWeight: 700 }}>✓</span> : undefined} />
      </span>
    </div>
  )
}

/**
 * « + Ajouter un produit » : nom, prix (pavé numérique), description facultative.
 * Après un ajout, le formulaire se vide et reste ouvert, curseur sur le nom.
 */
function AjoutDeProduit({ titre, onAjouter }: { titre: string; onAjouter: (s: { nom: string; prix: string; desc: string }) => Promise<string | null> }) {
  const [ouvert, setOuvert] = useState(false)
  const [nom, setNom] = useState("")
  const [prix, setPrix] = useState("")
  const [desc, setDesc] = useState("")
  const [envoi, setEnvoi] = useState(false)
  const [refus, setRefus] = useState("")
  const [dernier, setDernier] = useState("")
  const refNom = useRef<HTMLInputElement>(null)

  if (!ouvert) return (
    <div style={{ padding: "6px 12px 12px", borderTop: "1px solid var(--line)" }}>
      <Button variant="ghost" size="sm" onClick={() => { setOuvert(true); setTimeout(() => refNom.current?.focus(), 0) }}
        aria-label={`Ajouter un produit à ${titre}`} leftIcon={<Plus size={15} aria-hidden="true" />}>Ajouter un produit</Button>
    </div>
  )

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    if (envoi) return
    setEnvoi(true); setRefus("")
    const phrase = await onAjouter({ nom, prix, desc })
    setEnvoi(false)
    if (phrase) { setRefus(phrase); return }
    setDernier(nom.trim()); setNom(""); setPrix(""); setDesc("")
    refNom.current?.focus()
  }

  return (
    <form onSubmit={valider} aria-label={`Nouveau produit — ${titre}`}
      style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px 14px", borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
      <Input ref={refNom} label="Nom du produit" value={nom} onChange={e => setNom(e.target.value)} placeholder="Virgin Mojito" autoComplete="off" enterKeyHint="next" maxLength={limite("nomDeProduit")} />
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
        <Input label="Prix" value={prix} onChange={e => setPrix(e.target.value)} placeholder="7€" inputMode="decimal" autoComplete="off" enterKeyHint="next" maxLength={limite("prixDeProduit")} />
        <Input label="Description (facultatif)" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Menthe, citron vert…" autoComplete="off" enterKeyHint="done" maxLength={limite("descriptionDeProduit")} />
      </div>
      {refus && <p {...propsAnnonce("erreur")} style={{ margin: 0, color: "var(--danger)", fontSize: 13 }}>{refus}</p>}
      {!refus && dernier && <p {...propsAnnonce("info")} style={{ margin: 0, color: "var(--success)", fontSize: 13 }}>« {dernier} » est sur la carte. Vous pouvez en ajouter un autre.</p>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setOuvert(false); setRefus(""); setDernier("") }}>Terminé</Button>
        <Button type="submit" size="sm" loading={envoi} disabled={!nom.trim()}>Ajouter</Button>
      </div>
    </form>
  )
}

/**
 * Une ligne du mode Modifier : « Corriger » ouvre nom et description sur place,
 * « Retirer » retire tout de suite (avec « Annuler »).
 */
function LigneEdition({ plat, onCorriger, onRetirer, compact = false }: {
  plat: RubriqueDeLaCarte["plats"][number]
  onCorriger: (s: { nom: string; desc: string }) => Promise<string | null>
  onRetirer: () => void
  /** Téléphone : icônes seules (nom accessible complet), pour laisser la place au nom du produit. */
  compact?: boolean
}) {
  const [ouvert, setOuvert] = useState(false)
  const [nom, setNom] = useState(plat.nom)
  const [desc, setDesc] = useState(plat.desc)
  const [envoi, setEnvoi] = useState(false)
  const [refus, setRefus] = useState("")
  const libelle = plat.desc ? `${plat.nom}, ${plat.desc}` : plat.nom

  if (!ouvert) return (
    <div style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px 8px 16px" }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: "var(--ink)", overflowWrap: "anywhere" }}>{plat.nom}</span>
        {(plat.prix || plat.desc) && <span style={{ display: "block", fontSize: 13, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[plat.prix, plat.desc].filter(Boolean).join(" · ")}</span>}
      </span>
      <Button size="sm" variant="ghost" onClick={() => { setNom(plat.nom); setDesc(plat.desc); setRefus(""); setOuvert(true) }}
        aria-label={`Corriger ${libelle}`} leftIcon={<Pencil size={compact ? 17 : 14} aria-hidden="true" />}>{!compact && "Corriger"}</Button>
      <Button size="sm" variant="ghost" onClick={onRetirer} aria-label={`Retirer ${libelle} de la carte`}
        leftIcon={<Trash2 size={compact ? 17 : 14} aria-hidden="true" />}>{!compact && "Retirer"}</Button>
    </div>
  )

  async function valider(e: React.FormEvent) {
    e.preventDefault()
    if (envoi) return
    setEnvoi(true); setRefus("")
    const phrase = await onCorriger({ nom, desc })
    setEnvoi(false)
    if (phrase) { setRefus(phrase); return }
    setOuvert(false)
  }
  return (
    <form onSubmit={valider} aria-label={`Corriger ${libelle}`} style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 16px 14px", background: "var(--surface-2)" }}>
      <Input label="Nom du produit" value={nom} onChange={e => setNom(e.target.value)} autoComplete="off" autoFocus maxLength={limite("nomDeProduit")} />
      <Input label="Description (facultatif)" value={desc} onChange={e => setDesc(e.target.value)} autoComplete="off" maxLength={limite("descriptionDeProduit")} />
      {refus && <p {...propsAnnonce("erreur")} style={{ margin: 0, color: "var(--danger)", fontSize: 13 }}>{refus}</p>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert(false)}>Annuler</Button>
        <Button type="submit" size="sm" loading={envoi} disabled={!nom.trim()}>Enregistrer</Button>
      </div>
    </form>
  )
}
