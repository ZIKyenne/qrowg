import type { Metadata, Viewport } from "next"
import "./globals.css"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qrfolio.app"

export const viewport: Viewport = {
  themeColor: "#C9A84C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "QRfolio — Cree ta page professionnelle avec QR code dynamique",
    template: "%s | QRfolio",
  },
  description:
    "Cree une page mobile professionnelle, genere un QR code dynamique et analyse chaque scan. Ideal pour restaurants, freelances, createurs et commerces.",
  keywords: [
    "QR code dynamique",
    "landing page professionnelle",
    "page mobile",
    "bio link",
    "carte de visite numerique",
    "qrfolio",
    "generateur QR code",
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
    title: "QRfolio — Cree ta page professionnelle avec QR code dynamique",
    description:
      "Cree une page mobile professionnelle, genere un QR code dynamique et analyse chaque scan. Ideal pour restaurants, freelances, createurs et commerces.",
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
    title: "QRfolio — Cree ta page professionnelle avec QR code dynamique",
    description:
      "Page mobile pro + QR code dynamique + analytics. En 5 minutes, sans coder.",
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
                "Cree une page mobile professionnelle, genere un QR code dynamique et analyse chaque scan.",
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
