import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { EMPTY_STATE_BLOCK_TYPES, hasPublishableContent } from "./dashboard/builder/blockEmptyState"

// Relevé du 12 septembre. Mesure du PREMIER ÉCRAN — ce que voit celui qui vient
// de scanner, sur un téléphone, avant de faire le moindre geste — sur les 34
// pages de démonstration rendues par le vrai moteur public :
//
//     19 pages sur 34 n'offrent AUCUNE action sur ce premier écran.
//     14 n'en offrent aucune nulle part.
//
// La cause n'est pas la mise en page. Ce sont treize types de blocs qui rendent
// `null` en public dès que leur destination manque — `case "call_button":
// return c.phone ? … : null` — pendant que l'éditeur, lui, les dessinait
// complets, bouton compris.
//
// Le commerçant ajoutait « Appeler » depuis la bibliothèque, voyait le bouton
// vert dans son aperçu, publiait — et la page n'avait pas de bouton. L'alerte de
// pré-publication ne le rattrapait pas : `boutonsSansLien` exige un couple
// libellé/url déjà rempli, et quatre de ces blocs (appel, e-mail, itinéraire,
// WhatsApp) n'ont même pas d'url : leur destination est un numéro, une adresse
// e-mail, une adresse postale.

const SRC = __dirname
const lire = (p: string) => readFileSync(join(SRC, p), "utf8")

/** Les treize blocs d'action relevés le 12 septembre. */
const ACTIONS = [
  "call_button", "whatsapp_button", "email_button", "directions_button",
  "booking_button", "table_booking", "donation", "download_file",
  "google_review", "video", "embed_block", "spotify_embed", "audio_player",
] as const

describe("un bloc que la page ne publiera pas se dit dans l'éditeur", () => {
  it("les treize blocs d'action sont entrés dans la doctrine de l'état vide", () => {
    const hors = ACTIONS.filter(t => !EMPTY_STATE_BLOCK_TYPES.includes(t))
    expect(hors, `hors doctrine : ${hors.join(", ")}`).toEqual([])
  })
  it("chacun est jugé sur SA destination, pas sur une url supposée", () => {
    expect(hasPublishableContent("call_button", { label: "Appeler" })).toBe(false)
    expect(hasPublishableContent("call_button", { phone: "+33 3 26 00 00 00" })).toBe(true)
    expect(hasPublishableContent("email_button", { email: "contact@exemple.fr" })).toBe(true)
    expect(hasPublishableContent("directions_button", { address: "2 rue des Capucins, Reims" })).toBe(true)
    expect(hasPublishableContent("whatsapp_button", { phone: "+33 6 00 00 00 00" })).toBe(true)
    // un libellé seul ne publie rien : c'était tout le piège
    for (const t of ACTIONS) expect(hasPublishableContent(t, { label: "Cliquez ici" }), t).toBe(false)
  })
  it("l'intégration exige en plus un hôte autorisé — le détecteur pose la même question", () => {
    // Sinon le bloc est annoncé publiable et la page rend un cadre vide.
    expect(hasPublishableContent("embed_block", { url: "https://exemple-inconnu.fr/agenda" })).toBe(false)
    expect(hasPublishableContent("embed_block", { url: "https://www.youtube.com/embed/demo" })).toBe(true)
  })
})

describe("la classe est fermée : aucun bloc public ne peut disparaître en silence", () => {
  it("tout bloc du rendu public qui peut ne rien rendre est déclaré dans la doctrine", () => {
    const legacy = lire("[slug]/renduLegacy.tsx")
    // `case "x": return c.champ ? ( … ) : null` — la forme qui fait disparaître un bloc.
    const muets = [...legacy.matchAll(/case "([a-z_0-9]+)":\s*return\s+c\.\w+\s*\?/g)].map(m => m[1])
    expect(muets.length, "la forme recherchée n'existe plus : adapter la garde").toBeGreaterThan(5)
    const hors = [...new Set(muets)].filter(t => !EMPTY_STATE_BLOCK_TYPES.includes(t)).sort()
    expect(hors, `l'éditeur les dessine, la page ne les publie pas : ${hors.join(", ")}`).toEqual([])
  })
})

describe("l'aperçu de l'éditeur dit quoi mettre", () => {
  it("les blocs restés en legacy portent leur garde dans builderPreview", () => {
    const p = lire("dashboard/builder/builderPreview.tsx")
    for (const t of ["booking_button", "table_booking", "embed_block"])
      expect(p, t).toContain(`hasPublishableContent("${t}"`)
  })
  it("les adapters partagés rendent une invite nommée, pas un bouton fantôme", () => {
    const b = "dashboard/builder/shared-renderer/blocks/"
    const cas: [string, string][] = [
      [b + "whatsapp_button/EditorWhatsappButton.tsx", "Ajoutez le numéro WhatsApp"],
      [b + "email_button/EditorEmailButton.tsx", "Ajoutez l'adresse e-mail"],
      [b + "call_button/index.tsx", "Ajoutez le numéro à appeler"],
      [b + "directions_button/index.tsx", "Ajoutez l'adresse de l'itinéraire"],
      [b + "google_review/EditorGoogleReview.tsx", "Ajoutez le lien de votre fiche Google"],
    ]
    for (const [f, phrase] of cas) {
      const src = lire(f)
      expect(src, f).toContain(phrase)
      expect(src, `${f} : la mention « invisible en ligne » manque`).toContain("HIDDEN_WHEN_EMPTY_NOTE")
    }
  })
})
