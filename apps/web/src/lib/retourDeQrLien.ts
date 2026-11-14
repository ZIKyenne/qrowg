// retourDeQrLien.ts — où mène « Retour » sur /dashboard/qr-link.
//
// Audit du 14 novembre 2026 (C) : depuis la liste des QR de pages, « Créer un
// QR » ouvrait /dashboard/qr-link, dont le retour menait TOUJOURS au tableau
// de bord. On revient désormais d'où l'on vient ; en accès direct, le lien
// nomme sa destination. Liste fermée : la valeur vient de l'URL. Module PUR.

export const ORIGINES = {
  "qr-codes": { href: "/dashboard/qr-codes", label: "Retour aux QR de pages" },
  "print-studio": { href: "/dashboard/print-studio", label: "Retour à l'atelier" },
} as const

export type Origine = keyof typeof ORIGINES

export function retourDeQrLien(depuis: string | null | undefined): { href: string; label: string } {
  return depuis && Object.hasOwn(ORIGINES, depuis)
    ? { ...ORIGINES[depuis as Origine] }
    : { href: "/dashboard", label: "Tableau de bord" }
}

export const lienQrLienDepuis = (origine: Origine) => `/dashboard/qr-link?depuis=${origine}`
