// Une page d'exemple, rendue par le VRAI moteur public — le même composant que la
// page d'un client publiée. Le visiteur voit exactement ce que verra quelqu'un qui
// scanne son QR code, sur son téléphone.
//
// Rien n'est en base : le contenu vient de page-templates.ts, la source des modèles.
// La page n'est pas indexée — une fiche « Le Bistrot Parisien » dans Google
// laisserait croire à un établissement réel, ce qu'elle n'est pas.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PAGE_TEMPLATES } from "../../dashboard/builder/page-templates"
import { DemoModele } from "./DemoModele"

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"

export function generateStaticParams() {
  return PAGE_TEMPLATES.map(t => ({ modele: t.key }))
}

export async function generateMetadata({ params }: { params: Promise<{ modele: string }> }): Promise<Metadata> {
  const { modele } = await params
  const t = PAGE_TEMPLATES.find(x => x.key === modele)
  if (!t) return { title: "Exemple introuvable — QRowg", robots: { index: false, follow: false } }
  return {
    title: `Exemple : ${t.label} — QRowg`,
    description: `Aperçu du modèle « ${t.label} » (${t.group}) : ${t.desc}. Contenus de démonstration.`,
    alternates: { canonical: `${APP}/examples` },
    // Contenus de démonstration : on ne les laisse pas devenir des fiches d'entreprise.
    robots: { index: false, follow: true },
  }
}

export default async function ExempleModele({ params }: { params: Promise<{ modele: string }> }) {
  const { modele } = await params
  const tpl = PAGE_TEMPLATES.find(t => t.key === modele)
  if (!tpl) notFound()
  return <DemoModele modeleKey={tpl.key} />
}
