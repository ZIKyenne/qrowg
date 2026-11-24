import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { avisGoogle, photosCarrousel, avantApres, videosYoutube, galerieTiktok, temoignagesVideo, integration } from "./models/medias"
import { EditorGoogleReviewsBlock, PublicGoogleReviewsBlock } from "./blocks/google_reviews_block"
import { EditorImageCarousel, PublicImageCarousel } from "./blocks/image_carousel"
import { EditorMediaBeforeAfter, PublicMediaBeforeAfter } from "./blocks/media_before_after"
import { EditorYoutubeGallery, PublicYoutubeGallery } from "./blocks/youtube_gallery"
import { EditorTiktokGallery, PublicTiktokGallery } from "./blocks/tiktok_gallery"
import { EditorVideoTestimonials, PublicVideoTestimonials } from "./blocks/video_testimonials"
import { EditorEmbedBlock, PublicEmbedBlock } from "./blocks/embed_block"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import { hasPublishableContent } from "../blockEmptyState"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Rendu unique, lot 4 — les médias (24 nov.).
//
// Ce que les trois copies disaient de différent :
//   · l'aperçu des avis Google INVENTAIT « 5.0 » et cinq étoiles sur un bloc
//     qui n'avait qu'un titre ;
//   · l'aperçu de l'intégration posait son <iframe> SANS sandbox, sur
//     l'origine du tableau de bord où le commerçant est connecté ;
//   · l'avant/après réglé en curseur s'affichait en grille dans l'aperçu ;
//   · les galeries vidéo dessinaient leur bouton sans destination ;
//   · TikTok publiait un cadre vide quand seul le compte était rempli ;
//   · le détecteur du carrousel lisait cinquante photos, son rendu douze.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const eCtx = (): EditorRenderCtx =>
  ({ theme: sombre, primary: sombre.primary, text: sombre.text, muted: sombre.muted, accent: sombre.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (): PublicRenderCtx =>
  ({ theme: sombre, G: sombre.primary, TEXT: sombre.text, MUTED: sombre.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })
const H = (el: any) => renderToStaticMarkup(el)
const texte = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/&[#a-z0-9]+;/gi, " ").replace(/\s+/g, " ").trim()
const IMG = "https://exemple.supabase.co/storage/v1/object/public/page-assets/a.png"
const YT = "https://www.youtube.com/watch?v=abcDEF12345"

const PAIRES: [string, any, any][] = [
  ["google_reviews_block", EditorGoogleReviewsBlock, PublicGoogleReviewsBlock], ["image_carousel", EditorImageCarousel, PublicImageCarousel],
  ["media_before_after", EditorMediaBeforeAfter, PublicMediaBeforeAfter], ["youtube_gallery", EditorYoutubeGallery, PublicYoutubeGallery],
  ["tiktok_gallery", EditorTiktokGallery, PublicTiktokGallery], ["video_testimonials", EditorVideoTestimonials, PublicVideoTestimonials],
  ["embed_block", EditorEmbedBlock, PublicEmbedBlock],
]

describe("rendu unique, lot 4 — les sept sont servis par le renderer partagé", () => {
  it("activés, et sans copie dans les trois anciens rendus", () => {
    for (const [t] of PAIRES) expect(SHARED_RENDERER_BLOCKS.has(t), t).toBe(true)
    for (const f of ["../builderPreview.tsx", "../../templates/TemplatePreviewModal.tsx"]) {
      const src = readFileSync(join(__dirname, f), "utf8")
      for (const [t] of PAIRES) expect(src, `${f} : ${t}`).not.toContain(`case "${t}"`)
    }
  })
  it("à vide : l'éditeur le dit, la page se tait, le détecteur est d'accord", () => {
    for (const [t, E, P] of PAIRES) {
      expect(H(<P content={{}} ctx={pCtx()} />), t).toBe("")
      expect(H(<E content={{}} ctx={eCtx()} />), t).toContain("Invisible en ligne")
      expect(hasPublishableContent(t, {}), t).toBe(false)
    }
  })
})

describe("google_reviews_block", () => {
  it("aucune note inventée : un titre seul n'en fait pas apparaître", () => {
    const c = { title: "Ils nous recommandent", r1_name: "Marie", r1_text: "Parfait" }
    expect(avisGoogle(c)!.enTete).toEqual({ note: "", etoiles: [], titre: "Ils nous recommandent", total: "" })
    const e = H(<EditorGoogleReviewsBlock content={c} ctx={eCtx()} />)
    expect(texte(e), "l'aperçu écrivait « 5.0 »").not.toContain("5.0")
    expect(texte(e)).toBe(texte(H(<PublicGoogleReviewsBlock content={c} ctx={pCtx()} />)))
  })
  it("la note écrite s'affiche, avec ses étoiles", () => {
    const m = avisGoogle({ avg_rating: "4,6", total_reviews: "128" })!
    expect(m.enTete!.note).toBe("4,6")
    expect(m.enTete!.etoiles.map(f => Math.round(f * 10) / 10)).toEqual([1, 1, 1, 1, 0.6])
    expect(texte(H(<PublicGoogleReviewsBlock content={{ avg_rating: "4,6", total_reviews: "128" }} ctx={pCtx()} />))).toContain("128 avis")
  })
  it("le titre est un titre", () => {
    expect(H(<PublicGoogleReviewsBlock content={{ avg_rating: "4.8" }} ctx={pCtx()} />)).toMatch(/<h2[^>]*>Avis clients<\/h2>/)
  })
})

describe("image_carousel", () => {
  it("même lecture que la galerie : douze photos, la légende suit sa photo", () => {
    const c: Record<string, string> = { img2: IMG, img2_alt: "La terrasse", img13: IMG }
    const m = photosCarrousel(c)!
    expect(m.photos).toEqual([{ src: IMG, legende: "La terrasse" }])
    expect(hasPublishableContent("image_carousel", { img13: IMG }), "le détecteur lisait cinquante emplacements").toBe(false)
    expect(photosCarrousel({ img1: "javascript:alert(1)" }), "une adresse refusée n'est pas une photo").toBeNull()
  })
  it("l'aperçu montre le carrousel de la page, flèches comprises", () => {
    const c = { img1: IMG, img2: IMG }
    for (const h of [H(<EditorImageCarousel content={c} ctx={eCtx()} />), H(<PublicImageCarousel content={c} ctx={pCtx()} />)]) {
      expect(h).toContain('aria-label="Suivante"')
      expect(h.match(/aria-label="Photo \d"/g)?.length).toBe(2)
    }
  })
})

describe("media_before_after", () => {
  it("réglé en curseur, l'aperçu montre le curseur — pas la grille", () => {
    const c = { mode: "slider", before_img: IMG, after_img: IMG }
    for (const h of [H(<EditorMediaBeforeAfter content={c} ctx={eCtx()} />), H(<PublicMediaBeforeAfter content={c} ctx={pCtx()} />)])
      expect(h).toContain('role="slider"')
  })
  it("le curseur est atteignable au clavier et borné", () => {
    const h = H(<PublicMediaBeforeAfter content={{ mode: "slider", before_img: IMG, after_img: IMG }} ctx={pCtx()} />)
    expect(h).toContain('tabindex="0"')
    expect(h).toContain('aria-valuemin="0"')
    expect(h).toContain('aria-valuemax="100"')
  })
  it("une seule image : la grille, même réglée en curseur", () => {
    expect(avantApres({ mode: "slider", before_img: IMG })!.curseur).toBe(false)
  })
})

describe("youtube_gallery", () => {
  it("le bouton de la chaîne n'existe qu'avec une adresse — dans l'aperçu non plus", () => {
    const c = { video1_url: YT, cta_label: "Ma chaîne" }
    expect(videosYoutube(c)!.cta).toBeNull()
    expect(texte(H(<EditorYoutubeGallery content={c} ctx={eCtx()} />)), "l'aperçu le dessinait").not.toContain("Ma chaîne")
  })
  it("une vidéo à l'adresse refusée n'est pas une vidéo", () => {
    expect(videosYoutube({ video1_url: "javascript:alert(1)" })).toBeNull()
    expect(hasPublishableContent("youtube_gallery", { video1_url: "javascript:alert(1)" })).toBe(false)
  })
  it("la vignette vient de YouTube, la vidéo s'ouvre en ligne seulement", () => {
    const c = { video1_url: YT, video1_title: "Visite" }
    expect(H(<PublicYoutubeGallery content={c} ctx={pCtx()} />)).toContain(`href="${YT}"`)
    expect(H(<EditorYoutubeGallery content={c} ctx={eCtx()} />)).not.toContain("href=")
    expect(videosYoutube(c)!.videos[0].vignette).toBe("https://img.youtube.com/vi/abcDEF12345/mqdefault.jpg")
  })
})

describe("tiktok_gallery", () => {
  it("le compte seul publie un VRAI bouton, plus un cadre vide", () => {
    const c = { cta_url: "https://www.tiktok.com/@atelier" }
    expect(galerieTiktok(c)!.cta).toEqual({ label: "Voir sur TikTok", href: "https://www.tiktok.com/@atelier" })
    expect(H(<PublicTiktokGallery content={c} ctx={pCtx()} />)).toContain('href="https://www.tiktok.com/@atelier"')
  })
  it("au-delà de trois vidéos, rien ; chaque tuile a un nom", () => {
    expect(galerieTiktok({ video4_url: "https://tiktok.com/@a/video/4" })).toBeNull()
    const h = H(<PublicTiktokGallery content={{ username: "@atelier", video1_url: "https://tiktok.com/@a/video/1", video2_url: "https://tiktok.com/@a/video/2" }} ctx={pCtx()} />)
    expect(h).toContain('aria-label="@atelier — TikTok 2 sur 2"')
  })
})

describe("video_testimonials", () => {
  it("une carte avec vidéo s'ouvre en ligne ; sans vidéo, elle se lit", () => {
    const c = { t1_name: "Marie", t1_quote: "Merci !", t1_video_url: YT, t2_name: "Luc", t2_quote: "Top" }
    const m = temoignagesVideo(c)!
    expect(m.items.map(t => t.href)).toEqual([YT, null])
    const p = H(<PublicVideoTestimonials content={c} ctx={pCtx()} />)
    expect(p.match(/<a /g)?.length).toBe(1)
    expect(texte(H(<EditorVideoTestimonials content={c} ctx={eCtx()} />))).toBe(texte(p))
  })
})

describe("embed_block", () => {
  it("seuls les hôtes connus passent", () => {
    expect(integration({ url: "https://evil.example.com/x" })).toBeNull()
    expect(integration({ url: "http://docs.google.com/forms/x" }), "https seulement").toBeNull()
  })
  it("l'aperçu sandboxe l'iframe comme la page, et elle a un titre", () => {
    // docs.google.com figure dans EMBED_HOTES (lib/hotesDeCadre.mjs).
    const c = { url: "https://docs.google.com/forms/d/e/x/viewform", title: "Inscription" }
    expect(integration(c), "l'hôte est autorisé : sinon ce test ne vérifierait rien").not.toBeNull()
    for (const h of [H(<EditorEmbedBlock content={c} ctx={eCtx()} />), H(<PublicEmbedBlock content={c} ctx={pCtx()} />)]) {
      expect(h, "l'aperçu n'avait pas de sandbox").toContain('sandbox="allow-scripts allow-forms allow-popups allow-same-origin"')
      expect(h).toContain('title="Inscription"')
      expect(h).toMatch(/referrerPolicy="no-referrer"/i)
    }
  })
})
