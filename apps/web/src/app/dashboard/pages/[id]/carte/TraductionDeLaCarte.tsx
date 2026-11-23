"use client"

// « Traduire ma carte », dans Ma carte (vague 2, revue du 23 nov.).
//
// Sans service tiers ni coût, comme la carte illustrée : on choisit une langue,
// on copie UNE demande qui couvre toute la carte de la page (menus, boissons,
// happy hour, carte illustrée), on la colle dans ChatGPT ou DeepL, et on colle la
// réponse ici. L'écran dit, avant d'enregistrer, combien d'éléments sont traduits.
// Les clients choisissent ensuite leur langue une fois, en haut de la carte.

import { useMemo, useState } from "react"
import { Copy, Check, Languages } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Input"
import { useToast } from "@/components/Toast"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { LANGUES_PROPOSEES, NOM_FR, type CodeLangue } from "@/app/dashboard/builder/shared-renderer/models/traductionCarte"
import { demandeDeLaPage, couvertureDeLaPage, type ATraduire } from "@/app/dashboard/builder/shared-renderer/models/traductionDesCartes"

export type EtatDesLangues = { langue: CodeLangue; traduits: number; total: number }[]
type Enregistrer = (langue: CodeLangue, texte: string) => Promise<{ ok: true; traduits: number; total: number } | { ok: false; phrase: string }>

const MUTED = "var(--muted)"

export function TraductionDeLaCarte({ aTraduire, langues: depart, enregistrer }: { aTraduire: ATraduire; langues: EtatDesLangues; enregistrer: Enregistrer }) {
  const toast = useToast()
  const [langues, setLangues] = useState(depart)
  const [ouvert, setOuvert] = useState(false)
  const [langue, setLangue] = useState<CodeLangue>(depart[0]?.langue ?? "en")
  const [texte, setTexte] = useState("")
  const [copiee, setCopiee] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [refus, setRefus] = useState("")
  const total = aTraduire.produits.length + aTraduire.rubriques.length
  const lue = useMemo(() => (texte.trim() ? couvertureDeLaPage(aTraduire, texte) : null), [aTraduire, texte])
  const existante = langues.find(x => x.langue === langue)

  if (total === 0) return null
  const resume = langues.length
    ? langues.map(x => `${NOM_FR[x.langue]} (${x.traduits}/${x.total})`).join(", ")
    : "Pour les touristes : votre carte dans leur langue, en deux minutes."

  async function copier() {
    try { await navigator.clipboard.writeText(demandeDeLaPage(aTraduire, langue)); setCopiee(true); setTimeout(() => setCopiee(false), 2000) }
    catch { toast.error("La copie a été refusée par le navigateur. Sélectionnez le texte à la main.") }
  }
  async function valider(vide = false) {
    if (envoi) return
    setEnvoi(true); setRefus("")
    const issue = await enregistrer(langue, vide ? "" : texte).catch(() => ({ ok: false as const, phrase: "La traduction n'a pas pu être enregistrée. Réessayez." }))
    setEnvoi(false)
    if (!issue.ok) { setRefus(issue.phrase); return }
    setLangues(ls => {
      const autres = ls.filter(x => x.langue !== langue)
      const suite = vide ? autres : [...autres, { langue, traduits: issue.traduits, total: issue.total }]
      return LANGUES_PROPOSEES.flatMap(l => suite.filter(x => x.langue === l))
    })
    setTexte("")
    toast.success(vide ? `${NOM_FR[langue]} retiré de votre carte` : `Carte en ${NOM_FR[langue].toLowerCase()} : ${issue.traduits} sur ${issue.total} traduits`)
  }

  return (
    <section className="qd-carte" aria-labelledby="traduction-titre" style={{ margin: "0 0 16px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <h2 id="traduction-titre" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
            <Languages size={16} aria-hidden="true" /> Traduire ma carte
          </h2>
          <p role="status" style={{ margin: "3px 0 0", fontSize: 13, lineHeight: 1.45, color: langues.length ? "var(--ink)" : MUTED, fontWeight: langues.length ? 600 : 400 }}>{resume}</p>
        </div>
        {!ouvert && <div><Button size="sm" variant="secondary" onClick={() => { setRefus(""); setOuvert(true) }}>{langues.length ? "Ajouter ou mettre à jour une langue" : "Traduire"}</Button></div>}
      </div>
      {ouvert && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px 14px", borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
          <div role="group" aria-label="Langue" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LANGUES_PROPOSEES.map(l => (
              <button key={l} type="button" aria-pressed={langue === l} onClick={() => { setLangue(l); setTexte(""); setRefus("") }}
                style={{ minHeight: 44, padding: "8px 12px", borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                  border: `1px solid ${langue === l ? "var(--accent)" : "var(--line-strong)"}`, background: langue === l ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent",
                  color: langue === l ? "var(--ink)" : MUTED }}>{NOM_FR[l]}</button>
            ))}
          </div>
          <ol style={{ margin: 0, paddingInlineStart: 20, display: "flex", flexDirection: "column", gap: 10, color: "var(--ink)", fontSize: 14, lineHeight: 1.5 }}>
            <li>
              Copiez la demande ({total} éléments), puis collez-la dans ChatGPT ou DeepL.
              <div style={{ marginTop: 6 }}>
                <Button size="sm" variant="secondary" onClick={copier} leftIcon={copiee ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}>
                  {copiee ? "Demande copiée" : `Copier la demande en ${NOM_FR[langue].toLowerCase()}`}
                </Button>
              </div>
            </li>
            <li>
              <Textarea label="Collez la réponse ici" value={texte} onChange={e => setTexte(e.target.value)} rows={6} spellCheck={false}
                placeholder={"Soupe à l'oignon ; Onion soup ; Topped with Comté\n# Entrées ; Starters"} />
            </li>
          </ol>
          {lue && <p {...propsAnnonce("info")} style={{ margin: 0, fontSize: 13, color: lue.traduits ? "var(--success)" : "var(--warning)" }}>
            {lue.traduits ? `${lue.traduits} sur ${lue.total} éléments traduits.` : "Aucune ligne reconnue : le texte en français doit rester au début de chaque ligne."}
            {lue.traduits > 0 && lue.manquants.length > 0 && <span style={{ color: MUTED }}> Sans traduction : {lue.manquants.slice(0, 4).join(", ")}{lue.manquants.length > 4 ? "…" : ""} (resteront en français).</span>}
          </p>}
          {refus && <p {...propsAnnonce("erreur")} style={{ margin: 0, color: "var(--danger)", fontSize: 13 }}>{refus}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {existante && <Button type="button" variant="ghost" size="sm" loading={envoi && !texte} onClick={() => valider(true)}>Retirer {NOM_FR[langue].toLowerCase()}</Button>}
            <Button type="button" variant="ghost" size="sm" onClick={() => { setOuvert(false); setTexte(""); setRefus("") }}>Fermer</Button>
            <Button type="button" size="sm" loading={envoi && !!texte} disabled={!lue?.traduits} onClick={() => valider()}>Enregistrer</Button>
          </div>
        </div>
      )}
    </section>
  )
}
