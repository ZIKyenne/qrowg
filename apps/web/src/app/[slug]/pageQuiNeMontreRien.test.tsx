// Une page qui ne montre rien le dit — garde de classe.
//
// ── Ce que le client voyait après avoir scanné ────────────────────────────
//
// La page publiée porte la bonne phrase depuis longtemps :
//
//     ✦  Cette page est en préparation
//        Revenez bientôt, le contenu arrive.
//
// Elle ne s'affichait qu'à une condition : **`blocks.length === 0`**. Or un
// commerçant qui ajoute quatre blocs depuis la bibliothèque et les laisse vides
// a bien quatre blocs. Le client scanne le QR collé sur la vitrine et tombe sur
// une page **entièrement blanche**, avec le seul badge QRowg en bas.
//
// ── Ce que le produit savait déjà, et ne disait pas ───────────────────────
//
// `hasPublishableContent` répond exactement à cette question — pour les cent
// quarante-six blocs du catalogue depuis les lots v166 à v171. `jugerPage` le
// savait aussi, à sa façon : elle retire déjà cette page de Google pour
// « texte insuffisant ». Deux endroits du produit constataient la page vide, et
// aucun des deux ne le disait — ni au visiteur, ni au commerçant avant qu'il
// publie.
//
// C'est le geste de toute la série : la question est posée UNE fois
// (`lib/pageQuiMontreQuelqueChose`), et les deux côtés la posent là.

import { describe, it, expect } from "vitest"
import { pageQuiMontreQuelqueChose, blocQuiMontre, DECORATIONS, FORMULAIRES } from "@/lib/pageQuiMontreQuelqueChose"
import { SHARED_RENDERER_BLOCKS } from "../dashboard/builder/shared-renderer/architecture"
import { alertesPublication } from "../dashboard/builder/AlertesPublication"
import { jugerPage } from "@/lib/indexation"
import { BLOCK_DEFS } from "../dashboard/builder/blockDefs"
import { hasPublishableContent } from "../dashboard/builder/blockEmptyState"
import fs from "node:fs"
import path from "node:path"

const bloc = (type: string, content: Record<string, any> = {}, visible = true) =>
  ({ id: `b-${type}`, type, content, visible } as any)

describe("garde de classe : une page sans contenu publiable est une page vide", () => {
  it("quatre blocs ajoutés et laissés vides ne montrent rien", () => {
    const page = ["about", "faq", "gallery", "packs"].map(t => bloc(t))
    expect(page.length, "il y a bien des blocs — c'est tout le piège").toBe(4)
    expect(pageQuiMontreQuelqueChose(page)).toBe(false)
  })

  it("…et un seul bloc rempli suffit à la faire exister", () => {
    // Sans ce sens-là, une règle qui répondrait toujours « vide » passerait.
    const page = [bloc("about", {}), bloc("faq", { q1: "Livrez-vous ?" }), bloc("gallery", {})]
    expect(pageQuiMontreQuelqueChose(page)).toBe(true)
    expect(blocQuiMontre(page[1])).toBe(true)
  })

  it("un bloc masqué ne montre rien, une décoration non plus", () => {
    expect(blocQuiMontre(bloc("about", { title: "Notre histoire" }, false)), "masqué").toBe(false)
    for (const d of DECORATIONS)
      expect(blocQuiMontre(bloc(d)), `${d} : une page de traits ne montre rien`).toBe(false)
    expect(pageQuiMontreQuelqueChose([bloc("divider"), bloc("spacer"), bloc("color_band")])).toBe(false)
    // …mais une décoration n'empêche pas une page qui, elle, montre quelque chose.
    expect(pageQuiMontreQuelqueChose([bloc("divider"), bloc("about", { title: "Notre histoire" })])).toBe(true)
  })

  it("la page publiée pose la question, elle ne compte plus les blocs", () => {
    const src = fs.readFileSync(path.join(__dirname, "PublicPageClient.tsx"), "utf8")
    expect(src, "elle interroge la règle partagée").toContain("!pageQuiMontreQuelqueChose(blocks) && (")
    expect(src, "elle ne compte plus").not.toContain("{blocks.length === 0 && (")
    expect(src, "et la phrase du produit n'a pas bougé").toContain("Cette page est en préparation")
  })

  it("le commerçant l'apprend AVANT de publier, en une ligne", () => {
    const alertes = alertesPublication(["about", "faq", "gallery", "packs"].map(t => bloc(t)))
    const surLaPage = alertes.filter(a => a.blocId === "")
    expect(surLaPage.length, "une seule ligne pour la page entière").toBe(1)
    expect(surLaPage[0].texte, "et elle dit ce qui arrivera").toContain("la page sera vide pour qui la scanne")
    // Le détail bloc par bloc reste : il dit QUOI remplir.
    expect(alertes.filter(a => a.blocId !== "").length, "les quatre blocs sont toujours nommés").toBe(4)
  })

  it("…et se tait dès qu'un bloc montre quelque chose", () => {
    const alertes = alertesPublication([bloc("about", { title: "Notre histoire" })])
    expect(alertes.filter(a => a.texte.includes("la page sera vide")), "rien à signaler").toEqual([])
  })

  it("une page sans aucun bloc garde sa phrase — c'était déjà le cas", () => {
    expect(pageQuiMontreQuelqueChose([])).toBe(false)
    expect(alertesPublication([]), "et rien à vérifier : il n'y a rien").toEqual([])
  })
})

describe("les deux constats du produit disent enfin la même chose", () => {
  it("ce que le référencement écartait, le visiteur l'ignorait", () => {
    // `jugerPage` retire cette page de Google pour « texte insuffisant » depuis
    // longtemps. Le visiteur, lui, n'avait aucun mot. Les deux s'accordent.
    const blocks = ["about", "faq"].map(t => bloc(t))
    const verdict = jugerPage({ slug: "chez-marcel", title: "Chez Marcel", blocks: blocks.map(b => ({ content: b.content })) })
    expect(verdict.indexable, "Google ne la voit pas").toBe(false)
    expect(pageQuiMontreQuelqueChose(blocks), "…et elle ne montre rien").toBe(false)
  })
})

describe("balayage : tout le catalogue, à vide", () => {
  it("aucun bloc du renderer partagé, seul et vide, ne fait exister une page", () => {
    // Le balayage large : si un seul type répondait « je montre quelque chose »
    // en étant vide, un commerçant pourrait publier une page blanche sans un mot.
    const fautifs = Object.keys(BLOCK_DEFS)
      .filter(t => SHARED_RENDERER_BLOCKS.has(t))
      .filter(t => !DECORATIONS.includes(t) && !FORMULAIRES.includes(t))
      .filter(t => pageQuiMontreQuelqueChose([bloc(t)]))
    expect(fautifs, "un bloc vide ne montre rien").toEqual([])
  })

  it("un formulaire MONTRE quelque chose sans rien contenir — ses champs sont le contenu", () => {
    // Et il y arrive SANS branche dédiée : aucun n'a de détecteur, donc la
    // prudence de `hasPublishableContent` répond « plein ». J'avais écrit une
    // branche `FORMULAIRES` ; une mutation l'a retirée sans rien casser — elle
    // ne servait à rien. La liste reste pour NOMMER ces blocs, et le cliquet
    // plus bas s'en sert : le jour où un formulaire recevra un détecteur, il
    // échouera et posera la question au bon moment.
    for (const f of FORMULAIRES.filter(t => t in BLOCK_DEFS))
      expect(pageQuiMontreQuelqueChose([bloc(f)]), `${f} : une page qui ne porte que lui est utile`).toBe(true)
    expect(FORMULAIRES.filter(t => t in BLOCK_DEFS).length, "des formulaires au catalogue").toBeGreaterThan(4)
    const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "pageQuiMontreQuelqueChose.ts"), "utf8")
    expect(src, "aucune branche dédiée, et la raison est écrite").not.toContain("FORMULAIRES.includes(b.type)")
  })

  it("les types legacy-seuls ont reçu leur détecteur au lot v173", () => {
    // Le cliquet ouvert par ce lot-ci a été fermé par le suivant. Deux blocs
    // restent à part, et leur raison est écrite dans
    // `derniersBlocsQuiSeTaisent` : `visit_counter` reçoit son nombre du
    // produit, et `qr_code_block` ne publie jamais rien.
    const A_PART = ["visit_counter", "qr_code_block"]
    const sans = Object.keys(BLOCK_DEFS)
      .filter(t => !SHARED_RENDERER_BLOCKS.has(t))
      .filter(t => !DECORATIONS.includes(t) && !FORMULAIRES.includes(t) && !A_PART.includes(t))
      .filter(t => pageQuiMontreQuelqueChose([bloc(t)]))
    expect(sans, `sans détecteur : ${sans.join(", ")}`).toEqual([])
  })

  it("…et rempli, il en fait exister une — sinon le balayage ne prouverait rien", () => {
    // Un échantillon large, pris dans toutes les familles.
    const REMPLIS: [string, Record<string, string>][] = [
      ["about", { title: "Notre histoire" }], ["faq", { q1: "Livrez-vous ?" }],
      ["gallery", { img1: "https://exemple.supabase.co/a.png" }], ["packs", { pack1_name: "Formule" }],
      ["checklist", { i1: "Sans gluten" }], ["frame_box", { title: "À noter" }],
      ["quote_block", { quote: "Merci !" }], ["opening_hours", { mon_fri: "9h — 19h" }],
      ["call_button", { phone: "+33 6 12 34 56 78" }], ["progress_bars", { b1_label: "Avancement" }],
    ]
    for (const [type, content] of REMPLIS) {
      expect(hasPublishableContent(type, content), `${type} : le détecteur le voit plein`).toBe(true)
      expect(pageQuiMontreQuelqueChose([bloc(type, content)]), `${type} : et la page existe`).toBe(true)
    }
  })
})
