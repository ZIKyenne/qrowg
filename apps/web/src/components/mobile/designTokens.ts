// designTokens.ts — Design System QRfolio (mobile-first). Source UNIQUE de vérité pour
// espacements, rayons, cibles tactiles, couleurs (chrome or/noir), élévations, motion.
// But : cohérence stricte (priorité UX #9). Pur -> testable (designTokens.test.ts).

export const T = {
  // Échelle d'espacement (base 4 / rythme 8).
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  // Rayons.
  radius: { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 },
  // Cibles tactiles.
  tap: 46,        // minimum confortable (> 44 recommandé Apple/Google)
  handle: 20,     // poignée de sélection d'objet
  // Empilement (z-index) — un ordre unique pour tout le mobile.
  z: { dock: 30, scrim: 40, sheet: 45, ctx: 25, toast: 80, gate: 90 },
  // Durées de motion (ms).
  motion: { fast: 120, base: 250, sheet: 300 },
  ease: "cubic-bezier(.2,.85,.25,1)",
  // Couleurs — chrome sombre premium (identité or/noir).
  color: {
    bg: "#0C0C0E", chrome: "#141417", chrome2: "#1C1C21", line: "rgba(255,255,255,0.09)",
    ink: "#F4F1EA", inkDim: "#B9B4A9", muted: "#807A6E",
    gold: "#C9A84C", gold2: "#E0C878", goldSoft: "rgba(201,168,76,0.14)",
    ok: "#4FB783", warn: "#E0A93B", danger: "#E4756B",
  },
  // Élévations (ombres) par niveau.
  elevation: [
    "none",
    "0 4px 14px rgba(0,0,0,0.25)",
    "0 12px 34px rgba(0,0,0,0.45)",
    "0 -20px 60px rgba(0,0,0,0.5)",
  ],
} as const

// Garantit une cible tactile confortable (jamais sous le minimum).
export function clampTap(size: number): number {
  return Math.max(T.tap, Math.round(size))
}

// Ombre d'un niveau d'élévation (borne aux niveaux définis).
export function elevation(level: number): string {
  const i = Math.max(0, Math.min(T.elevation.length - 1, Math.round(level)))
  return T.elevation[i]
}

// Variables CSS `:root{…}` dérivées des tokens — à injecter une fois pour styler en CSS pur.
export function tokensCss(): string {
  const c = T.color
  return [
    ":root{",
    `--qf-bg:${c.bg};--qf-chrome:${c.chrome};--qf-chrome2:${c.chrome2};--qf-line:${c.line};`,
    `--qf-ink:${c.ink};--qf-ink-dim:${c.inkDim};--qf-muted:${c.muted};`,
    `--qf-gold:${c.gold};--qf-gold-2:${c.gold2};--qf-gold-soft:${c.goldSoft};`,
    `--qf-ok:${c.ok};--qf-warn:${c.warn};--qf-danger:${c.danger};`,
    `--qf-r-sm:${T.radius.sm}px;--qf-r-md:${T.radius.md}px;--qf-r-lg:${T.radius.lg}px;--qf-r-xl:${T.radius.xl}px;`,
    `--qf-tap:${T.tap}px;--qf-ease:${T.ease};`,
    "}",
  ].join("")
}

export type Tokens = typeof T
