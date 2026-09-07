import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { apropos, disponibilite, annonce, etatFenetre, mentionFenetre, faq, filtrer } from "./models/informationsEtAnnonces"
import { EditorAbout, PublicAbout } from "./blocks/about"
import { EditorAvailability, PublicAvailability } from "./blocks/availability"
import { EditorAnnouncement, PublicAnnouncement } from "./blocks/announcement"
import { EditorFaq, PublicFaq } from "./blocks/faq"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Vague 17 — les quatre blocs d'information. Trois d'entre eux montraient ou
// publiaient quelque chose que le commerçant n'avait pas écrit :
//
//   · about écrivait « Votre histoire ici... » dans l'aperçu, à la place d'un
//     texte que la page ne publierait pas ;
//   · availability annonçait « Disponible » — le premier statut de la liste —
//     sur un bloc où seul le message était saisi ;
//   · faq dessinait titre, sous-titre, barre de recherche et onglets pour un
//     bloc sans une seule question, donc invisible en ligne.
//
// Et « Cartes », troisième style de la FAQ, rendait exactement comme
// « Compact » : un réglage proposé qui ne changeait rien.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const clair: any = { ...sombre, bg: "#FFFFFF", text: "#1A1A1A", muted: "#6B7280" }

const eCtx = (theme: any = sombre, canEdit = false): EditorRenderCtx =>
  ({ theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit, edit: () => () => {} })
const pCtx = (theme: any = sombre): PublicRenderCtx =>
  ({ theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })

const H = (el: any) => renderToStaticMarkup(el)
const HISTOIRE = { emoji: "📖", title: "Mon histoire", text: "L'atelier a ouvert en 2014.\nNous sommes trois." }
const DISPO = { status: "busy", message: "Complet jusqu'au 20", available_from: "Janvier", cta_label: "Prendre contact", cta_url: "https://calendly.com/a" }
const ANNONCE = { type: "Attention", title: "Fermeture", message: "Fermé le 15 août.", cta_label: "En savoir plus", cta_url: "https://x.fr" }
const FAQ = { title: "Questions fréquentes", subtitle: "Tout savoir", q1: "Livrez-vous ?", a1: "Oui, dans toute la Marne.", q1_cat: "Livraison", q2: "Quels délais ?", a2: "48 h.", q2_cat: "Livraison" }

describe("vague 17 - about : plus de fausse histoire dans l'apercu", () => {
  it("un bloc vide ne donne rien", () => {
    expect(apropos({})).toBeNull()
    expect(apropos({ emoji: "📖" })).toBeNull()          // un emoji seul n'est pas un contenu
    expect(apropos({ title: "  ", text: " " })).toBeNull()
  })
  it("un titre seul suffit, mais ne publie pas de paragraphe vide", () => {
    expect(apropos({ title: "Mon histoire" })!.texte).toBe("")
    const h = H(<PublicAbout content={{ title: "Mon histoire" }} ctx={pCtx()} />)
    expect(h).toContain("Mon histoire")
    expect((h.match(/<p/g) ?? []).length, "un <p> vide est un trou dans la page").toBe(1)
  })
  it("l'apercu n'ecrit plus « Votre histoire ici... »", () => {
    for (const c of [{}, { title: "Mon histoire" }]) {
      expect(H(<EditorAbout content={c} ctx={eCtx()} />)).not.toContain("Votre histoire")
    }
  })
  it("le bloc vide invite, et previent qu'il restera invisible", () => {
    const h = H(<EditorAbout content={{}} ctx={eCtx()} />)
    expect(h).toContain('role="note"')
    expect(h).toContain("Invisible en ligne")
  })
})

describe("vague 17 - availability : plus de « Disponible » que personne n'a choisi", () => {
  it("sans statut choisi, aucun statut annonce", () => {
    // `availabilityStatus` retombait sur AVAILABILITY_STATUSES[0].
    const d = disponibilite({ message: "Réponse sous 24 h" })!
    expect(d.label).toBe("")
    expect(H(<PublicAvailability content={{ message: "Réponse sous 24 h" }} ctx={pCtx()} />)).not.toContain("Disponible")
  })
  it("un statut choisi est bien affiche", () => {
    expect(disponibilite({ status: "available" })!.label).toBe("Disponible")
    expect(disponibilite({ status: "busy" })!.label).toBe("En mission")
    expect(disponibilite({ status: "inconnu" })!.label).toBe("")
  })
  it("un bloc entierement vide ne publie rien", () => {
    expect(disponibilite({})).toBeNull()
    expect(disponibilite({ available_from: "Janvier" })).toBeNull()   // une date seule n'affirme rien
    expect(PublicAvailability({ content: {}, ctx: pCtx() } as any)).toBeNull()
  })
  it("le bouton n'existe que s'il mene quelque part", () => {
    expect(disponibilite({ status: "busy", cta_label: "Prendre contact" })!.cta).toBeNull()
    expect(disponibilite({ status: "busy", cta_label: "Prendre contact", cta_url: "#" })!.cta).toBeNull()
    expect(disponibilite(DISPO)!.cta!.href).toBe("https://calendly.com/a")
  })
})

describe("vague 17 - announcement : la fenetre de dates est enfin visible de l'auteur", () => {
  it("l'etat se lit sans horloge quand l'heure est inconnue", () => {
    // -1 = rendu serveur : on ne masque pas au hasard.
    expect(etatFenetre("2020-01-01", "2020-02-01", -1)).toBe("pendant")
  })
  it("avant, pendant, apres", () => {
    const t = Date.parse("2026-06-15T12:00:00Z")
    expect(etatFenetre("2026-07-01", "", t)).toBe("avant")
    expect(etatFenetre("", "2026-06-01", t)).toBe("apres")
    expect(etatFenetre("2026-06-01", "2026-07-01", t)).toBe("pendant")
    expect(etatFenetre("", "", t)).toBe("pendant")
  })
  it("une date illisible est ignoree plutot que de masquer par erreur", () => {
    expect(etatFenetre("pas une date", "n'importe quoi", Date.now())).toBe("pendant")
  })
  it("l'apercu explique pourquoi la banniere n'est pas en ligne", () => {
    expect(mentionFenetre("pendant")).toBeNull()
    expect(mentionFenetre("avant")).toContain("pas encore")
    expect(mentionFenetre("apres")).toContain("Expirée")
  })
  it("un bloc sans titre ni message ne dessine plus de cadre colore", () => {
    expect(annonce({ type: "Urgent", emoji: "🚨" })).toBeNull()
    const h = H(<EditorAnnouncement content={{ type: "Urgent" }} ctx={eCtx()} />)
    expect(h).toContain("Invisible en ligne")
    expect(h).not.toContain("🚨")
  })
  it("le type choisit l'icone et la couleur, l'emoji saisi les remplace", () => {
    expect(annonce({ title: "T", type: "Urgent" })!.icone).toBe("🚨")
    expect(annonce({ title: "T", type: "Urgent", emoji: "🎉" })!.icone).toBe("🎉")
    expect(annonce({ title: "T", type: "Urgent", color: "#123456" })!.couleur).toBe("#123456")
    expect(annonce({ title: "T", type: "Urgent", color: "rouge" })!.couleur).toBe("#EF4444")
  })
})

describe("vague 17 - faq : pas de question, pas d'en-tete", () => {
  it("sans question, rien du tout", () => {
    expect(faq({ title: "Questions fréquentes", subtitle: "Tout savoir", search: "Oui" })).toBeNull()
    const h = H(<EditorFaq content={{ title: "Questions fréquentes", search: "Oui" }} ctx={eCtx()} />)
    expect(h, "l'apercu dessinait le titre et la barre de recherche").not.toContain("Rechercher une question")
    expect(h).toContain("Invisible en ligne")
  })
  it("les questions vides sont ignorees, les categories deduites", () => {
    const f = faq(FAQ)!
    expect(f.items.map(i => i.q)).toEqual(["Livrez-vous ?", "Quels délais ?"])
    expect(f.categories).toEqual(["Livraison"])
  })
  it("un lien de question n'existe que s'il mene quelque part", () => {
    expect(faq({ q1: "A", q1_link: "#" })!.items[0].lien).toBeNull()
    expect(faq({ q1: "A", q1_link: "aide.fr" })!.items[0].lien!.href).toBe("https://aide.fr")
    expect(faq({ q1: "A", q1_link: "aide.fr" })!.items[0].lien!.label).toBe("En savoir plus")
  })
  it("le filtre cherche dans la question ET dans la reponse", () => {
    const f = faq(FAQ)!
    expect(filtrer(f.items, "marne", "").map(i => i.q)).toEqual(["Livrez-vous ?"])
    expect(filtrer(f.items, "", "Livraison")).toHaveLength(2)
    expect(filtrer(f.items, "introuvable", "")).toEqual([])
  })
  it("« Cartes » ne rend plus exactement comme « Compact »", () => {
    // Les deux styles etaient distincts dans le panneau et identiques a l'ecran.
    const compact = H(<PublicFaq content={{ ...FAQ, style: "Compact" }} ctx={pCtx()} />)
    const cartes = H(<PublicFaq content={{ ...FAQ, style: "Cartes" }} ctx={pCtx()} />)
    expect(cartes).not.toBe(compact)
    expect(cartes).toContain("box-shadow")
  })
  it("un style inconnu retombe sur l'accordeon", () => {
    expect(faq({ q1: "A", style: "Mosaïque" })!.style).toBe("Accordéon")
  })
})

describe("vague 17 - l'apercu montre ce qui sera publie", () => {
  const textes = (h: string) => h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
  for (const [type, Ed, Pub, contenu] of [
    ["about", EditorAbout, PublicAbout, HISTOIRE],
    ["availability", EditorAvailability, PublicAvailability, DISPO],
    ["announcement", EditorAnnouncement, PublicAnnouncement, ANNONCE],
    ["faq", EditorFaq, PublicFaq, FAQ],
    ["faq-cartes", EditorFaq, PublicFaq, { ...FAQ, style: "Cartes", search: "Oui" }],
  ] as const) {
    it(type + " : memes textes des deux cotes", () => {
      expect(textes(H(<Ed content={contenu} ctx={eCtx()} />))).toEqual(textes(H(<Pub content={contenu} ctx={pCtx()} /> as any)))
    })
  }
})

describe("vague 17 - liens reels en ligne, coquilles inertes dans l'apercu", () => {
  it("announcement : vrai lien public, coquille dans le canvas", () => {
    expect(H(<PublicAnnouncement content={ANNONCE} ctx={pCtx()} />)).toContain('href="https://x.fr"')
    const ed = H(<EditorAnnouncement content={ANNONCE} ctx={eCtx()} />)
    expect(ed).not.toContain("href=")
    expect(ed).toContain('aria-disabled="true"')
  })
  it("l'edition en ligne de l'annonce survit a la migration", () => {
    expect(H(<EditorAnnouncement content={ANNONCE} ctx={eCtx(sombre, true)} />)).toContain("contenteditable")
    expect(H(<PublicAnnouncement content={ANNONCE} ctx={pCtx()} />)).not.toContain("contenteditable")
  })
  it("faq : la barre de recherche est le MEME champ des deux cotes, inerte dans le canvas", () => {
    // L'apercu dessinait un <div> portant le texte en clair ; la page, un
    // <input> avec un placeholder. Deux dessins differents pour la meme chose.
    const c = { ...FAQ, search: "Oui" }
    const ed = H(<EditorFaq content={c} ctx={eCtx()} />)
    const pub = H(<PublicFaq content={c} ctx={pCtx()} />)
    for (const h of [ed, pub]) expect(h).toContain('placeholder="Rechercher une question…"')
    expect(ed, "inerte dans le canvas").toContain('readonly=""')
    expect(pub).not.toContain("readonly")
  })

  it("faq : les questions restent dépliables des deux cotes", () => {
    for (const h of [H(<EditorFaq content={FAQ} ctx={eCtx()} />), H(<PublicFaq content={FAQ} ctx={pCtx()} />)]) {
      expect(h).toContain('aria-expanded="false"')
    }
  })
})

describe("vague 17 - les surfaces suivent le theme", () => {
  it("les cartes de la FAQ restent visibles sur un theme clair", () => {
    const c = { ...FAQ, style: "Cartes" }
    expect(H(<PublicFaq content={c} ctx={pCtx(clair)} />)).not.toMatch(/rgba\(255,255,255/)
    expect(H(<PublicFaq content={c} ctx={pCtx()} />)).toMatch(/rgba\(255,255,255/)
  })
})

describe("vague 17 - activation", () => {
  it("les quatre blocs sont dans le drapeau de migration", () => {
    for (const t of ["about", "availability", "announcement", "faq"]) expect(SHARED_RENDERER_BLOCKS.has(t)).toBe(true)
  })
})
