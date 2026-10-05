import { test, expect } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

// avantLeJavascript — ce que le téléphone affiche avant que le JS arrive.
//
// ── Pourquoi cette mesure, et contre quoi ──────────────────────────────────
//
// J'avais écrit, dans la feuille de route mobile, qu'un « flash desktop →
// mobile » se produisait à chaque chargement. C'était **faux**, et c'est la
// lecture du code qui l'a montré : `lib/useIsMobile.ts` utilise
// `useSyncExternalStore`, et son commentaire documente précisément le défaut
// qu'il a supprimé — « au lieu de peindre la version PC, puis de la remplacer un
// effet plus tard (mesuré : 270 ms de barre latérale fantôme sur téléphone) ».
// React corrige la valeur PENDANT l'hydratation, avant la peinture qui suit.
//
// Mais le même commentaire énonce ce qui reste : « Ce que le HTML rendu par le
// serveur affiche AVANT l'arrivée du JavaScript reste l'affaire du CSS ». Le
// serveur ne connaît pas la largeur de l'écran : il rend `false`, donc la
// version PC, pour **toute décision de disposition prise en style inline**.
//
// Cette spec mesure donc la seule chose qui compte encore : **à quoi ressemble
// la page sans JavaScript, à 390 px ?** C'est ce que voit un téléphone sur un
// réseau lent pendant les premières centaines de millisecondes — et c'est ce que
// la stratégie « disposition en CSS, comportement en JS » doit corriger.
//
// ── Ce qu'elle ne prétend pas ──────────────────────────────────────────────
//
// Désactiver JavaScript n'est pas « simuler un réseau lent ». C'est le cas
// limite : ce que le HTML dit tout seul. Une page qui tient sans JS tiendra a
// fortiori pendant l'attente. Une page qui déborde sans JS débordera peut-être
// une fraction de seconde, peut-être pas du tout si le JS arrive vite. La durée
// réelle de l'écart appartient à un vrai téléphone sur un vrai réseau.

const VUES = [
  "/",
  "/creer",
  "/qr-code/restaurant",
  "/e2e-harness/accueil",
  "/e2e-harness/statistiques",
  "/e2e-harness/templates",
  "/e2e-harness/qr-studio",
]

// ── Le faux vert qu'il a fallu corriger ───────────────────────────────────
//
// Première exécution : **7 vues sur 7 au vert**, zéro débordement. J'ai failli
// m'en réjouir. La capture de `/e2e-harness/statistiques` disait autre chose :
// un rouet doré et « Chargement des statistiques… » sur fond noir. Zéro
// débordement parce que **zéro contenu** — l'écran est rendu entièrement côté
// client.
//
// Une assertion qui passe sur une page vide ne mesure rien. Elle rassure, ce qui
// est pire. La spec classe donc maintenant chaque vue avant de juger :
//
//   · **rendue par le serveur** → le débordement est mesuré et fait échouer ;
//   · **coquille d'attente**    → il n'y a rien à mesurer, et c'est CE FAIT qui
//     est consigné, parce qu'il dit quelque chose d'autre : ce que voit un
//     téléphone sur réseau lent, c'est un rouet.
//
// Le seuil est volontairement bas (280 caractères visibles) : il sépare « une
// page » d'« un message d'attente », pas « beaucoup » de « peu ».

const DOSSIER = join("audit-mobile", "sans-javascript")
const TEXTE_MINIMAL = 280

type Constat = {
  route: string
  rendue: boolean
  texteVisible: number
  debordement: number
  largeurUtile: number
  coupables: string[]
}
const constats: Constat[] = []

test.describe("avant le JavaScript, à 390 px", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  test.describe.configure({ mode: "serial", timeout: 120_000 })

  for (const route of VUES) {
    test(`le HTML seul tient sur 390 px — ${route}`, async ({ page }) => {
      const rep = await page.goto(route, { waitUntil: "domcontentloaded" })
      expect(rep?.status(), route).toBeLessThan(400)

      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth
        const debordement = Math.max(0, document.documentElement.scrollWidth - vw)
        const texteVisible = (document.body.innerText || "").replace(/\s+/g, " ").trim().length
        const coupables: string[] = []
        if (debordement > 1) {
          for (const el of Array.from(document.querySelectorAll("*"))) {
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.height === 0) continue
            if (r.right <= vw + 1) continue
            const p = el.parentElement
            if (p && p.getBoundingClientRect().right > vw + 1) continue
            const e = el as HTMLElement
            const cl = typeof e.className === "string" && e.className
              ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""
            coupables.push(`${e.tagName.toLowerCase()}${cl} → ${Math.round(r.right - vw)}px hors champ`)
            if (coupables.length >= 5) break
          }
        }
        return { debordement, largeurUtile: vw, coupables, texteVisible }
      })

      const rendue = m.texteVisible >= TEXTE_MINIMAL
      constats.push({ route, rendue, ...m })
      mkdirSync(DOSSIER, { recursive: true })
      const nom = route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "accueil"
      await page.screenshot({ path: join(DOSSIER, `${nom}.png`) })

      // Une coquille d'attente n'a rien à déborder : l'affirmer serait le faux
      // vert que cette spec a justement appris à ne plus produire. On consigne,
      // on ne juge pas.
      if (!rendue) {
        test.info().annotations.push({
          type: "coquille d'attente",
          description: `${route} : ${m.texteVisible} caractères visibles sans JavaScript — écran rendu côté client`,
        })
        return
      }

      // Pour une vue réellement servie, le débordement est un défaut dur : le
      // HTML ne tient pas dans un téléphone, et aucun délai réseau ne l'excuse.
      expect(
        m.debordement,
        `${route} déborde de ${m.debordement}px avant le JS — ${m.coupables.join(" · ")}`,
      ).toBeLessThanOrEqual(1)
    })
  }

  test.afterAll(() => {
    mkdirSync("audit-mobile", { recursive: true })
    writeFileSync(join("audit-mobile", "SANS-JAVASCRIPT.md"), [
      "# Ce que le HTML affiche avant le JavaScript — 390 px",
      "",
      `Mesuré le ${new Date().toISOString().slice(0, 10)}`,
      "",
      "| Vue | Sans JS | Texte visible | Débordement | Coupables |",
      "| --- | --- | --- | --- | --- |",
      ...constats.map(c => `| \`${c.route}\` | ${c.rendue ? "**page servie**" : "coquille d'attente"} | ${c.texteVisible} car. | ${c.debordement > 1 ? `**${c.debordement}px**` : "—"} | ${c.coupables.join("<br>") || "—"} |`),
      "",
      "## Comment lire ce tableau",
      "",
      "**« coquille d'attente »** veut dire que l'écran est rendu entièrement côté",
      "client : sans JavaScript, le téléphone n'affiche qu'un message d'attente. Son",
      "« zéro débordement » ne prouve donc rien sur la mise en page — il n'y en a pas.",
      "Ce que ça dit, en revanche, est utile : sur un réseau lent, voilà ce qu'on",
      "regarde en attendant. Un squelette y renseignerait la forme de l'écran ; un",
      "rouet ne renseigne rien.",
      "",
      "Désactiver JavaScript n'est pas simuler un réseau lent : c'est le cas limite,",
      "ce que le HTML dit tout seul. La durée réelle de l'écart, sur un vrai réseau,",
      "appartient à un vrai téléphone.",
    ].join("\n") + "\n")
  })
})
