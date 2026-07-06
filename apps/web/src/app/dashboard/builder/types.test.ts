import { describe, it, expect } from "vitest"
import {
  bannerImageStyle, bannerOverlayLayers, availabilityStatus, profileBadgeStyle,
  bannerTitleStyle, bannerFrame, bannerHeight, bannerBackgroundStyle,
  normalizePhoneDigits, waLink, telLink, directionsLink, ctaButtonStyle, stickyActionHref, embedVideoUrl,
  SOCIAL_NETWORKS, SOCIAL_NETWORKS_MAP, productBadgeStyle,
  parsePrice, priceDiscount,
} from "./types"

describe("bannerImageStyle", () => {
  it("défaut : cover / center / pas de zoom", () => {
    const s = bannerImageStyle({})
    expect(s.objectFit).toBe("cover")
    expect(s.objectPosition).toBe("center")
    expect(s.transform).toBeUndefined()
  })
  it("position précise + zoom", () => {
    const s = bannerImageStyle({ img_pos_x: "20", img_pos_y: "80", img_zoom: "2" })
    expect(s.objectPosition).toBe("20% 80%")
    expect(s.transform).toBe("scale(2)")
  })
  it("focus bas -> center bottom", () => {
    expect(bannerImageStyle({ img_focus: "bottom" }).objectPosition).toBe("center bottom")
  })
  it("filtres composés", () => {
    const f = bannerImageStyle({ img_brightness: "120", img_grayscale: "100", img_saturate: "0" }).filter as string
    expect(f).toContain("brightness(120%)")
    expect(f).toContain("grayscale(100%)")
    expect(f).toContain("saturate(0%)")
  })
  it("valeurs neutres -> pas de filter", () => {
    expect(bannerImageStyle({ img_brightness: "100" }).filter).toBeUndefined()
  })
})

describe("bannerOverlayLayers", () => {
  it("aucun overlay par défaut", () => {
    expect(bannerOverlayLayers({}, "#C9A84C")).toHaveLength(0)
  })
  it("verre -> backdropFilter", () => {
    const l = bannerOverlayLayers({ fx_overlay: "glass" }, "#C9A84C")
    expect(l).toHaveLength(1)
    expect(typeof l[0].style.backdropFilter).toBe("string")
  })
  it("aurora -> classe animée", () => {
    expect(bannerOverlayLayers({ fx_overlay: "aurora" }, "#C9A84C")[0].className).toBe("qfb-aurora-layer")
  })
  it("voile bas -> dégradé", () => {
    expect(String(bannerOverlayLayers({ overlay_gradient: "bottom" }, "#C9A84C")[0].style.background)).toContain("linear-gradient")
  })
  it("teinte + mode de fusion + opacité", () => {
    const l = bannerOverlayLayers({ overlay_color: "#ff0000", overlay_opacity: "0.5", blend_mode: "screen" }, "#C9A84C")
    expect(l[0].style.mixBlendMode).toBe("screen")
    expect(l[0].style.opacity).toBe(0.5)
  })
  it("teinte opacité 0 -> ignorée", () => {
    expect(bannerOverlayLayers({ overlay_color: "#ff0000", overlay_opacity: "0" }, "#C9A84C")).toHaveLength(0)
  })
})

describe("availabilityStatus", () => {
  it("statut connu : label + couleur + fond alpha", () => {
    const a = availabilityStatus("tour")
    expect(a.label).toBe("En tournée")
    expect(a.color).toBe("#9146FF")
    expect(a.bg).toBe("#9146FF14")
  })
  it("couleur de pastille personnalisée valide", () => {
    expect(availabilityStatus("available", "#123456").color).toBe("#123456")
  })
  it("statut inconnu -> fallback Disponible", () => {
    expect(availabilityStatus("inconnu_xyz").label).toBe("Disponible")
  })
  it("couleur invalide -> couleur du statut", () => {
    expect(availabilityStatus("available", "pasunehex").color).toBe("#39FF8F")
  })
})

describe("profileBadgeStyle", () => {
  it("Vérifié -> bleu + ✓", () => {
    const b = profileBadgeStyle("Vérifié", "#C9A84C")
    expect(b.color).toBe("#38BDF8")
    expect(b.icon).toBe("✓")
  })
  it("Premium -> or + 👑", () => {
    expect(profileBadgeStyle("Premium", "#C9A84C").icon).toBe("👑")
  })
  it("inconnu -> accent, pas d'icône", () => {
    const b = profileBadgeStyle("MonTrucPerso", "#C9A84C")
    expect(b.color).toBe("#C9A84C")
    expect(b.icon).toBe("")
  })
  it("libellé commençant par emoji -> pas de double icône", () => {
    expect(profileBadgeStyle("🔥 Populaire", "#C9A84C").icon).toBe("")
  })
})

describe("bannerTitleStyle", () => {
  it("défaut public 24/700", () => {
    const t = bannerTitleStyle({}, "public", "#fff", "Serif")
    expect(t.fontSize).toBe(24)
    expect(t.fontWeight).toBe(700)
    expect(t.fontFamily).toBe("Serif")
  })
  it("taille/graisse/glow/majuscules", () => {
    const t = bannerTitleStyle({ title_size: "32", title_weight: "800", title_effect: "glow", title_transform: "uppercase" }, "public", "#39FF8F", "Serif")
    expect(t.fontSize).toBe(32)
    expect(t.fontWeight).toBe(800)
    expect(String(t.textShadow)).toContain("#39FF8F")
    expect(t.textTransform).toBe("uppercase")
  })
  it("police mono", () => {
    expect(String(bannerTitleStyle({ title_font: "mono" }, "editor", "#fff", "Serif").fontFamily)).toContain("monospace")
  })
})

describe("bannerFrame", () => {
  it("ombre glow -> boxShadow accent", () => {
    const f = bannerFrame({ block_shadow: "glow" }, "#C9A84C", 12)
    expect(String(f.boxShadow)).toContain("#C9A84C")
  })
  it("bordure dégradée -> calque + rayon", () => {
    const f = bannerFrame({ block_border: "gradient", border_color: "#ff0000" }, "#C9A84C", 16)
    expect(f.borderLayer).toBeTruthy()
    expect(String(f.borderLayer!.style.background)).toContain("#ff0000")
    expect(f.borderLayer!.style.borderRadius).toBe(16)
  })
  it("aucun effet -> pas d'ombre", () => {
    expect(bannerFrame({}, "#C9A84C", 0).boxShadow).toBeUndefined()
  })
})

describe("bannerHeight", () => {
  it("xl public = 340", () => expect(bannerHeight({ height: "xl" }, "public")).toBe(340))
  it("hauteur px prioritaire", () => expect(bannerHeight({ height_px: "200" }, "public")).toBe(200))
  it("md éditeur = 100", () => expect(bannerHeight({}, "editor")).toBe(100))
})

describe("normalizePhoneDigits", () => {
  it("nettoie les espaces/ponctuation", () => {
    expect(normalizePhoneDigits("06 12 34 56 78")).toBe("0612345678")
  })
  it("indicatif ajouté + 0 national retiré", () => {
    expect(normalizePhoneDigits("06 12 34 56 78", "33")).toBe("33612345678")
  })
  it("numéro déjà international (+) respecté", () => {
    expect(normalizePhoneDigits("+33 6 12 34 56 78", "33")).toBe("33612345678")
  })
  it("n'ajoute pas deux fois l'indicatif", () => {
    expect(normalizePhoneDigits("33612345678", "33")).toBe("33612345678")
  })
  it("vide -> vide", () => {
    expect(normalizePhoneDigits("", "33")).toBe("")
  })
})

describe("waLink / telLink", () => {
  it("waLink construit wa.me + message encodé", () => {
    const l = waLink("0612345678", "Bonjour !", "33")
    expect(l).toBe("https://wa.me/33612345678?text=Bonjour%20!")
  })
  it("waLink sans numéro -> vide", () => {
    expect(waLink("", "x")).toBe("")
  })
  it("telLink garde le + international", () => {
    expect(telLink("+33 6 12 34 56 78")).toBe("tel:+33612345678")
  })
  it("telLink national", () => {
    expect(telLink("06 12 34 56 78")).toBe("tel:0612345678")
  })
  it("telLink vide -> vide", () => {
    expect(telLink("")).toBe("")
  })
})

describe("embedVideoUrl", () => {
  it("YouTube watch -> embed", () => {
    expect(embedVideoUrl("https://youtube.com/watch?v=abc123&t=10")).toBe("https://www.youtube.com/embed/abc123")
  })
  it("youtu.be court -> embed", () => {
    expect(embedVideoUrl("https://youtu.be/xyz789")).toBe("https://www.youtube.com/embed/xyz789")
  })
  it("YouTube Shorts -> embed", () => {
    expect(embedVideoUrl("https://www.youtube.com/shorts/short01")).toBe("https://www.youtube.com/embed/short01")
  })
  it("Vimeo -> player", () => {
    expect(embedVideoUrl("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789")
  })
  it("lien inconnu -> tel quel", () => {
    expect(embedVideoUrl("https://exemple.com/video")).toBe("https://exemple.com/video")
  })
  it("vide -> vide", () => {
    expect(embedVideoUrl("")).toBe("")
  })
})

describe("directionsLink", () => {
  it("google/auto par défaut", () => {
    expect(directionsLink("12 rue de la Paix, Paris")).toBe("https://www.google.com/maps/dir/?api=1&destination=12%20rue%20de%20la%20Paix%2C%20Paris")
  })
  it("apple plans", () => {
    expect(directionsLink("Paris", "apple")).toBe("https://maps.apple.com/?daddr=Paris")
  })
  it("waze", () => {
    expect(directionsLink("Paris", "waze")).toBe("https://waze.com/ul?q=Paris&navigate=yes")
  })
  it("adresse vide -> vide", () => {
    expect(directionsLink("")).toBe("")
  })
})

describe("ctaButtonStyle", () => {
  const opt = { G: "#C9A84C", accent: "#39FF8F", text: "#F5F0E8" }
  it("gold : ombre dorée, pas de classe", () => {
    const r = ctaButtonStyle("gold", opt)
    expect(String(r.style.boxShadow)).toContain("#C9A84C")
    expect(r.className).toBeUndefined()
  })
  it("gradient : classe animée", () => {
    expect(ctaButtonStyle("gradient", opt).className).toBe("qcta-flow")
  })
  it("glass : backdropFilter", () => {
    expect(String(ctaButtonStyle("glass", opt).style.backdropFilter)).toContain("blur")
  })
  it("luxe : bordure or", () => {
    expect(String(ctaButtonStyle("luxe", opt).style.border)).toContain("#C9A84C")
  })
  it("style inconnu -> gold", () => {
    expect(ctaButtonStyle("inconnu", opt).style.color).toBe("#080808")
  })
})

describe("stickyActionHref", () => {
  it("call -> tel", () => {
    const a = stickyActionHref("call", "0612345678")
    expect(a.href).toBe("tel:0612345678")
    expect(a.icon).toBe("📞")
  })
  it("directions -> google maps", () => {
    expect(stickyActionHref("directions", "Paris").href).toContain("google.com/maps/dir")
  })
  it("email -> mailto", () => {
    expect(stickyActionHref("email", "a@b.com").href).toBe("mailto:a@b.com")
  })
  it("share -> flag share, pas de href", () => {
    const a = stickyActionHref("share")
    expect(a.share).toBe(true)
    expect(a.href).toBeUndefined()
  })
  it("none -> icône vide", () => {
    expect(stickyActionHref("none").icon).toBe("")
  })
})

describe("SOCIAL_NETWORKS_MAP (parité éditeur <-> public)", () => {
  it("contient une entrée pour chaque réseau de l'éditeur", () => {
    for (const n of SOCIAL_NETWORKS) {
      expect(SOCIAL_NETWORKS_MAP[n.key]).toBeTruthy()
      expect(SOCIAL_NETWORKS_MAP[n.key].label).toBe(n.label)
      expect(SOCIAL_NETWORKS_MAP[n.key].color).toBe(n.color)
    }
  })
  it("couvre 30+ réseaux (bibliothèque riche)", () => {
    expect(Object.keys(SOCIAL_NETWORKS_MAP).length).toBeGreaterThan(30)
  })
  it("inclut les réseaux clés", () => {
    for (const k of ["instagram", "tiktok", "youtube", "spotify", "deezer", "twitch", "threads", "linkedin", "discord", "behance"]) {
      expect(SOCIAL_NETWORKS_MAP[k]).toBeTruthy()
    }
  })
})

describe("productBadgeStyle", () => {
  it("Promo -> rouge + icône", () => {
    const b = productBadgeStyle("Promo -30%", "#C9A84C")
    expect(b.color).toBe("#EF4444")
    expect(b.icon).toBe("🏷️")
    expect(b.fg).toBe("#fff")
  })
  it("Nouveau -> vert", () => {
    expect(productBadgeStyle("Nouveau", "#C9A84C").color).toBe("#39FF8F")
  })
  it("Épuisé -> gris + texte clair", () => {
    const b = productBadgeStyle("Épuisé", "#C9A84C")
    expect(b.color).toBe("#8A8478")
    expect(b.fg).toBe("#fff")
  })
  it("inconnu -> accent, pas d'icône", () => {
    const b = productBadgeStyle("MonBadge", "#C9A84C")
    expect(b.color).toBe("#C9A84C")
    expect(b.icon).toBe("")
  })
  it("libellé avec emoji -> pas de double icône", () => {
    expect(productBadgeStyle("⭐ Signature", "#C9A84C").icon).toBe("")
  })
})

describe("bannerBackgroundStyle", () => {
  it("dégradé nommé", () => {
    expect(String(bannerBackgroundStyle({ banner_type: "gradient", grad_preset: "or_nuit" }, "#C9A84C").background)).toContain("linear-gradient")
  })
  it("couleur unie", () => {
    expect(bannerBackgroundStyle({ banner_type: "color", bg_color: "#111" }, "#C9A84C").background).toBe("#111")
  })
  it("image -> style vide (géré par <img>)", () => {
    expect(Object.keys(bannerBackgroundStyle({ banner_type: "image", src: "x" }, "#C9A84C"))).toHaveLength(0)
  })
})

describe("parsePrice", () => {
  it("vide / gratuit / sur devis -> null", () => {
    expect(parsePrice("")).toBeNull()
    expect(parsePrice(undefined)).toBeNull()
    expect(parsePrice("Gratuit")).toBeNull()
    expect(parsePrice("Sur devis")).toBeNull()
  })
  it("entiers avec devise variée", () => {
    expect(parsePrice("29€")).toBe(29)
    expect(parsePrice("$29")).toBe(29)
    expect(parsePrice("29 USD")).toBe(29)
    expect(parsePrice("£19")).toBe(19)
  })
  it("décimale virgule ou point", () => {
    expect(parsePrice("29,90 €")).toBeCloseTo(29.9)
    expect(parsePrice("29.90€")).toBeCloseTo(29.9)
    expect(parsePrice("9,5")).toBeCloseTo(9.5)
  })
  it("séparateur de milliers (3 chiffres) traité comme entier", () => {
    expect(parsePrice("1,299€")).toBe(1299)
    expect(parsePrice("1.299 €")).toBe(1299)
    expect(parsePrice("1 299,00 €")).toBeCloseTo(1299)
  })
  it("texte non numérique -> null", () => {
    expect(parsePrice("abc")).toBeNull()
  })
})

describe("priceDiscount", () => {
  it("ancien prix supérieur -> pourcentage arrondi", () => {
    const d = priceDiscount("29€", "59€")
    expect(d).not.toBeNull()
    expect(d!.percent).toBe(51)
    expect(d!.label).toBe("-51%")
  })
  it("économie formatée avec devise reprise de l'ancien prix", () => {
    const d = priceDiscount("40€", "50€")
    expect(d!.percent).toBe(20)
    expect(d!.saved).toBe("10€")
  })
  it("pas de réduction si ancien <= prix", () => {
    expect(priceDiscount("59€", "29€")).toBeNull()
    expect(priceDiscount("29€", "29€")).toBeNull()
  })
  it("null si prix non numérique ou ancien absent", () => {
    expect(priceDiscount("29€", undefined)).toBeNull()
    expect(priceDiscount("Sur devis", "59€")).toBeNull()
    expect(priceDiscount("29€", "Gratuit")).toBeNull()
  })
  it("décimales : 29,90 vs 59,90 ~ -50%", () => {
    const d = priceDiscount("29,90€", "59,90€")
    expect(d!.percent).toBe(50)
  })
})
