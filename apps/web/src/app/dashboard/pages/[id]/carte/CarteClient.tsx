"use client"

// « Ma carte ce soir » — pensée pour le téléphone, derrière le comptoir.
//
// Un produit = une ligne entière à toucher (56 px), un interrupteur En vente /
// Épuisé. L'écran change tout de suite ; si le serveur refuse, la ligne revient
// et on le dit. Rien n'est effacé : un produit épuisé reste sur la carte,
// barré, et revient d'un toucher. « Tout remettre en vente » prépare
// l'ouverture du lendemain.

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button, ButtonLink } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/Toast"
import { useConfirm } from "@/components/ui/Confirm"
import { propsInterrupteur } from "@/components/ui/interrupteur"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { LIEN_MES_PAGES } from "@/lib/actionsDePage"
import { phraseEpuises, cleDuPlat, type RubriqueDeLaCarte } from "@/app/dashboard/builder/shared-renderer/models/epuises"
import { basculerEpuise, toutRemettreEnVente } from "./actions"

type PageDeLaCarte = { id: string; title: string | null; slug: string; status: string | null }
type Actions = {
  basculer: (blocId: string, nom: string, epuise: boolean) => Promise<{ ok: boolean; phrase?: string }>
  toutRemettre: (pageId: string) => Promise<{ ok: boolean; phrase?: string }>
}
const SERVEUR: Actions = { basculer: basculerEpuise, toutRemettre: toutRemettreEnVente }
const MUTED = "var(--muted)"
// Au-delà, la liste se parcourt mal au pouce : on propose de chercher.
const SEUIL_RECHERCHE = 12

export default function CarteClient({ page, rubriques: depart, actions = SERVEUR }: { page: PageDeLaCarte; rubriques: RubriqueDeLaCarte[]; actions?: Actions }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [rubriques, setRubriques] = useState(depart)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [recherche, setRecherche] = useState("")
  const [annonce, setAnnonce] = useState("")

  const total = rubriques.reduce((n, r) => n + r.plats.length, 0)
  const resume = phraseEpuises(rubriques)
  const q = cleDuPlat(recherche)
  const visibles = useMemo(() => q ? rubriques.map(r => ({ ...r, plats: r.plats.filter(p => cleDuPlat(p.nom).includes(q)) })).filter(r => r.plats.length) : rubriques, [rubriques, q])
  const enLigne = page.status === "published"

  // Un même nom peut figurer dans deux rubriques d'un même bloc (onglets) :
  // l'état est rangé par nom et par bloc, on met donc à jour toutes ses lignes.
  const poser = (blocId: string, nom: string, epuise: boolean) => setRubriques(rs => rs.map(r => r.blocId !== blocId ? r : {
    ...r, plats: r.plats.map(p => cleDuPlat(p.nom) === cleDuPlat(nom) ? { ...p, epuise } : p),
  }))

  async function basculer(blocId: string, nom: string, epuise: boolean) {
    const cle = `${blocId}/${cleDuPlat(nom)}`
    if (enCours === cle) return
    setEnCours(cle)
    poser(blocId, nom, epuise)
    const issue = await actions.basculer(blocId, nom, epuise).catch(() => ({ ok: false, phrase: undefined as string | undefined }))
    setEnCours(null)
    if (!issue.ok) {
      poser(blocId, nom, !epuise)
      toast.error(("phrase" in issue && issue.phrase) || "La carte n'a pas pu être mise à jour. Réessayez.")
      return
    }
    setAnnonce(epuise ? `${nom} : épuisé` : `${nom} : de nouveau en vente`)
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
        sub="Touchez un produit pour l'indiquer épuisé. Vos clients le voient aussitôt, sans republier." />

      {!enLigne && total > 0 && (
        <p role="status" style={{ margin: "0 0 14px", padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)", color: MUTED, fontSize: 13, lineHeight: 1.5 }}>
          Cette page est en brouillon : vos réglages seront visibles dès sa publication.
        </p>
      )}

      {total === 0 ? (
        <section className="qd-carte" style={{ padding: "32px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--ink)", fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Cette page n&apos;a pas encore de carte</p>
          <p style={{ color: MUTED, fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>Ajoutez un bloc « Menu / Carte » dans l&apos;éditeur : vos produits apparaîtront ici.</p>
          <ButtonLink href={`/dashboard/builder/${page.id}`} size="sm">Modifier la page</ButtonLink>
        </section>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "0 0 12px" }}>
            <p style={{ flex: 1, minWidth: 160, margin: 0, fontSize: 14, color: resume ? "var(--ink)" : MUTED, fontWeight: resume ? 600 : 400 }}>
              {resume ?? `Tout est en vente · ${total} produit${total > 1 ? "s" : ""}`}
            </p>
            {resume && <Button size="sm" variant="secondary" onClick={toutRemettre}>Tout remettre en vente</Button>}
            {enLigne && <ButtonLink href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" size="sm" variant="ghost">Voir ma page</ButtonLink>}
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
                    const cle = `${r.blocId}/${cleDuPlat(p.nom)}`
                    return (
                      <li key={`${p.nom}-${i}`} style={{ borderTop: "1px solid var(--line)" }}>
                        <button {...propsInterrupteur(`${p.nom} en vente`, !p.epuise)} onClick={() => basculer(r.blocId, p.nom, !p.epuise)} disabled={enCours === cle}
                          style={{ width: "100%", minHeight: 56, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", color: "var(--ink)", fontFamily: "inherit" }}>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 15, fontWeight: 600, overflowWrap: "anywhere", textDecoration: p.epuise ? "line-through" : "none", opacity: p.epuise ? 0.55 : 1 }}>{p.nom}</span>
                            {p.prix && <span style={{ display: "block", fontSize: 13, color: MUTED, marginTop: 2 }}>{p.prix}</span>}
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
              </section>
            ))}
          </div>
        </>
      )}
      <p {...propsAnnonce("info")} className="sr-only">{annonce}</p>
    </div>
  )
}
