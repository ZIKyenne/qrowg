import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { profil, initialeProfil, texteLibre, TAILLE_MINIMALE } from "./models/profilEtTexte"
import { EditorProfile, PublicProfile } from "./blocks/profile"
import { EditorRichText, PublicRichText } from "./blocks/rich_text"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Vague 15 — `profile`, le bloc le plus posé de toutes les pages, et `rich_text`.
// Trois écarts trouvés en migrant :
//   • l'aperçu dessinait le cadre du profil ET ses deux champs vides sur un bloc
//     entièrement vide, alors que la page publiée masque le bloc ;
//   • l'avatar de l'aperçu était un <img> brut : l'auteur téléchargeait sa photo
//     en pleine taille pour une vignette de 96 px, à chaque ouverture ;
//   • `rich_text` affichait « petit » à 11 px dans l'aperçu, sous le plancher de
//     lisibilité de 12 px du dépôt — donc plus dense que ce qui serait publié.
//
// `profile` porte aussi le <h1> de la page. Le contexte partagé ne transportait
// pas cette information : il fallait l'ajouter (`titrePrincipal`), sans quoi la
// migration aurait fait perdre le titre de niveau 1 — et le référencement avec.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }

const ecrits: Array<[string, string]> = []
// Comme en vague 14 : InlineEditable pose son texte par ref après le montage,
// donc un champ éditable sort VIDE en rendu statique. La comparaison de contenu
// se fait sur le mini-aperçu (canEdit: false) ; l'édition a son propre test.
const eCtx = (canEdit = false): EditorRenderCtx =>
  ({ theme: sombre, primary: sombre.primary, text: sombre.text, muted: sombre.muted, accent: sombre.accent, surfaceStyle: {}, canEdit, edit: (k: string) => (v: string) => { ecrits.push([k, v]) } })
const pCtx = (titrePrincipal = false): PublicRenderCtx =>
  ({ theme: sombre, G: sombre.primary, TEXT: sombre.text, MUTED: sombre.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {}, titrePrincipal })

const H = (el: any) => renderToStaticMarkup(el)
const PROFIL = { name: "Camille Nord", tagline: "Ébéniste à Reims", badge: "Certifié, Local" }
const TEXTE = { text: "Notre atelier ouvre à 8 h.\nEt ferme à 19 h.", size: "small", align: "center" }

describe("vague 15 - modeles purs", () => {
  it("profil : un bloc entierement vide ne donne rien", () => {
    expect(profil({})).toBeNull()
    expect(profil(null)).toBeNull()
    expect(profil({ name: "  ", tagline: " " })).toBeNull()
    // Un reglage de forme ou d'ombre n'est pas du contenu : il ne suffit pas.
    expect(profil({ avatar_shape: "hexagone", avatar_border: "or" })).toBeNull()
  })
  it("profil : chaque champ rempli suffit a montrer le bloc", () => {
    expect(profil({ name: "Camille" })).not.toBeNull()
    expect(profil({ tagline: "Ébéniste" })).not.toBeNull()
    expect(profil({ avatar: "https://x.co/a.jpg" })).not.toBeNull()
    expect(profil({ badge: "Certifié" })).not.toBeNull()
  })
  it("profil : l'avatar suit la photo, le nom, et le reglage « Masquer »", () => {
    expect(profil({ name: "Camille" })!.montrerAvatar).toBe(true)
    expect(profil({ avatar: "https://x.co/a.jpg" })!.montrerAvatar).toBe(true)
    expect(profil({ name: "Camille", hide_avatar: "Masquer" })!.montrerAvatar).toBe(false)
    expect(profil({ tagline: "Ébéniste" })!.montrerAvatar).toBe(false)
  })
  it("profil : les badges se decoupent, se nettoient et s'arretent a cinq", () => {
    expect(profil({ badge: "Certifié, Local\nPro,  , " })!.badges).toEqual(["Certifié", "Local", "Pro"])
    expect(profil({ badge: "a,b,c,d,e,f,g" })!.badges).toHaveLength(5)
    // Un champ badge qui ne contient que des separateurs ne montre rien.
    expect(profil({ badge: " , , " })).toBeNull()
  })
  it("initialeProfil : la premiere lettre, en capitale, sinon « ? »", () => {
    expect(initialeProfil("camille")).toBe("C")
    expect(initialeProfil("élodie")).toBe("É")
    expect(initialeProfil("")).toBe("?")
  })
  it("texteLibre : sans texte, aucun bloc ; l'alignement est verrouille", () => {
    expect(texteLibre({})).toBeNull()
    expect(texteLibre({ text: "   ", align: "center" })).toBeNull()
    expect(texteLibre({ text: "Bonjour" })!.align).toBe("left")
    expect(texteLibre({ text: "Bonjour", align: "center" })!.align).toBe("center")
    expect(texteLibre({ text: "Bonjour", align: "justify" })!.align).toBe("left")
  })
  it("texteLibre : les trois tailles restent au-dessus du plancher de lisibilite", () => {
    const t = (size?: string) => texteLibre({ text: "x", size })!.taille
    expect(t("small")).toBe(13)          // valait 11 px dans l'apercu
    expect(t("normal")).toBe(14)
    expect(t("large")).toBe(16)
    expect(t("inconnue")).toBe(14)       // repli sur la taille normale
    for (const s of ["small", "normal", "large", undefined]) {
      expect(t(s), `taille « ${s} »`).toBeGreaterThanOrEqual(TAILLE_MINIMALE)
    }
  })
})

describe("vague 15 - un bloc vide ne publie rien et n'invente personne", () => {
  for (const [type, Ed, Pub] of [["profile", EditorProfile, PublicProfile], ["rich_text", EditorRichText, PublicRichText]] as const) {
    it(type + " : public null ; l'editeur invite", () => {
      expect(Pub({ content: {}, ctx: pCtx() } as any)).toBeNull()
      const h = H(<Ed content={{}} ctx={eCtx()} />)
      expect(h).toContain('role="note"')
      expect(h).toContain("Invisible en ligne")
    })
  }

  it("profile : l'apercu ne dessine plus le cadre vide", () => {
    // Il montrait l'avatar, le nom et l'accroche a blanc — un bloc que le
    // visiteur ne verrait jamais, presente comme s'il existait.
    const h = H(<EditorProfile content={{}} ctx={eCtx(true)} />)
    expect(h).not.toContain("contenteditable")
  })
})

describe("vague 15 - l'apercu montre ce qui sera publie", () => {
  const textes = (h: string) => h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
  for (const [type, Ed, Pub, contenu] of [
    ["profile", EditorProfile, PublicProfile, PROFIL],
    ["profile-sans-photo", EditorProfile, PublicProfile, { name: "Camille Nord" }],
    ["profile-avatar-masque", EditorProfile, PublicProfile, { ...PROFIL, hide_avatar: "Masquer" }],
    ["rich_text", EditorRichText, PublicRichText, TEXTE],
  ] as const) {
    it(type + " : memes textes des deux cotes", () => {
      expect(textes(H(<Ed content={contenu} ctx={eCtx()} />))).toEqual(textes(H(<Pub content={contenu} ctx={pCtx()} /> as any)))
    })
  }

  it("l'avatar sans photo montre l'initiale des deux cotes", () => {
    for (const h of [H(<EditorProfile content={{ name: "Camille Nord" }} ctx={eCtx()} />), H(<PublicProfile content={{ name: "Camille Nord" }} ctx={pCtx()} />)]) {
      expect(h).toContain(">C<")
    }
  })

  it("l'apercu passe par le meme chemin d'image que la page publiee", () => {
    // Il rendait un <img src={c.avatar}> brut : pour une photo televersee, le
    // telephone de l'auteur telechargeait l'original a chaque ouverture du
    // canvas. Les deux cotes passent desormais par SmartImage, qui demande une
    // variante redimensionnee quand l'hote est le notre.
    const c = { ...PROFIL, avatar: "https://abcdefgh.supabase.co/storage/v1/object/public/avatars/photo.jpg" }
    const ed = H(<EditorProfile content={c} ctx={eCtx()} />)
    for (const h of [ed, H(<PublicProfile content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("/_next/image")          // variante servie, pas l'original
      expect(h).toMatch(/srcSet=/i)
    }
    expect(ed).toContain('sizes="96px"')           // et la largeur reelle est annoncee
  })

  it("rich_text : les trois tailles gardent le meme rapport des deux cotes", () => {
    const px = (h: string) => Number(/font-size:(\d+(?:\.\d+)?)px;line-height/.exec(h)![1])
    const tailles = (rendu: (size: string) => string) => ["small", "normal", "large"].map(s => px(rendu(s)))
    const pub = tailles(size => H(<PublicRichText content={{ ...TEXTE, size }} ctx={pCtx()} />))
    const ed = tailles(size => H(<EditorRichText content={{ ...TEXTE, size }} ctx={eCtx()} />))
    expect(pub, "les tailles de reference sont celles de la page publiee").toEqual([13, 14, 16])
    // L'apercu est une maquette a 0,86 : les memes valeurs, reduites d'un SEUL
    // facteur. Il avait auparavant sa propre echelle, {11, 13, 15} : « petit »
    // y paraissait 15 % plus petit que « normal » alors qu'en ligne l'ecart
    // n'est que de 7 %. Le commercant reglait donc sur une fausse comparaison.
    expect(ed).toEqual([11, 12, 14])
    for (let i = 0; i < 3; i++) expect(ed[i] / pub[i]).toBeCloseTo(0.86, 1)
  })

  it("rich_text : l'alignement et les retours a la ligne sont conserves", () => {
    const h = H(<PublicRichText content={TEXTE} ctx={pCtx()} />)
    expect(h).toContain("text-align:center")
    expect(h).toContain("white-space:pre-wrap")
  })
})

describe("vague 15 - le titre de niveau 1 de la page", () => {
  it("le bloc designe porte un <h1> sur la page publiee", () => {
    const h = H(<PublicProfile content={PROFIL} ctx={pCtx(true)} />)
    expect(h).toContain("<h1")
    expect(h).toContain("Camille Nord")
  })
  it("un autre bloc profil de la meme page n'en porte pas un deuxieme", () => {
    const h = H(<PublicProfile content={PROFIL} ctx={pCtx(false)} />)
    expect(h).not.toContain("<h1")
    expect(h).toContain("Camille Nord")
  })
  it("l'apercu de l'editeur n'emet jamais de <h1> — ce n'est pas une page", () => {
    expect(H(<EditorProfile content={PROFIL} ctx={eCtx()} />)).not.toContain("<h1")
  })
  it("sans nom, pas de titre du tout : on n'invente pas d'intitule", () => {
    expect(H(<PublicProfile content={{ tagline: "Ébéniste" }} ctx={pCtx(true)} />)).not.toContain("<h1")
  })
})

describe("vague 15 - l'edition en ligne survit a la migration", () => {
  it("l'apercu rend le nom, l'accroche et le texte libre editables", () => {
    const p = H(<EditorProfile content={PROFIL} ctx={eCtx(true)} />)
    expect((p.match(/contenteditable/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(H(<EditorRichText content={TEXTE} ctx={eCtx(true)} />)).toContain("contenteditable")
  })
  it("hors edition, l'apercu rend du texte ordinaire", () => {
    expect(H(<EditorProfile content={PROFIL} ctx={eCtx(false)} />)).not.toContain("contenteditable")
  })
  it("la page publiee ne rend rien d'editable", () => {
    for (const h of [H(<PublicProfile content={PROFIL} ctx={pCtx(true)} />), H(<PublicRichText content={TEXTE} ctx={pCtx()} />)]) {
      expect(h).not.toContain("contenteditable")
    }
  })
})

describe("vague 15 - activation", () => {
  it("les deux blocs sont dans le drapeau de migration", () => {
    for (const t of ["profile", "rich_text"]) expect(SHARED_RENDERER_BLOCKS.has(t)).toBe(true)
  })
})
