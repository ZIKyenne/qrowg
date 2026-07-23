import type { Metadata } from "next"

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"

export const metadata: Metadata = {
  title: "Fonctionnalités",
  description:
    "Toutes les fonctionnalités de QRowg : pages professionnelles personnalisables, QR codes dynamiques, QR Studio, statistiques en temps réel, modèles par métier et supports imprimables.",
  alternates: { canonical: `${APP}/features` },
}

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
