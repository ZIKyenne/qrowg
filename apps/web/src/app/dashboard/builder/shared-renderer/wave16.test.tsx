import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { horaires, modeJourParJour, estAujourdhui, estFerme, galerie, sizesGrille, reseauxActifs, affichageReseaux, RESEAUX } from "./models/horairesGalerieReseaux"
import { EditorOpeningHours, PublicOpeningHours } from "./blocks/opening_hours"
import { EditorGallery, PublicGallery } from "./blocks/gallery"
import { EditorSocialLinks, PublicSocialLinks } from "./blocks/social_links"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Vague 16 — horaires, galerie, réseaux : les trois derniers gros blocs posés
// sur presque toutes les pages. Chacun avait son écart, et deux d'entre eux
// coûtaient quelque chose au commerçant plutôt qu'au visiteur :
//
//   · la galerie de l'aperçu rendait des <img> bruts — douze originaux pleine
//     taille retéléchargés sur le téléphone de l'auteur à chaque ouverture du
//     canvas, pour des vignettes de quelques dizaines de pixels ;
//   · les horaires perdaient leur note en ligne quand il ne restait qu'une
//     exception (fermeture pour congés) : l'aperçu la montrait, la page non ;
//   · l'aperçu écrivait « Lun — Ven », la page « Lundi — Vendredi ».

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const clair: any = { ...sombre, bg: "#FFFFFF", text: "#1A1A1A", muted: "#6B7280" }

const eCtx = (theme: any = sombre): EditorRenderCtx =>
  ({ theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (theme: any = sombre): PublicRenderCtx =>
  ({ theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })

const H = (el: any) => renderToStaticMarkup(el)
const HORAIRES = { title: "Nos horaires", mon_fri: "9h - 18h", saturday: "10h - 16h", sunday: "Fermé", note: "Fermé les jours fériés." }
const PHOTOS = { title: "L'atelier", img1: "https://x.co/1.jpg", img1_alt: "Le tour à bois", img2: "https://x.co/2.jpg", columns: "3", columns_mobile: "2" }
const RESEAUX_C = { instagram: "atelier.nord", linkedin: "camille-nord", display: "list" }

describe("vague 16 - horaires : le modele", () => {
  it("un bloc sans plage ni exception ne donne rien", () => {
    expect(horaires({})).toBeNull()
    expect(horaires({ title: "Nos horaires", note: "Fermé les jours fériés." })).toBeNull()
    expect(horaires(null)).toBeNull()
  })
  it("une exception seule suffit : c'est une information a part entiere", () => {
    const h = horaires({ exception: "Fermé du 1er au 15 août" })!
    expect(h.lignes).toEqual([])
    expect(h.exception).toBe("Fermé du 1er au 15 août")
  })
  it("le mode simple ecrit les jours en toutes lettres", () => {
    // L'apercu abregeait « Lun — Ven » ; la page publiee ecrivait autre chose.
    expect(horaires(HORAIRES)!.lignes.map(l => l.label)).toEqual(["Lundi — Vendredi", "Samedi", "Dimanche"])
  })
  it("le mode simple masque les lignes non saisies", () => {
    expect(horaires({ mon_fri: "9h - 18h" })!.lignes.map(l => l.label)).toEqual(["Lundi — Vendredi"])
  })
  it("le mode jour par jour affiche les sept jours, la semaine commence lundi", () => {
    const h = horaires({ mon: "9h - 19h" })!
    expect(h.lignes.map(l => l.label)).toEqual(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"])
    // « Fermé » est le seul mot que le bloc ajoute, et seulement la ou l'absence
    // de plage EST l'information : en jour par jour, les sept lignes existent.
    expect(h.lignes[1].heures).toBe("Fermé")
  })
  it("le mode se deduit du contenu, pas seulement du reglage", () => {
    expect(modeJourParJour({ mode: "Jour par jour" })).toBe(true)
    expect(modeJourParJour({ wed: "9h - 19h" })).toBe(true)
    expect(modeJourParJour({ mon_fri: "9h - 18h" })).toBe(false)
    expect(modeJourParJour({ wed: "   " })).toBe(false)
  })
  it("le jour surligne : le groupe Lun-Ven couvre les cinq jours ouvres", () => {
    expect(estAujourdhui(3, 3)).toBe(true)
    expect(estAujourdhui(-1, 3)).toBe(true)
    expect(estAujourdhui(-1, 0)).toBe(false)      // dimanche
    expect(estAujourdhui(-1, 6)).toBe(false)      // samedi
    expect(estAujourdhui(3, -1)).toBe(false)      // heure encore inconnue
  })
  it("« fermé » se reconnait sous ses formes courantes", () => {
    for (const f of ["Fermé", "ferme", "CLOSED", "repos hebdomadaire"]) expect(estFerme(f), f).toBe(true)
    expect(estFerme("9h - 18h")).toBe(false)
  })
})

describe("vague 16 - horaires : la note n'est plus perdue en ligne", () => {
  it("une note accompagnee d'une seule exception est bien publiee", () => {
    // Un commercant ferme pour conges : exception saisie, plus aucune plage.
    // La page ne rendait la note que s'il restait au moins une ligne.
    const c = { exception: "Fermé du 1er au 15 août", note: "Reprise le 16 à 9 h." }
    const h = H(<PublicOpeningHours content={c} ctx={pCtx()} />)
    expect(h).toContain("Reprise le 16")
    expect(h).toContain("Fermé du 1er au 15 août")
  })
  it("et l'apercu montre exactement la meme chose", () => {
    const c = { exception: "Fermé du 1er au 15 août", note: "Reprise le 16 à 9 h." }
    const textes = (x: string) => x.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
    expect(textes(H(<EditorOpeningHours content={c} ctx={eCtx()} />))).toEqual(textes(H(<PublicOpeningHours content={c} ctx={pCtx()} />)))
  })
})

describe("vague 16 - galerie : le modele", () => {
  it("sans photo, aucun bloc", () => {
    expect(galerie({})).toBeNull()
    expect(galerie({ title: "L'atelier", columns: "3" })).toBeNull()
  })
  it("la legende suit SA photo, meme apres un trou", () => {
    // Filtrer les photos sans les legendes decalait toutes les descriptions.
    // Le cas qui revele le defaut : une photo SANS description precede une
    // photo qui en a une. Filtrer les deux listes separement donne au premier
    // cliche la description du second.
    const g = galerie({ img1: "a.jpg", img2: "b.jpg", img2_alt: "L'établi", img4: "d.jpg" })!
    expect(g.photos).toEqual([
      { src: "a.jpg", legende: "" },
      { src: "b.jpg", legende: "L'établi" },
      { src: "d.jpg", legende: "" },
    ])
  })
  it("« compact » impose au moins trois colonnes — c'est ce qui le rend compact", () => {
    expect(galerie({ img1: "a.jpg", layout: "compact", columns: "2" })!.colonnes).toBe(3)
    expect(galerie({ img1: "a.jpg", layout: "grid", columns: "2" })!.colonnes).toBe(2)
  })
  it("un reglage absurde retombe sur une valeur tenable", () => {
    expect(galerie({ img1: "a.jpg", columns: "zéro" })!.colonnes).toBe(3)
    expect(galerie({ img1: "a.jpg", columns: "0" })!.colonnes).toBe(3)
  })
  it("sizesGrille annonce la largeur reelle de la vignette", () => {
    expect(sizesGrille(2, 3)).toBe("(max-width: 520px) 50vw, 173px")
    expect(sizesGrille(1, 1)).toBe("(max-width: 520px) 100vw, 520px")
    expect(sizesGrille(0, 0)).toBe("(max-width: 520px) 100vw, 520px")   // jamais de division par zero
  })
})

describe("vague 16 - galerie : l'apercu ne retelecharge plus les originaux", () => {
  it("les deux cotes demandent une variante dimensionnee", () => {
    const c = { ...PHOTOS, img1: "https://abcdefgh.supabase.co/storage/v1/object/public/g/1.jpg" }
    for (const h of [H(<EditorGallery content={c} ctx={eCtx()} />), H(<PublicGallery content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("/_next/image")
      expect(h).toContain('sizes="(max-width: 520px) 50vw, 173px"')
    }
  })
  it("la description de la photo arrive dans l'apercu aussi", () => {
    // Elle est lue a voix haute et s'affiche si l'image ne charge pas :
    // l'auteur ne pouvait pas verifier ce qu'il avait ecrit.
    for (const h of [H(<EditorGallery content={PHOTOS} ctx={eCtx()} />), H(<PublicGallery content={PHOTOS} ctx={pCtx()} />)]) {
      expect(h).toContain('alt="Le tour à bois"')
    }
  })
  it("sans description, un texte de repli nomme la photo et son rang", () => {
    const h = H(<PublicGallery content={PHOTOS} ctx={pCtx()} />)
    expect(h).toContain("L&#x27;atelier — photo 2 sur 2")
  })
  it("la visionneuse reste publique : dans le canvas, cliquer selectionne le bloc", () => {
    expect(H(<EditorGallery content={PHOTOS} ctx={eCtx()} />)).not.toContain("zoom-in")
    expect(H(<PublicGallery content={PHOTOS} ctx={pCtx()} />)).toContain("zoom-in")
  })
})

describe("vague 16 - reseaux : le modele", () => {
  it("un reseau sans adresse n'existe pas", () => {
    expect(reseauxActifs({})).toEqual([])
    expect(reseauxActifs({ instagram: "   " })).toEqual([])
    expect(reseauxActifs({ display: "grid" })).toEqual([])
  })
  it("« website » garde sa place dans la liste, la meme des deux cotes", () => {
    // La page publiee redeclarait `website` EN TETE de sa table, alors que la
    // cle y etait deja en 74e position : le site du commercant sortait dernier
    // dans l'apercu et premier en ligne. Une seule table desormais.
    const cles = Object.keys(RESEAUX)
    expect(cles[0]).toBe("instagram")
    expect(cles.indexOf("website")).toBeGreaterThan(60)
    expect(reseauxActifs({ website: "https://atelier-nord.fr", instagram: "a" }).map(r => r.cle))
      .toEqual(["instagram", "website"])
  })
  it("le libelle personnalise remplace le nom du reseau", () => {
    const r = reseauxActifs({ instagram: "atelier.nord", instagram__label: "Nos coulisses", instagram__count: "2 400" })[0]
    expect(r.libelle).toBe("Nos coulisses")
    expect(r.compte).toBe("2 400")
  })
  it("un pseudo devient une vraie adresse", () => {
    expect(reseauxActifs({ instagram: "atelier.nord" })[0].href).toContain("instagram.com/atelier.nord")
    expect(reseauxActifs({ instagram: "https://instagram.com/x" })[0].href).toBe("https://instagram.com/x")
  })
  it("l'affichage est verrouille sur trois valeurs", () => {
    expect(affichageReseaux({ display: "icons" })).toBe("icons")
    expect(affichageReseaux({ display: "carrousel" })).toBe("list")
    expect(affichageReseaux({})).toBe("list")
  })
})

describe("vague 16 - reseaux : le libelle vaut aussi pour les icones", () => {
  it("l'affichage « icones » nomme chaque rond, des deux cotes", () => {
    // Une icone seule ne dit rien a un lecteur d'ecran ; l'apercu ignorait le
    // libelle personnalise et n'annoncait donc pas ce qui serait publie.
    const c = { instagram: "atelier.nord", instagram__label: "Nos coulisses", display: "icons" }
    for (const h of [H(<EditorSocialLinks content={c} ctx={eCtx()} />), H(<PublicSocialLinks content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("Nos coulisses")
    }
    expect(H(<PublicSocialLinks content={c} ctx={pCtx()} />)).toContain('aria-label="Nos coulisses"')
  })
})

describe("vague 16 - un bloc vide ne publie rien et n'invente rien", () => {
  for (const [type, Ed, Pub] of [
    ["opening_hours", EditorOpeningHours, PublicOpeningHours],
    ["gallery", EditorGallery, PublicGallery],
    ["social_links", EditorSocialLinks, PublicSocialLinks],
  ] as const) {
    it(type + " : public null ; l'editeur invite", () => {
      expect(Pub({ content: {}, ctx: pCtx() } as any)).toBeNull()
      const h = H(<Ed content={{}} ctx={eCtx()} />)
      expect(h).toContain('role="note"')
      expect(h).toContain("Invisible en ligne")
    })
  }

  it("gallery : les six cases « 🖼️ » factices ont disparu de l'apercu", () => {
    // Il dessinait une galerie de six photos sur un bloc que la page ne rend pas.
    const h = H(<EditorGallery content={{ title: "L'atelier" }} ctx={eCtx()} />)
    expect((h.match(/🖼️/g) ?? []).length).toBeLessThan(2)
  })
})

describe("vague 16 - l'apercu montre ce qui sera publie", () => {
  const textes = (h: string) => h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
  for (const [type, Ed, Pub, contenu] of [
    ["opening_hours", EditorOpeningHours, PublicOpeningHours, HORAIRES],
    ["opening_hours-jour", EditorOpeningHours, PublicOpeningHours, { mode: "Jour par jour", mon: "9h - 19h", exception: "Fermé le 15 août" }],
    ["gallery", EditorGallery, PublicGallery, PHOTOS],
    ["gallery-masonry", EditorGallery, PublicGallery, { ...PHOTOS, layout: "masonry" }],
    ["social_links", EditorSocialLinks, PublicSocialLinks, RESEAUX_C],
    ["social_links-grid", EditorSocialLinks, PublicSocialLinks, { ...RESEAUX_C, display: "grid", instagram__count: "2 400" }],
  ] as const) {
    it(type + " : memes textes des deux cotes", () => {
      expect(textes(H(<Ed content={contenu} ctx={eCtx()} />))).toEqual(textes(H(<Pub content={contenu} ctx={pCtx()} /> as any)))
    })
  }
})

describe("vague 16 - liens reels en ligne, coquilles inertes dans l'apercu", () => {
  it("les reseaux sont de vrais liens sur la page publiee", () => {
    const h = H(<PublicSocialLinks content={RESEAUX_C} ctx={pCtx()} />)
    expect(h).toContain('href="https://instagram.com/atelier.nord"')
    expect(h).toContain('rel="noopener noreferrer"')
  })
  it("et de simples coquilles dans l'apercu", () => {
    const h = H(<EditorSocialLinks content={RESEAUX_C} ctx={eCtx()} />)
    expect(h).not.toContain("href=")
    expect(h).toContain('aria-disabled="true"')
  })
})

describe("vague 16 - les surfaces suivent le theme", () => {
  it("le tableau des horaires reste visible sur un theme clair", () => {
    expect(H(<PublicOpeningHours content={HORAIRES} ctx={pCtx(clair)} />)).not.toMatch(/rgba\(255,255,255/)
    expect(H(<PublicOpeningHours content={HORAIRES} ctx={pCtx()} />)).toMatch(/rgba\(255,255,255/)
  })
})

describe("vague 16 - activation", () => {
  it("les trois blocs sont dans le drapeau de migration", () => {
    for (const t of ["opening_hours", "gallery", "social_links"]) expect(SHARED_RENDERER_BLOCKS.has(t)).toBe(true)
  })
})
