import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// 9 septembre — le site vitrine suit la même discipline que l'application :
// contenu visible au repos (plus de sections à opacité 0 en attendant le
// défilement), plus d'écran d'intro à barre de chargement, plus de particules,
// plus de lueurs qui respirent en boucle ; le bouton d'appel à l'action est un
// aplat d'accent.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")
const home = lire("HomeClient.tsx")

describe("accueil", () => {
  it("les sections sont visibles au repos (useInView démarre visible)", () => {
    expect(lire("homeUi.tsx")).toContain("const [visible, setVisible] = useState(true)")
  })
  it("plus d'écran d'intro ni de particules", () => {
    expect(home).not.toContain("IntroOverlay")
    expect(home).not.toContain("<Particles")
    expect(home).not.toContain("function Particles")
  })
  it("plus de lueurs ni de flottements perpétuels (l'animation du scan reste)", () => {
    for (const a of ["heroAura 15s", "ctaGlow 5s", "glowPulse 2s", "gradientShift 3s", "float 5s", "floatCard ${c.dur}", "heroShimmer 3s", "sweepLight 5.2s"]) {
      expect(home, a).not.toContain(`animation: "${a}`)
      expect(home, a).not.toContain(`animation:"${a}`)
      expect(home, a).not.toContain("animation: `" + a)
    }
    expect(home).toContain("scanLine 3.4s")
  })
  it("le héros (badge, H1, description, CTA, réassurance) est rendu sans animation d'entrée", () => {
    // Revue du 9 septembre, P0 : le contenu essentiel ne dépend d'aucune
    // animation `both`/`backwards` (invisible tant que JavaScript n'a pas tourné,
    // et ignorée par prefers-reduced-motion quand elle est en ligne).
    const debut = home.indexOf('className="hero-badge"')
    const fin = home.indexOf('className="hero-reassurance"')
    expect(debut).toBeGreaterThan(0)
    expect(fin).toBeGreaterThan(debut)
    const heros = home.slice(debut, home.indexOf("</div>", fin))
    expect(heros).not.toContain("mo-fade-up")
    expect(heros).not.toMatch(/animation:\s*["'`]/)
    expect(heros).toContain("Votre page pro et son")
  })
  it("le bouton principal est un aplat d'accent", () => {
    expect(home).toContain('background: "var(--accent)",\n                color: "var(--ink-on-accent)",')
    expect(home).not.toContain("linear-gradient(90deg, #C9A84C, #d4a843, #b8953f)")
  })
})

describe("pages publiques (générateurs, guides, outils, sécurité)", () => {
  for (const f of ["generateur-qr-code-wifi/page.tsx", "generateur-qr-code/page.tsx", "guides/[slug]/page.tsx", "guides/page.tsx", "outils/page.tsx", "outils/taille-qr-code/page.tsx", "outils/testeur-qr-code/page.tsx", "qr-code/[usage]/page.tsx", "qr-code/page.tsx", "security/page.tsx"]) {
    it(`${f} : sans particules`, () => { expect(lire(f)).not.toContain("Particles") })
  }
})
