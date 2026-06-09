import type { Metadata } from "next"
import "./globals.css"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qrfolio.app"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "QRfolio — Ta page, ton QR code, tes stats",
    template: "%s | QRfolio",
  },
  description: "Cree ta landing page personnelle en 5 minutes, genere un QR code dynamique et suis tes stats en temps reel.",
  keywords: ["QR code", "landing page", "page personnelle", "bio link", "qrfolio"],
  authors: [{ name: "QRfolio" }],
  creator: "QRfolio",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: APP_URL,
    siteName: "QRfolio",
    title: "QRfolio — Ta page, ton QR code, tes stats",
    description: "Cree ta landing page personnelle en 5 minutes, genere un QR code dynamique et suis tes stats en temps reel.",
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630, alt: "QRfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QRfolio — Ta page, ton QR code, tes stats",
    description: "Cree ta landing page personnelle en 5 minutes, genere un QR code dynamique.",
    images: [`${APP_URL}/og-image.png`],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
