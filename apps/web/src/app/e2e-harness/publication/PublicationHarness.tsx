"use client"
import PublishedScreen from "@/app/dashboard/builder/PublishedScreen"

export function PublicationHarness({ metier, mobile }: { metier?: string; mobile?: boolean }) {
  return (
    <PublishedScreen
      pageUrl="https://qrowg.com/carte-restaurant-demo"
      qrTarget="https://qrowg.com/q/demo1"
      metier={metier || "Restaurant"}
      supports={[
        { id: "chevalet-a5", label: "Chevalet de table A5", why: "Sur chaque table, à hauteur des yeux" },
        { id: "sticker-rond", label: "Sticker rond 50 mm", why: "À coller sur la vitrine ou le comptoir" },
        { id: "carte-visite", label: "Carte de visite", why: "À glisser avec l'addition" },
      ]}
      printUrl={(id) => `/dashboard/print-studio?item=${id}`}
      onDownloadQr={() => {}}
      onClose={() => {}}
      mobile={mobile}
    />
  )
}
