import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PublicTableBooking } from "../dashboard/builder/shared-renderer/blocks/table_booking"
import { contraste, CONTRASTE_MIN } from "../dashboard/builder/couleurLisible"
import { sansCommentaires } from "@/lib/codeSeul"

// Vague 2, point 3 (revue du 23 nov.) : le bouton « Réserver une table » était
// rouge en dur (#EF4444) — 3,8:1 sur fond blanc, et étranger au thème.

const THEMES = [
  { bg: "#FFFFFF", surface: "#FFFFFF", primary: "#C9A84C" },   // or sur blanc : trop pâle tel quel
  { bg: "#F5F0E8", surface: "#FFFFFF", primary: "#E2603F" },
  { bg: "#080808", surface: "#111009", primary: "#C9A84C" },
  { bg: "#1B2A4A", surface: "#22345A", primary: "#7DD3FC" },
  { bg: "#FDF2F4", surface: "#FFFFFF", primary: "#F9A8D4" },   // rose pâle sur rose : à foncer
]
// `table_booking` est servi par le renderer partagé depuis le rendu unique, lot 5.
const rendu = (theme: Record<string, string>) => renderToStaticMarkup(createElement(PublicTableBooking, {
  content: { url: "https://www.thefork.fr/restaurant/x", label: "Réserver une table" },
  ctx: { theme, G: theme.primary, TEXT: "#111111", MUTED: "#555555", FONT_D: "f", FONT_B: "b", pageId: "p1", blockId: "b1", trackClick: () => {} },
} as never))

describe("« Réserver » prend la couleur du thème, lisible sur la page", () => {
  for (const t of THEMES) {
    it(`${t.primary} sur ${t.bg}`, () => {
      const html = rendu(t)
      expect(html, "bouton non rendu").toContain('data-reserver=""')
      const encre = /color:(#[0-9A-Fa-f]{6})[^"]*"[^>]*>Réserver une table/.exec(html)?.[1]
      expect(encre, "couleur du libellé introuvable").toBeTruthy()
      for (const fond of [t.bg, t.surface]) expect(contraste(encre!, fond)!, `${encre} sur ${fond}`).toBeGreaterThanOrEqual(CONTRASTE_MIN)
      expect(html).not.toContain("#EF4444")
    })
  }
  it("une couleur de thème déjà lisible est gardée telle quelle", () => {
    expect(rendu(THEMES[2])).toMatch(/color:#C9A84C[^"]*"[^>]*>Réserver une table/i)
  })
  it("plus aucun rouge en dur dans le bloc", () => {
    const bloc = sansCommentaires(readFileSync(join(__dirname, "../dashboard/builder/shared-renderer/blocks/table_booking/index.tsx"), "utf8"))
    expect(bloc).not.toMatch(/EF4444|239,\s*68,\s*68/)
  })
})
