import type { MetadataRoute } from "next"

// Manifest PWA — permet l'installation ("Ajouter a l'ecran d'accueil") avec identite,
// icone et couleurs de marque. Next injecte automatiquement <link rel="manifest">.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QRfolio",
    short_name: "QRfolio",
    description: "Une page. Un QR. Tout vous.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    lang: "fr",
    dir: "ltr",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  }
}
