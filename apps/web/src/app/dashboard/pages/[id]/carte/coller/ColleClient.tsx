"use client"

// « Coller ma carte » — remplir une carte de 100 produits sans écrire une ligne
// au format « NOM;PRIX;Description ».
//
// Le texte est lu AU FIL DE LA SAISIE (lectureDeCarte, pur, sans IA) : dès le
// collage, l'aperçu montre les sections et leurs produits, ce qui n'a pas pu
// être lu et pourquoi. Les sections se renomment dans l'aperçu. Rien n'est écrit
// avant « Ajouter cette carte à ma page ».

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Input"
import { useToast } from "@/components/Toast"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { lireUneCarte, type SectionLue } from "@/app/dashboard/builder/shared-renderer/models/lectureDeCarte"
import { importerCarte } from "../actions"
import { limite } from "@/lib/limitesDeSaisie"
import { typoFr } from "@/lib/typographieFr"

const MUTED = "var(--muted)"
const EXEMPLE = `COCKTAILS
Mojito 10€
Rhum, menthe, citron vert
Spritz 8€

SOFTS
Coca-Cola 4€
Citronnade maison 4,50€`

type Importer = (pageId: string, titre: string, sections: SectionLue[]) => Promise<{ ok: boolean; phrase?: string }>

export default function ColleClient({ page, importer = importerCarte }: { page: { id: string; title: string | null; slug: string }; importer?: Importer }) {
  const router = useRouter()
  const toast = useToast()
  const [titre, setTitre] = useState("Notre carte")
  const [texte, setTexte] = useState("")
  const [renommees, setRenommees] = useState<Record<number, string>>({})
  const [envoi, setEnvoi] = useState(false)
  const [refus, setRefus] = useState("")

  const lue = useMemo(() => lireUneCarte(texte), [texte])
  const sections = lue.sections.map((s, k) => ({ ...s, titre: renommees[k] ?? s.titre }))
  const retour = `/dashboard/pages/${page.id}/carte`

  async function ajouter() {
    if (envoi || !lue.produits) return
    setEnvoi(true); setRefus("")
    const r = await importer(page.id, titre, sections).catch(() => ({ ok: false, phrase: undefined as string | undefined }))
    setEnvoi(false)
    if (!r.ok) { setRefus(("phrase" in r && r.phrase) || "La carte n'a pas pu être ajoutée. Réessayez."); return }
    toast.success(`${lue.produits} produit${lue.produits > 1 ? "s" : ""} ajouté${lue.produits > 1 ? "s" : ""} à votre page`)
    router.push(retour)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 140px" }}>
      <PageHeader back={{ href: retour, label: "Ma carte" }} kicker="Ma carte" title="Coller ma carte"
        sub="Copiez le texte de votre carte — un PDF, un document, votre site — et collez-le ici. Qrowg reconnaît les sections, les produits et les prix." />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="Nom de la carte" value={titre} onChange={e => setTitre(e.target.value)} autoComplete="off" maxLength={limite("titreDeCarte")} />
        <Textarea label="Votre carte" value={texte} onChange={e => { setTexte(e.target.value); setRenommees({}) }}
          placeholder={EXEMPLE} rows={10} spellCheck={false}
          hint={typoFr("Une ligne par produit, avec son prix. Les titres de section (« COCKTAILS », « Nos desserts : ») et les descriptions à la ligne sont reconnus.")} />
      </div>

      {texte.trim() && (
        <section aria-label="Aperçu de la carte" style={{ marginTop: 20 }}>
          <p {...propsAnnonce("info")} style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
            {lue.produits
              ? `${sections.length} section${sections.length > 1 ? "s" : ""} · ${lue.produits} produit${lue.produits > 1 ? "s" : ""}`
              : "Aucun produit reconnu pour l'instant : une ligne par produit, avec son prix."}
            {lue.aVerifier.length > 0 && <span style={{ color: "var(--warning, #FBBF24)", fontWeight: 500 }}> · {lue.aVerifier.length} ligne{lue.aVerifier.length > 1 ? "s" : ""} à vérifier</span>}
          </p>

          {lue.aVerifier.length > 0 && (
            <div role="note" style={{ margin: "0 0 14px", padding: "10px 14px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--warning, #FBBF24) 40%, transparent)" }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>À vérifier</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                {lue.aVerifier.slice(0, 12).map((a, i) => <li key={i}><span style={{ color: "var(--ink)" }}>« {a.ligne.slice(0, 80)} »</span> — {a.raison}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sections.map((s, k) => (
              <div key={k} className="qd-carte" style={{ padding: "12px 14px" }}>
                <Input aria-label={`Nom de la section ${k + 1}`} value={s.titre} onChange={e => setRenommees(r => ({ ...r, [k]: e.target.value }))} autoComplete="off" maxLength={limite("titreDeCarte")}
                  style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }} />
                <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
                  {s.produits.map((p, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "6px 2px", borderTop: i ? "1px solid var(--line)" : "none" }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink)", overflowWrap: "anywhere" }}>{p.nom}</span>
                        {p.desc && <span style={{ display: "block", fontSize: 13, color: MUTED, overflowWrap: "anywhere" }}>{p.desc}</span>}
                      </span>
                      <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 700, color: p.prix ? "var(--ink)" : "var(--warning, #FBBF24)" }}>{p.prix || "sans prix"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {refus && <p {...propsAnnonce("erreur")} style={{ margin: "14px 0 0", color: "var(--danger)", fontSize: 14 }}>{refus}</p>}

      {/* Barre d'action collée en bas : le bouton reste à portée de pouce pendant qu'on parcourt l'aperçu. */}
      <div style={{ position: "sticky", bottom: 84, marginTop: 20, padding: "12px 0", background: "linear-gradient(transparent, var(--bg) 30%)" }}>
        <Button fullWidth onClick={ajouter} loading={envoi} disabled={!lue.produits}>
          {lue.produits ? `Ajouter cette carte à ma page (${lue.produits} produit${lue.produits > 1 ? "s" : ""})` : "Ajouter cette carte à ma page"}
        </Button>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: MUTED, textAlign: "center" }}>Elle s&apos;ajoute à la fin de votre page, en grande carte à onglets. Rien n&apos;est remplacé.</p>
      </div>
    </div>
  )
}
