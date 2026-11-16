"use client"

// « Vous avez déjà une carte ? Collez-la. » — au moment de créer sa page.
//
// Un gérant de bar créait sa page avec les plats d'exemple du modèle, puis
// devait les remplacer un par un (ou découvrir « Ma carte → Coller une carte »
// plus tard). Ici, au choix du modèle, il colle le texte de sa carte : la page
// naît avec SES produits, à la place des exemples. Facultatif et replié : sans
// rien coller, la création est exactement celle d'avant.
//
// Lecture : lectureDeCarte (pure, sans IA) ; le remplacement des menus
// d'exemple : avecLaCarteCollee, appliqué par l'écran qui crée la page.

import { useEffect, useMemo, useState } from "react"
import { ClipboardPaste } from "lucide-react"
import { Textarea } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { typoFr } from "@/lib/typographieFr"
import { lireUneCarte, type SectionLue } from "@/app/dashboard/builder/shared-renderer/models/lectureDeCarte"

export default function CarteALaCreation({ exemples, onChange }: {
  /** Nombre de produits d'exemple du modèle (ce que la carte collée remplacera). */
  exemples: number
  /** Les sections lues, ou null quand rien n'est collé. */
  onChange: (sections: SectionLue[] | null) => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [texte, setTexte] = useState("")
  const lue = useMemo(() => lireUneCarte(texte), [texte])
  useEffect(() => { onChange(lue.produits ? lue.sections : null) }, [lue]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ouvert) return (
    <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert(true)} leftIcon={<ClipboardPaste size={15} aria-hidden="true" />}>
      Vous avez déjà une carte ? Collez-la
    </Button>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Textarea label="Votre carte (facultatif)" value={texte} onChange={e => setTexte(e.target.value)} rows={6} spellCheck={false}
        placeholder={"COCKTAILS\nMojito 10€\nRhum, menthe, citron vert\nSpritz 8€"}
        hint={typoFr("Copiez le texte de votre carte (PDF, document, site) : une ligne par produit, avec son prix.")} />
      {texte.trim() && (
        <p {...propsAnnonce("info")} style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: lue.produits ? "var(--success)" : "var(--muted)" }}>
          {lue.produits
            ? `${lue.sections.length} section${lue.sections.length > 1 ? "s" : ""} · ${lue.produits} produit${lue.produits > 1 ? "s" : ""}${exemples ? ` — ils remplaceront les ${exemples} produits d'exemple du modèle` : ""}.`
            : "Aucun produit reconnu pour l'instant : une ligne par produit, avec son prix."}
          {lue.aVerifier.length > 0 && <span style={{ color: "var(--warning, #FBBF24)" }}> {lue.aVerifier.length} ligne{lue.aVerifier.length > 1 ? "s" : ""} à revoir ensuite dans « Ma carte ».</span>}
        </p>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={() => { setTexte(""); setOuvert(false) }} style={{ alignSelf: "flex-start" }}>
        Garder les produits d&apos;exemple
      </Button>
    </div>
  )
}
