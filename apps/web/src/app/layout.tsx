import type { Metadata, Viewport } from "next"
import "./globals.css"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qrfolio.app"
// Origine du stockage Supabase (avatars, galeries, produits) — preconnect pour eviter
// le handshake DNS/TLS au premier chargement d'image sur les pages publiques.
const SUPABASE_ORIGIN = (() => {
  try { return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "" } catch { return "" }
})()

export const viewport: Viewport = {
  themeColor: "#C9A84C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "QRfolio — Carte de visite numérique & QR code dynamique pro",
    template: "%s | QRfolio",
  },
  description:
    "Créez une page de présentation professionnelle, générez un QR code dynamique et suivez chaque scan. Idéal pour restaurants (menu numérique), indépendants, créateurs (portfolio, lien en bio) et commerces.",
  keywords: [
    "carte de visite numérique",
    "QR code professionnel",
    "QR code dynamique",
    "page de présentation professionnelle",
    "portfolio digital",
    "menu numérique restaurant",
    "lien en bio",
    "page mobile professionnelle",
    "générateur de QR code",
    "qrfolio",
  ],
  authors: [{ name: "QRfolio", url: APP_URL }],
  creator: "QRfolio",
  publisher: "QRfolio",
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: APP_URL,
    siteName: "QRfolio",
    title: "QRfolio — Carte de visite numérique & QR code dynamique pro",
    description:
      "Créez une page de présentation professionnelle, générez un QR code dynamique et suivez chaque scan. Idéal pour restaurants (menu numérique), indépendants, créateurs (portfolio, lien en bio) et commerces.",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "QRfolio — Page professionnelle avec QR code dynamique",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@qrfolio",
    creator: "@qrfolio",
    title: "QRfolio — Carte de visite numérique & QR code dynamique pro",
    description:
      "Page mobile pro + QR code dynamique + statistiques. En 5 minutes, sans rien coder.",
    images: [`${APP_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {SUPABASE_ORIGIN && <link rel="preconnect" href={SUPABASE_ORIGIN} />}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "QRfolio",
              url: APP_URL,
              description:
                "Créez une page mobile professionnelle, générez un QR code dynamique et suivez chaque scan.",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: [
                { "@type": "Offer", name: "Free",     price: "0",     priceCurrency: "EUR" },
                { "@type": "Offer", name: "Pro",      price: "9.90",  priceCurrency: "EUR" },
                { "@type": "Offer", name: "Business", price: "24.90", priceCurrency: "EUR" },
              ],
              featureList: [
                "QR code dynamique",
                "Page mobile professionnelle",
                "Analytics en temps reel",
                "Templates metiers",
                "Domaine personnalise",
              ],
              inLanguage: "fr-FR",
              screenshot: `${APP_URL}/og-image.png`,
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
