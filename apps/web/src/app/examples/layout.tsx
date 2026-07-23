import type { Metadata } from "next"

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"

export const metadata: Metadata = {
  title: "Exemples de pages",
  description:
    "Découvrez des exemples de pages QRowg par métier : restaurant, créateur, immobilier, indépendant, commerce… Inspirez-vous avant de créer la vôtre.",
  alternates: { canonical: `${APP}/examples` },
}

export default function ExamplesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
