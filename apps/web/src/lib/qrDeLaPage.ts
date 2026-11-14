// qrDeLaPage.ts — ouvrir le QR Studio SUR le QR d'une page donnée.
//
// Audit du 14 novembre 2026 (C) : « Tester mon QR code » ouvrait le studio
// générique, positionné sur le premier QR de la liste — pas forcément celui de
// la page qu'on venait de publier. Module PUR.

export const lienQrDeLaPage = (pageId?: string | null): string =>
  pageId ? `/dashboard/qr-codes?page=${encodeURIComponent(pageId)}` : "/dashboard/qr-codes"

/** Le QR à présélectionner : celui de la page demandée, sinon rien (on garde le défaut). */
export function qrAPreselectionner<T extends { id: string; page_id: string }>(qrs: readonly T[], pageId: string | null | undefined): string | null {
  if (!pageId) return null
  return qrs.find(q => q.page_id === pageId)?.id ?? null
}
