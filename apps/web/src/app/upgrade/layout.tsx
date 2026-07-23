import type { Metadata } from "next"

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"

export const metadata: Metadata = {
  title: "Tarifs & abonnements",
  description:
    "Comparez les plans QRowg — Free, Starter, Pro et Business. Essai gratuit de 7 jours, sans engagement, annulable à tout moment.",
  alternates: { canonical: `${APP}/upgrade` },
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
