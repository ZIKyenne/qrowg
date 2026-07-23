import type { Metadata } from "next"

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Une question sur QRowg ? Contactez notre équipe — nous répondons rapidement pour vous aider à créer votre page et votre QR code.",
  alternates: { canonical: `${APP}/contact` },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
