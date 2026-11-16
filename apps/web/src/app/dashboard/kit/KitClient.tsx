"use client"

// La fiche comptoir A5 du kit de démarchage — sur fond BLANC : elle sort d'une
// imprimante de bureau, pas d'un imprimeur. Deux QR (lib/kitDemarchage) :
// l'exemple (votre page en direct, de préférence) et l'inscription (avec votre
// code de parrainage). Impression : une page A5, par la même feuille
// d'impression que l'atelier (cssDImpression : portail sous <body>, le reste
// retiré de la mise en page — mesuré sur le chevalet, v235).

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Printer } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { createQRSvg } from "@/app/dashboard/qr-codes/qrRender"
import { cssDImpression } from "@/app/dashboard/print-studio/formatImpression"
import { liensDuKit, type PageDeDemo } from "@/lib/kitDemarchage"
import { PLANS } from "@/lib/plans"
import { Select } from "@/components/ui/Input"
import { useIsMobile } from "@/lib/useIsMobile"

const A5 = { l: 148, h: 210 }
const OR = "#B08A2E", NOIR = "#111111", GRIS = "#555555"

function QR({ valeur, mm }: { valeur: string; mm: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const qr = createQRSvg({ data: valeur, fg: NOIR, bg: "#FFFFFF", ecc: "M", style: {}, size: 600 })
    if (ref.current) { ref.current.innerHTML = ""; qr.append(ref.current) }
  }, [valeur])
  return <div ref={ref} className="kit-qr" style={{ width: `${mm}mm`, height: `${mm}mm`, lineHeight: 0 }} />
}

function Fiche({ exemple, inscription }: { exemple: string; inscription: string }) {
  const p = (mm: number) => `${mm}mm`
  return (
    <div className="kit-fiche" style={{ width: p(A5.l), height: p(A5.h), overflow: "hidden", background: "#FFFFFF", color: NOIR, boxSizing: "border-box", padding: p(12), display: "flex", flexDirection: "column", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{".kit-qr svg{width:100%!important;height:100%!important}"}</style>
      <p style={{ margin: 0, fontSize: "11pt", fontWeight: 700, letterSpacing: "0.02em" }}>qrowg<span style={{ color: OR }}>.</span></p>
      <p style={{ margin: `${p(8)} 0 ${p(3)}`, fontSize: "9pt", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: OR }}>Bars & restaurants</p>
      <h1 style={{ margin: 0, fontSize: "22pt", lineHeight: 1.1, fontWeight: 700 }}>Votre carte, à jour depuis le comptoir.</h1>
      <p style={{ margin: `${p(4)} 0 0`, fontSize: "10.5pt", lineHeight: 1.45, color: GRIS }}>
        Un QR sur la table, votre carte sur le téléphone de vos clients. Un toucher, et c&apos;est en ligne — sans réimprimer.
      </p>
      <ul style={{ margin: `${p(6)} 0 0`, padding: 0, listStyle: "none", fontSize: "11pt", lineHeight: 1.7, fontWeight: 600 }}>
        <li><span style={{ color: OR }}>●</span> Épuisé, en un toucher</li>
        <li><span style={{ color: OR }}>●</span> Un prix changé, sans réimprimer</li>
        <li><span style={{ color: OR }}>●</span> Votre carte entière, collée en une fois</li>
      </ul>
      {/* La vraie capture de « Ma carte » : le geste montré, pas décrit. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/kit/epuise.png" alt="« Ma carte » : un cocktail indiqué épuisé" style={{ display: "block", width: p(52), margin: `${p(5)} auto ${p(5)}`, borderRadius: p(3) }} />
      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: p(8) }}>
        {[{ v: exemple, t: "Voir une carte", s: "Scannez : c'est une vraie carte" }, { v: inscription, t: "Créer ma carte", s: "Gratuit, sans carte bancaire" }].map(q => (
          <div key={q.t} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", border: `0.4mm solid ${OR}`, borderRadius: p(4), padding: p(4) }}>
            <QR valeur={q.v} mm={36} />
            <p style={{ margin: `${p(3)} 0 0`, fontSize: "12pt", fontWeight: 700 }}>{q.t}</p>
            <p style={{ margin: `${p(1)} 0 0`, fontSize: "8.5pt", color: GRIS }}>{q.s}</p>
          </div>
        ))}
      </div>
      <p style={{ margin: `${p(6)} 0 0`, fontSize: "8.5pt", color: GRIS, textAlign: "center" }}>
        {PLANS.free.label} pour une page et son QR · qrowg.com
      </p>
    </div>
  )
}

export default function KitClient({ refCode, demos, appUrl }: { refCode: string | null; demos: PageDeDemo[]; appUrl: string }) {
  const [demoId, setDemoId] = useState<string>(demos[0]?.id ?? "")
  const [impression, setImpression] = useState(false)
  // Aperçu réduit pour tenir sur un téléphone (paliers communs : lib/ruptures).
  const echelle = useIsMobile("md") ? 0.62 : 0.9
  const demo = demos.find(d => d.id === demoId) ?? null
  const { exemple, inscription } = liensDuKit(appUrl, refCode, demo)

  useEffect(() => {
    if (!impression) return
    const t = setTimeout(() => { try { window.print() } catch { /* aperçu seul */ } }, 300)
    const fin = () => setImpression(false)
    window.addEventListener("afterprint", fin)
    return () => { clearTimeout(t); window.removeEventListener("afterprint", fin) }
  }, [impression])

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 16px 120px" }}>
      <PageHeader kicker="Interne" title="Kit de démarchage"
        sub="La fiche A5 à laisser au comptoir : un QR vers une vraie carte, un QR pour créer la sienne avec votre code de parrainage." />

      <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "0 0 18px" }}>
        <Select label="Carte montrée en exemple" value={demoId} onChange={e => setDemoId(e.target.value)}>
          {demos.map(d => <option key={d.id} value={d.id}>{d.title || d.slug} (votre page, en direct)</option>)}
          <option value="">Carte d&apos;exemple de Qrowg</option>
        </Select>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          {demo
            ? <>Démonstration en direct : pendant que le gérant scanne, épuisez un produit dans « Ma carte » de <strong style={{ color: "var(--ink)" }}>{demo.title || demo.slug}</strong> — il le voit barré sur son téléphone.</>
            : "Aucune de vos pages en ligne n'a de carte : la fiche montre la carte d'exemple de Qrowg."}
          {" "}{refCode ? <>Les inscriptions par la fiche vous sont rattachées (code <strong style={{ color: "var(--ink)" }}>{refCode}</strong>) et comptées dans Pilotage.</> : "Votre compte n'a pas de code de parrainage : les inscriptions ne seront pas rattachées."}
        </p>
        <Button onClick={() => setImpression(true)} leftIcon={<Printer size={16} aria-hidden="true" />}>Imprimer ou enregistrer en PDF (A5)</Button>
      </div>

      {/* Aperçu à l'écran, réduit pour tenir sur un téléphone. */}
      <div aria-label="Aperçu de la fiche" role="img" style={{ display: "flex", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ transform: `scale(${echelle})`, transformOrigin: "top center", height: `calc(${A5.h}mm * ${echelle})`, boxShadow: "0 12px 40px rgba(0,0,0,.45)" }}>
          <Fiche exemple={exemple} inscription={inscription} />
        </div>
      </div>

      {impression && typeof document !== "undefined" && createPortal(
        <div className="ps-print-root" aria-hidden>
          <style>{cssDImpression(A5.l, A5.h)}</style>
          <Fiche exemple={exemple} inscription={inscription} />
        </div>, document.body)}
    </div>
  )
}
